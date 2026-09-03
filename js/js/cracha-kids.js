(function () {
  "use strict";

  document.addEventListener(
    "DOMContentLoaded",
    iniciarCrachaKids
  );


  async function iniciarCrachaKids() {
    const codigo = obterCodigoUrl();

    if (!codigo) {
      mostrarErro(
        "O código da criança não foi informado."
      );
      return;
    }

    configurarVoltar(codigo);
    configurarImpressao();

    try {
      const resposta = await chamarApi({
        acao: "buscarKid",
        id: codigo
      });

      if (
        !resposta ||
        resposta.sucesso === false
      ) {
        throw new Error(
          resposta?.mensagem ||
          "Não foi possível carregar a criança."
        );
      }

      const kid =
        resposta.kid ||
        resposta.dados ||
        resposta.crianca ||
        resposta;

      if (
        !kid ||
        typeof kid !== "object"
      ) {
        throw new Error(
          "A API não retornou os dados da criança."
        );
      }

      preencherCracha(kid, codigo);

    } catch (erro) {
      console.error(
        "Erro ao carregar Crachá Kids:",
        erro
      );

      mostrarErro(
        erro?.message ||
        "Não foi possível carregar o Crachá Kids."
      );
    }
  }


  function obterCodigoUrl() {
    const parametros =
      new URLSearchParams(
        window.location.search
      );

    return String(
      parametros.get("id") || ""
    ).trim();
  }


  function configurarVoltar(codigo) {
    const botao =
      document.getElementById(
        "botaoVoltar"
      );

    if (!botao) {
      return;
    }

    botao.href =
      "visualizar-kid.html?id=" +
      encodeURIComponent(codigo);
  }


  function configurarImpressao() {
    const botao =
      document.getElementById(
        "botaoImprimir"
      );

    if (!botao) {
      return;
    }

    botao.addEventListener(
      "click",
      function () {
        window.print();
      }
    );
  }


  function preencherCracha(
    kid,
    codigo
  ) {
    const nome =
      primeiroValor(
        kid.nomeCompleto,
        kid.nome,
        "Nome da criança"
      );

    const mae =
      primeiroValor(
        kid.mae,
        "—"
      );

    const pai =
      primeiroValor(
        kid.pai,
        "—"
      );

    const responsavel =
      primeiroValor(
        kid.responsavelPrincipal,
        kid.mae,
        kid.pai,
        "—"
      );

    const telefone =
      primeiroValor(
        kid.telefoneResponsavel,
        kid.whatsappResponsavel,
        "—"
      );


    definirTexto(
      "nomeKidCracha",
      nome
    );

    definirTexto(
      "maeKidCracha",
      mae
    );

    definirTexto(
      "paiKidCracha",
      pai
    );

    definirTexto(
      "responsavelKidCracha",
      responsavel
    );

    definirTexto(
      "telefoneKidCracha",
      telefone
    );


    preencherFoto(
      kid.foto,
      nome
    );


    const mensagem =
      document.getElementById(
        "mensagemCrachaKids"
      );

    const area =
      document.getElementById(
        "areaCrachaKids"
      );

    if (mensagem) {
      mensagem.hidden = true;
    }

    if (area) {
      area.hidden = false;
    }


    document.title =
      nome +
      " | Crachá Kids";
  }


  function preencherFoto(
    valorFoto,
    nome
  ) {
    const foto =
      document.getElementById(
        "fotoKidCracha"
      );

    const placeholder =
      document.getElementById(
        "fotoPlaceholderCracha"
      );

    if (!foto || !placeholder) {
      return;
    }

    const url =
      normalizarUrlFoto(
        valorFoto
      );

    placeholder.textContent =
      obterIniciais(nome);

    if (!url) {
      foto.hidden = true;
      placeholder.hidden = false;
      return;
    }

    foto.onload = function () {
      foto.hidden = false;
      placeholder.hidden = true;
    };

    foto.onerror = function () {
      foto.hidden = true;
      placeholder.hidden = false;
    };

    foto.alt =
      "Foto de " + nome;

    foto.referrerPolicy =
      "no-referrer";

    foto.src = url;
  }


  function normalizarUrlFoto(
    valor
  ) {
    if (!valor) {
      return "";
    }

    if (
      typeof valor === "object"
    ) {
      return String(
        valor.url ||
        valor.link ||
        ""
      ).trim();
    }

    const texto =
      String(valor).trim();

    if (!texto) {
      return "";
    }

    if (
      texto.startsWith("{url=")
    ) {
      const resultado =
        texto.match(
          /\{url=([^,}]+)/
        );

      if (
        resultado &&
        resultado[1]
      ) {
        return resultado[1]
          .trim();
      }
    }

    return texto;
  }


  function definirTexto(
    id,
    valor
  ) {
    const elemento =
      document.getElementById(id);

    if (!elemento) {
      return;
    }

    const texto =
      String(
        valor ?? ""
      ).trim();

    elemento.textContent =
      texto || "—";
  }


  function primeiroValor(
    ...valores
  ) {
    for (
      const valor of valores
    ) {
      if (
        valor !== undefined &&
        valor !== null &&
        String(valor).trim() !== ""
      ) {
        return String(valor).trim();
      }
    }

    return "";
  }


  function obterIniciais(
    nome
  ) {
    const palavras =
      String(nome || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (!palavras.length) {
      return "KIDS";
    }

    if (
      palavras.length === 1
    ) {
      return palavras[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return (
      palavras[0][0] +
      palavras[
        palavras.length - 1
      ][0]
    ).toUpperCase();
  }


  function mostrarErro(
    mensagem
  ) {
    const elemento =
      document.getElementById(
        "mensagemCrachaKids"
      );

    const area =
      document.getElementById(
        "areaCrachaKids"
      );

    if (area) {
      area.hidden = true;
    }

    if (elemento) {
      elemento.hidden = false;
      elemento.textContent =
        mensagem;

      elemento.classList.add(
        "erro"
      );
    }
  }


  function obterAuth() {
    const auth =
      window.VRGAuth ||
      window.Auth;

    if (
      !auth ||
      typeof auth.chamarApi !==
      "function"
    ) {
      throw new Error(
        "O módulo de autenticação não foi carregado corretamente."
      );
    }

    return auth;
  }


  async function chamarApi(
    payload
  ) {
    return obterAuth()
      .chamarApi(payload);
  }

})();
