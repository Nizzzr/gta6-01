// Input handler
import { CONFIG } from './config.js';
import { player } from './world.js';

export const input = {
  keys: {},
  
  init() {
    window.addEventListener('keydown', (e) => {
      input.keys[e.code] = true;
      if (e.code === CONFIG.KEY_SPACE) input.keys.space = true;
      if (e.code === CONFIG.KEY_C) {
        player.onFoot = false;
        document.getElementById('car-name').textContent = 'None';
      }
    });
    window.addEventListener('keyup', (e) => {
      input.keys[e.code] = false;
      if (e.code === CONFIG.KEY_SPACE) input.keys.space = false;
    });
  }
};
