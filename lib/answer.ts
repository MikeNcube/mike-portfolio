// Fallback chain: Gemini → Groq → closest static CV answer → email.
// Never throws to the caller for provider failures.

import { matchStaticAnswer, sourcesFor } from "./static-answers";
import {
  filterToLinkSources,
  MIN_RELEVANCE_SCORE,
  retrieve,
  type RetrievedChunk,
} from "./rag";
import { isRefusal } from "./refusal";
import { geminiAvailable, groqAvailable } from "./providers";
import { acquireGenerationSlot, allowInstanceGeneration, releaseGenerationSlot } from "./quota";

export const EMAIL_FALLBACK =
  "I don't have information about that in my knowledge base — it covers Mike's projects, skills, and experience. Email him at mikencube03@gmail.com for anything else.";

export type AnswerVia = "gemini" | "groq" | "static" | "email";

export type AnswerResult = {
  response: string;
  sources: Array<{ title: string; url: string }>;
  via: AnswerVia;
};

export type GenerateFn = (prompt: string) => Promise<string>;

const AUDIENCE_STYLE: Record<string, string> = {
  recruiter:
    "The visitor is a recruiter or hiring manager. Be professional and concise; lead with outcomes.",
  developer:
    "The visitor is a developer. Be technical and specific; name concrete tools, patterns, and trade-offs.",
  friend:
    "The visitor is a friend or casual browser. Be warm and plain-spoken; avoid jargon.",
};

export function buildPrompt(
  message: string,
  chunks: RetrievedChunk[],
  audience: string,
): string {
  const context = chunks
    .map((c, i) => `[${i + 1}] ${c.title} (source: ${c.sourceUrl})\n${c.text}`)
    .join("\n\n");
  const style = AUDIENCE_STYLE[audience] ?? AUDIENCE_STYLE.developer;
  return [
    "You are the AI assistant on Mike S Ncube's portfolio site. Answer questions about Mike's experience, projects, and skills.",
    style,
    "Answer ONLY from the context below. If the context does not contain the answer, say you do not have that information and suggest emailing mikencube03@gmail.com.",
    "Never invent projects, employers, metrics, or dates.",
    "Keep answers under 120 words. Plain text only, no markdown headings or bullet points.",
    "",
    "CONTEXT:",
    context,
    "",
    `QUESTION: ${message}`,
  ].join("\n");
}

export function shouldCacheAnswer(result: AnswerResult): boolean {
  return (
    (result.via === "gemini" || result.via === "groq")
    && result.sources.length > 0
    && !isRefusal(result.response)
  );
}

function sourcesForGrounded(text: string, chunks: RetrievedChunk[]): Array<{ title: string; url: string }> {
  if (isRefusal(text)) return [];
  return filterToLinkSources(chunks);
}

async function tryGenerate(
  generate: GenerateFn | undefined,
  prompt: string,
  label: "gemini" | "groq",
): Promise<string | null> {
  if (!generate) return null;
  try {
    const text = (await generate(prompt)).trim();
    return text.length > 0 ? text : null;
  } catch (err) {
    console.error(`[provider] ${label} generation failed:`, err);
    return null;
  }
}

export type AnswerInput = {
  question: string;
  audience?: string;
  geminiKey?: string;
  retrieveFn?: (query: string, apiKey: string | undefined, k?: number) => Promise<RetrievedChunk[]>;
  generateGemini?: GenerateFn;
  generateGroq?: GenerateFn;
};

export async function answerQuestion(input: AnswerInput): Promise<AnswerResult> {
  const question = input.question.trim();
  const audience = input.audience ?? "developer";
  const retrieveFn = input.retrieveFn ?? retrieve;

  let chunks: RetrievedChunk[] = [];
  try {
    chunks = await retrieveFn(question, input.geminiKey, 6);
  } catch (err) {
    console.error("retrieve failed:", err);
  }

  const relevant = chunks.filter((c) => c.score >= MIN_RELEVANCE_SCORE);

  if (relevant.length > 0) {
    const prompt = buildPrompt(question, relevant, audience);
    const wantLlm = Boolean(input.generateGemini || input.generateGroq);
    const slot = wantLlm ? acquireGenerationSlot() : false;

    try {
      const canCall = slot && allowInstanceGeneration();
      if (canCall) {
        if (geminiAvailable()) {
          const geminiText = await tryGenerate(input.generateGemini, prompt, "gemini");
          if (geminiText) {
            return {
              response: geminiText,
              sources: sourcesForGrounded(geminiText, relevant),
              via: "gemini",
            };
          }
        }
        if (groqAvailable()) {
          const groqText = await tryGenerate(input.generateGroq, prompt, "groq");
          if (groqText) {
            return {
              response: groqText,
              sources: sourcesForGrounded(groqText, relevant),
              via: "groq",
            };
          }
        }
      }
    } finally {
      if (slot) releaseGenerationSlot();
    }
  }

  const staticHit = matchStaticAnswer(question);
  if (staticHit) {
    return {
      response: staticHit.answer,
      sources: sourcesFor(staticHit),
      via: "static",
    };
  }

  return { response: EMAIL_FALLBACK, sources: [], via: "email" };
}
