"use client";

import Image from "next/image";
import { useMemo } from "react";
import { useTheme } from "next-themes";
import type { HomeHeroConfig } from "@/features/home/config/home.config";
import { pickHomeScene } from "@/features/home/lib/home-scene";

type HomeHeroVisualProps = {
  visual: HomeHeroConfig["visual"];
};

export function HomeHeroVisual({ visual }: HomeHeroVisualProps) {
  const { resolvedTheme } = useTheme();
  const scene = useMemo(() => {
    if (!resolvedTheme) {
      return visual.light[0];
    }

    return pickHomeScene(
      resolvedTheme === "dark" ? visual.dark : visual.light,
    );
  }, [resolvedTheme, visual]);

  return (
    <div className="relative z-10 flex min-h-[19rem] w-full min-w-0 items-end justify-center self-end overflow-visible sm:min-h-[24rem] lg:min-h-[29rem] lg:justify-end">
      <div className="relative w-full max-w-[40rem]">
        <Image
          key={scene.imageUrl}
          src={scene.imageUrl}
          alt={scene.imageAlt}
          width={1600}
          height={1000}
          priority
          sizes="(min-width: 1024px) 540px, 94vw"
          className="relative h-auto w-full object-contain object-bottom drop-shadow-[0_24px_36px_rgba(53,63,82,0.14)]"
        />
      </div>
    </div>
  );
}
