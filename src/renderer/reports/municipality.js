// Municipality report: list invoices within range that have tobacco fee > 0 (or < 0 for CN) and allow export

// Language system
const __langKey = 'app_lang';
let __currentLang = {};
function __applyLang(lang){
  const base = (typeof lang==='string' ? lang.split('-')[0].toLowerCase() : 'ar');
  const isAr = (base==='ar');
  const t = {
    municipalityReport: isAr ? 'تقرير البلدية' : 'Municipality Report',
    systemTitle: isAr ? 'نظام إدارة المطاعم' : 'Restaurant Management System',
    back: isAr ? 'رجوع' : 'Back',
    from: isAr ? 'من' : 'From',
    to: isAr ? 'إلى' : 'To',
    apply: isAr ? 'تطبيق' : 'Apply',
    exportPDF: isAr ? 'تصدير PDF' : 'Export PDF',
    exportExcel: isAr ? 'تصدير Excel' : 'Export Excel',
    print: isAr ? 'طباعة' : 'Print',
    number: isAr ? 'رقم' : 'No.',
    docType: isAr ? 'نوع المستند' : 'Doc. Type',
    customer: isAr ? 'العميل' : 'Customer',
    date: isAr ? 'التاريخ' : 'Date',
    tobaccoFee: isAr ? 'رسوم التبغ' : 'Tobacco Fee',
    total: isAr ? 'الإجمالي' : 'Total',
    view: isAr ? 'عرض' : 'View',
    totals: isAr ? 'الإجماليات' : 'Totals',
    count: isAr ? 'العدد' : 'Count',
    invoice: isAr ? 'فاتورة' : 'Invoice',
    creditNote: isAr ? 'إشعار دائن' : 'Credit Note',
  };
  
  __currentLang = t;
  
  document.documentElement.lang = isAr ? 'ar' : 'en';
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  
  document.title = t.municipalityReport;
  const pageTitle = document.querySelector('.text-3xl');
  if(pageTitle) pageTitle.textContent = t.municipalityReport;
  
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
  
  const tableHeaders = document.querySelectorAll('table thead th');
  if(tableHeaders.length >= 7){
    tableHeaders[0].textContent = t.number;
    tableHeaders[1].textContent = t.docType;
    tableHeaders[2].textContent = t.customer;
    tableHeaders[3].textContent = t.date;
    tableHeaders[4].textContent = t.tobaccoFee;
    tableHeaders[5].textContent = t.total;
    tableHeaders[6].textContent = t.view;
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

// Load and render company banner from settings
async function loadCompanyBanner(){
  try{
    const r = await window.api.settings_get();
    if(!r || !r.ok) return;
    const s = r.item || {};
    const banner = document.getElementById('companyBanner');
    if(!banner) return;
    const nameEl = document.getElementById('companyName');
    const mobEl = document.getElementById('companyMobile');
    const addrEl = document.getElementById('companyAddress');
    const vatEl = document.getElementById('companyVat');
    const logoEl = document.getElementById('companyLogo');
    if(nameEl) nameEl.textContent = s.seller_legal_name || '';
    if(mobEl) mobEl.textContent = s.mobile || '';
    if(addrEl) addrEl.textContent = s.company_location || '';
    if(vatEl) vatEl.textContent = s.seller_vat_number || '';
    if(s.logo_path && logoEl){
      try{
        const rr = await window.api.resolve_path(s.logo_path);
        if(rr && rr.ok && rr.abs){ logoEl.src = 'file://'+rr.abs; logoEl.style.display=''; }
      }catch(_){ }
    }
    // Do not force show on screen; CSS will show it on print only
  }catch(_){ /* ignore */ }
}

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
          if(fromInput && fromInput.value) periodFromText = fromInput.value.replace('T', ' ');
          if(toInput && toInput.value) periodToText = toInput.value.replace('T', ' ');
        }catch(_){}

        const period = (rangeEl && rangeEl.textContent) ? rangeEl.textContent.replace(/[^0-9_\-–: ]+/g,'').replace(/\s+/g,' ').trim() : '';
        const safe = (period||'').replace(/[: ]/g,'_');
        const title = `municipality-${safe||Date.now()}.pdf`;

        // Build clone and ensure all collapsible sections are expanded for PDF
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
          const removeElements = clone.querySelectorAll('header, button, select, input, label, .range-actions');
          removeElements.forEach(el => {
            try{ el.remove(); }catch(_){}
          });
          // Remove the filter container (the one with inputs)
          const container = clone.querySelector('.container');
          if(container){
             const divs = container.querySelectorAll(':scope > div.bg-white');
             if(divs.length > 0) divs[0].remove(); 
          }
        }catch(_){ }

        // إضافة عنوان ومعلومات الفترة
        try{
          const container = clone.querySelector('.container');
          if(container){
            const tempDiv = document.createElement('div');
            tempDiv.style.cssText = 'text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 4px solid #2563eb;';
            
            let headerHTML = '<h1 style="font-size: 28px; font-weight: 900; color: #1f2937; margin-bottom: 8px; font-family: Cairo, sans-serif;">تقرير البلدية</h1>';
            headerHTML += '<p style="font-size: 14px; color: #6b7280; font-weight: 600; margin-bottom: 8px;">فواتير تحتوي رسوم تبغ</p>';
            
            if(periodFromText && periodToText){
              headerHTML += '<div style="font-size: 16px; font-weight: 700; color: #4b5563; margin-top: 12px; font-family: Cairo, sans-serif;">';
              headerHTML += `<div style="margin: 4px 0;">من: ${periodFromText}</div>`;
              headerHTML += `<div style="margin: 4px 0;">إلى: ${periodToText}</div>`;
              headerHTML += '</div>';
            }
            
            tempDiv.innerHTML = headerHTML;
            const banner = container.querySelector('#companyBanner');
            if(banner){
                banner.insertAdjacentElement('afterend', tempDiv);
            } else {
                container.insertBefore(tempDiv, container.firstChild);
            }
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
              border: none !important;
            }
            
            .overflow-x-auto {
              overflow: visible !important;
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
            
            h1, h2, h3, h4 {
              page-break-after: avoid !important;
            }
            
            .detail-card {
                border: 1px solid #cbd5e1 !important;
                margin: 8px 0 !important;
                padding: 8px !important;
                border-radius: 4px !important;
            }
            
            .inv-summary {
                background: #f1f5f9 !important;
                border: 1px solid #cbd5e1 !important;
                margin-bottom: 8px !important;
            }
          }
        `;
        clone.querySelector('head')?.appendChild(style);

        await window.api.pdf_export(clone.outerHTML, { saveMode:'auto', filename: title, pageSize:'A4', printBackground: true, marginsType: 0, landscape: false });
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
        
        // Header: company info (similar to PDF banner)
        try{
          const st = await window.api.settings_get();
          if(st && st.ok){
            const s = st.item || {};
            const companyLine = [
              esc(s.seller_legal_name||''),
              esc(s.company_location||''),
              esc(s.mobile||''),
              esc(s.seller_vat_number||'')
            ].join(',');
            if(companyLine.replace(/,/g,'').trim()){ lines.push(companyLine); lines.push(''); }
          }
        }catch(_){ }

        // Period line
        if(rangeEl && rangeEl.textContent){ lines.push(esc('الفترة')+','+esc(rangeEl.textContent.trim())); lines.push(''); }

        // Table header
        lines.push([
          esc('رقم الفاتورة'), esc('طريقة الدفع'), esc('المجموع'), esc('الخصم'), esc('الضريبة'), esc('رسوم التبغ'), esc('الإجمالي'), esc('تاريخ الدفع')
        ].join(','));

        // For each invoice, add a summary row + a block of details rows
        const detailHeaders = [esc('اسم الصنف'), esc('العملية'), esc('النوع الرئيسي'), esc('الكمية'), esc('سعر الوحدة'), esc('الإجمالي')].join(',');
        const blocks = document.querySelectorAll('.detail-card');
        blocks.forEach(block => {
          const invSummary = block.querySelector('.inv-summary');
          const cells = invSummary ? Array.from(invSummary.querySelectorAll('div > div:last-child')).map(el=>esc(el.textContent.trim())) : [];
          // Expecting columns order to match the visual layout
          if(cells.length >= 8){ lines.push(cells.slice(0,8).join(',')); }
          // Details header
          lines.push(detailHeaders);
          // Details rows
          const rows = block.querySelectorAll('.item-details tbody tr');
          rows.forEach(tr => {
            const tds = Array.from(tr.querySelectorAll('td')).map(td=>esc(td.textContent.trim()));
            if(tds.length) lines.push(tds.join(','));
          });
          lines.push('');
        });

        // Footer totals similar to PDF
        const sumTobInv = document.getElementById('sumTobInv')?.textContent || '0.00';
        const sumVatInv = document.getElementById('sumVatInv')?.textContent || '0.00';
        const sumGrandInv = document.getElementById('sumGrandInv')?.textContent || '0.00';
        const sumCountInv = document.getElementById('sumCountInv')?.textContent || '0';
        const sumTobCN = document.getElementById('sumTobCN')?.textContent || '0.00';
        const sumVatCN = document.getElementById('sumVatCN')?.textContent || '0.00';
        const sumGrandCN = document.getElementById('sumGrandCN')?.textContent || '0.00';
        const sumCountCN = document.getElementById('sumCountCN')?.textContent || '0';
        const sumTob = document.getElementById('sumTob')?.textContent || '0.00';
        const sumVat = document.getElementById('sumVat')?.textContent || '0.00';
        const sumGrand = document.getElementById('sumGrand')?.textContent || '0.00';
        const sumCount = document.getElementById('sumCount')?.textContent || '0';

        lines.push(esc('إجمالي الفواتير'));
        lines.push([esc(''), esc(''), esc(''), esc(''), esc(sumVatInv), esc(sumTobInv), esc(sumGrandInv), esc(sumCountInv)].join(','));
        lines.push(esc('إجمالي إشعارات الدائن'));
        lines.push([esc(''), esc(''), esc(''), esc(''), esc(sumVatCN), esc(sumTobCN), esc(sumGrandCN), esc(sumCountCN)].join(','));
        lines.push(esc('الصافي'));
        lines.push([esc(''), esc(''), esc(''), esc(''), esc(sumVat), esc(sumTob), esc(sumGrand), esc(sumCount)].join(','));

        const csv = lines.join('\n');
        const period = (rangeEl && rangeEl.textContent) ? rangeEl.textContent.replace(/[^0-9_\-–: ]+/g,'').replace(/\s+/g,' ').trim() : '';
        const filename = `municipality-${(period||'').replace(/[: ]/g,'_')||Date.now()}.csv`;
        await window.api.csv_export(csv, { saveMode:'auto', filename });
      }catch(e){ console.error(e); alert('تعذر إنشاء Excel'); }
      finally{ exporting = false; btnExcel.disabled = false; }
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
  try{
    const excludeCn = document.getElementById('excludeCn');
    const excludeCnVal = excludeCn && excludeCn.checked;
    
    // Use optimized endpoint
    const res = await window.api.sales_municipality_report({ 
        date_from: startStr, 
        date_to: adjustedEndStr,
        limit: 50000,
        exclude_cn: excludeCnVal
    });
    
    const invoices = (res && res.ok) ? (res.invoices||[]) : [];
    const allItems = (res && res.ok) ? (res.items||[]) : [];
    
    // Group items by sale_id for easy access
    const itemsBySale = new Map();
    allItems.forEach(it => {
        const sid = it.sale_id;
        const arr = itemsBySale.get(sid) || [];
        arr.push(it);
        itemsBySale.set(sid, arr);
    });

    const invTbody = document.getElementById('invTbody');

    let sumSub = 0, sumDisc = 0, sumVat = 0, sumTob = 0, sumGrand = 0;
    let sumSubInv = 0, sumDiscInv = 0, sumVatInv = 0, sumTobInv = 0, sumGrandInv = 0, cntInv = 0;
    let sumSubCN = 0, sumDiscCN = 0, sumVatCN = 0, sumTobCN = 0, sumGrandCN = 0, cntCN = 0;

    const rows = invoices.map(s => {
      const isCN = (String(s.doc_type||'') === 'credit_note' || String(s.invoice_no||'').startsWith('CN-'));
      let created = s.settled_at || s.created_at; // تاريخ الدفع إن وجد وإلا تاريخ الإنشاء
      created = created ? new Date(created) : null;
      if(!created || isNaN(created.getTime())){ try{ created = new Date(String(created||s.created_at).replace(' ', 'T')); }catch(_){ created = new Date(); } }
      const dateStr = new Intl.DateTimeFormat('en-GB-u-ca-gregory', {year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:true}).format(created);
      const sub = Math.abs(Number(s.sub_total||0));
      const disc = Math.abs(Number(s.discount_amount||0));
      const vat = Math.abs(Number(s.vat_total||0));
      const tob = Math.abs(Number(s.tobacco_fee||0));
      const grand = Math.abs(Number(s.grand_total||0));
      if(isCN){ sumSubCN += sub; sumDiscCN += disc; sumVatCN += vat; sumTobCN += tob; sumGrandCN += grand; cntCN++; }
      else { sumSubInv += sub; sumDiscInv += disc; sumVatInv += vat; sumTobInv += tob; sumGrandInv += grand; cntInv++; }
      sumSub += sub * (isCN ? -1 : 1);
      sumDisc += disc * (isCN ? -1 : 1);
      sumVat += vat * (isCN ? -1 : 1);
      sumTob += tob * (isCN ? -1 : 1);
      sumGrand += grand * (isCN ? -1 : 1);

      const pm = String(s.payment_method || '').toLowerCase();
      const payLabel = (function(method){
        const m = String(method||'').toLowerCase();
        if(m==='cash') return 'نقدًا';
        if(m==='card' || m==='network') return 'بطاقة';
        if(m==='credit') return 'آجل';
        if(m==='tamara') return 'تمارا';
        if(m==='tabby') return 'تابي';
        if(m==='mixed') return 'مختلط';
        return method||'';
      })(pm);
      const attrs = [`data-view="${s.id}"`, `data-type="${isCN?'credit':'invoice'}"`];
      const viewBtn = `<button class=\"btn\" ${attrs.join(' ')}>عرض</button>`;
      // Header box with invoice details
      const headerBox = `<div class=\"inv-summary\" style=\"margin-bottom:8px; padding:8px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:8px\">
        <div style=\"display:grid; grid-template-columns: repeat(8, minmax(0,1fr)); gap:8px; font-size:12px\">
          <div><div class=\"muted\">رقم الفاتورة</div><div>${s.invoice_no||''}</div></div>
          <div><div class=\"muted\">طريقة الدفع</div><div>${payLabel}</div></div>
          <div><div class=\"muted\">المجموع</div><div>${fmt(sub)}</div></div>
          <div><div class=\"muted\">الخصم</div><div>${fmt(disc)}</div></div>
          <div><div class=\"muted\">الضريبة</div><div>${fmt(vat)}</div></div>
          <div><div class=\"muted\">رسوم التبغ</div><div>${fmt(tob)}</div></div>
          <div><div class=\"muted\">الإجمالي</div><div>${fmt(grand)}</div></div>
          <div><div class=\"muted\">تاريخ الدفع</div><div>${dateStr}</div></div>
        </div>
        <div style=\"display:flex; gap:8px; margin-top:8px\">${viewBtn}</div>
      </div>`;
      
      // Build items table immediately since we have data
      const items = itemsBySale.get(s.id) || [];
      const html = [];
      html.push('<table style=\"width:100%; border-collapse:collapse\"><thead><tr>');
      html.push('<th style=\"text-align:right; padding:6px; border-bottom:1px solid #e2e8f0\">اسم الصنف</th>');
      html.push('<th style=\"text-align:right; padding:6px; border-bottom:1px solid #e2e8f0\">العملية</th>');
      html.push('<th style=\"text-align:right; padding:6px; border-bottom:1px solid #e2e8f0\">النوع الرئيسي</th>');
      html.push('<th style=\"text-align:center; padding:6px; border-bottom:1px solid #e2e8f0\">الكمية</th>');
      html.push('<th style=\"text-align:center; padding:6px; border-bottom:1px solid #e2e8f0\">سعر الوحدة</th>');
      html.push('<th style=\"text-align:left; padding:6px; border-bottom:1px solid #e2e8f0\">الإجمالي</th>');
      html.push('</tr></thead><tbody>');
      for(const it of items){
        const cat = it.category || '-';
        html.push(`<tr><td style=\"padding:6px; border-bottom:1px solid #f1f5f9\">${it.name||''}</td><td style=\"padding:6px; border-bottom:1px solid #f1f5f9\">${it.operation_name||''}</td><td style=\"padding:6px; border-bottom:1px solid #f1f5f9\">${cat}</td><td style=\"padding:6px; text-align:center; border-bottom:1px solid #f1f5f9\">${fmt(it.qty)}</td><td style=\"padding:6px; text-align:center; border-bottom:1px solid #f1f5f9\">${fmt(it.price)}</td><td style=\"padding:6px; text-align:left; border-bottom:1px solid #f1f5f9\">${fmt(it.line_total)}</td></tr>`);
      }
      html.push('</tbody></table>');
      
      // Always show details row (no toggle button)
      return `<tr><td colspan=\"10\"><div class=\"detail-card ${isCN?'credit':''}\">${headerBox}<div class=\"item-details\" data-sale=\"${s.id}\" data-loaded=\"1\">${html.join('')}</div></div></td></tr>`;
    }).join('');

    if(invTbody){ invTbody.innerHTML = rows || '<tr><td colspan=\"10\" class=\"muted\">لا توجد فواتير ضمن الفترة تحتوي رسوم تبغ</td></tr>'; }

    const set = (id, v)=>{ const el = document.getElementById(id); if(!el) return; el.textContent = (String(id).includes('Count') ? String(v) : fmt(v)); };
    set('sumSubInv', sumSubInv); set('sumDiscInv', sumDiscInv); set('sumVatInv', sumVatInv); set('sumTobInv', sumTobInv); set('sumGrandInv', sumGrandInv); set('sumCountInv', cntInv);
    set('sumSubCN', sumSubCN); set('sumDiscCN', sumDiscCN); set('sumVatCN', sumVatCN); set('sumTobCN', sumTobCN); set('sumGrandCN', sumGrandCN); set('sumCountCN', cntCN);
    set('sumSub', sumSub); set('sumDisc', sumDisc); set('sumVat', sumVat); set('sumTob', sumTob); set('sumGrand', sumGrand); set('sumCount', cntInv + cntCN);

    // Build tobacco items summary for the whole period
    try{
      // We can filter from allItems now instead of making another request
      // Assuming tobacco items are those with category 'تبغ' or similar, OR we rely on the fact that we only fetched invoices with tobacco fee.
      // But wait, an invoice might have tobacco and non-tobacco items.
      // The original code used `only_tobacco: true` which filters by `is_tobacco` flag or category in backend.
      // Since we don't have `is_tobacco` flag in `allItems` (we only selected category), we might need to rely on category name or fetch summary separately if strict accuracy is needed.
      // However, for performance, let's try to filter by category if possible, or just use the separate endpoint if it's fast enough (it's an aggregate query).
      // Actually, let's stick to the separate endpoint for summary to be safe about "what is tobacco", 
      // BUT we should optimize that endpoint too if it's slow. 
      // For now, let's keep the original call for summary but maybe it's fine since it's just one call, not N+1.
      
      const detRes = await window.api.sales_items_detailed({ date_from: startStr, date_to: endStr, only_tobacco: true });
      const det = (detRes && detRes.ok) ? (detRes.items||[]) : [];
      const byKey = new Map();
      det.forEach(it => {
        const key = `${it.name||''}||${it.operation_name||''}`;
        const prev = byKey.get(key) || { qty: 0, amount: 0, price: 0, priceCount: 0 };
        const price = Number(it.price||0);
        if(price){ prev.price += price; prev.priceCount += 1; }
        prev.qty += Number(it.qty||0);
        prev.amount += Number(it.line_total||0);
        byKey.set(key, prev);
      });
      const rows = Array.from(byKey.entries()).map(([key, v]) => {
        const [name, op] = key.split('||');
        const avgPrice = v.priceCount ? (v.price / v.priceCount) : (v.qty ? (v.amount / v.qty) : 0);
        return `<tr><td>${name}</td><td>${op}</td><td>${fmt(avgPrice)}</td><td>${fmt(v.qty)}</td><td class="right">${fmt(v.amount)}</td></tr>`;
      }).join('');
      const tbody = document.getElementById('tobaccoSummaryRows');
      if(tbody){ tbody.innerHTML = rows || '<tr><td colspan="5" class="muted" style="text-align:center">لا توجد أصناف تبغ ضمن الفترة</td></tr>'; }
    }catch(_){ const tbody = document.getElementById('tobaccoSummaryRows'); if(tbody){ tbody.innerHTML = '<tr><td colspan="5" class="muted" style="text-align:center">تعذر تحميل ملخص أصناف التبغ</td></tr>'; } }

    // wire view buttons to print window
    try{
      document.querySelectorAll('button[data-view]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = Number(btn.getAttribute('data-view'));
          const type = btn.getAttribute('data-type');
          const page = (type === 'credit') ? '../sales/print.html' : '../sales/print.html';
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
  const pad2 = (v)=> String(v).padStart(2,'0');
  const toLocal = (d)=> `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  if(fromAtEl) fromAtEl.value = toLocal(start);
  if(toAtEl) toAtEl.value = toLocal(now);
}

async function applyRange(){
  const s = fromInputToStr(fromAtEl);
  const e = fromInputToStr(toAtEl);
  if(!s || !e){ alert('يرجى تحديد الفترة كاملة'); return; }
  await loadRange(s, e);
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
// load banner
loadCompanyBanner();
// Do not auto-load report. User must click Apply.
// (async ()=>{ try{ await applyRange(); }catch(_){ } })();