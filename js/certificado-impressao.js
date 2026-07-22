"use strict";

/* =========================================================
   CERTIFICADO DE IMPRESSÃO — VIDAS RENOVADAS GESTÃO
   Arquivo: js/certificado-impressao.js
   Preview e impressão usam exatamente a mesma estrutura.
   ========================================================= */

const PASTOR_PRESIDENTE_CERTIFICADO = "Rogério Lemos da Silva";

function criarEstruturaCertificado(dados = {}) {
  const tipo = String(dados.tipo || "consagracao").toLowerCase();
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

    <p class="certificado-campo certificado-nome" data-cert-campo="nome"></p>
    <p class="certificado-campo certificado-cargo" data-cert-campo="cargo"></p>
    <p class="certificado-campo certificado-congregacao" data-cert-campo="congregacao"></p>
    <p class="certificado-campo certificado-local-data" data-cert-campo="localData"></p>
    <p class="certificado-campo certificado-numero" data-cert-campo="numero"></p>

    <div class="certificado-qrcode" data-cert-campo="qrcode"></div>

    <img
      class="certificado-assinatura"
      data-cert-campo="assinatura"
      alt="Assinatura do Pastor Presidente"
    >

    <p class="certificado-pastor">
      <strong>${PASTOR_PRESIDENTE_CERTIFICADO}</strong>
      <span>Pastor Presidente</span>
    </p>
  `;

  preencherEstruturaCertificado(folha, dados);
  return folha;
}

function preencherEstruturaCertificado(folha, dados = {}) {
  const campo = (nome) =>
    folha.querySelector(`[data-cert-campo="${nome}"]`);

  campo("nome").textContent = dados.nome || "NOME DO MEMBRO";
  campo("cargo").textContent = dados.cargo || "Cargo ministerial";
  campo("congregacao").textContent = dados.congregacao
    ? `Congregação: ${dados.congregacao}`
    : "Congregação";

  const local = dados.cidade || dados.local || "";
  const data = dados.dataExtenso || "";

  campo("localData").textContent =
    [local, data].filter(Boolean).join(", ") ||
    "Local e data da cerimônia";

  campo("numero").textContent = dados.numero
    ? `REGISTRO Nº ${dados.numero}`
    : "PRÉ-VISUALIZAÇÃO";

  const assinatura = campo("assinatura");
  const caminhoAssinatura =
    dados.assinatura ||
    "../certificados/assinaturas/pastor-presidente.png";

  if (caminhoAssinatura) {
    assinatura.src = caminhoAssinatura;
    assinatura.hidden = false;
  } else {
    assinatura.hidden = true;
  }

  gerarQRCodeCertificado(
    campo("qrcode"),
    dados.linkValidacao || window.location.href
  );
}

function renderizarPreviewCertificado(alvo, dados) {
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

  const imagem = certificado.querySelector(".certificado-modelo");

  imagem?.addEventListener(
    "load",
    () => ajustarEscalaPreview(moldura, certificado),
    { once: true }
  );
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

  const escala = larguraDisponivel / larguraBase;
  certificado.style.transform = `scale(${escala})`;
}

function abrirImpressaoCertificado(dados) {
  let area = document.querySelector(".area-certificado-impressao");

  if (!area) {
    area = document.createElement("div");
    area.className = "area-certificado-impressao";
    document.body.appendChild(area);
  }

  area.innerHTML = "";

  const certificado = criarEstruturaCertificado(dados);
  area.appendChild(certificado);

  const imagem = certificado.querySelector(".certificado-modelo");

  const imprimir = () => {
    document.body.classList.add("imprimindo-certificado");

    requestAnimationFrame(() => {
      window.print();

      setTimeout(() => {
        document.body.classList.remove("imprimindo-certificado");
      }, 800);
    });
  };

  if (imagem?.complete) {
    imprimir();
  } else {
    imagem?.addEventListener("load", imprimir, { once: true });

    imagem?.addEventListener(
      "error",
      () => {
        alert(
          "Não foi possível carregar a arte do certificado. " +
          "Confira os arquivos em certificados/modelos."
        );
      },
      { once: true }
    );
  }
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
    correctLevel: QRCode.CorrectLevel
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
        moldura.querySelector(".certificado-impressao")
      );
    });
});
