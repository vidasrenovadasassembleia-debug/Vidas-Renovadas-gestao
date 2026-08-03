/**
 * VIDAS RENOVADAS GESTÃO 2.0
 * Arquivo: js/membro-historico.js
 * Descrição: Carregamento independente do Histórico Ministerial
 */

(function (window, document) {
  "use strict";
console.log("[HISTÓRICO] membro-historico.js carregado");
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

  function obterIdMembro() {
    return texto(
      new URLSearchParams(window.location.search).get("id")
    );
  }

  function obterContainer() {
    return document.getElementById("historicoMembro");
  }

  function obterApiAutenticada() {
    const formulario = window.VRGMembroFormulario;

    if (!formulario?.auth) {
      throw new Error(
        "O módulo de autenticação do histórico não está disponível."
      );
    }

    return formulario.auth();
  }

  function formatarData(valor) {
    if (!valor) {
      return "Data não informada";
    }

    const textoData = texto(valor);

    if (/^\d{2}\/\d{2}\/\d{4}/.test(textoData)) {
      return textoData;
    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
      return textoData;
    }

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(data);
  }

  function obterIcone(tipo) {
    const icones = {
      CADASTRO: "✦",
      ALTERACAO_CADASTRAL: "✎",
      MUDANCA_CARGO: "◆",
      MUDANCA_CONGREGACAO: "⌂",
      MUDANCA_SITUACAO: "●",
      BATISMO: "≈",
      CONSAGRACAO: "✦",
      CERTIFICADO: "◇",
      CARTEIRINHA: "▣",
      OCORRENCIA: "!",
      RETIFICACAO: "↺",
      DIZIMO: "R$"
    };

    return icones[texto(tipo).toUpperCase()] || "•";
  }

  function obterDadosEvento(evento) {
    if (
      evento?.dados &&
      typeof evento.dados === "object" &&
      !Array.isArray(evento.dados)
    ) {
      return evento.dados;
    }

    const dadosJson =
      evento?.dadosJson ??
      evento?.DADOS_JSON ??
      evento?.dadosJSON;

    if (
      dadosJson &&
      typeof dadosJson === "object" &&
      !Array.isArray(dadosJson)
    ) {
      return dadosJson;
    }

    if (typeof dadosJson === "string" && dadosJson.trim()) {
      try {
        return JSON.parse(dadosJson);
      } catch (erro) {
        console.warn(
          "[HISTÓRICO] Não foi possível interpretar DADOS_JSON.",
          erro
        );
      }
    }

    return {};
  }

  function valorSemInformacao(valor) {
  const resultado = texto(valor).toUpperCase();

  return (
    !resultado ||
    resultado === "NÃO INFORMADO" ||
    resultado === "NAO INFORMADO" ||
    resultado === "NULL" ||
    resultado === "UNDEFINED"
  );
}

function valoresIguais(anterior, novo) {
  return (
    texto(anterior).toLocaleLowerCase("pt-BR") ===
    texto(novo).toLocaleLowerCase("pt-BR")
  );
}

function formatarValorHistorico(valor) {
  const resultado = texto(valor);

  if (!resultado) {
    return "";
  }

  /*
   * Converte datas no formato AAAA-MM-DD para DD/MM/AAAA.
   * Não altera números, telefones ou textos comuns.
   */
  const dataSimples = resultado.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (dataSimples) {
    return (
      dataSimples[3] +
      "/" +
      dataSimples[2] +
      "/" +
      dataSimples[1]
    );
  }

  return resultado;
}

function obterPrioridadeCampo(alteracao) {
  const campo = texto(
    alteracao?.rotulo ||
    alteracao?.campo
  )
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  const prioridades = {
    "NOME": 1,
    "NOME COMPLETO": 1,

    "SITUACAO": 2,

    "CARGO": 3,

    "CONGREGACAO": 4,

    "DATA DE ADMISSAO": 5,

    "BATISMO": 6,
    "DATA DE BATISMO": 6,
    "BATISMO NAS AGUAS": 6,

    "CONSAGRACAO": 7,
    "DATA DE CONSAGRACAO": 7,

    "ESTADO CIVIL": 8,

    "CONJUGE": 9,

    "TELEFONE": 10,

    "WHATSAPP": 11,

    "E-MAIL": 12,
    "EMAIL": 12,

    "ENDERECO": 13,

    "OBSERVACOES": 14
  };

  return prioridades[campo] || 100;
}

  function montarComparacao(rotulo, anterior, novo) {
    return `
      <div class="historico-alteracao">
        <strong class="historico-alteracao-titulo">
          ${escaparHtml(rotulo || "Informação")}
        </strong>

        <div class="historico-comparacao">
          <div class="historico-valor historico-valor-anterior">
            <span>Antes</span>
            <strong>${escaparHtml(valorExibicao(anterior))}</strong>
          </div>

          <span class="historico-seta" aria-hidden="true">→</span>

          <div class="historico-valor historico-valor-novo">
            <span>Depois</span>
            <strong>${escaparHtml(valorExibicao(novo))}</strong>
          </div>
        </div>
      </div>
    `;
  }

  function montarDetalhes(evento) {
  const dados = obterDadosEvento(evento);

  if (
    Array.isArray(dados.alteracoes) &&
    dados.alteracoes.length
  ) {
    const alteracoesValidas = dados.alteracoes
      .filter(function (alteracao) {
        const anterior = alteracao?.anterior;
        const novo = alteracao?.novo;

        /*
         * A alteração só aparece quando:
         * 1. o valor anterior contém informação;
         * 2. o valor novo contém informação;
         * 3. os dois valores são realmente diferentes.
         */
        return (
          !valorSemInformacao(anterior) &&
          !valorSemInformacao(novo) &&
          !valoresIguais(anterior, novo)
        );
      })
      .sort(function (a, b) {
        return (
          obterPrioridadeCampo(a) -
          obterPrioridadeCampo(b)
        );
      });

    if (!alteracoesValidas.length) {
      return "";
    }

    return `
      <div class="historico-alteracoes">
        ${alteracoesValidas
          .map(function (alteracao) {
            return montarComparacao(
              alteracao.rotulo ||
                alteracao.campo ||
                "Informação",

              formatarValorHistorico(
                alteracao.anterior
              ),

              formatarValorHistorico(
                alteracao.novo
              )
            );
          })
          .join("")}
      </div>
    `;
  }

  if (
    Object.prototype.hasOwnProperty.call(
      dados,
      "anterior"
    ) ||
    Object.prototype.hasOwnProperty.call(
      dados,
      "novo"
    )
  ) {
    if (
      valorSemInformacao(dados.anterior) ||
      valorSemInformacao(dados.novo) ||
      valoresIguais(dados.anterior, dados.novo)
    ) {
      return "";
    }

    return `
      <div class="historico-alteracoes">
        ${montarComparacao(
          dados.rotulo ||
            dados.campo ||
            "Informação",

          formatarValorHistorico(
            dados.anterior
          ),

          formatarValorHistorico(
            dados.novo
          )
        )}
      </div>
    `;
  }

  return "";
}
            .join("")}
        </div>
      `;
    }

    if (
      Object.prototype.hasOwnProperty.call(dados, "anterior") ||
      Object.prototype.hasOwnProperty.call(dados, "novo")
    ) {
      return `
        <div class="historico-alteracoes">
          ${montarComparacao(
            dados.rotulo || dados.campo || "Informação",
            dados.anterior,
            dados.novo
          )}
        </div>
      `;
    }

    return "";
  }

  function criarEvento(evento) {
    const tipo = texto(evento?.tipo).toUpperCase();
    const titulo =
      texto(evento?.titulo) || "Evento registrado";
    const descricao = texto(evento?.descricao);

    const usuario =
      texto(
        evento?.usuarioNome ??
        evento?.usuario ??
        evento?.USUARIO_NOME
      ) || "Sistema";

    const origem =
      texto(evento?.origem).toUpperCase() || "SISTEMA";

    return `
      <article class="historico-evento">
        <div class="historico-marcador" aria-hidden="true">
          ${escaparHtml(obterIcone(tipo))}
        </div>

        <div class="historico-evento-conteudo">
          <div class="historico-evento-topo">
            <div>
              <span class="historico-evento-categoria">
                ${escaparHtml(
                  texto(evento?.categoria) || "Histórico"
                )}
              </span>

              <h4 class="historico-evento-titulo">
                ${escaparHtml(titulo)}
              </h4>
            </div>

            <time class="historico-evento-data">
              ${escaparHtml(
                formatarData(
                  evento?.dataHora ??
                  evento?.dataHoraIso ??
                  evento?.dataRegistro
                )
              )}
            </time>
          </div>

          ${
            descricao
              ? `
                <p class="historico-evento-descricao">
                  ${escaparHtml(descricao)}
                </p>
              `
              : ""
          }

          ${montarDetalhes(evento)}

          <div class="historico-evento-rodape">
            <span>
              Registrado por
              <strong>${escaparHtml(usuario)}</strong>
            </span>

            <span>
              ${
                origem === "MANUAL"
                  ? "Registro manual"
                  : "Registro automático"
              }
            </span>
          </div>
        </div>
      </article>
    `;
  }

  function obterTimestamp(evento) {
    const valor =
      evento?.dataHoraTimestamp ??
      evento?.dataHoraIso ??
      evento?.dataHora ??
      evento?.dataRegistro;

    const timestampNumerico = Number(valor);

    if (
      Number.isFinite(timestampNumerico) &&
      timestampNumerico > 0
    ) {
      return timestampNumerico;
    }

    const data = new Date(valor);

    return Number.isNaN(data.getTime())
      ? 0
      : data.getTime();
  }

  function renderizar(eventos) {
    const container = obterContainer();

    if (!container) {
      return;
    }

    if (!Array.isArray(eventos) || !eventos.length) {
      container.innerHTML = `
        <div class="historico-estado">
          <strong>Nenhum evento registrado.</strong>
          <p>
            O histórico ministerial deste membro ainda não
            possui registros.
          </p>
        </div>
      `;
      return;
    }

    const ordenados = eventos
      .slice()
      .sort(function (a, b) {
        return obterTimestamp(b) - obterTimestamp(a);
      });

    container.innerHTML = `
      <div class="historico-resumo">
        ${
          ordenados.length === 1
            ? "1 evento registrado"
            : `${ordenados.length} eventos registrados`
        }
      </div>

      <div class="historico-timeline">
        ${ordenados.map(criarEvento).join("")}
      </div>
    `;
  }

  async function carregar() {
    const container = obterContainer();
    const idMembro = obterIdMembro();

    if (!container || !idMembro) {
      return;
    }

    container.innerHTML = `
      <div class="historico-carregando">
        Carregando histórico...
      </div>
    `;

    try {
      const api = obterApiAutenticada();

      const resposta = await api.chamarApi({
        acao: "listarHistorico",
        idMembro: idMembro
      });

      if (resposta?.sucesso === false) {
        throw new Error(
          resposta.mensagem ||
            "Não foi possível carregar o histórico."
        );
      }

      const eventos = Array.isArray(resposta?.historico)
        ? resposta.historico
        : Array.isArray(resposta?.eventos)
          ? resposta.eventos
          : [];

      renderizar(eventos);
    } catch (erro) {
      console.error(
        "[HISTÓRICO] Falha ao carregar a linha do tempo:",
        erro
      );

      container.innerHTML = `
        <div class="historico-estado historico-estado-erro">
          <strong>
            Não foi possível carregar o histórico.
          </strong>

          <p>
            ${escaparHtml(
              erro?.message || "Tente atualizar a página."
            )}
          </p>
        </div>
      `;
    }
  }

  function iniciar() {
    /*
     * O histórico possui carregamento próprio e independente.
     * Um erro aqui não interfere no controlador da ficha.
     */
    window.setTimeout(carregar, 0);
  }

  window.VRGMembroHistorico = Object.freeze({
    carregar,
    renderizar
  });

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
