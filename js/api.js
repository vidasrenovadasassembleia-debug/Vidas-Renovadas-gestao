/* ==========================================================================
   VIDAS RENOVADAS GESTÃO 2.0
   Comunicação com a API do Google Apps Script
   ========================================================================== */

"use strict";

(function () {
  function obterConfiguracao() {
    if (!window.VR_CONFIG || !window.VR_CONFIG.API) {
      throw new Error(
        "As configurações da API não foram carregadas. Verifique o arquivo configuracoes.js."
      );
    }

    return window.VR_CONFIG.API;
  }

  async function enviar(acao, dados = {}) {
    const configuracao = obterConfiguracao();

    const controlador = new AbortController();
    const temporizador = setTimeout(
      () => controlador.abort(),
      configuracao.TIMEOUT_MS
    );

    try {
      const resposta = await fetch(configuracao.URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
          acao,
          ...dados
        }),
        signal: controlador.signal
      });

      if (!resposta.ok) {
        throw new Error(
          `Erro de comunicação com a API. Código HTTP: ${resposta.status}`
        );
      }

      const resultado = await resposta.json();

      if (!resultado || typeof resultado !== "object") {
        throw new Error("A API retornou uma resposta inválida.");
      }

      if (resultado.sucesso === false) {
        throw new Error(
          resultado.mensagem || "Não foi possível concluir a operação."
        );
      }

      return resultado;
    } catch (erro) {
      if (erro.name === "AbortError") {
        throw new Error(
          "A comunicação com o servidor demorou mais do que o esperado."
        );
      }

      throw erro;
    } finally {
      clearTimeout(temporizador);
    }
  }

  async function testarConexao() {
    const configuracao = obterConfiguracao();

    const resposta = await fetch(configuracao.URL, {
      method: "GET",
      cache: "no-store"
    });

    if (!resposta.ok) {
      throw new Error(
        `Não foi possível acessar a API. Código HTTP: ${resposta.status}`
      );
    }

    return resposta.json();
  }

  window.VR_API = Object.freeze({
    enviar,
    testarConexao
  });
})();
