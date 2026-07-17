export const POST_AUTOSAVE_IDLE_MS = 5_000;
export const POST_AUTOSAVE_MAX_WAIT_MS = 30_000;

export function getPostAutosaveDelay(input: {
  now: number;
  maxWaitDeadline: number;
}) {
  const remainingMaxWait = Math.max(0, input.maxWaitDeadline - input.now);
  return Math.min(POST_AUTOSAVE_IDLE_MS, remainingMaxWait);
}
