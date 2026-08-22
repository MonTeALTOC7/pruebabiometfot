import { createId, dateISO, finiteNumber } from "./tch-engine.js";

const aliases = {
  farmCode: ["cod hacienda", "codigo hacienda", "codigo finca", "cod finca", "cod hac", "hacienda codigo"],
  producer: ["nombre hacienda", "productor", "hacienda", "nombre productor", "finca"],
  lot: ["ste", "suerte", "lote"],
  id: ["hac sue", "hac-sue", "codigo suerte", "cod suerte", "codigo lote"],
  area: ["area", "area neta", "ha", "hectareas"],
  variety: ["variedad"],
  referenceAge: ["edad m", "edad", "edad meses"],
  rowSpacingM: ["surco", "distancia surco", "distancia entre surcos"],
  cutNumber: ["de corte", "numero de corte", "corte", "num corte"],
  historicalTch: ["tch historico promedio", "promedio historico", "tch promedio historico", "tch historico", "tch"],
  latestSeasonTch: ["tch 25 26", "tch zafra 25 26", "tch ultima zafra", "ultimo tch 25 26"],
  texture: ["nombre textura", "textura"],
  distanceKm: ["distancia km", "km", "distancia"],
  initialTch: ["tch inic", "tch inicial"],
  currentMasterTch: ["tch act", "tch actual"],
  plantingDate: ["f siembra", "fecha siembra", "siembra"],
  lastCutDate: ["f ult cte", "fecha ultimo corte", "ultimo corte", "f corte"],
  destination: ["nombre destino del cultivo", "destino"],
  cropType: ["nombre tipo de cultivo", "tipo de cana", "tipo cultivo"],
  tenureCode: ["tn", "tenencia"],
  irrigation: ["tipo riego", "tiporiego", "riego", "secano riego"],
  nr: ["nr"],
  erp: ["erp"],
  zone: ["zona"],
};

const TENURE_LABELS = { CA: "Arriendo", CV: "Compra Venta", PR: "Propio" };

export function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function headerMap(row) {
  const normalized = Object.keys(row).map((header) => [header, normalizeText(header)]);
  const result = {};
  for (const [field, choices] of Object.entries(aliases)) {
    const match = normalized.find(([, header]) => choices.includes(header));
    if (match) result[field] = match[0];
  }
  return result;
}

function text(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function normalizedLotNumber(value) {
  const raw = text(value);
  return /^\d$/.test(raw) ? raw.padStart(2, "0") : raw;
}

function tenureLabel(code) {
  return TENURE_LABELS[text(code).toUpperCase()] || "";
}

export function isOperationalLot(lot) {
  const zone = normalizeText(lot?.zone);
  const producer = normalizeText(lot?.producer);
  if (!zone && !producer) return false;
  return zone !== "0 sin definir" && !producer.includes("sucuya");
}

function normalizeLot(row, map, index) {
  const farmCode = text(row[map.farmCode]);
  const producer = text(row[map.producer]);
  const lot = normalizedLotNumber(row[map.lot]);
  const suppliedId = text(row[map.id]);
  const id = farmCode && lot ? `${farmCode}${lot}` : suppliedId;
  const tenureCode = text(row[map.tenureCode]).toUpperCase();
  return {
    id,
    legacyId: suppliedId && suppliedId !== id ? suppliedId : "",
    farmCode,
    producer,
    lot,
    area: finiteNumber(row[map.area]),
    variety: text(row[map.variety]),
    referenceAge: finiteNumber(row[map.referenceAge]) || null,
    rowSpacingM: finiteNumber(row[map.rowSpacingM]) || null,
    cutNumber: text(row[map.cutNumber]),
    historicalTch: finiteNumber(row[map.historicalTch]) || null,
    latestSeasonTch: finiteNumber(row[map.latestSeasonTch]) || null,
    texture: text(row[map.texture]),
    distanceKm: finiteNumber(row[map.distanceKm]) || null,
    initialTch: finiteNumber(row[map.initialTch]) || null,
    currentMasterTch: finiteNumber(row[map.currentMasterTch]) || null,
    plantingDate: dateISO(row[map.plantingDate]),
    lastCutDate: dateISO(row[map.lastCutDate]),
    destination: text(row[map.destination]),
    cropType: text(row[map.cropType]),
    tenureCode,
    tenureLabel: tenureLabel(tenureCode),
    irrigation: text(row[map.irrigation]),
    nr: text(row[map.nr]),
    erp: text(row[map.erp]),
    zone: text(row[map.zone]),
    sourceRow: index + 2,
    importedAt: new Date().toISOString(),
  };
}

export function normalizeEmbeddedMaster(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row, index) => {
    const farmCode = text(row.codigoHacienda ?? row.farmCode);
    const lot = normalizedLotNumber(row.suerte ?? row.lot);
    const suppliedId = text(row.hacSue ?? row.legacyId ?? row.id);
    const id = farmCode && lot ? `${farmCode}${lot}` : suppliedId;
    const tenureCode = text(row.tenenciaCode ?? row.tn ?? row.tenureCode).toUpperCase();
    return {
      id,
      legacyId: suppliedId && suppliedId !== id ? suppliedId : "",
      farmCode,
      producer: text(row.productor ?? row.producer),
      lot,
      area: finiteNumber(row.area),
      variety: text(row.variedad ?? row.variety),
      referenceAge: finiteNumber(row.edadReferencia ?? row.referenceAge) || null,
      rowSpacingM: finiteNumber(row.surco ?? row.rowSpacingM) || null,
      cutNumber: text(row.corte ?? row.cutNumber),
      historicalTch: finiteNumber(Object.hasOwn(row, "tchHistoricoPromedio") ? row.tchHistoricoPromedio : row.historicalTch) || null,
      latestSeasonTch: finiteNumber(
        Object.hasOwn(row, "tchZafra2526") ? row.tchZafra2526 :
        Object.hasOwn(row, "tchHistorico") ? row.tchHistorico : row.latestSeasonTch
      ) || null,
      texture: text(row.textura ?? row.texture),
      distanceKm: finiteNumber(row.km ?? row.distanceKm) || null,
      initialTch: finiteNumber(row.tchInicial ?? row.initialTch) || null,
      currentMasterTch: finiteNumber(row.tchActualMaestro ?? row.currentMasterTch) || null,
      plantingDate: dateISO(row.fechaSiembra ?? row.plantingDate),
      lastCutDate: dateISO(row.fechaUltimoCorte ?? row.lastCutDate),
      destination: text(row.destino ?? row.destination),
      cropType: text(row.cultivo ?? row.cropType),
      tenureCode,
      tenureLabel: text(row.tenenciaLabel ?? row.tenureLabel) || tenureLabel(tenureCode),
      irrigation: text(row.tipoRiego ?? row.irrigation),
      nr: text(row.nr),
      erp: text(row.erp),
      zone: text(row.zona ?? row.zone),
      sourceRow: index + 2,
      importedAt: text(row.importedAt) || "2026-07-27T00:00:00.000Z",
    };
  }).filter((lot) => lot.id && lot.farmCode && lot.producer && lot.lot && lot.area > 0 && isOperationalLot(lot));
}

