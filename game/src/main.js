import * as THREE from '../../vendor/three.min.js';
import { CONFIG } from './config.js';
import { world, init as createCity, player } from './world.js';
import { player as playerCtrl, camera } from './player.js';
import { renderer, minimap, updateHud, showMessage } from './render.js';
import { createMission, completeMission, updateMoney, startStory } from './missions.js';
import { init as initEntities, update as updateEntities } from './entities.js';

function init() {
  renderer.init();
  minimap.init();
  createCity();
  playerCtrl.init();
  camera.target.copy(playerCtrl.position);
  camera.position.copy(playerCtrl.position);
  camera.position.y += 10;
  startStory();
  setupInput();
  window.addEventListener('resize', () => {
    renderer.resize();
    minimap.canvas.width = minimap.size;
    minimap.canvas.height = minimap.size;
  });
  
  let lastTime = 0;
  function loop(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;
    playerCtrl.update(dt);
    updateEntities(dt);
    camera.update(playerCtrl);
    updateHud();
    renderer.update(dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

function setupInput() {
  window.addEventListener('keydown', (e) => {
    playerCtrl.keys[e.code] = true;
    if (e.code === CONFIG.KEY_SPACE) playerCtrl.keys.space = true;
    if (e.code === CONFIG.KEY_C) {
      playerCtrl.onFoot = false;
      playerCtrl.currentCar = null;
      document.getElementById('car-name').textContent = 'None';
    }
    if (e.code === CONFIG.KEY_R) {
      showMessage('R - Rev engine', 'Monster truck activated!');
    }
    if (e.code === CONFIG.KEY_F5) {
      saveGame();
      showMessage('Saved', 'Your progress has been saved.');
    }
  });
  window.addEventListener('keyup', (e) => {
    playerCtrl.keys[e.code] = false;
    if (e.code === CONFIG.KEY_SPACE) playerCtrl.keys.space = false;
  });
  document.addEventListener('click', () => {
    document.getElementById('message').style.display = 'none';
  });
}

function saveGame() {
  world.saveData = {
    position: { ...playerCtrl.position },
    money: world.money,
    wantedLevel: world.wantedLevel,
    mission: world.mission,
    storyProgress: world.storyProgress,
  };
  try {
    localStorage.setItem('gta6-01-save', JSON.stringify(world.saveData));
  } catch (e) {}
}

function loadGame() {
  try {
    const data = localStorage.getItem('gta6-01-save');
    if (data) {
      const save = JSON.parse(data);
      playerCtrl.position.set(save.position.x, save.position.y, save.position.z);
      playerCtrl.savedMoney = save.money;
      world.money = save.money;
      world.wantedLevel = save.wantedLevel;
      world.mission = save.mission;
      updateMoney();
    }
  } catch (e) {}
}

try { loadGame(); } catch (e) {}
init();
