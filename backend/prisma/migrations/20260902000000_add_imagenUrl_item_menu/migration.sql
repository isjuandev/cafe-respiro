-- Add missing column imagenUrl to ItemMenu (schema drift from 20260823030000_add_menu)
ALTER TABLE "ItemMenu" ADD COLUMN IF NOT EXISTS "imagenUrl" TEXT;
