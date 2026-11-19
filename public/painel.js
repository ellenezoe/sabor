const API_BASE = window.location.hostname === "localhost"
    ? "http://localhost:3000/api"
    : "/api";

const API = {
    listar: `${API_BASE}/produto/listar`,
    cadastrar: `${API_BASE}/produto/cadastrar`,
    atualizar: (id) => `${API_BASE}/produto/atualizar/${id}`,
    apagar: (id) => `${API_BASE}/produto/apagar/${id}`
};

const elementos = {
    tabela: document.getElementById("tabelaProdutos"),
    estadoVazio: document.getElementById("estadoVazio"),
    carregando: document.getElementById("carregando"),
    alerta: document.getElementById("alerta"),
    form: document.getElementById("formProduto"),
    tituloFormulario: document.getElementById("tituloFormulario"),
    textoBotaoSalvar: document.getElementById("textoBotaoSalvar"),
    botaoSalvar: document.getElementById("btnSalvar"),
    botaoCancelar: document.getElementById("btnCancelarEdicao"),
    previewImagem: document.getElementById("previewImagem"),
    inputImagem: document.getElementById("image"),
    textoImagem: document.getElementById("textoImagem"),
    modalRemover: document.getElementById("modalRemover"),
    textoRemover: document.getElementById("textoRemover"),
    botaoConfirmarRemocao: document.getElementById("btnConfirmarRemocao"),
    botaoCancelarRemocao: document.getElementById("btnCancelarRemocao")
};

let produtos = [];
let produtoEditando = null;
let produtoParaRemover = null;
let urlImagemTemporaria = null;

function mostrarAlerta(mensagem, tipo = "success") {
    elementos.alerta.className = `alert ${tipo}`;
    elementos.alerta.textContent = mensagem;

    setTimeout(() => {
        elementos.alerta.className = "alert";
        elementos.alerta.textContent = "";
    }, 4000);
}

function formatarPreco(valor) {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
        return "R$ 0,00";
    }

    return numero.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function normalizarNumero(valor) {
    return String(valor ?? "")
        .trim()
        .replace(/\s/g, "")
        .replace(",", ".");
}

