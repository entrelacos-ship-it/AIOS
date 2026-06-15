# API Provider Control Center

## Objetivo

Criar uma tela única para configurar, habilitar, desabilitar e priorizar provedores de IA por capacidade, sem exigir edição manual do `.env` para o uso cotidiano.

O foco imediato é:

1. Provedores textuais
2. Provedores de imagem
3. Provedores de vídeo
4. Health/status de cada integração
5. Roteamento por capacidade e fallback

## Problema Atual

- O app mistura configuração de provedores com a lógica dos fluxos.
- O usuário não tem uma tela operacional para ligar/desligar integrações.
- A UI só sabe se um provider existe por checagem pontual.
- A chave fica fora do fluxo do produto e obriga manutenção manual.
- O sistema ainda não tem política unificada de fallback por capacidade.

## Resultado Esperado

Uma tela `AI Control Center` no sidebar, onde o usuário consegue:

1. Cadastrar credenciais por provider
2. Ativar/desativar providers
3. Definir provider padrão por capacidade
4. Definir ordem de fallback
5. Testar conexão
6. Ver status operacional
7. Saber quais módulos usam qual provider

## Escopo Funcional

### Capacidades

- `text_generation`
- `structured_text`
- `image_generation`
- `image_editing`
- `video_generation`
- `search_grounded_text`

### Providers iniciais

- Groq
- Gemini
- OpenAI
- Anthropic
- OpenRouter

### Regras de negócio

1. Um provider pode estar cadastrado e desabilitado.
2. Um provider pode ser habilitado só para capacidades específicas.
3. Cada capacidade precisa ter um provider primário.
4. Cada capacidade pode ter uma cadeia de fallback.
5. Se o provider primário falhar, o backend tenta o próximo provider habilitado.
6. A UI nunca acessa a credencial crua depois do cadastro.
7. Chaves são persistidas no backend e retornam mascaradas.

## Arquitetura Recomendada

### Abordagem

Adotar um `Provider Registry` no backend com configuração persistida em arquivo local protegido na primeira fase.

Fase 1:

- Persistência em `./.aiox/provider-config.json`
- Credenciais criptografadas localmente
- Gestão via tela interna

Fase 2:

- Migração para armazenamento mais robusto
- Possível separação por workspace/tenant

### Componentes

#### Frontend

- Nova view `AI_CONTROL_CENTER`
- Cards por provider
- Tabela de capacidades
- Drawer/modal para credenciais
- Painel de health check
- Matriz de roteamento por capacidade

#### Backend

- `ProviderConfigService`
- `ProviderSecretsService`
- `ProviderHealthService`
- `ProviderRoutingService`
- `ProviderRegistry`

#### Integrações

- `GroqAdapter`
- `GeminiAdapter`
- `OpenAIAdapter`
- `AnthropicAdapter`
- `OpenRouterAdapter`

## Modelo de Dados

### ProviderConfig

```ts
type ProviderId = 'groq' | 'gemini' | 'openai' | 'anthropic' | 'openrouter';

type AICapability =
  | 'text_generation'
  | 'structured_text'
  | 'image_generation'
  | 'image_editing'
  | 'video_generation'
  | 'search_grounded_text';

interface ProviderConfig {
  id: ProviderId;
  label: string;
  enabled: boolean;
  baseUrl?: string;
  modelDefaults: Partial<Record<AICapability, string>>;
  capabilities: Record<AICapability, boolean>;
  credentialStatus: 'missing' | 'configured' | 'invalid';
  updatedAt: string;
}
```

### RoutingPolicy

```ts
interface RoutingPolicy {
  capability: AICapability;
  primaryProvider: ProviderId | null;
  fallbackOrder: ProviderId[];
}
```

### ProviderSecretRef

```ts
interface ProviderSecretRef {
  providerId: ProviderId;
  maskedKey: string;
  hasKey: boolean;
  updatedAt: string;
}
```

## Endpoints

### Providers

- `GET /api/ai/providers`
- `PUT /api/ai/providers/:providerId`
- `POST /api/ai/providers/:providerId/credentials`
- `DELETE /api/ai/providers/:providerId/credentials`
- `POST /api/ai/providers/:providerId/test`

### Routing

- `GET /api/ai/routing`
- `PUT /api/ai/routing/:capability`

### Health

- `GET /api/ai/health`

## Fluxo de UX

### Tela principal

Blocos:

1. Resumo global
2. Lista de providers
3. Matriz de capacidades
4. Política de fallback
5. Health checks

### Provider card

Cada card deve mostrar:

- nome
- status
- capacidades suportadas
- modelo padrão
- botão de habilitar/desabilitar
- botão de configurar credencial
- botão de testar conexão

### Matriz de capacidades

Tabela:

- linhas = capacidades
- colunas = provider primário, fallback, status

## Fluxo Técnico

1. A UI lê `/api/ai/providers` e `/api/ai/routing`
2. O usuário edita a configuração
3. O backend valida o payload
4. As credenciais são criptografadas antes de persistir
5. O `ProviderRoutingService` resolve o provider por capacidade
6. Os módulos usam somente o roteador, nunca o provider diretamente

## Mudanças no Código Atual

### Navegação

Adicionar:

- `View.AI_CONTROL_CENTER`

Sidebar:

- novo item em `Core System` ou `Brand[OS]/Infra`

### Backend

Hoje já existe:

- `GET /api/ai/providers/status`
- `POST /api/ai/groq/chat`

Evoluir para:

- registry central
- leitura/escrita de config
- adapters por provider
- health checks desacoplados

### Frontend

Hoje `BrandingOS` consome status simples do provider textual.

Evoluir para:

- hook `useAIProviders()`
- hook `useAIRouting()`
- componentes reutilizáveis de provider

## Estratégia de Implementação

### Fase 1

1. Criar tela `AI Control Center`
2. Criar endpoints de leitura/escrita de config
3. Persistir config local em arquivo
4. Suportar Groq e Gemini primeiro
5. Conectar `BrandingOS` ao roteador central

### Fase 2

1. Adicionar OpenAI/Anthropic/OpenRouter
2. Adicionar fallback automático
3. Adicionar health checks assíncronos
4. Adicionar telemetria simples de falhas por provider

### Fase 3

1. Segregar configuração por módulo
2. Permitir override por fluxo
3. Adicionar política de custo/performance

## Decisões Arquiteturais

### 1. Configuração no backend, não no frontend

Motivo:

- evita expor chaves
- centraliza validação
- permite fallback real

### 2. Roteamento por capacidade

Motivo:

- Groq serve muito bem para texto
- Gemini continua útil para imagem/vídeo
- o sistema precisa decidir por competência, não por provider único

### 3. Persistência local na primeira fase

Motivo:

- menor custo de implementação
- suficiente para ambiente local/single workspace
- simples de migrar depois

## Riscos

1. Criptografia local mal implementada pode criar falsa sensação de segurança.
2. Misturar status de credencial com status de health pode confundir a UI.
3. Fallback automático sem observabilidade dificulta debugging.
4. Providers OpenAI-compatible têm diferenças sutis em schema/JSON mode.

## Recomendação Final

Implementar primeiro um `AI Control Center` com dois providers oficiais:

- Groq para `text_generation` e `structured_text`
- Gemini para `image_generation`, `image_editing` e `video_generation`

Esse recorte entrega valor imediato, reduz complexidade e organiza o resto da expansão.
