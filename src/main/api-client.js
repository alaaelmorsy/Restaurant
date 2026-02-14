const axios = require('axios');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');

const gunzipAsync = promisify(zlib.gunzip);

async function decompressApiResponse(response) {
  try {
    if (!response || typeof response !== 'object') {
      return response;
    }
    
    if (response.compressed === true && typeof response.data === 'string') {
      const compressedBuffer = Buffer.from(response.data, 'base64');
      const decompressed = await gunzipAsync(compressedBuffer);
      const jsonString = decompressed.toString('utf8');
      return JSON.parse(jsonString);
    }
    
    return response;
  } catch (e) {
    console.error('API decompression error:', e);
    return response;
  }
}

let CONFIG_PATH;
try {
  const { app } = require('electron');
  CONFIG_PATH = app ? path.join(app.getPath('userData'), 'device-config.json') : null;
} catch (_) { CONFIG_PATH = null; }
if (!CONFIG_PATH) {
  const appRoot = path.resolve(__dirname, '..', '..');
  CONFIG_PATH = path.join(appRoot, 'app', 'device-config.json');
}

let deviceConfig = {
  mode: 'primary',
  api_host: '127.0.0.1',
  api_port: 4310,
};

function loadDeviceConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const saved = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      deviceConfig = { ...deviceConfig, ...saved };
    }
  } catch (_) { }
}

function saveDeviceConfig() {
  try {
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(deviceConfig, null, 2), 'utf-8');
  } catch (_) { }
}

function isPrimaryDevice() {
  loadDeviceConfig();
  return deviceConfig.mode === 'primary';
}

function isSecondaryDevice() {
  return !isPrimaryDevice();
}

function getDeviceMode() {
  loadDeviceConfig();
  return deviceConfig.mode;
}

function setDeviceMode(mode, apiHost, apiPort) {
  deviceConfig.mode = mode;
  if (apiHost) deviceConfig.api_host = apiHost;
  if (apiPort) deviceConfig.api_port = Number(apiPort);
  saveDeviceConfig();
}

function getApiBaseUrl() {
  loadDeviceConfig();
  return `http://${deviceConfig.api_host}:${deviceConfig.api_port}/api`;
}

const apiClient = axios.create({
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive',
  },
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
  httpAgent: new (require('http').Agent)({
    keepAlive: true,
    keepAliveMsecs: 3000,
    maxSockets: 50,
    maxFreeSockets: 10,
    timeout: 8000,
  }),
});

apiClient.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  return config;
});

async function retryRequest(requestFn, maxRetries = 1) {
  let lastError;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries && (!error.response || error.response.status >= 500)) {
        await new Promise(resolve => setTimeout(resolve, 300 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

async function fetchFromAPI(endpoint, params = {}) {
  try {
    const response = await retryRequest(() => apiClient.get(endpoint, { params }));
    const decompressed = await decompressApiResponse(response.data);
    return decompressed;
  } catch (error) {
    console.error(`API fetch error [${endpoint}]:`, error.message);
    return { ok: false, error: error.message || 'API request failed' };
  }
}

async function postToAPI(endpoint, payload = {}) {
  try {
    const response = await retryRequest(() => apiClient.post(endpoint, payload));
    return response.data;
  } catch (error) {
    console.error(`API post error [${endpoint}]:`, error.message);
    return { ok: false, error: error.message || 'API request failed' };
  }
}

module.exports = {
  isPrimaryDevice,
  isSecondaryDevice,
  getDeviceMode,
  setDeviceMode,
  getApiBaseUrl,
  fetchFromAPI,
  postToAPI,
};
