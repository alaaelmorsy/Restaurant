// Customer pricing renderer
const rulesTbody = document.getElementById('rulesTbody');
const searchBox = document.getElementById('searchBox');
const searchBtn = document.getElementById('searchBtn');
const addBtn = document.getElementById('addBtn');
const backBtn = document.getElementById('backBtn');

// Permissions
let __perms = new Set();
async function loadPerms(){ try{ const u=JSON.parse(localStorage.getItem('pos_user')||'null'); if(u&&u.id){ const r=await window.api.perms_get_for_user(u.id); if(r&&r.ok){ __perms=new Set(r.keys||[]); } } }catch(_){ __perms=new Set(); } }
function canCP(k){ return __perms.has(k); }

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
      <div style=\"padding:16px; min-width:280px;\">
        <div style=\"font-size:14px; margin-bottom:16px;\">${message||''}</div>
        <div style=\"display:flex; gap:8px; justify-content:flex-end;\">
          <button type=\"button\" data-cancel class=\"btn btn-outline\">${cancelText}</button>
          <button type=\"button\" data-confirm class=\"btn btn-danger\">${confirmText}</button>
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

(async()=>{ await loadPerms(); try{ if(addBtn && !canCP('customer_pricing.add')) addBtn.style.display='none'; }catch(_){ } })();

const modalBackdrop = document.getElementById('modalBackdrop');
const cancelModal = document.getElementById('cancelModal');
const saveRuleBtn = document.getElementById('saveRule');

const custSearch = document.getElementById('custSearch');
const prodSearch = document.getElementById('prodSearch');
const custSuggest = document.getElementById('custSuggest');
const prodSuggest = document.getElementById('prodSuggest');
const custSelected = document.getElementById('custSelected');
const prodSelectedList = document.getElementById('prodSelectedList');
const opBox = document.getElementById('opBox');
const opSelect = document.getElementById('opSelect');
const modeSelect = document.getElementById('modeSelect');
const valueInput = document.getElementById('valueInput');
const valueLabel = document.getElementById('valueLabel');
const valueHelp = document.getElementById('valueHelp');
const previewSection = document.getElementById('previewSection');
const previewContent = document.getElementById('previewContent');
// Bulk per-operation pricing UI elements
const bulkOpsBox = document.getElementById('bulkOpsBox');
const bulkOpsList = document.getElementById('bulkOpsList');
const saveBulkBtn = document.getElementById('saveBulkBtn');

let selectedCustomer = null;
let selectedProducts = [];
let editingId = null;

function fmtRule(r){
  if (r.price_cash != null) return `<span class="price-cash">💵 ${Number(r.price_cash).toFixed(2)} ﷼</span>`;
  if (r.discount_percent != null) return `<span class="price-discount">📊 خصم ${Number(r.discount_percent)}%</span>`;
  return '<span class="muted">—</span>';
}

function openModal(){ 
  modalBackdrop.style.display = 'flex'; 
  opBox.style.display='none'; 
  custSuggest.style.display='none'; 
  prodSuggest.style.display='none'; 
  previewSection.style.display='none';
  // reset bulk ops
  if (bulkOpsBox) { bulkOpsBox.style.display='none'; bulkOpsList.innerHTML=''; }
  updateModeDisplay();
}

function closeModal(){ 
  modalBackdrop.style.display = 'none'; 
  editingId = null; 
  selectedCustomer=null; 
  selectedProducts=[]; 
  custSelected.innerHTML=''; 
  custSelected.style.display='none';
  prodSelectedList.innerHTML=''; 
  prodSelectedList.style.display='none';
  custSearch.value=''; 
  prodSearch.value=''; 
  valueInput.value=''; 
  opSelect.value=''; 
  modeSelect.value='cash'; 
  opBox.style.display='none'; 
  custSuggest.style.display='none'; 
  prodSuggest.style.display='none'; 
  previewSection.style.display='none';
  if (bulkOpsBox) { bulkOpsBox.style.display='none'; bulkOpsList.innerHTML=''; }
  updateModeDisplay();
}

