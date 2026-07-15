import { useEffect, useMemo, useState } from 'react';
import { loadScores, saveScore, loadLastName, isHighScore, MAX_NAME_LEN } from '../game/scoreboard';

export function TopScoresList({ limit = 10 }) {
  const [scores, setScores] = useState([]);
  useEffect(() => {
    setScores(loadScores());
  }, []);
  if (scores.length === 0) {
    return <div className="text-slate-400 text-sm italic">No scores yet — be the first.</div>;
  }
  return (
    <ol className="text-left space-y-1">
      {scores.slice(0, limit).map((s, i) => (
        <li key={i} className="flex justify-between gap-4 bg-slate-800/50 border border-slate-700/60 rounded px-3 py-1.5">
          <span className="tabular-nums text-slate-400 w-6">{i + 1}.</span>
          <span className="flex-1 text-slate-200 truncate">{s.name}</span>
          <span className="tabular-nums text-neon-yellow">{s.score}</span>
        </li>
      ))}
    </ol>
  );
}

export function ScoreSubmit({ score, onSubmitted }) {
  const initial = useMemo(() => loadLastName(), []);
  const [name, setName] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const qualifies = isHighScore(score);

  const submit = (e) => {
    e?.preventDefault?.();
    saveScore({ name, score });
    setSubmitted(true);
    onSubmitted?.();
  };

  if (!qualifies) return null;
  if (submitted) return <div className="text-neon-green text-sm">Score saved.</div>;

  return (
    <form onSubmit={submit} className="flex gap-2 items-center justify-center">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={MAX_NAME_LEN}
        placeholder="Your name"
        className="bg-slate-800/70 border border-slate-600 rounded px-3 py-1.5 text-slate-100 text-sm"
        autoFocus
      />
      <button type="submit" className="btn-neon text-sm">Save Score</button>
    </form>
  );
}
