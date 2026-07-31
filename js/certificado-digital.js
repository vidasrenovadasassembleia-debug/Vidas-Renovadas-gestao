"use strict";

/* ==========================================================================
   CERTIFICADO DIGITAL — VISUALIZAÇÃO PÚBLICA
   Renderiza certificados de Batismo e Consagração pelo token da URL.
   ========================================================================== */

const CERTIFICADOS = Object.freeze({
  BATISMO: "BATISMO",
  CONSAGRACAO: "CONSAGRACAO"
});

const MODELOS_CERTIFICADO = Object.freeze({
  BATISMO: {
    aba: "batismo",
    imagem: "assets/certificados/certificado-batismo-base.png",
    campos: {
      nome: { top: 394, left: 235, width: 900, height: 86 },
      cidade: { top: 773, left: 410, width: 327, height: 32 },
      dia: { top: 773, left: 786, width: 58, height: 32 },
      mes: { top: 773, left: 880, width: 195, height: 32 },
      ano: { top: 773, left: 1110, width: 84, height: 32 },
      assinatura: { top: 803, left: 490, width: 500, height: 96 },
      registro: { top: 931, left: 350, width: 255, height: 32 },
      qr: { top: 622, left: 1273, width: 143, height: 147 }
    }
  },

  CONSAGRACAO: {
    aba: "consagracao",
    imagem: "assets/certificados/certificado-consagracao-base.png",
    campos: {
      nome: { top: 402, left: 235, width: 900, height: 82 },
      cargo: { top: 500, left: 395, width: 700, height: 58 },
      cidade: { top: 830, left: 468, width: 261, height: 32 },
      dia: { top: 830, left: 779, width: 70, height: 32 },
      mes: { top: 830, left: 887, width: 133, height: 32 },
      ano: { top: 830, left: 1058, width: 78, height: 32 },
      assinatura: { top: 884, left: 505, width: 430, height: 85 },
      registro: { top: 934, left: 350, width: 255, height: 32 },
      qr: { top: 865, left: 1224, width: 127, height: 125 }
    }
  }
});

const ESTADO = {
  tipo: CERTIFICADOS.BATISMO,
  configuracoes: {},
  certificadoAtual: null,
  observador: null
};

const $ = (seletor, raiz = document) => raiz.querySelector(seletor);

document.addEventListener("DOMContentLoaded", iniciarCertificadoDigital);

