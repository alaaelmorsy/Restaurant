// Renderer for permissions management
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

// خريطة مسميات لعرض أسماء مطابقة تمامًا لمسميات واجهة البرنامج الرئيسية
const nameMap = {
  // الجذور (مطابقة لعناوين بطاقات الشاشة الرئيسية)
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

  // عناصر فرعية (مطابقة نصوص الواجهات)
  // فاتورة جديدة
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

  // العملاء
  'customers.add':'➕ إضافة عميل',
  'customers.edit':'تعديل',
  'customers.toggle':'تفعيل/إيقاف',
  'customers.delete':'حذف',

  // الفواتير
  'invoices.view':'عرض الفاتورة',

  // المستخدمون
  'users.add':'إضافة مستخدم',
  'users.edit':'تعديل',
  'users.toggle':'تفعيل/إيقاف',
  'users.delete':'حذف',

  // المنتجات
  'products.add':'➕ إضافة منتج',
  'products.edit':'تعديل',
  'products.toggle':'تفعيل/إيقاف',
  'products.delete':'حذف',
  'products.export_pdf':'🧾 تصدير PDF',
  'products.export_csv':'📄 تصدير CSV',
  'products.reorder':'💾 حفظ ترتيب السطور',

  // الغرف
  'rooms.add':'إضافة غرفة',
  'rooms.edit':'تعديل',
  'rooms.delete':'حذف',
  'rooms.open':'فتح الغرفة',

  // الأنواع الرئيسية
  'types.add':'إضافة نوع رئيسي',
  'types.edit':'✏️ تعديل',
  'types.toggle':'⏸️ إيقاف/▶️ تفعيل',
  'types.delete':'🗑️ حذف',

  // الإعدادات
  'settings.update':'حفظ الإعدادات',
  'settings.reload':'إعادة تحميل',
  'settings.reset_sales':'حذف كل الفواتير',
  'settings.reset_products':'حذف كل المنتجات',
  'settings.reset_customers':'حذف كل العملاء',

  // العمليات
  'operations.add':'إضافة عملية',
  'operations.edit':'تعديل',
  'operations.toggle':'تفعيل/إيقاف',
  'operations.delete':'حذف',
  'operations.reorder':'تغيير الترتيب',

  // طابعات المطبخ
  'kitchen.add':'إضافة طابعة',
  'kitchen.edit':'حفظ',
  'kitchen.delete':'حذف',
  'kitchen.test':'طباعة اختبار',

  // المشتريات
  'purchases.add':'إضافة',
  'purchases.edit':'تعديل',
  'purchases.delete':'حذف',
  'purchases.export_csv':'تصدير CSV',
  'purchases.export_pdf':'تصدير PDF',

  // إدارة المخزون
  'inventory.add':'عنصر مخزون جديد',
  'inventory.edit':'تعديل',
  'inventory.toggle':'تفعيل/إيقاف',
  'inventory.delete':'حذف',
  'inventory.bom_edit':'تعديل مكونات المنتج',

  // تخصيص أسعار
  'customer_pricing.add':'إضافة',
  'customer_pricing.edit':'تعديل',
  'customer_pricing.delete':'حذف',

  // العروض والكوبونات
  'offers.add_offer':'إضافة عرض',
  'offers.add_global_offer':'إضافة عرض عام',
  'offers.edit_offer':'تعديل عرض',
  'offers.toggle_offer':'تفعيل/إيقاف عرض',
  'offers.delete_offer':'حذف عرض',
  'offers.add_coupon':'إضافة كوبون',
  'offers.edit_coupon':'تعديل كوبون',
  'offers.toggle_coupon':'تفعيل/إيقاف كوبون',
  'offers.delete_coupon':'حذف كوبون',

  // السائقون
  'drivers.add':'إضافة',
  'drivers.edit':'حفظ',
  'drivers.toggle':'تنشيط/إيقاف',
  'drivers.delete':'حذف',

  // التقارير
  'reports.view_daily':'تقرير يومي',
  'reports.view_period':'تقرير فترة',
  'reports.view_all_invoices':'كل الفواتير',
  'reports.view_purchases':'تقرير المشتريات',
  'reports.view_customer_invoices':'فواتير عميل',
  'reports.view_credit_invoices':'الفواتير الدائنة',
  'reports.view_unpaid_invoices':'فواتير غير مدفوعة',
  'reports.view_types':'تقرير الأنواع',

  // دفع الفاتورة
  'payments.settle_full':'سداد كامل',
  'payments.view_invoice':'عرض الفاتورة',

  // الفواتير الدائنة
  'credit_notes.view':'عرض الإشعار',
  'credit_notes.view_base':'عرض الفاتورة',

  // شاشة الصلاحيات
  'permissions.manage':'إدارة الصلاحيات'
};

// Current logged-in user from localStorage (for live update of own permissions)
const sessionUser = (()=>{ try{ return JSON.parse(localStorage.getItem('pos_user')||'null'); }catch(_){ return null; }})();

