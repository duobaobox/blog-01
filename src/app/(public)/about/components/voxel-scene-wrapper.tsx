"use client";

import dynamic from "next/dynamic";

export const VoxelScene = dynamic(
  () => import("./voxel-scene").then((mod) => mod.VoxelScene),
  { ssr: false },
);
