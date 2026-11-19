const express = require("express");
const router = express.Router();

const CooperativaVendedorController = require("../controllers/cooperativa_vendedor.controller.js");

//rotas para uso do controlador de cooperativas
router.post("/cv/adicionar",  CooperativaVendedorController.adicionar);
router.get("/cv/listar",  CooperativaVendedorController.listar);
router.post("/cv/remover/:id_cooperativa_vendedor",  CooperativaVendedorController.remover);

module.exports = router;
