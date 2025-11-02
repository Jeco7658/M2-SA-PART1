const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// Camera
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(10, 4, 15);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Camera Controls
const target = new THREE.Vector3(8, 0, 8);
{
  const offset = camera.position.clone().sub(target);
  const radius = offset.length();
  const phi = Math.acos(THREE.MathUtils.clamp(offset.y / radius, -1, 1));
  const theta = Math.atan2(offset.x, offset.z);
  var spherical = { theta, phi, radius };
}

function updateCameraFromSpherical() {
  const sinPhiRadius = Math.sin(spherical.phi) * spherical.radius;
  camera.position.x = target.x + sinPhiRadius * Math.sin(spherical.theta);
  camera.position.y = target.y + Math.cos(spherical.phi) * spherical.radius;
  camera.position.z = target.z + sinPhiRadius * Math.cos(spherical.theta);
  camera.lookAt(target);
}

let isPointerDown = false, lastX = 0, lastY = 0;
const rotateSpeed = 0.005;
renderer.domElement.style.touchAction = 'none';
renderer.domElement.tabIndex = 0;
renderer.domElement.addEventListener('pointerdown', (e) => {
  isPointerDown = true;
  lastX = e.clientX;
  lastY = e.clientY;
  renderer.domElement.focus();
});
window.addEventListener('pointerup', () => (isPointerDown = false));
renderer.domElement.addEventListener('pointermove', (e) => {
  if (!isPointerDown) return;
  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;
  lastX = e.clientX; lastY = e.clientY;
  spherical.theta -= dx * rotateSpeed;
  spherical.phi -= dy * rotateSpeed;
  spherical.phi = Math.max(0.01, Math.min(Math.PI - 0.01, spherical.phi));
  updateCameraFromSpherical();
});
renderer.domElement.addEventListener('wheel', (e) => {
  e.preventDefault();
  spherical.radius += e.deltaY * 0.01;
  spherical.radius = Math.max(3, Math.min(100, spherical.radius));
  updateCameraFromSpherical();
}, { passive: false });
updateCameraFromSpherical();

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); 
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfff4cc, 1.0); 
sunLight.position.set(30, 35, 25); 
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.left = -40;
sunLight.shadow.camera.right = 40;
sunLight.shadow.camera.top = 40;
sunLight.shadow.camera.bottom = -40;
sunLight.shadow.bias = -0.001;
scene.add(sunLight);

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(2, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xfff5b5 })
);
sun.position.copy(sunLight.position);
scene.add(sun);

// Textures
const loader = new THREE.TextureLoader();
const grassTex = loader.load('textures/grass.png');
const dirtTex = loader.load('textures/dirt.png');
const barkTex = loader.load('textures/wood2.png');
const leavesTex = loader.load('textures/leaves.png');
const flowerTex = loader.load('textures/flower.png');
const grassDetailTex = loader.load('textures/grass_detail.png');

[grassTex, dirtTex, barkTex, leavesTex, flowerTex, grassDetailTex].forEach(tex => {
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestMipMapNearestFilter;
});

// Ground
const groundGroup = new THREE.Group();
const grassMat = new THREE.MeshLambertMaterial({ map: grassTex });
const dirtMat = new THREE.MeshLambertMaterial({ map: dirtTex });
const groundSize = 25;

for (let x = 0; x < groundSize; x++) {
  for (let z = 0; z < groundSize; z++) {
    const grass = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), grassMat);
    grass.position.set(x, 0, z);
    grass.castShadow = true;
    grass.receiveShadow = true;
    groundGroup.add(grass);

    const dirt = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), dirtMat);
    dirt.position.set(x, -1, z);
    dirt.receiveShadow = true;
    groundGroup.add(dirt);
  }
}
scene.add(groundGroup);

// Trees
function makeTree(x, z) {
  const trunkMat = new THREE.MeshStandardMaterial({ map: barkTex });
  const leafMat = new THREE.MeshStandardMaterial({
    map: leavesTex,
    transparent: true,
    alphaTest: 0.5,
  });

  const trunkHeight = 3 + Math.floor(Math.random() * 2);
  const trunk = new THREE.Group();
  for (let i = 0; i < trunkHeight; i++) {
    const block = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), trunkMat);
    block.position.set(x, i + 0.5, z);
    block.castShadow = true;
    trunk.add(block);
  }
  scene.add(trunk);

  const leaves = new THREE.Group();
  const layers = 2 + Math.floor(Math.random() * 2);
  for (let y = 0; y < layers; y++) {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (Math.random() < 0.95) {
          const leaf = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), leafMat);
          leaf.position.set(x + dx, trunkHeight + y + 0.5, z + dz);
          leaf.castShadow = true;
          leaf.receiveShadow = true;
          leaves.add(leaf);
        }
      }
    }
  }
  scene.add(leaves);
  return leaves;
}

