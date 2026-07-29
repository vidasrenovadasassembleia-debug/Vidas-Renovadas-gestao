"use strict";

/* ==========================================================================
   CERTIFICADOS — VERSÃO OFICIAL 1.0
   Pesquisa, emissão, histórico, reimpressão, prévia e impressão.
   ========================================================================== */

const TIPOS_CERTIFICADO = Object.freeze({
  BATISMO: "batismo",
  CONSAGRACAO: "consagracao",
  HISTORICO: "historico"
});

const CONFIGURACAO_TIPOS_CERTIFICADO = Object.freeze({
  [TIPOS_CERTIFICADO.BATISMO]: {
    tipoApi: "BATISMO",
    formulario: "#formBatismo",
    campoPesquisa: "#pesquisaMembroBatismo",
    botaoPesquisa: "#botaoPesquisarMembroBatismo",
    areaResultados: "#resultadosMembrosBatismo"
  },
  [TIPOS_CERTIFICADO.CONSAGRACAO]: {
    tipoApi: "CONSAGRACAO",
    formulario: "#formConsagracao",
    campoPesquisa: "#pesquisaMembro",
    botaoPesquisa: "#botaoPesquisarMembro",
    areaResultados: "#resultadosMembros"
  }
});

const ESTADO_CERTIFICADOS = {
  configuracoes: {},
  arquivos: {},
  cargos: [],
  historico: [],
  certificadoAtual: null,
  tipoAtivo: TIPOS_CERTIFICADO.BATISMO,
  observadorPreview: null
};

const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
const $$ = (seletor, raiz = document) =>
  Array.from(raiz.querySelectorAll(seletor));

document.addEventListener("DOMContentLoaded", iniciarModuloCertificados);

function obterAuthCertificados() {
  const auth = window.VRGAuth || window.Auth;

  if (!auth || typeof auth.chamarApi !== "function") {
    throw new Error(
      "O módulo de autenticação e API não foi carregado corretamente."
    );
  }

  return auth;
}

async function iniciarModuloCertificados() {
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
  configurarEscalaPreview();
  sincronizarAbaInicial();

  await carregarDadosIniciais();
  atualizarPreviewAtivo();
}

function configurarEventos() {
  $$(".aba-certificado").forEach((botao) => {
    botao.addEventListener("click", () => {
      abrirAba(botao.dataset.aba);
    });
  });

  Object.values(CONFIGURACAO_TIPOS_CERTIFICADO).forEach((configuracao) => {
    configurarPesquisaMembro(configuracao);
    configurarFormulario(configuracao);
  });

  $$("[data-visualizar]").forEach((botao) => {
    botao.addEventListener("click", () => {
      const tipo = normalizarTipoInterface(botao.dataset.visualizar);

      if (tipo) {
        ESTADO_CERTIFICADOS.tipoAtivo = tipo;
        atualizarPreviewAtivo();
      }
    });
  });

  $("#filtroHistorico")?.addEventListener("input", renderizarHistorico);
  window.addEventListener("afterprint", limparEstadoImpressao);
}

