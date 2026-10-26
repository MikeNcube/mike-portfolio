import { NextResponse } from "next/server";
import { KNOWLEDGE_CHUNKS } from "@/lib/knowledge";
import { upstashConfigured } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    providers: {
      gemini: Boolean(process.env.GEMINI_API_KEY),
      groq: Boolean(process.env.GROQ_API_KEY),
      upstash: upstashConfigured(),
    },
    knowledgeBaseChunks: KNOWLEDGE_CHUNKS.length,
  });
}
