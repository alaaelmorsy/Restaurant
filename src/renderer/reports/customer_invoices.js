// Customer invoices report: filter by single customer and date-time range

// Language system
const __langKey = 'app_lang';
let __currentLang = {};
function __applyLang(lang){
  const base = (typeof lang==='string' ? lang.split('-')[0].toLowerCase() : 'ar');
  const isAr = (base==='ar');
  const t = {
    customerInvoices: isAr ? 'فواتير العميل' : 'Customer Invoices',
    systemTitle: isAr ? 'نظام إدارة المطاعم' : 'Restaurant Management System',
    back: isAr ? 'رجوع' : 'Back',
    customer: isAr ? 'العميل' : 'Customer',
    customerPlaceholder: isAr ? 'ابحث عن عميل...' : 'Search for customer...',
    from: isAr ? 'من' : 'From',
    to: isAr ? 'إلى' : 'To',
    apply: isAr ? 'تطبيق' : 'Apply',
    exportPDF: isAr ? 'تصدير PDF' : 'Export PDF',
    exportExcel: isAr ? 'تصدير Excel' : 'Export Excel',
    print: isAr ? 'طباعة' : 'Print',
    number: isAr ? 'رقم' : 'No.',
    date: isAr ? 'التاريخ' : 'Date',
    paymentMethod: isAr ? 'طريقة الدفع' : 'Payment Method',
    total: isAr ? 'الإجمالي' : 'Total',
    view: isAr ? 'عرض' : 'View',
    totals: isAr ? 'الإجماليات' : 'Totals',
    count: isAr ? 'العدد' : 'Count',
    cash: isAr ? 'نقدًا' : 'Cash',
    network: isAr ? 'شبكة' : 'Network',
    credit: isAr ? 'آجل' : 'Credit',
    tamara: isAr ? 'تمارا' : 'Tamara',
    tabby: isAr ? 'تابي' : 'Tabby',
    mixed: isAr ? 'مختلط' : 'Mixed',
    noResults: isAr ? 'لا توجد نتائج' : 'No results',
    searchError: isAr ? 'خطأ في البحث' : 'Search error',
  };
  
  __currentLang = t;
  
  document.documentElement.lang = isAr ? 'ar' : 'en';
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  
  document.title = t.customerInvoices;
  const pageTitle = document.querySelector('.text-3xl');
  if(pageTitle) pageTitle.textContent = t.customerInvoices;
  
  const systemTitle = document.querySelector('.text-sm.text-gray-500');
  if(systemTitle) systemTitle.textContent = t.systemTitle;
  
  const btnBack = document.getElementById('btnBack');
  if(btnBack) btnBack.textContent = t.back;
  
  const customerLabel = document.querySelector('label[for="customerSearch"]');
  if(customerLabel) customerLabel.textContent = t.customer;
  
  const customerSearch = document.getElementById('customerSearch');
  if(customerSearch) customerSearch.placeholder = t.customerPlaceholder;
  
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
  
  const tableHeaders = document.querySelectorAll('table thead th');
  if(tableHeaders.length >= 6){
    tableHeaders[0].textContent = t.number;
    tableHeaders[1].textContent = 'الجوال';
    tableHeaders[2].textContent = t.date;
    tableHeaders[3].textContent = 'النوع';
    tableHeaders[4].textContent = t.paymentMethod;
    tableHeaders[5].textContent = 'قبل الضريبة';
    tableHeaders[6].textContent = 'الضريبة';
    tableHeaders[7].textContent = t.total;
    tableHeaders[8].textContent = t.view;
  }
  
  const footerCells = document.querySelectorAll('table tfoot th');
  if(footerCells.length > 0) footerCells[0].textContent = t.totals;
  
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
const customerSearchEl = document.getElementById('customerSearch');
const customerSuggestEl = document.getElementById('customerSuggest');
let selectedCustomerId = null;

const btnBack = document.getElementById('btnBack');
if(btnBack){ btnBack.onclick = ()=>{ window.location.href = './index.html'; } }

// بحث فوري عن العملاء بالاسم/الجوال مع اقتراحات واختيار معرف العميل
(function initCustomerSearch(){
  if(!customerSearchEl) return;
  const hideSuggest = ()=>{ if(customerSuggestEl) customerSuggestEl.style.display='none'; };
  const showSuggest = (html)=>{ if(customerSuggestEl){ customerSuggestEl.innerHTML = html; customerSuggestEl.style.display = html ? 'block':'none'; } };
  let lastQuery = '';
  let timer = null;
  const doSearch = async (q)=>{
    if(!q || q.trim()===''){ showSuggest(''); return; }
    try{
      const res = await window.api.customers_list({ q: q.trim(), sort: 'name_asc' });
      const items = (res && res.ok) ? (res.items||[]) : [];
      if(!items.length){ showSuggest('<div class="text-gray-500" style="padding:8px 12px">لا توجد نتائج</div>'); return; }
      const rows = items.slice(0,50).map(c=>{
        const phone = c.phone ? ` — ${c.phone}` : '';
        return `<div class="suggest-item opt" data-id="${c.id}" data-name="${c.name||''}" data-phone="${c.phone||''}">${c.name||('عميل #' + c.id)}${phone}</div>`;
      }).join('');
      showSuggest(rows);
      // attach click
      Array.from(customerSuggestEl.querySelectorAll('.opt')).forEach(el => {
        el.addEventListener('click', () => {
          selectedCustomerId = Number(el.getAttribute('data-id'))||null;
          const nm = el.getAttribute('data-name')||'';
          const ph = el.getAttribute('data-phone')||'';
          customerSearchEl.value = nm || (ph?ph:('عميل #' + selectedCustomerId));
          hideSuggest();
        });
      });
    }catch(e){ console.error(e); showSuggest('<div class="text-gray-500" style="padding:8px 12px">خطأ في البحث</div>'); }
  };
  customerSearchEl.addEventListener('input', (e)=>{
    const q = e.target.value || '';
    selectedCustomerId = null; // لأن المستخدم يغيّر النص
    if(q===lastQuery) return; lastQuery = q;
    clearTimeout(timer); timer = setTimeout(()=> doSearch(q), 250);
  });
  customerSearchEl.addEventListener('focus', ()=>{ if(customerSearchEl.value) doSearch(customerSearchEl.value); });
  document.addEventListener('click', (ev)=>{ if(!customerSuggestEl.contains(ev.target) && ev.target!==customerSearchEl){ hideSuggest(); } });
})();

(function attachExportHandlers(){
  let exporting = false;
  const btnPdf = document.getElementById('exportPdfBtn');
  if(btnPdf){
    btnPdf.addEventListener('click', async () => {
      if(exporting) return; exporting = true; btnPdf.disabled = true;
      try{
        // حفظ معلومات الفترة والعميل
        let periodFromText = '';
        let periodToText = '';
        let selectedCustomerName = '';
        try{
          const fromInput = document.getElementById('fromAt');
          const toInput = document.getElementById('toAt');
          const customerInput = document.getElementById('customerSearch');
          
          if(fromInput && fromInput.value){
            periodFromText = fromInput.value.replace('T', ' ');
          }
          if(toInput && toInput.value){
            periodToText = toInput.value.replace('T', ' ');
          }
          if(customerInput && customerInput.value){
            selectedCustomerName = customerInput.value;
          }
        }catch(_){}
        
        const period = (rangeEl && rangeEl.textContent) ? rangeEl.textContent.replace(/[^0-9_\-–: ]+/g,'').replace(/\s+/g,' ').trim() : '';
        const safe = (period||'').replace(/[: ]/g,'_');
        const cust = selectedCustomerId ? `-c${selectedCustomerId}` : '';
        const title = `customer-invoices${cust}-${safe||Date.now()}.pdf`;
        
        // Build clone and ensure all collapsible sections are expanded for PDF
        const clone = document.documentElement.cloneNode(true);
        
        // إضافة Tailwind CSS
        try{
          const tailwindLink = document.createElement('script');
          tailwindLink.src = 'https://cdn.tailwindcss.com';
          clone.querySelector('head')?.appendChild(tailwindLink);
        }catch(_){}
        
        // إزالة العناصر غير المطلوبة
        try{
          const removeElements = clone.querySelectorAll('header, button, select, input, label, #customerSuggest');
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
            
            let headerHTML = '<h1 style="font-size: 28px; font-weight: 900; color: #1f2937; margin-bottom: 8px; font-family: Cairo, sans-serif;">تقرير العملاء</h1>';
            
            if(periodFromText && periodToText){
              headerHTML += '<div style="font-size: 16px; font-weight: 700; color: #4b5563; margin-top: 12px; font-family: Cairo, sans-serif;">';
              headerHTML += `<div style="margin: 4px 0;">من: ${periodFromText}</div>`;
              headerHTML += `<div style="margin: 4px 0;">إلى: ${periodToText}</div>`;
              if(selectedCustomerName){
                headerHTML += `<div style="margin: 4px 0;">العميل: ${selectedCustomerName}</div>`;
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
            
            /* عرض جميع الأعمدة عدا الأخير */
            .grid-table thead th,
            .grid-table tbody td,
            .grid-table tfoot th {
              display: table-cell !important;
              width: auto !important;
            }
            
            /* إخفاء عمود "عرض" */
            .grid-table thead th:last-child,
            .grid-table tbody td:last-child,
            .grid-table tfoot th:last-child {
              display: none !important;
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
        const tableElem = document.querySelector('tbody#invTbody')?.closest('table');
        if(rangeEl && rangeEl.textContent){ lines.push(esc('الفترة'), esc(rangeEl.textContent.trim())); lines.push(''); }
        if(tableElem){
          const ths = Array.from(tableElem.querySelectorAll('thead th')).map(th=>th.textContent.trim());
          if(ths.length) lines.push(ths.map(esc).join(','));
          Array.from(tableElem.querySelectorAll('tbody tr')).forEach(tr=>{
            const tds = Array.from(tr.querySelectorAll('td')).map(td=>td.textContent.trim());
            if(tds.length) lines.push(tds.map(esc).join(','));
          });
          // footer
          const sumNormalPre = document.getElementById('sumNormalPre')?.textContent || '0.00';
          const sumNormalVat = document.getElementById('sumNormalVat')?.textContent || '0.00';
          const sumNormalGrand = document.getElementById('sumNormalGrand')?.textContent || '0.00';
          const sumCreditPre = document.getElementById('sumCreditPre')?.textContent || '0.00';
          const sumCreditVat = document.getElementById('sumCreditVat')?.textContent || '0.00';
          const sumCreditGrand = document.getElementById('sumCreditGrand')?.textContent || '0.00';
          const sumNetPre = document.getElementById('sumNetPre')?.textContent || '0.00';
          const sumNetVat = document.getElementById('sumNetVat')?.textContent || '0.00';
          const sumNetGrand = document.getElementById('sumNetGrand')?.textContent || '0.00';
          lines.push('');
          lines.push([esc('إجمالي الفواتير العادية'), '', '', '', '', esc(sumNormalPre), esc(sumNormalVat), esc(sumNormalGrand)].join(','));
          lines.push([esc('إجمالي الفواتير الدائنة (للخصم)'), '', '', '', '', esc(sumCreditPre), esc(sumCreditVat), esc(sumCreditGrand)].join(','));
          lines.push([esc('الصافي بعد الخصم'), '', '', '', '', esc(sumNetPre), esc(sumNetVat), esc(sumNetGrand)].join(','));
        }
        const period = (rangeEl && rangeEl.textContent) ? rangeEl.textContent.replace(/[^0-9_\-–: ]+/g,'').replace(/\s+/g,' ').trim() : '';
        const filename = `customer-invoices-c${selectedCustomerId||'all'}-${(period||'').replace(/[: ]/g,'_')||Date.now()}.csv`;
        await window.api.csv_export(lines.join('\n'), { saveMode:'auto', filename });
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
        
        // Get settings to check silent_print option
        let silentPrint = false;
        try{
          const st = await window.api.settings_get();
          const s = (st && st.ok) ? st.item : {};
          silentPrint = !!s.silent_print;
        }catch(_){ }

        // Get values from original document
        let periodFromText = '';
        let periodToText = '';
        let selectedCustomerName = '';
        try{
          const fromInput = document.getElementById('fromAt');
          const toInput = document.getElementById('toAt');
          const customerInput = document.getElementById('customerSearch');
          
          if(fromInput && fromInput.value){
            periodFromText = fromInput.value.replace('T', ' ');
          }
          if(toInput && toInput.value){
            periodToText = toInput.value.replace('T', ' ');
          }
          if(customerInput && customerInput.value){
            selectedCustomerName = customerInput.value;
          }
        }catch(_){}
        
        // Ensure settings-based margins are applied before snapshot
        try{ if(window.applyPrintMarginsFromSettings) await window.applyPrintMarginsFromSettings(); }catch(_){ }
        
        // Prepare a clean HTML snapshot (remove export buttons/toolbars)
        const clone = document.documentElement.cloneNode(true);
        
        // Remove toolbar actions
        try{
          const toolbar = clone.querySelector('.range-actions');
          if(toolbar){ toolbar.parentNode.removeChild(toolbar); }
          const hdr = clone.querySelector('header');
          if(hdr && hdr.parentNode){ hdr.parentNode.removeChild(hdr); }
        }catch(_){ }
        
        // Remove filter controls and action buttons section
        try{
          const container = clone.querySelector('.container');
          if(container){
            const firstBgWhite = container.querySelector('.bg-white.rounded-2xl');
            if(firstBgWhite){ firstBgWhite.remove(); }
            
            // Inject Header
            const tempDiv = document.createElement('div');
            tempDiv.style.cssText = 'text-align: center; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid #000;';
            
            let headerHTML = '<h1 style="font-size: 16px; font-weight: 900; color: #000; margin-bottom: 4px; font-family: Cairo, sans-serif;">تقرير العملاء</h1>';
            
            if(periodFromText && periodToText){
              headerHTML += '<div style="font-size: 12px; font-weight: 700; color: #000; margin-top: 5px; font-family: Cairo, sans-serif;">';
              headerHTML += `<div style="margin: 2px 0;">من: ${periodFromText}</div>`;
              headerHTML += `<div style="margin: 2px 0;">إلى: ${periodToText}</div>`;
              if(selectedCustomerName){
                headerHTML += `<div style="margin: 2px 0;">العميل: ${selectedCustomerName}</div>`;
              }
              headerHTML += '</div>';
            }
            
            tempDiv.innerHTML = headerHTML;
            container.insertBefore(tempDiv, container.firstChild);
          }
        }catch(_){ }
        
        // Remove payment totals section
        try{
          const sections = clone.querySelectorAll('.bg-white.rounded-2xl');
          if(sections.length > 0){
            sections[sections.length - 1].remove();
          }
        }catch(_){ }
        
        try{
          const table = clone.querySelector('.grid-table');
          if(table){
            let sumNormalGrand = 0, sumCreditGrand = 0;
            const rowsHtml = Array.from(table.querySelectorAll('tbody tr')).map(tr=>{
              const cells = tr.querySelectorAll('td');
              const invoice = cells[0]?.innerHTML || '';
              const phone = cells[1]?.innerHTML || '';
              const date = cells[2]?.innerHTML || '';
              const docType = cells[3]?.textContent || '';
              const pay = cells[4]?.innerHTML || '';
              const totalCell = cells[7];
              const totalRaw = totalCell?.textContent || totalCell?.innerHTML || '0';
              const totalNum = Number(String(totalRaw).replace(/[^0-9.-]/g,'')) || 0;
              const isCreditNote = docType.includes('دائنة');
              if(isCreditNote){
                sumCreditGrand += Math.abs(totalNum);
              } else {
                sumNormalGrand += totalNum;
              }
              return `<tr><td class="text-center">${invoice}</td><td class="num" dir="ltr" style="text-align:left">${phone}</td><td class="text-center num">${date}</td><td class="text-center">${docType}</td><td class="text-center">${pay}</td><td class="text-center num">${fmt(totalNum)}</td></tr>`;
            }).join('') || '<tr><td colspan="6" class="text-center text-gray-500 py-4">لا توجد فواتير ضمن الفترة</td></tr>';
            const netGrand = sumNormalGrand - sumCreditGrand;
            table.innerHTML = `
              <thead>
                <tr>
                  <th>رقم</th>
                  <th>الجوال</th>
                  <th>التاريخ</th>
                  <th>النوع</th>
                  <th>طريقة الدفع</th>
                  <th>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <th colspan="5" class="text-center">فواتير عادية</th>
                  <th class="text-center">${fmt(sumNormalGrand)}</th>
                </tr>
                <tr>
                  <th colspan="5" class="text-center">فواتير دائنة (خصم)</th>
                  <th class="text-center">${fmt(sumCreditGrand)}</th>
                </tr>
                <tr style="border-top: 3px solid #000;">
                  <th colspan="5" class="text-center">الصافي</th>
                  <th class="text-center">${fmt(netGrand)}</th>
                </tr>
              </tfoot>
            `;
          }
        }catch(e){ console.error('Column removal error:', e); }
        
        // Add print styles for 80mm width with Cairo font
        const style = document.createElement('style');
        style.textContent = `
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@700;800;900&display=swap');
          
          @page { margin: 0; }
          html{ 
            width:100%; 
            margin:0; 
            padding:0; 
          }
          body{ 
            width:80mm; 
            max-width:80mm; 
            margin:0 auto; 
            padding:0; 
            box-sizing: border-box; 
            padding-left: var(--m-left); 
            padding-right: var(--m-right); 
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
          body, .container, .section:first-child{ margin-top:0 !important; padding-top:0 !important; }
          .container{ 
            width:100%; 
            max-width:100%; 
            margin:0; 
            padding-left: 0; 
            padding-right: 0; 
            padding-top:0; 
            padding-bottom:4px; 
            overflow:hidden; 
          }
          .container > *:first-child{ margin-top:0 !important; }
          div[style*="overflow:auto"]{ overflow: visible !important; }
          
          h3{
            font-family: 'Cairo', sans-serif !important;
            font-weight: 900 !important;
            color: #000 !important;
            font-size: 14px !important;
            margin-bottom: 6px !important;
            text-align: center;
          }
          
          table{ 
            width:100%; 
            max-width:100%; 
            border-collapse:collapse; 
            table-layout: auto; 
            font-size:10px; 
            line-height:1.3;
            font-family: 'Cairo', sans-serif !important;
          }
          th,td{ 
            padding:4px 3px; 
            word-break: normal; 
            overflow-wrap: normal; 
            white-space: normal;
            font-family: 'Cairo', sans-serif !important;
            font-weight: 700 !important;
            color: #000 !important;
          }
          
          th{ 
            background:#fff !important; 
            color:#000 !important; 
            border-bottom:3px solid #000 !important;
            font-weight: 900 !important;
          }
          .section{ margin:5px 0; padding:5px; border:2px solid #000; }
          
          /* شبكة للطباعة - borders ثقيلة */
          .grid-table{ 
            border:3px solid #000 !important; 
            border-collapse:collapse; 
          }
          .grid-table th, .grid-table td{ 
            border:2px solid #000 !important; 
            text-align: center; 
          }
          .grid-table tfoot th{ 
            border-top:3px solid #000 !important; 
            background:#fff !important; 
            font-weight: 900 !important;
            color: #000 !important;
          }
          
          /* Override global print styles that hide the last column */
          .grid-table thead th:last-child,
          .grid-table tbody td:last-child,
          .grid-table tfoot th:last-child {
            display: table-cell !important;
          }

          /* تنسيق الأعمدة الـ 6: رقم، الجوال، التاريخ، النوع، طريقة الدفع، الإجمالي */
          /* رقم الفاتورة */
          .grid-table th:nth-child(1), .grid-table td:nth-child(1){
            white-space: nowrap;
            width: 11%;
            font-size: 9px;
          }
          
          /* الجوال */
          .grid-table th:nth-child(2), .grid-table td:nth-child(2){
            white-space: normal;
            overflow-wrap: anywhere;
            word-break: break-all;
            width: 18%;
            font-size: 8px;
            direction: ltr;
            text-align: left;
          }
          
          /* التاريخ */
          .grid-table th:nth-child(3), .grid-table td:nth-child(3){
            white-space: normal;
            overflow-wrap: anywhere;
            word-break: break-word;
            width: 22%;
            font-size: 8px;
          }
          
          /* النوع */
          .grid-table th:nth-child(4), .grid-table td:nth-child(4){
            white-space: nowrap;
            width: 12%;
            font-size: 8px;
          }
          
          /* طريقة الدفع */
          .grid-table th:nth-child(5), .grid-table td:nth-child(5){
            white-space: nowrap;
            width: 15%;
            font-size: 8px;
          }
          
          /* الإجمالي */
          .grid-table th:nth-child(6), .grid-table td:nth-child(6){
            white-space: nowrap;
            width: 22%;
            font-size: 9px;
            direction: ltr;
            text-align: left;
          }
          
          /* تنسيق الـ footer */
          .grid-table tfoot th{
            font-size: 11px;
            padding: 5px 3px;
            font-weight: 900 !important;
          }
        `;
        clone.querySelector('head')?.appendChild(style);
        
        // Split period label into two lines
        try{
          const r = clone.getElementById('range');
          if(r && r.textContent){
            const m = r.textContent.match(/الفترة:\s*(\d{4}-\d{2}-\d{2}[^–]+)\s*[—–-]\s*(\d{4}-\d{2}-\d{2}.*)$/);
            if(m){ r.innerHTML = `الفترة:<br>من: ${m[1].trim()}<br>إلى: ${m[2].trim()}`; }
          }
        }catch(_){ }
        
        const html = '<!doctype html>' + clone.outerHTML;
        await window.api.print_html(html, {
          silent: silentPrint,
          pageSize: { width: 80000, height: 297000 },
          margins: { marginType: 'none' },
          printBackground: true,
        });
      }catch(e){ console.error(e); alert('تعذر الطباعة'); }
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

async function loadRange(startStr, endStr){
  // تعديل endStr لضمان شمول كل الثواني في الدقيقة المحددة
  let adjustedEndStr = endStr;
  if(endStr && endStr.match(/\s00:00:00$/)){
    adjustedEndStr = endStr.replace(/00:00:00$/, '23:59:59');
  } else if(endStr && endStr.match(/:\d\d:00$/)){
    adjustedEndStr = endStr.replace(/:00$/, ':59');
  }
  
  if(rangeEl){ rangeEl.textContent = `الفترة: ${startStr} — ${endStr}`; }
  const custId = Number(selectedCustomerId||0) || null;
  try{
    const query = { date_from: startStr, date_to: adjustedEndStr };
    if(custId){ query.customer_id = custId; } else { query.customers_only = true; }
    const res = await window.api.sales_list(query);
    const items = (res && res.ok) ? (res.items||[]) : [];

    const invTbody = document.getElementById('invTbody');
    let sumNormalPre = 0, sumNormalVat = 0, sumNormalGrand = 0, normalCount = 0;
    let sumCreditPre = 0, sumCreditVat = 0, sumCreditGrand = 0, creditCount = 0;
    const payTotals = new Map();

    const rows = items.map(s=>{
      let created = s.created_at ? new Date(s.created_at) : null;
      if(!created || isNaN(created.getTime())){ try{ created = new Date(String(s.created_at).replace(' ', 'T')); }catch(_){ created = new Date(); } }
      const datePart = new Intl.DateTimeFormat('en-GB-u-ca-gregory', {year:'numeric', month:'2-digit', day:'2-digit'}).format(created);
      const timePart = new Intl.DateTimeFormat('en-GB-u-ca-gregory', {hour:'2-digit', minute:'2-digit', hour12:true}).format(created);
      // Prefer phone; fallback to stored snapshot name if phone missing
      const custPhone = s.customer_phone || s.disp_customer_phone || '';
      const cust = custPhone || (s.customer_name || s.disp_customer_name || '');
      // Check if this is a credit note
      const isCreditNote = s.doc_type === 'credit_note';
      const pre = Number(s.sub_total||0);
      const vat = Number(s.vat_total||0);
      const grand = Number(s.grand_total||0);
      
      // حساب الإجماليات بشكل منفصل
      if(isCreditNote){
        sumCreditPre += Math.abs(pre);
        sumCreditVat += Math.abs(vat);
        sumCreditGrand += Math.abs(grand);
        creditCount++;
      } else {
        sumNormalPre += Math.abs(pre);
        sumNormalVat += Math.abs(vat);
        sumNormalGrand += Math.abs(grand);
        normalCount++;
      }
      
      const pm = String(s.payment_method || '').toLowerCase();
      const payLabel = (m)=> m==='cash' ? 'نقدًا' : (m==='card'||m==='network' ? 'شبكة' : (m==='credit' ? 'آجل' : (m==='mixed'?'مختلط': m)));
      const docTypeLabel = isCreditNote ? '<span class="text-red-600 font-bold">دائنة</span>' : '<span class="text-green-600 font-bold">عادية</span>';
      
      // عرض القيم كما هي (موجبة) لكن مع علامة للدائنة
      const displayPre = isCreditNote ? `-${fmt(Math.abs(pre))}` : fmt(Math.abs(pre));
      const displayVat = isCreditNote ? `-${fmt(Math.abs(vat))}` : fmt(Math.abs(vat));
      const displayGrand = isCreditNote ? `-${fmt(Math.abs(grand))}` : fmt(Math.abs(grand));
      
      // totals by payment
      const multiplier = isCreditNote ? -1 : 1;
      const addAmt = (key, amount)=>{
        if(!key) return; const k=(key==='network'?'card':key); const prev=Number(payTotals.get(k)||0); payTotals.set(k, prev + Number(amount||0)); };
      if(pm==='mixed'){
        addAmt('cash', (Math.abs(Number(s.pay_cash_amount||0)) || Math.abs(grand)/2) * multiplier);
        addAmt('card', (Math.abs(Number(s.pay_card_amount||0)) || Math.abs(grand)/2) * multiplier);
      } else if(pm==='cash'){
        addAmt('cash', (Math.abs(Number(s.settled_cash||0)) || Math.abs(Number(s.pay_cash_amount||0)) || Math.abs(grand)) * multiplier);
      } else if(pm==='card' || pm==='network' || pm==='tamara' || pm==='tabby'){
        addAmt(pm, (Math.abs(Number(s.pay_card_amount||0)) || Math.abs(grand)) * multiplier);
      } else if(pm){ addAmt(pm, Math.abs(grand) * multiplier); }
      const viewBtn = `<button class="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-bold" data-view="${s.id}">عرض</button>`;
      return `<tr><td class="text-center">${s.invoice_no||''}</td><td class="num" dir="ltr" style="text-align:left">${cust}</td><td class="text-center num">${datePart}<br>${timePart}</td><td class="text-center">${docTypeLabel}</td><td class="text-center">${payLabel(pm)}</td><td class="text-center num">${displayPre}</td><td class="text-center num">${displayVat}</td><td class="text-center num">${displayGrand}</td><td class="text-center">${viewBtn}</td></tr>`;
    }).join('');

    if(invTbody){ invTbody.innerHTML = rows || '<tr><td colspan="9" class="text-center text-gray-500 py-8">لا توجد فواتير ضمن الفترة</td></tr>'; }
    
    // حساب الصافي
    const netPre = sumNormalPre - sumCreditPre;
    const netVat = sumNormalVat - sumCreditVat;
    const netGrand = sumNormalGrand - sumCreditGrand;
    
    const set = (id, v)=>{ const el = document.getElementById(id); if(!el) return; el.textContent = id.includes('Count') ? String(v) : fmt(v); };
    // الفواتير العادية
    set('sumNormalPre', sumNormalPre); set('sumNormalVat', sumNormalVat); set('sumNormalGrand', sumNormalGrand); set('sumNormalCount', normalCount);
    // الفواتير الدائنة
    set('sumCreditPre', sumCreditPre); set('sumCreditVat', sumCreditVat); set('sumCreditGrand', sumCreditGrand); set('sumCreditCount', creditCount);
    // الصافي
    set('sumNetPre', netPre); set('sumNetVat', netVat); set('sumNetGrand', netGrand); set('sumTotalCount', items.length||0);

    // render payment totals
    try{
      const container = document.getElementById('payTotals');
      if(container){
        const label = (k)=> k==='cash'?'نقدًا':(k==='card'?'شبكة':(k==='credit'?'آجل':(k==='tamara'?'تمارا':(k==='tabby'?'تابي':k))));
        const entries = Array.from(payTotals.entries()).filter(([k])=>k);
        entries.sort((a,b)=> a[0].localeCompare(b[0]));
        const totalNet = entries.reduce((sum, [,v]) => sum + Number(v||0), 0);
        const cards = entries.map(([k,v])=>`<div class="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4 shadow-md"><div class="text-gray-600 font-bold text-sm mb-2">${label(k)}</div><div class="text-2xl font-black text-blue-700">${fmt(Number(v||0))}</div></div>`).join('');
        const totalCard = `<div class="bg-gradient-to-br from-green-100 to-green-200 border-4 border-green-600 rounded-xl p-4 shadow-xl"><div class="text-green-900 font-black text-sm mb-2">الإجمالي الصافي</div><div class="text-3xl font-black text-green-900">${fmt(totalNet)}</div></div>`;
        container.innerHTML = (cards || '<div class="text-gray-500 text-center py-8">لا توجد بيانات طرق الدفع ضمن الفترة</div>') + (entries.length ? totalCard : '');
      }
    }catch(_){ }

    // open print view
    try{
      document.querySelectorAll('button[data-view]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = Number(btn.getAttribute('data-view'));
          const page = '../sales/print.html';
          const w = 500, h = 700;
          const url = `${page}?id=${encodeURIComponent(String(id))}&preview=1`;
          window.open(url, 'PRINT_VIEW', `width=${w},height=${h},menubar=no,toolbar=no,location=no,status=no`);
        });
      });
    }catch(_){ }
  }catch(e){ console.error(e); }
}

function initDefaultRange(){
  const now = new Date();
  const start = new Date(now); start.setHours(0,0,0,0);
  const s = toStr(start), e = toStr(now);
  if(fromAtEl) fromAtEl.value = s.replace(' ', 'T').slice(0,16);
  if(toAtEl) toAtEl.value = e.replace(' ', 'T').slice(0,16);
}

(async function wireRange(){
  const btn = document.getElementById('applyRangeBtn');
  if(btn){ btn.addEventListener('click', () => {
    const s = fromInputToStr(fromAtEl);
    const e = fromInputToStr(toAtEl);
    if(!s || !e){ alert('يرجى تحديد الفترة (من وإلى)'); return; }
    loadRange(s, e);
  }); }
  if(customerSearchEl){ customerSearchEl.addEventListener('keydown', (ev)=>{
    if(ev.key==='Enter'){
      const s = fromInputToStr(fromAtEl);
      const e = fromInputToStr(toAtEl);
      if(s && e){ loadRange(s, e); }
    }
  }); }
})();

// فتح التقويم عند الضغط في أي مكان في حقل التاريخ (للأجهزة اللمسية)
if(fromAtEl){
  fromAtEl.addEventListener('click', function(){ this.showPicker(); });
  fromAtEl.addEventListener('focus', function(){ this.showPicker(); });
}
if(toAtEl){
  toAtEl.addEventListener('click', function(){ this.showPicker(); });
  toAtEl.addEventListener('focus', function(){ this.showPicker(); });
}

initDefaultRange();