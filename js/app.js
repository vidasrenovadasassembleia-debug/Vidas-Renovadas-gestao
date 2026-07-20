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
    "carteirinha.html",
    "configuracoes.html"
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
      '[href="novo-membro.html"], [href^="editar-membro.html"], [href="configuracoes.html"]'
    )
    .forEach(function (elemento) {
      elemento.hidden = true;
    });

  if (
    paginaAtual() === "novo-membro.html" ||
    paginaAtual() === "editar-membro.html" ||
    paginaAtual() === "configuracoes.html"
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

function obterIniciaisCarteirinha(nome) {
  const partes = String(nome || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!partes.length) {
    return "VR";
  }

  const primeiraInicial = partes[0].charAt(0);

  const segundaInicial =
    partes.length > 1
      ? partes[partes.length - 1].charAt(0)
      : partes[0].charAt(1);

  return (
    primeiraInicial +
    (segundaInicial || "")
  ).toUpperCase();
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
   FOTO DO MEMBRO
========================================= */

const TIPOS_FOTO_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp"
];

const TAMANHO_MAXIMO_FOTO = 4 * 1024 * 1024;
const FOTO_PLACEHOLDER =
  "https://placehold.co/220x280?text=Sem+Foto";

function obterCampoArquivoFoto(formulario) {
  return formulario?.querySelector(
    '#fotoMembro, #fotoArquivo'
  );
}

function obterArquivoFoto(formulario) {
  return obterCampoArquivoFoto(formulario)?.files?.[0] || null;
}

function validarArquivoFoto(arquivo) {
  if (!arquivo) {
    return;
  }

  if (!TIPOS_FOTO_PERMITIDOS.includes(arquivo.type)) {
    throw new Error(
      "A foto deve estar no formato JPG, PNG ou WebP."
    );
  }

  if (arquivo.size > TAMANHO_MAXIMO_FOTO) {
    throw new Error("A foto deve ter no máximo 4 MB.");
  }
}

function lerArquivoComoDataUrl(arquivo) {
  return new Promise(function (resolve, reject) {
    const leitor = new FileReader();

    leitor.onload = function () {
      resolve(String(leitor.result || ""));
    };

    leitor.onerror = function () {
      reject(new Error("Não foi possível ler a foto selecionada."));
    };

    leitor.readAsDataURL(arquivo);
  });
}

async function enviarFotoParaDrive(arquivo) {
  validarArquivoFoto(arquivo);

  const dataUrl = await lerArquivoComoDataUrl(arquivo);
  const separador = dataUrl.indexOf(",");

  if (separador < 0) {
    throw new Error("O conteúdo da foto é inválido.");
  }

  const resultado = await chamarApi({
    acao: "uploadFoto",
    foto: {
      nome: arquivo.name,
      tipo: arquivo.type,
      base64: dataUrl.slice(separador + 1)
    }
  });

  if (!resultado.foto || !resultado.foto.url) {
    throw new Error("A API não retornou o endereço da foto.");
  }

  return resultado.foto.url;
}

function atualizarStatusFoto(texto) {
  const status = document.getElementById("statusFoto");

  if (status) {
    status.textContent = texto;
  }
}

function atualizarPreviewFoto(url) {
  const preview = document.getElementById("previewFoto");

  if (!preview) {
    return;
  }

  preview.src = String(url || "").trim() || FOTO_PLACEHOLDER;
}

function iniciarSelecaoFoto() {
  const campoArquivo =
    document.getElementById("fotoMembro") ||
    document.getElementById("fotoArquivo");

  if (!campoArquivo) {
    return;
  }

  campoArquivo.addEventListener("change", async function () {
    const arquivo = campoArquivo.files?.[0];

    if (!arquivo) {
      atualizarPreviewFoto(
        document.getElementById("foto")?.value || ""
      );
      atualizarStatusFoto("Nenhuma nova foto selecionada.");
      return;
    }

    try {
      validarArquivoFoto(arquivo);
      const dataUrl = await lerArquivoComoDataUrl(arquivo);
      atualizarPreviewFoto(dataUrl);
      atualizarStatusFoto(
        "Pré-visualização pronta. A foto será enviada ao salvar."
      );
    } catch (erro) {
      campoArquivo.value = "";
      atualizarStatusFoto(erro.message);
      alert(erro.message);
    }
  });
}

function gerarFotoFicha(membro) {
  const url = String(membro.foto || "").trim();

  if (!url) {
    return "";
  }

  return `
    <div style="display:flex;justify-content:center;margin-bottom:20px;">
      <img
        src="${escaparHtml(url)}"
        alt="Foto de ${escaparHtml(membro.nomeCompleto || "membro")}" 
        style="width:160px;height:200px;object-fit:cover;border-radius:14px;border:2px solid #d7dee4;background:#f3f5f6;"
        onerror="this.style.display='none'"
      >
    </div>
  `;
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

      const dados =
        Object.fromEntries(
          new FormData(formularioNovoMembro).entries()
        );

      try {
        const arquivoFoto =
          obterArquivoFoto(formularioNovoMembro);

        if (arquivoFoto) {
          botaoSalvar.textContent = "Enviando foto...";
          atualizarStatusFoto("Enviando foto ao Google Drive...");
          dados.foto = await enviarFotoParaDrive(arquivoFoto);
          atualizarStatusFoto("Foto enviada com sucesso.");
          botaoSalvar.textContent = "Salvando cadastro...";
        }

        const resultado = await chamarApi({
          acao: "cadastrar",
          dados: dados
        });

        alert(
          "Membro cadastrado com sucesso!\nID: " +
          resultado.id
        );

        formularioNovoMembro.reset();
        atualizarPreviewFoto("");
        atualizarStatusFoto("Selecione uma foto para o cadastro.");

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
let membrosExibidos = [];
const idsCarteirinhasSelecionadas = new Set();

const selecionarTodosMembros =
  document.getElementById("selecionarTodosMembros");

const botaoExportarSelecionadas =
  document.getElementById("botaoExportarSelecionadas");

const contadorSelecionados =
  document.getElementById("contadorSelecionados");

if (tabelaMembros) {
  carregarMembros();
}

async function carregarMembros() {
  tabelaMembros.innerHTML = `
    <tr>
      <td colspan="7" class="empty-state">
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
        <td colspan="7" class="empty-state">
          ${escaparHtml(erro.message)}
        </td>
      </tr>
    `;
  }
}

function mostrarMembros(membros) {
  tabelaMembros.innerHTML = "";
  membrosExibidos = Array.isArray(membros) ? membros : [];

  if (!membros.length) {
    tabelaMembros.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
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

    const idMembro = String(membro.id || "").trim();
    const marcado = idsCarteirinhasSelecionadas.has(idMembro);

    linha.innerHTML = `
      <td class="coluna-selecao">
        <input
          type="checkbox"
          class="seletor-carteirinha"
          value="${escaparHtml(idMembro)}"
          aria-label="Selecionar carteirinha de ${escaparHtml(membro.nome || idMembro)}"
          ${marcado ? "checked" : ""}
        >
      </td>

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
  atualizarControlesCarteirinhas();
}

if (tabelaMembros) {
  tabelaMembros.addEventListener("change", function (evento) {
    const seletor = evento.target.closest(".seletor-carteirinha");

    if (!seletor) {
      return;
    }

    const id = String(seletor.value || "").trim();

    if (seletor.checked) {
      idsCarteirinhasSelecionadas.add(id);
    } else {
      idsCarteirinhasSelecionadas.delete(id);
    }

    atualizarControlesCarteirinhas();
  });
}

selecionarTodosMembros?.addEventListener("change", function () {
  membrosExibidos.forEach(function (membro) {
    const id = String(membro.id || "").trim();

    if (!id) {
      return;
    }

    if (selecionarTodosMembros.checked) {
      idsCarteirinhasSelecionadas.add(id);
    } else {
      idsCarteirinhasSelecionadas.delete(id);
    }
  });

  mostrarMembros(membrosExibidos);
});

botaoExportarSelecionadas?.addEventListener("click", function () {
  const ids = Array.from(idsCarteirinhasSelecionadas);

  if (!ids.length) {
    alert("Selecione pelo menos uma carteirinha.");
    return;
  }

  const parametros = new URLSearchParams();
  parametros.set("ids", ids.join(","));
  parametros.set("lote", "1");

  window.location.href = "carteirinha.html?" + parametros.toString();
});

function atualizarControlesCarteirinhas() {
  const quantidade = idsCarteirinhasSelecionadas.size;

  if (contadorSelecionados) {
    contadorSelecionados.textContent =
      quantidade === 1
        ? "1 selecionado"
        : quantidade + " selecionados";
  }

  if (botaoExportarSelecionadas) {
    botaoExportarSelecionadas.disabled = quantidade === 0;
  }

  if (selecionarTodosMembros) {
    const idsVisiveis = membrosExibidos
      .map(function (membro) {
        return String(membro.id || "").trim();
      })
      .filter(Boolean);

    const selecionadosVisiveis = idsVisiveis.filter(function (id) {
      return idsCarteirinhasSelecionadas.has(id);
    }).length;

    selecionarTodosMembros.checked =
      idsVisiveis.length > 0 && selecionadosVisiveis === idsVisiveis.length;

    selecionarTodosMembros.indeterminate =
      selecionadosVisiveis > 0 && selecionadosVisiveis < idsVisiveis.length;
  }
}

/* =========================================
   PESQUISA E FILTRO
========================================= */

const pesquisaMembro =
  document.getElementById("pesquisaMembro");

const filtroSituacao =
  document.getElementById("filtroSituacao");

const filtroRegiao =
  document.getElementById("filtroRegiao");

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

if (filtroRegiao) {
  filtroRegiao.addEventListener(
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

  const regiao = String(
    filtroRegiao?.value || ""
  ).toLowerCase();

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

        const correspondeRegiao =
          !regiao ||
          String(membro.congregacao || "")
            .toLowerCase()
            .includes(regiao);

        return (
          correspondeTexto &&
          correspondeSituacao &&
          correspondeRegiao
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

  const nomeMembro =
    membro.nomeCompleto ||
    "Nome não informado";

  const urlFoto =
    String(membro.foto || "").trim();

  const iniciais =
    obterIniciaisCarteirinha(nomeMembro);

  const fotoPerfil = urlFoto
    ? `
      <img
        class="member-profile-photo"
        src="${escaparHtml(urlFoto)}"
        alt="Foto de ${escaparHtml(nomeMembro)}"
        onerror="
          this.hidden = true;
          this.nextElementSibling.hidden = false;
        "
      >
      <div
        class="member-profile-photo-placeholder"
        hidden
      >
        ${escaparHtml(iniciais)}
      </div>
    `
    : `
      <div class="member-profile-photo-placeholder">
        ${escaparHtml(iniciais)}
      </div>
    `;

  fichaMembro.innerHTML = `
    <section class="member-profile-hero">
      <div class="member-profile-photo-box">
        ${fotoPerfil}
      </div>

      <div class="member-profile-summary">
        <p class="dashboard-label">
          Cadastro ministerial
        </p>

        <h2>${escaparHtml(nomeMembro)}</h2>

        <div class="member-profile-badges">
          <span>
            ID ${escaparHtml(membro.id || "—")}
          </span>

          <span>
            ${escaparHtml(membro.situacao || "Ativo")}
          </span>
        </div>

        <div class="member-profile-meta">
          <div>
            <span>Cargo</span>
            <strong>${escaparHtml(membro.cargo || "Membro")}</strong>
          </div>

          <div>
            <span>Cidade da igreja</span>
            <strong>${escaparHtml(membro.congregacao || "Não informada")}</strong>
          </div>
        </div>
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
        ${campoFicha("Cidade da igreja", membro.congregacao)}
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

    <div class="form-actions member-profile-actions">
      <a
        class="secondary-link"
        href="membros.html"
      >
        Voltar
      </a>

      <a
        class="secondary-link"
        href="carteirinha.html?id=${encodeURIComponent(
          membro.id
        )}"
      >
        Visualizar carteirinha
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

  atualizarPreviewFoto(membro.foto || "");
  atualizarStatusFoto(
    membro.foto
      ? "Foto atual do cadastro."
      : "Selecione uma foto para o cadastro."
  );
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
      const arquivoFoto =
        obterArquivoFoto(formularioEditarMembro);

      if (arquivoFoto) {
        botaoSalvar.textContent = "Enviando foto...";
        atualizarStatusFoto("Enviando foto ao Google Drive...");
        dados.foto = await enviarFotoParaDrive(arquivoFoto);
        atualizarStatusFoto("Foto enviada com sucesso.");
        botaoSalvar.textContent = "Salvando alterações...";
      }

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
   CONFIGURAÇÕES GERAIS
========================================= */

const formularioConfiguracoes =
  document.getElementById("formConfiguracoes");

const mensagemConfiguracoes =
  document.getElementById("mensagemConfiguracoes");

const TIPOS_ARQUIVO_SISTEMA = [
  "image/jpeg",
  "image/png",
  "image/webp"
];

const TAMANHO_MAXIMO_ARQUIVO_SISTEMA =
  4 * 1024 * 1024;

if (formularioConfiguracoes) {
  carregarConfiguracoes();
  carregarListasSistema();
  iniciarCamposDeCor();
  iniciarUploadsConfiguracoes();

  formularioConfiguracoes.addEventListener(
    "submit",
    salvarConfiguracoes
  );
}

async function carregarConfiguracoes() {
  try {
    definirMensagemConfiguracoes(
      "Carregando configurações...",
      "info"
    );

    const resultado = await chamarApi({
      acao: "obterConfiguracoes"
    });

    preencherConfiguracoes(
      resultado.configuracoes || {},
      resultado.arquivos || {}
    );

    formularioConfiguracoes.hidden = false;
    definirMensagemConfiguracoes(
      "Configurações carregadas.",
      "success"
    );
  } catch (erro) {
    console.error("Erro ao carregar configurações:", erro);
    definirMensagemConfiguracoes(erro.message, "error");
  }
}

function preencherConfiguracoes(configuracoes, arquivos) {
  Object.entries(configuracoes).forEach(
    function ([chave, valor]) {
      const campo = formularioConfiguracoes.elements[chave];

      if (!campo) {
        return;
      }

      if (campo.type === "checkbox") {
        campo.checked = valor === true ||
          String(valor).toLowerCase() === "true";
      } else {
        campo.value = valor ?? "";
      }
    }
  );

  preencherArquivoConfiguracao("Logo", arquivos.logo || "");
  preencherArquivoConfiguracao(
    "Assinatura",
    arquivos.assinatura || ""
  );
  preencherArquivoConfiguracao(
    "Favicon",
    arquivos.favicon || ""
  );

  sincronizarCamposDeCor();
}

function preencherArquivoConfiguracao(tipo, url) {
  const campoUrl = document.getElementById("url" + tipo);
  const preview = document.getElementById("preview" + tipo);
  const placeholder = document.getElementById("placeholder" + tipo);

  if (campoUrl) {
    campoUrl.value = url;
  }

  if (!preview || !placeholder) {
    return;
  }

  if (url) {
    preview.src = url;
    preview.hidden = false;
    placeholder.hidden = true;
  } else {
    preview.removeAttribute("src");
    preview.hidden = true;
    placeholder.hidden = false;
  }
}

async function salvarConfiguracoes(evento) {
  evento.preventDefault();

  const botao = document.getElementById(
    "botaoSalvarConfiguracoes"
  );
  const textoOriginal = botao.textContent;

  try {
    botao.disabled = true;
    botao.textContent = "Salvando...";
    definirMensagemConfiguracoes(
      "Salvando configurações...",
      "info"
    );

    const dados = {};

    formularioConfiguracoes
      .querySelectorAll("[name]")
      .forEach(function (campo) {
        if (["logo", "assinatura", "favicon"].includes(campo.name)) {
          return;
        }

        dados[campo.name] = campo.type === "checkbox"
          ? campo.checked
          : String(campo.value || "").trim();
      });

    const resultado = await chamarApi({
      acao: "salvarConfiguracoes",
      dados: dados
    });

    definirMensagemConfiguracoes(
      resultado.mensagem ||
        "Configurações salvas com sucesso.",
      "success"
    );
  } catch (erro) {
    console.error("Erro ao salvar configurações:", erro);
    definirMensagemConfiguracoes(erro.message, "error");
    alert(
      "Não foi possível salvar as configurações.\n\n" +
      erro.message
    );
  } finally {
    botao.disabled = false;
    botao.textContent = textoOriginal;
  }
}

function iniciarUploadsConfiguracoes() {
  [
    ["arquivoLogo", "logo", "Logo"],
    ["arquivoAssinatura", "assinatura", "Assinatura"],
    ["arquivoFavicon", "favicon", "Favicon"]
  ].forEach(function ([idCampo, chave, tipoVisual]) {
    const campo = document.getElementById(idCampo);

    campo?.addEventListener("change", async function () {
      const arquivo = campo.files?.[0];

      if (!arquivo) {
        return;
      }

      try {
        validarArquivoSistema(arquivo);
        definirMensagemConfiguracoes(
          "Enviando " + chave + "...",
          "info"
        );

        const url = await enviarArquivoSistema(
          arquivo,
          chave
        );

        preencherArquivoConfiguracao(tipoVisual, url);
        definirMensagemConfiguracoes(
          "Arquivo enviado com sucesso.",
          "success"
        );
      } catch (erro) {
        campo.value = "";
        definirMensagemConfiguracoes(erro.message, "error");
        alert(erro.message);
      }
    });
  });
}

function validarArquivoSistema(arquivo) {
  if (!TIPOS_ARQUIVO_SISTEMA.includes(arquivo.type)) {
    throw new Error(
      "O arquivo deve estar no formato JPG, PNG ou WebP."
    );
  }

  if (arquivo.size > TAMANHO_MAXIMO_ARQUIVO_SISTEMA) {
    throw new Error("O arquivo deve ter no máximo 4 MB.");
  }
}

async function enviarArquivoSistema(arquivo, chave) {
  const dataUrl = await lerArquivoComoDataUrl(arquivo);
  const separador = dataUrl.indexOf(",");

  if (separador < 0) {
    throw new Error("O conteúdo do arquivo é inválido.");
  }

  const resultado = await chamarApi({
    acao: "uploadArquivoSistema",
    chave: chave,
    arquivo: {
      nome: arquivo.name,
      tipo: arquivo.type,
      base64: dataUrl.slice(separador + 1)
    }
  });

  if (!resultado.arquivo || !resultado.arquivo.url) {
    throw new Error(
      "A API não retornou o endereço do arquivo."
    );
  }

  return resultado.arquivo.url;
}

function iniciarCamposDeCor() {
  [
    ["corPrincipal", "corPrincipalTexto"],
    ["corSecundaria", "corSecundariaTexto"]
  ].forEach(function ([idCor, idTexto]) {
    const cor = document.getElementById(idCor);
    const texto = document.getElementById(idTexto);

    cor?.addEventListener("input", function () {
      texto.value = cor.value;
    });

    texto?.addEventListener("change", function () {
      const valor = texto.value.trim();

      if (/^#[0-9a-f]{6}$/i.test(valor)) {
        cor.value = valor;
      } else {
        texto.value = cor.value;
      }
    });
  });
}

function sincronizarCamposDeCor() {
  [
    ["corPrincipal", "corPrincipalTexto"],
    ["corSecundaria", "corSecundariaTexto"]
  ].forEach(function ([idCor, idTexto]) {
    const cor = document.getElementById(idCor);
    const texto = document.getElementById(idTexto);

    if (cor && texto) {
      texto.value = cor.value;
    }
  });
}

function definirMensagemConfiguracoes(texto, tipo) {
  if (!mensagemConfiguracoes) {
    return;
  }

  mensagemConfiguracoes.textContent = texto;
  mensagemConfiguracoes.dataset.tipo = tipo || "info";
}

/* =========================================
   LISTAS DO SISTEMA
========================================= */

async function carregarListasSistema() {
  const mensagem = document.getElementById("mensagemListas");
  const painel = document.getElementById("listasSistema");

  if (!mensagem || !painel) {
    return;
  }

  try {
    mensagem.hidden = false;
    mensagem.textContent = "Carregando listas...";
    mensagem.dataset.tipo = "info";
    painel.hidden = true;

    const resultado = await chamarApi({
      acao: "listarListas"
    });

    preencherListasSistema(resultado.listas || {});

    painel.hidden = false;
    mensagem.textContent = "Listas carregadas com sucesso.";
    mensagem.dataset.tipo = "success";
  } catch (erro) {
    console.error("Erro ao carregar listas do sistema:", erro);
    painel.hidden = true;
    mensagem.hidden = false;
    mensagem.textContent = erro.message;
    mensagem.dataset.tipo = "error";
  }
}

function preencherListasSistema(listas) {
  preencherListaSistema(
    "listaUnidades",
    listas.UNIDADE || []
  );

  preencherListaSistema(
    "listaCargos",
    listas.CARGO || []
  );

  preencherListaSistema(
    "listaEstadoCivil",
    listas["ESTADO CIVIL"] || []
  );

  preencherListaSistema(
    "listaSituacoes",
    listas["SITUAÇÃO"] || listas.SITUACAO || []
  );
}

function preencherListaSistema(idElemento, valores) {
  const lista = document.getElementById(idElemento);

  if (!lista) {
    return;
  }

  lista.innerHTML = "";

  const itens = Array.isArray(valores)
    ? valores.filter(function (valor) {
        return String(valor || "").trim();
      })
    : [];

  if (!itens.length) {
    const itemVazio = document.createElement("li");
    itemVazio.textContent = "Nenhum valor cadastrado.";
    lista.appendChild(itemVazio);
    return;
  }

  itens.forEach(function (valor) {
    const item = document.createElement("li");
    item.textContent = String(valor).trim();
    lista.appendChild(item);
  });
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
    iniciarSelecaoFoto();
  }
);
