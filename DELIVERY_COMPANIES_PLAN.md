# خطة تنفيذ ميزة "شركات التوصيل الخاصة بالسعودية"

## نظرة عامة
إضافة ميزة متكاملة لإدارة شركات التوصيل (مثل: Jahez, HungerStation, Toyou) مع دعم نسبة الخصم الخاصة بكل شركة، وتطبيقها في شاشة البيع، وإظهارها في التقارير.

---

## الملفات المتأثرة

### ملفات **جديدة** (5 ملفات)
| الملف | الوصف |
|-------|-------|
| `src/main/delivery_companies.js` | Backend CRUD كامل لشركات التوصيل |
| `src/renderer/delivery_companies/index.html` | شاشة إدارة شركات التوصيل |
| `src/renderer/delivery_companies/renderer.js` | منطق شاشة الإدارة |
| `src/renderer/reports/delivery_report.html` | واجهة تقرير التوصيل |
| `src/renderer/reports/delivery_report.js` | منطق تقرير التوصيل |

### ملفات **معدَّلة** (9 ملفات)
| الملف | التعديل |
|-------|---------|
| `src/main/main.js` | import + تسجيل `registerDeliveryCompaniesIPC` |
| `src/main/preload.js` | 7 دوال API bridge جديدة |
| `src/main/sales.js` | `ensureTables` + `INSERT` + `SELECT` + handler تقرير جديد |
| `src/renderer/sales/index.html` | قائمة منسدلة `deliveryCompanySelect` |
| `src/renderer/sales/renderer.js` | `computeTotals` + payload + load + reset |
| `src/renderer/reports/index.html` | بطاقة تقرير التوصيل الجديدة |
| `src/renderer/reports/renderer.js` | حدث النقر للبطاقة الجديدة |
| `src/renderer/reports/all_invoices.html` | عمودان جديدان في الجدول |
| `src/renderer/reports/all_invoices.js` | بيانات العمودين في صفوف الجدول |

---

## المرحلة 1: قاعدة البيانات

### جدول `delivery_companies` (جديد)
يُنشأ تلقائياً عبر `ensureTables()` في `src/main/delivery_companies.js`:
```sql
CREATE TABLE IF NOT EXISTS delivery_companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### أعمدة جديدة في جدول `sales`
تُضاف في `ensureTables()` داخل `src/main/sales.js` (بعد أعمدة السائقين):
```sql
ALTER TABLE sales ADD COLUMN delivery_company_id INT NULL AFTER driver_id;
ALTER TABLE sales ADD COLUMN delivery_company_name VARCHAR(255) NULL;
ALTER TABLE sales ADD COLUMN delivery_discount_amount DECIMAL(12,2) NULL;
ALTER TABLE sales ADD INDEX idx_delivery_company_id (delivery_company_id);
```
> كل عمود يُتحقق منه بـ `SHOW COLUMNS FROM sales LIKE '...'` قبل الإضافة.

---

## المرحلة 2: Backend — `src/main/delivery_companies.js` (جديد)

يتبع نفس بنية `src/main/drivers.js`:

```
registerDeliveryCompaniesIPC()
  └── ensureTables(conn)
  └── delivery_companies:list   ← يدعم { only_active: true }
  └── delivery_companies:add    ← تحقق: name مطلوب، discount_percent بين 0-100
  └── delivery_companies:update
  └── delivery_companies:toggle ← تبديل active/inactive
  └── delivery_companies:delete
  └── delivery_companies:get
```

---

## المرحلة 3: تعديل `src/main/sales.js`

### 3.1 في `ensureTables(conn)`
أضف فحص الأعمدة الثلاثة الجديدة (بعد أعمدة driver).

### 3.2 في `ipcMain.handle('sales:create')`
أضف الحقول الثلاثة لقائمة الـ INSERT:
```javascript
delivery_company_id, delivery_company_name, delivery_discount_amount
```

### 3.3 في `ipcMain.handle('sales:list')`
أضف الحقول للـ SELECT.

### 3.4 Handler جديد: `sales:delivery_report`
```javascript
ipcMain.handle('sales:delivery_report', async (_e, { company_id, from, to }) => {
  // SELECT من sales مع فلترة company_id (اختياري) وفترة التاريخ
  // RETURNS: { items: [...], totals: { count, sub_total, vat_total, grand_total, delivery_discount } }
});
```

---

## المرحلة 4: تعديل `src/main/main.js`

بعد السطر 22 (`registerDriversIPC`):
```javascript
const { registerDeliveryCompaniesIPC } = require('./delivery_companies');
// ...
registerDeliveryCompaniesIPC();
```

---

## المرحلة 5: تعديل `src/main/preload.js`

بعد قسم Drivers API، أضف:
```javascript
// Delivery Companies
delivery_companies_list: (q) => ipcRenderer.invoke('delivery_companies:list', q),
delivery_companies_add: (p) => ipcRenderer.invoke('delivery_companies:add', p),
delivery_companies_update: (id, p) => ipcRenderer.invoke('delivery_companies:update', { id }, p),
delivery_companies_toggle: (id) => ipcRenderer.invoke('delivery_companies:toggle', { id }),
delivery_companies_delete: (id) => ipcRenderer.invoke('delivery_companies:delete', { id }),
delivery_companies_get: (id) => ipcRenderer.invoke('delivery_companies:get', { id }),
sales_delivery_report: (q) => ipcRenderer.invoke('sales:delivery_report', q),
```

---

## المرحلة 6: Frontend — شاشة الإدارة

### `src/renderer/delivery_companies/index.html` (جديد)
منسوخ من `src/renderer/drivers/index.html` مع:
- العنوان: **شركات التوصيل**
- حقلان فقط: `اسم الشركة` + `نسبة الخصم (%)`
- جدول: `#` | `الاسم` | `نسبة الخصم` | `الحالة` | `الإجراءات`

