// Sales screen: scan by barcode or pick from catalog, compute totals w/ VAT and currency settings

// Language system: Apply translations to sales screen
const __langKey = 'app_lang';
let __currentLang = {}; // Store current translations for use in dynamic messages
function __applyLang(lang){
  const base = (typeof lang==='string' ? lang.split('-')[0].toLowerCase() : 'ar');
  const isAr = (base==='ar');
  const t = {
    // Header buttons
    clearCart: isAr ? 'تفريغ السلة' : 'Clear Cart',
    clearCartShort: isAr ? 'تفريغ' : 'Clear',
    sendKitchen: isAr ? 'إرسال للمطبخ' : 'Send to Kitchen',
    sendKitchenShort: isAr ? 'مطبخ' : 'Kitchen',
    printInvoice: isAr ? 'طباعة الفاتورة' : 'Print Invoice',
    printInvoiceShort: isAr ? 'طباعة' : 'Print',
    backRooms: isAr ? 'الرجوع للغرف' : 'Back to Rooms',
    backRoomsShort: isAr ? 'غرف' : 'Rooms',
    backHome: isAr ? 'العودة للرئيسية' : 'Back to Home',
    backHomeShort: isAr ? 'رئيسية' : 'Home',
    // Table headers
    product: isAr ? 'المنتج' : 'Product',
    operation: isAr ? 'العملية' : 'Operation',
    price: isAr ? 'السعر' : 'Price',
    qty: isAr ? 'الكمية' : 'Qty',
    total: isAr ? 'الإجمالي' : 'Total',
    // Invoice processing
    processInvoicePlaceholder: isAr ? 'رقم فاتورة للمعالجة' : 'Invoice no. to process',
    processInvoiceBtn: isAr ? 'معالجة الفاتورة' : 'Process Invoice',
    processFullBtn: isAr ? 'معالجة كامل الفاتورة' : 'Process Full Invoice',
    // Invoice summary
    invoiceSummary: isAr ? 'ملخص الفاتورة' : 'Invoice Summary',
    subTotal: isAr ? 'الإجمالي قبل الضريبة' : 'Subtotal (Before VAT)',
    vatTotal: isAr ? 'ضريبة VAT' : 'VAT',
    grandTotal: isAr ? 'الإجمالي شامل الضريبة' : 'Grand Total (Incl. VAT)',
    selectCustomer: isAr ? 'اختيار العميل' : 'Select Customer',
    customerPlaceholder: isAr ? 'اسم أو جوال' : 'Name or Phone',
    newCustomer: isAr ? '+ عميل جديد' : '+ New Customer',
    // Additional rows
    extra: isAr ? 'الإضافى' : 'Extra',
    discount: isAr ? 'خصم' : 'Discount',
    afterDiscount: isAr ? 'الإجمالي بعد الخصم' : 'Total After Discount',
    tobaccoFee: isAr ? 'رسوم التبغ' : 'Tobacco Fee',
    // Payment fields
    paymentMethod: isAr ? 'طريقة الدفع' : 'Payment Method',
    cashReceived: isAr ? 'المبلغ المدفوع' : 'Cash Received',
    cashReceivedPlaceholder: isAr ? 'المبلغ المدفوع' : 'Amount Received',
    remainingBeforePrint: isAr ? 'المبلغ المتبقي' : 'Remaining amount',
    remainingBeforePrintPlaceholder: isAr ? 'المتبقي قبل الطباعة' : 'Remaining before print',
    extraValue: isAr ? 'الإضافى' : 'Extra',
    extraPlaceholder: isAr ? 'قيمة الإضافى' : 'Extra Value',
    discountType: isAr ? 'نوع الخصم' : 'Discount Type',
    discountValue: isAr ? 'قيمة الخصم' : 'Discount Value',
    discountPlaceholder: isAr ? 'قيمة الخصم' : 'Discount Amount',
    coupon: isAr ? 'كوبون' : 'Coupon',
    couponPlaceholder: isAr ? 'رمز الكوبون' : 'Coupon Code',
    driver: isAr ? 'السائق' : 'Driver',
    noDriver: isAr ? 'بدون سائق' : 'No Driver',
    orderType: isAr ? 'نوع الطلب' : 'Order Type',
    selectOrderType: isAr ? 'اختر نوع الطلب' : 'Select Order Type',
    safari: isAr ? 'سفري' : 'Safari',
    local: isAr ? 'محلي' : 'Local',
    delivery: isAr ? 'خدمة توصيل' : 'Delivery',
    notes: isAr ? 'الملاحظات' : 'Notes',
    notesPlaceholder: isAr ? 'ملاحظات إضافية...' : 'Additional notes...',
    // Discount type options
    noDiscount: isAr ? 'بدون خصم' : 'No Discount',
    percentDiscount: isAr ? 'خصم %' : 'Discount %',
    amountDiscount: isAr ? 'خصم نقدي' : 'Amount Discount',
    // Modal: Add Customer
    addCustomerTitle: isAr ? '➕ إضافة عميل جديد' : '➕ Add New Customer',
    customerName: isAr ? '👤 اسم العميل الكامل' : '👤 Full Customer Name',
    customerNamePlaceholder: isAr ? 'أدخل اسم العميل...' : 'Enter customer name...',
    phone: isAr ? '📱 رقم الجوال' : '📱 Phone Number',
    phonePlaceholder: isAr ? 'مثال: 0501234567' : 'Example: 0501234567',
    email: isAr ? '📧 البريد الإلكتروني' : '📧 Email',
    emailPlaceholder: isAr ? 'مثال: customer@example.com' : 'Example: customer@example.com',
    address: isAr ? '📍 العنوان' : '📍 Address',
    addressPlaceholder: isAr ? 'أدخل عنوان العميل...' : 'Enter customer address...',
    vatNumber: isAr ? '🏢 الرقم الضريبي (اختياري)' : '🏢 VAT Number (Optional)',
    vatNumberPlaceholder: isAr ? 'مثال: 300123456700003' : 'Example: 300123456700003',
    crNumber: isAr ? '🧾 رقم السجل التجاري (اختياري)' : '🧾 CR Number (Optional)',
    crNumberPlaceholder: isAr ? 'مثال: 1010123456' : 'Example: 1010123456',
    nationalAddress: isAr ? '🏠 العنوان الوطني (اختياري)' : '🏠 National Address (Optional)',
    nationalAddressPlaceholder: isAr ? 'مثال: 1234-حي-مدينة-رمز بريدي' : 'Example: 1234-District-City-ZIP',
    additionalNotes: isAr ? '📝 ملاحظات إضافية' : '📝 Additional Notes',
    additionalNotesPlaceholder: isAr ? 'أي ملاحظات خاصة بالعميل...' : 'Any special notes...',
    cancel: isAr ? '❌ إلغاء' : '❌ Cancel',
    saveData: isAr ? '✅ حفظ البيانات' : '✅ Save Data',
    // Confirm dialog
    confirmClearTitle: isAr ? 'تأكيد تفريغ السلة' : 'Confirm Clear Cart',
    confirmClearMessage: isAr ? 'هل تريد تفريغ السلة الآن؟' : 'Do you want to clear the cart now?',
    yes: isAr ? 'نعم' : 'Yes',
    no: isAr ? 'لا' : 'No',
    // Low stock warning
    lowStockWarning: isAr ? 'تحذير: أصناف قرب نفاد المخزون' : 'Warning: Low Stock Items',
    // Error messages
    invalidAmount: isAr ? 'قيمة غير صحيحة للمبلغ المدفوع' : 'Invalid amount received',
    lessThanTotal: isAr ? 'المبلغ المدفوع أقل من الإجمالي شامل الضريبة' : 'Amount is less than grand total',
    catalogLoadError: isAr ? 'تعذر تحميل الكتالوج' : 'Failed to load catalog',
    cannotAddDuringProcess: isAr ? 'لا يمكن إضافة أصناف أثناء معالجة الفاتورة' : 'Cannot add items while processing invoice',
    typeDisabled: isAr ? 'هذا النوع الرئيسي موقوف، لا يمكن البيع من تحته' : 'This type is disabled, cannot sell from it',
    noNewItemsKitchen: isAr ? 'لا توجد أصناف جديدة لإرسالها للمطبخ' : 'No new items to send to kitchen',
    sendSuccess: isAr ? 'تم الإرسال بنجاح' : 'Sent successfully',
    sendFailed: isAr ? 'فشل الإرسال' : 'Send failed',
    sendError: isAr ? 'تعذر الإرسال' : 'Cannot send',
    // Payment method names
    payMethodCash: isAr ? 'كاش' : 'Cash',
    payMethodCard: isAr ? 'شبكة' : 'Card',
    payMethodCredit: isAr ? 'آجل' : 'Credit',
    payMethodMixed: isAr ? 'مختلط' : 'Mixed',
    payMethodTamara: isAr ? 'تمارا' : 'Tamara',
    payMethodTabby: isAr ? 'تابي' : 'Tabby',
    // Loading
    loading: isAr ? 'جاري التحميل...' : 'Loading...',
    customerListLoading: isAr ? '⏳ جاري التحميل...' : '⏳ Loading...',
    // Invoice processing toasts
    creditUnpaid: isAr ? 'هذه فاتورة آجل غير مسددة ولا يمكن عمل معالجة لها قبل السداد' : 'This is an unpaid credit invoice and cannot be processed before settlement',
    alreadyProcessed: isAr ? 'تم عمل معالجة لهذه الفاتورة من قبل' : 'This invoice has already been processed',
    noProcessedInvoice: isAr ? 'لا توجد فاتورة مُعالجة' : 'No processed invoice',
    cannotProcessFull: isAr ? 'تعذر معالجة كامل الفاتورة' : 'Failed to process full invoice',
    creditNoteCreated: isAr ? 'تم إنشاء إشعار دائن وإرجاع المخزون بنجاح' : 'Credit note created and stock returned successfully',
    // Cash received placeholders
    cashReceivedDefault: isAr ? 'المبلغ المدفوع' : 'Amount paid',
    cashReceivedMixed: isAr ? 'المبلغ النقدي (مختلط)' : 'Cash amount (mixed)',
    cashReceivedMixedLabel: isAr ? 'المدفوع كاش' : 'Paid Cash',
    remainingBeforePrintMixedLabel: isAr ? 'المدفوع شبكة' : 'Paid Card',
    cashReceivedCredit: isAr ? 'المبلغ المدفوع (آجل)' : 'Amount paid (credit)',
    cashReceivedLocked: isAr ? 'غير قابل للإدخال لهذه الطريقة' : 'Not applicable for this method',
    // Driver
    noDriverName: isAr ? 'بدون اسم' : 'No name',
    driverNotSelected: isAr ? 'لم يتم تحديد سائق بعد' : 'No driver selected',
    driverPhone: isAr ? 'جوال: ' : 'Phone: ',
    // Coupon
    couponInvalid: isAr ? 'كوبون غير صالح' : 'Invalid coupon',
    // Subtotal labels when no VAT
    subtotalNoVat: isAr ? 'المجموع' : 'Total',
    grandTotalNoVat: isAr ? 'الإجمالي' : 'Grand Total',
    // Discount dynamic labels
    discountGeneral: isAr ? 'خصم' : 'Discount',
    couponDiscountLabel: isAr ? 'كوبون' : 'Coupon',
    offerDiscount: isAr ? 'خصم عرض' : 'Offer Discount',
    amountDiscountLabel: isAr ? 'خصم نقدي' : 'Cash Discount',
    // Cart item actions
    pricePlaceholder: isAr ? 'السعر' : 'Price',
    deleteItem: isAr ? 'حذف' : 'Delete',
    itemDescPlaceholder: isAr ? 'وصف الصنف (اختياري)' : 'Item description (optional)',
    // Invoice loading errors
    enterInvoiceNo: isAr ? 'أدخل رقم فاتورة صحيح' : 'Enter a valid invoice number',
    invoiceNotFound: isAr ? 'لم يتم العثور على الفاتورة' : 'Invoice not found',
    failedFetchInvoice: isAr ? 'تعذر جلب تفاصيل الفاتورة' : 'Failed to fetch invoice details',
    errorDuringProcess: isAr ? 'حدث خطأ أثناء المعالجة' : 'An error occurred during processing',
    // Low stock
    outOfStock: isAr ? 'تم نفاد المخزون' : 'Out of Stock',
    remaining: isAr ? 'المتبقي: ' : 'Remaining: ',
    // General
    addProductsFirst: isAr ? 'أضف منتجات أولاً' : 'Add products first',
    printing: isAr ? 'جاري الطباعة...' : 'Printing...',
    printingShort: isAr ? 'جاري...' : 'Wait...',
    // Payment validation errors
    enterCashMixed: isAr ? 'أدخل مبلغ الكاش لطريقة الدفع المختلط' : 'Enter cash amount for mixed payment',
    invalidCashAmount: isAr ? 'قيمة غير صحيحة للمبلغ النقدي' : 'Invalid cash amount',
    cashExceedsTotal: isAr ? 'المبلغ النقدي لا يجب أن يتجاوز الإجمالي' : 'Cash amount cannot exceed total',
    saveInvoiceFailed: isAr ? 'فشل حفظ الفاتورة' : 'Failed to save invoice',
    // Customer modal validation
    enterPhoneNumber: isAr ? 'يرجى إدخال رقم الجوال' : 'Please enter phone number',
    vatMustBe15: isAr ? 'الرقم الضريبي يجب أن يكون 15 رقماً' : 'VAT number must be 15 digits',
    customerAddedSuccess: isAr ? 'تم إضافة العميل بنجاح' : 'Customer added successfully',
    customerAddFailed: isAr ? 'تعذر إضافة العميل' : 'Failed to add customer',
    // Discount field placeholders
    discountPercentPlaceholder: isAr ? 'نسبة الخصم %' : 'Discount %',
    discountAmountPlaceholder: isAr ? 'قيمة الخصم' : 'Discount amount',
    // ZATCA
    zatcaEnterInvoice: isAr ? 'أدخل رقم الفاتورة لإرسالها للهيئة:' : 'Enter invoice number to send to ZATCA:',
    zatcaInvoiceRequired: isAr ? 'رقم الفاتورة مطلوب' : 'Invoice number is required',
    zatcaSearchFailed: isAr ? 'تعذر البحث عن الفاتورة' : 'Failed to search for invoice',
    zatcaInvoiceNotFound: isAr ? 'لم يتم العثور على فاتورة بهذا الرقم' : 'No invoice found with this number',
    // Shortcuts / UI
    shortcutF1: isAr ? 'اختصار: F1' : 'Shortcut: F1',
    roomPrefix: isAr ? 'غرفة #' : 'Room #',
  };
  
  // Store current translations globally
  __currentLang = t;
  
  // Apply HTML lang and dir attributes
  document.documentElement.lang = isAr ? 'ar' : 'en';
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  
  // Header buttons
  const btnClearTop = document.getElementById('btnClearTop');
  if(btnClearTop){
    const longText = btnClearTop.querySelector('.hidden.sm\\:inline');
    const shortText = btnClearTop.querySelector('.sm\\:hidden');
    if(longText) longText.textContent = t.clearCart;
    if(shortText) shortText.textContent = t.clearCartShort;
  }
  
  const btnKitchenTop = document.getElementById('btnKitchenTop');
  if(btnKitchenTop){
    const longText = btnKitchenTop.querySelector('.hidden.sm\\:inline');
    const shortText = btnKitchenTop.querySelector('.sm\\:hidden');
    if(longText) longText.textContent = t.sendKitchen;
    if(shortText) shortText.textContent = t.sendKitchenShort;
  }
  
  const btnPayTop = document.getElementById('btnPayTop');
  if(btnPayTop){
    const longText = btnPayTop.querySelector('.hidden.sm\\:inline');
    const shortText = btnPayTop.querySelector('.sm\\:hidden');
    if(longText) longText.textContent = t.printInvoice;
    if(shortText) shortText.textContent = t.printInvoiceShort;
  }
  
  const btnBackRooms = document.getElementById('btnBackRooms');
  if(btnBackRooms){
    const longText = btnBackRooms.querySelector('.hidden.sm\\:inline');
    const shortText = btnBackRooms.querySelector('.sm\\:hidden');
    if(longText) longText.textContent = t.backRooms;
    if(shortText) shortText.textContent = t.backRoomsShort;
  }
  
  const btnBackHome = document.getElementById('btnBackHome');
  if(btnBackHome){
    const longText = btnBackHome.querySelector('.hidden.sm\\:inline');
    const shortText = btnBackHome.querySelector('.sm\\:hidden');
    if(longText) longText.textContent = t.backHome;
    if(shortText) shortText.textContent = t.backHomeShort;
  }
  
  // Table headers
  const tableHeaders = document.querySelectorAll('thead th');
  if(tableHeaders.length >= 5){
    tableHeaders[0].textContent = t.product;
    tableHeaders[1].textContent = t.operation;
    tableHeaders[2].textContent = t.price;
    tableHeaders[3].textContent = t.qty;
    tableHeaders[4].textContent = t.total;
  }
  
  // Invoice processing
  const processInvoiceNo = document.getElementById('processInvoiceNo');
  if(processInvoiceNo) processInvoiceNo.placeholder = t.processInvoicePlaceholder;
  
  const btnProcessInvoice = document.getElementById('btnProcessInvoice');
  if(btnProcessInvoice) btnProcessInvoice.textContent = t.processInvoiceBtn;
  
  const btnProcessFull = document.getElementById('btnProcessFull');
  if(btnProcessFull) btnProcessFull.textContent = t.processFullBtn;
  
  // Invoice summary labels
  const totalsHead = document.querySelector('.totals-head');
  if(totalsHead) totalsHead.textContent = t.invoiceSummary;
  
  const subTotalLabel = document.querySelector('.text-\\[9px\\].font-black.text-black.mb-0\\.5.leading-tight');
  if(subTotalLabel && subTotalLabel.textContent.includes('قبل الضريبة')) subTotalLabel.textContent = t.subTotal;
  
  const labels = document.querySelectorAll('.text-\\[9px\\].font-black.text-black.mb-0\\.5.leading-tight');
  if(labels.length >= 3){
    labels[0].textContent = t.subTotal;
    labels[1].textContent = t.vatTotal;
    labels[2].textContent = t.grandTotal;
    if(labels[3]) labels[3].textContent = t.selectCustomer;
  }
  
  // Customer search
  const customerSearch = document.getElementById('customerSearch');
  if(customerSearch) customerSearch.placeholder = t.customerPlaceholder;
  
  const btnAddCustomer = document.getElementById('btnAddCustomer');
  if(btnAddCustomer) btnAddCustomer.textContent = t.newCustomer;
  
  // Summary rows
  const extraLabel = document.querySelector('#extraSummaryRow .text-\\[9px\\]');
  if(extraLabel) extraLabel.textContent = t.extra;
  
  const discountLabel = document.getElementById('discountLabel');
  if(discountLabel) discountLabel.textContent = t.discount;
  
  const afterDiscountLabel = document.querySelector('#afterDiscountRow .text-\\[9px\\]');
  if(afterDiscountLabel) afterDiscountLabel.textContent = t.afterDiscount;
  
  const tobaccoFeeLabel = document.querySelector('#tobaccoFeeRow .text-\\[9px\\]');
  if(tobaccoFeeLabel) tobaccoFeeLabel.textContent = t.tobaccoFee;
  
  const pmCurrent = document.getElementById('paymentMethod')?.value;
  const isMixedCurrent = pmCurrent === 'mixed';
  const fieldLabels = document.querySelectorAll('.field-label');
  fieldLabels.forEach(label => {
    const forAttr = label.getAttribute('for');
    if(forAttr === 'paymentMethod') label.textContent = t.paymentMethod;
    else if(forAttr === 'cashReceived') label.textContent = isMixedCurrent ? (t.cashReceivedMixedLabel || 'المدفوع كاش') : t.cashReceived;
    else if(forAttr === 'remainingBeforePrint') label.textContent = isMixedCurrent ? (t.remainingBeforePrintMixedLabel || 'المدفوع شبكة') : t.remainingBeforePrint;
    else if(forAttr === 'extraValue') label.textContent = t.extraValue;
    else if(forAttr === 'discountType') label.textContent = t.discountType;
    else if(forAttr === 'discountValue') label.textContent = t.discountValue;
    else if(forAttr === 'couponCode') label.textContent = t.coupon;
    else if(forAttr === 'driverSelect') label.textContent = t.driver;
    else if(forAttr === 'orderTypeSelect') label.textContent = t.orderType;
    else if(forAttr === 'notes') label.textContent = t.notes;
  });
  
  // Input placeholders
  const cashReceivedInput = document.getElementById('cashReceived');
  if(cashReceivedInput) cashReceivedInput.placeholder = t.cashReceivedPlaceholder;
  
  const remainingBeforePrintInput = document.getElementById('remainingBeforePrint');
  if(remainingBeforePrintInput) remainingBeforePrintInput.placeholder = t.remainingBeforePrintPlaceholder;

  const extraValueInput = document.getElementById('extraValue');
  if(extraValueInput) extraValueInput.placeholder = t.extraPlaceholder;
  
  const discountValueInput = document.getElementById('discountValue');
  if(discountValueInput) discountValueInput.placeholder = t.discountPlaceholder;
  
  const couponCodeInput = document.getElementById('couponCode');
  if(couponCodeInput) couponCodeInput.placeholder = t.couponPlaceholder;
  
  const notesInput = document.getElementById('notes');
  if(notesInput) notesInput.placeholder = t.notesPlaceholder;
  
  // Discount type options
  const discountTypeSelect = document.getElementById('discountType');
  if(discountTypeSelect && discountTypeSelect.options.length >= 3){
    discountTypeSelect.options[0].text = t.noDiscount;
    discountTypeSelect.options[1].text = t.percentDiscount;
    discountTypeSelect.options[2].text = t.amountDiscount;
  }
  
  // Driver select
  const driverSelect = document.getElementById('driverSelect');
  if(driverSelect && driverSelect.options.length > 0){
    driverSelect.options[0].text = t.noDriver;
  }
  
  // Order Type select
  const orderTypeSelect = document.getElementById('orderTypeSelect');
  if(orderTypeSelect && orderTypeSelect.options.length >= 4){
    orderTypeSelect.options[0].text = t.selectOrderType;
    orderTypeSelect.options[1].text = t.safari;
    orderTypeSelect.options[2].text = t.local;
    orderTypeSelect.options[3].text = t.delivery;
  }
  
  // Modal: Add Customer
  const addCustomerModalHeader = document.querySelector('#addCustomerModal header');
  if(addCustomerModalHeader) addCustomerModalHeader.textContent = t.addCustomerTitle;
  
  const modalLabels = document.querySelectorAll('#addCustomerModal label');
  modalLabels.forEach(label => {
    const text = label.textContent.trim();
    if(text.includes('اسم العميل')) label.childNodes[0].textContent = t.customerName;
    else if(text.includes('رقم الجوال')) label.childNodes[0].textContent = t.phone;
    else if(text.includes('البريد')) label.childNodes[0].textContent = t.email;
    else if(text.includes('العنوان') && !text.includes('الوطني')) label.childNodes[0].textContent = t.address;
    else if(text.includes('الرقم الضريبي')) label.childNodes[0].textContent = t.vatNumber;
    else if(text.includes('السجل التجاري')) label.childNodes[0].textContent = t.crNumber;
    else if(text.includes('العنوان الوطني')) label.childNodes[0].textContent = t.nationalAddress;
    else if(text.includes('ملاحظات')) label.textContent = t.additionalNotes;
  });
  
  const acmName = document.getElementById('acmName');
  if(acmName) acmName.placeholder = t.customerNamePlaceholder;
  
  const acmPhone = document.getElementById('acmPhone');
  if(acmPhone) acmPhone.placeholder = t.phonePlaceholder;
  
  const acmEmail = document.getElementById('acmEmail');
  if(acmEmail) acmEmail.placeholder = t.emailPlaceholder;
  
  const acmAddress = document.getElementById('acmAddress');
  if(acmAddress) acmAddress.placeholder = t.addressPlaceholder;
  
  const acmVat = document.getElementById('acmVat');
  if(acmVat) acmVat.placeholder = t.vatNumberPlaceholder;
  
  const acmCr = document.getElementById('acmCr');
  if(acmCr) acmCr.placeholder = t.crNumberPlaceholder;
  
  const acmNataddr = document.getElementById('acmNataddr');
  if(acmNataddr) acmNataddr.placeholder = t.nationalAddressPlaceholder;
  
  const acmNotes = document.getElementById('acmNotes');
  if(acmNotes) acmNotes.placeholder = t.additionalNotesPlaceholder;
  
  const acmCancel = document.getElementById('acmCancel');
  if(acmCancel) acmCancel.textContent = t.cancel;
  
  const acmSave = document.getElementById('acmSave');
  if(acmSave) acmSave.textContent = t.saveData;
  
  // Confirm dialog
  const confirmClearHead = document.querySelector('#confirmClear .head span:last-child');
  if(confirmClearHead) confirmClearHead.textContent = t.confirmClearTitle;
  
  const confirmClearBody = document.querySelector('#confirmClear .body');
  if(confirmClearBody) confirmClearBody.textContent = t.confirmClearMessage;
  
  const confirmYes = document.getElementById('confirmYes');
  if(confirmYes) confirmYes.textContent = t.yes;
  
  const confirmNo = document.getElementById('confirmNo');
  if(confirmNo) confirmNo.textContent = t.no;
  
  // Low stock banner
  const lowStockText = document.querySelector('#lowStockTitle .text');
  if(lowStockText) lowStockText.textContent = t.lowStockWarning;

  // Catalog loading text
  const catalogLoaderText = document.getElementById('catalogLoaderText');
  if(catalogLoaderText) catalogLoaderText.textContent = t.loading;

  // Page title
  document.title = isAr ? 'فاتورة جديدة - POS SA' : 'New Invoice - POS SA';

  // Payment method options (update labels if already rendered)
  try{
    const pmSelect = document.getElementById('paymentMethod');
    if(pmSelect){
      const payLabels = { cash: t.payMethodCash, card: t.payMethodCard, credit: t.payMethodCredit, mixed: t.payMethodMixed, tamara: t.payMethodTamara, tabby: t.payMethodTabby };
      Array.from(pmSelect.options).forEach(opt => {
        if(payLabels[opt.value]) opt.textContent = payLabels[opt.value];
      });
    }
  }catch(_){ }

  // Update cashReceived placeholder based on current payment method
  try{
    const pmEl = document.getElementById('paymentMethod');
    const crEl = document.getElementById('cashReceived');
    if(pmEl && crEl){
      if(pmEl.value === 'mixed'){
        crEl.placeholder = t.cashReceivedMixed;
      } else if(pmEl.value === 'credit'){
        crEl.placeholder = t.cashReceivedCredit;
      } else if(pmEl.value === 'card' || pmEl.value === 'tamara' || pmEl.value === 'tabby'){
        crEl.placeholder = t.cashReceivedLocked;
      } else {
        crEl.placeholder = t.cashReceivedDefault;
      }
    }
  }catch(_){ }

  // Persist language
  try{ localStorage.setItem(__langKey, base); }catch(_){ }
}

