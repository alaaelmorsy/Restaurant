# Technical Specification: i18n for Pay Deferred Invoice Screen

## Difficulty: Medium

## Task Summary
When the app language is set to English, all text in the "دفع الفاتورة الآجلة" (Pay Deferred Invoice) screen must switch to English. When the language is Arabic, it stays as-is.

---

## Technical Context

- **Language**: JavaScript (Vanilla), HTML, Tailwind CSS
- **Runtime**: Electron (renderer process)
- **Language storage**: `localStorage` key `app_lang` (`'ar'` | `'en'`)
- **Language API**:
  - `window.api.app_get_locale()` → `{ lang: 'ar'|'en' }` (async)
  - `window.api.app_on_locale_changed(callback)` → live updates when language changes
- **Pattern reference**: `src/renderer/main/renderer.js` — uses `__applyLang(lang)` function + listens for locale changes

---

## Implementation Approach

### Pattern
Follow the same pattern as `src/renderer/main/renderer.js`:
1. Define `__applyLang(lang)` that translates all DOM elements
2. On init: read locale via `window.api.app_get_locale()` and apply
3. Listen for `window.api.app_on_locale_changed` to react to live language changes
4. Keep a module-level `__lang` variable ('ar'|'en') used by dynamic rendering functions

### Text Scope
All user-visible text must be translated, split into two areas:

**Static HTML (index.html)** — elements needing IDs for targeting:
- Page `<title>`: "دفع الفاتورة الآجلة" → "Pay Deferred Invoice"
- Header title (large): "دفع الفاتورة الآجلة" → "Pay Deferred Invoice"
- Header title (small/mobile): "دفع آجل" → "Deferred Pay"
- Back button text: "العودة للرئيسية" / "رئيسية" → "Home" / "Home"
- Search section header: "البحث والتصفية" → "Search & Filter"
- Search button: "بحث" → "Search"
- Clear button: "مسح" → "Clear"
- Invoice number label: "رقم الفاتورة" → "Invoice No."
- Invoice number placeholder: "رقم الفاتورة..." → "Invoice number..."
- Customer search label: "بحث بالعميل" → "Search by Customer"
- Customer search placeholder: "جوال، اسم، أو رقم ضريبي..." → "Phone, name, or tax number..."
- Date from label: "من" → "From"
- Date to label: "إلى" → "To"
- Page size label: "عدد الصفوف:" → "Rows per page:"
- Table headers: Invoice, Customer, Phone, Total, Date, Status, Actions
- Dialog title: "سداد كامل للفاتورة" → "Full Invoice Settlement"
- Dialog invoice label: "رقم الفاتورة" → "Invoice No."
- Dialog payment method label: "طريقة السداد" → "Payment Method"
- Payment options: "كاش"→"Cash", "شبكة"→"Card", "تمارا"→"Tamara", "تابي"→"Tabby"
- Cash amount label: "المبلغ المستلم" → "Amount Received"
- Cash placeholder: "اتركه فارغ = إجمالي الفاتورة" → "Leave empty = full invoice total"
- Cancel button: "إلغاء" → "Cancel"
- Confirm button: "سداد وطباعة" → "Settle & Print"

**Dynamic JS (renderer.js)** — strings generated in JavaScript:
- Pagination: "الأولى"→"First", "السابقة"→"Prev", "التالية"→"Next", "الأخيرة"→"Last"
- Pagination label: "صفحة X من Y (N فاتورة)" → "Page X of Y (N invoices)"
- Pagination button titles
- Row: "غير محدد" → "N/A"
- Row: status badge "آجل - غير مدفوعة" → "Deferred - Unpaid"
- Action buttons: "سداد كامل"→"Full Settle", "عرض"→"View"
- Empty state messages
- Error state messages
- All toast messages
- Dialog button text set in JS: "سداد وطباعة" → "Settle & Print"
- `document.documentElement.dir` set to `ltr` when English

---

## Files to Modify

| File | Change |
|------|--------|
| `src/renderer/payments/index.html` | Add IDs to all translatable static elements |
| `src/renderer/payments/renderer.js` | Add `__lang`, `__applyLang()`, locale init/listener, update all dynamic strings |

No new files needed. No API/data model changes.

---

## Verification Approach

1. Start the app with language set to Arabic → payments screen shows all Arabic text
2. Change language to English (from Settings or main screen) → payments screen immediately updates to English
3. Reload the payments screen with language already set to English → opens in English
4. Verify: page title, header, search panel, table headers, pagination, empty state, dialog, toast messages
5. Verify: `document.documentElement.dir` is `ltr` in English, `rtl` in Arabic
6. No lint/test commands defined in this project for renderer files — manual verification only
