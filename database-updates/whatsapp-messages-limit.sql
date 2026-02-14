-- WhatsApp Messages Limit Schema - للدعم الفني فقط
-- إضافة حقول تتبع عدد رسائل WhatsApp المرسلة والحد الأقصى
-- ملاحظة: هذه الأعمدة يتم إضافتها تلقائياً عند بدء التطبيق
-- لا حاجة لتنفيذ هذا الملف يدوياً

-- ========================================
-- استعلامات للدعم الفني فقط
-- ========================================

-- 1. عرض إحصائيات الرسائل الحالية
SELECT 
    whatsapp_messages_limit AS 'الحد_الأقصى',
    whatsapp_messages_sent AS 'المستخدم',
    (whatsapp_messages_limit - whatsapp_messages_sent) AS 'المتبقي'
FROM app_settings 
WHERE id = 1;

-- 2. تحديث الحد الأقصى للرسائل (مثال: 500 رسالة)
UPDATE app_settings 
SET whatsapp_messages_limit = 500 
WHERE id = 1;

-- 3. إعادة تعيين عداد الرسائل المستخدمة إلى صفر
UPDATE app_settings 
SET whatsapp_messages_sent = 0 
WHERE id = 1;

-- 4. زيادة الحد بمقدار محدد (مثال: إضافة 100 رسالة إضافية)
UPDATE app_settings 
SET whatsapp_messages_limit = whatsapp_messages_limit + 100 
WHERE id = 1;

-- 5. تجديد الباقة (إعادة الحد إلى قيمة محددة + تصفير العداد)
UPDATE app_settings 
SET whatsapp_messages_limit = 1000,
    whatsapp_messages_sent = 0 
WHERE id = 1;

-- ========================================
-- للإضافة اليدوية للأعمدة (إذا لم تُضف تلقائياً)
-- ========================================
-- ALTER TABLE app_settings ADD COLUMN whatsapp_messages_limit INT NOT NULL DEFAULT 0;
-- ALTER TABLE app_settings ADD COLUMN whatsapp_messages_sent INT NOT NULL DEFAULT 0;
