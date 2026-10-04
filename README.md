# 💰 Plano Financeiro

[![Pipeline](https://github.com/lucxszs/financas/actions/workflows/pipeline.yml/badge.svg)](https://github.com/lucxszs/financas/actions/workflows/pipeline.yml)

Dashboard pessoal de finanças: investimentos em BRL, USD e EUR, metas, lançamentos, cartões e histórico mensal.

**Stack:** React 19 · TypeScript · Vite · Firebase (Auth, Firestore, Hosting) · Vitest · GitHub Actions

## Funcionalidades

- 🔐 Conta própria com Google ou e-mail e senha (com confirmação de e-mail); cada pessoa só vê os próprios dados
- 🏠 Início: resumo do mês, saúde financeira, quanto ainda dá para gastar, próximos 7 dias e fechamento mensal
- 💳 Lançamentos, compras parceladas, cartões com faturas futuras e orçamento por categoria
- 🔁 Contas fixas, salário e aportes lançados sozinhos todo mês, com calendário e próximos 7 dias
- 📈 Patrimônio líquido e evolução, rentabilidade, investimentos e câmbio
- 🎯 Metas com contagem regressiva e ritmo necessário × atual
- 📊 Histórico mensal com gráficos, "Posso comprar?" e simulações "e se..."
- 🧾 Histórico de tudo o que foi criado, editado e excluído, com opção de desfazer exclusões
- 📱 Funciona no computador e no celular

Detalhes em [docs/funcionalidades.md](docs/funcionalidades.md).

## Começando

```bash
npm install
cp .env.example .env.local   # preencha com a config do app Web do Firebase
npm run dev
```

Para rodar sem tocar no Firebase real, com dados de exemplo e login de teste:

```bash
npm run dev:emulador          # requer Java 21+
```

## Documentação

| Guia                                       | Conteúdo                                                      |
| ------------------------------------------ | ------------------------------------------------------------- |
| [Funcionalidades](docs/funcionalidades.md) | O que o app faz, tela por tela                                |
| [Arquitetura](docs/arquitetura.md)         | Stack, pastas, fluxo de dados e decisões                      |
| [Modelo de dados](docs/modelo-de-dados.md) | Coleções, campos, validações e formato do JSON de importação  |
| [Segurança](docs/seguranca.md)             | Regras do Firestore, contas, API key e segredos               |
| [Desenvolvimento](docs/desenvolvimento.md) | Setup, emuladores, scripts, convenções e solução de problemas |
| [Deploy e CI/CD](docs/deploy.md)           | Pipeline, configuração do GitHub e Firebase, rollback         |

## Scripts principais

| Script                 | O que faz                                        |
| ---------------------- | ------------------------------------------------ |
| `npm run dev`          | desenvolvimento com o Firebase real              |
| `npm run dev:emulador` | desenvolvimento com emuladores e dados fictícios |
| `npm run check`        | format + lint + typecheck + testes               |
| `npm run test:rules`   | testes das regras do Firestore                   |
| `npm run build`        | build de produção                                |

## Segurança em uma linha

Este repositório é público e **não contém dados financeiros**: tudo fica no Firestore, e cada conta (com e-mail
verificado) só lê e grava os próprios dados. Veja [docs/seguranca.md](docs/seguranca.md).
