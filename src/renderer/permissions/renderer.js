// Renderer for permissions management

// ── Language support ──────────────────────────────────────────────────────────
const __langKey = 'app_lang';
let __lang = 'ar';

const __T = {
  ar: {
    pageTitle: 'إدارة الصلاحيات - نظام الرابط',
    headerTitle: 'إدارة الصلاحيات',
    headerSubtitle: 'تحكم في صلاحيات المستخدمين',
    backBtn: '⬅ عودة',
    userSelectLabel: '👤 اختر المستخدم:',
    userSelectDefault: 'اختر مستخدمًا',
    selectAll: '✅ تحديد الكل',
    clearAll: '❌ إلغاء الكل',
    saveBtn: '💾 حفظ الصلاحيات',
    adminBadge: '👑 (مدير)',
    noChildren: 'لا توجد عناصر فرعية',
    statusLoading: '⏳ جاري تحميل البيانات...',
    statusReady: '✅ جاهز! اختر مستخدمًا لتعديل صلاحياته',
    statusLoadError: '❌ حدث خطأ أثناء التحميل',
    statusLoadingUser: '⏳ جاري تحميل صلاحيات المستخدم...',
    statusLoadedUser: '✅ تم تحميل الصلاحيات بنجاح',
    statusAdmin: '👑 لا يمكن عرض أو تعديل صلاحيات المدير من الواجهة.',
    statusCashier: '✅ يمكنك تعديل صلاحيات المستخدم الكاشير من القائمة أدناه.',
    statusRoleOnly: '⚠️ تظهر الصلاحيات فقط لمستخدمي دور الكاشير.',
    statusSelectFirst: '⚠️ اختر مستخدمًا أولاً',
    statusSaving: '💾 جاري حفظ الصلاحيات...',
    statusSaveFail: '❌ فشل الحفظ',
    statusSaveOk: '✅ تم حفظ الصلاحيات بنجاح',
    toastLoadUsersFail: 'فشل تحميل المستخدمين',
    toastLoadPermsFail: 'فشل تحميل الصلاحيات',
    toastLoadUserPermsFail: 'فشل تحميل صلاحيات المستخدم',
    toastAdminInfo: 'المديرون لديهم صلاحيات كاملة بشكل افتراضي',
    toastSelectAll: 'تم تحديد جميع الصلاحيات',
    toastClearAll: 'تم إلغاء تحديد جميع الصلاحيات',
    toastSelectFirst: 'الرجاء اختيار مستخدم أولاً',
    toastAdminErr: 'لا يمكن تعديل صلاحيات المدير',
    toastSaveFail: 'فشل حفظ الصلاحيات',
    toastSaveOk: 'تم حفظ الصلاحيات بنجاح!',
    toastLoadError: 'حدث خطأ أثناء تحميل البيانات',
    titleAdminLocked: 'لا يمكن تعديل صلاحيات المدير من الواجهة',
    titleCashierOnly: 'تظهر الصلاحيات فقط لمستخدمي دور الكاشير',
    nameMap: {
      users:'المستخدمون',
      permissions:'الصلاحيات',
      customers:'العملاء',
      sales:'فاتورة جديدة',
      invoices:'الفواتير',
      credit_notes:'الفواتير الدائنة',
      payments:'دفع الفاتورة',
      products:'المنتجات',
      rooms:'الغرف',
      types:'الأنواع الرئيسية',
      settings:'الإعدادات',
      operations:'العمليات',
      kitchen:'طابعات المطبخ',
      purchases:'المشتريات',
      inventory:'إدارة المخزون',
      customer_pricing:'تخصيص أسعار',
      offers:'العروض والكوبونات',
      drivers:'السائقون',
      reports:'التقارير',
      zatca:'الربط - المرحلة الثانية',
      whatsapp:'الواتساب',
      'sales.print':'طباعة الفاتورة',
      'sales.kitchen':'إرسال للمطبخ',
      'sales.clear':'تفريغ',
      'sales.process_invoice':'معالجة الفاتورة',
      'sales.discount':'الخصم',
      'sales.extra':'الإضافى',
      'sales.coupon':'الكوبون',
      'sales.select_customer':'اختيار العميل',
      'sales.select_driver':'اختيار السائق',
      'sales.remove_item':'حذف',
      'sales.edit_qty':'تعديل الكمية',
      'customers.add':'➕ إضافة عميل',
      'customers.edit':'تعديل',
      'customers.toggle':'تفعيل/إيقاف',
      'customers.delete':'حذف',
      'invoices.view':'عرض الفاتورة',
      'users.add':'إضافة مستخدم',
      'users.edit':'تعديل',
      'users.toggle':'تفعيل/إيقاف',
      'users.delete':'حذف',
      'products.add':'➕ إضافة منتج',
      'products.edit':'تعديل',
      'products.toggle':'تفعيل/إيقاف',
      'products.delete':'حذف',
      'products.export_pdf':'🧾 تصدير PDF',
      'products.export_csv':'📄 تصدير CSV',
      'products.reorder':'💾 حفظ ترتيب السطور',
      'rooms.add':'إضافة غرفة',
      'rooms.edit':'تعديل',
      'rooms.delete':'حذف',
      'rooms.open':'فتح الغرفة',
      'types.add':'إضافة نوع رئيسي',
      'types.edit':'✏️ تعديل',
      'types.toggle':'⏸️ إيقاف/▶️ تفعيل',
      'types.delete':'🗑️ حذف',
      'settings.update':'حفظ الإعدادات',
      'settings.reload':'إعادة تحميل',
      'settings.reset_sales':'حذف كل الفواتير',
      'settings.reset_products':'حذف كل المنتجات',
      'settings.reset_customers':'حذف كل العملاء',
      'operations.add':'إضافة عملية',
      'operations.edit':'تعديل',
      'operations.toggle':'تفعيل/إيقاف',
      'operations.delete':'حذف',
      'operations.reorder':'تغيير الترتيب',
      'kitchen.add':'إضافة طابعة',
      'kitchen.edit':'حفظ',
      'kitchen.delete':'حذف',
      'kitchen.test':'طباعة اختبار',
      'purchases.add':'إضافة',
      'purchases.edit':'تعديل',
      'purchases.delete':'حذف',
      'purchases.export_csv':'تصدير CSV',
      'purchases.export_pdf':'تصدير PDF',
      'inventory.add':'عنصر مخزون جديد',
      'inventory.edit':'تعديل',
      'inventory.toggle':'تفعيل/إيقاف',
      'inventory.delete':'حذف',
      'inventory.bom_edit':'تعديل مكونات المنتج',
      'customer_pricing.add':'إضافة',
      'customer_pricing.edit':'تعديل',
      'customer_pricing.delete':'حذف',
      'offers.add_offer':'إضافة عرض',
      'offers.add_global_offer':'إضافة عرض عام',
      'offers.edit_offer':'تعديل عرض',
      'offers.toggle_offer':'تفعيل/إيقاف عرض',
      'offers.delete_offer':'حذف عرض',
      'offers.add_coupon':'إضافة كوبون',
      'offers.edit_coupon':'تعديل كوبون',
      'offers.toggle_coupon':'تفعيل/إيقاف كوبون',
      'offers.delete_coupon':'حذف كوبون',
      'drivers.add':'إضافة',
      'drivers.edit':'حفظ',
      'drivers.toggle':'تنشيط/إيقاف',
      'drivers.delete':'حذف',
      'reports.view_daily':'تقرير يومي',
      'reports.view_period':'تقرير فترة',
      'reports.view_all_invoices':'جميع الفواتير',
      'reports.view_purchases':'تقرير المشتريات',
      'reports.view_customer_invoices':'فواتير عميل',
      'reports.view_credit_invoices':'الفواتير الدائنة',
      'reports.view_unpaid_invoices':'فواتير غير مدفوعة',
      'reports.view_types':'تقرير الأنواع',
      'payments.settle_full':'سداد كامل',
      'payments.view_invoice':'عرض الفاتورة',
      'credit_notes.view':'عرض الإشعار',
      'credit_notes.view_base':'عرض الفاتورة',
      'permissions.manage':'إدارة الصلاحيات',
    },
  },
  en: {
    pageTitle: 'Manage Permissions - Al-Rabit System',
    headerTitle: 'Manage Permissions',
    headerSubtitle: 'Control user permissions',
    backBtn: '⬅ Back',
    userSelectLabel: '👤 Select User:',
    userSelectDefault: 'Choose a user',
    selectAll: '✅ Select All',
    clearAll: '❌ Clear All',
    saveBtn: '💾 Save Permissions',
    adminBadge: '👑 (Admin)',
    noChildren: 'No sub-items',
    statusLoading: '⏳ Loading data...',
    statusReady: '✅ Ready! Select a user to edit their permissions',
    statusLoadError: '❌ An error occurred while loading',
    statusLoadingUser: '⏳ Loading user permissions...',
    statusLoadedUser: '✅ Permissions loaded successfully',
    statusAdmin: '👑 Admin permissions cannot be viewed or modified from the UI.',
    statusCashier: '✅ You can edit this cashier user\'s permissions below.',
    statusRoleOnly: '⚠️ Permissions are shown only for cashier role users.',
    statusSelectFirst: '⚠️ Please select a user first',
    statusSaving: '💾 Saving permissions...',
    statusSaveFail: '❌ Save failed',
    statusSaveOk: '✅ Permissions saved successfully',
    toastLoadUsersFail: 'Failed to load users',
    toastLoadPermsFail: 'Failed to load permissions',
    toastLoadUserPermsFail: 'Failed to load user permissions',
    toastAdminInfo: 'Admins have full permissions by default',
    toastSelectAll: 'All permissions selected',
    toastClearAll: 'All permissions deselected',
    toastSelectFirst: 'Please select a user first',
    toastAdminErr: 'Cannot modify admin permissions',
    toastSaveFail: 'Failed to save permissions',
    toastSaveOk: 'Permissions saved successfully!',
    toastLoadError: 'An error occurred while loading data',
    titleAdminLocked: 'Cannot modify admin permissions from the UI',
    titleCashierOnly: 'Permissions are shown only for cashier role users',
    nameMap: {
      users: 'Users',
      permissions: 'Permissions',
      customers: 'Customers',
      sales: 'New Invoice',
      invoices: 'Invoices',
      credit_notes: 'Credit Notes',
      payments: 'Pay Invoice',
      products: 'Products',
      rooms: 'Rooms',
      types: 'Main Types',
      settings: 'Settings',
      operations: 'Operations',
      kitchen: 'Kitchen Printers',
      purchases: 'Purchases',
      inventory: 'Inventory',
      customer_pricing: 'Customer Pricing',
      offers: 'Offers & Coupons',
      drivers: 'Drivers',
      reports: 'Reports',
      zatca: 'E-Invoice (ZATCA)',
      whatsapp: 'WhatsApp',
      'sales.print': 'Print Invoice',
      'sales.kitchen': 'Send to Kitchen',
      'sales.clear': 'Clear',
      'sales.process_invoice': 'Process Invoice',
      'sales.discount': 'Discount',
      'sales.extra': 'Extra',
      'sales.coupon': 'Coupon',
      'sales.select_customer': 'Select Customer',
      'sales.select_driver': 'Select Driver',
      'sales.remove_item': 'Remove Item',
      'sales.edit_qty': 'Edit Quantity',
      'customers.add': '➕ Add Customer',
      'customers.edit': 'Edit',
      'customers.toggle': 'Activate/Deactivate',
      'customers.delete': 'Delete',
      'invoices.view': 'View Invoice',
      'users.add': 'Add User',
      'users.edit': 'Edit',
      'users.toggle': 'Activate/Deactivate',
      'users.delete': 'Delete',
      'products.add': '➕ Add Product',
      'products.edit': 'Edit',
      'products.toggle': 'Activate/Deactivate',
      'products.delete': 'Delete',
      'products.export_pdf': '🧾 Export PDF',
      'products.export_csv': '📄 Export CSV',
      'products.reorder': '💾 Save Row Order',
      'rooms.add': 'Add Room',
      'rooms.edit': 'Edit',
      'rooms.delete': 'Delete',
      'rooms.open': 'Open Room',
      'types.add': 'Add Main Type',
      'types.edit': '✏️ Edit',
      'types.toggle': '⏸️ Deactivate/▶️ Activate',
      'types.delete': '🗑️ Delete',
      'settings.update': 'Save Settings',
      'settings.reload': 'Reload',
      'settings.reset_sales': 'Delete All Invoices',
      'settings.reset_products': 'Delete All Products',
      'settings.reset_customers': 'Delete All Customers',
      'operations.add': 'Add Operation',
      'operations.edit': 'Edit',
      'operations.toggle': 'Activate/Deactivate',
      'operations.delete': 'Delete',
      'operations.reorder': 'Change Order',
      'kitchen.add': 'Add Printer',
      'kitchen.edit': 'Save',
      'kitchen.delete': 'Delete',
      'kitchen.test': 'Test Print',
      'purchases.add': 'Add',
      'purchases.edit': 'Edit',
      'purchases.delete': 'Delete',
      'purchases.export_csv': 'Export CSV',
      'purchases.export_pdf': 'Export PDF',
      'inventory.add': 'New Inventory Item',
      'inventory.edit': 'Edit',
      'inventory.toggle': 'Activate/Deactivate',
      'inventory.delete': 'Delete',
      'inventory.bom_edit': 'Edit Product Components',
      'customer_pricing.add': 'Add',
      'customer_pricing.edit': 'Edit',
      'customer_pricing.delete': 'Delete',
      'offers.add_offer': 'Add Offer',
      'offers.add_global_offer': 'Add Global Offer',
      'offers.edit_offer': 'Edit Offer',
      'offers.toggle_offer': 'Activate/Deactivate Offer',
      'offers.delete_offer': 'Delete Offer',
      'offers.add_coupon': 'Add Coupon',
      'offers.edit_coupon': 'Edit Coupon',
      'offers.toggle_coupon': 'Activate/Deactivate Coupon',
      'offers.delete_coupon': 'Delete Coupon',
      'drivers.add': 'Add',
      'drivers.edit': 'Save',
      'drivers.toggle': 'Activate/Deactivate',
      'drivers.delete': 'Delete',
      'reports.view_daily': 'Daily Report',
      'reports.view_period': 'Period Report',
      'reports.view_all_invoices': 'All Invoices',
      'reports.view_purchases': 'Purchases Report',
      'reports.view_customer_invoices': 'Customer Invoices',
      'reports.view_credit_invoices': 'Credit Invoices',
      'reports.view_unpaid_invoices': 'Unpaid Invoices',
      'reports.view_types': 'Types Report',
      'payments.settle_full': 'Full Settlement',
      'payments.view_invoice': 'View Invoice',
      'credit_notes.view': 'View Note',
      'credit_notes.view_base': 'View Invoice',
      'permissions.manage': 'Manage Permissions',
    },
  }
};

