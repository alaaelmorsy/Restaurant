// Settings screen: read/save settings via IPC

// Language system
const __langKey = 'app_lang';
let __currentLang = {};
function __applyLang(lang){
  const base = (typeof lang==='string' ? lang.split('-')[0].toLowerCase() : 'ar');
  const isAr = (base==='ar');
  const t = {
    settings: isAr ? 'الإعدادات' : 'Settings',
    systemTitle: isAr ? 'نظام إدارة المطاعم' : 'Restaurant Management System',
    back: isAr ? 'رجوع' : 'Back',
    storeInfo: isAr ? 'معلومات المتجر الأساسية' : 'Basic Store Information',
    salesName: isAr ? 'اسم المبيعات' : 'Sales Name',
    salesNamePlaceholder: isAr ? 'الاسم القانوني المسجل' : 'Registered Legal Name',
    website: isAr ? 'الموقع الإلكتروني' : 'Website',
    companyLocation: isAr ? 'موقع الشركة (العنوان)' : 'Company Location (Address)',
    locationPlaceholder: isAr ? 'المدينة - الحي - الشارع' : 'City - District - Street',
    contactInfo: isAr ? 'معلومات الاتصال' : 'Contact Information',
    mobile: isAr ? 'الجوال' : 'Mobile',
    email: isAr ? 'الإيميل' : 'Email',
    reportSetup: isAr ? '📧 إعداد التقرير' : '📧 Report Setup',
    officialNumbers: isAr ? 'الأرقام الرسمية' : 'Official Numbers',
    commercialRegister: isAr ? 'رقم السجل التجاري' : 'Commercial Register No.',
    nationalNumber: isAr ? 'الرقم الوطني' : 'National Number',
    zatcaEnabled: isAr ? 'تفعيل الربط الإلكتروني مع الهيئة' : 'Enable ZATCA Integration',
    invoiceNotes: isAr ? 'ملاحظات الفاتورة' : 'Invoice Notes',
    footerNotes: isAr ? 'ملاحظات أسفل الفاتورة' : 'Invoice Footer Notes',
    footerPlaceholder: isAr ? 'مثال: سياسة الاسترجاع خلال 7 أيام...' : 'Example: Return policy within 7 days...',
    taxSettings: isAr ? 'إعدادات الضرائب' : 'Tax Settings',
    vatRate: isAr ? 'نسبة ضريبة القيمة المضافة (%)' : 'VAT Rate (%)',
    pricesIncludeVat: isAr ? 'الأسعار شاملة للضريبة' : 'Prices Include VAT',
    sellerVatNumber: isAr ? 'الرقم الضريبي للمبيعات' : 'Seller VAT Number',
    tobaccoSettings: isAr ? 'إعدادات رسوم التبغ' : 'Tobacco Fee Settings',
    tobaccoPercent: isAr ? 'نسبة رسوم التبغ (%)' : 'Tobacco Fee (%)',
    tobaccoMinFee: isAr ? 'الحد الأدنى لرسوم التبغ' : 'Min. Tobacco Fee',
    currencySettings: isAr ? 'إعدادات العملة' : 'Currency Settings',
    currencyCode: isAr ? 'رمز العملة' : 'Currency Code',
    currencySymbol: isAr ? 'رمز العملة' : 'Currency Symbol',
    symbolPosition: isAr ? 'موقع رمز العملة' : 'Symbol Position',
    after: isAr ? 'بعد' : 'After',
    before: isAr ? 'قبل' : 'Before',
    printSettings: isAr ? 'إعدادات الطباعة' : 'Print Settings',
    printCopies: isAr ? 'عدد النسخ' : 'Print Copies',
    showChange: isAr ? 'إظهار الباقي' : 'Show Change',
    silentPrint: isAr ? 'طباعة صامتة' : 'Silent Print',
    showItemDesc: isAr ? 'إظهار وصف الصنف' : 'Show Item Description',
    hideItemDesc: isAr ? 'إخفاء وصف الصنف' : 'Hide Item Description',
    defaultPayment: isAr ? 'طريقة الدفع الافتراضية' : 'Default Payment Method',
    defaultOrderType: isAr ? 'نوع الطلب الافتراضي' : 'Default Order Type',
    cash: isAr ? 'نقدي' : 'Cash',
    card: isAr ? 'شبكة' : 'Card',
    credit: isAr ? 'آجل' : 'Credit',
    margins: isAr ? 'الهوامش (ملم)' : 'Margins (mm)',
    rightMargin: isAr ? 'الهامش الأيمن' : 'Right Margin',
    leftMargin: isAr ? 'الهامش الأيسر' : 'Left Margin',
    inventorySettings: isAr ? 'إعدادات المخزون' : 'Inventory Settings',
    allowZeroStock: isAr ? 'السماح ببيع المنتجات بمخزون صفر' : 'Allow Zero Stock Sales',
    allowNegativeInventory: isAr ? 'السماح بالمخزون السالب' : 'Allow Negative Inventory',
    manualOpPrice: isAr ? 'إدخال سعر العملية يدوياً' : 'Manual Operation Price',
    lowStockThreshold: isAr ? 'حد التنبيه للمخزون المنخفض' : 'Low Stock Alert Threshold',
    lowStockEmail: isAr ? 'إرسال تنبيه المخزون بالإيميل' : 'Low Stock Email Alert',
    showLowStockAlerts: isAr ? 'إظهار تنبيهات المخزون المنخفض' : 'Show Low Stock Alerts',
    displaySettings: isAr ? 'إعدادات العرض' : 'Display Settings',
    hideProductImages: isAr ? 'إخفاء صور المنتجات' : 'Hide Product Images',
    separateDuplicates: isAr ? 'فصل الأصناف المكررة بالسلة' : 'Separate Duplicate Cart Items',
    closingHour: isAr ? 'ساعة الإقفال اليومي' : 'Daily Closing Hour',
    customerDisplay: isAr ? 'شاشة العميل' : 'Customer Display',
    enableCustomerDisplay: isAr ? 'تفعيل شاشة العميل' : 'Enable Customer Display',
    comPort: isAr ? 'منفذ COM' : 'COM Port',
    selectPort: isAr ? '-- اختر منفذ COM --' : '-- Select COM Port --',
    noPortsAvailable: isAr ? '-- لا توجد منافذ متاحة --' : '-- No Ports Available --',
    loadError: isAr ? '-- خطأ في التحميل --' : '-- Load Error --',
    whatsappSettings: isAr ? 'إعدادات WhatsApp' : 'WhatsApp Settings',
    whatsappAuto: isAr ? 'إرسال الفاتورة تلقائياً عبر WhatsApp' : 'Auto-send Invoice via WhatsApp',
    logoSettings: isAr ? 'إعدادات الشعار' : 'Logo Settings',
    chooseLogo: isAr ? 'اختيار شعار' : 'Choose Logo',
    removeLogo: isAr ? 'حذف الشعار' : 'Remove Logo',
    logoWidth: isAr ? 'عرض الشعار (px)' : 'Logo Width (px)',
    logoHeight: isAr ? 'ارتفاع الشعار (px)' : 'Logo Height (px)',
    defaultProductImage: isAr ? 'الصورة الافتراضية للمنتجات' : 'Default Product Image',
    chooseImage: isAr ? 'اختيار صورة' : 'Choose Image',
    removeImage: isAr ? 'حذف الصورة' : 'Remove Image',
    save: isAr ? '💾 حفظ الإعدادات' : '💾 Save Settings',
    reload: isAr ? '🔄 إعادة تحميل' : '🔄 Reload',
    dailyReportEmail: isAr ? 'إرسال التقرير اليومي بالإيميل' : 'Daily Report Email',
    enableDailyReport: isAr ? 'تفعيل إرسال التقرير اليومي تلقائياً' : 'Enable Auto Daily Report',
    reportTime: isAr ? 'وقت الإرسال' : 'Send Time',
    sendNow: isAr ? '📧 إرسال الآن' : '📧 Send Now',
    enableBackup: isAr ? 'تفعيل إرسال نسخة قاعدة البيانات يومياً' : 'Enable Daily Database Backup',
    backupTime: isAr ? 'وقت النسخ الاحتياطي' : 'Backup Time',
    sendBackup: isAr ? '📦 إرسال الآن' : '📦 Send Now',
    saveBackup: isAr ? '💾 حفظ نسخة' : '💾 Save Backup',
    emailSettings: isAr ? 'إعدادات البريد الإلكتروني' : 'Email Settings',
    senderEmail: isAr ? '📧 البريد الإلكتروني المرسل' : '📧 Sender Email',
    appPassword: isAr ? '🔑 كلمة مرور التطبيق' : '🔑 App Password',
    appPasswordPlaceholder: isAr ? 'كلمة مرور التطبيق من Gmail' : 'Gmail App Password',
    smtpHost: isAr ? '🌐 خادم البريد' : '🌐 SMTP Host',
    smtpPort: isAr ? '🔌 المنفذ' : '🔌 Port',
    useSSL: isAr ? '🔒 استخدام SSL/TLS' : '🔒 Use SSL/TLS',
    cancel: isAr ? '❌ إلغاء' : '❌ Cancel',
    saveEmailSettings: isAr ? '✅ حفظ الإعدادات' : '✅ Save Settings',
    systemRecovery: isAr ? 'استعادة النظام' : 'System Recovery',
    resetSales: isAr ? '🔄 إعادة تعيين المبيعات' : '🔄 Reset Sales',
    resetProducts: isAr ? '🔄 إعادة تعيين المنتجات' : '🔄 Reset Products',
    resetCustomers: isAr ? '🔄 إعادة تعيين العملاء' : '🔄 Reset Customers',
    resetPurchases: isAr ? '🔄 إعادة تعيين المشتريات' : '🔄 Reset Purchases',
  };
  
  __currentLang = t;
  
  document.documentElement.lang = isAr ? 'ar' : 'en';
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  
  document.title = t.settings;
  
  const brandText = document.querySelector('.brand > div > div:first-child');
  if(brandText) brandText.textContent = t.settings;
  
  const brandDesc = document.querySelector('.brand .section-desc');
  if(brandDesc) brandDesc.textContent = t.systemTitle;
  
  const btnBack = document.querySelector('nav .btn.back');
  if(btnBack) btnBack.textContent = t.back;
  
  const h3Elements = document.querySelectorAll('h3');
  h3Elements.forEach(h3 => {
    const text = h3.textContent.trim();
    if(text.includes('معلومات المتجر الأساسية')) h3.textContent = t.storeInfo;
    else if(text.includes('معلومات الاتصال')) h3.textContent = t.contactInfo;
    else if(text.includes('الأرقام الرسمية')) h3.textContent = t.officialNumbers;
    else if(text.includes('ملاحظات الفاتورة')) h3.textContent = t.invoiceNotes;
    else if(text.includes('إعدادات الضرائب')) h3.textContent = t.taxSettings;
    else if(text.includes('إعدادات رسوم التبغ')) h3.textContent = t.tobaccoSettings;
    else if(text.includes('إعدادات العملة')) h3.textContent = t.currencySettings;
    else if(text.includes('إعدادات الطباعة')) h3.textContent = t.printSettings;
    else if(text.includes('إعدادات المخزون')) h3.textContent = t.inventorySettings;
    else if(text.includes('إعدادات العرض')) h3.textContent = t.displaySettings;
    else if(text.includes('شاشة العميل')) h3.textContent = t.customerDisplay;
    else if(text.includes('إعدادات WhatsApp')) h3.textContent = t.whatsappSettings;
    else if(text.includes('إعدادات الشعار')) h3.textContent = t.logoSettings;
    else if(text.includes('الصورة الافتراضية للمنتجات')) h3.textContent = t.defaultProductImage;
    else if(text.includes('استعادة النظام')) h3.textContent = t.systemRecovery;
  });
  
  const labels = document.querySelectorAll('label');
  labels.forEach(label => {
    const forAttr = label.getAttribute('for');
    const text = label.textContent.trim();
    
    if(forAttr === 'f_seller_legal' || text.includes('اسم المبيعات')) label.textContent = t.salesName;
    else if(forAttr === 'f_company_site' || text.includes('الموقع الإلكتروني')) label.textContent = t.website;
    else if(forAttr === 'f_company_location' || text.includes('موقع الشركة')) label.textContent = t.companyLocation;
    else if(forAttr === 'f_mobile' || text.includes('الجوال')) label.textContent = t.mobile;
    else if(forAttr === 'f_email' || text.includes('الإيميل')) label.textContent = t.email;
    else if(forAttr === 'f_commercial_register' || text.includes('رقم السجل التجاري')) label.textContent = t.commercialRegister;
    else if(forAttr === 'f_national_number' || text.includes('الرقم الوطني')) label.textContent = t.nationalNumber;
    else if(forAttr === 'f_zatca_enabled') label.textContent = t.zatcaEnabled;
    else if(forAttr === 'f_invoice_footer_note') label.textContent = t.footerNotes;
    else if(forAttr === 'f_vat' || text.includes('نسبة ضريبة')) label.textContent = t.vatRate;
    else if(forAttr === 'f_prices_inc') label.textContent = t.pricesIncludeVat;
    else if(forAttr === 'f_seller_vat') label.textContent = t.sellerVatNumber;
    else if(forAttr === 'f_tobacco_percent') label.textContent = t.tobaccoPercent;
    else if(forAttr === 'f_tobacco_min_fee') label.textContent = t.tobaccoMinFee;
    else if(forAttr === 'f_currency_code') label.textContent = t.currencyCode;
    else if(forAttr === 'f_currency_symbol') label.textContent = t.currencySymbol;
    else if(forAttr === 'f_currency_pos') label.textContent = t.symbolPosition;
    else if(forAttr === 'f_print_copies') label.textContent = t.printCopies;
    else if(forAttr === 'f_show_change') label.textContent = t.showChange;
    else if(forAttr === 'f_silent_print') label.textContent = t.silentPrint;
    else if(forAttr === 'f_show_item_desc') label.textContent = t.showItemDesc;
    else if(forAttr === 'f_hide_item_description') label.textContent = t.hideItemDesc;
    else if(forAttr === 'f_default_payment') label.textContent = t.defaultPayment;
    else if(forAttr === 'f_default_order_type') label.textContent = t.defaultOrderType;
    else if(forAttr === 'f_print_margin_right_mm') label.textContent = t.rightMargin;
    else if(forAttr === 'f_print_margin_left_mm') label.textContent = t.leftMargin;
    else if(forAttr === 'f_allow_zero_stock') label.textContent = t.allowZeroStock;
    else if(forAttr === 'f_allow_negative_inventory') label.textContent = t.allowNegativeInventory;
    else if(forAttr === 'f_op_price_manual') label.textContent = t.manualOpPrice;
    else if(forAttr === 'f_low_stock_threshold') label.textContent = t.lowStockThreshold;
    else if(forAttr === 'f_low_stock_email_enabled') label.textContent = t.lowStockEmail;
    else if(forAttr === 'f_show_low_stock_alerts') label.textContent = t.showLowStockAlerts;
    else if(forAttr === 'f_hide_product_images') label.textContent = t.hideProductImages;
    else if(forAttr === 'f_cart_separate_duplicate_lines') label.textContent = t.separateDuplicates;
    else if(forAttr === 'f_closing_hour') label.textContent = t.closingHour;
    else if(forAttr === 'f_customer_display_enabled') label.textContent = t.enableCustomerDisplay;
    else if(forAttr === 'f_customer_display_port') label.textContent = t.comPort;
    else if(forAttr === 'f_whatsapp_auto') label.textContent = t.whatsappAuto;
    else if(forAttr === 'f_logo_w') label.textContent = t.logoWidth;
    else if(forAttr === 'f_logo_h') label.textContent = t.logoHeight;
    else if(forAttr === 'em_enabled') label.textContent = t.enableDailyReport;
    else if(forAttr === 'bk_enabled') label.textContent = t.enableBackup;
    else if(forAttr === 'em_user') label.textContent = t.senderEmail;
    else if(forAttr === 'em_pass') label.textContent = t.appPassword;
    else if(forAttr === 'em_host') label.textContent = t.smtpHost;
    else if(forAttr === 'em_port') label.textContent = t.smtpPort;
    else if(forAttr === 'em_secure') label.textContent = t.useSSL;
  });
  
  const btnDailyEmail = document.getElementById('btnDailyEmail');
  if(btnDailyEmail) btnDailyEmail.textContent = t.reportSetup;
  
  const btnSendDaily = document.getElementById('em_send_daily');
  if(btnSendDaily) btnSendDaily.textContent = t.sendNow;
  
  const btnSendBackup = document.getElementById('em_send_backup');
  if(btnSendBackup) btnSendBackup.textContent = t.sendBackup;
  
  const btnSaveBackup = document.getElementById('save_backup_file');
  if(btnSaveBackup) btnSaveBackup.textContent = t.saveBackup;
  
  const pickLogo = document.getElementById('pickLogo');
  if(pickLogo) pickLogo.textContent = t.chooseLogo;
  
  const removeLogo = document.getElementById('removeLogo');
  if(removeLogo) removeLogo.textContent = t.removeLogo;
  
  const pickDefProdImg = document.getElementById('pickDefProdImg');
  if(pickDefProdImg) pickDefProdImg.textContent = t.chooseImage;
  
  const removeDefProdImg = document.getElementById('removeDefProdImg');
  if(removeDefProdImg) removeDefProdImg.textContent = t.removeImage;
  
  const saveBtn = document.getElementById('saveBtn');
  if(saveBtn) saveBtn.textContent = t.save;
  
  const emCancel = document.getElementById('em_cancel');
  if(emCancel) emCancel.textContent = t.cancel;
  
  const emSave = document.getElementById('em_save');
  if(emSave) emSave.textContent = t.saveEmailSettings;
  
  const btnResetSales = document.getElementById('btnResetSales');
  if(btnResetSales) btnResetSales.textContent = t.resetSales;
  
  const btnResetProducts = document.getElementById('btnResetProducts');
  if(btnResetProducts) btnResetProducts.textContent = t.resetProducts;
  
  const btnResetCustomers = document.getElementById('btnResetCustomers');
  if(btnResetCustomers) btnResetCustomers.textContent = t.resetCustomers;
  
  const btnResetPurchases = document.getElementById('btnResetPurchases');
  if(btnResetPurchases) btnResetPurchases.textContent = t.resetPurchases;
  
  try{ localStorage.setItem(__langKey, base); }catch(_){ }
}

