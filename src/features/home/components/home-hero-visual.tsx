"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import type { HomeHeroConfig } from "@/features/home/config/home.config";
import type { HomeScene } from "@/features/home/lib/home-scene";
import { pickHomeScene } from "@/features/home/lib/home-scene";

const subscribeToHydration = () => () => {};
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

type HomeHeroVisualProps = {
  visual: HomeHeroConfig["visual"];
  sceneSeed: number;
};

export function HomeHeroVisual({ visual, sceneSeed }: HomeHeroVisualProps) {
  const { resolvedTheme } = useTheme();
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const scenes: readonly HomeScene[] =
    hydrated && resolvedTheme === "dark" ? visual.dark : visual.light;
  const scene = pickHomeScene(scenes, sceneSeed);

  return (
    <div className="relative flex h-full w-full items-end justify-center lg:justify-end">
      <Image
        key={scene.imageUrl}
        src={scene.imageUrl}
        alt={scene.imageAlt}
        width={1600}
        height={1000}
        priority
        sizes="(min-width: 1280px) 960px, (min-width: 1024px) 80vw, (min-width: 640px) 108vw, 114vw"
        className="pointer-events-none relative block h-auto w-full max-w-none select-none object-contain object-bottom drop-shadow-[0_24px_36px_rgba(53,63,82,0.14)]"
      />
    </div>
  );
}
