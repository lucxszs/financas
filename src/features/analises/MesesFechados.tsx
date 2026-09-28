import { useState } from 'react';
import { ModalConfirmacao, Secao } from '../../components/ui';
import { rotuloMesCurto, rotuloMesLongo } from '../../domain/datas';
import { reabrirMes } from '../../services/repositorio';
import { useDadosConfigurados } from '../dados/useDados';
import { FechamentoDetalhe } from './FechamentoDetalhe';

export const MesesFechados = () => {
  const { uid, fechamentosMes } = useDadosConfigurados();
  const ordenados = [...fechamentosMes].sort((a, b) => a.mes.localeCompare(b.mes));
  const [sel, setSel] = useState<string | null>(null);
  const [reabrindo, setReabrindo] = useState(false);
  const atual = ordenados.find((f) => f.mes === sel) ?? ordenados.at(-1);
  if (!atual) return null;

  return (
    <Secao titulo="🔒 Meses fechados">
      <div className="mes-tabs" role="tablist">
        {ordenados.map((f) => (
          <button
            key={f.mes}
            role="tab"
            aria-selected={f.mes === atual.mes}
            className={`mes-tab${f.mes === atual.mes ? ' active' : ''}`}
            onClick={() => setSel(f.mes)}
          >
            {rotuloMesCurto(f.mes)}
          </button>
        ))}
      </div>
      <div className="card">
        <FechamentoDetalhe f={atual} />
        <div className="card-rodape linha-entre">
          <span className="mono mini muted">
            fechado em {new Date(atual.fechadoEm).toLocaleDateString('pt-BR')}
          </span>
          <button className="btn-perigo" onClick={() => setReabrindo(true)}>
            Reabrir mês
          </button>
        </div>
      </div>
      {reabrindo && (
        <ModalConfirmacao
          titulo={`Reabrir ${rotuloMesLongo(atual.mes)}?`}
          rotuloConfirmar="Reabrir"
          mensagem={
            <>
              A foto do fechamento é apagada e o mês volta a ser calculado pelos lançamentos.
              <br />
              Os lançamentos não mudam. Dá para fechar de novo depois.
            </>
          }
          onConfirmar={() => reabrirMes(uid, atual.mes)}
          onFechar={() => setReabrindo(false)}
        />
      )}
    </Secao>
  );
};
