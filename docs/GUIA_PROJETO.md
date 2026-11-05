# Guia do projeto RenovacArticular

Este documento descreve o código presente no branch main no momento da consulta. É um mapa para trabalhar com segurança, não uma autorização para mudar copy, eventos, checkout ou publicar. As instruções permanentes para Claude Code estão em /CLAUDE.md.

## 1. Visão geral

O repositório publica um único funil (V1) no Cloudflare Workers: uma aplicação React com TanStack Start. Quiz, telas e lógica ficam em componentes e módulos TypeScript/JSON.

O antigo funil V2 (página estática em /whatsweb/) foi removido. Qualquer link antigo para /whatsweb/ redireciona (301, preservando UTMs) para a raiz.

## 2. Endereços

| Endereço | O que é |
| --- | --- |
| https://www.sabedoriadocorpo.com/ | Funil (link dos anúncios) |
| /oferta | Página de oferta |
| /privacidade | Política de privacidade |
| /renovac/* | Redireciona para o equivalente na raiz |
| /whatsweb/* | Redireciona para / |

## 3. Estrutura relevante

    src/
      routes/
        __root.tsx          shell HTML, head, Clarity e inicialização global
        index.tsx           rota /
        oferta.tsx          rota /oferta
        privacidade.tsx     rota /privacidade
        renovac.tsx         redireciona /renovac/* para a raiz
        whatsweb.tsx        redireciona /whatsweb/* para /
      components/
        funnel.tsx          apresentação e estado do quiz/oferta
        audio-player.tsx    player de áudio estilo WhatsApp (velocidade 1x/1,5x/2x)
        video-facade.tsx    capa do vídeo; o player do YouTube só carrega ao toque
      lib/
        funnel-content.json conteúdo (HTML) de cada tela do funil
        parse-html.ts       converte o HTML das telas (mesmo parser no servidor e no navegador)
        funnel-media.ts     resolução/seleção das mídias (inclui troca por gênero)
        source-assets.ts    catálogo/referências dos arquivos originais
        meta-pixel.ts       Pixel Meta e eventos do quiz
        tracking-params.ts  persistência/passagem de parâmetros de atribuição
      styles.css            camada visual; importa source-funnel.css
      source-funnel.css     estilos capturados de cada elemento (classes clone-N)
    public/
      media/                imagens e áudios do funil
    wrangler.jsonc          configuração do Cloudflare Worker
    vite.config.ts          Vite, React, TanStack Start e Cloudflare
    package.json            comandos npm

## 4. Como funciona o funil

### Rotas e composição

A rota / (src/routes/index.tsx) apresenta o funil por meio do componente Funnel. A oferta é src/routes/oferta.tsx (/oferta) e a privacidade, src/routes/privacidade.tsx (/privacidade).

O componente src/components/funnel.tsx coordena telas e estado: seleciona o caminho por gênero, exibe etapas, navega e no fim encaminha à oferta. Estado e parâmetros de campanha podem ser mantidos na sessão do navegador. A ordem e quantidade de etapas podem mudar; leia a implementação atual antes de editar.

### Renderização no servidor

O HTML de cada tela é convertido em React por src/lib/parse-html.ts, com o mesmo parser (htmlparser2) no servidor e no navegador. Isso permite que a página saia pronta do servidor, sem tela em branco enquanto o JavaScript carrega. O teste src/lib/parse-html.test.ts compara, tela a tela, a árvore gerada com a do DOMParser do navegador; se o conteúdo mudar, rode npm test.

### Telas de múltipla escolha (caixinhas)

Nas telas com caixinhas, o botão de avançar fica mais claro (aria-disabled) até o lead marcar pelo menos uma opção. Se o lead tocar nele sem marcar nada, aparece em vermelho, logo abaixo, “Selecione uma das alternativas acima”. O aviso some quando uma opção é marcada. Telas de escolha única não têm essa regra.

### Vídeos e áudios

- Vídeos (telas 16, 24 e 27): até o lead tocar, aparece só a capa do YouTube com um botão de play. Ao tocar, o player carrega no mesmo lugar, já tocando, dentro da página. O lead não sai do funil. O evento VideoPageReached continua disparando ao chegar na tela, como antes. Enquanto o player carrega, a capa continua na tela, escurecida, com “Carregando vídeo…”, e só sai quando o YouTube avisa que o vídeo começou. Se o celular bloquear o início automático, ou se o YouTube não avisar, a capa sai em poucos segundos e o lead toca no play do próprio YouTube. Nunca fica carregando mais de 12 s.
- Áudios: a pílula ao lado da onda troca a velocidade (1x → 1,5x → 2x). A escolha vale para os próximos áudios da mesma aba. Não há arrastar para outro trecho (decisão do funil: o lead ouve o áudio na ordem).
- Se um dia voltar a ter busca por trecho: o Cloudflare entrega os arquivos de public/media sempre inteiros, sem pedidos parciais (Range), então o navegador não consegue pular para um trecho ainda não baixado (o commit 8e4d8ea tem uma solução).
- AudioCompleted só dispara se o lead realmente ouviu pelo menos 80% do áudio (cada trecho conta uma vez; pulos de trecho, como os controles da tela de bloqueio do celular, não contam). O limite está em COMPLETE_SHARE, em audio-player.tsx.

### Imagens

- As imagens de public/media estão em WebP, com 3× a largura em que aparecem na tela (o suficiente para celulares de alta densidade), sem passar do tamanho original. Em 11/2026 o total caiu de 6,5 MB para 1,3 MB, sem diferença visível.
- Ao adicionar uma imagem nova: converta para WebP (qualidade ~82; ~88 se tiver texto) e redimensione para 3× a largura exibida (máx. 448 px no layout → 1350 px).
- Pré-carregamento (src/lib/prefetch-images.ts): quando as imagens da tela atual terminam de carregar, o navegador baixa em segundo plano as da próxima tela. Antes da escolha de gênero, baixa as duas versões. O teste prefetch-images.test.ts confere que toda imagem usada pelo funil existe em public/media.

### Conteúdo e mídia

- Copy e estrutura das perguntas: src/lib/funnel-content.json.
- Mapeamento de mídia: src/lib/source-assets.ts e src/lib/funnel-media.ts.
- Arquivos servidos: public/media/.
- Ao trocar mídia, atualize também as referências e confira extensão, maiúsculas e caminho.
- Não substitua avaliação, depoimento, áudio ou imagem sem pedido explícito.

### Rastreamento

- src/lib/meta-pixel.ts encapsula inicialização e eventos Meta. O Pixel ID atual é 1671048727876935.
- O mapa consultado inclui PageView e checkpoints do quiz, áudio, vídeo, oferta e checkout. Eventos como QuizV1StepXXReached são construídos pelo código; confira o helper para evitar duplicações.
- src/lib/tracking-params.ts preserva e transporta parâmetros de atribuição suportados durante a sessão e para o checkout.
- Microsoft Clarity (z7yjpmz1wl) é carregado em src/routes/__root.tsx.
- O código do funil tem um destino de checkout Payt. Reconfira o valor diretamente antes de alterá-lo: o link pode ser sensível à oferta/campanha.

## 5. Scripts e alcance

src/routes/__root.tsx monta o documento e inclui HeadContent. A função head() fornece metadados e links. Um script inserido ali atinge todas as páginas, não somente uma.

Ao adicionar scripts: confirme quais URLs devem enviar dados, evite duplicar pixel ou eventos, confira consentimento, termos do fornecedor e dados coletados, e valide no navegador e no painel.

Este guia não confirma a instalação de UTMify. Também não afirma que qualquer script de analytics esteja aprovado para todos os conteúdos.

## 6. Tutoriais de manutenção

### Alterar o funil

1. Identifique a URL e a rota em src/routes/.
2. Para pergunta/etapa, examine funnel-content.json e funnel.tsx.
3. Para mídia, rastreie source-assets.ts e funnel-media.ts até public/media/.
4. Para tracking, atualize o helper central sem replicar chamadas sem necessidade.
5. Faça a alteração mínima, rode npm test e npm run build.

### Checkout

Localize os destinos dos botões. Confirme todos os CTAs previstos. Preserve UTMs. Nunca invente ou deduza um checkout.

### Eventos

Confira a implementação atual antes de adicionar eventos. Use o helper central e não envie respostas do quiz se o objetivo for apenas medir a etapa alcançada. Teste a ação real e procure o evento no painel.

## 7. Desenvolvimento e publicação

O projeto usa npm, Vite, TanStack Start, React e Cloudflare:

    npm install
    npm run dev
    npm test
    npm run build
    npm run deploy

wrangler.jsonc identifica o Worker renovacarticular; vite.config.ts conecta build e Cloudflare. Cloudflare Workers Builds está ligado ao GitHub: quando chega um commit ao branch de produção configurado (historicamente main), build/deploy pode ocorrer automaticamente. Confira painel e resultado do build antes de prometer publicação. Commit num branch ou PR não significa que o domínio já foi atualizado.

Antes de publicar, confira diff, rode npm test e npm run build, integre ao branch configurado somente com autorização e confirme o deployment e URL pública. Para prévia, use URL de preview/branch quando disponível.

## 8. Checklist para Claude Code

- A URL/rota foi identificada?
- Os arquivos certos foram lidos?
- Copy, mídia, checkout e tracking fora do pedido foram preservados?
- Caminhos de assets e eventos existentes foram conferidos?
- npm test e npm run build passaram?
- A resposta final informa o que mudou e se houve deploy?

## Botão Voltar, Pixel e telas estreitas

- Toda etapa após a primeira tem "← Voltar" no canto superior esquerdo (`funnel-back` em `funnel.tsx`). Na oferta, quem fez o quiz volta para a tela 26; quem entrou direto vai para o início.
- Voltar e avançar não repete eventos do Pixel: eventos do quiz são enviados uma vez por sessão (`trackQuizEventOnce`) e o PageView uma vez por endereço por carregamento (`trackPageView`).
- O funil foi desenhado para 382 px de largura. Em telas menores, o script `FIT_SNIPPET` (`__root.tsx`) reduz o funil na proporção exata (`zoom`), sem rolagem lateral. `.source-funnel` tem `overflow-x: clip`.
- Oferta: barras "Antes / Depois" são `.ba-compare` (styles.css). Tela 26: bolinhas das barras ancoradas na ponta.
- O link "Política de Privacidade" saiu do rodapé do funil; a página /privacidade continua no ar.
