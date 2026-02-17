// App Settings IPC: read/save settings like company info, VAT, pricing mode, location, payment methods, currency
const path = require('path');
const { ipcMain, app } = require('electron');
const { getPool, DB_NAME } = require('../db/connection');

function getResourcePath(relativePath) {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, relativePath);
  }
  return path.join(__dirname, '..', '..', relativePath);
}

function registerSettingsIPC(){
  async function ensureTable(conn){
    // Base table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id INT PRIMARY KEY,
        company_name VARCHAR(255) NULL,
        company_site VARCHAR(255) NULL,
        mobile VARCHAR(50) NULL,
        email VARCHAR(255) NULL,
        logo_path VARCHAR(512) NULL,
        vat_percent DECIMAL(5,2) NOT NULL DEFAULT 15.00,
        prices_include_vat TINYINT NOT NULL DEFAULT 1,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // PERFORMANCE OPTIMIZATION: Fetch all columns once instead of 89 separate queries
    const [existingColumns] = await conn.query('SHOW COLUMNS FROM app_settings');
    const existingColumnNames = new Set(existingColumns.map(col => col.Field));
    const missing = (name) => !existingColumnNames.has(name);
    // Tobacco fee settings
    if(missing('tobacco_fee_percent')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN tobacco_fee_percent DECIMAL(6,2) NULL AFTER prices_include_vat");
    }
    if(missing('tobacco_min_invoice_sub')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN tobacco_min_invoice_sub DECIMAL(12,2) NULL AFTER tobacco_fee_percent");
    }
    if(missing('tobacco_min_fee_amount')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN tobacco_min_fee_amount DECIMAL(12,2) NULL AFTER tobacco_min_invoice_sub");
    }
    if(missing('company_location')){
      await conn.query('ALTER TABLE app_settings ADD COLUMN company_location VARCHAR(255) NULL AFTER company_site');
    }
    if(missing('payment_methods')){
      await conn.query('ALTER TABLE app_settings ADD COLUMN payment_methods TEXT NULL AFTER email');
    }
    if(missing('currency_code')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN currency_code VARCHAR(8) NULL DEFAULT 'SAR' AFTER payment_methods");
    }
    if(missing('currency_symbol')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN currency_symbol VARCHAR(8) NULL DEFAULT '﷼' AFTER currency_code");
    }
    if(missing('currency_symbol_position')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN currency_symbol_position ENUM('before','after') NOT NULL DEFAULT 'after' AFTER currency_symbol");
    }
    // App locale column (resilient to races and MySQL versions)
    try{
      await conn.query("ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS app_locale VARCHAR(5) NOT NULL DEFAULT 'ar' AFTER currency_symbol_position");
    }catch(_){
      try{
        const [rows] = await conn.query('SHOW COLUMNS FROM app_settings LIKE ?', ['app_locale']);
        if(rows.length===0){
          await conn.query("ALTER TABLE app_settings ADD COLUMN app_locale VARCHAR(5) NOT NULL DEFAULT 'ar' AFTER currency_symbol_position");
        }
      }catch(__){ /* ignore if already exists */ }
    }
    // Ensure legal name column exists
    if(missing('seller_legal_name')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN seller_legal_name VARCHAR(255) NULL AFTER email");
    }
    if(missing('seller_vat_number')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN seller_vat_number VARCHAR(32) NULL AFTER seller_legal_name");
    }
    // New fields: commercial register and national number
    if(missing('commercial_register')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN commercial_register VARCHAR(64) NULL AFTER seller_vat_number");
    }
    if(missing('national_number')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN national_number VARCHAR(64) NULL AFTER commercial_register");
    }
    // Drop legacy company_name column if exists
    {
      const [rows] = await conn.query("SHOW COLUMNS FROM app_settings LIKE 'company_name'");
      if(rows.length){ await conn.query("ALTER TABLE app_settings DROP COLUMN company_name"); }
    }
    if(missing('default_print_format')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN default_print_format ENUM('thermal','a4') NOT NULL DEFAULT 'thermal' AFTER currency_symbol_position");
    }
    if(missing('print_copies')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN print_copies INT NOT NULL DEFAULT 1 AFTER default_print_format");
    }
    // Print margins (right/left) in millimeters
    if(missing('print_margin_right_mm')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN print_margin_right_mm DECIMAL(6,2) NULL AFTER print_copies");
    }
    if(missing('print_margin_left_mm')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN print_margin_left_mm DECIMAL(6,2) NULL AFTER print_margin_right_mm");
    }
    // keep print_two_copies for backward compat (will be ignored on save)
    if(missing('print_two_copies')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN print_two_copies TINYINT NOT NULL DEFAULT 0 AFTER print_margin_left_mm");
    }
    if(missing('print_show_change')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN print_show_change TINYINT NOT NULL DEFAULT 1 AFTER print_two_copies");
    }
    if(missing('show_item_desc')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN show_item_desc TINYINT NOT NULL DEFAULT 1 AFTER print_show_change");
    }
    if(missing('hide_item_description')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN hide_item_description TINYINT NOT NULL DEFAULT 0 AFTER show_item_desc");
    }
    // WhatsApp on print options
    if(missing('whatsapp_on_print')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN whatsapp_on_print TINYINT NOT NULL DEFAULT 0 AFTER print_show_change");
    }
    if(missing('whatsapp_message')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN whatsapp_message TEXT NULL AFTER whatsapp_on_print");
    }
    if(missing('default_payment_method')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN default_payment_method VARCHAR(32) NULL AFTER payment_methods");
    }
    if(missing('default_order_type')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN default_order_type VARCHAR(32) NULL AFTER default_payment_method");
    }
    if(missing('op_price_manual')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN op_price_manual TINYINT NOT NULL DEFAULT 0 AFTER print_show_change");
    }
    if(missing('allow_sell_zero_stock')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN allow_sell_zero_stock TINYINT NOT NULL DEFAULT 0 AFTER op_price_manual");
    }
    if(missing('allow_negative_inventory')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN allow_negative_inventory TINYINT NOT NULL DEFAULT 0 AFTER allow_sell_zero_stock");
    }
    if(missing('cart_separate_duplicate_lines')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN cart_separate_duplicate_lines TINYINT NOT NULL DEFAULT 0 AFTER allow_negative_inventory");
    }
    // Low stock alert threshold (units in products.stock)
    if(missing('low_stock_threshold')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN low_stock_threshold INT NOT NULL DEFAULT 5 AFTER allow_negative_inventory");
    }
    // Toggle: show/hide low-stock alerts in Sales UI
    if(missing('show_low_stock_alerts')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN show_low_stock_alerts TINYINT NOT NULL DEFAULT 1 AFTER low_stock_threshold");
    }
    // Low stock email settings
    if(missing('low_stock_email_enabled')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN low_stock_email_enabled TINYINT NOT NULL DEFAULT 0 AFTER low_stock_threshold");
    }
    if(missing('low_stock_email_per_item')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN low_stock_email_per_item TINYINT NOT NULL DEFAULT 1 AFTER low_stock_email_enabled");
    }
    if(missing('low_stock_email_cooldown_hours')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN low_stock_email_cooldown_hours INT NOT NULL DEFAULT 24 AFTER low_stock_email_per_item");
    }
    if(missing('silent_print')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN silent_print TINYINT NOT NULL DEFAULT 0 AFTER print_two_copies");
    }
    // Logo stored in DB (BLOB) similar to products; keep legacy path for backward compat
    if(missing('logo_blob')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN logo_blob LONGBLOB NULL AFTER logo_path");
    }
    if(missing('logo_mime')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN logo_mime VARCHAR(64) NULL AFTER logo_blob");
    }
    if(missing('logo_width_px')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN logo_width_px SMALLINT UNSIGNED NULL AFTER logo_path");
    }
    if(missing('logo_height_px')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN logo_height_px SMALLINT UNSIGNED NULL AFTER logo_width_px");
    }
    // Default product image stored in DB (BLOB + MIME)
    if(missing('default_product_img_blob')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN default_product_img_blob LONGBLOB NULL AFTER logo_mime");
    }
    if(missing('default_product_img_mime')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN default_product_img_mime VARCHAR(64) NULL AFTER default_product_img_blob");
    }
    if(missing('invoice_footer_note')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN invoice_footer_note TEXT NULL AFTER email");
    }
    if(missing('hide_product_images')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN hide_product_images TINYINT NOT NULL DEFAULT 0 AFTER default_payment_method");
    }
    if(missing('closing_hour')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN closing_hour TIME NULL AFTER hide_product_images");
    }
    if(missing('zatca_enabled')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN zatca_enabled TINYINT NOT NULL DEFAULT 0 AFTER closing_hour");
    }
    // UI toggle for WhatsApp controls (show/hide via SQL query)
    if(missing('show_whatsapp_controls')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN show_whatsapp_controls TINYINT NOT NULL DEFAULT 1 AFTER zatca_enabled");
    }
    // UI toggle for trial warning message (show/hide via SQL query)
    if(missing('show_trial_warning')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN show_trial_warning TINYINT NOT NULL DEFAULT 0 AFTER show_whatsapp_controls");
    }
    // Recovery unlock flag
    if(missing('recovery_unlocked')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN recovery_unlocked TINYINT NOT NULL DEFAULT 0 AFTER closing_hour");
    }
    // Daily email report settings (scheduler)
    if(missing('daily_email_enabled')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN daily_email_enabled TINYINT NOT NULL DEFAULT 0 AFTER recovery_unlocked");
    }
    if(missing('daily_email_time')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN daily_email_time TIME NULL AFTER daily_email_enabled");
    }
    // Daily DB backup scheduler settings
    if(missing('db_backup_enabled')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN db_backup_enabled TINYINT NOT NULL DEFAULT 0 AFTER daily_email_time");
    }
    if(missing('db_backup_time')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN db_backup_time TIME NULL AFTER db_backup_enabled");
    }
    if(missing('smtp_host')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN smtp_host VARCHAR(128) NULL AFTER db_backup_time");
    }
    if(missing('smtp_port')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN smtp_port SMALLINT NULL AFTER smtp_host");
    }
    if(missing('smtp_secure')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN smtp_secure TINYINT NULL AFTER smtp_port");
    }
    if(missing('smtp_user')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN smtp_user VARCHAR(255) NULL AFTER smtp_secure");
    }
    if(missing('smtp_pass')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN smtp_pass VARCHAR(255) NULL AFTER smtp_user");
    }
    if(missing('daily_email_last_sent')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN daily_email_last_sent DATE NULL AFTER smtp_pass");
    }
    // Show/hide connection modal flag
    if(missing('show_conn_modal')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN show_conn_modal TINYINT NOT NULL DEFAULT 0 AFTER recovery_unlocked");
    }
    // Support contract end date (for login screen info)
    if(missing('support_end_date')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN support_end_date DATE NULL AFTER daily_email_last_sent");
    }
    // Activation columns: allow locking to motherboard serial or MAC(Ethernet)
    if(missing('activation_hw_id')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN activation_hw_id VARCHAR(128) NULL AFTER support_end_date");
    }
    if(missing('activation_hw_type')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN activation_hw_type ENUM('baseboard','mac','disk') NULL AFTER activation_hw_id");
    }
    // Customer Display settings
    if(missing('customer_display_enabled')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN customer_display_enabled TINYINT NOT NULL DEFAULT 0 AFTER activation_hw_type");
    }
    if(missing('customer_display_simulator')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN customer_display_simulator TINYINT NOT NULL DEFAULT 0 AFTER customer_display_enabled");
    }
    if(missing('customer_display_port')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN customer_display_port VARCHAR(16) NULL AFTER customer_display_simulator");
    }
    if(missing('customer_display_baud_rate')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN customer_display_baud_rate INT NOT NULL DEFAULT 9600 AFTER customer_display_port");
    }
    if(missing('customer_display_columns')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN customer_display_columns INT NOT NULL DEFAULT 20 AFTER customer_display_baud_rate");
    }
    if(missing('customer_display_rows')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN customer_display_rows INT NOT NULL DEFAULT 2 AFTER customer_display_columns");
    }
    if(missing('customer_display_protocol')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN customer_display_protocol VARCHAR(16) NOT NULL DEFAULT 'escpos' AFTER customer_display_rows");
    }
    if(missing('customer_display_encoding')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN customer_display_encoding VARCHAR(32) NOT NULL DEFAULT 'windows-1256' AFTER customer_display_protocol");
    }
    if(missing('customer_display_brightness')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN customer_display_brightness INT NOT NULL DEFAULT 100 AFTER customer_display_encoding");
    }
    if(missing('customer_display_welcome_msg')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN customer_display_welcome_msg VARCHAR(255) NULL DEFAULT 'أهلا وسهلا' AFTER customer_display_brightness");
    }
    if(missing('customer_display_thank_msg')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN customer_display_thank_msg VARCHAR(255) NULL DEFAULT 'شكرا لزيارتكم' AFTER customer_display_welcome_msg");
    }
    if(missing('customer_display_thankyou_msg')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN customer_display_thankyou_msg VARCHAR(255) NULL DEFAULT 'شكرا لزيارتكم' AFTER customer_display_thank_msg");
    }
    if(missing('customer_display_data_format')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN customer_display_data_format VARCHAR(32) NULL DEFAULT 'smart_spaces_8' AFTER customer_display_thankyou_msg");
    }
    if(missing('menu_url')){
      try{
        await conn.query("ALTER TABLE app_settings ADD COLUMN menu_url TEXT NULL AFTER customer_display_data_format");
      }catch(e){
        if(e.code !== 'ER_DUP_FIELDNAME') throw e;
      }
    }
    // WhatsApp messages limit settings
    if(missing('whatsapp_messages_limit')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN whatsapp_messages_limit INT NOT NULL DEFAULT 0 AFTER customer_display_data_format");
      await conn.query("UPDATE app_settings SET whatsapp_messages_limit = 0 WHERE id = 1 AND whatsapp_messages_limit = 100");
    }
    if(missing('whatsapp_messages_sent')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN whatsapp_messages_sent INT NOT NULL DEFAULT 0 AFTER whatsapp_messages_limit");
    }
    if(missing('branch_name')){
      await conn.query("ALTER TABLE app_settings ADD COLUMN branch_name VARCHAR(255) NULL AFTER whatsapp_messages_sent");
    }
  }

  async function ensureSingleton(conn){
    const [rows] = await conn.query('SELECT id FROM app_settings WHERE id=1');
    if(rows.length === 0){
      await conn.query(
        "INSERT INTO app_settings (id, vat_percent, prices_include_vat, currency_code, currency_symbol, currency_symbol_position) VALUES (1, 15.00, 1, 'SAR', '﷼', 'after')"
      );
    }
  }

  // Fetch settings (without binary logo blob to keep payload light)
  ipcMain.handle('settings:get', async () => {
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTable(conn);
        await ensureSingleton(conn);
        const [rows] = await conn.query('SELECT * FROM app_settings WHERE id=1 LIMIT 1');
        const item = rows[0] || {};
        // Normalize activation fields for UI consumption
        if(item.activation_hw_id){ item.activation_hw_id = String(item.activation_hw_id).toUpperCase(); }
        if(item.activation_hw_type){ item.activation_hw_type = String(item.activation_hw_type).toLowerCase(); }
        // Ensure UI toggles are numbers
        item.show_whatsapp_controls = item.show_whatsapp_controls ? 1 : 0;
        // Normalize print margins (mm)
        item.print_margin_right_mm = (item.print_margin_right_mm===''||item.print_margin_right_mm===null||item.print_margin_right_mm===undefined) ? null : Number(item.print_margin_right_mm);
        item.print_margin_left_mm = (item.print_margin_left_mm===''||item.print_margin_left_mm===null||item.print_margin_left_mm===undefined) ? null : Number(item.print_margin_left_mm);
        // passthrough new fields as strings
        item.commercial_register = item.commercial_register || '';
        item.national_number = item.national_number || '';
        // Normalize support end date as YYYY-MM-DD or keep raw string if present (never drop if non-empty)
        if(item.support_end_date !== null && item.support_end_date !== undefined){
          const raw = String(item.support_end_date).trim();
          if(raw){
            try{
              const d = new Date(raw);
              if(!isNaN(d)){
                item.support_end_date = d.toISOString().slice(0,10);
              }else{
                const m = raw.match(/^(\d{4})[-\/.](\d{2})[-\/.](\d{2})$/);
                item.support_end_date = m ? `${m[1]}-${m[2]}-${m[3]}` : raw; // keep raw as fallback
              }
            }catch(_){ item.support_end_date = raw; }
          } else {
            item.support_end_date = null;
          }
        } else { item.support_end_date = null; }
        // App locale normalize
        item.app_locale = (item.app_locale === 'en' ? 'en' : 'ar');
        // Normalize scheduler/email fields
        item.daily_email_enabled = item.daily_email_enabled ? 1 : 0;
        item.daily_email_time = item.daily_email_time ? String(item.daily_email_time).slice(0,5) : null;
        // DB backup schedule
        item.db_backup_enabled = item.db_backup_enabled ? 1 : 0;
        item.db_backup_time = item.db_backup_time ? String(item.db_backup_time).slice(0,5) : null;
        item.smtp_host = item.smtp_host || 'smtp.gmail.com';
        item.smtp_port = Number(item.smtp_port || 587);
        item.smtp_secure = (item.smtp_secure === null || item.smtp_secure === undefined) ? 0 : (item.smtp_secure ? 1 : 0);
        item.smtp_user = item.smtp_user || '';
        item.smtp_pass = item.smtp_pass || '';
        item.daily_email_last_sent = item.daily_email_last_sent || null;
        // closing hour normalized as HH:MM string or null
        if(item.closing_hour){
          try{
            // item.closing_hour may be Date or string depending on driver; normalize to HH:MM
            const hh = (''+item.closing_hour).slice(0,5);
            item.closing_hour = hh;
          }catch(_){ item.closing_hour = null; }
        } else { item.closing_hour = null; }
        // Normalize payment_methods to array
        try{
          item.payment_methods = item.payment_methods ? JSON.parse(item.payment_methods) : [];
        }catch(_){ item.payment_methods = []; }
        // Ensure flags/formats
        item.allow_sell_zero_stock = item.allow_sell_zero_stock ? 1 : 0;
        item.allow_negative_inventory = item.allow_negative_inventory ? 1 : 0;
        item.op_price_manual = item.op_price_manual ? 1 : 0;
        item.silent_print = item.silent_print ? 1 : 0;
        item.print_show_change = (item.print_show_change === 0) ? 0 : 1;
        item.show_item_desc = (item.show_item_desc === 0) ? 0 : 1;
        item.cart_separate_duplicate_lines = item.cart_separate_duplicate_lines ? 1 : 0;
        // Default copies: if print_copies missing/null, derive from legacy flag
        item.print_copies = Number(item.print_copies || (item.print_two_copies ? 2 : 1));
        // Ensure logo size numbers
        item.logo_width_px = Number(item.logo_width_px || 120);
        item.logo_height_px = Number(item.logo_height_px || 120);
        item.invoice_footer_note = item.invoice_footer_note || '';
        item.hide_product_images = item.hide_product_images ? 1 : 0;
        item.hide_item_description = item.hide_item_description ? 1 : 0;
        item.zatca_enabled = item.zatca_enabled ? 1 : 0;
        // Defaults for tobacco fee settings
        item.tobacco_fee_percent = Number(item.tobacco_fee_percent || 100);
        // إزالة إعداد حد أدنى للأساس — الحد ثابت 25 ريال في المنطق
        item.tobacco_min_fee_amount = Number(item.tobacco_min_fee_amount || 25);
        // expose recovery flag
        item.recovery_unlocked = item.recovery_unlocked ? 1 : 0;
        // Customer Display settings normalization
        item.customer_display_enabled = item.customer_display_enabled ? 1 : 0;
        item.customer_display_simulator = item.customer_display_simulator ? 1 : 0;
        item.customer_display_port = item.customer_display_port || '';
        item.customer_display_baud_rate = 2400;
        item.customer_display_columns = 8;
        item.customer_display_rows = 1;
        item.customer_display_protocol = 'ecopos';
        item.customer_display_encoding = 'ascii';
        item.customer_display_brightness = 100;
        
        // تحديث رمز العملة تلقائيًا من النصوص القديمة إلى رمز الريال الجديد
        try{
          const oldSymbol = String(item.currency_symbol || '').trim();
          if(oldSymbol === 'ريال' || oldSymbol === 'ر.س' || oldSymbol === 'SAR' || oldSymbol.includes('ريال')){
            item.currency_symbol = '﷼';
            // تحديث في قاعدة البيانات
            await conn.query('UPDATE app_settings SET currency_symbol = ? WHERE id = 1', ['﷼']);
          }
        }catch(_){ /* ignore update errors */ }
        
        return { ok:true, item };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'تعذر تحميل الإعدادات' }; }
  });

  // Fetch logo image (BLOB or legacy path) as base64 for preview/printing
  ipcMain.handle('settings:image_get', async () => {
    try{
      const fs = require('fs');
      const path = require('path');
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        const [rows] = await conn.query('SELECT logo_blob, logo_mime, logo_path FROM app_settings WHERE id=1 LIMIT 1');
        const row = rows[0] || {};
        if(row.logo_blob){
          const base64 = Buffer.from(row.logo_blob).toString('base64');
          return { ok:true, base64, mime: row.logo_mime || 'image/png' };
        }
        const relOrAbs = row.logo_path;
        if(relOrAbs){
          try{
            let abs = relOrAbs;
            if(/^assets\//.test(relOrAbs)){
              abs = getResourcePath(relOrAbs);
            }
            const buf = fs.readFileSync(abs);
            const ext = String(path.extname(abs)).toLowerCase();
            const mime = ext==='.jpg' || ext==='.jpeg' ? 'image/jpeg' : ext==='.webp' ? 'image/webp' : 'image/png';
            return { ok:true, base64: buf.toString('base64'), mime };
          }catch(_){ /* ignore path read errors */ }
        }
        return { ok:false, error:'لا توجد صورة' };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'خطأ في الجلب' }; }
  });

  // Fetch default product image as base64 (if set)
  ipcMain.handle('settings:default_product_image_get', async () => {
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        const [rows] = await conn.query('SELECT default_product_img_blob, default_product_img_mime FROM app_settings WHERE id=1 LIMIT 1');
        const row = rows[0] || {};
        if(row.default_product_img_blob){
          const base64 = Buffer.from(row.default_product_img_blob).toString('base64');
          return { ok:true, base64, mime: row.default_product_img_mime || 'image/png' };
        }
        return { ok:false, error:'لا توجد صورة افتراضية' };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'خطأ في الجلب' }; }
  });

  // Save settings. Supports both legacy logo_path and new logo_blob/logo_mime (base64 from renderer)
  ipcMain.handle('settings:save', async (_e, payload) => {
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTable(conn);
        await ensureSingleton(conn);
        const p = payload || {};
        // Preserve WhatsApp flags if not explicitly provided by UI
        const [curRows] = await conn.query('SELECT whatsapp_on_print, show_whatsapp_controls, support_end_date FROM app_settings WHERE id=1 LIMIT 1');
        const cur = curRows[0] || {};
        const hasOwn = (obj, k) => Object.prototype.hasOwnProperty.call(obj, k);
        const wop = hasOwn(p, 'whatsapp_on_print') ? (p.whatsapp_on_print ? 1 : 0) : (cur.whatsapp_on_print ? 1 : 0);
        const showW = hasOwn(p, 'show_whatsapp_controls') ? (p.show_whatsapp_controls ? 1 : 0) : (cur.show_whatsapp_controls ? 1 : 0);
        const methods = Array.isArray(p.payment_methods) ? JSON.stringify(p.payment_methods) : null;
        // Preserve support_end_date unless explicitly provided with a parseable value
        let supportEndToSave = cur.support_end_date || null;
        if (hasOwn(p, 'support_end_date')) {
          const raw = String(p.support_end_date || '').trim();
          if (raw) {
            const m = raw.match(/^(\d{4})[-\/.](\d{2})[-\/.](\d{2})$/);
            if (m) {
              supportEndToSave = `${m[1]}-${m[2]}-${m[3]}`;
            } else {
              try{
                const d = new Date(raw);
                if(!isNaN(d)) supportEndToSave = d.toISOString().slice(0,10);
                // else keep current value to avoid accidental clearing
              }catch(_){ /* keep current */ }
            }
          } else {
            // Explicit empty string clears the date
            supportEndToSave = null;
          }
        }
        await conn.query(`UPDATE app_settings SET 
          seller_legal_name=?, seller_vat_number=?, company_site=?, company_location=?, mobile=?, email=?, logo_path=?, 
          vat_percent=?, prices_include_vat=?, payment_methods=?, default_payment_method=?, default_order_type=?,
          currency_code=?, currency_symbol=?, currency_symbol_position=?, app_locale=?,
          default_print_format=?, print_copies=?, silent_print=?, print_show_change=?, show_item_desc=?, op_price_manual=?, allow_sell_zero_stock=?, allow_negative_inventory=?, cart_separate_duplicate_lines=?,
          logo_width_px=?, logo_height_px=?, invoice_footer_note=?, hide_product_images=?, hide_item_description=?, closing_hour=?, zatca_enabled=?, recovery_unlocked=?, 
          tobacco_fee_percent=?, tobacco_min_fee_amount=?,
          daily_email_enabled=?, daily_email_time=?, db_backup_enabled=?, db_backup_time=?, smtp_host=?, smtp_port=?, smtp_secure=?, smtp_user=?, smtp_pass=?,
          support_end_date=?,
          whatsapp_on_print=?, whatsapp_message=?,
          commercial_register=?, national_number=?,
          show_whatsapp_controls=?,
          print_margin_right_mm=?, print_margin_left_mm=?,
          low_stock_threshold=?, show_low_stock_alerts=?,
          low_stock_email_enabled=?,
          low_stock_email_per_item=?,
          low_stock_email_cooldown_hours=?,
          customer_display_enabled=?, customer_display_simulator=?, customer_display_port=?, customer_display_baud_rate=?,
          customer_display_columns=?, customer_display_rows=?, customer_display_protocol=?, customer_display_encoding=?,
          customer_display_brightness=?, customer_display_welcome_msg=?, customer_display_thank_msg=?, customer_display_thankyou_msg=?,
          menu_url=?
          WHERE id=1`, [
          p.seller_legal_name || null,
          p.seller_vat_number || null,
          p.company_site || null,
          p.company_location || null,
          p.mobile || null,
          p.email || null,
          p.logo_path || null,
          (p.vat_percent==='' || p.vat_percent===null || p.vat_percent===undefined) ? 15.00 : Number(p.vat_percent),
          p.prices_include_vat ? 1 : 0,
          methods,
          (p.default_payment_method || null),
          (p.default_order_type || null),
          (p.currency_code || 'SAR'),
          (() => {
            // استبدال الرموز القديمة برمز الريال الجديد تلقائيًا
            const sym = String(p.currency_symbol || '﷼').trim();
            if(sym === 'ريال' || sym === 'ر.س' || sym === 'SAR' || sym.includes('ريال')) return '﷼';
            return sym || '﷼';
          })(),
          (p.currency_symbol_position === 'before' ? 'before' : 'after'),
          (p.app_locale === 'en' ? 'en' : 'ar'),
          'thermal', // A4 removed
          Math.max(1, Number(p.print_copies || 1)),
          (p.silent_print ? 1 : 0),
          (p.print_show_change === 0 ? 0 : 1),
          (p.show_item_desc === 0 ? 0 : 1),
          (p.op_price_manual ? 1 : 0),
          (p.allow_sell_zero_stock ? 1 : 0),
          (p.allow_negative_inventory ? 1 : 0),
          (p.cart_separate_duplicate_lines ? 1 : 0),
          (Number(p.logo_width_px) || null),
          (Number(p.logo_height_px) || null),
          (p.invoice_footer_note || null),
          (p.hide_product_images ? 1 : 0),
          (p.hide_item_description ? 1 : 0),
          (p.closing_hour ? String(p.closing_hour).slice(0,5)+':00' : null),
          (p.zatca_enabled ? 1 : 0),
          (p.recovery_unlocked ? 1 : 0),
          (p.tobacco_fee_percent==='' || p.tobacco_fee_percent===null || p.tobacco_fee_percent===undefined) ? null : Number(p.tobacco_fee_percent),
          (p.tobacco_min_fee_amount==='' || p.tobacco_min_fee_amount===null || p.tobacco_min_fee_amount===undefined) ? null : Number(p.tobacco_min_fee_amount),
          (p.daily_email_enabled ? 1 : 0),
          (p.daily_email_time ? String(p.daily_email_time).slice(0,5)+':00' : null),
          (p.db_backup_enabled ? 1 : 0),
          (p.db_backup_time ? String(p.db_backup_time).slice(0,5)+':00' : null),
          (p.smtp_host || null),
          (p.smtp_port ? Number(p.smtp_port) : null),
          (p.smtp_secure ? 1 : 0),
          (p.smtp_user || null),
          (p.smtp_pass || null),
          supportEndToSave,
          wop,
          (p.whatsapp_message || null),
          (p.commercial_register || null),
          (p.national_number || null),
          showW,
          (p.print_margin_right_mm===''||p.print_margin_right_mm===null||p.print_margin_right_mm===undefined) ? null : Number(p.print_margin_right_mm),
          (p.print_margin_left_mm===''||p.print_margin_left_mm===null||p.print_margin_left_mm===undefined) ? null : Number(p.print_margin_left_mm),
          Math.max(0, Number(p.low_stock_threshold===''||p.low_stock_threshold===null||p.low_stock_threshold===undefined ? 5 : p.low_stock_threshold)),
          (p.show_low_stock_alerts ? 1 : 0),
          (p.low_stock_email_enabled ? 1 : 0),
          (p.low_stock_email_per_item ? 1 : 0),
          Math.max(1, Number(p.low_stock_email_cooldown_hours===''||p.low_stock_email_cooldown_hours===null||p.low_stock_email_cooldown_hours===undefined ? 24 : p.low_stock_email_cooldown_hours)),
          (p.customer_display_enabled ? 1 : 0),
          (p.customer_display_simulator ? 1 : 0),
          (p.customer_display_port || null),
          (Number(p.customer_display_baud_rate) || 9600),
          (Number(p.customer_display_columns) || 20),
          (Number(p.customer_display_rows) || 2),
          (p.customer_display_protocol || 'escpos'),
          (p.customer_display_encoding || 'windows-1256'),
          (Number(p.customer_display_brightness) || 100),
          (p.customer_display_welcome_msg || 'أهلا وسهلا'),
          (p.customer_display_thank_msg || 'شكرا لزيارتكم'),
          (p.customer_display_thankyou_msg || 'شكرا لزيارتكم'),
          (p.menu_url || null)
        ]);
        // Handle logo updates (DB BLOB), mirroring products image flow
        if(p && p.logo_clear === true){
          await conn.query('UPDATE app_settings SET logo_blob=NULL, logo_mime=NULL, logo_path=NULL WHERE id=1');
        } else if(p && p.logo_blob_base64){
          try{
            const buf = Buffer.from(p.logo_blob_base64, 'base64');
            const mime = p.logo_mime || 'image/png';
            await conn.query('UPDATE app_settings SET logo_blob=?, logo_mime=?, logo_path=NULL WHERE id=1', [buf, mime]);
          }catch(_){ /* ignore malformed base64 */ }
        }
        // Handle default product image updates
        if(p && p.default_product_img_clear === true){
          await conn.query('UPDATE app_settings SET default_product_img_blob=NULL, default_product_img_mime=NULL WHERE id=1');
        } else if(p && p.default_product_img_blob_base64){
          try{
            const buf2 = Buffer.from(p.default_product_img_blob_base64, 'base64');
            const mime2 = p.default_product_img_mime || 'image/png';
            await conn.query('UPDATE app_settings SET default_product_img_blob=?, default_product_img_mime=? WHERE id=1', [buf2, mime2]);
          }catch(_){ /* ignore malformed base64 */ }
        }
        return { ok:true };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل حفظ الإعدادات' }; }
  });
}

