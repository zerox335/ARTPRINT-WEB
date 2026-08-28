# ArtPrint Commerce V0.1

## Inicio rápido en este equipo

Haz doble clic en `INICIAR-ARTPRINT.cmd`. En el primer inicio, el lanzador instala dependencias si hacen falta, genera Prisma, inicia PostgreSQL local o Docker, aplica las migraciones, carga el catálogo y abre `http://127.0.0.1:3000`. Mantén abierta la ventana titulada `Servidor ArtPrint - no cerrar` mientras uses la tienda.

Base comercial de e-commerce para productos personalizados. El flujo vertical implementado es:

**personalizar → guardar automáticamente → previsualizar → cotizar en servidor → carrito → autenticar → crear pedido → pagar → recibir prueba → aprobar o pedir cambios → producir**.

No es una landing estática: incluye catálogo, editor Konva, carga de originales, Price Engine, carrito, checkout, sesiones, PostgreSQL/Prisma, pedidos con snapshots, pagos intercambiables, administración, auditoría, analítica de negocio y pruebas.

## Stack

- Next.js App Router, React y TypeScript estricto.
- Tailwind CSS 4 como pipeline CSS y sistema visual propio en `app/globals.css`.
- PostgreSQL 16 y Prisma ORM.
- Zod para validar fronteras HTTP y dominio.
- Konva/react-konva para el editor visual.
- Vitest para pruebas unitarias de dinero, firmas, archivos, permisos y estados.
- Almacenamiento local en desarrollo o S3-compatible en producción.
- Adaptadores de pago: sandbox explícito, Wompi y Mercado Pago.

## Inicio rápido

Requisitos: Node.js 22 o superior, pnpm y Docker con Compose.

```bash
cp .env.example .env
docker compose up -d postgres
pnpm install
pnpm db:generate
pnpm db:deploy
pnpm db:seed
pnpm dev
```

Abre `http://localhost:3000`.

Usuarios del seed (solo desarrollo):

- Administrador: `admin@artprint.local` / `AdminArtPrint2026!`
- Cliente: `cliente@artprint.local` / `ClienteArtPrint2026!`

No uses estas contraseñas fuera de un entorno local. El seed actualiza sus hashes cada vez que corre.

## Scripts

| Comando | Función |
| --- | --- |
| `pnpm dev` | servidor de desarrollo |
| `pnpm build` | genera Prisma y compila producción |
| `pnpm start` | sirve el build |
| `pnpm lint` | ESLint sin warnings permitidos |
| `pnpm typecheck` | TypeScript estricto |
| `pnpm test` | pruebas Vitest |
| `pnpm test:coverage` | cobertura |
| `pnpm db:migrate` | crea/aplica migraciones en desarrollo |
| `pnpm db:deploy` | aplica migraciones versionadas |
| `pnpm db:seed` | datos ficticios e identidades locales |
| `pnpm admin:create` | crea o actualiza un administrador usando variables de entorno |
| `pnpm db:local:start` | inicia el PostgreSQL portátil instalado en Windows |
| `pnpm db:local:stop` | detiene el PostgreSQL portátil instalado en Windows |
| `pnpm db:local:status` | consulta el estado del PostgreSQL portátil |
| `pnpm quality` | lint + tipos + tests + build |

## Variables de entorno

Parte de [`.env.example`](./.env.example). Las variables sensibles nunca tienen valores reales en el repositorio.

- `DATABASE_URL`, `DIRECT_URL`: PostgreSQL.
- `SESSION_SECRET`: mínimo 32 caracteres aleatorios en producción.
- `DEMO_MODE`: usa fixtures locales explícitamente; mantenlo en `false` para operar con PostgreSQL.
- `PAYMENT_PROVIDER`: `sandbox`, `wompi` o `mercadopago`.
- `STORAGE_DRIVER`: `local` o `s3`.
- `WOMPI_*`: llave pública, secreto de integridad y secreto de eventos.
- `MERCADOPAGO_*`: access token y secreto Webhook.
- `S3_*`: endpoint, región, bucket y credenciales del object storage.

La aplicación rechaza `PAYMENT_PROVIDER=sandbox` en producción. Las credenciales privadas y secretos de firma nunca se envían al navegador.

## Base de datos

