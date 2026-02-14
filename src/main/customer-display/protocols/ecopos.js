const BaseProtocol = require('./base');

class ECOPOSProtocol extends BaseProtocol {
  constructor(serialPort, config) {
    super(config);
    this.port = serialPort;
    this.currentValue = '0.00';
    
    this.commands = {
      STX: 0x02,
      ETX: 0x03,
      CR: 0x0D,
      LF: 0x0A,
      CLR: 0x0C
    };
  }

  async init() {
    try {
      console.log('[ECOPOS] Initializing display...');
      
      await this.setSignals(true, true);
      await this.sleep(100);
      
      await this.clear();
      await this.sleep(100);
      
      console.log('[ECOPOS] Display initialized successfully');
      return { success: true };
    } catch (error) {
      console.error('[ECOPOS] Init error:', error);
      return { success: false, error: error.message };
    }
  }

  async clear() {
    try {
      await this.sendNumber('0.00');
      this.currentValue = '0.00';
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async write(text, row = 0) {
    try {
      const number = this.extractNumber(text);
      if (number !== null) {
        await this.sendNumber(number);
        this.currentValue = number;
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async setCursorPosition(row, col) {
    try {
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async setBrightness(level) {
    try {
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async displayWelcome(message) {
    try {
      await this.sendNumber('0.00');
      this.currentValue = '0.00';
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async displayItem(itemName, price, currency = 'SAR') {
    try {
      const priceStr = parseFloat(price).toFixed(2);
      await this.sendNumber(priceStr);
      this.currentValue = priceStr;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async displayTotal(total, currency = 'SAR') {
    try {
      const totalStr = parseFloat(total).toFixed(2);
      await this.sendNumber(totalStr);
      this.currentValue = totalStr;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async displayThankYou(message) {
    try {
      await this.sleep(1000);
      await this.sendNumber('0.00');
      this.currentValue = '0.00';
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async close() {
    try {
      await this.sendNumber('0.00');
      this.currentValue = '0.00';
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendNumber(value) {
    try {
      const numStr = this.formatNumber(value);
      const formattedData = `${numStr.padStart(8, ' ')}\r\n`;
      const buffer = Buffer.from(formattedData);
      
      console.log(`[ECOPOS] Sending: "${numStr}" (smart_spaces_8), bytes:`, buffer);
      
      await this.sendCommand(buffer);
      await this.drainPort();
      await this.sleep(50);
    } catch (error) {
      console.error('[ECOPOS] Send error:', error);
      throw error;
    }
  }

  formatNumber(value) {
    let num = parseFloat(value);
    if (isNaN(num)) num = 0;
    
    const rounded = Math.round(num * 100) / 100;
    if (rounded % 1 === 0) {
      return Math.round(rounded).toString();
    }
    const str = rounded.toFixed(2);
    console.log(`[ECOPOS] formatNumber: input=${value}, rounded=${rounded}, output="${str}"`);
    return str;
  }

  extractNumber(text) {
    const match = text.match(/[\d.]+/);
    if (match) {
      const num = parseFloat(match[0]);
      return isNaN(num) ? null : num.toFixed(2);
    }
    return null;
  }

  async sendCommand(data) {
    return new Promise((resolve, reject) => {
      const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
      this.port.write(buffer, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  drainPort() {
    return new Promise((resolve, reject) => {
      this.port.drain((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  setSignals(dtr, rts) {
    return new Promise((resolve, reject) => {
      this.port.set({ dtr, rts }, (err) => {
        if (err) {
          console.warn('[ECOPOS] Failed to set signals:', err.message);
          resolve();
        } else {
          console.log(`[ECOPOS] Signals set - DTR: ${dtr}, RTS: ${rts}`);
          resolve();
        }
      });
    });
  }
}

module.exports = ECOPOSProtocol;