// Initialize language
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
  // Listen for language changes from other windows
  try{
    window.api.app_on_locale_changed((L)=>{
      __applyLang(L);
    });
  }catch(_){ }
})();

// Permissions helper: read from localStorage once
let __perms = [];
try{ __perms = JSON.parse(localStorage.getItem('pos_perms')||'[]') || []; }catch(_){ __perms = []; }
function can(key){ return __perms.includes('sales') && (__perms.includes(key) || !key.includes('.')); }

const errorDiv = document.getElementById('error');
const barcode = null; // تم إزالة خانة الباركود
const btnScan = null; // تم إزالة زر الإضافة المرتبط بالباركود
const btnRefresh = null; // تم إخفاء زر التحديث
const typeTabs = document.getElementById('typeTabs');
const catalog = document.getElementById('catalog');
const tbody = document.getElementById('tbody');

// Virtual Scrolling state
const __virtualScrolling = {
  enabled: true,
  itemHeight: 140, // تقريبي: 85px صورة + meta
  itemWidth: 90,
  visibleItems: [],
  allItems: [],
  renderBuffer: 10, // عدد العناصر الإضافية للـ buffer
  scrollContainer: null,
  lastScrollTop: 0,
  scrollTimeout: null
};

// Sprite Sheet state
const __spriteSheet = {
  enabled: false,
  data: null,
  loaded: false
};

// تم إزالة جميع أنواع الكاش - القراءة المباشرة من قاعدة البيانات فقط

// Load sprite sheet for optimized image rendering
async function loadSpriteSheet(){
  if(__spriteSheet.loaded || __spriteSheet.loading) return;
  __spriteSheet.loading = true;
  
  try{
    const res = await window.api.sprite_get();
    if(res && res.ok && res.data){
      __spriteSheet.data = res.data;
      __spriteSheet.enabled = true;
      __spriteSheet.loaded = true;
    } else {
      // Try to generate if not exists
      const genRes = await window.api.sprite_generate();
      if(genRes && genRes.ok && genRes.data){
        __spriteSheet.data = genRes.data;
        __spriteSheet.enabled = true;
        __spriteSheet.loaded = true;
      }
    }
  }catch(e){
    console.error('Failed to load sprite sheet', e);
  } finally {
    __spriteSheet.loading = false;
  }
}

// Low-stock banner elements
const lowStockBanner = document.getElementById('lowStockBanner');
const lowStockList = document.getElementById('lowStockList');
const lowStockTitle = document.getElementById('lowStockTitle');
const salesToast = document.getElementById('salesToast');
// عناصر معالجة الفاتورة السابقة
const processInvoiceNoEl = document.getElementById('processInvoiceNo');
const btnProcessInvoice = document.getElementById('btnProcessInvoice');
const btnProcessFull = document.getElementById('btnProcessFull');
let __processedSaleId = null; // لتخزين معرف الفاتورة المُعالجة

const subTotalEl = document.getElementById('subTotal');
const vatTotalEl = document.getElementById('vatTotal');
const grandTotalEl = document.getElementById('grandTotal');
const discountTypeEl = document.getElementById('discountType');
const discountValueEl = document.getElementById('discountValue');
const extraValueEl = document.getElementById('extraValue');
const discountAmountEl = document.getElementById('discountAmount');
const discountLabelEl = document.getElementById('discountLabel');
const discountSummaryRowEl = document.getElementById('discountSummaryRow');
const afterDiscountEl = document.getElementById('afterDiscount');
const afterDiscountRowEl = document.getElementById('afterDiscountRow');
// Summary row for Extra (before tax)
const extraSummaryRowEl = document.getElementById('extraSummaryRow');
const extraAmountEl = document.getElementById('extraAmount');

const paymentMethod = document.getElementById('paymentMethod');
const cashReceived = document.getElementById('cashReceived');
const remainingBeforePrint = document.getElementById('remainingBeforePrint');
// Coupon controls
const couponCodeEl = document.getElementById('couponCode');
const applyCouponBtn = null; // زر التطبيق لم يعد مستخدمًا
const couponInfoEl = document.getElementById('couponInfo');
let __coupon = null; // { code, mode, value, amount }
let __globalOffer = null; // { mode, value }

function applyPaymentFieldState(){
  if(!paymentMethod) return;
  const method = String(paymentMethod.value || 'cash').toLowerCase();
  const cashLabelEl = document.querySelector('label[for="cashReceived"]');
  const remainingLabelEl = document.querySelector('label[for="remainingBeforePrint"]');

  if(cashLabelEl){
    cashLabelEl.textContent = (method === 'mixed')
      ? (__currentLang.cashReceivedMixedLabel || 'المدفوع كاش')
      : (__currentLang.cashReceived || 'المبلغ المدفوع');
  }
  if(remainingLabelEl){
    remainingLabelEl.textContent = (method === 'mixed')
      ? (__currentLang.remainingBeforePrintMixedLabel || 'المدفوع شبكة')
      : (__currentLang.remainingBeforePrint || 'المبلغ المتبقي');
  }

  if(!cashReceived) return;
  if(method === 'mixed'){
    cashReceived.disabled = false;
    cashReceived.placeholder = (__currentLang.cashReceivedMixed || 'المبلغ النقدي (مختلط)');
  } else if(method === 'credit' || method === 'card' || method === 'tamara' || method === 'tabby'){
    cashReceived.value = '';
    cashReceived.disabled = true;
    cashReceived.placeholder = (method === 'credit')
      ? (__currentLang.cashReceivedCredit || 'المبلغ المدفوع (آجل)')
      : (__currentLang.cashReceivedLocked || 'غير قابل للإدخال لهذه الطريقة');
  } else {
    cashReceived.disabled = false;
    cashReceived.placeholder = (__currentLang.cashReceivedDefault || 'المبلغ المدفوع');
  }
}

function updateRemainingBeforePrint(){
  if(!remainingBeforePrint) return;
  const total = Number(window.__sale_calcs?.grand_total || 0);
  const pm = String(paymentMethod?.value || 'cash').toLowerCase();
  const cashStr = String(cashReceived?.value || '').trim();
  const entered = Number(cashStr);
  const safeEntered = (cashStr === '' || isNaN(entered) || entered < 0) ? 0 : entered;
  let remaining = 0;

  if(pm === 'credit'){
    remaining = total;
  } else if(pm === 'card' || pm === 'network' || pm === 'tamara' || pm === 'tabby'){
    remaining = 0;
  } else {
    remaining = cashStr === '' ? 0 : Math.abs(safeEntered - total);
  }

  remainingBeforePrint.value = Number(remaining || 0).toFixed(2);
  remainingBeforePrint.classList.toggle('remaining-zero', remaining <= 0.0001);
  remainingBeforePrint.classList.toggle('remaining-due', remaining > 0.0001);
}

if(cashReceived){
  cashReceived.addEventListener('input', () => {
    const s = (cashReceived.value||'').trim();
    if(s === ''){ setError(''); updateRemainingBeforePrint(); if(__currentRoomId){ __saveRoomCart(__currentRoomId, cart); } return; }
    const val = Number(s);
    if(isNaN(val) || val < 0){ setError(__currentLang.invalidAmount || 'قيمة غير صحيحة للمبلغ المدفوع'); updateRemainingBeforePrint(); return; }
    setError('');
    updateRemainingBeforePrint();
    if(__currentRoomId){ __saveRoomCart(__currentRoomId, cart); }
  });
}
const customerDropdown = document.getElementById('customerDropdown');
const customerSearch = document.getElementById('customerSearch');
const customerList = document.getElementById('customerList');
let __allCustomers = []; // cache for filtering
let __selectedCustomerId = '';

// Drivers dropdown (select)
const driverSelect = document.getElementById('driverSelect');
const driverMeta = document.getElementById('driverMeta');
let __allDrivers = []; // cache
let __selectedDriverId = '';

// Order Type dropdown (select)
const orderTypeSelect = document.getElementById('orderTypeSelect');

// const customerName = document.getElementById('customerName'); // أزلنا الإدخال اليدوي للاسم
const notes = document.getElementById('notes');
const btnPay = document.getElementById('btnPay');
const btnClear = document.getElementById('btnClear');
const btnAddCustomer = document.getElementById('btnAddCustomer');

// أعلى الصفحة: أزرار مثبتة تنفذ نفس إجراءات الأزرار السفلية
const btnPayTop = document.getElementById('btnPayTop');
const btnKitchenTop = document.getElementById('btnKitchenTop');
const btnClearTop = document.getElementById('btnClearTop');
if(btnPayTop){ if(!__perms.includes('sales.print')) btnPayTop.style.display='none'; btnPayTop.addEventListener('click', ()=>{ document.getElementById('btnPay')?.click(); }); btnPayTop.title = (__currentLang.shortcutF1 || 'اختصار: F1'); }
const btnZatcaSendTop = document.getElementById('btnZatcaSendTop');
if(btnZatcaSendTop){ if(!__perms.includes('sales.print')) btnZatcaSendTop.style.display='none'; btnZatcaSendTop.addEventListener('click', async ()=>{
  try{
    const v = prompt(__currentLang.zatcaEnterInvoice || 'أدخل رقم الفاتورة لإرسالها للهيئة:');
    if(!v) return;
    const r = await window.zatcaSendByInvoiceNo(v);
    alert(r.ok ? ((__currentLang.sendSuccess || 'تم الإرسال بنجاح') + '\n' + (r.message||'')) : ((__currentLang.sendFailed || 'فشل الإرسال') + '\n' + (r.error||'')));
  }catch(e){ alert((__currentLang.sendError || 'تعذر الإرسال') + ': ' + (e?.message||String(e))); }
}); }

// Helper: resolve invoice_no -> sale_id then submit via local bridge
window.zatcaSendByInvoiceNo = async function(invoiceNo){
  const inv = String(invoiceNo||'').trim();
  if(!inv) return { ok:false, error:(__currentLang.zatcaInvoiceRequired || 'رقم الفاتورة مطلوب') };
  try{
    // Try to fetch by search; backend prioritizes invoice matching on q
    const r = await window.api.sales_list({ q: inv });
    if(!r || !r.ok) return { ok:false, error: r?.error || (__currentLang.zatcaSearchFailed || 'تعذر البحث عن الفاتورة') };
    const items = Array.isArray(r.items) ? r.items : [];
    // Prefer exact match on invoice_no; fallback to first
    const row = items.find(x => String(x.invoice_no) === inv) || items[0];
    if(!row) return { ok:false, error:(__currentLang.zatcaInvoiceNotFound || 'لم يتم العثور على فاتورة بهذا الرقم') };
    const resp = await window.electronAPI.localZatca.submitBySaleId(Number(row.id));
    if(resp && resp.success){
      const msg = (typeof resp.data === 'string') ? resp.data : JSON.stringify(resp.data);
      return { ok:true, message: msg };
    } else {
      const detail = (resp && (resp.message || resp.error || resp.data)) || (__currentLang.sendFailed || 'فشل الإرسال');
      return { ok:false, error: typeof detail==='string' ? detail : JSON.stringify(detail) };
    }
  }catch(e){
    // Show richer error if available (from preload)
    const msg = e && e.message || String(e);
    return { ok:false, error: msg };
  }
};

if(btnKitchenTop){ if(!__perms.includes('sales.kitchen')) btnKitchenTop.style.display='none'; btnKitchenTop.addEventListener('click', ()=>{ document.getElementById('btnKitchen')?.click(); }); }
if(btnClearTop){ if(!__perms.includes('sales.clear')) btnClearTop.style.display='none'; btnClearTop.addEventListener('click', ()=>{ document.getElementById('btnClear')?.click(); }); btnClearTop.title = (__currentLang.clearCart || 'تفريغ السلة') + ' (F2)'; }

// اختصارات لوحة المفاتيح: F1 للطباعة، F2 لتفريغ السلة
window.addEventListener('keydown', (e) => {
  if(e.key === 'F1'){
    e.preventDefault();
    document.getElementById('btnPay')?.click();
  } else if(e.key === 'F2'){
    e.preventDefault();
    document.getElementById('btnClear')?.click();
  }
});

