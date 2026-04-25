// Daily report screen logic
// - Uses settings.closing_hour to compute the daily window [start, end)
// - Aggregates sales and purchases

// Language system
const __langKey = 'app_lang';
let __currentLang = {};
function __applyLang(lang){
  const base = (typeof lang==='string' ? lang.split('-')[0].toLowerCase() : 'ar');
  const isAr = (base==='ar');
  const t = {
    // Page title
    dailyReport: isAr ? 'التقرير اليومي' : 'Daily report',
    systemTitle: isAr ? 'نظام إدارة المطاعم' : 'Restaurant Management System',
    back: isAr ? 'Back' : 'Back',
    // Summary table
    detailedSummary: isAr ? 'الملخص التفصيلي' : 'Detailed summary',
    description: isAr ? 'البيان' : 'Description',
    preVAT: isAr ? 'قبل الضريبة' : 'Pre-VAT',
    tobaccoFee: isAr ? 'رسوم التبغ' : 'Tobacco fee',
    vat: isAr ? 'الضريبة' : 'VAT',
    afterVAT: isAr ? 'بعد الضريبة' : 'After VAT',
    // Summary rows
    sales: isAr ? 'المبيعات' : 'Sales',
    discounts: isAr ? 'الخصومات' : 'Discounts',
    salesAfterDiscount: isAr ? 'المبيعات بعد الخصم' : 'Sales after discount',
    creditNotes: isAr ? 'إشعارات الدائن (المرتجعات)' : 'Credit notes (returns)',
    salesAfterDiscountNet: isAr ? 'إجمالي المبيعات بعد الخصم بعد المرتجعات' : 'Total sales after discount after returns',
    purchases: isAr ? 'المشتريات' : 'Purchases',
    net: isAr ? 'الصافي' : 'Net',
    // Payment methods
    paymentMethods: isAr ? 'طرق الدفع' : 'Payment methods',
    method: isAr ? 'الطريقة' : 'Method',
    total: isAr ? 'الإجمالي' : 'Total',
    grandTotal: isAr ? 'الإجمالي الكلي' : 'Grand total',
    // Payment method labels
    cash: isAr ? 'نقدًا' : 'Cash',
    network: isAr ? 'شبكة' : 'Network',
    credit: isAr ? 'آجل' : 'Credit',
    tamara: isAr ? 'تمارا' : 'Tamara',
    tabby: isAr ? 'تابي' : 'Tabby',
    mixed: isAr ? 'مختلط' : 'Mixed',
    bank_transfer: isAr ? 'تحويل بنكي' : 'Bank Transfer',
    // Sections
    soldProducts: isAr ? 'المنتجات المباعة' : 'Sold products',
    product: isAr ? 'المنتج' : 'Product',
    quantity: isAr ? 'الكمية' : 'Quantity',
    purchasesSection: isAr ? 'المشتريات' : 'Purchases',
    purchaseName: isAr ? 'اسم المشتريات' : 'Purchase name',
    date: isAr ? 'التاريخ' : 'Date',
    notes: isAr ? 'ملاحظات' : 'Notes',
    invoices: isAr ? 'الفواتير' : 'Invoices',
    invoicesNote: isAr ? 'تشمل الفواتير غير الدائنة فقط ضمن الفترة.' : 'Includes non-credit invoices only within the period.',
    number: isAr ? 'رقم' : 'No.',
    customer: isAr ? 'العميل' : 'Customer',
    paymentMethod: isAr ? 'طريقة الدفع' : 'Payment method',
    view: isAr ? 'عرض' : 'View',
    creditNotesSection: isAr ? 'مرتجع/إشعارات دائنة' : 'Returns/Credit notes',
  };
  
  __currentLang = t;
  
  // Apply HTML attributes
  document.documentElement.lang = isAr ? 'ar' : 'en';
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  
  // Page title
  document.title = t.dailyReport;
  const pageTitle = document.querySelector('.text-3xl');
  if(pageTitle) pageTitle.textContent = t.dailyReport;
  
  const systemTitle = document.querySelector('.text-sm.text-gray-500');
  if(systemTitle) systemTitle.textContent = t.systemTitle;
  
  const btnBack = document.getElementById('btnBack');
  if(btnBack) btnBack.textContent = t.back;
  
  // Summary table
  const summaryTitle = document.querySelector('.summary-section h3');
  if(summaryTitle) summaryTitle.textContent = t.detailedSummary;
  
  const summaryHeaders = document.querySelectorAll('.summary-section thead th');
  if(summaryHeaders.length >= 5){
    summaryHeaders[0].textContent = t.description;
    summaryHeaders[1].textContent = t.preVAT;
    summaryHeaders[2].textContent = t.tobaccoFee;
    summaryHeaders[3].textContent = t.vat;
    summaryHeaders[4].textContent = t.afterVAT;
  }
  
  const summaryRows = document.querySelectorAll('.summary-section tbody tr');
  if(summaryRows.length >= 6){
    summaryRows[0].querySelector('td:first-child').textContent = t.sales;
    summaryRows[1].querySelector('td:first-child').textContent = t.discounts;
    summaryRows[2].querySelector('td:first-child').textContent = t.salesAfterDiscount;
    summaryRows[3].querySelector('td:first-child').textContent = t.creditNotes;
    summaryRows[4].querySelector('td:first-child').textContent = t.salesAfterDiscountNet;
    summaryRows[5].querySelector('td:first-child').textContent = t.purchases;
  }
  
  const summaryFoot = document.querySelector('.summary-section tfoot th:first-child');
  if(summaryFoot) summaryFoot.textContent = t.net;
  
  // Payment methods section
  const payMethodsTitle = document.querySelectorAll('h3')[1];
  if(payMethodsTitle && payMethodsTitle.textContent.includes('طرق')) payMethodsTitle.textContent = t.paymentMethods;
  
  const payMethodsHeaders = document.querySelectorAll('.bg-white')[1]?.querySelectorAll('thead th');
  if(payMethodsHeaders && payMethodsHeaders.length >= 2){
    payMethodsHeaders[0].textContent = t.method;
    payMethodsHeaders[1].textContent = t.total;
  }
  
  const payMethodsFoot = document.querySelector('#sumTotal')?.closest('tr')?.querySelector('th:first-child');
  if(payMethodsFoot) payMethodsFoot.textContent = t.grandTotal;
  
  // Sold products section
  const soldProductsSummary = document.querySelector('details summary');
  if(soldProductsSummary) soldProductsSummary.textContent = t.soldProducts;
  
  const soldProductsHeaders = document.querySelector('details')?.querySelectorAll('thead th');
  if(soldProductsHeaders && soldProductsHeaders.length >= 3){
    soldProductsHeaders[0].textContent = t.product;
    soldProductsHeaders[1].textContent = t.quantity;
    soldProductsHeaders[2].textContent = t.total;
  }
  
  // Purchases section
  const purchasesSummary = document.querySelectorAll('details')[1]?.querySelector('summary');
  if(purchasesSummary) purchasesSummary.textContent = t.purchasesSection;
  
  const purchasesHeaders = document.querySelectorAll('details')[1]?.querySelectorAll('thead th');
  if(purchasesHeaders && purchasesHeaders.length >= 4){
    purchasesHeaders[0].textContent = t.purchaseName;
    purchasesHeaders[1].textContent = t.date;
    purchasesHeaders[2].textContent = t.total;
    purchasesHeaders[3].textContent = t.notes;
  }
  
  // Invoices section
  const invoicesSummary = document.querySelectorAll('details')[2]?.querySelector('summary');
  if(invoicesSummary) invoicesSummary.textContent = t.invoices;
  
  const invoicesNote = document.querySelectorAll('details')[2]?.querySelector('.text-gray-600');
  if(invoicesNote) invoicesNote.textContent = t.invoicesNote;
  
  const invoicesHeaders = document.querySelector('.tbl-inv thead')?.querySelectorAll('th');
  if(invoicesHeaders && invoicesHeaders.length >= 6){
    invoicesHeaders[0].textContent = t.number;
    invoicesHeaders[1].textContent = t.customer;
    invoicesHeaders[2].textContent = t.date;
    invoicesHeaders[3].textContent = t.paymentMethod;
    invoicesHeaders[4].textContent = t.total;
    invoicesHeaders[5].textContent = t.view;
  }
  
  // Credit notes section
  const creditNotesSummary = document.querySelectorAll('details')[3]?.querySelector('summary');
  if(creditNotesSummary) creditNotesSummary.textContent = t.creditNotesSection;
  
  const creditNotesHeaders = document.querySelector('.tbl-cn thead')?.querySelectorAll('th');
  if(creditNotesHeaders && creditNotesHeaders.length >= 6){
    creditNotesHeaders[0].textContent = t.number;
    creditNotesHeaders[1].textContent = t.customer;
    creditNotesHeaders[2].textContent = t.date;
    creditNotesHeaders[3].textContent = t.paymentMethod;
    creditNotesHeaders[4].textContent = t.total;
    creditNotesHeaders[5].textContent = t.view;
  }
  
  // Persist language locally
  try{ localStorage.setItem(__langKey, base); }catch(_){ }
}

