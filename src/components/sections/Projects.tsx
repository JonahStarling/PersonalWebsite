"use client";

import { Section, Reveal, Kicker } from "./Section";
import { ArrowUpRight } from "../icons";
import { projects } from "@/lib/content";

export default function Projects() {
  return (
    <Section id="projects">
      <Reveal>
        <Kicker>Selected work</Kicker>
      </Reveal>
      <Reveal delay={0.05}>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-fg sm:text-5xl legible">
          Personal projects
        </h2>
      </Reveal>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p, i) => (
          <Reveal key={p.title} delay={0.08 * i}>
            <a
              href={p.href ?? "#"}
              target={p.href && p.href !== "#" ? "_blank" : undefined}
              rel="noreferrer"
              className="group flex h-full flex-col rounded-2xl glass p-6 transition-all duration-300 hover:-translate-y-1 hover:border-fg/30"
            >
              <div className="flex items-start justify-between">
                <span className="text-xs uppercase tracking-widest2 text-fgSubtle">
                  {p.year}
                </span>
                <ArrowUpRight
                  className="text-fgSubtle transition-colors group-hover:text-fg"
                  width={18}
                  height={18}
                />
              </div>

              <h3 className="mt-6 font-display text-xl font-semibold text-fg">
                {p.title}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-fgMuted">
                {p.blurb}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {p.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-line/60 px-3 py-1 text-[11px] text-fgSubtle"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </a>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
