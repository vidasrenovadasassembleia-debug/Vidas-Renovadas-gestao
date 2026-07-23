/* ==========================================================================
   VIDAS RENOVADAS GESTÃO 2.0
   Configurações gerais do frontend
   ========================================================================== */

"use strict";

const VR_CONFIG = Object.freeze({
  SISTEMA: {
    NOME: "Vidas Renovadas Gestão",
    VERSAO: "2.0.0"
  },

  API: {
    URL: "https://script.google.com/macros/s/AKfycbzwbSdAn5cyek9DrBy4SVGEZKI5odv6IW5ayjBLEfW1S1JL6dbTPGYqPU23nFM9rTrM/exec",
    TIMEOUT_MS: 30000
  },

  GOOGLE: {
    CLIENT_ID:
      "18655161530-n6p9th5quno3q41sp5pvbo4mj2eo5rnv.apps.googleusercontent.com"
  },

  ARMAZENAMENTO: {
    CREDENCIAL_GOOGLE: "vr_credencial_google",
    USUARIO: "vr_usuario",
    SESSAO: "vr_sessao"
  },

  PAGINAS: {
    LOGIN: "index.html",
    DASHBOARD: "dashboard.html"
  }
});

/*
 * Disponibiliza as configurações globalmente para os demais arquivos JavaScript.
 */
window.VR_CONFIG = VR_CONFIG;
