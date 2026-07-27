/**
 * ============================================================================
 * VIDAS RENOVADAS GESTÃO 2.0
 * Arquivo: js/editar-membro.js
 * Descrição: Carregamento e atualização da ficha digital do membro
 * ============================================================================
 *
 * Dependências obrigatórias, nesta ordem:
 *   1. js/configuracoes.js
 *   2. js/api.js
 *   3. js/app.js
 *   4. js/auth.js
 *   5. js/membro-formulario.js
 *   6. js/editar-membro.js
 * ============================================================================
 */

(function (window, document) {
  "use strict";

  const FORMULARIOS = ["formEditarMembro", "formFichaMembroEditavel"];
  const CAMPOS_DATA = [
    "DATA_CADASTRO",
    "DATA_NASCIMENTO",
    "DATA_EMISSAO_RG",
    "DATA_CONVERSAO",
    "DATA_BATISMO_AGUAS",
    "DATA_BATISMO_ESPIRITO",
    "DATA_ADMISSAO",
    "DATA_CONSAGRACAO",
    "DATA_CASAMENTO",
    "DATA_EMISSAO_CARTEIRINHA",
    "VALIDADE_CARTEIRINHA",
    "ATUALIZADO_EM"
  ];

  let formulario = null;
  let modulo = null;
  let idMembro = "";
  let membroCarregado = null;
  let enviando = false;
  let alteracoesSalvas = false;
  let urlPreviewFoto = "";

  function texto(valor) {
    return String(valor ?? "").trim();
  }

  function primeiroValor(objeto, nomes, padrao = "") {
    for (const nome of nomes) {
      const valor = objeto?.[nome];
      if (valor !== undefined && valor !== null && texto(valor) !== "") {
        return valor;
      }
    }
    return padrao;
  }

  function obterModulo() {
    if (!window.VRGMembroFormulario) {
      throw new Error(
        "O módulo compartilhado da ficha do membro não foi carregado."
      );
    }
    return window.VRGMembroFormulario;
  }

  function obterFormulario() {
    for (const id of FORMULARIOS) {
      const encontrado = document.getElementById(id);
      if (encontrado) return encontrado;
    }
    return null;
  }

  function normalizarDataParaCampo(valor) {
    const valorTexto = texto(valor);
    if (!valorTexto) return "";

    if (/^\d{4}-\d{2}-\d{2}/.test(valorTexto)) {
      return valorTexto.slice(0, 10);
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(valorTexto)) {
      const [dia, mes, ano] = valorTexto.split("/");
      return `${ano}-${mes}-${dia}`;
    }

    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return "";

    return [
      data.getFullYear(),
      String(data.getMonth() + 1).padStart(2, "0"),
      String(data.getDate()).padStart(2, "0")
    ].join("-");
  }

  function normalizarMembro(membroOriginal) {
    const membro = membroOriginal || {};
    const normalizado = {
      ...membro,
      ID: primeiroValor(membro, ["ID", "id", "codigo"]),
      CODIGO: primeiroValor(membro, ["CODIGO", "codigo", "ID", "id"]),
      NUMERO_CARTEIRINHA: primeiroValor(membro, [
        "NUMERO_CARTEIRINHA",
        "numeroCarteirinha"
      ]),
      FOTO_URL: primeiroValor(membro, [
        "FOTO_URL",
        "fotoUrl",
        "foto",
        "urlFoto"
      ]),
      NOME_COMPLETO: primeiroValor(membro, [
        "NOME_COMPLETO",
        "nomeCompleto",
        "nome"
      ]),
      DATA_NASCIMENTO: primeiroValor(membro, [
        "DATA_NASCIMENTO",
        "dataNascimento"
      ]),
      SEXO: primeiroValor(membro, ["SEXO", "sexo"]),
      ESTADO_CIVIL: primeiroValor(membro, ["ESTADO_CIVIL", "estadoCivil"]),
      PROFISSAO: primeiroValor(membro, ["PROFISSAO", "profissao"]),
      NATURALIDADE: primeiroValor(membro, ["NATURALIDADE", "naturalidade"]),
      NACIONALIDADE: primeiroValor(membro, [
        "NACIONALIDADE",
        "nacionalidade"
      ]),
      TELEFONE: primeiroValor(membro, ["TELEFONE", "telefone"]),
      WHATSAPP: primeiroValor(membro, ["WHATSAPP", "whatsapp"]),
      EMAIL: primeiroValor(membro, ["EMAIL", "email"]),
      CPF: primeiroValor(membro, ["CPF", "cpf"]),
      RG: primeiroValor(membro, ["RG", "rg"]),
      ORGAO_EMISSOR: primeiroValor(membro, [
        "ORGAO_EMISSOR",
        "orgaoEmissor"
      ]),
      DATA_EMISSAO_RG: primeiroValor(membro, [
        "DATA_EMISSAO_RG",
        "dataEmissaoRg"
      ]),
      CEP: primeiroValor(membro, ["CEP", "cep"]),
      ENDERECO: primeiroValor(membro, ["ENDERECO", "endereco", "logradouro"]),
      NUMERO: primeiroValor(membro, ["NUMERO", "numero"]),
      COMPLEMENTO: primeiroValor(membro, ["COMPLEMENTO", "complemento"]),
      BAIRRO: primeiroValor(membro, ["BAIRRO", "bairro"]),
      CIDADE: primeiroValor(membro, ["CIDADE", "cidade"]),
      ESTADO: primeiroValor(membro, ["ESTADO", "estado", "uf"]),
      DATA_CONVERSAO: primeiroValor(membro, [
        "DATA_CONVERSAO",
        "dataConversao"
      ]),
      DATA_BATISMO_AGUAS: primeiroValor(membro, [
        "DATA_BATISMO_AGUAS",
        "dataBatismoAguas",
        "dataBatismo"
      ]),
      DATA_BATISMO_ESPIRITO: primeiroValor(membro, [
        "DATA_BATISMO_ESPIRITO",
        "dataBatismoEspirito"
      ]),
      CARGO: primeiroValor(membro, ["CARGO", "cargo"]),
      CONGREGACAO: primeiroValor(membro, ["CONGREGACAO", "congregacao"]),
      SITUACAO: primeiroValor(membro, ["SITUACAO", "situacao"], "Ativo"),
      DATA_ADMISSAO: primeiroValor(membro, ["DATA_ADMISSAO", "dataAdmissao"]),
      IGREJA_ORIGEM: primeiroValor(membro, ["IGREJA_ORIGEM", "igrejaOrigem"]),
      DATA_CONSAGRACAO: primeiroValor(membro, [
        "DATA_CONSAGRACAO",
        "dataConsagracao"
      ]),
      NOME_PAI: primeiroValor(membro, ["NOME_PAI", "nomePai", "pai"]),
      NOME_MAE: primeiroValor(membro, ["NOME_MAE", "nomeMae", "mae"]),
      CONJUGE: primeiroValor(membro, ["CONJUGE", "conjuge", "nomeConjuge"]),
      DATA_CASAMENTO: primeiroValor(membro, [
        "DATA_CASAMENTO",
        "dataCasamento"
      ]),
      ID_FAMILIA: primeiroValor(membro, ["ID_FAMILIA", "idFamilia"]),
      OBSERVACOES: primeiroValor(membro, ["OBSERVACOES", "observacoes"]),
      OBSERVACAO_CARTEIRINHA: primeiroValor(membro, [
        "OBSERVACAO_CARTEIRINHA",
        "observacaoCarteirinha"
      ]),
      QR_CODE: primeiroValor(membro, ["QR_CODE", "qrCode"]),
      VALIDADE_CARTEIRINHA: primeiroValor(membro, [
        "VALIDADE_CARTEIRINHA",
        "validadeCarteirinha"
      ]),
      DATA_CADASTRO: primeiroValor(membro, [
        "DATA_CADASTRO",
        "dataCadastro",
        "criadoEm"
      ])
    };

    CAMPOS_DATA.forEach((campo) => {
      if (Object.prototype.hasOwnProperty.call(normalizado, campo)) {
        normalizado[campo] = normalizarDataParaCampo(normalizado[campo]);
      }
    });

    return normalizado;
  }

  function preencherCampoSeguro(campo, valor) {
    if (!campo) return;

    if (campo instanceof HTMLSelectElement && valor) {
      const existe = Array.from(campo.options).some(
        (opcao) => String(opcao.value) === String(valor)
      );
      if (!existe) campo.add(new Option(String(valor), String(valor)));
    }

    if (campo.type === "checkbox") {
      campo.checked =
        valor === true || texto(valor).toLowerCase() === "true" || valor === 1;
    } else if (campo.type === "radio") {
      campo.checked = String(campo.value) === String(valor ?? "");
    } else {
      campo.value = valor ?? "";
    }
  }

  function preencherFormulario(membro) {
    const dados = normalizarMembro(membro);

    formulario
      .querySelectorAll("input[name]:not([type='file']), select[name], textarea[name]")
      .forEach((campo) => {
        const nome = campo.name;
        let valor = primeiroValor(dados, [
          nome,
          nome.toLowerCase(),
          nome.toLowerCase().replace(/_([a-z])/g, (_, letra) => letra.toUpperCase())
        ]);

        if (CAMPOS_DATA.includes(nome)) {
          valor = normalizarDataParaCampo(valor);
        }

        preencherCampoSeguro(campo, valor);
      });

    const campoId = formulario.elements.namedItem("ID") || formulario.elements.namedItem("id");
    if (campoId) campoId.value = idMembro;

    modulo.atualizarFoto(dados.FOTO_URL || "");
    modulo.atualizarResumo(dados);

    const statusFoto = document.getElementById("statusFoto");
    if (statusFoto) {
      statusFoto.textContent = dados.FOTO_URL
        ? "Foto atual do membro carregada."
        : "Este membro ainda não possui foto cadastrada.";
    }

    const titulo = document.getElementById("tituloEditarMembro");
    if (titulo && dados.NOME_COMPLETO) {
      titulo.textContent = `Editar membro — ${dados.NOME_COMPLETO}`;
    }
  }

  function configurarResumo() {
    modulo.configurarResumoEmTempoReal(formulario);
  }

  function configurarCancelamento() {
    const destino = `visualizar-membro.html?id=${encodeURIComponent(idMembro)}`;

    document
      .querySelectorAll(
        "#botaoCancelarTopo, #botaoCancelarRodape, #botaoCancelarEdicao"
      )
      .forEach((botao) => {
        if (botao.tagName === "A") botao.href = destino;

        botao.addEventListener("click", (evento) => {
          if (alteracoesSalvas || !formularioAlterado()) return;

          if (!window.confirm("Existem alterações não salvas. Deseja sair?")) {
            evento.preventDefault();
          }
        });
      });
  }

  function formularioAlterado() {
    if (!membroCarregado || !formulario) return false;

    const atual = modulo.obterDados(formulario);
    const original = normalizarMembro(membroCarregado);

    return Object.entries(atual).some(([nome, valor]) => {
      if (nome === "FOTO_URL") {
        return texto(valor) !== texto(original.FOTO_URL);
      }

      const originalValor = primeiroValor(original, [
        nome,
        nome.toLowerCase(),
        nome.toLowerCase().replace(/_([a-z])/g, (_, letra) => letra.toUpperCase())
      ]);

      const valorComparado = CAMPOS_DATA.includes(nome)
        ? normalizarDataParaCampo(originalValor)
        : texto(originalValor);

      return texto(valor) !== texto(valorComparado);
    }) || Boolean(modulo.obterArquivoFoto());
  }

  async function prepararFoto(dados) {
    const arquivo = modulo.obterArquivoFoto();
    if (!arquivo) return dados;

    modulo.mostrarAviso("Enviando a nova foto do membro...", "carregando");
    const fotoUrl = await modulo.enviarFoto(arquivo);

    const campoFoto = document.getElementById("FOTO_URL");
    if (campoFoto) campoFoto.value = fotoUrl;

    modulo.atualizarFoto(fotoUrl);

    return {
      ...dados,
      FOTO_URL: fotoUrl,
      foto: fotoUrl
    };
  }

  function prepararDadosCompletos(dadosFormulario) {
    const dadosApi = modulo.prepararDadosApi(dadosFormulario);

    return {
      ...dadosApi,
      id: idMembro,
      nomeCompleto: primeiroValor(dadosFormulario, ["NOME_COMPLETO", "nomeCompleto"]),
      sexo: primeiroValor(dadosFormulario, ["SEXO", "sexo"]),
      profissao: primeiroValor(dadosFormulario, ["PROFISSAO", "profissao"]),
      naturalidade: primeiroValor(dadosFormulario, ["NATURALIDADE", "naturalidade"]),
      nacionalidade: primeiroValor(dadosFormulario, ["NACIONALIDADE", "nacionalidade"]),
      orgaoEmissor: primeiroValor(dadosFormulario, ["ORGAO_EMISSOR", "orgaoEmissor"]),
      dataEmissaoRg: primeiroValor(dadosFormulario, ["DATA_EMISSAO_RG", "dataEmissaoRg"]),
      dataBatismoAguas: primeiroValor(dadosFormulario, ["DATA_BATISMO_AGUAS", "dataBatismoAguas", "dataBatismo"]),
      dataBatismoEspirito: primeiroValor(dadosFormulario, ["DATA_BATISMO_ESPIRITO", "dataBatismoEspirito"]),
      dataAdmissao: primeiroValor(dadosFormulario, ["DATA_ADMISSAO", "dataAdmissao"]),
      igrejaOrigem: primeiroValor(dadosFormulario, ["IGREJA_ORIGEM", "igrejaOrigem"]),
      dataConsagracao: primeiroValor(dadosFormulario, ["DATA_CONSAGRACAO", "dataConsagracao"]),
      nomePai: primeiroValor(dadosFormulario, ["NOME_PAI", "nomePai", "pai"]),
      nomeMae: primeiroValor(dadosFormulario, ["NOME_MAE", "nomeMae", "mae"]),
      dataCasamento: primeiroValor(dadosFormulario, ["DATA_CASAMENTO", "dataCasamento"]),
      observacoes: primeiroValor(dadosFormulario, ["OBSERVACOES", "observacoes"]),
      numeroCarteirinha: primeiroValor(dadosFormulario, ["NUMERO_CARTEIRINHA", "numeroCarteirinha"]),
      dataEmissaoCarteirinha: primeiroValor(dadosFormulario, ["DATA_EMISSAO_CARTEIRINHA", "dataEmissaoCarteirinha"])
    };
  }

  function validarResposta(resultado) {
    if (!resultado) {
      throw new Error("A API não retornou uma resposta para a atualização.");
    }

    if (resultado.sucesso === false || resultado.ok === false) {
      throw new Error(
        resultado.mensagem || resultado.message || "Não foi possível atualizar o membro."
      );
    }

    return resultado;
  }

  async function carregarMembro() {
    modulo.definirCarregando(true, "Carregando dados do membro...");
    modulo.mostrarAviso("Carregando os dados do membro...", "carregando");

    try {
      const membro = await modulo.buscarMembro(idMembro);
      membroCarregado = membro;
      preencherFormulario(membro);
      configurarResumo();
      configurarCancelamento();
      modulo.definirSomenteLeitura(formulario, false);
      modulo.mostrarAviso("Cadastro carregado. Faça as alterações necessárias.", "informacao");
    } catch (erro) {
      console.error("[EDITAR MEMBRO] Erro ao carregar:", erro);
      modulo.definirSomenteLeitura(formulario, true);
      modulo.mostrarAviso(
        erro?.message || "Não foi possível carregar os dados do membro.",
        "erro"
      );
    } finally {
      modulo.definirCarregando(false);
    }
  }

  async function salvarAlteracoes(evento) {
    evento.preventDefault();
    if (enviando) return;

    const validacao = modulo.validar(formulario);
    if (!validacao.valido) {
      modulo.mostrarAviso(validacao.mensagem, "erro");
      return;
    }

    enviando = true;
    modulo.definirCarregando(true, "Salvando alterações...");
    modulo.mostrarAviso("Aguarde enquanto as alterações são salvas.", "carregando");

    try {
      let dadosFormulario = modulo.obterDados(formulario);
      dadosFormulario.id = idMembro;
      dadosFormulario.ID = idMembro;

      let dados = prepararDadosCompletos(dadosFormulario);
      dados = await prepararFoto(dados);

        const resultado = validarResposta(
  await modulo.obterAuth().chamarApi({
    acao: "atualizar",
    id: idMembro,
    dados
  })
);

      alteracoesSalvas = true;
      modulo.mostrarAviso(
        resultado.mensagem || "Cadastro atualizado com sucesso.",
        "sucesso"
      );

      window.setTimeout(() => {
        window.location.href =
          "visualizar-membro.html?id=" + encodeURIComponent(idMembro);
      }, 900);
    } catch (erro) {
      console.error("[EDITAR MEMBRO] Erro ao salvar:", erro);
      modulo.mostrarAviso(
        erro?.message || "Não foi possível salvar as alterações.",
        "erro"
      );
    } finally {
      enviando = false;
      modulo.definirCarregando(false);
    }
  }

  function configurarPreviewFoto() {
    const campoArquivo = document.getElementById("arquivoFotoMembro");
    const statusFoto = document.getElementById("statusFoto");
    if (!campoArquivo) return;

    campoArquivo.addEventListener("change", () => {
      const arquivo = campoArquivo.files?.[0] || null;

      if (urlPreviewFoto) {
        URL.revokeObjectURL(urlPreviewFoto);
        urlPreviewFoto = "";
      }

      if (!arquivo) {
        modulo.atualizarFoto(
          primeiroValor(normalizarMembro(membroCarregado), ["FOTO_URL"])
        );
        if (statusFoto) statusFoto.textContent = "Nenhuma nova foto selecionada.";
        return;
      }

      const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];
      if (!tiposPermitidos.includes(arquivo.type)) {
        campoArquivo.value = "";
        modulo.mostrarAviso("A foto deve estar no formato JPG, PNG ou WebP.", "erro");
        return;
      }

      if (arquivo.size > 5 * 1024 * 1024) {
        campoArquivo.value = "";
        modulo.mostrarAviso("A foto deve ter no máximo 5 MB.", "erro");
        return;
      }

      urlPreviewFoto = URL.createObjectURL(arquivo);
      modulo.atualizarFoto(urlPreviewFoto);

      if (statusFoto) {
        statusFoto.textContent = `Nova foto selecionada: ${arquivo.name}`;
      }
    });
  }

  function inicializar() {
    try {
      modulo = obterModulo();
      formulario = obterFormulario();

      if (!formulario) {
        throw new Error("O formulário de edição do membro não foi encontrado.");
      }

      idMembro = texto(modulo.obterIdUrl());
      if (!idMembro) {
        throw new Error("Não foi informado qual membro deve ser editado.");
      }

      modulo.definirSomenteLeitura(formulario, true);
      formulario.addEventListener("submit", salvarAlteracoes);
      configurarPreviewFoto();
      carregarMembro();
    } catch (erro) {
      console.error("[EDITAR MEMBRO] Erro na inicialização:", erro);

      const aviso = document.getElementById("avisoFicha");
      if (aviso) {
        aviso.textContent = erro?.message || "Não foi possível inicializar a edição.";
        aviso.classList.add("ativo");
      }
    }
  }

  window.addEventListener("beforeunload", (evento) => {
    if (urlPreviewFoto) URL.revokeObjectURL(urlPreviewFoto);

    if (!alteracoesSalvas && formularioAlterado()) {
      evento.preventDefault();
      evento.returnValue = "";
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializar, { once: true });
  } else {
    inicializar();
  }
})(window, document);
