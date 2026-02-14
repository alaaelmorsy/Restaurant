-- Customer Display Schema Updates
-- إضافة الحقول المطلوبة لنظام شاشة العرض للعميل

ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS customer_display_enabled TINYINT NOT NULL DEFAULT 0;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS customer_display_simulator TINYINT NOT NULL DEFAULT 0;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS customer_display_port VARCHAR(16) NULL;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS customer_display_baud_rate INT NOT NULL DEFAULT 9600;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS customer_display_columns TINYINT NOT NULL DEFAULT 20;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS customer_display_rows TINYINT NOT NULL DEFAULT 2;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS customer_display_protocol VARCHAR(16) NOT NULL DEFAULT 'escpos';
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS customer_display_encoding VARCHAR(16) NOT NULL DEFAULT 'windows-1256';
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS customer_display_brightness TINYINT NOT NULL DEFAULT 100;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS customer_display_welcome_msg VARCHAR(100) NULL;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS customer_display_thankyou_msg VARCHAR(100) NULL;
