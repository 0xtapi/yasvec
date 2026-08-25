import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

const canvas = document.querySelector('#viewer');
const viewerWrap = document.querySelector('#drop-zone');
const loading = document.querySelector('#loading');
const loadingLabel = document.querySelector('#loading-label');
const progressBar = document.querySelector('#progress-bar');
const viewerControls = document.querySelector('#viewer-controls');
const errorMessage = document.querySelector('#error-message');
const lightingToggle = document.querySelector('#lighting-toggle');
const lightingClose = document.querySelector('#lighting-close');
const lightingPanel = document.querySelector('#lighting-panel');
const toneMappingControl = document.querySelector('#tone-mapping-control');
const exposureControl = document.querySelector('#exposure-control');
const exposureValue = document.querySelector('#exposure-value');
const lightDirectionControl = document.querySelector('#light-direction-control');
const lightDirectionValue = document.querySelector('#light-direction-value');

const studioEnvironmentUrl = `${import.meta.env.BASE_URL}environments/studio_small_03_1k.hdr`;
const defaultModelUrl = `${import.meta.env.BASE_URL}models/model.glb`;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 1000);
const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true,
  powerPreference: 'high-performance',
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 0.2;
scene.environmentIntensity = 0.28;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate = false;

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.screenSpacePanning = true;

const keyLight = new THREE.DirectionalLight(0xfff4e4, 6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.intensity = 1;
keyLight.shadow.radius = 4.5;
keyLight.shadow.bias = -0.00025;
keyLight.shadow.blurSamples = 12;
scene.add(keyLight, keyLight.target);

let model;
let modelBounds;
let lightDirectionRadians = 0;
const billboardLabels = [];
const billboardAxisCorrection = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(1, 0, 0),
  Math.PI / 2,
);

function isPinLabelMaterial(material) {
  return /^(letter|number)_/i.test(material?.name ?? '');
}

function findBillboardRoot(object) {
  let current = object;

  while (current && current !== model) {
    if (/^Bildobjekt(?:_\d+)?$/.test(current.name)) return current;
    current = current.parent;
  }

  return null;
}

function updateBillboardLabels() {
  billboardLabels.forEach((label) => {
    label.lookAt(camera.position);
    label.quaternion.multiply(billboardAxisCorrection);
  });
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
  loading.hidden = true;
}

function clearError() {
  errorMessage.hidden = true;
  errorMessage.textContent = '';
}

function setLoadingProgress(progress) {
  progressBar.style.width = `${Math.round(progress * 100)}%`;
}

function setLightingPanel(open) {
  lightingPanel.hidden = !open;
  lightingToggle.setAttribute('aria-expanded', String(open));
  lightingToggle.classList.toggle('is-active', open);
}

function setExposure(value) {
  const exposure = Number(value);
  renderer.toneMappingExposure = exposure;
  exposureControl.value = String(exposure);
  exposureValue.value = exposure.toFixed(2);
  exposureValue.textContent = exposure.toFixed(2);
}

function updateLightPosition() {
  if (!modelBounds) return;

  const { center, maxDimension } = modelBounds;
  const horizontalDistance = maxDimension * 2.2;

  keyLight.position.set(
    center.x + Math.cos(lightDirectionRadians) * horizontalDistance,
    center.y + maxDimension * 1.55,
    center.z + Math.sin(lightDirectionRadians) * horizontalDistance,
  );
  keyLight.target.position.copy(center);
  keyLight.target.position.y = modelBounds.box.min.y;
  keyLight.target.updateMatrixWorld();
  keyLight.updateMatrixWorld();
  renderer.shadowMap.needsUpdate = true;
}

function setLightDirection(value) {
  const degrees = Number(value);
  lightDirectionRadians = THREE.MathUtils.degToRad(degrees);

  // Keep the visible HDR key light and the shadow-casting light together.
  scene.environmentRotation.y = -lightDirectionRadians;
  updateLightPosition();

  lightDirectionControl.value = String(degrees);
  lightDirectionValue.value = `${Math.round(degrees)}°`;
  lightDirectionValue.textContent = `${Math.round(degrees)}°`;
}

function configureShadow(box, center, size, maxDimension) {
  const shadowCamera = keyLight.shadow.camera;
  const shadowExtent = maxDimension * 1.45;

  shadowCamera.left = -shadowExtent;
  shadowCamera.right = shadowExtent;
  shadowCamera.top = shadowExtent;
  shadowCamera.bottom = -shadowExtent;
  shadowCamera.near = Math.max(maxDimension * 0.01, 0.01);
  shadowCamera.far = maxDimension * 7;
  shadowCamera.updateProjectionMatrix();
  keyLight.shadow.normalBias = maxDimension * 0.00035;

  const floorSize = Math.max(size.x, size.z, maxDimension) * 4;
  const floorGeometry = new THREE.PlaneGeometry(floorSize, floorSize);
  const floorMaterial = new THREE.ShadowMaterial({
    color: 0x000000,
    opacity: 0.86,
    transparent: true,
    depthWrite: false,
  });

  const shadowFloor = new THREE.Mesh(floorGeometry, floorMaterial);
  shadowFloor.rotation.x = -Math.PI / 2;
  shadowFloor.position.set(center.x, box.min.y - maxDimension * 0.001, center.z);
  shadowFloor.receiveShadow = true;
  shadowFloor.renderOrder = -1;
  scene.add(shadowFloor);
}

