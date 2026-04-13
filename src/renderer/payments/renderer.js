const __langKey = 'app_lang';
let __lang = 'ar';

const __T = {
  ar: {
    pageTitle: 'دفع الفاتورة الآجلة',
    headerTitleLg: 'دفع الفاتورة الآجلة',
    headerTitleSm: 'دفع آجل',
    btnBackLg: 'العودة للرئيسية',
    btnBackSm: 'رئيسية',
    searchTitle: 'البحث والتصفية',
    btnSearch: 'بحث',
    btnClear: 'مسح',
    labelInvNo: 'رقم الفاتورة',
    placeholderInvNo: 'رقم الفاتورة...',
    labelCustomerSearch: 'بحث بالعميل',
    placeholderCustomer: 'جوال، اسم، أو رقم ضريبي...',
    labelDateFrom: 'من',
    labelDateTo: 'إلى',
    labelPageSize: 'عدد الصفوف:',
    thInvNo: '🧾 رقم الفاتورة',
    thCustomer: '👤 العميل',
    thPhone: '📱 الجوال',
    thTotal: '💰 الإجمالي',
    thRemaining: '📉 المتبقي',
    thDate: '📅 التاريخ',
    thStatus: '🏷️ الحالة',
    thActions: '⚡ الإجراءات',
    dlgTitle: 'سداد كامل للفاتورة',
    dlgLabelInvNo: 'رقم الفاتورة',
    dlgLabelPayMethod: 'طريقة السداد',
    optCash: '💵 كاش',
    optCard: '💳 شبكة',
    optTamara: '🛍️ تمارا',
    optTabby: '📱 تابي',
    dlgLabelCashAmt: 'المبلغ المستلم',
    placeholderCash: 'اتركه فارغ = إجمالي الفاتورة',
    dlgCancel: 'إلغاء',
    dlgOk: 'سداد وطباعة',
    pagerFirst: 'الأولى',
    pagerPrev: 'السابقة',
    pagerNext: 'التالية',
    pagerLast: 'الأخيرة',
    pagerFirstTitle: 'الانتقال إلى الصفحة الأولى',
    pagerPrevTitle: 'الانتقال إلى الصفحة السابقة',
    pagerNextTitle: 'الانتقال إلى الصفحة التالية',
    pagerLastTitle: 'الانتقال إلى الصفحة الأخيرة',
    pagerLabel: (page, pages, total) => `صفحة ${page} من ${pages} (${total.toLocaleString('ar')} فاتورة)`,
    notSpecified: 'غير محدد',
    statusDeferred: 'آجل - غير مدفوعة',
    statusPartial: (paid) => `مدفوع جزئياً (${fmt(paid)})`,
    btnSettle: '💳 سداد كامل',
    btnPartial: '💰 دفع جزئي',
    btnView: '👁️ عرض',
    emptyState: '<div class="text-5xl mb-3 opacity-50">💰</div><div class="font-bold text-lg">لا توجد فواتير آجلة حالياً</div><div class="text-sm mt-2 opacity-70">جميع الفواتير مدفوعة 🎉</div>',
    errLoad: '<div class="text-5xl mb-3">❌</div><div class="font-bold text-lg">تعذر تحميل فواتير الآجل</div><div class="text-sm mt-2 opacity-70">تحقق من اتصال الإنترنت وحاول مرة أخرى</div>',
    errUnexpected: '<div class="text-5xl mb-3">❌</div><div class="font-bold text-lg">حدث خطأ غير متوقع</div>',
    toastWelcome: 'مرحباً بك في شاشة دفع الفواتير الآجلة',
    toastCancelSettle: 'تم إلغاء عملية السداد',
    toastNoPermSettle: 'ليس لديك صلاحية سداد الفواتير',
    toastNoPermView: 'ليس لديك صلاحية عرض الفواتير',
    toastInvoiceOpened: 'تم فتح الفاتورة في نافذة جديدة',
    toastPreparingSettle: (no) => `جاري تحضير سداد الفاتورة #${no}`,
    toastCashHint: 'يمكنك تحديد المبلغ المستلم أو تركه فارغاً للمبلغ الكامل',
    toastMethodSelected: (name) => `تم اختيار طريقة الدفع: ${name}`,
    methodNames: { cash: 'كاش', card: 'شبكة', tamara: 'تمارا', tabby: 'تابي', bank_transfer: 'تحويل بنكي' },
    toastInvalidAmount: 'قيمة غير صحيحة للمبلغ',
    toastAmountLow: (total) => `لا يمكن سداد مبلغ أقل من قيمة الفاتورة (${total.toFixed(2)})`,
    toastSettleFail: (err) => err || 'تعذر تسوية الفاتورة',
    toastSettleSuccess: (no) => `تم سداد الفاتورة #${no} بنجاح وإرسالها للطباعة`,
    toastSettleSuccessNoPrint: (no) => `تم سداد الفاتورة #${no} بنجاح`,
    toastLoadFail: 'فشل في تحميل البيانات',
    toastUnexpected: 'حدث خطأ غير متوقع',
    toastFiltersCleared: 'تم مسح المرشحات',
    dlgOkDone: '✅ تم السداد بنجاح!',
    partialNoHistory: 'لا توجد دفعات مسجلة',
    partialDialogTitle: 'دفع جزئي',
    partialRequired: 'أدخل مبلغًا صحيحًا للدفع الجزئي',
    partialOverRemaining: 'المبلغ أكبر من المتبقي على الفاتورة',
    partialSuccess: 'تم تسجيل الدفعة الجزئية بنجاح',
    partialSettledSuccess: 'تم سداد الفاتورة بالكامل من خلال الدفعة الأخيرة',
    partialHistoryDate: 'التاريخ',
    partialHistoryMethod: 'الطريقة',
    partialHistoryAmount: 'المبلغ',
    partialHistoryNotes: 'ملاحظات',
    partialNoNotes: '-'
  },
  en: {
    pageTitle: 'Pay Deferred Invoice',
    headerTitleLg: 'Pay Deferred Invoice',
    headerTitleSm: 'Deferred Pay',
    btnBackLg: 'Back to Home',
    btnBackSm: 'Home',
    searchTitle: 'Search & Filter',
    btnSearch: 'Search',
    btnClear: 'Clear',
    labelInvNo: 'Invoice No.',
    placeholderInvNo: 'Invoice number...',
    labelCustomerSearch: 'Search by Customer',
    placeholderCustomer: 'Phone, name, or tax number...',
    labelDateFrom: 'From',
    labelDateTo: 'To',
    labelPageSize: 'Rows per page:',
    thInvNo: '🧾 Invoice No.',
    thCustomer: '👤 Customer',
    thPhone: '📱 Phone',
    thTotal: '💰 Total',
    thRemaining: '📉 Remaining',
    thDate: '📅 Date',
    thStatus: '🏷️ Status',
    thActions: '⚡ Actions',
    dlgTitle: 'Full Invoice Settlement',
    dlgLabelInvNo: 'Invoice No.',
    dlgLabelPayMethod: 'Payment Method',
    optCash: '💵 Cash',
    optCard: '💳 Card',
    optTamara: '🛍️ Tamara',
    optTabby: '📱 Tabby',
    dlgLabelCashAmt: 'Amount Received',
    placeholderCash: 'Leave empty = full invoice total',
    dlgCancel: 'Cancel',
    dlgOk: 'Settle & Print',
    pagerFirst: 'First',
    pagerPrev: 'Prev',
    pagerNext: 'Next',
    pagerLast: 'Last',
    pagerFirstTitle: 'Go to first page',
    pagerPrevTitle: 'Go to previous page',
    pagerNextTitle: 'Go to next page',
    pagerLastTitle: 'Go to last page',
    pagerLabel: (page, pages, total) => `Page ${page} of ${pages} (${total.toLocaleString('en')} invoices)`,
    notSpecified: 'N/A',
    statusDeferred: 'Deferred - Unpaid',
    statusPartial: (paid) => `Partially paid (${fmt(paid)})`,
    btnSettle: '💳 Full Settle',
    btnPartial: '💰 Partial Pay',
    btnView: '👁️ View',
    emptyState: '<div class="text-5xl mb-3 opacity-50">💰</div><div class="font-bold text-lg">No deferred invoices</div><div class="text-sm mt-2 opacity-70">All invoices are paid 🎉</div>',
    errLoad: '<div class="text-5xl mb-3">❌</div><div class="font-bold text-lg">Failed to load deferred invoices</div><div class="text-sm mt-2 opacity-70">Check your connection and try again</div>',
    errUnexpected: '<div class="text-5xl mb-3">❌</div><div class="font-bold text-lg">An unexpected error occurred</div>',
    toastWelcome: 'Welcome to the Deferred Invoices screen',
    toastCancelSettle: 'Settlement cancelled',
    toastNoPermSettle: 'You do not have permission to settle invoices',
    toastNoPermView: 'You do not have permission to view invoices',
    toastInvoiceOpened: 'Invoice opened in a new window',
    toastPreparingSettle: (no) => `Preparing settlement for invoice #${no}`,
    toastCashHint: 'You can set the received amount or leave it empty for the full total',
    toastMethodSelected: (name) => `Payment method selected: ${name}`,
    methodNames: { cash: 'Cash', card: 'Card', tamara: 'Tamara', tabby: 'Tabby', bank_transfer: 'Bank transfer' },
    toastInvalidAmount: 'Invalid amount value',
    toastAmountLow: (total) => `Cannot settle an amount less than the invoice total (${total.toFixed(2)})`,
    toastSettleFail: (err) => err || 'Failed to settle invoice',
    toastSettleSuccess: (no) => `Invoice #${no} settled successfully and sent to print`,
    toastSettleSuccessNoPrint: (no) => `Invoice #${no} settled successfully`,
    toastLoadFail: 'Failed to load data',
    toastUnexpected: 'An unexpected error occurred',
    toastFiltersCleared: 'Filters cleared',
    dlgOkDone: '✅ Settled successfully!',
    partialNoHistory: 'No payments recorded',
    partialDialogTitle: 'Partial payment',
    partialRequired: 'Enter a valid partial payment amount',
    partialOverRemaining: 'Payment amount exceeds remaining balance',
    partialSuccess: 'Partial payment recorded successfully',
    partialSettledSuccess: 'Invoice fully settled by the last payment',
    partialHistoryDate: 'Date',
    partialHistoryMethod: 'Method',
    partialHistoryAmount: 'Amount',
    partialHistoryNotes: 'Notes',
    partialNoNotes: '-'
  }
};

