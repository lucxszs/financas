import { Secao } from '../../components/ui';
import { calcularScore } from '../../domain/calculos';
import { useDadosConfigurados } from '../dados/useDados';
import { CartoesResumo } from '../gastos/CartoesResumo';
import { Contagem } from '../metas/PaginaMetas';

const ROTULO_RESPOSTA = { sim: 'sim', parcial: 'parcial', nao: 'não' } as const;

// Provisório: o resumo do mês e o "quanto posso gastar" substituem este conteúdo no próximo PR.
export const PaginaDashboard = () => {
  const { config, saldos } = useDadosConfigurados();
  const score = calcularScore(saldos.score);
  const comData = config.objetivos.filter((o) => o.dataAlvo);

  return (
    <>
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

      <CartoesResumo />

      {comData.map((o) => (
        <Contagem key={o.id} objetivo={o} />
      ))}
    </>
  );
};
