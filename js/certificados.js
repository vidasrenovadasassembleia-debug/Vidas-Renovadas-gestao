"use strict";

/* ===================================================
   CERTIFICADOS — VIDAS RENOVADAS GESTÃO
   Arquivo: js/certificados.js
   =================================================== */

const ESTADO_CERTIFICADOS = {
  configuracoes: {},
  arquivos: {},
  cargos: [],
  historico: [],
  certificadoAtual: null
};

const PASTOR_PRESIDENTE = "Rogério Lemos da Silva";
const CONGREGACOES_CERTIFICADOS = [
  "Independência / Petrópolis",
  "Km51 / Xerém"
];

const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
const $$ = (seletor, raiz = document) =>
  Array.from(raiz.querySelectorAll(seletor));

document.addEventListener("DOMContentLoaded", iniciarModuloCertificados);

async function iniciarModuloCertificados() {
  aplicarIdentidadeUsuario();
  garantirOpcoesCongregacao();
  configurarEventos();
  await carregarDadosIniciais();
  atualizarTodasPreviews();
}

function configurarEventos() {
  $$(".aba-certificado").forEach((botao) => {
    botao.addEventListener("click", () => {
      abrirAba(botao.dataset.aba);
    });
  });

  $("#botaoSair")?.addEventListener("click", () => {
    sessionStorage.removeItem(CHAVE_SESSAO);
    window.location.href = "../index.html";
  });

  configurarPesquisaMembro({
    campoPesquisa: "#pesquisaMembro",
    botaoPesquisa: "#botaoPesquisarMembro",
    areaResultados: "#resultadosMembros",
    formulario: "#formConsagracao",
    tipoPreview: "consagracao"
  });

  configurarPesquisaMembro({
    campoPesquisa: "#pesquisaMembroBatismo",
    botaoPesquisa: "#botaoPesquisarMembroBatismo",
    areaResultados: "#resultadosMembrosBatismo",
    formulario: "#formBatismo",
    tipoPreview: "batismo"
  });

  ["#formConsagracao", "#formBatismo"].forEach((seletor) => {
    const formulario = $(seletor);

    formulario?.addEventListener("input", () => {
      atualizarPreview(
        seletor === "#formConsagracao" ? "consagracao" : "batismo"
      );
    });

    formulario?.addEventListener("change", () => {
      atualizarPreview(
        seletor === "#formConsagracao" ? "consagracao" : "batismo"
      );
    });
  });

  $("#formConsagracao")?.addEventListener("submit", (evento) => {
    registrarEImprimir(evento, "CONSAGRACAO");
  });

  $("#formBatismo")?.addEventListener("submit", (evento) => {
    registrarEImprimir(evento, "BATISMO");
  });

  $$("[data-visualizar]").forEach((botao) => {
    botao.addEventListener("click", () => {
      atualizarPreview(botao.dataset.visualizar);
    });
  });

  $("#filtroHistorico")?.addEventListener("input", renderizarHistorico);
}

function garantirOpcoesCongregacao() {
  $$("select[name='congregacao']").forEach((select) => {
    const valorAtual = select.value;

    select.innerHTML = '<option value="">Selecione</option>';

    CONGREGACOES_CERTIFICADOS.forEach((congregacao) => {
      const opcao = document.createElement("option");
      opcao.value = congregacao;
      opcao.textContent = congregacao;
      select.appendChild(opcao);
    });

    if (CONGREGACOES_CERTIFICADOS.includes(valorAtual)) {
      select.value = valorAtual;
    }
  });
}

function configurarPesquisaMembro(configuracao) {
  const campo = $(configuracao.campoPesquisa);
  const botao = $(configuracao.botaoPesquisa);

  botao?.addEventListener("click", () => {
    pesquisarMembro(configuracao);
  });

  campo?.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") {
      evento.preventDefault();
      pesquisarMembro(configuracao);
    }
  });
}

async function carregarDadosIniciais() {
  definirMensagem("Carregando dados do módulo...", "info");

  try {
    const [dados, historico] = await Promise.all([
      chamarApi({ acao: "obterDadosCertificados" }),
      chamarApi({ acao: "listarCertificados" })
    ]);

    ESTADO_CERTIFICADOS.configuracoes = dados.configuracoes || {};
    ESTADO_CERTIFICADOS.arquivos = dados.arquivos || {};
    ESTADO_CERTIFICADOS.cargos = dados.cargos || [];
    ESTADO_CERTIFICADOS.historico = historico.certificados || [];

    preencherCargos();
    preencherPadroes();
    renderizarHistorico();

    definirMensagem("Módulo carregado.", "success");

    setTimeout(() => {
      const mensagem = $("#mensagemModulo");
      if (mensagem) {
        mensagem.hidden = true;
      }
    }, 1800);
  } catch (erro) {
    definirMensagem(erro.message, "error");
  }
}

function preencherCargos() {
  const select = $("#formConsagracao [name='cargo']");

  if (!select) {
    return;
  }

  select.innerHTML = '<option value="">Selecione</option>';

  ESTADO_CERTIFICADOS.cargos.forEach((cargo) => {
    const opcao = document.createElement("option");
    opcao.value = cargo;
    opcao.textContent = cargo;
    select.appendChild(opcao);
  });
}

