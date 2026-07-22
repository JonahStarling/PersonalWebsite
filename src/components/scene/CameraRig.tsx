"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scroll } from "@/lib/scrollStore";
import { WAYPOINTS, STATIC_VIEW } from "./sceneConfig";

/**
 * Drives the camera along ONE continuous smooth path — a Catmull-Rom spline fit
 * through the waypoints — sampled directly by scroll progress. There are no
 * per-section eases, so the motion flows evenly from start to finish instead of
 * slowing to a stop at each waypoint. A little damping removes scroll jitter and
 * a touch of pointer parallax keeps the world alive when the page is still.
 */
export default function CameraRig({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const camera = useThree((s) => s.camera);

  // Two splines: one for the camera position, one for the look target.
  const { posCurve, lookCurve } = useMemo(() => {
    const posCurve = new THREE.CatmullRomCurve3(
      WAYPOINTS.map((w) => w.pos.clone()),
      false,
      "centripetal",
      0.5
    );
    const lookCurve = new THREE.CatmullRomCurve3(
      WAYPOINTS.map((w) => w.look.clone()),
      false,
      "centripetal",
      0.5
    );
    return { posCurve, lookCurve };
  }, []);

  const desiredPos = useRef(new THREE.Vector3());
  const desiredLook = useRef(new THREE.Vector3());
  const currentLook = useRef(new THREE.Vector3().copy(WAYPOINTS[0].look));
  const initialized = useRef(false);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    if (reducedMotion) {
      camera.position.copy(STATIC_VIEW.pos);
      camera.lookAt(STATIC_VIEW.look);
      return;
    }

    const t = THREE.MathUtils.clamp(scroll.progress, 0, 1);
    posCurve.getPoint(t, desiredPos.current);
    lookCurve.getPoint(t, desiredLook.current);

    // Subtle parallax from pointer position.
    desiredPos.current.x += scroll.pointerX * 5;
    desiredPos.current.y += -scroll.pointerY * 3;

    if (!initialized.current) {
      camera.position.copy(desiredPos.current);
      currentLook.current.copy(desiredLook.current);
      initialized.current = true;
    } else {
      const l = 4.5; // frame-rate independent damping
      camera.position.x = THREE.MathUtils.damp(camera.position.x, desiredPos.current.x, l, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, desiredPos.current.y, l, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, desiredPos.current.z, l, dt);
      currentLook.current.x = THREE.MathUtils.damp(currentLook.current.x, desiredLook.current.x, l, dt);
      currentLook.current.y = THREE.MathUtils.damp(currentLook.current.y, desiredLook.current.y, l, dt);
      currentLook.current.z = THREE.MathUtils.damp(currentLook.current.z, desiredLook.current.z, l, dt);
    }

    camera.lookAt(currentLook.current);
  });

  return null;
}
