import { COLORS, POOLS, ZOMBIE } from '../constants';
import { dist } from '../math';
import { spawnParticles } from './particles';
import { creditKill, xpForKillByVariant } from '../weaponProgression';

function scoreFor(variant) {
  if (variant === 'boss') return 10 * ZOMBIE.bossScoreMul;
  if (variant === 'strong') return 10 * ZOMBIE.strongScoreMul;
  return 10;
}

function awardKill(state, zombie, weaponId) {
  state.kills++;
  state.score += scoreFor(zombie.variant);
  if (state.weaponProgression && weaponId) {
    creditKill(state.weaponProgression, weaponId, xpForKillByVariant(zombie.variant));
  }
}

// PHASE 1: buggy verbatim extraction of the bullet-vs-zombie loop from useGameEngine.js.
// The nested splice-during-iteration is intentional here — US-0001 test asserts
// it will be fixed in Phase 2 via deferred removal / pool active flags.
export function resolveBulletZombieCollisions(state, now) {
  const s = state;
  for (let zi = s.zombies.length - 1; zi >= 0; zi--) {
    const z = s.zombies[zi];
    // Guard: zombie may have been removed by a prior rocket splash this frame
    if (!z) continue;
    for (let bi = s.bullets.length - 1; bi >= 0; bi--) {
      const b = s.bullets[bi];
      if (!b) continue;
      if (b.hitZombies && b.hitZombies.has(z)) continue;
      // Guard: zombie may have been killed by a prior rocket in this bullet loop
      if (!s.zombies.includes(z)) break;
      const sumR = b.radius + z.radius;
      const dx = Math.abs(b.x - z.x);
      const dy = Math.abs(b.y - z.y);
      if (dx > sumR || dy > sumR) continue;
      if (dist(b.x, b.y, z.x, z.y) < sumR) {
        if (b.type === 'rocket') {
          if (s.explosions.length < POOLS.explosions) { s.explosions.push({ x: b.x, y: b.y, radius: 0, max: b.explosionRadius, born: now, dur: 350 }); }
          spawnParticles(s, b.x, b.y, '#ff8c00', 24, 320);
          s.shake = Math.max(s.shake, 14);
          const toKill = new Set();
          for (let k = 0; k < s.zombies.length; k++) {
            const zz = s.zombies[k];
            const splashSumR = b.explosionRadius + zz.radius;
            const sdx = Math.abs(zz.x - b.x);
            const sdy = Math.abs(zz.y - b.y);
            if (sdx > splashSumR || sdy > splashSumR) continue;
            if (dist(zz.x, zz.y, b.x, b.y) <= splashSumR) {
              zz.health -= b.damage;
              if (zz.health <= 0) {
                toKill.add(zz);
              }
            }
          }
          // Deferred removal: single backward pass, no mid-iteration splices
          for (let k = s.zombies.length - 1; k >= 0; k--) {
            const zz = s.zombies[k];
            if (toKill.has(zz)) {
              spawnParticles(s, zz.x, zz.y, COLORS.blood, 12, 220);
              s.zombies.splice(k, 1);
              // rocket splash also gets bonus multiplier (was 2.5x)
              s.kills++;
              s.score += Math.round(scoreFor(zz.variant) * 2.5);
              if (s.weaponProgression && b.weaponId) {
                creditKill(s.weaponProgression, b.weaponId, xpForKillByVariant(zz.variant));
              }
            }
          }
          s.bullets.splice(bi, 1);
          break;
        } else {
          z.health -= b.damage;
          spawnParticles(s, b.x, b.y, COLORS.blood, 5, 160);
          const killed = z.health <= 0;
          if (killed) {
            spawnParticles(s, z.x, z.y, COLORS.blood, 10, 200);
            s.zombies.splice(zi, 1);
            awardKill(s, z, b.weaponId);
          }
          if (b.pierce > 0) {
            b.pierce -= 1;
            if (b.hitZombies && !killed) b.hitZombies.add(z);
            break;
          }
          s.bullets.splice(bi, 1);
          if (killed) break;
        }
      }
    }
  }
}
