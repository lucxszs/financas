import type { ReactNode } from 'react';
import { Barra, Secao } from '../../components/ui';
import { corVar } from '../../components/cor';
import { progressoObjetivo } from '../../domain/calculos';
import { diasAte, mesesAte, parseDataIso, progressoTemporal, rotuloMesCurto } from '../../domain/datas';
import { fmt, fmtSemSimbolo } from '../../domain/formatadores';
import type { Objetivo } from '../../domain/types';
import { useDadosConfigurados } from '../dados/useDados';
import { CardCambio } from '../patrimonio/CardCambio';

export const PaginaMetas = () => {
  const { config, saldos, cotacoes } = useDadosConfigurados();
  const valores = saldos.valores;
  const comData = config.objetivos.filter((o) => o.dataAlvo);
  const alocacao = config.objetivos.filter((o) => o.aporteMensal);
  const totalAlocacao = alocacao.reduce((a, o) => a + (o.aporteMensal ?? 0), 0);
  // Câmbio só interessa para metas que guardam dinheiro em moeda estrangeira (ex.: viagem).
  const usaMoedaEstrangeira = (o: Objetivo) =>
    config.caixinhas.some((c) => o.caixinhas.includes(c.id) && c.moeda !== 'BRL');

  return (
    <>
      {comData.map((o) => (
        <Contagem key={o.id} objetivo={o}>
          {usaMoedaEstrangeira(o) && <CardCambio />}
        </Contagem>
      ))}

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

export const Contagem = ({ objetivo: o, children }: { objetivo: Objetivo; children?: ReactNode }) => {
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
      {children && <div className="mt-8">{children}</div>}
    </Secao>
  );
};

const Stat = ({ n, l }: { n: string | number; l: string }) => (
  <div className="cd-stat">
    <div className="n">{n}</div>
    <div className="l">{l}</div>
  </div>
);