// Rooms support: parse room from URL and set header badge, and persist cart per room
const __urlParams = new URLSearchParams(location.search);
const __currentRoomId = __urlParams.get('room') || '';
let __currentRoomName = '';
async function __fetchRoomMeta(id){ try{ const r = await window.api.rooms_list(); if(r.ok){ return (r.items||[]).find(x => String(x.id)===String(id)) || null; } }catch(_){ } return null; }
async function __loadRoomCart(id){
  try{
    const r = await window.api.rooms_get_session(id);
    if(r.ok && r.session){
      const c = r.session.cart_json ? JSON.parse(r.session.cart_json||'[]') : [];
      const s = r.session.state_json ? JSON.parse(r.session.state_json||'{}') : {};
      // Restore UI state if present
      if(discountTypeEl && s.discount_type){ discountTypeEl.value = s.discount_type; }
      if(discountValueEl && typeof s.discount_value !== 'undefined'){ discountValueEl.value = String(s.discount_value); }
      if(extraValueEl && typeof s.extra_value !== 'undefined'){ extraValueEl.value = String(s.extra_value); }
      if(paymentMethod && s.payment_method){ paymentMethod.value = s.payment_method; }
      if(cashReceived && typeof s.cash_received !== 'undefined' && s.cash_received !== null){ cashReceived.value = String(s.cash_received); }
      if(notes && typeof s.notes === 'string'){ notes.value = s.notes; }
      if(typeof s.customer_id !== 'undefined' && s.customer_id){ __selectedCustomerId = String(s.customer_id); }
      if(typeof s.driver_id !== 'undefined' && s.driver_id){ __selectedDriverId = String(s.driver_id); }
      if(orderTypeSelect && typeof s.order_type === 'string'){ orderTypeSelect.value = s.order_type; }
      return Array.isArray(c) ? c : [];
    }
  }catch(_){ }
  return [];
}
async function __saveRoomCart(id, c){
  try{
    const cashVal = (cashReceived && (cashReceived.value||'').trim() !== '') ? Number(cashReceived.value||0) : null;
    const state = {
      discount_type: discountTypeEl ? discountTypeEl.value : 'none',
      discount_value: discountValueEl ? Number(discountValueEl.value||0) : 0,
      extra_value: extraValueEl ? Number(extraValueEl.value||0) : 0,
      payment_method: paymentMethod ? paymentMethod.value : 'cash',
      cash_received: cashVal,
      notes: notes ? (notes.value||'') : '',
      customer_id: __selectedCustomerId ? Number(__selectedCustomerId) : null,
      driver_id: __selectedDriverId ? Number(__selectedDriverId) : null,
      order_type: orderTypeSelect ? (orderTypeSelect.value||'') : '',
    };
    await window.api.rooms_save_cart(id, c, state);
  }catch(_){ }
}
async function __clearRoomSession(id){ try{ await window.api.rooms_clear(id); }catch(_){ } }
(async () => {
  // ربط أزرار التنقل وعرض زر الغرف فقط عند العمل ضمن غرفة
  const nav = document.querySelector('header nav');
  if(nav){
    const btnRooms = document.getElementById('btnBackRooms');
    const btnHome = document.getElementById('btnBackHome');
    if(btnHome){ btnHome.onclick = ()=>{ window.location.href='../main/index.html'; }; }
    if(!__currentRoomId){
      if(btnRooms){ btnRooms.style.display = 'none'; }
      // Hide kitchen send buttons when not in a room context
      try{ const k1 = document.getElementById('btnKitchenTop'); if(k1){ k1.style.display='none'; } }catch(_){ }
      try{ const k2 = document.getElementById('btnKitchen'); if(k2){ k2.style.display='none'; } }catch(_){ }
    }
  }

  // زر معالجة الفاتورة السابقة
  if(btnProcessInvoice){
    // Hide if no permission
    if(!__perms.includes('sales.process_invoice')){ btnProcessInvoice.style.display='none'; if(processInvoiceNoEl) processInvoiceNoEl.style.display='none'; }
    btnProcessInvoice.addEventListener('click', async () => {
      const v = processInvoiceNoEl ? processInvoiceNoEl.value : '';
      // تحقق أولاً هل سبق معالجتها
      try{
        const chk = await window.api.sales_has_credit_for_invoice({ invoice_no: v });
        if(chk && chk.ok){
          if(chk.credit_unpaid){
            showToast('⚠️ ' + (__currentLang.creditUnpaid || 'هذه فاتورة آجل غير مسددة ولا يمكن عمل معالجة لها قبل السداد'), 'warning', 5000);
            return;
          }
          if(chk.processed){
            showToast('⚠️ ' + (__currentLang.alreadyProcessed || 'تم عمل معالجة لهذه الفاتورة من قبل'), 'warning', 4000);
            return;
          }
        }
      }catch(_){ /* ignore */ }
      await loadInvoiceIntoCartByNumber(v);
    });
  }
  if(processInvoiceNoEl){
    processInvoiceNoEl.addEventListener('keydown', (e) => { if(e.key==='Enter'){ e.preventDefault(); btnProcessInvoice?.click(); } });
  }
  if(btnProcessFull){
    btnProcessFull.addEventListener('click', async () => {
      if(!__processedSaleId){ showToast('⚠️ ' + (__currentLang.noProcessedInvoice || 'لا توجد فاتورة مُعالجة'), 'warning', 3000); return; }
      try{
        const r = await window.api.sales_refund_full({ sale_id: __processedSaleId });
        if(!r || !r.ok){ showToast(`❌ ${r?.error||(__currentLang.cannotProcessFull || 'تعذر معالجة كامل الفاتورة')}`, 'error', 5000); return; }
        showToast('✅ ' + (__currentLang.creditNoteCreated || 'تم إنشاء إشعار دائن وإرجاع المخزون بنجاح'), 'success', 4000);
        // افتح نافذة الطباعة مباشرة لإشعار الدائن الجديد
        try{
          const page = 'print.html'; // A4 removed
          const creditCopies = Math.max(1, Number(settings.print_copies || (settings.print_two_copies ? 2 : 1)));
          const params = new URLSearchParams({ id: String(r.credit_sale_id), pay: String(r.base_payment_method||''), base: String(r.base_sale_id||''), base_no: String(r.base_invoice_no||'') });
          if(creditCopies > 1){ params.set('copies', String(creditCopies)); }
          const w = 500;
          const h = 700;
          // افتح المعاينة مع تمرير رقم الفاتورة الأساسية
          window.open(`../sales/${page}?${params.toString()}`, 'PRINT_VIEW', `width=${w},height=${h},menubar=no,toolbar=no,location=no,status=no`);
          // إذا كانت الطباعة الصامتة مفعلة سيتم استدعاء الطباعة الخلفية من داخل print.html مع تمرير base/base_no
        }catch(_){ /* ignore */ }
        // بعد فتح الطباعة، أعد شاشة فاتورة جديدة إلى حالتها (تفريغ السلة وتمكين الحقول)
        try{
          cart = []; renderCart();
          // إعادة حالة المعالجة وإظهار عناصر الواجهة
          setProcessingMode(false);
          // تفريغ خانة معالجة الفاتورة وإعادة ضبط الحالة
          try{ if(processInvoiceNoEl){ processInvoiceNoEl.value=''; } }catch(_){ }
          __processedSaleId = null;
          // إعادة طريقة الدفع إلى الافتراضي
          try{
            const methods = Array.isArray(settings.payment_methods) && settings.payment_methods.length ? settings.payment_methods : ['cash'];
            if(settings.default_payment_method && methods.includes(settings.default_payment_method)){
              paymentMethod.value = settings.default_payment_method;
            } else { paymentMethod.value = methods[0]; }
          }catch(_){ }
          // تفريغ الحقول الأخرى
          if(cashReceived){ cashReceived.value=''; cashReceived.placeholder=(__currentLang.cashReceivedDefault||'المبلغ المدفوع'); cashReceived.disabled=false; }
          if(discountTypeEl){ discountTypeEl.value='none'; }
          if(discountValueEl){ discountValueEl.value=''; }
          if(extraValueEl){ extraValueEl.value=''; }
          if(notes){ notes.value=''; }
          __selectedCustomerId = '';
          __selectedDriverId = '';
          try{ customerSearch.value=''; customerList.style.display='none'; if(driverSelect){ driverSelect.value=''; } }catch(_){ }
          if(__currentRoomId){ await __saveRoomCart(__currentRoomId, cart); try{ await window.api.rooms_set_status(__currentRoomId, 'vacant'); }catch(_){ } }
        }catch(_){ }
      }catch(e){ console.error(e); showToast('❌ ' + (__currentLang.cannotProcessFull || 'تعذر معالجة كامل الفاتورة'), 'error', 5000); }
    });
  }

  if(__currentRoomId){
    const meta = await __fetchRoomMeta(__currentRoomId);
    __currentRoomName = meta ? meta.name : ((__currentLang.roomPrefix || 'غرفة #') + __currentRoomId);
    // تم إزالة تحديث عنوان الزر لإبقاء نص "طباعة الفاتورة" فقط
    if(nav){
      const btnRooms = document.getElementById('btnBackRooms');
      if(btnRooms){ btnRooms.style.display = ''; btnRooms.onclick = ()=>{ window.location.href='../rooms/index.html'; }; }
    }
    const savedCart = await __loadRoomCart(__currentRoomId);
    if(Array.isArray(savedCart) && savedCart.length){ 
      cart = savedCart;
      const productIds = cart.map(it => it.id).filter((id, i, arr) => arr.indexOf(id) === i);
      if(productIds.length){
        try{
          const opsMap = await fetchProductOpsBatch(productIds);
          cart.forEach(it => {
            if(opsMap[it.id]){
              it.__ops = opsMap[it.id];
              it.__opsLoaded = true;
            }
          });
        }catch(_){ }
      }
      renderCart(); 
    }
  }
  // تحديث خانة بيانات السائق لتكون جاهزة للعرض
  try{
    if(driverMeta){
      driverMeta.textContent = (__currentLang.driverNotSelected || 'لم يتم تحديد سائق بعد');
      driverMeta.style.display = 'flex';
      driverMeta.style.justifyContent = 'flex-start';
    }
  }catch(_){ }
  // طبّق إخفاء/تعطيل العناصر بحسب الصلاحيات الفرعية قبل أي تهيئة أخرى
  try{
    const need = [
      { sel: '#btnPayTop', key: 'sales.print' },
      { sel: '#btnKitchenTop', key: 'sales.kitchen' },
      { sel: '#btnClearTop', key: 'sales.clear' },
      { sel: '#btnProcessInvoice', key: 'sales.process_invoice' },
      { sel: '#discountType', key: 'sales.discount' },
      { sel: '#discountValue', key: 'sales.discount' },
      { sel: '#extraValue', key: 'sales.extra' },
      { sel: '#couponCode', key: 'sales.coupon' },
    ];
    need.forEach(({ sel, key }) => {
      const el = document.querySelector(sel);
      if(!el) return;
      if(!( __perms.includes('sales') && __perms.includes(key) )){
        // أخفِ العنصر بالكامل: إذا كان داخل حاوية .controls أخفِ الحاوية حتى تختفي التسمية أيضاً
        const container = el.closest('.controls');
        if(container){ container.style.display = 'none'; }
        else { el.style.display = 'none'; }
      }
    });
  }catch(_){ }

  // اجلب الإعدادات لتعبئة إعدادات العملة/الضرائب ورسوم التبغ
  try{
    const st = await window.api.settings_get();
    if(st && st.ok && st.item){
      const it = st.item;
      settings.vat_percent = Number.isFinite(Number(it.vat_percent)) ? Number(it.vat_percent) : 15;
      settings.prices_include_vat = it.prices_include_vat ? 1 : 0;
      settings.currency_code = it.currency_code || settings.currency_code;
      // استبدل الرمز القديم ﷼ بحرف الرمز الجديد المخصص \ue900 إن وُجد
      const sym = (it.currency_symbol || settings.currency_symbol || '').trim();
      settings.currency_symbol = (sym === '﷼' || sym === 'SAR' || sym === 'ريال' || sym === 'ر.س' || sym.includes('ريال')) ? '\ue900' : sym;
      settings.currency_symbol_position = (it.currency_symbol_position==='before' ? 'before' : 'after');
      const pm = Array.isArray(it.payment_methods) ? it.payment_methods : [];
      settings.payment_methods = pm.length ? pm : settings.payment_methods;
      // قيم افتراضية لرسوم التبغ إذا لم تُخزن بعد في الإعدادات
      settings.tobacco_fee_percent = Number(it.tobacco_fee_percent ?? settings.tobacco_fee_percent ?? 100);
      settings.tobacco_min_fee_amount = Number(it.tobacco_min_fee_amount ?? settings.tobacco_min_fee_amount ?? 25);
      // سلوك السلة: فصل تكرار نفس الصنف كسطر جديد
      settings.cart_separate_duplicate_lines = it.cart_separate_duplicate_lines ? 1 : 0;
      // إظهار/إخفاء تنبيه انخفاض المخزون: إذا لم يكن محددًا بالإعدادات المخزنة، الافتراضي التفعيل ليتماشى مع شاشة الإعدادات
      settings.show_low_stock_alerts = (typeof it.show_low_stock_alerts === 'undefined') ? true : !!it.show_low_stock_alerts;
      // عتبة تنبيه انخفاض المخزون
      settings.low_stock_threshold = Number(it.low_stock_threshold ?? settings.low_stock_threshold ?? 5);
      // عبئ خيارات الدفع في الواجهة
      if(paymentMethod){
        paymentMethod.innerHTML='';
        const methods = settings.payment_methods;
        methods.forEach(m => {
          const opt = document.createElement('option'); opt.value=m; opt.textContent=({cash:(__currentLang.payMethodCash||'كاش'), card:(__currentLang.payMethodCard||'شبكة'), credit:(__currentLang.payMethodCredit||'آجل'), mixed:(__currentLang.payMethodMixed||'مختلط'), tamara:(__currentLang.payMethodTamara||'تمارا'), tabby:(__currentLang.payMethodTabby||'تابي')})[m] || m; paymentMethod.appendChild(opt);
        });
        // اضبط الافتراضي إن وجد
        if(it.default_payment_method && methods.includes(it.default_payment_method)) paymentMethod.value = it.default_payment_method;
      }
    }
  }catch(_){ }
  // استمع لتغييرات الإعدادات القادمة من شاشة الإعدادات بدون إعادة فتح
  try{
    window.addEventListener('storage', (e) => {
      if(e && e.key === 'pos_settings_tobacco' && e.newValue){
        try{
          const ov = JSON.parse(e.newValue||'{}');
          if(typeof ov.tobacco_fee_percent !== 'undefined') settings.tobacco_fee_percent = Number(ov.tobacco_fee_percent);
          if(typeof ov.tobacco_min_fee_amount !== 'undefined') settings.tobacco_min_fee_amount = Number(ov.tobacco_min_fee_amount);
          // أعد الحساب فورًا ليظهر الأثر
          computeTotals();
        }catch(_){ }
      }
      // التقط تحديثات تنبيهات المخزون فوراً من شاشة الإعدادات
      if(e && e.key === 'pos_settings_lowstock' && e.newValue){
        try{
          const lv = JSON.parse(e.newValue||'{}');
          if(typeof lv.show_low_stock_alerts !== 'undefined') settings.show_low_stock_alerts = !!lv.show_low_stock_alerts;
          if(typeof lv.low_stock_threshold !== 'undefined') settings.low_stock_threshold = Math.max(0, Number(lv.low_stock_threshold));
          // إذا تم إيقاف التنبيهات، أخفِ الشريط فورًا وألغِ أي مؤقّتات وأي عرض لاحق
          try{
            if(settings.show_low_stock_alerts === false){
              __lowStockEpoch++; // invalidate pending banners
              if(__lowStockTimer){ clearTimeout(__lowStockTimer); __lowStockTimer = null; }
              if(lowStockBanner){ lowStockBanner.style.display='none'; lowStockBanner.classList.remove('show'); }
              if(lowStockList){ lowStockList.innerHTML=''; }
            }
          }catch(_){ }
        }catch(_){ }
      }
    });
  }catch(_){ }
})();
window.addEventListener('beforeunload', ()=>{ if(__currentRoomId){ __saveRoomCart(__currentRoomId, cart); } });

// Modal elements
const acmBackdrop = document.getElementById('addCustomerModal');
const acmCancel = document.getElementById('acmCancel');
const acmSave = document.getElementById('acmSave');
const acmName = document.getElementById('acmName');
const acmPhone = document.getElementById('acmPhone');
const acmEmail = document.getElementById('acmEmail');
const acmAddress = document.getElementById('acmAddress');
const acmVat = document.getElementById('acmVat');
const acmCr = document.getElementById('acmCr');
const acmNataddr = document.getElementById('acmNataddr');
const acmNotes = document.getElementById('acmNotes');

// Restrict phone, VAT, and CR fields to numbers only
[acmPhone, acmVat, acmCr].forEach(field => {
  if(field){
    field.addEventListener('input', function(e){
      this.value = this.value.replace(/[^0-9+]/g, '');
    });
    field.addEventListener('keypress', function(e){
      if(!/[0-9+]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Tab'){
        e.preventDefault();
      }
    });
  }
});

