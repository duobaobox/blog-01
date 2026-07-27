"use client";

import { useEffect, useRef, useState } from "react";
import {
  buildNavigationGlassMap,
  resolveNavigationCondensedState,
} from "@/shared/lib/navigation-liquid-glass";

const GLASS_MAP_RESIZE_DELAY = 140;

export function useNavigationGlass() {
  const shellRef = useRef<HTMLDivElement>(null);
  const glassMapRef = useRef<SVGFEImageElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let animationFrame = 0;
    let mapTimer: ReturnType<typeof setTimeout> | null = null;
    let condensed = resolveNavigationCondensedState(false, window.scrollY);

    function syncGlassMap() {
      const shell = shellRef.current;
      const glassMap = glassMapRef.current;

      if (!shell || !glassMap) {
        return;
      }

      const rect = shell.getBoundingClientRect();
      glassMap.setAttribute("href", buildNavigationGlassMap(rect.width, rect.height));
    }

    function scheduleGlassMap() {
      if (mapTimer) {
        clearTimeout(mapTimer);
      }

      mapTimer = setTimeout(syncGlassMap, GLASS_MAP_RESIZE_DELAY);
    }

    function handleScroll() {
      if (animationFrame) {
        return;
      }

      animationFrame = window.requestAnimationFrame(() => {
        const nextCondensed = resolveNavigationCondensedState(
          condensed,
          window.scrollY,
        );

        if (nextCondensed !== condensed) {
          condensed = nextCondensed;
          setIsScrolled(condensed);
          scheduleGlassMap();
        }

        animationFrame = 0;
      });
    }

    syncGlassMap();
    animationFrame = window.requestAnimationFrame(() => {
      setIsScrolled(condensed);
      animationFrame = 0;
    });

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(scheduleGlassMap);

    if (shellRef.current) {
      resizeObserver?.observe(shellRef.current);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", scheduleGlassMap, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", scheduleGlassMap);
      resizeObserver?.disconnect();

      if (mapTimer) {
        clearTimeout(mapTimer);
      }

      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  return {
    shellRef,
    glassMapRef,
    isScrolled,
  };
}
