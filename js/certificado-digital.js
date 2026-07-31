"use strict";

/* ==========================================================================CERTIFICADO DIGITAL PÚBLICOConsulta, renderização, impressão, compartilhamento e PDF.========================================================================== */

const LARGURA_CERTIFICADO = 1492;const ALTURA_CERTIFICADO = 1055;

const MODELOS_CERTIFICADO_DIGITAL = Object.freeze({BATISMO: {classe: "batismo",imagem: "assets/certificados/certificado-batismo-base.png",titulo: "Certificado de Batismo",campos: {nome: {top: 394,left: 235,width: 900,height: 86},
