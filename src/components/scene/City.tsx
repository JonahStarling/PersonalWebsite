"use client";

import { useMemo, useRef, useLayoutEffect } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  GRID,
  avenueXs,
  streetZs,
  isOnIsland,
  isInPark,
  isInPlaza,
  isOnBroadway,
  nearLandmark,
  skylineHeight,
  eastCoast,
  westCoast,
  ISLAND_SOUTH,
  ISLAND_NORTH,
  PARK,
  PLAZAS,
  PIERS,
  DETAIL,
  mulberry32,
  type Palette,
} from "./sceneConfig";

type BuildingData = {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  shade: number; // 0..1 lightness jitter
};

export default function City({
  palette,
  quality = "high",
}: {
  palette: Palette;
  quality?: "high" | "low";
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const treesRef = useRef<THREE.InstancedMesh>(null);
  const roofsRef = useRef<THREE.InstancedMesh>(null);
  const towersRef = useRef<THREE.InstancedMesh>(null);
  const piersRef = useRef<THREE.InstancedMesh>(null);

  // Build the city block-by-block: between each pair of avenues (X) and streets
  // (Z) is a block, subdivided into lots with one building each. The avenue /
  // street carriageways stay clear, so a legible Manhattan grid emerges.
  const buildings = useMemo<BuildingData[]>(() => {
    const rng = mulberry32(GRID.seed);
    const avX = avenueXs();
    const stZ = streetZs();
    const list: BuildingData[] = [];
    // On low quality, merge streets pairwise to thin the geometry.
    const step = quality === "low" ? 2 : 1;

    for (let a = 0; a < avX.length - 1; a++) {
      const bx0 = avX[a] + GRID.avenueRoad / 2;
      const bx1 = avX[a + 1] - GRID.avenueRoad / 2;
      const blockW = bx1 - bx0;
      if (blockW <= 1) continue;
      const lotsX = Math.max(1, Math.round(blockW / GRID.lotTarget));
      const lotW = blockW / lotsX;

      for (let s = 0; s < stZ.length - 1; s += step) {
        const bz0 = stZ[s] + GRID.streetRoad / 2;
        const bz1 = stZ[Math.min(s + step, stZ.length - 1)] - GRID.streetRoad / 2;
        const blockD = bz1 - bz0;
        if (blockD <= 1) continue;
        const lotsZ = Math.max(1, Math.round(blockD / GRID.lotTarget));
        const lotD = blockD / lotsZ;

        for (let lx = 0; lx < lotsX; lx++) {
          for (let lz = 0; lz < lotsZ; lz++) {
            if (rng() < GRID.gapChance) continue;
            const cx = bx0 + (lx + 0.5) * lotW;
            const cz = bz0 + (lz + 0.5) * lotD;
            // Keep to the island; carve out Park, plazas, Broadway, landmarks.
            if (!isOnIsland(cx, cz, 3)) continue;
            if (
              isInPark(cx, cz) ||
              isInPlaza(cx, cz) ||
              isOnBroadway(cx, cz) ||
              nearLandmark(cx, cz)
            )
              continue;

            const h = skylineHeight(cz, rng); // taller in FiDi + Midtown clusters
            const w = Math.max(2, lotW - GRID.lotGap);
            const d = Math.max(2, lotD - GRID.lotGap);
            list.push({ x: cx, z: cz, w, d, h, shade: rng() });
          }
        }
      }
    }
    return list;
  }, [quality]);

  // Solid matte material — no emissive, no textures. Per-instance greyscale.
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ffffff", // white base; instanceColor supplies the real grey
        roughness: 0.92,
        metalness: 0.0,
      }),
    []
  );

  // The island landmass: a long tapered ribbon following both coastlines,
  // narrowing to a point at the south tip. Everything beyond it is open sea.
  const landGeometry = useMemo(() => {
    const steps = 140;
    const positions: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= steps; i++) {
      const z = THREE.MathUtils.lerp(ISLAND_NORTH, ISLAND_SOUTH, i / steps);
      // A visible shore margin beyond the outermost buildings.
      const west = westCoast(z) - 7;
      const east = eastCoast(z) + 7;
      positions.push(west, 0, z, east, 0, z);
      if (i < steps) {
        const a = i * 2;
        // Wound so the top face points up (+Y) — lit by the sun, not culled.
        indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, []);

  // A light scatter of low-poly trees — Central Park plus each pocket plaza.
  const trees = useMemo(() => {
    const rng = mulberry32(2024);
    const n = quality === "low" ? 26 : 56;
    const arr: { x: number; z: number; s: number }[] = [];
    for (let i = 0; i < n; i++) {
      const x = PARK.x0 + 2 + rng() * (PARK.x1 - PARK.x0 - 4);
      const z = PARK.z0 + 2 + rng() * (PARK.z1 - PARK.z0 - 4);
      arr.push({ x, z, s: 0.7 + rng() * 0.9 });
    }
    const perPlaza = quality === "low" ? 3 : 6;
    for (const p of PLAZAS) {
      for (let i = 0; i < perPlaza; i++) {
        const x = p.x + (rng() * 2 - 1) * (p.half - 1.5);
        const z = p.z + (rng() * 2 - 1) * (p.half - 1.5);
        arr.push({ x, z, s: 0.6 + rng() * 0.7 });
      }
    }
    return arr;
  }, [quality]);

  // Rooftop character: a setback tier on tall towers, else a small penthouse /
  // mechanical box — derived from the building list so they sit on real roofs.
  const roofs = useMemo(() => {
    const rng = mulberry32(909);
    const arr: { x: number; z: number; w: number; d: number; h: number; y: number; shade: number }[] = [];
    for (const b of buildings) {
      if (rng() > DETAIL.rooftopChance) continue;
      if (b.h > DETAIL.setbackMinH) {
        const th = Math.min(0.16 * b.h, 12);
        arr.push({ x: b.x, z: b.z, w: b.w * 0.62, d: b.d * 0.62, h: th, y: b.h + th / 2, shade: b.shade });
      } else {
        const ph = 1.4 + rng() * 1.4;
        arr.push({
          x: b.x + (rng() - 0.5) * b.w * 0.3,
          z: b.z + (rng() - 0.5) * b.d * 0.3,
          w: b.w * 0.34,
          d: b.d * 0.34,
          h: ph,
          y: b.h + ph / 2,
          shade: b.shade,
        });
      }
    }
    return arr;
  }, [buildings]);

  // Iconic rooftop water towers on a fraction of mid-height roofs.
  const towers = useMemo(() => {
    const rng = mulberry32(303);
    const cap = quality === "low" ? 0.6 : 1;
    const arr: { x: number; z: number; y: number; s: number }[] = [];
    for (const b of buildings) {
      if (b.h < DETAIL.waterTowerMinH || b.h > DETAIL.waterTowerMaxH) continue;
      if (rng() > DETAIL.waterTowerChance * cap) continue;
      arr.push({
        x: b.x + (rng() - 0.5) * b.w * 0.4,
        z: b.z + (rng() - 0.5) * b.d * 0.4,
        y: b.h,
        s: 0.8 + rng() * 0.5,
      });
    }
    return arr;
  }, [buildings, quality]);

  const towerGeometry = useMemo(() => {
    const support = new THREE.BoxGeometry(1.3, 0.9, 1.3);
    support.translate(0, 0.45, 0);
    const tank = new THREE.CylinderGeometry(0.85, 0.85, 1.3, 8);
    tank.translate(0, 1.55, 0);
    const cap = new THREE.ConeGeometry(0.95, 0.55, 8);
    cap.translate(0, 2.475, 0);
    return mergeGeometries([support, tank, cap], false);
  }, []);

  // Waterfront piers jutting into the rivers.
  const piers = useMemo(() => {
    const arr: { x: number; z: number; w: number; d: number }[] = [];
    for (const p of PIERS) {
      const coast = p.side < 0 ? westCoast(p.z) : eastCoast(p.z);
      const cx = coast + p.side * (p.len / 2 - 1); // overlap the shore slightly
      arr.push({ x: cx, z: p.z, w: p.len, d: p.width });
    }
    return arr;
  }, []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const dark = new THREE.Color(palette.buildingDark);
    const light = new THREE.Color(palette.buildingLight);
    const color = new THREE.Color();

    buildings.forEach((b, i) => {
      dummy.position.set(b.x, b.h / 2, b.z);
      dummy.scale.set(b.w, b.h, b.d);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      color.copy(dark).lerp(light, b.shade * b.shade);
      mesh.setColorAt(i, color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [buildings, palette]);

  const TREE_H = 3.4;
  useLayoutEffect(() => {
    const mesh = treesRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    trees.forEach((t, i) => {
      dummy.position.set(t.x, (TREE_H * t.s) / 2, t.z);
      dummy.scale.set(t.s, t.s, t.s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [trees]);

  // Rooftop boxes (unit box scaled per instance), tinted like their building.
  useLayoutEffect(() => {
    const mesh = roofsRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const dark = new THREE.Color(palette.buildingDark);
    const light = new THREE.Color(palette.buildingLight);
    const color = new THREE.Color();
    roofs.forEach((r, i) => {
      dummy.position.set(r.x, r.y, r.z);
      dummy.scale.set(r.w, r.h, r.d);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      color.copy(dark).lerp(light, r.shade * r.shade);
      mesh.setColorAt(i, color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [roofs, palette]);

  // Water towers (merged tank geometry) placed on roofs.
  useLayoutEffect(() => {
    const mesh = towersRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    towers.forEach((t, i) => {
      dummy.position.set(t.x, t.y, t.z);
      dummy.scale.set(t.s, t.s, t.s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [towers]);

  // Piers (thin boxes) sitting just above the water.
  useLayoutEffect(() => {
    const mesh = piersRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    piers.forEach((p, i) => {
      dummy.position.set(p.x, 0.12, p.z);
      dummy.scale.set(p.w, 0.4, p.d);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [piers]);

  const parkW = PARK.x1 - PARK.x0;
  const parkD = PARK.z1 - PARK.z0;

  return (
    <group>
      {/* Island landmass (the rest of the world is sea) */}
      <mesh geometry={landGeometry} position={[0, 0, 0]} receiveShadow>
        <meshStandardMaterial color={palette.ground} roughness={1} metalness={0} />
      </mesh>

      {/* Central Park — a lighter flat clearing with a scatter of trees */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[PARK.x0 + parkW / 2, 0.04, PARK.z0 + parkD / 2]}
        receiveShadow
      >
        <planeGeometry args={[parkW, parkD]} />
        <meshStandardMaterial color={palette.park} roughness={1} metalness={0} />
      </mesh>

      {/* Pocket parks & plazas */}
      {PLAZAS.map((p, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[p.x, 0.03, p.z]}
          receiveShadow
        >
          <planeGeometry args={[p.half * 2, p.half * 2]} />
          <meshStandardMaterial color={palette.park} roughness={1} metalness={0} />
        </mesh>
      ))}

      <instancedMesh
        ref={treesRef}
        args={[undefined, undefined, trees.length]}
        castShadow
      >
        <coneGeometry args={[1.15, TREE_H, 6]} />
        <meshStandardMaterial
          color={palette.buildingDark}
          roughness={0.95}
          metalness={0}
        />
      </instancedMesh>

      {/* Buildings */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, buildings.length]}
        material={material}
        castShadow
        receiveShadow
        frustumCulled
      >
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>

      {/* Rooftop setbacks / penthouses (tinted like their building) */}
      <instancedMesh
        ref={roofsRef}
        args={[undefined, undefined, roofs.length]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.92} metalness={0} />
      </instancedMesh>

      {/* Rooftop water towers */}
      <instancedMesh
        ref={towersRef}
        args={[towerGeometry, undefined, towers.length]}
        castShadow
      >
        <meshStandardMaterial
          color={palette.buildingDark}
          roughness={0.9}
          metalness={0}
        />
      </instancedMesh>

      {/* Waterfront piers */}
      <instancedMesh
        ref={piersRef}
        args={[undefined, undefined, piers.length]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={palette.road} roughness={0.95} metalness={0} />
      </instancedMesh>
    </group>
  );
}