export function masterToEmbeddedRows(lots) {
  return (Array.isArray(lots) ? lots : [])
    .filter(isOperationalLot)
    .slice()
    .sort((a, b) => {
      const priority = (lot) => normalizeText(lot.zone) === "5 productores" ? 0 : 1;
      return priority(a) - priority(b) ||
        String(a.producer).localeCompare(String(b.producer), "es") ||
        String(a.lot).localeCompare(String(b.lot), "es", { numeric: true });
    })
    .map((lot) => ({
      codigoHacienda: text(lot.farmCode),
      productor: text(lot.producer),
      suerte: normalizedLotNumber(lot.lot),
      hacSue: text(lot.legacyId || lot.id),
      area: finiteNumber(lot.area),
      variedad: text(lot.variety),
      edadReferencia: finiteNumber(lot.referenceAge) || null,
      surco: finiteNumber(lot.rowSpacingM) || null,
      corte: text(lot.cutNumber),
      tchHistorico: finiteNumber(lot.latestSeasonTch) || null,
      tchHistoricoPromedio: finiteNumber(lot.historicalTch) || null,
      tchZafra2526: finiteNumber(lot.latestSeasonTch) || null,
      textura: text(lot.texture),
      km: finiteNumber(lot.distanceKm) || null,
      tchInicial: finiteNumber(lot.initialTch) || null,
      tchActualMaestro: finiteNumber(lot.currentMasterTch) || null,
      fechaSiembra: dateISO(lot.plantingDate),
      fechaUltimoCorte: dateISO(lot.lastCutDate),
      destino: text(lot.destination),
      cultivo: text(lot.cropType),
      tenenciaCode: text(lot.tenureCode),
      tenenciaLabel: text(lot.tenureLabel) || tenureLabel(lot.tenureCode),
      tipoRiego: text(lot.irrigation),
      nr: text(lot.nr),
      erp: text(lot.erp),
      zona: text(lot.zone),
    }));
}

