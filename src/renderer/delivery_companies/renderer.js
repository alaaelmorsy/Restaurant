const btnBackHome = document.getElementById('btnBackHome');
if(btnBackHome){ btnBackHome.onclick = ()=>{ window.location.href = '../main/index.html'; }; }

const dSearch = document.getElementById('dSearch');
const dTbody = document.getElementById('dTbody');
const addBtn = document.getElementById('addBtn');
const dlg = document.getElementById('dlg');
const dlgTitle = document.getElementById('dlgTitle');
const f_name = document.getElementById('f_name');
const f_discount = document.getElementById('f_discount');
const dlgSave = document.getElementById('dlgSave');
const dlgCancel = document.getElementById('dlgCancel');
const confirmDialog = document.getElementById('confirmDialog');
const confirmTitle = document.getElementById('confirmTitle');
const confirmMessage = document.getElementById('confirmMessage');
const confirmOk = document.getElementById('confirmOk');
const confirmCancel = document.getElementById('confirmCancel');
let currentEditId = null;
let confirmResolve = null;

let __perms = new Set();
async function loadPerms(){
  try{
    const u = JSON.parse(localStorage.getItem('pos_user')||'null');
    if(u && u.id){ const r = await window.api.perms_get_for_user(u.id); if(r && r.ok){ __perms = new Set(r.keys||[]); } }
  }catch(_){ __perms = new Set(); }
}
function canPerm(k){ return __perms.has('delivery_companies') && __perms.has(k); }

function rowTpl(d){
  const active = Number(d.active||0) === 1;
  return `<tr>
    <td class="px-5 py-3">${d.id}</td>
    <td class="px-5 py-3">${d.name||''}</td>
    <td class="px-5 py-3">${Number(d.discount_percent||0).toFixed(2)}%</td>
    <td class="px-5 py-3 text-center">${active ? 'نشط' : 'موقوف'}</td>
    <td class="px-5 py-3 text-center">
      ${canPerm('delivery_companies.edit') ? `<button data-act="edit" data-id="${d.id}" data-name="${(d.name||'').replace(/"/g,'&quot;')}" data-discount="${Number(d.discount_percent||0)}" class="px-2 py-1 bg-blue-600 text-white rounded">تعديل</button>` : ''}
      ${canPerm('delivery_companies.toggle') ? `<button data-act="toggle" data-id="${d.id}" class="px-2 py-1 bg-amber-600 text-white rounded">${active ? 'إيقاف' : 'تنشيط'}</button>` : ''}
      ${canPerm('delivery_companies.delete') ? `<button data-act="delete" data-id="${d.id}" class="px-2 py-1 bg-red-600 text-white rounded">حذف</button>` : ''}
    </td>
  </tr>`;
}

async function load(term){
  const r = await window.api.delivery_companies_list({ term: term||'' });
  const items = (r && r.ok && r.items) ? r.items : [];
  dTbody.innerHTML = items.length ? items.map(rowTpl).join('') : '<tr><td colspan="5" class="px-5 py-6 text-center text-gray-500">لا توجد بيانات</td></tr>';
}

function openAddDialog(){
  if(!canPerm('delivery_companies.add')) return;
  currentEditId = null;
  dlgTitle.textContent = 'إضافة شركة';
  f_name.value = '';
  f_discount.value = '';
  dlg.showModal();
}

function openEditDialog(id, name, discount){
  if(!canPerm('delivery_companies.edit')) return;
  currentEditId = Number(id);
  dlgTitle.textContent = 'تعديل شركة';
  f_name.value = name || '';
  f_discount.value = discount || '';
  dlg.showModal();
}

function showConfirm(message, title = 'تأكيد الحذف'){
  return new Promise((resolve)=>{
    confirmResolve = resolve;
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmDialog.showModal();
  });
}

function closeConfirm(result){
  if(confirmResolve){
    confirmResolve(Boolean(result));
    confirmResolve = null;
  }
  confirmDialog.close();
}

async function saveCompany(){
  const name = String(f_name.value||'').trim();
  const discount = Number(f_discount.value||0);
  if(!name){ alert('اسم الشركة مطلوب'); return; }
  if(isNaN(discount) || discount < 0 || discount > 100){ alert('نسبة الخصم يجب أن تكون بين 0 و100'); return; }
  let r;
  if(currentEditId){
    r = await window.api.delivery_companies_update(currentEditId, { name, discount_percent: discount });
  } else {
    r = await window.api.delivery_companies_add({ name, discount_percent: discount });
  }
  if(!(r && r.ok)){ alert((r && r.error) || 'فشل الحفظ'); return; }
  dlg.close();
  await load(dSearch.value||'');
}

dTbody?.addEventListener('click', async (ev) => {
  const btn = ev.target.closest('button');
  if(!btn) return;
  const id = Number(btn.getAttribute('data-id'));
  const act = btn.getAttribute('data-act');
  if(act === 'edit'){ openEditDialog(id, btn.getAttribute('data-name'), btn.getAttribute('data-discount')); return; }
  if(act === 'toggle'){ await window.api.delivery_companies_toggle(id); await load(dSearch.value||''); return; }
  if(act === 'delete'){
    const companyName = btn.getAttribute('data-name') || 'هذه الشركة';
    const ok = await showConfirm(`سيتم حذف شركة التوصيل "${companyName}" نهائياً ولا يمكن التراجع عن هذا الإجراء.`, 'تأكيد حذف شركة التوصيل');
    if(!ok) return;
    await window.api.delivery_companies_delete(id);
    await load(dSearch.value||'');
  }
});

addBtn?.addEventListener('click', openAddDialog);
dlgSave?.addEventListener('click', saveCompany);
dlgCancel?.addEventListener('click', ()=> dlg.close());
confirmOk?.addEventListener('click', ()=> closeConfirm(true));
confirmCancel?.addEventListener('click', ()=> closeConfirm(false));
confirmDialog?.addEventListener('cancel', (e)=>{ e.preventDefault(); closeConfirm(false); });
dSearch?.addEventListener('input', ()=> load(dSearch.value||''));

(async()=>{ await loadPerms(); if(addBtn && !canPerm('delivery_companies.add')) addBtn.style.display='none'; await load(''); })();
