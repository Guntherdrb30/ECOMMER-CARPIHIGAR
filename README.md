# Carpihogar.ai – E‑commerce + Backoffice

Carpihogar.ai es una plataforma de comercio electrónico orientada a retail y proyectos de mobiliario, con paneles para Cliente, Aliado, Vendedor, Delivery y Admin. Incluye catálogo, carrito y checkout, gestión de presupuestos y ventas (incluida modalidad Aliado con precios P1/P2), inventario, compras, envíos, reportes, mensajería y un asistente con IA.

---

## Características principales

- Tienda online con categorías, buscador, wishlist y comparador.
- Carrito y checkout con métodos de pago en USD/VES (`ZELLE`, `TRANSFERENCIA`, `PAGO_MOVIL`).
- Paneles diferenciados por rol (cliente, aliado, vendedor, delivery, admin).
- Flujo de presupuestos → venta (incluyendo precios P1/P2 para aliados).
- Gestión de inventario, compras, proveedores y cuentas por cobrar.
- Reportes de ventas, comisiones y KPIs por rol.
- Integraciones: Vercel Blob (archivos), correo SMTP, OpenAI (asistente, voz, OCR de soportes de pago), ManyChat.

---

## Stack técnico

- Framework: `Next.js` (App Router).
- UI: `React`, `TailwindCSS` + componentes propios.
- Autenticación: `next-auth` (credenciales + Google OAuth).
- ORM: `Prisma` + `PostgreSQL`.
- Emails: `nodemailer` (SMTP configurable).
- Almacenamiento de archivos: `@vercel/blob`.
- Despliegue recomendado: `Vercel` (Plan Pro).

---

## Arquitectura y organización

- `app/`: rutas del sitio público, dashboards y API Routes.
- `components/`: componentes reutilizables (admin, cliente, aliado, etc.).
- `server/actions/`: acciones de servidor con lógica de negocio (ventas, presupuestos, inventario, usuarios…).
- `prisma/schema.prisma`: modelo de datos y relaciones.
- `middleware.ts`: protección de rutas según rol y verificación de email.
- `lib/`: helpers de autenticación (`auth.ts`), Prisma (`prisma.ts`), mailing (`mailer.ts`), integración con OpenAI, etc.

---

## Roles y permisos

- `CLIENTE`: compra en la tienda y accede al panel de cliente.
- `ALIADO`: crea y gestiona presupuestos y ventas propias; visualiza reportes y accesos rápidos del cliente.
- `VENDEDOR`: registra ventas en tienda y gestiona presupuestos.
- `DELIVERY`: gestiona entregas asignadas y flujo de reparto.
- `DESPACHO`: acceso acotado a módulo de envíos.
- `ADMIN`: acceso completo (productos, compras, inventario, usuarios, reportes, ajustes, etc.).

Protección de rutas (ver `middleware.ts`):

- `/dashboard/admin/*` → requiere `ADMIN` (o `DESPACHO` para `/dashboard/admin/envios`).  
- `/dashboard/cliente/*` → requiere sesión; redirección según rol.
- `/dashboard/aliado/*` → requiere `ALIADO`.
- `/dashboard/delivery/*` → requiere `DELIVERY`.
- `/checkout/*` → requiere sesión y email verificado para CLIENTE/ALIADO/DELIVERY (si se fuerza verificación, ver sección de seguridad).

---

## Áreas del sistema

### Sitio público

- Home con carrusel de héroes y categorías destacadas.
- Listado y detalle de productos (incluye videos opcionales y botones sociales).
- Wishlist (favoritos) y comparador de productos.
- Carrito, cálculo de envíos y checkout.
- Flujo asistido por IA para búsqueda de productos y ayuda en compras.

### Panel de Cliente (`/dashboard/cliente`)

- Resumen, pedidos, envíos, favoritos, direcciones y perfil.
- Cambio de contraseña y administración básica de datos personales.

### Panel de Aliado (`/dashboard/aliado`)

