"use strict";

/* ==========================================================================
   ADMINISTRAÇÃO — PERFIS E PERMISSÕES
   Vidas Renovadas Gestão 2.0
   ========================================================================== */

(function (window, document) {

  let contexto = null;

  const PERFIS = Object.freeze([
    {
      codigo: "ADMINISTRADOR",
      titulo: "Administrador do Sistema",
      descricao:
        "Acesso administrativo completo ao sistema.",
      permissoes: [
        ["Dashboard", true],
        ["Membros", true],
        ["Congregações", true],
        ["Certificados", true],
        ["Financeiro", true],
        ["Relatórios", true],
        ["Administração", true],
        ["Tesouraria", true]
      ]
    },

    {
      codigo: "PASTOR_PRESIDENTE",
      titulo: "Pastor Presidente",
      descricao:
        "Acesso pastoral e administrativo aos módulos oficiais do sistema.",
      permissoes: [
        ["Dashboard", true],
        ["Membros", true],
        ["Congregações", true],
        ["Certificados", true],
        ["Financeiro", true],
        ["Relatórios", true],
        ["Administração", true],
        ["Tesouraria", true]
      ]
    },

    {
      codigo: "TESOURARIA",
      titulo: "Tesouraria",
      descricao:
        "Perfil restrito ao lançamento de dízimos e ofertas.",
      permissoes: [
        ["Dashboard", false],
        ["Membros", false],
        ["Congregações", false],
        ["Certificados", false],
        ["Financeiro administrativo", false],
        ["Relatórios", false],
        ["Administração", false],
        ["Lançamento de dízimos e ofertas", true]
      ]
    }
  ]);

  function escaparHtml(valor) {
    return String(valor ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function montarTabelaPermissoes(perfil) {
    return `
      <div class="administracao-tabela-area">

        <table class="administracao-tabela">

          <thead>
            <tr>
              <th>Módulo / ação</th>
              <th>Acesso</th>
            </tr>
          </thead>

          <tbody>
            ${perfil.permissoes.map(function (item) {
              const permitido = Boolean(item[1]);

              return `
                <tr>
                  <td>
                    <strong>
                      ${escaparHtml(item[0])}
                    </strong>
                  </td>

                  <td>
                    <span
                      class="administracao-status ${
                        permitido ? "ativo" : "bloqueado"
                      }"
                    >
                      ${permitido ? "Permitido" : "Bloqueado"}
                    </span>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>

        </table>

      </div>
    `;
  }

  function montarEstrutura() {
    contexto.container.innerHTML = `
      <div class="administracao-bloco">

        <div>
          <h4 class="administracao-bloco-titulo">
            Perfis oficiais do sistema
          </h4>

          <p class="administracao-bloco-descricao">
            Esta tela apresenta as permissões oficiais configuradas
            para cada perfil. As permissões não podem ser alteradas
            por esta interface.
          </p>
        </div>

      </div>

      <div
        class="administracao-perfis-grid"
        id="administracaoPerfisLista"
      >
        ${PERFIS.map(function (perfil) {
          return `
            <section class="administracao-bloco">

              <div>
                <span class="administracao-status ativo">
                  ${escaparHtml(perfil.codigo)}
                </span>

                <h4
                  class="administracao-bloco-titulo"
                  style="margin-top: 12px;"
                >
                  ${escaparHtml(perfil.titulo)}
                </h4>

                <p class="administracao-bloco-descricao">
                  ${escaparHtml(perfil.descricao)}
                </p>
              </div>

              ${montarTabelaPermissoes(perfil)}

            </section>
          `;
        }).join("")}
      </div>
    `;
  }

  async function iniciar(novoContexto) {
    contexto = novoContexto;

    montarEstrutura();
    contexto.limparAviso();
  }

  async function atualizar() {
    montarEstrutura();
  }

  async function destruir() {
    contexto = null;
  }

  window.VRAdministracaoPermissoes = Object.freeze({
    iniciar: iniciar,
    atualizar: atualizar,
    destruir: destruir
  });

})(window, document);
