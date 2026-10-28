// Per-instance caps so a burst on one serverless isolate cannot burn
// the Gemini free-tier quota. Cross-instance limiting is Upstash.

const MAX_IN_FLIGHT = 2;
const INSTANCE_MAX = 30;
const INSTANCE_WINDOW_MS = 10 * 60 * 1000;

let inFlight = 0;
const instanceHits: number[] = [];

export function acquireGenerationSlot(): boolean {
  if (inFlight >= MAX_IN_FLIGHT) {
    console.error("[quota] concurrency cap reached", { inFlight, MAX_IN_FLIGHT });
    return false;
  }
  inFlight += 1;
  return true;
}

export function releaseGenerationSlot(): void {
  inFlight = Math.max(0, inFlight - 1);
}

export function allowInstanceGeneration(): boolean {
  const now = Date.now();
  while (instanceHits.length > 0 && now - instanceHits[0] > INSTANCE_WINDOW_MS) {
    instanceHits.shift();
  }
  if (instanceHits.length >= INSTANCE_MAX) {
    console.error("[quota] instance generation cap reached", {
      count: instanceHits.length,
      INSTANCE_MAX,
    });
    return false;
  }
  instanceHits.push(now);
  return true;
}

export function resetQuotaForTests(): void {
  inFlight = 0;
  instanceHits.length = 0;
}
