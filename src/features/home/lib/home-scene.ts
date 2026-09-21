export type HomeScene = {
  imageUrl: string;
  imageAlt: string;
};

function assertSceneList(length: number): void {
  if (length === 0) {
    throw new Error("主页场景列表不能为空");
  }
}

/** 从当前主题分组里随机挑一个下标。 */
export function pickRandomSceneIndex(length: number): number {
  assertSceneList(length);
  return Math.floor(Math.random() * length);
}

/**
 * 在当前主题分组里随机挑一个不同于 currentIndex 的下标。
 *
 * 保证「切换主题后场景一定变化」：分组只有两个场景时，二选一的随机会有一半概率
 * 挑回原图，用户看到的就是没反应。
 */
export function pickNextSceneIndex(
  length: number,
  currentIndex: number,
): number {
  assertSceneList(length);

  if (length === 1) {
    return 0;
  }

  const offset = 1 + Math.floor(Math.random() * (length - 1));
  return (currentIndex + offset) % length;
}
