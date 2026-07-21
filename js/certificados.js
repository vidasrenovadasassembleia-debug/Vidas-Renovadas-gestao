"use strict";

const ESTADO_CERTIFICADOS={configuracoes:{},arquivos:{},cargos:[],historico:[],certificadoAtual:null};
const $=(seletor,raiz=document)=>raiz.querySelector(seletor);
const $$=(seletor,raiz=document)=>Array.from(raiz.querySelectorAll(seletor));

document.addEventListener("DOMContentLoaded",iniciarModuloCertificados);

async function iniciarModuloCertificados(){
  const sessao=obterSessao();
  if(!sessao||!sessao.credential){window.location.replace("../index.html");return;}
  aplicarIdentidadeUsuario();
  configurarEventos();
  await carregarDadosIniciais();
  atualizarTodasPreviews();
}

function configurarEventos(){
  $$(".aba-certificado").forEach(botao=>botao.addEventListener("click",()=>abrirAba(botao.dataset.aba)));
  $("#botaoSair").addEventListener("click",()=>{sessionStorage.removeItem(CHAVE_SESSAO);window.location.href="../index.html";});
  $("#botaoPesquisarMembro").addEventListener("click",pesquisarMembro);
  $("#pesquisaMembro").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();pesquisarMembro();}});
  $("#formConsagracao").addEventListener("input",()=>atualizarPreview("consagracao"));
  $("#formBatismo").addEventListener("input",()=>atualizarPreview("batismo"));
  $("#formConsagracao").addEventListener("submit",e=>registrarEImprimir(e,"CONSAGRACAO"));
  $("#formBatismo").addEventListener("submit",e=>registrarEImprimir(e,"BATISMO"));
  $$('[data-visualizar]').forEach(b=>b.addEventListener("click",()=>atualizarPreview(b.dataset.visualizar)));
  $("#filtroHistorico").addEventListener("input",renderizarHistorico);
}

async function carregarDadosIniciais(){
  definirMensagem("Carregando dados do módulo...","info");
  try{
    const [dados,historico]=await Promise.all([chamarApi({acao:"obterDadosCertificados"}),chamarApi({acao:"listarCertificados"})]);
    ESTADO_CERTIFICADOS.configuracoes=dados.configuracoes||{};
    ESTADO_CERTIFICADOS.arquivos=dados.arquivos||{};
    ESTADO_CERTIFICADOS.cargos=dados.cargos||[];
    ESTADO_CERTIFICADOS.historico=historico.certificados||[];
    preencherCargos();preencherPadroes();renderizarHistorico();definirMensagem("Módulo carregado.","success");
    setTimeout(()=>$("#mensagemModulo").hidden=true,1800);
  }catch(erro){definirMensagem(erro.message,"error");}
}

function preencherCargos(){
  const select=$("#formConsagracao [name='cargo']");
  select.innerHTML='<option value="">Selecione</option>';
  ESTADO_CERTIFICADOS.cargos.forEach(cargo=>{const op=document.createElement("option");op.value=cargo;op.textContent=cargo;select.appendChild(op);});
}

function preencherPadroes(){
  const c=ESTADO_CERTIFICADOS.configuracoes;
  [$("#formConsagracao"),$("#formBatismo")].forEach(form=>{
    form.elements.pastor.value=c.pastorPresidente||c.pastorLocal||"";
    form.elements.local.value=[c.cidadeIgreja,c.estadoIgreja].filter(Boolean).join(" - ");
    form.elements.congregacao.value=c.congregacaoPadrao||"";
  });
}

function abrirAba(aba){
  $$(".aba-certificado").forEach(b=>b.classList.toggle("active",b.dataset.aba===aba));
  $$(".painel-certificado").forEach(p=>p.classList.toggle("active",p.dataset.painel===aba));
  if(aba==="historico")renderizarHistorico();
}

async function pesquisarMembro(){
  const termo=$("#pesquisaMembro").value.trim();
  if(termo.length<2){definirMensagem("Digite pelo menos 2 caracteres.","error");return;}
  definirMensagem("Pesquisando membro...","info");
  try{const r=await chamarApi({acao:"pesquisarMembrosCertificado",termo});mostrarResultadosMembros(r.membros||[]);definirMensagem(`${(r.membros||[]).length} resultado(s) encontrado(s).`,"success");}
  catch(erro){definirMensagem(erro.message,"error");}
}

function mostrarResultadosMembros(membros){
  const area=$("#resultadosMembros");area.innerHTML="";area.hidden=false;
  if(!membros.length){area.innerHTML='<div class="historico-vazio">Nenhum membro encontrado.</div>';return;}
  membros.forEach(m=>{const b=document.createElement("button");b.type="button";b.className="resultado-membro";b.innerHTML=`<span><strong>${esc(m.nomeCompleto)}</strong><br>${esc(m.congregacao||"Sem congregação")}</span><span>${esc(m.numeroCarteirinha||m.id)}<br>${esc(m.situacao)}</span>`;b.addEventListener("click",()=>selecionarMembro(m));area.appendChild(b);});
}

function selecionarMembro(m){
  const f=$("#formConsagracao");f.elements.idMembro.value=m.id;f.elements.numeroCarteirinha.value=m.numeroCarteirinha;f.elements.nome.value=m.nomeCompleto;f.elements.congregacao.value=m.congregacao||f.elements.congregacao.value;$("#resultadosMembros").hidden=true;$("#pesquisaMembro").value=m.nomeCompleto;atualizarPreview("consagracao");
}

function obterDadosFormulario(form,tipo){const fd=new FormData(form);const d=Object.fromEntries(fd.entries());d.tipo=tipo;return d;}

