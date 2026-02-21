try{ window.api && window.api.app_on_locale_changed && window.api.app_on_locale_changed((L)=>{ try{ window.__i18n_burst && window.__i18n_burst(L); }catch(_){ } }); }catch(_){ }
const tbody = document.getElementById('tbody');
const errorDiv = document.getElementById('error');
const addBtn = document.getElementById('addBtn');
const refreshBtn = document.getElementById('refreshBtn');
const operationsCount = document.getElementById('operationsCount');

function miniConfirm(message){
  return new Promise((resolve)=>{
    try{
      let dlg = document.getElementById('miniConfirm');
      if(!dlg){
        dlg = document.createElement('dialog');
        dlg.id = 'miniConfirm';
        dlg.innerHTML = '<div class="modal" style="padding:0;">\
<header style="padding:12px 16px; font-weight:800; background:#1a56db; color:#fff;"><strong class="title"></strong></header>\
<div class="body" style="padding:12px; display:grid; gap:10px;">\
  <div style="display:flex; gap:8px; justify-content:end;">\
    <button class="btn primary ok">موافق</button>\
    <button class="btn secondary cancel">إلغاء</button>\
  </div>\
</div></div>';
        document.body.appendChild(dlg);
      }
      const title = dlg.querySelector('.title');
      const ok = dlg.querySelector('.ok');
      const cancel = dlg.querySelector('.cancel');
      if(title) title.textContent = message || '';
      const cleanup = ()=>{ ok.onclick=null; cancel.onclick=null; dlg.removeEventListener('close', onClose); };
      const onClose = ()=>{ cleanup(); };
      dlg.addEventListener('close', onClose);
      ok.onclick = ()=>{ dlg.close(); resolve(true); };
      cancel.onclick = ()=>{ dlg.close(); resolve(false); };
      dlg.showModal();
      setTimeout(()=> ok.focus(), 0);
    }catch(_){ resolve(false); }
  });
}

const dlg = document.getElementById('dlg');
const dlgTitle = document.getElementById('dlgTitle');
const f_name = document.getElementById('f_name');
const f_name_en = document.getElementById('f_name_en');
const dlgSave = document.getElementById('dlgSave');
const dlgCancel = document.getElementById('dlgCancel');

// Permissions from DB per page load
let __perms = new Set();
async function loadPerms(){
  try{
    const u = JSON.parse(localStorage.getItem('pos_user')||'null');
    if(!u || !u.id) return;
    const r = await window.api.perms_get_for_user(u.id);
    if(r && r.ok){ __perms = new Set(r.keys||[]); }
  }catch(_){ __perms = new Set(); }
}

let editId = null;
let currentItems = [];

function setError(m){ errorDiv.textContent = m || ''; }
function openAdd(){
  editId=null; 
  dlgTitle.textContent='إضافة عملية جديدة'; 
  f_name.value='';
  f_name_en.value='';
  f_name.focus();
  dlg.showModal();
}
function openEdit(item){ 
  editId=item.id; 
  dlgTitle.textContent='تعديل عملية: ' + item.name; 
  f_name.value=item.name||''; 
  f_name_en.value=item.name_en||'';
  f_name.focus();
  dlg.showModal(); 
}
function closeDlg(){ dlg.close(); }

// initial load perms and hide top actions based on permissions
(async ()=>{ 
  await loadPerms();
  try{
    if(addBtn && !(__perms.has('operations') && __perms.has('operations.add'))){ addBtn.style.display='none'; }
  }catch(_){ }
})();

