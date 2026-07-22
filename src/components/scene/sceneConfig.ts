import * as THREE from "three";

/**
 * Single source of truth for the procedural city + camera choreography.
 * Coordinate system: XZ is the ground plane, +Y is up. The city is centered
 * on the origin. Avenues run north–south (constant X, spaced wide apart);
 * cross streets run east–west (constant Z, spaced closer) — Manhattan blocks
 * are long E–W and short N–S. A narrow river sits at the far east (+X) edge.
 */

// ── Theme palettes (greyscale — light follows the OS) ────────────────────────
export type ThemeName = "light" | "dark";

export type Palette = {
  background: string;
  fog: string;
  ground: string;
  road: string;
  park: string;
  buildingDark: string;
  buildingLight: string;
  landmark: string;
  river: string;
  boat: string;
  car: string;
  sun: string;
  hemiSky: string;
  hemiGround: string;
  ambient: number;
  hemi: number;
  sunIntensity: number;
  exposure: number;
};

export const THEMES: Record<ThemeName, Palette> = {
  // Medium greys — never black.
  dark: {
    background: "#3e4249",
    fog: "#3e4249",
    ground: "#4c525c", // land — clearly lighter than the water/sky
    road: "#3b4048", // asphalt — darker than the blocks so the grid reads
    park: "#5c626c",
    buildingDark: "#565c66",
    buildingLight: "#777e89",
    landmark: "#838a95",
    river: "#31353c", // water — distinctly darker so the coastline reads
    boat: "#7b818a",
    car: "#969ca5",
    sun: "#f4f5f7",
    hemiSky: "#767c85",
    hemiGround: "#3a3e44",
    ambient: 0.62,
    hemi: 0.95,
    sunIntensity: 0.9,
    exposure: 1.02,
  },
  // Near-white daytime model.
  light: {
    background: "#edeff2",
    fog: "#edeff2",
    ground: "#dbdfe5", // land — darker than the sky so the island reads
    road: "#c3c9d1", // asphalt — darker than the blocks so the grid reads
    park: "#e7eaee",
    buildingDark: "#c3c7cd",
    buildingLight: "#e1e4e8",
    landmark: "#eef0f3",
    river: "#c6ccd4", // water — darker still
    boat: "#a6acb4",
    car: "#99a0a8",
    sun: "#ffffff",
    hemiSky: "#ffffff",
    hemiGround: "#ccd0d6",
    ambient: 0.78,
    hemi: 0.9,
    sunIntensity: 0.92,
    exposure: 1.05,
  },
};

// ── City grid: avenues (X) + streets (Z) + packed blocks ─────────────────────
// Narrow and long to match Manhattan's proportions; the island silhouette
// (below) clips the grid so only the tapered island is built up.
export const GRID = {
  avenues: 7, // N–S roads (constant X)
  streets: 34, // E–W roads (constant Z) — extra length carries Uptown/Harlem

  avenueSpan: 30, // centerline distance between avenues (long block axis)
  streetSpan: 19, // centerline distance between streets (short block axis)
  avenueRoad: 8, // avenue carriageway width (wide)
  streetRoad: 5, // street carriageway width (narrow)
  lotGap: 1.7, // gap between building footprints within a block
  lotTarget: 10, // approximate lot size when subdividing a block
  gapChance: 0.09, // occasional empty lot / plaza (looser = less condensed)
  seed: 1337,
};

export const CITY_W = (GRID.avenues - 1) * GRID.avenueSpan;
export const CITY_D = (GRID.streets - 1) * GRID.streetSpan;

/** Avenue centerline X positions (centered on origin). */
export function avenueXs(): number[] {
  return Array.from(
    { length: GRID.avenues },
    (_, i) => -CITY_W / 2 + i * GRID.avenueSpan
  );
}

/** Street centerline Z positions (centered on origin). */
export function streetZs(): number[] {
  return Array.from(
    { length: GRID.streets },
    (_, j) => -CITY_D / 2 + j * GRID.streetSpan
  );
}

// ── Manhattan island silhouette ──────────────────────────────────────────────
// A long, narrow island with water on both sides (Hudson west, East River
// east), widest around lower-Midtown and tapering to a point at the south tip
// (the Battery). Buildings are clipped to this outline, giving the real shape.
export const ISLAND_SOUTH = CITY_D / 2; // +Z tip
export const ISLAND_NORTH = -CITY_D / 2;

export const ISLAND = {
  maxHalf: 76, // widest half-width (lower-Midtown)
  zWidest: 55, // Z of the widest point
  northHalf: 42, // half-width through Uptown/Harlem (stays fairly wide)
  tipTaper: 92, // length over which the south tip narrows to a point
  northTaper: 40, // softens the north tip (Inwood)
  lean: 0.04, // gentle eastward drift of the island's centerline
  boats: 8,
};

/** The island's centerline X for a given Z (a slight organic lean). */
export function centerX(z: number): number {
  return ISLAND.lean * z;
}

