/**
 * ==========================================================================
 * CONGREGAÇÕES
 * Vidas Renovadas Gestão 2.0
 * ==========================================================================
 */

"use strict";

const Congregacoes = (() => {

  let listaCompleta = [];
  let listaFiltrada = [];

  function iniciar() {
    configurarEventos();
    carregar();
  }

  function configurarEventos() {

    document
      .getElementById("pesquisaCongregacoes")
      ?.addEventListener("input", aplicarFiltros);

    document
      .getElementById("filtroSituacaoCongregacoes")
      ?.addEventListener("change", aplicarFiltros);

    document
      .getElementById("filtroPastorCongregacoes")
      ?.addEventListener("input", aplicarFiltros);

    document
      .getElementById("botaoNovaCongregacao")
      ?.addEventListener("click", () => {
        window.location.href = "congregacao.html?modo=novo";
      });

  }

  async function carregar() {

    try {

      mostrarCarregando();

      const resposta = await API.post("listarCongregacoes");

      if (!resposta.sucesso) {
        throw new Error("Não foi possível carregar as congregações.");
      }

      listaCompleta = resposta.congregacoes || [];

      aplicarFiltros();

    } catch (erro) {

      console.error("[CONGREGAÇÕES]", erro);

      mostrarErro(
        erro.message || "Erro ao carregar congregações."
      );

    }

  }

  function aplicarFiltros() {

    const pesquisa =
      document
        .getElementById("pesquisaCongregacoes")
        ?.value
        .trim()
        .toLowerCase() || "";

    const pastor =
      document
        .getElementById("filtroPastorCongregacoes")
        ?.value
        .trim()
        .toLowerCase() || "";

    const situacao =
      document
        .getElementById("filtroSituacaoCongregacoes")
        ?.value || "";

    listaFiltrada = listaCompleta.filter(item => {

      const texto =
        (
          item.codigo +
          " " +
          item.nome +
          " " +
          item.pastorResponsavel
        ).toLowerCase();

      const pesquisaOk =
        !pesquisa || texto.includes(pesquisa);

      const pastorOk =
        !pastor ||
        item.pastorResponsavel
          .toLowerCase()
          .includes(pastor);

      const situacaoOk =
        !situacao ||
        (situacao === "ativa" && item.ativa) ||
        (situacao === "inativa" && !item.ativa);

      return pesquisaOk && pastorOk && situacaoOk;

    });

    renderizar();

  }

  function renderizar() {

    const tbody =
      document.getElementById("corpoTabelaCongregacoes");

    const total =
      document.getElementById("totalCongregacoes");

    total.textContent =
      `${listaFiltrada.length} congregaç${listaFiltrada.length===1?"ão":"ões"}`;

    if (!listaFiltrada.length) {

      tbody.innerHTML = `
      <tr>
        <td colspan="7" class="congregacoes-estado-tabela">
          <div class="estado-vazio">
            <p class="estado-vazio-titulo">
              Nenhuma congregação encontrada
            </p>
          </div>
        </td>
      </tr>`;

      return;

    }

    tbody.innerHTML = listaFiltrada.map(item => `
      <tr>

        <td class="congregacoes-codigo">${item.codigo}</td>

        <td class="congregacoes-nome">${item.nome}</td>

        <td>${item.pastorResponsavel}</td>

        <td>${item.telefone || "-"}</td>

        <td>
          <span class="congregacoes-quantidade">--</span>
        </td>

        <td>
          <span class="congregacoes-status ${item.ativa ? "ativa":"inativa"}">
            ${item.ativa ? "Ativa":"Inativa"}
          </span>
        </td>

        <td class="congregacoes-acoes">

          <button
            class="btn btn-contorno"
            onclick="Congregacoes.visualizar('${item.codigo}')">
            Visualizar
          </button>

          <button
            class="btn btn-dourado"
            onclick="Congregacoes.editar('${item.codigo}')">
            Editar
          </button>

        </td>

      </tr>
    `).join("");

  }

  function mostrarCarregando() {
    // estado inicial já definido no HTML
  }

  function mostrarErro(msg) {
    const el = document.getElementById("mensagemCongregacoes");
    if (!el) return;
    el.hidden = false;
    el.textContent = msg;
  }

  function visualizar(codigo) {
    window.location.href =
  `congregacao.html?modo=visualizar&codigo=${encodeURIComponent(codigo)}`;
  }

  function editar(codigo) {
    window.location.href =
  `congregacao.html?modo=editar&codigo=${encodeURIComponent(codigo)}`;
  }

  return {
    iniciar,
    visualizar,
    editar
  };

})();

document.addEventListener(
  "DOMContentLoaded",
  Congregacoes.iniciar
);
