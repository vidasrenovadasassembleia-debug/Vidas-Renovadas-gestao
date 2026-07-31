"use strict";

/* ==========================================================================
   CERTIFICADO DIGITAL PÚBLICO
   Consulta, renderização, impressão, compartilhamento e PDF.
   ========================================================================== */

const LARGURA_CERTIFICADO = 1492;
const ALTURA_CERTIFICADO = 1055;

const MODELOS_CERTIFICADO = Object.freeze({
  BATISMO: {
    aba: "batismo",
    formulario: "#formBatismo",
    pesquisa: "#pesquisaMembroBatismo",
    botaoPesquisa: "#botaoPesquisarMembroBatismo",
    resultados: "#resultadosMembrosBatismo",
    imagem: "assets/certificados/certificado-batismo-base.png",
    campos: {
      nome: { top: 394, left: 235, width: 900, height: 86 },
     cidade: { top: 773, left: 410, width: 327, height: 32 },
     dia:    { top: 773, left: 786, width: 58,  height: 32 },
     mes:    { top: 773, left: 880, width: 195, height: 32 },
     ano:    { top: 773, left: 1110, width: 84, height: 32 },
      assinatura: { top: 803, left: 490, width: 500, height: 96 },
      registro: { top: 931, left: 350, width: 255, height: 32 },
      qr: { top: 622, left: 1273, width: 143, height: 147 }
    }
  },

  CONSAGRACAO: {
    aba: "consagracao",
    formulario: "#formConsagracao",
    pesquisa: "#pesquisaMembro",
    botaoPesquisa: "#botaoPesquisarMembro",
    resultados: "#resultadosMembros",
    imagem: "assets/certificados/certificado-consagracao-base.png",
    campos: {
      nome: { top: 402, left: 235, width: 900, height: 82 },
      cargo: { top: 500, left: 395, width: 700, height: 58 },
      cidade: { top: 830, left: 468, width: 261, height: 32 },
      dia:    { top: 830, left: 779, width: 70,  height: 32 },
      mes:    { top: 830, left: 887, width: 133, height: 32 },
      ano:    { top: 830, left: 1058, width: 78, height: 32 },
      assinatura: { top: 884, left: 505, width: 430, height: 85 },
      registro: { top: 934, left: 350, width: 255, height: 32 },
      qr: { top: 865, left: 1224, width: 127, height: 125 }
    }
  }
});

const ESTADO_CERTIFICADO_DIGITAL = {
  certificado: null,
  modelo: null,
  gerandoArquivo: false
};

const $ = (seletor, raiz = document) =>
  raiz.querySelector(seletor);

document.addEventListener(
  "DOMContentLoaded",
  iniciarCertificadoDigital
);

window.addEventListener(
  "resize",
  atualizarEscalaCertificado
);

/* ==========================================================================
   INICIALIZAÇÃO
   ========================================================================== */

async function iniciarCertificadoDigital() {
  configurarBotoes();

  const token = obterTokenPublico();

  if (!token) {
    mostrarErro(
      "O endereço deste certificado está incompleto. O código de acesso não foi informado."
    );
    return;
  }

  mostrarMensagem(
    "Carregando certificado digital...",
    "carregando"
  );

  try {
    const resposta = await consultarCertificado(token);
    const certificado = normalizarCertificado(resposta);

    validarDadosCertificado(certificado);

    ESTADO_CERTIFICADO_DIGITAL.certificado = certificado;
    ESTADO_CERTIFICADO_DIGITAL.modelo =
      obterModeloCertificado(certificado.tipo);

    renderizarCertificado(certificado);
  } catch (erro) {
    console.error(
      "Erro ao carregar certificado digital:",
      erro
    );

    mostrarErro(
      erro?.message ||
      "Não foi possível localizar este certificado."
    );
  }
}

function configurarBotoes() {
  $("#btnBaixar")?.addEventListener(
    "click",
    baixarCertificadoPdf
  );

  $("#btnCompartilhar")?.addEventListener(
    "click",
    compartilharCertificado
  );

  $("#btnImprimir")?.addEventListener(
    "click",
    imprimirCertificado
  );
}

function obterTokenPublico() {
  const parametros = new URLSearchParams(
    window.location.search
  );

  return String(
    parametros.get("token") || ""
  ).trim();
}

/* ==========================================================================
   CONSULTA PÚBLICA
   ========================================================================== */

