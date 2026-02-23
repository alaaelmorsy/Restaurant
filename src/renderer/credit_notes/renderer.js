// Credit notes list screen

// ── Language support ──────────────────────────────────────────────────────────
const __langKey = 'app_lang';
let __lang = 'ar';

const __T = {
  ar: {
    pageTitle: 'الفواتير الدائنة - الرابط',
    headerTitle: 'الفواتير الدائنة',
    headerSubtitle: 'عرض الإشعارات الدائنة منفصلة',
    placeholderQ: '🔍 بحث برقم الإشعار/الفاتورة أو العميل',
    placeholderQ2: '👤 بحث بالهاتف/الضريبي/اسم العميل',
    labelDateFrom: 'من:',
    labelDateTo: 'إلى:',
    applyBtn: 'عرض',
    labelPageSize: '📊 عدد الصفوف:',
    optAll: 'الكل',
    thNoteNo: 'رقم الإشعار',
    thBaseInv: 'الفاتورة الأساسية',
    thCustomer: 'العميل',
    thPhone: 'الهاتف',
    thTotal: 'الإجمالي',
    thDate: 'التاريخ',
    thZatcaStatus: 'حالة الهيئة',
    thActions: 'إجراءات',
    zatcaModalTitle: 'تفاصيل رد هيئة الزكاة',
    zatcaClose: 'إغلاق',
    pagerLabel: (page, pages) => `صفحة ${page} من ${pages}`,
    zatcaRejected: 'فشل',
    zatcaSent: 'مُرسل',
    zatcaPending: 'انتظار',
    zatcaDisabled: 'غير مفعل',
    btnNote: '📄 الإشعار',
    btnBaseInv: '👁️ الفاتورة',
    btnSend: '📤 إرسال',
    btnSentDone: '✅ مُرسل',
    btnZatcaResp: '📋 الرد',
    errLoadFail: 'تعذر تحميل الفواتير الدائنة',
    sendingStatus: '⏳ جاري الإرسال...',
    sendSuccess: '✅ تم الإرسال بنجاح',
    sendFail: '❌ فشل الإرسال',
    sendError: (msg) => '❌ تعذر الإرسال: ' + msg,
    alertSendSuccess: (msg) => 'تم الإرسال بنجاح\n' + msg,
    alertSendFail: (msg) => 'فشل الإرسال\n' + msg,
    alertSendError: (msg) => 'تعذر الإرسال: ' + msg,
    noZatcaData: 'لا توجد بيانات',
  },
  en: {
    pageTitle: 'Credit Notes - Al-Rabit',
    headerTitle: 'Credit Notes',
    headerSubtitle: 'View credit notes separately',
    placeholderQ: '🔍 Search by note/invoice number or customer',
    placeholderQ2: '👤 Search by phone/tax number/customer name',
    labelDateFrom: 'From:',
    labelDateTo: 'To:',
    applyBtn: 'Show',
    labelPageSize: '📊 Rows per page:',
    optAll: 'All',
    thNoteNo: 'Note No.',
    thBaseInv: 'Base Invoice',
    thCustomer: 'Customer',
    thPhone: 'Phone',
    thTotal: 'Total',
    thDate: 'Date',
    thZatcaStatus: 'ZATCA Status',
    thActions: 'Actions',
    zatcaModalTitle: 'ZATCA Response Details',
    zatcaClose: 'Close',
    pagerLabel: (page, pages) => `Page ${page} of ${pages}`,
    zatcaRejected: 'Failed',
    zatcaSent: 'Sent',
    zatcaPending: 'Pending',
    zatcaDisabled: 'Disabled',
    btnNote: '📄 Note',
    btnBaseInv: '👁️ Invoice',
    btnSend: '📤 Send',
    btnSentDone: '✅ Sent',
    btnZatcaResp: '📋 Response',
    errLoadFail: 'Failed to load credit notes',
    sendingStatus: '⏳ Sending...',
    sendSuccess: '✅ Sent successfully',
    sendFail: '❌ Send failed',
    sendError: (msg) => '❌ Send error: ' + msg,
    alertSendSuccess: (msg) => 'Sent successfully\n' + msg,
    alertSendFail: (msg) => 'Send failed\n' + msg,
    alertSendError: (msg) => 'Send error: ' + msg,
    noZatcaData: 'No data available',
  }
};

function t(){ return __T[__lang] || __T['ar']; }

