// Users IPC handlers (CRUD)
const { ipcMain } = require('electron');
const bcrypt = require('bcryptjs');
const { getPool, DB_NAME } = require('../db/connection');
const { isSecondaryDevice, fetchFromAPI } = require('./api-client');

function registerUsersIPC(){
  // List users
  ipcMain.handle('users:list', async () => {
    if(isSecondaryDevice()){ return await fetchFromAPI('/users'); }
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        const [rows] = await conn.query('SELECT id, username, full_name, role, is_active, created_at FROM users WHERE username != ? ORDER BY id DESC', ['superAdmin']);
        return { ok:true, items: rows };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'خطأ في تحميل المستخدمين' }; }
  });

  // Get single
  ipcMain.handle('users:get', async (_evt, { id }) => {
    if(isSecondaryDevice()){ return await fetchFromAPI(`/users/${id}`); }
    if(!id) return { ok:false, error:'معرّف مفقود' };
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        const [rows] = await conn.query('SELECT id, username, full_name, role, is_active, password_hash FROM users WHERE id=? LIMIT 1', [id]);
        if(rows.length===0) return { ok:false, error:'غير موجود' };
        return { ok:true, item: rows[0] };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'خطأ في الجلب' }; }
  });

  // Add user
  ipcMain.handle('users:add', async (_evt, payload) => {
    const { username, full_name, password, role, is_active } = payload || {};
    if(!username || !password) return { ok:false, error:'اسم المستخدم وكلمة المرور مطلوبة' };
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        const password_hash = password; // store as plain text by request
        await conn.query('INSERT INTO users (username, password_hash, full_name, role, is_active) VALUES (?,?,?,?,?)', [username, password_hash, full_name||null, role||'cashier', is_active?1:0]);
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){
      if (e && e.code === 'ER_DUP_ENTRY') return { ok:false, error:'اسم المستخدم موجود مسبقاً' };
      console.error(e); return { ok:false, error:'فشل الإضافة' };
    }
  });

  // Update user (by username)
  ipcMain.handle('users:update', async (_evt, { username, payload }) => {
    if(!username) return { ok:false, error:'اسم المستخدم مفقود' };
    if(username === 'superAdmin') return { ok:false, error:'لا يمكن تعديل هذا المستخدم' };
    const { full_name, password, role, is_active } = payload || {};
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        if(password){
          const password_hash = password;
          await conn.query('UPDATE users SET full_name=?, role=?, is_active=?, password_hash=? WHERE username=?', [full_name||null, role||'cashier', is_active?1:0, password_hash, username]);
        } else {
          await conn.query('UPDATE users SET full_name=?, role=?, is_active=? WHERE username=?', [full_name||null, role||'cashier', is_active?1:0, username]);
        }
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل التعديل' }; }
  });

  // Toggle active (السماح دائمًا بالتوقيف بدلاً من الحذف)
  ipcMain.handle('users:toggle', async (_evt, { id }) => {
    if(!id) return { ok:false, error:'معرّف مفقود' };
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        const [rows] = await conn.query('SELECT is_active, role, username FROM users WHERE id=?', [id]);
        if(rows.length===0) return { ok:false, error:'غير موجود' };
        const cur = rows[0];
        if(cur.username === 'superAdmin' || cur.role === 'super') return { ok:false, error:'لا يمكن تعديل حالة هذا المستخدم' };
        const newVal = cur.is_active ? 0 : 1;
        if((cur.role === 'admin' || cur.role === 'super') && newVal === 0){
          const [[cnt]] = await conn.query("SELECT COUNT(*) AS c FROM users WHERE (role='admin' OR role='super') AND is_active=1 AND username != 'superAdmin'");
          if(Number(cnt.c||0) <= 1){
            return { ok:false, error:'يجب أن يبقى مدير واحد على الأقل نشطًا' };
          }
        }
        await conn.query('UPDATE users SET is_active=? WHERE id=?', [newVal, id]);
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل تحديث الحالة' }; }
  });

  // Delete with constraints
  ipcMain.handle('users:delete', async (_evt, { id }) => {
    if(!id) return { ok:false, error:'معرّف مفقود' };
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        const [[ua]] = await conn.query('SELECT role, username FROM users WHERE id=? LIMIT 1', [id]);
        if(!ua) return { ok:false, error:'المستخدم غير موجود' };
        if(ua.username === 'superAdmin' || ua.role === 'super') return { ok:false, error:'لا يمكن حذف هذا المستخدم' };
        if(ua.role === 'admin' || ua.role === 'super'){
          const [[cnt]] = await conn.query("SELECT COUNT(*) AS c FROM users WHERE (role='admin' OR role='super') AND username != 'superAdmin'");
          if(Number(cnt.c||0) <= 1){
            return { ok:false, error:'لا يمكن حذف آخر مستخدم مدير.' };
          }
        }
        try{
          const [[s]] = await conn.query('SELECT COUNT(*) AS c FROM sales WHERE created_by_user_id=?', [id]);
          if(Number(s.c||0) > 0){
            return { ok:false, error:'لا يمكن حذف مستخدم قام بطباعة فواتير. يمكن فقط إيقافه.' };
          }
        }catch(_){ }
        await conn.query('DELETE FROM users WHERE id=?', [id]);
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل الحذف' }; }
  });
}

module.exports = { registerUsersIPC };