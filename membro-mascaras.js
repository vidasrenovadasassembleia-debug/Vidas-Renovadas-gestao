function somenteNumeros(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function mascaraCpf(valor) {
  const numeros = somenteNumeros(valor).slice(0, 11);

  return numeros
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function mascaraCep(valor) {
  const numeros = somenteNumeros(valor).slice(0, 8);

  return numeros.replace(/^(\d{5})(\d)/, "$1-$2");
}

function mascaraTelefone(valor) {
  const numeros = somenteNumeros(valor).slice(0, 11);

  if (numeros.length <= 10) {
    return numeros
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return numeros
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function aplicarMascara(campo, formatador) {
  if (!campo) {
    return;
  }

  const atualizar = () => {
    campo.value = formatador(campo.value);
  };

  campo.addEventListener("input", atualizar);
  campo.addEventListener("blur", atualizar);

  atualizar();
}

function preencherCampoSeExiste(formulario, nome, valor) {
  const campo = formulario.elements.namedItem(nome);

  if (campo) {
    campo.value = valor || "";
    campo.dispatchEvent(
      new Event("input", { bubbles: true })
    );
  }
}

async function buscarCep(formulario, cepInformado) {
  const status = document.getElementById("statusCep");
  const cep = somenteNumeros(cepInformado);

  if (cep.length !== 8) {
    if (status) {
      status.textContent =
        "Digite um CEP válido com 8 números.";
    }

    return;
  }

  if (status) {
    status.textContent = "Buscando endereço...";
  }

  try {
    const resposta = await fetch(
      `https://viacep.com.br/ws/${cep}/json/`
    );

    if (!resposta.ok) {
      throw new Error("Não foi possível consultar o CEP.");
    }

    const dados = await resposta.json();

    if (dados.erro) {
      throw new Error("CEP não encontrado.");
    }

    preencherCampoSeExiste(
      formulario,
      "ENDERECO",
      dados.logradouro
    );

    preencherCampoSeExiste(
      formulario,
      "BAIRRO",
      dados.bairro
    );

    preencherCampoSeExiste(
      formulario,
      "CIDADE",
      dados.localidade
    );

    preencherCampoSeExiste(
      formulario,
      "ESTADO",
      dados.uf
    );

    if (status) {
      status.textContent =
        "Endereço preenchido automaticamente.";
    }

    formulario.elements.namedItem("NUMERO")?.focus();
  } catch (erro) {
    if (status) {
      status.textContent =
        erro?.message ||
        "Não foi possível buscar o endereço.";
    }
  }
}

function configurarCep(formulario) {
  const campoCep = formulario.elements.namedItem("CEP");

  if (!campoCep) {
    return;
  }

  let ultimoCepConsultado = "";

  const consultar = () => {
    const cep = somenteNumeros(campoCep.value);

    if (cep.length !== 8 || cep === ultimoCepConsultado) {
      return;
    }

    ultimoCepConsultado = cep;
    buscarCep(formulario, cep);
  };

  campoCep.addEventListener("blur", consultar);

  campoCep.addEventListener("input", () => {
    const cep = somenteNumeros(campoCep.value);

    if (cep.length === 8) {
      consultar();
    }
  });
}

function configurarMascaras(alvo) {
  const f = formulario(alvo);

  if (!f) {
    return;
  }

  aplicarMascara(
    f.elements.namedItem("CPF"),
    mascaraCpf
  );

  aplicarMascara(
    f.elements.namedItem("CEP"),
    mascaraCep
  );

  aplicarMascara(
    f.elements.namedItem("TELEFONE"),
    mascaraTelefone
  );

  aplicarMascara(
    f.elements.namedItem("WHATSAPP"),
    mascaraTelefone
  );

  configurarCep(f);
}

function inicializar(alvo) {
  const f = formulario(alvo);

  if (!f) {
    return;
  }

  configurarMascaras(f);
  tempoReal(f);
}