function __applyLang(lang){
  const base = (typeof lang === 'string' ? lang.split('-')[0].toLowerCase() : 'ar');
  __lang = (base === 'en') ? 'en' : 'ar';
  const isAr = __lang === 'ar';
  const T = t();

  document.documentElement.lang = isAr ? 'ar' : 'en';
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';

  const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  const setAttr = (id, attr, val) => { const el = document.getElementById(id); if(el) el.setAttribute(attr, val); };

  document.title = T.pageTitle;
  set('headerTitle', T.headerTitle);
  set('headerSubtitle', T.headerSubtitle);
  setAttr('q', 'placeholder', T.placeholderQ);
  setAttr('q2', 'placeholder', T.placeholderQ2);
  set('labelDateFrom', T.labelDateFrom);
  set('labelDateTo', T.labelDateTo);
  set('applyBtnTxt', T.applyBtn);
  set('labelPageSize', T.labelPageSize);
  set('optAll', T.optAll);
  set('thNoteNo', T.thNoteNo);
  set('thBaseInv', T.thBaseInv);
  set('thCustomer', T.thCustomer);
  set('thPhone', T.thPhone);
  set('thTotal', T.thTotal);
  set('thDate', T.thDate);
  set('thZatcaStatus', T.thZatcaStatus);
  set('thActions', T.thActions);
  set('zatcaModalTitle', T.zatcaModalTitle);
  set('zatcaCloseTxt', T.zatcaClose);

  try{ localStorage.setItem(__langKey, __lang); }catch(_){ }
}

(function initLang(){
  try{
    const stored = localStorage.getItem(__langKey);
    if(stored){ __applyLang(stored); }
  }catch(_){ }
  (async ()=>{
    try{
      const r = await window.api.app_get_locale();
      const L = (r && r.lang) || 'ar';
      __applyLang(L);
    }catch(_){ }
  })();
  try{
    window.api.app_on_locale_changed((L)=>{ __applyLang(L); });
  }catch(_){ }
})();
// ─────────────────────────────────────────────────────────────────────────────

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
let __pageSize = 50;
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

function updateZatcaColumnVisibility(){
  const thZatca = document.getElementById('thZatcaStatus');
  if(thZatca){ thZatca.style.display = __zatcaEnabled ? '' : 'none'; }
}

function paged(items){ if(!__pageSize||__pageSize<=0) return items; const s=(__page-1)*__pageSize; return items.slice(s,s+__pageSize); }

function renderPager(total){
  const T = t();
  const top=document.getElementById('pagerTop'); const bottom=document.getElementById('pagerBottom');
  const pages = (__pageSize && __pageSize>0) ? Math.max(1, Math.ceil(total/__pageSize)) : 1;
  const btn=(l,d,g)=>`<button class="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm" ${d?'disabled':''} data-go="${g}">${l}</button>`;
  const html=[
    btn('⏮️',__page<=1,'first'),
    btn('◀️',__page<=1,'prev'),
    `<span class="text-slate-700 font-bold text-sm px-2">${T.pagerLabel(__page, pages)}</span>`,
    btn('▶️',__page>=pages,'next'),
    btn('⏭️',__page>=pages,'last')
  ].join(' ');
  if(top) top.innerHTML=html; if(bottom) bottom.innerHTML=html;
  const onClick=(e)=>{ const b=e.target.closest('button'); if(!b) return; const act=b.getAttribute('data-go'); if(act==='first') __page=1; if(act==='prev') __page=Math.max(1,__page-1); if(act==='next') __page=Math.min(pages,__page+1); if(act==='last') __page=pages; renderRows(__all); };
  if(top) top.onclick = onClick; if(bottom) bottom.onclick = onClick;
}

