"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  PresentationControls,
  ContactShadows,
  Environment,
  Outlines,
} from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useTheme } from "next-themes";
import { useEffect, useState, useRef, useMemo } from "react";
import * as THREE from "three";

// A utility to generate a box mesh easily
const Voxel = ({
  position,
  color,
  emissive = "black",
  emissiveIntensity = 0,
}: {
  position: [number, number, number];
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
}) => {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        roughness={0.7}
        metalness={0.1}
      />
      <Outlines thickness={0.05} color="#000000" />
    </mesh>
  );
};

// Voxel Laptop
const VoxelLaptop = ({ theme }: { theme: string }) => {
  const isDark = theme === "dark";
  const bodyColor = isDark ? "#334155" : "#e2e8f0"; // slate-700 / slate-200
  const screenColor = isDark ? "#0ea5e9" : "#3b82f6"; // primary/accent glow
  const screenBg = isDark ? "#0f172a" : "#1e293b"; 
  const keyColor = isDark ? "#1e293b" : "#94a3b8";

  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef} position={[0, -1, 0]}>
      {/* Base */}
      {Array.from({ length: 14 }).map((_, x) =>
        Array.from({ length: 10 }).map((_, z) => (
          <Voxel
            key={`base-${x}-${z}`}
            position={[x - 6.5, 0, z - 4.5]}
            color={bodyColor}
          />
        ))
      )}

      {/* Keyboard */}
      {Array.from({ length: 10 }).map((_, x) =>
        Array.from({ length: 4 }).map((_, z) => (
          <Voxel
            key={`key-${x}-${z}`}
            position={[x - 4.5, 0.5, z - 3.5]}
            color={keyColor}
          />
        ))
      )}
      {/* Trackpad */}
      {Array.from({ length: 3 }).map((_, x) =>
        Array.from({ length: 2 }).map((_, z) => (
          <Voxel
            key={`trackpad-${x}-${z}`}
            position={[x - 1, 0.5, z + 1.5]}
            color={keyColor}
          />
        ))
      )}

      {/* Screen Lid (Vertical/Angled back slightly, using rotated group) */}
      <group position={[0, 0.5, -5]} rotation={[-0.1, 0, 0]}>
        {Array.from({ length: 14 }).map((_, x) =>
          Array.from({ length: 9 }).map((_, y) => {
            const isScreenEdge =
              x === 0 || x === 13 || y === 0 || y === 8;
            const isLogo = x === 6 && y === 4;

            // Back of screen
            const backVoxels = (
              <Voxel
                key={`screen-back-${x}-${y}`}
                position={[x - 6.5, y + 0.5, -0.5]}
                color={bodyColor}
              />
            );

            // Front of screen
            let frontColor = screenBg;
            let emissive = "black";
            let emissiveIntensity = 0;

            if (isScreenEdge) frontColor = bodyColor;
            else {
              // decorative code lines
              if ((x > 2 && x < 10 && y === 6) || (x > 2 && x < 7 && y === 5)) {
                frontColor = screenColor;
                emissive = screenColor;
                emissiveIntensity = 3;
              }
            }

            const frontVoxels = (
              <Voxel
                key={`screen-front-${x}-${y}`}
                position={[x - 6.5, y + 0.5, 0.5]}
                color={frontColor}
                emissive={emissive}
                emissiveIntensity={emissiveIntensity}
              />
            );

            return (
              <group key={`lid-${x}-${y}`}>
                {backVoxels}
                {frontVoxels}
                {isLogo && (
                  <Voxel
                    position={[x - 6.5, y + 0.5, -1]}
                    color={screenColor}
                    emissive={screenColor}
                    emissiveIntensity={1}
                  />
                )}
              </group>
            );
          })
        )}
      </group>
    </group>
  );
};

