// Customers screen: add/list/edit/toggle/delete
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
    icon.textContent = options.icon || '⚠️';
    title.textContent = options.title || 'تأكيد العملية';
    message.innerHTML = options.message || 'هل أنت متأكد من هذا الإجراء؟';
    okBtn.textContent = options.okText || 'تأكيد';
    cancelBtn.textContent = options.cancelText || 'إلغاء';
    
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
  const toAsciiDigits = (s)=> String(s||'').replace(/[\u0660-\u0669]/g, d => String(d.charCodeAt(0) - 0x0660)).replace(/[\u06F0-\u06F9]/g, d => String(d.charCodeAt(0) - 0x06F0));
  const fmtDateTime = (v)=>{
    if(!v) return '';
    try{
      // Try to parse; support "YYYY-MM-DD HH:MM:SS" or ISO
      let d = (v instanceof Date) ? v : new Date(String(v).replace(' ', 'T'));
      if(isNaN(d.getTime())) d = new Date(v);
      if(isNaN(d.getTime())) return toAsciiDigits(String(v));
      const pad2 = (n)=> String(n).padStart(2,'0');
      const out = `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
      return toAsciiDigits(out);
    }catch(_){ return toAsciiDigits(String(v)); }
  };
  const headers = ['#','الاسم','الجوال','البريد','العنوان','الحالة','الرقم الضريبي','ملاحظات','تاريخ الإضافة'];
  const lines = [ headers.map(toCsvValue).join(',') ];
  list.forEach((c, idx)=>{
    lines.push([
      idx+1,
      c.name||'',
      c.phone||'',
      c.email||'',
      c.address||'',
      (c.is_active? 'نشط':'موقوف'),
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
function openAddDialog(){ editId=null; dlgTitle.textContent='➕ إضافة عميل جديد'; clearDialog(); dlg.showModal(); }
function openEditDialog(item){
  editId=item.id; dlgTitle.textContent='✏️ تعديل بيانات العميل';
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
  switch(action) {
    case 'first': return 'الانتقال إلى الصفحة الأولى';
    case 'prev': return 'الانتقال إلى الصفحة السابقة';
    case 'next': return 'الانتقال إلى الصفحة التالية';
    case 'last': return 'الانتقال إلى الصفحة الأخيرة';
    default: return '';
  }
}

function renderCustPager(total){
  const top = document.getElementById('pagerTop');
  const bottom = document.getElementById('pagerBottom');
  const pages = (__custPageSize && __custPageSize>0) ? Math.max(1, Math.ceil(total/ __custPageSize)) : 1;
  const btn = (label, disabled, go)=>`<button class="px-4 py-2.5 bg-slate-700 text-white rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-md" ${disabled?'disabled':''} data-go="${go}" title="${getPageBtnTitle(go)}">${label}</button>`;
  const html = [
    btn('الأولى', __custPage<=1, 'first'),
    btn('السابقة', __custPage<=1, 'prev'),
    `<span class="px-5 py-2.5 bg-white border-2 border-blue-500 rounded-lg text-slate-800 font-black text-sm shadow-md">صفحة ${__custPage} من ${pages} (${total.toLocaleString('ar')} عميل)</span>`,
    btn('التالية', __custPage>=pages, 'next'),
    btn('الأخيرة', __custPage>=pages, 'last')
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
  const fragment = document.createDocumentFragment();
  const pageItems = list;
  pageItems.forEach((c, idx) => {
    const tr = document.createElement('tr');
    tr.className = '';
    const actions = [
      canCust('customers.edit') ? `<button class="px-3 py-2 bg-orange-600 text-white rounded-lg text-xs font-bold shadow border border-orange-500" data-act="edit" data-id="${c.id}" title="تعديل بيانات العميل">تعديل</button>` : '',
      canCust('customers.toggle') ? `<button class="px-3 py-2 ${c.is_active?'bg-red-600 border-red-500':'bg-green-600 border-green-500'} text-white rounded-lg text-xs font-bold shadow border" data-act="toggle" data-id="${c.id}" title="${c.is_active? 'إيقاف العميل':'تفعيل العميل'}">${c.is_active? 'إيقاف':'تفعيل'}</button>` : '',
      canCust('customers.delete') ? `<button class="px-3 py-2 bg-slate-700 text-white rounded-lg text-xs font-bold shadow border border-slate-600" data-act="delete" data-id="${c.id}" title="حذف العميل نهائياً">حذف</button>` : ''
    ].join(' ');
    tr.innerHTML = `
      <td class="px-5 py-4 text-sm text-slate-700 font-bold">${((__custPage-1)*(__custPageSize||pageItems.length))+idx+1}</td>
      <td class="px-5 py-4 text-sm text-slate-800 font-bold">${c.name}</td>
      <td class="px-5 py-4 text-sm text-slate-700 font-semibold">${c.phone||''}</td>
      <td class="px-5 py-4 text-sm text-slate-700 font-semibold">${c.email||''}</td>
      <td class="px-5 py-4 text-sm text-slate-700 font-semibold">${c.address||''}</td>
      <td class="px-5 py-4">${c.is_active ? '<span class="inline-block px-3 py-1.5 bg-green-100 text-green-700 text-xs font-black rounded-full">نشط</span>' : '<span class="inline-block px-3 py-1.5 bg-red-100 text-red-700 text-xs font-black rounded-full">موقوف</span>'}</td>
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
    showToast(res.error || 'تعذر تحميل قائمة العملاء. يرجى المحاولة مرة أخرى.', 'error', 5000);
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
    if(!res.ok) throw new Error(res.error || 'فشل تحميل العملاء للتصدير');
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
      showToast('📊 تم تصدير ملف Excel بنجاح', 'success', 3000);
    }catch(e){ 
      console.error(e); 
      showToast('تعذر إنشاء ملف Excel. يرجى المحاولة مرة أخرى.', 'error', 5000);
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
    setDlgError('الرقم الضريبي يجب أن يكون 15 رقماً بالضبط');
    return; 
  }
  if(!payload.name){ 
    setDlgError('يرجى إدخال اسم العميل - هذا الحقل مطلوب');
    return; 
  }
  let res;
  const isEdit = !!editId;
  if(editId){ res = await window.api.customers_update(editId, payload); }
  else { res = await window.api.customers_add(payload); }
  if(!res.ok){ 
    setDlgError(res.error || 'فشل في حفظ بيانات العميل. يرجى المحاولة مرة أخرى.');
    return; 
  }
  closeDialog();
  showToast(isEdit ? '✅ تم تعديل بيانات العميل بنجاح' : '✅ تم إضافة العميل بنجاح', 'success', 3000);
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
      showToast(res.error || 'تعذر جلب بيانات العميل. يرجى المحاولة مرة أخرى.', 'error', 5000);
      return; 
    }
    openEditDialog(res.item);
  }
  if(act==='toggle'){
    if(!canCust('customers.toggle')) return;
    const res = await window.api.customers_toggle(id);
    if(!res.ok){ 
      showToast(res.error || 'فشل في تحديث حالة العميل. يرجى المحاولة مرة أخرى.', 'error', 5000);
      return; 
    }
    showToast('✅ تم تحديث حالة العميل بنجاح', 'success', 3000);
    await loadCustomers();
  }
  if(act==='delete'){
    if(!canCust('customers.delete')) return;
    
    const confirmed = await showConfirm({
      icon: '🗑️',
      title: 'تأكيد حذف العميل',
      message: 'هل أنت متأكد من حذف هذا العميل نهائياً؟<br><br><strong>⚠️ تحذير:</strong> لا يمكن التراجع عن هذا الإجراء.',
      okText: '🗑️ حذف نهائي',
      cancelText: '❌ إلغاء',
      type: 'danger'
    });
    
    if(!confirmed) return;
    
    const res = await window.api.customers_delete(id);
    if(!res.ok){ 
      // رسالة أطول للحالات المهمة (مثل وجود فواتير مرتبطة)
      const duration = res.hasInvoices ? 8000 : 5000;
      showToast(res.error || 'فشل في حذف العميل. يرجى المحاولة مرة أخرى.', 'error', duration);
      return; 
    }
    
    showToast('✅ تم حذف العميل بنجاح', 'success', 3000);
    await loadCustomers();
  }
});

initCustomersPage();