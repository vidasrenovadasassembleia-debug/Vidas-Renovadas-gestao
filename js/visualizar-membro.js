/* ==========================================================================
   VIDAS RENOVADAS GESTÃO 2.0
   Arquivo: js/editar-membro.js
   Descrição: Ficha de visualização em modo editável
   ========================================================================== */
"use strict";
(function (window, document) {
  const CAMPOS_DATA = new Set(["DATA_CADASTRO","DATA_NASCIMENTO","DATA_EMISSAO_RG","DATA_CONVERSAO","DATA_BATISMO_AGUAS","DATA_ADMISSAO","DATA_CONSAGRACAO","DATA_CASAMENTO"]);
  let formulario = null;
  let idMembro = "";
  let arquivoFotoSelecionado = null;
  let urlPreviewFoto = "";

  function primeiroValor(objeto, chaves) {
    for (const chave of chaves) {
      const valor = objeto?.[chave];
      if (valor !== undefined && valor !== null && String(valor).trim() !== "") return valor;
    }
    return "";
  }

  function normalizarMembro(m) {
    return {
      ID: primeiroValor(m, ["ID","id"]),
      CODIGO: primeiroValor(m, ["CODIGO","codigo"]),
      NUMERO_CARTEIRINHA: primeiroValor(m, ["NUMERO_CARTEIRINHA","numeroCarteirinha"]),
      FOTO_URL: primeiroValor(m, ["FOTO_URL","fotoUrl","foto"]),
      NOME_COMPLETO: primeiroValor(m, ["NOME_COMPLETO","nomeCompleto","nome"]),
      DATA_NASCIMENTO: primeiroValor(m, ["DATA_NASCIMENTO","dataNascimento"]),
      SEXO: primeiroValor(m, ["SEXO","sexo"]),
      ESTADO_CIVIL: primeiroValor(m, ["ESTADO_CIVIL","estadoCivil"]),
      PROFISSAO: primeiroValor(m, ["PROFISSAO","profissao"]),
      NATURALIDADE: primeiroValor(m, ["NATURALIDADE","naturalidade"]),
      NACIONALIDADE: primeiroValor(m, ["NACIONALIDADE","nacionalidade"]),
      TELEFONE: primeiroValor(m, ["TELEFONE","telefone"]),
      WHATSAPP: primeiroValor(m, ["WHATSAPP","whatsapp"]),
      EMAIL: primeiroValor(m, ["EMAIL","email"]),
      CPF: primeiroValor(m, ["CPF","cpf"]),
      RG: primeiroValor(m, ["RG","rg"]),
      ORGAO_EMISSOR: primeiroValor(m, ["ORGAO_EMISSOR","orgaoEmissor"]),
      DATA_EMISSAO_RG: primeiroValor(m, ["DATA_EMISSAO_RG","dataEmissaoRg"]),
      CEP: primeiroValor(m, ["CEP","cep"]),
      ENDERECO: primeiroValor(m, ["ENDERECO","endereco"]),
      NUMERO: primeiroValor(m, ["NUMERO","numero"]),
      COMPLEMENTO: primeiroValor(m, ["COMPLEMENTO","complemento"]),
      BAIRRO: primeiroValor(m, ["BAIRRO","bairro"]),
      CIDADE: primeiroValor(m, ["CIDADE","cidade"]),
      ESTADO: primeiroValor(m, ["ESTADO","estado"]),
      DATA_CONVERSAO: primeiroValor(m, ["DATA_CONVERSAO","dataConversao"]),
      DATA_BATISMO_AGUAS: primeiroValor(m, ["DATA_BATISMO_AGUAS","dataBatismoAguas","dataBatismo"]),
      CARGO: primeiroValor(m, ["CARGO","cargo"]),
      CONGREGACAO: primeiroValor(m, ["CONGREGACAO","congregacao"]),
      SITUACAO: primeiroValor(m, ["SITUACAO","situacao"]) || "ATIVO",
      DATA_ADMISSAO: primeiroValor(m, ["DATA_ADMISSAO","dataAdmissao"]),
      IGREJA_ORIGEM: primeiroValor(m, ["IGREJA_ORIGEM","igrejaOrigem"]),
      DATA_CONSAGRACAO: primeiroValor(m, ["DATA_CONSAGRACAO","dataConsagracao"]),
      NOME_PAI: primeiroValor(m, ["NOME_PAI","nomePai","pai"]),
      NOME_MAE: primeiroValor(m, ["NOME_MAE","nomeMae","mae"]),
      CONJUGE: primeiroValor(m, ["CONJUGE","conjuge"]),
      DATA_CASAMENTO: primeiroValor(m, ["DATA_CASAMENTO","dataCasamento"]),
      ID_FAMILIA: primeiroValor(m, ["ID_FAMILIA","idFamilia"]),
      OBSERVACOES: primeiroValor(m, ["OBSERVACOES","observacoes"]),
      DATA_CADASTRO: primeiroValor(m, ["DATA_CADASTRO","dataCadastro","criadoEm"])
    };
  }

  function normalizarDataCampo(valor) {
    const texto = String(valor || "").trim();
    if (!texto) return "";
    if (/^\d{4}-\d{2}-\d{2}/.test(texto)) return texto.slice(0,10);
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
      const [d,m,a] = texto.split("/");
      return `${a}-${m}-${d}`;
    }
    return "";
  }

  function definirAviso(mensagem, ativo=true) {
    const aviso = document.getElementById("avisoFicha");
    if (!aviso) return;
    aviso.textContent = mensagem || "";
    aviso.classList.toggle("ativo", ativo);
  }

  function preencherFormulario(membro) {
    document.getElementById("ID").value = membro.ID || idMembro;
    document.getElementById("FOTO_URL").value = membro.FOTO_URL || "";

    document.querySelectorAll("[data-campo-edicao]").forEach((campo) => {
      const nome = campo.dataset.campoEdicao;
      campo.value = CAMPOS_DATA.has(nome) ? normalizarDataCampo(membro[nome]) : (membro[nome] ?? "");
    });

    document.querySelectorAll("[data-campo-leitura]").forEach((elemento) => {
      const nome = elemento.dataset.campoLeitura;
      let valor = membro[nome];
      if (CAMPOS_DATA.has(nome) && valor) valor = window.VRG.formatarData(valor);
      elemento.textContent = String(valor || "—");
    });

    const foto = document.getElementById("fotoMembro");
    const placeholder = document.getElementById("fotoMembroPlaceholder");
    if (foto && placeholder && membro.FOTO_URL) {
      foto.src = membro.FOTO_URL;
      foto.hidden = false;
      placeholder.hidden = true;
    }

    const cancelar = document.getElementById("botaoCancelarEdicao");
    if (cancelar) cancelar.href = `visualizar-membro.html?id=${encodeURIComponent(idMembro)}`;
  }

  async function buscarMembro() {
    const resposta = await window.VRGAuth.chamarApi({ acao: "buscarMembro", id: idMembro });
    let membro = resposta?.membro || resposta?.dados || resposta?.data || resposta;
    if (typeof membro === "string") membro = JSON.parse(membro);
    if (!membro || typeof membro !== "object") throw new Error("O cadastro do membro não foi retornado pela API.");
    return normalizarMembro(membro);
  }

  function prepararDados() {
    const dados = Object.fromEntries(new FormData(formulario).entries());
    dados.id = idMembro;
    dados.ID = idMembro;
    return dados;
  }

  async function salvar(evento) {
    evento.preventDefault();
    if (!window.VRG.validarFormulario(formulario)) return;
    if (arquivoFotoSelecionado) {
      window.VRG.erro("A nova foto foi pré-visualizada, mas o envio da foto ainda precisa ser conectado.");
      return;
    }

    const botao = document.getElementById("botaoSalvarEdicao");
    const textoOriginal = botao?.textContent || "✓ Salvar alterações";
    if (botao) { botao.disabled = true; botao.textContent = "Salvando..."; }

    try {
      await window.VRG.comCarregamento(
        () => window.VRGAuth.chamarApi({ acao: "atualizarMembro", dados: prepararDados() }),
        "Salvando alterações..."
      );
      window.VRG.sucesso("Cadastro atualizado com sucesso.");
      window.setTimeout(() => window.VRG.navegar(`visualizar-membro.html?id=${encodeURIComponent(idMembro)}`), 650);
    } catch (erro) {
      console.error("[Editar membro]", erro);
      window.VRG.erro(erro.message || "Não foi possível salvar as alterações.");
    } finally {
      if (botao) { botao.disabled = false; botao.textContent = textoOriginal; }
    }
  }

  function configurarFoto() {
    const arquivo = document.getElementById("arquivoFotoMembro");
    const foto = document.getElementById("fotoMembro");
    const placeholder = document.getElementById("fotoMembroPlaceholder");
    const status = document.getElementById("statusFoto");
    if (!arquivo || !foto || !placeholder) return;

    arquivo.addEventListener("change", () => {
      const selecionado = arquivo.files?.[0] || null;
      arquivoFotoSelecionado = selecionado;
      if (urlPreviewFoto) URL.revokeObjectURL(urlPreviewFoto);
      if (!selecionado) return;
      urlPreviewFoto = URL.createObjectURL(selecionado);
      foto.src = urlPreviewFoto;
      foto.hidden = false;
      placeholder.hidden = true;
      if (status) status.textContent = `Nova foto selecionada: ${selecionado.name}`;
    });
  }

  async function inicializar() {
    formulario = document.getElementById("formFichaMembroEditavel");
    if (!formulario || !window.VRG || !window.VRGAuth || typeof window.VRGAuth.chamarApi !== "function") {
      definirAviso("Os recursos necessários da página não foram carregados.");
      return;
    }

    idMembro = String(window.VRG.obterParametro("id") || "").trim();
    if (!idMembro) {
      definirAviso("Não foi informado qual membro deve ser editado.");
      return;
    }

    formulario.addEventListener("submit", salvar);
    configurarFoto();

    try {
      const membro = await window.VRG.comCarregamento(buscarMembro, "Carregando ficha do membro...");
      preencherFormulario(membro);
      definirAviso("", false);
    } catch (erro) {
      console.error("[Editar membro]", erro);
      definirAviso(erro.message || "Não foi possível carregar a ficha do membro.");
      window.VRG.erro(erro.message || "Não foi possível carregar a ficha do membro.");
    }
  }

  window.addEventListener("beforeunload", () => {
    if (urlPreviewFoto) URL.revokeObjectURL(urlPreviewFoto);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializar, { once:true });
  } else {
    inicializar();
  }
})(window, document);
