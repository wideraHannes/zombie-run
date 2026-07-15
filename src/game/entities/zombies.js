import { COLORS, WORLD, ZOMBIE } from '../constants';
import { dist, rand } from '../math';
import { spawnParticles } from './particles';

export function spawnZombie(state, variant = 'normal') {
  const edge = Math.floor(Math.random() * 4);
  let radiusMul = 1;
  let hpMul = 1;
  let speedMul = 1;
  if (variant === 'strong') {
    hpMul = ZOMBIE.strongHpMul;
    radiusMul = ZOMBIE.strongRadiusMul;
  } else if (variant === 'boss') {
    hpMul = ZOMBIE.bossHpMul;
    radiusMul = ZOMBIE.bossRadiusMul;
    speedMul = ZOMBIE.bossSpeedMul;
  }
  const r = ZOMBIE.radius * radiusMul;
  let x, y;
  if (edge === 0) { x = rand(0, WORLD.width); y = -r; }
  else if (edge === 1) { x = WORLD.width + r; y = rand(0, WORLD.height); }
  else if (edge === 2) { x = rand(0, WORLD.width); y = WORLD.height + r; }
  else { x = -r; y = rand(0, WORLD.height); }
  const waveMul = 1 + (state.currentWave - 1) * 0.15;
  const hp = ZOMBIE.baseHealth * waveMul * hpMul;
  state.zombies.push({
    x, y,
    radius: r,
    speed: ZOMBIE.baseSpeed * waveMul * speedMul + rand(-10, 20),
    health: hp,
    maxHealth: hp,
    wobble: Math.random() * Math.PI * 2,
    variant,
  });
}

export function updateZombiesMovementAndContact(state, dt, now, onGameOver) {
  const p = state.player;
  for (let zi = state.zombies.length - 1; zi >= 0; zi--) {
    const z = state.zombies[zi];
    z.wobble += dt * 6;
    const a = Math.atan2(p.y - z.y, p.x - z.x);
    z.x += Math.cos(a) * z.speed * dt;
    z.y += Math.sin(a) * z.speed * dt;

    if (dist(z.x, z.y, p.x, p.y) < z.radius + p.radius && now > p.invulnUntil) {
      p.health -= ZOMBIE.contactDamage;
      p.invulnUntil = now + 500;
      state.shake = Math.max(state.shake, 10);
      spawnParticles(state, p.x, p.y, COLORS.blood, 10, 200);
      if (p.health <= 0) { p.health = 0; onGameOver(); return; }
    }
  }
}

export function drawZombies(ctx, state) {
  state.zombies.forEach((z) => {
    const wob = Math.sin(z.wobble) * 2;
    ctx.save();
    ctx.translate(z.x, z.y + wob);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, z.radius + 4, z.radius * 0.9, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    const fill = z.variant === 'boss' ? '#a855f7'
      : z.variant === 'strong' ? '#f97316'
      : COLORS.zombie;
    const glow = z.variant === 'boss' ? 'rgba(168,85,247,0.7)'
      : z.variant === 'strong' ? 'rgba(249,115,22,0.6)'
      : 'rgba(132,204,22,0.5)';
    ctx.fillStyle = fill;
    ctx.shadowBlur = z.variant === 'normal' ? 10 : 18; ctx.shadowColor = glow;
    ctx.beginPath();
    ctx.arc(0, 0, z.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = COLORS.zombieDark;
    ctx.beginPath(); ctx.arc(-5, -3, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5, -3, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(-5, -3, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5, -3, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = COLORS.zombieDark;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-6, 6); ctx.lineTo(6, 6); ctx.stroke();
    if (z.health < z.maxHealth) {
      const w = z.radius * 2;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-w / 2, -z.radius - 10, w, 4);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-w / 2, -z.radius - 10, w * (z.health / z.maxHealth), 4);
    }
    ctx.restore();
  });
}
