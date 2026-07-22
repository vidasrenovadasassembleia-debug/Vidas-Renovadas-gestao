/* js/certificado-impressao.js */

function criarEstruturaCertificado(tipo){
 const folha=document.createElement("div");
 folha.className="certificado-impressao";
 folha.dataset.tipo=tipo;
 folha.innerHTML=`
 <p class="certificado-campo certificado-nome" id="certNome"></p>
 <p class="certificado-campo certificado-cargo" id="certCargo"></p>
 <p class="certificado-campo certificado-local-data" id="certLocalData"></p>
 <p class="certificado-campo certificado-numero" id="certNumero"></p>
 <div class="certificado-qrcode" id="certQrCode"></div>
 <img class="certificado-assinatura" id="certAssinatura" alt="Assinatura">
 `;
 return folha;
}

function abrirImpressaoCertificado(dados){
 let area=document.querySelector(".area-certificado-impressao");
 if(!area){
   area=document.createElement("div");
   area.className="area-certificado-impressao";
   document.body.appendChild(area);
 }
 area.innerHTML="";
 const folha=criarEstruturaCertificado(dados.tipo);
 area.appendChild(folha);

 document.getElementById("certNome").textContent=dados.nome||"";
 if(dados.tipo==="consagracao"){
   document.getElementById("certCargo").textContent=dados.cargo||"";
 }else{
   document.getElementById("certCargo").style.display="none";
 }
 document.getElementById("certLocalData").textContent=`${dados.cidade}, ${dados.dataExtenso}`;
 document.getElementById("certNumero").textContent=`REGISTRO Nº ${dados.numero}`;
 if(dados.assinatura){
   document.getElementById("certAssinatura").src=dados.assinatura;
 }
 gerarQRCodeCertificado(document.getElementById("certQrCode"),dados.linkValidacao);
 document.body.classList.add("imprimindo-certificado");
 window.print();
 setTimeout(()=>document.body.classList.remove("imprimindo-certificado"),800);
}

function gerarQRCodeCertificado(el,texto){
 el.innerHTML="";
 if(typeof QRCode==="undefined"){el.textContent="QR";return;}
 new QRCode(el,{text:texto,width:150,height:150});
}
