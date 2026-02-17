// Daily email scheduler: send daily sales PDF with the SAME UI as the daily report
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const nodemailer = require('nodemailer');
const { getPool, DB_NAME } = require('../db/connection');
const { emailDbBackup } = require('./backup');

let __timer = null;
let __lastConfigKey = '';
let __timerBackup = null;
let __autoSubmitStarted = false;

async function readSettings(conn){
  const [[s]] = await conn.query('SELECT * FROM app_settings WHERE id=1');
  return s || {};
}

function sameKey(s){
  const parts = [
    s.daily_email_enabled, s.daily_email_time,
    s.db_backup_enabled, s.db_backup_time,
    s.smtp_host, s.smtp_port, s.smtp_secure, s.smtp_user, s.smtp_pass, s.email
  ].map(v=>String(v||''));
  return parts.join('|');
}

function msUntil(timeHHMM){
  if(!timeHHMM) return 60*60*1000; // 1h safety retry
  const [hh, mm] = String(timeHHMM).slice(0,5).split(':').map(n=>parseInt(n,10)||0);
  const now = new Date();
  const next = new Date(); next.setHours(hh, mm, 0, 0);
  if(next <= now){ next.setDate(next.getDate()+1); }
  return next - now;
}

async function generateDailyReportPDFBuffer(){
  // احفظ النافذة الحالية النشطة لإرجاع التركيز إليها لاحقاً
  const { BrowserWindow: BW } = require('electron');
  const activeWin = BW.getFocusedWindow();
  
  // Load the same daily.html in a hidden BrowserWindow with the app preload to access IPC and data
  const win = new BrowserWindow({
    show: false,
    width: 1200,
    height: 900,
    x: -20000,
    y: -20000,
    skipTaskbar: true,
    focusable: false,
    frame: false,
    transparent: false,
    alwaysOnTop: false,
    minimizable: false,
    maximizable: false,
    closable: true,
    hasShadow: false,
    thickFrame: false,
    enableLargerThanScreen: true,
    acceptFirstMouse: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      backgroundThrottling: false,
    }
  });
  
  // منع النافذة من الظهور أو التركيز عليها
  win.on('focus', () => {
    if(activeWin && !activeWin.isDestroyed()){
      activeWin.focus();
    }
  });
  try{
    const fileUrl = path.join(__dirname, '../renderer/reports/daily.html');
    await win.loadFile(fileUrl);
    // Wait for data to populate: check for load complete flag
    await win.webContents.executeJavaScript(`new Promise(resolve=>{
      let checkCount = 0;
      const check=()=>{ 
        checkCount++;
        try{ 
          // التحقق من أن دالة load() قد اكتملت
          if(window.__dailyReportLoadComplete === true){
            console.log('[PDF] Load complete flag detected at check:', checkCount);
            resolve(true); 
            return; 
          } 
        }catch(e){ 
          console.log('[PDF] Check error:', e);
        }
        if(checkCount > 75){ 
          console.log('[PDF] Timeout reached after', checkCount, 'checks');
          resolve(true); 
          return; 
        }
        setTimeout(check, 400);
      }; 
      check();
    })`, { timeout: 60000 });
    // انتظار إضافي للتأكد من تحميل جميع البيانات بالكامل وعرضها في DOM
    await new Promise(resolve => setTimeout(resolve, 3000));
    // فتح جميع الأقسام المطوية (details) لعرضها في التقرير الكامل
    await win.webContents.executeJavaScript(`
      try{
        const allDetails = document.querySelectorAll('details');
        allDetails.forEach(d => d.setAttribute('open', ''));
      }catch(_){}
    `);
    // انتظار قصير للتأكد من تطبيق التغييرات
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('[PDF] Starting PDF generation...');
    const pdf = await win.webContents.printToPDF({
      marginsType: 1,
      pageSize: 'A4',
      printBackground: true,
      landscape: false,
    });
    console.log('[PDF] PDF generated successfully. Size:', pdf.length, 'bytes');
    return pdf; // Buffer
  } finally {
    try{ 
      // تأكد من إغلاق النافذة تماماً
      if(!win.isDestroyed()){
        win.destroy(); 
      }
      // أعد التركيز على النافذة الأصلية
      if(activeWin && !activeWin.isDestroyed()){
        activeWin.focus();
        activeWin.show();
      }
    }catch(_){ }
  }
}