function preencherPadroes() {
  const configuracoes = ESTADO_CERTIFICADOS.configuracoes;

  [$("#formConsagracao"), $("#formBatismo")].forEach((formulario) => {
    if (!formulario) {
      return;
    }

    const localPadrao = [
      configuracoes.cidadeIgreja,
      configuracoes.estadoIgreja
    ]
      .filter(Boolean)
      .join(" - ");

    if (formulario.elements.local && !formulario.elements.local.value) {
      formulario.elements.local.value = localPadrao;
    }

    const congregacaoPadrao = configuracoes.congregacaoPadrao || "";

    if (
      formulario.elements.congregacao &&
      CONGREGACOES_CERTIFICADOS.includes(congregacaoPadrao)
    ) {
      formulario.elements.congregacao.value = congregacaoPadrao;
    }
  });
}

function abrirAba(aba) {
  $$(".aba-certificado").forEach((botao) => {
    botao.classList.toggle("active", botao.dataset.aba === aba);
  });

  $$(".painel-certificado").forEach((painel) => {
    painel.classList.toggle("active", painel.dataset.painel === aba);
  });

  if (aba === "historico") {
    renderizarHistorico();
  } else {
    atualizarPreview(aba);
  }
}

async function pesquisarMembro(configuracao) {
  const campo = $(configuracao.campoPesquisa);
  const termo = campo?.value.trim() || "";

  if (termo.length < 2) {
    definirMensagem("Digite pelo menos 2 caracteres.", "error");
    return;
  }

  definirMensagem("Pesquisando membro...", "info");

  try {
    const resposta = await chamarApi({
      acao: "pesquisarMembrosCertificado",
      termo
    });

    const membros = resposta.membros || [];
    mostrarResultadosMembros(membros, configuracao);

    definirMensagem(
      `${membros.length} resultado(s) encontrado(s).`,
      "success"
    );
  } catch (erro) {
    definirMensagem(erro.message, "error");
  }
}

function mostrarResultadosMembros(membros, configuracao) {
  const area = $(configuracao.areaResultados);

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

    botao.innerHTML = `
      <span>
        <strong>${esc(membro.nomeCompleto)}</strong><br>
        ${esc(membro.congregacao || "Sem congregação")}
      </span>
      <span>
        ${esc(membro.numeroCarteirinha || membro.id)}<br>
        ${esc(membro.situacao || "")}
      </span>
    `;

    botao.addEventListener("click", () => {
      selecionarMembro(membro, configuracao);
    });

    area.appendChild(botao);
  });
}

function selecionarMembro(membro, configuracao) {
  const formulario = $(configuracao.formulario);
  const area = $(configuracao.areaResultados);
  const campoPesquisa = $(configuracao.campoPesquisa);

  if (!formulario) {
    return;
  }

  formulario.elements.idMembro.value = membro.id || "";
  formulario.elements.numeroCarteirinha.value =
    membro.numeroCarteirinha || "";
  formulario.elements.nome.value = membro.nomeCompleto || "";

  const congregacao = normalizarCongregacao(membro.congregacao);

  if (congregacao && formulario.elements.congregacao) {
    formulario.elements.congregacao.value = congregacao;
  }

  if (area) {
    area.hidden = true;
  }

  if (campoPesquisa) {
    campoPesquisa.value =
      membro.nomeCompleto || membro.numeroCarteirinha || "";
  }

  atualizarPreview(configuracao.tipoPreview);
}

function normalizarCongregacao(valor) {
  const texto = normalizar(valor);

  if (
    texto.includes("independencia") ||
    texto.includes("petropolis")
  ) {
    return "Independência / Petrópolis";
  }

  if (
    texto.includes("km51") ||
    texto.includes("km 51") ||
    texto.includes("xerem")
  ) {
    return "Km51 / Xerém";
  }

  return "";
}

function obterDadosFormulario(formulario, tipo) {
  const dadosFormulario = new FormData(formulario);
  const dados = Object.fromEntries(dadosFormulario.entries());

  dados.tipo = tipo;
  dados.pastor = PASTOR_PRESIDENTE;

  return dados;
}

async function registrarEImprimir(evento, tipo) {
  evento.preventDefault();

  const formulario = evento.currentTarget;

  if (!formulario.reportValidity()) {
    return;
  }

  if (!formulario.elements.idMembro.value.trim()) {
    definirMensagem(
      "Pesquise e selecione um membro antes de registrar o certificado.",
      "error"
    );
    return;
  }

  const dados = obterDadosFormulario(formulario, tipo);

  definirMensagem("Registrando certificado...", "info");

  try {
    const resposta = await chamarApi({
      acao: "emitirCertificado",
      dados
    });

    dados.numero = resposta.certificado.numero;
    dados.linkDigital =
      resposta.certificado.linkDigital ||
      resposta.certificado.urlDigital ||
      resposta.certificado.link ||
      "";

    ESTADO_CERTIFICADOS.certificadoAtual = dados;

    atualizarPreview(
      tipo === "CONSAGRACAO" ? "consagracao" : "batismo",
      dados
    );

    definirMensagem(
      `${dados.numero} registrado com sucesso.`,
      "success"
    );

    await recarregarHistorico();

    setTimeout(() => {
      abrirImpressaoCertificado(montarDadosImpressao(dados));
    }, 250);
  } catch (erro) {
    definirMensagem(erro.message, "error");
  }
}

