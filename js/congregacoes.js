"use strict";

/* ==========================================================================
   CONGREGAÇÕES — LISTAGEM OFICIAL
   Vidas Renovadas Gestão 2.0
   ========================================================================== */

const Congregacoes = (() => {
  const ESTADO = {
    congregacoes: [],
    filtradas: []
  };

  const $ = (seletor, raiz = document) => raiz.querySelector(seletor);

  function iniciar() {
    configurarEventos();
    carregarCongregacoes();
  }

  function configurarEventos() {
    $("#pesquisaCongregacoes")?.addEventListener("input", aplicarFiltros);
    $("#filtroSituacaoCongregacoes")?.addEventListener("change", aplicarFiltros);
    $("#filtroPastorCongregacoes")?.addEventListener("input", aplicarFiltros);

    $("#botaoNovaCongregacao")?.addEventListener("click", () => {
      window.location.href = "congregacao.html?modo=novo";
    });

    $("#corpoTabelaCongregacoes")?.addEventListener("click", (evento) => {
      const botao = evento.target.closest("[data-acao-congregacao]");

      if (!botao) {
        return;
      }

      const codigo = String(botao.dataset.codigo || "").trim();
      const acao = botao.dataset.acaoCongregacao;

      if (!codigo) {
        return;
      }

      if (acao === "visualizar") {
        abrirFormulario("visualizar", codigo);
      }

      if (acao === "editar") {
        abrirFormulario("editar", codigo);
      }
    });
  }

  async function carregarCongregacoes() {
    mostrarEstadoTabela(
      "Carregando congregações",
      "Aguarde enquanto consultamos os dados.",
      "…"
    );

    try {
      const resposta = await obterApi().enviar("listarCongregacoes");

      ESTADO.congregacoes = Array.isArray(resposta.congregacoes)
        ? resposta.congregacoes
        : [];

      esconderMensagem();
      aplicarFiltros();
    } catch (erro) {
      console.error("[CONGREGAÇÕES] Erro ao carregar:", erro);

      ESTADO.congregacoes = [];
      ESTADO.filtradas = [];

      atualizarTotal(0);
      mostrarMensagem(
        erro?.message || "Não foi possível carregar as congregações.",
        "erro"
      );

      mostrarEstadoTabela(
        "Não foi possível carregar as congregações",
        "Atualize a página e tente novamente.",
        "!"
      );
    }
  }

  function aplicarFiltros() {
    const pesquisa = normalizar($("#pesquisaCongregacoes")?.value || "");
    const responsavel = normalizar(
      $("#filtroPastorCongregacoes")?.value || ""
    );
    const situacao = String(
      $("#filtroSituacaoCongregacoes")?.value || ""
    );

    ESTADO.filtradas = ESTADO.congregacoes.filter((item) => {
      const alvoPesquisa = normalizar(
        [
          item.codigo,
          item.nome,
          item.tipo,
          item.responsavel,
          item.pastorResponsavel,
          item.telefone,
          item.cidade
        ]
          .filter(Boolean)
          .join(" ")
      );

      const alvoResponsavel = normalizar(
        item.responsavel || item.pastorResponsavel || ""
      );

      const pesquisaOk =
        !pesquisa || alvoPesquisa.includes(pesquisa);

      const responsavelOk =
        !responsavel || alvoResponsavel.includes(responsavel);

      const situacaoOk =
        !situacao ||
        (situacao === "ativa" && Boolean(item.ativa)) ||
        (situacao === "inativa" && !Boolean(item.ativa));

      return pesquisaOk && responsavelOk && situacaoOk;
    });

    renderizarTabela();
  }

  function renderizarTabela() {
    const corpo = $("#corpoTabelaCongregacoes");

    if (!corpo) {
      return;
    }

    atualizarTotal(ESTADO.filtradas.length);

    if (!ESTADO.filtradas.length) {
      mostrarEstadoTabela(
        "Nenhuma congregação encontrada",
        ESTADO.congregacoes.length
          ? "Ajuste os filtros para visualizar outros resultados."
          : "Clique em Nova congregação para realizar o primeiro cadastro.",
        "⌂"
      );
      return;
    }

    corpo.innerHTML = ESTADO.filtradas
      .map((item) => montarLinha(item))
      .join("");
  }

  function montarLinha(item) {
    const codigo = String(item.codigo || "").trim();
    const nome = String(item.nome || "").trim();
    const tipo = String(item.tipo || "").trim() || "—";
    const responsavel = String(
      item.responsavel || item.pastorResponsavel || ""
    ).trim() || "—";
    const telefone = String(item.telefone || "").trim() || "—";
    const ativa = Boolean(item.ativa);

    return `
      <tr>
        <td class="congregacoes-codigo">${esc(codigo)}</td>

        <td>
          <span class="congregacoes-nome">${esc(nome)}</span>
          ${
            item.cidade
              ? `<span class="congregacoes-secundario">${esc(item.cidade)}</span>`
              : ""
          }
        </td>

        <td>${esc(tipo)}</td>
        <td>${esc(responsavel)}</td>
        <td>${esc(telefone)}</td>

        <td>
          <span
            class="congregacoes-quantidade"
            title="A contagem de membros será integrada posteriormente"
          >
            —
          </span>
        </td>

        <td>
          <span class="congregacoes-status ${ativa ? "ativa" : "inativa"}">
            ${ativa ? "Ativa" : "Inativa"}
          </span>
        </td>

        <td>
          <div class="congregacoes-acoes">
            <button
              type="button"
              class="btn btn-contorno"
              data-acao-congregacao="visualizar"
              data-codigo="${escAtributo(codigo)}"
            >
              Visualizar
            </button>

            <button
              type="button"
              class="btn btn-dourado"
              data-acao-congregacao="editar"
              data-codigo="${escAtributo(codigo)}"
              data-permissao="membros-editar"
            >
              Editar
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  function mostrarEstadoTabela(titulo, texto, icone) {
    const corpo = $("#corpoTabelaCongregacoes");

    if (!corpo) {
      return;
    }

    corpo.innerHTML = `
      <tr>
        <td colspan="8" class="congregacoes-estado-tabela">
          <div class="estado-vazio">
            <div class="estado-vazio-icone" aria-hidden="true">
              ${esc(icone)}
            </div>

            <p class="estado-vazio-titulo">
              ${esc(titulo)}
            </p>

            <p class="estado-vazio-texto">
              ${esc(texto)}
            </p>
          </div>
        </td>
      </tr>
    `;
  }

  function atualizarTotal(quantidade) {
    const total = $("#totalCongregacoes");

    if (!total) {
      return;
    }

    total.textContent =
      quantidade === 1
        ? "1 congregação"
        : `${quantidade} congregações`;
  }

  function abrirFormulario(modo, codigo) {
    const url = new URL("congregacao.html", window.location.href);
    url.searchParams.set("modo", modo);
    url.searchParams.set("codigo", codigo);
    window.location.href = url.href;
  }

  function mostrarMensagem(texto, tipo) {
    const elemento = $("#mensagemCongregacoes");

    if (!elemento) {
      return;
    }

    elemento.hidden = false;
    elemento.textContent = texto;
    elemento.className = `alerta alerta-${tipo}`;
  }

  function esconderMensagem() {
    const elemento = $("#mensagemCongregacoes");

    if (elemento) {
      elemento.hidden = true;
      elemento.textContent = "";
    }
  }

  function obterApi() {
    if (!window.VR_API || typeof window.VR_API.enviar !== "function") {
      throw new Error(
        "O módulo de comunicação com a API não foi carregado corretamente."
      );
    }

    return window.VR_API;
  }

  function normalizar(valor) {
    return String(valor || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function esc(valor) {
    return String(valor ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escAtributo(valor) {
    return esc(valor);
  }

  return Object.freeze({
    iniciar,
    recarregar: carregarCongregacoes
  });
})();

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    Congregacoes.iniciar,
    { once: true }
  );
} else {
  Congregacoes.iniciar();
}
