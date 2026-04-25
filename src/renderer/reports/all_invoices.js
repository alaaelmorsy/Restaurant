// All invoices report (from/to)
// Displays all documents (invoices + credit notes) within the selected period with totals at the bottom

// Language system
const __langKey = 'app_lang';
let __currentLang = {};
function __applyLang(lang){
  const base = (typeof lang==='string' ? lang.split('-')[0].toLowerCase() : 'ar');
  const isAr = (base==='ar');
  const t = {
    allInvoices: isAr ? 'جميع الفواتير' : 'All Invoices',
    systemTitle: isAr ? 'نظام إدارة المطاعم' : 'Restaurant Management System',
    back: isAr ? 'رجوع' : 'Back',
    from: isAr ? 'من' : 'From',
    to: isAr ? 'إلى' : 'To',
    user: isAr ? 'المستخدم' : 'User',
    allUsers: isAr ? 'الكل' : 'All Users',
    apply: isAr ? 'تطبيق' : 'Apply',
    exportPDF: isAr ? 'تصدير PDF' : 'Export PDF',
    exportExcel: isAr ? 'تصدير Excel' : 'Export Excel',
    print: isAr ? 'طباعة التقرير' : 'Print Report',
    number: isAr ? 'رقم' : 'No.',
    docType: isAr ? 'نوع المستند' : 'Doc. Type',
    customer: isAr ? 'العميل' : 'Customer',
    date: isAr ? 'التاريخ' : 'Date',
    paymentMethod: isAr ? 'طريقة الدفع' : 'Payment Method',
    preVAT: isAr ? 'المبلغ قبل الضريبة' : 'Pre-VAT',
    vat: isAr ? 'الضريبة' : 'VAT',
    total: isAr ? 'الإجمالي' : 'Total',
    view: isAr ? 'عرض' : 'View',
    totals: isAr ? 'الإجماليات' : 'Totals',
    count: isAr ? 'العدد' : 'Count',
    invoice: isAr ? 'فاتورة' : 'Invoice',
    creditNote: isAr ? 'إشعار دائن' : 'Credit Note',
    cash: isAr ? 'نقدًا' : 'Cash',
    network: isAr ? 'شبكة' : 'Network',
    credit: isAr ? 'آجل' : 'Credit',
    tamara: isAr ? 'تمارا' : 'Tamara',
    tabby: isAr ? 'تابي' : 'Tabby',
    mixed: isAr ? 'مختلط' : 'Mixed',
    sectionTitle: isAr ? 'جميع الفواتير ضمن الفترة' : 'All invoices within the period',
    paymentTotalsTitle: isAr ? 'إجماليات طرق الدفع' : 'Payment method totals',
    deliveryCompany: isAr ? 'شركة التوصيل' : 'Delivery company',
    deliveryDiscount: isAr ? 'خصم التوصيل' : 'Delivery discount',
    invoicesCount: isAr ? 'عدد الفواتير:' : 'Invoices count:',
    noData: isAr ? 'لا توجد بيانات' : 'No data',
    noPaymentData: isAr ? 'لا توجد بيانات طرق الدفع ضمن الفترة' : 'No payment method data for the period',
    noDocuments: isAr ? 'لا توجد مستندات ضمن الفترة' : 'No documents within the period',
    partialPaid: isAr ? 'مدفوعة جزئياً' : 'Partially paid',
    unpaid: isAr ? 'غير مدفوعة' : 'Unpaid',
    period: isAr ? 'الفترة:' : 'Period:',
    userLabelShort: isAr ? 'المستخدم:' : 'User:',
    applyRangeFirst: isAr ? 'يرجى تطبيق الفترة أولاً' : 'Please apply the period first',
    applyRangeFirstExport: isAr ? 'يرجى تطبيق الفترة أولاً قبل التصدير' : 'Please apply the period before exporting',
    applyRangeFirstPrint: isAr ? 'يرجى تطبيق الفترة أولاً قبل الطباعة' : 'Please apply the period before printing',
    specifyRange: isAr ? 'يرجى تحديد الفترة كاملة' : 'Please specify the full period',
    printReportTitle: isAr ? 'تقرير جميع الفواتير' : 'All Invoices Report',
    grandTotal: isAr ? 'الإجمالي الكلي' : 'Grand Total',
    page: isAr ? 'صفحة' : 'Page',
    of: isAr ? 'من' : 'of',
    totalInvoices: isAr ? 'فاتورة' : 'invoices',
    first: isAr ? 'الأولى' : 'First',
    last: isAr ? 'الأخيرة' : 'Last',
    exportFailedPdf: isAr ? 'تعذر إنشاء PDF' : 'Failed to create PDF',
    exportFailedExcel: isAr ? 'تعذر إنشاء Excel' : 'Failed to create Excel',
    printFailed: isAr ? 'تعذر الطباعة' : 'Failed to print',
    loadFailed: isAr ? 'تعذر تحميل الفواتير' : 'Failed to load invoices',
    sent: isAr ? 'مُرسل' : 'Sent',
    failed: isAr ? 'فشل' : 'Failed',
    pending: isAr ? 'انتظار' : 'Pending',
    disabled: isAr ? 'غير مفعل' : 'Disabled',
  };

  __currentLang = t;

  document.documentElement.lang = isAr ? 'ar' : 'en';
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';

  document.title = t.allInvoices;
  const pageTitle = document.getElementById('pageHeading');
  if(pageTitle) pageTitle.textContent = t.allInvoices;

  const systemTitle = document.getElementById('systemTitle');
  if(systemTitle) systemTitle.textContent = t.systemTitle;

  const btnBack = document.getElementById('btnBack');
  if(btnBack) btnBack.textContent = t.back;

  const fromLabel = document.getElementById('fromLabel');
  if(fromLabel) fromLabel.textContent = t.from;

  const toLabel = document.getElementById('toLabel');
  if(toLabel) toLabel.textContent = t.to;

  const userLabel = document.getElementById('userLabel');
  if(userLabel) userLabel.textContent = t.user;

  const userFilter = document.getElementById('userFilter');
  if(userFilter && userFilter.options.length > 0) userFilter.options[0].text = t.allUsers;

  const applyBtn = document.getElementById('applyRangeBtn');
  if(applyBtn){ const span = applyBtn.querySelector('span'); applyBtn.innerHTML = ''; if(span) applyBtn.appendChild(span); applyBtn.appendChild(document.createTextNode(' ' + t.apply)); }

  const exportPdfBtn = document.getElementById('exportPdfBtn');
  if(exportPdfBtn){ const span = exportPdfBtn.querySelector('span'); exportPdfBtn.innerHTML = ''; if(span) exportPdfBtn.appendChild(span); exportPdfBtn.appendChild(document.createTextNode(' ' + t.exportPDF)); }

  const exportExcelBtn = document.getElementById('exportExcelBtn');
  if(exportExcelBtn){ const span = exportExcelBtn.querySelector('span'); exportExcelBtn.innerHTML = ''; if(span) exportExcelBtn.appendChild(span); exportExcelBtn.appendChild(document.createTextNode(' ' + t.exportExcel)); }

  const printBtn = document.getElementById('printReportBtn');
  if(printBtn){ const span = printBtn.querySelector('span'); printBtn.innerHTML = ''; if(span) printBtn.appendChild(span); printBtn.appendChild(document.createTextNode(' ' + t.print)); }

  const sectionTitle = document.getElementById('sectionTitle');
  if(sectionTitle) sectionTitle.textContent = t.sectionTitle;

  const paymentTotalsTitle = document.getElementById('paymentTotalsTitle');
  if(paymentTotalsTitle) paymentTotalsTitle.textContent = t.paymentTotalsTitle;

  const tableHeaders = document.querySelectorAll('.grid-table thead th');
  if(tableHeaders.length >= 11){
    tableHeaders[0].textContent = t.number;
    tableHeaders[1].textContent = t.docType;
    tableHeaders[2].textContent = t.customer;
    tableHeaders[3].textContent = t.date;
    tableHeaders[4].textContent = t.paymentMethod;
    tableHeaders[5].textContent = t.preVAT;
    tableHeaders[6].textContent = t.vat;
    tableHeaders[7].textContent = t.total;
    tableHeaders[8].textContent = t.deliveryCompany;
    tableHeaders[9].textContent = t.deliveryDiscount;
    tableHeaders[10].textContent = t.view;
  }

  const footerLabel = document.getElementById('footerTotalsLabel');
  if(footerLabel) footerLabel.textContent = t.totals;

  const footerCountLabel = document.getElementById('footerCountLabel');
  if(footerCountLabel) footerCountLabel.textContent = t.invoicesCount;

  try{ localStorage.setItem(__langKey, base); }catch(_){ }
}

