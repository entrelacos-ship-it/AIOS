---
task: Define Brand System
responsavel: "@brand-system-strategist"
responsavel_type: agent
atomic_layer: task
Entrada: |
  - brand_scope: Marca, produto ou unidade do ecossistema Entrelaços
  - business_goal: Objetivo principal da marca ou iniciativa
  - audience: Publico prioritario e contexto de uso
  - current_assets: Links, referencias ou materiais existentes
Saida: |
  - positioning: Posicionamento resumido
  - messaging_pillars: Pilares de mensagem
  - voice_guidelines: Diretrizes de voz e tom
  - visual_direction: Direcao visual inicial
  - consistency_rules: Regras para manter coerencia entre canais
Checklist:
  - "[ ] Mapear objetivo de negocio e escopo da marca"
  - "[ ] Identificar publico, promessa e diferenciacao"
  - "[ ] Definir pilares de mensagem e tom de voz"
  - "[ ] Definir direcao visual e referencias"
  - "[ ] Consolidar regras-base para uso recorrente"
---

# *define-brand-system

Define a fundacao verbal e visual da marca para servir como base do squad.

## Usage

```text
@brand-system-strategist
*brand-system --brand_scope "Entrelaços Ads" --business_goal "padronizar identidade" --audience "times internos e clientes"
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `--brand_scope` | string | Yes | Marca ou frente que sera estruturada |
| `--business_goal` | string | Yes | Resultado esperado para a marca |
| `--audience` | string | Yes | Publico principal |
| `--current_assets` | string | No | Links, docs ou referencias existentes |

## Expected Output

- Posicionamento central da marca
- Pilares narrativos
- Tom de voz
- Direcao visual inicial
- Regras de consistencia para squads e campanhas
