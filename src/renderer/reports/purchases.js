// Purchases report: select range and list purchases with totals

// Language system
const __langKey = 'app_lang';
let __currentLang = {};
function __applyLang(lang){
  const base = (typeof lang==='string' ? lang.split('-')[0].toLowerCase() : 'ar');
  const isAr = (base==='ar');
  const t = {
    purchasesReport: isAr ? 'تقرير المشتريات' : 'Purchases Report',
    systemTitle: isAr ? 'نظام إدارة المطاعم' : 'Restaurant Management System',
    back: isAr ? 'رجوع' : 'Back',
    from: isAr ? 'من' : 'From',
    to: isAr ? 'إلى' : 'To',
    apply: isAr ? 'تطبيق' : 'Apply',
    exportPDF: isAr ? 'تصدير PDF' : 'Export PDF',
    exportExcel: isAr ? 'تصدير Excel' : 'Export Excel',
    purchaseName: isAr ? 'اسم المشتريات' : 'Purchase Name',
    date: isAr ? 'التاريخ' : 'Date',
    total: isAr ? 'الإجمالي' : 'Total',
    notes: isAr ? 'ملاحظات' : 'Notes',
    totals: isAr ? 'الإجماليات' : 'Totals',
    count: isAr ? 'العدد' : 'Count',
  };
  
  __currentLang = t;
  
  document.documentElement.lang = isAr ? 'ar' : 'en';
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  
  document.title = t.purchasesReport;
  const pageTitle = document.querySelector('.text-3xl');
  if(pageTitle) pageTitle.textContent = t.purchasesReport;
  
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
  if(tableHeaders.length >= 4){
    tableHeaders[0].textContent = t.purchaseName;
    tableHeaders[1].textContent = t.date;
    tableHeaders[2].textContent = t.total;
    tableHeaders[3].textContent = t.notes;
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

(function attachExportHandlers(){
  let exporting = false;
  const btnPdf = document.getElementById('exportPdfBtn');
  if(btnPdf){
    btnPdf.addEventListener('click', async () => {
      if(exporting) return; exporting = true; btnPdf.disabled = true;
      try{
        // حفظ معلومات الفترة
        let periodFromText = '';
        let periodToText = '';
        try{
          const fromInput = document.getElementById('fromAt');
          const toInput = document.getElementById('toAt');
          
          if(fromInput && fromInput.value){
            periodFromText = fromInput.value.replace('T', ' ');
          }
          if(toInput && toInput.value){
            periodToText = toInput.value.replace('T', ' ');
          }
        }catch(_){}
        
        const period = (rangeEl && rangeEl.textContent) ? rangeEl.textContent.replace(/[^0-9_\-–: ]+/g,'').replace(/\s+/g,' ').trim() : '';
        const safe = (period||'').replace(/[: ]/g,'_');
        const title = `purchases-report-${safe||Date.now()}.pdf`;
        
        // Build clone
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
            // إزالة div الفلاتر والأزرار
            const firstChild = container.firstElementChild;
            if(firstChild){
              firstChild.remove();
            }
            
            // إنشاء عنصر div جديد
            const tempDiv = document.createElement('div');
            tempDiv.style.cssText = 'text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 4px solid #2563eb;';
            
            let headerHTML = '<h1 style="font-size: 28px; font-weight: 900; color: #1f2937; margin-bottom: 8px; font-family: Cairo, sans-serif;">تقرير المشتريات</h1>';
            
            if(periodFromText && periodToText){
              headerHTML += '<div style="font-size: 16px; font-weight: 700; color: #4b5563; margin-top: 12px; font-family: Cairo, sans-serif;">';
              headerHTML += `<div style="margin: 4px 0;">من: ${periodFromText}</div>`;
              headerHTML += `<div style="margin: 4px 0;">إلى: ${periodToText}</div>`;
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
              color: #1f2937 !important;
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
        addTable('المشتريات ضمن الفترة', document.querySelector('table tbody#purTbody')?.closest('table'));
        const csv = lines.join('\n');
        const period = (rangeEl && rangeEl.textContent) ? rangeEl.textContent.replace(/[^0-9_\-–: ]+/g,'').replace(/\s+/g,' ').trim() : '';
        const filename = `purchases-report-${(period||'').replace(/[: ]/g,'_')||Date.now()}.csv`;
        await window.api.csv_export(csv, { saveMode:'auto', filename });
      }catch(e){ console.error(e); alert('تعذر إنشاء Excel'); }
      finally{ exporting = false; btnExcel.disabled = false; }
    });
  }
})();

function toStr(d){
  const pad2 = (v)=> String(v).padStart(2,'0');
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:00`;
}

function fromInputToStr(input){
  const v = (input?.value||'').trim();
  if(!v) return '';
  return v.replace('T',' ') + ':00';
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
    
    if(rangeEl){ rangeEl.textContent = `الفترة: ${startStr} — ${endStr}`; }

    const res = await window.api.purchases_list({ from_at: startStr, to_at: adjustedEndStr });
    const items = (res && res.ok) ? (res.items||[]) : [];

    const purTbody = document.getElementById('purTbody');
    let sumCount = 0, sumPre = 0, sumVat = 0, sumAfter = 0;
    const labelPayment = (m)=>{ const x=String(m||'').toLowerCase(); if(x==='network' || x==='card') return 'شبكة'; return 'نقدًا'; };
    const rows = items.map(p => {
      sumCount += 1;
      const pre = Number(p.sub_total||0);
      const vat = Number(p.vat_total||0);
      const after = Number(p.grand_total||0);
      sumPre += pre; sumVat += vat; sumAfter += after;
      const dateStr = p.purchase_at ? new Date(p.purchase_at) : (p.created_at? new Date(p.created_at): null);
      const dateOut = dateStr ? new Intl.DateTimeFormat('en-GB-u-ca-gregory', {year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:true}).format(dateStr) : (p.purchase_date||'');
      const pay = labelPayment(p.payment_method||'');
      return `<tr><td>${p.title||p.name||''}</td><td class="num">${dateOut}</td><td>${pay}</td><td class="num">${fmt(pre)}</td><td class="num">${fmt(vat)}</td><td class="num">${fmt(after)}</td><td>${p.notes||''}</td></tr>`;
    }).join('');
    if(purTbody){ purTbody.innerHTML = rows || '<tr><td colspan="7" class="muted">لا توجد مشتريات ضمن الفترة</td></tr>'; }

    const set = (id,val)=>{ const el=document.getElementById(id); if(el){ el.textContent = (id==='sumCount') ? String(val) : fmt(val); } };
    set('sumCount', sumCount); set('sumPre', sumPre); set('sumVat', sumVat); set('sumAfter', sumAfter);
  }catch(e){ console.error(e); }
}

function initDefaultRange(){
  const now = new Date();
  const start = new Date(now); start.setHours(0,0,0,0);
  const end = now;
  const s = toStr(start), e = toStr(end);
  if(fromAtEl) fromAtEl.value = s.replace(' ', 'T').slice(0,16);
  if(toAtEl) toAtEl.value = e.replace(' ', 'T').slice(0,16);
  loadRange(s, e);
}

(function wireRange(){
  const btn = document.getElementById('applyRangeBtn');
  if(btn){
    btn.addEventListener('click', () => {
      const s = fromInputToStr(fromAtEl);
      const e = fromInputToStr(toAtEl);
      if(!s || !e){ alert('يرجى تحديد الفترة (من وإلى)'); return; }
      loadRange(s, e);
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