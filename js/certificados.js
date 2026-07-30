"use strict";

/* ==========================================================================
   CERTIFICADOS V4.0 — RENDERIZADOR ÚNICO
   Batismo e Consagração utilizam a mesma Central e o mesmo renderizador.
   ========================================================================== */

const CERTIFICADOS = Object.freeze({
  BATISMO: "BATISMO",
  CONSAGRACAO: "CONSAGRACAO",
  HISTORICO: "HISTORICO"
});

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
      cidade: { top: 735, left: 385, width: 330, height: 32 },
      dia: { top: 735, left: 744, width: 65, height: 32 },
      mes: { top: 735, left: 838, width: 215, height: 32 },
      ano: { top: 735, left: 1080, width: 92, height: 32 },
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
      cargo: { top: 505, left: 548, width: 360, height: 38 },
      cidade: { top: 738, left: 385, width: 330, height: 32 },
      dia: { top: 738, left: 744, width: 65, height: 32 },
      mes: { top: 738, left: 838, width: 215, height: 32 },
      ano: { top: 738, left: 1080, width: 92, height: 32 },
      assinatura: { top: 806, left: 490, width: 500, height: 96 },
      registro: { top: 934, left: 350, width: 255, height: 32 },
      qr: { top: 865, left: 1224, width: 127, height: 125 }
    }
  }
});

const ESTADO = {
  tipo: CERTIFICADOS.BATISMO,
  configuracoes: {},
  cargos: [],
  historico: [],
  certificadoAtual: null,
  observador: null
};

const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
const $$ = (seletor, raiz = document) =>
  Array.from(raiz.querySelectorAll(seletor));

document.addEventListener("DOMContentLoaded", iniciarCertificados);

function obterApiCertificados() {
  const api = window.VRGAuth || window.Auth;

  if (!api || typeof api.chamarApi !== "function") {
    throw new Error(
      "O módulo de autenticação/API não foi carregado corretamente."
    );
  }

  return api;
}

async function iniciarCertificados() {
  const sessao =
    typeof obterSessao === "function"
      ? obterSessao()
      : null;

  if (!sessao || !sessao.credential) {
    window.location.replace("index.html");
    return;
  }

  if (typeof aplicarIdentidadeUsuario === "function") {
    aplicarIdentidadeUsuario();
  }

  configurarEventos();
  configurarEscala();
  await carregarDados();
  abrirAba("batismo");
}

function configurarEventos() {
  $$(".aba-certificado").forEach((botao) => {
    botao.addEventListener("click", () => abrirAba(botao.dataset.aba));
  });

  Object.values(MODELOS_CERTIFICADO).forEach((modelo) => {
    configurarPesquisa(modelo);
    configurarFormulario(modelo);
  });

  $$("[data-visualizar]").forEach((botao) => {
    botao.addEventListener("click", () => {
      const tipo = tipoPorAba(botao.dataset.visualizar);

      if (tipo) {
        ESTADO.tipo = tipo;
        atualizarPreview();
      }
    });
  });

  $("#filtroHistorico")?.addEventListener("input", renderizarHistorico);
  window.addEventListener("afterprint", atualizarEscalaImediata);
}

function configurarPesquisa(modelo) {
  const campo = $(modelo.pesquisa);
  const botao = $(modelo.botaoPesquisa);

  botao?.addEventListener("click", () => pesquisarMembro(modelo));

  campo?.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") {
      evento.preventDefault();
      pesquisarMembro(modelo);
    }
  });
}

function configurarFormulario(modelo) {
  const formulario = $(modelo.formulario);

  if (!formulario) {
    return;
  }

  const atualizar = () => {
    const tipo = tipoPorAba(modelo.aba);

    if (ESTADO.tipo === tipo) {
      atualizarPreview();
    }
  };

  formulario.addEventListener("input", atualizar);
  formulario.addEventListener("change", atualizar);

  formulario.addEventListener("submit", (evento) => {
    emitirCertificado(evento, tipoPorAba(modelo.aba));
  });
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
  const render = $(".certificado-render", folha);

  if (!folha || !render) {
    return;
  }

  render.style.setProperty(
    "--escala-certificado",
    String(folha.clientWidth / 1492)
  );
}

