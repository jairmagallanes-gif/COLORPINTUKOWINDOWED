-- ==============================================================================
-- COLORLINK by Pintuco® - Supabase PostgreSQL Database Schema Oficial
-- Versión: 2.7 (Resolución de FK auth.users & Compatibilidad Universal)
-- Administrador General: Jair Magallanes (jairmagallanes@gmail.com)
-- Línea Oficial de Soporte y WhatsApp: +57 323 603 0829
-- ==============================================================================

-- 1. Habilitar extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- MÓDULO 1: USUARIOS & GOBERNANZA RBAC (perfiles / usuarios)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.perfiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correo_electronico VARCHAR(255) NOT NULL UNIQUE,
  nombre_completo VARCHAR(255) NOT NULL,
  telefono VARCHAR(50),
  rol VARCHAR(50) NOT NULL DEFAULT 'cliente',
  esta_activo BOOLEAN NOT NULL DEFAULT TRUE,
  empresa_o_organizacion VARCHAR(255),
  cargo_o_titulo VARCHAR(255),
  nit_o_cedula VARCHAR(50),
  ciudad VARCHAR(100) DEFAULT 'Medellín',
  direccion TEXT,
  avatar_url TEXT,
  email_verificado BOOLEAN NOT NULL DEFAULT FALSE,
  aprobado_por_admin_at TIMESTAMPTZ,
  aprobado_por_admin_nombre VARCHAR(255),
  motivo_rechazo TEXT,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- IMPORTANTE: Eliminar la restricción restrictiva de clave foránea hacia auth.users
-- si fue creada por plantillas predeterminadas de Supabase. Esto permite registrar
-- perfiles del sistema, administradores y clientes antes de que creen cuenta en Auth.
ALTER TABLE public.perfiles DROP CONSTRAINT IF EXISTS perfiles_id_fkey;