PostgreSQL local se levanta con `docker compose up -d postgres`. Para una instalación limpia:

```bash
docker compose up -d postgres
pnpm db:deploy
pnpm db:seed
```

El modelo y sus invariantes se describen en [`docs/DATA_MODEL.md`](./docs/DATA_MODEL.md). Los pedidos guardan snapshots JSON del producto, variante, personalización, cliente y entrega; editar el catálogo no cambia el histórico.

## Pagos

### Desarrollo

`PAYMENT_PROVIDER=sandbox` crea una transacción pendiente y lleva a una pantalla marcada como sandbox. Aprobar allí actualiza el pedido mediante una ruta autenticada que está deshabilitada en producción.

### Wompi

Configura llaves de sandbox y la URL de eventos:

`https://tu-dominio.com/api/payments/webhooks/wompi`

La firma de integridad se genera en servidor. El webhook verifica el checksum SHA-256 con las propiedades declaradas por Wompi, timestamp y secreto de eventos. La redirección nunca confirma el pago.

### Mercado Pago

Configura Checkout Pro y Webhooks (no IPN) hacia:

`https://tu-dominio.com/api/payments/webhooks/mercadopago`

El adaptador valida `x-signature`/`x-request-id` con HMAC y consulta el pago a la API de Mercado Pago antes de normalizar el estado.

## Archivos

PNG, JPEG y SVG seguro hasta 12 MB. Se validan extensión, MIME, magic bytes, dimensiones y contenido activo de SVG. El nombre interno se deriva del SHA-256, nunca del nombre entregado por el cliente. Los originales se guardan en `.data/uploads` (ignorado por Git) o S3; el mockup no reemplaza al original.

## Alimentar el catálogo desde administración

Un administrador puede abrir `/admin/productos` y crear categorías y productos sin modificar código. El buscador permite localizar cualquiera de las referencias de carcasa pendientes y entrar a **Configurar mockup** para cargar la plantilla exacta, calibrar el área imprimible, proteger la cámara y publicarla. El rectángulo morado y la exclusión rosada se mueven y redimensionan directamente con el mouse o teclado; los campos numéricos quedan como ajuste fino sincronizado. El constructor general reutiliza el mismo calibrador visual y permite guardar borradores o publicar nuevos modelos, subir una galería, registrar la variante inicial con SKU e inventario y crear varias vistas de mockup. Cada vista define su zona imprimible en porcentajes, sus medidas reales en centímetros, si admite desbordamiento creativo y, cuando aplica, una exclusión protegida para cámaras, asas u otras partes que no deben cubrirse. Las imágenes se cargan primero mediante el módulo seguro de archivos y el servidor vuelve a validar propiedad, estado y dimensiones antes de publicar.

En carcasas, un PNG transparente permite intentar la detección local del recorte de cámara. El resultado se muestra como zona rosada y siempre debe confirmarse antes de publicar. Los JPG o mockups sin transparencia conservan la calibración manual, porque no contienen información suficiente para detectar la cámara de forma confiable.

Para crear un administrador sin guardar su contraseña en el repositorio:

```powershell
$env:ADMIN_EMAIL="administracion@ejemplo.com"
$env:ADMIN_PASSWORD="una-clave-segura"
$env:ADMIN_NAME="Administración ArtPrint"
pnpm admin:create
```

Al publicarse, el nuevo producto entra al mismo catálogo y personalizador que consumen los clientes. La operación también deja un registro de auditoría. Los mockups son plantillas de previsualización; el original que sube el comprador continúa almacenándose por separado para producción.

### Catálogo inicial de carcasas

El seed incluye un directorio de compatibilidad con 461 referencias únicas de Apple, Samsung, Huawei, Motorola, Xiaomi, Vivo, Oppo, Tecno, Infinix, Realme y Honor. Las publicaciones equivalentes por color o estilo se consolidan en una sola referencia por modelo. `scripts/build-case-reference-catalog.mjs` permite regenerar el archivo tipado desde una copia local autorizada de las páginas de referencia; no descarga contenido durante el build ni expone el origen comercial en la tienda.

Once modelos iniciales cuentan con una plantilla gráfica calibrada, incluidos iPhone 11, 11 Pro y 11 Pro Max. Solo estos se publican como productos personalizables. Las otras referencias permanecen como borradores internos y aparecen en el directorio sin fotografía ni acceso a compra hasta que el administrador cargue y calibre su mockup específico.