(function initLang(){
  (async ()=>{
    try{
      const r = await window.api.app_get_locale();
      const L = (r && r.lang) || 'ar';
      __applyLang(L);
    }catch(_){
      __applyLang('ar');
    }
  })();
  try{
    window.api.app_on_locale_changed((L)=>{
      __applyLang(L);
    });
  }catch(_){ }
})();

try{ window.api && window.api.app_on_locale_changed && window.api.app_on_locale_changed((L)=>{ try{ window.__i18n_burst && window.__i18n_burst(L); }catch(_){ } }); }catch(_){ }
const errorDiv = document.getElementById('error');
const okDiv = document.getElementById('ok');

// const fCompanyName = document.getElementById('f_company_name'); // removed from UI
const fCompanySite = document.getElementById('f_company_site');
const fMobile = document.getElementById('f_mobile');
const fEmail = document.getElementById('f_email');
const fCommercialRegister = document.getElementById('f_commercial_register');
const fNationalNumber = document.getElementById('f_national_number');
const fVat = document.getElementById('f_vat');
const fPricesInc = document.getElementById('f_prices_inc');
const fOpPriceManual = document.getElementById('f_op_price_manual');
const fAllowZeroStock = document.getElementById('f_allow_zero_stock');
const fAllowNegativeInventory = document.getElementById('f_allow_negative_inventory');
// Tobacco fee controls
const fTobaccoPercent = document.getElementById('f_tobacco_percent');

