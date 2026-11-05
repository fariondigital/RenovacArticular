# Instruções do projeto para Claude Code

Este repositório contém um único funil: a V1 (React/TanStack Start), publicada na raiz de www.sabedoriadocorpo.com. O antigo funil V2 (/whatsweb/) foi removido; links antigos para ele redirecionam para a raiz.

- Se o usuário disser “não altere nada”, limite-se a explicar ou revisar.
- Preserve copy, mídia, checkout e tracking fora do pedido.

## Mapa rápido

- Rotas de produção na raiz do domínio: funil em /, oferta em /oferta e privacidade em /privacidade (src/routes/index.tsx, oferta.tsx, privacidade.tsx). Este é o link usado nos anúncios.
- Redirecionamentos (301, preservando UTMs): /renovac/* para o equivalente na raiz (src/routes/renovac.tsx) e /whatsweb/* para / (src/routes/whatsweb.tsx). Não trate essas rotas como ativas.
- Componente principal: src/components/funnel.tsx. Conteúdo: src/lib/funnel-content.json (HTML de cada tela).
- Conversão do HTML em React: src/lib/parse-html.ts. Usa o mesmo parser no servidor e no navegador para a página sair pronta do servidor. O teste src/lib/parse-html.test.ts garante que a árvore é idêntica à do navegador em todas as telas; rode-o ao mudar o conteúdo.
- Mídia: src/lib/source-assets.ts e src/lib/funnel-media.ts; arquivos em public/media/.
- Estilos: src/styles.css (camada visual) importa src/source-funnel.css (estilos capturados de cada elemento, classes clone-N).
- src/routes/__root.tsx fornece shell, head, Clarity e inicialização do Pixel para todas as páginas.

## Antes de mudar código

1. Confirme a rota afetada.
2. Leia o arquivo-alvo e helpers relacionados.
3. Scripts globais vão em __root.tsx (valem para todas as páginas).
4. Faça a menor alteração coerente e confira imports, caminhos de mídia e eventos existentes.
5. Resuma os arquivos alterados. Rode npm test e npm run build; não publique/deploy sem pedido explícito.

## Comandos

- Instalar: npm install
- Desenvolvimento: npm run dev
- Testes: npm test
- Build: npm run build
- Deploy manual, se autorizado e autenticado: npm run deploy

Cloudflare Workers Builds pode publicar automaticamente commits no branch de produção configurado, historicamente main. Verifique a configuração atual e o resultado do build antes de afirmar que foi publicado.
