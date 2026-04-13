# خطة إضافة طريقة دفع "تحويل بنكي"

## نظرة عامة

إضافة طريقة دفع جديدة `bank_transfer` (تحويل بنكي) على غرار الطرق الموجودة (`tamara`, `tabby`) بدون أي تغييرات على قاعدة البيانات.

---

## الملفات المطلوب تعديلها

| الملف | عدد التغييرات |
|-------|--------------|
| `src/renderer/sales/renderer.js` | 7 تغييرات |
| `src/renderer/reports/daily.js` | 2 تغييرات |
| `src/main/sales.js` | 2 تغييرات |
| `src/renderer/settings/index.html` | 1 إضافة |

---

## التفاصيل

### 1. `src/renderer/sales/renderer.js`

#### 1a — مفتاح الترجمة (السطر 113)
```js
// بعد: payMethodTabby: isAr ? 'تابي' : 'Tabby',
payMethodBankTransfer: isAr ? 'تحويل بنكي' : 'Bank Transfer',
```

#### 1b — خريطة `payLabels` (السطر 420)
```js
// تغيير:
const payLabels = { ..., tabby: t.payMethodTabby };
// إلى:
const payLabels = { ..., tabby: t.payMethodTabby, bank_transfer: t.payMethodBankTransfer };
```

#### 1c — Placeholder حقل cashReceived (السطر 436)
```js
// تغيير:
} else if(pmEl.value === 'card' || pmEl.value === 'tamara' || pmEl.value === 'tabby'){
// إلى:
} else if(pmEl.value === 'card' || pmEl.value === 'tamara' || pmEl.value === 'tabby' || pmEl.value === 'bank_transfer'){
```

#### 1d — `applyPaymentFieldState()` (السطر 586)
```js
// تغيير:
} else if(method === 'credit' || method === 'card' || method === 'tamara' || method === 'tabby'){
// إلى:
} else if(method === 'credit' || method === 'card' || method === 'tamara' || method === 'tabby' || method === 'bank_transfer'){
```

#### 1e — `updateRemainingBeforePrint()` (السطر 609)
```js
// تغيير:
} else if(pm === 'card' || pm === 'network' || pm === 'tamara' || pm === 'tabby'){
// إلى:
} else if(pm === 'card' || pm === 'network' || pm === 'tamara' || pm === 'tabby' || pm === 'bank_transfer'){
```

#### 1f — `PM_META` في `showPaymentMethodsModal()` (السطر 1017)
```js
// بعد إدخال tabby:
bank_transfer: {
  label: (__currentLang.payMethodBankTransfer || 'تحويل بنكي'),
  icon: '🏦',
  grad: 'from-sky-400 to-blue-600',
  ring: 'ring-sky-500',
  bg: 'bg-sky-50',
  text: 'text-sky-700'
},
```

#### 1g — payload الإرسال `pay_card_amount` (السطر 3097)
```js
// تغيير:
pay_card_amount: (paymentMethod.value==='mixed' && window.__mixed_payment)
  ? Number(window.__mixed_payment.card||0)
  : (paymentMethod.value==='card'
      ? Number((window.__sale_calcs?.grand_total ?? grand).toFixed(2))
      : null),
// إلى:
pay_card_amount: (paymentMethod.value==='mixed' && window.__mixed_payment)
  ? Number(window.__mixed_payment.card||0)
  : (paymentMethod.value==='card' || paymentMethod.value==='bank_transfer'
      ? Number((window.__sale_calcs?.grand_total ?? grand).toFixed(2))
      : null),
```

---

### 2. `src/renderer/reports/daily.js`

#### 2a — مفتاح الترجمة (السطر 42)
```js
// بعد: mixed: isAr ? 'مختلط' : 'Mixed',
bank_transfer: isAr ? 'تحويل بنكي' : 'Bank Transfer',
```