// eager ensure on app start
(async () => {
  try{
    const pool = await getPool();
    const conn = await pool.getConnection();
    try{
      await conn.query(`USE \`${DB_NAME}\``);
      await conn.query(`
        CREATE TABLE IF NOT EXISTS app_settings (
          id INT PRIMARY KEY,
          company_name VARCHAR(255) NULL,
          company_site VARCHAR(255) NULL,
          mobile VARCHAR(50) NULL,
          email VARCHAR(255) NULL,
          logo_path VARCHAR(512) NULL,
          vat_percent DECIMAL(5,2) NOT NULL DEFAULT 15.00,
          prices_include_vat TINYINT NOT NULL DEFAULT 1,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      // PERFORMANCE OPTIMIZATION: Fetch all columns once instead of multiple queries
      const [existingCols] = await conn.query('SHOW COLUMNS FROM app_settings');
      const existingColNames = new Set(existingCols.map(col => col.Field));
      const missing = (name) => !existingColNames.has(name);
      
      if(missing('company_location')){
        await conn.query('ALTER TABLE app_settings ADD COLUMN company_location VARCHAR(255) NULL AFTER company_site');
      }
      if(missing('payment_methods')){
        await conn.query('ALTER TABLE app_settings ADD COLUMN payment_methods TEXT NULL AFTER email');
      }
      if(missing('currency_code')){
        await conn.query("ALTER TABLE app_settings ADD COLUMN currency_code VARCHAR(8) NULL DEFAULT 'SAR' AFTER payment_methods");
      }
      if(missing('currency_symbol')){
        await conn.query("ALTER TABLE app_settings ADD COLUMN currency_symbol VARCHAR(8) NULL DEFAULT '﷼' AFTER currency_code");
      }
      if(missing('currency_symbol_position')){
        await conn.query("ALTER TABLE app_settings ADD COLUMN currency_symbol_position ENUM('before','after') NOT NULL DEFAULT 'after' AFTER currency_symbol");
      }
      // Also ensure new general info fields
      if(missing('seller_legal_name')){
        await conn.query("ALTER TABLE app_settings ADD COLUMN seller_legal_name VARCHAR(255) NULL AFTER email");
      }
      if(missing('seller_vat_number')){
        await conn.query("ALTER TABLE app_settings ADD COLUMN seller_vat_number VARCHAR(32) NULL AFTER seller_legal_name");
      }
      if(missing('commercial_register')){
        await conn.query("ALTER TABLE app_settings ADD COLUMN commercial_register VARCHAR(64) NULL AFTER seller_vat_number");
      }
      if(missing('national_number')){
        await conn.query("ALTER TABLE app_settings ADD COLUMN national_number VARCHAR(64) NULL AFTER commercial_register");
      }
      // License fields (ensure at startup as well)
      if(missing('license_code')){
        try{ await conn.query("ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS license_code VARCHAR(255) NULL AFTER app_locale"); }
        catch(_){
          const [r1] = await conn.query('SHOW COLUMNS FROM app_settings LIKE ?', ['license_code']);
          if(r1.length===0){ await conn.query("ALTER TABLE app_settings ADD COLUMN license_code VARCHAR(255) NULL AFTER app_locale"); }
        }
      }
      if(missing('license_uuid')){
        try{ await conn.query("ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS license_uuid VARCHAR(64) NULL AFTER license_code"); }
        catch(_){
          const [r2] = await conn.query('SHOW COLUMNS FROM app_settings LIKE ?', ['license_uuid']);
          if(r2.length===0){ await conn.query("ALTER TABLE app_settings ADD COLUMN license_uuid VARCHAR(64) NULL AFTER license_code"); }
        }
      }
      if(missing('license_activated_at')){
        try{ await conn.query("ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS license_activated_at DATETIME NULL AFTER license_uuid"); }
        catch(_){
          const [r3] = await conn.query('SHOW COLUMNS FROM app_settings LIKE ?', ['license_activated_at']);
          if(r3.length===0){ await conn.query("ALTER TABLE app_settings ADD COLUMN license_activated_at DATETIME NULL AFTER license_uuid"); }
        }
      }
      
      // WhatsApp messages limit settings (ensure at startup)
      if(missing('whatsapp_messages_limit')){
        await conn.query("ALTER TABLE app_settings ADD COLUMN whatsapp_messages_limit INT NOT NULL DEFAULT 0 AFTER license_activated_at");
        await conn.query("UPDATE app_settings SET whatsapp_messages_limit = 0 WHERE id = 1 AND whatsapp_messages_limit = 100");
      }
      if(missing('whatsapp_messages_sent')){
        await conn.query("ALTER TABLE app_settings ADD COLUMN whatsapp_messages_sent INT NOT NULL DEFAULT 0 AFTER whatsapp_messages_limit");
      }

      const [rows] = await conn.query('SELECT id FROM app_settings WHERE id=1');
      if(rows.length === 0){
        await conn.query("INSERT INTO app_settings (id, vat_percent, prices_include_vat, currency_code, currency_symbol, currency_symbol_position) VALUES (1, 15.00, 1, 'SAR', '﷼', 'after')");
      }
      
      // Reset WhatsApp messages to 0 if they were previously set to default 100
      await conn.query("UPDATE app_settings SET whatsapp_messages_limit = 0, whatsapp_messages_sent = 0 WHERE id = 1 AND whatsapp_messages_limit = 100");
    } finally { conn.release(); }
  }catch(e){ console.error('settings:init ensure table failed', e); }
})();

// Lightweight helpers to read/write app_locale directly for app-wide language
async function __get_app_locale(){
  try{
    const pool = await getPool();
    const conn = await pool.getConnection();
    try{
      await conn.query(`USE \`${DB_NAME}\``);
      const [rows] = await conn.query('SELECT app_locale FROM app_settings WHERE id=1 LIMIT 1');
      const v = rows[0] && rows[0].app_locale ? rows[0].app_locale : 'ar';
      return (v==='en'?'en':'ar');
    } finally { conn.release(); }
  }catch(_){ return 'ar'; }
}
async function __set_app_locale(v){
  const lang = (v==='en'?'en':'ar');
  try{
    const pool = await getPool();
    const conn = await pool.getConnection();
    try{
      await conn.query(`USE \`${DB_NAME}\``);
      await conn.query('UPDATE app_settings SET app_locale=? WHERE id=1', [lang]);
      return true;
    } finally { conn.release(); }
  }catch(_){ return false; }
}

function registerDeviceModeIPC(){
  const { getDeviceMode, setDeviceMode, getApiBaseUrl } = require('./api-client');

  ipcMain.handle('device:get_mode', async () => {
    return { ok: true, mode: getDeviceMode(), api_url: getApiBaseUrl() };
  });

  ipcMain.handle('device:set_mode', async (_e, { mode, api_host, api_port }) => {
    try {
      setDeviceMode(mode, api_host, api_port);
      return { ok: true };
    } catch (error) {
      console.error('device:set_mode error:', error);
      return { ok: false, error: error.message };
    }
  });
}

module.exports = { registerSettingsIPC, registerDeviceModeIPC, __get_app_locale, __set_app_locale };