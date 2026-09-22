/**
 * Carta de Mudança — Vidas Renovadas Gestão
 * Lê o membro pela API existente e preenche o documento sem alterar o cadastro.
 */
(function (window, document) {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const texto = (valor) => String(valor ?? "").trim();

  function definir(id, valor) {
    const elemento = $(id);
    if (elemento) elemento.textContent = texto(valor) || "—";
  }

  function formatarData(valor) {
    const v = texto(valor);
    if (!v) return "—";
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) {
      const [ano, mes, dia] = v.slice(0, 10).split("-");
      return `${dia}/${mes}/${ano}`;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) return v;
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? v : new Intl.DateTimeFormat("pt-BR").format(data);
  }

  function dataPorExtenso(data = new Date()) {
    const partes = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).format(data);
    return partes.replace(/^(\d{2}) de/, (_, dia) => `${Number(dia)} de`);
  }

  function mostrarMensagem(mensagem, tipo = "info") {
    const caixa = $("mensagemCarta");
    if (!caixa) return;
    caixa.textContent = mensagem;
    caixa.className = `mensagem ${tipo}`;
    caixa.hidden = !mensagem;
  }

  function preencherFoto(url) {
    const img = $("fotoMembroCarta");
    const placeholder = $("fotoPlaceholder");
    const origem = texto(url);
    if (!img || !placeholder) return;

    if (!origem) {
      img.hidden = true;
      img.removeAttribute("src");
      placeholder.hidden = false;
      return;
    }

    img.onload = () => {
      img.hidden = false;
      placeholder.hidden = true;
    };
    img.onerror = () => {
      img.hidden = true;
      placeholder.hidden = false;
    };
    img.src = origem;
  }

  function preencherMembro(dados) {
    const M = window.VRGMembroFormulario;
    const membro = M.normalizarMembro(dados || {});

    definir("nomeApresentacao", membro.NOME_COMPLETO);
    definir("nomeMembro", membro.NOME_COMPLETO);
    definir("nascimentoMembro", formatarData(membro.DATA_NASCIMENTO));
    definir("naturalidadeMembro", membro.NATURALIDADE);
    definir("estadoCivilMembro", membro.ESTADO_CIVIL);
    definir("sexoMembro", membro.SEXO);
    definir("batismoMembro", formatarData(membro.DATA_BATISMO_AGUAS));
    definir("admissaoMembro", formatarData(membro.DATA_ADMISSAO));
    definir("cargoMembro", membro.CARGO || "Membro");
    definir("congregacaoMembro", membro.CONGREGACAO);
    preencherFoto(membro.FOTO_URL);
  }

  function sincronizarDestino() {
    const igreja = texto($("igrejaDestino")?.value);
    const destinoTexto = $("igrejaDestinoTexto");
    if (destinoTexto) destinoTexto.textContent = igreja || "________________________________";
  }

  async function iniciar() {
    const M = window.VRGMembroFormulario;
    if (!M) {
      mostrarMensagem("Não foi possível carregar os recursos da ficha de membro.", "erro");
      return;
    }

    const id = M.idUrl();
    if (!id) {
      mostrarMensagem("Não foi informado qual membro deve constar na carta.", "erro");
      return;
    }

    definir("dataEmissao", dataPorExtenso());
    $("igrejaDestino")?.addEventListener("input", sincronizarDestino);
    $("botaoImprimir")?.addEventListener("click", () => window.print());

    try {
      mostrarMensagem("Carregando dados do membro...");
      const membro = await M.buscar(id);
      preencherMembro(membro);
      mostrarMensagem("");
    } catch (erro) {
      mostrarMensagem(erro?.message || "Não foi possível carregar os dados do membro.", "erro");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar, { once: true });
  } else {
    iniciar();
  }
})(window, document);
