"use client";

import { useMemo, useRef, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  CARS,
  avenueXs,
  streetZs,
  westCoast,
  eastCoast,
  islandHalfWidth,
  islandZRange,
  isOnIsland,
  isInPark,
  nearLandmark,
  mulberry32,
} from "./sceneConfig";

type Car = {
  axis: "x" | "z";
  fixed: number; // cross-street coordinate (road centerline)
  pos: number; // position along travel axis
  min: number;
  max: number;
  speed: number;
  dir: 1 | -1;
  colorIdx: number; // index into PRIMARIES
  typeIdx: number; // 0 sedan · 1 bus · 2 truck
};

const FADE = 9; // distance over which a car scales in/out at its lane ends

// The only colour in a greyscale city: each vehicle is one of the three primaries.
const PRIMARIES = ["#e23b34", "#2f66e0", "#f2c320"]; // red · blue · yellow

/** Three low-poly vehicle silhouettes for variety. */
function makeVehicleGeometries(): THREE.BufferGeometry[] {
  // 0 — sedan: body + smaller cabin
  const sBody = new THREE.BoxGeometry(1.2, 0.55, 2.6);
  sBody.translate(0, 0.275, 0);
  const sCab = new THREE.BoxGeometry(1.02, 0.5, 1.3);
  sCab.translate(0, 0.78, -0.15);
  const sedan = mergeGeometries([sBody, sCab], false);

  // 1 — bus/van: one tall, long box with a roof cap
  const bBody = new THREE.BoxGeometry(1.4, 1.15, 4.6);
  bBody.translate(0, 0.6, 0);
  const bRoof = new THREE.BoxGeometry(1.24, 0.12, 4.2);
  bRoof.translate(0, 1.23, 0);
  const bus = mergeGeometries([bBody, bRoof], false);

  // 2 — truck: a cab up front + a taller box trailer
  const tCab = new THREE.BoxGeometry(1.3, 1.0, 1.4);
  tCab.translate(0, 0.5, 1.35);
  const tBox = new THREE.BoxGeometry(1.4, 1.35, 2.9);
  tBox.translate(0, 0.675, -0.65);
  const truck = mergeGeometries([tCab, tBox], false);

  return [sedan, bus, truck];
}

const SEG_STEP = 3; // sampling step when scanning a lane for clear road
const MIN_RUN = 24; // shortest run of road worth spawning a car on

/** True where a car may drive: on land, off the park, clear of landmarks. */
function drivable(x: number, z: number): boolean {
  return isOnIsland(x, z, 4) && !isInPark(x, z, 2) && !nearLandmark(x, z);
}

/** Contiguous obstacle-free intervals along a lane. */
function freeSegments(
  axis: "x" | "z",
  fixed: number,
  lo: number,
  hi: number
): [number, number][] {
  const out: [number, number][] = [];
  let start: number | null = null;
  for (let t = lo; t <= hi; t += SEG_STEP) {
    const ok = axis === "z" ? drivable(fixed, t) : drivable(t, fixed);
    if (ok && start === null) start = t;
    else if (!ok && start !== null) {
      out.push([start, t - SEG_STEP]);
      start = null;
    }
  }
  if (start !== null) out.push([start, hi]);
  return out;
}

/** The longest clear run on a lane, if it clears the minimum length. */
function longestRun(
  axis: "x" | "z",
  fixed: number,
  lo: number,
  hi: number
): [number, number] | null {
  let best: [number, number] | null = null;
  for (const seg of freeSegments(axis, fixed, lo, hi)) {
    if (!best || seg[1] - seg[0] > best[1] - best[0]) best = seg;
  }
  return best && best[1] - best[0] >= MIN_RUN ? best : null;
}

