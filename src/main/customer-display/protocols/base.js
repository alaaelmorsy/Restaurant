class BaseProtocol {
  constructor(config = {}) {
    if (this.constructor === BaseProtocol) {
      throw new Error('BaseProtocol is an abstract class and cannot be instantiated directly');
    }
    
    this.config = {
      columns: config.columns || 20,
      rows: config.rows || 2,
      encoding: config.encoding || 'windows-1256',
      brightness: config.brightness || 100,
      ...config
    };
  }

  init() {
    throw new Error('Method init() must be implemented by subclass');
  }

  clear() {
    throw new Error('Method clear() must be implemented by subclass');
  }

  write(text, row = 0) {
    throw new Error('Method write() must be implemented by subclass');
  }

  setCursorPosition(row, col) {
    throw new Error('Method setCursorPosition() must be implemented by subclass');
  }

  setBrightness(level) {
    throw new Error('Method setBrightness() must be implemented by subclass');
  }

  close() {
    throw new Error('Method close() must be implemented by subclass');
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

  encodeText(text) {
    if (this.config.encoding === 'utf-8') {
      return Buffer.from(text, 'utf-8');
    }
    if (this.config.encoding === 'windows-1256') {
      return this.encodeWindows1256(text);
    }
    return Buffer.from(text, 'ascii');
  }

  encodeWindows1256(text) {
    const buffer = [];
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code < 128) {
        buffer.push(code);
      } else {
        const mapped = this.arabicToWindows1256(code);
        buffer.push(mapped || 63);
      }
    }
    return Buffer.from(buffer);
  }

  arabicToWindows1256(unicode) {
    const map = {
      0x0621: 0xC1, 0x0622: 0xC2, 0x0623: 0xC3, 0x0624: 0xC4,
      0x0625: 0xC5, 0x0626: 0xC6, 0x0627: 0xC7, 0x0628: 0xC8,
      0x0629: 0xC9, 0x062A: 0xCA, 0x062B: 0xCB, 0x062C: 0xCC,
      0x062D: 0xCD, 0x062E: 0xCE, 0x062F: 0xCF, 0x0630: 0xD0,
      0x0631: 0xD1, 0x0632: 0xD2, 0x0633: 0xD3, 0x0634: 0xD4,
      0x0635: 0xD5, 0x0636: 0xD6, 0x0637: 0xD8, 0x0638: 0xD9,
      0x0639: 0xDA, 0x063A: 0xDB, 0x0640: 0xE0, 0x0641: 0xE1,
      0x0642: 0xE2, 0x0643: 0xE3, 0x0644: 0xE4, 0x0645: 0xE5,
      0x0646: 0xE6, 0x0647: 0xE7, 0x0648: 0xE8, 0x0649: 0xE9,
      0x064A: 0xEA, 0x064B: 0xEB, 0x064C: 0xEC, 0x064D: 0xED,
      0x064E: 0xEE, 0x064F: 0xEF, 0x0650: 0xF0, 0x0651: 0xF1,
      0x0652: 0xF2
    };
    return map[unicode] || null;
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
}

module.exports = BaseProtocol;
