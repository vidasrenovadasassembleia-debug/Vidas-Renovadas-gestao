/* ==========================================================================
   VIDAS RENOVADAS GESTÃO 2.0
   Arquivo: js/editar-membro.js
   Descrição: Carregamento e atualização da ficha digital do membro
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

  let formulario = null;
  let idMembro = "";
  let membroCarregado = null;
  let arquivoFotoSelecionado = null;
  let urlPreviewFoto = "";

  function obterElementos() {
    return {
      aviso: document.getElementById("avisoFicha"),
      campoId: document.getElementById("id"),
      campoFotoUrl: document.getElementById("FOTO_URL"),
      foto: document.getElementById("fotoMembro"),
      fotoPlaceholder: document.getElementById("fotoMembroPlaceholder"),
      arquivoFoto: document.getElementById("arquivoFotoMembro"),
      statusFoto: document.getElementById("statusFoto"),
      resumoCodigo: document.getElementById("resumoCodigo"),
      resumoSituacao: document.getElementById("resumoSituacao"),
      resumoCarteirinha: document.getElementById("resumoCarteirinha"),
      resumoDataCadastro: document.getElementById("resumoDataCadastro"),
      resumoFamilia: document.getElementById("resumoFamilia"),
      cancelarTopo: document.getElementById("botaoCancelarTopo"),
      cancelarRodape: document.getElementById("botaoCancelarRodape"),
      botoesSalvar: Array.from(
        document.querySelectorAll('#formEditarMembro button[type="submit"]')
      )
    };
  }

  function definirAviso(mensagem, ativo = true) {
    const aviso = obterElementos().aviso;
    if (!aviso) return;

    aviso.textContent = mensagem || "";
    aviso.classList.toggle("ativo", ativo);
  }

  function normalizarTexto(valor) {
    if (valor === null || valor === undefined) return "";
    return String(valor).trim();
  }

  function normalizarDataParaCampo(valor) {
    const texto = normalizarTexto(valor);
    if (!texto) return "";

    if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
      return texto.slice(0, 10);
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
      const [dia, mes, ano] = texto.split("/");
      return `${ano}-${mes}-${dia}`;
    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
      return "";
    }

    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  function formatarDataResumo(valor) {
    const texto = normalizarTexto(valor);
    if (!texto) return "—";

    if (window.VRG && typeof window.VRG.formatarData === "function") {
      return window.VRG.formatarData(valor) || "—";
    }

    const dataCampo = normalizarDataParaCampo(valor);
    if (!dataCampo) return texto;

    const [ano, mes, dia] = dataCampo.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function localizarCampo(nome) {
    if (!formulario) return null;
    return formulario.elements.namedItem(nome);
  }

  function garantirOpcaoSelect(select, valor) {
    if (!(select instanceof HTMLSelectElement) || !valor) return;

    const existe = Array.from(select.options).some(
      (opcao) => opcao.value === valor
    );

    if (!existe) {
      select.add(new Option(valor, valor));
    }
  }

  function definirValorCampo(nome, valor) {
    const campo = localizarCampo(nome);
    if (!campo) return;

    let valorFinal = valor;

    if (CAMPOS_DATA.has(nome)) {
      valorFinal = normalizarDataParaCampo(valor);
    } else {
      valorFinal = valor === null || valor === undefined ? "" : String(valor);
    }

    if (campo instanceof HTMLSelectElement) {
      garantirOpcaoSelect(campo, valorFinal);
    }

    campo.value = valorFinal;
  }

  function preencherFormulario(membro) {
    Object.keys(membro).forEach((campo) => {
      definirValorCampo(campo, membro[campo]);
    });

    const elementos = obterElementos();

    if (elementos.campoId) {
      elementos.campoId.value = idMembro;
    }

    if (elementos.campoFotoUrl) {
      elementos.campoFotoUrl.value = normalizarTexto(
        membro.FOTO_URL || membro.FOTO
      );
    }
  }

  function exibirFoto(endereco, nomeMembro = "") {
    const { foto, fotoPlaceholder } = obterElementos();
    if (!foto || !fotoPlaceholder) return;

    const url = normalizarTexto(endereco);

    if (!url) {
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

    foto.src = url;
    foto.alt = `Foto de ${nomeMembro || "membro"}`;
  }

  function preencherFotoAtual(membro) {
    const { statusFoto } = obterElementos();
    const enderecoFoto = normalizarTexto(membro.FOTO_URL || membro.FOTO);

    exibirFoto(enderecoFoto, membro.NOME_COMPLETO);

    if (statusFoto) {
      statusFoto.textContent = enderecoFoto
        ? "Foto atual do membro carregada."
        : "Este membro ainda não possui foto cadastrada.";
    }
  }

  function obterValorCampo(nome) {
    const campo = localizarCampo(nome);
    return campo ? normalizarTexto(campo.value) : "";
  }

  function atualizarResumo() {
    const elementos = obterElementos();

    if (elementos.resumoCodigo) {
      elementos.resumoCodigo.textContent =
        normalizarTexto(
          membroCarregado &&
          (membroCarregado.CODIGO || membroCarregado.ID || idMembro)
        ) || "—";
    }

    if (elementos.resumoSituacao) {
      elementos.resumoSituacao.textContent =
        obterValorCampo("SITUACAO") || "Situação não informada";
    }

    if (elementos.resumoCarteirinha) {
      elementos.resumoCarteirinha.textContent =
        obterValorCampo("NUMERO_CARTEIRINHA") || "—";
    }

    if (elementos.resumoDataCadastro) {
      elementos.resumoDataCadastro.textContent =
        formatarDataResumo(membroCarregado && membroCarregado.DATA_CADASTRO);
    }

    if (elementos.resumoFamilia) {
      elementos.resumoFamilia.textContent =
        obterValorCampo("ID_FAMILIA") || "—";
    }
  }

  function sincronizarEspelhoComCampo(espelho) {
    const nomeCampo = espelho.dataset.espelhoCampo;
    const campoPrincipal = localizarCampo(nomeCampo);
    if (!campoPrincipal) return;

    espelho.value = campoPrincipal.value;

    const atualizarPrincipal = () => {
      campoPrincipal.value = espelho.value;
      campoPrincipal.dispatchEvent(new Event("input", { bubbles: true }));
      campoPrincipal.dispatchEvent(new Event("change", { bubbles: true }));
    };

    espelho.addEventListener("input", atualizarPrincipal);
    espelho.addEventListener("change", atualizarPrincipal);
  }

  function configurarEspelhos() {
    document.querySelectorAll("[data-espelho-campo]").forEach((espelho) => {
      sincronizarEspelhoComCampo(espelho);
    });

    ["NOME_COMPLETO", "CONGREGACAO", "CARGO"].forEach((nome) => {
      const campo = localizarCampo(nome);
      const espelho = document.querySelector(
        `[data-espelho-campo="${nome}"]`
      );

      if (!campo || !espelho) return;

      const atualizarEspelho = () => {
        espelho.value = campo.value;
      };

      campo.addEventListener("input", atualizarEspelho);
      campo.addEventListener("change", atualizarEspelho);
    });
  }

  function configurarAtualizacaoResumo() {
    ["SITUACAO", "NUMERO_CARTEIRINHA", "ID_FAMILIA"].forEach((nome) => {
      const campo = localizarCampo(nome);
      if (!campo) return;

      campo.addEventListener("input", atualizarResumo);
      campo.addEventListener("change", atualizarResumo);
    });
  }

  function configurarCancelamento() {
    const destino = `visualizar-membro.html?id=${encodeURIComponent(idMembro)}`;
    const { cancelarTopo, cancelarRodape } = obterElementos();

    if (cancelarTopo) cancelarTopo.href = destino;
    if (cancelarRodape) cancelarRodape.href = destino;
  }

  function liberarFormulario(liberar) {
    if (!formulario) return;

    formulario.querySelectorAll("input, select, textarea, button").forEach(
      (elemento) => {
        if (
          elemento.id === "id" ||
          elemento.id === "FOTO_URL" ||
          elemento.readOnly
        ) {
          return;
        }

        elemento.disabled = !liberar;
      }
    );
  }

  function definirEstadoSalvamento(salvando) {
    const { botoesSalvar } = obterElementos();

    botoesSalvar.forEach((botao) => {
      if (!botao.dataset.textoOriginal) {
        botao.dataset.textoOriginal =
          botao.textContent.trim() || "Salvar alterações";
      }

      botao.disabled = salvando;
      botao.textContent = salvando
        ? "Salvando..."
        : botao.dataset.textoOriginal;
    });
  }

  function configurarSelecaoFoto() {
    const { arquivoFoto, statusFoto } = obterElementos();
    if (!arquivoFoto) return;

    arquivoFoto.addEventListener("change", () => {
      const arquivo = arquivoFoto.files && arquivoFoto.files[0];

      if (!arquivo) {
        arquivoFotoSelecionado = null;
        return;
      }

      if (!["image/jpeg", "image/png", "image/webp"].includes(arquivo.type)) {
        arquivoFoto.value = "";
        arquivoFotoSelecionado = null;

        if (statusFoto) {
          statusFoto.textContent =
            "Selecione uma imagem JPG, PNG ou WebP.";
        }

        window.VRG.erro("O formato da foto selecionada não é permitido.");
        return;
      }

      arquivoFotoSelecionado = arquivo;

      if (urlPreviewFoto) {
        URL.revokeObjectURL(urlPreviewFoto);
      }

      urlPreviewFoto = URL.createObjectURL(arquivo);
      exibirFoto(urlPreviewFoto, obterValorCampo("NOME_COMPLETO"));

      if (statusFoto) {
        statusFoto.textContent =
          "Nova foto selecionada para visualização. O envio será conectado na etapa de upload.";
      }
    });
  }

  function prepararDados() {
    const dados = window.VRG.formularioParaObjeto(formulario);

    dados.id = idMembro;
    delete dados.acao;

    return dados;
  }

  async function buscarMembro() {
    const resposta = await window.VRGAuth.chamarApi({
      acao: "buscarMembro",
      id: idMembro
    });

    if (!resposta.membro || typeof resposta.membro !== "object") {
      throw new Error("O cadastro do membro não foi retornado pela API.");
    }

    return resposta.membro;
  }

  async function carregarMembro() {
    try {
      const membro = await window.VRG.comCarregamento(
        buscarMembro,
        "Carregando dados do membro..."
      );

      membroCarregado = membro;
      preencherFormulario(membro);
      preencherFotoAtual(membro);
      configurarCancelamento();
      configurarEspelhos();
      configurarAtualizacaoResumo();
      atualizarResumo();
      liberarFormulario(true);
      definirAviso("", false);
    } catch (falha) {
      console.error("[Editar membro] Erro ao carregar:", falha);

      liberarFormulario(false);
      definirAviso(
        falha.message || "Não foi possível carregar os dados do membro."
      );

      window.VRG.erro(
        falha.message || "Não foi possível carregar os dados do membro."
      );
    }
  }

  async function salvarAlteracoes(evento) {
    evento.preventDefault();

    if (!window.VRG.validarFormulario(formulario)) {
      return;
    }

    if (arquivoFotoSelecionado) {
      window.VRG.erro(
        "A nova foto foi apenas pré-visualizada. Conectaremos o envio da foto na próxima etapa."
      );
      return;
    }

    const dados = prepararDados();
    definirEstadoSalvamento(true);

    try {
      await window.VRG.comCarregamento(
        async () => {
          await window.VRGAuth.chamarApi({
            acao: "atualizarMembro",
            dados
          });
        },
        "Salvando alterações..."
      );

      window.VRG.sucesso("Cadastro atualizado com sucesso.");

      window.setTimeout(() => {
        window.VRG.navegar(
          `visualizar-membro.html?id=${encodeURIComponent(idMembro)}`
        );
      }, 650);
    } catch (falha) {
      console.error("[Editar membro] Erro ao salvar:", falha);

      window.VRG.erro(
        falha.message || "Não foi possível salvar as alterações."
      );
    } finally {
      definirEstadoSalvamento(false);
    }
  }

  function inicializar() {
    formulario = document.getElementById("formEditarMembro");

    if (
      !formulario ||
      !window.VRG ||
      !window.VR_API ||
      !window.VRGAuth ||
      typeof window.VRGAuth.chamarApi !== "function"
    ) {
      definirAviso(
        "Os recursos necessários da página não foram carregados corretamente."
      );
      return;
    }

    idMembro = normalizarTexto(window.VRG.obterParametro("id"));

    if (!idMembro) {
      definirAviso("Não foi informado qual membro deve ser editado.");
      liberarFormulario(false);
      window.VRG.erro("O identificador do membro não foi informado.");
      return;
    }

    liberarFormulario(false);
    configurarSelecaoFoto();
    formulario.addEventListener("submit", salvarAlteracoes);
    carregarMembro();
  }

  window.addEventListener("beforeunload", () => {
    if (urlPreviewFoto) {
      URL.revokeObjectURL(urlPreviewFoto);
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializar, { once: true });
  } else {
    inicializar();
  }
})(window, document);
