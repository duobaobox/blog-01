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

/* ====== MOTIF-03: PCB 电路与信号总线 ====== */
function Motif03(props: MotifProps) {
  return (
    <svg viewBox="0 0 160 120" fill="none" stroke="currentColor" strokeWidth="0.8" {...props}>
      <path d="M20 30 H70 L90 50 H150" strokeWidth="1" />
      <path d="M20 40 H66 L86 60 H150" strokeWidth="0.7" />
      <path d="M20 50 H62 L82 70 H150" strokeWidth="0.7" strokeDasharray="2 1" />
      <path d="M20 60 H58 L78 80 H150" strokeWidth="0.7" />
      <path d="M40 10 V110" strokeWidth="0.5" strokeDasharray="1 3" opacity="0.4" />
      <path d="M120 10 V110" strokeWidth="0.5" strokeDasharray="1 3" opacity="0.4" />
      <path d="M110 20 L110 40 L130 60 L130 100" strokeWidth="1.2" stroke="#3b82f6" opacity="0.9" />
      <circle cx="70" cy="30" r="1.5" fill="none" strokeWidth="0.8" />
      <circle cx="70" cy="30" r="0.5" fill="currentColor" />
      <circle cx="90" cy="50" r="1.5" fill="none" strokeWidth="0.8" />
      <circle cx="90" cy="50" r="0.5" fill="currentColor" />
      <circle cx="110" cy="40" r="1.8" fill="currentColor" />
      <circle cx="130" cy="60" r="1.8" fill="currentColor" />
      <rect x="25" y="75" width="25" height="30" rx="1" strokeWidth="0.8" strokeDasharray="1 1" />
      <text x="28" y="92" fontFamily="monospace" fontSize="3" fill="currentColor" opacity="0.8">
        MCU_CORTEX
      </text>
      <text x="100" y="15" fontFamily="monospace" fontSize="3.5" fill="currentColor" opacity="0.6">
        BUS_CLK:400MHz
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

/* ====== MOTIF-05: 谐振曲线与频域波动 ====== */
function Motif05(props: MotifProps) {
  return (
    <svg viewBox="0 0 160 120" fill="none" stroke="currentColor" strokeWidth="0.8" {...props}>
      <path d="M 20 60 C 40 10, 70 110, 90 60 C 110 10, 140 110, 160 60" strokeWidth="1.2" stroke="#3b82f6" opacity="0.9" />
      <path d="M 20 60 C 40 30, 70 90, 90 60 C 110 30, 140 90, 160 60" strokeWidth="0.6" strokeDasharray="2 1" opacity="0.6" />
      <path d="M 20 60 C 40 50, 70 70, 90 60 C 110 50, 140 70, 160 60" strokeWidth="0.5" opacity="0.4" />
      <line x1="20" y1="20" x2="160" y2="20" strokeDasharray="1 3" opacity="0.4" />
      <line x1="20" y1="100" x2="160" y2="100" strokeDasharray="1 3" opacity="0.4" />
      <line x1="90" y1="10" x2="90" y2="110" strokeDasharray="1 3" opacity="0.4" />
      <circle cx="90" cy="60" r="1.8" fill="currentColor" />
      <circle cx="55" cy="60" r="1.2" fill="currentColor" />
      <circle cx="125" cy="60" r="1.2" fill="currentColor" />
      <text x="100" y="28" fontFamily="monospace" fontSize="3.5" fill="currentColor" opacity="0.8">
        f(t) = sin(3ωt + φ)
      </text>
      <text x="25" y="112" fontFamily="monospace" fontSize="3.5" fill="currentColor" opacity="0.5">
        FFT_SPECTRUM_ANALYSIS
      </text>
    </svg>
  );
}

/* ====== MOTIF-06: 等高线地貌与高程采样 ====== */
function Motif06(props: MotifProps) {
  return (
    <svg viewBox="0 0 160 120" fill="none" stroke="currentColor" strokeWidth="0.8" {...props}>
      <path d="M 20 20 Q 60 10, 90 40 T 150 30" strokeWidth="0.6" opacity="0.5" />
      <path d="M 20 40 Q 70 25, 100 60 T 150 50" strokeWidth="0.7" opacity="0.7" />
      <path d="M 20 60 Q 80 40, 110 80 T 150 70" strokeWidth="1" stroke="#3b82f6" opacity="0.9" />
      <path d="M 20 80 Q 90 55, 120 100 T 150 90" strokeWidth="0.7" opacity="0.7" />
      <path d="M 20 100 Q 100 70, 130 115 T 150 110" strokeWidth="0.5" strokeDasharray="2 1" opacity="0.5" />
      <line x1="110" y1="10" x2="110" y2="110" strokeDasharray="0.8 2" opacity="0.5" />
      <circle cx="110" cy="80" r="1.5" fill="currentColor" />
      <circle cx="110" cy="60" r="1" fill="currentColor" />
      <text x="115" y="82" fontFamily="monospace" fontSize="3.5" fill="currentColor" opacity="0.85">
        ELEV: 2480m
      </text>
      <text x="30" y="25" fontFamily="monospace" fontSize="3.5" fill="currentColor" opacity="0.5">
        LAT:31.23° N
      </text>
    </svg>
  );
}

/* ====== MOTIF-07: 等轴测三维量子节点阵列 ====== */
function Motif07(props: MotifProps) {
  return (
    <svg viewBox="0 0 160 120" fill="none" stroke="currentColor" strokeWidth="0.8" {...props}>
      <path d="M 80 20 L 120 40 L 80 60 L 40 40 Z" strokeWidth="1" />
      <path d="M 40 40 L 40 80 L 80 100 L 80 60" strokeWidth="0.8" />
      <path d="M 120 40 L 120 80 L 80 100" strokeWidth="0.8" />
      <path d="M 120 40 L 150 55 L 120 70 L 90 55 Z" strokeWidth="0.5" strokeDasharray="1 1.5" opacity="0.6" />
      <path d="M 80 60 L 120 80 L 80 100 L 40 80 Z" strokeWidth="1.2" stroke="#3b82f6" opacity="0.9" />
      <line x1="80" y1="20" x2="80" y2="0" strokeDasharray="1 1" />
      <circle cx="80" cy="20" r="1.5" fill="currentColor" />
      <circle cx="120" cy="40" r="1.5" fill="currentColor" />
      <circle cx="40" cy="40" r="1.5" fill="currentColor" />
      <circle cx="80" cy="60" r="2" fill="currentColor" />
      <text x="95" y="95" fontFamily="monospace" fontSize="3.5" fill="currentColor" opacity="0.8">
        ISO_GRID [3D_TENSOR]
      </text>
    </svg>
  );
}

/* ====== MOTIF-08: 精细贝塞尔曲率控制场 ====== */
function Motif08(props: MotifProps) {
  return (
    <svg viewBox="0 0 160 120" fill="none" stroke="currentColor" strokeWidth="0.8" {...props}>
      <path d="M 20 100 C 50 10, 110 110, 140 20" strokeWidth="1.2" stroke="#3b82f6" opacity="0.9" />
      <line x1="20" y1="100" x2="50" y2="10" strokeWidth="0.6" strokeDasharray="1.5 1.5" />
      <line x1="140" y1="20" x2="110" y2="110" strokeWidth="0.6" strokeDasharray="1.5 1.5" />
      <circle cx="20" cy="100" r="1.8" fill="currentColor" />
      <circle cx="140" cy="20" r="1.8" fill="currentColor" />
      <rect x="48" y="8" width="4" height="4" strokeWidth="0.6" fill="white" />
      <rect x="108" y="108" width="4" height="4" strokeWidth="0.6" fill="white" />
      <path d="M 30 85 L 38 90 M 50 58 L 60 62 M 80 48 L 90 52 M 110 52 L 120 50" strokeWidth="0.5" opacity="0.6" />
      <text x="30" y="20" fontFamily="monospace" fontSize="3.5" fill="currentColor" opacity="0.85">
        P1(50, 10) P2(110, 110)
      </text>
      <text x="85" y="112" fontFamily="monospace" fontSize="3.5" fill="currentColor" opacity="0.5">
        CURVATURE_CONTINUITY_C2
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
