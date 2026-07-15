import { Play, Pause, RotateCcw, Gamepad2, Skull, Trophy } from 'lucide-react';
import { TopScoresList, ScoreSubmit } from './Scoreboard';

export function MenuOverlay({ onStart }) {
  return (
    <Overlay>
      <div className="text-center max-w-lg">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-neon-green/10 border border-neon-green/40 animate-pulseGlow">
            <Skull className="text-neon-green" size={56} />
          </div>
        </div>
        <h1 className="arcade text-3xl md:text-4xl text-neon-green mb-3">NEON ZOMBIES</h1>
        <p className="text-slate-300 mb-6">
          Survive the endless waves. Grab power-ups. Rack up combos.
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm text-slate-300 mb-8 text-left">
          <Kbd label="Move" keys="WASD / Arrows" />
          <Kbd label="Aim" keys="Mouse" />
          <Kbd label="Fire" keys="Left Click (hold)" />
          <Kbd label="Reload" keys="R" />
          <Kbd label="Switch Weapon" keys="Q or 1-4" />
          <Kbd label="Pause" keys="Esc / P" />
        </div>
        <button className="btn-neon inline-flex items-center gap-2" onClick={onStart}>
          <Play size={18} /> Start Game
        </button>
        <div className="mt-8">
          <div className="flex items-center justify-center gap-2 mb-3 text-slate-300">
            <Trophy size={16} className="text-neon-yellow" />
            <span className="arcade text-xs">TOP SCORES</span>
          </div>
          <TopScoresList limit={5} />
        </div>
      </div>
    </Overlay>
  );
}

export function PauseOverlay({ onResume, onRestart }) {
  return (
    <Overlay>
      <div className="text-center">
        <Gamepad2 className="mx-auto text-neon-blue mb-3" size={48} />
        <h2 className="arcade text-2xl text-slate-100 mb-6">PAUSED</h2>
        <div className="flex gap-3 justify-center">
          <button className="btn-neon inline-flex items-center gap-2" onClick={onResume}>
            <Play size={16} /> Resume
          </button>
          <button className="btn-ghost inline-flex items-center gap-2" onClick={onRestart}>
            <RotateCcw size={16} /> Restart
          </button>
        </div>
      </div>
    </Overlay>
  );
}

export function GameOverOverlay({ score, wave, kills, onRestart }) {
  return (
    <Overlay>
      <div className="text-center">
        <div className="mx-auto mb-3 p-4 rounded-full bg-red-500/10 border border-red-500/40">
          <Skull className="text-red-500" size={48} />
        </div>
        <h2 className="arcade text-3xl text-red-500 mb-2">GAME OVER</h2>
        <p className="text-slate-300 mb-6">The horde got you… this time.</p>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatBig label="Score" value={score} color="text-neon-yellow" />
          <StatBig label="Wave" value={wave} color="text-neon-green" />
          <StatBig label="Kills" value={kills} color="text-neon-pink" />
        </div>
        <div className="mb-6">
          <ScoreSubmit score={score} />
        </div>
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 mb-2 text-slate-300">
            <Trophy size={16} className="text-neon-yellow" />
            <span className="arcade text-xs">TOP SCORES</span>
          </div>
          <TopScoresList limit={5} />
        </div>
        <button className="btn-neon inline-flex items-center gap-2" onClick={onRestart}>
          <RotateCcw size={16} /> Try Again
        </button>
      </div>
    </Overlay>
  );
}

export function WaveBanner({ currentWave, remainingMs }) {
  const seconds = Math.ceil(remainingMs / 1000);
  return (
    <div className="absolute inset-x-0 top-24 flex justify-center z-10 pointer-events-none">
      <div className="hud-card rounded-2xl px-8 py-5 text-center animate-pulseGlow">
        <div className="arcade text-2xl md:text-3xl text-neon-green mb-2">
          Nächste Runde {currentWave + 1}!
        </div>
        <div className="text-slate-300 text-lg tabular-nums">{seconds}</div>
      </div>
    </div>
  );
}

function Overlay({ children }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-20 bg-slate-950/85 backdrop-blur-sm">
      <div className="hud-card rounded-2xl p-8 md:p-10">{children}</div>
    </div>
  );
}

function Kbd({ label, keys }) {
  return (
    <div className="flex justify-between items-center gap-3 bg-slate-800/50 border border-slate-700/60 rounded px-3 py-2">
      <span className="text-slate-400 text-xs uppercase">{label}</span>
      <span className="arcade text-[10px] text-neon-green">{keys}</span>
    </div>
  );
}

function StatBig({ label, value, color }) {
  return (
    <div className="bg-slate-800/60 rounded-lg py-3">
      <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">{label}</div>
    </div>
  );
}
