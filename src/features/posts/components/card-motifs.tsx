import type { SVGProps } from "react";

type MotifProps = SVGProps<SVGSVGElement>;

/* ====== MOTIF-01: 建筑蓝图与剖面 ====== */
function Motif01(props: MotifProps) {
  return (
    <svg viewBox="0 0 160 120" fill="none" stroke="currentColor" strokeWidth="0.8" {...props}>
      <path d="M20 20 L80 20 L140 20 M20 60 L140 60 M20 100 L140 100" strokeDasharray="0.8 2" opacity="0.5" />
      <path d="M40 10 V110 M80 10 V110 M120 10 V110" strokeDasharray="0.8 2" opacity="0.5" />
      <path d="M40 100 C 40 40, 120 40, 120 100" strokeWidth="1.2" stroke="#3b82f6" opacity="0.9" />
      <path d="M40 80 C 40 50, 120 50, 120 80" strokeWidth="0.6" strokeDasharray="2 1" opacity="0.7" />
      <circle cx="80" cy="40" r="1.5" fill="currentColor" />
      <circle cx="40" cy="100" r="1.5" fill="currentColor" />
      <circle cx="120" cy="100" r="1.5" fill="currentColor" />
      <path d="M80 40 L105 15" strokeWidth="0.6" strokeDasharray="1 1" />
      <text x="108" y="14" fontFamily="monospace" fontSize="3.5" fill="currentColor" opacity="0.85">
        R=42.5mm
      </text>
      <text x="42" y="32" fontFamily="monospace" fontSize="3.5" fill="currentColor" opacity="0.6">
        SEC_A1
      </text>
      <path d="M145 10 h10 v10 M145 110 h10 v-10" strokeWidth="0.6" opacity="0.6" />
    </svg>
  );
}

