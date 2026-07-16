const URL_API =
  "https://script.google.com/macros/s/AKfycbzwbSdAn5cyek9DrBy4SVGEZKI5odv6IW5ayjBLEfW1S1JL6dbTPGYqPU23nFM9rTrM/exec";

/* =========================================
   UTILITÁRIOS
========================================= */

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function obterJson(url, opcoes = {}) {
  const resposta = await fetch(url, {
    cache: "no-store",
    ...opcoes
  });

  if (!resposta.ok) {
    throw new Error(
      "A API respondeu com o código " +
      resposta.status
    );
  }

  const resultado = await resposta.json();

  if (!resultado.sucesso) {
    throw new Error(
      resultado.mensagem ||
      "A operação não pôde ser concluída."
    );
  }

  return resultado;
}

function obterIdDaUrl() {
  const parametros = new URLSearchParams(
    window.location.search
  );

  return parametros.get("id");
}

/* =========================================
   LOGIN PROVISÓRIO
========================================= */

const botaoAcessar =
  document.getElementById("botaoAcessar");

if (botaoAcessar) {
  botaoAcessar.addEventListener(
    "click",
    function () {
      window.location.href = "dashboard.html";
    }
  );
}

/* =========================================
   NOVO MEMBRO
========================================= */

const formularioNovoMembro =
  document.getElementById("formNovoMembro");

if (formularioNovoMembro) {
  formularioNovoMembro.addEventListener(
    "submit",
    async function (evento) {
      evento.preventDefault();

      const botaoSalvar =
        formularioNovoMembro.querySelector(
          'button[type="submit"]'
        );

      const textoOriginal =
        botaoSalvar.textContent;

      botaoSalvar.disabled = true;
      botaoSalvar.textContent = "Salvando...";

      const dados = Object.fromEntries(
        new FormData(
          formularioNovoMembro
        ).entries()
      );

      try {
        const resultado = await obterJson(
          URL_API,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "text/plain;charset=utf-8"
            },
            body: JSON.stringify(dados)
          }
        );

        alert(
          "Membro cadastrado com sucesso!\nID: " +
          resultado.id
        );

        formularioNovoMembro.reset();

        const cidade =
          document.getElementById("cidade");

        const estado =
          document.getElementById("estado");

        if (cidade) {
          cidade.value = "Duque de Caxias";
        }

        if (estado) {
          estado.value = "RJ";
        }

      } catch (erro) {
        console.error(
          "Erro ao salvar membro:",
          erro
        );

        alert(
          "Não foi possível salvar o membro.\n\n" +
          erro.message
        );

      } finally {
        botaoSalvar.disabled = false;
        botaoSalvar.textContent =
          textoOriginal;
      }
    }
  );
}

/* =========================================
   LISTAGEM DE MEMBROS
========================================= */

const tabelaMembros =
  document.getElementById("listaMembros");

let membrosCarregados = [];

if (tabelaMembros) {
  carregarMembros();
}

async function carregarMembros() {
  tabelaMembros.innerHTML = `
    <tr>
      <td colspan="6" class="empty-state">
        Carregando membros...
      </td>
    </tr>
  `;

  try {
    const resultado = await obterJson(
      URL_API +
      "?acao=listar&t=" +
      Date.now()
    );

    let membros = resultado.membros;

    if (typeof membros === "string") {
      membros = JSON.parse(membros);
    }

    if (!Array.isArray(membros)) {
      throw new Error(
        "A lista de membros possui formato inválido."
      );
    }

    membrosCarregados = membros;

    mostrarMembros(membrosCarregados);

  } catch (erro) {
    console.error(
      "Erro ao listar membros:",
      erro
    );

    tabelaMembros.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          Erro ao carregar os membros.
        </td>
      </tr>
    `;
  }
}

function mostrarMembros(membros) {
  tabelaMembros.innerHTML = "";

  if (!membros.length) {
    tabelaMembros.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          Nenhum membro cadastrado.
        </td>
      </tr>
    `;

    return;
  }

  membros.forEach(function (membro) {
    const linha =
      document.createElement("tr");

    linha.innerHTML = `
      <td>${escaparHtml(membro.id)}</td>

      <td>${escaparHtml(membro.nome)}</td>

      <td>
        ${escaparHtml(membro.cargo || "-")}
      </td>

      <td>
        ${escaparHtml(
          membro.congregacao || "-"
        )}
      </td>

      <td>
        ${escaparHtml(
          membro.situacao || "Ativo"
        )}
      </td>

      <td class="acoes-tabela">
        <a
          class="btn-acao"
          href="membro.html?id=${encodeURIComponent(
            membro.id
          )}"
        >
          Visualizar
        </a>

        <a
          class="btn-acao btn-secundario"
          href="editar-membro.html?id=${encodeURIComponent(
            membro.id
          )}"
        >
          Editar
        </a>
      </td>
    `;

    tabelaMembros.appendChild(linha);
  });
}

