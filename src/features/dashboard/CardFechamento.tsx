import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Icone } from '../../components/icones';
import { ModalConfirmacao, Secao } from '../../components/ui';
import { hojeIso, rotuloMesLongo } from '../../domain/datas';
import { mesesParaFechar, montarFechamento } from '../../domain/fechamento';
import { patrimonioAtual } from '../../domain/patrimonio';
import { fecharMes } from '../../services/repositorio';
import { FechamentoDetalhe } from '../analises/FechamentoDetalhe';
import { useDadosConfigurados } from '../dados/useDados';

/** Aparece quando há mês para fechar: meses passados em aberto (o mais antigo primeiro) ou o atual, no último dia. */
export const CardFechamento = () => {
  const { uid, config, saldos, transacoes, aportes, snapshots, fechamentosMes, cotacoes } =
    useDadosConfigurados();
  const [confirmando, setConfirmando] = useState(false);
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const hoje = hojeIso();
  const abertos = mesesParaFechar({ transacoes, aportes, fechamentos: fechamentosMes }, hoje);
  const mes = escolhido && abertos.includes(escolhido) ? escolhido : abertos[0];
  if (!mes) return null;

  const dados = {
    transacoes,
    aportes,
    snapshots,
    fechamentos: fechamentosMes,
    config,
    cotacoes,
    patrimonioAgora: patrimonioAtual(config, saldos.valores, cotacoes, transacoes, hoje, saldos.cartoes)
      .liquido,
    hoje,
  };
  const previa = montarFechamento(mes, dados, '');
  const nome = rotuloMesLongo(mes);

  return (
    <Secao titulo={`Fechamento de ${nome}`} icone={Lock}>
      <div className="card">
        {abertos.length > 1 && (
          <div className="card-pad">
            <div className="field">
              <label htmlFor="fechar-mes">{abertos.length} meses em aberto</label>
              <select id="fechar-mes" value={mes} onChange={(e) => setEscolhido(e.target.value)}>
                {abertos.map((m) => (
                  <option key={m} value={m}>
                    {rotuloMesLongo(m)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
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
