"use client";

import dynamic from "next/dynamic";

// R3F is client-only; load the whole canvas without SSR.
const CityCanvas = dynamic(() => import("./scene/CityCanvas"), {
  ssr: false,
  loading: () => null,
});

export default function CityBackground() {
  return (
    <div className="fixed inset-0 z-0" aria-hidden="true">
      {/* The 3D city — never intercepts clicks */}
      <div className="absolute inset-0 pointer-events-none">
        <CityCanvas />
      </div>

      {/* Blending scrim: grounds the horizon and keeps text legible without
          hiding the city. Uses the theme scrim colour so it flips with the OS. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgb(var(--scrim) / 0.55) 0%, rgb(var(--scrim) / 0.08) 22%, rgb(var(--scrim) / 0) 45%, rgb(var(--scrim) / 0.15) 72%, rgb(var(--scrim) / 0.72) 100%)",
        }}
      />
      {/* Gentle side vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 40%, rgb(var(--scrim) / 0) 55%, rgb(var(--scrim) / 0.4) 100%)",
        }}
      />
    </div>
  );
}
