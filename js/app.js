const URL_API = "https://script.google.com/macros/s/AKfycbzwbSdAn5cyek9DrBy4SVGEZKI5odv6IW5ayjBLEfW1S1JL6dbTPGYqPU23nFM9rTrM/exec";

/* =========================
   TELA DE LOGIN
========================= */

const botaoAcessar = document.getElementById("botaoAcessar");

if (botaoAcessar) {
  botaoAcessar.addEventListener("click", function () {
    window.location.href = "dashboard.html";
  });
}

/* =========================
   CADASTRO DE MEMBRO
========================= */

const formularioMembro = document.getElementById("formNovoMembro");

if (formularioMembro) {
  formularioMembro.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    const botaoSalvar = formularioMembro.querySelector(
      'button[type="submit"]'
    );

    const textoOriginal = botaoSalvar.textContent;

    botaoSalvar.disabled = true;
    botaoSalvar.textContent = "Salvando...";

    const dados = Object.fromEntries(
      new FormData(formularioMembro).entries()
    );

    try {
      const resposta = await fetch(URL_API, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(dados)
      });

      const resultado = await resposta.json();

      if (!resultado.sucesso) {
        throw new Error(
          resultado.mensagem || "Não foi possível salvar."
        );
      }

      alert(
        "Membro cadastrado com sucesso!\nID: " +
        resultado.id
      );

      formularioMembro.reset();

      const cidade = document.getElementById("cidade");
      const estado = document.getElementById("estado");

      if (cidade) {
        cidade.value = "Duque de Caxias";
      }

      if (estado) {
        estado.value = "RJ";
      }

    } catch (erro) {
      console.error("Erro ao salvar:", erro);

      alert(
        "Não foi possível salvar o membro.\n\n" +
        erro.message
      );

    } finally {
      botaoSalvar.disabled = false;
      botaoSalvar.textContent = textoOriginal;
    }
  });
}

/* =========================
   LISTAGEM DE MEMBROS
========================= */

const tabelaMembros = document.getElementById("listaMembros");

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
    const endereco =
      URL_API +
      "?acao=listar&t=" +
      Date.now();

    const resposta = await fetch(endereco, {
      method: "GET",
      cache: "no-store"
    });

    if (!resposta.ok) {
      throw new Error(
        "A API respondeu com o código " +
        resposta.status
      );
    }

    const resultado = await resposta.json();

    let membros = resultado.membros;

    // Converte o texto recebido pela API em uma lista real.
    if (typeof membros === "string") {
      membros = JSON.parse(membros);
    }

    if (!resultado.sucesso) {
      throw new Error(
        resultado.mensagem || "Erro ao carregar membros."
      );
    }

    if (!Array.isArray(membros)) {
      throw new Error(
        "A lista de membros possui um formato inválido."
      );
    }

    mostrarMembros(membros);

  } catch (erro) {
    console.error("Erro ao listar membros:", erro);

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

  if (membros.length === 0) {
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
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td>${escaparHtml(membro.id || "")}</td>

      <td>${escaparHtml(membro.nome || "")}</td>

      <td>
        ${escaparHtml(membro.cargo || "-")}
      </td>

      <td>
        ${escaparHtml(membro.congregacao || "-")}
      </td>

      <td>
        ${escaparHtml(membro.situacao || "Ativo")}
      </td>

      <td>
        <button
          type="button"
          class="btn-acao"
          data-id="${escaparHtml(membro.id || "")}"
        >
          Visualizar
        </button>
      </td>
    `;

    tabelaMembros.appendChild(linha);
  });
}

function escaparHtml(valor) {
  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
