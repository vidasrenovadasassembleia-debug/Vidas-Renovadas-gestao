"use strict";

/* ===================================================
   CERTIFICADOS - VIDAS RENOVADAS GESTÃO
   =================================================== */

const ESTADO_CERTIFICADOS = {
  configuracoes: {},
  arquivos: {},
  cargos: [],
  historico: [],
  certificadoAtual: null
};

const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
const $$ = (seletor, raiz = document) =>
  Array.from(raiz.querySelectorAll(seletor));

document.addEventListener("DOMContentLoaded", iniciarModuloCertificados);

async function iniciarModuloCertificados() {
  const sessao = obterSessao();

  if (!sessao || !sessao.credential) {
    window.location.replace("../index.html");
    return;
  }

  aplicarIdentidadeUsuario();
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

  $("#formConsagracao")?.addEventListener("input", () => {
    atualizarPreview("consagracao");
  });

  $("#formBatismo")?.addEventListener("input", () => {
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
      chamarApi({
        acao: "obterDadosCertificados"
      }),
      chamarApi({
        acao: "listarCertificados"
      })
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

function abrirAba(aba) {
  $$(".aba-certificado").forEach((botao) => {
    botao.classList.toggle("active", botao.dataset.aba === aba);
  });

  $$(".painel-certificado").forEach((painel) => {
    painel.classList.toggle("active", painel.dataset.painel === aba);
  });

  if (aba === "historico") {
    renderizarHistorico();
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

  if (membro.congregacao) {
    formulario.elements.congregacao.value = membro.congregacao;
  }

  if (area) {
    area.hidden = true;
  }

  if (campoPesquisa) {
    campoPesquisa.value =
      membro.numeroCarteirinha || membro.nomeCompleto || "";
  }

  atualizarPreview(configuracao.tipoPreview);
}

function obterDadosFormulario(formulario, tipo) {
  const dadosFormulario = new FormData(formulario);
  const dados = Object.fromEntries(dadosFormulario.entries());

  dados.tipo = tipo;

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
      window.print();
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

  alvo.innerHTML = montarCertificado(dados);
}

function montarCertificado(dados) {
  const configuracoes = ESTADO_CERTIFICADOS.configuracoes;
  const arquivos = ESTADO_CERTIFICADOS.arquivos;

  const igreja =
    configuracoes.nomeIgreja ||
    "Assembleia de Deus Ministério Vidas Renovadas";

  const logo = arquivos.logo
    ? `<img class="cert-logo" src="${escAttr(arquivos.logo)}" alt="Logo">`
    : "";

  const assinatura = arquivos.assinatura
    ? `<img src="${escAttr(arquivos.assinatura)}" alt="Assinatura">`
    : "";

  const pastor =
    dados.pastor ||
    configuracoes.pastorPresidente ||
    "Pastor responsável";

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

      <h2 class="cert-titulo">${titulo}</h2>
      <div class="cert-subtitulo">${subtitulo}</div>

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
          Pastor responsável
        </div>
      </div>

      <div class="cert-numero">
        Nº ${esc(dados.numero || "prévia")}
      </div>
    </div>
  `;
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
      <td>${esc(item.emitidoPor)}</td>
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
    window.print();
  }, 200);
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