function payMethodLabel(method){
  const t = __currentLang || {};
  const m = String(method||'').toLowerCase();
  if(m==='cash') return t.cash || 'Cash';
  if(m==='card' || m==='network') return t.network || 'Network';
  if(m==='credit') return t.credit || 'Credit';
  if(m==='tamara') return t.tamara || 'Tamara';
  if(m==='tabby') return t.tabby || 'Tabby';
  if(m==='mixed') return t.mixed || 'Mixed';
  return method||'';
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

const fmt = (n)=> Number(n||0).toFixed(2);
const rangeEl = document.getElementById('range');
const fromAtEl = document.getElementById('fromAt');
const toAtEl = document.getElementById('toAt');

const dateFormatter = new Intl.DateTimeFormat('en-GB-u-ca-gregory', {
  year:'numeric', month:'2-digit', day:'2-digit', 
  hour:'2-digit', minute:'2-digit', hour12:true
});

function invoiceStatusLabel(sale){
  const t = __currentLang || {};
  const isCredit = String(sale?.payment_method || '').toLowerCase() === 'credit';
  const isPaid = String(sale?.payment_status || 'paid') === 'paid';
  const paidAmt = Number(sale?.amount_paid || 0);
  if(isCredit && !isPaid && paidAmt > 0){ return t.partialPaid || 'Partially paid'; }
  if(isCredit && !isPaid){ return t.unpaid || 'Unpaid'; }
  return '';
}

function invoiceRecognizedRatio(sale){
  const grand = Math.max(0, Number(sale?.grand_total || 0));
  if(grand <= 0){ return 0; }
  const isCredit = String(sale?.payment_method || '').toLowerCase() === 'credit';
  const isPaid = String(sale?.payment_status || 'paid') === 'paid';
  if(isCredit && !isPaid){
    const paid = Math.max(0, Math.min(grand, Number(sale?.amount_paid || 0)));
    return paid / grand;
  }
  return 1;
}

function recognizedValue(sale, field){
  return Number(sale?.[field] || 0) * invoiceRecognizedRatio(sale);
}

/** أعمدة المبالغ وإجماليات التقرير: فواتير الآجل تُحسب كاملة (مدفوعة/غير مدفوعة/جزئية) وليس الجزء المدفوع فقط */
function allInvoicesRowAmount(sale, field){
  const isCN = (String(sale?.doc_type || '') === 'credit_note' || String(sale?.invoice_no || '').startsWith('CN-'));
  // الإشعارات الدائنة: نُرجع القيمة الأصلية (سالب) مباشرة؛ لا نستخدم recognizedValue
  // لأنها تُحسب grand_total سالب فيقوم Math.max(0, grand) بإرجاع صفر فيُنتج صفوف أصفار.
  if(isCN) return Number(sale?.[field] || 0);
  if(String(sale?.payment_method || '').toLowerCase() === 'credit'){
    return Number(sale?.[field] || 0);
  }
  return recognizedValue(sale, field);
}

function isCreditNoteSale(s){
  return (String(s?.doc_type || '') === 'credit_note' || String(s?.invoice_no || '').startsWith('CN-'));
}

/** فواتير نُحمّل لها invoice_payments: آجل عليها مدفوعات، أو فاتورة جزئية (طريقة الدفع ليست آجل) */
function saleIdsNeedingPaymentRows(allInvoices){
  const ids = new Set();
  if(!Array.isArray(allInvoices)) return [];
  for(const s of allInvoices){
    if(isCreditNoteSale(s)) continue;
    const sid = Number(s.id);
    if(!Number.isFinite(sid) || sid <= 0) continue;
    const ap = Number(s.amount_paid || 0);
    if(ap <= 0) continue;
    const g = Number(s.grand_total || 0);
    const isCredit = String(s.payment_method || '').toLowerCase() === 'credit';
    if(isCredit) ids.add(sid);
    else if(ap < g - 0.009) ids.add(sid);
  }
  return [...ids];
}

/** المبلغ المحصّل لبطاقات «طرق الدفع» (لا يُستخدم إجمالي الفاتورة عند الدفع الجزئي) */
function collectedAmountForPaymentTotals(s, isCN){
  // الإشعارات الدائنة: نستخدم القيمة المطلقة لأن addPayMethodAmount تضرب بـ -1 للإشعارات
  // (تُخزَّن في قاعدة البيانات بقيم سالبة)
  if(isCN) return Math.abs(Number(s.grand_total || 0));
  const g = Math.max(0, Number(s.grand_total || 0));
  const ap = Math.max(0, Number(s.amount_paid || 0));
  const unpaid = String(s.payment_status || 'paid') !== 'paid';
  if(unpaid) return Math.min(g, ap);
  if(ap > 0 && ap < g - 0.009) return ap;
  return g;
}

const PAY_METHOD_KNOWN = new Set(['cash','card','tamara','tabby','bank_transfer','credit']);

async function buildPaymentsBySaleMap(saleIdsForPayments, allInvoices){
  const map = new Map();
  const uniqBatch = [...new Set((saleIdsForPayments || []).map(x => Number(x)).filter(x => Number.isFinite(x) && x > 0))];

  try{
    if(uniqBatch.length && typeof window.api.sales_get_payments_batch === 'function'){
      const res = await window.api.sales_get_payments_batch(uniqBatch);
      if(res && res.ok && Array.isArray(res.payments)){
        for(const p of res.payments){
          const sid = Number(p.sale_id);
          if(!Number.isFinite(sid) || sid <= 0) continue;
          if(!map.has(sid)) map.set(sid, []);
          map.get(sid).push(p);
        }
      }
    }
  }catch(_){}

  // إن فشل الدفعة أو التطبيق قديم: جلب سجل الدفعات لكل فاتورة آjel عليها مبلغ مدفوع ولا يوجد لها صفوف بعد
  if(!Array.isArray(allInvoices) || !allInvoices.length) return map;

  const needFetch = [];
  for(const s of allInvoices){
    if(isCreditNoteSale(s)) continue;
    const sid = Number(s.id);
    if(!Number.isFinite(sid) || sid <= 0) continue;
    if(Number(s.amount_paid||0) <= 0) continue;
    const rows = map.get(sid);
    if(rows && rows.length) continue;
    const isCredit = String(s.payment_method||'').toLowerCase() === 'credit';
    const g = Number(s.grand_total||0);
    const ap = Number(s.amount_paid||0);
    if(isCredit || (ap > 0 && ap < g - 0.009)) needFetch.push(sid);
  }
  const toFetch = [...new Set(needFetch)];
  const CONC = 10;
  for(let i = 0; i < toFetch.length; i += CONC){
    const slice = toFetch.slice(i, i + CONC);
    await Promise.all(slice.map(async (sid) => {
      try{
        if(typeof window.api.sales_get_payments !== 'function') return;
        const r = await window.api.sales_get_payments(sid);
        if(r && r.ok && Array.isArray(r.payments) && r.payments.length){
          map.set(sid, r.payments);
        }
      }catch(_){}
    }));
  }
  return map;
}

function addPayMethodAmount(totalPayTotals, key, amount, isCN){
  if(!key) return;
  const k = String(key).toLowerCase();
  const norm = (k === 'network') ? 'card' : k;
  const prev = Number(totalPayTotals.get(norm)||0);
  totalPayTotals.set(norm, prev + Number(amount||0) * (isCN ? -1 : 1));
}

/** إجماليات طرق الدفع: من invoice_payments عند توفرها؛ وإلا المبلغ المحصّل (جزئي/آجل) لا إجمالي الفاتورة */
function accumulateInvoicePaymentTotals(s, totalPayTotals, paymentsBySale){
  const isCN = isCreditNoteSale(s);
  const pm = String(s.payment_method || '').toLowerCase();
  const collected = collectedAmountForPaymentTotals(s, isCN);
  const list = paymentsBySale.get(Number(s.id)) || [];

  function attributeFromPaymentRows(){
    let sumListed = 0;
    let attributed = 0;
    for(const p of list){
      const amt = Number(p.amount||0);
      sumListed += amt;
      let m = String(p.method ?? '').trim().toLowerCase();
      if(m === 'network') m = 'card';
      if(m && PAY_METHOD_KNOWN.has(m)){
        addPayMethodAmount(totalPayTotals, m, amt, isCN);
        attributed += amt;
      }
    }
    const loose = sumListed - attributed;
    if(loose > 0.009){
      addPayMethodAmount(totalPayTotals, 'credit', loose, isCN);
    }
    const ap = Number(s.amount_paid||0);
    if(ap > sumListed + 0.009){
      const rem = ap - sumListed;
      if(pm === 'credit'){
        addPayMethodAmount(totalPayTotals, 'credit', rem, isCN);
      } else if(pm && PAY_METHOD_KNOWN.has(pm)){
        addPayMethodAmount(totalPayTotals, pm, rem, isCN);
      } else {
        addPayMethodAmount(totalPayTotals, 'credit', rem, isCN);
      }
    }
    // فاتورة آجل غير مسددة: صفوف الدفع تغطي المدفوع فقط؛ أضف المتبقي على الحساب (مطابق لتقارير الفترة/اليومية)
    const gTot = Math.max(0, Number(s.grand_total || 0));
    const apTot = Math.max(0, Number(s.amount_paid || 0));
    if(pm === 'credit' && String(s.payment_status || 'paid') !== 'paid'){
      const covered = Math.max(apTot, sumListed);
      const outstanding = Math.max(0, gTot - covered);
      if(outstanding > 0.009){
        addPayMethodAmount(totalPayTotals, 'credit', outstanding, isCN);
      }
    }
  }

  if(!isCN && list.length){
    attributeFromPaymentRows();
    return;
  }

  if(pm === 'credit' && !isCN){
    const ap = Number(s.amount_paid||0);
    if(ap > 0){
      addPayMethodAmount(totalPayTotals, 'credit', ap, isCN);
    }
    return;
  }

  if(pm==='mixed'){
    const cashPart = Number(s.pay_cash_amount || 0);
    const cardPart = Number(s.pay_card_amount || 0);
    const half = collected > 0 ? collected / 2 : 0;
    addPayMethodAmount(totalPayTotals, 'cash', cashPart>0 ? cashPart : half, isCN);
    addPayMethodAmount(totalPayTotals, 'card', cardPart>0 ? cardPart : half, isCN);
  } else if(pm==='cash'){
    // نستخدم قيمة الفاتورة (collected) لا المبلغ المدفوع الذي قد يشمل الباقي
    addPayMethodAmount(totalPayTotals, 'cash', collected, isCN);
  } else if(pm==='card' || pm==='network' || pm==='tamara' || pm==='tabby'){
    const cardPart = Number(s.pay_card_amount || 0);
    addPayMethodAmount(totalPayTotals, pm, cardPart>0 ? cardPart : collected, isCN);
  } else if(pm){
    addPayMethodAmount(totalPayTotals, pm, collected, isCN);
  }
}

const btnBack = document.getElementById('btnBack');
if(btnBack){ btnBack.onclick = ()=>{ window.location.href = './index.html'; } }

(function attachExportHandlers(){
  let exporting = false;
  const btnPdf = document.getElementById('exportPdfBtn');
  if(btnPdf){
    btnPdf.addEventListener('click', async () => {
      if(exporting) return; exporting = true; btnPdf.disabled = true;
      try{
        const t = __currentLang || {};
        // التحقق من أن المستخدم قد طبق الفلاتر
        const { startStr, adjustedEndStr, userId } = currentFilters;
        if(!startStr || !adjustedEndStr){
          alert(t.applyRangeFirstExport || 'Please apply the period before exporting');
          return;
        }
        
        // جلب جميع الفواتير بدون pagination - استخدم التاريخ المعدل
        const allItems = await loadAllInvoices(startStr, adjustedEndStr, userId);
        
        // حفظ معلومات الفترة والمستخدم
        let periodFromText = '';
        let periodToText = '';
        let selectedUser = '';
        try{
          const fromInput = document.getElementById('fromAt');
          const toInput = document.getElementById('toAt');
          const userFilter = document.getElementById('userFilter');
          
          if(fromInput && fromInput.value){
            periodFromText = fromInput.value.replace('T', ' ');
          }
          if(toInput && toInput.value){
            periodToText = toInput.value.replace('T', ' ');
          }
          if(userFilter && userFilter.value){
            const selectedOption = userFilter.options[userFilter.selectedIndex];
            selectedUser = selectedOption ? selectedOption.text : '';
          }
        }catch(_){}
        
        const period = (rangeEl && rangeEl.textContent) ? rangeEl.textContent.replace(/[^0-9_\-–: ]+/g,'').replace(/\s+/g,' ').trim() : '';
        const safe = (period||'').replace(/[: ]/g,'_');
        const title = `all-invoices-${safe||Date.now()}.pdf`;
        
        // Build clone and ensure all collapsible sections are expanded for PDF
        const clone = document.documentElement.cloneNode(true);
        
        // ملء جدول الفواتير في الـ clone بجميع البيانات
        try{
          const cloneTbody = clone.querySelector('#invTbody');
          if(cloneTbody && allItems.length > 0){
            let sumPre = 0, sumVat = 0, sumGrand = 0;
            const rows = allItems.map(s=>{
              const isCN = (String(s.doc_type||'') === 'credit_note' || String(s.invoice_no||'').startsWith('CN-'));
              const docType = isCN ? (t.creditNote||'Credit Note') : (t.invoice||'Invoice');
              let created = s.created_at ? new Date(s.created_at) : null;
              if(!created || isNaN(created.getTime())){ try{ created = new Date(String(s.created_at).replace(' ', 'T')); }catch(_){ created = new Date(); } }
              const dateFormatter = new Intl.DateTimeFormat('en-GB-u-ca-gregory', {year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:true});
              const dateStr = dateFormatter.format(created);
              const custPhone = s.customer_phone || s.disp_customer_phone || '';
              const cust = custPhone || (s.customer_name || s.disp_customer_name || '');
              const pre = allInvoicesRowAmount(s, 'sub_total');
              const vat = allInvoicesRowAmount(s, 'vat_total');
              const grand = allInvoicesRowAmount(s, 'grand_total');
              sumPre += pre; sumVat += vat; sumGrand += grand;
              const pm = String(s.payment_method || '').toLowerCase();
              const payLabel = payMethodLabel(pm);
              const rowClass = isCN ? 'credit-row' : '';
              const fmt = (n)=> Number(n||0).toFixed(2);
              const deliveryName = s.delivery_company_name || '—';
              const deliveryDisc = s.delivery_discount_amount ? Number(s.delivery_discount_amount).toFixed(2) : '—';
              return `<tr class="${rowClass}"><td class="num">${s.invoice_no||''}</td><td>${docType}</td><td dir="ltr" style="text-align:left">${cust}</td><td class="num">${dateStr}</td><td>${payLabel}</td><td class="num">${fmt(pre)}</td><td class="num">${fmt(vat)}</td><td class="num">${fmt(grand)}</td><td>${deliveryName}</td><td class="num">${deliveryDisc}</td><td></td></tr>`;
            }).join('');
            cloneTbody.innerHTML = rows;
            
            // تحديث الإجماليات في الـ tfoot
            const cloneSumPre = clone.querySelector('#sumPre');
            const cloneSumVat = clone.querySelector('#sumVat');
            const cloneSumGrand = clone.querySelector('#sumGrand');
            const cloneSumCount = clone.querySelector('#sumCount');
            if(cloneSumPre) cloneSumPre.textContent = sumPre.toFixed(2);
            if(cloneSumVat) cloneSumVat.textContent = sumVat.toFixed(2);
            if(cloneSumGrand) cloneSumGrand.textContent = sumGrand.toFixed(2);
            if(cloneSumCount) cloneSumCount.textContent = String(allItems.length);
          }
        }catch(e){ console.error('Fill table error:', e); }
        try{ Array.from(clone.querySelectorAll('details')).forEach(d=> d.setAttribute('open','')); }catch(_){ }
        
        // إضافة Tailwind CSS محلياً
        try{
          const tailwindLink = document.createElement('link');
          tailwindLink.rel = 'stylesheet';
          tailwindLink.href = '../../../assets/css/tailwind.min.css';
          clone.querySelector('head')?.appendChild(tailwindLink);
        }catch(_){}
        
        // إزالة العناصر غير المطلوبة
        try{
          const removeElements = clone.querySelectorAll('header, button, select, input, label, #paginationContainer');
          removeElements.forEach(el => {
            try{ el.remove(); }catch(_){}
          });
        }catch(_){ }
        
        // إخفاء قسم إجماليات طرق الدفع
        try{
          const sections = clone.querySelectorAll('.bg-white.rounded-2xl');
          if(sections.length > 1){
            // آخر قسم هو إجماليات طرق الدفع
            sections[sections.length - 1].remove();
          }
        }catch(_){}
        
        // إضافة عنوان ومعلومات الفترة
        try{
          const container = clone.querySelector('.container');
          if(container){
            // إزالة div الفلاتر والأزرار
            const firstChild = container.firstElementChild;
            if(firstChild){
              firstChild.remove();
            }
            
            // إنشاء عنصر div جديد في document الأصلي ثم استنساخه
            const tempDiv = document.createElement('div');
            tempDiv.style.cssText = 'text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 4px solid #2563eb;';
            
            let headerHTML = `<h1 style="font-size: 28px; font-weight: 900; color: #1f2937; margin-bottom: 8px; font-family: Cairo, sans-serif;">${t.printReportTitle||'All Invoices Report'}</h1>`;

            if(periodFromText && periodToText){
              headerHTML += '<div style="font-size: 16px; font-weight: 700; color: #4b5563; margin-top: 12px; font-family: Cairo, sans-serif;">';
              headerHTML += `<div style="margin: 4px 0;">${t.from||'From'}: ${periodFromText}</div>`;
              headerHTML += `<div style="margin: 4px 0;">${t.to||'To'}: ${periodToText}</div>`;
              if(selectedUser){
                headerHTML += `<div style="margin: 4px 0;">${t.user||'User'}: ${selectedUser}</div>`;
              }
              headerHTML += '</div>';
            }
            
            tempDiv.innerHTML = headerHTML;
            container.insertBefore(tempDiv, container.firstChild);
          }
        }catch(e){ console.error('Header error:', e); }
        
        const style = clone.ownerDocument.createElement('style');
        style.textContent = `
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
          
          * {
            font-family: 'Cairo', sans-serif !important;
          }
          
          @media print {
            @page {
              size: A4;
              margin: 15mm;
            }
            
            body {
              background: white !important;
              padding: 0 !important;
            }
            
            .container {
              max-width: 100% !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            .bg-white {
              background: white !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              padding: 0 !important;
              margin-bottom: 16px !important;
            }
            
            .overflow-x-auto {
              overflow: visible !important;
            }
            
            /* عرض جميع الأعمدة */
            .grid-table thead th,
            .grid-table tbody td,
            .grid-table tfoot th {
              display: table-cell !important;
              width: auto !important;
            }
            
            /* تنسيق الجدول */
            table {
              width: 100% !important;
              border-collapse: collapse !important;
              font-size: 11px !important;
            }
            
            table thead th {
              background: linear-gradient(to bottom, #f0f9ff, #e0f2fe) !important;
              color: #1e40af !important;
              font-weight: 900 !important;
              padding: 10px 6px !important;
              border: 2px solid #94a3b8 !important;
              text-align: center !important;
            }
            
            table tbody td {
              padding: 8px 6px !important;
              border: 1px solid #cbd5e1 !important;
              text-align: center !important;
            }
            
            table tbody tr:nth-child(even) {
              background: #f8fafc !important;
            }
            
            table tfoot th {
              background: #dbeafe !important;
              font-weight: 900 !important;
              padding: 10px 6px !important;
              border: 2px solid #94a3b8 !important;
              border-top: 3px solid #3b82f6 !important;
              text-align: center !important;
              font-size: 12px !important;
            }
            
            h1, h2, h3 {
              page-break-after: avoid !important;
            }
            
            table {
              page-break-inside: auto !important;
            }
            
            tr {
              page-break-inside: avoid !important;
              page-break-after: auto !important;
            }
            
            thead {
              display: table-header-group !important;
            }
            
            tfoot {
              display: table-footer-group !important;
            }
          }
        `;
        clone.querySelector('head')?.appendChild(style);
        const html = '<!doctype html>' + clone.outerHTML;
        await window.api.pdf_export(html, { saveMode:'auto', filename: title, pageSize:'A4' });
      }catch(e){ console.error(e); alert((__currentLang||{}).exportFailedPdf || 'Failed to create PDF'); }
      finally{ exporting = false; btnPdf.disabled = false; }
    });
  }
  const btnExcel = document.getElementById('exportExcelBtn');
  if(btnExcel){
    btnExcel.addEventListener('click', async () => {
      if(exporting) return; exporting = true; btnExcel.disabled = true;
      try{
        const t = __currentLang || {};
        // التحقق من أن المستخدم قد طبق الفلاتر
        const { startStr, adjustedEndStr, userId } = currentFilters;
        if(!startStr || !adjustedEndStr){
          alert(t.applyRangeFirstExport || 'Please apply the period before exporting');
          return;
        }

        // جلب جميع الفواتير بدون pagination - استخدم التاريخ المعدل
        const allItems = await loadAllInvoices(startStr, adjustedEndStr, userId);

        const lines = [];
        const esc = (v)=> ('"'+String(v??'').replace(/"/g,'""')+'"');
        const fmt = (n)=> Number(n||0).toFixed(2);

        if(rangeEl && rangeEl.textContent){ lines.push(esc(t.period||'Period'), esc(rangeEl.textContent.trim())); lines.push(''); }

        // عناوين الأعمدة
        const headers = [t.number||'No.', t.docType||'Doc. Type', t.customer||'Customer', t.date||'Date', t.paymentMethod||'Payment Method', t.preVAT||'Pre-VAT', t.vat||'VAT', t.total||'Total', t.deliveryCompany||'Delivery Co.', t.deliveryDiscount||'Delivery Disc.'];
        lines.push(headers.map(esc).join(','));

        // البيانات
        let sumPre = 0, sumVat = 0, sumGrand = 0;
        allItems.forEach(s=>{
          const isCN = (String(s.doc_type||'') === 'credit_note' || String(s.invoice_no||'').startsWith('CN-'));
          const docType = isCN ? (t.creditNote||'Credit Note') : (t.invoice||'Invoice');
          let created = s.created_at ? new Date(s.created_at) : null;
          if(!created || isNaN(created.getTime())){ try{ created = new Date(String(s.created_at).replace(' ', 'T')); }catch(_){ created = new Date(); } }
          const dateFormatter = new Intl.DateTimeFormat('en-GB-u-ca-gregory', {year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:true});
          const dateStr = dateFormatter.format(created);
          const custPhone = s.customer_phone || s.disp_customer_phone || '';
          const cust = custPhone || (s.customer_name || s.disp_customer_name || '');
          const pre = allInvoicesRowAmount(s, 'sub_total');
          const vat = allInvoicesRowAmount(s, 'vat_total');
          const grand = allInvoicesRowAmount(s, 'grand_total');
          sumPre += pre; sumVat += vat; sumGrand += grand;
          const pm = String(s.payment_method || '').toLowerCase();
          const payLabel = payMethodLabel(pm);

          const deliveryName = s.delivery_company_name || '—';
          const deliveryDisc = s.delivery_discount_amount ? Number(s.delivery_discount_amount).toFixed(2) : '—';
          const row = [s.invoice_no||'', docType, cust, dateStr, payLabel, fmt(pre), fmt(vat), fmt(grand), deliveryName, deliveryDisc];
          lines.push(row.map(esc).join(','));
        });

        // الإجماليات
        lines.push('');
        lines.push([esc(t.totals||'Totals'), '', '', '', '', esc(fmt(sumPre)), esc(fmt(sumVat)), esc(fmt(sumGrand)), '', ''].join(','));

        const csv = lines.join('\n');
        const period = (rangeEl && rangeEl.textContent) ? rangeEl.textContent.replace(/[^0-9_\-–: ]+/g,'').replace(/\s+/g,' ').trim() : '';
        const filename = `all-invoices-${(period||'').replace(/[: ]/g,'_')||Date.now()}.csv`;
        await window.api.csv_export(csv, { saveMode:'auto', filename });
      }catch(e){ console.error(e); alert((__currentLang||{}).exportFailedExcel || 'Failed to create Excel'); }
      finally{ exporting = false; btnExcel.disabled = false; }
    });
  }

  // Print report (thermal 80mm x 297mm)
  const btnPrint = document.getElementById('printReportBtn');
  if(btnPrint){
    btnPrint.addEventListener('click', async ()=>{
      try{
        btnPrint.disabled = true;
        const t = __currentLang || {};
        // التحقق من أن المستخدم قد طبق الفلاتر
        const { startStr, adjustedEndStr, userId } = currentFilters;
        if(!startStr || !adjustedEndStr){
          alert(t.applyRangeFirstPrint || 'Please apply the period before printing');
          return;
        }
        
        // جلب جميع الفواتير بدون pagination - استخدم التاريخ المعدل
        const allItems = await loadAllInvoices(startStr, adjustedEndStr, userId);
        
        // Ensure settings-based margins are applied before snapshot
        try{ if(window.applyPrintMarginsFromSettings) await window.applyPrintMarginsFromSettings(); }catch(_){ }
        
        // Get period info from the range element which is already formatted
        const rangeText = document.getElementById('range')?.textContent || '';
        
        // Prepare a clean HTML snapshot
        const clone = document.documentElement.cloneNode(true);
        
        // ملء جدول الفواتير في الـ clone بجميع البيانات
        let totalSumGrand = 0;
        try{
          const cloneTbody = clone.querySelector('#invTbody');
          if(cloneTbody && allItems.length > 0){
            const rows = allItems.map(s=>{
              const isCN = (String(s.doc_type||'') === 'credit_note' || String(s.invoice_no||'').startsWith('CN-'));
              const docType = isCN ? (t.creditNote||'Credit Note') : (t.invoice||'Invoice');
              let created = s.created_at ? new Date(s.created_at) : null;
              if(!created || isNaN(created.getTime())){ try{ created = new Date(String(s.created_at).replace(' ', 'T')); }catch(_){ created = new Date(); } }
              const dateFormatter = new Intl.DateTimeFormat('en-GB-u-ca-gregory', {year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:true});
              const dateStr = dateFormatter.format(created);
              const custPhone = s.customer_phone || s.disp_customer_phone || '';
              const cust = custPhone || (s.customer_name || s.disp_customer_name || '');
              const pre = allInvoicesRowAmount(s, 'sub_total');
              const vat = allInvoicesRowAmount(s, 'vat_total');
              const grand = allInvoicesRowAmount(s, 'grand_total');
              totalSumGrand += grand;
              const pm = String(s.payment_method || '').toLowerCase();
              const payLabel = payMethodLabel(pm);
              const rowClass = isCN ? 'credit-row' : '';
              const fmt = (n)=> Number(n||0).toFixed(2);
              const deliveryName = s.delivery_company_name || '—';
              const deliveryDisc = s.delivery_discount_amount ? Number(s.delivery_discount_amount).toFixed(2) : '—';
              return `<tr class="${rowClass}"><td class="num">${s.invoice_no||''}</td><td>${docType}</td><td dir="ltr" style="text-align:left">${cust}</td><td class="num">${dateStr}</td><td>${payLabel}</td><td class="num">${fmt(pre)}</td><td class="num">${fmt(vat)}</td><td class="num">${fmt(grand)}</td><td>${deliveryName}</td><td class="num">${deliveryDisc}</td><td></td></tr>`;
            }).join('');
            cloneTbody.innerHTML = rows;
          }
        }catch(e){ console.error('Fill table error:', e); }
        
        // Add Cairo font
        try{
          const cairoLink = document.createElement('link');
          cairoLink.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap';
          cairoLink.rel = 'stylesheet';
          clone.querySelector('head')?.appendChild(cairoLink);
        }catch(_){ }
        
        // Remove unwanted elements
        try{
          const removeElements = clone.querySelectorAll('header, button, select, input, label, .border-t-2, .range-actions, #paginationContainer');
          removeElements.forEach(el => {
            try{ el.remove(); }catch(_){}
          });
          
          // Remove Payment Totals section (parent of #payTotals)
          const payTotals = clone.querySelector('#payTotals');
          if(payTotals){
            const parent = payTotals.parentElement;
            if(parent) parent.remove();
          }
        }catch(_){ }

        // Remove unwanted columns from DOM - REMOVED in favor of CSS hiding for stability
        // We will use CSS to hide specific columns (2, 5, 6, 7, 9)
        
        // Update footer to match new layout (5 visible columns)
        try{
          const tb = clone.querySelector('#invTbody');
          if(tb){
            const table = tb.closest('table');
            if(table){
              // Remove colgroup if exists to avoid layout conflicts
              const colgroup = table.querySelector('colgroup');
              if(colgroup) colgroup.remove();

              // Remove existing tfoot
              const oldTfoot = table.querySelector('tfoot');
              if(oldTfoot) oldTfoot.remove();

              // Create new tfoot
              const newTfoot = document.createElement('tfoot');
              const newRow = document.createElement('tr');

              // Use calculated total from all invoices
              const sumGrandText = totalSumGrand.toFixed(2);
              
              // We need to match the table's column structure (9 columns)
              // Col 1: Number (Visible) -> Empty cell
              // Col 2: Doc Type (Hidden) -> Hidden cell
              // Col 3: Customer (Visible) -> Start of Label (Colspan 3 covering 3, 4, 5)
              // Col 4: Date (Visible) -> Covered by Col 3
              // Col 5: Payment (Visible) -> Covered by Col 3
              // Col 6: Pre-Tax (Hidden) -> Hidden cell
              // Col 7: Tax (Hidden) -> Hidden cell
              // Col 8: Total (Visible) -> Value
              // Col 9: View (Hidden) -> Hidden cell

              // 1. Number
              const th1 = document.createElement('th');
              th1.style.cssText = 'border:2px solid #000; background:#e0e0e0;';
              newRow.appendChild(th1);

              // 2. Doc Type (Hidden)
              const th2 = document.createElement('th');
              th2.style.cssText = 'display:none !important;';
              newRow.appendChild(th2);

              // 3. Label (Spans 3, 4, 5)
              const th3 = document.createElement('th');
              th3.colSpan = 3;
              th3.textContent = t.grandTotal || 'Grand Total';
              th3.style.cssText = 'text-align:center; border:2px solid #000; background:#e0e0e0; font-weight:900;';
              newRow.appendChild(th3);

              // 6. Pre-Tax (Hidden)
              const th6 = document.createElement('th');
              th6.style.cssText = 'display:none !important;';
              newRow.appendChild(th6);

              // 7. Tax (Hidden)
              const th7 = document.createElement('th');
              th7.style.cssText = 'display:none !important;';
              newRow.appendChild(th7);

              // 8. Total
              const th8 = document.createElement('th');
              th8.textContent = sumGrandText;
              th8.style.cssText = 'text-align:center; border:2px solid #000; background:#e0e0e0; font-weight:900;';
              newRow.appendChild(th8);

              // 9. View (Hidden)
              const th9 = document.createElement('th');
              th9.style.cssText = 'display:none !important;';
              newRow.appendChild(th9);

              newTfoot.appendChild(newRow);
              table.appendChild(newTfoot);
            }
          }
        }catch(e){ console.error('Footer update error:', e); }

        // Add print styles
        const style = document.createElement('style');
        style.textContent = `
          @page { 
            margin: 0; 
            size: 80mm auto;
          }
          
          html{ 
            width: 100%; 
            margin: 0; 
            padding: 0;
            background: #fff;
          }
          
          body{ 
            width: 80mm; 
            max-width: 80mm; 
            margin: 0 auto; 
            padding: 0;
            box-sizing: border-box;
            padding-left: var(--m-left);
            padding-right: var(--m-right);
            background: #fff;
            font-family: 'Cairo', sans-serif !important;
            font-weight: 900 !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          *{ 
            box-sizing: border-box;
            font-family: 'Cairo', sans-serif !important;
            font-weight: 900 !important;
            color: #000 !important;
          }
          
          .container{ 
            width: 100%;
            max-width: 100%;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Hide unwanted elements */
          header, button, select, input, label, .border-t-2, svg, .flex, .range-actions { 
            display: none !important; 
          }
          
          /* Hide Payment Totals section */
          #payTotals, #payTotals + h3, h3:contains('إجماليات طرق الدفع') {
             display: none !important;
          }
          
          /* Table Styles */
          table{ 
            width: 100%; 
            border-collapse: collapse; 
            table-layout: fixed; 
            border: 3px solid #000 !important;
            margin: 8px 0 !important;
          }
          
          thead th{ 
            background: #f0f0f0 !important; 
            color: #000 !important; 
            font-weight: 900 !important;
            font-size: 10px !important;
            text-align: center !important;
            padding: 4px 2px !important;
            border: 2px solid #000 !important;
          }
          
          tbody td{ 
            padding: 4px 2px !important; 
            border: 1.5px solid #000 !important;
            font-weight: 700 !important;
            font-size: 9.5px !important;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          
          tfoot th{ 
            border: 2px solid #000 !important;
            border-top: 3px solid #000 !important;
            background: #e0e0e0 !important;
            font-weight: 900 !important;
            font-size: 9.5px !important;
            padding: 5px 2px !important;
            color: #000 !important;
          }

          /* Hide unwanted columns: 2(Doc), 6(Pre), 7(Tax), 9(View) */
          /* Keeping 5(Payment Method) visible now */
          table thead tr th:nth-child(2), table tbody tr td:nth-child(2),
          table thead tr th:nth-child(6), table tbody tr td:nth-child(6),
          table thead tr th:nth-child(7), table tbody tr td:nth-child(7),
          table thead tr th:nth-child(9), table tbody tr td:nth-child(9) {
            display: none !important;
          }

          /* Column Widths for visible columns: 1(Num), 3(Cust), 4(Date), 5(Pay), 8(Total) */
          /* 1: Number */
          table thead tr th:nth-child(1), table tbody tr td:nth-child(1) { width: 12% !important; text-align: center !important; }
          /* 3: Customer */
          table thead tr th:nth-child(3), table tbody tr td:nth-child(3) { width: 28% !important; text-align: left !important; font-size: 8px !important; }
          /* 4: Date */
          table thead tr th:nth-child(4), table tbody tr td:nth-child(4) { width: 20% !important; text-align: center !important; font-size: 8px !important; }
          /* 5: Payment Method */
          table thead tr th:nth-child(5), table tbody tr td:nth-child(5) { width: 15% !important; text-align: center !important; font-size: 9px !important; }
          /* 8: Total */
          table thead tr th:nth-child(8), table tbody tr td:nth-child(8) { width: 25% !important; text-align: right !important; }
          
          /* Hide original h3 titles */
          h3 { display: none !important; }
        `;
        clone.querySelector('head')?.appendChild(style);
        
        // Add Header
        try{
          const container = clone.querySelector('.container');
          if(container){
            // Clear container top elements
            while(container.firstChild && container.firstChild.tagName !== 'TABLE' && !container.firstChild.querySelector?.('table')){
               container.firstChild.remove();
            }
            
            // Create Header
            const headerDiv = document.createElement('div');
            headerDiv.style.cssText = 'text-align:center; margin-bottom:10px; padding-bottom:6px; border-bottom:3px solid #000; font-family:Cairo,sans-serif;';
            
            let headerHTML = `<div style="font-weight:900; font-size:14px; margin-bottom:4px;">${t.printReportTitle||'All Invoices Report'}</div>`;
            if(rangeText){
               headerHTML += `<div style="font-weight:700; font-size:10px; line-height:1.4;">${rangeText}</div>`;
            }
            
            headerDiv.innerHTML = headerHTML;
            container.insertBefore(headerDiv, container.firstChild);
          }
        }catch(e){ console.error('Title error:', e); }

        const html = '<!doctype html>' + clone.outerHTML;
        await window.api.print_html(html, {
          silent: true,
          pageSize: { width: 80000, height: 297000 },
          margins: { marginType: 'none' },
          printBackground: true,
        });
      }catch(e){ console.error(e); alert((__currentLang||{}).printFailed || 'Failed to print'); }
      finally{ btnPrint.disabled = false; }
    });
  }
})();

function fromInputToStr(input){
  const v = (input?.value||'').trim();
  return v ? v.replace('T',' ') + ':00' : '';
}
function toStr(d){
  const pad2 = (v)=> String(v).padStart(2,'0');
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:00`;
}

let currentPage = 1;
const pageSize = 50; // زيادة من 20 إلى 50 لتحسين الأداء عبر VPN
let currentFilters = {}; // لحفظ الفلاتر الحالية

// دالة لجلب جميع الفواتير بدون pagination (للطباعة والتصدير)
async function loadAllInvoices(startStr, endStr, userId){
  // التاريخ يأتي معدلاً من loadRange، استخدمه مباشرة
  const query = { 
    date_from: startStr, 
    date_to: endStr,
    limit: 50000
  };
  if(userId){ query.user_id = userId; }
  
  const res = await window.api.sales_list(query);
  return (res && res.ok) ? (res.items||[]) : [];
}

async function loadRange(startStr, endStr, userId, page = 1){
  currentPage = page;
  
  // تعديل endStr لضمان شمول كل الفترة المحددة بشكل صحيح
  let adjustedEndStr = endStr;
  if(endStr && endStr.match(/\s00:00:00$/)){
    adjustedEndStr = endStr.replace(/00:00:00$/, '23:59:59');
  }
  
  // حفظ الفلاتر: التاريخ الأصلي والمعدل
  currentFilters = { startStr, endStr, adjustedEndStr, userId };
  
  const t = __currentLang || {};
  const userFilterEl = document.getElementById('userFilter');
  const selectedUserText = userFilterEl && userFilterEl.value ? (userFilterEl.options[userFilterEl.selectedIndex]?.text || '') : '';
  const userInfo = selectedUserText && selectedUserText !== (t.allUsers||'All Users') ? ` - ${t.userLabelShort||'User:'} ${selectedUserText}` : '';
  if(rangeEl){ rangeEl.textContent = `${t.period||'Period:'} ${startStr} — ${endStr}${userInfo}`; }
  
  try{
    // اجلب المستندات ضمن الفترة مع pagination
    const query = { 
      date_from: startStr, 
      date_to: adjustedEndStr,
      limit: pageSize,
      offset: (page - 1) * pageSize
    };
    if(userId){ query.user_id = userId; }
    const res = await window.api.sales_list(query);
    const items = (res && res.ok) ? (res.items||[]) : [];
    const total = res?.total || 0;

    // جلب جميع الفواتير لحساب الإجماليات الكلية - استخدم التاريخ المعدل
    const allInvoices = await loadAllInvoices(startStr, adjustedEndStr, userId);
    const paymentsBySale = await buildPaymentsBySaleMap(saleIdsNeedingPaymentRows(allInvoices), allInvoices);

    // حساب الإجماليات الكلية من جميع الفواتير
    let totalSumPre = 0, totalSumVat = 0, totalSumGrand = 0;
    const totalPayTotals = new Map();

    allInvoices.forEach(s=>{
      const pre = allInvoicesRowAmount(s, 'sub_total');
      const vat = allInvoicesRowAmount(s, 'vat_total');
      const grand = allInvoicesRowAmount(s, 'grand_total');
      totalSumPre += pre;
      totalSumVat += vat;
      totalSumGrand += grand;
      accumulateInvoicePaymentTotals(s, totalPayTotals, paymentsBySale);
    });

    const invTbody = document.getElementById('invTbody');
    const invCount = document.getElementById('invCount');

    let sumPre = 0, sumVat = 0, sumGrand = 0;
    const payTotals = new Map(); // key: normalized method, value: total grand

    const rows = items.map(s=>{
      const isCN = (String(s.doc_type||'') === 'credit_note' || String(s.invoice_no||'').startsWith('CN-'));
      const statusTxt = invoiceStatusLabel(s);
      const docType = isCN ? (t.creditNote||'Credit Note') : `${t.invoice||'Invoice'}${statusTxt ? ` - ${statusTxt}` : ''}`;
      let created = s.created_at ? new Date(s.created_at) : null;
      if(!created || isNaN(created.getTime())){ try{ created = new Date(String(s.created_at).replace(' ', 'T')); }catch(_){ created = new Date(); } }
      const dateStr = dateFormatter.format(created);
      const custPhone = s.customer_phone || s.disp_customer_phone || '';
      const cust = custPhone || (s.customer_name || s.disp_customer_name || '');
      const pre = allInvoicesRowAmount(s, 'sub_total');
      const vat = allInvoicesRowAmount(s, 'vat_total');
      const grand = allInvoicesRowAmount(s, 'grand_total');
      sumPre += pre; sumVat += vat; sumGrand += grand;
      const pm = String(s.payment_method || '').toLowerCase();
      accumulateInvoicePaymentTotals(s, payTotals, paymentsBySale);
      const payLabel = payMethodLabel(pm);
      const pmLower = pm;
      const settledCash = Number(s.settled_cash || 0);
      const payCashPart = Number(s.pay_cash_amount || 0);
      const cashParam = (pmLower==='cash') ? (settledCash>0 ? settledCash : (payCashPart>0 ? payCashPart : Number(s.grand_total||0))) : 0;
      const attrs = [`data-view=\"${s.id}\"`, `data-type=\"${isCN?'credit':'invoice'}\"`, `data-pay=\"${pmLower}\"`];
      if(cashParam){ attrs.push(`data-cash=\"${cashParam}\"`); }
      if(isCN){
        const baseId = (s.ref_base_sale_id != null) ? String(s.ref_base_sale_id) : '';
        const baseNo = (s.ref_base_invoice_no != null) ? String(s.ref_base_invoice_no) : '';
        if(baseId) attrs.push(`data-base=\"${baseId}\"`);
        if(baseNo) attrs.push(`data-base-no=\"${baseNo}\"`);
      }
      const viewBtn = `<button class=\"px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-sm text-xs\" ${attrs.join(' ')}>${t.view||'View'}</button>`;
      const rowClass = isCN ? 'credit-row' : '';
      const deliveryName = s.delivery_company_name || '—';
      const deliveryDisc = s.delivery_discount_amount ? Number(s.delivery_discount_amount).toFixed(2) : '—';
      return `<tr class="${rowClass}"><td class=\"num\">${s.invoice_no||''}</td><td>${docType}</td><td dir=\"ltr\" style=\"text-align:left\">${cust}</td><td class=\"num\">${dateStr}</td><td>${payLabel}</td><td class=\"num\">${fmt(pre)}</td><td class=\"num\">${fmt(vat)}</td><td class=\"num\">${fmt(grand)}</td><td>${deliveryName}</td><td class=\"num\">${deliveryDisc}</td><td>${viewBtn}</td></tr>`;
    }).join('');

    if(invTbody){ invTbody.innerHTML = rows || `<tr><td colspan="11" class="text-center text-gray-500 font-semibold py-8">📋 ${t.noDocuments || 'No documents within the period'}</td></tr>`; }
    if(invCount){ invCount.textContent = String(items.length||0); }

    // استخدام الإجماليات الكلية بدلاً من إجماليات الصفحة الحالية
    const set = (id, v)=>{ const el = document.getElementById(id); if(!el) return; el.textContent = (id==='sumCount') ? String(v) : fmt(v); };
    set('sumPre', totalSumPre);
    set('sumVat', totalSumVat);
    set('sumGrand', totalSumGrand);
    set('sumCount', total);

    // عرض إجماليات طرق الدفع الكلية
    try{
      const container = document.getElementById('payTotals');
      if(container){
        const label = (k)=> payMethodLabel(k);
        const getIcon = (k)=>{
          const m = String(k||'').toLowerCase();
          if(m==='cash') return '💵';
          if(m==='card') return '💳';
          if(m==='credit') return '📝';
          if(m==='tamara') return '🛍️';
          if(m==='tabby') return '📱';
          if(m==='mixed') return '🔀';
          return '💰';
        };
        const entries = Array.from(totalPayTotals.entries()).filter(([k])=>k);
        entries.sort((a,b)=> a[0].localeCompare(b[0]));
        const cardsHTML = entries.map(([k,v])=>{
          const ttl = Number(v||0);
          return `<div class="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4 hover:shadow-lg transition-shadow" style="background: linear-gradient(to bottom right, #eff6ff, #faf5ff); border: 2px solid #bfdbfe; border-radius: 0.75rem; padding: 1rem;">
            <div class="flex items-center gap-2 mb-2" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
              <span class="text-2xl" style="font-size: 1.5rem;">${getIcon(k)}</span>
              <span class="text-sm font-bold text-gray-600" style="font-size: 0.875rem; font-weight: 700; color: #4b5563;">${label(k)}</span>
            </div>
            <div class="text-2xl font-black text-gray-800" style="font-size: 1.5rem; font-weight: 900; color: #1f2937;">${fmt(ttl)} <span style="font-family: saudi_riyal, Cairo, sans-serif;">&#xE900;</span></div>
          </div>`;
        }).join('') || `<div class="text-gray-500 font-semibold text-center py-4" style="color: #6b7280; font-weight: 600; text-align: center; padding: 1rem 0;">${t.noPaymentData || 'No payment method data for the period'}</div>`;
        container.innerHTML = cardsHTML;
      }
    }catch(_){ }

    // لا حاجة لإضافة listeners هنا - نستخدم event delegation
    
    // عرض أزرار الصفحات
    renderPagination(total, currentPage);
    
  }catch(e){ console.error(e); }
}

