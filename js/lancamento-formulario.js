/**
 * ============================================================================
 * VIDAS RENOVADAS GESTÃO 2.0
 * Arquivo: js/lancamento-formulario.js
 * Descrição: Regras reutilizáveis do formulário de dízimos e ofertas
 * ============================================================================
 */

(function (window, document) {
  "use strict";

  const estado = {
    dizimos: []
  };

  const elementos = {};

  function texto(valor) {
    return String(valor ?? "").trim();
  }

  function escaparHtml(valor) {
    return String(valor ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function obterFormulario(alvo) {
    if (alvo instanceof HTMLFormElement) return alvo;
    if (typeof alvo === "string") return document.querySelector(alvo);
    return document.getElementById("formTesouraria");
  }

  function moedaParaNumero(valor) {
    if (typeof valor === "number") {
      return Number.isFinite(valor) ? valor : 0;
    }

    const conteudo = texto(valor);
    if (!conteudo) return 0;

    const normalizado = conteudo
      .replace(/\s/g, "")
      .replace(/^R\$/i, "")
      .replace(/\./g, "")
      .replace(",", ".")
      .replace(/[^\d.-]/g, "");

    const numero = Number(normalizado);
    return Number.isFinite(numero) ? numero : 0;
  }

  function numeroParaMoeda(valor) {
    const numero = Number(valor);

    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(Number.isFinite(numero) ? numero : 0);
  }

  function normalizarValorDigitado(valor) {
    const numero = moedaParaNumero(valor);

    return numero > 0
      ? numero.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
      : "";
  }

  function gerarIdTemporario() {
    return [
      "DIZ",
      Date.now().toString(36).toUpperCase(),
      Math.random().toString(36).slice(2, 7).toUpperCase()
    ].join("-");
  }

  function capturarElementos() {
    elementos.formulario = document.getElementById("formTesouraria");
    elementos.dataCulto = document.getElementById("dataCulto");
    elementos.congregacao = document.getElementById("congregacao");
    elementos.responsavel = document.getElementById("responsavel");
    elementos.valorOferta = document.getElementById("valorOferta");
    elementos.pesquisaMembro = document.getElementById("pesquisaMembro");
    elementos.membroSelecionadoId =
      document.getElementById("membroSelecionadoId");
    elementos.membroSelecionadoNome =
      document.getElementById("membroSelecionadoNome");
    elementos.painelDizimistaNaoCadastrado =
  document.getElementById("painelDizimistaNaoCadastrado");
elementos.nomeDizimistaNaoCadastrado =
  document.getElementById("nomeDizimistaNaoCadastrado");
    elementos.valorDizimo = document.getElementById("valorDizimo");
    elementos.observacoes = document.getElementById("observacoes");
    elementos.corpoTabelaDizimos =
      document.getElementById("corpoTabelaDizimos");
    elementos.contadorDizimos =
      document.getElementById("contadorDizimos");
    elementos.resumoOferta = document.getElementById("resumoOferta");
    elementos.resumoDizimos = document.getElementById("resumoDizimos");
    elementos.resumoQuantidadeDizimos =
      document.getElementById("resumoQuantidadeDizimos");
    elementos.resumoTotal = document.getElementById("resumoTotal");

    return Boolean(
      elementos.formulario &&
      elementos.dataCulto &&
      elementos.congregacao &&
      elementos.responsavel &&
      elementos.valorOferta &&
      elementos.pesquisaMembro &&
      elementos.membroSelecionadoId &&
      elementos.membroSelecionadoNome &&
elementos.painelDizimistaNaoCadastrado &&
elementos.nomeDizimistaNaoCadastrado &&
elementos.valorDizimo &&
      elementos.observacoes &&
      elementos.corpoTabelaDizimos &&
      elementos.contadorDizimos &&
      elementos.resumoOferta &&
      elementos.resumoDizimos &&
      elementos.resumoQuantidadeDizimos &&
      elementos.resumoTotal
    );
  }

  function obterTotalOferta() {
    return moedaParaNumero(elementos.valorOferta?.value);
  }

  function obterTotalDizimos() {
    return estado.dizimos.reduce(
      (total, item) => total + Number(item.valor || 0),
      0
    );
  }

  function atualizarResumo() {
    const oferta = obterTotalOferta();
    const totalDizimos = obterTotalDizimos();
    const totalGeral = oferta + totalDizimos;
    const quantidade = estado.dizimos.length;
    const quantidadeTexto =
      quantidade === 1 ? "1 registro" : `${quantidade} registros`;

    elementos.resumoOferta.textContent = numeroParaMoeda(oferta);
    elementos.resumoDizimos.textContent = numeroParaMoeda(totalDizimos);
    elementos.resumoQuantidadeDizimos.textContent = quantidadeTexto;
    elementos.contadorDizimos.textContent = quantidadeTexto;
    elementos.resumoTotal.textContent = numeroParaMoeda(totalGeral);
  }

  function renderizarDizimos() {
    if (!estado.dizimos.length) {
      elementos.corpoTabelaDizimos.innerHTML = `
        <tr id="linhaDizimosVazia">
          <td colspan="3" class="tesouraria-dizimos-vazio">
            Nenhum dízimo adicionado.
          </td>
        </tr>
      `;

      atualizarResumo();
      return;
    }

    elementos.corpoTabelaDizimos.innerHTML = estado.dizimos
      .map(
        (item) => `
          <tr data-id-dizimo="${escaparHtml(item.idTemporario)}">
            <td>
              <span class="tesouraria-dizimo-membro">
                ${escaparHtml(item.nomeMembro)}
              </span>
            </td>

            <td>
              <span class="tesouraria-dizimo-valor">
                ${numeroParaMoeda(item.valor)}
              </span>
            </td>

            <td class="tesouraria-coluna-acao">
              <button
                type="button"
                class="tesouraria-botao-remover"
                data-acao="remover-dizimo"
                data-id-dizimo="${escaparHtml(item.idTemporario)}"
                aria-label="Remover dízimo de ${escaparHtml(item.nomeMembro)}"
                title="Remover"
              >
                Remover
              </button>
            </td>
          </tr>
        `
      )
      .join("");

    atualizarResumo();
  }

  function definirMembroSelecionado(membro = {}) {
    const membroId = texto(membro.id ?? membro.ID ?? membro.codigo);
    const nomeMembro = texto(
      membro.nome ??
      membro.nomeCompleto ??
      membro.NOME_COMPLETO ??
      membro.Nome
    );

    elementos.membroSelecionadoId.value = membroId;
    elementos.membroSelecionadoNome.value = nomeMembro;
    elementos.pesquisaMembro.value = nomeMembro;

    return { membroId, nomeMembro };
  }

  function limparMembroSelecionado() {
    elementos.membroSelecionadoId.value = "";
    elementos.membroSelecionadoNome.value = "";
    elementos.pesquisaMembro.value = "";
    elementos.valorDizimo.value = "";
  }

  function adicionarDizimo(dados = {}) {
  const membroId = texto(
    dados.membroId ??
    elementos.membroSelecionadoId.value
  );

  const nomeMembroCadastrado = texto(
    dados.nomeMembro ??
    elementos.membroSelecionadoNome.value
  );

  const nomeNaoCadastrado = texto(
    dados.nomeNaoCadastrado ??
    elementos.nomeDizimistaNaoCadastrado.value
  );

  const valor = moedaParaNumero(
    dados.valor ??
    elementos.valorDizimo.value
  );

  const ehMembroCadastrado = Boolean(
    membroId && nomeMembroCadastrado
  );

  const tipo = ehMembroCadastrado
    ? "MEMBRO"
    : "NAO_CADASTRADO";

  const nomeMembro = ehMembroCadastrado
    ? nomeMembroCadastrado
    : nomeNaoCadastrado;

  if (!nomeMembro) {
    throw new Error(
      "Selecione um membro ou informe o nome do dizimista não cadastrado."
    );
  }

  if (!(valor > 0)) {
    throw new Error(
      "Informe um valor de dízimo maior que zero."
    );
  }

  const nomeNormalizado = nomeMembro
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  const jaAdicionado = estado.dizimos.some(
    function (item) {
      if (
        tipo === "MEMBRO" &&
        item.tipo === "MEMBRO"
      ) {
        return item.membroId === membroId;
      }

      if (
        tipo === "NAO_CADASTRADO" &&
        item.tipo === "NAO_CADASTRADO"
      ) {
        const nomeExistente = texto(item.nomeMembro)
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim()
          .toLowerCase();

        return nomeExistente === nomeNormalizado;
      }

      return false;
    }
  );

  if (jaAdicionado) {
    throw new Error(
      "Este dizimista já foi incluído neste lançamento."
    );
  }

  const novoDizimo = {
    idTemporario: gerarIdTemporario(),
    tipo: tipo,
    membroId: ehMembroCadastrado ? membroId : "",
    nomeMembro: nomeMembro,
    valor: valor
  };

  estado.dizimos.push(novoDizimo);

  limparMembroSelecionado();

  elementos.nomeDizimistaNaoCadastrado.value = "";
  elementos.painelDizimistaNaoCadastrado.hidden = true;

  renderizarDizimos();

  elementos.pesquisaMembro.focus();

  return { ...novoDizimo };
}

  function removerDizimo(idTemporario) {
    const id = texto(idTemporario);

    estado.dizimos = estado.dizimos.filter(
      (item) => item.idTemporario !== id
    );

    renderizarDizimos();
  }

  function coletar(alvo) {
    const formulario = obterFormulario(alvo);

    if (!formulario) {
      throw new Error("Formulário da Tesouraria não encontrado.");
    }

    const oferta = obterTotalOferta();
    const totalDizimos = obterTotalDizimos();

    return {
      data: texto(elementos.dataCulto.value),
      congregacao: texto(elementos.congregacao.value),
      responsavel: texto(elementos.responsavel.value),
      oferta,
      observacoes: texto(elementos.observacoes.value),
      totalDizimos,
      totalGeral: oferta + totalDizimos,
      quantidadeDizimos: estado.dizimos.length,
      status: "PENDENTE",
      dizimos: estado.dizimos.map((item) => ({
        membroId: item.membroId,
        nomeMembro: item.nomeMembro,
        valor: item.valor
      }))
    };
  }

  function validar(alvo) {
    const formulario = obterFormulario(alvo);

    if (!formulario) {
      return {
        valido: false,
        mensagem: "Formulário da Tesouraria não encontrado."
      };
    }

    const dados = coletar(formulario);

    if (!dados.data) {
      elementos.dataCulto.focus();
      return { valido: false, mensagem: "Informe a data do culto." };
    }

    if (!dados.congregacao) {
      elementos.congregacao.focus();
      return { valido: false, mensagem: "Selecione a congregação." };
    }

    if (!dados.responsavel) {
      return {
        valido: false,
        mensagem: "Não foi possível identificar o responsável."
      };
    }

    if (!(dados.oferta > 0) && dados.dizimos.length === 0) {
      elementos.valorOferta.focus();

      return {
        valido: false,
        mensagem:
          "Informe uma oferta ou adicione pelo menos um dízimo."
      };
    }

    if (!formulario.checkValidity()) {
      formulario.reportValidity();

      return {
        valido: false,
        mensagem: "Revise os campos obrigatórios."
      };
    }

    return { valido: true, mensagem: "" };
  }

  function preencher(alvo, dados = {}) {
    const formulario = obterFormulario(alvo);

    if (!formulario) {
      throw new Error("Formulário da Tesouraria não encontrado.");
    }

    elementos.dataCulto.value = texto(dados.data);
    elementos.congregacao.value = texto(dados.congregacao);
    elementos.responsavel.value = texto(dados.responsavel);
    elementos.valorOferta.value =
      normalizarValorDigitado(dados.oferta);
    elementos.observacoes.value = texto(dados.observacoes);

    estado.dizimos = Array.isArray(dados.dizimos)
      ? dados.dizimos.map((item) => ({
          idTemporario:
            texto(item.idTemporario) || gerarIdTemporario(),
          membroId: texto(
            item.membroId ?? item.idMembro ?? item.ID_MEMBRO
          ),
          nomeMembro: texto(
            item.nomeMembro ?? item.nome ?? item.NOME_MEMBRO
          ),
          valor: moedaParaNumero(item.valor)
        }))
      : [];

    renderizarDizimos();
    return coletar(formulario);
  }

  function limpar(alvo, opcoes = {}) {
    const formulario = obterFormulario(alvo);
    if (!formulario) return;

    const {
      preservarData = true,
      preservarCongregacao = true,
      preservarResponsavel = true
    } = opcoes;

    const dataAtual = elementos.dataCulto.value;
    const congregacaoAtual = elementos.congregacao.value;
    const responsavelAtual = elementos.responsavel.value;

    formulario.reset();
    estado.dizimos = [];
    limparMembroSelecionado();

    if (preservarData) elementos.dataCulto.value = dataAtual;
    if (preservarCongregacao) {
      elementos.congregacao.value = congregacaoAtual;
    }
    if (preservarResponsavel) {
      elementos.responsavel.value = responsavelAtual;
    }

    renderizarDizimos();
    elementos.valorOferta.focus();
  }

  function definirDataAtual() {
    if (elementos.dataCulto.value) return;

    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");

    elementos.dataCulto.value = `${ano}-${mes}-${dia}`;
  }

  function configurarEventosBase() {
    elementos.valorOferta.addEventListener("input", atualizarResumo);

    elementos.valorOferta.addEventListener("blur", function () {
      elementos.valorOferta.value =
        normalizarValorDigitado(elementos.valorOferta.value);

      atualizarResumo();
    });

    elementos.valorDizimo.addEventListener("blur", function () {
      elementos.valorDizimo.value =
        normalizarValorDigitado(elementos.valorDizimo.value);
    });

    elementos.corpoTabelaDizimos.addEventListener(
      "click",
      function (evento) {
        const botao = evento.target.closest(
          '[data-acao="remover-dizimo"]'
        );

        if (!botao) return;
        removerDizimo(botao.dataset.idDizimo);
      }
    );
  }

  function iniciar() {
    if (!capturarElementos()) {
      console.warn(
        "[LANÇAMENTO] A página não contém todos os elementos necessários."
      );

      return false;
    }

    definirDataAtual();
    configurarEventosBase();
    renderizarDizimos();

    return true;
  }

  window.VRGLancamentoFormulario = Object.freeze({
    iniciar,
    texto,
    moedaParaNumero,
    numeroParaMoeda,
    normalizarValorDigitado,
    obterFormulario,
    definirMembroSelecionado,
    limparMembroSelecionado,
    adicionarDizimo,
    removerDizimo,
    preencher,
    coletar,
    validar,
    limpar,
    atualizarResumo,
    obterTotalDizimos,
    obterDizimos: function () {
      return estado.dizimos.map((item) => ({ ...item }));
    }
  });
})(window, document);
