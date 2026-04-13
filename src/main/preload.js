// Preload script to bridge secure APIs to renderer
const { contextBridge, ipcRenderer } = require('electron');

// Inject global header language selector + auto dir/lang switch for all screens
(function(){
  try{
    const applyDir = (lang) => {
      const url = (location.pathname||'').toLowerCase();
      const isPrint = url.includes('/sales/print') || url.includes('/kitchen/print');
      const use = isPrint ? 'ar' : (lang==='en' ? 'en' : 'ar');
      document.documentElement.lang = use;
      document.documentElement.dir = use==='ar' ? 'rtl' : 'ltr';
    };
    // Lightweight global translation maps
    const TR = {
      ar_to_en: {
        'الرئيسية':'Home','تسجيل الخروج':'Logout','إدارة المستخدمين':'Users Management','المستخدمون':'Users','الصلاحيات':'Permissions','التقارير':'Reports','المبيعات':'Sales','المنتجات':'Products','العملاء':'Customers','الإعدادات':'Settings','الغرف':'Rooms','المطبخ':'Kitchen','الفواتير':'Invoices','المشتريات':'Purchases','المخزون':'Inventory','تخصيص الأسعار':'Customer Pricing','العروض':'Offers','السائقون':'Drivers',
        'إدارة الصلاحيات':'Manage Permissions','إدارة المنتجات':'Manage Products','إدارة المستخدمين والأدوار والحالة':'Manage users, roles and status','تحديد صلاحيات المستخدمين':'Define user permissions','جميع الفواتير':'All invoices','الفواتير غير مدفوعة':'Unpaid invoices','الفواتير الدائنة':'Credit invoices','تقرير يومي':'Daily report','تقرير فترة':'Period report','تقرير الأنواع':'Types report','تقرير المشتريات':'Purchases report','تقرير البلدية':'Municipality report',
        'بحث':'Search','حفظ':'Save','إلغاء':'Cancel','عودة':'Back','الرجوع':'Back','⬅ العودة':'⬅ Back','الرئيسية':'Home',
        'إضافة':'Add','إضافة مستخدم':'Add User','إضافة منتج':'Add Product','إضافة غرفة':'Add Room','إضافة عميل':'Add Customer','إضافة عملية':'Add Operation','طباعة الفاتورة':'Print invoice','إرسال للمطبخ':'Send to kitchen','تفريغ':'Clear','معالجة الفاتورة':'Process invoice','الخصم':'Discount','الإضافى':'Extra','الكوبون':'Coupon','اختيار العميل':'Select customer','اختيار السائق':'Select driver','حذف':'Delete','تعديل':'Edit','تفعيل/إيقاف':'Enable/Disable','عنصر مخزون جديد':'New inventory item','تعديل مكونات المنتج':'Edit BOM','تغيير الترتيب':'Reorder',
        'تصدير PDF':'Export PDF','تصدير CSV':'Export CSV','عرض الفاتورة':'View invoice','سداد كامل':'Settle full','عرض الإشعار':'View credit note','عرض الفاتورة':'View invoice',
        // Sales screen specific
        'فاتورة جديدة':'New Invoice','⬅ العودة للغرف':'⬅ Back to Rooms','🏠 الرئيسية':'🏠 Home','إضافة عميل جديد':'Add new customer',
        'اسم العميل (اختياري)':'Customer name (optional)','الجوال (إلزامي)':'Mobile (required)','الإيميل':'Email','العنوان':'Address','الرقم الضريبي (إن وجد)':'VAT number (if any)','ملاحظات':'Notes',
        '🧾 طباعة الفاتورة':'🧾 Print invoice','🖨️ إرسال للمطبخ':'🖨️ Send to kitchen','🗑️ تفريغ':'🗑️ Clear',
        'رقم فاتورة للمعالجة':'Invoice no. to process','معالجة الفاتورة':'Process invoice','معالجة كامل الفاتورة':'Process full invoice',
        'المنتج':'Product','العملية':'Operation','السعر':'Price','الكمية':'Qty','الإجمالي':'Total',
        'ملخص الفاتورة':'Invoice summary','الإجمالي قبل الضريبة':'Subtotal (before VAT)','خصم':'Discount','الإجمالي بعد الخصم (قبل الضريبة)':'Total after discount (before VAT)','رسوم التبغ':'Tobacco fee','ضريبة VAT':'VAT','الإجمالي شامل الضريبة':'Grand total (incl. VAT)',
        'كوبون':'Coupon','أدخل رمز الكوبون':'Enter coupon code','قيمة الإضافى (قبل الضريبة)':'Extra amount (before VAT)','بدون خصم':'No discount','خصم %':'Percent discount','خصم نقدي':'Amount discount','قيمة الخصم':'Discount value',
        'المبلغ المدفوع':'Amount paid','اختر عميلًا (اكتب الاسم أو الجوال)':'Select customer (type name or phone)','+ عميل جديد':'+ New customer','بدون سائق':'No driver'
      }
    };
    // reverse map for en->ar
    TR.en_to_ar = Object.fromEntries(Object.entries(TR.ar_to_en).map(([a,e])=>[e,a]));

    // Extend translations for more screens/phrases without touching the base map above
    try{ Object.assign(TR.ar_to_en, {
      'بحث (عميل، جوال، منتج، باركود)':'Search (Customer, Phone, Product, Barcode)',
      'ابحث بالاسم أو الجوال':'Search by name or phone',
      'ابحث بالاسم أو الباركود':'Search by name or barcode',
      'العميل':'Customer',
      'التخصيص':'Customization',
      'لا توجد بيانات':'No data',
      'إضافة/تعديل تخصيص':'Add/Edit customization',
      'العملية (اختياري)':'Operation (optional)',
      'نوع التخصيص':'Customization type',
      'سعر نقدي':'Cash price',
      'خصم نسبة %':'Percent discount %',
      'القيمة':'Value',
      'شاشة دفع الفاتورة':'Invoice payment screen',
      'بحث برقم الفاتورة فقط':'Search by invoice number only',
      'بحث بالعميل (جوال/اسم/رقم ضريبي)':'Search by customer (Phone/Name/VAT)',
      'مسح':'Clear',
      '# الفاتورة':'# Invoice',
      'الجوال':'Mobile',
      'التاريخ':'Date',
      'الحالة':'Status',
      'إجراء':'Action',
      'تم اختيار:':'Selected:',
      'فشل التحميل':'Load failed',
      'فشل الحفظ':'Save failed',
      'فشل الحذف':'Delete failed',
      'تعذر التحميل':'Failed to load',
      'تعذر فتح التعديل':'Failed to open edit',
      'اختر العميل':'Select customer',
      'اختر المنتج':'Select product',
      'أدخل قيمة صحيحة':'Enter a valid value',
      'اختر العملية':'Select operation',
      'بدون':'None',
      'مدير':'Admin',
      'كاشير':'Cashier',
      'نشط':'Active',
      'موقوف':'Inactive',
      'إيقاف':'Disable',
      'تفعيل':'Enable',
      'يرجى إدخال اسم المستخدم':'Please enter username',
      'يرجى إدخال كلمة المرور':'Please enter password',
      'تعذر تحميل الفواتير':'Failed to load invoices',
      // Offers & coupons
      'العروض والكوبونات':'Offers & Coupons',
      'إضافة عرض':'Add Offer',
      'عرض عام':'Global Offer',
      'إضافة كوبون':'Add Coupon',
      'بحث (عرض/كوبون)':'Search (Offer/Coupon)',
      'العروض على الأصناف':'Offers on products',
      'الاسم':'Name',
      'التطبيق':'Scope',
      'الفترة':'Period',
      'إجراءات':'Actions',
      'الرمز':'Code',
      'اسم/وصف':'Name/Desc',
      'من تاريخ':'From date',
      'إلى تاريخ':'To date',
      'حد أدنى للفاتورة':'Min invoice total',
      'حد الاستخدام':'Usage limit',
      'اسم العرض':'Offer name',
      'وصف اختياري':'Optional description',
      'ابحث عن صنف لإضافته للعرض':'Search product to add to offer',
      'لم يتم إضافة أصناف بعد':'No items added yet',
      'تعديل عرض':'Edit offer',
      'تعديل كوبون':'Edit coupon',
      'فشل الإضافة':'Add failed',
      'فشل التعديل':'Update failed',
      'فشل ربط المنتجات':'Failed to link products',
      'حذف العرض؟':'Delete offer?',
      'يوجد عرض عام بالفعل — احذف العرض الحالي أولاً':'A global offer already exists — delete the current one first',
      // Offers value labels
      'نسبة %':'Percent %',
      'نقدي':'Cash',
      'عام':'Global',
      'أصناف محددة':'Selected products',
      // Login page
      'تسجيل الدخول - POS SA':'Login - POS SA',
      'نظام نقاط البيع - السعودية':'POS System - Saudi Arabia',
      'سجّل الدخول للمتابعة':'Sign in to continue',
      'اسم المستخدم':'Username',
      'كلمة المرور':'Password',
      'تذكرني':'Remember me',
      'دخول':'Login',
      'إعداد الاتصال بالجهاز الرئيسي…':'Configure connection to primary device…',
      'إعداد الاتصال بالجهاز الرئيسي':'Configure connection to primary device',
      'إغلاق':'Close',
      'IP الجهاز الرئيسي':'Primary device IP',
      'اختبار الاتصال':'Test connection',
      'حفظ واستخدام':'Save and use',
      'حسابات محفوظة':'Saved accounts',
      'تم الاتصال بنجاح':'Connected successfully',
      'فشل الاتصال':'Connection failed',
      'يرجى إدخال IP':'Please enter IP',
      'تعذر الاتصال بالجهاز الرئيسي':'Failed to connect to primary device',
      'تم الحفظ. يمكنك تسجيل الدخول الآن.':'Saved. You can log in now.',
      'تعذر الحفظ':'Failed to save',
      'حدث خطأ أثناء الحفظ':'An error occurred while saving',
      'تعبئة اسم المستخدم وكلمة المرور':'Fill username and password',
      'حدث خطأ':'An error occurred',
      'يرجى إدخال اسم المستخدم وكلمة المرور':'Please enter username and password',
      'تكبير':'Zoom in',
      'تصغير':'Zoom out',
      'تكبير/تصغير':'Zoom in/out'
    }); TR.en_to_ar = Object.fromEntries(Object.entries(TR.ar_to_en).map(([a,e])=>[e,a])); }catch(_){ }

    // More UI translations collected from renderer screens
    try{ Object.assign(TR.ar_to_en, {
      // Users
      'المستخدمون - POS SA':'Users - POS SA','👥 إدارة المستخدمين':'👥 Manage users','إدارة المستخدمين':'Manage users','العودة':'Back','إضافة مستخدم':'Add user','➕ إضافة مستخدم':'➕ Add user','تحديث':'Refresh','🔄 تحديث':'🔄 Refresh','اسم المستخدم':'Username','الاسم الكامل':'Full name','الدور':'Role','عمليات':'Actions','تعديل مستخدم':'Edit user','اتركها فارغة لعدم التغيير':'Leave empty to keep unchanged','حفظ':'Save','إلغاء':'Cancel','تعذر تحميل المستخدمين':'Failed to load users','تعذر جلب المستخدم':'Failed to fetch user','فشل تحديث الحالة':'Failed to update status','تأكيد حذف المستخدم؟':'Confirm user deletion?',
      // Products
      'المنتجات - POS SA':'Products - POS SA','إدارة المنتجات':'Manage products','تصدير PDF':'Export PDF','تصدير CSV':'Export CSV','كل الحالات':'All statuses','الأحدث':'Newest','ترتيبي المخصص':'Custom order','الاسم (أ-ي)':'Name (A-Z)','السعر (تصاعدي)':'Price (Asc)','السعر (تنازلي)':'Price (Desc)','المخزون (أعلى)':'Stock (High)','عدد الصفوف في الصفحة:':'Rows per page:','الكل':'All','الصورة':'Image','الباركود':'Barcode','السعر':'Price','سعر الشراء':'Purchase price','العمليات وأسعارها':'Operations & prices','المخزون':'Stock','الفئة':'Category','حفظ ترتيب السطور':'Save row order','اسحب الصفوف لأعلى/أسفل ثم اضغط حفظ':'Drag rows up/down then click Save','إضافة منتج':'Add product','إزالة الصورة':'Remove image','اختيار صورة':'Pick image','صورة المنتج':'Product image','الوصف':'Description','اسم المنتج (إنجليزي) - اختياري':'Product name (English) - optional','التكلفة':'Cost','عمليات المنتج وأسعارها':'Product operations & prices','تطبيق رسوم التبغ؟':'Apply tobacco fee?','لا':'No','نعم':'Yes',
      // Operations
      'العمليات - POS SA':'Operations - POS SA','إدارة العمليات':'Manage operations','إضافة عملية':'Add operation','اسم العملية':'Operation name',
      // Payments
      'سداد كامل للفاتورة':'Full invoice settlement','طريقة السداد':'Payment method','المبلغ المستلم':'Amount received','سداد وطباعة':'Settle and print','شبكة':'Network','كاش':'Cash',
      // Purchases
      'المشتريات - POS SA':'Purchases - POS SA','المشتريات':'Purchases','إضافة مشتريات':'Add purchase','آخر 200 عملية مشتريات':'Last 200 purchase operations','تصفية':'Filter','ضريبة؟':'VAT?','الصافي':'Subtotal','الإجمالي':'Total','ملاحظات':'Notes','إضافة/تعديل مشتريات':'Add/Edit purchase','اسم المشتريات':'Purchase name','التاريخ والوقت':'Date & time','تطبيق الضريبة؟':'Apply VAT?','تُطبّق (السعر شامل الضريبة)':'Apply (price includes VAT)','لا تُطبّق':'Do not apply','نسبة الضريبة %':'VAT percent %','يُستخدم فقط عند تطبيق الضريبة':'Used only when VAT applies','التكلفة (سعر الإدخال)':'Cost (input price)','إذا كانت الضريبة مفعّلة فالقيمة المدخلة تُعتبر شاملة الضريبة':'If VAT is enabled, the entered value is VAT-inclusive','طريقة الدفع':'Payment method','تصدير Excel':'Export Excel',
      // Rooms
      'الغرف - POS SA':'Rooms - POS SA','الغرف':'Rooms','+ إضافة غرفة':'Add room','إضافة غرفة':'Add room','القسم (اختياري)':'Section (optional)','السعة':'Capacity','اسم الغرفة':'Room name',

          // Settings screen
          'الإعدادات - POS SA':'Settings - POS SA','إعدادات النظام':'System settings','تحكم كامل في هوية المتجر، الضرائب، الطباعة والمدفوعات':'Full control over branding, taxes, printing and payments','⬅ العودة':'⬅ Back','تم الحفظ بنجاح':'Saved successfully',
          // Company/general
          'البيانات العامة':'General info','معلومات المتجر للتعاملات والفواتير':'Store information for invoices','اسم المبيعات':'Legal seller name','الاسم القانوني المسجل':'Registered legal name','الموقع الإلكتروني':'Website','موقع الشركة (العنوان)':'Company location (address)','الجوال':'Mobile','إرسال التقرير اليومي بالبريد':'Send daily report by email','ملاحظات أسفل الفاتورة':'Invoice footer note',
          // Daily email modal
          'إعداد إرسال التقرير اليومي':'Setup daily report email','تفعيل الإرسال اليومي':'Enable daily sending','ساعة الإرسال اليومية':'Daily send time','خادم البريد (اختياري)':'SMTP host (optional)','المنفذ':'Port','اتصال آمن (TLS/SSL)':'Secure connection (TLS/SSL)','البريد المرسل':'Sender email','كلمة مرور التطبيقات':'App password','للاستخدام مع Gmail ينصح بمنفذ 587 وبدون Secure، واستخدام كلمة مرور تطبيق.':'For Gmail, use port 587 without Secure, and an App Password.',
          // Brand & logo
          'الهوية والشعار':'Brand & logo','ارفع شعار المتجر ليظهر في الفواتير والتقارير':'Upload the store logo to show on invoices and reports','اختيار الشعار':'Pick logo','إزالة الشعار':'Remove logo','يفضل صورة مربعة .png أو .jpg بحجم لا يقل عن 256×256 لنتيجة أوضح':'Prefer a square .png or .jpg at least 256×256 for clearer results','عرض الشعار (px)':'Logo width (px)','طول الشعار (px)':'Logo height (px)',
          // Currency
          'إعدادات العملة':'Currency settings','رمز العملة وموقعه في المبالغ':'Currency symbol and its position','العملة':'Currency','الرمز بعد المبلغ (مثال: 100 ﷼)':'Symbol after amount (e.g., 100 SAR)','الرمز قبل المبلغ (مثال: ﷼ 100)':'Symbol before amount (e.g., SAR 100)',
          // Tax
          'الضرائب':'Taxes','نسبة الضريبة VAT %':'VAT percent %','الأسعار شاملة الضريبة (حسب السعودية)':'Prices include VAT (Saudi)','الرقم الضريبي (ZATCA)':'VAT number (ZATCA)','نسبة رسوم التبغ %':'Tobacco fee percent %','الحد الأدنى لقيمة رسوم التبغ':'Minimum tobacco fee amount',
          // Payments
          'طرق الدفع':'Payment methods','تفعيل طرق الدفع والطريقة الافتراضية':'Enable payment methods and default','طرق الدفع المفعّلة':'Enabled payment methods','شبكة (مدى)':'Network (Mada)','مختلط':'Mixed','طريقة الدفع الافتراضية':'Default payment method','بدون افتراضي':'No default',
          // Print
          'الطباعة':'Printing','نوع الطابعة وخيارات الإخراج':'Printer type and output options','خيارات الطباعة':'Print options','عدد النسخ':'Number of copies','طباعة صامتة':'Silent print','إظهار الباقي':'Show change',
          // Ops
          'عمليات النظام':'System operations','سلوك الأسعار والمخزون':'Pricing and inventory behavior','السماح بتعديل سعر العملية يدوياً':'Allow manual operation price','السماح ببيع الصنف عندما المخزون = 0':'Allow selling item when stock = 0','السماح بسالب مخزون المكونات (BOM)':'Allow negative components stock (BOM)','إخفاء صور المنتجات في شاشة فاتورة جديدة':'Hide product images on New Invoice screen','ساعة الإقفال اليومية':'Daily closing hour','ستُستخدم لتحديد بداية ونهاية اليوم التقاريري. يتم تصفير التقرير اليومي بعد 24 ساعة من هذا الوقت.':'Used to determine reporting day start/end. Daily report resets 24 hours after this time.',
          // Recovery
          'استعادة النظام':'System recovery','عمليات خطرة: لا يمكن التراجع عنها':'Dangerous operations: irreversible','حذف الفواتير وإعادة الترقيم':'Delete invoices and reset numbering','حذف كل المنتجات':'Delete all products','حذف كل العملاء':'Delete all customers',
      // Reports index + shared report strings
      'التقارير':'Reports','الرجوع':'Back','التقرير اليومي':'Daily report','عرض تقرير اليوم اعتمادًا على ساعة الإقفال':'Show today\'s report based on closing hour','تقرير الفترة':'Period report','اختر تاريخ ووقت من — إلى لعرض التقرير':'Choose date-time from — to to show report','تقرير جميع الفواتير':'All invoices report','جلب كل الفواتير لفترة من — إلى مع الإجماليات':'Fetch all invoices for a period with totals','تقرير المشتريات':'Purchases report','حدد الفترة من — إلى لعرض مشترياتك مع الإجماليات':'Select period to view purchases with totals','تقرير العملاء':'Customers report','فواتير عميل محدد لفترة من — إلى مع الإجماليات':'Invoices for a specific customer with totals','تقرير الفواتير الدائنة':'Credit invoices report','يعرض فواتير الآجل غير المسددة للفترة المحددة':'Shows unpaid credit invoices for the period','تقرير الفواتير غير مدفوعة':'Unpaid invoices report','جلب الفواتير غير المدفوعة للفترة من — إلى':'Fetch unpaid invoices for the period','تقرير الأنواع':'Types report','تجميع المبيعات حسب الأنواع للفترة من — إلى':'Aggregate sales by types for the period','تقرير البلدية':'Municipality report','فواتير برسوم تبغ للفترة المحددة':'Invoices with tobacco fees for the period',
      'تقرير التوصيل':'Delivery report','فواتير شركات التوصيل للفترة المحددة':'Delivery company invoices for the selected period',
      // Common report UI
      'من:':'From:','إلى:':'To:','تطبيق':'Apply','نقدي':'Cash','شبكة':'Network','آجل':'Credit','قسيمة':'Voucher','حوالة':'Transfer','الملخص التفصيلي':'Detailed summary','البيان':'Item','قبل الضريبة':'Pre-VAT','رسوم التبغ':'Tobacco fee','الضريبة':'VAT','بعد الضريبة':'After VAT','الصافي':'Net','طرق الدفع':'Payment methods','الطريقة':'Method','الإجمالي':'Total','الإجمالي الكلي':'Grand total','المنتجات المباعة':'Sold products','المنتج':'Product','الكمية':'Qty','المشتريات':'Purchases','البيان':'Description','التاريخ':'Date','ملاحظات':'Notes','الإجمالي:':'Total:','الفواتير':'Invoices','تشمل الفواتير غير الدائنة فقط ضمن الفترة.':'Includes non-credit invoices only within the period.','رقم':'No.','العميل':'Customer','طريقة الدفع':'Payment method','عرض':'View','إشعارات الدائن (المرتجعات)':'Credit notes (returns)','مرتجع/إشعارات دائنة':'Returns/Credit notes','الخصومات':'Discounts','طرق الدفع':'Payment methods','رقم الإشعار':'Credit note no.','القيمة':'Amount','عدد:':'Count:','المجموع:':'Sum:',
      // Unpaid/All/Credit/Customer invoices report headings
      'تقرير الفواتير غير مدفوعة':'Unpaid invoices report','الإجماليات':'Totals','رقم الفاتورة':'Invoice no.','تاريخ الإنشاء':'Created at','المبلغ':'Amount','تقرير جميع الفواتير':'All invoices report','تقرير الفواتير الدائنة':'Credit invoices report','تقرير العملاء':'Customers report',
      // Main index
      'الرئيسية - POS SA':'Home - POS SA','الرئيسية':'Home','تسجيل الخروج':'Log out','الصلاحيات':'Permissions','إدارة العملاء':'Manage customers','فاتورة جديدة':'New Invoice','الفواتير':'Invoices','الفواتير الدائنة':'Credit Notes','دفع الفاتورة':'Payments','المنتجات':'Products','الأنواع الرئيسية':'Main Types','العمليات':'Operations','الإعدادات':'Settings','طابعات المطبخ':'Kitchen Printers','المخزون':'Inventory','تخصيص أسعار':'Customer Pricing','السائقون':'Drivers','شركات التوصيل':'Delivery Companies','إدارة شركات التوصيل والخصومات':'Manage delivery companies and discounts','عرض تقارير المبيعات لاحقًا':'View sales reports','إدارة مستخدمي النظام والأدوار والحالة':'Manage users, roles and status','تحديد صلاحيات المستخدمين':'Define user permissions','إضافة/إدارة العملاء':'Add/Manage customers','بدء عملية بيع':'Start a sale','عرض وإدارة الفواتير':'View and manage invoices','عرض الإشعارات الدائنة منفصلة':'View credit notes','سداد فواتير الآجل بالكامل':'Settle credit invoices in full','إضافة منتج جديد':'Add new product','غرف/طاولات المطعم':'Restaurant rooms/tables','إدارة الأنواع الرئيسية':'Manage main types','معلومات الشركة والضريبة':'Company and tax info','تعريف العمليات وربطها بالمنتجات':'Define operations and link to products','ربط الأقسام بطابعات':'Link sections to printers','إضافة ومراجعة مشتريات':'Add and review purchases','تعريف عناصر المخزون وربطها بالمنتجات':'Define inventory items and link to products','تحديد أسعار/خصومات لعميل':'Set prices/discounts for a customer','عروض على الأصناف وكوبونات خصم':'Offers on products and coupons','تسجيل وإدارة السائقين':'Register and manage drivers','عرض تقارير المبيعات لاحقًا':'View sales reports',
      // Customers
      'العملاء - POS SA':'Customers - POS SA','العملاء':'Customers','العودة للرئيسية':'Back to home','إضافة عميل':'Add customer','البريد الإلكتروني':'Email','العنوان':'Address','الرقم الضريبي':'VAT number'
    }); TR.en_to_ar = Object.fromEntries(Object.entries(TR.ar_to_en).map(([a,e])=>[e,a])); }catch(_){ }

    // Pattern translations for dynamic strings (Arabic -> English)
    TR.patterns_ar_en = [
      { re: /^صفحة\s+(\d+)\s+من\s+(\d+)$/u, to: (_m, a, b) => `Page ${a} of ${b}` },
      { re: /^تم اختيار:\s*(.+)$/u, to: (_m, x) => `Selected: ${x}` }
    ];
    TR.patterns_en_ar = [
      { re: /^Page\s+(\d+)\s+of\s+(\d+)$/u, to: (_m, a, b) => `صفحة ${a} من ${b}` },
      { re: /^Selected:\s*(.+)$/u, to: (_m, x) => `تم اختيار: ${x}` }
    ];

    let __APP_LANG = 'ar';
    let __translateTimer = null;
    function translateDom(lang){
      try{
        __APP_LANG = (lang==='en'?'en':'ar');
        const url = (location.pathname||'').toLowerCase();
        const isPrint = url.includes('/sales/print') || url.includes('/kitchen/print');
        if(isPrint) return; // always Arabic for print views
        const map = (lang==='en') ? TR.ar_to_en : Object.fromEntries(Object.entries(TR.ar_to_en).map(([ar,en])=>[en,ar]));
        if(!map) return;
        // Translate document title as well
        try{
          const dt = (document.title||'').trim();
          if(map[dt]){ document.title = map[dt]; }
          else if(lang==='en' && Array.isArray(TR.patterns_ar_en)){
            for(const p of TR.patterns_ar_en){ const m = dt.match(p.re); if(m){ document.title = p.to(m, ...m.slice(1)); break; } }
          } else if(lang==='ar' && Array.isArray(TR.patterns_en_ar)){
            for(const p of TR.patterns_en_ar){ const m = dt.match(p.re); if(m){ document.title = p.to(m, ...m.slice(1)); break; } }
          }
        }catch(_){ }
        // Walk text nodes and replace exact matches after trim
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
        const toChange = [];
        const missing = new Set();
        const isArabic = (s) => /[\u0600-\u06FF]/.test(s);
        while(walker.nextNode()){
          const node = walker.currentNode;
          // Skip nodes inside elements explicitly locked from auto-translation
          try{ const el = node.parentElement || node.parentNode; if(el && el.closest && el.closest('[data-i18n-lock="true"]')){ continue; } }catch(_){ }
          const text = node.nodeValue;
          if(!text) continue;
          const trimmed = text.trim();
          if(!trimmed) continue;
          // Extract emoji/punctuation prefixes/suffixes to improve matching
          const mPrefix = trimmed.match(/^[^\p{L}\p{N}]+/u);
          const mSuffix = trimmed.match(/[^\p{L}\p{N}]+$/u);
          const prefix = mPrefix ? mPrefix[0] : '';
          const suffix = mSuffix ? mSuffix[0] : '';
          const core = trimmed.slice(prefix.length, trimmed.length - suffix.length);
          const tryPatterns = (dir, coreText) => {
            const arr = (dir==='ar_en') ? TR.patterns_ar_en : TR.patterns_en_ar;
            if(!Array.isArray(arr)) return null;
            for(const p of arr){ const mm = coreText.match(p.re); if(mm){ return prefix + p.to(mm, ...mm.slice(1)) + suffix; } }
            return null;
          };
          if(map[trimmed]){
            toChange.push({ node, to: map[trimmed] });
          } else if(core && map[core]){
            toChange.push({ node, to: prefix + map[core] + suffix });
          } else if(lang==='en'){
            const byPat = tryPatterns('ar_en', core || trimmed);
            if(byPat){ toChange.push({ node, to: byPat }); }
            else if(isArabic(trimmed)){
              missing.add(trimmed);
            }
          } else if(lang==='ar'){
            const byPat = tryPatterns('en_ar', core || trimmed);
            if(byPat){ toChange.push({ node, to: byPat }); }
          }
        }
        if(missing.size){
          try{
            window.__I18N_MISSING = Array.from(new Set([...(window.__I18N_MISSING||[]), ...Array.from(missing)]));
            clearTimeout(window.__I18N_LOG_T);
            window.__I18N_LOG_T = setTimeout(()=>{
              console.warn('[i18n] Missing Arabic keys for translation:', window.__I18N_MISSING);
            }, 200);
          }catch(_){ }
        }
        for(const { node, to } of toChange){ node.nodeValue = node.nodeValue.replace(node.nodeValue.trim(), to); }
        // Update attributes commonly used on buttons and titles and placeholders
        document.querySelectorAll('[title]').forEach(el=>{
          const t = (el.getAttribute('title')||'').trim();
          if(map[t]) el.setAttribute('title', map[t]);
          else if(lang==='ar' && Array.isArray(TR.patterns_en_ar)){
            for(const p of TR.patterns_en_ar){ const m = t.match(p.re); if(m){ el.setAttribute('title', p.to(m, ...m.slice(1))); break; } }
          }
        });
        document.querySelectorAll('input[placeholder], textarea[placeholder], select option').forEach(el=>{
          const isOption = el.tagName.toLowerCase()==='option';
          const val = isOption ? (el.textContent||'').trim() : (el.getAttribute('placeholder')||'').trim();
          if(map[val]){
            if(isOption){ el.textContent = map[val]; }
            else{ el.setAttribute('placeholder', map[val]); }
          } else if(lang==='en' && Array.isArray(TR.patterns_ar_en)){
            for(const p of TR.patterns_ar_en){
              const m = val.match(p.re);
              if(m){
                const newVal = p.to(m, ...m.slice(1));
                if(isOption){ el.textContent = newVal; } else { el.setAttribute('placeholder', newVal); }
                break;
              }
            }
          } else if(lang==='ar' && Array.isArray(TR.patterns_en_ar)){
            for(const p of TR.patterns_en_ar){
              const m = val.match(p.re);
              if(m){
                const newVal = p.to(m, ...m.slice(1));
                if(isOption){ el.textContent = newVal; } else { el.setAttribute('placeholder', newVal); }
                break;
              }
            }
          }
        });
      }catch(_){ }
    }
    const scheduleTranslate = () => { try{ clearTimeout(__translateTimer); }catch(_){ } __translateTimer = setTimeout(()=>translateDom(__APP_LANG), 10); };
    // Expose a safe refresh hook on window for renderer calls
    try{ window.__i18n_refresh = () => { try{ translateDom(__APP_LANG); }catch(_){ } }; }catch(_){ }
    // Small burst helper to catch late DOM injections
    try{ window.__i18n_burst = (lang)=>{ try{ translateDom(lang); setTimeout(()=>translateDom(lang),100); setTimeout(()=>translateDom(lang),300); setTimeout(()=>translateDom(lang),800); }catch(_){ } }; }catch(_){ }
    // Observe DOM changes to re-apply translations for dynamic content
    try{
      const obs = new MutationObserver(() => scheduleTranslate());
      obs.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    }catch(_){ }

    document.addEventListener('DOMContentLoaded', async () => {
      try{
        const url = (location.pathname||'').toLowerCase();
        const isPrint = url.includes('/sales/print') || url.includes('/kitchen/print');
        const isMain = url.includes('/renderer/main/') || url.endsWith('/main/index.html');
        const nav = document.querySelector('header nav, header .header-actions'); // where we inject controls
        // Ensure small beautiful style for global header buttons (same as login)
        try{
          if(nav && !document.getElementById('appGlobalControlsStyles')){
            const st = document.createElement('style'); st.id='appGlobalControlsStyles';
            st.textContent = `
              #appFullscreenToggle, #appBackBtn{
                display:inline-flex; align-items:center; gap:6px;
                width:auto !important; min-width:unset; height:auto;
                padding:8px 12px; border-radius:10px; border:0;
                background: linear-gradient(135deg, #2563eb, #3b82f6); color:#fff;
                font-weight:800; font-size:13px; box-shadow: 0 10px 20px rgba(59,130,246,.24);
                cursor:pointer; user-select:none; transition: transform .08s ease, box-shadow .25s ease, filter .2s ease;
                position: relative; z-index: 2; /* stay above header layout but not fixed */
              }
              #appFullscreenToggle:hover, #appBackBtn:hover{ filter:brightness(1.06); }
              #appFullscreenToggle:active, #appBackBtn:active{ transform: translateY(1px); box-shadow: 0 8px 16px rgba(59,130,246,.22); }
              #appFullscreenToggle .ico, #appBackBtn .ico{ font-size:16px; line-height:1; }
            `;
            document.head.appendChild(st);
          }
        }catch(_){ }
        // Apply initial language from persistent storage
        let initial = 'ar';
        try{ const r = await ipcRenderer.invoke('app:get_locale'); initial = (r && r.lang)||'ar'; }catch(_){ initial='ar'; }
        applyDir(initial);
        try{ window.__i18n_burst && window.__i18n_burst(initial); }catch(_){ translateDom(initial); }
        // If no header actions (e.g., login screen), inject a floating fullscreen button
        try{
          if(!isPrint){
            if(!document.getElementById('loginFsStyles')){
              const st=document.createElement('style'); st.id='loginFsStyles';
              st.textContent = `
                #loginFsBtn{
                  position: fixed; bottom:12px; inset-inline-end:12px; top:auto; z-index: 10000;
                  display:inline-flex; align-items:center; gap:6px;
                  width:auto !important; min-width:unset; height:auto; /* ensure small size */
                  padding:8px 12px; border-radius:10px; border:0;
                  background: linear-gradient(135deg, #2563eb, #3b82f6); color:#fff;
                  font-weight:800; font-size:13px; box-shadow: 0 10px 20px rgba(59,130,246,.24);
                  cursor:pointer; user-select:none; transition: transform .08s ease, box-shadow .25s ease, filter .2s ease;
                }
                #loginFsBtn:hover{ filter:brightness(1.06); }
                #loginFsBtn:active{ transform: translateY(1px); box-shadow: 0 8px 16px rgba(59,130,246,.22); }
                #loginFsBtn .ico{ font-size:16px; line-height:1; }
              `;
              document.head.appendChild(st);
            }
            if(!document.getElementById('loginFsBtn')){
              const b=document.createElement('button'); b.id='loginFsBtn';
              b.type='button'; b.setAttribute('aria-label','ملء الشاشة');
              b.innerHTML = '<span class="ico">🖵</span><span>ملء الشاشة</span>';
              b.addEventListener('click', async (ev)=>{ ev.stopPropagation(); try{ await ipcRenderer.invoke('window:toggle_fullscreen'); }catch(_){ } });
              document.body.appendChild(b);
              // Ensure hidden on print via CSS too
              const pr=document.createElement('style'); pr.id='loginFsPrintHide'; pr.textContent='@media print{#loginFsBtn{display:none !important}}';
              document.head.appendChild(pr);
            }
          }
        }catch(_){ }

        // ── Floating Zoom Control ──
        try{
          if(!isPrint && isMain && !document.getElementById('zoomControlStyles')){
            const zst = document.createElement('style'); zst.id='zoomControlStyles';
            zst.textContent = `
              #zoomControl{
                position:fixed; top:50%; inset-inline-end:0; transform:translateY(-50%);
                z-index:10001; display:flex; align-items:center; direction:ltr;
                font-family:'Cairo',sans-serif;
              }
              #zoomToggleBtn{
                width:28px; height:56px; border:0; border-radius:10px 0 0 10px;
                background:linear-gradient(135deg,#2563eb,#3b82f6); color:#fff;
                font-size:16px; font-weight:800; cursor:pointer; display:flex;
                align-items:center; justify-content:center;
                box-shadow:2px 2px 12px rgba(37,99,235,.3);
                transition:background .2s, box-shadow .2s;
              }
              #zoomToggleBtn:hover{ background:linear-gradient(135deg,#1d4ed8,#2563eb); }
              #zoomPanel{
                display:none; flex-direction:column; gap:4px; padding:6px;
                background:#fff; border-radius:12px 0 0 12px;
                box-shadow:-2px 2px 16px rgba(0,0,0,.15); border:1px solid #e5e7eb;
                border-right:0;
              }
              #zoomPanel.open{ display:flex; }
              .zoom-btn{
                width:36px; height:36px; border:0; border-radius:8px;
                background:linear-gradient(135deg,#2563eb,#3b82f6); color:#fff;
                font-size:20px; font-weight:900; cursor:pointer; display:flex;
                align-items:center; justify-content:center;
                box-shadow:0 4px 10px rgba(37,99,235,.2);
                transition:transform .1s, filter .2s;
              }
              .zoom-btn:hover{ filter:brightness(1.1); }
              .zoom-btn:active{ transform:scale(.93); }
              #zoomLevel{
                font-size:11px; font-weight:800; color:#374151;
                text-align:center; min-width:36px; line-height:1.2;
                user-select:none;
              }
              @media print{ #zoomControl{display:none!important} }
            `;
            document.head.appendChild(zst);
          }
          if(!isPrint && isMain && !document.getElementById('zoomControl')){
            const wrap = document.createElement('div'); wrap.id='zoomControl';
            const toggle = document.createElement('button'); toggle.id='zoomToggleBtn';
            toggle.type='button'; toggle.setAttribute('aria-label','تكبير/تصغير');
            toggle.innerHTML='▶';
            const panel = document.createElement('div'); panel.id='zoomPanel';

            const btnPlus = document.createElement('button'); btnPlus.className='zoom-btn';
            btnPlus.type='button'; btnPlus.textContent='+'; btnPlus.title='تكبير';
            const btnMinus = document.createElement('button'); btnMinus.className='zoom-btn';
            btnMinus.type='button'; btnMinus.textContent='−'; btnMinus.title='تصغير';
            const levelLabel = document.createElement('div'); levelLabel.id='zoomLevel';
            levelLabel.textContent='100%';

            panel.appendChild(btnPlus);
            panel.appendChild(levelLabel);
            panel.appendChild(btnMinus);
            wrap.appendChild(toggle);
            wrap.appendChild(panel);
            document.body.appendChild(wrap);

            let panelOpen = false;
            let currentZoom = 1;
            const updateLabel = () => { levelLabel.textContent = Math.round(currentZoom*100)+'%'; };

            // Load saved zoom
            (async()=>{
              try{
                const r = await ipcRenderer.invoke('zoom:get');
                if(r && r.zoom){ currentZoom = r.zoom; updateLabel(); }
              }catch(_){}
            })();

            toggle.addEventListener('click', (ev)=>{
              ev.stopPropagation();
              panelOpen = !panelOpen;
              panel.classList.toggle('open', panelOpen);
              toggle.innerHTML = panelOpen ? '◀' : '▶';
            });

            btnPlus.addEventListener('click', async (ev)=>{
              ev.stopPropagation();
              currentZoom = Math.min(2, +(currentZoom + 0.1).toFixed(2));
              updateLabel();
              try{ await ipcRenderer.invoke('zoom:set', { zoom: currentZoom }); }catch(_){}
            });
            btnMinus.addEventListener('click', async (ev)=>{
              ev.stopPropagation();
              currentZoom = Math.max(0.5, +(currentZoom - 0.1).toFixed(2));
              updateLabel();
              try{ await ipcRenderer.invoke('zoom:set', { zoom: currentZoom }); }catch(_){}
            });
          }

          // Apply saved zoom on page load
          (async()=>{
            try{
              const r = await ipcRenderer.invoke('zoom:get');
              if(r && r.zoom && r.zoom !== 1){
                const { webFrame } = require('electron');
                webFrame.setZoomFactor(r.zoom);
              }
            }catch(_){}
          })();
        }catch(_){ }

        // Function to ensure language selector exists and stays mounted
        const ensureLangSelector = (langVal) => {
          if(isPrint || !nav) return;
          
          // Back button (hidden on main screen)
          if(!isMain){
            let backBtn = nav.querySelector('#appBackBtn');
            if(!backBtn){
              backBtn = document.createElement('button'); backBtn.id='appBackBtn';
              backBtn.className = 'flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-200 shadow-sm transition-all duration-200 font-bold text-sm mx-1 font-[Cairo]';
              backBtn.title='الرجوع';
              backBtn.innerHTML='<span class="text-lg leading-none">⬅</span><span>الرجوع</span>';
              backBtn.addEventListener('click', async ()=>{ try{ await ipcRenderer.invoke('window:back'); }catch(_){ } });
              try{ nav.insertBefore(backBtn, nav.firstChild); }catch(_){ nav.appendChild(backBtn); }
            }
          }

          // Language selector
          let sel = nav.querySelector('#appLangSelect');
          if(!sel){
            sel = document.createElement('select'); sel.id='appLangSelect';
            sel.className = 'px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-200 shadow-sm transition-all duration-200 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 mx-1 font-[Cairo]';
            sel.innerHTML='<option value="ar">العربية</option><option value="en">English</option>';
            sel.addEventListener('change', async (e)=>{
              const v = e.target.value==='en'?'en':'ar';
              try{ await ipcRenderer.invoke('app:set_locale', { lang: v }); }catch(_){ }
            });
            try{ nav.insertBefore(sel, nav.firstChild); }catch(_){ nav.appendChild(sel); }
          }
          if(langVal){ sel.value = (langVal==='en'?'en':'ar'); }
        };
        // Inject/ensure selector
        ensureLangSelector(initial);
        // Re-ensure on DOM mutations (لو اختفى بسبب تحديث DOM سنعيد حقنه)
        try{
          const obs2 = new MutationObserver(()=>ensureLangSelector(__APP_LANG));
          obs2.observe(document.querySelector('header')||document.body, { childList:true, subtree:true });
        }catch(_){ }
        // Listen for app-wide changes and re-apply dir/lang + translate
        try{ ipcRenderer.removeAllListeners('app:locale_changed'); ipcRenderer.on('app:locale_changed', (_ev, L)=>{ applyDir(L); try{ window.__i18n_burst && window.__i18n_burst(L); }catch(_){ translateDom(L); } const sel=document.getElementById('appLangSelect'); if(sel) sel.value=L; }); }catch(_){ }
        // Also ensure initial burst is mirrored to both directions by rebuilding reverse map right after extending
        try{ TR.en_to_ar = Object.fromEntries(Object.entries(TR.ar_to_en).map(([ar,en])=>[en,ar])); }catch(_){ }
      }catch(_){ }
    });
  }catch(_){ }
})();

