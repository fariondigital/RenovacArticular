# Instruções do projeto para Claude Code

## Regra obrigatória: identificar a versão antes de editar

Este repositório contém dois funis independentes: V1 (React/TanStack) e V2 (WhatsWeb estático). Antes de fazer qualquer alteração pedida pelo usuário, confirme o escopo:

- Se o usuário disser V1, trabalhe somente nos arquivos da V1.
- Se disser V2, trabalhe somente em public/whatsweb/.
- Se disser ambos, atualize os dois conscientemente e verifique cada implementação.
- Se não disser qual versão, pergunte “Essa alteração é para o funil V1 ou V2 (WhatsWeb)?” antes de editar. Não deduza pela conversa antiga, pelo nome do arquivo ou por suposição.
- Se o usuário disser “não altere nada”, limite-se a explicar ou revisar.

Não pergunte novamente quando o usuário já especificou a versão. Um caminho público claramente citado, como /whatsweb/, identifica a V2; se ainda houver dúvida real sobre o alcance, pergunte antes de editar.

## Mapa rápido

- V1 React: páginas em src/routes/; componente principal em src/components/funnel.tsx; conteúdo em src/lib/funnel-content.json; referências de mídia em src/lib/source-assets.ts e src/lib/funnel-media.ts; arquivos estáticos em public/media/.
- V2 WhatsWeb: página HTML independente em public/whatsweb/index.html; mídia própria junto dela e em public/whatsweb/media/. A URL publicada é /whatsweb/.
- src/routes/__root.tsx fornece shell, head e inicialização global às rotas React. O HTML da V2 tem seu próprio head.
- Rotas de produção da V1 ficam na raiz do domínio: funil em /, oferta em /oferta e privacidade em /privacidade (src/routes/index.tsx, oferta.tsx, privacidade.tsx). Este é o link usado nos anúncios. Qualquer URL em /renovac/* redireciona (301, preservando UTMs) para o equivalente na raiz via src/routes/renovac.tsx; não trate /renovac como rota ativa.

## Antes de mudar código

1. Confirme a versão e a rota afetadas.
2. Leia o arquivo-alvo e helpers relacionados. Preserve copy, mídia, checkout e tracking fora do pedido.
3. Para scripts, determine em quais páginas devem rodar. O shell __root.tsx cobre rotas React; scripts no HTML V2 cobrem a V2. Não presuma que um lado atualiza o outro.
4. Faça a menor alteração coerente e confira imports, caminhos de mídia e eventos existentes.
5. Resuma os arquivos alterados. Rode a verificação apropriada para mudanças de código; não publique/deploy sem pedido explícito.

## Comandos

- Instalar: npm install
- Desenvolvimento: npm run dev
- Build: npm run build
- Deploy manual, se autorizado e autenticado: npm run deploy

Cloudflare Workers Builds pode publicar automaticamente commits no branch de produção configurado, historicamente main. Verifique a configuração atual e o resultado do build antes de afirmar que foi publicado.
