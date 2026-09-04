(function () {
  "use strict";

  let kids = [];
  let congregacoes = [];

  document.addEventListener("DOMContentLoaded", iniciarKids);

  async function iniciarKids() {
    try {
      configurarEventos();

      await Promise.all([
        carregarKids(),
        carregarCongregacoes()
      ]);

      preencherFiltroCongregacoes();
      aplicarFiltros();

    } catch (erro) {
      console.error("Erro ao iniciar módulo Kids:", erro);
      mostrarErro(
        erro?.message ||
        "Não foi possível carregar o módulo Kids."
      );
    }
  }


  function configurarEventos() {
    const pesquisa = document.getElementById("pesquisaKid");
    const situacao = document.getElementById("filtroSituacaoKids");
    const congregacao = document.getElementById("filtroCongregacaoKids");

    pesquisa?.addEventListener("input", aplicarFiltros);
    situacao?.addEventListener("change", aplicarFiltros);
    congregacao?.addEventListener("change", aplicarFiltros);
  }


  async function carregarKids() {
    const resposta = await chamarApi({
      acao: "listarKids",
      filtros: {}
    });

    if (!resposta || resposta.sucesso === false) {
      throw new Error(
        resposta?.mensagem ||
        "Não foi possível carregar as crianças."
      );
    }

    kids = normalizarLista(
      resposta.dados ||
      resposta.kids ||
      resposta
    );
  }


  async function carregarCongregacoes() {
    try {
      const resposta = await chamarApi({
        acao: "listarCongregacoes",
        filtros: {}
      });

      if (!resposta || resposta.sucesso === false) {
        congregacoes = [];
        return;
      }

      congregacoes = normalizarLista(
        resposta.dados ||
        resposta.congregacoes ||
        resposta
      );

    } catch (erro) {
      console.warn(
        "Não foi possível carregar congregações:",
        erro
      );

      congregacoes = [];
    }
  }


  function normalizarLista(valor) {
    if (Array.isArray(valor)) {
      return valor;
    }

    if (Array.isArray(valor?.itens)) {
      return valor.itens;
    }

    if (Array.isArray(valor?.dados)) {
      return valor.dados;
    }

    return [];
  }


  function preencherFiltroCongregacoes() {
    const select =
      document.getElementById("filtroCongregacaoKids");

    if (!select) return;

    const nomes = new Set();

    congregacoes.forEach((item) => {
      const nome =
        item.nome ||
        item.NOME ||
        item.nomeCongregacao ||
        item.CONGREGACAO ||
        "";

      if (nome) {
        nomes.add(String(nome).trim());
      }
    });

    kids.forEach((kid) => {
      const nome = kid.congregacao || "";

      if (nome) {
        nomes.add(String(nome).trim());
      }
    });

    [...nomes]
      .filter(Boolean)
      .sort((a, b) =>
        a.localeCompare(b, "pt-BR")
      )
      .forEach((nome) => {
        const option = document.createElement("option");
        option.value = nome;
        option.textContent = nome;
        select.appendChild(option);
      });
  }


  function aplicarFiltros() {
    const termo = normalizarTexto(
      document.getElementById("pesquisaKid")?.value
    );

    const situacao =
      document.getElementById("filtroSituacaoKids")?.value || "";

    const congregacao =
      document.getElementById("filtroCongregacaoKids")?.value || "";

    const filtrados = kids.filter((kid) => {
      const textoBusca = normalizarTexto([
        kid.codigo,
        kid.nomeCompleto,
        kid.responsavelPrincipal,
        kid.mae,
        kid.pai
      ].join(" "));

      const correspondePesquisa =
        !termo || textoBusca.includes(termo);

      const correspondeSituacao =
        !situacao ||
        String(kid.situacao || "") === situacao;

      const correspondeCongregacao =
        !congregacao ||
        String(kid.congregacao || "") === congregacao;

      return (
        correspondePesquisa &&
        correspondeSituacao &&
        correspondeCongregacao
      );
    });

    renderizarKids(filtrados);
  }


  function renderizarKids(lista) {
    const tbody = document.getElementById("listaKids");

    if (!tbody) return;

    if (!lista.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-state">
            Nenhuma criança encontrada.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = lista
      .map((kid) => {
        const codigo =
          kid.codigo || "";

        const nome =
          kid.nomeCompleto || "—";

        const idade =
          calcularIdade(kid.dataNascimento);

        const responsavel =
          kid.responsavelPrincipal ||
          kid.mae ||
          kid.pai ||
          "—";

        const congregacao =
          kid.congregacao || "—";

        const situacao =
          kid.situacao || "Ativo";

        return `
          <tr>

            <td>
              <strong>${escaparHtml(codigo)}</strong>
            </td>

            <td>
              <strong>${escaparHtml(nome)}</strong>
            </td>

            <td>
              ${escaparHtml(idade)}
            </td>

            <td title="${escaparHtml(responsavel)}">
              ${escaparHtml(responsavel)}
            </td>

            <td title="${escaparHtml(congregacao)}">
              ${escaparHtml(congregacao)}
            </td>

            <td>
              ${criarBadgeSituacao(situacao)}
            </td>

            <td>

              <div class="acoes-tabela">

                <a
                  class="btn-acao btn-visualizar"
                  href="visualizar-kid.html?id=${encodeURIComponent(codigo)}"
                  title="Visualizar criança"
                >
                  Visualizar
                </a>

                <a
                  class="btn-acao btn-editar"
                  href="editar-kid.html?id=${encodeURIComponent(codigo)}"
                  title="Editar criança"
                >
                  Editar
                </a>

                <a
                  class="btn-acao btn-cracha"
                  href="cracha-kids.html?id=${encodeURIComponent(codigo)}"
                  title="Crachá Kids"
                >
                  Crachá
                </a>

                ${
  normalizarTexto(situacao) === "convertido"
    ? ""
    : `
      <button
        type="button"
        class="btn-acao btn-converter"
        data-acao="converter"
        data-id="${escaparHtml(codigo)}"
        title="Tornar membro"
      >
        Tornar membro
      </button>
    `
}

              </div>

            </td>

          </tr>
        `;
      })
      .join("");

    configurarBotoesConverter();
  }


 function configurarBotoesConverter() {
  document
    .querySelectorAll('[data-acao="converter"]')
    .forEach((botao) => {

      botao.addEventListener(
        "click",
        () => {

          const codigo =
            String(
              botao.dataset.id || ""
            ).trim();

          if (!codigo) {
            return;
          }

          window.location.href =
            "novo-membro.html?origem=kids&id=" +
            encodeURIComponent(codigo);

        }
      );

    });
}


  function criarBadgeSituacao(situacao) {
    const texto =
      String(situacao || "Ativo").trim();

    const classe = normalizarTexto(texto)
      .replace(/\s+/g, "-");

    return `
      <span
        class="badge-situacao badge-situacao-${classe}"
      >
        <span class="badge-status-dot"></span>
        ${escaparHtml(texto)}
      </span>
    `;
  }


  function calcularIdade(dataNascimento) {
    if (!dataNascimento) return "—";

    const data = interpretarData(dataNascimento);

    if (!data) return "—";

    const hoje = new Date();

    let idade =
      hoje.getFullYear() -
      data.getFullYear();

    const mes =
      hoje.getMonth() -
      data.getMonth();

    if (
      mes < 0 ||
      (
        mes === 0 &&
        hoje.getDate() < data.getDate()
      )
    ) {
      idade--;
    }

    if (idade < 0 || idade > 120) {
      return "—";
    }

    return `${idade} anos`;
  }


  function interpretarData(valor) {
    if (!valor) return null;

    if (valor instanceof Date) {
      return isNaN(valor.getTime())
        ? null
        : valor;
    }

    const texto = String(valor).trim();

    const iso =
      texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (iso) {
      const ano = Number(iso[1]);
      const mes = Number(iso[2]) - 1;
      const dia = Number(iso[3]);

      const data = new Date(
        ano,
        mes,
        dia
      );

      return isNaN(data.getTime())
        ? null
        : data;
    }

    const brasileiro =
      texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (brasileiro) {
      const dia = Number(brasileiro[1]);
      const mes = Number(brasileiro[2]) - 1;
      const ano = Number(brasileiro[3]);

      const data = new Date(
        ano,
        mes,
        dia
      );

      return isNaN(data.getTime())
        ? null
        : data;
    }

    const data = new Date(texto);

    return isNaN(data.getTime())
      ? null
      : data;
  }


  function normalizarTexto(valor) {
    return String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }


  function escaparHtml(valor) {
    return String(valor ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  function mostrarErro(mensagem) {
    const tbody =
      document.getElementById("listaKids");

    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          ${escaparHtml(mensagem)}
        </td>
      </tr>
    `;
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


async function chamarApi(payload) {
  return obterAuth().chamarApi(payload);
}
})();
