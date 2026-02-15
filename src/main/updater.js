const { app, ipcMain, BrowserWindow } = require('electron');
const log = require('electron-log');
const isDev = require('electron-is-dev');

let autoUpdater = null;
let updateWindow = null;

function compareVersions(v1, v2) {
  const v1Parts = String(v1).split('.').map(Number);
  const v2Parts = String(v2).split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;
    
    if (v1Part > v2Part) return 1;
    if (v1Part < v2Part) return -1;
  }
  
  return 0;
}

async function checkSupportValidity() {
  try {
    console.log('checkSupportValidity: Starting check...');
    const { getPool } = require('../db/connection');
    const pool = await getPool();
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query('SELECT support_end_date FROM app_settings WHERE id=1 LIMIT 1');
      console.log('checkSupportValidity: Query result:', rows);
      
      if (rows && rows[0] && rows[0].support_end_date) {
        const endDate = new Date(rows[0].support_end_date);
        const today = new Date();
        const baseToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const diffDays = Math.ceil((endDate - baseToday) / (1000 * 60 * 60 * 24));
        
        console.log('checkSupportValidity: End date:', endDate);
        console.log('checkSupportValidity: Today:', baseToday);
        console.log('checkSupportValidity: Days left:', diffDays);
        console.log('checkSupportValidity: Valid:', diffDays >= 0);
        
        return {
          valid: diffDays >= 0,
          daysLeft: diffDays,
          endDate: rows[0].support_end_date
        };
      }
      console.log('checkSupportValidity: No support_end_date found, allowing update');
      return { valid: true, daysLeft: null, endDate: null };
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('checkSupportValidity: Error:', error);
    return { valid: true, daysLeft: null, endDate: null };
  }
}

function getAutoUpdater() {
  if (!autoUpdater) {
    try {
      const { autoUpdater: updater } = require('electron-updater');
      
      updater.logger = log;
      updater.logger.transports.file.level = 'info';
      
      updater.autoDownload = false;
      updater.autoInstallOnAppQuit = true;
      
      updater.setFeedURL({
        provider: 'github',
        owner: 'alaaelmorsy',
        repo: 'Restaurant'
      });
      
      console.log('AutoUpdater initialized with GitHub repo');
      
      updater.on('checking-for-update', () => {
        console.log('Update: Checking for updates...');
        sendStatusToWindow('checking-for-update');
      });

      updater.on('update-available', (info) => {
        console.log('Update: Update available', info);
        console.log('Update: Current version:', app.getVersion());
        console.log('Update: Available version:', info.version);
        
        const currentVersion = app.getVersion();
        const newVersion = info.version;
        
        if (compareVersions(currentVersion, newVersion) >= 0) {
          console.log('Update: Current version is same or newer, ignoring update notification');
          sendStatusToWindow('update-not-available', { version: currentVersion });
          return;
        }
        
        sendStatusToWindow('update-available', info);
      });

      updater.on('update-not-available', (info) => {
        console.log('Update: No update available', info);
        sendStatusToWindow('update-not-available', info);
      });

      updater.on('error', (err) => {
        console.log('Update: Error occurred', err);
        sendStatusToWindow('update-error', err);
      });

      updater.on('download-progress', (progressObj) => {
        console.log('Update: Download progress event triggered!', progressObj);
        console.log('Update: Progress percent:', progressObj.percent);
        console.log('Update: Transferred:', progressObj.transferred);
        console.log('Update: Total:', progressObj.total);
        sendStatusToWindow('download-progress', progressObj);
      });

      updater.on('update-downloaded', (info) => {
        console.log('Update: Downloaded successfully');
        sendStatusToWindow('update-downloaded', info);
      });
      
      autoUpdater = updater;
    } catch (error) {
      console.error('Failed to load electron-updater:', error);
      autoUpdater = {
        on: () => {},
        checkForUpdates: async () => { throw new Error('electron-updater not available'); },
        downloadUpdate: async () => { throw new Error('electron-updater not available'); },
        quitAndInstall: () => {}
      };
    }
  }
  return autoUpdater;
}

function setupAutoUpdater(mainWindow) {
  updateWindow = mainWindow;
  getAutoUpdater();
}

function sendStatusToWindow(status, data) {
  const win = updateWindow || BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
  if (win && !win.isDestroyed()) {
    win.webContents.send('update-status', { status, data });
  }
}

