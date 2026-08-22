const encoder = new TextEncoder();

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function cleanName(value, fallback = "sin_nombre") {
  const clean = String(value || fallback).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");
  return clean.slice(0, 80) || fallback;
}

function dataUrlToBlob(dataUrl) {
  const [header, payload] = String(dataUrl).split(",");
  const type = header.match(/data:([^;]+)/)?.[1] || "application/octet-stream";
  const binary = atob(payload || "");
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type });
}

function canvasBlob(canvas, type = "image/png", quality) {
  return new Promise((resolve, reject) => canvas.toBlob(
    (blob) => blob ? resolve(blob) : reject(new Error("No se pudo procesar la fotografía.")),
    type,
    quality,
  ));
}

async function loadImage(source) {
  if (source instanceof Blob && globalThis.createImageBitmap) {
    try {
      return await createImageBitmap(source, { imageOrientation: "from-image" });
    } catch { /* fallback below */ }
  }
  const url = source instanceof Blob ? URL.createObjectURL(source) : source;
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("No se pudo abrir la fotografía."));
      image.src = url;
    });
  } finally {
    if (source instanceof Blob) setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

export async function prepareVisitPhoto(file, maxEdge = 1600) {
  if (!file?.type?.startsWith("image/")) throw new Error("Seleccioná un archivo de imagen válido.");
  const image = await loadImage(file);
  const sourceWidth = image.width || image.naturalWidth;
  const sourceHeight = image.height || image.naturalHeight;
  if (!sourceWidth || !sourceHeight) throw new Error("La fotografía no tiene dimensiones válidas.");
  const scale = Math.min(1, maxEdge / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false });
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  image.close?.();
  const blob = await canvasBlob(canvas, "image/jpeg", 0.84);
  return {
    id: `photo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    dataUrl: await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error("No se pudo preparar la fotografía."));
      reader.readAsDataURL(blob);
    }),
    width,
    height,
    sizeBytes: blob.size,
    originalName: file.name || "camara.jpg",
    capturedAt: new Date().toISOString(),
    mimeType: "image/jpeg",
  };
}

function fitText(context, text, maxWidth, initialSize, minSize = 16, weight = 800) {
  let size = initialSize;
  while (size > minSize) {
    context.font = `${weight} ${size}px Arial, sans-serif`;
    if (context.measureText(text).width <= maxWidth) break;
    size -= 1;
  }
  return size;
}

function drawFitted(context, text, x, y, maxWidth, size, color = "#ffffff", weight = 800) {
  const fitted = fitText(context, text, maxWidth, size, Math.max(13, size * 0.58), weight);
  context.font = `${weight} ${fitted}px Arial, sans-serif`;
  context.fillStyle = color;
  context.fillText(text, x, y);
}

function formatCoordinates(visit) {
  if (!Number.isFinite(Number(visit.latitude)) || !Number.isFinite(Number(visit.longitude))) return "GPS: sin coordenadas";
  return `GPS: ${Number(visit.latitude).toFixed(6)}, ${Number(visit.longitude).toFixed(6)} · ±${Math.round(finite(visit.gpsAccuracyM))} m`;
}

async function loadLogo(logoUrl) {
  try { return await loadImage(logoUrl); } catch { return null; }
}

export async function createLabeledVisitPhotoBlob({ visit, photo, photoNumber = 1, logoUrl = "./assets/logo_casur.png" }) {
  const image = await loadImage(photo.dataUrl);
  const width = image.width || image.naturalWidth;
  const height = image.height || image.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false });
  context.drawImage(image, 0, 0, width, height);
  image.close?.();

  const headerHeight = Math.max(100, Math.round(height * 0.14));
  const footerHeight = Math.max(220, Math.round(height * 0.31));
  const padding = Math.max(18, Math.round(width * 0.025));
  const gradientTop = context.createLinearGradient(0, 0, 0, headerHeight);
  gradientTop.addColorStop(0, "rgba(5,49,29,.97)");
  gradientTop.addColorStop(1, "rgba(5,49,29,.80)");
  context.fillStyle = gradientTop;
  context.fillRect(0, 0, width, headerHeight);
  const gradientBottom = context.createLinearGradient(0, height - footerHeight, 0, height);
  gradientBottom.addColorStop(0, "rgba(2,28,17,.72)");
  gradientBottom.addColorStop(0.22, "rgba(2,28,17,.92)");
  gradientBottom.addColorStop(1, "rgba(2,28,17,.98)");
  context.fillStyle = gradientBottom;
  context.fillRect(0, height - footerHeight, width, footerHeight);

  const logo = await loadLogo(logoUrl);
  const logoWidth = Math.min(width * 0.2, headerHeight * 1.65);
  const logoHeight = headerHeight * 0.62;
  if (logo) {
    context.fillStyle = "rgba(255,255,255,.96)";
    context.fillRect(padding, headerHeight * 0.18, logoWidth, logoHeight);
    const ratio = Math.min((logoWidth - 14) / (logo.width || logo.naturalWidth), (logoHeight - 10) / (logo.height || logo.naturalHeight));
    const drawnWidth = (logo.width || logo.naturalWidth) * ratio;
    const drawnHeight = (logo.height || logo.naturalHeight) * ratio;
    context.drawImage(logo, padding + (logoWidth - drawnWidth) / 2, headerHeight * 0.18 + (logoHeight - drawnHeight) / 2, drawnWidth, drawnHeight);
    logo.close?.();
  }
  const titleX = padding + (logo ? logoWidth + padding : 0);
  drawFitted(context, "VISITA DE CAMPO · EVIDENCIA TÉCNICA", titleX, headerHeight * 0.47, width - titleX - padding, Math.max(22, width * 0.029), "#ffffff", 900);
  drawFitted(context, `Foto ${String(photoNumber).padStart(2, "0")} · ${visit.date || ""} ${visit.time || ""}`, titleX, headerHeight * 0.76, width - titleX - padding, Math.max(16, width * 0.021), "#f5d861", 800);

  const baseY = height - footerHeight + padding * 1.4;
  const lineGap = Math.max(30, footerHeight * 0.145);
  const mainSize = Math.max(23, width * 0.029);
  const smallSize = Math.max(17, width * 0.021);
  drawFitted(context, `${visit.producer || "Hacienda"} · Suerte ${visit.lot || "—"}`, padding, baseY, width - padding * 2, mainSize, "#ffffff", 900);
  drawFitted(context, `Código: ${visit.lotId || "—"} · Hacienda ${visit.farmCode || "—"} · ${finite(visit.area).toFixed(2)} ha · ${visit.variety || "Sin variedad"}`, padding, baseY + lineGap, width - padding * 2, smallSize, "#d9efe3", 700);
  drawFitted(context, `${visit.purpose || "Inspección general"} · Condición: ${visit.overallCondition || "No evaluada"} · Agua: ${visit.waterStatus || "No evaluada"}`, padding, baseY + lineGap * 2, width - padding * 2, smallSize, "#ffffff", 750);
  const tchText = finite(visit.estimatedTch) > 0 ? `${finite(visit.estimatedTch).toFixed(1)} TCH · ${visit.tchSourceLabel || visit.tchSource || "estimación"}` : "TCH: no estimado en esta visita";
  drawFitted(context, `${tchText} · Malezas: ${visit.weedLevel || "N/E"} · Acame: ${finite(visit.lodgingPct).toFixed(0)}%`, padding, baseY + lineGap * 3, width - padding * 2, smallSize, "#f5d861", 800);
  drawFitted(context, `${formatCoordinates(visit)} · Técnico: ${visit.technician || "Sin registrar"}`, padding, baseY + lineGap * 4, width - padding * 2, smallSize, "#ffffff", 700);
  if (visit.notes) drawFitted(context, `Observación: ${String(visit.notes).replace(/\s+/g, " ").slice(0, 150)}`, padding, baseY + lineGap * 5, width - padding * 2, smallSize * 0.9, "#d9efe3", 650);

  context.strokeStyle = "#f4c542";
  context.lineWidth = Math.max(5, width * 0.005);
  context.strokeRect(0, 0, width, height);
  return canvasBlob(canvas, "image/png");
}

function addWorkbookTitle(worksheet, columns) {
  XLSX.utils.sheet_add_aoa(worksheet, [["CASUR · HISTORIAL DE VISITAS DE CAMPO"], ["Evidencias fotográficas, ubicación y condición agronómica"], []], { origin: "A1" });
  worksheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: columns - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: columns - 1 } },
  ];
  worksheet.A1.s = { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 16 }, fill: { fgColor: { rgb: "073D24" } } };
  worksheet.A2.s = { font: { italic: true, color: { rgb: "365A46" } }, fill: { fgColor: { rgb: "EAF6EE" } } };
}

export function createVisitsWorkbookBlob(visits = []) {
  if (!globalThis.XLSX) throw new Error("No se cargó el componente Excel.");
  const headers = [
    "ID visita", "Fecha", "Hora", "Técnico", "Zona", "Código hacienda", "Hacienda", "Suerte", "Código suerte", "Área (ha)", "Variedad",
    "Motivo", "Condición general", "Estado hídrico", "Nivel malezas", "Nivel plagas", "Acame (%)", "Fuente TCH", "TCH visita", "Fotos",
    "Latitud", "Longitud", "Precisión GPS (m)", "Fecha/hora GPS", "Observaciones", "Creado",
  ];
  const rows = visits.slice().sort((a, b) => `${b.date}${b.time || ""}`.localeCompare(`${a.date}${a.time || ""}`)).map((visit) => [
    visit.id, visit.date, visit.time, visit.technician, visit.zone, visit.farmCode, visit.producer, visit.lot, visit.lotId, visit.area, visit.variety,
    visit.purpose, visit.overallCondition, visit.waterStatus, visit.weedLevel, visit.pestLevel, visit.lodgingPct,
    visit.tchSourceLabel || visit.tchSource, visit.estimatedTch || null, visit.photos?.length || 0,
    visit.latitude, visit.longitude, visit.gpsAccuracyM, visit.capturedAt, visit.notes, visit.createdAt,
  ]);
  const worksheet = XLSX.utils.aoa_to_sheet([[], [], [], headers, ...rows]);
  addWorkbookTitle(worksheet, headers.length);
  worksheet["!cols"] = headers.map((header) => ({ wch: Math.min(38, Math.max(12, header.length + 2)) }));
  worksheet["!autofilter"] = { ref: `A4:${XLSX.utils.encode_col(headers.length - 1)}${rows.length + 4}` };
  headers.forEach((_, column) => {
    const cell = worksheet[XLSX.utils.encode_cell({ r: 3, c: column })];
    if (cell) cell.s = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "0B7F3A" } }, alignment: { wrapText: true, vertical: "center" } };
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Visitas de campo");

  const photoRows = visits.flatMap((visit) => (visit.photos || []).map((photo, index) => [
    visit.id, visit.date, visit.farmCode, visit.producer, visit.lot, visit.lotId, index + 1, photo.id, photo.originalName,
    photo.width, photo.height, photo.sizeBytes, photo.capturedAt,
  ]));
  const photoHeaders = ["ID visita", "Fecha", "Código hacienda", "Hacienda", "Suerte", "Código suerte", "N° foto", "ID foto", "Nombre original", "Ancho px", "Alto px", "Tamaño bytes", "Capturada"];
  const photoSheet = XLSX.utils.aoa_to_sheet([photoHeaders, ...photoRows]);
  photoSheet["!cols"] = photoHeaders.map((header) => ({ wch: Math.min(34, Math.max(12, header.length + 2)) }));
  photoSheet["!autofilter"] = { ref: `A1:${XLSX.utils.encode_col(photoHeaders.length - 1)}${photoRows.length + 1}` };
  photoHeaders.forEach((_, column) => {
    const cell = photoSheet[XLSX.utils.encode_cell({ r: 0, c: column })];
    if (cell) cell.s = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "005BAA" } } };
  });
  XLSX.utils.book_append_sheet(workbook, photoSheet, "Índice fotografías");
  const bytes = XLSX.write(workbook, { bookType: "xlsx", type: "array", compression: true });
  return new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

let crcTable;
function crc32(bytes) {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let index = 0; index < 256; index += 1) {
      let value = index;
      for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
      crcTable[index] = value >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(dateValue) {
  const date = new Date(dateValue || Date.now());
  const year = Math.max(1980, date.getFullYear());
  return {
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
  };
}

function uint16(view, offset, value) { view.setUint16(offset, value, true); }
function uint32(view, offset, value) { view.setUint32(offset, value >>> 0, true); }

async function createZip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const bytes = new Uint8Array(await entry.blob.arrayBuffer());
    const checksum = crc32(bytes);
    const stamp = dosDateTime(entry.date);
    const local = new Uint8Array(30 + nameBytes.length + bytes.length);
    const localView = new DataView(local.buffer);
    uint32(localView, 0, 0x04034b50);
    uint16(localView, 4, 20);
    uint16(localView, 6, 0x0800);
    uint16(localView, 8, 0);
    uint16(localView, 10, stamp.time);
    uint16(localView, 12, stamp.date);
    uint32(localView, 14, checksum);
    uint32(localView, 18, bytes.length);
    uint32(localView, 22, bytes.length);
    uint16(localView, 26, nameBytes.length);
    uint16(localView, 28, 0);
    local.set(nameBytes, 30);
    local.set(bytes, 30 + nameBytes.length);
    locals.push(local);

    const central = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(central.buffer);
    uint32(centralView, 0, 0x02014b50);
    uint16(centralView, 4, 20);
    uint16(centralView, 6, 20);
    uint16(centralView, 8, 0x0800);
    uint16(centralView, 10, 0);
    uint16(centralView, 12, stamp.time);
    uint16(centralView, 14, stamp.date);
    uint32(centralView, 16, checksum);
    uint32(centralView, 20, bytes.length);
    uint32(centralView, 24, bytes.length);
    uint16(centralView, 28, nameBytes.length);
    uint16(centralView, 30, 0);
    uint16(centralView, 32, 0);
    uint16(centralView, 34, 0);
    uint16(centralView, 36, 0);
    uint32(centralView, 38, 0);
    uint32(centralView, 42, offset);
    central.set(nameBytes, 46);
    centrals.push(central);
    offset += local.length;
  }
  const centralSize = centrals.reduce((sum, entry) => sum + entry.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  uint32(endView, 0, 0x06054b50);
  uint16(endView, 4, 0);
  uint16(endView, 6, 0);
  uint16(endView, 8, entries.length);
  uint16(endView, 10, entries.length);
  uint32(endView, 12, centralSize);
  uint32(endView, 16, offset);
  uint16(endView, 20, 0);
  return new Blob([...locals, ...centrals, end], { type: "application/zip" });
}

function visitFolder(visit) {
  const producer = `${cleanName(visit.farmCode)}_${cleanName(visit.producer)}`;
  const visitName = `${cleanName(visit.date)}_Suerte_${cleanName(visit.lot)}_${cleanName(visit.id).slice(-12)}`;
  return `${producer}/${visitName}`;
}

export async function createVisitsPackageBlob(visits, { logoUrl = "./assets/logo_casur.png" } = {}) {
  if (!visits?.length) throw new Error("No hay visitas para exportar.");
  const entries = [];
  entries.push({ name: "Historial_Visitas_Campo_CASUR.xlsx", blob: createVisitsWorkbookBlob(visits), date: new Date() });
  for (const visit of visits) {
    const folder = visitFolder(visit);
    for (let index = 0; index < (visit.photos || []).length; index += 1) {
      const photo = visit.photos[index];
      const number = String(index + 1).padStart(2, "0");
      entries.push({
        name: `${folder}/Evidencias_etiquetadas/${cleanName(visit.farmCode)}_${cleanName(visit.producer)}_S${cleanName(visit.lot)}_${cleanName(visit.date)}_Foto_${number}.png`,
        blob: await createLabeledVisitPhotoBlob({ visit, photo, photoNumber: index + 1, logoUrl }),
        date: photo.capturedAt,
      });
      entries.push({
        name: `${folder}/Originales_para_IA/${cleanName(visit.farmCode)}_${cleanName(visit.producer)}_S${cleanName(visit.lot)}_${cleanName(visit.date)}_Foto_${number}_ORIGINAL.jpg`,
        blob: dataUrlToBlob(photo.dataUrl),
        date: photo.capturedAt,
      });
    }
  }
  return createZip(entries);
}

export function visitPackageFilename(visits) {
  const date = new Date().toISOString().slice(0, 10);
  if (visits.length === 1) {
    const visit = visits[0];
    return `Visita_${cleanName(visit.farmCode)}_${cleanName(visit.producer)}_S${cleanName(visit.lot)}_${cleanName(visit.date)}.zip`;
  }
  return `Visitas_Campo_CASUR_${date}.zip`;
}

export function visitsExcelFilename() {
  return `Historial_Visitas_Campo_CASUR_${new Date().toISOString().slice(0, 10)}.xlsx`;
}
