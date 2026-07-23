/* ==========================================================================
   VIDAS RENOVADAS GESTÃO 2.0
   Arquivo: js/api.js
   Descrição: Comunicação centralizada com a API do Google Apps Script
   ========================================================================== */

"use strict";

(function (window) {
  function obterConfiguracao() {
    const configuracao = window.VR_CONFIG?.API;

    if (!configuracao?.URL) {
      throw new Error(
        "As configurações da API não foram carregadas. Verifique se configuracoes.js foi incluído antes de api.js."
      );
    }

    return configuracao;
  }

  function criarErro(mensagem, detalhes = {}) {
    const erro = new Error(mensagem);
    Object.assign(erro, detalhes);
    return erro;
  }

  async function interpretarResposta(resposta) {
    let resultado;

    try {
      resultado = await resposta.json();
    } catch (_) {
      throw criarErro(
        "O servidor retornou uma resposta inválida.",
        { status: resposta.status }
      );
    }

    if (!resposta.ok) {
      throw criarErro(
        resultado?.mensagem ||
          `Erro de comunicação com a API. Código HTTP: ${resposta.status}.`,
        {
          status: resposta.status,
          resultado
        }
      );
    }

    if (!resultado || typeof resultado !== "object") {
      throw criarErro("A API retornou uma resposta inválida.");
    }

    if (resultado.sucesso === false) {
      throw criarErro(
        resultado.mensagem || "Não foi possível concluir a operação.",
        { resultado }
      );
    }

    return resultado;
  }

  async function requisitar(opcoes = {}) {
    const configuracao = obterConfiguracao();
    const {
      method = "POST",
      dados,
      timeoutMs = configuracao.TIMEOUT_MS,
      cache = "no-store"
    } = opcoes;

    const controlador = new AbortController();
    const temporizador = window.setTimeout(
      () => controlador.abort(),
      timeoutMs
    );

    try {
      const configuracaoFetch = {
        method,
        cache,
        redirect: "follow",
        signal: controlador.signal
      };

      if (method !== "GET" && dados !== undefined) {
        configuracaoFetch.headers = {
          "Content-Type": "text/plain;charset=utf-8"
        };
        configuracaoFetch.body = JSON.stringify(dados);
      }

      const resposta = await window.fetch(
        configuracao.URL,
        configuracaoFetch
      );

      return await interpretarResposta(resposta);
    } catch (erro) {
      if (erro?.name === "AbortError") {
        throw criarErro(
          "A comunicação com o servidor demorou mais do que o esperado."
        );
      }

      if (erro instanceof TypeError) {
        throw criarErro(
          "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.",
          { causa: erro }
        );
      }

      throw erro;
    } finally {
      window.clearTimeout(temporizador);
    }
  }

  async function enviar(acao, dados = {}) {
    if (!acao || typeof acao !== "string") {
      throw new TypeError("A ação da API precisa ser informada.");
    }

    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
      throw new TypeError("Os dados enviados à API precisam ser um objeto.");
    }

    return requisitar({
      method: "POST",
      dados: {
        acao: acao.trim(),
        ...dados
      }
    });
  }

  async function testarConexao() {
    return requisitar({
      method: "GET"
    });
  }

  window.VR_API = Object.freeze({
    enviar,
    testarConexao
  });
})(window);
