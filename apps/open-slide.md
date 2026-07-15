# Open Slide no EntrlacOS

Submodulo git apontando pra [1weiho/open-slide](https://github.com/1weiho/open-slide). Framework/scaffolder de decks React pra agentes — não é serviço deployado, roda local dev-time.

## Quando usar

| Precisa de... | Use |
|---|---|
| Gerar deck de slides via agente, prompt em linguagem natural | **open-slide** (aqui) |
| App de criação de slides hospedado/deployado (Docker+Traefik) | `apps/slide-creator` |

Não são a mesma coisa: open-slide é ferramenta de autoria (scaffold + runtime local), slide-creator é serviço rodando.

## Rodar

```bash
cd apps/open-slide
pnpm install
pnpm dev
```

Ou scaffold novo deck avulso: `npx @open-slide/cli init my-slide`.

## Estrutura

`apps/open-slide` é submódulo git (nunca editar direto — mudanças upstream via PR no repo original).

## Status da integração

Vendored read-only — não faz parte do workspace pnpm/npm raiz do EntrlacOS, sem impacto em build/CI raiz. Skills do agente (`/create-slide`, `/apply-comments`, `/slide-authoring`) ficam isoladas em `apps/open-slide/.claude/skills/`, não sobem pro root automaticamente.

Atualizar submodulo: `git submodule update --remote apps/open-slide`.
