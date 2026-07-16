<!DOCTYPE html>
<html lang="pt-BR">

<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>Carteirinha do Membro | Vidas Renovadas Gestão</title>

  <link
    rel="stylesheet"
    href="css/estilo.css"
  >

  <style>
    :root {
      --azul-carteira: #0f2f48;
      --azul-claro-carteira: #174867;
      --dourado-carteira: #b98a45;
      --branco-carteira: #ffffff;
      --cinza-carteira: #eef2f5;
      --texto-carteira: #243746;
    }

    body.carteirinha-page {
      min-height: 100vh;
      margin: 0;
      padding: 28px;
      background: #edf1f4;
      font-family: Arial, Helvetica, sans-serif;
      color: var(--texto-carteira);
    }

    .carteirinha-header {
      width: min(100%, 980px);
      margin: 0 auto 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .carteirinha-header h1 {
      margin: 0;
      color: var(--azul-carteira);
      font-size: 28px;
    }

    .carteirinha-header p {
      margin: 6px 0 0;
      color: #6c7a84;
    }

    .carteirinha-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .carteirinha-actions button,
    .carteirinha-actions a {
      min-height: 42px;
      padding: 10px 16px;
      border: 0;
      border-radius: 9px;
      background: var(--azul-carteira);
      color: var(--branco-carteira);
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
    }

    .carteirinha-actions a {
      display: inline-flex;
      align-items: center;
    }

    .carteirinha-actions .secundario {
      background: var(--branco-carteira);
      color: var(--azul-carteira);
      border: 1px solid #cfd8df;
    }

    .carteirinha-status {
      width: min(100%, 980px);
      margin: 0 auto 18px;
      padding: 14px 16px;
      border-radius: 12px;
      background: var(--branco-carteira);
      color: #667680;
      text-align: center;
    }

    .folha-carteirinha {
      width: min(100%, 980px);
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 28px;
      justify-items: center;
    }

    .carteira {
      position: relative;
      width: 85.6mm;
      height: 54mm;
      overflow: hidden;
      border-radius: 3.2mm;
      background: var(--branco-carteira);
      box-shadow: 0 16px 38px rgba(15, 47, 72, 0.18);
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }

    .carteira-frente {
      display: grid;
      grid-template-columns: 31mm 1fr;
      background:
        linear-gradient(
          135deg,
          rgba(185, 138, 69, 0.14),
          transparent 48%
        ),
        var(--branco-carteira);
    }

    .faixa-lateral {
      background:
        linear-gradient(
          180deg,
          var(--azul-carteira),
          var(--azul-claro-carteira)
        );
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3mm;
      padding: 4mm;
      color: var(--branco-carteira);
    }

    .foto-membro {
      width: 23mm;
      height: 29mm;
      border-radius: 2.4mm;
      border: 0.8mm solid rgba(255, 255, 255, 0.82);
      object-fit: cover;
      background: #dfe7ec;
    }

    .foto-placeholder {
      width: 23mm;
      height: 29mm;
      border-radius: 2.4mm;
      border: 0.8mm solid rgba(255, 255, 255, 0.82);
      display: grid;
      place-items: center;
      background: rgba(255, 255, 255, 0.12);
      color: var(--branco-carteira);
      font-size: 7mm;
      font-weight: 700;
    }

    .id-lateral {
      font-size: 3mm;
      font-weight: 700;
      letter-spacing: 0.08em;
    }

    .dados-frente {
      padding: 4.2mm 4.5mm 3.5mm;
      display: flex;
      flex-direction: column;
    }

    .marca-carteira {
      display: flex;
      align-items: center;
      gap: 2.5mm;
      margin-bottom: 3mm;
    }

    .marca-carteira img {
      width: 12mm;
      height: 12mm;
      object-fit: contain;
      border-radius: 2mm;
      background: var(--branco-carteira);
    }

    .marca-carteira strong {
      display: block;
      color: var(--azul-carteira);
      font-size: 3.6mm;
      line-height: 1.05;
    }

    .marca-carteira span {
      display: block;
      margin-top: 0.8mm;
      color: var(--dourado-carteira);
      font-size: 2.2mm;
      font-weight: 700;
      letter-spacing: 0.07em;
      text-transform: uppercase;
    }

    .nome-membro {
      margin: 1mm 0 2mm;
      color: var(--azul-carteira);
      font-size: 4.4mm;
      line-height: 1.08;
    }

    .linha-dado {
      margin-top: 1.4mm;
    }

    .linha-dado span {
      display: block;
      color: #7b8992;
      font-size: 2.1mm;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .linha-dado strong {
      display: block;
      margin-top: 0.4mm;
      color: var(--texto-carteira);
      font-size: 2.9mm;
      line-height: 1.15;
    }

    .rodape-frente {
      margin-top: auto;
      padding-top: 1.8mm;
      border-top: 0.3mm solid #e5eaee;
      display: flex;
      justify-content: space-between;
      gap: 2mm;
      font-size: 2.2mm;
      color: #687780;
    }

    .situacao-ativa {
      color: #2b7548;
      font-weight: 700;
    }

    .carteira-verso {
      background:
        linear-gradient(
          145deg,
          var(--azul-carteira),
          var(--azul-claro-carteira)
        );
      color: var(--branco-carteira);
      display: grid;
      grid-template-columns: 1fr 30mm;
      gap: 3mm;
      padding: 5mm;
    }

    .verso-conteudo {
      display: flex;
      flex-direction: column;
    }

    .verso-conteudo h2 {
      margin: 0 0 1.4mm;
      font-size: 4.1mm;
      line-height: 1.08;
    }

    .verso-conteudo .subtitulo {
      color: #e6cda6;
      font-size: 2.3mm;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .verso-conteudo p {
      margin: 3mm 0 0;
      font-size: 2.5mm;
      line-height: 1.35;
    }

    .validade {
      margin-top: auto;
      padding-top: 2mm;
      border-top: 0.3mm solid rgba(255, 255, 255, 0.22);
      font-size: 2.5mm;
    }

    .validade strong {
      display: block;
      margin-top: 0.6mm;
      color: #f2d7ab;
      font-size: 3.2mm;
    }

    .qr-area {
      align-self: center;
      justify-self: center;
      padding: 2.3mm;
      border-radius: 2mm;
      background: var(--branco-carteira);
      color: var(--azul-carteira);
      text-align: center;
    }

    #qrCode {
      width: 23mm;
      height: 23mm;
      display: grid;
      place-items: center;
    }

    #qrCode img,
    #qrCode canvas {
      width: 23mm !important;
      height: 23mm !important;
    }

    .qr-area span {
      display: block;
      margin-top: 1.4mm;
      font-size: 2mm;
      font-weight: 700;
    }

    @media (max-width: 900px) {
      .folha-carteirinha {
        grid-template-columns: 1fr;
      }
    }

    @media print {
      @page {
        size: A4 portrait;
        margin: 12mm;
      }

      body.carteirinha-page {
        padding: 0;
        background: #ffffff;
      }

      .carteirinha-header,
      .carteirinha-status {
        display: none !important;
      }

      .folha-carteirinha {
        width: 100%;
        margin: 0;
        grid-template-columns: repeat(2, 85.6mm);
        gap: 12mm 10mm;
        align-items: start;
        justify-content: start;
      }

      .carteira {
        box-shadow: none;
        border: 0.2mm solid #c8d0d6;
        break-inside: avoid;
      }
    }
  </style>

  <script
    src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"
    defer
  ></script>
</head>

<body class="carteirinha-page">

  <header class="carteirinha-header">

    <div>
      <h1>Carteirinha do membro</h1>
      <p>
        Visualize a frente e o verso antes de imprimir.
      </p>
    </div>

    <div class="carteirinha-actions">

      <a
        id="voltarFicha"
        class="secundario"
        href="membros.html"
      >
        Voltar
      </a>

      <button
        id="botaoImprimir"
        type="button"
      >
        Imprimir carteirinha
      </button>

    </div>

  </header>

  <div
    id="statusCarteirinha"
    class="carteirinha-status"
    aria-live="polite"
  >
    Carregando dados do membro...
  </div>

  <main
    id="areaCarteirinha"
    class="folha-carteirinha"
    hidden
  >

    <section
      class="carteira carteira-frente"
      aria-label="Frente da carteirinha"
    >

      <div class="faixa-lateral">

        <div
          id="fotoPlaceholder"
          class="foto-placeholder"
        >
          VR
        </div>

        <img
          id="fotoMembro"
          class="foto-membro"
          alt="Foto do membro"
          hidden
        >

        <div
          id="idLateral"
          class="id-lateral"
        >
          VR000000
        </div>

      </div>

      <div class="dados-frente">

        <div class="marca-carteira">

          <img
            src="logo.png"
            alt="Logo da igreja"
          >

          <div>
            <strong>
              Vidas Renovadas
            </strong>

            <span>
              Carteira de membro
            </span>
          </div>

        </div>

        <h2
          id="nomeMembro"
          class="nome-membro"
        >
          Nome do membro
        </h2>

        <div class="linha-dado">
          <span>Cargo</span>
          <strong id="cargoMembro">—</strong>
        </div>

        <div class="linha-dado">
          <span>Congregação</span>
          <strong id="congregacaoMembro">—</strong>
        </div>

        <div class="rodape-frente">
          <span id="situacaoMembro">
            Situação: Ativo
          </span>

          <span id="numeroCarteirinha">
            Nº —
          </span>
        </div>

      </div>

    </section>

    <section
      class="carteira carteira-verso"
      aria-label="Verso da carteirinha"
    >

      <div class="verso-conteudo">

        <span class="subtitulo">
          Assembleia de Deus
        </span>

        <h2>
          Ministério Vidas Renovadas
        </h2>

        <p>
          CNPJ 60.028.677/0001-71<br>
          Duque de Caxias — RJ<br>
          Pastor Presidente: Rogerio Lemos da Silva
        </p>

        <div class="validade">
          Validade da carteirinha
          <strong id="validadeCarteirinha">
            Não informada
          </strong>
        </div>

      </div>

      <div class="qr-area">

        <div
          id="qrCode"
          aria-label="QR Code da carteirinha"
        ></div>

        <span>
          Verificação do membro
        </span>

      </div>

    </section>

  </main>

  <script src="js/app.js?v=11"></script>

</body>

</html>
