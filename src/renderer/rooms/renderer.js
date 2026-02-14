// Rooms UI: manage rooms list locally and open sales with room context
const roomsWrap = document.getElementById('rooms');
const addRoomBtn = document.getElementById('addRoom');

// Permissions
let __perms = new Set();
async function loadPerms(){ try{ const u=JSON.parse(localStorage.getItem('pos_user')||'null'); if(u&&u.id){ const r=await window.api.perms_get_for_user(u.id); if(r&&r.ok){ __perms=new Set(r.keys||[]); } } }catch(_){ __perms=new Set(); } }
function canRoom(k){ return __perms.has(k); }
(async()=>{ await loadPerms(); try{ if(addRoomBtn && !canRoom('rooms.add')) addRoomBtn.style.display='none'; }catch(_){ } })();
function miniConfirm(message, opts = {}){
  const { confirmText = 'تأكيد', cancelText = 'إلغاء' } = opts || {};
  return new Promise((resolve)=>{
    let d = document.getElementById('miniConfirmDialog');
    if(!d){
      d = document.createElement('dialog');
      d.id = 'miniConfirmDialog';
      d.className = 'rounded-2xl shadow-2xl border-0 p-0 max-w-md w-11/12';
      d.style.position='fixed';
      d.style.top='50%';
      d.style.left='50%';
      d.style.transform='translate(-50%,-50%)';
      d.style.margin='0';
      d.style.zIndex='2147483647';
      document.body.appendChild(d);
      let s = document.getElementById('miniConfirmBackdropStyle');
      if(!s){ s=document.createElement('style'); s.id='miniConfirmBackdropStyle'; s.textContent='#miniConfirmDialog::backdrop{background:rgba(0,0,0,0.5)}'; document.head.appendChild(s); }
    }
    d.innerHTML = `
      <div class="bg-white rounded-2xl overflow-hidden">
        <div class="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4">
          <h3 class="text-lg font-black">تأكيد الحذف</h3>
        </div>
        <div class="p-6">
          <p class="text-gray-700 font-semibold text-base">${message||''}</p>
        </div>
        <div class="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t-2 border-gray-200">
          <button type="button" data-cancel class="px-6 py-3 bg-gray-300 text-gray-800 font-bold rounded-xl">${cancelText}</button>
          <button type="button" data-confirm class="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl shadow-lg">${confirmText}</button>
        </div>
      </div>`;
    const ok = d.querySelector('[data-confirm]');
    const no = d.querySelector('[data-cancel]');
    function finalize(v){ cleanup(); try{ if(d.open) d.close(); }catch(_){} resolve(v); }
    const onOk = ()=>finalize(true);
    const onNo = ()=>finalize(false);
    function cleanup(){ ok?.removeEventListener('click', onOk); no?.removeEventListener('click', onNo); d.removeEventListener('cancel', onNo); }
    ok?.addEventListener('click', onOk, {once:true});
    no?.addEventListener('click', onNo, {once:true});
    d.addEventListener('cancel', onNo, {once:true});
    try{ d.showModal(); }catch(_){ d.show(); }
  });
}

// Modal elements
const dlg = document.getElementById('roomModal');
const dlgTitle = document.getElementById('roomModalTitle');
const mName = document.getElementById('mRoomName');
const mSection = document.getElementById('mRoomSection');
const mCapacity = document.getElementById('mRoomCapacity');
const btnCancel = document.getElementById('roomCancel');
const btnSave = document.getElementById('roomSave');

async function fetchRooms(){ try{ const r = await window.api.rooms_list(); return r.ok ? (r.items||[]) : []; }catch(_){ return []; } }
async function addRoom(payload){ try{ return await window.api.rooms_add(payload); }catch(_){ return { ok:false }; }
}
async function updateRoom(id, payload){ try{ return await window.api.rooms_update(id, payload); }catch(_){ return { ok:false }; } }
async function deleteRoom(id){ try{ return await window.api.rooms_delete(id); }catch(_){ return { ok:false }; } }
async function getSession(room_id){ try{ return await window.api.rooms_get_session(room_id); }catch(_){ return { ok:false }; } }
async function openSession(room_id){ try{ return await window.api.rooms_open_session(room_id); }catch(_){ return { ok:false }; } }
async function saveCart(room_id, cart){ try{ return await window.api.rooms_save_cart(room_id, cart); }catch(_){ return { ok:false }; } }
async function setStatus(room_id, status){ try{ return await window.api.rooms_set_status(room_id, status); }catch(_){ return { ok:false }; } }
async function clearRoom(room_id){ try{ return await window.api.rooms_clear(room_id); }catch(_){ return { ok:false }; } }

