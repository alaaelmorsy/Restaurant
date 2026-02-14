// Invoices list: load and show basic info

// Permissions (align with main logic): hide actions if not granted
let __perms = new Set();
(async()=>{ try{ const u=JSON.parse(localStorage.getItem('pos_user')||'null'); if(u&&u.id){ const r=await window.api.perms_get_for_user(u.id); if(r&&r.ok){ __perms = new Set(r.keys||[]); } } }catch(_){ __perms = new Set(); } })();
function hasInvoice(k){ return __perms.has(k); }
const tbody = document.getElementById('tbody');
const errorDiv = document.getElementById('error');
const q = document.getElementById('q');
const q2 = document.getElementById('q2');
// const refreshBtn = document.getElementById('refreshBtn'); // removed button

function setError(m){ errorDiv.textContent = m || ''; }
function fmtDate(s){
  try{
    // Force Gregorian calendar to match printed invoice format
    return new Intl.DateTimeFormat('en-GB-u-ca-gregory', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: 'numeric', minute: '2-digit', hour12: true
    }).format(new Date(s));
  }catch(_){ return s; }
}

// pagination state
let __allInvoices = [];
let __invPage = 1;
let __invPageSize = 20;

// default print format from settings (thermal | a4)
let __defPrintFormat = 'thermal'; // A4 removed - keep thermal only
let __zatcaEnabled = false;

// Load zatca_enabled setting
(async()=>{ try{ const s=await window.api.settings_get(); if(s&&s.ok){ __zatcaEnabled = !!s.item?.zatca_enabled; updateZatcaColumnVisibility(); } }catch(_){ } })();

// Toggle ZATCA column visibility based on setting
function updateZatcaColumnVisibility(){
  const thZatca = document.getElementById('thZatcaStatus');
  if(thZatca){ thZatca.style.display = __zatcaEnabled ? '' : 'none'; }
}

function renderInvPager(total){
  const top=document.getElementById('pagerTop'); const bottom=document.getElementById('pagerBottom');
  const pages = (__invPageSize && __invPageSize>0) ? Math.max(1, Math.ceil(total/ __invPageSize)) : 1;
  const btn=(l,d,g)=>`<button class="px-4 py-2.5 bg-slate-700 text-white rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-md" ${d?'disabled':''} data-go="${g}">${l}</button>`;
  const html=[btn('⏮️ الأولى',__invPage<=1,'first'),btn('◀️ السابقة',__invPage<=1,'prev'),`<span class="px-5 py-2.5 bg-white border-2 border-blue-500 rounded-lg text-slate-800 font-black text-sm shadow-md">📄 صفحة ${__invPage} من ${pages} (${total.toLocaleString('ar')} فاتورة)</span>`,btn('التالية ▶️',__invPage>=pages,'next'),btn('الأخيرة ⏭️',__invPage>=pages,'last')].join(' ');
  if(top) top.innerHTML=html; if(bottom) bottom.innerHTML=html;
  const onClick=(e)=>{ const b=e.target.closest('button'); if(!b) return; const act=b.getAttribute('data-go'); if(act==='first') __invPage=1; if(act==='prev') __invPage=Math.max(1,__invPage-1); if(act==='next') __invPage=Math.min(pages,__invPage+1); if(act==='last') __invPage=pages; load(false); };
  if(top) top.onclick = onClick; if(bottom) bottom.onclick = onClick;
}

