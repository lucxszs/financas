import { Barra, Secao } from '../../components/ui';
import { hojeIso, rotuloDiaMes, rotuloMesLongo } from '../../domain/datas';
import { fmt } from '../../domain/formatadores';
import { insightsMes, limiteGastos, resumoMes, type StatusLimite } from '../../domain/resumo';
import { useDadosConfigurados } from '../dados/useDados';

const STATUS: Record<StatusLimite, { icone: string; titulo: string; texto: string; cls: string }> = {
  seguro: { icone: '🟢', titulo: 'Seguro', texto: 'Você está dentro do orçamento.', cls: 'verde' },
  atencao: {
    icone: '🟡',
    titulo: 'Atenção',
    texto: 'Você está gastando acima do planejado.',
    cls: 'amarelo',
  },
  cuidado: {
    icone: '🔴',
    titulo: 'Cuidado',
    texto: 'Se continuar nesse ritmo, termina o mês negativo.',
    cls: 'vermelho',
  },
};

const sinal = (v: number) => `${v < 0 ? '− ' : ''}${fmt(Math.abs(v))}`;

export const PaginaDashboard = () => {
  const { config, saldos, transacoes, aportes, cotacoes } = useDadosConfigurados();
  const hoje = hojeIso();
  const mes = hoje.slice(0, 7);

  const resumo = resumoMes(transacoes, aportes, config, cotacoes, mes);
  const limite = limiteGastos(resumo, transacoes, config, cotacoes, hoje);
  const insights = insightsMes(resumo, transacoes, config, saldos.valores, cotacoes);
  const status = STATUS[limite.status];
  const corGastos =
    resumo.gastosSobreRenda > 90
      ? 'var(--coral)'
      : resumo.gastosSobreRenda > 70
        ? 'var(--amber)'
        : 'var(--sky)';

  return (
    <>
      <Secao titulo={`Resumo do mês · ${rotuloMesLongo(mes)}`}>
        <div className="card">
          <div className="brow">
            <span className="bname">Renda{resumo.rendaPrevista && ' (prevista)'}</span>
            <span className="bval">{fmt(resumo.renda)}</span>
          </div>
          <div className="brow out">
            <span className="bname">Gastos</span>
            <span className="bval">{fmt(resumo.gastos)}</span>
          </div>
          <div className="brow">
            <span className="bname">Investimentos</span>
            <span className="bval violeta">{fmt(resumo.investimentos)}</span>
          </div>
          <div className={`brow total ${resumo.saldoLivre >= 0 ? 'positivo' : 'deficit'}`}>
            <span className="bname">Saldo livre</span>
            <span className="bval">{sinal(resumo.saldoLivre)}</span>
          </div>
          <div className="resumo-taxas">
            <div>
              <div className="tc-label">Taxa de poupança</div>
              <div className="resumo-taxa">{resumo.taxaPoupanca.toFixed(1)}%</div>
            </div>
            <div className="texto-direita">
              <div className="tc-label">Gastos / renda</div>
              <div className="resumo-taxa">{resumo.gastosSobreRenda.toFixed(1)}%</div>
            </div>
          </div>
          <div className="resumo-barra">
            <Barra pct={resumo.gastosSobreRenda} cor={corGastos} altura={8} />
          </div>
        </div>

        {insights.length > 0 && (
          <div className="card mt-8">
            {insights.map((i) => (
              <div key={i.texto} className={`insight ${i.tom}`}>
                <span className="insight-icone">{i.icone}</span>
                <span>{i.texto}</span>
              </div>
            ))}
          </div>
        )}
      </Secao>

      <Secao titulo="💳 Limite de gastos">
        <div className="card">
          <div className="limite-topo">
            <div className="tc-label">Disponível para gastar este mês</div>
            <div className={`limite-valor ${limite.disponivel < 0 ? 'coral' : ''}`}>
              {sinal(limite.disponivel)}
            </div>
            <div className="mono pequeno muted">
              {fmt(limite.porDia)}/dia · até {rotuloDiaMes(limite.ate)} ({limite.diasRestantes}{' '}
              {limite.diasRestantes === 1 ? 'dia' : 'dias'})
            </div>
          </div>
          <div className="brow">
            <span className="bname">Renda{resumo.rendaPrevista && ' (prevista)'}</span>
            <span className="bval">{fmt(resumo.renda)}</span>
          </div>
          <div className="brow">
            <span className="bname">Já gasto</span>
            <span className="bval">− {fmt(limite.jaGasto)}</span>
          </div>
          <div className="brow">
            <span className="bname">Investimentos</span>
            <span className="bval">− {fmt(limite.investimentos)}</span>
          </div>
          <div className="brow">
            <span className="bname">Contas fixas a pagar</span>
            <span className="bval">− {fmt(limite.contasFixas)}</span>
          </div>
          <div className={`brow total ${limite.disponivel >= 0 ? 'positivo' : 'deficit'}`}>
            <span className="bname">Margem restante</span>
            <span className="bval">{sinal(limite.disponivel)}</span>
          </div>
        </div>
        <div className={`status-limite ${status.cls}`}>
          <span className="score-icon">{status.icone}</span>
          <div>
            <div className="score-title">{status.titulo}</div>
            <div className="score-sub">{status.texto}</div>
          </div>
        </div>
        <div className="nota">
          Investimentos: o maior entre o aporte planejado e o já feito. Contas fixas: recorrentes que ainda
          vão cair este mês. Compras no cartão contam no mês da fatura.
        </div>
      </Secao>
    </>
  );
};
