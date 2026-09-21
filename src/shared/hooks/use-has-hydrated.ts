"use client";

import { useSyncExternalStore } from "react";

const subscribeToHydration = () => () => {};

/**
 * 是否已完成水合：服务端与水合首帧返回 false，水合完成后返回 true。
 *
 * 用于让「每次结果不同」的内容（随机数、localStorage、window 尺寸等）只在
 * 客户端渲染，避免水合不一致。不要用 `typeof window` 替代：水合发生在浏览器里，
 * window 已存在，第一次渲染仍然会对不上服务端 HTML。
 */
export function useHasHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
}
