import * as THREE from '../../vendor/three.min.js';
import { CONFIG } from './config.js';

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

// Player data
export const player = {
  money: 0,
  reputation: 100,
  carsOwned: [],
  finishLine: null,
  lastCheckpoint: 0,
  storyProgress: 0,
};

// Create a proper 3D city with roads
export function createCity() {
  const size = CONFIG.WORLD_SIZE;
  
  // Ground
  const groundGeo = new THREE.PlaneGeometry(size * 2, size * 2);
  groundGeo.rotateX(-Math.PI / 2);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a2e, roughness: 0.8, metalness: 0.2,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.receiveShadow = true;
  world.ground = ground;
  
  // Road grid
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x444444, roughness: 0.9, metalness: 0.1,
  });
  
  // Main roads (thick)
  const mainRoadWidth = 12;
  const subRoadWidth = 8;
  const roadSegment = 25;
  const roadCount = 20;
  
  // Horizontal main roads
  for (let i = 0; i < roadCount; i++) {
    const y = (i - roadCount / 2) * roadSegment;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(mainRoadWidth, 0.5, roadSegment),
      roadMat
    );
    mesh.position.set(-size * 0.6, 0.25, y);
    mesh.receiveShadow = true;
    world.buildings.push(mesh);
  }
  
  // Vertical main roads
  for (let i = 0; i < roadCount; i++) {
    const z = (i - roadCount / 2) * roadSegment;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(roadSegment, 0.5, mainRoadWidth),
      roadMat
    );
    mesh.position.set(z, 0.25, -size * 0.6);
    mesh.receiveShadow = true;
    world.buildings.push(mesh);
  }
  
  // Sub roads
  const subRoadMat = new THREE.MeshStandardMaterial({
    color: 0x555555, roughness: 0.9, metalness: 0.1,
  });
  for (let i = 0; i < roadCount; i++) {
    const y = (i - roadCount / 2) * roadSegment;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(subRoadWidth, 0.5, roadSegment),
      subRoadMat
    );
    mesh.position.set(-size * 0.6, 0.25, y);
    mesh.receiveShadow = true;
    world.buildings.push(mesh);
  }
  
  for (let i = 0; i < roadCount; i++) {
    const z = (i - roadCount / 2) * roadSegment;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(roadSegment, 0.5, subRoadWidth),
      subRoadMat
    );
    mesh.position.set(z, 0.25, -size * 0.6);
    mesh.receiveShadow = true;
    world.buildings.push(mesh);
  }
  
  // Generate buildings (diverse heights)
  const colorSet = [0x2d1b1b, 0x1a1a2e, 0x16213e, 0x3d5a80, 0x1a1a1a, 0x5a3a2d, 0x2c3e50, 0x1f1f1f];
  const noise = (x, z) => {
    const n = Math.sin(x * 0.05) * Math.cos(z * 0.07) * 100;
    return n;
  };
  
  const buildingPositions = [];
  for (let i = 0; i < 300; i++) {
    const x = (Math.random() - 0.5) * size * 1.2;
    const z = (Math.random() - 0.5) * size * 1.2;
    
    // Skip road areas
    if (Math.abs(x) < 15 || Math.abs(z) < 15) continue;
    
    // Skip near edges
    if (Math.abs(x) > size * 0.5 || Math.abs(z) > size * 0.5) continue;
    
    const height = Math.floor(Math.abs(noise(x, z)) % 20) + 3;
    const color = colorSet[Math.floor(Math.random() * colorSet.length)];
    
    const geo = new THREE.BoxGeometry(
      Math.random() * 8 + 4,
      height + Math.random() * 6,
      Math.random() * 8 + 4
    );
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.1 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, height / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    world.buildings.push(mesh);
    buildingPositions.push({ x, z, y: height });
  }
  
  // Generate trees
  for (let i = 0; i < 200; i++) {
    const x = (Math.random() - 0.5) * size * 1.1;
    const z = (Math.random() - 0.5) * size * 1.1;
    if (Math.abs(x) < 10 || Math.abs(z) < 10) continue;
    
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.8, 4, 6),
      new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.9 })
    );
    trunk.position.set(x, 2, z);
    trunk.castShadow = true;
    world.trees.push(trunk);
    
    const foliage = new THREE.Mesh(
      new THREE.SphereGeometry(Math.random() * 3 + 2, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x1a5276, roughness: 0.8 })
    );
    foliage.position.set(x, 6, z);
    foliage.castShadow = true;
    world.trees.push(foliage);
  }
  
  // Traffic (simple box cars)
  const trafficMat = new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.4, metalness: 0.6 });
  for (let i = 0; i < 30; i++) {
    const car = new THREE.Mesh(
      new THREE.BoxGeometry(4, 1.8, 8),
      trafficMat
    );
    car.position.set(
      (Math.random() - 0.5) * 60,
      0.9,
      (Math.random() - 0.5) * 40
    );
    // Tires
    for (let side = -1; side <= 1; side += 2) {
      for (let pos = -3.5; pos <= 3.5; pos += 7) {
        const tire = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.3, 0.5, 8),
          new THREE.MeshStandardMaterial({ color: 0x111111 })
        );
        tire.position.set(pos, 0.25, side * 4);
        car.add(tire);
      }
    }
    car.castShadow = true;
    world.traffic.push(car);
  }
  
  // Pedestrians
  for (let i = 0; i < 50; i++) {
    const p = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.5, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x2d1b1b, roughness: 0.8 })
    );
    p.position.set(
      (Math.random() - 0.5) * 40,
      1.6,
      (Math.random() - 0.5) * 40
    );
    world.pedestrians.push(p);
  }
}

// Initialize world
export function init() {
  createCity();
  player.money = 500;
}
