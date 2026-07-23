/* ==========================================================================
   VIDAS RENOVADAS GESTÃO 2.0
   Arquivo: js/configuracoes.js
   Descrição: Configurações gerais do frontend
   ========================================================================== */

"use strict";

(function (window) {
  const VR_CONFIG = Object.freeze({
    SISTEMA: Object.freeze({
      NOME: "Vidas Renovadas Gestão",
      VERSAO: "2.0.0"
    }),

    API: Object.freeze({
      URL: "https://script.google.com/macros/s/AKfycbzwbSdAn5cyek9DrBy4SVGEZKI5odv6IW5ayjBLEfW1S1JL6dbTPGYqPU23nFM9rTrM/exec",
      TIMEOUT_MS: 30000
    }),

    GOOGLE: Object.freeze({
      CLIENT_ID:
        "18655161530-n6p9th5quno3q41sp5pvbo4mj2eo5rnv.apps.googleusercontent.com",
      INTERVALO_CARREGAMENTO_MS: 250,
      LIMITE_TENTATIVAS_CARREGAMENTO: 80
    }),

    ARMAZENAMENTO: Object.freeze({
      CREDENCIAL_GOOGLE: "vr_credencial_google",
      USUARIO: "vr_usuario",
      SESSAO: "vr_sessao"
    }),

    PAGINAS: Object.freeze({
      LOGIN: "index.html",
      DASHBOARD: "dashboard.html",
      PUBLICAS: Object.freeze([
        "",
        "index.html",
        "validar.html"
      ]),
      PROTEGIDAS: Object.freeze([
        "dashboard.html",
        "membros.html",
        "membro.html",
        "novo-membro.html",
        "editar-membro.html",
        "visualizar-membro.html",
        "familias.html",
        "congregacoes.html",
        "carteirinhas.html",
        "visualizar-carteirinha.html",
        "configuracoes.html",
        "financeiro.html",
        "relatorios.html",
        "administracao.html"
      ])
    }),

    PERFIS_ADMINISTRATIVOS: Object.freeze([
      "administradora",
      "administrador",
      "admin",
      "superadministradora",
      "superadministrador"
    ])
  });

  window.VR_CONFIG = VR_CONFIG;
})(window);
