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
    CPF: (valor) => formatarComVRG("formatarCPF", valor),
    TELEFONE: (valor) => formatarComVRG("formatarTelefone", valor),
    WHATSAPP: (valor) => formatarComVRG("formatarTelefone", valor),
    CEP: (valor) => formatarComVRG("formatarCEP", valor)
  };

  function formatarComVRG(nomeFuncao, valor) {
    if (window.VRG && typeof window.VRG[nomeFuncao] === "function") {
      return window.VRG[nomeFuncao](valor);
    }

    return String(valor ?? "").trim();
  }

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

    aviso.textContent = mensagem || "";
    aviso.classList.toggle("ativo", ativo);
  }

  function primeiroValor(objeto, chaves) {
    for (const chave of chaves) {
      const valor = objeto[chave];

      if (
        valor !== undefined &&
        valor !== null &&
        String(valor).trim() !== ""
      ) {
        return valor;
      }
    }

    return "";
  }

  /*
   * O backend retorna os dados em camelCase.
   * A ficha utiliza os nomes oficiais em caixa alta nos atributos data-campo.
   * A normalização é feita somente aqui, na fronteira da página.
   */
  function normalizarMembro(membroApi) {
    return {
      ID: primeiroValor(membroApi, ["ID", "id"]),
      CODIGO: primeiroValor(membroApi, ["CODIGO", "codigo"]),
      NUMERO_CARTEIRINHA: primeiroValor(
        membroApi,
        ["NUMERO_CARTEIRINHA", "numeroCarteirinha"]
      ),

      NOME_COMPLETO: primeiroValor(
        membroApi,
        ["NOME_COMPLETO", "nomeCompleto", "nome"]
      ),

      CPF: primeiroValor(membroApi, ["CPF", "cpf"]),
      RG: primeiroValor(membroApi, ["RG", "rg"]),
      ORGAO_EMISSOR: primeiroValor(
        membroApi,
        ["ORGAO_EMISSOR", "orgaoEmissor"]
      ),
      DATA_EMISSAO_RG: primeiroValor(
        membroApi,
        ["DATA_EMISSAO_RG", "dataEmissaoRg"]
      ),
      TITULO_ELEITOR: primeiroValor(
        membroApi,
        ["TITULO_ELEITOR", "tituloEleitor"]
      ),
      CERTIDAO: primeiroValor(membroApi, ["CERTIDAO", "certidao"]),

      DATA_NASCIMENTO: primeiroValor(
        membroApi,
        ["DATA_NASCIMENTO", "dataNascimento"]
      ),
      SEXO: primeiroValor(membroApi, ["SEXO", "sexo"]),
      ESTADO_CIVIL: primeiroValor(
        membroApi,
        ["ESTADO_CIVIL", "estadoCivil"]
      ),
      PROFISSAO: primeiroValor(membroApi, ["PROFISSAO", "profissao"]),
      NATURALIDADE: primeiroValor(
        membroApi,
        ["NATURALIDADE", "naturalidade"]
      ),
      NACIONALIDADE: primeiroValor(
        membroApi,
        ["NACIONALIDADE", "nacionalidade"]
      ),

      TELEFONE: primeiroValor(membroApi, ["TELEFONE", "telefone"]),
      WHATSAPP: primeiroValor(membroApi, ["WHATSAPP", "whatsapp"]),
      EMAIL: primeiroValor(membroApi, ["EMAIL", "email"]),

      CEP: primeiroValor(membroApi, ["CEP", "cep"]),
      ENDERECO: primeiroValor(membroApi, ["ENDERECO", "endereco"]),
      NUMERO: primeiroValor(membroApi, ["NUMERO", "numero"]),
      COMPLEMENTO: primeiroValor(
        membroApi,
        ["COMPLEMENTO", "complemento"]
      ),
      BAIRRO: primeiroValor(membroApi, ["BAIRRO", "bairro"]),
      CIDADE: primeiroValor(membroApi, ["CIDADE", "cidade"]),
      ESTADO: primeiroValor(membroApi, ["ESTADO", "estado"]),

      DATA_CONVERSAO: primeiroValor(
        membroApi,
        ["DATA_CONVERSAO", "dataConversao"]
      ),
      DATA_BATISMO_AGUAS: primeiroValor(
        membroApi,
        ["DATA_BATISMO_AGUAS", "dataBatismoAguas", "dataBatismo"]
      ),
      DATA_BATISMO_ESPIRITO: primeiroValor(
        membroApi,
        ["DATA_BATISMO_ESPIRITO", "dataBatismoEspirito"]
      ),
      CARGO: primeiroValor(membroApi, ["CARGO", "cargo"]),
      CONGREGACAO: primeiroValor(
        membroApi,
        ["CONGREGACAO", "congregacao"]
      ),
      SITUACAO: primeiroValor(membroApi, ["SITUACAO", "situacao"]),
      DEPARTAMENTO: primeiroValor(
        membroApi,
        ["DEPARTAMENTO", "departamento"]
      ),
      DATA_ADMISSAO: primeiroValor(
        membroApi,
        ["DATA_ADMISSAO", "dataAdmissao"]
      ),
      FORMA_RECEBIMENTO: primeiroValor(
        membroApi,
        ["FORMA_RECEBIMENTO", "formaRecebimento"]
      ),
      IGREJA_ORIGEM: primeiroValor(
        membroApi,
        ["IGREJA_ORIGEM", "igrejaOrigem"]
      ),
      DATA_CONSAGRACAO: primeiroValor(
        membroApi,
        ["DATA_CONSAGRACAO", "dataConsagracao"]
      ),
      MINISTERIO: primeiroValor(membroApi, ["MINISTERIO", "ministerio"]),

      NOME_PAI: primeiroValor(membroApi, ["NOME_PAI", "nomePai", "pai"]),
      NOME_MAE: primeiroValor(membroApi, ["NOME_MAE", "nomeMae", "mae"]),
      CONJUGE: primeiroValor(membroApi, ["CONJUGE", "conjuge"]),
      DATA_CASAMENTO: primeiroValor(
        membroApi,
        ["DATA_CASAMENTO", "dataCasamento"]
      ),
      QUANTIDADE_FILHOS: primeiroValor(
        membroApi,
        ["QUANTIDADE_FILHOS", "quantidadeFilhos"]
      ),
      ID_FAMILIA: primeiroValor(
        membroApi,
        ["ID_FAMILIA", "idFamilia"]
      ),
      FILHOS: primeiroValor(membroApi, ["FILHOS", "filhos"]),

      DATA_EMISSAO_CARTEIRINHA: primeiroValor(
        membroApi,
        ["DATA_EMISSAO_CARTEIRINHA", "dataEmissaoCarteirinha"]
      ),
      VALIDADE_CARTEIRINHA: primeiroValor(
        membroApi,
        ["VALIDADE_CARTEIRINHA", "validadeCarteirinha"]
      ),
      STATUS_CARTEIRINHA: primeiroValor(
        membroApi,
        ["STATUS_CARTEIRINHA", "statusCarteirinha"]
      ),
      CODIGO_DIGITAL: primeiroValor(
        membroApi,
        ["CODIGO_DIGITAL", "codigoDigital", "qrCode", "tokenPublico"]
      ),
      ATUALIZADO_EM: primeiroValor(
        membroApi,
        ["ATUALIZADO_EM", "atualizadoEm", "ultimaAtualizacao"]
      ),
      DATA_CADASTRO: primeiroValor(
        membroApi,
        ["DATA_CADASTRO", "dataCadastro"]
      ),

      FOTO_URL: primeiroValor(
        membroApi,
        ["FOTO_URL", "fotoUrl", "FOTO", "foto"]
      ),

      OBSERVACOES: primeiroValor(
        membroApi,
        ["OBSERVACOES", "observacoes", "observacaoCarteirinha"]
      )
    };
  }

  function formatarValor(campo, valor) {
    if (valor === null || valor === undefined || String(valor).trim() === "") {
      return "—";
    }

    if (CAMPOS_DATA.has(campo)) {
      return formatarComVRG("formatarData", valor) || "—";
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

    const enderecoFoto = String(membro.FOTO_URL || "").trim();

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
        ? "Abrir a carteirinha deste membro."
        : "Este membro ainda não possui carteirinha emitida.";

      if (possuiCarteirinha) {
        botaoCarteirinha.addEventListener(
          "click",
          () => window.VRG.navegar(
            `visualizar-carteirinha.html?id=${encodeURIComponent(id)}`
          ),
          { once: true }
        );
      }
    }

    if (qrCode) {
      const codigo = String(membro.CODIGO_DIGITAL || "").trim();

      if (qrCode.tagName === "IMG") {
        if (codigo && /^(https?:|data:image\/)/i.test(codigo)) {
          qrCode.src = codigo;
          qrCode.alt = "QR Code do membro";
          qrCode.hidden = false;
        } else {
          qrCode.removeAttribute("src");
          qrCode.hidden = true;
        }
      } else {
        qrCode.textContent = codigo || "QR CODE";
      }
    }
  }

  async function buscarMembro(id) {
    if (
      !window.VRGAuth ||
      typeof window.VRGAuth.chamarApi !== "function"
    ) {
      throw new Error(
        "O recurso de autenticação não foi carregado corretamente."
      );
    }

    const resposta = await window.VRGAuth.chamarApi({
      acao: "buscarMembro",
      id
    });

    if (!resposta || resposta.sucesso === false || resposta.ok === false) {
      throw new Error(
        resposta?.mensagem ||
        resposta?.message ||
        "Não foi possível localizar o membro."
      );
    }

    const membroApi =
      resposta.membro ||
      resposta.dados ||
      resposta.data ||
      resposta.resultado ||
      resposta;

    if (!membroApi || typeof membroApi !== "object" || Array.isArray(membroApi)) {
      throw new Error("O cadastro do membro não foi retornado pela API.");
    }

    return normalizarMembro(membroApi);
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

      if (membro.NOME_COMPLETO) {
        document.title = `${membro.NOME_COMPLETO} — Vidas Renovadas Gestão`;
      }
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
    if (
      !window.VRG ||
      !window.VRGAuth ||
      typeof window.VRGAuth.chamarApi !== "function"
    ) {
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
