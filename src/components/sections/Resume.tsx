"use client";

import { Section, Reveal, Kicker } from "./Section";
import { Download, Mail, Github, Linkedin } from "../icons";
import { site, resume } from "@/lib/content";

export default function Resume() {
  return (
    <Section id="resume">
      <div className="glass rounded-3xl p-8 text-center sm:p-14">
        <Reveal>
          <Kicker>{resume.kicker}</Kicker>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold tracking-tight text-fg sm:text-5xl">
            {resume.heading}
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-fgMuted">
            {resume.sub}
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={site.resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-accentFg transition-transform hover:scale-[1.03]"
            >
              <Download width={17} height={17} />
              Download résumé
            </a>
            <a
              href={`mailto:${site.email}`}
              className="inline-flex items-center gap-2 rounded-full border border-line/70 px-6 py-3 text-sm font-medium text-fg transition-colors hover:border-fg/60 hover:text-fg"
            >
              <Mail width={17} height={17} />
              {site.email}
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-10 flex items-center justify-center gap-4">
            <SocialLink href={site.socials.github} label="GitHub">
              <Github />
            </SocialLink>
            <SocialLink href={site.socials.linkedin} label="LinkedIn">
              <Linkedin />
            </SocialLink>
          </div>
        </Reveal>
      </div>

      <p className="mt-10 text-center text-xs text-fgSubtle">
        © {site.name} · Built in New York
      </p>
    </Section>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-line/60 text-fgSubtle transition-all hover:-translate-y-0.5 hover:border-fg/60 hover:text-fg"
    >
      {children}
    </a>
  );
}
