import { useState, type FormEvent } from 'react';
import { AcoesModal, GradeOpcoes, Modal } from '../../components/ui';
import { hojeIso } from '../../domain/datas';
import { useEnvio } from '../../hooks/useEnvio';
import { atualizarAporte, criarAporte } from '../../services/repositorio';
import type { Aporte } from '../../domain/types';
import { useDadosConfigurados } from '../dados/useDados';

/** Sem `aporte`: cria. Com `aporte`: edita o existente. */
export const ModalAporte = ({ aporte, onFechar }: { aporte?: Aporte; onFechar: () => void }) => {
  const { uid, config } = useDadosConfigurados();
  const { msg, erro, salvando, avisar, enviar } = useEnvio(onFechar);
  const editando = Boolean(aporte);

  const [caixinha, setCaixinha] = useState(aporte?.caixinha ?? '');
  const [val, setVal] = useState(aporte ? String(aporte.val) : '');
  const [data, setData] = useState(aporte?.data ?? hojeIso());
  const [obs, setObs] = useState(aporte?.obs ?? '');

  const moeda = config.caixinhas.find((c) => c.id === caixinha)?.moeda ?? 'BRL';

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!caixinha) return avisar('⚠️ Selecione a caixinha');
    const valor = Number(val);
    if (!Number.isFinite(valor) || valor <= 0) return avisar('⚠️ Informe o valor');

    const dados = { caixinha, val: valor, data: data || hojeIso(), obs: obs.trim() };
    const agora = new Date().toISOString();

    void enviar(
      () =>
        aporte
          ? atualizarAporte(uid, aporte.id, { ...dados, criadoEm: aporte.criadoEm, atualizadoEm: agora })
          : criarAporte(uid, { ...dados, criadoEm: agora }),
      editando ? '✅ Aporte atualizado!' : '✅ Aporte lançado!',
    );
  };

  return (
    <Modal titulo={editando ? '🐷 Editar aporte' : '🐷 Lançar aporte'} onFechar={onFechar}>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label>Caixinha</label>
          <GradeOpcoes
            colunas={2}
            opcoes={config.caixinhas.map((c) => ({ id: c.id, rotulo: `${c.emoji ?? ''} ${c.nome}`.trim() }))}
            valor={caixinha}
            onChange={setCaixinha}
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="ap-val">Valor ({moeda})</label>
            <input
              id="ap-val"
              type="number"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={val}
              onChange={(e) => setVal(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="ap-data">Data</label>
            <input id="ap-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="ap-obs">Observação (opcional)</label>
          <input
            id="ap-obs"
            type="text"
            maxLength={200}
            placeholder="Ex: aporte mensal..."
            value={obs}
            onChange={(e) => setObs(e.target.value)}
          />
        </div>

        <AcoesModal onCancelar={onFechar} rotuloSalvar={editando ? 'Salvar' : 'Lançar'} salvando={salvando} />
        <div className={`save-msg${erro ? ' erro' : ''}`}>{msg}</div>
      </form>
    </Modal>
  );
};
