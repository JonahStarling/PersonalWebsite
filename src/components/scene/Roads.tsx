"use client";

import { useMemo } from "react";
import * as THREE from "three";
import {
  GRID,
  avenueXs,
  streetZs,
  islandZRange,
  westCoast,
  eastCoast,
  broadwayX,
  isOnIsland,
  BROADWAY,
  type Palette,
} from "./sceneConfig";

const ROAD_Y = 0.02; // just above the land so the grid reads, below the park

/**
 * The dark-asphalt road network — avenues, cross-streets, and the Broadway
 * diagonal — drawn as one merged flat mesh so the Manhattan grid reads clearly
 * from above. The primary-coloured cars drive along these lines.
 */
export default function Roads({ palette }: { palette: Palette }) {
  const geometry = useMemo(() => {
    const pos: number[] = [];
    const idx: number[] = [];

    // Add a flat quad (top-facing) spanning x0..x1 by z0..z1.
    const quad = (x0: number, x1: number, z0: number, z1: number) => {
      const a = pos.length / 3;
      pos.push(x0, ROAD_Y, z0, x1, ROAD_Y, z0, x0, ROAD_Y, z1, x1, ROAD_Y, z1);
      // wound so the normal points up (+Y)
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    };

    // Avenues (constant X, run N–S the length of the island).
    for (const x of avenueXs()) {
      const range = islandZRange(x, 2);
      if (!range) continue;
      quad(x - GRID.avenueRoad / 2, x + GRID.avenueRoad / 2, range[0], range[1]);
    }

    // Cross-streets (constant Z, run shore to shore).
    for (const z of streetZs()) {
      const w = westCoast(z) + 1;
      const e = eastCoast(z) - 1;
      if (e - w < 2) continue;
      quad(w, e, z - GRID.streetRoad / 2, z + GRID.streetRoad / 2);
    }

    // Broadway — a diagonal ribbon following broadwayX(z).
    {
      const steps = 120;
      const hw = GRID.avenueRoad / 2;
      for (let i = 0; i < steps; i++) {
        const z0 = THREE.MathUtils.lerp(BROADWAY.zMin, BROADWAY.zMax, i / steps);
        const z1 = THREE.MathUtils.lerp(
          BROADWAY.zMin,
          BROADWAY.zMax,
          (i + 1) / steps
        );
        // Clip to the island so Broadway never runs out over the water.
        const zm = (z0 + z1) / 2;
        if (!isOnIsland(broadwayX(zm), zm, hw)) continue;
        const cx0 = broadwayX(z0);
        const cx1 = broadwayX(z1);
        const a = pos.length / 3;
        pos.push(
          cx0 - hw, ROAD_Y, z0,
          cx0 + hw, ROAD_Y, z0,
          cx1 - hw, ROAD_Y, z1,
          cx1 + hw, ROAD_Y, z1
        );
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial color={palette.road} roughness={0.95} metalness={0} />
    </mesh>
  );
}
