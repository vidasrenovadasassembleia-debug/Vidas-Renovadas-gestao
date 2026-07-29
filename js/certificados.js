"use strict";

/* ============================================================================
   CERTIFICADOS — VIDAS RENOVADAS GESTÃO 2.0
   Arquivo oficial: js/certificados.js

   Arquitetura:
   - O PNG contém toda a arte estática.
   - O JavaScript sobrepõe apenas dados dinâmicos.
   - O QR Code aponta para o certificado digital por token público.
   ============================================================================ */

const TIPOS_CERTIFICADO = Object.freeze({
  BATISMO: "BATISMO",
  CONSAGRACAO: "CONSAGRACAO",
  HISTORICO: "HISTORICO"
});

const TAMANHO_CANVAS_CERTIFICADO = Object.freeze({
  largura: 1492,
  altura: 1055
});

/*
 * Um único motor renderiza os dois certificados.
 * Cada modelo informa somente a imagem-base e as coordenadas dos campos.
 * As coordenadas são percentuais, portanto acompanham a escala do preview.
 */
const MODELOS_CERTIFICADO = Object.freeze({
  [TIPOS_CERTIFICADO.BATISMO]: {
    imagem: "../assets/certificados/certificado-batismo-base.png",
    classe: "certificado-batismo",
    campos: {
      nome:       { x: 17.0, y: 25.5, largura: 62.0, altura: 6.8 },
      cidade:     { x: 27.0, y: 44.2, largura: 20.0, altura: 3.0 },
      dia:        { x: 51.5, y: 44.2, largura: 4.0,  altura: 3.0 },
      mes:        { x: 58.0, y: 44.2, largura: 12.0, altura: 3.0 },
      ano:        { x: 75.5, y: 44.2, largura: 6.0,  altura: 3.0 },
      assinatura: { x: 36.0, y: 48.2, largura: 28.0, altura: 7.0 },
      registro:   { x: 23.0, y: 57.3, largura: 15.0, altura: 2.8 },
      qrcode:     { x: 82.4, y: 37.7, largura: 10.0, altura: 15.2 }
    }
  },

  [TIPOS_CERTIFICADO.CONSAGRACAO]: {
    imagem: "../assets/certificados/certificado-consagracao-base.png",
    classe: "certificado-consagracao",
    campos: {
      nome:       { x: 17.5, y: 28.0, largura: 62.0, altura: 6.6 },
      cargo:      { x: 43.0, y: 34.6, largura: 34.0, altura: 4.2 },
      cidade:     { x: 29.0, y: 51.5, largura: 20.0, altura: 2.8 },
      dia:        { x: 51.8, y: 51.5, largura: 4.0,  altura: 2.8 },
      mes:        { x: 58.5, y: 51.5, largura: 12.0, altura: 2.8 },
      ano:        { x: 76.0, y: 51.5, largura: 6.0,  altura: 2.8 },
      assinatura: { x: 35.5, y: 54.8, largura: 29.0, altura: 7.0 },
      registro:   { x: 21.0, y: 61.2, largura: 16.0, altura: 2.8 },
      qrcode:     { x: 82.1, y: 44.2, largura: 10.4, altura: 15.8 }
    }
  }
});

const ESTADO_CERTIFICADOS = {
  configuracoes: {},
  arquivos: {},
  cargos: [],
  historico: [],
  certificadoAtual: null,
  tipoAtivo: TIPOS_CERTIFICADO.BATISMO
};

const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
const $$ = (seletor, raiz = document) =>
  Array.from(raiz.querySelectorAll(seletor));

document.addEventListener("DOMContentLoaded", iniciarModuloCertificados);

async function iniciarModuloCertificados() {
  aplicarIdentidadeUsuario?.();
  configurarEventos();
  abrirAba("batismo");
  await carregarDadosIniciais();
  atualizarPreview("batismo");
}

