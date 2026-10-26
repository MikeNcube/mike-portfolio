"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";

function DiagramSkeleton() {
  return (
    <div
      className="min-h-[240px] rounded-lg bg-surface/60"
      aria-hidden
    />
  );
}

const DIAGRAMS: Record<string, ComponentType> = {
  "portfolio-rag-assistant": dynamic(() => import("./diagrams/RagDiagram"), {
    ssr: false,
    loading: DiagramSkeleton,
  }),
  sitewarden: dynamic(() => import("./diagrams/SitewardenDiagram"), {
    ssr: false,
    loading: DiagramSkeleton,
  }),
  "cube-agent": dynamic(() => import("./diagrams/CubeDiagram"), {
    ssr: false,
    loading: DiagramSkeleton,
  }),
  "zororo-crm": dynamic(() => import("./diagrams/CrmDiagram"), {
    ssr: false,
    loading: DiagramSkeleton,
  }),
  "zdi-signature-workflow": dynamic(() => import("./diagrams/ZdiDiagram"), {
    ssr: false,
    loading: DiagramSkeleton,
  }),
  "zororo-ai-os": dynamic(() => import("./diagrams/AiOsDiagram"), {
    ssr: false,
    loading: DiagramSkeleton,
  }),
  "zororo-claims": dynamic(() => import("./diagrams/ClaimsOpsDiagram"), {
    ssr: false,
    loading: DiagramSkeleton,
  }),
  "ai-social-agent": dynamic(() => import("./diagrams/SocialAgentDiagram"), {
    ssr: false,
    loading: DiagramSkeleton,
  }),
  "claims-pipeline": dynamic(() => import("./diagrams/ClaimsDiagram"), {
    ssr: false,
    loading: DiagramSkeleton,
  }),
  "digi-app-form": dynamic(() => import("./diagrams/DigiFormDiagram"), {
    ssr: false,
    loading: DiagramSkeleton,
  }),
  "proactive-sentinel": dynamic(() => import("./diagrams/SentinelDiagram"), {
    ssr: false,
    loading: DiagramSkeleton,
  }),
};

type Props = { slug: string };

// Defer diagram JS until the architecture block is near the viewport.
export default function ProjectDiagram({ slug }: Props) {
  const Diagram = DIAGRAMS[slug];
  const [ready, setReady] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!Diagram) return;
    const el = ref.current;
    if (!el) return;

    const reveal = () => setReady(true);
    if (typeof IntersectionObserver === "undefined") {
      reveal();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        reveal();
        observer.disconnect();
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [Diagram]);

  if (!Diagram) return null;

  return (
    <div ref={ref} className="min-h-[240px]">
      {ready ? <Diagram /> : <DiagramSkeleton />}
    </div>
  );
}
