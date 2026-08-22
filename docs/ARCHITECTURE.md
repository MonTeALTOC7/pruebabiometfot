# ARCHITECTURE

PWA estática:
- `index.html`: shell y navegación.
- `css/casur.css`: UI mobile-first.
- `js/app.js`: estado, rutas, interacción y flujo de biometría.
- `js/tch-engine.js`: fórmulas agronómicas.
- `js/master.js`: normalización, búsqueda e importación del maestro.
- `js/storage.js`: IndexedDB.
- `js/excel.js`: XLSX real.
- `js/result-image.js`: PNG ejecutivo.
- `js/visit-evidence.js`: optimización de fotos, rotulado PNG, Excel de visitas y ZIP por hacienda.
- `data/suertes.json`: Maestro General v2.4.
- `data/productores.json`: compatibilidad Zona 5.
- `sw.js`: caché PWA.
- `tests/`: validación automática.

No existe backend obligatorio.

IndexedDB v3 agrega `visits`. Cada fotografía se conserva como JPEG optimizado; el PNG rotulado se genera al exportar para no duplicar almacenamiento.
