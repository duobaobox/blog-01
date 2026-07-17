import assert from "node:assert/strict";
import test from "node:test";
import {
  createLatestTaskCoordinator,
  getPostSaveIntentPriority,
} from "./post-save-coordinator";

function createDeferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((nextResolve) => {
    resolve = nextResolve;
  });

  return { promise, resolve };
}

test("save coordinator executes at most one task at a time and keeps the latest pending task", async () => {
  const coordinator = createLatestTaskCoordinator();
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
  assert.equal(await second, "third");
  assert.equal(await third, "third");
  assert.deepEqual(executed, ["first", "third"]);
  assert.equal(maxConcurrent, 1);
  assert.equal(coordinator.isBusy(), false);
});

test("higher-priority publish task is not replaced by a later autosave", async () => {
  const coordinator = createLatestTaskCoordinator();
  const firstGate = createDeferred();
  const executed: string[] = [];

  const first = coordinator.run(async () => {
    executed.push("active");
    await firstGate.promise;
    return "active";
  });
  const publish = coordinator.run(
    async () => {
      executed.push("publish");
      return "publish";
    },
    getPostSaveIntentPriority("publish"),
  );
  const autosave = coordinator.run(
    async () => {
      executed.push("autosave");
      return "autosave";
    },
    getPostSaveIntentPriority("autosave"),
  );

  firstGate.resolve();

  await first;
  assert.equal(await publish, "publish");
  assert.equal(await autosave, "publish");
  assert.deepEqual(executed, ["active", "publish"]);
});

test("a failed task releases the channel for the next save", async () => {
  const coordinator = createLatestTaskCoordinator();
  const failure = coordinator.run(async () => {
    throw new Error("save failed");
  });
  const success = coordinator.run(async () => "saved");

  await assert.rejects(failure, /save failed/);
  assert.equal(await success, "saved");
  assert.equal(coordinator.isBusy(), false);
});
