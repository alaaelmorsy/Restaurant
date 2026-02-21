// Types management with card UI + modal add/edit + confirm delete

const grid = document.getElementById('grid');
const errorDiv = document.getElementById('error');

// Modal elements
const overlay = document.getElementById('overlay');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const mName = document.getElementById('m_name');
const mNameEn = document.getElementById('m_name_en');
const mSave = document.getElementById('m_save');
const mCancel = document.getElementById('m_cancel');
const openAdd = document.getElementById('openAdd');
const refreshBtn = document.getElementById('refreshBtn');

// Permissions (admin always sees actions)
let __perms = new Set();
let __isAdmin = false;
async function loadPerms(){
  try{
    const u = JSON.parse(localStorage.getItem('pos_user')||'null');
    __isAdmin = !!(u && String(u.role||'').toLowerCase()==='admin');
    if(u && u.id){
      const r = await window.api.perms_get_for_user(u.id);
      if(r && r.ok){ __perms = new Set(r.keys||[]); }
    }
  }catch(_){ __perms = new Set(); __isAdmin = false; }
}
function canType(k){ return __isAdmin || __perms.has(k); }

// Load perms early and hide add button if not allowed
(async()=>{ await loadPerms(); try{ if(openAdd && !canType('types.add')) openAdd.style.display='none'; }catch(_){ } })();

// Confirm modal elements
const cOverlay = document.getElementById('confirmOverlay');
const cModal = document.getElementById('confirmModal');
const cTitle = document.getElementById('c_title');
const cMessage = document.getElementById('c_message');
const cOk = document.getElementById('c_ok');
const cCancel = document.getElementById('c_cancel');

let modalMode = 'add'; // 'add' | 'edit'
let editId = null;

function setError(msg){ errorDiv.textContent = msg || ''; }

function showModal(mode, opts = {}){
  modalMode = mode;
  editId = opts.id ?? null;
  modalTitle.textContent = mode === 'add' ? 'إضافة نوع رئيسي' : 'تعديل نوع رئيسي';
  mName.value = (opts.name || '').trim();
  mNameEn.value = (opts.name_en || '').trim();
  overlay.classList.remove('hidden');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  setTimeout(() => mName.focus(), 0);
}

function hideModal(){
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  overlay.classList.add('hidden');
  mName.value = '';
  mNameEn.value = '';
  editId = null;
}

function showConfirm({ title = 'تأكيد', message = '', onOk }){
  cTitle.textContent = title;
  cMessage.textContent = message;
  cOverlay.classList.remove('hidden');
  cModal.classList.remove('hidden');
  cModal.classList.add('flex');

  function cleanup(){
    cModal.classList.add('hidden');
    cModal.classList.remove('flex');
    cOverlay.classList.add('hidden');
    cOk.removeEventListener('click', okHandler);
    cCancel.removeEventListener('click', cancelHandler);
    window.removeEventListener('keydown', keyHandler);
  }
  function okHandler(){ cleanup(); onOk && onOk(); }
  function cancelHandler(){ cleanup(); }
  function keyHandler(e){ if(e.key === 'Escape'){ cleanup(); } }
  cOk.addEventListener('click', okHandler);
  cCancel.addEventListener('click', cancelHandler);
  window.addEventListener('keydown', keyHandler);
}