async function sendEmail(s, filename, pdfBuffer){
  if(!s.smtp_host || !s.smtp_user || !s.smtp_pass || !s.email){ throw new Error('SMTP/email settings incomplete'); }

  const base = {
    host: s.smtp_host,
    auth: { user: s.smtp_user, pass: s.smtp_pass },
  };

  // Build attempts: prefer user's selection, then try the alternative combo automatically
  const userPort = Number(s.smtp_port||0);
  const userSecure = !!s.smtp_secure;
  const first = { ...base, port: userPort || (userSecure ? 465 : 587), secure: userSecure };
  const second = first.port === 465 && first.secure === true
    ? { ...base, port: 587, secure: false }
    : { ...base, port: 465, secure: true };

  // Build branded subject/body similar to DB backup
  const shopName = (s.seller_legal_name || s.company_name || 'المتجر').toString();
  const shopLocation = s.company_location ? ` — ${s.company_location}` : '';
  const now = new Date();
  const stampNum = (()=>{ const d = now; const dd=String(d.getDate()).padStart(2,'0'); const mm=String(d.getMonth()+1).padStart(2,'0'); const yyyy=d.getFullYear(); const hh=String(d.getHours()).padStart(2,'0'); const mi=String(d.getMinutes()).padStart(2,'0'); return `${dd}-${mm}-${yyyy} ${hh}:${mi}`; })();
  const subject = `التقرير اليومي - ${shopName}`;
  const text = `تم إنشاء تقرير المبيعات اليومي.\nالمتجر: ${shopName}${shopLocation ? (' - ' + s.company_location) : ''}\nالتاريخ والوقت: ${stampNum}\nالملف: ${filename}\n\nهذا النظام مقدم من: مؤسسة تعلم التقنيات`;
  const html = `
    <div style="font-family:'Cairo',Segoe UI,Tahoma,sans-serif;direction:rtl;text-align:right;color:#111827;background:#f9fafb;padding:20px"> 
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
        <div style="padding:18px 22px;background:linear-gradient(135deg,#10b981,#059669);color:#fff">
          <div style="font-size:18px;font-weight:800">التقرير اليومي للمبيعات</div>
          <div style="opacity:.9;font-size:13px">${stampNum}</div>
        </div>
        <div style="padding:22px">
          <div style="font-weight:800;font-size:16px;margin-bottom:6px">${shopName}</div>
          ${shopLocation ? `<div style=\"color:#4b5563;font-size:13px;margin-bottom:12px\">${s.company_location}</div>` : ''}
          <div style="color:#374151;font-size:14px;line-height:1.8">
            تم إنشاء تقرير المبيعات اليومي وإرفاقه مع هذه الرسالة.<br/>
            اسم الملف: <span style="font-family:monospace">${filename}</span><br/>
            <span style="color:#6b7280">هذا النظام مقدم من: مؤسسة تعلم التقنيات</span>
          </div>
        </div>
        <div style="padding:14px 22px;background:#f3f4f6;color:#6b7280;font-size:12px">
          أُرسلت بواسطة نظام نقاط البيع.
        </div>
      </div>
    </div>`;

  const attempts = [first, second];
  let lastErr = null;
  for(const cfg of attempts){
    try{
      const transporter = nodemailer.createTransport(cfg);
      const info = await transporter.sendMail({
        from: s.smtp_user,
        to: s.email,
        subject,
        text,
        html,
        attachments: [ { filename, content: pdfBuffer, contentType: 'application/pdf' } ]
      });
      return info;
    }catch(e){
      lastErr = e; console.error('SMTP attempt failed', cfg, e && e.message);
      // continue to next attempt
    }
  }
  throw lastErr || new Error('SMTP send failed');
}

async function tick(){
  try{
    const pool = await getPool();
    const conn = await pool.getConnection();
    try{
      await conn.query(`USE \`${DB_NAME}\``);
      const s = await readSettings(conn);
      const key = sameKey(s);
      if(key !== __lastConfigKey){ __lastConfigKey = key; }
      clearTimeout(__timer); __timer = null;
      clearTimeout(__timerBackup); __timerBackup = null;

      // Daily sales email scheduler
      if(s.daily_email_enabled){
        const wait = msUntil(s.daily_email_time || '09:00');
        __timer = setTimeout(async ()=>{
          try{
            const pdf = await generateDailyReportPDFBuffer();
            const today = new Date();
            const y = today.getFullYear(); const m = String(today.getMonth()+1).padStart(2,'0'); const d = String(today.getDate()).padStart(2,'0');
            const name = `daily-report-${y}-${m}-${d}.pdf`;
            await sendEmail(s, name, pdf);
            await conn.query('UPDATE app_settings SET daily_email_last_sent=CURDATE() WHERE id=1');
          }catch(e){ console.error('daily email send failed', e); }
          finally{ tick(); }
        }, wait);
      } else {
        __timer = setTimeout(tick, 6*60*60*1000);
      }

      // Daily DB backup email scheduler
      if(s.db_backup_enabled){
        const w2 = msUntil(s.db_backup_time || '03:00');
        __timerBackup = setTimeout(async ()=>{
          try{
            await emailDbBackup(s, s.email);
          }catch(e){ console.error('db backup email failed', e); }
          finally{ tick(); }
        }, w2);
      }

    } finally { conn.release(); }
  }catch(e){ console.error('scheduler tick failed', e); __timer = setTimeout(tick, 60*60*1000); }
}