function obterApiCertificados() {
  const api = window.VR_API;

  if (!api || typeof api.enviar !== "function") {
    throw new Error(
      "O módulo da API não foi carregado corretamente."
    );
  }

  return api;
}
async function iniciarCertificadoDigital() {
  configurarEscala();
  exibirAcoes(false);

  $("#btnBaixar")?.addEventListener(
    "click",
    baixarCertificadoPDF
  );

  $("#btnCompartilhar")?.addEventListener(
    "click",
    compartilharCertificado
  );

  $("#botaoImprimirCertificado")?.addEventListener(
    "click",
    imprimirCertificado
  );

  window.addEventListener(
    "afterprint",
    atualizarEscalaImediata
  );

  const parametros = new URLSearchParams(
    window.location.search
  );

  const token = String(
    parametros.get("token") || ""
  ).trim();

  if (!token) {
    mostrarMensagem(
      "O endereço deste certificado é inválido.",
      "error"
    );

    return;
  }

  await carregarCertificadoDigital(token);
}
async function carregarCertificadoDigital(token) {
  exibirAcoes(false);
  mostrarMensagem("Carregando certificado...", "info");

  try {
renderizarCertificado(certificado);
mostrarMensagem("", "success");
exibirAcoes(true);
  try {
    const resposta = await obterApiCertificados().enviar(
  "obterCertificadoPublico",
  {
    token
  }
);

    const certificado = resposta?.certificado || null;

    if (!certificado) {
      mostrarMensagem("Certificado não encontrado.", "error");
      return;
    }
if (!certificado) {
  exibirAcoes(false);

  mostrarMensagem(
    "Certificado não encontrado.",
    "error"
  );

  return;
}
    certificado.tipo = normalizarTipoCertificado(certificado.tipo);

    ESTADO.tipo = certificado.tipo;
    ESTADO.certificadoAtual = certificado;
    ESTADO.configuracoes = resposta?.configuracoes || {};

    renderizarCertificado(certificado);
    mostrarMensagem("", "success");
  } catch (erro) {
  console.error(
    "Erro ao carregar certificado digital:",
    erro
  );

  exibirAcoes(false);

  mostrarMensagem(
    erro?.message ||
      "Não foi possível carregar o certificado.",
    "error"
  );
}

function normalizarTipoCertificado(tipo) {
  const valor = normalizar(tipo);

  if (valor === "consagracao") {
    return CERTIFICADOS.CONSAGRACAO;
  }

  return CERTIFICADOS.BATISMO;
}

function configurarEscala() {
  const folha = $("#previewCertificado");

  if (!folha || typeof ResizeObserver !== "function") {
    return;
  }

  ESTADO.observador?.disconnect();
  ESTADO.observador = new ResizeObserver(atualizarEscalaImediata);
  ESTADO.observador.observe(folha);
}

function atualizarEscalaImediata() {
  const folha = $("#previewCertificado");
  const render = folha ? $(".certificado-render", folha) : null;

  if (!folha || !render) {
    return;
  }

  render.style.setProperty(
    "--escala-certificado",
    String(folha.clientWidth / 1492)
  );
}

function modeloAtual() {
  return MODELOS_CERTIFICADO[ESTADO.tipo] || null;
}

function renderizarCertificado(dados) {
  const modelo = MODELOS_CERTIFICADO[dados.tipo] || modeloAtual();
  const alvo = $("#previewCertificado");

  if (!modelo || !alvo) {
    mostrarMensagem(
      "Não foi possível preparar a visualização do certificado.",
      "error"
    );
    return;
  }

  const valores = montarValores(dados);
  const campos = [];

  Object.entries(modelo.campos).forEach(([nome, posicao]) => {
    if (nome === "cargo" && !valores.cargo) {
      return;
    }

    campos.push(montarCampo(nome, valores[nome], posicao, valores));
  });

  alvo.innerHTML = `
    <article class="certificado-render certificado-${modelo.aba}">
      <img
        class="certificado-arte"
        src="${modelo.imagem}"
        alt="${
          modelo.aba === "consagracao"
            ? "Certificado de Consagração"
            : "Certificado de Batismo"
        }"
      >
      ${campos.join("")}
    </article>
  `;

  requestAnimationFrame(() => {
    atualizarEscalaImediata();
    gerarQr(dados);
  });
}

function montarValores(dados) {
  const data = separarData(dados.dataCerimonia || dados.data);
  const nome = String(dados.nome || "NOME COMPLETO").trim();
  const cargo = String(dados.cargo || "").trim();

  return {
    nome,
    classeNome:
      nome.length > 42
        ? "nome-muito-longo"
        : nome.length > 24
          ? "nome-longo"
          : "",
    cargo,
    classeCargo: cargo.length > 9 ? "cargo-longo" : "",
    cidade:
      obterCidade(dados.local) ||
      ESTADO.configuracoes.cidadeIgreja ||
      "",
    dia: data.dia,
    mes: data.mes,
    ano: data.ano,
    assinatura:
      "assets/assinaturas/assinatura-pastor-presidente.png",
    registro: dados.numero || "",
    qr: ""
  };
}

function montarCampo(nome, valor, posicao, valores) {
  const estilo = [
    `top:${posicao.top}px`,
    `left:${posicao.left}px`,
    `width:${posicao.width}px`,
    `height:${posicao.height}px`
  ].join(";");

  if (nome === "assinatura") {
    return `
      <div
        class="certificado-valor"
        data-campo="assinatura"
        style="${estilo}"
      >
        <img src="${esc(valor)}" alt="Assinatura do Pastor Presidente">
      </div>
    `;
  }

  if (nome === "qr") {
    return `
      <div
        id="qrCertificadoAtual"
        class="certificado-valor"
        data-campo="qr"
        style="${estilo}"
        aria-label="QR Code do certificado digital"
      ></div>
    `;
  }

  const classes = [
    nome === "nome" ? valores.classeNome : "",
    nome === "cargo" ? valores.classeCargo : ""
  ]
    .filter(Boolean)
    .join(" ");

  return `
    <div
      class="certificado-valor ${classes}"
      data-campo="${nome}"
      style="${estilo}"
    >
      ${esc(valor)}
    </div>
  `;
}

function gerarQr(dados) {
  const alvo = $("#qrCertificadoAtual");

  if (!alvo) {
    return;
  }

  alvo.innerHTML = "";

  const token = String(
    dados.tokenPublico ||
    dados.token ||
    ""
  ).trim();

  if (!token) {
    alvo.hidden = true;
    return;
  }

  alvo.hidden = false;

  if (typeof QRCode !== "function") {
    alvo.textContent = "QR";
    return;
  }

  const url = new URL(
    "certificado-digital.html",
    window.location.href
  );

  url.searchParams.set("token", token);

  new QRCode(alvo, {
    text: url.href,
    width: Math.max(96, alvo.clientWidth - 8),
    height: Math.max(96, alvo.clientHeight - 8),
    colorDark: "#071f3b",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M
  });
}

function separarData(valor) {
  if (!valor) {
    return { dia: "", mes: "", ano: "" };
  }

  const texto = String(valor).includes("T")
    ? String(valor).split("T")[0]
    : String(valor);

  const partes = texto.split("-");

  if (partes.length !== 3) {
    return { dia: "", mes: "", ano: "" };
  }

  const data = new Date(
    Number(partes[0]),
    Number(partes[1]) - 1,
    Number(partes[2])
  );

  if (Number.isNaN(data.getTime())) {
    return { dia: "", mes: "", ano: "" };
  }

  return {
    dia: String(data.getDate()).padStart(2, "0"),
    mes: new Intl.DateTimeFormat("pt-BR", { month: "long" })
      .format(data)
      .toUpperCase(),
    ano: String(data.getFullYear())
  };
}

function obterCidade(valor) {
  return String(valor || "").split("-")[0].trim();
}
function exibirAcoes(exibir) {
  const acoes = $("#acoesCertificado");

  if (!acoes) {
    return;
  }

  acoes.hidden = !exibir;
}

function obterCertificadoRenderizado() {
  const render = $(".certificado-render");

  if (!render) {
    mostrarMensagem(
      "O certificado ainda não foi carregado.",
      "error"
    );

    return null;
  }

  return render;
}

function nomeArquivoCertificado(extensao) {
  const nome = String(
    ESTADO.certificadoAtual?.nome ||
      "certificado-digital"
  )
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${nome || "certificado-digital"}.${extensao}`;
}

async function gerarImagemCertificado() {
  const render = obterCertificadoRenderizado();

  if (!render) {
    return null;
  }

  if (typeof html2canvas !== "function") {
    throw new Error(
      "O recurso de geração da imagem não foi carregado."
    );
  }

  const transformAnterior = render.style.transform;
  const leftAnterior = render.style.left;

  try {
    render.style.transform = "none";
    render.style.left = "0";

    return await html2canvas(render, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false
    });
  } finally {
    render.style.transform = transformAnterior;
    render.style.left = leftAnterior;

    atualizarEscalaImediata();
  }
}

async function baixarCertificadoPDF() {
  const botao = $("#btnBaixar");

  try {
    if (botao) {
      botao.disabled = true;
      botao.textContent = "Gerando PDF...";
    }

    const canvas = await gerarImagemCertificado();

    if (!canvas) {
      return;
    }

    const jsPDF = window.jspdf?.jsPDF;

    if (typeof jsPDF !== "function") {
      throw new Error(
        "O recurso de geração do PDF não foi carregado."
      );
    }

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    const larguraPagina = pdf.internal.pageSize.getWidth();
    const alturaPagina = pdf.internal.pageSize.getHeight();

    const proporcao = Math.min(
      larguraPagina / canvas.width,
      alturaPagina / canvas.height
    );

    const larguraImagem = canvas.width * proporcao;
    const alturaImagem = canvas.height * proporcao;

    const posicaoX =
      (larguraPagina - larguraImagem) / 2;

    const posicaoY =
      (alturaPagina - alturaImagem) / 2;

    pdf.addImage(
      canvas.toDataURL("image/png"),
      "PNG",
      posicaoX,
      posicaoY,
      larguraImagem,
      alturaImagem
    );

    pdf.save(nomeArquivoCertificado("pdf"));
  } catch (erro) {
    console.error(
      "Erro ao gerar PDF:",
      erro
    );

    mostrarMensagem(
      erro?.message ||
        "Não foi possível gerar o PDF.",
      "error"
    );
  } finally {
    if (botao) {
      botao.disabled = false;
      botao.textContent = "Baixar PDF";
    }
  }
}

async function compartilharCertificado() {
  const botao = $("#btnCompartilhar");

  try {
    if (botao) {
      botao.disabled = true;
      botao.textContent = "Preparando...";
    }

    const canvas = await gerarImagemCertificado();

    if (!canvas) {
      return;
    }

    const blob = await new Promise((resolver) => {
      canvas.toBlob(
        resolver,
        "image/png",
        1
      );
    });

    if (!blob) {
      throw new Error(
        "Não foi possível preparar o certificado."
      );
    }

    const arquivo = new File(
      [blob],
      nomeArquivoCertificado("png"),
      {
        type: "image/png"
      }
    );

    const dadosCompartilhamento = {
      title: "Certificado Digital",
      text:
        "Certificado digital da Igreja Assembleia de Deus Vidas Renovadas.",
      url: window.location.href
    };

    if (
      navigator.share &&
      navigator.canShare?.({
        files: [arquivo]
      })
    ) {
      await navigator.share({
        ...dadosCompartilhamento,
        files: [arquivo]
      });

      return;
    }

    if (navigator.share) {
      await navigator.share(
        dadosCompartilhamento
      );

      return;
    }

    await navigator.clipboard.writeText(
      window.location.href
    );

    mostrarMensagem(
      "Link do certificado copiado.",
      "success"
    );

    window.setTimeout(() => {
      mostrarMensagem("", "success");
    }, 2500);
  } catch (erro) {
    if (erro?.name === "AbortError") {
      return;
    }

    console.error(
      "Erro ao compartilhar certificado:",
      erro
    );

    mostrarMensagem(
      "Não foi possível compartilhar o certificado.",
      "error"
    );
  } finally {
    if (botao) {
      botao.disabled = false;
      botao.textContent = "Compartilhar";
    }
  }
}
function imprimirCertificado() {
  if (!$("#previewCertificado")?.innerHTML.trim()) {
    mostrarMensagem(
      "O certificado ainda não foi carregado.",
      "error"
    );
    return;
  }

  window.print();
}

function mostrarMensagem(texto, tipo) {
  const elemento =
    $("#mensagemCertificadoDigital") ||
    $("#mensagemModulo");

  if (!elemento) {
    return;
  }

  if (!texto) {
    elemento.hidden = true;
    elemento.textContent = "";
    elemento.dataset.tipo = "";
    return;
  }

  elemento.hidden = false;
  elemento.textContent = texto;
  elemento.dataset.tipo = tipo;
}

function normalizar(valor) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function esc(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
