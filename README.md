<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/8ee8cc06-8987-4c69-9429-86654ae91ea7

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Configuración para el registro, correo y bandeja persistente

1. Copia `.env.example` a `.env` y configura `GMAIL_USER` y `GMAIL_APP_PASSWORD` con una contraseña de aplicación de Gmail.
2. En Supabase, ejecuta `supabase/schema.sql` para crear `colorlink_notificaciones`.
   Si ya tenías la base creada, ejecuta también `supabase/auth-migration.sql` para habilitar inicio de sesión persistente y recuperación de perfiles anteriores.
3. Configura `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` solo en el servidor. La clave de servicio no debe llevar prefijo `VITE_` ni publicarse en el navegador.
4. Las cuentas y sus correos se sincronizan en `public.perfiles`; las notificaciones se guardan en `public.colorlink_notificaciones`.
5. Los cambios de estado envían correo al cliente del proyecto y a `jairmagallanes@gmail.com`. El panel de tracking actualiza los datos del proyecto periódicamente; para recibir GPS real del vehículo hay que conectar una fuente de telemetría logística.

El acceso con Google está desactivado. Los códigos de activación se muestran únicamente en el correo enviado por SMTP y no se devuelven al navegador.

## Ejecutable local de Windows

1. Extrae el paquete completo de Windows para conservar `src`, `node_modules` y `runtime` junto al ejecutable.
2. Copia `.env.local.example` como `.env.local` junto a `ColorLink.exe` y completa tus claves. No pongas `SUPABASE_SERVICE_ROLE_KEY` en variables con prefijo `VITE_`.
3. Ejecuta `ColorLink.exe`. Se inicia el servidor local y se abre `http://localhost:3000` en el navegador. Deja abierta la ventana de control mientras usas la página; ciérrala para detener el servidor.
4. Para recompilar el launcher desde el código, instala dependencias con Node.js y ejecuta `npm run build:exe` en Windows con .NET Framework instalado.

El ejecutable incluye un runtime de Node portable y abre la aplicación en modo local. El servidor y Vite leen `.env.local` desde la misma carpeta del `.exe` al iniciar, por lo que puedes cambiar las claves sin recompilar. Las claves `VITE_*` son visibles al navegador; nunca pongas allí contraseñas ni la clave `SUPABASE_SERVICE_ROLE_KEY`.

`.env.local` está excluido por Git. No incluyas valores reales de claves en el `.exe` o en repositorios compartidos.
