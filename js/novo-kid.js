(function () {
  "use strict";

  let arquivoFotoSelecionado = null;

  document.addEventListener("DOMContentLoaded", iniciarNovoKid);


  async function iniciarNovoKid() {
    try {
      configurarEventos();
      await carregarCongregacoes();
    } catch (erro) {
      console.error("Erro ao iniciar cadastro Kids:", erro);
      mostrarAviso(
        erro?.message ||
        "Não foi possível iniciar o cadastro.",
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

cep?.addEventListener(
  "blur",
  buscarEnderecoPorCep
);

cep?.addEventListener(
  "input",
  formatarCep
);

    formulario?.addEventListener(
      "submit",
      cadastrarKid
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
        const option =
          document.createElement("option");

        option.value =
          String(nome).trim();

        option.textContent =
          String(nome).trim();

        select.appendChild(option);
      });
  }


  function normalizarLista(valor) {
    if (Array.isArray(valor)) {
      return valor;
    }

    if (Array.isArray(valor?.itens)) {
      return valor.itens;
    }

    if (Array.isArray(valor?.dados)) {
      return valor.dados;
    }

    return [];
  }


  function selecionarFoto(evento) {
    const arquivo =
      evento.target.files?.[0] || null;

    arquivoFotoSelecionado = arquivo;

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
      foto.hidden = true;
      foto.removeAttribute("src");
      placeholder.hidden = false;
      return;
    }

    const url =
      URL.createObjectURL(arquivo);

    foto.src = url;
    foto.hidden = false;
    placeholder.hidden = true;
  }


  function atualizarResumo() {
    const nome =
      document.getElementById(
        "NOME_COMPLETO"
      )?.value?.trim();

    const congregacao =
      document.getElementById(
        "CONGREGACAO"
      )?.value?.trim();

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
        nome || "Nova criança";
    }

    if (resumoCongregacao) {
      resumoCongregacao.textContent =
        congregacao ||
        "Congregação ainda não informada";
    }
  }


  async function cadastrarKid(evento) {
    evento.preventDefault();

    limparAviso();

    const formulario =
      document.getElementById("formNovoKid");

    if (!formulario) return;

    if (!formulario.reportValidity()) {
      return;
    }

    const botao =
      document.getElementById(
        "botaoCadastrarKid"
      );

    bloquearBotao(
      botao,
      true,
      "Cadastrando..."
    );

    try {
      const dados =
        coletarDadosFormulario();

      if (arquivoFotoSelecionado) {
        const resultadoFoto =
          await enviarFotoKid(
            arquivoFotoSelecionado
          );

        dados.foto =
          resultadoFoto.url ||
          resultadoFoto.foto ||
          resultadoFoto.link ||
          "";
      }

      const resposta =
        await chamarApi({
          acao: "cadastrarKid",
          dados: dados
        });

      if (
        !resposta ||
        resposta.sucesso === false
      ) {
        throw new Error(
          resposta?.mensagem ||
          "Não foi possível cadastrar a criança."
        );
      }

      mostrarAviso(
        resposta.mensagem ||
        "Criança cadastrada com sucesso.",
        "sucesso"
      );

      setTimeout(() => {
        window.location.href =
          "kids.html";
      }, 900);

    } catch (erro) {
      console.error(
        "Erro ao cadastrar criança:",
        erro
      );

      mostrarAviso(
        erro?.message ||
        "Não foi possível cadastrar a criança.",
        "erro"
      );

      bloquearBotao(
        botao,
        false,
        "✓ Cadastrar criança"
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
        valor("SITUACAO") || "Ativo"
    };
  }


  async function enviarFotoKid(arquivo) {
    const base64 =
      await arquivoParaBase64(arquivo);

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


  function arquivoParaBase64(arquivo) {
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

        leitor.readAsDataURL(arquivo);
      }
    );
  }


  function valor(id) {
    return String(
      document.getElementById(id)?.value || ""
    ).trim();
  }


  function mostrarAviso(
    mensagem,
    tipo
  ) {
    const aviso =
      document.getElementById("avisoKid");

    if (!aviso) return;

    aviso.textContent = mensagem;

    aviso.className =
      `kid-aviso ativo ${tipo || ""}`;
  }


  function limparAviso() {
    const aviso =
      document.getElementById("avisoKid");

    if (!aviso) return;

    aviso.textContent = "";
    aviso.className = "kid-aviso";
  }


  function bloquearBotao(
    botao,
    bloquear,
    texto
  ) {
    if (!botao) return;

    botao.disabled = bloquear;
    botao.textContent = texto;
  }


  function obterAuth() {
    const auth =
      window.VRGAuth ||
      window.Auth;

    if (
      !auth ||
      typeof auth.chamarApi !== "function"
    ) {
      throw new Error(
        "O módulo de autenticação não foi carregado corretamente."
      );
    }

    return auth;
  }


  async function chamarApi(payload) {
    return obterAuth().chamarApi(payload);
  }

})();