// دالة لعرض أزرار الصفحات
function renderPagination(totalItems, page){
  const paginationContainer = document.getElementById('paginationContainer');
  if(!paginationContainer) return;

  if(totalItems <= pageSize){
    paginationContainer.innerHTML = '';
    paginationContainer.style.display = 'none';
    return;
  }

  paginationContainer.style.display = '';
  const totalPages = Math.ceil(totalItems / pageSize);
  const currentPageNum = page || currentPage;
  const t = __currentLang || {};
  const isAr = document.documentElement.lang === 'ar';

  let html = '<div class="flex items-center justify-center gap-2 flex-wrap">';

  // زر الصفحة الأولى
  if(currentPageNum > 1){
    html += `<button onclick="goToPage(1)" class="px-4 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors">
      ${t.first||'First'}
    </button>`;
  }

  // زر السابق
  if(currentPageNum > 1){
    html += `<button onclick="goToPage(${currentPageNum - 1})" class="px-4 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors">
      ${isAr ? '←' : '←'}
    </button>`;
  }

  // أرقام الصفحات (نعرض 5 صفحات في المنتصف)
  let startPage = Math.max(1, currentPageNum - 2);
  let endPage = Math.min(totalPages, currentPageNum + 2);

  if(startPage > 1){
    html += '<span class="px-3 py-2 text-gray-500">...</span>';
  }

  for(let i = startPage; i <= endPage; i++){
    if(i === currentPageNum){
      html += `<button class="px-4 py-2 bg-purple-600 text-white font-black rounded-lg shadow-lg cursor-default">
        ${i}
      </button>`;
    } else {
      html += `<button onclick="goToPage(${i})" class="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-colors">
        ${i}
      </button>`;
    }
  }

  if(endPage < totalPages){
    html += '<span class="px-3 py-2 text-gray-500">...</span>';
  }

  // زر التالي
  if(currentPageNum < totalPages){
    html += `<button onclick="goToPage(${currentPageNum + 1})" class="px-4 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors">
      →
    </button>`;
  }

  // زر الصفحة الأخيرة
  if(currentPageNum < totalPages){
    html += `<button onclick="goToPage(${totalPages})" class="px-4 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors">
      ${t.last||'Last'}
    </button>`;
  }

  html += '</div>';
  html += `<div class="text-center mt-3 text-gray-600 font-bold">
    ${t.page||'Page'} ${currentPageNum} ${t.of||'of'} ${totalPages} (${totalItems.toLocaleString(isAr?'ar':'en')} ${t.totalInvoices||'invoices'})
  </div>`;

  paginationContainer.innerHTML = html;
}

