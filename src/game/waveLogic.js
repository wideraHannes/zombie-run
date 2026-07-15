import { WAVES } from './constants';

export function enemiesForWave(n) {
  if (n <= 0) return 0;
  return WAVES.baseEnemies * Math.pow(WAVES.growth, n - 1);
}

export function seedWave(state, waveNumber) {
  state.currentWave = waveNumber;
  state.enemiesToSpawnInWave = enemiesForWave(waveNumber);
  state.bossToSpawnInWave = waveNumber === WAVES.bossWave ? 1 : 0;
  state.strongToSpawnInWave =
    waveNumber % WAVES.strongEvery === 0 && waveNumber !== WAVES.bossWave ? 1 : 0;
  state.waveStatus = 'active';
  state.lastZombieSpawn = 0;
}

export function isWaveCleared(state) {
  return (
    state.enemiesToSpawnInWave === 0 &&
    state.strongToSpawnInWave === 0 &&
    state.bossToSpawnInWave === 0 &&
    state.zombies.length === 0
  );
}
