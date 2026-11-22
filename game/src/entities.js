import * as THREE from '../../vendor/three.min.js';
import { CONFIG } from './config.js';
import { world } from './world.js';

// Simple car and pedestrian models
const carGeometry = new THREE.BoxGeometry(4, 2, 8);
const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1, 8);

export function createCar(position, color) {
  const group = new THREE.Group();
  
  // Car body
  const body = new THREE.Mesh(carGeometry, new THREE.MeshStandardMaterial({
    color: color || 0xd32f2f,
    roughness: 0.4,
    metalness: 0.6,
  }));
  body.position.y = 1;
  group.add(body);
  
  // Car tires
  const tirePositions = [
    [-2, 0.5, -4], [2, 0.5, -4], [-2, 0.5, 4], [2, 0.5, 4]
  ];
  tirePositions.forEach(pos => {
    const tire = new THREE.Mesh(wheelGeometry, new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.9,
    }));
    tire.position.set(pos[0], pos[1], pos[2]);
    group.add(tire);
  });
  
  // Cabin
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 1.5, 3),
    new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.8 })
  );
  cabin.position.set(0, 2.2, 0);
  group.add(cabin);
  
  // Headlights
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffcc00 });
  const lightPositions = [
    [-2.2, 2.5, -4], [2.2, 2.5, -4]
  ];
  lightPositions.forEach(pos => {
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 6), lightMat);
    light.position.set(pos[0], pos[1], pos[2]);
    group.add(light);
  });
  
  group.position.copy(position);
  group.rotation.y = 0;
  group.updateMatrixWorld(true);
  
  return group;
}

export function createPedestrian(position) {
  const group = new THREE.Group();
  
  // Body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 1.5, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x2d1b1b, roughness: 0.8 })
  );
  body.position.y = 0.75;
  group.add(body);
  
  // Head
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 6, 6),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
  );
  head.position.set(0, 1.2, 0);
  group.add(head);
  
  // Legs
  const legMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
  for (let side = -1; side <= 1; side += 2) {
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 1, 0.2),
      legMat
    );
    leg.position.set(side * 0.35, 0.75, 0);
    group.add(leg);
  }
  
  // Arms
  const armMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
  for (let side = -1; side <= 1; side += 2) {
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 1, 0.2),
      armMat
    );
    arm.position.set(side * 0.7, 1.2, 0);
    group.add(arm);
  }
  
  group.position.copy(position);
  group.rotation.y = 0;
  
  return group;
}

// Initialize entities
export function init() {
  // Create some traffic
  for (let i = 0; i < 10; i++) {
    const pos = new THREE.Vector3(
      (Math.random() - 0.5) * 50,
      0.5,
      (Math.random() - 0.5) * 30
    );
    const car = createCar(pos, [0xe74c3c, 0x3498db, 0xf1c40f, 0x9b59b6][Math.floor(Math.random() * 4)]);
    world.traffic.push(car);
  }
  
  // Create pedestrians
  for (let i = 0; i < 15; i++) {
    const pos = new THREE.Vector3(
      (Math.random() - 0.5) * 30,
      1.6,
      (Math.random() - 0.5) * 30
    );
    const ped = createPedestrian(pos);
    world.pedestrians.push(ped);
  }
}

// Update entities
export function update(dt) {
  const time = Date.now() * 0.001;
  
  // Traffic
  world.traffic.forEach((car, i) => {
    car.position.x += Math.sin(time * 0.5 + i) * 0.02;
    car.position.z += Math.cos(time * 0.7 + i) * 0.02;
    
    // Wrap around
    const half = CONFIG.WORLD_SIZE / 2;
    if (Math.abs(car.position.x) > half) car.position.x = -car.position.x;
    if (Math.abs(car.position.z) > half) car.position.z = -car.position.z;
  });
  
  // Pedestrians
  world.pedestrians.forEach(ped => {
    ped.position.x += Math.sin(time * 0.3 + ped.position.x) * 0.01;
    ped.position.z += Math.cos(time * 0.5 + ped.position.z) * 0.01;
    
    const half = CONFIG.WORLD_SIZE / 2 - 5;
    ped.position.x = Math.max(-half, Math.min(half, ped.position.x));
    ped.position.z = Math.max(-half, Math.min(half, ped.position.z));
  });
}
