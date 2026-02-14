const { BrowserWindow } = require('electron');
const path = require('path');

class CustomerDisplaySimulator {
  constructor(config = {}) {
    this.config = {
      columns: config.columns || 20,
      rows: config.rows || 2,
      encoding: config.encoding || 'windows-1256',
      brightness: config.brightness || 100,
      ...config
    };
    
    this.window = null;
    this.displayLines = Array(this.config.rows).fill('');
  }

  async init() {
    try {
      this.window = new BrowserWindow({
        width: 600,
        height: 200 + (this.config.rows * 30),
        title: 'Customer Display Simulator',
        backgroundColor: '#000000',
        resizable: false,
        frame: true,
        alwaysOnTop: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });

      const html = this.generateHTML();
      this.window.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));

      this.window.on('closed', () => {
        this.window = null;
      });

      await new Promise(resolve => {
        this.window.webContents.once('did-finish-load', resolve);
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async clear() {
    try {
      this.displayLines = Array(this.config.rows).fill('');
      this.updateDisplay();
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

      this.displayLines[row] = text;
      this.updateDisplay();
      
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
      if (level < 0 || level > 100) {
        level = 100;
      }
      this.config.brightness = level;
      this.updateDisplay();
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
      
      const totalText = this.formatPrice(total, currency);
      
      if (this.config.rows >= 2) {
        const row1 = this.padText('TOTAL:', this.config.columns, 'center');
        await this.write(row1, 0);
        
        const row2 = this.padText(totalText, this.config.columns, 'center');
        await this.write(row2, 1);
      } else {
        const row1 = this.padText(totalText, this.config.columns, 'center');
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
      if (this.window && !this.window.isDestroyed()) {
        this.window.close();
        this.window = null;
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  updateDisplay() {
    if (!this.window || this.window.isDestroyed()) {
      return;
    }

    const brightness = this.config.brightness / 100;
    const color = Math.floor(255 * brightness);
    
    const linesHTML = this.displayLines
      .map(line => `<div class="line">${this.escapeHtml(line)}</div>`)
      .join('');

    const js = `
      (function() {
        try {
          var elem = document.getElementById('display-content');
          if(!elem) return;
          elem.innerHTML = \`${linesHTML}\`;
          elem.style.color = 'rgb(${color}, ${color}, 0)';
        } catch(e) {}
      })();
    `;

    this.window.webContents.executeJavaScript(js).catch(() => {});
  }

  generateHTML() {
    const brightness = this.config.brightness / 100;
    const color = Math.floor(255 * brightness);
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      background: #000;
      color: rgb(${color}, ${color}, 0);
      font-family: 'Courier New', monospace;
      font-size: 24px;
      font-weight: bold;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      overflow: hidden;
      padding: 20px;
    }
    #display-container {
      width: 100%;
      padding: 20px;
      background: #111;
      border: 3px solid #333;
      border-radius: 10px;
      box-shadow: 0 0 20px rgba(0,0,0,0.5);
    }
    #display-content {
      font-size: 48px;
      line-height: 1.2;
      white-space: pre;
      text-align: center;
      letter-spacing: 2px;
    }
    .line {
      display: block;
      margin: 10px 0;
    }
    #info {
      margin-top: 15px;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <div id="display-container">
    <div id="display-content">
      ${this.displayLines.map(line => `<div class="line">${this.escapeHtml(line)}</div>`).join('')}
    </div>
  </div>
  <div id="info">
    Customer Display Simulator - ${this.config.columns}x${this.config.rows}
  </div>
</body>
</html>
    `;
  }

  padText(text, length, align = 'left') {
    const actualLength = this.getDisplayLength(text);
    if (actualLength >= length) {
      return this.truncateText(text, length);
    }
    
    const padding = ' '.repeat(length - actualLength);
    switch (align) {
      case 'center':
        const leftPad = Math.floor((length - actualLength) / 2);
        const rightPad = length - actualLength - leftPad;
        return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
      case 'right':
        return padding + text;
      default:
        return text + padding;
    }
  }

  truncateText(text, maxLength) {
    let result = '';
    let displayLength = 0;
    
    for (const char of text) {
      const charLength = this.getCharLength(char);
      if (displayLength + charLength > maxLength) break;
      result += char;
      displayLength += charLength;
    }
    
    return result;
  }

  getDisplayLength(text) {
    let length = 0;
    for (const char of text) {
      length += this.getCharLength(char);
    }
    return length;
  }

  getCharLength(char) {
    const code = char.charCodeAt(0);
    if (code >= 0x0600 && code <= 0x06FF) return 1;
    if (code >= 0xFE70 && code <= 0xFEFF) return 1;
    if (code > 127) return 2;
    return 1;
  }

  formatPrice(amount, currency = 'SAR') {
    const formatted = parseFloat(amount).toFixed(2);
    return formatted;
  }

  splitLines(text, maxWidth) {
    const lines = [];
    const words = text.split(' ');
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      if (this.getDisplayLength(testLine) <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  escapeHtml(text) {
    const div = { textContent: text };
    const textNode = { data: text };
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

module.exports = CustomerDisplaySimulator;
