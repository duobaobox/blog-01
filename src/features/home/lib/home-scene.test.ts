import assert from "node:assert/strict";
import test from "node:test";
import { pickHomeScene } from "./home-scene";

const scenes = [
  { imageUrl: "/first.png", imageAlt: "first" },
  { imageUrl: "/second.png", imageAlt: "second" },
  { imageUrl: "/third.png", imageAlt: "third" },
] as const;

test("按随机值选择主页场景", () => {
  assert.equal(pickHomeScene(scenes, () => 0), scenes[0]);
  assert.equal(pickHomeScene(scenes, () => 0.5), scenes[1]);
  assert.equal(pickHomeScene(scenes, () => 0.999), scenes[2]);
});

test("随机值越界时仍返回有效场景", () => {
  assert.equal(pickHomeScene(scenes, () => -1), scenes[0]);
  assert.equal(pickHomeScene(scenes, () => 2), scenes[2]);
});

test("空场景列表给出明确错误", () => {
  assert.throws(() => pickHomeScene([], () => 0), /场景列表不能为空/);
});