function frameModel(box, center, maxDimension) {
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
  const viewDirection = new THREE.Vector3(0, 0.42, 1).normalize();
  const forward = viewDirection.clone().negate();
  const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
  const viewUp = new THREE.Vector3().crossVectors(right, forward).normalize();
  let halfWidth = 0;
  let halfHeight = 0;
  let halfDepth = 0;

  for (const x of [box.min.x, box.max.x]) {
    for (const y of [box.min.y, box.max.y]) {
      for (const z of [box.min.z, box.max.z]) {
        const corner = new THREE.Vector3(x, y, z).sub(center);
        halfWidth = Math.max(halfWidth, Math.abs(corner.dot(right)));
        halfHeight = Math.max(halfHeight, Math.abs(corner.dot(viewUp)));
        halfDepth = Math.max(halfDepth, Math.abs(corner.dot(viewDirection)));
      }
    }
  }

  const distance =
    Math.max(
      halfWidth / Math.tan(horizontalFov / 2),
      halfHeight / Math.tan(verticalFov / 2),
    ) *
      1.12 +
    halfDepth;

  camera.near = Math.max(maxDimension / 1000, 0.001);
  camera.far = Math.max(distance + maxDimension * 12, 100);
  camera.position.copy(center).addScaledVector(viewDirection, distance);
  camera.updateProjectionMatrix();

  controls.target.copy(center);
  controls.minDistance = Math.max(sphere.radius * 0.08, camera.near * 2);
  controls.maxDistance = sphere.radius * 20;
  controls.update();
  controls.saveState();
}

function prepareModel(loadedModel) {
  model = loadedModel;
  scene.add(model);
  model.updateMatrixWorld(true);

  model.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;

    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const isPinLabel = materials.some(isPinLabelMaterial);

    if (isPinLabel) {
      const billboardRoot = findBillboardRoot(object);
      if (billboardRoot && !billboardLabels.includes(billboardRoot)) {
        billboardLabels.push(billboardRoot);
      }

      // The pin graphics are transparent planes; excluding them avoids
      // rectangular artifacts in the directional shadow map as they rotate.
      object.castShadow = false;
      object.receiveShadow = false;
    }

    materials.forEach((material) => {
      // Vectorworks/Blender exports can use fully emissive decals. Keeping a
      // small amount preserves their texture while allowing them to darken.
      if (material.emissive) material.emissiveIntensity = 0.08;

      // Architectural exports often contain thin, double-sided geometry.
      // Casting from both sides keeps walls, roofs, and foliage in the map.
      material.shadowSide = THREE.DoubleSide;
      material.needsUpdate = true;
    });
  });

  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z, 0.001);

  modelBounds = { box, center, size, maxDimension };
  updateBillboardLabels();
  configureShadow(box, center, size, maxDimension);
  frameModel(box, center, maxDimension);
  updateLightPosition();
  renderer.shadowMap.needsUpdate = true;
}

function loadEnvironment() {
  new HDRLoader().load(
    studioEnvironmentUrl,
    (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
      scene.environmentRotation.y = -lightDirectionRadians;
    },
    undefined,
    (error) => {
      console.warn('The studio environment could not be loaded.', error);
    },
  );
}

function loadModel() {
  clearError();
  loadingLabel.textContent = 'Loading model…';
  setLoadingProgress(0);
  loading.hidden = false;

  new GLTFLoader().load(
    defaultModelUrl,
    (gltf) => {
      prepareModel(gltf.scene);
      setLoadingProgress(1);
      loading.hidden = true;
      viewerControls.hidden = false;
    },
    (event) => {
      if (event.lengthComputable && event.total > 0) {
        setLoadingProgress(event.loaded / event.total);
      }
    },
    () => {
      viewerControls.hidden = true;
      showError('The model could not be displayed. Check that public/models/model.glb is a valid GLB file.');
    },
  );
}

function resizeRenderer() {
  const width = viewerWrap.clientWidth;
  const height = viewerWrap.clientHeight;

  if (width === 0 || height === 0) return;

  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function render() {
  controls.update();
  updateBillboardLabels();
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

document.querySelector('#reset-view').addEventListener('click', () => controls.reset());

lightingToggle.addEventListener('click', () => {
  setLightingPanel(lightingPanel.hidden);
});

lightingClose.addEventListener('click', () => setLightingPanel(false));

exposureControl.addEventListener('input', () => {
  setExposure(exposureControl.value);
});

toneMappingControl.addEventListener('change', () => {
  const toneMappings = {
    neutral: THREE.NeutralToneMapping,
    agx: THREE.AgXToneMapping,
    aces: THREE.ACESFilmicToneMapping,
  };

  renderer.toneMapping = toneMappings[toneMappingControl.value];
  model?.traverse((object) => {
    if (!object.isMesh) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      material.needsUpdate = true;
    });
  });
});

lightDirectionControl.addEventListener('input', () => {
  setLightDirection(lightDirectionControl.value);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setLightingPanel(false);
});

new ResizeObserver(resizeRenderer).observe(viewerWrap);

viewerWrap.dataset.backdrop = 'dark';
toneMappingControl.value = 'neutral';
setExposure(0.2);
setLightDirection(30);
resizeRenderer();
loadEnvironment();
loadModel();
render();

window.clearTimeout(window.__vectorappStartupTimer);
