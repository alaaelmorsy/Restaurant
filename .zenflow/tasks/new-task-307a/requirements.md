# PRD: Customers Screen Internationalization (i18n)

## Overview

The Customers screen (`src/renderer/customers/`) currently displays all UI text exclusively in Arabic. When the application language is switched to English (via Settings), the Customers screen must fully reflect that language change — translating all visible text elements to English.

## Background

The application has an established language system used by other screens (Products, Sales, Settings, Reports, etc.). This system:
- Stores the selected language in `localStorage` under the key `app_lang`
- Persists the locale in the database via `window.api.app_set_locale` / `window.api.app_get_locale`
- Broadcasts language changes to all open windows via `window.api.app_on_locale_changed`
- Uses a `__applyLang(lang)` function per screen to update DOM elements

The Customers screen is missing this i18n integration entirely.

## Goals

- When the app language is **Arabic**, the Customers screen looks and behaves exactly as it does today.
- When the app language is **English**, all visible text on the Customers screen is shown in English.
- Language changes apply immediately without requiring a page reload.
- The implementation follows the exact same pattern used in all other screens.

## Scope

### In Scope

All user-visible text in `src/renderer/customers/index.html` and `src/renderer/customers/renderer.js`:

**Page / Header**
- `<title>` tag: "العملاء - POS SA" → "Customers - POS SA"
- Header span: "إدارة العملاء" → "Customer Management"
- Back button label: "العودة للرئيسية" / "رئيسية" → "Back to Home" / "Home"

**Actions Bar**
- Search placeholder: "البحث بالاسم أو رقم الجوال..." → "Search by name or phone number..."
- Add button label: "إضافة عميل جديد" / "إضافة" → "Add New Customer" / "Add"
- Export Excel button label: "تصدير Excel" / "Excel" → "Export Excel" / "Excel"

**Page Controls**
- Rows label: "📋 عدد الصفوف:" → "📋 Rows per page:"
- Page size options: "صف" suffix → "rows" suffix ("20 صف" → "20 rows", etc.), "عرض الكل" → "Show All"
- Pagination buttons: "الأولى" / "السابقة" / "التالية" / "الأخيرة" → "First" / "Previous" / "Next" / "Last"
- Page counter: "صفحة X من Y (Z عميل)" → "Page X of Y (Z customers)"

**Table Headers**
- "#" stays as-is
- "👤 اسم العميل" → "👤 Customer Name"
- "📱 رقم الجوال" → "📱 Phone"
- "📧 البريد الإلكتروني" → "📧 Email"
- "📍 العنوان" → "📍 Address"
- "⚡ الحالة" → "⚡ Status"
- "⚙️ العمليات" → "⚙️ Actions"

**Table Rows (dynamic)**
- Active status badge: "نشط" → "Active"
- Inactive status badge: "موقوف" → "Inactive"
- Row action buttons: "تعديل" → "Edit", "إيقاف" → "Deactivate", "تفعيل" → "Activate", "حذف" → "Delete"
- Button titles (tooltips): translated accordingly

**Add/Edit Dialog**
- Dialog title (add): "➕ إضافة عميل جديد" → "➕ Add New Customer"
- Dialog title (edit): "✏️ تعديل بيانات العميل" → "✏️ Edit Customer"
- Labels: "👤 اسم العميل الكامل" → "👤 Full Name", "📱 رقم الجوال" → "📱 Phone", "📧 البريد الإلكتروني" → "📧 Email", "📍 العنوان" → "📍 Address", "🏢 الرقم الضريبي (اختياري)" → "🏢 VAT Number (optional)", "🧾 رقم السجل التجاري (اختياري)" → "🧾 Commercial Register No. (optional)", "🏠 العنوان الوطني (اختياري)" → "🏠 National Address (optional)", "📝 ملاحظات إضافية" → "📝 Additional Notes"
- Input placeholders translated accordingly
- Cancel button: "❌ إلغاء" → "❌ Cancel"
- Save button: "✅ حفظ البيانات" → "✅ Save"

**Confirmation Dialog**
- Default title: "تأكيد العملية" → "Confirm Action"
- Default message: "هل أنت متأكد من هذا الإجراء؟" → "Are you sure you want to proceed?"
- Delete confirm title: "تأكيد حذف العميل" → "Confirm Delete Customer"
- Delete confirm message: translated
- OK button default: "تأكيد" → "Confirm"
- Cancel button: "إلغاء" → "Cancel"

**Toast / Error Messages (runtime)**
- All Arabic toast messages in `renderer.js` translated to English when in English mode

**CSV Export**
- CSV column headers translated: '#', 'الاسم' → 'Name', 'الجوال' → 'Phone', 'البريد' → 'Email', 'العنوان' → 'Address', 'الحالة' → 'Status', 'الرقم الضريبي' → 'VAT Number', 'ملاحظات' → 'Notes', 'تاريخ الإضافة' → 'Created At'
- Status values in CSV: 'نشط' → 'Active', 'موقوف' → 'Inactive'

**Layout direction**
- `<html lang>` and `dir` attributes switch between `ar`/`rtl` and `en`/`ltr` accordingly

### Out of Scope
- Changes to the backend/API layer
- Translation of customer data (names, addresses) stored in the database
- Adding a language switcher within the Customers screen itself

## Assumptions

1. The language is already managed globally; the Customers screen only needs to **subscribe** to locale changes — it does not need to set the locale.
2. The existing pattern (`__applyLang` + `initLang` IIFE + `app_on_locale_changed` listener) is the correct and only approved approach for i18n in this codebase.
3. RTL/LTR layout switching is handled entirely via `document.documentElement.dir`; no additional CSS is needed.
4. The `window.api.app_get_locale()` and `window.api.app_on_locale_changed()` APIs are available in the Customers screen's renderer process (confirmed by their use across all other screens).

## Success Criteria

- Switching language to English in Settings immediately updates all text on the Customers screen (if it is open).
- Opening the Customers screen while English is set shows all text in English from the start.
- Switching back to Arabic restores all original Arabic text.
- No existing functionality is broken.
