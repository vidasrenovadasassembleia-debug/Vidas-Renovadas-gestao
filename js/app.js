const URL_API = "https://script.google.com/macros/s/AKfycbzwbSdAn5cyek9DrBy4SVGEZKI5odv6IW5ayjBLEfW1S1JL6dbTPGYqPU23nFM9rTrM/exec";

const botaoAcessar = document.getElementById("botaoAcessar");

if (botaoAcessar) {
  botaoAcessar.addEventListener("click", function () {
    window.location.href = "dashboard.html";
  });
}

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
        throw new Error(resultado.mensagem);
      }

      alert(
        `Membro cadastrado com sucesso!\nID: ${resultado.id}`
      );

      formularioMembro.reset();

      document.getElementById("cidade").value =
        "Duque de Caxias";

      document.getElementById("estado").value = "RJ";

    } catch (erro) {
      console.error(erro);

      alert(
        "Não foi possível salvar o membro.\n\n" +
        erro.message
      );

    } finally {
      botaoSalvar.disabled = false;
      botaoSalvar.textContent = textoOriginal;
    }
  });
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

        const resposta = await fetch(URL_API + "?acao=listar");

        const resultado = await resposta.json();

        // Caso a API retorne membros como texto
        if (typeof resultado.membros === "string") {
            resultado.membros = JSON.parse(resultado.membros);
        }

        if (!resultado.sucesso) {
            throw new Error(resultado.mensagem || "Erro ao carregar membros.");
        }

        tabelaMembros.innerHTML = "";

        if (!resultado.membros || resultado.membros.length === 0) {

            tabelaMembros.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        Nenhum membro cadastrado.
                    </td>
                </tr>
            `;

            return;
        }

        resultado.membros.forEach((membro) => {

            tabelaMembros.innerHTML += `
                <tr>
                    <td>${membro.id}</td>
                    <td>${membro.nome}</td>
                    <td>${membro.cargo || "-"}</td>
                    <td>${membro.congregacao || "-"}</td>
                    <td>${membro.situacao}</td>
                    <td>
                        <button class="btn-acao">Visualizar</button>
                    </td>
                </tr>
            `;

        });

    } catch (erro) {

        console.error("Erro:", erro);

        tabelaMembros.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    Erro ao carregar os membros.
                </td>
            </tr>
        `;

    }

}
