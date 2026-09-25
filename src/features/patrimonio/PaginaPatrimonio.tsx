import type { CSSProperties } from 'react';
import { GraficoLinha } from '../../components/graficos';
import { Barra, Secao } from '../../components/ui';
import { corVar } from '../../components/cor';
import { paraBRL, pct, rendimentoMensalEstimado, somarEmBRL } from '../../domain/calculos';
import { hojeIso, rotuloMesCurto, somarMeses } from '../../domain/datas';
import { fmt, fmtCompacto, formatarMoeda } from '../../domain/formatadores';
import { liquidoSnapshot, patrimonioAtual } from '../../domain/patrimonio';
import { useDadosConfigurados } from '../dados/useDados';
import { CardCambio } from './CardCambio';

export const PaginaPatrimonio = () => {
  const { config, saldos, cotacoes, transacoes, snapshots } = useDadosConfigurados();
  const valores = saldos.valores;
  const hoje = hojeIso();
  const mesAtual = hoje.slice(0, 7);
  const patrimonio = patrimonioAtual(config, valores, cotacoes, transacoes, hoje);
  // Meses anteriores: foto do "Atualizar saldos"; mês atual: valor de agora.
  const evolucao = Array.from({ length: 6 }, (_, i) => somarMeses(mesAtual, i - 5)).map((mes) => {
    const foto = snapshots.find((s) => s.mes === mes);
    return {
      rotulo: rotuloMesCurto(mes),
      valor: mes === mesAtual ? patrimonio.liquido : foto ? liquidoSnapshot(foto, config, cotacoes) : null,
    };
  });

  const total = somarEmBRL(config.caixinhas, valores, cotacoes);
  const rendMes = rendimentoMensalEstimado(config, valores);
  const objetivoDaCaixinha = (id: string) => config.objetivos.find((o) => o.caixinhas.includes(id));
  const estrangeiras = config.caixinhas.filter((c) => c.moeda !== 'BRL');

  return (
    <>
      <Secao titulo="Patrimônio líquido">
        <div className="card">
          <div className="brow">
            <span className="bname">Investimentos</span>
            <span className="bval">{fmt(patrimonio.investimentos)}</span>
          </div>
          <div className="brow">
            <span className="bname">Contas</span>
            <span className="bval">{fmt(patrimonio.contas)}</span>
          </div>
          <div className="brow total">
            <span className="bname">Ativos</span>
            <span className="bval">{fmt(patrimonio.ativos)}</span>
          </div>
          <div className="brow out">
            <span className="bname">Dívidas (faturas em aberto)</span>
            <span className="bval">− {fmt(patrimonio.dividas)}</span>
          </div>
          <div className={`brow total ${patrimonio.liquido >= 0 ? 'positivo' : 'deficit'}`}>
            <span className="bname">Patrimônio líquido</span>
            <span className="bval">
              {patrimonio.liquido < 0 ? '− ' : ''}
              {fmt(Math.abs(patrimonio.liquido))}
            </span>
          </div>
        </div>
        {!patrimonio.completo && (
          <div className="nota">⚠️ Sem cotação: moedas estrangeiras fora do total.</div>
        )}
        <div className="card card-pad mt-8">
          <div className="grafico-titulo">Evolução</div>
          <GraficoLinha
            pontos={evolucao}
            cor="var(--emerald)"
            formatar={fmt}
            formatarEixo={fmtCompacto}
            descricao="Patrimônio líquido por mês"
          />
        </div>
        <div className="nota">
          Contas = caixinhas do tipo conta. Dívidas = faturas do cartão ainda não vencidas, incluindo as
          futuras. Meses anteriores usam a foto do &quot;Atualizar saldos&quot;; fotos antigas não têm dívidas
          gravadas.
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

      <Secao titulo="Câmbio">
        <CardCambio />
      </Secao>
    </>
  );
};
