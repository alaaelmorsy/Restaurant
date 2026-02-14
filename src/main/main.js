// Electron main process
const { app, BrowserWindow, ipcMain, session, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { registerAuthIPC, ensureAdminUser } = require('./auth');
const { registerUsersIPC } = require('./users');
const { registerProductsIPC } = require('./products');
const { registerCustomersIPC } = require('./customers');
const { registerTypesIPC } = require('./types');
const { registerSettingsIPC, registerDeviceModeIPC } = require('./settings');
const { registerSalesIPC } = require('./sales');
const { registerOperationsIPC } = require('./operations');
const registerSpriteSheetIPC = require('./sprite-sheet');
const { registerPurchasesIPC } = require('./purchases');
const { registerInventoryIPC } = require('./inventory');
const { registerRoomsIPC } = require('./rooms');
const { registerKitchenIPC } = require('./kitchen');
const { registerCustomerPricingIPC } = require('./customer_pricing');
const { registerOffersIPC } = require('./offers');
const { registerDriversIPC } = require('./drivers');
const { registerPermissionsIPC } = require('./permissions');
const { registerDailyEmailScheduler, submitUnsentInvoicesHourly } = require('./scheduler');
const { initDbFromSaved, updateConfig, getConfig, testConnection } = require('../db/connection');
// const ZatcaIntegration = require('./zatca');
// const ZatcaSalesIntegration = require('./zatca-sales-integration');
const { registerBackupIPC } = require('./backup');
const { startAPIServer } = require('./api-server');
const si = require('systeminformation');
const whatsappService = require('./whatsapp-service');
const customerDisplay = require('./customer-display/index');
const { setupAutoUpdater, registerUpdateIPC } = require('./updater');

function getResourcePath(relativePath) {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, relativePath);
  }
  return path.join(__dirname, '..', '..', relativePath);
}

// --- Optimized Hardware Checks (Cached) ---
let cachedHardware = null;
async function getHardwareIds() {
  if (cachedHardware) return cachedHardware;
  try {
    const [baseboard, system, diskLayout, networkInterfaces] = await Promise.all([
      si.baseboard(),
      si.system(),
      si.diskLayout(),
      si.networkInterfaces()
    ]);

    const boardSerial = (baseboard.serial || system.serial || '').trim().toUpperCase();
    
    // Disk serials
    const diskSerials = (diskLayout || []).map(d => (d.serialNum || '').trim().toUpperCase()).filter(Boolean);
    
    // MAC addresses
    const macs = (Array.isArray(networkInterfaces) ? networkInterfaces : [networkInterfaces])
      .flat()
      .map(n => (n.mac || '').trim().toUpperCase())
      .filter(Boolean);

    cachedHardware = { boardSerial, diskSerials, macs };
    return cachedHardware;
  } catch (e) {
    console.error('Hardware check failed:', e);
    return { boardSerial: '', diskSerials: [], macs: [] };
  }
}

const crypto = require('crypto');
// Legacy sync functions removed/deprecated in favor of getHardwareIds

function expectedCode(uuid){
  const SECRET = 'POS_SA_LICENSE_SECRET_v1';
  return crypto.createHash('sha256').update(String(uuid||'') + '|' + SECRET).digest('hex').toUpperCase();
}
async function readLicense(){
  // Read activation from app_settings table
  try{
    const { getPool, DB_NAME } = require('../db/connection');
    const pool = await getPool();
    if(!pool) return null;
    const conn = await pool.getConnection();
    try{
      await conn.query(`USE \`${DB_NAME}\``);
      
      const [rows] = await conn.query(
        'SELECT license_code, license_uuid FROM app_settings WHERE id=1 LIMIT 1'
      );
      
      if(rows && rows[0] && rows[0].license_code){
        return { uuid: rows[0].license_uuid||null, code: rows[0].license_code||null };
      }
    }finally{ conn.release(); }
  }catch(err){ 
    console.log('readLicense error:', err.message || err);
  }
  return null;
}
async function writeLicense(data){
  // Save activation for this device to activated_devices table
  try{
    const { getPool, DB_NAME } = require('../db/connection');
    const pool = await getPool();
    const conn = await pool.getConnection();
    try{
      await conn.query(`USE \`${DB_NAME}\``);
      await conn.query(
        'INSERT INTO activated_devices (device_uuid, device_type, device_code, activated_at) VALUES (?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE device_code=VALUES(device_code), activated_at=NOW()',
        [data.uuid||null, data.type||'board', data.code||null]
      );
      await conn.query(
        'UPDATE app_settings SET license_code=?, license_uuid=?, license_activated_at=NOW() WHERE id=1',
        [data.code||null, data.uuid||null]
      );
      return true;
    }finally{ conn.release(); }
  }catch(_){ return false; }
}
async function resetLicense(){
  // Clear all activated devices from DB
  try{
    const { getPool, DB_NAME } = require('../db/connection');
    const pool = await getPool();
    const conn = await pool.getConnection();
    try{
      await conn.query(`USE \`${DB_NAME}\``);
      await conn.query('DELETE FROM activated_devices');
      await conn.query('UPDATE app_settings SET license_code=NULL, license_uuid=NULL, license_activated_at=NULL WHERE id=1');
      return true;
    }finally{ conn.release(); }
  }catch(_){ return false; }
}
async function isLicensed(){
  try{
    const lic = await readLicense();
    if(!lic || !lic.code) return false;
    
    const hw = await getHardwareIds();
    const licUuidUpper = String(lic.uuid||'').toUpperCase();
    const licUuidNormalized = licUuidUpper.replace(/[\s\-:]/g, '');
    
    // Try baseboard
    if(hw.boardSerial){
      const boardId = hw.boardSerial.toUpperCase();
      const boardNormalized = boardId.replace(/[\s-]/g, '');
      const exp = expectedCode(hw.boardSerial);
      if(String(lic.code).toUpperCase() === exp && (licUuidUpper === boardId || licUuidNormalized === boardNormalized)){ return true; }
    }
    
    // Try Ethernet MACs
    if(hw.macs && hw.macs.length > 0){
      for(const mac of hw.macs){
        const macUpper = mac.toUpperCase();
        const macNormalized = macUpper.replace(/[\s\-:]/g, '');
        const exp = expectedCode(mac);
        if(String(lic.code).toUpperCase() === exp && (licUuidUpper === macUpper || licUuidNormalized === macNormalized)){ return true; }
      }
    }
    
    // Try disk serials
    if(hw.diskSerials && hw.diskSerials.length > 0){
      for(const disk of hw.diskSerials){
        const diskUpper = disk.toUpperCase();
        const diskNormalized = diskUpper.replace(/[\s-]/g, '');
        const exp = expectedCode(disk);
        if(String(lic.code).toUpperCase() === exp && (licUuidUpper === diskUpper || licUuidNormalized === diskNormalized)){ return true; }
      }
    }
    
    return false;
  }catch(_){ return false; }
}
async function isConnectedToPrimaryServer(){
  try{
    const { getConfig, testConnection } = require('../db/connection');
    const cfg = getConfig();
    if(!cfg) return false;
    const h = cfg.host || '127.0.0.1';
    if(/^127\.0\.0\.1$/.test(h) || /^localhost$/i.test(h)) return false;
    await testConnection(cfg);
    return true;
  }catch(_){ return false; }
}
async function isAuthorized(){
  try{
    const licensed = await isLicensed();
    if(licensed) return true;
    const connected = await isConnectedToPrimaryServer();
    return connected;
  }catch(_){ return false; }
}


