import { useState, type FormEvent } from 'react';
import { AcoesModal, GradeOpcoes, Modal } from '../../components/ui';
import { CATEGORIAS, TIPOS, TIPOS_CREDITO } from '../../domain/catalogos';
import { dataNoMes, hojeIso, rotuloDiaMes, rotuloMesCurto, somarMeses } from '../../domain/datas';
import { gerarId } from '../../domain/ids';
import type { Categoria, Recorrente, TipoTransacao } from '../../domain/types';
import { useEnvio } from '../../hooks/useEnvio';
import { useDadosConfigurados } from '../dados/useDados';
import { diaValido, numeroOuNulo, useSalvarConfig } from './configuracao';

type Tipo = Recorrente['tipo'];

const TIPOS_RECORRENTE: { id: Tipo; rotulo: string }[] = [
  { id: 'transacao', rotulo: '🧾 Conta ou entrada' },
  { id: 'aporte', rotulo: '🐷 Aporte' },
];

export const ModalRecorrente = ({
  recorrente,
  onFechar,
}: {
  recorrente?: Recorrente;
  onFechar: () => void;
}) => {
  const { config } = useDadosConfigurados();
  const salvar = useSalvarConfig();
  const { msg, erro, salvando, avisar, enviar } = useEnvio(onFechar);

  const [tipo, setTipo] = useState<Tipo>(recorrente?.tipo ?? 'transacao');
  const [desc, setDesc] = useState(recorrente?.desc ?? '');
  const [val, setVal] = useState(recorrente ? String(recorrente.val) : '');
  const [dia, setDia] = useState(recorrente ? String(recorrente.dia) : '');
  const [ativo, setAtivo] = useState(recorrente?.ativo ?? true);
  const [comecarEsteMes, setComecarEsteMes] = useState(false);
  const tx = recorrente?.tipo === 'transacao' ? recorrente : undefined;
  const [tipoTransacao, setTipoTransacao] = useState<TipoTransacao | ''>(tx?.tipoTransacao ?? 'pix');
  const [cat, setCat] = useState<Categoria>(tx?.cat ?? 'moradia');
  const [cartao, setCartao] = useState(tx?.cartao ?? '');
  const [caixinha, setCaixinha] = useState(recorrente?.tipo === 'aporte' ? recorrente.caixinha : '');

  const hoje = hojeIso();
  const mesAtual = hoje.slice(0, 7);
  const diaNum = numeroOuNulo(dia);
  // Se o dia deste mês já passou, começar agora lança na hora; por isso o padrão é o mês seguinte.
  const dataEsteMes = diaValido(diaNum) ? dataNoMes(mesAtual, diaNum!) : null;
  const jaPassou = dataEsteMes !== null && dataEsteMes <= hoje;
  const credito = tipoTransacao !== '' && TIPOS_CREDITO.includes(tipoTransacao);
  const moedaCaixinha = config.caixinhas.find((c) => c.id === caixinha)?.moeda ?? 'BRL';

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const valor = numeroOuNulo(val);
    if (!desc.trim()) return avisar('⚠️ Informe a descrição');
    if (valor === null || !Number.isFinite(valor) || valor <= 0) return avisar('⚠️ Informe o valor');
    if (!diaValido(diaNum)) return avisar('⚠️ Dia deve ser de 1 a 31');
    if (tipo === 'transacao' && !tipoTransacao) return avisar('⚠️ Selecione o tipo do lançamento');
    if (tipo === 'transacao' && credito && !cartao) return avisar('⚠️ Selecione o cartão');
    if (tipo === 'aporte' && !caixinha) return avisar('⚠️ Selecione a caixinha');

    const inicio = recorrente?.inicio ?? (!jaPassou || comecarEsteMes ? mesAtual : somarMeses(mesAtual, 1));
    // Ao reativar, os meses da pausa não são lançados: retoma a partir deste mês.
    const reativando = recorrente && !recorrente.ativo && ativo;
    const mesAnterior = somarMeses(mesAtual, -1);
    const lancadoAte =
      reativando && (!recorrente.lancadoAte || recorrente.lancadoAte < mesAnterior)
        ? mesAnterior
        : recorrente?.lancadoAte;
    const base = {
      id:
        recorrente?.id ??
        gerarId(
          desc,
          (config.recorrentes ?? []).map((r) => r.id),
        ),
      desc: desc.trim(),
      val: valor,
      dia: diaNum!,
      ativo,
      inicio,
      lancadoAte,
    };
    const nova: Recorrente =
      tipo === 'aporte'
        ? { ...base, tipo, caixinha }
        : {
            ...base,
            tipo,
            tipoTransacao: tipoTransacao as TipoTransacao,
            cat,
            cartao: credito ? cartao : null,
          };

    void enviar(
      () =>
        salvar((c) => {
          const atuais = c.recorrentes ?? [];
          return {
            ...c,
            recorrentes: recorrente
              ? atuais.map((x) => (x.id === recorrente.id ? nova : x))
              : [...atuais, nova],
          };
        }),
      '✅ Recorrência salva!',
    );
  };

  return (
    <Modal titulo={recorrente ? 'Editar recorrência' : 'Nova recorrência'} onFechar={onFechar}>
      <form onSubmit={onSubmit}>
        {!recorrente && (
          <div className="field">
            <GradeOpcoes colunas={2} opcoes={TIPOS_RECORRENTE} valor={tipo} onChange={setTipo} />
          </div>
        )}
        <div className="field">
          <label htmlFor="rc-desc">Descrição</label>
          <input
            id="rc-desc"
            maxLength={120}
            placeholder={tipo === 'aporte' ? 'Ex: Aporte reserva' : 'Ex: Aluguel, Internet, Salário'}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="rc-val">Valor ({tipo === 'aporte' ? moedaCaixinha : 'BRL'})</label>
            <input
              id="rc-val"
              type="number"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              value={val}
              onChange={(e) => setVal(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="rc-dia">Dia do mês</label>
            <input
              id="rc-dia"
              type="number"
              min="1"
              max="31"
              inputMode="numeric"
              value={dia}
              onChange={(e) => setDia(e.target.value)}
            />
          </div>
        </div>

        {tipo === 'transacao' ? (
          <>
            <div className="field">
              <label>Tipo do lançamento</label>
              <GradeOpcoes
                opcoes={TIPOS.map((t) => ({ id: t.id, rotulo: `${t.emoji} ${t.nome}` }))}
                valor={tipoTransacao}
                onChange={setTipoTransacao}
              />
            </div>
            {credito && (
              <div className="field">
                <label>Cartão</label>
                <GradeOpcoes
                  colunas={2}
                  opcoes={config.cartoes.map((c) => ({ id: c.id, rotulo: `${c.emoji ?? '💳'} ${c.nome}` }))}
                  valor={cartao}
                  onChange={setCartao}
                />
              </div>
            )}
            <div className="field">
              <label htmlFor="rc-cat">Categoria</label>
              <select id="rc-cat" value={cat} onChange={(e) => setCat(e.target.value as Categoria)}>
                {CATEGORIAS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.nome}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <div className="field">
            <label>Caixinha</label>
            <GradeOpcoes
              colunas={2}
              opcoes={config.caixinhas.map((c) => ({
                id: c.id,
                rotulo: `${c.emoji ?? ''} ${c.nome}`.trim(),
              }))}
              valor={caixinha}
              onChange={setCaixinha}
            />
          </div>
        )}

        {recorrente ? (
          <div className="nota mb-12">
            Desde {rotuloMesCurto(recorrente.inicio)}
            {recorrente.lancadoAte && ` · lançada até ${rotuloMesCurto(recorrente.lancadoAte)}`}
          </div>
        ) : (
          jaPassou && (
            <label className="check">
              <input
                type="checkbox"
                checked={comecarEsteMes}
                onChange={(e) => setComecarEsteMes(e.target.checked)}
              />
              Lançar também este mês ({rotuloDiaMes(dataEsteMes!)} já passou)
            </label>
          )
        )}
        <label className="check">
          <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
          Ativa (desmarque para pausar sem apagar)
        </label>

        <AcoesModal onCancelar={onFechar} rotuloSalvar="Salvar" salvando={salvando} />
        <div className={`save-msg${erro ? ' erro' : ''}`}>{msg}</div>
      </form>
    </Modal>
  );
};
