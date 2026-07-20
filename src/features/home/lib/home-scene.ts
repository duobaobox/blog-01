export type HomeScene = {
  imageUrl: string;
  imageAlt: string;
};

export function pickHomeScene<T extends HomeScene>(
  scenes: readonly T[],
  random: () => number = Math.random,
): T {
  if (scenes.length === 0) {
    throw new Error("主页场景列表不能为空");
  }

  const randomValue = Math.min(Math.max(random(), 0), 0.9999999999999999);
  return scenes[Math.floor(randomValue * scenes.length)];
}
