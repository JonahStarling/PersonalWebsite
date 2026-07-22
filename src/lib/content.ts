/**
 * ─────────────────────────────────────────────────────────────────────────
 *  EDIT ME — all site copy lives here.
 *  Swap the placeholder text/links below for your real details. Search for
 *  "TODO" to find every spot that should be personalized.
 * ─────────────────────────────────────────────────────────────────────────
 */

export const site = {
  name: "Jonah Starling",
  // TODO: replace with your real title / one-liner
  role: "Software Engineer",
  location: "New York City",
  email: "starling.jonah@gmail.com",
  // TODO: replace with your real profile URLs
  socials: {
    github: "https://github.com/", // TODO
    linkedin: "https://www.linkedin.com/", // TODO
  },
  // TODO: drop your resume PDF in /public and point this at it (e.g. "/resume.pdf")
  resumeUrl: "/resume.pdf",
};

export const hero = {
  kicker: "Aerial over New York",
  // TODO: make this yours
  headline: ["Building things", "worth looking at."],
  sub:
    "Engineer based in New York City. I design and build web experiences, " +
    "tools, and products — with an eye for the details that make them feel alive.",
};

export const about = {
  kicker: "About",
  heading: "A little about me",
  // TODO: rewrite in your own voice
  paragraphs: [
    "I’m a software engineer living in New York. I care about craft — the " +
      "kind of work where the interface disappears and the experience just feels right.",
    "Away from the keyboard you’ll find me wandering the city, chasing good " +
      "coffee, and getting lost in side projects that start as “what if I could…”.",
  ],
  facts: [
    { label: "Based in", value: "New York, NY" },
    { label: "Focus", value: "Web · Product · 3D" }, // TODO
    { label: "Currently", value: "Open to interesting work" }, // TODO
  ],
};

export type Project = {
  title: string;
  blurb: string;
  tags: string[];
  href?: string;
  year?: string;
};

// TODO: replace these three with your real projects
export const projects: Project[] = [
  {
    title: "Project One",
    blurb:
      "A short, punchy description of what it does and why it’s interesting. " +
      "Lead with the outcome, not the tech.",
    tags: ["TypeScript", "React", "WebGL"],
    href: "#",
    year: "2025",
  },
  {
    title: "Project Two",
    blurb:
      "Another highlight. Mention the problem you solved and one detail you’re " +
      "proud of.",
    tags: ["Next.js", "Node", "Postgres"],
    href: "#",
    year: "2024",
  },
  {
    title: "Project Three",
    blurb:
      "A third project — an experiment, an open-source tool, or a design you love.",
    tags: ["Three.js", "GLSL", "Design"],
    href: "#",
    year: "2024",
  },
];

export type Job = {
  company: string;
  role: string;
  period: string;
  summary: string;
};

// TODO: replace with your real experience
export const work: Job[] = [
  {
    company: "Company A",
    role: "Senior Software Engineer",
    period: "2023 — Present",
    summary:
      "One or two lines on your impact — what you owned, what you shipped, the " +
      "scale or outcome that mattered.",
  },
  {
    company: "Company B",
    role: "Software Engineer",
    period: "2021 — 2023",
    summary:
      "The problem space, your role on the team, and a result you’re proud of.",
  },
  {
    company: "Company C",
    role: "Software Engineer",
    period: "2019 — 2021",
    summary: "Where you started and the foundation you built there.",
  },
];

export const resume = {
  kicker: "Resume",
  heading: "Let’s build something.",
  sub:
    "Grab a copy of my resume, or reach out directly — I’m always happy to " +
    "talk about interesting problems.",
};

export const sectionIds = ["hero", "about", "projects", "work", "resume"] as const;
export type SectionId = (typeof sectionIds)[number];
