// Purchases screen logic
const errorDiv = document.getElementById('error');
// dialog fields
const dlg = document.getElementById('dlg');
const dlgSave = document.getElementById('dlgSave');
const dlgCancel = document.getElementById('dlgCancel');
const p_name = document.getElementById('p_name');
const p_dt_input = document.getElementById('p_dt');
const p_apply_vat = document.getElementById('p_apply_vat');
const p_vat = document.getElementById('p_vat');
const p_cost = document.getElementById('p_cost');
const p_payment_method = document.getElementById('p_payment_method');
const p_notes = document.getElementById('p_notes');
const t_sub = document.getElementById('t_sub');
const t_vat = document.getElementById('t_vat');
const t_grand = document.getElementById('t_grand');

// list + filters + actions
const f_from = document.getElementById('f_from');
const f_to = document.getElementById('f_to');
const btnFilter = document.getElementById('btnFilter');
const tbody = document.getElementById('tbody');
const btnOpenModal = document.getElementById('btnOpenModal');
const btnExportCsv = document.getElementById('btnExportCsv');
const btnExportPdf = document.getElementById('btnExportPdf');

let editId = null;
let currentItems = [];
let currentPage = 1;
let itemsPerPage = 50;
let totalItems = 0;

const itemsPerPageSelect = document.getElementById('itemsPerPageSelect');
const btnFirstTop = document.getElementById('btnFirstTop');
const btnPrevTop = document.getElementById('btnPrevTop');
const btnNextTop = document.getElementById('btnNextTop');
const btnLastTop = document.getElementById('btnLastTop');
const paginationInfoTop = document.getElementById('paginationInfoTop');

function miniConfirm(message){
  return new Promise((resolve)=>{
    try{
      let dlg2 = document.getElementById('miniConfirm');
      if(!dlg2){
        dlg2 = document.createElement('dialog');
        dlg2.id = 'miniConfirm';
        dlg2.innerHTML = `<div class="bg-white rounded-3xl overflow-hidden">
          <div class="px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white">
            <strong class="title text-lg font-black"></strong>
          </div>
          <div class="p-6 flex gap-3 justify-end">
            <button class="cancel px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold shadow-sm">إلغاء</button>
            <button class="ok px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold shadow-md border border-red-500">موافق</button>
          </div>
        </div>`;
        document.body.appendChild(dlg2);
      }
      const title = dlg2.querySelector('.title');
      const ok = dlg2.querySelector('.ok');
      const cancel = dlg2.querySelector('.cancel');
      if(title) title.textContent = message || '';
      const cleanup = ()=>{ ok.onclick=null; cancel.onclick=null; dlg2.removeEventListener('close', onClose); };
      const onClose = ()=>{ cleanup(); };
      dlg2.addEventListener('close', onClose);
      ok.onclick = ()=>{ dlg2.close(); resolve(true); };
      cancel.onclick = ()=>{ dlg2.close(); resolve(false); };
      dlg2.showModal();
      setTimeout(()=> ok.focus(), 0);
    }catch(_){ resolve(false); }
  });
}