function registerUpdateIPC() {
  ipcMain.handle('check-for-updates', async () => {
    try {
      if (isDev) {
        console.log('Update: Development mode - updates disabled');
        sendStatusToWindow('update-not-available', { 
          version: app.getVersion(),
          message: 'التحديث غير متاح في وضع التطوير'
        });
        return { success: true, devMode: true };
      }
      
      const supportStatus = await checkSupportValidity();
      console.log('Update: Support status:', supportStatus);
      
      console.log('Update: Checking for updates... (isDev:', isDev, ')');
      console.log('Update: Current version:', app.getVersion());
      if (supportStatus.daysLeft !== null) {
        console.log('Update: Support days left:', supportStatus.daysLeft);
      }
      
      global.supportStatus = supportStatus;
      
      const updater = getAutoUpdater();
      
      setupAutoUpdater(BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]);
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          console.log('Update: Timeout reached');
          reject(new Error('انتهت مهلة البحث عن التحديثات'));
        }, 15000);
      });
      
      console.log('Update: Starting checkForUpdates...');
      const updatePromise = updater.checkForUpdates();
      
      const result = await Promise.race([updatePromise, timeoutPromise]);
      console.log('Update: Check completed', result);
      return { success: true, result };
    } catch (error) {
      console.error('Update check error:', error);
      
      let errorMessage = error.message || error.toString();
      
      if (errorMessage.includes('404') || errorMessage.includes('No published versions') || error.code === 'ERR_XML_MISSED_ELEMENT') {
        console.log('Update: No releases available - treating as no update available');
        errorMessage = 'لا يوجد إصدارات منشورة على GitHub';
        sendStatusToWindow('update-not-available', { version: app.getVersion() });
        return { success: true, noReleases: true };
      }
      
      console.log('Update: Sending error to window:', errorMessage);
      sendStatusToWindow('update-error', { message: errorMessage });
      return { success: false, error: errorMessage };
    }
  });

  ipcMain.handle('download-update', async () => {
    try {
      if (isDev) {
        console.log('Download: Development mode - updates disabled');
        return { success: false, error: 'التحديث غير متاح في وضع التطوير', devMode: true };
      }
      
      const supportStatus = global.supportStatus || await checkSupportValidity();
      console.log('Download: Support status check:', supportStatus);
      
      if (!supportStatus.valid) {
        const errorMsg = 'انتهت فترة الدعم الفني. يرجى تجديد الدعم الفني للحصول على التحديثات';
        console.log('Download: Support expired - blocking download');
        console.log('Download: Days left:', supportStatus.daysLeft);
        console.log('Download: End date:', supportStatus.endDate);
        sendStatusToWindow('support-expired', { 
          message: errorMsg,
          daysLeft: supportStatus.daysLeft,
          endDate: supportStatus.endDate
        });
        return { 
          success: false, 
          supportExpired: true,
          error: errorMsg,
          daysLeft: supportStatus.daysLeft,
          endDate: supportStatus.endDate
        };
      }
      
      console.log('Download: Support valid, proceeding with download');
      
      const currentWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
      setupAutoUpdater(currentWindow);
      
      const updater = getAutoUpdater();
      console.log('Download: Starting download...');
      console.log('Download: updater instance:', updater);
      
      sendStatusToWindow('download-progress', { 
        percent: 0, 
        transferred: 0, 
        total: 0 
      });
      
      const downloadPromise = updater.downloadUpdate();
      console.log('Download: downloadUpdate() called, promise created');
      await downloadPromise;
      console.log('Download: downloadUpdate() promise completed');
      return { success: true };
    } catch (error) {
      console.error('Download: Error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('install-update', async () => {
    try {
      if (isDev) {
        console.log('Install: Development mode - updates disabled');
        return { success: false, error: 'التحديث غير متاح في وضع التطوير', devMode: true };
      }
      
      const supportStatus = global.supportStatus || await checkSupportValidity();
      console.log('Install: Support status check:', supportStatus);
      
      if (!supportStatus.valid) {
        const errorMsg = 'انتهت فترة الدعم الفني. يرجى تجديد الدعم الفني للحصول على التحديثات';
        console.log('Install: Support expired - blocking install');
        console.log('Install: Days left:', supportStatus.daysLeft);
        console.log('Install: End date:', supportStatus.endDate);
        sendStatusToWindow('support-expired', { 
          message: errorMsg,
          daysLeft: supportStatus.daysLeft,
          endDate: supportStatus.endDate
        });
        return { 
          success: false, 
          supportExpired: true,
          error: errorMsg,
          daysLeft: supportStatus.daysLeft,
          endDate: supportStatus.endDate
        };
      }
      
      console.log('Install: Support valid, proceeding with installation');
      const updater = getAutoUpdater();
      updater.quitAndInstall(false, true);
      return { success: true };
    } catch (error) {
      console.error('Install: Error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  ipcMain.handle('get-support-status', async () => {
    try {
      const status = await checkSupportValidity();
      return { success: true, ...status };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

module.exports = {
  setupAutoUpdater,
  registerUpdateIPC,
  getAutoUpdater,
  checkSupportValidity
};
