import type { RefObject } from "react";

const NAVIGATION_GLASS_RED_DISPLACEMENT = -16;
const NAVIGATION_GLASS_GREEN_DISPLACEMENT = -16;
const NAVIGATION_GLASS_BLUE_DISPLACEMENT = -16;
const NAVIGATION_GLASS_EDGE_BLUR = 0.2;

type NavigationGlassDefsProps = {
  mapRef: RefObject<SVGFEImageElement | null>;
};

export function NavigationGlassDefs({ mapRef }: NavigationGlassDefsProps) {
  return (
    <svg
      className="public-header__glass-defs"
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
    >
      <defs>
        <filter id="public-nav-liquid-glass" colorInterpolationFilters="sRGB">
          <feImage
            ref={mapRef}
            x="0"
            y="0"
            width="100%"
            height="100%"
            preserveAspectRatio="none"
            result="map"
            data-navigation-glass-map
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            xChannelSelector="R"
            yChannelSelector="B"
            scale={NAVIGATION_GLASS_RED_DISPLACEMENT}
            result="displacedRed"
          />
          <feColorMatrix
            in="displacedRed"
            type="matrix"
            values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"
            result="red"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            xChannelSelector="R"
            yChannelSelector="B"
            scale={NAVIGATION_GLASS_GREEN_DISPLACEMENT}
            result="displacedGreen"
          />
          <feColorMatrix
            in="displacedGreen"
            type="matrix"
            values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0"
            result="green"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            xChannelSelector="R"
            yChannelSelector="B"
            scale={NAVIGATION_GLASS_BLUE_DISPLACEMENT}
            result="displacedBlue"
          />
          <feColorMatrix
            in="displacedBlue"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0"
            result="blue"
          />
          <feBlend in="red" in2="green" mode="screen" result="redGreen" />
          <feBlend in="redGreen" in2="blue" mode="screen" result="output" />
          <feGaussianBlur
            in="output"
            stdDeviation={NAVIGATION_GLASS_EDGE_BLUR}
          />
        </filter>
      </defs>
    </svg>
  );
}
