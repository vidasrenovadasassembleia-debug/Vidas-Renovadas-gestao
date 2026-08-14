"use strict";

/* ==========================================================================
   ADMINISTRAÇÃO — CONFIGURAÇÕES
   Vidas Renovadas Gestão 2.0
   ========================================================================== */

(function (window, document) {

  const ACOES_API = Object.freeze({
  OBTER: "obterConfiguracoes",
  SALVAR: "salvarConfiguracoes",
  UPLOAD: "uploadArquivoSistema"
});

  let contexto = null;

  const estado = {
    configuracoes: {},
    carregando: false,
    salvando: false
  };

  const referencias = {};

  function texto(valor) {
    return String(valor ?? "").trim();
  }

  function montarEstrutura() {
    contexto.container.innerHTML = `
      <div class="administracao-bloco">

        <div>
          <h4 class="administracao-bloco-titulo">
            Dados institucionais
          </h4>

          <p class="administracao-bloco-descricao">
            Informações oficiais da igreja utilizadas pelo sistema.
          </p>
        </div>

        <form id="formAdministracaoConfiguracoes">

          <div class="administracao-form-grid">

            <div class="campo">
              <label for="configNomeIgreja">
                Nome da igreja
              </label>

              <input
                type="text"
                id="configNomeIgreja"
                name="nome_igreja"
                required
              >
            </div>

            <div class="campo">
              <label for="configCnpj">
                CNPJ
              </label>

              <input
                type="text"
                id="configCnpj"
                name="cnpj"
              >
            </div>

            <div class="campo">
              <label for="configPastorPresidente">
                Pastor Presidente
              </label>

              <input
                type="text"
                id="configPastorPresidente"
                name="pastor_presidente"
              >
            </div>

            <div class="campo">
              <label for="configTelefoneIgreja">
                Telefone
              </label>

              <input
                type="tel"
                id="configTelefoneIgreja"
                name="telefone_igreja"
              >
            </div>

            <div class="campo">
              <label for="configWhatsappIgreja">
                WhatsApp
              </label>

              <input
                type="tel"
                id="configWhatsappIgreja"
                name="whatsapp_igreja"
              >
            </div>

            <div class="campo">
              <label for="configEmailIgreja">
                E-mail
              </label>

              <input
                type="email"
                id="configEmailIgreja"
                name="email_igreja"
              >
            </div>

            <div class="campo">
              <label for="configEnderecoIgreja">
                Endereço
              </label>

              <input
                type="text"
                id="configEnderecoIgreja"
                name="endereco_igreja"
              >
            </div>

            <div class="campo">
              <label for="configCidadeIgreja">
                Cidade
              </label>

              <input
                type="text"
                id="configCidadeIgreja"
                name="cidade_igreja"
              >
            </div>

            <div class="campo">
              <label for="configEstadoIgreja">
                Estado
              </label>

              <input
                type="text"
                id="configEstadoIgreja"
                name="estado_igreja"
                maxlength="2"
                placeholder="RJ"
              >
            </div>

            <div class="campo">
              <label for="configCepIgreja">
                CEP
              </label>

              <input
                type="text"
                id="configCepIgreja"
                name="cep_igreja"
              >
            </div>

          </div>

          <div
            class="administracao-bloco"
            style="margin-top: 22px;"
          >

            <div>
              <h4 class="administracao-bloco-titulo">
                Parâmetros gerais
              </h4>

              <p class="administracao-bloco-descricao">
                Valores padrão utilizados nas rotinas do sistema.
              </p>
            </div>

            <div class="administracao-form-grid">

              <div class="campo">
                <label for="configCongregacaoPadrao">
                  Congregação padrão
                </label>

                <input
                  type="text"
                  id="configCongregacaoPadrao"
                  name="congregacao_padrao"
                >
              </div>

              <div class="campo">
                <label for="configValidadeCarteirinha">
                  Validade da carteirinha (meses)
                </label>

                <input
                  type="number"
                  id="configValidadeCarteirinha"
                  name="validade_carteirinha_meses"
                  min="1"
                  max="120"
                >
              </div>

            </div>

          </div>

          <div class="administracao-form-acoes">

            <button
              type="button"
              class="btn btn-contorno"
              id="botaoRecarregarConfiguracoes"
            >
              Recarregar
            </button>

            <button
              type="submit"
              class="btn btn-dourado"
              id="botaoSalvarConfiguracoesAdministracao"
            >
              Salvar configurações
            </button>

          </div>

        </form>

      </div>
    `;

    [
      "formAdministracaoConfiguracoes",
      "configNomeIgreja",
      "configCnpj",
      "configPastorPresidente",
      "configTelefoneIgreja",
      "configWhatsappIgreja",
      "configEmailIgreja",
      "configEnderecoIgreja",
      "configCidadeIgreja",
      "configEstadoIgreja",
      "configCepIgreja",
      "configCongregacaoPadrao",
      "configValidadeCarteirinha",
      "botaoRecarregarConfiguracoes",
      "botaoSalvarConfiguracoesAdministracao"
    ].forEach(function (id) {
      referencias[id] = document.getElementById(id);
    });
  }

  function preencherFormulario(configuracoes) {
    configuracoes =
      configuracoes &&
      typeof configuracoes === "object"
        ? configuracoes
        : {};

    referencias.configNomeIgreja.value =
      texto(configuracoes.nomeIgreja);

    referencias.configCnpj.value =
      texto(configuracoes.cnpj);

    referencias.configPastorPresidente.value =
      texto(configuracoes.pastorPresidente);

    referencias.configTelefoneIgreja.value =
      texto(configuracoes.telefoneIgreja);

    referencias.configWhatsappIgreja.value =
      texto(configuracoes.whatsappIgreja);

    referencias.configEmailIgreja.value =
      texto(configuracoes.emailIgreja);

    referencias.configEnderecoIgreja.value =
      texto(configuracoes.enderecoIgreja);

    referencias.configCidadeIgreja.value =
      texto(configuracoes.cidadeIgreja);

    referencias.configEstadoIgreja.value =
      texto(configuracoes.estadoIgreja)
        .toUpperCase();

    referencias.configCepIgreja.value =
      texto(configuracoes.cepIgreja);

    referencias.configCongregacaoPadrao.value =
      texto(configuracoes.congregacaoPadrao);

    referencias.configValidadeCarteirinha.value =
      texto(configuracoes.validadePadraoMeses);
  }

  function coletarFormulario() {
    return {
      nome_igreja:
        texto(referencias.configNomeIgreja.value),

      cnpj:
        texto(referencias.configCnpj.value),

      pastor_presidente:
        texto(
          referencias.configPastorPresidente.value
        ),

      telefone_igreja:
        texto(
          referencias.configTelefoneIgreja.value
        ),

      whatsapp_igreja:
        texto(
          referencias.configWhatsappIgreja.value
        ),

      email_igreja:
        texto(
          referencias.configEmailIgreja.value
        ),

      endereco_igreja:
        texto(
          referencias.configEnderecoIgreja.value
        ),

      cidade_igreja:
        texto(
          referencias.configCidadeIgreja.value
        ),

      estado_igreja:
        texto(
          referencias.configEstadoIgreja.value
        ).toUpperCase(),

      cep_igreja:
        texto(
          referencias.configCepIgreja.value
        ),

      congregacao_padrao:
        texto(
          referencias.configCongregacaoPadrao.value
        ),

      validade_carteirinha_meses:
        texto(
          referencias.configValidadeCarteirinha.value
        )
    };
  }

  async function carregarConfiguracoes() {
    if (estado.carregando) {
      return;
    }

    estado.carregando = true;

    contexto.limparAviso();

    referencias.botaoRecarregarConfiguracoes.disabled = true;
    referencias.botaoSalvarConfiguracoesAdministracao.disabled = true;

    try {
      contexto.definirCarregamentoGlobal(
        true,
        "Carregando configurações..."
      );

      const resposta =
        await contexto.chamarApi({
          acao: ACOES_API.OBTER
        });

      if (resposta?.sucesso === false) {
        throw new Error(
          resposta.mensagem ||
          "Não foi possível carregar as configurações."
        );
      }

      const configuracoes =
        resposta?.configuracoes &&
        typeof resposta.configuracoes === "object"
          ? resposta.configuracoes
          : {};

      estado.configuracoes = configuracoes;

      preencherFormulario(configuracoes);

    } catch (erro) {
      console.error(
        "[ADMINISTRAÇÃO/CONFIGURAÇÕES]",
        erro
      );

      contexto.mostrarAviso(
        erro?.message ||
        "Não foi possível carregar as configurações.",
        "erro"
      );

    } finally {
      estado.carregando = false;

      referencias.botaoRecarregarConfiguracoes.disabled = false;
      referencias.botaoSalvarConfiguracoesAdministracao.disabled = false;

      contexto.definirCarregamentoGlobal(false);
    }
  }

  async function salvarConfiguracoes(evento) {
    evento.preventDefault();

    if (estado.salvando) {
      return;
    }

    const dados = coletarFormulario();

    if (!dados.nome_igreja) {
      contexto.mostrarAviso(
        "Informe o nome da igreja.",
        "aviso"
      );

      referencias.configNomeIgreja.focus();
      return;
    }

    if (
      dados.estado_igreja &&
      dados.estado_igreja.length !== 2
    ) {
      contexto.mostrarAviso(
        "Informe o estado com 2 letras, por exemplo RJ.",
        "aviso"
      );

      referencias.configEstadoIgreja.focus();
      return;
    }

    estado.salvando = true;

    referencias.botaoSalvarConfiguracoesAdministracao.disabled = true;
    referencias.botaoRecarregarConfiguracoes.disabled = true;

    try {
      contexto.definirCarregamentoGlobal(
        true,
        "Salvando configurações..."
      );

      const resposta =
        await contexto.chamarApi({
          acao: ACOES_API.SALVAR,
          dados: dados
        });

      if (resposta?.sucesso === false) {
        throw new Error(
          resposta.mensagem ||
          "Não foi possível salvar as configurações."
        );
      }

      estado.configuracoes = {
        ...estado.configuracoes,
        ...dados
      };

      contexto.mostrarAviso(
        resposta?.mensagem ||
        "Configurações salvas com sucesso.",
        "sucesso"
      );

    } catch (erro) {
      console.error(
        "[ADMINISTRAÇÃO/CONFIGURAÇÕES]",
        erro
      );

      contexto.mostrarAviso(
        erro?.message ||
        "Não foi possível salvar as configurações.",
        "erro"
      );

    } finally {
      estado.salvando = false;

      referencias.botaoSalvarConfiguracoesAdministracao.disabled = false;
      referencias.botaoRecarregarConfiguracoes.disabled = false;

      contexto.definirCarregamentoGlobal(false);
    }
  }

  function configurarEventos() {
    referencias.formAdministracaoConfiguracoes
      .addEventListener(
        "submit",
        salvarConfiguracoes
      );

    referencias.botaoRecarregarConfiguracoes
      .addEventListener(
        "click",
        carregarConfiguracoes
      );

    referencias.configEstadoIgreja
      .addEventListener(
        "input",
        function () {
          this.value =
            this.value
              .replace(/[^a-zA-Z]/g, "")
              .slice(0, 2)
              .toUpperCase();
        }
      );
  }

  async function iniciar(novoContexto) {
    contexto = novoContexto;

    montarEstrutura();
    configurarEventos();

    await carregarConfiguracoes();
  }

  async function atualizar() {
    await carregarConfiguracoes();
  }

  async function destruir() {
    contexto = null;

    estado.configuracoes = {};
    estado.carregando = false;
    estado.salvando = false;

    Object.keys(referencias)
      .forEach(function (chave) {
        delete referencias[chave];
      });
  }

  window.VRAdministracaoConfiguracoes =
    Object.freeze({
      iniciar: iniciar,
      atualizar: atualizar,
      destruir: destruir
    });

})(window, document);