function updateModeDisplay() {
  const mode = modeSelect.value;
  if (mode === 'cash') {
    valueLabel.innerHTML = '💵 السعر الجديد';
    valueHelp.innerHTML = 'أدخل السعر الجديد بالريال';
    valueInput.placeholder = 'مثال: 25.50';
  } else {
    valueLabel.innerHTML = '📊 نسبة الخصم';
    valueHelp.innerHTML = 'أدخل نسبة الخصم (من 1 إلى 99)';
    valueInput.placeholder = 'مثال: 15';
  }
  updatePreview();
}

function updatePreview() {
  const customer = selectedCustomer;
  const products = selectedProducts;
  const mode = modeSelect.value;
  const value = parseFloat(valueInput.value) || 0;
  
  if (!customer || !products.length || value <= 0) {
    previewSection.style.display = 'none';
    return;
  }
  
  const operation = opBox.style.display !== 'none' && opSelect.value ? 
    ` (العملية: ${opSelect.options[opSelect.selectedIndex]?.text})` : '';
    
  let previewText = '';
  const productsText = products.length === 1 
    ? `المنتج <strong>${products[0].name}</strong>` 
    : `<strong>${products.length}</strong> منتجات`;
  
  if (mode === 'cash') {
    previewText = `العميل <strong>${customer.name}</strong> سيحصل على ${productsText}${operation} بسعر ثابت <strong class="price-cash">${value.toFixed(2)} ﷼</strong>`;
  } else {
    previewText = `العميل <strong>${customer.name}</strong> سيحصل على خصم <strong class="price-discount">${value}%</strong> على ${productsText}${operation}`;
  }
  
  if (products.length > 1) {
    previewText += '<br><small>المنتجات: ' + products.map(p => p.name).join(' • ') + '</small>';
  }
  
  previewContent.innerHTML = previewText;
  previewSection.style.display = 'block';
}

async function loadOps(){
  try{
    const r = await window.api.ops_list();
    if (r && r.ok){
      opSelect.innerHTML = r.items.map(o=>`<option value="${o.id}">${o.name}</option>`).join('');
    }
  }catch(e){ console.error(e); }
}

function renderSuggest(listEl, items, onPick){
  listEl.innerHTML = '';
  items.forEach(it => {
    const row = document.createElement('div');
    row.className = 'suggest-item';
    row.tabIndex = 0;
    row.textContent = it.__label;
    row.onclick = () => onPick(it);
    row.onkeydown = (e) => { if(e.key==='Enter'){ onPick(it); } };
    listEl.appendChild(row);
  });
  listEl.style.display = items.length ? 'block' : 'none';
}

async function suggestCustomers(q){
  try {
    const r = await window.api.customers_list({ q });
    if(r && r.ok){
      const items = (r.items||[]).map(c => ({...c, __label: `${c.name||''}${c.phone?(' - '+c.phone):''}`}));
      renderSuggest(custSuggest, items, (c) => {
        selectedCustomer = c;
        custSelected.innerHTML = `✅ ${c.name} ${c.phone ? `(${c.phone})` : ''}`;
        custSelected.style.display = 'block';
        custSuggest.style.display = 'none';
        custSearch.value = '';
        updatePreview();
      });
    }
  } catch(err) {
    console.error('خطأ في البحث عن العملاء:', err);
  }
}

async function loadProductOpsAndToggle(productId){
  try{
    const r = await window.api.prod_ops_list(productId);
    const ops = (r && r.ok) ? (r.items||[]) : [];
    if(ops.length){
      // single-op selector
      opBox.style.display='';
      opSelect.innerHTML = ops.map(o=>`<option value="${o.operation_id||o.id}">${o.name}</option>`).join('');
      // bulk per-op pricing list
      if (bulkOpsBox && bulkOpsList){
        bulkOpsBox.style.display='';
        bulkOpsList.innerHTML = `
          <table style="width:100%; border-collapse:collapse;">
            <thead>
              <tr>
                <th style="background:#f9fafb; border-bottom:1px solid #eee; padding:10px;">⚙️ العملية</th>
                <th style="background:#f9fafb; border-bottom:1px solid #eee; padding:10px; text-align:center;">سعر المنتج</th>
                <th style="background:#f9fafb; border-bottom:1px solid #eee; padding:10px; text-align:center;">السعر المخصص</th>
              </tr>
            </thead>
            <tbody>
              ${ops.map(o => `
                <tr>
                  <td style="padding:10px; border-bottom:1px solid #f3f4f6;">${o.name}</td>
                  <td style="padding:10px; text-align:center; border-bottom:1px solid #f3f4f6;">${Number(o.price||0).toFixed(2)}</td>
                  <td style="padding:10px; text-align:center; border-bottom:1px solid #f3f4f6;">
                    <input type="number" step="0.01" min="0" style="width:140px;" data-bulk-op-id="${o.operation_id||o.id}" placeholder="مثال: ${Number(o.price||0).toFixed(2)}" />
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }
    } else {
      opBox.style.display='none';
      opSelect.innerHTML = '';
      if (bulkOpsBox) { bulkOpsBox.style.display='none'; bulkOpsList.innerHTML=''; }
    }
  }catch(_){ 
    opBox.style.display='none'; 
    if (bulkOpsBox) { bulkOpsBox.style.display='none'; bulkOpsList.innerHTML=''; }
  }
}

