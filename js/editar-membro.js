/** Controlador: editar membro — usa a mesma ficha do cadastro */
(function(window,document){"use strict";let M,F,id='',salvando=false,preview='',inicial='';
const serial=()=>JSON.stringify(M.coletar(F));
function links(){const url='visualizar-membro.html?id='+encodeURIComponent(id);document.querySelectorAll('[id^="botaoCancelarEdicao"]').forEach(a=>a.href=url);}
function foto(){const i=document.getElementById('arquivoFotoMembro'),s=document.getElementById('statusFoto');if(!i)return;i.addEventListener('change',()=>{const f=i.files?.[0];if(preview)URL.revokeObjectURL(preview);if(!f)return;if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>5*1024*1024){i.value='';M.aviso(f.size>5*1024*1024?'A foto deve ter no máximo 5 MB.':'Use foto JPG, PNG ou WebP.','erro');return;}preview=URL.createObjectURL(f);M.atualizarFoto(preview);if(s){s.textContent='';s.hidden=true;}});}
async function carregar(){
  M.carregando(true,'Carregando membro...');

  try{
    const d=await M.buscar(id);

    M.preencher(F,d);
    F.elements.ID.value=id;
    M.somenteLeitura(F,false);
    M.tempoReal(F);

    window.VRGMembroMascaras.inicializar(F);

    inicial=serial();

    M.aviso(
      'Cadastro carregado. Faça as alterações necessárias.',
      'informacao'
    );
  }catch(e){
    M.somenteLeitura(F,true);
    M.aviso(
      e.message||'Não foi possível carregar o membro.',
      'erro'
    );
  }finally{
    M.carregando(false);
  }
}
async function salvar(e){e.preventDefault();if(salvando)return;const v=M.validar(F);if(!v.valido){M.aviso(v.mensagem,'erro');return;}salvando=true;M.carregando(true,'Salvando alterações...');try{const d=M.coletar(F);d.id=id;const arq=M.arquivoFoto();if(arq)d.foto=await M.upload(arq);const r=await M.auth().chamarApi({acao:'atualizar',id,dados:d});if(r?.sucesso===false)throw new Error(r.mensagem||'Não foi possível atualizar.');inicial=serial();M.aviso(r.mensagem||'Cadastro atualizado com sucesso.','sucesso');setTimeout(()=>location.href='visualizar-membro.html?id='+encodeURIComponent(id),700);}catch(err){console.error(err);M.aviso(err.message||'Não foi possível salvar.','erro');}finally{salvando=false;M.carregando(false);}}
function iniciar(){M=window.VRGMembroFormulario;F=document.getElementById('formEditarMembro');id=M?.idUrl();if(!M||!F||!id){M?.aviso('Não foi informado qual membro deve ser editado.','erro');return;}links();M.somenteLeitura(F,true);foto();F.addEventListener('submit',salvar);carregar();}
window.addEventListener('beforeunload',e=>{if(preview)URL.revokeObjectURL(preview);if(F&&inicial&&serial()!==inicial){e.preventDefault();e.returnValue='';}});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',iniciar,{once:true}):iniciar();})(window,document);
