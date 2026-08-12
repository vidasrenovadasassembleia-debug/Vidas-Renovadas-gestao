"use strict";

/* ==========================================================================
   ADMINISTRAÇÃO — USUÁRIOS
   Vidas Renovadas Gestão 2.0
   ========================================================================== */

(function (window, document) {

  const PERFIS = Object.freeze([
  {
    valor: "ADMINISTRADOR",
    rotulo: "Administrador do Sistema"
  },
  {
    valor: "PASTOR_PRESIDENTE",
    rotulo: "Pastor Presidente"
  },
  {
    valor: "TESOURARIA",
    rotulo: "Tesouraria"
  }
]);
  const STATUS = Object.freeze([
    {
      valor: "ATIVO",
      rotulo: "Ativo"
    },
    {
      valor: "BLOQUEADO",
      rotulo: "Bloqueado"
    },
    {
      valor: "INATIVO",
      rotulo: "Inativo"
    }
  ]);

  const ACOES_API = Object.freeze({
    LISTAR: "listarUsuariosAdministracao",
    SALVAR: "salvarUsuarioAdministracao",
    ALTERAR_STATUS: "alterarStatusUsuarioAdministracao"
  });

  let contexto = null;

  const estado = {
    usuarios: [],
    usuariosFiltrados: [],
    usuarioSelecionado: null,
    carregando: false,
    processando: false
  };

  const referencias = {};

  function texto(valor) {
    return String(valor ?? "").trim();
  }

  function escaparHtml(valor) {
    return String(valor ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizar(valor) {
    return texto(valor)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");
  }

  function perfilRotulo(perfil) {
    const item = PERFIS.find(function (registro) {
      return registro.valor === texto(perfil).toUpperCase();
    });

    return item ? item.rotulo : texto(perfil) || "Não informado";
  }

  function statusRotulo(status) {
    const item = STATUS.find(function (registro) {
      return registro.valor === texto(status).toUpperCase();
    });

    return item ? item.rotulo : texto(status) || "Não informado";
  }

  function statusClasse(status) {
    const valor = texto(status).toUpperCase();

    if (valor === "ATIVO") {
      return "ativo";
    }

    if (valor === "BLOQUEADO") {
      return "bloqueado";
    }

    return "pendente";
  }

  function montarEstrutura() {
    contexto.container.innerHTML = `
      <div class="administracao-toolbar">

        <div class="administracao-toolbar-filtros">

          <div class="campo">
            <label for="administracaoUsuarioPesquisa">
              Pesquisar
            </label>

            <input
              type="search"
              id="administracaoUsuarioPesquisa"
              placeholder="Nome ou e-mail"
            >
          </div>

          <div class="campo">
            <label for="administracaoUsuarioPerfil">
              Perfil
            </label>

            <select id="administracaoUsuarioPerfil">
              <option value="">Todos</option>
              <div
  class="campo"
  id="campoAdministracaoUsuarioCongregacao"
  hidden
>
  <label for="administracaoUsuarioCongregacao">
    Congregação
  </label>

  <select
    id="administracaoUsuarioCongregacao"
    name="congregacao"
  >
    <option value="">
      Selecione a congregação
    </option>
  </select>
</div>

              ${PERFIS.map(function (perfil) {
                return `
                  <option value="${perfil.valor}">
                    ${perfil.rotulo}
                  </option>
                `;
              }).join("")}
            </select>
          </div>

          <div class="campo">
            <label for="administracaoUsuarioStatus">
              Status
            </label>

            <select id="administracaoUsuarioStatus">
              <option value="">Todos</option>

              ${STATUS.map(function (status) {
                return `
                  <option value="${status.valor}">
                    ${status.rotulo}
                  </option>
                `;
              }).join("")}
            </select>
          </div>

        </div>

        <div class="administracao-toolbar-acoes">

          <button
            type="button"
            class="btn btn-contorno"
            id="botaoLimparFiltrosUsuarios"
          >
            Limpar
          </button>

          <button
            type="button"
            class="btn btn-dourado"
            id="botaoNovoUsuarioAdministracao"
          >
            Novo usuário
          </button>

        </div>

      </div>

      <div
        id="administracaoUsuariosEstado"
        class="administracao-estado"
      >
        <span class="spinner" aria-hidden="true"></span>
        <p>Carregando usuários...</p>
      </div>

      <div
        id="administracaoUsuariosTabelaArea"
        class="administracao-tabela-area"
        hidden
      >

        <table class="administracao-tabela">

          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Perfil</th>
              <th>Status</th>
              <th>Último acesso</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody id="administracaoUsuariosTabelaCorpo"></tbody>

        </table>

      </div>

      <div
        id="administracaoUsuarioFormularioArea"
        hidden
      >

        <div class="administracao-bloco">

          <div>
            <h4 class="administracao-bloco-titulo">
              Dados do usuário
            </h4>

            <p class="administracao-bloco-descricao">
              Apenas Administrador do Sistema e Pastor Presidente terão acesso ao sistema principal.
            </p>
          </div>

          <form id="formAdministracaoUsuario">

            <input
              type="hidden"
              id="administracaoUsuarioId"
              name="id"
            >

            <div class="administracao-form-grid">

              <div class="campo">
                <label for="administracaoUsuarioNome">
                  Nome completo
                </label>

                <input
                  type="text"
                  id="administracaoUsuarioNome"
                  name="nome"
                  required
                >
              </div>

              <div class="campo">
                <label for="administracaoUsuarioEmail">
                  E-mail
                </label>

                <input
                  type="email"
                  id="administracaoUsuarioEmail"
                  name="email"
                  required
                >
              </div>

              <div class="campo">
                <label for="administracaoUsuarioTelefone">
                  Telefone
                </label>

                <input
                  type="tel"
                  id="administracaoUsuarioTelefone"
                  name="telefone"
                >
              </div>

              <div class="campo">
                <label for="administracaoUsuarioPerfilFormulario">
                  Perfil
                </label>

                <select
                  id="administracaoUsuarioPerfilFormulario"
                  name="perfil"
                  required
                >
                  ${PERFIS.map(function (perfil) {
                    return `
                      <option value="${perfil.valor}">
                        ${perfil.rotulo}
                      </option>
                    `;
                  }).join("")}
                </select>
              </div>

              <div class="campo">
                <label for="administracaoUsuarioStatusFormulario">
                  Status
                </label>

                <select
                  id="administracaoUsuarioStatusFormulario"
                  name="status"
                  required
                >
                  ${STATUS.map(function (status) {
                    return `
                      <option value="${status.valor}">
                        ${status.rotulo}
                      </option>
                    `;
                  }).join("")}
                </select>
              </div>

            </div>

            <div class="administracao-form-acoes">

              <button
                type="button"
                class="btn btn-contorno"
                id="botaoCancelarFormularioUsuario"
              >
                Cancelar
              </button>

              <button
                type="submit"
                class="btn btn-dourado"
                id="botaoSalvarUsuarioAdministracao"
              >
                Salvar usuário
              </button>

            </div>

          </form>

        </div>

      </div>
    `;

    [
     [
  "administracaoUsuarioPesquisa",
  "administracaoUsuarioPerfil",
  "administracaoUsuarioStatus",
  "botaoLimparFiltrosUsuarios",
  "botaoNovoUsuarioAdministracao",
  "administracaoUsuariosEstado",
  "administracaoUsuariosTabelaArea",
  "administracaoUsuariosTabelaCorpo",
  "administracaoUsuarioFormularioArea",
  "formAdministracaoUsuario",
  "administracaoUsuarioId",
  "administracaoUsuarioNome",
  "administracaoUsuarioEmail",
  "administracaoUsuarioTelefone",
  "administracaoUsuarioPerfilFormulario",
  "administracaoUsuarioStatusFormulario",

  "campoAdministracaoUsuarioCongregacao",
  "administracaoUsuarioCongregacao",

  "botaoCancelarFormularioUsuario",
  "botaoSalvarUsuarioAdministracao"
    ].forEach(function (id) {
      referencias[id] = document.getElementById(id);
    });
  }

  function atualizarCampoCongregacao() {
    const perfil = texto(
      referencias.administracaoUsuarioPerfilFormulario?.value
    ).toUpperCase();

    const tesouraria = perfil === "TESOURARIA";

    if (referencias.campoAdministracaoUsuarioCongregacao) {
      referencias.campoAdministracaoUsuarioCongregacao.hidden =
        !tesouraria;
    }

    if (referencias.administracaoUsuarioCongregacao) {
      referencias.administracaoUsuarioCongregacao.required =
        tesouraria;

      if (!tesouraria) {
        referencias.administracaoUsuarioCongregacao.value = "";
      }
    }
  }

  function normalizarUsuario(item) {
    return {
      id: texto(item?.id ?? item?.ID),
      nome: texto(item?.nome ?? item?.NOME),
      email: texto(item?.email ?? item?.EMAIL),
      telefone: texto(item?.telefone ?? item?.TELEFONE),
      perfil: texto(item?.perfil ?? item?.PERFIL).toUpperCase(),
      status: texto(item?.status ?? item?.STATUS).toUpperCase(),
      ultimoAcesso: texto(
        item?.ultimoAcesso ??
        item?.ULTIMO_ACESSO ??
        item?.ultimoLogin ??
        item?.ULTIMO_LOGIN
      )
    };
  }

  function definirEstado(tipo, mensagem) {
    referencias.administracaoUsuariosEstado.hidden =
      tipo !== "estado";

    referencias.administracaoUsuariosTabelaArea.hidden =
      tipo !== "tabela";

    referencias.administracaoUsuarioFormularioArea.hidden =
      tipo !== "formulario";

    if (
      tipo === "estado" &&
      mensagem
    ) {
      referencias.administracaoUsuariosEstado.innerHTML = `
        <strong>${escaparHtml(mensagem.titulo)}</strong>
        <p>${escaparHtml(mensagem.descricao)}</p>
      `;
    }
  }

  function aplicarFiltros() {
    const pesquisa = normalizar(
      referencias.administracaoUsuarioPesquisa.value
    );

    const perfil = texto(
      referencias.administracaoUsuarioPerfil.value
    ).toUpperCase();

    const status = texto(
      referencias.administracaoUsuarioStatus.value
    ).toUpperCase();

    estado.usuariosFiltrados = estado.usuarios.filter(
      function (usuario) {
        if (
          perfil &&
          usuario.perfil !== perfil
        ) {
          return false;
        }

        if (
          status &&
          usuario.status !== status
        ) {
          return false;
        }

        if (pesquisa) {
          const base = normalizar(
            usuario.nome + " " + usuario.email
          );

          if (!base.includes(pesquisa)) {
            return false;
          }
        }

        return true;
      }
    );

    renderizarTabela();
  }

  function renderizarTabela() {
    if (!estado.usuariosFiltrados.length) {
      referencias.administracaoUsuariosTabelaCorpo.innerHTML = "";

      definirEstado("estado", {
        titulo: "Nenhum usuário encontrado",
        descricao: "Ajuste os filtros ou cadastre um novo usuário."
      });

      return;
    }

    referencias.administracaoUsuariosTabelaCorpo.innerHTML =
      estado.usuariosFiltrados.map(function (usuario) {
        const acaoStatus =
          usuario.status === "ATIVO"
            ? "Bloquear"
            : "Ativar";

        const novoStatus =
          usuario.status === "ATIVO"
            ? "BLOQUEADO"
            : "ATIVO";

        return `
          <tr>
            <td>
              <strong>${escaparHtml(usuario.nome || "—")}</strong>
            </td>

            <td>
              ${escaparHtml(usuario.email || "—")}
            </td>

            <td>
              ${escaparHtml(perfilRotulo(usuario.perfil))}
            </td>

            <td>
              <span class="administracao-status ${statusClasse(usuario.status)}">
                ${escaparHtml(statusRotulo(usuario.status))}
              </span>
            </td>

            <td>
              ${escaparHtml(usuario.ultimoAcesso || "Nunca acessou")}
            </td>

            <td>
              <div class="administracao-toolbar-acoes">

                <button
                  type="button"
                  class="btn btn-contorno"
                  data-acao-usuario="editar"
                  data-id-usuario="${escaparHtml(usuario.id)}"
                >
                  Editar
                </button>

                <button
                  type="button"
                  class="btn btn-contorno"
                  data-acao-usuario="status"
                  data-id-usuario="${escaparHtml(usuario.id)}"
                  data-novo-status="${novoStatus}"
                >
                  ${acaoStatus}
                </button>

              </div>
            </td>
          </tr>
        `;
      }).join("");

    definirEstado("tabela");
  }

  async function carregarUsuarios() {
    if (estado.carregando) {
      return;
    }

    estado.carregando = true;

    referencias.administracaoUsuariosEstado.innerHTML = `
      <span class="spinner" aria-hidden="true"></span>
      <p>Carregando usuários...</p>
    `;

    definirEstado("estado");
    contexto.limparAviso();

    try {
      const resposta = await contexto.chamarApi({
        acao: ACOES_API.LISTAR
      });

      if (resposta?.sucesso === false) {
        throw new Error(
          resposta.mensagem ||
          "Não foi possível carregar os usuários."
        );
      }

      const lista = Array.isArray(resposta?.usuarios)
        ? resposta.usuarios
        : [];

      estado.usuarios = lista
        .map(normalizarUsuario)
        .filter(function (usuario) {
          return [
            "ADMINISTRADOR",
            "PASTOR_PRESIDENTE"
          ].includes(usuario.perfil);
        });

      estado.usuariosFiltrados = [...estado.usuarios];

      renderizarTabela();

    } catch (erro) {
      console.error(
        "[ADMINISTRAÇÃO/USUÁRIOS]",
        erro
      );

      definirEstado("estado", {
        titulo: "Usuários indisponíveis",
        descricao:
          erro?.message ||
          "Não foi possível carregar os usuários."
      });

      contexto.mostrarAviso(
        erro?.message ||
        "Não foi possível carregar os usuários.",
        "erro"
      );

    } finally {
      estado.carregando = false;
    }
  }

  function abrirNovoUsuario() {
    estado.usuarioSelecionado = null;

    referencias.formAdministracaoUsuario.reset();
    referencias.administracaoUsuarioId.value = "";
    referencias.administracaoUsuarioPerfilFormulario.value =
      "PASTOR_PRESIDENTE";
    referencias.administracaoUsuarioStatusFormulario.value =
      "ATIVO";
   atualizarCampoCongregacao();
    definirEstado("formulario");

    referencias.administracaoUsuarioNome.focus();
  }

  function abrirEdicaoUsuario(id) {
    const usuario = estado.usuarios.find(
      function (item) {
        return item.id === id;
      }
    );

    if (!usuario) {
      return;
    }

    estado.usuarioSelecionado = usuario;

    referencias.administracaoUsuarioId.value =
      usuario.id;

    referencias.administracaoUsuarioNome.value =
      usuario.nome;

    referencias.administracaoUsuarioEmail.value =
      usuario.email;

    referencias.administracaoUsuarioTelefone.value =
      usuario.telefone;

    referencias.administracaoUsuarioPerfilFormulario.value =
      usuario.perfil;

    referencias.administracaoUsuarioStatusFormulario.value =
      usuario.status;

    definirEstado("formulario");

    referencias.administracaoUsuarioNome.focus();
  }

  function cancelarFormulario() {
    estado.usuarioSelecionado = null;
    referencias.formAdministracaoUsuario.reset();

    aplicarFiltros();
  }

  function coletarFormulario() {
    return {
      id: texto(
        referencias.administracaoUsuarioId.value
      ),
      nome: texto(
        referencias.administracaoUsuarioNome.value
      ),
      email: texto(
        referencias.administracaoUsuarioEmail.value
      ),
      telefone: texto(
        referencias.administracaoUsuarioTelefone.value
      ),
      perfil: texto(
        referencias.administracaoUsuarioPerfilFormulario.value
      ).toUpperCase(),
      status: texto(
        referencias.administracaoUsuarioStatusFormulario.value
      ).toUpperCase()
    };
  }

  async function salvarUsuario(evento) {
    evento.preventDefault();

    if (estado.processando) {
      return;
    }

    const dados = coletarFormulario();

    if (!dados.nome || !dados.email) {
      contexto.mostrarAviso(
        "Informe o nome e o e-mail do usuário.",
        "aviso"
      );

      return;
    }

    if (
      !["ADMINISTRADOR", "PASTOR_PRESIDENTE"]
        .includes(dados.perfil)
    ) {
      contexto.mostrarAviso(
        "Selecione um perfil válido.",
        "erro"
      );

      return;
    }

    estado.processando = true;
    referencias.botaoSalvarUsuarioAdministracao.disabled = true;

    try {
      contexto.definirCarregamentoGlobal(
        true,
        "Salvando usuário..."
      );

      const resposta = await contexto.chamarApi({
        acao: ACOES_API.SALVAR,
        dados: dados
      });

      if (resposta?.sucesso === false) {
        throw new Error(
          resposta.mensagem ||
          "Não foi possível salvar o usuário."
        );
      }

      contexto.mostrarAviso(
        resposta?.mensagem ||
        "Usuário salvo com sucesso.",
        "sucesso"
      );

      await carregarUsuarios();

      if (typeof contexto.atualizarResumo === "function") {
        await contexto.atualizarResumo();
      }

    } catch (erro) {
      contexto.mostrarAviso(
        erro?.message ||
        "Não foi possível salvar o usuário.",
        "erro"
      );

    } finally {
      estado.processando = false;
      referencias.botaoSalvarUsuarioAdministracao.disabled = false;
      contexto.definirCarregamentoGlobal(false);
    }
  }

  async function alterarStatusUsuario(
    id,
    novoStatus
  ) {
    const usuario = estado.usuarios.find(
      function (item) {
        return item.id === id;
      }
    );

    if (!usuario) {
      return;
    }

    const acao =
      novoStatus === "ATIVO"
        ? "ativar"
        : "bloquear";

    await contexto.confirmar({
      titulo:
        novoStatus === "ATIVO"
          ? "Ativar usuário"
          : "Bloquear usuário",

      mensagem:
        "Deseja realmente " + acao +
        " o acesso de " + usuario.nome + "?",

      rotuloConfirmar:
        novoStatus === "ATIVO"
          ? "Ativar"
          : "Bloquear",

      aoConfirmar: async function () {
        const resposta = await contexto.chamarApi({
          acao: ACOES_API.ALTERAR_STATUS,
          id: id,
          status: novoStatus
        });

        if (resposta?.sucesso === false) {
          throw new Error(
            resposta.mensagem ||
            "Não foi possível alterar o status."
          );
        }

        contexto.mostrarAviso(
          resposta?.mensagem ||
          "Status alterado com sucesso.",
          "sucesso"
        );

        await carregarUsuarios();

        if (typeof contexto.atualizarResumo === "function") {
          await contexto.atualizarResumo();
        }

        return true;
      }
    });
  }

  function configurarEventos() {
    referencias.administracaoUsuarioPesquisa
      .addEventListener("input", aplicarFiltros);

    referencias.administracaoUsuarioPerfil
      .addEventListener("change", aplicarFiltros);

    referencias.administracaoUsuarioStatus
      .addEventListener("change", aplicarFiltros);

    referencias.botaoLimparFiltrosUsuarios
      .addEventListener("click", function () {
        referencias.administracaoUsuarioPesquisa.value = "";
        referencias.administracaoUsuarioPerfil.value = "";
        referencias.administracaoUsuarioStatus.value = "";

        aplicarFiltros();
      });

    referencias.botaoNovoUsuarioAdministracao
      .addEventListener("click", abrirNovoUsuario);

    referencias.botaoCancelarFormularioUsuario
      .addEventListener("click", cancelarFormulario);

     referencias.administracaoUsuarioPerfilFormulario
  .addEventListener(
    "change",
    atualizarCampoCongregacao
  );
     
    referencias.formAdministracaoUsuario
      .addEventListener("submit", salvarUsuario);

    referencias.administracaoUsuariosTabelaCorpo
      .addEventListener("click", function (evento) {
        const botao = evento.target.closest(
          "[data-acao-usuario]"
        );

        if (!botao) {
          return;
        }

        const id = botao.dataset.idUsuario;
        const acao = botao.dataset.acaoUsuario;

        if (acao === "editar") {
          abrirEdicaoUsuario(id);
          return;
        }

        if (acao === "status") {
          alterarStatusUsuario(
            id,
            botao.dataset.novoStatus
          );
        }
      });
  }

  async function iniciar(novoContexto) {
    contexto = novoContexto;

    montarEstrutura();
    configurarEventos();

    await carregarUsuarios();
  }

  async function atualizar() {
    await carregarUsuarios();
  }

  async function destruir() {
    contexto = null;

    estado.usuarios = [];
    estado.usuariosFiltrados = [];
    estado.usuarioSelecionado = null;
    estado.carregando = false;
    estado.processando = false;

    Object.keys(referencias).forEach(function (chave) {
      delete referencias[chave];
    });
  }

  window.VRAdministracaoUsuarios = Object.freeze({
    iniciar: iniciar,
    atualizar: atualizar,
    destruir: destruir
  });

})(window, document);
