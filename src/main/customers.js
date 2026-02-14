// Customers IPC handlers
const { ipcMain } = require('electron');
const { getPool, DB_NAME } = require('../db/connection');
const { isSecondaryDevice, fetchFromAPI } = require('./api-client');

function registerCustomersIPC(){
  async function ensureTable(conn){
    await conn.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(64) NULL,
        email VARCHAR(255) NULL,
        address VARCHAR(255) NULL,
        vat_number VARCHAR(32) NULL,
        cr_number VARCHAR(32) NULL,
        national_address VARCHAR(255) NULL,
        notes TEXT NULL,
        is_active TINYINT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_name (name),
        INDEX idx_phone (phone),
        INDEX idx_email (email),
        INDEX idx_is_active (is_active),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    // تأكيد وجود الأعمدة على قواعد قديمة
    try{
      const [colsVat] = await conn.query("SHOW COLUMNS FROM customers LIKE 'vat_number'");
      if(!colsVat || colsVat.length === 0){
        await conn.query("ALTER TABLE customers ADD COLUMN vat_number VARCHAR(32) NULL AFTER address");
      }
    }catch(e){ console.warn('ensureTable: vat_number check/add failed', e.message || e); }
    try{
      const [colsCr] = await conn.query("SHOW COLUMNS FROM customers LIKE 'cr_number'");
      if(!colsCr || colsCr.length === 0){
        await conn.query("ALTER TABLE customers ADD COLUMN cr_number VARCHAR(32) NULL AFTER vat_number");
      }
    }catch(e){ console.warn('ensureTable: cr_number check/add failed', e.message || e); }
    try{
      const [colsNat] = await conn.query("SHOW COLUMNS FROM customers LIKE 'national_address'");
      if(!colsNat || colsNat.length === 0){
        await conn.query("ALTER TABLE customers ADD COLUMN national_address VARCHAR(255) NULL AFTER cr_number");
      }
    }catch(e){ console.warn('ensureTable: national_address check/add failed', e.message || e); }
    
    // إضافة indexes على قواعد موجودة بالفعل
    try{
      const [indexes] = await conn.query("SHOW INDEX FROM customers WHERE Key_name = 'idx_name'");
      if(!indexes || indexes.length === 0){
        await conn.query("ALTER TABLE customers ADD INDEX idx_name (name)");
      }
    }catch(e){ console.warn('ensureTable: idx_name add failed', e.message || e); }
    try{
      const [indexes] = await conn.query("SHOW INDEX FROM customers WHERE Key_name = 'idx_phone'");
      if(!indexes || indexes.length === 0){
        await conn.query("ALTER TABLE customers ADD INDEX idx_phone (phone)");
      }
    }catch(e){ console.warn('ensureTable: idx_phone add failed', e.message || e); }
    try{
      const [indexes] = await conn.query("SHOW INDEX FROM customers WHERE Key_name = 'idx_email'");
      if(!indexes || indexes.length === 0){
        await conn.query("ALTER TABLE customers ADD INDEX idx_email (email)");
      }
    }catch(e){ console.warn('ensureTable: idx_email add failed', e.message || e); }
    try{
      const [indexes] = await conn.query("SHOW INDEX FROM customers WHERE Key_name = 'idx_is_active'");
      if(!indexes || indexes.length === 0){
        await conn.query("ALTER TABLE customers ADD INDEX idx_is_active (is_active)");
      }
    }catch(e){ console.warn('ensureTable: idx_is_active add failed', e.message || e); }
    try{
      const [indexes] = await conn.query("SHOW INDEX FROM customers WHERE Key_name = 'idx_created_at'");
      if(!indexes || indexes.length === 0){
        await conn.query("ALTER TABLE customers ADD INDEX idx_created_at (created_at)");
      }
    }catch(e){ console.warn('ensureTable: idx_created_at add failed', e.message || e); }
  }

  // add
  ipcMain.handle('customers:add', async (_evt, payload) => {
    const { name, phone, email, address, vat_number, cr_number, national_address, notes } = payload || {};
    if(!phone || String(phone).trim()==='') return { ok:false, error:'رقم الجوال مطلوب' };
    const safeName = (name && String(name).trim()!=='') ? String(name).trim() : String(phone).trim();
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTable(conn);
        // منع تكرار رقم الجوال
        const [[dup]] = await conn.query('SELECT id FROM customers WHERE phone=? LIMIT 1', [String(phone).trim()]);
        if(dup){ return { ok:false, error:'رقم الجوال موجود بالفعل' }; }
        const [res] = await conn.query(
          'INSERT INTO customers (name, phone, email, address, vat_number, cr_number, national_address, notes) VALUES (?,?,?,?,?,?,?,?)',
          [safeName, String(phone).trim(), email||null, address||null, vat_number||null, cr_number||null, national_address||null, notes||null]
        );
        return { ok:true, id: res.insertId };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل حفظ العميل' }; }
  });

  // list
  ipcMain.handle('customers:list', async (_e, q) => {
    if (isSecondaryDevice()) {
      return await fetchFromAPI('/customers', q || {});
    }

    const query = q || {};
    const where = [];
    const params = [];
    if(query.q){ where.push('(name LIKE ? OR phone LIKE ? OR email LIKE ?)'); params.push(`%${query.q}%`, `%${query.q}%`, `%${query.q}%`); }
    if(query.active==="1" || query.active==="0"){ where.push('is_active=?'); params.push(Number(query.active)); }

    let order = 'ORDER BY id DESC';
    if(query.sort === 'name_asc') order = 'ORDER BY name ASC';
    if(query.sort === 'created_asc') order = 'ORDER BY created_at ASC';

    const whereSql = where.length ? ('WHERE ' + where.join(' AND ')) : '';
    const page = Math.max(1, Number(query.page)||1);
    const pageSize = Math.max(1, Math.min(10000, Number(query.pageSize)||20));
    const offset = (page-1)*pageSize;

    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        const [countRows] = await conn.query(`SELECT COUNT(*) as cnt FROM customers ${whereSql}`, params);
        const total = (countRows && countRows[0] && countRows[0].cnt) ? Number(countRows[0].cnt) : 0;
        const [rows] = await conn.query(`SELECT * FROM customers ${whereSql} ${order} LIMIT ? OFFSET ?`, [...params, pageSize, offset]);
        return { ok:true, items: rows, total, page, pageSize };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'خطأ في تحميل العملاء' }; }
  });

  // get
  ipcMain.handle('customers:get', async (_e, id) => {
    const cid = (id && id.id) ? id.id : id;
    if(!cid) return { ok:false, error:'معرّف مفقود' };
    
    if (isSecondaryDevice()) {
      return await fetchFromAPI(`/customers/${cid}`);
    }

    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTable(conn);
        const [rows] = await conn.query('SELECT * FROM customers WHERE id=? LIMIT 1', [cid]);
        if(rows.length===0) return { ok:false, error:'غير موجود' };
        return { ok:true, item: rows[0] };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'خطأ في الجلب' }; }
  });

  // update
  ipcMain.handle('customers:update', async (_e, id, payload) => {
    const cid = (id && id.id) ? id.id : id;
    if(!cid) return { ok:false, error:'معرّف مفقود' };
    const { name, phone, email, address, vat_number, cr_number, national_address, notes } = payload || {};
    if(!phone || String(phone).trim()==='') return { ok:false, error:'رقم الجوال مطلوب' };
    const safeName = (name && String(name).trim()!=='') ? String(name).trim() : String(phone).trim();
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTable(conn);
        // منع تكرار رقم الجوال لغير نفس السجل
        const [[dup]] = await conn.query('SELECT id FROM customers WHERE phone=? AND id<>? LIMIT 1', [String(phone).trim(), cid]);
        if(dup){ return { ok:false, error:'رقم الجوال موجود بالفعل' }; }
        await conn.query('UPDATE customers SET name=?, phone=?, email=?, address=?, vat_number=?, cr_number=?, national_address=?, notes=? WHERE id=?', [safeName, String(phone).trim(), email||null, address||null, vat_number||null, cr_number||null, national_address||null, notes||null, cid]);
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل التعديل' }; }
  });

  // toggle
  ipcMain.handle('customers:toggle', async (_e, id) => {
    const cid = (id && id.id) ? id.id : id;
    if(!cid) return { ok:false, error:'معرّف مفقود' };
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTable(conn);
        const [rows] = await conn.query('SELECT is_active FROM customers WHERE id=?', [cid]);
        if(rows.length===0) return { ok:false, error:'غير موجود' };
        const next = rows[0].is_active ? 0 : 1;
        await conn.query('UPDATE customers SET is_active=? WHERE id=?', [next, cid]);
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل تحديث الحالة' }; }
  });

  // delete
  ipcMain.handle('customers:delete', async (_e, id) => {
    const cid = (id && id.id) ? id.id : id;
    if(!cid) return { ok:false, error:'معرّف مفقود' };
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTable(conn);
        
        // التحقق من وجود فواتير مرتبطة بهذا العميل
        const [[salesCheck]] = await conn.query(
          'SELECT COUNT(*) as count FROM sales WHERE customer_id=?',
          [cid]
        );
        
        if(salesCheck && salesCheck.count > 0){
          return { 
            ok: false, 
            error: `<strong>لا يمكن حذف هذا العميل</strong><br><br>` +
                   `يوجد <strong>${salesCheck.count}</strong> فاتورة مرتبطة بهذا العميل.<br>` +
                   `💡 يمكنك إيقاف العميل بدلاً من حذفه للحفاظ على سجلات الفواتير.`,
            hasInvoices: true
          };
        }
        
        await conn.query('DELETE FROM customers WHERE id=?', [cid]);
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل الحذف' }; }
  });

  // bulk reset all customers
  ipcMain.handle('customers:reset_all', async () => {
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTable(conn);
        await conn.beginTransaction();
        await conn.query('DELETE FROM customers');
        try{ await conn.query('ALTER TABLE customers AUTO_INCREMENT = 1'); }catch(_){ }
        await conn.commit();
        return { ok:true };
      } catch(e){ await conn.rollback(); throw e; }
      finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل إعادة تعيين العملاء' }; }
  });
}

