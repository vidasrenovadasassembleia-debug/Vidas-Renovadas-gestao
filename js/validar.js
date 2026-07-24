/* ==========================================================================
   VIDAS RENOVADAS GESTÃO 2.0
   Arquivo: js/validar.js
   Descrição: Validação pública da carteirinha por token
   ========================================================================== */

"use strict";

(function (window, document) {
  const API_URL = "https://script.google.com/macros/s/AKfycbzwbSdAn5cyek9DrBy4SVGEZKI5odv6IW5ayjBLEfW1S1JL6dbTPGYqPU23nFM9rTrM/exec";

  const elementos = {
    carregando: document.getElementById("estadoCarregando"),
    erro: document.getElementById("estadoErro"),
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

    blocoConjuge: document.getElementById("blocoConjuge"),
    conjuge: document.getElementById("conjugeMembro"),

    blocoPai: document.getElementById("blocoPai"),
    pai: document.getElementById("paiMembro"),

    blocoMae: document.getElementById("blocoMae"),
    mae: document.getElementById("maeMembro"),

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

  function primeiroValor(objeto, nomes) {
    for (const nome of nomes) {
      const valor = objeto?.[nome];

      if (possuiValor(valor)) {
        return valor;
      }
    }

    return "";
  }

  function mostrarErro(mensagem) {
    if (elementos.carregando) elementos.carregando.hidden = true;
    if (elementos.ficha) elementos.ficha.hidden = true;

    if (elementos.erro) {
      elementos.erro.hidden = false;
    }

    if (elementos.mensagemErro) {
      elementos.mensagemErro.textContent = mensagem;
    }
  }

  function preencherCampoOpcional(bloco, campo, valor) {
    if (!bloco || !campo) return;

    const existe = possuiValor(valor);
    bloco.hidden = !existe;

    if (existe) {
      campo.textContent = String(valor).trim();
    }
  }

  function somenteData(valor) {
    const textoData = String(valor ?? "").trim();
    if (!textoData) return "";

    const brasileira = textoData.match(/^(\d{2}\/\d{2}\/\d{4})/);
    if (brasileira) return brasileira[1];

    const iso = textoData.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;

    return textoData;
  }

  function converterDataBrasileira(data) {
    const valor = somenteData(data);

    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) {
      return null;
    }

    const [dia, mes, ano] = valor.split("/").map(Number);
    const objetoData = new Date(ano, mes - 1, dia, 23, 59, 59);

    return Number.isNaN(objetoData.getTime())
      ? null
      : objetoData;
  }

  function normalizarMembro(membro) {
    return {
      nome: primeiroValor(membro, ["nome", "nomeCompleto", "NOME_COMPLETO"]),
      cargo: primeiroValor(membro, ["cargo", "CARGO"]),
      congregacao: primeiroValor(membro, ["congregacao", "CONGREGACAO"]),
      situacao: primeiroValor(membro, ["situacao", "SITUACAO"]),
      emissao: somenteData(
        primeiroValor(membro, [
          "emissao",
          "dataEmissaoCarteirinha",
          "DATA_EMISSAO_CARTEIRINHA"
        ])
      ),
      validade: somenteData(
        primeiroValor(membro, [
          "validade",
          "validadeCarteirinha",
          "VALIDADE_CARTEIRINHA"
        ])
      ),
      conjuge: primeiroValor(membro, ["conjuge", "CONJUGE"]),
      pai: primeiroValor(membro, ["pai", "nomePai", "NOME_PAI"]),
      mae: primeiroValor(membro, ["mae", "nomeMae", "NOME_MAE"]),
      observacao: primeiroValor(membro, [
        "observacao",
        "observacaoCarteirinha",
        "observacoes",
        "OBSERVACOES"
      ]),
      foto: primeiroValor(membro, ["foto", "fotoUrl", "FOTO_URL", "FOTO"])
    };
  }

  function avaliarValidade(membro) {
    if (!elementos.selo) return;

    const situacao = texto(membro.situacao, "").toLowerCase();
    const validade = converterDataBrasileira(membro.validade);
    const hoje = new Date();

    hoje.setHours(0, 0, 0, 0);
    elementos.selo.className = "validation-badge";

    if (validade && validade < hoje) {
      elementos.selo.textContent = "Carteirinha vencida";
      elementos.selo.classList.add("is-expired");
      return;
    }

    if (situacao && situacao !== "ativo" && situacao !== "ativa") {
      elementos.selo.textContent =
        "Cadastro " + texto(membro.situacao, "inativo");
      elementos.selo.classList.add("is-inactive");
      return;
    }

    elementos.selo.textContent = "Carteirinha validada";
  }

  function preencherFoto(url, nome) {
    if (!elementos.foto || !elementos.fotoPlaceholder) return;

    if (!possuiValor(url)) {
      elementos.foto.hidden = true;
      elementos.foto.removeAttribute("src");
      elementos.fotoPlaceholder.hidden = false;
      return;
    }

    elementos.foto.alt = "Foto de " + texto(nome, "membro");

    elementos.foto.onload = () => {
      elementos.fotoPlaceholder.hidden = true;
      elementos.foto.hidden = false;
    };

    elementos.foto.onerror = () => {
      elementos.foto.hidden = true;
      elementos.foto.removeAttribute("src");
      elementos.fotoPlaceholder.hidden = false;
    };

    elementos.foto.src = String(url).trim();
  }

  function exibirMembro(membroRecebido) {
    const membro = normalizarMembro(membroRecebido);

    if (elementos.nome) elementos.nome.textContent = texto(membro.nome);
    if (elementos.cargo) elementos.cargo.textContent = texto(membro.cargo);
    if (elementos.congregacao) {
      elementos.congregacao.textContent = texto(membro.congregacao);
    }
    if (elementos.situacao) {
      elementos.situacao.textContent = texto(membro.situacao);
    }
    if (elementos.emissao) {
      elementos.emissao.textContent = texto(membro.emissao);
    }
    if (elementos.validade) {
      elementos.validade.textContent = texto(membro.validade);
    }

    const resumo = [membro.cargo, membro.congregacao].filter(possuiValor);

    if (elementos.resumo) {
      elementos.resumo.textContent = resumo.length
        ? resumo.join(" • ")
        : "Membro cadastrado";
    }

    preencherCampoOpcional(
      elementos.blocoConjuge,
      elementos.conjuge,
      membro.conjuge
    );

    preencherCampoOpcional(
      elementos.blocoPai,
      elementos.pai,
      membro.pai
    );

    preencherCampoOpcional(
      elementos.blocoMae,
      elementos.mae,
      membro.mae
    );

    preencherCampoOpcional(
      elementos.blocoObservacao,
      elementos.observacao,
      membro.observacao
    );

    preencherFoto(membro.foto, membro.nome);
    avaliarValidade(membro);

    if (elementos.dataConsulta) {
      elementos.dataConsulta.textContent =
        new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "short",
          timeStyle: "short"
        }).format(new Date());
    }

    if (elementos.carregando) elementos.carregando.hidden = true;
    if (elementos.erro) elementos.erro.hidden = true;
    if (elementos.ficha) elementos.ficha.hidden = false;

    document.title =
      texto(membro.nome, "Carteirinha") +
      " | Validação de Carteirinha";
  }

  async function consultarCarteirinha() {
    const token = new URLSearchParams(window.location.search).get("token");

    if (!possuiValor(token)) {
      mostrarErro(
        "O endereço acessado não contém um token de validação."
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
        mostrarErro(
          dados.mensagem ||
          "Carteirinha inválida ou não encontrada."
        );
        return;
      }

      exibirMembro(dados.membro);
    } catch (erro) {
      console.error("[Validar carteirinha]", erro);

      mostrarErro(
        erro.message ||
        "Não foi possível consultar a carteirinha agora."
      );
    }
  }

  function inicializar() {
    consultarCarteirinha();
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
