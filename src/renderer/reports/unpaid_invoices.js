const __langKey = 'app_lang';
let __currentLang = {};

function __applyLang(lang){
  const base = (typeof lang === 'string' ? lang.split('-')[0].toLowerCase() : 'ar');
  const isAr = base === 'ar';
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
    status: isAr ? 'الحالة' : 'Status',
    paymentMethod: isAr ? 'طريقة الدفع' : 'Payment Method',
    paid: isAr ? 'المدفوع' : 'Paid',
    remaining: isAr ? 'المتبقي' : 'Remaining',
    view: isAr ? 'عرض' : 'View',
    totals: isAr ? 'الإجماليات' : 'Totals',
    count: isAr ? 'عدد' : 'Count',
    totalDebt: isAr ? 'إجمالي الديون' : 'Total Debt',
  };
  __currentLang = t;
  document.documentElement.lang = isAr ? 'ar' : 'en';
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  document.title = t.unpaidInvoices;
  const pageTitle = document.querySelector('.text-2xl');
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
  try{ localStorage.setItem(__langKey, base); }catch(_){ }
}

(function initLang(){
  (async ()=>{
    try{
      const r = await window.api.app_get_locale();
      __applyLang((r && r.lang) || 'ar');
    }catch(_){ __applyLang('ar'); }
  })();
  try{ window.api.app_on_locale_changed((L)=>__applyLang(L)); }catch(_){ }
})();

const fmt = (n)=> Number(n || 0).toFixed(2);
const rangeEl = document.getElementById('range');
const fromAtEl = document.getElementById('fromAt');
const toAtEl = document.getElementById('toAt');
const btnBack = document.getElementById('btnBack');
if(btnBack){ btnBack.onclick = ()=>{ window.location.href = './index.html'; }; }