function t(){ return __T[__lang] || __T.ar; }
function fmt(a){ return Number(a || 0).toFixed(2); }
function money(a){ return Number(Number(a || 0).toFixed(2)); }
function remainingOf(sale){ return Math.max(0, money(Number(sale?.grand_total || 0) - Number(sale?.amount_paid || 0))); }

function __applyLang(lang){
  const base = (typeof lang === 'string' ? lang.split('-')[0].toLowerCase() : 'ar');
  __lang = base === 'en' ? 'en' : 'ar';
  const isAr = __lang === 'ar';
  const T = t();
  document.documentElement.lang = isAr ? 'ar' : 'en';
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  const setAttr = (id, attr, val) => { const el = document.getElementById(id); if(el) el.setAttribute(attr, val); };
  document.title = T.pageTitle;
  set('headerTitleLg', T.headerTitleLg);
  set('headerTitleSm', T.headerTitleSm);
  set('btnBackLg', T.btnBackLg);
  set('btnBackSm', T.btnBackSm);
  set('searchTitle', T.searchTitle);
  set('btnSearchTxt', T.btnSearch);
  set('btnClearTxt', T.btnClear);
  set('labelInvNo', T.labelInvNo);
  setAttr('q', 'placeholder', T.placeholderInvNo);
  set('labelCustomerSearch', T.labelCustomerSearch);
  setAttr('q2', 'placeholder', T.placeholderCustomer);
  set('labelDateFrom', T.labelDateFrom);
  set('labelDateTo', T.labelDateTo);
  set('labelPageSize', T.labelPageSize);
  set('thInvNo', T.thInvNo);
  set('thCustomer', T.thCustomer);
  set('thPhone', T.thPhone);
  set('thTotal', T.thTotal);
  set('thRemaining', T.thRemaining);
  set('thDate', T.thDate);
  set('thStatus', T.thStatus);
  set('thActions', T.thActions);
  set('dlgTitle', T.dlgTitle);
  set('dlgLabelInvNo', T.dlgLabelInvNo);
  set('dlgLabelPayMethod', T.dlgLabelPayMethod);
  set('optCash', T.optCash);
  set('optCard', T.optCard);
  set('optTamara', T.optTamara);
  set('optTabby', T.optTabby);
  set('dlgLabelCashAmt', T.dlgLabelCashAmt);
  setAttr('cashVal', 'placeholder', T.placeholderCash);
  set('dlgCancelTxt', T.dlgCancel);
  set('dlgOkTxt', T.dlgOk);
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
      __applyLang((r && r.lang) || 'ar');
    }catch(_){ }
  })();
  try{ window.api.app_on_locale_changed((L)=>__applyLang(L)); }catch(_){ }
})();

