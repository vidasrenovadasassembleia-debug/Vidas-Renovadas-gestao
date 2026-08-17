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

  const TIPOS_ARQUIVO = Object.freeze({
    logo: {
      titulo: "Logo da igreja",
      descricao: "Imagem institucional utilizada pelo sistema."
    },
    assinatura: {
      titulo: "Assinatura",
      descricao: "Assinatura institucional utilizada nos documentos."
    },
    favicon: {
      titulo: "Favicon",
      descricao: "Ícone exibido na aba do navegador."
    }
  });

  let contexto = null;

  const estado = {
    configuracoes: {},
    arquivos: {},
    carregando: false,
    salvando: false,
    uploadEmAndamento: ""
  };

  const referencias = {};

  function texto(valor) {
    return String(valor ?? "").trim();
  }

  function booleano(valor) {
    if (typeof valor === "boolean") {
      return valor;
    }

    return ["true", "1", "sim", "yes"].includes(
      texto(valor).toLowerCase()
    );
  }

  function escaparHtml(valor) {
    return String(valor ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function montarCartaoArquivo(chave) {
    const dados = TIPOS_ARQUIVO[chave];

    return `
      <article class="administracao-bloco" style="display:grid;gap:14px;">
        <div>
          <h4 class="administracao-bloco-titulo">${escaparHtml(dados.titulo)}</h4>
          <p class="administracao-bloco-descricao">${escaparHtml(dados.descricao)}</p>
        </div>

        <div style="min-height:150px;display:grid;place-items:center;padding:14px;border:1px solid var(--borda-sistema, #d9e2ec);border-radius:14px;background:#fff;">
          <img id="previewArquivo_${chave}" alt="${escaparHtml(dados.titulo)}" style="display:none;width:auto;max-width:100%;max-height:120px;object-fit:contain;">
          <span id="placeholderArquivo_${chave}" class="administracao-bloco-descricao">Nenhum arquivo carregado.</span>
        </div>

        <div class="campo">
          <label for="arquivo_${chave}">Selecionar novo arquivo</label>
          <input type="file" id="arquivo_${chave}" accept="image/jpeg,image/png,image/webp">
          <small class="administracao-bloco-descricao">JPG, PNG ou WebP. Limite de 4 MB.</small>
        </div>

        <button type="button" class="btn btn-contorno" id="botaoUpload_${chave}">
          Enviar ${escaparHtml(dados.titulo.toLowerCase())}
        </button>
      </article>
    `;
  }

  function montarEstrutura() {
    contexto.container.innerHTML = `
      <form id="formAdministracaoConfiguracoes">

        <div class="administracao-bloco">
          <div>
            <h4 class="administracao-bloco-titulo">Dados institucionais</h4>
            <p class="administracao-bloco-descricao">Informações oficiais da igreja utilizadas pelo sistema.</p>
          </div>

          <div class="administracao-form-grid">
            <div class="campo">
              <label for="configNomeIgreja">Nome da igreja</label>
              <input type="text" id="configNomeIgreja" name="nomeIgreja" required>
            </div>

            <div class="campo">
              <label for="configCnpj">CNPJ</label>
              <input type="text" id="configCnpj" name="cnpj">
            </div>

            <div class="campo">
              <label for="configPastorPresidente">Pastor Presidente</label>
              <input type="text" id="configPastorPresidente" name="pastorPresidente">
            </div>

            <div class="campo">
              <label for="configTelefoneIgreja">Telefone</label>
              <input type="tel" id="configTelefoneIgreja" name="telefoneIgreja">
            </div>

            <div class="campo">
              <label for="configWhatsappIgreja">WhatsApp</label>
              <input type="tel" id="configWhatsappIgreja" name="whatsappIgreja">
            </div>

            <div class="campo">
              <label for="configEmailIgreja">E-mail</label>
              <input type="email" id="configEmailIgreja" name="emailIgreja">
            </div>

            <div class="campo">
              <label for="configEnderecoIgreja">Endereço</label>
              <input type="text" id="configEnderecoIgreja" name="enderecoIgreja">
            </div>

            <div class="campo">
              <label for="configCidadeIgreja">Cidade</label>
              <input type="text" id="configCidadeIgreja" name="cidadeIgreja">
            </div>

            <div class="campo">
              <label for="configEstadoIgreja">Estado</label>
              <input type="text" id="configEstadoIgreja" name="estadoIgreja" maxlength="2" placeholder="RJ">
            </div>

            <div class="campo">
              <label for="configCepIgreja">CEP</label>
              <input type="text" id="configCepIgreja" name="cepIgreja">
            </div>

            <div class="campo">
              <label for="configSiteIgreja">Site</label>
              <input type="url" id="configSiteIgreja" name="siteIgreja" placeholder="https://">
            </div>
          </div>
        </div>

        <div class="administracao-bloco" style="margin-top:22px;">
          <div>
            <h4 class="administracao-bloco-titulo">Parâmetros gerais</h4>
            <p class="administracao-bloco-descricao">Valores padrão utilizados nas rotinas do sistema.</p>
          </div>

          <div class="administracao-form-grid">
            <div class="campo">
              <label for="configCongregacaoPadrao">Congregação padrão</label>
              <input type="text" id="configCongregacaoPadrao" name="congregacaoPadrao">
            </div>

            <div class="campo">
              <label for="configValidadeCarteirinha">Validade da carteirinha (meses)</label>
              <input type="number" id="configValidadeCarteirinha" name="validadePadraoMeses" min="1" max="120">
            </div>

            <div class="campo">
              <label for="configCargoPadrao">Cargo padrão</label>
              <input type="text" id="configCargoPadrao" name="cargoPadrao">
            </div>

            <div class="campo">
              <label for="configCorPrincipal">Cor principal</label>
              <input type="color" id="configCorPrincipal" name="corPrincipal" value="#0f2f48">
            </div>

            <div class="campo">
              <label for="configCorSecundaria">Cor secundária</label>
              <input type="color" id="configCorSecundaria" name="corSecundaria" value="#b98a45">
            </div>
          </div>

          <div style="display:grid;gap:12px;margin-top:18px;">
            <label style="display:flex;align-items:center;gap:10px;">
              <input type="checkbox" id="configExibirQrCode">
              <span>Exibir QR Code</span>
            </label>

            <label style="display:flex;align-items:center;gap:10px;">
              <input type="checkbox" id="configExibirAssinatura">
              <span>Exibir assinatura</span>
            </label>

            <label style="display:flex;align-items:center;gap:10px;">
              <input type="checkbox" id="configExibirFoto">
              <span>Exibir foto</span>
            </label>
          </div>
        </div>

        <div class="administracao-bloco" style="margin-top:22px;">
          <div>
            <h4 class="administracao-bloco-titulo">Identidade visual e arquivos</h4>
            <p class="administracao-bloco-descricao">Logo, assinatura e favicon armazenados na área oficial de arquivos do sistema.</p>
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-top:16px;">
            ${montarCartaoArquivo("logo")}
            ${montarCartaoArquivo("assinatura")}
            ${montarCartaoArquivo("favicon")}
          </div>
        </div>

        <div class="administracao-form-acoes" style="margin-top:22px;">
          <button type="button" class="btn btn-contorno" id="botaoRecarregarConfiguracoes">Recarregar</button>
          <button type="submit" class="btn btn-dourado" id="botaoSalvarConfiguracoesAdministracao">Salvar configurações</button>
        </div>

      </form>
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
      "configSiteIgreja",
      "configCongregacaoPadrao",
      "configValidadeCarteirinha",
      "configCargoPadrao",
      "configCorPrincipal",
      "configCorSecundaria",
      "configExibirQrCode",
      "configExibirAssinatura",
      "configExibirFoto",
      "botaoRecarregarConfiguracoes",
      "botaoSalvarConfiguracoesAdministracao",
      "arquivo_logo",
      "arquivo_assinatura",
      "arquivo_favicon",
      "botaoUpload_logo",
      "botaoUpload_assinatura",
      "botaoUpload_favicon",
      "previewArquivo_logo",
      "previewArquivo_assinatura",
      "previewArquivo_favicon",
      "placeholderArquivo_logo",
      "placeholderArquivo_assinatura",
      "placeholderArquivo_favicon"
    ].forEach(function (id) {
      referencias[id] = document.getElementById(id);
    });
  }

  function preencherFormulario(configuracoes) {
    configuracoes = configuracoes && typeof configuracoes === "object" ? configuracoes : {};

    referencias.configNomeIgreja.value = texto(configuracoes.nomeIgreja);
    referencias.configCnpj.value = texto(configuracoes.cnpj);
    referencias.configPastorPresidente.value = texto(configuracoes.pastorPresidente);
    referencias.configTelefoneIgreja.value = texto(configuracoes.telefoneIgreja);
    referencias.configWhatsappIgreja.value = texto(configuracoes.whatsappIgreja);
    referencias.configEmailIgreja.value = texto(configuracoes.emailIgreja);
    referencias.configEnderecoIgreja.value = texto(configuracoes.enderecoIgreja);
    referencias.configCidadeIgreja.value = texto(configuracoes.cidadeIgreja);
    referencias.configEstadoIgreja.value = texto(configuracoes.estadoIgreja).toUpperCase();
    referencias.configCepIgreja.value = texto(configuracoes.cepIgreja);
    referencias.configSiteIgreja.value = texto(configuracoes.siteIgreja);
    referencias.configCongregacaoPadrao.value = texto(configuracoes.congregacaoPadrao);
    referencias.configValidadeCarteirinha.value = texto(configuracoes.validadePadraoMeses);
    referencias.configCargoPadrao.value = texto(configuracoes.cargoPadrao);
    referencias.configCorPrincipal.value = texto(configuracoes.corPrincipal) || "#0f2f48";
    referencias.configCorSecundaria.value = texto(configuracoes.corSecundaria) || "#b98a45";
    referencias.configExibirQrCode.checked = booleano(configuracoes.exibirQrCode);
    referencias.configExibirAssinatura.checked = booleano(configuracoes.exibirAssinatura);
    referencias.configExibirFoto.checked = booleano(configuracoes.exibirFoto);
  }

  function atualizarPreviewArquivo(chave, url) {
    const preview = referencias["previewArquivo_" + chave];
    const placeholder = referencias["placeholderArquivo_" + chave];
    const endereco = texto(url);

    if (!preview || !placeholder) {
      return;
    }

    if (!endereco) {
      preview.removeAttribute("src");
      preview.style.display = "none";
      placeholder.style.display = "";
      placeholder.textContent = "Nenhum arquivo carregado.";
      return;
    }

    preview.src = endereco;
    preview.style.display = "block";
    placeholder.style.display = "none";
  }

  function preencherArquivos(arquivos) {
    arquivos = arquivos && typeof arquivos === "object" ? arquivos : {};
    estado.arquivos = arquivos;

    ["logo", "assinatura", "favicon"].forEach(function (chave) {
      atualizarPreviewArquivo(chave, arquivos[chave]);
    });
  }

  function coletarFormulario() {
    return {
      nomeIgreja: texto(referencias.configNomeIgreja.value),
      cnpj: texto(referencias.configCnpj.value),
      pastorPresidente: texto(referencias.configPastorPresidente.value),
      telefoneIgreja: texto(referencias.configTelefoneIgreja.value),
      whatsappIgreja: texto(referencias.configWhatsappIgreja.value),
      emailIgreja: texto(referencias.configEmailIgreja.value),
      enderecoIgreja: texto(referencias.configEnderecoIgreja.value),
      cidadeIgreja: texto(referencias.configCidadeIgreja.value),
      estadoIgreja: texto(referencias.configEstadoIgreja.value).toUpperCase(),
      cepIgreja: texto(referencias.configCepIgreja.value),
      siteIgreja: texto(referencias.configSiteIgreja.value),
      congregacaoPadrao: texto(referencias.configCongregacaoPadrao.value),
      validadePadraoMeses: texto(referencias.configValidadeCarteirinha.value),
      cargoPadrao: texto(referencias.configCargoPadrao.value),
      corPrincipal: texto(referencias.configCorPrincipal.value),
      corSecundaria: texto(referencias.configCorSecundaria.value),
      exibirQrCode: referencias.configExibirQrCode.checked,
      exibirAssinatura: referencias.configExibirAssinatura.checked,
      exibirFoto: referencias.configExibirFoto.checked
    };
  }

  function definirBotoesDisponiveis(disponivel) {
    referencias.botaoRecarregarConfiguracoes.disabled = !disponivel;
    referencias.botaoSalvarConfiguracoesAdministracao.disabled = !disponivel;

    ["logo", "assinatura", "favicon"].forEach(function (chave) {
      const botao = referencias["botaoUpload_" + chave];
      if (botao) {
        botao.disabled = !disponivel || Boolean(estado.uploadEmAndamento);
      }
    });
  }

  async function carregarConfiguracoes() {
    if (estado.carregando) {
      return;
    }

    estado.carregando = true;
    contexto.limparAviso();
    definirBotoesDisponiveis(false);

    try {
      contexto.definirCarregamentoGlobal(true, "Carregando configurações...");

      const resposta = await contexto.chamarApi({
        acao: ACOES_API.OBTER
      });

      if (resposta?.sucesso === false) {
        throw new Error(resposta.mensagem || "Não foi possível carregar as configurações.");
      }

      const configuracoes = resposta?.configuracoes && typeof resposta.configuracoes === "object" ? resposta.configuracoes : {};
      const arquivos = resposta?.arquivos && typeof resposta.arquivos === "object" ? resposta.arquivos : {};

      estado.configuracoes = configuracoes;
      estado.arquivos = arquivos;

      preencherFormulario(configuracoes);
      preencherArquivos(arquivos);

    } catch (erro) {
      console.error("[ADMINISTRAÇÃO/CONFIGURAÇÕES]", erro);
      contexto.mostrarAviso(erro?.message || "Não foi possível carregar as configurações.", "erro");

    } finally {
      estado.carregando = false;
      definirBotoesDisponiveis(true);
      contexto.definirCarregamentoGlobal(false);
    }
  }

  async function salvarConfiguracoes(evento) {
    evento.preventDefault();

    if (estado.salvando) {
      return;
    }

    const dados = coletarFormulario();

    if (!dados.nomeIgreja) {
      contexto.mostrarAviso("Informe o nome da igreja.", "aviso");
      referencias.configNomeIgreja.focus();
      return;
    }

    if (dados.estadoIgreja && dados.estadoIgreja.length !== 2) {
      contexto.mostrarAviso("Informe o estado com 2 letras, por exemplo RJ.", "aviso");
      referencias.configEstadoIgreja.focus();
      return;
    }

    const validade = Number(dados.validadePadraoMeses || 0);

    if (dados.validadePadraoMeses && (!Number.isFinite(validade) || validade < 1 || validade > 120)) {
      contexto.mostrarAviso("A validade da carteirinha deve estar entre 1 e 120 meses.", "aviso");
      referencias.configValidadeCarteirinha.focus();
      return;
    }

    estado.salvando = true;
    definirBotoesDisponiveis(false);

    try {
      contexto.definirCarregamentoGlobal(true, "Salvando configurações...");

      const resposta = await contexto.chamarApi({
        acao: ACOES_API.SALVAR,
        dados: dados
      });

      if (resposta?.sucesso === false) {
        throw new Error(resposta.mensagem || "Não foi possível salvar as configurações.");
      }

      estado.configuracoes = {
        ...estado.configuracoes,
        ...dados
      };

      contexto.mostrarAviso(resposta?.mensagem || "Configurações salvas com sucesso.", "sucesso");

    } catch (erro) {
      console.error("[ADMINISTRAÇÃO/CONFIGURAÇÕES]", erro);
      contexto.mostrarAviso(erro?.message || "Não foi possível salvar as configurações.", "erro");

    } finally {
      estado.salvando = false;
      definirBotoesDisponiveis(true);
      contexto.definirCarregamentoGlobal(false);
    }
  }

  function arquivoParaBase64(arquivo) {
    return new Promise(function (resolve, reject) {
      const leitor = new FileReader();

      leitor.onload = function () {
        const resultado = String(leitor.result || "");
        const indiceVirgula = resultado.indexOf(",");

        if (indiceVirgula < 0) {
          reject(new Error("Não foi possível ler o arquivo selecionado."));
          return;
        }

        resolve(resultado.slice(indiceVirgula + 1));
      };

      leitor.onerror = function () {
        reject(new Error("Não foi possível ler o arquivo selecionado."));
      };

      leitor.readAsDataURL(arquivo);
    });
  }

  async function enviarArquivo(chave) {
    if (estado.uploadEmAndamento || !TIPOS_ARQUIVO[chave]) {
      return;
    }

    const input = referencias["arquivo_" + chave];
    const arquivo = input?.files?.[0];

    if (!arquivo) {
      contexto.mostrarAviso("Selecione um arquivo antes de enviar.", "aviso");
      input?.focus();
      return;
    }

    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];

    if (!tiposPermitidos.includes(String(arquivo.type || "").toLowerCase())) {
      contexto.mostrarAviso("O arquivo deve estar no formato JPG, PNG ou WebP.", "aviso");
      return;
    }

    if (arquivo.size > 4 * 1024 * 1024) {
      contexto.mostrarAviso("O arquivo deve ter no máximo 4 MB.", "aviso");
      return;
    }

    estado.uploadEmAndamento = chave;
    definirBotoesDisponiveis(false);

    try {
      contexto.definirCarregamentoGlobal(true, "Enviando arquivo...");

      const base64 = await arquivoParaBase64(arquivo);

      const resposta = await contexto.chamarApi({
        acao: ACOES_API.UPLOAD,
        chave: chave,
        arquivo: {
          nome: arquivo.name,
          tipo: arquivo.type,
          base64: base64
        }
      });

      if (resposta?.sucesso === false) {
        throw new Error(resposta.mensagem || "Não foi possível enviar o arquivo.");
      }

      const url = texto(resposta?.arquivo?.url);

      if (url) {
        estado.arquivos[chave] = url;
        atualizarPreviewArquivo(chave, url);
      }

      input.value = "";
      contexto.mostrarAviso(resposta?.mensagem || "Arquivo enviado com sucesso.", "sucesso");

    } catch (erro) {
      console.error("[ADMINISTRAÇÃO/CONFIGURAÇÕES/UPLOAD]", erro);
      contexto.mostrarAviso(erro?.message || "Não foi possível enviar o arquivo.", "erro");

    } finally {
      estado.uploadEmAndamento = "";
      definirBotoesDisponiveis(true);
      contexto.definirCarregamentoGlobal(false);
    }
  }

  function configurarEventos() {
    referencias.formAdministracaoConfiguracoes.addEventListener("submit", salvarConfiguracoes);
    referencias.botaoRecarregarConfiguracoes.addEventListener("click", carregarConfiguracoes);

    referencias.configEstadoIgreja.addEventListener("input", function () {
      this.value = this.value
        .replace(/[^a-zA-Z]/g, "")
        .slice(0, 2)
        .toUpperCase();
    });

    ["logo", "assinatura", "favicon"].forEach(function (chave) {
      referencias["botaoUpload_" + chave].addEventListener("click", function () {
        enviarArquivo(chave);
      });
    });
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
    estado.arquivos = {};
    estado.carregando = false;
    estado.salvando = false;
    estado.uploadEmAndamento = "";

    Object.keys(referencias).forEach(function (chave) {
      delete referencias[chave];
    });
  }

  window.VRAdministracaoConfiguracoes = Object.freeze({
    iniciar: iniciar,
    atualizar: atualizar,
    destruir: destruir
  });

})(window, document);