export default function Cars({ motion = true }: { motion?: boolean }) {
  const ref0 = useRef<THREE.InstancedMesh>(null);
  const ref1 = useRef<THREE.InstancedMesh>(null);
  const ref2 = useRef<THREE.InstancedMesh>(null);
  const refs = useMemo(() => [ref0, ref1, ref2], []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geometries = useMemo(makeVehicleGeometries, []);

  // Group vehicles by type so each type is its own instanced mesh.
  const byType = useMemo<Car[][]>(() => {
    const rng = mulberry32(7);
    const avenues = avenueXs();
    const streets = streetZs().filter((z) => islandHalfWidth(z) > 14);

    const carOn = (axis: "x" | "z", fixed: number, run: [number, number]): Car | null => {
      const min = run[0] + 4;
      const max = run[1] - 4;
      if (max - min < 2) return null;
      const r = rng();
      const typeIdx = r < 0.64 ? 0 : r < 0.83 ? 1 : 2;
      return {
        axis,
        fixed,
        pos: min + rng() * (max - min),
        min,
        max,
        speed: CARS.speedMin + rng() * (CARS.speedMax - CARS.speedMin),
        dir: rng() > 0.5 ? 1 : -1,
        colorIdx: Math.floor(rng() * PRIMARIES.length),
        typeIdx,
      };
    };

    const tryCar = (): Car | null => {
      if (rng() > 0.45) {
        const x = avenues[Math.floor(rng() * avenues.length)] ?? 0;
        const range = islandZRange(x, 5);
        const run = range && longestRun("z", x, range[0], range[1]);
        if (run) return carOn("z", x, run);
      }
      const z = streets[Math.floor(rng() * streets.length)] ?? 0;
      const run = longestRun("x", z, westCoast(z) + 3, eastCoast(z) - 3);
      return run ? carOn("x", z, run) : null;
    };

    const list: Car[] = [];
    for (let guard = 0; list.length < CARS.count && guard < CARS.count * 8; guard++) {
      const car = tryCar();
      if (car) list.push(car);
    }
    const cRange = islandZRange(0, 5);
    const cRun = cRange && longestRun("z", 0, cRange[0], cRange[1]);
    while (cRun && list.length < CARS.count) {
      const car = carOn("z", 0, cRun);
      if (!car) break;
      list.push(car);
    }

    const groups: Car[][] = [[], [], []];
    for (const c of list) groups[c.typeIdx].push(c);
    return groups;
  }, []);

  // Paint each vehicle one of the three primary colours.
  useLayoutEffect(() => {
    const c = new THREE.Color();
    refs.forEach((ref, t) => {
      const mesh = ref.current;
      if (!mesh) return;
      byType[t].forEach((car, i) => {
        c.set(PRIMARIES[car.colorIdx]);
        mesh.setColorAt(i, c);
      });
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
  }, [byType, refs]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    refs.forEach((ref, t) => {
      const mesh = ref.current;
      if (!mesh) return;
      byType[t].forEach((c, i) => {
        if (motion) {
          c.pos += c.speed * c.dir * dt;
          if (c.pos > c.max) c.pos = c.min;
          if (c.pos < c.min) c.pos = c.max;
        }

        let x: number, z: number, rotY: number;
        if (c.axis === "z") {
          x = c.fixed + 1.5 * c.dir; // right-hand lane
          z = c.pos;
          rotY = c.dir > 0 ? 0 : Math.PI;
        } else {
          x = c.pos;
          z = c.fixed + 1.5 * c.dir;
          rotY = c.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        }

        // Fade (scale) in/out at the ends of the run so wrap-around isn't a pop.
        const edge = Math.min(c.pos - c.min, c.max - c.pos);
        const s = THREE.MathUtils.clamp(edge / FADE, 0, 1);

        dummy.position.set(x, 0.03, z);
        dummy.rotation.set(0, rotY, 0);
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    });
  });

  return (
    <>
      {geometries.map((geo, t) =>
        byType[t].length > 0 ? (
          <instancedMesh
            key={t}
            ref={refs[t]}
            args={[geo, undefined, byType[t].length]}
            castShadow
            receiveShadow
            frustumCulled={false}
          >
            <meshStandardMaterial color="#ffffff" roughness={0.7} metalness={0.05} />
          </instancedMesh>
        ) : null
      )}
    </>
  );
}
