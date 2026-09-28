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

| Aba              | O que tem                                                                                                             |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| 🏠 Dashboard     | Fechamento do mês (quando há um para fechar), resumo, saúde financeira, próximos 7 dias e quanto ainda dá para gastar |
| 💳 Gastos        | Lançamentos, calendário do mês, cartões, gastos por categoria × orçamento e média histórica                           |
| 📈 Patrimônio    | Patrimônio líquido e evolução, investimentos, rentabilidade × CDI e IPCA, e câmbio                                    |
| 🎯 Metas         | Contagem regressiva com ritmo (necessário × atual), câmbio quando a meta usa moeda estrangeira, metas e alocação      |
| 📊 Análises      | Histórico mensal com gráficos, meses fechados, simulações, aportes, evolução dos investimentos e fechamentos manuais  |
| ⚙️ Configurações | Renda, caixinhas, cartões, objetivos, orçamento e recorrentes                                                         |

Se a cotação não carregar, o app usa a última conhecida e mostra a data e a hora dela.

## Dashboard

**Resumo do mês**

- Renda, gastos, investimentos e saldo livre, com taxa de poupança (investido ÷ renda) e gastos ÷ renda.
- Renda = entradas do mês. Enquanto o salário não entra, usa a renda mensal das Configurações e mostra "(prevista)".
- Avisos: gastos comparados com a média dos 3 meses anteriores, aporte comparado com o planejado, quanto da fatura dos cartões já foi usado e o progresso das metas com data.

**Saúde financeira**: cinco sinais, cada um com o motivo, em vez de uma nota única.

| Sinal            | 🟢                          | 🟡                                   | 🔴                             |
| ---------------- | --------------------------- | ------------------------------------ | ------------------------------ |
| 💰 Gastos        | limite de gastos seguro     | gastando acima do planejado          | mês termina negativo           |
| 📈 Investimentos | aporte do mês ≥ planejado   | aportou parte, ou ainda até o dia 15 | nada aportado depois do dia 15 |
| 💳 Cartões       | até 50% do limite em aberto | até 80%                              | acima de 80%                   |
| 🎯 Metas         | todas no ritmo              | a pior até 10% abaixo do necessário  | a pior mais de 10% abaixo      |
| 💵 Reserva       | cobre 6+ meses de gastos    | 3 a 6 meses                          | menos de 3                     |

A reserva é o objetivo marcado como "reserva de emergência" em Configurações (sem marcação, o que tiver
"emergência" ou "reserva" no nome). Sinais sem dados (ex.: nenhum cartão) não aparecem.

**Limite de gastos**

- Disponível = renda − já gasto − investimentos − contas fixas a pagar.
  - Investimentos: o maior entre o planejado (recorrentes de aporte ou, sem elas, o aporte mensal dos objetivos) e o já feito.
  - Contas fixas a pagar: recorrentes que ainda vão cair este mês.
- Mostra quanto dá por dia até o fim do mês e um status:
  - 🟢 Seguro: gastos variáveis dentro do planejado.
  - 🟡 Atenção: gastos variáveis por dia acima do planejado (orçamento por categoria ou, sem ele, o que sobra da renda).
  - 🔴 Cuidado: o mês já está negativo ou, no ritmo atual, termina negativo.

Compras no cartão contam no mês da fatura, em todo o app.

## Cartões

Em Gastos, um card por cartão:

- Melhor dia de compra (e em quantos dias ele chega) e vencimento.
- Fatura atual, próxima fatura e parcelamentos futuros. Depois do dia do vencimento, a fatura do mês conta como paga
  e a "atual" passa a ser a do mês seguinte.
- Limite disponível = limite − tudo em aberto, como o banco faz com compras parceladas.

**Comprometimento futuro**: soma das faturas de todos os cartões nos próximos 6 meses, com as parcelas já lançadas.

Compras parceladas lançadas antes desta versão continuam como um lançamento único e não entram nas parcelas futuras.

## Fechamento mensal

- O Dashboard mostra "🔒 Fechamento de <mês>" quando há um mês para fechar: o anterior, se teve movimento e não foi
  fechado, ou o atual, no último dia dele.
- A prévia traz renda, gastos, investimentos, saldo, taxa de poupança, maior categoria, maior gasto, aporte em cada
  meta e patrimônio com a variação sobre o mês anterior.
- **Fechar** grava uma foto imutável do mês. O histórico mensal passa a usar essa foto (🔒 na tabela), mesmo que os
  lançamentos mudem depois.
- Em Análises > Meses fechados: ver cada fechamento e **Reabrir mês** (apaga a foto; os lançamentos não mudam).
- Mês passado fechado depois: o patrimônio vem da foto do "Atualizar saldos" daquele mês, se existir.

## Metas por ritmo

Na contagem regressiva de cada meta com data:

- **Necessário**: quanto falta ÷ meses até a data alvo.
- **Atual**: média dos aportes nas caixinhas da meta nos 3 meses anteriores; sem aportes, o aporte mensal planejado.
- Aviso: "⚠️ faltam R$ 25/mês para chegar na data" ou "✅ no ritmo".
- Previsão de conclusão no ritmo atual, também exibida na lista de metas.