// Initialize language
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
  // Listen for language changes
  try{
    window.api.app_on_locale_changed((L)=>{
      __applyLang(L);
    });
  }catch(_){ }
})();

const fmt = (n)=> Number(n||0).toFixed(2);
const rangeEl = document.getElementById('range');
function labelPaymentMethod(method){
  const m = String(method||'').toLowerCase();
  if(m==='cash') return __currentLang.cash || 'نقدًا';
  if(m==='card' || m==='network') return __currentLang.network || 'شبكة';
  if(m==='credit') return __currentLang.credit || 'آجل';
  if(m==='tamara') return __currentLang.tamara || 'تمارا';
  if(m==='tabby') return __currentLang.tabby || 'تابي';
  if(m==='mixed') return __currentLang.mixed || 'مختلط';
  if(m==='bank_transfer') return __currentLang.bank_transfer || 'تحويل بنكي';
  return method||'';
}

function invoiceStatusLabel(sale){
  const isCredit = String(sale?.payment_method || '').toLowerCase() === 'credit';
  const isPaid = String(sale?.payment_status || 'paid') === 'paid';
  const paidAmt = Number(sale?.amount_paid || 0);
  if(isCredit && !isPaid && paidAmt > 0){ return 'مدفوعة جزئياً'; }
  if(isCredit && !isPaid){ return 'غير مدفوعة'; }
  return '';
}

function invoiceRecognizedRatio(sale, paidInRange){
  const grand = Math.max(0, Number(sale?.grand_total || 0));
  if(grand <= 0){ return 0; }
  const paidInRangeNum = Number(paidInRange || 0);
  // If explicit partial payments in range don't cover the full invoice,
  // recognize only the paid portion. This handles old invoices (originally credit
  // or any other type) that received partial payments during this period.
  if(paidInRangeNum > 0 && paidInRangeNum < grand){
    return paidInRangeNum / grand;
  }
  const isCredit = String(sale?.payment_method || '').toLowerCase() === 'credit';
  const isPaid = String(sale?.payment_status || 'paid') === 'paid';
  if(isCredit && !isPaid){
    const paid = Math.max(0, Math.min(grand, Number(sale?.amount_paid || 0)));
    return paid / grand;
  }
  return 1;
}

function recognizedValue(sale, field, paidInRange){
  return Number(sale?.[field] || 0) * invoiceRecognizedRatio(sale, paidInRange);
}

/** إجمالي يُعرض في جدول الفواتير: للآجل الجزئي يظهر المدفوع فقط، وإلا إجمالي الفاتورة */
function invoiceTableTotalDisplay(sale, paidInRange){
  const grand = Math.max(0, Number(sale?.grand_total || 0));
  const paidInRangeNum = Number(paidInRange || 0);
  // If explicit partial payments in range don't cover the full invoice,
  // show only the paid portion. This handles old invoices paid partially in this period.
  if(paidInRangeNum > 0 && paidInRangeNum < grand){
    return Math.max(0, Math.min(grand, paidInRangeNum));
  }
  const isCredit = String(sale?.payment_method || '').toLowerCase() === 'credit';
  const isPaid = String(sale?.payment_status || 'paid') === 'paid';
  const paidAmt = Number(paidInRange || sale?.amount_paid || 0);
  if(isCredit && !isPaid && paidAmt > 0){
    return Math.max(0, Math.min(grand, paidAmt));
  }
  return grand;
}

/** مجموع المتبقي على الفواتير الآجلة غير المسددة (لصف «طرق الدفع») */
function creditRemainingTotal(allSales){
  return (allSales || [])
    .filter(s => String(s.doc_type || '') !== 'credit_note' && !String(s.invoice_no || '').startsWith('CN-') && String(s.payment_method || '').toLowerCase() === 'credit' && String(s.payment_status || '') !== 'paid')
    .reduce((acc, s) => {
      const g = Number(s.grand_total || 0);
      const paid = Number(s.amount_paid || 0);
      return acc + Math.max(0, g - paid);
    }, 0);
}

