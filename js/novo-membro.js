/**
 * ============================================================================
 * VIDAS RENOVADAS GESTÃO 2.0
 * Arquivo: js/novo-membro.js
 * Descrição: Cadastro de uma nova ficha digital de membro
 * ============================================================================
 *
 * Dependências obrigatórias, nesta ordem:
 *   1. js/configuracoes.js
 *   2. js/api.js
 *   3. js/app.js
 *   4. js/auth.js
 *   5. js/membro-formulario.js
 *   6. js/novo-membro.js
 * ============================================================================
 */

(function (window, document) {
  "use strict";

  const FORMULARIO_ID = "formNovoMembro";

  let formulario = null;
  let modulo = null;
  let enviando = false;

  function obterModulo() {
    if (!window.VRGMembroFormulario) {
      throw new Error(
        "O módulo compartilhado da ficha do membro não foi carregado."
      );
    }

    return window.VRGMembroFormulario;
  }

  function tratarRespostaCadastro(resultado) {
    if (!resultado) {
      throw new Error("A API não retornou uma resposta para o cadastro.");
    }

    if (resultado.sucesso === false) {
      throw new Error(
        resultado.mensagem || "Não foi possível cadastrar o membro."
      );
    }

    return resultado;
  }

  async function prepararFoto(dados) {
    const arquivo = modulo.obterArquivoFoto();

    if (!arquivo) {
      return dados;
    }

    modulo.mostrarAviso("Enviando a foto do membro...", "carregando");

    const fotoUrl = await modulo.enviarFoto(arquivo);

    const campoFoto = document.getElementById("FOTO_URL");
    if (campoFoto) {
      campoFoto.value = fotoUrl;
    }

    return {
      ...dados,
      foto: fotoUrl
    };
  }

  async function cadastrarMembro(evento) {
    evento.preventDefault();

    if (enviando) return;

    const validacao = modulo.validar(formulario);

    if (!validacao.valido) {
      modulo.mostrarAviso(validacao.mensagem, "erro");
      return;
    }

    enviando = true;
    modulo.definirCarregando(true, "Cadastrando membro...");
    modulo.mostrarAviso(
      "Aguarde enquanto o cadastro está sendo salvo.",
      "carregando"
    );

    try {
      let dados = modulo.obterDados(formulario);

      dados = modulo.prepararDadosApi(dados);
      dados = await prepararFoto(dados);

      const resultado = tratarRespostaCadastro(
        await modulo.obterAuth().chamarApi({
          acao: "cadastrarMembro",
          dados
        })
      );

      const idCriado = modulo.extrairIdResultado(resultado);

      modulo.mostrarAviso(
        resultado.mensagem || "Membro cadastrado com sucesso.",
        "sucesso"
      );

      window.setTimeout(function () {
        if (idCriado) {
          window.location.href =
            "visualizar-membro.html?id=" + encodeURIComponent(idCriado);
          return;
        }

        window.location.href = "membros.html";
      }, 900);
    } catch (erro) {
      console.error("[NOVO MEMBRO] Erro ao cadastrar:", erro);

      modulo.mostrarAviso(
        erro?.message || "Não foi possível cadastrar o membro.",
        "erro"
      );
    } finally {
      enviando = false;
      modulo.definirCarregando(false);
    }
  }

  function formularioPossuiDados() {
    return Array.from(
      formulario.querySelectorAll(
        "input[name]:not([type='hidden']):not([type='file']), " +
          "select[name], textarea[name]"
      )
    ).some((campo) => {
      if (campo.type === "checkbox" || campo.type === "radio") {
        return campo.checked;
      }

      return String(campo.value || "").trim();
    });
  }

  function configurarCancelamento() {
    document
      .querySelectorAll("#botaoCancelarTopo, #botaoCancelarRodape")
      .forEach((botao) => {
        botao.addEventListener("click", function (evento) {
          if (
            formularioPossuiDados() &&
            !window.confirm(
              "Os dados preenchidos ainda não foram salvos. Deseja sair?"
            )
          ) {
            evento.preventDefault();
          }
        });
      });
  }

  function inicializar() {
    try {
      modulo = obterModulo();
      formulario = document.getElementById(FORMULARIO_ID);

      if (!formulario) {
        throw new Error("O formulário de novo membro não foi encontrado.");
      }

      modulo.configurarResumoEmTempoReal(formulario);
      modulo.atualizarResumo(modulo.obterDados(formulario));

      formulario.addEventListener("submit", cadastrarMembro);
      configurarCancelamento();

      modulo.mostrarAviso(
        "Preencha os dados do novo membro para realizar o cadastro.",
        "informacao"
      );
    } catch (erro) {
      console.error("[NOVO MEMBRO] Erro na inicialização:", erro);

      const aviso = document.getElementById("avisoFicha");

      if (aviso) {
        aviso.textContent =
          erro?.message || "Não foi possível inicializar o cadastro.";
        aviso.classList.add("ativo");
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializar, { once: true });
  } else {
    inicializar();
  }
})(window, document);
