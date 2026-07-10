import { useCallback, useRef } from "react";

export async function runOnce(
  lock: { current: boolean },
  fn: () => void | Promise<void>,
): Promise<void> {
  if (lock.current) {
    return;
  }

  lock.current = true;

  try {
    await fn();
  } finally {
    lock.current = false;
  }
}

export function useSubmitLock<T extends (...args: never[]) => void | Promise<void>>(
  fn: T,
  isPending = false,
): T {
  const lockRef = useRef(false);

  return useCallback(
    ((...args: never[]) => {
      if (lockRef.current || isPending) {
        return undefined;
      }

      return runOnce(lockRef, () => fn(...args));
    }) as T,
    [fn, isPending],
  );
}
