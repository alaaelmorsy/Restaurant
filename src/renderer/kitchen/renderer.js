// Kitchen printers management UI
const tbody = document.getElementById('tbody');
const btnAddPrinter = document.getElementById('btnAddPrinter');
const btnSave = document.getElementById('btnSave');
const btnDelete = document.getElementById('btnDelete');
const btnTest = document.getElementById('btnTest');

// Permissions
let __perms = new Set();
async function loadPerms(){ try{ const u=JSON.parse(localStorage.getItem('pos_user')||'null'); if(u&&u.id){ const r=await window.api.perms_get_for_user(u.id); if(r&&r.ok){ __perms=new Set(r.keys||[]); } } }catch(_){ __perms=new Set(); } }
function canKitchen(k){ return __perms.has(k); }
(async()=>{ await loadPerms(); try{
  if(btnAddPrinter && !canKitchen('kitchen.add')) btnAddPrinter.style.display='none';
  if(btnSave && !canKitchen('kitchen.edit')) btnSave.style.display='none';
  if(btnDelete && !canKitchen('kitchen.delete')) btnDelete.style.display='none';
  if(btnTest && !canKitchen('kitchen.test')) btnTest.style.display='none';
}catch(_){ } })();
const pDevice = document.getElementById('pDevice');
const pActive = document.getElementById('pActive');
const typeSelect = document.getElementById('typeSelect');
const btnAddType = document.getElementById('btnAddType');
const typeChips = document.getElementById('typeChips');

let allTypes = [];
let printers = [];
let currentId = null;
let currentTypes = [];

function showConfirmModal({ title, message, okText, cancelText } = {}){
  return new Promise((resolve) => {
    const backdrop = document.getElementById('confirmBackdrop');
    const titleEl = document.getElementById('confirmTitle');
    const msgEl = document.getElementById('confirmMessage');
    const btnOk = document.getElementById('confirmOk');
    const btnCancel = document.getElementById('confirmCancel');
    const btnClose = document.getElementById('confirmClose');

    if(!backdrop || !titleEl || !msgEl || !btnOk || !btnCancel || !btnClose){
      resolve(window.confirm(String(message || 'هل أنت متأكد؟')));
      return;
    }

    titleEl.textContent = title || 'تأكيد';
    btnOk.textContent = okText || 'موافق';
    btnCancel.textContent = cancelText || 'إلغاء';

    msgEl.innerHTML = '';
    const lines = String(message || '').split(/\n+/).filter(Boolean);
    lines.forEach((line) => {
      const div = document.createElement('div');
      div.textContent = line;
      msgEl.appendChild(div);
    });

    const cleanup = () => {
      try{ backdrop.classList.add('hidden'); backdrop.classList.remove('flex'); }catch(_){ }
      btnOk.onclick = null;
      btnCancel.onclick = null;
      btnClose.onclick = null;
      backdrop.onclick = null;
    };

    const onNo = () => { cleanup(); resolve(false); };
    const onYes = () => { cleanup(); resolve(true); };

    btnOk.onclick = (e)=>{ e.preventDefault(); e.stopPropagation(); onYes(); };
    btnCancel.onclick = (e)=>{ e.preventDefault(); e.stopPropagation(); onNo(); };
    btnClose.onclick = (e)=>{ e.preventDefault(); e.stopPropagation(); onNo(); };
    backdrop.onclick = (e)=>{ if(e.target === backdrop) onNo(); };

    try{ backdrop.classList.remove('hidden'); backdrop.classList.add('flex'); }catch(_){ }
  });
}

function chip(label){
  const wrap = document.createElement('span');
  wrap.className = 'px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full text-green-700 font-semibold text-xs flex items-center gap-1';
  const x = document.createElement('button'); 
  x.textContent='×'; 
  x.className = 'chip-button';
  x.style.fontWeight = 'bold';
  x.addEventListener('click', () => { currentTypes = currentTypes.filter(t => t!==label); renderEditor(); });
  wrap.appendChild(x); 
  wrap.appendChild(document.createTextNode(' ' + label));
  return wrap;
}

async function loadTypes(){ try{ const r = await window.api.types_list_all(); allTypes = r.ok ? (r.items||[]) : []; }catch(_){ allTypes = []; } }

