// Credit notes list screen
const tbody = document.getElementById('tbody');
const errorDiv = document.getElementById('error');

// Permissions
let __perms = new Set();
(async()=>{ try{ const u=JSON.parse(localStorage.getItem('pos_user')||'null'); if(u&&u.id){ const r=await window.api.perms_get_for_user(u.id); if(r&&r.ok){ __perms=new Set(r.keys||[]); } } }catch(_){ __perms=new Set(); } })();
function canCN(k){ return __perms.has('credit_notes') && __perms.has(k); }
const q = document.getElementById('q');
const q2 = document.getElementById('q2');
const dateFrom = document.getElementById('dateFrom');
const dateTo = document.getElementById('dateTo');

function setError(m){ errorDiv.textContent = m || ''; }
function fmtDate(s){
  try{
    return new Intl.DateTimeFormat('en-GB-u-ca-gregory', {
      year:'numeric', month:'2-digit', day:'2-digit', hour:'numeric', minute:'2-digit', hour12:true
    }).format(new Date(s));
  }catch(_){ return s; }
}

let __all = [];
let __page = 1;
let __pageSize = 50; // زيادة من 20 إلى 50 لتحسين الأداء عبر VPN
let __defPrintFormat = 'thermal';
let __zatcaEnabled = false;
let __currencySymbol = '\ue900';
(async ()=>{ 
  try{ 
    const s=await window.api.settings_get(); 
    if(s&&s.ok){ 
      __defPrintFormat = (s.item?.default_print_format==='a4') ? 'a4' : 'thermal'; 
      __zatcaEnabled = !!s.item?.zatca_enabled; 
      const sym = String((s.item?.currency_symbol || '')).trim();
      __currencySymbol = (!sym || sym === '﷼' || sym === 'SAR' || sym === 'ريال' || sym === 'ر.س' || sym.includes('ريال')) ? '\ue900' : sym;
      updateZatcaColumnVisibility(); 
    } 
  }catch(_){ } 
})();

// Toggle ZATCA column visibility based on setting
function updateZatcaColumnVisibility(){
  const thZatca = document.getElementById('thZatcaStatus');
  if(thZatca){ thZatca.style.display = __zatcaEnabled ? '' : 'none'; }
}

function paged(items){ if(!__pageSize||__pageSize<=0) return items; const s=(__page-1)*__pageSize; return items.slice(s,s+__pageSize); }
function renderPager(total){
  const top=document.getElementById('pagerTop'); const bottom=document.getElementById('pagerBottom');
  const pages = (__pageSize && __pageSize>0) ? Math.max(1, Math.ceil(total/ __pageSize)) : 1;
  const btn=(l,d,g)=>`<button class="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm" ${d?'disabled':''} data-go="${g}">${l}</button>`;
  const html=[btn('⏮️',__page<=1,'first'),btn('◀️',__page<=1,'prev'),`<span class="text-slate-700 font-bold text-sm px-2">صفحة ${__page} من ${pages}</span>`,btn('▶️',__page>=pages,'next'),btn('⏭️',__page>=pages,'last')].join(' ');
  if(top) top.innerHTML=html; if(bottom) bottom.innerHTML=html;
  const onClick=(e)=>{ const b=e.target.closest('button'); if(!b) return; const act=b.getAttribute('data-go'); if(act==='first') __page=1; if(act==='prev') __page=Math.max(1,__page-1); if(act==='next') __page=Math.min(pages,__page+1); if(act==='last') __page=pages; renderRows(__all); };
  if(top) top.onclick = onClick; if(bottom) bottom.onclick = onClick;
}