// Voxel Coffee Mug
const VoxelCoffee = ({ position, theme }: { position: [number, number, number]; theme: string }) => {
  const isDark = theme === "dark";
  const mugColor = isDark ? "#ef4444" : "#f87171"; // red
  const coffeeColor = "#451a03";

  return (
    <group position={position}>
      {/* Mug Base & Walls */}
      {Array.from({ length: 4 }).map((_, x) =>
        Array.from({ length: 4 }).map((_, z) =>
          Array.from({ length: 5 }).map((_, y) => {
            const r = Math.sqrt((x - 1.5) ** 2 + (z - 1.5) ** 2);
            if (r > 2) return null; // Make it roughly cylindrical
            
            const isBase = y === 0;
            const isWall = r > 1.2 && y > 0;
            const isCoffee = !isWall && y === 3;
            
            if (!isBase && !isWall && !isCoffee) return null;

            return (
              <Voxel
                key={`mug-${x}-${y}-${z}`}
                position={[x - 1.5, y, z - 1.5]}
                color={isCoffee ? coffeeColor : mugColor}
              />
            );
          })
        )
      )}
      {/* Handle */}
      {Array.from({ length: 3 }).map((_, y) => (
        <Voxel key={`handle-${y}`} position={[2.5, y + 1, 0]} color={mugColor} />
      ))}
      <Voxel position={[2.5, 3, 0]} color={mugColor} />
      <Voxel position={[2.5, 1, 0]} color={mugColor} />
      <Voxel position={[3.5, 2, 0]} color={mugColor} />
    </group>
  );
};

// Floating bits and particles
const Particles = ({ theme }: { theme: string }) => {
  const isDark = theme === "dark";
  const colors = isDark 
    ? ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"] 
    : ["#60a5fa", "#a78bfa", "#34d399", "#fbbf24"];
    
  const particles = useMemo(() => {
    return Array.from({ length: 20 }).map(() => ({
      position: [
        (Math.random() - 0.5) * 25,
        (Math.random() - 0.5) * 15 + 5,
        (Math.random() - 0.5) * 20 - 5
      ] as [number, number, number],
      color: colors[Math.floor(Math.random() * colors.length)],
      scale: Math.random() * 0.5 + 0.2
    }));
  }, [colors]);

  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.05;
      groupRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.5;
    }
  });

  return (
    <group ref={groupRef}>
      {particles.map((p, i) => (
        <mesh key={i} position={p.position} scale={p.scale}>
          <boxGeometry />
          <meshStandardMaterial color={p.color} />
          <Outlines thickness={0.05} color="#000000" />
        </mesh>
      ))}
    </group>
  );
};

export function VoxelScene() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-muted/20 rounded-xl border border-border/50">
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-primary/40 animate-bounce" />
          <div className="w-4 h-4 rounded-full bg-primary/40 animate-bounce [animation-delay:-.15s]" />
          <div className="w-4 h-4 rounded-full bg-primary/40 animate-bounce [animation-delay:-.3s]" />
        </div>
      </div>
    );
  }

  const theme = resolvedTheme || "light";

  return (
    <div className="w-full h-[400px] sm:h-[500px] w-full rounded-xl overflow-hidden bg-gradient-to-br from-background via-accent/5 to-background border border-border/50 relative shadow-sm">
      <Canvas
        camera={{ position: [20, 15, 25], fov: 35 }}
        shadows
        gl={{ preserveDrawingBuffer: true, antialias: false }} // pixel art style looks better without/with specific antialiasing, but we'll leave it simple
      >
        <color attach="background" args={theme === "dark" ? ["#09090b"] : ["#fafafa"]} />
        <ambientLight intensity={theme === "dark" ? 0.8 : 1.2} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={theme === "dark" ? 1.5 : 2}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-10, 0, -20]} intensity={theme === "dark" ? 2 : 1.5} color="#3b82f6" />
        <pointLight position={[0, -10, 0]} intensity={1} />
        
        <Environment preset="city" />

        <PresentationControls
          global
          rotation={[0, 0.3, 0]}
          polar={[-Math.PI / 3, Math.PI / 3]}
          azimuth={[-Math.PI / 1.4, Math.PI / 2]}
        >
          <Float
            speed={2}
            rotationIntensity={0.5}
            floatIntensity={1.5}
            floatingRange={[-0.5, 0.5]}
          >
            <VoxelLaptop theme={theme} />
            <VoxelCoffee position={[9, 0, -2]} theme={theme} />
            <Particles theme={theme} />
          </Float>
        </PresentationControls>

        <ContactShadows
          position={[0, -5, 0]}
          opacity={theme === "dark" ? 0.3 : 0.2}
          scale={40}
          blur={1.5}
          far={10}
        />

        <EffectComposer>
          <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} />
        </EffectComposer>
      </Canvas>
      <div className="absolute bottom-4 left-4 text-xs text-muted-foreground/60 select-none flex items-center gap-1.5 font-mono">
        <span className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" />
        拖动以旋转
      </div>
    </div>
  );
}
