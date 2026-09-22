/**
 * Carta de Mudança — Vidas Renovadas Gestão
 * Pesquisa um membro, carrega a ficha pela API existente e preenche a carta.
 * Não altera nenhum cadastro.
 */
(function (window, document) {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const texto = (valor) => String(valor ?? "").trim();
  let membros = [];

  function auth() {
    const a = window.VRGAuth || window.Auth;
    if (!a?.chamarApi) throw new Error("Autenticação/API indisponível.");
    return a;
  }

  function normalizarBusca(valor) {
    return texto(valor).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function primeiro(obj, nomes, padrao = "") {
    for (const nome of nomes) {
      const valor = obj?.[nome];
      if (valor !== undefined && valor !== null && texto(valor)) return valor;
    }
    return padrao;
  }

  function normalizarItem(m) {
    return {
      id: texto(primeiro(m, ["id", "ID", "codigo", "CODIGO", "Código"])),
      nome: texto(primeiro(m, ["nome", "nomeCompleto", "NOME_COMPLETO", "Nome", "Nome Completo"], "Nome não informado")),
      congregacao: texto(primeiro(m, ["congregacao", "CONGREGACAO", "Congregação", "Congregacao"], "")),
      situacao: texto(primeiro(m, ["situacao", "SITUACAO", "Situação", "Situacao"], "Ativo"))
    };
  }

  function obterLista(resposta) {
    let lista = resposta?.membros ?? resposta?.dados ?? resposta?.resultado ?? [];
    if (typeof lista === "string") lista = JSON.parse(lista);
    if (!Array.isArray(lista)) throw new Error("A API retornou os membros em formato inválido.");
    return lista.map(normalizarItem).filter((m) => m.id && normalizarBusca(m.situacao) !== "excluido");
  }

  function escapar(valor) {
    return texto(valor)
      .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }

  function definir(id, valor) {
    const e = $(id);
    if (e) e.textContent = texto(valor) || "—";
  }

  function formatarData(valor) {
    const v = texto(valor);
    if (!v) return "—";
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) {
      const [ano, mes, dia] = v.slice(0, 10).split("-");
      return `${dia}/${mes}/${ano}`;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) return v;
    const d = new Date(valor);
    return Number.isNaN(d.getTime()) ? v : new Intl.DateTimeFormat("pt-BR").format(d);
  }

  function dataPorExtenso(data = new Date()) {
    return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" }).format(data);
  }

  function mensagem(msg, tipo = "info") {
    const e = $("mensagemCarta");
    if (!e) return;
    e.textContent = msg || "";
    e.className = `mensagem ${tipo}`;
    e.hidden = !msg;
  }

  function preencherFoto(url) {
    const img = $("fotoMembroCarta");
    const ph = $("fotoPlaceholder");
    const u = texto(url);
    if (!img || !ph) return;
    if (!u) { img.hidden = true; img.removeAttribute("src"); ph.hidden = false; return; }
    img.onload = () => { img.hidden = false; ph.hidden = true; };
    img.onerror = () => { img.hidden = true; ph.hidden = false; };
    img.src = u;
  }

  function preencherMembro(dados) {
    const M = window.VRGMembroFormulario;
    const m = M.normalizarMembro(dados || {});
    definir("nomeApresentacao", m.NOME_COMPLETO);
    definir("nomeMembro", m.NOME_COMPLETO);
    definir("nascimentoMembro", formatarData(m.DATA_NASCIMENTO));
    definir("naturalidadeMembro", m.NATURALIDADE);
    definir("estadoCivilMembro", m.ESTADO_CIVIL);
    definir("sexoMembro", m.SEXO);
    definir("batismoMembro", formatarData(m.DATA_BATISMO_AGUAS));
    definir("admissaoMembro", formatarData(m.DATA_ADMISSAO));
    definir("cargoMembro", m.CARGO || "Membro");
    definir("congregacaoMembro", m.CONGREGACAO);
    preencherFoto(m.FOTO_URL);
    $("cartaMudanca").hidden = false;
    $("botaoImprimir").disabled = false;
  }

  function sincronizarDestino() {
    const igreja = texto($("igrejaDestino")?.value);
    const e = $("igrejaDestinoTexto");
    if (e) e.textContent = igreja || "________________________________";
  }

  function renderizarResultados(lista) {
    const area = $("resultadosMembros");
    if (!area) return;
    if (!lista.length) {
      area.innerHTML = '<div class="resultado-vazio">Nenhum membro encontrado.</div>';
      area.hidden = false;
      return;
    }
    area.innerHTML = lista.slice(0, 12).map((m) => `
      <button type="button" class="resultado-membro" data-id="${escapar(m.id)}">
        <strong>${escapar(m.nome)}</strong>
        <span>${escapar(m.id)}${m.congregacao ? ` • ${escapar(m.congregacao)}` : ""}</span>
      </button>
    `).join("");
    area.hidden = false;
  }

  function pesquisar() {
    const termo = normalizarBusca($("pesquisaMembroCarta")?.value);
    if (!termo) { $("resultadosMembros").hidden = true; return; }
    renderizarResultados(membros.filter((m) =>
      normalizarBusca(m.nome).includes(termo) || normalizarBusca(m.id).includes(termo)
    ));
  }

  async function selecionarMembro(id) {
    try {
      mensagem("Carregando ficha do membro...");
      const M = window.VRGMembroFormulario;
      const dados = await M.buscar(id);
      preencherMembro(dados);
      const item = membros.find((m) => m.id === id);
      $("membroSelecionado").textContent = item ? `${item.nome} (${item.id})` : id;
      $("resultadosMembros").hidden = true;
      $("pesquisaMembroCarta").value = item?.nome || id;
      mensagem("");
    } catch (erro) {
      mensagem(erro?.message || "Não foi possível carregar o membro.", "erro");
    }
  }

  async function carregarMembros() {
    const resposta = await auth().chamarApi({ acao: "listar" });
    if (resposta?.sucesso === false) throw new Error(resposta.mensagem || "Não foi possível listar os membros.");
    membros = obterLista(resposta);
  }

  async function iniciar() {
    if (!window.VRGMembroFormulario) {
      mensagem("Não foi possível carregar os recursos da ficha de membro.", "erro");
      return;
    }
    definir("dataEmissao", dataPorExtenso());
    $("cartaMudanca").hidden = true;
    $("botaoImprimir").disabled = true;
    $("igrejaDestino")?.addEventListener("input", sincronizarDestino);
    $("botaoImprimir")?.addEventListener("click", () => window.print());
    $("pesquisaMembroCarta")?.addEventListener("input", pesquisar);
    $("resultadosMembros")?.addEventListener("click", (ev) => {
      const botao = ev.target.closest("[data-id]");
      if (botao) selecionarMembro(botao.dataset.id);
    });

    try {
      mensagem("Carregando membros...");
      await carregarMembros();
      mensagem("");
      const id = texto(new URLSearchParams(location.search).get("id"));
      if (id) await selecionarMembro(id);
    } catch (erro) {
      mensagem(erro?.message || "Não foi possível carregar os membros.", "erro");
    }
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", iniciar, { once: true })
    : iniciar();
})(window, document);