function renderRows(list){
  tbody.innerHTML='';
  list.forEach((row, i) => {
    const tr = document.createElement('tr');
    tr.className = '';
    const rowNum = ((__invPage-1)*(__invPageSize||20))+i+1;
    
    // تحديد حالة ZATCA
    const zatcaStatusHtml = __zatcaEnabled ? (()=>{
      const rejected = row.zatca_status==='rejected';
      const sent = !rejected && (row.zatca_status==='submitted'||row.zatca_status==='accepted'||row.zatca_submitted);
      if(rejected){
        return `<div class="inline-flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-400 text-red-800 rounded-lg font-bold text-xs">
          <span>❌</span>
          <span>فشل</span>
        </div>`;
      } else if(sent){
        return `<div class="inline-flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-500 text-green-800 rounded-lg font-bold text-xs">
          <span>✅</span>
          <span>مُرسل</span>
        </div>`;
      } else {
        return `<div class="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 border border-yellow-400 text-yellow-800 rounded-lg font-bold text-xs">
          <span>⏳</span>
          <span>انتظار</span>
        </div>`;
      }
    })() : '<span class="text-slate-400 text-xs font-bold">غير مفعل</span>';
    
    tr.innerHTML = `
      <td class="px-5 py-4 text-sm text-slate-700 font-bold">${rowNum}</td>
      <td class="px-5 py-4 text-sm text-slate-800 font-black">${row.invoice_no}</td>
      <td class="px-5 py-4 text-sm text-slate-800 font-black">${row.disp_customer_name || ''}</td>
      <td class="px-5 py-4 text-sm text-slate-700 font-bold">${row.disp_customer_phone || ''}</td>
      <td class="px-5 py-4 text-sm text-slate-700 font-bold">${(() => { const L={cash:'كاش',card:'شبكة',credit:'آجل',mixed:'مختلط',tamara:'تمارا',tabby:'تابي'}; const k=String(row.payment_method||'').toLowerCase(); return L[k] || (row.payment_method||''); })()}</td>
      <td class="px-5 py-4 text-sm text-slate-800 font-black">${Number(row.grand_total).toFixed(2)}</td>
      <td class="px-5 py-4 text-sm text-slate-700 font-bold">${fmtDate(row.created_at)}</td>
      <td class="px-5 py-4 text-center" style="display: ${__zatcaEnabled ? '' : 'none'}">${zatcaStatusHtml}</td>
      <td class="px-3 py-2 text-center">
        <div class="flex items-center justify-center gap-1">
        ${hasInvoice('invoices.view') && __zatcaEnabled ? (()=>{ 
          const rejected = row.zatca_status==='rejected'; 
          const sent = !rejected && (row.zatca_status==='submitted'||row.zatca_status==='accepted'||row.zatca_submitted); 
          if(rejected){
            return `<button class="px-3 py-1 rounded text-xs font-bold" style="background-color: #FF6B00; color: #FFFFFF;" data-act="send" data-id="${row.id}">إرسال للهيئة</button><button class="px-3 py-1 rounded text-xs font-bold" style="background-color: #9333EA; color: #FFFFFF;" data-act="show_zresp" data-id="${row.id}">رد الهيئة</button>`;
          } else if(sent){
            return `<button class="px-3 py-1 rounded text-xs font-bold" style="background-color: #9333EA; color: #FFFFFF;" data-act="show_zresp" data-id="${row.id}">رد الهيئة</button>`;
          } else {
            return `<button class="px-3 py-1 rounded text-xs font-bold" style="background-color: #FF6B00; color: #FFFFFF;" data-act="send" data-id="${row.id}">إرسال للهيئة</button>`;
          }
        })() : ''}
        ${hasInvoice('invoices.view') ? `<button class="px-3 py-1 rounded text-xs font-bold" style="background-color: #0066FF; color: #FFFFFF;" data-act="view" data-id="${row.id}">عرض الفاتورة</button>` : ''}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
  // attach actions once
  if(!tbody.__inited){ tbody.addEventListener('click', onTableAction); tbody.__inited = true; }
  renderInvPager(__totalInvoices);
}

function onTableAction(e){
  const b = e.target.closest('button'); if(!b) return;
  const act = b.getAttribute('data-act');
  if(act==='view'){
    if(!hasInvoice('invoices.view')) return;
    const id = Number(b.getAttribute('data-id'));
    // open print view with same params used at print time for consistency
    const page = 'print.html'; // A4 removed
    const row = __allInvoices.find(x=>Number(x.id)===id) || {};
    const method = String(row.payment_method||'');
    // Prefer persisted settled_cash for settled cash invoices; fallback to full total
    const cash = (method==='cash')
      ? ((row.settled_cash != null) ? Number(row.settled_cash) : Number(row.grand_total||0))
      : 0;
    // Add preview flag to prevent any auto-print on the print page
    const params = new URLSearchParams({ id: String(id), preview: '1', ...(method?{pay:method}:{}) , ...(cash?{cash:String(cash)}:{}) });
    const url = `../sales/${page}?${params.toString()}`;
    const w = (__defPrintFormat === 'a4') ? 900 : 500;
    const h = (__defPrintFormat === 'a4') ? 1000 : 700;
    window.open(url, 'PRINT_VIEW', `width=${w},height=${h},menubar=no,toolbar=no,location=no,status=no`);
  }
  if(act==='send'){
    const id = Number(b.getAttribute('data-id'));
    // Show in-progress state on the button and top error area
    const oldLabel = b.textContent;
    b.disabled = true; b.textContent = '⏳ جاري الإرسال...'; setError('⏳ جاري الإرسال...');
    (async () => {
      try{
        const resp = await window.electronAPI.localZatca.submitBySaleId(id);
        const raw = resp?.data;
        // Try detect rejection in success payload (e.g., NOT_REPORTED)
        const asStr = (typeof raw==='string') ? raw : JSON.stringify(raw||'');
        const obj = (()=>{ try{ return (typeof raw==='string')? JSON.parse(raw) : raw; }catch(_){ return null; } })();
        const notReported = /NOT[_\s-]?REPORTED/i.test(asStr) || (obj && (obj.statusCode==='NOT_REPORTED' || obj.status==='NOT_REPORTED' || obj?.data?.status==='NOT_REPORTED'));
        if(resp && resp.success && !notReported){
          const msg = (typeof resp.data === 'string') ? resp.data : JSON.stringify(resp.data);
          setError('✅ تم الإرسال بنجاح');
          // عرض رد الهيئة تلقائياً
          try{ showZatcaResponseModal(raw); }catch(_){ }
          alert('تم الإرسال بنجاح\n' + msg);
        } else {
          const msg = resp?.message || asStr || 'غير معروف';
          setError('❌ فشل الإرسال');
          // عرض رد الهيئة/الرسالة تلقائياً حتى في حالة الفشل
          try{ showZatcaResponseModal(msg); }catch(_){ }
          alert('فشل الإرسال\n' + msg);
        }
        // Refresh list to reflect status/tooltip/button state
        await load();
      }catch(e){
        const emsg = (e?.message || String(e));
        setError('❌ تعذر الإرسال: ' + emsg);
        try{ showZatcaResponseModal(emsg); }catch(_){ }
        alert('تعذر الإرسال: ' + emsg);
      } finally {
        // Restore button quickly if still present (list may rerender)
        try{ b.disabled = false; b.textContent = oldLabel; }catch(_){ }
      }
    })();
  }
  if(act==='show_zresp'){
    const id = Number(b.getAttribute('data-id'));
    const row = __allInvoices.find(x=>Number(x.id)===id) || {};
    showZatcaResponseModal(row.zatca_response || row.zatca_rejection_reason || '');
  }
}

(function(){
  const modal = document.getElementById('zatcaModal');
  const closeBtn = document.getElementById('zatcaClose');
  if(closeBtn){ closeBtn.onclick = ()=>{ modal.style.display='none'; }; }
  if(modal){ modal.addEventListener('click', (e)=>{ if(e.target===modal){ modal.style.display='none'; } }); }
})();

function showZatcaResponseModal(raw){
  const modal = document.getElementById('zatcaModal');
  const pre = document.getElementById('zatcaContent');
  let text = raw;
  try{
    const obj = (typeof raw==='string') ? JSON.parse(raw) : raw;
    text = JSON.stringify(obj, null, 2);
  }catch(_){ text = String(raw||''); }
  if(pre) pre.textContent = text;
  if(modal) modal.style.display = 'flex';
}

let __totalInvoices = 0;

async function load(resetPage = true){
  setError('');
  // تحديث حالة الربط مع الهيئة
  try{ const s=await window.api.settings_get(); if(s&&s.ok){ __zatcaEnabled = !!s.item?.zatca_enabled; updateZatcaColumnVisibility(); } }catch(_){ }
  const query = {};
  const v1 = (q.value||'').trim();
  const v2 = (q2.value||'').trim();
  // priority: invoice field only handles invoice number logic on backend
  if(v1){ query.q = v1; }
  // secondary filter for customer/phone/tax id
  if(v2){ query.customer_q = v2; }
  
  if(resetPage){ __invPage = 1; }
  
  // Server-side pagination: fetch only current page
  const pageSize = __invPageSize || 50;
  query.limit = pageSize;
  query.offset = (__invPage - 1) * pageSize;
  
  const r = await window.api.sales_list(query);
  if(!r.ok){ setError(r.error || 'تعذر تحميل الفواتير'); return; }
  // استبعد إشعارات الدائن من هذه القائمة
  __allInvoices = (r.items || []).filter(x => String(x.doc_type||'') !== 'credit_note');
  // دعم كل من total (من IPC) و count (من API القديم)
  __totalInvoices = r.total || r.count || __allInvoices.length;
  renderRows(__allInvoices);
}

// live search with debounce for both fields
(function(){
  let t=null;
  const trigger=()=>{ clearTimeout(t); t=setTimeout(()=>load(), 300); };
  q.addEventListener('input', trigger);
  q2.addEventListener('input', trigger);
})();

// Auto-refresh every 5 seconds to reflect ZATCA status changes from automatic submissions
setInterval(() => {
  load(false); // don't reset page on auto-refresh
}, 5000);

// init page size control
const pageSizeSel = document.getElementById('pageSize');
if(pageSizeSel){
  pageSizeSel.addEventListener('change', ()=>{
    const v = Number(pageSizeSel.value||20);
    __invPageSize = v;
    load(true);
  });
}

load();