/* =========================================
   PESQUISA E FILTRO
========================================= */

const pesquisaMembro =
  document.getElementById("pesquisaMembro");

const filtroSituacao =
  document.getElementById("filtroSituacao");

if (pesquisaMembro) {
  pesquisaMembro.addEventListener(
    "input",
    aplicarFiltros
  );
}

if (filtroSituacao) {
  filtroSituacao.addEventListener(
    "change",
    aplicarFiltros
  );
}

function aplicarFiltros() {
  const texto = String(
    pesquisaMembro?.value || ""
  )
    .trim()
    .toLowerCase();

  const situacao = String(
    filtroSituacao?.value || ""
  );

  const filtrados =
    membrosCarregados.filter(
      function (membro) {
        const correspondeTexto =
          !texto ||
          String(membro.id || "")
            .toLowerCase()
            .includes(texto) ||
          String(membro.nome || "")
            .toLowerCase()
            .includes(texto) ||
          String(membro.cargo || "")
            .toLowerCase()
            .includes(texto) ||
          String(membro.congregacao || "")
            .toLowerCase()
            .includes(texto);

        const correspondeSituacao =
          !situacao ||
          membro.situacao === situacao;

        return (
          correspondeTexto &&
          correspondeSituacao
        );
      }
    );

  mostrarMembros(filtrados);
}

/* =========================================
   FICHA DO MEMBRO
========================================= */

const fichaMembro =
  document.getElementById("fichaMembro");

if (fichaMembro) {
  carregarFichaMembro();
}

async function carregarFichaMembro() {
  const idMembro = obterIdDaUrl();

  if (!idMembro) {
    mostrarErroFicha(
      "ID do membro não informado."
    );

    return;
  }

  try {
    const resultado = await obterJson(
      URL_API +
      "?acao=buscar&id=" +
      encodeURIComponent(idMembro) +
      "&t=" +
      Date.now()
    );

    let membro = resultado.membro;

    if (typeof membro === "string") {
      membro = JSON.parse(membro);
    }

    mostrarFichaMembro(membro);

  } catch (erro) {
    console.error(
      "Erro ao carregar ficha:",
      erro
    );

    mostrarErroFicha(erro.message);
  }
}

function mostrarFichaMembro(membro) {
  const titulo =
    document.getElementById(
      "tituloMembro"
    );

  if (titulo) {
    titulo.textContent =
      membro.nomeCompleto ||
      "Ficha do membro";
  }

  fichaMembro.innerHTML = `
    <section class="profile-card">
      <div>
        <span class="profile-label">ID</span>
        <strong>
          ${escaparHtml(membro.id)}
        </strong>
      </div>

      <div>
        <span class="profile-label">
          Situação
        </span>
        <strong>
          ${escaparHtml(
            membro.situacao || "-"
          )}
        </strong>
      </div>

      <div>
        <span class="profile-label">
          Cargo
        </span>
        <strong>
          ${escaparHtml(
            membro.cargo || "-"
          )}
        </strong>
      </div>

      <div>
        <span class="profile-label">
          Congregação
        </span>
        <strong>
          ${escaparHtml(
            membro.congregacao || "-"
          )}
        </strong>
      </div>
    </section>

    <section class="form-section">
      <h2>Dados pessoais</h2>

      <div class="profile-grid">
        ${campoFicha(
          "Nome completo",
          membro.nomeCompleto
        )}

        ${campoFicha(
          "CPF",
          membro.cpf
        )}

        ${campoFicha(
          "RG",
          membro.rg
        )}

        ${campoFicha(
          "Data de nascimento",
          membro.dataNascimento
        )}

        ${campoFicha(
          "Estado civil",
          membro.estadoCivil
        )}

        ${campoFicha(
          "Cônjuge",
          membro.conjuge
        )}

        ${campoFicha(
          "Pai",
          membro.pai
        )}

        ${campoFicha(
          "Mãe",
          membro.mae
        )}
      </div>
    </section>

    <section class="form-section">
      <h2>Contato e endereço</h2>

      <div class="profile-grid">
        ${campoFicha(
          "Telefone",
          membro.telefone
        )}

        ${campoFicha(
          "WhatsApp",
          membro.whatsapp
        )}

        ${campoFicha(
          "E-mail",
          membro.email
        )}

        ${campoFicha(
          "CEP",
          membro.cep
        )}

        ${campoFicha(
          "Endereço",
          membro.endereco
        )}

        ${campoFicha(
          "Número",
          membro.numero
        )}

        ${campoFicha(
          "Complemento",
          membro.complemento
        )}

        ${campoFicha(
          "Bairro",
          membro.bairro
        )}

        ${campoFicha(
          "Cidade",
          membro.cidade
        )}

        ${campoFicha(
          "Estado",
          membro.estado
        )}
      </div>
    </section>

    <section class="form-section">
      <h2>Vida cristã</h2>

      <div class="profile-grid">
        ${campoFicha(
          "Data da conversão",
          membro.dataConversao
        )}

        ${campoFicha(
          "Data do batismo",
          membro.dataBatismo
        )}

        ${campoFicha(
          "Cargo",
          membro.cargo
        )}

        ${campoFicha(
          "Congregação",
          membro.congregacao
        )}

        ${campoFicha(
          "Situação",
          membro.situacao
        )}

        ${campoFicha(
          "Validade da carteirinha",
          membro.validadeCarteirinha
        )}
      </div>
    </section>

    <section class="form-section">
      <h2>Controle do cadastro</h2>

      <div class="profile-grid">
        ${campoFicha(
          "Data de cadastro",
          membro.dataCadastro
        )}

        ${campoFicha(
          "Última atualização",
          membro.ultimaAtualizacao
        )}
      </div>
    </section>

    <div class="form-actions">
      <a
        class="secondary-link"
        href="membros.html"
      >
        Voltar
      </a>

      <a
        class="primary-link"
        href="editar-membro.html?id=${encodeURIComponent(
          membro.id
        )}"
      >
        Editar cadastro
      </a>
    </div>
  `;
}

