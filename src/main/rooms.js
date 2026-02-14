// Rooms IPC: professional restaurant-style rooms/tables with statuses and sessions
const { ipcMain } = require('electron');
const { getPool, DB_NAME } = require('../db/connection');
const { isSecondaryDevice, fetchFromAPI } = require('./api-client');

function registerRoomsIPC(){
  async function ensureTables(conn){
    await conn.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        section VARCHAR(64) NULL,
        capacity INT NOT NULL DEFAULT 1,
        status VARCHAR(16) NOT NULL DEFAULT 'vacant', -- vacant | occupied | reserved | pay_pending
        waiter VARCHAR(64) NULL,
        opened_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS room_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_id INT NOT NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'occupied',
        cart_json MEDIUMTEXT NULL,
        state_json MEDIUMTEXT NULL,
        notes VARCHAR(255) NULL,
        sale_id INT NULL,
        opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_room (room_id),
        CONSTRAINT fk_rs_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

    // Upgrade path: add state_json if missing
    try { await conn.query('ALTER TABLE room_sessions ADD COLUMN state_json MEDIUMTEXT NULL'); } catch(_){ /* ignore if exists */ }
  }

  ipcMain.handle('rooms:list', async (_e, q) => {
    if(isSecondaryDevice()){ return await fetchFromAPI('/rooms', q); }
    const query = q || {};
    const where = [];
    const params = [];
    if(query.section){ where.push('section = ?'); params.push(query.section); }
    if(query.status){ where.push('status = ?'); params.push(query.status); }
    const whereSql = where.length ? ('WHERE ' + where.join(' AND ')) : '';
    try{
      const pool = await getPool(); const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTables(conn);
        const [rows] = await conn.query(`SELECT * FROM rooms ${whereSql} ORDER BY section ASC, id ASC`, params);
        // join with current sessions to compute item count
        const ids = rows.map(r => r.id);
        let byId = new Map();
        if(ids.length){
          const placeholders = ids.map(()=>'?').join(',');
          const [ss] = await conn.query(`SELECT room_id, cart_json, status AS session_status FROM room_sessions WHERE room_id IN (${placeholders})`, ids);
          byId = new Map(ss.map(s => [Number(s.room_id), s]));
        }
        const out = rows.map(r => {
          const s = byId.get(Number(r.id));
          let count = 0;
          try{ const c = s && s.cart_json ? JSON.parse(s.cart_json) : []; if(Array.isArray(c)){ count = c.reduce((n,it)=> n + Number(it.qty||0), 0); } }catch(_){ }
          return { ...r, session_status: s ? s.session_status : null, cart_count: count };
        });
        return { ok:true, items: out };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'تعذر تحميل الغرف' }; }
  });

  ipcMain.handle('rooms:add', async (_e, payload) => {
    const { name, section, capacity } = payload || {};
    const nm = (name||'').trim(); if(!nm) return { ok:false, error:'اسم الغرفة مطلوب' };
    try{
      const pool = await getPool(); const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``); await ensureTables(conn);
        const [res] = await conn.query('INSERT INTO rooms (name, section, capacity, status) VALUES (?,?,?,"vacant")', [nm, section||null, Number(capacity||1)]);
        return { ok:true, id: res.insertId };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل إضافة الغرفة' }; }
  });

  ipcMain.handle('rooms:update', async (_e, id, payload) => {
    const rid = (id && id.id) ? id.id : id; if(!rid) return { ok:false, error:'معرّف الغرفة مفقود' };
    const { name, section, capacity, status, waiter } = payload || {};
    try{
      const pool = await getPool(); const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``); await ensureTables(conn);
        await conn.query('UPDATE rooms SET name=?, section=?, capacity=?, status=?, waiter=? WHERE id=?', [name||null, section||null, Number(capacity||1), status||'vacant', waiter||null, rid]);
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل تعديل الغرفة' }; }
  });

  ipcMain.handle('rooms:delete', async (_e, id) => {
    const rid = (id && id.id) ? id.id : id; if(!rid) return { ok:false, error:'معرّف الغرفة مفقود' };
    try{
      const pool = await getPool(); const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``); await ensureTables(conn);
        await conn.query('DELETE FROM rooms WHERE id=?', [rid]);
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل حذف الغرفة' }; }
  });

  ipcMain.handle('rooms:open_session', async (_e, room_id) => {
    const rid = (room_id && room_id.id) ? room_id.id : room_id; if(!rid) return { ok:false, error:'room_id مفقود' };
    try{
      const pool = await getPool(); const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``); await ensureTables(conn);
        // ensure room exists
        const [[room]] = await conn.query('SELECT * FROM rooms WHERE id=?', [rid]);
        if(!room) return { ok:false, error:'الغرفة غير موجودة' };
        // upsert session and set room occupied
        await conn.query('INSERT INTO room_sessions (room_id, status, cart_json) VALUES (?,"occupied",NULL) ON DUPLICATE KEY UPDATE status="occupied"', [rid]);
        await conn.query('UPDATE rooms SET status="occupied", opened_at=IFNULL(opened_at, NOW()) WHERE id=?', [rid]);
        const [[sess]] = await conn.query('SELECT * FROM room_sessions WHERE room_id=?', [rid]);
        return { ok:true, room: room, session: sess };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'تعذر فتح جلسة الغرفة' }; }
  });

  ipcMain.handle('rooms:get_session', async (_e, room_id) => {
    const rid = (room_id && room_id.id) ? room_id.id : room_id;
    if(isSecondaryDevice()){ return await fetchFromAPI(`/rooms/${rid}/session`); }
    if(!rid) return { ok:false, error:'room_id مفقود' };
    try{
      const pool = await getPool(); const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``); await ensureTables(conn);
        const [[sess]] = await conn.query('SELECT * FROM room_sessions WHERE room_id=?', [rid]);
        return { ok:true, session: sess || null };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'تعذر جلب جلسة الغرفة' }; }
  });

  ipcMain.handle('rooms:save_cart', async (_e, room_id, cart, state) => {
    const rid = (room_id && room_id.id) ? room_id.id : room_id; if(!rid) return { ok:false, error:'room_id مفقود' };
    const json = JSON.stringify(Array.isArray(cart) ? cart : []);
    const stateJson = JSON.stringify(state || {});
    try{
      const pool = await getPool(); const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``); await ensureTables(conn);
        await conn.query('INSERT INTO room_sessions (room_id, status, cart_json, state_json) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE cart_json=VALUES(cart_json), state_json=VALUES(state_json), status=VALUES(status)', [rid, 'occupied', json, stateJson]);
        await conn.query('UPDATE rooms SET status="occupied" WHERE id=?', [rid]);
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'تعذر حفظ سلة الغرفة' }; }
  });

  ipcMain.handle('rooms:set_status', async (_e, room_id, status) => {
    const rid = (room_id && room_id.id) ? room_id.id : room_id; if(!rid) return { ok:false, error:'room_id مفقود' };
    const st = (status||'vacant');
    try{
      const pool = await getPool(); const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``); await ensureTables(conn);
        await conn.query('UPDATE rooms SET status=? WHERE id=?', [st, rid]);
        if(st === 'vacant'){
          await conn.query('DELETE FROM room_sessions WHERE room_id=?', [rid]);
        }
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'تعذر تحديث حالة الغرفة' }; }
  });

  ipcMain.handle('rooms:clear', async (_e, room_id) => {
    const rid = (room_id && room_id.id) ? room_id.id : room_id; if(!rid) return { ok:false, error:'room_id مفقود' };
    try{
      const pool = await getPool(); const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``); await ensureTables(conn);
        await conn.query('DELETE FROM room_sessions WHERE room_id=?', [rid]);
        await conn.query('UPDATE rooms SET status="vacant", opened_at=NULL WHERE id=?', [rid]);
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'تعذر تفريغ الغرفة' }; }
  });
}

// eager ensure at app start
(async () => {
  try{
    const pool = await getPool(); const conn = await pool.getConnection();
    try{
      await conn.query(`USE \`${DB_NAME}\``);
      await conn.query(`
        CREATE TABLE IF NOT EXISTS rooms (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(128) NOT NULL,
          section VARCHAR(64) NULL,
          capacity INT NOT NULL DEFAULT 1,
          status VARCHAR(16) NOT NULL DEFAULT 'vacant',
          waiter VARCHAR(64) NULL,
          opened_at DATETIME NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
      await conn.query(`
        CREATE TABLE IF NOT EXISTS room_sessions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          room_id INT NOT NULL,
          status VARCHAR(16) NOT NULL DEFAULT 'occupied',
          cart_json MEDIUMTEXT NULL,
          state_json MEDIUMTEXT NULL,
          notes VARCHAR(255) NULL,
          sale_id INT NULL,
          opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uniq_room (room_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

      try { await conn.query('ALTER TABLE room_sessions ADD COLUMN state_json MEDIUMTEXT NULL'); } catch(_){ /* ignore if exists */ }
    } finally { conn.release(); }
  }catch(e){ console.error('rooms:init ensure tables failed', e); }
})();

module.exports = { registerRoomsIPC };