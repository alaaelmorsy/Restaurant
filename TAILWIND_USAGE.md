# Tailwind CSS - دليل الاستخدام

## ✅ تم إعداد Tailwind CSS بنجاح!

تم تثبيت وإعداد **Tailwind CSS v3** في المشروع بدون التأثير على الكود الحالي.

---

## 📁 الملفات المُنشأة

1. **`tailwind.config.js`** - ملف إعدادات Tailwind
2. **`postcss.config.js`** - إعدادات PostCSS
3. **`src/styles/tailwind.css`** - ملف CSS المصدر
4. **`src/styles/output.css`** - ملف CSS المُجمّع (سيتم إنشاؤه تلقائياً)

---

## 🚀 كيفية الاستخدام

### 1️⃣ **بناء ملف CSS (Build)**

```bash
npm run tailwind:build
```

هذا الأمر:
- يقرأ `src/styles/tailwind.css`
- يجمّع كل Tailwind classes المستخدمة
- ينتج `src/styles/output.css` (مصغّر)

### 2️⃣ **وضع المراقبة (Watch Mode)**

```bash
npm run tailwind:watch
```

يراقب التغييرات في ملفات HTML/JS ويعيد البناء تلقائياً.

---

## 📝 إضافة Tailwind لصفحة HTML جديدة

### الخطوة 1: أضف الرابط في `<head>`

```html
<link rel="stylesheet" href="../styles/output.css">
```

### الخطوة 2: استخدم Classes مباشرة

```html
<div class="flex items-center justify-between p-4 bg-blue-500 text-white rounded-lg">
  <h1 class="text-2xl font-bold">مرحباً</h1>
  <button class="px-4 py-2 bg-white text-blue-500 rounded hover:bg-gray-100">
    اضغط هنا
  </button>
</div>
```

### الخطوة 3: اجمع التغييرات

```bash
npm run tailwind:build
```

---

## 🎨 ألوان مخصصة جاهزة

تم إعداد ألوان تتماشى مع نظام الألوان الحالي:

```html
<!-- Primary (أزرق) -->
<div class="bg-primary text-white">أساسي</div>

<!-- Secondary (رمادي) -->
<div class="bg-secondary text-white">ثانوي</div>

<!-- Danger (أحمر) -->
<div class="bg-danger text-white">خطر</div>

<!-- Success (أخضر) -->
<div class="bg-success text-white">نجاح</div>
```

---

## 🌐 دعم RTL

تم إعداد دعم RTL افتراضياً:

```html
<!-- تطبيق تلقائي حسب dir -->
<div dir="rtl" class="text-right">
  نص عربي
</div>

<div dir="ltr" class="text-left">
  English text
</div>
```

---

## 🔧 إعدادات متقدمة

### تخصيص ألوان إضافية

في `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      mycolor: '#ff6b6b',
    },
  },
}
```

### إضافة fonts مخصصة

```javascript
fontFamily: {
  cairo: ['Cairo', 'sans-serif'],
}
```

---

## ⚠️ ملاحظات مهمة

1. **لا تُعدّل** ملف `output.css` يدوياً - سيتم استبداله
2. **قبل التوزيع** (dist)، قم بتشغيل:
   ```bash
   npm run tailwind:build
   ```
3. **الملفات القديمة** لم يتم تعديلها - Tailwind اختياري فقط

---

## 📚 أمثلة سريعة

### مثال 1: بطاقة منتج

```html
<div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
  <img src="product.jpg" class="w-full h-48 object-cover rounded mb-4">
  <h3 class="text-xl font-bold mb-2">اسم المنتج</h3>
  <p class="text-gray-600 mb-4">وصف المنتج هنا</p>
  <div class="flex justify-between items-center">
    <span class="text-2xl font-bold text-primary">99.99 ﷼</span>
    <button class="bg-success text-white px-4 py-2 rounded hover:bg-green-600">
      أضف للسلة
    </button>
  </div>
</div>
```

### مثال 2: نموذج إدخال

```html
<form class="space-y-4 max-w-md mx-auto">
  <div>
    <label class="block text-sm font-bold mb-2">الاسم</label>
    <input type="text" 
           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
  </div>
  
  <button class="w-full bg-primary text-white py-3 rounded-lg hover:bg-blue-600 transition-colors">
    إرسال
  </button>
</form>
```

### مثال 3: Grid متجاوب

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div class="bg-white p-4 rounded shadow">عنصر 1</div>
  <div class="bg-white p-4 rounded shadow">عنصر 2</div>
  <div class="bg-white p-4 rounded shadow">عنصر 3</div>
</div>
```

---

## 🔗 روابط مفيدة

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Tailwind Play (تجربة مباشرة)](https://play.tailwindcss.com/)
- [Cheat Sheet](https://tailwindcomponents.com/cheatsheet/)

---

## ✨ الخلاصة

Tailwind CSS الآن **جاهز للاستخدام** في أي صفحة جديدة دون التأثير على الكود الحالي!

**للبدء:**
1. أنشئ صفحة HTML جديدة
2. أضف `<link rel="stylesheet" href="../styles/output.css">`
3. استخدم Tailwind classes
4. شغّل `npm run tailwind:build`

🎉 **استمتع بالاستخدام!**
