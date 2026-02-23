// Customers screen: add/list/edit/toggle/delete

// ========== Language System ==========
const __langKey = 'app_lang';
let __currentLang = {};
function __applyLang(lang) {
  const base = (typeof lang === 'string' ? lang.split('-')[0].toLowerCase() : 'ar');
  const isAr = (base === 'ar');
  const t = {
    pageTitle: isAr ? 'العملاء - POS SA' : 'Customers - POS SA',
    heading: isAr ? 'إدارة العملاء' : 'Customer Management',
    backLong: isAr ? 'العودة للرئيسية' : 'Back to Home',
    backShort: isAr ? 'رئيسية' : 'Home',
    searchPlaceholder: isAr ? 'البحث بالاسم أو رقم الجوال...' : 'Search by name or phone number...',
    addLong: isAr ? 'إضافة عميل جديد' : 'Add New Customer',
    addShort: isAr ? 'إضافة' : 'Add',
    exportExcel: isAr ? 'تصدير Excel' : 'Export Excel',
    rowsLabel: isAr ? '📋 عدد الصفوف:' : '📋 Rows per page:',
    rows20: isAr ? '20 صف' : '20 rows',
    rows50: isAr ? '50 صف' : '50 rows',
    rows100: isAr ? '100 صف' : '100 rows',
    showAll: isAr ? 'عرض الكل' : 'Show All',
    pagerFirst: isAr ? 'الأولى' : 'First',
    pagerPrev: isAr ? 'السابقة' : 'Previous',
    pagerNext: isAr ? 'التالية' : 'Next',
    pagerLast: isAr ? 'الأخيرة' : 'Last',
    pagerFirstTitle: isAr ? 'الانتقال إلى الصفحة الأولى' : 'Go to first page',
    pagerPrevTitle: isAr ? 'الانتقال إلى الصفحة السابقة' : 'Go to previous page',
    pagerNextTitle: isAr ? 'الانتقال إلى الصفحة التالية' : 'Go to next page',
    pagerLastTitle: isAr ? 'الانتقال إلى الصفحة الأخيرة' : 'Go to last page',
    pagerPage: isAr ? 'صفحة' : 'Page',
    pagerOf: isAr ? 'من' : 'of',
    pagerCustomer: isAr ? 'عميل' : 'customers',
    thId: isAr ? '🆔 #' : '🆔 #',
    thName: isAr ? '👤 اسم العميل' : '👤 Customer Name',
    thPhone: isAr ? '📱 رقم الجوال' : '📱 Phone',
    thEmail: isAr ? '📧 البريد الإلكتروني' : '📧 Email',
    thAddress: isAr ? '📍 العنوان' : '📍 Address',
    thStatus: isAr ? '⚡ الحالة' : '⚡ Status',
    thActions: isAr ? '⚙️ العمليات' : '⚙️ Actions',
    statusActive: isAr ? 'نشط' : 'Active',
    statusInactive: isAr ? 'موقوف' : 'Inactive',
    btnEdit: isAr ? 'تعديل' : 'Edit',
    btnEditTitle: isAr ? 'تعديل بيانات العميل' : 'Edit customer',
    btnDeactivate: isAr ? 'إيقاف' : 'Deactivate',
    btnDeactivateTitle: isAr ? 'إيقاف العميل' : 'Deactivate customer',
    btnActivate: isAr ? 'تفعيل' : 'Activate',
    btnActivateTitle: isAr ? 'تفعيل العميل' : 'Activate customer',
    btnDelete: isAr ? 'حذف' : 'Delete',
    btnDeleteTitle: isAr ? 'حذف العميل نهائياً' : 'Delete customer permanently',
    dlgAddTitle: isAr ? '➕ إضافة عميل جديد' : '➕ Add New Customer',
    dlgEditTitle: isAr ? '✏️ تعديل بيانات العميل' : '✏️ Edit Customer',
    labelName: isAr ? '👤 اسم العميل الكامل' : '👤 Full Name',
    labelPhone: isAr ? '📱 رقم الجوال' : '📱 Phone',
    labelEmail: isAr ? '📧 البريد الإلكتروني' : '📧 Email',
    labelAddress: isAr ? '📍 العنوان' : '📍 Address',
    labelVat: isAr ? '🏢 الرقم الضريبي (اختياري)' : '🏢 VAT Number (optional)',
    labelCr: isAr ? '🧾 رقم السجل التجاري (اختياري)' : '🧾 Commercial Register No. (optional)',
    labelNatAddr: isAr ? '🏠 العنوان الوطني (اختياري)' : '🏠 National Address (optional)',
    labelNotes: isAr ? '📝 ملاحظات إضافية' : '📝 Additional Notes',
    placeholderName: isAr ? 'أدخل اسم العميل...' : 'Enter customer name...',
    placeholderPhone: isAr ? 'مثال: 0501234567' : 'e.g. 0501234567',
    placeholderAddress: isAr ? 'أدخل عنوان العميل...' : 'Enter customer address...',
    placeholderNatAddr: isAr ? 'مثال: 1234-حي-مدينة-رمز بريدي' : 'e.g. 1234-District-City-PostalCode',
    placeholderNotes: isAr ? 'أي ملاحظات خاصة بالعميل...' : 'Any notes about the customer...',
    dlgCancel: isAr ? '❌ إلغاء' : '❌ Cancel',
    dlgSave: isAr ? '✅ حفظ البيانات' : '✅ Save',
    confirmTitle: isAr ? 'تأكيد العملية' : 'Confirm Action',
    confirmMessage: isAr ? 'هل أنت متأكد من هذا الإجراء؟' : 'Are you sure you want to proceed?',
    confirmOk: isAr ? 'تأكيد' : 'Confirm',
    confirmCancel: isAr ? 'إلغاء' : 'Cancel',
    deleteConfirmTitle: isAr ? 'تأكيد حذف العميل' : 'Confirm Delete Customer',
    deleteConfirmMsg: isAr
      ? 'هل أنت متأكد من حذف هذا العميل نهائياً؟<br><br><strong>⚠️ تحذير:</strong> لا يمكن التراجع عن هذا الإجراء.'
      : 'Are you sure you want to permanently delete this customer?<br><br><strong>⚠️ Warning:</strong> This action cannot be undone.',
    deleteConfirmOk: isAr ? '🗑️ حذف نهائي' : '🗑️ Delete',
    toastLoadFailed: isAr ? 'تعذر تحميل قائمة العملاء. يرجى المحاولة مرة أخرى.' : 'Failed to load customers. Please try again.',
    toastExportOk: isAr ? '📊 تم تصدير ملف Excel بنجاح' : '📊 Excel file exported successfully',
    toastExportFail: isAr ? 'تعذر إنشاء ملف Excel. يرجى المحاولة مرة أخرى.' : 'Failed to create Excel file. Please try again.',
    toastExportLoadFail: isAr ? 'فشل تحميل العملاء للتصدير' : 'Failed to load customers for export',
    toastFetchFail: isAr ? 'تعذر جلب بيانات العميل. يرجى المحاولة مرة أخرى.' : 'Failed to fetch customer data. Please try again.',
    toastToggleFail: isAr ? 'فشل في تحديث حالة العميل. يرجى المحاولة مرة أخرى.' : 'Failed to update customer status. Please try again.',
    toastToggleOk: isAr ? '✅ تم تحديث حالة العميل بنجاح' : '✅ Customer status updated successfully',
    toastDeleteFail: isAr ? 'فشل في حذف العميل. يرجى المحاولة مرة أخرى.' : 'Failed to delete customer. Please try again.',
    toastDeleteOk: isAr ? '✅ تم حذف العميل بنجاح' : '✅ Customer deleted successfully',
    toastSaveOk_add: isAr ? '✅ تم إضافة العميل بنجاح' : '✅ Customer added successfully',
    toastSaveOk_edit: isAr ? '✅ تم تعديل بيانات العميل بنجاح' : '✅ Customer updated successfully',
    toastSaveFail: isAr ? 'فشل في حفظ بيانات العميل. يرجى المحاولة مرة أخرى.' : 'Failed to save customer data. Please try again.',
    validVat: isAr ? 'الرقم الضريبي يجب أن يكون 15 رقماً بالضبط' : 'VAT number must be exactly 15 digits',
    validName: isAr ? 'يرجى إدخال اسم العميل - هذا الحقل مطلوب' : 'Please enter the customer name - this field is required',
    csvHeaders: isAr
      ? ['#', 'الاسم', 'الجوال', 'البريد', 'العنوان', 'الحالة', 'الرقم الضريبي', 'ملاحظات', 'تاريخ الإضافة']
      : ['#', 'Name', 'Phone', 'Email', 'Address', 'Status', 'VAT Number', 'Notes', 'Created At'],
    csvActive: isAr ? 'نشط' : 'Active',
    csvInactive: isAr ? 'موقوف' : 'Inactive',
  };

  __currentLang = t;

  document.documentElement.lang = isAr ? 'ar' : 'en';
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  document.title = t.pageTitle;

  const headingEl = document.querySelector('header span.text-xl');
  if (headingEl) headingEl.textContent = t.heading;

  const backBtn = document.querySelector('header nav button');
  if (backBtn) {
    const longSpan = backBtn.querySelector('.hidden.sm\\:inline');
    const shortSpan = backBtn.querySelector('.sm\\:hidden');
    if (longSpan) longSpan.textContent = t.backLong;
    if (shortSpan) shortSpan.textContent = t.backShort;
  }

  const qEl = document.getElementById('q');
  if (qEl) qEl.placeholder = t.searchPlaceholder;

  const addBtnEl = document.getElementById('addBtn');
  if (addBtnEl) {
    const longSpan = addBtnEl.querySelector('.hidden.sm\\:inline');
    const shortSpan = addBtnEl.querySelector('.sm\\:hidden');
    if (longSpan) longSpan.textContent = t.addLong;
    if (shortSpan) shortSpan.textContent = t.addShort;
  }

  const exportBtnEl = document.getElementById('exportExcelBtn');
  if (exportBtnEl) {
    const longSpan = exportBtnEl.querySelector('.hidden.sm\\:inline');
    if (longSpan) longSpan.textContent = t.exportExcel;
  }

  const rowsLabelEl = document.querySelector('.flex.items-center.gap-3 span.text-slate-700');
  if (rowsLabelEl) rowsLabelEl.textContent = t.rowsLabel;

  const pageSizeEl = document.getElementById('pageSize');
  if (pageSizeEl && pageSizeEl.options.length >= 4) {
    pageSizeEl.options[0].text = t.rows20;
    pageSizeEl.options[1].text = t.rows50;
    pageSizeEl.options[2].text = t.rows100;
    pageSizeEl.options[3].text = t.showAll;
  }

  const ths = document.querySelectorAll('thead th');
  if (ths.length >= 7) {
    ths[0].textContent = t.thId;
    ths[1].textContent = t.thName;
    ths[2].textContent = t.thPhone;
    ths[3].textContent = t.thEmail;
    ths[4].textContent = t.thAddress;
    ths[5].textContent = t.thStatus;
    ths[6].textContent = t.thActions;
  }

  const dlgTitleEl = document.getElementById('dlgTitle');
  if (dlgTitleEl && !dlgTitleEl.closest('dialog[open]')) dlgTitleEl.textContent = t.dlgAddTitle;

  const dlgLabels = document.querySelectorAll('#dlg label');
  dlgLabels.forEach(label => {
    const txt = label.textContent.trim();
    if (txt.includes('اسم العميل الكامل') || txt.includes('Full Name')) label.textContent = t.labelName;
    else if (txt.includes('رقم الجوال') || txt.includes('Phone')) label.textContent = t.labelPhone;
    else if (txt.includes('البريد الإلكتروني') || txt.includes('Email')) label.textContent = t.labelEmail;
    else if ((txt.includes('العنوان') && !txt.includes('الوطني')) || txt === t.labelAddress) label.textContent = t.labelAddress;
    else if (txt.includes('الرقم الضريبي') || txt.includes('VAT Number')) label.textContent = t.labelVat;
    else if (txt.includes('السجل التجاري') || txt.includes('Commercial Register')) label.textContent = t.labelCr;
    else if (txt.includes('العنوان الوطني') || txt.includes('National Address')) label.textContent = t.labelNatAddr;
    else if (txt.includes('ملاحظات') || txt.includes('Notes')) label.textContent = t.labelNotes;
  });

  const fNameEl = document.getElementById('f_name');
  if (fNameEl) fNameEl.placeholder = t.placeholderName;

  const fPhoneEl = document.getElementById('f_phone');
  if (fPhoneEl) fPhoneEl.placeholder = t.placeholderPhone;

  const fAddrEl = document.getElementById('f_address');
  if (fAddrEl) fAddrEl.placeholder = t.placeholderAddress;

  const fNatAddrEl = document.getElementById('f_nataddr');
  if (fNatAddrEl) fNatAddrEl.placeholder = t.placeholderNatAddr;

  const fNotesEl = document.getElementById('f_notes');
  if (fNotesEl) fNotesEl.placeholder = t.placeholderNotes;

  const dlgCancelEl = document.getElementById('dlgCancel');
  if (dlgCancelEl) dlgCancelEl.textContent = t.dlgCancel;

  const dlgSaveEl = document.getElementById('dlgSave');
  if (dlgSaveEl) dlgSaveEl.textContent = t.dlgSave;

  const confirmTitleEl = document.getElementById('confirmTitle');
  if (confirmTitleEl) confirmTitleEl.textContent = t.confirmTitle;

  const confirmMessageEl = document.getElementById('confirmMessage');
  if (confirmMessageEl) confirmMessageEl.textContent = t.confirmMessage;

  const confirmOkEl = document.getElementById('confirmOk');
  if (confirmOkEl) confirmOkEl.textContent = t.confirmOk;

  const confirmCancelEl = document.getElementById('confirmCancel');
  if (confirmCancelEl) confirmCancelEl.textContent = t.confirmCancel;

  try { localStorage.setItem(__langKey, base); } catch (_) { }
}