/** Island half-width at a given Z (0 at the south tip). */
export function islandHalfWidth(z: number): number {
  let base: number;
  if (z >= ISLAND.zWidest) {
    base = ISLAND.maxHalf;
  } else {
    const t = THREE.MathUtils.clamp(
      (z - ISLAND_NORTH) / (ISLAND.zWidest - ISLAND_NORTH),
      0,
      1
    );
    base = ISLAND.northHalf + (ISLAND.maxHalf - ISLAND.northHalf) * Math.pow(t, 0.85);
  }
  const south = THREE.MathUtils.clamp((ISLAND_SOUTH - z) / ISLAND.tipTaper, 0, 1);
  const north = THREE.MathUtils.clamp((z - ISLAND_NORTH) / ISLAND.northTaper, 0, 1);
  return Math.max(1.5, base * south * north);
}

export function eastCoast(z: number): number {
  return centerX(z) + islandHalfWidth(z);
}
export function westCoast(z: number): number {
  return centerX(z) - islandHalfWidth(z);
}

/** True when a point sits on the island (so we place buildings/roads there). */
export function isOnIsland(x: number, z: number, pad = 0): boolean {
  if (z > ISLAND_SOUTH || z < ISLAND_NORTH) return false;
  return x > westCoast(z) + pad && x < eastCoast(z) - pad;
}

/** Contiguous on-island Z-range for a fixed X (used to keep cars ashore). */
export function islandZRange(x: number, pad = 0): [number, number] | null {
  const step = 4;
  let zmin: number | null = null;
  let zmax: number | null = null;
  for (let z = ISLAND_NORTH; z <= ISLAND_SOUTH; z += step) {
    if (Math.abs(x - centerX(z)) < islandHalfWidth(z) - pad) {
      if (zmin === null) zmin = z;
      zmax = z;
    }
  }
  return zmin === null || zmax === null ? null : [zmin, zmax];
}

// ── Diorama: skyline zoning, Central Park, Broadway, landmarks ────────────────
// Orientation: +Z = south / downtown (near the hero camera), -Z = north / uptown.
// x = 0 is the center avenue ("Fifth").

/** Two tall clusters — FiDi toward the south tip, Midtown in the center. */
export const SKYLINE = {
  fidiZ: 258,
  fidiSigma: 50,
  midtownZ: 50,
  midtownSigma: 64,
  baseMin: 6,
  baseMax: 15,
  peakMin: 40,
  peakMax: 72,
};

function gaussian(z: number, center: number, sigma: number): number {
  const d = (z - center) / sigma;
  return Math.exp(-0.5 * d * d);
}

/** 0..1: how deep inside a tall cluster a given Z sits (the skyline humps). */
export function clusterFactor(z: number): number {
  return Math.max(
    gaussian(z, SKYLINE.fidiZ, SKYLINE.fidiSigma),
    gaussian(z, SKYLINE.midtownZ, SKYLINE.midtownSigma)
  );
}

/** 0..1 through Uptown/Harlem (north of Central Park), else 0. */
export function uptownFactor(z: number): number {
  if (z >= PARK.z0) return 0; // south of the park's north edge
  return THREE.MathUtils.clamp((PARK.z0 - z) / 45, 0, 1);
}

/** Height for a generic building at Z, given an rng sampler (0..1). */
export function skylineHeight(z: number, rng: () => number): number {
  const c = Math.pow(clusterFactor(z), 1.7);
  const base =
    SKYLINE.baseMin + Math.pow(rng(), 1.6) * (SKYLINE.baseMax - SKYLINE.baseMin);
  const peak = SKYLINE.peakMin + rng() * (SKYLINE.peakMax - SKYLINE.peakMin);
  let h = base + c * (peak - base) * (0.55 + 0.6 * rng());
  // Uptown / Harlem: lift the low-rise up into short-to-mid-rise blocks.
  h += uptownFactor(z) * (10 + rng() * 22);
  return h;
}

/** Central Park — a tall N–S clearing north of Midtown. */
export const PARK = { x0: -36, x1: 12, z0: -150, z1: -20 };
export function isInPark(x: number, z: number, pad = 0): boolean {
  return (
    x > PARK.x0 - pad &&
    x < PARK.x1 + pad &&
    z > PARK.z0 - pad &&
    z < PARK.z1 + pad
  );
}

/** Broadway — a gentle diagonal crossing the grid (Flatiron ↔ Times Square). */
export const BROADWAY = {
  xFlat: 0,
  zFlat: 100, // crosses Fifth (x=0) at the Flatiron
  xTimes: -30,
  zTimes: 12, // crosses Seventh at Times Square
  zMin: -230,
  zMax: 200,
  halfWidth: 3.4,
};
export function broadwayX(z: number): number {
  const slope =
    (BROADWAY.xTimes - BROADWAY.xFlat) / (BROADWAY.zTimes - BROADWAY.zFlat);
  return BROADWAY.xFlat + slope * (z - BROADWAY.zFlat);
}
export function isOnBroadway(x: number, z: number, pad = 0): boolean {
  if (z < BROADWAY.zMin || z > BROADWAY.zMax) return false;
  return Math.abs(x - broadwayX(z)) < BROADWAY.halfWidth + pad;
}