function setStatus(msg){ statusEl.textContent = msg || ''; }

// Enhanced toast notification system
function showToast(message, type = 'success', duration = 3000) {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.success}</span>
    <span>${message}</span>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 500);
  }, duration);
}

// Section icons mapping
const sectionIcons = {
  users: '👥',
  permissions: '🔐',
  customers: '👤',
  sales: '🧾',
  invoices: '📄',
  credit_notes: '📃',
  payments: '💳',
  products: '📦',
  rooms: '🏠',
  types: '📂',
  settings: '⚙️',
  operations: '⚡',
  kitchen: '🖨️',
  purchases: '🛒',
  inventory: '📊',
  customer_pricing: '💰',
  offers: '🎁',
  drivers: '🚗',
  reports: '📈',
  zatca: '🔗',
  whatsapp: '💬'
};

async function loadUsers(){
  const r = await window.api.users_list();
  if(!r.ok){ 
    setStatus(r.error||'فشل تحميل المستخدمين'); 
    showToast(r.error||'فشل تحميل المستخدمين', 'error', 4000);
    return; 
  }
  // keep a map for quick role lookup
  usersMap = new Map((r.items||[]).map(u => [String(u.id), u]));
  userSelect.innerHTML = '<option value="">اختر مستخدمًا</option>' + (r.items||[]).map(u => `<option value="${u.id}">${u.full_name||u.username}${(u.role==='admin' || u.role==='super')?' 👑 (مدير)':''}</option>`).join('');
}

async function loadAllPerms(){
  const r = await window.api.perms_list_all();
  if(!r.ok){ 
    setStatus(r.error||'فشل تحميل الصلاحيات'); 
    showToast(r.error||'فشل تحميل الصلاحيات', 'error', 4000);
    return; 
  }
  allPerms = r.items || [];
}

function renderPerms(selectedKeys){
  const set = new Set(selectedKeys||[]);
  permsGrid.innerHTML = '';
  // ابني خريطة: parent -> children، ثم اعرض فقط الجذور المطابقة لبطاقات الشاشة الرئيسية وبنفس الترتيب
  const children = {};
  const rootsByKey = {};
  allPerms.forEach(p => {
    if (p.parent_key) {
      (children[p.parent_key] = children[p.parent_key] || []).push(p);
    } else {
      rootsByKey[p.perm_key] = p;
    }
  });

  // ترتيب الجذور حسب الشاشة الرئيسية
  const rootOrder = [
    'users','permissions','customers','sales','invoices','credit_notes','payments','products',
    'rooms','types','settings','operations','kitchen','purchases','inventory','customer_pricing',
    'offers','drivers','reports','zatca','whatsapp'
  ];

  rootOrder.forEach(key => {
    const root = rootsByKey[key];
    if (!root) return; // تخطي أي جذور غير موجودة في النظام

    const group = document.createElement('div');
    group.className = 'perm-group';

    const header = document.createElement('div');
    header.className = 'perm-header';

    const left = document.createElement('div');
    // اعرض الاسم من nameMap إن وجد، وإلا الاسم القادم من القاعدة
    const rootLabel = nameMap[root.perm_key] || root.name;
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
        const chLabel = nameMap[ch.perm_key] || ch.name;
        row.innerHTML = `<input type="checkbox" data-key="${ch.perm_key}" ${set.has(ch.perm_key)?'checked':''}/> <span>${chLabel}</span>`;
        grid.appendChild(row);
      });
      body.appendChild(grid);
    } else {
      const empty = document.createElement('div');
      empty.className = 'muted';
      empty.textContent = 'لا توجد عناصر فرعية';
      body.appendChild(empty);
    }

    const toggleBody = () => {
      const isVisible = body.style.display !== 'none';
      body.style.display = isVisible ? 'none' : 'block';
      header.classList.toggle('expanded', !isVisible);
    };

    header.addEventListener('click', (e) => {
      // Don't toggle if clicking on checkbox
      if(e.target.type === 'checkbox') return;
      toggleBody();
    });

    group.appendChild(header);
    group.appendChild(body);
    permsGrid.appendChild(group);
  });
}

async function loadUserPerms(uid){
  setStatus('⏳ جاري تحميل صلاحيات المستخدم...');
  const r = await window.api.perms_get_for_user(uid);
  if(!r.ok){ 
    setStatus(r.error||'فشل تحميل صلاحيات المستخدم'); 
    showToast(r.error||'فشل تحميل صلاحيات المستخدم', 'error', 4000);
    return; 
  }
  setStatus('✅ تم تحميل الصلاحيات بنجاح');
  renderPerms(r.keys||[]);
}

