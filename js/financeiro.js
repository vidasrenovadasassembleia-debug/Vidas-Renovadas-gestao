/**
 * ============================================================================
 * VIDAS RENOVADAS GESTÃO 2.0
 * Arquivo: js/financeiro.js
 * Descrição: Painel Financeiro do Pastor e da Administradora
 * ============================================================================
 *
 * Ações esperadas no Apps Script:
 *   - listarLancamentosTesouraria
 *   - buscarLancamentoTesouraria
 *   - aprovarLancamentoTesouraria
 *   - rejeitarLancamentoTesouraria
 *   - listarCongregacoes
 * ============================================================================
 */

(function (window, document) {
  "use strict";

 const ACOES_API = Object.freeze({
  LISTAR: "listarLancamentosTesouraria",
  BUSCAR: "buscarLancamentoTesouraria",
  APROVAR: "aprovarLancamentoTesouraria",
  REJEITAR: "rejeitarLancamentoTesouraria",
  LISTAR_CONGREGACOES: "listarCongregacoes",
  STATUS_MES: "obterStatusMesFinanceiro",
  FECHAR_MES: "fecharMesFinanceiro",
  REABRIR_MES: "reabrirMesFinanceiro"
});

  const STATUS = Object.freeze({
    PENDENTE: "PENDENTE",
    APROVADO: "APROVADO",
    REJEITADO: "REJEITADO"
  });

  const estado = {
    lancamentos: [],
    lancamentosFiltrados: [],
    congregacoes: [],
    lancamentoSelecionado: null,
    carregando: false,
    processando: false,
    mesFechado: false
  };

  const elementos = {};

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

  function normalizarStatus(valor) {
    const status = normalizarTexto(valor).replace(/\s+/g, "_").toUpperCase();

    if (status === STATUS.APROVADO) {
      return STATUS.APROVADO;
    }

    if (status === STATUS.REJEITADO) {
      return STATUS.REJEITADO;
    }

    return STATUS.PENDENTE;
  }

  function numero(valor) {
    if (typeof valor === "number") {
      return Number.isFinite(valor) ? valor : 0;
    }

    const conteudo = texto(valor);

    if (!conteudo) {
      return 0;
    }

    const normalizado = conteudo
      .replace(/\s/g, "")
      .replace(/^R\$/i, "")
      .replace(/\./g, "")
      .replace(",", ".")
      .replace(/[^\d.-]/g, "");

    const resultado = Number(normalizado);

    return Number.isFinite(resultado) ? resultado : 0;
  }

  function moeda(valor) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(numero(valor));
  }

  function dataIsoLocal(valor) {
    const conteudo = texto(valor);

    if (!conteudo) {
      return "";
    }

    const iso = conteudo.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (iso) {
      return `${iso[1]}-${iso[2]}-${iso[3]}`;
    }

    const brasileira = conteudo.match(/^(\d{2})\/(\d{2})\/(\d{4})/);

    if (brasileira) {
      return `${brasileira[3]}-${brasileira[2]}-${brasileira[1]}`;
    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
      return "";
    }

    return [
      data.getFullYear(),
      String(data.getMonth() + 1).padStart(2, "0"),
      String(data.getDate()).padStart(2, "0")
    ].join("-");
  }

  function dataFormatada(valor) {
    const iso = dataIsoLocal(valor);

    if (!iso) {
      return "—";
    }

    const [ano, mes, dia] = iso.split("-");

    return `${dia}/${mes}/${ano}`;
  }

  function mesAtual() {
    const agora = new Date();

    return [
      agora.getFullYear(),
      String(agora.getMonth() + 1).padStart(2, "0")
    ].join("-");
  }

  function obterAuth() {
    const auth = window.VRGAuth || window.Auth;

    if (!auth || typeof auth.chamarApi !== "function") {
      throw new Error(
        "O módulo de autenticação/API não foi carregado corretamente."
      );
    }

    return auth;
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
          // Continua procurando outros formatos.
        }
      }
    }

    return Array.isArray(resultado) ? resultado : [];
  }

  function normalizarDizimo(item = {}) {
    return {
      id: texto(
        obterPrimeiroValor(item, ["id", "ID"])
      ),

      tipo: texto(
        obterPrimeiroValor(
          item,
          ["tipo", "TIPO"],
          item.membroId || item.ID_MEMBRO
            ? "MEMBRO"
            : "NAO_CADASTRADO"
        )
      ).toUpperCase(),

      membroId: texto(
        obterPrimeiroValor(
          item,
          ["membroId", "idMembro", "ID_MEMBRO"]
        )
      ),

      nomeMembro: texto(
        obterPrimeiroValor(
          item,
          [
            "nomeMembro",
            "nome",
            "NOME_MEMBRO",
            "dizimista"
          ],
          "Nome não informado"
        )
      ),

      valor: numero(
        obterPrimeiroValor(item, ["valor", "VALOR"], 0)
      )
    };
  }

  function normalizarLancamento(item = {}) {
    const dizimos = obterListaDaResposta(
      item,
      ["dizimos", "DIZIMOS", "itens"]
    ).map(normalizarDizimo);

    const oferta = numero(
      obterPrimeiroValor(item, ["oferta", "OFERTA"], 0)
    );

    const totalDizimosInformado = numero(
      obterPrimeiroValor(
        item,
        ["totalDizimos", "TOTAL_DIZIMOS"],
        0
      )
    );

    const totalDizimos = totalDizimosInformado ||
      dizimos.reduce((total, dizimo) => total + dizimo.valor, 0);

    const totalGeralInformado = numero(
      obterPrimeiroValor(
        item,
        ["totalGeral", "TOTAL_GERAL"],
        0
      )
    );

    return {
      ...item,

      id: texto(
        obterPrimeiroValor(
          item,
          ["id", "ID", "codigo", "CODIGO"]
        )
      ),

      data: dataIsoLocal(
        obterPrimeiroValor(item, ["data", "DATA"])
      ),

      congregacao: texto(
        obterPrimeiroValor(
          item,
          ["congregacao", "CONGREGACAO", "Congregação"]
        )
      ),

      oferta,

      totalDizimos,

      totalGeral: totalGeralInformado || oferta + totalDizimos,

      observacoes: texto(
        obterPrimeiroValor(
          item,
          ["observacoes", "OBSERVACOES"],
          ""
        )
      ),

      responsavelId: texto(
        obterPrimeiroValor(
          item,
          ["responsavelId", "RESPONSAVEL_ID"]
        )
      ),

      responsavelNome: texto(
        obterPrimeiroValor(
          item,
          [
            "responsavelNome",
            "RESPONSAVEL_NOME",
            "responsavel",
            "RESPONSAVEL"
          ],
          "Não informado"
        )
      ),

      responsavelEmail: texto(
        obterPrimeiroValor(
          item,
          ["responsavelEmail", "RESPONSAVEL_EMAIL"]
        )
      ),

      status: normalizarStatus(
        obterPrimeiroValor(item, ["status", "STATUS"])
      ),

      criadoEm: obterPrimeiroValor(
        item,
        ["criadoEm", "CRIADO_EM", "dataCadastro"],
        ""
      ),

      motivoRejeicao: texto(
        obterPrimeiroValor(
          item,
          ["motivoRejeicao", "MOTIVO_REJEICAO"],
          ""
        )
      ),

      dizimos
    };
  }

  function capturarElementos() {
    const ids = [
      "botaoAtualizarFinanceiro",
      "avisoFinanceiro",
      "resumoQuantidadePendentes",
      "resumoQuantidadeAprovados",
      "resumoTotalDizimos",
      "resumoTotalOfertas",
      "textoCompetenciaFinanceira",
"statusCompetenciaFinanceira",
"botaoAlternarFechamentoMes",
"tituloCompetenciaFinanceira",
      "formFiltrosFinanceiro",
      "filtroStatus",
      "filtroMes",
      "filtroCongregacao",
      "filtroPesquisa",
      "botaoLimparFiltrosFinanceiro",
      "contadorLancamentosFinanceiro",
      "estadoCarregandoFinanceiro",
      "estadoVazioFinanceiro",
      "tabelaFinanceiroArea",
      "corpoTabelaFinanceiro",
      "financeiroDetalhes",
      "botaoFecharDetalhesFundo",
      "codigoDetalhesFinanceiro",
      "botaoFecharDetalhes",
      "detalheData",
      "detalheCongregacao",
      "detalheResponsavel",
      "detalheStatus",
      "detalheOferta",
      "detalheTotalDizimos",
      "detalheTotalGeral",
      "detalheQuantidadeDizimos",
      "corpoTabelaDetalheDizimos",
      "detalheObservacoes",
      "financeiroDetalhesAcoes",
      "botaoEditarLancamento",
      "botaoRejeitarLancamento",
      "botaoAprovarLancamento",
      "dialogoAprovarFinanceiro",
      "botaoCancelarAprovacao",
      "botaoConfirmarAprovacao",
      "dialogoRejeitarFinanceiro",
      "motivoRejeicaoFinanceiro",
      "botaoCancelarRejeicao",
      "botaoConfirmarRejeicao",
      "carregamentoGlobal"
    ];

    ids.forEach((id) => {
      elementos[id] = document.getElementById(id);
    });

    const faltantes = ids.filter((id) => !elementos[id]);

    if (faltantes.length) {
      console.warn(
        "[FINANCEIRO] Elementos não encontrados:",
        faltantes.join(", ")
      );
    }

    return faltantes.length === 0;
  }

  function mostrarMensagem(mensagem, tipo = "aviso") {
    elementos.avisoFinanceiro.textContent = texto(mensagem);
    elementos.avisoFinanceiro.className = `alerta ${tipo}`;
    elementos.avisoFinanceiro.hidden = !texto(mensagem);
  }

  function limparMensagem() {
    elementos.avisoFinanceiro.textContent = "";
    elementos.avisoFinanceiro.className = "alerta";
    elementos.avisoFinanceiro.hidden = true;
  }

  function definirCarregamentoGlobal(ativo, mensagem = "Carregando...") {
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

  function definirEstadoLista(tipo) {
    elementos.estadoCarregandoFinanceiro.hidden =
      tipo !== "carregando";

    elementos.estadoVazioFinanceiro.hidden =
      tipo !== "vazio";

    elementos.tabelaFinanceiroArea.hidden =
      tipo !== "tabela";
  }

  function preencherUsuarioInterface() {
    const auth = obterAuth();

    const usuario =
      typeof auth.obterUsuarioAtual === "function"
        ? auth.obterUsuarioAtual()
        : auth.usuarioAtual || auth.usuario || {};

    const nome = texto(
      obterPrimeiroValor(
        usuario,
        ["nome", "nomeCompleto", "NOME", "email"],
        "Usuário"
      )
    );

    const perfil = texto(
      obterPrimeiroValor(
        usuario,
        ["perfil", "cargo", "tipo", "nivel"],
        "Perfil"
      )
    );

    const iniciais = nome
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte.charAt(0).toUpperCase())
      .join("") || "US";

    document.querySelectorAll("[data-usuario-nome]")
      .forEach((elemento) => {
        elemento.textContent = nome;
      });

    document.querySelectorAll("[data-usuario-perfil]")
      .forEach((elemento) => {
        elemento.textContent = perfil;
      });

    document.querySelectorAll("[data-usuario-iniciais]")
      .forEach((elemento) => {
        elemento.textContent = iniciais;
      });
  }

  function statusClasse(status) {
    return normalizarStatus(status).toLocaleLowerCase("pt-BR");
  }

  function statusHtml(status) {
    const normalizado = normalizarStatus(status);

    return `
      <span class="financeiro-status ${statusClasse(normalizado)}">
        ${escaparHtml(normalizado)}
      </span>
    `;
  }

  function ordenarLancamentos(lista) {
    const prioridade = {
      PENDENTE: 0,
      APROVADO: 1,
      REJEITADO: 2
    };

    return [...lista].sort((a, b) => {
      const diferencaStatus =
        prioridade[a.status] - prioridade[b.status];

      if (diferencaStatus !== 0) {
        return diferencaStatus;
      }

      return String(b.data || "").localeCompare(String(a.data || ""));
    });
  }

  function aplicarFiltros() {
    const status = normalizarStatus(
      elementos.filtroStatus.value
    );

    const statusFoiInformado = Boolean(
      texto(elementos.filtroStatus.value)
    );

    const mes = texto(elementos.filtroMes.value);
    const congregacao = normalizarTexto(
      elementos.filtroCongregacao.value
    );
    const pesquisa = normalizarTexto(
      elementos.filtroPesquisa.value
    );

    estado.lancamentosFiltrados = ordenarLancamentos(
      estado.lancamentos.filter((lancamento) => {
        if (
          statusFoiInformado &&
          lancamento.status !== status
        ) {
          return false;
        }

        if (
          mes &&
          !String(lancamento.data || "").startsWith(mes)
        ) {
          return false;
        }

        if (
          congregacao &&
          normalizarTexto(lancamento.congregacao) !== congregacao
        ) {
          return false;
        }

        if (pesquisa) {
          const basePesquisa = normalizarTexto([
            lancamento.id,
            lancamento.congregacao,
            lancamento.responsavelNome,
            lancamento.responsavelEmail
          ].join(" "));

          if (!basePesquisa.includes(pesquisa)) {
            return false;
          }
        }

        return true;
      })
    );

    renderizarTabela();
  }

  function atualizarResumo() {
    const mes = texto(elementos.filtroMes.value) || mesAtual();

    const pendentes = estado.lancamentos.filter(
      (item) => item.status === STATUS.PENDENTE
    );

    const aprovadosMes = estado.lancamentos.filter(
      (item) =>
        item.status === STATUS.APROVADO &&
        String(item.data || "").startsWith(mes)
    );

    const totalDizimos = aprovadosMes.reduce(
      (total, item) => total + item.totalDizimos,
      0
    );

    const totalOfertas = aprovadosMes.reduce(
      (total, item) => total + item.oferta,
      0
    );

    elementos.resumoQuantidadePendentes.textContent =
      String(pendentes.length);

    elementos.resumoQuantidadeAprovados.textContent =
      String(aprovadosMes.length);

    elementos.resumoTotalDizimos.textContent =
      moeda(totalDizimos);

    elementos.resumoTotalOfertas.textContent =
      moeda(totalOfertas);
  }

  function renderizarTabela() {
    const lista = estado.lancamentosFiltrados;
    const quantidade = lista.length;

    elementos.contadorLancamentosFinanceiro.textContent =
      quantidade === 1
        ? "1 lançamento"
        : `${quantidade} lançamentos`;

    if (!quantidade) {
      elementos.corpoTabelaFinanceiro.innerHTML = "";
      definirEstadoLista("vazio");
      return;
    }

    elementos.corpoTabelaFinanceiro.innerHTML = lista
      .map(
        (lancamento) => `
          <tr data-id-lancamento="${escaparHtml(lancamento.id)}">
            <td>
              ${escaparHtml(dataFormatada(lancamento.data))}
            </td>

            <td>
              ${escaparHtml(lancamento.congregacao || "—")}
            </td>

            <td>
              ${escaparHtml(lancamento.responsavelNome || "—")}
            </td>

            <td class="valor">
              ${escaparHtml(moeda(lancamento.oferta))}
            </td>

            <td class="valor">
              ${escaparHtml(moeda(lancamento.totalDizimos))}
            </td>

            <td class="valor total">
              ${escaparHtml(moeda(lancamento.totalGeral))}
            </td>

            <td>
              ${statusHtml(lancamento.status)}
            </td>

            <td class="financeiro-admin-coluna-acoes">
              <button
                type="button"
                class="financeiro-admin-botao-conferir"
                data-acao="conferir-lancamento"
                data-id-lancamento="${escaparHtml(lancamento.id)}"
              >
                Conferir
              </button>
            </td>
          </tr>
        `
      )
      .join("");

    definirEstadoLista("tabela");
  }

  function preencherSelectCongregacoes() {
    const valorAtual = elementos.filtroCongregacao.value;

    elementos.filtroCongregacao.innerHTML = `
      <option value="">Todas</option>
      ${estado.congregacoes
        .map(
          (congregacao) => `
            <option value="${escaparHtml(congregacao)}">
              ${escaparHtml(congregacao)}
            </option>
          `
        )
        .join("")}
    `;

    if (estado.congregacoes.includes(valorAtual)) {
      elementos.filtroCongregacao.value = valorAtual;
    }
  }

  async function carregarCongregacoes() {
    try {
      const resultado = await obterAuth().chamarApi({
        acao: ACOES_API.LISTAR_CONGREGACOES
      });

      if (resultado?.sucesso === false) {
        throw new Error(resultado.mensagem);
      }

      const lista = obterListaDaResposta(
        resultado,
        ["congregacoes", "dados", "resultado"]
      );

      estado.congregacoes = [...new Set(
        lista
          .map((item) => texto(
            obterPrimeiroValor(
              item,
              [
                "nome",
                "NOME",
                "nomeCongregacao",
                "congregacao",
                "Congregação"
              ]
            )
          ))
          .filter(Boolean)
      )].sort((a, b) => a.localeCompare(b, "pt-BR"));

      preencherSelectCongregacoes();
    } catch (erro) {
      console.warn(
        "[FINANCEIRO] Não foi possível carregar congregações:",
        erro
      );
    }
  }
  async function carregarStatusMesFinanceiro() {
  const mes =
    texto(elementos.filtroMes.value) ||
    mesAtual();

  elementos.botaoAlternarFechamentoMes.disabled = true;
  elementos.botaoAlternarFechamentoMes.textContent =
    "Aguarde...";

  elementos.statusCompetenciaFinanceira.textContent =
    "VERIFICANDO";

  elementos.statusCompetenciaFinanceira.className =
    "financeiro-status pendente";

  elementos.textoCompetenciaFinanceira.textContent =
    "Verificando situação do mês...";

  try {
    const resultado =
      await obterAuth().chamarApi({
        acao: ACOES_API.STATUS_MES,
        mes
      });

    if (resultado?.sucesso === false) {
      throw new Error(
        resultado.mensagem ||
        "Não foi possível consultar a competência."
      );
    }

    const fechado =
      Boolean(resultado?.fechado);

    estado.mesFechado = fechado;

    elementos.statusCompetenciaFinanceira.textContent =
      fechado
        ? "FECHADO"
        : "EM ABERTO";

    elementos.statusCompetenciaFinanceira.className =
      fechado
        ? "financeiro-status rejeitado"
        : "financeiro-status aprovado";

    elementos.textoCompetenciaFinanceira.textContent =
      fechado
        ? "Esta competência está encerrada para movimentações."
        : "Esta competência está disponível para movimentações.";

    elementos.botaoAlternarFechamentoMes.textContent =
      fechado
        ? "Reabrir mês"
        : "Fechar mês";

    elementos.botaoAlternarFechamentoMes.disabled = false;

  } catch (erro) {
    estado.mesFechado = false;

    elementos.statusCompetenciaFinanceira.textContent =
      "ERRO";

    elementos.statusCompetenciaFinanceira.className =
      "financeiro-status rejeitado";

    elementos.textoCompetenciaFinanceira.textContent =
      erro?.message ||
      "Não foi possível consultar a situação do mês.";

    elementos.botaoAlternarFechamentoMes.textContent =
      "Indisponível";

    elementos.botaoAlternarFechamentoMes.disabled = true;
  }
}
  async function carregarLancamentos() {
    estado.carregando = true;
    definirEstadoLista("carregando");
    limparMensagem();

    try {
      const resultado = await obterAuth().chamarApi({
        acao: ACOES_API.LISTAR,
        filtros: {
          status: texto(elementos.filtroStatus.value),
          mes: texto(elementos.filtroMes.value),
          congregacao: texto(elementos.filtroCongregacao.value),
          pesquisa: texto(elementos.filtroPesquisa.value)
        }
      });

      if (resultado?.sucesso === false) {
        throw new Error(
          resultado.mensagem ||
          "Não foi possível carregar os lançamentos."
        );
      }

      const lista = obterListaDaResposta(
        resultado,
        ["lancamentos", "dados", "resultado"]
      );

      estado.lancamentos = lista.map(normalizarLancamento);

      atualizarResumo();
      aplicarFiltros();
    } catch (erro) {
      console.error(
        "[FINANCEIRO] Erro ao carregar lançamentos:",
        erro
      );

      estado.lancamentos = [];
      estado.lancamentosFiltrados = [];

      elementos.contadorLancamentosFinanceiro.textContent =
        "0 lançamentos";

      definirEstadoLista("vazio");

      mostrarMensagem(
        erro?.message ||
        "Não foi possível carregar o Painel Financeiro.",
        "erro"
      );
    } finally {
      estado.carregando = false;
    }
  }

  async function buscarLancamento(id) {
    const local = estado.lancamentos.find(
      (item) => item.id === id
    );

    definirCarregamentoGlobal(
      true,
      "Carregando lançamento..."
    );

    try {
      const resultado = await obterAuth().chamarApi({
        acao: ACOES_API.BUSCAR,
        id
      });

      if (resultado?.sucesso === false) {
        throw new Error(
          resultado.mensagem ||
          "Não foi possível localizar o lançamento."
        );
      }

      const dados =
        resultado?.lancamento ||
        resultado?.dados ||
        resultado;

      return normalizarLancamento(dados);
    } catch (erro) {
      if (local) {
        console.warn(
          "[FINANCEIRO] Detalhes completos indisponíveis; usando dados da lista.",
          erro
        );

        return local;
      }

      throw erro;
    } finally {
      definirCarregamentoGlobal(false);
    }
  }

  function renderizarDizimosDetalhes(dizimos) {
    if (!dizimos.length) {
      elementos.corpoTabelaDetalheDizimos.innerHTML = `
        <tr>
          <td colspan="2">
            Nenhum dízimo registrado neste lançamento.
          </td>
        </tr>
      `;

      return;
    }

    elementos.corpoTabelaDetalheDizimos.innerHTML = dizimos
      .map(
        (dizimo) => `
          <tr>
            <td>
              ${escaparHtml(dizimo.nomeMembro)}
            </td>

            <td>
              ${escaparHtml(moeda(dizimo.valor))}
            </td>
          </tr>
        `
      )
      .join("");
  }

  function preencherDetalhes(lancamento) {
    estado.lancamentoSelecionado = lancamento;

    elementos.codigoDetalhesFinanceiro.textContent =
      lancamento.id || "—";

    elementos.detalheData.textContent =
      dataFormatada(lancamento.data);

    elementos.detalheCongregacao.textContent =
      lancamento.congregacao || "—";

    elementos.detalheResponsavel.textContent =
      lancamento.responsavelNome || "—";

    elementos.detalheStatus.innerHTML =
      statusHtml(lancamento.status);

    elementos.detalheOferta.textContent =
      moeda(lancamento.oferta);

    elementos.detalheTotalDizimos.textContent =
      moeda(lancamento.totalDizimos);

    elementos.detalheTotalGeral.textContent =
      moeda(lancamento.totalGeral);

    elementos.detalheQuantidadeDizimos.textContent =
      lancamento.dizimos.length === 1
        ? "1 registro"
        : `${lancamento.dizimos.length} registros`;

    elementos.detalheObservacoes.textContent =
      lancamento.observacoes ||
      "Nenhuma observação registrada.";

    renderizarDizimosDetalhes(lancamento.dizimos);

    const pendente =
      lancamento.status === STATUS.PENDENTE;

    elementos.financeiroDetalhesAcoes.hidden = !pendente;
    elementos.botaoEditarLancamento.hidden = !pendente;
    elementos.botaoRejeitarLancamento.hidden = !pendente;
    elementos.botaoAprovarLancamento.hidden = !pendente;
  }

  async function abrirDetalhes(id) {
    limparMensagem();

    try {
      const lancamento = await buscarLancamento(id);

      preencherDetalhes(lancamento);
      elementos.financeiroDetalhes.hidden = false;
      elementos.botaoFecharDetalhes.focus();
    } catch (erro) {
      mostrarMensagem(
        erro?.message ||
        "Não foi possível abrir o lançamento.",
        "erro"
      );
    }
  }
