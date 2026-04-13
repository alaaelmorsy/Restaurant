# خطة: الدفع الجزئي للفواتير الآجلة

## ملخص تنفيذي
إضافة نظام دفع جزئي للفواتير الآجلة (`payment_method='credit'`) يسمح بتسجيل دفعات متعددة، وعرض المدفوع والمتبقي، مع التكامل في التقارير وشاشة عرض الفاتورة.

---

## الحالة الراهنة

| الملف | الدور |
|---|---|
| `src/renderer/payments/index.html` | شاشة دفع الفاتورة الآجلة |
| `src/renderer/payments/renderer.js` | منطق الشاشة + `doSettle()` → `sales_settle_full` |
| `src/main/sales.js` | IPC handlers: `sales:settle_full`, `sales:list_credit` |
| `src/main/preload.js` | يكشف API للـ renderer |
| `src/renderer/sales/print.html` | عرض الفاتورة (يحتوي `#paidRow`, `#remainRow`) |
| `src/renderer/reports/unpaid_invoices.js` | تقرير الفواتير غير المدفوعة |
| `src/renderer/reports/credit_invoices.js` | تقرير الفواتير الآجلة |
| `src/main/api-server.js` | API للأجهزة الثانوية |

### تدفق السداد الحالي
```
[شاشة المدفوعات] → btnSettle → openSettleDialog()
                 → doSettle() → sales_settle_full IPC
                 → UPDATE sales SET payment_status='paid', settled_at=NOW()
                 → الفاتورة تختفي من القائمة
```

### أعمدة جدول sales ذات الصلة
- `payment_status ENUM('unpaid','paid') DEFAULT 'paid'`
- `grand_total DECIMAL(12,2)`
- `settled_at DATETIME NULL`
- `settled_method VARCHAR(32) NULL`
- `settled_cash DECIMAL(12,2) NULL`
- `pay_cash_amount`, `pay_card_amount`

---

## التغييرات المطلوبة

### 1. قاعدة البيانات

#### 1.1 إضافة عمود `amount_paid` لجدول `sales`
في دالة `ensureTables(conn)` في `src/main/sales.js`:
```sql
ALTER TABLE sales ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0;
```
منطق الحالة (بدون تغيير ENUM الحالي):
- `payment_status='unpaid'` + `amount_paid=0` → **آجل (غير مدفوعة)**
- `payment_status='unpaid'` + `amount_paid>0` → **مدفوع جزئياً**
- `payment_status='paid'` → **مدفوع بالكامل**

#### 1.2 جدول جديد `invoice_payments`
في نفس الدالة `ensureTables(conn)`:
```sql
CREATE TABLE IF NOT EXISTS invoice_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  method VARCHAR(32) NOT NULL,
  paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes VARCHAR(255) NULL,
  KEY idx_sale_id (sale_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**الملف المعدَّل:** `src/main/sales.js` (دالة `ensureTables`)

---

### 2. IPC Handlers الجديدة

**الملف المعدَّل:** `src/main/sales.js`

#### 2.1 `ipcMain.handle('sales:pay_partial', ...)`
```
payload: { sale_id, amount, method, notes? }

1. تحقق: الفاتورة موجودة + payment_method='credit' + payment_status='unpaid'
2. تحقق: amount > 0  &&  amount <= (grand_total - amount_paid)
3. INSERT INTO invoice_payments (sale_id, amount, method, notes, paid_at)
4. UPDATE sales SET amount_paid = amount_paid + ? WHERE id=?
5. إذا (amount_paid_new >= grand_total):
     نفّذ منطق الإغلاق الكامل:
       UPDATE sales SET payment_status='paid', settled_at=NOW(),
              settled_method=method, settled_cash=(if cash), ...
6. أرسل 'sales:changed' لإشعار النوافذ الأخرى
7. return { ok:true, amount_paid, remaining, is_fully_paid }
```

#### 2.2 `ipcMain.handle('sales:get_payments', ...)`
```
param: sale_id (number)

SELECT * FROM invoice_payments WHERE sale_id=? ORDER BY paid_at ASC
return { ok:true, payments: [...] }
```

**الملف المعدَّل:** `src/main/preload.js` — إضافة سطرين:
```javascript
sales_pay_partial: (p) => ipcRenderer.invoke('sales:pay_partial', p),
sales_get_payments: (id) => ipcRenderer.invoke('sales:get_payments', id),
```

---

### 3. شاشة المدفوعات

#### 3.1 `src/renderer/payments/index.html`
- إضافة **عمود "المتبقي"** بعد عمود "الإجمالي" في `<thead>` و`<tbody>`
- إضافة **حوار الدفع الجزئي** (`#dlgPartial`):
```html
<div id="dlgPartial" style="display:none; position:fixed; inset:0; ...">
  <!-- رأس الحوار -->
  <div>💰 دفع جزئي على الفاتورة #<span id="dlgPartialInvNo"></span></div>

  <!-- ملخص المبالغ -->
  <div>إجمالي الفاتورة: <span id="dlgPartialTotal"></span></div>
  <div>المدفوع حتى الآن: <span id="dlgPartialPaid"></span></div>
  <div>المتبقي: <span id="dlgPartialRemaining"></span></div>

  <!-- سجل الدفعات السابقة -->
  <table id="dlgPartialHistory">...</table>

  <!-- حقول الدفع -->
  <input id="partialAmount" type="number" placeholder="المبلغ المراد دفعه">
  <select id="partialMethod">كاش/شبكة/تمارا/تابي</select>

  <!-- أزرار -->
  <button id="dlgPartialCancel">إلغاء</button>
  <button id="dlgPartialPay">💰 دفع الجزء</button>
  <button id="dlgPartialSettleAll">✅ سداد كامل المتبقي</button>
</div>
```