// Toast Notification System
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if(!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <div class="toast-message">${message}</div>
  `;
  
  container.appendChild(toast);
  
  // إزالة بعد المدة المحددة بدون تأثيرات
  setTimeout(() => {
    if(toast.parentNode === container) {
      container.removeChild(toast);
    }
  }, duration);
}

let settings = { vat_percent: 15, prices_include_vat: 1, currency_code: 'SAR', currency_symbol:'\ue900', currency_symbol_position:'after', payment_methods: ['cash','card','mixed'], op_price_manual: 0, tobacco_fee_percent: 100, tobacco_min_invoice_sub: 25, tobacco_min_fee_amount: 25, low_stock_threshold: 5, show_low_stock_alerts: false, show_item_desc: true, hide_item_description: false };
let cart = []; // {id, name, price, qty, image_path}
let activeTypes = new Set(); // أسماء الأنواع الرئيسية النشطة فقط
let __isProcessingOld = false; // قفل الشاشة أثناء معالجة فاتورة سابقة

function setError(msg){ errorDiv.textContent = msg || ''; }

// Small warning toast in top-right (same area as low-stock)
let __salesToastTimer = null;
function __showSalesToast(message, opts){
  try{
    if(!salesToast) return;
    const icon = (opts && opts.icon) || '⚠️';
    const danger = !!(opts && opts.danger);
    const box = document.createElement('div');
    box.className = 'toast-box' + (danger ? ' danger' : '');
    box.innerHTML = `<span class="icon">${icon}</span><span class="text">${String(message||'')}</span>`;
    salesToast.innerHTML = '';
    salesToast.appendChild(box);
    salesToast.style.display = 'block';
    if(__salesToastTimer){ clearTimeout(__salesToastTimer); }
    const ms = Math.max(1000, Number(opts && opts.ms || 3000)); // تقليل الوقت
    __salesToastTimer = setTimeout(()=>{ try{ salesToast.style.display='none'; salesToast.innerHTML=''; }catch(_){ } }, ms);
  }catch(_){ }
}

// تفعيل/تعطيل عناصر الواجهة عند المعالجة
function setProcessingMode(on){
  __isProcessingOld = !!on;
  const all = Array.from(document.querySelectorAll('input, select, textarea, button'));
  if(on){
    // قفل كل العناصر
    all.forEach(el => { el.disabled = true; });
    // اسمح فقط بحقل رقم الفاتورة وزري المعالجة + إبقاء زر الرئيسية مفعلًا
    if(processInvoiceNoEl) processInvoiceNoEl.disabled = false;
    if(btnProcessInvoice) btnProcessInvoice.disabled = false;
    if(btnProcessFull){ btnProcessFull.disabled = false; btnProcessFull.style.display = ''; }
    const btnHome = document.getElementById('btnBackHome'); if(btnHome) btnHome.disabled = false;
  } else {
    // فك القفل عن كل العناصر
    all.forEach(el => { el.disabled = false; });
    // أخفِ زر المعالجة الكاملة لأنه خاص بوضع المعالجة
    if(btnProcessFull){ btnProcessFull.style.display = 'none'; }
  }
}

async function loadInvoiceIntoCartByNumber(invNo){
  setError(''); __processedSaleId = null;
  try{
    const q = String(invNo||'').trim(); if(!q){ showToast('⚠️ ' + (__currentLang.enterInvoiceNo || 'أدخل رقم فاتورة صحيح'), 'warning', 3000); return; }
    // ابحث عن الفاتورة برقمها بدقة
    const res = await window.api.sales_list({ invoice_no: q });
    if(!res || !res.ok || !Array.isArray(res.items) || !res.items.length){ showToast('❌ ' + (__currentLang.invoiceNotFound || 'لم يتم العثور على الفاتورة'), 'error', 4000); return; }
    // اختر أول نتيجة مطابقة تمامًا إن وجدت
    const exact = res.items.find(x => String(x.invoice_no) === q) || res.items[0];
    const gid = exact.id;
    const det = await window.api.sales_get(gid);
    if(!det || !det.ok){ showToast('❌ ' + (__currentLang.failedFetchInvoice || 'تعذر جلب تفاصيل الفاتورة'), 'error', 4000); return; }
    const items = det.items||[];
    // املأ السلة من عناصر الفاتورة
    cart = items.map(it => ({
      id: Number(it.product_id),
      name: it.name,
      description: it.description || '',
      price: Number(it.price||0),
      qty: Number(it.qty||1),
      operation_id: (it.operation_id || null),
      operation_name: (it.operation_name || null),
      // Preserve tobacco flag so totals can compute tobacco fee during processing
      is_tobacco: (Number(it.is_tobacco||0) === 1)
    }));
    __processedSaleId = Number(det.sale?.id || gid);

    // عيّن الخصم والإضافى من الفاتورة الأصلية ليظهر في الملخص أثناء وضع المعالجة
    try{
      const s = det.sale || {};
      // extra (قبل الضريبة)
      if(extraValueEl){ extraValueEl.value = String(Number(s.extra_value||0)); }
      // لا تستخدم الكوبون في الوضع المقيد؛ طبّق الخصم كقيمة مباشرة أو نسبة
      let dt = String(s.discount_type||'none');
      let dv = Number(s.discount_value||0);
      const da = Number(s.discount_amount||0);
      if(dt === 'coupon'){
        dt = 'amount'; dv = da; // طبّق قيمة الكوبون كخصم نقدي مباشر
        try{ __coupon = null; if(couponInfoEl){ couponInfoEl.textContent=''; } }catch(_){ }
      }
      if(discountTypeEl){ discountTypeEl.value = (dt==='percent' || dt==='amount') ? dt : 'amount'; }
      if(discountValueEl){ discountValueEl.value = String((dt==='percent') ? dv : (dt==='amount' ? (dv||da) : 0)); }
    }catch(_){ }

    renderCart();
    // اقفل الشاشة
    setProcessingMode(true);
  }catch(e){ console.error(e); showToast('❌ ' + (__currentLang.errorDuringProcess || 'حدث خطأ أثناء المعالجة'), 'error', 5000); }
}

function fmt(amount){
  const a = Number(amount||0);
  const s = a.toFixed(2);
  return settings.currency_symbol_position === 'before'
    ? `${settings.currency_symbol} ${s}`
    : `${s} ${settings.currency_symbol}`;
}

function computeTotals(){
  let sub = 0, vat = 0, grand = 0;
  const vatPct = (Number(settings.vat_percent) || 0) / 100;

  // إجمالي قبل الضريبة (sub) من عناصر السلة
  cart.forEach(item => {
    const price = Number(item.price || 0);
    const qty = Number(item.qty || 1);
    if(settings.prices_include_vat){
      const base = price / (1 + vatPct);
      sub += base * qty;
    } else {
      sub += price * qty;
    }
  });

  // الإضافى (قبل الضريبة) — يخضع للضريبة ويُدمج مع الأساس مثل السابق
  const extra = extraValueEl ? Math.max(0, Number(extraValueEl.value||0)) : 0;
  const itemsSub = sub; // احتفظ بمجموع الأصناف فقط لاستخدامه في حد التبغ
  sub += extra; // أعد دمج الإضافى في المجموع قبل الخصم كما كان سابقًا

  // حساب المبلغ الخاضع للعرض العام (استثناء الأنواع المحددة)
  let subForGlobalOffer = sub;
  if (__globalOffer && __globalOffer.excluded_categories) {
    try {
      const excludedList = JSON.parse(__globalOffer.excluded_categories);
      if (Array.isArray(excludedList) && excludedList.length > 0) {
        // حساب مجموع الأصناف المستثناة
        let excludedSub = 0;
        cart.forEach(item => {
          if (item.category && excludedList.includes(item.category)) {
            const price = Number(item.price || 0);
            const qty = Number(item.qty || 1);
            if(settings.prices_include_vat){
              const base = price / (1 + vatPct);
              excludedSub += base * qty;
            } else {
              excludedSub += price * qty;
            }
          }
        });
        subForGlobalOffer = Math.max(0, itemsSub - excludedSub) + extra;
      }
    } catch (e) {
      console.warn('Failed to parse excluded_categories:', e);
    }
  }

  // حساب الخصم قبل الضريبة مع ضبط الحدود حتى لا يتجاوز الإجمالي 100%
  const dtype = discountTypeEl ? discountTypeEl.value : 'none';
  const dval = discountValueEl ? Number(discountValueEl.value || 0) : 0;

  // نسب الخصم
  const manualPct = (dtype === 'percent') ? Math.min(100, Math.max(0, dval)) : 0;
  const couponPct = (__coupon && String(__coupon.mode)==='percent') ? Math.max(0, Number(__coupon.value||0)) : 0;
  const offerPct  = (__globalOffer && String(__globalOffer.mode)==='percent') ? Math.max(0, Number(__globalOffer.value||0)) : 0;
  
  // حساب خصم النسبة المئوية: الخصم اليدوي والكوبون على الإجمالي الكامل، العرض العام على المبلغ المُعدّل
  const manualPercentDisc = sub * (manualPct/100);
  const couponPercentDisc = sub * (couponPct/100);
  const offerPercentDisc = subForGlobalOffer * (offerPct/100);
  const percentDiscountAmount = manualPercentDisc + couponPercentDisc + offerPercentDisc;

  // خصومات بمبالغ ثابتة
  const manualAmt = (dtype === 'amount') ? Math.max(0, Math.min(sub, Number(dval||0))) : 0;
  const couponAmt = (__coupon && String(__coupon.mode)!=='percent') ? Math.max(0, Math.min(sub, Number(__coupon.value||0))) : 0;
  const offerAmt  = (__globalOffer && String(__globalOffer.mode)!=='percent') ? Math.max(0, Math.min(subForGlobalOffer, Number(__globalOffer.value||0))) : 0;

  // إجمالي الخصم لا يتجاوز قيمة المجموع الفرعي
  const totalDiscount = Math.min(sub, Number((percentDiscountAmount + manualAmt + couponAmt + offerAmt).toFixed(2)));
  const itemsSubAfterDiscount = Math.max(0, itemsSub - (totalDiscount * (itemsSub>0 ? (itemsSub/sub) : 0))); // خصم جزء من الإضافى لا يؤثر على شرط 25
  let subAfterDiscount = Math.max(0, sub - totalDiscount); // بعد الخصم على الأصناف + الإضافى

  // قيم إرشادية للتسمية (لا تؤثر على الإجمالي بعد التقيد بنسبة 100%)
  let couponAmount = 0; let couponLabel = '';
  if(__coupon){
    if(String(__coupon.mode) === 'percent'){
      couponAmount = sub * (Math.max(0, Number(__coupon.value||0))/100);
      couponLabel = `${Math.round(Number(__coupon.value||0))}%`;
    } else {
      couponAmount = Math.min(sub, Number(__coupon.value||0));
      const v = Number(__coupon.value||0);
      couponLabel = `${Number.isInteger(v) ? v : v.toFixed(2)}`;
    }
  }
  let offerAmount = 0; let offerLabel = '';
  if(__globalOffer){
    if(String(__globalOffer.mode) === 'percent'){
      offerAmount = subForGlobalOffer * (Math.max(0, Number(__globalOffer.value||0))/100);
      offerLabel = `${Math.round(Number(__globalOffer.value||0))}%`;
    } else {
      offerAmount = Math.min(subForGlobalOffer, Number(__globalOffer.value||0));
      const v = Number(__globalOffer.value||0);
      offerLabel = `${Number.isInteger(v) ? v : v.toFixed(2)}`;
    }
  }

  // حساب رسوم التبغ وفق الشرط الجديد
  let tobaccoFee = 0;
  try{
    // حدد مجموع أصناف التبغ كأساس قبل الضريبة (يتوافق مع sub)
    let tobaccoSub = 0;
    cart.forEach(item => {
      if(item && (item.is_tobacco===1 || item.is_tobacco===true)){
        const price = Number(item.price||0);
        const qty = Number(item.qty||1);
        if(settings.prices_include_vat){
          const base = price / (1 + vatPct);
          tobaccoSub += base * qty;
        } else {
          tobaccoSub += price * qty;
        }
      }
    });
    const hasTobacco = tobaccoSub > 0.000001;
    if(hasTobacco){
      // وزّع الخصم على التبغ بنسبة مساهمته
      const discountOnTobacco = sub > 0 ? totalDiscount * (tobaccoSub / sub) : 0;
      const discountedTobaccoBase = Math.max(0, tobaccoSub - discountOnTobacco);
      const feeByPercent = discountedTobaccoBase * (Number(settings.tobacco_fee_percent||100)/100);
      if(itemsSubAfterDiscount < 25){
        tobaccoFee = Number(settings.tobacco_min_fee_amount||25);
      } else {
        tobaccoFee = feeByPercent;
      }
      // أضف الرسوم إلى الأساس الخاضع للضريبة بعد extra
      subAfterDiscount += tobaccoFee;
    }
  }catch(_){ /* ignore */ }

  // الضريبة تُحسب على المبلغ بعد الخصم: إذا كانت الأسعار شاملة الضريبة، نحسب VAT على الفرق فقط
  if(settings.prices_include_vat){
    // grand قبل كانت تساوي sum(prices) + extra - discount + tobaccoFee (شاملة الضريبة)،
    // لكن هنا subAfterDiscount يمثل الأساس بعد الخصم مضافًا له رسوم التبغ.
    // VAT = الأساس بعد الخصم × نسبة الضريبة
    vat = subAfterDiscount * vatPct;
    grand = subAfterDiscount + vat;
  } else {
    // في حالة الأسعار غير شاملة الضريبة: VAT دائمًا على الأساس بعد الخصم
    vat = subAfterDiscount * vatPct;
    grand = subAfterDiscount + vat;
  }

  // تحديث الواجهة
  // 0) سطر الإضافى قبل الإجمالي قبل الضريبة
  if(extraSummaryRowEl && extraAmountEl){
    if(extra > 0){
      extraSummaryRowEl.style.display = '';
      extraAmountEl.textContent = fmt(extra);
    } else {
      extraSummaryRowEl.style.display = 'none';
      extraAmountEl.textContent = '';
    }
  }
  // 1) الإجمالي قبل الضريبة
  subTotalEl.textContent = fmt(sub);
  // إظهار سطر ملخص الخصم بشكل منفصل
  if(discountSummaryRowEl && discountAmountEl){
    if(totalDiscount > 0){
      // أولوية التسمية: كوبون ثم عرض عام ثم نوع الخصم اليدوي
      let label = (__currentLang.discountGeneral || 'خصم');
      if(couponAmount > 0){ label = couponLabel || (__currentLang.couponDiscountLabel || 'كوبون'); }
      else if(offerAmount > 0){ label = (String(__globalOffer?.mode)==='percent') ? `${Math.round(Number(__globalOffer?.value||0))}%` : (__currentLang.offerDiscount || 'خصم عرض'); }
      else if(dtype === 'percent'){ label = (__currentLang.discountGeneral || 'خصم') + ' ' + `${Math.round(Number(dval))}%`; }
      else if(dtype === 'amount'){ label = (__currentLang.amountDiscountLabel || 'خصم نقدي'); }
      if(discountLabelEl) discountLabelEl.textContent = label;
      discountAmountEl.textContent = '-' + fmt(totalDiscount);
      discountSummaryRowEl.style.display = '';
    } else {
      if(discountLabelEl) discountLabelEl.textContent = (__currentLang.discountGeneral || 'خصم');
      discountAmountEl.textContent = '';
      discountSummaryRowEl.style.display = 'none';
    }
  }
  if(afterDiscountEl){ afterDiscountEl.textContent = fmt(itemsSubAfterDiscount); }
  if(afterDiscountRowEl){ afterDiscountRowEl.style.display = (totalDiscount > 0 ? '' : 'none'); }
  // إظهار رسوم التبغ إن وُجدت
  try{
    const feeRow = document.getElementById('tobaccoFeeRow');
    const feeVal = document.getElementById('tobaccoFee');
    if(feeRow && feeVal){
      if(tobaccoFee > 0){
        feeRow.style.display='';
        feeVal.textContent = fmt(tobaccoFee);
      } else {
        feeRow.style.display='none'; feeVal.textContent='';
      }
    }
  }catch(_){ }
  vatTotalEl.textContent = fmt(vat);
  grandTotalEl.textContent = fmt(grand);
  // Update customer display with grand total or welcome if cart is empty
  try{
    if(window.api){
      if(cart.length === 0 && window.api.customer_display_show_welcome){
        window.api.customer_display_show_welcome().catch(() => {});
      } else if(cart.length > 0 && window.api.customer_display_show_total){
        window.api.customer_display_show_total({ total: grand }).catch(() => {});
      }
    }
  }catch(_){ }
  // عند عدم وجود ضريبة: إخفِ صف الضريبة وعدّل التسميات لعرض "المجموع" و"الإجمالي"
  try{
    const noVat = Number(settings.vat_percent||0) === 0;
    // إظهار/إخفاء صف الضريبة (السطر الذي يحتوي قيمة VAT)
    const vatRowEl = document.getElementById('vatTotal')?.closest('.row');
    if(vatRowEl){ vatRowEl.style.display = noVat ? 'none' : ''; }
    // تعديل تسمية "الإجمالي قبل الضريبة" إلى "المجموع" عند عدم وجود ضريبة
    const subLabelEl = document.getElementById('subTotal')?.previousElementSibling;
    if(subLabelEl){ subLabelEl.textContent = noVat ? (__currentLang.subtotalNoVat || 'المجموع') : (__currentLang.subTotal || 'الإجمالي قبل الضريبة'); }
    // تعديل تسمية "الإجمالي شامل الضريبة" إلى "الإجمالي" عند عدم وجود ضريبة
    const grandLabelEl = document.getElementById('grandTotal')?.previousElementSibling;
    if(grandLabelEl){ grandLabelEl.textContent = noVat ? (__currentLang.grandTotalNoVat || 'الإجمالي') : (__currentLang.grandTotal || 'الإجمالي شامل الضريبة'); }
  }catch(_){ /* ignore */ }
  // save cart state per-room on every totals recompute (safe point)
  if(__currentRoomId){ __saveRoomCart(__currentRoomId, cart); }
  // تحديث شريط معلومات الكوبون
  if(couponInfoEl){
    if(__coupon){
      if(__coupon.mode==='percent'){
        couponInfoEl.textContent = `- ${Math.round(Number(__coupon.value||0))}%`;
      } else {
        const v = Number(__coupon.value||0);
        couponInfoEl.textContent = `- ${Number.isInteger(v) ? v : v.toFixed(2)}`; // بدون عملة
      }
      couponInfoEl.style.color = '#0b3daa';
    } else {
      couponInfoEl.textContent = '';
    }
  }

  // ضبط حدود إدخال "المبلغ المدفوع"
  if(cashReceived){
    try{
      // الحقل دائمًا ظاهر الآن؛ فقط نضبط الحدود
      cashReceived.min = 0;
      if(paymentMethod && paymentMethod.value === 'mixed'){
        cashReceived.max = Number(grand.toFixed(2));
      } else {
        cashReceived.removeAttribute('max');
      }
    }catch(_){ /* ignore */ }
  }

  // حفظ قيم للحفظ/الطباعة
  window.__sale_calcs = {
    sub_total: Number(sub.toFixed(2)),
    extra_value: Number(extra.toFixed(2)),
    discount_type: couponAmount>0 ? 'coupon' : dtype,
    discount_value: couponAmount>0 ? Number(__coupon?.value||0) : Number(dval.toFixed(2)),
    discount_amount: Number(totalDiscount.toFixed(2)),
    sub_after_discount: Number(subAfterDiscount.toFixed(2)),
    vat_total: Number(vat.toFixed(2)),
    grand_total: Number(grand.toFixed(2)),
    tobacco_fee: Number((tobaccoFee||0).toFixed(2)),
    coupon: __coupon || null,
  };
  updateRemainingBeforePrint();
}

function renderCart(){
  // أخفِ عناصر التحكم اليمنى أثناء وضع المعالجة
  try{
    if(__isProcessingOld){
      if(document.getElementById('couponCode')) document.getElementById('couponCode').disabled = true;
      if(document.getElementById('extraValue')) document.getElementById('extraValue').disabled = true;
      if(document.getElementById('discountType')) document.getElementById('discountType').disabled = true;
      if(document.getElementById('discountValue')) document.getElementById('discountValue').disabled = true;
      if(document.getElementById('paymentMethod')) document.getElementById('paymentMethod').disabled = true;
      if(document.getElementById('cashReceived')) document.getElementById('cashReceived').disabled = true;
      if(document.getElementById('customerSearch')) document.getElementById('customerSearch').disabled = true;
      if(document.getElementById('driverSelect')) document.getElementById('driverSelect').disabled = true;
      if(document.getElementById('notes')) document.getElementById('notes').disabled = true;
      const btnPay = document.getElementById('btnPay'); if(btnPay) btnPay.disabled = true;
      const btnClear = document.getElementById('btnClear'); if(btnClear) btnClear.disabled = true;
      const btnKitchen = document.getElementById('btnKitchen'); if(btnKitchen) btnKitchen.disabled = true;
    }
  }catch(_){ }
  
  const fragment = document.createDocumentFragment();
  cart.forEach((it, idx) => {
    // افحص مخزون هذا الصنف مقابل العتبة دون تكرار مكالمات كثيرة
    try{ checkLowStockForItems([it]); }catch(_){ }
    // الصف الرئيسي: الاسم، العملية، السعر، الكمية، الإجمالي، حذف
    const tr = document.createElement('tr');
    // كسر اسم المنتج إلى أسطر كل سطر يحتوي كلمتين
    const nameHtml = (() => {
      const raw = String(it.name||'');
      const words = raw.split(/\s+/).filter(Boolean);
      if(words.length === 0) return '';
      const out = [];
      for(let i=0;i<words.length;i++){
        out.push(escapeHtml(words[i]));
        if(i < words.length - 1){
          if(i % 2 === 1) out.push('<br/>'); else out.push(' ');
        }
      }
      return out.join('');
    })();
    tr.innerHTML = `
      <td>
        <span class="p-name" title="${escapeHtml(it.name)}" style="display:block; white-space:normal; word-break:keep-all; overflow-wrap:normal; color:#0b3daa; font-weight:700; font-size:12px; line-height:1.25;">${nameHtml}${it.name_en ? `<div style='font-size:12px; color:#0f172a; font-weight:700; line-height:1.25; direction:ltr;'>${escapeHtml(it.name_en)}</div>`:''}</span>
      </td>
      <td>
        <select data-idx="${idx}" class="op-select"></select>
      </td>
      <td class="td-price">
        ${settings.op_price_manual
          ? `<input data-idx=\"${idx}\" class=\"op-price\" type=\"text\" inputmode=\"decimal\" placeholder=\"${__currentLang.pricePlaceholder||'السعر'}\" value=\"${Number(it.price).toFixed(2)}\" ${__isProcessingOld?'disabled':''}/>`
          : `<span class=\"price-val\">${Number(it.price||0).toFixed(2)}</span>`}
      </td>
      <td class="td-qty">
        <div class="qty-wrap">
          <button class="btn qty-btn" data-act="dec" data-idx="${idx}" aria-label="decrease" ${__isProcessingOld?'disabled':''}>-</button>
          <input data-idx="${idx}" class="qty" type="number" min="1" step="1" value="${it.qty}" ${__isProcessingOld?'disabled':''}/>
          <button class="btn qty-btn" data-act="inc" data-idx="${idx}" aria-label="increase" ${__isProcessingOld?'disabled':''}>+</button>
        </div>
      </td>
      <td class="td-total"><span class="total-val">${(Number(it.price||0) * Number(it.qty||0)).toFixed(2)}</span></td>
      <td style="text-align:center">
        ${__perms.includes('sales.remove_item') ? `<button class="btn danger" data-act="remove" data-idx="${idx}" style="padding:4px 8px; font-size:11px; font-weight:700; white-space:nowrap;" ${__isProcessingOld?'disabled':''}>${__currentLang.deleteItem||'حذف'}</button>` : ''}
      </td>
    `;
    fragment.appendChild(tr);
    const qtyInput = tr.querySelector('input.qty');
    if(qtyInput){
      adjustQtyFieldWidth(qtyInput);
      qtyInput.addEventListener('input', () => adjustQtyFieldWidth(qtyInput));
    }

    // صف ثانٍ للوصف فقط (إذا كان الإعداد مفعّل)
    if(settings.show_item_desc !== false && !settings.hide_item_description){
      const trDesc = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 6; // امتداد بعد إضافة عمود العملية
      const descVal = escapeHtml(it.description||'');
      td.innerHTML = `
        <textarea data-idx="${idx}" class="desc" placeholder="${__currentLang.itemDescPlaceholder||'وصف الصنف (اختياري)'}" rows="1"
          style="width:100%; font-size:12px; line-height:1.3; padding:4px 6px; min-height:32px; resize:vertical; white-space:pre-wrap; overflow-wrap:anywhere;" ${__isProcessingOld?'disabled':''}>${descVal}</textarea>
      `;
      trDesc.appendChild(td);
      fragment.appendChild(trDesc);
    }

    // تعبئة العمليات للعنصر ووضع الاختيار في الصف الرئيسي
    // FIX: Avoid double fetching. If ops are already loaded or loading, use them.
    // If addToCart started loading, __opsLoaded might be false but __opsPromise might exist (if we added that pattern),
    // or we just rely on the fact that addToCart sets __opsLoaded=true AFTER fetching.
    // But here we want to render immediately.
    
    // If ops are loaded, render immediately.
    if(it.__opsLoaded && Array.isArray(it.__ops)){
        renderOpsForRow(tr, it);
    } else {
        // If not loaded, fetch in background (Lazy Load Ops)
        // Check if already fetching to avoid double fetch
        if(!it.__fetchingOps){
            it.__fetchingOps = true;
            fetchProductOps(it.id).then(ops => {
                it.__ops = ops || [];
                it.__opsLoaded = true;
                it.__fetchingOps = false;
                // Re-render this row's ops only
                // We need to find the row again in case it moved, but 'tr' is a reference to the DOM element.
                // If tr is still in document, update it.
                if(tr.isConnected){
                    renderOpsForRow(tr, it);
                    // If this was a new item that needed default op selection:
                    if(!it.operation_id && it.__ops.length){
                        const first = it.__ops[0];
                        const opId = (first.operation_id||first.id);
                        it.operation_id = opId;
                        it.operation_name = first.name;
                        it.operation_name_en = first.name_en || null;
                        it.price = Number(first.price||it.price||0);
                        // Update UI
                        const select = tr.querySelector('select.op-select');
                        const priceInp = tr.querySelector('input.op-price');
                        const totalVal = tr.querySelector('.total-val');
                        const priceVal = tr.querySelector('.price-val');
                        
                        if(select){ select.value = String(opId); select.title = first.name_en ? first.name + ' - ' + first.name_en : first.name; }
                        if(priceInp){ priceInp.value = String(Number(it.price).toFixed(2)); }
                        if(priceVal){ priceVal.textContent = Number(it.price).toFixed(2); }
                        if(totalVal){ totalVal.textContent = (Number(it.price)*Number(it.qty)).toFixed(2); }
                        
                        computeTotals();
                    }
                }
            }).catch(()=>{ it.__fetchingOps = false; });
        }
    }
  });

  tbody.innerHTML = '';
  tbody.appendChild(fragment);

  // بعد كل إعادة رسم للسلة، افحص المخزون للأصناف المضافة/المعدّلة مؤخرًا إذا لزم
  try{ if(cart && cart.length){ /* optional: could batch check recent item only */ } }catch(_){ }
  
  // OPTIMIZATION: Call computeTotals ONCE after rendering all rows, not inside the loop.
  // We already removed computeTotals from inside the loop in previous steps (it was inside the async IIFE).
  // But let's double check if we need to call it here.
  // Yes, we need to update totals after rendering the cart.
  computeTotals();
}

function renderOpsForRow(tr, it){
    const select = tr.querySelector('select.op-select');
    const priceInp = tr.querySelector('input.op-price');
    
    // إذا لا توجد عمليات، أخفِ عنصر الاختيار واترك السعر الافتراضي
    if(!it.__ops || it.__ops.length === 0){
      if(select) select.style.display = 'none';
      // Don't delete operation_id if it was set manually or by default logic elsewhere unless we are sure
      // But if ops are empty, we shouldn't have an op id.
      if(!it.__opsLoaded) return; // Don't clear if not loaded yet
      
      delete it.operation_id; delete it.operation_name;
      if(priceInp){ priceInp.value = String(Number(it.price||0).toFixed(2)); }
    } else {
      if(select) select.style.display = '';
    }
    // املأ قائمة العمليات
    if(select){
      select.innerHTML = '';
      it.__ops.forEach(o => { const opt = document.createElement('option'); opt.value=String(o.operation_id||o.id); const label = o.name_en ? o.name + ' - ' + o.name_en : o.name; opt.textContent=label; opt.title=label; select.appendChild(opt); });
      if(__isProcessingOld){ try{ select.disabled = true; }catch(_){ } }
      
      // Set selected value
      if(it.operation_id){
          select.value = String(it.operation_id);
          const selectedOp = it.__ops.find(o => (o.operation_id||o.id) === Number(it.operation_id));
          if(selectedOp){ select.title = selectedOp.name_en ? selectedOp.name + ' - ' + selectedOp.name_en : selectedOp.name; }
      }
    }
}

function adjustQtyFieldWidth(input){
  if(!input) return;
  const raw = String(input.value || '').trim();
  const digits = Math.max(1, raw.length);
  const baseWidth = 60;
  const perDigit = 8;
  const computedWidth = baseWidth + (digits > 2 ? (digits - 2) * perDigit : 0);
  const maxWidth = 90;
  const widthPx = Math.min(maxWidth, Math.max(baseWidth, computedWidth));
  input.style.width = `${widthPx}px`;
}
function attrEscape(s){ return String(s).replace(/"/g,'&quot;'); }
function escapeHtml(s){ return String(s).replace(/[&<>\"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch])); }



async function loadSettings(){
  const r = await window.api.settings_get();
  if(r.ok){ settings = { ...settings, ...(r.item||{}) } }
  // payment methods into select
  if(paymentMethod){
    paymentMethod.innerHTML = '';
    const methods = Array.isArray(settings.payment_methods) && settings.payment_methods.length ? settings.payment_methods : ['cash'];
    const labels = { cash:(__currentLang.payMethodCash||'كاش'), card:(__currentLang.payMethodCard||'شبكة'), credit:(__currentLang.payMethodCredit||'آجل'), mixed:(__currentLang.payMethodMixed||'مختلط'), tamara:(__currentLang.payMethodTamara||'تمارا'), tabby:(__currentLang.payMethodTabby||'تابي') };
    methods.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m; opt.textContent = labels[m] || m;
      paymentMethod.appendChild(opt);
    });
    // set default payment if configured, but don't override restored value for room sessions
    if(!__currentRoomId || !paymentMethod.value){
      if(settings.default_payment_method && methods.includes(settings.default_payment_method)){
        paymentMethod.value = settings.default_payment_method;
      }
    }
  }
  
  // set default order type if configured
  if(orderTypeSelect && (!__currentRoomId || !orderTypeSelect.value)){
    if(settings.default_order_type){
      orderTypeSelect.value = settings.default_order_type;
    }
  }
  
  if(paymentMethod){
    try{ applyPaymentFieldState(); }catch(_){ }
  }

  // تطبيق الكوبون تلقائياً عند الكتابة أو اللصق، وإلغاءه عند التفريغ
  const couponInput = document.getElementById('couponCode');
  if(couponInput && !couponInput.__couponHandlerAttached){
    couponInput.__couponHandlerAttached = true;
    
    let couponValidationTimer = null;
    
    const applyOrClearCoupon = async () => {
      const code = (couponInput.value||'').trim();
      if(!code){
        __coupon = null;
        if(couponInfoEl){ couponInfoEl.textContent = ''; }
        computeTotals();
        return;
      }
      
      // حساب الإجمالي الفرعي من السلة مباشرة
      let sub = 0;
      const vatPct = (Number(settings.vat_percent) || 0) / 100;
      cart.forEach(item => {
        const price = Number(item.price || 0);
        const qty = Number(item.qty || 1);
        if(settings.prices_include_vat){
          const base = price / (1 + vatPct);
          sub += base * qty;
        } else {
          sub += price * qty;
        }
      });
      
      const r = await window.api.coupons_validate({ code, sub_total: sub });
      if(!r || !r.ok){
        __coupon = null;
        if(couponInfoEl){ couponInfoEl.textContent = (r?.error||(__currentLang.couponInvalid||'كوبون غير صالح')); couponInfoEl.style.color = '#dc2626'; }
        computeTotals();
        return;
      }
      __coupon = { code: r.code, mode: r.mode, value: r.value, amount: r.amount };
      if(couponInfoEl){ couponInfoEl.textContent = ''; }
      computeTotals();
    };
    
    // استخدام debounce للـ input event لتجنب الكثير من الطلبات
    couponInput.addEventListener('input', () => {
      if(couponValidationTimer){ clearTimeout(couponValidationTimer); }
      const code = (couponInput.value||'').trim();
      if(!code){
        __coupon = null;
        if(couponInfoEl){ couponInfoEl.textContent = ''; }
        computeTotals();
        return;
      }
      applyOrClearCoupon(); // استدعاء مباشر بدون timeout
    });
    
    couponInput.addEventListener('change', applyOrClearCoupon);
    couponInput.addEventListener('blur', applyOrClearCoupon);
  }
}

let __customersLoaded = false;
async function loadCustomers(){
  // load customers for searchable dropdown (lazy loaded on first interaction)
  if(__customersLoaded) return;
  try{
    const lc = await window.api.customers_list({ active: '1', sort: 'name_asc', pageSize: 9999 });
    __allCustomers = lc.ok ? (lc.items||[]) : [];
    __customersLoaded = true;
    if(customerList){
      customerList.innerHTML = '';
      customerList.style.display = 'none';
    }
    if(__selectedCustomerId && customerSearch){
      const c = __allCustomers.find(x => String(x.id)===String(__selectedCustomerId));
      if(c){ customerSearch.value = (c.name||'') + (c.phone ? (' - ' + c.phone) : ''); }
    }
  }catch(_){ /* ignore */ }
}

let __driversLoaded = false;
async function loadDrivers(){
  // load drivers for select dropdown (lazy loaded on first interaction)
  if(__driversLoaded) return;
  try{
    const ld = await window.api.drivers_list({ only_active: 1 });
    __allDrivers = ld.ok ? (ld.items||[]) : [];
    __driversLoaded = true;
    if(driverSelect){
      driverSelect.innerHTML = `<option value="">${__currentLang.noDriver||'بدون سائق'}</option>` + (__allDrivers.map(d => `<option value="${d.id}">${(d.name||'')}${d.phone?(' - '+d.phone):''}</option>`).join(''));
      if(__selectedDriverId){ driverSelect.value = String(__selectedDriverId); }
      
      const updateDriverMeta = () => {
        if(driverMeta){
          const selected = __allDrivers.find(d => String(d.id) === driverSelect.value);
          if(selected){
            const details = [selected.name || (__currentLang.noDriverName || 'بدون اسم')];
            if(selected.phone){ details.push((__currentLang.driverPhone || 'جوال: ') + selected.phone); }
            driverMeta.textContent = details.join(' | ');
          } else {
            driverMeta.textContent = (__currentLang.driverNotSelected || 'لم يتم تحديد سائق بعد');
          }
          driverMeta.style.display = 'flex';
        }
      };
      
      // Initial update
      updateDriverMeta();

      // Remove old listener if any (hard to do without named function, but assuming init runs once)
      driverSelect.onchange = () => {
        __selectedDriverId = driverSelect.value || '';
        updateDriverMeta();
        if(__currentRoomId){ __saveRoomCart(__currentRoomId, cart); }
      };
    }
  }catch(_){ /* ignore */ }
}


function renderCustomerList(q){
  const query = String(q||'').trim().toLowerCase();
  let items = __allCustomers.filter(c => {
    if(!query) return true;
    const n = String(c.name||'').toLowerCase();
    const p = String(c.phone||'').toLowerCase();
    return n.includes(query) || p.includes(query);
  });
  
  // ترتيب ذكي: الأسماء/الأرقام التي تبدأ بالبحث أولاً
  if(query){
    items.sort((a, b) => {
      const aName = String(a.name||'').toLowerCase();
      const bName = String(b.name||'').toLowerCase();
      const aPhone = String(a.phone||'').toLowerCase();
      const bPhone = String(b.phone||'').toLowerCase();
      
      const aNameStarts = aName.startsWith(query);
      const bNameStarts = bName.startsWith(query);
      const aPhoneStarts = aPhone.startsWith(query);
      const bPhoneStarts = bPhone.startsWith(query);
      
      // الأولوية: اسم يبدأ > رقم يبدأ > اسم يحتوي > رقم يحتوي
      if(aNameStarts && !bNameStarts) return -1;
      if(!aNameStarts && bNameStarts) return 1;
      if(aPhoneStarts && !bPhoneStarts) return -1;
      if(!aPhoneStarts && bPhoneStarts) return 1;
      
      // إذا كلاهما يبدأ أو كلاهما لا يبدأ، رتب أبجدياً
      return aName.localeCompare(bName, 'ar');
    });
  }
  
  customerList.innerHTML = '';
  items.forEach(c => {
    const row = document.createElement('div');
    row.tabIndex = 0;
    row.style.padding = '8px 10px';
    row.style.cursor = 'pointer';
    row.style.borderBottom = '1px solid #f3f4f6';
    row.textContent = (c.name||'') + (c.phone ? (' - ' + c.phone) : '');
    row.addEventListener('click', () => selectCustomer(c));
    row.addEventListener('keydown', (e) => { if(e.key==='Enter'){ selectCustomer(c); } });
    customerList.appendChild(row);
  });
  customerList.style.display = items.length ? 'block' : 'none';
}

async function selectCustomer(c){
  __selectedCustomerId = c && c.id ? String(c.id) : '';
  customerSearch.value = c ? ((c.name||'') + (c.phone ? (' - ' + c.phone) : '')) : '';
  customerList.style.display = 'none';
  if(__currentRoomId){ __saveRoomCart(__currentRoomId, cart); }
  // بعد اختيار العميل، طبّق التسعير المخصص على أصناف السلة الحالية
  await updatePricesForCustomer();
  // حدّث أسعار بطاقات الكتالوج لتناسب العميل
  await loadCatalog();
}

if(customerSearch){
  let __customerSearchTimer = null;
  customerSearch.addEventListener('input', async () => {
    if(__customerSearchTimer){ clearTimeout(__customerSearchTimer); }
    const q = customerSearch.value||'';
    
    // إظهار رسالة تحميل فورية
    if(q.trim().length && !__customersLoaded){
      customerList.innerHTML = `<div style="padding:10px;text-align:center;color:#6b7280;">${__currentLang.customerListLoading||'⏳ جاري التحميل...'}</div>`;
      customerList.style.display = 'block';
    }
    
    __customerSearchTimer = setTimeout(async () => {
      await loadCustomers(); // Lazy load on first interaction
      if(q.trim().length){
        __selectedCustomerId = '';
        renderCustomerList(q);
      } else {
        // تم مسح اختيار العميل: ارجع للأسعار العادية
        __selectedCustomerId = '';
        customerList.innerHTML=''; customerList.style.display='none';
        await revertPricesToBase();
        // أعِد تحميل الكتالوج لعرض أسعار أساسية
        await loadCatalog();
      }
      if(__currentRoomId){ __saveRoomCart(__currentRoomId, cart); }
    }, 150);
  });
  customerSearch.addEventListener('focus', async () => {
    await loadCustomers(); // Lazy load on first interaction
    const q = customerSearch.value||'';
    if(q.trim().length){ renderCustomerList(q); }
  });
}

// Lazy load drivers on first interaction with driver select
if(driverSelect){
  driverSelect.addEventListener('focus', async () => {
    await loadDrivers(); // Lazy load on first interaction
  }, { once: true }); // Only need to load once
}

// remove legacy searchable driver UI (replaced by select)

if(paymentMethod){ paymentMethod.addEventListener('change', () => { if(__currentRoomId){ __saveRoomCart(__currentRoomId, cart); } }); }
if(notes){ notes.addEventListener('input', () => { if(__currentRoomId){ __saveRoomCart(__currentRoomId, cart); } }); }

// تم إزالة IndexedDB - القراءة المباشرة من قاعدة البيانات

function renderCatalogCards(items, options = {}){
  if(!catalog){ return Promise.resolve(); }
  const chunk = Array.isArray(items) ? items : [];
  const replace = !!options.replace;
  if(replace){ catalog.innerHTML=''; }
  if(!chunk.length){ return Promise.resolve(); }
  const frag = document.createDocumentFragment();
  // Use IntersectionObserver for lazy loading images
  const imgObserver = new IntersectionObserver((entries, observer) => {
    const visibleIds = [];
    entries.forEach(entry => {
      if(entry.isIntersecting){
        const img = entry.target;
        const pid = img.dataset.pid;
        if(pid && !img.dataset.loaded){
          visibleIds.push(Number(pid));
          img.dataset.loaded = '1'; // Mark as queued
          observer.unobserve(img);
        }
      }
    });
    if(visibleIds.length){
      fetchImagesForIds(visibleIds);
    }
  }, { root: catalog, rootMargin: '100px' });

  async function fetchImagesForIds(ids){
    try{
      const remainingIds = [...ids];
      
      // Try sprite sheet first
      if(__spriteSheet.enabled && __spriteSheet.data && __spriteSheet.data.images){
        for(let i = remainingIds.length - 1; i >= 0; i--){
          const pid = remainingIds[i];
          const img = catalog.querySelector(`img[data-pid="${pid}"]`);
          if(!img) {
            remainingIds.splice(i, 1);
            continue;
          }
          
          const imageData = __spriteSheet.data.images[pid];
          if(imageData){
            // Use sprite sheet data
            const imgSrc = `data:${imageData.mime||'image/png'};base64,${imageData.base64}`;
            img.src = imgSrc;
            remainingIds.splice(i, 1); // تم معالجة هذا المنتج
          }
        }
      }
      
      // إذا لم يتبق منتجات، انتهينا
      if(remainingIds.length === 0) return;
      
      // Fallback to batch API للمنتجات المتبقية
      const res = await window.api.products_images_get_batch(remainingIds);
      if(res && res.ok && res.items){
        for(const pid of remainingIds){
           const data = res.items[pid];
           const img = catalog.querySelector(`img[data-pid="${pid}"]`);
           if(!img) continue;
           
           if(data){
             // Progressive Loading: add blur effect while loading
             img.style.filter = 'blur(5px)';
             img.style.transition = 'filter 0.2s';
             
             // Convert to WebP if supported (client-side optimization)
             const imgSrc = `data:${data.mime||'image/png'};base64,${data.base64}`;
             
             // Create temp image to preload
             const tempImg = new Image();
             tempImg.onload = () => {
               img.src = imgSrc;
               // Remove blur once loaded
               setTimeout(() => { img.style.filter = ''; }, 50);
             };
             tempImg.src = imgSrc;
           } else if(!settings.hide_product_images){
             // Fallback to default image
             if(!loadCatalog.__defaultImg){
                const dr = await window.api.settings_default_product_image_get();
                loadCatalog.__defaultImg = (dr && dr.ok) ? { data:`data:${dr.mime||'image/png'};base64,${dr.base64}` } : { data:null };
             }
             if(loadCatalog.__defaultImg.data){ img.src = loadCatalog.__defaultImg.data; }
           }
        }
      }
    }catch(_){ }
  }

  chunk.forEach(p => {
    const card = document.createElement('div');
    const hasImage = !!p.image_path;
    const hideImages = !!settings.hide_product_images;
    card.className = hideImages ? 'p-card no-img' : 'p-card';
    card.dataset.pid = String(p.id);
    let imgTag = '';
    
    // Always create img tag if not hidden, but with empty src or placeholder
    if(!hideImages){
       // Use a transparent pixel or loading spinner as placeholder
       imgTag = `<img loading="lazy" data-pid="${p.id}" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt=""/>`;
    }

    card.innerHTML = `
      ${imgTag}
      <div class="meta">
        <div class="pname" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</div>${p.name_en? `<div class="pname-en">${escapeHtml(p.name_en)}</div>`:''}
        <div class="price-row">
          <div class="price-under">${Number(p.price||0).toFixed(2)}</div>
        </div>
        <div class="bom-under" style="display:none;"></div>
      </div>
    `;
    card.addEventListener('click', () => addToCart(p));
    frag.appendChild(card);
    
    // Observe the image for lazy loading
    if(!hideImages){
       const imgEl = card.querySelector('img');
       if(imgEl) imgObserver.observe(imgEl);
    }
  });
  catalog.appendChild(frag);
  
  // Removed old loadImageBatch logic
  
  const concurrency = 10;
  let idx = 0;
  async function runBatch(){
    // Collect all IDs in this chunk
    const chunkIds = chunk.map(p => p.id);
    // Fetch all ops for these IDs in one go
    let opsMap = {};
    try {
      const rOps = await window.api.products_ops_get_batch(chunkIds);
      if(rOps && rOps.ok && rOps.items){
        opsMap = rOps.items;
      }
    } catch(e) { console.error('Failed to batch fetch ops', e); }

    // Now process cards using the pre-fetched ops
    while(idx < chunk.length){
      const part = chunk.slice(idx, idx += concurrency);
      await Promise.all(part.map(p => updateCardDetails(p, opsMap[p.id] || [])));
    }
  }
  async function updateCardDetails(p, preFetchedOps = null){
    const card = catalog.querySelector(`.p-card[data-pid="${p.id}"]`);
    if(!card) return;
    const priceEl = card.querySelector('.price-under');
    let displayPrice = Number(p.price||0);
    let defaultOpId = null;
    let offerPercent = null;
    
    // Use pre-fetched ops if available, otherwise fetch individually (fallback)
    let ops = preFetchedOps;
    if(!Array.isArray(ops) || ops.length === 0){
       ops = await fetchProductOps(p.id);
    }
    
    const activeOps = (ops||[]).filter(x => x.is_active);
    if(activeOps.length){
      displayPrice = Number(activeOps[0].price||0);
      defaultOpId = (activeOps[0].operation_id||activeOps[0].id);
    }
    if(__selectedCustomerId){
      try{
        const cid = Number(__selectedCustomerId);
        const opId = defaultOpId != null ? Number(defaultOpId) : null;
        
        const payload = { customer_id: cid, product_id: p.id };
        if(opId !== null){ payload.operation_id = opId; }
        const cr = await window.api.cust_price_find(payload);
        if(cr && cr.ok && typeof cr.price !== 'undefined'){
          displayPrice = Number(cr.price||0);
          offerPercent = null;
        }
      }catch(_){ }
    } else {
      try{
        const offer = await fetchProductOffer(p.id, defaultOpId);
        if(offer){
          if(offer.mode === 'percent'){
            offerPercent = Number(offer.value||0);
            displayPrice = Number((displayPrice * (1 - offerPercent/100)).toFixed(2));
          } else {
            const cashVal = Number(offer.value||0);
            offerPercent = displayPrice > 0 ? Number((cashVal/displayPrice*100).toFixed(0)) : null;
            displayPrice = Math.max(0, Number(displayPrice) - cashVal);
          }
        }
      }catch(_){ }
    }
    if(priceEl){
      priceEl.textContent = Number(displayPrice).toFixed(2);
      const priceRow = priceEl.parentElement;
      if(offerPercent != null && priceRow){
        const existingBadge = priceRow.querySelector('.offer-badge');
        if(existingBadge){ existingBadge.remove(); }
        const badge = document.createElement('span');
        badge.className = 'offer-badge';
        badge.textContent = `-${offerPercent}%`;
        priceRow.appendChild(badge);
      }
    }
    const bomEl = card.querySelector('.bom-under');
    if(!bomEl) return;
    const loadBom = async () => {
      if(bomEl.dataset.loaded) return;
      try{
        const rBom = await window.api.bom_get(p.id);
        const items = (rBom && rBom.ok) ? (rBom.items||[]) : [];
        if(items.length){
          bomEl.style.display = '';
          const fmtQty = (n) => {
            const x = Number(n || 0);
            if (Number.isNaN(x)) return '0';
            if (Number.isInteger(x)) return String(x);
            return String(Number(x.toFixed(3))).replace(/\.?0+$/,'');
          };
          bomEl.innerHTML = items.map(b => {
            const name = String(b.name||'').trim();
            const stock = fmtQty(b.stock);
            return `<span class="bom-pair"><span class="stock">${stock}</span> <span class="name">${escapeHtml(name)}</span></span>`;
          }).join(' <span style="opacity:.5;">•</span> ');
        }
        bomEl.dataset.loaded = '1';
      }catch(_){ }
    };
    loadBom(); // استدعاء مباشر بدون timeout
  }
  return runBatch().catch(()=>{});
}

// Virtual Scrolling: Render only visible items
function initVirtualScrolling(){
  __virtualScrolling.scrollContainer = catalog.parentElement; // .catalog-scroll
  if(!__virtualScrolling.scrollContainer) return;
  
  __virtualScrolling.scrollContainer.addEventListener('scroll', () => {
    if(__virtualScrolling.scrollTimeout){ clearTimeout(__virtualScrolling.scrollTimeout); }
    __virtualScrolling.scrollTimeout = setTimeout(() => {
      renderVisibleItems();
    }, 50); // debounce 50ms
  });
}

function renderVisibleItems(){
  if(!__virtualScrolling.enabled || !__virtualScrolling.allItems.length) return;
  
  const container = __virtualScrolling.scrollContainer;
  if(!container) return;
  
  const scrollTop = container.scrollTop;
  const containerHeight = container.clientHeight;
  const containerWidth = catalog.clientWidth;
  
  // حساب عدد الأعمدة بناءً على عرض الـ grid
  const itemWidth = __virtualScrolling.itemWidth + 6; // 6px gap
  const cols = Math.floor(containerWidth / itemWidth) || 1;
  
  // حساب الصفوف المرئية
  const startRow = Math.floor(scrollTop / __virtualScrolling.itemHeight);
  const endRow = Math.ceil((scrollTop + containerHeight) / __virtualScrolling.itemHeight);
  
  // إضافة buffer للصفوف
  const bufferRows = Math.ceil(__virtualScrolling.renderBuffer / cols);
  const startIdx = Math.max(0, (startRow - bufferRows) * cols);
  const endIdx = Math.min(__virtualScrolling.allItems.length, (endRow + bufferRows) * cols);
  
  // عرض العناصر المرئية فقط
  const visibleItems = __virtualScrolling.allItems.slice(startIdx, endIdx);
  
  // إخفاء جميع البطاقات أولاً
  const allCards = catalog.querySelectorAll('.p-card');
  allCards.forEach(card => { card.style.display = 'none'; });
  
  // إظهار البطاقات المرئية
  visibleItems.forEach(item => {
    const card = catalog.querySelector(`.p-card[data-pid="${item.id}"]`);
    if(card){ card.style.display = ''; }
  });
}

function updateVirtualScrollingItems(items){
  if(!__virtualScrolling.enabled) return;
  __virtualScrolling.allItems = items || [];
  renderVisibleItems();
}

async function loadCatalog(){
  const activeTab = typeTabs ? typeTabs.querySelector('.tab.active') : null;
  const cat = (typeTabs && activeTab) ? activeTab.dataset.cat : '';
  const loader = document.getElementById('catalogLoader');
  const pageSize = 100; // زيادة من 20 إلى 100 لتحسين الأداء عبر VPN
  if(!loadCatalog.__state){ loadCatalog.__state = { cat:'', offset:0, done:false, busy:false, token:null }; }
  const st = loadCatalog.__state;
  
  if(st.cat !== cat){
    st.cat = cat;
    st.offset = 0;
    st.done = false;
    st.busy = false;
    st.token = null;
    if(catalog){ catalog.innerHTML=''; }
    if(loader){ loader.style.display='none'; }
  }
  if(st.busy || st.done){ return; }

  const showLoader = !!(loader && st.offset === 0);
  st.busy = true;
  const requestToken = Symbol();
  st.token = requestToken;
  if(showLoader){ loader.style.display = 'block'; }
  
  try{
    const query = { active: '1', sort: 'custom', limit: pageSize, offset: st.offset, compress_images: true, exclude_no_category: '1' };
    if(cat){ query.category = cat; }
    let resp = null;
    
    // استخدم البيانات المحملة مسبقاً إن وُجدت (للتحميل الفوري)
    // نعطي أولوية لـ __prefetchedProductsAll لأنها تحتوي على جميع المنتجات
    if(window.__prefetchedProductsAll){
      // استخدم البيانات المحفوظة الكاملة
      try{
        const all = window.__prefetchedProductsAll;
        const filtered = all.filter(p => p.category && p.category !== '' && (cat ? p.category === cat : true));
        const page = filtered.slice(st.offset, st.offset + pageSize);
        resp = { ok: true, items: page, total: filtered.length };
      }catch(_){ resp = null; }
    } else if(window.__prefetchedProducts && st.offset === 0){
      // fallback: استخدم أول 50 منتج فقط إذا لم تكن البيانات الكاملة جاهزة
      try{
        const all = window.__prefetchedProducts;
        window.__prefetchedProducts = null;
        
        // فلتر حسب التصنيف إن وجد واستثناء المنتجات بدون نوع رئيسي
        const filtered = all.filter(p => p.category && p.category !== '' && (cat ? p.category === cat : true));
        const page = filtered.slice(0, pageSize);
        resp = { ok: true, items: page, total: filtered.length };
      }catch(_){ resp = null; }
    }
    
    // إذا لم توجد بيانات محملة، اجلبها من API
    if(!resp){
      try{
        resp = await window.api.products_list(query);
      }catch(e){
        resp = { ok:false, error: (e && e.message) ? e.message : String(e) };
      }
    }
    if(st.token !== requestToken){ return; }
    if(!resp || !resp.ok){
      setError((resp && resp.error) || __currentLang.catalogLoadError || 'تعذر تحميل الكتالوج');
      st.busy = false;
      if(showLoader){ loader.style.display='none'; }
      return;
    }
    const list = (resp.items||[]).filter(p => !p.category || activeTypes.has(p.category));
    if(list.length < pageSize){ st.done = true; }
    st.offset += list.length;
    const shouldReplace = (st.offset - list.length) === 0;
    
    // تحديث Virtual Scrolling items
    if(shouldReplace){
      updateVirtualScrollingItems(list);
    } else {
      // إضافة العناصر الجديدة
      __virtualScrolling.allItems = [...__virtualScrolling.allItems, ...list];
      renderVisibleItems();
    }
    
    renderCatalogCards(list, { replace: shouldReplace });
  } finally {
    if(st.token === requestToken){
      st.busy = false;
      if(showLoader){ loader.style.display='none'; }
    }
  }
}

// تمرير لا نهائي: حمّل المزيد عند نهاية الشبكة
(function(){
  let ticking = false;
  window.addEventListener('scroll', () => {
    if(ticking) return;
    ticking = true;
    // إزالة requestAnimationFrame للأداء الأسرع - استدعاء مباشر
    const bottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 200;
    if(bottom){ loadCatalog(); }
    ticking = false;
  }, { passive: true }); // إضافة passive للأداء الأفضل
})();

async function fetchProductOps(productId){
  try{
    const r = await window.api.prod_ops_list(productId);
    const ops = (r && r.ok) ? (r.items||[]) : [];
    return ops;
  }catch(_){ return []; }
}

async function fetchProductOpsBatch(productIds){
  try{
    const pids = Array.isArray(productIds) ? productIds.filter(id => id > 0) : [];
    if(!pids.length) return {};
    const r = await window.api.prod_ops_list_batch(pids);
    return (r && r.ok && r.items) ? r.items : {};
  }catch(_){ return {}; }
}
async function fetchProductOffer(productId, operationId){
  try{
    const or = await window.api.offers_find_for_product({ product_id: productId, operation_id: operationId!=null ? Number(operationId) : null });
    const offer = (or && or.ok && or.item && !Number(or.item.is_global)) ? or.item : null;
    return offer;
  }catch(_){ return null; }
}

// Get effective price for an item given current selected customer (if any)
async function applyCustomerPricingForItem(it){
  try{
    if(it && it.__manual_price){ return; }
    const cid = __selectedCustomerId ? Number(__selectedCustomerId) : null;
    if(!cid){ return; }
    
    const opId = (typeof it.operation_id !== 'undefined' && it.operation_id !== null) ? Number(it.operation_id) : null;
    
    const payload = { customer_id: cid, product_id: it.id };
    if(opId !== null){ payload.operation_id = opId; }
    
    const r = await window.api.cust_price_find(payload);
    if(r && r.ok && typeof r.price !== 'undefined'){
      it.price = Number(r.price||0);
    }
  }catch(_){ /* ignore */ }
}

async function updatePricesForCustomer(){
  if(!__selectedCustomerId || !cart.length){ return; }
  try{
    const items = cart.filter(it => !it.__manual_price).map(it => ({
      product_id: it.id,
      operation_id: (typeof it.operation_id !== 'undefined' && it.operation_id !== null) ? Number(it.operation_id) : null
    }));
    if(!items.length){ renderCart(); return; }
    
    const r = await window.api.cust_price_find_batch({ customer_id: Number(__selectedCustomerId), items });
    if(r && r.ok && r.prices){
      cart.forEach(it => {
        if(it.__manual_price) return;
        const pid = it.id;
        const opId = (typeof it.operation_id !== 'undefined' && it.operation_id !== null) ? Number(it.operation_id) : null;
        const key = opId !== null ? `${pid}_${opId}` : String(pid);
        const priceData = r.prices[key];
        if(priceData && typeof priceData.price !== 'undefined'){
          it.price = Number(priceData.price);
        }
      });
    }
  }catch(e){ console.error('updatePricesForCustomer batch failed', e); }
  renderCart();
}

// Restore base pricing (no customer-specific pricing)
async function applyBasePricingForItem(it){
  // If operation is selected, use its price; otherwise use product base price
  let base = null;
  try{
    if(typeof it.operation_id !== 'undefined' && it.operation_id !== null){
      // ensure ops
      if(!it.__opsLoaded){ it.__ops = await fetchProductOps(it.id); it.__opsLoaded = true; }
      const op = (it.__ops||[]).find(o => (o.operation_id||o.id) === Number(it.operation_id));
      if(op){ base = Number(op.price||0); }
    }
    if(base === null){
      // fetch product base price
      const r = await window.api.products_get(it.id);
      if(r && r.ok && r.item){ base = Number(r.item.price||0); }
    }
    try{
      const offer = await fetchProductOffer(it.id, (typeof it.operation_id!== 'undefined' && it.operation_id!=null) ? Number(it.operation_id) : null);
      if(offer){
        if(offer.mode === 'percent') base = Number((base * (1 - Number(offer.value||0)/100)).toFixed(2));
        else base = Math.max(0, Number(base) - Number(offer.value||0));
      }
    }catch(_){ }
  }catch(_){ }
  if(base !== null){ it.price = base; }
}

async function revertPricesToBase(){
  for(const it of cart){ 
    // Do not reset manually edited prices when clearing customer selection
    if(it && it.__manual_price){ continue; }
    await applyBasePricingForItem(it); 
  }
  renderCart();
}

async function addToCart(p){
  // منع إضافة صنف أثناء وضع معالجة الفاتورة
  if(__isProcessingOld){ 
    setError('');
    try{ __showSalesToast(__currentLang.cannotAddDuringProcess || 'لا يمكن إضافة أصناف أثناء معالجة الفاتورة', { icon: '⏳', danger: true, ms: 4000 }); }catch(_){ }
    return; 
  }
  // امنع إضافة منتجات من نوع رئيسي موقوف
  if(p && p.category && !activeTypes.has(p.category)){
    setError(__currentLang.typeDisabled || 'هذا النوع الرئيسي موقوف، لا يمكن البيع من تحته');
    return;
  }

  const idx = cart.findIndex(x => x.id === p.id);
  const forceSeparate = !!settings.cart_separate_duplicate_lines;

  // Optimistic update: Add/Update immediately with base price
  let cartItem = null;
  let isNewItem = false;

  if(idx >= 0 && !forceSeparate){
    cart[idx].qty += 1;
    cartItem = cart[idx];
  } else {
    isNewItem = true;
    cartItem = {
      id: p.id,
      name: p.name,
      name_en: p.name_en || null,
      price: Number(p.price||0), // Initial base price
      qty: 1,
      image_path: p.image_path,
      category: p.category || null,
      is_tobacco: Number(p.is_tobacco||0) ? 1 : 0,
      __opsLoaded: false, // Will load in background
      __ops: []
    };
    cart.unshift(cartItem);
  }
  
  // Render immediately!
  renderCart();

  // Background processing: Fetch ops, offers, customer pricing, and low stock
  (async () => {
    try {
      // 1. Fetch Ops (if not loaded)
      if(!cartItem.__opsLoaded){
        try{ 
           const ops = await fetchProductOps(p.id); 
           cartItem.__ops = ops || [];
           cartItem.__opsLoaded = true;
           
           // Apply default op if new item and ops exist
           if(isNewItem && Array.isArray(cartItem.__ops) && cartItem.__ops.length){
             const first = cartItem.__ops[0];
             cartItem.operation_id = (first.operation_id||first.id);
             cartItem.operation_name = first.name;
             cartItem.operation_name_en = first.name_en || null;
             cartItem.price = Number(first.price||0);
           }
        }catch(_){ cartItem.__ops = []; }
      }

      // 2. Fetch Offers & Customer Pricing (Parallel)
      const opId = (typeof cartItem.operation_id !== 'undefined') ? cartItem.operation_id : null;
      
      // Only fetch if we need to update price (always check offers/customer price)
      const [offer, custPriceRes] = await Promise.all([
        fetchProductOffer(cartItem.id, opId),
        applyCustomerPricingForItem(cartItem) // This modifies cartItem.price directly if found
      ]);

      // Apply offer if found (and no customer price override, or apply on top depending on logic)
      // Note: applyCustomerPricingForItem usually takes precedence or is applied after.
      // Let's re-apply offer logic if needed. 
      // Existing logic: Offer applies to base/op price. Customer price overrides everything usually.
      // Let's stick to existing logic:
      
      // If customer price applied, it usually sets price. 
      // If not, we apply offer.
      // We need to know if customer price was applied. applyCustomerPricingForItem modifies item.
      // Let's re-run the logic cleanly:
      
      // Reset to base/op price first to be sure
      let basePrice = Number(p.price||0);
      if(cartItem.operation_id){
         const op = cartItem.__ops.find(o => (o.operation_id||o.id) == cartItem.operation_id);
         if(op) basePrice = Number(op.price||0);
      }
      
      // Check if customer price is active
      let finalPrice = basePrice;
      let customerPriceFound = false;
      
      // We already called applyCustomerPricingForItem, which modifies cartItem.price
      // But we need to know if it actually did something.
      // Let's trust the side-effect of applyCustomerPricingForItem for now, 
      // BUT we must re-apply offer if customer price didn't override.
      
      // Actually, the previous code applied offer THEN customer price.
      // Let's do:
      if(offer){
         if(offer.mode === 'percent') finalPrice = Number((finalPrice * (1 - Number(offer.value||0)/100)).toFixed(2));
         else finalPrice = Math.max(0, Number(finalPrice) - Number(offer.value||0));
      }
      
      // Now re-apply customer price check to be sure (since we might have overwritten it with base)
      // Or better: just let the previous async call handle it? 
      // The issue is we need to coordinate.
      
      // Let's simplify: The previous async block did:
      // 1. fetch ops -> set op price
      // 2. fetch offer -> apply offer
      // 3. fetch cust price -> override
      
      // We can just re-render after all background tasks are done.
      // The `applyCustomerPricingForItem` modifies `cartItem.price`.
      // We just need to apply offer MANUALLY if customer price didn't hit.
      
      // Refined Background Logic:
      // A. Op Price is already set above.
      // B. Apply Offer
      if(offer){
         // Only apply offer if we haven't fetched customer price yet? 
         // Or apply to current price?
         // Let's apply to the price we have so far (Op Price).
         if(offer.mode === 'percent') cartItem.price = Number((cartItem.price * (1 - Number(offer.value||0)/100)).toFixed(2));
         else cartItem.price = Math.max(0, Number(cartItem.price) - Number(offer.value||0));
      }
      
      // C. Customer Price (overrides offer usually)
      // We already called `applyCustomerPricingForItem(cartItem)` in Promise.all
      // It modifies cartItem.price in place.
      
      // 3. Re-render with final prices
      renderCart();

      // 4. Low Stock Check (Defer)
      try{ await checkLowStockForItems([cartItem]); }catch(_){ }
      
      // 5. Hide low stock banner if disabled (cleanup)
      try{ if(settings && settings.show_low_stock_alerts === false){ 
          if(lowStockBanner) lowStockBanner.style.display='none'; 
      } }catch(_){ }

    } catch(e) { console.error('Background cart update failed', e); }
  })();
}

// تمت إزالة مسح الباركود والبحث النصي من الواجهة


let __lowStockTimer = null;
let __lowStockEpoch = 0;
let __lowStockPref = null;

function showLowStockBanner(items){
  try{
    if(!lowStockBanner || !lowStockList) return;
    // respect setting: show/hide low stock alerts
    if(!(settings && settings.show_low_stock_alerts === true)){ return; }
    const myEpoch = ++__lowStockEpoch; // snapshot to invalidate delayed hides/shows
    lowStockList.innerHTML='';
    const hasZero = items.some(x => Number(x.stock||0) <= 0);
    // Title + color based on zero-stock
    if(lowStockTitle){
      const textSpan = lowStockTitle.querySelector('.text');
      if(textSpan){ textSpan.textContent = hasZero ? (__currentLang.outOfStock || 'تم نفاد المخزون') : (__currentLang.lowStockWarning || 'تحذير: أصناف قرب نفاد المخزون'); }
    }
    lowStockBanner.classList.toggle('danger', !!hasZero);
    items.forEach(it => {
      const li = document.createElement('li');
      li.textContent = `${it.name} — ${__currentLang.remaining||'المتبقي: '}${it.stock}`;
      lowStockList.appendChild(li);
    });
    lowStockBanner.style.display='block';
    lowStockBanner.classList.add('show');
    if(__lowStockTimer){ clearTimeout(__lowStockTimer); }
    __lowStockTimer = setTimeout(()=>{ try{ if(myEpoch===__lowStockEpoch){ lowStockBanner.style.display='none'; lowStockBanner.classList.remove('show'); lowStockList.innerHTML=''; } }catch(_){ } }, 2000); // تقليل الوقت
  }catch(_){ }
}
let __lowStockCheckTimer = null;
let __pendingLowStockItems = new Set();
async function checkLowStockForItems(items){
  try{
    if(!(settings && settings.show_low_stock_alerts === true)){ return; }
    if(!(Array.isArray(items) && items.length)) return;
    items.forEach(it => { const pid = Number(it?.id||it?.product_id||0); if(pid) __pendingLowStockItems.add(pid); });
    if(__lowStockCheckTimer){ clearTimeout(__lowStockCheckTimer); }
    // استدعاء فوري بدون تأخير
    __lowStockCheckTimer = setTimeout(async () => {
      const threshold = Math.max(0, Number(settings.low_stock_threshold ?? 5));
      const lows = [];
      const pidsToCheck = Array.from(__pendingLowStockItems);
      __pendingLowStockItems.clear();
      
      if(pidsToCheck.length){
        try{ 
          const batchRes = await window.api.products_get_batch(pidsToCheck);
          if(batchRes && batchRes.ok && batchRes.items){
            for(const pid of pidsToCheck){
              const item = batchRes.items[pid];
              if(item){
                const stock = Number(item.stock||0);
                const name = item.name||'';
                if(stock <= threshold){ 
                  lows.push({ name: name || `#${pid}`, stock: stock }); 
                }
              }
            }
          }
        }catch(_){ }
      }
      if(lows.length){ showLowStockBanner(lows); }
    }, 0);
  }catch(_){ }
}