async function abrirLancamentoDaUrl() {
  const parametros = new URLSearchParams(
    window.location.search
  );

  const id = texto(
    parametros.get("id")
  );

  if (!id) {
    return;
  }

  await abrirDetalhes(id);
}
  function fecharDetalhes() {
    elementos.financeiroDetalhes.hidden = true;
    estado.lancamentoSelecionado = null;
  }

  function abrirDialogoAprovacao() {
    if (!estado.lancamentoSelecionado) {
      return;
    }

    elementos.dialogoAprovarFinanceiro.hidden = false;
    elementos.botaoConfirmarAprovacao.focus();
  }

  function fecharDialogoAprovacao() {
    elementos.dialogoAprovarFinanceiro.hidden = true;
  }

  function abrirDialogoRejeicao() {
    if (!estado.lancamentoSelecionado) {
      return;
    }

    elementos.motivoRejeicaoFinanceiro.value = "";
    elementos.dialogoRejeitarFinanceiro.hidden = false;
    elementos.motivoRejeicaoFinanceiro.focus();
  }

  function fecharDialogoRejeicao() {
    elementos.dialogoRejeitarFinanceiro.hidden = true;
    elementos.motivoRejeicaoFinanceiro.value = "";
  }

  async function aprovarLancamento() {
    if (
      estado.processando ||
      !estado.lancamentoSelecionado
    ) {
      return;
    }

    estado.processando = true;
    elementos.botaoConfirmarAprovacao.disabled = true;

    try {
      definirCarregamentoGlobal(
        true,
        "Aprovando lançamento..."
      );

      const resultado = await obterAuth().chamarApi({
        acao: ACOES_API.APROVAR,
        id: estado.lancamentoSelecionado.id
      });

      if (resultado?.sucesso === false) {
        throw new Error(
          resultado.mensagem ||
          "Não foi possível aprovar o lançamento."
        );
      }

      fecharDialogoAprovacao();
      fecharDetalhes();

      mostrarMensagem(
        resultado?.mensagem ||
        "Lançamento aprovado com sucesso.",
        "sucesso"
      );

      await carregarLancamentos();
    } catch (erro) {
      mostrarMensagem(
        erro?.message ||
        "Não foi possível aprovar o lançamento.",
        "erro"
      );
    } finally {
      estado.processando = false;
      elementos.botaoConfirmarAprovacao.disabled = false;
      definirCarregamentoGlobal(false);
    }
  }

  async function rejeitarLancamento() {
    if (
      estado.processando ||
      !estado.lancamentoSelecionado
    ) {
      return;
    }

    const motivo = texto(
      elementos.motivoRejeicaoFinanceiro.value
    );

    if (!motivo) {
      elementos.motivoRejeicaoFinanceiro.focus();
      return;
    }

    estado.processando = true;
    elementos.botaoConfirmarRejeicao.disabled = true;

    try {
      definirCarregamentoGlobal(
        true,
        "Rejeitando lançamento..."
      );

      const resultado = await obterAuth().chamarApi({
        acao: ACOES_API.REJEITAR,
        id: estado.lancamentoSelecionado.id,
        motivo
      });

      if (resultado?.sucesso === false) {
        throw new Error(
          resultado.mensagem ||
          "Não foi possível rejeitar o lançamento."
        );
      }

      fecharDialogoRejeicao();
      fecharDetalhes();

      mostrarMensagem(
        resultado?.mensagem ||
        "Lançamento rejeitado.",
        "sucesso"
      );

      await carregarLancamentos();
    } catch (erro) {
      mostrarMensagem(
        erro?.message ||
        "Não foi possível rejeitar o lançamento.",
        "erro"
      );
    } finally {
      estado.processando = false;
      elementos.botaoConfirmarRejeicao.disabled = false;
      definirCarregamentoGlobal(false);
    }
  }

  function prepararFiltrosUrl() {
    const parametros = new URLSearchParams(
      window.location.search
    );

    const status = normalizarStatus(
      parametros.get("status")
    );

    if (parametros.has("status")) {
      elementos.filtroStatus.value = status;
    }

    const mes = texto(parametros.get("mes"));

    elementos.filtroMes.value =
      /^\d{4}-\d{2}$/.test(mes)
        ? mes
        : mesAtual();
  }

  function limparFiltros() {
    elementos.filtroStatus.value = "";
    elementos.filtroMes.value = mesAtual();
    elementos.filtroCongregacao.value = "";
    elementos.filtroPesquisa.value = "";

    atualizarResumo();
    aplicarFiltros();
  }

  function configurarEventos() {
    elementos.formFiltrosFinanceiro.addEventListener(
      "submit",
      function (evento) {
        evento.preventDefault();
        atualizarResumo();
        aplicarFiltros();
      }
    );

    elementos.botaoLimparFiltrosFinanceiro.addEventListener(
      "click",
      limparFiltros
    );

    elementos.botaoAtualizarFinanceiro.addEventListener(
      "click",
      carregarLancamentos
    );

    elementos.corpoTabelaFinanceiro.addEventListener(
      "click",
      function (evento) {
        const botao = evento.target.closest(
          '[data-acao="conferir-lancamento"]'
        );

        if (!botao) {
          return;
        }

        abrirDetalhes(botao.dataset.idLancamento);
      }
    );

    elementos.botaoFecharDetalhes.addEventListener(
      "click",
      fecharDetalhes
    );

    elementos.botaoFecharDetalhesFundo.addEventListener(
      "click",
      fecharDetalhes
    );

    elementos.botaoAprovarLancamento.addEventListener(
      "click",
      abrirDialogoAprovacao
    );

    elementos.botaoRejeitarLancamento.addEventListener(
      "click",
      abrirDialogoRejeicao
    );

    elementos.botaoEditarLancamento.addEventListener(
      "click",
      function () {
        mostrarMensagem(
          "A edição de lançamentos será ativada na próxima etapa do Financeiro.",
          "aviso"
        );
      }
    );

    elementos.botaoCancelarAprovacao.addEventListener(
      "click",
      fecharDialogoAprovacao
    );

    elementos.botaoConfirmarAprovacao.addEventListener(
      "click",
      aprovarLancamento
    );

    elementos.botaoCancelarRejeicao.addEventListener(
      "click",
      fecharDialogoRejeicao
    );

    elementos.botaoConfirmarRejeicao.addEventListener(
      "click",
      rejeitarLancamento
    );

    document
      .querySelectorAll('[data-acao="fechar-dialogo-aprovacao"]')
      .forEach((elemento) => {
        elemento.addEventListener(
          "click",
          fecharDialogoAprovacao
        );
      });

    document
      .querySelectorAll('[data-acao="fechar-dialogo-rejeicao"]')
      .forEach((elemento) => {
        elemento.addEventListener(
          "click",
          fecharDialogoRejeicao
        );
      });

    document.addEventListener(
      "keydown",
      function (evento) {
        if (evento.key !== "Escape") {
          return;
        }

        if (!elementos.dialogoAprovarFinanceiro.hidden) {
          fecharDialogoAprovacao();
          return;
        }

        if (!elementos.dialogoRejeitarFinanceiro.hidden) {
          fecharDialogoRejeicao();
          return;
        }

        if (!elementos.financeiroDetalhes.hidden) {
          fecharDetalhes();
        }
      }
    );
  }

  async function inicializar() {
    if (!capturarElementos()) {
      return;
    }

    try {
      preencherUsuarioInterface();
      prepararFiltrosUrl();
      configurarEventos();

      await Promise.all([
        carregarCongregacoes(),
        carregarLancamentos()
      ]);
      await abrirLancamentoDaUrl();
      
    } catch (erro) {
      console.error(
        "[FINANCEIRO] Falha na inicialização:",
        erro
      );

      definirEstadoLista("vazio");

      mostrarMensagem(
        erro?.message ||
        "Não foi possível iniciar o Painel Financeiro.",
        "erro"
      );
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