(function initLang() {
  (async () => {
    try {
      const r = await window.api.app_get_locale();
      const L = (r && r.lang) || 'ar';
      __applyLang(L);
    } catch (_) {
      __applyLang('ar');
    }
  })();
  try {
    window.api.app_on_locale_changed((L) => {
      __applyLang(L);
      renderRows(__allCustomers);
    });
  } catch (_) { }
})();

const tbody = document.getElementById('tbody');
const errorDiv = document.getElementById('error');
const addBtn = document.getElementById('addBtn');
const exportExcelBtn = document.getElementById('exportExcelBtn');

// ========== Toast Notification System ==========
function showToast(message, type = 'info', duration = 5000) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
  `;
  
  container.appendChild(toast);
  
  // Auto remove after duration
  setTimeout(() => {
    toast.classList.add('hiding');
    if (toast.parentElement) {
      toast.remove();
    }
  }, duration);
}

// ========== Confirmation Dialog ==========
function showConfirm(options) {
  return new Promise((resolve) => {
    const dialog = document.getElementById('confirmDialog');
    const header = document.getElementById('confirmHeader');
    const icon = document.getElementById('confirmIcon');
    const title = document.getElementById('confirmTitle');
    const message = document.getElementById('confirmMessage');
    const okBtn = document.getElementById('confirmOk');
    const cancelBtn = document.getElementById('confirmCancel');
    
    // Set content
    const t = __currentLang;
    icon.textContent = options.icon || '⚠️';
    title.textContent = options.title || (t.confirmTitle||'تأكيد العملية');
    message.innerHTML = options.message || (t.confirmMessage||'هل أنت متأكد من هذا الإجراء؟');
    okBtn.textContent = options.okText || (t.confirmOk||'تأكيد');
    cancelBtn.textContent = options.cancelText || (t.confirmCancel||'إلغاء');
    
    // Set style
    if (options.type === 'danger') {
      header.className = 'bg-red-700 text-white px-6 py-5 rounded-t-3xl flex items-center gap-3';
      okBtn.className = 'px-6 py-2.5 bg-slate-700 text-white rounded-xl font-semibold shadow-md';
    } else {
      header.className = 'bg-blue-700 text-white px-6 py-5 rounded-t-3xl flex items-center gap-3';
      okBtn.className = 'px-6 py-2.5 bg-blue-700 text-white rounded-xl font-semibold shadow-md';
    }
    
    // Handle actions
    const handleOk = () => {
      cleanup();
      resolve(true);
    };
    
    const handleCancel = () => {
      cleanup();
      resolve(false);
    };
    
    const cleanup = () => {
      okBtn.removeEventListener('click', handleOk);
      cancelBtn.removeEventListener('click', handleCancel);
      dialog.close();
    };
    
    okBtn.addEventListener('click', handleOk);
    cancelBtn.addEventListener('click', handleCancel);
    
    dialog.showModal();
  });
}

// Permissions from DB per page load
let __perms = new Set();
async function loadPerms(){
  try{
    const u = JSON.parse(localStorage.getItem('pos_user')||'null');
    if(!u || !u.id) return;
    const r = await window.api.perms_get_for_user(u.id);
    if(r && r.ok){ __perms = new Set(r.keys||[]); }
  }catch(_){ __perms = new Set(); }
}
function canCust(k){ return __perms.has('customers') && __perms.has(k); }
function applyTop(){ if(addBtn && !canCust('customers.add')) addBtn.style.display = 'none'; }
async function initCustomersPage(){ await loadPerms(); applyTop(); await loadCustomers(); }

function toCsvValue(v){ return '"'+String(v??'').replace(/"/g,'""')+'"'; }
function buildCsvFromCustomers(list){
  const t = __currentLang;
  const toAsciiDigits = (s)=> String(s||'').replace(/[\u0660-\u0669]/g, d => String(d.charCodeAt(0) - 0x0660)).replace(/[\u06F0-\u06F9]/g, d => String(d.charCodeAt(0) - 0x06F0));
  const fmtDateTime = (v)=>{
    if(!v) return '';
    try{
      let d = (v instanceof Date) ? v : new Date(String(v).replace(' ', 'T'));
      if(isNaN(d.getTime())) d = new Date(v);
      if(isNaN(d.getTime())) return toAsciiDigits(String(v));
      const pad2 = (n)=> String(n).padStart(2,'0');
      const out = `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
      return toAsciiDigits(out);
    }catch(_){ return toAsciiDigits(String(v)); }
  };
  const headers = (t.csvHeaders) || ['#','الاسم','الجوال','البريد','العنوان','الحالة','الرقم الضريبي','ملاحظات','تاريخ الإضافة'];
  const lines = [ headers.map(toCsvValue).join(',') ];
  list.forEach((c, idx)=>{
    lines.push([
      idx+1,
      c.name||'',
      c.phone||'',
      c.email||'',
      c.address||'',
      (c.is_active ? (t.csvActive||'نشط') : (t.csvInactive||'موقوف')),
      c.vat_number||'',
      c.notes||'',
      fmtDateTime(c.created_at||'')
    ].map(toCsvValue).join(','));
  });
  return lines.join('\n');
}