// زر طباعة المطبخ: إرسال تفاضلي دائمًا (داخل الغرف وخارجها)
try{
  const btnKitchen = document.getElementById('btnKitchen');
  if(btnKitchen){
    btnKitchen.addEventListener('click', async () => {
      if(cart.length === 0){ __showSalesToast(__currentLang.addProductsFirst||'أضف منتجات أولاً', { icon:'⚠️', danger:true, ms:5000 }); return; }
      setError('');
      const roomMeta = __currentRoomId ? await (async()=>{ try{ const rmeta = await window.api.rooms_list(); if(rmeta.ok){ return (rmeta.items||[]).find(x => String(x.id)===String(__currentRoomId)) || null; } }catch(_){ } return null; })() : null;
      let waiter = null; try{ waiter = JSON.parse(localStorage.getItem('pos_user')||'{}'); }catch(_){ waiter = null; }
      const waiterName = waiter ? (waiter.full_name || waiter.username || '') : '';

      // إرسال الأصناف الجديدة فقط: delta = qty - kitchen_sent_qty
      const itemsToSend = [];
      const sentSnapshot = new Map();
      for(const it of cart){
        const total = Math.max(0, Number(it.qty||0));
        const sent = Math.max(0, Number(it.kitchen_sent_qty||0));
        const delta = total - sent;
        if(delta > 0){ 
          itemsToSend.push({ ...it, qty: delta }); 
          sentSnapshot.set(it.id, { sentBefore: sent, delta: delta });
        }
      }
      if(itemsToSend.length === 0){ setError(__currentLang.noNewItemsKitchen || 'لا توجد أصناف جديدة لإرسالها للمطبخ'); return; }

      const kitchenCopies = Math.max(1, Number(settings.kitchen_print_copies || 1));
      const r = await window.api.kitchen_print_order({ items: itemsToSend, room_name: (roomMeta?roomMeta.name:null), sale_id: null, waiter_name: waiterName, copies_per_section: kitchenCopies, order_no: null });

      // عند النجاح وعدم التخطي (لا توجد طابعات)، قم بوسم العناصر على أنها مُرسلة
      if(r && r.ok && !r.skipped){
        for(const it of cart){
          const snapshot = sentSnapshot.get(it.id);
          if(snapshot){
            it.kitchen_sent_qty = snapshot.sentBefore + snapshot.delta;
          }
        }
        if(__currentRoomId){ try{ await __saveRoomCart(__currentRoomId, cart); }catch(_){ } }
      }
    });
  }
}catch(_){ }