function renderEditor(){
  const noTypesEl = document.getElementById('no-types');
  
  typeChips.innerHTML = '';
  
  if (currentTypes.length === 0) {
    if (noTypesEl) {
      noTypesEl.style.display = 'block';
    } else {
      typeChips.innerHTML = '<div style="color: var(--muted); font-size: 13px; padding: 8px; text-align: center; width: 100%;">لم يتم إضافة أقسام بعد...</div>';
    }
  } else {
    if (noTypesEl) noTypesEl.style.display = 'none';
    
    currentTypes.forEach((t, index) => {
      const chipEl = chip(t);
      typeChips.appendChild(chipEl);
    });
  }
  
  typeSelect.innerHTML = '';
  const active = allTypes.filter(t => t.is_active!==0);
  active.forEach(t => { const opt = document.createElement('option'); opt.value=t.name; opt.textContent=t.name; typeSelect.appendChild(opt); });
}

function renderTable(){
  const loadingRow = document.getElementById('loading-row');
  
  tbody.innerHTML = '<tr id="loading-row" class="hidden"><td colspan="5" class="text-center py-10"><div class="text-slate-500">جاري التحميل...</div></td></tr>';
  
  if (printers.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `
      <td colspan="5" class="text-center py-10 text-slate-500">
        <div class="text-5xl mb-4">🖨️</div>
        <div class="text-base font-bold mb-2">لا توجد طابعات مضافة</div>
        <div class="text-sm">اضغط على "إضافة طابعة جديدة" لبدء إعداد طابعات المطبخ</div>
      </td>
    `;
    tbody.appendChild(emptyRow);
    return;
  }
  
  printers.forEach((p, index) => {
    const tr = document.createElement('tr');
    
    const statusClass = p.is_active ? 'text-green-600 font-bold' : 'text-slate-500 font-bold';
    const statusIcon = p.is_active ? '✅' : '❌';
    const statusText = p.is_active ? 'مفعلة' : 'موقوفة';
    
    tr.innerHTML = `
      <td class="px-4 py-3 font-semibold text-slate-700">${escapeHtml(p.name || p.device_name)}</td>
      <td class="px-4 py-3"><span class="px-3 py-1 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full text-slate-700 font-bold text-xs">${escapeHtml(p.device_name)}</span></td>
      <td class="px-4 py-3">
        <div class="flex flex-wrap gap-1">
          ${(p.types||[]).map(t=>`<span class="px-2 py-1 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full text-green-700 font-semibold text-xs">${escapeHtml(t)}</span>`).join('')}
          ${(p.types||[]).length === 0 ? '<span class="text-slate-500 text-xs italic">لا توجد أقسام</span>' : ''}
        </div>
      </td>
      <td class="px-4 py-3 text-center"><span class="${statusClass}">${statusIcon} ${statusText}</span></td>
      <td class="px-4 py-3 text-center"><button class="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-semibold shadow-sm text-xs" data-act="edit" data-id="${p.id}">✏️ تعديل</button></td>
    `;
    
    tr.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if(!b) return;
      if(b.dataset.act==='edit'){
        selectPrinter(Number(b.dataset.id));
      }
    });
    
    tbody.appendChild(tr);
  });
}

// Add slideOut animation
const slideOutStyle = document.createElement('style');
slideOutStyle.textContent = `
  @keyframes slideOut {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(-20px); }
  }
`;
document.head.appendChild(slideOutStyle);

function selectPrinter(id){
  const p = printers.find(x=>x.id===id);
  currentId = p ? p.id : null;
  pDevice.value = p ? (p.device_name||'') : '';
  pActive.value = p && !p.is_active ? '0' : '1';
  currentTypes = p ? (p.types||[]) : [];
  renderEditor();
}

