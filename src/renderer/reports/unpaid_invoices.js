// Unpaid invoices report: list credit invoices (payment_status=unpaid) within a date range

// Language system
const __langKey = 'app_lang';
let __currentLang = {};
function __applyLang(lang){
  const base = (typeof lang==='string' ? lang.split('-')[0].toLowerCase() : 'ar');
  const isAr = (base==='ar');
  const t = {
    unpaidInvoices: isAr ? 'الفواتير غير المدفوعة' : 'Unpaid Invoices',
    systemTitle: isAr ? 'نظام إدارة المطاعم' : 'Restaurant Management System',
    back: isAr ? 'رجوع' : 'Back',
    from: isAr ? 'من' : 'From',
    to: isAr ? 'إلى' : 'To',
    apply: isAr ? 'تطبيق' : 'Apply',
    exportPDF: isAr ? 'تصدير PDF' : 'Export PDF',
    exportExcel: isAr ? 'تصدير Excel' : 'Export Excel',
    number: isAr ? 'رقم' : 'No.',
    customer: isAr ? 'العميل' : 'Customer',
    date: isAr ? 'التاريخ' : 'Date',
    paymentMethod: isAr ? 'طريقة الدفع' : 'Payment Method',
    total: isAr ? 'الإجمالي' : 'Total',
    view: isAr ? 'عرض' : 'View',
    totals: isAr ? 'الإجماليات' : 'Totals',
    count: isAr ? 'العدد' : 'Count',
  };
  
  __currentLang = t;
  
  document.documentElement.lang = isAr ? 'ar' : 'en';
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  
  document.title = t.unpaidInvoices;
  const pageTitle = document.querySelector('.text-3xl');
  if(pageTitle) pageTitle.textContent = t.unpaidInvoices;
  
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
  
  const tableHeaders = document.querySelectorAll('table thead th');
  if(tableHeaders.length >= 6){
    tableHeaders[0].textContent = t.number;
    tableHeaders[1].textContent = t.customer;
    tableHeaders[2].textContent = t.date;
    tableHeaders[3].textContent = t.paymentMethod;
    tableHeaders[4].textContent = t.total;
    tableHeaders[5].textContent = t.view;
  }
  
  const footerCells = document.querySelectorAll('table tfoot th');
  if(footerCells.length > 0) footerCells[0].textContent = t.totals;
  
  try{ localStorage.setItem(__langKey, base); }catch(_){ }
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

const btnBack = document.getElementById('btnBack');
if(btnBack){ btnBack.onclick = ()=>{ window.location.href = './index.html'; } }

function toStartStr(input){
  const v = (input?.value||'').trim();
  return v ? v.replace('T',' ') + ':00' : '';
}
function toEndStr(input){
  const v = (input?.value||'').trim();
  return v ? v.replace('T',' ') + ':59' : '';
}
function toStr(d){
  const pad2 = (v)=> String(v).padStart(2,'0');
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:00`;
}

function initDefaultRange(){
  const now = new Date();
  const start = new Date(now); start.setHours(0,0,0,0);
  const s = toStr(start), e = toStr(now);
  if(fromAtEl) fromAtEl.value = s.replace(' ', 'T').slice(0,16);
  if(toAtEl) toAtEl.value = e.replace(' ', 'T').slice(0,16);
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
  try{
    // Fetch unpaid credit invoices in range
    const res = await window.api.sales_list_credit({ date_from: startStr, date_to: adjustedEndStr, settled_only: false, pageSize: 10000 });
    const items = (res && res.ok) ? (res.items||[]) : [];

    const invTbody = document.getElementById('invTbody');
    let sumGrand = 0;

    const rows = items.map(s=>{
      // Use created_at for unpaid credit invoices
      let created = s.created_at ? new Date(s.created_at) : null;
      if(!created || isNaN(created.getTime())){ try{ created = new Date(String(s.created_at||'').replace(' ', 'T')); }catch(_){ created = new Date(); } }
      const dateStr = new Intl.DateTimeFormat('en-GB-u-ca-gregory', {year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:true}).format(created);
      const cust = s.customer_name || s.disp_customer_name || '';
      const grand = Number(s.grand_total||0);
      sumGrand += grand;
      const payLabels = { cash:'كاش', card:'شبكة', credit:'آجل', mixed:'مختلط', tamara:'تمارا', tabby:'تابي', refund:'إشعار دائن' };
      const payKey = String(s.payment_method||'').toLowerCase();
      const pay = payLabels[payKey] || (s.payment_method || '');
      const viewBtn = `<button class="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-semibold" data-view="${s.id}">عرض</button>`;
      return `<tr><td class="text-center">${s.invoice_no||''}</td><td class="text-center">${cust}</td><td class="text-center">${dateStr}</td><td class="text-center">${pay}</td><td class="text-center">${fmt(grand)}</td><td class="text-center">${viewBtn}</td></tr>`;
    }).join('');

    if(invTbody){ invTbody.innerHTML = rows || '<tr><td colspan="6" class="text-center text-gray-500 py-4">لا توجد فواتير غير مدفوعة ضمن الفترة</td></tr>'; }
    const set = (id, v)=>{ const el = document.getElementById(id); if(!el) return; el.textContent = (id==='sumCount') ? String(items.length||0) : fmt(v); };
    set('sumGrand', sumGrand); set('sumCount', items.length||0);

    // open print view
    try{
      document.querySelectorAll('button[data-view]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = Number(btn.getAttribute('data-view'));
          try{
            const page = '../sales/print.html'; // A4 removed
            const w = 500;
            const h = 700;
            const url = `${page}?id=${encodeURIComponent(String(id))}&preview=1`; // منع أي طباعة تلقائية عند العرض
            window.open(url, 'PRINT_VIEW', `width=${w},height=${h}`);
          }catch(_){
            const page = '../sales/print.html';
            const w = 500, h = 700;
            const url = `${page}?id=${encodeURIComponent(String(id))}&preview=1`;
            window.open(url, 'PRINT_VIEW', `width=${w},height=${h}`);
          }
        });
      });
    }catch(_){ }
  }catch(e){ console.error(e); }
}

(function wireRange(){
  const btn = document.getElementById('applyRangeBtn');
  if(btn){ btn.addEventListener('click', () => {
    const s = toStartStr(fromAtEl);
    const e = toEndStr(toAtEl);
    if(!s || !e){ alert('يرجى تحديد الفترة (من وإلى)'); return; }
    loadRange(s, e);
  }); }
})();

(function attachExportHandlers(){
  let exporting = false;
  const btnPdf = document.getElementById('exportPdfBtn');
  if(btnPdf){
    btnPdf.addEventListener('click', async () => {
      if(exporting) return; exporting = true; btnPdf.disabled = true;
      try{
        const period = (rangeEl && rangeEl.textContent) ? rangeEl.textContent.replace(/[^0-9_\-–: ]+/g,'').replace(/\s+/g,' ').trim() : '';
        const safe = (period||'').replace(/[: ]/g,'_');
        const title = `unpaid-invoices-${safe||Date.now()}.pdf`;
        
        let htmlContent = document.documentElement.outerHTML;
        
        const pdfStyle = `
          <style>
            @media print {
              @page{ size: A4; margin: 8mm 12mm; }
              
              *, *::before, *::after {
                font-family: 'Cairo', sans-serif !important;
              }
              
              html, body { 
                background: white !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                min-height: auto !important;
              }
              
              body {
                background-image: none !important;
              }
              
              header, .range-actions, button, input, label { 
                display: none !important;
                height: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              
              .container {
                max-width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              
              .bg-white, .bg-gradient-to-br {
                background: white !important;
                background-image: none !important;
                box-shadow: none !important;
                border: none !important;
                border-radius: 0 !important;
                page-break-inside: avoid;
                margin: 0 !important;
                padding: 0 !important;
              }
              
              .bg-white:first-of-type {
                margin-top: 0 !important;
                padding-top: 0 !important;
              }
              
              h3 {
                page-break-after: avoid;
                font-size: 14px !important;
                margin: 3mm 0 2mm 0 !important;
                padding-bottom: 1.5mm !important;
                font-weight: 900 !important;
                color: #000 !important;
                border-bottom: 2px solid #000 !important;
              }
              
              table { 
                page-break-inside: auto;
                width: 100% !important;
                border-collapse: collapse !important;
                font-size: 11px !important;
                border: 2px solid #000 !important;
                margin: 0 !important;
              }
              
              th, td {
                padding: 2mm 1.5mm !important;
                border: 1px solid #000 !important;
                font-size: 11px !important;
              }
              
              thead th {
                background: #f3f4f6 !important;
                font-weight: 900 !important;
                color: #000 !important;
                border: 1px solid #000 !important;
              }
              
              tfoot th {
                background: #dbeafe !important;
                font-weight: 900 !important;
                border-top: 2px solid #000 !important;
              }
              
              tbody tr { 
                page-break-inside: avoid;
              }
              
              .overflow-x-auto { 
                overflow: visible !important; 
              }
              
              #range {
                display: block !important;
                text-align: center !important;
                font-size: 11px !important;
                margin: 0 0 3mm 0 !important;
                padding: 0 !important;
                font-weight: 700 !important;
                color: #000 !important;
              }
              
              body::before {
                content: 'تقرير الفواتير غير المدفوعة';
                display: block;
                text-align: center;
                font-size: 16px !important;
                font-weight: 900 !important;
                margin: 0 0 2mm 0 !important;
                padding: 0 0 1.5mm 0 !important;
                border-bottom: 3px solid #000 !important;
                color: #000 !important;
              }
            }
          </style>
        `;
        
        htmlContent = htmlContent.replace('</head>', pdfStyle + '</head>');
        htmlContent = '<!doctype html>' + htmlContent;
        
        await window.api.pdf_export(htmlContent, { saveMode:'auto', filename: title, pageSize:'A4' });
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
          const sumGrand = document.getElementById('sumGrand')?.textContent || '0.00';
          const sumCount = document.getElementById('sumCount')?.textContent || '0';
          lines.push('');
          lines.push([esc('عدد الفواتير'), esc(sumCount), esc('إجمالي المبالغ'), esc(sumGrand)].join(','));
        }
        const period = (rangeEl && rangeEl.textContent) ? rangeEl.textContent.replace(/[^0-9_\-–: ]+/g,'').replace(/\s+/g,' ').trim() : '';
        const filename = `unpaid-invoices-${(period||'').replace(/[: ]/g,'_')||Date.now()}.csv`;
        await window.api.csv_export(lines.join('\n'), { saveMode:'auto', filename });
      }catch(e){ console.error(e); alert('تعذر إنشاء Excel'); }
      finally{ exporting = false; btnExcel.disabled = false; }
    });
  }
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