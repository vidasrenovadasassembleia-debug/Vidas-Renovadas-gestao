/* =========================================================
   CERTIFICADO DE IMPRESSÃO — VIDAS RENOVADAS GESTÃO
   Arquivo: js/certificado-impressao.js
   ========================================================= */

function criarEstruturaCertificado(tipo) {
  const folha = document.createElement("div");
  folha.className = "certificado-impressao";
  folha.dataset.tipo = tipo;

  const imagemModelo =
    tipo === "consagracao"
      ? "../certificados/modelos/certificado-consagracao.png"
      : "../certificados/modelos/certificado-batismo.png";

  folha.innerHTML = `
    <img class="certificado-modelo" src="${imagemModelo}" alt="" aria-hidden="true">

    <p class="certificado-campo certificado-nome" id="certNome"></p>
    <p class="certificado-campo certificado-cargo" id="certCargo"></p>
    <p class="certificado-campo certificado-local-data" id="certLocalData"></p>
    <p class="certificado-campo certificado-numero" id="certNumero"></p>

    <div class="certificado-qrcode" id="certQrCode"></div>

    <img
      class="certificado-assinatura"
      id="certAssinatura"
      alt="Assinatura do Pastor Presidente"
    >
  `;

  return folha;
}

function abrirImpressaoCertificado(dados) {
  let area = document.querySelector(".area-certificado-impressao");

  if (!area) {
    area = document.createElement("div");
    area.className = "area-certificado-impressao";
    document.body.appendChild(area);
  }

  area.innerHTML = "";

  const folha = criarEstruturaCertificado(dados.tipo);
  area.appendChild(folha);

  document.getElementById("certNome").textContent = dados.nome || "";

  const cargo = document.getElementById("certCargo");

  if (dados.tipo === "consagracao") {
    cargo.textContent = dados.cargo || "";
  } else {
    cargo.style.display = "none";
  }

  document.getElementById("certLocalData").textContent =
    `${dados.cidade || ""}, ${dados.dataExtenso || ""}`;

  document.getElementById("certNumero").textContent =
    `REGISTRO Nº ${dados.numero || ""}`;

  const assinatura = document.getElementById("certAssinatura");

  if (dados.assinatura) {
    assinatura.src = dados.assinatura;
  } else {
    assinatura.style.display = "none";
  }

  gerarQRCodeCertificado(
    document.getElementById("certQrCode"),
    dados.linkValidacao || window.location.href
  );

  const modelo = folha.querySelector(".certificado-modelo");

  const imprimir = () => {
    document.body.classList.add("imprimindo-certificado");
    window.print();

    setTimeout(() => {
      document.body.classList.remove("imprimindo-certificado");
    }, 800);
  };

  if (modelo.complete) {
    imprimir();
  } else {
    modelo.addEventListener("load", imprimir, { once: true });

    modelo.addEventListener(
      "error",
      () => {
        alert(
          "Não foi possível carregar a imagem do certificado. " +
          "Confira os arquivos dentro de certificados/modelos."
        );
      },
      { once: true }
    );
  }
}

function gerarQRCodeCertificado(elemento, texto) {
  elemento.innerHTML = "";

  if (typeof QRCode === "undefined") {
    elemento.textContent = "QR";
    return;
  }

  new QRCode(elemento, {
    text: texto,
    width: 150,
    height: 150,
    correctLevel: QRCode.CorrectLevel.H
  });
}