async function carregarDados() {
  mostrarMensagem("Carregando módulo...", "info");

  try {
    const api = obterApiCertificados();

    const [dados, historico] = await Promise.all([
      api.chamarApi({ acao: "obterDadosCertificados" }),
      api.chamarApi({ acao: "listarCertificados" })
    ]);

    ESTADO.configuracoes = dados.configuracoes || {};
    ESTADO.cargos = Array.isArray(dados.cargos) ? dados.cargos : [];
    ESTADO.historico = Array.isArray(historico.certificados)
      ? historico.certificados
      : [];

    preencherCargos();
    preencherPadroes();
    renderizarHistorico();
    mostrarMensagem("Módulo carregado.", "success");

    setTimeout(() => {
      const mensagem = $("#mensagemModulo");
      if (mensagem?.dataset.tipo === "success") {
        mensagem.hidden = true;
      }
    }, 1400);
  } catch (erro) {
    mostrarMensagem(
      erro?.message || "Não foi possível carregar o módulo.",
      "error"
    );
  }
}

function preencherCargos() {
  const campo = $("#formConsagracao [name='cargo']");

  if (!campo) {
    return;
  }

  campo.innerHTML = '<option value="">Selecione</option>';

  ESTADO.cargos.forEach((item) => {
    const nome =
      typeof item === "string"
        ? item.trim()
        : String(
            item?.nome ||
            item?.cargo ||
            item?.descricao ||
            item?.titulo ||
            item?.label ||
            item?.value ||
            ""
          ).trim();

    if (!nome) {
      return;
    }

    const opcao = document.createElement("option");
    opcao.value = nome;
    opcao.textContent = nome;
    campo.appendChild(opcao);
  });
}

function preencherPadroes() {
  Object.values(MODELOS_CERTIFICADO).forEach((modelo) => {
    const formulario = $(modelo.formulario);

    if (!formulario) {
      return;
    }

    preencherSeVazio(
      formulario,
      "pastor",
      ESTADO.configuracoes.pastorPresidente ||
      ESTADO.configuracoes.pastorLocal ||
      "Rogério Lemos da Silva"
    );

    preencherSeVazio(
      formulario,
      "local",
      [
        ESTADO.configuracoes.cidadeIgreja,
        ESTADO.configuracoes.estadoIgreja
      ]
        .filter(Boolean)
        .join(" - ")
    );
  });
}

function preencherSeVazio(formulario, nome, valor) {
  const campo = formulario.elements.namedItem(nome);

  if (campo && !String(campo.value || "").trim()) {
    campo.value = valor || "";
  }
}

function abrirAba(aba) {
  const tipo = tipoPorAba(aba);

  if (!tipo) {
    return;
  }

  ESTADO.tipo = tipo;

  $$(".aba-certificado").forEach((botao) => {
    const ativa = botao.dataset.aba === aba;
    botao.classList.toggle("active", ativa);
    botao.setAttribute("aria-selected", String(ativa));
  });

  $$(".painel-certificado").forEach((painel) => {
    const ativo = painel.dataset.painel === aba;
    painel.classList.toggle("active", ativo);
    painel.hidden = !ativo;
  });

  const preview = $("#areaPreviewCertificado");

  if (preview) {
    preview.hidden = tipo === CERTIFICADOS.HISTORICO;
  }

  if (tipo === CERTIFICADOS.HISTORICO) {
    renderizarHistorico();
    return;
  }

  atualizarPreview();
}

function tipoPorAba(aba) {
  const valor = normalizar(aba);

  if (valor === "batismo") {
    return CERTIFICADOS.BATISMO;
  }

  if (valor === "consagracao") {
    return CERTIFICADOS.CONSAGRACAO;
  }

  if (valor === "historico") {
    return CERTIFICADOS.HISTORICO;
  }

  return "";
}

function modeloAtual() {
  return MODELOS_CERTIFICADO[ESTADO.tipo] || null;
}

async function pesquisarMembro(modelo) {
  const campo = $(modelo.pesquisa);
  const botao = $(modelo.botaoPesquisa);
  const termo = campo?.value.trim() || "";

  if (termo.length < 2) {
    mostrarMensagem("Digite pelo menos 2 caracteres.", "error");
    campo?.focus();
    return;
  }

  if (botao) {
    botao.disabled = true;
  }

  mostrarMensagem("Pesquisando membro...", "info");

  try {
    const resposta = await obterApiCertificados().chamarApi({
      acao: "pesquisarMembrosCertificado",
      termo
    });

    const membros = Array.isArray(resposta.membros)
      ? resposta.membros
      : [];

    mostrarResultados(membros, modelo);

    mostrarMensagem(
      membros.length
        ? `${membros.length} resultado(s) encontrado(s).`
        : "Nenhum membro encontrado.",
      membros.length ? "success" : "info"
    );
  } catch (erro) {
    mostrarMensagem(
      erro?.message || "Não foi possível pesquisar os membros.",
      "error"
    );
  } finally {
    if (botao) {
      botao.disabled = false;
    }
  }
}

