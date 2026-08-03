visualizar-membro.js

/** * Controlador da tela de visualização do membro. * Estrutura
preparada para evolução do Histórico Ministerial. */

(function (window, document) { “use strict”;

    let M = null;
    let F = null;
    let id = "";

    async function carregarHistorico() {
        const container = document.getElementById("historicoMembro");

        if (!container) return;

        container.innerHTML = `
            <div class="historico-carregando">
                Carregando histórico...
            </div>
        `;
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

            const dados = await M.buscar(id);

            M.preencher(F, dados);

            if (F.elements.ID) {
                F.elements.ID.value = id;
            }

            M.somenteLeitura(F, true);

            const statusFoto =
                document.getElementById("statusFoto");

            if (statusFoto) {
                statusFoto.hidden = true;
            }

            await carregarHistorico();

            M.aviso(
                "Ficha carregada com sucesso.",
                "sucesso"
            );

        } catch (erro) {

            M.aviso(
                erro.message ||
                "Não foi possível carregar a ficha.",
                "erro"
            );

        } finally {

            M.carregando(false);

        }
    }

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            iniciar,
            { once: true }
        );

    } else {

        iniciar();

    }

})(window, document);
