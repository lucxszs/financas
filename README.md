# 💰 Plano Financeiro

[![Pipeline](https://github.com/lucxszs/financas/actions/workflows/pipeline.yml/badge.svg)](https://github.com/lucxszs/financas/actions/workflows/pipeline.yml)

Controle financeiro pessoal que responde quatro perguntas: **quanto eu tenho**, **quanto ainda posso gastar este
mês**, **se estou gastando e investindo no ritmo certo** e **quando chego nas minhas metas**.

**[Acessar o app](https://financas-fdcca.web.app)** · [Documentação](docs/funcionalidades.md)

## Funcionalidades

- 🏠 **Limite de gastos do mês**: quanto ainda dá para gastar por dia, já descontando as contas fixas que vão cair e
  os aportes planejados, com um status (seguro, atenção ou cuidado) e cinco sinais de saúde financeira.
- 💳 **Cartões de crédito**: mês da fatura pelo melhor dia de compra, compras parceladas, faturas futuras e limite
  disponível conferido com o banco.
- 🔁 **Recorrências**: contas fixas, salário e aportes lançados automaticamente, inclusive os de valor variável
  (como financiamento), com calendário dos próximos dias.
- 📈 **Patrimônio**: patrimônio líquido e evolução mensal, rentabilidade por investimento e câmbio USD/EUR.
- 🎯 **Metas**: contagem regressiva, ritmo necessário × atual e previsão de conclusão.
- 📊 **Análises**: histórico mensal com gráficos, orçamento por categoria, "Posso comprar?" e simulações "e se...".
- 🔒 **Fechamento mensal e histórico**: foto imutável de cada mês e registro de toda criação, edição e exclusão, com
  opção de desfazer.

## Como é feito

| Camada    | Tecnologia                                                                        |
| --------- | --------------------------------------------------------------------------------- |
| Interface | React 19, TypeScript (strict), Vite, CSS próprio responsivo, ícones SVG (lucide)  |
| Dados     | Firebase Auth (Google e e-mail/senha) e Cloud Firestore                           |
| Testes    | Vitest: regras de negócio e regras de segurança do Firestore (no emulador)        |
| Entrega   | GitHub Actions: lint, tipos, testes, preview por pull request e deploy automático |

- **Sem backend.** O controle de acesso está nas regras do Firestore, cobertas por testes que rodam no emulador a
  cada pull request.
- **Regras de negócio isoladas.** Todo cálculo (limite de gastos, faturas, parcelas, recorrências, metas,
  rentabilidade) fica em [`src/domain`](src/domain), em funções puras, sem React nem Firebase, com testes ao lado.
- **Dados que não se perdem.** Operações relacionadas vão num único batch, junto com o registro no histórico: ou
  tudo é gravado, ou nada.

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # config do app Web do Firebase
npm run dev
```

Com emuladores (dados fictícios e login de teste, sem tocar no Firebase real; requer Java 21+):

```bash
npm run dev:emulador
```

| Script               | O que faz                                 |
| -------------------- | ----------------------------------------- |
| `npm run check`      | format, lint, tipos e testes              |
| `npm run test:rules` | testes das regras do Firestore (emulador) |
| `npm run build`      | build de produção                         |

## Documentação

| Guia                                       | Conteúdo                                              |
| ------------------------------------------ | ----------------------------------------------------- |
| [Funcionalidades](docs/funcionalidades.md) | O que cada tela faz e como os números são calculados  |
| [Arquitetura](docs/arquitetura.md)         | Pastas, fluxo de dados e decisões técnicas            |
| [Modelo de dados](docs/modelo-de-dados.md) | Coleções, campos e validações                         |
| [Segurança](docs/seguranca.md)             | Regras do Firestore, contas, API key e segredos       |
| [Desenvolvimento](docs/desenvolvimento.md) | Setup, emuladores, convenções e solução de problemas  |
| [Deploy e CI/CD](docs/deploy.md)           | Pipeline, configuração do GitHub e Firebase, rollback |