// إعادة الحساب عند تغيير الخصم/الإضافى مع ضبط حدود الخصم
function calcSubBeforeVAT(){
  let sub = 0;
  const vatPct = (Number(settings.vat_percent) || 0) / 100;
  cart.forEach(item => {
    const price = Number(item.price || 0);
    const qty = Number(item.qty || 1);
    if(settings.prices_include_vat){
      const base = price / (1 + vatPct);
      sub += base * qty;
    } else {
      sub += price * qty;
    }
  });
  const extra = extraValueEl ? Math.max(0, Number(extraValueEl.value||0)) : 0;
  sub += extra;
  return sub;
}
function updateDiscountFieldUI(){
  if(!discountValueEl || !discountTypeEl) return;
  const dtype = discountTypeEl.value;
  if(dtype === 'percent'){
    discountValueEl.placeholder = (__currentLang.discountPercentPlaceholder || 'نسبة الخصم %');
    discountValueEl.min = '0';
    discountValueEl.max = '100';
  } else if(dtype === 'amount'){
    discountValueEl.placeholder = (__currentLang.discountAmountPlaceholder || 'قيمة الخصم');
    discountValueEl.min = '0';
    const sub = calcSubBeforeVAT();
    try{ discountValueEl.max = String(Number(sub.toFixed(2))); }catch(_){ discountValueEl.max = String(sub); }
  } else {
    discountValueEl.placeholder = (__currentLang.discountAmountPlaceholder || 'قيمة الخصم');
    discountValueEl.min = '0';
    discountValueEl.removeAttribute('max');
  }
}
function enforceDiscountLimits(){
  if(!discountValueEl || !discountTypeEl) return;
  const s = (discountValueEl.value||'').trim();
  if(s==='') return;
  const dtype = discountTypeEl.value;
  let val = Number(s);
  if(isNaN(val)){ val = 0; }
  const originalVal = val;
  if(dtype === 'percent'){
    val = Math.max(0, Math.min(100, val));
  } else if(dtype === 'amount'){
    const sub = calcSubBeforeVAT();
    val = Math.max(0, Math.min(sub, val));
  }
  if(val !== originalVal){
    try{ discountValueEl.value = String(Number(val.toFixed(2))); }catch(_){ discountValueEl.value = String(val); }
  }
}
if(discountTypeEl){
  discountTypeEl.addEventListener('change', () => { updateDiscountFieldUI(); enforceDiscountLimits(); computeTotals(); if(__currentRoomId){ __saveRoomCart(__currentRoomId, cart); } });
  // initialize on load
  updateDiscountFieldUI();
}
let __computeTotalsTimer = null;
function debouncedComputeTotals(){
  if(__computeTotalsTimer){ clearTimeout(__computeTotalsTimer); }
  __computeTotalsTimer = setTimeout(() => {
    computeTotals();
    if(__currentRoomId){ __saveRoomCart(__currentRoomId, cart); }
    __computeTotalsTimer = null;
  }, 100);
}
if(discountValueEl){
  discountValueEl.addEventListener('keypress', (e) => {
    if(e.key === ','){
      e.preventDefault();
      const start = discountValueEl.selectionStart;
      const end = discountValueEl.selectionEnd;
      const val = discountValueEl.value;
      discountValueEl.value = val.substring(0, start) + '.' + val.substring(end);
      discountValueEl.setSelectionRange(start + 1, start + 1);
    }
  });
  discountValueEl.addEventListener('input', () => { enforceDiscountLimits(); debouncedComputeTotals(); });
}
if(extraValueEl){
  extraValueEl.addEventListener('input', () => { updateDiscountFieldUI(); enforceDiscountLimits(); debouncedComputeTotals(); });
}