function escaparHTML(texto) {
    return String(texto ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function liberarURLTemporaria() {
    if (urlImagemTemporaria) {
        URL.revokeObjectURL(urlImagemTemporaria);
        urlImagemTemporaria = null;
    }
}

function exibirImagem(url) {
    liberarURLTemporaria();

    elementos.previewImagem.src = url;
    elementos.previewImagem.style.display = "block";
}

function limparPreview() {
    liberarURLTemporaria();

    elementos.previewImagem.removeAttribute("src");
    elementos.previewImagem.style.display = "none";
}

function limparFormulario() {
    produtoEditando = null;

    elementos.form.reset();

    limparPreview();

    elementos.inputImagem.required = true;

    elementos.textoImagem.textContent =
        "Selecione uma imagem para o produto.";

    elementos.tituloFormulario.textContent = "Cadastrar produto";
    elementos.textoBotaoSalvar.textContent = "Cadastrar produto";

    elementos.botaoCancelar.style.display = "none";
}

function preencherFormulario(produto) {
    produtoEditando = produto.id;

    elementos.form.elements["name"].value = produto.name || "";
    elementos.form.elements["category"].value = produto.category || "";
    elementos.form.elements["categoryLabel"].value = produto.categoryLabel || "";
    elementos.form.elements["unit"].value = produto.unit || "";
    elementos.form.elements["price"].value = produto.price ?? "";
    elementos.form.elements["oldPrice"].value = produto.oldPrice ?? "";
    elementos.form.elements["badge"].value = produto.badge || "";

    // A imagem não é obrigatória durante a atualização.
    elementos.inputImagem.required = false;

    elementos.textoImagem.textContent =
        "Selecione uma nova imagem somente se desejar substituir a atual.";

    if (produto.image) {
        exibirImagem(produto.image);
    } else {
        limparPreview();
    }

    elementos.tituloFormulario.textContent =
        `Atualizar: ${produto.name}`;

    elementos.textoBotaoSalvar.textContent = "Salvar alterações";

    elementos.botaoCancelar.style.display = "inline-flex";

    window.scrollTo({
        top: elementos.form.offsetTop - 100,
        behavior: "smooth"
    });
}

function renderizarTabela() {
    elementos.tabela.innerHTML = "";

    if (!produtos.length) {
        elementos.estadoVazio.style.display = "block";
        return;
    }

    elementos.estadoVazio.style.display = "none";

    produtos.forEach((produto) => {
        const linha = document.createElement("tr");

        const imagem = produto.image
            ? escaparHTML(produto.image)
            : "https://via.placeholder.com/120x120?text=Produto";

        linha.innerHTML = `
            <td>
                <div style="display:flex; align-items:center; gap:12px;">
                    <img
                        class="product-thumb"
                        src="${imagem}"
                        alt="${escaparHTML(produto.name)}"
                        onerror="this.onerror=null;this.src='https://via.placeholder.com/120x120?text=Produto'"
                    />

                    <div>
                        <div class="product-name">
                            ${escaparHTML(produto.name)}
                        </div>

                        <div class="product-meta">
                            ID: ${escaparHTML(produto.id)}
                        </div>
                    </div>
                </div>
            </td>

            <td>
                <span class="tag">
                    ${escaparHTML(produto.categoryLabel || produto.category || "Sem categoria")}
                </span>
            </td>

            <td>${escaparHTML(produto.unit || "-")}</td>

            <td class="price-cell">
                ${formatarPreco(produto.price)}
                <span class="old-price">
                    ${formatarPreco(produto.oldPrice)}
                </span>
            </td>

            <td>
                ${produto.badge
                ? `<span class="tag tag-badge">${escaparHTML(produto.badge)}</span>`
                : "-"}
            </td>

            <td>
                <div class="table-actions">
                    <button
                        class="btn-icon"
                        type="button"
                        title="Atualizar produto"
                        data-editar="${escaparHTML(produto.id)}"
                    >
                        <i class="material-icons">edit</i>
                    </button>

                    <button
                        class="btn-icon danger"
                        type="button"
                        title="Remover produto"
                        data-remover="${escaparHTML(produto.id)}"
                    >
                        <i class="material-icons">delete</i>
                    </button>
                </div>
            </td>
        `;

        elementos.tabela.appendChild(linha);
    });
}

async function carregarProdutos() {
    elementos.carregando.style.display = "block";
    elementos.estadoVazio.style.display = "none";
    elementos.tabela.innerHTML = "";

    try {
        const resposta = await fetch(API.listar);

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.mensagem || "Não foi possível carregar os produtos."
            );
        }

        produtos = resultado;

        renderizarTabela();

    } catch (erro) {
        mostrarAlerta(erro.message, "error");

    } finally {
        elementos.carregando.style.display = "none";
    }
}

async function salvarProduto(evento) {
    evento.preventDefault();

    if (!elementos.form.reportValidity()) {
        return;
    }

    const imagem = elementos.inputImagem.files[0];

    // A imagem é obrigatória somente no cadastro.
    if (!produtoEditando && !imagem) {
        mostrarAlerta(
            "Selecione uma imagem para cadastrar o produto.",
            "error"
        );
        return;
    }

    const dados = new FormData(elementos.form);

    const preco = normalizarNumero(dados.get("price"));
    const precoAntigo = normalizarNumero(dados.get("oldPrice"));

    if (
        preco === "" ||
        precoAntigo === "" ||
        !Number.isFinite(Number(preco)) ||
        !Number.isFinite(Number(precoAntigo)) ||
        Number(preco) < 0 ||
        Number(precoAntigo) < 0
    ) {
        mostrarAlerta("Informe valores válidos para os preços.", "error");
        return;
    }

    dados.set("price", preco);
    dados.set("oldPrice", precoAntigo);

    try {
        elementos.botaoSalvar.disabled = true;

        elementos.textoBotaoSalvar.textContent = "Salvando...";

        const atualizando = produtoEditando !== null;

        const url = atualizando
            ? API.atualizar(produtoEditando)
            : API.cadastrar;

        const resposta = await fetch(url, {
            method: "POST",
            body: dados
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.error ||
                resultado.mensagem ||
                "Erro ao salvar produto."
            );
        }

        mostrarAlerta(
            atualizando
                ? "Produto atualizado com sucesso!"
                : "Produto cadastrado com sucesso!"
        );

        limparFormulario();

        await carregarProdutos();

    } catch (erro) {
        mostrarAlerta(erro.message, "error");

    } finally {
        elementos.botaoSalvar.disabled = false;

        elementos.textoBotaoSalvar.textContent =
            produtoEditando !== null
                ? "Salvar alterações"
                : "Cadastrar produto";
    }
}

