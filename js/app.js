const URL_API =
  "https://script.google.com/macros/s/AKfycbzwbSdAn5cyek9DrBy4SVGEZKI5odv6IW5ayjBLEfW1S1JL6dbTPGYqPU23nFM9rTrM/exec";

const CLIENT_ID_GOOGLE =
  "18655161530-n6p9th5quno3q41sp5pvbo4mj2eo5rnv.apps.googleusercontent.com";

const CHAVE_SESSAO =
  "vidasRenovadasSessao";

/* =========================================
   SESSÃO E AUTENTICAÇÃO
========================================= */

function salvarSessao(credential, usuario) {
  sessionStorage.setItem(
    CHAVE_SESSAO,
    JSON.stringify({
      credential: credential,
      usuario: usuario
    })
  );
}

function obterSessao() {
  const texto = sessionStorage.getItem(CHAVE_SESSAO);

  if (!texto) {
    return null;
  }

  try {
    return JSON.parse(texto);
  } catch (erro) {
    sessionStorage.removeItem(CHAVE_SESSAO);
    return null;
  }
}

function encerrarSessao() {
  sessionStorage.removeItem(CHAVE_SESSAO);

  if (
    window.google &&
    google.accounts &&
    google.accounts.id
  ) {
    google.accounts.id.disableAutoSelect();
  }

  window.location.href = "index.html";
}

function paginaAtual() {
  const caminho = window.location.pathname.split("/").pop();
  return caminho || "index.html";
}

function paginaProtegida() {
  const paginas = [
    "dashboard.html",
    "membros.html",
    "membro.html",
    "novo-membro.html",
    "editar-membro.html",
    "carteirinha.html"
  ];

  return paginas.includes(paginaAtual());
}

function exigirSessao() {
  if (!paginaProtegida()) {
    return;
  }

  const sessao = obterSessao();

  if (!sessao || !sessao.credential) {
    window.location.replace("index.html");
  }
}

function usuarioAdministrador() {
  const sessao = obterSessao();

  return Boolean(
    sessao &&
    sessao.usuario &&
    sessao.usuario.perfil === "administradora"
  );
}

function aplicarIdentidadeUsuario() {
  const sessao = obterSessao();

  if (!sessao || !sessao.usuario) {
    return;
  }

  document.querySelectorAll(".user-box").forEach(function (caixa) {
    caixa.textContent =
      sessao.usuario.nome ||
      sessao.usuario.email;
  });

  document.querySelectorAll("[data-nome-usuario]").forEach(function (elemento) {
    elemento.textContent =
      sessao.usuario.nome ||
      sessao.usuario.email;
  });

  document.querySelectorAll("[data-perfil-usuario]").forEach(function (elemento) {
    elemento.textContent = sessao.usuario.perfil;
  });
}

function aplicarPermissoesDaTela() {
  if (usuarioAdministrador()) {
    return;
  }

  document
    .querySelectorAll(
      '[href="novo-membro.html"], [href^="editar-membro.html"]'
    )
    .forEach(function (elemento) {
      elemento.hidden = true;
    });

  if (
    paginaAtual() === "novo-membro.html" ||
    paginaAtual() === "editar-membro.html"
  ) {
    alert(
      "Seu perfil não possui permissão para alterar cadastros."
    );

    window.location.replace("membros.html");
  }
}

function iniciarGoogleLogin() {
  const localBotao =
    document.getElementById("googleButton");

  if (!localBotao) {
    return;
  }

  if (
    !window.google ||
    !google.accounts ||
    !google.accounts.id
  ) {
    setTimeout(iniciarGoogleLogin, 300);
    return;
  }

  const sessao = obterSessao();

  if (sessao && sessao.credential) {
    window.location.replace("dashboard.html");
    return;
  }

  google.accounts.id.initialize({
    client_id: CLIENT_ID_GOOGLE,
    callback: tratarRespostaGoogle,
    auto_select: false,
    cancel_on_tap_outside: true
  });

  google.accounts.id.renderButton(
    localBotao,
    {
      theme: "outline",
      size: "large",
      type: "standard",
      shape: "rectangular",
      text: "signin_with",
      logo_alignment: "left",
      width: 320,
      locale: "pt-BR"
    }
  );
}

