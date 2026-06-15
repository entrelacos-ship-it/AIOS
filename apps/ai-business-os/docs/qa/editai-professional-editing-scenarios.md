# EditAI - Cenários QA para edição profissional

## Objetivo

Garantir que o EditAI entregue um vídeo final com padrão de edição profissional: cortes limpos, fala sincronizada, palavras sem sobreposição, visual coerente com o roteiro e controle claro do que foi removido antes da renderização.

## Critérios de aprovação

- Nenhum corte pode começar ou terminar no meio de uma palavra audível.
- A diferença perceptível entre fala, legenda e vídeo deve ficar abaixo de 150 ms.
- O usuário precisa conseguir ver cada trecho removido com contexto antes, durante e depois do corte.
- Todo corte automático de alto risco deve ficar em revisão, não aprovado automaticamente.
- O vídeo final precisa preservar intenção, fraseado e ritmo natural da fala.
- Cenas, legendas e elementos visuais não podem sobrepor palavras importantes ou áreas de rosto.
- A duração final precisa bater com a soma dos segmentos mantidos, com tolerância máxima de 300 ms.
- O projeto não pode falhar se timeline, favicon ou mídia ainda estiverem em processamento.

## Fluxo principal

1. Enviar vídeo vertical com fala limpa, pausas longas e refazimentos.
2. Aguardar normalização, transcrição e relatório de cortes.
3. Abrir timeline e verificar se a aplicação mostra mídia disponível, segmentos mantidos, cortes e palavras.
4. Para cada corte sugerido, acionar preview de antes, corte e depois.
5. Reprovar cortes que alterem sentido ou removam fala útil.
6. Criar um corte manual selecionando palavras no transcript.
7. Aplicar cortes.
8. Gerar cenas.
9. Renderizar.
10. Revisar vídeo final completo.

Resultado esperado: o vídeo renderizado tem ritmo mais enxuto, sem perda de sentido, sem palavra cortada, sem legenda fora de sincronia e com visibilidade total sobre as remoções.

## Matriz de cenários

| ID | Cenário | Entrada | Validação esperada |
| --- | --- | --- | --- |
| QA-01 | Silêncio simples | Pausa maior que 1s entre frases | Corte sugerido começa após a última palavra e termina antes da próxima. |
| QA-02 | Pausa curta natural | Pausa menor que limite do formato | Não gera corte automático. |
| QA-03 | Gagueira curta | Repetição de uma palavra | Sugere corte de baixo risco sem cortar a palavra boa. |
| QA-04 | Refazimento | Frase incompleta seguida de frase corrigida | Marca como revisão quando houver risco de alterar sentido. |
| QA-05 | Fala rápida | Palavras muito próximas | Não sobrepõe palavras nem cria cortes microscópicos. |
| QA-06 | Palavra atravessando limite | Palavra começa antes do corte e termina dentro dele | Ajusta limite ou mantém palavra íntegra. |
| QA-07 | Dois cortes próximos | Pausas consecutivas em curto intervalo | Mescla cortes quando necessário e mantém duração correta. |
| QA-08 | Corte manual | Seleção de palavras no transcript | Cria corte com origem manual e aparece na timeline. |
| QA-09 | Reprovar corte | Usuário desativa corte automático | Segmento volta ao vídeo final. |
| QA-10 | Timeline sem mídia pronta | Projeto ainda processando | API retorna 200 com mídia nula, sem erro 500. |
| QA-11 | Cenas com índices inválidos | IA retorna wordIndex inexistente | Backend normaliza ou bloqueia com erro claro antes do render. |
| QA-12 | Legenda após corte | Palavras reindexadas depois de cortes | Legendas seguem tempo editado, sem atraso acumulado. |
| QA-13 | Reels vertical | 9:16 com rosto central | Layout visual preserva rosto e texto não cobre boca/olhos. |
| QA-14 | YouTube horizontal | 16:9 com fala longa | Ritmo fica natural, sem cortes agressivos demais. |
| QA-15 | Áudio ruidoso | Ruído ou música baixa | Cortes incertos ficam em revisão. |
| QA-16 | Arquivo MOV/HEVC | Vídeo de celular | Normaliza para mídia reproduzível no browser e no render. |

## Checklist de revisão manual

- Abrir cada corte e ouvir: 2s antes, trecho removido e 2s depois.
- Confirmar se a frase pós-corte soa como uma fala gravada naturalmente.
- Confirmar se nenhuma palavra aparece duplicada por falha de reindexação.
- Confirmar se o transcript destacado corresponde ao áudio reproduzido.
- Confirmar se cortes manuais são persistidos após refresh.
- Confirmar se aplicar cortes não muda cortes reprovados.
- Confirmar se cenas geradas usam apenas palavras existentes após corte.
- Confirmar se render final é reproduzível do início ao fim no navegador.

## Testes automatizados recomendados

- Unitário: normalização de cortes aprovados mescla sobreposições e calcula duração real por `fim - inicio`.
- Unitário: reindexação remove palavras cortadas e desloca timestamps com múltiplos cortes.
- Unitário: cenas com word indices inválidos são reparadas para índices existentes.
- API: `GET /timeline` retorna 200 mesmo quando arquivo normalizado ainda não existe.
- API: `PATCH /cuts` atualiza aprovação e aceita corte manual novo com `id`.
- API: `POST /apply-cuts` rejeita remover mais que o limite permitido por formato.
- E2E: upload, revisar cortes, criar corte manual, aplicar, gerar cenas e renderizar.

## Bloqueadores de release

- Qualquer erro 500 na timeline durante estados normais de processamento.
- Palavra audível cortada no meio.
- Legenda mais de 150 ms fora da fala.
- Cena com índice de palavra inválido chegando ao render.
- Corte aprovado sem preview claro para o usuário.
- Vídeo final com áudio e imagem fora de sincronia.

## Veredito AIOX QA

O EditAI só deve ser considerado pronto quando passar no fluxo principal, em pelo menos um vídeo real de cada formato alvo, e nos cenários QA-01 a QA-12 sem regressão. QA-13 a QA-16 devem virar suíte de regressão antes de liberar para produção.
