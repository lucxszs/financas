/** "🇦🇷" -> "AR"; null se o texto não é uma bandeira. */
export const codigoBandeira = (emoji: string | undefined) => {
  const cps = [...(emoji ?? '').trim()].map((c) => c.codePointAt(0) ?? 0);
  if (cps.length !== 2 || cps.some((c) => c < 0x1f1e6 || c > 0x1f1ff)) return null;
  return String.fromCharCode(...cps.map((c) => c - 0x1f1e6 + 65));
};
