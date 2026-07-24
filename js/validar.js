(() => {
  "use strict";

  const elementos = {};

  document.addEventListener("DOMContentLoaded", iniciar);

  async function iniciar() {
    mapearElementos();

    const token = obterToken();

    if (!token) {
      exibirErro(
        "Credencial não localizada",
        "O endereço acessado não possui um código de credencial válido."
      );
      return;
    }

    try {
      const resposta = await consultarCredencial(token);
      const dados = normalizarResposta(resposta);

      if (!dados) {
        throw new Error("Os dados da credencial não foram retornados.");
      }

      const situacao = normalizarTexto(
        primeiroValor(dados.situacao, dados.status, dados.situacaoMembro)
      );

      if (situacao !== "ativo") {
        exibirErro(
          "Credencial indisponível",
          "Esta credencial não está disponível para consulta pública. Procure a secretaria do Ministério Vidas Renovadas para mais informações."
        );
        return;
      }

      preencherCredencial(dados);
      exibirCredencial();
    } catch (erro) {
      console.error("Erro ao validar credencial:", erro);

      exibirErro(
        "Não foi possível consultar a credencial",
        obterMensagemErro(erro)
      );
    }
  }

  function mapearElementos() {
    const ids = [
      "estadoCarregando",
      "estadoErro",
      "tituloErro",
      "mensagemErro",
      "credencialDigital",
      "fotoMembro",
      "fotoPlaceholder",
      "seloCredencial",
      "nomeMembro",
      "cargoMembro",
      "congregacaoMembro",
      "situacaoMembro",
      "dataEmissao",
      "dataValidade",
      "dataNascimento",
      "estadoCivil",
      "campoConjuge",
      "nomeConjuge",
      "secaoContato",
      "telefoneMembro",
      "secaoObservacoes",
      "observacoesMembro",
      "dataConsulta"
    ];

    ids.forEach((id) => {
      elementos[id] = document.getElementById(id);
    });
  }

  function obterToken() {
    const parametros = new URLSearchParams(window.location.search);

    return limparValor(
      parametros.get("token") ||
      parametros.get("id") ||
      parametros.get("codigo")
    );
  }

  async function consultarCredencial(token) {
    if (!window.VR_API || typeof window.VR_API.enviar !== "function") {
      throw new Error(
        "O serviço de consulta não está disponível. Verifique o carregamento do arquivo js/api.js."
      );
    }

    return window.VR_API.enviar("validarCarteirinha", { token });
  }

  function normalizarResposta(resposta) {
    if (!resposta) {
      return null;
    }

    if (resposta.sucesso === false) {
      throw new Error(
        resposta.mensagem ||
        resposta.erro ||
        "A credencial não pôde ser validada."
      );
    }

    return (
      resposta.dados ||
      resposta.credencial ||
      resposta.carteirinha ||
      resposta.membro ||
      resposta.data ||
      resposta
    );
  }

  function preencherCredencial(dados) {
    const membro = dados.membro || dados.titular || {};
    const credencial = dados.credencial || dados.carteirinha || dados;

    const nome = primeiroValor(
      membro.nome,
      membro.nomeCompleto,
      dados.nome,
      dados.nomeCompleto,
      credencial.nome,
      "Nome não informado"
    );

    const cargo = primeiroValor(
      membro.cargo,
      membro.funcaoMinisterial,
      membro.funcao,
      dados.cargo,
      dados.funcaoMinisterial,
      dados.funcao,
      credencial.cargo,
      credencial.funcaoMinisterial,
      "Membro"
    );

    const congregacao = primeiroValor(
      membro.congregacao,
      dados.congregacao,
      credencial.congregacao,
      "Não informada"
    );

    const situacao = primeiroValor(
      membro.situacao,
      dados.situacao,
      dados.status,
      credencial.situacao,
      "Ativo"
    );

    const emissao = primeiroValor(
      credencial.dataEmissao,
      credencial.emissao,
      dados.dataEmissao,
      dados.emissao
    );

    const validade = primeiroValor(
      credencial.dataValidade,
      credencial.validade,
      dados.dataValidade,
      dados.validade
    );

    const nascimento = primeiroValor(
      membro.dataNascimento,
      membro.nascimento,
      dados.dataNascimento,
      dados.nascimento
    );

    const estadoCivil = primeiroValor(
      membro.estadoCivil,
      dados.estadoCivil
    );

    const conjuge = primeiroValor(
      membro.nomeConjuge,
      membro.conjuge,
      dados.nomeConjuge,
      dados.conjuge
    );

    const telefone = primeiroValor(
      membro.telefone,
      membro.celular,
      membro.whatsapp,
      dados.telefone,
      dados.celular,
      dados.whatsapp
    );

    const observacoes = primeiroValor(
      credencial.observacoes,
      membro.observacoes,
      dados.observacoes
    );

    const foto = primeiroValor(
      membro.fotoUrl,
      membro.foto,
      membro.urlFoto,
      dados.fotoUrl,
      dados.foto,
      dados.urlFoto,
      credencial.fotoUrl,
      credencial.foto
    );

    definirTexto(elementos.nomeMembro, nome);
    definirTexto(elementos.cargoMembro, cargo);
    definirTexto(elementos.congregacaoMembro, congregacao);
    definirTexto(elementos.situacaoMembro, formatarSituacao(situacao));
    definirTexto(elementos.dataEmissao, formatarData(emissao));
    definirTexto(elementos.dataValidade, formatarData(validade));
    definirTexto(elementos.dataNascimento, formatarData(nascimento));
    definirTexto(elementos.estadoCivil, estadoCivil || "Não informado");

    configurarFoto(foto, nome);
    configurarConjuge(estadoCivil, conjuge);
    configurarContato(telefone);
    configurarObservacoes(observacoes);
    configurarValidade(validade);

    definirTexto(
      elementos.dataConsulta,
      `Consulta realizada em ${formatarDataHora(new Date())}`
    );
  }

  function configurarFoto(url, nome) {
    const foto = limparValor(url);

    if (!foto) {
      elementos.fotoMembro.hidden = true;
      elementos.fotoPlaceholder.hidden = false;
      return;
    }

    elementos.fotoMembro.alt = `Foto de ${nome}`;
    elementos.fotoMembro.onload = () => {
      elementos.fotoPlaceholder.hidden = true;
      elementos.fotoMembro.hidden = false;
    };

    elementos.fotoMembro.onerror = () => {
      elementos.fotoMembro.hidden = true;
      elementos.fotoPlaceholder.hidden = false;
    };

    elementos.fotoMembro.src = foto;
  }

  function configurarConjuge(estadoCivil, conjuge) {
    const estado = normalizarTexto(estadoCivil);
    const nome = limparValor(conjuge);

    const casado =
      estado.includes("casad") ||
      estado.includes("uniao estavel") ||
      estado.includes("união estável");

    if (casado && nome) {
      definirTexto(elementos.nomeConjuge, nome);
      elementos.campoConjuge.hidden = false;
      return;
    }

    elementos.campoConjuge.hidden = true;
  }

  function configurarContato(telefone) {
    const valor = limparValor(telefone);

    if (!valor) {
      elementos.secaoContato.hidden = true;
      return;
    }

    definirTexto(elementos.telefoneMembro, formatarTelefone(valor));
    elementos.secaoContato.hidden = false;
  }

  function configurarObservacoes(observacoes) {
    const valor = limparValor(observacoes);

    if (!valor) {
      elementos.secaoObservacoes.hidden = true;
      return;
    }

    definirTexto(elementos.observacoesMembro, valor);
    elementos.secaoObservacoes.hidden = false;
  }

  function configurarValidade(validade) {
    const data = converterParaData(validade);
    const expirada = data && fimDoDia(data) < fimDoDia(new Date());

    elementos.dataValidade.classList.toggle("is-expired", Boolean(expirada));
    elementos.seloCredencial.classList.toggle("is-expired", Boolean(expirada));

    elementos.seloCredencial.textContent = expirada
      ? "Credencial Digital Expirada"
      : "Credencial Digital Oficial";
  }

  function exibirCredencial() {
    elementos.estadoCarregando.hidden = true;
    elementos.estadoErro.hidden = true;
    elementos.credencialDigital.hidden = false;
  }

  function exibirErro(titulo, mensagem) {
    elementos.estadoCarregando.hidden = true;
    elementos.credencialDigital.hidden = true;

    definirTexto(elementos.tituloErro, titulo);
    definirTexto(elementos.mensagemErro, mensagem);

    elementos.estadoErro.hidden = false;
  }

  function definirTexto(elemento, valor) {
    if (elemento) {
      elemento.textContent = limparValor(valor) || "—";
    }
  }

  function primeiroValor(...valores) {
    return valores.find((valor) => limparValor(valor)) || "";
  }

  function limparValor(valor) {
    if (valor === null || valor === undefined) {
      return "";
    }

    return String(valor).trim();
  }

  function normalizarTexto(valor) {
    return limparValor(valor)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function formatarSituacao(valor) {
    const texto = limparValor(valor);

    if (!texto) {
      return "Ativo";
    }

    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
  }

  function converterParaData(valor) {
    const texto = limparValor(valor);

    if (!texto) {
      return null;
    }

    if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
      const [ano, mes, dia] = texto.slice(0, 10).split("-").map(Number);
      return new Date(ano, mes - 1, dia);
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
      const [dia, mes, ano] = texto.split("/").map(Number);
      return new Date(ano, mes - 1, dia);
    }

    const data = new Date(texto);

    return Number.isNaN(data.getTime()) ? null : data;
  }

  function formatarData(valor) {
    const data = converterParaData(valor);

    if (!data) {
      return limparValor(valor) || "—";
    }

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(data);
  }

  function formatarDataHora(data) {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(data);
  }

  function fimDoDia(data) {
    const copia = new Date(data);
    copia.setHours(23, 59, 59, 999);
    return copia;
  }

  function formatarTelefone(valor) {
    const original = limparValor(valor);
    const numeros = original.replace(/\D/g, "");

    if (numeros.length === 11) {
      return numeros.replace(
        /^(\d{2})(\d{5})(\d{4})$/,
        "($1) $2-$3"
      );
    }

    if (numeros.length === 10) {
      return numeros.replace(
        /^(\d{2})(\d{4})(\d{4})$/,
        "($1) $2-$3"
      );
    }

    return original;
  }

  function obterMensagemErro(erro) {
    const mensagem = limparValor(erro && erro.message);

    if (
      mensagem &&
      !mensagem.toLowerCase().includes("failed to fetch") &&
      !mensagem.toLowerCase().includes("networkerror")
    ) {
      return mensagem;
    }

    return "Não foi possível confirmar esta credencial no momento. Verifique sua conexão e tente novamente.";
  }
})();