#### 2b — دالة `labelPaymentMethod()` (السطر 202)
```js
// تغيير:
if(m==='mixed') return __currentLang.mixed || 'مختلط';
return method||'';
// إلى:
if(m==='mixed') return __currentLang.mixed || 'مختلط';
if(m==='bank_transfer') return __currentLang.bank_transfer || 'تحويل بنكي';
return method||'';
```

> **ملاحظة**: منطق التجميع في التقرير لا يحتاج تغييرًا. الـ `else` branch الموجود في السطر 777 يتعامل تلقائيًا مع أي طريقة غير معروفة بالمبلغ الكامل. كذلك المرتجعات (السطر 814) تُطرح تلقائيًا.

---

### 3. `src/main/sales.js`

#### 3a — قائمة الطرق المسموح بها في `settle_full` (السطر 956)
```js
// تغيير:
const okMethod = ['cash','card','tamara','tabby'].includes(method);
// إلى:
const okMethod = ['cash','card','tamara','tabby','bank_transfer'].includes(method);
```

#### 3b — تحديث حقول السداد (السطر 975)
```js
// تغيير:
} else if(method==='card' || method==='tamara' || method==='tabby'){
// إلى:
} else if(method==='card' || method==='tamara' || method==='tabby' || method==='bank_transfer'){
```

---

### 4. `src/renderer/settings/index.html`

إضافة checkbox جديد في قائمة طرق الدفع بعد `tabby`:

```html
<div style="background: white; border: 1px solid #a5f3fc; border-radius: 4px; padding: 6px; display: flex; align-items: center; gap: 6px;">
  <input type="checkbox" class="pm" value="bank_transfer" style="width: 15px; height: 15px; accent-color: #0891b2; cursor: pointer; flex-shrink: 0;">
  <label style="font-family: 'Cairo', sans-serif; font-weight: 700; font-size: 11px; color: #374151; cursor: pointer; margin: 0; flex: 1;">تحويل بنكي</label>
</div>
```

---

## قرارات التصميم

| القرار | السبب |
|--------|-------|
| استخدام `pay_card_amount` لتخزين مبلغ التحويل | نفس نمط `tamara` و`tabby` — لا تغيير في قاعدة البيانات |
| قيمة الـ key: `bank_transfer` | اسم واضح وصريح يتوافق مع `payment_method VARCHAR(32)` |
| لا يوجد `imgSrc` في `PM_META` | لا يوجد لوغو رسمي للتحويل البنكي |
| إيقاف حقل `cashReceived` | نفس سلوك `card`/`tamara`/`tabby` — الدفع غير نقدي |

---

## الحالات الحدية

- **المرتجعات**: محجوزة — الـ `else if(pm)` branch في السطر 814 يطرح `bank_transfer` تلقائيًا ✅
- **الفواتير الآجلة**: يمكن تسديدها عبر تحويل بنكي بعد التعديل في `settle_full` ✅
- **التقارير**: تظهر كصف مستقل بتسمية "تحويل بنكي" ✅
- **المبلغ المتبقي**: يظهر `0.00` مثل باقي الطرق غير النقدية ✅
- **لا تغيير في DB schema**: العمود `payment_method VARCHAR(32)` يستوعب القيمة ✅

---

## التحقق من الصحة

1. **الإعدادات**: فعّل "تحويل بنكي" من الإعدادات → طرق الدفع
2. **شاشة المبيعات**: تأكد أن الزر يظهر في نافذة اختيار طريقة الدفع
3. **إنشاء فاتورة**: أنشئ فاتورة باستخدام "تحويل بنكي"
4. **التقرير اليومي**: تأكد أن مبلغ التحويل البنكي يظهر كصف منفصل
5. **المرتجع**: أنشئ إشعار دائن وتحقق من طرح المبلغ في التقرير
6. **سداد آجل**: تأكد من إمكانية تسديد فاتورة آجل بالتحويل البنكي
