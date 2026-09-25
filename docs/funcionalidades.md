# Funcionalidades

## Acesso

- Login com Google. Só contas liberadas entram; as outras veem "Acesso não liberado" com o próprio `uid`.
- **Sair** fica no cabeçalho.

## Primeiro acesso

Sem configuração, o app abre **Configurar plano**:

- **Importar JSON**: carrega caixinhas, objetivos, cartões, saldos, histórico e fechamentos. Arquivo com erro não
  grava nada e mostra a lista de problemas.
- **Usar dados de exemplo**: carrega dados fictícios.

Formato do arquivo: [modelo de dados](modelo-de-dados.md#arquivo-de-importação).

## Visão geral

| Bloco               | O que mostra                                                                    |
| ------------------- | ------------------------------------------------------------------------------- |
| Contagem regressiva | Tempo até cada objetivo com data, quanto já foi guardado e quanto falta         |
| Câmbio              | Cotação de USD e EUR e quanto valem as caixinhas em moeda estrangeira           |
| Score do mês        | 🟢 / 🟡 / 🔴 a partir de "pagou as contas", "fechou positivo" e "fez o aporte"  |
| Investimentos       | Total em reais, rendimento mensal estimado e progresso de cada caixinha na meta |
| Cartões de crédito  | Limite, utilizado e disponível na fatura do mês                                 |
| Metas               | Progresso, previsão e quanto falta em cada objetivo                             |
| Alocação mensal     | Aporte planejado por objetivo e o total                                         |

Se a cotação não carregar, o app usa a última conhecida e mostra a data e a hora dela.

## Lançamentos

- **Criar**: "+ Lançar gasto" no cabeçalho ou "+ Novo" na lista. Crédito e parcelado pedem o cartão e o mês da fatura.
- **Navegar**: ‹ › troca o mês; o topo mostra entradas, saídas e saldo.
- **Editar**: ✏️ na linha.
- **Excluir**: 🗑 na linha, com confirmação.

## Histórico

- **Aportes**: criar (🐷 Novo aporte), editar e excluir. O valor é na moeda da caixinha.
- **Evolução dos investimentos**: saldo de cada caixinha e total em reais, mês a mês.
- **Gastos mensais**: fechamentos com itens pagos ✅ e pendentes ❌, sobra ou déficit e notas.

## Gastos

- Gastos do mês por categoria.
- Média histórica de referência.

## Atualizar saldos

"✏️ Atualizar saldos" grava o saldo de cada caixinha, o rendimento do mês (opcional) e o score, e atualiza a
evolução do mês. Campo vazio mantém o saldo anterior; `0` zera.
