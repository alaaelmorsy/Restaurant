// WhatsApp service using Baileys
if (!globalThis.crypto) {
  globalThis.crypto = require('crypto').webcrypto;
}
let baileys; // For dynamic import
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs').promises;
const { app } = require('electron');
const { getPool, DB_NAME } = require('../db/connection');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.qrCode = null;
    this.sessionDir = null; // Will be set in initialize() when app is ready
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryTimeout = null;
    this.lastError = null;
    this.is405Error = false;
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

  async clearSession() {
    try {
      if (this.sessionDir) {
        await fs.rm(this.sessionDir, { recursive: true, force: true });
        console.log('✅ Session directory cleared:', this.sessionDir);
        await fs.mkdir(this.sessionDir, { recursive: true });
      }
    } catch (e) {
      console.log('Could not clear session directory:', e.message);
    }
  }

  async initialize() {
    console.log('WhatsApp Service: initialize() called (attempt:', this.retryCount + 1, '/' + this.maxRetries + ')');
    try {
      if (this.client) {
        console.log('Client already exists, checking status...');
        const status = await this.getConnectionStatus();
        if (status.connected) {
          return { success: true, connected: true };
        } else {
          console.log('Existing client not connected, cleaning up...');
          await this.disconnect();
        }
      }

      if (!this.sessionDir) {
        this.sessionDir = path.join(app.getPath('userData'), 'whatsapp-tokens');
      }

      await fs.mkdir(this.sessionDir, { recursive: true });

      if (!baileys) {
        baileys = await import('@whiskeysockets/baileys');
      }
      const {
        default: makeWASocket,
        useMultiFileAuthState,
        DisconnectReason,
        fetchLatestWaWebVersion,
        fetchLatestBaileysVersion,
        Browsers
      } = baileys;

      // Use the correct makeWASocket (handle both default export and named export)
      const createSocket = makeWASocket || baileys.makeWASocket;

      const { state, saveCreds } = await useMultiFileAuthState(this.sessionDir);

      // Check if we have existing credentials
      const hasExistingCreds = !!(state.creds && state.creds.me);
      console.log('Has existing credentials:', hasExistingCreds);

      // Fetch version correctly - returns { version, isLatest }, NOT an array
      let version;
      try {
        // Primary: fetch latest WA Web version (more reliable)
        const waWebResult = await fetchLatestWaWebVersion();
        if (waWebResult && waWebResult.version && waWebResult.isLatest) {
          version = waWebResult.version;
          console.log('✅ Using WA Web version:', version);
        } else {
          throw new Error('WA Web version not latest');
        }
      } catch (err1) {
        console.log('Could not fetch WA Web version:', err1.message);
        try {
          // Fallback: fetch latest Baileys version from GitHub
          const baileysResult = await fetchLatestBaileysVersion();
          if (baileysResult && baileysResult.version) {
            version = baileysResult.version;
            console.log('✅ Using Baileys GitHub version:', version);
          } else {
            throw new Error('Baileys version not available');
          }
        } catch (err2) {
          // Final fallback: let Baileys use its built-in default (DO NOT hardcode old version)
          console.log('Could not fetch any version, using Baileys built-in default');
          version = undefined; // Baileys will use its own DEFAULT_CONNECTION_CONFIG.version
        }
      }

      // Build socket config
      const socketConfig = {
        auth: state,
        logger: require('pino')({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.macOS('Chrome'), // Use Baileys built-in browser identifier
        connectTimeoutMs: 60000,
        generateHighQualityLinkPreview: false,
        syncFullHistory: false, // POS system doesn't need chat history
        markOnlineOnConnect: false, // Don't mark online to reduce detection
      };

      // Only set version if we successfully fetched one
      if (version) {
        socketConfig.version = version;
      }

      console.log('Creating WhatsApp socket with version:', version || 'built-in default');
      this.client = createSocket(socketConfig);
      console.log('WhatsApp socket created');

      this.client.ev.on('creds.update', saveCreds);

      this.client.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          console.log('✅ QR Code received - User can now scan');
          this.retryCount = 0; // Reset retry count on successful QR
          this.is405Error = false;
          try {
            this.qrCode = await qrcode.toDataURL(qr);
            console.log('QR Code Data URI generated, length:', this.qrCode.length);
          } catch (e) {
            console.error('Error generating QR code Data URI:', e);
          }
        }

        if (connection === 'open') {
          console.log('✅ WhatsApp connection OPEN - authenticated');
          this.retryCount = 0; // Reset on successful connection
          this.is405Error = false;
          this.isConnected = true;
          this.qrCode = null;
        }

        if (connection === 'close') {
          this.isConnected = false;
          console.log('⚠️ WhatsApp connection CLOSED');
          
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const reason = lastDisconnect?.error?.data?.reason;
          const errorTrace = lastDisconnect?.error?.message;
          
          console.log('Disconnect - reason:', reason, 'statusCode:', statusCode);
          
          // Check if this is a 405 error (registration rejected)
          const is405 = statusCode === 405 || reason === '405' || errorTrace?.includes('405');
          
          if (is405) {
            console.log('⚠️ 405 Registration Error detected (attempt', this.retryCount + 1, ')');
            this.is405Error = true;
            this.lastError = 'Registration failed with 405 - WhatsApp server rejected device registration';
            
            // CRITICAL FIX: Clear session on 405 error - stale auth causes infinite loop
            console.log('🗑️ Clearing stale session to allow fresh QR registration...');
            await this.clearSession();
            
            if (this.retryCount < this.maxRetries) {
              const delayMs = Math.min(2000 * Math.pow(2, this.retryCount), 30000);
              console.log('Retrying with exponential backoff in', delayMs, 'ms (attempt', this.retryCount + 1, '/', this.maxRetries, ')');
              
              if (this.retryTimeout) clearTimeout(this.retryTimeout);
              this.retryTimeout = setTimeout(() => {
                this.retryCount++;
                this.client = null; // Ensure client is reset
                this.initialize();
              }, delayMs);
            } else {
              console.error('❌ Max retries exceeded for 405 error. Please restart the app.');
              this.retryCount = 0;
              this.is405Error = true;
            }
          } else if (statusCode !== DisconnectReason.loggedOut) {
            console.log('Non-405 disconnection, retrying...');
            this.retryCount = 0;
            this.is405Error = false;
            if (this.retryTimeout) clearTimeout(this.retryTimeout);
            this.retryTimeout = setTimeout(() => {
              this.client = null;
              this.initialize();
            }, 3000);
          } else {
            console.log('Logged out explicitly. Clearing session and not retrying.');
            this.qrCode = null;
            this.retryCount = 0;
            this.is405Error = false;
            await this.clearSession();
          }
        }
      });

      this.client.ev.on('messages.upsert', async (m) => {
        // Handle incoming messages if needed
      });

      return { success: true, connected: this.isConnected };
    } catch (error) {
      console.error('❌ WhatsApp initialization error:', error.message);
      this.client = null;
      this.isConnected = false;
      
      // For initialization errors, also apply exponential backoff
      if (this.retryCount < this.maxRetries) {
        const delayMs = Math.min(2000 * Math.pow(2, this.retryCount), 30000);
        console.log('Init error - retrying in', delayMs, 'ms');
        if (this.retryTimeout) clearTimeout(this.retryTimeout);
        this.retryTimeout = setTimeout(() => {
          this.retryCount++;
          this.initialize();
        }, delayMs);
      }
      
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
        return { connected: false, retryAttempts: this.retryCount, is405Error: this.is405Error };
      }
      return { 
        connected: this.isConnected, 
        retryAttempts: this.retryCount,
        is405Error: this.is405Error,
        lastError: this.lastError 
      };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }

  async disconnect() {
    try {
      if (this.retryTimeout) {
        clearTimeout(this.retryTimeout);
        this.retryTimeout = null;
      }
      this.retryCount = 0;
      this.is405Error = false;
      this.lastError = null;
      
      if (this.client) {
        try {
          await this.client.end();
        } catch (e) {
          console.log('Error ending client:', e.message);
        }
        this.client = null;
      }
      this.isConnected = false;
      this.qrCode = null;
      console.log('WhatsApp disconnected and retry state cleared');
      return { success: true };
    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error);
      this.client = null;
      this.isConnected = false;
      return { success: false, error: error.message };
    }
  }

  isWhatsAppReady() {
    return this.isConnected;
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
      const result = await this.client.sendMessage(formattedPhone, { text: message });
      
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

      if (!this.client || !this.isConnected) {
        return { success: false, error: 'WhatsApp not connected' };
      }

      const formattedPhone = this.formatPhoneNumber(phone);
      console.log('Formatted phone:', formattedPhone);
      
      const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
      if (!fileExists) {
        return { success: false, error: 'File not found: ' + filePath };
      }

      const buffer = await fs.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      let mimetype = 'application/octet-stream';
      if (ext === '.pdf') mimetype = 'application/pdf';
      else if (ext === '.png') mimetype = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') mimetype = 'image/jpeg';

      console.log('Sending file:', filePath, 'to', formattedPhone);
      const result = await this.client.sendMessage(
        formattedPhone,
        {
          document: buffer,
          mimetype: mimetype,
          fileName: filename,
          caption: caption
        }
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
      cleaned = cleaned + '@s.whatsapp.net';
    }
    
    return cleaned;
  }

  async logout() {
    try {
      if (this.retryTimeout) {
        clearTimeout(this.retryTimeout);
        this.retryTimeout = null;
      }
      this.retryCount = 0;
      this.is405Error = false;
      this.lastError = null;
      
      if (this.client) {
        try {
          // Send logout to cleanly log out of WhatsApp Web
          await this.client.logout();
        } catch (e) {
          console.log('Error during logout:', e.message);
        }
        this.client = null;
        this.isConnected = false;
        this.qrCode = null;
      }
      
      await this.clearSession();
      
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
      if (typeof this.client.onWhatsApp === 'function') {
        const [result] = await this.client.onWhatsApp(formattedPhone);
        return { success: true, exists: result?.exists || false };
      }

      return { success: false, error: 'checkNumberExists not supported by current WhatsApp client' };
    } catch (error) {
      console.error('Error checking number:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new WhatsAppService();
