/* ==========================================
   CERTIFICADOS - VIDAS RENOVADAS GESTÃO
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {

    // Alternância das abas
    const abas = document.querySelectorAll(".aba-certificado");
    const paineis = document.querySelectorAll(".painel-certificado");

    abas.forEach((aba) => {
        aba.addEventListener("click", () => {

            abas.forEach(a => a.classList.remove("active"));
            paineis.forEach(p => p.classList.remove("active"));

            aba.classList.add("active");

            const destino = aba.dataset.aba;

            document
                .querySelector(`[data-painel="${destino}"]`)
                ?.classList.add("active");
        });
    });

    // Visualização Consagração
    document
        .querySelector('[data-visualizar="consagracao"]')
        ?.addEventListener("click", () => {
            document.getElementById("previewConsagracao").innerHTML =
                "<h2>Pré-visualização do Certificado de Consagração</h2>";
        });

    // Visualização Batismo
    document
        .querySelector('[data-visualizar="batismo"]')
        ?.addEventListener("click", () => {
            document.getElementById("previewBatismo").innerHTML =
                "<h2>Pré-visualização do Certificado de Batismo</h2>";
        });

    // Formulário Consagração
    document
        .getElementById("formConsagracao")
        ?.addEventListener("submit", (e) => {
            e.preventDefault();
            alert("Certificado de Consagração pronto para registrar.");
        });

    // Formulário Batismo
    document
        .getElementById("formBatismo")
        ?.addEventListener("submit", (e) => {
            e.preventDefault();
            alert("Certificado de Batismo pronto para registrar.");
        });

});