// Tree Positions
const treePositions = [
  [3, 3], [7, 5], [5, 10], [12, 8], [18, 4],
  [20, 10], [15, 15], [8, 18], [3, 17], [10, 20],
  [5, 22], [17, 18], [12, 2], [22, 6], [6, 12],
  [14, 14], [2, 8], [19, 3], [21, 20], [16, 6],
  [11, 11], [9, 7], [13, 19]
];

const trees = [];
treePositions.forEach(([x, z]) => trees.push(makeTree(x, z)));

// Flowers
const flowers = [];
function makeMinecraftFlower(x, z) {
  const stemMat = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });
  const flowerMat = new THREE.MeshLambertMaterial({
    map: flowerTex,
    transparent: true,
    alphaTest: 0.5,
    side: THREE.DoubleSide
  });

  const stem = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.8, 0.12), stemMat);
  stem.position.set(x, 0.4, z);
  stem.castShadow = true;
  scene.add(stem);

  const head = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), flowerMat);
  head.position.set(x, 0.95, z);
  head.rotation.y = Math.random() * Math.PI;
  scene.add(head);

  flowers.push({ stem, head });
}

// Flower positions
const flowerPositions = [
  [4, 4], [6, 5], [7, 7], [10, 6], [12, 5],
  [13, 9], [15, 10], [16, 14], [18, 16], [20, 12],
  [5, 18], [8, 17], [9, 19], [11, 15], [14, 18],
  [17, 20], [3, 12], [6, 13], [2, 5], [19, 8],
  [21, 14], [12, 3], [7, 15], [5, 8], [16, 4]
];

flowerPositions.forEach(([x, z]) => makeMinecraftFlower(x, z));

// Grass Patches
const grassPatches = [];
function makeGrassPatch(x, z) {
  const mat = new THREE.MeshStandardMaterial({
    map: grassDetailTex,
    transparent: true,
    alphaTest: 0.5,
    side: THREE.DoubleSide
  });

  const geo = new THREE.PlaneGeometry(1.2, 1.2);
  const g1 = new THREE.Mesh(geo, mat);
  const g2 = new THREE.Mesh(geo, mat);
  g2.rotation.y = Math.PI / 2;

  const group = new THREE.Group();
  group.add(g1, g2);
  group.position.set(x, 0.5, z);
  group.castShadow = true;
  group.receiveShadow = true;
  scene.add(group);
  grassPatches.push(group);
}

// Grass positions
const grassPositions = [
  [2, 2], [3, 4], [6, 2], [5, 7], [10, 3],
  [12, 4], [15, 5], [14, 8], [18, 10], [20, 12],
  [7, 14], [8, 16], [12, 15], [16, 18], [5, 18],
  [3, 20], [11, 19], [17, 14], [19, 16], [21, 20],
  [4, 12], [6, 11], [9, 7], [13, 9], [15, 3]
];

grassPositions.forEach(([x, z]) => makeGrassPatch(x, z));

// Particles
const particleCount = 300;
const pos = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
  pos[i * 3] = Math.random() * groundSize;
  pos[i * 3 + 1] = Math.random() * 6 + 1;
  pos[i * 3 + 2] = Math.random() * groundSize;
}
const particleGeo = new THREE.BufferGeometry();
particleGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
const particleMat = new THREE.PointsMaterial({
  color: 0x00ff00,
  size: 0.08,
  transparent: true,
  opacity: 0.6
});
const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

// Animation Loop
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // Gentle sway
  trees.forEach(tree => tree.children.forEach(leaf => leaf.rotation.y = Math.sin(t * 0.5) * 0.03));
  grassPatches.forEach((patch, i) => patch.rotation.y += Math.sin(t * 1.5 + i) * 0.002);
  flowers.forEach((f, i) => f.head.rotation.z = Math.sin(t * 1.2 + i) * 0.05);

  // Particle movement
  const arr = particleGeo.attributes.position.array;
  for (let i = 0; i < particleCount; i++) {
    arr[i * 3 + 1] += 0.02;
    if (arr[i * 3 + 1] > 8) arr[i * 3 + 1] = 0.5;
  }
  particleGeo.attributes.position.needsUpdate = true;

  renderer.render(scene, camera);
}
animate();

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
