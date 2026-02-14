// Period report screen logic (from/to with datetime)
// Reuses the daily report logic but uses selected date-time range

// Language system
const __langKey = 'app_lang';
let __currentLang = {};
function __applyLang(lang){
  const base = (typeof lang==='string' ? lang.split('-')[0].toLowerCase() : 'ar');
  const isAr = (base==='ar');
  const t = {
    periodReport: isAr ? 'تقرير الفترة' : 'Period Report',
    systemTitle: isAr ? 'نظام إدارة المطاعم' : 'Restaurant Management System',
    back: isAr ? 'رجوع' : 'Back',
    from: isAr ? 'من' : 'From',
    to: isAr ? 'إلى' : 'To',
    apply: isAr ? 'تطبيق' : 'Apply',
    exportPDF: isAr ? 'تصدير PDF' : 'Export PDF',
    exportExcel: isAr ? 'تصدير Excel' : 'Export Excel',
    print: isAr ? 'طباعة' : 'Print',
    detailedSummary: isAr ? 'الملخص التفصيلي' : 'Detailed summary',
    description: isAr ? 'البيان' : 'Description',
    preVAT: isAr ? 'قبل الضريبة' : 'Pre-VAT',
    tobaccoFee: isAr ? 'رسوم التبغ' : 'Tobacco fee',
    vat: isAr ? 'الضريبة' : 'VAT',
    afterVAT: isAr ? 'بعد الضريبة' : 'After VAT',
    sales: isAr ? 'المبيعات' : 'Sales',
    discounts: isAr ? 'الخصومات' : 'Discounts',
    salesAfterDiscount: isAr ? 'المبيعات بعد الخصم' : 'Sales after discount',
    creditNotes: isAr ? 'إشعارات الدائن (المرتجعات)' : 'Credit notes (returns)',
    salesAfterDiscountNet: isAr ? 'إجمالي المبيعات بعد الخصم بعد المرتجعات' : 'Total sales after discount after returns',
    purchases: isAr ? 'المشتريات' : 'Purchases',
    net: isAr ? 'الصافي' : 'Net',
    paymentMethods: isAr ? 'طرق الدفع' : 'Payment methods',
    method: isAr ? 'الطريقة' : 'Method',
    total: isAr ? 'الإجمالي' : 'Total',
    grandTotal: isAr ? 'الإجمالي الكلي' : 'Grand total',
    cash: isAr ? 'نقدًا' : 'Cash',
    network: isAr ? 'شبكة' : 'Network',
    credit: isAr ? 'آجل' : 'Credit',
    tamara: isAr ? 'تمارا' : 'Tamara',
    tabby: isAr ? 'تابي' : 'Tabby',
    mixed: isAr ? 'مختلط' : 'Mixed',
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
    period: isAr ? 'الفترة' : 'Period',
  };
  
  __currentLang = t;
  
  document.documentElement.lang = isAr ? 'ar' : 'en';
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  
  document.title = t.periodReport;
  const pageTitle = document.querySelector('.text-3xl');
  if(pageTitle) pageTitle.textContent = t.periodReport;
  
  const systemTitle = document.querySelector('.text-sm.text-gray-500');
  if(systemTitle) systemTitle.textContent = t.systemTitle;
  
  const btnBack = document.getElementById('btnBack');
  if(btnBack) btnBack.textContent = t.back;
  
  const fromLabel = document.querySelector('label[for="fromAt"]');
  if(fromLabel) fromLabel.textContent = t.from;
  
  const toLabel = document.querySelector('label[for="toAt"]');
  if(toLabel) toLabel.textContent = t.to;
  
  const applyBtn = document.getElementById('applyRangeBtn');
  if(applyBtn) applyBtn.textContent = t.apply;
  
  const exportPdfBtn = document.getElementById('exportPdfBtn');
  if(exportPdfBtn) exportPdfBtn.textContent = t.exportPDF;
  
  const exportExcelBtn = document.getElementById('exportExcelBtn');
  if(exportExcelBtn) exportExcelBtn.textContent = t.exportExcel;
  
  const printBtn = document.getElementById('printReportBtn');
  if(printBtn) printBtn.textContent = t.print;
  
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
  
  const payMethodsTitle = document.querySelectorAll('h3')[1];
  if(payMethodsTitle && payMethodsTitle.textContent.includes('طرق')) payMethodsTitle.textContent = t.paymentMethods;
  
  const payMethodsHeaders = document.querySelectorAll('.bg-white')[1]?.querySelectorAll('thead th');
  if(payMethodsHeaders && payMethodsHeaders.length >= 2){
    payMethodsHeaders[0].textContent = t.method;
    payMethodsHeaders[1].textContent = t.total;
  }
  
  const payMethodsFoot = document.querySelector('#sumTotal')?.closest('tr')?.querySelector('th:first-child');
  if(payMethodsFoot) payMethodsFoot.textContent = t.grandTotal;
  
  const soldProductsSummary = document.querySelector('details summary');
  if(soldProductsSummary) soldProductsSummary.textContent = t.soldProducts;
  
  const soldProductsHeaders = document.querySelector('details')?.querySelectorAll('thead th');
  if(soldProductsHeaders && soldProductsHeaders.length >= 3){
    soldProductsHeaders[0].textContent = t.product;
    soldProductsHeaders[1].textContent = t.quantity;
    soldProductsHeaders[2].textContent = t.total;
  }
  
  const purchasesSummary = document.querySelectorAll('details')[1]?.querySelector('summary');
  if(purchasesSummary) purchasesSummary.textContent = t.purchasesSection;
  
  const purchasesHeaders = document.querySelectorAll('details')[1]?.querySelectorAll('thead th');
  if(purchasesHeaders && purchasesHeaders.length >= 4){
    purchasesHeaders[0].textContent = t.purchaseName;
    purchasesHeaders[1].textContent = t.date;
    purchasesHeaders[2].textContent = t.total;
    purchasesHeaders[3].textContent = t.notes;
  }
  
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
  
  try{ localStorage.setItem(__langKey, base); }catch(_){ }
  try{ window.api.app_set_locale(base); }catch(_){ }
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
function labelPaymentMethod(method){
  const m = String(method||'').toLowerCase();
  if(m==='cash') return __currentLang.cash || 'نقدًا';
  if(m==='card' || m==='network') return __currentLang.network || 'شبكة';
  if(m==='credit') return __currentLang.credit || 'آجل';
  if(m==='tamara') return __currentLang.tamara || 'تمارا';
  if(m==='tabby') return __currentLang.tabby || 'تابي';
  if(m==='mixed') return __currentLang.mixed || 'مختلط';
  return method||'';
}

const btnBack = document.getElementById('btnBack');
if(btnBack){ btnBack.onclick = ()=>{ window.location.href = './index.html'; } }

// Attach export handlers and prevent duplicate clicks
(function attachExportHandlers(){
  let exporting = false;
  const btnPdf = document.getElementById('exportPdfBtn');
  if(btnPdf){
    btnPdf.addEventListener('click', async () => {
      if(exporting) return; exporting = true; btnPdf.disabled = true;
      try{
        const period = (rangeEl && rangeEl.textContent) ? rangeEl.textContent.replace(/[^0-9_\-–: ]+/g,'').replace(/\s+/g,' ').trim() : '';
        const safe = (period||'').replace(/[: ]/g,'_');
        const title = `period-report-${safe||Date.now()}.pdf`;
        
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
            
            let headerHTML = '<h1 style="font-size: 28px; font-weight: 900; color: #1f2937; margin-bottom: 8px; font-family: Cairo, sans-serif;">تقرير الفترة</h1>';
            
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
          }catch(_){ }
        };
        if(rangeEl && rangeEl.textContent){ lines.push(esc('الفترة'), esc(rangeEl.textContent.trim())); lines.push(''); }
        addTable('إجماليات طرق الدفع', document.querySelector('table tbody#payTbody')?.closest('table'));
        addTable('الفواتير', document.querySelector('table tbody#invTbody')?.closest('table'));
        addTable('الإشعارات الدائنة', document.querySelector('table tbody#cnTbody')?.closest('table'));
        addTable('المشتريات', document.querySelector('table tbody#purTbody')?.closest('table'));
        addTable('المنتجات المباعة', document.querySelector('table tbody#soldItemsTbody')?.closest('table'));
        const csv = lines.join('\n');
        const period = (rangeEl && rangeEl.textContent) ? rangeEl.textContent.replace(/[^0-9_\-–: ]+/g,'').replace(/\s+/g,' ').trim() : '';
        const filename = `period-report-${(period||'').replace(/[: ]/g,'_')||Date.now()}.csv`;
        await window.api.csv_export(csv, { saveMode:'auto', filename });
      }catch(e){ console.error(e); alert('تعذر إنشاء Excel'); }
      finally{ exporting = false; btnExcel.disabled = false; }
    });
  }

  // Print report (thermal 80mm)
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
        
        // Remove toolbar actions, inputs and header from print
        try{
          // إزالة أزرار التصدير
          const toolbar = clone.querySelector('.range-actions');
          if(toolbar){ toolbar.parentNode.removeChild(toolbar); }
          // إزالة خانات اختيار التاريخ (من/إلى)
          const rangeInputs = clone.querySelectorAll('input[type="datetime-local"], label[for="fromAt"], label[for="toAt"], #applyRangeBtn');
          rangeInputs.forEach(el => el && el.remove());
          // إزالة الـ header بالكامل
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
          
          /* استخدام خط Cairo في كل التقرير */
          *{ 
            box-sizing: border-box;
            font-family: 'Cairo', sans-serif !important;
            font-weight: 900 !important;
            color: #000 !important;
          }
          
          /* Ensure first content touches the top */
          body, .container, .section:first-child{ margin-top:0 !important; padding-top:0 !important; }
          /* Use Settings-based margins for thermal: paddings from CSS vars */
          .container{ width:100%; max-width:100%; margin:0; padding-left: 0; padding-right: 0; padding-top:0; padding-bottom:4px; overflow:hidden; }
          /* Avoid top margin collapse from first child */
          .container > *:first-child{ margin-top:0 !important; }
          .range-bar{ margin-top:0 !important; }
          
          /* إخفاء خانات التاريخ والأزرار */
          input, button, label { display: none !important; }
          
          /* إخفاء الأقسام المطوية بالكامل */
          details:not([open]) {
            display: none !important;
          }
          
          /* إظهار عناوين الأقسام المفتوحة فقط بخط أسود ثقيل */
          details[open] > summary {
            display: block !important;
            font-weight: 900 !important;
            font-size: 11px !important;
            margin-bottom: 2mm !important;
            margin-top: 3mm !important;
            padding-bottom: 1mm !important;
            border-bottom: 2px solid #000 !important;
            color: #000 !important;
            list-style: none !important;
            font-family: 'Cairo', sans-serif !important;
          }
          
          details > summary::before {
            display: none !important;
          }
          
          /* ألغِ اللفّ المخفي حتى لا تُقص الأعمدة */
          div[style*="overflow:auto"], .overflow-x-auto{ overflow: visible !important; }
          
          /* الجداول: توزيع تلقائي مع التفاف الأسطر وحدود سوداء ثقيلة */
          table{ 
            width:100%; 
            max-width:100%; 
            border-collapse:collapse; 
            table-layout: auto; 
            font-size:7.5px; 
            line-height:1.15;
            border: 2px solid #000 !important;
          }
          
          th,td{ 
            padding:2px 2px; 
            word-break: normal; 
            overflow-wrap: normal; 
            white-space: normal;
            border: 1px solid #000 !important;
            font-family: 'Cairo', sans-serif !important;
            overflow: hidden;
          }
          
          /* رؤوس الجداول بخلفية فاتحة وخط أسود */
          th{ 
            background:#f3f4f6 !important; 
            color:#000 !important; 
            font-weight: 900 !important;
            border: 1px solid #000 !important;
          }
          
          /* ضبط تباعد الخلايا رأسًا وأفقًا */
          .tbl-inv th, .tbl-inv td, .tbl-cn th, .tbl-cn td{ padding:2px 2px; font-size: 7.5px; }
          .tbl-inv tr, .tbl-cn tr{ line-height:1.15; }
          
          /* ضبط خلية العميل لتحتوي الأرقام */
          .tbl-inv th:nth-child(2), .tbl-inv td:nth-child(2),
          .tbl-cn th:nth-child(2), .tbl-cn td:nth-child(2){
            white-space: normal !important;
            overflow-wrap: anywhere;
            word-wrap: break-word;
            word-break: break-all;
            line-break: anywhere;
            max-width: 100%;
            overflow: hidden;
            direction: ltr;
            unicode-bidi: plaintext;
            text-align: left;
            font-size: 7px;
          }
          
          /* لا تكسر الحروف العربية داخل كلمة البيان: لف عند المسافات فقط */
          .tbl-sum th:nth-child(1), .tbl-sum td:nth-child(1){ word-break: normal; overflow-wrap: normal; white-space: normal; }
          
          .section{ margin:5px 0; padding:5px; border:none; }
          
          /* حدود ثقيلة سوداء للملخص التفصيلي */
          .summary-section{ border:2px solid #000 !important; }
          .summary-section table{ border:2px solid #000 !important; border-collapse:collapse; }
          .summary-section th, .summary-section td{ border:1px solid #000 !important; }
          .summary-section tfoot th{ border-top:2px solid #000 !important; font-weight: 900 !important; }
          
          /* تنسيق الملخص التفصيلي للطباعة الحرارية */
          .summary-section .tbl-sum{ table-layout: auto !important; width:100% !important; max-width:100% !important; }
          .summary-section .tbl-sum th, .summary-section .tbl-sum td{ font-size:7px; padding:1px 2px; text-align: center; vertical-align: middle; white-space: nowrap; word-break: keep-all; overflow-wrap: normal; overflow: hidden; text-overflow: clip; }
          .summary-section .tbl-sum th:nth-child(1), .summary-section .tbl-sum td:nth-child(1){ white-space: normal; word-break: break-word; overflow-wrap: anywhere; text-align: right; width: auto; max-width: 50%; font-size:7px; padding: 1px 3px; line-height: 1.15; }
          .summary-section .tbl-sum th:nth-child(2), .summary-section .tbl-sum td:nth-child(2){ white-space: nowrap !important; width: 1%; font-size:6.5px; padding: 1px 1.5px; }
          .summary-section .tbl-sum th:nth-child(3), .summary-section .tbl-sum td:nth-child(3){ white-space: nowrap !important; width: 1%; font-size:6.5px; padding: 1px 1.5px; }
          .summary-section .tbl-sum th:nth-child(4), .summary-section .tbl-sum td:nth-child(4){ white-space: nowrap !important; width: 1%; font-size:6.5px; padding: 1px 1.5px; }
          .summary-section .tbl-sum th:nth-child(5), .summary-section .tbl-sum td:nth-child(5){ white-space: nowrap !important; width: 1%; font-size:6.5px; padding: 1px 1.5px; }

          /* شبكة سوداء ثقيلة للطباعة للفواتير والإشعارات الدائنة */
          .tbl-inv, .tbl-cn{ border:2px solid #000 !important; border-collapse:collapse; table-layout: fixed !important; width: 100% !important; }
          .tbl-inv th, .tbl-inv td, .tbl-cn th, .tbl-cn td{ border:1px solid #000 !important; vertical-align: top !important; }
          .tbl-inv tfoot th, .tbl-cn tfoot th{ border-top:2px solid #000 !important; font-weight: 900 !important; }

          /* إخفاء عمود "عرض" أثناء الطباعة */
          .tbl-inv thead th:last-child, .tbl-inv tbody td:last-child, .tbl-inv tfoot th:last-child { display: none !important; }
          .tbl-cn thead th:last-child, .tbl-cn tbody td:last-child, .tbl-cn tfoot th:last-child { display: none !important; }

          /* توزيع متوازن للأعمدة: رقم، العميل، التاريخ، الدفع، الإجمالي */
          /* عمود الرقم: 11% */
          .tbl-inv th:nth-child(1), .tbl-inv td:nth-child(1),
          .tbl-cn th:nth-child(1), .tbl-cn td:nth-child(1){
            white-space: nowrap;
            width: 11%;
            font-size: 7px;
            padding: 1.5px 1px;
            overflow: hidden;
          }
          
          /* عمود العميل: 24% */
          .tbl-inv th:nth-child(2), .tbl-inv td:nth-child(2),
          .tbl-cn th:nth-child(2), .tbl-cn td:nth-child(2){
            white-space: normal;
            overflow-wrap: anywhere;
            word-break: break-all;
            width: 24%;
            font-size: 6.2px;
            padding: 1.5px 1px;
            overflow: hidden;
            line-height: 1.1;
          }
          
          /* عمود التاريخ: 30% */
          .tbl-inv th:nth-child(3), .tbl-inv td:nth-child(3),
          .tbl-cn th:nth-child(3), .tbl-cn td:nth-child(3){
            white-space: normal;
            overflow-wrap: break-word;
            word-break: break-word;
            width: 30%;
            font-size: 6.2px;
            padding: 1.5px 1px;
            overflow: hidden;
            line-height: 1.1;
          }
          
          /* عمود طريقة الدفع: 15% */
          .tbl-inv th:nth-child(4), .tbl-inv td:nth-child(4),
          .tbl-cn th:nth-child(4), .tbl-cn td:nth-child(4){
            white-space: normal;
            overflow-wrap: break-word;
            width: 15%;
            font-size: 6.5px;
            padding: 1.5px 1px;
            overflow: hidden;
            line-height: 1.1;
          }
          
          /* عمود الإجمالي: 20% */
          .tbl-inv th:nth-child(5), .tbl-inv td:nth-child(5),
          .tbl-cn th:nth-child(5), .tbl-cn td:nth-child(5){
            white-space: nowrap;
            width: 20%;
            font-size: 6.8px;
            padding: 1.5px 1px;
            overflow: hidden;
            text-overflow: clip;
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
          
          /* عرض الفترة الزمنية */
          #range {
            display: block !important;
            text-align: center !important;
            font-size: 10px !important;
            font-weight: 700 !important;
            margin-bottom: 3mm !important;
            padding-bottom: 1mm !important;
            border-bottom: 1px dashed #000 !important;
            font-family: 'Cairo', sans-serif !important;
          }
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

function toStr(d){
  const pad2 = (v)=> String(v).padStart(2,'0');
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:00`;
}

function fromInputToStr(input){
  // input type=datetime-local gives 'YYYY-MM-DDTHH:MM'
  const v = (input?.value||'').trim();
  if(!v) return '';
  // Convert to space-separated for backend consistency
  return v.replace('T', ' ') + ':00';
}

async function loadRange(startStr, endStr){
  try{
    // تعديل endStr لضمان شمول كل الثواني في الدقيقة المحددة
    let adjustedEndStr = endStr;
    if(endStr && endStr.match(/\s00:00:00$/)){
      adjustedEndStr = endStr.replace(/00:00:00$/, '23:59:59');
    } else if(endStr && endStr.match(/:\d\d:00$/)){
      adjustedEndStr = endStr.replace(/:00$/, ':59');
    }
    
    // show range text
    if(rangeEl){ rangeEl.textContent = `الفترة: ${startStr} — ${endStr}`; }

    // queries
    let soldItems = [];
    try{
      const sumRes = await window.api.sales_items_summary({ date_from: startStr, date_to: adjustedEndStr });
      soldItems = (sumRes && sumRes.ok) ? (sumRes.items||[]) : [];
    }catch(_){ soldItems = []; }

    let salesRes = await window.api.sales_list({ date_from: startStr, date_to: adjustedEndStr, limit: 50000 });
    let allSales = (salesRes && salesRes.ok) ? (salesRes.items||[]) : [];
    // Removed fallback padding and unbounded fetch: show exactly the selected period
    // Keep allSales as returned by the API within [startStr, endStr] only

    const invoices = allSales.filter(s => String(s.doc_type||'') !== 'credit_note' && !String(s.invoice_no||'').startsWith('CN-') && String(s.payment_status||'paid') === 'paid');
    const creditNotes = allSales.filter(s => String(s.doc_type||'') === 'credit_note' || String(s.invoice_no||'').startsWith('CN-'));

    let grossBefore = 0, vatBefore = 0, disc = 0;
    const payByMethod = new Map();
    let refunds = 0, refundsVat = 0;
    let refundsPreAfterDisc = 0;

    invoices.forEach(sale => {
      const grand = Number(sale.grand_total||0);
      const vatv = Number(sale.vat_total||0);
      const discv = Number(sale.discount_amount||0);
      const pm = String(sale.payment_method||'').toLowerCase();
      grossBefore += ((grand - vatv) + discv);
      vatBefore += vatv;
      disc += discv;
      const payCashPart = Number(sale.pay_cash_amount || 0);
      const payCardPart = Number(sale.pay_card_amount || 0);
      const add = (method, amount)=>{
        if(!method) return;
        const k = String(method).toLowerCase();
        const prev = Number(payByMethod.get(k)||0);
        payByMethod.set(k, prev + Number(amount||0));
      };
      if(pm==='mixed'){
        add('cash', payCashPart);
        add('card', payCardPart);
      } else if(pm==='cash'){
        const settledCash = Number(sale.settled_cash || 0);
        add('cash', (settledCash>0 ? settledCash : (payCashPart>0?payCashPart:grand)));
      } else if(pm==='card' || pm==='network' || pm==='tamara' || pm==='tabby'){
        add(pm==='network' ? 'card' : pm, (payCardPart>0 ? payCardPart : grand));
      } else {
        add(pm, grand);
      }
      if(pm==='credit' && String(sale.payment_status||'')!=='paid'){
        add('credit', grand);
      }
    });

    creditNotes.forEach(sale => {
      const pre = Number(sale.sub_total||0);
      const grand = Number(sale.grand_total||0);
      const vatv = Number(sale.vat_total||0);
      const discCN = Number(sale.discount_amount||0);
      refunds += Math.abs(pre);
      refundsVat += Math.abs(vatv);
      refundsPreAfterDisc += Math.abs(pre - discCN);
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
        sub('cash', (cCash>0 ? cCash : Math.abs(grand)));
      } else if(pm==='card' || pm==='network' || pm==='tamara' || pm==='tabby'){
        sub(pm==='network' ? 'card' : pm, (cCard>0 ? cCard : Math.abs(grand)));
      } else if(pm){
        sub(pm, Math.abs(grand));
      }
    });

    const grossAfter = grossBefore - refunds;
    const vatAfter = vatBefore - refundsVat;
    const netAfterPretax = grossAfter - disc;
    const netAfter = netAfterPretax + vatAfter;

    const purRes = await window.api.purchases_list({ from_at: startStr, to_at: adjustedEndStr });
    const purchases = (purRes && purRes.ok) ? (purRes.items||[]) : [];
    let purchasesTotal = 0; purchases.forEach(p => { purchasesTotal += Number(p.grand_total||0); });

    const salesPre = invoices.reduce((acc,s)=> acc + Number(s.sub_total||0), 0);
    // VAT before discount for display (apply on sub_total + tobacco)
    let tobInv = 0, tobCN = 0;
    try{ tobInv = invoices.reduce((a,s)=> a + Number(s.tobacco_fee||0), 0); }catch(_){ tobInv = 0; }
    try{ tobCN = creditNotes.reduce((a,s)=> a + Number(s.tobacco_fee||0), 0); }catch(_){ tobCN = 0; }
    const salesTob = Math.max(0, tobInv);
    const retTob = Math.max(0, Math.abs(tobCN));
    const vatPct = Number((await window.api.settings_get())?.item?.vat_percent || 15) / 100;
    const salesVatBefore = Number((salesPre + salesTob) * vatPct);

    const discTotal = Number(disc||0);

    // Returns display values aligned with daily report
    const retPreAfterDisc = refundsPreAfterDisc;
    let retPre = Number(refunds||0);
    let retVat = Number(refundsVat||0);
    const retAfter = creditNotes.reduce((acc,s)=> acc + Math.abs(Number(s.grand_total||0)), 0);

    let purPre = 0, purVat = 0; purchases.forEach(p => { purPre += Number(p.sub_total||0); purVat += Number(p.vat_total||0); });
    const purAfter = purPre + purVat;

    const set = (id, val)=>{ const el=document.getElementById(id); if(el){ el.textContent = Number(val||0).toFixed(2); } };
    set('salesPre', salesPre);
    set('salesVat', salesVatBefore);
    set('salesTob', salesTob);
    set('salesAfter', salesPre + salesVatBefore + salesTob);
    set('discTotal', discTotal);
    set('retPre', retPreAfterDisc);
    set('retVat', retVat);
    set('retTob', retTob);
    set('retAfter', retAfter);
    set('purPre', purPre);
    set('purVat', purVat);
    set('purAfter', purAfter);

    // Sales after discount row
    const salesAfterDiscPre = (salesPre - discTotal);
    const salesAfterDiscTob = salesTob;
    const salesAfterDiscVat = invoices.reduce((acc,s)=> acc + Number(s.vat_total||0), 0);
    const salesAfterDiscAfter = invoices.reduce((acc,s)=> acc + Number(s.grand_total||0), 0);
    set('salesAfterDiscPre', salesAfterDiscPre);
    set('salesAfterDiscTob', salesAfterDiscTob);
    set('salesAfterDiscVat', salesAfterDiscVat);
    set('salesAfterDiscAfter', salesAfterDiscAfter);

    // Net sales after discount after returns (no purchases)
    const salesAfterDiscNetPre = salesAfterDiscPre - retPreAfterDisc;
    const salesAfterDiscNetTob = salesAfterDiscTob - retTob;
    const salesAfterDiscNetVat = salesAfterDiscVat - retVat;
    const salesAfterDiscNetAfter = salesAfterDiscAfter - retAfter;
    set('salesAfterDiscNetPre', salesAfterDiscNetPre);
    set('salesAfterDiscNetTob', salesAfterDiscNetTob);
    set('salesAfterDiscNetVat', salesAfterDiscNetVat);
    set('salesAfterDiscNetAfter', salesAfterDiscNetAfter);

    // Net totals (footer) now follow daily.js logic based on after-discount values
    const netPre = (salesAfterDiscPre - retPreAfterDisc) - purPre;
    const netTob = salesAfterDiscTob - retTob;
    const netVat = (salesAfterDiscVat - retVat) - purVat;
    set('netPre', netPre);
    set('netTob', netTob);
    set('netVat', netVat);
    set('netAfter', netPre + netTob + netVat);

    // build tables similar to daily.js
    const invTbody = document.getElementById('invTbody');
    const cnTbody = document.getElementById('cnTbody');
    const purTbody = document.getElementById('purTbody');
    const invCount = document.getElementById('invCount');
    const cnCount = document.getElementById('cnCount');
    const purCount = document.getElementById('purCount');

    const invRows = invoices.map(s=>{
      let created = s.created_at ? new Date(s.created_at) : null;
      if(!created || isNaN(created.getTime())){ try{ created = new Date(String(s.created_at).replace(' ', 'T')); }catch(_){ created = new Date(); } }
      const dateStr = new Intl.DateTimeFormat('en-GB-u-ca-gregory', {year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:true}).format(created);
      const custPhone = s.customer_phone || s.disp_customer_phone || '';
      const cust = custPhone || (s.customer_name || s.disp_customer_name || '');
      const pmLower = String(s.payment_method||'').toLowerCase();
      const settledCash = Number(s.settled_cash || 0);
      const payCashPart = Number(s.pay_cash_amount || 0);
      const cashParam = (pmLower==='cash') ? (settledCash>0 ? settledCash : (payCashPart>0 ? payCashPart : Number(s.grand_total||0))) : 0;
      const viewBtn = `<button class=\"btn\" data-view=\"${s.id}\" data-type=\"invoice\" data-pay=\"${pmLower}\" data-cash=\"${cashParam}\">عرض</button>`;
      const payLabel = labelPaymentMethod(s.payment_method||'');
      return `<tr><td>${s.invoice_no||''}</td><td dir=\"ltr\" style=\"text-align:left\">${cust}</td><td>${dateStr}</td><td>${payLabel}</td><td>${fmt(s.grand_total)}</td><td>${viewBtn}</td></tr>`;
    }).join('');
    if(invTbody){ invTbody.innerHTML = invRows; }
    if(invCount){ invCount.textContent = String(invoices.length||0); }

    const cnRows = creditNotes.map(s=>{
      let created = s.created_at ? new Date(s.created_at) : null;
      if(!created || isNaN(created.getTime())){ try{ created = new Date(String(s.created_at).replace(' ', 'T')); }catch(_){ created = new Date(); } }
      const dateStr = new Intl.DateTimeFormat('en-GB-u-ca-gregory', {year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:true}).format(created);
      const custPhone = s.customer_phone || s.disp_customer_phone || '';
      const cust = custPhone || (s.customer_name || s.disp_customer_name || '');
      const payLabel = labelPaymentMethod(s.payment_method||'');
      const baseId = (s.ref_base_sale_id != null) ? String(s.ref_base_sale_id) : '';
      const baseNo = (s.ref_base_invoice_no != null) ? String(s.ref_base_invoice_no) : '';
      const attrs = [`data-view=\"${s.id}\"`, `data-type=\"credit\"`];
      if(baseId) attrs.push(`data-base=\"${baseId}\"`);
      if(baseNo) attrs.push(`data-base-no=\"${baseNo}\"`);
      const viewBtn = `<button class=\"btn\" ${attrs.join(' ')}>عرض</button>`;
      return `<tr><td>${s.invoice_no||''}</td><td dir=\"ltr\" style=\"text-align:left\">${cust}</td><td>${dateStr}</td><td>${payLabel}</td><td>${fmt(s.grand_total)}</td><td>${viewBtn}</td></tr>`;
    }).join('');
    if(cnTbody){ cnTbody.innerHTML = cnRows; }
    if(cnCount){ cnCount.textContent = String(creditNotes.length||0); }

    // Add sold items table
    const soldItemsTbody = document.getElementById('soldItemsTbody');
    // Align with backend fields from sales:items_summary (qty_total, amount_total) like daily.js
    const soldItemsRows = soldItems.map(item=>{
      const prodName = item.product_name || item.name || '';
      const qty = Number(item.qty_total || item.total_quantity || 0);
      const total = Number(item.amount_total || item.total_amount || 0);
      return `<tr><td>${prodName}</td><td>${qty}</td><td>${fmt(total)}</td></tr>`;
    }).join('');
    if(soldItemsTbody){ soldItemsTbody.innerHTML = soldItemsRows || '<tr><td colspan="3" class="muted">لا توجد بيانات</td></tr>'; }

    // Add payment methods table
    const payTbody = document.getElementById('payTbody');
    const sumTotalEl = document.getElementById('sumTotal');
    let totalPayments = 0;
    const payRows = [];
    
    [...payByMethod.entries()].sort().forEach(([method, amount]) => {
      const label = labelPaymentMethod(method);
      const amountNum = Number(amount||0);
      if(method === 'credit'){
        payRows.push(`<tr><td>${label} <span class="badge badge-credit">غير محتسب في الإجمالي</span></td><td>${fmt(amountNum)}</td></tr>`);
      } else {
        totalPayments += amountNum;
        payRows.push(`<tr><td>${label}</td><td>${fmt(amountNum)}</td></tr>`);
      }
    });
    
    if(payTbody){ payTbody.innerHTML = payRows.join(''); }
    if(sumTotalEl){ sumTotalEl.textContent = fmt(totalPayments); }

    const purRows = purchases.map(p=>{
      const d = p.purchase_at ? new Date(p.purchase_at) : (p.created_at ? new Date(p.created_at) : new Date());
      const dateStr = new Intl.DateTimeFormat('en-GB-u-ca-gregory', {year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:true}).format(d);
      return `<tr><td>${p.name||p.title||''}</td><td>${dateStr}</td><td>${fmt(p.grand_total)}</td><td>${p.notes||''}</td></tr>`;
    }).join('');
    if(purTbody){ purTbody.innerHTML = purRows; }
    if(purCount){ purCount.textContent = String(purchases.length||0); }

    // wire view buttons
    try{
      document.querySelectorAll('button[data-view]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = Number(btn.getAttribute('data-view'));
          const type = btn.getAttribute('data-type');
          const page = (type === 'credit') ? '../sales/print.html' : '../sales/print.html';
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
  }catch(e){ console.error(e); }
}

// Optimized version using aggregation - much faster for large datasets
async function loadRangeOptimized(startStr, endStr){
  try{
    // Adjust end time to include full period
    let adjustedEndStr = endStr;
    if(endStr && endStr.match(/\s00:00:00$/)){
      adjustedEndStr = endStr.replace(/00:00:00$/, '23:59:59');
    } else if(endStr && endStr.match(/:\d\d:00$/)){
      adjustedEndStr = adjustedEndStr.replace(/:00$/, ':59');
    }
    
    // Show range text
    if(rangeEl){ rangeEl.textContent = `الفترة: ${startStr} — ${endStr}`; }

    // Fetch optimized summary from new endpoint
    const summaryRes = await window.api.sales_period_summary({ 
      date_from: startStr, 
      date_to: adjustedEndStr 
    });
    
    if(!summaryRes || !summaryRes.ok){
      console.error('Failed to load period summary, falling back to old method');
      return await loadRange(startStr, endStr);
    }
    
    const { summary, items: soldItems, purchases } = summaryRes;
    
    // Process aggregated data
    let salesPre = 0, salesVat = 0, salesTob = 0;
    let discTotal = 0;
    let retPre = 0, retVat = 0, retTob = 0, retAfter = 0;
    const payByMethod = new Map();
    
    // Process summary rows
    summary.forEach(row => {
      const docType = row.doc_type;
      const isInvoice = !docType || docType === 'invoice';
      const isCreditNote = docType === 'credit_note';
      
      const subTotal = Number(row.sub_total || 0);
      const vatTotal = Number(row.vat_total || 0);
      const grandTotal = Number(row.grand_total || 0);
      const discount = Number(row.discount_amount || 0);
      const tobacco = Number(row.tobacco_fee || 0);
      const cashAmt = Number(row.pay_cash_amount || 0);
      const cardAmt = Number(row.pay_card_amount || 0);
      const pm = String(row.payment_method || '').toLowerCase();
      
      if(isInvoice){
        salesPre += subTotal;
        salesVat += vatTotal;
        salesTob += tobacco;
        discTotal += discount;
        
        // Payment methods
        if(pm === 'mixed'){
          payByMethod.set('cash', (payByMethod.get('cash') || 0) + cashAmt);
          payByMethod.set('card', (payByMethod.get('card') || 0) + cardAmt);
        } else if(pm === 'cash'){
          payByMethod.set('cash', (payByMethod.get('cash') || 0) + (cashAmt > 0 ? cashAmt : grandTotal));
        } else if(pm === 'card' || pm === 'network'){
          const key = pm === 'network' ? 'card' : pm;
          payByMethod.set(key, (payByMethod.get(key) || 0) + (cardAmt > 0 ? cardAmt : grandTotal));
        } else if(pm === 'tamara' || pm === 'tabby'){
          payByMethod.set(pm, (payByMethod.get(pm) || 0) + grandTotal);
        } else if(pm === 'credit'){
          payByMethod.set('credit', (payByMethod.get('credit') || 0) + grandTotal);
        } else if(pm){
          payByMethod.set(pm, (payByMethod.get(pm) || 0) + grandTotal);
        }
      } else if(isCreditNote){
        retPre += Math.abs(subTotal);
        retVat += Math.abs(vatTotal);
        retTob += Math.abs(tobacco);
        retAfter += Math.abs(grandTotal);
        
        // Subtract from payment methods
        if(pm === 'mixed'){
          payByMethod.set('cash', (payByMethod.get('cash') || 0) - Math.abs(cashAmt));
          payByMethod.set('card', (payByMethod.get('card') || 0) - Math.abs(cardAmt));
        } else if(pm === 'cash'){
          payByMethod.set('cash', (payByMethod.get('cash') || 0) - (cashAmt > 0 ? Math.abs(cashAmt) : Math.abs(grandTotal)));
        } else if(pm === 'card' || pm === 'network'){
          const key = pm === 'network' ? 'card' : pm;
          payByMethod.set(key, (payByMethod.get(key) || 0) - (cardAmt > 0 ? Math.abs(cardAmt) : Math.abs(grandTotal)));
        } else if(pm === 'tamara' || pm === 'tabby'){
          payByMethod.set(pm, (payByMethod.get(pm) || 0) - Math.abs(grandTotal));
        } else if(pm){
          payByMethod.set(pm, (payByMethod.get(pm) || 0) - Math.abs(grandTotal));
        }
      }
    });
    
    // Calculate purchases totals
    let purPre = 0, purVat = 0;
    purchases.forEach(p => {
      const amt = Number(p.amount || 0);
      purPre += amt;
    });
    const purAfter = purPre + purVat;
    
    // Update summary table
    const set = (id, val)=>{ const el=document.getElementById(id); if(el){ el.textContent = Number(val||0).toFixed(2); } };
    
    set('salesPre', salesPre);
    set('salesVat', salesVat);
    set('salesTob', salesTob);
    set('salesAfter', salesPre + salesVat + salesTob);
    set('discTotal', discTotal);
    
    const salesAfterDiscPre = salesPre - discTotal;
    const salesAfterDiscVat = salesVat;
    const salesAfterDiscTob = salesTob;
    const salesAfterDiscAfter = salesAfterDiscPre + salesAfterDiscVat + salesAfterDiscTob;
    set('salesAfterDiscPre', salesAfterDiscPre);
    set('salesAfterDiscTob', salesAfterDiscTob);
    set('salesAfterDiscVat', salesAfterDiscVat);
    set('salesAfterDiscAfter', salesAfterDiscAfter);
    
    set('retPre', retPre);
    set('retVat', retVat);
    set('retTob', retTob);
    set('retAfter', retAfter);
    
    const salesAfterDiscNetPre = salesAfterDiscPre - retPre;
    const salesAfterDiscNetTob = salesAfterDiscTob - retTob;
    const salesAfterDiscNetVat = salesAfterDiscVat - retVat;
    const salesAfterDiscNetAfter = salesAfterDiscAfter - retAfter;
    set('salesAfterDiscNetPre', salesAfterDiscNetPre);
    set('salesAfterDiscNetTob', salesAfterDiscNetTob);
    set('salesAfterDiscNetVat', salesAfterDiscNetVat);
    set('salesAfterDiscNetAfter', salesAfterDiscNetAfter);
    
    set('purPre', purPre);
    set('purVat', purVat);
    set('purAfter', purAfter);
    
    const netPre = salesAfterDiscNetPre - purPre;
    const netTob = salesAfterDiscNetTob;
    const netVat = salesAfterDiscNetVat - purVat;
    set('netPre', netPre);
    set('netTob', netTob);
    set('netVat', netVat);
    set('netAfter', netPre + netTob + netVat);
    
    // Update payment methods table
    const payTbody = document.getElementById('payTbody');
    if(payTbody){
      const rows = [];
      payByMethod.forEach((total, method) => {
        const label = labelPaymentMethod(method);
        rows.push(`<tr><td>${label}</td><td>${fmt(total)}</td></tr>`);
      });
      payTbody.innerHTML = rows.join('');
    }
    
    const sumTotal = Array.from(payByMethod.values()).reduce((a,b)=> a+b, 0);
    const sumTotalEl = document.getElementById('sumTotal');
    if(sumTotalEl){ sumTotalEl.textContent = fmt(sumTotal); }
    
    // Update sold items table
    const soldTbody = document.getElementById('soldTbody');
    if(soldTbody){
      const rows = soldItems.map(item => 
        `<tr><td>${item.name||''}</td><td>${fmt(item.qty_total)}</td><td>${fmt(item.amount_total)}</td></tr>`
      );
      soldTbody.innerHTML = rows.join('');
    }
    
    // Update purchases table
    const purTbody = document.getElementById('purTbody');
    const purCount = document.getElementById('purCount');
    if(purTbody){
      const purRows = purchases.map(p=>{
        const d = p.purchase_date ? new Date(p.purchase_date) : new Date();
        const dateStr = new Intl.DateTimeFormat('en-GB-u-ca-gregory', {year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:true}).format(d);
        return `<tr><td>${p.name||''}</td><td>${dateStr}</td><td>${fmt(p.amount)}</td><td>${p.notes||''}</td></tr>`;
      }).join('');
      purTbody.innerHTML = purRows;
    }
    if(purCount){ purCount.textContent = String(purchases.length||0); }
    
    // For invoice/credit note details, we still need to fetch them if user wants to view details
    // But hide those sections by default since we're using aggregation
    const invTbody = document.getElementById('invTbody');
    const cnTbody = document.getElementById('cnTbody');
    const invCount = document.getElementById('invCount');
    const cnCount = document.getElementById('cnCount');
    
    if(invTbody){ 
      invTbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#666;">استخدم التقرير السريع - لعرض تفاصيل الفواتير استخدم تقرير "كل الفواتير"</td></tr>'; 
    }
    if(cnTbody){ 
      cnTbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#666;">استخدم التقرير السريع - لعرض تفاصيل الإشعارات استخدم تقرير "الفواتير الدائنة"</td></tr>'; 
    }
    if(invCount){ 
      const invTotal = summary.filter(r => !r.doc_type || r.doc_type === 'invoice').reduce((a,r)=> a + Number(r.count||0), 0);
      invCount.textContent = String(invTotal); 
    }
    if(cnCount){ 
      const cnTotal = summary.filter(r => r.doc_type === 'credit_note').reduce((a,r)=> a + Number(r.count||0), 0);
      cnCount.textContent = String(cnTotal); 
    }
    
  }catch(e){ 
    console.error('Optimized load failed:', e); 
    // Fallback to old method
    return await loadRange(startStr, endStr);
  }
}

function initDefaultRange(){
  // default: اليوم الحالي من الساعة 00:00 إلى الآن
  const now = new Date();
  const pad2 = (v)=> String(v).padStart(2,'0');
  
  // استخدام القيم المحلية مباشرة دون تحويل timezone
  const year = now.getFullYear();
  const month = pad2(now.getMonth() + 1);
  const day = pad2(now.getDate());
  const hours = pad2(now.getHours());
  const minutes = pad2(now.getMinutes());
  
  // بناء strings مباشرة من التاريخ المحلي
  const startStr = `${year}-${month}-${day}T00:00`;
  const endStr = `${year}-${month}-${day}T${hours}:${minutes}`;
  
  if(fromAtEl) fromAtEl.value = startStr;
  if(toAtEl) toAtEl.value = endStr;
}

async function applyRange(){
  const s = fromInputToStr(fromAtEl);
  const e = fromInputToStr(toAtEl);
  if(!s || !e){ alert('يرجى تحديد الفترة كاملة'); return; }
  
  if(s > e){
    alert('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
    return;
  }
  
  await loadRangeOptimized(s, e);
}

const applyBtn = document.getElementById('applyRangeBtn');
if(applyBtn){ applyBtn.addEventListener('click', applyRange); }

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
initDefaultRange();
// Waiting for user to click Apply