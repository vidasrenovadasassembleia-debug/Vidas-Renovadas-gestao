/**
 * ============================================================================
 * VIDAS RENOVADAS GESTÃO 2.0
 * Arquivo: js/auth.js
 * Descrição: Login Google, sessão, proteção de páginas e logout
 * ============================================================================
 *
 * Este arquivo deve ficar em:
 *   /js/auth.js
 *
 * Ele trabalha junto com:
 *   /js/app.js
 *
 * A autenticação no servidor usa a API do Google Apps Script já configurada
 * no projeto.
 * ============================================================================
 */

(function (window, document) {
  "use strict";

  const AUTH_CONFIG = Object.freeze({
    clientId:
      "18655161530-n6p9th5quno3q41sp5pvbo4mj2eo5rnv.apps.googleusercontent.com",

    apiUrl:
      "https://script.google.com/macros/s/AKfycbzwbSdAn5cyek9DrBy4SVGEZKI5odv6IW5ayjBLEfW1S1JL6dbTPGYqPU23nFM9rTrM/exec",

    paginaLogin: "index.html",
    paginaInicial: "dashboard.html",

    chaveSessao: "vidasRenovadasSessao",
    chaveSessaoNova: "vrg_sessao",
    chaveUsuarioNova: "vrg_usuario",

    intervaloGoogle: 250,
    limiteTentativasGoogle: 80,

    paginasPublicas: [
      "",
      "index.html",
      "validar.html"
    ],

    paginasProtegidas: [
      "dashboard.html",
      "membros.html",
      "membro.html",
      "novo-membro.html",
      "editar-membro.html",
      "familias.html",
      "congregacoes.html",
      "carteirinhas.html",
      "configuracoes.html",
      "financeiro.html",
      "relatorios.html",
      "administracao.html"
    ]
  });

  const estado = {
    inicializado: false,
    googleRenderizado: false,
    tentativasGoogle: 0,
    autenticando: false
  };

  function appDisponivel() {
    return Boolean(window.VRG || window.App);
  }

  function app() {
    return window.VRG || window.App || null;
  }

  function paginaAtual() {
    const arquivo = window.location.pathname.split("/").pop();
    return arquivo || AUTH_CONFIG.paginaLogin;
  }

  function paginaPublica() {
    return AUTH_CONFIG.paginasPublicas.includes(paginaAtual());
  }

  function paginaProtegida() {
    const atual = paginaAtual();

    if (AUTH_CONFIG.paginasProtegidas.includes(atual)) {
      return true;
    }

    return !paginaPublica() && /\.html?$/i.test(atual);
  }

  function definirMensagem(mensagem = "", tipo = "") {
    const alvo = document.getElementById("mensagemLogin");

    if (appDisponivel() && app().definirMensagem) {
      app().definirMensagem(alvo, mensagem, tipo);
      return;
    }

    if (!alvo) return;

    alvo.textContent = mensagem;
    alvo.classList.remove("sucesso", "erro", "alerta", "info");

    if (tipo) {
      alvo.classList.add(tipo);
    }
  }

  function mostrarCarregamento(mensagem) {
    if (appDisponivel() && app().mostrarCarregamento) {
      app().mostrarCarregamento(mensagem);
    }
  }

  function ocultarCarregamento(forcar = false) {
    if (appDisponivel() && app().ocultarCarregamento) {
      app().ocultarCarregamento(forcar);
    }
  }

  function salvarJSON(storage, chave, valor) {
    try {
      storage.setItem(chave, JSON.stringify(valor));
      return true;
    } catch (erro) {
      console.warn(`[AUTH] Não foi possível salvar ${chave}.`, erro);
      return false;
    }
  }

  function lerJSON(storage, chave) {
    try {
      const bruto = storage.getItem(chave);

      if (!bruto) return null;

      return JSON.parse(bruto);
    } catch (erro) {
      storage.removeItem(chave);
      return null;
    }
  }

  function removerChave(storage, chave) {
    try {
      storage.removeItem(chave);
    } catch (erro) {
      console.warn(`[AUTH] Não foi possível remover ${chave}.`, erro);
    }
  }

  function salvarSessao(credential, usuario) {
    const agora = new Date().toISOString();

    const sessao = {
      credential,
      usuario: usuario || {},
      criadaEm: agora
    };

    /*
     * Mantém a chave antiga para compatibilidade com páginas já existentes.
     */
    salvarJSON(
      window.sessionStorage,
      AUTH_CONFIG.chaveSessao,
      sessao
    );

    /*
     * Mantém também as chaves novas usadas pelo app.js.
     */
    salvarJSON(
      window.sessionStorage,
      AUTH_CONFIG.chaveSessaoNova,
      sessao
    );

    salvarJSON(
      window.sessionStorage,
      AUTH_CONFIG.chaveUsuarioNova,
      usuario || {}
    );

    if (appDisponivel() && app().salvarUsuarioLocal) {
      app().salvarUsuarioLocal(usuario || {}, false);
    }

    return sessao;
  }

  function obterSessao() {
    const antiga = lerJSON(
      window.sessionStorage,
      AUTH_CONFIG.chaveSessao
    );

    if (antiga?.credential) {
      return antiga;
    }

    const nova = lerJSON(
      window.sessionStorage,
      AUTH_CONFIG.chaveSessaoNova
    );

    if (nova?.credential) {
      return nova;
    }

    return null;
  }

  function removerSessao() {
    removerChave(
      window.sessionStorage,
      AUTH_CONFIG.chaveSessao
    );

    removerChave(
      window.sessionStorage,
      AUTH_CONFIG.chaveSessaoNova
    );

    removerChave(
      window.sessionStorage,
      AUTH_CONFIG.chaveUsuarioNova
    );

    removerChave(
      window.localStorage,
      AUTH_CONFIG.chaveSessaoNova
    );

    removerChave(
      window.localStorage,
      AUTH_CONFIG.chaveUsuarioNova
    );

    if (appDisponivel() && app().removerUsuarioLocal) {
      app().removerUsuarioLocal();
    }
  }

  function usuarioAtual() {
    return obterSessao()?.usuario || null;
  }

  function usuarioAdministrador() {
    const usuario = usuarioAtual();

    if (!usuario) return false;

    const perfil = String(
      usuario.perfil ||
      usuario.cargo ||
      usuario.funcao ||
      ""
    )
      .trim()
      .toLocaleLowerCase("pt-BR");

    return [
      "administradora",
      "administrador",
      "admin",
      "superadministrador",
      "superadministradora"
    ].includes(perfil);
  }

  function navegar(url, substituir = true) {
    if (appDisponivel() && app().navegar) {
      app().navegar(url, { substituir });
      return;
    }

    if (substituir) {
      window.location.replace(url);
    } else {
      window.location.href = url;
    }
  }

  function exigirSessao() {
    if (!paginaProtegida()) return true;

    const sessao = obterSessao();

    if (!sessao?.credential) {
      navegar(AUTH_CONFIG.paginaLogin, true);
      return false;
    }

    return true;
  }

  function redirecionarUsuarioLogado() {
    if (paginaAtual() !== AUTH_CONFIG.paginaLogin) {
      return false;
    }

    const sessao = obterSessao();

    if (!sessao?.credential) {
      return false;
    }

    navegar(AUTH_CONFIG.paginaInicial, true);
    return true;
  }

  function aplicarUsuarioNaInterface() {
    const usuario = usuarioAtual();

    if (!usuario) return;

    if (appDisponivel() && app().atualizarUsuarioNaInterface) {
      app().atualizarUsuarioNaInterface(usuario);
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
    const usuario = usuarioAtual();

    if (!usuario) return;

    const permissoes = Array.isArray(usuario.permissoes)
      ? usuario.permissoes.map((item) =>
          String(item).trim().toLocaleLowerCase("pt-BR")
        )
      : [];

    document.querySelectorAll("[data-permissao]").forEach((elemento) => {
      const permissao = String(elemento.dataset.permissao || "")
        .trim()
        .toLocaleLowerCase("pt-BR");

      if (!permissao) return;

      const permitido =
        usuarioAdministrador() ||
        permissoes.includes(permissao);

      elemento.hidden = !permitido;
    });

    /*
     * Compatibilidade temporária com as páginas antigas.
     */
    if (!usuarioAdministrador()) {
      document
        .querySelectorAll(
          '[href="novo-membro.html"], ' +
          '[href^="editar-membro.html"], ' +
          '[href="configuracoes.html"]'
        )
        .forEach((elemento) => {
          elemento.hidden = true;
        });
    }
  }

  async function chamarApi(conteudo, incluirCredencial = true) {
    const requisicao = {
      ...conteudo
    };

    if (incluirCredencial) {
      const sessao = obterSessao();

      if (!sessao?.credential) {
        removerSessao();
        throw new Error(
          "Sua sessão terminou. Entre novamente."
        );
      }

      requisicao.credential = sessao.credential;
    }

    let resposta;

    try {
      resposta = await window.fetch(AUTH_CONFIG.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(requisicao),
        cache: "no-store",
        redirect: "follow"
      });
    } catch (erro) {
      throw new Error(
        "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente."
      );
    }

    if (!resposta.ok) {
      throw new Error(
        `O servidor respondeu com o código ${resposta.status}.`
      );
    }

    let resultado;

    try {
      resultado = await resposta.json();
    } catch (erro) {
      throw new Error(
        "O servidor retornou uma resposta inválida."
      );
    }

    if (!resultado?.sucesso) {
      const mensagem =
        resultado?.mensagem ||
        "A operação não pôde ser concluída.";

      const mensagemNormalizada = mensagem
        .toLocaleLowerCase("pt-BR");

      if (
        mensagemNormalizada.includes("sessão") ||
        mensagemNormalizada.includes("token") ||
        mensagemNormalizada.includes("credencial")
      ) {
        removerSessao();
      }

      throw new Error(mensagem);
    }

    return resultado;
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

      salvarSessao(
        credential,
        resultado.usuario
      );

      definirMensagem(
        "Acesso autorizado. Abrindo o sistema...",
        "sucesso"
      );

      navegar(AUTH_CONFIG.paginaInicial, true);
    } catch (erro) {
      console.error("[AUTH] Erro de autenticação:", erro);

      removerSessao();

      definirMensagem(
        erro.message ||
        "Não foi possível autorizar esta conta.",
        "erro"
      );

      if (appDisponivel() && app().erro) {
        app().erro(
          erro.message ||
          "Não foi possível autorizar esta conta.",
          "Acesso não autorizado"
        );
      }
    } finally {
      estado.autenticando = false;
      ocultarCarregamento(true);
    }
  }

  function googleDisponivel() {
    return Boolean(
      window.google &&
      window.google.accounts &&
      window.google.accounts.id
    );
  }

  function larguraBotaoGoogle() {
    const container = document.getElementById("googleButton");

    if (!container) return 320;

    const largura = Math.floor(
      container.getBoundingClientRect().width
    );

    return Math.max(
      240,
      Math.min(largura || 320, 430)
    );
  }

  function renderizarBotaoGoogle() {
    const container = document.getElementById("googleButton");

    if (!container || estado.googleRenderizado) {
      return;
    }

    if (!googleDisponivel()) {
      estado.tentativasGoogle += 1;

      if (
        estado.tentativasGoogle >=
        AUTH_CONFIG.limiteTentativasGoogle
      ) {
        definirMensagem(
          "Não foi possível carregar o acesso pelo Google. Atualize a página e tente novamente.",
          "erro"
        );
        return;
      }

      window.setTimeout(
        renderizarBotaoGoogle,
        AUTH_CONFIG.intervaloGoogle
      );

      return;
    }

    if (redirecionarUsuarioLogado()) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: AUTH_CONFIG.clientId,
        callback: tratarRespostaGoogle,
        auto_select: false,
        cancel_on_tap_outside: true,
        context: "signin",
        ux_mode: "popup"
      });

      container.innerHTML = "";

      window.google.accounts.id.renderButton(
        container,
        {
          theme: "outline",
          size: "large",
          type: "standard",
          shape: "rectangular",
          text: "signin_with",
          logo_alignment: "left",
          width: larguraBotaoGoogle(),
          locale: "pt-BR"
        }
      );

      estado.googleRenderizado = true;
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

  function logout(opcoes = {}) {
    const {
      confirmar = false,
      mensagem = "Deseja realmente sair do sistema?"
    } = opcoes;

    const executar = async () => {
      desconectarGoogle();
      removerSessao();
      navegar(AUTH_CONFIG.paginaLogin, true);
    };

    if (
      confirmar &&
      appDisponivel() &&
      app().confirmar
    ) {
      app()
        .confirmar(mensagem, {
          titulo: "Sair do sistema",
          textoConfirmar: "Sair",
          textoCancelar: "Cancelar"
        })
        .then((confirmado) => {
          if (confirmado) executar();
        });

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
    let temporizador;

    window.addEventListener("resize", () => {
      if (!estado.googleRenderizado) return;

      window.clearTimeout(temporizador);

      temporizador = window.setTimeout(() => {
        estado.googleRenderizado = false;
        renderizarBotaoGoogle();
      }, 250);
    });
  }

  function inicializar() {
    if (estado.inicializado) return;

    if (!exigirSessao()) {
      estado.inicializado = true;
      return;
    }

    configurarLogout();
    aplicarUsuarioNaInterface();
    aplicarPermissoes();
    configurarRedimensionamentoGoogle();

    if (paginaAtual() === AUTH_CONFIG.paginaLogin) {
      renderizarBotaoGoogle();
    }

    estado.inicializado = true;

    document.dispatchEvent(
      new CustomEvent("vrg:auth-pronto", {
        detail: {
          autenticado: Boolean(obterSessao()?.credential),
          usuario: usuarioAtual()
        }
      })
    );
  }

  const Auth = Object.freeze({
    config: AUTH_CONFIG,

    inicializar,
    renderizarBotaoGoogle,
    tratarRespostaGoogle,

    chamarApi,

    salvarSessao,
    obterSessao,
    removerSessao,

    usuarioAtual,
    usuarioAdministrador,

    exigirSessao,
    aplicarUsuarioNaInterface,
    aplicarPermissoes,

    logout,
    encerrarSessao: logout
  });

  window.VRGAuth = Auth;
  window.Auth = Auth;

  /*
   * Compatibilidade com chamadas existentes no projeto antigo.
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