const dlg = document.getElementById('dlg');
const dlgTitle = document.getElementById('dlgTitle');
const dlgError = document.getElementById('dlgError');
const dlgErrorText = document.getElementById('dlgErrorText');
const f_name = document.getElementById('f_name');
const f_phone = document.getElementById('f_phone');
const f_email = document.getElementById('f_email');
const f_address = document.getElementById('f_address');
const f_vat = document.getElementById('f_vat');
const f_cr = document.getElementById('f_cr');
const f_nataddr = document.getElementById('f_nataddr');
const f_notes = document.getElementById('f_notes');
const dlgSave = document.getElementById('dlgSave');
const dlgCancel = document.getElementById('dlgCancel');

f_phone.addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/[^0-9]/g, '');
});

f_phone.addEventListener('keypress', (e) => {
  if (!/[0-9]/.test(e.key)) {
    e.preventDefault();
  }
});

f_vat.addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/[^0-9]/g, '');
});

f_vat.addEventListener('keypress', (e) => {
  if (!/[0-9]/.test(e.key)) {
    e.preventDefault();
  }
});

f_cr.addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/[^0-9]/g, '');
});

f_cr.addEventListener('keypress', (e) => {
  if (!/[0-9]/.test(e.key)) {
    e.preventDefault();
  }
});

