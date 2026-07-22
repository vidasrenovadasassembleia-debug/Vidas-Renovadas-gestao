(() => {
  "use strict";

  /*
   * Projeto Neemias / Vidas Renovadas Gestão
   * Arquivo: js/carteirinha.js
   *
   * Este arquivo:
   * 1. busca os dados do membro;
   * 2. preenche a carteirinha;
   * 3. exibe foto, situação e validade;
   * 4. gera um QR Code para a validação pública;
   * 5. permite imprimir a carteirinha.
   */

  const API_URL =
    "https://script.google.com/macros/s/AKfycbzwbSdAn5cyek9DrBy4SVGEZKI5odv6IW5ayjBLEfW1S1JL6dbTPGYqPU23nFM9rTrM/exec";

  const URL_VALIDACAO =
    "https://vidasrenovadasassembleia-debug.github.io/Vidas-Renovadas-gestao/validar.html";

  const ACAO_BUSCAR_MEMBRO = "buscarMembro";

  const elementos = {};

  document.addEventListener("DOMContentLoaded", iniciar);

  async function iniciar() {
    mapearElementos();
    configurarEventos();

    const identificador = obterIdentificadorDaUrl();

    if (!identificador) {
      mostrarErro(
        "Não foi informado qual membro deve ser exibido. Volte à ficha do membro e abra a carteirinha novamente."
      );
      return;
    }

    try {
      mostrarStatus("Carregando dados do membro...");

      const resposta = await buscarMembro(identificador);
      const membro = extrairMembro(resposta);

      if (!membro) {
        throw new Error(
          resposta?.mensagem ||
          resposta?.message ||
          "Membro não encontrado."
        );
      }

      preencherCarteirinha(membro);
      gerarQrCode(membro);

      elementos.areaCarteirinha.hidden = false;
      ocultarStatus();
    } catch (erro) {
      console.error("Erro ao carregar carteirinha:", erro);
      mostrarErro(
        erro?.message ||
        "Não foi possível carregar a carteirinha."
      );
    }
  }

  function mapearElementos() {
    elementos.status = document.getElementById("statusCarteirinha");
    elementos.areaCarteirinha = document.getElementById("areaCarteirinha");
    elementos.botaoImprimir = document.getElementById("botaoImprimir");
    elementos.voltarFicha = document.getElementById("voltarFicha");

    elementos.fotoMembro = document.getElementById("fotoMembro");
    elementos.fotoPlaceholder = document.getElementById("fotoPlaceholder");

    elementos.idLateral = document.getElementById("idLateral");
    elementos.nomeMembro = document.getElementById("nomeMembro");
    elementos.cargoMembro = document.getElementById("cargoMembro");
    elementos.congregacaoMembro =
      document.getElementById("congregacaoMembro");

    elementos.situacaoMembro =
      document.getElementById("situacaoMembro");

    elementos.numeroCarteirinha =
      document.getElementById("numeroCarteirinha");

    elementos.validadeCarteirinha =
      document.getElementById("validadeCarteirinha");

    elementos.qrCode = document.getElementById("qrCode");
  }

  function configurarEventos() {
    elementos.botaoImprimir?.addEventListener("click", () => {
      window.print();
    });

    elementos.fotoMembro?.addEventListener("error", () => {
      ocultarFoto();
    });
  }

  function obterIdentificadorDaUrl() {
    const parametros = new URLSearchParams(window.location.search);

    return (
      parametros.get("id") ||
      parametros.get("membro") ||
      parametros.get("codigo") ||
      parametros.get("numero") ||
      ""
    ).trim();
  }

  async function buscarMembro(identificador) {
    const corpo = new URLSearchParams();

    corpo.set("acao", ACAO_BUSCAR_MEMBRO);

    /*
     * Enviamos o mesmo identificador com nomes diferentes para manter
     * compatibilidade com versões anteriores do backend.
     */
    corpo.set("id", identificador);
    corpo.set("codigo", identificador);
    corpo.set("numero", identificador);

    const resposta = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
      },
      body: corpo.toString()
    });

    if (!resposta.ok) {
      throw new Error(
        `A API respondeu com o código ${resposta.status}.`
      );
    }

    const texto = await resposta.text();

    try {
      return JSON.parse(texto);
    } catch {
      throw new Error(
        "A resposta recebida da API não está em formato JSON."
      );
    }
  }

  function extrairMembro(resposta) {
    if (!resposta || typeof resposta !== "object") {
      return null;
    }

    if (resposta.sucesso === false || resposta.success === false) {
      return null;
    }

    if (resposta.membro && typeof resposta.membro === "object") {
      return resposta.membro;
    }

    if (resposta.dados && typeof resposta.dados === "object") {
      if (resposta.dados.membro) {
        return resposta.dados.membro;
      }

      return resposta.dados;
    }

    if (resposta.data && typeof resposta.data === "object") {
      if (resposta.data.membro) {
        return resposta.data.membro;
      }

      return resposta.data;
    }

    /*
     * Algumas versões da API devolvem os dados diretamente no objeto.
     */
    if (
      resposta.nome ||
      resposta.nomeCompleto ||
      resposta.numeroCarteirinha ||
      resposta.tokenPublico
    ) {
      return resposta;
    }

    return null;
  }

  function preencherCarteirinha(membro) {
    const nome = primeiroValor(
      membro.nomeCompleto,
      membro.nome,
      membro.nomeMembro
    );

    const cargo = primeiroValor(
      membro.cargo,
      membro.funcao,
      membro.ministerio
    );

    const congregacao = primeiroValor(
      membro.congregacao,
      membro.igreja,
      membro.local
    );

    const situacao = primeiroValor(
      membro.situacao,
      membro.status,
      "Não informada"
    );

    const numero = primeiroValor(
      membro.numeroCarteirinha,
      membro.numero,
      membro.codigo,
      membro.id
    );

    const validade = primeiroValor(
      membro.validade,
      membro.validadeCarteirinha,
      membro.dataValidade
    );

    const foto = primeiroValor(
      membro.foto,
      membro.fotoUrl,
      membro.urlFoto,
      membro.imagem
    );

    definirTexto(elementos.nomeMembro, nome || "Nome não informado");
    definirTexto(elementos.cargoMembro, cargo || "Não informado");
    definirTexto(
      elementos.congregacaoMembro,
      congregacao || "Não informada"
    );

    const numeroExibicao = numero || "—";

    definirTexto(elementos.idLateral, numeroExibicao);
    definirTexto(
      elementos.numeroCarteirinha,
      `Nº ${numeroExibicao}`
    );

    preencherSituacao(situacao);
    preencherValidade(validade);
    preencherFoto(foto, nome);

    if (elementos.voltarFicha) {
      const identificador = obterIdentificadorDaUrl();

      if (identificador) {
        elementos.voltarFicha.href =
          `membro.html?id=${encodeURIComponent(identificador)}`;
      }
    }

    document.title =
      `${nome || "Membro"} | Carteirinha Vidas Renovadas`;
  }

  function preencherSituacao(situacaoOriginal) {
    const situacao = String(
      situacaoOriginal || "Não informada"
    ).trim();

    definirTexto(
      elementos.situacaoMembro,
      `Situação: ${situacao}`
    );

    if (!elementos.situacaoMembro) {
      return;
    }

    elementos.situacaoMembro.classList.remove(
      "situacao-ativa",
      "situacao-inativa",
      "situacao-pendente"
    );

    const situacaoNormalizada = normalizarTexto(situacao);

    if (
      situacaoNormalizada === "ativo" ||
      situacaoNormalizada === "ativa"
    ) {
      elementos.situacaoMembro.classList.add("situacao-ativa");
      return;
    }

    if (
      situacaoNormalizada.includes("inativ") ||
      situacaoNormalizada.includes("cancel")
    ) {
      elementos.situacaoMembro.classList.add("situacao-inativa");
      return;
    }

    elementos.situacaoMembro.classList.add("situacao-pendente");
  }

  function preencherValidade(valor) {
    if (!valor) {
      definirTexto(
        elementos.validadeCarteirinha,
        "Não informada"
      );
      return;
    }

    definirTexto(
      elementos.validadeCarteirinha,
      formatarData(valor)
    );
  }

  function preencherFoto(url, nome) {
    if (!url) {
      ocultarFoto();
      atualizarIniciais(nome);
      return;
    }

    elementos.fotoMembro.src = String(url).trim();
    elementos.fotoMembro.alt =
      `Foto de ${nome || "membro"}`;

    elementos.fotoMembro.hidden = false;
    elementos.fotoPlaceholder.hidden = true;
  }

  function ocultarFoto() {
    if (elementos.fotoMembro) {
      elementos.fotoMembro.hidden = true;
      elementos.fotoMembro.removeAttribute("src");
    }

    if (elementos.fotoPlaceholder) {
      elementos.fotoPlaceholder.hidden = false;
    }
  }

  function atualizarIniciais(nome) {
    if (!elementos.fotoPlaceholder) {
      return;
    }

    const partes = String(nome || "VR")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    const iniciais = partes.length === 1
      ? partes[0].slice(0, 2)
      : `${partes[0][0]}${partes[partes.length - 1][0]}`;

    elementos.fotoPlaceholder.textContent =
      iniciais.toUpperCase();
  }

  function gerarQrCode(membro) {
    if (!elementos.qrCode) {
      return;
    }

    const token = primeiroValor(
      membro.tokenPublico,
      membro.token_publico,
      membro.tokenCarteirinha,
      membro.token
    );

    elementos.qrCode.innerHTML = "";

    if (!token) {
      elementos.qrCode.textContent = "QR indisponível";
      console.warn(
        "O membro não possui token público para gerar o QR Code."
      );
      return;
    }

    if (typeof window.QRCode !== "function") {
      elementos.qrCode.textContent = "QR indisponível";
      console.error(
        "A biblioteca QRCode não foi carregada."
      );
      return;
    }

    const urlPublica =
      `${URL_VALIDACAO}?token=${encodeURIComponent(token)}`;

    new window.QRCode(elementos.qrCode, {
      text: urlPublica,
      width: 174,
      height: 174,
      correctLevel: window.QRCode.CorrectLevel.M
    });

    elementos.qrCode.title = urlPublica;
  }

  function formatarData(valor) {
    if (!valor) {
      return "Não informada";
    }

    if (
      typeof valor === "string" &&
      /^\d{2}\/\d{2}\/\d{4}$/.test(valor.trim())
    ) {
      return valor.trim();
    }

    let data;

    if (
      typeof valor === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(valor.trim())
    ) {
      const [ano, mes, dia] = valor.trim().split("-").map(Number);
      data = new Date(ano, mes - 1, dia);
    } else {
      data = new Date(valor);
    }

    if (Number.isNaN(data.getTime())) {
      return String(valor);
    }

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(data);
  }

  function primeiroValor(...valores) {
    return valores.find((valor) => {
      return valor !== undefined &&
        valor !== null &&
        String(valor).trim() !== "";
    });
  }

  function definirTexto(elemento, texto) {
    if (elemento) {
      elemento.textContent = texto;
    }
  }

  function normalizarTexto(valor) {
    return String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  }

  function mostrarStatus(mensagem) {
    if (!elementos.status) {
      return;
    }

    elementos.status.hidden = false;
    elementos.status.textContent = mensagem;
  }

  function ocultarStatus() {
    if (elementos.status) {
      elementos.status.hidden = true;
    }
  }

  function mostrarErro(mensagem) {
    if (elementos.areaCarteirinha) {
      elementos.areaCarteirinha.hidden = true;
    }

    if (elementos.status) {
      elementos.status.hidden = false;
      elementos.status.textContent = mensagem;
      elementos.status.style.color = "#9b1c1c";
      elementos.status.style.background = "#fff1f1";
      elementos.status.style.border = "1px solid #f2b8b8";
    }
  }
})();