contextBridge.exposeInMainWorld('api', {
  login: (username, password) => ipcRenderer.invoke('auth:login', { username, password }),

  // DB config (link to primary)
  db_get_config: () => ipcRenderer.invoke('db:get_config'),
  db_test: (cfg) => ipcRenderer.invoke('db:test', cfg),
  db_apply: (cfg) => ipcRenderer.invoke('db:apply', cfg),

  // Device mode (Primary/Secondary)
  device_get_mode: () => ipcRenderer.invoke('device:get_mode'),
  device_set_mode: (payload) => ipcRenderer.invoke('device:set_mode', payload),

  // Users APIs
  users_list: () => ipcRenderer.invoke('users:list'),
  users_get: (id) => ipcRenderer.invoke('users:get', { id }),
  users_add: (payload) => ipcRenderer.invoke('users:add', payload),
  users_update: (username, payload) => ipcRenderer.invoke('users:update', { username, payload }),
  users_toggle: (id) => ipcRenderer.invoke('users:toggle', { id }),
  users_delete: (id) => ipcRenderer.invoke('users:delete', { id }),

  // Permissions APIs
  perms_list_all: () => ipcRenderer.invoke('perms:list_all'),
  perms_get_for_user: (user_id) => ipcRenderer.invoke('perms:get_for_user', { user_id }),
  perms_set_for_user: (user_id, keys) => ipcRenderer.invoke('perms:set_for_user', { user_id, keys }),

  // App-level
  app_quit: () => ipcRenderer.invoke('app:quit'),
  app_get_locale: () => ipcRenderer.invoke('app:get_locale'),
  app_set_locale: (lang) => ipcRenderer.invoke('app:set_locale', { lang }),
  app_on_locale_changed: (cb) => { try{ ipcRenderer.removeAllListeners('app:locale_changed'); }catch(_){ } ipcRenderer.on('app:locale_changed', (_ev, lang) => { try{ cb && cb(lang); }catch(_){ } }); },

  // License
  license_check: () => ipcRenderer.invoke('license:check'),
  license_activate: (code) => ipcRenderer.invoke('license:activate', { code }),
  license_reset: () => ipcRenderer.invoke('license:reset'),

  // Saved accounts fallback (userData JSON)
  saved_accounts_get: () => ipcRenderer.invoke('saved_accounts:get'),
  saved_accounts_set: (list) => ipcRenderer.invoke('saved_accounts:set', list),

  // Hardware identifiers are intentionally not exposed to the renderer in production.

  // Products
  products_add: (payload) => ipcRenderer.invoke('products:add', payload),
  products_list: (query) => ipcRenderer.invoke('products:list', query),
  products_get: (id) => ipcRenderer.invoke('products:get', { id }),
  products_get_batch: (ids) => ipcRenderer.invoke('products:get_batch', ids),
  products_get_by_barcode: (barcode) => ipcRenderer.invoke('products:get_by_barcode', { barcode }),
  products_update: (id, payload) => ipcRenderer.invoke('products:update', { id }, payload),
  products_toggle: (id) => ipcRenderer.invoke('products:toggle', { id }),
  products_reorder: (ids) => ipcRenderer.invoke('products:reorder', ids),
  products_delete: (id) => ipcRenderer.invoke('products:delete', { id }),
  products_reset_all: () => ipcRenderer.invoke('products:reset_all'),
  products_image_get: (id) => ipcRenderer.invoke('products:image_get', { id }),
  products_images_get_batch: (ids) => ipcRenderer.invoke('products:images_get_batch', ids),
  products_ops_get_batch: (ids) => ipcRenderer.invoke('products:ops_get_batch', ids),
  products_translate: (text) => ipcRenderer.invoke('products:translate', { text }),
  
  // Sprite Sheet (Image optimization)
  sprite_generate: () => ipcRenderer.invoke('sprite:generate'),
  sprite_get: () => ipcRenderer.invoke('sprite:get'),
  sprite_clear: () => ipcRenderer.invoke('sprite:clear'),

  // Operations
  ops_list: () => ipcRenderer.invoke('ops:list'),
  ops_add: (payload) => ipcRenderer.invoke('ops:add', payload),
  ops_update: (id, payload) => ipcRenderer.invoke('ops:update', { id }, payload),
  ops_toggle: (id) => ipcRenderer.invoke('ops:toggle', { id }),
  ops_delete: (id) => ipcRenderer.invoke('ops:delete', { id }),
  prod_ops_list: (product_id) => ipcRenderer.invoke('prod_ops:list', { id: product_id }),
  prod_ops_list_batch: (product_ids) => ipcRenderer.invoke('prod_ops:list_batch', product_ids),
  prod_ops_set: (product_id, items) => ipcRenderer.invoke('prod_ops:set', { id: product_id }, items),

  // File dialog + image helpers
  pick_image: () => ipcRenderer.invoke('fs:pick_image'),
  import_image: (srcPath) => ipcRenderer.invoke('fs:import_image', srcPath),
  read_file_base64: (srcPath) => ipcRenderer.invoke('fs:read_file_base64', srcPath),
  resolve_path: (rel) => ipcRenderer.invoke('fs:resolve_path', rel),

  // Settings logo/default product image helpers
  settings_image_get: () => ipcRenderer.invoke('settings:image_get'),
  settings_default_product_image_get: () => ipcRenderer.invoke('settings:default_product_image_get'),

  // System helpers
  open_external: (url) => ipcRenderer.invoke('app:open_external', { url }),
  reveal_file: (absPath) => ipcRenderer.invoke('app:reveal_file', { path: absPath }),

  // PDF export
  pdf_export: (html, options) => ipcRenderer.invoke('pdf:export', { html, options }),
  // CSV export
  csv_export: (csv, options) => ipcRenderer.invoke('csv:export', { csv, options }),
  // Silent print invoice
  print_invoice_silent: (args) => ipcRenderer.invoke('print:invoice_silent', args),
  // Generic HTML print (used for daily report)
  print_html: (html, options) => ipcRenderer.invoke('print:html', { html, options }),

  // Events: subscribe to sales changes
  on_sales_changed: (cb) => {
    try{ ipcRenderer.removeAllListeners('sales:changed'); }catch(_){ }
    ipcRenderer.on('sales:changed', (_ev, payload) => { try{ cb && cb(payload); }catch(_){ } });
  },
  emit_sales_changed: (payload) => { try{ ipcRenderer.send('ui:sales_changed', payload); }catch(_){ } },
  on_operations_cache_invalidated: (cb) => {
    try{ ipcRenderer.removeAllListeners('operations:cache:invalidated'); }catch(_){ }
    ipcRenderer.on('operations:cache:invalidated', (_ev, payload) => { try{ cb && cb(payload); }catch(_){ } });
  },

  // Local QR generation via main process
  qr_to_data_url: async (text, opts) => {
    const r = await ipcRenderer.invoke('qr:to_data_url', { text, opts });
    return (r && r.ok) ? r.dataUrl : null;
  },
  qr_to_svg: async (text, opts) => {
    const r = await ipcRenderer.invoke('qr:to_svg', { text, opts });
    return (r && r.ok) ? r.svg : null;
  },

  // Sales
  sales_create: (payload) => ipcRenderer.invoke('sales:create', payload),
  sales_list: (q) => ipcRenderer.invoke('sales:list', q),
  sales_get: (id) => ipcRenderer.invoke('sales:get', { id }),
  sales_get_print_data: (payload) => ipcRenderer.invoke('sales:get_print_data', payload),
  sales_has_credit_for_invoice: (q) => ipcRenderer.invoke('sales:has_credit_for_invoice', q),
  sales_list_credit: (q) => ipcRenderer.invoke('sales:list_credit', q),
  sales_list_credit_notes: (q) => ipcRenderer.invoke('sales:list_credit_notes', q),
  sales_settle_full: (payload) => ipcRenderer.invoke('sales:settle_full', payload),
  sales_refund_full: (payload) => ipcRenderer.invoke('sales:refund_full', payload),
  sales_reset_all: () => ipcRenderer.invoke('sales:reset_all'),
  sales_items_summary: (q) => ipcRenderer.invoke('sales:items_summary', q),
  sales_items_detailed: (q) => ipcRenderer.invoke('sales:items_detailed', q),
  sales_municipality_report: (q) => ipcRenderer.invoke('sales:municipality_report', q),
  sales_list_by_user: (q) => ipcRenderer.invoke('sales:list_by_user', q),
  sales_period_summary: (q) => ipcRenderer.invoke('sales:period_summary', q),

  // Purchases
  purchases_add: (payload) => ipcRenderer.invoke('purchases:add', payload),
  purchases_list: (q) => ipcRenderer.invoke('purchases:list', q),
  purchases_update: (id, payload) => ipcRenderer.invoke('purchases:update', { id }, payload),
  purchases_delete: (id) => ipcRenderer.invoke('purchases:delete', { id }),
  purchases_reset_all: () => ipcRenderer.invoke('purchases:reset_all'),

  // Customers
  customers_add: (payload) => ipcRenderer.invoke('customers:add', payload),
  customers_list: (query) => ipcRenderer.invoke('customers:list', query),
  customers_get: (id) => ipcRenderer.invoke('customers:get', { id }),
  customers_update: (id, payload) => ipcRenderer.invoke('customers:update', { id }, payload),
  customers_toggle: (id) => ipcRenderer.invoke('customers:toggle', { id }),
  customers_delete: (id) => ipcRenderer.invoke('customers:delete', { id }),
  customers_reset_all: () => ipcRenderer.invoke('customers:reset_all'),

  // Main types (categories)
  types_add: (payload) => ipcRenderer.invoke('types:add', payload),
  types_list: () => ipcRenderer.invoke('types:list'),
  types_list_all: () => ipcRenderer.invoke('types:list_all'),
  types_get: (id) => ipcRenderer.invoke('types:get', { id }),
  types_update: (id, payload) => ipcRenderer.invoke('types:update', { id }, payload),
  types_toggle: (id) => ipcRenderer.invoke('types:toggle', { id }),
  types_delete: (id) => ipcRenderer.invoke('types:delete', { id }),
  types_reorder: (items) => ipcRenderer.invoke('types:reorder', items),

  // Settings
  settings_get: () => ipcRenderer.invoke('settings:get'),
  settings_save: (payload) => ipcRenderer.invoke('settings:save', payload),

  // Scheduler
  scheduler_trigger_daily_email: () => ipcRenderer.invoke('scheduler:trigger_daily_email'),
  scheduler_trigger_backup: () => ipcRenderer.invoke('scheduler:trigger_backup'),
  scheduler_send_daily_now: () => ipcRenderer.invoke('scheduler:send_daily_now'),

  // Backup: email database dump (gz)
  backup_email_db: (to) => ipcRenderer.invoke('backup:email_db', { to }),
  backup_show_save_dialog: () => ipcRenderer.invoke('backup:show_save_dialog'),
  backup_save_db_to_file: (savePath) => ipcRenderer.invoke('backup:save_db_to_file', { savePath }),

  // Drivers
  drivers_list: (q) => ipcRenderer.invoke('drivers:list', q),
  drivers_add: (payload) => ipcRenderer.invoke('drivers:add', payload),
  drivers_update: (id, payload) => ipcRenderer.invoke('drivers:update', { id }, payload),
  drivers_toggle: (id) => ipcRenderer.invoke('drivers:toggle', { id }),
  drivers_delete: (id) => ipcRenderer.invoke('drivers:delete', { id }),
  drivers_get: (id) => ipcRenderer.invoke('drivers:get', { id }),

  // Delivery Companies
  delivery_companies_list: (q) => ipcRenderer.invoke('delivery_companies:list', q),
  delivery_companies_add: (payload) => ipcRenderer.invoke('delivery_companies:add', payload),
  delivery_companies_update: (id, payload) => ipcRenderer.invoke('delivery_companies:update', { id }, payload),
  delivery_companies_toggle: (id) => ipcRenderer.invoke('delivery_companies:toggle', { id }),
  delivery_companies_delete: (id) => ipcRenderer.invoke('delivery_companies:delete', { id }),
  delivery_companies_get: (id) => ipcRenderer.invoke('delivery_companies:get', { id }),
  sales_delivery_report: (q) => ipcRenderer.invoke('sales:delivery_report', q),

  // Kitchen Printers
  kitchen_list: () => ipcRenderer.invoke('kitchen:list'),
  kitchen_add: (payload) => ipcRenderer.invoke('kitchen:add', payload),
  kitchen_update: (id, payload) => ipcRenderer.invoke('kitchen:update', { id }, payload),
  kitchen_delete: (id) => ipcRenderer.invoke('kitchen:delete', { id }),
  kitchen_set_routes: (id, types) => ipcRenderer.invoke('kitchen:set_routes', { id }, types),
  kitchen_test_print: (id) => ipcRenderer.invoke('kitchen:test_print', { id }),
  kitchen_print_order: (payload) => ipcRenderer.invoke('kitchen:print_order', payload),
  kitchen_list_system_printers: () => ipcRenderer.invoke('kitchen:list_system_printers'),

  // Rooms
  rooms_list: (q) => ipcRenderer.invoke('rooms:list', q),
  rooms_add: (payload) => ipcRenderer.invoke('rooms:add', payload),
  rooms_update: (id, payload) => ipcRenderer.invoke('rooms:update', { id }, payload),
  rooms_delete: (id) => ipcRenderer.invoke('rooms:delete', { id }),
  rooms_open_session: (room_id) => ipcRenderer.invoke('rooms:open_session', { id: room_id }),
  rooms_get_session: (room_id) => ipcRenderer.invoke('rooms:get_session', { id: room_id }),
  rooms_save_cart: (room_id, cart, state) => ipcRenderer.invoke('rooms:save_cart', { id: room_id }, cart, state),
  rooms_set_status: (room_id, status) => ipcRenderer.invoke('rooms:set_status', { id: room_id }, status),
  rooms_clear: (room_id) => ipcRenderer.invoke('rooms:clear', { id: room_id }),

  // Inventory + BOM
  inventory_list: (q) => ipcRenderer.invoke('inv:list', q),
  inventory_add: (payload) => ipcRenderer.invoke('inv:add', payload),
  inventory_update: (id, payload) => ipcRenderer.invoke('inv:update', { id }, payload),
  inventory_toggle: (id) => ipcRenderer.invoke('inv:toggle', { id }),
  inventory_delete: (id) => ipcRenderer.invoke('inv:delete', { id }),
  bom_get: (product_id) => ipcRenderer.invoke('bom:get', { id: product_id }),
  bom_set: (product_id, items) => ipcRenderer.invoke('bom:set', { id: product_id }, items),

  // Customer pricing
  cust_price_list: (q) => ipcRenderer.invoke('cust_price:list', q),
  cust_price_upsert: (payload) => ipcRenderer.invoke('cust_price:upsert', payload),
  cust_price_update: (id, payload) => ipcRenderer.invoke('cust_price:update', { id }, payload),
  cust_price_delete: (id) => ipcRenderer.invoke('cust_price:delete', { id }),
  cust_price_find: (payload) => ipcRenderer.invoke('cust_price:find_price', payload),
  cust_price_find_batch: (payload) => ipcRenderer.invoke('cust_price:find_price_batch', payload),

  // Offers
  offers_list: (q) => ipcRenderer.invoke('offers:list', q),
  offers_add: (payload) => ipcRenderer.invoke('offers:add', payload),
  offers_update: (id, payload) => ipcRenderer.invoke('offers:update', { id }, payload),
  offers_delete: (id) => ipcRenderer.invoke('offers:delete', { id }),
  offers_toggle: (id) => ipcRenderer.invoke('offers:toggle', { id }),
  offers_set_products: (id, items) => ipcRenderer.invoke('offers:set_products', { id }, items),
  offers_find_for_product: (payload) => ipcRenderer.invoke('offers:find_for_product', payload),
  offers_find_global_active: () => ipcRenderer.invoke('offers:find_global_active'),
  offers_get_products: (id) => ipcRenderer.invoke('offers:get_products', { id }),
  coupons_validate: (payload) => ipcRenderer.invoke('coupons:validate', payload),

  // Coupons
  coupons_list: (q) => ipcRenderer.invoke('coupons:list', q),
  coupons_add: (payload) => ipcRenderer.invoke('coupons:add', payload),
  coupons_update: (id, payload) => ipcRenderer.invoke('coupons:update', { id }, payload),
  coupons_delete: (id) => ipcRenderer.invoke('coupons:delete', { id }),
  coupons_toggle: (id) => ipcRenderer.invoke('coupons:toggle', { id }),

  // Window control
  window_set_fullscreen: (shouldBeFullscreen) => ipcRenderer.invoke('window:set_fullscreen', shouldBeFullscreen),

  // Zoom control
  zoom_get: () => ipcRenderer.invoke('zoom:get'),
  zoom_set: (zoom) => ipcRenderer.invoke('zoom:set', { zoom }),

  // WhatsApp
  whatsapp_initialize: () => ipcRenderer.invoke('whatsapp:initialize'),
  whatsapp_get_qr: () => ipcRenderer.invoke('whatsapp:get_qr'),
  whatsapp_status: () => ipcRenderer.invoke('whatsapp:status'),
  whatsapp_send_text: (phone, message) => ipcRenderer.invoke('whatsapp:send_text', { phone, message }),
  whatsapp_send_file: (phone, filePath, filename, caption) => ipcRenderer.invoke('whatsapp:send_file', { phone, filePath, filename, caption }),
  whatsapp_disconnect: () => ipcRenderer.invoke('whatsapp:disconnect'),
  whatsapp_logout: () => ipcRenderer.invoke('whatsapp:logout'),
  whatsapp_check_number: (phone) => ipcRenderer.invoke('whatsapp:check_number', { phone }),
  whatsapp_get_messages_stats: () => ipcRenderer.invoke('whatsapp:get_messages_stats'),
  whatsapp_update_messages_limit: (limit) => ipcRenderer.invoke('whatsapp:update_messages_limit', { limit }),
  whatsapp_reset_messages_count: () => ipcRenderer.invoke('whatsapp:reset_messages_count'),
  
  file_delete: (filePath) => ipcRenderer.invoke('file:delete', { filePath }),

  // Customer Display
  customer_display_connect: () => ipcRenderer.invoke('customer_display:connect'),
  customer_display_disconnect: () => ipcRenderer.invoke('customer_display:disconnect'),
  customer_display_send_text: (text) => ipcRenderer.invoke('customer_display:send_text', { text }),
  customer_display_show_welcome: () => ipcRenderer.invoke('customer-display:welcome'),
  customer_display_show_thank: () => ipcRenderer.invoke('customer-display:thankyou'),
  customer_display_show_total: (data) => ipcRenderer.invoke('customer-display:total', data?.total || data, data?.currency || 'SAR'),
  customer_display_clear: () => ipcRenderer.invoke('customer-display:clear'),

  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  
  on: (channel, callback) => {
    try{ ipcRenderer.removeAllListeners(channel); }catch(_){ }
    ipcRenderer.on(channel, (_ev, data) => { try{ callback && callback(data); }catch(_){ } });
  },
});

