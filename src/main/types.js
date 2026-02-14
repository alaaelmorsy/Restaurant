// Main Types IPC (main categories)
const { ipcMain } = require('electron');
const { getPool, DB_NAME } = require('../db/connection');
const { isSecondaryDevice, fetchFromAPI } = require('./api-client');

function registerTypesIPC(){
  async function ensureTable(conn){
    // Ensure table exists with sort_order column (for custom ordering like operations)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS main_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(128) NOT NULL UNIQUE,
        sort_order INT NOT NULL DEFAULT 0,
        is_active TINYINT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    // Migration for older databases: add sort_order if missing and initialize
    const [colSort] = await conn.query("SHOW COLUMNS FROM main_types LIKE 'sort_order'");
    if(!colSort.length){
      await conn.query("ALTER TABLE main_types ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER name");
      // Initialize sort_order to id for stable default ordering
      await conn.query("UPDATE main_types SET sort_order = id WHERE sort_order = 0");
    }
  }

  // add
  ipcMain.handle('types:add', async (_evt, payload) => {
    const { name } = payload || {};
    if(!name) return { ok:false, error:'اسم النوع الرئيسي مطلوب' };
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTable(conn);
        // Place new type at the end of the list
        const [mx] = await conn.query('SELECT COALESCE(MAX(sort_order), -1) AS m FROM main_types');
        const next = Number(mx && mx[0] && mx[0].m != null ? mx[0].m : -1) + 1;
        await conn.query('INSERT INTO main_types (name, sort_order) VALUES (?, ?)', [name, next]);
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){
      if(e && e.code === 'ER_DUP_ENTRY') return { ok:false, error:'الاسم موجود مسبقًا' };
      console.error(e); return { ok:false, error:'فشل حفظ النوع' };
    }
  });

  // list active (for dropdowns)
  ipcMain.handle('types:list', async () => {
    if(isSecondaryDevice()){ return await fetchFromAPI('/types'); }
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTable(conn);
        const [rows] = await conn.query('SELECT id, name FROM main_types WHERE is_active=1 ORDER BY sort_order ASC, name ASC');
        return { ok:true, items: rows };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'تعذر تحميل الأنواع' }; }
  });

  // list all (manage screen)
  ipcMain.handle('types:list_all', async () => {
    if(isSecondaryDevice()){ return await fetchFromAPI('/types/all'); }
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTable(conn);
        const [rows] = await conn.query('SELECT * FROM main_types ORDER BY sort_order ASC, name ASC');
        return { ok:true, items: rows };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'تعذر تحميل الأنواع' }; }
  });

  // get one
  ipcMain.handle('types:get', async (_e, id) => {
    const tid = (id && id.id) ? id.id : id;
    if(isSecondaryDevice()){ return await fetchFromAPI(`/types/${tid}`); }
    if(!tid) return { ok:false, error:'معرّف مفقود' };
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTable(conn);
        const [rows] = await conn.query('SELECT * FROM main_types WHERE id=? LIMIT 1', [tid]);
        if(rows.length===0) return { ok:false, error:'غير موجود' };
        return { ok:true, item: rows[0] };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'خطأ في الجلب' }; }
  });

  // update name only
  ipcMain.handle('types:update', async (_e, id, payload) => {
    const tid = (id && id.id) ? id.id : id;
    if(!tid) return { ok:false, error:'معرّف مفقود' };
    const { name } = payload || {};
    if(!name) return { ok:false, error:'الاسم مطلوب' };
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTable(conn);
        await conn.query('UPDATE main_types SET name=? WHERE id=?', [name, tid]);
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){
      if(e && e.code === 'ER_DUP_ENTRY') return { ok:false, error:'الاسم موجود مسبقًا' };
      console.error(e); return { ok:false, error:'فشل التعديل' };
    }
  });

  // toggle active
  ipcMain.handle('types:toggle', async (_e, id) => {
    const tid = (id && id.id) ? id.id : id;
    if(!tid) return { ok:false, error:'معرّف مفقود' };
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTable(conn);
        const [rows] = await conn.query('SELECT is_active FROM main_types WHERE id=?', [tid]);
        if(rows.length===0) return { ok:false, error:'غير موجود' };
        const next = rows[0].is_active ? 0 : 1;
        await conn.query('UPDATE main_types SET is_active=? WHERE id=?', [next, tid]);
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل تحديث الحالة' }; }
  });

  // delete
  ipcMain.handle('types:delete', async (_e, id) => {
    const tid = (id && id.id) ? id.id : id;
    if(!tid) return { ok:false, error:'معرّف مفقود' };
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTable(conn);
        await conn.query('DELETE FROM main_types WHERE id=?', [tid]);
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل الحذف' }; }
  });

  // Reorder types (array of {id, sort_order})
  ipcMain.handle('types:reorder', async (_e, items) => {
    try{
      const list = Array.isArray(items) ? items : [];
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTable(conn);
        const updates = list.map(it => [Number(it.sort_order||0), Number(it.id)]);
        if(updates.length){
          // Batch update using CASE for efficiency
          const ids = updates.map(u => u[1]);
          const cases = updates.map(u => `WHEN id=${u[1]} THEN ${u[0]}`).join(' ');
          await conn.query(`UPDATE main_types SET sort_order = CASE ${cases} END WHERE id IN (${ids.join(',')})`);
        }
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل حفظ ترتيب الأنواع' }; }
  });

  // Eager ensure table once when registering IPC (use inner ensureTable scope)
  (async () => {
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTable(conn);
      } finally { conn.release(); }
    }catch(e){ console.error('types:init ensure table failed', e); }
  })();
}

module.exports = { registerTypesIPC };