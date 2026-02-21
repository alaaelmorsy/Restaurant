// Operations IPC handlers: manage operations and product-specific operation prices
const { ipcMain, BrowserWindow } = require('electron');
const { getPool, DB_NAME } = require('../db/connection');
const { isSecondaryDevice, fetchFromAPI } = require('./api-client');

async function ensureTables(conn){
  await conn.query(`CREATE TABLE IF NOT EXISTS operations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(128) NOT NULL UNIQUE,
    name_en VARCHAR(128) DEFAULT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active TINYINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  const [colSort] = await conn.query("SHOW COLUMNS FROM operations LIKE 'sort_order'");
  if(!colSort.length){
    await conn.query("ALTER TABLE operations ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER name");
  }
  const [colNameEn] = await conn.query("SHOW COLUMNS FROM operations LIKE 'name_en'");
  if(!colNameEn.length){
    await conn.query("ALTER TABLE operations ADD COLUMN name_en VARCHAR(128) DEFAULT NULL AFTER name");
  }

  await conn.query(`CREATE TABLE IF NOT EXISTS product_operations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    operation_id INT NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    UNIQUE KEY uniq_prod_op (product_id, operation_id),
    CONSTRAINT fk_po_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_po_operation FOREIGN KEY (operation_id) REFERENCES operations(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
}

const PRODUCT_OPS_CACHE_TTL = 5 * 60 * 1000;
const productOpsCache = new Map();

function buildProductOpsCacheKey(productId){
  return String(productId);
}

function invalidateProductOperationsCache(productId){
  if(productId !== null && typeof productId !== 'undefined'){
    productOpsCache.delete(buildProductOpsCacheKey(productId));
    return;
  }
  productOpsCache.clear();
}

function notifyProductOperationsCacheInvalidated(productId){
  const payload = { product_id: (productId !== null && typeof productId !== 'undefined') ? Number(productId) : null };
  try{
    BrowserWindow.getAllWindows().forEach(win => win.webContents.send('operations:cache:invalidated', payload));
  }catch(_){ }
}

async function fetchProductOperationsFromDB(productId){
  const pool = await getPool();
  const conn = await pool.getConnection();
  try{
    await conn.query(`USE \`${DB_NAME}\``);
    await ensureTables(conn);
    const [rows] = await conn.query(`
      SELECT po.operation_id, po.price, o.name, o.name_en, o.is_active, o.sort_order
      FROM product_operations po
      JOIN operations o ON o.id = po.operation_id
      WHERE po.product_id = ?
      ORDER BY o.sort_order ASC, o.name ASC
    `, [Number(productId)]);
    return rows;
  }finally{ conn.release(); }
}

async function loadProductOperations(productId){
  const key = buildProductOpsCacheKey(productId);
  const now = Date.now();
  const cached = productOpsCache.get(key);
  if(cached && (now - cached.ts < PRODUCT_OPS_CACHE_TTL)){
    return { ok:true, items: cached.items };
  }
  if(isSecondaryDevice()){
    const data = await fetchFromAPI(`/operations/product/${productId}`);
    if(!data || !data.ok){
      return data || { ok:false, error:'تعذر تحميل عمليات المنتج' };
    }
    const items = Array.isArray(data.items) ? data.items : [];
    productOpsCache.set(key, { items, ts: now });
    return { ok:true, items };
  }
  const rows = await fetchProductOperationsFromDB(productId);
  productOpsCache.set(key, { items: rows, ts: now });
  return { ok:true, items: rows };
}

function registerOperationsIPC(){
  // CRUD for operations
  ipcMain.handle('ops:list', async () => {
    if(isSecondaryDevice()){ return await fetchFromAPI('/operations'); }
    try{
      const pool = await getPool(); const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTables(conn);
        const [rows] = await conn.query('SELECT * FROM operations ORDER BY sort_order ASC, is_active DESC, name ASC');
        return { ok:true, items: rows };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'تعذر تحميل العمليات' }; }
  });

  ipcMain.handle('ops:add', async (_e, payload) => {
    const name = (payload && payload.name ? String(payload.name) : '').trim();
    const name_en = (payload && payload.name_en ? String(payload.name_en) : '').trim() || null;
    let sort_order = Number(payload && payload.sort_order);
    if(!Number.isFinite(sort_order) || sort_order <= 0) sort_order = null;
    if(!name) return { ok:false, error:'اسم العملية مطلوب' };
    try{
      const pool = await getPool(); const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTables(conn);
        // If no sort_order provided, append to the end (keep existing order stable)
        if(sort_order === null){
          const [rows] = await conn.query('SELECT COALESCE(MAX(sort_order),0)+1 AS next FROM operations');
          sort_order = (rows && rows[0] && Number(rows[0].next)) || 1;
        }
        const [res] = await conn.query('INSERT INTO operations (name, name_en, sort_order, is_active) VALUES (?,?,?,1)', [name, name_en, sort_order]);
        invalidateProductOperationsCache();
        notifyProductOperationsCacheInvalidated();
        return { ok:true, id: res.insertId, sort_order };
      } finally { conn.release(); }
    }catch(e){
      if (e && e.code === 'ER_DUP_ENTRY') return { ok:false, error:'اسم العملية موجود مسبقاً' };
      console.error(e); return { ok:false, error:'فشل الحفظ' };
    }
  });

  ipcMain.handle('ops:update', async (_e, id, payload) => {
    const oid = (id && id.id) ? id.id : id;
    if(!oid) return { ok:false, error:'معرّف مفقود' };
    const { name, is_active } = payload || {};
    const name_en = (payload && payload.name_en ? String(payload.name_en) : '').trim() || null;
    const sort_order = Number(payload && payload.sort_order || 0);
    try{
      const pool = await getPool(); const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTables(conn);
        await conn.query('UPDATE operations SET name=?, name_en=?, sort_order=?, is_active=? WHERE id=?', [name, name_en, sort_order, (is_active?1:0), oid]);
        invalidateProductOperationsCache();
        notifyProductOperationsCacheInvalidated();
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){
      if (e && e.code === 'ER_DUP_ENTRY') return { ok:false, error:'اسم العملية موجود مسبقاً' };
      console.error(e); return { ok:false, error:'فشل التحديث' };
    }
  });

  ipcMain.handle('ops:toggle', async (_e, id) => {
    const oid = (id && id.id) ? id.id : id;
    if(!oid) return { ok:false, error:'معرّف مفقود' };
    try{
      const pool = await getPool(); const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        const [rows] = await conn.query('SELECT is_active FROM operations WHERE id=?', [oid]);
        if(!rows.length) return { ok:false, error:'غير موجود' };
        const next = rows[0].is_active ? 0 : 1;
        await conn.query('UPDATE operations SET is_active=? WHERE id=?', [next, oid]);
        invalidateProductOperationsCache();
        notifyProductOperationsCacheInvalidated();
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل تحديث الحالة' }; }
  });

  ipcMain.handle('ops:delete', async (_e, id) => {
    const oid = (id && id.id) ? id.id : id;
    if(!oid) return { ok:false, error:'معرّف مفقود' };
    try{
      const pool = await getPool(); const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTables(conn);
        
        // التحقق إذا كانت العملية مرتبطة بأصناف
        const [products] = await conn.query('SELECT COUNT(*) as count FROM product_operations WHERE operation_id=?', [oid]);
        const linkedCount = (products && products[0]) ? Number(products[0].count || 0) : 0;
        
        if(linkedCount > 0){
          return { ok:false, error: `هذه العملية مرتبطة بـ ${linkedCount} صنف. لا يمكن حذفها، يمكنك فقط إيقافها.` };
        }
        
        // إذا لم تكن مرتبطة بأي منتج، اسمح بالحذف
        await conn.query('DELETE FROM operations WHERE id=?', [oid]);
        invalidateProductOperationsCache();
        notifyProductOperationsCacheInvalidated();
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل الحذف' }; }
  });

  // Product <-> Operations mapping
  ipcMain.handle('prod_ops:list', async (_e, product_id) => {
    const pid = (product_id && product_id.id) ? product_id.id : product_id;
    if(!pid) return { ok:false, error:'معرّف المنتج مفقود' };
    try{
      return await loadProductOperations(pid);
    }catch(e){
      console.error(e);
      return { ok:false, error:'تعذر تحميل عمليات المنتج' };
    }
  });

  ipcMain.handle('prod_ops:list_batch', async (_e, product_ids) => {
    const pids = Array.isArray(product_ids) ? product_ids.map(id => Number(id)).filter(id => id > 0) : [];
    if(!pids.length) return { ok:true, items:{} };
    try{
      const pool = await getPool(); const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTables(conn);
        const [rows] = await conn.query(
          `SELECT po.product_id, po.operation_id, po.price, o.name, o.is_active
           FROM product_operations po
           LEFT JOIN operations o ON po.operation_id = o.id
           WHERE po.product_id IN (?) AND o.is_active = 1
           ORDER BY po.product_id, o.name`,
          [pids]
        );
        const grouped = {};
        pids.forEach(pid => { grouped[pid] = []; });
        rows.forEach(r => {
          const pid = Number(r.product_id);
          if(!grouped[pid]) grouped[pid] = [];
          grouped[pid].push({
            operation_id: r.operation_id,
            id: r.operation_id,
            name: r.name || '',
            price: Number(r.price || 0),
            is_active: r.is_active
          });
        });
        return { ok:true, items:grouped };
      } finally { conn.release(); }
    }catch(e){
      console.error(e);
      return { ok:false, error:'تعذر تحميل عمليات المنتجات' };
    }
  });

  ipcMain.handle('prod_ops:set', async (_e, product_id, items) => {
    const pid = (product_id && product_id.id) ? product_id.id : product_id;
    if(!pid) return { ok:false, error:'معرّف المنتج مفقود' };
    const list = Array.isArray(items) ? items : [];
    try{
      const pool = await getPool(); const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTables(conn);
        await conn.query('DELETE FROM product_operations WHERE product_id=?', [pid]);
        if(list.length){
          const values = list.map(it => [pid, Number(it.operation_id), Number(it.price||0)]);
          await conn.query('INSERT INTO product_operations (product_id, operation_id, price) VALUES ?',[values]);
        }
        invalidateProductOperationsCache(pid);
        notifyProductOperationsCacheInvalidated(pid);
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل حفظ ربط العمليات' }; }
  });
}

// eager init to ensure tables at app start
(async () => {
  try{
    const pool = await getPool(); const conn = await pool.getConnection();
    try{
      await conn.query(`USE \`${DB_NAME}\``);
      await ensureTables(conn);
    } finally { conn.release(); }
  }catch(e){ console.error('operations:init ensure tables failed', e); }
})();

module.exports = { registerOperationsIPC };