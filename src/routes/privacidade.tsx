import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Dias Mais Felizes" },
      { name: "description", content: "Política de privacidade e uso de dados de medição de publicidade — Dias Mais Felizes." },
      { property: "og:title", content: "Política de Privacidade — Dias Mais Felizes" },
      { property: "og:description", content: "Política de privacidade e uso de dados de medição de publicidade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacidade,
});

function Privacidade() {
  return (
    <main className="funnel-page">
      <div className="funnel-column" style={{ textAlign: "left", gap: 16 }}>
        <h1 className="quiz-title">Política de Privacidade</h1>
        <p className="quiz-description">
          Este site utiliza o Pixel da Meta (Meta Platforms, Inc.) para medir a
          eficácia das nossas campanhas de publicidade no Facebook e Instagram.
        </p>
        <p className="quiz-description">
          Dados coletados: informações de navegação neste site (páginas visitadas e
          interações), endereço IP e identificadores do navegador. Esses dados são
          compartilhados com a Meta Platforms, Inc. com a finalidade de medição e
          otimização de anúncios.
        </p>
        <p className="quiz-description">
          Em regiões que exigem consentimento prévio (como a União Europeia e o
          Reino Unido), esse rastreamento permanece desativado. Você pode retirar
          seu consentimento ou se opor a esse tratamento a qualquer momento pelos
          canais de contato do site ou pelas configurações de anúncios da sua conta
          no Facebook/Instagram.
        </p>
        <p className="quiz-description">
          As respostas do questionário não são enviadas à Meta nem a terceiros.
        </p>
        <Link to="/" className="quiz-description" style={{ textDecoration: "underline" }}>
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
