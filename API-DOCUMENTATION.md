# 📡 دليل استخدام API للجهاز الفرعي

## 🚀 نظرة عامة

الجهاز الفرعي الآن يدعم **جميع الوظائف** مثل الجهاز الرئيسي تماماً عبر API.

---

## 🔐 نظام الصلاحيات

### إرسال User ID في الطلبات:
```javascript
fetch('http://192.168.1.5:4310/api/products', {
  headers: {
    'X-User-ID': '123' // معرّف المستخدم المسجل
  }
})
```

- **Admin / Super**: صلاحيات كاملة تلقائياً
- **Cashier**: حسب الصلاحيات المخصصة

---

## 📋 جميع الـ Endpoints المتاحة

### **1️⃣ المنتجات (Products)**

#### القراءة:
```javascript
// الحصول على قائمة المنتجات
GET /api/products?limit=100&offset=0&q=search&category=drinks

// الحصول على منتج محدد
GET /api/products/123

// البحث بالباركود
GET /api/products/barcode/1234567890

// تحميل الصور دفعة واحدة
GET /api/products-images-batch?ids=1,2,3,4,5

// تحميل العمليات دفعة واحدة
GET /api/products-ops-batch?ids=1,2,3
```

#### الكتابة:
```javascript
// إضافة منتج جديد
POST /api/products
{
  "name": "كابتشينو",
  "name_en": "Cappuccino",
  "barcode": "1234567890",
  "price": 15.50,
  "stock": 100,
  "category": "مشروبات ساخنة",
  "description": "كابتشينو إيطالي",
  "image_blob": "base64...",
  "image_mime": "image/png",
  "is_tobacco": 0,
  "is_active": 1,
  "sort_order": 10
}

// تعديل منتج
PUT /api/products/123
{
  "name": "كابتشينو مميز",
  "price": 18.00,
  ...
}

// حذف منتج
DELETE /api/products/123
```

---

### **2️⃣ العملاء (Customers)**

```javascript
// القراءة
GET /api/customers?q=search&active=1
GET /api/customers/123

// الإضافة
POST /api/customers
{
  "name": "محمد أحمد",
  "phone": "0501234567",
  "email": "mohamed@example.com",
  "address": "الرياض",
  "vat_number": "123456789012345",
  "cr_number": "1234567890",
  "national_address": "AAAA1234",
  "notes": "عميل VIP",
  "is_active": 1
}

// التعديل
PUT /api/customers/123

// الحذف
DELETE /api/customers/123
```

---

### **3️⃣ السائقون (Drivers)**

```javascript
// القراءة
GET /api/drivers?active=1

// الإضافة
POST /api/drivers
{
  "name": "سعد الدوسري",
  "phone": "0551234567",
  "active": 1
}

// التعديل
PUT /api/drivers/123

// الحذف
DELETE /api/drivers/123
```

---

### **4️⃣ المستخدمون (Users)**

```javascript
// القراءة
GET /api/users
GET /api/users/123

// الإضافة
POST /api/users
{
  "username": "cashier1",
  "password": "123456",
  "full_name": "أحمد محمد",
  "role": "cashier", // admin, cashier, super
  "is_active": 1
}

// التعديل (إذا لم ترسل password يبقى كما هو)
PUT /api/users/123
{
  "username": "cashier1",
  "full_name": "أحمد السعيد",
  "role": "cashier",
  "is_active": 1
}

// الحذف
DELETE /api/users/123
```

---

### **5️⃣ الإعدادات (Settings)**

```javascript
// القراءة
GET /api/settings

// التعديل (يمكن تعديل أي حقل)
PUT /api/settings
{
  "company_site": "www.example.com",
  "vat_percent": 15,
  "prices_include_vat": 1,
  "print_copies": 2,
  "default_payment_method": "cash",
  ...
}
```

---

### **6️⃣ العمليات (Operations)**

```javascript
// القراءة
GET /api/operations
GET /api/operations/product/123

// الإضافة
POST /api/operations
{
  "name": "ساخن",
  "sort_order": 1,
  "is_active": 1
}

// التعديل
PUT /api/operations/123

// الحذف
DELETE /api/operations/123
```

---

### **7️⃣ الأنواع (Types)**

```javascript
// القراءة
GET /api/types (النشطة فقط)
GET /api/types/all (الكل)
GET /api/types/123

// الإضافة
POST /api/types
{
  "name": "مشروبات",
  "sort_order": 1,
  "is_active": 1
}

// التعديل
PUT /api/types/123

// الحذف
DELETE /api/types/123
```

---

### **8️⃣ الغرف/الطاولات (Rooms)**

```javascript
// القراءة
GET /api/rooms?section=outdoor&status=available
GET /api/rooms/123/session

// الإضافة
POST /api/rooms
{
  "name": "طاولة 1",
  "section": "داخلي",
  "capacity": 4,
  "status": "available",
  "waiter": "أحمد"
}

// التعديل
PUT /api/rooms/123

// الحذف
DELETE /api/rooms/123
```

---

### **9️⃣ العروض (Offers)**

```javascript
// القراءة
GET /api/offers?active=1
GET /api/offers/123/products

// الإضافة
POST /api/offers
{
  "name": "عرض رمضان",
  "description": "خصم 20%",
  "mode": "percent", // percent, amount
  "value": 20,
  "start_date": "2024-03-01",
  "end_date": "2024-04-01",
  "is_global": 0,
  "is_active": 1
}

// التعديل
PUT /api/offers/123

// الحذف
DELETE /api/offers/123
```

---

### **🔟 المخزون (Inventory)**

