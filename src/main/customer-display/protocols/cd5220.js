const BaseProtocol = require('./base');

class CD5220Protocol extends BaseProtocol {
  constructor(serialPort, config) {
    super(config);
    this.port = serialPort;
    
    this.commands = {
      STX: 0x02,
      ETX: 0x03,
      ENQ: 0x05,
      ACK: 0x06,
      NAK: 0x15,
      DC1: 0x11,
      DC2: 0x12,
      DC3: 0x13,
      DC4: 0x14,
      CLR: 0x0C,
      CR: 0x0D,
      LF: 0x0A
    };
  }

  async init() {
    try {
      await this.sendCommand([this.commands.DC2]);
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
      
      await this.sendCommand(encoded);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async setCursorPosition(row, col) {
    try {
      const cmd = [this.commands.STX, 0x47, 0x30 + row, 0x30 + col, this.commands.ETX];
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
      
      const brightness = Math.floor((level / 100) * 3) + 1;
      const cmd = [this.commands.STX, 0x42, 0x30 + brightness, this.commands.ETX];
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

module.exports = CD5220Protocol;
