import { describe, it, expect, beforeEach } from 'vitest';
import { spawnZombie } from '../entities/zombies';
import { spawnParticles } from '../entities/particles';
import { POOLS } from '../constants';

function makeState() {
  return {
    zombies: [],
    particles: [],
    currentWave: 1,
    player: { x: 480, y: 300 },
  };
}

describe('pool caps', () => {
  it('spawnZombie 300 times caps at POOLS.enemies (256)', () => {
    const state = makeState();
    for (let i = 0; i < 300; i++) {
      spawnZombie(state, 'normal');
    }
    expect(state.zombies.length).toBe(POOLS.enemies);
  });

  it('spawnParticles with count=2000 caps at POOLS.particles (1024)', () => {
    const state = makeState();
    spawnParticles(state, 100, 100, '#ff0000', 2000, 100);
    expect(state.particles.length).toBeLessThanOrEqual(POOLS.particles);
  });
});