// License IPC handlers function
function registerLicenseIPC() {
  // IPC for license check/activation
  ipcMain.handle('license:check', async () => {
    try{ const ok = await isLicensed(); return { ok }; }catch(_){ return { ok:false }; }
  });
  ipcMain.handle('license:activate', async (_e, { code }) => {
    try{
      const rawInput = String(code||'').trim();
      if(!rawInput){ return { ok:false, error:'يرجى إدخال كود التفعيل' }; }
      const inputUpper = rawInput.toUpperCase();
      const inputNormalized = inputUpper.replace(/[\s\-:]/g, '');

      const hw = await getHardwareIds();

      // Try BASEBOARD serial
      if(hw.boardSerial){
        const boardId = String(hw.boardSerial).toUpperCase();
        const boardNormalized = boardId.replace(/[\s-]/g, '');
        if(inputUpper === boardId || inputNormalized === boardNormalized){
          const full = expectedCode(boardId);
          await writeLicense({ uuid: boardId, code: full, activated_at: Date.now(), type: 'board' });
          return { ok:true, type: 'board' };
        }
      }

      // Try DISK serials
      if(hw.diskSerials && hw.diskSerials.length > 0){
        for(const disk of hw.diskSerials){
          const diskId = String(disk).toUpperCase();
          const diskNormalized = diskId.replace(/[\s-]/g, '');
          if(inputUpper === diskId || inputNormalized === diskNormalized){
            const full = expectedCode(diskId);
            await writeLicense({ uuid: diskId, code: full, activated_at: Date.now(), type: 'disk' });
            return { ok:true, type: 'disk' };
          }
        }
      }

      // Try Ethernet MACs
      if(hw.macs && hw.macs.length > 0){
        for(const mac of hw.macs){
          const macId = String(mac).toUpperCase();
          const macNormalized = macId.replace(/[\s\-:]/g, '');
          if(inputUpper === macId || inputNormalized === macNormalized){
            const full = expectedCode(macId);
            await writeLicense({ uuid: macId, code: full, activated_at: Date.now(), type: 'mac' });
            return { ok:true, type: 'mac' };
          }
        }
      }

      return { ok:false, error:'كود التفعيل غير صحيح' };
    }catch(e){ return { ok:false, error: String(e && e.message || e) }; }
  });
  // Reset license (DB only)
  ipcMain.handle('license:reset', async () => {
    try{ const ok = await resetLicense(); return { ok }; }catch(_){ return { ok:false }; }
  });
  // Get list of activated devices (for admin)
  ipcMain.handle('license:list_devices', async () => {
    try{
      const { getPool, DB_NAME } = require('../db/connection');
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        const [rows] = await conn.query('SELECT device_uuid, device_type, activated_at FROM activated_devices ORDER BY activated_at DESC');
        return { ok: true, devices: rows || [] };
      }finally{ conn.release(); }
    }catch(e){ return { ok:false, error: String(e && e.message || e) }; }
  });
  // Hardware: expose disk serial via IPC for renderer convenience
  ipcMain.handle('hw:get_disk_serial', async () => {
    try{
      const hw = await getHardwareIds();
      const s = hw.diskSerials && hw.diskSerials.length > 0 ? hw.diskSerials[0] : '';
      return { ok: !!s, serial: s || '' };
    }catch(_){ return { ok:false, error: 'تعذر قراءة رقم القرص' }; }
  });
}

function createMainWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    resizable: true,
    maximizable: true,
    center: true,
    fullscreen: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'نظام الرابط - الرئيسية',
    show: true,
    backgroundColor: '#f4f7fb',
    icon: getResourcePath(path.join('assets', 'icon', 'app.ico'))
  });

  // Optimistic UI: Load login screen immediately
  win.loadFile(path.join(__dirname, '../renderer/login/index.html'));

  // Setup auto updater
  win.once('ready-to-show', () => {
    setupAutoUpdater(win);
  });

  // Check license in background after window is shown
  (async () => {
    try{
      // Give pool time to initialize and let UI show first
      await new Promise(resolve => setTimeout(resolve, 2000));
      const ok = await isAuthorized();
      if(!ok){
        // If not authorized, redirect to activation
        win.loadFile(path.join(__dirname, '../renderer/activation/index.html'));
      }
    }catch(_){
      win.loadFile(path.join(__dirname, '../renderer/activation/index.html'));
    }
  })();

  // Ensure popup windows (e.g., invoice preview) hide the native menu bar
  try{
    win.webContents.setWindowOpenHandler(() => ({
      action: 'allow',
      overrideBrowserWindowOptions: { autoHideMenuBar: true }
    }));
  }catch(_){ }

  // Background monitor: if license becomes invalid (e.g., app moved) and not connected to primary, redirect to activation
  try{
    setInterval(async () => {
      try{
        const ok = await isAuthorized();
        if(!ok){
          const url = String(win.webContents.getURL()||'').toLowerCase();
          const onActivation = url.includes('/renderer/activation/');
          if(!onActivation){
            win.loadFile(path.join(__dirname, '../renderer/activation/index.html'));
          }
        }
      }catch(_){ /* ignore */ }
    }, 60000); // check every 60s
  }catch(_){ }


  // App-level IPC
  ipcMain.handle('app:quit', () => { app.quit(); });

  // Register Backup IPC (email DB dump)
  try{ registerBackupIPC && registerBackupIPC(); }catch(_){ }

  // Window controls (fullscreen toggle, back)
  ipcMain.handle('window:toggle_fullscreen', async (event) => {
    try{
      const { BrowserWindow } = require('electron');
      const w = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
      if(!w) return { ok:false, error:'no-window' };
      const next = !w.isFullScreen();
      w.setFullScreen(next);
      return { ok:true, fullscreen: next };
    }catch(e){ return { ok:false, error: String(e && e.message || e) }; }
  });
  ipcMain.handle('window:back', async (event) => {
    try{
      const { BrowserWindow } = require('electron');
      const path = require('path');
      const w = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
      if(!w) return { ok:false, error:'no-window' };
      if(w.webContents && w.webContents.canGoBack()){
        w.webContents.goBack();
        return { ok:true, didGoBack:true };
      }
      // If cannot goBack, navigate to main screen
      await w.loadFile(path.join(__dirname, '../renderer/main/index.html'));
      return { ok:true, didGoBack:false };
    }catch(e){ return { ok:false, error: String(e && e.message || e) }; }
  });

  // App locale IPC backed by DB settings
  ipcMain.handle('app:get_locale', async () => {
    // 1) Try DB setting
    try{
      const r = await registerSettingsIPC.settings_get_direct?.();
      if(r && r.app_locale){ return { ok:true, lang: r.app_locale }; }
    }catch(_){ }
    try{ const st = await (require('./settings').__get_app_locale())(); if(st) return { ok:true, lang: st }; }catch(_){ }
    // 2) Fallback to local file in userData
    try{
      const p = path.join(app.getPath('userData'), 'app-locale.json');
      if(fs.existsSync(p)){
        const j = JSON.parse(fs.readFileSync(p,'utf-8'));
        const v = (j && j.lang==='en')?'en':'ar';
        return { ok:true, lang: v };
      }
    }catch(_){ }
    return { ok:true, lang: 'ar' };
  });
  ipcMain.handle('app:set_locale', async (event, { lang }) => {
    const v = (lang==='en'?'en':'ar');
    try{ await (require('./settings').__set_app_locale())(v); }catch(_){ }
    // Persist to local file as well for robustness (e.g., if DB not reachable early)
    try{
      const p = path.join(app.getPath('userData'), 'app-locale.json');
      fs.writeFileSync(p, JSON.stringify({ lang: v }), 'utf-8');
    }catch(_){ }
    try{
      const senderId = event && event.sender && event.sender.id;
      BrowserWindow.getAllWindows().forEach(w => {
        try{ w.webContents.send('app:locale_changed', v); }catch(_){ }
        // Reload all other windows except the one that initiated the change to avoid flicker
        try{
          if(w.webContents && w.webContents.id !== senderId){
            if (typeof w.webContents.reloadIgnoringCache === 'function') {
              w.webContents.reloadIgnoringCache();
            } else {
              w.webContents.reload();
            }
          }
        }catch(_){ }
      });
    }catch(_){ }
    return { ok:true };
  });

  // Saved accounts fallback (userData JSON)
  ipcMain.handle('saved_accounts:get', async () => {
    try{
      const p = path.join(app.getPath('userData'), 'saved-accounts.json');
      if(fs.existsSync(p)){
        const list = JSON.parse(fs.readFileSync(p, 'utf-8') || '[]');
        return { ok:true, list: Array.isArray(list) ? list : [] };
      }
    }catch(_){ }
    return { ok:true, list: [] };
  });
  ipcMain.handle('saved_accounts:set', async (_e, list) => {
    try{
      const p = path.join(app.getPath('userData'), 'saved-accounts.json');
      const arr = Array.isArray(list) ? list : [];
      fs.writeFileSync(p, JSON.stringify(arr), 'utf-8');
      return { ok:true };
    }catch(e){
      return { ok:false, error: String(e && e.message || e) };
    }
  });

  // DB config IPC for linking to primary device
  ipcMain.handle('db:get_config', async () => {
    try{ return { ok:true, config: getConfig() }; }catch(e){ return { ok:false, error: String(e && e.message || e) }; }
  });
  ipcMain.handle('db:test', async (_e, cfg) => {
    try{ await testConnection(cfg||{}); return { ok:true }; }catch(e){ return { ok:false, error: String(e && e.message || e) }; }
  });
  ipcMain.handle('db:apply', async (_e, cfg) => {
    try{ const applied = await updateConfig(cfg||{}); return { ok:true, config: applied }; }catch(e){ return { ok:false, error: String(e && e.message || e) }; }
  });

  // Relay UI sales change events to all windows (safety net)
  ipcMain.on('ui:sales_changed', (_e, payload) => {
    try{
      const { BrowserWindow } = require('electron');
      BrowserWindow.getAllWindows().forEach(w => w.webContents.send('sales:changed', payload || { action: 'updated' }));
    }catch(_){ }
  });

  // PDF export handler
  ipcMain.handle('pdf:export', async (_e, { html, options }) => {
    try{
      const { BrowserWindow, shell } = require('electron');

      // Inline local images (e.g., logo) as data URLs to ensure they render in data: URL context
      function inlineImages(htmlIn){
        try{
          const fs = require('fs');
          const path = require('path');
          const appRoot = getResourcePath('');
          const toDataUrl = (absPath) => {
            try{
              if(!fs.existsSync(absPath)) return null;
              const buf = fs.readFileSync(absPath);
              const ext = (path.extname(absPath).toLowerCase()||'').slice(1);
              const mime = ext==='png' ? 'image/png' : (ext==='jpg'||ext==='jpeg' ? 'image/jpeg' : (ext==='webp' ? 'image/webp' : 'application/octet-stream'));
              return `data:${mime};base64,${buf.toString('base64')}`;
            }catch(_){ return null; }
          };
          const resolveSrc = (src) => {
            try{
              if(/^file:\/\//i.test(src)){
                // file:///C:/... -> absolute path
                const p = src.replace(/^file:\/\//i,'').replace(/\//g, path.sep);
                return toDataUrl(p) || src;
              }
              if(/^assets\//i.test(src)){
                const p = path.join(appRoot, src.replace(/\//g, path.sep));
                return toDataUrl(p) || src;
              }
              return src;
            }catch(_){ return src; }
          };
          return htmlIn.replace(/(<img\b[^>]*\bsrc=)("|\')([^"\']+)(\2)/gi, (m, p1, q, url, q2) => {
            const newUrl = resolveSrc(url);
            return p1 + q + newUrl + q2;
          });
        }catch(_){ return htmlIn; }
      }

      const processedHtml = (function(htmlIn){
        try{
          const fs = require('fs');
          const path = require('path');
          const appRoot = getResourcePath('');
          const toDataUrl = (absPath) => {
            try{
              if(!fs.existsSync(absPath)) return null;
              const buf = fs.readFileSync(absPath);
              const ext = (path.extname(absPath).toLowerCase()||'').slice(1);
              const mime = ext==='woff2' ? 'font/woff2' : (ext==='woff' ? 'font/woff' : (ext==='otf' ? 'font/otf' : 'font/ttf'));
              return `data:${mime};base64,${buf.toString('base64')}`;
            }catch(_){ return null; }
          };
          // Replace font URLs inside inline <style> blocks with data URLs so they load in data: documents
          const replaced = String(htmlIn).replace(/url\((['"]?)([^'"\)]+)\1\)/gi, (m, q, url) => {
            try{
              const u = (url||'').trim();
              const lower = u.toLowerCase();
              if(!/\.(woff2?|ttf|otf)(?:[?#].*)?$/.test(lower)) return m; // handle only font urls
              let abs = null;
              if(/^file:\/\//i.test(u)){
                abs = u.replace(/^file:\/\//i,'').replace(/\//g, path.sep);
              }else if(u.startsWith('../../../assets/')){
                const rel = u.replace(/^\.\.\/\.\.\/\.\.\//,'');
                abs = path.join(appRoot, rel.replace(/\//g, path.sep));
              }else if(u.startsWith('assets/')){
                abs = path.join(appRoot, u.replace(/\//g, path.sep));
              }else{
                return m; // leave others untouched
              }
              const data = toDataUrl(abs);
              return data ? `url('${data}')` : m;
            }catch(_){ return m; }
          });
          return replaced;
        }catch(_){ return htmlIn; }
      })(inlineImages(html));

      const tmpWin = new BrowserWindow({
        width: 1000,
        height: 700,
        show: false,
        // Disable webSecurity so file:// images are not blocked if any remain
        webPreferences: { sandbox: false, webSecurity: false }
      });
      await tmpWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(processedHtml));
      // Wait for all images to finish loading before printing to PDF
      try{
        await tmpWin.webContents.executeJavaScript(`(async () => {
          const imgs = Array.from(document.images || []);
          await Promise.all(imgs.map(img => img.complete ? Promise.resolve() : new Promise(res => {
            img.addEventListener('load', () => res(), { once: true });
            img.addEventListener('error', () => res(), { once: true });
          })));
        })();`, true);
      }catch(_){ /* ignore */ }
      const { saveMode, filename, openAfterSave = true, tempFile = false, ...printOpts } = options || {};
      const pdf = await tmpWin.webContents.printToPDF({
        marginsType: 1,
        pageSize: 'A4',
        printBackground: true,
        landscape: false,
        ...printOpts,
      });
      tmpWin.destroy();

      const fs = require('fs');
      const path = require('path');
      const os = require('os');

      // If auto-save requested: save to temp folder for temporary files (WhatsApp), otherwise Downloads
      if (saveMode === 'auto') {
        const outName = filename && String(filename).trim() ? filename.trim() : `purchases-${Date.now()}.pdf`;
        const outPath = tempFile ? path.join(os.tmpdir(), outName) : path.join(app.getPath('downloads'), outName);
        fs.writeFileSync(outPath, pdf);
        // Only open file if explicitly requested (default: true, but can be overridden with openAfterSave: false)
        if (openAfterSave) { 
          console.log('Opening PDF file:', outPath);
          await shell.openPath(outPath); 
        } else {
          console.log('PDF created without opening:', outPath);
        }
        return { ok: true, path: outPath };
      }

      // Otherwise: save temp then show Save Dialog
      const tmpPath = path.join(os.tmpdir(), `purchases-${Date.now()}.pdf`);
      fs.writeFileSync(tmpPath, pdf);
      const { dialog } = require('electron');
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'حفظ ملف PDF',
        defaultPath: filename && String(filename).trim() ? filename.trim() : 'purchases.pdf',
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
      });
      if(canceled){ return { ok:false, canceled:true, tmpPath }; }
      fs.copyFileSync(tmpPath, filePath);
      // Only open file if explicitly requested
      if (openAfterSave) { 
        console.log('Opening PDF file:', filePath);
        await shell.openPath(filePath); 
      } else {
        console.log('PDF saved without opening:', filePath);
      }
      return { ok:true, path: filePath };
    }catch(e){ console.error('pdf:export error', e); return { ok:false, error: 'تعذر إنشاء PDF' }; }
  });

  // CSV export handler
  ipcMain.handle('csv:export', async (_e, { csv, options }) => {
    try{
      const { app, shell, dialog } = require('electron');
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      const bom = Buffer.from('\uFEFF', 'utf-8'); // UTF-8 BOM for Excel
      const data = Buffer.concat([bom, Buffer.from(String(csv||''), 'utf-8')]);
      const { saveMode, filename } = options || {};
      if(saveMode === 'auto'){
        const outName = filename && String(filename).trim() ? filename.trim() : `report-${Date.now()}.csv`;
        const outPath = path.join(app.getPath('downloads'), outName);
        fs.writeFileSync(outPath, data);
        await shell.openPath(outPath);
        return { ok:true, path: outPath };
      }
      const tmpPath = path.join(os.tmpdir(), `report-${Date.now()}.csv`);
      fs.writeFileSync(tmpPath, data);
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'حفظ ملف CSV',
        defaultPath: filename && String(filename).trim() ? filename.trim() : 'report.csv',
        filters: [{ name: 'CSV', extensions: ['csv'] }]
      });
      if(canceled){ return { ok:false, canceled:true, tmpPath }; }
      fs.copyFileSync(tmpPath, filePath);
      await shell.openPath(filePath);
      return { ok:true, path: filePath };
    }catch(e){ console.error('csv:export error', e); return { ok:false, error:'تعذر إنشاء CSV' }; }
  });

  // Database backup save dialog
  ipcMain.handle('backup:show_save_dialog', async (_e) => {
    try{
      const { dialog } = require('electron');
      const d = new Date();
      const dd = String(d.getDate()).padStart(2,'0');
      const mm = String(d.getMonth()+1).padStart(2,'0');
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2,'0');
      const mi = String(d.getMinutes()).padStart(2,'0');
      const defaultName = `pos_db_${dd}-${mm}-${yyyy}_${hh}${mi}.dump`;
      
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'حفظ نسخة احتياطية من قاعدة البيانات',
        defaultPath: defaultName,
        filters: [{ name: 'Database Dump', extensions: ['dump'] }]
      });
      
      if(canceled){ return { ok:false, canceled:true }; }
      return { ok:true, path: filePath };
    }catch(e){ 
      console.error('backup:show_save_dialog error', e); 
      return { ok:false, error: 'فشل فتح نافذة الحفظ' }; 
    }
  });

  // Print raw HTML to system printer (silent, 80mm x 297mm, no margins) — aligned with invoice printing
  ipcMain.handle('print:html', async (_e, { html, options }) => {
    try{
      const { BrowserWindow } = require('electron');
      const tmpWin = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        webPreferences: { sandbox: false, webSecurity: false, partition: `print-${Date.now()}-${Math.random()}` }
      });
      await tmpWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(String(html||'')));

      const {
        silent = true,
        deviceName = undefined,
        printBackground = true,
        copies = 1,
      } = options || {};

      // Small delay to ensure styles applied
      await new Promise((resolve) => setTimeout(resolve, 150));

      await new Promise((resolve, reject) => {
        tmpWin.webContents.print({
          silent,
          deviceName,
          printBackground,
          margins: { marginType: 'none' },
          landscape: false,
          pageSize: { width: 80000, height: 297000 }, // microns: 80mm x 297mm
          copies,
        }, (ok, err) => {
          if(!ok && err){ reject(new Error(err)); } else { resolve(true); }
        });
      });
      tmpWin.destroy();
      return { ok:true };
    }catch(e){ console.error('print:html error', e); return { ok:false, error: 'تعذر الطباعة' }; }
  });

  // Silent print invoice (load template and print to default printer)
  ipcMain.handle('print:invoice_silent', async (_e, { id, pay, cash, room, format, cashier, base, base_no }) => {
    const { BrowserWindow } = require('electron');
    const path = require('path');
    try{
      const file = 'print.html'; // A4 removed
      const filePath = path.join(__dirname, '..', 'renderer', 'sales', file);
      const q = new URLSearchParams({ id: String(id||''), pay: String(pay||''), cash: String(cash||'') });
      if(room){ q.set('room', String(room)); }
      if(cashier){ q.set('cashier', String(cashier)); }
      if(base){ q.set('base', String(base)); }
      if(base_no){ q.set('base_no', String(base_no)); }
      const tmpWin = new BrowserWindow({ show: false, webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, partition: `print-${Date.now()}-${Math.random()}` } });
      await tmpWin.loadFile(filePath, { query: Object.fromEntries(q) });
      try{
        // wait images and QR readiness flag in that window
        await tmpWin.webContents.executeJavaScript(`(async () => {
          function ready(){
            try{ if(window.__NO_VAT_FAST__ === true){ return Promise.resolve(); } }catch(_){ }
            const imgs = Array.from(document.images || []);
            const imgPromises = imgs.map(img => img.complete ? Promise.resolve() : new Promise(res => {
              img.addEventListener('load', () => res(), { once: true });
              img.addEventListener('error', () => res(), { once: true });
            }));
            const qrPromise = (window.__QR_READY === true) ? Promise.resolve() : new Promise(res => {
              let t = 0;
              const timer = setInterval(() => {
                if(window.__QR_READY === true || t > 5000){ clearInterval(timer); res(); }
                t += 100;
              }, 100);
            });
            return Promise.all([...imgPromises, qrPromise]);
          }
          await ready();
        })();`, true);
      }catch(_){ }
      // Shorter delay if fast-no-VAT mode is active
      let __FAST_NO_VAT__ = false;
      try{ __FAST_NO_VAT__ = await tmpWin.webContents.executeJavaScript('Boolean(window.__NO_VAT_FAST__===true)', true); }catch(_){ }
      await new Promise((res)=> setTimeout(res, __FAST_NO_VAT__ ? 10 : 50));
      await new Promise((resolve, reject) => {
        // اجعل خيارات الطباعة الصامتة متوافقة مع عرض 80mm وطول 297mm ومن دون هوامش
        tmpWin.webContents.print({
          silent: true,
          printBackground: true,
          margins: { marginType: 'none' },
          pageSize: { width: 80000, height: 297000 }, // microns: 80mm x 297mm
          // deviceName يمكن تركه افتراضيًا (الطابعة الافتراضية)
        }, (ok, err) => {
          if(!ok && err){ reject(new Error(err)); } else { resolve(); }
        });
      });
      tmpWin.destroy();
      return { ok: true };
    }catch(e){ console.error('print:invoice_silent error', e); return { ok:false, error:'فشل الطباعة الصامتة' }; }
  });

  // QR generation handlers (run in main to ensure availability)
  ipcMain.handle('qr:to_data_url', async (_e, { text, opts }) => {
    try{
      const QRCode = require('qrcode');
      const { errorCorrectionLevel = 'M', width = 120, margin = 1 } = opts || {};
      const dataUrl = await QRCode.toDataURL(String(text||''), { errorCorrectionLevel, width, margin });
      return { ok:true, dataUrl };
    }catch(e){ console.error('qr:to_data_url error', e); return { ok:false, error: String(e && e.message || e) }; }
  });

  ipcMain.handle('qr:to_svg', async (_e, { text, opts }) => {
    try{
      const QRCode = require('qrcode');
      const { width = 120, margin = 1 } = opts || {};
      const svg = await QRCode.toString(String(text||''), { type: 'svg', width, margin });
      return { ok:true, svg };
    }catch(e){ console.error('qr:to_svg error', e); return { ok:false, error: String(e && e.message || e) }; }
  });

  ipcMain.handle('app:save-qr-image', async (_e, { base64Data }) => {
    try{
      const { dialog } = require('electron');
      const fs = require('fs');
      const path = require('path');
      
      if (!base64Data) {
        return { ok: false, error: 'لا توجد بيانات للصورة' };
      }
      
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'حفظ QR Code',
        defaultPath: `menu-qr-${Date.now()}.png`,
        filters: [{ name: 'PNG Image', extensions: ['png'] }]
      });
      
      if (canceled) {
        return { ok: false, canceled: true };
      }
      
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filePath, buffer);
      
      return { ok: true, path: filePath };
    } catch(e) {
      console.error('app:save-qr-image error', e);
      return { ok: false, error: String(e && e.message || e) };
    }
  });

  // Navigation handler for ZATCA integration
  ipcMain.handle('navigation:goTo', async (_e, page) => {
    try {
      let targetPath;
      switch(page) {
        case 'main':
          targetPath = '../renderer/main/index.html';
          break;
        case 'zatca':
          targetPath = '../renderer/zatca/index.html';
          break;
        default:
          targetPath = '../renderer/main/index.html';
      }
      
      win.loadFile(path.join(__dirname, targetPath));
      return { ok: true };
    } catch (error) {
      console.error('Navigation error:', error);
      return { ok: false, error: error.message };
    }
  });

  // File dialog for image picking
  const { dialog } = require('electron');
  ipcMain.handle('fs:pick_image', async () => {
    const r = await dialog.showOpenDialog(win, {
      title: 'اختر صورة المنتج',
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: ['png','jpg','jpeg','webp'] }
      ]
    });
    if(r.canceled || !r.filePaths || !r.filePaths.length) return { ok:false, canceled:true };
    return { ok:true, path: r.filePaths[0] };
  });

  // Import selected image into app assets and return relative + absolute path
  ipcMain.handle('fs:import_image', async (_e, srcPath) => {
    try{
      const fs = require('fs');
      const fsp = require('fs/promises');
      const path = require('path');
      const appRoot = getResourcePath('');
      const destDir = path.join(appRoot, 'assets', 'products');
      await fsp.mkdir(destDir, { recursive: true });
      const ext = path.extname(srcPath || '').toLowerCase() || '.png';
      const base = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8) + ext;
      const destAbs = path.join(destDir, base);
      await fsp.copyFile(srcPath, destAbs);
      const rel = path.join('assets', 'products', base).replace(/\\/g, '/');
      return { ok:true, rel, abs: destAbs };
    }catch(e){ console.error(e); return { ok:false, error:'فشل استيراد الصورة' }; }
  });

  // Read a file as base64 without copying (for image preview before saving to DB)
  // Resize image to max 300x300 for product thumbnails to improve performance
  ipcMain.handle('fs:read_file_base64', async (_e, srcPath) => {
    try{
      const fs = require('fs');
      const path = require('path');
      const sharp = require('sharp');
      const MAX = 1024 * 1024; // 1MB
      if(!srcPath || !fs.existsSync(srcPath)) return { ok:false, error:'لم يتم العثور على الملف' };
      const stat = fs.statSync(srcPath);
      if(stat && stat.size > MAX){
        return { ok:false, error:'حجم الصورة أكبر من 1 ميجابايت. يرجى اختيار صورة أصغر.', tooLarge:true, max: MAX };
      }
      
      // Resize image to 300x300 max while maintaining aspect ratio
      const resized = await sharp(srcPath)
        .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
      
      const base64 = resized.toString('base64');
      const mime = 'image/jpeg';
      return { ok:true, base64, mime };
    }catch(e){ console.error(e); return { ok:false, error:'تعذر قراءة الملف' }; }
  });

  // Resolve relative asset path to absolute
  ipcMain.handle('fs:resolve_path', async (_e, rel) => {
    try{
      const path = require('path');
      const abs = getResourcePath(rel);
      return { ok:true, abs };
    }catch(e){ console.error(e); return { ok:false, error:'تعذر تحويل المسار' }; }
  });

  // Open external URL (e.g., WhatsApp link)
  ipcMain.handle('app:open_external', async (_e, { url }) => {
    try{
      const { shell } = require('electron');
      if(!url) return { ok:false, error:'no url' };
      const ok = await shell.openExternal(String(url));
      return { ok: !!ok };
    }catch(e){ console.error('open_external error', e); return { ok:false, error: String(e && e.message || e) }; }
  });

  // Reveal file in explorer
  ipcMain.handle('app:reveal_file', async (_e, { path: p }) => {
    try{
      const { shell } = require('electron');
      if(!p) return { ok:false, error:'no path' };
      const ok = await shell.showItemInFolder(String(p));
      return { ok: !!ok };
    }catch(e){ console.error('reveal_file error', e); return { ok:false, error: String(e && e.message || e) }; }
  });

  // Set window to fullscreen (for main app after login)
  ipcMain.handle('window:set_fullscreen', async (e, shouldBeFullscreen) => {
    try{
      const win = BrowserWindow.fromWebContents(e.sender);
      if(!win) return { ok:false };
      if(shouldBeFullscreen){
        win.setResizable(true);
        win.setMaximizable(true);
        win.setFullScreen(true);
      } else {
        win.setFullScreen(false);
        win.setResizable(false);
        win.setMaximizable(false);
        win.center();
      }
      return { ok:true };
    }catch(err){ console.error('window:set_fullscreen error', err); return { ok:false }; }
  });
}

