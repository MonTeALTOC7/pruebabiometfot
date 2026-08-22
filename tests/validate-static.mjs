import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const required = [
  "index.html", "manifest.webmanifest", "sw.js", "version.json", "css/casur.css",
  "js/app.js", "js/tch-engine.js", "js/storage.js", "js/master.js", "js/excel.js", "js/visit-evidence.js",
  "js/result-image.js", "data/suertes.json", "data/productores.json", "vendor/xlsx.bundle.js",
  "assets/logo_casur.png", "assets/cana-azucar-real.png",
  "assets/icons/tch-icon-192.png", "assets/icons/tch-icon-512.png",
];
required.forEach((file) => assert.ok(fs.existsSync(path.join(root, file)), `Falta ${file}`));

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
assert.match(html, /manifest\.webmanifest/);
assert.match(html, /type="module" src="\.\/js\/app\.js"/);
assert.doesNotMatch(html, /data-route="weighing"/, "Pesaje separado no debe ser navegación principal");
assert.match(html, /data-route="visits"/, "Visitas debe ser navegación principal");
assert.match(html, /visitCameraFile/);

const source = fs.readFileSync(path.join(root, "js/app.js"), "utf8");
assert.doesNotMatch(source, /chatgpt-auth|openai\/hosting|api\.openai/i);
assert.match(source, /MASTER_PASSWORD_HASH/);
assert.match(source, /syncPublishedMaster/);
assert.match(source, /data\/suertes\.json/);
assert.match(source, /finishSamples/);
assert.match(source, /activeSampleId/);
assert.match(source, /weighingEnabled/);
assert.match(source, /ROW_SPACING_PRESETS = \[1\.5, 1\.65, 1\.75, 1\.8, 2\.2\]/);
assert.doesNotMatch(source, /ROW_SPACING_PRESETS = \[[^\]]*1\.4/);
assert.match(source, /SAMPLE_LENGTH_PRESETS = \[3, 5, 10\]/);
assert.match(source, /Edad de referencia para proyección/);
assert.match(source, /data-field-guide/);
assert.match(source, /data-set-sample-weight="no"/);
assert.match(source, /data-set-sample-weight="yes"/);
assert.doesNotMatch(source, /Caña ≥ 10 meses/);
assert.match(source, /validateCalculation/);
assert.match(source, /TCH PROYECTADO/);
assert.match(source, /Último TCH · zafra 25\/26/);
assert.doesNotMatch(source, /id="sampleCount"/);
assert.doesNotMatch(source, /id="installApp"/);
assert.match(source, /renderVisits/);
assert.match(source, /saveVisit/);
assert.match(source, /createVisitsPackageBlob/);
assert.match(source, /snapshotPhotoFiles\(visitCameraFile\.files\)/, "Cámara debe copiar FileList antes de limpiar el input");
assert.match(source, /snapshotPhotoFiles\(visitGalleryFile\.files\)/, "Galería debe copiar FileList antes de limpiar el input");
assert.doesNotMatch(source, /máximo de 3 fotografías|3 - state\.visit\.photos\.length|slice\(0, remaining\)/, "Visitas no debe limitar la cantidad de fotos");

const storageSource = fs.readFileSync(path.join(root, "js/storage.js"), "utf8");
assert.match(storageSource, /DB_VERSION = 3/);
assert.match(storageSource, /createObjectStore\("visits"/);

const visitSource = fs.readFileSync(path.join(root, "js/visit-evidence.js"), "utf8");
assert.match(visitSource, /createLabeledVisitPhotoBlob/);
assert.match(visitSource, /Originales_para_IA/);
assert.match(visitSource, /Historial_Visitas_Campo_CASUR\.xlsx/);
assert.match(visitSource, /export function snapshotPhotoFiles/);

const masterSource = fs.readFileSync(path.join(root, "js/master.js"), "utf8");
assert.match(masterSource, /reporte/);
assert.match(masterSource, /0 sin definir/);
assert.match(masterSource, /tenureCode/);

const master = JSON.parse(fs.readFileSync(path.join(root, "data/suertes.json"), "utf8"));
assert.equal(master.length, 1054, "El Maestro General debe contener 1,054 suertes operativas");
assert.equal(new Set(master.map((row) => `${row.codigoHacienda}${row.suerte}`)).size, 1054, "Los códigos de suerte deben ser únicos");
assert.equal(master.filter((row) => row.zona === "5-Productores").length, 262, "Zona 5 debe conservar 262 suertes");
assert.equal(master.filter((row) => row.zona === "0-Sin Definir" || /sucuya/i.test(row.productor)).length, 0, "Sucuya debe estar excluida");
assert.ok(Math.abs(master.reduce((sum, row) => sum + Number(row.area || 0), 0) - 10030.06) < 0.01, "Área operativa debe ser 10,030.06 ha");

const tenure = master.reduce((acc, row) => {
  acc[row.tenenciaCode] = (acc[row.tenenciaCode] || 0) + 1;
  return acc;
}, {});
assert.deepEqual(tenure, { CA: 327, PR: 464, CV: 263 });

const producers = JSON.parse(fs.readFileSync(path.join(root, "data/productores.json"), "utf8"));
assert.equal(producers.length, 262, "productores.json se conserva como compatibilidad de Zona 5");
assert.ok(producers.every((row) => row.zona === "5-Productores"));

console.log("Estructura estática PWA v2.5.1 validada.");
