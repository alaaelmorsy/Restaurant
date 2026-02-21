// Products screen: modal add + list/edit/delete/toggle

// Language system
const __langKey = 'app_lang';
let __currentLang = {};
function __applyLang(lang){
  const base = (typeof lang==='string' ? lang.split('-')[0].toLowerCase() : 'ar');
  const isAr = (base==='ar');
  const t = {
    // Page title and header
    productsManagement: isAr ? 'إدارة المنتجات' : 'Products Management',
    pageTitle: isAr ? 'المنتجات - POS SA' : 'Products - POS SA',
    // Action buttons
    addProduct: isAr ? 'إضافة منتج' : 'Add Product',
    exportPDF: isAr ? 'تصدير PDF' : 'Export PDF',
    exportCSV: isAr ? 'تصدير CSV' : 'Export CSV',
    pdfShort: isAr ? 'PDF' : 'PDF',
    csvShort: isAr ? 'CSV' : 'CSV',
    // Filters and search
    searchPlaceholder: isAr ? '🔍 بحث بالاسم...' : '🔍 Search by name...',
    allStatuses: isAr ? 'كل الحالات' : 'All Statuses',
    active: isAr ? '✅ نشط' : '✅ Active',
    inactive: isAr ? '❌ موقوف' : '❌ Inactive',
    allCategories: isAr ? 'كل الأنواع' : 'All Categories',
    // Sorting options
    newest: isAr ? '🆕 الأحدث' : '🆕 Newest',
    customOrder: isAr ? '📌 ترتيبي المخصص' : '📌 Custom Order',
    nameAsc: isAr ? '🔤 الاسم (أ-ي)' : '🔤 Name (A-Z)',
    priceAsc: isAr ? '💲 السعر (تصاعدي)' : '💲 Price (Low to High)',
    priceDesc: isAr ? '💲 السعر (تنازلي)' : '💲 Price (High to Low)',
    stockDesc: isAr ? '📊 المخزون (أعلى)' : '📊 Stock (Highest)',
    // Pagination
    rowsLabel: isAr ? '📋 عدد الصفوف:' : '📋 Rows per page:',
    rows20: isAr ? '20 صف' : '20 rows',
    rows50: isAr ? '50 صف' : '50 rows',
    rows100: isAr ? '100 صف' : '100 rows',
    showAll: isAr ? 'عرض الكل' : 'Show All',
    firstPage: isAr ? '⏮️ الأولى' : '⏮️ First',
    prevPage: isAr ? '◀️ السابقة' : '◀️ Previous',
    nextPage: isAr ? 'التالية ▶️' : 'Next ▶️',
    lastPage: isAr ? 'الأخيرة ⏭️' : 'Last ⏭️',
    pageOf: isAr ? 'صفحة' : 'Page',
    of: isAr ? 'من' : 'of',
    product: isAr ? 'منتج' : 'product',
    products: isAr ? 'منتج' : 'products',
    // Table headers
    image: isAr ? '🖼️ الصورة' : '🖼️ Image',
    name: isAr ? '📦 الاسم' : '📦 Name',
    price: isAr ? '💰 السعر' : '💰 Price',
    operationsAndPrices: isAr ? '⚙️ العمليات وأسعارها' : '⚙️ Operations & Prices',
    stock: isAr ? '📊 المخزون' : '📊 Stock',
    category: isAr ? '📂 الفئة' : '📂 Category',
    status: isAr ? '🏷️ الحالة' : '🏷️ Status',
    actions: isAr ? '🔧 عمليات' : '🔧 Actions',
    // Row actions
    edit: isAr ? '✏️ تعديل' : '✏️ Edit',
    activate: isAr ? '✅ تفعيل' : '✅ Activate',
    deactivate: isAr ? '❌ إيقاف' : '❌ Deactivate',
    delete: isAr ? '🗑️ حذف' : '🗑️ Delete',
    stopped: isAr ? 'موقوف' : 'Stopped',
    noOperations: isAr ? 'لا توجد' : 'None',
    // Save order
    saveOrder: isAr ? 'حفظ ترتيب السطور' : 'Save Row Order',
    saveOrderHint: isAr ? 'حرّك السطور بالأسهم ↑↓ ثم اضغط حفظ' : 'Move rows with ↑↓ arrows then save',
    // Modal
    addProductTitle: isAr ? 'إضافة منتج' : 'Add Product',
    editProductTitle: isAr ? 'تعديل منتج' : 'Edit Product',
    productNameAr: isAr ? 'اسم المنتج (عربي)' : 'Product Name (Arabic)',
    productNameEn: isAr ? 'اسم المنتج (إنجليزي) - اختياري' : 'Product Name (English) - Optional',
    productNameEnCsv: isAr ? 'الاسم الإنجليزي' : 'English Name',
    barcode: isAr ? 'الباركود' : 'Barcode',
    priceLabel: isAr ? '💰 السعر' : '💰 Price',
    operationsLabel: isAr ? '⚙️ عمليات المنتج وأسعارها' : '⚙️ Product Operations & Prices',
    selectOperation: isAr ? 'اختر عملية' : 'Select Operation',
    priceInputPlaceholder: isAr ? 'السعر' : 'Price',
    add: isAr ? 'إضافة' : 'Add',
    stockLabel: isAr ? '📊 المخزون' : '📊 Stock',
    categoryLabel: isAr ? '📂 الفئة' : '📂 Category',
    selectCategory: isAr ? 'اختر النوع الرئيسي' : 'Select Main Type',
    newCategory: isAr ? '➕ جديد' : '➕ New',
    description: isAr ? '📝 الوصف' : '📝 Description',
    productImage: isAr ? '🖼️ صورة المنتج' : '🖼️ Product Image',
    chooseImage: isAr ? 'اختيار صورة' : 'Choose Image',
    removeImage: isAr ? 'إزالة الصورة' : 'Remove Image',
    tobaccoFee: isAr ? '🚬 تطبيق رسوم التبغ؟' : '🚬 Apply Tobacco Fee?',
    yes: isAr ? 'نعم' : 'Yes',
    no: isAr ? 'لا' : 'No',
    cancel: isAr ? '❌ إلغاء' : '❌ Cancel',
    save: isAr ? '💾 حفظ' : '💾 Save',
    // Mini prompt
    categoryPrompt: isAr ? 'اسم النوع الرئيسي الجديد:' : 'New Main Type Name:',
    operationPrompt: isAr ? 'اسم العملية الجديدة:' : 'New Operation Name:',
    ok: isAr ? 'موافق' : 'OK',
    // Error messages
    categoryAddFailed: isAr ? 'فشل إضافة النوع الرئيسي' : 'Failed to add main type',
    operationAddFailed: isAr ? 'فشل إضافة العملية' : 'Failed to add operation',
    nameRequired: isAr ? 'يرجى إدخال اسم المنتج' : 'Please enter product name',
    validPriceRequired: isAr ? 'يرجى إدخال سعر صحيح' : 'Please enter valid price',
    validStockRequired: isAr ? 'يرجى إدخال مخزون صحيح' : 'Please enter valid stock',
    saveFailed: isAr ? 'فشل الحفظ' : 'Save failed',
    fetchFailed: isAr ? 'تعذر جلب المنتج' : 'Failed to fetch product',
    updateFailed: isAr ? 'فشل تحديث الحالة' : 'Failed to update status',
    deleteFailed: isAr ? 'فشل الحذف' : 'Delete failed',
    deleteConfirm: isAr ? 'تأكيد حذف المنتج؟' : 'Confirm delete product?',
    pdfExportFailed: isAr ? 'تعذر إنشاء PDF' : 'Failed to create PDF',
    csvExportFailed: isAr ? 'تعذر إنشاء CSV' : 'Failed to create CSV',
    productPdfFailed: isAr ? 'تعذر إنشاء PDF للمنتج' : 'Failed to create product PDF',
    imageTooBig: isAr ? 'حجم الصورة أكبر من 1 ميجابايت. يرجى اختيار صورة أصغر.' : 'Image size exceeds 1MB. Please choose a smaller image.',
    fileReadFailed: isAr ? 'فشل قراءة الملف' : 'Failed to read file',
    loadProductsFailed: isAr ? 'تعذر تحميل المنتجات' : 'Failed to load products',
    saveOrderFailed: isAr ? 'فشل حفظ ترتيب المنتجات' : 'Failed to save product order',
    saveOrderError: isAr ? 'تعذر حفظ الترتيب' : 'Failed to save order',
    orderSaved: isAr ? 'تم حفظ الترتيب بنجاح' : 'Order saved successfully',
    // PDF export
    productsReport: isAr ? 'تقرير المنتجات' : 'Products Report',
    productDetails: isAr ? 'تفاصيل المنتج' : 'Product Details',
    nameLabel: isAr ? 'الاسم:' : 'Name:',
    nameEnLabel: isAr ? 'الاسم بالإنجليزي:' : 'English Name:',
    barcodeLabel: isAr ? 'الباركود:' : 'Barcode:',
    categoryLabelColon: isAr ? 'الفئة:' : 'Category:',
    statusLabel: isAr ? 'الحالة:' : 'Status:',
    priceColon: isAr ? 'السعر:' : 'Price:',
    stockColon: isAr ? 'المخزون:' : 'Stock:',
    operationsAndPricesColon: isAr ? 'العمليات وأسعارها' : 'Operations & Prices',
    operation: isAr ? 'العملية' : 'Operation',
    noOperationsForProduct: isAr ? 'لا توجد عمليات لهذا المنتج' : 'No operations for this product',
    activeStatus: isAr ? 'نشط ✅' : 'Active ✅',
    inactiveStatus: isAr ? 'موقوف ❌' : 'Inactive ❌',
    // Category filter (not in main type)
    notInTypes: isAr ? '(غير موجود في الأنواع)' : '(not in types)',
  };
  
  __currentLang = t;
  
  document.documentElement.lang = isAr ? 'ar' : 'en';
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  
  document.title = t.pageTitle;
  
  const headerTitle = document.querySelector('header span.text-xl');
  if(headerTitle) headerTitle.textContent = t.productsManagement;
  
  const addBtn = document.getElementById('addBtn');
  if(addBtn){
    const span = addBtn.querySelector('span:last-child');
    if(span) span.textContent = t.addProduct;
  }
  
  const exportPdfBtn = document.getElementById('btnExportProductsPdf');
  if(exportPdfBtn){
    const longSpan = exportPdfBtn.querySelector('.hidden.sm\\:inline');
    const shortSpan = exportPdfBtn.querySelector('.sm\\:hidden');
    if(longSpan) longSpan.textContent = t.exportPDF;
    if(shortSpan) shortSpan.textContent = t.pdfShort;
  }
  
  const exportCsvBtn = document.getElementById('btnExportProductsCsv');
  if(exportCsvBtn){
    const longSpan = exportCsvBtn.querySelector('.hidden.sm\\:inline');
    const shortSpan = exportCsvBtn.querySelector('.sm\\:hidden');
    if(longSpan) longSpan.textContent = t.exportCSV;
    if(shortSpan) shortSpan.textContent = t.csvShort;
  }
  
  const searchInput = document.getElementById('q');
  if(searchInput) searchInput.placeholder = t.searchPlaceholder;
  
  const activeFilter = document.getElementById('f_active');
  if(activeFilter && activeFilter.options.length >= 3){
    activeFilter.options[0].text = t.allStatuses;
    activeFilter.options[1].text = t.active;
    activeFilter.options[2].text = t.inactive;
  }
  
  const sortSelect = document.getElementById('sort');
  if(sortSelect && sortSelect.options.length >= 6){
    sortSelect.options[0].text = t.newest;
    sortSelect.options[1].text = t.customOrder;
    sortSelect.options[2].text = t.nameAsc;
    sortSelect.options[3].text = t.priceAsc;
    sortSelect.options[4].text = t.priceDesc;
    sortSelect.options[5].text = t.stockDesc;
  }
  
  const rowsLabel = document.querySelector('.flex.items-center.gap-3 span');
  if(rowsLabel && rowsLabel.textContent.includes('عدد الصفوف')) rowsLabel.textContent = t.rowsLabel;
  
  const pageSizeSelect = document.getElementById('pageSize');
  if(pageSizeSelect && pageSizeSelect.options.length >= 4){
    pageSizeSelect.options[0].text = t.rows20;
    pageSizeSelect.options[1].text = t.rows50;
    pageSizeSelect.options[2].text = t.rows100;
    pageSizeSelect.options[3].text = t.showAll;
  }
  
  const tableHeaders = document.querySelectorAll('thead th');
  if(tableHeaders.length >= 9){
    tableHeaders[1].textContent = t.image;
    tableHeaders[2].textContent = t.name;
    tableHeaders[3].textContent = t.price;
    tableHeaders[4].textContent = t.operationsAndPrices;
    tableHeaders[5].textContent = t.stock;
    tableHeaders[6].textContent = t.category;
    tableHeaders[7].textContent = t.status;
    tableHeaders[8].textContent = t.actions;
  }
  
  const saveOrderBtn = document.getElementById('saveOrderBtn');
  if(saveOrderBtn){
    const span = saveOrderBtn.querySelector('span:last-child');
    if(span) span.textContent = t.saveOrder;
  }
  
  const saveOrderHint = document.querySelector('.text-slate-500.font-semibold.text-sm');
  if(saveOrderHint && saveOrderHint.textContent.includes('حرّك')) saveOrderHint.textContent = t.saveOrderHint;
  
  const modalLabels = document.querySelectorAll('#dlg label');
  modalLabels.forEach(label => {
    const text = label.textContent.trim();
    if(text.includes('اسم المنتج (عربي)')) label.textContent = t.productNameAr;
    else if(text.includes('اسم المنتج (إنجليزي)')) label.textContent = t.productNameEn;
    else if(text === 'الباركود') label.textContent = t.barcode;
    else if(text.includes('💰 السعر')) label.textContent = t.priceLabel;
    else if(text.includes('⚙️ عمليات المنتج')) label.textContent = t.operationsLabel;
    else if(text.includes('📊 المخزون')) label.textContent = t.stockLabel;
    else if(text.includes('📂 الفئة')) label.textContent = t.categoryLabel;
    else if(text.includes('📝 الوصف')) label.textContent = t.description;
    else if(text.includes('🖼️ صورة المنتج')) label.textContent = t.productImage;
    else if(text.includes('🚬 تطبيق رسوم التبغ')) label.textContent = t.tobaccoFee;
  });
  
  const opPriceInput = document.getElementById('opPrice');
  if(opPriceInput) opPriceInput.placeholder = t.priceInputPlaceholder;
  
  const opAddBtn = document.getElementById('opAdd');
  if(opAddBtn) opAddBtn.textContent = t.add;
  
  const catQuickAddBtn = document.getElementById('catQuickAdd');
  if(catQuickAddBtn) catQuickAddBtn.textContent = t.newCategory;
  
  const pickImageBtn = document.getElementById('pickImage');
  if(pickImageBtn) pickImageBtn.textContent = t.chooseImage;
  
  const removeImageBtn = document.getElementById('removeImage');
  if(removeImageBtn) removeImageBtn.textContent = t.removeImage;
  
  const tobaccoSelect = document.getElementById('f_is_tobacco');
  if(tobaccoSelect && tobaccoSelect.options.length >= 2){
    tobaccoSelect.options[0].text = t.no;
    tobaccoSelect.options[1].text = t.yes;
  }
  
  const dlgCancelBtn = document.getElementById('dlgCancel');
  if(dlgCancelBtn) dlgCancelBtn.textContent = t.cancel;
  
  const dlgSaveBtn = document.getElementById('dlgSave');
  if(dlgSaveBtn) dlgSaveBtn.textContent = t.save;
  
  const miniPromptOk = document.getElementById('miniPromptOk');
  if(miniPromptOk) miniPromptOk.textContent = t.ok;
  
  const miniPromptCancel = document.getElementById('miniPromptCancel');
  if(miniPromptCancel) miniPromptCancel.textContent = t.cancel;
  
  try{ localStorage.setItem(__langKey, base); }catch(_){ }
}

