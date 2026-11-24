# Melani Cristine Lashes & Brows — App de reservas

App web (PWA) para que las clientas del salón reserven sus citas de pestañas, cejas y
micropigmentación, dejen reseñas con foto, y para que Melani gestione su calendario sin riesgo de
agendar dos personas a la misma hora.

## Qué incluye

- **Para las clientas**: ver servicios y precios, reservar hora eligiendo solo horarios realmente
  libres, ver/cancelar/reagendar sus citas, dejar reseña de 5 estrellas con foto después de la cita.
- **Para Melani (admin)**: calendario del día con todas las citas, cargar citas tomadas por
  WhatsApp/teléfono (con o sin clienta registrada), gestionar servicios y precios, ver todas las
  reseñas, y un panel de recordatorios con un botón para mandar WhatsApp ya redactado a cada clienta
  del día/mañana.
- **Se instala en el iPhone** como una app (ícono en la pantalla de inicio), funciona en el
  navegador, no requiere App Store.
- **Nunca se pueden agendar dos citas a la misma hora**: está bloqueado a nivel de base de datos, no
  solo en la pantalla, así que es imposible que vuelva a pasar aunque se use el panel rápido.

## Sobre los recordatorios de WhatsApp (importante)

Mandar mensajes de WhatsApp 100% automáticos (sin que nadie toque nada) requiere el WhatsApp
Business API de Meta o un servicio como Twilio, que exige verificar el negocio, aprobar plantillas de
mensaje y, generalmente, tiene un costo por conversación. Para una primera versión gratuita y sin
trámites, esta app usa un enfoque más simple pero igual de rápido en el día a día: en el panel de
"Recordatorios" aparecen las citas de hoy y mañana, cada una con un botón **"Enviar WhatsApp"** que
abre WhatsApp con el mensaje ya escrito — Melani solo toca "Enviar". Si más adelante el salón crece y
quieren automatizar el envío sin tocar nada, se puede agregar el WhatsApp Business API sobre esta
misma base de datos.

## 1. Crear el proyecto en Supabase (gratis)

1. Andá a [supabase.com](https://supabase.com) y creá una cuenta y un proyecto nuevo (elegí una
   región cercana, ej. São Paulo).
2. En **Project Settings → API** copiá el `Project URL` y la `anon public key`.
3. En **SQL Editor**, pegá todo el contenido de [`supabase/schema.sql`](./supabase/schema.sql) y
   ejecutalo (`Run`). Esto crea las tablas, las reglas de seguridad, la función que calcula horarios
   disponibles y carga 5 servicios de ejemplo para que puedas probar.
4. En **Authentication → Providers → Email**, dejá activado "Email" (login sin contraseña, por link
   mágico). En **Authentication → URL Configuration**, agregá la URL donde vayas a publicar la app
   (ver paso 3) tanto en "Site URL" como en "Redirect URLs".

### Convertir a Melani en administradora

1. Que ella entre una vez a la app y se registre con su email real (como cualquier clienta).
2. En Supabase, **SQL Editor**, correr (reemplazando el email):

   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'email-de-melani@ejemplo.com');
   ```

3. Desde ese momento puede entrar por `/admin/ingresar` con ese mismo email.

## 2. Configurar variables de entorno

Copiá `.env.example` a `.env` y completá:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_SALON_WHATSAPP=595981234567
VITE_SALON_NAME="Melani Cristine Lashes & Brows"
```

## 3. Correr en modo desarrollo

```bash
npm install
npm run dev
```

Abrí la URL que muestra la terminal (por defecto `http://localhost:5173`).

## 4. Publicar la app (recomendado: Vercel, gratis)

1. Subí esta carpeta a un repositorio de GitHub.
2. En [vercel.com](https://vercel.com), "Add New Project" → importá el repo.
3. En "Environment Variables" cargá las mismas 4 variables del `.env`.
4. Deploy. Vercel te da una URL tipo `https://melani-app.vercel.app`.
5. Volvé a Supabase → **Authentication → URL Configuration** y agregá esa URL final (Site URL y
   Redirect URLs) para que los links mágicos funcionen en producción.

También podés usar Netlify o Cloudflare Pages: el proceso es equivalente (proyecto Vite está listo
para build estático con `npm run build`, carpeta de salida `dist`).

## 5. Instalar la app en el iPhone

1. Abrir la URL publicada en Safari (no en Chrome, en iPhone tiene que ser Safari).
2. Tocar el botón de compartir (el cuadrado con la flecha) → **"Agregar a inicio"**.
3. Queda un ícono como cualquier app; al abrirlo no se ve la barra de Safari.

## Personalizar

- **Logo/ícono**: reemplazá los archivos en `public/icons/` (`icon-192.png`, `icon-512.png`,
  `apple-touch-icon.png`) por el logo real del salón — los que vienen ahora son un placeholder simple.
- **Colores**: se editan en `src/index.css`, dentro del bloque `@theme` (colores `brand-*` y
  `gold-*`).
- **Horario de atención**: tabla `business_hours` en Supabase (Table Editor), una fila por día de la
  semana. `is_closed = true` para los días cerrados.
- **Servicios y precios**: se cargan desde el panel de admin (`/admin/servicios`), no hace falta
  tocar código.
- **Anticipación mínima para cancelar/reagendar**: constante `MIN_NOTICE_HOURS` en
  `src/pages/client/MisCitas.jsx` (por defecto 6 horas).

## Estructura del proyecto

```
supabase/schema.sql       Esquema completo de base de datos + seguridad (RLS)
src/lib/                  Cliente de Supabase, funciones de acceso a datos, WhatsApp, formato
src/context/AuthContext   Sesión y perfil (clienta/admin) disponibles en toda la app
src/components/           Layout de clientas, layout de admin, rutas protegidas, estrellas, spinner
src/pages/client/         Inicio, login, reservar, mis citas, dejar reseña
src/pages/admin/          Login admin, calendario, servicios, recordatorios, reseñas
```

## Próximos pasos posibles (no incluidos en esta primera versión)

- Notificaciones push o recordatorio por email además del botón de WhatsApp.
- WhatsApp 100% automático vía Meta Cloud API (requiere verificación de negocio).
- Varias profesionales atendiendo en paralelo (hoy el sistema asume que solo Melani atiende, por eso
  bloquea cualquier superposición de horario).
- Pagos o seña online al reservar.