function atualizarTodasPreviews() {
  atualizarPreview("consagracao");
  atualizarPreview("batismo");
}

function atualizarPreview(tipo, dadosForcados) {
  const consagracao = tipo === "consagracao";

  const formulario = consagracao
    ? $("#formConsagracao")
    : $("#formBatismo");

  const alvo = consagracao
    ? $("#previewConsagracao")
    : $("#previewBatismo");

  if (!formulario || !alvo) {
    return;
  }

  const dados =
    dadosForcados ||
    obterDadosFormulario(
      formulario,
      consagracao ? "CONSAGRACAO" : "BATISMO"
    );

  renderizarPreviewCertificado(alvo, montarDadosImpressao(dados));
}

async function recarregarHistorico() {
  const resposta = await chamarApi({
    acao: "listarCertificados"
  });

  ESTADO_CERTIFICADOS.historico =
    resposta.certificados || [];

  renderizarHistorico();
}

function renderizarHistorico() {
  const corpo = $("#corpoHistorico");

  if (!corpo) {
    return;
  }

  const filtro = normalizar($("#filtroHistorico")?.value || "");

  const itens = ESTADO_CERTIFICADOS.historico.filter((item) => {
    return normalizar(
      `${item.numero} ${item.nome} ${item.tipo}`
    ).includes(filtro);
  });

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
      <td><strong>${esc(item.numero)}</strong></td>
      <td>
        ${item.tipo === "CONSAGRACAO" ? "Consagração" : "Batismo"}
      </td>
      <td>${esc(item.nome)}</td>
      <td>${esc(dataBr(item.dataCerimonia))}</td>
      <td>${esc(item.emitidoPor || "")}</td>
      <td>
        <button class="botao-reimprimir" type="button">
          Reimprimir
        </button>
      </td>
    `;

    $("button", linha)?.addEventListener("click", () => {
      reimprimir(item);
    });

    corpo.appendChild(linha);
  });
}

function reimprimir(item) {
  const tipo =
    item.tipo === "CONSAGRACAO"
      ? "consagracao"
      : "batismo";

  abrirAba(tipo);
  atualizarPreview(tipo, item);

  setTimeout(() => {
    abrirImpressaoCertificado(montarDadosImpressao(item));
  }, 200);
}

function montarDadosImpressao(dados) {
  const configuracoes = ESTADO_CERTIFICADOS.configuracoes || {};
  const arquivos = ESTADO_CERTIFICADOS.arquivos || {};
  const tipoOriginal = String(dados.tipo || "").toUpperCase();

  const local =
    dados.local ||
    dados.cidade ||
    configuracoes.cidadeIgreja ||
    "";

  const linkDigital =
    dados.linkDigital ||
    dados.urlDigital ||
    dados.link ||
    criarLinkDigitalCertificado(dados.numero);

  return {
    tipo:
      tipoOriginal === "CONSAGRACAO"
        ? "consagracao"
        : "batismo",

    nome:
      dados.nome ||
      dados.nomeCompleto ||
      "",

    cargo:
      dados.cargo ||
      "",

    congregacao:
      dados.congregacao ||
      "",

    cidade: local,

    dataExtenso:
      dataExtenso(
        dados.dataCerimonia ||
        dados.data ||
        ""
      ),

    numero:
      dados.numero ||
      "",

    assinatura:
      arquivos.assinaturaAzul ||
      arquivos.assinatura ||
      arquivos.assinaturaPastor ||
      configuracoes.assinaturaPastor ||
      "../certificados/assinaturas/pastor-presidente.png",

    pastor: PASTOR_PRESIDENTE,

    igreja:
      configuracoes.nomeIgreja ||
      "Assembleia de Deus Ministério Vidas Renovadas",

    logo:
      arquivos.logo ||
      configuracoes.logo ||
      "../logo.png",

    linkValidacao: linkDigital
  };
}

function criarLinkDigitalCertificado(numero) {
  const url = new URL(window.location.href);

  url.search = "";
  url.hash = "";

  if (numero) {
    url.searchParams.set("certificado", numero);
  }

  return url.toString();
}

function definirMensagem(texto, tipo) {
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

  const partes = String(valor).split("-");

  return partes.length === 3
    ? `${partes[2]}/${partes[1]}/${partes[0]}`
    : valor;
}

function dataExtenso(valor) {
  if (!valor) {
    return "";
  }

  const data = new Date(`${valor}T12:00:00`);

  if (Number.isNaN(data.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(data);
}

function esc(valor) {
  return String(valor ?? "").replace(
    /[&<>"']/g,
    (caractere) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      })[caractere]
  );
}
