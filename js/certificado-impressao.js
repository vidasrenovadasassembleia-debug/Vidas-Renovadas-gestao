"use strict";

/* =========================================================
   CERTIFICADO DE IMPRESSÃO — VIDAS RENOVADAS GESTÃO
   Arquivo: js/certificado-impressao.js

   Responsabilidade deste arquivo:
   - montar o certificado sobre a arte oficial;
   - preencher os dados variáveis;
   - renderizar a mesma estrutura na prévia e na impressão;
   - gerar o QR Code para acesso ao certificado digital.

   Este arquivo não pesquisa membros, não registra certificados
   e não altera a comunicação com a API.
   ========================================================= */

const PASTOR_PRESIDENTE_CERTIFICADO = "Rogério Lemos da Silva";

function normalizarTipoCertificado(tipo) {
  const valor = String(tipo || "consagracao")
    .trim()
    .toLowerCase();

  return valor === "batismo"
    ? "batismo"
    : "consagracao";
}

function criarEstruturaCertificado(dados = {}) {
  const tipo = normalizarTipoCertificado(dados.tipo);
  const folha = document.createElement("div");

  folha.className = "certificado-impressao";
  folha.dataset.tipo = tipo;

  const imagemModelo =
    tipo === "consagracao"
      ? "../certificados/modelos/certificado-consagracao.png"
      : "../certificados/modelos/certificado-batismo.png";

  folha.innerHTML = `
    <img
      class="certificado-modelo"
      src="${imagemModelo}"
      alt=""
      aria-hidden="true"
    >

    <div class="certificado-mascara mascara-nome"></div>
    <div class="certificado-mascara mascara-cargo"></div>
    <div class="certificado-mascara mascara-local-data"></div>
    <div class="certificado-mascara mascara-numero"></div>
    <div class="certificado-mascara mascara-qrcode"></div>
    <div class="certificado-mascara mascara-pastor-nome"></div>

    <p
      class="certificado-campo certificado-nome"
      data-cert-campo="nome"
    ></p>

    <p
      class="certificado-campo certificado-cargo"
      data-cert-campo="cargo"
    ></p>

    <p
      class="certificado-campo certificado-local-data"
      data-cert-campo="localData"
    ></p>

    <p
      class="certificado-campo certificado-numero"
      data-cert-campo="numero"
    ></p>

    <div
      class="certificado-qrcode"
      data-cert-campo="qrcode"
    ></div>

    <p class="certificado-pastor">
      <strong>${PASTOR_PRESIDENTE_CERTIFICADO}</strong>
      <span>Pastor Presidente</span>
    </p>
  `;

  preencherEstruturaCertificado(folha, dados);

  return folha;
}

function preencherEstruturaCertificado(folha, dados = {}) {
  if (!folha) {
    return;
  }

  const campo = (nome) =>
    folha.querySelector(`[data-cert-campo="${nome}"]`);

  const tipo = normalizarTipoCertificado(dados.tipo);

  const nome = campo("nome");
  const cargo = campo("cargo");
  const localData = campo("localData");
  const numero = campo("numero");

  if (nome) {
    nome.textContent = dados.nome || "";
  }

  if (cargo) {
    cargo.textContent =
      tipo === "consagracao"
        ? dados.cargo || ""
        : "";
  }

  const local =
    dados.cidade ||
    dados.local ||
    "";

  const data =
    dados.dataExtenso ||
    formatarDataCertificado(dados.dataCerimonia) ||
    "";

  if (localData) {
    localData.textContent =
      [local, data].filter(Boolean).join(", ");
  }

  if (numero) {
    numero.textContent = dados.numero
      ? `REGISTRO Nº ${dados.numero}`
      : "PRÉ-VISUALIZAÇÃO";
  }

  gerarQRCodeCertificado(
    campo("qrcode"),
    dados.linkDigital ||
    dados.linkValidacao ||
    dados.urlCertificado ||
    window.location.href
  );
}

function formatarDataCertificado(valor) {
  if (!valor) {
    return "";
  }

  const texto = String(valor);
  const dataSomente = texto.includes("T")
    ? texto.split("T")[0]
    : texto;

  const data = new Date(`${dataSomente}T12:00:00`);

  if (Number.isNaN(data.getTime())) {
    return texto;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(data);
}

function renderizarPreviewCertificado(alvo, dados = {}) {
  if (!alvo) {
    return;
  }

  alvo.innerHTML = "";

  const moldura = document.createElement("div");
  moldura.className = "preview-certificado-escala";

  const certificado = criarEstruturaCertificado(dados);

  moldura.appendChild(certificado);
  alvo.appendChild(moldura);

  ajustarEscalaPreview(moldura, certificado);

  const modelo = certificado.querySelector(".certificado-modelo");

  if (modelo && !modelo.complete) {
    modelo.addEventListener(
      "load",
      () => ajustarEscalaPreview(moldura, certificado),
      { once: true }
    );
  }
}

function ajustarEscalaPreview(moldura, certificado) {
  if (!moldura || !certificado) {
    return;
  }

  const larguraBase = 297 * 3.7795275591;
  const larguraDisponivel = moldura.clientWidth;

  if (!larguraDisponivel) {
    return;
  }

  certificado.style.transform =
    `scale(${larguraDisponivel / larguraBase})`;
}

function abrirImpressaoCertificado(dados = {}) {
  let area = document.querySelector(
    ".area-certificado-impressao"
  );

  if (!area) {
    area = document.createElement("div");
    area.className = "area-certificado-impressao";
    document.body.appendChild(area);
  }

  area.innerHTML = "";

  const certificado = criarEstruturaCertificado(dados);
  area.appendChild(certificado);

  const modelo = certificado.querySelector(
    ".certificado-modelo"
  );

  const imprimir = () => {
    document.body.classList.add(
      "imprimindo-certificado"
    );

    requestAnimationFrame(() => {
      window.print();

      setTimeout(() => {
        document.body.classList.remove(
          "imprimindo-certificado"
        );
      }, 800);
    });
  };

  if (modelo?.complete) {
    imprimir();
    return;
  }

  modelo?.addEventListener(
    "load",
    imprimir,
    { once: true }
  );

  modelo?.addEventListener(
    "error",
    () => {
      alert(
        "Não foi possível carregar a arte do certificado. " +
        "Confira os arquivos dentro de certificados/modelos."
      );
    },
    { once: true }
  );
}

function gerarQRCodeCertificado(elemento, texto) {
  if (!elemento) {
    return;
  }

  elemento.innerHTML = "";

  if (typeof QRCode === "undefined") {
    elemento.textContent = "QR";
    return;
  }

  new QRCode(elemento, {
    text: texto || window.location.href,
    width: 150,
    height: 150,
    correctLevel:
      QRCode.CorrectLevel
        ? QRCode.CorrectLevel.M
        : undefined
  });
}

window.addEventListener("resize", () => {
  document
    .querySelectorAll(".preview-certificado-escala")
    .forEach((moldura) => {
      ajustarEscalaPreview(
        moldura,
        moldura.querySelector(
          ".certificado-impressao"
        )
      );
    });
});
