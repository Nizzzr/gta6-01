import * as THREE from '../../vendor/three.min.js';

import { CONFIG } from './config.js';
import { world, init: createWorld, init as initEntities, createCar, update as updateEntities } from './world.js';
import { player, camera } from './player.js';
import { renderer, minimap, updateHud, showMessage, hideMessage } from './render.js';
import { createMission, completeMission, updateMoney, startStory } from './missions.js';
import { createPedestrian } from './entities.js';

// Initialization
function init() {
  // Setup renderer
  renderer.init();
  
  // Setup minimap
  minimap.init();
  
  // Create world
  createWorld(Math.random);
  
  // Create player
  player.init();
  
  // Camera follows player
  camera.target.copy(player.position);
  camera.position.copy(player.position);
  camera.position.y += 10;
  
  // Scene setup
  const scene = new THREE.Scene();
  scene.add(renderer.scene);
  
  // Start story missions
  startStory();
  
  // Setup input
  setupInput();
  
  // Setup resize
  window.addEventListener('resize', () => {
    renderer.resize();
    minimap.canvas.width = minimap.size;
    minimap.canvas.height = minimap.size;
  });
  
  // Game loop
  let lastTime = 0;
  
  function loop(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;
    
    // Update player
    player.update(dt);
    
    // Update entities
    updateEntities(dt);
    
    // Update camera
    camera.update(player);
    
    // Update HUD
    updateHud();
    
    // Render
    renderer.update(dt);
    
    // Request next frame
    requestAnimationFrame(loop);
  }
  
  requestAnimationFrame(loop);
}

// Input setup
function setupInput() {
  window.addEventListener('keydown', (e) => {
    const key = e.code;
    player.keys[key] = true;
    
    // Handbrake
    if (key === CONFIG.KEY_SPACE) player.keys.space = true;
    
    // Mission wheel
    if (key === CONFIG.KEY_E) {
      // Open mission wheel (placeholder)
    }
    
    // Exit car
    if (key === CONFIG.KEY_C) {
      player.onFoot = true;
      player.currentCar = null;
      document.getElementById('car-name').textContent = 'None';
    }
    
    // Monster truck
    if (key === CONFIG.KEY_R) {
      // Rev engine
      showMessage('R - Rev engine', 'Monster truck activated!');
    }
    
    // Save game
    if (key === CONFIG.KEY_F5) {
      saveGame();
      showMessage('Saved', 'Your progress has been saved.');
    }
  });
  
  window.addEventListener('keyup', (e) => {
    player.keys[e.code] = false;
    if (e.code === CONFIG.KEY_SPACE) player.keys.space = false;
  });
  
  // Click to focus game
  document.addEventListener('click', () => {
    document.getElementById('message').style.display = 'none';
  });
}

// Save game
function saveGame() {
  world.saveData = {
    position: { ...player.position },
    money: world.money,
    wantedLevel: world.wantedLevel,
    mission: world.mission,
    storyProgress: world.storyProgress,
  };
  
  try {
    localStorage.setItem('gta6-01-save', JSON.stringify(world.saveData));
    showMessage('Saved', 'Your progress has been saved to this browser.');
  } catch (e) {
    showMessage('Save failed', 'Could not save to browser storage.');
  }
}

// Load game
function loadGame() {
  try {
    const data = localStorage.getItem('gta6-01-save');
    if (data) {
      const save = JSON.parse(data);
      player.position.set(save.position.x, save.position.y, save.position.z);
      player.savedMoney = save.money;
      world.money = save.money;
      world.wantedLevel = save.wantedLevel;
      world.mission = save.mission;
      updateMoney();
      showMessage('Loaded', 'Your previous progress has been loaded.');
    }
  } catch (e) {
    // No save found
  }
}

// Call loadGame on start
try {
  loadGame();
} catch (e) {
  // No save found
}

// Start the game
init();
