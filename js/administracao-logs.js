"use strict";

/* ==========================================================================
   ADMINISTRAÇÃO — LOGS E AUDITORIA
   Vidas Renovadas Gestão 2.0
   ========================================================================== */

(function (window, document) {

  const ACOES_API = Object.freeze({
    LISTAR: "listarLogs"
  });

  let contexto = null;

  const estado = {
    registros: [],
    carregando: false,
    limite: 100
  };

  const referencias = {};

  function texto(valor) {
    return String(valor ?? "").trim();
  }

  function escaparHtml(valor) {
    return String(valor ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatarDataHora(valor) {
    const bruto = texto(valor);

    if (!bruto) {
      return "—";
    }

    if (/^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}$/.test(bruto)) {
      return bruto;
    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
      return bruto;
    }

    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "medium"
    }).format(data);
  }

  function normalizarRegistro(item) {
    item = item && typeof item === "object"
      ? item
      : {};

    return {
      dataHora:
        item.DATA_HORA ??
        item.dataHora ??
        item.data ??
        "",

      acao:
        item.ACAO ??
        item.acao ??
        "",

      modulo:
        item.MODULO ??
        item.modulo ??
        "",

      referencia:
        item.REFERENCIA ??
        item.referencia ??
        "",

      usuario:
        item.USUARIO ??
        item.usuario ??
        "",

      email:
        item.EMAIL ??
        item.email ??
        "",

      perfil:
        item.PERFIL ??
        item.perfil ??
        "",

      detalhes:
        item.DETALHES ??
        item.detalhes ??
        ""
    };
  }

  function montarEstrutura() {
    contexto.container.innerHTML = `
      <div class="administracao-bloco">

        <div
          style="
            display:flex;
            gap:16px;
            align-items:flex-end;
            justify-content:space-between;
            flex-wrap:wrap;
          "
        >
          <div>
            <h4 class="administracao-bloco-titulo">
              Logs e auditoria
            </h4>

            <p class="administracao-bloco-descricao">
              Consulte as ações e movimentações registradas no sistema.
            </p>
          </div>

          <div
            style="
              display:flex;
              gap:10px;
              align-items:flex-end;
              flex-wrap:wrap;
            "
          >
            <div class="campo" style="min-width:180px;">
              <label for="limiteLogsAdministracao">
                Quantidade
              </label>

              <select id="limiteLogsAdministracao">
                <option value="50">50 registros</option>
                <option value="100" selected>100 registros</option>
                <option value="200">200 registros</option>
                <option value="500">500 registros</option>
              </select>
            </div>

            <button
              type="button"
              class="btn btn-contorno"
              id="botaoAtualizarLogsAdministracao"
            >
              Atualizar
            </button>
          </div>
        </div>

      </div>

      <div
        class="administracao-bloco"
        style="margin-top:18px;"
      >
        <div
          style="
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:12px;
            flex-wrap:wrap;
            margin-bottom:14px;
          "
        >
          <div>
            <h4 class="administracao-bloco-titulo">
              Registros
            </h4>

            <p
              class="administracao-bloco-descricao"
              id="resumoLogsAdministracao"
            >
              Carregando registros...
            </p>
          </div>
        </div>

        <div
          id="estadoVazioLogsAdministracao"
          class="administracao-estado"
          hidden
        >
          <strong>Nenhum log encontrado</strong>
          <p>
            Ainda não existem registros de auditoria disponíveis.
          </p>
        </div>

        <div
          id="tabelaLogsAdministracaoArea"
          class="administracao-tabela-area"
          hidden
          style="overflow:auto;"
        >
          <table
            class="administracao-tabela"
            style="min-width:1180px;"
          >
            <thead>
              <tr>
                <th>Data / Hora</th>
                <th>Ação</th>
                <th>Módulo</th>
                <th>Referência</th>
                <th>Usuário</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Detalhes</th>
              </tr>
            </thead>

            <tbody id="corpoTabelaLogsAdministracao"></tbody>
          </table>
        </div>
      </div>
    `;

    [
      "limiteLogsAdministracao",
      "botaoAtualizarLogsAdministracao",
      "resumoLogsAdministracao",
      "estadoVazioLogsAdministracao",
      "tabelaLogsAdministracaoArea",
      "corpoTabelaLogsAdministracao"
    ].forEach(function (id) {
      referencias[id] =
        document.getElementById(id);
    });
  }

  function renderizarTabela() {
    const registros =
      Array.isArray(estado.registros)
        ? estado.registros
        : [];

    referencias.corpoTabelaLogsAdministracao.innerHTML =
      "";

    referencias.resumoLogsAdministracao.textContent =
      registros.length === 1
        ? "1 registro encontrado."
        : `${registros.length} registros encontrados.`;

    referencias.estadoVazioLogsAdministracao.hidden =
      Boolean(registros.length);

    referencias.tabelaLogsAdministracaoArea.hidden =
      !registros.length;

    if (!registros.length) {
      return;
    }

    referencias.corpoTabelaLogsAdministracao.innerHTML =
      registros.map(function (registro) {
        return `
          <tr>
            <td>
              ${escaparHtml(
                formatarDataHora(registro.dataHora)
              )}
            </td>

            <td>
              <strong>
                ${escaparHtml(
                  texto(registro.acao) || "—"
                )}
              </strong>
            </td>

            <td>
              ${escaparHtml(
                texto(registro.modulo) || "—"
              )}
            </td>

            <td>
              ${escaparHtml(
                texto(registro.referencia) || "—"
              )}
            </td>

            <td>
              ${escaparHtml(
                texto(registro.usuario) || "—"
              )}
            </td>

            <td>
              ${escaparHtml(
                texto(registro.email) || "—"
              )}
            </td>

            <td>
              ${escaparHtml(
                texto(registro.perfil) || "—"
              )}
            </td>

            <td>
              ${escaparHtml(
                texto(registro.detalhes) || "—"
              )}
            </td>
          </tr>
        `;
      }).join("");
  }

  function normalizarResposta(resposta) {
    const origem =
      resposta?.logs ??
      resposta?.registros ??
      resposta?.dados ??
      resposta;

    const lista =
      Array.isArray(origem)
        ? origem
        : [];

    return lista.map(normalizarRegistro);
  }

  async function carregarLogs() {
    if (estado.carregando) {
      return;
    }

    estado.carregando = true;

    contexto.limparAviso();

    referencias.botaoAtualizarLogsAdministracao.disabled =
      true;

    referencias.limiteLogsAdministracao.disabled =
      true;

    referencias.resumoLogsAdministracao.textContent =
      "Carregando registros...";

    try {
      contexto.definirCarregamentoGlobal(
        true,
        "Carregando logs..."
      );

      const resposta =
        await contexto.chamarApi({
          acao: ACOES_API.LISTAR,
          limite: estado.limite
        });

      if (resposta?.sucesso === false) {
        throw new Error(
          resposta.mensagem ||
          "Não foi possível carregar os logs."
        );
      }

      estado.registros =
        normalizarResposta(resposta);

      renderizarTabela();

    } catch (erro) {
      console.error(
        "[ADMINISTRAÇÃO/LOGS]",
        erro
      );

      estado.registros = [];
      renderizarTabela();

      contexto.mostrarAviso(
        erro?.message ||
        "Não foi possível carregar os logs.",
        "erro"
      );

    } finally {
      estado.carregando = false;

      referencias.botaoAtualizarLogsAdministracao.disabled =
        false;

      referencias.limiteLogsAdministracao.disabled =
        false;

      contexto.definirCarregamentoGlobal(false);
    }
  }

  function configurarEventos() {
    referencias.botaoAtualizarLogsAdministracao
      .addEventListener(
        "click",
        carregarLogs
      );

    referencias.limiteLogsAdministracao
      .addEventListener(
        "change",
        function () {
          const valor =
            Number(this.value || 100);

          estado.limite =
            Number.isFinite(valor) && valor > 0
              ? valor
              : 100;

          carregarLogs();
        }
      );
  }

  async function iniciar(novoContexto) {
    contexto = novoContexto;

    montarEstrutura();
    configurarEventos();

    await carregarLogs();
  }

  async function atualizar() {
    await carregarLogs();
  }

  async function destruir() {
    contexto = null;

    estado.registros = [];
    estado.carregando = false;
    estado.limite = 100;

    Object.keys(referencias)
      .forEach(function (chave) {
        delete referencias[chave];
      });
  }

  window.VRAdministracaoLogs =
    Object.freeze({
      iniciar: iniciar,
      atualizar: atualizar,
      destruir: destruir
    });

})(window, document);
