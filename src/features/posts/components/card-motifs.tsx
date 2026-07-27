import type { SVGProps } from "react";

type MotifProps = SVGProps<SVGSVGElement>;

/* ====== MOTIF-01: 信封与信纸 ====== */
function Motif01(props: MotifProps) {
  return (
    <svg viewBox="0 0 160 120" fill="none" stroke="currentColor" strokeWidth="0.8" {...props}>
      <path d="M18 18 H146 M18 38 H146 M18 58 H146 M18 78 H146 M18 98 H146" strokeDasharray="0.8 2" opacity="0.14" />
      <path d="M24 12 V108 M48 12 V108 M72 12 V108 M96 12 V108 M120 12 V108 M144 12 V108" strokeDasharray="0.8 2" opacity="0.14" />

      <rect x="24" y="34" width="46" height="34" rx="2.5" opacity="0.62" />
      <path d="M24 34 L47 52 L70 34" opacity="0.62" />
      <path d="M24 68 L42 52" opacity="0.5" />
      <path d="M70 68 L52 52" opacity="0.5" />

      <rect x="56" y="20" width="58" height="72" rx="4" strokeWidth="1" />
      <path d="M66 34 H102 M66 44 H106 M66 54 H98 M66 64 H104 M66 74 H96" opacity="0.65" />
      <rect x="92" y="24" width="14" height="10" rx="1.5" stroke="var(--site-accent-500)" opacity="0.92" />
      <path d="M94 27 H104 M96 30 H102" stroke="var(--site-accent-500)" opacity="0.9" />

      <path d="M90 58 H136 V96 H90 Z" strokeWidth="1" />
      <path d="M90 58 L113 76 L136 58" />
      <path d="M90 96 L108 80" opacity="0.5" />
      <path d="M136 96 L118 80" opacity="0.5" />
      <rect x="118" y="64" width="8" height="8" rx="1" stroke="var(--site-accent-500)" opacity="0.88" />
      <path d="M120 68 H124 M122 66 V70" stroke="var(--site-accent-500)" opacity="0.88" />

      <text x="22" y="112" fontFamily="monospace" fontSize="3.5" fill="currentColor" opacity="0.55">
        MAIL / LETTER
      </text>
    </svg>
  );
}

/* ====== MOTIF-02: 耳机与播放面板 ====== */
function Motif02(props: MotifProps) {
  return (
    <svg viewBox="0 0 160 120" fill="none" stroke="currentColor" strokeWidth="0.8" {...props}>
      <path d="M18 18 H146 M18 38 H146 M18 58 H146 M18 78 H146 M18 98 H146" strokeDasharray="0.8 2" opacity="0.14" />
      <path d="M24 12 V108 M48 12 V108 M72 12 V108 M96 12 V108 M120 12 V108 M144 12 V108" strokeDasharray="0.8 2" opacity="0.14" />

      <path d="M40 56 C40 34, 58 20, 80 20 C102 20, 120 34, 120 56" strokeWidth="1.1" />
      <rect x="34" y="54" width="12" height="24" rx="4" />
      <rect x="114" y="54" width="12" height="24" rx="4" />
      <path d="M46 68 H56" opacity="0.6" />
      <path d="M104 68 H114" opacity="0.6" />
      <path d="M52 82 C62 88, 98 88, 108 82" opacity="0.65" />

      <rect x="58" y="46" width="44" height="18" rx="4" stroke="var(--site-accent-500)" strokeWidth="1" opacity="0.92" />
      <path d="M68 55 L74 51 V59 Z" fill="currentColor" stroke="none" opacity="0.85" />
      <path d="M80 55 H92" opacity="0.7" />
      <circle cx="97" cy="55" r="1.6" fill="currentColor" />

      <path d="M48 96 H120" opacity="0.55" />
      <circle cx="64" cy="96" r="2" fill="currentColor" />
      <circle cx="92" cy="96" r="2" fill="var(--site-accent-500)" opacity="0.9" />
      <circle cx="108" cy="96" r="2" fill="currentColor" />
      <path d="M54 90 V102 M76 92 V100 M80 88 V104 M84 94 V98 M98 90 V102 M102 86 V106" opacity="0.7" />

      <text x="86" y="16" fontFamily="monospace" fontSize="3.5" fill="currentColor" opacity="0.55">
        AUDIO / PLAY
      </text>
    </svg>
  );
}

