"use strict";

/* ==========================================================================
   CARTÃO DE ANIVERSÁRIO
   Vidas Renovadas Gestão 2.0
   ========================================================================== */

(function (window, document) {

  const ACAO_BUSCAR_MEMBRO = "buscarMembro";

  const elementos = {};

  document.addEventListener(
    "DOMContentLoaded",
    iniciar
  );

  async function iniciar() {
    mapearElementos();
    configurarEventos();

    const identificador =
      obterIdentificadorDaUrl();

    if (!identificador) {
      mostrarErro(
        "Não foi informado qual membro deve ser exibido."
      );
      return;
    }

    try {
      mostrarStatus(
        "Carregando dados do aniversariante..."
      );

      const resposta =
        await buscarMembro(identificador);

      const membro =
        extrairMembro(resposta);

      if (!membro) {
        throw new Error(
          resposta?.mensagem ||
          "Membro não encontrado."
        );
      }

      preencherCartao(membro);

      elementos.areaCartao.hidden = false;
      ocultarStatus();

    } catch (erro) {
      console.error(
        "[CARTÃO DE ANIVERSÁRIO]",
        erro
      );

      mostrarErro(
        erro?.message ||
        "Não foi possível carregar o cartão."
      );
    }
  }

  function mapearElementos() {
    elementos.status =
      document.getElementById(
        "statusCartao"
      );

    elementos.areaCartao =
      document.getElementById(
        "areaCartao"
      );

    elementos.botaoImprimir =
      document.getElementById(
        "botaoImprimirCartao"
      );

    elementos.nome =
      document.getElementById(
        "nomeMembroAniversario"
      );

    elementos.congregacao =
      document.getElementById(
        "congregacaoMembroAniversario"
      );

    elementos.foto =
      document.getElementById(
        "fotoMembroAniversario"
      );

    elementos.fotoPlaceholder =
      document.getElementById(
        "fotoPlaceholderAniversario"
      );
  }

  function configurarEventos() {
    elementos.botaoImprimir
      ?.addEventListener(
        "click",
        function () {
          window.print();
        }
      );

    elementos.foto
      ?.addEventListener(
        "error",
        function () {
          ocultarFoto();
        }
      );
  }

  function obterIdentificadorDaUrl() {
    const parametros =
      new URLSearchParams(
        window.location.search
      );

    return (
      parametros.get("id") ||
      parametros.get("codigo") ||
      parametros.get("membro") ||
      ""
    ).trim();
  }

  async function buscarMembro(
    identificador
  ) {
    const auth =
      window.VRGAuth ||
      window.Auth;

    if (
      auth &&
      typeof auth.chamarApi === "function"
    ) {
      return auth.chamarApi({
        acao: ACAO_BUSCAR_MEMBRO,
        id: identificador,
        codigo: identificador
      });
    }

    throw new Error(
      "O módulo de autenticação/API não foi carregado."
    );
  }

  function extrairMembro(resposta) {
    if (
      !resposta ||
      typeof resposta !== "object"
    ) {
      return null;
    }

    if (
      resposta.sucesso === false ||
      resposta.success === false
    ) {
      return null;
    }

    if (
      resposta.membro &&
      typeof resposta.membro === "object"
    ) {
      return resposta.membro;
    }

    if (
      resposta.dados &&
      typeof resposta.dados === "object"
    ) {
      if (
        resposta.dados.membro &&
        typeof resposta.dados.membro ===
          "object"
      ) {
        return resposta.dados.membro;
      }

      return resposta.dados;
    }

    if (
      resposta.data &&
      typeof resposta.data === "object"
    ) {
      if (
        resposta.data.membro &&
        typeof resposta.data.membro ===
          "object"
      ) {
        return resposta.data.membro;
      }

      return resposta.data;
    }

    if (
      resposta.nome ||
      resposta.nomeCompleto ||
      resposta.codigo ||
      resposta.id
    ) {
      return resposta;
    }

    return null;
  }

  function preencherCartao(membro) {
    const nome =
      primeiroValor(
        membro.nomeCompleto,
        membro.nome,
        membro.nomeMembro
      );

    const congregacao =
      primeiroValor(
        membro.congregacao,
        membro.igreja,
        membro.local
      );

    const foto =
      primeiroValor(
        membro.foto,
        membro.fotoUrl,
        membro.urlFoto,
        membro.imagem
      );

    definirTexto(
      elementos.nome,
      nome || "Nome não informado"
    );

    definirTexto(
      elementos.congregacao,
      congregacao ||
      "Congregação não informada"
    );

    preencherFoto(
      foto,
      nome
    );

    document.title =
      `${nome || "Membro"} | Cartão de Aniversário`;
  }

  function preencherFoto(
    url,
    nome
  ) {
    if (!url) {
      ocultarFoto();
      atualizarIniciais(nome);
      return;
    }

    elementos.foto.src =
      String(url).trim();

    elementos.foto.alt =
      `Foto de ${nome || "membro"}`;

    elementos.foto.hidden = false;
    elementos.fotoPlaceholder.hidden =
      true;
  }

  function ocultarFoto() {
    if (elementos.foto) {
      elementos.foto.hidden = true;
      elementos.foto.removeAttribute(
        "src"
      );
    }

    if (elementos.fotoPlaceholder) {
      elementos.fotoPlaceholder.hidden =
        false;
    }
  }

  function atualizarIniciais(nome) {
    if (
      !elementos.fotoPlaceholder
    ) {
      return;
    }

    const partes =
      String(nome || "VR")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    const iniciais =
      partes.length === 1
        ? partes[0].slice(0, 2)
        : (
            partes[0][0] +
            partes[
              partes.length - 1
            ][0]
          );

    elementos.fotoPlaceholder
      .textContent =
        iniciais.toUpperCase();
  }

  function primeiroValor(
    ...valores
  ) {
    return valores.find(
      function (valor) {
        return (
          valor !== undefined &&
          valor !== null &&
          String(valor).trim() !== ""
        );
      }
    );
  }

  function definirTexto(
    elemento,
    valor
  ) {
    if (elemento) {
      elemento.textContent = valor;
    }
  }

  function mostrarStatus(
    mensagem
  ) {
    if (!elementos.status) {
      return;
    }

    elementos.status.hidden = false;
    elementos.status.textContent =
      mensagem;

    elementos.status.classList.remove(
      "erro"
    );
  }

  function ocultarStatus() {
    if (elementos.status) {
      elementos.status.hidden = true;
    }
  }

  function mostrarErro(
    mensagem
  ) {
    if (elementos.areaCartao) {
      elementos.areaCartao.hidden =
        true;
    }

    if (elementos.status) {
      elementos.status.hidden = false;
      elementos.status.textContent =
        mensagem;

      elementos.status.classList.add(
        "erro"
      );
    }
  }

})(window, document);
