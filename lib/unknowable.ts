// One lemma table for topics this assistant must not invent.
// Replaces OFF_TOPIC_QUESTION_RE, HONEST_UNKNOWN_RE, start-join, and off-topic overrides.

const FAVOURITE_WORK_RE =
  /\b(?:favourites?|favorites?|preferred|favour|favor)\b[\s\w]{0,24}\b(?:language|languages|framework|frameworks|tool|tools|stack|project|projects|role|roles|build|builds)\b/i;

const UNKNOWABLE_PHRASES: RegExp[] = [
  /\b(?:current\s+)?salary\b/i,
  /\bsalaries\b/i,
  /\bcompensation\b/i,
  /\bpay(?:\s*package|check|cheque)?\b/i,
  /\bpackage is mike on\b/i,
  /\bwhat(?:'s| is) mike'?s package\b/i,
  /\bwages?\b/i,
  /\bctc\b/i,
  /\b(?:day|daily|hourly)\s+rate\b/i,
  /\btake home\b/i,
  /\bcharge per\b/i,
  /\bper day\b/i,
  /\bnotice period\b/i,
  /\bwhat notice\b/i,
  /\b(?:his |mike'?s )?notice\b/i,
  /\brelocat(?:e|ion|ing)\b/i,
  /\bmove for\b/i,
  /\bwilling to move\b/i,
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
  /\b(?:wife|husband|spouse|kids|children)\b/i,
  /\b(?:his|mike'?s) family\b/i,
  /\bfamily status\b/i,
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
  /\bvote\b/i,
  /\bpizza\b/i,
  /\bpasta\b/i,
  /\bfavourite foods?\b/i,
  /\bfavorite foods?\b/i,
  /\bcapital of\b/i,
  /\bthe capital\b/i,
  /\bcapital\b/i,
  /\bwho won\b/i,
  /\blanguages? (?:does mike |does he )?speak\b/i,
  /\bspeak(?:s|ing)? (?:any )?languages?\b/i,
  /\bspoken languages?\b/i,
  /\bspeak(?:s|ing)?\s+(?:french|zulu|mandarin|xhosa|afrikaans)\b/i,
  /\bspeak(?:s|ing)? .*\bat home\b/i,
  /\bspoken language\b/i,
  /\bnews\b/i,
  /\bcurrent events?\b/i,
  /\bgeneral knowledge\b/i,
  /\btrivia\b/i,
  /\b\d+\s*[+\-×x*/]\s*\d+\b/,
  /\b\d+\s+plus\s+\d+\b/i,
  /\bwhat is\s+\d+\b/i,
  /\b(?:cats?|dogs?|pets?)\b/i,
  /\bblood type\b/i,
  /\bshoe size\b/i,
  /\b(?:nba|nfl|mlb)\b/i,
  /\bgym routine\b/i,
  /\bcar model\b/i,
  /\b(?:video games?|steam library|twitch|discord handle)\b/i,
  /\b(?:d&d|dungeons and dragons)\b/i,
  /\bmagic the gathering\b/i,
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
    /\b(?:favourites?|favorites?|preferred)\b/.test(hay)
    && !FAVOURITE_WORK_RE.test(hay)
  ) {
    return true;
  }
  return false;
}
