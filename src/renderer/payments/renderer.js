// Payments screen: list credit invoices and settle fully
const rows = document.getElementById('rows');
const qInput = document.getElementById('q');
const q2Input = document.getElementById('q2');
const dateFrom = document.getElementById('dateFrom');
const dateTo = document.getElementById('dateTo');
const btnSearch = document.getElementById('btnSearch');
const btnClearDates = document.getElementById('btnClearDates');
const btnBack = document.getElementById('btnBack');

const dlgBackdrop = document.getElementById('dlgBackdrop');
const dlgInvNo = document.getElementById('dlgInvNo');
const payMethod = document.getElementById('payMethod');
const rowCash = document.getElementById('rowCash');
const cashVal = document.getElementById('cashVal');
const dlgCancel = document.getElementById('dlgCancel');
const dlgOk = document.getElementById('dlgOk');

let __settings = { default_print_format: 'thermal' };
let __currentSale = null;
let __list = [];
// Pagination state
let __payPage = 1;
let __payPageSize = 50;
let __payTotal = 0;
// Permissions
let __perms = new Set();
async function loadPerms(){
  try{
    const u = JSON.parse(localStorage.getItem('pos_user')||'null');
    if(u && u.id){ const r = await window.api.perms_get_for_user(u.id); if(r && r.ok){ __perms = new Set(r.keys||[]); } }
  }catch(_){ __perms = new Set(); }
}
function canPay(k){ return __perms.has('payments') && __perms.has(k); }
(async()=>{ await loadPerms(); })();

function fmt(a){ return Number(a||0).toFixed(2); }

function showDialog(show){
  if (show) {
    dlgBackdrop.style.animation = '';
    dlgBackdrop.style.display = 'flex';
  } else {
    dlgBackdrop.style.animation = '';
    dlgBackdrop.style.display = 'none';
  }
}

// Helper function to force close dialog
function forceCloseDialog() {
  console.log('Force closing dialog'); // Debug log
  dlgBackdrop.style.animation = '';
  dlgBackdrop.style.display = 'none';
  __currentSale = null;
  cashVal.value = '';
  payMethod.value = 'cash';
  
  // Reset all button states
  dlgOk.disabled = false;
  dlgCancel.disabled = false;
  dlgOk.innerHTML = '<span>✅</span><span>سداد وطباعة</span>';
  
  console.log('Dialog force closed'); // Debug log
}

async function loadSettings(){ try{ const r = await window.api.settings_get(); if(r && r.ok){ __settings = { ...__settings, ...(r.item||{}) }; } }catch(_){}}

function getPageBtnTitle(action) {
  switch(action) {
    case 'first': return 'الانتقال إلى الصفحة الأولى';
    case 'prev': return 'الانتقال إلى الصفحة السابقة';
    case 'next': return 'الانتقال إلى الصفحة التالية';
    case 'last': return 'الانتقال إلى الصفحة الأخيرة';
    default: return '';
  }
}

function renderPayPager(total){
  const top = document.getElementById('pagerTop');
  const bottom = document.getElementById('pagerBottom');
  const pages = (__payPageSize && __payPageSize>0) ? Math.max(1, Math.ceil(total/ __payPageSize)) : 1;
  const btn = (label, disabled, go)=>`<button class="px-4 py-2.5 bg-slate-700 text-white rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-md" ${disabled?'disabled':''} data-go="${go}" title="${getPageBtnTitle(go)}">${label}</button>`;
  const html = [
    btn('الأولى', __payPage<=1, 'first'),
    btn('السابقة', __payPage<=1, 'prev'),
    `<span class="px-5 py-2.5 bg-white border-2 border-blue-500 rounded-lg text-slate-800 font-black text-sm shadow-md">صفحة ${__payPage} من ${pages} (${total.toLocaleString('ar')} فاتورة)</span>`,
    btn('التالية', __payPage>=pages, 'next'),
    btn('الأخيرة', __payPage>=pages, 'last')
  ].join(' ');
  if(top) top.innerHTML = html; if(bottom) bottom.innerHTML = html;
  const onClick = async (e)=>{
    const b = e.target.closest('button'); if(!b) return;
    const act = b.getAttribute('data-go');
    const pages = (__payPageSize && __payPageSize>0) ? Math.max(1, Math.ceil(total/ __payPageSize)) : 1;
    if(act==='first') __payPage=1;
    if(act==='prev') __payPage=Math.max(1,__payPage-1);
    if(act==='next') __payPage=Math.min(pages,__payPage+1);
    if(act==='last') __payPage=pages;
    await load();
  };
  if(top) top.onclick = onClick;
  if(bottom) bottom.onclick = onClick;
}

