import * as THREE from '../../vendor/three.min.js';

import { CONFIG } from './config.js';
import { world } from './world.js';
import { player, camera } from './player.js';

export const renderer = {
  canvas: document.getElementById('game'),
  renderer: null,
  scene: null,
  camera: null,
  
  init() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    
    this.scene = new THREE.Scene();
    
    // Ambient light
    const ambient = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambient);
    
    // Directional light (sun)
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(100, 50, 100);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    this.scene.add(sun);
    
    // Create ground
    const groundGeo = new THREE.PlaneGeometry(CONFIG.WORLD_SIZE, CONFIG.WORLD_SIZE);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.8,
      metalness: 0.2,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.receiveShadow = true;
    this.scene.add(groundMesh);
    
    // Add a grid helper for debugging
    const grid = new THREE.GridHelper(CONFIG.WORLD_SIZE, 20, 0x444444, 0x333333);
    grid.position.y = 0.01;
    this.scene.add(grid);
    
    // Create a skybox
    this.createSkybox();
  },
  
  createSkybox() {
    // Simple sky color
    const skyGeo = new THREE.SphereGeometry(1000, 32, 16);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor: { value: new THREE.Color(0x0a0a1a) },
        bottomColor: { value: new THREE.Color(0x1a1a2e) },
        offset: { value: 20 },
        exponent: { value: 0.6 },
      },
      fragmentShader: `
        varying vec3 vWorldPosition;
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        void main() {
          vec3 worldPosition = vWorldPosition;
          float h = normalize(worldPosition + offset).y;
          float t = max(pow(max(h, 0.0), exponent), 0.0);
          gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0);
        }
      `,
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(sky);
  },
  
  update(dt) {
    this.renderer.render(this.scene, camera.position);
  },
  
  resize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
};

// Minimap
export const minimap = {
  canvas: document.getElementById('minimap-canvas'),
  ctx: null,
  size: 180,
  
  init() {
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    this.draw();
  },
  
  draw() {
    const ctx = this.ctx;
    const c = ctx;
    c.clearRect(0, 0, this.size, this.size);
    
    // Background
    c.fillStyle = 'rgba(0,0,0,0.7)';
    c.fillRect(0, 0, this.size, this.size);
    
    // Map bounds
    const half = CONFIG.WORLD_SIZE / 2;
    const scale = this.size / (CONFIG.WORLD_SIZE + 40);
    
    // Draw roads
    c.strokeStyle = '#444';
    c.lineWidth = 2;
    for (let i = 0; i < 15; i++) {
      for (let j = 0; j < 15; j++) {
        const x = (j - 7.5) * 30 * scale;
        const z = (i - 7.5) * 30 * scale;
        c.strokeRect(x, z, CONFIG.ROAD_WIDTH * scale * 3, 30 * scale * 3);
      }
    }
    
    // Draw buildings (simple rectangles)
    c.fillStyle = '#3d5a80';
    world.buildings.forEach(b => {
      if (b.geometry && b.geometry.parameters) {
        const x = b.position.x * scale;
        const z = b.position.z * scale;
        const w = b.geometry.parameters.width || b.geometry.parameters[0] || 6;
        const d = b.geometry.parameters.height || b.geometry.parameters[2] || 6;
        c.fillRect(x - w * scale / 2, z - d * scale / 2, w * scale, d * scale);
      }
    });
    
    // Draw player
    const px = player.position.x * scale + this.size / 2;
    const pz = player.position.z * scale + this.size / 2;
    c.fillStyle = '#e74c3c';
    c.beginPath();
    c.arc(px, pz, 5, 0, Math.PI * 2);
    c.fill();
    
    // Draw cars
    c.fillStyle = '#9b59b6';
    world.cars.forEach(car => {
      const cx = car.position.x * scale + this.size / 2;
      const cz = car.position.z * scale + this.size / 2;
      c.fillRect(cx - 3, cz - 3, 6, 6);
    });
    
    // Draw wanted level
    c.font = '10px Arial';
    c.fillStyle = '#fff';
    c.fillText(`W: ${world.wantedLevel}`, 10, 15);
  }
};

// Update the HUD
export function updateHud() {
  // WANTED LEVEL
  const wantedEl = document.getElementById('wanted-level');
  const wantedIcon = document.getElementById('wanted-icon');
  const wantedTitle = document.getElementById('wanted-title');
  const wantedLevelVal = document.getElementById('wanted-level-val');
  const wantedDesc = document.getElementById('wanted-desc');
  
  world.wantedLevel = Math.round(world.wantedLevel);
  wantedLevelVal.textContent = world.wantedLevel;
  
  if (world.wantedLevel === 0) {
    wantedEl.style.display = 'none';
  } else if (world.wantedLevel < 5) {
    wantedEl.style.display = 'block';
    wantedIcon.textContent = '👀';
    wantedTitle.textContent = 'Wanted Level';
    wantedDesc.textContent = 'You are being watched';
  } else if (world.wantedLevel < 10) {
    wantedEl.style.display = 'block';
    wantedIcon.textContent = '🚓';
    wantedTitle.textContent = 'Police Following';
    wantedDesc.textContent = 'Police are after you!';
  } else if (world.wantedLevel < 15) {
    wantedEl.style.display = 'block';
    wantedIcon.textContent = '🚨';
    wantedTitle.textContent = 'WANTED';
    wantedDesc.textContent = 'Police will catch you!';
  } else {
    wantedEl.style.display = 'block';
    wantedIcon.textContent = '🔪';
    wantedTitle.textContent = 'WANTED NIGHTMARE';
    wantedDesc.textContent = 'You are a criminal!';
  }
  
  // MINIMAP
  minimap.draw();
}

// Show message
export function showMessage(title, body) {
  const el = document.getElementById('message');
  el.style.display = 'block';
  el.querySelector('strong').textContent = title;
  el.querySelector('div').textContent = body;
}

// Hide message
export function hideMessage() {
  document.getElementById('message').style.display = 'none';
}
