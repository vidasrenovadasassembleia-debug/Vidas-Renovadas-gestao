/* ==========================================================================
   VIDAS RENOVADAS GESTÃO 2.0
   Arquivo: js/validar.js
   Finalidade: Credencial Digital Oficial por token público
   ========================================================================== */

"use strict";

(function (window, document) {
  const API_URL =
    "https://script.google.com/macros/s/AKfycbzwbSdAn5cyek9DrBy4SVGEZKI5odv6IW5ayjBLEfW1S1JL6dbTPGYqPU23nFM9rTrM/exec";

  const elementos = {};

  function mapearElementos() {
    [
      "estadoCarregando",
      "estadoErro",
      "tituloErro",
      "mensagemErro",
      "credencialDigital",
      "fotoMembro",
      "fotoPlaceholder",
      "seloCredencial",
      "nomeMembro",
      "cargoMembro",
      "congregacaoMembro",
      "situacaoMembro",
      "dataEmissao",
      "dataValidade",
      "dataNascimento",
      "estadoCivil",
      "campoConjuge",
      "nomeConjuge",
      "secaoContato",
      "telefoneMembro",
      "secaoObservacoes",
      "observacoesMembro",
      "dataConsulta"
    ].forEach(function (id) {
      elementos[id] = document.getElementById(id);
    });
  }

  function possuiValor(valor) {
    return Boolean(String(valor ?? "").trim());
  }

  function texto(valor, fallback = "Não informado") {
    const resultado = String(valor ?? "").trim();
    return resultado || fallback;
  }

  function normalizarTexto(valor) {
    return String(valor ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  }

  function primeiroValor(objeto, nomes) {
    for (const nome of nomes) {
      const valor = objeto?.[nome];

      if (possuiValor(valor)) {
        return valor;
      }
    }

    return "";
  }

  function normalizarMembro(membro) {
    return {
      nome: primeiroValor(membro, [
        "nome",
        "nomeCompleto",
        "NOME_COMPLETO"
      ]),

      cargo: primeiroValor(membro, [
        "cargo",
        "funcao",
        "funcaoMinisterial",
        "CARGO",
        "FUNCAO"
      ]),

      congregacao: primeiroValor(membro, [
        "congregacao",
        "CONGREGACAO"
      ]),

      situacao: primeiroValor(membro, [
        "situacao",
        "status",
        "SITUACAO",
        "STATUS"
      ]),

      emissao: primeiroValor(membro, [
        "emissao",
        "dataEmissao",
        "dataEmissaoCarteirinha",
        "DATA_EMISSAO_CARTEIRINHA"
      ]),

      validade: primeiroValor(membro, [
        "validade",
        "validadeCarteirinha",
        "dataValidade",
        "VALIDADE_CARTEIRINHA"
      ]),

      dataNascimento: primeiroValor(membro, [
        "dataNascimento",
        "nascimento",
        "DATA_NASCIMENTO"
      ]),

      estadoCivil: primeiroValor(membro, [
        "estadoCivil",
        "ESTADO_CIVIL"
      ]),

      conjuge: primeiroValor(membro, [
        "nomeConjuge",
        "conjuge",
        "NOME_CONJUGE",
        "CONJUGE"
      ]),

      telefone: primeiroValor(membro, [
        "telefone",
        "celular",
        "whatsapp",
        "TELEFONE",
        "CELULAR"
      ]),

      observacao: primeiroValor(membro, [
        "observacaoCarteirinha",
        "observacao",
        "observacoes",
        "OBSERVACAO_CARTEIRINHA",
        "OBSERVACOES"
      ]),

      foto: primeiroValor(membro, [
        "foto",
        "fotoUrl",
        "urlFoto",
        "FOTO_URL",
        "FOTO"
      ])
    };
  }

  function formatarData(valor) {
    const data = String(valor ?? "").trim();

    if (!data) {
      return "—";
    }

    const brasileira = data.match(/^(\d{2})\/(\d{2})\/(\d{4})/);

    if (brasileira) {
      return `${brasileira[1]}/${brasileira[2]}/${brasileira[3]}`;
    }

    const iso = data.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (iso) {
      return `${iso[3]}/${iso[2]}/${iso[1]}`;
    }

    const objetoData = new Date(data);

    if (!Number.isNaN(objetoData.getTime())) {
      return new Intl.DateTimeFormat("pt-BR").format(objetoData);
    }

    return data;
  }

  function converterData(valor) {
    const data = formatarData(valor);

    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
      return null;
    }

    const [dia, mes, ano] = data.split("/").map(Number);
    const resultado = new Date(ano, mes - 1, dia, 23, 59, 59);

    return Number.isNaN(resultado.getTime()) ? null : resultado;
  }

  function formatarTelefone(valor) {
    const original = String(valor ?? "").trim();
    const numeros = original.replace(/\D/g, "");

    if (numeros.length === 11) {
      return numeros.replace(
        /^(\d{2})(\d{5})(\d{4})$/,
        "($1) $2-$3"
      );
    }

    if (numeros.length === 10) {
      return numeros.replace(
        /^(\d{2})(\d{4})(\d{4})$/,
        "($1) $2-$3"
      );
    }

    return original;
  }

  function cadastroEstaAtivo(situacao) {
    const valor = normalizarTexto(situacao);
    return valor === "ativo" || valor === "ativa";
  }

  function credencialEstaVencida(validade) {
    const dataValidade = converterData(validade);

    if (!dataValidade) {
      return false;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return dataValidade < hoje;
  }

  function definirTexto(elemento, valor, fallback = "—") {
    if (elemento) {
      elemento.textContent = texto(valor, fallback);
    }
  }

  function ocultarCredencial() {
    if (elementos.credencialDigital) {
      elementos.credencialDigital.hidden = true;
    }

    if (elementos.fotoMembro) {
      elementos.fotoMembro.hidden = true;
      elementos.fotoMembro.removeAttribute("src");
    }

    if (elementos.fotoPlaceholder) {
      elementos.fotoPlaceholder.hidden = false;
    }
  }

  function mostrarMensagemInstitucional(titulo, mensagem) {
    if (elementos.estadoCarregando) {
      elementos.estadoCarregando.hidden = true;
    }

    ocultarCredencial();

    if (elementos.estadoErro) {
      elementos.estadoErro.hidden = false;
    }

    definirTexto(elementos.tituloErro, titulo, "");
    definirTexto(elementos.mensagemErro, mensagem, "");

    document.title =
      titulo + " | Ministério Vidas Renovadas";
  }

  function mostrarCredencialInvalida() {
    mostrarMensagemInstitucional(
      "Credencial não válida",
      "Esta credencial não está ativa no cadastro oficial da Assembleia de Deus Ministério Vidas Renovadas."
    );
  }

  function preencherFoto(url, nome) {
    if (!elementos.fotoMembro || !elementos.fotoPlaceholder) {
      return;
    }

    if (!possuiValor(url)) {
      elementos.fotoMembro.hidden = true;
      elementos.fotoMembro.removeAttribute("src");
      elementos.fotoPlaceholder.hidden = false;
      return;
    }

    elementos.fotoMembro.alt =
      "Foto de " + texto(nome, "titular da credencial");

    elementos.fotoMembro.onload = function () {
      elementos.fotoPlaceholder.hidden = true;
      elementos.fotoMembro.hidden = false;
    };

    elementos.fotoMembro.onerror = function () {
      elementos.fotoMembro.hidden = true;
      elementos.fotoMembro.removeAttribute("src");
      elementos.fotoPlaceholder.hidden = false;
    };

    elementos.fotoMembro.src = String(url).trim();
  }

  function configurarConjuge(estadoCivil, conjuge) {
    if (!elementos.campoConjuge || !elementos.nomeConjuge) {
      return;
    }

    const estado = normalizarTexto(estadoCivil);

    const casado =
      estado.includes("casad") ||
      estado.includes("uniao estavel");

    if (casado && possuiValor(conjuge)) {
      definirTexto(elementos.nomeConjuge, conjuge);
      elementos.campoConjuge.hidden = false;
      return;
    }

    elementos.campoConjuge.hidden = true;
    elementos.nomeConjuge.textContent = "—";
  }

  function configurarContato(telefone) {
    if (!elementos.secaoContato || !elementos.telefoneMembro) {
      return;
    }

    if (!possuiValor(telefone)) {
      elementos.secaoContato.hidden = true;
      elementos.telefoneMembro.textContent = "—";
      return;
    }

    elementos.telefoneMembro.textContent =
      formatarTelefone(telefone);

    elementos.secaoContato.hidden = false;
  }

  function configurarObservacoes(observacao) {
    if (!elementos.secaoObservacoes || !elementos.observacoesMembro) {
      return;
    }

    if (!possuiValor(observacao)) {
      elementos.secaoObservacoes.hidden = true;
      elementos.observacoesMembro.textContent = "—";
      return;
    }

    elementos.observacoesMembro.textContent =
      String(observacao).trim();

    elementos.secaoObservacoes.hidden = false;
  }

  function configurarValidade(validade) {
    const vencida = credencialEstaVencida(validade);

    if (elementos.dataValidade) {
      elementos.dataValidade.classList.toggle(
        "is-expired",
        vencida
      );
    }

    if (elementos.seloCredencial) {
      elementos.seloCredencial.className = "validation-badge";

      if (vencida) {
        elementos.seloCredencial.textContent =
          "Credencial Digital Expirada";

        elementos.seloCredencial.classList.add("is-expired");
      } else {
        elementos.seloCredencial.textContent =
          "Credencial Digital Oficial";
      }
    }
  }

  function exibirCredencial(membroRecebido) {
    const membro = normalizarMembro(membroRecebido);

    if (!cadastroEstaAtivo(membro.situacao)) {
      mostrarCredencialInvalida();
      return;
    }

    definirTexto(elementos.nomeMembro, membro.nome);
    definirTexto(elementos.cargoMembro, membro.cargo, "Membro");
    definirTexto(elementos.congregacaoMembro, membro.congregacao);
    definirTexto(elementos.situacaoMembro, "ATIVO");
    definirTexto(elementos.dataEmissao, formatarData(membro.emissao));
    definirTexto(elementos.dataValidade, formatarData(membro.validade));
    definirTexto(
      elementos.dataNascimento,
      formatarData(membro.dataNascimento)
    );
    definirTexto(elementos.estadoCivil, membro.estadoCivil);

    preencherFoto(membro.foto, membro.nome);
    configurarConjuge(membro.estadoCivil, membro.conjuge);
    configurarContato(membro.telefone);
    configurarObservacoes(membro.observacao);
    configurarValidade(membro.validade);

    if (elementos.dataConsulta) {
      elementos.dataConsulta.textContent =
        "Consulta realizada em " +
        new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "short",
          timeStyle: "short"
        }).format(new Date());
    }

    if (elementos.estadoCarregando) {
      elementos.estadoCarregando.hidden = true;
    }

    if (elementos.estadoErro) {
      elementos.estadoErro.hidden = true;
    }

    if (elementos.credencialDigital) {
      elementos.credencialDigital.hidden = false;
    }

    document.title =
      texto(membro.nome, "Credencial") +
      " | Credencial Digital Oficial";
  }

  async function consultarCredencial() {
    const token =
      new URLSearchParams(window.location.search).get("token");

    if (!possuiValor(token)) {
      mostrarMensagemInstitucional(
        "Credencial não localizada",
        "O endereço acessado não contém um token de validação válido."
      );
      return;
    }

    try {
      const resposta = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
          acao: "validarCarteirinha",
          token: token.trim()
        }),
        cache: "no-store"
      });

      if (!resposta.ok) {
        throw new Error(
          "A API respondeu com o código " + resposta.status + "."
        );
      }

      const dados = await resposta.json();

      if (!dados.sucesso || !dados.membro) {
        mostrarCredencialInvalida();
        return;
      }

      exibirCredencial(dados.membro);
    } catch (erro) {
      console.error("[Credencial Digital]", erro);

      mostrarMensagemInstitucional(
        "Consulta temporariamente indisponível",
        "Não foi possível consultar esta credencial agora. Tente novamente em alguns instantes."
      );
    }
  }

  function inicializar() {
    mapearElementos();
    consultarCredencial();
  }

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
