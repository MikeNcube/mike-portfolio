import Hero from "@/components/Hero";
import Assistant from "@/components/Assistant";
import Work from "@/components/Work";
import About from "@/components/About";
import Contact from "@/components/Contact";

export default function Page() {
  return (
    <>
      <Hero />
      <Assistant />
      <Work />
      <About />
      <Contact />
      {/*
        NOTES SCAFFOLD — NOT PUBLISHED. Awaiting Mike's content and approval.
        Uncomment and populate when ready:

        <section id="notes" className="section">
          <div className="container-edge">
            <h2>Notes</h2>
            <p>[Draft entries — Mike to write and approve before publishing]</p>
          </div>
        </section>
      */}
    </>
  );
}