## Editor y solicitudes de diseño

Una capa seleccionada puede escalarse con tiradores grandes, deslizador, botones o las acciones **Ajustar completo** y **Rellenar área**. La camiseta base ofrece mockups realistas separados para frente, espalda y ambos laterales, responde al color de la variante y permite extender el diseño por toda la vista cuando el área administrativa habilita desbordamiento. La galería de diseños de muestra agrega plantillas editables diferentes para carcasas, textiles y productos de bebida. El cliente también puede escribir instrucciones de hasta 1000 caracteres; la nota viaja en la personalización del carrito y se conserva en el snapshot histórico del pedido.

Mugs, vasos y termos utilizan una sola vista frontal con recorte curvo y sombreado lateral para integrar visualmente el diseño al cilindro. La guía desaparece cuando ya hay contenido. El editor conserva borradores en el navegador, incluye deshacer/rehacer y guarda una vista personalizada que aparece en el carrito. **Editar este diseño** recupera imágenes, textos, posiciones, tamaño, variante y cantidad.

Desde administración, la bandeja **Pruebas para aprobación** permite subir el montaje revisado y enviarlo al cliente. El cliente lo ve dentro del seguimiento del pedido y puede aprobarlo o solicitar cambios por escrito. Cada respuesta actualiza el estado y conserva el historial.

## Despliegue

1. Proveer PostgreSQL administrado y object storage S3-compatible.
2. Generar `SESSION_SECRET` fuerte y cargar secretos desde el gestor de la plataforma.
3. Ejecutar `pnpm db:deploy` como paso de release.
4. Ejecutar `pnpm build` y `pnpm start` en Node.js 22+.
5. Configurar HTTPS, dominios, Webhooks de producción y observabilidad.
6. Desactivar `DEMO_MODE` y elegir un proveedor real.

## Documentación

- [`ARCHITECTURE.md`](./ARCHITECTURE.md): límites, flujos y decisiones.
- [`SECURITY.md`](./SECURITY.md): controles, amenazas y operación.
- [`docs/DATA_MODEL.md`](./docs/DATA_MODEL.md): relaciones, índices e invariantes.
- [`docs/ROADMAP.md`](./docs/ROADMAP.md): alcance real y siguientes milestones.

## Limitaciones honestas de V0.1

- El constructor administrativo crea productos, una variante inicial, inventario, galería y varias vistas de mockup. La edición/versionado posterior, variantes adicionales y reglas avanzadas de precio quedan para el siguiente milestone.
- La interfaz actual configura una zona imprimible y una exclusión protegida por vista; el contrato de servidor ya admite hasta seis zonas por mockup.
- El inventario de referencias de carcasas es una fotografía inicial, no una sincronización automática. Once referencias tienen plantilla calibrada; las restantes no pueden comprarse ni personalizarse hasta cargar su mockup exacto.
- El editor trabaja una vista a la vez y conserva elementos por área; todavía no incluye guías magnéticas ni alerta automática de DPI.
- La detección de cámara requiere un hueco transparente reconocible en el PNG y es una ayuda de calibración, no una garantía geométrica; el administrador debe confirmar la exclusión antes de publicar.
- El editor puede mostrar un diseño extendido sobre toda la prenda cuando el administrador lo habilita; una impresión real que cruce costuras o mangas sigue requiriendo revisión técnica y un molde de sublimación integral compatible.
- El almacenamiento local sirve para desarrollo de una sola instancia. Producción debe usar S3 y análisis antimalware asíncrono.
- En rate limiting se usa memoria de proceso. Un despliegue distribuido debe conectar Redis/Upstash o la tabla preparada.
- Impuestos y tarifas de transportadora son cero/fijos en V0.1; requieren reglas fiscales y carrier definidos por negocio.
- Los adaptadores Wompi/Mercado Pago están implementados, pero las pruebas end-to-end con sus sandboxes requieren credenciales reales del comercio.
- La aprobación ya incluye bandeja administrativa, versiones, comentarios y decisión del cliente; las notificaciones externas todavía requieren configurar un proveedor de correo o mensajería.
