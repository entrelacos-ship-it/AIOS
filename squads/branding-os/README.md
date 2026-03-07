# branding-os

Squad que cria design systems para toda a estrutura ad Entrelaços, como sistemas escaláveis, LPs e redes sociais, de forma consistente e memorável.

## Installation

This squad is installed locally in your project:

```
./squads/branding-os/
```

## Usage

Ative os agentes do squad e use os comandos para estruturar a marca, o design system e os desdobramentos de campanha.

### Available Agents

- **brand-system-strategist** - Define a fundacao verbal e visual da marca
- **design-system-architect** - Estrutura tokens, componentes e governanca do design system
- **campaign-creative-director** - Desdobra a marca para LPs, campanhas e social media

### Available Tasks

- **define-brand-system** - Consolida posicionamento, pilares, voz e direcao visual
- **build-design-system-brief** - Traduz a marca em principios, tokens e backlog de componentes
- **create-campaign-asset-system** - Gera um sistema consistente para LPs e criativos de campanha

## Suggested Flow

1. Rode `@brand-system-strategist *brand-system` para definir a base da marca.
2. Rode `@design-system-architect *design-system` para converter a base em sistema operacional visual.
3. Rode `@campaign-creative-director *campaign-system` para desdobrar o sistema em ativos de growth e comunicacao.

## Official Artifacts

- `data/eds-v2.1-operational-foundation.md` - documento-base do sistema visual
- `data/eds-tokens-v2.1.json` - tokens primitivos, semanticos, temas e componentes

## Configuration

This squad extends the core AIOX configuration.

## Development

1. Adicione agentes em `agents/`
2. Adicione tarefas em `tasks/` seguindo task-first architecture
3. Atualize `squad.yaml`
4. Valide com `@squad-creator *validate-squad branding-os`

## License

MIT
