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
        name_en VARCHAR(128) DEFAULT NULL,
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
    // Migration for older databases: add name_en if missing
    const [colNameEn] = await conn.query("SHOW COLUMNS FROM main_types LIKE 'name_en'");
    if(!colNameEn.length){
      await conn.query("ALTER TABLE main_types ADD COLUMN name_en VARCHAR(128) DEFAULT NULL AFTER name");
    }
  }

  // add
  ipcMain.handle('types:add', async (_evt, payload) => {
    const { name, name_en } = payload || {};
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
        const nameEnVal = (name_en && name_en.trim()) ? name_en.trim() : null;
        await conn.query('INSERT INTO main_types (name, name_en, sort_order) VALUES (?, ?, ?)', [name, nameEnVal, next]);
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
        const [rows] = await conn.query('SELECT id, name, name_en FROM main_types WHERE is_active=1 ORDER BY sort_order ASC, name ASC');
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
    const { name, name_en } = payload || {};
    if(!name) return { ok:false, error:'الاسم مطلوب' };
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTable(conn);
        
        // 1) Get old name to update linked products
        const [[oldRow]] = await conn.query('SELECT name FROM main_types WHERE id=?', [tid]);
        const oldName = oldRow ? oldRow.name : null;

        // 2) Update main type name and English name
        const nameEnVal = (name_en && name_en.trim()) ? name_en.trim() : null;
        await conn.query('UPDATE main_types SET name=?, name_en=? WHERE id=?', [name, nameEnVal, tid]);

        // 3) Cascade change to products table if name actually changed
        if (oldName && oldName !== name) {
          await conn.query('UPDATE products SET category=? WHERE category=?', [name, oldName]);
          
          // Also update global offers excluded_categories if they contain the old name
          try {
            const [offers] = await conn.query('SELECT id, excluded_categories FROM offers WHERE excluded_categories IS NOT NULL');
            for (const offer of offers) {
              try {
                let cats = JSON.parse(offer.excluded_categories);
                if (Array.isArray(cats) && cats.includes(oldName)) {
                  cats = cats.map(c => c === oldName ? name : c);
                  await conn.query('UPDATE offers SET excluded_categories=? WHERE id=?', [JSON.stringify(cats), offer.id]);
                }
              } catch (_) { /* ignore parse errors */ }
            }
          } catch (_) { /* ignore table missing errors */ }
        }

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

        // Get name before delete
        const [[row]] = await conn.query('SELECT name FROM main_types WHERE id=?', [tid]);
        const typeName = row ? row.name : null;

        await conn.query('DELETE FROM main_types WHERE id=?', [tid]);

        // Cascade to products: clear category name
        if (typeName) {
          await conn.query('UPDATE products SET category=NULL WHERE category=?', [typeName]);
          
          // Also remove from global offers excluded_categories
          try {
            const [offers] = await conn.query('SELECT id, excluded_categories FROM offers WHERE excluded_categories IS NOT NULL');
            for (const offer of offers) {
              try {
                let cats = JSON.parse(offer.excluded_categories);
                if (Array.isArray(cats) && cats.includes(typeName)) {
                  cats = cats.filter(c => c !== typeName);
                  await conn.query('UPDATE offers SET excluded_categories=? WHERE id=?', [JSON.stringify(cats), offer.id]);
                }
              } catch (_) { /* ignore parse errors */ }
            }
          } catch (_) { /* ignore table missing errors */ }
        }

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