/* ====== MOTIF-03: 便签纸与图钉 ====== */
function Motif03(props: MotifProps) {
  return (
    <svg viewBox="0 0 160 120" fill="none" stroke="currentColor" strokeWidth="0.8" {...props}>
      <path d="M18 20 H146 M18 40 H146 M18 60 H146 M18 80 H146 M18 100 H146" strokeDasharray="0.8 2" opacity="0.16" />
      <path d="M24 14 V108 M48 14 V108 M72 14 V108 M96 14 V108 M120 14 V108 M144 14 V108" strokeDasharray="0.8 2" opacity="0.16" />

      <path d="M24 48 H66 V82 H24 Z" opacity="0.6" />
      <path d="M56 48 V58 H66" opacity="0.6" />
      <path d="M32 58 H52 M32 65 H48 M32 72 H54" opacity="0.5" />

      <path d="M54 24 H112 V72 H54 Z" strokeWidth="1" />
      <path d="M100 24 V36 H112" />
      <path d="M66 39 H96 M66 47 H92 M66 55 H98" opacity="0.68" />
      <rect x="66" y="61" width="8" height="6" rx="1" stroke="var(--site-accent-500)" strokeWidth="1" opacity="0.9" />
      <path d="M78 64 H98" stroke="var(--site-accent-500)" opacity="0.9" />

      <path d="M86 62 H132 V98 H86 Z" strokeWidth="1" />
      <path d="M121 62 V73 H132" />
      <rect x="96" y="74" width="7" height="7" rx="1" />
      <path d="M97 77.5 L99.5 80 L103.5 75.5" stroke="var(--site-accent-500)" strokeWidth="1" opacity="0.9" />
      <path d="M108 77.5 H122" />
      <rect x="96" y="86" width="7" height="7" rx="1" />
      <path d="M108 89.5 H120" opacity="0.7" />

      <circle cx="86" cy="30" r="5" fill="currentColor" opacity="0.85" />
      <path d="M86 35 V44" strokeWidth="1" />
      <path d="M82.5 44 H89.5 L86 50 Z" fill="currentColor" stroke="none" opacity="0.85" />

      <text x="24" y="112" fontFamily="monospace" fontSize="3.5" fill="currentColor" opacity="0.55">
        NOTES / PINBOARD
      </text>
    </svg>
  );
}

/* ====== MOTIF-04: 照片拼贴与胶带 ====== */
function Motif04(props: MotifProps) {
  return (
    <svg viewBox="0 0 160 120" fill="none" stroke="currentColor" strokeWidth="0.8" {...props}>
      <path d="M18 18 H146 M18 38 H146 M18 58 H146 M18 78 H146 M18 98 H146" strokeDasharray="0.8 2" opacity="0.14" />
      <path d="M24 12 V108 M48 12 V108 M72 12 V108 M96 12 V108 M120 12 V108 M144 12 V108" strokeDasharray="0.8 2" opacity="0.14" />

      <rect x="26" y="42" width="42" height="34" rx="2.5" opacity="0.62" />
      <path d="M32 68 L42 56 L50 62 L58 52 L64 60" opacity="0.7" />
      <circle cx="38" cy="50" r="2" fill="currentColor" />
      <path d="M40 38 H54" stroke="var(--site-accent-500)" opacity="0.85" />
      <path d="M43 35 H51 V41 H43 Z" stroke="var(--site-accent-500)" opacity="0.85" />

      <rect x="58" y="24" width="48" height="38" rx="2.5" strokeWidth="1" />
      <path d="M64 54 L74 42 L84 50 L92 36 L100 48" opacity="0.75" />
      <circle cx="70" cy="34" r="2" fill="currentColor" />
      <path d="M74 20 H90" stroke="var(--site-accent-500)" opacity="0.85" />
      <path d="M78 17 H86 V23 H78 Z" stroke="var(--site-accent-500)" opacity="0.85" />

      <rect x="94" y="54" width="40" height="32" rx="2.5" strokeWidth="1" />
      <path d="M100 78 L108 68 L116 74 L124 62 L130 70" opacity="0.75" />
      <circle cx="106" cy="62" r="2" fill="currentColor" />
      <path d="M108 50 H122" stroke="var(--site-accent-500)" opacity="0.85" />
      <path d="M111 47 H119 V53 H111 Z" stroke="var(--site-accent-500)" opacity="0.85" />

      <text x="18" y="112" fontFamily="monospace" fontSize="3.5" fill="currentColor" opacity="0.55">
        PHOTO / COLLAGE
      </text>
    </svg>
  );
}

