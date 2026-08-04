"use strict";

/* ==========================================================================
   CONGREGAÇÃO — FORMULÁRIO OFICIAL V2
   Uma única página para Novo, Editar e Visualizar.
   ========================================================================== */

const CongregacaoFormulario = (() => {
  const PARAMETROS = new URLSearchParams(window.location.search);

  const MODOS = Object.freeze({
    NOVO: "novo",
    EDITAR: "editar",
    VISUALIZAR: "visualizar"
  });

  const modoSolicitado = String(
    PARAMETROS.get("modo") || MODOS.NOVO
  ).toLowerCase();

  const ESTADO = {
    modo: Object.values(MODOS).includes(modoSolicitado)
      ? modoSolicitado
      : MODOS.NOVO,
    codigo: String(PARAMETROS.get("codigo") || "").trim(),
    carregando: false,
    salvando: false,
    congregacao: null
  };

  const CAMPOS = Object.freeze({
    codigo: "codigo",
    nome: "nome",
    tipo: "tipo",
    ativa: "ativa",
    responsavel: "responsavel",
    telefone: "telefone",
    email: "email",
    cep: "cep",
    endereco: "endereco",
    numero: "numero",
    complemento: "complemento",
    bairro: "bairro",
    cidade: "cidade",
    estado: "estado",
    dataFundacao: "fundacao",
    observacoes: "observacoes"
  });

  const $ = (seletor, raiz = document) =>
    raiz.querySelector(seletor);

  async function iniciar() {
    const formulario = $("#formCongregacao");

    if (!formulario) {
      console.warn(
        "[CONGREGAÇÃO] O formulário não foi encontrado nesta página."
      );
      return;
    }

    configurarPagina();
    configurarEventos();

    if (ESTADO.modo !== MODOS.NOVO) {
      if (!ESTADO.codigo) {
        mostrarErro(
          "O código da congregação não foi informado."
        );
        bloquearFormulario();
        return;
      }

      await carregarCongregacao();
    }

    aplicarModo();
  }

  function configurarEventos() {
    $("#formCongregacao")?.addEventListener(
      "submit",
      salvarCongregacao
    );

    $("#cep")?.addEventListener(
      "input",
      formatarCep
    );

    $("#telefone")?.addEventListener(
      "input",
      formatarTelefone
    );

    document.addEventListener(
      "vrg:layout-pronto",
      configurarPagina
    );
  }

  function configurarPagina() {
    const configuracao = obterConfiguracaoModo();

    document.title =
      `${configuracao.titulo} | Vidas Renovadas Gestão`;

    document.body.dataset.titulo = configuracao.titulo;
    document.body.dataset.subtitulo = configuracao.subtitulo;

    const tituloTopbar = $("[data-layout-titulo]");
    const subtituloTopbar = $("[data-layout-subtitulo]");
    const tituloPagina = $(".pagina-titulo");
    const descricaoPagina = $(".pagina-descricao");

    if (tituloTopbar) {
      tituloTopbar.textContent = configuracao.titulo;
    }

    if (subtituloTopbar) {
      subtituloTopbar.textContent = configuracao.subtitulo;
      subtituloTopbar.hidden = false;
    }

    if (tituloPagina) {
      tituloPagina.textContent = configuracao.titulo;
    }

    if (descricaoPagina) {
      descricaoPagina.textContent = configuracao.descricao;
    }
  }

  function obterConfiguracaoModo() {
    if (ESTADO.modo === MODOS.EDITAR) {
      return {
        titulo: "Editar Congregação",
        subtitulo: "Atualize os dados cadastrais da congregação.",
        descricao:
          "Revise e atualize as informações da congregação."
      };
    }

    if (ESTADO.modo === MODOS.VISUALIZAR) {
      return {
        titulo: "Visualizar Congregação",
        subtitulo: "Consulte os dados cadastrais da congregação.",
        descricao:
          "Visualização completa das informações cadastradas."
      };
    }

    return {
      titulo: "Nova Congregação",
      subtitulo:
        "Cadastre uma nova congregação do Ministério Vidas Renovadas.",
      descricao:
        "Cadastre uma nova congregação do Ministério Vidas Renovadas."
    };
  }

  async function carregarCongregacao() {
    definirCarregando(true);

    try {
      const resposta = await obterApi().enviar(
        "buscarCongregacao",
        {
          codigo: ESTADO.codigo
        }
      );

      if (!resposta.congregacao) {
        throw new Error("Congregação não encontrada.");
      }

      ESTADO.congregacao = resposta.congregacao;
      preencherFormulario(resposta.congregacao);
    } catch (erro) {
      console.error(
        "[CONGREGAÇÃO] Erro ao carregar:",
        erro
      );

      mostrarErro(
        erro?.message ||
        "Não foi possível carregar a congregação."
      );

      bloquearFormulario();
    } finally {
      definirCarregando(false);
    }
  }

  function preencherFormulario(dados) {
    definirCampo(CAMPOS.codigo, dados.codigo);
    definirCampo(CAMPOS.nome, dados.nome);
    definirCampo(
      CAMPOS.tipo,
      dados.tipo || "Congregação"
    );
    definirCampo(
      CAMPOS.ativa,
      String(Boolean(dados.ativa))
    );
    definirCampo(
      CAMPOS.responsavel,
      dados.responsavel ||
      dados.pastorResponsavel ||
      ""
    );
    definirCampo(CAMPOS.telefone, dados.telefone);
    definirCampo(CAMPOS.email, dados.email);
    definirCampo(CAMPOS.cep, dados.cep);
    definirCampo(CAMPOS.endereco, dados.endereco);
    definirCampo(CAMPOS.numero, dados.numero);
    definirCampo(CAMPOS.complemento, dados.complemento);
    definirCampo(CAMPOS.bairro, dados.bairro);
    definirCampo(CAMPOS.cidade, dados.cidade);
    definirCampo(CAMPOS.estado, dados.estado);
    definirCampo(
      CAMPOS.dataFundacao,
      dados.dataFundacao
    );
    definirCampo(
      CAMPOS.observacoes,
      dados.observacoes
    );
  }

  function coletarDados() {
    return {
      codigo: obterValor(CAMPOS.codigo),
      nome: obterValor(CAMPOS.nome),
      tipo:
        obterValor(CAMPOS.tipo) ||
        "Congregação",
      responsavel: obterValor(CAMPOS.responsavel),
      telefone: obterValor(CAMPOS.telefone),
      email: obterValor(CAMPOS.email),
      cep: obterValor(CAMPOS.cep),
      endereco: obterValor(CAMPOS.endereco),
      numero: obterValor(CAMPOS.numero),
      complemento: obterValor(CAMPOS.complemento),
      bairro: obterValor(CAMPOS.bairro),
      cidade: obterValor(CAMPOS.cidade),
      estado: obterValor(CAMPOS.estado),
      dataFundacao: obterValor(CAMPOS.dataFundacao),
      observacoes: obterValor(CAMPOS.observacoes),
      ativa: obterValor(CAMPOS.ativa) === "true"
    };
  }

  function validar(dados) {
    if (!dados.nome) {
      throw new Error(
        "Informe o nome da congregação."
      );
    }

    if (
      dados.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)
    ) {
      throw new Error(
        "Informe um endereço de e-mail válido."
      );
    }
  }

  async function salvarCongregacao(evento) {
    evento.preventDefault();

    if (
      ESTADO.modo === MODOS.VISUALIZAR ||
      ESTADO.salvando
    ) {
      return;
    }

    const formulario = evento.currentTarget;

    if (!formulario.reportValidity()) {
      return;
    }

    try {
      const dados = coletarDados();
      validar(dados);

      ESTADO.salvando = true;
      atualizarBotaoSalvar(
        true,
        ESTADO.modo === MODOS.EDITAR
          ? "Salvando alterações..."
          : "Salvando congregação..."
      );

      const resposta = await obterApi().enviar(
        "salvarCongregacao",
        {
          dados: dados
        }
      );

      mostrarSucesso(
        resposta.mensagem ||
        "Congregação salva com sucesso."
      );

      window.setTimeout(() => {
        window.location.href = "congregacoes.html";
      }, 700);
    } catch (erro) {
      console.error(
        "[CONGREGAÇÃO] Erro ao salvar:",
        erro
      );

      mostrarErro(
        erro?.message ||
        "Não foi possível salvar a congregação."
      );
    } finally {
      ESTADO.salvando = false;
      atualizarBotaoSalvar(false);
    }
  }

  function aplicarModo() {
    const botaoSalvar = obterBotaoSalvar();

    if (ESTADO.modo === MODOS.VISUALIZAR) {
      bloquearFormulario();

      if (botaoSalvar) {
        botaoSalvar.hidden = true;
      }

      return;
    }

    desbloquearFormulario();

    const codigo = $(`#${CAMPOS.codigo}`);

    if (codigo) {
      codigo.readOnly = true;
    }

    if (botaoSalvar) {
      botaoSalvar.hidden = false;
      botaoSalvar.textContent =
        ESTADO.modo === MODOS.EDITAR
          ? "Salvar alterações"
          : "Salvar Congregação";
    }
  }

  function bloquearFormulario() {
    $$("#formCongregacao input, #formCongregacao select, #formCongregacao textarea")
      .forEach((campo) => {
        campo.disabled = true;
      });
  }

  function desbloquearFormulario() {
    $$("#formCongregacao input, #formCongregacao select, #formCongregacao textarea")
      .forEach((campo) => {
        campo.disabled = false;
      });
  }

  function definirCarregando(ativo) {
    ESTADO.carregando = ativo;

    if (window.VRG) {
      if (
        ativo &&
        typeof window.VRG.mostrarCarregamento === "function"
      ) {
        window.VRG.mostrarCarregamento(
          "Carregando congregação..."
        );
      }

      if (
        !ativo &&
        typeof window.VRG.ocultarCarregamento === "function"
      ) {
        window.VRG.ocultarCarregamento();
      }
    }
  }

  function atualizarBotaoSalvar(
    desabilitado,
    texto = ""
  ) {
    const botao = obterBotaoSalvar();

    if (!botao) {
      return;
    }

    botao.disabled = desabilitado;

    if (texto) {
      botao.textContent = texto;
      return;
    }

    botao.textContent =
      ESTADO.modo === MODOS.EDITAR
        ? "Salvar alterações"
        : "Salvar Congregação";
  }

  function obterBotaoSalvar() {
    return $(
      '#formCongregacao button[type="submit"]'
    );
  }

  function mostrarSucesso(mensagem) {
    if (
      window.VRG &&
      typeof window.VRG.sucesso === "function"
    ) {
      window.VRG.sucesso(mensagem);
      return;
    }

    window.alert(mensagem);
  }

  function mostrarErro(mensagem) {
    if (
      window.VRG &&
      typeof window.VRG.erro === "function"
    ) {
      window.VRG.erro(mensagem);
      return;
    }

    window.alert(mensagem);
  }

  function formatarCep(evento) {
    const numeros = String(evento.target.value || "")
      .replace(/\D/g, "")
      .slice(0, 8);

    evento.target.value = numeros.replace(
      /(\d{5})(\d)/,
      "$1-$2"
    );
  }

  function formatarTelefone(evento) {
    const numeros = String(evento.target.value || "")
      .replace(/\D/g, "")
      .slice(0, 11);

    evento.target.value =
      numeros.length <= 10
        ? numeros
            .replace(/(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{4})(\d)/, "$1-$2")
        : numeros
            .replace(/(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{5})(\d)/, "$1-$2");
  }

  function obterApi() {
  const api = window.VRAuth || window.Auth;

  if (!api || typeof api.chamarApi !== "function") {
    throw new Error(
      "O módulo de autenticação/API não foi carregado corretamente."
    );
  }

  return {
    enviar: function (acao, dados = {}) {
      return api.chamarApi({
        acao,
        ...dados
      });
    }
  };
}

  function obterValor(id) {
    return String($(`#${id}`)?.value || "").trim();
  }

  function definirCampo(id, valor) {
    const campo = $(`#${id}`);

    if (campo) {
      campo.value = valor ?? "";
    }
  }

  function $$(seletor, raiz = document) {
    return Array.from(
      raiz.querySelectorAll(seletor)
    );
  }

  return Object.freeze({
    iniciar
  });
})();

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    CongregacaoFormulario.iniciar,
    { once: true }
  );
} else {
  CongregacaoFormulario.iniciar();
}
