// Credit invoices report: show unpaid credit invoices within a date range

// Language system
const __langKey = 'app_lang';
let __currentLang = {};
function __applyLang(lang){
  const base = (typeof lang==='string' ? lang.split('-')[0].toLowerCase() : 'ar');
  const isAr = (base==='ar');
  const t = {
    creditInvoices: isAr ? 'الإشعارات الدائنة' : 'Credit Notes',
    systemTitle: isAr ? 'نظام إدارة المطاعم' : 'Restaurant Management System',
    back: isAr ? 'رجوع' : 'Back',
    from: isAr ? 'من' : 'From',
    to: isAr ? 'إلى' : 'To',
    apply: isAr ? 'تطبيق' : 'Apply',
    exportPDF: isAr ? 'تصدير PDF' : 'Export PDF',
    exportExcel: isAr ? 'تصدير Excel' : 'Export Excel',
    creditNoteNo: isAr ? 'رقم الإشعار' : 'CN No.',
    customer: isAr ? 'العميل' : 'Customer',
    date: isAr ? 'التاريخ' : 'Date',
    amount: isAr ? 'المبلغ' : 'Amount',
    baseInvoice: isAr ? 'الفاتورة الأساسية' : 'Base Invoice',
    view: isAr ? 'عرض' : 'View',
    totals: isAr ? 'الإجماليات' : 'Totals',
    count: isAr ? 'العدد' : 'Count',
  };
  
  __currentLang = t;
  
  document.documentElement.lang = isAr ? 'ar' : 'en';
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  
  document.title = t.creditInvoices;
  const pageTitle = document.querySelector('.text-3xl');
  if(pageTitle) pageTitle.textContent = t.creditInvoices;
  
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
    tableHeaders[0].textContent = t.creditNoteNo;
    tableHeaders[1].textContent = t.customer;
    tableHeaders[2].textContent = t.date;
    tableHeaders[3].textContent = t.amount;
    tableHeaders[4].textContent = t.baseInvoice;
    tableHeaders[5].textContent = t.view;
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
    const res = await window.api.sales_list_credit_notes({ date_from: startStr, date_to: adjustedEndStr, limit: 10000 });
    let items = (res && res.ok) ? (res.items||[]) : [];
    // Fallback: use generic sales_list(type=credit) if new endpoint not available or returns empty
    if((!res || !res.ok) || items.length === 0){
      try{
        const res2 = await window.api.sales_list({ type: 'credit', date_from: startStr, date_to: adjustedEndStr, limit: 10000 });
        if(res2 && res2.ok){ items = (res2.items||[]).filter(x => String(x.doc_type||'')==='credit_note' || String(x.invoice_no||'').startsWith('CN-')); }
      }catch(_){ /* ignore */ }
    }

    const invTbody = document.getElementById('invTbody');
    let sumGrand = 0;

    const rows = items.map(s=>{
      // Show CN date and link base invoice
      let cnDate = s.created_at ? new Date(s.created_at) : null;
      if(!cnDate || isNaN(cnDate.getTime())){ try{ cnDate = new Date(String(s.created_at||'').replace(' ', 'T')); }catch(_){ cnDate = new Date(); } }
      const cnDatePart = new Intl.DateTimeFormat('en-GB-u-ca-gregory', {year:'numeric', month:'2-digit', day:'2-digit'}).format(cnDate);
      const cnTimePart = new Intl.DateTimeFormat('en-GB-u-ca-gregory', {hour:'2-digit', minute:'2-digit', hour12:true}).format(cnDate);
      const custPhone = s.customer_phone || s.disp_customer_phone || '';
      const cust = custPhone || (s.customer_name || s.disp_customer_name || '');
      const cnAmount = Number(s.grand_total||0);
      sumGrand += cnAmount;
      const baseNo = s.base_invoice_no || s.ref_base_invoice_no || '';
      const baseLink = s.base_id ? `<button class="btn" data-view-base="${s.base_id}">${baseNo||'عرض'}</button>` : (baseNo||'');
      const viewCN = `<button class="btn" data-view-cn="${s.id}">عرض الإشعار</button>`;
      return `<tr>
        <td>${s.invoice_no||''}</td>
        <td dir="ltr" style="text-align:left">${cust}</td>
        <td>${cnDatePart}<br>${cnTimePart}</td>
        <td>${fmt(cnAmount)}</td>
        <td>${baseLink}</td>
        <td>${viewCN}</td>
      </tr>`;
    }).join('');

    if(invTbody){ invTbody.innerHTML = rows || '<tr><td colspan="6" class="muted">لا توجد إشعارات دائن ضمن الفترة</td></tr>'; }
    const set = (id, v)=>{ const el = document.getElementById(id); if(!el) return; el.textContent = (id==='sumCount') ? String(v) : fmt(v); };
    set('sumGrand', sumGrand); set('sumCount', items.length||0);

    // open print view
    try{
      // View CN
      document.querySelectorAll('button[data-view-cn]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = Number(btn.getAttribute('data-view-cn'));
          const page = '../sales/print.html';
          const w = 500, h = 700;
          const url = `${page}?id=${encodeURIComponent(String(id))}&pay=refund&preview=1`;
          window.open(url, 'PRINT_VIEW', `width=${w},height=${h}`);
        });
      });
      // View base invoice
      document.querySelectorAll('button[data-view-base]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = Number(btn.getAttribute('data-view-base'));
          const page = '../sales/print.html';
          const w = 500, h = 700;
          const url = `${page}?id=${encodeURIComponent(String(id))}&preview=1`;
          window.open(url, 'PRINT_VIEW', `width=${w},height=${h}`);
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
        const title = `credit-invoices-${safe||Date.now()}.pdf`;
        
        const clone = document.documentElement.cloneNode(true);
        
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
            
            let headerHTML = '<h1 style="font-size: 28px; font-weight: 900; color: #1f2937; margin-bottom: 8px; font-family: Cairo, sans-serif;">تقرير الفواتير الدائنة</h1>';
            
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
          const sumGrand = document.getElementById('sumGrand')?.textContent || '0.00';
          const sumCount = document.getElementById('sumCount')?.textContent || '0';
          lines.push('');
          lines.push([esc('عدد الفواتير'), esc(sumCount), esc('إجمالي المبالغ'), esc(sumGrand)].join(','));
        }
        const period = (rangeEl && rangeEl.textContent) ? rangeEl.textContent.replace(/[^0-9_\-–: ]+/g,'').replace(/\s+/g,' ').trim() : '';
        const filename = `credit-invoices-${(period||'').replace(/[: ]/g,'_')||Date.now()}.csv`;
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
        // Ensure settings-based margins are applied before snapshot
        try{ if(window.applyPrintMarginsFromSettings) await window.applyPrintMarginsFromSettings(); }catch(_){ }
        // Prepare a clean HTML snapshot (remove export buttons/toolbars)
        const clone = document.documentElement.cloneNode(true);
        // Remove toolbar actions and range inputs from print version
        try{
          const toolbar = clone.querySelector('.range-actions');
          if(toolbar){ toolbar.parentNode.removeChild(toolbar); }
          const rangeInputs = clone.querySelector('.range-inputs');
          if(rangeInputs){ rangeInputs.parentNode.removeChild(rangeInputs); }
          const hdr = clone.querySelector('header');
          if(hdr && hdr.parentNode){ hdr.parentNode.removeChild(hdr); }
        }catch(_){ }
        // Remove non-print action columns ("عرض") to save width for content
        try{
          const removeLastTwoCols = (tbodyId) => {
            const tb = clone.getElementById(tbodyId);
            if(!tb) return;
            const table = tb.closest('table');
            if(!table) return;
            const headRow = table.querySelector('thead tr');
            if(headRow && headRow.lastElementChild){ 
              headRow.removeChild(headRow.lastElementChild); // Remove view CN column
              if(headRow.lastElementChild){ headRow.removeChild(headRow.lastElementChild); } // Remove base invoice column
            }
            Array.from(tb.querySelectorAll('tr')).forEach(tr => {
              try{ 
                if(tr.lastElementChild) tr.removeChild(tr.lastElementChild);
                if(tr.lastElementChild) tr.removeChild(tr.lastElementChild);
              }catch(_){ }
            });
          };
          removeLastTwoCols('invTbody');
        }catch(_){ }

        // Add print styles for 80mm width
        const style = document.createElement('style');
        style.textContent = `
          @page { margin: 0; }
          html{ width:100%; margin:0; padding:0; }
          body{ width:80mm; max-width:80mm; margin:0 auto; padding:0; box-sizing: border-box; padding-left: var(--m-left); padding-right: var(--m-right); font-family: 'Cairo', sans-serif !important; font-weight: 900 !important; color: #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          *{ box-sizing: border-box; font-family: 'Cairo', sans-serif !important; font-weight: 900 !important; color: #000 !important; }
          body, .container, .section:first-child{ margin-top:0 !important; padding-top:0 !important; }
          .container{ width:100%; max-width:100%; margin:0; padding-left: 0; padding-right: 0; padding-top:0; padding-bottom:4px; overflow:hidden; }
          .container > *:first-child{ margin-top:0 !important; }
          .range-bar{ margin-top:0 !important; }
          #range{ display:block !important; margin:8px 0 !important; font-size:11px !important; font-weight:bold !important; }
          div[style*="overflow:auto"]{ overflow: visible !important; }
          table{ width:100%; max-width:100%; border-collapse:collapse; table-layout: auto; font-size:9.5px; line-height:1.2; }
          th,td{ padding:2px; word-break: normal; overflow-wrap: normal; white-space: normal; }
          th{ background:#eef2ff; color:#0b3daa; border-bottom:2px solid #000; font-size:8.5px; }
          .section{ margin:5px 0; padding:5px; border:1px solid #e5e7eb; }

          /* Full grid borders */
          table{ border:2px solid #000; }
          table th, table td{ border:1px solid #000; }
          table tfoot th{ border-top:2px solid #000; }
          
          /* Fit phone and date to content */
          table th:nth-child(2), table td:nth-child(2){ width:auto; white-space:nowrap; direction:ltr; text-align:left; }
          table th:nth-child(3), table td:nth-child(3){ width:auto; white-space:nowrap; font-size:8.5px; }
        `;
        clone.querySelector('head')?.appendChild(style);
        
        // Ensure period info is visible and properly formatted in print
        try{
          const r = clone.getElementById('range');
          if(r && r.textContent && r.textContent.trim()){
            const text = r.textContent.trim();
            const m = text.match(/الفترة:\s*(.+?)\s*[—–-]\s*(.+)$/);
            if(m){
              r.innerHTML = `الفترة:<br>من: ${m[1].trim()}<br>إلى: ${m[2].trim()}`;
            } else {
              r.innerHTML = text;
            }
            r.style.display = 'block';
            r.style.marginBottom = '10px';
            r.style.fontSize = '11px';
            r.style.fontWeight = 'bold';
          }
        }catch(e){ console.error('Range processing error:', e); }

        const html = '<!doctype html>' + clone.outerHTML;
        await window.api.print_html(html, {
          silent: true,
          pageSize: { width: 80000, height: 297000 },
          margins: { marginType: 'none' },
          printBackground: true,
        });
      }catch(e){ console.error(e); alert('تعذر الطباعة'); }
      finally{ btnPrint.disabled = false; }
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