const fTobaccoMinFee = document.getElementById('f_tobacco_min_fee');

const fCompanyLocation = document.getElementById('f_company_location');
const fCurrencyCode = document.getElementById('f_currency_code');
const fCurrencySymbol = document.getElementById('f_currency_symbol');
const fCurrencyPos = document.getElementById('f_currency_pos');
// const fPrintFormat = null; // removed from UI
const fPrintCopies = document.getElementById('f_print_copies');
const fShowChange = document.getElementById('f_show_change');
const fSilentPrint = document.getElementById('f_silent_print');
const fShowItemDesc = document.getElementById('f_show_item_desc');
const fDefaultPayment = document.getElementById('f_default_payment');
const fDefaultOrderType = document.getElementById('f_default_order_type');
const fSellerLegal = document.getElementById('f_seller_legal');
const fSellerVat = document.getElementById('f_seller_vat');
const fPrintMarginRight = document.getElementById('f_print_margin_right_mm');
const fPrintMarginLeft = document.getElementById('f_print_margin_left_mm');
const fHideProductImages = document.getElementById('f_hide_product_images');
const fCartSeparateDup = document.getElementById('f_cart_separate_duplicate_lines');
const fHideItemDescription = document.getElementById('f_hide_item_description');
const fClosingHour = document.getElementById('f_closing_hour');
// WhatsApp auto-send checkbox
const fWhatsAuto = document.getElementById('f_whatsapp_auto');
const fZatcaEnabled = document.getElementById('f_zatca_enabled');
// Low stock email control
const fLowStockEmailEnabled = document.getElementById('f_low_stock_email_enabled');
// Show/hide low-stock alerts on sales screen
const fShowLowStockAlerts = document.getElementById('f_show_low_stock_alerts');
// Customer Display controls
const fCustomerDisplayEnabled = document.getElementById('f_customer_display_enabled');
const fCustomerDisplayPort = document.getElementById('f_customer_display_port');

const pickLogo = document.getElementById('pickLogo');
const removeLogo = document.getElementById('removeLogo');
const logoPreview = document.getElementById('logoPreview');
const fLogoW = document.getElementById('f_logo_w');
const fLogoH = document.getElementById('f_logo_h');
// Default product image controls
const pickDefProdImg = document.getElementById('pickDefProdImg');
const removeDefProdImg = document.getElementById('removeDefProdImg');
const defProdImgPreview = document.getElementById('defProdImgPreview');

const saveBtn = document.getElementById('saveBtn');
const reloadBtn = document.getElementById('reloadBtn'); // removed from UI
// Daily email modal controls
const btnDailyEmail = document.getElementById('btnDailyEmail');
const dailyEmailDlg = document.getElementById('dailyEmailDlg');
const emEnabled = document.getElementById('em_enabled');
const emTime = document.getElementById('em_time');
const emHost = document.getElementById('em_host');
const emPort = document.getElementById('em_port');
const emSecure = document.getElementById('em_secure');
const emUser = document.getElementById('em_user');
const emPass = document.getElementById('em_pass');
const emCancel = document.getElementById('em_cancel');
const emSave = document.getElementById('em_save');

// Backup DB modal controls
const btnBackupEmail = document.getElementById('btnBackupEmail');
const backupEmailDlg = document.getElementById('backupEmailDlg');
const bkTo = document.getElementById('bk_to');
const bkCancel = document.getElementById('bk_cancel');
const bkSend = document.getElementById('bk_send');
// DB backup schedule controls
const bkEnabled = document.getElementById('bk_enabled');
const bkTime = document.getElementById('bk_time');

// Permissions
let __perms = null; // null until loaded

function canSet(k){
  // While permissions are loading, allow showing controls by default
  return (__perms ? __perms.has(k) : true);
}

function applyPerms(){
  try{
    const sb = document.getElementById('saveBtn');
    const rb = document.getElementById('reloadBtn');
    const btnRestore = document.getElementById('btnSystemRestore');
    const recoverySection = document.getElementById('recoverySection');
    const currentUser = JSON.parse(localStorage.getItem('pos_user') || 'null');
    const isSuperAdmin = currentUser && currentUser.username === 'superAdmin';
    const params = new URLSearchParams(location.search);
    const unlockParam = params.get('unlock') === 'restore2025';
    
    if(sb) sb.style.display = (isSuperAdmin || canSet('settings.update')) ? '' : 'none';
    if(rb) rb.style.display = (isSuperAdmin || canSet('settings.reload')) ? '' : 'none';
    if(btnRestore){
      const hasAnyResetPerm = canSet('settings.reset_sales') || 
                              canSet('settings.reset_products') || 
                              canSet('settings.reset_customers') ||
                              canSet('settings.reset_purchases');
      btnRestore.style.display = (isSuperAdmin || hasAnyResetPerm) ? '' : 'none';
    }
    if(recoverySection){
      if(isSuperAdmin || unlockParam){
        recoverySection.style.display = 'block';
      }
    }
  }catch(_){ }
}

// Load permissions then apply
(async()=>{
  try{
    const u=JSON.parse(localStorage.getItem('pos_user')||'null');
    if(u&&u.id){
      const r=await window.api.perms_get_for_user(u.id);
      if(r&&r.ok){ __perms=new Set(r.keys||[]); }
    }
  }catch(_){ __perms=null; }
  finally{ applyPerms(); }
})();

// Apply initial state (visible by default)
applyPerms();
const fInvoiceFooterNote = document.getElementById('f_invoice_footer_note');

// Recovery controls (visibility now handled in applyPerms() function)
const btnResetSales = document.getElementById('btnResetSales');
const btnResetProducts = document.getElementById('btnResetProducts');
const btnResetCustomers = document.getElementById('btnResetCustomers');

let logoPath = null; // legacy relative path stored in DB (fallback)
let logoBlobBase64 = null; // in-memory base64 selected by user (<=1MB)
let logoMime = null;
let logoRemoved = false; // explicit user intent to remove logo
// Default product image (in-memory) state
let defProdImgBase64 = null;
let defProdImgMime = null;
let defProdImgRemoved = false;

function setError(msg){ errorDiv.textContent = msg || ''; }
function setOk(show){
  okDiv.style.display = show ? 'block' : 'none';
  if(show){ setTimeout(()=>{ okDiv.style.display='none'; }, 2000); }
}

async function loadAvailablePorts(){
  if(!fCustomerDisplayPort) return;
  try{
    const result = await window.api.invoke('customer-display:list-ports');
    if(result.success && result.ports){
      const currentValue = fCustomerDisplayPort.value;
      fCustomerDisplayPort.innerHTML = '';
      
      if(result.ports.length === 0){
        fCustomerDisplayPort.innerHTML = '<option value="">-- لا توجد منافذ متاحة --</option>';
      }else{
        fCustomerDisplayPort.innerHTML = '<option value="">-- اختر منفذ COM --</option>';
        result.ports.forEach(port => {
          const option = document.createElement('option');
          option.value = port.path;
          option.textContent = port.path + (port.manufacturer ? ` (${port.manufacturer})` : '');
          fCustomerDisplayPort.appendChild(option);
        });
      }
      
      if(currentValue && result.ports.some(p => p.path === currentValue)){
        fCustomerDisplayPort.value = currentValue;
      }
    }
  }catch(err){
    console.error('Failed to load ports:', err);
    fCustomerDisplayPort.innerHTML = '<option value="">-- خطأ في التحميل --</option>';
  }
}

