import assert from "node:assert/strict";
import test from "node:test";
import { pickNextSceneIndex, pickRandomSceneIndex } from "./home-scene";

const SCENE_COUNT = 3;

test("随机选场景始终返回有效下标并覆盖全部场景", () => {
  const seen = new Set<number>();

  for (let attempt = 0; attempt < 300; attempt += 1) {
    const index = pickRandomSceneIndex(SCENE_COUNT);

    assert.ok(Number.isInteger(index) && index >= 0 && index < SCENE_COUNT);
    seen.add(index);
  }

  // 300 次采样漏掉任一场景的概率可以忽略，用来防止实现退化成固定值。
  assert.equal(seen.size, SCENE_COUNT);
});

test("空场景列表给出明确错误", () => {
  assert.throws(() => pickRandomSceneIndex(0), /场景列表不能为空/);
  assert.throws(() => pickNextSceneIndex(0, 0), /场景列表不能为空/);
});

test("切换主题时新场景一定不同于当前这张", () => {
  for (const currentIndex of [0, 1, 2]) {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const nextIndex = pickNextSceneIndex(SCENE_COUNT, currentIndex);

      assert.notEqual(nextIndex, currentIndex);
      assert.ok(nextIndex >= 0 && nextIndex < SCENE_COUNT);
    }
  }
});

test("分组只有一个场景时保持原图", () => {
  assert.equal(pickNextSceneIndex(1, 0), 0);
});