function t(){ return __T[__lang] || __T['ar']; }

function __applyLang(lang){
  const base = (typeof lang === 'string' ? lang.split('-')[0].toLowerCase() : 'ar');
  __lang = (base === 'en') ? 'en' : 'ar';
  const isAr = __lang === 'ar';
  const T = t();

  document.documentElement.lang = isAr ? 'ar' : 'en';
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';

  const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };

  document.title = T.pageTitle;
  set('headerTitle', T.headerTitle);
  set('headerSubtitle', T.headerSubtitle);
  set('backBtnTxt', T.backBtn);
  set('userSelectLabel', T.userSelectLabel);
  set('selectAllTxt', T.selectAll);
  set('clearAllTxt', T.clearAll);
  set('saveBtnTxt', T.saveBtn);

  try{ localStorage.setItem(__langKey, __lang); }catch(_){ }
}

(function initLang(){
  try{
    const stored = localStorage.getItem(__langKey);
    if(stored){ __applyLang(stored); }
  }catch(_){ }
  (async ()=>{
    try{
      const r = await window.api.app_get_locale();
      const L = (r && r.lang) || 'ar';
      __applyLang(L);
    }catch(_){ }
  })();
  try{
    window.api.app_on_locale_changed((L)=>{ __applyLang(L); });
  }catch(_){ }
})();
// ─────────────────────────────────────────────────────────────────────────────

