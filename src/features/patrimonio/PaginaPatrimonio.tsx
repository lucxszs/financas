import type { CSSProperties } from 'react';
import { Barra, Secao } from '../../components/ui';
import { corVar } from '../../components/cor';
import { paraBRL, pct, rendimentoMensalEstimado, somarEmBRL } from '../../domain/calculos';
import { fmt, formatarMoeda } from '../../domain/formatadores';
import { useDadosConfigurados } from '../dados/useDados';
import { CardCambio } from './CardCambio';

export const PaginaPatrimonio = () => {
  const { config, saldos, cotacoes } = useDadosConfigurados();
  const valores = saldos.valores;

  const total = somarEmBRL(config.caixinhas, valores, cotacoes);
  const rendMes = rendimentoMensalEstimado(config, valores);
  const objetivoDaCaixinha = (id: string) => config.objetivos.find((o) => o.caixinhas.includes(id));
  const estrangeiras = config.caixinhas.filter((c) => c.moeda !== 'BRL');

  return (
    <>
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

      <Secao titulo="Câmbio">
        <CardCambio />
      </Secao>
    </>
  );
};
