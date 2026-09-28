import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Icone } from '../../components/icones';
import { ModalConfirmacao, Secao } from '../../components/ui';
import { hojeIso, rotuloMesLongo } from '../../domain/datas';
import { mesParaFechar, montarFechamento } from '../../domain/fechamento';
import { patrimonioAtual } from '../../domain/patrimonio';
import { fecharMes } from '../../services/repositorio';
import { FechamentoDetalhe } from '../analises/FechamentoDetalhe';
import { useDadosConfigurados } from '../dados/useDados';

/** Aparece quando há um mês para fechar: o anterior em aberto ou o atual, no último dia. */
export const CardFechamento = () => {
  const { uid, config, saldos, transacoes, aportes, snapshots, fechamentosMes, cotacoes } =
    useDadosConfigurados();
  const [confirmando, setConfirmando] = useState(false);
  const hoje = hojeIso();
  const mes = mesParaFechar({ transacoes, aportes, fechamentos: fechamentosMes }, hoje);
  if (!mes) return null;

  const dados = {
    transacoes,
    aportes,
    snapshots,
    fechamentos: fechamentosMes,
    config,
    cotacoes,
    patrimonioAgora: patrimonioAtual(config, saldos.valores, cotacoes, transacoes, hoje).liquido,
    hoje,
  };
  const previa = montarFechamento(mes, dados, '');
  const nome = rotuloMesLongo(mes);

  return (
    <Secao titulo={`Fechamento de ${nome}`} icone={Lock}>
      <div className="card">
        <FechamentoDetalhe f={previa} />
        <div className="card-rodape">
          <button className="btn-save largura-total" onClick={() => setConfirmando(true)}>
            <Icone icone={Lock} tamanho={15} /> Fechar {nome}
          </button>
        </div>
      </div>
      <div className="nota">
        Fechar salva uma foto imutável do mês; o histórico passa a usar ela mesmo que os lançamentos mudem
        depois. Para corrigir, reabra o mês em Análises.
      </div>
      {confirmando && (
        <ModalConfirmacao
          titulo={`Fechar ${nome}?`}
          rotuloConfirmar="Fechar mês"
          mensagem={
            <>
              Os valores acima ficam gravados como estão.
              <br />
              Confira se todos os lançamentos do mês estão feitos.
            </>
          }
          onConfirmar={() => fecharMes(uid, montarFechamento(mes, dados, new Date().toISOString()))}
          onFechar={() => setConfirmando(false)}
        />
      )}
    </Secao>
  );
};
