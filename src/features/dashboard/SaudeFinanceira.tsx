import { Activity, Banknote, CreditCard, Shield, Target, TrendingUp, type LucideIcon } from 'lucide-react';
import { Icone } from '../../components/icones';
import { Secao, StatusPonto } from '../../components/ui';
import type { LimiteGastos, ResumoMes } from '../../domain/resumo';
import { saudeFinanceira, type Indicador, type Sinal } from '../../domain/saude';
import { useDadosConfigurados } from '../dados/useDados';

const ICONE: Record<Indicador['id'], LucideIcon> = {
  gastos: Banknote,
  investimentos: TrendingUp,
  cartoes: CreditCard,
  metas: Target,
  reserva: Shield,
};

const ROTULO: Record<Sinal, string> = { verde: 'ok', amarelo: 'atenção', vermelho: 'cuidado' };

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
    <Secao titulo="Saúde financeira" icone={Activity}>
      <div className="card">
        {itens.map((i) => (
          <div key={i.id} className="saude-row">
            <span className="saude-nome icone-texto">
              <Icone icone={ICONE[i.id]} /> {i.nome}
            </span>
            <span className="saude-detalhe">{i.detalhe}</span>
            <StatusPonto sinal={i.sinal} rotulo={ROTULO[i.sinal]} mostrarRotulo />
          </div>
        ))}
      </div>
    </Secao>
  );
};