function render(items){
  __list = items || [];
  rows.innerHTML = '';
  
  if(!items || !items.length){ 
    rows.innerHTML = '<tr><td colspan="7" class="px-5 py-12 text-center text-slate-500"><div class="text-5xl mb-3 opacity-50">💰</div><div class="font-bold text-lg">لا توجد فواتير آجلة حالياً</div><div class="text-sm mt-2 opacity-70">جميع الفواتير مدفوعة 🎉</div></td></tr>'; 
    renderPayPager(0);
    return; 
  }
  
  items.forEach((s, index) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50';
    tr.innerHTML = `
      <td class="px-5 py-4 text-sm text-blue-700 font-black">#${s.invoice_no}</td>
      <td class="px-5 py-4 text-sm text-slate-800 font-bold">${s.customer_name ? s.customer_name : '<span class="text-slate-400 italic font-normal">غير محدد</span>'}</td>
      <td class="px-5 py-4 text-sm text-slate-700 font-semibold">${s.customer_phone ? s.customer_phone : '<span class="text-slate-400 italic font-normal">غير محدد</span>'}</td>
      <td class="px-5 py-4 text-sm text-green-700 font-black">${fmt(s.grand_total)}</td>
      <td class="px-5 py-4 text-sm text-slate-700 font-semibold">${new Date(s.created_at).toLocaleDateString('en-US')}</td>
      <td class="px-5 py-4"><span class="inline-block px-3 py-1.5 bg-yellow-100 text-yellow-800 text-xs font-black rounded-full">⏳ آجل - غير مدفوعة</span></td>
      <td class="px-5 py-4 text-center">
        <div class="flex items-center justify-center gap-2 flex-wrap">
          <button data-act="settle" data-id="${s.id}" class="px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg text-xs font-bold shadow-md border border-green-500" title="سداد كامل للفاتورة">💳 سداد كامل</button>
          <button data-act="view" data-id="${s.id}" class="px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-xs font-bold shadow-md border border-blue-500" title="عرض تفاصيل الفاتورة">👁️ عرض</button>
        </div>
      </td>
    `;
    rows.appendChild(tr);
  });
  
  // Hide unauthorized action buttons per permissions
  try{
    if(!canPay('payments.settle_full')){ 
      rows.querySelectorAll('button[data-act="settle"]').forEach(b=>b.remove()); 
    }
    if(!canPay('payments.view_invoice')){ 
      rows.querySelectorAll('button[data-act="view"]').forEach(b=>b.remove()); 
    }
  }catch(_){ }
  
  if(!rows.__inited){ 
    rows.addEventListener('click', onRowsClick); 
    rows.__inited = true; 
  }
  
  renderPayPager(__payTotal || items.length);
}

function onRowsClick(e){
  const b = e.target.closest('button'); 
  if(!b) return;
  
  const act = b.getAttribute('data-act');
  const id = Number(b.getAttribute('data-id')||0);
  if(!id) return;
  
  if(act==='settle'){
    if(!canPay('payments.settle_full')) {
      window.__showPaymentToast && window.__showPaymentToast('ليس لديك صلاحية سداد الفواتير', 'warning');
      return;
    }
    
    const sale = __list.find(x=>Number(x.id)===id);
    if(sale) {
      openSettleDialog(sale);
    }
  } else if(act==='view'){
    if(!canPay('payments.view_invoice')) {
      window.__showPaymentToast && window.__showPaymentToast('ليس لديك صلاحية عرض الفواتير', 'warning');
      return;
    }
    
    const page = 'print.html'; // A4 removed
    const sale = __list.find(x=>Number(x.id)===id) || {};
    const method = String(sale.payment_method||'');
    const cash = (method==='cash' && sale.settled_cash != null) ? Number(sale.settled_cash) : 0;
    const params = new URLSearchParams({ id: String(id), preview: '1', ...(method?{pay:method}:{}) , ...(cash?{cash:String(cash)}:{}) });
    const url = `../sales/${page}?${params.toString()}`;
    const w = 500; const h = 700;
    
    window.open(url, 'INVOICE_VIEW', `width=${w},height=${h}`);
    window.__showPaymentToast && window.__showPaymentToast('تم فتح الفاتورة في نافذة جديدة', 'info');
  }
}

// Maintain a local state so date filters apply only when user presses Search
const __state = { date_from: null, date_to: null };

