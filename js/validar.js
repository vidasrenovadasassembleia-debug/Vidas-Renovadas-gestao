/* ==========================================================================
   VIDAS RENOVADAS GESTÃO 2.0
   Arquivo: js/validar.js
   Finalidade: validação pública de credencial por token
   ========================================================================== */

"use strict";

(function (window, document) {
  const API_URL = "https://script.google.com/macros/s/AKfycbzwbSdAn5cyek9DrBy4SVGEZKI5odv6IW5ayjBLEfW1S1JL6dbTPGYqPU23nFM9rTrM/exec";

  const elementos = {
    carregando: document.getElementById("estadoCarregando"),
    erro: document.getElementById("estadoErro"),
    tituloErro: document.getElementById("tituloErro"),
    mensagemErro: document.getElementById("mensagemErro"),
    ficha: document.getElementById("fichaPublica"),

    foto: document.getElementById("fotoMembro"),
    fotoPlaceholder: document.getElementById("fotoPlaceholder"),

    selo: document.getElementById("seloValidacao"),
    nome: document.getElementById("nomeMembro"),
    resumo: document.getElementById("resumoMinisterial"),

    cargo: document.getElementById("cargoMembro"),
    congregacao: document.getElementById("congregacaoMembro"),
    situacao: document.getElementById("situacaoMembro"),
    emissao: document.getElementById("emissaoCarteirinha"),
    validade: document.getElementById("validadeCarteirinha"),

    blocoObservacao: document.getElementById("blocoObservacao"),
    observacao: document.getElementById("observacaoCarteirinha"),

    dataConsulta: document.getElementById("dataConsulta")
  };

  function texto(valor, fallback = "Não informado") {
    const resultado = String(valor ?? "").trim();
    return resultado || fallback;
  }

  function possuiValor(valor) {
    return Boolean(String(valor ?? "").trim());
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

  function formatarData(valor) {
    const data = String(valor ?? "").trim();

    if (!data) {
      return "";
    }

    const formatoBrasileiro = data.match(/^(\d{2})\/(\d{2})\/(\d{4})/);

    if (formatoBrasileiro) {
      return `${formatoBrasileiro[1]}/${formatoBrasileiro[2]}/${formatoBrasileiro[3]}`;
    }

    const formatoIso = data.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (formatoIso) {
      return `${formatoIso[3]}/${formatoIso[2]}/${formatoIso[1]}`;
    }

    const objetoData = new Date(data);

    if (!Number.isNaN(objetoData.getTime())) {
      return new Intl.DateTimeFormat("pt-BR").format(objetoData);
    }

    return data;
  }

  function converterData(valor) {
    const dataFormatada = formatarData(valor);

    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dataFormatada)) {
      return null;
    }

    const [dia, mes, ano] = dataFormatada.split("/").map(Number);
    const data = new Date(ano, mes - 1, dia, 23, 59, 59);

    return Number.isNaN(data.getTime()) ? null : data;
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
        "CARGO"
      ]),

      congregacao: primeiroValor(membro, [
        "congregacao",
        "CONGREGACAO"
      ]),

      situacao: primeiroValor(membro, [
        "situacao",
        "status",
        "SITUACAO"
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
        "VALIDADE_CARTEIRINHA"
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
        "FOTO_URL",
        "FOTO"
      ])
    };
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

  function ocultarFicha() {
    if (elementos.ficha) {
      elementos.ficha.hidden = true;
    }

    if (elementos.foto) {
      elementos.foto.hidden = true;
      elementos.foto.removeAttribute("src");
    }

    if (elementos.fotoPlaceholder) {
      elementos.fotoPlaceholder.hidden = false;
    }
  }

  function mostrarMensagemInstitucional(titulo, mensagem) {
    if (elementos.carregando) {
      elementos.carregando.hidden = true;
    }

    ocultarFicha();

    if (elementos.erro) {
      elementos.erro.hidden = false;
    }

    if (elementos.tituloErro) {
      elementos.tituloErro.textContent = titulo;
    }

    if (elementos.mensagemErro) {
      elementos.mensagemErro.textContent = mensagem;
    }

    document.title =
      titulo + " | Ministério Vidas Renovadas";
  }

  function mostrarCredencialInvalida() {
    mostrarMensagemInstitucional(
      "Credencial não válida",
      "Esta credencial não está ativa no cadastro oficial da " +
      "Assembleia de Deus Ministério Vidas Renovadas."
    );
  }

  function preencherCampoOpcional(bloco, campo, valor) {
    if (!bloco || !campo) {
      return;
    }

    const existe = possuiValor(valor);
    bloco.hidden = !existe;

    if (existe) {
      campo.textContent = String(valor).trim();
    } else {
      campo.textContent = "—";
    }
  }

  function preencherFoto(url, nome) {
    if (!elementos.foto || !elementos.fotoPlaceholder) {
      return;
    }

    if (!possuiValor(url)) {
      elementos.foto.hidden = true;
      elementos.foto.removeAttribute("src");
      elementos.fotoPlaceholder.hidden = false;
      return;
    }

    elementos.foto.alt =
      "Foto de " + texto(nome, "titular da credencial");

    elementos.foto.onload = function () {
      elementos.fotoPlaceholder.hidden = true;
      elementos.foto.hidden = false;
    };

    elementos.foto.onerror = function () {
      elementos.foto.hidden = true;
      elementos.foto.removeAttribute("src");
      elementos.fotoPlaceholder.hidden = false;
    };

    elementos.foto.src = String(url).trim();
  }

  function definirSelo(validade) {
    if (!elementos.selo) {
      return;
    }

    elementos.selo.className = "validation-badge";

    if (credencialEstaVencida(validade)) {
      elementos.selo.textContent = "CREDENCIAL VENCIDA";
      elementos.selo.classList.add("is-expired");
      return;
    }

    elementos.selo.textContent = "CREDENCIAL ATIVA";
  }

  function exibirFichaPublica(membroRecebido) {
    const membro = normalizarMembro(membroRecebido);

    /*
     * Regra de segurança:
     * a ficha pública somente é exibida quando a situação cadastral
     * for exatamente ATIVO ou ATIVA.
     *
     * Situação ausente, inativa, excluída, transferida, falecida,
     * suspensa, bloqueada ou qualquer outra condição não libera dados.
     */
    if (!cadastroEstaAtivo(membro.situacao)) {
      mostrarCredencialInvalida();
      return;
    }

    if (elementos.nome) {
      elementos.nome.textContent = texto(membro.nome);
    }

    if (elementos.cargo) {
      elementos.cargo.textContent = texto(membro.cargo);
    }

    if (elementos.congregacao) {
      elementos.congregacao.textContent = texto(membro.congregacao);
    }

    if (elementos.situacao) {
      elementos.situacao.textContent = "ATIVO";
    }

    if (elementos.emissao) {
      elementos.emissao.textContent =
        texto(formatarData(membro.emissao));
    }

    if (elementos.validade) {
      elementos.validade.textContent =
        texto(formatarData(membro.validade));
    }

    const resumo = [
      possuiValor(membro.cargo)
        ? String(membro.cargo).trim()
        : "",
      possuiValor(membro.congregacao)
        ? String(membro.congregacao).trim()
        : ""
    ].filter(Boolean);

    if (elementos.resumo) {
      elementos.resumo.textContent = resumo.length
        ? resumo.join(" • ")
        : "Credencial ministerial";
    }

    preencherCampoOpcional(
      elementos.blocoObservacao,
      elementos.observacao,
      membro.observacao
    );

    preencherFoto(membro.foto, membro.nome);
    definirSelo(membro.validade);

    if (elementos.dataConsulta) {
      elementos.dataConsulta.textContent =
        new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "short",
          timeStyle: "short"
        }).format(new Date());
    }

    if (elementos.carregando) {
      elementos.carregando.hidden = true;
    }

    if (elementos.erro) {
      elementos.erro.hidden = true;
    }

    if (elementos.ficha) {
      elementos.ficha.hidden = false;
    }

    document.title =
      texto(membro.nome, "Credencial") +
      " | Validação Oficial";
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

      exibirFichaPublica(dados.membro);
    } catch (erro) {
      console.error("[Validação pública]", erro);

      mostrarMensagemInstitucional(
        "Consulta temporariamente indisponível",
        "Não foi possível consultar esta credencial agora. " +
        "Tente novamente em alguns instantes."
      );
    }
  }

  function inicializar() {
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
