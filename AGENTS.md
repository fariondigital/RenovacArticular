# Instruções do projeto

- Mantenha o funil público nas rotas TanStack e o conteúdo do quiz separado da lógica de navegação.
- Preserve as variações de mídia específicas por etapa e gênero; retenha o gênero em sessionStorage durante a navegação da oferta.
- Mantenha imagens e áudios em `public/media` e use URLs estáticas locais. Não use URLs de mídia externas da plataforma de edição.
- Preserve os links de compra como destinos externos; não simule processamento de pagamento nem copie credenciais privadas de rastreamento.
- Mantenha conteúdo capturado declarativo, com o parser compartilhado substituindo controles interativos e mídia. A aparência capturada pertence aos tokens semânticos em `source-funnel.css`, não a estilos inline nem scripts importados executáveis.
- Redesigns visuais devem ficar na camada de sobreposição ao fim de `src/styles.css`, remapeando tokens `--source-tone-*` e classes de clone. Não altere regras capturadas em `source-funnel.css`, para manter a aparência original recuperável.
- Componentes de mídia personalizados (por exemplo, `audio-player.tsx`) devem ser pequenos componentes injetados pelo parser, nunca HTML JSON capturado.
- Implantações Cloudflare devem usar a configuração em `wrangler.jsonc` e o adaptador Vite oficial `@cloudflare/vite-plugin`.
