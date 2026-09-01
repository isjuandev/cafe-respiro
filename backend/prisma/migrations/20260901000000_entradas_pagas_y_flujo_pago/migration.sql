-- Crear Enum ReservaEstado
DO $$ BEGIN
  CREATE TYPE "ReservaEstado" AS ENUM ('PENDIENTE_PAGO', 'CONFIRMADA', 'CANCELADA');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Crear Tabla TipoEntrada
CREATE TABLE IF NOT EXISTS "TipoEntrada" (
  "id" TEXT NOT NULL,
  "nombre" TEXT NOT NULL,
  "precio" INTEGER NOT NULL,
  "descripcion" TEXT,
  "orden" INTEGER NOT NULL DEFAULT 0,
  "activo" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TipoEntrada_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TipoEntrada_activo_orden_idx" ON "TipoEntrada"("activo", "orden");

-- Crear Tabla ConfiguracionPago
CREATE TABLE IF NOT EXISTS "ConfiguracionPago" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "banco" TEXT NOT NULL DEFAULT 'Bancolombia',
  "tipoCuenta" TEXT NOT NULL DEFAULT 'Ahorros',
  "numeroCuenta" TEXT NOT NULL DEFAULT '123-456789-01',
  "titular" TEXT NOT NULL DEFAULT 'Café Respiro S.A.S.',
  "documento" TEXT DEFAULT 'NIT 901.234.567-8',
  "qrImageUrl" TEXT DEFAULT '/images/pago-qr.png',
  "telefonoWp" TEXT NOT NULL DEFAULT '573001234567',
  "instrucciones" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ConfiguracionPago_pkey" PRIMARY KEY ("id")
);

-- Actualizar Tabla Reserva
ALTER TABLE "Reserva" ADD COLUMN IF NOT EXISTS "codigo" TEXT;
ALTER TABLE "Reserva" ADD COLUMN IF NOT EXISTS "usuarioId" TEXT;
ALTER TABLE "Reserva" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "Reserva" ADD COLUMN IF NOT EXISTS "total" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Reserva" ADD COLUMN IF NOT EXISTS "estado" "ReservaEstado" NOT NULL DEFAULT 'PENDIENTE_PAGO';
ALTER TABLE "Reserva" ADD COLUMN IF NOT EXISTS "expiraEn" TIMESTAMP(3) NOT NULL DEFAULT (NOW() + INTERVAL '45 minutes');
ALTER TABLE "Reserva" ADD COLUMN IF NOT EXISTS "confirmadoPorAdminId" TEXT;
ALTER TABLE "Reserva" ADD COLUMN IF NOT EXISTS "confirmadoEn" TIMESTAMP(3);
ALTER TABLE "Reserva" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Generar código único para reservas existentes que pudieran no tenerlo
UPDATE "Reserva" SET "codigo" = 'CIN-' || UPPER(SUBSTRING(MD5(id || RANDOM()::TEXT) FROM 1 FOR 5)) WHERE "codigo" IS NULL;
ALTER TABLE "Reserva" ALTER COLUMN "codigo" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Reserva_codigo_key" ON "Reserva"("codigo");

-- Clave foránea con Usuario
DO $$ BEGIN
  ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Eliminar unique constraint viejo de funcionId y contacto
DROP INDEX IF EXISTS "Reserva_funcionId_contacto_key";

-- Crear índices en Reserva
CREATE INDEX IF NOT EXISTS "Reserva_funcionId_idx" ON "Reserva"("funcionId");
CREATE INDEX IF NOT EXISTS "Reserva_usuarioId_idx" ON "Reserva"("usuarioId");
CREATE INDEX IF NOT EXISTS "Reserva_codigo_idx" ON "Reserva"("codigo");
CREATE INDEX IF NOT EXISTS "Reserva_estado_idx" ON "Reserva"("estado");
CREATE INDEX IF NOT EXISTS "Reserva_expiraEn_idx" ON "Reserva"("expiraEn");
CREATE INDEX IF NOT EXISTS "Reserva_contacto_idx" ON "Reserva"("contacto");

-- Partial Unique Index para prevenir duplicados PENDIENTE_PAGO por contacto en misma función
CREATE UNIQUE INDEX IF NOT EXISTS "Reserva_funcionId_contacto_pendiente_key" 
ON "Reserva"("funcionId", "contacto") 
WHERE "estado" = 'PENDIENTE_PAGO';

-- Crear Tabla ReservaItem
CREATE TABLE IF NOT EXISTS "ReservaItem" (
  "id" TEXT NOT NULL,
  "reservaId" TEXT NOT NULL,
  "tipoEntradaId" TEXT NOT NULL,
  "cantidad" INTEGER NOT NULL,
  "precioUnitario" INTEGER NOT NULL,
  "subtotal" INTEGER NOT NULL,

  CONSTRAINT "ReservaItem_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "ReservaItem" ADD CONSTRAINT "ReservaItem_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "Reserva"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "ReservaItem" ADD CONSTRAINT "ReservaItem_tipoEntradaId_fkey" FOREIGN KEY ("tipoEntradaId") REFERENCES "TipoEntrada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "ReservaItem_reservaId_idx" ON "ReservaItem"("reservaId");
CREATE INDEX IF NOT EXISTS "ReservaItem_tipoEntradaId_idx" ON "ReservaItem"("tipoEntradaId");

-- Insertar tipos de entrada iniciales si la tabla está vacía
INSERT INTO "TipoEntrada" ("id", "nombre", "precio", "descripcion", "orden", "activo", "createdAt", "updatedAt")
SELECT 'tipo_esencial', 'Esencial', 15000, 'Entrada general a la función con proyección en sala íntima.', 1, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "TipoEntrada" WHERE "id" = 'tipo_esencial');

INSERT INTO "TipoEntrada" ("id", "nombre", "precio", "descripcion", "orden", "activo", "createdAt", "updatedAt")
SELECT 'tipo_preferencial', 'Preferencial', 30000, 'Entrada a la función + palomitas de maíz individuales + bebida artesanal a elección.', 2, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "TipoEntrada" WHERE "id" = 'tipo_preferencial');

INSERT INTO "TipoEntrada" ("id", "nombre", "precio", "descripcion", "orden", "activo", "createdAt", "updatedAt")
SELECT 'tipo_especial', 'Especial', 45000, 'Entrada a la función + combo especial de la casa + postre artesanal + café de especialidad.', 3, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "TipoEntrada" WHERE "id" = 'tipo_especial');

-- Insertar configuración de pago por defecto si no existe
INSERT INTO "ConfiguracionPago" ("id", "banco", "tipoCuenta", "numeroCuenta", "titular", "documento", "qrImageUrl", "telefonoWp", "instrucciones", "updatedAt")
SELECT 'default', 'Bancolombia', 'Ahorros', '123-456789-01', 'Café Respiro S.A.S.', 'NIT 901.234.567-8', '/images/pago-qr.png', '573001234567', 'Realiza la transferencia por el total exacto y envía el comprobante por WhatsApp indicando tu código de reserva.', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "ConfiguracionPago" WHERE "id" = 'default');
