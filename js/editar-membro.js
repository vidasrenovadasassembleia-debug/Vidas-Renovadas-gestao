/**
 * ============================================================================
 * VIDAS RENOVADAS GESTÃO 2.0
 * Arquivo: js/editar-membro.js
 * Descrição: Controlador da edição da ficha digital do membro
 * ============================================================================
 * Dependências: configuracoes.js, api.js, app.js, auth.js,
 *               membro-formulario.js
 * ============================================================================
 */

(function (window, document) {
  "use strict";

  let modulo;
  let formulario;
  let idMembro = "";
  let dadosIniciais = "";
  let salvando = false;
  let alteracoesSalvas = false;
  let urlPreviewFoto = "";

  function texto(valor) {
    return String(valor ?? "").trim();
  }

  function obterModulo() {
    if (!window.VRGMembroFormulario) {
      throw new Error("O módulo compartilhado da ficha do membro não foi carregado.");
    }
    return window.VRGMembroFormulario;
  }

  function serializarFormulario() {
    return JSON.stringify(modulo.obterDados(formulario));
  }

  function formularioAlterado() {
    return Boolean(
      formulario &&
      dadosIniciais &&
      (serializarFormulario() !== dadosIniciais || modulo.obterArquivoFoto())
    );
  }

  function configurarDestinoCancelar() {
    const destino = `visualizar-membro.html?id=${encodeURIComponent(idMembro)}`;
    const botao = document.getElementById("botaoCancelarEdicao");

    if (!botao) return;
    botao.href = destino;

    botao.addEventListener("click", function (evento) {
      if (alteracoesSalvas || !formularioAlterado()) return;

      if (!window.confirm("Existem alterações não salvas. Deseja sair?")) {
        evento.preventDefault();
      }
    });
  }

  function atualizarTitulo(membro) {
    const titulo = document.getElementById("tituloEditarMembro");
    const nome = texto(membro?.NOME_COMPLETO || membro?.nomeCompleto || membro?.nome);

    if (titulo && nome) {
      titulo.textContent = `Editar membro — ${nome}`;
    }
  }

  function configurarPreviewFoto() {
    const campoArquivo = document.getElementById("arquivoFotoMembro");
    const statusFoto = document.getElementById("statusFoto");

    if (!campoArquivo) return;

    campoArquivo.addEventListener("change", function () {
      const arquivo = campoArquivo.files?.[0] || null;

      if (urlPreviewFoto) {
        URL.revokeObjectURL(urlPreviewFoto);
        urlPreviewFoto = "";
      }

      if (!arquivo) {
        modulo.atualizarFoto(document.getElementById("FOTO_URL")?.value || "");
        if (statusFoto) statusFoto.textContent = "Nenhuma nova foto selecionada.";
        return;
      }

      const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];
      if (!tiposPermitidos.includes(arquivo.type) || arquivo.size > 5 * 1024 * 1024) {
        campoArquivo.value = "";
        modulo.mostrarAviso(
          !tiposPermitidos.includes(arquivo.type)
            ? "A foto deve estar no formato JPG, PNG ou WebP."
            : "A foto deve ter no máximo 5 MB.",
          "erro"
        );
        return;
      }

      urlPreviewFoto = URL.createObjectURL(arquivo);
      modulo.atualizarFoto(urlPreviewFoto);
      if (statusFoto) statusFoto.textContent = `Nova foto selecionada: ${arquivo.name}`;
    });
  }

  function validarResposta(resultado) {
    if (!resultado) throw new Error("A API não retornou uma resposta para a atualização.");
    if (resultado.sucesso === false || resultado.ok === false) {
      throw new Error(resultado.mensagem || resultado.message || "Não foi possível atualizar o membro.");
    }
    return resultado;
  }

  async function carregarMembro() {
    modulo.definirCarregando(true, "Carregando dados do membro...");
    modulo.mostrarAviso("Carregando os dados do membro...", "carregando");

    try {
      const membro = await modulo.buscarMembro(idMembro);
      modulo.preencherFormulario(formulario, membro);
      modulo.definirSomenteLeitura(formulario, false);
      modulo.configurarResumoEmTempoReal(formulario);
      atualizarTitulo(membro);

      const campoId = formulario.elements.ID;
      if (campoId) campoId.value = idMembro;

      dadosIniciais = serializarFormulario();
      modulo.mostrarAviso("Cadastro carregado. Faça as alterações necessárias.", "informacao");
    } catch (erro) {
      console.error("[EDITAR MEMBRO] Erro ao carregar:", erro);
      modulo.definirSomenteLeitura(formulario, true);
      modulo.mostrarAviso(erro?.message || "Não foi possível carregar os dados do membro.", "erro");
    } finally {
      modulo.definirCarregando(false);
    }
  }

  async function salvarAlteracoes(evento) {
    evento.preventDefault();
    if (salvando) return;

    const validacao = modulo.validar(formulario);
    if (!validacao.valido) {
      modulo.mostrarAviso(validacao.mensagem, "erro");
      return;
    }

    salvando = true;
    modulo.definirCarregando(true, "Salvando alterações...");
    modulo.mostrarAviso("Aguarde enquanto as alterações são salvas.", "carregando");

    try {
      const dadosFormulario = modulo.obterDados(formulario);
      dadosFormulario.ID = idMembro;
      dadosFormulario.id = idMembro;

      const arquivoFoto = modulo.obterArquivoFoto();
      if (arquivoFoto) {
        const fotoUrl = await modulo.enviarFoto(arquivoFoto);
        dadosFormulario.FOTO_URL = fotoUrl;
        modulo.atualizarFoto(fotoUrl);
      }

      const dados = modulo.prepararDadosApi(dadosFormulario);
      dados.id = idMembro;

      const resultado = validarResposta(
        await modulo.obterAuth().chamarApi({
          acao: "atualizar",
          id: idMembro,
          dados
        })
      );

      alteracoesSalvas = true;
      dadosIniciais = serializarFormulario();
      modulo.mostrarAviso(resultado.mensagem || "Cadastro atualizado com sucesso.", "sucesso");

      window.setTimeout(function () {
        window.location.href = `visualizar-membro.html?id=${encodeURIComponent(idMembro)}`;
      }, 900);
    } catch (erro) {
      console.error("[EDITAR MEMBRO] Erro ao salvar:", erro);
      modulo.mostrarAviso(erro?.message || "Não foi possível salvar as alterações.", "erro");
    } finally {
      salvando = false;
      modulo.definirCarregando(false);
    }
  }

  function inicializar() {
    try {
      modulo = obterModulo();
      formulario = document.getElementById("formEditarMembro");

      if (!formulario) throw new Error("O formulário de edição do membro não foi encontrado.");

      idMembro = texto(modulo.obterIdUrl());
      if (!idMembro) throw new Error("Não foi informado qual membro deve ser editado.");

      modulo.definirSomenteLeitura(formulario, true);
      formulario.addEventListener("submit", salvarAlteracoes);
      configurarDestinoCancelar();
      configurarPreviewFoto();
      carregarMembro();
    } catch (erro) {
      console.error("[EDITAR MEMBRO] Erro na inicialização:", erro);
      modulo?.mostrarAviso?.(erro?.message || "Não foi possível inicializar a edição.", "erro");
    }
  }

  window.addEventListener("beforeunload", function (evento) {
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