// دالة للانتقال لصفحة معينة
window.goToPage = async function(page){
  const t = __currentLang || {};
  const { startStr, adjustedEndStr, userId } = currentFilters;
  if(!startStr || !adjustedEndStr){
    alert(t.applyRangeFirst || 'Please apply the period first');
    return;
  }
  
  // استخدم adjustedEndStr مباشرة
  currentPage = page;
  
  try{
    const query = { 
      date_from: startStr, 
      date_to: adjustedEndStr,
      limit: pageSize,
      offset: (page - 1) * pageSize
    };
    if(userId){ query.user_id = userId; }
    const res = await window.api.sales_list(query);
    const items = (res && res.ok) ? (res.items||[]) : [];
    const total = res?.total || 0;

    // جلب جميع الفواتير لحساب الإجماليات الكلية
    const allInvoices = await loadAllInvoices(startStr, adjustedEndStr, userId);
    const paymentsBySaleGo = await buildPaymentsBySaleMap(saleIdsNeedingPaymentRows(allInvoices), allInvoices);

    // حساب الإجماليات الكلية من جميع الفواتير
    let totalSumPre = 0, totalSumVat = 0, totalSumGrand = 0;
    const totalPayTotals = new Map();

    allInvoices.forEach(s=>{
      const pre = allInvoicesRowAmount(s, 'sub_total');
      const vat = allInvoicesRowAmount(s, 'vat_total');
      const grand = allInvoicesRowAmount(s, 'grand_total');
      totalSumPre += pre;
      totalSumVat += vat;
      totalSumGrand += grand;
      accumulateInvoicePaymentTotals(s, totalPayTotals, paymentsBySaleGo);
    });

    const invTbody = document.getElementById('invTbody');
    const invCount = document.getElementById('invCount');

    let sumPre = 0, sumVat = 0, sumGrand = 0;
    const payTotals = new Map();

    const rows = items.map(s=>{
      const isCN = (String(s.doc_type||'') === 'credit_note' || String(s.invoice_no||'').startsWith('CN-'));
      const statusTxt = invoiceStatusLabel(s);
      const docType = isCN ? (t.creditNote||'Credit Note') : `${t.invoice||'Invoice'}${statusTxt ? ` - ${statusTxt}` : ''}`;
      let created = s.created_at ? new Date(s.created_at) : null;
      if(!created || isNaN(created.getTime())){ try{ created = new Date(String(s.created_at).replace(' ', 'T')); }catch(_){ created = new Date(); } }
      const dateStr = dateFormatter.format(created);
      const custPhone = s.customer_phone || s.disp_customer_phone || '';
      const cust = custPhone || (s.customer_name || s.disp_customer_name || '');
      const pre = allInvoicesRowAmount(s, 'sub_total');
      const vat = allInvoicesRowAmount(s, 'vat_total');
      const grand = allInvoicesRowAmount(s, 'grand_total');
      sumPre += pre; sumVat += vat; sumGrand += grand;
      const pm = String(s.payment_method || '').toLowerCase();
      accumulateInvoicePaymentTotals(s, payTotals, paymentsBySaleGo);
      const payLabel = payMethodLabel(pm);
      const pmLower = pm;
      const settledCash = Number(s.settled_cash || 0);
      const payCashPart = Number(s.pay_cash_amount || 0);
      const cashParam = (pmLower==='cash') ? (settledCash>0 ? settledCash : (payCashPart>0 ? payCashPart : Number(s.grand_total||0))) : 0;
      const attrs = [`data-view=\"${s.id}\"`, `data-type=\"${isCN?'credit':'invoice'}\"`, `data-pay=\"${pmLower}\"`];
      if(cashParam){ attrs.push(`data-cash=\"${cashParam}\"`); }
      if(isCN){
        const baseId = (s.ref_base_sale_id != null) ? String(s.ref_base_sale_id) : '';
        const baseNo = (s.ref_base_invoice_no != null) ? String(s.ref_base_invoice_no) : '';
        if(baseId) attrs.push(`data-base=\"${baseId}\"`);
        if(baseNo) attrs.push(`data-base-no=\"${baseNo}\"`);
      }
      const viewBtn = `<button class=\"px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-sm text-xs\" ${attrs.join(' ')}>${t.view||'View'}</button>`;
      const rowClass = isCN ? 'credit-row' : '';
      const deliveryName = s.delivery_company_name || '—';
      const deliveryDisc = s.delivery_discount_amount ? Number(s.delivery_discount_amount).toFixed(2) : '—';
      return `<tr class="${rowClass}"><td class=\"num\">${s.invoice_no||''}</td><td>${docType}</td><td dir=\"ltr\" style=\"text-align:left\">${cust}</td><td class=\"num\">${dateStr}</td><td>${payLabel}</td><td class=\"num\">${fmt(pre)}</td><td class=\"num\">${fmt(vat)}</td><td class=\"num\">${fmt(grand)}</td><td>${deliveryName}</td><td class=\"num\">${deliveryDisc}</td><td>${viewBtn}</td></tr>`;
    }).join('');

    if(invTbody){ invTbody.innerHTML = rows || `<tr><td colspan="11" class="text-center text-gray-500 font-semibold py-8">📋 ${t.noDocuments || 'No documents within the period'}</td></tr>`; }
    if(invCount){ invCount.textContent = String(items.length||0); }
    
    const set = (id, v)=>{ const el = document.getElementById(id); if(!el) return; el.textContent = (id==='sumCount') ? String(v) : fmt(v); };
    set('sumPre', totalSumPre);
    set('sumVat', totalSumVat);
    set('sumGrand', totalSumGrand);
    set('sumCount', total);

    const payEl = document.getElementById('payTotals');
    if(payEl){
      const rows = Array.from(totalPayTotals.entries()).map(([k, v]) => `<tr><td class="py-2 text-lg font-semibold text-gray-700">${payMethodLabel(k)}</td><td class="py-2 text-lg font-bold text-green-700 text-left">${fmt(v)}</td></tr>`).join('');
      payEl.innerHTML = rows || `<tr><td colspan="2" class="text-center text-gray-400 py-4">${t.noData || 'No data'}</td></tr>`;
    }

    renderPagination(total, page);
  }catch(e){ console.error('Error loading invoices:', e); alert(t.loadFailed || 'Failed to load invoices'); }
  
  // التمرير لأعلى الجدول
  try{
    document.querySelector('.bg-white.rounded-2xl')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }catch(_){}
}

