// Main screen renderer: handle navigation via cards + logout + language toggle

// Language state
const langSelect = document.getElementById('langSelect') || document.getElementById('appLangSelect');
const __langKey = 'app_lang';
function __applyLang(lang){
  // Normalize locale variants like ar-SA/en-US to base codes
  const base = (typeof lang==='string' ? lang.split('-')[0].toLowerCase() : 'ar');
  const isAr = (base==='ar');
  const t = {
    brand: isAr ? 'الرئيسية' : 'Home',
    logout: isAr ? 'تسجيل الخروج' : 'Logout',
    pos_btn: isAr ? 'نقطة البيع' : 'POS',
    // cards
    users_h: isAr ? 'المستخدمون' : 'Users', users_p: isAr ? 'إدارة مستخدمي النظام والأدوار والحالة' : 'Manage users, roles and status',
    perms_h: isAr ? 'الصلاحيات' : 'Permissions', perms_p: isAr ? 'تحديد صلاحيات المستخدمين' : 'Manage user permissions',
    customers_h: isAr ? 'العملاء' : 'Customers', customers_p: isAr ? 'إضافة/إدارة العملاء' : 'Add/Manage customers',
    newinv_h: isAr ? 'فاتورة جديدة' : 'New Invoice', newinv_p: isAr ? 'بدء عملية بيع' : 'Start a sale',
    invoices_h: isAr ? 'الفواتير' : 'Invoices', invoices_p: isAr ? 'عرض وإدارة الفواتير' : 'View and manage invoices',
    credit_h: isAr ? 'الفواتير الدائنة' : 'Credit Notes', credit_p: isAr ? 'عرض الإشعارات الدائنة منفصلة' : 'View credit notes',
    pay_h: isAr ? 'دفع الفاتورة' : 'Payments', pay_p: isAr ? 'سداد فواتير الآجل بالكامل' : 'Settle credit invoices',
    products_h: isAr ? 'المنتجات' : 'Products', products_p: isAr ? 'إضافة منتج جديد' : 'Add products',
    rooms_h: isAr ? 'الغرف' : 'Rooms', rooms_p: isAr ? 'غرف/طاولات المطعم' : 'Restaurant rooms/tables',
    types_h: isAr ? 'الأنواع الرئيسية' : 'Main Types', types_p: isAr ? 'إدارة الأنواع الرئيسية' : 'Manage main types',
    settings_h: isAr ? 'الإعدادات' : 'Settings', settings_p: isAr ? 'معلومات الشركة والضريبة' : 'Company and tax info',
    ops_h: isAr ? 'العمليات' : 'Operations', ops_p: isAr ? 'تعريف العمليات وربطها بالمنتجات' : 'Define operations and link to products',
    kitchen_h: isAr ? 'طابعات المطبخ' : 'Kitchen Printers', kitchen_p: isAr ? 'ربط الأقسام بطابعات' : 'Link sections to printers',
    purchases_h: isAr ? 'المشتريات' : 'Purchases', purchases_p: isAr ? 'إضافة ومراجعة مشتريات' : 'Add/Review purchases',
    inventory_h: isAr ? 'المخزون' : 'Inventory', inventory_p: isAr ? 'تعريف عناصر المخزون وربطها بالمنتجات' : 'Manage inventory items',
    cp_h: isAr ? 'تخصيص أسعار' : 'Customer Pricing', cp_p: isAr ? 'تحديد أسعار/خصومات لعميل' : 'Set special prices/discounts',
    offers_h: isAr ? 'العروض والكوبونات' : 'Offers & Coupons', offers_p: isAr ? 'عروض على الأصناف وكوبونات خصم' : 'Items offers and coupons',
    drivers_h: isAr ? 'السائقون' : 'Drivers', drivers_p: isAr ? 'تسجيل وإدارة السائقين' : 'Register and manage drivers',
    reports_h: isAr ? 'التقارير' : 'Reports', reports_p: isAr ? 'عرض تقارير المبيعات لاحقًا' : 'View sales reports',
    zatca_h: isAr ? 'الربط - المرحلة الثانية' : 'Integration - Phase 2', zatca_p: isAr ? 'إعداد وإرسال الفواتير إلكترونيًا (ZATCA)' : 'Configure and submit e-invoices (ZATCA)',
    whatsapp_h: isAr ? 'إدارة WhatsApp' : 'WhatsApp Management', whatsapp_p: isAr ? 'ربط وإرسال الفواتير عبر واتساب' : 'Connect and send invoices via WhatsApp',
    footer: isAr ? 'نظام الرابط' : 'Al-Rabit System',
  };
  // html attrs
  document.documentElement.lang = isAr ? 'ar' : 'en';
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  // header
  const brandSpan = document.querySelector('.brand span'); if(brandSpan) brandSpan.textContent = t.brand;
  const logoutBtn = document.getElementById('logoutBtn'); if(logoutBtn) logoutBtn.textContent = (isAr ? 'تسجيل الخروج' : 'Log out');
  const posBtn = document.getElementById('posBtn');
  if(posBtn){
    const posSpan = posBtn.querySelector('span:first-of-type');
    if(posSpan) posSpan.textContent = t.pos_btn;
  }
  // cards text
  const map = [
    ['cardUsers', 'users_h', 'users_p'],
    ['cardPermissions', 'perms_h', 'perms_p'],
    ['cardCustomers', 'customers_h', 'customers_p'],
    ['cardNewInvoice', 'newinv_h', 'newinv_p'],
    ['cardInvoices', 'invoices_h', 'invoices_p'],
    ['cardCreditNotes', 'credit_h', 'credit_p'],
    ['cardPayments', 'pay_h', 'pay_p'],
    ['cardProducts', 'products_h', 'products_p'],
    ['cardRooms', 'rooms_h', 'rooms_p'],
    ['cardTypes', 'types_h', 'types_p'],
    ['cardSettings', 'settings_h', 'settings_p'],
    ['cardOperations', 'ops_h', 'ops_p'],
    ['cardKitchen', 'kitchen_h', 'kitchen_p'],
    ['cardPurchases', 'purchases_h', 'purchases_p'],
    ['cardInventory', 'inventory_h', 'inventory_p'],
    ['cardCustomerPricing', 'cp_h', 'cp_p'],
    ['cardOffers', 'offers_h', 'offers_p'],
    ['cardDrivers', 'drivers_h', 'drivers_p'],
    ['cardReports', 'reports_h', 'reports_p'],
    ['cardZatca', 'zatca_h', 'zatca_p'],
    ['cardWhatsApp', 'whatsapp_h', 'whatsapp_p'],
  ];
  
  map.forEach(([id, hKey, pKey]) => {
    const el = document.getElementById(id); if(!el) return;
    const h3 = el.querySelector('h3'); if(h3) h3.textContent = t[hKey];
    const p = el.querySelector('p'); if(p) p.textContent = t[pKey];
    try{ el.setAttribute('title', t[pKey]); }catch(_){ }
  });
  const footer = document.querySelector('.footer-note'); if(footer) footer.textContent = t.footer;
  // persist
  try{ localStorage.setItem(__langKey, base); }catch(_){ }
  if(langSelect){ langSelect.value = base; }
  // Update app-wide DB locale and notify other windows
  try{ window.api.app_set_locale(base); }catch(_){ }
  // Trigger DOM translate burst to ensure icons/cards pick up correct language immediately
  try{ window.__i18n_burst && window.__i18n_burst(base); }catch(_){ }
}

