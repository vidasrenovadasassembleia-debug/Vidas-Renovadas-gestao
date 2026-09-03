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
  kid.foto ||
  kid.fotoUrl ||
  kid.FOTO ||
  "",
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

    requestAnimationFrame(() => {
  ajustarNomeCracha();
  ajustarDadosVerso();
});

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

  console.log(
    "FOTO KIDS CARREGOU:",
    foto.src,
    foto.naturalWidth,
    foto.naturalHeight
  );
};

foto.onerror = function () {
  console.error(
    "ERRO FOTO KIDS:",
    foto.src
  );

  foto.hidden = true;
  placeholder.hidden = false;
};

    foto.alt =
      "Foto de " + nome;

    foto.referrerPolicy = "no-referrer";

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

  function ajustarNomeCracha() {
  const nome =
    document.getElementById(
      "nomeKidCracha"
    );

  const caixa =
    document.querySelector(
      ".nome-dinamico"
    );

  if (!nome || !caixa) {
    return;
  }

  const fonteMaxima = 20;
  const fonteMinima = 11;

  let tamanho = fonteMaxima;

  nome.style.fontSize =
    tamanho + "px";

  nome.style.lineHeight = "1.05";

  while (
    tamanho > fonteMinima &&
    (
      nome.scrollWidth >
        caixa.clientWidth ||
      nome.scrollHeight >
        caixa.clientHeight
    )
  ) {
    tamanho -= 0.5;

    nome.style.fontSize =
      tamanho + "px";
  }
}
  function ajustarDadosVerso() {
  const ids = [
    "maeKidCracha",
    "paiKidCracha",
    "telefoneKidCracha"
  ];

  ids.forEach((id) => {
    const elemento =
      document.getElementById(id);

    const caixa =
      elemento?.closest(".dado-verso");

    if (!elemento || !caixa) {
      return;
    }

    const fonteMaxima =
      id === "telefoneKidCracha"
        ? 16
        : 16;

    const fonteMinima =
      id === "telefoneKidCracha"
        ? 11
        : 9;

    let tamanho = fonteMaxima;

    elemento.style.fontSize =
      tamanho + "px";

    elemento.style.lineHeight = "1";

    while (
      tamanho > fonteMinima &&
      elemento.scrollWidth >
        caixa.clientWidth
    ) {
      tamanho -= 0.5;

      elemento.style.fontSize =
        tamanho + "px";
    }
  });
}
})();