function configurarFormulario(configuracao) {
  const formulario = $(configuracao.formulario);

  if (!formulario) {
    return;
  }

  const atualizar = () => {
    const tipo = normalizarTipoInterface(configuracao.tipoApi);

    if (ESTADO_CERTIFICADOS.tipoAtivo === tipo) {
      atualizarPreviewAtivo();
    }
  };

  formulario.addEventListener("input", atualizar);
  formulario.addEventListener("change", atualizar);

  formulario.addEventListener("submit", (evento) => {
    registrarEImprimir(evento, configuracao.tipoApi);
  });
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

function configurarEscalaPreview() {
  const folha = $("#previewCertificado");

  if (!folha) {
    return;
  }

  const atualizarEscala = () => {
    const canvas = $(".certificado-canvas", folha);

    if (!canvas) {
      return;
    }

    const escala = folha.clientWidth / 1492;
    canvas.style.setProperty("--certificado-escala", String(escala));
  };

  ESTADO_CERTIFICADOS.observadorPreview?.disconnect();
  ESTADO_CERTIFICADOS.observadorPreview =
    new ResizeObserver(atualizarEscala);

  ESTADO_CERTIFICADOS.observadorPreview.observe(folha);
  window.addEventListener("resize", atualizarEscala);
}

function sincronizarAbaInicial() {
  const ativa = $(".aba-certificado.active")?.dataset.aba;
  const tipo = normalizarTipoInterface(ativa);

  if (tipo) {
    ESTADO_CERTIFICADOS.tipoAtivo = tipo;
  }
}

async function carregarDadosIniciais() {
  definirMensagem("Carregando dados do módulo...", "info");

  try {
    const auth = obterAuthCertificados();

    const [dados, historico] = await Promise.all([
      auth.chamarApi({ acao: "obterDadosCertificados" }),
      auth.chamarApi({ acao: "listarCertificados" })
    ]);

    ESTADO_CERTIFICADOS.configuracoes = dados.configuracoes || {};
    ESTADO_CERTIFICADOS.arquivos = dados.arquivos || {};
    ESTADO_CERTIFICADOS.cargos = Array.isArray(dados.cargos)
      ? dados.cargos
      : [];
    ESTADO_CERTIFICADOS.historico =
      Array.isArray(historico.certificados)
        ? historico.certificados
        : [];

    preencherCargos();
    preencherPadroes();
    renderizarHistorico();

    definirMensagem("Módulo carregado.", "success");

    setTimeout(() => {
      const mensagem = $("#mensagemModulo");

      if (mensagem?.dataset.tipo === "success") {
        mensagem.hidden = true;
      }
    }, 1600);
  } catch (erro) {
    definirMensagem(
      erro?.message ||
        "Não foi possível carregar o módulo de certificados.",
      "error"
    );
  }
}

function preencherCargos() {
  const select = $("#formConsagracao [name='cargo']");

  if (!select) {
    return;
  }

  const atual = select.value;
  select.innerHTML = '<option value="">Selecione</option>';

  ESTADO_CERTIFICADOS.cargos.forEach((item) => {
    const texto =
      typeof item === "string"
        ? item.trim()
        : String(
            item?.nome ||
            item?.cargo ||
            item?.descricao ||
            item?.titulo ||
            item?.label ||
            item?.valor ||
            item?.value ||
            ""
          ).trim();

    if (!texto) {
      return;
    }

    const opcao = document.createElement("option");
    opcao.value = texto;
    opcao.textContent = texto;
    select.appendChild(opcao);
  });

  if (
    atual &&
    Array.from(select.options).some((opcao) => opcao.value === atual)
  ) {
    select.value = atual;
  }
}

function preencherPadroes() {
  const configuracoes = ESTADO_CERTIFICADOS.configuracoes;

  Object.values(CONFIGURACAO_TIPOS_CERTIFICADO).forEach((configuracao) => {
    const formulario = $(configuracao.formulario);

    if (!formulario) {
      return;
    }

    definirValorSeVazio(
      formulario,
      "pastor",
      configuracoes.pastorPresidente ||
      configuracoes.pastorLocal ||
      "Rogério Lemos da Silva"
    );

    definirValorSeVazio(
      formulario,
      "local",
      [
        configuracoes.cidadeIgreja,
        configuracoes.estadoIgreja
      ]
        .filter(Boolean)
        .join(" - ")
    );
  });
}

function definirValorSeVazio(formulario, nome, valor) {
  const campo = formulario.elements.namedItem(nome);

  if (campo && !String(campo.value || "").trim()) {
    campo.value = valor || "";
  }
}

function abrirAba(aba) {
  const tipo = normalizarTipoInterface(aba);

  if (!tipo) {
    return;
  }

  ESTADO_CERTIFICADOS.tipoAtivo = tipo;

  $$(".aba-certificado").forEach((botao) => {
    const ativa =
      normalizarTipoInterface(botao.dataset.aba) === tipo;

    botao.classList.toggle("active", ativa);
    botao.setAttribute("aria-selected", String(ativa));
  });

  $$(".painel-certificado").forEach((painel) => {
    const ativo =
      normalizarTipoInterface(painel.dataset.painel) === tipo;

    painel.classList.toggle("active", ativo);
    painel.hidden = !ativo;
  });

  const preview = $("#areaPreviewCertificado");

  if (preview) {
    preview.hidden = tipo === TIPOS_CERTIFICADO.HISTORICO;
  }

  if (tipo === TIPOS_CERTIFICADO.HISTORICO) {
    renderizarHistorico();
    return;
  }

  atualizarPreviewAtivo();
}

function normalizarTipoInterface(tipo) {
  const valor = normalizar(tipo).replace(/[^a-z]/g, "");

  if (valor === "batismo") {
    return TIPOS_CERTIFICADO.BATISMO;
  }

  if (valor === "consagracao") {
    return TIPOS_CERTIFICADO.CONSAGRACAO;
  }

  if (valor === "historico") {
    return TIPOS_CERTIFICADO.HISTORICO;
  }

  return "";
}

function obterConfiguracaoTipo(tipo = ESTADO_CERTIFICADOS.tipoAtivo) {
  return CONFIGURACAO_TIPOS_CERTIFICADO[
    normalizarTipoInterface(tipo)
  ] || null;
}

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
    const resposta =
      await obterAuthCertificados().chamarApi({
        acao: "pesquisarMembrosCertificado",
        termo
      });

    const membros = Array.isArray(resposta.membros)
      ? resposta.membros
      : [];

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

    botao.addEventListener("click", () => {
      selecionarMembro(membro, configuracao);
    });

    area.appendChild(botao);
  });
}