function registerDailyEmailScheduler(){
  try{ clearTimeout(__timer); }catch(_){ }
  try{ clearTimeout(__timerBackup); }catch(_){ }
  tick();
  ipcMain.handle('scheduler:trigger_daily_email', async ()=>{ try{ clearTimeout(__timer); }catch(_){ } await tick(); return { ok:true }; });
  ipcMain.handle('scheduler:trigger_backup', async ()=>{ try{ clearTimeout(__timerBackup); }catch(_){ } await tick(); return { ok:true }; });
  // Manual immediate send of daily report (generate now and email)
  ipcMain.handle('scheduler:send_daily_now', async ()=>{
    try{
      console.log('[Scheduler] Starting manual daily report send...');
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        const s = await readSettings(conn);
        console.log('[Scheduler] Settings loaded, generating PDF...');
        const pdf = await generateDailyReportPDFBuffer();
        console.log('[Scheduler] PDF generated, preparing to send email...');
        const now = new Date();
        const y = now.getFullYear(); const m = String(now.getMonth()+1).padStart(2,'0'); const d = String(now.getDate()).padStart(2,'0');
        const name = `daily-report-${y}-${m}-${d}.pdf`;
        await sendEmail(s, name, pdf);
        console.log('[Scheduler] Email sent successfully!');
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){ 
      console.error('[Scheduler] Error sending daily report:', e);
      return { ok:false, error: String(e && e.message || e) }; 
    }
  });
}

async function processPendingZatcaInvoices(){
  if(__autoSubmitStarted && __isSubmissionRunning) return; // avoid overlap if called from multiple places
  // We use a shared lock logic
  if(__isSubmissionRunning) return;
  __isSubmissionRunning = true;

  const { getPool, DB_NAME } = require('../db/connection');
  const LocalZatcaBridge = require('./local-zatca');
  const log = (...args) => console.log('[ZATCA-AUTO]', ...args);
  
  try{
    log('Checking for unsent invoices...');
    const pool = await getPool();
    const conn = await pool.getConnection();
    try{
      await conn.query(`USE \`${DB_NAME}\``);
      // respect ZATCA toggle: do nothing if disabled
      const [[s]] = await conn.query('SELECT zatca_enabled FROM app_settings WHERE id=1');
      if(!s || !s.zatca_enabled){ log('skip: zatca_enabled=0'); return; }
      
      // pick unsent invoices: never sent OR failed/rejected invoices to retry (including NOT_REPORTED)
      const [rows] = await conn.query(`
        SELECT id FROM sales 
        WHERE (
          (
            (zatca_status IS NULL OR zatca_status NOT IN ('submitted','accepted'))
            AND (zatca_submitted IS NULL)
          )
          OR (zatca_status = 'rejected')
        )
        AND (doc_type IS NULL OR doc_type = '' OR doc_type = 'invoice' OR doc_type = 'credit_note')
        AND (zatca_response IS NULL OR zatca_response NOT LIKE '%REPORTED%' OR zatca_response LIKE '%NOT_REPORTED%')
        ORDER BY id ASC
      `);
      
      log('Pending count:', rows.length);
      
      if(rows.length > 0){
        const bridge = LocalZatcaBridge.getInstance();
        for(const r of rows){
          try{
            log('Submitting sale:', r.id);
            await bridge.submitSaleById(r.id);
            log('Submitted sale:', r.id);
          }catch(e){ console.error('ZATCA auto submit failed for sale', r.id, e && e.message || e); }
          // wait 2 seconds between invoices to avoid overwhelming the local service
          await new Promise(res=>setTimeout(res, 2000));
        }
      }
    } finally { conn.release(); }
  }catch(e){ console.error('unsent submit failed', e); }
  finally { __isSubmissionRunning = false; }
}

let __isSubmissionRunning = false;

async function submitUnsentInvoicesHourly(){
  if(__autoSubmitStarted) return; 
  __autoSubmitStarted = true;
  
  // Run immediately on startup
  processPendingZatcaInvoices();
  
  // Then every 15 minutes
  setInterval(processPendingZatcaInvoices, 15*60*1000);
}