function configurarEventos() {
  $$(".aba-certificado").forEach((botao) => {
    botao.addEventListener("click", () => abrirAba(botao.dataset.aba));
  });

  $("#botaoSair")?.addEventListener("click", () => {
    if (typeof CHAVE_SESSAO !== "undefined") {
      sessionStorage.removeItem(CHAVE_SESSAO);
    }
    window.location.href = "../index.html";
  });

  configurarPesquisaMembro({
    campoPesquisa: "#pesquisaMembroBatismo",
    botaoPesquisa: "#botaoPesquisarMembroBatismo",
    areaResultados: "#resultadosMembrosBatismo",
    formulario: "#formBatismo",
    tipo: TIPOS_CERTIFICADO.BATISMO
  });

  configurarPesquisaMembro({
    campoPesquisa: "#pesquisaMembro",
    botaoPesquisa: "#botaoPesquisarMembro",
    areaResultados: "#resultadosMembros",
    formulario: "#formConsagracao",
    tipo: TIPOS_CERTIFICADO.CONSAGRACAO
  });

  $("#formBatismo")?.addEventListener("input", () => {
    if (ESTADO_CERTIFICADOS.tipoAtivo === TIPOS_CERTIFICADO.BATISMO) {
      atualizarPreview("batismo");
    }
  });

  $("#formConsagracao")?.addEventListener("input", () => {
    if (ESTADO_CERTIFICADOS.tipoAtivo === TIPOS_CERTIFICADO.CONSAGRACAO) {
      atualizarPreview("consagracao");
    }
  });

  $("#formBatismo")?.addEventListener("submit", (evento) =>
    registrarEImprimir(evento, TIPOS_CERTIFICADO.BATISMO)
  );

  $("#formConsagracao")?.addEventListener("submit", (evento) =>
    registrarEImprimir(evento, TIPOS_CERTIFICADO.CONSAGRACAO)
  );

  $$('[data-visualizar]').forEach((botao) => {
    botao.addEventListener("click", () => atualizarPreview(botao.dataset.visualizar));
  });

  $("#filtroHistorico")?.addEventListener("input", renderizarHistorico);
  window.addEventListener("resize", atualizarEscalaPreview);
}

function configurarPesquisaMembro(configuracao) {
  const campo = $(configuracao.campoPesquisa);
  const botao = $(configuracao.botaoPesquisa);

  botao?.addEventListener("click", () => pesquisarMembro(configuracao));
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

    ESTADO_CERTIFICADOS.configuracoes = dados?.configuracoes || {};
    ESTADO_CERTIFICADOS.arquivos = dados?.arquivos || {};
    ESTADO_CERTIFICADOS.cargos = Array.isArray(dados?.cargos) ? dados.cargos : [];
    ESTADO_CERTIFICADOS.historico = Array.isArray(historico?.certificados)
      ? historico.certificados
      : [];

    preencherCargos();
    preencherPadroes();
    renderizarHistorico();
    definirMensagem("Módulo carregado.", "success");

    setTimeout(() => {
      const mensagem = $("#mensagemModulo");
      if (mensagem) mensagem.hidden = true;
    }, 1800);
  } catch (erro) {
    definirMensagem(erro?.message || "Não foi possível carregar o módulo.", "error");
  }
}

function preencherCargos() {
  const select = $("#formConsagracao [name='cargo']");
  if (!select) return;

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

  [$("#formBatismo"), $("#formConsagracao")].forEach((formulario) => {
    if (!formulario) return;

    if (formulario.elements.pastor) {
      formulario.elements.pastor.value =
        configuracoes.pastorPresidente || configuracoes.pastorLocal || "";
    }

    if (formulario.elements.local) {
      formulario.elements.local.value = [
        configuracoes.cidadeIgreja,
        configuracoes.estadoIgreja
      ].filter(Boolean).join(" - ");
    }

    if (formulario.elements.congregacao) {
      formulario.elements.congregacao.value = configuracoes.congregacaoPadrao || "";
    }
  });
}

