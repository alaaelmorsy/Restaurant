const { SerialPort } = require('serialport');
const ESCPOSProtocol = require('./protocols/escpos');
const CD5220Protocol = require('./protocols/cd5220');
const AEDEXProtocol = require('./protocols/aedex');
const GenericProtocol = require('./protocols/generic');
const ECOPOSProtocol = require('./protocols/ecopos');
const CustomerDisplaySimulator = require('./simulator');

class DisplayManager {
  constructor() {
    this.protocol = null;
    this.serialPort = null;
    this.simulator = null;
    this.config = {};
    this.isConnected = false;
    this.reconnectInterval = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async init(config) {
    try {
      this.config = {
        enabled: config.enabled || false,
        simulator: config.simulator || false,
        port: config.port || null,
        baudRate: config.baudRate || 9600,
        columns: config.columns || 20,
        rows: config.rows || 2,
        protocol: config.protocol || 'escpos',
        encoding: config.encoding || 'windows-1256',
        brightness: config.brightness || 100,
        welcomeMsg: config.welcomeMsg || 'Welcome',
        thankyouMsg: config.thankyouMsg || 'Thank you',
        ...config
      };

      if (!this.config.enabled) {
        return { success: true, message: 'Customer display is disabled' };
      }

      if (this.config.simulator) {
        return await this.initSimulator();
      } else {
        return await this.initHardware();
      }
    } catch (error) {
      console.error('DisplayManager: Init error', error);
      return { success: false, error: error.message };
    }
  }

  async initSimulator() {
    try {
      this.simulator = new CustomerDisplaySimulator({
        columns: this.config.columns,
        rows: this.config.rows,
        encoding: this.config.encoding,
        brightness: this.config.brightness
      });

      const result = await this.simulator.init();
      if (result.success) {
        this.protocol = this.simulator;
        this.isConnected = true;
        console.log('Customer Display: Simulator initialized');
      }
      return result;
    } catch (error) {
      console.error('DisplayManager: Simulator init error', error);
      return { success: false, error: error.message };
    }
  }

  async initHardware() {
    try {
      if (!this.config.port) {
        return { success: false, error: 'Port not configured' };
      }

      this.serialPort = new SerialPort({
        path: this.config.port,
        baudRate: this.config.baudRate,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        rtscts: false,
        xon: false,
        xoff: false,
        autoOpen: false
      });

      await this.openPort();

      this.protocol = this.createProtocol(this.serialPort);
      
      const result = await this.protocol.init();
      if (result.success) {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log(`Customer Display: Connected to ${this.config.port} using ${this.config.protocol}`);
        
        this.setupErrorHandlers();
      }
      
      return result;
    } catch (error) {
      console.error('DisplayManager: Hardware init error', error);
      this.scheduleReconnect();
      return { success: false, error: error.message };
    }
  }

  createProtocol(serialPort) {
    const protocolConfig = {
      columns: this.config.columns,
      rows: this.config.rows,
      encoding: this.config.encoding,
      brightness: this.config.brightness
    };

    switch (this.config.protocol.toLowerCase()) {
      case 'cd5220':
        return new CD5220Protocol(serialPort, protocolConfig);
      case 'aedex':
        return new AEDEXProtocol(serialPort, protocolConfig);
      case 'generic':
        return new GenericProtocol(serialPort, protocolConfig);
      case 'ecopos':
        return new ECOPOSProtocol(serialPort, protocolConfig);
      case 'escpos':
      default:
        return new ESCPOSProtocol(serialPort, protocolConfig);
    }
  }

  openPort() {
    return new Promise((resolve, reject) => {
      this.serialPort.open((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  setupErrorHandlers() {
    if (!this.serialPort) return;

    this.serialPort.on('error', (err) => {
      console.error('Customer Display: Serial port error', err);
      this.isConnected = false;
      this.scheduleReconnect();
    });

    this.serialPort.on('close', () => {
      console.log('Customer Display: Serial port closed');
      this.isConnected = false;
      this.scheduleReconnect();
    });
  }

  scheduleReconnect() {
    if (this.reconnectInterval) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Customer Display: Max reconnect attempts reached');
      return;
    }

    console.log(`Customer Display: Scheduling reconnect attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts}`);
    
    this.reconnectInterval = setInterval(async () => {
      this.reconnectAttempts++;
      console.log(`Customer Display: Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      const result = await this.initHardware();
      if (result.success) {
        this.clearReconnectInterval();
      } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.clearReconnectInterval();
      }
    }, 5000);
  }

  clearReconnectInterval() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
  }

  async clear() {
    if (!this.isConnected || !this.protocol) {
      return { success: false, error: 'Not connected' };
    }

    try {
      return await this.protocol.clear();
    } catch (error) {
      console.error('DisplayManager: Clear error', error);
      return { success: false, error: error.message };
    }
  }

  async write(text, row = 0) {
    if (!this.isConnected || !this.protocol) {
      return { success: false, error: 'Not connected' };
    }

    try {
      return await this.protocol.write(text, row);
    } catch (error) {
      console.error('DisplayManager: Write error', error);
      return { success: false, error: error.message };
    }
  }

  async displayWelcome(customMessage = null) {
    if (!this.isConnected || !this.protocol) {
      return { success: false, error: 'Not connected' };
    }

    try {
      const message = customMessage || this.config.welcomeMsg || 'Welcome';
      return await this.protocol.displayWelcome(message);
    } catch (error) {
      console.error('DisplayManager: Display welcome error', error);
      return { success: false, error: error.message };
    }
  }

  async displayItem(itemName, price, currency = 'SAR') {
    if (!this.isConnected || !this.protocol) {
      return { success: false, error: 'Not connected' };
    }

    try {
      return await this.protocol.displayItem(itemName, price, currency);
    } catch (error) {
      console.error('DisplayManager: Display item error', error);
      return { success: false, error: error.message };
    }
  }

  async displayTotal(total, currency = 'SAR') {
    if (!this.isConnected || !this.protocol) {
      return { success: false, error: 'Not connected' };
    }

    try {
      return await this.protocol.displayTotal(total, currency);
    } catch (error) {
      console.error('DisplayManager: Display total error', error);
      return { success: false, error: error.message };
    }
  }

  async displayThankYou(customMessage = null) {
    if (!this.isConnected || !this.protocol) {
      return { success: false, error: 'Not connected' };
    }

    try {
      const message = customMessage || this.config.thankyouMsg || 'Thank you';
      return await this.protocol.displayThankYou(message);
    } catch (error) {
      console.error('DisplayManager: Display thank you error', error);
      return { success: false, error: error.message };
    }
  }

  async setBrightness(level) {
    if (!this.isConnected || !this.protocol) {
      return { success: false, error: 'Not connected' };
    }

    try {
      return await this.protocol.setBrightness(level);
    } catch (error) {
      console.error('DisplayManager: Set brightness error', error);
      return { success: false, error: error.message };
    }
  }

  async close() {
    try {
      this.clearReconnectInterval();
      
      if (this.protocol) {
        await this.protocol.close();
        this.protocol = null;
      }

      if (this.serialPort && this.serialPort.isOpen) {
        await new Promise((resolve) => {
          this.serialPort.close(() => {
            resolve();
          });
        });
        this.serialPort = null;
      }

      if (this.simulator) {
        await this.simulator.close();
        this.simulator = null;
      }

      this.isConnected = false;
      console.log('Customer Display: Closed');
      
      return { success: true };
    } catch (error) {
      console.error('DisplayManager: Close error', error);
      return { success: false, error: error.message };
    }
  }

  async listPorts() {
    try {
      const ports = await SerialPort.list();
      return { 
        success: true, 
        ports: ports.map(p => ({
          path: p.path,
          manufacturer: p.manufacturer,
          serialNumber: p.serialNumber,
          vendorId: p.vendorId,
          productId: p.productId
        }))
      };
    } catch (error) {
      console.error('DisplayManager: List ports error', error);
      return { success: false, error: error.message, ports: [] };
    }
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      config: this.config,
      reconnectAttempts: this.reconnectAttempts
    };
  }


}

module.exports = DisplayManager;
