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

## Menu

| Aba              | O que tem                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------- |
| 🏠 Dashboard     | Resumo do mês e quanto ainda dá para gastar                                                   |
| 💳 Gastos        | Lançamentos do mês, cartões, gastos por categoria e média histórica                           |
| 📈 Patrimônio    | Total investido, rendimento estimado, caixinhas e câmbio                                      |
| 🎯 Metas         | Contagem regressiva (com câmbio quando a meta usa moeda estrangeira), metas e alocação mensal |
| 📊 Análises      | Aportes, evolução dos investimentos, fechamentos mensais e score do mês                       |
| ⚙️ Configurações | Renda, caixinhas, cartões, objetivos, orçamento e recorrentes                                 |

Se a cotação não carregar, o app usa a última conhecida e mostra a data e a hora dela.

## Dashboard

**Resumo do mês**

- Renda, gastos, investimentos e saldo livre, com taxa de poupança (investido ÷ renda) e gastos ÷ renda.
- Renda = entradas do mês. Enquanto o salário não entra, usa a renda mensal das Configurações e mostra "(prevista)".
- Avisos: gastos comparados com a média dos 3 meses anteriores, aporte comparado com o planejado, quanto da fatura dos cartões já foi usado e o progresso das metas com data.

**Limite de gastos**

- Disponível = renda − já gasto − investimentos − contas fixas a pagar.
  - Investimentos: o maior entre o planejado (recorrentes de aporte ou, sem elas, o aporte mensal dos objetivos) e o já feito.
  - Contas fixas a pagar: recorrentes que ainda vão cair este mês.
- Mostra quanto dá por dia até o fim do mês e um status:
  - 🟢 Seguro: gastos variáveis dentro do planejado.
  - 🟡 Atenção: gastos variáveis por dia acima do planejado (orçamento por categoria ou, sem ele, o que sobra da renda).
  - 🔴 Cuidado: o mês já está negativo ou, no ritmo atual, termina negativo.

Compras no cartão contam no mês da fatura, em todo o app.

## Lançamentos

- **Criar**: "+ Lançar gasto" no cabeçalho ou "+ Novo" na lista.
- **Crédito e parcelado**: pedem o cartão. O mês da fatura vem automático pelo melhor dia de compra do cartão; dá
  para trocar.
- **Navegar**: ‹ › troca o mês; o topo mostra entradas, saídas e saldo. O app carrega os últimos 12 meses. Compra no cartão aparece no mês da fatura, com o selo "fatura Out/26".
- **Editar**: ✏️ na linha.
- **Excluir**: 🗑 na linha, com confirmação.

## Aportes

Em Análises: criar (🐷 Novo aporte), editar e excluir. O valor é na moeda da caixinha.

## Configurações

- **Geral**: renda mensal e rendimento estimado ao ano.
- **Caixinhas**: conta (dinheiro disponível) ou investimento, moeda, rendimento e cor. A moeda não muda depois de
  criada. Caixinha usada por objetivo ou recorrência não pode ser excluída.
- **Cartões**: limite, melhor dia de compra e vencimento.
- **Objetivos**: meta, caixinhas que contam, aporte mensal e datas. Com data alvo, ganha contagem regressiva.
- **Orçamento**: limite mensal por categoria; vazio = sem limite.
- **Recorrentes**: contas fixas, salário e aportes que o app lança sozinho todo mês, no dia escolhido.
  - Se o dia deste mês já passou, a recorrência começa no mês seguinte, a menos que você marque "lançar também este
    mês".
  - Pausar não apaga; ao reativar, os meses da pausa não são lançados.
  - Lançamento automático excluído à mão não volta.
  - "Criar aportes a partir da alocação mensal" transforma o aporte planejado de cada objetivo em recorrência.

## Atualizar saldos

"✏️ Atualizar saldos" grava o saldo de cada caixinha, o rendimento do mês (opcional) e o score, e atualiza a
evolução do mês. Campo vazio mantém o saldo anterior; `0` zera.