async function consultarCertificado(token) {
  if (!window.VR_API?.enviar) {
    throw new Error(
      "O serviço de consulta não foi carregado corretamente."
    );
  }

  return window.VR_API.enviar(
    "validarCertificado",
    { token }
  );
}

function normalizarCertificado(resposta) {
  const origem =
    resposta?.certificado ||
    resposta?.dados ||
    resposta;

  return {
    numero: String(
      origem?.numero ||
      origem?.numeroCertificado ||
      ""
    ).trim(),

    tipo: normalizarTipoCertificado(
      origem?.tipo ||
      origem?.tipoCertificado
    ),

    nome: String(
      origem?.nome ||
      origem?.nomeCompleto ||
      ""
    ).trim(),

    cargo: String(
      origem?.cargo || ""
    ).trim(),

    dataCerimonia: normalizarDataIso(
      origem?.dataCerimonia ||
      origem?.data ||
      ""
    ),

    local: String(
      origem?.local ||
      origem?.cidade ||
      ""
    ).trim(),

    congregacao: String(
      origem?.congregacao || ""
    ).trim(),

    pastor: String(
      origem?.pastor ||
      origem?.pastorPresidente ||
      ""
    ).trim(),

    tokenPublico: String(
      origem?.tokenPublico ||
      origem?.token ||
      obterTokenPublico()
    ).trim()
  };
}

function validarDadosCertificado(certificado) {
  if (!certificado) {
    throw new Error(
      "Certificado não encontrado."
    );
  }

  if (!certificado.tipo) {
    throw new Error(
      "O tipo deste certificado não foi reconhecido."
    );
  }

  if (!certificado.nome) {
    throw new Error(
      "Os dados deste certificado estão incompletos."
    );
  }

  if (
    certificado.tipo === "CONSAGRACAO" &&
    !certificado.cargo
  ) {
    throw new Error(
      "O cargo de consagração não foi informado."
    );
  }
}

function normalizarTipoCertificado(valor) {
  const tipo = removerAcentos(valor)
    .toUpperCase()
    .trim();

  if (tipo.includes("CONSAGR")) {
    return "CONSAGRACAO";
  }

  if (tipo.includes("BATISMO")) {
    return "BATISMO";
  }

  return "";
}

function obterModeloCertificado(tipo) {
  const modelo =
    MODELOS_CERTIFICADO_DIGITAL[tipo];

  if (!modelo) {
    throw new Error(
      "Não existe um modelo configurado para este certificado."
    );
  }

  return modelo;
}

/* ==========================================================================
   RENDERIZAÇÃO
   ========================================================================== */

function renderizarCertificado(certificado) {
  const modelo =
    obterModeloCertificado(certificado.tipo);

  const alvo = $("#certificado");

  if (!alvo) {
    throw new Error(
      "A área do certificado não foi encontrada na página."
    );
  }

  const valores = montarValores(certificado);
  const campos = [];

  Object.entries(modelo.campos).forEach(
    ([nome, posicao]) => {
      if (
        nome === "cargo" &&
        !valores.cargo
      ) {
        return;
      }

      campos.push(
        montarCampoCertificado(
          nome,
          valores[nome],
          posicao,
          valores
        )
      );
    }
  );

  alvo.innerHTML = `
    <article
      id="certificadoRenderizado"
      class="certificado-render certificado-${modelo.classe}"
      aria-label="${escAtributo(modelo.titulo)}"
    >
      <img
        id="arteCertificadoDigital"
        class="certificado-arte"
        src="${escAtributo(modelo.imagem)}"
        alt="${escAtributo(modelo.titulo)}"
      >

      ${campos.join("")}
    </article>
  `;

  const imagem = $("#arteCertificadoDigital");

  const concluirRenderizacao = () => {
    gerarQrCertificado(certificado);
    atualizarEscalaCertificado();
    mostrarCertificado();
  };

  if (imagem?.complete) {
    concluirRenderizacao();
    return;
  }

  imagem?.addEventListener(
    "load",
    concluirRenderizacao,
    { once: true }
  );

  imagem?.addEventListener(
    "error",
    () => {
      mostrarErro(
        "Não foi possível carregar a imagem do certificado."
      );
    },
    { once: true }
  );
}

