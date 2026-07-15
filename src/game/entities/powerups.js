import { COLORS, POWERUP, WORLD } from '../constants';
import { dist, rand } from '../math';
import { spawnParticles } from './particles';

export function spawnPowerUp(state) {
  const type = POWERUP.types[Math.floor(Math.random() * POWERUP.types.length)];
  state.powerUps.push({
    x: rand(POWERUP.radius + 20, WORLD.width - POWERUP.radius - 20),
    y: rand(POWERUP.radius + 20, WORLD.height - POWERUP.radius - 20),
    radius: POWERUP.radius,
    type,
    spawn: performance.now(),
  });
}

export function updatePowerUps(state, applyPowerUp) {
  const p = state.player;
  const arr = state.powerUps;
  for (let i = arr.length - 1; i >= 0; i--) {
    const pu = arr[i];
    if (dist(pu.x, pu.y, p.x, p.y) < pu.radius + p.radius) {
      applyPowerUp(pu.type);
      spawnParticles(state, pu.x, pu.y, COLORS.powerup[pu.type], 12, 220);
      arr.splice(i, 1);
    }
  }
}

export function drawPowerUps(ctx, state, now) {
  state.powerUps.forEach((pu) => {
    const pulse = 1 + Math.sin(now / 200) * 0.1;
    ctx.save();
    ctx.translate(pu.x, pu.y);
    ctx.fillStyle = COLORS.powerup[pu.type];
    ctx.shadowBlur = 20; ctx.shadowColor = COLORS.powerup[pu.type];
    ctx.beginPath();
    ctx.arc(0, 0, pu.radius * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0b1220';
    ctx.font = 'bold 12px Rubik';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const label = { health: '+', speed: 'S', damage: 'D', ammo: 'A' }[pu.type];
    ctx.fillText(label, 0, 1);
    ctx.restore();
  });
}
