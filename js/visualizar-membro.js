/** Controlador: visualizar membro — mesma ficha, modo somente leitura */
(function (window, document) {
  "use strict";

  let M;
  let F;
  let id = "";

  async function carregarHistorico(idMembro) {
    // O conteúdo será incluído na próxima etapa.
  }

  function montarTimeline() {
    // O conteúdo será incluído na próxima etapa.
  }

  function criarEvento() {
    // O conteúdo será incluído na próxima etapa.
  }

  function formatarData() {
    // O conteúdo será incluído na próxima etapa.
  }

  async function iniciar() {
    M = window.VRGMembroFormulario;
    F = document.getElementById("formVisualizarMembro");
    id = M?.idUrl();

    if (!M || !F || !id) {
      M?.aviso(
        "Não foi informado qual membro deve ser visualizado.",
        "erro"
      );
      return;
    }

    const editar = document.getElementById("botaoEditarMembro");

    if (editar) {
      editar.href =
        "editar-membro.html?id=" +
        encodeURIComponent(id);
    }

    M.somenteLeitura(F, true);
    M.carregando(true, "Carregando ficha...");

    try {
      const d = await M.buscar(id);

      M.preencher(F, d);
      F.elements.ID.value = id;
      M.somenteLeitura(F, true);

      const s = document.getElementById("statusFoto");

      if (s) {
        s.hidden = true;
      }

      await carregarHistorico(id);

      M.aviso(
        "Ficha carregada com sucesso.",
        "sucesso"
      );
    } catch (e) {
      M.aviso(
        e.message ||
          "Não foi possível carregar a ficha.",
        "erro"
      );
    } finally {
      M.carregando(false);
    }
  }

  document.readyState === "loading"
    ? document.addEventListener(
        "DOMContentLoaded",
        iniciar,
        { once: true }
      )
    : iniciar();

})(window, document);