const userSelect = document.getElementById('userSelect');
const permsGrid = document.getElementById('permsGrid');
const statusEl = document.getElementById('status');
const selectAllBtn = document.getElementById('selectAllBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const saveBtn = document.getElementById('saveBtn');
const backBtn = document.getElementById('backBtn');
const permsWrap = document.getElementById('permsWrap');
if(permsWrap){ permsWrap.style.display = 'none'; }

let allPerms = [];
let currentUserId = null;
let usersMap = new Map();
let currentUserRole = null;

const sessionUser = (()=>{ try{ return JSON.parse(localStorage.getItem('pos_user')||'null'); }catch(_){ return null; }})();

function setStatus(msg){ statusEl.textContent = msg || ''; }

function showToast(message, type = 'success', duration = 3000) {
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.success}</span><span>${message}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 500);
  }, duration);
}

const sectionIcons = {
  users: '👥', permissions: '🔐', customers: '👤', sales: '🧾', invoices: '📄',
  credit_notes: '📃', payments: '💳', products: '📦', rooms: '🏠', types: '📂',
  settings: '⚙️', operations: '⚡', kitchen: '🖨️', purchases: '🛒', inventory: '📊',
  customer_pricing: '💰', offers: '🎁', drivers: '🚗', reports: '📈', zatca: '🔗', whatsapp: '💬'
};

