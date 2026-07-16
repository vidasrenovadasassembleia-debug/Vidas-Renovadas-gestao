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
}
