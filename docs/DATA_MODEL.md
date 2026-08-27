# Modelo de datos

## Identidad

- `User` tiene email único, hash de contraseña, rol y estado.
- `Session` conserva solo hash de token, vencimiento y metadatos mínimos.
- `Address` pertenece a un usuario; pedidos copian la dirección en `shippingSnapshot`.

## Catálogo

- `Category` es un árbol autorreferenciado e indexado por padre/posición.
- `Product` pertenece a categoría y contiene estado, precio base y metadata no crítica.
- `ProductVariant` tiene SKU único, atributos comerciales y modificador de precio.
- `ProductImage`, `Mockup` y `PrintArea` separan fotografía de las superficies configurables.
- `Inventory` es 1:1 con variante y separa existencia de reserva.
- `PriceRule` guarda condición/ajuste; el evaluador de V0.1 usa configuración equivalente y determinista.

## Personalización y archivos

- `UploadedAsset` representa el original, hash, tipo, tamaño, dimensiones y storage key segura.
- `Customization` contiene una especificación de producción versionada.
- `CustomizationElement` apunta a área y, si es imagen, al asset original; guarda geometría y capa.
- Los previews son derivados y nunca reemplazan la relación con `UploadedAsset`.

## Carrito y pedido

- `Cart` admite identidad de usuario o sesión anónima.
- `CartItem` guarda el quote mostrado, pero checkout lo recalcula.
- `Order` usa número e idempotency key únicos y snapshots de cliente/entrega.
- `OrderItem` guarda producto, variante, personalización, precio unitario y total históricos.
- Las relaciones con catálogo son restrictivas para no borrar referencias productivas.

## Pago

- `Payment` usa una referencia única independiente del proveedor.
- `PaymentEvent` tiene restricción única `(provider, providerEventId)` para idempotencia.
- Estados externos se normalizan a `PaymentStatus`.

## Diseño y producción

- `DesignProof` versiona la prueba por ítem.
- `DesignApproval` registra usuario, decisión, comentario y fecha.
- `OrderStatusHistory` conserva actor, anterior, nuevo y nota.
- `AuditLog` registra cambios administrativos genéricos.

## Analítica

`BusinessEvent` registra nombre, usuario/sesión opcional, entidad y propiedades mínimas. Índices por nombre/fecha, usuario/fecha y sesión/fecha soportan extracción incremental.

## Dinero

Todos los montos son enteros en COP, sin decimales. Wompi recibe centavos mediante multiplicación controlada en su adapter. No se usan floats para dinero.

## Índices y restricciones críticas

- email, slug, SKU, número de pedido, idempotency key, storage key y referencia de pago son únicos.
- eventos de pago evitan duplicados por proveedor.
- consultas operativas están indexadas por estado/fecha.
- historial, assets y eventos están indexados para usuario/entidad y tiempo.

