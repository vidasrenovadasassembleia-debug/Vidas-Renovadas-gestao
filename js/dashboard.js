/**
 * ============================================================================
 * VIDAS RENOVADAS GESTÃO 2.0
 * Arquivo: js/dashboard.js
 * Descrição: Comportamento e dados do Dashboard
 * ============================================================================
 */

(function (window, document) {
  "use strict";

  const App = window.VRG || window.App;
  const Auth = window.VRGAuth || window.Auth;

  const estado = {
    carregando: false,
    dados: null
  };

  function elemento(id) {
    return document.getElementById(id);
  }

  function definirTexto(id, valor, padrao = "—") {
    const alvo = elemento(id);

    if (!alvo) return;

    const texto =
      valor === null ||
      valor === undefined ||
      valor === ""
        ? padrao
        : String(valor);

    alvo.textContent = texto;
  }

  function atualizarRelogio() {
    const agora = new Date();

    const data = new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).format(agora);

    const hora = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    }).format(agora);

    definirTexto(
      "dataAtual",
      data.charAt(0).toUpperCase() + data.slice(1)
    );

    definirTexto("horaAtual", hora);
  }

  function atualizarSaudacao() {
    const hora = new Date().getHours();

    let saudacao = "Olá";

    if (hora >= 5 && hora < 12) {
      saudacao = "Bom dia";
    } else if (hora >= 12 && hora < 18) {
      saudacao = "Boa tarde";
    } else {
      saudacao = "Boa noite";
    }

    definirTexto("saudacaoPeriodo", saudacao);
  }

  function formatarInteiro(valor) {
    if (App?.formatarNumero) {
      return App.formatarNumero(Number(valor || 0), 0);
    }

    return new Intl.NumberFormat("pt-BR").format(Number(valor || 0));
  }

  function formatarMoeda(valor) {
    if (App?.formatarMoeda) {
      return App.formatarMoeda(Number(valor || 0));
    }

    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(Number(valor || 0));
  }

  function renderizarResumo(dados) {
    const membros = dados?.membros || {};
    const carteirinhas = dados?.carteirinhas || {};
    const certificados = dados?.certificados || {};
    const financeiro = dados?.financeiro || {};

    definirTexto(
      "totalMembrosAtivos",
      formatarInteiro(membros.ativos)
    );

    const totalMembros = Number(membros.total || 0);
    const ativos = Number(membros.ativos || 0);

    definirTexto(
      "detalheMembros",
      `${ativos} de ${totalMembros} membros cadastrados`
    );

    definirTexto(
      "carteirinhasVencendo",
      formatarInteiro(carteirinhas.vencendo)
    );

    definirTexto(
      "certificadosEmitidos",
      formatarInteiro(certificados.emitidosMes)
    );

    definirTexto(
      "entradasMes",
      formatarMoeda(financeiro.entradasMes)
    );

    definirTexto(
      "statusFinanceiro",
      financeiro.mesFechado
        ? "Mês fechado e bloqueado"
        : "Mês atual em aberto"
    );

    definirTexto(
      "totalDizimos",
      formatarMoeda(financeiro.dizimos)
    );

    definirTexto(
      "totalOfertas",
      formatarMoeda(financeiro.ofertas)
    );

    definirTexto(
      "totalSaidas",
      formatarMoeda(financeiro.saidas)
    );
  }

  function iniciais(nome) {
    if (App?.iniciais) {
      return App.iniciais(nome);
    }

    const partes = String(nome || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (!partes.length) return "VR";

    return (
      partes[0][0] +
      (partes.length > 1
        ? partes[partes.length - 1][0]
        : partes[0][1] || "")
    ).toUpperCase();
  }

  function escapar(valor) {
    if (App?.escapeHTML) {
      return App.escapeHTML(valor);
    }

    return String(valor ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderizarMembrosRecentes(membros) {
    const lista = elemento("membrosRecentes");

    if (!lista) return;

    const itens = Array.isArray(membros) ? membros : [];

    if (!itens.length) {
      lista.innerHTML = `
        <li class="estado-vazio">
          <div class="estado-vazio-icone" aria-hidden="true">♙</div>
          <p class="estado-vazio-titulo">Nenhum membro recente</p>
          <p class="estado-vazio-texto">
            Os novos cadastros aparecerão aqui.
          </p>
        </li>
      `;
      return;
    }

    lista.innerHTML = itens
      .slice(0, 5)
      .map((membro) => {
        const nome = membro.nome || "Membro";
        const codigo = membro.codigo || "";
        const congregacao = membro.congregacao || "";
        const dataCadastro =
          App?.formatarData?.(membro.dataCadastro) ||
          membro.dataCadastro ||
          "";

        const foto = membro.foto || membro.fotoUrl || "";

        const avatar = foto
          ? `<img src="${escapar(foto)}" alt="">`
          : escapar(iniciais(nome));

        return `
          <li class="lista-dashboard-item">
            <div class="lista-avatar">${avatar}</div>

            <div class="lista-conteudo">
              <p class="lista-titulo">${escapar(nome)}</p>
              <p class="lista-subtitulo">
                ${escapar(codigo)}
                ${codigo && congregacao ? " • " : ""}
                ${escapar(congregacao)}
              </p>
            </div>

            <span class="lista-data">${escapar(dataCadastro)}</span>
          </li>
        `;
      })
      .join("");
  }

  function classePendencia(tipo) {
    const valor = String(tipo || "").toLowerCase();

    if (valor === "erro" || valor === "urgente") {
      return "pendencia-erro";
    }

    if (valor === "info") {
      return "pendencia-info";
    }

    return "pendencia-alerta";
  }

  function iconePendencia(tipo) {
    const valor = String(tipo || "").toLowerCase();

    if (valor === "erro" || valor === "urgente") return "!";
    if (valor === "info") return "i";

    return "⚠";
  }

  function renderizarPendencias(pendencias) {
    const lista = elemento("listaPendencias");

    if (!lista) return;

    const itens = Array.isArray(pendencias) ? pendencias : [];

    if (!itens.length) {
      lista.innerHTML = `
        <div class="estado-vazio">
          <div class="estado-vazio-icone" aria-hidden="true">✓</div>
          <p class="estado-vazio-titulo">Tudo em ordem</p>
          <p class="estado-vazio-texto">
            Não há pendências importantes no momento.
          </p>
        </div>
      `;
      return;
    }

    lista.innerHTML = itens
      .slice(0, 5)
      .map((item) => `
        <div class="pendencia-item">
          <div
            class="pendencia-icone ${classePendencia(item.tipo)}"
            aria-hidden="true"
          >
            ${iconePendencia(item.tipo)}
          </div>

          <div class="pendencia-conteudo">
            <p class="pendencia-titulo">${escapar(item.titulo || "Pendência")}</p>
            <p class="pendencia-texto">${escapar(item.descricao || "")}</p>
          </div>
        </div>
      `)
      .join("");
  }

  function dadosDemonstracao() {
    return {
      membros: {
        total: 0,
        ativos: 0
      },
      carteirinhas: {
        vencendo: 0
      },
      certificados: {
        emitidosMes: 0
      },
      financeiro: {
        entradasMes: 0,
        dizimos: 0,
        ofertas: 0,
        saidas: 0,
        mesFechado: false
      },
      membrosRecentes: [],
      pendencias: []
    };
  }

  async function buscarDadosDashboard() {
    /*
     * A função "obterDashboard" será criada no backend Apps Script.
     * Enquanto ela ainda não existir, o Dashboard abre normalmente com zeros.
     */
    if (!Auth?.chamarApi) {
      return dadosDemonstracao();
    }

    try {
      const resposta = await Auth.chamarApi({
        acao: "obterDashboard"
      });

      return resposta.dados || resposta.dashboard || resposta;
    } catch (erro) {
      console.warn(
        "[DASHBOARD] Backend ainda não disponível ou sem dados:",
        erro
      );

      App?.info?.(
        "O painel está pronto. Os indicadores serão preenchidos após conectarmos o backend.",
        "Dashboard em preparação"
      );

      return dadosDemonstracao();
    }
  }

  async function carregarDashboard() {
    if (estado.carregando) return;

    estado.carregando = true;

    try {
      const dados = await buscarDadosDashboard();

      estado.dados = dados;

      renderizarResumo(dados);
      renderizarMembrosRecentes(dados.membrosRecentes);
      renderizarPendencias(dados.pendencias);
    } catch (erro) {
      console.error("[DASHBOARD] Erro ao carregar:", erro);

      App?.erro?.(
        erro.message || "Não foi possível carregar o Dashboard."
      );
    } finally {
      estado.carregando = false;
    }
  }

  function inicializar() {
    atualizarRelogio();
    atualizarSaudacao();
    carregarDashboard();

    window.setInterval(atualizarRelogio, 30000);
    window.setInterval(atualizarSaudacao, 60000);
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