// ZATCA Electronic Invoice APIs
contextBridge.exposeInMainWorld('electronAPI', {
  zatca: {
    // إعدادات ZATCA
    getConfig: () => ipcRenderer.invoke('zatca:getConfig'),
    saveConfig: (config) => ipcRenderer.invoke('zatca:saveConfig', config),
    
    // إدارة الشهادات
    generateCSR: (data) => ipcRenderer.invoke('zatca:generateCSR', data),
    submitCSR: (csr, otp) => ipcRenderer.invoke('zatca:submitCSR', csr, otp),
    installCertificate: (certData) => ipcRenderer.invoke('zatca:installCertificate', certData),
    
    // الفواتير الإلكترونية
    generateInvoice: (invoiceData) => ipcRenderer.invoke('zatca:generateInvoice', invoiceData),
    signInvoice: (invoiceXML) => ipcRenderer.invoke('zatca:signInvoice', invoiceXML),
    submitInvoice: (signedInvoice) => ipcRenderer.invoke('zatca:submitInvoice', signedInvoice),
    
    // تقارير الامتثال
    complianceCheck: (invoiceData) => ipcRenderer.invoke('zatca:complianceCheck', invoiceData),
    getComplianceReport: () => ipcRenderer.invoke('zatca:getComplianceReport'),
    
    // التكامل مع المبيعات
    generateForSale: (saleData) => ipcRenderer.invoke('sales:zatca_generate', saleData),
    submitForSale: (invoiceData) => ipcRenderer.invoke('sales:zatca_submit', invoiceData),
    getSalesStatus: () => ipcRenderer.invoke('sales:zatca_status'),
    updateSaleZatcaData: (payload) => ipcRenderer.invoke('sales:update_zatca_data', payload)
  },
  
  navigation: {
    goTo: (page) => ipcRenderer.invoke('navigation:goTo', page)
  },
  // Local bridge to submit invoice to your backend
  localZatca: {
    // Option A: submit by sale_id (server builds body)
    submitBySaleId: async (sale_id) => {
      try{
        const res = await ipcRenderer.invoke('zatca:submitLocal', { sale_id });
        if(!res || res.success !== true){
          const detail = res && (res.message || res.error || res.data) || 'Unknown error';
          throw new Error(typeof detail==='string' ? detail : JSON.stringify(detail));
        }
        return res;
      }catch(e){
        // Bubble up rich error to renderer for clear display
        throw new Error('فشل الإرسال: ' + (e && e.message || String(e)));
      }
    },
    // Option B: submit with explicit body payload (exact structure you provided)
    submitWithBody: async (body) => {
      try{
        const res = await ipcRenderer.invoke('zatca:submitLocal', { body });
        if(!res || res.success !== true){
          const detail = res && (res.message || res.error || res.data) || 'Unknown error';
          throw new Error(typeof detail==='string' ? detail : JSON.stringify(detail));
        }
        return res;
      }catch(e){
        throw new Error('فشل الإرسال: ' + (e && e.message || String(e)));
      }
    }
  }
});