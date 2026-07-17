export type PostSaveCoordinator = {
  run<T>(task: () => Promise<T>): Promise<T>;
  isBusy(): boolean;
};

export function createPostSaveCoordinator(): PostSaveCoordinator {
  let queuedTasks = 0;
  let tail: Promise<void> = Promise.resolve();

  return {
    run<T>(task: () => Promise<T>) {
      queuedTasks += 1;

      const result = tail.then(task, task);
      tail = result.then(
        () => undefined,
        () => undefined,
      );

      return result.finally(() => {
        queuedTasks -= 1;
      });
    },

    isBusy() {
      return queuedTasks > 0;
    },
  };
}