async function tratarRespostaGoogle(respostaGoogle) {
  const mensagem =
    document.getElementById("mensagemLogin");

  try {
    if (mensagem) {
      mensagem.textContent =
        "Verificando sua conta...";
    }

    const resultado = await chamarApi({
      acao: "autenticar",
      credential: respostaGoogle.credential
    }, false);

    salvarSessao(
      respostaGoogle.credential,
      resultado.usuario
    );

    if (mensagem) {
      mensagem.textContent =
        "Acesso autorizado. Abrindo o sistema...";
    }

    window.location.replace("dashboard.html");

  } catch (erro) {
    console.error("Erro de autenticação:", erro);

    sessionStorage.removeItem(CHAVE_SESSAO);

    if (mensagem) {
      mensagem.textContent = erro.message;
    }
  }
}

window.tratarRespostaGoogle = tratarRespostaGoogle;

/* =========================================
   COMUNICAÇÃO COM A API
========================================= */

async function chamarApi(
  conteudo,
  incluirCredencial = true
) {
  const requisicao = {
    ...conteudo
  };

  if (incluirCredencial) {
    const sessao = obterSessao();

    if (!sessao || !sessao.credential) {
      throw new Error(
        "Sua sessão terminou. Entre novamente."
      );
    }

    requisicao.credential = sessao.credential;
  }

  const resposta = await fetch(
    URL_API,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "text/plain;charset=utf-8"
      },
      body: JSON.stringify(requisicao),
      cache: "no-store"
    }
  );

  if (!resposta.ok) {
    throw new Error(
      "A API respondeu com o código " +
      resposta.status
    );
  }

  const resultado = await resposta.json();

  if (!resultado.sucesso) {
    const mensagem =
      resultado.mensagem ||
      "A operação não pôde ser concluída.";

    if (
      mensagem.toLowerCase().includes("sessão") ||
      mensagem.toLowerCase().includes("token")
    ) {
      sessionStorage.removeItem(CHAVE_SESSAO);
    }

    throw new Error(mensagem);
  }

  return resultado;
}

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

function obterIdDaUrl() {
  const parametros =
    new URLSearchParams(window.location.search);

  return parametros.get("id");
}

/* =========================================
   SAIR
========================================= */

document
  .querySelectorAll(".logout")
  .forEach(function (link) {
    link.addEventListener(
      "click",
      function (evento) {
        evento.preventDefault();
        encerrarSessao();
      }
    );
  });

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

      const dados =
        Object.fromEntries(
          new FormData(formularioNovoMembro).entries()
        );

      try {
        const resultado = await chamarApi({
          acao: "cadastrar",
          dados: dados
        });

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
    const resultado = await chamarApi({
      acao: "listar"
    });

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
          ${escaparHtml(erro.message)}
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

    const botaoEditar =
      usuarioAdministrador()
        ? `
          <a
            class="btn-acao btn-secundario"
            href="editar-membro.html?id=${encodeURIComponent(
              membro.id
            )}"
          >
            Editar
          </a>
        `
        : "";

    linha.innerHTML = `
      <td>${escaparHtml(membro.id)}</td>
      <td>${escaparHtml(membro.nome)}</td>
      <td>${escaparHtml(membro.cargo || "-")}</td>
      <td>${escaparHtml(membro.congregacao || "-")}</td>
      <td>${escaparHtml(membro.situacao || "Ativo")}</td>
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
          class="btn-acao"
          href="carteirinha.html?id=${encodeURIComponent(
            membro.id
          )}"
        >
          Carteirinha
        </a>

        ${botaoEditar}
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
    const resultado = await chamarApi({
      acao: "buscar",
      id: idMembro
    });

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
    document.getElementById("tituloMembro");

  if (titulo) {
    titulo.textContent =
      membro.nomeCompleto ||
      "Ficha do membro";
  }

  const botaoEditar =
    usuarioAdministrador()
      ? `
        <a
          class="primary-link"
          href="editar-membro.html?id=${encodeURIComponent(
            membro.id
          )}"
        >
          Editar cadastro
        </a>
      `
      : "";

  fichaMembro.innerHTML = `
    <section class="profile-card">
      <div>
        <span class="profile-label">ID</span>
        <strong>${escaparHtml(membro.id)}</strong>
      </div>

      <div>
        <span class="profile-label">Situação</span>
        <strong>${escaparHtml(membro.situacao || "-")}</strong>
      </div>

      <div>
        <span class="profile-label">Cargo</span>
        <strong>${escaparHtml(membro.cargo || "-")}</strong>
      </div>

      <div>
        <span class="profile-label">Congregação</span>
        <strong>${escaparHtml(membro.congregacao || "-")}</strong>
      </div>
    </section>

    <section class="form-section">
      <h2>Dados pessoais</h2>
      <div class="profile-grid">
        ${campoFicha("Nome completo", membro.nomeCompleto)}
        ${campoFicha("CPF", membro.cpf)}
        ${campoFicha("RG", membro.rg)}
        ${campoFicha("Data de nascimento", membro.dataNascimento)}
        ${campoFicha("Estado civil", membro.estadoCivil)}
        ${campoFicha("Cônjuge", membro.conjuge)}
        ${campoFicha("Pai", membro.pai)}
        ${campoFicha("Mãe", membro.mae)}
      </div>
    </section>

    <section class="form-section">
      <h2>Contato e endereço</h2>
      <div class="profile-grid">
        ${campoFicha("Telefone", membro.telefone)}
        ${campoFicha("WhatsApp", membro.whatsapp)}
        ${campoFicha("E-mail", membro.email)}
        ${campoFicha("CEP", membro.cep)}
        ${campoFicha("Endereço", membro.endereco)}
        ${campoFicha("Número", membro.numero)}
        ${campoFicha("Complemento", membro.complemento)}
        ${campoFicha("Bairro", membro.bairro)}
        ${campoFicha("Cidade", membro.cidade)}
        ${campoFicha("Estado", membro.estado)}
      </div>
    </section>

    <section class="form-section">
      <h2>Vida cristã</h2>
      <div class="profile-grid">
        ${campoFicha("Data da conversão", membro.dataConversao)}
        ${campoFicha("Data do batismo", membro.dataBatismo)}
        ${campoFicha("Cargo", membro.cargo)}
        ${campoFicha("Congregação", membro.congregacao)}
        ${campoFicha("Situação", membro.situacao)}
        ${campoFicha("Validade da carteirinha", membro.validadeCarteirinha)}
      </div>
    </section>

    <section class="form-section">
      <h2>Controle do cadastro</h2>
      <div class="profile-grid">
        ${campoFicha("Data de cadastro", membro.dataCadastro)}
        ${campoFicha("Última atualização", membro.ultimaAtualizacao)}
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
        href="carteirinha.html?id=${encodeURIComponent(
          membro.id
        )}"
      >
        Gerar carteirinha
      </a>

      ${botaoEditar}
    </div>
  `;
}

function campoFicha(rotulo, valor) {
  return `
    <div class="profile-field">
      <span>${escaparHtml(rotulo)}</span>
      <strong>${escaparHtml(valor || "-")}</strong>
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
  document.getElementById("formEditarMembro");

