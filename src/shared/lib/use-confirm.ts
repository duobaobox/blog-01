"use client";

import { useState, useRef, useCallback } from "react";

/**
 * Promise-based confirm dialog hook.
 * Usage:
 *   const { open, confirm, handleConfirm, handleCancel } = useConfirm();
 *   // in async function:
 *   if (!(await confirm())) return;
 *   // in JSX:
 *   <ConfirmDialog open={open} onConfirm={handleConfirm} onOpenChange={(v) => !v && handleCancel()} />
 */
export function useConfirm() {
  const [open, setOpen] = useState(false);
  const resolveRef = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback((): Promise<boolean> => {
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  function handleConfirm() {
    setOpen(false);
    resolveRef.current?.(true);
    resolveRef.current = null;
  }

  function handleCancel() {
    setOpen(false);
    resolveRef.current?.(false);
    resolveRef.current = null;
  }

  return { open, confirm, handleConfirm, handleCancel };
}