### `src/renderer/delivery_companies/renderer.js` (جديد)
منسوخ من `src/renderer/drivers/renderer.js` مع:
- استدعاء `window.api.delivery_companies_*`
- تحقق: `discount_percent` بين 0 و100
- عرض `item.discount_percent + '%'` في الجدول

### إضافة رابط في القائمة الرئيسية
في `src/renderer/main/` — أضف بطاقة "شركات التوصيل" بجانب بطاقة السائقين.

---

## المرحلة 7: تعديل شاشة البيع (POS)

### 7.1 `src/renderer/sales/index.html`
أضف بجانب `driverSelect`:
```html
<label class="field-label font-black text-black">شركة التوصيل</label>
<select id="deliveryCompanySelect" class="font-black text-black">
  <option value="">بدون توصيل</option>
</select>
<div id="deliveryDiscountInfo" style="display:none" class="text-sm text-green-600 font-bold mt-1">
  خصم التوصيل: <span id="deliveryDiscountValue">0.00</span>
</div>
```

### 7.2 `src/renderer/sales/renderer.js`

#### أ) متغيرات عامة (بجانب تعريفات driverSelect):
```javascript
const deliveryCompanySelect = document.getElementById('deliveryCompanySelect');
let __allDeliveryCompanies = [];
let __selectedDeliveryCompany = null;
let __lastDeliveryDiscountAmount = 0; // يُستخدم في payload الحفظ
```

#### ب) تحميل الشركات (في دالة التهيئة):
```javascript
async function loadDeliveryCompanies() {
  const res = await window.api.delivery_companies_list({ only_active: true });
  __allDeliveryCompanies = (res && res.items) || [];
  deliveryCompanySelect.innerHTML =
    `<option value="">بدون توصيل</option>` +
    __allDeliveryCompanies.map(c =>
      `<option value="${c.id}">${c.name} (${c.discount_percent}%)</option>`
    ).join('');
}
```

#### ج) حدث تغيير القائمة:
```javascript
deliveryCompanySelect.onchange = () => {
  const id = deliveryCompanySelect.value;
  __selectedDeliveryCompany = id
    ? __allDeliveryCompanies.find(c => String(c.id) === id) || null
    : null;
  computeTotals();
};
```

#### د) داخل `computeTotals()` — بعد حساب `subAfterDiscount` وقبل VAT:
```javascript
// خصم شركة التوصيل
__lastDeliveryDiscountAmount = 0;
if (__selectedDeliveryCompany && Number(__selectedDeliveryCompany.discount_percent) > 0) {
  const pct = Number(__selectedDeliveryCompany.discount_percent) / 100;
  __lastDeliveryDiscountAmount = Number((subAfterDiscount * pct).toFixed(2));
  subAfterDiscount = Math.max(0, subAfterDiscount - __lastDeliveryDiscountAmount);
}
// تحديث عرض الخصم
const deliveryDiscountInfo = document.getElementById('deliveryDiscountInfo');
const deliveryDiscountValueEl = document.getElementById('deliveryDiscountValue');
if (deliveryDiscountInfo && deliveryDiscountValueEl) {
  if (__lastDeliveryDiscountAmount > 0) {
    deliveryDiscountValueEl.textContent = fmtMoney(__lastDeliveryDiscountAmount);
    deliveryDiscountInfo.style.display = '';
  } else {
    deliveryDiscountInfo.style.display = 'none';
  }
}
```

#### هـ) في payload الحفظ (بجانب `driver_id`):
```javascript
if (__selectedDeliveryCompany) {
  payload.delivery_company_id = Number(__selectedDeliveryCompany.id);
  payload.delivery_company_name = __selectedDeliveryCompany.name;
  payload.delivery_discount_amount = __lastDeliveryDiscountAmount;
}
```

#### و) عند إعادة تعيين الفاتورة:
```javascript
deliveryCompanySelect.value = '';
__selectedDeliveryCompany = null;
__lastDeliveryDiscountAmount = 0;
```

---

## المرحلة 8: التقارير