function renderRows(items){
  tbody.innerHTML='';
  const has = (k)=> __perms.has('operations') && __perms.has(k);
  
  // Update operations count
  const activeCount = (items||[]).filter(item => item.is_active).length;
  const totalCount = (items||[]).length;
  operationsCount.textContent = `${totalCount} عملية (${activeCount} نشطة)`;
  
  (items||[]).forEach((it, idx) => {
    const tr = document.createElement('tr');
    
    // Create action buttons with proper styling
    const actions = [];
    if(has('operations.edit')) {
      actions.push(`<button class="btn primary sm" data-act="edit" data-id="${it.id}" title="تعديل العملية">✏️ تعديل</button>`);
    }
    if(has('operations.toggle')) {
      const toggleClass = it.is_active ? 'warning' : 'success';
      const toggleText = it.is_active ? '⏸️ إيقاف' : '▶️ تفعيل';
      actions.push(`<button class="btn ${toggleClass} sm" data-act="toggle" data-id="${it.id}" title="${it.is_active ? 'إيقاف العملية' : 'تفعيل العملية'}">${toggleText}</button>`);
    }
    if(has('operations.delete')) {
      actions.push(`<button class="btn danger sm" data-act="del" data-id="${it.id}" title="حذف العملية">🗑️ حذف</button>`);
    }
    
    tr.innerHTML = `
      <td style="font-weight: 700; color: var(--text-muted);">${idx+1}</td>
      <td>
        <div class="operation-name">${it.name}</div>
        ${it.name_en ? `<div class="operation-order" dir="ltr" style="font-weight:600;">${it.name_en}</div>` : ''}
        <div class="operation-order">ترتيب: ${Number(it.sort_order||0)}</div>
      </td>
      <td>${it.is_active ? '<span class="status-active">نشطة</span>' : '<span class="status-inactive">موقوفة</span>'}</td>
      <td><div class="actions-cell">${actions.join('')}</div></td>
    `;
    // تفعيل السحب والإفلات لإعادة الترتيب
    tr.setAttribute('draggable','true');
    tr.dataset.index = String(idx);
    tr.addEventListener('dragstart', (e) => {
      window.__op_dragIndex = idx;
      try{ e.dataTransfer.effectAllowed = 'move'; }catch(_){ /* ignore */ }
    });
    tr.addEventListener('dragover', (e) => { e.preventDefault(); });
    tr.addEventListener('drop', async (e) => {
      e.preventDefault();
      const from = Number(window.__op_dragIndex);
      const to = Number(tr.dataset.index);
      if(isNaN(from) || isNaN(to) || from===to) return;
      const item = currentItems.splice(from,1)[0];
      currentItems.splice(to,0,item);
      for(let i=0;i<currentItems.length;i++){
        const it2 = currentItems[i];
        const newOrder = i;
        if(Number(it2.sort_order||0) !== newOrder){
          const r = await window.api.ops_update(it2.id, { name: it2.name, name_en: it2.name_en||null, sort_order: newOrder, is_active: it2.is_active });
          if(!r.ok){ setError(r.error||'فشل حفظ الترتيب'); return; }
          it2.sort_order = newOrder;
        }
      }
      await load();
    });
    tbody.appendChild(tr);
  });
}

