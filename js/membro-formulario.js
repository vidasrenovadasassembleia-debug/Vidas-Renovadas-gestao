/** VIDAS RENOVADAS GESTÃO 2.0 — ficha única de membros */
(function (window, document) {
  "use strict";

  const CAMPOS = Object.freeze({
    ID: "id", FOTO_URL: "foto", NOME_COMPLETO: "nomeCompleto",
    DATA_NASCIMENTO: "dataNascimento", SEXO: "sexo", ESTADO_CIVIL: "estadoCivil",
    PROFISSAO: "profissao", NATURALIDADE: "naturalidade", NACIONALIDADE: "nacionalidade",
    CPF: "cpf", RG: "rg", ORGAO_EMISSOR: "orgaoEmissor", DATA_EMISSAO_RG: "dataEmissaoRg",
    TELEFONE: "telefone", WHATSAPP: "whatsapp", EMAIL: "email", CEP: "cep",
    NUMERO: "numero", ENDERECO: "endereco", COMPLEMENTO: "complemento", BAIRRO: "bairro",
    CIDADE: "cidade", ESTADO: "estado", DATA_CONVERSAO: "dataConversao",
    DATA_BATISMO_AGUAS: "dataBatismo", CARGO: "cargo", CONGREGACAO: "congregacao",
    SITUACAO: "situacao", DATA_ADMISSAO: "dataAdmissao", IGREJA_ORIGEM: "igrejaOrigem",
    DATA_CONSAGRACAO: "dataConsagracao", NOME_PAI: "pai", NOME_MAE: "mae",
    CONJUGE: "conjuge", DATA_CASAMENTO: "dataCasamento", OBSERVACOES: "observacoes"
  });
  const DATAS = new Set(["DATA_NASCIMENTO","DATA_EMISSAO_RG","DATA_CONVERSAO","DATA_BATISMO_AGUAS","DATA_ADMISSAO","DATA_CONSAGRACAO","DATA_CASAMENTO"]);
  const texto = (v) => String(v ?? "").trim();
  function auth(){ const a=window.VRGAuth||window.Auth; if(!a?.chamarApi) throw new Error("Autenticação/API indisponível."); return a; }
  function formulario(alvo){ if(alvo instanceof HTMLFormElement)return alvo; if(typeof alvo==="string")return document.querySelector(alvo); return document.querySelector("form[id^='form'][id$='Membro']"); }
  function dataCampo(v){ const s=texto(v); if(!s)return ""; if(/^\d{4}-\d{2}-\d{2}/.test(s))return s.slice(0,10); if(/^\d{2}\/\d{2}\/\d{4}$/.test(s)){const[d,m,a]=s.split('/');return `${a}-${m}-${d}`;} const d=new Date(v); return Number.isNaN(d.getTime())?"":`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
  function normalizarMembro(orig={}){ const r={...orig}; for(const [html,api] of Object.entries(CAMPOS)){ let v=orig[api]; if(v===undefined)v=orig[html]; if(html==="FOTO_URL"&&v===undefined)v=orig.fotoUrl||orig.urlFoto; if(html==="NOME_PAI"&&v===undefined)v=orig.nomePai; if(html==="NOME_MAE"&&v===undefined)v=orig.nomeMae; r[html]=DATAS.has(html)?dataCampo(v):v??""; } return r; }
  function garantirOpcao(campo,valor){ if(campo instanceof HTMLSelectElement&&texto(valor)&&![...campo.options].some(o=>String(o.value)===String(valor)))campo.add(new Option(String(valor),String(valor))); }
  function preencher(alvo,dados){ const f=formulario(alvo); if(!f)throw new Error("Formulário do membro não encontrado."); const n=normalizarMembro(dados); for(const html of Object.keys(CAMPOS)){ const c=f.elements.namedItem(html); if(!c)continue; const v=n[html]??""; garantirOpcao(c,v); if(c.type==="checkbox")c.checked=Boolean(v); else c.value=v; } atualizarFoto(n.FOTO_URL); atualizarResumo(n); return n; }
  function coletar(alvo){ const f=formulario(alvo); if(!f)throw new Error("Formulário do membro não encontrado."); const dados={}; for(const [html,api] of Object.entries(CAMPOS)){ const c=f.elements.namedItem(html); if(!c||c.disabled&&html!=="ID")continue; let v=c.type==="checkbox"?c.checked:texto(c.value); if(DATAS.has(html))v=dataCampo(v); dados[api]=v; } return dados; }
  function validar(alvo){ const f=formulario(alvo); if(!f)return {valido:false,mensagem:"Formulário não encontrado."}; const nome=texto(f.elements.namedItem('NOME_COMPLETO')?.value); if(!nome){f.elements.namedItem('NOME_COMPLETO')?.focus();return {valido:false,mensagem:'Informe o nome completo do membro.'};} if(!f.checkValidity()){f.reportValidity();return {valido:false,mensagem:'Revise os campos obrigatórios.'};} return {valido:true,mensagem:''}; }
  function atualizarFoto(url){ const img=document.getElementById('fotoMembro'), ph=document.getElementById('fotoMembroPlaceholder'), hidden=document.getElementById('FOTO_URL'); const u=texto(url); if(hidden&&u&&!u.startsWith('blob:'))hidden.value=u; if(!img||!ph)return; if(!u){img.hidden=true;img.removeAttribute('src');ph.hidden=false;return;} img.onload=()=>{img.hidden=false;ph.hidden=true;}; img.onerror=()=>{img.hidden=true;ph.hidden=false;}; img.src=u; }
  function atualizarResumo(d={}){ const n=normalizarMembro(d); const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=texto(v)||'—';}; set('resumoCodigo',n.ID||'Será gerado'); set('resumoSituacao',n.SITUACAO||'ATIVO'); const espelhos=document.querySelectorAll('[data-espelho-campo]'); espelhos.forEach(e=>{const origem=document.getElementById(e.dataset.espelhoCampo); if(origem&&e!==origem&&!e.matches(':focus'))e.value=origem.value;}); }
  function espelhos(alvo){ const f=formulario(alvo); if(!f)return; document.querySelectorAll('[data-espelho-campo]').forEach(e=>{const o=f.elements.namedItem(e.dataset.espelhoCampo); if(!o)return; const copiar=()=>{e.value=o.value;}; const voltar=()=>{o.value=e.value;o.dispatchEvent(new Event('input',{bubbles:true}));}; o.addEventListener('input',copiar);o.addEventListener('change',copiar);e.addEventListener('input',voltar);e.addEventListener('change',voltar);copiar();}); }
  function tempoReal(alvo){ const f=formulario(alvo); if(!f)return; const u=()=>atualizarResumo(coletar(f)); f.addEventListener('input',u);f.addEventListener('change',u);espelhos(f);u(); }
  function somenteLeitura(alvo,sim=true){ const f=formulario(alvo); if(!f)return; f.querySelectorAll('input,select,textarea,button[type="submit"]').forEach(c=>{if(c.type==='hidden')return; c.disabled=Boolean(sim);}); document.querySelectorAll('.edicao-foto-acoes').forEach(e=>e.hidden=Boolean(sim)); }
  function aviso(msg,tipo='informacao'){ const e=document.getElementById('avisoFicha'); if(!e)return; e.textContent=msg||''; e.className='ficha-aviso ativo '+tipo; }
  function carregando(sim,msg='Carregando...'){ const e=document.getElementById('carregamentoGlobal'); if(e)e.setAttribute('aria-hidden',sim?'false':'true'); if(e)e.classList.toggle('ativo',Boolean(sim)); if(sim){const s=e?.querySelector('span:last-child');if(s)s.textContent=msg;} }
  function arquivoFoto(){ return document.getElementById('arquivoFotoMembro')?.files?.[0]||null; }
  async function upload(file){ if(!file)return ''; const base64=await new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(String(r.result).split(',')[1]||'');r.onerror=()=>no(new Error('Não foi possível ler a foto.'));r.readAsDataURL(file);}); const res=await auth().chamarApi({acao:'uploadFoto',foto:{nome:file.name,tipo:file.type,base64}}); if(res?.sucesso===false)throw new Error(res.mensagem||'Falha no upload da foto.'); return texto(res?.foto?.url||res?.url); }
  async function buscar(id){ const res=await auth().chamarApi({acao:'buscar',id:texto(id)}); if(res?.sucesso===false)throw new Error(res.mensagem||'Membro não encontrado.'); return res?.membro||res?.dados||res; }
  function idUrl(){return texto(new URLSearchParams(location.search).get('id'));}
  window.VRGMembroFormulario=Object.freeze({CAMPOS,auth,formulario,normalizarMembro,preencher,coletar,validar,atualizarFoto,atualizarResumo,tempoReal,somenteLeitura,aviso,carregando,arquivoFoto,upload,buscar,idUrl,texto});
})(window,document);