async function loadSettings(){
  setError(''); setOk(false);
  const r = await window.api.settings_get();
  if(!r.ok){ setError(r.error || 'تعذر تحميل الإعدادات'); return; }
  const s = r.item || {};
  // fCompanyName removed: show legal name at the top instead
  fCompanySite.value = s.company_site || '';
  fCompanyLocation.value = s.company_location || '';
  fMobile.value = s.mobile || '';
  fEmail.value = s.email || '';
  if(fMenuUrl) fMenuUrl.value = s.menu_url || '';
  fVat.value = (s.vat_percent ?? 15);
  fPricesInc.checked = !!s.prices_include_vat;
  // New fields
  if(fCommercialRegister) fCommercialRegister.value = s.commercial_register || '';
  if(fNationalNumber) fNationalNumber.value = s.national_number || '';
  // Tobacco settings defaults
  if(fTobaccoPercent) fTobaccoPercent.value = String(Number(s.tobacco_fee_percent ?? 100));
  if(fTobaccoMinFee) fTobaccoMinFee.value = String(Number(s.tobacco_min_fee_amount ?? 25));
  fCurrencyCode.value = s.currency_code || 'SAR';
  fCurrencySymbol.value = s.currency_symbol || '﷼';
  fCurrencyPos.value = s.currency_symbol_position || 'after';
  // default_print_format removed from UI (thermal is enforced globally)
  fPrintCopies.value = String(Number(s.print_copies || (s.print_two_copies ? 2 : 1)));
  fShowChange.checked = s.print_show_change !== 0;
  fSilentPrint.checked = !!s.silent_print;
  if(fShowItemDesc){
    fShowItemDesc.checked = s.show_item_desc !== 0;
  }
  fDefaultPayment.value = s.default_payment_method || '';
  if(fDefaultOrderType) fDefaultOrderType.value = s.default_order_type || '';
  fSellerLegal.value = s.seller_legal_name || '';
  fSellerVat.value = s.seller_vat_number || '';
  if(fPrintMarginRight) fPrintMarginRight.value = (s.print_margin_right_mm ?? '');
  if(fPrintMarginLeft) fPrintMarginLeft.value = (s.print_margin_left_mm ?? '');
  fOpPriceManual.checked = !!s.op_price_manual;
  fAllowZeroStock.checked = !!s.allow_sell_zero_stock;
  fAllowNegativeInventory.checked = !!s.allow_negative_inventory;
  if (fHideProductImages) fHideProductImages.checked = !!s.hide_product_images;
  if (fHideItemDescription) fHideItemDescription.checked = !!s.hide_item_description;
  if (fClosingHour) fClosingHour.value = s.closing_hour || '';
  // Low stock threshold
  try{
    const fLow = document.getElementById('f_low_stock_threshold');
    if(fLow){ fLow.value = String(Number(s.low_stock_threshold ?? 5)); }
  }catch(_){ }
  // Low stock email control
  try{
    if(fLowStockEmailEnabled) fLowStockEmailEnabled.checked = !!s.low_stock_email_enabled;
  }catch(_){ }
  // Show/hide low-stock alerts on sales screen (default true)
  try{
    if(fShowLowStockAlerts) fShowLowStockAlerts.checked = (typeof s.show_low_stock_alerts === 'undefined') ? true : !!s.show_low_stock_alerts;
  }catch(_){ }
  // Customer Display settings
  try{
    if(fCustomerDisplayEnabled) fCustomerDisplayEnabled.checked = !!s.customer_display_enabled;
    await loadAvailablePorts();
    if(fCustomerDisplayPort && s.customer_display_port) {
      fCustomerDisplayPort.value = s.customer_display_port;
    }
  }catch(_){ }
  // WhatsApp auto-send
  if (fWhatsAuto) fWhatsAuto.checked = !!s.whatsapp_on_print;
  if (fZatcaEnabled) fZatcaEnabled.checked = !!s.zatca_enabled;
  if (fCartSeparateDup) fCartSeparateDup.checked = !!s.cart_separate_duplicate_lines;

  // Footer note
  if (fInvoiceFooterNote) fInvoiceFooterNote.value = s.invoice_footer_note || '';

  // Logo size (optional)
  if (fLogoW) fLogoW.value = String(Number(s.logo_width_px || 120));
  if (fLogoH) fLogoH.value = String(Number(s.logo_height_px || 120));

  // payment methods checkboxes
  const methods = Array.isArray(s.payment_methods) ? s.payment_methods : [];
  document.querySelectorAll('.pm').forEach(cb => {
    cb.checked = methods.includes(cb.value);
  });

  // Prefill daily email modal fields
  if(emEnabled) emEnabled.checked = !!s.daily_email_enabled;
  if(emTime) emTime.value = s.daily_email_time || '';
  if(emHost) emHost.value = s.smtp_host || 'smtp.gmail.com';
  if(emPort) emPort.value = String(Number(s.smtp_port || 587));
  if(emSecure) emSecure.checked = !!s.smtp_secure;
  if(emUser) emUser.value = s.smtp_user || '';
  if(emPass) emPass.value = s.smtp_pass || '';

  // Prefill DB backup scheduler controls
  if(bkEnabled) bkEnabled.checked = !!s.db_backup_enabled;
  if(bkTime) bkTime.value = s.db_backup_time || '';

  // Show recovery section if enabled in DB OR user is superAdmin
  const currentUser = JSON.parse(localStorage.getItem('pos_user') || 'null');
  const isSuperAdmin = currentUser && currentUser.username === 'superAdmin';
  const params = new URLSearchParams(location.search);
  const unlockParam = params.get('unlock') === 'restore2025';
  if(recoverySection){ 
    recoverySection.style.display = (s.recovery_unlocked || isSuperAdmin || unlockParam) ? 'block' : 'none'; 
  }

  logoPath = s.logo_path || null;
  logoBlobBase64 = null; // fresh load: not holding a picked image
  logoMime = null;
  logoRemoved = false; // reset removal flag on load
  updateLogoPreview();
  // Refresh default product image preview as well
  try{ await updateDefProdPreview(); }catch(_){ }
}

async function updateLogoPreview(){
  // Prefer freshly picked base64 (not yet saved)
  if(logoBlobBase64 && logoMime){
    logoPreview.src = `data:${logoMime};base64,${logoBlobBase64}`;
    logoPreview.style.visibility='visible';
    return;
  }
  // Fallback: try fetching from DB (stored logo)
  if(!logoPath){
    try{
      const lg = await window.api.settings_image_get();
      if(lg && lg.ok && lg.base64){
        logoPreview.src = `data:${lg.mime||'image/png'};base64,${lg.base64}`;
        logoPreview.style.visibility='visible';
        return;
      }
    }catch(_){ }
    logoPreview.src = ''; logoPreview.style.visibility='hidden'; return;
  }
  // Legacy path
  window.api.resolve_path(logoPath).then(res => {
    if(res.ok){ logoPreview.src = 'file:///' + res.abs.replace(/\\/g,'/'); logoPreview.style.visibility='visible'; }
  });
}

pickLogo.addEventListener('click', async () => {
  const r = await window.api.pick_image();
  if(!r.ok || r.canceled) return;
  const read = await window.api.read_file_base64(r.path);
  if(!read.ok){
    setError(read.error || 'فشل قراءة الصورة');
    return;
  }
  // Enforce 1MB limit via central validator
  if(read.tooLarge){
    setError('حجم الصورة أكبر من 1 ميجابايت. يرجى اختيار صورة أصغر.');
    return;
  }
  logoBlobBase64 = read.base64;
  logoMime = read.mime;
  // Clear legacy path so preview uses base64
  logoPath = null;
  logoRemoved = false; // selecting a new logo cancels removal intent
  updateLogoPreview();
});

removeLogo.addEventListener('click', () => {
  logoPath = null; logoBlobBase64 = null; logoMime = null; logoRemoved = true; updateLogoPreview();
});

// Default product image: preview loader from DB (lazily)
async function updateDefProdPreview(){
  // If user requested removal, hide immediately and don't fetch from DB
  if(defProdImgRemoved){
    defProdImgPreview.src='';
    defProdImgPreview.style.visibility='hidden';
    return;
  }
  // Prefer freshly picked base64
  if(defProdImgBase64 && defProdImgMime){
    defProdImgPreview.src = `data:${defProdImgMime};base64,${defProdImgBase64}`;
    defProdImgPreview.style.visibility='visible';
    return;
  }
  try{
    const r = await window.api.settings_default_product_image_get();
    if(r && r.ok && r.base64){
      defProdImgPreview.src = `data:${r.mime||'image/png'};base64,${r.base64}`;
      defProdImgPreview.style.visibility='visible';
      return;
    }
  }catch(_){ }
  defProdImgPreview.src=''; defProdImgPreview.style.visibility='hidden';
}

pickDefProdImg?.addEventListener('click', async () => {
  const r = await window.api.pick_image();
  if(!r.ok || r.canceled) return;
  const read = await window.api.read_file_base64(r.path);
  if(!read.ok){ setError(read.error || 'فشل قراءة الصورة'); return; }
  if(read.tooLarge){ setError('حجم الصورة أكبر من 1 ميجابايت. يرجى اختيار صورة أصغر.'); return; }
  defProdImgBase64 = read.base64;
  defProdImgMime = read.mime || 'image/png';
  defProdImgRemoved = false;
  updateDefProdPreview();
});

removeDefProdImg?.addEventListener('click', () => {
  defProdImgBase64 = null;
  defProdImgMime = null;
  defProdImgRemoved = true;
  updateDefProdPreview();
});

