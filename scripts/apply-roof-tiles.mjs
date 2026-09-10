import { readFile, rename, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Accessor, NodeIO, Primitive, TextureInfo } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';

const projectRoot = resolve(import.meta.dirname, '..');
const sourcePath = resolve(projectRoot, 'public/models/model.glb');
const outputPath = resolve(projectRoot, 'public/models/model-experiment.glb');
const temporaryPath = resolve(projectRoot, 'public/models/model-experiment.tmp.glb');
const texturePath = resolve(projectRoot, 'assets/textures/roof-tiles-terracotta.png');

// These exported Vectorworks solids contain the visible building envelopes.
// Only their upward-facing triangles are assigned the roof material.
const roofBearingNodes = new Map([
  ['3D_Fase_2', 7.5],
  ['3D_Fase_3', 9],
  ['Punktkörper_11', 4.5],
]);

const roofNormalThreshold = 0.15;
const texturePatchWidthMeters = 7.8;
const texturePatchHeightMeters = 5;

function transformPoint(matrix, point) {
  const [x, y, z] = point;
  return [
    matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12],
    matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13],
    matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14],
  ];
}

function subtract(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function normalizedY(normal) {
  const length = Math.hypot(normal[0], normal[1], normal[2]);
  return length > 0 ? normal[1] / length : -1;
}

function getIndexArray(primitive, vertexCount) {
  const indices = primitive.getIndices()?.getArray();
  if (indices) return indices;

  return Uint32Array.from({ length: vertexCount }, (_, index) => index);
}

function createIndexAccessor(document, buffer, name, indices) {
  return document
    .createAccessor(name, buffer)
    .setType(Accessor.Type.SCALAR)
    .setArray(new Uint32Array(indices));
}

function createPlanarUVs(document, buffer, positionAccessor, worldMatrix, name) {
  const uvArray = new Float32Array(positionAccessor.getCount() * 2);
  const position = [0, 0, 0];

  for (let index = 0; index < positionAccessor.getCount(); index += 1) {
    positionAccessor.getElement(index, position);
    const world = transformPoint(worldMatrix, position);
    uvArray[index * 2] = world[0] / texturePatchWidthMeters;
    uvArray[index * 2 + 1] = world[2] / texturePatchHeightMeters;
  }

  return document
    .createAccessor(name, buffer)
    .setType(Accessor.Type.VEC2)
    .setArray(uvArray);
}

function splitRoofFaces(document, node, roofMaterial, buffer, minimumRoofY) {
  const mesh = node.getMesh();
  if (!mesh) return { roofTriangles: 0, otherTriangles: 0 };

  const worldMatrix = node.getWorldMatrix();
  let roofTriangles = 0;
  let otherTriangles = 0;

  for (const [primitiveIndex, primitive] of [...mesh.listPrimitives()].entries()) {
    if (primitive.getMode() !== Primitive.Mode.TRIANGLES) continue;

    const positionAccessor = primitive.getAttribute('POSITION');
    if (!positionAccessor) continue;

    const indices = getIndexArray(primitive, positionAccessor.getCount());
    const roofIndices = [];
    const otherIndices = [];
    const points = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];

    for (let offset = 0; offset < indices.length; offset += 3) {
      for (let corner = 0; corner < 3; corner += 1) {
        positionAccessor.getElement(indices[offset + corner], points[corner]);
        points[corner] = transformPoint(worldMatrix, points[corner]);
      }

      const normal = cross(subtract(points[1], points[0]), subtract(points[2], points[0]));
      const centroidY = (points[0][1] + points[1][1] + points[2][1]) / 3;
      const isRoof = normalizedY(normal) > roofNormalThreshold && centroidY > minimumRoofY;
      const destination = isRoof ? roofIndices : otherIndices;
      destination.push(indices[offset], indices[offset + 1], indices[offset + 2]);
    }

    if (roofIndices.length === 0) continue;

    roofTriangles += roofIndices.length / 3;
    otherTriangles += otherIndices.length / 3;

    const uvAccessor = createPlanarUVs(
      document,
      buffer,
      positionAccessor,
      worldMatrix,
      `${node.getName()} roof UVs`,
    );
    const roofPrimitive = document
      .createPrimitive()
      .setMode(primitive.getMode())
      .setMaterial(roofMaterial)
      .setIndices(
        createIndexAccessor(
          document,
          buffer,
          `${node.getName()} roof indices`,
          roofIndices,
        ),
      );

    for (const semantic of primitive.listSemantics()) {
      if (semantic === 'TEXCOORD_0') continue;
      roofPrimitive.setAttribute(semantic, primitive.getAttribute(semantic));
    }
    roofPrimitive.setAttribute('TEXCOORD_0', uvAccessor);
    mesh.addPrimitive(roofPrimitive);

    if (otherIndices.length > 0) {
      primitive.setIndices(
        createIndexAccessor(
          document,
          buffer,
          `${node.getName()} non-roof indices`,
          otherIndices,
        ),
      );
    } else {
      mesh.removePrimitive(primitive);
    }
  }

  return { roofTriangles, otherTriangles };
}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const document = await io.read(sourcePath);
const root = document.getRoot();
const buffer = root.listBuffers()[0] ?? document.createBuffer('Model buffer');
const roofTexture = document
  .createTexture('Weathered terracotta roof tiles')
  .setImage(await readFile(texturePath))
  .setMimeType('image/png');
const roofMaterial = document
  .createMaterial('Roof tiles - weathered terracotta')
  .setBaseColorFactor([1, 1, 1, 1])
  .setBaseColorTexture(roofTexture)
  .setMetallicFactor(0)
  .setRoughnessFactor(0.82)
  .setDoubleSided(true);

roofMaterial
  .getBaseColorTextureInfo()
  .setWrapS(TextureInfo.WrapMode.REPEAT)
  .setWrapT(TextureInfo.WrapMode.REPEAT)
  .setMagFilter(TextureInfo.MagFilter.LINEAR)
  .setMinFilter(TextureInfo.MinFilter.LINEAR_MIPMAP_LINEAR);

let totalRoofTriangles = 0;
let totalOtherTriangles = 0;
const modifiedNodes = [];

for (const node of root.listNodes()) {
  if (!roofBearingNodes.has(node.getName())) continue;
  const counts = splitRoofFaces(
    document,
    node,
    roofMaterial,
    buffer,
    roofBearingNodes.get(node.getName()),
  );
  totalRoofTriangles += counts.roofTriangles;
  totalOtherTriangles += counts.otherTriangles;
  modifiedNodes.push(`${node.getName()} (${counts.roofTriangles} roof triangles)`);
}

if (modifiedNodes.length !== roofBearingNodes.size || totalRoofTriangles === 0) {
  throw new Error(
    `Roof detection failed: found ${modifiedNodes.length}/${roofBearingNodes.size} target nodes and ${totalRoofTriangles} roof triangles.`,
  );
}

await io.write(temporaryPath, document);
await io.read(temporaryPath);
await rm(outputPath, { force: true });
await rename(temporaryPath, outputPath);

console.log(`Wrote ${outputPath}`);
console.log(`Applied tiles to ${totalRoofTriangles} triangles; preserved ${totalOtherTriangles} non-roof triangles.`);
console.log(modifiedNodes.join('\n'));
