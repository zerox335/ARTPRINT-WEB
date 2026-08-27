# Arquitectura de ArtPrint Commerce

## Decisión principal

V0.1 es un **monolito modular** desplegable como una unidad. Es la opción más segura para validar el producto sin pagar el costo operativo de microservicios prematuros. Los límites internos permiten extraer pagos, archivos, analítica o render de producción si la carga lo exige.

```text
Navegador
  ├─ Storefront / cuenta / administración
  ├─ Editor Konva (preview y especificación geométrica)
  └─ Carrito local (experiencia; nunca autoridad monetaria)
            │ HTTPS
Next.js App Router
  ├─ UI server/client components
  └─ API routes: validación, sesión, autorización, rate limit
            │
Aplicación y dominio (src/modules)
  ├─ catalog       catálogo y repositorio
  ├─ customization especificación de producción/editor
  ├─ pricing       Price Engine determinista
  ├─ cart          experiencia de carrito
  ├─ orders        creación y máquina de estados
  ├─ payments      contrato + Wompi/MP/sandbox
  ├─ identity      credenciales y sesiones
  ├─ files         validación + object storage
  └─ admin         casos de uso operativos
            │
Infraestructura
  ├─ PostgreSQL / Prisma
  ├─ S3-compatible storage
  └─ Proveedores de pago
```

## Reglas de dependencia

1. El dominio no importa componentes React ni rutas HTTP.
2. Las rutas parsean entradas y llaman casos de uso; no duplican reglas de precio.
3. Los proveedores implementan `PaymentProvider` y no filtran tipos externos al dominio.
4. El catálogo se accede por `CatalogRepository`; la implementación híbrida solo usa fixtures cuando `DEMO_MODE=true`.
5. Prisma vive en infraestructura. Los snapshots de pedido son deliberados, no un reemplazo del catálogo.

## Flujo crítico de compra

1. El editor produce una especificación JSON versionada con vista, área, geometría y capas.
2. Los assets se suben por separado. El cliente recibe un ID opaco; al crear pedido el servidor sustituye cualquier ruta declarada por la ruta canónica de base de datos.
3. El carrito solicita cotizaciones al endpoint de pricing y muestra el resultado.
4. Checkout envía variante, cantidad, técnica, áreas y personalización; no envía un precio confiable.
5. `createOrder` reconstruye todas las cotizaciones, calcula envío y guarda snapshots en una transacción.
6. Se crea `Payment` con referencia única y se inicia el proveedor fuera de la transacción de base de datos.
7. Solo `processPaymentWebhook` o el sandbox explícito de desarrollo pueden pasar de `PENDING_PAYMENT` a `PAID`.
8. `PaymentEvent(provider,eventId)` evita procesar duplicados.

## Preview frente a producción

- Preview: bitmap opcional de baja resolución o canvas que ayuda al cliente.
- Producción: asset original + unidades reales + coordenadas + escala + rotación + capas.
- El servidor busca el asset por ID y reemplaza `originalStorageKey` con su valor canónico.
- Ningún caso de uso de producción consume el data URL del preview como archivo maestro.

## Constructor administrativo de catálogo

`app/admin/productos` compone dos clientes operativos pequeños: creación de categorías y construcción de productos. La ruta HTTP solo autentica, autoriza y valida; el caso de uso `createCatalogProduct` verifica categorías, propiedad de assets, conflictos de slug/SKU y persiste producto, variante, inventario, galería, mockups, áreas y auditoría en una única transacción.

La geometría se guarda normalizada en porcentajes para adaptarse a cualquier resolución de plantilla, mientras las medidas físicas se conservan en centímetros. El calibrador administrativo edita visualmente esa geometría mediante puntero o teclado y mantiene sincronizados los campos numéricos. `PrintArea.allowOverflow` decide por vista si el canvas recorta al área producible o deja una composición libre; las exclusiones protegidas (por ejemplo, la cámara de una carcasa) viven en metadata versionable asociada al ID del área. Así se pueden agregar tipos de producto y vistas sin introducir condicionales gráficos específicos en el núcleo.

## Price Engine

El dinero se representa como enteros en pesos colombianos. La conversión a centavos se realiza únicamente en el adaptador del proveedor. El motor recibe un contexto autorizado y una solicitud validada, genera líneas, tier de volumen, descuento y fingerprint. El input HTTP descarta campos desconocidos como `unitPrice` o `total`.

## Máquina de estados

Las transiciones permitidas viven en `src/modules/orders/domain/order-state-machine.ts`. Cada transición operativa guarda actor, estado anterior/nuevo, fecha y nota, además de `AuditLog` para cambios administrativos. `PAID` está bloqueado en el endpoint administrativo.

## Datos y analítica

`BusinessEvent` almacena eventos de negocio con propiedades mínimas. No se registran pulsaciones, contenido completo de archivos ni datos financieros. Los eventos permiten calcular funnel, ticket, recurrencia, duración de producción y aprobación inicial.

## Escalamiento

- Separar workers de archivos (antivirus, thumbnails, render) detrás de cola.
- Llevar rate limiting y sesiones de alta escala a Redis conservando la interfaz.
- Emitir `BusinessEvent` a un outbox transaccional y luego a warehouse.
- Extraer payments si aparecen conciliación, reembolsos y múltiples países.
- Usar CDN delante de object storage y URLs firmadas de corta duración.
