(() => {
  "use strict";

  /*
   * URL da implantação do Apps Script responsável pela validação pública.
   */
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

  function normalizarTexto(valor) {
    return String(valor ?? "")
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function ocultarDadosPublicos() {
    elementos.ficha.hidden = true;

    elementos.nome.textContent = "—";
    elementos.resumo.textContent = "—";
    elementos.cargo.textContent = "—";
    elementos.congregacao.textContent = "—";
    elementos.situacao.textContent = "—";
    elementos.emissao.textContent = "—";
    elementos.validade.textContent = "—";

    elementos.blocoConjuge.hidden = true;
    elementos.blocoPai.hidden = true;
    elementos.blocoMae.hidden = true;
    elementos.blocoObservacao.hidden = true;

    elementos.conjuge.textContent = "—";
    elementos.pai.textContent = "—";
    elementos.mae.textContent = "—";
    elementos.observacao.textContent = "—";

    elementos.foto.removeAttribute("src");
    elementos.foto.hidden = true;
    elementos.fotoPlaceholder.hidden = false;
  }

  function mostrarErro(mensagem) {
    elementos.carregando.hidden = true;
    ocultarDadosPublicos();
    elementos.erro.hidden = false;
    elementos.mensagemErro.textContent = mensagem;

    document.title = "Carteirinha não validada | Vidas Renovadas";
  }

  function preencherCampoOpcional(bloco, campo, valor) {
    const existe = possuiValor(valor);

    bloco.hidden = !existe;
    campo.textContent = existe
      ? String(valor).trim()
      : "—";
  }

  function converterDataBrasileira(data) {
    const valor = String(data ?? "").trim();
    const correspondencia = valor.match(
      /^(\d{2})\/(\d{2})\/(\d{4})$/
    );

    if (!correspondencia) {
      return null;
    }

    const dia = Number(correspondencia[1]);
    const mes = Number(correspondencia[2]);
    const ano = Number(correspondencia[3]);

    const objetoData = new Date(ano, mes - 1, dia, 23, 59, 59, 999);

    const dataValida =
      objetoData.getFullYear() === ano &&
      objetoData.getMonth() === mes - 1 &&
      objetoData.getDate() === dia;

    return dataValida ? objetoData : null;
  }

  function verificarCredencial(membro) {
    const situacao = normalizarTexto(membro.situacao);
    const validadeInformada = possuiValor(membro.validade);
    const validade = converterDataBrasileira(membro.validade);

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (!situacao || !["ativo", "ativa"].includes(situacao)) {
      return {
        valida: false,
        mensagem:
          "Esta credencial não está ativa ou não pode mais ser utilizada."
      };
    }

    if (validadeInformada && !validade) {
      return {
        valida: false,
        mensagem:
          "Não foi possível confirmar a validade desta credencial."
      };
    }

    if (validade && validade < hoje) {
      return {
        valida: false,
        mensagem:
          "Esta credencial está vencida e não pode mais ser utilizada."
      };
    }

    return {
      valida: true,
      mensagem: ""
    };
  }

  function preencherFoto(url, nome) {
    elementos.foto.onload = null;
    elementos.foto.onerror = null;

    if (!possuiValor(url)) {
      elementos.foto.removeAttribute("src");
      elementos.foto.hidden = true;
      elementos.fotoPlaceholder.hidden = false;
      return;
    }

    elementos.foto.alt = "Foto de " + texto(nome, "membro");
    elementos.foto.hidden = true;
    elementos.fotoPlaceholder.hidden = false;

    elementos.foto.onload = () => {
      elementos.fotoPlaceholder.hidden = true;
      elementos.foto.hidden = false;
    };

    elementos.foto.onerror = () => {
      elementos.foto.removeAttribute("src");
      elementos.foto.hidden = true;
      elementos.fotoPlaceholder.hidden = false;
    };

    elementos.foto.src = String(url).trim();
  }

  function formatarDataConsulta() {
    const agora = new Date();

    const data = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(agora);

    const hora = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(agora);

    return `${data}, ${hora}`;
  }

  function exibirMembro(membro) {
    const verificacao = verificarCredencial(membro);

    if (!verificacao.valida) {
      mostrarErro(verificacao.mensagem);
      return;
    }

    elementos.selo.className = "validation-badge";
    elementos.selo.textContent = "🟡 CARTEIRINHA VALIDADA";

    elementos.nome.textContent = texto(membro.nome);
    elementos.cargo.textContent = texto(membro.cargo);
    elementos.congregacao.textContent = texto(membro.congregacao);
    elementos.situacao.textContent = texto(membro.situacao);
    elementos.emissao.textContent = texto(membro.emissao);
    elementos.validade.textContent = texto(membro.validade);

    const resumo = [
      possuiValor(membro.cargo)
        ? String(membro.cargo).trim()
        : "",
      possuiValor(membro.congregacao)
        ? String(membro.congregacao).trim()
        : ""
    ].filter(Boolean);

    elementos.resumo.textContent = resumo.length
      ? resumo.join(" • ")
      : "Membro cadastrado";

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
      membro.observacaoCarteirinha ?? membro.observacao
    );

    preencherFoto(membro.foto, membro.nome);

    elementos.dataConsulta.textContent = formatarDataConsulta();

    elementos.carregando.hidden = true;
    elementos.erro.hidden = true;
    elementos.ficha.hidden = false;

    document.title =
      texto(membro.nome, "Carteirinha") +
      " | Validação de Carteirinha";
  }

  async function consultarCarteirinha() {
    const token = new URLSearchParams(window.location.search)
      .get("token");

    if (!possuiValor(token)) {
      mostrarErro(
        "O endereço acessado não contém um token de validação."
      );
      return;
    }

    if (!API_URL || API_URL.includes("COLE_AQUI")) {
      mostrarErro(
        "A página de validação ainda não foi conectada à API."
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
          "A API respondeu com o código " +
          resposta.status +
          "."
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
      console.error("Erro ao validar carteirinha:", erro);

      mostrarErro(
        "Não foi possível consultar a carteirinha agora. " +
        "Tente novamente em alguns instantes."
      );
    }
  }

  document.addEventListener(
    "DOMContentLoaded",
    consultarCarteirinha
  );
})();
