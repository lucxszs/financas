# Modelo de dados

Tipos completos em [`src/domain/types.ts`](../src/domain/types.ts).

## Coleções

```
acessos/{uid}                      allowlist; criado manualmente no Console (ex.: { ativo: true })
users/{uid}/perfil/config          Config
users/{uid}/perfil/saldos          Saldos
users/{uid}/snapshots/{YYYY-MM}    Snapshot
users/{uid}/fechamentos/{YYYY-MM}  Fechamento
users/{uid}/transacoes/{id}        Transacao
users/{uid}/aportes/{id}           Aporte
```

## Config

| Campo               | Tipo                       | Descrição                                                                 |
| ------------------- | -------------------------- | ------------------------------------------------------------------------- |
| `nome`              | string                     | Nome do plano (não é exibido na tela)                                     |
| `rendaMensal`       | number                     | Renda de referência                                                       |
| `taxaAnualEstimada` | number                     | Ex.: `0.147`; usada para estimar o rendimento mensal das caixinhas em BRL |
| `caixinhas`         | Caixinha[]                 | Onde o dinheiro está                                                      |
| `objetivos`         | Objetivo[]                 | Metas que somam uma ou mais caixinhas                                     |
| `cartoes`           | Cartao[]                   | Cartões de crédito e limites                                              |
| `alocacaoDesde`     | `YYYY-MM`?                 | Rótulo "a partir de" da alocação mensal                                   |
| `mediasGastos`      | `{ periodo, itens[] }`?    | Média histórica exibida em Gastos                                         |
| `orcamentos`        | `{ [categoria]: number }`? | Orçamento mensal por categoria, em BRL                                    |
| `recorrentes`       | Recorrente[]?              | Lançamentos e aportes criados automaticamente todo mês                    |

**Caixinha:** `id`, `nome`, `emoji?`, `moeda` (`BRL` \| `USD` \| `EUR`), `rendimento` (texto, ex.: "115% CDI"),
`descricao?`, `cor` (`emerald` \| `amber` \| `violet` \| `coral` \| `sky`), `tipo?` (`investimento` \| `conta`;
ausente = investimento).

**Objetivo:** `id`, `nome`, `emoji?`, `descricao?`, `meta` (BRL), `caixinhas` (ids), `cor`, `aporteMensal?`,
`previsao?` (texto), `dataInicio?` e `dataAlvo?` (`YYYY-MM-DD`; com `dataAlvo` o objetivo entra na contagem regressiva).

**Cartao:** `id`, `nome`, `emoji?`, `limite`, `cor`, `melhorDiaCompra?` e `diaVencimento?` (dias de 1 a 31).
Compra antes do melhor dia cai na fatura que vence no mês; a partir dele, na do mês seguinte.

**Recorrente:** `id`, `desc`, `val`, `dia` (1 a 31; em mês curto vale o último dia), `ativo`, `inicio` (`YYYY-MM`),
`lancadoAte?` (`YYYY-MM`, último mês já lançado) e `tipo`:

- `transacao`: `tipoTransacao`, `cat`, `cartao` (id ou `null`). Gera uma Transacao.
- `aporte`: `caixinha` (id). Gera um Aporte, com `val` na moeda da caixinha.

O app lança sozinho, ao abrir, cada mês em aberto até hoje (no máximo 12 para trás), com id `rec_{id}_{YYYY-MM}`, e
atualiza `lancadoAte` no mesmo batch. Mês lançado não volta, mesmo que o lançamento seja excluído. Na importação, o
`inicio` de recorrentes nunca lançadas vira no mínimo o mês atual.

## Saldos

```ts
{ valores: { [caixinhaId]: number }, score?: { pagou?, positivo?, aporte? }, updatedAt: string | null }
```

Valores na moeda da própria caixinha. Respostas do score: `sim` \| `parcial` \| `nao`.

## Snapshot (evolução mensal)

```ts
{ mes: 'YYYY-MM', valores: {...}, rendimentos?: {...}, cotacoes?: { USD?: number, EUR?: number } }
```

Criado ou sobrescrito a cada "Atualizar saldos" no mês. A cotação gravada é usada para calcular o total daquele mês.

## Transacao

| Campo          | Tipo              | Regras (firestore.rules)                  |
| -------------- | ----------------- | ----------------------------------------- |
| `desc`         | string            | obrigatório, 1 a 120 caracteres           |
| `val`          | number            | > 0 e < 10.000.000                        |
| `tipo`         | string            | um dos tipos de `catalogos.ts`            |
| `cat`          | string            | uma das categorias de `catalogos.ts`      |
| `data`         | `YYYY-MM-DD`      | obrigatório                               |
| `cartao`       | string \| null    | só para crédito/parcelado                 |
| `mesFatura`    | `YYYY-MM` \| null | mês do vencimento; vazio = mês de `data`  |
| `obs`          | string            | até 200 caracteres                        |
| `isEntrada`    | boolean           | derivado do tipo (recebi, salário)        |
| `criadoEm`     | ISO string        | obrigatório; **não pode mudar na edição** |
| `atualizadoEm` | ISO string?       | preenchido ao editar                      |
| `recorrenteId` | string?           | id da recorrência que criou; até 60 chars |

## Aporte

`caixinha` (id), `val` (> 0, na moeda da caixinha), `data` (`YYYY-MM-DD`), `obs` (até 200), `criadoEm` (imutável),
`atualizadoEm?`, `recorrenteId?`.

## Fechamento

```ts
{ mes: 'YYYY-MM', itens: [{ nome, emoji?, valor, tipo: 'entrada' | 'saida', pago?: boolean }], notas?: string[] }
```

Totais, sobra/déficit e pendências são calculados (`totaisFechamento` em `calculos.ts`), não gravados.

## Arquivo de importação

Usado no primeiro acesso. Exemplo completo em [`seed/exemplo.json`](../seed/exemplo.json).

```json
{
  "config": {
    "nome": "...",
    "rendaMensal": 0,
    "taxaAnualEstimada": 0.14,
    "caixinhas": [],
    "objetivos": [],
    "cartoes": []
  },
  "saldos": { "valores": { "reserva": 1000 } },
  "snapshots": [{ "mes": "2026-08", "valores": { "reserva": 900 } }],
  "fechamentos": [{ "mes": "2026-08", "itens": [] }]
}
```

Apenas `config` é obrigatório. A validação (`validacao.ts`) confere tipos, moedas, cores, formatos de data e se os
objetivos apontam para caixinhas existentes.

> Guarde seus dados reais em `seed/*.json` (exceto `exemplo.json`): o `.gitignore` impede que sejam versionados.
