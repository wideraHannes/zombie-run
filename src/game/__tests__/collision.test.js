import { describe, expect, it } from 'vitest';
import { resolveBulletZombieCollisions } from '../entities/collision';

function makeState() {
  return {
    zombies: [],
    bullets: [],
    explosions: [],
    particles: [],
    kills: 0,
    score: 0,
    shake: 0,
    player: {
      x: 0, y: 0, radius: 16, health: 100,
      invulnUntil: 0, damageBoostEnd: 0,
    },
  };
}

describe('US-0001 batch-kill', () => {
  it('rocket wiping out 10 clustered zombies does not throw and removes them all', () => {
    const state = makeState();
    for (let i = 0; i < 10; i++) {
      state.zombies.push({
        x: 500 + (i % 3) * 2,
        y: 300 + Math.floor(i / 3) * 2,
        radius: 18,
        speed: 70,
        health: 30,
        maxHealth: 30,
        wobble: 0,
      });
    }
    state.bullets.push({
      x: 500, y: 300, vx: 0, vy: 0,
      radius: 8, damage: 45, type: 'rocket',
      color: '#ff2bd6', explosionRadius: 80, born: 0,
    });

    expect(() => resolveBulletZombieCollisions(state, 1000)).not.toThrow();
    expect(state.kills).toBe(10);

    const alive = state.zombies.filter((z) => z && z.health > 0);
    expect(alive.length).toBe(0);

    for (const z of state.zombies) expect(z).toBeDefined();
    expect(new Set(state.zombies).size).toBe(state.zombies.length);
  });

  it('two rockets in the same frame do not throw when both hit the cluster', () => {
    const state = makeState();
    for (let i = 0; i < 10; i++) {
      state.zombies.push({
        x: 500 + (i % 3) * 2,
        y: 300 + Math.floor(i / 3) * 2,
        radius: 18, speed: 70, health: 30, maxHealth: 30, wobble: 0,
      });
    }
    for (let i = 0; i < 2; i++) {
      state.bullets.push({
        x: 500, y: 300, vx: 0, vy: 0,
        radius: 8, damage: 45, type: 'rocket',
        color: '#ff2bd6', explosionRadius: 80, born: 0,
      });
    }
    expect(() => resolveBulletZombieCollisions(state, 1000)).not.toThrow();
    expect(state.kills).toBe(10);
  });
});
