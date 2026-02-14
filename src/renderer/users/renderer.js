// Users screen renderer: CRUD via IPC
const tbody = document.getElementById('tbody');
const errorDiv = document.getElementById('error');
const noticeDiv = document.getElementById('notice');
const addUserBtn = document.getElementById('addUserBtn');
const refreshBtn = document.getElementById('refreshBtn');

const overlay = document.getElementById('overlay');
const modal = document.getElementById('modal');
const dlgTitle = document.getElementById('dlgTitle');
const dlgUsername = document.getElementById('dlgUsername');
const dlgFullname = document.getElementById('dlgFullname');
const dlgPassword = document.getElementById('dlgPassword');
const dlgPasswordToggle = document.getElementById('dlgPasswordToggle');
const dlgPasswordToggleEye = document.getElementById('dlgPasswordToggleEye');
const dlgPasswordToggleEyeOff = document.getElementById('dlgPasswordToggleEyeOff');
const dlgRole = document.getElementById('dlgRole');
const dlgActive = document.getElementById('dlgActive');
const dlgSave = document.getElementById('dlgSave');
const dlgClose = document.getElementById('dlgClose');

function setError(msg){ errorDiv.textContent = msg || ''; }
function setNotice(msg, duration = 5000){
  if(!noticeDiv) return;
  noticeDiv.textContent = msg || '';
  if(msg && duration > 0){
    setTimeout(() => { noticeDiv.textContent = ''; }, duration);
  }
}
function setPasswordVisibility(show){
  if(!dlgPassword) return;
  dlgPassword.type = show ? 'text' : 'password';
  if(dlgPasswordToggleEye) dlgPasswordToggleEye.classList.toggle('hidden', show);
  if(dlgPasswordToggleEyeOff) dlgPasswordToggleEyeOff.classList.toggle('hidden', !show);
  if(dlgPasswordToggle){
    const label = show ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور';
    dlgPasswordToggle.setAttribute('aria-label', label);
    dlgPasswordToggle.setAttribute('title', label);
  }
}
function clearDialog(){ dlgUsername.value=''; dlgFullname.value=''; dlgPassword.value=''; dlgRole.value='cashier'; dlgActive.value='1'; setPasswordVisibility(false); }