// eager ensure on app start
(async () => {
  try{
    const pool = await getPool();
    const conn = await pool.getConnection();
    try{
      await conn.query(`USE \`${DB_NAME}\``);
      await conn.query(`
        CREATE TABLE IF NOT EXISTS customers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          phone VARCHAR(64) NULL,
          email VARCHAR(255) NULL,
          address VARCHAR(255) NULL,
          vat_number VARCHAR(32) NULL,
          cr_number VARCHAR(32) NULL,
          national_address VARCHAR(255) NULL,
          notes TEXT NULL,
          is_active TINYINT NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      try{
        const [cols] = await conn.query("SHOW COLUMNS FROM customers LIKE 'vat_number'");
        if(!cols || cols.length === 0){
          await conn.query("ALTER TABLE customers ADD COLUMN vat_number VARCHAR(32) NULL AFTER address");
        }
      }catch(e){ console.warn('init ensure: vat_number add failed', e.message || e); }
      try{
        const [colsCr] = await conn.query("SHOW COLUMNS FROM customers LIKE 'cr_number'");
        if(!colsCr || colsCr.length === 0){
          await conn.query("ALTER TABLE customers ADD COLUMN cr_number VARCHAR(32) NULL AFTER vat_number");
        }
      }catch(e){ console.warn('init ensure: cr_number add failed', e.message || e); }
      try{
        const [colsNat] = await conn.query("SHOW COLUMNS FROM customers LIKE 'national_address'");
        if(!colsNat || colsNat.length === 0){
          await conn.query("ALTER TABLE customers ADD COLUMN national_address VARCHAR(255) NULL AFTER cr_number");
        }
      }catch(e){ console.warn('init ensure: national_address add failed', e.message || e); }
    } finally { conn.release(); }
  }catch(e){ console.error('customers:init ensure table failed', e); }
})();

module.exports = { registerCustomersIPC };