let editId = null;

function setError(msg){ errorDiv.textContent = msg || ''; }
function setDlgError(msg){ 
  if(msg){ 
    dlgErrorText.textContent = msg; 
    dlgError.classList.remove('hidden'); 
  } else { 
    dlgErrorText.textContent = ''; 
    dlgError.classList.add('hidden'); 
  } 
}
function clearDialog(){ 
  f_name.value=''; f_phone.value=''; f_email.value=''; f_address.value=''; f_vat.value=''; f_cr.value=''; f_nataddr.value=''; f_notes.value=''; 
  setDlgError('');
}
function openAddDialog(){ editId=null; dlgTitle.textContent=(__currentLang.dlgAddTitle||'➕ إضافة عميل جديد'); clearDialog(); dlg.showModal(); }
function openEditDialog(item){
  editId=item.id; dlgTitle.textContent=(__currentLang.dlgEditTitle||'✏️ تعديل بيانات العميل');
  f_name.value=item.name||''; f_phone.value=item.phone||''; f_email.value=item.email||'';
  f_address.value=item.address||''; f_vat.value=item.vat_number||''; f_cr.value=item.cr_number||''; f_nataddr.value=item.national_address||''; f_notes.value=item.notes||'';
  setDlgError('');
  dlg.showModal();
}
function closeDialog(){ dlg.close(); }

