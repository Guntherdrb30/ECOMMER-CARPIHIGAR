# Carpihogar.ai – E‑commerce + Backoffice

Carpihogar.ai es una plataforma de comercio electrónico con paneles para Cliente, Aliado, Vendedor y Admin. Incluye catálogo, carrito y checkout, gestión de presupuestos y ventas (incluida modalidad Aliado con precios P1/P2), inventario, compras, envíos, reportes y mensajería.

## Stack Técnico

- Framework: `Next.js (App Router)`
- UI: `React`, `TailwindCSS`
- Autenticación: `next-auth`
- ORM: `Prisma` + `PostgreSQL`
- Emails: `nodemailer`
- Almacenamiento de archivos: `@vercel/blob`

## Arquitectura y Organización

- `app/`: rutas (sitio público, API Routes y dashboards).
- `server/actions/`: acciones de servidor (lógica de negocio) usadas desde server components o formularios.
- `prisma/schema.prisma`: modelo de datos.
- `components/`: componentes reutilizables (admin, cliente, aliado, etc.).
- `middleware.ts`: protección de rutas por rol.

## Roles y Permisos

- `CLIENTE`: compra en la tienda y accede al panel del cliente.
- `ALIADO`: crea y gestiona presupuestos y ventas propias; ve reportes y accesos rápidos del cliente.
- `VENDEDOR`: registra ventas en tienda y gestiona presupuestos.
- `ADMIN`: acceso total (productos, compras, inventario, usuarios, reportes, etc.).

La protección de rutas se aplica en `middleware.ts`:
- `/dashboard/admin/*` → requiere `ADMIN`.
- `/dashboard/cliente/*` → requiere sesión.
- `/dashboard/aliado/*` → requiere `ALIADO`.

## Áreas del Sistema

### Sitio público
- Home, categorías, listado y detalle de productos.
- Favoritos (wishlist) y comparador.
- Carrito y checkout con métodos de pago: `ZELLE`, `TRANSFERENCIA`, `PAGO_MOVIL` (USD/VES).
- Envío: automático según ciudad, o selección manual para Barinas (Retiro en tienda / Delivery).

### Panel de Cliente (`/dashboard/cliente`)
- Resumen, pedidos, envíos, favoritos, direcciones, perfil.

### Panel de Aliado (`/dashboard/aliado`)
- Resumen con KPIs: ventas totales, ganancia estimada y cantidad de ventas.
- Presupuestos del aliado: crear, listar, ver, enviar por WhatsApp, imprimir versión “Aliado (P2)”, editar.
- Nueva venta: desde cero o convertida desde presupuesto (precarga de ítems). Selector P1/P2 por ítem.
- Reportes: serie diaria (ingresos) y top productos por ingresos.

Flujo Aliado:
1) Crear presupuesto (P1 – precio cliente). 2) Enviar/editar; 3) Convertir a venta → verifica datos fiscales y pago; 4) Reportes con P1/P2 (ganancia estimada = (precio venta − P2) × cantidad).

### Panel de Admin (`/dashboard/admin`)
- Productos, categorías, inventario y movimientos.
- Compras (POs, recepción, costos), proveedores.
- Ventas (tienda), presupuestos y conversión a venta.
- Envíos y cuentas por cobrar (crédito).
- Reportes (KPIs, series, por categoría y vendedor), mensajería, usuarios y ajustes del sistema.

## Precios P1/P2 y Ganancias

- `Product.priceUSD` → P1 (cliente)
- `Product.priceAllyUSD` → P2 (aliado)
- Presupuesto: se genera con P1 (cliente).
- “Presupuesto Aliado” (impresión): muestra total con P2 (costos del aliado). En reportes de aliado, la ganancia estimada usa P2 si existe.
- En venta offline (admin/vendedor/aliado) se puede elegir P1/P2 por ítem.

## Estado y Flujo de Presupuestos

Estados: `BORRADOR`, `ENVIADO`, `APROBADO`, `RECHAZADO`, `VENCIDO`.
- Expiración configurable por fecha (marca `VENCIDO` automático).
- Convertir a venta crea orden, pago (si contado), envío y registra auditoría.

