import Hero from "@/components/Hero";
import RecruiterStrip from "@/components/RecruiterStrip";
import Assistant from "@/components/Assistant";
import Work from "@/components/Work";
import InterviewGuide from "@/components/InterviewGuide";
import Labs from "@/components/Labs";
import Approach from "@/components/Approach";
import Credentials from "@/components/Credentials";
import About from "@/components/About";
import Contact from "@/components/Contact";

export default function Page() {
  return (
    <>
      <Hero />
      <RecruiterStrip />
      {/* RAG before case studies — fastest proof for all three audiences */}
      <Assistant />
      <Work />
      <InterviewGuide />
      <Labs />
      <Approach />
      <Credentials />
      <About />
      <Contact />
    </>
  );
}
