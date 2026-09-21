"use client";

import Image from "next/image";
import { useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import type { HomeHeroConfig } from "@/features/home/config/home.config";
import {
  pickNextSceneIndex,
  pickRandomSceneIndex,
  type HomeScene,
} from "@/features/home/lib/home-scene";

type HomeHeroVisualProps = {
  visual: HomeHeroConfig["visual"];
};

type ThemeKey = "light" | "dark";

type SceneIndices = Record<ThemeKey, number>;

const HERO_IMAGE_SIZES =
  "(min-width: 1280px) 960px, (min-width: 1024px) 80vw, (min-width: 640px) 108vw, 114vw";

const HERO_IMAGE_CLASS =
  "pointer-events-none relative block h-auto w-full max-w-none select-none object-contain object-bottom drop-shadow-[0_24px_36px_rgba(53,63,82,0.14)]";

const subscribeToHydration = () => () => {};

function useHasHydrated() {
  return useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
}

function HeroSceneImage({
  scene,
  themeClassName,
}: {
  scene: HomeScene;
  themeClassName: string;
}) {
  return (
    <Image
      src={scene.imageUrl}
      alt={scene.imageAlt}
      width={1600}
      height={1000}
      sizes={HERO_IMAGE_SIZES}
      className={`${HERO_IMAGE_CLASS} ${themeClassName}`}
    />
  );
}

/**
 * 只在水合完成后挂载，因此可以用惰性初始值直接抽随机场景：
 * 服务端不会渲染这里，不存在水合不一致。
 */
function HeroScenes({ visual }: { visual: HomeHeroConfig["visual"] }) {
  const [indices, setIndices] = useState<SceneIndices>(() => ({
    light: pickRandomSceneIndex(visual.light.length),
    dark: pickRandomSceneIndex(visual.dark.length),
  }));
  const [seenTheme, setSeenTheme] = useState<ThemeKey | null>(null);
  const { resolvedTheme } = useTheme();

  const activeTheme: ThemeKey | null =
    resolvedTheme === "light" || resolvedTheme === "dark"
      ? resolvedTheme
      : null;

  if (activeTheme !== seenTheme) {
    // 渲染期同步：React 会在提交前立刻重渲染，不会多出一帧。主题从 undefined
    // 变成实际值只是状态就绪，只有 seenTheme 已有值才代表用户切换了主题。
    setSeenTheme(activeTheme);

    if (seenTheme !== null && activeTheme !== null) {
      if (activeTheme === "dark") {
        setIndices((current) => ({
          ...current,
          dark: pickNextSceneIndex(visual.dark.length, current.dark),
        }));
      } else {
        setIndices((current) => ({
          ...current,
          light: pickNextSceneIndex(visual.light.length, current.light),
        }));
      }
    }
  }

  return (
    <div className="animate-in fade-in-0 relative flex h-full w-full items-end justify-center duration-500 lg:justify-end">
      <HeroSceneImage
        scene={visual.light[indices.light]}
        themeClassName="dark:hidden"
      />
      <HeroSceneImage
        scene={visual.dark[indices.dark]}
        themeClassName="hidden dark:block"
      />
    </div>
  );
}

/**
 * 场景图只在水合完成后渲染：首页是带 `revalidate = 300` 的静态缓存页面，
 * 服务端随机做不到「每次进入都不同」，固定输出又会造成水合不一致。
 *
 * 水合前渲染与场景图同尺寸的透明版位，图片出现时页面不会跳动；水合后由
 * `HeroScenes` 随机抽签（浅色、深色各一张），用户切换明暗主题时再从新主题
 * 分组里随机换一张不同的。
 *
 * 这里刻意不使用 next/image 的 `priority`：它会给隐藏的那张也输出
 * `<link rel="preload">`，深色访客于是既预加载了用不上的浅色场景，又要等到水合
 * 之后才拿到真正的场景。现在隐藏的那张是 `display:none` 且保持默认懒加载，
 * 浏览器不会请求它——每个访客只下载一张图。
 */
export function HomeHeroVisual({ visual }: HomeHeroVisualProps) {
  const hasHydrated = useHasHydrated();

  if (!hasHydrated) {
    return <div aria-hidden="true" className="aspect-[8/5] w-full" />;
  }

  return <HeroScenes visual={visual} />;
}
