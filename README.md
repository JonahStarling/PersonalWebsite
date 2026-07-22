# Personal Website — Aerial Greyscale NYC

An impressive, single-page personal site with a live 3D aerial view of New York City
rendered in a dark greyscale theme. The camera flies between vantage points as you scroll,
cars drive the streets, and boats drift along the river.

Built with **Next.js 15 (App Router)**, **React Three Fiber / three.js**, **Framer Motion**,
and **Lenis** smooth scrolling.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Make it yours

Nearly everything you'll want to change lives in **one file**:

- **`src/lib/content.ts`** — your name, title, bio, projects, work history, résumé link,
  and social URLs. Search for `TODO` to find every placeholder.
- **Résumé PDF** — drop `resume.pdf` into a `public/` folder (create it) and it will be
  served at `/resume.pdf` (already wired to the “Download résumé” button).

## Tuning the 3D scene

All scene parameters are centralized in **`src/components/scene/sceneConfig.ts`**:

- `CITY` — grid size, building heights, density, skyscraper frequency.
- `RIVER` / `CARS` — river shape & boat count, number of cars and their speed.
- `WAYPOINTS` — the camera position + look-at target for each section (one per section,
  Hero → Résumé). Tweak these to re-choreograph the flythrough.
- `COLORS` — the greyscale palette.

## How it fits together

- `src/components/CityBackground.tsx` mounts the 3D canvas (client-only) as a fixed
  background with a blending gradient scrim over it.
- `src/components/scene/*` — the procedural city (`City`, `River`, `Cars`, `Boats`),
  `Lighting`, and the scroll-driven `CameraRig`.
- `src/components/SmoothScroll.tsx` runs Lenis and publishes scroll progress into
  `src/lib/scrollStore.ts`, which the camera reads every frame.
- `src/components/sections/*` — the five content sections (normal, accessible DOM).

## Performance & accessibility

- Buildings and cars are GPU-instanced; the building shadow map renders once then freezes.
- Rendering pauses when the tab is hidden; pixel ratio is capped.
- Small screens / low-core devices fall back to a lighter scene.
- `prefers-reduced-motion` freezes the camera and vehicles and disables bloom, showing a
  calm static aerial — the site stays fully usable.

## Deploy

Deploys to Vercel with zero config (`npm run build`).
