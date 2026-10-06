const AIRPORT_PATTERN = /repül|airport|reptér|\bBUD\b|liszt\s*ferenc|\bVIE\b|\bDEB\b|\bKSC\b|\bOTP\b|\bCLJ\b|\bBTS\b/i;

/** Egy cím alapján megállapítja, hogy repülőtér-e (járatszám és kategória miatt). Kliensen és szerveren is használható. */
export function looksLikeAirport(address: string): boolean {
  return AIRPORT_PATTERN.test(address);
}
