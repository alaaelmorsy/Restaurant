// Authentication handler using MySQL and bcrypt
const bcrypt = require('bcryptjs');
const { ipcMain } = require('electron');
const { getPool, DB_NAME } = require('../db/connection');

async function ensureAdminUser() {
  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    await conn.query(`USE \`${DB_NAME}\``);
    const [rows] = await conn.query('SELECT COUNT(*) as c FROM users');
    if (rows[0].c === 0) {
      const passwordHash = '123456';
      const [res] = await conn.query(
        'INSERT INTO users (username, password_hash, full_name, role, is_active) VALUES (?, ?, ?, ?, 1)',
        ['admin', passwordHash, 'Administrator', 'admin']
      );
      try {
        const adminId = res && res.insertId ? res.insertId : null;
        if (adminId) {
          await conn.query('INSERT IGNORE INTO user_permissions (user_id, perm_key) SELECT ?, perm_key FROM permissions', [adminId]);
        }
      } catch(_) { }
    }
    
    const [superAdminRows] = await conn.query('SELECT id FROM users WHERE username = ? LIMIT 1', ['superAdmin']);
    if (superAdminRows.length === 0) {
      const superAdminPassword = 'LearnTech';
      const [superRes] = await conn.query(
        'INSERT INTO users (username, password_hash, full_name, role, is_active) VALUES (?, ?, ?, ?, 1)',
        ['superAdmin', superAdminPassword, 'Super Administrator', 'super']
      );
      try {
        const superAdminId = superRes && superRes.insertId ? superRes.insertId : null;
        if (superAdminId) {
          await conn.query('INSERT IGNORE INTO user_permissions (user_id, perm_key) SELECT ?, perm_key FROM permissions', [superAdminId]);
        }
      } catch(_) { }
    } else {
      await conn.query('UPDATE users SET role = ? WHERE username = ?', ['super', 'superAdmin']);
    }
  } finally {
    conn.release();
  }
}

function registerAuthIPC() {
  ipcMain.handle('auth:login', async (_event, { username, password }) => {
    if (!username || !password) {
      return { ok: false, error: 'يرجى إدخال اسم المستخدم وكلمة المرور' };
    }

    try {
      const pool = await getPool();
      const conn = await pool.getConnection();
      try {
        await conn.query(`USE \`${DB_NAME}\``);
        const [rows] = await conn.query('SELECT id, username, password_hash, full_name, role, is_active FROM users WHERE username = ? LIMIT 1', [username]);
        if (rows.length === 0) {
          return { ok: false, error: 'بيانات الدخول غير صحيحة' };
        }
        const user = rows[0];
        if (!user.is_active) {
          return { ok: false, error: 'المستخدم غير نشط' };
        }
        // Accept plain text storage; also keep backward compatibility with old bcrypt hashes
        let matched = false;
        const stored = user.password_hash || '';
        if (typeof stored === 'string' && stored.startsWith('$2')) {
          // old bcrypt-hash
          matched = await bcrypt.compare(password, stored);
        } else {
          // plain text
          matched = password === stored;
        }
        if (!matched) {
          return { ok: false, error: 'بيانات الدخول غير صحيحة' };
        }
        // On success, return minimal info
        return { ok: true, user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role } };
      } finally {
        conn.release();
      }
    } catch (err) {
      console.error('Login error:', err);
      // Provide more specific error message
      if (err.code === 'ECONNREFUSED') {
        return { ok: false, error: 'تعذر الاتصال بقاعدة البيانات. يرجى التأكد من تشغيل MySQL' };
      } else if (err.code === 'ENOTFOUND') {
        return { ok: false, error: 'خطأ في عنوان قاعدة البيانات. يرجى التحقق من الإعدادات' };
      } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
        return { ok: false, error: 'خطأ في اسم المستخدم أو كلمة المرور لقاعدة البيانات' };
      }
      return { ok: false, error: `خطأ في الاتصال بقاعدة البيانات: ${err.message || 'خطأ غير معروف'}` };
    }
  });
}

module.exports = { registerAuthIPC, ensureAdminUser };