(function initLang(){
  // Apply initial from DB
  (async ()=>{
    try{ const r = await window.api.app_get_locale(); const L=(r&&r.lang)||'ar'; __applyLang(L); if(langSelect) langSelect.value=L; }catch(_){ __applyLang('ar'); }
  })();
  // listen for global changes
  try{ window.api.app_on_locale_changed((L)=>{ __applyLang(L); if(langSelect) langSelect.value=L; try{ window.__i18n_burst && window.__i18n_burst(L); }catch(_){ } }); }catch(_){ }
  if(langSelect){
    langSelect.addEventListener('change', (e) => {
      const v = e.target.value === 'en' ? 'en' : 'ar';
      __applyLang(v);
    });
  }
})();

const cardUsers = document.getElementById('cardUsers');
if (cardUsers) {
  cardUsers.addEventListener('click', () => {
    window.location.href = '../users/index.html';
  });
}

const cardPermissions = document.getElementById('cardPermissions');
if (cardPermissions) {
  cardPermissions.addEventListener('click', () => {
    window.location.href = '../permissions/index.html';
  });
}

const cardProducts = document.getElementById('cardProducts');
if (cardProducts) {
  cardProducts.addEventListener('click', () => {
    window.location.href = '../products/index.html';
  });
}

// Hide/disable cards by permissions (from DB at runtime)
(async function applyPermissions(){
  let keys = [];
  try{
    const u = JSON.parse(localStorage.getItem('pos_user')||'null');
    if(u && u.id){
      const r = await window.api.perms_get_for_user(u.id);
      if(r && r.ok){ keys = r.keys || []; }
    }
  }catch(_){ keys = []; }
  const need = {
    cardUsers: 'users',
    cardPermissions: 'permissions',
    cardCustomers: 'customers',
    cardNewInvoice: 'sales',
    cardInvoices: 'invoices',
    cardCreditNotes: 'credit_notes',
    cardPayments: 'payments',
    cardProducts: 'products',
    cardRooms: 'rooms',
    cardTypes: 'types',
    cardSettings: 'settings',
    cardOperations: 'operations',
    cardKitchen: 'kitchen',
    cardPurchases: 'purchases',
    cardInventory: 'inventory',
    cardCustomerPricing: 'customer_pricing',
    cardOffers: 'offers',
    cardDrivers: 'drivers',
    cardReports: 'reports',
    cardZatca: 'zatca',
    cardWhatsApp: 'whatsapp',
  };
  Object.entries(need).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if(!el) return;
    if(!keys.includes(key)){
      el.classList.add('hidden');
      el.removeAttribute('style');
      try{ el.setAttribute('aria-hidden','true'); }catch(_){ }
    } else {
      el.classList.remove('hidden');
      try{ el.removeAttribute('aria-hidden'); }catch(_){ }
    }
  });
  
  try{ ensureMainCardOrder && ensureMainCardOrder(); reindexCards && reindexCards(); }catch(_){ }
})();