function toStartStr(input){
  const v = (input?.value || '').trim();
  return v ? v.replace('T', ' ') + ':00' : '';
}
function toEndStr(input){
  const v = (input?.value || '').trim();
  return v ? v.replace('T', ' ') + ':59' : '';
}
function toStr(d){
  const pad2 = (v)=> String(v).padStart(2, '0');
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:00`;
}
function initDefaultRange(){
  const now = new Date();
  const start = new Date(now);
  start.setFullYear(start.getFullYear() - 1);
  start.setHours(0,0,0,0);
  fromAtEl.value = toStr(start).replace(' ', 'T').slice(0,16);
  toAtEl.value = toStr(now).replace(' ', 'T').slice(0,16);
}

function fmtDate(value){
  if(!value) return '';
  const d = new Date(value);
  if(isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB-u-ca-gregory', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:true }).format(d);
}

async function loadRange(startStr, endStr){
  if(rangeEl){ rangeEl.textContent = `الفترة: ${startStr} — ${endStr}`; }
  const tbody = document.getElementById('invTbody');
  try{
    const res = await window.api.sales_list_credit({ date_from: startStr, date_to: endStr, settled_only: false, pageSize: 10000 });
    if(!res || !res.ok){
      if(tbody){ tbody.innerHTML = `<tr><td colspan="8" class="text-center text-red-600 py-4">${(res && res.error) || 'تعذر تحميل الفواتير'}</td></tr>`; }
      return;
    }
    const items = res.items || [];

    // Fetch all partial payments for these invoices in a single batch
    let paymentsBySale = {};
    try{
      if(items.length && typeof window.api.sales_get_payments_batch === 'function'){
        const ids = items.map(s => Number(s.id)).filter(Boolean);
        const pres = await window.api.sales_get_payments_batch(ids);
        if(pres && pres.ok && Array.isArray(pres.payments)){
          pres.payments.forEach(p => {
            const sid = Number(p.sale_id);
            if(!paymentsBySale[sid]) paymentsBySale[sid] = [];
            paymentsBySale[sid].push(p);
          });
        }
      }
    }catch(_){ /* ignore */ }

    let sumGrand = 0;
    let sumPaid = 0;
    let sumRemaining = 0;
    const payLabels = { cash:'كاش', card:'شبكة', credit:'آجل', mixed:'مختلط', tamara:'تمارا', tabby:'تابي', refund:'إشعار دائن', bank_transfer:'تحويل بنكي' };
    const rows = items.map((sale)=>{
      const dateStr = fmtDate(sale.created_at);
      const sid = Number(sale.id);
      const list = paymentsBySale[sid] || [];
      const paidFromPayments = list.reduce((acc, p) => acc + Number(p.amount || 0), 0);
      const paid = paidFromPayments > 0 ? paidFromPayments : Number(sale.amount_paid || 0);
      const remaining = Math.max(0, Number(sale.grand_total || 0) - paid);
      sumGrand += Number(sale.grand_total || 0);
      sumPaid += paid;
      sumRemaining += remaining;
      const status = paid > 0 ? `مدفوعة جزئياً (${list.length} دفعة)` : 'غير مدفوعة';
      const viewBtn = `<button class="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-semibold" data-view="${sale.id}">عرض</button>`;
      const toggleBtn = list.length ? ` <button class="px-2 py-1 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-xs font-semibold" data-toggle="${sale.id}">الدفعات</button>` : '';
      const mainRow = `<tr>
        <td class="text-center">${sale.invoice_no || ''}</td>
        <td class="text-center">${sale.customer_name || ''}</td>
        <td class="text-center">${dateStr}</td>
        <td class="text-center">${status}</td>
        <td class="text-center">${payLabels[String(sale.payment_method || '').toLowerCase()] || sale.payment_method || ''}</td>
        <td class="text-center font-bold ${paid>0?'text-green-700':''}">${fmt(paid)}</td>
        <td class="text-center font-bold ${remaining>0?'text-red-700':''}">${fmt(remaining)}</td>
        <td class="text-center">${viewBtn}${toggleBtn}</td>
      </tr>`;
      let detailRow = '';
      if(list.length){
        const payRows = list.map((p, idx) => `
          <tr class="bg-amber-50">
            <td class="text-center text-xs text-gray-600">#${idx+1}</td>
            <td class="text-center text-xs" colspan="2">${fmtDate(p.paid_at)}</td>
            <td class="text-center text-xs">${payLabels[String(p.method || '').toLowerCase()] || p.method || ''}</td>
            <td class="text-center text-xs text-gray-700" colspan="1">${p.notes ? String(p.notes) : ''}</td>
            <td class="text-center text-xs font-bold text-green-700">${fmt(p.amount)}</td>
            <td class="text-center text-xs text-gray-500" colspan="2">دفعة جزئية</td>
          </tr>`).join('');
        detailRow = `<tr data-detail="${sale.id}" style="display:none"><td colspan="8" class="p-0"><table class="w-full"><tbody>${payRows}</tbody></table></td></tr>`;
      }
      return mainRow + detailRow;
    }).join('');
    tbody.innerHTML = rows || '<tr><td colspan="8" class="text-center text-gray-500 py-4">لا توجد فواتير غير مدفوعة ضمن الفترة</td></tr>';
    document.getElementById('sumCount').textContent = String(items.length || 0);
    document.getElementById('sumPaid').textContent = fmt(sumPaid);
    document.getElementById('sumRemaining').textContent = fmt(sumRemaining);
    document.getElementById('sumGrand').textContent = fmt(sumGrand);
    document.querySelectorAll('button[data-view]').forEach((btn)=>{
      btn.addEventListener('click', ()=>{
        const id = Number(btn.getAttribute('data-view'));
        window.open(`../sales/print.html?id=${encodeURIComponent(String(id))}&preview=1`, 'PRINT_VIEW', 'width=500,height=700');
      });
    });
    document.querySelectorAll('button[data-toggle]').forEach((btn)=>{
      btn.addEventListener('click', ()=>{
        const id = btn.getAttribute('data-toggle');
        const row = document.querySelector(`tr[data-detail="${id}"]`);
        if(row){ row.style.display = (row.style.display === 'none' ? '' : 'none'); }
      });
    });
  }catch(e){
    console.error(e);
    if(tbody){ tbody.innerHTML = `<tr><td colspan="8" class="text-center text-red-600 py-4">خطأ: ${e && e.message ? e.message : 'تعذر تحميل البيانات'}</td></tr>`; }
  }
}

(function wireRange(){
  const btn = document.getElementById('applyRangeBtn');
  if(btn){
    btn.addEventListener('click', ()=>{
      const s = toStartStr(fromAtEl);
      const e = toEndStr(toAtEl);
      if(!s || !e){ alert('يرجى تحديد الفترة (من وإلى)'); return; }
      loadRange(s, e);
    });
  }
})();

if(fromAtEl){
  fromAtEl.addEventListener('click', function(){ this.showPicker(); });
  fromAtEl.addEventListener('focus', function(){ this.showPicker(); });
}
if(toAtEl){
  toAtEl.addEventListener('click', function(){ this.showPicker(); });
  toAtEl.addEventListener('focus', function(){ this.showPicker(); });
}

initDefaultRange();
(function autoLoad(){
  const s = toStartStr(fromAtEl);
  const e = toEndStr(toAtEl);
  if(s && e){ loadRange(s, e); }
})();
