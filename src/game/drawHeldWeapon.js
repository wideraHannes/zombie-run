// Pure helper — draws the currently held gun body + muzzle tip at the player.
// Caller is expected to have already translated/rotated into player-local space
// (matching the previous inline draw in useGameEngine.drawPlayer).
export function drawHeldWeapon(ctx, player, weapon) {
  ctx.fillStyle = weapon.color;
  ctx.fillRect(player.radius - 2, -3, 16, 6);
  ctx.fillStyle = '#e5e7eb';
  ctx.fillRect(player.radius + 12, -2, 3, 4);
}