(function initLang(){
  (async ()=>{
    try{
      const r = await window.api.app_get_locale();
      const L = (r && r.lang) || 'ar';
      __applyLang(L);
    }catch(_){
      __applyLang('ar');
    }
  })();
  try{
    window.api.app_on_locale_changed((L)=>{
      __applyLang(L);
    });
  }catch(_){ }
})();

const tbody = document.getElementById('tbody');
const errorDiv = document.getElementById('error');
const addBtn = document.getElementById('addBtn');
const saveOrderBtn = document.getElementById('saveOrderBtn');
let activeTypes = new Set(); // الأنواع الرئيسية النشطة فقط
const btnExportProductsPdf = document.getElementById('btnExportProductsPdf');
const btnExportProductsCsv = document.getElementById('btnExportProductsCsv');

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
function hasProd(k){ return __perms.has('products') && __perms.has(k); }
function applyTopPermissions(){
  if(addBtn && !hasProd('products.add')) addBtn.style.display='none';
  if(btnExportProductsPdf && !hasProd('products.export_pdf')) btnExportProductsPdf.style.display='none';
  if(btnExportProductsCsv && !hasProd('products.export_csv')) btnExportProductsCsv.style.display='none';
  if(saveOrderBtn && !hasProd('products.reorder')) saveOrderBtn.style.display='none';
}
// initial load perms and apply
(async ()=>{ await loadPerms(); applyTopPermissions(); })();

