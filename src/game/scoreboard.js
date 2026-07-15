export const STORAGE_KEY = 'yasin:scores';
export const NAME_KEY = 'yasin:lastName';
export const MAX_ENTRIES = 10;
export const MAX_NAME_LEN = 16;

function normalizeName(raw) {
  const trimmed = String(raw ?? '').trim();
  if (trimmed.length === 0) return 'Anonymous';
  return trimmed.slice(0, MAX_NAME_LEN);
}

export function loadScores() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e) => e && typeof e.name === 'string' && Number.isFinite(e.score),
    );
  } catch {
    return [];
  }
}

export function saveScore({ name, score }) {
  const entry = {
    name: normalizeName(name),
    score: Number(score) | 0,
    date: new Date().toISOString(),
  };
  const next = [...loadScores(), entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  localStorage.setItem(NAME_KEY, entry.name);
  return entry;
}

export function clearScores() {
  localStorage.removeItem(STORAGE_KEY);
}

export function loadLastName() {
  try {
    return localStorage.getItem(NAME_KEY) || '';
  } catch {
    return '';
  }
}

export function isHighScore(score) {
  const scores = loadScores();
  if (scores.length < MAX_ENTRIES) return score > 0;
  return score > scores[scores.length - 1].score;
}
