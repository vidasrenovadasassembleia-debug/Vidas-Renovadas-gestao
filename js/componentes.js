"use strict";

/* ==========================================================================
   COMPONENTES GLOBAIS — VIDAS RENOVADAS GESTÃO
   Carrega Sidebar e Topbar compartilhadas entre as páginas do sistema.
   ========================================================================== */

(function (window, document) {
  const CONFIGURACAO_LAYOUT = Object.freeze({
    sidebar: "componentes/sidebar.html",
    topbar: "componentes/topbar.html"
  });

  async function carregarComponente(url) {
    const resposta = await fetch(url, {
      cache: "no-store"
    });

    if (!resposta.ok) {
      throw new Error(
        `Não foi possível carregar o componente: ${url}`
      );
    }

    return resposta.text();
  }

  function obterDadosPagina() {
    const body = document.body;

    return {
      pagina: body.dataset.page || "",
      titulo:
        body.dataset.titulo ||
        document.title.split("|")[0].trim() ||
        "Vidas Renovadas Gestão",
      subtitulo:
        body.dataset.subtitulo ||
        ""
    };
  }

  function preencherTopbar(dadosPagina) {
    const titulo = document.querySelector("[data-layout-titulo]");
    const subtitulo = document.querySelector("[data-layout-subtitulo]");

    if (titulo) {
      titulo.textContent = dadosPagina.titulo;
    }

    if (subtitulo) {
      subtitulo.textContent = dadosPagina.subtitulo;
      subtitulo.hidden = !dadosPagina.subtitulo;
    }
  }

  async function iniciarComponentes() {
    const alvoSidebar = document.querySelector("#layoutSidebar");
    const alvoTopbar = document.querySelector("#layoutTopbar");

    if (!alvoSidebar || !alvoTopbar) {
      return;
    }

    try {
      const [sidebarHtml, topbarHtml] = await Promise.all([
        carregarComponente(CONFIGURACAO_LAYOUT.sidebar),
        carregarComponente(CONFIGURACAO_LAYOUT.topbar)
      ]);

      alvoSidebar.innerHTML = sidebarHtml;
      alvoTopbar.innerHTML = topbarHtml;

      const dadosPagina = obterDadosPagina();
      preencherTopbar(dadosPagina);

      document.dispatchEvent(
        new CustomEvent("vrg:layout-pronto", {
          detail: dadosPagina
        })
      );
    } catch (erro) {
      console.error("[LAYOUT] Erro ao carregar componentes:", erro);

      document.dispatchEvent(
        new CustomEvent("vrg:layout-erro", {
          detail: {
            mensagem:
              erro?.message ||
              "Não foi possível carregar o layout do sistema."
          }
        })
      );
    }
  }

  window.VRGComponentes = Object.freeze({
    iniciar: iniciarComponentes
  });

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      iniciarComponentes,
      { once: true }
    );
  } else {
    iniciarComponentes();
  }
})(window, document);
