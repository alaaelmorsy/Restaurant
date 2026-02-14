// Inventory IPC: manage inventory items and product BOM (ingredients)
const { ipcMain } = require('electron');
const { getPool, DB_NAME } = require('../db/connection');
const { isSecondaryDevice, fetchFromAPI } = require('./api-client');

function registerInventoryIPC(){
  async function ensureTables(conn){
    await conn.query(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        unit VARCHAR(16) NOT NULL DEFAULT 'piece',
        stock DECIMAL(12,3) NOT NULL DEFAULT 0,
        is_active TINYINT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS product_bom (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        inventory_id INT NOT NULL,
        qty_per_unit DECIMAL(12,3) NOT NULL,
        UNIQUE KEY uniq_bom (product_id, inventory_id),
        FOREIGN KEY (inventory_id) REFERENCES inventory_items(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  }

  // Inventory items CRUD
  ipcMain.handle('inv:list', async (_e, q) => {
    if(isSecondaryDevice()){ return await fetchFromAPI('/inventory', q); }
    const query = q || {};
    try{
      const pool = await getPool(); const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``); await ensureTables(conn);
        const where = [] ; const params=[];
        if(query.active==='1' || query.active==='0'){ where.push('is_active=?'); params.push(Number(query.active)); }
        if(query.linked_only==='1'){ where.push('EXISTS (SELECT 1 FROM product_bom b WHERE b.inventory_id = inventory_items.id)'); }
        const whereSql = where.length?('WHERE '+where.join(' AND ')) : '';
        const [rows] = await conn.query(`SELECT * FROM inventory_items ${whereSql} ORDER BY name ASC`, params);
        return { ok:true, items: rows };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error: 'تعذر تحميل المخزون' }; }
  });

  ipcMain.handle('inv:add', async (_e, payload) => {
    const { unit, stock, is_active } = payload || {};
    if(!unit || !String(unit).trim()) return { ok:false, error:'اكتب اسم الوحدة (مثال: قطعة، جرام، كوب)' };
    try{
      const pool = await getPool(); const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``); await ensureTables(conn);
        const u = String(unit).trim();
        // استخدم الوحدة كاسم داخلي أيضاً
        await conn.query('INSERT INTO inventory_items (name, unit, stock, is_active) VALUES (?,?,?,?)', [u, u, Number(stock||0), is_active?1:1]);
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل إضافة عنصر المخزون' }; }
  });

  ipcMain.handle('inv:update', async (_e, id, payload) => {
    const iid = (id && id.id) ? id.id : id; if(!iid) return { ok:false, error:'معرّف مفقود' };
    const { unit, stock, is_active } = payload || {};
    if(!unit || !String(unit).trim()) return { ok:false, error:'اكتب اسم الوحدة (مثال: قطعة، جرام، كوب)' };
    try{
      const pool = await getPool(); const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``); await ensureTables(conn);
        const u = String(unit).trim();
        // حدِّث الاسم بنفس قيمة الوحدة للحفاظ على الاتساق
        await conn.query('UPDATE inventory_items SET name=?, unit=?, stock=?, is_active=? WHERE id=?', [u, u, Number(stock||0), (is_active?1:0), iid]);
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل تعديل عنصر المخزون' }; }
  });

  ipcMain.handle('inv:toggle', async (_e, id) => {
    const iid = (id && id.id) ? id.id : id; if(!iid) return { ok:false, error:'معرّف مفقود' };
    try{
      const pool = await getPool(); const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``); await ensureTables(conn);
        const [[row]] = await conn.query('SELECT is_active FROM inventory_items WHERE id=?', [iid]);
        if(!row) return { ok:false, error:'غير موجود' };
        const next = row.is_active ? 0 : 1; await conn.query('UPDATE inventory_items SET is_active=? WHERE id=?', [next, iid]);
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل التحديث' }; }
  });

  ipcMain.handle('inv:delete', async (_e, id) => {
    const iid = (id && id.id) ? id.id : id; if(!iid) return { ok:false, error:'معرّف مفقود' };
    try{
      const pool = await getPool(); const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``); await ensureTables(conn);
        await conn.query('DELETE FROM inventory_items WHERE id=?', [iid]);
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل الحذف' }; }
  });

  // BOM: get/set per product
  ipcMain.handle('bom:get', async (_e, product_id) => {
    const pid = (product_id && product_id.id) ? product_id.id : product_id;
    if(!pid) return { ok:false, error:'معرّف المنتج مفقود' };
    try{
      const pool = await getPool(); const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``); await ensureTables(conn);
        const [rows] = await conn.query(`
          SELECT b.inventory_id, b.qty_per_unit, i.name, i.unit, i.stock
          FROM product_bom b JOIN inventory_items i ON i.id=b.inventory_id
          WHERE b.product_id=? ORDER BY i.name ASC
        `, [pid]);
        return { ok:true, items: rows };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'تعذر تحميل مكونات المنتج' }; }
  });

  ipcMain.handle('bom:set', async (_e, product_id, items) => {
    const pid = (product_id && product_id.id) ? product_id.id : product_id;
    if(!pid) return { ok:false, error:'معرّف المنتج مفقود' };
    const arr = Array.isArray(items) ? items : [];
    try{
      const pool = await getPool(); const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``); await ensureTables(conn);
        await conn.beginTransaction();
        await conn.query('DELETE FROM product_bom WHERE product_id=?', [pid]);
        if(arr.length){
          const vals = arr.map(x => [pid, Number(x.inventory_id), Number(x.qty_per_unit)]);
          await conn.query('INSERT INTO product_bom (product_id, inventory_id, qty_per_unit) VALUES ?', [vals]);
        }
        await conn.commit();
        return { ok:true };
      } catch (e){ try{ await conn.rollback(); }catch(_){ } throw e; }
      finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل حفظ مكونات المنتج' }; }
  });
}

// Eager ensure
(async () => {
  try{
    const pool = await getPool(); const conn = await pool.getConnection();
    try{
      await conn.query(`USE \`${DB_NAME}\``);
      await conn.query(`
        CREATE TABLE IF NOT EXISTS inventory_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          unit VARCHAR(16) NOT NULL DEFAULT 'piece',
          stock DECIMAL(12,3) NOT NULL DEFAULT 0,
          is_active TINYINT NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      await conn.query(`
        CREATE TABLE IF NOT EXISTS product_bom (
          id INT AUTO_INCREMENT PRIMARY KEY,
          product_id INT NOT NULL,
          inventory_id INT NOT NULL,
          qty_per_unit DECIMAL(12,3) NOT NULL,
          UNIQUE KEY uniq_bom (product_id, inventory_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
    } finally { conn.release(); }
  }catch(e){ console.error('inventory:init ensure tables failed', e); }
})();

module.exports = { registerInventoryIPC };