const cardTypes = document.getElementById('cardTypes');
if (cardTypes) {
  cardTypes.addEventListener('click', () => {
    window.location.href = '../types/index.html';
  });
}

const cardRooms = document.getElementById('cardRooms');
if (cardRooms) {
  cardRooms.addEventListener('click', () => {
    window.location.href = '../rooms/index.html';
  });
}

const cardCustomers = document.getElementById('cardCustomers');
if (cardCustomers) {
  cardCustomers.addEventListener('click', () => {
    window.location.href = '../customers/index.html';
  });
}

const cardSettings = document.getElementById('cardSettings');
if (cardSettings) {
  cardSettings.addEventListener('click', () => {
    window.location.href = '../settings/index.html';
  });
}

const cardOperations = document.getElementById('cardOperations');
if (cardOperations) {
  cardOperations.addEventListener('click', () => {
    window.location.href = '../operations/index.html';
  });
}

const cardKitchen = document.getElementById('cardKitchen');
if (cardKitchen) {
  cardKitchen.addEventListener('click', () => {
    window.location.href = '../kitchen/index.html';
  });
}

const posBtn = document.getElementById('posBtn');
if (posBtn) {
  posBtn.addEventListener('click', () => {
    window.location.href = '../sales/index.html';
  });
}

const cardNewInvoice = document.getElementById('cardNewInvoice');
if (cardNewInvoice) {
  cardNewInvoice.addEventListener('click', () => {
    window.location.href = '../sales/index.html';
  });
}

const cardInvoices = document.getElementById('cardInvoices');
if (cardInvoices) {
  cardInvoices.addEventListener('click', () => {
    window.location.href = '../invoices/index.html';
  });
}

const cardCreditNotes = document.getElementById('cardCreditNotes');
if (cardCreditNotes) {
  cardCreditNotes.addEventListener('click', () => {
    window.location.href = '../credit_notes/index.html';
  });
}