async function load(){
  try {
    const filters = {
      q: (qInput.value||'').trim() || null,
      customer_q: (q2Input.value||'').trim() || null,
      date_from: __state.date_from,
      date_to: __state.date_to,
      page: __payPage,
      pageSize: __payPageSize
    };
    
    const r = await window.api.sales_list_credit(filters);
    
    if(!r || !r.ok){ 
      rows.innerHTML = '<tr><td colspan="7" class="px-5 py-12 text-center text-red-600"><div class="text-5xl mb-3">❌</div><div class="font-bold text-lg">تعذر تحميل فواتير الآجل</div><div class="text-sm mt-2 opacity-70">تحقق من اتصال الإنترنت وحاول مرة أخرى</div></td></tr>'; 
      window.__showPaymentToast && window.__showPaymentToast('فشل في تحميل البيانات', 'error');
      renderPayPager(0);
      return; 
    }
    
    __payTotal = r.total || (r.items ? r.items.length : 0);
    render(r.items||[]);
  } catch (error) {
    rows.innerHTML = '<tr><td colspan="7" class="px-5 py-12 text-center text-red-600"><div class="text-5xl mb-3">❌</div><div class="font-bold text-lg">حدث خطأ غير متوقع</div></td></tr>';
    window.__showPaymentToast && window.__showPaymentToast('حدث خطأ غير متوقع', 'error');
    renderPayPager(0);
  }
}

function openSettleDialog(sale){
  __currentSale = sale;
  
  // Reset dialog state completely
  dlgInvNo.textContent = `#${sale.invoice_no}`;
  payMethod.value = 'cash';
  cashVal.value = '';
  rowCash.style.display = '';
  rowCash.style.opacity = '1';
  rowCash.style.transform = 'translateY(0)';
  
  // Reset button states
  dlgOk.disabled = false;
  dlgCancel.disabled = false;
  dlgOk.style.opacity = '1';
  dlgOk.innerHTML = '<span>✅</span><span>سداد وطباعة</span>';
  
  // Clear any existing animations
  dlgBackdrop.style.animation = '';
  
  // Show dialog instantly
  dlgBackdrop.style.animation = '';
  dlgBackdrop.style.display = 'flex';
  
  // Focus immediately
  payMethod.focus();
  
  window.__showPaymentToast && window.__showPaymentToast(`جاري تحضير سداد الفاتورة #${sale.invoice_no}`, 'info');
}

payMethod.addEventListener('change', ()=>{
  // No transitions or delays
  rowCash.style.transition = '';
  
  if(payMethod.value === 'cash'){
    rowCash.style.display = '';
    rowCash.style.opacity = '';
    rowCash.style.transform = '';
    cashVal.focus();
    window.__showPaymentToast && window.__showPaymentToast('يمكنك تحديد المبلغ المستلم أو تركه فارغاً للمبلغ الكامل', 'info');
  } else {
    rowCash.style.display = 'none';
    rowCash.style.opacity = '';
    rowCash.style.transform = '';
    cashVal.value = '';
    const methodNames = { card: 'شبكة', tamara: 'تمارا', tabby: 'تابي' };
    window.__showPaymentToast && window.__showPaymentToast(`تم اختيار طريقة الدفع: ${methodNames[payMethod.value]}`, 'info');
  }
});

dlgCancel.addEventListener('click', (event)=>{ 
  console.log('Cancel button clicked'); // Debug log
  
  // Prevent any other click events
  event.preventDefault();
  event.stopPropagation();
  
  // Close immediately without animations
  forceCloseDialog();
  window.__showPaymentToast && window.__showPaymentToast('تم إلغاء عملية السداد', 'info');
});