function selecionarMembro(membro, configuracao) {
  const formulario = $(configuracao.formulario);
  const area = $(configuracao.areaResultados);
  const pesquisa = $(configuracao.campoPesquisa);

  if (!formulario) {
    return;
  }

  const nome = membro.nomeCompleto || membro.nome || "";
  const codigo = membro.codigo || membro.id || membro.idMembro || "";
  const numero =
    membro.numeroCarteirinha || membro.numero || codigo || "";
  const congregacao =
    membro.congregacao || membro.nomeCongregacao || "";

  preencherCampo(formulario, "idMembro", codigo);
  preencherCampo(formulario, "codigoMembro", codigo);
  preencherCampo(formulario, "numeroCarteirinha", numero);
  preencherCampo(formulario, "nome", nome);
  preencherCampo(formulario, "sexo", membro.sexo || "");
  preencherCampo(
    formulario,
    "dataNascimento",
    membro.dataNascimento || ""
  );
  preencherCampo(
    formulario,
    "nomePai",
    membro.nomePai || membro.pai || ""
  );
  preencherCampo(
    formulario,
    "nomeMae",
    membro.nomeMae || membro.mae || ""
  );

  if (congregacao) {
    preencherCampo(formulario, "congregacao", congregacao);
  }

  if (area) {
    area.hidden = true;
  }

  if (pesquisa) {
    pesquisa.value = numero || nome;
  }

  ESTADO_CERTIFICADOS.tipoAtivo =
    normalizarTipoInterface(configuracao.tipoApi);

  atualizarPreviewAtivo();

  definirMensagem(
    `${nome || "Membro"} selecionado com sucesso.`,
    "success"
  );
}

function preencherCampo(formulario, nome, valor) {
  const campo = formulario.elements.namedItem(nome);

  if (campo) {
    campo.value = valor ?? "";
  }
}

function obterDadosFormulario(formulario, tipo) {
  const dados = Object.fromEntries(
    new FormData(formulario).entries()
  );

  dados.tipo = String(tipo || "").toUpperCase();

  Object.keys(dados).forEach((chave) => {
    if (typeof dados[chave] === "string") {
      dados[chave] = dados[chave].trim();
    }
  });

  return dados;
}

async function registrarEImprimir(evento, tipo) {
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
    definirMensagem(
      "Pesquise e selecione um membro antes de emitir o certificado.",
      "error"
    );
    return;
  }

  const dados = obterDadosFormulario(formulario, tipo);
  const tipoInterface = normalizarTipoInterface(tipo);

  ESTADO_CERTIFICADOS.tipoAtivo = tipoInterface;

  definirMensagem("Registrando certificado...", "info");

  if (botao) {
    botao.disabled = true;
  }

  try {
    const resposta =
      await obterAuthCertificados().chamarApi({
        acao: "emitirCertificado",
        dados
      });

    const registrado = resposta.certificado || {};

    const completos = {
      ...dados,
      ...registrado,
      tipo: tipo.toUpperCase(),
      numero: registrado.numero || dados.numero || ""
    };

    ESTADO_CERTIFICADOS.certificadoAtual = completos;

    atualizarPreview(tipoInterface, completos);

    definirMensagem(
      `${completos.numero || "Certificado"} registrado com sucesso.`,
      "success"
    );

    await recarregarHistorico();

    setTimeout(() => imprimirCertificado(), 400);
  } catch (erro) {
    definirMensagem(
      erro?.message || "Não foi possível registrar o certificado.",
      "error"
    );
  } finally {
    if (botao) {
      botao.disabled = false;
    }
  }
}

