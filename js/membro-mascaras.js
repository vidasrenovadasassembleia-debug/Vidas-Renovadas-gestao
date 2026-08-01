/**
 * VIDAS RENOVADAS GESTÃO 2.0
 * Arquivo: js/membro-mascaras.js
 * Máscaras de CPF, CEP, telefone e consulta automática de endereço.
 */

(function (window, document) {
  "use strict";

  function somenteNumeros(valor) {
    return String(valor ?? "").replace(/\D/g, "");
  }

  function formatarCpf(valor) {
    const numeros = somenteNumeros(valor).slice(0, 11);

    return numeros
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2");
  }

  function formatarCep(valor) {
    const numeros = somenteNumeros(valor).slice(0, 8);

    return numeros.replace(/^(\d{5})(\d)/, "$1-$2");
  }

  function formatarTelefone(valor) {
    const numeros = somenteNumeros(valor).slice(0, 11);

    if (numeros.length <= 10) {
      return numeros
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return numeros
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }

  function aplicarMascara(campo, formatador) {
    if (!campo || campo.dataset.mascaraConfigurada === "true") {
      return;
    }

    campo.dataset.mascaraConfigurada = "true";

    const atualizar = function () {
      campo.value = formatador(campo.value);
    };

    campo.addEventListener("input", atualizar);
    campo.addEventListener("blur", atualizar);

    atualizar();
  }

  function definirStatusCep(mensagem) {
    const status = document.getElementById("statusCep");

    if (status) {
      status.textContent = mensagem;
    }
  }

  function preencherCampo(formulario, nome, valor) {
    const campo = formulario.elements.namedItem(nome);

    if (!campo) {
      return;
    }

    campo.value = valor || "";
    campo.dispatchEvent(
      new Event("input", { bubbles: true })
    );
    campo.dispatchEvent(
      new Event("change", { bubbles: true })
    );
  }

  async function buscarCep(formulario, valorCep) {
    const cep = somenteNumeros(valorCep);

    if (cep.length !== 8) {
      definirStatusCep("Digite um CEP válido com 8 números.");
      return;
    }

    definirStatusCep("Buscando endereço...");

    try {
      const resposta = await fetch(
        `https://viacep.com.br/ws/${cep}/json/`
      );

      if (!resposta.ok) {
        throw new Error("Não foi possível consultar o CEP.");
      }

      const dados = await resposta.json();

      if (dados.erro) {
        throw new Error("CEP não encontrado.");
      }

      preencherCampo(formulario, "ENDERECO", dados.logradouro);
      preencherCampo(formulario, "BAIRRO", dados.bairro);
      preencherCampo(formulario, "CIDADE", dados.localidade);
      preencherCampo(formulario, "ESTADO", dados.uf);

      definirStatusCep("Endereço preenchido automaticamente.");

      const numero = formulario.elements.namedItem("NUMERO");

      if (numero) {
        numero.focus();
      }
    } catch (erro) {
      console.error("[MEMBRO] Erro na consulta do CEP:", erro);

      definirStatusCep(
        erro?.message || "Não foi possível buscar o endereço."
      );
    }
  }

  function configurarCep(formulario) {
    const campoCep = formulario.elements.namedItem("CEP");

    if (!campoCep || campoCep.dataset.cepConfigurado === "true") {
      return;
    }

    campoCep.dataset.cepConfigurado = "true";

    let ultimoCepConsultado = "";

    const consultar = function () {
      const cep = somenteNumeros(campoCep.value);

      if (cep.length !== 8 || cep === ultimoCepConsultado) {
        return;
      }

      ultimoCepConsultado = cep;
      buscarCep(formulario, cep);
    };

    campoCep.addEventListener("blur", consultar);

    campoCep.addEventListener("input", function () {
      const cep = somenteNumeros(campoCep.value);

      if (cep.length < 8) {
        ultimoCepConsultado = "";
        definirStatusCep(
          "Digite o CEP para preencher o endereço automaticamente."
        );
        return;
      }

      consultar();
    });
  }

  function inicializar(alvo) {
    const formulario =
      alvo instanceof HTMLFormElement
        ? alvo
        : document.querySelector(alvo || "form");

    if (!formulario) {
      console.warn("[MEMBRO] Formulário não encontrado para máscaras.");
      return;
    }

    aplicarMascara(
      formulario.elements.namedItem("CPF"),
      formatarCpf
    );

    aplicarMascara(
      formulario.elements.namedItem("CEP"),
      formatarCep
    );

    aplicarMascara(
      formulario.elements.namedItem("TELEFONE"),
      formatarTelefone
    );

    aplicarMascara(
      formulario.elements.namedItem("WHATSAPP"),
      formatarTelefone
    );

    configurarCep(formulario);
  }

  window.VRGMembroMascaras = Object.freeze({
    inicializar,
    formatarCpf,
    formatarCep,
    formatarTelefone,
    buscarCep
  });
})(window, document);
