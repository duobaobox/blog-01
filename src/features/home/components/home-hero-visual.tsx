import Image from "next/image";
import type { HomeHeroConfig } from "@/features/home/config/home.config";
import { pickHomeScene, type HomeScene } from "@/features/home/lib/home-scene";

type HomeHeroVisualProps = {
  visual: HomeHeroConfig["visual"];
  sceneSeed: number;
};

const HERO_IMAGE_SIZES =
  "(min-width: 1280px) 960px, (min-width: 1024px) 80vw, (min-width: 640px) 108vw, 114vw";

const HERO_IMAGE_CLASS =
  "pointer-events-none relative block h-auto w-full max-w-none select-none object-contain object-bottom drop-shadow-[0_24px_36px_rgba(53,63,82,0.14)]";

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
 * 浅色与深色两套场景都由服务端输出，用 `dark:` 切换可见性。
 *
 * 这里刻意不使用 next/image 的 `priority`：它会给隐藏的那张也输出
 * `<link rel="preload">`，深色访客于是既预加载了用不上的浅色场景，又要等到水合
 * 之后才拿到真正的场景。现在隐藏的那张是 `display:none` 且保持默认懒加载，
 * 浏览器不会请求它——每个访客只下载一张图，也不需要任何客户端 JS。
 */
export function HomeHeroVisual({ visual, sceneSeed }: HomeHeroVisualProps) {
  const lightScene = pickHomeScene(visual.light, sceneSeed);
  const darkScene = pickHomeScene(visual.dark, sceneSeed);

  return (
    <div className="relative flex h-full w-full items-end justify-center lg:justify-end">
      <HeroSceneImage scene={lightScene} themeClassName="dark:hidden" />
      <HeroSceneImage scene={darkScene} themeClassName="hidden dark:block" />
    </div>
  );
}
