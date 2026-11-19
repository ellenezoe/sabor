const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const ProdutoController = require("../controllers/product.controller.js");

// Diretório de armazenamento das imagens.
const uploadDir = path.resolve(__dirname, "../uploads");

// Cria a pasta caso ela ainda não exista.
fs.mkdirSync(uploadDir, { recursive: true });

// Configuração do armazenamento.
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const extensoesPermitidas = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp"
        };

        const extensao = extensoesPermitidas[file.mimetype];
        const nomeUnico = `${Date.now()}_${require("crypto").randomUUID()}`;

        cb(null, nomeUnico + extensao);
    }
});

// Configuração do upload.
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    },

    fileFilter: (req, file, cb) => {
        const tiposPermitidos = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!tiposPermitidos.includes(file.mimetype)) {
            return cb(new Error("Formato inválido. Envie JPG, PNG ou WEBP."));
        }

        cb(null, true);
    }
});

// Rotas de produtos.
router.post("/produto/cadastrar", upload.single("image"), ProdutoController.cadastrar);
router.get("/produto/listar", ProdutoController.listar);
router.post("/produto/atualizar/:id", upload.single("image"), ProdutoController.atualizar);
router.post("/produto/apagar/:id", ProdutoController.apagar);

// Tratamento de erros do Multer.
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ error: "A imagem ultrapassa o limite de 5 MB."});
        }

        return res.status(400).json({ error: "Erro durante o envio da imagem.", detalhe: error.message });
    }

    if (error) {
        return res.status(400).json({ error: error.message || "Erro ao processar o arquivo." });
    }

    next();
});

module.exports = router;