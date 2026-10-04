import { useState, type FormEvent } from 'react';
import { NomeCaixinha } from '../../components/marcas';
import { AcoesModal, Modal } from '../../components/ui';
import { hojeIso, mesAtualIso, rotuloMesLongo, somarMeses } from '../../domain/datas';
import { dividasCartoes } from '../../domain/patrimonio';
import type { Cotacoes, LimiteInformado, MoedaEstrangeira, Snapshot } from '../../domain/types';
import { useEnvio } from '../../hooks/useEnvio';
import { salvarSaldos, salvarSnapshot } from '../../services/repositorio';
import { useDadosConfigurados } from '../dados/useDados';

const paraNumero = (s: string) => (s.trim() === '' ? null : Number(s.replace(',', '.')));
const texto = (v: number | undefined) => (v === undefined ? '' : String(v));
const MESES_PARA_TRAS = 12;

/**
 * Mês atual: atualiza os saldos de agora e a foto do mês.
 * Mês passado: grava só a foto daquele mês (preenche buracos no histórico), sem mexer nos saldos atuais.
 */
export const ModalSaldos = ({ onFechar }: { onFechar: () => void }) => {
  const { uid, config, saldos, snapshots, cotacoes, transacoes } = useDadosConfigurados();
  const { msg, erro, salvando, avisar, enviar } = useEnvio(onFechar);
  const mesAtual = mesAtualIso();
  const [mes, setMes] = useState(mesAtual);
  const passado = mes !== mesAtual;
  const moedasEstrangeiras = [
    ...new Set(config.caixinhas.flatMap((c) => (c.moeda === 'BRL' ? [] : [c.moeda as MoedaEstrangeira]))),
  ];

  const camposDoMes = (m: string) => {
    const foto = snapshots.find((s) => s.mes === m);
    const base = m === mesAtual ? { ...foto?.valores, ...saldos.valores } : (foto?.valores ?? {});
    return {
      valores: Object.fromEntries(config.caixinhas.map((c) => [c.id, texto(base[c.id])])),
      // Já vem preenchido: salvar de novo sem redigitar não apaga o rendimento do mês.
      rendimentos: Object.fromEntries(config.caixinhas.map((c) => [c.id, texto(foto?.rendimentos?.[c.id])])),
      cotacoes: Object.fromEntries(moedasEstrangeiras.map((m2) => [m2, texto(foto?.cotacoes?.[m2])])),
      dividas: texto(foto?.dividas),
    };
  };
  const [campos, setCampos] = useState(() => camposDoMes(mesAtual));
  // Limite disponível dos cartões (o que o app do banco mostra). Vazio = mantém o último informado.
  const [limites, setLimites] = useState<Record<string, string>>({});
  const trocarMes = (m: string) => {
    setMes(m);
    setCampos(camposDoMes(m));
  };
  const setCampo = (grupo: 'valores' | 'rendimentos' | 'cotacoes', id: string, v: string) =>
    setCampos((c) => ({ ...c, [grupo]: { ...c[grupo], [id]: v } }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const novosValores: Record<string, number> = {};
    for (const c of config.caixinhas) {
      const n = paraNumero(campos.valores[c.id] ?? '');
      if (n !== null && (!Number.isFinite(n) || n < 0)) return avisar(`Valor inválido em ${c.nome}`);
      // Mês atual: campo vazio mantém o saldo anterior. Mês passado: vazio = caixinha fora da foto.
      if (n !== null) novosValores[c.id] = n;
      else if (!passado) novosValores[c.id] = saldos.valores[c.id] ?? 0;
    }
    if (passado && !Object.keys(novosValores).length) return avisar('Informe ao menos um saldo');

    const rends: Record<string, number> = {};
    for (const [id, v] of Object.entries(campos.rendimentos)) {
      const n = paraNumero(v);
      if (n === null) continue;
      if (!Number.isFinite(n)) return avisar('Rendimento inválido');
      rends[id] = n;
    }

    const cotacoesFoto: Cotacoes = {};
    for (const m2 of moedasEstrangeiras) {
      const usada = config.caixinhas.some((c) => c.moeda === m2 && novosValores[c.id]);
      if (passado) {
        const n = paraNumero(campos.cotacoes[m2] ?? '');
        if (n !== null && (!Number.isFinite(n) || n <= 0)) return avisar(`Cotação do ${m2} inválida`);
        if (n === null && usada) return avisar(`Informe a cotação do ${m2} no fim de ${rotuloMesLongo(mes)}`);
        if (n !== null) cotacoesFoto[m2] = n;
      } else if (cotacoes[m2]) cotacoesFoto[m2] = cotacoes[m2];
    }

    const novosLimites: Record<string, LimiteInformado> = { ...saldos.cartoes };
    const agora = new Date().toISOString();
    for (const c of config.cartoes) {
      const n = paraNumero(limites[c.id] ?? '');
      if (n === null) continue;
      if (!Number.isFinite(n) || n < 0) return avisar(`Limite disponível inválido em ${c.nome}`);
      novosLimites[c.id] = { disponivel: n, em: agora };
    }

    const dividasPassado = paraNumero(campos.dividas);
    if (passado && dividasPassado !== null && (!Number.isFinite(dividasPassado) || dividasPassado < 0))
      return avisar('Faturas em aberto inválidas');

    // Para o histórico: como estava a foto deste mês antes de salvar.
    const fotoAnterior = snapshots.find((s) => s.mes === mes) ?? null;
    const snapshot: Snapshot = {
      mes,
      valores: novosValores,
      ...(Object.keys(rends).length ? { rendimentos: rends } : {}),
      ...(Object.keys(cotacoesFoto).length ? { cotacoes: cotacoesFoto } : {}),
      // Faturas em aberto no dia, para o patrimônio líquido daquele mês.
      dividas: passado ? (dividasPassado ?? 0) : dividasCartoes(config, transacoes, hojeIso(), novosLimites),
    };

    void enviar(
      () =>
        passado
          ? salvarSnapshot(uid, snapshot, fotoAnterior)
          : salvarSaldos(
              uid,
              {
                valores: novosValores,
                ...(Object.keys(novosLimites).length ? { cartoes: novosLimites } : {}),
                updatedAt: agora,
              },
              snapshot,
              { saldos, snapshot: fotoAnterior },
            ),
      passado ? `Foto de ${rotuloMesLongo(mes)} salva!` : 'Salvo!',
    );
  };

  return (
    <Modal titulo="Atualizar saldos" onFechar={onFechar}>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="saldo-mes">Mês</label>
          <select id="saldo-mes" value={mes} onChange={(e) => trocarMes(e.target.value)}>
            {Array.from({ length: MESES_PARA_TRAS + 1 }, (_, i) => somarMeses(mesAtual, -i)).map((m) => (
              <option key={m} value={m}>
                {rotuloMesLongo(m)}
                {m === mesAtual ? ' (atual)' : snapshots.some((s) => s.mes === m) ? '' : ' · sem dados'}
              </option>
            ))}
          </select>
          {passado && (
            <div className="nota">
              Saldos do fim do mês. Grava só o histórico de {rotuloMesLongo(mes)}; os saldos de hoje não
              mudam.
            </div>
          )}
        </div>

        <div className="modal-section-title">Saldos</div>
        <div className="field-row">
          {config.caixinhas.map((c) => (
            <div className="field" key={c.id}>
              <label htmlFor={`saldo-${c.id}`}>
                <NomeCaixinha caixinha={c} tamanho={14} /> ({c.moeda})
              </label>
              <input
                id={`saldo-${c.id}`}
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={campos.valores[c.id] ?? ''}
                onChange={(e) => setCampo('valores', c.id, e.target.value)}
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
                value={campos.rendimentos[c.id] ?? ''}
                onChange={(e) => setCampo('rendimentos', c.id, e.target.value)}
              />
            </div>
          ))}
        </div>

        {!passado && config.cartoes.length > 0 && (
          <>
            <div className="modal-section-title">Cartões: limite disponível no app do banco</div>
            <div className="field-row">
              {config.cartoes.map((c) => {
                const ultimo = saldos.cartoes?.[c.id];
                return (
                  <div className="field" key={c.id}>
                    <label htmlFor={`lim-${c.id}`}>
                      <NomeCaixinha caixinha={c} tamanho={14} />
                    </label>
                    <input
                      id={`lim-${c.id}`}
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      placeholder={
                        ultimo
                          ? `último: ${ultimo.disponivel.toLocaleString('pt-BR')} em ${new Date(ultimo.em).toLocaleDateString('pt-BR')}`
                          : 'ex.: 820.00'
                      }
                      value={limites[c.id] ?? ''}
                      onChange={(e) => setLimites((l) => ({ ...l, [c.id]: e.target.value }))}
                    />
                  </div>
                );
              })}
            </div>
            <div className="nota mb-12">Vazio mantém o último valor informado.</div>
          </>
        )}

        {passado && (
          <>
            <div className="modal-section-title">Fim do mês</div>
            <div className="field-row">
              {moedasEstrangeiras.map((m2) => (
                <div className="field" key={m2}>
                  <label htmlFor={`cot-${m2}`}>Cotação {m2} (R$)</label>
                  <input
                    id={`cot-${m2}`}
                    type="number"
                    step="0.0001"
                    min="0"
                    inputMode="decimal"
                    placeholder="ex.: 5.42"
                    value={campos.cotacoes[m2] ?? ''}
                    onChange={(e) => setCampo('cotacoes', m2, e.target.value)}
                  />
                </div>
              ))}
              <div className="field">
                <label htmlFor="saldo-dividas">Faturas em aberto (R$)</label>
                <input
                  id="saldo-dividas"
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={campos.dividas}
                  onChange={(e) => setCampos((c) => ({ ...c, dividas: e.target.value }))}
                />
              </div>
            </div>
          </>
        )}

        <AcoesModal onCancelar={onFechar} rotuloSalvar="Salvar" salvando={salvando} />
        <div className={`save-msg${erro ? ' erro' : ''}`}>{msg}</div>
      </form>
    </Modal>
  );
};
