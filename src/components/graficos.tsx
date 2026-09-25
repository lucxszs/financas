import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

// Gráficos em SVG puro, uma série por gráfico (a cor é a da entidade: gastos, investimentos, patrimônio).
// Regras: barras de até 24px com ponta arredondada, linha de 2px, marcadores de 8px com anel na cor da
// superfície, grade discreta, valor só no último ponto e tooltip no hover/foco.

export interface Ponto {
  rotulo: string;
  /** null = sem dado no mês (a linha pula o ponto; a coluna não é desenhada). */
  valor: number | null;
}

interface PropsGrafico {
  pontos: Ponto[];
  cor: string;
  /** Formato do valor no tooltip e no rótulo do último ponto. */
  formatar: (v: number) => string;
  /** Formato curto dos ticks do eixo. */
  formatarEixo: (v: number) => string;
  descricao: string;
}

const ALTURA = 180;
const MARGEM = { topo: 22, base: 24, esq: 64, dir: 12 };
const LARGURA_BARRA = 24;

/** Largura real do container, para desenhar em pixels (texto não distorce no celular). */
const useLargura = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new ResizeObserver(([e]) => setLargura(e?.contentRect.width ?? 0));
    obs.observe(el);
    setLargura(el.getBoundingClientRect().width);
    return () => obs.disconnect();
  }, []);
  return { ref, largura };
};

/** Domínio com o zero sempre visível e 3 ticks redondos. */
const escala = (valores: number[]) => {
  const min = Math.min(0, ...valores);
  const max = Math.max(0, ...valores);
  const bruto = (max - min) / 2 || 1;
  const mag = 10 ** Math.floor(Math.log10(bruto));
  const passo = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((p) => p >= bruto) ?? bruto;
  const inicio = Math.floor(min / passo) * passo;
  const fim = Math.max(inicio + passo, Math.ceil(max / passo) * passo);
  const ticks: number[] = [];
  for (let t = inicio; t <= fim + passo / 2; t += passo) ticks.push(t);
  return { inicio, fim, ticks };
};

const Moldura = ({
  pontos,
  formatar,
  formatarEixo,
  descricao,
  desenhar,
}: Omit<PropsGrafico, 'cor'> & {
  desenhar: (g: {
    x: (i: number) => number;
    y: (v: number) => number;
    banda: number;
    base: number;
    ativo: number | null;
  }) => ReactNode;
}) => {
  const { ref, largura } = useLargura();
  const [ativo, setAtivo] = useState<number | null>(null);
  const valores = pontos.flatMap((p) => (p.valor === null ? [] : [p.valor]));
  const { inicio, fim, ticks } = escala(valores);

  const areaL = Math.max(0, largura - MARGEM.esq - MARGEM.dir);
  const areaA = ALTURA - MARGEM.topo - MARGEM.base;
  const banda = pontos.length ? areaL / pontos.length : 0;
  const x = (i: number) => MARGEM.esq + banda * i + banda / 2;
  const y = (v: number) => MARGEM.topo + areaA - ((v - inicio) / (fim - inicio)) * areaA;
  const base = y(0);
  const pAtivo = ativo !== null ? pontos[ativo] : undefined;

  return (
    <div className="grafico" ref={ref}>
      {largura > 0 && (
        <svg width={largura} height={ALTURA} role="img" aria-label={descricao}>
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={MARGEM.esq}
                x2={largura - MARGEM.dir}
                y1={y(t)}
                y2={y(t)}
                className={t === 0 ? 'grafico-base' : 'grafico-grade'}
              />
              <text
                x={MARGEM.esq - 8}
                y={y(t)}
                className="grafico-eixo"
                textAnchor="end"
                dominantBaseline="middle"
              >
                {formatarEixo(t)}
              </text>
            </g>
          ))}
          {pontos.map((p, i) => (
            <text key={p.rotulo} x={x(i)} y={ALTURA - 6} className="grafico-eixo" textAnchor="middle">
              {p.rotulo}
            </text>
          ))}
          {desenhar({ x, y, banda, base, ativo })}
          {/* Faixas invisíveis: alvo de hover/foco maior que a marca. */}
          {pontos.map((p, i) => (
            <rect
              key={p.rotulo}
              x={MARGEM.esq + banda * i}
              y={MARGEM.topo}
              width={banda}
              height={areaA}
              className="grafico-alvo"
              tabIndex={0}
              aria-label={`${p.rotulo}: ${p.valor === null ? 'sem dado' : formatar(p.valor)}`}
              onMouseEnter={() => setAtivo(i)}
              onMouseLeave={() => setAtivo(null)}
              onFocus={() => setAtivo(i)}
              onBlur={() => setAtivo(null)}
            />
          ))}
        </svg>
      )}
      {pAtivo && ativo !== null && (
        <div
          className="grafico-tooltip"
          style={{ left: Math.min(Math.max(x(ativo), 60), largura - 60), top: MARGEM.topo - 8 }}
        >
          <div className="muted">{pAtivo.rotulo}</div>
          <div className="negrito">{pAtivo.valor === null ? 'sem dado' : formatar(pAtivo.valor)}</div>
        </div>
      )}
    </div>
  );
};

