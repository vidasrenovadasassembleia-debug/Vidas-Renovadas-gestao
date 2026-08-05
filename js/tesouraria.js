/**
 * ============================================================================
 * VIDAS RENOVADAS GESTÃO 2.0
 * Arquivo: js/tesouraria.js
 * Descrição: Fluxo da tela exclusiva de lançamento de dízimos e ofertas
 * ============================================================================
 *
 * Dependências obrigatórias, nesta ordem:
 *   1. js/configuracoes.js
 *   2. js/api.js
 *   3. js/auth.js
 *   4. js/app.js
 *   5. js/lancamento-formulario.js
 *   6. js/tesouraria.js
 * ============================================================================
 */

(function (window, document) {
  "use strict";

  const ACOES_API = Object.freeze({
    LISTAR_MEMBROS: "listar",
    LISTAR_CONGREGACOES: "listarCongregacoes",
    REGISTRAR_LANCAMENTO: "registrarLancamentoFinanceiro"
  });

  const estado = {
    membros: [],
    congregacoes: [],
    resultadosPesquisa: [],
    indiceResultadoAtivo: -1,
    carregando: false,
    enviando: false
  };

  const elementos = {};

  function obterFormularioLancamento() {
    const modulo = window.VRGLancamentoFormulario;

    if (!modulo) {
      throw new Error(
        "O módulo do formulário financeiro não foi carregado."
      );
    }

    return modulo;
  }

  function obterAuth() {
    const auth = window.VRGAuth || window.Auth;

    if (!auth || typeof auth.chamarApi !== "function") {
      throw new Error(
        "O módulo de autenticação não foi carregado corretamente."
      );
    }

    return auth;
  }

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

  function normalizarTexto(valor) {
    return texto(valor)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");
  }

  function obterPrimeiroValor(objeto, nomes, valorPadrao = "") {
    for (const nome of nomes) {
      const valor = objeto?.[nome];

      if (
        valor !== undefined &&
        valor !== null &&
        texto(valor) !== ""
      ) {
        return valor;
      }
    }

    return valorPadrao;
  }

  function normalizarMembro(membro = {}) {
    return {
      ...membro,
      id: texto(
        obterPrimeiroValor(
          membro,
          ["id", "ID", "codigo", "Código"]
        )
      ),
      nome: texto(
        obterPrimeiroValor(
          membro,
          [
            "nome",
            "nomeCompleto",
            "NOME_COMPLETO",
            "Nome",
            "Nome Completo"
          ],
          "Nome não informado"
        )
      ),
      congregacao: texto(
        obterPrimeiroValor(
          membro,
          [
            "congregacao",
            "congregação",
            "CONGREGACAO",
            "Congregação",
            "Congregacao"
          ],
          ""
        )
      )
    };
  }

  function normalizarCongregacao(congregacao = {}) {
    return {
      ...congregacao,
      id: texto(
        obterPrimeiroValor(
          congregacao,
          ["id", "ID", "codigo", "Código"]
        )
      ),
      nome: texto(
        obterPrimeiroValor(
          congregacao,
          [
            "nome",
            "NOME",
            "nomeCongregacao",
            "congregacao",
            "Congregação"
          ],
          ""
        )
      ),
      ativa: Boolean(
        obterPrimeiroValor(
          congregacao,
          ["ativa", "ATIVA", "ativo", "situacao"],
          true
        )
      )
    };
  }

  function obterListaDaResposta(resultado, nomesPossiveis) {
    for (const nome of nomesPossiveis) {
      const valor = resultado?.[nome];

      if (Array.isArray(valor)) {
        return valor;
      }

      if (typeof valor === "string") {
        try {
          const convertido = JSON.parse(valor);

          if (Array.isArray(convertido)) {
            return convertido;
          }
        } catch (_) {
          // Continua tentando os demais formatos possíveis.
        }
      }
    }

    if (Array.isArray(resultado)) {
      return resultado;
    }

    return [];
  }

  function capturarElementos() {
    elementos.formulario =
      document.getElementById("formTesouraria");

    elementos.usuarioLogado =
      document.getElementById("usuarioLogado");

    elementos.responsavel =
      document.getElementById("responsavel");

    elementos.congregacao =
      document.getElementById("congregacao");

    elementos.pesquisaMembro =
      document.getElementById("pesquisaMembro");

    elementos.resultadosPesquisaMembro =
      document.getElementById("resultadosPesquisaMembro");

    elementos.valorDizimo =
      document.getElementById("valorDizimo");

    elementos.botaoAdicionarDizimo =
      document.getElementById("botaoAdicionarDizimo");

    elementos.botaoLimpar =
      document.getElementById("botaoLimpar");

    elementos.mensagemTesouraria =
      document.getElementById("mensagemTesouraria");

    elementos.dialogoConfirmacao =
      document.getElementById("dialogoConfirmacaoLancamento");

    elementos.resumoConfirmacao =
      document.getElementById("resumoConfirmacaoLancamento");

    elementos.botaoCancelarConfirmacao =
      document.getElementById("botaoCancelarConfirmacao");

    elementos.botaoConfirmarLancamento =
      document.getElementById("botaoConfirmarLancamento");

    elementos.dialogoSucesso =
      document.getElementById("dialogoSucessoLancamento");

    elementos.botaoNovoLancamento =
      document.getElementById("botaoNovoLancamento");

    elementos.botaoEncerrarTesouraria =
      document.getElementById("botaoEncerrarTesouraria");

    elementos.carregamentoGlobal =
      document.getElementById("carregamentoGlobal");

    return Boolean(
      elementos.formulario &&
      elementos.usuarioLogado &&
      elementos.responsavel &&
      elementos.congregacao &&
      elementos.pesquisaMembro &&
      elementos.resultadosPesquisaMembro &&
      elementos.valorDizimo &&
      elementos.botaoAdicionarDizimo &&
      elementos.botaoLimpar &&
      elementos.mensagemTesouraria &&
      elementos.dialogoConfirmacao &&
      elementos.resumoConfirmacao &&
      elementos.botaoCancelarConfirmacao &&
      elementos.botaoConfirmarLancamento &&
      elementos.dialogoSucesso &&
      elementos.botaoNovoLancamento &&
      elementos.botaoEncerrarTesouraria
    );
  }

  function mostrarMensagem(mensagem, tipo = "aviso") {
    if (!elementos.mensagemTesouraria) {
      return;
    }

    elementos.mensagemTesouraria.textContent = mensagem;
    elementos.mensagemTesouraria.className = `alerta ${tipo}`;
    elementos.mensagemTesouraria.hidden = !mensagem;
  }

  function limparMensagem() {
    if (!elementos.mensagemTesouraria) {
      return;
    }

    elementos.mensagemTesouraria.textContent = "";
    elementos.mensagemTesouraria.className = "alerta";
    elementos.mensagemTesouraria.hidden = true;
  }

  function definirCarregamento(ativo, mensagem = "Carregando...") {
    estado.carregando = Boolean(ativo);

    if (!elementos.carregamentoGlobal) {
      return;
    }

    elementos.carregamentoGlobal.classList.toggle(
      "ativo",
      Boolean(ativo)
    );

    elementos.carregamentoGlobal.setAttribute(
      "aria-hidden",
      ativo ? "false" : "true"
    );

    const textoCarregamento =
      elementos.carregamentoGlobal.querySelector("span:last-child");

    if (textoCarregamento && ativo) {
      textoCarregamento.textContent = mensagem;
    }
  }

  function obterUsuarioAtual() {
    const auth = obterAuth();

    const candidatos = [
      typeof auth.obterUsuarioAtual === "function"
        ? auth.obterUsuarioAtual()
        : null,
      typeof auth.usuarioAtual === "function"
        ? auth.usuarioAtual()
        : null,
      auth.usuarioAtual,
      auth.usuario,
      window.usuarioAtual
    ];

    for (const candidato of candidatos) {
      if (candidato && typeof candidato === "object") {
        return candidato;
      }
    }

    return {};
  }

  function preencherUsuarioAtual() {
    const usuario = obterUsuarioAtual();

    const nome = texto(
      obterPrimeiroValor(
        usuario,
        [
          "nome",
          "nomeCompleto",
          "NOME",
          "NOME_COMPLETO",
          "usuario",
          "email"
        ],
        "Usuário"
      )
    );

    elementos.usuarioLogado.textContent = nome;
    elementos.responsavel.value = nome;
  }

  async function carregarCongregacoes() {
    const resultado = await obterAuth().chamarApi({
      acao: ACOES_API.LISTAR_CONGREGACOES
    });

    if (resultado?.sucesso === false) {
      throw new Error(
        resultado.mensagem ||
        "Não foi possível carregar as congregações."
      );
    }

    const lista = obterListaDaResposta(
      resultado,
      ["congregacoes", "dados", "resultado"]
    );

    estado.congregacoes = lista
      .map(normalizarCongregacao)
      .filter((item) => item.nome);

    preencherSelectCongregacoes();
  }

  function preencherSelectCongregacoes() {
    const valorAtual = elementos.congregacao.value;

    elementos.congregacao.innerHTML = `
      <option value="">Selecione a congregação</option>
      ${estado.congregacoes
        .map(
          (congregacao) => `
            <option value="${escaparHtml(congregacao.nome)}">
              ${escaparHtml(congregacao.nome)}
            </option>
          `
        )
        .join("")}
    `;

    if (
      valorAtual &&
      estado.congregacoes.some(
        (item) => item.nome === valorAtual
      )
    ) {
      elementos.congregacao.value = valorAtual;
    }

    if (estado.congregacoes.length === 1) {
      elementos.congregacao.value =
        estado.congregacoes[0].nome;
    }
  }

  async function carregarMembros() {
    const resultado = await obterAuth().chamarApi({
      acao: ACOES_API.LISTAR_MEMBROS
    });

    if (resultado?.sucesso === false) {
      throw new Error(
        resultado.mensagem ||
        "Não foi possível carregar os membros."
      );
    }

    const lista = obterListaDaResposta(
      resultado,
      ["membros", "dados", "resultado"]
    );

    estado.membros = lista
      .map(normalizarMembro)
      .filter((membro) => membro.id && membro.nome);
  }

  function fecharResultadosPesquisa() {
    estado.resultadosPesquisa = [];
    estado.indiceResultadoAtivo = -1;

    elementos.resultadosPesquisaMembro.innerHTML = "";
    elementos.resultadosPesquisaMembro.hidden = true;
    elementos.pesquisaMembro.setAttribute(
      "aria-expanded",
      "false"
    );
  }

  function selecionarMembro(membro) {
    obterFormularioLancamento().definirMembroSelecionado(membro);
    fecharResultadosPesquisa();
    elementos.valorDizimo.focus();
  }

  function renderizarResultadosPesquisa(resultados) {
    estado.resultadosPesquisa = resultados;
    estado.indiceResultadoAtivo = -1;

    if (!resultados.length) {
      elementos.resultadosPesquisaMembro.innerHTML = `
        <div class="tesouraria-resultado-vazio">
          Nenhum membro encontrado.
        </div>
      `;
    } else {
      elementos.resultadosPesquisaMembro.innerHTML = resultados
        .map(
          (membro, indice) => `
            <button
              type="button"
              class="tesouraria-resultado-item"
              role="option"
              data-indice-resultado="${indice}"
            >
              <span class="tesouraria-resultado-nome">
                ${escaparHtml(membro.nome)}
              </span>

              <span class="tesouraria-resultado-detalhe">
                ${escaparHtml(membro.congregacao || "")}
              </span>
            </button>
          `
        )
        .join("");
    }

    elementos.resultadosPesquisaMembro.hidden = false;
    elementos.pesquisaMembro.setAttribute(
      "aria-expanded",
      "true"
    );
  }

  function pesquisarMembros() {
    const termo = normalizarTexto(
      elementos.pesquisaMembro.value
    );

    document.getElementById("membroSelecionadoId").value = "";
document.getElementById("membroSelecionadoNome").value = "";

    if (termo.length < 2) {
      fecharResultadosPesquisa();
      return;
    }

    const resultados = estado.membros
      .filter((membro) =>
        normalizarTexto(membro.nome).includes(termo)
      )
      .slice(0, 10);

    renderizarResultadosPesquisa(resultados);
  }

  function atualizarResultadoAtivo(novoIndice) {
    const itens = [
      ...elementos.resultadosPesquisaMembro.querySelectorAll(
        ".tesouraria-resultado-item"
      )
    ];

    if (!itens.length) {
      return;
    }

    estado.indiceResultadoAtivo =
      (novoIndice + itens.length) % itens.length;

    itens.forEach((item, indice) => {
      const ativo = indice === estado.indiceResultadoAtivo;

      item.classList.toggle("ativo", ativo);
      item.setAttribute("aria-selected", ativo ? "true" : "false");
    });

    itens[estado.indiceResultadoAtivo].scrollIntoView({
      block: "nearest"
    });
  }

  function tratarTecladoPesquisa(evento) {
    if (elementos.resultadosPesquisaMembro.hidden) {
      return;
    }

    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      atualizarResultadoAtivo(
        estado.indiceResultadoAtivo + 1
      );
      return;
    }

    if (evento.key === "ArrowUp") {
      evento.preventDefault();
      atualizarResultadoAtivo(
        estado.indiceResultadoAtivo - 1
      );
      return;
    }

    if (evento.key === "Enter") {
      if (estado.indiceResultadoAtivo < 0) {
        return;
      }

      evento.preventDefault();

      const membro =
        estado.resultadosPesquisa[
          estado.indiceResultadoAtivo
        ];

      if (membro) {
        selecionarMembro(membro);
      }

      return;
    }

    if (evento.key === "Escape") {
      fecharResultadosPesquisa();
    }
  }

  function adicionarDizimo() {
    limparMensagem();

    try {
      obterFormularioLancamento().adicionarDizimo();
    } catch (erro) {
      mostrarMensagem(
        erro?.message || "Não foi possível adicionar o dízimo.",
        "erro"
      );
    }
  }

  function criarResumoConfirmacao(dados) {
    return `
      <div>
        <strong>Data:</strong>
        ${escaparHtml(dados.data)}
      </div>

      <div>
        <strong>Congregação:</strong>
        ${escaparHtml(dados.congregacao)}
      </div>

      <div>
        <strong>Oferta:</strong>
        ${escaparHtml(
          obterFormularioLancamento().numeroParaMoeda(
            dados.oferta
          )
        )}
      </div>

      <div>
        <strong>Dízimos:</strong>
        ${dados.quantidadeDizimos}
      </div>

      <div>
        <strong>Total:</strong>
        ${escaparHtml(
          obterFormularioLancamento().numeroParaMoeda(
            dados.totalGeral
          )
        )}
      </div>
    `;
  }

  function abrirDialogoConfirmacao() {
    const validacao =
      obterFormularioLancamento().validar(
        elementos.formulario
      );

    if (!validacao.valido) {
      mostrarMensagem(validacao.mensagem, "erro");
      return;
    }

    limparMensagem();

    const dados =
      obterFormularioLancamento().coletar(
        elementos.formulario
      );

    elementos.resumoConfirmacao.innerHTML =
      criarResumoConfirmacao(dados);

    elementos.dialogoConfirmacao.hidden = false;
    elementos.botaoConfirmarLancamento.focus();
  }

  function fecharDialogoConfirmacao() {
    elementos.dialogoConfirmacao.hidden = true;
  }

  function abrirDialogoSucesso() {
    elementos.dialogoSucesso.hidden = false;
    elementos.botaoNovoLancamento.focus();
  }

  function fecharDialogoSucesso() {
    elementos.dialogoSucesso.hidden = true;
  }

  async function enviarLancamento() {
    if (estado.enviando) {
      return;
    }

    estado.enviando = true;
    elementos.botaoConfirmarLancamento.disabled = true;

    try {
      definirCarregamento(
        true,
        "Registrando lançamento..."
      );

      const dados =
        obterFormularioLancamento().coletar(
          elementos.formulario
        );

      const resultado = await obterAuth().chamarApi({
        acao: ACOES_API.REGISTRAR_LANCAMENTO,
        lancamento: dados
      });

      if (resultado?.sucesso === false) {
        throw new Error(
          resultado.mensagem ||
          "Não foi possível registrar o lançamento."
        );
      }

      fecharDialogoConfirmacao();
      abrirDialogoSucesso();
    } catch (erro) {
      console.error(
        "[TESOURARIA] Erro ao registrar lançamento:",
        erro
      );

      mostrarMensagem(
        erro?.message ||
        "Não foi possível registrar o lançamento.",
        "erro"
      );

      fecharDialogoConfirmacao();
    } finally {
      estado.enviando = false;
      elementos.botaoConfirmarLancamento.disabled = false;
      definirCarregamento(false);
    }
  }

  function iniciarNovoLancamento() {
    fecharDialogoSucesso();
    limparMensagem();

    obterFormularioLancamento().limpar(
      elementos.formulario,
      {
        preservarData: true,
        preservarCongregacao: true,
        preservarResponsavel: true
      }
    );
  }

  function limparFormularioComConfirmacao() {
    const confirmar = window.confirm(
      "Deseja limpar os dados deste lançamento?"
    );

    if (!confirmar) {
      return;
    }

    limparMensagem();

    obterFormularioLancamento().limpar(
      elementos.formulario,
      {
        preservarData: true,
        preservarCongregacao: true,
        preservarResponsavel: true
      }
    );
  }

  async function encerrarTesouraria() {
    const auth = obterAuth();

    if (typeof auth.logout === "function") {
      await auth.logout();
      return;
    }

    if (typeof auth.sair === "function") {
      await auth.sair();
      return;
    }

    window.location.href = "index.html";
  }

  function configurarEventos() {
    elementos.pesquisaMembro.addEventListener(
      "input",
      pesquisarMembros
    );

    elementos.pesquisaMembro.addEventListener(
      "keydown",
      tratarTecladoPesquisa
    );

    elementos.resultadosPesquisaMembro.addEventListener(
      "click",
      function (evento) {
        const botao = evento.target.closest(
          "[data-indice-resultado]"
        );

        if (!botao) {
          return;
        }

        const indice = Number(
          botao.dataset.indiceResultado
        );

        const membro = estado.resultadosPesquisa[indice];

        if (membro) {
          selecionarMembro(membro);
        }
      }
    );

    elementos.botaoAdicionarDizimo.addEventListener(
      "click",
      adicionarDizimo
    );

    elementos.valorDizimo.addEventListener(
      "keydown",
      function (evento) {
        if (evento.key !== "Enter") {
          return;
        }

        evento.preventDefault();
        adicionarDizimo();
      }
    );

    elementos.formulario.addEventListener(
      "submit",
      function (evento) {
        evento.preventDefault();
        abrirDialogoConfirmacao();
      }
    );

    elementos.botaoLimpar.addEventListener(
      "click",
      limparFormularioComConfirmacao
    );

    elementos.botaoCancelarConfirmacao.addEventListener(
      "click",
      fecharDialogoConfirmacao
    );

    elementos.botaoConfirmarLancamento.addEventListener(
      "click",
      enviarLancamento
    );

    elementos.botaoNovoLancamento.addEventListener(
      "click",
      iniciarNovoLancamento
    );

    elementos.botaoEncerrarTesouraria.addEventListener(
      "click",
      encerrarTesouraria
    );

    document.addEventListener(
      "click",
      function (evento) {
        if (
          evento.target.closest(".tesouraria-pesquisa-area")
        ) {
          return;
        }

        fecharResultadosPesquisa();
      }
    );

    document
      .querySelectorAll('[data-acao="fechar-confirmacao"]')
      .forEach((elemento) => {
        elemento.addEventListener(
          "click",
          fecharDialogoConfirmacao
        );
      });
  }

  async function inicializar() {
    if (!capturarElementos()) {
      console.warn(
        "[TESOURARIA] A página não contém todos os elementos necessários."
      );

      return;
    }

    try {
      definirCarregamento(true, "Preparando a Tesouraria...");

      const formularioPronto =
        obterFormularioLancamento().iniciar();

      if (!formularioPronto) {
        throw new Error(
          "Não foi possível iniciar o formulário financeiro."
        );
      }

      preencherUsuarioAtual();
      configurarEventos();

      await Promise.all([
        carregarCongregacoes(),
        carregarMembros()
      ]);

      elementos.pesquisaMembro.focus();
    } catch (erro) {
      console.error(
        "[TESOURARIA] Erro ao iniciar:",
        erro
      );

      mostrarMensagem(
        erro?.message ||
        "Não foi possível carregar o Painel da Tesouraria.",
        "erro"
      );
    } finally {
      definirCarregamento(false);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      inicializar,
      { once: true }
    );
  } else {
    inicializar();
  }
})(window, document);
