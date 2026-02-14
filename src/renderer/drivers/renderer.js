// Drivers screen renderer
const btnBackHome = document.getElementById('btnBackHome');
if(btnBackHome){ btnBackHome.onclick = ()=>{ window.location.href = '../main/index.html'; }; }

const dSearch = document.getElementById('dSearch');
const dTbody = document.getElementById('dTbody');
const addBtn = document.getElementById('addBtn');
const dlg = document.getElementById('dlg');
const dlgTitle = document.getElementById('dlgTitle');
const f_name = document.getElementById('f_name');
const f_phone = document.getElementById('f_phone');
const dlgSave = document.getElementById('dlgSave');
const dlgCancel = document.getElementById('dlgCancel');

const confirmDialog = document.getElementById('confirmDialog');
const confirmTitle = document.getElementById('confirmTitle');
const confirmMessage = document.getElementById('confirmMessage');
const confirmOk = document.getElementById('confirmOk');
const confirmCancel = document.getElementById('confirmCancel');

let currentEditId = null;
let confirmResolve = null;

// Permissions (child-only)
let __perms = new Set();
async function loadPerms(){
  try{
    const u = JSON.parse(localStorage.getItem('pos_user')||'null');
    if(u && u.id){ const r = await window.api.perms_get_for_user(u.id); if(r && r.ok){ __perms = new Set(r.keys||[]); } }
  }catch(_){ __perms = new Set(); }
}
function canDrv(k){ return __perms.has('drivers') && __perms.has(k); }

