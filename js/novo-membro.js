/** Controlador: novo membro */
(function(window,document){"use strict"; let M,F,salvando=false,preview='';
function statusOculto(){const s=document.getElementById('statusFoto');if(s){s.textContent='';s.hidden=true;}}
function foto(){const i=document.getElementById('arquivoFotoMembro');if(!i)return;i.addEventListener('change',()=>{const f=i.files?.[0];if(preview)URL.revokeObjectURL(preview);if(!f)return;if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>5*1024*1024){i.value='';M.aviso(f.size>5*1024*1024?'A foto deve ter no máximo 4 MB.':'Use foto JPG, PNG ou WebP.','erro');return;}preview=URL.createObjectURL(f);M.atualizarFoto(preview);statusOculto();});}
async function salvar(e){e.preventDefault();if(salvando)return;const v=M.validar(F);if(!v.valido){M.aviso(v.mensagem,'erro');return;}salvando=true;M.carregando(true,'Cadastrando membro...');try{const d=M.coletar(F),arq=M.arquivoFoto();if(arq)d.foto=await M.upload(arq);const r=await M.auth().chamarApi({acao:'cadastrar',dados:d});if(r?.sucesso===false)throw new Error(r.mensagem||'Não foi possível cadastrar.');M.aviso(r.mensagem||'Membro cadastrado com sucesso.','sucesso');setTimeout(()=>location.href='membros.html',700);}catch(err){console.error(err);M.aviso(err.message||'Não foi possível cadastrar o membro.','erro');}finally{salvando=false;M.carregando(false);}}
function iniciar(){
  M=window.VRGMembroFormulario;
  F=document.getElementById('formNovoMembro');

  if(!M||!F)return;

  M.tempoReal(F);
  foto();

  F.addEventListener('submit',salvar);

  window.VRGMembroMascaras?.inicializar(F);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',iniciar,{once:true}):iniciar();})(window,document);