function escapeHtml(s){ return String(s||'').replace(/[&<>\"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch])); }

btnAddPrinter.addEventListener('click', () => { if(!canKitchen('kitchen.add')) return; currentId=null; pDevice.value=''; pActive.value='1'; currentTypes=[]; renderEditor(); });
btnAddType.addEventListener('click', () => {
  const t = typeSelect.value; 
  if(!t) {
    window.__showKitchenToast && window.__showKitchenToast('يرجى اختيار قسم لإضافته', 'warning');
    return; 
  }
  
  if(currentTypes.includes(t)){
    window.__showKitchenToast && window.__showKitchenToast('هذا القسم مضاف بالفعل', 'info');
    return;
  }
  
  // Quick success animation
  btnAddType.style.transform = 'scale(1.05)';
  btnAddType.style.background = 'linear-gradient(135deg, var(--success), #22c55e)';
  btnAddType.style.color = 'white';
  
  setTimeout(() => {
    btnAddType.style.transform = '';
    btnAddType.style.background = '';
    btnAddType.style.color = '';
  }, 100);
  
  currentTypes.push(t); 
  renderEditor();
  
  // Show success message
  window.__showKitchenToast && window.__showKitchenToast(`تم إضافة قسم "${t}" بنجاح`, 'success');
});

btnSave.addEventListener('click', async () => {
  if(!canKitchen('kitchen.edit')) return;
  
  btnSave.disabled = true;
  window.__showLoading && window.__showLoading();
  
  try {
    const payload = {
      device_name: (pDevice.value||'').trim(),
      is_active: Number(pActive.value||'1') ? 1 : 0
    };
    
    if(!payload.device_name){ 
      window.__showKitchenToast && window.__showKitchenToast('اسم الطابعة مطلوب', 'error');
      return; 
    }
    
    let success = false;
    if(currentId){
      const r = await window.api.kitchen_update(currentId, payload);
      if(!r.ok){ 
        window.__showKitchenToast && window.__showKitchenToast(r.error||'فشل في حفظ التغييرات', 'error'); 
        return; 
      }
      success = true;
      window.__showKitchenToast && window.__showKitchenToast('تم حفظ التغييرات بنجاح', 'success');
    } else {
      const r = await window.api.kitchen_add(payload);
      if(!r.ok){ 
        window.__showKitchenToast && window.__showKitchenToast(r.error||'فشل في إضافة الطابعة', 'error'); 
        return; 
      }
      currentId = r.id;
      success = true;
      window.__showKitchenToast && window.__showKitchenToast('تمت إضافة الطابعة بنجاح', 'success');
    }
    
    if (success) {
      // save routes
      await window.api.kitchen_set_routes(currentId, currentTypes);
      
      // Add quick success animation to form
      const card = btnSave.closest('.card');
      if (card) {
        card.style.background = 'linear-gradient(135deg, #f0fdf4, #dcfce7)';
        card.style.border = '2px solid var(--success)';
        setTimeout(() => {
          card.style.background = '';
          card.style.border = '';
        }, 500);
      }
      
      // Reload and reset form
      await refresh();
      currentId = null; 
      currentTypes = []; 
      pDevice.value = ''; 
      pActive.value = '1'; 
      renderEditor();
    }
  } catch (error) {
    window.__showKitchenToast && window.__showKitchenToast('حدث خطأ غير متوقع', 'error');
  } finally {
    btnSave.disabled = false;
    window.__hideLoading && window.__hideLoading();
  }
});

btnDelete.addEventListener('click', async () => {
  if(!canKitchen('kitchen.delete')) return;
  if(!currentId){ 
    window.__showKitchenToast && window.__showKitchenToast('يرجى اختيار طابعة للحذف', 'warning');
    return; 
  }
  
  // Enhanced confirmation dialog
  const ok = await showConfirmModal({
    title: 'تأكيد حذف الطابعة',
    message: 'هل أنت متأكد من حذف هذه الطابعة؟\n\nسيتم حذف جميع إعدادات الطابعة والأقسام المرتبطة بها.\nلا يمكن التراجع عن هذا الإجراء.',
    okText: 'حذف',
    cancelText: 'إلغاء'
  });
  if(!ok) return;
  
  btnDelete.disabled = true;
  window.__showLoading && window.__showLoading();
  
  try {
    const r = await window.api.kitchen_delete(currentId);
    if(!r.ok){ 
      window.__showKitchenToast && window.__showKitchenToast(r.error||'فشل في حذف الطابعة', 'error'); 
      return; 
    }
    
    // Success animation
    const card = btnDelete.closest('.card');
    if (card) {
      card.style.animation = 'pulse 0.5s ease-out';
      card.style.background = 'linear-gradient(135deg, #fef2f2, #fee2e2)';
      card.style.border = '2px solid var(--danger)';
    }
    
    window.__showKitchenToast && window.__showKitchenToast('تم حذف الطابعة بنجاح', 'success');
    
    setTimeout(() => {
      currentId = null; 
      currentTypes = []; 
      pDevice.value = ''; 
      pActive.value = '1'; 
      renderEditor();
      
      if (card) {
        card.style.background = '';
        card.style.border = '';
        card.style.animation = '';
      }
    }, 300);
    
    await refresh();
  } catch (error) {
    window.__showKitchenToast && window.__showKitchenToast('حدث خطأ غير متوقع', 'error');
  } finally {
    btnDelete.disabled = false;
    window.__hideLoading && window.__hideLoading();
  }
});

btnTest.addEventListener('click', async () => {
  if(!canKitchen('kitchen.test')) return;
  if(!currentId){ 
    window.__showKitchenToast && window.__showKitchenToast('يرجى اختيار طابعة أولاً', 'warning');
    return; 
  }
  
  btnTest.disabled = true;
  
  try {
    window.__showKitchenToast && window.__showKitchenToast('جاري إرسال أمر الطباعة...', 'info');
    
    const r = await window.api.kitchen_test_print(currentId);
    if(!r.ok){ 
      window.__showKitchenToast && window.__showKitchenToast(r.error||'فشل في طباعة الاختبار', 'error');
      return;
    }
    
    // Success animation for test button
    btnTest.style.background = 'linear-gradient(135deg, var(--success), #22c55e)';
    btnTest.style.transform = 'scale(1.05)';
    
    setTimeout(() => {
      btnTest.style.background = '';
      btnTest.style.transform = '';
    }, 300);
    
    window.__showKitchenToast && window.__showKitchenToast('تم إرسال طباعة الاختبار بنجاح', 'success');
  } catch (error) {
    window.__showKitchenToast && window.__showKitchenToast('حدث خطأ غير متوقع', 'error');
  } finally {
    setTimeout(() => {
      btnTest.disabled = false;
    }, 500);
  }
});

async function loadSystemPrinters(){
  try{
    const r = await window.api.kitchen_list_system_printers();
    const items = r.ok ? (r.items||[]) : [];
    pDevice.innerHTML = '';
    items.forEach(pr => {
      const opt = document.createElement('option');
      opt.value = pr.name; opt.textContent = pr.name + (pr.isDefault ? ' (افتراضي)' : '');
      pDevice.appendChild(opt);
    });
  }catch(_){ pDevice.innerHTML = ''; }
}

async function refresh(){
  try {
    // Add loading animation
    const loadingRow = document.getElementById('loading-row');
    if (loadingRow) loadingRow.style.display = 'table-row';
    
    const r = await window.api.kitchen_list();
    printers = r.ok ? (r.items||[]) : [];
    
    // Render immediately for speed
    renderTable();
  } catch (error) {
    window.__showKitchenToast && window.__showKitchenToast('فشل في تحميل قائمة الطابعات', 'error');
    printers = [];
    renderTable();
  }
}

(function init(){
  // Faster page entrance animation
  document.body.style.opacity = '0';
  document.body.style.transform = 'translateY(10px)';
  
  // Start animation immediately
  requestAnimationFrame(() => {
    document.body.style.transition = 'all 0.3s ease-out';
    document.body.style.opacity = '1';
    document.body.style.transform = 'translateY(0)';
  });
  
  // Enhanced home button with faster exit
  const btnHome = document.getElementById('btnBackHome'); 
  if(btnHome){ 
    btnHome.onclick = () => { 
      window.location.href = '../main/index.html';
    };
  }
  
  // Enhanced new printer button with faster feedback
  const addBtn = document.getElementById('btnAddPrinter');
  if (addBtn) {
    addBtn.onclick = () => { 
      if(!canKitchen('kitchen.add')) return; 
      
      // Removed animation for faster performance
      
      currentId = null; 
      pDevice.value = ''; 
      pActive.value = '1'; 
      currentTypes = []; 
      renderEditor();
      
      // Immediate focus
      pDevice.focus();
      
      window.__showKitchenToast && window.__showKitchenToast('يمكنك الآن إعداد طابعة جديدة', 'info');
    };
  }
  
  // Load data immediately without artificial delays
  Promise.all([
    loadTypes(),
    loadSystemPrinters()
  ]).then(() => {
    renderEditor();
    return refresh();
  }).then(() => {
    // Show welcome message immediately
    if (printers.length === 0) {
      window.__showKitchenToast && window.__showKitchenToast('ابدأ بإضافة طابعة جديدة', 'info');
    } else {
      window.__showKitchenToast && window.__showKitchenToast(`${printers.length} طابعة متاحة`, 'success');
    }
  }).catch((error) => {
    window.__showKitchenToast && window.__showKitchenToast('حدث خطأ أثناء تحميل البيانات', 'error');
  });
})();