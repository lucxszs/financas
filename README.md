# 💰 Plano Financeiro

[![Pipeline](https://github.com/lucxszs/financas/actions/workflows/pipeline.yml/badge.svg)](https://github.com/lucxszs/financas/actions/workflows/pipeline.yml)

Dashboard pessoal de finanças: investimentos em BRL, USD e EUR, metas, lançamentos, cartões e histórico mensal.

**Stack:** React 19 · TypeScript · Vite · Firebase (Auth, Firestore, Hosting) · Vitest · GitHub Actions

## Funcionalidades

- 🔐 Login com Google, só para contas liberadas
- 📊 Visão geral: investimentos, cartões, metas e score do mês
- 🎯 Contagem regressiva para objetivos com data
- 💱 Cotação de USD e EUR e quanto valem as caixinhas em moeda estrangeira
- 📝 Lançamentos e aportes: criar, editar e excluir
- 📈 Evolução mensal dos saldos
- 🧾 Fechamentos mensais com pendências e notas
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
| [Segurança](docs/seguranca.md)             | Regras do Firestore, allowlist, API key e segredos            |
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

Este repositório é público e **não contém dados financeiros**: tudo fica no Firestore, acessível só por contas
liberadas, cada uma restrita aos próprios dados. Veja [docs/seguranca.md](docs/seguranca.md).
