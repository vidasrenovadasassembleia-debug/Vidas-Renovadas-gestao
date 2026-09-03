(function () {
  "use strict";

  let codigoKid = "";
  let fotoAtual = "";
  let arquivoFotoSelecionado = null;

  document.addEventListener(
    "DOMContentLoaded",
    iniciarEdicaoKid
  );


  async function iniciarEdicaoKid() {
    codigoKid = obterCodigoUrl();

    if (!codigoKid) {
      mostrarAviso(
        "O código da criança não foi informado.",
        "erro"
      );
      return;
    }

    configurarEventos();

    try {
      await carregarCongregacoes();
      await carregarKid();
    } catch (erro) {
      console.error(
        "Erro ao iniciar edição Kids:",
        erro
      );

      mostrarAviso(
        erro?.message ||
        "Não foi possível carregar o cadastro.",
        "erro"
      );
    }
  }


  function configurarEventos() {
    const formulario =
      document.getElementById("formNovoKid");

    const inputFoto =
      document.getElementById("arquivoFotoKid");

    const nome =
      document.getElementById("NOME_COMPLETO");

    const congregacao =
      document.getElementById("CONGREGACAO");

    const cep =
      document.getElementById("CEP");

    formulario?.addEventListener(
      "submit",
      salvarAlteracoes
    );

    inputFoto?.addEventListener(
      "change",
      selecionarFoto
    );

    nome?.addEventListener(
      "input",
      atualizarResumo
    );

    congregacao?.addEventListener(
      "change",
      atualizarResumo
    );

    cep?.addEventListener(
      "blur",
      buscarEnderecoPorCep
    );

    cep?.addEventListener(
      "input",
      formatarCep
    );
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


  async function carregarCongregacoes() {
    const resposta = await chamarApi({
      acao: "listarCongregacoes",
      filtros: {}
    });

    if (
      !resposta ||
      resposta.sucesso === false
    ) {
      throw new Error(
        resposta?.mensagem ||
        "Não foi possível carregar as congregações."
      );
    }

    const lista =
      normalizarLista(
        resposta.dados ||
        resposta.congregacoes ||
        resposta
      );

    const select =
      document.getElementById("CONGREGACAO");

    if (!select) return;

    lista
      .map((item) =>
        item.nome ||
        item.NOME ||
        item.nomeCongregacao ||
        item.CONGREGACAO ||
        ""
      )
      .filter(Boolean)
      .sort((a, b) =>
        String(a).localeCompare(
          String(b),
          "pt-BR"
        )
      )
      .forEach((nome) => {
        const valorNome =
          String(nome).trim();

        if (
          ![...select.options].some(
            (option) =>
              option.value === valorNome
          )
        ) {
          const option =
            document.createElement("option");

          option.value = valorNome;
          option.textContent = valorNome;

          select.appendChild(option);
        }
      });
  }


  async function carregarKid() {
    const resposta = await chamarApi({
      acao: "buscarKid",
      id: codigoKid
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

    preencherFormulario(kid);
  }


  function preencherFormulario(kid) {
    definirValor(
      "NOME_COMPLETO",
      kid.nomeCompleto
    );

    definirValor(
      "DATA_NASCIMENTO",
      normalizarDataInput(
        kid.dataNascimento
      )
    );

    definirValor(
      "SEXO",
      kid.sexo
    );

    definirValor(
      "CONGREGACAO",
      kid.congregacao
    );

    definirValor(
      "MAE",
      kid.mae
    );

    definirValor(
      "PAI",
      kid.pai
    );

    definirValor(
      "RESPONSAVEL_PRINCIPAL",
      kid.responsavelPrincipal
    );

    definirValor(
      "TELEFONE_RESPONSAVEL",
      kid.telefoneResponsavel
    );

    definirValor(
      "WHATSAPP_RESPONSAVEL",
      kid.whatsappResponsavel
    );

    definirValor(
      "CEP",
      kid.cep
    );

    definirValor(
      "ENDERECO",
      kid.endereco
    );

    definirValor(
      "NUMERO",
      kid.numero
    );

    definirValor(
      "COMPLEMENTO",
      kid.complemento
    );

    definirValor(
      "BAIRRO",
      kid.bairro
    );

    definirValor(
      "CIDADE",
      kid.cidade
    );

    definirValor(
      "ESTADO",
      kid.estado
    );

    definirValor(
      "OBSERVACOES",
      kid.observacoes
    );

    definirValor(
      "SITUACAO",
      kid.situacao || "Ativo"
    );

    fotoAtual =
      normalizarUrlFoto(
        kid.foto
      );

    preencherFotoAtual(
      fotoAtual,
      kid.nomeCompleto
    );

    atualizarResumo();
  }


  function definirValor(
    id,
    valor
  ) {
    const elemento =
      document.getElementById(id);

    if (!elemento) return;

    elemento.value =
      String(valor ?? "");
  }


  function atualizarResumo() {
    const nome =
      valor("NOME_COMPLETO");

    const congregacao =
      valor("CONGREGACAO");

    const resumoNome =
      document.getElementById(
        "resumoNomeKid"
      );

    const resumoCongregacao =
      document.getElementById(
        "resumoCongregacaoKid"
      );

    if (resumoNome) {
      resumoNome.textContent =
        nome || "Editar criança";
    }

    if (resumoCongregacao) {
      resumoCongregacao.textContent =
        congregacao ||
        "Congregação ainda não informada";
    }
  }


  function selecionarFoto(evento) {
    const arquivo =
      evento.target.files?.[0] ||
      null;

    arquivoFotoSelecionado =
      arquivo;

    const foto =
      document.getElementById("fotoKid");

    const placeholder =
      document.getElementById(
        "fotoKidPlaceholder"
      );

    if (!foto || !placeholder) {
      return;
    }

    if (!arquivo) {
      preencherFotoAtual(
        fotoAtual,
        valor("NOME_COMPLETO")
      );
      return;
    }

    const url =
      URL.createObjectURL(arquivo);

    foto.src = url;
    foto.hidden = false;
    placeholder.hidden = true;
  }


  function preencherFotoAtual(
    url,
    nome
  ) {
    const foto =
      document.getElementById("fotoKid");

    const placeholder =
      document.getElementById(
        "fotoKidPlaceholder"
      );

    if (!foto || !placeholder) {
      return;
    }

    if (!url) {
      foto.hidden = true;
      foto.removeAttribute("src");

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

    foto.src = url;
  }


  async function salvarAlteracoes(evento) {
    evento.preventDefault();

    limparAviso();

    const formulario =
      document.getElementById(
        "formNovoKid"
      );

    if (!formulario) {
      return;
    }

    if (!formulario.reportValidity()) {
      return;
    }

    const botao =
      document.getElementById(
        "botaoSalvarKid"
      );

    bloquearBotao(
      botao,
      true,
      "Salvando..."
    );

    try {
      const dados =
        coletarDadosFormulario();

      dados.codigo = codigoKid;
      dados.id = codigoKid;

      dados.foto = fotoAtual;

      if (arquivoFotoSelecionado) {
        const resultadoFoto =
          await enviarFotoKid(
            arquivoFotoSelecionado
          );

        dados.foto =
          resultadoFoto.url ||
          resultadoFoto.foto?.url ||
          resultadoFoto.link ||
          "";
      }

      const resposta =
        await chamarApi({
          acao: "atualizarKid",
          dados: dados
        });

      if (
        !resposta ||
        resposta.sucesso === false
      ) {
        throw new Error(
          resposta?.mensagem ||
          "Não foi possível atualizar a criança."
        );
      }

      mostrarAviso(
        resposta.mensagem ||
        "Cadastro atualizado com sucesso.",
        "sucesso"
      );

      setTimeout(() => {
        window.location.href =
          "visualizar-kid.html?id=" +
          encodeURIComponent(
            codigoKid
          );
      }, 900);

    } catch (erro) {
      console.error(
        "Erro ao atualizar criança:",
        erro
      );

      mostrarAviso(
        erro?.message ||
        "Não foi possível atualizar a criança.",
        "erro"
      );

      bloquearBotao(
        botao,
        false,
        "✓ Salvar alterações"
      );
    }
  }


  function coletarDadosFormulario() {
    return {
      nomeCompleto:
        valor("NOME_COMPLETO"),

      dataNascimento:
        valor("DATA_NASCIMENTO"),

      sexo:
        valor("SEXO"),

      congregacao:
        valor("CONGREGACAO"),

      mae:
        valor("MAE"),

      pai:
        valor("PAI"),

      responsavelPrincipal:
        valor("RESPONSAVEL_PRINCIPAL"),

      telefoneResponsavel:
        valor("TELEFONE_RESPONSAVEL"),

      whatsappResponsavel:
        valor("WHATSAPP_RESPONSAVEL"),

      cep:
        valor("CEP"),

      endereco:
        valor("ENDERECO"),

      numero:
        valor("NUMERO"),

      complemento:
        valor("COMPLEMENTO"),

      bairro:
        valor("BAIRRO"),

      cidade:
        valor("CIDADE"),

      estado:
        valor("ESTADO"),

      observacoes:
        valor("OBSERVACOES"),

      situacao:
        valor("SITUACAO") ||
        "Ativo"
    };
  }


  async function enviarFotoKid(
    arquivo
  ) {
    const base64 =
      await arquivoParaBase64(
        arquivo
      );

    const resposta =
      await chamarApi({
        acao: "uploadFotoKid",
        foto: {
          nome: arquivo.name,
          tipo: arquivo.type,
          base64: base64
        }
      });

    if (
      !resposta ||
      resposta.sucesso === false
    ) {
      throw new Error(
        resposta?.mensagem ||
        "Não foi possível enviar a foto."
      );
    }

    return resposta;
  }


  function arquivoParaBase64(
    arquivo
  ) {
    return new Promise(
      (resolve, reject) => {
        const leitor =
          new FileReader();

        leitor.onload = () => {
          const resultado =
            String(
              leitor.result || ""
            );

          const base64 =
            resultado.includes(",")
              ? resultado.split(",")[1]
              : resultado;

          resolve(base64);
        };

        leitor.onerror = () => {
          reject(
            new Error(
              "Não foi possível ler a foto selecionada."
            )
          );
        };

        leitor.readAsDataURL(
          arquivo
        );
      }
    );
  }


  function formatarCep(evento) {
    const input =
      evento.target;

    let numeros =
      String(
        input.value || ""
      )
        .replace(/\D/g, "")
        .slice(0, 8);

    if (numeros.length > 5) {
      numeros =
        numeros.slice(0, 5) +
        "-" +
        numeros.slice(5);
    }

    input.value = numeros;
  }


  async function buscarEnderecoPorCep() {
    const campoCep =
      document.getElementById("CEP");

    if (!campoCep) return;

    const cep =
      String(
        campoCep.value || ""
      ).replace(/\D/g, "");

    if (cep.length !== 8) {
      return;
    }

    try {
      const resposta =
        await fetch(
          `https://viacep.com.br/ws/${cep}/json/`
        );

      if (!resposta.ok) {
        throw new Error(
          "Não foi possível consultar o CEP."
        );
      }

      const dados =
        await resposta.json();

      if (dados.erro) {
        mostrarAviso(
          "CEP não encontrado.",
          "erro"
        );
        return;
      }

      definirValor(
        "ENDERECO",
        dados.logradouro || ""
      );

      definirValor(
        "BAIRRO",
        dados.bairro || ""
      );

      definirValor(
        "CIDADE",
        dados.localidade || ""
      );

      definirValor(
        "ESTADO",
        dados.uf || ""
      );

      limparAviso();

      document
        .getElementById("NUMERO")
        ?.focus();

    } catch (erro) {
      console.error(
        "Erro ao consultar CEP:",
        erro
      );

      mostrarAviso(
        "Não foi possível consultar o CEP agora.",
        "erro"
      );
    }
  }


  function normalizarUrlFoto(valorFoto) {
    if (!valorFoto) {
      return "";
    }

    if (
      typeof valorFoto ===
      "object"
    ) {
      return String(
        valorFoto.url ||
        valorFoto.link ||
        ""
      ).trim();
    }

    const texto =
      String(
        valorFoto
      ).trim();

    if (
      texto.startsWith("{url=")
    ) {
      const resultado =
        texto.match(
          /\{url=([^,}]+)/
        );

      if (resultado?.[1]) {
        return resultado[1]
          .trim();
      }
    }

    return texto;
  }


  function normalizarDataInput(valorData) {
    if (!valorData) {
      return "";
    }

    const texto =
      String(
        valorData
      ).trim();

    const iso =
      texto.match(
        /^(\d{4})-(\d{2})-(\d{2})/
      );

    if (iso) {
      return (
        iso[1] +
        "-" +
        iso[2] +
        "-" +
        iso[3]
      );
    }

    const brasileira =
      texto.match(
        /^(\d{2})\/(\d{2})\/(\d{4})$/
      );

    if (brasileira) {
      return (
        brasileira[3] +
        "-" +
        brasileira[2] +
        "-" +
        brasileira[1]
      );
    }

    const data =
      new Date(texto);

    if (
      isNaN(data.getTime())
    ) {
      return "";
    }

    const ano =
      data.getFullYear();

    const mes =
      String(
        data.getMonth() + 1
      ).padStart(2, "0");

    const dia =
      String(
        data.getDate()
      ).padStart(2, "0");

    return (
      ano +
      "-" +
      mes +
      "-" +
      dia
    );
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


  function normalizarLista(valorLista) {
    if (
      Array.isArray(valorLista)
    ) {
      return valorLista;
    }

    if (
      Array.isArray(
        valorLista?.itens
      )
    ) {
      return valorLista.itens;
    }

    if (
      Array.isArray(
        valorLista?.dados
      )
    ) {
      return valorLista.dados;
    }

    return [];
  }


  function valor(id) {
    return String(
      document
        .getElementById(id)
        ?.value ||
      ""
    ).trim();
  }


  function mostrarAviso(
    mensagem,
    tipo
  ) {
    const aviso =
      document.getElementById(
        "avisoKid"
      );

    if (!aviso) return;

    aviso.textContent =
      mensagem;

    aviso.className =
      `kid-aviso ativo ${
        tipo || ""
      }`;
  }


  function limparAviso() {
    const aviso =
      document.getElementById(
        "avisoKid"
      );

    if (!aviso) return;

    aviso.textContent = "";
    aviso.className =
      "kid-aviso";
  }


  function bloquearBotao(
    botao,
    bloquear,
    texto
  ) {
    if (!botao) return;

    botao.disabled =
      bloquear;

    botao.textContent =
      texto;
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
