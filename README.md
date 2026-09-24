# 💰 Plano Financeiro

Dashboard pessoal de finanças: caixinhas de investimento em BRL/USD/EUR, metas com contagem regressiva, lançamentos,
uso de cartões, aportes e histórico mensal.

**Stack:** React 19 + TypeScript + Vite · Firebase (Auth, Firestore, Hosting) · Vitest · GitHub Actions.

## Segurança

Este repositório é público e **não contém dados financeiros**. Todos os dados ficam no Firestore, protegidos por:

1. **Firebase Auth (Google).** Nada é acessível sem login.
2. **Allowlist.** Só contas com documento em `acessos/{uid}` usam o app. O documento é criado manualmente no Console;
   nenhum cliente consegue se autoliberar.
3. **Isolamento.** Cada usuário só lê e escreve em `users/{seu-uid}/**`.
4. **Validação de campos** nas regras (tipos, tamanhos, datas).

As regras estão em [`firestore.rules`](firestore.rules) e são testadas no emulador
([`tests/firestore.rules.test.ts`](tests/firestore.rules.test.ts)) a cada PR.

> A `apiKey` do Firebase Web **não é segredo**: ela identifica o projeto e vai para o navegador de qualquer forma.
> Ela fica em `.env.local` só para manter o código genérico. Recomenda-se restringi-la por domínio no Google Cloud
> Console (APIs e serviços > Credenciais).

## Estrutura

```
src/
  domain/         regras de negócio puras (tipos, cálculos, datas, validação) + testes
  services/       acesso a Firestore e à API de câmbio
  hooks/          hooks reutilizáveis (cotação, envio de formulários)
  features/       telas por funcionalidade (auth, visão, lançamentos, histórico, gastos, modais, onboarding)
  components/     componentes de UI compartilhados
  lib/firebase.ts inicialização do Firebase a partir das variáveis de ambiente
tests/            testes das regras do Firestore (emulador)
seed/exemplo.json formato dos dados iniciais (fictícios)
```

### Modelo de dados

```
acessos/{uid}                      allowlist (criado à mão no Console)
users/{uid}/perfil/config          caixinhas, objetivos, cartões, renda
users/{uid}/perfil/saldos          saldo atual por caixinha + score do mês
users/{uid}/snapshots/{YYYY-MM}    foto mensal dos saldos (com a cotação do dia)
users/{uid}/fechamentos/{YYYY-MM}  fechamento manual do mês
users/{uid}/transacoes/{id}
users/{uid}/aportes/{id}
```

Câmbio: [AwesomeAPI](https://docs.awesomeapi.com.br/api-de-moedas) (`/json/last/USD-BRL,EUR-BRL`). Caixinhas podem ser
em `BRL`, `USD` ou `EUR`.

## Rodando localmente

Requisitos: Node 22+. Para os testes das regras, Java 21+.

```bash
npm install
cp .env.example .env.local   # preencha com a config do app Web do Firebase
npm run dev
```

| Script               | O que faz                                    |
| -------------------- | -------------------------------------------- |
| `npm run dev`        | servidor de desenvolvimento                  |
| `npm run check`      | format + lint + typecheck + testes unitários |
| `npm run test:rules` | testes das `firestore.rules` no emulador     |
| `npm run build`      | build de produção em `dist/`                 |
| `npm run deploy`     | build + deploy manual de hosting e regras    |

## Primeiro acesso

1. No Console do Firebase, ative **Authentication > Google**.
2. Entre no app com sua conta Google. A tela mostrará seu `uid`.
3. No **Firestore**, crie o documento `acessos/{seu-uid}` (pode ser vazio) e recarregue.
4. Importe um JSON no formato de [`seed/exemplo.json`](seed/exemplo.json). Arquivos `seed/*.json` (exceto o exemplo) são
   ignorados pelo git: é ali que ficam seus dados reais.

## CI/CD

[`.github/workflows/pipeline.yml`](.github/workflows/pipeline.yml):

| Evento         | Jobs                                                                         |
| -------------- | ---------------------------------------------------------------------------- |
| Pull request   | qualidade (format, lint, tipos, testes, build) · regras (emulador) · preview |
| Push na `main` | qualidade · regras · deploy em produção (hosting + `firestore.rules`)        |

O deploy de preview publica um canal temporário (7 dias) e comenta a URL no PR. O login com Google só funciona em
domínios autorizados; para testar login no preview, adicione o domínio do canal em Authentication > Settings.

Configuração no GitHub (Settings > Secrets and variables > Actions):

- **Variables:** `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
  `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`
- **Secret:** `FIREBASE_SERVICE_ACCOUNT`: JSON de uma service account com os papéis _Firebase Hosting Admin_,
  _Firebase Rules Admin_ e _API Keys Viewer_.
- **Environment:** `production` (opcional: exigir aprovação antes do deploy).

Dependabot abre PRs semanais para npm e mensais para as actions.