function renderRows(list){
  tbody.innerHTML='';
  const items = paged(list);
  items.forEach((row, i) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50';
    
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
    
    const rejected = row.zatca_status==='rejected';
    const sent = !rejected && (row.zatca_status==='submitted'||row.zatca_status==='accepted'||row.zatca_submitted);
    const dis = sent ? 'disabled' : '';
    
    tr.innerHTML = `
      <td class="px-4 py-3 text-sm font-bold text-slate-700">${((__page-1)*(__pageSize||list.length))+i+1}</td>
      <td class="px-4 py-3 text-sm font-semibold text-slate-900">${row.invoice_no}</td>
      <td class="px-4 py-3 text-sm font-semibold text-slate-700">${row.ref_base_invoice_no || '-'}</td>
      <td class="px-4 py-3 text-sm font-semibold text-slate-700">${row.customer_name || '-'}</td>
      <td class="px-4 py-3 text-sm font-semibold text-slate-700">${row.customer_phone || '-'}</td>
      <td class="px-4 py-3 text-sm font-bold text-orange-600">${Math.abs(Number(row.grand_total||0)).toFixed(2)} <span class="currency-symbol">${__currencySymbol}</span></td>
      <td class="px-4 py-3 text-sm text-slate-600">${fmtDate(row.created_at)}</td>
      <td class="px-4 py-3 text-center" style="display: ${__zatcaEnabled ? '' : 'none'}">${zatcaStatusHtml}</td>
      <td class="px-3 py-2 text-center">
        <div class="flex items-center justify-center gap-1.5">
          ${canCN('credit_notes.view') ? `<button class="px-2 py-1.5 rounded-lg text-xs font-bold text-white shadow-md whitespace-nowrap" style="background-color: #059669;" data-act="view-cn" data-id="${row.id}">📄 الإشعار</button>` : ''}
          ${row.ref_base_sale_id && canCN('credit_notes.view_base') ? `<button class="px-2 py-1.5 rounded-lg text-xs font-bold text-white shadow-md whitespace-nowrap" style="background-color: #0066FF;" data-act="view-base" data-base="${row.ref_base_sale_id}">👁️ الفاتورة</button>` : ''}
          ${canCN('credit_notes.view') && __zatcaEnabled ? (()=>{
            if(rejected){
              return `<button class="px-2 py-1.5 rounded-lg text-xs font-bold text-white shadow-md whitespace-nowrap" style="background-color: #FF6B00;" data-act="send" data-id="${row.id}">📤 إرسال</button>`;
            } else if(sent){
              return `<button class="px-2 py-1.5 rounded-lg text-xs font-bold text-white shadow-md whitespace-nowrap" style="background-color: #10B981;" disabled>✅ مُرسل</button>`;
            } else {
              return `<button class="px-2 py-1.5 rounded-lg text-xs font-bold text-white shadow-md whitespace-nowrap" style="background-color: #FF6B00;" data-act="send" data-id="${row.id}">📤 إرسال</button>`;
            }
          })() : ''}
          ${canCN('credit_notes.view') && __zatcaEnabled && (row.zatca_response||row.zatca_rejection_reason) ? `<button class="px-2 py-1.5 rounded-lg text-xs font-bold text-white shadow-md whitespace-nowrap" style="background-color: #9333EA;" data-act="show_zresp" data-id="${row.id}">📋 الرد</button>` : ''}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
  if(!tbody.__inited){ tbody.addEventListener('click', onTableAction); tbody.__inited = true; }
  renderPager(list.length);
}

function onTableAction(e){
  const b = e.target.closest('button'); if(!b) return;
  const act = b.getAttribute('data-act');
  if(act === 'view-cn'){
    if(!canCN('credit_notes.view')) return;
    const id = Number(b.getAttribute('data-id'));
    const page = 'print.html'; // A4 removed
    // For credit note print: include base parameters for proper labeling
    const row = __all.find(x=>Number(x.id)===id) || {};
    const params = new URLSearchParams({ id: String(id), pay: 'refund', base: String(row.ref_base_sale_id||''), base_no: String(row.ref_base_invoice_no||''), preview: '1' });
    const url = `../sales/${page}?${params.toString()}`;
    const w = 500;
    const h = 700;
    window.open(url, 'PRINT_VIEW', `width=${w},height=${h}`);
  }
  if(act === 'view-base'){
    if(!canCN('credit_notes.view_base')) return;
    const baseId = Number(b.getAttribute('data-base'));
    const page = 'print.html'; // A4 removed
    const url = `../sales/${page}?id=${baseId}&preview=1`;
    const w = 500;
    const h = 700;
    window.open(url, 'PRINT_VIEW', `width=${w},height=${h}`);
  }
  if(act === 'show_zresp'){
    const id = Number(b.getAttribute('data-id'));
    const row = __all.find(x=>Number(x.id)===id);
    if(row){
      const resp = row.zatca_response || row.zatca_rejection_reason || 'لا توجد بيانات';
      showZatcaResponseModal(resp);
    }
  }
  if(act === 'send'){
    const id = Number(b.getAttribute('data-id'));
    // in-progress state
    const old = b.textContent; b.disabled = true; b.textContent = '⏳ جاري الإرسال...'; setError('⏳ جاري الإرسال...');
    (async()=>{
      try{
        const resp = await window.electronAPI.localZatca.submitBySaleId(id);
        const raw = resp?.data;
        const asStr = (typeof raw==='string') ? raw : JSON.stringify(raw||'');
        const obj = (()=>{ try{ return (typeof raw==='string')? JSON.parse(raw) : raw; }catch(_){ return null; } })();
        const notReported = /NOT[_\s-]?REPORTED/i.test(asStr) || (obj && (obj.statusCode==='NOT_REPORTED' || obj.status==='NOT_REPORTED' || obj?.data?.status==='NOT_REPORTED'));
        if(resp && resp.success && !notReported){
          const msg = (typeof resp.data==='string') ? resp.data : JSON.stringify(resp.data);
          setError('✅ تم الإرسال بنجاح');
          try{ showZatcaResponseModal(raw); }catch(_){ }
          alert('تم الإرسال بنجاح\n' + msg);
        }else{
          const msg = resp?.message || asStr || 'غير معروف';
          setError('❌ فشل الإرسال');
          try{ showZatcaResponseModal(msg); }catch(_){ }
          alert('فشل الإرسال\n' + msg);
        }
        await load();
      }catch(e){
        const msg = e?.message || String(e);
        setError('❌ تعذر الإرسال: ' + msg);
        try{ showZatcaResponseModal(msg); }catch(_){ }
        alert('تعذر الإرسال: ' + msg);
      }finally{
        try{ b.disabled = false; b.textContent = old; }catch(_){ }
      }
    })();
  }
}

async function load(){
  setError('');
  // تحديث حالة الربط مع الهيئة
  try{ const s=await window.api.settings_get(); if(s&&s.ok){ __zatcaEnabled = !!s.item?.zatca_enabled; updateZatcaColumnVisibility(); } }catch(_){ }
  const query = { type: 'credit', limit: 5000, offset: 0 };
  const v1 = (q.value||'').trim();
  const v2 = (q2.value||'').trim();
  if(v1){ query.q = v1; }
  if(v2){ query.customer_q = v2; }
  const df = (dateFrom.value||'').trim();
  const dt = (dateTo.value||'').trim();
  if(df){ query.date_from = df.replace('T',' ') + (df.length===16 ? ':00' : ''); }
  if(dt){ query.date_to = dt.replace('T',' ') + (dt.length===16 ? ':59' : ''); }
  __page = 1;
  const r = await window.api.sales_list(query);
  if(!r || !r.ok){ setError(r?.error||'تعذر تحميل الفواتير الدائنة'); return; }
  // keep only credit notes in case backend filter not applied in older schema
  __all = (r.items||[]).filter(x => String(x.doc_type||'')==='credit_note');
  renderRows(__all);
}

(function(){ let t=null; const trigger=()=>{ clearTimeout(t); t=setTimeout(()=>load(), 250); }; q.addEventListener('input', trigger); q2.addEventListener('input', trigger); })();

// Auto-refresh every 60 seconds to reflect ZATCA status changes from automatic submissions
setInterval(() => {
  const currentPage = __page;
  load().then(() => {
    __page = currentPage; // maintain current page after auto-refresh
    renderRows(__all);
  });
}, 60000);

// زر تطبيق التاريخ
const applyBtn = document.getElementById('applyBtn');
if(applyBtn){ applyBtn.addEventListener('click', ()=>{ load(); }); }

const pageSizeSel = document.getElementById('pageSize');
if(pageSizeSel){ pageSizeSel.addEventListener('change', ()=>{ __pageSize = Number(pageSizeSel.value||20); __page = 1; renderRows(__all); }); }

// Modal helpers
(function(){
  const modal = document.getElementById('zatcaModal');
  const closeBtn = document.getElementById('zatcaClose');
  if(closeBtn){ closeBtn.onclick = ()=>{ modal.classList.add('hidden'); modal.classList.remove('flex'); }; }
  if(modal){ modal.addEventListener('click', (e)=>{ if(e.target===modal){ modal.classList.add('hidden'); modal.classList.remove('flex'); } }); }
})();
function showZatcaResponseModal(raw){
  const modal = document.getElementById('zatcaModal');
  const pre = document.getElementById('zatcaContent');
  let text = raw;
  try{ const obj = (typeof raw==='string') ? JSON.parse(raw) : raw; text = JSON.stringify(obj, null, 2); }catch(_){ text = String(raw||''); }
  if(pre) pre.textContent = text; if(modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
}

load();