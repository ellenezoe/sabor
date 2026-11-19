const formCadastro = document.getElementById("formCadastro");

formCadastro.addEventListener("submit", async (event) => {
    event.preventDefault();

const dados = new FormData(formCadastro);

  try {
        const response = await fetch("http://localhost:3000/api/vendedor/cadastrar", {
            method: "POST",
            body: dados
        });

        const resultado = await response.json();

        if (!response.ok) {
            throw new Error(resultado.mensagem);
        }

        //mostra um alerta com uma mensagem
        alert(resultado.mensagem);

        //zera todos os campos do formulario html
        formProduto.reset();
    } catch (error) {
        console.log(error);
    }
});