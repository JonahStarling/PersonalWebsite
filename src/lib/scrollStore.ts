/**
 * Tiny module-level bridge between the DOM scroll (driven by Lenis) and the
 * R3F render loop. We deliberately avoid React state here: the value is read
 * every frame inside `useFrame`, so a plain mutable ref keeps the 3D scene from
 * triggering React re-renders on scroll.
 */

export type ScrollState = {
  /** Normalized scroll progress across the whole page, 0..1 */
  progress: number;
  /** Total number of full-height sections, used to map progress -> waypoint */
  sections: number;
  /** Pointer position in normalized device-ish coords (-1..1), for subtle parallax */
  pointerX: number;
  pointerY: number;
};

export const scroll: ScrollState = {
  progress: 0,
  sections: 5,
  pointerX: 0,
  pointerY: 0,
};

/** Map global progress (0..1) to a floating section index (0..sections-1). */
export function progressToSection(progress: number, sections: number): number {
  return Math.max(0, Math.min(sections - 1, progress * (sections - 1)));
}
