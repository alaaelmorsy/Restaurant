// Main Electron process
const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const { exec } = require('child_process');
const path = require('path');
require('dotenv').config();
const { registerAuthIPC, ensureAdminUser } = require('./auth');

// Ensure userData and cache directories are writable and set Chromium cache location
try{
  const fs = require('fs');
  const userDataDir = path.join(app.getPath('appData'), 'POS-SA');
  app.setPath('userData', userDataDir);
  const cacheDir = path.join(userDataDir, 'Cache');
  fs.mkdirSync(cacheDir, { recursive: true });
  app.commandLine.appendSwitch('disk-cache-dir', cacheDir);
  // Avoid shader cache errors on some locked environments
  app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
}catch(e){ /* ignore path init errors */ }

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'POS SA - الرئيسية',
  });
  mainWindow.setMenuBarVisibility(false);

  // Developer tools can be toggled via shortcut if needed
  mainWindow.loadFile(path.join(__dirname, '../renderer/login/index.html'));
}

// PDF export handler (supports auto-save to Downloads)
ipcMain.handle('pdf:export', async (_e, { html, options }) => {
  try{
    const { BrowserWindow, shell } = require('electron');
    const tmpWin = new BrowserWindow({
      width: 1000,
      height: 700,
      show: false,
      autoHideMenuBar: true,
      webPreferences: { sandbox: false }
    });
    tmpWin.setMenuBarVisibility(false);
    await tmpWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    const { saveMode, filename, openAfterSave = true, pageSize, ...printOpts } = options || {};
    const pdf = await tmpWin.webContents.printToPDF({
      marginsType: 1,
      pageSize: pageSize || 'A4',
      printBackground: true,
      landscape: false,
      ...printOpts,
    });
    tmpWin.destroy();

    const fs = require('fs');
    const path = require('path');
    const os = require('os');

    if (saveMode === 'auto') {
      const outName = filename && String(filename).trim() ? filename.trim() : `purchases-${Date.now()}.pdf`;
      const outPath = path.join(app.getPath('downloads'), outName);
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

// Print raw HTML to system printer (silent, configurable page size)
ipcMain.handle('print:html', async (_e, { html, options }) => {
  try{
    const { BrowserWindow } = require('electron');
    const tmpWin = new BrowserWindow({
      width: 800,
      height: 600,
      show: false,
      autoHideMenuBar: true,
      webPreferences: { sandbox: false }
    });
    tmpWin.setMenuBarVisibility(false);
    await tmpWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    const {
      silent = true,
      deviceName = undefined,
      margins = { marginType: 1 },
      landscape = false,
      // custom page size: width/height in microns per Electron docs
      pageSize = { width: 80000, height: 297000 }, // ~80mm x 297mm
      printBackground = true,
    } = options || {};
    await new Promise((resolve) => setTimeout(resolve, 150)); // small delay to ensure styles applied
    const success = await tmpWin.webContents.print({
      silent,
      deviceName,
      printBackground,
      margins,
      landscape,
      pageSize,
      copies: 1,
    });
    tmpWin.destroy();
    return { ok: !!success };
  }catch(e){ console.error('print:html error', e); return { ok:false, error: 'تعذر الطباعة' }; }
});

// Open external URL (e.g., WhatsApp Desktop/Web)
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

// QR generation handlers (run in main to avoid preload require issues)
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

// Hardware ID IPCs
ipcMain.handle('hw:get_baseboard_serial', async () => {
  return new Promise((resolve) => {
    // Use WMIC for wide compatibility
    exec('wmic baseboard get SerialNumber', { windowsHide: true }, (err, stdout) => {
      if (err) { return resolve({ ok:false, error: 'فشل قراءة رقم المازربورد' }); }
      try{
        const out = String(stdout||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
        // output like: ['SerialNumber','ABCD1234']
        const serial = out.length>=2 ? out[1] : '';
        resolve({ ok: !!serial, serial: serial || '' });
      }catch(_){ resolve({ ok:false, error:'تعذر التحليل' }); }
    });
  });
});

ipcMain.handle('hw:get_mac_ethernet', async () => {
  return new Promise((resolve) => {
    // PowerShell: exact adapter name "Ethernet"
    const ps = 'powershell -NoProfile -Command "(Get-NetAdapter -Name \"Ethernet\").MacAddress"';
    exec(ps, { windowsHide: true }, (err, stdout) => {
      if (err) { return resolve({ ok:false, error: 'فشل قراءة MAC لـ Ethernet' }); }
      const mac = String(stdout||'').trim();
      resolve({ ok: !!mac, mac });
    });
  });
});

app.whenReady().then(async () => {
  // Ensure DB and default admin user exist, and register IPC handlers
  await ensureAdminUser();
  registerAuthIPC();

  Menu.setApplicationMenu(null);
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});