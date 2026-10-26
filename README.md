# Protocolo Renovac

Projeto do funil Protocolo Renovac, preparado para publicação independente no GitHub e implantação como Cloudflare Worker. As imagens e os áudios usados pelo funil estão em `public/media` e são publicados junto com o site.

## Rodar localmente

Requer Node.js 22.12 ou superior e npm.

```sh
npm install
npm run dev
```

## Publicar na Cloudflare

1. Envie o conteúdo desta pasta para um repositório GitHub novo ou existente.
2. No painel Cloudflare, conecte o repositório em **Workers & Pages → Create → Workers Builds**. Configure `npm run build` como comando de build e `npx wrangler deploy` como comando de deploy. A Cloudflare passa a publicar cada envio para o branch selecionado.
3. Para publicar pelo computador, instale as dependências, autentique o Wrangler na sua conta Cloudflare e execute:

```sh
npm install
npm run deploy
```

O Worker usa o nome `protocolorenovac`. Para outro nome, altere `name` em `wrangler.jsonc`. O domínio personalizado pode ser configurado depois; o endereço `workers.dev` funciona para conferir a publicação.

## Arquivos de mídia

As referências das imagens e áudios são mantidas em `src/lib/source-assets.ts` e `src/lib/funnel-media.ts`; os arquivos correspondentes ficam em `public/media`. Para trocar uma mídia, atualize o arquivo local e a referência apropriada. As mídias específicas das versões masculina e feminina permanecem separadas.

## Estrutura

- `src/routes`: rotas do funil e da oferta.
- `src/lib`: conteúdo, navegação, rastreamento e referências de mídia.
- `public/media`: imagens e áudios publicados com o site.
- `wrangler.jsonc`: configuração do Cloudflare Worker.