/* ====== MOTIF-05: 尺子与测量刻度 ====== */
function Motif05(props: MotifProps) {
  return (
    <svg viewBox="0 0 160 120" fill="none" stroke="currentColor" strokeWidth="0.8" {...props}>
      <path d="M18 18 H146 M18 38 H146 M18 58 H146 M18 78 H146 M18 98 H146" strokeDasharray="0.8 2" opacity="0.14" />
      <path d="M24 12 V108 M48 12 V108 M72 12 V108 M96 12 V108 M120 12 V108 M144 12 V108" strokeDasharray="0.8 2" opacity="0.14" />

      <path d="M92 20 L140 20 L140 68 Z" strokeWidth="1" />
      <path d="M108 30 L130 30 L130 52 Z" opacity="0.55" />
      <path d="M102 20 V27 M112 20 V25 M122 20 V27 M132 20 V25" opacity="0.65" />
      <path d="M140 30 H133 M140 40 H135 M140 50 H133 M140 60 H135" opacity="0.65" />
      <circle cx="126" cy="54" r="1.5" fill="currentColor" />

      <g transform="rotate(-14 76 74)">
        <rect x="20" y="62" width="112" height="22" rx="2.5" strokeWidth="1" />
        <path d="M30 62 V78 M38 62 V72 M46 62 V76 M54 62 V72 M62 62 V78 M70 62 V72 M78 62 V76 M86 62 V72 M94 62 V78 M102 62 V72 M110 62 V76 M118 62 V72" opacity="0.82" />
        <path d="M30 62 V82 M62 62 V82 M94 62 V82" stroke="var(--site-accent-500)" strokeWidth="1" opacity="0.9" />
        <text x="70" y="78" fontFamily="monospace" fontSize="4" fill="currentColor" opacity="0.65">
          cm
        </text>
      </g>

      <path d="M22 99 H126" opacity="0.6" />
      <path d="M22 94 V104 M126 94 V104" opacity="0.6" />
      <path d="M22 99 L29 95 M22 99 L29 103 M126 99 L119 95 M126 99 L119 103" opacity="0.55" />
      <text x="67" y="95" fontFamily="monospace" fontSize="3.5" fill="currentColor" opacity="0.55">
        120 mm
      </text>
    </svg>
  );
}

/* ====== MOTIF-06: 日历与待办清单 ====== */
function Motif06(props: MotifProps) {
  return (
    <svg viewBox="0 0 160 120" fill="none" stroke="currentColor" strokeWidth="0.8" {...props}>
      <path d="M18 18 H146 M18 38 H146 M18 58 H146 M18 78 H146 M18 98 H146" strokeDasharray="0.8 2" opacity="0.14" />
      <path d="M24 12 V108 M48 12 V108 M72 12 V108 M96 12 V108 M120 12 V108 M144 12 V108" strokeDasharray="0.8 2" opacity="0.14" />

      <rect x="68" y="22" width="62" height="62" rx="4" strokeWidth="1" />
      <path d="M68 38 H130" />
      <path d="M84 16 V30 M114 16 V30" strokeWidth="1" />
      <circle cx="84" cy="18" r="2" fill="currentColor" />
      <circle cx="114" cy="18" r="2" fill="currentColor" />

      <path d="M78 47 H120 M78 57 H120 M78 67 H120 M78 77 H120" opacity="0.42" />
      <path d="M88 42 V80 M98 42 V80 M108 42 V80" opacity="0.42" />
      <circle cx="103" cy="62" r="5" stroke="var(--site-accent-500)" strokeWidth="1.1" opacity="0.9" />
      <text x="100.4" y="63.4" fontFamily="monospace" fontSize="3.5" fill="currentColor" opacity="0.8">
        18
      </text>

      <rect x="22" y="38" width="38" height="50" rx="3" opacity="0.72" />
      <path d="M30 48 H52" opacity="0.5" />
      <rect x="30" y="56" width="6" height="6" rx="1" />
      <path d="M31 59 L33.5 61.5 L37 57" stroke="var(--site-accent-500)" strokeWidth="1" opacity="0.9" />
      <path d="M41 59 H53" />
      <rect x="30" y="68" width="6" height="6" rx="1" />
      <path d="M41 71 H52" opacity="0.72" />
      <rect x="30" y="80" width="6" height="6" rx="1" />
      <path d="M41 83 H55" opacity="0.72" />

      <path d="M68 94 H126 M68 102 H116" opacity="0.48" />
      <text x="22" y="112" fontFamily="monospace" fontSize="3.5" fill="currentColor" opacity="0.55">
        CALENDAR / TODO
      </text>
    </svg>
  );
}