- Dashboard con KPIs: ventas totales, ganancia estimada, cantidad de ventas.
- Presupuestos: crear, listar, ver, enviar por WhatsApp, imprimir versión “Aliado (P2)”, editar.
- Nueva venta: desde cero o convertida desde presupuesto (precarga de ítems, selector P1/P2 por ítem).
- Reportes: serie diaria de ingresos y top productos por ingresos.

### Panel de Admin (`/dashboard/admin`)

- Productos, categorías, inventario y movimientos.
- Compras (POs, recepción, costos), proveedores.
- Ventas (online/offline), presupuestos y conversión a venta.
- Envíos, cuentas por cobrar y comisiones.
- Reportes (KPIs, series, por categoría, vendedor, aliado).
- Gestión de usuarios, roles y ajustes del sistema (colores, banners, márgenes, datos fiscales, etc.).

### Panel de Delivery (`/dashboard/delivery`)

- Solicitud de registro como delivery con carga de cédula, selfie y datos del vehículo.
- Listado de envíos asignados y actualización de estados.

---

## Precios P1/P2 y ganancias

- `Product.priceUSD` → P1 (precio cliente).
- `Product.priceAllyUSD` → P2 (precio aliado).
- Los presupuestos se generan con P1 (cliente).
- La “impresión de Presupuesto Aliado” muestra totales con P2 (costos del aliado).
- En reportes de aliado, la ganancia estimada usa P2 cuando existe; en venta offline se puede elegir P1/P2 por ítem.

---

## Datos y modelos (Prisma)

Entidades principales (ver `prisma/schema.prisma`):

- `User`, `Product`, `Order`/`OrderItem`, `Quote`/`QuoteItem`, `Payment`, `Shipping`, `Receivable`, `Commission`, `SiteSettings`, `Category`, `Supplier`, `PurchaseOrder`, `Conversation`, etc.

Estados relevantes:

- Orden: `PENDIENTE`, `PAGADO` (tipo `CONTADO` / `CREDITO`).  
- Presupuesto: `BORRADOR`, `ENVIADO`, `APROBADO`, `RECHAZADO`, `VENCIDO`.  
- Usuario: `role` (CLIENTE, ALIADO, VENDEDOR, DESPACHO, ADMIN, DELIVERY) y `alliedStatus` (`NONE`, `PENDING`, `APPROVED`).  
- Delivery: `deliveryStatus` (`NONE`, `PENDING`, `APPROVED`) + campos de vehículo y documentos.

---

## Seguridad

### Autenticación y verificación de email

- Sesiones gestionadas por `next-auth` con `Credentials` y Google OAuth.
- Clave de sesión: `NEXTAUTH_SECRET` (obligatoria en producción).
- Verificación de correo opcional pero recomendada:
  - Variable `ENFORCE_EMAIL_VERIFICATION=true` fuerza email verificado para CLIENTE/ALIADO/DELIVERY al acceder a dashboards y checkout.
  - Enlace de verificación se envía tras registro y puede reenviarse.

### Políticas de contraseña

Implementadas en `lib/password.ts` y usadas en registro, reset y cambios de clave:

- Mínimo 8 caracteres.
- Debe contener al menos un número.
- La validación se aplica en:
  - Registro (`/api/auth/register` + formulario `/auth/register`).
  - Reseteo de contraseña por token (`/api/auth/reset-password` → `server/actions/auth.ts`).
  - Cambios desde panel de admin (`updateUserPasswordByForm`).
  - “Bootstrap” de contraseñas para roles privilegiados en `lib/auth.ts`.

### Subida de archivos

