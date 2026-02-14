// Sales IPC: persist invoices and items
const { ipcMain } = require('electron');
const { getPool, DB_NAME } = require('../db/connection');
const { isSecondaryDevice, fetchFromAPI, postToAPI } = require('./api-client');

function registerSalesIPC(){
  const SALES_CACHE_TTL = 5 * 60 * 1000;
  const salesCache = new Map();

  function cloneValue(value){
    if(value === null || value === undefined){ return value; }
    try{ return JSON.parse(JSON.stringify(value)); }catch(_){ return value; }
  }

  function buildSaleCacheKey(saleId){
    return String(saleId);
  }

  function getCachedSale(key){
    const entry = salesCache.get(key);
    if(!entry){ return null; }
    if(Date.now() - entry.ts >= SALES_CACHE_TTL){
      salesCache.delete(key);
      return null;
    }
    return {
      sale: cloneValue(entry.data.sale),
      items: (entry.data.items || []).map(cloneValue)
    };
  }

  function setSaleCache(key, sale, items){
    const payload = {
      sale: cloneValue(sale),
      items: Array.isArray(items) ? items.map(cloneValue) : []
    };
    salesCache.set(key, { ts: Date.now(), data: payload });
  }

  function invalidateSaleCache(saleId){
    if(saleId !== null && typeof saleId !== 'undefined'){
      salesCache.delete(buildSaleCacheKey(saleId));
      return;
    }
    salesCache.clear();
  }

  async function ensureTables(conn){
    await conn.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_no VARCHAR(32) UNIQUE,
        customer_id INT NULL,
        customer_name VARCHAR(255) NULL,
        payment_method VARCHAR(32) NOT NULL,
        payment_status ENUM('unpaid','paid') NOT NULL DEFAULT 'paid',
        sub_total DECIMAL(12,2) NOT NULL,
        vat_total DECIMAL(12,2) NOT NULL,
        grand_total DECIMAL(12,2) NOT NULL,
        total_after_discount DECIMAL(12,2) NULL,
        discount_type VARCHAR(16) NULL,
        discount_value DECIMAL(12,2) NULL,
        discount_amount DECIMAL(12,2) NULL,
        notes VARCHAR(255) NULL,
        settled_at DATETIME NULL,
        settled_method VARCHAR(32) NULL,
        settled_cash DECIMAL(12,2) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Upgrade older schemas: add/relax discount columns
    // Ensure extra_value column exists and is nullable
    const [colExtraUp] = await conn.query("SHOW COLUMNS FROM sales LIKE 'extra_value'");
    if(!colExtraUp.length){ await conn.query("ALTER TABLE sales ADD COLUMN extra_value DECIMAL(12,2) NULL AFTER sub_total"); }

    const [colTad] = await conn.query("SHOW COLUMNS FROM sales LIKE 'total_after_discount'");
    if(!colTad.length){
      await conn.query("ALTER TABLE sales ADD COLUMN total_after_discount DECIMAL(12,2) NULL AFTER grand_total");
    } else {
      const col = colTad[0];
      if(String(col.Null).toUpperCase() === 'NO'){
        await conn.query("ALTER TABLE sales MODIFY total_after_discount DECIMAL(12,2) NULL");
      }
    }
    const [colDT] = await conn.query("SHOW COLUMNS FROM sales LIKE 'discount_type'");
    if(!colDT.length){ await conn.query("ALTER TABLE sales ADD COLUMN discount_type VARCHAR(16) NULL AFTER total_after_discount"); }
    const [colDV] = await conn.query("SHOW COLUMNS FROM sales LIKE 'discount_value'");
    if(!colDV.length){ await conn.query("ALTER TABLE sales ADD COLUMN discount_value DECIMAL(12,2) NULL AFTER discount_type"); }
    const [colDA] = await conn.query("SHOW COLUMNS FROM sales LIKE 'discount_amount'");
    if(!colDA.length){ await conn.query("ALTER TABLE sales ADD COLUMN discount_amount DECIMAL(12,2) NULL AFTER discount_value"); }

    // Ensure customer snapshot columns exist inside sales (to search by data stored in invoice)
    const [colCustPhone] = await conn.query("SHOW COLUMNS FROM sales LIKE 'customer_phone'");
    if(!colCustPhone.length){ await conn.query("ALTER TABLE sales ADD COLUMN customer_phone VARCHAR(64) NULL AFTER customer_name"); }
    const [colCustVat] = await conn.query("SHOW COLUMNS FROM sales LIKE 'customer_vat'");
    if(!colCustVat.length){ await conn.query("ALTER TABLE sales ADD COLUMN customer_vat VARCHAR(32) NULL AFTER customer_phone"); }

    // Ensure settlement columns (for legacy)
    const [colPS] = await conn.query("SHOW COLUMNS FROM sales LIKE 'payment_status'");
    if(!colPS.length){ await conn.query("ALTER TABLE sales ADD COLUMN payment_status ENUM('unpaid','paid') NOT NULL DEFAULT 'paid' AFTER payment_method"); }
    const [colSetAt] = await conn.query("SHOW COLUMNS FROM sales LIKE 'settled_at'");
    if(!colSetAt.length){ await conn.query("ALTER TABLE sales ADD COLUMN settled_at DATETIME NULL AFTER notes"); }
    const [colSetMeth] = await conn.query("SHOW COLUMNS FROM sales LIKE 'settled_method'");
    if(!colSetMeth.length){ await conn.query("ALTER TABLE sales ADD COLUMN settled_method VARCHAR(32) NULL AFTER settled_at"); }
    const [colSetCash] = await conn.query("SHOW COLUMNS FROM sales LIKE 'settled_cash'");
    if(!colSetCash.length){ await conn.query("ALTER TABLE sales ADD COLUMN settled_cash DECIMAL(12,2) NULL AFTER settled_method"); }

    // Ensure split payment amount columns for reports (cash/card)
    const [colPayCash] = await conn.query("SHOW COLUMNS FROM sales LIKE 'pay_cash_amount'");
    if(!colPayCash.length){ await conn.query("ALTER TABLE sales ADD COLUMN pay_cash_amount DECIMAL(12,2) NULL AFTER settled_cash"); }
    const [colPayCard] = await conn.query("SHOW COLUMNS FROM sales LIKE 'pay_card_amount'");
    if(!colPayCard.length){ await conn.query("ALTER TABLE sales ADD COLUMN pay_card_amount DECIMAL(12,2) NULL AFTER pay_cash_amount"); }

    // Ensure document type column (invoice|credit_note) exists and default to 'invoice'
    const [colDocTypeEnsure] = await conn.query("SHOW COLUMNS FROM sales LIKE 'doc_type'");
    if(!colDocTypeEnsure.length){
      await conn.query("ALTER TABLE sales ADD COLUMN doc_type ENUM('invoice','credit_note') NOT NULL DEFAULT 'invoice' AFTER invoice_no");
      try{ await conn.query("UPDATE sales SET doc_type='invoice' WHERE doc_type IS NULL"); }catch(_){ }
    }

    // Ensure per-invoice order number (resets daily by closing hour) column exists
    const [colOrderNo] = await conn.query("SHOW COLUMNS FROM sales LIKE 'order_no'");
    if(!colOrderNo.length){ await conn.query("ALTER TABLE sales ADD COLUMN order_no INT NULL AFTER invoice_no"); }

    // إضافة حقول ZATCA للفاتورة الإلكترونية
    const [colZatcaUuid] = await conn.query("SHOW COLUMNS FROM sales LIKE 'zatca_uuid'");
    if(!colZatcaUuid.length){ await conn.query("ALTER TABLE sales ADD COLUMN zatca_uuid VARCHAR(255) NULL AFTER order_no"); }
    
    const [colZatcaHash] = await conn.query("SHOW COLUMNS FROM sales LIKE 'zatca_hash'");
    if(!colZatcaHash.length){ await conn.query("ALTER TABLE sales ADD COLUMN zatca_hash VARCHAR(255) NULL AFTER zatca_uuid"); }
    
    const [colZatcaQr] = await conn.query("SHOW COLUMNS FROM sales LIKE 'zatca_qr'");
    if(!colZatcaQr.length){ await conn.query("ALTER TABLE sales ADD COLUMN zatca_qr TEXT NULL AFTER zatca_hash"); }
    
    const [colZatcaSubmitted] = await conn.query("SHOW COLUMNS FROM sales LIKE 'zatca_submitted'");
    if(!colZatcaSubmitted.length){ await conn.query("ALTER TABLE sales ADD COLUMN zatca_submitted DATETIME NULL AFTER zatca_qr"); }
    
    const [colZatcaStatus] = await conn.query("SHOW COLUMNS FROM sales LIKE 'zatca_status'");
    if(!colZatcaStatus.length){ await conn.query("ALTER TABLE sales ADD COLUMN zatca_status ENUM('pending','submitted','accepted','rejected') NULL DEFAULT 'pending' AFTER zatca_submitted"); }

    // سبب الرفض من هيئة الزكاة (نخزنه لعرضه لاحقًا)
    const [colZatcaRej] = await conn.query("SHOW COLUMNS FROM sales LIKE 'zatca_rejection_reason'");
    if(!colZatcaRej.length){ await conn.query("ALTER TABLE sales ADD COLUMN zatca_rejection_reason TEXT NULL AFTER zatca_status"); }
    
    // آخر رد من هيئة الزكاة (للرجوع إليه سواء نجاح أو فشل)
    const [colZatcaResp] = await conn.query("SHOW COLUMNS FROM sales LIKE 'zatca_response'");
    if(!colZatcaResp.length){ await conn.query("ALTER TABLE sales ADD COLUMN zatca_response LONGTEXT NULL AFTER zatca_rejection_reason"); }

    // Track user who created the sale (for deletion constraints)
    const [colCById] = await conn.query("SHOW COLUMNS FROM sales LIKE 'created_by_user_id'");
    if(!colCById.length){ await conn.query("ALTER TABLE sales ADD COLUMN created_by_user_id INT NULL AFTER order_no"); }
    const [colCByName] = await conn.query("SHOW COLUMNS FROM sales LIKE 'created_by_username'");
    if(!colCByName.length){ await conn.query("ALTER TABLE sales ADD COLUMN created_by_username VARCHAR(64) NULL AFTER created_by_user_id"); }

    // Reference to base invoice for credit notes (to show link to original invoice)
    const [colRefBase] = await conn.query("SHOW COLUMNS FROM sales LIKE 'ref_base_sale_id'");
    if(!colRefBase.length){ await conn.query("ALTER TABLE sales ADD COLUMN ref_base_sale_id INT NULL AFTER doc_type"); }
    const [colRefBaseNo] = await conn.query("SHOW COLUMNS FROM sales LIKE 'ref_base_invoice_no'");
    if(!colRefBaseNo.length){ await conn.query("ALTER TABLE sales ADD COLUMN ref_base_invoice_no VARCHAR(32) NULL AFTER ref_base_sale_id"); }

    // Fix timezone issue: convert created_at from TIMESTAMP to DATETIME
    const [colCreatedAt] = await conn.query("SHOW COLUMNS FROM sales LIKE 'created_at'");
    if(colCreatedAt.length && String(colCreatedAt[0].Type).toUpperCase().includes('TIMESTAMP')){
      await conn.query("ALTER TABLE sales MODIFY created_at DATETIME DEFAULT CURRENT_TIMESTAMP");
    }

    // Add performance indexes for reports (VPN optimized)
    try{
      const [idxCreatedAt] = await conn.query("SHOW INDEX FROM sales WHERE Key_name='idx_created_at'");
      if(!idxCreatedAt.length){ await conn.query("ALTER TABLE sales ADD INDEX idx_created_at (created_at)"); }
    }catch(_){ /* ignore if exists */ }
    
    try{
      const [idxUserId] = await conn.query("SHOW INDEX FROM sales WHERE Key_name='idx_created_by_user_id'");
      if(!idxUserId.length){ await conn.query("ALTER TABLE sales ADD INDEX idx_created_by_user_id (created_by_user_id)"); }
    }catch(_){ /* ignore if exists */ }
    
    try{
      const [idxDocType] = await conn.query("SHOW INDEX FROM sales WHERE Key_name='idx_doc_type'");
      if(!idxDocType.length){ await conn.query("ALTER TABLE sales ADD INDEX idx_doc_type (doc_type)"); }
    }catch(_){ /* ignore if exists */ }
    
    try{
      const [idxPayMethod] = await conn.query("SHOW INDEX FROM sales WHERE Key_name='idx_payment_method'");
      if(!idxPayMethod.length){ await conn.query("ALTER TABLE sales ADD INDEX idx_payment_method (payment_method)"); }
    }catch(_){ /* ignore if exists */ }
    
    try{
      const [idxPayStatus] = await conn.query("SHOW INDEX FROM sales WHERE Key_name='idx_payment_status'");
      if(!idxPayStatus.length){ await conn.query("ALTER TABLE sales ADD INDEX idx_payment_status (payment_status)"); }
    }catch(_){ /* ignore if exists */ }

    await conn.query(`
      CREATE TABLE IF NOT EXISTS drivers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(64) NULL,
        active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS sales_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sale_id INT NOT NULL,
        product_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description VARCHAR(255) NULL,
        price DECIMAL(12,2) NOT NULL,
        qty INT NOT NULL,
        line_total DECIMAL(12,2) NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    // ترقية الجداول القديمة: إضافة عمود الوصف إن لم يكن موجودًا
    const [colDesc] = await conn.query("SHOW COLUMNS FROM sales_items LIKE 'description'");
    if(!colDesc.length){
      await conn.query("ALTER TABLE sales_items ADD COLUMN description VARCHAR(255) NULL AFTER name");
    }
    
    // Add performance index on sale_id for faster print queries
    try{
      const [idxSaleId] = await conn.query("SHOW INDEX FROM sales_items WHERE Key_name='idx_sales_items_sale_id'");
      if(!idxSaleId.length){ 
        await conn.query("ALTER TABLE sales_items ADD INDEX idx_sales_items_sale_id (sale_id)"); 
      }
    }catch(_){ /* ignore if exists */ }
  }

  async function getNextSequentialNo(conn){
    // Ensure a tiny key-value table to store running counters
    await conn.query(`CREATE TABLE IF NOT EXISTS app_counters (
      name VARCHAR(64) PRIMARY KEY,
      value INT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
    // Initialize if missing
    await conn.query(`INSERT IGNORE INTO app_counters (name, value) VALUES ('invoice_seq', 0)`);
    
    // Check highest invoice_no in sales table to handle migrated invoices
    try{
      const [[maxRow]] = await conn.query(`
        SELECT MAX(CAST(invoice_no AS UNSIGNED)) as max_no 
        FROM sales 
        WHERE invoice_no REGEXP '^[0-9]+$'
      `);
      const maxInvoiceNo = Number(maxRow?.max_no || 0);
      // Update counter if existing invoices have higher numbers
      if(maxInvoiceNo > 0){
        await conn.query(`
          UPDATE app_counters 
          SET value = GREATEST(value, ?) 
          WHERE name='invoice_seq'
        `, [maxInvoiceNo]);
      }
    }catch(e){ console.error('Error checking max invoice_no:', e); }
    
    // Atomically increment and fetch
    await conn.query(`UPDATE app_counters SET value = value + 1 WHERE name='invoice_seq'`);
    const [[row]] = await conn.query(`SELECT value FROM app_counters WHERE name='invoice_seq'`);
    return Number(row.value || 1);
  }

  async function getNextOrderNo(conn){
    await conn.query(`CREATE TABLE IF NOT EXISTS app_state (
      k VARCHAR(64) PRIMARY KEY,
      sval VARCHAR(255) NULL,
      ival INT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

    let closing = '00:00';
    try{
      const [[st]] = await conn.query('SELECT closing_hour FROM app_settings WHERE id=1');
      if(st && st.closing_hour){ closing = String(st.closing_hour).slice(0,5); }
    }catch(_){ }
    const [hh, mm] = (closing||'00:00').split(':').map(v=>Number(v||0));

    const [rows] = await conn.query("SELECT k, sval, ival FROM app_state WHERE k IN ('order_seq_anchor','order_seq_value') FOR UPDATE");
    const map = new Map(rows.map(r => [r.k, r]));
    const now = new Date();

    function dateAtHHMM(date, H, M){ const d = new Date(date); d.setHours(H||0, M||0, 0, 0); return d; }

    let anchorStr = map.get('order_seq_anchor')?.sval || null;
    let anchor = anchorStr ? new Date(anchorStr) : null;
    if(!anchor || isNaN(anchor.getTime())){
      const todayClosing = dateAtHHMM(now, hh, mm);
      anchor = (now < todayClosing) ? new Date(todayClosing.getTime() - 24*60*60*1000) : todayClosing;
      await conn.query("INSERT INTO app_state (k, sval, ival) VALUES ('order_seq_anchor', ?, NULL) ON DUPLICATE KEY UPDATE sval=?", [anchor.toISOString(), anchor.toISOString()]);
      map.set('order_seq_anchor', { k:'order_seq_anchor', sval: anchor.toISOString(), ival: null });
    }

    let boundary = dateAtHHMM(anchor, hh, mm);
    if(boundary <= anchor){ boundary = new Date(boundary.getTime() + 24*60*60*1000); }

    let curVal = Number(map.get('order_seq_value')?.ival || 0);

    if(now >= boundary){
      anchor = boundary;
      curVal = 0;
      await conn.query("INSERT INTO app_state (k, sval, ival) VALUES ('order_seq_anchor', ?, NULL) ON DUPLICATE KEY UPDATE sval=?", [anchor.toISOString(), anchor.toISOString()]);
      await conn.query("INSERT INTO app_state (k, sval, ival) VALUES ('order_seq_value', NULL, 0) ON DUPLICATE KEY UPDATE ival=0");
    }

    curVal = Number(curVal) + 1;
    await conn.query("INSERT INTO app_state (k, sval, ival) VALUES ('order_seq_value', NULL, ?) ON DUPLICATE KEY UPDATE ival=?", [curVal, curVal]);
    return curVal;
  }

  function genInvoiceNoFromSeq(seq){
    // Simple sequential number starting from 1 (no padding)
    return String(seq);
  }

  // Reset all sales and restart invoice sequence
  ipcMain.handle('sales:reset_all', async () => {
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTables(conn);
        await conn.beginTransaction();
        // Delete all sales (items will cascade)
        await conn.query('DELETE FROM sales');
        // Reset auto-increment for clarity
        try{ await conn.query('ALTER TABLE sales AUTO_INCREMENT = 1'); }catch(_){ }
        try{ await conn.query('ALTER TABLE sales_items AUTO_INCREMENT = 1'); }catch(_){ }
        // Ensure counters table and reset invoice_seq to 0 (so next becomes 1)
        await conn.query(`CREATE TABLE IF NOT EXISTS app_counters (name VARCHAR(64) PRIMARY KEY, value INT NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
        await conn.query(`INSERT IGNORE INTO app_counters (name, value) VALUES ('invoice_seq', 0)`);
        await conn.query(`UPDATE app_counters SET value = 0 WHERE name='invoice_seq'`);
        // Reset order sequence to 0 (so next becomes 1)
        await conn.query(`UPDATE app_state SET ival = 0 WHERE k = 'order_seq_value'`);
        await conn.query(`UPDATE app_state SET sval = NOW() WHERE k = 'order_seq_anchor'`);
        await conn.commit();
        invalidateSaleCache();
        return { ok:true };
      } catch(e){ await conn.rollback(); throw e; }
      finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل استعادة الفواتير' }; }
  });

  ipcMain.handle('sales:create', async (_e, payload) => {
    const p = payload || {};
    if(!Array.isArray(p.items) || p.items.length===0){ return { ok:false, error:'لا توجد عناصر' }; }
    if(!p.payment_method){ return { ok:false, error:'طريقة الدفع مطلوبة' }; }
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTables(conn);

        // جلب إعدادات المخزون
        const [[settings]] = await conn.query('SELECT allow_sell_zero_stock, allow_negative_inventory FROM app_settings WHERE id=1');
        const allowZero = settings && settings.allow_sell_zero_stock ? 1 : 0;
        const allowNegInv = settings && settings.allow_negative_inventory ? 1 : 0;

        // قفل/بدء معاملة لضمان سلامة المخزون
        await conn.beginTransaction();

        // تحقق وخصم المخزون لكل صنف
        for(const it of p.items){
          const pid = Number(it.product_id);
          const qty = Math.max(1, Number(it.qty||1));
          // اجلب المخزون الحالي
          const [[row]] = await conn.query('SELECT stock, name FROM products WHERE id=? FOR UPDATE', [pid]);
          if(!row){ await conn.rollback(); return { ok:false, error:`الصنف غير موجود (ID=${pid})` }; }
          const current = Number(row.stock||0);
          if(current <= 0 && !allowZero){
            await conn.rollback();
            return { ok:false, error:`لا يمكن بيع الصنف "${row.name}" لأن المخزون صفر` };
          }
          if(current - qty < 0 && !allowZero){
            await conn.rollback();
            return { ok:false, error:`الكمية المطلوبة للصنف "${row.name}" غير متاحة في المخزون` };
          }
          // خصم المخزون (يسمح بالسالب إذا allowZero=1)
          await conn.query('UPDATE products SET stock = stock - ? WHERE id=?', [qty, pid]);

          // تحقق بعد الخصم: أرسل تنبيه بريد عند عبور الحد من أعلى إلى أقل/يساوي (بدون تهدئة)
          try{
            const [[s]] = await conn.query('SELECT low_stock_email_enabled, low_stock_threshold, email, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass, seller_legal_name, company_location FROM app_settings WHERE id=1');
            if(s && s.low_stock_email_enabled){
              const threshold = Math.max(0, Number(s.low_stock_threshold||5));
              const newStock = Number(current) - Number(qty);
              // أرسل فقط إذا كان المخزون قبل البيع أعلى من الحد وأصبح بعد البيع أقل من أو يساوي الحد
              if(Number(current) > threshold && newStock <= threshold){
                try{
                  await require('./scheduler').__sendLowStockEmailInternal(s, [{ id: pid, name: row.name, stock: newStock }]);
                }catch(e){ console.error('low stock email send failed', e && e.message || e); }
              }
            }
          }catch(_){ }
        }

        // تأكد من وجود عمود extra_value
        const [colExtra] = await conn.query("SHOW COLUMNS FROM sales LIKE 'extra_value'");
        if(!colExtra.length){
          await conn.query("ALTER TABLE sales ADD COLUMN extra_value DECIMAL(12,2) NULL AFTER sub_total");
        }
        const seq = await getNextSequentialNo(conn);
        const invoiceNo = genInvoiceNoFromSeq(seq);
        const orderNo = await getNextOrderNo(conn);
        // Ensure coupon columns exist
        const [colCCode] = await conn.query("SHOW COLUMNS FROM sales LIKE 'coupon_code'");
        if(!colCCode.length){ await conn.query("ALTER TABLE sales ADD COLUMN coupon_code VARCHAR(64) NULL AFTER discount_amount"); }
        const [colCMode] = await conn.query("SHOW COLUMNS FROM sales LIKE 'coupon_mode'");
        if(!colCMode.length){ await conn.query("ALTER TABLE sales ADD COLUMN coupon_mode VARCHAR(16) NULL AFTER coupon_code"); }
        const [colCVal] = await conn.query("SHOW COLUMNS FROM sales LIKE 'coupon_value'");
        if(!colCVal.length){ await conn.query("ALTER TABLE sales ADD COLUMN coupon_value DECIMAL(12,2) NULL AFTER coupon_mode"); }

        // Snapshot customer fields inside invoice for reliable search
        let snapName = (p.customer_name || null);
        let snapPhone = null;
        let snapVat = null;
        if(p.customer_id){
          try{
            const [[cust]] = await conn.query('SELECT name, phone, vat_number FROM customers WHERE id=? LIMIT 1', [p.customer_id]);
            if(cust){
              if(!snapName) snapName = cust.name || null;
              snapPhone = cust.phone || null;
              snapVat = cust.vat_number || null;
            }
          }catch(_){ /* ignore */ }
        }

        // derive payment_status based on method (credit -> unpaid, otherwise paid)
        const payStatus = (String(p.payment_method).toLowerCase()==='credit') ? 'unpaid' : 'paid';

        // Ensure tobacco fee column exists
        const [colTobacco] = await conn.query("SHOW COLUMNS FROM sales LIKE 'tobacco_fee'");
        if(!colTobacco.length){ await conn.query("ALTER TABLE sales ADD COLUMN tobacco_fee DECIMAL(12,2) NULL AFTER extra_value"); }

        // Ensure driver columns exist
        const [colDrvIdIns] = await conn.query("SHOW COLUMNS FROM sales LIKE 'driver_id'");
        if(!colDrvIdIns.length){ await conn.query("ALTER TABLE sales ADD COLUMN driver_id INT NULL AFTER customer_vat"); }
        const [colDrvNameIns] = await conn.query("SHOW COLUMNS FROM sales LIKE 'driver_name'");
        if(!colDrvNameIns.length){ await conn.query("ALTER TABLE sales ADD COLUMN driver_name VARCHAR(255) NULL AFTER driver_id"); }
        const [colDrvPhoneIns] = await conn.query("SHOW COLUMNS FROM sales LIKE 'driver_phone'");
        if(!colDrvPhoneIns.length){ await conn.query("ALTER TABLE sales ADD COLUMN driver_phone VARCHAR(64) NULL AFTER driver_name"); }

        // Ensure order_type column exists
        const [colOrderType] = await conn.query("SHOW COLUMNS FROM sales LIKE 'order_type'");
        if(!colOrderType.length){ await conn.query("ALTER TABLE sales ADD COLUMN order_type VARCHAR(32) NULL AFTER driver_phone"); }

        // snapshot driver
        let drvName = null, drvPhone = null; let drvId = (p.driver_id || null);
        if(p.driver_id){
          try{
            const [[drv]] = await conn.query('SELECT id, name, phone FROM drivers WHERE id=? LIMIT 1', [Number(p.driver_id)]);
            if(drv){ drvName = drv.name || null; drvPhone = drv.phone || null; }
          }catch(_){ }
        }

        const [res] = await conn.query(`INSERT INTO sales (invoice_no, order_no, created_by_user_id, created_by_username, customer_id, customer_name, customer_phone, customer_vat, driver_id, driver_name, driver_phone, order_type, payment_method, payment_status, sub_total, extra_value, tobacco_fee, vat_total, grand_total, total_after_discount, notes, discount_type, discount_value, discount_amount, coupon_code, coupon_mode, coupon_value, pay_cash_amount, pay_card_amount) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
          invoiceNo,
          orderNo,
          (p.created_by_user_id != null ? Number(p.created_by_user_id) : null),
          (p.created_by_username || null),
          (p.customer_id || null),
          snapName,
          snapPhone,
          snapVat,
          drvId,
          drvName,
          drvPhone,
          (p.order_type || null),
          p.payment_method,
          payStatus,
          Number(p.sub_total||0),
          (p.extra_value != null ? Number(p.extra_value) : null),
          (p.tobacco_fee != null ? Number(p.tobacco_fee) : null),
          Number(p.vat_total||0),
          Number(p.grand_total||0),
          (p.sub_after_discount != null ? Number(p.sub_after_discount) : null),
          p.notes || null,
          (p.discount_type || null),
          (p.discount_value != null ? Number(p.discount_value) : null),
          (p.discount_amount != null ? Number(p.discount_amount) : null),
          (p.coupon?.code || null),
          (p.coupon?.mode || null),
          (p.coupon?.value != null ? Number(p.coupon.value) : null),
          (p.pay_cash_amount != null ? Number(p.pay_cash_amount) : null),
          (p.pay_card_amount != null ? Number(p.pay_card_amount) : null)
        ]);
        const saleId = res.insertId;
        // تأكد من أعمدة العملية في جدول البنود
        const [colOpId] = await conn.query("SHOW COLUMNS FROM sales_items LIKE 'operation_id'");
        if(!colOpId.length){ await conn.query("ALTER TABLE sales_items ADD COLUMN operation_id INT NULL AFTER description"); }
        const [colOpName] = await conn.query("SHOW COLUMNS FROM sales_items LIKE 'operation_name'");
        if(!colOpName.length){ await conn.query("ALTER TABLE sales_items ADD COLUMN operation_name VARCHAR(128) NULL AFTER operation_id"); }
        const items = p.items.map(it => [ saleId, it.product_id, it.name, (it.description || null), (it.operation_id || null), (it.operation_name || null), Number(it.price||0), Number(it.qty||1), Number(it.line_total||0) ]);
        if(items.length){
          await conn.query(`INSERT INTO sales_items (sale_id, product_id, name, description, operation_id, operation_name, price, qty, line_total) VALUES ?`, [items]);
        }

        // خصم المخزون (المواد الخام) حسب BOM لكل منتج مع منع البيع إذا المكونات غير كافية
        const [bomList] = await conn.query('SELECT product_id, inventory_id, qty_per_unit FROM product_bom');
        // اجمع الاحتياج الإجمالي لكل عنصر مخزون عبر جميع المنتجات في الفاتورة
        const needs = new Map(); // inventory_id -> required qty
        const byProd = new Map();
        for(const b of bomList){ const arr = byProd.get(b.product_id) || []; arr.push(b); byProd.set(b.product_id, arr); }
        for(const it of p.items){
          const pid = Number(it.product_id); const qty = Math.max(1, Number(it.qty||1));
          const boms = byProd.get(pid) || [];
          for(const b of boms){
            const add = Number(b.qty_per_unit||0) * qty; if(add<=0) continue;
            needs.set(b.inventory_id, Number((needs.get(b.inventory_id)||0)) + add);
          }
        }
        // تحقق توفر كل المكونات مرة واحدة
        if(needs.size){
          const ids = Array.from(needs.keys());
          const placeholders = ids.map(()=>'?').join(',');
          const [invRows] = await conn.query(`SELECT id, name, unit, stock FROM inventory_items WHERE id IN (${placeholders}) FOR UPDATE`, ids);
          const byId = new Map(invRows.map(r => [Number(r.id), r]));
          const shortages = [];
          for(const id of ids){
            const need = Number(needs.get(id)||0);
            const r = byId.get(Number(id));
            const have = r ? Number(r.stock||0) : 0;
            if(!allowNegInv && have < need){
              shortages.push(`${r ? r.name : ('ID '+id)} (المتاح ${have.toFixed(3)} ${r?.unit||''} / المطلوب ${need.toFixed(3)} ${r?.unit||''})`);
            }
          }
          if(shortages.length){
            await conn.rollback();
            return { ok:false, error: `لا يمكن إتمام البيع لعدم كفاية مكونات المخزون:\n- ${shortages.join('\n- ')}` };
          }
          // خصم جميع المكونات (يسمح بالسالب إذا allowNegInv=1)
          for(const [id, need] of needs.entries()){
            await conn.query('UPDATE inventory_items SET stock = stock - ? WHERE id=?', [Number(need), Number(id)]);
          }
        }

        await conn.commit();
        // Notify all windows that sales changed (new invoice)
        try{
          const { BrowserWindow } = require('electron');
          BrowserWindow.getAllWindows().forEach(w => w.webContents.send('sales:changed', { action: 'created', sale_id: saleId, invoice_no: invoiceNo }));
        }catch(_){ }
        invalidateSaleCache(saleId);
        return { ok:true, invoice_no: invoiceNo, sale_id: saleId, order_no: Number(orderNo||null) || null };
      } catch (e) {
        try{ await conn.rollback(); }catch(_){ }
        throw e;
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل حفظ الفاتورة' }; }
  });

  // Municipality Report: Optimized query to fetch invoices with tobacco fees and their items in one go
  ipcMain.handle('sales:municipality_report', async (_e, query) => {
    const q = query || {};
    const params = [];
    const terms = [];
    
    // Date filter
    if(q.date_from){ terms.push('s.created_at >= CAST(? AS DATETIME)'); params.push(q.date_from); }
    if(q.date_to){ terms.push('s.created_at <= CAST(? AS DATETIME)'); params.push(q.date_to); }
    
    // Filter: include invoices and CN that have non-zero tobacco_fee
    terms.push('s.tobacco_fee <> 0');
    
    // Exclude CN if requested
    if(q.exclude_cn){
      terms.push("(s.doc_type IS NULL OR s.doc_type <> 'credit_note')");
      terms.push("s.invoice_no NOT LIKE 'CN-%'");
    }

    const where = terms.length ? ('WHERE ' + terms.join(' AND ')) : '';

    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        
        // 1. Fetch Invoices Summary
        const limit = q.limit ? Math.min(Math.max(1, Number(q.limit)), 50000) : 10000;
        const sqlInvoices = `
          SELECT 
            s.id, s.invoice_no, s.doc_type, s.payment_method, s.created_at, s.settled_at,
            s.sub_total, s.discount_amount, s.vat_total, s.tobacco_fee, s.grand_total
          FROM sales s
          ${where}
          ORDER BY s.created_at DESC
          LIMIT ${limit}
        `;
        const [invoices] = await conn.query(sqlInvoices, params);
        
        if(invoices.length === 0){
            return { ok: true, invoices: [], items: [], tobacco_summary: [] };
        }

        // 2. Fetch Items for these invoices
        const invoiceIds = invoices.map(i => i.id);
        const placeholders = invoiceIds.map(() => '?').join(',');
        
        // We need items to show details in the report
        // We also need to know category for tobacco summary. 
        // Assuming 'tobacco_fee' > 0 on invoice implies some items are tobacco, 
        // but usually we identify tobacco items by category or specific flag.
        // The original code used 'sales_items_detailed' with 'only_tobacco: true' for summary.
        // Here we fetch ALL items for the invoices to display the details table,
        // AND we can filter for tobacco summary in JS or separate query.
        
        // Optimization: Fetch all items for these invoices in one query
        const sqlItems = `
          SELECT 
            si.sale_id, si.name, si.operation_name, si.qty, si.price, si.line_total,
            p.category
          FROM sales_items si
          LEFT JOIN products p ON p.id = si.product_id
          WHERE si.sale_id IN (${placeholders})
        `;
        const [items] = await conn.query(sqlItems, invoiceIds);

        // 3. Calculate Totals in SQL (Optional, but we can do it in JS since we have all data now efficiently)
        // Let's return the raw data and let the renderer group it, but now it's efficient (2 queries instead of N+1)
        
        return { ok: true, invoices, items };

      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'تعذر تحميل تقرير البلدية' }; }
  });

  ipcMain.handle('sales:list', async (_e, query) => {
    if (isSecondaryDevice()) {
      return await fetchFromAPI('/invoices', query || {});
    }

    const q = query || {};
    const terms = [];
    const params = [];
    // filter by user if provided
    if(q.user_id){
      terms.push('s.created_by_user_id = ?');
      params.push(Number(q.user_id));
    }
    // extra customer_q filter (phone/name/tax) — search inside invoice snapshot and customers
    if(q.customer_q){
      const v = '%' + String(q.customer_q).trim() + '%';
      terms.push('(s.customer_phone LIKE ? OR s.customer_vat LIKE ? OR s.customer_name LIKE ? OR c.phone LIKE ? OR c.name LIKE ? OR c.vat_number LIKE ?)');
      params.push(v, v, v, v, v, v);
    }
    // backward-compat: explicit invoice_no filter
    if(q.invoice_no){
      terms.push('s.invoice_no LIKE ?');
      params.push('%' + q.invoice_no + '%');
    }
    // filter by document type if requested
    if(q.type === 'credit'){
      terms.push("s.doc_type='credit_note'");
    } else if(q.type === 'invoice'){
      terms.push("(s.doc_type IS NULL OR s.doc_type='invoice')");
    }
    // filter by customer id if provided
    if(q.customer_id){ terms.push('s.customer_id = ?'); params.push(Number(q.customer_id)); }
    // only customers: include invoices that have a customer linked (by id or name snapshot)
    if(q.customers_only){ terms.push('(s.customer_id IS NOT NULL OR s.customer_name IS NOT NULL)'); }
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTables(conn);

        // If free-text provided
        if(q.q){
          const toAsciiDigits = (s) => String(s||'').replace(/[\u0660-\u0669]/g, d => String(d.charCodeAt(0) - 0x0660)).replace(/[\u06F0-\u06F9]/g, d => String(d.charCodeAt(0) - 0x06F0));
          const raw = String(q.q).trim();
          const qstr = toAsciiDigits(raw);
          const digitsOnly = /^[0-9]+$/.test(qstr);
          if(digitsOnly){
            // Try invoice exact match first (but respect pagination if limit is set)
            const [exRows] = await conn.query('SELECT s.*, c.name AS disp_customer_name, c.phone AS disp_customer_phone FROM sales s LEFT JOIN customers c ON c.id = s.customer_id WHERE s.invoice_no = ? LIMIT 1', [qstr]);
            if(exRows.length){ return { ok:true, items: exRows, total: 1 }; }
            // numeric equality ignoring leading zeros
            const n = Number(qstr);
            if(!Number.isNaN(n)){
              const [exCast] = await conn.query('SELECT s.*, c.name AS disp_customer_name, c.phone AS disp_customer_phone FROM sales s LEFT JOIN customers c ON c.id = s.customer_id WHERE CAST(s.invoice_no AS UNSIGNED) = ? LIMIT 1', [n]);
              if(exCast.length){ return { ok:true, items: exCast, total: 1 }; }
            }
            // No invoice exact match -> fallback to fuzzy (to allow phone search by digits)
            const v = '%' + qstr + '%';
            terms.push('(s.invoice_no LIKE ? OR s.payment_method LIKE ? OR s.customer_name LIKE ? OR s.customer_phone LIKE ? OR s.customer_vat LIKE ? OR c.phone LIKE ? OR c.name LIKE ? OR c.vat_number LIKE ?)');
            params.push(v, v, v, v, v, v, v, v);
          } else {
            // Fuzzy across multiple fields (text search)
            const v = '%' + qstr + '%';
            terms.push('(s.invoice_no LIKE ? OR s.payment_method LIKE ? OR s.customer_name LIKE ? OR s.customer_phone LIKE ? OR s.customer_vat LIKE ? OR c.phone LIKE ? OR c.name LIKE ? OR c.vat_number LIKE ?)');
            params.push(v, v, v, v, v, v, v, v);
          }
        }

        // datetime filters (from/to). Accepts 'YYYY-MM-DD' or full 'YYYY-MM-DD HH:MM' formats
        // استخدم CAST لضمان المقارنة الصحيحة للتواريخ
        if(q.date_from){ terms.push('s.created_at >= CAST(? AS DATETIME)'); params.push(q.date_from); }
        if(q.date_to){ terms.push('s.created_at <= CAST(? AS DATETIME)'); params.push(q.date_to); }
        const where = terms.length ? ('WHERE ' + terms.join(' AND ')) : '';
        
        // Pagination support (increased limit for VPN performance)
        const limit = q.limit ? Math.min(Math.max(1, Number(q.limit)), 50000) : null;
        const offset = q.offset ? Math.max(0, Number(q.offset)) : 0;
        
        // Build main query
        const queryParams = [...params];
        let sql, rows, total = null;
        
        if(limit !== null){
          // استعلام منفصل للحصول على العدد الإجمالي (متوافق مع MySQL 5.x)
          const countSql = `SELECT COUNT(*) as total FROM sales s LEFT JOIN customers c ON c.id = s.customer_id ${where}`;
          const [[countRow]] = await conn.query(countSql, params);
          total = Number(countRow?.total || 0);
          
          // استعلام البيانات مع pagination
          sql = `SELECT s.*, c.name AS disp_customer_name, c.phone AS disp_customer_phone
                 FROM sales s LEFT JOIN customers c ON c.id = s.customer_id 
                 ${where} ORDER BY s.id DESC LIMIT ? OFFSET ?`;
          queryParams.push(limit, offset);
          [rows] = await conn.query(sql, queryParams);
        } else {
          // بدون pagination - الكود القديم
          sql = `SELECT s.*, c.name AS disp_customer_name, c.phone AS disp_customer_phone
                 FROM sales s LEFT JOIN customers c ON c.id = s.customer_id 
                 ${where} ORDER BY s.id DESC`;
          [rows] = await conn.query(sql, queryParams);
        }
        
        const result = { ok:true, items: rows };
        if(total !== null){
          result.total = total;
          result.limit = limit;
          result.offset = offset;
          result.hasMore = (offset + rows.length) < total;
        }
        
        return result;
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'تعذر تحميل الفواتير' }; }
  });

  // List invoices by user with optional date range and aggregation
  ipcMain.handle('sales:list_by_user', async (_e, query) => {
    const q = query || {};
    const params = [];
    const terms = [];
    // Optional filter by creator user id
    if(q.user_id){ terms.push('s.created_by_user_id = ?'); params.push(Number(q.user_id)); }
    // Normalize date-only inputs to full-day bounds
    const normFrom = q.date_from && /^\d{4}-\d{2}-\d{2}$/.test(q.date_from) ? (q.date_from + ' 00:00:00') : q.date_from;
    const normTo = q.date_to && /^\d{4}-\d{2}-\d{2}$/.test(q.date_to) ? (q.date_to + ' 23:59:59') : q.date_to;
    if(normFrom){ terms.push('s.created_at >= ?'); params.push(normFrom); }
    if(normTo){ terms.push('s.created_at <= ?'); params.push(normTo); }
    // Include invoices and credit notes
    terms.push("(s.doc_type IS NULL OR s.doc_type IN ('invoice','credit_note'))");
    const where = terms.length ? ('WHERE ' + terms.join(' AND ')) : '';
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTables(conn);
        // Detailed list
        const sqlItems = `SELECT s.id, s.invoice_no, s.created_at, s.doc_type, s.payment_method, s.payment_status,
                                 s.grand_total, s.total_after_discount, s.pay_cash_amount, s.pay_card_amount,
                                 s.created_by_user_id, s.created_by_username
                          FROM sales s ${where}
                          ORDER BY s.created_at DESC, s.id DESC
                          LIMIT 1000`;
        const [items] = await conn.query(sqlItems, params);
        // Aggregation by user
        const sqlAgg = `SELECT s.created_by_user_id, s.created_by_username,
                               COUNT(*) AS invoices_count,
                               SUM(CASE WHEN s.doc_type='credit_note' THEN 0 ELSE 1 END) AS normal_count,
                               SUM(s.grand_total) AS total_grand,
                               SUM(CASE WHEN s.doc_type='credit_note' THEN s.grand_total ELSE 0 END) AS total_credit_notes,
                               SUM(CASE WHEN s.doc_type='credit_note' THEN 0 ELSE s.grand_total END) AS total_invoices,
                               SUM(s.pay_cash_amount) AS total_cash,
                               SUM(s.pay_card_amount) AS total_card
                        FROM sales s ${where}
                        GROUP BY s.created_by_user_id, s.created_by_username
                        ORDER BY total_grand DESC`;
        const [summary] = await conn.query(sqlAgg, params);
        return { ok:true, items, summary };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'تعذر تحميل تقرير المستخدمين' }; }
  });
  
  // List credit invoices with filters
  // Mode: by default returns unpaid (credit) invoices. If q.settled_only=true, returns processed (paid) former-credit invoices filtered by settled_at.
  ipcMain.handle('sales:list_credit', async (_e, query) => {
    if (isSecondaryDevice()) {
      return await fetchFromAPI('/credit-invoices', query || {});
    }
    
    const q = query || {};
    const settledOnly = (q.settled_only === true || q.settled_only === 'true');
    const terms = ["s.doc_type='invoice'"];
    if(settledOnly){
      terms.push("s.payment_status='paid'");
      terms.push("s.settled_method IS NOT NULL");
    } else {
      terms.push("s.payment_method='credit'");
      terms.push("s.payment_status='unpaid'");
    }
    const params = [];
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTables(conn);

        // If free-text provided
        if(q.q){
          const toAsciiDigits = (s) => String(s||'').replace(/[\u0660-\u0669]/g, d => String(d.charCodeAt(0) - 0x0660)).replace(/[\u06F0-\u06F9]/g, d => String(d.charCodeAt(0) - 0x06F0));
          const raw = String(q.q).trim();
          const qstr = toAsciiDigits(raw);
          const digitsOnly = /^[0-9]+$/.test(qstr);
          const baseWhere = settledOnly ? "AND s.payment_status='paid' AND s.settled_method IS NOT NULL" : "AND s.payment_method='credit' AND s.payment_status='unpaid'";
          if(digitsOnly){
            // Try exact invoice within scope
            const [exRows] = await conn.query(`SELECT s.* FROM sales s WHERE s.invoice_no = ? ${baseWhere} LIMIT 1`, [qstr]);
            if(exRows.length){ return { ok:true, items: exRows, total: exRows.length, page: 1, pageSize: 1 }; }
            const n = Number(qstr);
            if(!Number.isNaN(n)){
              const [exCast] = await conn.query(`SELECT s.* FROM sales s WHERE CAST(s.invoice_no AS UNSIGNED) = ? ${baseWhere} LIMIT 1`, [n]);
              if(exCast.length){ return { ok:true, items: exCast, total: exCast.length, page: 1, pageSize: 1 }; }
            }
            // Fallback fuzzy
            const v = '%' + qstr + '%';
            terms.push('(s.invoice_no LIKE ? OR s.customer_name LIKE ? OR s.customer_phone LIKE ? OR s.customer_vat LIKE ?)');
            params.push(v, v, v, v);
          } else {
            const v = '%' + qstr + '%';
            terms.push('(s.invoice_no LIKE ? OR s.customer_name LIKE ? OR s.customer_phone LIKE ? OR s.customer_vat LIKE ?)');
            params.push(v, v, v, v);
          }
        }

        if(q.customer_q){
          const v2 = '%' + String(q.customer_q).trim() + '%';
          terms.push('(s.customer_phone LIKE ? OR s.customer_vat LIKE ? OR s.customer_name LIKE ?)');
          params.push(v2, v2, v2);
        }
        // Normalize date-only inputs to full-day bounds
        const normFrom = q.date_from && /^\d{4}-\d{2}-\d{2}$/.test(q.date_from) ? (q.date_from + ' 00:00:00') : q.date_from;
        const normTo = q.date_to && /^\d{4}-\d{2}-\d{2}$/.test(q.date_to) ? (q.date_to + ' 23:59:59') : q.date_to;
        if(settledOnly){
          if(normFrom){ terms.push('s.settled_at >= ?'); params.push(normFrom); }
          if(normTo){ terms.push('s.settled_at <= ?'); params.push(normTo); }
        } else {
          if(normFrom){ terms.push('s.created_at >= ?'); params.push(normFrom); }
          if(normTo){ terms.push('s.created_at <= ?'); params.push(normTo); }
        }
        const where = 'WHERE ' + terms.join(' AND ');

        // Pagination support
        const page = Math.max(1, Number(q.page)||1);
        const pageSize = Math.max(1, Math.min(10000, Number(q.pageSize)||20));
        const offset = (page-1)*pageSize;

        // Get total count
        const [countRows] = await conn.query(`SELECT COUNT(*) as cnt FROM sales s ${where}`, params);
        const total = (countRows && countRows[0] && countRows[0].cnt) ? Number(countRows[0].cnt) : 0;

        const sql = `SELECT s.* FROM sales s ${where} ORDER BY s.id DESC LIMIT ${pageSize} OFFSET ${offset}`;
        const [rows] = await conn.query(sql, params);
        return { ok:true, items: rows, total, page, pageSize };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'تعذر تحميل فواتير الآجل' }; }
  });

  // List credit notes (CN) with base invoice details within a date range
  ipcMain.handle('sales:list_credit_notes', async (_e, query) => {
    if (isSecondaryDevice()) {
      return await fetchFromAPI('/credit-notes', query || {});
    }

    const q = query || {};
    const terms = ["(s.doc_type='credit_note' OR s.invoice_no LIKE 'CN-%')"];
    const params = [];
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTables(conn);
        // check if ref_base_sale_id exists to enable base join
        let hasRef = true;
        try{
          const [cols] = await conn.query("SHOW COLUMNS FROM sales LIKE 'ref_base_sale_id'");
          hasRef = Array.isArray(cols) && cols.length > 0;
        }catch(_){ hasRef = false; }

        // Free-text search across CN and base (if available)
        if(q.q){
          const toAsciiDigits = (s) => String(s||'').replace(/[\u0660-\u0669]/g, d => String(d.charCodeAt(0) - 0x0660)).replace(/[\u06F0-\u06F9]/g, d => String(d.charCodeAt(0) - 0x06F0));
          const raw = String(q.q).trim();
          const qstr = toAsciiDigits(raw);
          const v = '%' + qstr + '%';
          if(hasRef){
            terms.push('(s.invoice_no LIKE ? OR s.customer_name LIKE ? OR s.customer_phone LIKE ? OR s.customer_vat LIKE ? OR base.invoice_no LIKE ? OR base.customer_name LIKE ? OR base.customer_phone LIKE ? OR base.customer_vat LIKE ?)');
            params.push(v, v, v, v, v, v, v, v);
          } else {
            terms.push('(s.invoice_no LIKE ? OR s.customer_name LIKE ? OR s.customer_phone LIKE ? OR s.customer_vat LIKE ?)');
            params.push(v, v, v, v);
          }
        }

        if(q.customer_q){
          const v2 = '%' + String(q.customer_q).trim() + '%';
          if(hasRef){
            terms.push('(s.customer_phone LIKE ? OR s.customer_vat LIKE ? OR s.customer_name LIKE ? OR base.customer_phone LIKE ? OR base.customer_vat LIKE ? OR base.customer_name LIKE ?)');
            params.push(v2, v2, v2, v2, v2, v2);
          } else {
            terms.push('(s.customer_phone LIKE ? OR s.customer_vat LIKE ? OR s.customer_name LIKE ?)');
            params.push(v2, v2, v2);
          }
        }

        // Date filters on CN creation time (reporting period)
        const normFrom = q.date_from && /^\d{4}-\d{2}-\d{2}$/.test(q.date_from) ? (q.date_from + ' 00:00:00') : q.date_from;
        const normTo = q.date_to && /^\d{4}-\d{2}-\d{2}$/.test(q.date_to) ? (q.date_to + ' 23:59:59') : q.date_to;
        if(normFrom){ terms.push('s.created_at >= ?'); params.push(normFrom); }
        if(normTo){ terms.push('s.created_at <= ?'); params.push(normTo); }

        const where = 'WHERE ' + terms.join(' AND ');
        const baseSelect = hasRef ? ", base.invoice_no AS base_invoice_no, base.created_at AS base_created_at, base.grand_total AS base_grand_total, base.id AS base_id" : ", NULL AS base_invoice_no, NULL AS base_created_at, NULL AS base_grand_total, NULL AS base_id";
        const join = hasRef ? 'LEFT JOIN sales base ON base.id = s.ref_base_sale_id' : '';
        const limit = q.limit ? Math.min(Math.max(1, Number(q.limit)), 50000) : 10000;
        const offset = q.offset ? Math.max(0, Number(q.offset)) : 0;
        const sql = `SELECT s.* ${baseSelect} FROM sales s ${join} ${where} ORDER BY s.id DESC LIMIT ${limit} OFFSET ${offset}`;
        const [rows] = await conn.query(sql, params);
        return { ok:true, items: rows };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'تعذر تحميل إشعارات الدائن' }; }
  });

  // Settle a credit invoice fully (convert to immediate method)
  ipcMain.handle('sales:settle_full', async (_e, payload) => {
    try{
      const p = payload || {}; const id = Number(p.sale_id||0);
      const method = String(p.method||'').toLowerCase();
      const okMethod = ['cash','card','tamara','tabby'].includes(method);
      if(!id){ return { ok:false, error:'رقم الفاتورة مفقود' }; }
      if(!okMethod){ return { ok:false, error:'طريقة سداد غير صالحة' }; }
      const cash = (method==='cash') ? Math.max(0, Number(p.cash||0)) : null;
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTables(conn);
        const [[sale]] = await conn.query('SELECT * FROM sales WHERE id=? LIMIT 1', [id]);
        if(!sale){ return { ok:false, error:'الفاتورة غير موجودة' }; }
        if(String(sale.payment_method).toLowerCase() !== 'credit'){ return { ok:false, error:'ليست فاتورة آجل' }; }
        if(String(sale.payment_status||'paid') === 'paid'){ return { ok:false, error:'الفاتورة مدفوعة مسبقًا' }; }
        // For CASH settlement, store amount in settled_cash. For CARD/Tamara/Tabby, set to NULL.
        // Update method and settlement info
        await conn.query('UPDATE sales SET payment_method=?, payment_status="paid", settled_at=NOW(), settled_method=?, settled_cash=? WHERE id=?', [method, method, (method==='cash'?cash:null), id]);
        // Also set split fields for simple methods to aid reports
        if(method==='cash'){
          await conn.query('UPDATE sales SET pay_cash_amount = grand_total, pay_card_amount = NULL WHERE id=?', [id]);
        } else if(method==='card' || method==='tamara' || method==='tabby'){
          await conn.query('UPDATE sales SET pay_cash_amount = NULL, pay_card_amount = grand_total WHERE id=?', [id]);
        }
        // Notify update
        try{
          const { BrowserWindow } = require('electron');
          BrowserWindow.getAllWindows().forEach(w => w.webContents.send('sales:changed', { action: 'settled', sale_id: id, method, cash: (cash||0) }));
        }catch(_){ }
        invalidateSaleCache(id);
        return { ok:true, sale_id: id, method, cash: (cash||0) };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'تعذر تسوية الفاتورة' }; }
  });

  ipcMain.handle('sales:get', async (_e, id) => {
    const sid = (id && id.id) ? id.id : id;
    if(!sid) return { ok:false, error:'معرّف مفقود' };
    const cacheKey = buildSaleCacheKey(sid);
    const cached = getCachedSale(cacheKey);
    if(cached){ return { ok:true, sale: cached.sale, items: cached.items }; }
    
    if (isSecondaryDevice()) {
      const data = await fetchFromAPI(`/invoices/${sid}`);
      if (data && data.ok && !data.sale){
        const sale = data.invoice || null;
        // Fix: استخدم data.invoice.items بدلاً من data.items لأن API يرجع المنتجات داخل invoice
        const items = Array.isArray(data.invoice?.items) ? data.invoice.items : (Array.isArray(data.items) ? data.items : []);
        setSaleCache(cacheKey, sale, items);
        return { ok:true, sale, items };
      }
      return data;
    }

    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTables(conn);
        // ensure driver columns exist
        const [colDrvId] = await conn.query("SHOW COLUMNS FROM sales LIKE 'driver_id'");
        if(!colDrvId.length){ await conn.query("ALTER TABLE sales ADD COLUMN driver_id INT NULL AFTER customer_vat"); }
        const [colDrvName] = await conn.query("SHOW COLUMNS FROM sales LIKE 'driver_name'");
        if(!colDrvName.length){ await conn.query("ALTER TABLE sales ADD COLUMN driver_name VARCHAR(255) NULL AFTER driver_id"); }
        const [colDrvPhone] = await conn.query("SHOW COLUMNS FROM sales LIKE 'driver_phone'");
        if(!colDrvPhone.length){ await conn.query("ALTER TABLE sales ADD COLUMN driver_phone VARCHAR(64) NULL AFTER driver_name"); }

        const [[sale]] = await conn.query('SELECT * FROM sales WHERE id=? LIMIT 1', [sid]);
        // backward-compat: if order_no is null and this is a normal invoice, try to infer a reasonable order_no from date bucket
        try{
          if(sale && (sale.order_no == null) && (String(sale.doc_type||'invoice') !== 'credit_note')){
            // derive closing hour
            let closing = '00:00';
            try{ const [[st]] = await conn.query('SELECT closing_hour FROM app_settings WHERE id=1'); if(st && st.closing_hour){ closing = String(st.closing_hour).slice(0,5); } }catch(_){ }
            const [hh, mm] = (closing||'00:00').split(':').map(v=>Number(v||0));
            const created = new Date(sale.created_at);
            const curStart = new Date(created); curStart.setHours(hh||0, mm||0, 0, 0);
            let dayStart = curStart; if(created < curStart){ dayStart = new Date(curStart); dayStart.setDate(curStart.getDate()-1); }
            // count number of invoices since that dayStart
            const y = dayStart.getFullYear(); const m = String(dayStart.getMonth()+1).padStart(2,'0'); const d = String(dayStart.getDate()).padStart(2,'0');
            const startStr = `${y}-${m}-${d} ${String(hh||0).toString().padStart(2,'0')}:${String(mm||0).toString().padStart(2,'0')}:00`;
            const [[cnt]] = await conn.query("SELECT COUNT(*) AS c FROM sales WHERE (doc_type IS NULL OR doc_type='invoice') AND created_at >= ? AND id <= ?", [startStr, Number(sid)]);
            const ord = Number(cnt?.c||0);
            if(ord > 0){ sale.order_no = ord; }
          }
        }catch(_){ }
        if(!sale) return { ok:false, error:'الفاتورة غير موجودة' };
        const [items] = await conn.query('SELECT si.*, p.is_tobacco, p.category FROM sales_items si LEFT JOIN products p ON p.id = si.product_id WHERE si.sale_id=?', [sid]);
        setSaleCache(cacheKey, sale, items);
        return { ok:true, sale, items };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'تعذر جلب الفاتورة' }; }
  });

  // Check if an invoice already has a credit note
  ipcMain.handle('sales:has_credit_for_invoice', async (_e, payload) => {
    try{
      const inv = String((payload && (payload.invoice_no||payload.no||payload.q)) || '').trim();
      if(!inv){ return { ok:false, error:'رقم الفاتورة مفقود' }; }
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTables(conn);
        // حاول المطابقة الدقيقة أولاً
        const [[sale]] = await conn.query('SELECT * FROM sales WHERE invoice_no = ? LIMIT 1', [inv]);
        if(!sale){ return { ok:false, error:'لم يتم العثور على الفاتورة' }; }
        const credit_unpaid = (String(sale.payment_method).toLowerCase()==='credit' && String(sale.payment_status||'paid')!=='paid');
        // افحص وجود إشعار دائن مرتبط بهذه الفاتورة
        const [[cn]] = await conn.query("SELECT id, invoice_no FROM sales WHERE doc_type='credit_note' AND ref_base_sale_id=? LIMIT 1", [Number(sale.id)]);
        if(cn){ return { ok:true, processed:true, credit_id: cn.id, credit_invoice_no: cn.invoice_no, base_id: sale.id, payment_method: sale.payment_method, payment_status: sale.payment_status, credit_unpaid }; }
        return { ok:true, processed:false, base_id: sale.id, payment_method: sale.payment_method, payment_status: sale.payment_status, credit_unpaid };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'فشل التحقق من حالة الفاتورة' }; }
  });

  // Summarize sold items (qty and amount) within a period
  ipcMain.handle('sales:items_summary', async (_e, query) => {
    const q = query || {};
    // Accept either date_from/date_to or from_at/to_at
    const from = q.date_from || q.from_at || null;
    const to = q.date_to || q.to_at || null;
    const terms = [];
    const params = [];
    if(from){ terms.push('s.created_at >= CAST(? AS DATETIME)'); params.push(from); }
    if(to){ terms.push('s.created_at <= CAST(? AS DATETIME)'); params.push(to); }
    // Treat NULL doc_type as 'invoice'
    terms.push("(s.doc_type IS NULL OR s.doc_type IN ('invoice','credit_note'))");
    const where = terms.length ? ('WHERE ' + terms.join(' AND ')) : '';
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTables(conn);
        const sql = `SELECT si.product_id, si.name, SUM(si.qty) AS qty_total, SUM(si.line_total) AS amount_total
                     FROM sales_items si INNER JOIN sales s ON s.id = si.sale_id
                     ${where}
                     GROUP BY si.product_id, si.name
                     ORDER BY SUM(si.qty) DESC`;
        const [rows] = await conn.query(sql, params);
        return { ok:true, items: rows };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'تعذر تجميع أصناف المبيعات' }; }
  });

  // Optimized period summary with aggregation (for reports - no need to fetch 50k invoices)
  ipcMain.handle('sales:period_summary', async (_e, query) => {
    if (isSecondaryDevice()) {
      return await fetchFromAPI('/period-summary', query || {});
    }
    
    const q = query || {};
    const from = q.date_from || null;
    const to = q.date_to || null;
    const params = [];
    const terms = [];
    
    if(from){ terms.push('s.created_at >= CAST(? AS DATETIME)'); params.push(from); }
    if(to){ terms.push('s.created_at <= CAST(? AS DATETIME)'); params.push(to); }
    
    const where = terms.length ? ('WHERE ' + terms.join(' AND ')) : '';
    
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTables(conn);
        
        // Aggregation query - gets summary instead of all invoices
        const sql = `
          SELECT 
            s.doc_type,
            s.payment_method,
            COUNT(*) as count,
            SUM(s.sub_total) as sub_total,
            SUM(s.vat_total) as vat_total,
            SUM(s.grand_total) as grand_total,
            SUM(s.discount_amount) as discount_amount,
            SUM(s.tobacco_fee) as tobacco_fee,
            SUM(s.pay_cash_amount) as pay_cash_amount,
            SUM(s.pay_card_amount) as pay_card_amount
          FROM sales s
          ${where}
          GROUP BY s.doc_type, s.payment_method
        `;
        
        const [summary] = await conn.query(sql, params);
        
        // Get sold items summary
        const itemsSql = `
          SELECT si.product_id, si.name, SUM(si.qty) AS qty_total, SUM(si.line_total) AS amount_total
          FROM sales_items si 
          INNER JOIN sales s ON s.id = si.sale_id
          ${where}
          GROUP BY si.product_id, si.name
          ORDER BY SUM(si.qty) DESC
        `;
        const [items] = await conn.query(itemsSql, params);
        
        // Get purchases summary
        const purchasesSql = `
          SELECT 
            id, name, purchase_date, amount, notes
          FROM purchases
          WHERE 1=1
          ${from ? 'AND purchase_date >= ?' : ''}
          ${to ? 'AND purchase_date <= ?' : ''}
          ORDER BY purchase_date DESC
        `;
        const purchasesParams = [];
        if(from) purchasesParams.push(from);
        if(to) purchasesParams.push(to);
        const [purchases] = await conn.query(purchasesSql, purchasesParams);
        
        return { 
          ok: true, 
          summary, 
          items, 
          purchases,
          period: { from, to }
        };
        
      } finally { conn.release(); }
    }catch(e){ 
      console.error('Period summary error:', e); 
      return { ok: false, error: 'تعذر تحميل ملخص الفترة' }; 
    }
  });

  // Detailed sold items within a period, with optional tobacco-only filter
  ipcMain.handle('sales:items_detailed', async (_e, query) => {
    const q = query || {};
    const from = q.date_from || q.from_at || null;
    const to = q.date_to || q.to_at || null;
    const onlyTobacco = !!q.only_tobacco;
    const terms = [];
    const params = [];
    if(from){ terms.push('s.created_at >= ?'); params.push(from); }
    if(to){ terms.push('s.created_at <= ?'); params.push(to); }
    terms.push("(s.doc_type IS NULL OR s.doc_type IN ('invoice','credit_note'))");
    if(onlyTobacco){ terms.push('(p.is_tobacco = 1)'); }
    const where = terms.length ? ('WHERE ' + terms.join(' AND ')) : '';
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTables(conn);
        const sql = `
          SELECT si.id, si.sale_id, s.invoice_no, s.created_at, s.doc_type, s.payment_method,
                 si.product_id, si.name, si.description, si.operation_name, si.price, si.qty, si.line_total,
                 p.category, p.is_tobacco
          FROM sales_items si
          INNER JOIN sales s ON s.id = si.sale_id
          LEFT JOIN products p ON p.id = si.product_id
          ${where}
          ORDER BY s.created_at DESC, s.id DESC, si.id ASC`;
        const [rows] = await conn.query(sql, params);
        return { ok:true, items: rows };
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'تعذر جلب تفصيل الأصناف' }; }
  });

  // Refund full invoice: restock and create negative sale entry (credit note)
  ipcMain.handle('sales:refund_full', async (_e, payload) => {
    const p = payload || {}; const id = Number(p.sale_id||0);
    if(!id) return { ok:false, error:'رقم الفاتورة مفقود' };
    try{
      const pool = await getPool();
      const conn = await pool.getConnection();
      try{
        await conn.query(`USE \`${DB_NAME}\``);
        await ensureTables(conn);
        await conn.beginTransaction();

        const [[sale]] = await conn.query('SELECT * FROM sales WHERE id=? FOR UPDATE', [id]);
        if(!sale){ await conn.rollback(); return { ok:false, error:'الفاتورة غير موجودة' }; }

        const [items] = await conn.query('SELECT * FROM sales_items WHERE sale_id=?', [id]);
        // أعد المخزون للمنتجات مع إرجاع مكونات BOM
        for(const it of items){
          await conn.query('UPDATE products SET stock = stock + ? WHERE id=?', [Number(it.qty||0), Number(it.product_id)]);
        }
        // استرجاع مكونات الـ BOM
        const [bomList] = await conn.query('SELECT product_id, inventory_id, qty_per_unit FROM product_bom');
        const byProd = new Map();
        for(const b of bomList){ const arr = byProd.get(b.product_id) || []; arr.push(b); byProd.set(b.product_id, arr); }
        const needs = new Map(); // inventory_id -> qty to add back
        for(const it of items){
          const pid = Number(it.product_id); const qty = Math.max(0, Number(it.qty||0));
          const boms = byProd.get(pid) || [];
          for(const b of boms){ const add = Number(b.qty_per_unit||0) * qty; if(add>0){ needs.set(b.inventory_id, Number((needs.get(b.inventory_id)||0)) + add); } }
        }
        if(needs.size){ for(const [iid, q] of needs.entries()){ await conn.query('UPDATE inventory_items SET stock = stock + ? WHERE id=?', [Number(q), Number(iid)]); } }

        // أنشئ قيد فاتورة سالبة كإشعار دائن
        // منع التكرار وربط الإشعار بالفاتورة الأساسية
        const [colRefId] = await conn.query("SHOW COLUMNS FROM sales LIKE 'ref_base_sale_id'");
        if(!colRefId.length){ await conn.query("ALTER TABLE sales ADD COLUMN ref_base_sale_id INT NULL AFTER doc_type"); }
        const [colRefNo] = await conn.query("SHOW COLUMNS FROM sales LIKE 'ref_base_invoice_no'");
        if(!colRefNo.length){ await conn.query("ALTER TABLE sales ADD COLUMN ref_base_invoice_no VARCHAR(32) NULL AFTER ref_base_sale_id"); }
        try{
          const [idx] = await conn.query("SHOW INDEX FROM sales WHERE Key_name='uniq_ref_base_sale'");
          if(!idx.length){ await conn.query("CREATE UNIQUE INDEX uniq_ref_base_sale ON sales (ref_base_sale_id)"); }
        }catch(_){ /* ignore index errors */ }
        const [[already]] = await conn.query("SELECT id FROM sales WHERE doc_type='credit_note' AND ref_base_sale_id=? LIMIT 1", [Number(sale.id||id)]);
        if(already){ await conn.rollback(); return { ok:false, error:'تم عمل معالجة لهذه الفاتورة من قبل' }; }
        // منع معالجة فاتورة آجل غير مسددة
        const isCreditUnpaid = (String(sale.payment_method).toLowerCase()==='credit' && String(sale.payment_status||'paid')!=='paid');
        if(isCreditUnpaid){ await conn.rollback(); return { ok:false, error:'هذه فاتورة آجل غير مسددة ولا يمكن عمل معالجة لها قبل السداد' }; }
        // تسلسل خاص بإشعارات الدائن يبدأ من 1
        const [[cnRow]] = await conn.query("SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_no, 4) AS UNSIGNED)), 0) AS max_no FROM sales WHERE doc_type='credit_note' AND invoice_no LIKE 'CN-%'");
        const cnNo = String(Number(cnRow?.max_no||0) + 1);
        // تأكد من الأعمدة الإضافية في sales
        const [colExtra] = await conn.query("SHOW COLUMNS FROM sales LIKE 'extra_value'"); if(!colExtra.length){ await conn.query("ALTER TABLE sales ADD COLUMN extra_value DECIMAL(12,2) NULL AFTER sub_total"); }
        const [colTob] = await conn.query("SHOW COLUMNS FROM sales LIKE 'tobacco_fee'"); if(!colTob.length){ await conn.query("ALTER TABLE sales ADD COLUMN tobacco_fee DECIMAL(12,2) NULL AFTER extra_value"); }
        const [colCouponCode] = await conn.query("SHOW COLUMNS FROM sales LIKE 'coupon_code'"); if(!colCouponCode.length){ await conn.query("ALTER TABLE sales ADD COLUMN coupon_code VARCHAR(64) NULL AFTER discount_amount"); }
        const [colCouponMode] = await conn.query("SHOW COLUMNS FROM sales LIKE 'coupon_mode'"); if(!colCouponMode.length){ await conn.query("ALTER TABLE sales ADD COLUMN coupon_mode VARCHAR(16) NULL AFTER coupon_code"); }
        const [colCouponVal] = await conn.query("SHOW COLUMNS FROM sales LIKE 'coupon_value'"); if(!colCouponVal.length){ await conn.query("ALTER TABLE sales ADD COLUMN coupon_value DECIMAL(12,2) NULL AFTER coupon_mode"); }
        const [colPayStat] = await conn.query("SHOW COLUMNS FROM sales LIKE 'payment_status'"); if(!colPayStat.length){ await conn.query("ALTER TABLE sales ADD COLUMN payment_status ENUM('unpaid','paid') NOT NULL DEFAULT 'paid' AFTER payment_method"); }
        const [colSetAt] = await conn.query("SHOW COLUMNS FROM sales LIKE 'settled_at'"); if(!colSetAt.length){ await conn.query("ALTER TABLE sales ADD COLUMN settled_at DATETIME NULL AFTER notes"); }
        const [colSetMeth] = await conn.query("SHOW COLUMNS FROM sales LIKE 'settled_method'"); if(!colSetMeth.length){ await conn.query("ALTER TABLE sales ADD COLUMN settled_method VARCHAR(32) NULL AFTER settled_at"); }

        // ضمان وجود حقل نوع المستند (فاتورة/إشعار دائن) لتقارير واضحة
        const [colDocType] = await conn.query("SHOW COLUMNS FROM sales LIKE 'doc_type'");
        if(!colDocType.length){ await conn.query("ALTER TABLE sales ADD COLUMN doc_type ENUM('invoice','credit_note') NOT NULL DEFAULT 'invoice' AFTER invoice_no"); }

        const [ins] = await conn.query(`INSERT INTO sales (invoice_no, doc_type, ref_base_sale_id, ref_base_invoice_no, customer_id, customer_name, customer_phone, customer_vat, payment_method, payment_status, sub_total, extra_value, tobacco_fee, vat_total, grand_total, total_after_discount, notes, discount_type, discount_value, discount_amount, coupon_code, coupon_mode, coupon_value, settled_at, settled_method, pay_cash_amount, pay_card_amount)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
          'CN-' + cnNo,
          'credit_note',
          Number(sale.id||id),
          String(sale.invoice_no||''),
          sale.customer_id, sale.customer_name, sale.customer_phone, sale.customer_vat,
          sale.payment_method, 'paid',
          -Number(sale.sub_total||0),
          (sale.extra_value!=null ? -Number(sale.extra_value||0) : null),
          (sale.tobacco_fee!=null ? -Number(sale.tobacco_fee||0) : null),
          -Number(sale.vat_total||0),
          -Number(sale.grand_total||0),
          (sale.total_after_discount!=null ? -Number(sale.total_after_discount||0) : null),
          null,
          sale.discount_type, (sale.discount_value!=null ? -Number(sale.discount_value||0) : null), (sale.discount_amount!=null ? -Number(sale.discount_amount||0) : null),
          sale.coupon_code||null, sale.coupon_mode||null, (sale.coupon_value!=null ? -Number(sale.coupon_value||0) : null),
          new Date(), 'refund',
          (sale.pay_cash_amount!=null ? -Number(sale.pay_cash_amount||0) : null),
          (sale.pay_card_amount!=null ? -Number(sale.pay_card_amount||0) : null)
        ]);
        const newId = ins.insertId;
        if(items.length){
          const rows = items.map(it => [ newId, it.product_id, it.name, (it.description||null), (it.operation_id||null), (it.operation_name||null), -Number(it.price||0), -Number(it.qty||0), -Number(it.line_total||0) ]);
          // تأكد من أعمدة العملية
          const [colOpId] = await conn.query("SHOW COLUMNS FROM sales_items LIKE 'operation_id'");
          if(!colOpId.length){ await conn.query("ALTER TABLE sales_items ADD COLUMN operation_id INT NULL AFTER description"); }
          const [colOpName] = await conn.query("SHOW COLUMNS FROM sales_items LIKE 'operation_name'");
          if(!colOpName.length){ await conn.query("ALTER TABLE sales_items ADD COLUMN operation_name VARCHAR(128) NULL AFTER operation_id"); }
          await conn.query('INSERT INTO sales_items (sale_id, product_id, name, description, operation_id, operation_name, price, qty, line_total) VALUES ?', [rows]);
        }

        await conn.commit();
        // Notify
        try{
          const { BrowserWindow } = require('electron');
          BrowserWindow.getAllWindows().forEach(w => w.webContents.send('sales:changed', { action: 'refunded', credit_sale_id: newId, base_sale_id: Number(sale.id||id) }));
        }catch(_){ }
        invalidateSaleCache(id);
        invalidateSaleCache(newId);
        return { ok:true, credit_sale_id: newId, base_sale_id: Number(sale.id||id), base_invoice_no: String(sale.invoice_no||''), base_payment_method: String(sale.payment_method||'') };
      } catch (e) {
        try{ await conn.rollback(); }catch(_){ }
        throw e;
      } finally { conn.release(); }
    }catch(e){ console.error(e); return { ok:false, error:'تعذر إنشاء إشعار دائن' }; }
  });

  // ZATCA Integration handlers
  ipcMain.handle('sales:zatca_generate', async (_e, saleData) => {
    try {
      const ZatcaSalesIntegration = require('./zatca-sales-integration');
      const zatcaIntegration = new ZatcaSalesIntegration();
      return await zatcaIntegration.generateZatcaInvoice(saleData);
    } catch (error) {
      console.error('خطأ في إنشاء فاتورة ZATCA:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('sales:zatca_submit', async (_e, invoiceData) => {
    try {
      const ZatcaSalesIntegration = require('./zatca-sales-integration');
      const zatcaIntegration = new ZatcaSalesIntegration();
      return await zatcaIntegration.submitZatcaInvoice(invoiceData);
    } catch (error) {
      console.error('خطأ في إرسال فاتورة ZATCA:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('sales:zatca_status', async () => {
    try {
      const ZatcaSalesIntegration = require('./zatca-sales-integration');
      const zatcaIntegration = new ZatcaSalesIntegration();
      return await zatcaIntegration.getZatcaStatus();
    } catch (error) {
      console.error('خطأ في قراءة حالة ZATCA:', error);
      return { enabled: false, configured: false, message: 'خطأ في النظام' };
    }
  });

  ipcMain.handle('sales:update_zatca_data', async (_e, payload) => {
    try {
      const { sale_id, zatca_data } = payload;
      if (!sale_id || !zatca_data) {
        return { success: false, message: 'بيانات ناقصة' };
      }

      const pool = await getPool();
      const conn = await pool.getConnection();
      try {
        await conn.query(`USE \`${DB_NAME}\``);
        
        await conn.query(`
          UPDATE sales 
          SET zatca_uuid = ?, zatca_hash = ?, zatca_qr = ?, zatca_submitted = NOW(), zatca_status = 'submitted'
          WHERE id = ?
        `, [
          zatca_data.uuid,
          zatca_data.invoiceHash,
          zatca_data.qrCode,
          sale_id
        ]);
        invalidateSaleCache(sale_id);
        return { success: true, message: 'تم تحديث بيانات ZATCA بنجاح' };
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('خطأ في تحديث بيانات ZATCA:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('sales:get_print_data', async (_e, payload) => {
    const saleId = (payload && payload.id) ? payload.id : payload;
    if(!saleId) return { ok:false, error:'معرّف مفقود' };

    // Secondary devices: use API endpoint for optimized performance
    if (isSecondaryDevice()) {
      try {
        const params = { roomId: payload.roomId };
        const queryString = payload.roomId ? `?roomId=${payload.roomId}` : '';
        const result = await fetchFromAPI(`/sales/${saleId}/print-data${queryString}`);
        return result;
      } catch (error) {
        console.error('Failed to fetch print data from API:', error);
        return { ok: false, error: 'تعذر جلب بيانات الطباعة من الخادم' };
      }
    }

    // Primary device: query local MySQL directly
    try {
      const pool = await getPool();
      const conn = await pool.getConnection();
      try {
        await conn.query(`USE \`${DB_NAME}\``);

        const [
          saleRows,
          [items],
          [[settings]]
        ] = await Promise.all([
          conn.query(`
            SELECT 
              s.*,
              c.id as cust_id, c.name as cust_name, c.phone as cust_phone, 
              c.address as cust_address, c.vat_number as cust_vat_number, c.email as cust_email,
              c.cr_number as cust_cr_number, c.national_address as cust_national_address,
              d.id as drv_id, d.name as drv_name, d.phone as drv_phone,
              u.id as usr_id, u.username as usr_username, u.full_name as usr_full_name,
              r.id as rm_id, r.name as rm_name, r.section as rm_section
            FROM sales s
            LEFT JOIN customers c ON c.id = s.customer_id
            LEFT JOIN drivers d ON d.id = s.driver_id
            LEFT JOIN users u ON u.id = s.created_by_user_id
            LEFT JOIN rooms r ON r.id = ?
            WHERE s.id = ?
            LIMIT 1
          `, [payload.roomId || null, saleId]),
          conn.query(
            'SELECT si.*, p.is_tobacco, p.category FROM sales_items si LEFT JOIN products p ON p.id = si.product_id WHERE si.sale_id=?',
            [saleId]
          ),
          conn.query('SELECT * FROM app_settings WHERE id=1 LIMIT 1')
        ]);

        const sale = (saleRows && saleRows[0]) ? saleRows[0][0] : null;
        if(!sale) return { ok:false, error:'الفاتورة غير موجودة' };

        let logo = null;
        if(settings && settings.logo_blob) {
          logo = {
            base64: settings.logo_blob.toString('base64'),
            mime: settings.logo_mime || 'image/png'
          };
        }

        let customer = null;
        if(sale.cust_id) {
          customer = {
            id: sale.cust_id,
            name: sale.cust_name,
            phone: sale.cust_phone,
            address: sale.cust_address,
            vat_number: sale.cust_vat_number,
            email: sale.cust_email,
            cr_number: sale.cust_cr_number,
            national_address: sale.cust_national_address
          };
          delete sale.cust_id;
          delete sale.cust_name;
          delete sale.cust_phone;
          delete sale.cust_address;
          delete sale.cust_vat_number;
          delete sale.cust_email;
          delete sale.cust_cr_number;
          delete sale.cust_national_address;
        }

        let driver = null;
        if(sale.drv_id) {
          driver = {
            id: sale.drv_id,
            name: sale.drv_name,
            phone: sale.drv_phone
          };
          delete sale.drv_id;
          delete sale.drv_name;
          delete sale.drv_phone;
        }

        let user = null;
        if(sale.usr_id) {
          user = {
            id: sale.usr_id,
            username: sale.usr_username,
            full_name: sale.usr_full_name
          };
          delete sale.usr_id;
          delete sale.usr_username;
          delete sale.usr_full_name;
        }

        let room = null;
        if(sale.rm_id) {
          room = {
            id: sale.rm_id,
            name: sale.rm_name,
            section: sale.rm_section
          };
          delete sale.rm_id;
          delete sale.rm_name;
          delete sale.rm_section;
        }

        return {
          ok: true,
          sale,
          items,
          settings: settings || {},
          logo,
          customer,
          driver,
          user,
          room
        };
      } finally {
        conn.release();
      }
    } catch(error) {
      console.error('Error fetching print data:', error);
      return { ok: false, error: 'تعذر جلب بيانات الطباعة' };
    }
  });
}

// eager ensure
(async () => {
  try{
    const pool = await getPool();
    const conn = await pool.getConnection();
    try{
      await conn.query(`USE \`${DB_NAME}\``);
      await conn.query(`
        CREATE TABLE IF NOT EXISTS sales (
          id INT AUTO_INCREMENT PRIMARY KEY,
          invoice_no VARCHAR(32) UNIQUE,
          order_no INT NULL,
          customer_id INT NULL,
          customer_name VARCHAR(255) NULL,
          payment_method VARCHAR(32) NOT NULL,
          sub_total DECIMAL(12,2) NOT NULL,
          extra_value DECIMAL(12,2) NULL,
          vat_total DECIMAL(12,2) NOT NULL,
          grand_total DECIMAL(12,2) NOT NULL,
          total_after_discount DECIMAL(12,2) NULL,
          discount_type VARCHAR(16) NULL,
          discount_value DECIMAL(12,2) NULL,
          discount_amount DECIMAL(12,2) NULL,
          notes VARCHAR(255) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Ensure discount columns
      const [colTad] = await conn.query("SHOW COLUMNS FROM sales LIKE 'total_after_discount'");
      if(!colTad.length){
        await conn.query("ALTER TABLE sales ADD COLUMN total_after_discount DECIMAL(12,2) NULL AFTER grand_total");
      } else {
        const col = colTad[0];
        if(String(col.Null).toUpperCase() === 'NO'){
          await conn.query("ALTER TABLE sales MODIFY total_after_discount DECIMAL(12,2) NULL");
        }
      }
      const [colDT] = await conn.query("SHOW COLUMNS FROM sales LIKE 'discount_type'");
      if(!colDT.length){ await conn.query("ALTER TABLE sales ADD COLUMN discount_type VARCHAR(16) NULL AFTER total_after_discount"); }
      const [colDV] = await conn.query("SHOW COLUMNS FROM sales LIKE 'discount_value'");
      if(!colDV.length){ await conn.query("ALTER TABLE sales ADD COLUMN discount_value DECIMAL(12,2) NULL AFTER discount_type"); }
      const [colDA] = await conn.query("SHOW COLUMNS FROM sales LIKE 'discount_amount'");
      if(!colDA.length){ await conn.query("ALTER TABLE sales ADD COLUMN discount_amount DECIMAL(12,2) NULL AFTER discount_value"); }

      await conn.query(`
        CREATE TABLE IF NOT EXISTS sales_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          sale_id INT NOT NULL,
          product_id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          description VARCHAR(255) NULL,
          price DECIMAL(12,2) NOT NULL,
          qty INT NOT NULL,
          line_total DECIMAL(12,2) NOT NULL,
          FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      // ترقية عمود الوصف إن لم يكن موجودًا
      const [colDesc] = await conn.query("SHOW COLUMNS FROM sales_items LIKE 'description'");
      if(!colDesc.length){
        await conn.query("ALTER TABLE sales_items ADD COLUMN description VARCHAR(255) NULL AFTER name");
      }

      // Renumber existing credit notes once to start from CN-1 sequentially
      try{
        // ensure app_settings and flag column exist
        await conn.query("CREATE TABLE IF NOT EXISTS app_settings (id INT PRIMARY KEY)");
        const [hasFlagCol] = await conn.query("SHOW COLUMNS FROM app_settings LIKE 'credit_notes_renumbered'");
        if(!hasFlagCol.length){ await conn.query("ALTER TABLE app_settings ADD COLUMN credit_notes_renumbered TINYINT NOT NULL DEFAULT 0"); }
        const [existsRow] = await conn.query("SELECT id FROM app_settings WHERE id=1");
        if(!existsRow.length){ await conn.query("INSERT INTO app_settings (id, credit_notes_renumbered) VALUES (1, 0) ON DUPLICATE KEY UPDATE id=VALUES(id)"); }
        const [[flag]] = await conn.query("SELECT credit_notes_renumbered AS f FROM app_settings WHERE id=1");
        if(Number(flag?.f||0) === 0){
          await conn.beginTransaction();
          const [cnRows] = await conn.query("SELECT id FROM sales WHERE doc_type='credit_note' AND invoice_no LIKE 'CN-%' ORDER BY created_at, id");
          // phase 1: set temporary unique values to avoid UNIQUE collisions
          for(const r of cnRows){ await conn.query("UPDATE sales SET invoice_no=? WHERE id=?", [ `CN-TMP-${r.id}`, r.id ]); }
          // phase 2: assign CN-1.. sequentially
          let n = 1; for(const r of cnRows){ await conn.query("UPDATE sales SET invoice_no=? WHERE id=?", [ `CN-${n++}`, r.id ]); }
          await conn.query("UPDATE app_settings SET credit_notes_renumbered=1 WHERE id=1");
          await conn.commit();
        }
      }catch(migErr){ try{ await conn.rollback(); }catch(_){} console.error('credit notes renumber migration failed', migErr); }
    } finally { conn.release(); }
  }catch(e){ console.error('sales:init ensure tables failed', e); }
})();

module.exports = { registerSalesIPC };