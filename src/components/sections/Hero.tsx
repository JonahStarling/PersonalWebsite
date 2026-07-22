"use client";

import { motion } from "framer-motion";
import { Section } from "./Section";
import { ArrowDown } from "../icons";
import { site, hero } from "@/lib/content";

const ease = [0.16, 1, 0.3, 1] as const;

export default function Hero() {
  return (
    <Section id="hero">
      <div className="flex flex-col items-start">
        <motion.span
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease, delay: 0.15 }}
          className="mb-6 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest2 text-fgSubtle legible"
        >
          <span className="h-px w-8 bg-line/70" />
          {hero.kicker}
        </motion.span>

        <h1 className="font-display text-5xl font-semibold leading-[0.95] tracking-tight text-fg sm:text-7xl lg:text-8xl legible">
          {hero.headline.map((line, i) => (
            <motion.span
              key={i}
              className="block"
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease, delay: 0.25 + i * 0.12 }}
            >
              {line}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.55 }}
          className="mt-8 max-w-xl text-base leading-relaxed text-fgMuted sm:text-lg legible"
        >
          {hero.sub}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease, delay: 0.85 }}
          className="mt-10 flex items-center gap-3 text-sm text-fgSubtle legible"
        >
          <span className="font-medium text-fg">{site.name}</span>
          <span className="text-fgSubtle">·</span>
          <span>{site.role}</span>
          <span className="text-fgSubtle">·</span>
          <span>{site.location}</span>
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="pointer-events-none absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-fgSubtle legible"
      >
        <span className="text-[10px] uppercase tracking-widest2">Scroll</span>
        <motion.span
          animate={{ y: [0, 7, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown width={16} height={16} />
        </motion.span>
      </motion.div>
    </Section>
  );
}