const rows = document.getElementById('rows');
const qInput = document.getElementById('q');
const q2Input = document.getElementById('q2');
const dateFrom = document.getElementById('dateFrom');
const dateTo = document.getElementById('dateTo');
const btnSearch = document.getElementById('btnSearch');
const btnClearDates = document.getElementById('btnClearDates');
const btnBack = document.getElementById('btnBack');
const pageSizeSel = document.getElementById('pageSize');

const dlgBackdrop = document.getElementById('dlgBackdrop');
const dlgInvNo = document.getElementById('dlgInvNo');
const payMethod = document.getElementById('payMethod');
const rowCash = document.getElementById('rowCash');
const cashVal = document.getElementById('cashVal');
const dlgCancel = document.getElementById('dlgCancel');
const dlgOk = document.getElementById('dlgOk');

const dlgPartial = document.getElementById('dlgPartial');
const dlgPartialInvNo = document.getElementById('dlgPartialInvNo');
const dlgPartialTotal = document.getElementById('dlgPartialTotal');
const dlgPartialPaid = document.getElementById('dlgPartialPaid');
const dlgPartialRemaining = document.getElementById('dlgPartialRemaining');
const dlgPartialHistoryRows = document.getElementById('dlgPartialHistoryRows');
const partialAmount = document.getElementById('partialAmount');
const partialMethod = document.getElementById('partialMethod');
const dlgPartialCancel = document.getElementById('dlgPartialCancel');
const dlgPartialPay = document.getElementById('dlgPartialPay');
const dlgPartialSettleAll = document.getElementById('dlgPartialSettleAll');

