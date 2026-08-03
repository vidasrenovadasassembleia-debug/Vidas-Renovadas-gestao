/** Controlador: visualizar membro — mesma ficha, modo somente leitura */
(function (window, document) {
  "use strict";

  let M;
  let F;
  let id = "";

  async function carregarHistorico(idMembro) {
  const container =
    document.getElementById("historicoMembro");

  if (!container) {
    return;
  }

  container.innerHTML =
    '<div class="historico-carregando">' +
      "Carregando histórico..." +
    "</div>";

  try {
    const resposta = await M.auth().chamarApi({
      acao: "listarHistorico",
      idMembro: String(idMembro || "").trim()
    });

    if (resposta?.sucesso === false) {
      throw new Error(
        resposta.mensagem ||
          "Não foi possível carregar o histórico."
      );
    }

    const eventos = Array.isArray(resposta?.eventos)
      ? resposta.eventos
      : Array.isArray(resposta?.historico)
        ? resposta.historico
        : [];

    montarTimeline(eventos);
  } catch (erro) {
    console.error(
      "[HISTÓRICO] Não foi possível carregar:",
      erro
    );

    container.innerHTML = `
      <div class="historico-estado historico-estado-erro">
        <span
          class="historico-estado-icone"
          aria-hidden="true"
        >
          !
        </span>

        <div>
          <strong>
            Não foi possível carregar o histórico.
          </strong>

          <p>
            ${
              escaparHtml(
                erro?.message ||
                  "Tente atualizar a página."
              )
            }
          </p>
        </div>
      </div>
    `;
  }
}

function montarTimeline(eventos) {
  const container =
    document.getElementById("historicoMembro");

  if (!container) {
    return;
  }

  if (!Array.isArray(eventos) || eventos.length === 0) {
    container.innerHTML = `
      <div class="historico-estado">
        <span
          class="historico-estado-icone"
          aria-hidden="true"
        >
          ◷
        </span>

        <div>
          <strong>
            Nenhum evento registrado
          </strong>

          <p>
            O histórico ministerial deste membro ainda
            não possui registros.
          </p>
        </div>
      </div>
    `;

    return;
  }

  const eventosOrdenados = eventos
    .slice()
    .sort(function (a, b) {
      const dataA = obterTimestampEvento(a);
      const dataB = obterTimestampEvento(b);

      return dataB - dataA;
    });

  container.innerHTML = `
    <div
      class="historico-resumo"
      aria-live="polite"
    >
      <span>
        ${eventosOrdenados.length}
        ${
          eventosOrdenados.length === 1
            ? "evento registrado"
            : "eventos registrados"
        }
      </span>
    </div>

    <div class="historico-timeline">
      ${eventosOrdenados.map(criarEvento).join("")}
    </div>
  `;
}

function criarEvento(evento) {
  evento = evento || {};

  const tipo = String(evento.tipo || "")
    .trim()
    .toUpperCase();

  const categoria = String(
    evento.categoria || "ADMINISTRATIVA"
  )
    .trim()
    .toUpperCase();

  const configuracao = obterConfiguracaoEvento(tipo);

  const titulo =
    evento.titulo ||
    configuracao.titulo ||
    "Evento registrado";

  const descricao =
    evento.descricao || "";

  const usuario =
    evento.usuarioNome ||
    evento.usuario ||
    "Sistema";

  const origem = String(
    evento.origem || "SISTEMA"
  )
    .trim()
    .toUpperCase();

  const dados =
    evento.dados &&
    typeof evento.dados === "object"
      ? evento.dados
      : {};

  const detalhes = montarDetalhesEvento(
    tipo,
    dados
  );

  return `
    <article
      class="
        historico-evento
        historico-evento-${escaparClasse(tipo)}
      "
      data-tipo="${escaparHtml(tipo)}"
      data-categoria="${escaparHtml(categoria)}"
    >
      <div
        class="historico-marcador"
        aria-hidden="true"
      >
        <span>${configuracao.icone}</span>
      </div>

      <div class="historico-evento-conteudo">
        <div class="historico-evento-topo">
          <div>
            <span class="historico-evento-categoria">
              ${escaparHtml(
                configuracao.rotulo || categoria
              )}
            </span>

            <h4 class="historico-evento-titulo">
              ${escaparHtml(titulo)}
            </h4>
          </div>

          <time class="historico-evento-data">
            ${escaparHtml(formatarData(evento))}
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

        ${detalhes}

        <div class="historico-evento-rodape">
          <span>
            Registrado por
            <strong>${escaparHtml(usuario)}</strong>
          </span>

          <span class="historico-evento-origem">
            ${escaparHtml(
              origem === "MANUAL"
                ? "Registro manual"
                : "Registro automático"
            )}
          </span>
        </div>
      </div>
    </article>
  `;
}

function formatarData(evento) {
  evento = evento || {};

  const dataFormatada = String(
    evento.dataHora || ""
  ).trim();

  if (
    /^\d{2}\/\d{2}\/\d{4}/.test(
      dataFormatada
    )
  ) {
    return dataFormatada;
  }

  const valor =
    evento.dataHoraIso ||
    evento.dataHora ||
    evento.dataRegistro;

  if (!valor) {
    return "Data não informada";
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return String(valor);
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  ).format(data);
}

function montarDetalhesEvento(tipo, dados) {
  if (
    Array.isArray(dados.alteracoes) &&
    dados.alteracoes.length > 0
  ) {
    return `
      <div class="historico-alteracoes">
        ${dados.alteracoes
          .map(function (alteracao) {
            const rotulo =
              alteracao.rotulo ||
              alteracao.campo ||
              "Informação";

            return montarComparacao(
              rotulo,
              alteracao.anterior,
              alteracao.novo
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
    return `
      <div class="historico-alteracoes">
        ${montarComparacao(
          obterRotuloCampo(dados.campo),
          dados.anterior,
          dados.novo
        )}
      </div>
    `;
  }

  if (tipo === "CADASTRO") {
    const itens = [
      ["Nome", dados.nome],
      ["Congregação", dados.congregacao],
      ["Cargo", dados.cargo],
      ["Situação", dados.situacao],
      [
        "Carteirinha",
        dados.numeroCarteirinha
      ]
    ].filter(function (item) {
      return String(item[1] ?? "").trim();
    });

    if (!itens.length) {
      return "";
    }

    return `
      <dl class="historico-dados-cadastro">
        ${itens
          .map(function (item) {
            return `
              <div>
                <dt>${escaparHtml(item[0])}</dt>
                <dd>${escaparHtml(item[1])}</dd>
              </div>
            `;
          })
          .join("")}
      </dl>
    `;
  }

  return "";
}

function montarComparacao(
  rotulo,
  anterior,
  novo
) {
  return `
    <div class="historico-alteracao">
      <strong class="historico-alteracao-titulo">
        ${escaparHtml(rotulo || "Informação")}
      </strong>

      <div class="historico-comparacao">
        <div class="historico-valor historico-valor-anterior">
          <span>Antes</span>
          <strong>
            ${escaparHtml(valorExibicao(anterior))}
          </strong>
        </div>

        <span
          class="historico-seta"
          aria-hidden="true"
        >
          →
        </span>

        <div class="historico-valor historico-valor-novo">
          <span>Depois</span>
          <strong>
            ${escaparHtml(valorExibicao(novo))}
          </strong>
        </div>
      </div>
    </div>
  `;
}

function obterConfiguracaoEvento(tipo) {
  const configuracoes = {
    CADASTRO: {
      icone: "✦",
      rotulo: "Cadastro",
      titulo: "Cadastro ministerial criado"
    },

    ALTERACAO_CADASTRAL: {
      icone: "✎",
      rotulo: "Dados cadastrais",
      titulo: "Dados cadastrais atualizados"
    },

    MUDANCA_CARGO: {
      icone: "◆",
      rotulo: "Vida ministerial",
      titulo: "Cargo ministerial alterado"
    },

    MUDANCA_CONGREGACAO: {
      icone: "⌂",
      rotulo: "Congregação",
      titulo: "Congregação alterada"
    },

    MUDANCA_SITUACAO: {
      icone: "●",
      rotulo: "Situação",
      titulo: "Situação do membro alterada"
    },

    BATISMO: {
      icone: "≈",
      rotulo: "Batismo",
      titulo: "Batismo registrado"
    },

    CONSAGRACAO: {
      icone: "✦",
      rotulo: "Consagração",
      titulo: "Consagração registrada"
    },

    CERTIFICADO: {
      icone: "◇",
      rotulo: "Certificado",
      titulo: "Certificado emitido"
    },

    CARTEIRINHA: {
      icone: "▣",
      rotulo: "Carteirinha",
      titulo: "Carteirinha emitida"
    },

    OCORRENCIA: {
      icone: "!",
      rotulo: "Ocorrência",
      titulo: "Ocorrência registrada"
    },

    RETIFICACAO: {
      icone: "↺",
      rotulo: "Retificação",
      titulo: "Evento retificado"
    },

    DIZIMO: {
      icone: "R$",
      rotulo: "Dízimo",
      titulo: "Dízimo registrado"
    }
  };

  return configuracoes[tipo] || {
    icone: "•",
    rotulo: "Histórico",
    titulo: "Evento registrado"
  };
}

function obterRotuloCampo(campo) {
  const rotulos = {
    CARGO: "Cargo",
    CONGREGACAO: "Congregação",
    SITUACAO: "Situação",
    TELEFONE: "Telefone",
    WHATSAPP: "WhatsApp",
    EMAIL: "E-mail",
    ENDERECO: "Endereço",
    NOME_COMPLETO: "Nome completo"
  };

  const chave = String(campo || "")
    .trim()
    .toUpperCase();

  return rotulos[chave] || chave || "Informação";
}

function obterTimestampEvento(evento) {
  const timestamp = Number(
    evento?.dataHoraTimestamp
  );

  if (Number.isFinite(timestamp)) {
    return timestamp;
  }

  const valor =
    evento?.dataHoraIso ||
    evento?.dataHora ||
    evento?.dataRegistro;

  if (!valor) {
    return 0;
  }

  const data = new Date(valor);

  return Number.isNaN(data.getTime())
    ? 0
    : data.getTime();
}

function valorExibicao(valor) {
  const texto = String(valor ?? "").trim();

  return texto || "Não informado";
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escaparClasse(valor) {
  return String(valor || "padrao")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-");
}

  async function iniciar() {
    M = window.VRGMembroFormulario;
    F = document.getElementById("formVisualizarMembro");
    id = M?.idUrl();

    if (!M || !F || !id) {
      M?.aviso(
        "Não foi informado qual membro deve ser visualizado.",
        "erro"
      );
      return;
    }

    const editar = document.getElementById("botaoEditarMembro");

    if (editar) {
      editar.href =
        "editar-membro.html?id=" +
        encodeURIComponent(id);
    }

    M.somenteLeitura(F, true);
    M.carregando(true, "Carregando ficha...");

    try {
      const d = await M.buscar(id);

      M.preencher(F, d);
      F.elements.ID.value = id;
      M.somenteLeitura(F, true);

      const s = document.getElementById("statusFoto");

      if (s) {
        s.hidden = true;
      }

      await carregarHistorico(id);

      M.aviso(
        "Ficha carregada com sucesso.",
        "sucesso"
      );
    } catch (e) {
      M.aviso(
        e.message ||
          "Não foi possível carregar a ficha.",
        "erro"
      );
    } finally {
      M.carregando(false);
    }
  }

  document.readyState === "loading"
    ? document.addEventListener(
        "DOMContentLoaded",
        iniciar,
        { once: true }
      )
    : iniciar();

})(window, document);
