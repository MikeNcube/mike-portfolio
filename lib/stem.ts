// Light suffix stripper shared by the coverage gate and the claim validator, so
// inflections ("hiring", "hire") compare equal. Words with non-letters are kept as-is.
export function stem(word: string): string {
  let w = word.toLowerCase();
  if (w.length <= 3 || /[^a-z]/.test(w)) return w;
  if (w.endsWith("ies") && w.length > 4) w = `${w.slice(0, -3)}y`;
  else if (w.endsWith("ied") && w.length > 4) w = `${w.slice(0, -3)}y`;
  else if (w.endsWith("ing") && w.length > 5) w = w.slice(0, -3);
  else if (w.endsWith("ed") && w.length > 4) w = w.slice(0, -2);
  else if (w.endsWith("ly") && w.length > 5) w = w.slice(0, -2);
  else if (/(?:ss|x|ch|sh|z)es$/.test(w)) w = w.slice(0, -2);
  else if (w.endsWith("s") && !/(?:ss|us|is)$/.test(w)) w = w.slice(0, -1);
  if (w.length > 3 && w.endsWith("e")) w = w.slice(0, -1);
  if (/([b-df-hj-np-tv-z])\1$/.test(w) && !/(?:ll|ss|ff|zz)$/.test(w)) w = w.slice(0, -1);
  return w;
}