function abrirAba(aba) {
  const tipo = aba === "consagracao"
    ? TIPOS_CERTIFICADO.CONSAGRACAO
    : aba === "historico"
      ? TIPOS_CERTIFICADO.HISTORICO
      : TIPOS_CERTIFICADO.BATISMO;

  ESTADO_CERTIFICADOS.tipoAtivo = tipo;

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

  const areaPreview = $("#areaPreviewCertificado");
  if (areaPreview) areaPreview.hidden = tipo === TIPOS_CERTIFICADO.HISTORICO;

  if (tipo === TIPOS_CERTIFICADO.HISTORICO) {
    renderizarHistorico();
    return;
  }

  atualizarPreview(aba);
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

    const membros = Array.isArray(resposta?.membros) ? resposta.membros : [];
    mostrarResultadosMembros(membros, configuracao);
    definirMensagem(`${membros.length} resultado(s) encontrado(s).`, "success");
  } catch (erro) {
    definirMensagem(erro?.message || "Erro ao pesquisar membro.", "error");
  }
}

function mostrarResultadosMembros(membros, configuracao) {
  const area = $(configuracao.areaResultados);
  if (!area) return;

  area.innerHTML = "";
  area.hidden = false;

  if (!membros.length) {
    area.innerHTML = '<div class="historico-vazio">Nenhum membro encontrado.</div>';
    return;
  }

  membros.forEach((membro) => {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "resultado-membro";
    botao.innerHTML = `
      <span>
        <strong>${esc(membro.nomeCompleto || membro.nome || "")}</strong><br>
        ${esc(membro.congregacao || "Sem congregação")}
      </span>
      <span>
        ${esc(membro.numeroCarteirinha || membro.codigoMembro || membro.id || "")}<br>
        ${esc(membro.situacao || "")}
      </span>
    `;
    botao.addEventListener("click", () => selecionarMembro(membro, configuracao));
    area.appendChild(botao);
  });
}

function selecionarMembro(membro, configuracao) {
  const formulario = $(configuracao.formulario);
  const area = $(configuracao.areaResultados);
  const campoPesquisa = $(configuracao.campoPesquisa);
  if (!formulario) return;

  atribuirCampo(formulario, "idMembro", membro.id || membro.idMembro || "");
  atribuirCampo(formulario, "codigoMembro", membro.codigoMembro || membro.codigo || "");
  atribuirCampo(formulario, "numeroCarteirinha", membro.numeroCarteirinha || "");
  atribuirCampo(formulario, "nome", membro.nomeCompleto || membro.nome || "");
  atribuirCampo(formulario, "sexo", membro.sexo || "");
  atribuirCampo(formulario, "dataNascimento", membro.dataNascimento || "");
  atribuirCampo(formulario, "nomePai", membro.nomePai || "");
  atribuirCampo(formulario, "nomeMae", membro.nomeMae || "");

  if (membro.congregacao) atribuirCampo(formulario, "congregacao", membro.congregacao);
  if (area) area.hidden = true;
  if (campoPesquisa) campoPesquisa.value = membro.nomeCompleto || membro.nome || "";

  atualizarPreview(configuracao.tipo === TIPOS_CERTIFICADO.CONSAGRACAO
    ? "consagracao"
    : "batismo");
}

function atribuirCampo(formulario, nome, valor) {
  if (formulario.elements[nome]) formulario.elements[nome].value = valor ?? "";
}

function obterDadosFormulario(formulario, tipo) {
  const dados = Object.fromEntries(new FormData(formulario).entries());
  dados.tipo = tipo;
  return dados;
}

