/** Small deterministic PRNG (mulberry32) so mock data is identical on every boot. */
export function createRng(seed: number) {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };

  return {
    next,
    /** Integer in [min, max], inclusive. */
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)] as T,
    chance: (probability: number) => next() < probability,
    /** `count` distinct items in random order. */
    sample<T>(items: readonly T[], count: number): T[] {
      const pool = [...items];
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [pool[i], pool[j]] = [pool[j] as T, pool[i] as T];
      }
      return pool.slice(0, count);
    },
  };
}

export type Rng = ReturnType<typeof createRng>;

/** Stable 32-bit hash of a string, handy for per-entity seeds. */
export function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
