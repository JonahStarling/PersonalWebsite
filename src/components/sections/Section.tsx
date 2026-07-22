"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Full-height section that lets the 3D city show through behind it. */
export function Section({
  id,
  children,
  className = "",
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`relative flex min-h-screen w-full items-center justify-center px-6 py-24 sm:px-10 ${className}`}
    >
      <div className="mx-auto w-full max-w-5xl">{children}</div>
    </section>
  );
}

const ease = [0.16, 1, 0.3, 1] as const;

/** Fade + rise reveal as the element scrolls into view. */
export function Reveal({
  children,
  delay = 0,
  y = 22,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px -12% 0px" }}
      transition={{ duration: 0.9, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Small eyebrow label used above section headings. */
export function Kicker({ children }: { children: ReactNode }) {
  return (
    <span className="mb-4 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest2 text-fgSubtle">
      <span className="h-px w-8 bg-line/70" />
      {children}
    </span>
  );
}
