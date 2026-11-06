-- Ejecuta este archivo una sola vez en Supabase SQL Editor para habilitar
-- credenciales persistentes y verificaciones de correo para COLORLINK.
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
