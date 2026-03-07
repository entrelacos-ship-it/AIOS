---
task: Create Campaign Asset System
responsavel: "@campaign-creative-director"
responsavel_type: agent
atomic_layer: task
Entrada: |
  - campaign_goal: Objetivo da campanha ou canal
  - offer: Oferta, mensagem ou CTA principal
  - channels: Canais de distribuicao (LP, Meta Ads, Instagram, email, etc.)
  - brand_rules: Regras de marca e sistema visual aplicaveis
Saida: |
  - asset_system: Estrutura de pecas e variacoes
  - creative_direction: Direcao criativa por canal
  - messaging_matrix: Matriz de mensagens e CTAs
  - production_checklist: Checklist para execucao consistente
Checklist:
  - "[ ] Entender objetivo, oferta e canais"
  - "[ ] Definir narrativa central e angulos de campanha"
  - "[ ] Desdobrar modulos visuais e textuais por canal"
  - "[ ] Padronizar CTAs, hierarquia e repeticao de marca"
  - "[ ] Entregar checklist de producao e consistencia"
---

# *create-campaign-asset-system

Cria um sistema replicavel para LPs, ads e social media sem perder coerencia de marca.

## Usage

```text
@campaign-creative-director
*campaign-system --campaign_goal "captar leads" --offer "diagnostico gratuito" --channels "lp,instagram,meta-ads"
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `--campaign_goal` | string | Yes | Resultado esperado da campanha |
| `--offer` | string | Yes | Oferta ou CTA principal |
| `--channels` | string | Yes | Canais que receberao os ativos |
| `--brand_rules` | string | No | Documento ou resumo das regras de marca |

## Expected Output

- Sistema de pecas por canal
- Matriz de mensagens
- Regras de consistencia
- Checklist de producao
