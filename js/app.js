/**
 * ============================================================================
 * VIDAS RENOVADAS GESTÃO 2.0
 * Arquivo: js/app.js
 * Descrição: Núcleo global da aplicação
 * ============================================================================
 *
 * Este arquivo concentra funções compartilhadas por todo o sistema:
 * - inicialização geral;
 * - menu lateral e navegação mobile;
 * - carregamento global;
 * - mensagens, alertas e toasts;
 * - modais e abas;
 * - formatação e validação de dados;
 * - armazenamento local;
 * - chamadas ao Google Apps Script;
 * - proteção contra erros globais;
 * - utilitários reutilizáveis.
 *
 * Importante:
 * - A autenticação Google ficará em js/auth.js.
 * - Regras específicas de cada módulo ficarão em arquivos próprios.
 * ============================================================================
 */

(function (window, document) {
  "use strict";

  const APP_CONFIG = Object.freeze({
    nome: "Vidas Renovadas Gestão",
    versao: "2.0.0",
    igreja: "Igreja Evangélica Assembleia de Deus Ministério Vidas Renovadas",
    idioma: "pt-BR",
    moeda: "BRL",
    paginaLogin: "index.html",
    paginaInicial: "dashboard.html",
    tempoToast: 4500,
    tempoDebounce: 350,
    chaveSessao: "vrg_sessao",
    chaveUsuario: "vrg_usuario",
    chavePreferencias: "vrg_preferencias",
    chaveMenu: "vrg_menu_recolhido"
  });

  const ESTADO = {
    inicializado: false,
    carregamentosAtivos: 0,
    modalAtual: null,
    ultimoFoco: null
  };

  const seletores = {
    carregamentoGlobal: "#carregamentoGlobal",
    botaoMenu: "[data-acao='alternar-menu'], .botao-menu-mobile",
    botaoFecharMenu: "[data-acao='fechar-menu']",
    overlayMenu: ".overlay-menu",
    linksMenu: ".menu-item",
    botaoSair: "[data-acao='logout'], [data-acao='sair']",
    modal: ".modal, .modal-overlay",
    abrirModal: "[data-modal-abrir]",
    fecharModal: "[data-modal-fechar], .modal-fechar",
    aba: "[data-aba]",
    painelAba: "[data-painel-aba]"
  };

  /**
   * Utilitários básicos
   */

  function existe(valor) {
    return valor !== null && valor !== undefined;
  }

  function textoSeguro(valor, padrao = "") {
    if (!existe(valor)) return padrao;
    return String(valor).trim();
  }

  function escapeHTML(valor) {
    const mapa = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return textoSeguro(valor).replace(/[&<>"']/g, (caractere) => mapa[caractere]);
  }

  function gerarId(prefixo = "vrg") {
    const aleatorio = Math.random().toString(36).slice(2, 10);
    return `${prefixo}-${Date.now()}-${aleatorio}`;
  }

  function aguardar(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function debounce(funcao, espera = APP_CONFIG.tempoDebounce) {
    let temporizador;

    return function funcaoDebounced(...argumentos) {
      window.clearTimeout(temporizador);
      temporizador = window.setTimeout(
        () => funcao.apply(this, argumentos),
        espera
      );
    };
  }

  function throttle(funcao, limite = 250) {
    let bloqueado = false;

    return function funcaoLimitada(...argumentos) {
      if (bloqueado) return;

      bloqueado = true;
      funcao.apply(this, argumentos);

      window.setTimeout(() => {
        bloqueado = false;
      }, limite);
    };
  }

  function copiarTexto(texto) {
    const valor = textoSeguro(texto);

    if (!valor) {
      return Promise.reject(new Error("Nenhum texto informado para cópia."));
    }

    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(valor);
    }

    return new Promise((resolve, reject) => {
      const textarea = document.createElement("textarea");
      textarea.value = valor;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";

      document.body.appendChild(textarea);
      textarea.select();

      try {
        document.execCommand("copy");
        resolve();
      } catch (erro) {
        reject(erro);
      } finally {
        textarea.remove();
      }
    });
  }

  /**
   * Armazenamento local
   */

  function lerStorage(chave, padrao = null) {
    try {
      const bruto = window.localStorage.getItem(chave);
      return bruto === null ? padrao : JSON.parse(bruto);
    } catch (erro) {
      console.warn("[VRG] Não foi possível ler o armazenamento local.", erro);
      return padrao;
    }
  }

  function salvarStorage(chave, valor) {
    try {
      window.localStorage.setItem(chave, JSON.stringify(valor));
      return true;
    } catch (erro) {
      console.warn("[VRG] Não foi possível salvar no armazenamento local.", erro);
      return false;
    }
  }

  function removerStorage(chave) {
    try {
      window.localStorage.removeItem(chave);
      return true;
    } catch (erro) {
      console.warn("[VRG] Não foi possível remover do armazenamento local.", erro);
      return false;
    }
  }

  function lerSessao(chave, padrao = null) {
    try {
      const bruto = window.sessionStorage.getItem(chave);
      return bruto === null ? padrao : JSON.parse(bruto);
    } catch (erro) {
      console.warn("[VRG] Não foi possível ler a sessão.", erro);
      return padrao;
    }
  }

  function salvarSessao(chave, valor) {
    try {
      window.sessionStorage.setItem(chave, JSON.stringify(valor));
      return true;
    } catch (erro) {
      console.warn("[VRG] Não foi possível salvar a sessão.", erro);
      return false;
    }
  }

  function removerSessao(chave) {
    try {
      window.sessionStorage.removeItem(chave);
      return true;
    } catch (erro) {
      console.warn("[VRG] Não foi possível remover a sessão.", erro);
      return false;
    }
  }

  /**
   * Navegação
   */

  function navegar(url, opcoes = {}) {
    const destino = textoSeguro(url);

    if (!destino) return;

    const { substituir = false, atraso = 0 } = opcoes;

    const executar = () => {
      if (substituir) {
        window.location.replace(destino);
      } else {
        window.location.href = destino;
      }
    };

    if (atraso > 0) {
      window.setTimeout(executar, atraso);
    } else {
      executar();
    }
  }

  function obterPaginaAtual() {
    const dataPage = document.body?.dataset?.page;
    if (dataPage) return dataPage;

    const arquivo = window.location.pathname.split("/").pop() || APP_CONFIG.paginaLogin;
    return arquivo.replace(/\.html?$/i, "") || "index";
  }

  function marcarMenuAtivo() {
    const paginaAtual = obterPaginaAtual();
    const links = document.querySelectorAll(seletores.linksMenu);

    links.forEach((link) => {
      const paginaLink =
        link.dataset.page ||
        (link.getAttribute("href") || "")
          .split("/")
          .pop()
          .replace(/\.html?$/i, "");

      const ativo = Boolean(paginaLink && paginaLink === paginaAtual);

      link.classList.toggle("ativo", ativo);

      if (ativo) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  /**
   * Menu lateral
   */

  function abrirMenu() {
    document.body.classList.add("menu-aberto");

    const botao = document.querySelector(seletores.botaoMenu);
    if (botao) botao.setAttribute("aria-expanded", "true");
  }

  function fecharMenu() {
    document.body.classList.remove("menu-aberto");

    const botao = document.querySelector(seletores.botaoMenu);
    if (botao) botao.setAttribute("aria-expanded", "false");
  }

  function alternarMenu() {
    if (document.body.classList.contains("menu-aberto")) {
      fecharMenu();
    } else {
      abrirMenu();
    }
  }

  function configurarMenu() {
    document.querySelectorAll(seletores.botaoMenu).forEach((botao) => {
      botao.addEventListener("click", alternarMenu);
    });

    document.querySelectorAll(seletores.botaoFecharMenu).forEach((botao) => {
      botao.addEventListener("click", fecharMenu);
    });

    const overlay = document.querySelector(seletores.overlayMenu);
    if (overlay) overlay.addEventListener("click", fecharMenu);

    document.querySelectorAll(seletores.linksMenu).forEach((link) => {
      link.addEventListener("click", () => {
        if (window.innerWidth <= 900) fecharMenu();
      });
    });

    window.addEventListener(
      "resize",
      debounce(() => {
        if (window.innerWidth > 900) fecharMenu();
      }, 150)
    );

    marcarMenuAtivo();
  }

  /**
   * Carregamento global
   */

  function obterElementoCarregamento() {
    return document.querySelector(seletores.carregamentoGlobal);
  }

  function mostrarCarregamento(mensagem = "Carregando...") {
    ESTADO.carregamentosAtivos += 1;

    const overlay = obterElementoCarregamento();
    if (!overlay) return;

    const texto = overlay.querySelector(
      ".carregamento-caixa span:last-child, [data-carregamento-texto]"
    );

    if (texto) texto.textContent = mensagem;

    overlay.classList.add("ativo");
    overlay.setAttribute("aria-hidden", "false");
  }

  function ocultarCarregamento(forcar = false) {
    if (forcar) {
      ESTADO.carregamentosAtivos = 0;
    } else {
      ESTADO.carregamentosAtivos = Math.max(0, ESTADO.carregamentosAtivos - 1);
    }

    if (ESTADO.carregamentosAtivos > 0) return;

    const overlay = obterElementoCarregamento();
    if (!overlay) return;

    overlay.classList.remove("ativo");
    overlay.setAttribute("aria-hidden", "true");
  }

  async function comCarregamento(funcao, mensagem = "Carregando...") {
    mostrarCarregamento(mensagem);

    try {
      return await funcao();
    } finally {
      ocultarCarregamento();
    }
  }

  /**
   * Toasts
   */

  function obterContainerToast() {
    let container = document.querySelector(".toast-container");

    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container";
      container.setAttribute("aria-live", "polite");
      container.setAttribute("aria-atomic", "true");
      document.body.appendChild(container);
    }

    return container;
  }

  function toast(mensagem, tipo = "info", opcoes = {}) {
    const {
      titulo = "",
      duracao = APP_CONFIG.tempoToast,
      persistente = false
    } = opcoes;

    const container = obterContainerToast();
    const item = document.createElement("div");
    const id = gerarId("toast");

    item.id = id;
    item.className = `toast toast-${tipo}`;
    item.setAttribute("role", tipo === "erro" ? "alert" : "status");

    item.innerHTML = `
      <div class="toast-conteudo">
        ${titulo ? `<p class="toast-titulo">${escapeHTML(titulo)}</p>` : ""}
        <p class="toast-texto">${escapeHTML(mensagem)}</p>
      </div>
      <button
        type="button"
        class="modal-fechar"
        aria-label="Fechar mensagem"
        data-toast-fechar
      >×</button>
    `;

    const remover = () => {
      if (!item.isConnected) return;
      item.classList.add("saindo");
      window.setTimeout(() => item.remove(), 180);
    };

    item.querySelector("[data-toast-fechar]")?.addEventListener("click", remover);
    container.appendChild(item);

    if (!persistente && duracao > 0) {
      window.setTimeout(remover, duracao);
    }

    return {
      id,
      fechar: remover,
      elemento: item
    };
  }

  function sucesso(mensagem, titulo = "Sucesso") {
    return toast(mensagem, "sucesso", { titulo });
  }

  function erro(mensagem, titulo = "Não foi possível concluir") {
    return toast(mensagem, "erro", { titulo, duracao: 6500 });
  }

  function alerta(mensagem, titulo = "Atenção") {
    return toast(mensagem, "alerta", { titulo, duracao: 5500 });
  }

  function info(mensagem, titulo = "Informação") {
    return toast(mensagem, "info", { titulo });
  }

  /**
   * Mensagem dentro de um elemento
   */

  function definirMensagem(alvo, mensagem = "", tipo = "") {
    const elemento =
      typeof alvo === "string" ? document.querySelector(alvo) : alvo;

    if (!elemento) return;

    elemento.textContent = mensagem;
    elemento.classList.remove("sucesso", "erro", "alerta", "info");

    if (tipo) elemento.classList.add(tipo);
  }

  /**
   * Modais
   */

  function obterModal(alvo) {
    if (!alvo) return null;

    if (alvo instanceof Element) return alvo;

    const seletor = alvo.startsWith("#") ? alvo : `#${alvo}`;
    return document.querySelector(seletor);
  }

  function abrirModal(alvo) {
    const modal = obterModal(alvo);
    if (!modal) return false;

    ESTADO.ultimoFoco = document.activeElement;
    ESTADO.modalAtual = modal;

    modal.classList.add("ativo");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-aberto");

    const focoInicial = modal.querySelector(
      "[autofocus], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])"
    );

    window.setTimeout(() => focoInicial?.focus(), 30);
    return true;
  }

  function fecharModal(alvo = ESTADO.modalAtual) {
    const modal = obterModal(alvo);
    if (!modal) return false;

    modal.classList.remove("ativo");
    modal.setAttribute("aria-hidden", "true");

    if (!document.querySelector(".modal.ativo, .modal-overlay.ativo")) {
      document.body.classList.remove("modal-aberto");
    }

    if (ESTADO.modalAtual === modal) ESTADO.modalAtual = null;

    if (ESTADO.ultimoFoco instanceof HTMLElement) {
      ESTADO.ultimoFoco.focus();
    }

    return true;
  }

  function configurarModais() {
    document.addEventListener("click", (evento) => {
      const abrir = evento.target.closest(seletores.abrirModal);
      if (abrir) {
        evento.preventDefault();
        abrirModal(abrir.dataset.modalAbrir);
        return;
      }

      const fechar = evento.target.closest(seletores.fecharModal);
      if (fechar) {
        evento.preventDefault();
        fecharModal(fechar.closest(".modal, .modal-overlay"));
        return;
      }

      const modal = evento.target.closest(".modal, .modal-overlay");
      if (
        modal &&
        evento.target === modal &&
        modal.dataset.fecharOverlay !== "false"
      ) {
        fecharModal(modal);
      }
    });

    document.addEventListener("keydown", (evento) => {
      if (evento.key === "Escape" && ESTADO.modalAtual) {
        fecharModal(ESTADO.modalAtual);
      }
    });
  }

  /**
   * Abas
   */

  function ativarAba(grupo, nomeAba) {
    if (!grupo || !nomeAba) return;

    const seletorGrupo = `[data-grupo-abas="${CSS.escape(grupo)}"]`;
    const contexto = document.querySelector(seletorGrupo) || document;

    contexto.querySelectorAll(seletores.aba).forEach((aba) => {
      const ativa = aba.dataset.aba === nomeAba;
      aba.classList.toggle("ativa", ativa);
      aba.setAttribute("aria-selected", String(ativa));
      aba.tabIndex = ativa ? 0 : -1;
    });

    contexto.querySelectorAll(seletores.painelAba).forEach((painel) => {
      const ativo = painel.dataset.painelAba === nomeAba;
      painel.classList.toggle("ativo", ativo);
      painel.hidden = !ativo;
    });
  }

  function configurarAbas() {
    document.addEventListener("click", (evento) => {
      const aba = evento.target.closest(seletores.aba);
      if (!aba) return;

      evento.preventDefault();

      const grupo =
        aba.dataset.grupo ||
        aba.closest("[data-grupo-abas]")?.dataset.grupoAbas ||
        "principal";

      ativarAba(grupo, aba.dataset.aba);
    });
  }

  /**
   * Confirmação
   */

  function confirmar(mensagem, opcoes = {}) {
    const {
      titulo = "Confirmar ação",
      textoConfirmar = "Confirmar",
      textoCancelar = "Cancelar",
      tipo = "alerta"
    } = opcoes;

    return new Promise((resolve) => {
      const modal = document.createElement("div");
      const id = gerarId("confirmacao");

      modal.id = id;
      modal.className = "modal modal-overlay ativo";
      modal.setAttribute("aria-hidden", "false");

      modal.innerHTML = `
        <div class="modal-dialogo" role="dialog" aria-modal="true">
          <div class="modal-cabecalho">
            <h2 class="modal-titulo">${escapeHTML(titulo)}</h2>
            <button type="button" class="modal-fechar" aria-label="Fechar">×</button>
          </div>
          <div class="modal-corpo">
            <div class="alerta alerta-${escapeHTML(tipo)}">
              <span>${escapeHTML(mensagem)}</span>
            </div>
          </div>
          <div class="modal-rodape">
            <button type="button" class="btn btn-contorno" data-cancelar>
              ${escapeHTML(textoCancelar)}
            </button>
            <button type="button" class="btn btn-primario" data-confirmar>
              ${escapeHTML(textoConfirmar)}
            </button>
          </div>
        </div>
      `;

      const finalizar = (resultado) => {
        modal.remove();
        document.body.classList.remove("modal-aberto");
        resolve(resultado);
      };

      modal.querySelector("[data-confirmar]").addEventListener("click", () => {
        finalizar(true);
      });

      modal.querySelector("[data-cancelar]").addEventListener("click", () => {
        finalizar(false);
      });

      modal.querySelector(".modal-fechar").addEventListener("click", () => {
        finalizar(false);
      });

      modal.addEventListener("click", (evento) => {
        if (evento.target === modal) finalizar(false);
      });

      document.body.appendChild(modal);
      document.body.classList.add("modal-aberto");
      modal.querySelector("[data-confirmar]")?.focus();
    });
  }

  /**
   * Datas, números e textos
   */

  function normalizarData(valor) {
    if (!valor) return null;
    if (valor instanceof Date && !Number.isNaN(valor.getTime())) return valor;

    if (typeof valor === "string") {
      const iso = /^\d{4}-\d{2}-\d{2}/.test(valor);
      const brasileiro = /^\d{2}\/\d{2}\/\d{4}$/.test(valor);

      if (brasileiro) {
        const [dia, mes, ano] = valor.split("/").map(Number);
        const data = new Date(ano, mes - 1, dia);
        return Number.isNaN(data.getTime()) ? null : data;
      }

      if (iso) {
        const data = new Date(`${valor.slice(0, 10)}T12:00:00`);
        return Number.isNaN(data.getTime()) ? null : data;
      }
    }

    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? null : data;
  }

  function formatarData(valor, opcoes = {}) {
    const data = normalizarData(valor);
    if (!data) return "";

    return new Intl.DateTimeFormat(APP_CONFIG.idioma, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      ...opcoes
    }).format(data);
  }

  function formatarDataHora(valor) {
    const data = normalizarData(valor);
    if (!data) return "";

    return new Intl.DateTimeFormat(APP_CONFIG.idioma, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(data);
  }

  function dataParaISO(valor) {
    const data = normalizarData(valor);
    if (!data) return "";

    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  function formatarMoeda(valor, moeda = APP_CONFIG.moeda) {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
      return new Intl.NumberFormat(APP_CONFIG.idioma, {
        style: "currency",
        currency: moeda
      }).format(0);
    }

    return new Intl.NumberFormat(APP_CONFIG.idioma, {
      style: "currency",
      currency: moeda
    }).format(numero);
  }

  function formatarNumero(valor, casas = 0) {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) return "0";

    return new Intl.NumberFormat(APP_CONFIG.idioma, {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas
    }).format(numero);
  }

  function apenasNumeros(valor) {
    return textoSeguro(valor).replace(/\D/g, "");
  }

  function formatarCPF(valor) {
    const numeros = apenasNumeros(valor).slice(0, 11);

    return numeros
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  function formatarTelefone(valor) {
    const numeros = apenasNumeros(valor).slice(0, 11);

    if (numeros.length <= 10) {
      return numeros
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return numeros
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }

  function formatarCEP(valor) {
    return apenasNumeros(valor)
      .slice(0, 8)
      .replace(/(\d{5})(\d)/, "$1-$2");
  }

  function formatarCodigoMembro(numero) {
    const valor = Number(numero);
    if (!Number.isFinite(valor) || valor < 1) return "";

    return `ADVR${String(Math.trunc(valor)).padStart(2, "0")}`;
  }

  function formatarCodigoBatismo(numero) {
    const valor = Number(numero);
    if (!Number.isFinite(valor) || valor < 1) return "";

    return `ADVRBAT${String(Math.trunc(valor)).padStart(2, "0")}`;
  }

  function formatarCodigoConsagracao(numero) {
    const valor = Number(numero);
    if (!Number.isFinite(valor) || valor < 1) return "";

    return `ADVRCONS${String(Math.trunc(valor)).padStart(2, "0")}`;
  }

  function capitalizar(valor) {
    return textoSeguro(valor)
      .toLocaleLowerCase(APP_CONFIG.idioma)
      .replace(/(^|\s|[-'])\p{L}/gu, (letra) =>
        letra.toLocaleUpperCase(APP_CONFIG.idioma)
      );
  }

  function iniciais(nome, limite = 2) {
    const partes = textoSeguro(nome)
      .split(/\s+/)
      .filter(Boolean);

    if (!partes.length) return "?";

    if (partes.length === 1) {
      return partes[0].slice(0, limite).toUpperCase();
    }

    return `${partes[0][0]}${partes[partes.length - 1][0]}`
      .slice(0, limite)
      .toUpperCase();
  }

  function calcularIdade(dataNascimento, referencia = new Date()) {
    const nascimento = normalizarData(dataNascimento);
    const hoje = normalizarData(referencia);

    if (!nascimento || !hoje) return null;

    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();

    if (
      mes < 0 ||
      (mes === 0 && hoje.getDate() < nascimento.getDate())
    ) {
      idade -= 1;
    }

    return idade >= 0 ? idade : null;
  }

  /**
   * Validações
   */

  function validarEmail(email) {
    const valor = textoSeguro(email);
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
  }

  function validarCPF(cpf) {
    const numeros = apenasNumeros(cpf);

    if (numeros.length !== 11 || /^(\d)\1{10}$/.test(numeros)) {
      return false;
    }

    const calcularDigito = (base, pesoInicial) => {
      const soma = base
        .split("")
        .reduce(
          (total, digito, indice) =>
            total + Number(digito) * (pesoInicial - indice),
          0
        );

      const resto = (soma * 10) % 11;
      return resto === 10 ? 0 : resto;
    };

    const primeiro = calcularDigito(numeros.slice(0, 9), 10);
    const segundo = calcularDigito(numeros.slice(0, 10), 11);

    return primeiro === Number(numeros[9]) && segundo === Number(numeros[10]);
  }

  function validarData(valor) {
    return normalizarData(valor) !== null;
  }

  function validarFormulario(formulario) {
    if (!(formulario instanceof HTMLFormElement)) return false;

    let valido = true;
    const campos = formulario.querySelectorAll(
      "input, select, textarea"
    );

    campos.forEach((campo) => {
      campo.classList.remove("input-invalido");
      campo.closest(".campo")?.classList.remove("invalido");

      if (!campo.checkValidity()) {
        valido = false;
        campo.classList.add("input-invalido");
        campo.closest(".campo")?.classList.add("invalido");
      }
    });

    if (!valido) {
      const primeiro = formulario.querySelector(":invalid");
      primeiro?.focus();
      primeiro?.reportValidity();
    }

    return valido;
  }

  /**
   * Máscaras automáticas
   */

  function aplicarMascaras(contexto = document) {
    contexto.querySelectorAll("[data-mascara='cpf']").forEach((campo) => {
      campo.addEventListener("input", () => {
        campo.value = formatarCPF(campo.value);
      });
    });

    contexto.querySelectorAll("[data-mascara='telefone']").forEach((campo) => {
      campo.addEventListener("input", () => {
        campo.value = formatarTelefone(campo.value);
      });
    });

    contexto.querySelectorAll("[data-mascara='cep']").forEach((campo) => {
      campo.addEventListener("input", () => {
        campo.value = formatarCEP(campo.value);
      });
    });

    contexto.querySelectorAll("[data-mascara='inteiro']").forEach((campo) => {
      campo.addEventListener("input", () => {
        campo.value = apenasNumeros(campo.value);
      });
    });
  }

  /**
   * Formulários e objetos
   */

  function formularioParaObjeto(formulario) {
    if (!(formulario instanceof HTMLFormElement)) return {};

    const dados = new FormData(formulario);
    const objeto = {};

    for (const [chave, valor] of dados.entries()) {
      if (Object.prototype.hasOwnProperty.call(objeto, chave)) {
        if (!Array.isArray(objeto[chave])) {
          objeto[chave] = [objeto[chave]];
        }

        objeto[chave].push(valor);
      } else {
        objeto[chave] = valor;
      }
    }

    formulario
      .querySelectorAll("input[type='checkbox'][name]")
      .forEach((campo) => {
        if (!dados.has(campo.name)) {
          objeto[campo.name] = false;
        } else if (dados.getAll(campo.name).length === 1) {
          objeto[campo.name] = campo.checked;
        }
      });

    return objeto;
  }

  function preencherFormulario(formulario, dados = {}) {
    if (!(formulario instanceof HTMLFormElement)) return;

    Object.entries(dados).forEach(([nome, valor]) => {
      const campos = formulario.querySelectorAll(`[name="${CSS.escape(nome)}"]`);

      campos.forEach((campo) => {
        if (campo.type === "checkbox") {
          if (Array.isArray(valor)) {
            campo.checked = valor.includes(campo.value);
          } else {
            campo.checked = Boolean(valor);
          }
        } else if (campo.type === "radio") {
          campo.checked = String(campo.value) === String(valor);
        } else {
          campo.value = existe(valor) ? valor : "";
        }
      });
    });
  }

  function limparFormulario(formulario) {
    if (!(formulario instanceof HTMLFormElement)) return;

    formulario.reset();
    formulario
      .querySelectorAll(".input-invalido")
      .forEach((campo) => campo.classList.remove("input-invalido"));

    formulario
      .querySelectorAll(".campo.invalido")
      .forEach((campo) => campo.classList.remove("invalido"));
  }

  /**
   * Google Apps Script
   */

  function googleScriptDisponivel() {
    return Boolean(
      window.google &&
      window.google.script &&
      window.google.script.run
    );
  }

  function chamarAppsScript(funcao, ...argumentos) {
    return new Promise((resolve, reject) => {
      if (!googleScriptDisponivel()) {
        reject(
          new Error(
            "O serviço do Google Apps Script não está disponível neste ambiente."
          )
        );
        return;
      }

      const executor = window.google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler((falha) => {
          const mensagem =
            falha?.message ||
            falha?.toString?.() ||
            "Ocorreu um erro ao executar a solicitação.";

          reject(new Error(mensagem));
        });

      if (typeof executor[funcao] !== "function") {
        reject(
          new Error(`A função "${funcao}" não existe no Google Apps Script.`)
        );
        return;
      }

      executor[funcao](...argumentos);
    });
  }

  async function executarAcaoServidor(
    funcao,
    argumentos = [],
    opcoes = {}
  ) {
    const {
      mensagemCarregamento = "Processando...",
      mensagemSucesso = "",
      exibirErro = true
    } = opcoes;

    try {
      const resposta = await comCarregamento(
        () => chamarAppsScript(funcao, ...argumentos),
        mensagemCarregamento
      );

      if (mensagemSucesso) sucesso(mensagemSucesso);
      return resposta;
    } catch (falha) {
      console.error(`[VRG] Erro em ${funcao}:`, falha);

      if (exibirErro) {
        erro(falha.message || "Não foi possível concluir a operação.");
      }

      throw falha;
    }
  }

  /**
   * Estado do usuário
   */

  function obterUsuarioLocal() {
    return (
      lerStorage(APP_CONFIG.chaveUsuario) ||
      lerSessao(APP_CONFIG.chaveUsuario) ||
      null
    );
  }

  function salvarUsuarioLocal(usuario, persistir = true) {
    if (persistir) {
      salvarStorage(APP_CONFIG.chaveUsuario, usuario);
    } else {
      salvarSessao(APP_CONFIG.chaveUsuario, usuario);
    }

    atualizarUsuarioNaInterface(usuario);
  }

  function removerUsuarioLocal() {
    removerStorage(APP_CONFIG.chaveUsuario);
    removerSessao(APP_CONFIG.chaveUsuario);
  }

  function atualizarUsuarioNaInterface(usuario = obterUsuarioLocal()) {
    if (!usuario) return;

    document
      .querySelectorAll("[data-usuario-nome]")
      .forEach((elemento) => {
        elemento.textContent =
          usuario.nome || usuario.name || usuario.email || "Usuário";
      });

    document
      .querySelectorAll("[data-usuario-email]")
      .forEach((elemento) => {
        elemento.textContent = usuario.email || "";
      });

    document
      .querySelectorAll("[data-usuario-cargo]")
      .forEach((elemento) => {
        elemento.textContent =
          usuario.cargo || usuario.perfil || usuario.funcao || "";
      });

    document
      .querySelectorAll("[data-usuario-iniciais]")
      .forEach((elemento) => {
        elemento.textContent = iniciais(
          usuario.nome || usuario.name || usuario.email
        );
      });

    document
      .querySelectorAll("[data-usuario-foto]")
      .forEach((imagem) => {
        const foto = usuario.foto || usuario.picture || usuario.avatar;

        if (foto && imagem instanceof HTMLImageElement) {
          imagem.src = foto;
          imagem.alt = `Foto de ${usuario.nome || usuario.name || "usuário"}`;
        }
      });
  }

  /**
   * Parâmetros de URL
   */

  function obterParametro(nome) {
    return new URLSearchParams(window.location.search).get(nome);
  }

  function definirParametros(parametros = {}, substituir = true) {
    const url = new URL(window.location.href);

    Object.entries(parametros).forEach(([chave, valor]) => {
      if (!existe(valor) || valor === "") {
        url.searchParams.delete(chave);
      } else {
        url.searchParams.set(chave, valor);
      }
    });

    const metodo = substituir ? "replaceState" : "pushState";
    window.history[metodo]({}, "", url);
  }

  /**
   * Downloads
   */

  function baixarBlob(blob, nomeArquivo) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = nomeArquivo || "arquivo";
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function baixarTexto(conteudo, nomeArquivo, tipo = "text/plain;charset=utf-8") {
    const blob = new Blob([conteudo], { type: tipo });
    baixarBlob(blob, nomeArquivo);
  }

  /**
   * Erros globais
   */

  function configurarErrosGlobais() {
    window.addEventListener("error", (evento) => {
      console.error("[VRG] Erro global:", evento.error || evento.message);
    });

    window.addEventListener("unhandledrejection", (evento) => {
      console.error("[VRG] Promessa rejeitada:", evento.reason);
    });
  }

  /**
   * Eventos globais por data-attributes
   */

  function configurarAcoesGlobais() {
    document.addEventListener("click", async (evento) => {
      const copiar = evento.target.closest("[data-copiar]");
      if (copiar) {
        evento.preventDefault();

        try {
          await copiarTexto(copiar.dataset.copiar);
          sucesso("Conteúdo copiado.");
        } catch (falha) {
          erro("Não foi possível copiar o conteúdo.");
        }

        return;
      }

      const navegarPara = evento.target.closest("[data-navegar]");
      if (navegarPara) {
        evento.preventDefault();
        navegar(navegarPara.dataset.navegar);
      }
    });
  }

  /**
   * Inicialização
   */

  function inicializarAnoAtual() {
    document.querySelectorAll("[data-ano-atual], #anoAtual").forEach((elemento) => {
      elemento.textContent = String(new Date().getFullYear());
    });
  }

  function inicializar() {
    if (ESTADO.inicializado) return;

    configurarErrosGlobais();
    configurarMenu();
    configurarModais();
    configurarAbas();
    configurarAcoesGlobais();
    aplicarMascaras(document);
    atualizarUsuarioNaInterface();
    inicializarAnoAtual();

    ESTADO.inicializado = true;

    document.dispatchEvent(
      new CustomEvent("vrg:pronto", {
        detail: {
          pagina: obterPaginaAtual(),
          versao: APP_CONFIG.versao
        }
      })
    );

    console.info(
      `%c${APP_CONFIG.nome} ${APP_CONFIG.versao}`,
      "color:#d5a62e;background:#071f3b;padding:5px 9px;border-radius:5px;font-weight:bold;"
    );
  }

  /**
   * API pública
   */

  const APP = Object.freeze({
    config: APP_CONFIG,
    estado: ESTADO,

    inicializar,
    navegar,
    obterPaginaAtual,
    marcarMenuAtivo,

    abrirMenu,
    fecharMenu,
    alternarMenu,

    mostrarCarregamento,
    ocultarCarregamento,
    comCarregamento,

    toast,
    sucesso,
    erro,
    alerta,
    info,
    definirMensagem,

    abrirModal,
    fecharModal,
    confirmar,
    ativarAba,

    escapeHTML,
    gerarId,
    aguardar,
    debounce,
    throttle,
    copiarTexto,

    lerStorage,
    salvarStorage,
    removerStorage,
    lerSessao,
    salvarSessao,
    removerSessao,

    normalizarData,
    formatarData,
    formatarDataHora,
    dataParaISO,
    formatarMoeda,
    formatarNumero,
    apenasNumeros,
    formatarCPF,
    formatarTelefone,
    formatarCEP,
    formatarCodigoMembro,
    formatarCodigoBatismo,
    formatarCodigoConsagracao,
    capitalizar,
    iniciais,
    calcularIdade,

    validarEmail,
    validarCPF,
    validarData,
    validarFormulario,
    aplicarMascaras,

    formularioParaObjeto,
    preencherFormulario,
    limparFormulario,

    googleScriptDisponivel,
    chamarAppsScript,
    executarAcaoServidor,

    obterUsuarioLocal,
    salvarUsuarioLocal,
    removerUsuarioLocal,
    atualizarUsuarioNaInterface,

    obterParametro,
    definirParametros,

    baixarBlob,
    baixarTexto
  });

  window.VRG = APP;
  window.App = APP;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializar, { once: true });
  } else {
    inicializar();
  }
})(window, document);