function montarValores(dados) {
  const data = separarData(
    dados.dataCerimonia
  );

  const nome =
    dados.nome ||
    "NOME COMPLETO";

  const cargo =
    dados.cargo || "";

  return {
    nome,

    classeNome:
      nome.length > 42
        ? "nome-muito-longo"
        : nome.length > 24
          ? "nome-longo"
          : "",

    cargo,

    classeCargo:
      cargo.length > 9
        ? "cargo-longo"
        : "",

    cidade: obterCidade(
      dados.local
    ),

    dia: data.dia,
    mes: data.mes,
    ano: data.ano,

    assinatura:
      "assets/assinaturas/assinatura-pastor-presidente.png",

    registro:
      dados.numero || "",

    qr: ""
  };
}

function montarCampoCertificado(
  nome,
  valor,
  posicao,
  valores
) {
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
        <img
          src="${escAtributo(valor)}"
          alt="Assinatura do Pastor Presidente"
        >
      </div>
    `;
  }

  if (nome === "qr") {
    return `
      <div
        id="qrCertificadoDigital"
        class="certificado-valor"
        data-campo="qr"
        style="${estilo}"
        aria-label="QR Code para baixar o certificado digital"
      ></div>
    `;
  }

  const classes = [
    nome === "nome"
      ? valores.classeNome
      : "",

    nome === "cargo"
      ? valores.classeCargo
      : ""
  ]
    .filter(Boolean)
    .join(" ");

  return `
    <div
      class="certificado-valor ${classes}"
      data-campo="${escAtributo(nome)}"
      style="${estilo}"
    >
      ${escHtml(valor)}
    </div>
  `;
}

function gerarQrCertificado(certificado) {
  const alvo =
    $("#qrCertificadoDigital");

  if (!alvo) {
    return;
  }

  alvo.innerHTML = "";

  if (typeof window.QRCode !== "function") {
    alvo.textContent = "QR";
    return;
  }

  const url = new URL(
    "certificado-digital.html",
    window.location.href
  );

  url.searchParams.set(
    "token",
    certificado.tokenPublico
  );

  new window.QRCode(alvo, {
    text: url.href,
    width: Math.max(
      96,
      alvo.clientWidth - 8
    ),
    height: Math.max(
      96,
      alvo.clientHeight - 8
    ),
    colorDark: "#071f3b",
    colorLight: "#ffffff",
    correctLevel:
      window.QRCode.CorrectLevel.M
  });
}

function atualizarEscalaCertificado() {
  const area = $("#certificado");
  const certificado =
    $("#certificadoRenderizado");

  if (!area || !certificado) {
    return;
  }

  const larguraDisponivel =
    area.clientWidth;

  if (!larguraDisponivel) {
    return;
  }

  const escala = Math.min(
    1,
    larguraDisponivel /
      LARGURA_CERTIFICADO
  );

  certificado.style.setProperty(
    "--escala-certificado",
    String(escala)
  );

  area.style.height =
    `${ALTURA_CERTIFICADO * escala}px`;
}

function mostrarCertificado() {
  const mensagem = $("#mensagem");
  const certificado = $("#certificado");
  const acoes = $("#acoesCertificado");

  if (mensagem) {
    mensagem.hidden = true;
  }

  if (certificado) {
    certificado.hidden = false;
  }

  if (acoes) {
    acoes.hidden = false;
  }

  atualizarEscalaCertificado();
}

/* ==========================================================================
   PDF
   ========================================================================== */

async function baixarCertificadoPdf() {
  if (
    ESTADO_CERTIFICADO_DIGITAL.gerandoArquivo
  ) {
    return;
  }

  ESTADO_CERTIFICADO_DIGITAL.gerandoArquivo =
    true;

  alterarEstadoBotao(
    "#btnBaixar",
    true,
    "Gerando PDF..."
  );

  try {
    const canvas =
      await criarCanvasCertificado();

    const jsPDF =
      window.jspdf?.jsPDF;

    if (!jsPDF) {
      throw new Error(
        "O gerador de PDF não foi carregado."
      );
    }

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
      compress: true
    });

    const larguraPagina =
      pdf.internal.pageSize.getWidth();

    const alturaPagina =
      pdf.internal.pageSize.getHeight();

    const proporcaoCanvas =
      canvas.width / canvas.height;

    const proporcaoPagina =
      larguraPagina / alturaPagina;

    let larguraImagem;
    let alturaImagem;
    let posicaoX;
    let posicaoY;

    if (
      proporcaoCanvas >
      proporcaoPagina
    ) {
      larguraImagem = larguraPagina;
      alturaImagem =
        larguraPagina / proporcaoCanvas;
      posicaoX = 0;
      posicaoY =
        (alturaPagina - alturaImagem) / 2;
    } else {
      alturaImagem = alturaPagina;
      larguraImagem =
        alturaPagina * proporcaoCanvas;
      posicaoX =
        (larguraPagina - larguraImagem) / 2;
      posicaoY = 0;
    }

    pdf.addImage(
      canvas.toDataURL(
        "image/jpeg",
        0.98
      ),
      "JPEG",
      posicaoX,
      posicaoY,
      larguraImagem,
      alturaImagem,
      undefined,
      "FAST"
    );

    pdf.save(
      montarNomeArquivo(".pdf")
    );
  } catch (erro) {
    console.error(
      "Erro ao gerar PDF:",
      erro
    );

    alert(
      erro?.message ||
      "Não foi possível gerar o PDF."
    );
  } finally {
    ESTADO_CERTIFICADO_DIGITAL.gerandoArquivo =
      false;

    alterarEstadoBotao(
      "#btnBaixar",
      false,
      "Baixar PDF"
    );
  }
}

/* ==========================================================================
   COMPARTILHAMENTO
   ========================================================================== */

async function compartilharCertificado() {
  alterarEstadoBotao(
    "#btnCompartilhar",
    true,
    "Preparando..."
  );

  try {
    const canvas =
      await criarCanvasCertificado();

    const arquivo =
      await criarArquivoImagem(canvas);

    const dadosCompartilhamento = {
      title:
        ESTADO_CERTIFICADO_DIGITAL
          .modelo?.titulo ||
        "Certificado Digital",

      text:
        "Acesse o certificado digital emitido pela Igreja Assembleia de Deus Vidas Renovadas.",

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

    await copiarLinkCertificado();

    alert(
      "O link do certificado foi copiado."
    );
  } catch (erro) {
    if (erro?.name === "AbortError") {
      return;
    }

    console.error(
      "Erro ao compartilhar:",
      erro
    );

    try {
      await copiarLinkCertificado();

      alert(
        "Não foi possível abrir o compartilhamento. O link foi copiado."
      );
    } catch (_) {
      alert(
        "Não foi possível compartilhar o certificado."
      );
    }
  } finally {
    alterarEstadoBotao(
      "#btnCompartilhar",
      false,
      "Compartilhar"
    );
  }
}

async function criarArquivoImagem(canvas) {
  const blob = await canvasParaBlob(
    canvas,
    "image/png",
    1
  );

  return new File(
    [blob],
    montarNomeArquivo(".png"),
    {
      type: "image/png"
    }
  );
}

async function copiarLinkCertificado() {
  if (!navigator.clipboard?.writeText) {
    throw new Error(
      "A área de transferência não está disponível."
    );
  }

  await navigator.clipboard.writeText(
    window.location.href
  );
}

/* ==========================================================================
   IMPRESSÃO
   ========================================================================== */

function imprimirCertificado() {
  const certificado =
    $("#certificadoRenderizado");

  if (!certificado) {
    alert(
      "O certificado ainda não foi carregado."
    );
    return;
  }

  window.print();
}

/* ==========================================================================
   GERAÇÃO DE IMAGEM
   ========================================================================== */

async function criarCanvasCertificado() {
  const certificado =
    $("#certificadoRenderizado");

  if (!certificado) {
    throw new Error(
      "O certificado ainda não foi carregado."
    );
  }

  if (
    typeof window.html2canvas !==
    "function"
  ) {
    throw new Error(
      "O gerador de imagem não foi carregado."
    );
  }

  await aguardarImagens(
    certificado
  );

  return window.html2canvas(
    certificado,
    {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,

      width:
        LARGURA_CERTIFICADO,

      height:
        ALTURA_CERTIFICADO,

      windowWidth:
        LARGURA_CERTIFICADO,

      windowHeight:
        ALTURA_CERTIFICADO,

      onclone(documentoClonado) {
        const clonado =
          documentoClonado.querySelector(
            "#certificadoRenderizado"
          );

        if (!clonado) {
          return;
        }

        clonado.style.setProperty(
          "--escala-certificado",
          "1"
        );

        clonado.style.transform =
          "none";

        clonado.style.position =
          "relative";

        clonado.style.width =
          `${LARGURA_CERTIFICADO}px`;

        clonado.style.height =
          `${ALTURA_CERTIFICADO}px`;
      }
    }
  );
}

async function aguardarImagens(raiz) {
  const imagens = Array.from(
    raiz.querySelectorAll("img")
  );

  await Promise.all(
    imagens.map((imagem) => {
      if (imagem.complete) {
        return Promise.resolve();
      }

      return new Promise(
        (resolver, rejeitar) => {
          imagem.addEventListener(
            "load",
            resolver,
            { once: true }
          );

          imagem.addEventListener(
            "error",
            () => {
              rejeitar(
                new Error(
                  "Não foi possível carregar uma imagem do certificado."
                )
              );
            },
            { once: true }
          );
        }
      );
    })
  );
}

function canvasParaBlob(
  canvas,
  tipo,
  qualidade
) {
  return new Promise(
    (resolver, rejeitar) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolver(blob);
            return;
          }

          rejeitar(
            new Error(
              "Não foi possível preparar o arquivo."
            )
          );
        },
        tipo,
        qualidade
      );
    }
  );
}

/* ==========================================================================
   MENSAGENS
   ========================================================================== */

function mostrarMensagem(texto, tipo) {
  const mensagem = $("#mensagem");
  const certificado = $("#certificado");
  const acoes = $("#acoesCertificado");

  if (certificado) {
    certificado.hidden = true;
  }

  if (acoes) {
    acoes.hidden = true;
  }

  if (!mensagem) {
    return;
  }

  mensagem.hidden = false;
  mensagem.textContent = texto;
  mensagem.dataset.tipo = tipo;
}

function mostrarErro(texto) {
  mostrarMensagem(
    texto,
    "erro"
  );
}

function alterarEstadoBotao(
  seletor,
  desabilitado,
  texto
) {
  const botao = $(seletor);

  if (!botao) {
    return;
  }

  botao.disabled = desabilitado;
  botao.textContent = texto;
}

/* ==========================================================================
   UTILITÁRIOS
   ========================================================================== */

function separarData(valor) {
  const texto =
    normalizarDataIso(valor);

  if (!texto) {
    return {
      dia: "",
      mes: "",
      ano: ""
    };
  }

  const partes = texto.split("-");

  if (partes.length !== 3) {
    return {
      dia: "",
      mes: "",
      ano: ""
    };
  }

  const data = new Date(
    Number(partes[0]),
    Number(partes[1]) - 1,
    Number(partes[2])
  );

  if (
    Number.isNaN(data.getTime())
  ) {
    return {
      dia: "",
      mes: "",
      ano: ""
    };
  }

  return {
    dia: String(
      data.getDate()
    ).padStart(2, "0"),

    mes:
      new Intl.DateTimeFormat(
        "pt-BR",
        { month: "long" }
      )
        .format(data)
        .toUpperCase(),

    ano: String(
      data.getFullYear()
    )
  };
}

function normalizarDataIso(valor) {
  if (!valor) {
    return "";
  }

  const texto =
    String(valor).trim();

  const correspondenciaIso =
    texto.match(
      /^(\d{4})-(\d{2})-(\d{2})/
    );

  if (correspondenciaIso) {
    return [
      correspondenciaIso[1],
      correspondenciaIso[2],
      correspondenciaIso[3]
    ].join("-");
  }

  const correspondenciaBr =
    texto.match(
      /^(\d{2})\/(\d{2})\/(\d{4})$/
    );

  if (correspondenciaBr) {
    return [
      correspondenciaBr[3],
      correspondenciaBr[2],
      correspondenciaBr[1]
    ].join("-");
  }

  return texto;
}

function obterCidade(valor) {
  return String(
    valor || ""
  )
    .split("-")[0]
    .trim();
}

function montarNomeArquivo(extensao) {
  const certificado =
    ESTADO_CERTIFICADO_DIGITAL
      .certificado;

  const tipo =
    certificado?.tipo ===
    "CONSAGRACAO"
      ? "consagracao"
      : "batismo";

  const nome =
    removerAcentos(
      certificado?.nome ||
      "certificado"
    )
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );

  const numero =
    String(
      certificado?.numero || ""
    )
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );

  return [
    "certificado",
    tipo,
    nome,
    numero
  ]
    .filter(Boolean)
    .join("-") +
    extensao;
}

function removerAcentos(valor) {
  return String(
    valor || ""
  )
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    );
}

function escHtml(valor) {
  return String(
    valor ?? ""
  )
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escAtributo(valor) {
  return escHtml(valor);
}
