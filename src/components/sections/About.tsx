"use client";

import { Section, Reveal, Kicker } from "./Section";
import { about } from "@/lib/content";

export default function About() {
  return (
    <Section id="about">
      <div className="glass rounded-3xl p-8 sm:p-12">
        <Reveal>
          <Kicker>{about.kicker}</Kicker>
        </Reveal>

        <Reveal delay={0.05}>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-fg sm:text-5xl">
            {about.heading}
          </h2>
        </Reveal>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-5">
            {about.paragraphs.map((p, i) => (
              <Reveal key={i} delay={0.1 + i * 0.08}>
                <p className="text-base leading-relaxed text-fgMuted sm:text-lg">
                  {p}
                </p>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.2}>
            <dl className="space-y-5 border-l border-line/50 pl-6">
              {about.facts.map((f) => (
                <div key={f.label}>
                  <dt className="text-xs uppercase tracking-widest2 text-fgSubtle">
                    {f.label}
                  </dt>
                  <dd className="mt-1 text-base text-fg">{f.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
