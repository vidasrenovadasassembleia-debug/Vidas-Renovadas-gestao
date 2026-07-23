/**
 * ============================================================================
 * VIDAS RENOVADAS GESTÃO 2.0
 * Arquivo: js/membros.js
 * Descrição: Listagem, pesquisa, filtros e seleção de membros
 * ============================================================================
 *
 * Dependências obrigatórias, nesta ordem:
 *   1. js/configuracoes.js
 *   2. js/api.js
 *   3. js/app.js
 *   4. js/auth.js
 *   5. js/membros.js
 * ============================================================================
 */

(function (window, document) {
  "use strict";

  const estado = {
    membros: [],
    membrosExibidos: [],
    idsSelecionados: new Set(),
    carregando: false
  };

  const elementos = {};

  function obterAuth() {
    const auth = window.VRGAuth || window.Auth;

    if (!auth || typeof auth.chamarApi !== "function") {
      throw new Error(
        "O módulo de autenticação não foi carregado corretamente."
      );
    }

    return auth;
  }

  function escaparHtml(valor) {
    return String(valor ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizarTexto(valor) {
    return String(valor ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLocaleLowerCase("pt-BR");
  }

  function obterPrimeiroValor(objeto, nomes, valorPadrao = "") {
    for (const nome of nomes) {
      const valor = objeto?.[nome];

      if (valor !== undefined && valor !== null && String(valor).trim() !== "") {
        return valor;
      }
    }

    return valorPadrao;
  }

  function normalizarMembro(membro) {
    return {
      ...membro,
      id: obterPrimeiroValor(membro, ["id", "ID", "codigo", "Código"]),
      nome: obterPrimeiroValor(
        membro,
        ["nome", "nomeCompleto", "Nome", "Nome Completo"],
        "Nome não informado"
      ),
      cargo: obterPrimeiroValor(membro, ["cargo", "Cargo"], "-"),
      congregacao: obterPrimeiroValor(
        membro,
        ["congregacao", "congregação", "Congregação", "Congregacao"],
        "-"
      ),
      situacao: obterPrimeiroValor(
        membro,
        ["situacao", "situação", "Situação", "Situacao"],
        "Ativo"
      )
    };
  }

  function classePorTexto(prefixo, valor) {
    const texto = normalizarTexto(valor)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return `${prefixo}-${texto || "padrao"}`;
  }

  function criarBadge(tipo, valor, comPonto = false) {
    const texto = valor || "-";
    const classe = classePorTexto(`badge-${tipo}`, texto);

    return `
      <span class="badge-${tipo} ${classe}">
        ${comPonto ? '<span class="badge-status-dot" aria-hidden="true"></span>' : ""}
        ${escaparHtml(texto)}
      </span>
    `;
  }

  function definirMensagemTabela(mensagem) {
    elementos.lista.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          ${escaparHtml(mensagem)}
        </td>
      </tr>
    `;
  }

  function obterMembrosDaResposta(resultado) {
    let membros =
      resultado?.membros ??
      resultado?.dados ??
      resultado?.resultado ??
      [];

    if (typeof membros === "string") {
      try {
        membros = JSON.parse(membros);
      } catch (_) {
        throw new Error("A API retornou uma lista de membros inválida.");
      }
    }

    if (!Array.isArray(membros)) {
      throw new Error("A API retornou os membros em um formato inválido.");
    }

    return membros.map(normalizarMembro);
  }

  function usuarioPodeEditar() {
    const auth = obterAuth();

    return typeof auth.usuarioAdministrador === "function"
      ? auth.usuarioAdministrador()
      : false;
  }

  function criarLinhaMembro(membro) {
    const id = String(membro.id ?? "");
    const idCodificado = encodeURIComponent(id);
    const selecionado = estado.idsSelecionados.has(id);
    const linkVisualizar = `visualizar-membro.html?id=${idCodificado}`;
    const linkEditar = `editar-membro.html?id=${idCodificado}`;

    const editar = usuarioPodeEditar()
      ? `
        <a class="btn-acao btn-secundario" href="${linkEditar}">
          Editar
        </a>
      `
      : "";

    return `
      <tr data-id-membro="${escaparHtml(id)}">
        <td class="coluna-selecao">
          <input
            type="checkbox"
            class="seletor-carteirinha"
            value="${escaparHtml(id)}"
            aria-label="Selecionar ${escaparHtml(membro.nome)}"
            ${selecionado ? "checked" : ""}
          >
        </td>

        <td>${escaparHtml(id || "-")}</td>
        <td>${escaparHtml(membro.nome)}</td>
        <td>${criarBadge("cargo", membro.cargo)}</td>
        <td>${criarBadge("congregacao", membro.congregacao)}</td>
        <td>${criarBadge("situacao", membro.situacao, true)}</td>

        <td>
          <div class="acoes-tabela">
            <a class="btn-acao" href="${linkVisualizar}">
              Visualizar
            </a>
            ${editar}
          </div>
        </td>
      </tr>
    `;
  }

  function renderizarMembros(membros) {
    estado.membrosExibidos = membros;

    if (!membros.length) {
      definirMensagemTabela("Nenhum membro encontrado.");
      atualizarSelecaoGeral();
      return;
    }

    elementos.lista.innerHTML = membros.map(criarLinhaMembro).join("");
    atualizarSelecaoGeral();
  }

  function aplicarFiltros() {
    const pesquisa = normalizarTexto(elementos.pesquisa?.value);
    const situacao = normalizarTexto(elementos.filtroSituacao?.value);
    const congregacao = normalizarTexto(elementos.filtroCongregacao?.value);

    const filtrados = estado.membros.filter((membro) => {
      const textoPesquisavel = normalizarTexto(
        [
          membro.id,
          membro.nome,
          membro.cargo,
          membro.congregacao,
          membro.situacao
        ].join(" ")
      );

      const correspondePesquisa =
        !pesquisa || textoPesquisavel.includes(pesquisa);

      const correspondeSituacao =
        !situacao || normalizarTexto(membro.situacao) === situacao;

      const correspondeCongregacao =
        !congregacao ||
        normalizarTexto(membro.congregacao) === congregacao;

      return (
        correspondePesquisa &&
        correspondeSituacao &&
        correspondeCongregacao
      );
    });

    renderizarMembros(filtrados);
  }

  function preencherFiltroCongregacoes() {
    if (!elementos.filtroCongregacao) return;

    const valorAtual = elementos.filtroCongregacao.value;

    const congregacoes = [...new Set(
      estado.membros
        .map((membro) => String(membro.congregacao || "").trim())
        .filter((valor) => valor && valor !== "-")
    )].sort((a, b) => a.localeCompare(b, "pt-BR"));

    elementos.filtroCongregacao.innerHTML = `
      <option value="">Todas as congregações</option>
      ${congregacoes
        .map(
          (congregacao) =>
            `<option value="${escaparHtml(congregacao)}">${escaparHtml(congregacao)}</option>`
        )
        .join("")}
    `;

    if (congregacoes.includes(valorAtual)) {
      elementos.filtroCongregacao.value = valorAtual;
    }
  }

  function atualizarResumoSelecao() {
    const quantidade = estado.idsSelecionados.size;

    elementos.contador.textContent =
      quantidade === 1
        ? "1 selecionado"
        : `${quantidade} selecionados`;

    elementos.botaoExportar.disabled = quantidade === 0;
  }

  function atualizarSelecaoGeral() {
    const idsExibidos = estado.membrosExibidos
      .map((membro) => String(membro.id ?? ""))
      .filter(Boolean);

    const selecionadosExibidos = idsExibidos.filter((id) =>
      estado.idsSelecionados.has(id)
    );

    elementos.selecionarTodos.checked =
      idsExibidos.length > 0 &&
      selecionadosExibidos.length === idsExibidos.length;

    elementos.selecionarTodos.indeterminate =
      selecionadosExibidos.length > 0 &&
      selecionadosExibidos.length < idsExibidos.length;

    atualizarResumoSelecao();
  }

  function alternarSelecaoIndividual(evento) {
    const seletor = evento.target.closest(".seletor-carteirinha");

    if (!seletor) return;

    const id = String(seletor.value || "");

    if (!id) return;

    if (seletor.checked) {
      estado.idsSelecionados.add(id);
    } else {
      estado.idsSelecionados.delete(id);
    }

    atualizarSelecaoGeral();
  }

  function alternarTodosExibidos() {
    const marcar = elementos.selecionarTodos.checked;

    estado.membrosExibidos.forEach((membro) => {
      const id = String(membro.id ?? "");

      if (!id) return;

      if (marcar) {
        estado.idsSelecionados.add(id);
      } else {
        estado.idsSelecionados.delete(id);
      }
    });

    renderizarMembros(estado.membrosExibidos);
  }

  function exportarSelecionados() {
    const ids = [...estado.idsSelecionados];

    if (!ids.length) return;

    const parametros = new URLSearchParams({
      membros: ids.join(",")
    });

    window.location.href = `carteirinha.html?${parametros.toString()}`;
  }

  async function carregarMembros() {
    if (estado.carregando) return;

    estado.carregando = true;
    definirMensagemTabela("Carregando membros...");

    try {
      const resultado = await obterAuth().chamarApi({
        acao: "listar"
      });

      estado.membros = obterMembrosDaResposta(resultado);
      preencherFiltroCongregacoes();
      aplicarFiltros();
    } catch (erro) {
      console.error("[MEMBROS] Erro ao carregar membros:", erro);

      definirMensagemTabela(
        erro?.message || "Não foi possível carregar os membros."
      );
    } finally {
      estado.carregando = false;
    }
  }

  function capturarElementos() {
    elementos.lista = document.getElementById("listaMembros");
    elementos.pesquisa = document.getElementById("pesquisaMembro");
    elementos.filtroSituacao = document.getElementById("filtroSituacao");
    elementos.filtroCongregacao =
      document.getElementById("filtroCongregacao");
    elementos.selecionarTodos =
      document.getElementById("selecionarTodosMembros");
    elementos.contador = document.getElementById("contadorSelecionados");
    elementos.botaoExportar =
      document.getElementById("botaoExportarSelecionadas");

    return Boolean(
      elementos.lista &&
      elementos.pesquisa &&
      elementos.filtroSituacao &&
      elementos.filtroCongregacao &&
      elementos.selecionarTodos &&
      elementos.contador &&
      elementos.botaoExportar
    );
  }

  function configurarEventos() {
    elementos.pesquisa.addEventListener("input", aplicarFiltros);
    elementos.filtroSituacao.addEventListener("change", aplicarFiltros);
    elementos.filtroCongregacao.addEventListener("change", aplicarFiltros);
    elementos.lista.addEventListener("change", alternarSelecaoIndividual);
    elementos.selecionarTodos.addEventListener(
      "change",
      alternarTodosExibidos
    );
    elementos.botaoExportar.addEventListener(
      "click",
      exportarSelecionados
    );
  }

  function inicializar() {
    if (!capturarElementos()) {
      console.warn(
        "[MEMBROS] A página não contém todos os elementos necessários."
      );
      return;
    }

    configurarEventos();
    atualizarResumoSelecao();
    carregarMembros();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializar, {
      once: true
    });
  } else {
    inicializar();
  }
})(window, document);