async function loadUsers(){
  const T = t();
  const r = await window.api.users_list();
  if(!r.ok){ 
    setStatus(r.error || T.toastLoadUsersFail); 
    showToast(r.error || T.toastLoadUsersFail, 'error', 4000);
    return; 
  }
  usersMap = new Map((r.items||[]).map(u => [String(u.id), u]));
  const T2 = t();
  userSelect.innerHTML = `<option value="">${T2.userSelectDefault}</option>` + (r.items||[]).map(u =>
    `<option value="${u.id}">${u.full_name||u.username}${(u.role==='admin'||u.role==='super')?' '+T2.adminBadge:''}</option>`
  ).join('');
}

async function loadAllPerms(){
  const T = t();
  const r = await window.api.perms_list_all();
  if(!r.ok){ 
    setStatus(r.error || T.toastLoadPermsFail); 
    showToast(r.error || T.toastLoadPermsFail, 'error', 4000);
    return; 
  }
  allPerms = r.items || [];
}

function renderPerms(selectedKeys){
  const T = t();
  const set = new Set(selectedKeys||[]);
  permsGrid.innerHTML = '';

  const children = {};
  const rootsByKey = {};
  allPerms.forEach(p => {
    if (p.parent_key) {
      (children[p.parent_key] = children[p.parent_key] || []).push(p);
    } else {
      rootsByKey[p.perm_key] = p;
    }
  });

  const rootOrder = [
    'users','permissions','customers','sales','invoices','credit_notes','payments','products',
    'rooms','types','settings','operations','kitchen','purchases','inventory','customer_pricing',
    'offers','drivers','reports','zatca','whatsapp'
  ];

  rootOrder.forEach(key => {
    const root = rootsByKey[key];
    if (!root) return;

    const group = document.createElement('div');
    group.className = 'perm-group';

    const header = document.createElement('div');
    header.className = 'perm-header';

    const left = document.createElement('div');
    const rootLabel = T.nameMap[root.perm_key] || root.name;
    const icon = sectionIcons[root.perm_key] || '📋';
    left.innerHTML = `<label style="display:flex; align-items:center; gap:12px;">
      <input type="checkbox" data-key="${root.perm_key}" ${set.has(root.perm_key)?'checked':''}/>
      <span class="section-icon">${icon}</span>
      <span>${rootLabel}</span>
    </label>`;

    const toggleIcon = document.createElement('span');
    toggleIcon.className = 'toggle-icon';
    toggleIcon.textContent = '🔽';

    header.appendChild(left);
    header.appendChild(toggleIcon);

    const body = document.createElement('div');
    body.className = 'perm-body';
    body.style.display = 'none';

    const kids = children[root.perm_key] || [];
    if (kids.length) {
      const grid = document.createElement('div');
      grid.className = 'grid';
      kids.forEach(ch => {
        const row = document.createElement('label');
        row.className = 'perm';
        const chLabel = T.nameMap[ch.perm_key] || ch.name;
        row.innerHTML = `<input type="checkbox" data-key="${ch.perm_key}" ${set.has(ch.perm_key)?'checked':''}/> <span>${chLabel}</span>`;
        grid.appendChild(row);
      });
      body.appendChild(grid);
    } else {
      const empty = document.createElement('div');
      empty.className = 'muted';
      empty.textContent = T.noChildren;
      body.appendChild(empty);
    }

    const toggleBody = () => {
      const isVisible = body.style.display !== 'none';
      body.style.display = isVisible ? 'none' : 'block';
      header.classList.toggle('expanded', !isVisible);
    };

    header.addEventListener('click', (e) => {
      if(e.target.type === 'checkbox') return;
      toggleBody();
    });

    group.appendChild(header);
    group.appendChild(body);
    permsGrid.appendChild(group);
  });
}

