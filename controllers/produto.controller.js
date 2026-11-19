const db = require("../configs/database.js");

const ProdutosController = {
      /**
       * FUNCAO PARA CADASTRO DE produtos
       * @param {*} req 
       * @param {*} res 
       */
      async cadastrar(req, res) {
            try {
                  const [id] = await db('produtos').insert(req.body);
                  res.status(201).json({ mensagem: "Produto cadastrado", id });
            } catch (error) {
                  res.status(500).json({ mensagem: "erro ao cadastrar Produto", erro: error.message });
            }
      },
      /**
       * função para listar os produtos cadastrados
       * @param {*} req 
       * @param {*} res 
       */
      async listar(req, res) {
            const produtos = await db('produtos').select('*');
            res.status(201).json({ produtos });
      },
      /**
       * FUNCAO PARA ATUALIZAR OS DADOS DO PRODUTO
       * @param {*} req 
       * @param {*} res 
       */

      async atualizar(req, res) {
            await db('produtos')
                  .where({ id_produto: req.params.id_produto })
                  .update(req.body);

            res.json({ mensagem: "Produto atualizado!" });
      },

      /**
       * FUNCAO PARA REMOVER PRODUTO
       * @param {*} req 
       * @param {*} res 
       */
      async apagar(req, res) {
            await db('produtos')
                  .where({ id_produto: req.params.id_produto })
                  .del();
            res.json({ mensagem: "Produto removido!" });
      },
};

module.exports = ProdutosController;