```javascript
// القراءة
GET /api/inventory
GET /api/stock

// الإضافة
POST /api/inventory
{
  "name": "حليب",
  "unit": "لتر",
  "stock": 50,
  "is_active": 1
}

// التعديل
PUT /api/inventory/123

// الحذف
DELETE /api/inventory/123
```

---

### **1️⃣1️⃣ المشتريات (Purchases)**

```javascript
// القراءة
GET /api/purchases?from_date=2024-01-01&to_date=2024-12-31

// الإضافة
POST /api/purchases
{
  "supplier_name": "مورد القهوة",
  "purchase_date": "2024-01-15",
  "total_amount": 5000,
  "notes": "دفعة شهرية",
  "items": [
    {
      "inventory_item_id": 5,
      "item_name": "حليب",
      "quantity": 100,
      "unit_price": 20,
      "total_price": 2000
    }
  ]
}

// التعديل
PUT /api/purchases/123

// الحذف
DELETE /api/purchases/123
```

---

### **1️⃣2️⃣ تخصيص الأسعار (Customer Pricing)**

```javascript
// القراءة
GET /api/customer_pricing?customer_id=5
GET /api/customer_pricing/123

// الإضافة
POST /api/customer_pricing
{
  "customer_id": 5,
  "product_id": 10,
  "operation_id": 2, // اختياري
  "mode": "price", // price, discount_percent
  "value": 12.50
}

// التعديل
PUT /api/customer_pricing/123

// الحذف
DELETE /api/customer_pricing/123
```

---

### **1️⃣3️⃣ الفواتير (Invoices)**

```javascript
// القراءة
GET /api/invoices?status=paid&limit=50
GET /api/invoices/123

// الإنشاء
POST /api/invoices
{
  "payment_method": "cash",
  "sub_total": 100,
  "vat_total": 15,
  "grand_total": 115,
  "customer_id": 5,
  "customer_name": "محمد",
  "notes": "تسليم سريع",
  "items": [
    {
      "product_id": 10,
      "name": "كابتشينو",
      "description": "ساخن",
      "price": 15,
      "qty": 2,
      "line_total": 30
    }
  ]
}
```

---

## 🔧 الخدمات الخاصة

### **WhatsApp**

```javascript
// إرسال فاتورة عبر WhatsApp
POST /api/whatsapp/send-invoice
{
  "invoice_id": 123,
  "phone": "966501234567",
  "message": "فاتورتك جاهزة"
}

// التحقق من حالة WhatsApp
GET /api/whatsapp/status
```

---

### **ZATCA (الفوترة الإلكترونية)**

```javascript
// توقيع فاتورة
POST /api/zatca/sign-invoice
{
  "invoice_data": {
    "invoice_no": "INV-001",
    "total": 115,
    ...
  }
}
```

---

### **الطباعة عن بعد**

```javascript
// طباعة فاتورة
POST /api/print/invoice
{
  "invoice_id": 123,
  "printer_name": "Thermal Printer",
  "copies": 2
}
```

---

### **شاشة العميل**

```javascript
// عرض رسالة ترحيب
POST /api/customer-display/show
{
  "action": "welcome",
  "text": "أهلاً وسهلاً"
}

// عرض الإجمالي
POST /api/customer-display/show
{
  "action": "total",
  "text": "115.50"
}

// شكراً
POST /api/customer-display/show
{
  "action": "thankyou",
  "text": "شكراً لزيارتكم"
}

// مسح الشاشة
POST /api/customer-display/show
{
  "action": "clear"
}
```

---

## 💡 مثال كامل: إضافة منتج من الجهاز الفرعي

```javascript
// في ملف products/renderer.js أو أي ملف آخر

async function addProduct() {
  const user = JSON.parse(localStorage.getItem('pos_user'));
  
  const response = await fetch('http://192.168.1.5:4310/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': user.id.toString()
    },
    body: JSON.stringify({
      name: 'كابتشينو',
      name_en: 'Cappuccino',
      price: 15.50,
      stock: 100,
      category: 'مشروبات',
      is_active: 1
    })
  });

  const result = await response.json();
  
  if (result.ok) {
    console.log('تم إضافة المنتج بنجاح! ID:', result.id);
  } else {
    console.error('خطأ:', result.error);
  }
}
```

---

## ⚙️ إعداد الجهاز الفرعي

### **1. من شاشة تسجيل الدخول:**
- اضغط **"إعداد الاتصال بجهاز رئيسي"**
- اختر **"جهاز فرعي"**
- أدخل **IP الجهاز الرئيسي** (مثل: `192.168.1.5`)
- اضغط **"اختبار الاتصال"**
- اضغط **"حفظ"**

### **2. تحديث URL في api-client.js:**
الملف `src/main/api-client.js` سيقرأ تلقائياً من `device-config.json`:
```json
{
  "mode": "secondary",
  "api_host": "192.168.1.5",
  "api_port": 4310
}
```

---

## ✅ الخلاصة

| الوظيفة | مدعومة؟ |
|---------|---------|
| **إضافة/تعديل/حذف المنتجات** | ✅ |
| **إدارة العملاء** | ✅ |
| **إدارة المستخدمين** | ✅ |
| **تعديل الإعدادات** | ✅ |
| **إنشاء فواتير** | ✅ |
| **WhatsApp** | ✅ |
| **ZATCA** | ✅ |
| **الطباعة** | ✅ |
| **شاشة العميل** | ✅ |
| **الصلاحيات** | ✅ |

**الجهاز الفرعي الآن متطابق 100% مع الجهاز الرئيسي!** 🎉
