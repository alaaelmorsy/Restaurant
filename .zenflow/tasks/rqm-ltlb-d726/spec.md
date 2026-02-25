# Technical Specification: رقم الطلب

## Difficulty
**Easy** — Trivial text label change in an HTML template.

## Technical Context
- **Project**: Electron-based restaurant POS (Point of Sale) application
- **Language**: HTML, JavaScript
- **Relevant file**: `src/renderer/sales/print.html` (thermal receipt template)

## Problem
In the thermal invoice print view, the label "رقم الأوردر" is displayed next to the order number. The user wants this label changed to "رقم الطلب".

## Implementation Approach
Single-line text replacement in `src/renderer/sales/print.html` at line 337:

**Before:**
```html
<div>رقم الأوردر: <b id="orderNo"></b></div>
```

**After:**
```html
<div>رقم الطلب: <b id="orderNo"></b></div>
```

## Files to Modify
| File | Change |
|------|--------|
| `src/renderer/sales/print.html` | Change label text from `رقم الأوردر` to `رقم الطلب` (line 337) |

## Data Model / API Changes
None.

## Verification
1. Open the application and create/print a thermal invoice.
2. Verify the label reads "رقم الطلب" instead of "رقم الأوردر".
