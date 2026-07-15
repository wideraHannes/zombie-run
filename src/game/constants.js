export const WORLD = { width: 960, height: 600 };

export const POOLS = {
  enemies: 256,
  bullets: 512,
  particles: 1024,
  explosions: 64,
  powerUps: 32,
};

export const HUD_SYNC_INTERVAL = 100;

export const PLAYER = {
  radius: 16,
  maxHealth: 100,
  baseSpeed: 240,
};

export const ZOMBIE = {
  radius: 18,
  baseSpeed: 70,
  baseHealth: 30,
  contactDamage: 12,
  strongHpMul: 3,
  strongScoreMul: 3,
  strongRadiusMul: 1.35,
  bossHpMul: 9,
  bossScoreMul: 9,
  bossRadiusMul: 2.2,
  bossSpeedMul: 0.65,
};

export const WAVES = {
  baseEnemies: 4,
  growth: 2,
  betweenMs: 10_000,
  strongEvery: 3,
  bossWave: 10,
  spawnIntervalMs: 400,
};

export const POWERUP = {
  radius: 14,
  types: ['health', 'speed', 'damage', 'ammo'],
};

export const WEAPONS = [
  {
    id: 'pistol',
    name: 'Pistol',
    capacity: 36,
    reloadTime: 1200,
    fireRate: 260,
    damage: 14,
    pellets: 1,
    spread: 0,
    speed: 620,
    radius: 4,
    type: 'bullet',
    color: '#faff00',
    perLevel: {
      pierceEvery: 2,
      levelUpText: '+1 pierce every 2 levels',
    },
  },
  {
    id: 'shotgun',
    name: 'Shotgun',
    capacity: 18,
    reloadTime: 1800,
    fireRate: 650,
    damage: 9,
    pellets: 6,
    spread: Math.PI / 9,
    speed: 520,
    radius: 4,
    type: 'bullet',
    color: '#ffa500',
    perLevel: {
      pelletsPerLevel: 1,
      spreadMul: 0.9,
      levelUpText: '+1 pellet, tighter spread',
    },
  },
  {
    id: 'smg',
    name: 'SMG',
    capacity: 90,
    reloadTime: 1600,
    fireRate: 90,
    damage: 8,
    pellets: 1,
    spread: Math.PI / 30,
    speed: 700,
    radius: 3,
    type: 'bullet',
    color: '#00e5ff',
    perLevel: {
      fireRateMul: 0.9,
      spreadMul: 0.92,
      levelUpText: 'Faster fire, tighter spread',
    },
  },
  {
    id: 'rocket',
    name: 'Rocket Launcher',
    capacity: 9,
    reloadTime: 2400,
    fireRate: 900,
    damage: 45,
    pellets: 1,
    spread: 0,
    speed: 380,
    radius: 8,
    type: 'rocket',
    explosionRadius: 80,
    color: '#ff2bd6',
    perLevel: {
      explosionRadiusPerLevel: 15,
      capacityBumpLevels: [3, 5],
      levelUpText: 'Bigger blast, +1 mag at L3 & L5',
    },
  },
];

export const WEAPON_PROGRESSION = {
  maxLevel: 5,
  damageGrowth: 1.15,
  xpPerLevel: [12, 20, 32, 48],
  xpPerKill: {
    normal: 1,
    strong: 3,
    boss: 12,
  },
};

export const COLORS = {
  bgGrid: 'rgba(148,163,184,0.06)',
  player: '#39ff14',
  playerRing: '#00e5ff',
  zombie: '#84cc16',
  zombieDark: '#365314',
  bullet: '#faff00',
  rocket: '#ff2bd6',
  blood: '#dc2626',
  powerup: {
    health: '#ef4444',
    speed: '#00e5ff',
    damage: '#f59e0b',
    ammo: '#a78bfa',
  },
};
