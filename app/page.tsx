import Hero from "@/components/Hero";
import Work from "@/components/Work";
import Assistant from "@/components/Assistant";
import Labs from "@/components/Labs";
import Approach from "@/components/Approach";
import About from "@/components/About";
import Contact from "@/components/Contact";

export default function Page() {
  return (
    <>
      {/* 1. Hero — role-led positioning, three CTAs */}
      <Hero />

      {/* 2. Selected work — production systems with repo links */}
      <Work />

      {/* 3. Live RAG assistant — the differentiator, usable in place */}
      <Assistant />

      {/* 4. Reference architectures & AWS labs, honestly labelled */}
      <Labs />

      {/* 5. Engineering approach */}
      <Approach />

      {/* 6. About */}
      <About />

      {/* 7. Contact — working form + direct links */}
      <Contact />
    </>
  );
}