// WhatsApp IPC handlers
function registerWhatsAppIPC() {
  ipcMain.handle('whatsapp:initialize', async () => {
    try {
      const result = await whatsappService.initialize();
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('whatsapp:get_qr', async () => {
    try {
      const qr = await whatsappService.getQRCode();
      return { success: true, qr };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('whatsapp:status', async () => {
    try {
      const status = await whatsappService.getConnectionStatus();
      return { success: true, ...status };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('whatsapp:send_text', async (_event, { phone, message }) => {
    try {
      const result = await whatsappService.sendTextMessage(phone, message);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('whatsapp:send_file', async (_event, { phone, filePath, filename, caption }) => {
    try {
      const result = await whatsappService.sendFile(phone, filePath, filename, caption);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('whatsapp:disconnect', async () => {
    try {
      const result = await whatsappService.disconnect();
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('whatsapp:logout', async () => {
    try {
      const result = await whatsappService.logout();
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('file:delete', async (_event, { filePath }) => {
    try {
      const fs = require('fs');
      const path = require('path');
      if (!filePath || typeof filePath !== 'string') {
        return { success: false, error: 'Invalid file path' };
      }
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('Deleted temp file:', filePath);
        return { success: true };
      } else {
        return { success: false, error: 'File not found' };
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('whatsapp:check_number', async (_event, { phone }) => {
    try {
      const result = await whatsappService.checkNumberExists(phone);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('whatsapp:get_messages_stats', async () => {
    try {
      console.log('IPC: Getting messages stats...');
      const stats = await whatsappService.getMessagesStats();
      console.log('IPC: Stats retrieved:', stats);
      return { success: true, ...stats };
    } catch (error) {
      console.error('IPC: Error getting stats:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('whatsapp:update_messages_limit', async (_event, { limit }) => {
    try {
      const { getPool, DB_NAME } = require('../db/connection');
      const pool = await getPool();
      const conn = await pool.getConnection();
      try {
        await conn.query(`USE \`${DB_NAME}\``);
        await conn.query('UPDATE app_settings SET whatsapp_messages_limit = ? WHERE id=1', [limit]);
        return { success: true };
      } finally {
        conn.release();
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('whatsapp:reset_messages_count', async () => {
    try {
      const { getPool, DB_NAME } = require('../db/connection');
      const pool = await getPool();
      const conn = await pool.getConnection();
      try {
        await conn.query(`USE \`${DB_NAME}\``);
        await conn.query('UPDATE app_settings SET whatsapp_messages_sent = 0 WHERE id=1');
        return { success: true };
      } finally {
        conn.release();
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

app.whenReady().then(async () => {
  // Load saved DB config before registering IPC handlers
  try {
    await initDbFromSaved();
  } catch (_) { }

  // Register IPC handlers immediately
  registerLicenseIPC();
  customerDisplay.setupIPCHandlers();
  registerAuthIPC();
  registerUsersIPC();
  registerProductsIPC();
  registerCustomersIPC();
  registerTypesIPC();
  registerSettingsIPC();
  registerDeviceModeIPC();
  registerSalesIPC();
  registerOperationsIPC();
  registerSpriteSheetIPC();
  registerPurchasesIPC();
  registerInventoryIPC();
  registerRoomsIPC();
  registerKitchenIPC();
  registerCustomerPricingIPC();
  registerOffersIPC();
  registerDriversIPC();
  registerPermissionsIPC();
  registerWhatsAppIPC();
  registerUpdateIPC();

  // Open window immediately (license check happens inside createMainWindow)
  createMainWindow();

  // Clear cache and other tasks in background (non-blocking)
  (async () => {
    try{
      await session.defaultSession.clearCache();
      await session.defaultSession.clearStorageData({ storages: ['appcache','cachestorage','shadercache'] });
    }catch(_){ }

    try{ await ensureAdminUser(); }catch(_){ }
    try{ registerDailyEmailScheduler(); }catch(_){ }
    try{ submitUnsentInvoicesHourly(); }catch(_){ }
    
    try{ 
      await customerDisplay.initialize(); 
      console.log('✅ Customer Display initialized');
    }catch(error){ 
      console.error('Customer Display initialization error:', error); 
    }
    
    // Create database indexes in background to improve performance
    try{
      const { createIndexesInBackground } = require('../db/connection');
      await createIndexesInBackground();
    }catch(_){ }
    
    // Start API Server in background after window is shown
    const { isPrimaryDevice } = require('./api-client');
    const isPrimary = isPrimaryDevice();
    
    if (isPrimary) {
      try{ 
        startAPIServer(); 
        console.log('✅ API Server started (Primary Device)');
      }catch(error){ 
        console.error('Primary API server failed', error); 
      }
      
      // Auto-configure MySQL for VPN/Network access on first run
      try {
        const { autoConfigureMySQLIfNeeded } = require('./mysql-auto-config');
        await autoConfigureMySQLIfNeeded(true);
      } catch (error) {
        console.error('MySQL auto-configuration error:', error);
      }
    } else {
      console.log('ℹ️ API Server disabled (Secondary Device)');
    }
    
    try {
      const ZatcaSalesIntegration = require('./zatca-sales-integration');
      const LocalZatcaBridge = require('./local-zatca');
      const zatcaSalesInstance = new ZatcaSalesIntegration();
      const localZatca = new LocalZatcaBridge();
      console.log('تم تفعيل نظام ZATCA بنجاح (الرسمي + المحلي)');
    } catch (error) {
      console.error('خطأ في تفعيل نظام ZATCA:', error);
    }
  })();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Cleanup services before app quits
app.on('before-quit', async (event) => {
  try {
    console.log('Closing WhatsApp service...');
    await whatsappService.disconnect();
  } catch (error) {
    console.error('Error closing WhatsApp service:', error);
  }
  
  try {
    console.log('Closing Customer Display...');
    await customerDisplay.cleanup();
  } catch (error) {
    console.error('Error closing Customer Display:', error);
  }
});