"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CITY_W, CITY_D, type Palette } from "./sceneConfig";

/**
 * Soft daytime lighting + fog. The buildings are static, so we let the shadow
 * map render for the first few frames and then freeze it — this keeps crisp
 * block shadows without re-rendering ~700 instances every frame.
 */
export default function Lighting({
  palette,
  shadows = true,
}: {
  palette: Palette;
  shadows?: boolean;
}) {
  const gl = useThree((s) => s.gl);
  const frames = useRef(0);

  useFrame(() => {
    if (!shadows) return;
    if (frames.current < 4) {
      gl.shadowMap.needsUpdate = true;
      frames.current += 1;
    } else if (gl.shadowMap.autoUpdate) {
      gl.shadowMap.autoUpdate = false;
    }
  });

  const far = Math.max(CITY_W, CITY_D);

  return (
    <>
      <color attach="background" args={[palette.background]} />
      <fog attach="fog" args={[palette.fog, 110, far * 1.4]} />

      {/* Sky/ground fill keeps the greys flat and even (an architectural model) */}
      <hemisphereLight
        args={[palette.hemiSky, palette.hemiGround, palette.hemi]}
      />
      <ambientLight intensity={palette.ambient} />

      {/* The sun: a soft key that casts gentle block shadows */}
      <directionalLight
        position={[-120, 170, 90]}
        intensity={palette.sunIntensity}
        color={palette.sun}
        castShadow={shadows}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0004}
        shadow-camera-near={10}
        shadow-camera-far={950}
        shadow-camera-left={-far * 0.7}
        shadow-camera-right={far * 0.7}
        shadow-camera-top={far * 0.7}
        shadow-camera-bottom={-far * 0.7}
      />
    </>
  );
}
