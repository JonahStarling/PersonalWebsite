"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { LANDMARKS, BROADWAY, type Palette } from "./sceneConfig";

/**
 * A handful of recognizable hero buildings, modelled low-poly in greyscale so
 * the diorama reads as New York at a glance. Rendered a touch lighter than the
 * generic massing so they stand out. Everything is a few primitives sharing a
 * single material — cheap.
 */
export default function Landmarks({ palette }: { palette: Palette }) {
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: palette.landmark,
        roughness: 0.85,
        metalness: 0.06,
      }),
    [palette]
  );

  return (
    <group>
      {LANDMARKS.map((l) => {
        if (l.name === "one-wtc") {
          // Tapered square obelisk + antenna spire.
          return (
            <group key={l.name} position={[l.x, 0, l.z]}>
              <mesh castShadow receiveShadow position={[0, 49, 0]} rotation={[0, Math.PI / 4, 0]} material={material}>
                <cylinderGeometry args={[5, 11, 98, 4]} />
              </mesh>
              <mesh castShadow position={[0, 106, 0]} material={material}>
                <cylinderGeometry args={[0.35, 0.35, 16, 6]} />
              </mesh>
            </group>
          );
        }

        if (l.name === "empire-state") {
          // Stacked setbacks + antenna.
          return (
            <group key={l.name} position={[l.x, 0, l.z]}>
              <mesh castShadow receiveShadow position={[0, 9, 0]} material={material}>
                <boxGeometry args={[30, 18, 24]} />
              </mesh>
              <mesh castShadow position={[0, 38, 0]} material={material}>
                <boxGeometry args={[20, 40, 16]} />
              </mesh>
              <mesh castShadow position={[0, 69, 0]} material={material}>
                <boxGeometry args={[12, 22, 10]} />
              </mesh>
              <mesh castShadow position={[0, 84.5, 0]} material={material}>
                <boxGeometry args={[7, 9, 6]} />
              </mesh>
              <mesh castShadow position={[0, 96, 0]} material={material}>
                <cylinderGeometry args={[0.4, 0.4, 14, 6]} />
              </mesh>
            </group>
          );
        }

        if (l.name === "chrysler") {
          // Shaft + stepped tapered crown + needle.
          return (
            <group key={l.name} position={[l.x, 0, l.z]}>
              <mesh castShadow receiveShadow position={[0, 29, 0]} material={material}>
                <boxGeometry args={[16, 58, 16]} />
              </mesh>
              <mesh castShadow position={[0, 61, 0]} material={material}>
                <cylinderGeometry args={[5.5, 6.7, 6, 12]} />
              </mesh>
              <mesh castShadow position={[0, 67, 0]} material={material}>
                <cylinderGeometry args={[4, 5.5, 6, 12]} />
              </mesh>
              <mesh castShadow position={[0, 73, 0]} material={material}>
                <cylinderGeometry args={[2.5, 4, 6, 12]} />
              </mesh>
              <mesh castShadow position={[0, 79, 0]} material={material}>
                <cylinderGeometry args={[1, 2.5, 6, 12]} />
              </mesh>
              <mesh castShadow position={[0, 90, 0]} material={material}>
                <cylinderGeometry args={[0.3, 0.3, 16, 6]} />
              </mesh>
            </group>
          );
        }

        // flatiron — a thin triangular wedge pointing south.
        return (
          <mesh
            key={l.name}
            castShadow
            receiveShadow
            position={[l.x, 13.5, l.z]}
            rotation={[0, -Math.PI / 2, 0]}
            scale={[0.62, 1, 1.7]}
            material={material}
          >
            <cylinderGeometry args={[5, 5, 27, 3]} />
          </mesh>
        );
      })}

      {/* Times Square — an open bowtie plaza hinted by a few billboard stubs */}
      <group position={[BROADWAY.xTimes, 0, BROADWAY.zTimes]}>
        <mesh castShadow receiveShadow position={[-4, 14, -7]} material={material}>
          <boxGeometry args={[9, 28, 7]} />
        </mesh>
        <mesh castShadow receiveShadow position={[6, 11, 5]} material={material}>
          <boxGeometry args={[8, 22, 8]} />
        </mesh>
        <mesh castShadow receiveShadow position={[-7, 9, 6]} material={material}>
          <boxGeometry args={[6, 18, 6]} />
        </mesh>
      </group>
    </group>
  );
}