// Open/close daily email dialog
btnDailyEmail?.addEventListener('click', ()=>{ try{ dailyEmailDlg?.showModal(); }catch(_){ } });
emCancel?.addEventListener('click', ()=>{ try{ dailyEmailDlg?.close(); }catch(_){ } });
emSave?.addEventListener('click', async ()=>{
  // Save immediately by reusing settings_save with only email/scheduler fields merged
  saveBtn?.click(); // rely on main save to persist everything including modal fields
  try{ dailyEmailDlg?.close(); }catch(_){ }
});

// Send DB backup directly from daily settings area (beside time)
const emSendBackup = document.getElementById('em_send_backup');
emSendBackup?.addEventListener('click', async ()=>{
  try{
    setError('');
    // transient success message (show inside dialog if open, else global toast)
    const showOk = (msg)=>{
      const text = msg || 'تم الإرسال بنجاح';
      if (dailyEmailDlg && dailyEmailDlg.open) {
        const toast = document.createElement('div');
        toast.className = 'success';
        toast.textContent = text;
        dailyEmailDlg.appendChild(toast);
        setTimeout(()=>{ try{ toast.remove(); }catch(_){} }, 2000);
      } else {
        okDiv.textContent = text;
        okDiv.style.display = 'block';
        setTimeout(()=>{ okDiv.style.display = 'none'; okDiv.textContent=''; }, 2000);
      }
    };
    // Use the email field as target; if empty, main will fall back to settings
    const to = (fEmail?.value||'').trim();
    const r = await window.api.backup_email_db(to||undefined);
    if(!r || !r.ok){ setError((r && r.error) || 'فشل إرسال النسخة الاحتياطية'); }
    else { showOk('تم إرسال نسخة قاعدة البيانات بنجاح'); }
  }catch(e){ setError(String(e&&e.message||e)); }
});

// Save database backup to file
const saveBackupFile = document.getElementById('save_backup_file');
saveBackupFile?.addEventListener('click', async ()=>{
  try{
    setError('');
    const showOk = (msg)=>{
      const text = msg || 'تم الحفظ بنجاح';
      okDiv.textContent = text;
      okDiv.style.display = 'block';
      setTimeout(()=>{ okDiv.style.display = 'none'; okDiv.textContent=''; }, 2000);
    };
    
    const dialogResult = await window.api.backup_show_save_dialog();
    if(!dialogResult || !dialogResult.ok || dialogResult.canceled){ 
      return;
    }
    
    const savePath = dialogResult.path;
    const r = await window.api.backup_save_db_to_file(savePath);
    if(!r || !r.ok){ 
      setError((r && r.error) || 'فشل حفظ النسخة الاحتياطية'); 
    } else { 
      showOk('تم حفظ النسخة الاحتياطية بنجاح'); 
    }
  }catch(e){ setError(String(e&&e.message||e)); }
});

// Send daily report now (manual trigger)
const emSendDaily = document.getElementById('em_send_daily');
emSendDaily?.addEventListener('click', async ()=>{
  try{
    setError('');
    emSendDaily.disabled = true;
    const originalText = emSendDaily.textContent;
    emSendDaily.textContent = '⏳ جاري إنشاء وإرسال التقرير...';
    const showOk = (msg)=>{
      const text = msg || 'تم الإرسال بنجاح';
      if (dailyEmailDlg && dailyEmailDlg.open) {
        const toast = document.createElement('div');
        toast.className = 'success';
        toast.textContent = text;
        dailyEmailDlg.appendChild(toast);
        setTimeout(()=>{ try{ toast.remove(); }catch(_){} }, 3000);
      } else {
        okDiv.textContent = text;
        okDiv.style.display = 'block';
        setTimeout(()=>{ okDiv.style.display = 'none'; okDiv.textContent=''; }, 3000);
      }
    };
    const r = await window.api.scheduler_send_daily_now();
    if(!r || !r.ok){ 
      setError((r && r.error) || 'فشل إرسال التقرير اليومي'); 
    }
    else { 
      showOk('✅ تم إرسال التقرير اليومي بنجاح'); 
    }
    emSendDaily.disabled = false;
    emSendDaily.textContent = originalText;
  }catch(e){ 
    setError(String(e&&e.message||e)); 
    emSendDaily.disabled = false;
    emSendDaily.textContent = '📧 إرسال الآن';
  }
});

// Open/close backup email dialog
btnBackupEmail?.addEventListener('click', ()=>{
  try{
    if(bkTo){ bkTo.value = (fEmail?.value||'').trim(); }
    backupEmailDlg?.showModal();
  }catch(_){ }
});
bkCancel?.addEventListener('click', ()=>{ try{ backupEmailDlg?.close(); }catch(_){ } });
bkSend?.addEventListener('click', async ()=>{
  try{
    const to = (bkTo?.value||'').trim();
    const r = await window.api.backup_email_db(to||undefined);
    if(!r || !r.ok){ setError((r && r.error) || 'فشل إرسال النسخة الاحتياطية'); }
    else { setOk(true); }
  }catch(e){ setError(String(e&&e.message||e)); }
  try{ backupEmailDlg?.close(); }catch(_){ }
});

saveBtn.addEventListener('click', async () => {
  setError(''); setOk(false);
  // gather checked payment methods
  const methods = Array.from(document.querySelectorAll('.pm'))
    .filter(cb => cb.checked)
    .map(cb => cb.value);

  const payload = {
    // استخدم الاسم القانوني كقيمة لحقل company_name للتوافق الخلفي
    company_name: (fSellerLegal.value||'').trim(),
    company_site: (fCompanySite.value||'').trim(),
    company_location: (fCompanyLocation.value||'').trim(),
    mobile: (fMobile.value||'').trim(),
    email: (fEmail.value||'').trim(),
    menu_url: (fMenuUrl?.value||'').trim() || null,
    // Logo fields: prefer DB BLOB like products
    logo_path: logoPath, // kept for backward compat if not re-picked
    logo_blob_base64: logoBlobBase64 || null,
    logo_mime: logoMime || null,
    // Default product image fields
    default_product_img_blob_base64: defProdImgBase64 || null,
    default_product_img_mime: defProdImgMime || null,
    vat_percent: Number(fVat.value || 15),
    prices_include_vat: !!fPricesInc.checked,
    payment_methods: methods,
    currency_code: (fCurrencyCode.value||'SAR').trim() || 'SAR',
    currency_symbol: (fCurrencySymbol.value||'﷼').trim() || '﷼',
    currency_symbol_position: (fCurrencyPos.value === 'before' ? 'before' : 'after'),
    default_print_format: 'thermal', // enforced globally; field removed from UI
    print_copies: Math.max(1, Number(fPrintCopies.value || 1)),
    silent_print: !!fSilentPrint.checked,
    print_show_change: !!fShowChange.checked ? 1 : 0,
    show_item_desc: !!fShowItemDesc?.checked ? 1 : 0,
    default_payment_method: (fDefaultPayment.value||'') || null,
    default_order_type: (fDefaultOrderType?.value||'') || null,
    seller_legal_name: (fSellerLegal.value||'').trim(),
    seller_vat_number: (fSellerVat.value||'').trim(),
    // Logo target size in invoice (px)
    logo_width_px: Math.max(24, Math.min(512, Number((fLogoW?.value)||120))) || 120,
    logo_height_px: Math.max(24, Math.min(512, Number((fLogoH?.value)||120))) || 120,
    op_price_manual: !!fOpPriceManual.checked,
    allow_sell_zero_stock: !!fAllowZeroStock.checked,
    allow_negative_inventory: !!fAllowNegativeInventory.checked,
    invoice_footer_note: (fInvoiceFooterNote?.value || '').trim(),
    hide_product_images: !!(fHideProductImages?.checked),
    hide_item_description: !!(fHideItemDescription?.checked),
    closing_hour: (fClosingHour?.value || '').trim() || null,
    // Tobacco settings
    tobacco_fee_percent: Number((fTobaccoPercent?.value) ?? 100),

    tobacco_min_fee_amount: Number((fTobaccoMinFee?.value) ?? 25),
    // Print margins (mm)
    print_margin_right_mm: (fPrintMarginRight?.value==='' ? null : Number(fPrintMarginRight?.value)),
    print_margin_left_mm: (fPrintMarginLeft?.value==='' ? null : Number(fPrintMarginLeft?.value)),
    // WhatsApp auto-send
    whatsapp_on_print: !!(fWhatsAuto?.checked),
    whatsapp_message: null,
    // Daily email scheduler fields (from modal)
    daily_email_enabled: !!(emEnabled?.checked),
    daily_email_time: (emTime?.value || '').trim() || null,
    smtp_host: (emHost?.value || '').trim() || null,
    smtp_port: emPort?.value ? Number(emPort.value) : null,
    smtp_secure: !!(emSecure?.checked),
    smtp_user: (emUser?.value || '').trim() || null,
    smtp_pass: (emPass?.value || '').trim() || null,
    // New fields
    commercial_register: (fCommercialRegister?.value || '').trim() || null,
    national_number: (fNationalNumber?.value || '').trim() || null,
    // ZATCA toggle
    zatca_enabled: !!(fZatcaEnabled?.checked),
    // DB backup scheduler
    db_backup_enabled: !!(bkEnabled?.checked),
    // Cart behavior
    cart_separate_duplicate_lines: !!(fCartSeparateDup?.checked),
    db_backup_time: (bkTime?.value || '').trim() || null,
    // Low stock alert threshold
    low_stock_threshold: (function(){
      const el = document.getElementById('f_low_stock_threshold');
      const v = el ? Number(el.value||5) : 5;
      return Math.max(0, isFinite(v) ? Math.floor(v) : 5);
    })(),
    // Low stock email control
    low_stock_email_enabled: !!(fLowStockEmailEnabled?.checked),
    // Show/hide low-stock alerts on sales screen
    show_low_stock_alerts: !!(fShowLowStockAlerts?.checked),
    // Customer Display settings
    customer_display_enabled: !!(fCustomerDisplayEnabled?.checked),
    customer_display_port: (fCustomerDisplayPort?.value || '').trim() || null,
    customer_display_baud_rate: 2400,
    customer_display_columns: 8,
    customer_display_rows: 1,
    customer_display_protocol: 'ecopos',
    customer_display_encoding: 'ascii',
    customer_display_brightness: 100,
  };
  // Clear logo ONLY if user explicitly removed it
  if(logoRemoved){ payload.logo_clear = true; }
  // Clear default product image ONLY if user explicitly removed it
  if(defProdImgRemoved){ payload.default_product_img_clear = true; }
  const r = await window.api.settings_save(payload);
  if(!r.ok){ setError(r.error || 'فشل حفظ الإعدادات'); return; }
  try{
    // rearm schedulers to pick latest settings immediately
    await window.api.scheduler_trigger_daily_email();
    await window.api.scheduler_trigger_backup();
  }catch(_){ }
  try{
    // سهل على الشاشات الأخرى التقاط التغيير فورًا بدون إعادة فتح
    const ov = { tobacco_fee_percent: payload.tobacco_fee_percent, tobacco_min_fee_amount: payload.tobacco_min_fee_amount };
    localStorage.setItem('pos_settings_tobacco', JSON.stringify(ov));
    window.dispatchEvent(new StorageEvent('storage', { key: 'pos_settings_tobacco', newValue: JSON.stringify(ov) }));
    // بث إعدادات تنبيهات المخزون لالتقاطها في شاشة البيع دون إعادة تشغيل
    const lowstock = { show_low_stock_alerts: !!payload.show_low_stock_alerts, low_stock_threshold: Number(payload.low_stock_threshold ?? 5) };
    localStorage.setItem('pos_settings_lowstock', JSON.stringify(lowstock));
    window.dispatchEvent(new StorageEvent('storage', { key: 'pos_settings_lowstock', newValue: JSON.stringify(lowstock) }));
  }catch(_){ }
  // إعادة التحميل فوراً بدون تأخير
  try{ await loadSettings(); }catch(_){ }
  // إعادة تهيئة شاشة العرض إذا كانت مفعلة
  try{
    if(payload.customer_display_enabled){
      await window.api.invoke('customer-display:reinit');
    }
  }catch(e){ console.error('Failed to reinit customer display:', e); }
  // عرض رسالة النجاح بعد إعادة التحميل
  setOk(true);
});