function abrirModalRemocao(id) {
    const produto = produtos.find(
        (item) => String(item.id) === String(id)
    );

    if (!produto) {
        return;
    }

    produtoParaRemover = produto.id;

    elementos.textoRemover.textContent =
        `Deseja realmente remover o produto "${produto.name}"?`;

    elementos.modalRemover.classList.add("open");
}

function fecharModalRemocao() {
    produtoParaRemover = null;

    elementos.modalRemover.classList.remove("open");
}

async function removerProduto() {
    if (produtoParaRemover === null) {
        return;
    }

    try {
        elementos.botaoConfirmarRemocao.disabled = true;

        const resposta = await fetch(
            API.apagar(produtoParaRemover),
            {
                method: "POST"
            }
        );

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.mensagem || "Erro ao remover produto."
            );
        }

        mostrarAlerta("Produto removido com sucesso!");

        fecharModalRemocao();

        if (String(produtoEditando) === String(produtoParaRemover)) {
            limparFormulario();
        }

        await carregarProdutos();

    } catch (erro) {
        mostrarAlerta(erro.message, "error");

    } finally {
        elementos.botaoConfirmarRemocao.disabled = false;
    }
}

// Eventos do formulário.

elementos.form.addEventListener("submit", salvarProduto);

document.getElementById("btnNovoProduto").addEventListener("click", () => {
    limparFormulario();

    document.getElementById("name").focus();
});

document.getElementById("btnRecarregar").addEventListener(
    "click",
    carregarProdutos
);

elementos.botaoCancelar.addEventListener("click", limparFormulario);

// Pré-visualização da imagem selecionada.

elementos.inputImagem.addEventListener("change", (evento) => {
    const arquivo = evento.target.files[0];

    if (!arquivo) {
        if (produtoEditando !== null) {
            const produto = produtos.find(
                (item) => String(item.id) === String(produtoEditando)
            );

            if (produto?.image) {
                exibirImagem(produto.image);
            } else {
                limparPreview();
            }
        } else {
            limparPreview();
        }

        return;
    }

    const tiposPermitidos = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!tiposPermitidos.includes(arquivo.type)) {
        evento.target.value = "";

        mostrarAlerta(
            "Formato inválido. Utilize JPG, PNG ou WEBP.",
            "error"
        );

        return;
    }

    if (arquivo.size > 5 * 1024 * 1024) {
        evento.target.value = "";

        mostrarAlerta(
            "A imagem não pode ultrapassar 5 MB.",
            "error"
        );

        return;
    }

    const url = URL.createObjectURL(arquivo);

    urlImagemTemporaria = url;

    elementos.previewImagem.src = url;
    elementos.previewImagem.style.display = "block";
});

// Eventos da tabela.

elementos.tabela.addEventListener("click", (evento) => {
    const botaoEditar = evento.target.closest("[data-editar]");
    const botaoRemover = evento.target.closest("[data-remover]");

    if (botaoEditar) {
        const produto = produtos.find(
            (item) => String(item.id) === String(botaoEditar.dataset.editar)
        );

        if (produto) {
            preencherFormulario(produto);
        }
    }

    if (botaoRemover) {
        abrirModalRemocao(botaoRemover.dataset.remover);
    }
});

// Eventos do modal.

elementos.botaoConfirmarRemocao.addEventListener(
    "click",
    removerProduto
);

elementos.botaoCancelarRemocao.addEventListener(
    "click",
    fecharModalRemocao
);

elementos.modalRemover.addEventListener("click", (evento) => {
    if (evento.target === elementos.modalRemover) {
        fecharModalRemocao();
    }
});

// Inicialização.

carregarProdutos();
