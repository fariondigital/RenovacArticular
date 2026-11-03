# Guia do projeto RenovacArticular: V1, V2 e fluxo de trabalho

Este documento descreve o código presente no branch main no momento da consulta. É um mapa para trabalhar com segurança, não uma autorização para mudar copy, eventos, checkout ou publicar. As instruções permanentes para Claude Code estão em /CLAUDE.md.

## 1. Visão geral

O repositório publica o site no Cloudflare Workers e reúne duas experiências:

1. V1: aplicação React com TanStack Start. Quiz, telas e lógica ficam em componentes e módulos TypeScript/JSON.
2. V2 (WhatsWeb): página HTML estática independente publicada em /whatsweb/. Ela possui markup, estilos, scripts e mídia próprios.

As versões compartilham domínio e Pixel ID, mas não implementação. Corrigir HTML da V2 não altera React da V1. Alterar V1 não reescreve public/whatsweb/index.html.

## 2. Qual versão é qual?

| Versão | Entrada pública conhecida | Implementação |
| --- | --- | --- |
| V1 | https://www.sabedoriadocorpo.com/renovac | Rotas React em src/routes/ e componente Funnel |
| V2 / WhatsWeb | https://www.sabedoriadocorpo.com/whatsweb/ | public/whatsweb/index.html e seus assets |

O README também registra /renovac/oferta e /renovac/privacidade. Existem rotas React antigas na raiz, inclusive / e /oferta. Antes de mexer em navegação ou links, confirme a rota pública e o arquivo de rota atual. Não confunda /renovac (V1 React) com /whatsweb/ (V2 estática).

## 3. Estrutura relevante

    src/
      routes/
        __root.tsx          shell HTML das rotas React, head e inicialização global
        index.tsx           rota React /
        oferta.tsx          rota React /oferta
        renovac/            rotas do caminho /renovac
      components/
        funnel.tsx          apresentação e estado do quiz/oferta React
      lib/
        funnel-content.json conteúdo do funil consumido pela V1
        funnel-media.ts     resolução/seleção das mídias
        source-assets.ts    catálogo/referências dos arquivos originais
        meta-pixel.ts       pixel Meta e eventos da V1
        tracking-params.ts  persistência/passagem de parâmetros de atribuição
    public/
      media/                 mídias da aplicação React
      whatsweb/
        index.html           entrada completa da V2 estática
        media/               imagens da V2, incluindo perfis/depoimentos
        *.mp3                áudios usados pela V2
    wrangler.jsonc           configuração do Cloudflare Worker
    vite.config.ts           Vite, React, TanStack Start e Cloudflare
    package.json             comandos npm

## 4. Como funciona a V1

### Rotas e composição

A rota /renovac apresenta o funil React por meio do componente Funnel. A oferta é uma rota própria em /renovac/oferta; a privacidade está em /renovac/privacidade. Há também uma entrada React antiga em src/routes/index.tsx e uma rota src/routes/oferta.tsx. Não altere uma rota antiga supondo que ela seja a rota pública ativa: confirme a URL usada e leia os arquivos atuais em src/routes/renovac/.

O componente src/components/funnel.tsx coordena telas e estado: seleciona o caminho por gênero, exibe etapas, navega e no fim encaminha à oferta. O conteúdo vem de src/lib/funnel-content.json; funções de mídia ligam itens a arquivos em public/media/. Estado e parâmetros de campanha podem ser mantidos na sessão do navegador. A ordem e quantidade de etapas podem mudar; leia a implementação atual antes de editar.

### Conteúdo e mídia

- Copy e estrutura das perguntas: src/lib/funnel-content.json.
- Mapeamento de mídia: src/lib/source-assets.ts e src/lib/funnel-media.ts.
- Arquivos servidos pela V1: public/media/.
- Ao trocar mídia, atualize também as referências e confira extensão, maiúsculas e caminho.
- Não substitua avaliação, depoimento, áudio ou imagem sem pedido explícito.

### Rastreamento V1

- src/lib/meta-pixel.ts encapsula inicialização e eventos Meta da V1. O Pixel ID atual é 1671048727876935.
- O mapa consultado inclui PageView e checkpoints do quiz, áudio, vídeo, oferta e checkout. Eventos como QuizV1StepXXReached são construídos pelo código; confira o helper para evitar duplicações.
- src/lib/tracking-params.ts preserva e transporta parâmetros de atribuição suportados durante a sessão e para o checkout.
- O código do funil tem um destino de checkout Payt. Reconfira o valor diretamente antes de alterá-lo: o link pode ser sensível à oferta/campanha.

## 5. Como funciona a V2 WhatsWeb

public/whatsweb/index.html é a página completa da V2. Conteúdo dentro de public é servido como arquivo estático; esse HTML corresponde a /whatsweb/. Ele possui seu próprio head, CSS, JavaScript e chamadas de tracking.