// pagination state
let __allCustomers = [];
let __custPage = 1;
let __custPageSize = 20;
let __custTotal = 0;

function getPageBtnTitle(action) {
  const t = __currentLang;
  switch(action) {
    case 'first': return t.pagerFirstTitle||'الانتقال إلى الصفحة الأولى';
    case 'prev': return t.pagerPrevTitle||'الانتقال إلى الصفحة السابقة';
    case 'next': return t.pagerNextTitle||'الانتقال إلى الصفحة التالية';
    case 'last': return t.pagerLastTitle||'الانتقال إلى الصفحة الأخيرة';
    default: return '';
  }
}

function renderCustPager(total){
  const t = __currentLang;
  const top = document.getElementById('pagerTop');
  const bottom = document.getElementById('pagerBottom');
  const pages = (__custPageSize && __custPageSize>0) ? Math.max(1, Math.ceil(total/ __custPageSize)) : 1;
  const isAr = (document.documentElement.lang !== 'en');
  const totalStr = isAr ? total.toLocaleString('ar') : total.toLocaleString('en');
  const btn = (label, disabled, go)=>`<button class="px-4 py-2.5 bg-slate-700 text-white rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-md" ${disabled?'disabled':''} data-go="${go}" title="${getPageBtnTitle(go)}">${label}</button>`;
  const html = [
    btn(t.pagerFirst||'الأولى', __custPage<=1, 'first'),
    btn(t.pagerPrev||'السابقة', __custPage<=1, 'prev'),
    `<span class="px-5 py-2.5 bg-white border-2 border-blue-500 rounded-lg text-slate-800 font-black text-sm shadow-md">${t.pagerPage||'صفحة'} ${__custPage} ${t.pagerOf||'من'} ${pages} (${totalStr} ${t.pagerCustomer||'عميل'})</span>`,
    btn(t.pagerNext||'التالية', __custPage>=pages, 'next'),
    btn(t.pagerLast||'الأخيرة', __custPage>=pages, 'last')
  ].join(' ');
  if(top) top.innerHTML = html; if(bottom) bottom.innerHTML = html;
  const onClick = async (e)=>{
    const b = e.target.closest('button'); if(!b) return;
    const act = b.getAttribute('data-go');
    const pages = (__custPageSize && __custPageSize>0) ? Math.max(1, Math.ceil(total/ __custPageSize)) : 1;
    if(act==='first') __custPage=1;
    if(act==='prev') __custPage=Math.max(1,__custPage-1);
    if(act==='next') __custPage=Math.min(pages,__custPage+1);
    if(act==='last') __custPage=pages;
    await loadCustomers();
  };
  if(top) top.onclick = onClick;
  if(bottom) bottom.onclick = onClick;
}

