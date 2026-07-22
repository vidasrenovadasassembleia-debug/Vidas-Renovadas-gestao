/* =========================================================
   CERTIFICADO DE IMPRESSÃO — VIDAS RENOVADAS GESTÃO
   Arquivo: css/certificado-impressao.css
   Formato: A4 horizontal
   ========================================================= */

.certificado-impressao,
.certificado-impressao * {
  box-sizing: border-box;
}

.area-certificado-impressao {
  display: flex;
  justify-content: center;
  width: 100%;
  padding: 24px;
  overflow: auto;
  background: #eef1f5;
}

.certificado-impressao {
  width: 297mm;
  height: 210mm;
  flex: 0 0 auto;
  padding: 9mm;
  overflow: hidden;
  background: #fffdf8;
  color: #102f4a;
  font-family: Georgia, "Times New Roman", serif;
  box-shadow: 0 8px 28px rgba(15, 23, 42, .18);
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}

.certificado-moldura {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 12mm 15mm 10mm;
  overflow: hidden;
  border: 1.2mm solid #0b3556;
  outline: .45mm solid #c39749;
  outline-offset: -3.2mm;
  background:
    radial-gradient(circle at center, rgba(195, 151, 73, .07), transparent 48%),
    linear-gradient(135deg, #fffdf8, #ffffff 46%, #fffaf0);
}

.certificado-faixa {
  position: absolute;
  left: -14mm;
  width: 92mm;
  height: 22mm;
  background: #0b3556;
  transform: rotate(-17deg);
  border-bottom: 1.2mm solid #c39749;
}

.certificado-faixa-superior {
  top: -8mm;
}

.certificado-faixa-inferior {
  right: -20mm;
  bottom: -8mm;
  left: auto;
  transform: rotate(-17deg);
}

.certificado-cabecalho {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: 34mm 1fr 34mm;
  align-items: center;
  min-height: 43mm;
  text-align: center;
}

.certificado-logo {
  grid-column: 1;
  width: 30mm;
  max-height: 30mm;
  object-fit: contain;
}

.certificado-cabecalho > div {
  grid-column: 2;
}

.certificado-igreja {
  margin: 0 0 2mm;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 3.4mm;
  font-weight: 800;
  letter-spacing: .2mm;
  text-transform: uppercase;
}

.certificado-cabecalho h1 {
  margin: 0;
  font-size: 10mm;
  font-weight: 700;
  letter-spacing: .35mm;
  text-transform: uppercase;
}

.certificado-ornamento {
  margin-top: 2mm;
  color: #c39749;
  font-size: 3.2mm;
  letter-spacing: .6mm;
}

.certificado-conteudo {
  position: relative;
  z-index: 2;
  max-width: 235mm;
  margin: 11mm auto 0;
  text-align: center;
}

.certificado-texto-principal {
  margin: 0;
  font-size: 5mm;
  line-height: 1.75;
}

.certificado-nome {
  display: block;
  width: 88%;
  margin: 4mm auto 2mm;
  padding-bottom: 1.5mm;
  border-bottom: .45mm solid #c39749;
  color: #0b3556;
  font-size: 8mm;
  line-height: 1.15;
  text-transform: uppercase;
}

.certificado-cargo {
  color: #0b3556;
  font-weight: 700;
}

.certificado-versiculo {
  margin: 9mm 0 0;
  color: #3e4e59;
  font-size: 4mm;
  font-style: italic;
  line-height: 1.55;
}

.certificado-versiculo strong {
  font-style: normal;
}

.certificado-rodape {
  position: absolute;
  right: 15mm;
  bottom: 12mm;
  left: 15mm;
  z-index: 2;
  display: grid;
  grid-template-columns: 1fr 94mm 1fr;
  align-items: end;
  gap: 8mm;
}

.certificado-local-data {
  align-self: end;
  padding-bottom: 3mm;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 3.4mm;
  text-align: left;
}

.certificado-assinatura-bloco {
  text-align: center;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 3.1mm;
}

.certificado-assinatura {
  display: block;
  width: 78mm;
  height: 22mm;
  margin: 0 auto -2mm;
  object-fit: contain;
}

.certificado-linha-assinatura {
  width: 82mm;
  margin: 0 auto 1.5mm;
  border-top: .35mm solid #324b5c;
}

.certificado-assinatura-bloco strong,
.certificado-assinatura-bloco span {
  display: block;
}

.certificado-validacao {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 3mm;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 2.8mm;
  text-align: right;
}

.certificado-qrcode {
  width: 22mm;
  height: 22mm;
  padding: 1mm;
  background: #fff;
}

.certificado-qrcode img,
.certificado-qrcode canvas {
  display: block;
  width: 100% !important;
  height: 100% !important;
}

.certificado-numero {
  position: absolute;
  right: 15mm;
  bottom: 4.5mm;
  z-index: 2;
  color: #586874;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 2.8mm;
  font-weight: 700;
  text-transform: uppercase;
}

@page {
  size: A4 landscape;
  margin: 0;
}

@media print {
  html,
  body {
    width: 297mm !important;
    height: 210mm !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    background: #fff !important;
  }

  body.imprimindo-certificado > * {
    display: none !important;
  }

  body.imprimindo-certificado > .area-certificado-impressao {
    display: block !important;
  }

  body.imprimindo-certificado .area-certificado-impressao {
    position: fixed !important;
    inset: 0 !important;
    width: 297mm !important;
    height: 210mm !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    background: #fff !important;
  }

  body.imprimindo-certificado .certificado-impressao {
    width: 297mm !important;
    height: 210mm !important;
    margin: 0 !important;
    padding: 9mm !important;
    border: 0 !important;
    box-shadow: none !important;
  }
}