async function loadUserPerms(uid){
  const T = t();
  setStatus(T.statusLoadingUser);
  const r = await window.api.perms_get_for_user(uid);
  if(!r.ok){ 
    setStatus(r.error || T.toastLoadUserPermsFail); 
    showToast(r.error || T.toastLoadUserPermsFail, 'error', 4000);
    return; 
  }
  setStatus(T.statusLoadedUser);
  renderPerms(r.keys||[]);
}

userSelect.addEventListener('change', async () => {
  const T = t();
  currentUserId = userSelect.value ? parseInt(userSelect.value,10) : null;
  currentUserRole = currentUserId ? (usersMap.get(String(currentUserId))?.role || null) : null;

  const isAdminTarget = (currentUserRole === 'admin' || currentUserRole === 'super');
  const showForCashier = (currentUserRole === 'cashier');

  if(permsWrap){ permsWrap.style.display = showForCashier ? '' : 'none'; }

  try{
    document.querySelectorAll('#permsGrid input, #selectAllBtn, #clearAllBtn, #saveBtn').forEach(el => {
      el.disabled = !showForCashier;
      if(isAdminTarget){ el.title = T.titleAdminLocked; }
      else if(!showForCashier){ el.title = T.titleCashierOnly; }
      else { el.removeAttribute('title'); }
    });
  }catch(_){ }

  if(isAdminTarget){
    setStatus(T.statusAdmin);
    showToast(T.toastAdminInfo, 'info', 4000);
  } else if(showForCashier){
    setStatus(T.statusCashier);
  } else if(currentUserId){
    setStatus(T.statusRoleOnly);
  } else {
    setStatus('');
  }

  if(currentUserId && showForCashier){ await loadUserPerms(currentUserId); }
});

