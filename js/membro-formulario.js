/**
 * ============================================================================
 * VIDAS RENOVADAS GESTÃO 2.0
 * Arquivo: js/membro-formulario.js
 * Descrição: Funções compartilhadas da ficha digital de membros
 * ============================================================================
 *
 * Dependências obrigatórias, nesta ordem:
 *   1. js/configuracoes.js
 *   2. js/api.js
 *   3. js/app.js
 *   4. js/auth.js
 *   5. js/membro-formulario.js
 * ============================================================================
 */

(function (window, document) {
  "use strict";

  const SELETOR_CAMPOS =
    "input[name]:not([type='file']), select[name], textarea[name]";

  const estado = {
    enviando: false
  };

  function obterAuth() {
    const auth = window.VRGAuth || window.Auth;

    if (!auth || typeof auth.chamarApi !== "function") {
      throw new Error(
        "O módulo de autenticação não foi carregado corretamente."
      );
    }

    return auth;
  }

  function obterFormulario(formularioOuSeletor) {
    if (formularioOuSeletor instanceof HTMLFormElement) {
      return formularioOuSeletor;
    }

    if (typeof formularioOuSeletor === "string") {
      return document.querySelector(formularioOuSeletor);
    }

    return (
      document.getElementById("formNovoMembro") ||
      document.getElementById("formEditarMembro") ||
      document.querySelector("form.edicao-formulario")
    );
  }

  function texto(valor) {
    return String(valor ?? "").trim();
  }

  function somenteNumeros(valor) {
    return texto(valor).replace(/\D/g, "");
  }

  function escaparHtml(valor) {
    return String(valor ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function obterPrimeiroValor(objeto, nomes, valorPadrao = "") {
    for (const nome of nomes) {
      const valor = objeto?.[nome];

      if (
        valor !== undefined &&
        valor !== null &&
        String(valor).trim() !== ""
      ) {
        return valor;
      }
    }

    return valorPadrao;
  }

  function normalizarRespostaMembro(resultado) {
    const membro =
      resultado?.membro ??
      resultado?.dados ??
      resultado?.resultado ??
      resultado;

    if (!membro || typeof membro !== "object" || Array.isArray(membro)) {
      throw new Error("A API não retornou os dados do membro.");
    }

    return membro;
  }

  function obterDados(formularioOuSeletor) {
    const formulario = obterFormulario(formularioOuSeletor);

    if (!formulario) {
      throw new Error("O formulário da ficha do membro não foi encontrado.");
    }

    const dados = {};

    formulario.querySelectorAll(SELETOR_CAMPOS).forEach((campo) => {
      if (!campo.name || campo.disabled) return;

      if (campo.type === "checkbox") {
        dados[campo.name] = campo.checked;
        return;
      }

      if (campo.type === "radio") {
        if (campo.checked) {
          dados[campo.name] = texto(campo.value);
        }
        return;
      }

      dados[campo.name] = texto(campo.value);
    });

    return dados;
  }
  function normalizarSituacao(valor) {
    const situacao = texto(valor);

    if (!situacao) return "Ativo";

    const chave = situacao
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();

    const situacoesConhecidas = {
      ATIVO: "Ativo",
      INATIVO: "Inativo",
      AFASTADO: "Afastado",
      TRANSFERIDO: "Transferido",
      FALECIDO: "Falecido",
      DISCIPLINADO: "Disciplinado"
    };

    return situacoesConhecidas[chave] || situacao;
  }

  function prepararDadosApi(dadosOriginais) {
    const origem = dadosOriginais || {};

    const valor = (...nomes) => obterPrimeiroValor(origem, nomes, "");

    return {
      id: valor("id", "ID", "codigo", "CODIGO"),
      nomeCompleto: valor("nomeCompleto", "NOME_COMPLETO"),
      cpf: valor("cpf", "CPF"),
      rg: valor("rg", "RG"),
      dataNascimento: valor("dataNascimento", "DATA_NASCIMENTO"),
      estadoCivil: valor("estadoCivil", "ESTADO_CIVIL"),
      conjuge: valor("conjuge", "CONJUGE", "nomeConjuge", "NOME_CONJUGE"),
      pai: valor("pai", "PAI", "nomePai", "NOME_PAI"),
      mae: valor("mae", "MAE", "nomeMae", "NOME_MAE"),
      telefone: valor("telefone", "TELEFONE"),
      whatsapp: valor("whatsapp", "WHATSAPP"),
      email: valor("email", "EMAIL"),
      cep: valor("cep", "CEP"),
      endereco: valor("endereco", "ENDERECO", "logradouro", "LOGRADOURO"),
      numero: valor("numero", "NUMERO"),
      complemento: valor("complemento", "COMPLEMENTO"),
      bairro: valor("bairro", "BAIRRO"),
      cidade: valor("cidade", "CIDADE"),
      estado: valor("estado", "ESTADO", "uf", "UF"),
      cargo: valor("cargo", "CARGO"),
      congregacao: valor("congregacao", "CONGREGACAO"),
      dataConversao: valor("dataConversao", "DATA_CONVERSAO"),
      dataBatismo: valor(
        "dataBatismo",
        "DATA_BATISMO",
        "dataBatismoAguas",
        "DATA_BATISMO_AGUAS"
      ),
      situacao: normalizarSituacao(valor("situacao", "SITUACAO")),
      foto: valor("foto", "FOTO", "fotoUrl", "FOTO_URL", "urlFoto"),
      qrCode: valor(
        "qrCode",
        "QR_CODE",
        "codigoDigital",
        "CODIGO_DIGITAL",
        "tokenPublico"
      ),
      observacaoCarteirinha: valor(
        "observacaoCarteirinha",
        "OBSERVACAO_CARTEIRINHA",
        "observacoes",
        "OBSERVACOES"
      ),
      idFamilia: valor("idFamilia", "ID_FAMILIA"),
      validadeCarteirinha: valor(
        "validadeCarteirinha",
        "VALIDADE_CARTEIRINHA"
      )
    };
  }
  function validarCPFBasico(cpf) {
    const numeros = somenteNumeros(cpf);

    if (!numeros) return true;
    if (numeros.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(numeros)) return false;

    function calcularDigito(base, pesoInicial) {
      let soma = 0;

      for (let indice = 0; indice < base.length; indice += 1) {
        soma += Number(base[indice]) * (pesoInicial - indice);
      }

      const resto = (soma * 10) % 11;
      return resto === 10 ? 0 : resto;
    }

    const primeiro = calcularDigito(numeros.slice(0, 9), 10);
    const segundo = calcularDigito(numeros.slice(0, 10), 11);

    return (
      primeiro === Number(numeros[9]) &&
      segundo === Number(numeros[10])
    );
  }

  function validar(formularioOuSeletor) {
    const formulario = obterFormulario(formularioOuSeletor);

    if (!formulario) {
      return {
        valido: false,
        mensagem: "O formulário da ficha do membro não foi encontrado."
      };
    }

    const nome = formulario.querySelector("[name='NOME_COMPLETO']");
    const congregacao = formulario.querySelector("[name='CONGREGACAO']");
    const cpf = formulario.querySelector("[name='CPF']");

    if (!nome || !texto(nome.value)) {
      nome?.focus();

      return {
        valido: false,
        campo: nome,
        mensagem: "Informe o nome completo do membro."
      };
    }

    if (!congregacao || !texto(congregacao.value)) {
      congregacao?.focus();

      return {
        valido: false,
        campo: congregacao,
        mensagem: "Selecione a congregação do membro."
      };
    }

    if (cpf && texto(cpf.value) && !validarCPFBasico(cpf.value)) {
      cpf.focus();

      return {
        valido: false,
        campo: cpf,
        mensagem: "Informe um CPF válido."
      };
    }

    if (!formulario.checkValidity()) {
      const campoInvalido = formulario.querySelector(":invalid");
      campoInvalido?.focus();

      return {
        valido: false,
        campo: campoInvalido,
        mensagem: "Revise os campos obrigatórios da ficha."
      };
    }

    return {
      valido: true,
      mensagem: ""
    };
  }

  function mostrarAviso(mensagem, tipo = "informacao") {
    const aviso = document.getElementById("avisoFicha");

    if (!aviso) return;

    aviso.textContent = mensagem;
    aviso.classList.add("ativo");
    aviso.dataset.tipo = tipo;

    aviso.style.borderColor = "";
    aviso.style.background = "";
    aviso.style.color = "";

    if (tipo === "erro") {
      aviso.style.borderColor = "#e5b8b8";
      aviso.style.background = "#fff0f0";
      aviso.style.color = "#8a2424";
    } else if (tipo === "sucesso") {
      aviso.style.borderColor = "#b9dfca";
      aviso.style.background = "#eaf8f0";
      aviso.style.color = "#16633f";
    } else if (tipo === "carregando") {
      aviso.style.borderColor = "#bfd3e5";
      aviso.style.background = "#edf5fb";
      aviso.style.color = "#245f91";
    }
  }

  function definirCarregando(ativo, mensagem = "Processando...") {
    estado.enviando = Boolean(ativo);

    const carregamento = document.getElementById("carregamentoGlobal");

    if (carregamento) {
      carregamento.setAttribute("aria-hidden", ativo ? "false" : "true");
      carregamento.classList.toggle("ativo", Boolean(ativo));

      if (ativo) {
        carregamento.style.display = "flex";
      } else {
        carregamento.style.display = "";
      }

      const textoCarregamento = carregamento.querySelector(
        "[role='status'] span:last-child"
      );

      if (textoCarregamento && mensagem) {
        textoCarregamento.textContent = mensagem;
      }
    }

    document
      .querySelectorAll(
        "#botaoCadastrarTopo, #botaoCadastrarRodape, " +
        "#botaoSalvarTopo, #botaoSalvarRodape, button[type='submit']"
      )
      .forEach((botao) => {
        botao.disabled = Boolean(ativo);
        botao.setAttribute("aria-busy", ativo ? "true" : "false");
      });
  }

  function obterArquivoFoto() {
    const campo = document.getElementById("arquivoFotoMembro");

    if (!campo || !campo.files || !campo.files.length) {
      return null;
    }

    return campo.files[0];
  }

  function arquivoParaBase64(arquivo) {
    return new Promise((resolve, reject) => {
      const leitor = new FileReader();

      leitor.onload = function () {
        const resultado = String(leitor.result || "");
        const separador = resultado.indexOf(",");

        resolve(separador >= 0 ? resultado.slice(separador + 1) : resultado);
      };

      leitor.onerror = function () {
        reject(new Error("Não foi possível ler a foto selecionada."));
      };

      leitor.readAsDataURL(arquivo);
    });
  }

  async function enviarFoto(arquivo) {
    if (!arquivo) return "";

    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];

    if (!tiposPermitidos.includes(arquivo.type)) {
      throw new Error("A foto deve estar no formato JPG, PNG ou WebP.");
    }

    if (arquivo.size > 5 * 1024 * 1024) {
      throw new Error("A foto deve ter no máximo 5 MB.");
    }

    const base64 = await arquivoParaBase64(arquivo);

    const resultado = await obterAuth().chamarApi({
      acao: "uploadFoto",
      foto: {
        nome: arquivo.name,
        tipo: arquivo.type,
        tamanho: arquivo.size,
        base64: base64
      }
    });

    if (resultado?.sucesso === false) {
      throw new Error(
        resultado.mensagem || "Não foi possível enviar a foto do membro."
      );
    }

    const url =
  resultado?.foto?.url ||
  resultado?.arquivo?.url ||
  resultado?.dados?.foto?.url ||
  resultado?.dados?.arquivo?.url ||
  obterPrimeiroValor(
    resultado,
    [
      "url",
      "fotoUrl",
      "FOTO_URL",
      "link",
      "arquivoUrl"
    ],
    obterPrimeiroValor(
      resultado?.dados,
      ["url", "fotoUrl", "FOTO_URL", "link", "arquivoUrl"],
      ""
    )
  );

    if (!url) {
      throw new Error(
        "A foto foi enviada, mas a API não retornou o endereço do arquivo."
      );
    }

    return texto(url);
  }

  function preencherFormulario(formularioOuSeletor, membro) {
    const formulario = obterFormulario(formularioOuSeletor);

    if (!formulario) {
      throw new Error("O formulário da ficha do membro não foi encontrado.");
    }

    formulario.querySelectorAll(SELETOR_CAMPOS).forEach((campo) => {
      const valor = obterPrimeiroValor(
        membro,
        [
          campo.name,
          campo.name.toLowerCase(),
          campo.name
            .toLowerCase()
            .replace(/_([a-z])/g, (_, letra) => letra.toUpperCase())
        ],
        ""
      );

      if (campo.type === "checkbox") {
        campo.checked =
          valor === true ||
          String(valor).toLowerCase() === "true" ||
          String(valor) === "1";
      } else if (campo.type === "radio") {
        campo.checked = String(campo.value) === String(valor);
      } else {
        campo.value = valor ?? "";
      }

      campo.dispatchEvent(new Event("input", { bubbles: true }));
      campo.dispatchEvent(new Event("change", { bubbles: true }));
    });

    atualizarResumo(membro);
    atualizarFoto(
      obterPrimeiroValor(
        membro,
        ["FOTO_URL", "fotoUrl", "foto", "urlFoto"],
        ""
      )
    );
  }

  function atualizarResumo(membroOuDados) {
    const dados = membroOuDados || {};

    const mapa = {
      resumoCodigo: obterPrimeiroValor(
        dados,
        ["ID", "id", "codigo", "NUMERO_CARTEIRINHA", "numeroCarteirinha"],
        "Será gerado"
      ),
      resumoSituacao: obterPrimeiroValor(
        dados,
        ["SITUACAO", "situacao"],
        "Ativo"
      ),
      resumoDataCadastro: obterPrimeiroValor(
        dados,
        ["DATA_CADASTRO", "dataCadastro", "criadoEm"],
        "Será registrada"
      )
    };

    Object.entries(mapa).forEach(([id, valor]) => {
      const elemento = document.getElementById(id);
      if (elemento) elemento.textContent = texto(valor) || "—";
    });
  }

  function atualizarFoto(url) {
    const foto = document.getElementById("fotoMembro");
    const placeholder = document.getElementById("fotoMembroPlaceholder");
    const campoUrl = document.getElementById("FOTO_URL");

    if (campoUrl && url) {
      campoUrl.value = texto(url);
    }

    if (!foto || !placeholder) return;

    if (url) {
      foto.src = texto(url);
      foto.hidden = false;
      placeholder.hidden = true;
    } else {
      foto.removeAttribute("src");
      foto.hidden = true;
      placeholder.hidden = false;
    }
  }

  function definirSomenteLeitura(formularioOuSeletor, somenteLeitura = true) {
    const formulario = obterFormulario(formularioOuSeletor);

    if (!formulario) return;

    formulario
      .querySelectorAll("input, select, textarea, button[type='submit']")
      .forEach((campo) => {
        if (
          campo.type === "hidden" ||
          campo.id === "arquivoFotoMembro"
        ) {
          return;
        }

        if (
          campo.tagName === "SELECT" ||
          campo.type === "checkbox" ||
          campo.type === "radio" ||
          campo.type === "file" ||
          campo.tagName === "BUTTON"
        ) {
          campo.disabled = Boolean(somenteLeitura);
        } else {
          campo.readOnly = Boolean(somenteLeitura);
        }
      });

    document
      .querySelectorAll(".edicao-foto-acoes")
      .forEach((elemento) => {
        elemento.hidden = Boolean(somenteLeitura);
      });
  }

  function obterIdUrl() {
    return texto(new URLSearchParams(window.location.search).get("id"));
  }

  async function buscarMembro(id) {
    const codigo = texto(id);

    if (!codigo) {
      throw new Error("O identificador do membro não foi informado.");
    }

    const resultado = await obterAuth().chamarApi({
      acao: "buscarMembro",
      id: codigo
    });

    if (resultado?.sucesso === false) {
      throw new Error(
        resultado.mensagem || "Não foi possível localizar o membro."
      );
    }

    return normalizarRespostaMembro(resultado);
  }

  function extrairIdResultado(resultado) {
    return texto(
      obterPrimeiroValor(
        resultado,
        ["id", "ID", "codigo", "numeroCarteirinha"],
        obterPrimeiroValor(
          resultado?.membro,
          ["id", "ID", "codigo", "numeroCarteirinha"],
          obterPrimeiroValor(
            resultado?.dados,
            ["id", "ID", "codigo", "numeroCarteirinha"],
            ""
          )
        )
      )
    );
  }

  function limparFormulario(formularioOuSeletor) {
    const formulario = obterFormulario(formularioOuSeletor);

    if (!formulario) return;

    formulario.reset();

    const fotoUrl = document.getElementById("FOTO_URL");
    const arquivoFoto = document.getElementById("arquivoFotoMembro");

    if (fotoUrl) fotoUrl.value = "";
    if (arquivoFoto) arquivoFoto.value = "";

    atualizarFoto("");
    atualizarResumo({});
  }

  function configurarResumoEmTempoReal(formularioOuSeletor) {
    const formulario = obterFormulario(formularioOuSeletor);

    if (!formulario) return;

    formulario.addEventListener("input", function () {
      atualizarResumo(obterDados(formulario));
    });

    formulario.addEventListener("change", function () {
      atualizarResumo(obterDados(formulario));
    });
  }

  window.VRGMembroFormulario = Object.freeze({
    obterAuth,
    obterFormulario,
    obterDados,
    prepararDadosApi,
    validar,
    mostrarAviso,
    definirCarregando,
    obterArquivoFoto,
    enviarFoto,
    preencherFormulario,
    atualizarResumo,
    atualizarFoto,
    definirSomenteLeitura,
    obterIdUrl,
    buscarMembro,
    extrairIdResultado,
    normalizarRespostaMembro,
    limparFormulario,
    configurarResumoEmTempoReal,
    escaparHtml
  });
})(window, document);
