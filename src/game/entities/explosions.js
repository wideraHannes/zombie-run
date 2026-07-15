export function updateExplosions(state, now) {
  const arr = state.explosions;
  for (let i = arr.length - 1; i >= 0; i--) {
    const e = arr[i];
    const age = now - e.born;
    if (age > e.dur) arr.splice(i, 1);
    else e.radius = (age / e.dur) * e.max;
  }
}

export function drawExplosions(ctx, state, now) {
  state.explosions.forEach((e) => {
    const t = (now - e.born) / e.dur;
    const alpha = 1 - t;
    const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.radius);
    grad.addColorStop(0, `rgba(255,220,120,${alpha})`);
    grad.addColorStop(0.5, `rgba(255,120,20,${alpha * 0.8})`);
    grad.addColorStop(1, 'rgba(255,60,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}
