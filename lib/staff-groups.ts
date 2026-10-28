// Staff named by the work a system does for them: "built for the claims team"
// asks about the claims systems, not about a team Mike leads or an overview of
// everything he built.

const STAFF_NOUN = String.raw`(?:teams?|departments?|dept|staff|units?|divisions?|desks?|office|sections?|clerks|officers|assessors|users)`;
const STAFF_LEAD = String.raw`\b(?:for|by|to|serv(?:e|es|ing)|support(?:s|ing)?|help(?:s|ing)?)\s+(?:(?:the|our|its|their|zororo(?:-phumulani)?(?:['’]s)?)\s+)?`;

// The work each project's staff do, by project id, as the KB names it.
export const STAFF_WORK: Readonly<Record<string, string>> = {
  zdi: "accounts",
  claims: "claims?",
  "claims-pipeline": "claims?",
};

// "claims team": staff named by their work.
export function staffPhrase(work: string): string {
  return String.raw`(?:${work})\s+${STAFF_NOUN}\b`;
}

// The staff group as the ones a system is for ("built for the claims team").
export function servedStaff(work: string, flags = "i"): RegExp {
  return new RegExp(STAFF_LEAD + staffPhrase(work), flags);
}

// True when the question names a staff group as the users of one of the systems.
export function namesServedStaff(question: string): boolean {
  return Object.values(STAFF_WORK).some((work) => servedStaff(work).test(question));
}
