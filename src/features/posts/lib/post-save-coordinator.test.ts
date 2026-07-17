import assert from "node:assert/strict";
import test from "node:test";
import { createPostSaveCoordinator } from "./post-save-coordinator";

function createDeferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((nextResolve) => {
    resolve = nextResolve;
  });

  return { promise, resolve };
}

test("save coordinator executes tasks strictly one at a time in call order", async () => {
  const coordinator = createPostSaveCoordinator();
  const firstGate = createDeferred();
  const executed: string[] = [];
  let concurrent = 0;
  let maxConcurrent = 0;

  const runTask = async (name: string, gate?: Promise<void>) => {
    concurrent += 1;
    maxConcurrent = Math.max(maxConcurrent, concurrent);
    executed.push(name);
    await gate;
    concurrent -= 1;
    return name;
  };

  const first = coordinator.run(() => runTask("first", firstGate.promise));
  const second = coordinator.run(() => runTask("second"));
  const third = coordinator.run(() => runTask("third"));

  assert.equal(coordinator.isBusy(), true);
  firstGate.resolve();

  assert.equal(await first, "first");
  assert.equal(await second, "second");
  assert.equal(await third, "third");
  assert.deepEqual(executed, ["first", "second", "third"]);
  assert.equal(maxConcurrent, 1);
  assert.equal(coordinator.isBusy(), false);
});

test("a failed task releases the channel for the next save", async () => {
  const coordinator = createPostSaveCoordinator();
  const failure = coordinator.run(async () => {
    throw new Error("save failed");
  });
  const success = coordinator.run(async () => "saved");

  await assert.rejects(failure, /save failed/);
  assert.equal(await success, "saved");
  assert.equal(coordinator.isBusy(), false);
});
