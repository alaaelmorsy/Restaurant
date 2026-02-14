// Permissions IPC handlers
const { ipcMain } = require('electron');
const { getPool, DB_NAME } = require('../db/connection');
const { isSecondaryDevice, fetchFromAPI } = require('./api-client');

function registerPermissionsIPC(){
  // List all available permissions (with optional hierarchy)
  ipcMain.handle('perms:list_all', async () => {
    if(isSecondaryDevice()){ return await fetchFromAPI('/permissions'); }
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        // Try to get parent_key if exists; if not, synthesize hierarchy from naming (e.g., sales.* -> parent sales)
        let rows;
        try{
          const [r] = await conn.query('SELECT perm_key, name, parent_key FROM permissions ORDER BY name ASC');
          rows = r;
        }catch(_){
          const [r] = await conn.query('SELECT perm_key, name FROM permissions ORDER BY name ASC');
          rows = r.map(x => ({ ...x, parent_key: (x.perm_key.includes('.') ? x.perm_key.split('.')[0] : null) }));
        }
        return { ok:true, items: rows };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل تحميل الصلاحيات' }; }
  });

  // Get permissions for a user -> returns array of keys
  ipcMain.handle('perms:get_for_user', async (_evt, { user_id }) => {
    if(isSecondaryDevice()){ return await fetchFromAPI(`/permissions/user/${user_id}`); }
    if(!user_id) return { ok:false, error:'معرّف المستخدم مفقود' };
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        const [uRows] = await conn.query('SELECT role, username FROM users WHERE id=? LIMIT 1', [user_id]);
        if(!uRows.length) return { ok:false, error:'المستخدم غير موجود' };
        const role = uRows[0].role;
        const username = uRows[0].username;

        const [rows] = await conn.query('SELECT perm_key FROM user_permissions WHERE user_id=?', [user_id]);

        if (role === 'admin' || role === 'super' || username === 'superAdmin') {
          const [allPerms] = await conn.query('SELECT perm_key FROM permissions');
          return { ok:true, keys: allPerms.map(r => r.perm_key) };
        }

        const keys = rows.map(r => r.perm_key);
        return { ok:true, keys };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل الجلب' }; }
  });

  // Set permissions for a user (replace)
  ipcMain.handle('perms:set_for_user', async (_evt, { user_id, keys }) => {
    if(!user_id || !Array.isArray(keys)) return { ok:false, error:'بيانات غير مكتملة' };
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        const [uRows] = await conn.query('SELECT username, role FROM users WHERE id=? LIMIT 1', [user_id]);
        if(uRows.length){
          const user = uRows[0];
          if(user.username === 'superAdmin' || user.role === 'admin' || user.role === 'super'){
            return { ok:false, error:'لا يمكن تعديل صلاحيات المدير' };
          }
        }
        await conn.beginTransaction();
        await conn.query('DELETE FROM user_permissions WHERE user_id=?', [user_id]);
        if(keys.length){
          const values = keys.map(k => [user_id, k]);
          await conn.query('INSERT INTO user_permissions (user_id, perm_key) VALUES ?', [values]);
        }
        await conn.commit();
        return { ok:true };
      } catch(e){
        try{ await conn.rollback(); }catch(_){ }
        if(e && e.code === 'ER_NO_REFERENCED_ROW_2'){
          return { ok:false, error:'صلاحية غير معرّفة' };
        }
        console.error(e); return { ok:false, error:'فشل الحفظ' };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل الاتصال بقاعدة البيانات' }; }
  });
}

module.exports = { registerPermissionsIPC }; 