import { useCallback, useEffect, useRef, useState } from 'react';
import { COLORS, PLAYER, POOLS, WEAPONS, WORLD, WAVES } from './constants';
import { clamp } from './math';
import { updateBullets, drawBullets } from './entities/bullets';
import {
  spawnZombie,
  updateZombiesMovementAndContact,
  drawZombies,
} from './entities/zombies';
import { resolveBulletZombieCollisions } from './entities/collision';
import { spawnParticles, updateParticles, drawParticles } from './entities/particles';
import { updateExplosions, drawExplosions } from './entities/explosions';
import { spawnPowerUp, updatePowerUps, drawPowerUps } from './entities/powerups';
import { enemiesForWave, seedWave, isWaveCleared } from './waveLogic';
import { maybeSpawnWeaponPickup, checkPickupContact } from './weaponPickup';
import { drawHeldWeapon } from './drawHeldWeapon';
import { playShot, playReload, playPickup, setMuted, isMuted } from './sound';
import {
  initWeaponProgression,
  effectiveStats,
  levelProgress,
} from './weaponProgression';

const STARTER_WEAPON_ID = 'pistol';

function starterInventory() {
  return [STARTER_WEAPON_ID];
}

function initPlayer() {
  const inv = starterInventory();
  const startIdx = WEAPONS.findIndex((w) => w.id === inv[0]);
  return {
    x: WORLD.width / 2,
    y: WORLD.height / 2,
    angle: 0,
    radius: PLAYER.radius,
    speed: PLAYER.baseSpeed,
    health: PLAYER.maxHealth,
    inventory: inv,
    weaponIndex: startIdx,
    ammo: WEAPONS[startIdx].capacity,
    lastFire: 0,
    reloadEnd: 0,
    speedBoostEnd: 0,
    damageBoostEnd: 0,
    invulnUntil: 0,
  };
}

function initState() {
  return {
    player: initPlayer(),
    bullets: [],
    zombies: [],
    powerUps: [],
    weaponPickups: [],
    particles: [],
    explosions: [],
    keys: {},
    mouse: { x: WORLD.width / 2, y: WORLD.height / 2, down: false },
    lastZombieSpawn: 0,
    lastPowerUpSpawn: 0,
    currentWave: 1,
    enemiesToSpawnInWave: enemiesForWave(1),
    strongToSpawnInWave: 0,
    bossToSpawnInWave: 0,
    waveStatus: 'active',
    betweenWavesUntil: 0,
    kills: 0,
    score: 0,
    startTime: 0,
    lastTime: 0,
    shake: 0,
    weaponProgression: initWeaponProgression(),
  };
}

function currentEffectiveStats(state) {
  const w = WEAPONS[state.player.weaponIndex];
  const level = state.weaponProgression?.[w.id]?.level ?? 1;
  return { weapon: w, level, stats: effectiveStats(w, level) };
}

