import { Target, Crosshair, Zap, Flame } from 'lucide-react';
import { WEAPONS } from '../game/constants';

const ICONS = { pistol: Target, shotgun: Crosshair, smg: Zap, rocket: Flame };

export default function WeaponBar({ current, inventory = [current.id], onSelect }) {
  const owned = inventory
    .map((id) => WEAPONS.find((w) => w.id === id))
    .filter(Boolean);
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 hud-card rounded-xl px-3 py-2">
      {owned.map((w, i) => {
        const Icon = ICONS[w.id] ?? Target;
        const active = current.id === w.id;
        return (
          <button
            key={w.id}
            onClick={() => onSelect(i)}
            className={`relative flex flex-col items-center gap-1 rounded-lg px-3 py-2 min-w-[68px] transition ${
              active
                ? 'bg-slate-800 border border-neon-green/60 shadow-[0_0_15px_rgba(57,255,20,0.4)]'
                : 'bg-slate-800/40 border border-transparent hover:border-slate-600'
            }`}
          >
            <Icon size={20} style={{ color: w.color }} />
            <span className="text-[10px] uppercase text-slate-300">{w.name}</span>
            <span className="absolute top-1 right-1 arcade text-[8px] text-slate-500">{i + 1}</span>
          </button>
        );
      })}
    </div>
  );
}
