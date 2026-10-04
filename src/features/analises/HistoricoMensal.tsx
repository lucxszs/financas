import { GraficoColunas } from '../../components/graficos';
import { Lock } from 'lucide-react';
import { Icone } from '../../components/icones';
import { Secao } from '../../components/ui';
import { mesAtualIso, rotuloMesCurto } from '../../domain/datas';
import { fmt, fmtCompacto } from '../../domain/formatadores';
import { serieMensal, type LinhaHistorico } from '../../domain/historico';
import { useDadosConfigurados } from '../dados/useDados';

const MESES = 6;

const LINHAS: { rotulo: string; valor: (l: LinhaHistorico) => string }[] = [
  { rotulo: 'Renda', valor: (l) => `${fmt(l.renda)}${l.rendaPrevista ? '*' : ''}` },
  { rotulo: 'Gastos', valor: (l) => fmt(l.gastos) },
  { rotulo: 'Investimentos', valor: (l) => fmt(l.investimentos) },
  { rotulo: 'Saldo', valor: (l) => fmt(l.saldo) },
  { rotulo: 'Patrimônio', valor: (l) => (l.patrimonio === null ? '·' : fmt(l.patrimonio)) },
];

export const HistoricoMensal = () => {
  const { config, transacoes, aportes, snapshots, fechamentosMes, cotacoes } = useDadosConfigurados();
  const mesAtual = mesAtualIso();
  const serie = serieMensal(
    transacoes,
    aportes,
    snapshots,
    config,
    cotacoes,
    mesAtual,
    MESES,
    fechamentosMes,
  );
  const pontos = (valor: (l: LinhaHistorico) => number) =>
    serie.map((l) => ({ rotulo: rotuloMesCurto(l.mes), valor: valor(l) }));

  return (
    <>
      <Secao titulo={`Histórico mensal · últimos ${MESES} meses`}>
        <div className="card tabela-rolagem">
          <table className="tabela-hist">
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr-only">Indicador</span>
                </th>
                {serie.map((l) => (
                  <th key={l.mes} scope="col" className={l.mes === mesAtual ? 'atual' : undefined}>
                    {l.fechado && <Icone icone={Lock} tamanho={10} aria-label="fechado" />}
                    {rotuloMesCurto(l.mes)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LINHAS.map((linha) => (
                <tr key={linha.rotulo}>
                  <th scope="row">{linha.rotulo}</th>
                  {serie.map((l) => (
                    <td key={l.mes} className={l.mes === mesAtual ? 'atual' : undefined}>
                      {linha.valor(l)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="nota">
          Cadeado = mês fechado (valores da foto do fechamento). * renda prevista (sem salário lançado no
          mês). Patrimônio: foto do &quot;Atualizar saldos&quot; do mês. O mês atual ainda está em andamento.
        </div>
      </Secao>

      <Secao titulo="Gráficos">
        <div className="card card-pad">
          <div className="grafico-titulo">Gastos por mês</div>
          <GraficoColunas
            pontos={pontos((l) => l.gastos)}
            cor="var(--sky)"
            formatar={fmt}
            formatarEixo={fmtCompacto}
            descricao="Gastos por mês"
          />
        </div>
        <div className="card card-pad mt-8">
          <div className="grafico-titulo">Investimentos por mês</div>
          <GraficoColunas
            pontos={pontos((l) => l.investimentos)}
            cor="var(--violet)"
            formatar={fmt}
            formatarEixo={fmtCompacto}
            descricao="Investimentos por mês"
          />
        </div>
      </Secao>
    </>
  );
};