// dialog fields
const dlg = document.getElementById('dlg');
const dlgTitle = document.getElementById('dlgTitle');
const f_name = document.getElementById('f_name');
const f_barcode = document.getElementById('f_barcode');
const f_name_en = document.getElementById('f_name_en');
const f_price = document.getElementById('f_price');
const f_stock = document.getElementById('f_stock');
const f_category = document.getElementById('f_category');
const catQuickAdd = document.getElementById('catQuickAdd');
const f_is_tobacco = document.getElementById('f_is_tobacco');

// Toggle barcode field visibility (hide in Add, show in Edit)
const barcodeWrap = f_barcode ? f_barcode.closest('div') : null;
function setBarcodeVisible(show){ if(barcodeWrap) barcodeWrap.style.display = show ? '' : 'none'; }

async function populateCategories(){
  try{
    const res = await window.api.types_list();
    f_category.innerHTML = '';
    const def = document.createElement('option');
    def.value = '';
    def.textContent = __currentLang.selectCategory || 'اختر النوع الرئيسي';
    f_category.appendChild(def);
    if(res && res.ok){
      (res.items||[]).forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.name; // نخزن الاسم كقيمة الفئة
        opt.textContent = t.name;
        f_category.appendChild(opt);
      });
    }
  }catch(e){ /* ignore */ }
}

// Mini prompt helper using <dialog id="miniPrompt">
async function miniPrompt(message, { defaultValue = '' } = {}){
  return new Promise((resolve) => {
    try{
      const dlg = document.getElementById('miniPrompt');
      const title = document.getElementById('miniPromptTitle');
      const input = document.getElementById('miniPromptInput');
      const ok = document.getElementById('miniPromptOk');
      const cancel = document.getElementById('miniPromptCancel');
      if(!dlg || !title || !input || !ok || !cancel){ return resolve(null); }
      title.textContent = message || '';
      input.value = defaultValue || '';
      const cleanup = () => {
        ok.onclick = null; cancel.onclick = null;
        dlg.removeEventListener('close', onClose);
        input.style.display = '';
      };
      const onClose = () => { cleanup(); };
      dlg.addEventListener('close', onClose);
      ok.onclick = () => { const v = input.value.trim(); dlg.close(); resolve(v || null); };
      cancel.onclick = () => { dlg.close(); resolve(null); };
      dlg.showModal();
      input.focus();
    }catch(_){ resolve(null); }
  });
}

// Mini confirm using the same dialog (hides input)
async function miniConfirm(message){
  return new Promise((resolve) => {
    try{
      const dlg = document.getElementById('miniPrompt');
      const title = document.getElementById('miniPromptTitle');
      const input = document.getElementById('miniPromptInput');
      const ok = document.getElementById('miniPromptOk');
      const cancel = document.getElementById('miniPromptCancel');
      if(!dlg || !title || !ok || !cancel){ return resolve(false); }
      title.textContent = message || '';
      input.style.display = 'none';
      const cleanup = () => {
        ok.onclick = null; cancel.onclick = null;
        dlg.removeEventListener('close', onClose);
        input.style.display = '';
      };
      const onClose = () => { cleanup(); };
      dlg.addEventListener('close', onClose);
      ok.onclick = () => { dlg.close(); resolve(true); };
      cancel.onclick = () => { dlg.close(); resolve(false); };
      dlg.showModal();
      ok.focus();
    }catch(_){ resolve(false); }
  });
}

// Quick add main type
const catAddDlg = document.getElementById('catAddDlg');
const catAddName = document.getElementById('catAddName');
const catAddNameEn = document.getElementById('catAddNameEn');
const catAddSave = document.getElementById('catAddSave');
const catAddCancel = document.getElementById('catAddCancel');
const catAddError = document.getElementById('catAddError');
const btnTranslateCatAdd = document.getElementById('btnTranslateCatAdd');

function showCatAddError(msg){ if(catAddError){ catAddError.textContent = msg; catAddError.classList.remove('hidden'); } }
function hideCatAddError(){ if(catAddError){ catAddError.textContent=''; catAddError.classList.add('hidden'); } }

if(btnTranslateCatAdd){
  btnTranslateCatAdd.addEventListener('click', async () => {
    const arName = (catAddName.value || '').trim();
    if(!arName) return;
    const orig = btnTranslateCatAdd.innerHTML;
    btnTranslateCatAdd.disabled = true;
    btnTranslateCatAdd.innerHTML = '⏳';
    try{
      const res = await window.api.products_translate(arName);
      if(res && res.ok && res.text) catAddNameEn.value = res.text;
    }catch(_){ }
    finally{
      btnTranslateCatAdd.disabled = false;
      btnTranslateCatAdd.innerHTML = orig;
    }
  });
}

if(catAddCancel) catAddCancel.addEventListener('click', () => { catAddDlg.close(); });
if(catAddName){
  catAddName.addEventListener('keydown', (e) => {
    if(e.key === 'Enter'){ e.preventDefault(); catAddSave && catAddSave.click(); }
  });
}
if(catAddNameEn){
  catAddNameEn.addEventListener('keydown', (e) => {
    if(e.key === 'Enter'){ e.preventDefault(); catAddSave && catAddSave.click(); }
  });
}

if(catAddSave){
  catAddSave.addEventListener('click', async () => {
    const name = (catAddName.value || '').trim();
    if(!name){ showCatAddError('يرجى إدخال اسم النوع'); catAddName.focus(); return; }
    hideCatAddError();
    const name_en = (catAddNameEn.value || '').trim() || null;
    const origText = catAddSave.textContent;
    catAddSave.disabled = true;
    catAddSave.textContent = '⏳ جاري الحفظ...';
    try{
      const res = await window.api.types_add({ name, name_en });
      if(!res || !res.ok){ showCatAddError(res && res.error ? res.error : (__currentLang.categoryAddFailed || 'فشل إضافة النوع الرئيسي')); return; }
      catAddDlg.close();
      await populateCategories();
      await populateCategoryFilter();
      try{
        const opts = Array.from(f_category.options);
        const found = opts.find(o => o.value === name);
        if(found){ f_category.value = name; }
      }catch(_){ }
    }catch(_){ showCatAddError(__currentLang.categoryAddFailed || 'فشل إضافة النوع الرئيسي'); }
    finally{ catAddSave.disabled = false; catAddSave.textContent = origText; }
  });
}

