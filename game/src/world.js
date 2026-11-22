import * as THREE from '../../vendor/three.min.js';

import { CONFIG } from './config.js';

// World state
export const world = {
  state: 'title',
  buildings: [],
  trees: [],
  traffic: [],
  pedestrians: [],
  cars: [],
  roads: [],
  ground: null,
  material: null,
  cityMesh: null,
  money: 0,
  wantedLevel: 0,
  wantedStage: 0,
  wantedShot: 0,
  mission: null,
  storyProgress: 0,
  totalCars: 0,
  stolenCars: 0,
  checkpoint: 0,
  saveData: null,
};

// Color palettes
export const PALETTE = {
  // City colors 
  buildingColors: [
    0x1a1a2e, 0x16213e, 0x0f3460, 0x1a1a2e, 0x533483,
    0x164216, 0x2d1b1b, 0x1a1a1a, 0x3d5a80, 0x1f1f1f,
  ],
  // Road colors
  roadColors: [
    0x444444, 0x555555, 0x666666, 0x333333,
  ],
  // Tree colors
  treeColors: [
    0x1a5276, 0x2e86c1, 0x34495e, 0x1b4f72, 0x2471a3,
  ],
};

// Create the world
export function createWorld(random) {
  const size = CONFIG.WORLD_SIZE;
  
  // Create ground
  const geometry = new THREE.PlaneGeometry(size, size);
  geometry.rotateX(-Math.PI / 2);
  const material = new THREE.MeshStandardMaterial({
    color: 0x1a1a2e,
    roughness: 0.8,
    metalness: 0.2,
  });
  const ground = new THREE.Mesh(geometry, material);
  ground.receiveShadow = true;
  world.ground = ground;
  
  // Generate roads (main roads)
  const roads = [];
  const roadPadding = 40;
  const mainRoadSize = 300;
  const subRoadSize = 150;
  
  // Main roads (horizontal and vertical)
  const mainRoadPoints = [];
  const subRoadPoints = [];
  
  // Horizontal main roads
  for (let y = -mainRoadSize / 2; y <= mainRoadSize / 2; y += mainRoadSize / 2) {
    mainRoadPoints.push({ x: -mainRoadSize / 2, y, z: 0 });
    mainRoadPoints.push({ x: mainRoadSize / 2, y, z: 0 });
  }
  
  // Vertical main roads
  for (let x = -mainRoadSize / 2; x <= mainRoadSize / 2; x += mainRoadSize / 2) {
    mainRoadPoints.push({ x, y: -mainRoadSize / 2, z: 0 });
    mainRoadPoints.push({ x, y: mainRoadSize / 2, z: 0 });
  }
  
  // Sub roads
  for (let y = -subRoadSize / 2; y <= subRoadSize / 2; y += subRoadSize / 2) {
    subRoadPoints.push({ x: -subRoadSize / 2, y, z: 0 });
    subRoadPoints.push({ x: subRoadSize / 2, y, z: 0 });
  }
  
  for (let x = -subRoadSize / 2; x <= subRoadSize / 2; x += subRoadSize / 2) {
    subRoadPoints.push({ x, y: -subRoadSize / 2, z: 0 });
    subRoadPoints.push({ x, y: subRoadSize / 2, z: 0 });
  }
  
  roads.push(...mainRoadPoints, ...subRoadPoints);
  
  // Create road meshes
  const roadGeometry = new THREE.BoxGeometry(CONFIG.ROAD_WIDTH, 0.5, 4);
  const roadMaterial = new THREE.MeshStandardMaterial({
    color: 0x444444,
    roughness: 0.9,
    metalness: 0.1,
  });
  
  // Create road grid
  const roadSections = [];
  const roadGridY = [];
  const roadGridZ = [];
  const roadDist = 30;
  const roadCount = 15;
  
  for (let i = 0; i < roadCount; i++) {
    const y = (i - roadCount / 2) * roadDist;
    for (let j = 0; j < roadCount; j++) {
      const z = (j - roadCount / 2) * roadDist;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(CONFIG.ROAD_WIDTH, 0.5, roadDist),
        roadMaterial
      );
      mesh.position.set(z, 0.25, y);
      mesh.receiveShadow = true;
      world.buildings.push(mesh);
      roadSections.push(mesh);
    }
  }
  
  // Generate buildings
  const buildingGeometry = new THREE.BoxGeometry(6, 8, 6);
  const baseColors = [0x2d1b1b, 0x1a1a2e, 0x16213e, 0x3d5a80, 0x1a1a1a, 0x5a3a2d];
  const colors = [];
  
  for (let i = 0; i < 150; i++) {
    const x = randomRange(-200, 200, random);
    const z = randomRange(-200, 200, random);
    const y = randomRange(0.5, 4, random);
    
    // Skip if too close to roads
    if (Math.abs(x) < 10 || Math.abs(z) < 10) continue;
    
    const color = baseColors[randomIdx(baseColors.length, random)];
    colors.push(color);
    
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(
        randomRange(4, 12, random),
        y + randomRange(2, 8, random),
        randomRange(4, 12, random)
      ),
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.7,
        metalness: 0.1,
      })
    );
    mesh.position.set(x, y / 2 + 0.25, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    world.buildings.push(mesh);
  }
  
  // Generate trees
  for (let i = 0; i < 300; i++) {
    if (random() > CONFIG.TREE_DENSITY) continue;
    const x = randomRange(-150, 150, random);
    const z = randomRange(-150, 150, random);
    
    // Skip near roads
    if (Math.abs(x) < 8 || Math.abs(z) < 8) continue;
    
    const tree = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 2, 6, 8),
      new THREE.MeshStandardMaterial({
        color: 0x1a5276,
        roughness: 0.9,
      })
    );
    tree.position.set(x, 3, z);
    tree.castShadow = true;
    world.trees.push(tree);
    
    // Add some decorations
    for (let j = 0; j < 2; j++) {
      const bush = new THREE.Mesh(
        new THREE.SphereGeometry(randomRange(0.8, 1.2, random), 6, 6),
        new THREE.MeshStandardMaterial({
          color: 0x1a5276,
          roughness: 0.9,
        })
      );
      bush.position.set(
        x + randomRange(-2, 2, random),
        2.5,
        z + randomRange(-2, 2, random)
      );
      bush.castShadow = true;
      world.trees.push(bush);
    }
  }
  
  return world;
}

// Random range
function randomRange(min, max, random) {
  return min + random() * (max - min);
}

// Random index
function randomIdx(max, random) {
  return Math.floor(random() * max);
}

// Get car colors
export function getCarColors() {
  return [0xe74c3c, 0x3498db, 0xf1c40f, 0x9b59b6, 0x1abc9c, 0xe67e22, 0x2c3e50, 0x1a1a1a];
}

// Initialize the world
export function init() {
  // This will be called by the game
}