let __settings = { default_print_format: 'thermal' };
let __currentSale = null;
let __currentPartialSale = null;
let __list = [];
let __payPage = 1;
let __payPageSize = 20;
let __payTotal = 0;
let __perms = new Set();

async function loadPerms(){
  try{
    const u = JSON.parse(localStorage.getItem('pos_user') || 'null');
    if(u && u.id){
      const r = await window.api.perms_get_for_user(u.id);
      if(r && r.ok){ __perms = new Set(r.keys || []); }
    }
  }catch(_){ __perms = new Set(); }
}

function canPay(k){ return __perms.has('payments') && __perms.has(k); }

async function loadSettings(){
  try{
    const r = await window.api.settings_get();
    if(r && r.ok){ __settings = { ...__settings, ...(r.item || {}) }; }
  }catch(_){ }
}

function showDialog(show){ dlgBackdrop.style.display = show ? 'flex' : 'none'; }
function showPartialDialog(show){ dlgPartial.style.display = show ? 'flex' : 'none'; }

function forceCloseDialog(){
  __currentSale = null;
  cashVal.value = '';
  payMethod.value = 'cash';
  rowCash.style.display = '';
  dlgOk.disabled = false;
  dlgCancel.disabled = false;
  dlgOk.innerHTML = `<span>✅</span><span id="dlgOkTxt">${t().dlgOk}</span>`;
  showDialog(false);
}

function closePartialDialog(){
  __currentPartialSale = null;
  partialAmount.value = '';
  partialMethod.value = 'cash';
  dlgPartialPay.disabled = false;
  dlgPartialSettleAll.disabled = false;
  dlgPartialCancel.disabled = false;
  showPartialDialog(false);
}