async function doSettle(){
  if(!__currentSale) return;
  
  // Add loading state
  dlgOk.disabled = true;
  dlgCancel.disabled = true;
  dlgOk.style.opacity = '0.6';
  
  try {
    const method = payMethod.value;
    let cash = 0;
    
    if(method==='cash'){
      const v = (cashVal.value||'').trim();
      const total = Number(__currentSale.grand_total||0);
      cash = v==='' ? total : Number(v);
      if(isNaN(cash) || cash < 0){ 
        window.__showPaymentToast && window.__showPaymentToast('قيمة غير صحيحة للمبلغ', 'warning');
        return; 
      }
      if(cash < total){
        window.__showPaymentToast && window.__showPaymentToast(`لا يمكن سداد مبلغ أقل من قيمة الفاتورة (${total.toFixed(2)})`, 'warning');
        cashVal.focus();
        return;
      }
    }
    
    const r = await window.api.sales_settle_full({ sale_id: __currentSale.id, method, cash });
    
    if(!r || !r.ok){ 
      window.__showPaymentToast && window.__showPaymentToast(r?.error||'تعذر تسوية الفاتورة', 'error');
      return; 
    }
    
    // Update button state briefly (no animations)
    dlgOk.innerHTML = '✅ تم السداد بنجاح!';
    
    // Print immediately
    try{
      let url = `../sales/print.html?id=${encodeURIComponent(__currentSale.id)}&pay=${encodeURIComponent(method)}&cash=${encodeURIComponent(String(cash))}`; // A4 removed
      try{
        const settingsRes = await window.api.settings_get();
        if(settingsRes && settingsRes.ok && settingsRes.item){
          const copies = Math.max(1, Number(settingsRes.item.print_copies || (settingsRes.item.print_two_copies ? 2 : 1)));
          if(copies > 1){ url += `&copies=${encodeURIComponent(String(copies))}`; }
        }
      }catch(_){}
      const w = 500; const h = 700;
      window.open(url, 'PRINT', `width=${w},height=${h},menubar=no,toolbar=no,location=no,status=no`);
      window.__showPaymentToast && window.__showPaymentToast(`تم سداد الفاتورة #${__currentSale.invoice_no} بنجاح وإرسالها للطباعة`, 'success');
    }catch(_){ 
      window.__showPaymentToast && window.__showPaymentToast(`تم سداد الفاتورة #${__currentSale.invoice_no} بنجاح`, 'success');
    }
    
    // Close instantly and reload
    showDialog(false);
    __currentSale = null;
    load(); // Reload the list
    
  } catch (error) {
    window.__showPaymentToast && window.__showPaymentToast('حدث خطأ غير متوقع', 'error');
  } finally {
    // Remove loading state immediately
    dlgOk.style.opacity = '1';
    dlgOk.disabled = false;
    dlgCancel.disabled = false;
    dlgOk.innerHTML = '<span>✅</span><span>سداد وطباعة</span>';
  }
}

dlgOk.addEventListener('click', doSettle);

// Close dialog when clicking on backdrop
dlgBackdrop.addEventListener('click', (event) => {
  if (event.target === dlgBackdrop) {
    console.log('Backdrop clicked - closing dialog'); // Debug log
    forceCloseDialog();
    window.__showPaymentToast && window.__showPaymentToast('تم إلغاء عملية السداد', 'info');
  }
});

// Close dialog with ESC key
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && dlgBackdrop.style.display === 'flex') {
    event.preventDefault();
    console.log('ESC pressed - closing dialog'); // Debug log
    forceCloseDialog();
    window.__showPaymentToast && window.__showPaymentToast('تم إلغاء عملية السداد', 'info');
  }
});

btnSearch.addEventListener('click', ()=>{
  __state.date_from = dateFrom.value || null;
  __state.date_to = dateTo.value || null;
  
  load();
});

btnClearDates.addEventListener('click', ()=>{
  dateFrom.value = '';
  dateTo.value = '';
  __state.date_from = null;
  __state.date_to = null;
  
  load();
  window.__showPaymentToast && window.__showPaymentToast('تم مسح المرشحات', 'info');
});

btnBack.addEventListener('click', ()=>{
  window.location.href = '../main/index.html';
});

// Page size control
const pageSizeSel = document.getElementById('pageSize');
if(pageSizeSel){
  pageSizeSel.addEventListener('change', async ()=>{
    const v = Number(pageSizeSel.value||20);
    __payPageSize = v;
    __payPage = 1;
    await load();
  });
}

// Live filtering with faster debounce on text inputs
function debounce(fn, delay=150){ let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), delay); }; }
const trigger = debounce(()=>{ __payPage = 1; load(); }, 150);
qInput.addEventListener('input', trigger);
q2Input.addEventListener('input', trigger);

// Dates no longer auto-trigger load; they apply only when pressing Search
// Keep listeners minimal to avoid accidental reloads

// ESC clears the active field and reloads immediately
[qInput, q2Input, dateFrom, dateTo].forEach(el=>{
  el.addEventListener('keydown', (e)=>{
    if(e.key==='Escape'){
      el.value='';
      load();
    }
  });
});

// Double-click on date to clear and reload
;[dateFrom, dateTo].forEach(inp=>{
  inp.addEventListener('dblclick', ()=>{ inp.value=''; load(); });
});

(async function init(){ 
  // Show welcome message immediately for faster startup
  setTimeout(() => {
    window.__showPaymentToast && window.__showPaymentToast('مرحباً بك في شاشة دفع الفواتير الآجلة', 'info');
  }, 200);
  
  await loadSettings(); 
  await load(); 
})();