import { Heart, Crosshair, Trophy, Skull, Zap, Flame, Target } from 'lucide-react';

const iconFor = (id) => {
  switch (id) {
    case 'pistol': return Target;
    case 'shotgun': return Crosshair;
    case 'smg': return Zap;
    case 'rocket': return Flame;
    default: return Target;
  }
};

export default function HUD({ hud }) {
  const WeaponIcon = iconFor(hud.weapon.id);
  const healthPct = (hud.health / 100) * 100;
  const ammoPct = (hud.ammo / hud.capacity) * 100;

  return (
    <div className="absolute top-4 left-4 right-4 flex justify-between items-start gap-4 pointer-events-none z-10">
      <div className="hud-card rounded-xl px-4 py-3 flex flex-col gap-2 min-w-[240px]">
        <div className="flex items-center gap-3">
          <Heart className="text-red-500" size={20} />
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">HEALTH</span>
              <span className="text-slate-100 font-semibold">{hud.health}</span>
            </div>
            <div className="bar">
              <div
                style={{
                  width: `${healthPct}%`,
                  background: `linear-gradient(90deg, ${healthPct < 30 ? '#ef4444' : '#22c55e'}, #84cc16)`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <WeaponIcon className="text-neon-yellow" size={20} style={{ color: hud.weapon.color }} />
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 uppercase flex items-center gap-2">
                {hud.weapon.name}
                {hud.weaponLevel && (
                  <span
                    className="arcade text-[10px] px-1.5 py-0.5 rounded"
                    style={{ color: hud.weapon.color, borderColor: hud.weapon.color, border: '1px solid' }}
                    title={hud.weapon.perLevel?.levelUpText || ''}
                  >
                    L{hud.weaponLevel.level}
                  </span>
                )}
              </span>
              <span className="text-slate-100 font-semibold">
                {hud.reloading > 0 ? 'Reloading…' : `${hud.ammo}/${hud.capacity}`}
              </span>
            </div>
            <div className="bar">
              <div
                style={{
                  width: `${hud.reloading > 0 ? hud.reloading * 100 : ammoPct}%`,
                  background: hud.reloading > 0
                    ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
                    : `linear-gradient(90deg, ${hud.weapon.color}, #00e5ff)`,
                }}
              />
            </div>
            {hud.weaponLevel && hud.weaponLevel.needed > 0 && (
              <div className="mt-1">
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="text-slate-400">XP</span>
                  <span className="text-slate-400 tabular-nums">
                    {hud.weaponLevel.xp}/{hud.weaponLevel.needed}
                  </span>
                </div>
                <div className="bar h-1">
                  <div
                    style={{
                      width: `${Math.round(hud.weaponLevel.pct * 100)}%`,
                      background: `linear-gradient(90deg, ${hud.weapon.color}, #a78bfa)`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {(hud.speedBoost > 0 || hud.damageBoost > 0) && (
          <div className="flex gap-2 pt-1">
            {hud.speedBoost > 0 && (
              <div className="flex items-center gap-1 text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded">
                <Zap size={12} /> SPEED
              </div>
            )}
            {hud.damageBoost > 0 && (
              <div className="flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 px-2 py-1 rounded">
                <Flame size={12} /> DMG+
              </div>
            )}
          </div>
        )}
      </div>

      <div className="hud-card rounded-xl px-5 py-3 flex items-center gap-6">
        <Stat icon={<Trophy className="text-yellow-400" size={18} />} label="Score" value={hud.score} />
        <Stat icon={<Skull className="text-slate-300" size={18} />} label="Kills" value={hud.kills} />
        <Stat
          icon={<span className="arcade text-[10px] text-neon-green">W</span>}
          label="Wave"
          value={hud.wave}
        />
      </div>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] uppercase text-slate-400 tracking-wider">{label}</span>
        <span className="text-lg font-bold text-slate-100 tabular-nums">{value}</span>
      </div>
    </div>
  );
}