function rowTpl(d){
  const statusIcon = d.active ? '✅' : '⏸️';
  const statusText = d.active ? 'نشط' : 'موقوف';
  const statusBg = d.active ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-300 text-green-700' : 'bg-gradient-to-r from-red-50 to-red-100 border-red-300 text-red-700';
  const toggleIcon = d.active ? '⏸️' : '▶️';
  const toggleText = d.active ? 'إيقاف' : 'تنشيط';
  const toggleBtn = d.active 
    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white border border-red-500 hover:from-red-700 hover:to-red-800' 
    : 'bg-gradient-to-r from-green-600 to-green-700 text-white border border-green-500 hover:from-green-700 hover:to-green-800';
  
  return `<tr class="hover:bg-slate-50">
    <td class="px-5 py-3">
      <div class="font-semibold text-slate-700">${d.name||'-'}</div>
    </td>
    <td class="px-5 py-3">
      <div class="text-slate-600">${d.phone||'-'}</div>
    </td>
    <td class="px-5 py-3 text-center">
      <span class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border-2 ${statusBg}">${statusIcon} ${statusText}</span>
    </td>
    <td class="px-5 py-3 text-center">
      <div class="flex items-center justify-center gap-2">
        ${canDrv('drivers.edit') ? `<button data-act="edit" data-id="${d.id}" data-name="${(d.name||'').replace(/"/g,'&quot;')}" data-phone="${(d.phone||'').replace(/"/g,'&quot;')}" class="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold text-sm shadow-md border border-blue-500 hover:from-blue-700 hover:to-blue-800 whitespace-nowrap">✏️ تعديل</button>` : ''}
        ${canDrv('drivers.toggle') ? `<button data-act="toggle" data-id="${d.id}" class="px-3 py-1.5 rounded-lg font-semibold text-sm shadow-md ${toggleBtn} whitespace-nowrap">${toggleIcon} ${toggleText}</button>` : ''}
        ${canDrv('drivers.delete') ? `<button data-act="delete" data-id="${d.id}" data-name="${(d.name||'').replace(/"/g,'&quot;')}" class="px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold text-sm shadow-md border border-red-500 hover:from-red-700 hover:to-red-800 whitespace-nowrap">🗑️ حذف</button>` : ''}
      </div>
    </td>
  </tr>`;
}

async function load(term){
  // إظهار مؤشر تحميل
  dTbody.innerHTML = `
    <tr>
      <td colspan="4" class="text-center py-10 text-slate-500">
        ⏳ جاري تحميل البيانات...
      </td>
    </tr>
  `;
  
  try {
    const r = await window.api.drivers_list({ term: term||'', only_active: 0 });
    if(r && r.ok){
      const items = r.items || [];
      if(items.length > 0){
        dTbody.innerHTML = items.map(rowTpl).join('');
      } else {
        // رسالة عندما لا توجد بيانات
        const emptyMessage = term ? 
          `<tr>
            <td colspan="4" class="empty-state">
              <h3>🔍 لا توجد نتائج</h3>
              <p>لم يتم العثور على سائقون يطابقون البحث "${term}"</p>
            </td>
          </tr>` :
          `<tr>
            <td colspan="4" class="empty-state">
              <h3>🚗 لا يوجد سائقون حالياً</h3>
              <p>ابدأ بإضافة سائق جديد من الأعلى</p>
            </td>
          </tr>`;
        dTbody.innerHTML = emptyMessage;
      }
    } else {
      // خطأ في التحميل
      dTbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-10 text-red-600">
            ❌ حدث خطأ في تحميل البيانات<br>
            <small>يرجى المحاولة مرة أخرى</small>
          </td>
        </tr>
      `;
    }
  } catch(err) {
    dTbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center py-10 text-red-600">
          ❌ خطأ في الاتصال بقاعدة البيانات<br>
          <small>${err.message || 'يرجى المحاولة مرة أخرى'}</small>
        </td>
      </tr>
    `;
  }
}

function openAddDialog(){
  if(!canDrv('drivers.add')) return;
  currentEditId = null;
  dlgTitle.textContent = '➕ إضافة سائق جديد';
  f_name.value = '';
  f_phone.value = '';
  dlg.showModal();
  f_name.focus();
}

function openEditDialog(id, name, phone){
  if(!canDrv('drivers.edit')) return;
  currentEditId = id;
  dlgTitle.textContent = '✏️ تعديل بيانات السائق';
  f_name.value = name || '';
  f_phone.value = phone || '';
  dlg.showModal();
  f_name.focus();
}

function closeDialog(){
  dlg.close();
  currentEditId = null;
  f_name.value = '';
  f_phone.value = '';
}

function showConfirm(message, title = 'تأكيد الحذف'){
  return new Promise((resolve) => {
    confirmResolve = resolve;
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmDialog.showModal();
  });
}

function handleConfirmOk(){
  if(confirmResolve){
    confirmResolve(true);
    confirmResolve = null;
  }
  confirmDialog.close();
}

function handleConfirmCancel(){
  if(confirmResolve){
    confirmResolve(false);
    confirmResolve = null;
  }
  confirmDialog.close();
}

async function saveDriver(){
  const name = (f_name.value||'').trim();
  const phone = (f_phone.value||'').trim();
  
  if(!name){ 
    showToast('يرجى إدخال اسم السائق', 'warning'); 
    f_name.focus();
    return; 
  }
  
  // تعطيل الزر أثناء المعالجة
  const originalText = dlgSave.innerHTML;
  dlgSave.innerHTML = '⏳ جاري الحفظ...';
  dlgSave.disabled = true;
  
  try {
    let r;
    if(currentEditId){
      // تعديل
      r = await window.api.drivers_update(currentEditId, { name, phone });
      if(r && r.ok){ 
        showToast('تم تحديث البيانات بنجاح', 'success');
        closeDialog();
        await load(dSearch.value||''); 
      } else {
        showToast('فشل في تحديث البيانات', 'error');
      }
    } else {
      // إضافة جديد
      r = await window.api.drivers_add({ name, phone });
      if(r && r.ok){ 
        showToast('تم إضافة السائق بنجاح', 'success');
        closeDialog();
        await load(dSearch.value||''); 
      } else {
        showToast('فشل في إضافة السائق', 'error');
      }
    }
  } catch(err) {
    showToast('خطأ في الاتصال', 'error');
  } finally {
    // استعادة الزر
    dlgSave.innerHTML = originalText;
    dlgSave.disabled = false;
  }
}

function showToast(message, type = 'success', duration = 3000){
  const container = document.getElementById('toastContainer');
  if(!container) return;
  
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, duration);
}

(async()=>{ 
  await loadPerms(); 
  try{ 
    if(addBtn && !canDrv('drivers.add')) addBtn.style.display='none'; 
  }catch(_){ } 
  await load(dSearch?.value||''); 
})();

// Dialog events
addBtn?.addEventListener('click', openAddDialog);
dlgCancel?.addEventListener('click', closeDialog);
dlgSave?.addEventListener('click', saveDriver);

// Confirm dialog events
confirmOk?.addEventListener('click', handleConfirmOk);
confirmCancel?.addEventListener('click', handleConfirmCancel);

// إضافة دعم مفتاح Enter في حقول النافذة المنبثقة
f_name?.addEventListener('keypress', (e) => {
  if(e.key === 'Enter') {
    e.preventDefault();
    if(f_phone) f_phone.focus();
    else saveDriver();
  }
});

f_phone?.addEventListener('keypress', (e) => {
  if(e.key === 'Enter') {
    e.preventDefault();
    saveDriver();
  }
});

// إغلاق النافذة بزر Escape
dlg?.addEventListener('keydown', (e) => {
  if(e.key === 'Escape') {
    e.preventDefault();
    closeDialog();
  }
});

// إغلاق نافذة التأكيد بزر Escape وتأكيد بزر Enter
confirmDialog?.addEventListener('keydown', (e) => {
  if(e.key === 'Escape') {
    e.preventDefault();
    handleConfirmCancel();
  } else if(e.key === 'Enter') {
    e.preventDefault();
    handleConfirmOk();
  }
});

dSearch?.addEventListener('keypress', (e) => {
  if(e.key === 'Enter') {
    e.preventDefault();
    load(dSearch.value||'');
  }
});

dSearch?.addEventListener('input', ()=> load(dSearch.value||''));

dTbody?.addEventListener('click', async (ev) => {
  const btn = ev.target.closest('button'); 
  if(!btn) return;
  
  const id = Number(btn.getAttribute('data-id'));
  const act = btn.getAttribute('data-act');
  const originalText = btn.innerHTML;
  
  if(act==='edit'){
    const name = btn.getAttribute('data-name');
    const phone = btn.getAttribute('data-phone');
    openEditDialog(id, name, phone);
    
  } else if(act==='toggle'){
    if(!canDrv('drivers.toggle')) return;
    
    btn.innerHTML = '⏳ جاري التحديث...';
    btn.disabled = true;
    
    try {
      const result = await window.api.drivers_toggle(id);
      if(result && result.ok) {
        showToast('تم تحديث حالة السائق', 'success');
      } else {
        showToast('فشل في تحديث الحالة', 'error');
      }
      await load(dSearch.value||'');
    } catch(err) {
      showToast('خطأ في الاتصال', 'error');
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
    
  } else if(act==='delete'){
    if(!canDrv('drivers.delete')) return;
    
    const driverName = btn.getAttribute('data-name') || 'هذا السائق';
    
    const confirmed = await showConfirm(
      `سيتم حذف السائق "${driverName}" نهائياً ولا يمكن التراجع عن هذا الإجراء.`,
      'تأكيد حذف السائق'
    );
    
    if(confirmed){
      btn.innerHTML = '⏳ جاري الحذف...';
      btn.disabled = true;
      
      try {
        const result = await window.api.drivers_delete(id);
        if(result && result.ok) {
          showToast('تم حذف السائق بنجاح', 'success');
          await load(dSearch.value||'');
        } else {
          showToast('فشل في حذف السائق', 'error');
          btn.innerHTML = originalText;
          btn.disabled = false;
        }
      } catch(err) {
        showToast('خطأ في الاتصال', 'error');
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    }
  }
});