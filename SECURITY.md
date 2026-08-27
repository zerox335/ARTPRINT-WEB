# Seguridad

## Controles implementados

- Validación Zod en entradas HTTP y reglas en dominio.
- Sesiones aleatorias de 256 bits; solo se guarda SHA-256 del token.
- Cookie HttpOnly, `SameSite=Lax`, `Secure` en producción y expiración definida.
- Contraseñas bcrypt con factor 12.
- Roles y autorización por recurso para cliente/administración.
- Comparación temporalmente segura de firmas hexadecimales.
- Validación de firma Wompi y HMAC Mercado Pago; consulta server-to-server en Mercado Pago.
- Idempotencia de pedido y eventos de pago por restricciones únicas.
- `PAID` no está disponible como transición administrativa.
- Validación de extensión, MIME, magic bytes, tamaño, dimensiones y SVG activo.
- Storage key derivada de hash y protección contra path traversal.
- Cabeceras `nosniff`, frame denial, referrer y permissions policy.
- Verificación Same Origin en mutaciones de navegador.
- Rate limiting básico para login, registro, uploads y creación de pedido.
- Errores externos normalizados sin stack trace ni secretos.
- Variables sensibles fuera de Git y `.env.example` sin credenciales.

## Operación de secretos

Los secretos deben vivir en un secret manager. Rota de inmediato cualquier secreto expuesto. Wompi usa secretos distintos para integridad de checkout y eventos. Mercado Pago debe configurarse con Webhooks y secret signature; no usar IPN para autenticidad.

## Archivos

El filtro síncrono bloquea contenido activo conocido. Antes de producción pública debe añadirse cuarentena y escaneo antimalware asíncrono. SVG se sirve con CSP `sandbox`; no se inserta como HTML. Los originales no son públicos por nombre y los assets usan IDs opacos.

## CSRF y XSS

Las sesiones usan SameSite y las mutaciones validan `Origin`. La UI no usa HTML de clientes. El JSON-LD se serializa reemplazando `<`. Si se añade contenido enriquecido, debe sanitizarse con una política allowlist en servidor.

## SQL injection

Prisma parametriza consultas. No se construye SQL con strings de usuario. Cualquier futura consulta raw debe usar `$queryRaw` tagged templates, jamás `$queryRawUnsafe`.

## Rate limiting distribuido

V0.1 limita en memoria, suficiente para desarrollo y una instancia. Producción horizontal requiere un store común (Redis/Upstash) y límites específicos por ruta/identidad. `RateLimitBucket` prepara persistencia, pero no debe convertirse en un cuello de botella sin expiración programada.

## Pagos y PCI

La aplicación no recibe ni almacena PAN, CVV o datos completos de tarjeta. El checkout es alojado por la pasarela. Las redirecciones son informativas; el fulfillment depende del webhook verificado.

## Reporte de vulnerabilidades

No abras un issue público con secretos o datos reales. Reporta de forma privada al responsable del comercio incluyendo pasos de reproducción, impacto y ruta afectada.

