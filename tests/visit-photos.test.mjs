import test from "node:test";
import assert from "node:assert/strict";
import { createVisitsPackageBlob, snapshotPhotoFiles, visitPhotoBlob, visitPhotoFilename } from "../js/visit-evidence.js";

test("copia FileList antes de que el input sea limpiado", () => {
  const cameraPhoto = { name: "camara.jpg" };
  const galleryPhoto = { name: "galeria.png" };
  const liveFileList = { 0: cameraPhoto, 1: galleryPhoto, length: 2 };
  const snapshot = snapshotPhotoFiles(liveFileList);

  liveFileList.length = 0;
  delete liveFileList[0];
  delete liveFileList[1];

  assert.deepEqual(snapshot, [cameraPhoto, galleryPhoto]);
});

test("mantiene todas las fotos seleccionadas sin límite artificial", () => {
  const photos = Array.from({ length: 12 }, (_, index) => ({ name: `foto_${index + 1}.jpg` }));
  const snapshot = snapshotPhotoFiles(photos);
  assert.equal(snapshot.length, 12);
});

test("acepta Blob nuevo y Base64 legado sin perder compatibilidad", async () => {
  const modern = new Blob(["foto"], { type: "image/jpeg" });
  assert.equal(visitPhotoBlob({ blob: modern }), modern);
  const legacy = visitPhotoBlob({ dataUrl: "data:image/jpeg;base64,Zm90bw==" });
  assert.equal(await legacy.text(), "foto");
});

test("nombre directo de PNG incluye código, productor, suerte, fecha y número", () => {
  const name = visitPhotoFilename({ lotId: "99302", producer: "Pansaco", lot: "02", date: "2026-08-24" }, 3);
  assert.equal(name, "99302_Pansaco_Suerte_02_24-ago-2026_Foto_03.png");
});

test("ZIP masivo permite exportar solo originales sin depender de Excel o canvas", async () => {
  const zip = await createVisitsPackageBlob([{
    id: "visit_1", lotId: "99302", farmCode: "993", producer: "Pansaco", lot: "02", date: "2026-08-24",
    photos: [{ id: "photo_1", blob: new Blob(["foto"], { type: "image/jpeg" }), capturedAt: "2026-08-24T10:00:00Z" }],
  }], { includeLabeled: false, includeOriginals: true, includeExcel: false });
  const bytes = new Uint8Array(await zip.arrayBuffer());
  assert.equal(String.fromCharCode(bytes[0], bytes[1]), "PK");
  assert.ok(new TextDecoder().decode(bytes).includes("Visitas_CASUR/993_Pansaco/Suerte_02/2026-08-24/Originales_para_IA"));
});