async function registrarEImprimir(evento, tipo) {
  evento.preventDefault();

  const formulario = evento.currentTarget;
  const botao = formulario.querySelector('[type="submit"]');

  if (!formulario.reportValidity()) return;
  if (!String(formulario.elements.idMembro?.value || "").trim()) {
    definirMensagem("Pesquise e selecione um membro antes de registrar o certificado.", "error");
    return;
  }

  const dados = obterDadosFormulario(formulario, tipo);
  definirMensagem("Registrando certificado...", "info");
  if (botao) botao.disabled = true;

  try {
    const resposta = await chamarApi({ acao: "emitirCertificado", dados });
    const registrado = resposta?.certificado || {};

    const completos = {
      ...dados,
      ...registrado,
      tipo,
      numero: registrado.numero || dados.numero || "",
      tokenPublico: registrado.tokenPublico || registrado.token || dados.tokenPublico || "",
      linkDigital:
        registrado.linkDigital ||
        registrado.urlDigital ||
        registrado.link ||
        dados.linkDigital ||
        ""
    };

    ESTADO_CERTIFICADOS.certificadoAtual = completos;
    atualizarPreview(tipo === TIPOS_CERTIFICADO.CONSAGRACAO ? "consagracao" : "batismo", completos);
    definirMensagem(`${completos.numero || "Certificado"} registrado com sucesso.`, "success");
    await recarregarHistorico();

    setTimeout(() => imprimirCertificado(completos), 350);
  } catch (erro) {
    definirMensagem(erro?.message || "Não foi possível registrar o certificado.", "error");
  } finally {
    if (botao) botao.disabled = false;
  }
}

function atualizarPreview(tipo, dadosForcados) {
  const tipoApi = tipo === "consagracao"
    ? TIPOS_CERTIFICADO.CONSAGRACAO
    : TIPOS_CERTIFICADO.BATISMO;

  const formulario = tipoApi === TIPOS_CERTIFICADO.CONSAGRACAO
    ? $("#formConsagracao")
    : $("#formBatismo");
  const alvo = $("#previewCertificado");

  if (!alvo || (!formulario && !dadosForcados)) return;

  const dadosFormulario = dadosForcados || obterDadosFormulario(formulario, tipoApi);
  const dados = normalizarDadosCertificado({ ...dadosFormulario, tipo: tipoApi });

  alvo.dataset.tipo = tipoApi.toLowerCase();
  alvo.innerHTML = renderizarCertificado(dados);

  requestAnimationFrame(() => {
    atualizarEscalaPreview();
    ajustarTipografiaCertificado(alvo);
  });
}

/*
 * MOTOR ÚNICO
 *
 * Batismo e Consagração passam obrigatoriamente por esta função.
 * Não existe mais um certificado montado por HTML e outro por placeholders.
 */
function renderizarCertificado(dados) {
  const tipo = dados.tipo === TIPOS_CERTIFICADO.CONSAGRACAO
    ? TIPOS_CERTIFICADO.CONSAGRACAO
    : TIPOS_CERTIFICADO.BATISMO;

  const modelo = MODELOS_CERTIFICADO[tipo];
  const partesData = obterPartesDataCertificado(dados.dataCerimonia || dados.data);
  const campos = [
    criarCampo("nome", dados.nome, modelo.campos.nome, "certificado-dado-nome"),
    criarCampo("cidade", obterCidadeCertificado(dados), modelo.campos.cidade, "certificado-dado-cidade"),
    criarCampo("dia", partesData.dia, modelo.campos.dia, "certificado-dado-data"),
    criarCampo("mes", partesData.mes, modelo.campos.mes, "certificado-dado-data"),
    criarCampo("ano", partesData.ano, modelo.campos.ano, "certificado-dado-data"),
    criarCampo("registro", dados.numero, modelo.campos.registro, "certificado-dado-registro")
  ];

  if (tipo === TIPOS_CERTIFICADO.CONSAGRACAO) {
    campos.push(
      criarCampo("cargo", dados.cargo, modelo.campos.cargo, "certificado-dado-cargo")
    );
  }

  const assinatura = obterCaminhoAssinatura(dados);
  const linkDigital = construirLinkCertificadoDigital(dados);
  const qrCode = construirUrlImagemQr(linkDigital);

  return `
    <article
      class="certificado-canvas ${modelo.classe}"
      data-modelo="${tipo.toLowerCase()}"
      aria-label="${tipo === TIPOS_CERTIFICADO.CONSAGRACAO
        ? "Certificado de Consagração"
        : "Certificado de Batismo"}"
    >
      <img
        class="certificado-imagem-base"
        src="${escAttr(modelo.imagem)}"
        alt=""
        aria-hidden="true"
      >

      ${campos.join("")}

      <div
        class="certificado-dado certificado-dado-assinatura"
        style="${estiloCoordenadas(modelo.campos.assinatura)}"
      >
        ${assinatura
          ? `<img src="${escAttr(assinatura)}" alt="Assinatura do Pastor Presidente">`
          : ""}
      </div>

      <!--
        O fundo branco cobre qualquer QR ilustrativo que ainda exista no PNG
        antigo do Batismo. Assim somente o QR público gerado pelo sistema fica
        visível, sem alterar a arte-base nesta etapa.
      -->
      <div
        class="certificado-dado certificado-dado-qrcode"
        style="${estiloCoordenadas(modelo.campos.qrcode)}"
      >
        <span class="certificado-qrcode-fundo" aria-hidden="true"></span>
        <img src="${escAttr(qrCode)}" alt="QR Code para baixar o certificado digital">
      </div>
    </article>
  `;
}

