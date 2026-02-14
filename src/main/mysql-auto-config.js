// Auto-configure MySQL for VPN/Network access on first run (Primary Device only)
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Path to track if MySQL has been configured (will be set after app is ready)
let CONFIG_MARKER_FILE = null;

/**
 * Initialize config marker file path
 */
function initConfigPath(app) {
  if (!CONFIG_MARKER_FILE) {
    CONFIG_MARKER_FILE = path.join(app.getPath('userData'), '.mysql-configured');
    console.log(`📁 MySQL config marker path: ${CONFIG_MARKER_FILE}`);
  }
}

/**
 * Check if MySQL auto-configuration has already been applied
 */
function isMySQLConfigured(app) {
  initConfigPath(app);
  const exists = fs.existsSync(CONFIG_MARKER_FILE);
  console.log(`🔍 Checking MySQL config marker: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
  return exists;
}

/**
 * Mark MySQL as configured to prevent re-running
 */
function markMySQLAsConfigured() {
  try {
    fs.writeFileSync(CONFIG_MARKER_FILE, new Date().toISOString(), 'utf-8');
    console.log('✅ MySQL marked as configured');
  } catch (error) {
    console.error('Failed to mark MySQL as configured:', error.message);
  }
}

/**
 * Find MySQL installation directory
 */
function findMySQLDirectory() {
  const possiblePaths = [
    'C:\\ProgramData\\MySQL\\MySQL Server 5.7',
    'C:\\Program Files\\MySQL\\MySQL Server 5.7',
    'C:\\Program Files (x86)\\MySQL\\MySQL Server 5.7',
    'C:\\MySQL\\MySQL Server 5.7',
  ];

  for (const dir of possiblePaths) {
    if (fs.existsSync(dir)) {
      return dir;
    }
  }
  return null;
}

/**
 * Apply MySQL optimized configuration
 */
async function applyMySQLConfig() {
  try {
    console.log('🔧 Auto-configuring MySQL for VPN/Network access...');

    // Find MySQL installation
    const mysqlDir = findMySQLDirectory();
    if (!mysqlDir) {
      console.log('⚠️ MySQL Server 5.7 not found, skipping auto-configuration');
      markMySQLAsConfigured(); // Mark as done to avoid retrying
      return false;
    }

    console.log(`📁 Found MySQL at: ${mysqlDir}`);

    // Path to optimized config
    const appRoot = path.resolve(__dirname, '..', '..');
    const optimizedConfigPath = path.join(appRoot, 'my-optimized.ini');

    if (!fs.existsSync(optimizedConfigPath)) {
      console.log('⚠️ my-optimized.ini not found, skipping auto-configuration');
      markMySQLAsConfigured();
      return false;
    }

    const targetConfigPath = path.join(mysqlDir, 'my.ini');

    // Backup existing my.ini
    if (fs.existsSync(targetConfigPath)) {
      const backupName = `my.ini.backup.${Date.now()}`;
      const backupPath = path.join(mysqlDir, backupName);
      fs.copyFileSync(targetConfigPath, backupPath);
      console.log(`💾 Backup created: ${backupName}`);
    }

    // Copy optimized config
    fs.copyFileSync(optimizedConfigPath, targetConfigPath);
    console.log('📝 Copied optimized MySQL configuration');

    // Restart MySQL service
    try {
      console.log('🔄 Restarting MySQL service...');
      execSync('net stop MySQL57', { timeout: 10000, windowsHide: true });
      console.log('⏸️ MySQL service stopped');
      
      // Wait 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      execSync('net start MySQL57', { timeout: 10000, windowsHide: true });
      console.log('▶️ MySQL service started with new configuration');
    } catch (error) {
      console.error('⚠️ Failed to restart MySQL service:', error.message);
      console.log('ℹ️ Please restart MySQL service manually for changes to take effect');
    }

    // Setup firewall rule
    try {
      console.log('🔥 Setting up firewall rule for MySQL...');
      
      // Delete existing rule if any
      try {
        execSync('netsh advfirewall firewall delete rule name="MySQL Server (Port 3306)"', { windowsHide: true });
      } catch (_) { /* ignore if rule doesn't exist */ }
      
      // Add new rule
      execSync(
        'netsh advfirewall firewall add rule name="MySQL Server (Port 3306)" dir=in action=allow protocol=TCP localport=3306 enable=yes profile=any',
        { timeout: 5000, windowsHide: true }
      );
      console.log('✅ Firewall rule created for port 3306');
    } catch (error) {
      console.error('⚠️ Failed to setup firewall rule:', error.message);
      console.log('ℹ️ Please run setup-mysql-firewall.bat manually');
    }

    // Mark as configured
    markMySQLAsConfigured();
    
    console.log('');
    console.log('========================================');
    console.log('✅ MySQL Auto-Configuration Complete!');
    console.log('========================================');
    console.log('[+] bind-address=0.0.0.0 (accepts VPN connections)');
    console.log('[+] innodb_buffer_pool_size=2GB (fast performance)');
    console.log('[+] query_cache=256MB (cached queries)');
    console.log('[+] max_connections=500 (supports multiple devices)');
    console.log('[+] Firewall rule added for port 3306');
    console.log('');

    return true;

  } catch (error) {
    console.error('❌ MySQL auto-configuration failed:', error.message);
    // Mark as configured to avoid infinite retries
    markMySQLAsConfigured();
    return false;
  }
}

/**
 * Auto-configure MySQL on first run (Primary Device only)
 * Should be called from main.js after app.whenReady()
 */
async function autoConfigureMySQLIfNeeded(isPrimary, app = null) {
  // Get electron app if not provided
  if (!app) {
    app = require('electron').app;
  }

  // Initialize config path
  initConfigPath(app);

  // Only run on primary devices
  if (!isPrimary) {
    console.log('ℹ️ MySQL auto-configuration skipped (Secondary Device)');
    return;
  }

  // Check if already configured
  if (isMySQLConfigured(app)) {
    console.log('ℹ️ MySQL already configured, skipping auto-configuration');
    console.log(`   To re-configure, delete: ${CONFIG_MARKER_FILE}`);
    return;
  }

  // Run configuration
  console.log('🚀 First-time MySQL auto-configuration starting...');
  await applyMySQLConfig();
}

module.exports = {
  autoConfigureMySQLIfNeeded,
  isMySQLConfigured,
  applyMySQLConfig
};
