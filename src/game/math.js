export const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
export const clamp = (v, mn, mx) => Math.min(Math.max(v, mn), mx);
export const rand = (a, b) => a + Math.random() * (b - a);
