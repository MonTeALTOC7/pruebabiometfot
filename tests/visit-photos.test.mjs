import test from "node:test";
import assert from "node:assert/strict";
import { snapshotPhotoFiles } from "../js/visit-evidence.js";

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
