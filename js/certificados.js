"use strict";

/* =========================================================
   CERTIFICADOS — VIDAS RENOVADAS GESTÃO
   Arquivo oficial: js/certificados.js

   Arquitetura desta versão:
   - formulários separados para Batismo e Consagração;
   - uma única área de pré-visualização: #previewCertificado;
   - um único template visual, com conteúdo variável por tipo;
   - histórico e reimpressão preservados.
   ========================================================= */

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
  tipoEmImpressao: null
};

const $ = (seletor, raiz = document) => raiz.querySelector(seletor);

const $$ = (seletor, raiz = document) =>
  Array.from(raiz.querySelectorAll(seletor));

function obterAuthCertificados() {
  const auth = window.VRGAuth || window.Auth;

  if (!auth || typeof auth.chamarApi !== "function") {
    throw new Error(
      "O módulo de autenticação e API não foi carregado corretamente."
    );
  }

  return auth;
}

document.addEventListener(
  "DOMContentLoaded",
  iniciarModuloCertificados
);

document.addEventListener("DOMContentLoaded", iniciarModuloCertificados);

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
  sincronizarAbaInicial();

  await carregarDadosIniciais();

  atualizarPreviewAtivo();
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

    window.location.href = "index.html";
  });

  Object.values(CONFIGURACAO_TIPOS_CERTIFICADO).forEach((configuracao) => {
    configurarPesquisaMembro(configuracao);
    configurarFormularioCertificado(configuracao);
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

function configurarFormularioCertificado(configuracao) {
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

function sincronizarAbaInicial() {
  const abaAtiva = $(".aba-certificado.active")?.dataset.aba;
  const tipo = normalizarTipoInterface(abaAtiva);

  if (tipo) {
    ESTADO_CERTIFICADOS.tipoAtivo = tipo;
  }
}

/* =========================================================
   CARREGAMENTO INICIAL
   ========================================================= */

async function carregarDadosIniciais() {
  definirMensagem("Carregando dados do módulo...", "info");

  try {
    const auth = obterAuthCertificados();

const [dados, historico] = await Promise.all([
  auth.chamarApi({
    acao: "obterDadosCertificados"
  }),
  auth.chamarApi({
    acao: "listarCertificados"
  })
]);

    ESTADO_CERTIFICADOS.configuracoes = dados.configuracoes || {};
    ESTADO_CERTIFICADOS.arquivos = dados.arquivos || {};
    ESTADO_CERTIFICADOS.cargos = Array.isArray(dados.cargos)
      ? dados.cargos
      : [];
    ESTADO_CERTIFICADOS.historico = Array.isArray(historico.certificados)
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

  Object.values(CONFIGURACAO_TIPOS_CERTIFICADO).forEach((configuracao) => {
    const formulario = $(configuracao.formulario);

    if (!formulario) {
      return;
    }

    definirValorCampoFormulario(
      formulario,
      "pastor",
      configuracoes.pastorPresidente ||
      configuracoes.pastorLocal ||
      ""
    );

    definirValorCampoFormulario(
      formulario,
      "local",
      [
        configuracoes.cidadeIgreja,
        configuracoes.estadoIgreja
      ]
        .filter(Boolean)
        .join(" - ")
    );

    definirValorCampoFormulario(
      formulario,
      "congregacao",
      configuracoes.congregacaoPadrao || ""
    );
  });
}

function definirValorCampoFormulario(formulario, nome, valor) {
  const campo = formulario.elements.namedItem(nome);

  if (campo && !String(campo.value || "").trim()) {
    campo.value = valor;
  }
}

/* =========================================================
   ABAS
   ========================================================= */

function abrirAba(aba) {
  const tipo = normalizarTipoInterface(aba);

  if (!tipo) {
    return;
  }

  ESTADO_CERTIFICADOS.tipoAtivo = tipo;

  $$(".aba-certificado").forEach((botao) => {
    const ativa = normalizarTipoInterface(botao.dataset.aba) === tipo;

    botao.classList.toggle("active", ativa);
    botao.setAttribute("aria-selected", String(ativa));
  });

  $$(".painel-certificado").forEach((painel) => {
    const ativo = normalizarTipoInterface(painel.dataset.painel) === tipo;

    painel.classList.toggle("active", ativo);
    painel.hidden = !ativo;
  });

  const areaPreview = $("#areaPreviewCertificado");

  if (areaPreview) {
    areaPreview.hidden = tipo === TIPOS_CERTIFICADO.HISTORICO;
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
  const tipoNormalizado = normalizarTipoInterface(tipo);

  return CONFIGURACAO_TIPOS_CERTIFICADO[tipoNormalizado] || null;
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
    const resposta = await 
      obterAuthCertificados().chamarApi({
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
  const campoPesquisa = $(configuracao.campoPesquisa);

  if (!formulario) {
    return;
  }

  const nome = membro.nomeCompleto || membro.nome || "";
  const codigoMembro = membro.codigo || membro.id || membro.idMembro || "";
  const numeroCarteirinha =
    membro.numeroCarteirinha || membro.numero || codigoMembro || "";
  const congregacao =
    membro.congregacao || membro.nomeCongregacao || "";

  preencherCampoSeExistir(formulario, "idMembro", codigoMembro);
  preencherCampoSeExistir(formulario, "codigoMembro", codigoMembro);
  preencherCampoSeExistir(
    formulario,
    "numeroCarteirinha",
    numeroCarteirinha
  );
  preencherCampoSeExistir(formulario, "nome", nome);
  preencherCampoSeExistir(formulario, "sexo", membro.sexo || "");
  preencherCampoSeExistir(
    formulario,
    "dataNascimento",
    membro.dataNascimento || ""
  );
  preencherCampoSeExistir(
    formulario,
    "nomePai",
    membro.nomePai || membro.pai || ""
  );
  preencherCampoSeExistir(
    formulario,
    "nomeMae",
    membro.nomeMae || membro.mae || ""
  );

  if (congregacao) {
    preencherCampoSeExistir(formulario, "congregacao", congregacao);
  }

  if (area) {
    area.hidden = true;
  }

  if (campoPesquisa) {
    campoPesquisa.value = numeroCarteirinha || nome;
  }

  const tipo = normalizarTipoInterface(configuracao.tipoApi);
  ESTADO_CERTIFICADOS.tipoAtivo = tipo;
  atualizarPreviewAtivo();

  definirMensagem(
    `${nome || "Membro"} selecionado com sucesso.`,
    "success"
  );
}

function preencherCampoSeExistir(formulario, nome, valor) {
  const campo = formulario.elements.namedItem(nome);

  if (campo) {
    campo.value = valor ?? "";
  }
}

/* =========================================================
   DADOS DO FORMULÁRIO
   ========================================================= */

function obterDadosFormulario(formulario, tipo) {
  const dadosFormulario = new FormData(formulario);
  const dados = Object.fromEntries(dadosFormulario.entries());

  dados.tipo = String(tipo || "").toUpperCase();

  Object.keys(dados).forEach((chave) => {
    if (typeof dados[chave] === "string") {
      dados[chave] = dados[chave].trim();
    }
  });

  return dados;
}

function obterDadosTipoAtivo() {
  const configuracao = obterConfiguracaoTipo();

  if (!configuracao) {
    return null;
  }

  const formulario = $(configuracao.formulario);

  if (!formulario) {
    return null;
  }

  return obterDadosFormulario(formulario, configuracao.tipoApi);
}

/* =========================================================
   REGISTRO E IMPRESSÃO
   ========================================================= */

async function registrarEImprimir(evento, tipo) {
  evento.preventDefault();

  const formulario = evento.currentTarget;
  const botaoEnviar = formulario.querySelector('button[type="submit"]');

  if (!formulario.reportValidity()) {
    return;
  }

  const idMembro =
    formulario.elements.namedItem("idMembro")?.value.trim() ||
    formulario.elements.namedItem("codigoMembro")?.value.trim() ||
    "";

  if (!idMembro) {
    definirMensagem(
      "Pesquise e selecione um membro antes de registrar o certificado.",
      "error"
    );
    return;
  }

  const dados = obterDadosFormulario(formulario, tipo);
  const tipoInterface = normalizarTipoInterface(tipo);

  ESTADO_CERTIFICADOS.tipoAtivo = tipoInterface;

  definirMensagem("Registrando certificado...", "info");

  if (botaoEnviar) {
    botaoEnviar.disabled = true;
  }

  try {
    const resposta = await obterAuthCertificados().chamarApi({
  acao: "emitirCertificado",
  dados
});

    const certificadoRegistrado = resposta.certificado || {};

    const dadosCompletos = {
      ...dados,
      ...certificadoRegistrado,
      tipo: tipo.toUpperCase(),
      numero: certificadoRegistrado.numero || dados.numero || ""
    };

    ESTADO_CERTIFICADOS.certificadoAtual = dadosCompletos;

    atualizarPreview(tipoInterface, dadosCompletos);

    definirMensagem(
      `${dadosCompletos.numero || "Certificado"} registrado com sucesso.`,
      "success"
    );

    await recarregarHistorico();

    imprimirCertificado(tipoInterface);
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

function imprimirCertificado(tipo = ESTADO_CERTIFICADOS.tipoAtivo) {
  const alvo = obterAlvoPreview();

  if (!alvo || !alvo.innerHTML.trim()) {
    definirMensagem(
      "Gere a pré-visualização antes de imprimir.",
      "error"
    );
    return;
  }

  const tipoNormalizado = normalizarTipoInterface(tipo);

  ESTADO_CERTIFICADOS.tipoEmImpressao = tipoNormalizado;
  document.body.dataset.imprimindoCertificado = tipoNormalizado;
  alvo.classList.add("certificado-para-impressao");

  setTimeout(() => {
    window.print();
  }, 250);
}

function limparEstadoImpressao() {
  ESTADO_CERTIFICADOS.tipoEmImpressao = null;

  delete document.body.dataset.imprimindoCertificado;

  obterAlvoPreview()?.classList.remove("certificado-para-impressao");
}

/* =========================================================
   PRÉ-VISUALIZAÇÃO ÚNICA
   ========================================================= */

function atualizarPreviewAtivo() {
  if (ESTADO_CERTIFICADOS.tipoAtivo === TIPOS_CERTIFICADO.HISTORICO) {
    return;
  }

  atualizarPreview(ESTADO_CERTIFICADOS.tipoAtivo);
}

function atualizarPreview(tipo, dadosForcados) {
  const tipoNormalizado = normalizarTipoInterface(tipo);
  const configuracao = obterConfiguracaoTipo(tipoNormalizado);
  const alvo = obterAlvoPreview();

  if (!configuracao || !alvo) {
    return;
  }

  const formulario = $(configuracao.formulario);

  if (!formulario && !dadosForcados) {
    return;
  }

  ESTADO_CERTIFICADOS.tipoAtivo = tipoNormalizado;

  const dados =
    dadosForcados ||
    obterDadosFormulario(formulario, configuracao.tipoApi);

  alvo.dataset.tipo = tipoNormalizado;
  alvo.innerHTML = montarCertificado(dados);
}

function obterAlvoPreview() {
  return (
    $("#previewCertificado") ||
    $("#previewConsagracao") ||
    $("#previewBatismo")
  );
}

function montarCertificado(dados) {
  const configuracoes = ESTADO_CERTIFICADOS.configuracoes;
  const arquivos = ESTADO_CERTIFICADOS.arquivos;
  const consagracao =
    String(dados.tipo || "").toUpperCase() === "CONSAGRACAO";

  const igreja =
    configuracoes.nomeIgreja ||
    "Assembleia de Deus Ministério Vidas Renovadas";

  const caminhoLogo =
    arquivos.logo ||
    arquivos.logoIgreja ||
    "logo.png";

  const caminhoAssinatura =
    arquivos.assinatura ||
    arquivos.assinaturaPastor ||
    "";

  const logo = caminhoLogo
    ? `<img class="cert-logo" src="${escAttr(caminhoLogo)}" alt="Logo da igreja">`
    : "";

  const assinatura = caminhoAssinatura
    ? `<img class="cert-assinatura-imagem" src="${escAttr(caminhoAssinatura)}" alt="Assinatura do pastor presidente">`
    : "";

  const pastor =
    dados.pastor ||
    configuracoes.pastorPresidente ||
    configuracoes.pastorLocal ||
    "Pastor presidente";

  const cidade = obterCidadeCertificado(dados, configuracoes);
  const data = dataExtenso(dados.dataCerimonia);
  const conteudo = consagracao
    ? montarConteudoConsagracao(dados)
    : montarConteudoBatismo(dados);
  const certificadoDigital = montarBlocoCertificadoDigital(dados);

  return `
    <article class="certificado-modelo ${
      consagracao ? "certificado-consagracao" : "certificado-batismo"
    }">
      <div class="certificado-fundo-decorativo" aria-hidden="true"></div>

      <div class="certificado-conteudo">
        <header class="certificado-cabecalho">
          ${logo}
          <span class="certificado-nome-igreja">${esc(igreja)}</span>
        </header>

        <div class="certificado-ornamento certificado-ornamento-superior" aria-hidden="true"></div>

        <h1 class="certificado-titulo">${esc(conteudo.titulo)}</h1>

        <div class="certificado-ornamento certificado-ornamento-titulo" aria-hidden="true"></div>

        <p class="certificado-introducao">Certificamos que</p>

        <div class="certificado-nome">
          ${esc(dados.nome || "NOME COMPLETO")}
        </div>

        <div class="certificado-separador-nome" aria-hidden="true"></div>

        <div class="certificado-texto-principal">
          ${conteudo.textoPrincipal}
        </div>

        <blockquote class="certificado-versiculo">
          <p>“${esc(conteudo.versiculo)}”</p>
          <cite>${esc(conteudo.referencia)}</cite>
        </blockquote>

        <div class="certificado-ornamento certificado-ornamento-data" aria-hidden="true"></div>

        <p class="certificado-data-local">
          ${consagracao ? "Realizada" : "Realizado"} na cidade de
          <strong>${esc(cidade || "CIDADE")}</strong>, aos
          <strong>${esc(data || "DATA POR EXTENSO")}</strong>.
        </p>

        <footer class="certificado-rodape">
          <div class="certificado-registro">
            REGISTRO Nº
            <strong>${esc(dados.numero || "PRÉVIA")}</strong>
          </div>

          <div class="certificado-assinatura">
            ${assinatura}
            <div class="certificado-linha-assinatura"></div>
            <strong>${esc(pastor)}</strong>
            <span>Pastor Presidente</span>
          </div>

          ${certificadoDigital}
        </footer>
      </div>
    </article>
  `;
}

function montarConteudoBatismo(dados) {
  return {
    titulo: "Certificado de Batismo",
    textoPrincipal: `
      <p>
        recebeu o Santo Batismo nas Águas, por imersão, em nome do Pai,
        do Filho e do Espírito Santo, conforme o mandamento de nosso Senhor
        Jesus Cristo, tornando pública a sua fé e o compromisso de viver
        segundo os ensinamentos do Evangelho.
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
        em reconhecimento ao chamado de Deus, à sua vida cristã e ao compromisso
        assumido com a obra do Senhor, conforme os princípios das Sagradas
        Escrituras e a decisão da liderança desta igreja.
      </p>
      <p>
        Oramos para que Deus o(a) fortaleça, concedendo sabedoria, fidelidade
        e graça para exercer o ministério que lhe foi confiado.
      </p>
    `,
    versiculo:
      "Procura apresentar-te a Deus aprovado, como obreiro que não tem de que se envergonhar e que maneja bem a palavra da verdade.",
    referencia: "2 Timóteo 2:15"
  };
}

function montarBlocoCertificadoDigital(dados) {
  const caminhoQr =
    dados.qrCodeUrl ||
    dados.urlQrCode ||
    dados.qrCode ||
    "";

  if (!caminhoQr) {
    return `
      <div class="certificado-digital certificado-digital-pendente" hidden>
        <span>Baixe seu certificado digital.</span>
      </div>
    `;
  }

  return `
    <div class="certificado-digital">
      <div class="certificado-digital-texto">
        <span class="certificado-icone-celular" aria-hidden="true"></span>
        <strong>Baixe seu<br>certificado digital.</strong>
      </div>
      <img
        class="certificado-qrcode"
        src="${escAttr(caminhoQr)}"
        alt="QR Code para acessar o certificado digital"
      >
    </div>
  `;
}

function obterCidadeCertificado(dados, configuracoes) {
  const cidadeInformada =
    dados.cidade ||
    dados.local ||
    configuracoes.cidadeIgreja ||
    "";

  return String(cidadeInformada)
    .split("-")[0]
    .trim();
}

/* =========================================================
   HISTÓRICO
   ========================================================= */

async function recarregarHistorico() {
  const resposta = await chamarApi({
    acao: "listarCertificados"
  });

  ESTADO_CERTIFICADOS.historico = Array.isArray(resposta.certificados)
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

  const itens = ESTADO_CERTIFICADOS.historico.filter((item) => {
    return normalizar(
      `${item.numero || ""} ${item.nome || ""} ${item.tipo || ""} ${
        item.cargo || ""
      }`
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
