import { useState, type FormEvent } from 'react';
import { ModalConfirmacao, Secao } from '../../components/ui';
import { CATEGORIAS, categoriaPorId, tipoPorId } from '../../domain/catalogos';
import { hojeIso, rotuloMesCurto, somarMeses } from '../../domain/datas';
import { fmt, formatarMoeda } from '../../domain/formatadores';
import { gerarId } from '../../domain/ids';
import type { Caixinha, Cartao, Categoria, Config, Objetivo, Recorrente } from '../../domain/types';
import { useEnvio } from '../../hooks/useEnvio';
import { useDadosConfigurados } from '../dados/useDados';
import { ListaConfig } from './componentes';
import { numeroOuNulo, useSalvarConfig } from './configuracao';
import { ModalCaixinha } from './ModalCaixinha';
import { ModalCartao } from './ModalCartao';
import { ModalObjetivo } from './ModalObjetivo';
import { ModalRecorrente } from './ModalRecorrente';

type Editando =
  | { tipo: 'caixinha'; item?: Caixinha }
  | { tipo: 'cartao'; item?: Cartao }
  | { tipo: 'objetivo'; item?: Objetivo }
  | { tipo: 'recorrente'; item?: Recorrente }
  | null;

const dia = (n: number) => String(n).padStart(2, '0');

/** Impede excluir algo que ainda é usado em outro lugar da config. */
const exigirSemUso = (usos: string[], oque: string) => {
  if (usos.length) throw new Error(`${oque} em uso: ${usos.join(', ')}. Ajuste esses itens antes.`);
};

export const PaginaConfiguracoes = () => {
  const { config } = useDadosConfigurados();
  const salvar = useSalvarConfig();
  const [editando, setEditando] = useState<Editando>(null);
  const fechar = () => setEditando(null);
  const recorrentes = config.recorrentes ?? [];
  const nomeCaixinha = (id: string) => config.caixinhas.find((c) => c.id === id)?.nome ?? id;

  const excluir = <K extends 'caixinhas' | 'cartoes' | 'objetivos' | 'recorrentes'>(chave: K, id: string) =>
    salvar((c) => ({ ...c, [chave]: (c[chave] ?? []).filter((x: { id: string }) => x.id !== id) }) as Config);

  return (
    <>
      <FormGeral />

      <ListaConfig
        titulo="Caixinhas"
        itens={config.caixinhas}
        vazio="Nenhuma caixinha."
        descricao={(c) => c.nome}
        linha={(c) => ({
          icone: c.emoji ?? (c.tipo === 'conta' ? '🏦' : '📈'),
          titulo: c.nome,
          sub: [c.tipo === 'conta' ? 'Conta' : 'Investimento', c.moeda, c.rendimento]
            .filter(Boolean)
            .join(' · '),
        })}
        onNovo={() => setEditando({ tipo: 'caixinha' })}
        onEditar={(item) => setEditando({ tipo: 'caixinha', item })}
        onExcluir={async (c) => {
          exigirSemUso(
            [
              ...config.objetivos.filter((o) => o.caixinhas.includes(c.id)).map((o) => o.nome),
              ...recorrentes.filter((r) => r.tipo === 'aporte' && r.caixinha === c.id).map((r) => r.desc),
            ],
            'Caixinha',
          );
          await excluir('caixinhas', c.id);
        }}
      />

      <ListaConfig
        titulo="Cartões"
        itens={config.cartoes}
        vazio="Nenhum cartão."
        descricao={(c) => c.nome}
        linha={(c) => ({
          icone: c.emoji ?? '💳',
          titulo: c.nome,
          sub: [
            `limite ${fmt(c.limite)}`,
            c.melhorDiaCompra && `melhor dia ${dia(c.melhorDiaCompra)}`,
            c.diaVencimento && `vence ${dia(c.diaVencimento)}`,
          ]
            .filter(Boolean)
            .join(' · '),
        })}
        onNovo={() => setEditando({ tipo: 'cartao' })}
        onEditar={(item) => setEditando({ tipo: 'cartao', item })}
        onExcluir={async (c) => {
          exigirSemUso(
            recorrentes.filter((r) => r.tipo === 'transacao' && r.cartao === c.id).map((r) => r.desc),
            'Cartão',
          );
          await excluir('cartoes', c.id);
        }}
      />

      <ListaConfig
        titulo="Objetivos"
        itens={config.objetivos}
        vazio="Nenhum objetivo."
        descricao={(o) => o.nome}
        linha={(o) => ({
          icone: o.emoji ?? '🎯',
          titulo: o.nome,
          sub: [
            `meta ${fmt(o.meta)}`,
            o.aporteMensal && `${fmt(o.aporteMensal)}/mês`,
            o.dataAlvo && `até ${rotuloMesCurto(o.dataAlvo.slice(0, 7))}`,
          ]
            .filter(Boolean)
            .join(' · '),
        })}
        onNovo={() => setEditando({ tipo: 'objetivo' })}
        onEditar={(item) => setEditando({ tipo: 'objetivo', item })}
        onExcluir={(o) => excluir('objetivos', o.id)}
      />

      <FormOrcamento />

      <ListaConfig
        titulo="Recorrentes"
        itens={recorrentes}
        vazio="Nenhuma recorrência. Cadastre contas fixas, salário e aportes para o app lançar sozinho todo mês."
        descricao={(r) => r.desc}
        linha={(r) => ({
          icone: r.tipo === 'aporte' ? '🐷' : (categoriaPorId(r.cat)?.emoji ?? '🧾'),
          titulo: `${r.desc}${r.ativo ? '' : ' (pausada)'}`,
          sub: [
            `dia ${dia(r.dia)}`,
            r.tipo === 'aporte'
              ? `${formatarMoeda(r.val, config.caixinhas.find((c) => c.id === r.caixinha)?.moeda)} em ${nomeCaixinha(r.caixinha)}`
              : `${fmt(r.val)} · ${tipoPorId(r.tipoTransacao)?.nome ?? r.tipoTransacao}`,
          ].join(' · '),
        })}
        onNovo={() => setEditando({ tipo: 'recorrente' })}
        onEditar={(item) => setEditando({ tipo: 'recorrente', item })}
        onExcluir={(r) => excluir('recorrentes', r.id)}
        extra={<ImportarAlocacao />}
      />
      <div className="nota">
        Excluir uma recorrência não apaga o que ela já lançou. Lançamentos automáticos excluídos à mão não
        voltam.
      </div>

      {editando?.tipo === 'caixinha' && <ModalCaixinha caixinha={editando.item} onFechar={fechar} />}
      {editando?.tipo === 'cartao' && <ModalCartao cartao={editando.item} onFechar={fechar} />}
      {editando?.tipo === 'objetivo' && <ModalObjetivo objetivo={editando.item} onFechar={fechar} />}
      {editando?.tipo === 'recorrente' && <ModalRecorrente recorrente={editando.item} onFechar={fechar} />}
    </>
  );
};

