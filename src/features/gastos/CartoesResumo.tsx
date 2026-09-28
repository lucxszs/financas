import { Barra, Secao } from '../../components/ui';
import { corVar } from '../../components/cor';
import { comprometimentoFuturo, resumoCartao, type ResumoCartao } from '../../domain/cartoes';
import { hojeIso, rotuloMesCurto, somarMeses } from '../../domain/datas';
import { fmt } from '../../domain/formatadores';
import { useDadosConfigurados } from '../dados/useDados';

const dia = (n: number) => String(n).padStart(2, '0');

const rotuloMelhorDia = (r: ResumoCartao) => {
  const { melhorDiaCompra } = r.cartao;
  if (!melhorDiaCompra || r.diasMelhorDia === null) return null;
  const quando =
    r.diasMelhorDia === 0 ? '✨ hoje' : r.diasMelhorDia === 1 ? 'amanhã' : `em ${r.diasMelhorDia} dias`;
  return `melhor dia ${dia(melhorDiaCompra)} (${quando})`;
};

export const CartoesResumo = () => {
  const { config, transacoes } = useDadosConfigurados();
  const hoje = hojeIso();
  if (!config.cartoes.length) return null;

  const resumos = config.cartoes.map((c) => resumoCartao(c, transacoes, hoje));
  const futuro = comprometimentoFuturo(config.cartoes, transacoes, hoje);
  const maxFuturo = Math.max(1, ...futuro.map((f) => f.valor));
  const limiteTotal = resumos.reduce((a, r) => a + r.cartao.limite, 0);
  const disponivelTotal = resumos.reduce((a, r) => a + r.disponivel, 0);

  return (
    <>
      <Secao titulo="💳 Cartões">
        {resumos.map((r) => {
          const cor = r.pct > 80 ? 'var(--coral)' : r.pct > 60 ? 'var(--amber)' : corVar(r.cartao.cor);
          const datas = [
            rotuloMelhorDia(r),
            r.cartao.diaVencimento && `vence ${dia(r.cartao.diaVencimento)}`,
          ].filter(Boolean);
          return (
            <div key={r.cartao.id} className="card mb-8">
              <div className="cartao-topo">
                <div className="linha-entre">
                  <span className="negrito">
                    {r.cartao.emoji} {r.cartao.nome}
                  </span>
                  <span className="mono muted pequeno">limite {fmt(r.cartao.limite)}</span>
                </div>
                {datas.length > 0 && <div className="mono muted mini">{datas.join(' · ')}</div>}
              </div>
              <div className="brow">
                <span className="bname">Fatura atual ({rotuloMesCurto(r.mesAtual)})</span>
                <span className="bval">{fmt(r.faturaAtual)}</span>
              </div>
              <div className="brow">
                <span className="bname">Próxima fatura ({rotuloMesCurto(somarMeses(r.mesAtual, 1))})</span>
                <span className="bval">{fmt(r.proximaFatura)}</span>
              </div>
              <div className="brow">
                <span className="bname">Parcelamentos futuros</span>
                <span className="bval">{fmt(r.futuras)}</span>
              </div>
              <div className={`brow total ${r.disponivel >= 0 ? 'positivo' : 'deficit'}`}>
                <span className="bname">Limite disponível</span>
                <span className="bval">
                  {r.disponivel < 0 ? '− ' : ''}
                  {fmt(Math.abs(r.disponivel))}
                </span>
              </div>
              <div className="cartao-uso">
                <Barra pct={r.pct} cor={cor} altura={5} />
                <div className="mono mini muted mt-4">{r.pct.toFixed(0)}% do limite comprometido</div>
              </div>
            </div>
          );
        })}
        <div className="nota">
          Limite disponível = limite − tudo em aberto (fatura atual, próxima e parcelas futuras). Depois do
          vencimento, a fatura do mês conta como paga. Total: {fmt(disponivelTotal)} de {fmt(limiteTotal)}.
        </div>
      </Secao>

      <Secao titulo="Comprometimento futuro">
        <div className="card card-pad">
          {futuro.map((f) => (
            <div key={f.mes} className="chart-row">
              <span className="chart-label">{rotuloMesCurto(f.mes)}</span>
              <div className="chart-bar-wrap">
                <Barra pct={(f.valor / maxFuturo) * 100} cor="var(--sky)" altura={7} />
              </div>
              <span className="chart-val">{fmt(f.valor)}</span>
            </div>
          ))}
        </div>
        <div className="nota">
          Soma das faturas de todos os cartões em cada mês, com as parcelas já lançadas.
        </div>
      </Secao>
    </>
  );
};