function mostrarResultados(membros, modelo) {
  const area = $(modelo.resultados);

  if (!area) {
    return;
  }

  area.innerHTML = "";
  area.hidden = false;

  if (!membros.length) {
    area.innerHTML =
      '<div class="historico-vazio">Nenhum membro encontrado.</div>';
    return;
  }

  membros.forEach((membro) => {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "resultado-membro";

    const nome = membro.nomeCompleto || membro.nome || "Membro sem nome";
    const numero =
      membro.numeroCarteirinha ||
      membro.numero ||
      membro.codigo ||
      membro.id ||
      "";
    const congregacao =
      membro.congregacao ||
      membro.nomeCongregacao ||
      "Sem congregação";

    botao.innerHTML = `
      <span>
        <strong>${esc(nome)}</strong><br>
        ${esc(congregacao)}
      </span>
      <span>
        ${esc(numero)}<br>
        ${esc(membro.situacao || "")}
      </span>
    `;

    botao.addEventListener("click", () => selecionarMembro(membro, modelo));
    area.appendChild(botao);
  });
}

function selecionarMembro(membro, modelo) {
  const formulario = $(modelo.formulario);

  if (!formulario) {
    return;
  }

  const nome = membro.nomeCompleto || membro.nome || "";
  const codigo = membro.codigo || membro.id || membro.idMembro || "";
  const numero =
    membro.numeroCarteirinha || membro.numero || codigo || "";

  preencherCampo(formulario, "idMembro", codigo);
  preencherCampo(formulario, "codigoMembro", codigo);
  preencherCampo(formulario, "numeroCarteirinha", numero);
  preencherCampo(formulario, "nome", nome);
  preencherCampo(formulario, "sexo", membro.sexo || "");
  preencherCampo(formulario, "dataNascimento", membro.dataNascimento || "");
  preencherCampo(formulario, "nomePai", membro.nomePai || membro.pai || "");
  preencherCampo(formulario, "nomeMae", membro.nomeMae || membro.mae || "");
  preencherCampo(
    formulario,
    "congregacao",
    membro.congregacao || membro.nomeCongregacao || ""
  );

  const area = $(modelo.resultados);
  const pesquisa = $(modelo.pesquisa);

  if (area) {
    area.hidden = true;
  }

  if (pesquisa) {
    pesquisa.value = numero || nome;
  }

  ESTADO.tipo = tipoPorAba(modelo.aba);
  atualizarPreview();
  mostrarMensagem(`${nome} selecionado com sucesso.`, "success");
}

function preencherCampo(formulario, nome, valor) {
  const campo = formulario.elements.namedItem(nome);

  if (campo) {
    campo.value = valor ?? "";
  }
}

function dadosFormulario(formulario, tipo) {
  const dados = Object.fromEntries(new FormData(formulario).entries());
  dados.tipo = tipo;

  Object.keys(dados).forEach((chave) => {
    if (typeof dados[chave] === "string") {
      dados[chave] = dados[chave].trim();
    }
  });

  return dados;
}

async function emitirCertificado(evento, tipo) {
  evento.preventDefault();

  const formulario = evento.currentTarget;
  const botao = formulario.querySelector('button[type="submit"]');

  if (!formulario.reportValidity()) {
    return;
  }

  const idMembro =
    formulario.elements.namedItem("idMembro")?.value.trim() ||
    formulario.elements.namedItem("codigoMembro")?.value.trim() ||
    "";

  if (!idMembro) {
    mostrarMensagem(
      "Pesquise e selecione um membro antes de emitir.",
      "error"
    );
    return;
  }

  const dados = dadosFormulario(formulario, tipo);

  if (botao) {
    botao.disabled = true;
  }

  mostrarMensagem("Registrando certificado...", "info");

  try {
    const resposta = await obterApiCertificados().chamarApi({
      acao: "emitirCertificado",
      dados
    });

    const certificado = {
      ...dados,
      ...(resposta.certificado || {}),
      tipo,
      numero:
        resposta.certificado?.numero ||
        dados.numero ||
        ""
    };

    ESTADO.tipo = tipo;
    ESTADO.certificadoAtual = certificado;
    renderizarCertificado(certificado);

    mostrarMensagem(
      `${certificado.numero || "Certificado"} registrado com sucesso.`,
      "success"
    );

    await recarregarHistorico();
    setTimeout(imprimirCertificado, 350);
  } catch (erro) {
    mostrarMensagem(
      erro?.message || "Não foi possível registrar o certificado.",
      "error"
    );
  } finally {
    if (botao) {
      botao.disabled = false;
    }
  }
}