function renderRows(list){
  const t = __currentLang;
  const fragment = document.createDocumentFragment();
  const pageItems = list;
  pageItems.forEach((c, idx) => {
    const tr = document.createElement('tr');
    tr.className = '';
    const actions = [
      canCust('customers.edit') ? `<button class="px-3 py-2 bg-orange-600 text-white rounded-lg text-xs font-bold shadow border border-orange-500" data-act="edit" data-id="${c.id}" title="${t.btnEditTitle||'تعديل بيانات العميل'}">${t.btnEdit||'تعديل'}</button>` : '',
      canCust('customers.toggle') ? `<button class="px-3 py-2 ${c.is_active?'bg-red-600 border-red-500':'bg-green-600 border-green-500'} text-white rounded-lg text-xs font-bold shadow border" data-act="toggle" data-id="${c.id}" title="${c.is_active? (t.btnDeactivateTitle||'إيقاف العميل'):(t.btnActivateTitle||'تفعيل العميل')}">${c.is_active? (t.btnDeactivate||'إيقاف'):(t.btnActivate||'تفعيل')}</button>` : '',
      canCust('customers.delete') ? `<button class="px-3 py-2 bg-slate-700 text-white rounded-lg text-xs font-bold shadow border border-slate-600" data-act="delete" data-id="${c.id}" title="${t.btnDeleteTitle||'حذف العميل نهائياً'}">${t.btnDelete||'حذف'}</button>` : ''
    ].join(' ');
    tr.innerHTML = `
      <td class="px-5 py-4 text-sm text-slate-700 font-bold">${((__custPage-1)*(__custPageSize||pageItems.length))+idx+1}</td>
      <td class="px-5 py-4 text-sm text-slate-800 font-bold">${c.name}</td>
      <td class="px-5 py-4 text-sm text-slate-700 font-semibold">${c.phone||''}</td>
      <td class="px-5 py-4 text-sm text-slate-700 font-semibold">${c.email||''}</td>
      <td class="px-5 py-4 text-sm text-slate-700 font-semibold">${c.address||''}</td>
      <td class="px-5 py-4">${c.is_active ? `<span class="inline-block px-3 py-1.5 bg-green-100 text-green-700 text-xs font-black rounded-full">${t.statusActive||'نشط'}</span>` : `<span class="inline-block px-3 py-1.5 bg-red-100 text-red-700 text-xs font-black rounded-full">${t.statusInactive||'موقوف'}</span>`}</td>
      <td class="px-5 py-4 text-center"><div class="flex items-center justify-center gap-2 flex-wrap">${actions}</div></td>`;
    fragment.appendChild(tr);
  })
  tbody.innerHTML='';
  tbody.appendChild(fragment);
  renderCustPager(__custTotal || pageItems.length);
}

