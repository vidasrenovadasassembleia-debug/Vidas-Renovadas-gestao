/**
 * ============================================================================
 * VIDAS RENOVADAS GESTÃO 2.0
 * Arquivo: js/auth.js
 * Descrição: Login Google, sessão, proteção de páginas, permissões e logout
 * ============================================================================
 *
 * Ordem obrigatória:
 *   1. js/configuracoes.js
 *   2. js/api.js
 *   3. js/auth.js
 *   4. js/app.js
 * ============================================================================
 */

"use strict";

(function (window, document) {
  const estado = {
    inicializado: false,
    googleRenderizado: false,
    autenticando: false,
    tentativasGoogle: 0,
    temporizadorRedimensionamento: null
  };

  function obterConfig() {
    if (!window.VR_CONFIG) {
      throw new Error(
        "VR_CONFIG não foi carregado. Inclua configuracoes.js antes de auth.js."
      );
    }

    return window.VR_CONFIG;
  }

  function obterApi() {
    if (!window.VR_API || typeof window.VR_API.enviar !== "function") {
      throw new Error(
        "VR_API não foi carregado. Inclua api.js antes de auth.js."
      );
    }

    return window.VR_API;
  }

  function obterApp() {
    return window.VRG || window.App || null;
  }

  function normalizarTexto(valor) {
    return String(valor ?? "")
      .trim()
      .toLocaleLowerCase("pt-BR");
  }

  function paginaAtual() {
    const arquivo = window.location.pathname.split("/").pop();
    return arquivo || obterConfig().PAGINAS.LOGIN;
  }

  function paginaPublica() {
    return obterConfig().PAGINAS.PUBLICAS.includes(paginaAtual());
  }

  function paginaProtegida() {
    const atual = paginaAtual();
    const config = obterConfig();

    if (config.PAGINAS.PROTEGIDAS.includes(atual)) {
      return true;
    }

    return !paginaPublica() && /\.html?$/i.test(atual);
  }

  function navegar(url, substituir = true) {
    const app = obterApp();

    if (app && typeof app.navegar === "function") {
      app.navegar(url, { substituir });
      return;
    }

    if (substituir) {
      window.location.replace(url);
    } else {
      window.location.href = url;
    }
  }

  function definirMensagem(mensagem = "", tipo = "") {
    const alvo = document.getElementById("mensagemLogin");
    const app = obterApp();

    if (app && typeof app.definirMensagem === "function") {
      app.definirMensagem(alvo, mensagem, tipo);
      return;
    }

    if (!alvo) return;

    alvo.textContent = mensagem;
    alvo.classList.remove("sucesso", "erro", "alerta", "info");

    if (tipo) {
      alvo.classList.add(tipo);
    }

    alvo.hidden = !mensagem;
  }

  function mostrarCarregamento(mensagem = "Carregando...") {
    const app = obterApp();

    if (app && typeof app.mostrarCarregamento === "function") {
      app.mostrarCarregamento(mensagem);
    }
  }

  function ocultarCarregamento(forcar = false) {
    const app = obterApp();

    if (app && typeof app.ocultarCarregamento === "function") {
      app.ocultarCarregamento(forcar);
    }
  }

  function salvarJSON(storage, chave, valor) {
    try {
      storage.setItem(chave, JSON.stringify(valor));
      return true;
    } catch (erro) {
      console.warn(`[AUTH] Não foi possível salvar "${chave}".`, erro);
      return false;
    }
  }

  function lerJSON(storage, chave) {
    try {
      const bruto = storage.getItem(chave);
      return bruto ? JSON.parse(bruto) : null;
    } catch (_) {
      removerChave(storage, chave);
      return null;
    }
  }

  function removerChave(storage, chave) {
    if (!chave) return;

    try {
      storage.removeItem(chave);
    } catch (erro) {
      console.warn(`[AUTH] Não foi possível remover "${chave}".`, erro);
    }
  }

  function salvarSessao(credential, usuario = {}) {
    if (!credential) {
      throw new Error("Não é possível salvar uma sessão sem credencial.");
    }

    const config = obterConfig();
    const sessao = {
      credential,
      usuario,
      criadaEm: new Date().toISOString()
    };

    salvarJSON(
      window.sessionStorage,
      config.ARMAZENAMENTO.SESSAO,
      sessao
    );

    salvarJSON(
      window.sessionStorage,
      config.ARMAZENAMENTO.USUARIO,
      usuario
    );

    window.sessionStorage.setItem(
      config.ARMAZENAMENTO.CREDENCIAL_GOOGLE,
      credential
    );

    const app = obterApp();

    if (app && typeof app.salvarUsuarioLocal === "function") {
      app.salvarUsuarioLocal(usuario, false);
    }

    return sessao;
  }

  function migrarSessaoAntiga() {
    const chavesAntigas = [
      "vidasRenovadasSessao",
      "vrg_sessao"
    ];

    for (const chave of chavesAntigas) {
      const sessaoAntiga = lerJSON(window.sessionStorage, chave);

      if (sessaoAntiga?.credential) {
        salvarSessao(
          sessaoAntiga.credential,
          sessaoAntiga.usuario || {}
        );
        removerChave(window.sessionStorage, chave);
        return sessaoAntiga;
      }
    }

    return null;
  }

  function obterSessao() {
    const config = obterConfig();
    const sessao = lerJSON(
      window.sessionStorage,
      config.ARMAZENAMENTO.SESSAO
    );

    return sessao?.credential
      ? sessao
      : migrarSessaoAntiga();
  }

  function removerSessao() {
    const config = obterConfig();

    [
      config.ARMAZENAMENTO.SESSAO,
      config.ARMAZENAMENTO.USUARIO,
      config.ARMAZENAMENTO.CREDENCIAL_GOOGLE,
      "vidasRenovadasSessao",
      "vrg_sessao",
      "vrg_usuario"
    ].forEach((chave) => {
      removerChave(window.sessionStorage, chave);
      removerChave(window.localStorage, chave);
    });

    const app = obterApp();

    if (app && typeof app.removerUsuarioLocal === "function") {
      app.removerUsuarioLocal();
    }
  }

  function usuarioAtual() {
    return obterSessao()?.usuario || null;
  }

  function usuarioAdministrador() {
    const usuario = usuarioAtual();

    if (!usuario) return false;

    const perfil = normalizarTexto(
      usuario.perfil ||
      usuario.cargo ||
      usuario.funcao
    );

    return obterConfig().PERFIS_ADMINISTRATIVOS.includes(perfil);
  }

  function usuarioTemPermissao(permissao) {
    const usuario = usuarioAtual();

    if (!usuario) return false;
    if (usuarioAdministrador()) return true;

    const procurada = normalizarTexto(permissao);

    if (!procurada) return true;

    const permissoes = Array.isArray(usuario.permissoes)
      ? usuario.permissoes.map(normalizarTexto)
      : [];

    return permissoes.includes(procurada);
  }

  function exigirSessao() {
    if (!paginaProtegida()) return true;

    if (!obterSessao()?.credential) {
      removerSessao();
      navegar(obterConfig().PAGINAS.LOGIN, true);
      return false;
    }

    return true;
  }

  function redirecionarUsuarioLogado() {
    const config = obterConfig();

    if (paginaAtual() !== config.PAGINAS.LOGIN) {
      return false;
    }

    if (!obterSessao()?.credential) {
      return false;
    }

    navegar(config.PAGINAS.DASHBOARD, true);
    return true;
  }

  function aplicarUsuarioNaInterface() {
    const usuario = usuarioAtual();

    if (!usuario) return;

    const app = obterApp();

    if (app && typeof app.atualizarUsuarioNaInterface === "function") {
      app.atualizarUsuarioNaInterface(usuario);
    }

    const nome =
      usuario.nome ||
      usuario.name ||
      usuario.email ||
      "Usuário";

    const perfil =
      usuario.perfil ||
      usuario.cargo ||
      usuario.funcao ||
      "";

    document
      .querySelectorAll(
        ".user-box, [data-nome-usuario], [data-usuario-nome]"
      )
      .forEach((elemento) => {
        elemento.textContent = nome;
      });

    document
      .querySelectorAll(
        "[data-perfil-usuario], [data-usuario-cargo]"
      )
      .forEach((elemento) => {
        elemento.textContent = perfil;
      });

    document
      .querySelectorAll("[data-usuario-email]")
      .forEach((elemento) => {
        elemento.textContent = usuario.email || "";
      });
  }

  function aplicarPermissoes() {
    if (!usuarioAtual()) return;

    document
      .querySelectorAll("[data-permissao]")
      .forEach((elemento) => {
        elemento.hidden = !usuarioTemPermissao(
          elemento.dataset.permissao || ""
        );
      });

    if (!usuarioAdministrador()) {
      document
        .querySelectorAll(
          '[href="novo-membro.html"], ' +
          '[href^="editar-membro.html"], ' +
          '[href="configuracoes.html"], ' +
          '[href="administracao.html"]'
        )
        .forEach((elemento) => {
          elemento.hidden = true;
        });
    }
  }

  async function chamarApi(conteudo, incluirCredencial = true) {
    if (!conteudo || typeof conteudo !== "object") {
      throw new TypeError("A requisição da API precisa ser um objeto.");
    }

    const { acao, ...dados } = conteudo;

    if (!acao) {
      throw new Error("A ação da API não foi informada.");
    }

    if (incluirCredencial) {
      const sessao = obterSessao();

      if (!sessao?.credential) {
        removerSessao();
        throw new Error("Sua sessão terminou. Entre novamente.");
      }

      dados.credential = sessao.credential;
    }

    try {
      return await obterApi().enviar(acao, dados);
    } catch (erro) {
      const mensagem = normalizarTexto(erro?.message);

      if (
        mensagem.includes("sessao") ||
        mensagem.includes("sessão") ||
        mensagem.includes("token") ||
        mensagem.includes("credencial") ||
        mensagem.includes("nao autorizado") ||
        mensagem.includes("não autorizado")
      ) {
        removerSessao();
      }

      throw erro;
    }
  }

  async function tratarRespostaGoogle(respostaGoogle) {
    if (estado.autenticando) return;

    const credential = respostaGoogle?.credential;

    if (!credential) {
      definirMensagem(
        "O Google não forneceu uma credencial válida.",
        "erro"
      );
      return;
    }

    estado.autenticando = true;
    mostrarCarregamento("Verificando sua conta...");
    definirMensagem("Verificando sua conta...", "info");

    try {
      const resultado = await chamarApi(
        {
          acao: "autenticar",
          credential
        },
        false
      );

      if (!resultado?.usuario) {
        throw new Error(
          "O servidor não retornou os dados do usuário."
        );
      }

      salvarSessao(credential, resultado.usuario);

      definirMensagem(
        "Acesso autorizado. Abrindo o sistema...",
        "sucesso"
      );

      navegar(obterConfig().PAGINAS.DASHBOARD, true);
    } catch (erro) {
      console.error("[AUTH] Erro de autenticação:", erro);
      removerSessao();

      const mensagem =
        erro?.message ||
        "Não foi possível autorizar esta conta.";

      definirMensagem(mensagem, "erro");

      const app = obterApp();

      if (app && typeof app.erro === "function") {
        app.erro(mensagem, "Acesso não autorizado");
      }
    } finally {
      estado.autenticando = false;
      ocultarCarregamento(true);
    }
  }

  function googleDisponivel() {
    return Boolean(
      window.google?.accounts?.id
    );
  }

  function larguraBotaoGoogle() {
    const container = document.getElementById("googleButton");

    if (!container) return 320;

    const largura = Math.floor(
      container.getBoundingClientRect().width
    );

    return Math.max(240, Math.min(largura || 320, 430));
  }

  function renderizarBotaoGoogle() {
    const container = document.getElementById("googleButton");
    const config = obterConfig();

    if (!container || estado.googleRenderizado) {
      return;
    }

    if (!googleDisponivel()) {
      estado.tentativasGoogle += 1;

      if (
        estado.tentativasGoogle >=
        config.GOOGLE.LIMITE_TENTATIVAS_CARREGAMENTO
      ) {
        definirMensagem(
          "Não foi possível carregar o acesso pelo Google. Atualize a página e tente novamente.",
          "erro"
        );
        return;
      }

      window.setTimeout(
        renderizarBotaoGoogle,
        config.GOOGLE.INTERVALO_CARREGAMENTO_MS
      );
      return;
    }

    if (redirecionarUsuarioLogado()) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: config.GOOGLE.CLIENT_ID,
        callback: tratarRespostaGoogle,
        auto_select: false,
        cancel_on_tap_outside: true,
        context: "signin",
        ux_mode: "popup"
      });

      container.innerHTML = "";

      window.google.accounts.id.renderButton(container, {
        theme: "outline",
        size: "large",
        type: "standard",
        shape: "rectangular",
        text: "signin_with",
        logo_alignment: "left",
        width: larguraBotaoGoogle(),
        locale: "pt-BR"
      });

      estado.googleRenderizado = true;
      estado.tentativasGoogle = 0;
      definirMensagem("");
    } catch (erro) {
      console.error(
        "[AUTH] Não foi possível renderizar o botão Google:",
        erro
      );

      definirMensagem(
        "Não foi possível carregar o botão de login.",
        "erro"
      );
    }
  }

  function desconectarGoogle() {
    try {
      if (googleDisponivel()) {
        window.google.accounts.id.disableAutoSelect();
        window.google.accounts.id.cancel();
      }
    } catch (erro) {
      console.warn(
        "[AUTH] Não foi possível cancelar o Google One Tap.",
        erro
      );
    }
  }

  async function logout(opcoes = {}) {
    const {
      confirmar = false,
      mensagem = "Deseja realmente sair do sistema?"
    } = opcoes;

    const executar = () => {
      desconectarGoogle();
      removerSessao();
      navegar(obterConfig().PAGINAS.LOGIN, true);
    };

    const app = obterApp();

    if (
      confirmar &&
      app &&
      typeof app.confirmar === "function"
    ) {
      const confirmado = await app.confirmar(mensagem, {
        titulo: "Sair do sistema",
        textoConfirmar: "Sair",
        textoCancelar: "Cancelar"
      });

      if (confirmado) executar();
      return;
    }

    executar();
  }

  function configurarLogout() {
    document.addEventListener("click", (evento) => {
      const botao = evento.target.closest(
        ".logout, [data-acao='logout'], [data-acao='sair']"
      );

      if (!botao) return;

      evento.preventDefault();

      logout({
        confirmar: botao.dataset.confirmarLogout === "true"
      });
    });
  }

  function configurarRedimensionamentoGoogle() {
    window.addEventListener("resize", () => {
      if (!estado.googleRenderizado) return;

      window.clearTimeout(
        estado.temporizadorRedimensionamento
      );

      estado.temporizadorRedimensionamento =
        window.setTimeout(() => {
          estado.googleRenderizado = false;
          renderizarBotaoGoogle();
        }, 250);
    });
  }

  function emitirEventoPronto() {
    document.dispatchEvent(
      new CustomEvent("vrg:auth-pronto", {
        detail: {
          autenticado: Boolean(obterSessao()?.credential),
          usuario: usuarioAtual()
        }
      })
    );
  }

  function inicializar() {
    if (estado.inicializado) return;

    try {
      obterConfig();
      obterApi();

      if (!exigirSessao()) {
        estado.inicializado = true;
        emitirEventoPronto();
        return;
      }

      configurarLogout();
      aplicarUsuarioNaInterface();
      aplicarPermissoes();
      configurarRedimensionamentoGoogle();

      if (paginaAtual() === obterConfig().PAGINAS.LOGIN) {
        renderizarBotaoGoogle();
      }

      estado.inicializado = true;
      emitirEventoPronto();
    } catch (erro) {
      estado.inicializado = true;

      console.error(
        "[AUTH] Falha ao inicializar a autenticação:",
        erro
      );

      definirMensagem(
        erro?.message ||
        "Não foi possível iniciar a autenticação.",
        "erro"
      );
    }
  }

  const Auth = Object.freeze({
    inicializar,
    renderizarBotaoGoogle,
    tratarRespostaGoogle,
    chamarApi,

    salvarSessao,
    obterSessao,
    removerSessao,

    usuarioAtual,
    usuarioAdministrador,
    usuarioTemPermissao,

    exigirSessao,
    aplicarUsuarioNaInterface,
    aplicarPermissoes,

    logout,
    encerrarSessao: logout
  });

  window.VRGAuth = Auth;
  window.Auth = Auth;

  /*
   * Compatibilidade temporária com páginas ainda não migradas.
   */
  window.tratarRespostaGoogle = tratarRespostaGoogle;
  window.iniciarGoogleLogin = renderizarBotaoGoogle;
  window.salvarSessao = salvarSessao;
  window.obterSessao = obterSessao;
  window.encerrarSessao = logout;
  window.usuarioAdministrador = usuarioAdministrador;
  window.chamarApi = chamarApi;

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      inicializar,
      { once: true }
    );
  } else {
    inicializar();
  }
})(window, document);