function cartKey(id){ return `cart:room:${String(id)}`; }

async function render(){
  const list = await fetchRooms();
  roomsWrap.innerHTML = '';
  list.forEach(r => {
    const card = document.createElement('div');
    const count = Number(r.cart_count || 0);
    const isBusy = (count>0);
    
    // تصميم Tailwind بدون تأثيرات حركية
    card.className = `bg-white rounded-2xl shadow-xl p-6 cursor-pointer border-2 ${
      isBusy 
        ? 'border-red-400 bg-red-50' 
        : 'border-transparent'
    }`;
    
    // أيقونة الغرفة بلون مختلف حسب الحالة
    const iconBg = isBusy 
      ? 'background: linear-gradient(135deg, #ef4444, #f87171);' 
      : 'background: linear-gradient(135deg, #22c55e, #86efac);';
    
    card.innerHTML = `
      <div class="flex flex-col items-center text-center">
        <div class="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg mb-4" style="${iconBg}">
          <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
        </div>
        <h3 class="text-xl font-black text-gray-800 mb-2">
          ${escapeHtml(r.name)}${r.section ? (' • ' + escapeHtml(r.section)) : ''}
        </h3>
        <p class="text-sm font-semibold mb-4 ${count>0 ? 'text-red-600' : 'text-gray-600'}">
          ${count>0 ? ('مشغولة • ' + count + ' صنف') : 'السلة فارغة'}
        </p>
        <div class="flex gap-2 flex-wrap justify-center">
          ${canRoom('rooms.edit') ? `<button class="px-4 py-2 bg-blue-500 text-white font-bold rounded-lg shadow" data-act="rename">✏️ تعديل</button>` : ''}
          ${canRoom('rooms.delete') ? `<button class="px-4 py-2 bg-red-500 text-white font-bold rounded-lg shadow" data-act="delete">🗑️ حذف</button>` : ''}
        </div>
      </div>
    `;
    
    card.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if(b){
        const act = b.dataset.act;
        if(act==='rename'){
          if(!canRoom('rooms.edit')) return;
          openRoomModal({ mode: 'edit', room: r });
        } else if(act==='delete'){
          if(!canRoom('rooms.delete')) return;
          miniConfirm('حذف الغرفة؟ سيتم حذف الجلسة الخاصة بها').then(ok=>{ if(!ok) return;
            deleteRoom(r.id).then(render);
          });
        }
        return;
      }
      // click on card: open room
      openSession(r.id).then(()=>{ window.location.href = `../sales/index.html?room=${encodeURIComponent(r.id)}`; });
    });
    roomsWrap.appendChild(card);
  });
}

function escapeHtml(s){ return String(s||'').replace(/[&<>\"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch])); }

let __editRoomId = null;
function openRoomModal({ mode, room } = {}){
  __editRoomId = null;
  if(mode==='edit' && room){
    __editRoomId = room.id;
    dlgTitle.textContent = 'تعديل غرفة';
    mName.value = room.name || '';
    mSection.value = room.section || '';
    mCapacity.value = String(room.capacity || 1);
  } else {
    dlgTitle.textContent = 'إضافة غرفة';
    mName.value = '';
    mSection.value = '';
    mCapacity.value = '1';
  }
  try{ dlg.showModal(); }catch(_){ dlg.setAttribute('open',''); }
}

addRoomBtn.addEventListener('click', () => { if(!canRoom('rooms.add')) return; openRoomModal({ mode:'add' }); });
btnCancel.addEventListener('click', () => { try{ dlg.close(); }catch(_){ dlg.removeAttribute('open'); } });
btnSave.addEventListener('click', async () => {
  const name = (mName.value||'').trim();
  const section = (mSection.value||'').trim();
  const capacity = Math.max(1, Number(mCapacity.value||1));
  if(!name){ mName.focus(); return; }
  if(__editRoomId){
    const r = await updateRoom(__editRoomId, { name, section, capacity });
    if(r && r.ok){ try{ dlg.close(); }catch(_){ dlg.removeAttribute('open'); } await render(); }
  } else {
    const r = await addRoom({ name, section, capacity });
    if(r && r.ok){ try{ dlg.close(); }catch(_){ dlg.removeAttribute('open'); } await render(); await openSession(r.id); window.location.href = `../sales/index.html?room=${encodeURIComponent(r.id)}`; }
  }
});



// زر العودة إلى الرئيسية
try{
  const btnHome = document.getElementById('btnBackHome');
  if(btnHome){ btnHome.addEventListener('click', () => { window.location.href = '../main/index.html'; }); }
}catch(_){ }

render();