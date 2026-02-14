// Inventory screen logic: tabs (Inventory list / Product BOM)
const errorDiv = document.getElementById('error');
function setError(m) { 
  errorDiv.textContent = m || ''; 
  if (m) {
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function showSuccess(message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.innerHTML = `
    <div style="background: linear-gradient(135deg, var(--success-50), rgba(16, 185, 129, 0.05)); 
         border: 1px solid var(--success-200); border-radius: var(--radius-lg); 
         padding: var(--space-4); margin: var(--space-4) 0; color: var(--success-600); 
         font-weight: 600; text-align: center; display: flex; align-items: center; 
         justify-content: center; gap: var(--space-2);">
      <span>✅</span>
      <span>${message}</span>
    </div>
  `;
  
  const container = document.querySelector('.container');
  container.insertBefore(successDiv, container.firstChild);
  
  setTimeout(() => {
    successDiv.style.opacity = '0';
    successDiv.style.transform = 'translateY(-20px)';
    setTimeout(() => successDiv.remove(), 300);
  }, 3000);
}

const tabInv = document.getElementById('tabInv');
const tabBom = document.getElementById('tabBom');
const viewInv = document.getElementById('viewInv');
const viewBom = document.getElementById('viewBom');

// Inventory elements
const invBody = document.getElementById('invBody');
const invAdd = document.getElementById('invAdd');
const invOnlyActive = document.getElementById('invOnlyActive');
const invOnlyLinked = document.getElementById('invOnlyLinked');

// Dialog
const invDlg = document.getElementById('invDlg');
const invDlgTitle = document.getElementById('invDlgTitle');
const fInvUnit = document.getElementById('fInvUnit');
const fInvStock = document.getElementById('fInvStock');
const fInvActive = document.getElementById('fInvActive');
const invSave = document.getElementById('invSave');
const invCancel = document.getElementById('invCancel');
let editInvId = null;

// BOM elements
const bomProduct = document.getElementById('bomProduct');
const bomInventory = document.getElementById('bomInventory');
const bomQty = document.getElementById('bomQty');
const bomAdd = document.getElementById('bomAdd');
const bomSave = document.getElementById('bomSave');
const bomBody = document.getElementById('bomBody');

let bomItems = []; // [{inventory_id, name, unit, qty_per_unit}]

// Enhanced tab switching with animations
function showInv() { 
  tabInv.classList.add('active'); 
  tabBom.classList.remove('active'); 
  viewInv.classList.remove('hidden'); 
  viewBom.classList.add('hidden');
  viewInv.classList.add('animate-fade-in');
}

function showBom() { 
  tabBom.classList.add('active'); 
  tabInv.classList.remove('active'); 
  viewInv.classList.add('hidden'); 
  viewBom.classList.remove('hidden');
  viewBom.classList.add('animate-fade-in');
}

tabInv.addEventListener('click', showInv);
tabBom.addEventListener('click', showBom);

// Permissions
let __perms = new Set();
async function loadPerms(){
  try{ 
    const u = JSON.parse(localStorage.getItem('pos_user') || 'null'); 
    if(u && u.id){ 
      const r = await window.api.perms_get_for_user(u.id); 
      if(r && r.ok){ 
        __perms = new Set(r.keys || []); 
      } 
    } 
  } catch(_) { 
    __perms = new Set(); 
  }
}
function canInv(k){ return __perms.has('inventory') && __perms.has(k); }

function miniConfirm(message, opts = {}){
  const { confirmText = 'تأكيد', cancelText = 'إلغاء' } = opts || {};
  return new Promise((resolve)=>{
    let d = document.getElementById('miniConfirmDialog');
    if(!d){
      d = document.createElement('dialog');
      d.id = 'miniConfirmDialog';
      d.style.position='fixed';
      d.style.top='50%';
      d.style.left='50%';
      d.style.transform='translate(-50%,-50%)';
      d.style.margin='0';
      d.style.padding='0';
      d.style.border='none';
      d.style.borderRadius='8px';
      d.style.maxWidth='360px';
      d.style.width='90vw';
      d.style.boxShadow='0 10px 30px rgba(0,0,0,0.2)';
      d.style.background='var(--panel, #fff)';
      d.style.zIndex='2147483647';
      document.body.appendChild(d);
      let s = document.getElementById('miniConfirmBackdropStyle');
      if(!s){ s=document.createElement('style'); s.id='miniConfirmBackdropStyle'; s.textContent='#miniConfirmDialog::backdrop{background:rgba(0,0,0,0.35)}'; document.head.appendChild(s); }
    }
    d.innerHTML = `
      <div style="padding:16px; min-width:280px;">
        <div style="font-size:14px; margin-bottom:16px;">${message||''}</div>
        <div style="display:flex; gap:8px; justify-content:flex-end;">
          <button type="button" data-cancel class="btn btn-outline">${cancelText}</button>
          <button type="button" data-confirm class="btn btn-danger">${confirmText}</button>
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

// Enhanced inventory rendering with beautiful UI
function renderInv(items) {
  invBody.innerHTML = '';
  
  if (!items || items.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `
      <td colspan="5" style="text-align: center; padding: var(--space-16); color: var(--gray-500);">
        <div style="display: flex; flex-direction: column; align-items: center; gap: var(--space-4);">
          <div style="font-size: 48px; opacity: 0.5;">📦</div>
          <div style="font-size: 18px; font-weight: 600;">لا توجد عناصر في المخزون</div>
          <div style="font-size: 14px;">ابدأ بإضافة عنصر جديد للمخزون</div>
        </div>
      </td>
    `;
    invBody.appendChild(emptyRow);
    return;
  }
  
  items.forEach((it, idx) => {
    const tr = document.createElement('tr');
    tr.style.opacity = '0';
    tr.style.transform = 'translateY(20px)';
    
    // تحديد لون الكمية حسب المستوى
    const stockValue = Number(it.stock || 0);
    let stockClass = 'text-muted';
    let stockIcon = '📊';
    if (stockValue === 0) {
      stockClass = 'text-danger';
      stockIcon = '⚠️';
    } else if (stockValue < 10) {
      stockClass = 'text-warning';
      stockIcon = '📉';
    } else {
      stockClass = 'text-success';
      stockIcon = '📈';
    }
    
    tr.innerHTML = `
      <td style="font-weight: 700; color: var(--gray-600);">${idx + 1}</td>
      <td style="font-weight: 600; color: var(--gray-800);">
        <div style="display: flex; align-items: center; gap: var(--space-2);">
          <span style="font-size: 16px;">📏</span>
          <span>${it.unit || 'غير محدد'}</span>
        </div>
      </td>
      <td>
        <div style="display: flex; align-items: center; gap: var(--space-2);">
          <span>${stockIcon}</span>
          <span class="${stockClass}" style="font-weight: 700; font-size: 16px;">
            ${stockValue.toFixed(3)}
          </span>
        </div>
      </td>
      <td>
        <span class="badge ${it.is_active ? 'badge-success' : 'badge-inactive'}">
          <span>${it.is_active ? '✅' : '⏸️'}</span>
          <span>${it.is_active ? 'نشط' : 'موقوف'}</span>
        </span>
      </td>
      <td style="white-space: nowrap;">
        <div style="display: flex; gap: var(--space-2);">
          ${canInv('inventory.edit') ? `
            <button class="btn btn-sm" data-act="edit" data-id="${it.id}" title="تعديل العنصر">
              <span>✏️</span>
            </button>
          ` : ''}
          ${canInv('inventory.toggle') ? `
            <button class="btn btn-sm ${it.is_active ? 'btn-warning' : 'btn-success'}" 
                    data-act="toggle" data-id="${it.id}" 
                    title="${it.is_active ? 'إيقاف العنصر' : 'تفعيل العنصر'}">
              <span>${it.is_active ? '⏸️' : '▶️'}</span>
            </button>
          ` : ''}
          ${canInv('inventory.delete') ? `
            <button class="btn btn-sm btn-danger" data-act="del" data-id="${it.id}" title="حذف العنصر">
              <span>🗑️</span>
            </button>
          ` : ''}
        </div>
      </td>
    `;
    
    invBody.appendChild(tr);
    
    // Animation
    setTimeout(() => {
      tr.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      tr.style.opacity = '1';
      tr.style.transform = 'translateY(0)';
    }, idx * 50);
  });
}

// Enhanced loading function
async function loadInv() {
  setError('');
  
  // Show loading state
  invBody.innerHTML = `
    <tr>
      <td colspan="5" style="text-align: center; padding: var(--space-8);">
        <div style="display: flex; align-items: center; justify-content: center; gap: var(--space-3);">
          <div class="loading-spinner"></div>
          <span style="color: var(--gray-600); font-weight: 600;">جاري تحميل البيانات...</span>
        </div>
      </td>
    </tr>
  `;
  
  const q = { 
    active: invOnlyActive.checked ? '1' : undefined,
    linked_only: invOnlyLinked && invOnlyLinked.checked ? '1' : undefined,
  };
  const r = await window.api.inventory_list(q);
  
  if (!r.ok) { 
    setError(r.error || 'تعذر تحميل المخزون'); 
    return; 
  }
  
  renderInv(r.items || []);
}

// Enhanced add inventory dialog
invAdd.addEventListener('click', () => {
  if (!canInv('inventory.add')) {
    setError('ليس لديك صلاحية لإضافة عناصر جديدة');
    return;
  }
  
  editInvId = null; 
  invDlgTitle.textContent = 'إضافة عنصر مخزون جديد';
  fInvUnit.value = ''; 
  fInvStock.value = '0'; 
  fInvActive.checked = true;
  
  if (typeof invDlg.showModal === 'function') { 
    invDlg.showModal(); 
  } else { 
    invDlg.setAttribute('open', ''); 
  }
  
  // Focus on first input
  setTimeout(() => fInvUnit.focus(), 100);
});

invCancel.addEventListener('click', () => { 
  if (typeof invDlg.close === 'function') { 
    invDlg.close(); 
  } else { 
    invDlg.removeAttribute('open'); 
  } 
});

// Enhanced save function with validation
invSave.addEventListener('click', async () => {
  setError('');
  
  const payload = {
    unit: (fInvUnit.value || '').trim(),
    stock: Number(fInvStock.value || 0),
    is_active: !!fInvActive.checked,
  };
  
  // Enhanced validation
  if (!payload.unit) { 
    setError('يرجى إدخال وحدة القياس (مثال: قطعة، جرام، كوب، لتر)'); 
    fInvUnit.focus();
    return; 
  }
  
  if (payload.unit.length < 2) {
    setError('وحدة القياس يجب أن تحتوي على حرفين على الأقل');
    fInvUnit.focus();
    return;
  }
  
  if (payload.stock < 0) {
    setError('الكمية لا يمكن أن تكون أقل من صفر');
    fInvStock.focus();
    return;
  }
  
  // Disable save button during save
  const originalText = invSave.innerHTML;
  invSave.innerHTML = '<span>⏳</span><span>جاري الحفظ...</span>';
  invSave.disabled = true;
  
  let r;
  if (editInvId) { 
    r = await window.api.inventory_update(editInvId, payload); 
  } else { 
    r = await window.api.inventory_add(payload); 
  }
  
  // Restore button
  invSave.innerHTML = originalText;
  invSave.disabled = false;
  
  if (!r.ok) { 
    setError(r.error || 'فشل في حفظ البيانات'); 
    return; 
  }
  
  if (typeof invDlg.close === 'function') { 
    invDlg.close(); 
  } else { 
    invDlg.removeAttribute('open'); 
  }
  
  showSuccess(editInvId ? 'تم تحديث العنصر بنجاح' : 'تم إضافة العنصر بنجاح');
  await loadInv();
  await loadInventoryForSelect();
});

// Enhanced inventory actions
invBody.addEventListener('click', async (e) => {
  const b = e.target.closest('button'); 
  if (!b) return;
  
  const id = Number(b.dataset.id); 
  const act = b.dataset.act;
  
  if (act === 'edit') {
    const r = await window.api.inventory_list({});
    if (r.ok) { 
      const it = (r.items || []).find(x => x.id === id); 
      if (it) {
        editInvId = id; 
        invDlgTitle.textContent = 'تعديل عنصر المخزون';
        fInvUnit.value = it.unit || ''; 
        fInvStock.value = Number(it.stock || 0); 
        fInvActive.checked = !!it.is_active;
        
        if (typeof invDlg.showModal === 'function') { 
          invDlg.showModal(); 
        } else { 
          invDlg.setAttribute('open', ''); 
        }
        
        setTimeout(() => fInvUnit.focus(), 100);
      } 
    }
  }
  
  if (act === 'toggle') {
    // Confirm action
    const r1 = await window.api.inventory_list({});
    const item = r1.ok ? (r1.items || []).find(x => x.id === id) : null;
    const action = item?.is_active ? 'إيقاف' : 'تفعيل';
    
    if (!(await miniConfirm(`هل تريد ${action} هذا العنصر؟`))) return;
    
    const r = await window.api.inventory_toggle(id); 
    if (!r.ok) { 
      setError(r.error || 'فشل في تحديث الحالة'); 
      return; 
    } 
    
    showSuccess(`تم ${action} العنصر بنجاح`);
    await loadInv(); 
    await loadInventoryForSelect();
  }
  
  if (act === 'del') {
    if (!(await miniConfirm('هل تريد حذف هذا العنصر نهائياً؟\nهذا الإجراء لا يمكن التراجع عنه.'))) return; 
    
    const r = await window.api.inventory_delete(id); 
    if (!r.ok) { 
      setError(r.error || 'فشل في حذف العنصر'); 
      return; 
    } 
    
    showSuccess('تم حذف العنصر بنجاح');
    await loadInv(); 
    await loadInventoryForSelect();
  }
});

invOnlyActive.addEventListener('change', loadInv);
if (invOnlyLinked) { invOnlyLinked.addEventListener('change', loadInv); }

// BOM logic with enhancements
async function loadProducts() {
  const r = await window.api.products_list({});
  bomProduct.innerHTML = '<option value="">اختر المنتج...</option>';
  
  if (r.ok) {
    (r.items || []).forEach(p => {
      const opt = document.createElement('option'); 
      opt.value = String(p.id); 
      opt.textContent = p.name; 
      bomProduct.appendChild(opt);
    });
  }
}

async function loadInventoryForSelect() {
  const r = await window.api.inventory_list({ active: '1' });
  bomInventory.innerHTML = '<option value="">اختر عنصر المخزون...</option>';
  
  if (r.ok) {
    (r.items || []).forEach(i => { 
      const opt = document.createElement('option'); 
      opt.value = String(i.id); 
      opt.textContent = `📏 ${i.unit} (متوفر: ${Number(i.stock || 0).toFixed(1)})`; 
      bomInventory.appendChild(opt); 
    });
  }
}

// Enhanced BOM rendering
function renderBOM() {
  bomBody.innerHTML = '';
  
  if (bomItems.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `
      <td colspan="5" style="text-align: center; padding: var(--space-12); color: var(--gray-500);">
        <div style="display: flex; flex-direction: column; align-items: center; gap: var(--space-3);">
          <div style="font-size: 36px; opacity: 0.5;">🔗</div>
          <div style="font-size: 16px; font-weight: 600;">لا توجد مكونات مرتبطة</div>
          <div style="font-size: 14px;">أضف عناصر المخزون المطلوبة لهذا المنتج</div>
        </div>
      </td>
    `;
    bomBody.appendChild(emptyRow);
    return;
  }
  
  bomItems.forEach((x, idx) => {
    const tr = document.createElement('tr');
    tr.style.opacity = '0';
    tr.style.transform = 'translateY(10px)';
    
    tr.innerHTML = `
      <td style="font-weight: 700; color: var(--gray-600);">${idx + 1}</td>
      <td>
        <div style="display: flex; align-items: center; gap: var(--space-2);">
          <span>📏</span>
          <span style="font-weight: 600;">${x.name || 'غير محدد'}</span>
        </div>
      </td>
      <td>
        <span class="badge badge-info">
          <span>📊</span>
          <span>${x.unit || 'N/A'}</span>
        </span>
      </td>
      <td>
        <input type="number" step="0.001" min="0" 
               value="${Number(x.qty_per_unit || 0).toFixed(3)}" 
               data-idx="${idx}" 
               class="bom-qty form-input" 
               style="width: 120px; padding: var(--space-2) var(--space-3);"
               placeholder="0.000"/>
      </td>
      <td>
        <button class="btn btn-sm btn-danger" data-act="remove" data-idx="${idx}" title="حذف المكون">
          <span>🗑️</span>
        </button>
      </td>
    `;
    
    bomBody.appendChild(tr);
    
    // Animation
    setTimeout(() => {
      tr.style.transition = 'all 0.2s ease';
      tr.style.opacity = '1';
      tr.style.transform = 'translateY(0)';
    }, idx * 30);
  });
}

bomAdd.addEventListener('click', async () => {
  const invId = Number(bomInventory.value || 0); 
  const qty = Math.max(0, Number(bomQty.value || 0)); 
  
  if (!invId) {
    setError('يرجى اختيار عنصر من المخزون'); 
    bomInventory.focus();
    return;
  }
  
  if (qty <= 0) {
    setError('يرجى إدخال كمية صحيحة أكبر من صفر'); 
    bomQty.focus();
    return;
  }
  
  // find inventory metadata
  const r = await window.api.inventory_list({ active: '1' });
  if (!r.ok) { 
    setError('تعذر تحميل بيانات المخزون'); 
    return; 
  }
  
  const it = (r.items || []).find(i => Number(i.id) === invId); 
  if (!it) { 
    setError('العنصر المحدد غير موجود أو غير نشط'); 
    return; 
  }
  
  if (bomItems.find(x => Number(x.inventory_id) === invId)) { 
    setError('هذا العنصر مضاف بالفعل إلى المكونات'); 
    return; 
  }
  
  bomItems.push({ 
    inventory_id: invId, 
    name: it.unit, 
    unit: it.unit, 
    qty_per_unit: qty 
  });
  
  bomQty.value = ''; 
  bomInventory.selectedIndex = 0;
  setError(''); 
  renderBOM();
  
  showSuccess('تم إضافة المكون بنجاح');
});

bomBody.addEventListener('input', (e) => {
  const qtyEl = e.target.closest('input.bom-qty'); 
  if (qtyEl) {
    const idx = Number(qtyEl.dataset.idx); 
    const val = Math.max(0, Number(qtyEl.value || 0)); 
    if (!isNaN(val)) { 
      bomItems[idx].qty_per_unit = val; 
    }
  }
});

bomBody.addEventListener('click', (e) => {
  const b = e.target.closest('button'); 
  if (!b) return; 
  
  const act = b.dataset.act; 
  const idx = Number(b.dataset.idx);
  
  if (act === 'remove') { 
    miniConfirm('هل تريد حذف هذا المكون؟').then(ok=>{ if(!ok) return;
      bomItems.splice(idx, 1); 
      renderBOM();
      showSuccess('تم حذف المكون');
    });
  }
});

bomSave.addEventListener('click', async () => {
  const pid = Number(bomProduct.value || 0); 
  
  if (!pid) { 
    setError('يرجى اختيار المنتج أولاً'); 
    bomProduct.focus();
    return; 
  }
  
  const items = bomItems
    .map(x => ({ 
      inventory_id: x.inventory_id, 
      qty_per_unit: Number(x.qty_per_unit || 0) 
    }))
    .filter(x => x.qty_per_unit > 0);
  
  if (items.length === 0) {
    if (!(await miniConfirm('لا توجد مكونات صالحة للحفظ. هل تريد حذف جميع المكونات المرتبطة بهذا المنتج؟'))) {
      return;
    }
  }
  
  // Disable save button during save
  const originalText = bomSave.innerHTML;
  bomSave.innerHTML = '<span>⏳</span><span>جاري الحفظ...</span>';
  bomSave.disabled = true;
  
  const r = await window.api.bom_set(pid, items);
  
  // Restore button
  bomSave.innerHTML = originalText;
  bomSave.disabled = false;
  
  if (!r.ok) { 
    setError(r.error || 'فشل في حفظ المكونات'); 
    return; 
  }
  
  showSuccess(`تم حفظ مكونات المنتج بنجاح (${items.length} مكون)`);
});

bomProduct.addEventListener('change', async () => {
  const pid = Number(bomProduct.value || 0); 
  
  if (!pid) { 
    bomItems = []; 
    renderBOM(); 
    return; 
  }
  
  // Show loading
  bomBody.innerHTML = `
    <tr>
      <td colspan="5" style="text-align: center; padding: var(--space-6);">
        <div style="display: flex; align-items: center; justify-content: center; gap: var(--space-2);">
          <div class="loading-spinner"></div>
          <span style="color: var(--gray-600);">جاري تحميل المكونات...</span>
        </div>
      </td>
    </tr>
  `;
  
  const r = await window.api.bom_get(pid);
  bomItems = r.ok ? 
    (r.items || []).map(it => ({ 
      inventory_id: it.inventory_id, 
      name: it.name, 
      unit: it.unit, 
      qty_per_unit: Number(it.qty_per_unit || 0) 
    })) : [];
  
  renderBOM();
});

// Add loading spinner CSS
const style = document.createElement('style');
style.textContent = `
  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid var(--gray-200);
    border-top: 2px solid var(--primary-500);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .success-message {
    transition: all 0.3s ease;
  }
`;
document.head.appendChild(style);

// Initialize everything
(async function init() {
  await loadPerms();
  
  // Hide BOM add/save buttons if no permission
  try {
    if (!canInv('inventory.bom_edit')) { 
      if (bomAdd) bomAdd.style.display = 'none'; 
      if (bomSave) bomSave.style.display = 'none'; 
    }
  } catch(_) { }
  
  await loadInv();
  await loadProducts();
  await loadInventoryForSelect();

  // Real-time inventory refresh after sales (invoice creation)
  try {
    window.api.on_sales_changed(async () => {
      try { await loadInv(); } catch(_) {}
    });
  } catch(_) {}
  
  // preload BOM for first product if exists
  if (bomProduct.options.length > 1) { 
    bomProduct.selectedIndex = 1; 
    const ev = new Event('change'); 
    bomProduct.dispatchEvent(ev); 
  }
})();