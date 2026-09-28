import { Secao } from '../../components/ui';
import type { LimiteGastos, ResumoMes } from '../../domain/resumo';
import { saudeFinanceira, type Sinal } from '../../domain/saude';
import { useDadosConfigurados } from '../dados/useDados';

const SINAL: Record<Sinal, { icone: string; rotulo: string }> = {
  verde: { icone: '🟢', rotulo: 'ok' },
  amarelo: { icone: '🟡', rotulo: 'atenção' },
  vermelho: { icone: '🔴', rotulo: 'cuidado' },
};

export const SaudeFinanceira = ({
  resumo,
  limite,
  hoje,
}: {
  resumo: ResumoMes;
  limite: LimiteGastos;
  hoje: string;
}) => {
  const { config, saldos, cotacoes, transacoes, aportes } = useDadosConfigurados();
  const itens = saudeFinanceira({
    config,
    valores: saldos.valores,
    cotacoes,
    transacoes,
    aportes,
    resumo,
    limite,
    hoje,
  });

  return (
    <Secao titulo="Saúde financeira">
      <div className="card">
        {itens.map((i) => (
          <div key={i.id} className="saude-row">
            <span className="saude-nome">
              {i.icone} {i.nome}
            </span>
            <span className="saude-detalhe">{i.detalhe}</span>
            <span className={`saude-sinal ${i.sinal}`} title={SINAL[i.sinal].rotulo}>
              {SINAL[i.sinal].icone} <span className="sr-only">{SINAL[i.sinal].rotulo}</span>
            </span>
          </div>
        ))}
      </div>
    </Secao>
  );
};
