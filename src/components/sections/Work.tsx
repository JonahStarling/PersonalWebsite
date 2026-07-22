"use client";

import { Section, Reveal, Kicker } from "./Section";
import { work } from "@/lib/content";

export default function Work() {
  return (
    <Section id="work">
      <Reveal>
        <Kicker>Experience</Kicker>
      </Reveal>
      <Reveal delay={0.05}>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-fg sm:text-5xl legible">
          Professional work
        </h2>
      </Reveal>

      <div className="mt-10 glass rounded-3xl p-2 sm:p-4">
        <ol className="relative">
          {work.map((job, i) => (
            <Reveal key={job.company} delay={0.06 * i}>
              <li className="group grid grid-cols-1 gap-2 border-b border-line/40 p-6 last:border-0 sm:grid-cols-[200px_1fr] sm:gap-8 sm:p-8">
                <div className="text-sm text-fgSubtle">
                  <span className="tracking-wide">{job.period}</span>
                </div>
                <div>
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <h3 className="font-display text-xl font-semibold text-fg">
                      {job.role}
                    </h3>
                    <span className="text-fgSubtle">·</span>
                    <span className="text-base text-fg">{job.company}</span>
                  </div>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fgMuted">
                    {job.summary}
                  </p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </Section>
  );
}
