// Datas "de calendário" são sempre tratadas no fuso local.
// toISOString() usa UTC e joga lançamentos feitos à noite para o dia seguinte.

const pad = (n: number) => String(n).padStart(2, '0');

/** "YYYY-MM-DD" no fuso local. */
export const hojeIso = (agora = new Date()) =>
  `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(agora.getDate())}`;

/** "YYYY-MM" no fuso local. */
export const mesAtualIso = (agora = new Date()) => hojeIso(agora).slice(0, 7);

/** Converte "YYYY-MM-DD" em Date local (meia-noite). */
export const parseDataIso = (iso: string) => {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a ?? 0, (m ?? 1) - 1, d ?? 1);
};

/** Soma meses a um "YYYY-MM". */
export const somarMeses = (mesIso: string, n: number) => {
  const [a, m] = mesIso.split('-').map(Number);
  const d = new Date(a ?? 0, (m ?? 1) - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

const MS_DIA = 86_400_000;

export const diasAte = (alvo: Date, agora = new Date()) =>
  Math.max(0, Math.ceil((alvo.getTime() - agora.getTime()) / MS_DIA));

export const mesesAte = (alvo: Date, agora = new Date()) =>
  Math.max(0, (alvo.getFullYear() - agora.getFullYear()) * 12 + alvo.getMonth() - agora.getMonth());

/** Percentual do tempo decorrido entre início e alvo (0 a 100). */
export const progressoTemporal = (inicio: Date, alvo: Date, agora = new Date()) => {
  const total = alvo.getTime() - inicio.getTime();
  if (total <= 0) return 100;
  const decorrido = agora.getTime() - inicio.getTime();
  return Math.min(100, Math.max(0, (decorrido / total) * 100));
};

/** "2026-07" -> "Jul/26" */
export const rotuloMesCurto = (mesIso: string) => {
  const [a, m] = mesIso.split('-').map(Number);
  const nome = new Date(a ?? 0, (m ?? 1) - 1, 1).toLocaleString('pt-BR', { month: 'short' });
  const limpo = nome.replace('.', '');
  return `${limpo.charAt(0).toUpperCase()}${limpo.slice(1)}/${String(a).slice(2)}`;
};

/** "2026-07" -> "julho de 2026" */
export const rotuloMesLongo = (mesIso: string) => {
  const [a, m] = mesIso.split('-').map(Number);
  return new Date(a ?? 0, (m ?? 1) - 1, 1).toLocaleString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
};

/** "2026-09-24" -> "24/09" */
export const rotuloDiaMes = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