function normalizarDadosCertificado(dados) {
  const tipo = String(dados.tipo || "").toUpperCase() === TIPOS_CERTIFICADO.CONSAGRACAO
    ? TIPOS_CERTIFICADO.CONSAGRACAO
    : TIPOS_CERTIFICADO.BATISMO;

  return {
    ...dados,
    tipo,
    nome: limparPlaceholder(dados.nome || dados.nomeCompleto),
    cargo: limparPlaceholder(dados.cargo),
    numero: limparPlaceholder(dados.numero || dados.numeroCertificado),
    tokenPublico: limparPlaceholder(dados.tokenPublico || dados.token)
  };
}

function limparPlaceholder(valor) {
  const texto = String(valor ?? "").trim();

  if (!texto) return "";
  if (/^\{[^}]+\}$/.test(texto)) return "";
  if (/^(NOME COMPLETO|CARGO|CARGO MINISTERIAL|NÚMERO DO CERTIFICADO|NUMERO_CERTIFICADO|PRÉVIA)$/i.test(texto)) {
    return "";
  }

  return texto;
}

function criarCampo(nome, conteudo, coordenadas, classeExtra) {
  if (!coordenadas) return "";

  return `
    <div
      class="certificado-dado ${classeExtra}"
      data-campo="${escAttr(nome)}"
      style="${estiloCoordenadas(coordenadas)}"
    >${esc(conteudo || "")}</div>
  `;
}

function estiloCoordenadas(campo) {
  return [
    `left:${campo.x}%`,
    `top:${campo.y}%`,
    `width:${campo.largura}%`,
    `height:${campo.altura}%`
  ].join(";");
}

function atualizarEscalaPreview() {
  const folha = $("#previewCertificado");
  const canvas = $(".certificado-canvas", folha);
  if (!folha || !canvas) return;

  const escala = folha.clientWidth / TAMANHO_CANVAS_CERTIFICADO.largura;
  canvas.style.setProperty("--certificado-escala", String(escala));
}

function ajustarTipografiaCertificado(raiz) {
  ajustarTextoParaCaber($(".certificado-dado-nome", raiz), 61, 34);
  ajustarTextoParaCaber($(".certificado-dado-cargo", raiz), 38, 24);
}

function ajustarTextoParaCaber(elemento, tamanhoMaximo, tamanhoMinimo) {
  if (!elemento) return;

  let tamanho = tamanhoMaximo;
  elemento.style.fontSize = `${tamanho}px`;

  while (
    tamanho > tamanhoMinimo &&
    (elemento.scrollWidth > elemento.clientWidth ||
      elemento.scrollHeight > elemento.clientHeight)
  ) {
    tamanho -= 1;
    elemento.style.fontSize = `${tamanho}px`;
  }
}

function obterCidadeCertificado(dados) {
  const configuracoes = ESTADO_CERTIFICADOS.configuracoes || {};
  const cidade = dados.cidade || dados.local || configuracoes.cidadeIgreja || "CIDADE";
  return String(cidade).split("-")[0].trim();
}

