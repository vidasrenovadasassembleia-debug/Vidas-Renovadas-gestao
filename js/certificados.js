"use strict";

/* =========================================================
   CERTIFICADOS — VIDAS RENOVADAS GESTÃO
   Arquivo oficial: js/certificados.js
   ========================================================= */

const ESTADO_CERTIFICADOS = {
  configuracoes: {},
  arquivos: {},
  cargos: [],
  historico: [],
  certificadoAtual: null,
  tipoEmImpressao: null
};

const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
const $$ = (seletor, raiz = document) =>
  Array.from(raiz.querySelectorAll(seletor));

document.addEventListener("DOMContentLoaded", iniciarModuloCertificados);

async function iniciarModuloCertificados() {
  const sessao =
    typeof obterSessao === "function"
      ? obterSessao()
      : null;

  if (!sessao || !sessao.credential) {
    window.location.replace("../index.html");
    return;
  }

  if (typeof aplicarIdentidadeUsuario === "function") {
    aplicarIdentidadeUsuario();
  }

  configurarEventos();

  await carregarDadosIniciais();

  atualizarTodasPreviews();
}

/* =========================================================
   EVENTOS
   ========================================================= */

function configurarEventos() {
  $$(".aba-certificado").forEach((botao) => {
    botao.addEventListener("click", () => {
      abrirAba(botao.dataset.aba);
    });
  });

  $("#botaoSair")?.addEventListener("click", () => {
    if (typeof CHAVE_SESSAO !== "undefined") {
      sessionStorage.removeItem(CHAVE_SESSAO);
    }

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

  $("#formConsagracao")?.addEventListener("input", () => {
    atualizarPreview("consagracao");
  });

  $("#formConsagracao")?.addEventListener("change", () => {
    atualizarPreview("consagracao");
  });

  $("#formBatismo")?.addEventListener("input", () => {
    atualizarPreview("batismo");
  });

  $("#formBatismo")?.addEventListener("change", () => {
    atualizarPreview("batismo");
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

  window.addEventListener("afterprint", limparEstadoImpressao);
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

/* =========================================================
   CARREGAMENTO INICIAL
   ========================================================= */

async function carregarDadosIniciais() {
  definirMensagem("Carregando dados do módulo...", "info");

  try {
    const [dados, historico] = await Promise.all([
      chamarApi({
        acao: "obterDadosCertificados"
      }),
      chamarApi({
        acao: "listarCertificados"
      })
    ]);

    ESTADO_CERTIFICADOS.configuracoes = dados.configuracoes || {};
    ESTADO_CERTIFICADOS.arquivos = dados.arquivos || {};
    ESTADO_CERTIFICADOS.cargos = Array.isArray(dados.cargos)
      ? dados.cargos
      : [];
    ESTADO_CERTIFICADOS.historico =
      historico.certificados || [];

    preencherCargos();
    preencherPadroes();
    renderizarHistorico();

    definirMensagem("Módulo carregado.", "success");

    setTimeout(() => {
      const mensagem = $("#mensagemModulo");

      if (mensagem?.dataset.tipo === "success") {
        mensagem.hidden = true;
      }
    }, 1800);
  } catch (erro) {
    definirMensagem(
      erro?.message || "Não foi possível carregar o módulo de certificados.",
      "error"
    );
  }
}

function preencherCargos() {
  const select = $("#formConsagracao [name='cargo']");

  if (!select) {
    return;
  }

  const valorAtual = select.value;

  select.innerHTML = '<option value="">Selecione</option>';

  ESTADO_CERTIFICADOS.cargos.forEach((item) => {
    const cargo = normalizarCargo(item);

    if (!cargo.valor || !cargo.texto) {
      return;
    }

    const opcao = document.createElement("option");

    opcao.value = cargo.valor;
    opcao.textContent = cargo.texto;

    select.appendChild(opcao);
  });

  if (
    valorAtual &&
    Array.from(select.options).some(
      (opcao) => opcao.value === valorAtual
    )
  ) {
    select.value = valorAtual;
  }
}

function normalizarCargo(item) {
  if (typeof item === "string" || typeof item === "number") {
    const valor = String(item).trim();

    return {
      valor,
      texto: valor
    };
  }

  if (!item || typeof item !== "object") {
    return {
      valor: "",
      texto: ""
    };
  }

  const texto = String(
    item.nome ||
    item.cargo ||
    item.descricao ||
    item.titulo ||
    item.label ||
    item.valor ||
    item.value ||
    ""
  ).trim();

  const valor = String(
    item.valor ||
    item.value ||
    item.nome ||
    item.cargo ||
    item.id ||
    texto
  ).trim();

  return {
    valor,
    texto
  };
}

function preencherPadroes() {
  const configuracoes = ESTADO_CERTIFICADOS.configuracoes;

  [$("#formConsagracao"), $("#formBatismo")].forEach((formulario) => {
    if (!formulario) {
      return;
    }

    formulario.elements.pastor.value =
      configuracoes.pastorPresidente ||
      configuracoes.pastorLocal ||
      "";

    formulario.elements.local.value = [
      configuracoes.cidadeIgreja,
      configuracoes.estadoIgreja
    ]
      .filter(Boolean)
      .join(" - ");

    formulario.elements.congregacao.value =
      configuracoes.congregacaoPadrao || "";
  });
}

/* =========================================================
   ABAS
   ========================================================= */

function abrirAba(aba) {
  $$(".aba-certificado").forEach((botao) => {
    botao.classList.toggle(
      "active",
      botao.dataset.aba === aba
    );
  });

  $$(".painel-certificado").forEach((painel) => {
    painel.classList.toggle(
      "active",
      painel.dataset.painel === aba
    );
  });

  if (aba === "historico") {
    renderizarHistorico();
  }
}

/* =========================================================
   PESQUISA E SELEÇÃO DE MEMBROS
   ========================================================= */

async function pesquisarMembro(configuracao) {
  const campo = $(configuracao.campoPesquisa);
  const botao = $(configuracao.botaoPesquisa);
  const termo = campo?.value.trim() || "";

  if (termo.length < 2) {
    definirMensagem("Digite pelo menos 2 caracteres.", "error");
    campo?.focus();
    return;
  }

  definirMensagem("Pesquisando membro...", "info");

  if (botao) {
    botao.disabled = true;
  }

  try {
    const resposta = await chamarApi({
      acao: "pesquisarMembrosCertificado",
      termo
    });

    const membros = resposta.membros || [];

    mostrarResultadosMembros(membros, configuracao);

    definirMensagem(
      membros.length
        ? `${membros.length} resultado(s) encontrado(s).`
        : "Nenhum membro encontrado.",
      membros.length ? "success" : "info"
    );
  } catch (erro) {
    definirMensagem(
      erro?.message || "Não foi possível pesquisar os membros.",
      "error"
    );
  } finally {
    if (botao) {
      botao.disabled = false;
    }
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

    const nome =
      membro.nomeCompleto ||
      membro.nome ||
      "Membro sem nome";

    const numero =
      membro.numeroCarteirinha ||
      membro.numero ||
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

  const nome =
    membro.nomeCompleto ||
    membro.nome ||
    "";

  const numeroCarteirinha =
    membro.numeroCarteirinha ||
    membro.numero ||
    "";

  const congregacao =
    membro.congregacao ||
    membro.nomeCongregacao ||
    "";

  formulario.elements.idMembro.value =
    membro.id ||
    membro.idMembro ||
    "";

  formulario.elements.numeroCarteirinha.value =
    numeroCarteirinha;

  formulario.elements.nome.value = nome;

  if (congregacao) {
    formulario.elements.congregacao.value = congregacao;
  }

  if (area) {
    area.hidden = true;
  }

  if (campoPesquisa) {
    campoPesquisa.value =
      numeroCarteirinha ||
      nome;
  }

  atualizarPreview(configuracao.tipoPreview);

  definirMensagem(
    `${nome || "Membro"} selecionado com sucesso.`,
    "success"
  );
}

/* =========================================================
   DADOS DO FORMULÁRIO
   ========================================================= */

function obterDadosFormulario(formulario, tipo) {
  const dadosFormulario = new FormData(formulario);
  const dados = Object.fromEntries(dadosFormulario.entries());

  dados.tipo = tipo;

  Object.keys(dados).forEach((chave) => {
    if (typeof dados[chave] === "string") {
      dados[chave] = dados[chave].trim();
    }
  });

  return dados;
}

/* =========================================================
   REGISTRO E IMPRESSÃO
   ========================================================= */

async function registrarEImprimir(evento, tipo) {
  evento.preventDefault();

  const formulario = evento.currentTarget;
  const botaoEnviar = formulario.querySelector(
    'button[type="submit"]'
  );

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

  if (botaoEnviar) {
    botaoEnviar.disabled = true;
  }

  try {
    const resposta = await chamarApi({
      acao: "emitirCertificado",
      dados
    });

    const certificadoRegistrado =
      resposta.certificado || {};

    const dadosCompletos = {
      ...dados,
      ...certificadoRegistrado,
      numero:
        certificadoRegistrado.numero ||
        dados.numero ||
        ""
    };

    ESTADO_CERTIFICADOS.certificadoAtual = dadosCompletos;

    const tipoPreview =
      tipo === "CONSAGRACAO"
        ? "consagracao"
        : "batismo";

    atualizarPreview(tipoPreview, dadosCompletos);

    definirMensagem(
      `${dadosCompletos.numero || "Certificado"} registrado com sucesso.`,
      "success"
    );

    await recarregarHistorico();

    imprimirCertificado(tipoPreview);
  } catch (erro) {
    definirMensagem(
      erro?.message || "Não foi possível registrar o certificado.",
      "error"
    );
  } finally {
    if (botaoEnviar) {
      botaoEnviar.disabled = false;
    }
  }
}

function imprimirCertificado(tipo) {
  const alvo =
    tipo === "consagracao"
      ? $("#previewConsagracao")
      : $("#previewBatismo");

  if (!alvo || !alvo.innerHTML.trim()) {
    definirMensagem(
      "Gere a pré-visualização antes de imprimir.",
      "error"
    );
    return;
  }

  ESTADO_CERTIFICADOS.tipoEmImpressao = tipo;

  document.body.dataset.imprimindoCertificado = tipo;

  $$(".folha-certificado").forEach((folha) => {
    folha.classList.toggle(
      "certificado-para-impressao",
      folha === alvo
    );
  });

  setTimeout(() => {
    window.print();
  }, 250);
}

function limparEstadoImpressao() {
  ESTADO_CERTIFICADOS.tipoEmImpressao = null;

  delete document.body.dataset.imprimindoCertificado;

  $$(".folha-certificado").forEach((folha) => {
    folha.classList.remove("certificado-para-impressao");
  });
}

/* =========================================================
   PRÉ-VISUALIZAÇÃO
   ========================================================= */

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
      consagracao
        ? "CONSAGRACAO"
        : "BATISMO"
    );

  alvo.innerHTML = montarCertificado(dados);
}

function montarCertificado(dados) {
  const configuracoes = ESTADO_CERTIFICADOS.configuracoes;
  const arquivos = ESTADO_CERTIFICADOS.arquivos;

  const igreja =
    configuracoes.nomeIgreja ||
    "Assembleia de Deus Ministério Vidas Renovadas";

  const caminhoLogo =
    arquivos.logo ||
    arquivos.logoIgreja ||
    "../logo.png";

  const caminhoAssinatura =
    arquivos.assinatura ||
    arquivos.assinaturaPastor ||
    "";

  const logo = caminhoLogo
    ? `<img class="cert-logo" src="${escAttr(caminhoLogo)}" alt="Logo da igreja">`
    : "";

  const assinatura = caminhoAssinatura
    ? `<img src="${escAttr(caminhoAssinatura)}" alt="Assinatura do pastor presidente">`
    : "";

  const pastor =
    dados.pastor ||
    configuracoes.pastorPresidente ||
    configuracoes.pastorLocal ||
    "Pastor presidente";

  const local =
    dados.local ||
    [
      configuracoes.cidadeIgreja,
      configuracoes.estadoIgreja
    ]
      .filter(Boolean)
      .join(" - ");

  const data = dataExtenso(dados.dataCerimonia);

  let titulo;
  let subtitulo;
  let texto;

  if (dados.tipo === "CONSAGRACAO") {
    titulo = "Certificado";
    subtitulo = "Consagração Ministerial";

    texto = `
      Certificamos que
      <span class="cert-nome">${esc(
        dados.nome || "Nome do membro"
      )}</span>
      foi consagrado(a) ao santo ministério no cargo de
      <span class="cert-destaque">${esc(
        dados.cargo || "cargo ministerial"
      )}</span>,
      para servir ao Reino de Deus com fidelidade, zelo e dedicação.
    `;
  } else {
    titulo = "Certificado de Batismo";
    subtitulo = "Batismo Cristão";

    texto = `
      Certificamos que
      <span class="cert-nome">${esc(
        dados.nome || "Nome do membro"
      )}</span>
      foi batizado(a) nas águas, em testemunho público de sua fé
      em Jesus Cristo, conforme os princípios da Palavra de Deus.
    `;
  }

  return `
    <div class="cert-borda">
      <div class="cert-topo">
        ${logo}
        <div class="cert-igreja">${esc(igreja)}</div>
      </div>

      <h2 class="cert-titulo">${esc(titulo)}</h2>
      <div class="cert-subtitulo">${esc(subtitulo)}</div>

      <div class="cert-texto">
        ${texto}

        <p>
          Realizado em
          <span class="cert-destaque">${esc(
            local || "local da cerimônia"
          )}</span>,
          no dia
          <span class="cert-destaque">${esc(
            data || "data da cerimônia"
          )}</span>.
        </p>
      </div>

      <div class="cert-rodape">
        <div class="cert-assinatura">
          ${assinatura}
          <strong>${esc(pastor)}</strong><br>
          Pastor presidente
        </div>
      </div>

      <div class="cert-numero">
        Nº ${esc(dados.numero || "prévia")}
      </div>
    </div>
  `;
}

/* =========================================================
   HISTÓRICO
   ========================================================= */

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

  const filtro = normalizar(
    $("#filtroHistorico")?.value || ""
  );

  const itens = ESTADO_CERTIFICADOS.historico.filter((item) => {
    return normalizar(
      `${item.numero || ""} ${item.nome || ""} ${item.tipo || ""}`
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
      <td><strong>${esc(item.numero || "")}</strong></td>
      <td>${esc(nomeTipoCertificado(item.tipo))}</td>
      <td>${esc(item.nome || "")}</td>
      <td>${esc(dataBr(item.dataCerimonia || item.data))}</td>
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

function nomeTipoCertificado(tipo) {
  return String(tipo || "").toUpperCase() === "CONSAGRACAO"
    ? "Consagração"
    : "Batismo";
}

function reimprimir(item) {
  const tipo =
    String(item.tipo || "").toUpperCase() === "CONSAGRACAO"
      ? "consagracao"
      : "batismo";

  const dados = {
    ...item,
    tipo:
      tipo === "consagracao"
        ? "CONSAGRACAO"
        : "BATISMO",
    dataCerimonia:
      item.dataCerimonia ||
      item.data ||
      ""
  };

  abrirAba(tipo);
  atualizarPreview(tipo, dados);

  imprimirCertificado(tipo);
}

/* =========================================================
   MENSAGENS E UTILITÁRIOS
   ========================================================= */

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

  const texto = String(valor);
  const dataSomente = texto.includes("T")
    ? texto.split("T")[0]
    : texto;

  const partes = dataSomente.split("-");

  return partes.length === 3
    ? `${partes[2]}/${partes[1]}/${partes[0]}`
    : texto;
}

function dataExtenso(valor) {
  if (!valor) {
    return "";
  }

  const texto = String(valor);
  const dataSomente = texto.includes("T")
    ? texto.split("T")[0]
    : texto;

  const data = new Date(`${dataSomente}T12:00:00`);

  if (Number.isNaN(data.getTime())) {
    return dataBr(valor);
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

function escAttr(valor) {
  return esc(valor);
}
