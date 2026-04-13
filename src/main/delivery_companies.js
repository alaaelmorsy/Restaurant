const { ipcMain } = require('electron');
const { getPool, DB_NAME } = require('../db/connection');
const { isSecondaryDevice, fetchFromAPI } = require('./api-client');

function registerDeliveryCompaniesIPC(){
  async function ensureTables(conn){
    await conn.query(`
      CREATE TABLE IF NOT EXISTS delivery_companies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
        active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  }

  ipcMain.handle('delivery_companies:list', async (_e, query) => {
    if(isSecondaryDevice()){ return await fetchFromAPI('/delivery-companies', query || {}); }
    const q = query || {};
    const onlyActive = q.only_active ? 1 : 0;
    const term = String(q.term || '').trim();
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTables(conn);
        const terms = [];
        const params = [];
        if(onlyActive){ terms.push('active=1'); }
        if(term){ terms.push('name LIKE ?'); params.push('%' + term + '%'); }
        const where = terms.length ? ('WHERE ' + terms.join(' AND ')) : '';
        const [rows] = await conn.query(`SELECT * FROM delivery_companies ${where} ORDER BY id DESC`, params);
        return { ok:true, items: rows };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'تعذر جلب شركات التوصيل' }; }
  });

  ipcMain.handle('delivery_companies:add', async (_e, payload) => {
    try{
      const p = payload || {};
      const name = String(p.name || '').trim();
      const discountRaw = Number(p.discount_percent);
      const discount = Number.isFinite(discountRaw) ? discountRaw : 0;
      if(!name){ return { ok:false, error:'اسم الشركة مطلوب' }; }
      if(discount < 0 || discount > 100){ return { ok:false, error:'نسبة الخصم يجب أن تكون بين 0 و 100' }; }
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTables(conn);
        const [res] = await conn.query('INSERT INTO delivery_companies (name, discount_percent, active) VALUES (?,?,1)', [name, Number(discount.toFixed(2))]);
        return { ok:true, id: res.insertId };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'تعذر إضافة شركة التوصيل' }; }
  });

  ipcMain.handle('delivery_companies:update', async (_e, { id }, payload) => {
    try{
      const p = payload || {};
      const fields = [];
      const params = [];
      if(typeof p.name === 'string'){
        const name = String(p.name).trim();
        if(!name){ return { ok:false, error:'اسم الشركة مطلوب' }; }
        fields.push('name=?');
        params.push(name);
      }
      if(typeof p.discount_percent !== 'undefined'){
        const discount = Number(p.discount_percent);
        if(!Number.isFinite(discount) || discount < 0 || discount > 100){
          return { ok:false, error:'نسبة الخصم يجب أن تكون بين 0 و 100' };
        }
        fields.push('discount_percent=?');
        params.push(Number(discount.toFixed(2)));
      }
      if(!fields.length){ return { ok:false, error:'لا توجد حقول للتعديل' }; }
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTables(conn);
        params.push(Number(id));
        await conn.query(`UPDATE delivery_companies SET ${fields.join(', ')} WHERE id=?`, params);
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'تعذر تحديث شركة التوصيل' }; }
  });

  ipcMain.handle('delivery_companies:toggle', async (_e, { id }) => {
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTables(conn);
        await conn.query('UPDATE delivery_companies SET active = 1 - active WHERE id=?', [Number(id)]);
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'تعذر تغيير الحالة' }; }
  });

  ipcMain.handle('delivery_companies:delete', async (_e, { id }) => {
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTables(conn);
        await conn.query('DELETE FROM delivery_companies WHERE id=?', [Number(id)]);
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'تعذر حذف شركة التوصيل' }; }
  });

  ipcMain.handle('delivery_companies:get', async (_e, { id }) => {
    if(isSecondaryDevice()){ return await fetchFromAPI(`/delivery-companies/${id}`); }
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTables(conn);
        const [[row]] = await conn.query('SELECT * FROM delivery_companies WHERE id=? LIMIT 1', [Number(id)]);
        if(!row){ return { ok:false, error:'غير موجود' }; }
        return { ok:true, item: row };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'تعذر جلب شركة التوصيل' }; }
  });
}

module.exports = { registerDeliveryCompaniesIPC };
