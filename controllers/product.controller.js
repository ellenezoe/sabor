
const db = require("../configs/database.js");

const fs = require("fs/promises");
const path = require("path");

const uploadDir = path.resolve(__dirname, "../uploads");

// Normaliza preços recebidos do formulário.
function normalizar(numero) {
    const valor = String(numero ?? "")
        .trim()
        .replace(/\s/g, "")
        .replace(",", ".");

    if (valor === "") {
        throw new Error("Informe um preço válido.");
    }

    const resultado = Number(valor);

    if (!Number.isFinite(resultado) || resultado < 0) {
        throw new Error("O preço informado é inválido.");
    }

    return resultado;
}

// Exclui um arquivo enviado em caso de falha.
async function excluirArquivoEnviado(arquivo) {
    if (!arquivo?.path) {
        return;
    }

    try {
        await fs.unlink(arquivo.path);
    } catch (error) {
        if (error.code !== "ENOENT") {
            console.error("Erro ao excluir arquivo:", error);
        }
    }
}

// Exclui uma imagem antiga pertencente à pasta uploads.
async function excluirImagemAntiga(caminhoImagem) {
    if (
        !caminhoImagem ||
        typeof caminhoImagem !== "string" ||
        !caminhoImagem.startsWith("/uploads/")
    ) {
        return;
    }

    const nomeArquivo = path.basename(caminhoImagem);

    // Evita caminhos inválidos.
    if (!nomeArquivo || nomeArquivo === "." || nomeArquivo === "..") {
        return;
    }

    const caminhoCompleto = path.join(uploadDir, nomeArquivo);

    try {
        await fs.unlink(caminhoCompleto);
    } catch (error) {
        if (error.code !== "ENOENT") {
            console.error("Erro ao excluir imagem antiga:", error);
        }
    }
}

// Monta os dados do produto.
function obterDadosProduto(body) {
    const {
        name,
        category,
        categoryLabel,
        unit,
        price,
        oldPrice,
        badge
    } = body;

    if (!name || !String(name).trim()) {
        throw new Error("O nome do produto é obrigatório.");
    }

    if (!category || !String(category).trim()) {
        throw new Error("A categoria é obrigatória.");
    }

    return {
        name: String(name).trim(),
        category: String(category).trim(),
        categoryLabel: categoryLabel || "",
        unit: unit || "",
        price: normalizar(price),
        oldPrice: normalizar(oldPrice),
        badge: badge || ""
    };
}

const ProductController = {

    // CADASTRAR PRODUTO
    async cadastrar(req, res) {
        try {
            // No cadastro, a imagem é obrigatória.
            if (!req.file) {
                return res.status(400).json({
                    error: "Selecione uma imagem para cadastrar o produto."
                });
            }

            const dadosProduto = obterDadosProduto(req.body);

            const dados = {
                ...dadosProduto,
                image: `/uploads/${req.file.filename}`
            };

            const [id] = await db("products").insert(dados);

            return res.status(201).json({
                mensagem: "Produto cadastrado com sucesso!",
                id
            });

        } catch (error) {
            await excluirArquivoEnviado(req.file);

            console.error("Erro ao cadastrar produto:", error);

            return res.status(500).json({
                mensagem: "Erro ao cadastrar produto.",
                erro: error.message
            });
        }
    },

    // LISTAR PRODUTOS
    async listar(req, res) {
        try {
            const produtos = await db("products").select("*");

            return res.status(200).json(produtos);
        } catch (error) {
            console.error("Erro ao listar produtos:", error);

            return res.status(500).json({ mensagem: "Erro ao listar produtos." });
        }
    },

    // ATUALIZAR PRODUTO
    async atualizar(req, res) {
        try {
            const id = req.params.id;

            if (!/^\d+$/.test(id)) {
                await excluirArquivoEnviado(req.file);

                return res.status(400).json({ mensagem: "ID do produto inválido." });
            }

            // Verifica se o produto existe.
            const produto = await db("products")
                .where({ id })
                .first();

            if (!produto) {
                await excluirArquivoEnviado(req.file);

                return res.status(404).json({ mensagem: "Produto não encontrado." });
            }

            // Atualiza os campos de texto e os preços.
            const dados = obterDadosProduto(req.body);

            // Se uma nova imagem foi enviada, atualiza seu caminho.
            // Caso contrário, preserva a imagem existente.
            if (req.file) {
                dados.image = `/uploads/${req.file.filename}`;
            }

            await db("products")
                .where({ id })
                .update(dados);

            // Só exclui a imagem antiga após a atualização no banco.
            if (req.file && produto.image) {
                await excluirImagemAntiga(produto.image);
            }

            return res.status(200).json({
                mensagem: "Produto atualizado com sucesso!",
                id: Number(id),
                image: dados.image || produto.image
            });

        } catch (error) {
            // Se a atualização falhar, remove a nova imagem enviada.
            await excluirArquivoEnviado(req.file);
            console.error("Erro ao atualizar produto:", error);

            return res.status(500).json({ mensagem: "Erro ao atualizar produto.", erro: error.message });
        }
    },

    // REMOVER PRODUTO
    async apagar(req, res) {
        try {
            const id = req.params.id;

            if (!/^\d+$/.test(id)) {
                return res.status(400).json({ mensagem: "ID do produto inválido." });
            }

            const produto = await db("products").where({ id }).first();

            if (!produto) {
                return res.status(404).json({ mensagem: "Produto não encontrado." });
            }

            await db("products").where({ id }).del();

            // Remove a imagem associada ao produto.
            if (produto.image) {
                await excluirImagemAntiga(produto.image);
            }

            return res.status(200).json({ mensagem: "Produto removido com sucesso!"});

        } catch (error) {
            console.error("Erro ao remover produto:", error);
            return res.status(500).json({ mensagem: "Erro ao remover produto." });
        }
    }
};

module.exports = ProductController;