function renderPayPager(total){
  const T = t();
  const top = document.getElementById('pagerTop');
  const bottom = document.getElementById('pagerBottom');
  const pages = (__payPageSize && __payPageSize > 0) ? Math.max(1, Math.ceil(total / __payPageSize)) : 1;
  const btn = (label, disabled, go, title)=>`<button class="px-4 py-2.5 bg-slate-700 text-white rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-md" ${disabled?'disabled':''} data-go="${go}" title="${title}">${label}</button>`;
  const html = [
    btn(T.pagerFirst, __payPage <= 1, 'first', T.pagerFirstTitle),
    btn(T.pagerPrev, __payPage <= 1, 'prev', T.pagerPrevTitle),
    `<span class="px-5 py-2.5 bg-white border-2 border-blue-500 rounded-lg text-slate-800 font-black text-sm shadow-md">${T.pagerLabel(__payPage, pages, total)}</span>`,
    btn(T.pagerNext, __payPage >= pages, 'next', T.pagerNextTitle),
    btn(T.pagerLast, __payPage >= pages, 'last', T.pagerLastTitle)
  ].join(' ');
  if(top) top.innerHTML = html;
  if(bottom) bottom.innerHTML = html;
  const onClick = async (e)=>{
    const b = e.target.closest('button');
    if(!b) return;
    const act = b.getAttribute('data-go');
    if(act === 'first') __payPage = 1;
    if(act === 'prev') __payPage = Math.max(1, __payPage - 1);
    if(act === 'next') __payPage = Math.min(pages, __payPage + 1);
    if(act === 'last') __payPage = pages;
    await load();
  };
  if(top) top.onclick = onClick;
  if(bottom) bottom.onclick = onClick;
}

function render(items){
  const T = t();
  __list = items || [];
  rows.innerHTML = '';
  if(!items || !items.length){
    rows.innerHTML = `<tr><td colspan="8" class="px-5 py-12 text-center text-slate-500">${T.emptyState}</td></tr>`;
    renderPayPager(0);
    return;
  }
  items.forEach((sale) => {
    const tr = document.createElement('tr');
    const paid = money(sale.amount_paid || 0);
    const remaining = remainingOf(sale);
    const statusLabel = paid > 0 ? T.statusPartial(paid) : T.statusDeferred;
    const statusClass = paid > 0
      ? 'bg-amber-100 text-amber-800'
      : 'bg-yellow-100 text-yellow-800';
    const notSpec = `<span class="text-slate-400 italic font-normal">${T.notSpecified}</span>`;
    tr.innerHTML = `
      <td class="px-5 py-4 text-sm text-blue-700 font-black">#${sale.invoice_no}</td>
      <td class="px-5 py-4 text-sm text-slate-800 font-bold">${sale.customer_name ? sale.customer_name : notSpec}</td>
      <td class="px-5 py-4 text-sm text-slate-700 font-semibold">${sale.customer_phone ? sale.customer_phone : notSpec}</td>
      <td class="px-5 py-4 text-sm text-green-700 font-black">${fmt(sale.grand_total)}</td>
      <td class="px-5 py-4 text-sm text-amber-700 font-black">${fmt(remaining)}</td>
      <td class="px-5 py-4 text-sm text-slate-700 font-semibold">${new Date(sale.created_at).toLocaleDateString('en-US')}</td>
      <td class="px-5 py-4"><span class="inline-block px-3 py-1.5 ${statusClass} text-xs font-black rounded-full">${statusLabel}</span></td>
      <td class="px-5 py-4 text-center">
        <div class="flex items-center justify-center gap-2 flex-wrap">
          <button data-act="partial" data-id="${sale.id}" class="px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg text-xs font-bold shadow-md border border-amber-400" title="${T.btnPartial}">${T.btnPartial}</button>
          <button data-act="view" data-id="${sale.id}" class="px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-xs font-bold shadow-md border border-blue-500" title="${T.btnView}">${T.btnView}</button>
        </div>
      </td>
    `;
    rows.appendChild(tr);
  });
  try{
    if(!canPay('payments.settle_full')){
      rows.querySelectorAll('button[data-act="partial"]').forEach((b)=>b.remove());
    }
    if(!canPay('payments.view_invoice')){
      rows.querySelectorAll('button[data-act="view"]').forEach((b)=>b.remove());
    }
  }catch(_){ }
  renderPayPager(__payTotal || items.length);
}

async function load(){
  const T = t();
  try{
    const filters = {
      q: (qInput.value || '').trim() || null,
      customer_q: (q2Input.value || '').trim() || null,
      date_from: __state.date_from,
      date_to: __state.date_to,
      page: __payPage,
      pageSize: __payPageSize
    };
    const r = await window.api.sales_list_credit(filters);
    if(!r || !r.ok){
      rows.innerHTML = `<tr><td colspan="8" class="px-5 py-12 text-center text-red-600">${T.errLoad}</td></tr>`;
      window.__showPaymentToast && window.__showPaymentToast(T.toastLoadFail, 'error');
      renderPayPager(0);
      return;
    }
    __payTotal = r.total || (r.items ? r.items.length : 0);
    render(r.items || []);
  }catch(_){
    rows.innerHTML = `<tr><td colspan="8" class="px-5 py-12 text-center text-red-600">${T.errUnexpected}</td></tr>`;
    window.__showPaymentToast && window.__showPaymentToast(T.toastUnexpected, 'error');
    renderPayPager(0);
  }
}

