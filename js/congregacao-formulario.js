/**
 * ==========================================================================
 * CONGREGAÇÃO - FORMULÁRIO
 * Utilizado por:
 *  - nova-congregacao.html
 *  - editar-congregacao.html
 *  - visualizar-congregacao.html
 * ==========================================================================
 */
"use strict";

const CongregacaoFormulario = (() => {

  const params = new URLSearchParams(window.location.search);
  const codigo = params.get("codigo");
  const modo =
  params.get("modo") || "novo";

  async function iniciar() {
    configurarEventos();

    if (modo !== "novo" && codigo) {
      await carregarCongregacao(codigo);
    }

    if (modo === "visualizar") {
      bloquearFormulario();
    }
  }

  function configurarEventos() {
    document.getElementById("formCongregacao")
      ?.addEventListener("submit", salvar);

    document.getElementById("cep")
      ?.addEventListener("blur", pesquisarCep);
  }

  async function carregarCongregacao(codigo) {
    try {
      const resposta = await API.post("listarCongregacoes");

      if (!resposta.sucesso) {
        throw new Error("Não foi possível carregar a congregação.");
      }

      const congregacao = (resposta.congregacoes || [])
        .find(item => item.codigo === codigo);

      if (!congregacao) {
        throw new Error("Congregação não encontrada.");
      }

      preencherFormulario(congregacao);

    } catch (erro) {
      alert(erro.message);
    }
  }

  function preencherFormulario(dados) {
    definir("codigo", dados.codigo);
    definir("nome", dados.nome);
    definir("responsavel", dados.pastorResponsavel);
    definir("telefone", dados.telefone);
    definir("endereco", dados.endereco);
    definir("ativa", String(!!dados.ativa));
  }

  function coletarDados() {
    return {
      codigo: valor("codigo"),
      nome: valor("nome"),
      pastorResponsavel: valor("responsavel"),
      telefone: valor("telefone"),
      endereco: valor("endereco"),
      ativa: valor("ativa") === "true"
    };
  }

  function validar(dados) {
    if (!dados.nome.trim()) {
      throw new Error("Informe o nome da congregação.");
    }
  }

  async function salvar(evento) {
    evento.preventDefault();

    try {
      const dados = coletarDados();

      validar(dados);

      const resposta = await API.post("salvarCongregacao", dados);

      if (!resposta.sucesso) {
        throw new Error(resposta.mensagem || "Erro ao salvar.");
      }

      alert("Congregação salva com sucesso.");
      window.location.href = "congregacoes.html";

    } catch (erro) {
      alert(erro.message);
    }
  }

  function bloquearFormulario() {
    document
      .querySelectorAll("#formCongregacao input, #formCongregacao select, #formCongregacao textarea")
      .forEach(campo => campo.disabled = true);

    const botao = document.querySelector('#formCongregacao button[type="submit"]');
    if (botao) botao.hidden = true;
  }

  async function pesquisarCep() {
    // reservado para futura integração
  }

  function valor(id) {
    return document.getElementById(id)?.value || "";
  }

  function definir(id, valor) {
    const campo = document.getElementById(id);
    if (campo) campo.value = valor ?? "";
  }

  return { iniciar };

})();

document.addEventListener("DOMContentLoaded", CongregacaoFormulario.iniciar);
