---
task: Build Design System Brief
responsavel: "@design-system-architect"
responsavel_type: agent
atomic_layer: task
Entrada: |
  - brand_foundation: Base de marca aprovada ou rascunho
  - surfaces: Onde o sistema sera aplicado (produto, LP, social, email, ads)
  - maturity_level: Estado atual do sistema (inexistente, parcial, consolidado)
  - constraints: Limites tecnicos, operacionais ou de time
Saida: |
  - design_principles: Principios de interface e expressao
  - token_map: Estrutura inicial de cores, tipografia, espacamento e motion
  - component_backlog: Prioridade de componentes e blocos
  - governance_model: Como manter consistencia e evolucao do sistema
Checklist:
  - "[ ] Revisar base de marca e superficies prioritarias"
  - "[ ] Definir principios de design e criterios de consistencia"
  - "[ ] Mapear tokens essenciais"
  - "[ ] Priorizar backlog de componentes e templates"
  - "[ ] Definir governanca e cadencia de manutencao"
---

# *build-design-system-brief

Traduz a base de marca em um briefing operacional de design system.

## Usage

```text
@design-system-architect
*design-system --brand_foundation "./docs/brand.md" --surfaces "lp,social,produto" --maturity_level "parcial"
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `--brand_foundation` | string | Yes | Documento base de marca ou resumo aprovado |
| `--surfaces` | string | Yes | Canais e produtos que receberao o sistema |
| `--maturity_level` | string | Yes | Estagio atual do design system |
| `--constraints` | string | No | Restrições relevantes |

## Expected Output

- Principios de design
- Estrutura inicial de tokens
- Backlog de componentes
- Modelo de governanca