function campoFicha(rotulo, valor) {
  return `
    <div class="profile-field">
      <span>
        ${escaparHtml(rotulo)}
      </span>

      <strong>
        ${escaparHtml(valor || "-")}
      </strong>
    </div>
  `;
}

function mostrarErroFicha(mensagem) {
  fichaMembro.innerHTML = `
    <p class="empty-state">
      ${escaparHtml(mensagem)}
    </p>
  `;
}

/* =========================================
   EDIÇÃO DE MEMBRO
========================================= */

const formularioEditarMembro =
  document.getElementById(
    "formEditarMembro"
  );

if (formularioEditarMembro) {
  carregarFormularioEdicao();
}

async function carregarFormularioEdicao() {
  const idMembro = obterIdDaUrl();

  const mensagemCarregamento =
    document.getElementById(
      "mensagemCarregamento"
    );

  if (!idMembro) {
    if (mensagemCarregamento) {
      mensagemCarregamento.textContent =
        "ID do membro não informado.";
    }

    return;
  }

  try {
    const resultado = await obterJson(
      URL_API +
      "?acao=buscar&id=" +
      encodeURIComponent(idMembro) +
      "&t=" +
      Date.now()
    );

    let membro = resultado.membro;

    if (typeof membro === "string") {
      membro = JSON.parse(membro);
    }

    preencherFormularioEdicao(membro);

    if (mensagemCarregamento) {
      mensagemCarregamento.hidden = true;
    }

    formularioEditarMembro.hidden = false;

  } catch (erro) {
    console.error(
      "Erro ao carregar edição:",
      erro
    );

    if (mensagemCarregamento) {
      mensagemCarregamento.textContent =
        erro.message;
    }
  }
}

function preencherFormularioEdicao(membro) {
  Object.entries(membro).forEach(
    function ([campo, valor]) {
      const elemento =
        formularioEditarMembro.elements[
          campo
        ];

      if (elemento) {
        elemento.value = valor || "";
      }
    }
  );

  const titulo =
    document.getElementById(
      "tituloEditarMembro"
    );

  if (titulo) {
    titulo.textContent =
      "Editar " +
      (membro.nomeCompleto ||
        "Membro");
  }
}

formularioEditarMembro?.addEventListener(
  "submit",
  async function (evento) {
    evento.preventDefault();

    const botaoSalvar =
      formularioEditarMembro.querySelector(
        'button[type="submit"]'
      );

    const textoOriginal =
      botaoSalvar.textContent;

    botaoSalvar.disabled = true;
    botaoSalvar.textContent =
      "Salvando alterações...";

    const dados = Object.fromEntries(
      new FormData(
        formularioEditarMembro
      ).entries()
    );

    try {
      const resultado = await obterJson(
        URL_API,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "text/plain;charset=utf-8"
          },
          body: JSON.stringify(dados)
        }
      );

      alert(
        "Cadastro atualizado com sucesso!"
      );

      window.location.href =
        "membro.html?id=" +
        encodeURIComponent(
          resultado.id
        );

    } catch (erro) {
      console.error(
        "Erro ao atualizar membro:",
        erro
      );

      alert(
        "Não foi possível atualizar o cadastro.\n\n" +
        erro.message
      );

    } finally {
      botaoSalvar.disabled = false;
      botaoSalvar.textContent =
        textoOriginal;
    }
  }
);