function initDefaultRange(){
  // افتراضيًا: من بداية اليوم حتى نهايته
  const now = new Date();
  const start = new Date(now); start.setHours(0,0,0,0);
  const end = new Date(now); end.setHours(23,59,0,0);
  const pad2 = (v)=> String(v).padStart(2,'0');
  const toLocal = (d)=> `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  if(fromAtEl) fromAtEl.value = toLocal(start);
  if(toAtEl) toAtEl.value = toLocal(end);
}

async function applyRange(){
  const t = __currentLang || {};
  const s = fromInputToStr(fromAtEl);
  const e = fromInputToStr(toAtEl);
  if(!s || !e){ alert(t.specifyRange || 'Please specify the full period'); return; }
  const userFilterEl = document.getElementById('userFilter');
  const userId = userFilterEl && userFilterEl.value ? userFilterEl.value : null;
  await loadRange(s, e, userId);
}

const applyBtn = document.getElementById('applyRangeBtn');
if(applyBtn){ applyBtn.addEventListener('click', applyRange); }

// Load users list for filter
async function loadUsers(){
  try{
    const res = await window.api.users_list();
    if(res && res.ok && res.items){
      const userFilterEl = document.getElementById('userFilter');
      if(userFilterEl){
        // عرض المستخدمين النشطين فقط
        const t = __currentLang || {};
        res.items.filter(u => u.is_active).forEach(user => {
          const option = document.createElement('option');
          option.value = user.id;
          option.textContent = user.full_name || user.username || `${t.user||'User'} ${user.id}`;
          userFilterEl.appendChild(option);
        });
      }
    }
  }catch(e){ console.error('Error loading users:', e); }
}

// Event delegation للأزرار "عرض" - أداء أفضل من listeners منفصلة
document.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-view]');
  if(!btn) return;
  
  const id = Number(btn.getAttribute('data-view'));
  const type = btn.getAttribute('data-type');
  const page = '../sales/print.html';
  const pay = btn.getAttribute('data-pay') || '';
  const cash = btn.getAttribute('data-cash') || '';
  const qsObj = { id: String(id), ...(pay?{pay}:{}) , ...(cash?{cash}:{}) };
  
  if(type === 'credit'){
    const base = btn.getAttribute('data-base') || '';
    const baseNo = btn.getAttribute('data-base-no') || '';
    if(base) qsObj.base = base;
    if(baseNo) qsObj.base_no = baseNo;
  }
  
  const qs = new URLSearchParams({ preview:'1', ...qsObj });
  const w = 500, h = 700;
  const url = `${page}?${qs.toString()}`;
  window.open(url, 'PRINT_VIEW', `width=${w},height=${h},menubar=no,toolbar=no,location=no,status=no`);
});

// فتح التقويم عند الضغط في أي مكان في حقل التاريخ (للأجهزة اللمسية)
if(fromAtEl){
  fromAtEl.addEventListener('click', function(){ this.showPicker(); });
  fromAtEl.addEventListener('focus', function(){ this.showPicker(); });
}
if(toAtEl){
  toAtEl.addEventListener('click', function(){ this.showPicker(); });
  toAtEl.addEventListener('focus', function(){ this.showPicker(); });
}

// init
loadUsers();
initDefaultRange();
// انتظر المستخدم يضغط تطبيق