## Calendário financeiro

- **Próximos 7 dias** (Dashboard): recorrências que ainda vão cair e vencimentos de fatura, com o saldo previsto
  (entradas − contas, aportes e faturas).
- **Calendário do mês** (Gastos): tudo o que entra e sai no mês, por dia; ✓ = recorrência já lançada, fatura já
  vencida aparece apagada.
- Recorrências no cartão não aparecem sozinhas: já estão dentro da fatura.

## Rentabilidade

Em Patrimônio:

- Por caixinha de investimento: saldo, participação no total, rentabilidade e quanto rendeu.
- Investido = saldo na primeira foto do "Atualizar saldos" + aportes lançados depois. Saques não são registrados e
  reduzem o rendimento.
- Total com a rentabilidade desde a primeira foto, comparada com o CDI e o IPCA do período (séries mensais do Banco
  Central, compostas mês a mês). A comparação é aproximada: os aportes entram ao longo do período.
- CDI e IPCA ficam guardados no navegador por 24h; se o Banco Central cair, usa os últimos guardados.

## Simulações

Em Análises, "🧮 Simulações: e se...":

- **Ganhar mais**: nova renda mensal. **Gastar menos**: quanto a menos por mês. **Aportar mais**: novo aporte mensal.
- Mostra o extra por mês, quanto ele vira em 1 e 3 anos (guardado e investindo, com o rendimento estimado das
  Configurações) e quantos meses adianta a meta escolhida.

## Gastos por categoria

Gasto real do mês em cada categoria. Com orçamento definido em Configurações, mostra real ÷ meta e o status:
🟢 dentro (até 100%), 🟡 no limite (até 110%), 🔴 estourou.

## Patrimônio líquido

- Ativos (investimentos + contas) − dívidas = patrimônio líquido.
- Dívidas: faturas do cartão ainda não vencidas, incluindo as futuras. Depois do dia do vencimento, a fatura do mês
  deixa de contar.
- Evolução dos últimos 6 meses: meses anteriores pela foto do "Atualizar saldos" (que passa a gravar as dívidas do
  dia); mês atual pelo valor de agora.

## Histórico mensal

Em Análises: renda, gastos, investimentos, saldo, taxa de poupança e patrimônio dos últimos 6 meses, em tabela e em
gráficos (gastos, investimentos e taxa de poupança por mês). Passe o mouse ou toque numa coluna para ver o valor.

## Lançamentos

- **Criar**: "+ Lançar gasto" no cabeçalho ou "+ Novo" na lista.
- **Crédito**: pede o cartão. O mês da fatura vem automático pelo melhor dia de compra do cartão; dá para trocar.
- **Parcelado**: valor total + número de parcelas (2 a 48). O app cria uma parcela por mês de fatura, a partir da
  fatura escolhida, e mostra a prévia ("10x de R$ 150,00 · Out/26 a Jul/27"). Centavos que sobram da divisão vão
  na 1ª parcela. Sem número de parcelas, vira compra à vista.
- **Navegar**: ‹ › troca o mês; o topo mostra entradas, saídas e saldo. O app carrega os últimos 12 meses. Compra no cartão aparece no mês da fatura, com o selo "fatura Out/26".
- **Editar**: ✏️ na linha. Numa parcela, valor, data e fatura mudam só nela; descrição, categoria e cartão podem ir
  para todas as parcelas.
- **Excluir**: 🗑 na linha, com confirmação. Numa parcela: "Só esta parcela" ou "Todas as parcelas".

## Aportes

Em Análises: criar (🐷 Novo aporte), editar e excluir. O valor é na moeda da caixinha.

## Configurações

- **Geral**: renda mensal e rendimento estimado ao ano.
- **Caixinhas**: conta (dinheiro disponível) ou investimento, moeda, rendimento e cor. A moeda não muda depois de
  criada. Caixinha usada por objetivo ou recorrência não pode ser excluída.
- **Cartões**: limite, melhor dia de compra e vencimento.
- **Objetivos**: meta, caixinhas que contam, aporte mensal e datas. Com data alvo, ganha contagem regressiva. Um deles
  pode ser marcado como reserva de emergência.
- **Orçamento**: limite mensal por categoria; vazio = sem limite.
- **Recorrentes**: contas fixas, salário e aportes que o app lança sozinho todo mês, no dia escolhido.
  - Se o dia deste mês já passou, a recorrência começa no mês seguinte, a menos que você marque "lançar também este
    mês".
  - Pausar não apaga; ao reativar, os meses da pausa não são lançados.
  - Lançamento automático excluído à mão não volta.
  - "Criar aportes a partir da alocação mensal" transforma o aporte planejado de cada objetivo em recorrência.

## Atualizar saldos

"✏️ Atualizar saldos" grava o saldo de cada caixinha e o rendimento do mês (opcional), e atualiza a evolução do mês.
