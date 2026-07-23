/* ==========================================================================
   VIDAS RENOVADAS GESTÃO 2.0
   Arquivo: js/visualizar-membro.js
   Descrição: Carregamento e exibição da ficha digital do membro
   ========================================================================== */

"use strict";

(function (window, document) {
  const CAMPOS_DATA = new Set([
    "DATA_CADASTRO",
    "DATA_NASCIMENTO",
    "DATA_EMISSAO_RG",
    "DATA_CONVERSAO",
    "DATA_BATISMO_AGUAS",
    "DATA_BATISMO_ESPIRITO",
    "DATA_ADMISSAO",
    "DATA_CONSAGRACAO",
    "DATA_CASAMENTO",
    "DATA_EMISSAO_CARTEIRINHA",
    "VALIDADE_CARTEIRINHA",
    "ATUALIZADO_EM"
  ]);

  const CAMPOS_FORMATADOS = {
    CPF: (valor) => window.VRG.formatarCPF(valor),
    TELEFONE: (valor) => window.VRG.formatarTelefone(valor),
    WHATSAPP: (valor) => window.VRG.formatarTelefone(valor),
    CEP: (valor) => window.VRG.formatarCEP(valor)
  };

  function obterElementos() {
    return {
      aviso: document.getElementById("avisoFicha"),
      foto: document.getElementById("fotoMembro"),
      fotoPlaceholder: document.getElementById("fotoMembroPlaceholder"),
      botaoEditar: document.getElementById("botaoEditarMembro"),
      botaoCarteirinha: document.getElementById("botaoAbrirCarteirinha"),
      qrCode: document.getElementById("qrCodeMembro")
    };
  }

  function definirAviso(mensagem, ativo = true) {
    const aviso = obterElementos().aviso;
    if (!aviso) return;

    aviso.textContent = mensagem;
    aviso.classList.toggle("ativo", ativo);
  }

  function formatarValor(campo, valor) {
    if (valor === null || valor === undefined || String(valor).trim() === "") {
      return "—";
    }

    if (CAMPOS_DATA.has(campo)) {
      return window.VRG.formatarData(valor) || "—";
    }

    if (CAMPOS_FORMATADOS[campo]) {
      return CAMPOS_FORMATADOS[campo](valor) || "—";
    }

    return String(valor).trim();
  }

  function preencherCampos(membro) {
    document.querySelectorAll("[data-campo]").forEach((elemento) => {
      const campo = elemento.dataset.campo;
      const valor = formatarValor(campo, membro[campo]);

      elemento.textContent = valor;
      elemento.classList.toggle("dado-valor-vazio", valor === "—");
    });
  }

  function preencherFoto(membro) {
    const { foto, fotoPlaceholder } = obterElementos();
    if (!foto || !fotoPlaceholder) return;

    const enderecoFoto = String(
      membro.FOTO_URL || membro.FOTO || ""
    ).trim();

    if (!enderecoFoto) {
      foto.hidden = true;
      foto.removeAttribute("src");
      fotoPlaceholder.hidden = false;
      return;
    }

    foto.onload = () => {
      foto.hidden = false;
      fotoPlaceholder.hidden = true;
    };

    foto.onerror = () => {
      foto.hidden = true;
      foto.removeAttribute("src");
      fotoPlaceholder.hidden = false;
    };

    foto.src = enderecoFoto;
    foto.alt = `Foto de ${membro.NOME_COMPLETO || "membro"}`;
  }

  function configurarAcoes(id, membro) {
    const { botaoEditar, botaoCarteirinha, qrCode } = obterElementos();

    if (botaoEditar) {
      botaoEditar.disabled = false;
      botaoEditar.removeAttribute("title");
      botaoEditar.addEventListener(
        "click",
        () => window.VRG.navegar(
          `editar-membro.html?id=${encodeURIComponent(id)}`
        ),
        { once: true }
      );
    }

    const possuiCarteirinha = Boolean(
      membro.NUMERO_CARTEIRINHA || membro.CODIGO_DIGITAL
    );

    if (botaoCarteirinha) {
      botaoCarteirinha.disabled = !possuiCarteirinha;
      botaoCarteirinha.title = possuiCarteirinha
        ? "A integração visual da carteirinha será conectada na próxima etapa."
        : "Este membro ainda não possui carteirinha emitida.";
    }

    if (qrCode) {
      qrCode.textContent = membro.CODIGO_DIGITAL
        ? String(membro.CODIGO_DIGITAL)
        : "QR CODE";
    }
  }

  async function buscarMembro(id) {
    const resposta = await window.VR_API.enviar("buscarMembro", { id });

    if (!resposta.membro || typeof resposta.membro !== "object") {
      throw new Error("O cadastro do membro não foi retornado pela API.");
    }

    return resposta.membro;
  }

  async function carregarFicha() {
    const id = window.VRG.obterParametro("id");

    if (!id) {
      definirAviso("Não foi informado qual membro deve ser visualizado.");
      window.VRG.erro("O identificador do membro não foi informado.");
      return;
    }

    try {
      const membro = await window.VRG.comCarregamento(
        () => buscarMembro(id),
        "Carregando ficha do membro..."
      );

      preencherCampos(membro);
      preencherFoto(membro);
      configurarAcoes(id, membro);
      definirAviso("", false);
    } catch (falha) {
      console.error("[Visualizar membro]", falha);
      definirAviso(
        falha.message || "Não foi possível carregar a ficha do membro."
      );
      window.VRG.erro(
        falha.message || "Não foi possível carregar a ficha do membro."
      );
    }
  }

  function inicializar() {
    if (!window.VRG || !window.VR_API) {
      definirAviso("Os recursos necessários da página não foram carregados.");
      return;
    }

    carregarFicha();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializar, { once: true });
  } else {
    inicializar();
  }
})(window, document);
