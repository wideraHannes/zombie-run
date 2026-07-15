import { useEffect, useRef } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { useGameEngine } from './game/useGameEngine';
import { WORLD } from './game/constants';
import HUD from './components/HUD';
import WeaponBar from './components/WeaponBar';
import { MenuOverlay, PauseOverlay, GameOverOverlay, WaveBanner } from './components/Overlays';

export default function App() {
  const canvasRef = useRef(null);
  const { hud, status, start, pause, restart, switchWeapon } = useGameEngine(canvasRef);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.code === 'Escape' || e.code === 'KeyP') && (status === 'playing' || status === 'paused')) {
        pause();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [status, pause]);

  return (
    <div className="w-screen h-screen flex items-center justify-center p-4">
      <div
        className="relative rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl"
        style={{ width: 'min(96vw, 1100px)', aspectRatio: `${WORLD.width} / ${WORLD.height}` }}
      >
        <canvas
          ref={canvasRef}
          width={WORLD.width}
          height={WORLD.height}
          className="w-full h-full block cursor-none"
        />

        {status !== 'menu' && (
          <>
            <HUD hud={hud} />
            <WeaponBar current={hud.weapon} inventory={hud.inventory} onSelect={switchWeapon} />
            {status === 'playing' && hud.waveStatus === 'between' && (
              <WaveBanner currentWave={hud.wave} remainingMs={hud.betweenWavesRemainingMs} />
            )}
            <div className="absolute top-4 right-1/2 translate-x-1/2 z-10 pointer-events-none" />
            <div className="absolute bottom-4 right-4 z-10 flex gap-2">
              <button className="btn-ghost inline-flex items-center gap-1 text-sm" onClick={pause}>
                {status === 'paused' ? <Play size={14} /> : <Pause size={14} />}
                {status === 'paused' ? 'Resume' : 'Pause'}
              </button>
              <button className="btn-ghost inline-flex items-center gap-1 text-sm" onClick={restart}>
                <RotateCcw size={14} /> Restart
              </button>
            </div>
          </>
        )}

        {status === 'menu' && <MenuOverlay onStart={start} />}
        {status === 'paused' && <PauseOverlay onResume={pause} onRestart={restart} />}
        {status === 'over' && (
          <GameOverOverlay
            score={hud.score}
            wave={hud.wave}
            kills={hud.kills}
            onRestart={restart}
          />
        )}
      </div>
    </div>
  );
}