async function buildPaymentsBySaleMap(creditSaleIds, salesList){
  const map = new Map();
  const uniqBatch = [...new Set((creditSaleIds || []).map(x => Number(x)).filter(x => Number.isFinite(x) && x > 0))];
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
  if(!Array.isArray(salesList) || !salesList.length) return map;
  const needFetch = [];
  for(const s of salesList){
    if(String(s.payment_method || '').toLowerCase() !== 'credit') continue;
    if(String(s.payment_status || '') === 'paid') continue;
    const sid = Number(s.id);
    if(!Number.isFinite(sid) || sid <= 0) continue;
    if(Number(s.amount_paid || 0) <= 0) continue;
    const rows = map.get(sid);
    if(rows && rows.length) continue;
    needFetch.push(sid);
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

/** إضافة دفعات الآجل الجزئية إلى payByMethod حسب invoice_payments (كاش/شبكة/...) */
function addPartialCreditPaymentsToPayMap(payByMethod, sale, paymentsBySale){
  const add = (method, amount)=>{
    if(!method) return;
    let k = String(method).toLowerCase();
    if(k === 'network') k = 'card';
    const prev = Number(payByMethod.get(k) || 0);
    payByMethod.set(k, prev + Number(amount || 0));
  };
  const list = paymentsBySale.get(Number(sale.id)) || [];
  const KNOWN = new Set(['cash', 'card', 'tamara', 'tabby', 'bank_transfer', 'credit']);
  if(list.length){
    let sumListed = 0;
    let attributed = 0;
    for(const p of list){
      const amt = Number(p.amount || 0);
      sumListed += amt;
      let m = String(p.method ?? '').trim().toLowerCase();
      if(m === 'network') m = 'card';
      if(m && KNOWN.has(m)){
        add(m, amt);
        attributed += amt;
      }
    }
    const loose = sumListed - attributed;
    if(loose > 0.009) add('credit', loose);
    const ap = Number(sale.amount_paid || 0);
    if(ap > sumListed + 0.009) add('credit', ap - sumListed);
  } else {
    const ap = Number(sale.amount_paid || 0);
    if(ap > 0) add('credit', ap);
  }
}

const btnBack = document.getElementById('btnBack');
if(btnBack){ btnBack.onclick = ()=>{ window.location.href = './index.html'; } }

// Attach export handlers early so clicks always work
(function attachExportHandlers(){
  let exporting = false; // prevent multiple exports at once
  const btnPdf = document.getElementById('exportPdfBtn');
  if(btnPdf){
    btnPdf.addEventListener('click', async () => {
      if(exporting) return; exporting = true; btnPdf.disabled = true;
      try{
        const period = (rangeEl && rangeEl.textContent) ? rangeEl.textContent.replace(/[^0-9_\-–: ]+/g,'').replace(/\s+/g,' ').trim() : '';
        const safe = (period||'').replace(/[: ]/g,'_');
        const title = `daily-report-${safe||Date.now()}.pdf`;
        
        const clone = document.documentElement.cloneNode(true);
        try{ Array.from(clone.querySelectorAll('details')).forEach(d=> d.setAttribute('open','')); }catch(_){ }
        
        // إضافة Tailwind CSS
        try{
          const tailwindLink = document.createElement('script');
          tailwindLink.src = 'https://cdn.tailwindcss.com';
          clone.querySelector('head')?.appendChild(tailwindLink);
        }catch(_){}
        
        // إزالة العناصر غير المطلوبة
        try{
          const removeElements = clone.querySelectorAll('header, button, select, input, label');
          removeElements.forEach(el => {
            try{ el.remove(); }catch(_){}
          });
        }catch(_){ }
        
        // إضافة عنوان ومعلومات الفترة
        try{
          const container = clone.querySelector('.container');
          if(container){
            const firstChild = container.firstElementChild;
            if(firstChild){
              firstChild.remove();
            }
            
            const tempDiv = document.createElement('div');
            tempDiv.style.cssText = 'text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 4px solid #2563eb;';
            
            let headerHTML = `<h1 style="font-size: 28px; font-weight: 900; color: #1f2937; margin-bottom: 8px; font-family: Cairo, sans-serif;">${__currentLang.dailyReport || 'التقرير اليومي'}</h1>`;
            
            if(rangeEl && rangeEl.textContent){
              headerHTML += '<div style="font-size: 16px; font-weight: 700; color: #4b5563; margin-top: 12px; font-family: Cairo, sans-serif;">';
              headerHTML += `<div style="margin: 4px 0;">${rangeEl.textContent}</div>`;
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
            
            details > summary {
              font-size: 16px !important;
              font-weight: 900 !important;
              color: #1f2937 !important;
              margin-top: 20px !important;
              margin-bottom: 12px !important;
              padding-bottom: 8px !important;
              border-bottom: 3px solid #3b82f6 !important;
              page-break-after: avoid !important;
            }
            
            details > summary::before {
              display: none !important;
            }
            
            table {
              width: 100% !important;
              border-collapse: collapse !important;
              table-layout: fixed !important;
              font-size: 11px !important;
            }
            
            table thead th {
              background: linear-gradient(to bottom, #f0f9ff, #e0f2fe) !important;
              color: #1e40af !important;
              font-weight: 900 !important;
              padding: 10px 6px !important;
              border: 2px solid #94a3b8 !important;
              text-align: right !important;
              white-space: normal !important;
              word-wrap: break-word !important;
              overflow-wrap: break-word !important;
            }
            
            table tbody td {
              padding: 8px 6px !important;
              border: 1px solid #cbd5e1 !important;
              text-align: right !important;
              white-space: normal !important;
              word-wrap: break-word !important;
              overflow-wrap: break-word !important;
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
              text-align: right !important;
              font-size: 12px !important;
            }
            
            .summary-section table thead th {
              background: linear-gradient(to bottom, #f0f9ff, #e0f2fe) !important;
              color: #1e40af !important;
            }
            
            .summary-section table tbody td {
              font-size: 11px !important;
              font-weight: 900 !important;
              text-align: center !important;
              padding: 8px 6px !important;
            }
            
            .summary-section table tbody td:last-child,
            .summary-section table thead th:last-child,
            .summary-section table tfoot th:last-child {
              white-space: nowrap !important;
              text-align: right !important;
              width: 35% !important;
              min-width: 180px !important;
            }
            
            .summary-section table tfoot th {
              background: #dbeafe !important;
              border-top: 3px solid #3b82f6 !important;
            }
            
            /* تحديد عرض الأعمدة لجدول الفواتير والإشعارات الدائنة */
            table thead th:nth-child(1),
            table tbody td:nth-child(1) {
              width: 12% !important;
            }
            
            table thead th:nth-child(2),
            table tbody td:nth-child(2) {
              width: 22% !important;
            }
            
            table thead th:nth-child(3),
            table tbody td:nth-child(3) {
              width: 28% !important;
            }
            
            table thead th:nth-child(4),
            table tbody td:nth-child(4) {
              width: 18% !important;
            }
            
            table thead th:nth-child(5),
            table tbody td:nth-child(5) {
              width: 20% !important;
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
      }catch(e){ console.error(e); alert('تعذر إنشاء PDF'); }
      finally{ exporting = false; btnPdf.disabled = false; }
    });
  }
  const btnExcel = document.getElementById('exportExcelBtn');
  if(btnExcel){
    btnExcel.addEventListener('click', async () => {
      if(exporting) return; exporting = true; btnExcel.disabled = true;
      try{
        // Build CSV from DOM as a fallback so export works even if data variables failed
        const lines = [];
        const esc = (v)=> ('"'+String(v??'').replace(/"/g,'""')+'"');
        const addTable = (title, tableElem)=>{
          try{
            if(!tableElem) return;
            lines.push(esc(title));
            const ths = Array.from(tableElem.querySelectorAll('thead th')).map(th=>th.textContent.trim());
            if(ths.length) lines.push(ths.map(esc).join(','));
            Array.from(tableElem.querySelectorAll('tbody tr')).forEach(tr=>{
              const tds = Array.from(tr.querySelectorAll('td')).map(td=>td.textContent.trim());
              if(tds.length) lines.push(tds.map(esc).join(','));
            });
            lines.push('');
          }catch(_){ /* ignore */ }
        };
        if(rangeEl && rangeEl.textContent){ lines.push(esc('الفترة'), esc(rangeEl.textContent.trim())); lines.push(''); }
        addTable('إجماليات طرق الدفع', document.querySelector('table tbody#payTbody')?.closest('table'));
        addTable('الفواتير', document.querySelector('table tbody#invTbody')?.closest('table'));
        addTable('الإشعارات الدائنة', document.querySelector('table tbody#cnTbody')?.closest('table'));
        addTable('المشتريات', document.querySelector('table tbody#purTbody')?.closest('table'));
        addTable('المنتجات المباعة', document.querySelector('table tbody#soldItemsTbody')?.closest('table'));
        const csv = lines.join('\n');
        const period = (rangeEl && rangeEl.textContent) ? rangeEl.textContent.replace(/[^0-9_\-–: ]+/g,'').replace(/\s+/g,' ').trim() : '';
        const filename = `daily-report-${(period||'').replace(/[: ]/g,'_')||Date.now()}.csv`;
        await window.api.csv_export(csv, { saveMode:'auto', filename });
        // no success alert per requirement
      }catch(e){ console.error(e); alert('تعذر إنشاء Excel'); }
      finally{ exporting = false; btnExcel.disabled = false; }
    });
  }

  // Print report (thermal 80mm x 297mm)
  const btnPrint = document.getElementById('printReportBtn');
  if(btnPrint){
    btnPrint.addEventListener('click', async ()=>{
      try{
        btnPrint.disabled = true;
        // Ensure settings-based margins are applied before snapshot
        try{ if(window.applyPrintMarginsFromSettings) await window.applyPrintMarginsFromSettings(); }catch(_){ }
        // Prepare a clean HTML snapshot (remove export buttons/toolbars)
        const clone = document.documentElement.cloneNode(true);
        
        // طباعة الأقسام المفتوحة فقط (عدم فتح المطوية)
        
        // Remove toolbar actions except title and range
        try{
          const toolbar = clone.querySelector('.range-actions');
          if(toolbar){ toolbar.parentNode.removeChild(toolbar); }
          // Remove entire header to avoid any top spacing
          const hdr = clone.querySelector('header');
          if(hdr && hdr.parentNode){ hdr.parentNode.removeChild(hdr); }
        }catch(_){ }
        // Remove non-print action columns ("عرض") to save width for content
        try{
          const removeLastCol = (tbodyId) => {
            const tb = clone.getElementById(tbodyId);
            if(!tb) return;
            const table = tb.closest('table');
            if(!table) return;
            const headRow = table.querySelector('thead tr');
            if(headRow && headRow.lastElementChild){ headRow.removeChild(headRow.lastElementChild); }
            Array.from(tb.querySelectorAll('tr')).forEach(tr => {
              try{ tr.lastElementChild && tr.removeChild(tr.lastElementChild); }catch(_){ }
            });
          };
          removeLastCol('invTbody');
          removeLastCol('cnTbody');
          // Extra safety: explicitly remove the 6th column ("عرض") by index
          const removeColIdx = (tbodyId, idx) => {
            const tb = clone.getElementById(tbodyId);
            if(!tb) return;
            const table = tb.closest('table');
            if(!table) return;
            try{ const htr = table.querySelector('thead tr'); const th = htr?.querySelector(`th:nth-child(${idx})`); th && th.remove(); }catch(_){ }
            Array.from(tb.querySelectorAll('tr')).forEach(tr => { try{ const td = tr.querySelector(`td:nth-child(${idx})`); td && td.remove(); }catch(_){ } });
            try{ const ftr = table.querySelector('tfoot tr'); const fth = ftr?.querySelector(`th:nth-child(${idx})`); fth && fth.remove(); }catch(_){ }
          };
          removeColIdx('invTbody', 6);
          removeColIdx('cnTbody', 6);
          // Mark tables for targeted column widths
          const markTable = (tbodyId, cls) => {
            const tb = clone.getElementById(tbodyId);
            if(!tb) return;
            const table = tb.closest('table');
            if(table) table.classList.add(cls);
          };
          markTable('invTbody','tbl-inv');
          markTable('cnTbody','tbl-cn');
          markTable('soldItemsTbody','tbl-sold');
          markTable('purTbody','tbl-pur');
          // Mark summary table (الملخص التفصيلي) to control first column wrapping
          try{
            const h = Array.from(clone.querySelectorAll('h3')).find(x => /الملخص\s*التفصيلي/.test(x.textContent||''));
            const t = h && h.parentElement ? h.parentElement.querySelector('table') : null;
            if(t){
              t.classList.add('tbl-sum');
              const sec = t.closest('.section');
              if(sec){ sec.classList.add('summary-section'); }
            }
          }catch(_){ }
        }catch(_){ }

        // Add print styles for 80mm width with stronger wrapping and column widths
        const style = document.createElement('style');
        style.textContent = `
          /* لا تحدد ارتفاع الصفحة لتجنب القص، دعه يحسب ديناميكيًا */
          @page { margin: 0; }
          html{ width:100%; margin:0; padding:0; }
          body{ width:80mm; max-width:80mm; margin:0 auto; padding:0; box-sizing: border-box; padding-left: var(--m-left); padding-right: var(--m-right); font-family: 'Cairo', sans-serif !important; font-weight: 900 !important; color: #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          *{ box-sizing: border-box; font-family: 'Cairo', sans-serif !important; font-weight: 900 !important; color: #000 !important; }
          /* Ensure first content touches the top */
          body, .container, .section:first-child{ margin-top:0 !important; padding-top:0 !important; }
          /* Use Settings-based margins for thermal: paddings from CSS vars */
          .container{ width:100%; max-width:100%; margin:0; padding-left: 0; padding-right: 0; padding-top:0; padding-bottom:4px; overflow:hidden; }
          /* Avoid top margin collapse from first child */
          .container > *:first-child{ margin-top:0 !important; }
          .range-bar{ margin-top:0 !important; }
          /* ألغِ اللفّ المخفي حتى لا تُقص الأعمدة */
          div[style*="overflow:auto"]{ overflow: visible !important; }
          /* الجداول: توزيع تلقائي مع التفاف الأسطر */
          table{ width:100% !important; max-width:100% !important; border-collapse:collapse; table-layout: fixed !important; font-size:9px; line-height:1.1; }
          th,td{ padding:2px 1px; word-break: break-word; overflow-wrap: break-word; white-space: normal; vertical-align: top; }
          
          /* ضبط تباعد الخلايا رأسًا وأفقًا ليطابق تقرير الفترة */
          .tbl-inv th, .tbl-inv td, .tbl-cn th, .tbl-cn td{ padding:2px 1px; font-size: 8px; }
          .tbl-inv tr, .tbl-cn tr{ line-height:1.1; }
          
          /* تحديد عرض الأعمدة بدقة */
          /* 1. رقم (12%) */
          .tbl-inv th:nth-child(1), .tbl-inv td:nth-child(1),
          .tbl-cn th:nth-child(1), .tbl-cn td:nth-child(1) { width: 12%; white-space: nowrap; overflow: hidden; }
          
          /* 2. العميل (28%) */
          .tbl-inv th:nth-child(2), .tbl-inv td:nth-child(2),
          .tbl-cn th:nth-child(2), .tbl-cn td:nth-child(2) { width: 28%; white-space: normal; overflow-wrap: break-word; }
          
          /* 3. التاريخ (25%) */
          .tbl-inv th:nth-child(3), .tbl-inv td:nth-child(3),
          .tbl-cn th:nth-child(3), .tbl-cn td:nth-child(3) { width: 25%; white-space: normal; font-size: 7.5px; }
          
          /* 4. طريقة الدفع (15%) */
          .tbl-inv th:nth-child(4), .tbl-inv td:nth-child(4),
          .tbl-cn th:nth-child(4), .tbl-cn td:nth-child(4) { width: 15%; white-space: normal; }
          
          /* 5. الإجمالي (20%) */
          .tbl-inv th:nth-child(5), .tbl-inv td:nth-child(5),
          .tbl-cn th:nth-child(5), .tbl-cn td:nth-child(5) { width: 20%; white-space: nowrap; }

          /* إخفاء عمود العرض (6) */
          .tbl-inv th:nth-child(6), .tbl-inv td:nth-child(6),
          .tbl-cn th:nth-child(6), .tbl-cn td:nth-child(6) { display: none !important; width: 0 !important; }

          /* لا تكسر الحروف العربية داخل كلمة البيان: لف عند المسافات فقط */
          .tbl-sum th:nth-child(1), .tbl-sum td:nth-child(1){ word-break: normal; overflow-wrap: normal; white-space: normal; }
          th{ background:#eef2ff; color:#0b3daa; border-bottom:2px solid #000; }
          .section{ margin:5px 0; padding:5px; border:1px solid #e5e7eb; }
          /* حدود ثقيلة للملخص التفصيلي */
          .summary-section{ border:2px solid #000; }
          .summary-section table{ border:2px solid #000; border-collapse:collapse; }
          .summary-section th, .summary-section td{ border:1px solid #000; }
          .summary-section tfoot th{ border-top:2px solid #000; }
          .summary-section .tbl-sum{ table-layout: auto !important; width:100% !important; max-width:100% !important; }
          .summary-section .tbl-sum th, .summary-section .tbl-sum td{ font-size:7px; padding:1px 2px; text-align: center; vertical-align: middle; white-space: nowrap; word-break: keep-all; overflow-wrap: normal; overflow: hidden; text-overflow: clip; }
          .summary-section .tbl-sum th:nth-child(1), .summary-section .tbl-sum td:nth-child(1){ white-space: normal; word-break: break-word; overflow-wrap: anywhere; text-align: right; width: auto; max-width: 50%; font-size:7px; padding: 1px 3px; line-height: 1.15; }
          .summary-section .tbl-sum th:nth-child(2), .summary-section .tbl-sum td:nth-child(2){ white-space: nowrap !important; width: 1%; font-size:6.5px; padding: 1px 1.5px; }
          .summary-section .tbl-sum th:nth-child(3), .summary-section .tbl-sum td:nth-child(3){ white-space: nowrap !important; width: 1%; font-size:6.5px; padding: 1px 1.5px; }
          .summary-section .tbl-sum th:nth-child(4), .summary-section .tbl-sum td:nth-child(4){ white-space: nowrap !important; width: 1%; font-size:6.5px; padding: 1px 1.5px; }
          .summary-section .tbl-sum th:nth-child(5), .summary-section .tbl-sum td:nth-child(5){ white-space: nowrap !important; width: 1%; font-size:6.5px; padding: 1px 1.5px; }

          /* شبكة للطباعة للفواتير والإشعارات الدائنة */
          .tbl-inv, .tbl-cn{ border:2px solid #000; border-collapse:collapse; }
          .tbl-inv th, .tbl-inv td, .tbl-cn th, .tbl-cn td{ border:1px solid #000; }
          .tbl-inv tfoot th, .tbl-cn tfoot th{ border-top:2px solid #000; }

          /* إخفاء عمود "عرض" أثناء الطباعة للفواتير والإشعارات الدائنة كضمان إضافي */
          @media print {
            .tbl-inv thead th:last-child, .tbl-inv tbody td:last-child, .tbl-inv tfoot th:last-child { display: none !important; }
            .tbl-cn thead th:last-child, .tbl-cn tbody td:last-child, .tbl-cn tfoot th:last-child { display: none !important; }
          }



          /* المنتجات المباعة: المنتج | الكمية | الإجمالي */
          .tbl-sold th:nth-child(1), .tbl-sold td:nth-child(1){ width:60%; }
          .tbl-sold th:nth-child(2), .tbl-sold td:nth-child(2){ width:20%; font-size:9.3px; }
          .tbl-sold th:nth-child(3), .tbl-sold td:nth-child(3){ width:20%; }

          /* المشتريات: البيان | التاريخ | الإجمالي | ملاحظات */
          .tbl-pur th:nth-child(1), .tbl-pur td:nth-child(1){ width:30%; }
          .tbl-pur th:nth-child(2), .tbl-pur td:nth-child(2){ width:25%; font-size:9.3px; }
          .tbl-pur th:nth-child(3), .tbl-pur td:nth-child(3){ width:15%; }
          .tbl-pur th:nth-child(4), .tbl-pur td:nth-child(4){ width:30%; }
        `;
        clone.querySelector('head')?.appendChild(style);
        // Split period label into two lines: من ... ثم إلى ...
        try{
          const r = clone.getElementById('range');
          if(r && r.textContent){
            const m = r.textContent.match(/الفترة:\s*(\d{4}-\d{2}-\d{2}[^–]+)\s*[—–-]\s*(\d{4}-\d{2}-\d{2}.*)$/);
            if(m){ r.innerHTML = `الفترة:<br>من: ${m[1].trim()}<br>إلى: ${m[2].trim()}`; }
          }
        }catch(_){ }
        const html = '<!doctype html>' + clone.outerHTML;
        await window.api.print_html(html, {
          silent: true,
          // طبق نفس إعدادات الفاتورة بالضبط (80mm x 297mm وبدون هوامش)
          pageSize: { width: 80000, height: 297000 },
          margins: { marginType: 'none' },
          printBackground: true,
        });
      }catch(e){ console.error(e); alert('تعذر الطباعة'); }
      finally{ btnPrint.disabled = false; }
    });
  }
})();

function computeDailyRange(closingHour){
  // closingHour: 'HH:MM' (24h), default '00:00'
  const now = new Date();
  let [hh, mm] = String(closingHour||'00:00').split(':').map(x=>parseInt(x||'0',10));
  // sanitize
  if(!Number.isFinite(hh) || hh<0) hh = 0; if(hh>23) hh = 0;
  if(!Number.isFinite(mm) || mm<0) mm = 0; if(mm>59) mm = 0;
  // build today closing time
  const todayClose = new Date(now);
  todayClose.setHours(hh||0, mm||0, 0, 0);
  let start, end;
  if(now < todayClose){
    // before closing -> current day started at yesterday close
    start = new Date(todayClose.getTime() - 24*3600*1000);
    end = todayClose;
  }else{
    // after closing -> current day starts at today close until tomorrow close
    start = todayClose;
    end = new Date(todayClose.getTime() + 24*3600*1000);
  }
  const pad2 = (v)=> String(v).padStart(2,'0');
  const toStr = (d)=> `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:00`;
  return { now, start, end, startStr: toStr(start), endStr: toStr(end) };
}

async function load(){
  // Reset load flag
  window.__dailyReportLoadComplete = false;
  try{
    const st = await window.api.settings_get();
    const s = (st && st.ok) ? st.item : {};
    const closingHour = s.closing_hour || '00:00';
    const { start, end, startStr, endStr } = computeDailyRange(closingHour);
    
    // تعديل endStr لضمان شمول كل الثواني في الدقيقة المحددة
    let adjustedEndStr = endStr;
    if(endStr && endStr.match(/\s00:00:00$/)){
      adjustedEndStr = endStr.replace(/00:00:00$/, '23:59:59');
    } else if(endStr && endStr.match(/:\d\d:00$/)){
      adjustedEndStr = endStr.replace(/:00$/, ':59');
    }
    
    rangeEl.textContent = `الفترة: ${startStr} — ${endStr}`;

    // Load sold items summary grouped by product
    let soldItems = [];
    try{
      const sumRes = await window.api.sales_items_summary({ date_from: startStr, date_to: adjustedEndStr });
      soldItems = (sumRes && sumRes.ok) ? (sumRes.items||[]) : [];
    }catch(_){ soldItems = []; }

    // Load sales within range
    let salesRes = await window.api.sales_list({ date_from: startStr, date_to: adjustedEndStr, limit: 50000, include_partial_credit_paid_in_range: true });
    let allSales = (salesRes && salesRes.ok) ? (salesRes.items||[]) : [];
    // If empty and we're close to edges, retry with 1-hour padding on both sides to avoid timezone/seconds mismatch
    if(!allSales.length){
      try{
        const padMs = 60*60*1000; // 1h
        const start2 = new Date(start.getTime() - padMs);
        const end2 = new Date(end.getTime() + padMs);
        const pad2 = (v)=> String(v).padStart(2,'0');
        const toStr = (d)=> `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:00`;
        const s2 = toStr(start2), e2 = toStr(end2);
        salesRes = await window.api.sales_list({ date_from: s2, date_to: e2, limit: 50000 });
        allSales = (salesRes && salesRes.ok) ? (salesRes.items||[]) : [];
      }catch(_){ }
    }
    const partialPaymentsRows = [];
    const partialPaidSaleIdsInRange = new Set();
    try{
      if(typeof window.api.sales_list_partial_payments_in_range === 'function'){
        const pr = await window.api.sales_list_partial_payments_in_range({ date_from: startStr, date_to: adjustedEndStr });
        const rows = (pr && pr.ok && Array.isArray(pr.items)) ? pr.items : [];
        rows.forEach(p => {
          const sid = Number(p.sale_id);
          if(!Number.isFinite(sid) || sid <= 0) return;
          partialPaymentsRows.push(p);
          partialPaidSaleIdsInRange.add(sid);
        });
      }
    }catch(_){ }

    if(!partialPaymentsRows.length){
      try{
        const broadRes = await window.api.sales_list({ limit: 50000 });
        const broadSales = (broadRes && broadRes.ok) ? (broadRes.items||[]) : [];
        const salesById = new Map();
        const creditIds = [];
        for(const s of broadSales){
          const sid = Number(s?.id);
          if(!Number.isFinite(sid) || sid <= 0) continue;
          salesById.set(sid, s);
          const isCreditNote = (String(s.doc_type||'') === 'credit_note' || String(s.invoice_no||'').startsWith('CN-'));
          if(isCreditNote) continue;
          if(String(s.payment_method||'').toLowerCase() !== 'credit') continue;
          if(String(s.payment_status||'') === 'paid') continue;
          creditIds.push(sid);
        }
        if(creditIds.length && typeof window.api.sales_get_payments_batch === 'function'){
          const batch = await window.api.sales_get_payments_batch(creditIds);
          const payments = (batch && batch.ok && Array.isArray(batch.payments)) ? batch.payments : [];
          const seen = new Set();
          payments.forEach(p => {
            const sid = Number(p.sale_id);
            const paidAt = p?.paid_at ? new Date(p.paid_at) : null;
            if(!Number.isFinite(sid) || sid <= 0) return;
            if(!(paidAt instanceof Date) || Number.isNaN(paidAt.getTime())) return;
            if(!(paidAt >= start && paidAt < end)) return;
            const sale = salesById.get(sid);
            if(!sale) return;
            const key = `${Number(p.id||0)}:${sid}:${String(p.paid_at||'')}:${Number(p.amount||0)}`;
            if(seen.has(key)) return;
            seen.add(key);
            partialPaymentsRows.push({
              ...p,
              invoice_no: sale.invoice_no,
              customer_name: sale.customer_name,
              customer_phone: sale.customer_phone,
              sub_total: sale.sub_total,
              vat_total: sale.vat_total,
              grand_total: sale.grand_total,
              discount_amount: sale.discount_amount,
              delivery_discount_amount: sale.delivery_discount_amount,
              tobacco_fee: sale.tobacco_fee,
              payment_status: sale.payment_status,
              payment_method: sale.payment_method,
              created_at: sale.created_at
            });
            partialPaidSaleIdsInRange.add(sid);
          });
        }
      }catch(_){ }
    }

    // مجموع الدفعات التي تمت داخل الفترة (اليوم) لكل فاتورة — لعرض فقط ما تم سداده اليوم
    const paidInRangeBySale = new Map();
    for(const p of partialPaymentsRows){
      const sid = Number(p.sale_id);
      if(!Number.isFinite(sid) || sid <= 0) continue;
      paidInRangeBySale.set(sid, (paidInRangeBySale.get(sid) || 0) + Number(p.amount || 0));
    }

    // Enforce strict in-range filtering to avoid showing old invoices when day is empty
    // مع إبقاء الفواتير التي لها دفعة جزئية داخل الفترة (paid_at)
    try{
      const inRange = (rec) => {
        const recId = Number(rec?.id);
        if(Number.isFinite(recId) && partialPaidSaleIdsInRange.has(recId)) return true;
        const d = new Date(rec.created_at || rec.settled_at || rec.invoice_date);
        return d >= start && d < end;
      };
      allSales = Array.isArray(allSales) ? allSales.filter(inRange) : [];
    }catch(_){ }

    // split into normal invoices and credit notes
    // include all invoices (paid + unpaid + partially paid)
    let invoices = allSales.filter(s => String(s.doc_type||'') !== 'credit_note' && !String(s.invoice_no||'').startsWith('CN-'));
    const creditNotes = allSales.filter(s => String(s.doc_type||'') === 'credit_note' || String(s.invoice_no||'').startsWith('CN-'));

    // دفعات آجل جزئية تمت داخل الفترة لفواتير قديمة (خارج allSales بسبب تاريخ الإنشاء)
    const invoiceIdsInRange = new Set(invoices.map(s => Number(s.id)).filter(id => Number.isFinite(id) && id > 0));
    const extraPaymentsBySale = new Map();
    for(const p of partialPaymentsRows){
      const sid = Number(p.sale_id);
      if(!Number.isFinite(sid) || sid <= 0) continue;
      if(invoiceIdsInRange.has(sid)) continue;
      if(!extraPaymentsBySale.has(sid)) extraPaymentsBySale.set(sid, []);
      extraPaymentsBySale.get(sid).push(p);
    }

    if(extraPaymentsBySale.size){
      const extras = [];
      for(const [sid, list] of extraPaymentsBySale.entries()){
        if(!Array.isArray(list) || !list.length) continue;
        const first = list[0] || {};
        const last = list[list.length - 1] || first;
        const paidInRange = list.reduce((acc, p) => acc + Number(p.amount || 0), 0);
        const grand = Math.max(0, Number(first.grand_total || 0));
        const paid = Math.max(0, Math.min(grand, paidInRange));
        extras.push({
          id: sid,
          invoice_no: first.invoice_no || '',
          customer_name: first.customer_name || '',
          customer_phone: first.customer_phone || '',
          payment_method: 'credit',
          payment_status: first.payment_status || 'unpaid',
          amount_paid: paid,
          sub_total: Number(first.sub_total || 0),
          vat_total: Number(first.vat_total || 0),
          grand_total: grand,
          discount_amount: Number(first.discount_amount || 0),
          delivery_discount_amount: Number(first.delivery_discount_amount || 0),
          tobacco_fee: Number(first.tobacco_fee || 0),
          created_at: last.paid_at || first.created_at
        });
      }
      invoices = invoices.concat(extras);
    }

    // إخفاء الفواتير الآجلة التي لم يتم سداد أي دفعة عليها في الفترة
    // وتحديث amount_paid لتعكس فقط ما تم دفعه في الفترة
    invoices = invoices.map(s => {
      if (String(s.payment_method || '').toLowerCase() === 'credit' && String(s.payment_status || '') !== 'paid') {
        const paidInRange = paidInRangeBySale.get(Number(s.id)) || 0;
        return { ...s, amount_paid: paidInRange };
      }
      return s;
    }).filter(s => {
      if (String(s.payment_method || '').toLowerCase() === 'credit' && String(s.payment_status || '') !== 'paid') {
        return Number(s.amount_paid || 0) > 0;
      }
      return true;
    });

    // إجمالي المبلغ المتبقي على الفواتير الآجلة التي تم إنشاؤها في الفترة
    const creditRemainingTotal = allSales
      .filter(s => {
        const d = new Date(s.created_at || s.settled_at || s.invoice_date);
        return d >= start && d < end;
      })
      .filter(s => String(s.doc_type||'') !== 'credit_note' && !String(s.invoice_no||'').startsWith('CN-'))
      .filter(s => String(s.payment_method || '').toLowerCase() === 'credit' && String(s.payment_status || '') !== 'paid')
      .reduce((acc, s) => acc + Math.max(0, Number(s.grand_total || 0) - Number(s.amount_paid || 0)), 0);

    const extraInvoiceIds = new Set(Array.from(extraPaymentsBySale.keys()).map(x => Number(x)).filter(x => Number.isFinite(x) && x > 0));
    const baseCreditUnpaid = invoices.filter(s => String(s.payment_method || '').toLowerCase() === 'credit' && String(s.payment_status || '') !== 'paid' && !extraInvoiceIds.has(Number(s.id)));
    const creditUnpaidIds = [...new Set(baseCreditUnpaid.map(s => Number(s.id)).filter(id => Number.isFinite(id) && id > 0))];
    const paymentsBySale = await buildPaymentsBySaleMap(creditUnpaidIds, baseCreditUnpaid);
    for(const [sid, list] of extraPaymentsBySale.entries()){
      paymentsBySale.set(Number(sid), list);
    }

    // Totals before and after credit notes
    let grossBefore = 0, vatBefore = 0, disc = 0;
    // Dynamic payment buckets by method (after credit notes)
    const payByMethod = new Map(); // method -> total
    let refunds = 0; // sum of credit notes grand_total (absolute)
    let refundsVat = 0; // sum of credit notes VAT (absolute)

    invoices.forEach(sale => {
      const sid = Number(sale.id);
      const paidInRange = paidInRangeBySale.get(sid) || 0;
      const grand = recognizedValue(sale, 'grand_total', paidInRange);
      const vatv = recognizedValue(sale, 'vat_total', paidInRange);
      const discv = recognizedValue(sale, 'discount_amount', paidInRange) + recognizedValue(sale, 'delivery_discount_amount', paidInRange);
      const pm = String(sale.payment_method||'').toLowerCase();
      // المبيعات قبل الإشعارات يجب أن تعكس المبلغ قبل الخصم وقبل الضريبة
      // نحسبها = (الإجمالي بعد الخصم مع الضريبة) - (الضريبة) + (الخصم)
      grossBefore += ((grand - vatv) + discv);
      vatBefore += vatv;
      disc += discv;
      // Sum payment by actual split amounts if present
      const ratio = invoiceRecognizedRatio(sale, paidInRange);
      const payCashPart = Number(sale.pay_cash_amount || 0) * ratio;
      const payCardPart = Number(sale.pay_card_amount || 0) * ratio;
      const add = (method, amount)=>{
        if(!method) return;
        let k = String(method).toLowerCase();
        if(k === 'network') k = 'card';
        const prev = Number(payByMethod.get(k)||0);
        payByMethod.set(k, prev + Number(amount||0));
      };
      if(pm === 'credit' && String(sale.payment_status||'') !== 'paid'){
        // الدفعات الجزئية للآجل ستُضاف لاحقًا من partialPaymentsRows (in-range only)
        // لتفادي الازدواج لا نضيف هنا أي شيء.
      } else if(pm==='mixed'){
        add('cash', payCashPart);
        add('card', payCardPart);
      } else if(pm==='cash'){
        // نستخدم قيمة الفاتورة المعترف بها (grand) لا المبلغ المدفوع الذي قد يشمل الباقي
        add('cash', grand);
      } else if(pm==='card' || pm==='network' || pm==='tamara' || pm==='tabby'){
        add(pm, (payCardPart>0 ? payCardPart : grand));
      } else {
        // include any other custom method as full grand_total
        add(pm, grand);
      }
    });

    let refundsPreAfterDisc = 0;
    creditNotes.forEach(sale => {
      const pre = Number(sale.sub_total||0);
      const grand = Number(sale.grand_total||0);
      const vatv = Number(sale.vat_total||0);
      const discCN = Number(sale.discount_amount||0) + Number(sale.delivery_discount_amount||0);
      // احتساب الإشعارات: قبل الضريبة بعد الخصم يعتمد على (sub_total - discount_amount)، ورسوم التبغ بعمود مستقل
      refunds += Math.abs(pre); // قبل الخصم (لاستخدامات أخرى)
      refundsVat += Math.abs(vatv);
      refundsPreAfterDisc += Math.abs(pre - discCN);
      // خصم مبالغ طرق الدفع من المجاميع بنفس منطق الفواتير لكن بالسالب
      const pm = String(sale.payment_method||'').toLowerCase();
      const cCash = Number(Math.abs(sale.pay_cash_amount||0));
      const cCard = Number(Math.abs(sale.pay_card_amount||0));
      const sub = (method, amount)=>{
        if(!method) return;
        const k = String(method).toLowerCase();
        const prev = Number(payByMethod.get(k)||0);
        payByMethod.set(k, prev - Number(amount||0));
      };
      if(pm==='mixed'){
        sub('cash', cCash);
        sub('card', cCard);
      } else if(pm==='cash'){
        // نطرح قيمة الإشعار الدائن (grand) لا المبلغ المدفوع
        sub('cash', Math.abs(grand));
      } else if(pm==='card' || pm==='network' || pm==='tamara' || pm==='tabby'){
        sub(pm==='network' ? 'card' : pm, (cCard>0 ? cCard : Math.abs(grand)));
      } else if(pm){
        sub(pm, Math.abs(grand));
      }
    });

    // === إضافة دفعات الآجل الجزئية المُحصَّلة داخل الفترة فقط ===
    // نستخدم partialPaymentsRows (مرشَّحة بـ paid_at داخل الفترة) ونضيفها لطرق الدفع
    // كذلك نستخدمها لاحتساب صف "تحصيلات الآجل" في الملخص.
    let creditCollectedPre = 0, creditCollectedVat = 0, creditCollectedTob = 0, creditCollectedAfter = 0;
    try{
      const KNOWN = new Set(['cash', 'card', 'tamara', 'tabby', 'bank_transfer']);
      for(const p of (partialPaymentsRows || [])){
        const amt = Number(p.amount || 0);
        if(!(amt > 0)) continue;
        // تخطي الدفعات التى تم سدادها بالكامل (settled) أو لم تعد فواتير آجلة
        // لأنها تُحسب بالفعل كفواتير نقدية/شبكة كاملة في invoices.forEach
        if(String(p.payment_status || '') === 'paid') continue;
        if(String(p.payment_method || '').toLowerCase() !== 'credit') continue;
        let m = String(p.method ?? '').trim().toLowerCase();
        if(m === 'network') m = 'card';
        const key = (m && KNOWN.has(m)) ? m : 'credit';
        const prev = Number(payByMethod.get(key) || 0);
        payByMethod.set(key, prev + amt);
        // نسبة الدفعة لإجمالي الفاتورة لاحتساب الجزء المتعلق بالضريبة/التبغ
        const grand = Math.max(0, Number(p.grand_total || 0));
        const ratio = grand > 0 ? Math.min(1, amt / grand) : 0;
        creditCollectedPre += Number(p.sub_total || 0) * ratio;
        creditCollectedVat += Number(p.vat_total || 0) * ratio;
        creditCollectedTob += Number(p.tobacco_fee || 0) * ratio;
        creditCollectedAfter += amt;
      }
    }catch(_){}

    const grossAfter = grossBefore - refunds; // pre-VAT after credit notes
    const vatAfter = vatBefore - refundsVat;  // VAT after credit notes
    const netAfterPretax = grossAfter - disc; // pre-VAT net after discount
    const netAfterWithVat = netAfterPretax + vatAfter; // after-VAT net

    // Load purchases within same range (using from_at/to_at for datetime precision)
    const purRes = await window.api.purchases_list({ from_at: startStr, to_at: adjustedEndStr });
    const purchases = (purRes && purRes.ok) ? (purRes.items||[]) : [];
    let purchasesTotal = 0;
    purchases.forEach(p => { purchasesTotal += Number(p.grand_total||0); });

    // Build detailed summary rows (show sales before discount)
    const salesPre = invoices.reduce((acc,s)=> acc + recognizedValue(s, 'sub_total', paidInRangeBySale.get(Number(s.id)) || 0), 0);
    // ضريبة المبيعات المحتسبة في التقرير (تتبع الجزء المحصل فقط لفواتير الآجل الجزئية)
    const salesVat = invoices.reduce((acc,s)=> acc + recognizedValue(s, 'vat_total', paidInRangeBySale.get(Number(s.id)) || 0), 0);
    const discTotal = Number(disc||0);

    // Returns
    let retPre = Number(refunds||0);
    let retVat = Number(refundsVat||0);

    // Tobacco fees (show columns and include in after-tax to match invoices)
    let tobInv = 0, tobCN = 0;
    try{ tobInv = invoices.reduce((a,s)=> a + recognizedValue(s, 'tobacco_fee', paidInRangeBySale.get(Number(s.id)) || 0), 0); }catch(_){ tobInv = 0; }
    try{ tobCN = creditNotes.reduce((a,s)=> a + Number(s.tobacco_fee||0), 0); }catch(_){ tobCN = 0; }
    const salesTob = Math.max(0, tobInv);
    const retTob = Math.max(0, Math.abs(tobCN));

    // Compute VAT before discount for display of "المبيعات" row (apply VAT on sub_total + tobacco fee)
    const vatPct = Number((s && s.vat_percent) || 15) / 100;
    const salesVatBefore = Number((salesPre + salesTob) * vatPct);

    // After-tax for sales row should reflect before-discount amounts
    const salesAfter = salesPre + salesVatBefore + salesTob;
    // After-tax for credit notes should equal sum of absolute grand_total of credit notes
    const retAfter = creditNotes.reduce((acc,s)=> acc + Math.abs(Number(s.grand_total||0)), 0);

    let purPre = 0, purVat = 0;
    purchases.forEach(p => { purPre += Number(p.sub_total||0); purVat += Number(p.vat_total||0); });
    const purAfter = purPre + purVat;

    try{
      const set = (id, val)=>{ const el=document.getElementById(id); if(el){ el.textContent = Number(val||0).toFixed(2); } };
      set('salesPre', salesPre);
      set('salesVat', salesVatBefore);
      set('salesTob', salesTob);
      set('salesAfter', salesAfter);
      set('discTotal', discTotal);
      // صف المرتجعات الآن يُعرض بالنسبة للمبيعات بعد الخصم:
      // قبل الضريبة (بعد الخصم) = (sub_total - discount_amount)
      const retPreAfterDisc = refundsPreAfterDisc;
      set('retPre', retPreAfterDisc);
      set('retVat', retVat);
      set('retTob', retTob);
      set('retAfter', retAfter);
      set('purPre', purPre);
      set('purVat', purVat);
      set('purAfter', purAfter);

      // إضافة صف "المبيعات بعد الخصم"
      const salesAfterDiscPre = (salesPre - discTotal);
      const salesAfterDiscTob = salesTob; // رسوم التبغ لا تتغير بالخصم عادةً
      const salesAfterDiscVat = salesVat; // الضريبة محسوبة على الصافي بعد الخصم بالفعل
      // بعد الضريبة بعد الخصم يجب أن يساوي مجموع grand_total للفواتير
      const salesAfterDiscAfter = invoices.reduce((acc,s)=> acc + recognizedValue(s, 'grand_total', paidInRangeBySale.get(Number(s.id)) || 0), 0);
      set('salesAfterDiscPre', salesAfterDiscPre);
      set('salesAfterDiscTob', salesAfterDiscTob);
      set('salesAfterDiscVat', salesAfterDiscVat);
      set('salesAfterDiscAfter', salesAfterDiscAfter);

      // صافي المبيعات بعد الخصم بعد المرتجعات (لا يشمل المشتريات)
      // قبل الضريبة يجب أن يطرح مرتجعات بعد الخصم وليس قبل الخصم
      const salesAfterDiscNetPre = salesAfterDiscPre - retPreAfterDisc;
      const salesAfterDiscNetTob = salesAfterDiscTob - retTob;
      const salesAfterDiscNetVat = salesAfterDiscVat - retVat;
      const salesAfterDiscNetAfter = salesAfterDiscAfter - retAfter;
      set('salesAfterDiscNetPre', salesAfterDiscNetPre);
      set('salesAfterDiscNetTob', salesAfterDiscNetTob);
      set('salesAfterDiscNetVat', salesAfterDiscNetVat);
      set('salesAfterDiscNetAfter', salesAfterDiscNetAfter);

      // تحديث الصافي ليعتمد على "المبيعات بعد الخصم" ومرتجعات بعد الخصم:
      // قبل الضريبة: (مبيعات بعد الخصم قبل الضريبة - مرتجعات بعد الخصم قبل الضريبة) - مشتريات قبل الضريبة
      // الضريبة: (ضريبة المبيعات بعد الخصم - ضريبة المرتجعات) - ضريبة المشتريات
      // بعد الضريبة: مجموع الأعمدة (قبل + تبغ + ضريبة)
      const netPre = (salesAfterDiscPre - retPreAfterDisc) - purPre;
      const netTob = salesAfterDiscTob - retTob;
      const netVat = (salesAfterDiscVat - retVat) - purVat;
      const netAfter = netPre + netTob + netVat;
      set('netPre', netPre);
      set('netTob', netTob);
      set('netVat', netVat);
      set('netAfter', netAfter);
    }catch(_){ }

    // Populate tables
    const invTbody = document.getElementById('invTbody');
    const cnTbody = document.getElementById('cnTbody');
    const purTbody = document.getElementById('purTbody');
    const invCount = document.getElementById('invCount');
    const cnCount = document.getElementById('cnCount');
    const purCount = document.getElementById('purCount');

    const invRows = invoices.map(s=>{
      // guard invalid dates
      let created = s.created_at ? new Date(s.created_at) : null;
      if(!created || isNaN(created.getTime())){ try{ created = new Date(String(s.created_at).replace(' ', 'T')); }catch(_){ created = new Date(); } }
      const dStr = new Intl.DateTimeFormat('en-GB-u-ca-gregory', {year:'numeric', month:'2-digit', day:'2-digit'}).format(created);
      const tStr = new Intl.DateTimeFormat('en-GB-u-ca-gregory', {hour:'2-digit', minute:'2-digit', hour12:true}).format(created);
      const custPhone = s.customer_phone || s.disp_customer_phone || '';
      const cust = custPhone || (s.customer_name || s.disp_customer_name || '');
      const pmLower = String(s.payment_method||'').toLowerCase();
      const settledCash = Number(s.settled_cash || 0);
      const payCashPart = Number(s.pay_cash_amount || 0);
      const cashParam = (pmLower==='cash') ? (settledCash>0 ? settledCash : (payCashPart>0 ? payCashPart : Number(s.grand_total||0))) : 0;
      const viewBtn = `<button class=\"btn\" data-view=\"${s.id}\" data-type=\"invoice\" data-pay=\"${pmLower}\" data-cash=\"${cashParam}\">عرض</button>`;
      const statusTxt = invoiceStatusLabel(s);
      const payLabel = `${labelPaymentMethod(s.payment_method||'')}${statusTxt ? ` - ${statusTxt}` : ''}`;
      // نعرض فقط ما تم سداده داخل الفترة (اليوم) للفواتير الآجلة الجزئية
      const paidInRange = paidInRangeBySale.get(Number(s.id)) || 0;
      return `<tr><td>${s.invoice_no||''}</td><td dir=\"ltr\" style=\"text-align:left\">${cust}</td><td>${tStr} ,${dStr}</td><td>${payLabel}</td><td>${fmt(invoiceTableTotalDisplay(s, paidInRange))}</td><td>${viewBtn}</td></tr>`;
    }).join('');
    invTbody.innerHTML = invRows || '<tr><td colspan="6" class="muted">لا توجد فواتير ضمن الفترة</td></tr>';
    invCount.textContent = String(invoices.length);

    const cnRows = creditNotes.map(s=>{
      let created = s.created_at ? new Date(s.created_at) : null;
      if(!created || isNaN(created.getTime())){ try{ created = new Date(String(s.created_at).replace(' ', 'T')); }catch(_){ created = new Date(); } }
      const dStr = new Intl.DateTimeFormat('en-GB-u-ca-gregory', {year:'numeric', month:'2-digit', day:'2-digit'}).format(created);
      const tStr = new Intl.DateTimeFormat('en-GB-u-ca-gregory', {hour:'2-digit', minute:'2-digit', hour12:true}).format(created);
      const custPhone = s.customer_phone || s.disp_customer_phone || '';
      const cust = custPhone || (s.customer_name || s.disp_customer_name || '');
      const payLabel = labelPaymentMethod(s.payment_method||'');
      // Try to pass base references if present in the row (backend stores ref_base_* on credit notes)
      const baseId = (s.ref_base_sale_id != null) ? String(s.ref_base_sale_id) : '';
      const baseNo = (s.ref_base_invoice_no != null) ? String(s.ref_base_invoice_no) : '';
      const attrs = [`data-view=\"${s.id}\"`, `data-type=\"credit\"`];
      if(baseId) attrs.push(`data-base=\"${baseId}\"`);
      if(baseNo) attrs.push(`data-base-no=\"${baseNo}\"`);
      const viewBtn = `<button class=\"btn\" ${attrs.join(' ')}>عرض</button>`;
      return `<tr><td>${s.invoice_no||''}</td><td dir=\"ltr\" style=\"text-align:left\">${cust}</td><td>${tStr} ,${dStr}</td><td>${payLabel}</td><td>${fmt(s.grand_total)}</td><td>${viewBtn}</td></tr>`;
    }).join('');
    cnTbody.innerHTML = cnRows || '<tr><td colspan="6" class="muted">لا توجد إشعارات دائنة ضمن الفترة</td></tr>';
    cnCount.textContent = String(creditNotes.length);

    if(purTbody){
      purTbody.innerHTML = purchases.map(p=>{
        const dateStr = p.purchase_at ? new Intl.DateTimeFormat('en-GB-u-ca-gregory', {year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:true}).format(new Date(p.purchase_at)) : (p.purchase_date||'');
        return `<tr><td>${p.name||''}</td><td>${dateStr}</td><td>${fmt(p.grand_total)}</td><td>${p.notes||''}</td></tr>`;
      }).join('');
    }
    if(purCount){ purCount.textContent = String(purchases.length); }

    // Fill sold items table (products sold)
    try{
      const tbody = document.getElementById('soldItemsTbody');
      const rows = soldItems.map(it => {
        const arName = String(it.name_ar || it.name || '').trim();
        const enName = String(it.name_en || '').trim();
        const displayName = enName ? `${arName} / ${enName}` : arName;
        return `<tr><td>${displayName}</td><td>${Number(it.qty_total||0)}</td><td>${fmt(it.amount_total)}</td></tr>`;
      }).join('');
      tbody.innerHTML = rows || '<tr><td colspan="3" class="muted">لا توجد بيانات</td></tr>';
    }catch(_){ }

    const stSalesBefore = document.getElementById('stSalesBefore');
    const stVatBefore = document.getElementById('stVatBefore');
    const stSalesAfter = document.getElementById('stSalesAfter');
    const stVatAfter = document.getElementById('stVatAfter');
    const stDisc = document.getElementById('stDisc');
    const stNet = document.getElementById('stNet');

    const stRefunds = document.getElementById('stRefunds');
    const stPurchases = document.getElementById('stPurchases');
    const stProfit = document.getElementById('stProfit');

    // summary boxes
    const boxSalesBefore = document.getElementById('boxSalesBefore');
    const boxVatBefore = document.getElementById('boxVatBefore');
    const boxRefunds = document.getElementById('boxRefunds');
    const boxRefundVat = document.getElementById('boxRefundVat');
    const boxSalesAfter = document.getElementById('boxSalesAfter');
    const boxVatAfter = document.getElementById('boxVatAfter');

    // wire actions: view buttons + exports
    try{
      document.querySelectorAll('button[data-view]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = Number(btn.getAttribute('data-view'));
          const type = btn.getAttribute('data-type');
          const page = (type === 'credit') ? '../sales/print.html' : '../sales/print.html';
          // pass payment method and cash amount (if cash) to match printed invoice logic
          const pay = btn.getAttribute('data-pay') || '';
          const cash = btn.getAttribute('data-cash') || '';
          const w = 500, h = 700;
          const qsObj = { id: String(id), ...(pay?{pay}:{}) , ...(cash?{cash}:{}) };
          if(type==='credit'){
            const base = btn.getAttribute('data-base') || '';
            const baseNo = btn.getAttribute('data-base-no') || '';
            if(base) qsObj.base = base;
            if(baseNo) qsObj.base_no = baseNo;
          }
          // Add preview flag to avoid any auto/silent print when viewing from reports
          const qs = new URLSearchParams({ preview:'1', ...qsObj });
          const url = `${page}?${qs.toString()}`;
          window.open(url, 'PRINT_VIEW', `width=${w},height=${h},menubar=no,toolbar=no,location=no,status=no`);
        });
      });
    }catch(_){ }

    // تمت إزالة ربط أزرار التصدير من هذا الموضع لأن المعالجات تم تعريفها في الأعلى مع منع التكرار وتعطيل الأزرار مؤقتًا.
    // هذا يمنع تسجيل مستمعين مزدوجين يؤديان إلى إنشاء تقريرين وعرض رسائل متكررة.

    // تم إزالة بطاقات المؤشرات وقسم الملخص المختصر حسب طلب المستخدم، لذا لا حاجة لتعبئة تلك العناصر

    // Build dynamic payment methods table
    const payTbody = document.getElementById('payTbody');
    const sumTotal = document.getElementById('sumTotal');
    const rows = [];
    let paymentsSum = 0;
    // Labels
    const labels = { cash:'نقدًا', card:'شبكة', credit:'آجل', tamara:'تمارا', tabby:'تابي', bank_transfer:'تحويل بنكي' };
    // Sort methods for stable display
    const sorted = Array.from(payByMethod.entries()).sort((a,b)=> a[0].localeCompare(b[0]));
    sorted.forEach(([method, value]) => {
      const amount = Number(value||0);
      if(amount === 0) return;
      const label = labels[method] || method;
      paymentsSum += amount;
      rows.push(`<tr><td>${label}</td><td>${fmt(amount)}</td></tr>`);
    });
    if(creditRemainingTotal > 0.009){
      rows.push(`<tr><td>إجمالي الفواتير الآجلة (متبقي)</td><td>${fmt(creditRemainingTotal)}</td></tr>`);
    }
    if(payTbody){ payTbody.innerHTML = rows.join(''); }
    if(sumTotal){ sumTotal.textContent = fmt(paymentsSum); }
    if(stRefunds){ stRefunds.textContent = fmt(refunds); }
    if(stPurchases){ stPurchases.textContent = fmt(purchasesTotal); }

    // Approximate profit: netAfter - purchases
    const profit = netAfter - purchasesTotal;
    if(stProfit){ stProfit.textContent = fmt(profit); }
    
    // Set flag indicating load complete (for email scheduler)
    console.log('[Daily Report] Load completed successfully. Sales count:', invoices.length, 'Credit notes:', creditNotes.length);
    window.__dailyReportLoadComplete = true;
  }catch(e){
    console.error('[Daily Report] Load error:', e);
    window.__dailyReportLoadComplete = true; // Set even on error to avoid infinite wait
  }
}

// Auto-refresh report when invoices change
try{
  window.api.on_sales_changed(() => {
    // Small debounce to group rapid events
    clearTimeout(window.__daily_rep_timer);
    window.__daily_rep_timer = setTimeout(() => { load(); }, 300);
  });
}catch(_){ }

load();