/** Hero buildings, modelled with a little detail in Landmarks.tsx. */
export type Landmark = {
  name: "one-wtc" | "empire-state" | "chrysler" | "flatiron";
  x: number;
  z: number;
  height: number;
  clear: number; // radius kept clear of generic buildings
};
// Spread down the island at roughly their real relative positions
// (One WTC far south → Flatiron/ESB/Chrysler mid → Times Square) so they no
// longer crowd each other.
export const LANDMARKS: Landmark[] = [
  { name: "one-wtc", x: -6, z: 258, height: 122, clear: 15 },
  { name: "flatiron", x: 0, z: 100, height: 27, clear: 8 },
  { name: "empire-state", x: -6, z: 62, height: 104, clear: 14 },
  { name: "chrysler", x: 28, z: 20, height: 94, clear: 13 },
];
export function nearLandmark(x: number, z: number): boolean {
  for (const l of LANDMARKS) {
    if ((x - l.x) ** 2 + (z - l.z) ** 2 < l.clear * l.clear) return true;
  }
  return false;
}

// ── Pocket parks & plazas (small green squares scattered off the grid) ───────
export type Plaza = { x: number; z: number; half: number };
export const PLAZAS: Plaza[] = [
  { x: -34, z: 44, half: 8 }, // Union-square-ish
  { x: 22, z: 78, half: 7 }, // Madison-ish
  { x: -46, z: -6, half: 6 }, // Bryant-ish
  { x: 34, z: -132, half: 7 }, // Upper East pocket
  { x: -40, z: 176, half: 6 }, // Lower Manhattan pocket
];
export function isInPlaza(x: number, z: number, pad = 0): boolean {
  for (const p of PLAZAS) {
    if (Math.abs(x - p.x) < p.half + pad && Math.abs(z - p.z) < p.half + pad)
      return true;
  }
  return false;
}

// ── Character detail (rooftops + waterfront) ─────────────────────────────────
export const DETAIL = {
  waterTowerChance: 0.16, // fraction of mid-height roofs that get a tank
  waterTowerMinH: 12, // only on buildings at least this tall
  waterTowerMaxH: 62, // ...and not the supertall towers
  rooftopChance: 0.42, // fraction of roofs with a setback tier / penthouse
  setbackMinH: 34, // buildings taller than this get a setback tier
};

/** Piers jutting into the rivers: side -1 = west (Hudson), +1 = east. */
export type Pier = { z: number; side: -1 | 1; len: number; width: number };
export const PIERS: Pier[] = [
  { z: 150, side: -1, len: 15, width: 5 },
  { z: 96, side: -1, len: 16, width: 5 },
  { z: 40, side: -1, len: 14, width: 4.5 },
  { z: -30, side: -1, len: 15, width: 5 },
  { z: -170, side: -1, len: 13, width: 4.5 },
  { z: 130, side: 1, len: 15, width: 5 },
  { z: 70, side: 1, len: 16, width: 5 },
  { z: 6, side: 1, len: 14, width: 4.5 },
  { z: -70, side: 1, len: 15, width: 5 },
  { z: -150, side: 1, len: 13, width: 4.5 },
];

// ── Vehicles ────────────────────────────────────────────────────────────────
export const CARS = { count: 84, speedMin: 7, speedMax: 15 };

// ── Camera waypoints, one per section (Hero → Resume) ───────────────────────
// pos = camera position, look = point the camera aims at.
export type Waypoint = { pos: THREE.Vector3; look: THREE.Vector3 };

// One continuous path: the camera holds a steady aerial angle (from the east,
// looking north-west and down) and glides smoothly *up* the island, so scroll
// reveals Downtown → Midtown → Central Park → Uptown/Harlem in one sweep.
// The CameraRig fits a single Catmull-Rom spline through these points.
export const WAYPOINTS: Waypoint[] = [
  // Hero — over the harbor / Downtown
  { pos: new THREE.Vector3(78, 128, 300), look: new THREE.Vector3(-6, 26, 150) },
  // About — Lower Manhattan into Midtown
  { pos: new THREE.Vector3(70, 124, 214), look: new THREE.Vector3(-8, 24, 74) },
  // Projects — over Midtown
  { pos: new THREE.Vector3(62, 122, 128), look: new THREE.Vector3(-8, 22, -4) },
  // Work — approaching Central Park
  { pos: new THREE.Vector3(54, 122, 44), look: new THREE.Vector3(-8, 22, -84) },
  // Resume — over the Park, Uptown/Harlem beyond
  { pos: new THREE.Vector3(48, 128, -34), look: new THREE.Vector3(-8, 22, -168) },
];

/** A calm overview used when prefers-reduced-motion is on (no flythrough). */
export const STATIC_VIEW: Waypoint = {
  pos: new THREE.Vector3(-140, 78, 108),
  look: new THREE.Vector3(-74, 0, 30),
};

// ── Deterministic RNG so the skyline is stable across reloads/SSR ────────────
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
