const { json } = require("express");
const db = require("../configs/database.js");

const CooperativaVendedorController = {
      /**
       * FUNCAO PARA CADASTRO DE COOPERATIVAS_vendedor
       * @param {*} req 
       * @param {*} res 
       */
      async adicionar(req, res) {
            try {
                  const [id] = await db('cooperativas_vendedores').insert(req.body);
                  res.status(201).json({ mensagem: "Vendedor Adicionado", id });
            } catch (error) {
                  res.status(500).json
                        ({
                              mensagem: "erro ao adicionar Vendedor á cooperativa",
                              erro: error.message
                        });
            }
      },
      /**
       * função para listar as cooperativas cadastradas
       * @param {*} req 
       * @param {*} res 
       */
      async listar(req, res) {
            try {
                  const result = await db('cooperativas_vendedores')
                        .join('cooperativas', 'cooperativas.id_cooperativa', '=', 'cooperativas_vendedores.id_cooperativa')
                        .join('vendedores', 'vendedores.id_vendedor', '=', 'cooperativas_vendedores.id_vendedor')
                        .select('*');

                  res.status(201).json(result);
            } catch (error) {
                  res.status(500).json({
                        erro: 'erro ao buscar dados',
                        mensagem: error.message
                  });
            }
      },

      /**
       * FUNCAO PARA REMOVER COOPERATIVA 
       * @param {*} req 
       * @param {*} res 
       */
      async remover(req, res) {
            await db('cooperativas_vendedores')
                  .where({ id_cooperativa_vendedor: req.params.id_cooperativa_vendedor })
                  .del();
            res.json({ mensagem: `vendedor removido da cooperativa!` });
      },
};

module.exports = CooperativaVendedorController;