function openSettleDialog(sale){
  __currentSale = sale;
  dlgInvNo.textContent = `#${sale.invoice_no}`;
  payMethod.value = 'cash';
  cashVal.value = '';
  rowCash.style.display = '';
  dlgOk.disabled = false;
  dlgCancel.disabled = false;
  dlgOk.innerHTML = `<span>✅</span><span id="dlgOkTxt">${t().dlgOk}</span>`;
  showDialog(true);
  window.__showPaymentToast && window.__showPaymentToast(t().toastPreparingSettle(sale.invoice_no), 'info');
}

function renderPartialHistory(payments){
  const T = t();
  if(!payments || !payments.length){
    dlgPartialHistoryRows.innerHTML = `<tr><td colspan="4" class="px-4 py-5 text-center text-slate-400">${T.partialNoHistory}</td></tr>`;
    return;
  }
  dlgPartialHistoryRows.innerHTML = payments.map((payment) => `
    <tr class="border-t border-slate-100">
      <td class="px-4 py-3 text-slate-700 font-semibold">${new Date(payment.paid_at).toLocaleString('en-GB')}</td>
      <td class="px-4 py-3 text-slate-700 font-semibold">${T.methodNames[payment.method] || payment.method}</td>
      <td class="px-4 py-3 text-emerald-700 font-black">${fmt(payment.amount)}</td>
      <td class="px-4 py-3 text-slate-500">${payment.notes || T.partialNoNotes}</td>
    </tr>
  `).join('');
}

async function openPartialDialog(sale){
  __currentPartialSale = { ...sale };
  dlgPartialInvNo.textContent = `#${sale.invoice_no}`;
  dlgPartialTotal.textContent = fmt(sale.grand_total);
  dlgPartialPaid.textContent = fmt(sale.amount_paid || 0);
  dlgPartialRemaining.textContent = fmt(remainingOf(sale));
  partialAmount.value = '';
  partialMethod.value = 'cash';
  renderPartialHistory([]);
  showPartialDialog(true);
  try{
    const res = await window.api.sales_get_payments(sale.id);
    if(res && res.ok){
      renderPartialHistory(res.payments || []);
    }
  }catch(_){ }
}

async function refreshPartialDialogState(updated){
  const sale = __list.find((item) => Number(item.id) === Number(updated.sale_id));
  if(sale){
    sale.amount_paid = updated.amount_paid;
    if(updated.is_fully_paid){
      sale.payment_status = 'paid';
    }
  }
  if(__currentPartialSale && Number(__currentPartialSale.id) === Number(updated.sale_id)){
    __currentPartialSale.amount_paid = updated.amount_paid;
    dlgPartialPaid.textContent = fmt(updated.amount_paid);
    dlgPartialRemaining.textContent = fmt(updated.remaining);
    partialAmount.value = '';
    const paymentsRes = await window.api.sales_get_payments(updated.sale_id);
    if(paymentsRes && paymentsRes.ok){
      renderPartialHistory(paymentsRes.payments || []);
    }
  }
  if(updated.is_fully_paid){
    closePartialDialog();
    await load();
  } else {
    render(__list);
  }
}