function renderSelectedProducts() {
  if (!selectedProducts.length) {
    prodSelectedList.style.display = 'none';
    prodSelectedList.innerHTML = '';
    return;
  }
  
  prodSelectedList.style.display = 'flex';
  prodSelectedList.innerHTML = selectedProducts.map((p, idx) => `
    <div class="product-tag">
      <span>✅ ${p.name} ${p.barcode ? `(${p.barcode})` : ''}</span>
      <button class="remove-btn" data-remove-idx="${idx}" title="إزالة">✖</button>
    </div>
  `).join('');
  
  // Add event listeners for remove buttons
  prodSelectedList.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-remove-idx'));
      selectedProducts.splice(idx, 1);
      renderSelectedProducts();
      updateProductOpsVisibility();
      updatePreview();
    });
  });
}

function updateProductOpsVisibility() {
  // Show operations only if exactly 1 product selected
  if (selectedProducts.length === 1) {
    loadProductOpsAndToggle(selectedProducts[0].id);
  } else {
    opBox.style.display = 'none';
    if (bulkOpsBox) { bulkOpsBox.style.display = 'none'; bulkOpsList.innerHTML = ''; }
  }
}

async function suggestProducts(q){
  try {
    // Try barcode exact first, otherwise use list search
    let items = [];
    try{
      const br = await window.api.products_get_by_barcode(q);
      if(br && br.ok && br.item){ items = [br.item]; }
    }catch(_){ }
    if(!items.length){
      const r = await window.api.products_list({ q });
      if(r && r.ok){ items = r.items || []; }
    }
    const mapped = items.map(p => ({...p, __label: `${p.name||''}${p.barcode?(' - '+p.barcode):''}`}));
    renderSuggest(prodSuggest, mapped, async (p) => {
      // Check if product already selected
      if (selectedProducts.find(prod => prod.id === p.id)) {
        showToast('⚠️ هذا المنتج مضاف بالفعل', 'error');
        return;
      }
      
      selectedProducts.push(p);
      renderSelectedProducts();
      prodSuggest.style.display = 'none';
      prodSearch.value = '';
      updateProductOpsVisibility();
      updatePreview();
    });
  } catch(err) {
    console.error('خطأ في البحث عن المنتجات:', err);
  }
}

