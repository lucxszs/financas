/** Id legível a partir do nome ("Conta Itaú" -> "conta-itau"), único entre os existentes. */
export const gerarId = (nome: string, existentes: Iterable<string>) => {
  const base =
    nome
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30) || 'item';
  const usados = new Set(existentes);
  if (!usados.has(base)) return base;
  for (let n = 2; ; n++) if (!usados.has(`${base}-${n}`)) return `${base}-${n}`;
};