tbody.addEventListener('click', async (e) => {
  const b = e.target.closest('button');
  if(!b) return;
  const idx = Number(b.dataset.idx);
  const act = b.dataset.act;
  if(act==='inc'){ cart[idx].qty += 1; renderCart(); try{ await checkLowStockForItems([cart[idx]]); }catch(_){ } }
  if(act==='dec'){ cart[idx].qty = Math.max(1, cart[idx].qty - 1); renderCart(); try{ await checkLowStockForItems([cart[idx]]); }catch(_){ } }
  if(act==='remove'){ cart.splice(idx,1); renderCart(); }

});

tbody.addEventListener('change', async (e) => {
  const inpQty = e.target.closest('input.qty');
  if(inpQty){
    const idx = Number(inpQty.dataset.idx);
    cart[idx].qty = Math.max(1, Number(inpQty.value||1));
    renderCart();
    try{ await checkLowStockForItems([cart[idx]]); }catch(_){ }
    return;
  }
  const opSelect = e.target.closest('select.op-select');
  if(opSelect){
    const idx = Number(opSelect.dataset.idx);
    const it = cart[idx];
    if(it && it.__ops && it.__ops.length){
      const opId = Number(opSelect.value||0);
      const op = it.__ops.find(o => (o.operation_id||o.id)===opId);
      if(op){
        it.operation_id = (op.operation_id||op.id);
        it.operation_name = op.name;
        it.operation_name_en = op.name_en || null;
        // تحديث title للقائمة لإظهار الاسم الكامل عند التحويم
        opSelect.title = op.name;
        // Changing operation resets manual override so new op pricing can apply
        delete it.__manual_price;
        it.price = Number(op.price||it.price||0);
        try{
          const offer = await fetchProductOffer(it.id, it.operation_id);
          if(offer){
            if(offer.mode === 'percent') it.price = Number((it.price * (1 - Number(offer.value||0)/100)).toFixed(2));
            else it.price = Math.max(0, Number(it.price) - Number(offer.value||0));
          }
        }catch(_){ }
        // طبّق تسعير العميل إن وجد (يتجاوز العرض)
        await applyCustomerPricingForItem(it);
        renderCart();
        return;
      }
    }
  }
  const priceInp = e.target.closest('input.op-price');
  if(priceInp){
    if(!settings.op_price_manual){ return; }
    const idx = Number(priceInp.dataset.idx);
    const it = cart[idx];
    const p = Number(priceInp.value||0);
    if(!isNaN(p) && p >= 0){ it.price = p; it.__manual_price = true; computeTotals(); }
    return;
  }
  const descEl = e.target.closest('textarea.desc');
  if(descEl){
    const idx = Number(descEl.dataset.idx);
    cart[idx].description = descEl.value || '';
    if(__currentRoomId){ __saveRoomCart(__currentRoomId, cart); }
  }
});

// Live update: when typing a manual price, update line total and overall totals immediately
tbody.addEventListener('input', (e) => {
  const priceInp = e.target.closest('input.op-price');
  if(priceInp){
    if(!settings.op_price_manual){ return; }
    const idx = Number(priceInp.dataset.idx);
    const it = cart[idx];
    const raw = String(priceInp.value||'').replace(',', '.');
    const tr = priceInp.closest('tr');
    const totalEl = tr && tr.querySelector('.td-total .total-val');
    if(raw.trim() === ''){
      // Treat empty as 0 temporarily
      it.price = 0;
      it.__manual_price = true;
      if(totalEl){ totalEl.textContent = '0.00'; }
      computeTotals();
      return;
    }
    const p = Number(raw);
    if(!Number.isNaN(p) && p >= 0){
      it.price = p;
      it.__manual_price = true;
      if(totalEl){
        const qty = Number(it.qty||0);
        totalEl.textContent = (p * qty).toFixed(2);
      }
      computeTotals();
    }
  }
});

btnClear.addEventListener('click', async () => {
  // فتح نافذة تأكيد صغيرة
  const backdrop = document.getElementById('confirmClear');
  const yesBtn = document.getElementById('confirmYes');
  const noBtn = document.getElementById('confirmNo');
  if(!backdrop || !yesBtn || !noBtn){ return; }
  backdrop.style.display = 'flex';

  const doClose = () => { backdrop.style.display = 'none'; };
  const onYes = async () => {
    doClose();
    cart = [];
    if(__currentRoomId){
      await __saveRoomCart(__currentRoomId, cart);
      try{ await window.api.rooms_set_status(__currentRoomId, 'vacant'); }catch(_){ }
    }
    renderCart();
    // إعادة طريقة الدفع إلى الافتراضية عند مسح السلة
    try{
      const methods = Array.isArray(settings.payment_methods) && settings.payment_methods.length ? settings.payment_methods : ['cash'];
      if(settings.default_payment_method && methods.includes(settings.default_payment_method)){
        paymentMethod.value = settings.default_payment_method;
      } else {
        paymentMethod.value = methods[0];
      }
    }catch(_){ /* ignore */ }
  };
  const onNo = () => { doClose(); };

  const onBackdrop = (e) => { if(e.target === backdrop) doClose(); };
  backdrop.addEventListener('click', onBackdrop, { once: true });
  yesBtn.addEventListener('click', onYes, { once: true });
  noBtn.addEventListener('click', onNo, { once: true });
});

function openAddCustomer(){
  acmBackdrop.style.display = 'flex';
  acmName.value=''; 
  acmPhone.value=''; 
  acmEmail.value=''; 
  acmAddress.value=''; 
  acmVat.value=''; 
  acmCr.value=''; 
  acmNataddr.value=''; 
  acmNotes.value='';
  acmPhone.focus();
}
function closeAddCustomer(){ acmBackdrop.style.display = 'none'; }

btnAddCustomer.addEventListener('click', openAddCustomer);
acmCancel.addEventListener('click', closeAddCustomer);
acmBackdrop.addEventListener('click', (e) => { if(e.target === acmBackdrop) closeAddCustomer(); });

acmSave.addEventListener('click', async () => {
  const name = (acmName.value||'').trim();
  const phone = (acmPhone.value||'').trim();
  const vat = (acmVat.value||'').trim();
  
  // التحقق من المدخلات
  if(!phone){ 
    showToast('⚠️ ' + (__currentLang.enterPhoneNumber || 'يرجى إدخال رقم الجوال'), 'warning', 4000); 
    acmPhone.focus(); 
    return; 
  }
  
  // التحقق من الرقم الضريبي إذا تم إدخاله
  if(vat && vat.length !== 15){
    showToast('⚠️ ' + (__currentLang.vatMustBe15 || 'الرقم الضريبي يجب أن يكون 15 رقماً'), 'warning', 4000);
    acmVat.focus();
    return;
  }
  
  const payload = {
    name: name || null,
    phone,
    email: (acmEmail.value||'').trim() || null,
    address: (acmAddress.value||'').trim() || null,
    vat_number: vat || null,
    cr_number: (acmCr.value||'').trim() || null,
    national_address: (acmNataddr.value||'').trim() || null,
    notes: (acmNotes.value||'').trim() || null,
  };
  
  const res = await window.api.customers_add(payload);
  if(res && res.ok){
    showToast('✅ ' + (__currentLang.customerAddedSuccess || 'تم إضافة العميل بنجاح'), 'success', 3000);
    __customersLoaded = false;
    await loadCustomers();
    if(res.id){ 
      __selectedCustomerId = String(res.id); 
      const c = __allCustomers.find(x=>String(x.id)===String(res.id)); 
      if(c){ selectCustomer(c); } 
    }
    closeAddCustomer();
  }else{
    showToast(res && res.error ? res.error : (__currentLang.customerAddFailed || 'تعذر إضافة العميل'), 'error', 5000);
  }
});

