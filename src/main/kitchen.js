// Kitchen Printers IPC: manage kitchen printers and routing by main types, and print tickets
const { ipcMain, BrowserWindow } = require('electron');
const path = require('path');
const { getPool, DB_NAME } = require('../db/connection');

function registerKitchenIPC(){
  async function ensureTables(conn){
    await conn.query(`
      CREATE TABLE IF NOT EXISTS kitchen_printers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        device_name VARCHAR(256) NOT NULL,
        is_active TINYINT NOT NULL DEFAULT 1,
        paper_width_mm INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS kitchen_routes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        printer_id INT NOT NULL,
        type_name VARCHAR(128) NOT NULL,
        UNIQUE KEY uniq_route (printer_id, type_name),
        CONSTRAINT fk_kr_printer FOREIGN KEY (printer_id) REFERENCES kitchen_printers(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  }

  // list printers with routes
  ipcMain.handle('kitchen:list', async () => {
    try{
      const pool = await getPool(); const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``); await ensureTables(conn);
        const [printers] = await conn.query('SELECT * FROM kitchen_printers ORDER BY id ASC');
        const ids = printers.map(p => p.id);
        let routesBy = new Map();
        if(ids.length){
          const placeholders = ids.map(()=>'?').join(',');
          const [routes] = await conn.query(`SELECT printer_id, type_name FROM kitchen_routes WHERE printer_id IN (${placeholders})`, ids);
          routes.forEach(r => {
            const arr = routesBy.get(r.printer_id) || []; arr.push(r.type_name); routesBy.set(r.printer_id, arr);
          });
        }
        const items = printers.map(p => ({...p, types: routesBy.get(p.id) || [] }));
        return { ok:true, items };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'تعذر تحميل طابعات المطبخ' }; }
  });

  // add printer (name is auto = device_name)
  ipcMain.handle('kitchen:add', async (_e, payload) => {
    const { device_name, paper_width_mm } = payload || {};
    if(!device_name) return { ok:false, error:'اسم الطابعة مطلوب' };
    try{
      const pool = await getPool(); const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``); await ensureTables(conn);
        const autoName = String(device_name);
        const [res] = await conn.query('INSERT INTO kitchen_printers (name, device_name, paper_width_mm) VALUES (?,?,NULL)', [autoName, device_name]);
        return { ok:true, id: res.insertId };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل إضافة الطابعة' }; }
  });

  // update printer (name is kept in sync with device_name)
  ipcMain.handle('kitchen:update', async (_e, id, payload) => {
    const pid = (id && id.id) ? id.id : id; if(!pid) return { ok:false, error:'معرّف مفقود' };
    const { device_name, paper_width_mm, is_active } = payload || {};
    try{
      const pool = await getPool(); const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``); await ensureTables(conn);
        const autoName = device_name ? String(device_name) : undefined;
        await conn.query('UPDATE kitchen_printers SET name=?, device_name=?, paper_width_mm=NULL, is_active=? WHERE id=?', [autoName, device_name, (is_active?1:0), pid]);
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل التعديل' }; }
  });

  // list system printers
  ipcMain.handle('kitchen:list_system_printers', async (event) => {
    try{
      const printers = event.sender.getPrinters ? event.sender.getPrinters() : (event.sender.getPrintersAsync ? await event.sender.getPrintersAsync() : []);
      // map to simple array { name, isDefault }
      const items = (printers||[]).map(p => ({ name: p.name, isDefault: !!p.isDefault }));
      return { ok:true, items };
    }catch(e){ console.error(e); return { ok:false, error:'تعذر جلب طابعات النظام' }; }
  });

  // delete printer
  ipcMain.handle('kitchen:delete', async (_e, id) => {
    const pid = (id && id.id) ? id.id : id; if(!pid) return { ok:false, error:'معرّف مفقود' };
    try{
      const pool = await getPool(); const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``); await ensureTables(conn);
        await conn.query('DELETE FROM kitchen_printers WHERE id=?', [pid]);
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل الحذف' }; }
  });

  // set routes for a printer
  ipcMain.handle('kitchen:set_routes', async (_e, id, type_names) => {
    const pid = (id && id.id) ? id.id : id; if(!pid) return { ok:false, error:'معرّف مفقود' };
    const types = Array.isArray(type_names) ? type_names : [];
    try{
      const pool = await getPool(); const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``); await ensureTables(conn);
        await conn.query('DELETE FROM kitchen_routes WHERE printer_id=?', [pid]);
        for(const t of types){ if(String(t||'').trim()){ await conn.query('INSERT INTO kitchen_routes (printer_id, type_name) VALUES (?,?)', [pid, String(t)]); } }
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل حفظ الأقسام للطابعة' }; }
  });

  // simple ticket renderer
  async function printHtmlToDevice({ html, deviceName, copies, marginLeftMm = 0, marginRightMm = 0 }){
    const win = new BrowserWindow({ width: 420, height: 680, show:false, webPreferences:{ sandbox:false } });
    try{
      await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
      await new Promise((resolve) => setTimeout(resolve, 200));
      const n = Math.max(1, Number(copies||1));
      for(let i=0;i<n;i++){
        // Electron 28: use callback signature
        await new Promise((resolve, reject) => {
          win.webContents.print({
            silent:true,
            deviceName,
            printBackground: true,
            margins: { marginType: 'none' },
            pageSize: { width: 80000, height: 297000 }, // 80mm x 297mm بالميكرون
          }, (success, err) => {
            if(!success) reject(new Error(err||'print-failed')); else resolve();
          });
        });
      }
      return { ok:true };
    } finally { win.destroy(); }
  }

  function buildKitchenHtml({ header, items, roomName, saleId, waiterName, printAt, orderNo, invoiceNo, invoiceDate, marginLeftMm = 0, marginRightMm = 0 }){
    // استخدم نفس مقاس طباعة الكاشير (80mm x 297mm) بدون هوامش
    // Compact 80mm-like kitchen ticket, striped rows
    const esc = (s)=>String(s||'').replace(/[&<>]/g, ch=>({ '&':'&amp;','<':'&lt;','>':'&gt;' }[ch]));
    let rowIdx = 0;
    const lines = (items||[]).map(it => {
      const name = esc(it.name||'');
      const qty = Number(it.qty||0).toFixed(0);
      const op = it.operation_name ? esc(it.operation_name) : '';
      const zebra = (rowIdx++ % 2 === 0) ? 'row even' : 'row odd';
      const desc = it.description ? `<div class="desc-under-name">${esc(it.description)}</div>` : '';
      return `<div class="${zebra}">
  <div class="cols"><div class="name">${name}${desc}</div><div class="op">${op}</div><div class="qty">${qty}</div></div>
</div>`;
    }).join('');
    const sections = [`<div class="section"><div class="head-row"><div>الصنف</div><div>العملية</div><div>الكمية</div></div>${lines}</div>`];

    const now = printAt ? new Date(printAt) : new Date();
    // احصل على رقم الفاتورة وتاريخها إن تم تمريرهما أو استخرج من saleId لاحقًا
    const invNo = invoiceNo ? String(invoiceNo) : (saleId ? ('#'+String(saleId)) : '');
    const invDate = invoiceDate ? new Date(invoiceDate) : now;
    let h = invDate.getHours();
    const ampm = h >= 12 ? 'م' : 'ص';
    h = h % 12 || 12;
    const dt = `${invDate.getFullYear()}-${String(invDate.getMonth()+1).padStart(2,'0')}-${String(invDate.getDate()).padStart(2,'0')} ${String(h).padStart(2,'0')}:${String(invDate.getMinutes()).padStart(2,'0')} ${ampm}`;

    return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
  :root{ --m-left: ${Number(marginLeftMm)||0}mm; --m-right: ${Number(marginRightMm)||0}mm; }
  @page { size: 80mm auto; margin: 0mm 6mm 6mm 6mm; }
  html, body { width: auto; }
  body{ font-family: "Cairo", system-ui,-apple-system, Segoe UI, Roboto, "Noto Kufi Arabic", Arial, sans-serif; margin:0; color:#000; display:flex; justify-content:center; padding-left: var(--m-left); padding-right: var(--m-right); padding-top:0; }
  .ticket{ width: 69mm; margin: 0; padding: 1mm; box-sizing: border-box; border: 2px solid #000; border-radius: 8px; }
  .title{ text-align:center; font-weight:900; font-size:18px; margin:0 0 6px 0; }
  /* سطور مبسطة مثل فاتورة الكاشير */
  .meta-list{ margin:4px 0; font-size:10px; font-weight:900; color:#000; line-height:1.3; }
  .meta-list .single-line{ display:flex; justify-content:space-between; align-items:center; gap:4px; padding:2px 0; white-space:nowrap; }
  .meta-list .single-line > span{ display:inline-block; font-size:10px; font-weight:900; }
  .meta-list .single-line b{ font-weight:900; }
  .meta-list .row-line{ display:flex; justify-content:space-between; align-items:center; gap:2px; padding:1px 0; flex-wrap:nowrap; }
  .meta-list .row-line > div{ flex:0 1 auto; white-space:nowrap; min-width:0; }
  .divider{ border-top:2px solid #000; margin:6px 0; }
  .section{ margin-bottom:6px; }
  .section-h{ background:#fff; color:#000; font-family: "Cairo", system-ui,-apple-system, Segoe UI, Roboto, "Noto Kufi Arabic", Arial, sans-serif; font-weight:900; font-size:14px; padding:4px 6px; border-radius:4px; border:2px solid #000; }
  .head-row{ display:grid; grid-template-columns: 1fr .9fr .5fr; gap:0; font-size:12px; font-weight:900; color:#000; background:#fff; border:2px solid #000; border-radius:4px; overflow:hidden; margin-top:2px; }
  .head-row > div{ padding:3px 6px; border-inline-start:2px solid #000; }
  .head-row > div:first-child{ border-inline-start:0; }
  .row{ padding:0; }
  .cols{ display:grid; grid-template-columns: 1fr .9fr .5fr; gap:0; align-items:start; font-size:12px; font-weight:900; border:2px solid #000; border-top:0; }
  .cols > div{ padding:1px 6px; border-inline-start:2px solid #000; }
  .cols > div:first-child{ border-inline-start:0; }
  .name{ word-break:keep-all; overflow-wrap:anywhere; line-height:1.1; }
  .name .desc-under-name{ margin-top:2px; font-size:12px; font-weight:700; color:#000; line-height:1.1; }
  .op{ color:#000; font-weight:900; font-size:13px; }
  .qty{ font-variant-numeric: tabular-nums; text-align:center; direction:ltr; }
  .footer{ text-align:center; color:#000; font-size:10px; margin-top:6px; }
</style>
</head><body>
  <div class="ticket">
    <div class="title">طلب مطبخ</div>
    <div class="meta-list">
      <div class="single-line"><span>رقم الفاتورة: <b>${esc(invNo||'')}</b></span><span>التاريخ: <b>${esc(dt||'')}</b></span></div>
      <div class="single-line"><span>رقم الأوردر: <b>${orderNo?esc(String(orderNo)):''}</b></span><span>مدخل الفاتورة: <b>${esc(waiterName||'')}</b></span></div>
      ${roomName?`<div class=\"single-line\"><span>الغرفة: <b>${esc(roomName)}</b></span></div>`:''}
    </div>
    <div class="divider"></div>
    ${sections.join('')}
    <div class="footer">__</div>
  </div>
</body></html>`;
  }

  // test print to device
  ipcMain.handle('kitchen:test_print', async (_e, id) => {
    const pid = (id && id.id) ? id.id : id; if(!pid) return { ok:false, error:'معرّف مفقود' };
    try{
      const pool = await getPool(); const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``); await ensureTables(conn);
        const [[p]] = await conn.query('SELECT * FROM kitchen_printers WHERE id=?', [pid]);
        if(!p) return { ok:false, error:'غير موجود' };
        const html = buildKitchenHtml({ header: 'اختبار طابعة المطبخ', items:[{ name:'طلب تجريبي', qty:1 }], roomName: '', saleId: '', waiterName: '', printAt: Date.now() });
        const r = await printHtmlToDevice({ html, deviceName: p.device_name, copies: 1 });
        return r;
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل طباعة الاختبار' }; }
  });

  // print order by routing items to printers based on product category (type_name)
  ipcMain.handle('kitchen:print_order', async (_e, payload) => {
    const { items, room_name, sale_id, waiter_name, copies_per_section, order_no } = payload || {};
    const cart = Array.isArray(items) ? items : [];
    const copies = Math.max(1, Number(copies_per_section||1));
    try{
      const pool = await getPool(); const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``); await ensureTables(conn);
        // load routes
        const [printers] = await conn.query('SELECT * FROM kitchen_printers WHERE is_active=1');
        if(!printers.length) return { ok:true, skipped:true };
        const ids = printers.map(p=>p.id);
        const placeholders = ids.map(()=>'?').join(',');
        const [routes] = await conn.query(`SELECT printer_id, type_name FROM kitchen_routes WHERE printer_id IN (${placeholders})`, ids);
        const mapTypes = new Map(); // type_name -> [printer]
        routes.forEach(r => {
          const p = printers.find(pp=>pp.id===r.printer_id); if(!p) return;
          const key = String(r.type_name||'');
          const arr = mapTypes.get(key) || []; arr.push(p); mapTypes.set(key, arr);
        });
        // group items by printers
        const byPrinter = new Map();
        for(const it of cart){
          const t = String(it.category||'');
          const printersForType = mapTypes.get(t) || [];
          for(const p of printersForType){
            const arr = byPrinter.get(p.id) || []; arr.push(it); byPrinter.set(p.id, arr);
          }
        }
        // print per printer
        for(const p of printers){
          const its = byPrinter.get(p.id) || [];
          if(!its.length) continue;
          // حاول جلب رقم الفاتورة وتاريخها لعرضهما في رأس التذكرة
          let invNo=null, invDate=null;
          try{
            if(sale_id){ const [[s]] = await conn.query('SELECT invoice_no, created_at FROM sales WHERE id=?', [Number(sale_id)]); if(s){ invNo = s.invoice_no||null; invDate = s.created_at||null; } }
          }catch(_){ }
          // اقرأ هوامش الطباعة من الإعدادات العامة مثل الفاتورة العادية
          let mLeft = 0, mRight = 0;
          try{
            const [[st]] = await conn.query('SELECT print_margin_left_mm, print_margin_right_mm FROM app_settings WHERE id=1');
            if(st){ mLeft = Math.max(0, Number(st.print_margin_left_mm||0)); mRight = Math.max(0, Number(st.print_margin_right_mm||0)); }
          }catch(_){ }

          const html = buildKitchenHtml({ header: '', items: its, roomName: room_name||'', saleId: sale_id||'', waiterName: waiter_name||'', printAt: Date.now(), orderNo: (order_no||null), invoiceNo: invNo, invoiceDate: invDate, marginLeftMm: mLeft, marginRightMm: mRight });
          try{ await printHtmlToDevice({ html, deviceName: p.device_name, copies, marginLeftMm: mLeft, marginRightMm: mRight }); }catch(err){ console.error('kitchen print failed', p.device_name, err); }
        }
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل طباعة المطبخ' }; }
  });
}

// eager ensure at app start
(async () => {
  try{
    const pool = await getPool(); const conn = await pool.getConnection();
    try{
      await conn.query(`USE \`${DB_NAME}\``);
      await conn.query(`
        CREATE TABLE IF NOT EXISTS kitchen_printers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(128) NOT NULL,
          device_name VARCHAR(256) NOT NULL,
          is_active TINYINT NOT NULL DEFAULT 1,
          paper_width_mm INT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
      await conn.query(`
        CREATE TABLE IF NOT EXISTS kitchen_routes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          printer_id INT NOT NULL,
          type_name VARCHAR(128) NOT NULL,
          UNIQUE KEY uniq_route (printer_id, type_name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
    } finally { conn.release(); }
  }catch(e){ console.error('kitchen:init ensure tables failed', e); }
})();

module.exports = { registerKitchenIPC };