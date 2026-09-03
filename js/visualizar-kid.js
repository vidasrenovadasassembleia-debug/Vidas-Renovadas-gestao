(function () {
  "use strict";

  document.addEventListener(
    "DOMContentLoaded",
    iniciarVisualizacaoKid
  );


  async function iniciarVisualizacaoKid() {
    const codigo = obterCodigoUrl();

    if (!codigo) {
      mostrarErro(
        "O código da criança não foi informado."
      );
      return;
    }

    configurarLinks(codigo);

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

      if (!kid || typeof kid !== "object") {
        throw new Error(
          "A API não retornou os dados da criança."
        );
      }

      preencherFicha(kid, codigo);

    } catch (erro) {
      console.error(
        "Erro ao visualizar criança:",
        erro
      );

      mostrarErro(
        erro?.message ||
        "Não foi possível carregar a criança."
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


  function configurarLinks(codigo) {
    const botaoEditar =
      document.getElementById(
        "botaoEditarKid"
      );

    if (botaoEditar) {
      botaoEditar.href =
        "editar-kid.html?id=" +
        encodeURIComponent(codigo);
    }
  }


  function preencherFicha(kid, codigoUrl) {
    const codigo =
      primeiroValor(
        kid.codigo,
        kid.id,
        codigoUrl
      );

    const nome =
      primeiroValor(
        kid.nomeCompleto,
        kid.nome,
        "Nome não informado"
      );

    const nascimento =
      primeiroValor(
        kid.dataNascimento
      );

    const congregacao =
      primeiroValor(
        kid.congregacao
      );

    const situacao =
      primeiroValor(
        kid.situacao,
        "Ativo"
      );

    definirTexto(
      "nomeKid",
      nome
    );

    definirTexto(
      "codigoKid",
      "Código " + codigo
    );

    definirTexto(
      "idadeKid",
      calcularIdade(nascimento)
    );

    definirTexto(
      "congregacaoKid",
      congregacao
        ? "Congregação: " + congregacao
        : "Congregação não informada"
    );

    definirTexto(
      "situacaoKid",
      situacao
    );


    definirTexto(
      "campoNome",
      nome
    );

    definirTexto(
      "campoNascimento",
      formatarData(nascimento)
    );

    definirTexto(
      "campoSexo",
      kid.sexo
    );

    definirTexto(
      "campoCongregacao",
      congregacao
    );


    definirTexto(
      "campoMae",
      kid.mae
    );

    definirTexto(
      "campoPai",
      kid.pai
    );

    definirTexto(
      "campoResponsavel",
      kid.responsavelPrincipal
    );

    definirTexto(
      "campoTelefone",
      kid.telefoneResponsavel
    );

    definirTexto(
      "campoWhatsapp",
      kid.whatsappResponsavel
    );


    definirTexto(
      "campoCep",
      kid.cep
    );

    definirTexto(
      "campoEndereco",
      kid.endereco
    );

    definirTexto(
      "campoNumero",
      kid.numero
    );

    definirTexto(
      "campoComplemento",
      kid.complemento
    );

    definirTexto(
      "campoBairro",
      kid.bairro
    );

    definirTexto(
      "campoCidade",
      kid.cidade
    );

    definirTexto(
      "campoEstado",
      kid.estado
    );


    definirTexto(
      "campoSituacao",
      situacao
    );

    definirTexto(
      "campoConvertido",
      kid.convertidoMembro
    );

    definirTexto(
      "campoCodigoMembro",
      kid.codigoMembro
    );

    definirTexto(
      "campoObservacoes",
      kid.observacoes
    );


    preencherFoto(
      kid.foto,
      nome
    );


    const mensagem =
      document.getElementById(
        "mensagemKid"
      );

    const conteudo =
      document.getElementById(
        "conteudoKid"
      );

    if (mensagem) {
      mensagem.hidden = true;
    }

    if (conteudo) {
      conteudo.hidden = false;
    }

    document.title =
      nome +
      " | Vidas Renovadas Gestão";
  }


  function preencherFoto(
    valorFoto,
    nome
  ) {
    const foto =
      document.getElementById(
        "fotoKid"
      );

    const placeholder =
      document.getElementById(
        "fotoKidPlaceholder"
      );

    if (!foto || !placeholder) {
      return;
    }

    const url =
      normalizarUrlFoto(
        valorFoto
      );

    if (!url) {
      foto.hidden = true;
      placeholder.hidden = false;

      placeholder.textContent =
        obterIniciais(nome);

      return;
    }

    foto.onload = function () {
      foto.hidden = false;
      placeholder.hidden = true;
    };

    foto.onerror = function () {
      foto.hidden = true;
      placeholder.hidden = false;

      placeholder.textContent =
        obterIniciais(nome);
    };

    foto.alt =
      "Foto de " + nome;

    foto.referrerPolicy =
      "no-referrer";

    foto.src = url;
  }


  function normalizarUrlFoto(valor) {
    if (!valor) return "";

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

    if (!texto) return "";

    /*
      Compatibilidade temporária com os
      registros antigos de teste que
      gravaram:
      {url=https://..., nome=..., id=...}
    */
    if (
      texto.startsWith("{url=")
    ) {
      const resultado =
        texto.match(
          /\{url=([^,}]+)/
        );

      if (resultado?.[1]) {
        return resultado[1].trim();
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

    if (!elemento) return;

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


  function calcularIdade(
    dataNascimento
  ) {
    const data =
      interpretarData(
        dataNascimento
      );

    if (!data) {
      return "Idade —";
    }

    const hoje =
      new Date();

    let idade =
      hoje.getFullYear() -
      data.getFullYear();

    const diferencaMes =
      hoje.getMonth() -
      data.getMonth();

    if (
      diferencaMes < 0 ||
      (
        diferencaMes === 0 &&
        hoje.getDate() <
        data.getDate()
      )
    ) {
      idade--;
    }

    if (
      idade < 0 ||
      idade > 120
    ) {
      return "Idade —";
    }

    return idade + " anos";
  }


  function formatarData(valor) {
    const data =
      interpretarData(valor);

    if (!data) {
      return "—";
    }

    const dia =
      String(
        data.getDate()
      ).padStart(2, "0");

    const mes =
      String(
        data.getMonth() + 1
      ).padStart(2, "0");

    const ano =
      data.getFullYear();

    return (
      dia +
      "/" +
      mes +
      "/" +
      ano
    );
  }


  function interpretarData(valor) {
    if (!valor) {
      return null;
    }

    if (
      valor instanceof Date
    ) {
      return isNaN(
        valor.getTime()
      )
        ? null
        : valor;
    }

    const texto =
      String(valor).trim();

    const iso =
      texto.match(
        /^(\d{4})-(\d{2})-(\d{2})/
      );

    if (iso) {
      const data =
        new Date(
          Number(iso[1]),
          Number(iso[2]) - 1,
          Number(iso[3])
        );

      return isNaN(
        data.getTime()
      )
        ? null
        : data;
    }

    const brasileiro =
      texto.match(
        /^(\d{2})\/(\d{2})\/(\d{4})$/
      );

    if (brasileiro) {
      const data =
        new Date(
          Number(brasileiro[3]),
          Number(brasileiro[2]) - 1,
          Number(brasileiro[1])
        );

      return isNaN(
        data.getTime()
      )
        ? null
        : data;
    }

    const data =
      new Date(texto);

    return isNaN(
      data.getTime()
    )
      ? null
      : data;
  }


  function obterIniciais(nome) {
    const palavras =
      String(nome || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (!palavras.length) {
      return "KIDS";
    }

    if (palavras.length === 1) {
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
        "mensagemKid"
      );

    const conteudo =
      document.getElementById(
        "conteudoKid"
      );

    if (conteudo) {
      conteudo.hidden = true;
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