- Endpoint general `POST /api/upload`:
  - Lista blanca de MIME:
    - Imágenes: `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
    - Videos: `video/mp4`, `video/quicktime`.
  - Usuarios no autenticados: sólo imágenes y máximo 5 MB (ej. registro de delivery).
  - Se utiliza `@vercel/blob` como almacenamiento y `sharp` para extraer color dominante.
- Soportes de pago (`/api/assistant/upload-proof`):
  - Acepta imágenes en `JPG/PNG/WEBP/HEIC/HEIF` hasta 5 MB.
  - Procesa la imagen con OpenAI para extraer método, moneda, montos y referencia.

### Otras medidas

- Protección por rol y verificación en `middleware.ts` y `server/actions/*`.
- Tokens de reset y verificación de email almacenados hasheados o aleatorios, con expiración.
- Auditoría de acciones críticas (ventas, presupuestos, envíos, pagos, cambios de usuario) mediante `AuditLog` (ver acciones de servidor).

> Nota: se recomienda complementar con reglas de WAF / Firewall en Vercel Pro (rate limiting en `/api/auth/*`, `/api/upload`, bloqueo de IPs sospechosas, etc.).

---

## Variables de entorno

Revisa `.env.example`. Mínimo requerido para producción:

- Base de datos:
  - `DATABASE_URL` (PostgreSQL, idealmente con SSL).
- NextAuth:
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL` (ej. `https://carpihogar.com`)
  - `NEXT_PUBLIC_URL` (misma URL pública).
- Email:
  - `EMAIL_ENABLED=true|false`
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- Archivos:
  - `BLOB_READ_WRITE_TOKEN` (si usas @vercel/blob con token dedicado).
- OpenAI / IA (opcionales pero recomendados):
  - `OPENAI_API_KEY`
- Seguridad extra:
  - `ENFORCE_EMAIL_VERIFICATION=true` para obligar verificación de correo.
- Otros:
  - `ROOT_EMAIL` (usuario root/admin principal).
  - Integraciones como ManyChat (`MANYCHAT_*`) según se necesite.

En Vercel, configura estas variables en **Environment Variables** (Production/Preview) y nunca subas `.env` reales al repositorio público.

---

## Desarrollo local

1. Copia `.env.example` a `.env` y completa valores mínimos (ver sección anterior).
2. Instala dependencias:
   - `npm install`
3. Genera cliente Prisma:
   - `npm run postinstall` o `npx prisma generate`
4. Aplica migraciones de base de datos:
   - Desarrollo: `npx prisma migrate dev`
   - Producción / CI: `npm run prisma:deploy`
5. (Opcional) Seed de datos:
   - Scripts en `prisma/` (`seed.ts`, `seed_demo.ts`, `seed_sales.ts`, etc.).
6. Inicia entorno de desarrollo:
   - `npm run dev`

---

## Scripts principales

- `npm run dev` → servidor local de desarrollo.
- `npm run build` → `prisma migrate deploy` + build de Next.js.
- `npm start` → ejecutar build en modo producción.
- `npm run prisma:deploy` → aplicar migraciones en el entorno actual.
- `npm run seed*` → distintos scripts de carga de datos en `prisma/`.

---

## Despliegue en Vercel

1. Vincula el repositorio a un proyecto en Vercel.
2. Configura las **Environment Variables** (Production/Preview) según lo descrito arriba.
3. Define la rama de producción (por defecto `master`).
4. En cada `git push` a la rama configurada Vercel construye y despliega automáticamente.
5. Para bases de datos gestionadas (Neon, Supabase, etc.), usa `npx prisma migrate deploy` en el paso de build (ya incluido en `npm run build`).

---

## Licencia

- Copyright © 2025 **Guntherdrb30**. Todos los derechos reservados.
- El código se publica con fines de evaluación y demostración no comercial.
- Cualquier uso, copia, modificación o explotación comercial requiere licencia previa y por escrito del titular.
- Consulta el archivo `LICENSE` para los términos completos.

---

## Notas finales

- La UI está en español. Para internacionalización, se pueden extraer textos a constantes/mensajes y conectar un sistema de i18n.
- Ajustes de branding (colores, logo, teléfonos, emails, márgenes por defecto) se gestionan vía `SiteSettings` desde el panel de Admin.
- El proyecto está optimizado para despliegue en **Vercel** con base de datos PostgreSQL gestionada.

