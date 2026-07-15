import { WORLD } from '../constants';

export function updateBullets(state, dt) {
  const arr = state.bullets;
  for (let i = arr.length - 1; i >= 0; i--) {
    const b = arr[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.x < -20 || b.x > WORLD.width + 20 || b.y < -20 || b.y > WORLD.height + 20) {
      arr.splice(i, 1);
    }
  }
}

export function drawBullets(ctx, state) {
  state.bullets.forEach((b) => {
    ctx.save();
    ctx.fillStyle = b.color;
    ctx.shadowBlur = 12; ctx.shadowColor = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = b.color;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = b.radius;
    ctx.beginPath();
    ctx.moveTo(b.x - b.vx * 0.02, b.y - b.vy * 0.02);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
  });
}
