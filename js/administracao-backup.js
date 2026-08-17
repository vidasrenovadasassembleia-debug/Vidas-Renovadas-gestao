"use strict";

/* ==========================================================================
   ADMINISTRAÇÃO — BACKUP
   Vidas Renovadas Gestão 2.0
   ========================================================================== */

(function (window, document) {

  const ACOES_API = Object.freeze({
    EXECUTAR: "executarBackup"
  });

  let contexto = null;

  const estado = {
    executando: false,
    ultimoBackupCriado: null
  };

  const referencias = {};

  function texto(valor) {
    return String(valor ?? "").trim();
  }

  function formatarDataHora(data) {
    const valor = data instanceof Date
      ? data
      : new Date(data);

    if (Number.isNaN(valor.getTime())) {
      return "";
    }

    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(valor);
  }

  function montarEstrutura() {
    contexto.container.innerHTML = `
      <div class="administracao-bloco">

        <div>
          <h4 class="administracao-bloco-titulo">
            Backup do sistema
          </h4>

          <p class="administracao-bloco-descricao">
            Crie uma cópia manual da planilha do Vidas Renovadas Gestão.
          </p>
        </div>

        <div
          style="
            display:grid;
            grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));
            gap:16px;
            margin-top:18px;
          "
        >

          <article class="administracao-bloco">

            <div>
              <h4 class="administracao-bloco-titulo">
                Backup manual
              </h4>

              <p class="administracao-bloco-descricao">
                Gera uma cópia completa da planilha atual e registra
                a operação no histórico de backups e nos logs.
              </p>
            </div>

            <button
              type="button"
              class="btn btn-dourado"
              id="botaoExecutarBackupAdministracao"
              style="margin-top:16px;"
            >
              Executar backup agora
            </button>

          </article>

          <article class="administracao-bloco">

            <div>
              <h4 class="administracao-bloco-titulo">
                Segurança
              </h4>

              <p class="administracao-bloco-descricao">
                Os backups são armazenados na pasta oficial de backups
                do sistema no Google Drive.
              </p>
            </div>

            <div
              style="
                margin-top:16px;
                display:grid;
                gap:8px;
              "
            >
              <span class="administracao-status ativo">
                Rotina de backup habilitada
              </span>

              <small class="administracao-bloco-descricao">
                Os backups automáticos existentes continuam independentes
                desta tela.
              </small>
            </div>

          </article>

        </div>

      </div>

      <div
        class="administracao-bloco"
        id="painelUltimoBackupCriado"
        style="margin-top:18px;"
        hidden
      >

        <div>
          <h4 class="administracao-bloco-titulo">
            Último backup manual criado nesta sessão
          </h4>

          <p
            class="administracao-bloco-descricao"
            id="textoUltimoBackupCriado"
          >
            —
          </p>
        </div>

        <div
          style="
            display:flex;
            flex-wrap:wrap;
            gap:10px;
            margin-top:14px;
          "
        >
          <a
            class="btn btn-contorno"
            id="linkAbrirUltimoBackup"
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            hidden
          >
            Abrir no Google Drive
          </a>
        </div>

      </div>
    `;

    [
      "botaoExecutarBackupAdministracao",
      "painelUltimoBackupCriado",
      "textoUltimoBackupCriado",
      "linkAbrirUltimoBackup"
    ].forEach(function (id) {
      referencias[id] =
        document.getElementById(id);
    });
  }

  function atualizarUltimoBackupCriado(backup) {
    estado.ultimoBackupCriado =
      backup && typeof backup === "object"
        ? backup
        : null;

    const painel =
      referencias.painelUltimoBackupCriado;

    const textoPainel =
      referencias.textoUltimoBackupCriado;

    const link =
      referencias.linkAbrirUltimoBackup;

    if (!estado.ultimoBackupCriado) {
      painel.hidden = true;
      textoPainel.textContent = "—";
      link.hidden = true;
      link.removeAttribute("href");
      return;
    }

    const nome =
      texto(estado.ultimoBackupCriado.nome) ||
      "Backup criado";

    const status =
      texto(estado.ultimoBackupCriado.status) ||
      "CONCLUIDO";

    const agora =
      formatarDataHora(new Date());

    textoPainel.textContent =
      `${nome} • ${status}` +
      (agora ? ` • ${agora}` : "");

    const url =
      texto(estado.ultimoBackupCriado.url);

    if (url) {
      link.href = url;
      link.hidden = false;
    } else {
      link.hidden = true;
      link.removeAttribute("href");
    }

    painel.hidden = false;
  }

  async function executarBackup() {
    if (estado.executando) {
      return;
    }

    const confirmado =
      await contexto.confirmar({
        titulo: "Executar backup",
        mensagem:
          "Deseja criar agora uma cópia manual completa da planilha do sistema?",
        rotuloConfirmar: "Executar backup",
        aoConfirmar: async function () {

          estado.executando = true;
          referencias.botaoExecutarBackupAdministracao.disabled =
            true;

          try {
            contexto.definirCarregamentoGlobal(
              true,
              "Criando backup..."
            );

            const resposta =
              await contexto.chamarApi({
                acao: ACOES_API.EXECUTAR
              });

            if (resposta?.sucesso === false) {
              throw new Error(
                resposta.mensagem ||
                "Não foi possível criar o backup."
              );
            }

            atualizarUltimoBackupCriado(
              resposta?.backup || null
            );

            contexto.mostrarAviso(
              resposta?.mensagem ||
              "Backup criado com sucesso.",
              "sucesso"
            );

            if (
              contexto.atualizarResumo &&
              typeof contexto.atualizarResumo === "function"
            ) {
              await contexto.atualizarResumo();
            }

            return true;

          } catch (erro) {
            console.error(
              "[ADMINISTRAÇÃO/BACKUP]",
              erro
            );

            contexto.mostrarAviso(
              erro?.message ||
              "Não foi possível criar o backup.",
              "erro"
            );

            throw erro;

          } finally {
            estado.executando = false;

            referencias.botaoExecutarBackupAdministracao.disabled =
              false;

            contexto.definirCarregamentoGlobal(false);
          }
        }
      });

    return confirmado;
  }

  function configurarEventos() {
    referencias.botaoExecutarBackupAdministracao
      .addEventListener(
        "click",
        executarBackup
      );
  }

  async function iniciar(novoContexto) {
    contexto = novoContexto;

    montarEstrutura();
    configurarEventos();
    atualizarUltimoBackupCriado(null);

    contexto.limparAviso();
  }

  async function atualizar() {
    if (
      contexto?.atualizarResumo &&
      typeof contexto.atualizarResumo === "function"
    ) {
      await contexto.atualizarResumo();
    }
  }

  async function destruir() {
    contexto = null;

    estado.executando = false;
    estado.ultimoBackupCriado = null;

    Object.keys(referencias)
      .forEach(function (chave) {
        delete referencias[chave];
      });
  }

  window.VRAdministracaoBackup =
    Object.freeze({
      iniciar: iniciar,
      atualizar: atualizar,
      destruir: destruir
    });

})(window, document);
