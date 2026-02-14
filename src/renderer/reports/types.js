// Types report (by product category) with datetime range

// Language system
const __langKey = 'app_lang';
let __currentLang = {};
function __applyLang(lang){
  const base = (typeof lang==='string' ? lang.split('-')[0].toLowerCase() : 'ar');
  const isAr = (base==='ar');
  const t = {
    typesReport: isAr ? 'تقرير الأنواع' : 'Types Report',
    systemTitle: isAr ? 'نظام إدارة المطاعم' : 'Restaurant Management System',
    back: isAr ? 'رجوع' : 'Back',
    from: isAr ? 'من' : 'From',
    to: isAr ? 'إلى' : 'To',
    load: isAr ? 'تحميل' : 'Load',
    exportPDF: isAr ? 'تصدير PDF' : 'Export PDF',
    exportExcel: isAr ? 'تصدير Excel' : 'Export Excel',
    period: isAr ? 'الفترة' : 'Period',
    categorySummary: isAr ? 'ملخص حسب التصنيف' : 'Summary by Category',
    category: isAr ? 'التصنيف' : 'Category',
    itemsCount: isAr ? 'عدد الأصناف' : 'Items Count',
    quantity: isAr ? 'الكمية' : 'Quantity',
    total: isAr ? 'الإجمالي' : 'Total',
    totals: isAr ? 'الإجماليات' : 'Totals',
    categoryDetails: isAr ? 'تفاصيل التصنيفات' : 'Category Details',
    product: isAr ? 'المنتج' : 'Product',
    operation: isAr ? 'العملية' : 'Operation',
    price: isAr ? 'السعر' : 'Price',
    tobaccoDetails: isAr ? 'تفاصيل أصناف التبغ' : 'Tobacco Items Details',
    tobaccoSummary: isAr ? 'ملخص التبغ (حسب التصنيف والعملية)' : 'Tobacco Summary (by Category & Operation)',
    count: isAr ? 'العدد' : 'Count',
    date: isAr ? 'التاريخ' : 'Date',
    invoiceNo: isAr ? 'رقم الفاتورة' : 'Invoice No.',
    docType: isAr ? 'نوع المستند' : 'Doc. Type',
    invoice: isAr ? 'فاتورة' : 'Invoice',
    creditNote: isAr ? 'إشعار دائن' : 'Credit Note',
    uncategorized: isAr ? 'غير مصنف' : 'Uncategorized',
    noData: isAr ? 'لا توجد بيانات' : 'No data',
  };
  
  __currentLang = t;
  
  document.documentElement.lang = isAr ? 'ar' : 'en';
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  
  document.title = t.typesReport;
  const pageTitle = document.querySelector('.text-3xl');
  if(pageTitle) pageTitle.textContent = t.typesReport;
  
  const systemTitle = document.querySelector('.text-sm.text-gray-500');
  if(systemTitle) systemTitle.textContent = t.systemTitle;
  
  const btnBack = document.getElementById('btnBack');
  if(btnBack) btnBack.textContent = t.back;
  
  const fromLabel = document.querySelector('label[for="fromAt"]');
  if(fromLabel) fromLabel.textContent = t.from;
  
  const toLabel = document.querySelector('label[for="toAt"]');
  if(toLabel) toLabel.textContent = t.to;
  
  const loadBtn = document.getElementById('loadBtn');
  if(loadBtn) loadBtn.textContent = t.load;
  
  const exportPdfBtn = document.getElementById('exportPdfBtn');
  if(exportPdfBtn) exportPdfBtn.textContent = t.exportPDF;
  
  const exportExcelBtn = document.getElementById('exportExcelBtn');
  if(exportExcelBtn) exportExcelBtn.textContent = t.exportExcel;
  
  const h3Elements = document.querySelectorAll('h3');
  h3Elements.forEach(h3 => {
    const text = h3.textContent.trim();
    if(text.includes('ملخص حسب التصنيف')) h3.textContent = t.categorySummary;
    else if(text.includes('تفاصيل التصنيفات')) h3.textContent = t.categoryDetails;
    else if(text.includes('ملخص التبغ')) h3.textContent = t.tobaccoSummary;
    else if(text.includes('تفاصيل أصناف التبغ')) h3.textContent = t.tobaccoDetails;
  });
  
  const categorySummaryHeaders = document.querySelectorAll('table')[0]?.querySelectorAll('thead th');
  if(categorySummaryHeaders && categorySummaryHeaders.length >= 4){
    categorySummaryHeaders[0].textContent = t.category;
    categorySummaryHeaders[1].textContent = t.itemsCount;
    categorySummaryHeaders[2].textContent = t.quantity;
    categorySummaryHeaders[3].textContent = t.total;
  }
  
  const categorySummaryFoot = document.querySelectorAll('table')[0]?.querySelector('tfoot th:first-child');
  if(categorySummaryFoot) categorySummaryFoot.textContent = t.totals;
  
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

const btnBack = document.getElementById('btnBack');
if(btnBack){ btnBack.onclick = ()=>{ window.location.href = './index.html'; } }

const rangeEl = document.getElementById('range');
const fromAtEl = document.getElementById('fromAt');
const toAtEl = document.getElementById('toAt');
const loadBtn = document.getElementById('loadBtn');

function toStr(d){
  const pad2 = (v)=> String(v).padStart(2,'0');
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:00`;
}
function fromInputToStr(input){
  const v = (input?.value||'').trim();
  if(!v) return '';
  return v.replace('T', ' ') + ':00';
}
const fmt = (n)=> Number(n||0).toFixed(2);

// Format date/time in English (Gregorian) with Latin digits
function fmtDateEn(input){
  if(!input) return '';
  try{
    let d;
    if(typeof input === 'string'){
      // Accepts 'YYYY-MM-DD HH:mm:ss' or ISO
      const s = input.includes('T') ? input : input.replace(' ', 'T');
      d = new Date(s);
    } else {
      d = new Date(input);
    }
    // Example: 27/08/2025, 14:30
    return new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn', {
      year:'numeric', month:'2-digit', day:'2-digit',
      hour:'2-digit', minute:'2-digit', hour12:false
    }).format(d);
  }catch(_){ return String(input||'').toString(); }
}

async function loadRange(startStr, endStr){
  try{
    if(rangeEl){ rangeEl.textContent = `الفترة: ${fmtDateEn(startStr)} — ${fmtDateEn(endStr)}`; }
    // استخدم تجميعة عناصر البيع للحصول على الأصناف، ثم نجمع حسب التصنيف
    const sumRes = await window.api.sales_items_summary({ date_from: startStr, date_to: endStr });
    const items = (sumRes && sumRes.ok) ? (sumRes.items||[]) : [];
    // نحتاج جلب بيانات المنتجات لمعرفة التصنيف لكل product_id
    const prodsRes = await window.api.products_list({ limit: 0 });
    const products = (prodsRes && prodsRes.ok) ? (prodsRes.items||[]) : [];
    const byId = new Map(); products.forEach(p=> byId.set(Number(p.id), p));

    // تجميع حسب التصنيف (category). الأصناف بدون تصنيف تُجمع تحت "غير مصنف"
    const byCat = new Map();
    const byCatDetails = new Map();
    items.forEach(it => {
      const pid = Number(it.product_id||0);
      const prod = byId.get(pid);
      const cat = (prod && prod.category) ? String(prod.category) : 'غير مصنف';
      const prev = byCat.get(cat) || { itemsCount:0, qty:0, amount:0 };
      prev.itemsCount += 1;
      prev.qty += Number(it.qty_total||0);
      prev.amount += Number(it.amount_total||0);
      byCat.set(cat, prev);
      const arr = byCatDetails.get(cat) || [];
      arr.push({ name: it.name, qty: Number(it.qty_total||0), amount: Number(it.amount_total||0) });
      byCatDetails.set(cat, arr);
    });

    // عبئ الجدول ملخص التصنيفات
    const catTbody = document.getElementById('catTbody');
    let totalItems = 0, totalQty = 0, totalAmount = 0;
    const rows = Array.from(byCat.entries()).map(([cat, v]) => {
      totalItems += v.itemsCount;
      totalQty += v.qty;
      totalAmount += v.amount;
      return `<tr><td class="text-center">${cat}</td><td class="text-center num">${v.itemsCount}</td><td class="text-center num">${fmt(v.qty)}</td><td class="text-left num">${fmt(v.amount)}</td></tr>`;
    }).join('');
    if(catTbody){ catTbody.innerHTML = rows || '<tr><td colspan="4" class="text-center text-gray-500 py-4">لا توجد بيانات</td></tr>'; }
    
    // تحديث الإجماليات في tfoot
    const sumItemsEl = document.getElementById('sumItems');
    const sumQtyEl = document.getElementById('sumQty');
    const sumAmountEl = document.getElementById('sumAmount');
    if(sumItemsEl) sumItemsEl.textContent = totalItems;
    if(sumQtyEl) sumQtyEl.textContent = fmt(totalQty);
    if(sumAmountEl) sumAmountEl.textContent = fmt(totalAmount);

    // تفاصيل كل تصنيف: تفصيليًا مثل التبغ
    const detailsBox = document.getElementById('catDetails');
    if(detailsBox){
      detailsBox.innerHTML = '';
      // بيانات تفصيلية لكل الأصناف (ليست التبغ فقط)
      const detAllRes = await window.api.sales_items_detailed({ date_from: startStr, date_to: endStr });
      const detAll = (detAllRes && detAllRes.ok) ? (detAllRes.items||[]) : [];
      const byCatDet = new Map();
      detAll.forEach(it => {
        const cat = it.category || 'غير مصنف';
        const arr = byCatDet.get(cat) || [];
        arr.push(it);
        byCatDet.set(cat, arr);
      });
      Array.from(byCatDet.entries()).forEach(([cat, arr]) => {
        // Group by (product name, category, operation) and sum qty and amount
        const grouped = new Map();
        arr.forEach(it => {
          const key = `${it.name||''}||${it.category||''}||${it.operation_name||''}`;
          const prev = grouped.get(key) || { qty: 0, amount: 0 };
          prev.qty += Number(it.qty||0);
          prev.amount += Number(it.line_total||0);
          grouped.set(key, prev);
        });
        const tbody = Array.from(grouped.entries()).map(([key, v]) => {
          const [name, category, op] = key.split('||');
          const price = v.qty ? (v.amount / v.qty) : 0;
          return `<tr>
            <td class="text-center">${name}</td>
            <td class="text-center">${category}</td>
            <td class="text-center">${op}</td>
            <td class="text-center num">${fmt(v.qty)}</td>
            <td class="text-center num">${fmt(price)}</td>
            <td class="text-left num">${fmt(v.amount)}</td>
          </tr>`;
        }).join('');
        const table = document.createElement('div');
        table.innerHTML = `
          <h4 class="text-xl font-black text-gray-800 mb-3 pb-2 border-b-2 border-purple-500">${cat}</h4>
          <div class="overflow-x-auto mb-6">
            <table class="grid-table w-full">
              <thead>
                <tr>
                  <th class="bg-gradient-to-r from-slate-50 to-slate-100 text-blue-700 font-bold">المنتج</th>
                  <th class="bg-gradient-to-r from-slate-50 to-slate-100 text-blue-700 font-bold">التصنيف</th>
                  <th class="bg-gradient-to-r from-slate-50 to-slate-100 text-blue-700 font-bold">العملية</th>
                  <th class="bg-gradient-to-r from-slate-50 to-slate-100 text-blue-700 font-bold">الكمية</th>
                  <th class="bg-gradient-to-r from-slate-50 to-slate-100 text-blue-700 font-bold">السعر</th>
                  <th class="bg-gradient-to-r from-slate-50 to-slate-100 text-blue-700 font-bold">الإجمالي</th>
                </tr>
              </thead>
              <tbody>${tbody || '<tr><td colspan="6" class="text-center text-gray-500 py-4">لا توجد بيانات</td></tr>'}</tbody>
            </table>
          </div>
        `;
        detailsBox.appendChild(table);
      });
    }

    // أصناف التبغ فقط — تفصيليًا من جدول البنود مع الفاتورة والتاريخ
    try{
      const detRes = await window.api.sales_items_detailed({ date_from: startStr, date_to: endStr, only_tobacco: true });
      const det = (detRes && detRes.ok) ? (detRes.items||[]) : [];
      // بناء تجميع أعلى حسب (التصنيف، العملية)
      const byKey = new Map();
      det.forEach(it => {
        const key = `${it.category||'غير مصنف'}||${it.operation_name||'غير محدد'}`;
        const prev = byKey.get(key) || { count:0, qty:0, amount:0 };
        prev.count += 1;
        prev.qty += Number(it.qty||0);
        prev.amount += Number(it.line_total||0);
        byKey.set(key, prev);
      });
      const sumRows = Array.from(byKey.entries()).map(([key, v]) => {
        const [cat, op] = key.split('||');
        return `<tr>
          <td class="text-center">${cat}</td>
          <td class="text-center">${op}</td>
          <td class="text-center num">${v.count}</td>
          <td class="text-center num">${fmt(v.qty)}</td>
          <td class="text-left num">${fmt(v.amount)}</td>
        </tr>`;
      }).join('');
      const tobSumTbody = document.getElementById('tobaccoSummaryTbody');
      if(tobSumTbody){ tobSumTbody.innerHTML = sumRows || '<tr><td colspan="5" class="text-center text-gray-500 py-4">لا توجد بيانات تبغ ضمن الفترة</td></tr>'; }

      const tobRows = det.map(it => {
        const dateStr = fmtDateEn(it.created_at);
        return `<tr>
          <td class="text-center num">${dateStr}</td>
          <td class="text-center num">${it.invoice_no||''}</td>
          <td class="text-center">${it.doc_type==='credit_note'?'إشعار دائن':'فاتورة'}</td>
          <td class="text-center">${it.name}</td>
          <td class="text-center">${it.category||''}</td>
          <td class="text-center">${it.operation_name||''}</td>
          <td class="text-center num">${fmt(it.qty)}</td>
          <td class="text-center num">${fmt(it.price)}</td>
          <td class="text-left num">${fmt(it.line_total)}</td>
        </tr>`;
      });
      const tobTbody = document.getElementById('tobaccoTbody');
      if(tobTbody){ tobTbody.innerHTML = tobRows.join('') || '<tr><td colspan="9" class="text-center text-gray-500 py-4">لا توجد أصناف تبغ ضمن الفترة</td></tr>'; }
    }catch(_){
      const tobTbody = document.getElementById('tobaccoTbody');
      if(tobTbody){ tobTbody.innerHTML = '<tr><td colspan="9" class="text-center text-gray-500 py-4">تعذر تحميل تفاصيل التبغ</td></tr>'; }
      const tobSumTbody = document.getElementById('tobaccoSummaryTbody');
      if(tobSumTbody){ tobSumTbody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-500 py-4">تعذر تحميل تجميع التبغ</td></tr>'; }
    }
  }catch(e){ console.error(e); alert('تعذر تحميل تقرير الأنواع'); }
}

// تحميل افتراضي: اليوم الحالي
(function init(){
  const now = new Date();
  const start = new Date(now); start.setHours(0,0,0,0);
  const end = new Date(now); end.setHours(23,59,0,0);
  fromAtEl.value = start.toISOString().slice(0,16);
  toAtEl.value = end.toISOString().slice(0,16);
  loadRange(toStr(start), toStr(end));
})();

loadBtn?.addEventListener('click', () => {
  const fromStr = fromInputToStr(fromAtEl);
  const toStrVal = fromInputToStr(toAtEl);
  if(!fromStr || !toStrVal){ alert('يرجى اختيار الفترة'); return; }
  loadRange(fromStr, toStrVal);
});

// تصدير PDF/Excel
(function attachExportHandlers(){
  let exporting = false;
  const btnPdf = document.getElementById('exportPdfBtn');
  const btnExcel = document.getElementById('exportExcelBtn');
  if(btnPdf){
    btnPdf.addEventListener('click', async ()=>{
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
        const title = `types-report-${safe||Date.now()}.pdf`;
        
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
            
            // إنشاء عنصر div جديد في document الأصلي ثم استنساخه
            const tempDiv = document.createElement('div');
            tempDiv.style.cssText = 'text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 4px solid #2563eb;';
            
            let headerHTML = '<h1 style="font-size: 28px; font-weight: 900; color: #1f2937; margin-bottom: 8px; font-family: Cairo, sans-serif;">تقرير الأنواع</h1>';
            
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
            
            h1, h2, h3, h4 {
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
            
            details, details[open] {
              margin-bottom: 16px !important;
            }
            
            details > summary {
              display: none !important;
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
  if(btnExcel){
    btnExcel.addEventListener('click', async ()=>{
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
        addTable('تجميع حسب التصنيفات', document.querySelector('tbody#catTbody')?.closest('table'));
        // كل جداول التفاصيل
        document.querySelectorAll('#catDetails table').forEach((tbl, idx)=> addTable('تفاصيل '+(idx+1), tbl));
        const csv = lines.join('\n');
        const period = (rangeEl && rangeEl.textContent) ? rangeEl.textContent.replace(/[^0-9_\-–: ]+/g,'').replace(/\s+/g,' ').trim() : '';
        const filename = `types-report-${(period||'').replace(/[: ]/g,'_')||Date.now()}.csv`;
        await window.api.csv_export(csv, { saveMode:'auto', filename });
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