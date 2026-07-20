(() => {
  "use strict";

  /*
   * IMPORTANTE:
   * Cole abaixo a URL da implantação do seu Apps Script.
   * Exemplo:
   * https://script.google.com/macros/s/SEU_ID/exec
   */
  const API_URL = const API_URL = "https://script.google.com/macros/s/AKfycbzwbSdAn5cyek9DrBy4SVGEZKI5odv6IW5ayjBLEfW1S1JL6dbTPGYqPU23nFM9rTrM/exec";

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
    const resultado = String(valor || "").trim();
    return resultado || fallback;
  }

  function possuiValor(valor) {
    return Boolean(String(valor || "").trim());
  }

  function mostrarErro(mensagem) {
    elementos.carregando.hidden = true;
    elementos.ficha.hidden = true;
    elementos.erro.hidden = false;
    elementos.mensagemErro.textContent = mensagem;
  }

  function preencherCampoOpcional(bloco, campo, valor) {
    const existe = possuiValor(valor);
    bloco.hidden = !existe;

    if (existe) {
      campo.textContent = String(valor).trim();
    }
  }

  function converterDataBrasileira(data) {
    const valor = String(data || "").trim();

    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) {
      return null;
    }

    const [dia, mes, ano] = valor.split("/").map(Number);
    const objetoData = new Date(ano, mes - 1, dia, 23, 59, 59);

    return Number.isNaN(objetoData.getTime())
      ? null
      : objetoData;
  }

  function avaliarValidade(membro) {
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
      elementos.selo.textContent = "Cadastro " + texto(membro.situacao, "inativo");
      elementos.selo.classList.add("is-inactive");
      return;
    }

    elementos.selo.textContent = "Carteirinha validada";
  }

  function preencherFoto(url, nome) {
    if (!possuiValor(url)) {
      elementos.foto.hidden = true;
      elementos.fotoPlaceholder.hidden = false;
      return;
    }

    elementos.foto.alt = "Foto de " + texto(nome, "membro");
    elementos.foto.src = String(url).trim();

    elementos.foto.onload = () => {
      elementos.fotoPlaceholder.hidden = true;
      elementos.foto.hidden = false;
    };

    elementos.foto.onerror = () => {
      elementos.foto.hidden = true;
      elementos.fotoPlaceholder.hidden = false;
    };
  }

  function exibirMembro(membro) {
    elementos.nome.textContent = texto(membro.nome);
    elementos.cargo.textContent = texto(membro.cargo);
    elementos.congregacao.textContent = texto(membro.congregacao);
    elementos.situacao.textContent = texto(membro.situacao);
    elementos.emissao.textContent = texto(membro.emissao);
    elementos.validade.textContent = texto(membro.validade);

    const resumo = [
      possuiValor(membro.cargo) ? String(membro.cargo).trim() : "",
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
      membro.observacao
    );

    preencherFoto(membro.foto, membro.nome);
    avaliarValidade(membro);

    elementos.dataConsulta.textContent =
      new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
      }).format(new Date());

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

    if (
      !API_URL ||
      API_URL.includes("COLE_AQUI")
    ) {
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
