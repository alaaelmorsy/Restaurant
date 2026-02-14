const { ipcMain } = require('electron');
const DisplayManager = require('./display-manager');
const { getPool, DB_NAME } = require('../../db/connection');

const displayManager = new DisplayManager();
let currentSettings = null;

async function loadSettings() {
  try {
    const pool = await getPool();
    const conn = await pool.getConnection();
    try {
      await conn.query(`USE \`${DB_NAME}\``);
      const [rows] = await conn.query(
        `SELECT 
          customer_display_enabled,
          customer_display_port,
          customer_display_baud_rate,
          customer_display_welcome_msg,
          customer_display_thankyou_msg,
          customer_display_data_format
        FROM app_settings 
        WHERE id = 1 
        LIMIT 1`
      );
      currentSettings = rows[0] || {};
      return currentSettings;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Customer Display: Failed to load settings', error);
    return null;
  }
}

async function initialize() {
  try {
    const settings = await loadSettings();
    if (!settings || !settings.customer_display_enabled) {
      console.log('Customer Display: Disabled');
      return { success: true, message: 'Customer display is disabled' };
    }

    const config = {
      enabled: Boolean(settings.customer_display_enabled),
      simulator: false,
      port: settings.customer_display_port,
      baudRate: settings.customer_display_baud_rate || 9600,
      columns: 8,
      rows: 1,
      protocol: 'ecopos',
      encoding: 'ascii',
      brightness: 100,
      welcomeMsg: '1',
      thankyouMsg: '1'
    };

    const result = await displayManager.init(config);
    
    if (result.success) {
      await displayManager.displayWelcome();
    }
    
    return result;
  } catch (error) {
    console.error('Customer Display: Initialize error', error);
    return { success: false, error: error.message };
  }
}

async function reinitialize() {
  try {
    await displayManager.close();
    return await initialize();
  } catch (error) {
    console.error('Customer Display: Reinitialize error', error);
    return { success: false, error: error.message };
  }
}

function setupIPCHandlers() {
  ipcMain.handle('customer-display:init', async () => {
    return await initialize();
  });

  ipcMain.handle('customer-display:reinit', async () => {
    return await reinitialize();
  });

  ipcMain.handle('customer-display:close', async () => {
    return await displayManager.close();
  });

  ipcMain.handle('customer-display:clear', async () => {
    return await displayManager.clear();
  });

  ipcMain.handle('customer-display:write', async (event, text, row) => {
    return await displayManager.write(text, row);
  });

  ipcMain.handle('customer-display:welcome', async (event, customMessage) => {
    return await displayManager.displayWelcome(customMessage);
  });

  ipcMain.handle('customer-display:item', async (event, itemName, price, currency) => {
    return await displayManager.displayItem(itemName, price, currency);
  });

  ipcMain.handle('customer-display:total', async (event, total, currency) => {
    return await displayManager.displayTotal(total, currency);
  });

  ipcMain.handle('customer-display:thankyou', async (event, customMessage) => {
    return await displayManager.displayThankYou(customMessage);
  });

  ipcMain.handle('customer-display:brightness', async (event, level) => {
    return await displayManager.setBrightness(level);
  });

  ipcMain.handle('customer-display:list-ports', async () => {
    return await displayManager.listPorts();
  });

  ipcMain.handle('customer-display:status', async () => {
    return displayManager.getStatus();
  });

  ipcMain.handle('customer-display:test', async () => {
    try {
      await displayManager.clear();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await displayManager.displayItem('Test Product', 99.99, 'SAR');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await displayManager.displayTotal(99.99, 'SAR');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await displayManager.displayWelcome();
      
      return { success: true };
    } catch (error) {
      console.error('Customer Display: Test error', error);
      return { success: false, error: error.message };
    }
  });

  console.log('Customer Display: IPC handlers registered');
}

async function cleanup() {
  try {
    await displayManager.close();
    console.log('Customer Display: Cleanup complete');
  } catch (error) {
    console.error('Customer Display: Cleanup error', error);
  }
}

module.exports = {
  initialize,
  reinitialize,
  setupIPCHandlers,
  cleanup,
  displayManager,
  
  async displayWelcome(customMessage) {
    return await displayManager.displayWelcome(customMessage);
  },
  
  async displayItem(itemName, price, currency = 'SAR') {
    return await displayManager.displayItem(itemName, price, currency);
  },
  
  async displayTotal(total, currency = 'SAR') {
    return await displayManager.displayTotal(total, currency);
  },
  
  async displayThankYou(customMessage) {
    return await displayManager.displayThankYou(customMessage);
  },
  
  async clear() {
    return await displayManager.clear();
  }
};
