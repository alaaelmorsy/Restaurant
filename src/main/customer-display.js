const { SerialPort } = require('serialport');
const { getPool, DB_NAME } = require('../db/connection');

let port = null;
let isConnected = false;
let currentSettings = null;

const ESC = '\x1B';
const GS = '\x1D';
const LF = '\n';
const CR = '\r';

async function loadSettings() {
  try {
    const pool = await getPool();
    const conn = await pool.getConnection();
    try {
      await conn.query(`USE \`${DB_NAME}\``);
      const [rows] = await conn.query(
        'SELECT customer_display_enabled, customer_display_port, customer_display_welcome_msg, customer_display_thank_msg FROM app_settings WHERE id=1 LIMIT 1'
      );
      currentSettings = rows[0] || {};
      return currentSettings;
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('Customer Display: Failed to load settings', e);
    return null;
  }
}

function buildDisplayCommand(text) {
  return `${ESC}@${text}${LF}${CR}`;
}

async function connect() {
  if (isConnected && port && port.isOpen) {
    return { ok: true };
  }

  const settings = await loadSettings();
  if (!settings || !settings.customer_display_enabled || !settings.customer_display_port) {
    return { ok: false, error: 'Customer display not enabled or port not configured' };
  }

  try {
    if (port && port.isOpen) {
      port.close();
    }

    port = new SerialPort({
      path: settings.customer_display_port,
      baudRate: 9600,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
      autoOpen: false
    });

    return new Promise((resolve) => {
      port.open((err) => {
        if (err) {
          console.error('Customer Display: Failed to open port', err);
          isConnected = false;
          resolve({ ok: false, error: err.message });
        } else {
          isConnected = true;
          console.log('Customer Display: Connected to', settings.customer_display_port);
          resolve({ ok: true });
        }
      });
    });
  } catch (e) {
    console.error('Customer Display: Connection error', e);
    isConnected = false;
    return { ok: false, error: e.message };
  }
}

async function ensureConnected() {
  if (!isConnected || !port || !port.isOpen) {
    return await connect();
  }
  return { ok: true };
}

async function sendText(text) {
  const settings = await loadSettings();
  if (!settings || !settings.customer_display_enabled) {
    return { ok: true };
  }

  const connResult = await ensureConnected();
  if (!connResult.ok) {
    console.log('Customer Display: Skipping send (test mode or not connected)');
    console.log('Would display:', text);
    return { ok: true, testMode: true };
  }

  try {
    const command = buildDisplayCommand(text);
    await new Promise((resolve, reject) => {
      port.write(command, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    return { ok: true };
  } catch (e) {
    console.error('Customer Display: Send error', e);
    return { ok: false, error: e.message };
  }
}

async function showWelcome() {
  const settings = await loadSettings();
  if (!settings || !settings.customer_display_enabled) {
    return { ok: true };
  }
  const msg = settings.customer_display_welcome_msg || 'أهلا وسهلا';
  return await sendText(msg);
}

async function showThank() {
  const settings = await loadSettings();
  if (!settings || !settings.customer_display_enabled) {
    return { ok: true };
  }
  const msg = settings.customer_display_thank_msg || 'شكرا لزيارتكم';
  return await sendText(msg);
}

async function showTotal(total) {
  const settings = await loadSettings();
  if (!settings || !settings.customer_display_enabled) {
    return { ok: true };
  }
  const formatted = `الإجمالي: ${total.toFixed(2)} ﷼`;
  return await sendText(formatted);
}

async function clearDisplay() {
  const settings = await loadSettings();
  if (!settings || !settings.customer_display_enabled) {
    return { ok: true };
  }
  return await sendText('');
}

async function disconnect() {
  if (port && port.isOpen) {
    try {
      await new Promise((resolve) => {
        port.close(() => {
          isConnected = false;
          console.log('Customer Display: Disconnected');
          resolve();
        });
      });
    } catch (e) {
      console.error('Customer Display: Disconnect error', e);
    }
  }
  isConnected = false;
  port = null;
}

module.exports = {
  loadSettings,
  connect,
  disconnect,
  sendText,
  showWelcome,
  showThank,
  showTotal,
  clearDisplay,
  get isConnected() { return isConnected; }
};