/* ====== MOTIF-07: 桌面小工具组合 ====== */
function Motif07(props: MotifProps) {
  return (
    <svg viewBox="0 0 160 120" fill="none" stroke="currentColor" strokeWidth="0.8" {...props}>
      <path d="M18 20 H146 M18 40 H146 M18 60 H146 M18 80 H146 M18 100 H146" strokeDasharray="0.8 2" opacity="0.14" />
      <path d="M24 14 V106 M48 14 V106 M72 14 V106 M96 14 V106 M120 14 V106 M144 14 V106" strokeDasharray="0.8 2" opacity="0.14" />

      <rect x="24" y="46" width="38" height="50" rx="4" strokeWidth="1" />
      <rect x="30" y="54" width="26" height="8" rx="1.5" stroke="var(--site-accent-500)" opacity="0.9" />
      <path d="M32 70 H38 M42 70 H48 M52 70 H58" />
      <path d="M32 78 H38 M42 78 H48 M52 78 H58" />
      <path d="M32 86 H38 M42 86 H48 M52 86 H58" />
      <path d="M35 67 V89 M45 67 V89 M55 67 V89" opacity="0.42" />

      <circle cx="108" cy="40" r="16" strokeWidth="1" />
      <path d="M108 20 V26" />
      <path d="M102 22 H114" />
      <path d="M108 40 L108 31" stroke="var(--site-accent-500)" strokeWidth="1.1" />
      <path d="M108 40 L116 44" strokeWidth="1" />
      <circle cx="108" cy="40" r="1.5" fill="currentColor" />
      <path d="M108 27 V29 M121 40 H119 M108 53 V51 M95 40 H97" opacity="0.55" />

      <rect x="82" y="68" width="48" height="28" rx="4" strokeWidth="1" />
      <rect x="90" y="76" width="14" height="7" rx="3.5" />
      <circle cx="97" cy="79.5" r="2.4" fill="currentColor" />
      <rect x="108" y="76" width="14" height="7" rx="3.5" stroke="var(--site-accent-500)" opacity="0.9" />
      <circle cx="117" cy="79.5" r="2.4" fill="var(--site-accent-500)" opacity="0.9" />
      <path d="M90 88 H122" opacity="0.45" />

      <path d="M18 104 H138" opacity="0.35" />

      <text x="84" y="18" fontFamily="monospace" fontSize="3.5" fill="currentColor" opacity="0.55">
        DESK TOOLS
      </text>
    </svg>
  );
}

/* ====== MOTIF-08: 笔记本、书签与回形针 ====== */
function Motif08(props: MotifProps) {
  return (
    <svg viewBox="0 0 160 120" fill="none" stroke="currentColor" strokeWidth="0.8" {...props}>
      <path d="M18 18 H142 M18 38 H142 M18 58 H142 M18 78 H142 M18 98 H142" strokeDasharray="0.8 2" opacity="0.14" />
      <path d="M24 12 V108 M48 12 V108 M72 12 V108 M96 12 V108 M120 12 V108 M144 12 V108" strokeDasharray="0.8 2" opacity="0.14" />

      <rect x="32" y="20" width="56" height="74" rx="4" strokeWidth="1" />
      <path d="M44 20 V94" opacity="0.55" />
      <path d="M50 34 H80 M50 44 H80 M50 54 H80 M50 64 H76 M50 74 H78" opacity="0.65" />

      <path d="M74 20 V40 L69 36 L64 40 V20" stroke="var(--site-accent-500)" strokeWidth="1.1" opacity="0.92" />

      <path
        d="M102 28
           C102 20, 114 20, 114 28
           V56
           C114 64, 102 64, 102 56
           V34
           C102 28, 110 28, 110 34
           V54"
        strokeWidth="1"
        opacity="0.82"
      />

      <g transform="rotate(-24 112 84)">
        <rect x="92" y="80" width="34" height="8" rx="3" />
        <path d="M126 80 L134 84 L126 88 Z" fill="none" />
        <path d="M96 80 V88" opacity="0.55" />
        <path d="M102 80 V88" opacity="0.55" />
        <path d="M92 84 H126" stroke="var(--site-accent-500)" opacity="0.9" />
      </g>

      <path d="M100 76 H134" opacity="0.45" />
      <path d="M100 84 H130" opacity="0.45" />
      <path d="M100 92 H126" opacity="0.45" />

      <text x="24" y="112" fontFamily="monospace" fontSize="3.5" fill="currentColor" opacity="0.55">
        NOTEBOOK / CLIP
      </text>
    </svg>
  );
}

export const cardMotifs = [
  Motif01,
  Motif02,
  Motif03,
  Motif04,
  Motif05,
  Motif06,
  Motif07,
  Motif08,
] as const;
