import { POOLS } from '../constants';

export function spawnParticles(state, x, y, color, count = 8, speed = 180) {
  const overflow = state.particles.length + count - POOLS.particles;
  if (overflow > 0) state.particles.splice(0, overflow);
  const actualCount = Math.min(count, POOLS.particles);
  const now = performance.now();
  for (let i = 0; i < actualCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = speed * (0.4 + Math.random() * 0.8);
    state.particles.push({
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      life: 500 + Math.random() * 300,
      born: now,
      color,
      size: 2 + Math.random() * 2,
    });
  }
}

export function updateParticles(state, dt, now) {
  const arr = state.particles;
  for (let i = arr.length - 1; i >= 0; i--) {
    const pt = arr[i];
    const age = now - pt.born;
    if (age > pt.life) { arr.splice(i, 1); continue; }
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vx *= 0.94;
    pt.vy *= 0.94;
  }
}

export function drawParticles(ctx, state, now) {
  state.particles.forEach((pt) => {
    const age = now - pt.born;
    const alpha = 1 - age / pt.life;
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
    ctx.globalAlpha = 1;
  });
}