export async function masterFingerprint(lots) {
  const canonical = JSON.stringify(masterToEmbeddedRows(lots));
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  let hash = 2166136261;
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export async function parseMasterWorkbook(file, currentMaster = []) {
  if (!globalThis.XLSX) throw new Error("No se cargó el componente Excel.");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const reportSheet = workbook.SheetNames.find((name) => normalizeText(name) === "reporte");
  const producerSheet = workbook.SheetNames.find((name) => normalizeText(name) === "productores");
  const sheetName = reportSheet || producerSheet || workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "", raw: true });
  if (!rows.length) throw new Error(`La hoja ${sheetName} está vacía.`);
  const map = headerMap(rows[0]);
  const required = ["farmCode", "producer", "lot", "area"];
  const missingHeaders = required.filter((field) => !map[field]);
  if (missingHeaders.length) throw new Error(`Faltan columnas obligatorias: ${missingHeaders.join(", ")}.`);
  const normalized = rows.map((row, index) => normalizeLot(row, map, index)).filter((lot) => lot.id || lot.producer || lot.lot);
  const excluded = normalized.filter((lot) => !isOperationalLot(lot));
  const lots = normalized.filter(isOperationalLot);
  const errors = [];
  const counts = new Map();
  lots.forEach((lot) => {
    if (!lot.farmCode || !lot.producer || !lot.lot || !lot.id) errors.push({ row: lot.sourceRow, issue: "Registro sin código, hacienda o suerte" });
    if (lot.area <= 0) errors.push({ row: lot.sourceRow, issue: "Área vacía o no válida" });
    counts.set(lot.id, (counts.get(lot.id) || 0) + 1);
  });
  const duplicates = [...counts].filter(([, count]) => count > 1).map(([id, count]) => ({ id, count }));
  const validLots = lots.filter((lot) => lot.id && lot.farmCode && lot.producer && lot.lot && lot.area > 0);
  const uniqueLots = validLots.filter((lot, index, all) => all.findIndex((item) => item.id === lot.id) === index);
  const current = new Map(currentMaster.map((lot) => [lot.id, lot]));
  uniqueLots.forEach((lot) => {
    const previous = current.get(lot.id);
    if (!lot.historicalTch && previous?.historicalTch) lot.historicalTch = previous.historicalTch;
    if (!lot.latestSeasonTch && previous?.latestSeasonTch) lot.latestSeasonTch = previous.latestSeasonTch;
    if (!lot.initialTch && previous?.initialTch) lot.initialTch = previous.initialTch;
    if (!lot.currentMasterTch && previous?.currentMasterTch) lot.currentMasterTch = previous.currentMasterTch;
  });
  let added = 0, modified = 0, unchanged = 0;
  uniqueLots.forEach((lot) => {
    const previous = current.get(lot.id);
    if (!previous) added += 1;
    else {
      const keys = Object.keys(lot).filter((key) => !["sourceRow", "importedAt"].includes(key));
      if (keys.some((key) => String(previous[key] ?? "") !== String(lot[key] ?? ""))) modified += 1;
      else unchanged += 1;
    }
  });
  return {
    sheetName,
    lots: uniqueLots,
    report: {
      analyzed: rows.length,
      valid: uniqueLots.length,
      added,
      modified,
      unchanged,
      duplicates,
      errors,
      excluded: excluded.length,
      excludedReason: reportSheet ? "Zona 0 / Sucuya" : "",
      producers: uniqueLots.filter((lot) => normalizeText(lot.zone) === "5 productores").length,
    },
  };
}

export function masterSuggestions(master, query, limit = 40) {
  const normalized = normalizeText(query);
  if (!normalized) return [];
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const ranked = master.filter(isOperationalLot).map((lot) => {
    const haystack = normalizeText([
      lot.farmCode, lot.producer, lot.id, lot.legacyId, lot.lot, lot.variety,
      lot.zone, lot.tenureCode, lot.tenureLabel,
    ].join(" "));
    if (!tokens.every((token) => haystack.includes(token))) return null;
    const code = normalizeText(lot.farmCode);
    const id = normalizeText(lot.id);
    const legacyId = normalizeText(lot.legacyId);
    const name = normalizeText(lot.producer);
    const baseRank = id === normalized || legacyId === normalized ? 0 :
      code === normalized ? 1 :
      id.startsWith(normalized) || legacyId.startsWith(normalized) ? 2 :
      code.startsWith(normalized) ? 3 :
      name.startsWith(normalized) ? 4 : 5;
    const producerPriority = normalizeText(lot.zone) === "5 productores" ? 0 : 1;
    return { lot, baseRank, producerPriority };
  }).filter(Boolean);
  ranked.sort((a, b) =>
    a.baseRank - b.baseRank ||
    a.producerPriority - b.producerPriority ||
    a.lot.producer.localeCompare(b.lot.producer, "es") ||
    a.lot.lot.localeCompare(b.lot.lot, "es", { numeric: true })
  );
  return ranked.slice(0, limit).map(({ lot }) => lot);
}

export function auditChange(lot, field, oldValue, newValue, user = "Técnico") {
  return {
    id: createId("audit"), lotId: lot.id, farmCode: lot.farmCode, producer: lot.producer,
    field, oldValue, newValue, user, changedAt: new Date().toISOString(),
  };
}