async function loadRules(){
  const q = searchBox.value.trim();
  
  // إظهار مؤشر تحميل
  rulesTbody.innerHTML = `
    <tr>
      <td colspan="6" style="text-align:center; padding:40px; color:var(--text-light);">
        ⏳ جاري تحميل البيانات...
      </td>
    </tr>
  `;
  
  try {
    const r = await window.api.cust_price_list({ q });
    if (!(r && r.ok)) { 
      rulesTbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding:40px; color:#dc2626;">
            ❌ فشل في تحميل البيانات<br>
            <small>يرجى المحاولة مرة أخرى</small>
          </td>
        </tr>
      `; 
      return; 
    }
    
    const rows = r.items || [];
    if (!rows.length) { 
      const emptyMessage = q ? 
        `<tr>
          <td colspan="6" class="empty-state">
            <h3>🔍 لا توجد نتائج</h3>
            <p>لم يتم العثور على تخصيصات تطابق البحث "${q}"</p>
          </td>
        </tr>` :
        `<tr>
          <td colspan="6" class="empty-state">
            <h3>✨ لا توجد تخصيصات حالياً</h3>
            <p>ابدأ بإضافة تخصيص جديد للأسعار من الأعلى</p>
          </td>
        </tr>`;
      rulesTbody.innerHTML = emptyMessage;
      return; 
    }
    
    rulesTbody.innerHTML = rows.map((it, idx) => `
      <tr>
        <td style="text-align:center; font-weight:600; color:var(--text-light);">${idx+1}</td>
        <td>
          <div style="font-weight:500; color:var(--text);">${it.customer_name || 'غير محدد'}</div>
          ${it.customer_phone ? `<div class="muted">📱 ${it.customer_phone}</div>` : ''}
        </td>
        <td>
          <div style="font-weight:500; color:var(--text);">${it.product_name || 'غير محدد'}</div>
          ${it.product_barcode ? `<div class="muted">📋 ${it.product_barcode}</div>` : ''}
        </td>
        <td style="text-align:center;">
          ${it.operation_name ? `<span class="tag">⚙️ ${it.operation_name}</span>` : '<span class="muted">—</span>'}
        </td>
        <td style="text-align:center;">${fmtRule(it)}</td>
        <td style="text-align:center;">
          <div style="display:flex; gap:8px; justify-content:center;">
            ${canCP('customer_pricing.edit') ? `<button class="btn primary" data-edit="${it.id}" data-json='${JSON.stringify(it).replace(/'/g, "&#39;")}' style="padding:6px 12px; font-size:12px;">✏️ تعديل</button>` : ''}
            ${canCP('customer_pricing.delete') ? `<button class="btn danger" data-del="${it.id}" style="padding:6px 12px; font-size:12px;">🗑️ حذف</button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  } catch(err) {
    rulesTbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding:40px; color:#dc2626;">
          ❌ خطأ في الاتصال بقاعدة البيانات<br>
          <small>${err.message || 'يرجى المحاولة مرة أخرى'}</small>
        </td>
      </tr>
    `;
  }
}

searchBtn.addEventListener('click', loadRules);
addBtn.addEventListener('click', async () => { if(!canCP('customer_pricing.add')) return; await loadOps(); openModal(); });
backBtn.addEventListener('click', () => { window.location.href = '../main/index.html'; });

cancelModal.addEventListener('click', () => closeModal());

// Event listeners for enhanced functionality
modeSelect.addEventListener('change', updateModeDisplay);
valueInput.addEventListener('input', updatePreview);
opSelect.addEventListener('change', updatePreview);

// Enhanced search functionality
let searchTimeout;
custSearch.addEventListener('input', () => { 
  const q = custSearch.value.trim(); 
  clearTimeout(searchTimeout);
  if(q.length >= 2){ 
    searchTimeout = setTimeout(() => suggestCustomers(q), 300);
  } else { 
    custSuggest.style.display='none'; 
  } 
});

prodSearch.addEventListener('input', () => { 
  const q = prodSearch.value.trim(); 
  clearTimeout(searchTimeout);
  if(q.length >= 2){ 
    searchTimeout = setTimeout(() => suggestProducts(q), 300);
  } else { 
    prodSuggest.style.display='none'; 
  } 
});

// Save bulk per-operation prices
if (saveBulkBtn){
  saveBulkBtn.addEventListener('click', async () => {
    if(!canCP('customer_pricing.add') && !canCP('customer_pricing.edit')) return;
    if(!selectedCustomer){ showToast('⚠️ يرجى اختيار العميل أولاً', 'error'); return; }
    if(!selectedProduct){ showToast('⚠️ يرجى اختيار المنتج أولاً', 'error'); return; }

    const inputs = Array.from(bulkOpsList.querySelectorAll('input[data-bulk-op-id]'));
    const entries = inputs
      .map(inp => ({ operation_id: Number(inp.getAttribute('data-bulk-op-id')), value: Number(inp.value||0) }))
      .filter(it => it.operation_id && it.value > 0);

    if(!entries.length){ showToast('⚠️ أدخل قيمة واحدة على الأقل', 'error'); return; }

    // disable button during save
    const original = saveBulkBtn.innerHTML;
    saveBulkBtn.innerHTML = '⏳ جاري الحفظ...';
    saveBulkBtn.disabled = true;

    try{
      // For each entry, upsert cash price rule
      for(const it of entries){
        const payload = { customer_id: selectedCustomer.id, product_id: selectedProduct.id, operation_id: it.operation_id, mode: 'cash', value: it.value };
        const r = await window.api.cust_price_upsert(payload);
        if(!(r && r.ok)) throw new Error('فشل حفظ أحد الأسعار');
      }
      showToast('✅ تم حفظ أسعار العمليات', 'success');
      await loadRules();
      closeModal();
    }catch(e){
      showToast('❌ فشل حفظ أسعار العمليات', 'error');
    }finally{
      saveBulkBtn.innerHTML = original;
      saveBulkBtn.disabled = false;
    }
  });
}

// Enhanced search with Enter key
searchBox.addEventListener('keypress', (e) => {
  if(e.key === 'Enter') {
    e.preventDefault();
    loadRules();
  }
});

// Hide suggestions when clicking outside
document.addEventListener('click', (e) => {
  if (!custSearch.contains(e.target) && !custSuggest.contains(e.target)) {
    custSuggest.style.display = 'none';
  }
  if (!prodSearch.contains(e.target) && !prodSuggest.contains(e.target)) {
    prodSuggest.style.display = 'none';
  }
});

saveRuleBtn.addEventListener('click', async () => {
  // التحقق من صحة البيانات
  if (!selectedCustomer) { 
    showToast('⚠️ يرجى اختيار العميل أولاً', 'error'); 
    custSearch.focus();
    return; 
  }
  
  if (!selectedProducts.length) { 
    showToast('⚠️ يرجى اختيار منتج واحد على الأقل', 'error'); 
    prodSearch.focus();
    return; 
  }
  
  const mode = modeSelect.value;
  const value = Number(valueInput.value || 0);
  
  if (!(value > 0)) { 
    showToast('⚠️ يرجى إدخال قيمة صحيحة أكبر من صفر', 'error'); 
    valueInput.focus();
    return; 
  }
  
  if (mode === 'percent' && value >= 100) {
    showToast('⚠️ نسبة الخصم يجب أن تكون أقل من 100%', 'error'); 
    valueInput.focus();
    return; 
  }
  
  // التحقق من العملية إذا كانت ظاهرة (فقط عند اختيار منتج واحد)
  const operation_id = opBox.style.display !== 'none' ? Number(opSelect.value) : null;
  if(opBox.style.display !== 'none' && !operation_id){ 
    showToast('⚠️ يرجى اختيار العملية', 'error'); 
    opSelect.focus();
    return; 
  }
  
  // تعطيل الزر أثناء المعالجة
  const originalText = saveRuleBtn.innerHTML;
  saveRuleBtn.innerHTML = '⏳ جاري الحفظ...';
  saveRuleBtn.disabled = true;
  
  try {
    if (editingId){ 
      // في حالة التعديل، يكون هناك منتج واحد فقط
      const payload = { customer_id: selectedCustomer.id, product_id: selectedProducts[0].id, operation_id, mode, value };
      const r = await window.api.cust_price_update(editingId, payload);
      
      if (r && r.ok){ 
        showToast('✅ تم تحديث التخصيص بنجاح!', 'success');
        closeModal(); 
        await loadRules(); 
      } else { 
        showToast(`❌ ${r && r.error ? r.error : 'فشل في تحديث التخصيص'}`, 'error');
      }
    } else {
      // في حالة الإضافة، قد يكون هناك عدة منتجات
      let successCount = 0;
      let failCount = 0;
      
      for (const product of selectedProducts) {
        const payload = { customer_id: selectedCustomer.id, product_id: product.id, operation_id, mode, value };
        const r = await window.api.cust_price_upsert(payload);
        
        if (r && r.ok) {
          successCount++;
        } else {
          failCount++;
        }
      }
      
      if (successCount > 0) {
        const message = selectedProducts.length === 1 
          ? '✅ تم حفظ التخصيص بنجاح!'
          : `✅ تم حفظ ${successCount} تخصيص بنجاح${failCount > 0 ? ` (فشل ${failCount})` : ''}`;
        showToast(message, 'success');
        closeModal(); 
        await loadRules();
      } else {
        showToast('❌ فشل في حفظ جميع التخصيصات', 'error');
      }
    }
  } catch(err) {
    showToast('❌ خطأ في الاتصال بالخادم', 'error');
  } finally {
    // استعادة الزر
    saveRuleBtn.innerHTML = originalText;
    saveRuleBtn.disabled = false;
  }
});

// Toast notification system
function showToast(message, type = 'success') {
  // إنشاء عنصر Toast
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = message;
  
  // إضافة الأنماط
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 12px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    min-width: 250px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease-out;
  `;
  
  if (type === 'success') {
    toast.style.background = 'linear-gradient(135deg, #10b981, #059669)';
  } else {
    toast.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
  }
  
  document.body.appendChild(toast);
  
  // إزالة بعد 3 ثواني
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in forwards';
    setTimeout(() => {
      if (toast.parentNode) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

rulesTbody.addEventListener('click', async (e) => {
  const del = e.target.closest('button[data-del]');
  if (del){
    if(!canCP('customer_pricing.delete')) return;
    
    const id = Number(del.getAttribute('data-del'));
    const row = del.closest('tr');
    const customerName = row.querySelector('td:nth-child(2) div:first-child')?.textContent || 'العميل';
    const productName = row.querySelector('td:nth-child(3) div:first-child')?.textContent || 'المنتج';
    
    if (!(await miniConfirm(`🗑️ تأكيد حذف تخصيص السعر\n\nالعميل: ${customerName}\nالمنتج: ${productName}\n\nسيتم حذف التخصيص نهائياً ولا يمكن التراجع عن هذا الإجراء.`))) return;
    
    // تعطيل الزر أثناء المعالجة
    const originalText = del.innerHTML;
    del.innerHTML = '⏳ جاري الحذف...';
    del.disabled = true;
    
    try {
      const r = await window.api.cust_price_delete(id);
      if (r && r.ok){ 
        showToast('✅ تم حذف التخصيص بنجاح!', 'success');
        await loadRules(); 
      } else { 
        showToast('❌ فشل في حذف التخصيص', 'error');
        del.innerHTML = originalText;
        del.disabled = false;
      }
    } catch(err) {
      showToast('❌ خطأ في الاتصال', 'error');
      del.innerHTML = originalText;
      del.disabled = false;
    }
    return;
  }
  
  const edit = e.target.closest('button[data-edit]');
  if (edit){
    if(!canCP('customer_pricing.edit')) return;
    
    try{
      const raw = edit.getAttribute('data-json');
      const it = JSON.parse(raw.replace(/&#39;/g, "'"));
      
      // تعيين القيم المبدئية
      selectedCustomer = { id: it.customer_id, name: it.customer_name, phone: it.customer_phone };
      selectedProducts = [{ id: it.product_id, name: it.product_name, barcode: it.product_barcode }];
      
      // عرض العناصر المختارة
      custSelected.innerHTML = `✅ ${selectedCustomer.name} ${selectedCustomer.phone ? `(${selectedCustomer.phone})` : ''}`;
      custSelected.style.display = 'block';
      renderSelectedProducts();
      
      // مسح حقول البحث
      custSearch.value = '';
      prodSearch.value = '';
      
      // تحميل العمليات وتعيين القيم
      await loadProductOpsAndToggle(it.product_id);
      if(it.operation_id){ opSelect.value = String(it.operation_id); }
      
      // تعيين نوع التخصيص والقيمة
      if(it.price_cash != null){ 
        modeSelect.value = 'cash'; 
        valueInput.value = String(it.price_cash); 
      } else if(it.discount_percent != null){ 
        modeSelect.value = 'percent'; 
        valueInput.value = String(it.discount_percent); 
      } else { 
        modeSelect.value = 'cash'; 
        valueInput.value = ''; 
      }
      
      editingId = it.id;
      updateModeDisplay();
      openModal();
    }catch(err){ 
      console.error(err); 
      showToast('❌ تعذر فتح التعديل', 'error');
    }
  }
});

// إضافة أنماط CSS للـ Toast animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(100px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideOut {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(100px); }
  }
`;
document.head.appendChild(style);

// initial: ensure permissions loaded before first render to show action buttons
(async()=>{ await loadPerms(); await loadRules(); })();