async function openDialog(title, data){
  dlgTitle.textContent = title;
  if(data){
    dlgUsername.value = data.username || '';
    dlgFullname.value = data.full_name || '';
    dlgPassword.value = data.password_hash || '';
    dlgRole.value = data.role || 'cashier';
    setPasswordVisibility(false);
    dlgActive.value = String(data.is_active ?? 1);
    dlgUsername.disabled = true; // عند التعديل لا نغير اسم المستخدم
    
    // تحقق إذا كان هذا المستخدم هو آخر مدير ظاهر
    try{
      const resList = await window.api.users_list();
      const list = resList.ok ? (resList.items||[]) : [];
      const visibleAdmins = list.filter(x => (x.role === 'admin' || x.role === 'super') && x.username !== 'superAdmin').length;
      
      if((data.role === 'admin' || data.role === 'super') && visibleAdmins <= 1){
        dlgRole.disabled = true;
        dlgRole.title = 'لا يمكن تغيير دور آخر مدير في النظام';
      } else {
        dlgRole.disabled = false;
        dlgRole.title = '';
      }
    }catch(_){
      dlgRole.disabled = false;
      dlgRole.title = '';
    }
  } else {
    clearDialog();
    dlgUsername.disabled = false;
    dlgRole.disabled = false;
    dlgRole.title = '';
  }
  overlay.classList.remove('hidden');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeDialog(){ 
  overlay.classList.add('hidden');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function miniConfirm(message, opts = {}){
  const { confirmText = 'تأكيد', cancelText = 'إلغاء' } = opts || {};
  return new Promise((resolve)=>{
    let confirmOverlay = document.getElementById('confirmOverlay');
    let confirmModal = document.getElementById('confirmModal');
    
    if(!confirmOverlay){
      confirmOverlay = document.createElement('div');
      confirmOverlay.id = 'confirmOverlay';
      confirmOverlay.className = 'fixed inset-0 bg-black bg-opacity-40 z-[60]';
      document.body.appendChild(confirmOverlay);
    }
    
    if(!confirmModal){
      confirmModal = document.createElement('div');
      confirmModal.id = 'confirmModal';
      confirmModal.className = 'fixed inset-0 flex items-center justify-center z-[70]';
      document.body.appendChild(confirmModal);
    }
    
    confirmModal.innerHTML = `
      <div class="bg-white w-full max-w-md mx-4 rounded-xl shadow-2xl border border-slate-200 p-5">
        <h3 class="text-lg font-black text-slate-800 mb-3">تأكيد</h3>
        <div class="text-sm text-slate-600 mb-5 font-medium">${message||''}</div>
        <div class="flex items-center gap-3">
          <button type="button" data-confirm class="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-sm shadow-md">${confirmText}</button>
          <button type="button" data-cancel class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-sm border border-slate-300">${cancelText}</button>
        </div>
      </div>`;
    
    confirmOverlay.classList.remove('hidden');
    confirmModal.classList.remove('hidden');
    
    const ok = confirmModal.querySelector('[data-confirm]');
    const no = confirmModal.querySelector('[data-cancel]');
    
    function finalize(v){ 
      cleanup(); 
      confirmOverlay.classList.add('hidden');
      confirmModal.classList.add('hidden');
      resolve(v); 
    }
    
    const onOk = ()=>finalize(true);
    const onNo = ()=>finalize(false);
    function cleanup(){ 
      ok?.removeEventListener('click', onOk); 
      no?.removeEventListener('click', onNo); 
      confirmOverlay?.removeEventListener('click', onNo);
    }
    
    ok?.addEventListener('click', onOk, {once:true});
    no?.addEventListener('click', onNo, {once:true});
    confirmOverlay?.addEventListener('click', onNo, {once:true});
  });
}

// Permissions
let __perms = new Set();
async function loadPerms(){ try{ const u=JSON.parse(localStorage.getItem('pos_user')||'null'); if(u&&u.id){ const r=await window.api.perms_get_for_user(u.id); if(r&&r.ok){ __perms=new Set(r.keys||[]); } } }catch(_){ __perms=new Set(); } }
function canUser(k){ return __perms.has(k); }

function renderRows(list){
  tbody.innerHTML = '';
  
  list.forEach((u, idx) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50';
    tr.innerHTML = `
      <td class="px-4 py-3 text-sm font-semibold text-slate-600">${idx+1}</td>
      <td class="px-4 py-3 text-sm font-bold text-slate-800">${u.username}</td>
      <td class="px-4 py-3 text-sm text-slate-700">${u.full_name || '-'}</td>
      <td class="px-4 py-3">
        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${u.role === 'admin' || u.role === 'super' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}">
          ${u.role === 'admin' || u.role === 'super' ? 'مدير' : 'كاشير'}
        </span>
      </td>
      <td class="px-4 py-3">
        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
          ${u.is_active ? 'نشط' : 'موقوف'}
        </span>
      </td>
      <td class="px-4 py-3">
        <div class="flex items-center justify-center gap-2 flex-wrap">
          ${canUser('users.edit') ? `<button class="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-bold text-xs shadow-sm" data-act="edit" data-id="${u.id}">تعديل</button>` : ''}
          ${canUser('users.toggle') ? `<button class="px-3 py-1.5 ${u.is_active ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white rounded-lg font-bold text-xs shadow-sm" data-act="toggle" data-id="${u.id}">${u.is_active ? 'إيقاف' : 'تفعيل'}</button>` : ''}
          ${canUser('users.delete') ? `<button class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs shadow-sm" data-act="delete" data-id="${u.id}">حذف</button>` : ''}
        </div>
      </td>`;
    tbody.appendChild(tr);
  });
  // Trigger i18n refresh so action buttons reflect current language immediately
  try{ window.__i18n_refresh && window.__i18n_refresh(); }catch(_){ }
}

async function loadUsers(){
  setError('');
  if(noticeDiv) noticeDiv.textContent = '';
  const res = await window.api.users_list();
  if(!res.ok){ setError(res.error || 'تعذر تحميل المستخدمين'); return; }
  const list = res.items || [];
  renderRows(list);
}

(async()=>{ await loadPerms(); try{ if(addUserBtn && !canUser('users.add')) addUserBtn.style.display='none'; }catch(_){ } await loadUsers(); })();

addUserBtn.addEventListener('click', async () => { if(!canUser('users.add')) return; await openDialog('إضافة مستخدم'); });
refreshBtn.addEventListener('click', loadUsers);

dlgClose.addEventListener('click', closeDialog);
overlay.addEventListener('click', closeDialog);
if(dlgPasswordToggle){
  dlgPasswordToggle.addEventListener('click', () => {
    const isVisible = dlgPassword.type === 'text';
    setPasswordVisibility(!isVisible);
  });
}

dlgSave.addEventListener('click', async () => {
  setError('');
  setNotice('');
  const payload = {
    username: dlgUsername.value.trim(),
    full_name: dlgFullname.value.trim(),
    password: dlgPassword.value,
    role: dlgRole.value,
    is_active: dlgActive.value === '1' ? 1 : 0,
  };
  if(!payload.username){ setError('يرجى إدخال اسم المستخدم'); return; }

  const editing = dlgUsername.disabled;
  
  if(editing){
    try{
      const resList = await window.api.users_list();
      const list = resList.ok ? (resList.items||[]) : [];
      const currentUser = list.find(x => x.username === payload.username);
      const visibleAdmins = list.filter(x => (x.role === 'admin' || x.role === 'super') && x.username !== 'superAdmin').length;
      
      if(currentUser && (currentUser.role === 'admin' || currentUser.role === 'super') && payload.role !== 'admin' && payload.role !== 'super' && visibleAdmins <= 1){
        setNotice('⚠️ تحذير: لا يمكن تغيير دور آخر مدير في النظام. يجب وجود مدير واحد على الأقل.', 6000);
        return;
      }
    }catch(_){ }
  }

  let res;
  if(editing){
    res = await window.api.users_update(payload.username, payload);
  } else {
    if(!payload.password){ setError('يرجى إدخال كلمة المرور'); return; }
    res = await window.api.users_add(payload);
  }
  if(!res.ok){ setError(res.error || 'فشل الحفظ'); return; }
  closeDialog();
  await loadUsers();
});

tbody.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if(!btn) return;
  const id = Number(btn.dataset.id);
  const act = btn.dataset.act;
  setError('');

  if(act === 'edit'){
    if(!canUser('users.edit')) return;
    const res = await window.api.users_get(id);
    if(!res.ok){ setError(res.error || 'تعذر جلب المستخدم'); return; }
    await openDialog('تعديل مستخدم', res.item);
  }
  if(act === 'toggle'){
    if(!canUser('users.toggle')) return;
    // تحقق محلي قبل الطلب: منع إيقاف آخر مدير نشط وإظهار التنبيه فقط عند المحاولة
    try{
      const resList = await window.api.users_list();
      const list = resList.ok ? (resList.items||[]) : [];
      const target = list.find(x => Number(x.id)===Number(id));
      const activeVisibleAdmins = list.filter(x => (x.role==='admin' || x.role==='super') && Number(x.is_active) && x.username !== 'superAdmin').length;
      if(target && (target.role==='admin' || target.role==='super') && Number(target.is_active)===1 && activeVisibleAdmins<=1){
        if(noticeDiv){ noticeDiv.textContent = 'تنبيه: يوجد مدير واحد نشط فقط. لن يسمح التطبيق بإيقافه.'; }
        return;
      }
    }catch(_){ /* في حال فشل الجلب، سيمنع الباك-إند */ }

    const res = await window.api.users_toggle(id);
    if(!res.ok){ setError(res.error || 'فشل تحديث الحالة'); return; }
    await loadUsers();
  }
  if(act === 'delete'){
    if(!canUser('users.delete')) return;
    if(!(await miniConfirm('تأكيد حذف المستخدم؟'))) return;
    const res = await window.api.users_delete(id);
    if(!res.ok){ setError(res.error || 'فشل الحذف'); return; }
    await loadUsers();
  }
});