if(reloadBtn){ reloadBtn.addEventListener('click', loadSettings); }

// System Restore Modal
const btnSystemRestore = document.getElementById('btnSystemRestore');
const systemRestoreModal = document.getElementById('systemRestoreModal');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const modalConfirmBtn = document.getElementById('modalConfirmBtn');
const resetSalesCheck = document.getElementById('resetSalesCheck');
const resetProductsCheck = document.getElementById('resetProductsCheck');
const resetCustomersCheck = document.getElementById('resetCustomersCheck');
const resetPurchasesCheck = document.getElementById('resetPurchasesCheck');

// Confirmation Modal
const confirmationModal = document.getElementById('confirmationModal');
const confirmCancelBtn = document.getElementById('confirmCancelBtn');
const confirmOkBtn = document.getElementById('confirmOkBtn');
const confirmationList = document.getElementById('confirmationList');

// Success Modal
const successModal = document.getElementById('successModal');
const successList = document.getElementById('successList');

// Custom confirmation function
function showConfirmation(operations){
  return new Promise((resolve)=>{
    // Build operations list HTML
    let html = '<div style="display: flex; flex-direction: column; gap: 0.5rem;">';
    operations.forEach(op => {
      html += `
        <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink: 0;">
            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span style="color: #1f2937; font-weight: 600; font-size: 0.9375rem; font-family: 'Cairo', sans-serif;">${op}</span>
        </div>
      `;
    });
    html += '</div>';
    
    confirmationList.innerHTML = html;
    confirmationModal.style.display = 'block';
    
    const handleOk = ()=>{
      cleanup();
      resolve(true);
    };
    
    const handleCancel = ()=>{
      cleanup();
      resolve(false);
    };
    
    const handleOutsideClick = (e)=>{
      if(e.target === confirmationModal){
        cleanup();
        resolve(false);
      }
    };
    
    const cleanup = ()=>{
      confirmOkBtn.removeEventListener('click', handleOk);
      confirmCancelBtn.removeEventListener('click', handleCancel);
      confirmationModal.removeEventListener('click', handleOutsideClick);
      confirmationModal.style.display = 'none';
    };
    
    confirmOkBtn.addEventListener('click', handleOk);
    confirmCancelBtn.addEventListener('click', handleCancel);
    confirmationModal.addEventListener('click', handleOutsideClick);
  });
}

// Custom success toast notification (auto-hide after 3 seconds)
function showSuccess(messages){
  // Build success messages HTML (compact)
  let html = '';
  messages.forEach((msg, index) => {
    html += `<div style="color: #1f2937; font-weight: 600; font-size: 0.9375rem; font-family: 'Cairo', sans-serif; line-height: 1.4;">${msg}</div>`;
  });
  
  successList.innerHTML = html;
  successModal.style.display = 'block';
  
  const hideSuccess = ()=>{
    successModal.style.display = 'none';
  };
  
  // Auto-hide after 2 seconds
  setTimeout(()=>{
    hideSuccess();
  }, 2000);
}

if(btnSystemRestore){
  btnSystemRestore.addEventListener('click', ()=>{
    // Reset all checkboxes
    if(resetSalesCheck) resetSalesCheck.checked = false;
    if(resetProductsCheck) resetProductsCheck.checked = false;
    if(resetCustomersCheck) resetCustomersCheck.checked = false;
    if(resetPurchasesCheck) resetPurchasesCheck.checked = false;
    // Show modal
    if(systemRestoreModal) systemRestoreModal.style.display = 'block';
  });
}

if(modalCancelBtn){
  modalCancelBtn.addEventListener('click', ()=>{
    if(systemRestoreModal) systemRestoreModal.style.display = 'none';
  });
}

if(systemRestoreModal){
  // Close modal when clicking outside
  systemRestoreModal.addEventListener('click', (e)=>{
    if(e.target === systemRestoreModal){
      systemRestoreModal.style.display = 'none';
    }
  });
}

if(modalConfirmBtn){
  modalConfirmBtn.addEventListener('click', async ()=>{
    const salesChecked = resetSalesCheck?.checked;
    const productsChecked = resetProductsCheck?.checked;
    const customersChecked = resetCustomersCheck?.checked;
    const purchasesChecked = resetPurchasesCheck?.checked;

    // Check if at least one option is selected
    if(!salesChecked && !productsChecked && !customersChecked && !purchasesChecked){
      alert('يرجى اختيار عنصر واحد على الأقل للحذف');
      return;
    }

    // Build operations list for confirmation
    const operations = [];
    if(salesChecked) operations.push('حذف جميع الفواتير وإعادة الترقيم');
    if(productsChecked) operations.push('حذف جميع المنتجات والأنواع الرئيسية');
    if(customersChecked) operations.push('حذف جميع العملاء');
    if(purchasesChecked) operations.push('حذف جميع المشتريات');

    // Show custom confirmation modal
    const confirmed = await showConfirmation(operations);
    if(!confirmed) return;

    // Close modal
    if(systemRestoreModal) systemRestoreModal.style.display = 'none';

    // Disable button during operations
    if(modalConfirmBtn) modalConfirmBtn.disabled = true;
    if(btnSystemRestore) btnSystemRestore.disabled = true;

    let hasError = false;
    let successMsg = [];

    try{
      // Execute operations in sequence
      if(salesChecked){
        try{
          const r = await window.api.sales_reset_all();
          if(!r.ok){
            setError('فشل حذف الفواتير: ' + (r.error || 'خطأ غير معروف'));
            hasError = true;
          }else{
            successMsg.push('✓ تم حذف الفواتير وإعادة الترقيم');
          }
        }catch(e){
          setError('فشل حذف الفواتير: ' + e.message);
          hasError = true;
        }
      }

      if(productsChecked){
        try{
          const r = await window.api.products_reset_all();
          if(!r.ok){
            setError('فشل حذف المنتجات: ' + (r.error || 'خطأ غير معروف'));
            hasError = true;
          }else{
            successMsg.push('✓ تم حذف المنتجات والأنواع الرئيسية');
            // Notify other screens
            try{
              const payload = JSON.stringify({ at: Date.now() });
              localStorage.setItem('pos_reset_products', payload);
              window.dispatchEvent(new StorageEvent('storage', { key: 'pos_reset_products', newValue: payload }));
              window.dispatchEvent(new CustomEvent('pos_reset_products', { detail: { at: Date.now() } }));
            }catch(_){}
          }
        }catch(e){
          setError('فشل حذف المنتجات: ' + e.message);
          hasError = true;
        }
      }

      if(customersChecked){
        try{
          const r = await window.api.customers_reset_all();
          if(!r.ok){
            setError('فشل حذف العملاء: ' + (r.error || 'خطأ غير معروف'));
            hasError = true;
          }else{
            successMsg.push('✓ تم حذف جميع العملاء');
          }
        }catch(e){
          setError('فشل حذف العملاء: ' + e.message);
          hasError = true;
        }
      }

      if(purchasesChecked){
        try{
          // Check if API exists
          if(window.api.purchases_reset_all){
            const r = await window.api.purchases_reset_all();
            if(!r.ok){
              setError('فشل حذف المشتريات: ' + (r.error || 'خطأ غير معروف'));
              hasError = true;
            }else{
              successMsg.push('✓ تم حذف جميع المشتريات');
            }
          }else{
            alert('وظيفة حذف المشتريات غير متوفرة في هذا الإصدار');
          }
        }catch(e){
          setError('فشل حذف المشتريات: ' + e.message);
          hasError = true;
        }
      }

      // Show success messages
      if(successMsg.length > 0){
        const cleanMessages = successMsg.map(msg => msg.replace('✓ ', ''));
        showSuccess(cleanMessages);
      }

    }finally{
      // Re-enable buttons
      if(modalConfirmBtn) modalConfirmBtn.disabled = false;
      if(btnSystemRestore) btnSystemRestore.disabled = false;
    }
  });
}