selectAllBtn.addEventListener('click', () => {
  document.querySelectorAll('#permsGrid input[type=checkbox]').forEach(ch => ch.checked = true);
  showToast(t().toastSelectAll, 'success', 2000);
});

clearAllBtn.addEventListener('click', () => {
  document.querySelectorAll('#permsGrid input[type=checkbox]').forEach(ch => ch.checked = false);
  showToast(t().toastClearAll, 'warning', 2000);
});

permsGrid.addEventListener('change', (e) => {
  const target = e.target;
  if(!(target instanceof HTMLInputElement) || !target.matches('input[type="checkbox"][data-key]')) return;
  const header = target.closest('.perm-header');
  if(header){
    const group = header.parentElement;
    const body = group?.querySelector('.perm-body');
    if(body){
      body.querySelectorAll('input[type="checkbox"][data-key]').forEach(ch => { ch.checked = target.checked; });
    }
    return;
  }
  const group = target.closest('.perm-group');
  if(group){
    const body = group.querySelector('.perm-body');
    const parentCb = group.querySelector('.perm-header input[type="checkbox"][data-key]');
    if(body && parentCb){
      const anyChecked = !!body.querySelector('input[type="checkbox"][data-key]:checked');
      parentCb.checked = anyChecked;
    }
  }
});

saveBtn.addEventListener('click', async () => {
  const T = t();
  if(!currentUserId){ 
    setStatus(T.statusSelectFirst); 
    showToast(T.toastSelectFirst, 'warning', 3000);
    return; 
  }
  if(currentUserRole === 'admin' || currentUserRole === 'super'){ 
    setStatus(T.statusAdmin); 
    showToast(T.toastAdminErr, 'error', 3000);
    return; 
  }
  const keys = Array.from(document.querySelectorAll('#permsGrid input[type=checkbox]:checked')).map(ch => ch.dataset.key);
  setStatus(T.statusSaving);
  const r = await window.api.perms_set_for_user(currentUserId, keys);
  if(!r.ok){ 
    setStatus(T.statusSaveFail); 
    showToast(r.error || T.toastSaveFail, 'error', 4000);
    return; 
  }
  try{
    if(sessionUser && Number(sessionUser.id) === Number(currentUserId)){
      const fetched = await window.api.perms_get_for_user(currentUserId);
      if(fetched && fetched.ok){ localStorage.setItem('pos_perms', JSON.stringify(fetched.keys||[])); }
    }
  }catch(_){ }
  setStatus(T.statusSaveOk);
  showToast(T.toastSaveOk, 'success', 3000);
});

backBtn.addEventListener('click', () => { window.location.href = '../main/index.html'; });

(async function init(){
  const T = t();
  try{
    setStatus(T.statusLoading);
    await Promise.all([loadUsers(), loadAllPerms()]);
    setStatus(t().statusReady);
  }catch(e){ 
    console.error(e); 
    setStatus(t().statusLoadError); 
    showToast(t().toastLoadError, 'error', 4000);
  }
})();
