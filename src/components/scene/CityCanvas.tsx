"use client";

import { useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";

import { WAYPOINTS, THEMES } from "./sceneConfig";
import { useTheme } from "@/lib/useTheme";
import Lighting from "./Lighting";
import City from "./City";
import Roads from "./Roads";
import Landmarks from "./Landmarks";
import River from "./River";
import Cars from "./Cars";
import Boats from "./Boats";
import CameraRig from "./CameraRig";

type Quality = "high" | "low";

/** Client-side capability sniff — decides quality tier + motion up front. */
function useCapabilities() {
  const [caps, setCaps] = useState({
    ready: false,
    reducedMotion: false,
    quality: "high" as Quality,
  });

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const smallOrWeak =
      window.innerWidth < 820 ||
      (navigator.hardwareConcurrency ?? 8) <= 4 ||
      coarse;
    setCaps({
      ready: true,
      reducedMotion,
      quality: smallOrWeak ? "low" : "high",
    });
  }, []);

  return caps;
}

export default function CityCanvas() {
  const { ready, reducedMotion, quality } = useCapabilities();
  const theme = useTheme();
  const [paused, setPaused] = useState(false);

  // Stop rendering when the tab is hidden to save the battery.
  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const motion = ready && !reducedMotion;
  const useShadows = quality === "high";
  const dpr = useMemo<[number, number]>(
    () => (quality === "low" ? [1, 1] : [1, 1.75]),
    [quality]
  );

  // Avoid a hydration flash / wrong tier or theme: wait until sniffed.
  if (!ready || !theme) return null;

  const palette = THEMES[theme];

  return (
    // key={theme} rebuilds instanced materials/colours cleanly on a theme flip.
    <Canvas
      key={theme}
      frameloop={paused ? "never" : "always"}
      shadows={useShadows ? "soft" : false}
      dpr={dpr}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        alpha: false,
      }}
      camera={{
        fov: 42,
        near: 1,
        far: 2000,
        position: [WAYPOINTS[0].pos.x, WAYPOINTS[0].pos.y, WAYPOINTS[0].pos.z],
      }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = palette.exposure;
        scene.background = new THREE.Color(palette.background);
      }}
    >
      <Lighting palette={palette} shadows={useShadows} />
      <City palette={palette} quality={quality} />
      <Roads palette={palette} />
      <Landmarks palette={palette} />
      <River palette={palette} motion={motion} />
      <Cars motion={motion} />
      <Boats palette={palette} motion={motion} />
      <CameraRig reducedMotion={reducedMotion} />
    </Canvas>
  );
}