loadSettings();

const fMenuUrl = document.getElementById('f_menu_url');
const btnGenerateQR = document.getElementById('btnGenerateQR');
const btnPrintQR = document.getElementById('btnPrintQR');
const btnSaveQR = document.getElementById('btnSaveQR');
const qrCanvas = document.getElementById('qrCanvas');
const qrCodeDisplay = document.getElementById('qrCodeDisplay');
const qrPlaceholder = document.getElementById('qrPlaceholder');
const qrActions = document.getElementById('qrActions');

async function generateMenuQR(){
  try{
    const url = (fMenuUrl?.value || '').trim();
    if(!url){
      alert('الرجاء إدخال رابط المنيو');
      return;
    }
    if(!url.startsWith('http://') && !url.startsWith('https://')){
      alert('الرجاء إدخال رابط صحيح يبدأ بـ http:// أو https://');
      return;
    }
    const result = await window.api.invoke('qr:to_data_url', { 
      text: url, 
      opts: { width: 180, margin: 2, errorCorrectionLevel: 'M' } 
    });
    if(!result.ok){
      throw new Error(result.error || 'فشل توليد QR');
    }
    const img = new Image();
    img.onload = () => {
      qrCanvas.width = img.width;
      qrCanvas.height = img.height;
      const ctx = qrCanvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      qrCodeDisplay.style.display = 'block';
      qrPlaceholder.style.display = 'none';
      qrActions.style.display = 'flex';
    };
    img.src = result.dataUrl;
  }catch(e){
    console.error(e);
    alert('فشل توليد QR Code: ' + e.message);
  }
}

function printQRCode(){
  try{
    const dataUrl = qrCanvas.toDataURL('image/png');
    const printWindow = window.open('', '_blank', 'width=400,height=500');
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>QR المنيو</title>
          <style>
            body {
              font-family: 'Cairo', sans-serif;
              text-align: center;
              padding: 20px;
            }
            img {
              max-width: 100%;
              height: auto;
            }
            h2 {
              margin-bottom: 20px;
            }
            @media print {
              @page { size: auto; margin: 15mm; }
            }
          </style>
        </head>
        <body>
          <h2>QR Code المنيو</h2>
          <img src="${dataUrl}" alt="QR Code"/>
          <script>
            window.onload = function(){
              setTimeout(function(){
                window.print();
                window.close();
              }, 250);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }catch(e){
    console.error(e);
    alert('فشل طباعة QR Code: ' + e.message);
  }
}

function showQRNotification(message, type = 'success'){
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)'};
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-family: 'Cairo', sans-serif;
    font-weight: 700;
    font-size: 14px;
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
    max-width: 400px;
    word-wrap: break-word;
  `;
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${type === 'success' ? 
          '<path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' :
          '<path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        }
      </svg>
      <span>${message}</span>
    </div>
  `;
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(400px); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      document.body.removeChild(notification);
      document.head.removeChild(style);
    }, 300);
  }, 3000);
}

async function saveQRCode(){
  try{
    const dataUrl = qrCanvas.toDataURL('image/png');
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const result = await window.api.invoke('app:save-qr-image', { base64Data });
    if(result.ok){
      showQRNotification('✓ تم حفظ QR Code بنجاح', 'success');
    }else{
      showQRNotification('✗ فشل حفظ QR Code: ' + (result.error || 'خطأ غير معروف'), 'error');
    }
  }catch(e){
    console.error(e);
    showQRNotification('✗ فشل حفظ QR Code: ' + e.message, 'error');
  }
}

if(btnGenerateQR){ btnGenerateQR.addEventListener('click', generateMenuQR); }
if(btnPrintQR){ btnPrintQR.addEventListener('click', printQRCode); }
if(btnSaveQR){ btnSaveQR.addEventListener('click', saveQRCode); }

const checkUpdateBtn = document.getElementById('checkUpdateBtn');
const updateModal = document.getElementById('updateModal');
const updateDownloadBtn = document.getElementById('updateDownloadBtn');
const updateInstallBtn = document.getElementById('updateInstallBtn');
const updateCancelBtn = document.getElementById('updateCancelBtn');
const updateStatus = document.getElementById('updateStatus');
const updateMessage = document.getElementById('updateMessage');
let updateProgress = document.getElementById('updateProgress');
let updateProgressBar = document.getElementById('updateProgressBar');
let updateProgressText = document.getElementById('updateProgressText');

let currentUpdateInfo = null;

function rebindProgressElements() {
  updateProgress = document.getElementById('updateProgress');
  updateProgressBar = document.getElementById('updateProgressBar');
  updateProgressText = document.getElementById('updateProgressText');
}

function showSupportExpiredMessage(statusData) {
  updateDownloadBtn.disabled = false;
  updateInstallBtn.disabled = false;
  
  const daysLeft = statusData?.daysLeft || 0;
  const endDate = statusData?.endDate;
  
  let dateText = '';
  if (endDate) {
    const date = new Date(endDate);
    dateText = `تاريخ انتهاء الدعم: ${date.toLocaleDateString('en-GB')}`;
  }
  
  const daysSinceExpiry = Math.abs(daysLeft);
  let expiryText = '';
  if (daysSinceExpiry === 0) {
    expiryText = 'انتهى اليوم';
  } else if (daysSinceExpiry === 1) {
    expiryText = 'منذ يوم واحد';
  } else if (daysSinceExpiry === 2) {
    expiryText = 'منذ يومين';
  } else if (daysSinceExpiry <= 10) {
    expiryText = `منذ ${daysSinceExpiry} أيام`;
  } else {
    expiryText = `منذ ${daysSinceExpiry} يوماً`;
  }
  
  updateStatus.innerHTML = `
    <div style="font-size: 64px; margin-bottom: var(--space-4); filter: drop-shadow(0 4px 12px rgba(245, 158, 11, 0.3));">⚠️</div>
    <div style="font-size: 20px; color: #dc2626; font-weight: 700; margin-bottom: var(--space-3);">انتهت فترة الدعم الفني</div>
    <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); padding: var(--space-4); border-radius: var(--radius-lg); border: 2px solid #fbbf24; margin: var(--space-4) 0;">
      <div style="font-size: 14px; color: #92400e; line-height: 1.6; text-align: center;">
        <div style="font-weight: 600; margin-bottom: var(--space-2);">⏰ ${expiryText}</div>
        ${dateText ? `<div style="font-size: 13px; color: #b45309; margin-bottom: var(--space-3);">${dateText}</div>` : ''}
        <div style="border-top: 1px solid #fbbf24; padding-top: var(--space-3); margin-top: var(--space-3);">
          <div style="font-size: 15px; font-weight: 600; color: #78350f; margin-bottom: var(--space-2);">للحصول على التحديثات:</div>
          <div style="font-size: 14px; color: #92400e;">
            📞 يرجى التواصل مع الدعم الفني لتجديد الاشتراك
          </div>
        </div>
      </div>
    </div>
  `;
  
  updateMessage.textContent = '';
  rebindProgressElements();
  
  updateDownloadBtn.style.display = 'none';
  updateInstallBtn.style.display = 'none';
  
  updateCancelBtn.textContent = 'إغلاق';
  updateCancelBtn.className = 'btn';
  updateCancelBtn.style.cssText = 'min-width: 140px; background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; border: none; font-weight: 600; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3); transition: all 0.3s;';
  updateCancelBtn.onmouseover = function() {
    this.style.background = 'linear-gradient(135deg, #b91c1c, #991b1b)';
    this.style.transform = 'translateY(-2px)';
    this.style.boxShadow = '0 6px 16px rgba(220, 38, 38, 0.4)';
  };
  updateCancelBtn.onmouseout = function() {
    this.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
    this.style.transform = 'translateY(0)';
    this.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
  };
}