function atualizarPreview() {
  const modelo = modeloAtual();

  if (!modelo) {
    return;
  }

  const formulario = $(modelo.formulario);

  if (!formulario) {
    return;
  }

  renderizarCertificado(dadosFormulario(formulario, ESTADO.tipo));
}

function renderizarCertificado(dados) {
  const modelo = MODELOS_CERTIFICADO[dados.tipo] || modeloAtual();
  const alvo = $("#previewCertificado");

  if (!modelo || !alvo) {
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
  const data = separarData(dados.dataCerimonia);
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
    classeCargo: cargo.length > 20 ? "cargo-longo" : "",
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
      <div class="certificado-valor" data-campo="assinatura" style="${estilo}">
        <img src="${valor}" alt="Assinatura do Pastor Presidente">
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

  if (typeof QRCode !== "function") {
    alvo.textContent = "QR";
    return;
  }

  const url = new URL("certificado-digital.html", window.location.href);
  const token = String(dados.tokenPublico || dados.token || "").trim();

  if (token) {
    url.searchParams.set("token", token);
  } else {
    url.searchParams.set("modo", "previa");
  }

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

  const partes = String(valor).split("-");

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

function imprimirCertificado() {
  if (!$("#previewCertificado")?.innerHTML.trim()) {
    mostrarMensagem("Gere a prévia antes de imprimir.", "error");
    return;
  }

  window.print();
}

async function recarregarHistorico() {
  const resposta = await obterApiCertificados().chamarApi({
    acao: "listarCertificados"
  });

  ESTADO.historico = Array.isArray(resposta.certificados)
    ? resposta.certificados
    : [];

  renderizarHistorico();
}

function renderizarHistorico() {
  const corpo = $("#corpoHistorico");

  if (!corpo) {
    return;
  }

  const filtro = normalizar($("#filtroHistorico")?.value || "");

  const itens = ESTADO.historico.filter((item) =>
    normalizar(
      `${item.numero || ""} ${item.nome || ""} ${item.tipo || ""} ${item.cargo || ""}`
    ).includes(filtro)
  );

  corpo.innerHTML = "";

  if (!itens.length) {
    corpo.innerHTML = `
      <tr>
        <td colspan="6" class="historico-vazio">
          Nenhum certificado encontrado.
        </td>
      </tr>
    `;
    return;
  }

  itens.forEach((item) => {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td><strong>${esc(item.numero || "")}</strong></td>
      <td>${esc(nomeTipo(item.tipo))}</td>
      <td>${esc(item.nome || "")}</td>
      <td>${esc(dataBr(item.dataCerimonia || item.data))}</td>
      <td>${esc(item.emitidoPor || "")}</td>
      <td>
        <button type="button" class="botao-reimprimir">
          Reimprimir
        </button>
      </td>
    `;

    $("button", linha)?.addEventListener("click", () => reimprimir(item));
    corpo.appendChild(linha);
  });
}

function reimprimir(item) {
  const tipo =
    String(item.tipo || "").toUpperCase() === CERTIFICADOS.CONSAGRACAO
      ? CERTIFICADOS.CONSAGRACAO
      : CERTIFICADOS.BATISMO;

  ESTADO.tipo = tipo;
  abrirAba(MODELOS_CERTIFICADO[tipo].aba);

  const dados = {
    ...item,
    tipo,
    dataCerimonia: item.dataCerimonia || item.data || ""
  };

  ESTADO.certificadoAtual = dados;
  renderizarCertificado(dados);
  setTimeout(imprimirCertificado, 350);
}

function nomeTipo(tipo) {
  return String(tipo || "").toUpperCase() === CERTIFICADOS.CONSAGRACAO
    ? "Consagração"
    : "Batismo";
}

function mostrarMensagem(texto, tipo) {
  const elemento = $("#mensagemModulo");

  if (!elemento) {
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

function dataBr(valor) {
  if (!valor) {
    return "";
  }

  const texto = String(valor);
  const data = texto.includes("T") ? texto.split("T")[0] : texto;
  const partes = data.split("-");

  return partes.length === 3
    ? `${partes[2]}/${partes[1]}/${partes[0]}`
    : texto;
}

function esc(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