const FormGeral = () => {
  const { config } = useDadosConfigurados();
  const salvar = useSalvarConfig();
  const { msg, erro, salvando, avisar, enviar, limpar } = useEnvio(() => undefined, 1500);
  const [renda, setRenda] = useState(String(config.rendaMensal));
  const [taxa, setTaxa] = useState(String(Math.round(config.taxaAnualEstimada * 10000) / 100));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const r = numeroOuNulo(renda);
    const t = numeroOuNulo(taxa);
    if (r === null || !Number.isFinite(r) || r < 0) return avisar('⚠️ Renda inválida');
    if (t === null || !Number.isFinite(t) || t < 0 || t > 100) return avisar('⚠️ Taxa deve ser de 0 a 100%');
    void enviar(() => salvar((c) => ({ ...c, rendaMensal: r, taxaAnualEstimada: t / 100 })), '✅ Salvo!');
  };

  return (
    <Secao titulo="Geral">
      <form className="card card-pad" onSubmit={onSubmit} onChange={limpar}>
        <div className="field-row">
          <div className="field">
            <label htmlFor="cf-renda">Renda mensal (R$)</label>
            <input
              id="cf-renda"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              value={renda}
              onChange={(e) => setRenda(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="cf-taxa">Rendimento estimado (% ao ano)</label>
            <input
              id="cf-taxa"
              type="number"
              step="0.01"
              min="0"
              max="100"
              inputMode="decimal"
              value={taxa}
              onChange={(e) => setTaxa(e.target.value)}
            />
          </div>
        </div>
        <button type="submit" className="btn-save" disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
        <div className={`save-msg${erro ? ' erro' : ''}`}>{msg}</div>
      </form>
    </Secao>
  );
};

const FormOrcamento = () => {
  const { config } = useDadosConfigurados();
  const salvar = useSalvarConfig();
  const { msg, erro, salvando, avisar, enviar, limpar } = useEnvio(() => undefined, 1500);
  const [valores, setValores] = useState<Record<string, string>>(() =>
    Object.fromEntries(CATEGORIAS.map((c) => [c.id, String(config.orcamentos?.[c.id] ?? '')])),
  );
  const total = Object.values(valores).reduce((a, v) => a + (Number(v) || 0), 0);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const orcamentos: Partial<Record<Categoria, number>> = {};
    for (const c of CATEGORIAS) {
      const n = numeroOuNulo(valores[c.id] ?? '');
      if (n === null) continue;
      if (!Number.isFinite(n) || n < 0) return avisar(`⚠️ Valor inválido em ${c.nome}`);
      orcamentos[c.id] = n;
    }
    void enviar(() => salvar((c) => ({ ...c, orcamentos })), '✅ Orçamento salvo!');
  };

  return (
    <Secao titulo="Orçamento mensal por categoria">
      <form className="card card-pad" onSubmit={onSubmit} onChange={limpar}>
        <div className="grade-orcamento">
          {CATEGORIAS.map((c) => (
            <div key={c.id} className="field">
              <label htmlFor={`orc-${c.id}`}>
                {c.emoji} {c.nome}
              </label>
              <input
                id={`orc-${c.id}`}
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                placeholder="sem limite"
                value={valores[c.id] ?? ''}
                onChange={(e) => setValores((v) => ({ ...v, [c.id]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <div className="linha-entre mono pequeno mb-12">
          <span className="muted">Total orçado</span>
          <span>{fmt(total)}</span>
        </div>
        <button type="submit" className="btn-save" disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar orçamento'}
        </button>
        <div className={`save-msg${erro ? ' erro' : ''}`}>{msg}</div>
      </form>
    </Secao>
  );
};

/** Transforma o aporte mensal planejado de cada objetivo em recorrência (na primeira caixinha em BRL dele). */
const ImportarAlocacao = () => {
  const { config } = useDadosConfigurados();
  const salvar = useSalvarConfig();
  const [confirmando, setConfirmando] = useState(false);
  const recorrentes = config.recorrentes ?? [];

  const candidatos = config.objetivos.flatMap((o) => {
    const caixinha = config.caixinhas.find((c) => o.caixinhas.includes(c.id) && c.moeda === 'BRL');
    const jaExiste = recorrentes.some((r) => r.tipo === 'aporte' && o.caixinhas.includes(r.caixinha));
    return o.aporteMensal && caixinha && !jaExiste ? [{ objetivo: o, caixinha }] : [];
  });
  if (!candidatos.length) return null;

  const proximoMes = somarMeses(hojeIso().slice(0, 7), 1);
  const criar = () =>
    salvar((c) => {
      const ids = (c.recorrentes ?? []).map((r) => r.id);
      const novas: Recorrente[] = candidatos.map(({ objetivo, caixinha }) => {
        const id = gerarId(`aporte ${objetivo.nome}`, ids);
        ids.push(id);
        return {
          id,
          tipo: 'aporte',
          desc: `Aporte ${objetivo.nome}`,
          val: objetivo.aporteMensal!,
          dia: 10,
          ativo: true,
          inicio: proximoMes,
          caixinha: caixinha.id,
        };
      });
      return { ...c, recorrentes: [...(c.recorrentes ?? []), ...novas] };
    });

  return (
    <div className="card-rodape">
      <button className="btn btn-mini" onClick={() => setConfirmando(true)}>
        🐷 Criar aportes a partir da alocação mensal
      </button>
      {confirmando && (
        <ModalConfirmacao
          titulo="Criar aportes automáticos?"
          rotuloConfirmar="Criar"
          mensagem={
            <>
              {candidatos.map(({ objetivo, caixinha }) => (
                <div key={objetivo.id}>
                  <strong>{fmt(objetivo.aporteMensal!)}</strong> em {caixinha.nome}
                </div>
              ))}
              <br />
              Todo dia 10, a partir de {rotuloMesCurto(proximoMes)}. Dá para editar o dia e o valor depois.
            </>
          }
          onConfirmar={criar}
          onFechar={() => setConfirmando(false)}
        />
      )}
    </div>
  );
};
