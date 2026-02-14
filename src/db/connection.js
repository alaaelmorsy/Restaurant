// MySQL connection pool with runtime-configurable host
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Persisted config path (use Electron userData when available)
let CONFIG_PATH;
try {
  const { app } = require('electron');
  CONFIG_PATH = app ? path.join(app.getPath('userData'), 'db-config.json') : null;
} catch (_) { CONFIG_PATH = null; }
if (!CONFIG_PATH) {
  // Fallback for dev/non-electron context
  const appRoot = path.resolve(__dirname, '..', '..');
  CONFIG_PATH = path.join(appRoot, 'app', 'db-config.json');
}

// Base config from environment
let currentConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'Db2@dm1n2022',
  name: process.env.DB_NAME || 'pos_db',
};

// Expose DB_NAME as a constant used by callers (from env)
const DB_NAME = currentConfig.name;

function safeReadJSON(p){ try{ return JSON.parse(fs.readFileSync(p, 'utf-8')); }catch(_){ return null; } }
function safeWriteJSON(p, obj){ try{ fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf-8'); }catch(_){ /* ignore */ } }

function loadSavedConfig(){
  try{
    if(fs.existsSync(CONFIG_PATH)){
      const saved = safeReadJSON(CONFIG_PATH) || {};
      currentConfig = { ...currentConfig, ...saved };
    }
  }catch(_){ /* ignore */ }
}

function saveConfig(){
  const toSave = { host: currentConfig.host, port: currentConfig.port, user: currentConfig.user, password: currentConfig.password, name: currentConfig.name };
  safeWriteJSON(CONFIG_PATH, toSave);
}

// Ensure the current DB user can connect remotely (idempotent)
async function ensureRemoteAccess(conn){
  try{
    const u = String(currentConfig.user || '').trim();
    const pw = String(currentConfig.password || '').trim();
    const db = String(DB_NAME || '').trim();
    if(!u || !pw || !db) return;

    // Simple escape for single quotes
    const esc = (s) => s.replace(/'/g, "''");

    // Allow from any host
    await conn.query(`CREATE USER IF NOT EXISTS '${esc(u)}'@'%' IDENTIFIED BY '${esc(pw)}';`);
    await conn.query(`GRANT ALL PRIVILEGES ON \`${esc(db)}\`.* TO '${esc(u)}'@'%';`);

    // Additionally allow from RadminVPN range (26.x.x.x), harmless if '%' already granted
    await conn.query(`CREATE USER IF NOT EXISTS '${esc(u)}'@'26.%' IDENTIFIED BY '${esc(pw)}';`);
    await conn.query(`GRANT ALL PRIVILEGES ON \`${esc(db)}\`.* TO '${esc(u)}'@'26.%';`);

    await conn.query('FLUSH PRIVILEGES;');
  }catch(_){ /* ignore if no privilege or MySQL policy prevents it */ }
}

// Optimize MySQL performance settings automatically (for VPN/API server performance)
async function optimizeMySQLSettings(conn){
  try{
    const optimizations = [
      // Connection & Thread settings
      ['max_connections', 500],
      ['thread_cache_size', 100],
      ['max_allowed_packet', 67108864],  // 64MB
      
      // InnoDB Buffer Pool (critical for performance) - MySQL 5.7 compatible
      ['innodb_buffer_pool_size', 2147483648],  // 2GB
      ['innodb_flush_log_at_trx_commit', 2],    // Better performance
      ['innodb_file_per_table', 1],
      ['innodb_buffer_pool_instances', 4],
      
      // Query Cache (works perfectly in MySQL 5.7)
      ['query_cache_type', 1],
      ['query_cache_size', 268435456],  // 256MB
      ['query_cache_limit', 2097152],   // 2MB
      
      // Network & Timeout optimizations
      ['net_read_timeout', 60],
      ['net_write_timeout', 60],
      ['wait_timeout', 28800],
      ['interactive_timeout', 28800],
      
      // Table cache
      ['table_open_cache', 4096],
      ['table_definition_cache', 2048],
      
      // MySQL 5.7 specific optimizations
      ['sort_buffer_size', 4194304],     // 4MB
      ['read_buffer_size', 2097152],     // 2MB
      ['read_rnd_buffer_size', 4194304], // 4MB
      ['join_buffer_size', 2097152],     // 2MB
    ];

    for (const [varName, value] of optimizations) {
      try {
        await conn.query(`SET GLOBAL ${varName} = ?`, [value]);
      } catch (err) {
        // Ignore errors for settings that can't be changed dynamically or don't exist in this MySQL version
        if (!err.message.includes('read only') && !err.message.includes('Unknown system variable')) {
          console.log(`MySQL optimization warning [${varName}]:`, err.message);
        }
      }
    }
    
    console.log('✅ MySQL performance optimizations applied successfully');
  }catch(error){
    console.log('MySQL optimization error (non-critical):', error.message);
  }
}

async function initDbFromSaved(){
  loadSavedConfig();
  // If a pool was already created (unlikely on startup), drop it to apply saved config next time
  if(pool){ try{ await pool.end(); }catch(_){ } pool = null; poolInitPromise = null; }
}

let pool;
let poolInitPromise = null;

async function getPool() {
  if (pool) return pool;
  
  if (poolInitPromise) {
    await poolInitPromise;
    return pool;
  }

  // Load saved config before creating pool (first time only)
  loadSavedConfig();

  poolInitPromise = (async () => {
    pool = mysql.createPool({
      host: currentConfig.host,
      port: currentConfig.port,
      user: currentConfig.user,
      password: currentConfig.password,
      waitForConnections: true,
      connectionLimit: 50,               // تقليل من 200 إلى 50 (أقل overhead، أفضل للـ VPN)
      queueLimit: 100,                   // تحديد queue بدلاً من 0 (منع التكدس)
      multipleStatements: true,
      connectTimeout: 5000,              // تقليل من 10000 إلى 5000 للاتصال الأسرع (VPN optimized)
      enableKeepAlive: true,
      keepAliveInitialDelay: 3000,       // تقليل من 5000 إلى 3000 للحفاظ على الاتصال
      maxIdle: 20,                       // تقليل من 50 إلى 20 (توازن بين الأداء والموارد)
      idleTimeout: 60000,                // تقليل من 120000 إلى 60000 (تحرير الاتصالات الخاملة أسرع)
      charset: 'utf8mb4',
      timezone: 'local',
      namedPlaceholders: true,
      supportBigNumbers: true,
      bigNumberStrings: false,
      dateStrings: false,
    });

    // Ensure DB and tables exist
    const conn = await pool.getConnection();
    try {
      await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;`);
      await conn.query(`USE \`${DB_NAME}\`;`);

      // Try to ensure remote access for current user/db on server side (no-op if lacks privileges)
      await ensureRemoteAccess(conn);
      
      // Apply MySQL performance optimizations automatically
      await optimizeMySQLSettings(conn);

      // Users
      await conn.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(100) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          full_name VARCHAR(150) NULL,
          role ENUM('admin','cashier','super') NOT NULL DEFAULT 'admin',
          is_active TINYINT(1) NOT NULL DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

      try{
        const [roleCol] = await conn.query("SHOW COLUMNS FROM users LIKE 'role'");
        if(roleCol.length && !String(roleCol[0].Type || '').toLowerCase().includes("'super'")){
          await conn.query("ALTER TABLE users MODIFY role ENUM('admin','cashier','super') NOT NULL DEFAULT 'admin'");
        }
      }catch(_){ }

      // Permissions catalog and user mapping
      await conn.query(`
        CREATE TABLE IF NOT EXISTS permissions (
          perm_key VARCHAR(64) NOT NULL PRIMARY KEY,
          name VARCHAR(150) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      // Add parent_key column for hierarchical permissions (idempotent)
      try{
        await conn.query(`ALTER TABLE permissions ADD COLUMN IF NOT EXISTS parent_key VARCHAR(64) NULL;`);
        await conn.query(`ALTER TABLE permissions ADD CONSTRAINT IF NOT EXISTS fk_perm_parent FOREIGN KEY (parent_key) REFERENCES permissions(perm_key) ON DELETE CASCADE;`);
      }catch(_){ /* ignore if already added or MySQL < 8 */ }

      await conn.query(`
        CREATE TABLE IF NOT EXISTS user_permissions (
          user_id INT NOT NULL,
          perm_key VARCHAR(64) NOT NULL,
          PRIMARY KEY (user_id, perm_key),
          CONSTRAINT fk_up_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          CONSTRAINT fk_up_perm FOREIGN KEY (perm_key) REFERENCES permissions(perm_key) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Seed default main permissions (idempotent)
      await conn.query(`
        INSERT IGNORE INTO permissions (perm_key, name) VALUES
          ('users','المستخدمون'),
          ('customers','العملاء'),
          ('sales','المبيعات'),
          ('invoices','الفواتير'),
          ('credit_notes','الفواتير الدائنة'),
          ('payments','المدفوعات'),
          ('products','المنتجات'),
          ('rooms','الغرف'),
          ('types','الأنواع'),
          ('settings','الإعدادات'),
          ('operations','العمليات'),
          ('kitchen','المطبخ'),
          ('purchases','المشتريات'),
          ('inventory','المخزون'),
          ('customer_pricing','تخصيص الأسعار'),
          ('offers','العروض'),
          ('drivers','السائقون'),
          ('reports','التقارير'),
          ('zatca','الفاتورة الإلكترونية'),
          ('whatsapp','إدارة WhatsApp'),
          ('permissions','الصلاحيات');
      `);
      // Seed sub-permissions for modules (idempotent)
      // 1) Ensure all sub-permission keys exist
      await conn.query(`
        INSERT IGNORE INTO permissions (perm_key, name) VALUES
          -- sales
          ('sales.print','طباعة الفاتورة'),
          ('sales.kitchen','إرسال للمطبخ'),
          ('sales.clear','تفريغ'),
          ('sales.process_invoice','معالجة الفاتورة'),
          ('sales.discount','الخصم'),
          ('sales.extra','الإضافى'),
          ('sales.coupon','الكوبون'),
          ('sales.select_customer','اختيار العميل'),
          ('sales.select_driver','اختيار السائق'),
          ('sales.remove_item','حذف'),
          ('sales.edit_qty','تعديل الكمية'),
          -- customers
          ('customers.add','➕ إضافة عميل'),
          ('customers.edit','تعديل'),
          ('customers.toggle','تفعيل/إيقاف'),
          ('customers.delete','حذف'),
          -- invoices
          ('invoices.view','عرض الفاتورة'),
          -- users
          ('users.add','إضافة مستخدم'),
          ('users.edit','تعديل'),
          ('users.toggle','تفعيل/إيقاف'),
          ('users.delete','حذف'),
          -- products
          ('products.add','➕ إضافة منتج'),
          ('products.edit','تعديل'),
          ('products.toggle','تفعيل/إيقاف'),
          ('products.delete','حذف'),
          ('products.export_pdf','🧾 تصدير PDF'),
          ('products.export_csv','📄 تصدير CSV'),
          ('products.reorder','💾 حفظ ترتيب السطور'),
          -- rooms
          ('rooms.add','إضافة غرفة'),
          ('rooms.edit','تعديل'),
          ('rooms.delete','حذف'),
          ('rooms.open','فتح الغرفة'),
          -- types
          ('types.add','إضافة نوع رئيسي'),
          ('types.edit','✏️ تعديل'),
          ('types.toggle','⏸️ إيقاف/▶️ تفعيل'),
          ('types.delete','🗑️ حذف'),
          -- settings
          ('settings.update','حفظ الإعدادات'),
          ('settings.reload','إعادة تحميل'),
          ('settings.reset_sales','حذف كل الفواتير'),
          ('settings.reset_products','حذف كل المنتجات'),
          ('settings.reset_customers','حذف كل العملاء'),
          -- operations
          ('operations.add','إضافة عملية'),
          ('operations.edit','تعديل'),
          ('operations.toggle','تفعيل/إيقاف'),
          ('operations.delete','حذف'),
          ('operations.reorder','تغيير الترتيب'),
          -- kitchen
          ('kitchen.add','إضافة طابعة'),
          ('kitchen.edit','حفظ'),
          ('kitchen.delete','حذف'),
          ('kitchen.test','طباعة اختبار'),
          -- purchases
          ('purchases.add','إضافة'),
          ('purchases.edit','تعديل'),
          ('purchases.delete','حذف'),
          ('purchases.export_csv','تصدير CSV'),
          ('purchases.export_pdf','تصدير PDF'),
          -- inventory
          ('inventory.add','عنصر مخزون جديد'),
          ('inventory.edit','تعديل'),
          ('inventory.toggle','تفعيل/إيقاف'),
          ('inventory.delete','حذف'),
          ('inventory.bom_edit','تعديل مكونات المنتج'),
          -- customer_pricing
          ('customer_pricing.add','إضافة'),
          ('customer_pricing.edit','تعديل'),
          ('customer_pricing.delete','حذف'),
          -- offers
          ('offers.add_offer','إضافة عرض'),
          ('offers.add_global_offer','إضافة عرض عام'),
          ('offers.edit_offer','تعديل عرض'),
          ('offers.toggle_offer','تفعيل/إيقاف عرض'),
          ('offers.delete_offer','حذف عرض'),
          ('offers.add_coupon','إضافة كوبون'),
          ('offers.edit_coupon','تعديل كوبون'),
          ('offers.toggle_coupon','تفعيل/إيقاف كوبون'),
          ('offers.delete_coupon','حذف كوبون'),
          -- drivers
          ('drivers.add','إضافة'),
          ('drivers.edit','حفظ'),
          ('drivers.toggle','تنشيط/إيقاف'),
          ('drivers.delete','حذف'),
          -- reports
          ('reports.view_daily','تقرير يومي'),
          ('reports.view_period','تقرير فترة'),
          ('reports.view_all_invoices','كل الفواتير'),
          ('reports.view_purchases','تقرير المشتريات'),
          ('reports.view_customer_invoices','فواتير عميل'),
          ('reports.view_credit_invoices','الفواتير الدائنة'),
          ('reports.view_unpaid_invoices','فواتير غير مدفوعة'),
          ('reports.view_types','تقرير الأنواع'),
          ('reports.view_municipality','تقرير البلدية'),
          -- payments
          ('payments.settle_full','سداد كامل'),
          ('payments.view_invoice','عرض الفاتورة'),
          -- credit_notes
          ('credit_notes.view','عرض الإشعار'),
          ('credit_notes.view_base','عرض الفاتورة'),
          -- permissions screen
          ('permissions.manage','إدارة الصلاحيات')
      `);
      // 2) If parent_key column exists, update parent_key mapping for each module
      try{
        const updates = [
          'sales','customers','invoices','users','products','rooms','types','settings','operations','kitchen',
          'purchases','inventory','customer_pricing','offers','drivers','reports','payments','credit_notes','permissions','zatca','whatsapp'
        ];
        for(const k of updates){
          await conn.query(`UPDATE permissions SET parent_key=? WHERE perm_key LIKE CONCAT(?, '.%') AND (parent_key IS NULL OR parent_key<>?)`, [k, k, k]);
        }
      }catch(_){ /* ignore if parent_key not available */ }
      // 3) Normalize names to match exact UI labels
      try{
        const namePairs = [
          ['sales.print','طباعة الفاتورة'],['sales.kitchen','إرسال للمطبخ'],['sales.clear','تفريغ'],['sales.process_invoice','معالجة الفاتورة'],['sales.discount','الخصم'],['sales.extra','الإضافى'],['sales.coupon','الكوبون'],['sales.select_customer','اختيار العميل'],['sales.select_driver','اختيار السائق'],['sales.remove_item','حذف'],['sales.edit_qty','تعديل الكمية'],
          ['customers.add','➕ إضافة عميل'],['customers.edit','تعديل'],['customers.toggle','تفعيل/إيقاف'],['customers.delete','حذف'],
          ['invoices.view','عرض الفاتورة'],
          ['users.add','إضافة مستخدم'],['users.edit','تعديل'],['users.toggle','تفعيل/إيقاف'],['users.delete','حذف'],
          ['products.add','➕ إضافة منتج'],['products.edit','تعديل'],['products.toggle','تفعيل/إيقاف'],['products.delete','حذف'],['products.export_pdf','🧾 تصدير PDF'],['products.export_csv','📄 تصدير CSV'],['products.reorder','💾 حفظ ترتيب السطور'],
          ['rooms.add','إضافة غرفة'],['rooms.edit','تعديل'],['rooms.delete','حذف'],['rooms.open','فتح الغرفة'],
          ['types.add','إضافة نوع رئيسي'],['types.edit','✏️ تعديل'],['types.toggle','⏸️ إيقاف/▶️ تفعيل'],['types.delete','🗑️ حذف'],
          ['settings.update','حفظ الإعدادات'],['settings.reload','إعادة تحميل'],['settings.reset_sales','حذف كل الفواتير'],['settings.reset_products','حذف كل المنتجات'],['settings.reset_customers','حذف كل العملاء'],
          ['operations.add','إضافة عملية'],['operations.edit','تعديل'],['operations.toggle','تفعيل/إيقاف'],['operations.delete','حذف'],['operations.reorder','تغيير الترتيب'],
          ['kitchen.add','إضافة طابعة'],['kitchen.edit','حفظ'],['kitchen.delete','حذف'],['kitchen.test','طباعة اختبار'],
          ['purchases.add','إضافة'],['purchases.edit','تعديل'],['purchases.delete','حذف'],['purchases.export_csv','تصدير CSV'],['purchases.export_pdf','تصدير PDF'],
          ['inventory.add','عنصر مخزون جديد'],['inventory.edit','تعديل'],['inventory.toggle','تفعيل/إيقاف'],['inventory.delete','حذف'],['inventory.bom_edit','تعديل مكونات المنتج'],
          ['customer_pricing.add','إضافة'],['customer_pricing.edit','تعديل'],['customer_pricing.delete','حذف'],
          ['offers.add_offer','إضافة عرض'],['offers.add_global_offer','إضافة عرض عام'],['offers.edit_offer','تعديل عرض'],['offers.toggle_offer','تفعيل/إيقاف عرض'],['offers.delete_offer','حذف عرض'],['offers.add_coupon','إضافة كوبون'],['offers.edit_coupon','تعديل كوبون'],['offers.toggle_coupon','تفعيل/إيقاف كوبون'],['offers.delete_coupon','حذف كوبون'],
          ['drivers.add','إضافة'],['drivers.edit','حفظ'],['drivers.toggle','تنشيط/إيقاف'],['drivers.delete','حذف'],
          ['reports.view_daily','تقرير يومي'],['reports.view_period','تقرير فترة'],['reports.view_all_invoices','كل الفواتير'],['reports.view_purchases','تقرير المشتريات'],['reports.view_customer_invoices','فواتير عميل'],['reports.view_credit_invoices','الفواتير الدائنة'],['reports.view_unpaid_invoices','فواتير غير مدفوعة'],
          ['payments.settle_full','سداد كامل'],['payments.view_invoice','عرض الفاتورة'],
          ['credit_notes.view','عرض الإشعار'],['credit_notes.view_base','عرض الفاتورة'],
          ['permissions.manage','إدارة الصلاحيات']
        ];
        for(const [k,nm] of namePairs){ await conn.query('UPDATE permissions SET name=? WHERE perm_key=?', [nm, k]); }
      }catch(_){ /* ignore */ }
      // Auto-grant the new report permission to admin users who have explicit saved permissions
      try{
        await conn.query(`
          INSERT IGNORE INTO user_permissions (user_id, perm_key)
          SELECT u.id, 'reports.view_types'
          FROM users u
          WHERE u.role='admin'
            AND EXISTS(SELECT 1 FROM user_permissions up WHERE up.user_id=u.id)
            AND NOT EXISTS(SELECT 1 FROM user_permissions up2 WHERE up2.user_id=u.id AND up2.perm_key='reports.view_types')
        `);
      }catch(_){ /* ignore */ }

      // Activated devices table for multi-device licensing
      await conn.query(`
        CREATE TABLE IF NOT EXISTS activated_devices (
          id INT AUTO_INCREMENT PRIMARY KEY,
          device_uuid VARCHAR(255) NOT NULL,
          device_type ENUM('board', 'disk', 'mac') NOT NULL,
          device_code VARCHAR(255) NOT NULL,
          activated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_device (device_uuid)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      
      // Fix timezone issue: convert all TIMESTAMP columns to DATETIME (one-time migration)
      try{
        // Fix users table
        const [colUsersCreatedAt] = await conn.query("SHOW COLUMNS FROM users LIKE 'created_at'");
        if(colUsersCreatedAt.length && String(colUsersCreatedAt[0].Type).toUpperCase().includes('TIMESTAMP')){
          await conn.query("ALTER TABLE users MODIFY created_at DATETIME DEFAULT CURRENT_TIMESTAMP");
        }
        
        // Fix activated_devices table
        const [colDevicesActivatedAt] = await conn.query("SHOW COLUMNS FROM activated_devices LIKE 'activated_at'");
        if(colDevicesActivatedAt.length && String(colDevicesActivatedAt[0].Type).toUpperCase().includes('TIMESTAMP')){
          await conn.query("ALTER TABLE activated_devices MODIFY activated_at DATETIME DEFAULT CURRENT_TIMESTAMP");
        }
      }catch(_){ }

      // Note: Indexes are created in background via createIndexesInBackground() to speed up startup
    } finally {
      conn.release();
    }
  })();

  try {
    await poolInitPromise;
  } catch (err) {
    poolInitPromise = null;
    pool = null;
    throw err;
  } finally {
    poolInitPromise = null;
  }
  
  return pool;
}

// Update DB config at runtime and reset pool
async function updateConfig(partial){
  const next = { ...currentConfig, ...partial };
  const changed = ['host','port','user','password','name'].some(k => String(currentConfig[k]) !== String(next[k]));
  currentConfig = next;
  saveConfig();
  if(changed && pool){ try{ await pool.end(); }catch(_){ } pool = null; poolInitPromise = null; }
  return { ...currentConfig };
}

// Get current DB config
function getConfig(){ return { ...currentConfig }; }

// Test connection with given or current config (does not mutate state)
async function testConnection(tempCfg){
  const cfg = { ...currentConfig, ...(tempCfg||{}) };
  const conn = await mysql.createConnection({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    multipleStatements: false,
    connectTimeout: 8000,              // 8 seconds timeout for VPN connections
    enableKeepAlive: true,
    keepAliveInitialDelay: 3000,
  });
  try{
    await conn.query('SELECT 1');
  } finally {
    try{ await conn.end(); }catch(_){ }
  }
}

// Warm up query cache with common queries (runs at startup)
async function warmupQueryCache(){
  try {
    const pool = await getPool();
    const conn = await pool.getConnection();
    try {
      await conn.query(`USE \`${DB_NAME}\``);
      
      await conn.query("SELECT COUNT(*) FROM sales").catch(()=>{});
      await conn.query("SELECT * FROM products WHERE is_active=1 LIMIT 100").catch(()=>{});
      await conn.query("SELECT * FROM customers WHERE is_active=1 LIMIT 50").catch(()=>{});
      await conn.query("SELECT * FROM main_types WHERE is_active=1").catch(()=>{});
      await conn.query("SELECT * FROM operations WHERE is_active=1").catch(()=>{});
      await conn.query("SELECT * FROM sales WHERE payment_status='unpaid' LIMIT 20").catch(()=>{});
      
      console.log('✅ Query cache warmed up successfully');
    } finally {
      conn.release();
    }
  } catch(err) {
    console.log('⚠️ Query cache warmup failed (non-critical):', err.message);
  }
}

// Create indexes in background to improve performance without blocking startup
async function createIndexesInBackground(){
  try {
    const pool = await getPool();
    const conn = await pool.getConnection();
    try {
      await conn.query(`USE \`${DB_NAME}\``);
      
      // Sales table indexes - Critical for performance
      await conn.query("CREATE INDEX idx_customer_id ON sales (customer_id)").catch(()=>{});
      await conn.query("CREATE INDEX idx_payment_status ON sales (payment_status)").catch(()=>{});
      await conn.query("CREATE INDEX idx_created_at ON sales (created_at)").catch(()=>{});
      await conn.query("CREATE INDEX idx_doc_type ON sales (doc_type)").catch(()=>{});
      await conn.query("CREATE INDEX idx_order_no ON sales (order_no)").catch(()=>{});
      await conn.query("CREATE INDEX idx_zatca_status ON sales (zatca_status)").catch(()=>{});
      await conn.query("CREATE INDEX idx_payment_created ON sales (payment_status, created_at)").catch(()=>{});
      await conn.query("CREATE INDEX idx_customer_created ON sales (customer_id, created_at)").catch(()=>{});
      
      // Sale items indexes
      await conn.query("CREATE INDEX idx_sale_id ON sale_items (sale_id)").catch(()=>{});
      await conn.query("CREATE INDEX idx_product_id ON sale_items (product_id)").catch(()=>{});
      await conn.query("CREATE INDEX idx_sale_product ON sale_items (sale_id, product_id)").catch(()=>{});
      
      // Customers indexes
      await conn.query("CREATE INDEX idx_phone ON customers (phone)").catch(()=>{});
      await conn.query("CREATE INDEX idx_name ON customers (name)").catch(()=>{});
      await conn.query("CREATE INDEX idx_is_active ON customers (is_active)").catch(()=>{});
      await conn.query("CREATE INDEX idx_active_name ON customers (is_active, name)").catch(()=>{});
      
      // Products indexes - Critical for sales screen
      await conn.query("CREATE INDEX idx_is_active ON products (is_active)").catch(()=>{});
      await conn.query("CREATE INDEX idx_type_id ON products (type_id)").catch(()=>{});
      await conn.query("CREATE INDEX idx_active_type ON products (is_active, type_id)").catch(()=>{});
      await conn.query("CREATE INDEX idx_barcode ON products (barcode)").catch(()=>{});
      await conn.query("CREATE INDEX idx_products_name ON products (name(100))").catch(()=>{});
      await conn.query("CREATE INDEX idx_stock ON products (stock)").catch(()=>{});
      
      // Users indexes
      await conn.query("CREATE INDEX idx_is_active ON users (is_active)").catch(()=>{});
      await conn.query("CREATE INDEX idx_role ON users (role)").catch(()=>{});
      
      // Purchases indexes
      await conn.query("CREATE INDEX idx_purchase_date ON purchases (purchase_date)").catch(()=>{});
      
      // Inventory indexes
      await conn.query("CREATE INDEX idx_is_active ON inventory (is_active)").catch(()=>{});
      
      // Rooms indexes
      await conn.query("CREATE INDEX idx_is_open ON rooms (is_open)").catch(()=>{});
      
      // Types indexes
      await conn.query("CREATE INDEX idx_is_active ON main_types (is_active)").catch(()=>{});
      
      // Operations indexes
      await conn.query("CREATE INDEX idx_is_active ON operations (is_active)").catch(()=>{});
      
      // Drivers indexes
      await conn.query("CREATE INDEX idx_is_active ON drivers (is_active)").catch(()=>{});
      
      // Customer pricing indexes
      await conn.query("CREATE INDEX idx_customer_pricing_customer_product ON customer_pricing (customer_id, product_id)").catch(()=>{});
      await conn.query("CREATE INDEX idx_customer_pricing_product ON customer_pricing (product_id)").catch(()=>{});
      
      // Offers indexes
      await conn.query("CREATE INDEX idx_offers_product_active ON offers (product_id, is_active)").catch(()=>{});
      await conn.query("CREATE INDEX idx_offers_active_dates ON offers (is_active, start_date, end_date)").catch(()=>{});
      await conn.query("CREATE INDEX idx_offers_product_operation ON offers (product_id, operation_id)").catch(()=>{});
      
      // BOM indexes
      await conn.query("CREATE INDEX idx_bom_product_id ON bom (product_id)").catch(()=>{});
      await conn.query("CREATE INDEX idx_bom_inventory_id ON bom (inventory_item_id)").catch(()=>{});
      
      // Coupons indexes
      await conn.query("CREATE INDEX idx_coupons_code_active ON coupons (code, is_active)").catch(()=>{});
      
      // Product operations indexes
      await conn.query("CREATE INDEX idx_product_operations_product_id ON product_operations (product_id)").catch(()=>{});
      await conn.query("CREATE INDEX idx_product_operations_operation_id ON product_operations (operation_id)").catch(()=>{});
      
      console.log('✅ Database indexes created successfully (Performance optimized)');
      
      // Warmup query cache after creating indexes
      await warmupQueryCache();
      
    } finally {
      conn.release();
    }
  } catch(err) {
    console.error('⚠️ Failed to create indexes (non-critical):', err.message);
  }
}

module.exports = { getPool, DB_NAME, initDbFromSaved, updateConfig, getConfig, testConnection, createIndexesInBackground };