let currentItems = [];
function renderCards(items){
  currentItems = Array.isArray(items)? items.slice() : [];
  grid.innerHTML = '';
  (currentItems||[]).forEach((t, idx) => {
    const card = document.createElement('div');
    card.className = 'type-card bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md cursor-move';
    card.setAttribute('draggable','true');
    card.dataset.index = String(idx);
    const active = !!t.is_active;
    const actionsHtml = `
      <div class="flex items-center gap-1.5 pt-3 border-t border-slate-100">
        ${canType('types.edit') ? `<button class="flex-1 px-2.5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold shadow-sm flex items-center justify-center gap-1.5" data-act="edit" data-id="${t.id}" data-name="${attrEscape(t.name)}" data-name-en="${attrEscape(t.name_en||'')}"><span>✏️</span><span>تعديل</span></button>` : ''}
        ${canType('types.toggle') ? `<button class="flex-1 px-2.5 py-2 ${active ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-500 hover:bg-green-600'} text-white rounded-lg text-xs font-bold shadow-sm flex items-center justify-center gap-1.5" data-act="toggle" data-id="${t.id}"><span>${active ? '⏸️' : '▶️'}</span><span>${active ? 'إيقاف' : 'تفعيل'}</span></button>` : ''}
        ${canType('types.delete') ? `<button class="flex-1 px-2.5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold shadow-sm flex items-center justify-center gap-1.5" data-act="delete" data-id="${t.id}"><span>🗑️</span><span>حذف</span></button>` : ''}
      </div>`;
    card.innerHTML = `
      <div class="flex items-start justify-between mb-2">
        <div>
          <div class="text-base font-black text-slate-800">${escapeHtml(t.name)}</div>
          ${t.name_en ? `<div class="text-xs text-slate-500 font-medium mt-0.5" dir="ltr">${escapeHtml(t.name_en)}</div>` : ''}
        </div>
        <span class="inline-block px-2.5 py-1 rounded-full text-xs font-bold ${active ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}">${active ? 'نشط' : 'موقوف'}</span>
      </div>
      <div class="text-xs text-slate-500 font-medium mb-1">#${t.id} · ترتيب: ${Number(t.sort_order||0)}</div>
      ${actionsHtml}
    `;
    // Drag events
    card.addEventListener('dragstart', (e)=>{
      window.__type_dragIndex = idx;
      try{ e.dataTransfer.effectAllowed = 'move'; }catch(_){ }
    });
    card.addEventListener('dragover', (e)=>{ e.preventDefault(); card.classList.add('drag-over'); });
    card.addEventListener('dragleave', ()=> card.classList.remove('drag-over'));
    card.addEventListener('drop', async (e)=>{
      e.preventDefault(); card.classList.remove('drag-over');
      const from = Number(window.__type_dragIndex);
      const to = Number(card.dataset.index);
      if(isNaN(from) || isNaN(to) || from===to) return;
      const it = currentItems.splice(from,1)[0];
      currentItems.splice(to,0,it);
      // apply new sort orders
      const updates = currentItems.map((x,i)=>({ id: x.id, sort_order: i }));
      const r = await window.api.types_reorder(updates);
      if(!r.ok){ setError(r.error || 'فشل حفظ الترتيب'); return; }
      await loadTypes();
    });
    grid.appendChild(card);
  });
}

function escapeHtml(s){
  return String(s).replace(/[&<>"]+/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
}
function attrEscape(s){
  return String(s).replace(/"/g, '&quot;');
}

async function loadTypes(){
  setError('');
  const res = await window.api.types_list_all();
  if(!res.ok){ setError(res.error || 'تعذر تحميل الأنواع'); return; }
  renderCards(res.items);
}

// Open add modal
openAdd.addEventListener('click', () => {
  if(!canType('types.add')) return;
  setError('');
  showModal('add');
});

// Refresh button
refreshBtn?.addEventListener('click', () => loadTypes());

// Modal actions
mCancel.addEventListener('click', hideModal);
overlay.addEventListener('click', hideModal);

mSave.addEventListener('click', async () => {
  const name = (mName.value || '').trim();
  if(!name){ setError('يرجى إدخال اسم النوع'); mName.focus(); return; }
  const name_en = (mNameEn.value || '').trim() || null;
  setError('');
  if(modalMode === 'add'){
    const res = await window.api.types_add({ name, name_en });
    if(!res.ok){ setError(res.error || 'فشل الحفظ'); return; }
  } else if(modalMode === 'edit' && editId){
    const res = await window.api.types_update(editId, { name, name_en });
    if(!res.ok){ setError(res.error || 'فشل التعديل'); return; }
  }
  hideModal();
  await loadTypes();
});

// Enter key to save inside modal
mName.addEventListener('keydown', (e) => {
  if(e.key === 'Enter'){
    e.preventDefault();
    mSave.click();
  }
});

// Grid actions: edit, toggle, delete
grid.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if(!btn) return;
  const id = Number(btn.dataset.id);
  const act = btn.dataset.act;
  setError('');

  if(act === 'edit'){
    if(!canType('types.edit')) return;
    const name = btn.dataset.name || '';
    const name_en = btn.dataset.nameEn || '';
    showModal('edit', { id, name, name_en });
    return;
  }

  if(act === 'toggle'){
    if(!canType('types.toggle')) return;
    const r = await window.api.types_toggle(id);
    if(!r.ok){ setError(r.error || 'فشل تحديث الحالة'); return; }
    await loadTypes();
    return;
  }

  if(act === 'delete'){
    if(!canType('types.delete')) return;
    showConfirm({
      title: 'تأكيد الحذف',
      message: 'هل تريد حذف هذا النوع بشكل نهائي؟',
      onOk: async () => {
        const r = await window.api.types_delete(id);
        if(!r.ok){ setError(r.error || 'فشل الحذف'); return; }
        await loadTypes();
      }
    });
    return;
  }
});

// Initial
loadTypes();