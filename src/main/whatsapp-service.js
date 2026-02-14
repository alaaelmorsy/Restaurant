// WhatsApp service using wppconnect
const wppconnect = require('@wppconnect-team/wppconnect');
const path = require('path');
const fs = require('fs').promises;
const { app } = require('electron');
const { getPool, DB_NAME } = require('../db/connection');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.qrCode = null;
    this.sessionDir = path.join(app.getPath('userData'), 'whatsapp-tokens');
  }

  async getMessagesStats() {
    try {
      console.log('WhatsApp Service: Getting messages stats from DB...');
      const pool = await getPool();
      const conn = await pool.getConnection();
      try {
        await conn.query(`USE \`${DB_NAME}\``);
        
        const checkColumn = async (colName) => {
          const [cols] = await conn.query('SHOW COLUMNS FROM app_settings LIKE ?', [colName]);
          return cols.length > 0;
        };
        
        if (!(await checkColumn('whatsapp_messages_limit'))) {
          console.log('WhatsApp Service: Adding whatsapp_messages_limit column');
          await conn.query('ALTER TABLE app_settings ADD COLUMN whatsapp_messages_limit INT NOT NULL DEFAULT 0');
        }
        
        if (!(await checkColumn('whatsapp_messages_sent'))) {
          console.log('WhatsApp Service: Adding whatsapp_messages_sent column');
          await conn.query('ALTER TABLE app_settings ADD COLUMN whatsapp_messages_sent INT NOT NULL DEFAULT 0');
        }
        
        const [existingRows] = await conn.query('SELECT id FROM app_settings WHERE id=1 LIMIT 1');
        if (existingRows.length === 0) {
          console.log('WhatsApp Service: No settings row found, creating with defaults');
          await conn.query(
            "INSERT INTO app_settings (id, vat_percent, prices_include_vat, currency_code, currency_symbol, currency_symbol_position, whatsapp_messages_limit, whatsapp_messages_sent) VALUES (1, 15.00, 1, 'SAR', '﷼', 'after', 0, 0)"
          );
        }
        
        const [rows] = await conn.query('SELECT whatsapp_messages_limit, whatsapp_messages_sent FROM app_settings WHERE id=1');
        console.log('WhatsApp Service: Query result:', rows);
        
        const settings = rows[0];
        if (!settings) {
          console.log('WhatsApp Service: No settings found after insert, using defaults');
          return { limit: 0, sent: 0, remaining: 0 };
        }
        
        const limit = Number(settings.whatsapp_messages_limit != null ? settings.whatsapp_messages_limit : 0);
        const sent = Number(settings.whatsapp_messages_sent != null ? settings.whatsapp_messages_sent : 0);
        const remaining = Math.max(0, limit - sent);
        console.log(`WhatsApp Service: Calculated stats - limit: ${limit}, sent: ${sent}, remaining: ${remaining}`);
        return { limit, sent, remaining };
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('WhatsApp Service: Error getting messages stats:', error);
      return { limit: 0, sent: 0, remaining: 0, error: error.message };
    }
  }

  async incrementMessagesSent() {
    try {
      const pool = await getPool();
      const conn = await pool.getConnection();
      try {
        await conn.query(`USE \`${DB_NAME}\``);
        
        const [rows] = await conn.query('SELECT whatsapp_messages_sent FROM app_settings WHERE id=1');
        if (rows.length === 0) {
          console.log('No settings row found in incrementMessagesSent');
          return { success: false, error: 'Settings row not found' };
        }
        
        await conn.query('UPDATE app_settings SET whatsapp_messages_sent = whatsapp_messages_sent + 1 WHERE id=1');
        return { success: true };
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('Error incrementing messages sent:', error);
      return { success: false, error: error.message };
    }
  }

  async checkMessagesLimit() {
    const stats = await this.getMessagesStats();
    return stats.remaining > 0;
  }

  async initialize() {
    try {
      if (this.client) {
        console.log('Client already exists, checking status...');
        try {
          const status = await this.getConnectionStatus();
          if (status.connected) {
            return { success: true, connected: true };
          } else {
            console.log('Existing client not connected, cleaning up...');
            await this.disconnect();
          }
        } catch (e) {
          console.log('Error checking existing client, cleaning up:', e.message);
          await this.disconnect();
        }
      }

      await fs.mkdir(this.sessionDir, { recursive: true });
      
      // Find Chrome executable path
      const chromePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
        path.join(process.env.PROGRAMFILES || '', 'Google\\Chrome\\Application\\chrome.exe'),
        path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google\\Chrome\\Application\\chrome.exe')
      ];

      let executablePath;
      for (const chromePath of chromePaths) {
        try {
          await fs.access(chromePath);
          executablePath = chromePath;
          console.log('Chrome found at:', chromePath);
          break;
        } catch (e) {
          continue;
        }
      }

      const createOptions = {
        session: 'pos-session',
        catchQR: (base64Qr, asciiQR, attempts, urlCode) => {
          this.qrCode = base64Qr;
          console.log('QR Code received, attempts:', attempts);
          console.log('QR Code data length:', base64Qr ? base64Qr.length : 0);
          console.log('QR Code starts with:', base64Qr ? base64Qr.substring(0, 50) : 'null');
        },
        statusFind: (statusSession, session) => {
          console.log('Status Session:', statusSession);
          this.isConnected = statusSession === 'isLogged' || statusSession === 'qrReadSuccess' || statusSession === 'inChat';
        },
        folderNameToken: this.sessionDir,
        headless: true,
        devtools: false,
        useChrome: true,
        debug: false,
        logQR: false,
        autoClose: 0,
        userDataDir: this.sessionDir,
        browserArgs: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-background-networking',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-breakpad',
          '--disable-component-extensions-with-background-pages',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--disable-renderer-backgrounding'
        ],
        disableWelcome: true,
        updatesLog: false
      };

      if (executablePath) {
        createOptions.executablePath = executablePath;
      }

      this.client = await wppconnect.create(createOptions);

      this.client.onStateChange((state) => {
        console.log('State changed:', state);
        this.isConnected = state === 'CONNECTED';
      });

      this.client.onMessage((message) => {
        console.log('Message received:', message.from);
      });

      return { success: true, connected: this.isConnected };
    } catch (error) {
      console.error('WhatsApp initialization error:', error);
      this.client = null;
      this.isConnected = false;
      this.qrCode = null;
      return { success: false, error: error.message };
    }
  }

  async getQRCode() {
    console.log('getQRCode called, current qrCode:', this.qrCode ? 'exists' : 'null');
    return this.qrCode;
  }

  async getConnectionStatus() {
    try {
      if (!this.client) {
        return { connected: false };
      }
      const state = await this.client.getConnectionState();
      const isConnected = state === 'CONNECTED' || this.isConnected;
      return { connected: isConnected, state };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }

  async sendTextMessage(phone, message) {
    try {
      const hasLimit = await this.checkMessagesLimit();
      if (!hasLimit) {
        const stats = await this.getMessagesStats();
        return { 
          success: false, 
          error: 'تم انتهاء عدد الرسائل المتاحة. يرجى التجديد.',
          limitReached: true,
          stats
        };
      }

      if (!this.client || !this.isConnected) {
        return { success: false, error: 'WhatsApp not connected' };
      }

      const formattedPhone = this.formatPhoneNumber(phone);
      const result = await this.client.sendText(formattedPhone, message);
      
      await this.incrementMessagesSent();
      
      return { success: true, result };
    } catch (error) {
      console.error('Error sending text message:', error);
      return { success: false, error: error.message };
    }
  }

  async sendFile(phone, filePath, filename, caption = '') {
    try {
      const hasLimit = await this.checkMessagesLimit();
      if (!hasLimit) {
        const stats = await this.getMessagesStats();
        return { 
          success: false, 
          error: 'تم انتهاء عدد الرسائل المتاحة. يرجى التجديد.',
          limitReached: true,
          stats
        };
      }

      if (!this.client) {
        return { success: false, error: 'WhatsApp client not initialized' };
      }

      const status = await this.getConnectionStatus();
      console.log('Connection status check:', status);
      
      if (!status.connected) {
        return { success: false, error: 'WhatsApp not connected. Status: ' + (status.state || 'unknown') };
      }

      const formattedPhone = this.formatPhoneNumber(phone);
      console.log('Formatted phone:', formattedPhone);
      
      const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
      if (!fileExists) {
        return { success: false, error: 'File not found: ' + filePath };
      }

      console.log('Sending file:', filePath, 'to', formattedPhone);
      const result = await this.client.sendFile(
        formattedPhone,
        filePath,
        filename,
        caption
      );

      await this.incrementMessagesSent();

      console.log('File sent successfully:', result);
      return { success: true, result };
    } catch (error) {
      console.error('Error sending file:', error);
      return { success: false, error: error.message };
    }
  }

  formatPhoneNumber(phone) {
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    if (/^05\d{8}$/.test(cleaned)) {
      cleaned = '966' + cleaned.slice(1);
    }
    
    if (!cleaned.includes('@')) {
      cleaned = cleaned + '@c.us';
    }
    
    return cleaned;
  }

  async disconnect() {
    try {
      if (this.client) {
        try {
          await this.client.close();
        } catch (e) {
          console.log('Error closing client, forcing cleanup:', e.message);
        }
        
        // Force cleanup of browser process
        try {
          const browser = await this.client.pupBrowser;
          if (browser && browser.process()) {
            browser.process().kill('SIGKILL');
          }
        } catch (e) {
          console.log('Could not force kill browser:', e.message);
        }
        
        this.client = null;
        this.isConnected = false;
        this.qrCode = null;
      }
      
      // Kill any orphaned Chrome processes
      try {
        const { exec } = require('child_process');
        exec('taskkill /F /IM chrome.exe /FI "WINDOWTITLE eq WhatsApp*"', (error) => {
          if (!error) console.log('Killed orphaned Chrome processes');
        });
      } catch (e) {
        console.log('Could not kill orphaned processes:', e.message);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error disconnecting:', error);
      this.client = null;
      this.isConnected = false;
      this.qrCode = null;
      return { success: false, error: error.message };
    }
  }

  async logout() {
    try {
      if (this.client) {
        try {
          await this.client.logout();
        } catch (e) {
          console.log('Error during logout, forcing close:', e.message);
        }
        
        try {
          await this.client.close();
        } catch (e) {
          console.log('Error closing client:', e.message);
        }
        
        // Force cleanup of browser process
        try {
          const browser = await this.client.pupBrowser;
          if (browser && browser.process()) {
            browser.process().kill('SIGKILL');
          }
        } catch (e) {
          console.log('Could not force kill browser:', e.message);
        }
        
        this.client = null;
        this.isConnected = false;
        this.qrCode = null;
      }
      
      try {
        const tokenPath = path.join(this.sessionDir, 'pos-session');
        await fs.rm(tokenPath, { recursive: true, force: true });
      } catch (e) {
        console.log('No session to delete');
      }
      
      // Kill any orphaned Chrome processes
      try {
        const { exec } = require('child_process');
        exec('taskkill /F /IM chrome.exe /FI "WINDOWTITLE eq WhatsApp*"', (error) => {
          if (!error) console.log('Killed orphaned Chrome processes');
        });
      } catch (e) {
        console.log('Could not kill orphaned processes:', e.message);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error logging out:', error);
      this.client = null;
      this.isConnected = false;
      this.qrCode = null;
      return { success: false, error: error.message };
    }
  }

  async checkNumberExists(phone) {
    try {
      if (!this.client || !this.isConnected) {
        return { success: false, error: 'WhatsApp not connected' };
      }

      const formattedPhone = this.formatPhoneNumber(phone);
      const exists = await this.client.checkNumberStatus(formattedPhone);
      
      return { success: true, exists: exists.numberExists };
    } catch (error) {
      console.error('Error checking number:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new WhatsAppService();