async function loadCustomers(){
  setError('');
  const query = {
    q: (document.getElementById('q')?.value || '').trim(),
    page: __custPage,
    pageSize: __custPageSize
  };
  const res = await window.api.customers_list(query);
  if(!res.ok){ 
    showToast(res.error || (__currentLang.toastLoadFailed||'تعذر تحميل قائمة العملاء. يرجى المحاولة مرة أخرى.'), 'error', 5000);
    return; 
  }
  __allCustomers = res.items || [];
  __custTotal = res.total || (__allCustomers ? __allCustomers.length : 0);
  renderRows(__allCustomers);
}

// init page size control
const pageSizeSel = document.getElementById('pageSize');
if(pageSizeSel){
  pageSizeSel.addEventListener('change', async ()=>{
    const v = Number(pageSizeSel.value||20);
    __custPageSize = v;
    __custPage = 1;
    await loadCustomers();
  });
}

if(addBtn) addBtn.addEventListener('click', () => { if(!canCust('customers.add')) return; openAddDialog(); });

async function fetchAllCustomersForExport(){
  let page = 1;
  const pageSize = 200;
  let all = [];
  const qVal = (document.getElementById('q')?.value || '').trim();
  while(true){
    const res = await window.api.customers_list({ q: qVal, page, pageSize });
    if(!res.ok) throw new Error(res.error || (__currentLang.toastExportLoadFail||'فشل تحميل العملاء للتصدير'));
    const batch = res.items || [];
    all = all.concat(batch);
    const total = res.total || all.length;
    if(all.length >= total || batch.length === 0) break;
    page += 1;
  }
  return all;
}

if(exportExcelBtn){
  exportExcelBtn.addEventListener('click', async ()=>{
    try{
      exportExcelBtn.disabled = true;
      const list = await fetchAllCustomersForExport();
      const csv = buildCsvFromCustomers(list||[]);
      const now = new Date();
      const pad2 = (v)=> String(v).padStart(2,'0');
      const stamp = `${now.getFullYear()}-${pad2(now.getMonth()+1)}-${pad2(now.getDate())}_${pad2(now.getHours())}-${pad2(now.getMinutes())}`;
      const filename = `customers_${stamp}.csv`;
      await window.api.csv_export(csv, { saveMode: 'auto', filename });
      showToast(__currentLang.toastExportOk||'📊 تم تصدير ملف Excel بنجاح', 'success', 3000);
    }catch(e){ 
      console.error(e); 
      showToast(__currentLang.toastExportFail||'تعذر إنشاء ملف Excel. يرجى المحاولة مرة أخرى.', 'error', 5000);
    }
    finally{ exportExcelBtn.disabled = false; }
  });
}