function atualizarPreviewAtivo() {
  if (ESTADO_CERTIFICADOS.tipoAtivo === TIPOS_CERTIFICADO.HISTORICO) {
    return;
  }

  atualizarPreview(ESTADO_CERTIFICADOS.tipoAtivo);
}

function atualizarPreview(tipo, dadosForcados) {
  const configuracao = obterConfiguracaoTipo(tipo);
  const alvo = $("#previewCertificado");

  if (!configuracao || !alvo) {
    return;
  }

  const formulario = $(configuracao.formulario);

  if (!formulario && !dadosForcados) {
    return;
  }

  const dados =
    dadosForcados ||
    obterDadosFormulario(formulario, configuracao.tipoApi);

  alvo.innerHTML = montarCertificado(dados);

  requestAnimationFrame(() => {
    atualizarEscalaImediata();
    gerarQrCode(dados);
  });
}

function atualizarEscalaImediata() {
  const folha = $("#previewCertificado");
  const canvas = $(".certificado-canvas", folha);

  if (!folha || !canvas) {
    return;
  }

  canvas.style.setProperty(
    "--certificado-escala",
    String(folha.clientWidth / 1492)
  );
}

function montarCertificado(dados) {
  const consagracao =
    String(dados.tipo || "").toUpperCase() === "CONSAGRACAO";

  const nome = String(dados.nome || "NOME COMPLETO").trim();

  const classeNome =
    nome.length > 42
      ? "nome-muito-longo"
      : nome.length > 31
        ? "nome-longo"
        : "";

  const cargo = String(dados.cargo || "CARGO").trim();
  const classeCargo = cargo.length > 18 ? "cargo-longo" : "";

  const configuracoes = ESTADO_CERTIFICADOS.configuracoes;
  const cidade =
    obterCidadeCertificado(dados, configuracoes) || "CIDADE";

  const data =
    dataExtenso(dados.dataCerimonia) || "DATA POR EXTENSO";

  const numero = dados.numero || "PRÉVIA";

  const imagemBase = consagracao
    ? "assets/certificados/certificado-consagracao-base.jpg"
    assets/certificados/certificado-batismo-base.png
  return `
    <article class="certificado-canvas ${
      consagracao
        ? "certificado-consagracao"
        : "certificado-batismo"
    }">
      <img
        class="certificado-imagem-base"
        src="${imagemBase}"
        alt="${
          consagracao
            ? "Certificado de Consagração"
            : "Certificado de Batismo"
        }"
      >

      <div
        class="
          certificado-campo-dinamico
          certificado-campo-cobertura
          certificado-campo-nome
          ${classeNome}
        "
      >
        ${esc(nome)}
      </div>

      ${
        consagracao
          ? `
            <div
              class="
                certificado-campo-dinamico
                certificado-campo-cobertura
                certificado-campo-cargo
                ${classeCargo}
              "
            >
              ${esc(cargo)}
            </div>
          `
          : ""
      }

      <div
        class="
          certificado-campo-dinamico
          certificado-campo-cobertura
          certificado-campo-data
        "
      >
        ${esc(cidade.toUpperCase())}, aos ${esc(data)}.
      </div>

      <div
        class="
          certificado-campo-dinamico
          certificado-campo-assinatura
        "
      >
        <img
          src="assets/assinaturas/assinatura-pastor-presidente.png"
          alt="Assinatura do Pastor Presidente"
        >
      </div>

      <div
        class="
          certificado-campo-dinamico
          certificado-campo-cobertura
          certificado-campo-registro
        "
      >
        ${esc(numero)}
      </div>

      <div
        id="qrCertificadoAtual"
        class="
          certificado-campo-dinamico
          certificado-campo-qr
        "
        aria-label="QR Code do certificado digital"
      ></div>
    </article>
  `;
}

function montarConteudoBatismo() {
  return {
    titulo: "Certificado de Batismo",
    textoPrincipal: `
      <p>
        recebeu o Santo Batismo nas Águas, por imersão, em nome do Pai,
        do Filho e do Espírito Santo, conforme o mandamento de nosso
        Senhor Jesus Cristo,
      </p>
      <p>
        tornando pública a sua fé e o compromisso de viver segundo os
        ensinamentos do Evangelho.
      </p>
    `,
    versiculo:
      "Quem crer e for batizado será salvo; mas quem não crer será condenado.",
    referencia: "Marcos 16:16"
  };
}

