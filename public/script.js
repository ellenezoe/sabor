const ROTA = "http://localhost:3000/api/produto/listar";

document.addEventListener('DOMContentLoaded', carregarProdutos);

/* =========================================================
   DADOS DOS PRODUTOS
   ========================================================= */
let products = [];

async function carregarProdutos() {
    try {
        const response = await fetch(ROTA);

        if (!response.ok) {
            throw new Error(`ERRO HTTP ${response.status}`);
        }

        products = await response.json();
        console.log("produtos carregados:", products);

        renderProducts();

    } catch (error) {
        console.log("erro ao carregar produtos: ", error);
        productGrid.innerHTML = `<p>Não foi possível carregar os produtos. Verifique se o servidor está rodando.</p>`;
    }
}

/* =========================================================
   ESTADO DA APLICAÇÃO
   ========================================================= */

let activeCategory = "todos";
let currentSearch = "";
let currentSort = "default";
let showingAllProducts = false;

let favorites = JSON.parse(localStorage.getItem("saborFavorites")) || [];
let cart = JSON.parse(localStorage.getItem("saborCart")) || [];


/* =========================================================
   ELEMENTOS DO DOM
   ========================================================= */

const productGrid = document.getElementById("productGrid");
const emptyState = document.getElementById("emptyState");
const productsMessage = document.getElementById("productsMessage");
const searchInput = document.getElementById("searchInput");
const searchForm = document.getElementById("searchForm");
const showAllProductsButton = document.getElementById("showAllProducts");

const cartCount = document.getElementById("cartCount");
const cartCountMobile = document.getElementById("cartCountMobile");
const cartItems = document.getElementById("cartItems");
const cartEmpty = document.getElementById("cartEmpty");
const cartSummary = document.getElementById("cartSummary");
const cartTotal = document.getElementById("cartTotal");
const cartItemsText = document.getElementById("cartItemsText");

const cepForm = document.getElementById("cepForm");
const cepInput = document.getElementById("cepInput");
const cepButtonText = document.getElementById("cepButtonText");

const newsletterForm = document.getElementById("newsletterForm");


/* =========================================================
   FUNÇÕES AUXILIARES
   ========================================================= */

