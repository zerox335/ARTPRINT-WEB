# Roadmap

## V0.1 — vertical funcional

- Home, catálogo, categorías, PDP y variantes.
- Editor Konva: texto, imagen, fuente, color, mover, escalar, rotar, duplicar, borrar, centrar y capas.
- Guardado automático, deshacer/rehacer, preview persistente y edición real desde el carrito.
- Vista frontal curva para mugs, vasos y termos sin guía visible sobre el diseño.
- Áreas imprimibles por vista y especificación separada del preview.
- Price Engine y descuentos por volumen verificados en servidor.
- Carrito, checkout, pedido idempotente y snapshots.
- Sesiones cliente/admin, cuenta y dashboard.
- Publicación de DesignProof desde administración y decisión del cliente con historial.
- Storage local/S3, validación de originales.
- Sandbox explícito y adapters Wompi/Mercado Pago.
- Webhooks firmados/idempotentes y máquina de estados auditada.
- Seed, pruebas y documentación.

## V0.2 — operación de diseño

- CRUD administrativo completo de variantes, mockups y áreas con editor visual.
- Reglas de precio configurables con simulador y vigencias.
- Bandejas de diseñador/producción y asignación de responsables.
- Notificaciones externas por correo/WhatsApp para nuevas pruebas.
- Snapping, safe zones y control de DPI en editor.

## V0.3 — fulfillment y crecimiento

- Integración de transportadora, tarifas y tracking.
- Inventario con reservas y movimientos.
- Devoluciones, reembolsos y conciliación de pagos.
- Outbox + cola + warehouse para analítica confiable.
- Antivirus, thumbnails y render de producción asíncrono.
- Roles refinados, 2FA administrativo y SSO opcional.

## IA futura

Una futura `DesignProposalProvider` producirá los mismos elementos versionados que el editor. No habrá un flujo paralelo ni una simulación falsa: eliminar fondo, generación o mejora de resolución se conectarán como jobs reales y mantendrán provenance del asset.
