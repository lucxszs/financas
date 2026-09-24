import type { CSSProperties } from 'react';
import { Barra, Secao } from '../../components/ui';
import { corVar } from '../../components/cor';
import {
  calcularScore,
  paraBRL,
  pct,
  progressoObjetivo,
  rendimentoMensalEstimado,
  somarEmBRL,
  usoCartao,
} from '../../domain/calculos';
import {
  diasAte,
  mesAtualIso,
  mesesAte,
  parseDataIso,
  progressoTemporal,
  rotuloMesCurto,
} from '../../domain/datas';
import { fmt, fmtSemSimbolo, formatarMoeda } from '../../domain/formatadores';
import type { Objetivo } from '../../domain/types';
import { useDadosConfigurados } from '../dados/useDados';
import { CardCambio } from './CardCambio';

const ROTULO_RESPOSTA = { sim: 'sim', parcial: 'parcial', nao: 'não' } as const;

export const PaginaVisao = () => {
  const { config, saldos, transacoes, cotacoes } = useDadosConfigurados();
  const valores = saldos.valores;
  const mes = mesAtualIso();

  const total = somarEmBRL(config.caixinhas, valores, cotacoes);
  const rendMes = rendimentoMensalEstimado(config, valores);
  const score = calcularScore(saldos.score);
  const comData = config.objetivos.filter((o) => o.dataAlvo);
  const objetivoDaCaixinha = (id: string) => config.objetivos.find((o) => o.caixinhas.includes(id));
  const estrangeiras = config.caixinhas.filter((c) => c.moeda !== 'BRL');
  const alocacao = config.objetivos.filter((o) => o.aporteMensal);
  const totalAlocacao = alocacao.reduce((a, o) => a + (o.aporteMensal ?? 0), 0);

  return (
    <>
      {comData.map((o) => (
        <Contagem key={o.id} objetivo={o} />
      ))}

      <Secao titulo="Câmbio">
        <CardCambio />
      </Secao>

      <Secao titulo="Score do mês">
        <div className="score-card">
          <div className="score-icon">{score.icon}</div>
          <div className="score-info">
            <div className="score-title">{score.label}</div>
            <div className="score-sub">
              {saldos.score?.pagou
                ? `Contas: ${ROTULO_RESPOSTA[saldos.score.pagou]} · Positivo: ${ROTULO_RESPOSTA[saldos.score.positivo ?? 'nao']} · Aporte: ${ROTULO_RESPOSTA[saldos.score.aporte ?? 'nao']}`
                : 'Atualize os saldos para registrar o mês'}
            </div>
          </div>
          <div className={`score-badge ${score.cls}`}>{score.pts}/3</div>
        </div>
      </Secao>

      <Secao titulo="Investimentos">
        <div className="total-card">
          <div>
            <div className="tc-label">Total investido</div>
            <div className="tc-val">{fmt(total.total)}</div>
            {!total.completo && (
              <div className="tc-rend">⚠️ sem cotação: moedas estrangeiras fora do total</div>
            )}
          </div>
          <div className="tc-right">
            <div className="tc-label">Rendendo/mês</div>
            <div className="tc-rend-val">~{fmt(rendMes)}</div>
            <div className="tc-rend">estimativa</div>
          </div>
        </div>

        <div className="invest-grid">
          {config.caixinhas.map((c) => {
            const valor = valores[c.id] ?? 0;
            const emBRL = paraBRL(valor, c.moeda, cotacoes);
            const obj = objetivoDaCaixinha(c.id);
            const progresso = obj && emBRL !== null ? pct(emBRL, obj.meta) : null;
            return (
              <div key={c.id} className="invest-card" style={{ '--cor': corVar(c.cor) } as CSSProperties}>
                <div className="ic-label">
                  {c.nome} {c.emoji}
                </div>
                <div className="ic-val">{formatarMoeda(valor, c.moeda)}</div>
                <div className="ic-rend">
                  ↑ {c.rendimento}
                  {c.moeda !== 'BRL' && emBRL !== null && ` · ≈ ${fmt(emBRL)}`}
                </div>
                {c.descricao && <div className="ic-sub">{c.descricao}</div>}
                {obj && (
                  <div className="prog-wrap">
                    <div className="prog-label">
                      <span>{obj.nome}</span>
                      <span>{progresso === null ? '⚠️ sem cotação' : `${progresso.toFixed(1)}%`}</span>
                    </div>
                    <Barra pct={progresso ?? 0} cor={corVar(c.cor)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {estrangeiras.length > 0 && total.completo && (
          <div className="nota">Moedas estrangeiras convertidas pela cotação atual.</div>
        )}
      </Secao>

      {config.cartoes.length > 0 && (
        <Secao titulo={`Cartões de crédito · fatura ${rotuloMesCurto(mes)}`}>
          <div className="card">
            {config.cartoes.map((c) => {
              const uso = usoCartao(c, transacoes, mes);
              const cor = uso.pct > 80 ? 'var(--coral)' : uso.pct > 60 ? 'var(--amber)' : corVar(c.cor);
              return (
                <div key={c.id} className="cartao-row">
                  <div className="linha-entre">
                    <span className="negrito">{c.nome}</span>
                    <span className="mono muted pequeno">limite {fmt(c.limite)}</span>
                  </div>
                  <div className="linha-entre mono pequeno">
                    <span style={{ color: cor }}>utilizado {fmt(uso.utilizado)}</span>
                    <span className="verde">disponível {fmt(uso.disponivel)}</span>
                  </div>
                  <Barra pct={uso.pct} cor={cor} altura={5} />
                </div>
              );
            })}
          </div>
        </Secao>
      )}

      <Secao titulo="Metas">
        <div className="card">
          {config.objetivos.map((o) => {
            const p = progressoObjetivo(o, config, valores, cotacoes);
            return (
              <div key={o.id} className="meta-row">
                <div className="meta-dot" style={{ background: corVar(o.cor) }} />
                <div className="meta-info">
                  <div className="meta-name">
                    {o.nome} {o.emoji}
                  </div>
                  <div className="meta-sub">
                    {[o.descricao, o.aporteMensal ? `${fmt(o.aporteMensal)}/mês` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                </div>
                <div className="meta-right">
                  <div className="mr-val" style={{ color: corVar(o.cor) }}>
                    {p.concluido ? '✅ Completa' : (o.previsao ?? `${p.pct.toFixed(0)}%`)}
                  </div>
                  <div className="mr-prazo">{p.concluido ? fmt(p.guardado) : `faltam ${fmt(p.faltam)}`}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Secao>

      {alocacao.length > 0 && (
        <Secao
          titulo={`Alocação mensal${config.alocacaoDesde ? ` · a partir de ${rotuloMesCurto(config.alocacaoDesde)}` : ''}`}
        >
          <div className="card">
            {alocacao.map((o) => (
              <div key={o.id} className="aloc-row">
                <div className="aloc-dot" style={{ background: corVar(o.cor) }} />
                <div className="aloc-name">{o.nome}</div>
                <div className="aloc-val" style={{ color: corVar(o.cor) }}>
                  {fmt(o.aporteMensal ?? 0)}
                </div>
              </div>
            ))}
            <div className="aloc-row total">
              <div className="aloc-dot" style={{ background: 'var(--text)' }} />
              <div className="aloc-name negrito">Total</div>
              <div className="aloc-val">{fmt(totalAlocacao)}</div>
            </div>
          </div>
        </Secao>
      )}
    </>
  );
};

const Contagem = ({ objetivo: o }: { objetivo: Objetivo }) => {
  const { config, saldos, cotacoes } = useDadosConfigurados();
  const alvo = parseDataIso(o.dataAlvo!);
  const p = progressoObjetivo(o, config, saldos.valores, cotacoes);
  const meses = mesesAte(alvo);
  const pctTempo = o.dataInicio ? progressoTemporal(parseDataIso(o.dataInicio), alvo) : null;

  return (
    <Secao titulo="Contagem regressiva">
      <div className="countdown-card">
        <div className="cd-header">
          <div className="cd-flag">{o.emoji ?? '🎯'}</div>
          <div>
            <div className="cd-title">
              {o.nome} · {rotuloMesCurto(o.dataAlvo!.slice(0, 7))}
            </div>
            <div className="cd-sub">
              {o.descricao ? `${o.descricao} · ` : ''}meta {fmt(o.meta)}
            </div>
          </div>
        </div>
        <div className="cd-grid">
          <Stat n={meses} l="meses" />
          <Stat n={diasAte(alvo)} l="dias" />
          <Stat n={fmtSemSimbolo(p.guardado)} l="guardado" />
          <Stat n={fmtSemSimbolo(p.faltam)} l="faltam" />
        </div>
        <div className="cd-bars">
          <div>
            <div className="cd-bar-label">
              <span>💰 Financeiro ({p.pct.toFixed(0)}%)</span>
              <span>
                {fmt(p.guardado)} de {fmt(o.meta)}
              </span>
            </div>
            <Barra pct={p.pct} cor="var(--violet)" altura={6} />
          </div>
          {pctTempo !== null && (
            <div>
              <div className="cd-bar-label">
                <span>📅 Temporal ({pctTempo.toFixed(0)}%)</span>
                <span>{meses} meses restantes</span>
              </div>
              <Barra pct={pctTempo} cor="var(--amber)" altura={6} />
            </div>
          )}
        </div>
      </div>
    </Secao>
  );
};

const Stat = ({ n, l }: { n: string | number; l: string }) => (
  <div className="cd-stat">
    <div className="n">{n}</div>
    <div className="l">{l}</div>
  </div>
);