if (formularioEditarMembro) {
  carregarFormularioEdicao();
}

async function carregarFormularioEdicao() {
  const idMembro = obterIdDaUrl();

  const mensagemCarregamento =
    document.getElementById("mensagemCarregamento");

  if (!idMembro) {
    if (mensagemCarregamento) {
      mensagemCarregamento.textContent =
        "ID do membro não informado.";
    }

    return;
  }

  try {
    const resultado = await chamarApi({
      acao: "buscar",
      id: idMembro
    });

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
        formularioEditarMembro.elements[campo];

      if (elemento) {
        elemento.value = valor || "";
      }
    }
  );

  const titulo =
    document.getElementById("tituloEditarMembro");

  if (titulo) {
    titulo.textContent =
      "Editar " +
      (membro.nomeCompleto || "Membro");
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

    const dados =
      Object.fromEntries(
        new FormData(formularioEditarMembro).entries()
      );

    try {
      const resultado = await chamarApi({
        acao: "atualizar",
        dados: dados
      });

      alert(
        "Cadastro atualizado com sucesso!"
      );

      window.location.href =
        "membro.html?id=" +
        encodeURIComponent(resultado.id);

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


/* =========================================
   CARTEIRINHA DO MEMBRO
========================================= */

const areaCarteirinha =
  document.getElementById("areaCarteirinha");

const statusCarteirinha =
  document.getElementById("statusCarteirinha");

const botaoImprimirCarteirinha =
  document.getElementById("botaoImprimir");

const voltarFichaCarteirinha =
  document.getElementById("voltarFicha");

if (areaCarteirinha) {
  carregarCarteirinha();
}

botaoImprimirCarteirinha?.addEventListener(
  "click",
  function () {
    window.print();
  }
);

async function carregarCarteirinha() {
  const idMembro = obterIdDaUrl();

  if (!idMembro) {
    mostrarErroCarteirinha(
      "ID do membro não informado."
    );
    return;
  }

  if (voltarFichaCarteirinha) {
    voltarFichaCarteirinha.href =
      "membro.html?id=" +
      encodeURIComponent(idMembro);
  }

  try {
    const resultado = await chamarApi({
      acao: "buscar",
      id: idMembro
    });

    let membro = resultado.membro;

    if (typeof membro === "string") {
      membro = JSON.parse(membro);
    }

    preencherCarteirinha(membro);

    if (statusCarteirinha) {
      statusCarteirinha.hidden = true;
    }

    areaCarteirinha.hidden = false;

  } catch (erro) {
    console.error(
      "Erro ao carregar carteirinha:",
      erro
    );

    mostrarErroCarteirinha(
      erro.message
    );
  }
}

function preencherCarteirinha(membro) {
  definirTextoCarteirinha(
    "idLateral",
    membro.id || "—"
  );

  definirTextoCarteirinha(
    "nomeMembro",
    membro.nomeCompleto ||
    "Nome não informado"
  );

  definirTextoCarteirinha(
    "cargoMembro",
    membro.cargo || "Membro"
  );

  definirTextoCarteirinha(
    "congregacaoMembro",
    membro.congregacao || "Sede"
  );

  definirTextoCarteirinha(
    "situacaoMembro",
    "Situação: " +
    (membro.situacao || "Ativo")
  );

  definirTextoCarteirinha(
    "numeroCarteirinha",
    "Nº " +
    (
      membro.numeroCarteirinha ||
      membro.id ||
      "—"
    )
  );

  definirTextoCarteirinha(
    "validadeCarteirinha",
    formatarDataCarteirinha(
      membro.validadeCarteirinha
    ) || "Não informada"
  );

  preencherFotoCarteirinha(membro);
  aguardarQrCode(membro, 0);
}

function definirTextoCarteirinha(id, valor) {
  const elemento =
    document.getElementById(id);

  if (elemento) {
    elemento.textContent = valor;
  }
}

function preencherFotoCarteirinha(membro) {
  const foto =
    document.getElementById("fotoMembro");

  const placeholder =
    document.getElementById(
      "fotoPlaceholder"
    );

  const urlFoto =
    String(membro.foto || "").trim();

  if (urlFoto && foto) {
    foto.src = urlFoto;
    foto.hidden = false;

    if (placeholder) {
      placeholder.hidden = true;
    }

    foto.addEventListener(
      "error",
      function () {
        foto.hidden = true;

        if (placeholder) {
          placeholder.hidden = false;
          placeholder.textContent =
            obterIniciaisCarteirinha(
              membro.nomeCompleto
            );
        }
      },
      {
        once: true
      }
    );

    return;
  }

  if (placeholder) {
    placeholder.textContent =
      obterIniciaisCarteirinha(
        membro.nomeCompleto
      );
  }
}

function obterIniciaisCarteirinha(nome) {
  const partes = String(nome || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!partes.length) {
    return "VR";
  }

  if (partes.length === 1) {
    return partes[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    partes[0][0] +
    partes[partes.length - 1][0]
  ).toUpperCase();
}

function aguardarQrCode(membro, tentativa) {
  if (typeof QRCode !== "undefined") {
    gerarQrCodeCarteirinha(membro);
    return;
  }

  if (tentativa >= 20) {
    const areaQr =
      document.getElementById("qrCode");

    if (areaQr) {
      areaQr.textContent =
        membro.id || "QR";
    }

    return;
  }

  setTimeout(
    function () {
      aguardarQrCode(
        membro,
        tentativa + 1
      );
    },
    150
  );
}

function gerarQrCodeCarteirinha(membro) {
  const areaQr =
    document.getElementById("qrCode");

  if (!areaQr) {
    return;
  }

  const urlVerificacao =
    new URL(
      "membro.html",
      window.location.href
    );

  urlVerificacao.searchParams.set(
    "id",
    membro.id || ""
  );

  areaQr.innerHTML = "";

  new QRCode(areaQr, {
    text: urlVerificacao.toString(),
    width: 220,
    height: 220,
    correctLevel:
      QRCode.CorrectLevel.M
  });
}

function formatarDataCarteirinha(valor) {
  if (!valor) {
    return "";
  }

  const texto = String(valor);

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(texto)
  ) {
    const partes = texto.split("-");

    return (
      partes[2] +
      "/" +
      partes[1] +
      "/" +
      partes[0]
    );
  }

  return texto;
}

function mostrarErroCarteirinha(mensagem) {
  if (statusCarteirinha) {
    statusCarteirinha.hidden = false;
    statusCarteirinha.textContent =
      mensagem;
  }

  if (areaCarteirinha) {
    areaCarteirinha.hidden = true;
  }
}

/* =========================================
   INICIALIZAÇÃO
========================================= */

exigirSessao();

window.addEventListener(
  "load",
  function () {
    iniciarGoogleLogin();
    aplicarIdentidadeUsuario();
    aplicarPermissoesDaTela();
  }
);
