# Modelo de dados

Tipos completos em [`src/domain/types.ts`](../src/domain/types.ts).

## Coleções

```
users/{uid}/perfil/config          Config
users/{uid}/perfil/saldos          Saldos
users/{uid}/snapshots/{YYYY-MM}    Snapshot
users/{uid}/fechamentosMes/{YYYY-MM} FechamentoMes (imutável)
users/{uid}/transacoes/{id}        Transacao
users/{uid}/aportes/{id}           Aporte
users/{uid}/historico/{id}         RegistroHistorico (imutável)
```

## Config

| Campo           | Tipo                       | Descrição                                              |
| --------------- | -------------------------- | ------------------------------------------------------ |
| `nome`          | string                     | Nome do plano (não é exibido na tela)                  |
| `rendaMensal`   | number                     | Renda de referência                                    |
| `caixinhas`     | Caixinha[]                 | Onde o dinheiro está                                   |
| `objetivos`     | Objetivo[]                 | Metas que somam uma ou mais caixinhas                  |
| `cartoes`       | Cartao[]                   | Cartões de crédito e limites                           |
| `alocacaoDesde` | `YYYY-MM`?                 | Rótulo "a partir de" da alocação mensal                |
| `orcamentos`    | `{ [categoria]: number }`? | Orçamento mensal por categoria, em BRL                 |
| `recorrentes`   | Recorrente[]?              | Lançamentos e aportes criados automaticamente todo mês |

**Caixinha:** `id`, `nome`, `emoji?`, `moeda` (`BRL` \| `USD` \| `EUR`), `rendimento` (texto, ex.: "115% CDI"),
`descricao?`, `cor` (`emerald` \| `amber` \| `violet` \| `coral` \| `sky`), `tipo?` (`investimento` \| `conta`;
ausente = investimento), `instituicao?` (`nubank` \| `itau` \| `inter` \| `mercadopago` \| `wise`; ausente =
deduzido do nome).

**Objetivo:** `id`, `nome`, `emoji?`, `descricao?`, `meta` (BRL), `caixinhas` (ids), `cor`, `aporteMensal?`,
`previsao?` (texto), `dataInicio?` e `dataAlvo?` (`YYYY-MM-DD`; com `dataAlvo` o objetivo entra na contagem regressiva),
`reservaEmergencia?` (boolean).

**Cartao:** `id`, `nome`, `emoji?`, `limite`, `cor`, `melhorDiaCompra?` e `diaVencimento?` (dias de 1 a 31), `instituicao?` (como na caixinha).
Compra antes do melhor dia cai na fatura que vence no mês; a partir dele, na do mês seguinte.

**Recorrente:** `id`, `desc`, `val`, `dia` (1 a 31; em mês curto vale o último dia), `ativo`, `inicio` (`YYYY-MM`),
`lancadoAte?` (`YYYY-MM`, último mês já lançado) e `tipo`:

- `transacao`: `tipoTransacao`, `cat`, `cartao` (id ou `null`), `variavel?` (boolean). Gera uma Transacao; se
  variável, com o último valor confirmado e `aConfirmar: true`.
- `aporte`: `caixinha` (id). Gera um Aporte, com `val` na moeda da caixinha.

O app lança sozinho, ao abrir, cada mês em aberto até hoje (no máximo 12 para trás), com id `rec_{id}_{YYYY-MM}`, e
atualiza `lancadoAte` no mesmo batch. Mês lançado não volta, mesmo que o lançamento seja excluído. Na importação, o
`inicio` de recorrentes nunca lançadas vira no mínimo o mês atual.

## Saldos

```ts
{ valores: { [caixinhaId]: number }, cartoes?: { [cartaoId]: { disponivel: number, em: string } }, updatedAt: string | null }
```

Valores na moeda da própria caixinha.

## Snapshot (evolução mensal)

```ts
{ mes: 'YYYY-MM', valores: {...}, rendimentos?: {...}, cotacoes?: { USD?: number, EUR?: number }, dividas?: number }
```

Criado ou sobrescrito a cada "Atualizar saldos" no mês. A cotação gravada é usada para calcular o total daquele mês; `dividas` (faturas em aberto no dia, em BRL) entra no patrimônio líquido. Fotos antigas sem `dividas` contam dívida 0.

## Transacao

| Campo          | Tipo                | Regras (firestore.rules)                       |
| -------------- | ------------------- | ---------------------------------------------- |
| `desc`         | string              | obrigatório, 1 a 120 caracteres                |
| `val`          | number              | > 0 e < 10.000.000                             |
| `tipo`         | string              | um dos tipos de `catalogos.ts`                 |
| `cat`          | string              | uma das categorias de `catalogos.ts`           |
| `data`         | `YYYY-MM-DD`        | obrigatório                                    |
| `cartao`       | string \| null      | só para crédito/parcelado                      |
| `mesFatura`    | `YYYY-MM` \| null   | mês do vencimento; vazio = mês de `data`       |
| `obs`          | string              | até 200 caracteres                             |
| `isEntrada`    | boolean             | derivado do tipo (recebi, salário)             |
| `criadoEm`     | ISO string          | obrigatório; **não pode mudar na edição**      |
| `atualizadoEm` | ISO string?         | preenchido ao editar                           |
| `recorrenteId` | string?             | id da recorrência que criou; até 60 chars      |
| `grupoId`      | string?             | liga as parcelas da mesma compra               |
| `parcela`      | `{ atual, total }`? | inteiros, 1 ≤ atual ≤ total ≤ 48               |
| `aConfirmar`   | boolean?            | lançado por recorrência variável, não revisado |

## Aporte

`caixinha` (id), `val` (> 0, na moeda da caixinha), `data` (`YYYY-MM-DD`), `obs` (até 200), `criadoEm` (imutável),
`atualizadoEm?`, `recorrenteId?`.

## FechamentoMes (fechamento mensal)

```ts
{
  mes: 'YYYY-MM', fechadoEm: string, renda, rendaPrevista, gastos, investimentos, saldo,
  maiorCategoria: { cat, valor } | null, maiorGasto: { desc, valor } | null,
  aportesPorMeta: [{ objetivoId, nome, emoji?, valor }], patrimonio: number | null, variacaoPatrimonio: number | null
}
```

Regras: só cria (id = `mes`, totais numéricos) ou apaga; nunca edita. Fechar o mesmo mês de novo é recusado.

## RegistroHistorico (histórico de alterações)

```ts
{
  em: string, acao: 'criar' | 'editar' | 'excluir',
  entidade: 'transacao' | 'aporte' | 'config' | 'saldos' | 'snapshot' | 'fechamentoMes',
  docId: string, resumo: string, origem: 'usuario' | 'recorrencia' | 'importacao' | 'restauracao',
  antes: {...} | null, depois: {...} | null
}
```

Gravado no mesmo batch de cada operação (`services/repositorio.ts`): ou entram os dois, ou nenhum. Regras: só cria;
ninguém edita nem apaga, nem o dono. O `lancadoAte` das recorrências é controle interno e não gera registro.

## Dados de exemplo

[`seed/exemplo.json`](../seed/exemplo.json) tem uma config fictícia completa (caixinhas, objetivos, cartões,
orçamentos e recorrentes), saldos e fotos mensais. É usado pelo emulador (`npm run dev:emulador`) e pelos testes; o
app em si não importa arquivos: cada pessoa começa do zero e configura dentro dele.

A validação da config (`validacao.ts`) roda sempre que as Configurações são salvas: confere tipos, moedas, cores,
formatos de data e se objetivos e recorrentes apontam para caixinhas e cartões existentes.