export function useGameEngine(canvasRef) {
  const stateRef = useRef(initState());

  const [hud, setHud] = useState({
    health: PLAYER.maxHealth,
    ammo: WEAPONS[0].capacity,
    capacity: WEAPONS[0].capacity,
    weapon: WEAPONS[0],
    reloading: 0,
    score: 0,
    wave: 1,
    kills: 0,
    speedBoost: 0,
    damageBoost: 0,
    inventory: [WEAPONS[0].id],
    waveStatus: 'active',
    betweenWavesRemainingMs: 0,
  });

  const [status, setStatus] = useState('menu');
  const rafRef = useRef(0);

  if (typeof window !== 'undefined') {
    window.__game = { stateRef, status, hud };
  }

  const applyPowerUp = (type) => {
    const s = stateRef.current;
    const now = performance.now();
    switch (type) {
      case 'health':
        s.player.health = Math.min(PLAYER.maxHealth, s.player.health + 35);
        break;
      case 'speed':
        s.player.speedBoostEnd = now + 6000;
        break;
      case 'damage':
        s.player.damageBoostEnd = now + 6000;
        break;
      case 'ammo':
        s.player.ammo = currentEffectiveStats(s).stats.capacity;
        s.player.reloadEnd = 0;
        break;
      default: break;
    }
  };

  const switchWeapon = useCallback((idx) => {
    const s = stateRef.current;
    const inv = s.player.inventory;
    if (!inv || inv.length <= 1) return;
    const currentId = WEAPONS[s.player.weaponIndex].id;
    const currentSlot = inv.indexOf(currentId);
    let nextId;
    if (typeof idx === 'number') {
      if (idx < 0 || idx >= inv.length) return;
      nextId = inv[idx];
    } else {
      nextId = inv[(currentSlot + 1) % inv.length];
    }
    const nextIndex = WEAPONS.findIndex((w) => w.id === nextId);
    if (nextIndex < 0 || nextIndex === s.player.weaponIndex) return;
    s.player.weaponIndex = nextIndex;
    const nextW = WEAPONS[nextIndex];
    const nextLevel = s.weaponProgression?.[nextW.id]?.level ?? 1;
    s.player.ammo = effectiveStats(nextW, nextLevel).capacity;
    s.player.reloadEnd = 0;
    s.player.lastFire = 0;
  }, []);

  const reload = useCallback(() => {
    const s = stateRef.current;
    const { stats } = currentEffectiveStats(s);
    if (s.player.ammo === stats.capacity) return;
    if (performance.now() < s.player.reloadEnd) return;
    s.player.reloadEnd = performance.now() + stats.reloadTime;
    playReload();
  }, []);

  const fire = () => {
    const s = stateRef.current;
    const p = s.player;
    const { weapon: w, stats } = currentEffectiveStats(s);
    const now = performance.now();
    if (now < p.reloadEnd) return;
    if (p.ammo <= 0) {
      const wasReloading = p.reloadEnd !== 0;
      p.reloadEnd = now + stats.reloadTime;
      if (!wasReloading) playReload();
      return;
    }
    if (now - p.lastFire < stats.fireRate) return;
    p.lastFire = now;
    p.ammo--;
    playShot();
    const base = Math.atan2(s.mouse.y - p.y, s.mouse.x - p.x);
    const dmgMul = now < p.damageBoostEnd ? 1.6 : 1;
    for (let i = 0; i < stats.pellets; i++) {
      if (s.bullets.length >= POOLS.bullets) continue;
      const a = base + (Math.random() - 0.5) * stats.spread * 2;
      s.bullets.push({
        x: p.x + Math.cos(a) * (p.radius + 4),
        y: p.y + Math.sin(a) * (p.radius + 4),
        vx: Math.cos(a) * stats.speed,
        vy: Math.sin(a) * stats.speed,
        radius: stats.radius,
        damage: stats.damage * dmgMul,
        type: w.type,
        color: w.color,
        explosionRadius: w.type === 'rocket' ? stats.explosionRadius : 0,
        weaponId: w.id,
        pierce: stats.pierce,
        hitZombies: stats.pierce > 0 ? new Set() : null,
        born: now,
      });
    }
    spawnParticles(s, p.x + Math.cos(base) * p.radius, p.y + Math.sin(base) * p.radius, w.color, 4, 120);
    s.shake = Math.max(s.shake, w.type === 'rocket' ? 8 : 2);
  };

  const gameOver = () => {
    setStatus('over');
    setHud((h) => ({ ...h, score: stateRef.current.score }));
  };

  const update = (dt) => {
    const s = stateRef.current;
    const now = performance.now();
    const p = s.player;

    let mx = 0, my = 0;
    if (s.keys.KeyW || s.keys.ArrowUp) my -= 1;
    if (s.keys.KeyS || s.keys.ArrowDown) my += 1;
    if (s.keys.KeyA || s.keys.ArrowLeft) mx -= 1;
    if (s.keys.KeyD || s.keys.ArrowRight) mx += 1;
    if (mx || my) {
      const l = Math.hypot(mx, my);
      mx /= l; my /= l;
      const sp = p.speed * (now < p.speedBoostEnd ? 1.6 : 1);
      p.x = clamp(p.x + mx * sp * dt, p.radius, WORLD.width - p.radius);
      p.y = clamp(p.y + my * sp * dt, p.radius, WORLD.height - p.radius);
    }
    p.angle = Math.atan2(s.mouse.y - p.y, s.mouse.x - p.x);

    if (s.mouse.down) fire();

    updateBullets(s, dt);
    if (s.waveStatus === 'active') {
      updateZombiesMovementAndContact(s, dt, now, gameOver);
      if (s.player.health <= 0) return;
      resolveBulletZombieCollisions(s, now);
    }
    updatePowerUps(s, applyPowerUp);
    checkPickupContact(s);
    updateParticles(s, dt, now);
    updateExplosions(s, now);

    if (s.waveStatus === 'active') {
      const totalRemaining = s.enemiesToSpawnInWave + s.strongToSpawnInWave + s.bossToSpawnInWave;
      const interval = Math.max(180, WAVES.spawnIntervalMs - s.currentWave * 15);
      if (totalRemaining > 0 && now - s.lastZombieSpawn > interval) {
        s.lastZombieSpawn = now;
        if (s.bossToSpawnInWave > 0) {
          spawnZombie(s, 'boss');
          s.bossToSpawnInWave--;
        } else if (s.strongToSpawnInWave > 0 && Math.random() < 0.25) {
          spawnZombie(s, 'strong');
          s.strongToSpawnInWave--;
        } else if (s.enemiesToSpawnInWave > 0) {
          spawnZombie(s, 'normal');
          s.enemiesToSpawnInWave--;
        } else if (s.strongToSpawnInWave > 0) {
          spawnZombie(s, 'strong');
          s.strongToSpawnInWave--;
        }
      }

      if (isWaveCleared(s)) {
        s.waveStatus = 'between';
        s.betweenWavesUntil = now + WAVES.betweenMs;
      }

      if (now - s.lastPowerUpSpawn > 9000) {
        s.lastPowerUpSpawn = now;
        spawnPowerUp(s);
      }
    } else if (s.waveStatus === 'between') {
      if (now >= s.betweenWavesUntil) {
        seedWave(s, s.currentWave + 1);
      }
    }

    maybeSpawnWeaponPickup(s);

    const { stats: curStats } = currentEffectiveStats(s);
    if (p.ammo === 0 && now >= p.reloadEnd) {
      const wasReloading = p.reloadEnd !== 0;
      p.reloadEnd = now + curStats.reloadTime;
      if (!wasReloading) playReload();
    }
    if (p.reloadEnd && now >= p.reloadEnd) {
      if (p.ammo === 0) p.ammo = curStats.capacity;
      p.reloadEnd = 0;
    }

    if (s.shake > 0) s.shake = Math.max(0, s.shake - dt * 40);
  };

  const drawWeaponPickups = (ctx, s, now) => {
    s.weaponPickups.forEach((pu) => {
      const w = WEAPONS.find((x) => x.id === pu.weaponId);
      const pulse = 1 + Math.sin(now / 220) * 0.12;
      ctx.save();
      ctx.translate(pu.x, pu.y);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.arc(0, 0, pu.radius * pulse + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = w ? w.color : '#fff';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 16; ctx.shadowColor = w ? w.color : '#fff';
      ctx.beginPath();
      ctx.arc(0, 0, pu.radius * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = w ? w.color : '#fff';
      ctx.font = 'bold 11px Rubik';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText((w?.name || '?').slice(0, 3).toUpperCase(), 0, 1);
      ctx.restore();
    });
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = stateRef.current;
    const now = performance.now();

    ctx.save();
    const sx = (Math.random() - 0.5) * s.shake;
    const sy = (Math.random() - 0.5) * s.shake;
    ctx.translate(sx, sy);

    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    ctx.strokeStyle = COLORS.bgGrid;
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < WORLD.width; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD.height); ctx.stroke();
    }
    for (let y = 0; y < WORLD.height; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD.width, y); ctx.stroke();
    }

    const grd = ctx.createRadialGradient(WORLD.width / 2, WORLD.height / 2, 200, WORLD.width / 2, WORLD.height / 2, 600);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    drawPowerUps(ctx, s, now);
    drawWeaponPickups(ctx, s, now);
    drawBullets(ctx, s);
    drawZombies(ctx, s);

    const p = s.player;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(0, p.radius + 4, p.radius * 0.9, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.rotate(p.angle);
    drawHeldWeapon(ctx, p, WEAPONS[p.weaponIndex]);
    ctx.rotate(-p.angle);
    const inv = now < p.invulnUntil;
    ctx.fillStyle = inv ? '#ef4444' : COLORS.player;
    ctx.shadowBlur = 20; ctx.shadowColor = inv ? '#ef4444' : COLORS.player;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0b1220';
    ctx.beginPath();
    ctx.arc(0, -2, p.radius * 0.7, Math.PI, 0);
    ctx.fill();
    if (now < p.speedBoostEnd) {
      ctx.strokeStyle = COLORS.playerRing;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius + 6 + Math.sin(now / 100) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (now < p.damageBoostEnd) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius + 10 + Math.sin(now / 100) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    drawExplosions(ctx, s, now);
    drawParticles(ctx, s, now);

    ctx.strokeStyle = 'rgba(57,255,20,0.8)';
    ctx.lineWidth = 1.5;
    const m = s.mouse;
    ctx.beginPath(); ctx.arc(m.x, m.y, 10, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(m.x - 16, m.y); ctx.lineTo(m.x - 6, m.y);
    ctx.moveTo(m.x + 6, m.y); ctx.lineTo(m.x + 16, m.y);
    ctx.moveTo(m.x, m.y - 16); ctx.lineTo(m.x, m.y - 6);
    ctx.moveTo(m.x, m.y + 6); ctx.lineTo(m.x, m.y + 16);
    ctx.stroke();

    ctx.restore();
  };

  const syncHud = () => {
    const s = stateRef.current;
    const { weapon: w, stats } = currentEffectiveStats(s);
    const now = performance.now();
    const reloading = s.player.reloadEnd > now
      ? clamp(1 - (s.player.reloadEnd - now) / stats.reloadTime, 0, 1)
      : 0;
    setHud({
      health: Math.max(0, Math.floor(s.player.health)),
      ammo: s.player.ammo,
      capacity: stats.capacity,
      weapon: w,
      reloading,
      score: s.score,
      wave: s.currentWave,
      kills: s.kills,
      speedBoost: s.player.speedBoostEnd > now ? (s.player.speedBoostEnd - now) / 6000 : 0,
      damageBoost: s.player.damageBoostEnd > now ? (s.player.damageBoostEnd - now) / 6000 : 0,
      inventory: s.player.inventory.slice(),
      waveStatus: s.waveStatus,
      betweenWavesRemainingMs: Math.max(0, s.betweenWavesUntil - now),
      weaponLevel: levelProgress(s.weaponProgression, w.id),
    });
  };

  const loop = (ts) => {
    const s = stateRef.current;
    const dt = Math.min(0.05, (ts - s.lastTime) / 1000 || 0);
    s.lastTime = ts;
    if (status === 'playing') {
      update(dt);
    }
    draw();
    syncHud();
    rafRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onKeyDown = (e) => {
      stateRef.current.keys[e.code] = true;
      if (e.code === 'KeyR') reload();
      if (e.code === 'KeyQ') switchWeapon();
      if (['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(e.code)) {
        switchWeapon(parseInt(e.code.slice(-1), 10) - 1);
      }
      if (e.code === 'KeyM') setMuted(!isMuted());
      if (e.code === 'Space') { e.preventDefault(); }
    };
    const onKeyUp = (e) => { stateRef.current.keys[e.code] = false; };
    const relPos = (e) => {
      const r = canvas.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * WORLD.width;
      const y = ((e.clientY - r.top) / r.height) * WORLD.height;
      return { x, y };
    };
    const onMove = (e) => { const p = relPos(e); const m = stateRef.current.mouse; m.x = p.x; m.y = p.y; };
    const onDown = (e) => { const p = relPos(e); const m = stateRef.current.mouse; m.x = p.x; m.y = p.y; m.down = true; };
    const onUp = () => { stateRef.current.mouse.down = false; };
    const onContext = (e) => e.preventDefault();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    canvas.addEventListener('contextmenu', onContext);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('contextmenu', onContext);
    };
  }, [canvasRef, reload, switchWeapon]);

  const start = useCallback(() => {
    const fresh = initState();
    fresh.lastZombieSpawn = 0;
    fresh.lastPowerUpSpawn = performance.now();
    fresh.startTime = performance.now();
    fresh.lastTime = performance.now();
    seedWave(fresh, 1);
    stateRef.current = fresh;
    setStatus('playing');
  }, []);

  const pause = useCallback(() => setStatus((s) => (s === 'playing' ? 'paused' : s === 'paused' ? 'playing' : s)), []);
  const restart = useCallback(() => start(), [start]);

  return { hud, status, start, pause, restart, switchWeapon, reload, setStatus };
}