Mídias próprias da V2 ficam principalmente em public/whatsweb/media/ e os áudios ficam no diretório e caminhos indicados pelo HTML. Ao substituir mídia, preserve o nome esperado ou mude a referência junto com o arquivo. Confira caminho, arquivo presente e carregamento no navegador.

A V2 usa o Pixel ID 1671048727876935 e diferencia seus eventos com prefixo V2_ (por exemplo V2_PageView e eventos próprios de áudio, quiz e checkout). Os botões de checkout vistos na versão consultada usavam https://payt.site/WOC6dVK. Reabra o HTML antes de qualquer alteração, pois esse destino pode ter sido atualizado.

## 6. Scripts e alcance

### Shell React

src/routes/__root.tsx monta o documento React e inclui HeadContent. A função head() fornece metadados e links. O shell também inicializa funcionalidades globais. Um script inserido ali pode atingir todas as rotas React que compartilham o root, não somente uma página.

### Página estática

V2 não passa pelo shell React. Scripts para ela devem estar no HTML V2 ou em um arquivo JavaScript carregado por esse HTML. Um script adicionado somente em __root.tsx não é automaticamente incluído em /whatsweb/.

### Roteiro de decisão

1. Identifique V1, V2 ou ambas.
2. Confirme quais URLs devem enviar dados.
3. Para V1, escolha shell global ou uma rota específica.
4. Para V2, integre no HTML/JS estático.
5. Evite duplicar pixel ou eventos.
6. Confira consentimento, termos do fornecedor e dados coletados; valide no navegador e no painel.

Este guia não confirma a instalação de UTMify. Também não afirma que qualquer script de analytics esteja aprovado para todos os conteúdos. Verifique o escopo e as regras aplicáveis.

## 7. Tutoriais de manutenção

### Alterar somente V1

1. Confirme V1.
2. Identifique a URL e a rota em src/routes/.
3. Para pergunta/etapa, examine funnel-content.json e funnel.tsx.
4. Para mídia, rastreie source-assets.ts e funnel-media.ts até public/media/.
5. Para tracking, atualize o helper central sem replicar chamadas sem necessidade.
6. Faça a alteração mínima e confira referências/build.

### Alterar somente V2

1. Confirme V2/WhatsWeb.
2. Edite public/whatsweb/index.html e somente os arquivos que ele referencia.
3. Para imagem/áudio, confira caminho e extensão.
4. Revise /whatsweb/ no navegador, incluindo mídia e CTAs se estiverem no escopo.
5. Não altere componentes React da V1, salvo pedido explícito.

### Alterar ambas

São duas implementações. Faça a alteração em cada uma e verifique cada rota separadamente. Domínio ou Pixel ID compartilhado não significa código ou eventos compartilhados.

### Checkout

Localize os destinos dos botões na versão pedida. Confirme todos os CTAs previstos. Preserve UTMs quando a versão possuir essa lógica. Nunca invente ou deduza um checkout.

### Eventos

Confira implementação atual antes de adicionar eventos. Use o helper central na V1 e os handlers existentes na V2. Mantenha nomes distintos por versão (V2 já usa prefixo V2_) e não envie respostas do quiz se o objetivo for apenas medir a etapa alcançada. Teste ação real e procure o evento no painel.

## 8. Desenvolvimento e publicação

O projeto usa npm, Vite, TanStack Start, React e Cloudflare. Comandos encontrados:

    npm install
    npm run dev
    npm run build
    npm run deploy

wrangler.jsonc identifica o Worker renovacarticular; vite.config.ts conecta build e Cloudflare. O README descreve Cloudflare Workers Builds ligado ao GitHub. Quando chega um commit ao branch de produção configurado (historicamente main), build/deploy pode ocorrer automaticamente. Confira painel e resultado do build antes de prometer publicação. Commit num branch ou PR não significa que o domínio já foi atualizado.

Antes de publicar, confira diff, rode npm run build quando possível, integre ao branch configurado somente com autorização e confirme o deployment e URL pública. Para prévia, use URL de preview/branch quando disponível; não substitua produção apenas para conferir.

## 9. Checklist obrigatório para Claude Code

- A versão está declarada: V1, V2/WhatsWeb ou ambas?
- A URL/rota foi identificada?
- Os arquivos da versão certa foram lidos?
- Copy, mídia, checkout e tracking fora do pedido foram preservados?
- Caminhos de assets e eventos existentes foram conferidos?
- Diff e verificação disponível foram revisados?
- A resposta final informa o que mudou e se houve deploy?

Se a versão não estiver indicada e não puder ser inferida de uma rota explicitamente citada, pare antes de editar e pergunte: “Essa alteração é para o funil V1 ou V2 (WhatsWeb)?”
