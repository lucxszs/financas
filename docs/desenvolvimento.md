# Desenvolvimento

## Requisitos

- Node 22+ (`.nvmrc`)
- Java 21+ apenas para os emuladores (`npm run test:rules` e `npm run dev:emulador`)

## Primeiros passos

```bash
npm install
cp .env.example .env.local   # config do app Web do Firebase (Console > Configurações do projeto)
npm run dev                  # http://localhost:5173, usando o Firebase real
```

## Ambiente local com emuladores

Roda Auth e Firestore na sua máquina, com dados fictícios. Nada toca no projeto real.

```bash
npm run dev:emulador
```

- Sobe os emuladores (projeto `demo-financas`), executa `scripts/seed-emulador.mjs` e inicia o Vite com
  `.env.emulador`.
- Na tela de login aparece **🧪 Entrar como usuário de teste** (`dev@financas.local` / `dev12345`).
- Os dados de exemplo incluem lançamentos e aportes no mês atual, para testar o CRUD.
- Os dados somem ao encerrar (Ctrl+C).

## Scripts

| Script                            | O que faz                                                                   |
| --------------------------------- | --------------------------------------------------------------------------- |
| `npm run dev`                     | Vite em modo desenvolvimento (Firebase real)                                |
| `npm run dev:emulador`            | Vite + emuladores + dados de exemplo                                        |
| `npm run check`                   | format + lint + typecheck + testes unitários                                |
| `npm test`                        | testes unitários (Vitest)                                                   |
| `npm run test:rules`              | testes das `firestore.rules` no emulador                                    |
| `npm run lint` / `npm run format` | ESLint / Prettier (`format:check` só verifica)                              |
| `npm run build`                   | build de produção em `dist/`                                                |
| `npm run deploy`                  | build + deploy manual de hosting e regras (precisa de `npx firebase login`) |

## Fluxo de trabalho

A `main` é protegida: toda mudança entra por Pull Request com os checks passando.

```bash
git checkout main && git pull
git checkout -b feat/minha-mudanca
# ... código ...
npm run check
git add -A && git commit -m "feat: descrição"
git push -u origin feat/minha-mudanca
```

No PR, o CI roda qualidade e regras e publica um preview (o link aparece como comentário). Depois do merge, o deploy
de produção é automático.

### Convenções

- Commits no padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/): `feat:`, `fix:`, `docs:`,
  `chore:`, `refactor:`, `test:`.
- Regras de negócio em `src/domain/`, sempre com teste.
- Mudou `firestore.rules`? Adicione caso em `tests/firestore.rules.test.ts`.
- Textos da interface em português.

## Como adicionar...

**Uma categoria ou tipo de transação:** `src/domain/catalogos.ts` e o union type em `src/domain/types.ts`.

**Uma moeda:** `Moeda` em `types.ts`, `LOCALE` em `formatadores.ts`, a lista `MOEDAS` em `useCotacoes.ts` e
`CardCambio.tsx`, e a validação em `validacao.ts`.

**Um campo em transações ou aportes:** tipo em `types.ts`, formulário em `features/modais/`, validação em
`firestore.rules` (funções `transacaoValida`/`aporteValido`) e teste das regras.

## Solução de problemas

| Sintoma                                                    | Causa provável                                                                               |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| "Config do Firebase incompleta"                            | Falta `.env.local` (ou variável vazia)                                                       |
| `firebase-tools no longer supports Java version before 21` | Instale um JDK 21+ ou rode os testes das regras só no CI                                     |
| Login abre e fecha com `auth/unauthorized-domain`          | Domínio fora de Authentication > Configurações > Domínios autorizados                        |
| `Requests from referer ... are blocked`                    | Domínio fora das restrições da API key                                                       |
| "Acesso não liberado"                                      | Falta o documento `acessos/{uid}`                                                            |
| `npm ci` com `ERESOLVE` em PR do Dependabot                | Atualização incompatível entre pacotes; feche o PR (ex.: TypeScript 7 x typescript-eslint 8) |