/* ====== MOTIF-02: 星球轨道与坐标向量 ====== */
function Motif02(props: MotifProps) {
  return (
    <svg viewBox="0 0 160 120" fill="none" stroke="currentColor" strokeWidth="0.8" {...props}>
      <circle cx="100" cy="60" r="50" strokeDasharray="1 2.5" opacity="0.6" />
      <circle cx="100" cy="60" r="35" strokeWidth="0.9" />
      <circle cx="100" cy="60" r="20" strokeDasharray="3 1.5" opacity="0.8" />
      <ellipse cx="100" cy="60" rx="65" ry="25" transform="rotate(-20 100 60)" strokeWidth="1" stroke="#3b82f6" opacity="0.9" />
      <line x1="40" y1="60" x2="160" y2="60" strokeDasharray="0.5 2" opacity="0.5" />
      <line x1="100" y1="0" x2="100" y2="120" strokeDasharray="0.5 2" opacity="0.5" />
      <circle cx="132" cy="48" r="2" fill="currentColor" />
      <circle cx="78" cy="38" r="1.5" fill="currentColor" />
      <circle cx="100" cy="60" r="1" fill="currentColor" />
      <text x="110" y="32" fontFamily="monospace" fontSize="3.5" fill="currentColor" opacity="0.7">
        ORBIT_e0.42
      </text>
      <text x="40" y="112" fontFamily="monospace" fontSize="3.5" fill="currentColor" opacity="0.5">
        RA:14h29m / DEC:+60°
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
      <rect x="66" y="61" width="8" height="6" rx="1" stroke="#3b82f6" strokeWidth="1" opacity="0.9" />
      <path d="M78 64 H98" stroke="#3b82f6" opacity="0.9" />

      <path d="M86 62 H132 V98 H86 Z" strokeWidth="1" />
      <path d="M121 62 V73 H132" />
      <rect x="96" y="74" width="7" height="7" rx="1" />
      <path d="M97 77.5 L99.5 80 L103.5 75.5" stroke="#3b82f6" strokeWidth="1" opacity="0.9" />
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

/* ====== MOTIF-04: 瑞士平面排版网格 ====== */
function Motif04(props: MotifProps) {
  return (
    <svg viewBox="0 0 160 120" fill="none" stroke="currentColor" strokeWidth="0.8" {...props}>
      <path d="M10 15 H150 M10 30 H150 M10 45 H150 M10 60 H150 M10 75 H150 M10 90 H150 M10 105 H150" opacity="0.3" strokeDasharray="0.5 2" />
      <rect x="25" y="15" width="30" height="90" strokeWidth="0.5" strokeDasharray="1 1.5" opacity="0.5" />
      <rect x="65" y="15" width="30" height="90" strokeWidth="0.5" strokeDasharray="1 1.5" opacity="0.5" />
      <rect x="105" y="15" width="30" height="90" strokeWidth="0.5" strokeDasharray="1 1.5" opacity="0.5" />
      <rect x="65" y="30" width="30" height="30" strokeWidth="1.2" stroke="#3b82f6" opacity="0.9" />
      <line x1="65" y1="30" x2="95" y2="60" strokeWidth="0.6" />
      <text x="107" y="26" fontFamily="sans-serif" fontWeight="bold" fontSize="6" fill="currentColor" opacity="0.85">
        Aa
      </text>
      <text x="107" y="42" fontFamily="monospace" fontSize="3" fill="currentColor" opacity="0.6">
        12/16pt
      </text>
      <text x="107" y="50" fontFamily="monospace" fontSize="3" fill="currentColor" opacity="0.6">
        Grid:8px
      </text>
      <path d="M10 10 v5 h5 M150 10 v5 h-5 M10 110 v-5 h5 M150 110 v-5 h-5" strokeWidth="0.6" />
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
        <path d="M30 62 V82 M62 62 V82 M94 62 V82" stroke="#3b82f6" strokeWidth="1" opacity="0.9" />
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
      <circle cx="103" cy="62" r="5" stroke="#3b82f6" strokeWidth="1.1" opacity="0.9" />
      <text x="100.4" y="63.4" fontFamily="monospace" fontSize="3.5" fill="currentColor" opacity="0.8">
        18
      </text>

      <rect x="22" y="38" width="38" height="50" rx="3" opacity="0.72" />
      <path d="M30 48 H52" opacity="0.5" />
      <rect x="30" y="56" width="6" height="6" rx="1" />
      <path d="M31 59 L33.5 61.5 L37 57" stroke="#3b82f6" strokeWidth="1" opacity="0.9" />
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
      <path d="M24 14 V108 M48 14 V108 M72 14 V108 M96 14 V108 M120 14 V108 M144 14 V108" strokeDasharray="0.8 2" opacity="0.14" />

      <rect x="22" y="42" width="42" height="58" rx="4" strokeWidth="1" />
      <rect x="29" y="50" width="28" height="10" rx="1.5" stroke="#3b82f6" strokeWidth="1" opacity="0.9" />
      <path d="M30 68 H56 M30 78 H56 M30 88 H56" opacity="0.45" />
      <path d="M38 64 V94 M48 64 V94" opacity="0.45" />
      <circle cx="34" cy="73" r="1.1" fill="currentColor" />
      <circle cx="43" cy="73" r="1.1" fill="currentColor" />
      <circle cx="53" cy="73" r="1.1" fill="currentColor" />
      <circle cx="34" cy="83" r="1.1" fill="currentColor" />
      <circle cx="43" cy="83" r="1.1" fill="currentColor" />
      <circle cx="53" cy="83" r="1.1" fill="currentColor" />
      <circle cx="34" cy="93" r="1.1" fill="currentColor" />
      <circle cx="43" cy="93" r="1.1" fill="currentColor" />
      <circle cx="53" cy="93" r="1.1" fill="currentColor" />

      <circle cx="108" cy="40" r="18" strokeWidth="1" />
      <path d="M102 18 H114 M108 18 V22" />
      <path d="M108 40 V29" stroke="#3b82f6" strokeWidth="1.1" opacity="0.9" />
      <path d="M108 40 L117 45" strokeWidth="1" />
      <circle cx="108" cy="40" r="1.5" fill="currentColor" />
      <path d="M108 25 V28 M123 40 H120 M108 55 V52 M93 40 H96" opacity="0.55" />

      <rect x="78" y="72" width="58" height="28" rx="4" strokeWidth="1" />
      <rect x="88" y="80" width="16" height="8" rx="4" />
      <circle cx="94" cy="84" r="2.6" fill="currentColor" />
      <rect x="110" y="80" width="16" height="8" rx="4" stroke="#3b82f6" opacity="0.9" />
      <circle cx="120" cy="84" r="2.6" fill="#3b82f6" stroke="none" opacity="0.9" />
      <path d="M88 94 H126" opacity="0.45" />

      <text x="83" y="112" fontFamily="monospace" fontSize="3.5" fill="currentColor" opacity="0.55">
        DESK TOOLS
      </text>
    </svg>
  );
}

/* ====== MOTIF-08: 笔记本、书签与回形针 ====== */
function Motif08(props: MotifProps) {
  return (
    <svg viewBox="0 0 160 120" fill="none" stroke="currentColor" strokeWidth="0.8" {...props}>
      <path d="M18 18 H146 M18 38 H146 M18 58 H146 M18 78 H146 M18 98 H146" strokeDasharray="0.8 2" opacity="0.14" />
      <path d="M24 12 V108 M48 12 V108 M72 12 V108 M96 12 V108 M120 12 V108 M144 12 V108" strokeDasharray="0.8 2" opacity="0.14" />

      <rect x="26" y="20" width="66" height="78" rx="4" strokeWidth="1" />
      <path d="M40 20 V98" opacity="0.55" />
      <path d="M47 35 H82 M47 45 H82 M47 55 H82 M47 65 H78 M47 75 H80 M47 85 H72" opacity="0.62" />
      <path d="M67 20 V43 L61 38 L55 43 V20" stroke="#3b82f6" strokeWidth="1.1" opacity="0.9" />
      <path d="M33 30 H38 M33 42 H38 M33 54 H38 M33 66 H38 M33 78 H38 M33 90 H38" opacity="0.55" />

      <path d="M107 29 C107 21, 120 21, 120 29 V59 C120 68, 106 68, 106 59 V36 C106 29, 115 29, 115 36 V57" strokeWidth="1" opacity="0.8" />

      <g transform="rotate(-26 118 84)">
        <path d="M98 79 H132 L140 84 L132 89 H98 Z" strokeWidth="1" />
        <path d="M132 79 V89" opacity="0.55" />
        <path d="M103 79 V89" opacity="0.55" />
        <path d="M98 84 H132" stroke="#3b82f6" strokeWidth="1" opacity="0.9" />
        <path d="M140 84 L134.5 82 V86 Z" fill="currentColor" stroke="none" opacity="0.8" />
      </g>

      <path d="M101 101 H138" opacity="0.45" />
      <text x="20" y="112" fontFamily="monospace" fontSize="3.5" fill="currentColor" opacity="0.55">
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

/**
 * 基于文章 slug 确定性选择图腾，同篇文章刷新后图腾不变。
 */
export function getMotifIndex(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash) + slug.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % cardMotifs.length;
}

/**
 * 为一批文章分配图腾索引，保证相邻卡片图腾不同。
 * 使用 Fisher-Yates shuffle + 相邻去重策略。
 */
export function assignMotifIndices(count: number): number[] {
  if (count <= 0) return [];

  const total = cardMotifs.length;
  const indices: number[] = [];

  // Fisher-Yates shuffle
  function shuffled(): number[] {
    const arr = Array.from({ length: total }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const batch = shuffled();

  for (let i = 0; i < count; i++) {
    const batchIdx = Math.floor(i / total);
    const offset = i % total;

    if (batchIdx === 0) {
      indices.push(batch[offset]);
    } else {
      // 确保新 batch 第一个与上一个不同
      const prev = indices[i - 1];
      const next = shuffled();
      if (next[0] === prev) {
        // 交换第一个和随机位置
        const swap = 1 + Math.floor(Math.random() * (total - 1));
        [next[0], next[swap]] = [next[swap], next[0]];
      }
      indices.push(next[offset]);
    }
  }

  return indices;
}
