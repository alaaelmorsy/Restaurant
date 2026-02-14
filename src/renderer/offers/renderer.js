// Optimized Offers & Coupons renderer
// ========================================

// Toast Notification System
// ==========================
function showToast(message, { type = 'success', title = '', duration = 4000 } = {}) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  const titles = {
    success: title || 'نجح',
    error: title || 'خطأ',
    warning: title || 'تحذير',
    info: title || 'معلومة'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-content">
      <div class="toast-title">${titles[type]}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" aria-label="إغلاق">×</button>
  `;

  const closeBtn = toast.querySelector('.toast-close');
  
  const removeToast = () => {
    toast.classList.add('toast-hiding');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 300);
  };

  closeBtn.addEventListener('click', removeToast);

  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(removeToast, duration);
  }
}

// DOM Elements Cache
const elements = {
  backBtn: document.getElementById('backBtn'),
  addOfferBtn: document.getElementById('addOfferBtn'),
  addGlobalOfferBtn: document.getElementById('addGlobalOfferBtn'),
  addCouponBtn: document.getElementById('addCouponBtn'),
  searchBox: document.getElementById('searchBox'),
  searchBtn: document.getElementById('searchBtn'),
  refreshBtn: document.getElementById('refreshBtn'),
  offersTbody: document.getElementById('offersTbody'),
  globalOffersTbody: document.getElementById('globalOffersTbody'),
  couponsTbody: document.getElementById('couponsTbody'),
  modalBackdrop: document.getElementById('modalBackdrop'),
  modalTitle: document.getElementById('modalTitle'),
  modalContent: document.getElementById('modalContent'),
  cancelModal: document.getElementById('cancelModal'),
  saveModal: document.getElementById('saveModal')
};

// Tabs System
// ===========
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      
      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked button and corresponding content
      button.classList.add('active');
      const targetContent = document.getElementById(targetTab);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });
}

// Initialize tabs when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
});

// State Management
const state = {
  editingType: null, // 'offer' | 'coupon'
  editingId: null,
  editingIsGlobal: 0,
  currentOffer: null, // Current offer/coupon being edited
  offerProducts: [], // {product_id, product_name, operation_id, operation_name}
  isLoading: false
};

// Permissions Cache
let permissions = new Set();
const permissionAlias = {
  'offers.add': 'offers.add_offer',
  'offers.add_global': 'offers.add_global_offer',
  'offers.edit': 'offers.edit_offer',
  'offers.toggle': 'offers.toggle_offer',
  'offers.delete': 'offers.delete_offer',
  'coupons.add': 'offers.add_coupon',
  'coupons.edit': 'offers.edit_coupon',
  'coupons.toggle': 'offers.toggle_coupon',
  'coupons.delete': 'offers.delete_coupon'
};

// Utility Functions
// ================

function hasPermission(key) {
  const actualKey = permissionAlias[key] || key;
  return permissions.has('offers') && permissions.has(actualKey);
}

function showLoading(tbody) {
  let colCount = 7;
  if (tbody === elements.offersTbody) colCount = 8;
  else if (tbody === elements.globalOffersTbody) colCount = 7;
  
  tbody.innerHTML = `
    <tr>
      <td colspan="${colCount}" class="loading">
        جاري التحميل...
        <div class="spinner"></div>
      </td>
    </tr>
  `;
}

function showEmpty(tbody, message = 'لا توجد بيانات') {
  let colCount = 7;
  if (tbody === elements.offersTbody) colCount = 8;
  else if (tbody === elements.globalOffersTbody) colCount = 7;
  
  tbody.innerHTML = `
    <tr>
      <td colspan="${colCount}" class="empty-state">
        <div class="empty-state-icon">📋</div>
        <div class="empty-state-text">${message}</div>
      </td>
    </tr>
  `;
}

function formatDateRange(startDate, endDate) {
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    // Show time only if it's not midnight (00:00)
    const showTime = hours !== '00' || minutes !== '00';
    const dateStr = `${day}/${month}/${year}`;
    
    return showTime ? `${dateStr} ${hours}:${minutes}` : dateStr;
  };
  
  if (startDate && endDate) {
    return `<div class="date-range">
              <div class="date-from">من: ${formatDate(startDate)}</div>
              <div class="date-to">إلى: ${formatDate(endDate)}</div>
            </div>`;
  }
  if (startDate) {
    return `<div class="date-range">
              <div class="date-from">من: ${formatDate(startDate)}</div>
            </div>`;
  }
  if (endDate) {
    return `<div class="validity-info">
              <div class="validity-label">صالح حتى</div>
              <div class="validity-date">${formatDate(endDate)}</div>
            </div>`;
  }
  return '<div class="date-range"><div class="no-date">غير محدد</div></div>';
}

function formatCouponValidity(startDate, endDate) {
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    // Show time only if it's not midnight (00:00)
    const showTime = hours !== '00' || minutes !== '00';
    const dateStr = `${day}/${month}/${year}`;
    
    return showTime ? `${dateStr} ${hours}:${minutes}` : dateStr;
  };

  // للكوبونات نركز على تاريخ انتهاء الصلاحية
  const now = new Date();
  
  if (endDate) {
    const endDateObj = new Date(endDate);
    const isExpired = endDateObj < now;
    
    return `<div class="validity-info">
              <div class="validity-label">${isExpired ? 'انتهت في' : 'صالح حتى'}</div>
              <div class="validity-date" ${isExpired ? 'style="color: var(--danger-600)"' : ''}>${formatDate(endDate)}</div>
            </div>`;
  }
  
  if (startDate) {
    return `<div class="validity-info">
              <div class="validity-label">بدأ من</div>
              <div class="validity-date">${formatDate(startDate)}</div>
            </div>`;
  }
  
  return '<div class="validity-info"><div class="validity-date">غير محدد</div></div>';
}

function formatMode(mode) {
  return mode === 'percent' ? 'نسبة %' : 'نقدي';
}

function formatOfferType(offer) {
  return offer.is_global ? 
    '<span class="badge badge-secondary">عام</span>' : 
    'أصناف محددة';
}

function formatStatus(isActive) {
  return isActive ? 
    '<span class="badge badge-success">نشط</span>' : 
    '<span class="badge badge-warning">موقوف</span>';
}

function miniConfirm(message, opts = {}) {
  const { confirmText = 'تأكيد', cancelText = 'إلغاء' } = opts || {};
  return new Promise((resolve) => {
    let dlg = document.getElementById('miniConfirmDialog');
    if (!dlg) {
      dlg = document.createElement('dialog');
      dlg.id = 'miniConfirmDialog';
      dlg.style.position = 'fixed';
      dlg.style.top = '50%';
      dlg.style.left = '50%';
      dlg.style.transform = 'translate(-50%, -50%)';
      dlg.style.margin = '0';
      dlg.style.padding = '0';
      dlg.style.border = 'none';
      dlg.style.borderRadius = '8px';
      dlg.style.maxWidth = '360px';
      dlg.style.width = '90vw';
      dlg.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
      dlg.style.background = 'var(--panel, #fff)';
      dlg.style.zIndex = '2147483647';
      document.body.appendChild(dlg);

      let styleEl = document.getElementById('miniConfirmBackdropStyle');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'miniConfirmBackdropStyle';
        styleEl.textContent = '#miniConfirmDialog::backdrop{background:rgba(0,0,0,0.35)}';
        document.head.appendChild(styleEl);
      }
    }

    dlg.innerHTML = `
      <div style="padding:16px; min-width:280px;">
        <div style="font-size:14px; margin-bottom:16px;">${message || ''}</div>
        <div style="display:flex; gap:8px; justify-content:flex-end;">
          <button type="button" data-cancel class="btn btn-outline">${cancelText}</button>
          <button type="button" data-confirm class="btn btn-danger">${confirmText}</button>
        </div>
      </div>
    `;

    const confirmBtn = dlg.querySelector('[data-confirm]');
    const cancelBtn = dlg.querySelector('[data-cancel]');

    function finalize(val){
      cleanup();
      try { if (dlg.open) dlg.close(); } catch(_){}
      resolve(val);
    }

    const onConfirm = () => finalize(true);
    const onCancel = () => finalize(false);

    function cleanup() {
      confirmBtn?.removeEventListener('click', onConfirm);
      cancelBtn?.removeEventListener('click', onCancel);
      dlg.removeEventListener('cancel', onCancel);
    }

    confirmBtn?.addEventListener('click', onConfirm, { once: true });
    cancelBtn?.addEventListener('click', onCancel, { once: true });
    dlg.addEventListener('cancel', onCancel, { once: true });

    try { dlg.showModal(); } catch (_) { dlg.show(); }
  });
}

// Modal Functions
// ==============

function openModal(title, content) {
  elements.modalTitle.textContent = title;
  elements.modalContent.innerHTML = content;
  elements.modalBackdrop.classList.add('show');
  document.body.classList.add('modal-open');
}

function closeModal() {
  elements.modalBackdrop.classList.remove('show');
  document.body.classList.remove('modal-open');
  
  // Reset state
  state.editingType = null;
  state.editingId = null;
  state.editingIsGlobal = 0;
  state.offerProducts = [];
  elements.modalContent.innerHTML = '';
}

// Data Loading
// ============

async function loadPermissions() {
  try {
    const user = JSON.parse(localStorage.getItem('pos_user') || 'null');
    if (user && user.id) {
      const result = await window.api.perms_get_for_user(user.id);
      if (result && result.ok) {
        permissions = new Set(result.keys || []);
      }
    }
  } catch (error) {
    console.warn('Error loading permissions:', error);
    permissions = new Set();
  }
}

async function loadData() {
  if (state.isLoading) return;
  
  state.isLoading = true;
  const searchQuery = elements.searchBox.value.trim();
  const query = searchQuery ? { q: searchQuery } : {};
  
  try {
    // Show loading states
    showLoading(elements.offersTbody);
    if (elements.globalOffersTbody) showLoading(elements.globalOffersTbody);
    showLoading(elements.couponsTbody);
    
    // Load data in parallel
    const [offersResult, couponsResult] = await Promise.all([
      window.api.offers_list(query),
      window.api.coupons_list(query)
    ]);
    
    // Separate offers into item offers and global offers
    const allOffers = (offersResult && offersResult.ok) ? (offersResult.items || []) : [];
    const itemOffers = allOffers.filter(offer => !offer.is_global);
    const globalOffers = allOffers.filter(offer => offer.is_global);
    
    // Render offers in their respective tabs
    renderOffers({ ok: true, items: itemOffers });
    renderGlobalOffers({ ok: true, items: globalOffers });
    
    // Render coupons
    renderCoupons(couponsResult);
    
    // Update global offer button based on all offers
    updateGlobalOfferButton(allOffers);
    
  } catch (error) {
    console.error('Error loading data:', error);
    showEmpty(elements.offersTbody, 'حدث خطأ في تحميل البيانات');
    if (elements.globalOffersTbody) showEmpty(elements.globalOffersTbody, 'حدث خطأ في تحميل البيانات');
    showEmpty(elements.couponsTbody, 'حدث خطأ في تحميل البيانات');
  } finally {
    state.isLoading = false;
  }
}

function renderOffers(result) {
  const offers = (result && result.ok) ? (result.items || []) : [];
  
  if (!offers.length) {
    showEmpty(elements.offersTbody, 'لا توجد عروض على الأصناف');
    return;
  }
  
  elements.offersTbody.innerHTML = offers.map((offer, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${offer.name || ''}</td>
      <td>${formatMode(offer.mode)}</td>
      <td>${offer.items_count || 0} صنف</td>
      <td>${Number(offer.value || 0).toFixed(2)}</td>
      <td>${formatDateRange(offer.start_date, offer.end_date)}</td>
      <td>${formatStatus(offer.is_active)}</td>
      <td>
        <div class="action-buttons">
          ${hasPermission('offers.edit') ? 
            `<button class="btn btn-outline btn-sm" onclick="editOffer(${offer.id})">تعديل</button>` : ''}
          ${hasPermission('offers.toggle') ? 
            `<button class="btn ${offer.is_active ? 'btn-outline' : 'btn-success'} btn-sm" onclick="toggleOffer(${offer.id})">
              ${offer.is_active ? 'إيقاف' : 'تفعيل'}
            </button>` : ''}
          ${hasPermission('offers.delete') ? 
            `<button class="btn btn-danger btn-sm" onclick="deleteOffer(${offer.id})">حذف</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

function renderGlobalOffers(result) {
  const offers = (result && result.ok) ? (result.items || []) : [];
  
  if (!elements.globalOffersTbody) return;
  
  if (!offers.length) {
    showEmpty(elements.globalOffersTbody, 'لا توجد عروض عامة');
    return;
  }
  
  elements.globalOffersTbody.innerHTML = offers.map((offer, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${offer.name || ''}</td>
      <td>${formatMode(offer.mode)}</td>
      <td>${Number(offer.value || 0).toFixed(2)}</td>
      <td>${formatDateRange(offer.start_date, offer.end_date)}</td>
      <td>${formatStatus(offer.is_active)}</td>
      <td>
        <div class="action-buttons">
          ${hasPermission('offers.edit') ? 
            `<button class="btn btn-outline btn-sm" onclick="editOffer(${offer.id})">تعديل</button>` : ''}
          ${hasPermission('offers.toggle') ? 
            `<button class="btn ${offer.is_active ? 'btn-outline' : 'btn-success'} btn-sm" onclick="toggleOffer(${offer.id})">
              ${offer.is_active ? 'إيقاف' : 'تفعيل'}
            </button>` : ''}
          ${hasPermission('offers.delete') ? 
            `<button class="btn btn-danger btn-sm" onclick="deleteOffer(${offer.id})">حذف</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

function renderCoupons(result) {
  const coupons = (result && result.ok) ? (result.items || []) : [];
  
  if (!coupons.length) {
    showEmpty(elements.couponsTbody, 'لا توجد كوبونات');
    return;
  }
  
  elements.couponsTbody.innerHTML = coupons.map((coupon, index) => `
    <tr>
      <td>${index + 1}</td>
      <td><code>${coupon.code || ''}</code></td>
      <td>${formatMode(coupon.mode)}</td>
      <td>${Number(coupon.value || 0).toFixed(2)}</td>
      <td>${formatCouponValidity(coupon.start_date, coupon.end_date)}</td>
      <td>${formatStatus(coupon.is_active)}</td>
      <td>
        <div class="action-buttons">
          ${hasPermission('coupons.edit') ? 
            `<button class="btn btn-outline btn-sm" onclick="editCoupon(${coupon.id})">تعديل</button>` : ''}
          ${hasPermission('coupons.toggle') ? 
            `<button class="btn ${coupon.is_active ? 'btn-outline' : 'btn-success'} btn-sm" onclick="toggleCoupon(${coupon.id})">
              ${coupon.is_active ? 'إيقاف' : 'تفعيل'}
            </button>` : ''}
          ${hasPermission('coupons.delete') ? 
            `<button class="btn btn-danger btn-sm" onclick="deleteCoupon(${coupon.id})">حذف</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

function updateGlobalOfferButton(offers) {
  if (!elements.addGlobalOfferBtn) return;
  
  const hasGlobal = offers.some(offer => Number(offer.is_global || 0) === 1);
  elements.addGlobalOfferBtn.disabled = hasGlobal;
  elements.addGlobalOfferBtn.title = hasGlobal ? 
    'يوجد عرض عام بالفعل — احذف العرض الحالي أولاً' : '';
}

// Form Generation
// ==============

function generateOfferForm(initialData = {}) {
  const data = {
    name: '',
    description: '',
    mode: 'percent',
    value: '',
    start_date: '',
    end_date: '',
    is_active: 1,
    ...initialData
  };
  
  return `
    <div class="form-grid">
      <div class="form-field">
        <label class="form-label">اسم العرض *</label>
        <input id="f_name" class="form-input" placeholder="اسم العرض" value="${data.name}" required />
      </div>
      
      <div class="form-field">
        <label class="form-label">الوصف</label>
        <input id="f_desc" class="form-input" placeholder="وصف اختياري" value="${data.description}" />
      </div>
      
      <div class="form-field">
        <label class="form-label">النوع *</label>
        <select id="f_mode" class="form-select">
          <option value="percent" ${data.mode === 'percent' ? 'selected' : ''}>نسبة %</option>
          <option value="cash" ${data.mode === 'cash' ? 'selected' : ''}>نقدي</option>
        </select>
      </div>
      
      <div class="form-field">
        <label class="form-label">القيمة *</label>
        <input id="f_value" class="form-input" type="number" step="0.01" min="0" 
               value="${data.value}" placeholder="0.00" required />
      </div>
      
      <div class="form-field">
        <label class="form-label">من تاريخ</label>
        <input id="f_start" class="form-input" type="datetime-local" lang="en" 
               value="${data.start_date ? new Date(data.start_date).toISOString().slice(0, 16) : ''}" />
      </div>
      
      <div class="form-field">
        <label class="form-label">إلى تاريخ</label>
        <input id="f_end" class="form-input" type="datetime-local" lang="en" 
               value="${data.end_date ? new Date(data.end_date).toISOString().slice(0, 16) : ''}" />
      </div>
      
      <div class="form-field">
        <label class="form-label">الحالة</label>
        <select id="f_active" class="form-select">
          <option value="1" ${data.is_active ? 'selected' : ''}>نشط</option>
          <option value="0" ${!data.is_active ? 'selected' : ''}>موقوف</option>
        </select>
      </div>
      
      <div class="form-field full-width" id="excludedCategoriesPicker" ${!state.editingIsGlobal ? 'style="display:none"' : ''}>
        <hr style="border: none; border-top: 1px solid var(--border); margin: 1rem 0;" />
        <label class="form-label">🚫 استثناء أنواع رئيسية من العرض العام</label>
        <p style="font-size: 13px; color: var(--gray-600); margin-bottom: 0.75rem;">
          العرض العام يطبق على كل الأصناف. يمكنك استثناء أنواع رئيسية معينة من العرض.
        </p>
        <div style="background: var(--gray-50); padding: 1rem; border-radius: var(--radius-lg);">
          <div class="custom-dropdown" id="excludedCategoriesDropdown">
            <button type="button" class="dropdown-toggle" id="excludedCategoriesToggle">
              <span class="dropdown-label">اختر الأنواع المستثناة</span>
              <span class="dropdown-arrow">▼</span>
            </button>
            <div class="dropdown-menu" id="excludedCategoriesMenu">
              <div class="dropdown-items" id="excludedCategoriesItems">
                <!-- Will be populated dynamically -->
              </div>
            </div>
          </div>
          <p style="font-size: 12px; color: var(--gray-500); margin-top: 0.5rem; margin-bottom: 0;">
            💡 يمكنك تحديد أكثر من نوع
          </p>
        </div>
      </div>
      
      <div class="form-field full-width" id="productPicker" ${state.editingIsGlobal ? 'style="display:none"' : ''}>
        <hr style="border: none; border-top: 1px solid var(--border); margin: 1rem 0;" />
        <label class="form-label">الأصناف المشمولة في العرض</label>
        
        <!-- إضافة حسب النوع الرئيسي -->
        <div style="background: var(--gray-50); padding: 1rem; border-radius: var(--radius-lg); margin-bottom: 1rem;">
          <label class="form-label" style="margin-bottom: 0.5rem;">⚡ إضافة سريعة حسب النوع الرئيسي</label>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <select id="categorySelect" class="form-select" style="flex: 1;">
              <option value="">-- اختر نوعاً رئيسياً --</option>
            </select>
            <button type="button" id="addCategoryBtn" class="btn btn-success">
              ➕ إضافة كل الأصناف
            </button>
          </div>
        </div>
        
        <!-- إضافة صنف واحد -->
        <div style="margin-bottom: 0.5rem;">
          <label class="form-label" style="margin-bottom: 0.5rem;">أو إضافة صنف واحد</label>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <input id="prodSearch" class="form-input" placeholder="ابحث عن صنف لإضافته للعرض" style="flex: 1;" />
            <div id="opBox" style="display: none;">
              <select id="opSelect" class="form-select"></select>
            </div>
            <button type="button" id="addProdToOffer" class="btn btn-primary">إضافة</button>
          </div>
        </div>
        
        <div id="prodSuggest" class="card hidden" style="max-height: 200px; overflow-y: auto;"></div>
        
        <div id="selectedItems" class="card" style="min-height: 60px; padding: 0.75rem;">
          <div class="text-muted text-center">لم يتم إضافة أصناف بعد</div>
        </div>
      </div>
    </div>
  `;
}

function generateCouponForm(initialData = {}) {
  const data = {
    code: '',
    name: '',
    mode: 'percent',
    value: '',
    start_date: '',
    end_date: '',
    min_invoice_total: '',
    usage_limit: '',
    is_active: 1,
    ...initialData
  };
  
  return `
    <div class="form-grid">
      <div class="form-field">
        <label class="form-label">رمز الكوبون *</label>
        <input id="c_code" class="form-input" placeholder="مثال: SAVE10" value="${data.code}" required />
      </div>
      
      <div class="form-field">
        <label class="form-label">اسم/وصف الكوبون</label>
        <input id="c_name" class="form-input" placeholder="اختياري" value="${data.name}" />
      </div>
      
      <div class="form-field">
        <label class="form-label">النوع *</label>
        <select id="c_mode" class="form-select">
          <option value="percent" ${data.mode === 'percent' ? 'selected' : ''}>نسبة %</option>
          <option value="cash" ${data.mode === 'cash' ? 'selected' : ''}>نقدي</option>
        </select>
      </div>
      
      <div class="form-field">
        <label class="form-label">القيمة *</label>
        <input id="c_value" class="form-input" type="number" step="0.01" min="0" 
               value="${data.value}" placeholder="0.00" required />
      </div>
      
      <div class="form-field">
        <label class="form-label">من تاريخ</label>
        <input id="c_start" class="form-input" type="datetime-local" lang="en" 
               value="${data.start_date ? new Date(data.start_date).toISOString().slice(0, 16) : ''}" />
      </div>
      
      <div class="form-field">
        <label class="form-label">إلى تاريخ</label>
        <input id="c_end" class="form-input" type="datetime-local" lang="en" 
               value="${data.end_date ? new Date(data.end_date).toISOString().slice(0, 16) : ''}" />
      </div>
      
      <div class="form-field">
        <label class="form-label">حد أدنى للفاتورة</label>
        <input id="c_min" class="form-input" type="number" step="0.01" min="0" 
               value="${data.min_invoice_total}" placeholder="0.00" />
      </div>
      
      <div class="form-field">
        <label class="form-label">حد الاستخدام</label>
        <input id="c_limit" class="form-input" type="number" min="0" 
               value="${data.usage_limit}" placeholder="غير محدود" />
      </div>
      
      <div class="form-field">
        <label class="form-label">الحالة</label>
        <select id="c_active" class="form-select">
          <option value="1" ${data.is_active ? 'selected' : ''}>نشط</option>
          <option value="0" ${!data.is_active ? 'selected' : ''}>موقوف</option>
        </select>
      </div>
    </div>
  `;
}

// Action Functions (Global for onclick handlers)
// =============================================

window.editOffer = async function(id) {
  if (!hasPermission('offers.edit')) return;
  
  try {
    const result = await window.api.offers_list({});
    const offer = (result.items || []).find(item => Number(item.id) === id);
    if (!offer) {
      alert('العرض غير موجود');
      return;
    }
    
    state.editingType = 'offer';
    state.editingId = id;
    state.editingIsGlobal = Number(offer.is_global || 0);
    state.currentOffer = offer;
    
    openModal('تعديل عرض', generateOfferForm(offer));
    await initOfferForm();
    
    // Load current products if not global
    if (!state.editingIsGlobal) {
      try {
        const productsResult = await window.api.offers_get_products(id);
        if (productsResult && productsResult.ok) {
          state.offerProducts = (productsResult.items || []).map(item => ({
            product_id: item.product_id,
            product_name: item.product_name || ('ID ' + item.product_id),
            operation_id: item.operation_id ?? null,
            operation_name: item.operation_name || ''
          }));
          renderSelectedProducts();
        }
      } catch (error) {
        console.warn('Error loading offer products:', error);
      }
    }
  } catch (error) {
    console.error('Error editing offer:', error);
    alert('حدث خطأ في تحميل بيانات العرض');
  }
};

window.deleteOffer = async function(id) {
  if (!hasPermission('offers.delete')) return;
  if (!(await miniConfirm('هل أنت متأكد من حذف هذا العرض؟\nسيتم حذف جميع البيانات المرتبطة به.'))) return;
  
  try {
    const result = await window.api.offers_delete(id);
    if (!result.ok) {
      alert(result.error || 'فشل حذف العرض');
      return;
    }
    
    await loadData();
  } catch (error) {
    console.error('Error deleting offer:', error);
    alert('حدث خطأ في حذف العرض');
  }
};

window.toggleOffer = async function(id) {
  if (!hasPermission('offers.toggle')) return;
  
  try {
    const result = await window.api.offers_toggle(id);
    if (!result.ok) {
      alert(result.error || 'فشل تغيير حالة العرض');
      return;
    }
    
    await loadData();
  } catch (error) {
    console.error('Error toggling offer:', error);
    alert('حدث خطأ في تغيير حالة العرض');
  }
};

window.editCoupon = async function(id) {
  if (!hasPermission('coupons.edit')) return;
  
  try {
    const result = await window.api.coupons_list({});
    const coupon = (result.items || []).find(item => Number(item.id) === id);
    if (!coupon) {
      alert('الكوبون غير موجود');
      return;
    }
    
    state.editingType = 'coupon';
    state.editingId = id;
    
    openModal('تعديل كوبون', generateCouponForm(coupon));
  } catch (error) {
    console.error('Error editing coupon:', error);
    alert('حدث خطأ في تحميل بيانات الكوبون');
  }
};

window.deleteCoupon = async function(id) {
  if (!hasPermission('coupons.delete')) return;
  if (!(await miniConfirm('هل أنت متأكد من حذف هذا الكوبون؟'))) return;
  
  try {
    const result = await window.api.coupons_delete(id);
    if (!result.ok) {
      alert(result.error || 'فشل حذف الكوبون');
      return;
    }
    
    await loadData();
  } catch (error) {
    console.error('Error deleting coupon:', error);
    alert('حدث خطأ في حذف الكوبون');
  }
};

window.toggleCoupon = async function(id) {
  if (!hasPermission('coupons.toggle')) return;
  
  try {
    const result = await window.api.coupons_toggle(id);
    if (!result.ok) {
      alert(result.error || 'فشل تغيير حالة الكوبون');
      return;
    }
    
    await loadData();
  } catch (error) {
    console.error('Error toggling coupon:', error);
    alert('حدث خطأ في تغيير حالة الكوبون');
  }
};

// Save Function
// ============

async function saveForm() {
  if (state.editingType === 'offer') {
    await saveOffer();
  } else if (state.editingType === 'coupon') {
    await saveCoupon();
  }
}

async function saveOffer() {
  const nameEl = document.getElementById('f_name');
  const descEl = document.getElementById('f_desc');
  const modeEl = document.getElementById('f_mode');
  const valueEl = document.getElementById('f_value');
  const startEl = document.getElementById('f_start');
  const endEl = document.getElementById('f_end');
  const activeEl = document.getElementById('f_active');
  
  // Validation
  if (!nameEl?.value?.trim()) {
    alert('اسم العرض مطلوب');
    nameEl?.focus();
    return;
  }
  
  if (!valueEl?.value || Number(valueEl.value) <= 0) {
    alert('قيمة العرض مطلوبة ويجب أن تكون أكبر من صفر');
    valueEl?.focus();
    return;
  }
  
  const payload = {
    name: nameEl.value.trim(),
    description: descEl?.value?.trim() || null,
    mode: modeEl?.value || 'percent',
    value: Number(valueEl?.value || 0),
    start_date: startEl?.value || null,
    end_date: endEl?.value || null,
    is_active: Number(activeEl?.value || 1),
    is_global: state.editingIsGlobal
  };
  
  // Add excluded categories for global offers
  if (state.editingIsGlobal) {
    const excludedCheckboxes = document.querySelectorAll('#excludedCategoriesItems input[type="checkbox"]:checked');
    if (excludedCheckboxes) {
      const excludedCategories = Array.from(excludedCheckboxes).map(cb => cb.value);
      payload.excluded_categories = excludedCategories.length > 0 ? JSON.stringify(excludedCategories) : null;
    }
  }
  
  try {
    let offerId = state.editingId;
    let result;
    
    if (state.editingId) {
      result = await window.api.offers_update(state.editingId, payload);
    } else {
      result = await window.api.offers_add(payload);
      offerId = result.id;
    }
    
    if (!result.ok) {
      alert(result.error || 'فشل حفظ العرض');
      return;
    }
    
    // Save product links for non-global offers
    if (offerId && !state.editingIsGlobal) {
      const products = state.offerProducts.map(item => ({
        product_id: item.product_id,
        operation_id: item.operation_id
      }));
      
      const linkResult = await window.api.offers_set_products(offerId, products);
      if (!linkResult.ok) {
        console.warn('Error saving product links:', linkResult.error);
      }
    }
    
    closeModal();
    await loadData();
  } catch (error) {
    console.error('Error saving offer:', error);
    alert('حدث خطأ في حفظ العرض');
  }
}

async function saveCoupon() {
  const codeEl = document.getElementById('c_code');
  const nameEl = document.getElementById('c_name');
  const modeEl = document.getElementById('c_mode');
  const valueEl = document.getElementById('c_value');
  const startEl = document.getElementById('c_start');
  const endEl = document.getElementById('c_end');
  const minEl = document.getElementById('c_min');
  const limitEl = document.getElementById('c_limit');
  const activeEl = document.getElementById('c_active');
  
  // Validation
  if (!codeEl?.value?.trim()) {
    alert('رمز الكوبون مطلوب');
    codeEl?.focus();
    return;
  }
  
  if (!valueEl?.value || Number(valueEl.value) <= 0) {
    alert('قيمة الكوبون مطلوبة ويجب أن تكون أكبر من صفر');
    valueEl?.focus();
    return;
  }
  
  const payload = {
    code: codeEl.value.trim(),
    name: nameEl?.value?.trim() || null,
    mode: modeEl?.value || 'percent',
    value: Number(valueEl?.value || 0),
    start_date: startEl?.value || null,
    end_date: endEl?.value || null,
    min_invoice_total: minEl?.value ? Number(minEl.value) : null,
    usage_limit: limitEl?.value ? Number(limitEl.value) : null,
    is_active: Number(activeEl?.value || 1)
  };
  
  try {
    let result;
    
    if (state.editingId) {
      result = await window.api.coupons_update(state.editingId, payload);
    } else {
      result = await window.api.coupons_add(payload);
    }
    
    if (!result.ok) {
      alert(result.error || 'فشل حفظ الكوبون');
      return;
    }
    
    closeModal();
    await loadData();
  } catch (error) {
    console.error('Error saving coupon:', error);
    alert('حدث خطأ في حفظ الكوبون');
  }
}

// Product Selection for Offers
// ============================

function renderSelectedProducts() {
  const container = document.getElementById('selectedItems');
  if (!container) return;
  
  if (!state.offerProducts.length) {
    container.innerHTML = '<div class="text-muted text-center">لم يتم إضافة أصناف بعد</div>';
    return;
  }
  
  container.innerHTML = state.offerProducts.map((product, index) => `
    <div class="selected-product" style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border);">
      <div>
        <strong>${product.product_name}</strong>
        ${product.operation_name ? `<span class="badge badge-secondary" style="margin-right: 0.5rem;">${product.operation_name}</span>` : ''}
      </div>
      <button type="button" class="btn btn-danger btn-sm" onclick="removeProduct(${index})">حذف</button>
    </div>
  `).join('');
}

window.removeProduct = function(index) {
  state.offerProducts.splice(index, 1);
  renderSelectedProducts();
};

async function initOfferForm() {
  const prodSearch = document.getElementById('prodSearch');
  const prodSuggest = document.getElementById('prodSuggest');
  const opBox = document.getElementById('opBox');
  const opSelect = document.getElementById('opSelect');
  const addBtn = document.getElementById('addProdToOffer');
  const categorySelect = document.getElementById('categorySelect');
  const addCategoryBtn = document.getElementById('addCategoryBtn');
  
  if (!prodSearch || !addBtn) return;
  
  let selectedProductId = null;
  let selectedProductName = '';
  let searchTimeout = null;
  
  // Load categories/types
  if (categorySelect && addCategoryBtn) {
    try {
      const result = await window.api.types_list_all();
      const categories = (result && result.ok) ? (result.items || []) : [];
      
      if (categories.length) {
        categorySelect.innerHTML = '<option value="">-- اختر نوعاً رئيسياً --</option>' + 
          categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
      }
    } catch (error) {
      console.warn('Error loading categories:', error);
    }
    
    // Add category button handler
    addCategoryBtn.addEventListener('click', async function() {
      const categoryId = categorySelect.value;
      
      if (!categoryId) {
        showToast('اختر نوعاً رئيسياً أولاً', { type: 'warning' });
        return;
      }
      
      const categoryName = categorySelect.selectedOptions[0]?.textContent || '';
      
      try {
        // Get all products for this category (category is stored as name, not ID)
        const result = await window.api.products_list({ category: categoryName, active: "1" });
        const products = (result && result.ok) ? (result.items || []) : [];
        
        if (!products.length) {
          showToast(`لا توجد أصناف نشطة في "${categoryName}"`, { 
            type: 'info',
            title: 'لا توجد أصناف' 
          });
          return;
        }
        
        let addedCount = 0;
        
        for (const product of products) {
          // Check if already added
          const exists = state.offerProducts.some(p => p.product_id === product.id);
          
          if (!exists) {
            state.offerProducts.push({
              product_id: product.id,
              product_name: product.name,
              operation_id: null,
              operation_name: ''
            });
            addedCount++;
          }
        }
        
        if (addedCount > 0) {
          renderSelectedProducts();
          showToast(`تمت إضافة ${addedCount} صنف من "${categoryName}"`, { 
            type: 'success',
            title: 'تمت الإضافة بنجاح',
            duration: 3000
          });
        } else {
          showToast('جميع الأصناف مضافة بالفعل', { 
            type: 'info',
            duration: 3000
          });
        }
        
        // Reset category selection
        categorySelect.value = '';
        
      } catch (error) {
        console.error('Error loading category products:', error);
        showToast('حدث خطأ في تحميل أصناف النوع', { type: 'error' });
      }
    });
  }
  
  // Product search functionality
  prodSearch.addEventListener('input', function() {
    const query = this.value.trim();
    
    clearTimeout(searchTimeout);
    
    if (!query) {
      prodSuggest.classList.add('hidden');
      return;
    }
    
    searchTimeout = setTimeout(async () => {
      try {
        let products = [];
        
        // Try barcode search first
        try {
          const barcodeResult = await window.api.products_get_by_barcode(query);
          if (barcodeResult && barcodeResult.ok && barcodeResult.item) {
            products = [barcodeResult.item];
          }
        } catch (e) {
          console.warn('Barcode search failed:', e);
        }
        
        // If no barcode match, try name search
        if (!products.length) {
          const searchResult = await window.api.products_list({ q: query });
          products = (searchResult && searchResult.ok) ? (searchResult.items || []) : [];
        }
        
        showProductSuggestions(products);
      } catch (error) {
        console.error('Product search error:', error);
        prodSuggest.classList.add('hidden');
      }
    }, 300);
  });
  
  function showProductSuggestions(products) {
    if (!products.length) {
      prodSuggest.classList.add('hidden');
      return;
    }
    
    prodSuggest.innerHTML = products.slice(0, 10).map(product => `
      <div class="suggestion-item" style="padding: 0.5rem; cursor: pointer; border-bottom: 1px solid var(--border);" 
           onclick="selectProduct(${product.id}, '${(product.name || '').replace(/'/g, '\\\'')}')"
           onmouseover="this.style.backgroundColor='var(--bg)'" 
           onmouseout="this.style.backgroundColor='transparent'">
        <strong>${product.name || ''}</strong>
        ${product.barcode ? `<br><small class="text-muted">${product.barcode}</small>` : ''}
      </div>
    `).join('');
    
    prodSuggest.classList.remove('hidden');
  }
  
  window.selectProduct = async function(productId, productName) {
    selectedProductId = productId;
    selectedProductName = productName;
    prodSearch.value = productName;
    prodSuggest.classList.add('hidden');
    
    // Load operations for this product
    try {
      const result = await window.api.prod_ops_list(productId);
      const operations = (result && result.ok) ? (result.items || []) : [];
      
      if (operations.length) {
        opSelect.innerHTML = operations.map(op => 
          `<option value="${op.operation_id || op.id}">${op.name}</option>`
        ).join('');
        opBox.style.display = 'block';
      } else {
        opSelect.innerHTML = '';
        opBox.style.display = 'none';
      }
    } catch (error) {
      console.warn('Error loading operations:', error);
      opSelect.innerHTML = '';
      opBox.style.display = 'none';
    }
  };
  
  addBtn.addEventListener('click', function() {
    if (!selectedProductId) {
      alert('اختر الصنف من قائمة البحث');
      return;
    }
    
    let operationId = null;
    let operationName = '';
    
    if (opBox.style.display !== 'none' && opSelect.value) {
      operationId = Number(opSelect.value);
      operationName = opSelect.selectedOptions[0]?.textContent || '';
    }
    
    // Check if already added
    const exists = state.offerProducts.some(p => 
      p.product_id === selectedProductId && p.operation_id === operationId
    );
    
    if (exists) {
      alert('هذا الصنف مضاف بالفعل');
      return;
    }
    
    state.offerProducts.push({
      product_id: selectedProductId,
      product_name: selectedProductName,
      operation_id: operationId,
      operation_name: operationName
    });
    
    // Reset form
    prodSearch.value = '';
    prodSuggest.classList.add('hidden');
    opBox.style.display = 'none';
    opSelect.innerHTML = '';
    selectedProductId = null;
    selectedProductName = '';
    
    renderSelectedProducts();
  });
  
  // Load excluded categories for global offers
  const excludedCategoriesItems = document.getElementById('excludedCategoriesItems');
  if (excludedCategoriesItems) {
    try {
      const result = await window.api.types_list_all();
      const categories = (result && result.ok) ? (result.items || []) : [];
      
      let excludedList = [];
      if (state.editingId && state.editingIsGlobal && state.currentOffer) {
        if (state.currentOffer.excluded_categories) {
          try {
            excludedList = JSON.parse(state.currentOffer.excluded_categories);
            if (!Array.isArray(excludedList)) excludedList = [];
          } catch (e) {
            console.warn('Failed to parse excluded_categories:', e);
          }
        }
      }
      
      if (categories.length) {
        excludedCategoriesItems.innerHTML = categories.map(cat => {
          const isChecked = excludedList.includes(cat.name);
          return `
            <div class="dropdown-item">
              <input type="checkbox" id="exc_${cat.name}" value="${cat.name}" ${isChecked ? 'checked' : ''} />
              <label for="exc_${cat.name}">${cat.name}</label>
            </div>
          `;
        }).join('');
        
        updateDropdownLabel();
      }
    } catch (error) {
      console.warn('Error loading categories for exclusion:', error);
    }
  }
  
  renderSelectedProducts();
}

// Update dropdown label based on selections
function updateDropdownLabel() {
  const label = document.querySelector('#excludedCategoriesToggle .dropdown-label');
  const checkboxes = document.querySelectorAll('#excludedCategoriesItems input[type="checkbox"]:checked');
  
  if (!label) return;
  
  const count = checkboxes.length;
  if (count === 0) {
    label.textContent = 'اختر الأنواع المستثناة';
  } else if (count === 1) {
    label.textContent = checkboxes[0].nextElementSibling.textContent;
  } else {
    label.textContent = `${count} أنواع محددة`;
  }
}

// Event Handlers Setup
// ===================

function setupEventHandlers() {
  // Navigation
  elements.backBtn?.addEventListener('click', () => {
    window.location.href = '../main/index.html';
  });
  
  // Modal
  elements.cancelModal?.addEventListener('click', closeModal);
  elements.saveModal?.addEventListener('click', saveForm);
  
  // Click outside modal to close
  elements.modalBackdrop?.addEventListener('click', (e) => {
    if (e.target === elements.modalBackdrop) {
      closeModal();
    }
  });
  
  // Search
  elements.searchBtn?.addEventListener('click', loadData);
  elements.refreshBtn?.addEventListener('click', () => {
    elements.searchBox.value = '';
    loadData();
  });
  
  elements.searchBox?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      loadData();
    }
  });
  
  // Add buttons
  elements.addOfferBtn?.addEventListener('click', async () => {
    if (!hasPermission('offers.add')) return;
    
    state.editingType = 'offer';
    state.editingId = null;
    state.editingIsGlobal = 0;
    state.currentOffer = null;
    state.offerProducts = [];
    
    openModal('إضافة عرض جديد', generateOfferForm({ mode: 'percent', is_active: 1 }));
    await initOfferForm();
  });
  
  elements.addGlobalOfferBtn?.addEventListener('click', async () => {
    if (!hasPermission('offers.add_global')) return;
    
    // Check if global offer already exists
    try {
      const result = await window.api.offers_list({});
      const hasGlobal = (result.items || []).some(offer => Number(offer.is_global || 0) === 1);
      
      if (hasGlobal) {
        alert('يوجد عرض عام بالفعل. احذف العرض الحالي قبل إضافة عرض عام جديد.');
        return;
      }
    } catch (error) {
      console.warn('Error checking global offers:', error);
    }
    
    state.editingType = 'offer';
    state.editingId = null;
    state.editingIsGlobal = 1;
    state.currentOffer = null;
    state.offerProducts = [];
    
    openModal('إضافة عرض عام', generateOfferForm({ mode: 'percent', is_active: 1 }));
    await initOfferForm();
  });
  
  elements.addCouponBtn?.addEventListener('click', () => {
    if (!hasPermission('coupons.add')) return;
    
    state.editingType = 'coupon';
    state.editingId = null;
    
    openModal('إضافة كوبون جديد', generateCouponForm({ mode: 'percent', is_active: 1 }));
  });
  
  // Excluded Categories Dropdown
  document.addEventListener('click', (e) => {
    const toggle = document.getElementById('excludedCategoriesToggle');
    const menu = document.getElementById('excludedCategoriesMenu');
    const dropdown = document.getElementById('excludedCategoriesDropdown');
    
    if (!toggle || !menu || !dropdown) return;
    
    // Toggle dropdown
    if (toggle.contains(e.target)) {
      const isOpen = menu.classList.contains('show');
      menu.classList.toggle('show', !isOpen);
      toggle.classList.toggle('active', !isOpen);
    } 
    // Close if clicked outside
    else if (!dropdown.contains(e.target)) {
      menu.classList.remove('show');
      toggle.classList.remove('active');
    }
  });
  
  // Update label when checkboxes change
  document.addEventListener('change', (e) => {
    if (e.target.matches('#excludedCategoriesItems input[type="checkbox"]')) {
      updateDropdownLabel();
    }
  });
}

// Initialize permissions-based UI
async function initializePermissions() {
  await loadPermissions();
  
  // Hide buttons based on permissions
  if (!hasPermission('offers.add') && elements.addOfferBtn) {
    elements.addOfferBtn.style.display = 'none';
  }
  
  if (!hasPermission('offers.add_global') && elements.addGlobalOfferBtn) {
    elements.addGlobalOfferBtn.style.display = 'none';
  }
  
  if (!hasPermission('coupons.add') && elements.addCouponBtn) {
    elements.addCouponBtn.style.display = 'none';
  }
}

// Application Initialization
// =========================

async function initialize() {
  try {
    await initializePermissions();
    setupEventHandlers();
    await loadData();
  } catch (error) {
    console.error('Initialization error:', error);
    showEmpty(elements.offersTbody, 'حدث خطأ في تحميل التطبيق');
    showEmpty(elements.couponsTbody, 'حدث خطأ في تحميل التطبيق');
  }
}

// Start the application
initialize();