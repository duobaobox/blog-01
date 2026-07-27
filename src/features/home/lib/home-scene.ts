export type HomeScene = {
  imageUrl: string;
  imageAlt: string;
};

export function pickHomeScene<T extends HomeScene>(
  scenes: readonly T[],
  seed: number,
): T {
  if (scenes.length === 0) {
    throw new Error("主页场景列表不能为空");
  }

  const normalizedSeed = Math.min(Math.max(seed, 0), 0.9999999999999999);
  return scenes[Math.floor(normalizedSeed * scenes.length)];
}