const ultimoComValor = (pontos: Ponto[]) => {
  for (let i = pontos.length - 1; i >= 0; i--) if (pontos[i]?.valor !== null) return i;
  return -1;
};

/** Coluna com ponta arredondada (4px) do lado oposto à base; quadrada na base. */
const pathColuna = (x: number, y0: number, y1: number, w: number) => {
  const r = Math.min(4, Math.abs(y1 - y0), w / 2);
  const cima = y1 < y0;
  const topo = cima ? y1 : y0;
  const baixo = cima ? y0 : y1;
  return cima
    ? `M${x},${baixo} V${topo + r} Q${x},${topo} ${x + r},${topo} H${x + w - r} Q${x + w},${topo} ${x + w},${topo + r} V${baixo} Z`
    : `M${x},${topo} V${baixo - r} Q${x},${baixo} ${x + r},${baixo} H${x + w - r} Q${x + w},${baixo} ${x + w},${baixo - r} V${topo} Z`;
};

export const GraficoColunas = (props: PropsGrafico) => {
  const { pontos, cor, formatar } = props;
  const ultimo = ultimoComValor(pontos);
  return (
    <Moldura
      {...props}
      desenhar={({ x, y, banda, base, ativo }) => {
        const w = Math.min(LARGURA_BARRA, banda * 0.6);
        return pontos.map((p, i) => {
          if (p.valor === null) return null;
          const topo = y(p.valor);
          return (
            <g key={p.rotulo} opacity={ativo === null || ativo === i ? 1 : 0.5}>
              <path d={pathColuna(x(i) - w / 2, base, topo, w)} fill={cor} />
              {i === ultimo && (
                <text
                  x={x(i)}
                  y={p.valor >= 0 ? topo - 6 : topo + 14}
                  className="grafico-valor"
                  textAnchor="middle"
                >
                  {formatar(p.valor)}
                </text>
              )}
            </g>
          );
        });
      }}
    />
  );
};

export const GraficoLinha = (props: PropsGrafico) => {
  const { pontos, cor, formatar } = props;
  const ultimo = ultimoComValor(pontos);
  return (
    <Moldura
      {...props}
      desenhar={({ x, y, ativo }) => {
        // Meses sem dado quebram a linha em trechos.
        const trechos: string[] = [];
        let atual = '';
        pontos.forEach((p, i) => {
          if (p.valor === null) {
            if (atual) trechos.push(atual);
            atual = '';
          } else atual += `${atual ? 'L' : 'M'}${x(i)},${y(p.valor)} `;
        });
        if (atual) trechos.push(atual);
        return (
          <>
            {ativo !== null && (
              <line
                x1={x(ativo)}
                x2={x(ativo)}
                y1={MARGEM.topo}
                y2={ALTURA - MARGEM.base}
                className="grafico-mira"
              />
            )}
            {trechos.map((d) => (
              <path
                key={d}
                d={d}
                fill="none"
                stroke={cor}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}
            {pontos.map((p, i) =>
              p.valor === null ? null : (
                <g key={p.rotulo}>
                  <circle
                    cx={x(i)}
                    cy={y(p.valor)}
                    r={ativo === i ? 5 : 4}
                    fill={cor}
                    className="grafico-ponto"
                  />
                  {i === ultimo && (
                    <text x={x(i)} y={y(p.valor) - 10} className="grafico-valor" textAnchor="end">
                      {formatar(p.valor)}
                    </text>
                  )}
                </g>
              ),
            )}
          </>
        );
      }}
    />
  );
};
