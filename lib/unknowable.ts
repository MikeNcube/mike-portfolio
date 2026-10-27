// One lemma table for topics this assistant must not invent.
// Replaces OFF_TOPIC_QUESTION_RE, HONEST_UNKNOWN_RE, start-join, and off-topic overrides.

const WORK_NOUN_RE =
  /\b(?:project|projects|build|builds|system|systems|role|roles|stack|language|languages|programming|framework|frameworks|tool|tools|code|engineer|engineering|job|jobs|work|ship|shipped|test|tests|title|titles)\b/i;

const UNKNOWABLE_PHRASES: RegExp[] = [
  /\b(?:current\s+)?salary\b/i,
  /\bsalaries\b/i,
  /\bcompensation\b/i,
  /\bpay(?:\s*package|check|cheque)?\b/i,
  /\bwages?\b/i,
  /\bctc\b/i,
  /\b(?:day|daily|hourly)\s+rate\b/i,
  /\bnotice period\b/i,
  /\bwhat notice\b/i,
  /\brelocat(?:e|ion|ing)\b/i,
  /\bvisa\b/i,
  /\bsponsorship\b/i,
  /\btime ?zone\b/i,
  /\btimezone\b/i,
  /\bstart (?:date|next|this|tomorrow|immediately)\b/i,
  /\bavailable (?:from|to start)\b/i,
  /\bhow soon can (?:mike|he) (?:start|join)\b/i,
  /\bwhen (?:can|could|would|will) (?:mike|he) (?:start|join|begin)\b/i,
  /\b(?:can|could) (?:mike|he) start\b/i,
  /\bhow old\b/i,
  /\b(?:his|mike'?s) age\b/i,
  /\bbirthday\b/i,
  /\bmarital\b/i,
  /\bmarried\b/i,
  /\b(?:wife|husband|spouse|kids|children|family)\b/i,
  /\breligion\b/i,
  /\bnationality\b/i,
  /\bethnicity\b/i,
  /\bhobb(?:y|ies)\b/i,
  /\bpersonal life\b/i,
  /\bweather\b/i,
  /\bforecast\b/i,
  /\b(?:football|soccer|cricket|rugby|world cup|olympics)\b/i,
  /\bpolitics?\b/i,
  /\bpolitical party\b/i,
  /\bvoting\b/i,
  /\bpizza\b/i,
  /\bpasta\b/i,
  /\bfavourite foods?\b/i,
  /\bfavorite foods?\b/i,
  /\bcapital of\b/i,
  /\bwho won\b/i,
  /\blanguages? (?:does mike |does he )?speak\b/i,
  /\bspeak(?:s|ing)? (?:any )?languages?\b/i,
  /\bspoken languages?\b/i,
  /\bnews\b/i,
  /\bcurrent events?\b/i,
  /\bgeneral knowledge\b/i,
  /\btrivia\b/i,
  /\b\d+\s*[+\-×x*/]\s*\d+\b/,
  /\bwhat is\s+\d+\b/i,
]

export const UNKNOWABLE_REGEX_COUNT = UNKNOWABLE_PHRASES.length + 1;

export function isStartJoinAvailabilityQuestion(question: string): boolean {
  return (
    /\b(?:when (?:can|could|would|will) (?:mike|he) (?:start|join|begin)|(?:can|could) (?:mike|he) start|how soon can (?:mike|he) (?:start|join)|available to start|start (?:date|next|this|tomorrow|immediately))\b/i
      .test(question)
  );
}

export function isUnknowableQuestion(question: string): boolean {
  const hay = question.toLowerCase();
  if (UNKNOWABLE_PHRASES.some((re) => re.test(question))) return true;
  if (
    /\b(?:favourites?|favorites?)\b/.test(hay)
    && !WORK_NOUN_RE.test(hay)
  ) {
    return true;
  }
  return false;
}
