"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { type Palette } from "./sceneConfig";

/**
 * The sea. A single huge flat plane that surrounds the island and runs well
 * past the fog on every side, so the world never shows a visible edge. A very
 * faint shader shimmer keeps it alive (no textures).
 */
export default function River({
  palette,
  motion = true,
}: {
  palette: Palette;
  motion?: boolean;
}) {
  const shaderRef = useRef<{ uniforms: { uTime: { value: number } } } | null>(null);

  useFrame((_, delta) => {
    if (motion && shaderRef.current) {
      shaderRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
      <planeGeometry args={[6000, 6000, 1, 1]} />
      <meshStandardMaterial
        color={palette.river}
        roughness={0.5}
        metalness={0.2}
        onBeforeCompile={(shader) => {
          shader.uniforms.uTime = { value: 0 };
          shaderRef.current = shader as unknown as {
            uniforms: { uTime: { value: number } };
          };
          shader.vertexShader =
            "uniform float uTime;\n" +
            shader.vertexShader.replace(
              "#include <beginnormal_vertex>",
              `#include <beginnormal_vertex>
               objectNormal.x += 0.05 * sin(position.x * 0.12 + uTime * 0.5);
               objectNormal.y += 0.05 * cos(position.y * 0.14 - uTime * 0.4);
               objectNormal = normalize(objectNormal);`
            );
        }}
      />
    </mesh>
  );
}