const cardPayments = document.getElementById('cardPayments');
if (cardPayments) {
  cardPayments.addEventListener('click', () => {
    window.location.href = '../payments/index.html';
  });
}

const cardPurchases = document.getElementById('cardPurchases');
if (cardPurchases) {
  cardPurchases.addEventListener('click', () => {
    window.location.href = '../purchases/index.html';
  });
}

const cardInventory = document.getElementById('cardInventory');
if (cardInventory) {
  cardInventory.addEventListener('click', () => {
    window.location.href = '../inventory/index.html';
  });
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    // خروج من الجلسة وإرجاع إلى شاشة الدخول بدون إغلاق التطبيق
    try{ localStorage.removeItem('pos_user'); localStorage.removeItem('pos_perms'); }catch(_){ }
    window.location.replace('../login/index.html');
  });
}

const cardCustomerPricing = document.getElementById('cardCustomerPricing');
if (cardCustomerPricing) {
  cardCustomerPricing.addEventListener('click', () => {
    window.location.href = '../customer_pricing/index.html';
  });
}

const cardOffers = document.getElementById('cardOffers');
if (cardOffers) {
  cardOffers.addEventListener('click', () => {
    window.location.href = '../offers/index.html';
  });
}

const cardDrivers = document.getElementById('cardDrivers');
if (cardDrivers) {
  cardDrivers.addEventListener('click', () => {
    window.location.href = '../drivers/index.html';
  });
}

const cardReports = document.getElementById('cardReports');
if (cardReports) {
  cardReports.addEventListener('click', () => {
    window.location.href = '../reports/index.html';
  });
}

// ZATCA card navigation
const cardZatca = document.getElementById('cardZatca');
if (cardZatca) {
  cardZatca.addEventListener('click', async () => {
    // Prefer Electron navigation if available; fallback to direct href
    try {
      if (window.electronAPI?.navigation?.goTo) {
        const r = await window.electronAPI.navigation.goTo('zatca');
        if (!r || r.ok !== true) throw new Error('nav failed');
      } else {
        window.location.href = '../zatca/index.html';
      }
    } catch (_) {
      window.location.href = '../zatca/index.html';
    }
  });
}

const cardWhatsApp = document.getElementById('cardWhatsApp');
if (cardWhatsApp) {
  cardWhatsApp.addEventListener('click', () => {
    window.location.href = '../whatsapp/index.html';
  });
}

// تبديل أماكن "فاتورة جديدة" و"العملاء" وجعل "الإعدادات" أخيراً
function ensureMainCardOrder(){
  try{
    const container = document.querySelector('.cards');
    if(!container) return;

    const isVisible = (el) => el && !el.classList.contains('hidden');

    const newInv = document.getElementById('cardNewInvoice');
    const customers = document.getElementById('cardCustomers');

    // Swap positions of New Invoice and Customers if both are visible
    if(isVisible(newInv) && isVisible(customers)){
      const placeholder = document.createElement('div');
      container.insertBefore(placeholder, newInv);
      container.replaceChild(newInv, customers);
      container.replaceChild(customers, placeholder);
    }

    // Keep Settings as the last card
    const settings = document.getElementById('cardSettings');
    if(isVisible(settings)){
      container.appendChild(settings);
    }
  }catch(_){ }
}

// إعادة فهرسة البطاقات المرئية فقط
function reindexCards(){
  const cards = Array.from(document.querySelectorAll('.card')).filter(c=>!c.classList.contains('hidden'));
  cards.forEach((card, index) => {
    card.style.setProperty('--card-index', index);
    // تأكد من إزالة أي ستايل سابق غير مرغوب
    card.style.opacity = '';
    card.style.transform = '';
  });
  // احترام تفضيل تقليل الحركة
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    cards.forEach(card => {
      card.style.animation = 'none';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    });
  }
}

// إضافة تأثير الظهور التدريجي للبطاقات
document.addEventListener('DOMContentLoaded', function() {
  ensureMainCardOrder();
  reindexCards();
});

// F1 keyboard shortcut for POS
document.addEventListener('keydown', function(e) {
  if (e.key === 'F1') {
    e.preventDefault();
    window.location.href = '../sales/index.html';
  }
});