#### 3.2 `src/renderer/payments/renderer.js`
- **`render(items)`**: تعديل HTML كل صف:
  - عمود الحالة: يعرض "⚡ مدفوع جزئياً" + مبلغ إذا `amount_paid > 0`
  - عمود المتبقي: `grand_total - amount_paid`
  - زر جديد: `<button data-act="partial" data-id="${s.id}">💰 دفع جزئي</button>`
- **`onRowsClick`**: إضافة حالة `act==='partial'` → `openPartialDialog(sale)`
- **`openPartialDialog(sale)`**:
  - اجلب `sales_get_payments(sale.id)` → عرض السجل
  - اعبئ الحقول: total, paid, remaining
- **`doPartialPay()`**:
  - استدعِ `window.api.sales_pay_partial({ sale_id, amount, method })`
  - إذا `is_fully_paid=true`: أغلق الحوار وأزِل الصف من القائمة
  - إذا لا: حدّث القيم المعروضة وأعد تحميل السجل
- **`doSettleAllRemaining()`**: يستدعي `doPartialPay` بالمبلغ المتبقي كاملاً
- إضافة ترجمات `ar`/`en` للنصوص الجديدة في `__T`

---

### 4. عرض الفاتورة (`src/renderer/sales/print.html`)

الملف يحتوي مسبقاً على `#paidRow` و`#remainRow`. التعديلات في `src/renderer/sales/renderer.js`:
- بعد جلب بيانات الفاتورة: استدعِ `window.api.sales_get_payments(id)`
- إذا كان هناك دفعات:
  - اعرض جدول "سجل الدفعات" (التاريخ / المبلغ / الطريقة)
  - اعبئ `#paidRow` بإجمالي المدفوع
  - اعبئ `#remainRow` بالمتبقي (`grand_total - amount_paid`)

---

### 5. التقارير

#### `src/renderer/reports/unpaid_invoices.js`
- تعديل عمود الحالة ليميز بين "غير مدفوعة" و"مدفوعة جزئياً"
- إضافة أعمدة "المدفوع" و"المتبقي"
- تعديل إجماليات التقرير: إجمالي الديون / إجمالي المدفوع / إجمالي المتبقي الفعلي

#### `src/renderer/reports/credit_invoices.js`
- نفس تعديلات unpaid_invoices أعلاه

---

### 6. API Server للأجهزة الثانوية (`src/main/api-server.js`)

```javascript
// تسجيل دفعة جزئية
router.post('/invoices/:id/pay-partial', async (req, res) => {
  const data = await payPartial(Number(req.params.id), req.body);
  res.json(data);
});

// جلب سجل الدفعات
router.get('/invoices/:id/payments', async (req, res) => {
  const data = await getInvoicePayments(Number(req.params.id));
  res.json(data);
});
```

وتعديل `src/main/sales.js` في handlers `sales:pay_partial` و`sales:get_payments` ليستدعيا `fetchFromAPI`/`postToAPI` عندما `isSecondaryDevice()`.

---

## ترتيب التنفيذ

```
الخطوة 1 ← قاعدة البيانات: ensureTables في sales.js
            (amount_paid column + invoice_payments table)
     ↓
الخطوة 2 ← IPC handlers: sales:pay_partial + sales:get_payments
     ↓
الخطوة 3 ← preload.js: كشف الـ API الجديد
     ↓
الخطوة 4 ← شاشة المدفوعات: index.html + renderer.js
     ↓
الخطوة 5 ← عرض الفاتورة: print.html + renderer.js للمبيعات
     ↓
الخطوة 6 ← التقارير: unpaid_invoices.js + credit_invoices.js
     ↓
الخطوة 7 ← API Server: api-server.js (للأجهزة الثانوية)
```

---

## التحقق من التنفيذ

1. **إنشاء فاتورة آجل** من شاشة المبيعات (`payment_method='credit'`)
2. **فتح شاشة المدفوعات** → تظهر الفاتورة بعمود المتبقي = الإجمالي، حالة "آجل"
3. **دفع جزئي**: النقر على "دفع جزئي" → إدخال مبلغ أقل من الإجمالي → "دفع الجزء"
   - ✅ الفاتورة تبقى في القائمة بحالة "مدفوع جزئياً"
   - ✅ عمود المتبقي يتحدث
   - ✅ سجل الدفعات يظهر في الحوار
4. **دفع جزئي ثانٍ**: يتراكم المبلغ المدفوع
5. **سداد كامل المتبقي**: "سداد كامل المتبقي" → الفاتورة تختفي من القائمة
6. **عرض الفاتورة**: فتح الفاتورة → يظهر سجل الدفعات + إجمالي المدفوع + المتبقي
7. **التقارير**: تقرير غير المدفوعة يميز بين الجزئية والكاملة ويعرض المتبقي الصحيح

---

## ملاحظات تقنية

- **لا تغيير في ENUM** `payment_status`: نكتشف الدفع الجزئي من `amount_paid > 0 && payment_status='unpaid'`
- **الترقية التدريجية**: `amount_paid DEFAULT 0` تجعل الفواتير القديمة تعمل بدون تغيير
- **الأمان**: التحقق من `amount <= (grand_total - amount_paid)` في الـ backend دائماً
- **الطباعة عند الدفع الجزئي**: اختيارية (زر طباعة إيصال الدفعة)
- **التزامن**: إرسال `sales:changed` بعد كل دفعة لتحديث باقي الشاشات
- **MySQL compatibility**: استخدام `IF NOT EXISTS` في ALTER TABLE للتوافق مع MySQL 5.7+
  (ملاحظة: MySQL 5.7 لا تدعم `IF NOT EXISTS` في `ALTER TABLE ADD COLUMN`, يجب استخدام try/catch)