if(catQuickAdd){
  catQuickAdd.addEventListener('click', () => {
    catAddName.value = '';
    catAddNameEn.value = '';
    hideCatAddError();
    catAddDlg.showModal();
    setTimeout(() => catAddName.focus(), 50);
  });
}

// عند فتح نموذج الإضافة نُحدّث القائمة
function openAddDialog(){ editId=null; dlgTitle.textContent=__currentLang.addProductTitle || 'إضافة منتج'; clearDialog(); populateCategories(); loadAllOps(); dlg.showModal(); }
const f_description = document.getElementById('f_description');
const dlgSave = document.getElementById('dlgSave');
const dlgCancel = document.getElementById('dlgCancel');

let editId = null; // track edit product id

function setError(msg){ 
  errorDiv.textContent = msg || ''; 
  if(msg) errorDiv.classList.remove('hidden');
  else errorDiv.classList.add('hidden');
}
const f_thumb = document.getElementById('f_thumb');
const pickImageBtn = document.getElementById('pickImage');
const removeImageBtn = document.getElementById('removeImage');
let pickedImagePath = null;

const opSelect = document.getElementById('opSelect');
const opPrice = document.getElementById('opPrice');
const opAdd = document.getElementById('opAdd');
const opQuickAdd = document.getElementById('opQuickAdd');
const opList = document.getElementById('opList');
let allOps = [];
let prodOps = []; // [{operation_id, name, price}]

async function loadAllOps(){
  try{
    const r = await window.api.ops_list();
    allOps = r.ok ? (r.items||[]).filter(o=>o.is_active) : [];
    opSelect.innerHTML='';
    const d = document.createElement('option'); d.value=''; d.textContent=__currentLang.selectOperation || 'اختر عملية'; opSelect.appendChild(d);
    allOps.forEach(o=>{ const opt=document.createElement('option'); opt.value=String(o.id); opt.textContent=o.name; opSelect.appendChild(opt); });
  }catch(_){ allOps=[]; }
}

function renderProdOps(){
  opList.innerHTML='';
  prodOps.forEach((it, idx) => {
    const row = document.createElement('div');
    row.className = 'flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200';
    row.innerHTML = `<div class="flex-1 font-semibold text-slate-700 text-sm">${it.name}</div>
      <div class="w-24 text-left font-bold text-slate-800 text-sm">${Number(it.price).toFixed(2)}</div>
      <button class="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-bold text-xs shadow-sm border border-orange-400" data-act="edit" data-idx="${idx}">${__currentLang.edit || '✏️ تعديل'}</button>
      <button class="px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-bold text-xs shadow-sm border border-red-400" data-act="remove" data-idx="${idx}">${__currentLang.delete || '❌ حذف'}</button>`;
    opList.appendChild(row);
  });

}

function clearDialog(){ f_name.value=''; f_name_en.value=''; if(f_barcode) f_barcode.value=''; f_price.value=''; f_stock.value=''; f_category.value=''; f_description.value=''; pickedImagePath=null; f_thumb.src=''; prodOps=[]; renderProdOps(); if(typeof f_is_tobacco!== 'undefined' && f_is_tobacco) f_is_tobacco.value='0'; try{ delete window.__pickedImageBase64; delete window.__pickedImageMime; delete window.__removeImage; }catch(_){ } }

function openAddDialog(){ editId=null; dlgTitle.textContent=__currentLang.addProductTitle || 'إضافة منتج'; clearDialog(); setBarcodeVisible(false); populateCategories(); loadAllOps(); dlg.showModal(); }
async function openEditDialog(item){
  editId=item.id; dlgTitle.textContent=__currentLang.editProductTitle || 'تعديل منتج';
  setBarcodeVisible(false);
  try{ delete window.__pickedImageBase64; delete window.__pickedImageMime; }catch(_){ }
  window.__removeImage = false;
  f_name.value=item.name||''; f_name_en.value=item.name_en||''; if(f_barcode) f_barcode.value=item.barcode||''; f_price.value=item.price; f_stock.value=item.stock; f_description.value=item.description||''; if(typeof f_is_tobacco!== 'undefined' && f_is_tobacco) f_is_tobacco.value = (item.is_tobacco ? '1' : '0');
  await populateCategories();
  const currentCat = item.category || '';
  if(currentCat){
    // إذا لم تكن الفئة الحالية ضمن الخيارات (ربما تم حذف/إيقاف النوع)، أضفها مؤقتًا حتى لا تضيع القيمة
    const exists = Array.from(f_category.options).some(o => o.value === currentCat);
    if(!exists){
      const opt = document.createElement('option');
      opt.value = currentCat;
      opt.textContent = currentCat + ' ' + (__currentLang.notInTypes || '(غير موجود في الأنواع)');
      f_category.appendChild(opt);
    }
  }
  f_category.value=currentCat;

  // load product operations
  try{
    await loadAllOps();
    const rpo = await window.api.prod_ops_list(item.id);
    prodOps = (rpo && rpo.ok) ? (rpo.items||[]).map(x=>({ operation_id:x.operation_id, name:x.name, price:Number(x.price||0) })) : [];
    renderProdOps();
  }catch(_){ prodOps=[]; renderProdOps(); }

  pickedImagePath = item.image_path || null;
  // Prefer BLOB on-demand fetch for preview
  try{
    const ir = await window.api.products_image_get(item.id);
    if(ir && ir.ok && ir.base64){
      f_thumb.src = `data:${ir.mime||'image/png'};base64,${ir.base64}`;
    } else if(pickedImagePath){
      if(pickedImagePath.startsWith('assets/')){
        const relToAbs = '../../../' + pickedImagePath;
        f_thumb.src = relToAbs;
      } else {
        f_thumb.src = 'file:///' + pickedImagePath.replace(/\\/g, '/');
      }
    } else {
      f_thumb.src = '';
    }
  }catch(_){
    // fallback to legacy path if available
    if(pickedImagePath){
      if(pickedImagePath.startsWith('assets/')){
        const relToAbs = '../../../' + pickedImagePath;
        f_thumb.src = relToAbs;
      } else {
        f_thumb.src = 'file:///' + pickedImagePath.replace(/\\/g, '/');
      }
    } else {
      f_thumb.src = '';
    }
  }
  dlg.showModal();
}
function closeDialog(){ dlg.close(); }

function imgSrcForList(image_path){
  if(!image_path) return '';
  if(image_path.startsWith('assets/')){
    return '../../../' + image_path; // من src/renderer/products إلى جذر المشروع
  }
  // مسار مطلق على ويندوز
  return 'file:///' + image_path.replace(/\\/g, '/');
}

// pagination state
let __allProducts = [];
let __totalProducts = 0;
let __page = 1;
let __pageSize = 50; // زيادة من 20 إلى 50 لتحسين الأداء عبر VPN

