import { world } from './world.js';

let missionId = 0;

export function createMission(title, detail, status = 'pending') {
  const mission = {
    id: missionId++,
    title,
    detail,
    status,
    completed: false,
    reward: 0,
  };
  
  // Set status
  const statusEl = document.getElementById('mission');
  const titleEl = document.getElementById('mission-title');
  const detailEl = document.getElementById('mission-detail');
  const statusTextEl = document.getElementById('mission-status');
  
  if (status === 'pending') {
    statusEl.style.display = 'block';
    titleEl.textContent = title;
    detailEl.textContent = detail;
    statusTextEl.textContent = 'Status: pending';
    world.mission = mission;
  }
  
  return mission;
}

export function completeMission() {
  const mission = world.mission;
  if (mission) {
    mission.completed = true;
    mission.status = 'completed';
    world.money += mission.reward;
    updateMoney();
    showMessage(`Mission complete! +$${mission.reward}`, 'success');
  }
}

export function updateMoney() {
  document.getElementById('player-money').textContent = `💰 ${world.money}`;
  world.savedMoney = world.money;
}

// Story missions
export function startStory() {
  const startMissions = [
    { title: 'First Drive', detail: 'Learn to drive a car', reward: 50 },
    { title: 'Steal a car', detail: 'Steal a car from the lot', reward: 500 },
    { title: 'Wanted!', detail: 'Start a fight with the police', reward: 200 },
    { title: 'Hit and Run', detail: 'Drive away after stealing a car', reward: 1000 },
    { title: 'The Score', detail: 'Complete all missions for the score', reward: 2000 },
  ];
  
  startMissions.forEach((m, i) => {
    setTimeout(() => {
      createMission(m.title, m.detail, 'pending');
      setTimeout(() => {
        completeMission();
      }, 3000 + i * 2000);
    }, i * 5000);
  });
}