function montarConteudoConsagracao(dados) {
  const cargo = dados.cargo || "CARGO MINISTERIAL";

  return {
    titulo: "Certificado de Consagração",
    textoPrincipal: `
      <p>
        foi consagrado(a) ao ministério de
        <strong class="certificado-cargo">${esc(cargo)}</strong>,
        em reconhecimento ao chamado de Deus, à sua vida cristã e ao
        compromisso assumido com a obra do Senhor,
      </p>
      <p>
        conforme os princípios das Sagradas Escrituras e a decisão da
        liderança desta igreja. Oramos para que Deus o(a) fortaleça,
        concedendo sabedoria, fidelidade e graça para exercer o
        ministério que lhe foi confiado.
      </p>
    `,
    versiculo:
      "Procura apresentar-te a Deus aprovado, como obreiro que não tem de que se envergonhar e que maneja bem a palavra da verdade.",
    referencia: "2 Timóteo 2:15"
  };
}

function gerarQrCode(dados) {
  const alvo = $("#qrCertificadoAtual");

  if (!alvo) {
    return;
  }

  alvo.innerHTML = "";

  const link = construirLinkDigital(dados);

  if (typeof QRCode !== "function") {
    alvo.textContent = "QR";
    return;
  }

  new QRCode(alvo, {
    text: link,
    width: 100,
    height: 100,
    colorDark: "#071f3b",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M
  });
}

function construirLinkDigital(dados) {
  const url = new URL(
    "certificado-digital.html",
    window.location.href
  );

  const token = String(
    dados.tokenPublico ||
    dados.token ||
    ""
  ).trim();

  if (token) {
    url.searchParams.set("token", token);
  } else {
    url.searchParams.set("modo", "previa");
  }

  return url.href;
}

function obterCidadeCertificado(dados, configuracoes) {
  const informada =
    dados.cidade ||
    dados.local ||
    configuracoes.cidadeIgreja ||
    "";

  return String(informada).split("-")[0].trim();
}

function imprimirCertificado() {
  const alvo = $("#previewCertificado");

  if (!alvo || !alvo.innerHTML.trim()) {
    definirMensagem(
      "Gere a pré-visualização antes de imprimir.",
      "error"
    );
    return;
  }

  alvo.classList.add("certificado-para-impressao");
  setTimeout(() => window.print(), 250);
}

function limparEstadoImpressao() {
  $("#previewCertificado")?.classList.remove(
    "certificado-para-impressao"
  );
  atualizarEscalaImediata();
}

async function recarregarHistorico() {
  const resposta =
    await obterAuthCertificados().chamarApi({
      acao: "listarCertificados"
    });

  ESTADO_CERTIFICADOS.historico =
    Array.isArray(resposta.certificados)
      ? resposta.certificados
      : [];

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

  const itens = ESTADO_CERTIFICADOS.historico.filter((item) =>
    normalizar(
      `${item.numero || ""} ${item.nome || ""} ` +
      `${item.tipo || ""} ${item.cargo || ""}`
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
    String(item.tipo || "").toUpperCase() === "CONSAGRACAO"
      ? TIPOS_CERTIFICADO.CONSAGRACAO
      : TIPOS_CERTIFICADO.BATISMO;

  const dados = {
    ...item,
    tipo:
      tipo === TIPOS_CERTIFICADO.CONSAGRACAO
        ? "CONSAGRACAO"
        : "BATISMO",
    dataCerimonia: item.dataCerimonia || item.data || ""
  };

  ESTADO_CERTIFICADOS.certificadoAtual = dados;
  abrirAba(tipo);
  atualizarPreview(tipo, dados);

  setTimeout(() => imprimirCertificado(), 400);
}

function nomeTipo(tipo) {
  return String(tipo || "").toUpperCase() === "CONSAGRACAO"
    ? "Consagração"
    : "Batismo";
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

  const partes = String(valor).split("-");

  if (partes.length !== 3) {
    return "";
  }

  const data = new Date(
    Number(partes[0]),
    Number(partes[1]) - 1,
    Number(partes[2])
  );

  if (Number.isNaN(data.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  })
    .format(data)
    .toUpperCase();
}

function esc(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
