"use client";

import { useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  CITY_D,
  ISLAND,
  eastCoast,
  westCoast,
  mulberry32,
  type Palette,
} from "./sceneConfig";

const NUM_TYPES = 4; // ferry, tug, barge, sailboat
const OFFSHORE = 22; // how far past the coast boats sit — clear of the piers

type Boat = {
  z: number;
  lane: number;
  speed: number;
  bobPhase: number;
  type: number;
  side: 1 | -1; // +1 East River, -1 Hudson
};

// Muted primaries for barge cargo containers (a little colour on the water).
const CONTAINERS = ["#b8443c", "#3a5da8", "#c9a63a", "#8b929c"];

/** A low-poly hull with a pointed bow, made by extruding a deck outline. */
function makeHull(len: number, wid: number, dep: number): THREE.BufferGeometry {
  const hl = len / 2;
  const hw = wid / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-hw, -hl); // stern port
  shape.lineTo(hw, -hl); // stern starboard
  shape.lineTo(hw, hl * 0.55); // starboard side
  shape.lineTo(hw * 0.35, hl); // bow shoulder
  shape.lineTo(-hw * 0.35, hl);
  shape.lineTo(-hw, hl * 0.55); // port side
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, { depth: dep, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2); // lay flat: length→Z, hull depth→Y
  geo.rotateY(Math.PI); // point the bow toward +Z
  geo.translate(0, -dep * 0.4, 0); // sink so the waterline sits mid-hull
  geo.computeVertexNormals();
  return geo;
}

export default function Boats({
  palette,
  motion = true,
}: {
  palette: Palette;
  motion?: boolean;
}) {
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const zSpan = CITY_D * 0.72;

  const boats = useMemo<Boat[]>(() => {
    const rng = mulberry32(451);
    return Array.from({ length: ISLAND.boats }, () => {
      const dir = rng() > 0.5 ? 1 : -1;
      return {
        z: (rng() * 2 - 1) * zSpan,
        lane: rng() * 8,
        speed: dir * (2.2 + rng() * 2.8),
        bobPhase: rng() * Math.PI * 2,
        type: Math.floor(rng() * NUM_TYPES),
        side: (rng() > 0.45 ? 1 : -1) as 1 | -1,
      };
    });
  }, [zSpan]);

  // Shared hull geometry per type.
  const hulls = useMemo(
    () => [
      makeHull(15, 5.2, 1.9), // 0 ferry
      makeHull(10, 4.6, 2.0), // 1 tug
      makeHull(18, 5.8, 1.6), // 2 barge
      makeHull(9, 3.4, 1.6), // 3 sailboat
    ],
    []
  );

  // A simple triangular sail (in the x=0 plane, extending aft).
  const sailGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute([0, 0.2, 0.6, 0, 6, 0.6, 0, 1, -3.8], 3)
    );
    g.computeVertexNormals();
    return g;
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    boats.forEach((b, i) => {
      const g = groupRefs.current[i];
      if (!g) return;
      if (motion) {
        b.z += b.speed * delta;
        if (b.z > zSpan) b.z = -zSpan;
        if (b.z < -zSpan) b.z = zSpan;
      }
      const coast = b.side > 0 ? eastCoast(b.z) : westCoast(b.z);
      const x = coast + b.side * (OFFSHORE + b.lane);
      g.position.set(x, 0.02 + Math.sin(t * 1.2 + b.bobPhase) * 0.12, b.z);
      g.rotation.z = Math.sin(t * 0.9 + b.bobPhase) * 0.05;
      g.rotation.x = Math.cos(t * 0.8 + b.bobPhase) * 0.03;
      g.rotation.y = b.speed > 0 ? 0 : Math.PI;
    });
  });

  return (
    <>
      {boats.map((b, i) => (
        <group
          key={i}
          ref={(el) => {
            groupRefs.current[i] = el;
          }}
        >
          {renderBoat(b.type, palette, hulls[b.type], sailGeo)}
        </group>
      ))}
    </>
  );
}

function hullMat(palette: Palette) {
  return (
    <meshStandardMaterial color={palette.boat} roughness={0.72} metalness={0.1} />
  );
}
function deckMat(palette: Palette) {
  return (
    <meshStandardMaterial
      color={palette.buildingLight}
      roughness={0.7}
      metalness={0.08}
    />
  );
}

function renderBoat(
  type: number,
  palette: Palette,
  hull: THREE.BufferGeometry,
  sailGeo: THREE.BufferGeometry
): ReactNode {
  const hullMesh = (
    <mesh geometry={hull} castShadow receiveShadow>
      {hullMat(palette)}
    </mesh>
  );

  if (type === 1) {
    // Tugboat — stubby hull, tall wheelhouse, fat funnel.
    return (
      <>
        {hullMesh}
        <mesh position={[0, 1.35, -0.6]} castShadow>
          <boxGeometry args={[2.8, 1.7, 3]} />
          {deckMat(palette)}
        </mesh>
        <mesh position={[0, 2.6, -1.8]} castShadow>
          <cylinderGeometry args={[0.55, 0.6, 1.8, 10]} />
          {hullMat(palette)}
        </mesh>
      </>
    );
  }

  if (type === 2) {
    // Barge — long, low hull carrying a few colourful containers.
    return (
      <>
        {hullMesh}
        {[-5.5, -1.8, 1.9, 5.4].map((z, i) => (
          <mesh key={i} position={[0, 1, z]} castShadow>
            <boxGeometry args={[3.4, 1.5, 3]} />
            <meshStandardMaterial
              color={CONTAINERS[i % CONTAINERS.length]}
              roughness={0.75}
              metalness={0.05}
            />
          </mesh>
        ))}
        <mesh position={[0, 1.4, -8]} castShadow>
          <boxGeometry args={[2.4, 1.6, 1.8]} />
          {deckMat(palette)}
        </mesh>
      </>
    );
  }

  if (type === 3) {
    // Sailboat — slim hull, mast and a triangular sail.
    return (
      <>
        {hullMesh}
        <mesh position={[0, 0.7, -0.6]} castShadow>
          <boxGeometry args={[1.6, 0.55, 3]} />
          {deckMat(palette)}
        </mesh>
        <mesh position={[0, 3.4, 0.6]} castShadow>
          <cylinderGeometry args={[0.12, 0.14, 6.4, 6]} />
          {hullMat(palette)}
        </mesh>
        <mesh geometry={sailGeo} position={[0, 0.5, 0]}>
          <meshStandardMaterial
            color={palette.buildingLight}
            roughness={0.9}
            metalness={0}
            side={THREE.DoubleSide}
          />
        </mesh>
      </>
    );
  }

  // Ferry (default) — big hull, two-deck cabin, funnel.
  return (
    <>
      {hullMesh}
      <mesh position={[0, 1.1, -1]} castShadow>
        <boxGeometry args={[4, 1.3, 9]} />
        {deckMat(palette)}
      </mesh>
      <mesh position={[0, 2.1, -1.8]} castShadow>
        <boxGeometry args={[3, 0.9, 5]} />
        {deckMat(palette)}
      </mesh>
      <mesh position={[0, 3, -3]} castShadow>
        <cylinderGeometry args={[0.45, 0.5, 1.5, 10]} />
        {hullMat(palette)}
      </mesh>
    </>
  );
}
