"use strict";

/* =========================================================
   CERTIFICADO DE IMPRESSÃO — VIDAS RENOVADAS GESTÃO
   Arquivo: js/certificado-impressao.js
   Correção: cobre os placeholders da arte antes de inserir os dados.
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

    <div class="certificado-mascara mascara-nome"></div>
    <div class="certificado-mascara mascara-cargo"></div>
    <div class="certificado-mascara mascara-local-data"></div>
    <div class="certificado-mascara mascara-numero"></div>
    <div class="certificado-mascara mascara-qrcode"></div>
    <div class="certificado-mascara mascara-pastor-nome"></div>

    <p class="certificado-campo certificado-nome" data-cert-campo="nome"></p>
    <p class="certificado-campo certificado-cargo" data-cert-campo="cargo"></p>
    <p class="certificado-campo certificado-local-data" data-cert-campo="localData"></p>
    <p class="certificado-campo certificado-numero" data-cert-campo="numero"></p>

    <div class="certificado-qrcode" data-cert-campo="qrcode"></div>

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

  const nome = campo("nome");
nome.textContent = dados.nome || "";

ajustarTexto(nome, 32, 20);
  const cargo = campo("cargo");
cargo.textContent = dados.cargo || "";

ajustarTexto(cargo, 24, 15);

  const local = dados.cidade || dados.local || "";
  const data = dados.dataExtenso || "";

  campo("localData").textContent =
    [local, data].filter(Boolean).join(", ");

  campo("numero").textContent = dados.numero
    ? `REGISTRO Nº ${dados.numero}`
    : "PRÉ-VISUALIZAÇÃO";

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

  const modelo = certificado.querySelector(".certificado-modelo");

  const imprimir = () => {
    document.body.classList.add("imprimindo-certificado");

    requestAnimationFrame(() => {
      window.print();

      setTimeout(() => {
        document.body.classList.remove("imprimindo-certificado");
      }, 800);
    });
  };

  if (modelo?.complete) {
    imprimir();
  } else {
    modelo?.addEventListener("load", imprimir, { once: true });
    modelo?.addEventListener(
      "error",
      () => alert(
        "Não foi possível carregar a arte do certificado."
      ),
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
    height: 150
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
function ajustarTexto(elemento, tamanhoInicial, tamanhoMinimo) {
  if (!elemento) {
    return;
  }

  // Sempre volta para o tamanho máximo
  elemento.style.fontSize = `${tamanhoInicial}px`;

  let tamanho = tamanhoInicial;

  while (
    elemento.scrollWidth > elemento.clientWidth &&
    tamanho > tamanhoMinimo
  ) {
    tamanho -= 0.5;
    elemento.style.fontSize = `${tamanho}px`;
  }
}
      

}

    