function renderPager(total){
  const top = document.getElementById('pagerTop');
  const bottom = document.getElementById('pagerBottom');
  
  if (!top || !bottom) return;
  
  const pages = (__pageSize && __pageSize>0) ? Math.max(1, Math.ceil(total/ __pageSize)) : 1;
  
  const btn = (label, disabled, go)=>`<button class="px-4 py-2.5 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-lg text-sm font-bold shadow-md border border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500" ${disabled?'disabled':''} data-go="${go}">${label}</button>`;
  const html = [
    btn(__currentLang.firstPage || '⏮️ الأولى', __page<=1, 'first'),
    btn(__currentLang.prevPage || '◀️ السابقة', __page<=1, 'prev'),
    `<span class="px-5 py-2.5 bg-white border-2 border-purple-500 rounded-lg text-slate-800 font-black text-sm shadow-md">📄 ${__currentLang.pageOf || 'صفحة'} ${__page} ${__currentLang.of || 'من'} ${pages} (${total.toLocaleString('ar')} ${__currentLang.product || 'منتج'})</span>`,
    btn(__currentLang.nextPage || 'التالية ▶️', __page>=pages, 'next'),
    btn(__currentLang.lastPage || 'الأخيرة ⏭️', __page>=pages, 'last')
  ].join(' ');
  
  top.innerHTML = html;
  bottom.innerHTML = html;
  
  const onClick = (e)=>{
    const b = e.target.closest('button'); if(!b) return;
    const act = b.getAttribute('data-go');
    if(act==='first') __page=1;
    if(act==='prev') __page=Math.max(1,__page-1);
    if(act==='next') __page=Math.min(pages,__page+1);
    if(act==='last') __page=pages;
    loadProducts(false);
  };
  
  top.onclick = onClick;
  bottom.onclick = onClick;
}