function formatPrice(value) {
    return value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function saveFavorites() {
    localStorage.setItem("saborFavorites", JSON.stringify(favorites));
}

function saveCart() {
    localStorage.setItem("saborCart", JSON.stringify(cart));
}

function getProductById(id) {
    return products.find((product) => product.id === Number(id));
}

function showToast(message) {
    M.toast({
        html: message,
        displayLength: 2600,
        classes: "rounded"
    });
}


/* =========================================================
   MATERIALIZE
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    M.Sidenav.init(document.querySelectorAll(".sidenav"));

    M.Modal.init(document.querySelectorAll(".modal"), {
        opacity: 0.55
    });

    M.Dropdown.init(document.querySelectorAll(".dropdown-trigger"), {
        coverTrigger: false,
        constrainWidth: false,
        alignment: "right",
        closeOnClick: true
    });

    document.getElementById("currentYear").textContent =
        new Date().getFullYear();

    renderProducts();
    updateCart();
});


/* =========================================================
   FILTRO E RENDERIZAÇÃO DOS PRODUTOS
   ========================================================= */

function getFilteredProducts() {
    let filteredProducts = [...products];

    if (activeCategory !== "todos") {
        filteredProducts = filteredProducts.filter(
            (product) => product.category === activeCategory
        );
    }

    if (currentSearch.trim() !== "") {
        const term = currentSearch.toLowerCase().trim();

        filteredProducts = filteredProducts.filter((product) => {
            return (
                product.name.toLowerCase().includes(term) ||
                product.categoryLabel.toLowerCase().includes(term) ||
                product.category.toLowerCase().includes(term)
            );
        });
    }

    if (currentSort === "az") {
        filteredProducts.sort((a, b) =>
            a.name.localeCompare(b.name, "pt-BR")
        );
    }

    if (currentSort === "price-asc") {
        filteredProducts.sort((a, b) => a.price - b.price);
    }

    if (currentSort === "price-desc") {
        filteredProducts.sort((a, b) => b.price - a.price);
    }

    return filteredProducts;
}

function renderProducts() {
    const filteredProducts = getFilteredProducts();

    const visibleProducts = showingAllProducts
        ? filteredProducts
        : filteredProducts.slice(0, 8);

    productGrid.innerHTML = "";

    if (filteredProducts.length === 0) {
        emptyState.classList.remove("hide");
        showAllProductsButton.classList.add("hide");
        productsMessage.textContent =
            "Não encontramos itens para esta busca.";
        return;
    }

    emptyState.classList.add("hide");

    visibleProducts.forEach((product) => {
        const isFavorite = favorites.includes(product.id);

        const oldPriceHTML = product.oldPrice
            ? `<span class="price-old">${formatPrice(product.oldPrice)}</span>`
            : "";

        const badgeHTML = product.badge
            ? `<span class="product-badge">${product.badge}</span>`
            : "";

        productGrid.innerHTML += `
            <article class="product-card">
                <div class="product-image-wrapper">
                    ${badgeHTML}

                    <button
                        class="favorite ${isFavorite ? "active" : ""}"
                        type="button"
                        data-favorite="${product.id}"
                        aria-label="Adicionar ${product.name} aos favoritos"
                        title="Adicionar aos favoritos"
                    >
                        <i class="material-icons">
                            ${isFavorite ? "favorite" : "favorite_border"}
                        </i>
                    </button>

                    <img
                        class="product-image"
                        src="${product.image}"
                        alt="${product.name}"
                        loading="lazy"
                    >
                </div>

                <div class="product-info">
                    <span class="product-category">
                        ${product.categoryLabel}
                    </span>

                    <h3>${product.name}</h3>

                    <p class="product-unit">${product.unit}</p>

                    <div class="price-row">
                        <span class="price">${formatPrice(product.price)}</span>
                        ${oldPriceHTML}
                    </div>

                    <button
                        class="btn-add waves-effect"
                        type="button"
                        data-add="${product.id}"
                    >
                        <i class="material-icons left">add_shopping_cart</i>
                        Adicionar
                    </button>
                </div>
            </article>
        `;
    });

    updateProductsMessage(filteredProducts.length);

    if (filteredProducts.length > 8 && !showingAllProducts) {
        showAllProductsButton.classList.remove("hide");
        showAllProductsButton.textContent = "Ver todos os produtos";
    } else if (showingAllProducts && filteredProducts.length > 8) {
        showAllProductsButton.classList.remove("hide");
        showAllProductsButton.textContent = "Mostrar menos";
    } else {
        showAllProductsButton.classList.add("hide");
    }
}

function updateProductsMessage(quantity) {
    const categoryNames = {
        todos: "todos os produtos",
        frutas: "frutas",
        verduras: "verduras",
        legumes: "legumes",
        temperos: "temperos",
        polpas: "polpas",
        naturais: "produtos naturais",
        outros: "produtos regionais"
    };

    if (currentSearch.trim() !== "") {
        productsMessage.textContent =
            `${quantity} produto(s) encontrado(s) para “${currentSearch.trim()}”.`;
        return;
    }

    if (activeCategory !== "todos") {
        productsMessage.textContent =
            `Confira ${quantity} opção(ões) em ${categoryNames[activeCategory]}.`;
        return;
    }

    productsMessage.textContent =
        "Confira produtos frescos disponíveis para você.";
}


/* =========================================================
   CATEGORIAS
   ========================================================= */

document.querySelectorAll(".category").forEach((button) => {
    button.addEventListener("click", function () {
        activeCategory = this.dataset.category;
        currentSearch = "";
        searchInput.value = "";
        showingAllProducts = false;

        document.querySelectorAll(".category").forEach((category) => {
            category.classList.remove("active");
        });

        this.classList.add("active");

        renderProducts();

        document.getElementById("produtos").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });
});


/* =========================================================
   BUSCA
   ========================================================= */

searchForm.addEventListener("submit", function (event) {
    event.preventDefault();

    currentSearch = searchInput.value;
    activeCategory = "todos";
    showingAllProducts = true;

    document.querySelectorAll(".category").forEach((category) => {
        category.classList.remove("active");

        if (category.dataset.category === "todos") {
            category.classList.add("active");
        }
    });

    renderProducts();

    document.getElementById("produtos").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});

searchInput.addEventListener("input", function () {
    if (this.value.trim() === "") {
        currentSearch = "";
        showingAllProducts = false;
        renderProducts();
    }
});


/* =========================================================
   ORDENAÇÃO
   ========================================================= */

document.querySelectorAll("[data-sort]").forEach((button) => {
    button.addEventListener("click", function () {
        currentSort = this.dataset.sort;
        renderProducts();

        const sortLabels = {
            default: "Destaques",
            az: "Nome: A-Z",
            "price-asc": "Menor preço",
            "price-desc": "Maior preço"
        };

        showToast(`Ordenado por: <b>${sortLabels[currentSort]}</b>`);
    });
});


/* =========================================================
   MOSTRAR TODOS
   ========================================================= */

showAllProductsButton.addEventListener("click", function () {
    showingAllProducts = !showingAllProducts;
    renderProducts();

    if (!showingAllProducts) {
        document.getElementById("produtos").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
});


/* =========================================================
   FAVORITOS E ADIÇÃO AO CARRINHO
   ========================================================= */

document.addEventListener("click", function (event) {
    const favoriteButton = event.target.closest("[data-favorite]");
    const addButton = event.target.closest("[data-add]");
    const seasonButton = event.target.closest("[data-search]");

    if (favoriteButton) {
        const productId = Number(favoriteButton.dataset.favorite);

        if (favorites.includes(productId)) {
            favorites = favorites.filter((id) => id !== productId);
            showToast("Produto removido dos favoritos.");
        } else {
            favorites.push(productId);
            showToast("Produto adicionado aos favoritos.");
        }

        saveFavorites();
        renderProducts();
    }

    if (addButton) {
        const productId = Number(addButton.dataset.add);
        addToCart(productId);
    }

    if (seasonButton) {
        currentSearch = seasonButton.dataset.search;
        searchInput.value = currentSearch;
        activeCategory = "todos";
        showingAllProducts = true;

        document.querySelectorAll(".category").forEach((category) => {
            category.classList.remove("active");

            if (category.dataset.category === "todos") {
                category.classList.add("active");
            }
        });

        renderProducts();

        document.getElementById("produtos").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
});


/* =========================================================
   CARRINHO
   ========================================================= */

function addToCart(productId) {
    const item = cart.find((cartItem) => cartItem.id === productId);

    if (item) {
        item.quantity += 1;
    } else {
        cart.push({
            id: productId,
            quantity: 1
        });
    }

    saveCart();
    updateCart();

    const product = getProductById(productId);

    showToast(`<b>${product.name}</b> foi adicionado ao carrinho.`);
}

function updateCart() {
    const totalItems = cart.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    cartCount.textContent = totalItems;
    cartCountMobile.textContent = totalItems;

    renderCartItems();
}

function renderCartItems() {
    cartItems.innerHTML = "";

    if (cart.length === 0) {
        cartEmpty.classList.remove("hide");
        cartSummary.classList.add("hide");
        cartItemsText.textContent = "Seu carrinho está vazio.";
        return;
    }

    cartEmpty.classList.add("hide");
    cartSummary.classList.remove("hide");

    const totalItems = cart.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    cartItemsText.textContent =
        `${totalItems} item(ns) adicionado(s) ao seu pedido.`;

    let total = 0;

    cart.forEach((item) => {
        const product = getProductById(item.id);

        if (!product) {
            return;
        }

        const subtotal = product.price * item.quantity;
        total += subtotal;

        cartItems.innerHTML += `
            <div class="cart-item">
                <img
                    src="${product.image}"
                    alt="${product.name}"
                    class="cart-item-image"
                >

                <div>
                    <h5>${product.name}</h5>
                    <small>${product.unit}</small>
                    <div class="cart-item-price">
                        ${formatPrice(subtotal)}
                    </div>

                    <button
                        type="button"
                        class="remove-item"
                        data-remove="${product.id}"
                    >
                        Remover
                    </button>
                </div>

                <div class="cart-controls">
                    <button
                        type="button"
                        data-decrease="${product.id}"
                        aria-label="Diminuir quantidade de ${product.name}"
                    >
                        <i class="material-icons">remove</i>
                    </button>

                    <span>${item.quantity}</span>

                    <button
                        type="button"
                        data-increase="${product.id}"
                        aria-label="Aumentar quantidade de ${product.name}"
                    >
                        <i class="material-icons">add</i>
                    </button>
                </div>
            </div>
        `;
    });

    cartTotal.textContent = formatPrice(total);
}

document.addEventListener("click", function (event) {
    const increaseButton = event.target.closest("[data-increase]");
    const decreaseButton = event.target.closest("[data-decrease]");
    const removeButton = event.target.closest("[data-remove]");

    if (increaseButton) {
        const productId = Number(increaseButton.dataset.increase);
        const item = cart.find((cartItem) => cartItem.id === productId);

        if (item) {
            item.quantity += 1;
            saveCart();
            updateCart();
        }
    }

    if (decreaseButton) {
        const productId = Number(decreaseButton.dataset.decrease);
        const item = cart.find((cartItem) => cartItem.id === productId);

        if (item && item.quantity > 1) {
            item.quantity -= 1;
        } else {
            cart = cart.filter((cartItem) => cartItem.id !== productId);
        }

        saveCart();
        updateCart();
    }

    if (removeButton) {
        const productId = Number(removeButton.dataset.remove);

        cart = cart.filter((cartItem) => cartItem.id !== productId);

        saveCart();
        updateCart();

        showToast("Produto removido do carrinho.");
    }
});


/* =========================================================
   FINALIZAR PEDIDO
   ========================================================= */

document
    .getElementById("checkoutButton")
    .addEventListener("click", function () {
        if (cart.length === 0) {
            showToast("Seu carrinho ainda está vazio.");
            return;
        }

        showToast(
            "Pedido iniciado! Em uma loja real, você seguiria para o pagamento."
        );
    });


/* =========================================================
   CEP
   ========================================================= */

cepInput.addEventListener("input", function () {
    let value = this.value.replace(/\D/g, "");

    if (value.length > 5) {
        value = `${value.slice(0, 5)}-${value.slice(5, 8)}`;
    }

    this.value = value;
});

cepForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const cep = cepInput.value.replace(/\D/g, "");

    if (cep.length !== 8) {
        showToast("Digite um CEP válido com 8 números.");
        return;
    }

    cepButtonText.textContent = `CEP: ${cepInput.value}`;

    const modalElement = document.getElementById("cepModal");
    const modalInstance = M.Modal.getInstance(modalElement);

    modalInstance.close();

    showToast("Entrega consultada para a sua região.");
});


/* =========================================================
   NEWSLETTER
   ========================================================= */

newsletterForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const email = document.getElementById("newsletterEmail").value.trim();

    if (email === "") {
        return;
    }

    showToast("Cadastro realizado! Você receberá nossas novidades.");
    newsletterForm.reset();
});