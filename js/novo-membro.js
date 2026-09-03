/** Controlador: novo membro */
(function (window, document) {
  "use strict";

  let M;
let F;
let salvando = false;
let preview = "";
let kidOrigem = null;
let fotoKidOrigem = "";


  function statusOculto() {
    const s = document.getElementById("statusFoto");

    if (s) {
      s.textContent = "";
      s.hidden = true;
    }
  }


  function foto() {
    const i = document.getElementById(
      "arquivoFotoMembro"
    );

    if (!i) {
      return;
    }

    i.addEventListener("change", () => {
      const f = i.files?.[0];

      if (preview) {
        URL.revokeObjectURL(preview);
      }

      if (!f) {
        return;
      }

      if (
        ![
          "image/jpeg",
          "image/png",
          "image/webp"
        ].includes(f.type) ||
        f.size > 5 * 1024 * 1024
      ) {
        i.value = "";
        
        M.aviso(
          f.size > 5 * 1024 * 1024
            ? "A foto deve ter no máximo 4 MB."
            : "Use foto JPG, PNG ou WebP.",
          "erro"
        );

        return;
      }

      preview = URL.createObjectURL(f);

      M.atualizarFoto(preview);

      statusOculto();
    });
  }


  async function salvar(e) {
    e.preventDefault();

    if (salvando) {
      return;
    }

    const v = M.validar(F);

    if (!v.valido) {
      M.aviso(
        v.mensagem,
        "erro"
      );

      return;
    }

    salvando = true;

    M.carregando(
      true,
      "Cadastrando membro..."
    );

    try {
      const d = M.coletar(F);
      const arq = M.arquivoFoto();

      if (arq) {
        d.foto = await M.upload(arq);
      }

      const r =
        await M.auth().chamarApi({
          acao: "cadastrar",
          dados: d
        });

      if (r?.sucesso === false) {
        throw new Error(
          r.mensagem ||
          "Não foi possível cadastrar."
        );
      }

      const codigoKid =
  obterOrigemKids();

const codigoMembro =
  String(
    r.codigo ||
    r.id ||
    ""
  ).trim();

if (
  codigoKid &&
  codigoMembro
) {
  const conversao =
    await M.auth().chamarApi({
      acao: "converterKidEmMembro",
      id: codigoKid,
      dados: {
        codigoMembro:
          codigoMembro
      }
    });

  if (
    conversao?.sucesso === false
  ) {
    throw new Error(
      conversao.mensagem ||
      "O membro foi cadastrado, mas não foi possível concluir o vínculo com o Ministério Kids."
    );
  }
}
      M.aviso(
        r.mensagem ||
        "Membro cadastrado com sucesso.",
        "sucesso"
      );

      setTimeout(
        () => {
          location.href =
            "membros.html";
        },
        700
      );

    } catch (err) {
      console.error(err);

      M.aviso(
        err.message ||
        "Não foi possível cadastrar o membro.",
        "erro"
      );

    } finally {
      salvando = false;

      M.carregando(false);
    }
  }

function obterOrigemKids() {
  const parametros =
    new URLSearchParams(
      window.location.search
    );

  const origem =
    String(
      parametros.get("origem") || ""
    )
      .trim()
      .toLowerCase();

  const id =
    String(
      parametros.get("id") || ""
    ).trim();

  if (
    origem !== "kids" ||
    !id
  ) {
    return null;
  }

  return id;
}


function definirCampo(
  id,
  valor
) {
  const campo =
    document.getElementById(id);

  if (
    !campo ||
    valor === undefined ||
    valor === null ||
    String(valor).trim() === ""
  ) {
    return;
  }

  campo.value =
    String(valor).trim();

  campo.dispatchEvent(
    new Event(
      "change",
      { bubbles: true }
    )
  );
}


function normalizarDataKids(valor) {
  if (!valor) {
    return "";
  }

  const texto =
    String(valor).trim();

  const iso =
    texto.match(
      /^(\d{4})-(\d{2})-(\d{2})/
    );

  if (iso) {
    return (
      iso[1] +
      "-" +
      iso[2] +
      "-" +
      iso[3]
    );
  }

  const br =
    texto.match(
      /^(\d{2})\/(\d{2})\/(\d{4})$/
    );

  if (br) {
    return (
      br[3] +
      "-" +
      br[2] +
      "-" +
      br[1]
    );
  }

  return "";
}


async function carregarKidOrigem() {
  const codigo =
    obterOrigemKids();

  if (!codigo) {
    return;
  }

  try {
    M.carregando(
      true,
      "Carregando dados da criança..."
    );

    const resposta =
      await M.auth().chamarApi({
        acao: "buscarKid",
        id: codigo
      });

    if (
      !resposta ||
      resposta.sucesso === false
    ) {
      throw new Error(
        resposta?.mensagem ||
        "Não foi possível carregar a criança."
      );
    }

    const kid =
      resposta.kid ||
      resposta.dados ||
      resposta.crianca ||
      resposta;

    if (
      !kid ||
      typeof kid !== "object"
    ) {
      throw new Error(
        "Os dados da criança não foram encontrados."
      );
    }

    kidOrigem = kid;

    definirCampo(
      "NOME_COMPLETO",
      kid.nomeCompleto
    );

    definirCampo(
      "DATA_NASCIMENTO",
      normalizarDataKids(
        kid.dataNascimento
      )
    );

    definirCampo(
      "SEXO",
      kid.sexo
    );

    definirCampo(
      "CONGREGACAO",
      kid.congregacao
    );

    definirCampo(
      "TELEFONE",
      kid.telefoneResponsavel
    );

    definirCampo(
      "WHATSAPP",
      kid.whatsappResponsavel
    );

    definirCampo(
      "CEP",
      kid.cep
    );

    definirCampo(
      "ENDERECO",
      kid.endereco
    );

    definirCampo(
      "NUMERO",
      kid.numero
    );

    definirCampo(
      "COMPLEMENTO",
      kid.complemento
    );

    definirCampo(
      "BAIRRO",
      kid.bairro
    );

    definirCampo(
      "CIDADE",
      kid.cidade
    );

    definirCampo(
      "ESTADO",
      kid.estado
    );

    definirCampo(
      "NOME_PAI",
      kid.pai
    );

    definirCampo(
      "NOME_MAE",
      kid.mae
    );

    definirCampo(
      "OBSERVACOES",
      kid.observacoes
    );

    fotoKidOrigem =
      String(
        kid.foto ||
        kid.fotoUrl ||
        kid.FOTO ||
        ""
      ).trim();

    if (fotoKidOrigem) {
      M.atualizarFoto(
        fotoKidOrigem
      );
    }

    M.aviso(
      "Dados do Ministério Kids carregados. Confira e complete a ficha antes de cadastrar.",
      "sucesso"
    );

  } catch (err) {
    console.error(
      "Erro ao carregar criança para conversão:",
      err
    );

    M.aviso(
      err.message ||
      "Não foi possível carregar os dados da criança.",
      "erro"
    );

  } finally {
    M.carregando(false);
  }
}
  
  function iniciar() {
    M =
      window.VRGMembroFormulario;

    F =
      document.getElementById(
        "formNovoMembro"
      );

    if (!M || !F) {
      return;
    }

    M.tempoReal(F);

    foto();

    F.addEventListener(
      "submit",
      salvar
    );

    window.VRGMembroMascaras
  ?.inicializar(F);

carregarKidOrigem();
  }


  document.readyState === "loading"
    ? document.addEventListener(
        "DOMContentLoaded",
        iniciar,
        { once: true }
      )
    : iniciar();

})(window, document);
