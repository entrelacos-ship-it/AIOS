---
name: carrossel-design-cinema
description: Cria carrosseis premium para Instagram da Entrelacos Psicologia em modo rapido, com previa criativa antes de imagens e historico centralizado em LPs_Entrelacos.
---

# Carrossel Design Cinema

## Objetivo operacional

Crie carrosseis cinematograficos da Entrelacos Psicologia com maxima velocidade percebida e memoria recuperavel.

O fluxo padrao e:

1. Entregar primeiro uma previa criativa sem gerar imagens.
2. Salvar o briefing, prompts e manifest no historico oficial.
3. Gerar imagens apenas depois de aprovacao explicita.
4. Gerar imagens em lotes pequenos, nunca o carrossel inteiro de uma vez sem necessidade.
5. Sempre informar onde ver o historico: `http://127.0.0.1:4321/carrosseis/` quando o dev server de `D:\AI_Workspace\Projects\LPs_Entrelacos` estiver rodando.

## Raiz oficial do acervo

Use `D:\AI_Workspace\Projects\LPs_Entrelacos` como fonte de verdade para carrosseis da Entrelacos.

Todo post deve ser salvo em:

`public/carrosseis/history/YYYY-MM-DD-slug/`

A pasta deve conter, quando aplicavel:

- `brief.md`
- `prompts.md`
- `manifest.json`
- `slides/slide-01.png`, `slides/slide-02.png`, etc.

Depois de criar, importar ou alterar historico, rode no repo `LPs_Entrelacos`:

```bash
npm run carousel:history
```

Para ver o acervo local:

```bash
npm run dev -- --host 127.0.0.1 --port 4321
```

URL:

`http://127.0.0.1:4321/carrosseis/`

## Modo rapido obrigatorio

Nunca gere imagens automaticamente na primeira resposta, a menos que Tati peca explicitamente "gere as imagens agora".

Na primeira resposta, entregue apenas:

- conceito;
- mapa narrativo;
- texto exato dos slides;
- composicao visual resumida;
- prompts finais prontos;
- checklist de aprovacao;
- caminho do historico que sera usado.

Padrao: 8 slides.

Use 9 ou 10 apenas se a narrativa realmente precisar de CTA extra, manifesto final ou sintese salvavel separada.

## Geracao visual aprovada

Quando Tati aprovar a direcao criativa, gere imagens assim:

- lote 1: slide 1, slide 2 e slide final;
- lote 2: slides intermediarios;
- lote 3: ajustes/regeneracoes.

Preserve slides aprovados. Nunca regenere tudo quando apenas um slide falhar.

## Contrato minimo do manifest

```json
{
  "id": "YYYY-MM-DD-slug",
  "title": "Nome do carrossel",
  "theme": "Tema central",
  "status": "draft",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601",
  "slideCount": 8,
  "coverImage": "/carrosseis/history/YYYY-MM-DD-slug/slides/slide-01.png",
  "source": "carrossel-design-cinema",
  "sourcePath": null,
  "tags": ["entrelacos", "carrossel", "cinematografico"],
  "files": []
}
```

Use `status: "draft"` para previa, `"approved"` para roteiro aprovado e `"generated"` quando imagens forem geradas.

## Resposta quando Tati pedir historico

Se Tati pedir para ver o que ja foi criado, nao crie novo carrossel.

Execute:

```bash
npm run carousel:history
```

no repo `D:\AI_Workspace\Projects\LPs_Entrelacos`, suba ou confirme o dev server e responda com:

- URL local: `http://127.0.0.1:4321/carrosseis/`
- quantidade de criacoes indexadas;
- quantidade total de imagens;
- caminho do `index.json`;
- nota de que cada card abre capa, brief, prompts e manifest.

## Formato de slide

Todo slide deve ser `1080 x 1350 px`, vertical, proporcao `4:5`.

Use margem segura minima de `120 px` para texto e elementos importantes.

Inclua nos prompts:

`Create exactly a 1080x1350 px vertical Instagram carousel slide, 4:5 aspect ratio, with all text and important elements inside a safe margin of at least 120 px from every edge. No cropping, no text near the borders, no important elements outside the safe area.`

## Identidade visual

Direcao: editorial premium, cinematografica, tecnologica, humana, estrategica e adulta.

Evite: estetica fofa, infantil, template generico, clinica tradicional, imagens espirituais, banco de imagem obvio, excesso de neon, excesso de roxo, texto ilegivel.

Paleta base:

- Preto: `#050506`
- Grafite: `#101014`
- Branco gelo: `#F8F7FF`
- Cinza texto: `#A1A1AA`
- Roxo profundo: `#4B1FA6`
- Roxo vivo: `#7C3AED`
- Lilas: `#A78BFA`
- Laranja: `#FF7A1A`
- Turquesa: `#2DD4BF`

Regra dos 8%: cores vibrantes aparecem apenas como acento.

## Voz

Use voz humana, estrategica, revolucionaria e etica.

Frases de referencia:

- "Dignidade tambem e etica."
- "Estrutura tambem e cuidado."
- "Clinica sustentavel nao nasce do improviso."
- "Agenda cheia nao e o mesmo que carreira solida."
- "Voce nao precisa caber melhor no que te diminui."

## Checklist final

Antes de concluir qualquer entrega, confirme:

- A resposta foi em modo rapido quando ainda nao houve aprovacao?
- O carrossel tem no maximo 8 slides por padrao?
- Os prompts estao prontos para imagem 1080x1350?
- O historico foi salvo ou o caminho de historico foi informado?
- `npm run carousel:history` foi executado quando houve mudanca no acervo?
- Tati recebeu a URL para consultar criacoes anteriores?
