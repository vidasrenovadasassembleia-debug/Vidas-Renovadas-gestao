"use strict";

/* ==========================================================================
   RELATÓRIOS — MOTOR DE INTERFACE
   Vidas Renovadas Gestão 2.0
   ========================================================================== */

(function (window, document) {

  const ACAO_API_RELATORIO = "gerarRelatorio";

  const estado = {
    categoriaAtual: "",
    grupoAtual: "",
    relatorioAtual: "",
    resultadoAtual: null,
    congregacoes: []
  };

  const elementos = {};

  const OPCOES_STATUS_FINANCEIRO = [
    { valor: "", rotulo: "Todos" },
    { valor: "PENDENTE", rotulo: "Pendentes" },
    { valor: "APROVADO", rotulo: "Aprovados" },
    { valor: "REJEITADO", rotulo: "Rejeitados" }
  ];

  const OPCOES_TIPO_DIZIMISTA = [
    { valor: "", rotulo: "Todos" },
    { valor: "MEMBRO", rotulo: "Membros cadastrados" },
    { valor: "NAO_CADASTRADO", rotulo: "Não cadastrados" }
  ];

  const CATALOGO_RELATORIOS = Object.freeze({
    membros: {
      titulo: "Membros",
      descricao: "Consultas cadastrais, situação, congregação e aniversariantes.",
      grupos: [
        {
          id: "cadastros",
          titulo: "Cadastros",
          descricao: "Relações gerais e situação cadastral.",
          relatorios: [
            {
              id: "membros_geral",
              titulo: "Relação geral de membros",
              descricao: "Apresenta os membros cadastrados conforme os filtros informados.",
              filtros: ["pesquisa", "congregacao", "situacao"],
              colunas: [
                ["codigo", "Código"],
                ["nome", "Nome"],
                ["congregacao", "Congregação"],
                ["cargo", "Cargo"],
                ["situacao", "Situação"]
              ]
            },
            {
              id: "membros_por_congregacao",
              titulo: "Membros por congregação",
              descricao: "Lista os membros vinculados a cada congregação.",
              filtros: ["congregacao", "situacao"],
              colunas: [
                ["nome", "Nome"],
                ["congregacao", "Congregação"],
                ["cargo", "Cargo"],
                ["telefone", "Telefone"],
                ["situacao", "Situação"]
              ]
            },
            {
              id: "membros_cadastros_incompletos",
              titulo: "Cadastros incompletos",
              descricao: "Identifica registros com informações essenciais ausentes.",
              filtros: ["congregacao"],
              colunas: [
                ["codigo", "Código"],
                ["nome", "Nome"],
                ["congregacao", "Congregação"],
                ["pendencias", "Informações pendentes"]
              ]
            }
          ]
        },
        {
          id: "datas",
          titulo: "Datas e aniversários",
          descricao: "Consultas por aniversário e período.",
          relatorios: [
            {
              id: "membros_aniversariantes",
              titulo: "Aniversariantes",
              descricao: "Apresenta os aniversariantes do mês selecionado.",
              filtros: ["mes", "congregacao"],
              colunas: [
                ["dia", "Dia"],
                ["nome", "Nome"],
                ["congregacao", "Congregação"],
                ["telefone", "Telefone"]
              ]
            }
          ]
        }
      ]
    },

    congregacoes: {
      titulo: "Congregações",
      descricao: "Dados cadastrais, dirigentes e distribuição de membros.",
      grupos: [
        {
          id: "visao_geral",
          titulo: "Visão geral",
          descricao: "Relação e resumo das congregações.",
          relatorios: [
            {
              id: "congregacoes_geral",
              titulo: "Relação de congregações",
              descricao: "Lista as congregações cadastradas e seus responsáveis.",
              filtros: ["pesquisa"],
              colunas: [
                ["codigo", "Código"],
                ["nome", "Congregação"],
                ["dirigente", "Dirigente"],
                ["cidade", "Cidade"],
                ["quantidadeMembros", "Membros"]
              ]
            },
            {
              id: "congregacoes_resumo_membros",
              titulo: "Resumo de membros",
              descricao: "Compara a quantidade de membros entre as congregações.",
              filtros: [],
              colunas: [
                ["congregacao", "Congregação"],
                ["membrosAtivos", "Ativos"],
                ["membrosInativos", "Inativos"],
                ["total", "Total"]
              ]
            }
          ]
        }
      ]
    },

    financeiro: {
      titulo: "Financeiro",
      descricao: "Dízimos, ofertas, lançamentos e resumos financeiros.",
      grupos: [
        {
          id: "dizimos",
          titulo: "Dízimos",
          descricao: "Consultas individuais e consolidadas de dízimos.",
          relatorios: [
            {
              id: "financeiro_dizimos_periodo",
              titulo: "Dízimos por período",
              descricao: "Apresenta os dízimos aprovados dentro do período selecionado.",
              filtros: ["dataInicial", "dataFinal", "congregacao", "tipoDizimista"],
              colunas: [
                ["data", "Data"],
                ["dizimista", "Dizimista"],
                ["tipo", "Tipo"],
                ["congregacao", "Congregação"],
                ["valor", "Valor", "moeda"]
              ]
            },
            {
              id: "financeiro_dizimos_congregacao",
              titulo: "Dízimos por congregação",
              descricao: "Agrupa os valores de dízimos por congregação.",
              filtros: ["dataInicial", "dataFinal", "congregacao"],
              colunas: [
                ["congregacao", "Congregação"],
                ["quantidade", "Registros"],
                ["valor", "Valor total", "moeda"]
              ]
            },
            {
              id: "financeiro_dizimos_dizimista",
              titulo: "Dízimos por dizimista",
              descricao: "Exibe os lançamentos de um dizimista cadastrado ou não cadastrado.",
              filtros: ["dataInicial", "dataFinal", "pesquisa", "tipoDizimista"],
              colunas: [
                ["data", "Data"],
                ["dizimista", "Dizimista"],
                ["tipo", "Tipo"],
                ["congregacao", "Congregação"],
                ["valor", "Valor", "moeda"]
              ]
            }
          ]
        },
        {
          id: "ofertas",
          titulo: "Ofertas",
          descricao: "Consultas de ofertas por período e congregação.",
          relatorios: [
            {
              id: "financeiro_ofertas_periodo",
              titulo: "Ofertas por período",
              descricao: "Apresenta as ofertas de lançamentos aprovados no período.",
              filtros: ["dataInicial", "dataFinal", "congregacao"],
              colunas: [
                ["data", "Data"],
                ["congregacao", "Congregação"],
                ["responsavel", "Responsável"],
                ["valor", "Oferta", "moeda"]
              ]
            },
            {
              id: "financeiro_ofertas_congregacao",
              titulo: "Ofertas por congregação",
              descricao: "Agrupa o valor total de ofertas por congregação.",
              filtros: ["dataInicial", "dataFinal"],
              colunas: [
                ["congregacao", "Congregação"],
                ["quantidade", "Lançamentos"],
                ["valor", "Valor total", "moeda"]
              ]
            }
          ]
        },
        {
          id: "lancamentos",
          titulo: "Lançamentos",
          descricao: "Acompanhamento dos lançamentos enviados pela Tesouraria.",
          relatorios: [
            {
              id: "financeiro_lancamentos",
              titulo: "Lançamentos financeiros",
              descricao: "Lista os lançamentos por status, período e congregação.",
              filtros: ["mes", "congregacao", "statusFinanceiro", "pesquisa"],
              colunas: [
                ["data", "Data"],
                ["codigo", "Código"],
                ["congregacao", "Congregação"],
                ["responsavel", "Responsável"],
                ["oferta", "Oferta", "moeda"],
                ["dizimos", "Dízimos", "moeda"],
                ["total", "Total", "moeda"],
                ["status", "Status"]
              ]
            }
          ]
        },
        {
          id: "resumos",
          titulo: "Resumos",
          descricao: "Consolidações mensais e anuais.",
          relatorios: [
            {
              id: "financeiro_resumo_mensal",
              titulo: "Resumo mensal",
              descricao: "Consolida dízimos, ofertas e total aprovado no mês.",
              filtros: ["mes", "congregacao"],
              colunas: [
                ["congregacao", "Congregação"],
                ["dizimos", "Dízimos", "moeda"],
                ["ofertas", "Ofertas", "moeda"],
                ["total", "Total", "moeda"]
              ]
            },
            {
              id: "financeiro_resumo_anual",
              titulo: "Resumo anual",
              descricao: "Apresenta a evolução financeira mês a mês no ano selecionado.",
              filtros: ["ano", "congregacao"],
              colunas: [
                ["mes", "Mês"],
                ["dizimos", "Dízimos", "moeda"],
                ["ofertas", "Ofertas", "moeda"],
                ["total", "Total", "moeda"]
              ]
            }
          ]
        }
      ]
    },

    certificados: {
      titulo: "Certificados",
      descricao: "Emissões de batismo, consagração e reimpressões.",
      grupos: [
        {
          id: "emissoes",
          titulo: "Emissões",
          descricao: "Histórico de certificados emitidos.",
          relatorios: [
            {
              id: "certificados_emitidos",
              titulo: "Certificados emitidos",
              descricao: "Lista os certificados emitidos no período.",
              filtros: ["dataInicial", "dataFinal", "tipoCertificado", "pesquisa"],
              colunas: [
                ["data", "Data"],
                ["numero", "Número"],
                ["nome", "Pessoa"],
                ["tipo", "Tipo"],
                ["cargo", "Cargo"],
                ["emitidoPor", "Emitido por"]
              ]
            }
          ]
        }
      ]
    },

    administracao: {
      titulo: "Administração",
      descricao: "Usuários, acessos, alterações e registros de auditoria.",
      grupos: [
        {
          id: "auditoria",
          titulo: "Auditoria",
          descricao: "Ações realizadas dentro do sistema.",
          relatorios: [
            {
              id: "administracao_logs",
              titulo: "Logs do sistema",
              descricao: "Apresenta as últimas ações registradas no sistema.",
              filtros: ["dataInicial", "dataFinal", "pesquisa"],
              colunas: [
                ["data", "Data e hora"],
                ["usuario", "Usuário"],
                ["acao", "Ação"],
                ["modulo", "Módulo"],
                ["detalhes", "Detalhes"]
              ]
            }
          ]
        }
      ]
    }
  });

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

  function numero(valor) {
    if (typeof valor === "number") {
      return Number.isFinite(valor) ? valor : 0;
    }

    const convertido = Number(
      texto(valor)
        .replace(/\s/g, "")
        .replace(/^R\$/i, "")
        .replace(/\./g, "")
        .replace(",", ".")
        .replace(/[^\d.-]/g, "")
    );

    return Number.isFinite(convertido) ? convertido : 0;
  }

  function moeda(valor) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(numero(valor));
  }

  function obterAuth() {
    const auth = window.VRGAuth || window.Auth;

    if (!auth || typeof auth.chamarApi !== "function") {
      throw new Error("O módulo de autenticação/API não foi carregado.");
    }

    return auth;
  }

  function capturarElementos() {
    [
      "botaoVoltarCategorias",
      "avisoRelatorios",
      "secaoCategoriasRelatorios",
      "secaoRelatoriosCategoria",
      "categoriaRelatorioSelo",
      "categoriaRelatorioTitulo",
      "categoriaRelatorioDescricao",
      "listaTiposRelatorio",
      "painelFiltrosRelatorio",
      "tituloRelatorioSelecionado",
      "descricaoRelatorioSelecionado",
      "formFiltrosRelatorio",
      "camposFiltrosRelatorio",
      "botaoLimparFiltrosRelatorio",
      "painelResultadoRelatorio",
      "resumoResultadoRelatorio",
      "botaoExportarPdf",
      "botaoExportarExcel",
      "botaoImprimirRelatorio",
      "estadoCarregandoRelatorio",
      "estadoVazioRelatorio",
      "tabelaRelatorioArea",
      "cabecalhoTabelaRelatorio",
      "corpoTabelaRelatorio",
      "rodapeTabelaRelatorio",
      "carregamentoGlobal"
    ].forEach(function (id) {
      elementos[id] = document.getElementById(id);
    });

    return Object.values(elementos).every(Boolean);
  }

  function mostrarAviso(mensagem, tipo = "aviso") {
    elementos.avisoRelatorios.textContent = texto(mensagem);
    elementos.avisoRelatorios.className = `alerta ${tipo}`;
    elementos.avisoRelatorios.hidden = !texto(mensagem);
  }

  function limparAviso() {
    elementos.avisoRelatorios.hidden = true;
    elementos.avisoRelatorios.textContent = "";
    elementos.avisoRelatorios.className = "alerta";
  }

  function obterCategoriaAtual() {
    return CATALOGO_RELATORIOS[estado.categoriaAtual] || null;
  }

  function obterGrupoAtual() {
    const categoria = obterCategoriaAtual();

    return categoria?.grupos.find(function (grupo) {
      return grupo.id === estado.grupoAtual;
    }) || null;
  }

  function obterRelatorioAtual() {
    const categoria = obterCategoriaAtual();

    if (!categoria) {
      return null;
    }

    for (const grupo of categoria.grupos) {
      const relatorio = grupo.relatorios.find(function (item) {
        return item.id === estado.relatorioAtual;
      });

      if (relatorio) {
        return relatorio;
      }
    }

    return null;
  }

  function renderizarGrupos(categoria) {
    elementos.listaTiposRelatorio.innerHTML = categoria.grupos.map(function (grupo) {
      return `
        <button
          type="button"
          class="relatorios-tipo-card"
          data-grupo-relatorio="${escaparHtml(grupo.id)}"
        >
          <strong>${escaparHtml(grupo.titulo)}</strong>
          <small>${escaparHtml(grupo.descricao)}</small>
          <span class="relatorios-tipo-quantidade">
            ${grupo.relatorios.length}
            ${grupo.relatorios.length === 1 ? "relatório" : "relatórios"}
          </span>
        </button>
      `;
    }).join("");
  }

  function renderizarRelatoriosDoGrupo(grupo) {
    elementos.listaTiposRelatorio.innerHTML = `
      <button
        type="button"
        class="relatorios-tipo-card"
        data-acao-relatorio="voltar-grupos"
      >
        <strong>← Voltar aos grupos</strong>
        <small>Escolher outro grupo desta categoria.</small>
      </button>

      ${grupo.relatorios.map(function (relatorio) {
        return `
          <button
            type="button"
            class="relatorios-tipo-card"
            data-relatorio-id="${escaparHtml(relatorio.id)}"
          >
            <strong>${escaparHtml(relatorio.titulo)}</strong>
            <small>${escaparHtml(relatorio.descricao)}</small>
          </button>
        `;
      }).join("")}
    `;
  }

  function selecionarCategoria(categoriaId) {
    const categoria = CATALOGO_RELATORIOS[categoriaId];

    if (!categoria) {
      return;
    }

    estado.categoriaAtual = categoriaId;
    estado.grupoAtual = "";
    estado.relatorioAtual = "";
    estado.resultadoAtual = null;

    document.querySelectorAll("[data-categoria-relatorio]").forEach(function (card) {
      card.classList.toggle(
        "ativo",
        card.dataset.categoriaRelatorio === categoriaId
      );
    });

    elementos.secaoCategoriasRelatorios.hidden = true;
    elementos.secaoRelatoriosCategoria.hidden = false;
    elementos.botaoVoltarCategorias.hidden = false;

    elementos.categoriaRelatorioSelo.textContent = "Categoria";
    elementos.categoriaRelatorioTitulo.textContent = categoria.titulo;
    elementos.categoriaRelatorioDescricao.textContent = categoria.descricao;

    elementos.painelFiltrosRelatorio.hidden = true;
    elementos.painelResultadoRelatorio.hidden = true;

    renderizarGrupos(categoria);
    limparAviso();
  }

  function selecionarGrupo(grupoId) {
    const categoria = obterCategoriaAtual();
    const grupo = categoria?.grupos.find(function (item) {
      return item.id === grupoId;
    });

    if (!grupo) {
      return;
    }

    estado.grupoAtual = grupoId;
    estado.relatorioAtual = "";
    estado.resultadoAtual = null;

    elementos.categoriaRelatorioSelo.textContent = categoria.titulo;
    elementos.categoriaRelatorioTitulo.textContent = grupo.titulo;
    elementos.categoriaRelatorioDescricao.textContent = grupo.descricao;

    elementos.painelFiltrosRelatorio.hidden = true;
    elementos.painelResultadoRelatorio.hidden = true;

    renderizarRelatoriosDoGrupo(grupo);
  }

  function criarCampo(tipo) {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();

    const campos = {
      pesquisa: `
        <div class="campo">
          <label for="relatorioPesquisa">Pesquisar</label>
          <input
            type="search"
            id="relatorioPesquisa"
            name="pesquisa"
            placeholder="Digite um nome, código ou termo"
          >
        </div>
      `,

      congregacao: `
        <div class="campo">
          <label for="relatorioCongregacao">Congregação</label>
          <select id="relatorioCongregacao" name="congregacao">
            <option value="">Todas</option>
            ${estado.congregacoes.map(function (nome) {
              return `<option value="${escaparHtml(nome)}">${escaparHtml(nome)}</option>`;
            }).join("")}
          </select>
        </div>
      `,

      situacao: `
        <div class="campo">
          <label for="relatorioSituacao">Situação</label>
          <select id="relatorioSituacao" name="situacao">
            <option value="">Todas</option>
            <option value="ATIVO">Ativos</option>
            <option value="INATIVO">Inativos</option>
          </select>
        </div>
      `,

      dataInicial: `
        <div class="campo">
          <label for="relatorioDataInicial">Data inicial</label>
          <input type="date" id="relatorioDataInicial" name="dataInicial">
        </div>
      `,

      dataFinal: `
        <div class="campo">
          <label for="relatorioDataFinal">Data final</label>
          <input type="date" id="relatorioDataFinal" name="dataFinal">
        </div>
      `,

      mes: `
        <div class="campo">
          <label for="relatorioMes">Mês</label>
          <input type="month" id="relatorioMes" name="mes">
        </div>
      `,

      ano: `
        <div class="campo">
          <label for="relatorioAno">Ano</label>
          <input
            type="number"
            id="relatorioAno"
            name="ano"
            min="2000"
            max="2100"
            value="${anoAtual}"
          >
        </div>
      `,

      tipoDizimista: `
        <div class="campo">
          <label for="relatorioTipoDizimista">Tipo do dizimista</label>
          <select id="relatorioTipoDizimista" name="tipoDizimista">
            ${OPCOES_TIPO_DIZIMISTA.map(function (opcao) {
              return `<option value="${opcao.valor}">${opcao.rotulo}</option>`;
            }).join("")}
          </select>
        </div>
      `,

      statusFinanceiro: `
        <div class="campo">
          <label for="relatorioStatusFinanceiro">Status</label>
          <select id="relatorioStatusFinanceiro" name="status">
            ${OPCOES_STATUS_FINANCEIRO.map(function (opcao) {
              return `<option value="${opcao.valor}">${opcao.rotulo}</option>`;
            }).join("")}
          </select>
        </div>
      `,

      tipoCertificado: `
        <div class="campo">
          <label for="relatorioTipoCertificado">Tipo de certificado</label>
          <select id="relatorioTipoCertificado" name="tipoCertificado">
            <option value="">Todos</option>
            <option value="BATISMO">Batismo</option>
            <option value="CONSAGRACAO">Consagração</option>
          </select>
        </div>
      `
    };

    return campos[tipo] || "";
  }

  function selecionarRelatorio(relatorioId) {
    estado.relatorioAtual = relatorioId;
    estado.resultadoAtual = null;

    const relatorio = obterRelatorioAtual();

    if (!relatorio) {
      return;
    }

    elementos.tituloRelatorioSelecionado.textContent = relatorio.titulo;
    elementos.descricaoRelatorioSelecionado.textContent = relatorio.descricao;

    elementos.camposFiltrosRelatorio.innerHTML =
      relatorio.filtros.map(criarCampo).join("");

    elementos.painelFiltrosRelatorio.hidden = false;
    elementos.painelResultadoRelatorio.hidden = true;

    document.querySelectorAll("[data-relatorio-id]").forEach(function (card) {
      card.classList.toggle(
        "ativo",
        card.dataset.relatorioId === relatorioId
      );
    });

    elementos.painelFiltrosRelatorio.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function coletarFiltros() {
    const dados = new FormData(elementos.formFiltrosRelatorio);
    const filtros = {};

    dados.forEach(function (valor, chave) {
      filtros[chave] = texto(valor);
    });

    return filtros;
  }

  function definirEstadoResultado(tipo) {
    elementos.estadoCarregandoRelatorio.hidden = tipo !== "carregando";
    elementos.estadoVazioRelatorio.hidden = tipo !== "vazio";
    elementos.tabelaRelatorioArea.hidden = tipo !== "tabela";
  }

  function formatarCelula(valor, tipo) {
    if (tipo === "moeda") {
      return moeda(valor);
    }

    if (tipo === "data" && valor) {
      const partes = String(valor).slice(0, 10).split("-");

      if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
      }
    }

    return texto(valor) || "—";
  }

  function renderizarResumoExecutivo(resumo) {
    const existente = elementos.painelResultadoRelatorio.querySelector(
      ".relatorios-resumo-executivo"
    );

    if (existente) {
      existente.remove();
    }

    const itens = Array.isArray(resumo)
      ? resumo
      : Object.entries(resumo || {}).map(function ([chave, valor]) {
          return {
            rotulo: chave
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, function (letra) {
                return letra.toUpperCase();
              }),
            valor: valor
          };
        });

    if (!itens.length) {
      return;
    }

    const bloco = document.createElement("div");
    bloco.className = "relatorios-resumo-executivo";

    bloco.innerHTML = itens.map(function (item, indice) {
      return `
        <div class="relatorios-resumo-card ${indice === 1 ? "destaque" : ""}">
          <span class="relatorios-resumo-label">
            ${escaparHtml(item.rotulo || "Resumo")}
          </span>
          <strong class="relatorios-resumo-valor">
            ${escaparHtml(
              item.tipo === "moeda"
                ? moeda(item.valor)
                : texto(item.valor)
            )}
          </strong>
        </div>
      `;
    }).join("");

    elementos.painelResultadoRelatorio
      .querySelector(".relatorios-resultado-corpo")
      .prepend(bloco);
  }

  function renderizarResultado(resultado) {
    const relatorio = obterRelatorioAtual();
    const registros = Array.isArray(resultado?.registros)
      ? resultado.registros
      : [];

    estado.resultadoAtual = resultado;

    elementos.painelResultadoRelatorio.hidden = false;

    elementos.botaoExportarPdf.disabled = !registros.length;
    elementos.botaoExportarExcel.disabled = !registros.length;
    elementos.botaoImprimirRelatorio.disabled = !registros.length;

    elementos.resumoResultadoRelatorio.textContent =
      registros.length === 1
        ? "1 registro encontrado."
        : `${registros.length} registros encontrados.`;

    renderizarResumoExecutivo(
      resultado?.resumo || [
        {
          rotulo: "Registros",
          valor: registros.length
        }
      ]
    );

    if (!registros.length) {
      elementos.cabecalhoTabelaRelatorio.innerHTML = "";
      elementos.corpoTabelaRelatorio.innerHTML = "";
      elementos.rodapeTabelaRelatorio.innerHTML = "";
      definirEstadoResultado("vazio");
      return;
    }

    elementos.cabecalhoTabelaRelatorio.innerHTML = `
      <tr>
        ${relatorio.colunas.map(function (coluna) {
          return `<th>${escaparHtml(coluna[1])}</th>`;
        }).join("")}
      </tr>
    `;

    elementos.corpoTabelaRelatorio.innerHTML = registros.map(function (registro) {
      return `
        <tr>
          ${relatorio.colunas.map(function (coluna) {
            const [chave, , tipo] = coluna;
            return `
              <td class="${tipo === "moeda" ? "valor" : ""}">
                ${escaparHtml(formatarCelula(registro[chave], tipo))}
              </td>
            `;
          }).join("")}
        </tr>
      `;
    }).join("");

    elementos.rodapeTabelaRelatorio.innerHTML = resultado?.rodapeHtml || "";

    definirEstadoResultado("tabela");

    elementos.painelResultadoRelatorio.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  async function gerarRelatorio(evento) {
    evento.preventDefault();

    const relatorio = obterRelatorioAtual();

    if (!relatorio) {
      return;
    }

    limparAviso();
    elementos.painelResultadoRelatorio.hidden = false;
    definirEstadoResultado("carregando");

    try {
      const resposta = await obterAuth().chamarApi({
        acao: ACAO_API_RELATORIO,
        tipo: relatorio.id,
        filtros: coletarFiltros()
      });

      if (resposta?.sucesso === false) {
        throw new Error(
          resposta.mensagem ||
          "Não foi possível gerar o relatório."
        );
      }

      renderizarResultado(
        resposta?.relatorio ||
        resposta?.resultado ||
        resposta
      );

    } catch (erro) {
      console.error("[RELATÓRIOS]", erro);

      definirEstadoResultado("vazio");

      mostrarAviso(
        erro?.message ||
        "Não foi possível gerar o relatório.",
        "erro"
      );
    }
  }

  function voltarCategorias() {
    estado.categoriaAtual = "";
    estado.grupoAtual = "";
    estado.relatorioAtual = "";
    estado.resultadoAtual = null;

    elementos.secaoCategoriasRelatorios.hidden = false;
    elementos.secaoRelatoriosCategoria.hidden = true;
    elementos.botaoVoltarCategorias.hidden = true;

    document.querySelectorAll("[data-categoria-relatorio]").forEach(function (card) {
      card.classList.remove("ativo");
    });

    limparAviso();
  }

  function limparFiltros() {
    elementos.formFiltrosRelatorio.reset();
    elementos.painelResultadoRelatorio.hidden = true;
    estado.resultadoAtual = null;
  }

  function imprimirRelatorio() {
    if (!estado.resultadoAtual) {
      return;
    }

    window.print();
  }

  function exportarAindaNaoDisponivel(formato) {
    mostrarAviso(
      `A exportação para ${formato} será conectada ao backend na próxima etapa.`,
      "aviso"
    );
  }

  async function carregarCongregacoes() {
    try {
      const resposta = await obterAuth().chamarApi({
        acao: "listarCongregacoes"
      });

      const lista = Array.isArray(resposta?.congregacoes)
        ? resposta.congregacoes
        : [];

      estado.congregacoes = lista
        .map(function (item) {
          return texto(
            item.nome ||
            item.NOME ||
            item.congregacao ||
            item.nomeCongregacao
          );
        })
        .filter(Boolean)
        .sort(function (a, b) {
          return a.localeCompare(b, "pt-BR");
        });

    } catch (erro) {
      console.warn(
        "[RELATÓRIOS] Congregações não carregadas:",
        erro
      );
    }
  }

  function configurarEventos() {
    document.addEventListener("click", function (evento) {
      const categoria = evento.target.closest(
        "[data-categoria-relatorio]"
      );

      if (categoria) {
        selecionarCategoria(
          categoria.dataset.categoriaRelatorio
        );
        return;
      }

      const grupo = evento.target.closest(
        "[data-grupo-relatorio]"
      );

      if (grupo) {
        selecionarGrupo(grupo.dataset.grupoRelatorio);
        return;
      }

      const relatorio = evento.target.closest(
        "[data-relatorio-id]"
      );

      if (relatorio) {
        selecionarRelatorio(relatorio.dataset.relatorioId);
        return;
      }

      const voltarGrupos = evento.target.closest(
        '[data-acao-relatorio="voltar-grupos"]'
      );

      if (voltarGrupos) {
        const categoriaAtual = obterCategoriaAtual();

        estado.grupoAtual = "";
        estado.relatorioAtual = "";

        elementos.categoriaRelatorioSelo.textContent = "Categoria";
        elementos.categoriaRelatorioTitulo.textContent =
          categoriaAtual.titulo;
        elementos.categoriaRelatorioDescricao.textContent =
          categoriaAtual.descricao;

        elementos.painelFiltrosRelatorio.hidden = true;
        elementos.painelResultadoRelatorio.hidden = true;

        renderizarGrupos(categoriaAtual);
      }
    });

    elementos.botaoVoltarCategorias.addEventListener(
      "click",
      voltarCategorias
    );

    elementos.formFiltrosRelatorio.addEventListener(
      "submit",
      gerarRelatorio
    );

    elementos.botaoLimparFiltrosRelatorio.addEventListener(
      "click",
      limparFiltros
    );

    elementos.botaoImprimirRelatorio.addEventListener(
      "click",
      imprimirRelatorio
    );

    elementos.botaoExportarPdf.addEventListener(
      "click",
      function () {
        exportarAindaNaoDisponivel("PDF");
      }
    );

    elementos.botaoExportarExcel.addEventListener(
      "click",
      function () {
        exportarAindaNaoDisponivel("Excel");
      }
    );
  }

  async function iniciar() {
    if (!capturarElementos()) {
      console.error(
        "[RELATÓRIOS] Estrutura HTML incompleta."
      );
      return;
    }

    elementos.botaoExportarPdf.disabled = true;
    elementos.botaoExportarExcel.disabled = true;
    elementos.botaoImprimirRelatorio.disabled = true;

    configurarEventos();
    await carregarCongregacoes();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      iniciar,
      { once: true }
    );
  } else {
    iniciar();
  }

})(window, document);
