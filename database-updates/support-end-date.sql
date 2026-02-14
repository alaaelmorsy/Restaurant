-- إضافة حقل تاريخ انتهاء الدعم الفني في جدول app_settings
-- يُستخدم هذا الحقل لمنع التحديث إذا انتهت فترة الدعم الفني

ALTER TABLE app_settings 
ADD COLUMN IF NOT EXISTS support_end_date DATE NULL 
COMMENT 'تاريخ انتهاء الدعم الفني - إذا كان منتهياً يُمنع التحديث';

-- مثال: تعيين تاريخ انتهاء الدعم الفني
-- UPDATE app_settings SET support_end_date = '2026-12-31' WHERE id = 1;