userSelect.addEventListener('change', async () => {
  currentUserId = userSelect.value ? parseInt(userSelect.value,10) : null;
  currentUserRole = currentUserId ? (usersMap.get(String(currentUserId))?.role || null) : null;

  const isAdminTarget = (currentUserRole === 'admin' || currentUserRole === 'super');
  const showForCashier = (currentUserRole === 'cashier');

  // Show only for cashier, hide otherwise (including admin/super)
  if(permsWrap){ permsWrap.style.display = showForCashier ? '' : 'none'; }

  // Update controls state
  try{
    document.querySelectorAll('#permsGrid input, #selectAllBtn, #clearAllBtn, #saveBtn').forEach(el => {
      el.disabled = !showForCashier;
      if(isAdminTarget){ el.title = 'لا يمكن تعديل صلاحيات المدير من الواجهة'; }
      else if(!showForCashier){ el.title = 'تظهر الصلاحيات فقط لمستخدمي دور الكاشير'; }
      else { el.removeAttribute('title'); }
    });
  }catch(_){ }

  // Informative messages
  if(isAdminTarget){
    setStatus('👑 لا يمكن عرض أو تعديل صلاحيات المدير من الواجهة.');
    showToast('المديرون لديهم صلاحيات كاملة بشكل افتراضي', 'info', 4000);
  } else if(showForCashier){
    setStatus('✅ يمكنك تعديل صلاحيات المستخدم الكاشير من القائمة أدناه.');
  } else if(currentUserId){
    setStatus('⚠️ تظهر الصلاحيات فقط لمستخدمي دور الكاشير.');
  } else {
    setStatus('');
  }

  if(currentUserId && showForCashier){ await loadUserPerms(currentUserId); }
});

selectAllBtn.addEventListener('click', () => {
  document.querySelectorAll('#permsGrid input[type=checkbox]').forEach(ch => ch.checked = true);
  showToast('تم تحديد جميع الصلاحيات', 'success', 2000);
});
clearAllBtn.addEventListener('click', () => {
  document.querySelectorAll('#permsGrid input[type=checkbox]').forEach(ch => ch.checked = false);
  showToast('تم إلغاء تحديد جميع الصلاحيات', 'warning', 2000);
});

// عند تحديد/إلغاء تحديد صلاحية رئيسية، طبّق على الفرعية التابعة لها فقط
// وعند تحديد عنصر فرعي لا يتم التأثير على بقية العناصر، ويُحدّث الجذر اختياريًا
permsGrid.addEventListener('change', (e) => {
  const t = e.target;
  if(!(t instanceof HTMLInputElement) || !t.matches('input[type="checkbox"][data-key]')) return;
  // إذا كان التغيير داخل ترويسة المجموعة => مفتاح رئيسي
  const header = t.closest('.perm-header');
  if(header){
    const group = header.parentElement; // .perm-group
    const body = group?.querySelector('.perm-body');
    if(body){
      body.querySelectorAll('input[type="checkbox"][data-key]').forEach(ch => { ch.checked = t.checked; });
    }
    return;
  }
  // عنصر فرعي: لا نغيّر بقية العناصر، فقط نحدّث حالة الجذر (مؤشر بسيط بدون ثلاثي)
  const group = t.closest('.perm-group');
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
  if(!currentUserId){ 
    setStatus('⚠️ اختر مستخدمًا أولاً'); 
    showToast('الرجاء اختيار مستخدم أولاً', 'warning', 3000);
    return; 
  }
  if(currentUserRole === 'admin' || currentUserRole === 'super'){ 
    setStatus('⚠️ لا يمكن تعديل صلاحيات المدير من الواجهة'); 
    showToast('لا يمكن تعديل صلاحيات المدير', 'error', 3000);
    return; 
  }
  const keys = Array.from(document.querySelectorAll('#permsGrid input[type=checkbox]:checked')).map(ch => ch.dataset.key);
  setStatus('💾 جاري حفظ الصلاحيات...');
  const r = await window.api.perms_set_for_user(currentUserId, keys);
  if(!r.ok){ 
    setStatus('❌ فشل الحفظ'); 
    showToast(r.error||'فشل حفظ الصلاحيات', 'error', 4000);
    return; 
  }
  // If saving permissions for the currently logged-in non-admin user, refresh local storage so main screen hides/shows cards immediately
  try{
    if(sessionUser && Number(sessionUser.id) === Number(currentUserId)){
      const fetched = await window.api.perms_get_for_user(currentUserId);
      if(fetched && fetched.ok){ localStorage.setItem('pos_perms', JSON.stringify(fetched.keys||[])); }
    }
  }catch(_){ }
  setStatus('✅ تم حفظ الصلاحيات بنجاح');
  showToast('تم حفظ الصلاحيات بنجاح!', 'success', 3000);
});

backBtn.addEventListener('click', () => { window.location.href = '../main/index.html'; });

(async function init(){
  try{
    setStatus('⏳ جاري تحميل البيانات...');
    await Promise.all([loadUsers(), loadAllPerms()]);
    setStatus('✅ جاهز! اختر مستخدمًا لتعديل صلاحياته');
  }catch(e){ 
    console.error(e); 
    setStatus('❌ حدث خطأ أثناء التحميل'); 
    showToast('حدث خطأ أثناء تحميل البيانات', 'error', 4000);
  }
})();