function obterPartesDataCertificado(valor) {
  if (!valor) {
    return { dia: "", mes: "", ano: "", extenso: "" };
  }

  const data = new Date(`${String(valor).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(data.getTime())) {
    return { dia: "", mes: "", ano: "", extenso: "" };
  }

  const mes = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(data);
  return {
    dia: String(data.getDate()),
    mes,
    ano: String(data.getFullYear()),
    extenso: new Intl.DateTimeFormat("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(data)
  };
}

function obterCaminhoAssinatura(dados) {
  const arquivos = ESTADO_CERTIFICADOS.arquivos || {};
  const configuracoes = ESTADO_CERTIFICADOS.configuracoes || {};

  return dados.assinatura ||
    arquivos.assinatura ||
    arquivos.assinaturaPastor ||
    configuracoes.assinaturaPastor ||
    "../assets/assinaturas/assinatura-pastor-presidente.png";
}

function construirLinkCertificadoDigital(dados) {
  const linkInformado = String(
    dados.linkDigital || dados.urlDigital || dados.link || ""
  ).trim();
  if (linkInformado) return linkInformado;

  const token = String(dados.tokenPublico || dados.token || "").trim();
  const url = new URL("../certificado-digital/certificado-digital.html", window.location.href);

  if (token) {
    url.searchParams.set("token", token);
  } else {
    url.searchParams.set("modo", "previa");
  }

  return url.href;
}

function construirUrlImagemQr(conteudo) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=8&data=${encodeURIComponent(conteudo)}`;
}

function imprimirCertificado(dados) {
  ESTADO_CERTIFICADOS.certificadoAtual = dados || ESTADO_CERTIFICADOS.certificadoAtual;
  const folha = $("#previewCertificado");
  if (!folha) return;

  folha.classList.add("certificado-para-impressao");
  window.print();
  setTimeout(() => folha.classList.remove("certificado-para-impressao"), 500);
}

async function recarregarHistorico() {
  const resposta = await chamarApi({ acao: "listarCertificados" });
  ESTADO_CERTIFICADOS.historico = Array.isArray(resposta?.certificados)
    ? resposta.certificados
    : [];
  renderizarHistorico();
}

function renderizarHistorico() {
  const corpo = $("#corpoHistorico");
  if (!corpo) return;

  const filtro = normalizar($("#filtroHistorico")?.value || "");
  const itens = ESTADO_CERTIFICADOS.historico.filter((item) =>
    normalizar(`${item.numero || ""} ${item.nome || item.nomeCompleto || ""} ${item.tipo || ""} ${item.cargo || ""}`).includes(filtro)
  );

  corpo.innerHTML = "";

  if (!itens.length) {
    corpo.innerHTML = '<tr><td colspan="6" class="historico-vazio">Nenhum certificado encontrado.</td></tr>';
    return;
  }

  itens.forEach((item) => {
    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td><strong>${esc(item.numero || "")}</strong></td>
      <td>${esc(nomeTipoCertificado(item.tipo))}</td>
      <td>${esc(item.nome || item.nomeCompleto || "")}</td>
      <td>${esc(dataBr(item.dataCerimonia || item.data))}</td>
      <td>${esc(item.emitidoPor || "")}</td>
      <td><button class="botao-reimprimir" type="button">Reimprimir</button></td>
    `;
    $("button", linha)?.addEventListener("click", () => reimprimir(item));
    corpo.appendChild(linha);
  });
}

function nomeTipoCertificado(tipo) {
  return String(tipo || "").toUpperCase() === TIPOS_CERTIFICADO.CONSAGRACAO
    ? "Consagração"
    : "Batismo";
}

function reimprimir(item) {
  const aba = String(item.tipo || "").toUpperCase() === TIPOS_CERTIFICADO.CONSAGRACAO
    ? "consagracao"
    : "batismo";

  abrirAba(aba);
  atualizarPreview(aba, item);
  setTimeout(() => imprimirCertificado(item), 300);
}

function definirMensagem(texto, tipo) {
  const elemento = $("#mensagemModulo");
  if (!elemento) return;

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
  if (!valor) return "";
  const partes = String(valor).slice(0, 10).split("-");
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : String(valor);
}

function esc(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, (caractere) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[caractere]);
}

function escAttr(valor) {
  return esc(valor);
}
