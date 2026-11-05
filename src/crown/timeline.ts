export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const ease = (a: number, b: number, p: number) => {
  const t = clamp01((p - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const noteWindows = [
  [0.43, 0.465, 0.55, 0.585],
  [0.6, 0.63, 0.705, 0.735],
  [0.75, 0.78, 0.855, 0.89],
] as const;
export function timeline(p: number) {
  p = clamp01(p);
  const turn = ease(0.11, 0.23, p),
    open = ease(0.235, 0.275, p) * (1 - ease(0.955, 0.995, p)),
    travel = ease(0.275, 0.315, p) * (1 - ease(0.93, 0.955, p));
  const cloud = ease(0.335, 0.37, p) * (1 - ease(0.875, 0.95, p));
  const notes = noteWindows.map(
    ([a, b, c, d]) => ease(a, b, p) * (1 - ease(c, d, p)),
  );
  return {
    p,
    turn,
    yaw: 0.35 * turn * (1 - ease(0.94, 1, p)),
    open,
    travel,
    press: 0.08 * ease(0.319, 0.345, p) * (1 - ease(0.354, 0.384, p)),
    cloud,
    cloudTime: 1 - Math.exp(-8 * clamp01((p - 0.335) / 0.6)),
    approach: ease(0.405, 0.47, p) * (1 - ease(0.9, 0.98, p)),
    stageShift: ease(0.16, 0.325, p) * (1 - ease(0.925, 0.995, p)),
    notes,
    hero: 1 - ease(0.1, 0.205, p),
    ending: ease(0.925, 0.975, p),
  };
}
export function seededCloud(count: number) {
  let seed = 7821;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  return Array.from({ length: count }, () => ({
    distance: 0.18 + random() * 2.65,
    spreadY: (random() - 0.5) * 0.58,
    spreadZ: (random() - 0.5) * 0.52,
    delay: random() * 0.065,
    size: 0.08 + Math.pow(random(), 2) * 0.24,
    shade: random(),
  }));
}