async function doPartialPay(forceAmount){
  const T = t();
  if(!__currentPartialSale) return;
  const remaining = remainingOf(__currentPartialSale);
  const amount = forceAmount != null ? money(forceAmount) : money(partialAmount.value);
  if(!(amount > 0)){
    window.__showPaymentToast && window.__showPaymentToast(T.partialRequired, 'warning');
    partialAmount.focus();
    return;
  }
  if(amount > remaining){
    window.__showPaymentToast && window.__showPaymentToast(T.partialOverRemaining, 'warning');
    partialAmount.focus();
    return;
  }
  dlgPartialPay.disabled = true;
  dlgPartialSettleAll.disabled = true;
  dlgPartialCancel.disabled = true;
  try{
    const res = await window.api.sales_pay_partial({
      sale_id: __currentPartialSale.id,
      amount,
      method: partialMethod.value
    });
    if(!res || !res.ok){
      window.__showPaymentToast && window.__showPaymentToast(T.toastSettleFail(res?.error), 'error');
      return;
    }
    window.__showPaymentToast && window.__showPaymentToast(res.is_fully_paid ? T.partialSettledSuccess : T.partialSuccess, 'success');
    await refreshPartialDialogState(res);
  }catch(_){
    window.__showPaymentToast && window.__showPaymentToast(T.toastUnexpected, 'error');
  }finally{
    dlgPartialPay.disabled = false;
    dlgPartialSettleAll.disabled = false;
    dlgPartialCancel.disabled = false;
  }
}

async function doSettle(){
  if(!__currentSale) return;
  const T = t();
  dlgOk.disabled = true;
  dlgCancel.disabled = true;
  dlgOk.style.opacity = '0.6';
  try{
    const method = payMethod.value;
    let cash = 0;
    if(method === 'cash'){
      const v = (cashVal.value || '').trim();
      const total = Number(__currentSale.grand_total || 0);
      cash = v === '' ? total : Number(v);
      if(Number.isNaN(cash) || cash < 0){
        window.__showPaymentToast && window.__showPaymentToast(T.toastInvalidAmount, 'warning');
        return;
      }
      if(cash < total){
        window.__showPaymentToast && window.__showPaymentToast(T.toastAmountLow(total), 'warning');
        cashVal.focus();
        return;
      }
    }
    const r = await window.api.sales_settle_full({ sale_id: __currentSale.id, method, cash });
    if(!r || !r.ok){
      window.__showPaymentToast && window.__showPaymentToast(T.toastSettleFail(r?.error), 'error');
      return;
    }
    dlgOk.innerHTML = T.dlgOkDone;
    try{
      let url = `../sales/print.html?id=${encodeURIComponent(__currentSale.id)}&pay=${encodeURIComponent(String(method))}&cash=${encodeURIComponent(String(cash))}`;
      try{
        const settingsRes = await window.api.settings_get();
        if(settingsRes && settingsRes.ok && settingsRes.item){
          const copies = Math.max(0, Number(settingsRes.item.print_copies != null ? settingsRes.item.print_copies : (settingsRes.item.print_two_copies ? 2 : 1)));
          if(copies !== 1){ url += `&copies=${encodeURIComponent(String(copies))}`; }
        }
      }catch(_){ }
      const pWin = window.open(url, 'PRINT', 'width=500,height=700,menubar=no,toolbar=no,location=no,status=no');
      const h = (e) => {
        if(e.data && e.data.type === 'invoice-after-print') {
          if(pWin) pWin.close();
          window.removeEventListener('message', h);
        }
      };
      window.addEventListener('message', h);
      window.__showPaymentToast && window.__showPaymentToast(T.toastSettleSuccess(__currentSale.invoice_no), 'success');
    }catch(_){
      window.__showPaymentToast && window.__showPaymentToast(T.toastSettleSuccessNoPrint(__currentSale.invoice_no), 'success');
    }
    forceCloseDialog();
    await load();
  }catch(_){
    window.__showPaymentToast && window.__showPaymentToast(T.toastUnexpected, 'error');
  }finally{
    dlgOk.style.opacity = '1';
    dlgOk.disabled = false;
    dlgCancel.disabled = false;
    dlgOk.innerHTML = `<span>✅</span><span id="dlgOkTxt">${t().dlgOk}</span>`;
  }
}