let __searchTimer = null;
const __searchDelay = 300;
const qInput = document.getElementById('q');
if(qInput){
  qInput.addEventListener('input', () => {
    if(__searchTimer) clearTimeout(__searchTimer);
    __searchTimer = setTimeout(async ()=>{
      __custPage = 1;
      await loadCustomers();
    }, __searchDelay);
  });
}

dlgCancel.addEventListener('click', closeDialog);

dlgSave.addEventListener('click', async () => {
  setError('');
  setDlgError('');
  const payload = {
    name: f_name.value.trim(),
    phone: f_phone.value.trim() || null,
    email: f_email.value.trim() || null,
    address: f_address.value.trim() || null,
    vat_number: f_vat.value.trim() || null,
    cr_number: f_cr.value.trim() || null,
    national_address: f_nataddr.value.trim() || null,
    notes: f_notes.value.trim() || null,
  };
  if(payload.vat_number && !/^\d{15}$/.test(payload.vat_number)){ 
    setDlgError(__currentLang.validVat||'الرقم الضريبي يجب أن يكون 15 رقماً بالضبط');
    return; 
  }
  if(!payload.name){ 
    setDlgError(__currentLang.validName||'يرجى إدخال اسم العميل - هذا الحقل مطلوب');
    return; 
  }
  let res;
  const isEdit = !!editId;
  if(editId){ res = await window.api.customers_update(editId, payload); }
  else { res = await window.api.customers_add(payload); }
  if(!res.ok){ 
    setDlgError(res.error || (__currentLang.toastSaveFail||'فشل في حفظ بيانات العميل. يرجى المحاولة مرة أخرى.'));
    return; 
  }
  closeDialog();
  showToast(isEdit ? (__currentLang.toastSaveOk_edit||'✅ تم تعديل بيانات العميل بنجاح') : (__currentLang.toastSaveOk_add||'✅ تم إضافة العميل بنجاح'), 'success', 3000);
  await loadCustomers();
});

tbody.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if(!btn) return;
  const id = Number(btn.dataset.id);
  const act = btn.dataset.act;
  setError('');

  if(act==='edit'){
    if(!canCust('customers.edit')) return;
    const res = await window.api.customers_get(id);
    if(!res.ok){ 
      showToast(res.error || (__currentLang.toastFetchFail||'تعذر جلب بيانات العميل. يرجى المحاولة مرة أخرى.'), 'error', 5000);
      return; 
    }
    openEditDialog(res.item);
  }
  if(act==='toggle'){
    if(!canCust('customers.toggle')) return;
    const res = await window.api.customers_toggle(id);
    if(!res.ok){ 
      showToast(res.error || (__currentLang.toastToggleFail||'فشل في تحديث حالة العميل. يرجى المحاولة مرة أخرى.'), 'error', 5000);
      return; 
    }
    showToast(__currentLang.toastToggleOk||'✅ تم تحديث حالة العميل بنجاح', 'success', 3000);
    await loadCustomers();
  }
  if(act==='delete'){
    if(!canCust('customers.delete')) return;
    
    const confirmed = await showConfirm({
      icon: '🗑️',
      title: __currentLang.deleteConfirmTitle||'تأكيد حذف العميل',
      message: __currentLang.deleteConfirmMsg||'هل أنت متأكد من حذف هذا العميل نهائياً؟<br><br><strong>⚠️ تحذير:</strong> لا يمكن التراجع عن هذا الإجراء.',
      okText: __currentLang.deleteConfirmOk||'🗑️ حذف نهائي',
      cancelText: __currentLang.dlgCancel||'❌ إلغاء',
      type: 'danger'
    });
    
    if(!confirmed) return;
    
    const res = await window.api.customers_delete(id);
    if(!res.ok){ 
      const duration = res.hasInvoices ? 8000 : 5000;
      showToast(res.error || (__currentLang.toastDeleteFail||'فشل في حذف العميل. يرجى المحاولة مرة أخرى.'), 'error', duration);
      return; 
    }
    
    showToast(__currentLang.toastDeleteOk||'✅ تم حذف العميل بنجاح', 'success', 3000);
    await loadCustomers();
  }
});

initCustomersPage();