// Internal helper for low stock emails (reused by products update and future hooks)
async function __sendLowStockEmailInternal(settings, items){
  if(!settings || !Array.isArray(items) || items.length===0) return null;
  const nodemailer = require('nodemailer');
  const s = settings;
  if(!s.smtp_host || !s.smtp_user || !s.smtp_pass || !s.email){ throw new Error('SMTP/email settings incomplete'); }
  const base = { host: s.smtp_host, auth: { user: s.smtp_user, pass: s.smtp_pass } };
  const userPort = Number(s.smtp_port||0);
  const userSecure = !!s.smtp_secure;
  const attempts = [
    { ...base, port: userPort || (userSecure ? 465 : 587), secure: userSecure },
    null
  ];
  attempts[1] = attempts[0].port === 465 && attempts[0].secure === true ? { ...base, port: 587, secure: false } : { ...base, port: 465, secure: true };

  const shopName = (s.seller_legal_name || s.company_name || s.sales_name || 'المتجر').toString();
  const shopAddress = (s.company_location || '').toString();
  const now = new Date();
  const pad2 = (n)=> String(n).padStart(2,'0');
  const stamp = `${pad2(now.getDate())}-${pad2(now.getMonth()+1)}-${now.getFullYear()} ${pad2(now.getHours())}:${pad2(now.getMinutes())}`;

  const subject = `تنبيه مخزون منخفض - ${shopName}`;

  const rows = items.map((it,i)=>{
    const name = String(it.name||'').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const qty = Number(it.stock||0).toFixed(0);
    return `<tr><td style="padding:10px 12px;border-bottom:1px solid #eee">${i+1}</td><td style="padding:10px 12px;border-bottom:1px solid #eee">${name}</td><td style="padding:10px 12px;border-bottom:1px solid #eee;font-family:monospace">${qty}</td></tr>`;
  }).join('');

  const html = `
    <div style="font-family:'Cairo',Segoe UI,Tahoma,sans-serif;direction:rtl;text-align:right;color:#111827;background:#f9fafb;padding:22px">
      <div style="max-width:680px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
        <div style="padding:18px 22px;background:linear-gradient(135deg,#ef4444,#b91c1c);color:#fff">
          <div style="font-size:18px;font-weight:800">⚠️ تم نفاد/انخفاض المخزون</div>
          <div style="opacity:.9;font-size:13px">${stamp}</div>
        </div>
        <div style="padding:22px">
          <div style="font-weight:800;font-size:16px;margin-bottom:4px">${shopName}</div>
          ${shopAddress ? `<div style="color:#6b7280;font-size:13px;margin-bottom:10px">${shopAddress}</div>` : ''}
          <div style="color:#374151;font-size:14px;line-height:1.9;margin-bottom:12px">
            نود إخطاركم بأن الأصناف التالية وصلت إلى حد التنبيه أو نفدت.<br/>
            يُرجى إعادة الطلب أو تحديث المخزون.
          </div>
          <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #eee;border-radius:8px;overflow:hidden">
            <thead>
              <tr style="background:#f9fafb;color:#111827;text-align:right">
                <th style="padding:10px 12px;border-bottom:1px solid #eee">#</th>
                <th style="padding:10px 12px;border-bottom:1px solid #eee">الصنف</th>
                <th style="padding:10px 12px;border-bottom:1px solid #eee">الكمية الحالية</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div style="padding:14px 22px;background:#f3f4f6;color:#6b7280;font-size:12px">
          أُرسلت بواسطة نظام نقاط البيع.
          <div style="margin-top:6px;color:#4b5563">هذه الرسالة مقدمة من مؤسسة تعلم التقنيات</div>
        </div>
      </div>
    </div>`;

  const text = `تنبيه مخزون منخفض\n${shopName}${shopAddress ? ` - ${shopAddress}` : ''}\n\n${items.map((it,i)=>`${i+1}. ${it.name} — الكمية الحالية: ${Number(it.stock||0)}`).join('\n')}\n\nهذه الرسالة مقدمة من مؤسسة تعلم التقنيات`;

  let lastErr = null;
  for(const cfg of attempts){
    try{
      const transporter = nodemailer.createTransport(cfg);
      const info = await transporter.sendMail({
        from: s.smtp_user,
        to: s.email,
        subject,
        text,
        html
      });
      return info;
    }catch(e){ lastErr = e; }
  }
  throw lastErr || new Error('SMTP send failed');
}

module.exports = { registerDailyEmailScheduler, submitUnsentInvoicesHourly, __sendLowStockEmailInternal, processPendingZatcaInvoices };