function setError(m){ 
  errorDiv.innerHTML = m ? `⚠️ ${m}` : '';
  if(m) {
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function compute(){
  const apply = Number(p_apply_vat.value||1) === 1;
  const vatPct = Math.max(0, Number(p_vat.value||15));
  const cost = Math.max(0, Number(p_cost.value||0));
  let sub=0, vat=0, grand=0;
  if(apply){
    const r = vatPct/100;
    sub = cost / (1 + r);
    vat = cost - sub;
    grand = cost;
  } else {
    sub = cost;
    vat = 0;
    grand = cost;
  }
  t_sub.value = sub.toFixed(2);
  t_vat.value = vat.toFixed(2);
  t_grand.value = grand.toFixed(2);
}
[p_apply_vat, p_vat, p_cost].forEach(el => el.addEventListener('input', compute));

function enableForm(){
  try{
    // Remove any inert/aria-hidden in the whole document that might block interactions
    document.querySelectorAll('[inert]').forEach(n => n.removeAttribute('inert'));
    document.querySelectorAll('[aria-hidden="true"]').forEach(n => n.removeAttribute('aria-hidden'));

    // Ensure dialog itself is interactive
    dlg.removeAttribute('inert');
    if (!dlg.hasAttribute('open') && typeof dlg.showModal !== 'function') {
      dlg.setAttribute('open', '');
    }
    dlg.style.pointerEvents = 'auto';

    // Re-enable all controls inside the dialog
    const controls = dlg.querySelectorAll('input, select, textarea, button');
    controls.forEach(el => {
      el.disabled = false;
      el.readOnly = false;
      el.removeAttribute('disabled');
      el.removeAttribute('readonly');
      el.removeAttribute('aria-disabled');
      if (el.style) el.style.pointerEvents = 'auto';
      if (el.getAttribute('tabindex') === '-1') el.removeAttribute('tabindex');
    });

    // Explicitly force-enable the key inputs that were reported as inactive
    ;[p_name, p_vat, p_cost, p_notes].forEach(el => {
      if (!el) return;
      el.disabled = false;
      el.readOnly = false;
      el.removeAttribute('disabled');
      el.removeAttribute('readonly');
      el.removeAttribute('aria-disabled');
      if (el.style) el.style.pointerEvents = 'auto';
    });
  }catch(_){ /* ignore */ }
}

// Stronger re-enable helper used after dialog state changes
function forceEnableAll(){
  try{
    document.querySelectorAll('[inert]').forEach(n => n.removeAttribute('inert'));
    document.querySelectorAll('[aria-hidden="true"]').forEach(n => n.removeAttribute('aria-hidden'));
    if (dlg) {
      dlg.removeAttribute('inert');
      dlg.style.pointerEvents = 'auto';
      const controls = dlg.querySelectorAll('input, select, textarea, button');
      controls.forEach(el => {
        el.disabled = false; el.readOnly = false;
        el.removeAttribute('disabled'); el.removeAttribute('readonly'); el.removeAttribute('aria-disabled');
        if (el.style) el.style.pointerEvents = 'auto';
        if (el.getAttribute('tabindex') === '-1') el.removeAttribute('tabindex');
      });
      ;[p_name, p_dt_input, p_apply_vat, p_vat, p_cost, p_payment_method, p_notes].forEach(el => {
        if (!el) return;
        el.disabled = false; el.readOnly = false;
        el.removeAttribute('disabled'); el.removeAttribute('readonly'); el.removeAttribute('aria-disabled');
        if (el.style) el.style.pointerEvents = 'auto';
      });
    }
  }catch(_){ /* ignore */ }
}

// Re-apply enabling multiple times to beat any race conditions after DOM updates
function reinforceEnable(retries = 6){
  forceEnableAll();
  // Explicitly hit the reported fields
  ;[p_name, p_vat, p_cost, p_notes].forEach(el => {
    try{
      if (!el) return;
      el.disabled = false; el.readOnly = false;
      el.removeAttribute('disabled'); el.removeAttribute('readonly'); el.removeAttribute('aria-disabled');
      if (el.style) el.style.pointerEvents = 'auto';
    }catch(_){ }
  });
  if(retries > 0){ setTimeout(()=>reinforceEnable(retries-1), 60); }
}

function openAdd(){
  editId = null;
  enableForm();
  // Ensure all fields are editable
  [p_name, p_dt_input, p_apply_vat, p_vat, p_cost, p_payment_method, p_notes].forEach(el => {
    if (!el) return;
    el.disabled = false; el.readOnly = false;
    el.removeAttribute('disabled'); el.removeAttribute('readonly'); el.removeAttribute('aria-disabled');
    if (el.style) el.style.pointerEvents = 'auto';
  });
  // Reset fields
  p_name.value = ''; p_notes.value = ''; p_cost.value = '0';
  p_vat.value = '15'; p_apply_vat.value = '1';
  if (p_payment_method) p_payment_method.value = 'cash';
  // Set current local datetime
  const now = new Date();
  const iso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  p_dt_input.value = iso; // yyyy-MM-ddTHH:mm
  compute(); setError(''); if (typeof dlg.showModal === 'function') { dlg.showModal(); } else { dlg.setAttribute('open', ''); }
  // Ensure enabling after opening as well
  setTimeout(()=>{ enableForm(); forceEnableAll(); reinforceEnable(); },0);
  // Focus name for immediate typing
  try{ p_name.disabled=false; p_name.readOnly=false; p_name.focus(); p_name.select && p_name.select(); }catch(_){}
}
function openEdit(item){
  editId = item.id;
  enableForm();
  // Ensure all fields are editable when editing
  [p_name, p_dt_input, p_apply_vat, p_vat, p_cost, p_payment_method, p_notes].forEach(el => {
    if (!el) return;
    el.disabled = false; el.readOnly = false;
    el.removeAttribute('disabled'); el.removeAttribute('readonly'); el.removeAttribute('aria-disabled');
    if (el.style) el.style.pointerEvents = 'auto';
  });
  p_name.value = item.name || ''; p_notes.value = item.notes || '';
  p_cost.value = Number(item.grand_total || 0).toFixed(2);
  p_vat.value = Number(item.vat_percent || 15);
  p_apply_vat.value = String(item.apply_vat ? 1 : 0);
  if (p_payment_method) p_payment_method.value = (item.payment_method || 'cash');
  // Prefer exact original date/time from stored purchase_at (or _display_at),
  // fallback to purchase_date at 00:00 if time isn't available
  try{
    let isoLocal = '';
    const d0 = item._display_at || item.purchase_at || item.created_at;
    if (d0) {
      const d = (d0 instanceof Date) ? d0 : new Date(String(d0).replace(' ', 'T'));
      if (!isNaN(d.getTime())) {
        // Convert to local-friendly YYYY-MM-DDTHH:mm expected by datetime-local input
        isoLocal = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      }
    }
    if (!isoLocal && item.purchase_date) {
      isoLocal = `${String(item.purchase_date)}T00:00`;
    }
    p_dt_input.value = isoLocal;
  }catch(_){ p_dt_input.value=''; }
  compute(); setError(''); if (typeof dlg.showModal === 'function') { dlg.showModal(); } else { dlg.setAttribute('open', ''); }
  // Ensure enabling after opening as well
  setTimeout(()=>{ enableForm(); forceEnableAll(); },0);
  // Focus name for immediate typing
  try{ p_name.disabled=false; p_name.readOnly=false; p_name.focus(); p_name.select && p_name.select(); }catch(_){}
}

function closeDlg(){ if(typeof dlg.close==='function'){ dlg.close(); } else { dlg.removeAttribute('open'); } }

if(dlg){
  dlg.addEventListener('close', ()=>{
    setTimeout(()=>{ enableForm(); forceEnableAll(); reinforceEnable(); },0);
    // أعِد ضبط الحقول حتى لا تبقى معطلة أو تحمل قيمًا قديمة بعد الإغلاق
    [p_name, p_dt_input, p_apply_vat, p_vat, p_cost, p_payment_method, p_notes, t_sub, t_vat, t_grand].forEach(el => {
      if (!el) return;
      el.disabled = false;
      el.readOnly = false;
      el.removeAttribute('disabled');
      el.removeAttribute('readonly');
      el.removeAttribute('aria-disabled');
      if (el.style) el.style.pointerEvents = 'auto';
      if (el.getAttribute('tabindex') === '-1') el.removeAttribute('tabindex');
    });
  });
}

dlgCancel.addEventListener('click', closeDlg);
// Permissions
let __perms = new Set();
async function loadPerms(){ try{ const u=JSON.parse(localStorage.getItem('pos_user')||'null'); if(u&&u.id){ const r=await window.api.perms_get_for_user(u.id); if(r&&r.ok){ __perms=new Set(r.keys||[]); } } }catch(_){ __perms=new Set(); } }
function canPurch(k){ return __perms.has('purchases') && __perms.has(k); }
function applyPermissions(){ try{ if(btnExportCsv && !canPurch('purchases.export_csv')) btnExportCsv.style.display='none'; if(btnExportPdf && !canPurch('purchases.export_pdf')) btnExportPdf.style.display='none'; if(btnOpenModal && !canPurch('purchases.add')) btnOpenModal.style.display='none'; }catch(_){ } }

btnOpenModal.addEventListener('click', ()=>{ if(!canPurch('purchases.add')) return; openAdd(); });

dlgSave.addEventListener('click', async () => {
  setError('');
  
  // تعطيل الزر أثناء المعالجة
  const originalText = dlgSave.innerHTML;
  dlgSave.innerHTML = '⏳ جاري الحفظ...';
  dlgSave.disabled = true;
  
  try {
    // parse datetime-local
    const dt = p_dt_input.value; // yyyy-MM-ddTHH:mm
    let purchase_date = '', purchase_time = '';
    if(dt){
      const m = dt.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/);
      if(m){
        purchase_date = m[1];
        // convert to 12h
        let hh = parseInt(m[2],10); const mm = m[3]; const ap = (hh>=12)?'PM':'AM'; hh = (hh%12)||12; purchase_time = `${String(hh).padStart(2,'0')}:${mm} ${ap}`;
      }
    }
    const payload = {
      name: (p_name.value||'').trim(),
      purchase_date,
      purchase_time,
      apply_vat: Number(p_apply_vat.value||1)===1,
      vat_percent: Number(p_vat.value||15),
      cost: Number(p_cost.value||0),
      payment_method: (p_payment_method && p_payment_method.value) || 'cash',
      notes: (p_notes.value||'').trim() || null
    };
    if(!payload.name){ 
      setError('يرجى إدخال اسم المشتريات'); 
      dlgSave.innerHTML = originalText;
      dlgSave.disabled = false;
      return; 
    }
    if(!payload.purchase_date){ 
      setError('يرجى اختيار التاريخ'); 
      dlgSave.innerHTML = originalText;
      dlgSave.disabled = false;
      return; 
    }
    if(isNaN(payload.cost) || payload.cost < 0){ 
      setError('قيمة التكلفة غير صحيحة'); 
      dlgSave.innerHTML = originalText;
      dlgSave.disabled = false;
      return; 
    }
    
    let r;
    if(editId){ r = await window.api.purchases_update(editId, payload); }
    else { r = await window.api.purchases_add(payload); }
    if(!r.ok){ 
      setError(r.error||'فشل الحفظ'); 
      dlgSave.innerHTML = originalText;
      dlgSave.disabled = false;
      return; 
    }
    
    await loadList();
    closeDlg();
  } finally {
    // استعادة الزر
    dlgSave.innerHTML = originalText;
    dlgSave.disabled = false;
  }
});

function fmtDisplay(dt){
  try{
    const d = (dt instanceof Date) ? dt : new Date(String(dt||'').replace(' ','T'));
    if(isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    let h=d.getHours(); const m=String(d.getMinutes()).padStart(2,'0'); const ap=(h>=12)?'PM':'AM'; h=(h%12)||12; const hh=String(h).padStart(2,'0');
    return `${yyyy}-${mm}-${dd} ${hh}:${m} ${ap}`;
  }catch(_){ return ''; }
}

function renderRows(items){
  tbody.innerHTML='';
  let pageItems;
  if(itemsPerPage === -1){
    pageItems = items || [];
  } else {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    pageItems = (items||[]).slice(start, end);
  }
  const start = (itemsPerPage === -1) ? 0 : ((currentPage - 1) * itemsPerPage);
  
  pageItems.forEach((it, idx) => {
    const tr = document.createElement('tr');
    const paymentIcon = (it.payment_method||'cash')==='network' ? '💳' : '💵';
    const paymentText = (it.payment_method||'cash')==='network' ? 'شبكة' : 'كاش';
    const vatIcon = it.apply_vat ? '✅' : '❌';
    const vatText = it.apply_vat ? 'نعم' : 'لا';
    
    tr.innerHTML = `
      <td class="text-center font-semibold text-slate-500">${start + idx + 1}</td>
      <td class="text-sm">${fmtDisplay(it._display_at || it.purchase_at)}</td>
      <td class="font-medium">${it.name || ''}</td>
      <td class="text-center">${paymentIcon} ${paymentText}</td>
      <td class="text-center">${vatIcon} ${vatText}</td>
      <td class="text-center font-mono">${Number(it.sub_total||0).toFixed(2)}</td>
      <td class="text-center font-mono text-slate-700">${Number(it.vat_total||0).toFixed(2)}</td>
      <td class="text-center font-mono font-bold text-green-700">${Number(it.grand_total||0).toFixed(2)}</td>
      <td class="text-sm text-slate-500">${it.notes || '—'}</td>
      <td class="text-center">
        <div class="flex gap-2 justify-center">
          ${canPurch('purchases.edit') ? `<button class="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-semibold shadow-sm text-xs" data-act="edit" data-id="${it.id}">✏️ تعديل</button>` : ''}
          ${canPurch('purchases.delete') ? `<button class="px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold shadow-sm text-xs border border-red-500" data-act="del" data-id="${it.id}">🗑️ حذف</button>` : ''}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  if (!items || items.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td colspan="10" class="text-center py-10 text-slate-500 text-base">
        📭<br><br>لا توجد مشتريات حالياً<br>
        <small class="text-sm">اضغط على "إضافة مشتريات جديدة" لبدء إضافة البيانات</small>
      </td>
    `;
    tbody.appendChild(tr);
  }
  
  updatePagination();
}

function updatePagination(){
  const totalPages = (itemsPerPage === -1) ? 1 : (Math.ceil(totalItems / itemsPerPage) || 1);
  const paginationInfo = document.getElementById('paginationInfo');
  const pageInfo = document.getElementById('pageInfo');
  const btnFirst = document.getElementById('btnFirst');
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const btnLast = document.getElementById('btnLast');
  
  const pageText = (itemsPerPage === -1) ? 'الكل' : `صفحة ${currentPage} من ${totalPages}`;
  if(paginationInfo) paginationInfo.textContent = pageText;
  if(paginationInfoTop) paginationInfoTop.textContent = pageText;
  if(pageInfo) pageInfo.textContent = `(${totalItems} عملية)`;
  
  const isFirstPage = currentPage === 1 || itemsPerPage === -1;
  const isLastPage = currentPage >= totalPages || itemsPerPage === -1;
  
  if(btnFirst) btnFirst.disabled = isFirstPage;
  if(btnPrev) btnPrev.disabled = isFirstPage;
  if(btnNext) btnNext.disabled = isLastPage;
  if(btnLast) btnLast.disabled = isLastPage;
  
  if(btnFirstTop) btnFirstTop.disabled = isFirstPage;
  if(btnPrevTop) btnPrevTop.disabled = isFirstPage;
  if(btnNextTop) btnNextTop.disabled = isLastPage;
  if(btnLastTop) btnLastTop.disabled = isLastPage;
}

tbody.addEventListener('click', async (e) => {
  const b = e.target.closest('button'); if(!b) return;
  const id = Number(b.dataset.id); const act = b.dataset.act;
  if(act==='edit'){
    const item = (currentItems||[]).find(x=>x.id===id);
    if(!item){ setError('العنصر غير موجود'); return; }
    // Normalize purchase_at to a valid Date only if needed
    if(item._display_at && !isNaN(new Date(item._display_at).getTime())){
      item.purchase_at = item._display_at;
    } else if(item.purchase_at){
      if(!(item.purchase_at instanceof Date)){
        const v = String(item.purchase_at);
        const s = v.includes('T') ? v : v.replace(' ', 'T');
        const d = new Date(s);
        if(!isNaN(d.getTime())) item.purchase_at = d;
      }
    }
    openEdit(item);
  }
  if(act==='del'){
    const ok = await miniConfirm('تأكيد حذف السجل؟');
    if(!ok) return;
    const r = await window.api.purchases_delete(id);
    if(!r.ok){ setError(r.error||'فشل الحذف'); return; }
    await loadList();
    setTimeout(()=>{ enableForm(); forceEnableAll(); reinforceEnable(); },0);
  }
});

async function loadList(){
  setError('');
  
  tbody.innerHTML = `
    <tr>
      <td colspan="10" style="text-align:center; padding:40px; color:var(--text-light);">
        ⏳ جاري تحميل البيانات...
      </td>
    </tr>
  `;
  
  try {
    const q = {}; 
    if(f_from.value) q.from_date = f_from.value; 
    if(f_to.value) q.to_date = f_to.value;
    
    const r = await window.api.purchases_list(q);
    if(!r.ok){ 
      setError(r.error||'تعذر تحميل المشتريات'); 
      tbody.innerHTML = '';
      setTimeout(()=>{ enableForm(); forceEnableAll(); },0);
      return; 
    }
    
    currentItems = (r.items||[]).map(it=>{
      if(it.purchase_at){
        const d = new Date(String(it.purchase_at).replace(' ','T'));
        if(!isNaN(d.getTime())) it._display_at = d;
      }
      return it;
    });
    
    totalItems = currentItems.length;
    renderRows(currentItems);
    setTimeout(()=>{ enableForm(); forceEnableAll(); },0);
  } catch(err) {
    setError('خطأ في الاتصال بقاعدة البيانات');
    tbody.innerHTML = '';
    setTimeout(()=>{ enableForm(); forceEnableAll(); },0);
  }
}

function exportCsv(items){
  // Add report header
  let reportHeader = [];
  reportHeader.push(['تقرير المشتريات']);
  if(f_from.value || f_to.value){
    if(f_from.value) reportHeader.push([`من: ${f_from.value}`]);
    if(f_to.value) reportHeader.push([`إلى: ${f_to.value}`]);
  }
  reportHeader.push([]); // Empty row for spacing
  
  const header = ['#','التاريخ','الاسم','طريقة الدفع','تطبيق الضريبة','الصافي','الضريبة','الإجمالي','ملاحظات'];
  let totalSub = 0;
  let totalVat = 0;
  let totalGrand = 0;
  
  const rows = items.map((it,i)=>{
    const dateStr = (()=>{
      const d0 = it._display_at || it.purchase_at || it.created_at || (it.purchase_date ? (it.purchase_date+'T00:00:00') : '');
      const d = new Date(String(d0).replace(' ','T'));
      if(isNaN(d.getTime())) return '';
      const yyyy = d.getFullYear(); const mm = String(d.getMonth()+1).padStart(2,'0'); const dd = String(d.getDate()).padStart(2,'0');
      let h=d.getHours(); const m=String(d.getMinutes()).padStart(2,'0'); const ap=(h>=12)?'PM':'AM'; h=(h%12)||12; const hh=String(h).padStart(2,'0');
      return `${yyyy}-${mm}-${dd} ${hh}:${m} ${ap}`;
    })();
    const sub = Number(it.sub_total||0);
    const vat = Number(it.vat_total||0);
    const grand = Number(it.grand_total||0);
    totalSub += sub;
    totalVat += vat;
    totalGrand += grand;
    return [
      i+1,
      dateStr,
      it.name||'', ((it.payment_method||'cash')==='network'?'شبكة':'كاش'), it.apply_vat?'نعم':'لا',
      sub.toFixed(2),
      vat.toFixed(2),
      grand.toFixed(2),
      (it.notes||'').replace(/\n/g,' ')
    ];
  });
  
  // Add totals row
  const totalsRow = ['','','','','الإجمالي', totalSub.toFixed(2), totalVat.toFixed(2), totalGrand.toFixed(2), ''];
  
  const csv = [...reportHeader, header, ...rows, totalsRow].map(r=>r.map(cell=>{
    const s = String(cell ?? '');
    if(/[",\n]/.test(s)) return '"' + s.replace(/"/g,'""') + '"';
    return s;
  }).join(',')).join('\n');
  // Arabic-friendly: add UTF-8 BOM for Excel
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='purchases.csv'; a.click();
  URL.revokeObjectURL(url);
}

async function exportPdf(items){
  // Build printable HTML with types report styling
  let totalSub = 0;
  let totalVat = 0;
  let totalGrand = 0;
  
  const rows = items.map((it,i)=>{
    const dateStr = (()=>{
      const d0 = it._display_at || it.purchase_at || it.created_at || (it.purchase_date ? (it.purchase_date+'T00:00:00') : '');
      const d = new Date(String(d0).replace(' ','T'));
      if(isNaN(d.getTime())) return '';
      const yyyy = d.getFullYear(); const mm = String(d.getMonth()+1).padStart(2,'0'); const dd = String(d.getDate()).padStart(2,'0');
      let h=d.getHours(); const m=String(d.getMinutes()).padStart(2,'0'); const ap=(h>=12)?'PM':'AM'; h=(h%12)||12; const hh=String(h).padStart(2,'0');
      return `${yyyy}-${mm}-${dd} ${hh}:${m} ${ap}`;
    })();
    const pay = ((it.payment_method||'cash')==='network') ? 'شبكة' : 'كاش';
    const sub = Number(it.sub_total||0);
    const vat = Number(it.vat_total||0);
    const grand = Number(it.grand_total||0);
    totalSub += sub;
    totalVat += vat;
    totalGrand += grand;
    return `<tr>
      <td>${i+1}</td>
      <td>${dateStr}</td>
      <td>${(it.name||'').toString().replace(/</g,'&lt;').replace(/>/g,'&gt;')}</td>
      <td>${pay}</td>
      <td>${it.apply_vat?'نعم':'لا'}</td>
      <td>${sub.toFixed(2)}</td>
      <td>${vat.toFixed(2)}</td>
      <td style="font-weight:900;">${grand.toFixed(2)}</td>
      <td>${(it.notes||'').toString().replace(/</g,'&lt;').replace(/>/g,'&gt;')}</td>
    </tr>`;
  }).join('');
  
  // Get date filter for report header
  let periodInfo = '';
  if(f_from.value || f_to.value){
    periodInfo = '<div style="font-size: 16px; font-weight: 700; color: #4b5563; margin-top: 12px; font-family: Cairo, sans-serif;">';
    if(f_from.value) periodInfo += `<div style="margin: 4px 0;">من: ${f_from.value}</div>`;
    if(f_to.value) periodInfo += `<div style="margin: 4px 0;">إلى: ${f_to.value}</div>`;
    periodInfo += '</div>';
  }
  
  const html = `<!doctype html><html lang="ar" dir="rtl"><head>
  <meta charset="utf-8"/>
  <title>تقرير المشتريات</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    
    * {
      font-family: 'Cairo', sans-serif !important;
    }
    
    body {
      background: white;
      padding: 20px;
      direction: rtl;
    }
    
    .header {
      text-align: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 4px solid #10b981;
    }
    
    h1 {
      font-size: 32px;
      font-weight: 900;
      color: #1f2937;
      margin-bottom: 8px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-bottom: 16px;
      font-weight: 700;
    }
    
    thead th {
      background: linear-gradient(to bottom, #d1fae5, #a7f3d0) !important;
      color: #065f46 !important;
      font-weight: 900 !important;
      padding: 10px 6px;
      border: 2px solid #94a3b8;
      text-align: center;
      font-size: 14px;
    }
    
    tbody td {
      padding: 8px 6px;
      border: 1px solid #cbd5e1;
      text-align: center;
      font-weight: 700;
    }
    
    tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    
    tfoot th {
      background: #d1fae5 !important;
      font-weight: 900;
      padding: 10px 6px;
      border: 2px solid #94a3b8;
      border-top: 3px solid #10b981;
      text-align: center;
      font-size: 14px;
      color: #065f46;
    }
    
    @media print {
      @page {
        size: A4;
        margin: 15mm;
      }
    }
  </style>
  </head>
  <body>
    <div class="header">
      <h1>تقرير المشتريات</h1>
      ${periodInfo}
    </div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>التاريخ</th>
          <th>الاسم</th>
          <th>طريقة الدفع</th>
          <th>ضريبة؟</th>
          <th>الصافي</th>
          <th>الضريبة</th>
          <th>الإجمالي</th>
          <th>ملاحظات</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <th colspan="5">الإجمالي</th>
          <th>${totalSub.toFixed(2)}</th>
          <th>${totalVat.toFixed(2)}</th>
          <th>${totalGrand.toFixed(2)}</th>
          <th></th>
        </tr>
      </tfoot>
    </table>
  </body>
  </html>`;
  const r = await window.api.pdf_export(html, { pageSize: 'A4', printBackground: true, saveMode: 'auto', filename: 'purchases.pdf' });
  if(!r || !r.ok){ alert('تعذر إنشاء PDF'); }
}

btnExportCsv.addEventListener('click', async ()=>{
  const r = await window.api.purchases_list({ from_date: f_from.value||undefined, to_date: f_to.value||undefined });
  if(!r.ok){ setError(r.error||'تعذر التحميل'); return; }
  exportCsv(r.items||[]);
});
btnExportPdf.addEventListener('click', async ()=>{
  const r = await window.api.purchases_list({ from_date: f_from.value||undefined, to_date: f_to.value||undefined });
  if(!r.ok){ setError(r.error||'تعذر التحميل'); return; }
  exportPdf(r.items||[]);
});

// init
(async function init(){
  const today = new Date().toISOString().slice(0,10);
  // تحميل الصلاحيات أولاً قبل عرض القائمة
  await loadPerms();
  applyPermissions();
  // لا نفتح النافذة تلقائيًا
  loadList();
})();

btnFilter.addEventListener('click', ()=>{ currentPage = 1; loadList(); });

const btnFirst = document.getElementById('btnFirst');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const btnLast = document.getElementById('btnLast');

if(btnFirst) btnFirst.addEventListener('click', ()=>{ currentPage = 1; renderRows(currentItems); });
if(btnPrev) btnPrev.addEventListener('click', ()=>{ if(currentPage > 1){ currentPage--; renderRows(currentItems); } });
if(btnNext) btnNext.addEventListener('click', ()=>{ const totalPages = Math.ceil(totalItems / itemsPerPage); if(currentPage < totalPages){ currentPage++; renderRows(currentItems); } });
if(btnLast) btnLast.addEventListener('click', ()=>{ const totalPages = Math.ceil(totalItems / itemsPerPage); currentPage = totalPages; renderRows(currentItems); });

if(btnFirstTop) btnFirstTop.addEventListener('click', ()=>{ currentPage = 1; renderRows(currentItems); });
if(btnPrevTop) btnPrevTop.addEventListener('click', ()=>{ if(currentPage > 1){ currentPage--; renderRows(currentItems); } });
if(btnNextTop) btnNextTop.addEventListener('click', ()=>{ const totalPages = Math.ceil(totalItems / itemsPerPage); if(currentPage < totalPages){ currentPage++; renderRows(currentItems); } });
if(btnLastTop) btnLastTop.addEventListener('click', ()=>{ const totalPages = Math.ceil(totalItems / itemsPerPage); currentPage = totalPages; renderRows(currentItems); });

if(itemsPerPageSelect) {
  itemsPerPageSelect.addEventListener('change', ()=>{
    const value = parseInt(itemsPerPageSelect.value);
    itemsPerPage = value;
    currentPage = 1;
    renderRows(currentItems);
  });
}