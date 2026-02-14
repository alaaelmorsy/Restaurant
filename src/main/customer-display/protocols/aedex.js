const BaseProtocol = require('./base');

class AEDEXProtocol extends BaseProtocol {
  constructor(serialPort, config) {
    super(config);
    this.port = serialPort;
    
    this.commands = {
      SOH: 0x01,
      STX: 0x02,
      ETX: 0x03,
      EOT: 0x04,
      CR: 0x0D,
      LF: 0x0A,
      CLR: 0x0C
    };
  }

  async init() {
    try {
      await this.sendCommand([this.commands.SOH, 0x30, 0x30]);
      await this.clear();
      await this.setBrightness(this.config.brightness);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async clear() {
    try {
      await this.sendCommand([this.commands.CLR]);
      await this.sleep(50);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async write(text, row = 0) {
    try {
      if (row >= this.config.rows) {
        return { success: false, error: 'Row out of bounds' };
      }

      await this.setCursorPosition(row, 0);
      
      const paddedText = this.padText(text, this.config.columns, 'left');
      const encoded = this.encodeText(paddedText);
      
      const message = Buffer.concat([
        Buffer.from([this.commands.STX]),
        encoded,
        Buffer.from([this.commands.ETX])
      ]);
      
      await this.sendCommand(message);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async setCursorPosition(row, col) {
    try {
      const rowChar = String.fromCharCode(0x30 + row);
      const colChar = String.fromCharCode(0x30 + col);
      const cmd = [this.commands.SOH, rowChar.charCodeAt(0), colChar.charCodeAt(0)];
      await this.sendCommand(cmd);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async setBrightness(level) {
    try {
      if (level < 0 || level > 100) {
        level = 100;
      }
      
      const brightness = Math.floor((level / 100) * 7) + 1;
      const cmd = [this.commands.SOH, 0x42, 0x30 + brightness];
      await this.sendCommand(cmd);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async displayWelcome(message) {
    try {
      await this.clear();
      
      const lines = this.splitLines(message, this.config.columns);
      
      for (let i = 0; i < Math.min(lines.length, this.config.rows); i++) {
        const centeredText = this.padText(lines[i], this.config.columns, 'center');
        await this.write(centeredText, i);
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async displayItem(itemName, price, currency = 'SAR') {
    try {
      await this.clear();
      
      const row1 = this.padText(this.truncateText(itemName, this.config.columns - 1), this.config.columns, 'left');
      await this.write(row1, 0);
      
      if (this.config.rows >= 2) {
        const priceText = this.formatPrice(price, currency);
        const row2 = this.padText(priceText, this.config.columns, 'right');
        await this.write(row2, 1);
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async displayTotal(total, currency = 'SAR') {
    try {
      await this.clear();
      
      if (this.config.rows >= 2) {
        const row1 = this.padText('TOTAL', this.config.columns, 'center');
        await this.write(row1, 0);
        const totalText = this.formatPrice(total, currency);
        const row2 = this.padText(totalText, this.config.columns, 'center');
        await this.write(row2, 1);
      } else {
        const totalText = `TOTAL: ${this.formatPrice(total, currency)}`;
        const row1 = this.padText(totalText, this.config.columns, 'left');
        await this.write(row1, 0);
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async displayThankYou(message) {
    try {
      await this.clear();
      
      const lines = this.splitLines(message, this.config.columns);
      
      for (let i = 0; i < Math.min(lines.length, this.config.rows); i++) {
        const centeredText = this.padText(lines[i], this.config.columns, 'center');
        await this.write(centeredText, i);
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async close() {
    try {
      await this.clear();
      await this.sendCommand([this.commands.EOT]);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
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
}

module.exports = AEDEXProtocol;
