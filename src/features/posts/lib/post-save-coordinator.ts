import type { PostSaveIntent } from "@/features/posts/lib/post-save-plan";

const SAVE_INTENT_PRIORITY: Record<PostSaveIntent, number> = {
  autosave: 1,
  manual: 2,
  navigation: 3,
  publish: 4,
};

type TaskWaiter = {
  resolve(value: unknown): void;
  reject(reason: unknown): void;
};

type PendingTask = {
  run(): Promise<unknown>;
  priority: number;
  waiters: TaskWaiter[];
};

export type LatestTaskCoordinator = {
  run<T>(task: () => Promise<T>, priority?: number): Promise<T>;
  isBusy(): boolean;
};

export function getPostSaveIntentPriority(intent: PostSaveIntent) {
  return SAVE_INTENT_PRIORITY[intent];
}

export function createLatestTaskCoordinator(): LatestTaskCoordinator {
  let active = false;
  let pending: PendingTask | null = null;

  async function execute(task: PendingTask): Promise<void> {
    try {
      const result = await task.run();
      task.waiters.forEach((waiter) => waiter.resolve(result));
    } catch (error) {
      task.waiters.forEach((waiter) => waiter.reject(error));
    } finally {
      const nextTask = pending;
      pending = null;

      if (nextTask) {
        void execute(nextTask);
      } else {
        active = false;
      }
    }
  }

  return {
    run<T>(task: () => Promise<T>, priority = 0) {
      return new Promise<T>((resolve, reject) => {
        const waiter: TaskWaiter = {
          resolve(value) {
            resolve(value as T);
          },
          reject,
        };

        if (!active) {
          active = true;
          void execute({
            run: task,
            priority,
            waiters: [waiter],
          });
          return;
        }

        if (!pending) {
          pending = {
            run: task,
            priority,
            waiters: [waiter],
          };
          return;
        }

        pending.waiters.push(waiter);

        if (priority >= pending.priority) {
          pending.run = task;
          pending.priority = priority;
        }
      });
    },

    isBusy() {
      return active;
    },
  };
}