async function registrarEImprimir(evento,tipo){
  evento.preventDefault();const form=evento.currentTarget;if(!form.reportValidity())return;
  const dados=obterDadosFormulario(form,tipo);
  definirMensagem("Registrando certificado...","info");
  try{const r=await chamarApi({acao:"emitirCertificado",dados});dados.numero=r.certificado.numero;ESTADO_CERTIFICADOS.certificadoAtual=dados;atualizarPreview(tipo==="CONSAGRACAO"?"consagracao":"batismo",dados);definirMensagem(`${dados.numero} registrado com sucesso.`,"success");await recarregarHistorico();setTimeout(()=>window.print(),250);}
  catch(erro){definirMensagem(erro.message,"error");}
}

function atualizarTodasPreviews(){atualizarPreview("consagracao");atualizarPreview("batismo");}
function atualizarPreview(tipo,dadosForcados){
  const form=tipo==="consagracao"?$("#formConsagracao"):$("#formBatismo");
  const dados=dadosForcados||obterDadosFormulario(form,tipo==="consagracao"?"CONSAGRACAO":"BATISMO");
  const alvo=tipo==="consagracao"?$("#previewConsagracao"):$("#previewBatismo");
  alvo.innerHTML=montarCertificado(dados);
}

function montarCertificado(d){
  const c=ESTADO_CERTIFICADOS.configuracoes,a=ESTADO_CERTIFICADOS.arquivos;
  const igreja=c.nomeIgreja||"Assembleia de Deus Ministério Vidas Renovadas";
  const logo=a.logo?`<img class="cert-logo" src="${escAttr(a.logo)}" alt="Logo">`:"";
  const assinatura=a.assinatura?`<img src="${escAttr(a.assinatura)}" alt="Assinatura">`:"";
  const pastor=d.pastor||c.pastorPresidente||"Pastor responsável";
  const local=d.local||[c.cidadeIgreja,c.estadoIgreja].filter(Boolean).join(" - ");
  const data=dataExtenso(d.dataCerimonia);
  let titulo,texto;
  if(d.tipo==="CONSAGRACAO"){
    titulo="Certificado";texto=`Certificamos que <span class="cert-nome">${esc(d.nome||"Nome do membro")}</span> foi consagrado(a) ao santo ministério no cargo de <span class="cert-destaque">${esc(d.cargo||"cargo ministerial")}</span>, para servir ao Reino de Deus com fidelidade, zelo e dedicação.`;
  }else{
    titulo="Certificado de Batismo";texto=`Certificamos que <span class="cert-nome">${esc(d.nome||"Nome do(a) batizando(a)")}</span> foi batizado(a) nas águas, por profissão de fé em Jesus Cristo, conforme os princípios da Palavra de Deus.`;
  }
  return `<div class="cert-borda"><div class="cert-topo">${logo}<div class="cert-igreja">${esc(igreja)}</div></div><h2 class="cert-titulo">${titulo}</h2><div class="cert-subtitulo">${d.tipo==="CONSAGRACAO"?"Consagração Ministerial":"Batismo"}</div><div class="cert-texto">${texto}<p>Realizado em <span class="cert-destaque">${esc(local||"local da cerimônia")}</span>, no dia <span class="cert-destaque">${esc(data||"data da cerimônia")}</span>.</p></div><div class="cert-rodape"><div class="cert-assinatura">${assinatura}<strong>${esc(pastor)}</strong><br>Pastor responsável</div></div><div class="cert-numero">Nº ${esc(d.numero||"prévia")}</div></div>`;
}

async function recarregarHistorico(){const r=await chamarApi({acao:"listarCertificados"});ESTADO_CERTIFICADOS.historico=r.certificados||[];renderizarHistorico();}
function renderizarHistorico(){
  const corpo=$("#corpoHistorico");if(!corpo)return;const filtro=normalizar($("#filtroHistorico").value);const itens=ESTADO_CERTIFICADOS.historico.filter(i=>normalizar(`${i.numero} ${i.nome} ${i.tipo}`).includes(filtro));corpo.innerHTML="";
  if(!itens.length){corpo.innerHTML='<tr><td colspan="6" class="historico-vazio">Nenhum certificado encontrado.</td></tr>';return;}
  itens.forEach(item=>{const tr=document.createElement("tr");tr.innerHTML=`<td><strong>${esc(item.numero)}</strong></td><td>${item.tipo==="CONSAGRACAO"?"Consagração":"Batismo"}</td><td>${esc(item.nome)}</td><td>${esc(dataBr(item.dataCerimonia))}</td><td>${esc(item.emitidoPor)}</td><td><button class="botao-reimprimir" type="button">Reimprimir</button></td>`;$("button",tr).addEventListener("click",()=>reimprimir(item));corpo.appendChild(tr);});
}
function reimprimir(item){const tipo=item.tipo==="CONSAGRACAO"?"consagracao":"batismo";abrirAba(tipo);atualizarPreview(tipo,item);setTimeout(()=>window.print(),200);}
function definirMensagem(texto,tipo){const e=$("#mensagemModulo");e.hidden=false;e.textContent=texto;e.dataset.tipo=tipo;}
function normalizar(v){return String(v||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");}
function dataBr(v){if(!v)return"";const p=String(v).split("-");return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:v;}
function dataExtenso(v){if(!v)return"";const d=new Date(v+"T12:00:00");return new Intl.DateTimeFormat("pt-BR",{day:"numeric",month:"long",year:"numeric"}).format(d);}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function escAttr(v){return esc(v);}