-- Asegurar columnas si la tabla 'perfiles' ya existía con anterioridad:
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS correo_electronico VARCHAR(255);
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS nombre_completo VARCHAR(255);
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS telefono VARCHAR(50);
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS rol VARCHAR(50) DEFAULT 'cliente';
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS esta_activo BOOLEAN DEFAULT TRUE;
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS empresa_o_organizacion VARCHAR(255);
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS cargo_o_titulo VARCHAR(255);
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS nit_o_cedula VARCHAR(50);
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS ciudad VARCHAR(100) DEFAULT 'Medellín';
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT FALSE;
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS aprobado_por_admin_at TIMESTAMPTZ;
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS aprobado_por_admin_nombre VARCHAR(255);
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT;
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
-- Las instalaciones anteriores pueden tener la columna id sin valor por defecto.
ALTER TABLE public.perfiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Credenciales persistentes de COLORLINK: nunca se guarda la contraseña en texto plano.
CREATE TABLE IF NOT EXISTS public.colorlink_usuarios_auth (
  correo_electronico TEXT PRIMARY KEY,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  usuario JSONB NOT NULL,
  verification_token TEXT,
  token_expira TIMESTAMPTZ,
  email_verificado BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.colorlink_usuarios_auth ENABLE ROW LEVEL SECURITY;

-- Recrear vistas sinónimas con las columnas verificadas:
DROP VIEW IF EXISTS public.usuarios CASCADE;
CREATE OR REPLACE VIEW public.usuarios AS SELECT * FROM public.perfiles;

DROP VIEW IF EXISTS public.profiles CASCADE;
CREATE OR REPLACE VIEW public.profiles AS
SELECT 
  id,
  nombre_completo AS name,
  nombre_completo AS full_name,
  correo_electronico AS email,
  rol AS role,
  esta_activo AS is_active,
  telefono AS phone,
  ciudad AS city,
  empresa_o_organizacion AS company_or_org,
  cargo_o_titulo AS position_or_title,
  fecha_creacion AS created_at,
  fecha_actualizacion AS updated_at
FROM public.perfiles;

-- ==============================================================================
-- MÓDULO 2: CLIENTES, OBRAS Y PROYECTOS (clientes, sedes_proyecto, proyectos)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nit_cedula VARCHAR(50) NOT NULL UNIQUE,
  nombre_empresa VARCHAR(255) NOT NULL,
  nombre_contacto VARCHAR(255) NOT NULL,
  correo_contacto VARCHAR(255) NOT NULL,
  telefono_contacto VARCHAR(50) NOT NULL,
  direccion_facturacion TEXT,
  ciudad VARCHAR(100) NOT NULL DEFAULT 'Medellín',
  tipo_cliente VARCHAR(50) DEFAULT 'empresa',
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS nit_cedula VARCHAR(50);
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS nombre_empresa VARCHAR(255);
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS nombre_contacto VARCHAR(255);
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS correo_contacto VARCHAR(255);
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS telefono_contacto VARCHAR(50);
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS direccion_facturacion TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS ciudad VARCHAR(100) DEFAULT 'Medellín';
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS tipo_cliente VARCHAR(50) DEFAULT 'empresa';
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

CREATE TABLE IF NOT EXISTS public.sedes_proyecto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  nombre_sede VARCHAR(255) NOT NULL,
  direccion TEXT NOT NULL,
  ciudad VARCHAR(100) NOT NULL DEFAULT 'Medellín',
  latitud NUMERIC(10, 7),
  longitud NUMERIC(10, 7),
  contacto_obra VARCHAR(255),
  telefono_obra VARCHAR(50),
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.sedes_proyecto ADD COLUMN IF NOT EXISTS nombre_sede VARCHAR(255);
ALTER TABLE public.sedes_proyecto ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE public.sedes_proyecto ADD COLUMN IF NOT EXISTS ciudad VARCHAR(100) DEFAULT 'Medellín';
ALTER TABLE public.sedes_proyecto ADD COLUMN IF NOT EXISTS latitud NUMERIC(10, 7);
ALTER TABLE public.sedes_proyecto ADD COLUMN IF NOT EXISTS longitud NUMERIC(10, 7);
ALTER TABLE public.sedes_proyecto ADD COLUMN IF NOT EXISTS contacto_obra VARCHAR(255);
ALTER TABLE public.sedes_proyecto ADD COLUMN IF NOT EXISTS telefono_obra VARCHAR(50);

CREATE TABLE IF NOT EXISTS public.proyectos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  sede_id UUID REFERENCES public.sedes_proyecto(id) ON DELETE SET NULL,
  estado VARCHAR(50) NOT NULL DEFAULT 'capturado',
  area_m2 NUMERIC(10, 2) NOT NULL DEFAULT 100,
  tipo_superficie VARCHAR(50) NOT NULL DEFAULT 'mamposteria_concreto',
  ambiente VARCHAR(50) NOT NULL DEFAULT 'exterior_intemperie',
  condicion_superficie VARCHAR(50) NOT NULL DEFAULT 'buen_estado',
  nombre_color_objetivo VARCHAR(100) NOT NULL DEFAULT 'Blanco Almendra',
  hex_color_objetivo VARCHAR(20) DEFAULT '#F5F5F0',
  acabado_objetivo VARCHAR(50) DEFAULT 'Mate',
  urgencia VARCHAR(50) DEFAULT 'estandar',
  metodo_entrega VARCHAR(50) DEFAULT 'envio_obra',
  tienda_o_cedi_retiro TEXT,
  persona_autorizada_retiro VARCHAR(255),
  monto_total NUMERIC(14, 2) NOT NULL DEFAULT 0,
  cedi_asignado_id VARCHAR(50),
  asesor_asignado_id UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
  creado_por_id UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
  fotos TEXT[] DEFAULT '{}',
  observaciones TEXT,
  datos_completos_json JSONB,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS codigo VARCHAR(50);
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'capturado';
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS area_m2 NUMERIC(10, 2) DEFAULT 100;
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS tipo_superficie VARCHAR(50) DEFAULT 'mamposteria_concreto';
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS ambiente VARCHAR(50) DEFAULT 'exterior_intemperie';
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS condicion_superficie VARCHAR(50) DEFAULT 'buen_estado';
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS nombre_color_objetivo VARCHAR(100) DEFAULT 'Blanco Almendra';
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS hex_color_objetivo VARCHAR(20) DEFAULT '#F5F5F0';
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS acabado_objetivo VARCHAR(50) DEFAULT 'Mate';
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS urgencia VARCHAR(50) DEFAULT 'estandar';
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS metodo_entrega VARCHAR(50) DEFAULT 'envio_obra';
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS tienda_o_cedi_retiro TEXT;
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS persona_autorizada_retiro VARCHAR(255);
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS monto_total NUMERIC(14, 2) DEFAULT 0;
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS cedi_asignado_id VARCHAR(50);
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS fotos TEXT[] DEFAULT '{}';
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS observaciones TEXT;
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS datos_completos_json JSONB;

DROP VIEW IF EXISTS public.projects CASCADE;
CREATE OR REPLACE VIEW public.projects AS
SELECT 
  id,
  codigo AS code,
  codigo AS project_id,
  estado AS status,
  area_m2,
  tipo_superficie AS surface_type,
  ambiente AS environment_type,
  condicion_superficie AS surface_condition,
  monto_total AS total_amount,
  fecha_creacion AS created_at,
  fecha_actualizacion AS updated_at
FROM public.proyectos;

CREATE TABLE IF NOT EXISTS public.cotizaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_cotizacion VARCHAR(50) NOT NULL UNIQUE,
  proyecto_id UUID REFERENCES public.proyectos(id) ON DELETE SET NULL,
  asesor_id UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
  subtotal_materiales NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_mano_obra NUMERIC(14, 2) NOT NULL DEFAULT 0,
  impuesto_iva NUMERIC(14, 2) NOT NULL DEFAULT 0,
  porcentaje_descuento NUMERIC(5, 2) NOT NULL DEFAULT 0,
  monto_descuento NUMERIC(14, 2) NOT NULL DEFAULT 0,
  gran_total NUMERIC(14, 2) NOT NULL DEFAULT 0,
  canal_comercial VARCHAR(50) DEFAULT 'directo_pintuco',
  estado VARCHAR(50) NOT NULL DEFAULT 'enviada',
  decision_cliente VARCHAR(50) DEFAULT 'pendiente',
  fecha_decision TIMESTAMPTZ,
  motivo_rechazo TEXT,
  valido_hasta DATE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  pdf_url TEXT,
  estado_pago VARCHAR(50) DEFAULT 'pendiente',
  metodo_pago VARCHAR(50),
  referencia_pago VARCHAR(100),
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.cotizaciones ADD COLUMN IF NOT EXISTS numero_cotizacion VARCHAR(50);
ALTER TABLE public.cotizaciones ADD COLUMN IF NOT EXISTS subtotal_materiales NUMERIC(14, 2) DEFAULT 0;
ALTER TABLE public.cotizaciones ADD COLUMN IF NOT EXISTS total_mano_obra NUMERIC(14, 2) DEFAULT 0;
ALTER TABLE public.cotizaciones ADD COLUMN IF NOT EXISTS impuesto_iva NUMERIC(14, 2) DEFAULT 0;
ALTER TABLE public.cotizaciones ADD COLUMN IF NOT EXISTS gran_total NUMERIC(14, 2) DEFAULT 0;
ALTER TABLE public.cotizaciones ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'enviada';
ALTER TABLE public.cotizaciones ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;

DROP VIEW IF EXISTS public.quotations CASCADE;
CREATE OR REPLACE VIEW public.quotations AS
SELECT 
  id,
  numero_cotizacion AS quote_number,
  gran_total AS total_amount,
  estado AS status,
  fecha_creacion AS created_at
FROM public.cotizaciones;

CREATE TABLE IF NOT EXISTS public.diagnosticos_tecnicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES public.proyectos(id) ON DELETE CASCADE,
  patologia_detectada VARCHAR(255) NOT NULL,
  analisis_causa_raiz TEXT NOT NULL,
  sistema_pintuco_recomendado VARCHAR(255) NOT NULL,
  imprimante_recomendado VARCHAR(255),
  pasos_preparacion TEXT[] DEFAULT '{}',
  riesgos_mitigados TEXT[] DEFAULT '{}',
  anios_durabilidad INT DEFAULT 5,
  puntaje_confianza_ia NUMERIC(4, 2) DEFAULT 0.95,
  materiales_venta JSONB DEFAULT '[]'::jsonb,
  simulacion_acabado JSONB,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- MÓDULO 3: INVENTARIO & RED LOGÍSTICA PINTUCO (pintuco_cedis, productos, inventario)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.pintuco_cedis (
  id VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  ciudad VARCHAR(100) NOT NULL,
  direccion TEXT NOT NULL,
  tiempo_entrega_horas INT NOT NULL DEFAULT 24,
  responsable VARCHAR(150),
  telefono VARCHAR(50),
  correo VARCHAR(255),
  estado_capacidad VARCHAR(100) DEFAULT 'Alta disponibilidad (95%)',
  latitud NUMERIC(10, 7),
  longitud NUMERIC(10, 7),
  esta_activo BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.pintuco_cedis ADD COLUMN IF NOT EXISTS estado_capacidad VARCHAR(100) DEFAULT 'Alta disponibilidad (95%)';
ALTER TABLE public.pintuco_cedis ADD COLUMN IF NOT EXISTS tiempo_entrega_horas INT DEFAULT 24;

CREATE TABLE IF NOT EXISTS public.pintuco_productos (
  id VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  linea VARCHAR(100) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  rendimiento_m2_galon NUMERIC(8, 2) NOT NULL,
  manos_recomendadas INT NOT NULL DEFAULT 2,
  nivel_voc VARCHAR(50),
  tiempo_secado VARCHAR(100),
  descripcion TEXT,
  caracteristicas TEXT[] DEFAULT '{}',
  precio_galon_cop NUMERIC(14, 2) NOT NULL,
  precio_cunete_cop NUMERIC(14, 2) NOT NULL,
  ficha_tecnica_url TEXT,
  hoja_seguridad_url TEXT,
  esta_activo BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.inventario_cedi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cedi_id VARCHAR(50) NOT NULL REFERENCES public.pintuco_cedis(id) ON DELETE CASCADE,
  producto_id VARCHAR(50) NOT NULL REFERENCES public.pintuco_productos(id) ON DELETE CASCADE,
  galones_disponibles NUMERIC(10, 2) NOT NULL DEFAULT 0,
  galones_reservados NUMERIC(10, 2) NOT NULL DEFAULT 0,
  fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_cedi_producto UNIQUE (cedi_id, producto_id)
);

DROP VIEW IF EXISTS public.inventario CASCADE;
CREATE OR REPLACE VIEW public.inventario AS
SELECT 
  ic.id,
  c.nombre AS cedi_nombre,
  c.ciudad AS cedi_ciudad,
  p.nombre AS producto_nombre,
  p.linea AS producto_linea,
  ic.galones_disponibles,
  ic.galones_reservados,
  (ic.galones_disponibles - ic.galones_reservados) AS galones_netos_disponibles,
  ic.fecha_actualizacion
FROM public.inventario_cedi ic
JOIN public.pintuco_cedis c ON ic.cedi_id = c.id
JOIN public.pintuco_productos p ON ic.producto_id = p.id;

-- ==============================================================================
-- MÓDULO 4: NOTIFICACIONES (notificaciones_email)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.notificaciones_email (
  id VARCHAR(100) PRIMARY KEY,
  destinatario_correo VARCHAR(255) NOT NULL,
  destinatario_nombre VARCHAR(255) NOT NULL,
  asunto VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  rol_destinatario VARCHAR(50),
  resumen_vista_previa TEXT,
  contenido_html TEXT NOT NULL,
  esta_leido BOOLEAN NOT NULL DEFAULT FALSE,
  accion_tomada BOOLEAN NOT NULL DEFAULT FALSE,
  proyecto_codigo VARCHAR(50),
  cotizacion_numero VARCHAR(50),
  telefono_cliente VARCHAR(50),
  mensaje_whatsapp TEXT,
  correo_enviado BOOLEAN NOT NULL DEFAULT FALSE,
  error_envio TEXT,
  remitente_oficial VARCHAR(255) NOT NULL DEFAULT 'COLORLINK by Pintuco® <jairmagallanes@gmail.com>',
  fecha_envio TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.notificaciones_email ADD COLUMN IF NOT EXISTS remitente_oficial VARCHAR(255) DEFAULT 'COLORLINK by Pintuco® <jairmagallanes@gmail.com>';
ALTER TABLE public.notificaciones_email ADD COLUMN IF NOT EXISTS mensaje_whatsapp TEXT;
ALTER TABLE public.notificaciones_email ADD COLUMN IF NOT EXISTS correo_enviado BOOLEAN DEFAULT FALSE;

DROP VIEW IF EXISTS public.notificaciones CASCADE;
CREATE OR REPLACE VIEW public.notificaciones AS SELECT * FROM public.notificaciones_email;

-- ==============================================================================
-- MÓDULO 5: LOGS DE AUDITORÍA & TRAZABILIDAD (logs_auditoria, bitacora_obra)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.logs_auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
  usuario_nombre VARCHAR(255) NOT NULL DEFAULT 'Sistema Automático ColorLink',
  usuario_correo VARCHAR(255) NOT NULL DEFAULT 'jairmagallanes@gmail.com',
  accion VARCHAR(100) NOT NULL, 
  entidad_afectada VARCHAR(50) NOT NULL,
  entidad_id VARCHAR(100) NOT NULL,
  firma_autorizacion VARCHAR(255) DEFAULT 'Jair Magallanes (Administrador)',
  detalles JSONB DEFAULT '{}'::jsonb,
  direccion_ip VARCHAR(50) DEFAULT '127.0.0.1',
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP VIEW IF EXISTS public.audit_logs CASCADE;
CREATE OR REPLACE VIEW public.audit_logs AS SELECT * FROM public.logs_auditoria;

CREATE TABLE IF NOT EXISTS public.bitacora_obra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES public.proyectos(id) ON DELETE CASCADE,
  estado_proyecto VARCHAR(50) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  autor VARCHAR(255) NOT NULL,
  tipo_insignia VARCHAR(20) DEFAULT 'info',
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 6. ÍNDICES DE RENDIMIENTO (QUERY OPTIMIZATION)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_perfiles_correo ON public.perfiles(correo_electronico);
CREATE INDEX IF NOT EXISTS idx_perfiles_rol ON public.perfiles(rol);
CREATE INDEX IF NOT EXISTS idx_clientes_nit ON public.clientes(nit_cedula);
CREATE INDEX IF NOT EXISTS idx_proyectos_codigo ON public.proyectos(codigo);
CREATE INDEX IF NOT EXISTS idx_proyectos_estado ON public.proyectos(estado);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_num ON public.cotizaciones(numero_cotizacion);
CREATE INDEX IF NOT EXISTS idx_bitacora_proyecto ON public.bitacora_obra(proyecto_id, fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_notif_destinatario ON public.notificaciones_email(destinatario_correo);
CREATE INDEX IF NOT EXISTS idx_logs_auditoria_entidad ON public.logs_auditoria(entidad_afectada, entidad_id);
CREATE INDEX IF NOT EXISTS idx_logs_auditoria_fecha ON public.logs_auditoria(fecha_registro DESC);

-- ==============================================================================
-- 7. TRIGGERS AUTOMÁTICOS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.fn_actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_perfiles_actualizacion ON public.perfiles;
CREATE TRIGGER trg_perfiles_actualizacion
BEFORE UPDATE ON public.perfiles
FOR EACH ROW EXECUTE FUNCTION public.fn_actualizar_timestamp();

DROP TRIGGER IF EXISTS trg_proyectos_actualizacion ON public.proyectos;
CREATE TRIGGER trg_proyectos_actualizacion
BEFORE UPDATE ON public.proyectos
FOR EACH ROW EXECUTE FUNCTION public.fn_actualizar_timestamp();

DROP TRIGGER IF EXISTS trg_cotizaciones_actualizacion ON public.cotizaciones;
CREATE TRIGGER trg_cotizaciones_actualizacion
BEFORE UPDATE ON public.cotizaciones
FOR EACH ROW EXECUTE FUNCTION public.fn_actualizar_timestamp();

-- ==============================================================================
-- 8. POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY - RLS)
-- ==============================================================================
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sedes_proyecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pintuco_cedis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pintuco_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_cedi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnosticos_tecnicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitacora_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones_email ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_auditoria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura publica CEDIs" ON public.pintuco_cedis;
DROP POLICY IF EXISTS "Lectura publica Productos" ON public.pintuco_productos;
DROP POLICY IF EXISTS "Lectura publica Inventario" ON public.inventario_cedi;
DROP POLICY IF EXISTS "Permitir lectura y registro de perfiles" ON public.perfiles;
DROP POLICY IF EXISTS "Permitir gestion de clientes" ON public.clientes;
DROP POLICY IF EXISTS "Permitir gestion de sedes" ON public.sedes_proyecto;
DROP POLICY IF EXISTS "Permitir gestion de proyectos" ON public.proyectos;
DROP POLICY IF EXISTS "Permitir gestion de diagnosticos" ON public.diagnosticos_tecnicos;
DROP POLICY IF EXISTS "Permitir gestion de cotizaciones" ON public.cotizaciones;
DROP POLICY IF EXISTS "Permitir gestion de bitacora" ON public.bitacora_obra;
DROP POLICY IF EXISTS "Permitir lectura y registro de notificaciones" ON public.notificaciones_email;
DROP POLICY IF EXISTS "Permitir lectura y registro de logs de auditoria" ON public.logs_auditoria;

CREATE POLICY "Lectura publica CEDIs" ON public.pintuco_cedis FOR SELECT USING (true);
CREATE POLICY "Lectura publica Productos" ON public.pintuco_productos FOR SELECT USING (true);
CREATE POLICY "Lectura publica Inventario" ON public.inventario_cedi FOR SELECT USING (true);
CREATE POLICY "Permitir lectura y registro de perfiles" ON public.perfiles FOR ALL USING (true);
CREATE POLICY "Permitir gestion de clientes" ON public.clientes FOR ALL USING (true);
CREATE POLICY "Permitir gestion de sedes" ON public.sedes_proyecto FOR ALL USING (true);
CREATE POLICY "Permitir gestion de proyectos" ON public.proyectos FOR ALL USING (true);
CREATE POLICY "Permitir gestion de diagnosticos" ON public.diagnosticos_tecnicos FOR ALL USING (true);
CREATE POLICY "Permitir gestion de cotizaciones" ON public.cotizaciones FOR ALL USING (true);
CREATE POLICY "Permitir gestion de bitacora" ON public.bitacora_obra FOR ALL USING (true);
CREATE POLICY "Permitir lectura y registro de notificaciones" ON public.notificaciones_email FOR ALL USING (true);
CREATE POLICY "Permitir lectura y registro de logs de auditoria" ON public.logs_auditoria FOR ALL USING (true);

-- ==============================================================================
-- 9. DATOS SEMILLA (SEED DATA OFICIAL)
-- ==============================================================================

-- 1. Administrador General del Sistema (JAIR MAGALLANES)
DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Reutilizar primero el perfil existente para que el seed sea idempotente.
  SELECT id INTO v_admin_id
  FROM public.perfiles
  WHERE correo_electronico = 'jairmagallanes@gmail.com'
  LIMIT 1;

  -- Si aún no hay perfil, sincronizar el ID de Auth cuando exista.
  BEGIN
    IF v_admin_id IS NULL THEN
      SELECT id INTO v_admin_id FROM auth.users WHERE email = 'jairmagallanes@gmail.com' LIMIT 1;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_admin_id := NULL;
  END;

  -- Usar el UUID de Auth cuando esté libre. Si no existe o ya pertenece
  -- a otro perfil, generar uno nuevo para evitar colisiones de clave primaria.
  IF v_admin_id IS NULL OR EXISTS (
    SELECT 1
    FROM public.perfiles
    WHERE id = v_admin_id
      AND correo_electronico <> 'jairmagallanes@gmail.com'
  ) THEN
    v_admin_id := gen_random_uuid();
  END IF;

  INSERT INTO public.perfiles (
    id,
    nombre_completo,
    correo_electronico,
    telefono,
    rol,
    esta_activo,
    empresa_o_organizacion,
    cargo_o_titulo,
    nit_o_cedula,
    ciudad,
    direccion,
    email_verificado
  ) VALUES (
    v_admin_id,
    'JAIR MAGALLANES',
    'jairmagallanes@gmail.com',
    '+57 323 603 0829',
    'administrador',
    TRUE,
    'COLORLINK Central Pintuco',
    'Administrador General del Sistema & Director de Plataforma',
    '1.047.382.910',
    'Medellín',
    'Carrera 48 # 26-85, Edificio Sede Principal Pintuco',
    TRUE
  ) ON CONFLICT (correo_electronico) DO UPDATE SET
    nombre_completo = EXCLUDED.nombre_completo,
    telefono = EXCLUDED.telefono,
    rol = 'administrador',
    esta_activo = TRUE,
    empresa_o_organizacion = EXCLUDED.empresa_o_organizacion,
    cargo_o_titulo = EXCLUDED.cargo_o_titulo;

  -- Registro de Auditoría Inicial
  INSERT INTO public.logs_auditoria (
    usuario_id,
    usuario_nombre,
    usuario_correo,
    accion,
    entidad_afectada,
    entidad_id,
    firma_autorizacion,
    detalles
  ) VALUES (
    v_admin_id,
    'JAIR MAGALLANES',
    'jairmagallanes@gmail.com',
    'INICIALIZACION_SISTEMA_COLORLINK',
    'GOBERNANZA',
    'SISTEMA-CENTRAL',
    'Jair Magallanes (Administrador)',
    jsonb_build_object(
      'version', '2.7',
      'plataforma', 'COLORLINK Pintuco',
      'contacto_soporte', '+57 323 603 0829'
    )
  );
END $$;

-- 2. Red Oficial de Centros de Distribución (CEDIs Pintuco Colombia)
INSERT INTO public.pintuco_cedis (id, nombre, ciudad, direccion, tiempo_entrega_horas, responsable, telefono, estado_capacidad) VALUES
('cedi-guarne', 'CEDI Central Guarne - Medellín', 'Medellín', 'Autopista Medellín-Bogotá Km 24, Guarne, Antioquia', 12, 'Jair Magallanes', '+57 323 603 0829', 'Alta disponibilidad (98%)'),
('cedi-cota', 'CEDI Centro Cota - Bogotá', 'Bogotá D.C.', 'Parque Industrial Siberia, Vía Cota Km 1.5, Módulo 8', 18, 'Ing. Andrés Mendoza', '+57 (1) 745-9200', 'Disponibilidad normal (92%)'),
('cedi-yumbo', 'CEDI Occidente Yumbo - Cali', 'Cali', 'Zona Industrial Yumbo, Calle 15 # 28-40, Valle del Cauca', 24, 'Dra. María Elena Gómez', '+57 (2) 690-3344', 'Disponibilidad alta (95%)'),
('cedi-barranquilla', 'CEDI Norte - Barranquilla', 'Barranquilla', 'Vía 40 # 85-220, Parque Logístico del Caribe', 24, 'Ing. Roberto Char', '+57 (5) 385-1122', 'Disponibilidad normal (89%)'),
('cedi-bucaramanga', 'CEDI Oriente - Bucaramanga', 'Bucaramanga', 'Anillo Vial Floridablanca - Girón Km 4', 36, 'Arq. Sofía Villamizar', '+57 (7) 648-5500', 'Stock moderado (82%)'),
('cedi-pereira', 'CEDI Eje Cafetero - Pereira', 'Pereira', 'Variante La Romelia - El Pollo Km 7, Risaralda', 24, 'Ing. Camilo Echeverri', '+57 (6) 329-8800', 'Disponibilidad normal (91%)')
ON CONFLICT (id) DO NOTHING;

-- 3. Catálogo Técnico Pintuco
INSERT INTO public.pintuco_productos (
  id, nombre, linea, categoria, rendimiento_m2_galon, manos_recomendadas, nivel_voc, tiempo_secado, descripcion, caracteristicas, precio_galon_cop, precio_cunete_cop
) VALUES
(
  'viniltex-avanzada',
  'Viniltex® Avanzada Máxima Lavabilidad',
  'Arquitectónica Premium Interiores',
  'pintura_principal',
  40.00,
  2,
  'Bajo VOC (< 30 g/L)',
  '2 horas entre manos',
  'Pintura tipo 1 superior con tecnología antibacterial y resistencia a más de 500 ciclos de lavado severo.',
  ARRAY['Ultra lavable', 'Sin olor residual', 'Cero salpique', 'Antihongos y bacterias'],
  68900.00,
  315000.00
),
(
  'koraza-5',
  'Koraza® Doble Vida 5 Años Fachadas',
  'Arquitectónica Exteriores Alta Resistencia',
  'pintura_principal',
  35.00,
  2,
  'Ultra-Bajo VOC (< 20 g/L)',
  '3 horas entre manos',
  'Pintura acrílica 100% elastomérica con barrera hidro-repelente que previene microfisuras y hongos en fachadas.',
  ARRAY['100% Acrílica Elastomérica', 'Barrera contra lluvia torrencial', 'Protección UV Activa', 'Garantía 5 Años'],
  92500.00,
  420000.00
),
(
  'pintulux-maxima',
  'Pintulux® Máxima Protección Esmalte 3 en 1',
  'Esmaltes y Protección Metales/Maderas',
  'esmalte',
  45.00,
  2,
  'VOC Estándar industrial',
  '4 a 6 horas al tacto',
  'Esmalte anticorrosivo alquídico de acabado brillante que funciona como anticorrosivo, base y acabado en un solo paso.',
  ARRAY['Anticorrosivo directo al metal', 'Brillo espejo duradero', 'Alta adherencia'],
  78500.00,
  360000.00
),
(
  'epoxico-altos-solidos',
  'Epóxico Pintucoat® Alto Sólidos Pisos y Tanques',
  'Industrial & Pisos de Tráfico Pesado',
  'epoxico',
  28.00,
  2,
  'Bajo VOC Industrial',
  '8 horas para segunda mano, 48h curado',
  'Recubrimiento epóxico bicomponente de alto desempeño para pisos industriales, talleres y áreas de asepsia.',
  ARRAY['Resistencia mecánica pesada', 'Resistencia a químicos e hidrocarburos', 'Lavable con detergentes industriales'],
  145000.00,
  680000.00
),
(
  'acrilcor-sellador',
  'Acrilcor® Sellador Antialcalino Base Agua',
  'Preparación y Primers de Superficie',
  'imprimante_sellador',
  50.00,
  1,
  'Cero VOC',
  '1 hora al tacto',
  'Imprimante de penetración que neutraliza la alcalinidad del cemento y bloquea el salitre y la eflorescencia.',
  ARRAY['Bloquea eflorescencia y salitre', 'Aumenta el rendimiento de la pintura', 'Fijador de polvo'],
  48900.00,
  210000.00
),
(
  'masilla-acrilica-profesional',
  'Masilla Acrílica Pintuco® Exteriores e Interiores',
  'Masillas y Nivelación',
  'masilla_preparacion',
  25.00,
  1,
  'Cero VOC',
  '2 horas para lijar',
  'Masilla lista para usar con microesferas de alta resistencia para resanar grietas y alisar muros.',
  ARRAY['Fácil lijado', 'No se encoge', 'Excelente blancura'],
  38500.00,
  165000.00
)
ON CONFLICT (id) DO NOTHING;

-- 4. Población Inicial de Inventario CEDI Central Guarne
INSERT INTO public.inventario_cedi (cedi_id, producto_id, galones_disponibles, galones_reservados) VALUES
('cedi-guarne', 'viniltex-avanzada', 1200.00, 45.00),
('cedi-guarne', 'koraza-5', 950.00, 30.00),
('cedi-guarne', 'pintulux-maxima', 580.00, 15.00),
('cedi-guarne', 'epoxico-altos-solidos', 340.00, 0.00),
('cedi-guarne', 'acrilcor-sellador', 800.00, 20.00),
('cedi-guarne', 'masilla-acrilica-profesional', 650.00, 10.00)
ON CONFLICT (cedi_id, producto_id) DO NOTHING;

-- Durable notification inbox. The server reads/writes with SUPABASE_SERVICE_ROLE_KEY;
-- RLS is enabled without public policies so recipients cannot enumerate other inboxes.
CREATE TABLE IF NOT EXISTS public.colorlink_notificaciones (
  id TEXT PRIMARY KEY,
  destinatario TEXT NOT NULL,
  enviado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  datos JSONB NOT NULL
);
ALTER TABLE public.colorlink_notificaciones ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS colorlink_notificaciones_destinatario_fecha_idx
  ON public.colorlink_notificaciones (destinatario, enviado_en DESC);

-- Requested administrator cleanup: retain only Jair's administrator profile.
UPDATE public.perfiles
SET rol = 'cliente'
WHERE rol = 'administrador'
  AND lower(correo_electronico) <> 'jairmagallanes@gmail.com';

DELETE FROM public.perfiles
WHERE lower(correo_electronico) = 'admin@pintuco.com';

DELETE FROM auth.users
WHERE lower(email) = 'admin@pintuco.com';
