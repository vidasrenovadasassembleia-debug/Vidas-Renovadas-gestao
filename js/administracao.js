"use strict";

/* ==========================================================================
   ADMINISTRAÇÃO — CONTROLADOR PRINCIPAL
   Vidas Renovadas Gestão 2.0
   ========================================================================== */

(function (window, document) {

  const MODULOS = Object.freeze({
    usuarios: {
      titulo: "Usuários",
      descricao: "Contas, perfis, situação de acesso e último login.",
      arquivo: "js/administracao-usuarios.js",
      objetoGlobal: "VRAdministracaoUsuarios"
    },

    permissoes: {
      titulo: "Perfis e permissões",
      descricao: "Defina quais módulos e ações cada perfil pode acessar.",
      arquivo: "js/administracao-permissoes.js",
      objetoGlobal: "VRAdministracaoPermissoes"
    },

    configuracoes: {
      titulo: "Configurações",
      descricao: "Dados da igreja, documentos, arquivos e parâmetros gerais.",
      arquivo: "js/administracao-configuracoes.js",
      objetoGlobal: "VRAdministracaoConfiguracoes"
    },

    logs: {
      titulo: "Logs e auditoria",
      descricao: "Consulte ações, alterações e registros realizados no sistema.",
      arquivo: "js/administracao-logs.js",
      objetoGlobal: "VRAdministracaoLogs"
    },

    backup: {
      titulo: "Backup",
      descricao: "Execute e acompanhe as cópias de segurança do sistema.",
      arquivo: "js/administracao-backup.js",
      objetoGlobal: "VRAdministracaoBackup"
    }
  });

  const ACOES_API = Object.freeze({
    RESUMO: "obterResumoAdministracao"
  });

  const estado = {
    areaAtual: "",
    moduloAtual: null,
    scriptsCarregados: {},
    carregandoResumo: false,
    processandoConfirmacao: false,
    confirmacaoPendente: null
  };

  const elementos = {};

  function texto(valor) {
    return String(valor ?? "").trim();
  }

  function capturarElementos() {
    [
      "botaoAtualizarAdministracao",
      "avisoAdministracao",
      "resumoUsuariosAtivos",
      "resumoUsuariosBloqueados",
      "resumoLogsHoje",
      "resumoUltimoBackup",
      "secaoAreasAdministracao",
      "secaoConteudoAdministracao",
      "administracaoAreaSelo",
      "administracaoAreaTitulo",
      "administracaoAreaDescricao",
      "administracaoAreaCorpo",
      "botaoVoltarAreasAdministracao",
      "templateAdministracaoCarregando",
      "templateAdministracaoVazio",
      "dialogoConfirmacaoAdministracao",
      "tituloDialogoConfirmacaoAdministracao",
      "textoDialogoConfirmacaoAdministracao",
      "botaoCancelarConfirmacaoAdministracao",
      "botaoConfirmarAcaoAdministracao",
      "carregamentoGlobal"
    ].forEach(function (id) {
      elementos[id] = document.getElementById(id);
    });

    const faltantes = Object.entries(elementos)
      .filter(function ([, elemento]) {
        return !elemento;
      })
      .map(function ([id]) {
        return id;
      });

    if (faltantes.length) {
      console.error(
        "[ADMINISTRAÇÃO] Elementos ausentes:",
        faltantes.join(", ")
      );

      return false;
    }

    return true;
  }

  function obterAuth() {
    const auth = window.VRGAuth || window.Auth;

    if (!auth || typeof auth.chamarApi !== "function") {
      throw new Error(
        "O módulo de autenticação/API não foi carregado."
      );
    }

    return auth;
  }

  function mostrarAviso(mensagem, tipo = "aviso") {
    elementos.avisoAdministracao.textContent = texto(mensagem);
    elementos.avisoAdministracao.className = `alerta ${tipo}`;
    elementos.avisoAdministracao.hidden = !texto(mensagem);
  }

  function limparAviso() {
    elementos.avisoAdministracao.textContent = "";
    elementos.avisoAdministracao.className = "alerta";
    elementos.avisoAdministracao.hidden = true;
  }

  function definirCarregamentoGlobal(
    ativo,
    mensagem = "Carregando..."
  ) {
    elementos.carregamentoGlobal.classList.toggle(
      "ativo",
      Boolean(ativo)
    );

    elementos.carregamentoGlobal.setAttribute(
      "aria-hidden",
      ativo ? "false" : "true"
    );

    const textoCarregamento =
      elementos.carregamentoGlobal.querySelector(
        ".carregamento-caixa span:last-child"
      );

    if (textoCarregamento && ativo) {
      textoCarregamento.textContent = mensagem;
    }
  }

  function renderizarCarregamentoArea() {
    elementos.administracaoAreaCorpo.innerHTML = "";
    elementos.administracaoAreaCorpo.appendChild(
      elementos.templateAdministracaoCarregando.content.cloneNode(true)
    );
  }

  function renderizarEstadoVazio(
    titulo = "Nenhum registro encontrado",
    descricao = "Não existem informações disponíveis para esta área."
  ) {
    elementos.administracaoAreaCorpo.innerHTML = "";

    const conteudo =
      elementos.templateAdministracaoVazio.content.cloneNode(true);

    const tituloElemento = conteudo.querySelector("strong");
    const descricaoElemento = conteudo.querySelector("p");

    if (tituloElemento) {
      tituloElemento.textContent = titulo;
    }

    if (descricaoElemento) {
      descricaoElemento.textContent = descricao;
    }

    elementos.administracaoAreaCorpo.appendChild(conteudo);
  }

  function marcarAreaAtiva(areaId) {
    document
      .querySelectorAll("[data-area-administracao]")
      .forEach(function (card) {
        card.classList.toggle(
          "ativo",
          card.dataset.areaAdministracao === areaId
        );
      });
  }

  function carregarScriptModulo(configuracao) {
    if (estado.scriptsCarregados[configuracao.arquivo]) {
      return Promise.resolve();
    }

    return new Promise(function (resolver, rejeitar) {
      const existente = document.querySelector(
        `script[data-modulo-administracao="${configuracao.arquivo}"]`
      );

      if (existente) {
        if (existente.dataset.carregado === "true") {
          estado.scriptsCarregados[configuracao.arquivo] = true;
          resolver();
          return;
        }

        existente.addEventListener("load", resolver, { once: true });
        existente.addEventListener("error", rejeitar, { once: true });
        return;
      }

      const script = document.createElement("script");

      script.src = `${configuracao.arquivo}?v=1`;
      script.async = true;
      script.dataset.moduloAdministracao = configuracao.arquivo;

      script.addEventListener("load", function () {
        script.dataset.carregado = "true";
        estado.scriptsCarregados[configuracao.arquivo] = true;
        resolver();
      }, { once: true });

      script.addEventListener("error", function () {
        rejeitar(
          new Error(
            "Não foi possível carregar o módulo " +
            configuracao.titulo + "."
          )
        );
      }, { once: true });

      document.head.appendChild(script);
    });
  }

  function obterModuloGlobal(configuracao) {
    const modulo = window[configuracao.objetoGlobal];

    if (
      !modulo ||
      typeof modulo.iniciar !== "function"
    ) {
      throw new Error(
        "O módulo " + configuracao.titulo +
        " não foi inicializado corretamente."
      );
    }

    return modulo;
  }

  function criarContextoModulo(areaId) {
    return Object.freeze({
      area: areaId,
      container: elementos.administracaoAreaCorpo,
      chamarApi: function (dados) {
        return obterAuth().chamarApi(dados);
      },
      mostrarAviso: mostrarAviso,
      limparAviso: limparAviso,
      definirCarregamentoGlobal: definirCarregamentoGlobal,
      confirmar: abrirConfirmacao,
      atualizarResumo: carregarResumo,
      renderizarVazio: renderizarEstadoVazio
    });
  }

  async function abrirArea(areaId) {
    const configuracao = MODULOS[areaId];

    if (!configuracao) {
      mostrarAviso(
        "A área administrativa selecionada não existe.",
        "erro"
      );
      return;
    }

    limparAviso();

    estado.areaAtual = areaId;
    estado.moduloAtual = null;

    marcarAreaAtiva(areaId);

    elementos.secaoAreasAdministracao.hidden = true;
    elementos.secaoConteudoAdministracao.hidden = false;

    elementos.administracaoAreaSelo.textContent =
      "Administração";

    elementos.administracaoAreaTitulo.textContent =
      configuracao.titulo;

    elementos.administracaoAreaDescricao.textContent =
      configuracao.descricao;

    renderizarCarregamentoArea();

    try {
      await carregarScriptModulo(configuracao);

      const modulo = obterModuloGlobal(configuracao);

      estado.moduloAtual = modulo;

      elementos.administracaoAreaCorpo.innerHTML = "";

      await modulo.iniciar(
        criarContextoModulo(areaId)
      );

    } catch (erro) {
      console.error(
        "[ADMINISTRAÇÃO] Falha ao abrir área:",
        erro
      );

      renderizarEstadoVazio(
        "Área indisponível",
        erro?.message ||
        "Não foi possível carregar esta área."
      );

      mostrarAviso(
        erro?.message ||
        "Não foi possível abrir a área administrativa.",
        "erro"
      );
    }
  }

  async function encerrarModuloAtual() {
    if (
      estado.moduloAtual &&
      typeof estado.moduloAtual.destruir === "function"
    ) {
      try {
        await estado.moduloAtual.destruir();
      } catch (erro) {
        console.warn(
          "[ADMINISTRAÇÃO] Falha ao encerrar módulo:",
          erro
        );
      }
    }

    estado.moduloAtual = null;
  }

  async function voltarAreas() {
    await encerrarModuloAtual();

    estado.areaAtual = "";

    elementos.secaoConteudoAdministracao.hidden = true;
    elementos.secaoAreasAdministracao.hidden = false;

    marcarAreaAtiva("");
    limparAviso();
  }

  function normalizarResumo(resposta) {
    const resumo =
      resposta?.resumo ||
      resposta?.dados ||
      resposta ||
      {};

    return {
      usuariosAtivos:
        resumo.usuariosAtivos ??
        resumo.totalUsuariosAtivos ??
        0,

      usuariosBloqueados:
        resumo.usuariosBloqueados ??
        resumo.totalUsuariosBloqueados ??
        0,

      logsHoje:
        resumo.logsHoje ??
        resumo.acoesHoje ??
        0,

      ultimoBackup:
        texto(
          resumo.ultimoBackup ??
          resumo.dataUltimoBackup ??
          "Nenhum backup"
        )
    };
  }

  function preencherResumo(resumo) {
    elementos.resumoUsuariosAtivos.textContent =
      String(resumo.usuariosAtivos);

    elementos.resumoUsuariosBloqueados.textContent =
      String(resumo.usuariosBloqueados);

    elementos.resumoLogsHoje.textContent =
      String(resumo.logsHoje);

    elementos.resumoUltimoBackup.textContent =
      resumo.ultimoBackup;
  }

  function preencherResumoIndisponivel() {
    elementos.resumoUsuariosAtivos.textContent = "—";
    elementos.resumoUsuariosBloqueados.textContent = "—";
    elementos.resumoLogsHoje.textContent = "—";
    elementos.resumoUltimoBackup.textContent = "—";
  }

  async function carregarResumo() {
    if (estado.carregandoResumo) {
      return;
    }

    estado.carregandoResumo = true;

    try {
      const resposta = await obterAuth().chamarApi({
        acao: ACOES_API.RESUMO
      });

      if (resposta?.sucesso === false) {
        throw new Error(
          resposta.mensagem ||
          "Não foi possível carregar o resumo administrativo."
        );
      }

      preencherResumo(
        normalizarResumo(resposta)
      );

    } catch (erro) {
      console.warn(
        "[ADMINISTRAÇÃO] Resumo indisponível:",
        erro
      );

      preencherResumoIndisponivel();

      mostrarAviso(
        erro?.message ||
        "O resumo administrativo ainda não está disponível.",
        "aviso"
      );

    } finally {
      estado.carregandoResumo = false;
    }
  }

  function abrirConfirmacao(opcoes) {
    opcoes = opcoes && typeof opcoes === "object"
      ? opcoes
      : {};

    if (typeof opcoes.aoConfirmar !== "function") {
      return Promise.reject(
        new Error(
          "A ação de confirmação não foi informada."
        )
      );
    }

    if (estado.confirmacaoPendente) {
      return Promise.reject(
        new Error(
          "Já existe uma confirmação aguardando resposta."
        )
      );
    }

    elementos.tituloDialogoConfirmacaoAdministracao.textContent =
      texto(opcoes.titulo) || "Confirmar ação";

    elementos.textoDialogoConfirmacaoAdministracao.textContent =
      texto(opcoes.mensagem) || "Confirme para continuar.";

    elementos.botaoConfirmarAcaoAdministracao.textContent =
      texto(opcoes.rotuloConfirmar) || "Confirmar";

    elementos.dialogoConfirmacaoAdministracao.hidden = false;

    return new Promise(function (resolver, rejeitar) {
      estado.confirmacaoPendente = {
        resolver: resolver,
        rejeitar: rejeitar,
        aoConfirmar: opcoes.aoConfirmar
      };

      elementos.botaoConfirmarAcaoAdministracao.focus();
    });
  }

  function fecharConfirmacao(cancelada) {
    elementos.dialogoConfirmacaoAdministracao.hidden = true;

    const pendente = estado.confirmacaoPendente;
    estado.confirmacaoPendente = null;

    if (cancelada && pendente) {
      pendente.resolver(false);
    }
  }

  async function confirmarAcaoPendente() {
    if (
      estado.processandoConfirmacao ||
      !estado.confirmacaoPendente
    ) {
      return;
    }

    estado.processandoConfirmacao = true;
    elementos.botaoConfirmarAcaoAdministracao.disabled = true;
    elementos.botaoCancelarConfirmacaoAdministracao.disabled = true;

    const pendente = estado.confirmacaoPendente;

    try {
      const resultado = await pendente.aoConfirmar();

      elementos.dialogoConfirmacaoAdministracao.hidden = true;
      estado.confirmacaoPendente = null;

      pendente.resolver(
        resultado === undefined ? true : resultado
      );

    } catch (erro) {
      console.error(
        "[ADMINISTRAÇÃO] Falha na ação confirmada:",
        erro
      );

      mostrarAviso(
        erro?.message ||
        "Não foi possível concluir a ação.",
        "erro"
      );

      pendente.rejeitar(erro);
      estado.confirmacaoPendente = null;
      elementos.dialogoConfirmacaoAdministracao.hidden = true;

    } finally {
      estado.processandoConfirmacao = false;
      elementos.botaoConfirmarAcaoAdministracao.disabled = false;
      elementos.botaoCancelarConfirmacaoAdministracao.disabled = false;
    }
  }

  function configurarEventos() {
    elementos.secaoAreasAdministracao.addEventListener(
      "click",
      function (evento) {
        const card = evento.target.closest(
          "[data-area-administracao]"
        );

        if (!card) {
          return;
        }

        abrirArea(card.dataset.areaAdministracao);
      }
    );

    elementos.botaoVoltarAreasAdministracao.addEventListener(
      "click",
      voltarAreas
    );

    elementos.botaoAtualizarAdministracao.addEventListener(
      "click",
      async function () {
        limparAviso();
        await carregarResumo();

        if (
          estado.moduloAtual &&
          typeof estado.moduloAtual.atualizar === "function"
        ) {
          try {
            await estado.moduloAtual.atualizar();
          } catch (erro) {
            mostrarAviso(
              erro?.message ||
              "Não foi possível atualizar a área atual.",
              "erro"
            );
          }
        }
      }
    );

    elementos.botaoCancelarConfirmacaoAdministracao.addEventListener(
      "click",
      function () {
        fecharConfirmacao(true);
      }
    );

    elementos.botaoConfirmarAcaoAdministracao.addEventListener(
      "click",
      confirmarAcaoPendente
    );

    document
      .querySelectorAll(
        '[data-acao="fechar-dialogo-administracao"]'
      )
      .forEach(function (elemento) {
        elemento.addEventListener(
          "click",
          function () {
            fecharConfirmacao(true);
          }
        );
      });

    document.addEventListener(
      "keydown",
      function (evento) {
        if (evento.key !== "Escape") {
          return;
        }

        if (
          !elementos.dialogoConfirmacaoAdministracao.hidden
        ) {
          fecharConfirmacao(true);
          return;
        }

        if (!elementos.secaoConteudoAdministracao.hidden) {
          voltarAreas();
        }
      }
    );
  }

  async function iniciar() {
    if (!capturarElementos()) {
      return;
    }

    configurarEventos();
    preencherResumoIndisponivel();

    await carregarResumo();
  }

  window.VRAdministracao = Object.freeze({
    iniciar: iniciar,
    abrirArea: abrirArea,
    voltarAreas: voltarAreas,
    carregarResumo: carregarResumo,
    confirmar: abrirConfirmacao,
    mostrarAviso: mostrarAviso,
    limparAviso: limparAviso
  });

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      iniciar,
      { once: true }
    );
  } else {
    iniciar();
  }

})(window, document);
