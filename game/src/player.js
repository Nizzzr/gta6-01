import * as THREE from '../../vendor/three.min.js';
import { CONFIG } from './config.js';
import { world } from './world.js';

export const player = {
  position: new THREE.Vector3(0, 0.5, 0),
  velocity: new THREE.Vector3(0, 0, 0),
  speed: CONFIG.PLAYER_SPEED,
  onFoot: true,
  steer: 0,
  currentCar: null,
  health: CONFIG.MAX_HEALTH,
  score: 0,
  wantedLevel: 0,
  wantedStage: 0,
  savedMoney: 0,
  
  keys: {
    w: false, a: false, s: false, d: false,
    up: false, down: false, left: false, right: false,
    space: false, shift: false, e: false, c: false, r: false,
  },
  
  init() {
    this.position.set(0, 1.6, 0);
    this.velocity.set(0, 0, 0);
    this.health = CONFIG.MAX_HEALTH;
    this.savedMoney = 0;
  },
  
  update(dt) {
    const keys = this.keys;
    const isDriving = this.onFoot === false;
    const speedMultiplier = isDriving ? CONFIG.CAR_SPEED : CONFIG.PLAYER_SPEED;
    
    // Horizontal movement
    let moveX = 0;
    let moveZ = 0;
    
    if (keys.w || keys.up) moveZ = -1;
    if (keys.s || keys.down) moveZ = 1;
    if (keys.a || keys.left) moveX = -1;
    if (keys.d || keys.right) moveX = 1;
    
    // Normalize diagonal
    if (moveX !== 0 && moveZ !== 0) {
      moveX *= 0.707;
      moveZ *= 0.707;
    }
    
    // Apply movement
    if (moveX !== 0 || moveZ !== 0) {
      if (isDriving) {
        // Car physics
        const speed = Math.sqrt(moveX * moveX + moveZ * moveZ);
        const maxSpeed = CONFIG.CAR_SPEED * (keys.shift ? CONFIG.BOOST_MULTIPLIER : 1);
        const targetSpeed = speed * maxSpeed;
        
        // Smooth speed
        const currentSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
        const acceleration = 10 * dt;
        const deceleration = 8 * dt;
        
        if (currentSpeed < targetSpeed) {
          const direction = new THREE.Vector3(moveX, 0, moveZ).normalize();
          this.velocity.x += direction.x * acceleration;
          this.velocity.z += direction.z * acceleration;
        } else {
          this.velocity.x *= (1 - deceleration);
          this.velocity.z *= (1 - deceleration);
        }
        
        const maxVel = maxSpeed;
        const velMag = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
        if (velMag > maxVel) {
          this.velocity.x = (this.velocity.x / velMag) * maxVel;
          this.velocity.z = (this.velocity.z / velMag) * maxVel;
        }
        
        // Steer
        this.steer += (moveX - this.steer) * 2 * dt;
        this.steer = Math.max(-1, Math.min(1, this.steer));
      } else {
        // Walk
        this.position.x += moveX * speedMultiplier * dt;
        this.position.z += moveZ * speedMultiplier * dt;
      }
    } else {
      if (isDriving) {
        // Brake
        this.velocity.x *= 0.95;
        this.velocity.z *= 0.95;
      } else {
        // Walking friction in air
      }
    }
    
    // Apply gravity (for walking, feet on ground)
    if (this.onFoot) {
      this.position.y = Math.max(1.6, this.position.y);
    } else {
      // Car ground height (stays on ground)
      this.position.y = 0.5;
    }
    
    // Car rotation
    if (isDriving && Math.abs(this.velocity.x) > 0.1) {
      const rotationSpeed = 2;
      this.rotation.y += this.velocity.x * rotationSpeed * dt * 0.1;
    }
    
    // Clamp position
    const half = CONFIG.WORLD_SIZE / 2 - 10;
    this.position.x = Math.max(-half, Math.min(half, this.position.x));
    this.position.z = Math.max(-half, Math.min(half, this.position.z));
    
    // Update HUD
    if (isDriving) {
      const speedKmH = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z) * 3.6;
      document.getElementById('player-vel').textContent = `Speed: ${Math.round(speedKmH)} km/h`;
      document.getElementById('car-name').textContent = this.currentCar ? this.currentCar.name : 'None';
    } else {
      document.getElementById('player-vel').textContent = 'Speed: 0 km/h';
      document.getElementById('car-name').textContent = 'None';
    }
    
    // WANTED SYSTEM
    if (world.wantedLevel > 0) {
      world.wantedShot += dt;
      if (world.wantedShot > 0.5) {
        world.wantedShot = 0;
        const police = world.police;
        police.forEach(p => {
          const dx = p.position.x - this.position.x;
          const dz = p.position.z - this.position.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < 30) {
            // Tile the player
            this.health -= 2;
            if (this.health <= 0) {
              world.state = CONFIG.STATE_GAME_OVER;
              showMessage('GAME OVER: You were caught!', 'Police caught you. Try again.');
            }
            addMessage('💥 Police tamed you!', 'Red');
          }
        });
      }
    }
  },
  
  setCar(car) {
    this.currentCar = car;
    this.onFoot = false;
    document.getElementById('car-name').textContent = car.name;
  },
  
  getSpeed() {
    return Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
  }
};

// Camera
export const camera = {
  position: new THREE.Vector3(0, 10, 0),
  target: new THREE.Vector3(0, 0.5, 0),
  distance: 10,
  height: 10,
  offsetX: 0,
  offsetZ: 0,
  isLookingAtPlayer: true,
  
  update(player) {
    if (this.isLookingAtPlayer) {
      this.position.x = player.position.x + this.offsetX;
      this.position.y = player.position.y + this.height;
      this.position.z = player.position.z + this.offsetZ;
      this.target.copy(player.position);
    }
  }
};
