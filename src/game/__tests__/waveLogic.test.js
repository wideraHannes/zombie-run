import { describe, expect, it } from 'vitest';
import { WAVES, ZOMBIE } from '../constants';
import { enemiesForWave, seedWave, isWaveCleared } from '../waveLogic';
import { spawnZombie } from '../entities/zombies';

function makeState() {
  return {
    zombies: [],
    currentWave: 1,
    enemiesToSpawnInWave: 0,
    strongToSpawnInWave: 0,
    bossToSpawnInWave: 0,
    waveStatus: 'active',
    lastZombieSpawn: 0,
  };
}

describe('US-0004 wave state machine', () => {
  it('spawns baseEnemies * growth^(N-1) enemies per wave', () => {
    expect(enemiesForWave(1)).toBe(WAVES.baseEnemies);
    expect(enemiesForWave(2)).toBe(WAVES.baseEnemies * WAVES.growth);
    expect(enemiesForWave(3)).toBe(WAVES.baseEnemies * WAVES.growth * WAVES.growth);
  });

  it('seedWave 1 queues only normals; wave 2 doubles the count', () => {
    const s = makeState();
    seedWave(s, 1);
    expect(s.enemiesToSpawnInWave).toBe(WAVES.baseEnemies);
    expect(s.strongToSpawnInWave).toBe(0);
    expect(s.bossToSpawnInWave).toBe(0);
    expect(s.waveStatus).toBe('active');

    seedWave(s, 2);
    expect(s.enemiesToSpawnInWave).toBe(enemiesForWave(2));
  });

  it('wave is cleared only when all spawn queues AND alive zombies are 0', () => {
    const s = makeState();
    seedWave(s, 1);
    expect(isWaveCleared(s)).toBe(false);

    // simulate spawning all enemies
    s.enemiesToSpawnInWave = 0;
    s.zombies.push({}, {});
    expect(isWaveCleared(s)).toBe(false);

    // simulate killing them all
    s.zombies.length = 0;
    expect(isWaveCleared(s)).toBe(true);
  });
});

describe('US-0006 strong enemy variant', () => {
  it('wave 3 seeds exactly 1 strong; wave 4 seeds zero', () => {
    const s = makeState();
    seedWave(s, 3);
    expect(s.strongToSpawnInWave).toBe(1);
    expect(s.enemiesToSpawnInWave).toBe(enemiesForWave(3));

    seedWave(s, 4);
    expect(s.strongToSpawnInWave).toBe(0);
  });

  it('strong zombie has 3x the HP of a normal at the same wave', () => {
    const s = { ...makeState(), currentWave: 3 };
    spawnZombie(s, 'normal');
    spawnZombie(s, 'strong');
    const [normal, strong] = s.zombies;
    expect(strong.maxHealth).toBeCloseTo(normal.maxHealth * ZOMBIE.strongHpMul, 5);
  });
});

describe('US-0007 boss on wave 10', () => {
  it('seedWave(10) queues exactly 1 boss and zero strong', () => {
    const s = makeState();
    seedWave(s, 10);
    expect(s.bossToSpawnInWave).toBe(1);
    expect(s.strongToSpawnInWave).toBe(0);
    expect(s.enemiesToSpawnInWave).toBe(enemiesForWave(10));
  });

  it('boss has 9x the HP of a normal at the same wave', () => {
    const s = { ...makeState(), currentWave: 10 };
    spawnZombie(s, 'normal');
    spawnZombie(s, 'boss');
    const [normal, boss] = s.zombies;
    expect(boss.maxHealth).toBeCloseTo(normal.maxHealth * ZOMBIE.bossHpMul, 5);
  });

  it('wave 10 stays uncleared while any variant remains', () => {
    const s = makeState();
    seedWave(s, 10);
    // exhaust queues but leave a boss alive on the field
    s.enemiesToSpawnInWave = 0;
    s.strongToSpawnInWave = 0;
    s.bossToSpawnInWave = 0;
    s.zombies.push({ variant: 'boss' });
    expect(isWaveCleared(s)).toBe(false);
    s.zombies.length = 0;
    expect(isWaveCleared(s)).toBe(true);
  });
});

describe('SLICE-1 enemy cap', () => {
  it('enemiesForWave(n) never exceeds 80 for waves 1–20', () => {
    for (let n = 1; n <= 20; n++) {
      expect(enemiesForWave(n)).toBeLessThanOrEqual(80);
    }
  });

  it('enemiesForWave(1) returns 4', () => {
    expect(enemiesForWave(1)).toBe(4);
  });
});