async function renderRows(list){
  tbody.innerHTML='';
  
  const productIds = list.map(p => p.id);
  let imageCache = {};
  let opsCache = {};
  
  try {
    const [imgRes, opsRes] = await Promise.all([
      window.api.products_images_get_batch(productIds).catch(() => ({ok:false})),
      window.api.products_ops_get_batch(productIds).catch(() => ({ok:false}))
    ]);
    
    if(imgRes && imgRes.ok && imgRes.items) {
      Object.keys(imgRes.items).forEach(productId => {
        imageCache[productId] = imgRes.items[productId];
      });
    }
    if(opsRes && opsRes.ok && opsRes.items) {
      Object.keys(opsRes.items).forEach(productId => {
        opsCache[productId] = opsRes.items[productId];
      });
    }
  } catch(_) {}
  
  list.forEach((p, idx) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50';
    tr.dataset.pid = String(p.id);

    const rowActions = [
      hasProd('products.edit') ? `<button class="px-2.5 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-md text-[11px] font-bold shadow-sm border border-orange-400" data-act="edit" data-id="${p.id}">${__currentLang.edit || '✏️ تعديل'}</button>` : '',
      hasProd('products.toggle') ? `<button class="px-2.5 py-1.5 ${p.is_active?'bg-gradient-to-r from-red-500 to-red-600 border-red-400':'bg-gradient-to-r from-green-500 to-green-600 border-green-400'} text-white rounded-md text-[11px] font-bold shadow-sm border" data-act="toggle" data-id="${p.id}">${p.is_active? (__currentLang.deactivate || '❌ إيقاف'):(__currentLang.activate || '✅ تفعيل')}</button>` : '',
      hasProd('products.delete') ? `<button class="px-2.5 py-1.5 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-md text-[11px] font-bold shadow-sm border border-slate-500" data-act="delete" data-id="${p.id}">${__currentLang.delete || '🗑️ حذف'}</button>` : ''
    ].join(' ');
    const isCustomSort = (document.getElementById('sort')?.value || '') === 'custom';
    const orderBtns = (hasProd('products.reorder') && isCustomSort) ? `
      <span class="inline-flex gap-1 mr-2">
        <button class="px-2 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-bold text-sm shadow-sm border border-blue-400" data-act="move_up" data-id="${p.id}" title="تحريك لأعلى">↑</button>
        <button class="px-2 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-bold text-sm shadow-sm border border-blue-400" data-act="move_down" data-id="${p.id}" title="تحريك لأسفل">↓</button>
      </span>` : '';

    const imgData = imageCache[p.id];
    const imgSrc = (imgData && imgData.base64) ? `data:${imgData.mime||'image/png'};base64,${imgData.base64}` : '';
    
    const items = opsCache[p.id] || [];
    let displayPrice = Number(p.price).toFixed(2);
    if(!(Number(p.price) > 0)){
      const activeOps = items.filter(x => x.is_active);
      if(activeOps.length){
        displayPrice = Number(activeOps[0].price||0).toFixed(2);
      }
    }
    
    const opsHtml = items.length 
      ? items.map(o => `<span class="inline-flex gap-1.5 items-center px-2 py-1 border border-purple-200 rounded-full bg-purple-50 text-xs font-semibold mr-1 mb-1">
          <span class="text-purple-700">${String(o.name||'')}</span>
          <span class="text-purple-600">${Number(o.price||0).toFixed(2)}</span>
          ${o.is_active ? '' : `<span class="text-red-600 font-black">${__currentLang.stopped || 'موقوف'}</span>`}
        </span>`).join(' ')
      : `<span class="text-slate-400 text-xs">${__currentLang.noOperations || 'لا توجد'}</span>`;

    tr.innerHTML = `
      <td class="px-4 py-4 text-sm text-slate-700 font-bold"><span>${((__page-1)*(__pageSize||list.length))+idx+1}</span> ${orderBtns}</td>
      <td class="px-4 py-4"><img class="w-12 h-12 rounded-lg object-cover border border-slate-300 bg-slate-100" src="${imgSrc}" alt="" loading="lazy"/></td>
      <td class="px-4 py-4 text-sm text-slate-800 font-black">${p.name}${p.name_en ? `<div class="text-xs text-slate-500 font-semibold mt-1">${String(p.name_en).replace(/[&<>\"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]))}</div>` : ''}</td>
      <td class="px-4 py-4 text-sm text-slate-800 font-bold">
        <span class="price-cell text-purple-700">${displayPrice}</span>
      </td>
      <td class="px-4 py-4 text-sm ops-cell">${opsHtml}</td>
      <td class="px-4 py-4 text-sm text-slate-700 font-bold">${p.stock}</td>
      <td class="px-4 py-4 text-sm text-slate-700 font-semibold">${p.category || ''}</td>
      <td class="px-4 py-4">${p.is_active ? `<span class="inline-block px-3 py-1.5 bg-green-100 text-green-700 text-xs font-black rounded-full">${__currentLang.active || '✅ نشط'}</span>` : `<span class="inline-block px-3 py-1.5 bg-red-100 text-red-700 text-xs font-black rounded-full">${__currentLang.inactive || '❌ موقوف'}</span>`}</td>
      <td class="px-4 py-4 text-center"><div class="flex items-center justify-center gap-1.5">${rowActions}</div></td>`;
    tbody.appendChild(tr);
  });
  renderPager(__totalProducts || list.length);
}

async function loadProducts(resetPage = true){
  setError('');
  try{
    const t = await window.api.types_list();
    activeTypes = new Set((t && t.ok ? (t.items||[]) : []).map(x => x.name));
  }catch(_){ activeTypes = new Set(); }

  if(resetPage) __page = 1;

  const effectivePageSize = __pageSize > 0 ? __pageSize : 0;
  const query = {
    q: (document.getElementById('q')?.value || '').trim(),
    active: (document.getElementById('f_active')?.value || ''),
    category: (document.getElementById('f_category_filter')?.value || ''),
    sort: (document.getElementById('sort')?.value || 'id_desc'),
    limit: effectivePageSize,
    offset: effectivePageSize > 0 ? (__page - 1) * effectivePageSize : 0,
  };
  
  const res = await window.api.products_list(query);
  if(!res.ok){ setError(res.error || 'تعذر تحميل المنتجات'); return; }
  __allProducts = res.items || [];
  __totalProducts = res.total || __allProducts.length;
  await renderRows(__allProducts);
}

// init page size control
const pageSizeSel = document.getElementById('pageSize');
if(pageSizeSel){
  pageSizeSel.addEventListener('change', ()=>{
    const v = Number(pageSizeSel.value||50);
    __pageSize = v;
    __page = 1;
    loadProducts(true);
  });
}

function showCenterToast(text, ms=2500){
  const d = document.createElement('div');
  d.className = 'center-toast';
  d.textContent = text || '';
  document.body.appendChild(d);
  d.style.opacity = '1';
  setTimeout(()=>{ d.style.opacity='0'; try{ d.remove(); }catch(_){ } }, ms);
}

addBtn.addEventListener('click', openAddDialog);

if(saveOrderBtn){
  saveOrderBtn.addEventListener('click', async () => {
    try{
      const ids = __allProducts.map(p => p.id);
      const r = await window.api.products_reorder(ids);
      if(!r.ok){ setError(r.error||(__currentLang.saveOrderFailed || 'فشل حفظ ترتيب المنتجات')); return; }
      setError('');
      showCenterToast(__currentLang.orderSaved || 'تم حفظ الترتيب بنجاح');
    }catch(_){ setError(__currentLang.saveOrderError || 'تعذر حفظ الترتيب'); }
  });
}

document.getElementById('q').addEventListener('input', () => { clearTimeout(window.__prdT); window.__prdT=setTimeout(loadProducts, 300); });
document.getElementById('f_active').addEventListener('change', loadProducts);
document.getElementById('f_category_filter').addEventListener('change', loadProducts);
document.getElementById('sort').addEventListener('change', loadProducts);

// Operations UI events
opAdd.addEventListener('click', () => {
  const opId = Number(opSelect.value||0);
  const op = allOps.find(o=>o.id===opId);
  const price = Number(opPrice.value||0);
  if(!opId || !op || isNaN(price) || price<0) return;
  const exists = prodOps.find(x=>x.operation_id===opId);
  if(exists){ exists.price = price; }
  else { prodOps.push({ operation_id: opId, name: op.name, price }); }
  opPrice.value=''; opSelect.value=''; renderProdOps();
});

opList.addEventListener('click', (e)=>{
  const b = e.target.closest('button'); if(!b) return;
  const idx = Number(b.dataset.idx);
  const act = b.dataset.act;
  if(act==='remove'){ prodOps.splice(idx,1); renderProdOps(); }
  if(act==='edit'){
    const item = prodOps[idx];
    if(!item) return;
    opSelect.value = String(item.operation_id);
    opPrice.value = String(item.price);
  }
});

// Quick add operation via full modal dialog
const opAddDlg = document.getElementById('opAddDlg');
const opAddName = document.getElementById('opAddName');
const opAddNameEn = document.getElementById('opAddNameEn');
const opAddSave = document.getElementById('opAddSave');
const opAddCancel = document.getElementById('opAddCancel');
const opAddError = document.getElementById('opAddError');
const btnTranslateOpAdd = document.getElementById('btnTranslateOpAdd');

function showOpAddError(msg){ if(opAddError){ opAddError.textContent = msg; opAddError.classList.remove('hidden'); } }
function hideOpAddError(){ if(opAddError){ opAddError.textContent=''; opAddError.classList.add('hidden'); } }

if(btnTranslateOpAdd){
  btnTranslateOpAdd.addEventListener('click', async () => {
    const arName = (opAddName.value || '').trim();
    if(!arName) return;
    const orig = btnTranslateOpAdd.innerHTML;
    btnTranslateOpAdd.disabled = true;
    btnTranslateOpAdd.innerHTML = '⏳';
    try{
      const res = await window.api.products_translate(arName);
      if(res && res.ok && res.text) opAddNameEn.value = res.text;
    }catch(_){ }
    finally{
      btnTranslateOpAdd.disabled = false;
      btnTranslateOpAdd.innerHTML = orig;
    }
  });
}

if(opAddCancel) opAddCancel.addEventListener('click', () => { opAddDlg.close(); });
if(opAddName){
  opAddName.addEventListener('keydown', (e) => {
    if(e.key === 'Enter'){ e.preventDefault(); opAddSave && opAddSave.click(); }
  });
}
if(opAddNameEn){
  opAddNameEn.addEventListener('keydown', (e) => {
    if(e.key === 'Enter'){ e.preventDefault(); opAddSave && opAddSave.click(); }
  });
}

if(opAddSave){
  opAddSave.addEventListener('click', async () => {
    const name = (opAddName.value || '').trim();
    if(!name){ showOpAddError('يرجى إدخال اسم العملية'); opAddName.focus(); return; }
    hideOpAddError();
    const name_en = (opAddNameEn.value || '').trim() || null;
    const origText = opAddSave.textContent;
    opAddSave.disabled = true;
    opAddSave.textContent = '⏳ جاري الحفظ...';
    try{
      const res = await window.api.ops_add({ name, name_en });
      if(!res || !res.ok){ showOpAddError(res && res.error ? res.error : (__currentLang.operationAddFailed || 'فشل إضافة العملية')); return; }
      opAddDlg.close();
      await loadAllOps();
      try{
        const added = (allOps||[]).find(o => String(o.id) === String(res.id));
        if(added){ opSelect.value = String(added.id); opPrice.focus(); }
      }catch(_){ }
    }catch(_){ showOpAddError(__currentLang.operationAddFailed || 'فشل إضافة العملية'); }
    finally{ opAddSave.disabled = false; opAddSave.textContent = origText; }
  });
}

if(opQuickAdd){
  opQuickAdd.addEventListener('click', ()=>{
    opAddName.value = '';
    opAddNameEn.value = '';
    hideOpAddError();
    opAddDlg.showModal();
    setTimeout(() => opAddName.focus(), 50);
  });
}

dlgCancel.addEventListener('click', closeDialog);

const btnTranslateName = document.getElementById('btnTranslateName');
if(btnTranslateName){
  btnTranslateName.addEventListener('click', async () => {
    const arName = (document.getElementById('f_name').value || '').trim();
    if(!arName) return;
    const orig = btnTranslateName.innerHTML;
    btnTranslateName.disabled = true;
    btnTranslateName.innerHTML = '⏳';
    try{
      const res = await window.api.products_translate(arName);
      if(res && res.ok && res.text){
        document.getElementById('f_name_en').value = res.text;
      }
    }catch(_){ }
    finally{
      btnTranslateName.disabled = false;
      btnTranslateName.innerHTML = orig;
    }
  });
}

dlgSave.addEventListener('click', async () => {
  setError('');
  const payload = {
    name: f_name.value.trim(),
    name_en: (f_name_en.value||'').trim() || null,
    barcode: f_barcode.value.trim() || null,
    price: parseFloat(f_price.value || '0'),
    stock: parseInt(f_stock.value || '0', 10),
    category: f_category.value.trim() || null,
    description: f_description.value.trim() || null,
    is_tobacco: (typeof f_is_tobacco!== 'undefined' && f_is_tobacco) ? (f_is_tobacco.value==='1' ? 1 : 0) : 0,
  };

  if(!payload.name){ setError(__currentLang.nameRequired || 'يرجى إدخال اسم المنتج'); return; }
  if(isNaN(payload.price) || payload.price<0){ setError(__currentLang.validPriceRequired || 'يرجى إدخال سعر صحيح'); return; }
  if(isNaN(payload.stock)){ setError(__currentLang.validStockRequired || 'يرجى إدخال مخزون صحيح'); return; }

  // Image handling: preserve existing unless changed or removed
  if(window.__removeImage === true){
    payload.remove_image = 1;
  } else if(window.__pickedImageBase64){
    payload.image_blob_base64 = window.__pickedImageBase64;
    payload.image_mime = window.__pickedImageMime || 'image/png';
    // do not send image_path; we store as BLOB
  } // else: send no image fields to keep current image

  let res;
  if(editId){ res = await window.api.products_update(editId, payload); }
  else { res = await window.api.products_add(payload); }

  if(!res.ok){ setError(res.error || (__currentLang.saveFailed || 'فشل الحفظ')); return; }

  // بعد الحفظ، امسح العلامات المؤقتة
  try{ delete window.__pickedImageBase64; delete window.__pickedImageMime; delete window.__removeImage; }catch(_){ }

  // save product operations mapping
  try{
    const items = prodOps.map(x => ({ operation_id: x.operation_id, price: Number(x.price||0) }));
    const pid = editId ? editId : (await (async ()=>{ const list = await window.api.products_list({ q: payload.name, active: '' }); const found = (list.ok? (list.items||[]) : []).find(p=>p.name===payload.name && p.barcode===payload.barcode); return found ? found.id : null; })());
    if(pid){ await window.api.prod_ops_set(pid, items); }
  }catch(_){ /* ignore mapping errors to not block product save */ }

  closeDialog();
  await loadProducts();
});

removeImageBtn.addEventListener('click', () => {
  pickedImagePath = null;
  f_thumb.src = '';
  try{ delete window.__pickedImageBase64; delete window.__pickedImageMime; }catch(_){ }
  window.__removeImage = true; // mark for removal on save
});

tbody.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if(!btn) return;
  const id = Number(btn.dataset.id);
  const act = btn.dataset.act;
  setError('');

  if(act==='edit'){
    const res = await window.api.products_get(id);
    if(!res.ok){ setError(res.error || (__currentLang.fetchFailed || 'تعذر جلب المنتج')); return; }
    openEditDialog(res.item);
  }
  if(act==='toggle'){
    const res = await window.api.products_toggle(id);
    if(!res.ok){ setError(res.error || (__currentLang.updateFailed || 'فشل تحديث الحالة')); return; }
    await loadProducts();
  }
  if(act==='delete'){
    const ok = await miniConfirm(__currentLang.deleteConfirm || 'تأكيد حذف المنتج؟');
    if(!ok) return;
    const res = await window.api.products_delete(id);
    if(!res.ok){ setError(res.error || (__currentLang.deleteFailed || 'فشل الحذف')); return; }
    await loadProducts();
  }
  if(act==='move_up' || act==='move_down'){
    const curIdx = __allProducts.findIndex(x=>x.id===id);
    if(curIdx>=0){
      const newIdx = act==='move_up' ? Math.max(0, curIdx-1) : Math.min(__allProducts.length-1, curIdx+1);
      if(newIdx !== curIdx){
        const item = __allProducts.splice(curIdx,1)[0];
        __allProducts.splice(newIdx,0,item);
        renderRows(__allProducts);
      }
    }
  }
  if(act==='export_pdf_product'){
    try{
      const res = await window.api.products_get(id);
      if(!res.ok){ setError(res.error || (__currentLang.fetchFailed || 'تعذر جلب المنتج')); return; }
      const p = res.item;
      const rpo = await window.api.prod_ops_list(id);
      const ops = (rpo && rpo.ok ? (rpo.items||[]) : []);
      await exportProductPdf(p, ops);
    }catch(_){ alert(__currentLang.productPdfFailed || 'تعذر إنشاء PDF للمنتج'); }
  }
});

pickImageBtn.addEventListener('click', async () => {
  const r = await window.api.pick_image();
  if(r && r.ok && r.path){
    try{
      const rf = await window.api.read_file_base64(r.path);
      if(rf && rf.ok){
        if(rf.tooLarge){ alert(__currentLang.imageTooBig || 'حجم الصورة أكبر من 1 ميجابايت. يرجى اختيار صورة أصغر.'); return; }
        f_thumb.src = `data:${rf.mime||'image/png'};base64,${rf.base64}`;
        pickedImagePath = null;
        window.__pickedImageBase64 = rf.base64;
        window.__pickedImageMime = rf.mime || 'image/png';
        window.__removeImage = false; // user chose a new image
      } else if(rf && !rf.ok){
        alert(rf.error || (__currentLang.fileReadFailed || 'فشل قراءة الملف'));
      }
    }catch(_){ /* ignore */ }
  }
});

// ====== PDF Export (all products) ======
btnExportProductsPdf?.addEventListener('click', async () => {
  try{
    const withOps = await fetchProductsWithOpsUsingCurrentFilters();
    await exportProductsPdf(withOps);
  }catch(_){ alert(__currentLang.pdfExportFailed || 'تعذر إنشاء PDF'); }
});

// ====== CSV Export (all products, UTF-8 BOM for Arabic) ======
btnExportProductsCsv?.addEventListener('click', async () => {
  try{
    const withOps = await fetchProductsWithOpsUsingCurrentFilters();
    exportProductsCsv(withOps);
  }catch(_){ alert(__currentLang.csvExportFailed || 'تعذر إنشاء CSV'); }
});

async function fetchProductsWithOpsUsingCurrentFilters(){
  const query = {
    q: (document.getElementById('q')?.value || '').trim(),
    active: (document.getElementById('f_active')?.value || ''),
    sort: (document.getElementById('sort')?.value || 'id_desc'),
  };
  const res = await window.api.products_list(query);
  if(!res.ok){ throw new Error(res.error || (__currentLang.loadProductsFailed || 'تعذر تحميل المنتجات')); }
  const list = res.items || [];
  const withOps = [];
  for(const p of list){
    try{
      const rpo = await window.api.prod_ops_list(p.id);
      withOps.push({ p, ops: (rpo && rpo.ok ? (rpo.items||[]) : []) });
    }catch(_){ withOps.push({ p, ops: [] }); }
  }
  return withOps;
}

function exportProductsCsv(items){
  const t = __currentLang;
  const header = ['#', t.name || 'الاسم', t.productNameEnCsv || 'الاسم الإنجليزي', t.barcode || 'الباركود', t.price || 'السعر', t.stock || 'المخزون', t.category || 'الفئة', t.status || 'الحالة', t.operationsAndPrices || 'العمليات وأسعارها'];
  const rows = items.map(({p, ops}, idx) => {
    // ضع كل عملية في سطر جديد داخل نفس الخلية (Excel سيحترم فواصل الأسطر)
    const opsStr = (ops||[]).map(o => `${(o.name||'')}: ${Number(o.price||0).toFixed(2)}`).join('\n');
    return [
      idx+1,
      p.name||'',
      p.name_en||'',
      p.barcode||'',
      Number(p.price||0).toFixed(2),
      Number(p.stock||0),
      p.category||'',
      p.is_active ? (t.active || 'نشط') : (t.inactive || 'موقوف'),
      opsStr
    ];
  });
  const csv = [header, ...rows].map(r => r.map(cell => {
    const s = String(cell ?? '');
    // إذا احتوى على فواصل أسطر أو فواصل أو اقتباسات، لفّه بعلامات اقتباس مزدوجة وهرب الاقتباسات
    if(/[",\n]/.test(s)) return '"' + s.replace(/"/g,'""') + '"';
    return s;
  }).join(',')).join('\n');

  // إضافة BOM لضمان دعم العربية في Excel
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'products.csv'; a.click();
  URL.revokeObjectURL(url);
}

// بناء PDF لقائمة المنتجات + أسعار العمليات
async function exportProductsPdf(items){
  const t = __currentLang;
  const isAr = (document.documentElement.lang === 'ar');
  const rows = items.map(({p, ops}, idx) => {
    const basePrice = Number(p.price||0);
    const opsRows = (ops||[]).map(o => `<div style="display:flex; gap:8px; justify-content:space-between; border-bottom:1px dashed #e5e7eb; padding:2px 0;"><span>${(o.name||'')}</span><span>${Number(o.price||0).toFixed(2)}</span></div>`).join('');
    const safe = (s)=> String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return `<tr>
      <td>${idx+1}</td>
      <td><div style="font-weight:600;">${safe(p.name)}</div>${p.name_en? `<div style='color:#64748b; font-size:10px; margin-top:2px;'>${safe(p.name_en)}</div>`:''}</td>
      <td>${safe(p.barcode)}</td>
      <td>${basePrice.toFixed(2)}</td>
      <td>${Number(p.stock||0)}</td>
      <td>${safe(p.category)}</td>
      <td>${p.is_active ? (t.active || 'نشط') : (t.inactive || 'موقوف')}</td>
      <td class="ops">${opsRows || `<span style="color:#64748b">${t.noOperations || 'لا توجد'}</span>`}</td>
    </tr>`;
  }).join('');

  const html = `<!doctype html><html lang="${isAr?'ar':'en'}" dir="${isAr?'rtl':'ltr'}"><head>
  <meta charset="utf-8"/>
  <title>${t.productsReport || 'تقرير المنتجات'}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    
    * {
      font-family: 'Cairo', sans-serif !important;
    }
    
    body {
      background: white;
      padding: 20px;
      direction: ${isAr?'rtl':'ltr'};
    }
    
    .header {
      text-align: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 4px solid #7c3aed;
    }
    
    h1 {
      font-size: 32px;
      font-weight: 900;
      color: #1f2937;
      margin-bottom: 8px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-bottom: 16px;
      font-weight: 700;
    }
    
    thead th {
      background: linear-gradient(to bottom, #f5f3ff, #ede9fe) !important;
      color: #5b21b6 !important;
      font-weight: 900 !important;
      padding: 10px 6px;
      border: 2px solid #94a3b8;
      text-align: center;
      font-size: 13px;
    }
    
    tbody td {
      padding: 8px 6px;
      border: 1px solid #cbd5e1;
      text-align: center;
      vertical-align: top;
      font-weight: 700;
    }
    
    tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    
    .ops {
      text-align: right;
      font-size: 11px;
      font-weight: 600;
    }
    
    @media print {
      @page {
        size: A4 landscape;
        margin: 15mm;
      }
    }
  </style>
  </head>
  <body>
    <div class="header">
      <h1>${t.productsReport || 'تقرير المنتجات'}</h1>
    </div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>${t.name || 'الاسم'}</th>
          <th>${t.barcode || 'الباركود'}</th>
          <th>${t.price || 'السعر'}</th>
          <th>${t.stock || 'المخزون'}</th>
          <th>${t.category || 'الفئة'}</th>
          <th>${t.status || 'الحالة'}</th>
          <th>${t.operationsAndPricesColon || 'العمليات وأسعارها'}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </body>
  </html>`;
  const r = await window.api.pdf_export(html, { pageSize: 'A4', landscape: true, printBackground: true, saveMode: 'auto', filename: 'products.pdf' });
  if(!r || !r.ok){ alert(t.pdfExportFailed || 'تعذر إنشاء PDF'); }
}

// PDF لمنتج واحد + عملياته
async function exportProductPdf(p, ops){
  const t = __currentLang;
  const isAr = (document.documentElement.lang === 'ar');
  const rows = (ops||[]).map((o,i)=>`<tr><td>${i+1}</td><td>${(o.name||'')}</td><td>${Number(o.price||0).toFixed(2)}</td></tr>`).join('');
  const safe = (s)=> String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  
  const html = `<!doctype html><html lang="${isAr?'ar':'en'}" dir="${isAr?'rtl':'ltr'}"><head>
  <meta charset="utf-8"/>
  <title>${t.productDetails || 'تفاصيل المنتج'}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    
    * {
      font-family: 'Cairo', sans-serif !important;
    }
    
    body {
      background: white;
      padding: 20px;
      direction: ${isAr?'rtl':'ltr'};
    }
    
    .header {
      text-align: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 4px solid #7c3aed;
    }
    
    h1 {
      font-size: 28px;
      font-weight: 900;
      color: #1f2937;
      margin-bottom: 16px;
    }
    
    .info-section {
      background: linear-gradient(to bottom, #f5f3ff, #ede9fe);
      border: 2px solid #94a3b8;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
    }
    
    .info-row {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px dashed #cbd5e1;
      font-size: 16px;
    }
    
    .info-row:last-child {
      border-bottom: none;
    }
    
    .info-label {
      font-weight: 800;
      color: #5b21b6;
      min-width: 120px;
    }
    
    .info-value {
      color: #1f2937;
      font-weight: 700;
    }
    
    h2 {
      font-size: 22px;
      font-weight: 900;
      color: #5b21b6;
      margin: 24px 0 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #7c3aed;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
      margin-bottom: 16px;
      font-weight: 700;
    }
    
    thead th {
      background: linear-gradient(to bottom, #f5f3ff, #ede9fe) !important;
      color: #5b21b6 !important;
      font-weight: 900 !important;
      padding: 10px 6px;
      border: 2px solid #94a3b8;
      text-align: center;
      font-size: 15px;
    }
    
    tbody td {
      padding: 8px 6px;
      border: 1px solid #cbd5e1;
      text-align: center;
      font-weight: 700;
    }
    
    tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    
    @media print {
      @page {
        size: A4;
        margin: 15mm;
      }
    }
  </style>
  </head>
  <body>
    <div class="header">
      <h1>${t.productDetails || 'تفاصيل المنتج'}</h1>
    </div>
    
    <div class="info-section">
      <div class="info-row">
        <div class="info-label">${t.nameLabel || 'الاسم:'}</div>
        <div class="info-value">${safe(p.name)}</div>
      </div>
      ${p.name_en ? `<div class="info-row">
        <div class="info-label">${t.nameEnLabel || 'الاسم بالإنجليزي:'}</div>
        <div class="info-value">${safe(p.name_en)}</div>
      </div>` : ''}
      <div class="info-row">
        <div class="info-label">${t.barcodeLabel || 'الباركود:'}</div>
        <div class="info-value">${safe(p.barcode)}</div>
      </div>
      <div class="info-row">
        <div class="info-label">${t.categoryLabelColon || 'الفئة:'}</div>
        <div class="info-value">${safe(p.category)}</div>
      </div>
      <div class="info-row">
        <div class="info-label">${t.statusLabel || 'الحالة:'}</div>
        <div class="info-value">${p.is_active ? (t.activeStatus || 'نشط ✅') : (t.inactiveStatus || 'موقوف ❌')}</div>
      </div>
      <div class="info-row">
        <div class="info-label">${t.priceColon || 'السعر:'}</div>
        <div class="info-value">${Number(p.price||0).toFixed(2)} ﷼</div>
      </div>
      <div class="info-row">
        <div class="info-label">${t.stockColon || 'المخزون:'}</div>
        <div class="info-value">${Number(p.stock||0)}</div>
      </div>
    </div>
    
    <h2>${t.operationsAndPricesColon || 'العمليات وأسعارها'}</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>${t.operation || 'العملية'}</th>
          <th>${t.price || 'السعر'}</th>
        </tr>
      </thead>
      <tbody>${rows || `<tr><td colspan="3" style="color:#64748b; padding:20px;">${t.noOperationsForProduct || 'لا توجد عمليات لهذا المنتج'}</td></tr>`}</tbody>
    </table>
  </body>
  </html>`;
  const r = await window.api.pdf_export(html, { pageSize: 'A4', printBackground: true, saveMode: 'auto', filename: `product-${(p.name||'item')}.pdf` });
  if(!r || !r.ok){ alert(t.productPdfFailed || 'تعذر إنشاء PDF للمنتج'); }
}

async function populateCategoryFilter(){
  try{
    const res = await window.api.types_list();
    const categoryFilter = document.getElementById('f_category_filter');
    if(!categoryFilter) return;
    
    categoryFilter.innerHTML = `<option value="">${__currentLang.allCategories || 'كل الأنواع'}</option>`;
    
    if(res && res.ok && res.items){
      res.items.forEach(type => {
        const opt = document.createElement('option');
        opt.value = type.name;
        opt.textContent = type.name;
        categoryFilter.appendChild(opt);
      });
    }
  }catch(e){
    console.error('Failed to load category filter:', e);
  }
}

(async () => {
  await populateCategoryFilter();
  await loadProducts();
})();