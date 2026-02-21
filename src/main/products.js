// Products IPC handlers: add product
const path = require('path');
const { ipcMain, app } = require('electron');
const { getPool, DB_NAME } = require('../db/connection');
const { isSecondaryDevice, fetchFromAPI } = require('./api-client');
const translate = require('translate-google');

function getResourcePath(relativePath) {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, relativePath);
  }
  return path.join(__dirname, '..', '..', relativePath);
}

function registerProductsIPC(){
  // ensure table exists once
  let __tableEnsured = false;
  async function ensureTable(conn){
    if(__tableEnsured) return;
    await conn.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        name_en VARCHAR(255) NULL,
        barcode VARCHAR(64) UNIQUE NULL,
        price DECIMAL(10,2) NOT NULL DEFAULT 0,
        cost DECIMAL(10,2) NOT NULL DEFAULT 0,
        stock INT NOT NULL DEFAULT 0,
        category VARCHAR(128) NULL,
        description TEXT NULL,
        image_path VARCHAR(512) NULL,
        is_tobacco TINYINT NOT NULL DEFAULT 0,
        is_active TINYINT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    // ترقيات جداول قديمة: إضافة أعمدة مفقودة إن لزم
    const [colNameEn] = await conn.query("SHOW COLUMNS FROM products LIKE 'name_en'");
    if (!colNameEn.length) {
      await conn.query("ALTER TABLE products ADD COLUMN name_en VARCHAR(255) NULL AFTER name");
    }
    const [colImg] = await conn.query("SHOW COLUMNS FROM products LIKE 'image_path'");
    if (!colImg.length) {
      await conn.query("ALTER TABLE products ADD COLUMN image_path VARCHAR(512) NULL AFTER description");
    }
    // New image BLOB storage (for packaged builds)
    const [colImgBlob] = await conn.query("SHOW COLUMNS FROM products LIKE 'image_blob'");
    if (!colImgBlob.length) {
      await conn.query("ALTER TABLE products ADD COLUMN image_blob LONGBLOB NULL AFTER image_path");
    }
    const [colImgMime] = await conn.query("SHOW COLUMNS FROM products LIKE 'image_mime'");
    if (!colImgMime.length) {
      await conn.query("ALTER TABLE products ADD COLUMN image_mime VARCHAR(64) NULL AFTER image_blob");
    }
    const [colActive] = await conn.query("SHOW COLUMNS FROM products LIKE 'is_active'");
    if (!colActive.length) {
      await conn.query("ALTER TABLE products ADD COLUMN is_active TINYINT NOT NULL DEFAULT 1 AFTER description");
    }
    const [colTobacco] = await conn.query("SHOW COLUMNS FROM products LIKE 'is_tobacco'");
    if (!colTobacco.length) {
      await conn.query("ALTER TABLE products ADD COLUMN is_tobacco TINYINT NOT NULL DEFAULT 0 AFTER image_path");
    }
    const [colSortOrder] = await conn.query("SHOW COLUMNS FROM products LIKE 'sort_order'");
    if (!colSortOrder.length) {
      await conn.query("ALTER TABLE products ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER name_en");
    }

    // Indexes to speed up catalog on remote connections
    try{ await conn.query("CREATE INDEX idx_products_active ON products (is_active)"); }catch(_){ }
    try{ await conn.query("CREATE INDEX idx_products_category ON products (category)"); }catch(_){ }
    try{ await conn.query("CREATE INDEX idx_products_sort ON products (sort_order, name)"); }catch(_){ }
    
    __tableEnsured = true;
  }

  ipcMain.handle('products:add', async (_evt, payload) => {
    const { name, name_en, barcode, price, stock, category, description } = payload || {};
    if(!name) return { ok:false, error:'اسم المنتج مطلوب' };
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTable(conn);
        // ضع العنصر الجديد في آخر الترتيب
        const [maxRow] = await conn.query('SELECT MAX(sort_order) AS m FROM products');
        const nextOrder = (Array.isArray(maxRow) && maxRow.length && maxRow[0].m != null) ? (Number(maxRow[0].m)||0)+1 : 0;
        const imgMime = payload?.image_mime || null;
        const imgBase64 = payload?.image_blob_base64 || null;
        const imgBuffer = (imgBase64 && typeof imgBase64 === 'string') ? Buffer.from(imgBase64, 'base64') : null;
        await conn.query(
          'INSERT INTO products (name, name_en, barcode, price, stock, category, description, image_path, image_blob, image_mime, is_tobacco, sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
          [name, payload.name_en || null, barcode, price ?? 0, stock ?? 0, category, description, payload.image_path || null, imgBuffer, imgMime, payload.is_tobacco ? 1 : 0, nextOrder]
        );
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){
      if (e && e.code === 'ER_DUP_ENTRY') return { ok:false, error:'الباركود موجود مسبقاً' };
      console.error(e); return { ok:false, error:'فشل حفظ المنتج' };
    }
  });

  // list (exclude image_blob from rows to keep payload small)
  ipcMain.handle('products:list', async (_e, q) => {
    if (isSecondaryDevice()) {
      return await fetchFromAPI('/products', q || {});
    }

    const query = q || {};
    const where = [];
    const params = [];
    if(query.q){ 
      const keyword = `%${query.q.trim()}%`;
      where.push('(name LIKE ? OR name_en LIKE ? OR barcode LIKE ?)'); 
      params.push(keyword, keyword, keyword); 
    }
    if(query.active==="1" || query.active==="0"){ where.push('is_active=?'); params.push(Number(query.active)); }
    if(query.category){ where.push('category = ?'); params.push(query.category); }
    if(query.exclude_no_category==="1"){ where.push('category IS NOT NULL AND category != ""'); }

    let order = 'ORDER BY id DESC';
    if(query.sort === 'custom') order = 'ORDER BY sort_order ASC, is_active DESC, name ASC';
    if(query.sort === 'name_asc') order = 'ORDER BY name ASC';
    if(query.sort === 'price_asc') order = 'ORDER BY price ASC';
    if(query.sort === 'price_desc') order = 'ORDER BY price DESC';
    if(query.sort === 'stock_desc') order = 'ORDER BY stock DESC';

    const whereSql = where.length ? ('WHERE ' + where.join(' AND ')) : '';

    // Optional pagination
    const limit = Number(query.limit || 0);
    const offset = Number(query.offset || 0);

    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTable(conn);
        
        const [[{ total }]] = await conn.query(`SELECT COUNT(*) as total FROM products ${whereSql}`, params);
        
        let sql = `SELECT id,name,name_en,barcode,price,stock,category,description,image_path,image_mime,is_tobacco,is_active,sort_order,created_at FROM products ${whereSql} ${order}`;
        const queryParams = [...params];
        if(limit > 0){ 
          sql += ' LIMIT ? OFFSET ?'; 
          queryParams.push(limit, Math.max(0, offset)); 
        }
        const [rows] = await conn.query(sql, queryParams);
        return { ok:true, items: rows, count: rows.length, total: Number(total) };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'خطأ في تحميل المنتجات' }; }
  });

  // get (without image_blob for list/detail to keep payload light)
  ipcMain.handle('products:get', async (_e, id) => {
    const pid = (id && id.id) ? id.id : id;
    if(!pid) return { ok:false, error:'معرّف مفقود' };
    
    if (isSecondaryDevice()) {
      return await fetchFromAPI(`/products/${pid}`);
    }

    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        const [rows] = await conn.query('SELECT id,name,name_en,barcode,price,stock,category,description,image_path,image_mime,is_tobacco,is_active,sort_order,created_at FROM products WHERE id=? LIMIT 1', [pid]);
        if(rows.length===0) return { ok:false, error:'غير موجود' };
        return { ok:true, item: rows[0] };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'خطأ في الجلب' }; }
  });

  // get batch of products by IDs (for stock checking, etc.)
  ipcMain.handle('products:get_batch', async (_e, ids) => {
    const list = Array.isArray(ids) ? ids.map(Number).filter(n => !isNaN(n)) : [];
    if(!list.length) return { ok:true, items:{} };
    
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        const placeholders = list.map(()=>'?').join(',');
        const [rows] = await conn.query(`SELECT id,name,name_en,barcode,price,stock,category,description,image_path,image_mime,is_tobacco,is_active,sort_order,created_at FROM products WHERE id IN (${placeholders})`, list);
        
        const result = {};
        for(const row of rows){
          result[row.id] = row;
        }
        return { ok:true, items: result };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'خطأ في الجلب الجماعي' }; }
  });

  // get by barcode (exclude image_blob)
  ipcMain.handle('products:get_by_barcode', async (_e, barcode) => {
    const code = (barcode && barcode.barcode) ? barcode.barcode : barcode;
    if(!code) return { ok:false, error:'باركود مفقود' };
    
    if (isSecondaryDevice()) {
      return await fetchFromAPI(`/products/barcode/${code}`);
    }

    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        const [rows] = await conn.query('SELECT id,name,name_en,barcode,price,stock,category,description,image_path,image_mime,is_tobacco,is_active,sort_order,created_at FROM products WHERE barcode=? LIMIT 1', [code]);
        if(rows.length===0) return { ok:false, error:'غير موجود' };
        return { ok:true, item: rows[0] };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'خطأ في الجلب' }; }
  });

  // fetch product image (BLOB or legacy path) as base64 for on-demand rendering
  ipcMain.handle('products:image_get', async (_e, idObj) => {
    const pid = (idObj && idObj.id) ? idObj.id : idObj;
    if(!pid) return { ok:false, error:'معرّف مفقود' };
    try{
      const fs = require('fs').promises;
      const path = require('path');
      const { optimizeProductImage } = require('./image-optimizer');
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        const [rows] = await conn.query('SELECT image_blob, image_mime, image_path FROM products WHERE id=? LIMIT 1', [pid]);
        if(!rows.length) return { ok:false, error:'غير موجود' };
        const row = rows[0];
        
        let imageBuffer = null;
        let mime = 'image/png';
        
        if(row.image_blob){
          imageBuffer = Buffer.from(row.image_blob);
          mime = row.image_mime || 'image/png';
        } else if(row.image_path){
          try{
            let abs = row.image_path;
            if(/^assets\//.test(row.image_path)){
              abs = getResourcePath(row.image_path);
            }
            imageBuffer = await fs.readFile(abs);
            const ext = String(path.extname(abs)).toLowerCase();
            mime = ext==='.jpg' || ext==='.jpeg' ? 'image/jpeg' : ext==='.webp' ? 'image/webp' : 'image/png';
          }catch(_){ /* ignore path read errors */ }
        }
        
        if(imageBuffer){
          const optimized = await optimizeProductImage(imageBuffer, mime);
          if(optimized){
            return { ok:true, ...optimized };
          }
        }
        
        return { ok:false, error:'لا توجد صورة' };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'خطأ في الجلب' }; }
  });

  // batch fetch images
  ipcMain.handle('products:images_get_batch', async (_e, ids) => {
    const list = Array.isArray(ids) ? ids.map(Number).filter(n => !isNaN(n)) : [];
    if(!list.length) return { ok:true, items:{} };
    
    if (isSecondaryDevice()) {
      return await fetchFromAPI('/products-images-batch', { ids: list.join(',') });
    }
    
    try{
      const fs = require('fs').promises;
      const path = require('path');
      const { optimizeProductImage } = require('./image-optimizer');
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        const placeholders = list.map(()=>'?').join(',');
        const [rows] = await conn.query(`SELECT id, image_blob, image_mime, image_path FROM products WHERE id IN (${placeholders})`, list);
        
        const result = {};
        await Promise.all(rows.map(async (row) => {
          try{
            let imageBuffer = null;
            let mime = 'image/png';
            
            if(row.image_blob){
              imageBuffer = Buffer.from(row.image_blob);
              mime = row.image_mime || 'image/png';
            } else if(row.image_path){
              let abs = row.image_path;
              if(/^assets\//.test(row.image_path)){
                abs = getResourcePath(row.image_path);
              }
              imageBuffer = await fs.readFile(abs);
              const ext = String(path.extname(abs)).toLowerCase();
              mime = ext==='.jpg' || ext==='.jpeg' ? 'image/jpeg' : ext==='.webp' ? 'image/webp' : 'image/png';
            }
            
            if(imageBuffer){
              const optimized = await optimizeProductImage(imageBuffer, mime);
              if(optimized){
                result[row.id] = optimized;
              }
            }
          }catch(_){ }
        }));
        return { ok:true, items: result };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'خطأ في الجلب الجماعي' }; }
  });

  // update
  ipcMain.handle('products:update', async (_e, id, payload) => {
    const pid = (id && id.id) ? id.id : id;
    if(!pid) return { ok:false, error:'معرّف مفقود' };
    const { name, name_en, barcode, price, stock, category, description } = payload || {};
    if(!name) return { ok:false, error:'اسم المنتج مطلوب' };
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTable(conn);

        // Image update strategy:
        // - if remove_image: clear image fields
        // - else if image_blob_base64: replace with new BLOB
        // - else: keep current image fields unchanged
        if(payload && payload.remove_image){
          await conn.query('UPDATE products SET name=?, name_en=?, barcode=?, price=?, stock=?, category=?, description=?, image_path=NULL, image_blob=NULL, image_mime=NULL, is_tobacco=? WHERE id=?', [name, (name_en||null), barcode||null, price??0, stock??0, category||null, description||null, (payload.is_tobacco ? 1 : 0), pid]);
        } else if(payload && payload.image_blob_base64){
          const imgMime = payload?.image_mime || 'image/png';
          const imgBase64 = payload?.image_blob_base64 || null;
          const imgBuffer = (imgBase64 && typeof imgBase64 === 'string') ? Buffer.from(imgBase64, 'base64') : null;
          await conn.query('UPDATE products SET name=?, name_en=?, barcode=?, price=?, stock=?, category=?, description=?, image_path=NULL, image_blob=?, image_mime=?, is_tobacco=? WHERE id=?', [name, (name_en||null), barcode||null, price??0, stock??0, category||null, description||null, imgBuffer, imgMime, (payload.is_tobacco ? 1 : 0), pid]);
        } else {
          await conn.query('UPDATE products SET name=?, name_en=?, barcode=?, price=?, stock=?, category=?, description=?, is_tobacco=? WHERE id=?', [name, (name_en||null), barcode||null, price??0, stock??0, category||null, description||null, (payload.is_tobacco ? 1 : 0), pid]);
        }

        // After update, optionally trigger low stock email if enabled and stock is at/below threshold
        try{
          const [[s]] = await conn.query('SELECT low_stock_email_enabled, low_stock_threshold, low_stock_email_per_item, low_stock_email_cooldown_hours, email, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass, seller_legal_name, company_location FROM app_settings WHERE id=1');
          if(s && s.low_stock_email_enabled){
            const [[pRow]] = await conn.query('SELECT id,name,stock FROM products WHERE id=?', [pid]);
            if(pRow){
              const threshold = Math.max(0, Number(s.low_stock_threshold||5));
              const isLow = Number(pRow.stock||0) <= threshold;
              if(isLow){
                const now = new Date();
                const hh = Math.max(1, Number(s.low_stock_email_cooldown_hours||24));
                await conn.query(`CREATE TABLE IF NOT EXISTS app_notifications (
                  id INT AUTO_INCREMENT PRIMARY KEY,
                  type VARCHAR(64) NOT NULL,
                  ref_id INT NULL,
                  sent_at DATETIME NOT NULL,
                  key_name VARCHAR(255) NULL,
                  UNIQUE KEY uniq_type_ref_key (type, ref_id, key_name)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
                const keyName = 'low_stock';
                const [[last]] = await conn.query('SELECT sent_at FROM app_notifications WHERE type=? AND ref_id=? AND key_name=? ORDER BY sent_at DESC LIMIT 1', ['email', Number(pRow.id), keyName]);
                let canSend = true;
                if(last){
                  const lastAt = new Date(last.sent_at);
                  const diffH = (now - lastAt) / (1000*60*60);
                  if(diffH < hh){ canSend = false; }
                }
                if(canSend){
                  try{
                    const info = await require('./scheduler').__sendLowStockEmailInternal(s, [{ id: pRow.id, name: pRow.name, stock: Number(pRow.stock||0) }]);
                    await conn.query('INSERT INTO app_notifications (type, ref_id, sent_at, key_name) VALUES (?,?,NOW(),?)', ['email', Number(pRow.id), keyName]);
                  }catch(e){ console.error('low stock email send failed', e && e.message || e); }
                }
              }
            }
          }
        }catch(_){ }

        return { ok:true };
      } finally { conn.release(); }
    }catch(e){
      if (e && e.code === 'ER_DUP_ENTRY') return { ok:false, error:'الباركود موجود مسبقاً' };
      console.error(e); return { ok:false, error:'فشل التعديل' };
    }
  });

  // toggle
  ipcMain.handle('products:toggle', async (_e, id) => {
    const pid = (id && id.id) ? id.id : id;
    if(!pid) return { ok:false, error:'معرّف مفقود' };
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        const [rows] = await conn.query('SELECT is_active FROM products WHERE id=?', [pid]);
        if(rows.length===0) return { ok:false, error:'غير موجود' };
        const next = rows[0].is_active ? 0 : 1;
        await conn.query('UPDATE products SET is_active=? WHERE id=?', [next, pid]);
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل تحديث الحالة' }; }
  });

  // reorder: استلام مصفوفة مرتبة من معرّفات المنتجات وتحديث sort_order
  ipcMain.handle('products:reorder', async (_e, ids) => {
    const list = Array.isArray(ids) ? ids.map(Number).filter(n => !isNaN(n)) : [];
    if(!list.length) return { ok:false, error:'قائمة فارغة' };
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTable(conn);
        // نحدّث sort_order بحسب الترتيب في المصفوفة
        for(let i=0;i<list.length;i++){
          await conn.query('UPDATE products SET sort_order=? WHERE id=?', [i, list[i]]);
        }
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل تحديث الترتيب' }; }
  });

  // batch fetch product operations
  ipcMain.handle('products:ops_get_batch', async (_e, ids) => {
    const list = Array.isArray(ids) ? ids.map(Number).filter(n => !isNaN(n)) : [];
    if(!list.length) return { ok:true, items:{} };
    
    if (isSecondaryDevice()) {
      return await fetchFromAPI('/products-ops-batch', { ids: list.join(',') });
    }
    
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        const placeholders = list.map(()=>'?').join(',');
        // Join product_operations with operations to get names and active status
        const sql = `
          SELECT po.product_id, po.operation_id, po.price, o.name, o.name_en, o.is_active, o.id as op_real_id
          FROM product_operations po
          JOIN operations o ON po.operation_id = o.id
          WHERE po.product_id IN (${placeholders})
        `;
        const [rows] = await conn.query(sql, list);
        
        const result = {};
        // Initialize empty arrays for all requested IDs
        list.forEach(id => result[id] = []);
        
        for(const row of rows){
          if(!result[row.product_id]) result[row.product_id] = [];
          result[row.product_id].push({
            operation_id: row.operation_id,
            id: row.op_real_id,
            name: row.name,
            name_en: row.name_en || null,
            price: row.price,
            is_active: row.is_active
          });
        }
        return { ok:true, items: result };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'خطأ في جلب العمليات' }; }
  });

  // delete
  ipcMain.handle('products:delete', async (_e, id) => {
    const pid = (id && id.id) ? id.id : id;
    if(!pid) return { ok:false, error:'معرّف مفقود' };
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await conn.query('DELETE FROM products WHERE id=?', [pid]);
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل الحذف' }; }
  });

  // bulk reset all products
  ipcMain.handle('products:reset_all', async () => {
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await conn.beginTransaction();
        // حذف كل المنتجات وإعادة الترقيم
        await conn.query('DELETE FROM products');
        try{ await conn.query('ALTER TABLE products AUTO_INCREMENT = 1'); }catch(_){ }

        // تأكيد وجود جدول الأنواع الرئيسية ثم حذفها أيضًا وإعادة الترقيم
        await conn.query(`
          CREATE TABLE IF NOT EXISTS main_types (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(128) NOT NULL UNIQUE,
            is_active TINYINT NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        await conn.query('DELETE FROM main_types');
        try{ await conn.query('ALTER TABLE main_types AUTO_INCREMENT = 1'); }catch(_){ }

        // تأكيد وجود جداول العمليات وربطها ثم حذفها أيضًا وإعادة الترقيم
        await conn.query(`
          CREATE TABLE IF NOT EXISTS operations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(128) NOT NULL UNIQUE,
            sort_order INT NOT NULL DEFAULT 0,
            is_active TINYINT NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        await conn.query(`
          CREATE TABLE IF NOT EXISTS product_operations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            operation_id INT NOT NULL,
            price DECIMAL(10,2) NOT NULL DEFAULT 0,
            UNIQUE KEY uniq_prod_op (product_id, operation_id),
            CONSTRAINT fk_po_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            CONSTRAINT fk_po_operation FOREIGN KEY (operation_id) REFERENCES operations(id) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        // احذف ربط العمليات أولاً ثم العمليات
        await conn.query('DELETE FROM product_operations');
        try{ await conn.query('ALTER TABLE product_operations AUTO_INCREMENT = 1'); }catch(_){ }
        await conn.query('DELETE FROM operations');
        try{ await conn.query('ALTER TABLE operations AUTO_INCREMENT = 1'); }catch(_){ }

        await conn.commit();
        return { ok:true };
      } catch(e){ await conn.rollback(); throw e; }
      finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل إعادة تعيين المنتجات' }; }
  });

  ipcMain.handle('products:translate', async (_e, { text }) => {
    try {
      const result = await translate(text, { from: 'ar', to: 'en' });
      return { ok: true, text: result };
    } catch(e) {
      console.error('translate error', e);
      return { ok: false, error: e.message };
    }
  });
}

// eager init to ensure table exists on app start
(async () => {
  try{
    const pool = await getPool();
    const conn = await pool.getConnection();
    try{
      await conn.query(`USE \`${DB_NAME}\``);
      // local ensure since ensureTable is inside closure; duplicate minimal DDL
      await conn.query(`
        CREATE TABLE IF NOT EXISTS products (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          name_en VARCHAR(255) NULL,
          barcode VARCHAR(64) UNIQUE NULL,
          price DECIMAL(10,2) NOT NULL DEFAULT 0,
          cost DECIMAL(10,2) NOT NULL DEFAULT 0,
          stock INT NOT NULL DEFAULT 0,
          category VARCHAR(128) NULL,
          description TEXT NULL,
          image_path VARCHAR(512) NULL,
          image_blob LONGBLOB NULL,
          image_mime VARCHAR(64) NULL,
          is_active TINYINT NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      const [colNameEn] = await conn.query("SHOW COLUMNS FROM products LIKE 'name_en'");
      if (!colNameEn.length) {
        await conn.query("ALTER TABLE products ADD COLUMN name_en VARCHAR(255) NULL AFTER name");
      }
      const [colImg] = await conn.query("SHOW COLUMNS FROM products LIKE 'image_path'");
      if (!colImg.length) {
        await conn.query("ALTER TABLE products ADD COLUMN image_path VARCHAR(512) NULL AFTER description");
      }
      const [colImgBlob] = await conn.query("SHOW COLUMNS FROM products LIKE 'image_blob'");
      if (!colImgBlob.length) {
        await conn.query("ALTER TABLE products ADD COLUMN image_blob LONGBLOB NULL AFTER image_path");
      }
      const [colImgMime] = await conn.query("SHOW COLUMNS FROM products LIKE 'image_mime'");
      if (!colImgMime.length) {
        await conn.query("ALTER TABLE products ADD COLUMN image_mime VARCHAR(64) NULL AFTER image_blob");
      }
      const [colActive] = await conn.query("SHOW COLUMNS FROM products LIKE 'is_active'");
      if (!colActive.length) {
        await conn.query("ALTER TABLE products ADD COLUMN is_active TINYINT NOT NULL DEFAULT 1 AFTER description");
      }
    } finally { conn.release(); }
  }catch(e){ console.error('products:init ensure table failed', e); }
})();

module.exports = { registerProductsIPC };