function renderRows(list){
  const T = t();
  tbody.innerHTML='';
  const items = paged(list);
  items.forEach((row, i) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50';

    const zatcaStatusHtml = __zatcaEnabled ? (()=>{
      const rejected = row.zatca_status==='rejected';
      const sent = !rejected && (row.zatca_status==='submitted'||row.zatca_status==='accepted'||row.zatca_submitted);
      if(rejected){
        return `<div class="inline-flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-400 text-red-800 rounded-lg font-bold text-xs"><span>❌</span><span>${T.zatcaRejected}</span></div>`;
      } else if(sent){
        return `<div class="inline-flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-500 text-green-800 rounded-lg font-bold text-xs"><span>✅</span><span>${T.zatcaSent}</span></div>`;
      } else {
        return `<div class="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 border border-yellow-400 text-yellow-800 rounded-lg font-bold text-xs"><span>⏳</span><span>${T.zatcaPending}</span></div>`;
      }
    })() : `<span class="text-slate-400 text-xs font-bold">${T.zatcaDisabled}</span>`;

    const rejected = row.zatca_status==='rejected';
    const sent = !rejected && (row.zatca_status==='submitted'||row.zatca_status==='accepted'||row.zatca_submitted);

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
          ${canCN('credit_notes.view') ? `<button class="px-2 py-1.5 rounded-lg text-xs font-bold text-white shadow-md whitespace-nowrap" style="background-color: #059669;" data-act="view-cn" data-id="${row.id}">${T.btnNote}</button>` : ''}
          ${row.ref_base_sale_id && canCN('credit_notes.view_base') ? `<button class="px-2 py-1.5 rounded-lg text-xs font-bold text-white shadow-md whitespace-nowrap" style="background-color: #0066FF;" data-act="view-base" data-base="${row.ref_base_sale_id}">${T.btnBaseInv}</button>` : ''}
          ${canCN('credit_notes.view') && __zatcaEnabled ? (()=>{
            if(rejected){
              return `<button class="px-2 py-1.5 rounded-lg text-xs font-bold text-white shadow-md whitespace-nowrap" style="background-color: #FF6B00;" data-act="send" data-id="${row.id}">${T.btnSend}</button>`;
            } else if(sent){
              return `<button class="px-2 py-1.5 rounded-lg text-xs font-bold text-white shadow-md whitespace-nowrap" style="background-color: #10B981;" disabled>${T.btnSentDone}</button>`;
            } else {
              return `<button class="px-2 py-1.5 rounded-lg text-xs font-bold text-white shadow-md whitespace-nowrap" style="background-color: #FF6B00;" data-act="send" data-id="${row.id}">${T.btnSend}</button>`;
            }
          })() : ''}
          ${canCN('credit_notes.view') && __zatcaEnabled && (row.zatca_response||row.zatca_rejection_reason) ? `<button class="px-2 py-1.5 rounded-lg text-xs font-bold text-white shadow-md whitespace-nowrap" style="background-color: #9333EA;" data-act="show_zresp" data-id="${row.id}">${T.btnZatcaResp}</button>` : ''}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
  if(!tbody.__inited){ tbody.addEventListener('click', onTableAction); tbody.__inited = true; }
  renderPager(list.length);
}

function onTableAction(e){
  const T = t();
  const b = e.target.closest('button'); if(!b) return;
  const act = b.getAttribute('data-act');
  if(act === 'view-cn'){
    if(!canCN('credit_notes.view')) return;
    const id = Number(b.getAttribute('data-id'));
    const row = __all.find(x=>Number(x.id)===id) || {};
    const params = new URLSearchParams({ id: String(id), pay: 'refund', base: String(row.ref_base_sale_id||''), base_no: String(row.ref_base_invoice_no||''), preview: '1' });
    const url = `../sales/print.html?${params.toString()}`;
    window.open(url, 'PRINT_VIEW', `width=500,height=700`);
  }
  if(act === 'view-base'){
    if(!canCN('credit_notes.view_base')) return;
    const baseId = Number(b.getAttribute('data-base'));
    window.open(`../sales/print.html?id=${baseId}&preview=1`, 'PRINT_VIEW', `width=500,height=700`);
  }
  if(act === 'show_zresp'){
    const id = Number(b.getAttribute('data-id'));
    const row = __all.find(x=>Number(x.id)===id);
    if(row){
      const resp = row.zatca_response || row.zatca_rejection_reason || T.noZatcaData;
      showZatcaResponseModal(resp);
    }
  }
  if(act === 'send'){
    const id = Number(b.getAttribute('data-id'));
    const old = b.textContent;
    b.disabled = true; b.textContent = T.sendingStatus; setError(T.sendingStatus);
    (async()=>{
      try{
        const resp = await window.electronAPI.localZatca.submitBySaleId(id);
        const raw = resp?.data;
        const asStr = (typeof raw==='string') ? raw : JSON.stringify(raw||'');
        const obj = (()=>{ try{ return (typeof raw==='string')? JSON.parse(raw) : raw; }catch(_){ return null; } })();
        const notReported = /NOT[_\s-]?REPORTED/i.test(asStr) || (obj && (obj.statusCode==='NOT_REPORTED' || obj.status==='NOT_REPORTED' || obj?.data?.status==='NOT_REPORTED'));
        if(resp && resp.success && !notReported){
          const msg = (typeof resp.data==='string') ? resp.data : JSON.stringify(resp.data);
          setError(t().sendSuccess);
          try{ showZatcaResponseModal(raw); }catch(_){ }
          alert(t().alertSendSuccess(msg));
        }else{
          const msg = resp?.message || asStr || 'unknown';
          setError(t().sendFail);
          try{ showZatcaResponseModal(msg); }catch(_){ }
          alert(t().alertSendFail(msg));
        }
        await load();
      }catch(e){
        const msg = e?.message || String(e);
        setError(t().sendError(msg));
        try{ showZatcaResponseModal(msg); }catch(_){ }
        alert(t().alertSendError(msg));
      }finally{
        try{ b.disabled = false; b.textContent = old; }catch(_){ }
      }
    })();
  }
}

async function load(){
  const T = t();
  setError('');
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
  if(!r || !r.ok){ setError(r?.error || t().errLoadFail); return; }
  __all = (r.items||[]).filter(x => String(x.doc_type||'')==='credit_note');
  renderRows(__all);
}

(function(){ let timer=null; const trigger=()=>{ clearTimeout(timer); timer=setTimeout(()=>load(), 250); }; q.addEventListener('input', trigger); q2.addEventListener('input', trigger); })();

setInterval(() => {
  const currentPage = __page;
  load().then(() => {
    __page = currentPage;
    renderRows(__all);
  });
}, 60000);

const applyBtn = document.getElementById('applyBtn');
if(applyBtn){ applyBtn.addEventListener('click', ()=>{ load(); }); }

const pageSizeSel = document.getElementById('pageSize');
if(pageSizeSel){ pageSizeSel.addEventListener('change', ()=>{ __pageSize = Number(pageSizeSel.value||20); __page = 1; renderRows(__all); }); }

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