### 8.1 `src/renderer/reports/all_invoices.html`
أضف في رأس الجدول:
```html
<th>شركة التوصيل</th>
<th>خصم التوصيل</th>
```

### 8.2 `src/renderer/reports/all_invoices.js`
في دالة `renderRows` — أضف للصف:
```javascript
const deliveryName = s.delivery_company_name || '—';
const deliveryDisc = s.delivery_discount_amount
  ? Number(s.delivery_discount_amount).toFixed(2)
  : '—';
```

### 8.3 `src/renderer/reports/delivery_report.html` (جديد)
بنية مشابهة لـ `customer_invoices.html`:
- **فلتر الشركة**: قائمة منسدلة (جميع الشركات / شركة محددة)
- **فلتر التاريخ**: من — إلى (`datetime-local`)
- **أزرار**: تطبيق | طباعة | تصدير PDF
- **جدول**: `#` | رقم الفاتورة | التاريخ | العميل | المجموع | الضريبة | الإجمالي | خصم التوصيل
- **إجماليات** في `tfoot`: عدد الفواتير | مجموع الإجماليات | إجمالي خصومات التوصيل

### 8.4 `src/renderer/reports/delivery_report.js` (جديد)
```javascript
async function loadCompanies() {
  const res = await window.api.delivery_companies_list({});
  // تملأ قائمة companyFilter
}

async function loadReport() {
  const res = await window.api.sales_delivery_report({
    company_id: companyFilter.value || null,
    from: fromAt.value,
    to: toAt.value,
  });
  renderTable(res.items);
  renderTotals(res.totals);
}
```

### 8.5 `src/renderer/reports/index.html`
أضف بطاقة "تقرير التوصيل" بعد بطاقة العملاء:
```html
<div id="deliveryReport" class="bg-white rounded-2xl shadow-xl p-6 cursor-pointer ...">
  <h3 class="text-xl font-black text-gray-800 mb-2">تقرير التوصيل</h3>
  <p class="text-gray-600">فواتير شركات التوصيل للفترة المحددة</p>
</div>
```

### 8.6 `src/renderer/reports/renderer.js`
أضف بعد آخر بطاقة موجودة:
```javascript
const deliveryReportCard = document.getElementById('deliveryReport');
if (deliveryReportCard) {
  deliveryReportCard.onclick = () => { window.location.href = './delivery_report.html'; }
}
```
> أضف أيضاً فحص الصلاحيات: `if(!canReport('reports.view_delivery')) hide('deliveryReport');`

---

## تسلسل التنفيذ

```
1. إنشاء src/main/delivery_companies.js
2. تعديل src/main/sales.js (ensureTables + INSERT + SELECT + handler جديد)
3. تعديل src/main/main.js (import + register)
4. تعديل src/main/preload.js (API bridge)
5. إنشاء src/renderer/delivery_companies/index.html + renderer.js
6. تعديل src/renderer/sales/index.html (إضافة deliveryCompanySelect)
7. تعديل src/renderer/sales/renderer.js (متغيرات + computeTotals + payload + reset)
8. تعديل src/renderer/reports/all_invoices.html + all_invoices.js (عمودان جديدان)
9. إنشاء src/renderer/reports/delivery_report.html + delivery_report.js
10. تعديل src/renderer/reports/index.html + renderer.js (بطاقة التقرير)
```

---

## نقاط حرجة يجب الانتباه إليها

1. **ترتيب الخصم**: خصم التوصيل يُطبَّق **بعد** جميع الخصومات الأخرى (percent, amount, coupon, offer) وقبل حساب VAT.

2. **المتغير العام `__lastDeliveryDiscountAmount`**: يُعلَن خارج `computeTotals` ويُحدَّث بداخلها، ثم يُستخدَم في payload الحفظ — نفس نمط `__globalOffer`.

3. **فحص الأعمدة**: في `sales.js`، استخدم `SHOW COLUMNS FROM sales LIKE '...'` قبل كل `ALTER TABLE` لتجنب الأخطاء عند إعادة التشغيل.

4. **الطباعة**: في `src/renderer/sales/print.html`، أضف عرض `delivery_company_name` و`delivery_discount_amount` إن وُجدا.

5. **الصلاحيات**: أضف مفتاح `reports.view_delivery` في نظام الصلاحيات الموجود.

---

## التحقق من التنفيذ

1. **شاشة الإدارة**: أضف شركة جديدة بنسبة 10% → تأكد من ظهورها في الجدول.
2. **شاشة البيع**: اختر الشركة من القائمة → تحقق من تطبيق الخصم على الإجمالي.
3. **حفظ الفاتورة**: أنجز بيعاً → افتح قاعدة البيانات وتحقق من حقول `delivery_*` في جدول `sales`.
4. **تقرير الكل**: افتح "كل الفواتير" → تحقق من ظهور عمودَي التوصيل.
5. **تقرير التوصيل**: اختر شركة وفترة زمنية → تحقق من صحة البيانات والإجماليات.
