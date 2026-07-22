import SmoothScroll from "@/components/SmoothScroll";
import CityBackground from "@/components/CityBackground";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Projects from "@/components/sections/Projects";
import Work from "@/components/sections/Work";
import Resume from "@/components/sections/Resume";

export default function Home() {
  return (
    <SmoothScroll>
      <CityBackground />
      <main className="relative z-10">
        <Hero />
        <About />
        <Projects />
        <Work />
        <Resume />
      </main>
    </SmoothScroll>
  );
}