## Pagos y Envíos

Pagos: `PAGO_MOVIL`, `TRANSFERENCIA`, `ZELLE` (USD o VES). Validaciones de campos por método.

Envíos:
- Online: TEALCA/MRW por defecto; si ciudad contiene “Barinas”, canal TIENDA (Retiro/Delivery incluido) o selección manual.
- Tienda (offline): lógica local (Retiro/Delivery) similar y auditoría.

## Datos y Modelos (Prisma)

Entidades principales: `User`, `Product` (incluye `priceAllyUSD` y márgenes), `Order`/`OrderItem`, `Quote`/`QuoteItem`, `Payment`, `Shipping`, `Receivable`, `Commission`, `SiteSettings`, `Category`, `Supplier`, `PurchaseOrder`.

Estados relevantes:
- Orden: `PENDIENTE`, `PAGADO`; Tipo: `CONTADO`/`CREDITO`.
- Presupuesto: `BORRADOR`, `ENVIADO`, `APROBADO`, `RECHAZADO`, `VENCIDO`.

## Endpoints y Acciones

- API
  - `GET /api/products/search?q=...` (ADMIN/VENDEDOR/ALIADO): búsqueda para formularios.
  - `GET /api/quotes/:id/send` (ADMIN/VENDEDOR/ALIADO): abre WhatsApp con contenido del presupuesto.
- Acciones de servidor (server/actions)
  - `sales`: crear venta offline; listar ventas; comisiones.
  - `quotes`: CRUD básico de presupuestos, expiración y conversión a venta.
  - `ally`: KPIs del aliado, serie diaria y top productos.
  - `orders`, `wishlist`, `reports`, `inventory`, `products`, etc.

## Estructura de Carpetas

- `app/` páginas Next.js y rutas API.
- `components/` UI compartida (admin, cliente, aliado) y utilitarios.
- `server/actions/` lógica de negocio con Prisma.
- `prisma/` schema y seeds.
- `public/` estáticos.

## Variables de Entorno

Revisa `.env.example` y configura al menos:
- `DATABASE_URL` (PostgreSQL)
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `EMAIL_ENABLED=true|false` y credenciales SMTP (si aplica): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- `BLOB_READ_WRITE_TOKEN` (si usas @vercel/blob)

## Desarrollo Local

1) Copia `.env.example` → `.env` y completa valores.
2) Instala dependencias: `npm install`.
3) Genera cliente Prisma: `npm run postinstall` (o `npx prisma generate`).
4) Migra esquema:
   - Desarrollo: `npx prisma migrate dev` (o usa `npm run prisma:deploy` si ya tienes migraciones).
5) (Opcional) Seed de datos: `npm run seed` o scripts bajo `prisma/` (`seed:sales`, `seed:demo`, `root:create`).
6) Inicia dev: `npm run dev`.

## Scripts

- `npm run dev` → servidor local.
- `npm run build` → `prisma migrate deploy` + build de Next.js.
- `npm start` → producción local.
- `npm run prisma:deploy` → aplica migraciones en prod.
- `npm run seed*` → varios datos de prueba.

## Despliegue (Vercel)

1) Vincula el repo en Vercel y define variables del entorno.
2) Rama: `master` (por defecto).
3) Al hacer `git push`, Vercel construye y despliega.

## Seguridad y Auditoría

- Protección por rol en middleware.
- Auditoría de acciones críticas (ventas, presupuestos, envíos, pagos) en `AuditLog`.

## Notas de Internacionalización

- La UI usa textos en español. Puedes factorizar textos a constantes/mensajes si deseas i18n.

## Soporte y Mantenimiento

- Para ajustes de branding, revisa `SiteSettings` (colores, logo, teléfonos, emails, márgenes por defecto).
- Para precios aliados (P2), establece `priceAllyUSD` en productos o márgenes por defecto.

---

© Carpihogar.ai – Este repositorio está pensado para despliegue en Vercel con base de datos PostgreSQL.