btnPay.addEventListener('click', async () => {
  // منع الضغط المتكرر إذا كان الزر معطلاً بالفعل
  if(btnPay.disabled) return;
  
  if(cart.length === 0){ __showSalesToast(__currentLang.addProductsFirst||'أضف منتجات أولاً', { icon:'⚠️', danger:true, ms:5000 }); return; }
  
  // تعطيل أزرار الطباعة ومنع الضغط المتكرر
  btnPay.disabled = true;
  const btnPayTopElem = document.getElementById('btnPayTop');
  if(btnPayTopElem) btnPayTopElem.disabled = true;
  
  // حفظ النصوص الأصلية
  const originalBtnPayText = btnPay.innerHTML;
  const originalBtnPayTopText = btnPayTopElem ? btnPayTopElem.innerHTML : '';
  
  // تغيير النص إلى "جاري الطباعة..."
  btnPay.innerHTML = (__currentLang.printing || 'جاري الطباعة...');
  if(btnPayTopElem) {
    const longText = btnPayTopElem.querySelector('.hidden.sm\\:inline');
    const shortText = btnPayTopElem.querySelector('.sm\\:hidden');
    if(longText) longText.textContent = (__currentLang.printing || 'جاري الطباعة...');
    if(shortText) shortText.textContent = (__currentLang.printingShort || 'جاري...');
  }
  
  // دالة لإعادة تمكين الأزرار
  const enableButtons = () => {
    btnPay.disabled = false;
    btnPay.innerHTML = originalBtnPayText;
    if(btnPayTopElem) {
      btnPayTopElem.disabled = false;
      btnPayTopElem.innerHTML = originalBtnPayTopText;
    }
  };
  
  setError('');
  // حساب المبالغ النهائية
  let sub=0, vat=0, grand=0; const vatPct = (Number(settings.vat_percent)||0)/100;
  cart.forEach(it => {
    const price = Number(it.price||0), qty = Number(it.qty||1);
    if(settings.prices_include_vat){
      const base = price / (1 + vatPct); sub += base*qty; vat += (price-base)*qty;
    }else{ sub += price*qty; vat += (price*vatPct)*qty; }
  }); grand = sub + vat;

  // الدفع النقدي: إدخال المبلغ اختياري. إن لم يُدخل شيء يعتبر 0؛ المدفوع الجزئي مسموح.
  const cashStr = (cashReceived.value||'').trim();
  let cash = cashStr === '' ? 0 : Number(cashStr);
  if(paymentMethod.value === 'cash'){
    if(cashStr !== '' && (isNaN(cash) || cash < 0)){ setError(__currentLang.invalidAmount || 'قيمة غير صحيحة للمبلغ المدفوع'); enableButtons(); return; }
    const minNeeded = Number((window.__sale_calcs?.grand_total ?? grand).toFixed(2));
    // اسمح بالطباعة إذا كان الحقل فارغاً، امنع فقط إذا تم إدخال قيمة أقل من الإجمالي
    if(cashStr !== '' && cash < minNeeded){ __showSalesToast('⚠️ ' + (__currentLang.lessThanTotal || 'المبلغ المدفوع أقل من الإجمالي شامل الضريبة'), { icon:'⚠️', danger:true, ms:3000 }); setError(''); cashReceived.focus(); enableButtons(); return; }
    // إذا كان cash > 0 سيظهر في الطباعة، وإن كان 0 لن يظهر صف "المبلغ المدفوع"
  } else if(paymentMethod.value === 'mixed'){
    // مختلط: يجب إدخال مبلغ نقدي، والباقي شبكة تلقائيًا
    if(cashStr === ''){ setError(__currentLang.enterCashMixed || 'أدخل مبلغ الكاش لطريقة الدفع المختلط'); cashReceived.focus(); enableButtons(); return; }
    if(isNaN(cash) || cash < 0){ setError(__currentLang.invalidCashAmount || 'قيمة غير صحيحة للمبلغ النقدي'); enableButtons(); return; }
    const total = Number((window.__sale_calcs?.grand_total ?? grand).toFixed(2));
    if(cash > total){ setError(__currentLang.cashExceedsTotal || 'المبلغ النقدي لا يجب أن يتجاوز الإجمالي'); cashReceived.focus(); enableButtons(); return; }
    // الباقي شبكة = الإجمالي - نقدي
    const restCard = Number((total - cash).toFixed(2));
    window.__mixed_payment = { cash, card: restCard };
  } else if(paymentMethod.value === 'card' || paymentMethod.value === 'tamara' || paymentMethod.value === 'tabby'){
    // للشبكة/تمارا/تابي: إن تم إدخال مبلغ، يجب ألا يقل عن الإجمالي
    if(cashStr !== '' && (isNaN(cash) || cash < 0)){ setError(__currentLang.invalidAmount || 'قيمة غير صحيحة للمبلغ المدفوع'); enableButtons(); return; }
    const total = Number((window.__sale_calcs?.grand_total ?? grand).toFixed(2));
    if(cashStr !== '' && cash < total){ __showSalesToast('⚠️ ' + (__currentLang.lessThanTotal || 'المبلغ المدفوع أقل من الإجمالي شامل الضريبة'), { icon:'⚠️', danger:true, ms:3000 }); setError(''); cashReceived.focus(); enableButtons(); return; }
    window.__mixed_payment = null;
  } else {
    // لطرق الدفع الأخرى، لا حاجة لاختبارات خاصة
    window.__mixed_payment = null;
  }

  // build payload
  const itemsPayload = cart.map(it => ({
    product_id: it.id,
    name: it.name,
    description: (it.description || null),
    operation_id: (typeof it.operation_id!=='undefined' && it.operation_id!=null) ? Number(it.operation_id) : null,
    operation_name: it.operation_name || null,
    price: Number(it.price||0),
    qty: Number(it.qty||1),
    line_total: Number(it.price||0) * Number(it.qty||1),
    operation_id: (it.operation_id || null),
    operation_name: (it.operation_name || null),
    operation_name_en: (it.operation_name_en || null),
    category: (it.category || null)
  }));

  // استخدم القيم المحسوبة مع الخصم
  const calcs = window.__sale_calcs || {};
  const payload = {
    items: itemsPayload,
    payment_method: paymentMethod.value,
    sub_total: Number((calcs.sub_total ?? sub).toFixed(2)),
    extra_value: Number((calcs.extra_value ?? Number(extraValueEl?.value||0)).toFixed(2)),
    discount_type: (calcs.discount_type || (discountTypeEl?.value||'none')),
    discount_value: Number((calcs.discount_value ?? Number(discountValueEl?.value||0)).toFixed(2)),
    discount_amount: Number((calcs.discount_amount ?? 0).toFixed(2)),
    sub_after_discount: Number((calcs.sub_after_discount ?? sub).toFixed(2)),
    vat_total: Number((calcs.vat_total ?? vat).toFixed(2)),
    grand_total: Number((calcs.grand_total ?? grand).toFixed(2)),
    tobacco_fee: Number((calcs.tobacco_fee ?? 0).toFixed(2)),
    notes: (notes.value||'').trim(),
    coupon: (__coupon ? { code: __coupon.code, mode: __coupon.mode, value: __coupon.value } : null),
    // pass split amounts for mixed
    pay_cash_amount: (paymentMethod.value==='mixed' && window.__mixed_payment) ? Number(window.__mixed_payment.cash||0) : (paymentMethod.value==='cash' ? (cashStr===''?0:Number(cashStr)) : null),
    pay_card_amount: (paymentMethod.value==='mixed' && window.__mixed_payment) ? Number(window.__mixed_payment.card||0) : (paymentMethod.value==='card' ? Number((window.__sale_calcs?.grand_total ?? grand).toFixed(2)) : null),
  };
  if(__selectedCustomerId){ payload.customer_id = Number(__selectedCustomerId); }
  if(__selectedDriverId){ payload.driver_id = Number(__selectedDriverId); }
  if(orderTypeSelect && orderTypeSelect.value){ payload.order_type = orderTypeSelect.value; }
  // أزلنا خيار إدخال اسم العميل مباشرة

  try{ const u = JSON.parse(localStorage.getItem('pos_user')||'null'); if(u){ payload.created_by_user_id = u.id||null; payload.created_by_username = u.username||null; } }catch(_){ }
  const r = await window.api.sales_create(payload);
  if(!r.ok){
    // إظهار رسالة تحذيرية واضحة في حال نفاد المخزون
    setError(r.error || (__currentLang.saveInvoiceFailed || 'فشل حفظ الفاتورة'));
    enableButtons();
    return;
  }
  // أخبر التطبيق فورًا بوجود فاتورة جديدة لضمان تحديث الشاشات
  try{ window.api.emit_sales_changed({ action: 'created', sale_id: r.sale_id, invoice_no: r.invoice_no }); }catch(_){ }

  // Prepare kitchen payload but delay printing until AFTER cashier invoice
  let __kitchenPayload = null;
  try{
    const roomMeta = __currentRoomId ? await (async()=>{ try{ const rmeta = await window.api.rooms_list(); if(rmeta.ok){ return (rmeta.items||[]).find(x => String(x.id)===String(__currentRoomId)) || null; } }catch(_){ } return null; })() : null;
    let waiter = null; try{ waiter = JSON.parse(localStorage.getItem('pos_user')||'{}'); }catch(_){ waiter = null; }
    const waiterName = waiter ? (waiter.full_name || waiter.username || '') : '';

    // طباعة تفاضلية دائمًا عند الحفظ — أرسل فقط الزيادة الجديدة
    const itemsToSend = [];
    const sentSnapshot = new Map();
    for(const it of cart){
      const total = Math.max(0, Number(it.qty||0));
      const sent = Math.max(0, Number(it.kitchen_sent_qty||0));
      const delta = total - sent;
      if(delta > 0){ 
        itemsToSend.push({ ...it, qty: delta }); 
        sentSnapshot.set(it.id, { sentBefore: sent, delta: delta });
      }
    }

    if(itemsToSend.length){
      const kitchenCopies = Math.max(1, Number(settings.kitchen_print_copies || 1));
      __kitchenPayload = { items: itemsToSend, room_name: (roomMeta?roomMeta.name:null), sale_id: r.sale_id, waiter_name: waiterName, copies_per_section: kitchenCopies, order_no: r.order_no, sentSnapshot: sentSnapshot };
    }
  }catch(_){ /* ignore kitchen prep errors */ }

  const copies = Math.max(1, Number(settings.print_copies || (settings.print_two_copies ? 2 : 1)));
  const query = '&pay=' + encodeURIComponent(paymentMethod.value) + '&cash=' + encodeURIComponent(String(cash));
  const roomParam = __currentRoomId ? ('&room=' + encodeURIComponent(__currentRoomId)) : '';
  const orderParam = (typeof r.order_no !== 'undefined' && r.order_no !== null) ? ('&order=' + encodeURIComponent(String(r.order_no))) : '';
  let cashierName = '';
  try{ const u = JSON.parse(localStorage.getItem('pos_user')||'null'); if(u){ cashierName = (u.full_name || u.username || ''); } }catch(_){ cashierName=''; }
  const cashierParam = cashierName ? ('&cashier=' + encodeURIComponent(cashierName)) : '';
  const copiesParam = copies > 1 ? ('&copies=' + encodeURIComponent(String(copies))) : '';
  const printUrl = './print.html?id=' + encodeURIComponent(r.sale_id) + query + roomParam + orderParam + cashierParam + copiesParam;
  
  // OPTIMIZATION: Pre-cache print data to avoid VPN round-trips in print window
  try {
    const printData = {
      sale: { ...payload, id: r.sale_id, invoice_no: r.invoice_no, created_at: new Date().toISOString() },
      items: itemsPayload,
      settings: settings,
      customer: __selectedCustomerId ? __allCustomers.find(c => String(c.id) === String(__selectedCustomerId)) : null,
      driver: __selectedDriverId ? __allDrivers.find(d => String(d.id) === String(__selectedDriverId)) : null,
      ts: Date.now()
    };
    localStorage.setItem('print_data_' + r.sale_id, JSON.stringify(printData));
  } catch(e) { console.error('Failed to cache print data', e); }

  let win = null;
  const w = 420; const h = 680;
  win = window.open(printUrl, 'PRINT', `width=${w},height=${h},menubar=no,toolbar=no,location=no,status=no`);
  {
    let __kitchenDone = false;
    async function __sendKitchenIfNeeded(){
      if(__kitchenDone) return; __kitchenDone = true;
      if(__kitchenPayload){
        try{
          const sentSnapshot = __kitchenPayload.sentSnapshot || new Map();
          const rKitchen = await window.api.kitchen_print_order(__kitchenPayload);
          if(rKitchen && rKitchen.ok && !rKitchen.skipped){
            for(const it of cart){
              const snapshot = sentSnapshot.get(it.id);
              if(snapshot){
                it.kitchen_sent_qty = snapshot.sentBefore + snapshot.delta;
              }
            }
            if(__currentRoomId){ try{ await __saveRoomCart(__currentRoomId, cart); }catch(_){ } }
          }
        }catch(_){ }
      }
    }
    try{
      window.addEventListener('message', (ev)=>{ try{ if(ev && ev.data && ev.data.type==='invoice-after-print'){ __sendKitchenIfNeeded(); } }catch(_){ } });
    }catch(_){ }
    const checkClosed = setInterval(()=>{ try{ if(!win || win.closed){ clearInterval(checkClosed); __sendKitchenIfNeeded(); } }catch(_){ clearInterval(checkClosed); __sendKitchenIfNeeded(); } }, 500); // تقليل الفترة للاستجابة الأسرع
  }

  // Reset for next sale
  cart = []; if(__currentRoomId){ __saveRoomCart(__currentRoomId, cart); try{ await window.api.rooms_set_status(__currentRoomId, 'vacant'); }catch(_){ } } renderCart();
  // Show thank you message on customer display
  try{
    if(window.api && window.api.customer_display_show_thank){
      await window.api.customer_display_show_thank();
      setTimeout(async () => {
        try{
          if(window.api && window.api.customer_display_show_welcome){
            await window.api.customer_display_show_welcome();
          }
        }catch(_){ }
      }, 3000);
    }
  }catch(_){ }
  if(cashReceived){ cashReceived.value=''; }
  if(notes){ notes.value=''; }
  // تفريغ الخصم ليكون الافتراضي بدون خصم
  if(discountTypeEl){ discountTypeEl.value = 'none'; }
  if(discountValueEl){ discountValueEl.value = ''; }
  // تفريغ الإضافى والكوبون بعد طباعة الفاتورة
  if(extraValueEl){ extraValueEl.value = ''; }
  if(couponCodeEl){ couponCodeEl.value = ''; }
  __coupon = null; if(couponInfoEl){ couponInfoEl.textContent = ''; }
  // إعادة الحساب لإخفاء صفوف الخصم والإجمالي بعد الخصم
  computeTotals();
  // تفريغ اختيار العميل لبدء فاتورة جديدة بعميل جديد
  __selectedCustomerId = '';
  customerSearch.value = '';
  customerList.style.display = 'none';
  // تفريغ اختيار السائق بعد الطباعة
  __selectedDriverId = '';
  if(driverSelect){ driverSelect.value = ''; }
  // إعادة نوع الطلب إلى الافتراضي بعد الطباعة
  if(orderTypeSelect){
    if(settings.default_order_type){
      orderTypeSelect.value = settings.default_order_type;
    } else {
      orderTypeSelect.value = '';
    }
  }
  // يمكن أيضاً مسح شريط البحث والكتالوج عند الحاجة
  if(barcode){ barcode.value = ''; }
  // إعادة طريقة الدفع إلى الافتراضية المحددة في الإعدادات
  try{
    const methods = Array.isArray(settings.payment_methods) && settings.payment_methods.length ? settings.payment_methods : ['cash'];
    if(settings.default_payment_method && methods.includes(settings.default_payment_method)){
      paymentMethod.value = settings.default_payment_method;
    } else {
      paymentMethod.value = methods[0];
    }
    applyPaymentFieldState();
  }catch(_){ /* ignore */ }
  
  // إعادة تمكين أزرار الطباعة
  enableButtons();
  
  await loadCatalog();
});

async function populateCategories(preFetchedRes = null){
  try{
    const res = preFetchedRes || await window.api.types_list(); // نجلب الأنواع النشطة فقط
    typeTabs.innerHTML = '';
    activeTypes = new Set();
    const items = (res && res.ok) ? (res.items||[]) : [];
    items.forEach(t => activeTypes.add(t.name));

    // إذا لا توجد أنواع، أخفِ شريط التبويبات وعرّض الكتالوج لكل المنتجات
    if(items.length === 0){
      try{ typeTabs.style.display = 'none'; }catch(_){ }
      // إعادة تحميل الكتالوج بدون فلترة نوع محدد
      // Note: If called from init with preFetchedRes, we might want to let init handle the initial loadCatalog to avoid race conditions, 
      // but here we await it, so it's sequential.
      // However, to avoid double loading in init, we should check if we are in init phase or not.
      // For simplicity, we'll let it load here.
      await loadCatalog();
      return;
    } else {
      try{ typeTabs.style.display = ''; }catch(_){ }
    }

    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-green-500 to-green-600',
      'from-orange-500 to-orange-600',
      'from-pink-500 to-pink-600',
      'from-cyan-500 to-cyan-600',
      'from-red-500 to-red-600',
      'from-teal-500 to-teal-600',
      'from-indigo-500 to-indigo-600',
      'from-rose-500 to-rose-600'
    ];
    
    items.forEach((t, idx) => {
      // create tab فقط للأنواع النشطة
      const tab = document.createElement('button');
      const colorGradient = colors[idx % colors.length];
      tab.className = 'tab px-4 py-2 rounded-xl font-bold text-sm shadow-lg' + (idx===0 ? ' active' : '');
      tab.dataset.cat = t.name;
      tab.dataset.colorGradient = colorGradient;
      
      // Adjust font size based on text length
      let fontSize = '12px';
      if (t.name.length > 20) fontSize = '9px';
      else if (t.name.length > 15) fontSize = '10px';
      else if (t.name.length > 10) fontSize = '11px';
      
      tab.innerHTML = `<span style="font-size:${fontSize};display:block;line-height:1.2">${t.name}</span>${t.name_en ? `<span style="font-size:9px;opacity:0.85;font-weight:700;direction:ltr;unicode-bidi:isolate;display:block;line-height:1.2;margin-top:1px">${t.name_en}</span>` : ''}`;
      tab.addEventListener('click', () => {
        // toggle active
        typeTabs.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
        tab.classList.add('active');
        loadCatalog();
      });
      typeTabs.appendChild(tab);
    });
  }catch(_){ /* ignore */ }
}

(async function init(){
  // إظهار loader فوراً عند فتح الشاشة
  const loader = document.getElementById('catalogLoader');
  if(loader){ loader.style.display = 'block'; }
  
  // Preload logo to speed up print operations (non-blocking)
  (async () => {
    try {
      const cached = localStorage.getItem('pos_logo_cache');
      if(cached) {
        const data = JSON.parse(cached);
        if(Date.now() - (data.ts||0) < 24*60*60*1000) return;
      }
      const logoRes = await api.settings_image_get();
      if(logoRes && logoRes.ok) {
        localStorage.setItem('pos_logo_cache', JSON.stringify({
          ...logoRes,
          ts: Date.now()
        }));
      }
    } catch(_) { /* ignore logo preload errors */ }
  })();
  
  // Start fetching data in parallel
  const pSettings = loadSettings();
  const pOffers = window.api.offers_find_global_active().catch(()=>null);
  const pTypes = window.api.types_list().catch(()=>({ok:false}));
  
  // Progressive loading: جلب دفعات صغيرة للعرض الفوري
  const pProducts = window.api.products_list({ 
    active: '1', 
    sort: 'custom', 
    limit: 50,  // أول 50 منتج للعرض الفوري (< 500ms عبر VPN)
    compress_images: true,
    exclude_no_category: '1'  // استثناء المنتجات بدون نوع رئيسي
  }).catch(()=>({ok:false}));

  // Customers and drivers now lazy-loaded on first interaction (performance optimization)

  await pSettings;
  
  // تحميل تدريجي: أول 50 فوراً للعرض الفوري، ثم الباقي في الخلفية
  pProducts.then(async rProducts => {
    try{
      if(rProducts && rProducts.ok && rProducts.items){
        window.__prefetchedProducts = rProducts.items;
        
        // جلب الباقي في الخلفية بدون انتظار (400+ منتج إضافية)
        if(rProducts.total && rProducts.total > 50){
          window.api.products_list({ 
            active: '1', 
            sort: 'custom', 
            limit: 450,
            offset: 50,
            compress_images: true,
            exclude_no_category: '1'  // استثناء المنتجات بدون نوع رئيسي
          }).then(rAll => {
            if(rAll && rAll.ok && rAll.items){
              window.__prefetchedProductsAll = [...rProducts.items, ...rAll.items];
            } else {
              window.__prefetchedProductsAll = rProducts.items;
            }
          }).catch(()=>{
            window.__prefetchedProductsAll = rProducts.items;
          });
        } else {
          window.__prefetchedProductsAll = rProducts.items;
        }
      }
    }catch(_){ }
  });
  
  // عند تغيير طريقة الدفع: إعادة الحساب وتنظيف حالة المختلط فقط
  try{
    if(paymentMethod){
      paymentMethod.addEventListener('change', ()=>{
        setError('');
        applyPaymentFieldState();
        if(paymentMethod.value !== 'mixed'){
          window.__mixed_payment = null;
        }
        computeTotals();
      });
    }
  }catch(_){ }
  
  // احضر العرض العام مرة واحدة لتطبيق خصمه على الملخص فقط (في الخلفية)
  pOffers.then(r => {
    try{ __globalOffer = (r && r.ok) ? (r.item || null) : null; }catch(_){ __globalOffer = null; }
  });
  
  // تحميل التصنيفات والكتالوج - ننتظر أول 50 منتج فقط للعرض الفوري
  Promise.all([pTypes, pProducts]).then(async ([rTypes]) => {
    await populateCategories(rTypes);
    // تحميل الكتالوج فوراً مع أول 50 منتج (الباقي يتحمل في الخلفية)
    if(!catalog.hasChildNodes()){
      loadCatalog();
    }
  }).catch(()=>{});

  // استمع لإشارة إعادة ضبط المنتجات لإخفاء التبويبات فورًا بدون إعادة فتح الشاشة
  function handleProductsReset(){
    try{ typeTabs.style.display = 'none'; }catch(_){ }
    // مسح البيانات المحملة مسبقاً
    window.__prefetchedProducts = null;
    window.__prefetchedProductsAll = null;
    // مسح شاشة المنتجات وإعادة التحميل من قاعدة البيانات
    if(loadCatalog.__state){ loadCatalog.__state.cat=''; loadCatalog.__state.offset=0; loadCatalog.__state.done=false; loadCatalog.__state.busy=false; }
    catalog.innerHTML='';
    loadCatalog();
  }
  
  try{
    window.addEventListener('storage', (ev) => {
      if(ev && ev.key === 'pos_reset_products'){ handleProductsReset(); }
    });
    window.addEventListener('pos_reset_products', handleProductsReset);
  }catch(_){ }
  
  // عرض الشاشة فوراً مع السلة (حتى لو المنتجات لم تُحمّل بعد)
  renderCart();
  
  // Initialize Virtual Scrolling for better performance
  initVirtualScrolling();
  
  // Load sprite sheet for optimized image rendering
  loadSpriteSheet().catch(() => {
    // Fallback to regular image loading if sprite sheet fails
    __spriteSheet.enabled = false;
  });
  
  // Show welcome message on customer display only if cart is empty
  try{
    if(window.api && window.api.customer_display_show_welcome && cart.length === 0){
      await window.api.customer_display_show_welcome();
    }
  }catch(_){ }
  
  // تحميل مسبق للعملاء في الخلفية لتسريع البحث
  setTimeout(() => {
    loadCustomers().catch(() => {});
  }, 500);
})();