function onRowsClick(e){
  const T = t();
  const b = e.target.closest('button');
  if(!b) return;
  const act = b.getAttribute('data-act');
  const id = Number(b.getAttribute('data-id') || 0);
  if(!id) return;
  const sale = __list.find((item) => Number(item.id) === id);
  if(!sale) return;

  if(act === 'settle'){
    if(!canPay('payments.settle_full')){
      window.__showPaymentToast && window.__showPaymentToast(T.toastNoPermSettle, 'warning');
      return;
    }
    openSettleDialog(sale);
    return;
  }
  if(act === 'partial'){
    if(!canPay('payments.settle_full')){
      window.__showPaymentToast && window.__showPaymentToast(T.toastNoPermSettle, 'warning');
      return;
    }
    openPartialDialog(sale);
    return;
  }
  if(act === 'view'){
    if(!canPay('payments.view_invoice')){
      window.__showPaymentToast && window.__showPaymentToast(T.toastNoPermView, 'warning');
      return;
    }
    const method = String(sale.payment_method || '');
    const cash = (method === 'cash' && sale.settled_cash != null) ? Number(sale.settled_cash) : 0;
    const params = new URLSearchParams({ id: String(id), preview: '1', ...(method ? { pay: method } : {}), ...(cash ? { cash: String(cash) } : {}) });
    window.open(`../sales/print.html?${params.toString()}`, 'INVOICE_VIEW', 'width=500,height=700');
    window.__showPaymentToast && window.__showPaymentToast(T.toastInvoiceOpened, 'info');
  }
}

const __state = { date_from: null, date_to: null };

payMethod.addEventListener('change', ()=>{
  const T = t();
  if(payMethod.value === 'cash'){
    rowCash.style.display = '';
    cashVal.focus();
    window.__showPaymentToast && window.__showPaymentToast(T.toastCashHint, 'info');
  } else {
    rowCash.style.display = 'none';
    cashVal.value = '';
    window.__showPaymentToast && window.__showPaymentToast(T.toastMethodSelected(T.methodNames[payMethod.value] || payMethod.value), 'info');
  }
});

dlgCancel.addEventListener('click', ()=>{
  forceCloseDialog();
  window.__showPaymentToast && window.__showPaymentToast(t().toastCancelSettle, 'info');
});
dlgOk.addEventListener('click', doSettle);

dlgBackdrop.addEventListener('click', (event)=>{
  if(event.target === dlgBackdrop){
    forceCloseDialog();
    window.__showPaymentToast && window.__showPaymentToast(t().toastCancelSettle, 'info');
  }
});

dlgPartialCancel.addEventListener('click', closePartialDialog);
dlgPartialPay.addEventListener('click', ()=>doPartialPay());
dlgPartialSettleAll.addEventListener('click', ()=>{
  if(!__currentPartialSale) return;
  doPartialPay(remainingOf(__currentPartialSale));
});
dlgPartial.addEventListener('click', (event)=>{
  if(event.target === dlgPartial){ closePartialDialog(); }
});

document.addEventListener('keydown', (event)=>{
  if(event.key === 'Escape' && dlgBackdrop.style.display === 'flex'){
    forceCloseDialog();
  }
  if(event.key === 'Escape' && dlgPartial.style.display === 'flex'){
    closePartialDialog();
  }
});

btnSearch.addEventListener('click', ()=>{
  __state.date_from = dateFrom.value || null;
  __state.date_to = dateTo.value || null;
  __payPage = 1;
  load();
});

btnClearDates.addEventListener('click', ()=>{
  dateFrom.value = '';
  dateTo.value = '';
  __state.date_from = null;
  __state.date_to = null;
  __payPage = 1;
  load();
  window.__showPaymentToast && window.__showPaymentToast(t().toastFiltersCleared, 'info');
});

btnBack.addEventListener('click', ()=>{ window.location.href = '../main/index.html'; });
rows.addEventListener('click', onRowsClick);

if(pageSizeSel){
  pageSizeSel.addEventListener('change', async ()=>{
    __payPageSize = Number(pageSizeSel.value || 20);
    __payPage = 1;
    await load();
  });
}

function debounce(fn, delay=150){ let timer; return (...args)=>{ clearTimeout(timer); timer = setTimeout(()=>fn(...args), delay); }; }
const trigger = debounce(()=>{ __payPage = 1; load(); }, 150);
qInput.addEventListener('input', trigger);
q2Input.addEventListener('input', trigger);

[qInput, q2Input, dateFrom, dateTo].forEach((el)=>{
  el.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape'){
      el.value = '';
      __payPage = 1;
      load();
    }
  });
});

[dateFrom, dateTo].forEach((inp)=>{
  inp.addEventListener('dblclick', ()=>{
    inp.value = '';
    __payPage = 1;
    load();
  });
});

(async function init(){
  await loadPerms();
  await loadSettings();
  setTimeout(() => {
    window.__showPaymentToast && window.__showPaymentToast(t().toastWelcome, 'info');
  }, 200);
  await load();
})();
