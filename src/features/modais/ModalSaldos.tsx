import { useState, type FormEvent } from 'react';
import { AcoesModal, GradeOpcoes, Modal } from '../../components/ui';
import { mesAtualIso } from '../../domain/datas';
import type { Cotacoes, Resposta, ScoreMes, Snapshot } from '../../domain/types';
import { useEnvio } from '../../hooks/useEnvio';
import { salvarSaldos } from '../../services/repositorio';
import { useDadosConfigurados } from '../dados/useDados';

const RESPOSTAS = [
  { id: 'sim' as const, rotulo: 'Sim' },
  { id: 'parcial' as const, rotulo: 'Parcial' },
  { id: 'nao' as const, rotulo: 'Não' },
];

const PERGUNTAS: { campo: keyof ScoreMes; texto: string }[] = [
  { campo: 'pagou', texto: 'Pagou as contas?' },
  { campo: 'positivo', texto: 'Mês fechou positivo?' },
  { campo: 'aporte', texto: 'Fez o aporte?' },
];

const paraNumero = (s: string) => (s.trim() === '' ? null : Number(s));

export const ModalSaldos = ({ onFechar }: { onFechar: () => void }) => {
  const { uid, config, saldos, cotacoes } = useDadosConfigurados();
  const { msg, erro, salvando, avisar, enviar } = useEnvio(onFechar);

  const [valores, setValores] = useState<Record<string, string>>(() =>
    Object.fromEntries(config.caixinhas.map((c) => [c.id, String(saldos.valores[c.id] ?? '')])),
  );
  const [rendimentos, setRendimentos] = useState<Record<string, string>>({});
  const [score, setScore] = useState<ScoreMes>(saldos.score ?? {});

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const novosValores: Record<string, number> = {};
    for (const c of config.caixinhas) {
      const n = paraNumero(valores[c.id] ?? '');
      if (n !== null && (!Number.isFinite(n) || n < 0)) return avisar(`⚠️ Valor inválido em ${c.nome}`);
      // Campo vazio mantém o saldo anterior; 0 é aceito como zero.
      novosValores[c.id] = n ?? saldos.valores[c.id] ?? 0;
    }

    const rends: Record<string, number> = {};
    for (const [id, v] of Object.entries(rendimentos)) {
      const n = paraNumero(v);
      if (n !== null && Number.isFinite(n)) rends[id] = n;
    }

    const moedasUsadas = new Set(config.caixinhas.map((c) => c.moeda));
    const cotacoesUsadas: Cotacoes = Object.fromEntries(
      Object.entries(cotacoes).filter(([m]) => moedasUsadas.has(m as keyof Cotacoes)),
    );

    const snapshot: Snapshot = {
      mes: mesAtualIso(),
      valores: novosValores,
      ...(Object.keys(rends).length ? { rendimentos: rends } : {}),
      ...(Object.keys(cotacoesUsadas).length ? { cotacoes: cotacoesUsadas } : {}),
    };

    void enviar(() =>
      salvarSaldos(uid, { valores: novosValores, score, updatedAt: new Date().toISOString() }, snapshot),
    );
  };

  return (
    <Modal titulo="Atualizar saldos" onFechar={onFechar}>
      <form onSubmit={onSubmit}>
        <div className="modal-section-title">Investimentos</div>
        <div className="field-row">
          {config.caixinhas.map((c) => (
            <div className="field" key={c.id}>
              <label htmlFor={`saldo-${c.id}`}>
                {c.nome} ({c.moeda})
              </label>
              <input
                id={`saldo-${c.id}`}
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={valores[c.id] ?? ''}
                onChange={(e) => setValores((v) => ({ ...v, [c.id]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        <div className="modal-section-title">Rendimento do mês (opcional)</div>
        <div className="field-row">
          {config.caixinhas.map((c) => (
            <div className="field" key={c.id}>
              <label htmlFor={`rend-${c.id}`}>
                {c.nome} ({c.moeda})
              </label>
              <input
                id={`rend-${c.id}`}
                type="number"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                value={rendimentos[c.id] ?? ''}
                onChange={(e) => setRendimentos((r) => ({ ...r, [c.id]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        <div className="modal-section-title">Score do mês</div>
        {PERGUNTAS.map((p) => (
          <div className="field" key={p.campo}>
            <label>{p.texto}</label>
            <GradeOpcoes<Resposta>
              opcoes={RESPOSTAS}
              valor={score[p.campo] ?? ''}
              onChange={(v) => setScore((s) => ({ ...s, [p.campo]: v }))}
            />
          </div>
        ))}

        <AcoesModal onCancelar={onFechar} rotuloSalvar="Salvar" salvando={salvando} />
        <div className={`save-msg${erro ? ' erro' : ''}`}>{msg}</div>
      </form>
    </Modal>
  );
};