function showUpdateModal() {
  if (updateModal) {
    updateModal.showModal();
    resetUpdateModal();
    resetCancelButton();
  }
}

function closeUpdateModal() {
  if (updateModal) {
    updateModal.close();
    resetCancelButton();
  }
}

function resetCancelButton() {
  updateCancelBtn.textContent = 'إغلاق';
  updateCancelBtn.className = 'btn';
  updateCancelBtn.style.cssText = 'min-width: 120px;';
  updateCancelBtn.onmouseover = null;
  updateCancelBtn.onmouseout = null;
}

function resetUpdateModal() {
  updateStatus.innerHTML = `
    <div style="font-size: 48px; margin-bottom: var(--space-4);">🔍</div>
    <div style="font-size: 16px; color: var(--gray-700); font-weight: 600; margin-bottom: var(--space-2);">جاري البحث عن التحديثات...</div>
    <div id="updateProgress" style="margin-top: var(--space-6); display: none;">
      <div style="margin-bottom: var(--space-2);">
        <div style="font-size: 13px; color: var(--gray-700); font-weight: 600; margin-bottom: var(--space-2);">تقدم التحميل</div>
        <div style="background: var(--gray-200); height: 12px; border-radius: 6px; overflow: hidden; box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);">
          <div id="updateProgressBar" style="background: linear-gradient(90deg, #10b981, #34d399); height: 100%; width: 0%; transition: width 0.3s; box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);"></div>
        </div>
      </div>
      <div id="updateProgressText" style="font-size: 13px; color: var(--gray-600); font-weight: 600; text-align: center;"></div>
    </div>
  `;
  updateMessage.textContent = '';
  rebindProgressElements();
  updateDownloadBtn.style.display = 'none';
  updateInstallBtn.style.display = 'none';
  currentUpdateInfo = null;
}

function updateModalStatus(icon, title, message, showDownload = false, showInstall = false, versionBadge = '') {
  const versionHTML = versionBadge ? `
    <div style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 700; margin-top: 8px; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);">
      ${versionBadge}
    </div>
  ` : '';
  
  updateStatus.innerHTML = `
    <div style="font-size: 48px; margin-bottom: var(--space-4);">${icon}</div>
    <div style="font-size: 16px; color: var(--gray-700); font-weight: 600; margin-bottom: var(--space-2);">${title}</div>
    ${versionHTML}
    <div id="updateProgress" style="margin-top: var(--space-6); display: none;">
      <div style="margin-bottom: var(--space-2);">
        <div style="font-size: 13px; color: var(--gray-700); font-weight: 600; margin-bottom: var(--space-2);">تقدم التحميل</div>
        <div style="background: var(--gray-200); height: 12px; border-radius: 6px; overflow: hidden; box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);">
          <div id="updateProgressBar" style="background: linear-gradient(90deg, #10b981, #34d399); height: 100%; width: 0%; transition: width 0.3s; box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);"></div>
        </div>
      </div>
      <div id="updateProgressText" style="font-size: 13px; color: var(--gray-600); font-weight: 600; text-align: center;"></div>
    </div>
  `;
  updateMessage.textContent = message;
  
  rebindProgressElements();
  resetCancelButton();
  
  if (showDownload) {
    updateDownloadBtn.style.display = 'inline-block';
    updateInstallBtn.style.display = 'none';
  } else if (showInstall) {
    updateDownloadBtn.style.display = 'none';
    updateInstallBtn.style.display = 'inline-block';
  } else {
    updateDownloadBtn.style.display = 'none';
    updateInstallBtn.style.display = 'none';
  }
}

async function handleCheckUpdate() {
  try {
    showUpdateModal();
    const appVersion = await window.api.invoke('get-app-version');
    updateMessage.textContent = `الإصدار الحالي: ${appVersion}`;
    
    const result = await window.api.invoke('check-for-updates');
    console.log('Update check result:', result);
  } catch (error) {
    console.error('Error checking for updates:', error);
    updateModalStatus('❌', 'حدث خطأ', error.message || 'فشل التحقق من التحديثات');
  }
}

async function handleDownloadUpdate() {
  try {
    updateDownloadBtn.disabled = true;
    const versionBadge = currentUpdateInfo?.version ? `الإصدار ${currentUpdateInfo.version}` : '';
    updateModalStatus('⬇️', 'جاري التحميل...', 'يتم تحميل التحديث الآن، يرجى الانتظار...', false, false, versionBadge);
    
    if (updateProgress) updateProgress.style.display = 'block';
    
    const result = await window.api.invoke('download-update');
    
    if (!result.success) {
      updateDownloadBtn.disabled = false;
      if (result.supportExpired) {
        showSupportExpiredMessage(result);
        if (updateProgress) updateProgress.style.display = 'none';
      } else {
        updateModalStatus('❌', 'فشل التحميل', result.error || 'حدث خطأ أثناء التحميل');
        if (updateProgress) updateProgress.style.display = 'none';
      }
    }
  } catch (error) {
    console.error('Error downloading update:', error);
    updateDownloadBtn.disabled = false;
    updateModalStatus('❌', 'فشل التحميل', error.message || 'حدث خطأ أثناء التحميل');
    updateProgress.style.display = 'none';
  }
}

async function handleInstallUpdate() {
  try {
    updateInstallBtn.disabled = true;
    updateModalStatus('⚙️', 'جاري التثبيت...', 'سيتم إغلاق البرنامج وتثبيت التحديث');
    
    const result = await window.api.invoke('install-update');
    
    if (!result.success) {
      updateInstallBtn.disabled = false;
      if (result.supportExpired) {
        showSupportExpiredMessage(result);
      } else {
        updateModalStatus('❌', 'فشل التثبيت', result.error || 'حدث خطأ أثناء التثبيت');
      }
    }
  } catch (error) {
    console.error('Error installing update:', error);
    updateInstallBtn.disabled = false;
    updateModalStatus('❌', 'فشل التثبيت', error.message || 'حدث خطأ أثناء التثبيت');
  }
}

if (checkUpdateBtn) {
  checkUpdateBtn.addEventListener('click', handleCheckUpdate);
}

if (updateDownloadBtn) {
  updateDownloadBtn.addEventListener('click', handleDownloadUpdate);
}

if (updateInstallBtn) {
  updateInstallBtn.addEventListener('click', handleInstallUpdate);
}

if (updateCancelBtn) {
  updateCancelBtn.addEventListener('click', closeUpdateModal);
}

window.api?.on?.('update-status', (data) => {
  const { status, data: statusData } = data;
  
  console.log('Update status event received:', status, statusData);

  switch (status) {
    case 'checking-for-update':
      updateModalStatus('🔍', 'جاري البحث...', 'البحث عن التحديثات المتاحة');
      break;

    case 'update-available':
      currentUpdateInfo = statusData;
      const version = statusData?.version || 'جديد';
      updateModalStatus(
        '✅', 
        'يتوفر تحديث جديد!', 
        'اضغط "تحميل التحديث" للبدء في تحميل الإصدار الجديد',
        true,
        false,
        `الإصدار ${version}`
      );
      break;

    case 'update-not-available':
      const currentVer = statusData?.version || 'غير معروف';
      updateModalStatus(
        '✓', 
        'البرنامج محدث', 
        `الإصدار الحالي ${currentVer} هو آخر إصدار متاح`,
        false,
        false,
        `الإصدار ${currentVer}`
      );
      break;

    case 'download-progress':
      const percent = statusData?.percent || 0;
      const transferred = statusData?.transferred || 0;
      const total = statusData?.total || 0;
      
      rebindProgressElements();
      
      if (updateProgress) updateProgress.style.display = 'block';
      if (updateProgressBar) updateProgressBar.style.width = `${percent.toFixed(1)}%`;
      
      const transferredMB = (transferred / 1024 / 1024).toFixed(2);
      const totalMB = (total / 1024 / 1024).toFixed(2);
      if (updateProgressText) updateProgressText.textContent = `${percent.toFixed(1)}% • ${transferredMB} ميجابايت / ${totalMB} ميجابايت`;
      break;

    case 'update-downloaded':
      updateDownloadBtn.disabled = false;
      const downloadedVersion = currentUpdateInfo?.version || statusData?.version || 'جديد';
      updateModalStatus(
        '✅', 
        'تم التحميل بنجاح!', 
        'التحديث جاهز للتثبيت. اضغط "تثبيت الآن" لتثبيت التحديث',
        false,
        true,
        `الإصدار ${downloadedVersion}`
      );
      updateProgress.style.display = 'none';
      break;

    case 'update-error':
      updateDownloadBtn.disabled = false;
      updateInstallBtn.disabled = false;
      const errorMsg = statusData?.message || statusData?.toString() || 'خطأ غير معروف';
      updateModalStatus('❌', 'حدث خطأ', errorMsg);
      updateProgress.style.display = 'none';
      break;

    case 'support-expired':
      showSupportExpiredMessage(statusData);
      if (updateProgress) updateProgress.style.display = 'none';
      break;
  }
});