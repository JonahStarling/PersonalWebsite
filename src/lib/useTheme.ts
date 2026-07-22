"use client";

import { useEffect, useState } from "react";
import type { ThemeName } from "@/components/scene/sceneConfig";

/**
 * Follows the OS colour scheme (`prefers-color-scheme`) and updates live when
 * the user flips their system theme. Returns `null` until mounted so the
 * caller can avoid a hydration flash / wrong-theme first paint.
 */
export function useTheme(): ThemeName | null {
  const [theme, setTheme] = useState<ThemeName | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const apply = () => setTheme(mq.matches ? "light" : "dark");
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return theme;
}