async function load(){
  setError('');
  
  try {
    const r = await window.api.ops_list();
    if(!r.ok){ 
      setError(r.error||'تعذر تحميل العمليات'); 
      operationsCount.textContent = '0 عملية';
      return; 
    }
    
    currentItems = r.items || [];
    renderRows(currentItems);
    
    // Show empty state if no operations
    if(currentItems.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 40px; color: var(--text-muted);">
            <div style="font-size: 18px; margin-bottom: 8px;">📝</div>
            <div style="font-weight: 600; margin-bottom: 4px;">لا توجد عمليات محفوظة</div>
            <div style="font-size: 13px;">ابدأ بإضافة عملية جديدة للمنتجات</div>
          </td>
        </tr>
      `;
    }
  } catch(err) {
    setError('حدث خطأ أثناء تحميل البيانات');
    operationsCount.textContent = '0 عملية';
    console.error('Error loading operations:', err);
  }
}

addBtn.addEventListener('click', openAdd);
refreshBtn.addEventListener('click', load);

dlgCancel.addEventListener('click', closeDlg);

dlgSave.addEventListener('click', async () => {
  setError('');
  const name = (f_name.value||'').trim();
  const name_en = (f_name_en.value||'').trim() || null;
  
  if(!name){ 
    setError('يرجى إدخال اسم العملية'); 
    f_name.focus();
    return; 
  }

  if(name.length < 2) {
    setError('اسم العملية يجب أن يكون على الأقل حرفين');
    f_name.focus();
    return;
  }

  // Check for duplicate names (excluding current item when editing)
  const duplicateItem = currentItems.find(item => 
    item.name.trim().toLowerCase() === name.toLowerCase() && 
    item.id !== editId
  );
  
  if(duplicateItem) {
    setError('اسم العملية موجود مسبقاً، يرجى اختيار اسم آخر');
    f_name.focus();
    return;
  }

  // Disable save button during operation
  dlgSave.disabled = true;
  dlgSave.textContent = editId ? '⏳ جاري التعديل...' : '⏳ جاري الحفظ...';

  try {
    let r;
    if(editId){
      // تعديل الاسم فقط، لا نغيّر الترتيب بالأرقام
      const item = currentItems.find(x=>x.id===editId);
      const currentOrder = item ? Number(item.sort_order||0) : 0;
      r = await window.api.ops_update(editId, { name, name_en, sort_order: currentOrder, is_active: item ? item.is_active : 1 });
    } else {
      // الإضافة: ضعه في آخر الترتيب
      const next = (currentItems.length ? Math.max(...currentItems.map(x => Number(x.sort_order||0))) + 1 : 0);
      r = await window.api.ops_add({ name, name_en, sort_order: next });
    }
    
    if(!r.ok){ 
      setError(r.error||'فشل الحفظ'); 
      return; 
    }
    
    closeDlg();
    await load();
  } catch(err) {
    setError('حدث خطأ أثناء حفظ البيانات');
    console.error('Error saving operation:', err);
  } finally {
    // Re-enable save button
    dlgSave.disabled = false;
    dlgSave.textContent = editId ? '💾 حفظ العملية' : '💾 حفظ العملية';
  }
});

tbody.addEventListener('click', async (e) => {
  const b = e.target.closest('button'); 
  if(!b) return;
  
  const id = Number(b.dataset.id); 
  const act = b.dataset.act;
  setError('');
  
  // Find the item
  const item = (currentItems||[]).find(x=>x.id===id);
  if(!item && act !== 'del'){ 
    setError('العنصر غير موجود'); 
    return; 
  }
  
  if(act==='edit'){
    openEdit(item);
    return;
  }
  
  if(act==='toggle'){
    // Disable button during operation
    const originalText = b.textContent;
    b.disabled = true;
    b.textContent = '⏳ جاري التحديث...';
    
    try {
      const r = await window.api.ops_toggle(id); 
      if(!r.ok){ 
        setError(r.error||'فشل تحديث حالة العملية'); 
        return; 
      }
      await load();
    } catch(err) {
      setError('حدث خطأ أثناء تحديث الحالة');
      console.error('Error toggling operation:', err);
    } finally {
      b.disabled = false;
      b.textContent = originalText;
    }
    return;
  }
  
  if(act==='del'){
    const itemName = item ? item.name : 'العملية';
    const confirmMessage = `هل أنت متأكد من حذف العملية "${itemName}"؟\n\nهذا الإجراء لا يمكن التراجع عنه.`;
    const ok = await miniConfirm(confirmMessage);
    if(!ok) return;
    const originalText = b.textContent;
    b.disabled = true;
    b.textContent = '⏳ جاري الحذف...';
    try {
      const r = await window.api.ops_delete(id); 
      if(!r.ok){ 
        // عرض رسالة خطأ واضحة مع اقتراح استخدام زر الإيقاف
        const errorMsg = r.error || 'فشل حذف العملية';
        setError(errorMsg);
        
        // إذا كانت العملية مرتبطة بمنتجات، أضف توضيح بصري
        if(errorMsg.includes('مرتبطة')){
          // إضافة تنبيه بصري مؤقت
          const alertDiv = document.createElement('div');
          alertDiv.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:#fff3cd; border:2px solid #ffc107; padding:20px 24px; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.15); z-index:9999; max-width:400px; text-align:center;';
          alertDiv.innerHTML = `
            <div style="font-size:40px; margin-bottom:12px;">⚠️</div>
            <div style="font-weight:800; font-size:16px; color:#856404; margin-bottom:8px;">لا يمكن حذف العملية</div>
            <div style="color:#856404; font-size:14px; margin-bottom:16px;">${errorMsg}</div>
            <div style="background:#fff; padding:12px; border-radius:8px; border:1px solid #ffc107; margin-bottom:12px;">
              <div style="font-weight:700; color:#856404; margin-bottom:6px;">💡 بدلاً من ذلك:</div>
              <div style="color:#856404; font-size:13px;">استخدم زر <strong>"⏸️ إيقاف"</strong> لتعطيل العملية مؤقتاً</div>
            </div>
            <button onclick="this.parentElement.remove()" style="background:#0b3daa; color:#fff; border:0; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:700;">حسناً</button>
          `;
          document.body.appendChild(alertDiv);
          setTimeout(() => { try{ alertDiv.remove(); }catch(_){} }, 8000);
        }
        return; 
      }
      await load();
    } catch(err) {
      setError('حدث خطأ أثناء حذف العملية');
      console.error('Error deleting operation:', err);
    } finally {
      b.disabled = false;
      b.textContent = originalText;
    }
    return;
  }
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // ESC to close modal
  if(e.key === 'Escape' && dlg.open) {
    closeDlg();
  }
  
  // Enter to save when modal is open
  if(e.key === 'Enter' && dlg.open) {
    e.preventDefault();
    dlgSave.click();
  }
  
  // Ctrl+N or Alt+N to add new operation
  if((e.ctrlKey || e.altKey) && e.key === 'n') {
    e.preventDefault();
    if(addBtn.style.display !== 'none') {
      openAdd();
    }
  }
  
  // F5 to refresh
  if(e.key === 'F5') {
    e.preventDefault();
    load();
  }
});

// Close modal when clicking backdrop
dlg.addEventListener('click', (e) => {
  if(e.target === dlg) {
    closeDlg();
  }
});

// Initial load
load();