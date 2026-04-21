import Hero from "@/components/Hero";
import Flagship from "@/components/Flagship";
import Agentic from "@/components/Agentic";
import Backend from "@/components/Backend";
import Pipelines from "@/components/Pipelines";
import Additional from "@/components/Additional";
import Approach from "@/components/Approach";
import About from "@/components/About";
import Contact from "@/components/Contact";

export default function Page() {
  return (
    <>
      {/* 1. Hero — positioning */}
      <Hero />

      {/* 2. Flagship AI systems — top 2–3 strongest, recruiter-first */}
      <Flagship />

      {/* 3. Agentic AI / LLM orchestration showcase */}
      <Agentic />

      {/* 4. Backend engineering (FastAPI / Flask) */}
      <Backend />

      {/* 5. Data pipelines / automation */}
      <Pipelines />

      {/* 6. Additional projects (low priority) */}
      <Additional />

      {/* 7. How I build systems — engineering mindset */}
      <Approach />

      {/* 8. About — minimal, non-generic */}
      <About />

      {/* 9. Contact */}
      <Contact />
    </>
  );
}
