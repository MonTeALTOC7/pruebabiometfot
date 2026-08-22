# PROJECT CONTEXT — Estimador TCH CASUR

## Estado actual

Versión de trabajo: **v2.5.0**.

Versión: **2.5.0**
Destino normal: repositorio existente `MonTeALTOC7/Estimado_TCH_APP_CT`.
Publicación: GitHub Pages / Android PWA.

## Regla máxima

Conservar lo que funciona y modificar únicamente lo necesario. La instrucción más reciente del usuario prevalece.

## Maestro General

Fuente oficial de actualización: hoja `REPORTE`.

Universo operativo validado:
- 1-Sur: 240 suertes
- 2-Centro: 256
- 3-Norte: 296
- 5-Productores: 262
- Total: 1,054 suertes
- Área: 10,030.06 ha

Zona 0 / Sucuya se excluye completamente.

Tenencia:
- CA = Arriendo
- CV = Compra Venta
- PR = Propio

Zona 5 Productores sigue siendo prioridad de presentación, pero no existe filtro obligatorio por zona. El buscador debe encontrar cualquier suerte operativa.

## Biometría

Flujo:
1. Selección de suerte.
2. Medición por puntos.
3. Cálculo/proyección.
4. Guardado/exportación.

Inicia con P01. Se agregan puntos libremente. No existe selector 3/5/10.

Fórmula:
`TCHe = D²(mm) × H(m) × POB(tallos/m) × 0.007854 / DistSurco(m)`.

El TCH proyectado por biometría siempre es el resultado principal.

Pesaje por tallo:
- opcional;
- desactivado por defecto y activable manualmente cuando el técnico decida pesar;
- captura número de tallos + peso total;
- calcula peso promedio y TCHpeso;
- funciona únicamente como contraste;
- no se promedia automáticamente con TCHe.

## Compatibilidad

No borrar IndexedDB. Stores actuales:
`master`, `biometries`, `weighings`, `harvests`, `visits`, `audit`, `settings`.

## Visitas de campo v2.5

- Módulo principal independiente de la biometría.
- Requiere suerte, técnico, 1–3 fotografías y GPS para guardar evidencia georreferenciada.
- El TCH es opcional y su fuente se registra explícitamente.
- La exportación ZIP crea carpetas por hacienda/productor con PNG etiquetados, originales sin rótulo para IA e historial XLSX.
- Las fotografías se optimizan antes de IndexedDB para controlar uso de almacenamiento.

Los campos legacy `lengthCm` y `diameterCm` siguen siendo legibles. Los pesajes antiguos del store `weighings` permanecen disponibles.

## Entrega

Después de cambios, entregar ZIP completo. No publicar a GitHub sin aprobación explícita.

## Ajustes v2.4.1
- Guía de biometría compacta y visual, sin fórmula fija ocupando Inicio.
- Jerarquía de color CASUR/navy en ficha de suerte.
- Surcos rápidos: 1.50, 1.65, 1.75, 1.80, 2.20; otros mediante edición.
- Tramos rápidos: 3, 5, 10 m; otros mediante edición.
- Pesaje opcional libre, siempre inicia en No y solo aparece al seleccionar Sí.
- `Edad de referencia para proyección` sustituye el concepto de `edad objetivo de cosecha`.
