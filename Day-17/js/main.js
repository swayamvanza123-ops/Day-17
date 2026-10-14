
import { initialProducts } from "./products.js";

import {
    loadProducts,
    saveProducts
} from "./storage.js";

import {
    validateImage,
    validateProduct
} from "./validation.js";

/* =========================================
   DOM ELEMENTS
========================================= */

const productForm = document.getElementById("productForm");
const productName = document.getElementById("productName");
const productCategory = document.getElementById("productCategory");
const productPrice = document.getElementById("productPrice");
const productStock = document.getElementById("productStock");
const productDescription = document.getElementById("productDescription");

const productImage = document.getElementById("productImage");
const imagePreview = document.getElementById("imagePreview");
const imagePlaceholder = document.getElementById("imagePlaceholder");
const changeImageButton = document.getElementById("changeImage");
const removeImageButton = document.getElementById("removeImage");

const formMessage = document.getElementById("formMessage");
const formHeading = document.getElementById("formHeading");
const submitButton = document.getElementById("submitButton");
const cancelEditButton = document.getElementById("cancelEdit");
const editProductId = document.getElementById("editProductId");

const productTableBody = document.getElementById("productTableBody");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const stockFilter = document.getElementById("stockFilter");

const totalProductsElement = document.getElementById("totalProducts");
const totalStockElement = document.getElementById("totalStock");
const lowStockElement = document.getElementById("lowStock");
const inventoryValueElement = document.getElementById("inventoryValue");

const resultCount = document.getElementById("resultCount");
const pageInfo = document.getElementById("pageInfo");
const prevPageButton = document.getElementById("prevPage");
const nextPageButton = document.getElementById("nextPage");

const PAGE_SIZE = 5;

/* =========================================
   APPLICATION STATE
========================================= */

let products = [];
let currentPage = 1;
let selectedImageData = "";
let editingImage = false;
let imageWasRemoved = false;

/* =========================================
   INITIALIZE APPLICATION
========================================= */

function initializeApp() {
    try {
        const savedProducts = loadProducts();

        if (savedProducts === null) {
            products = initialProducts.map(product => ({ ...product }));

            saveProducts(products);
        } else {
            products = savedProducts;
        }

        renderDashboard();
        renderProducts();
    } catch (error) {
        showMessage(error.message, "error");
        productForm.querySelectorAll("input, select, textarea, button")
            .forEach(element => {
                element.disabled = true;
            });
    }
}

/* =========================================
   FORM MESSAGES
========================================= */

function showMessage(message, type = "error") {
    formMessage.textContent = message;
    formMessage.className = message ? `message ${type}` : "message";
}

function clearMessage() {
    showMessage("");
}

/* =========================================
   IMAGE PREVIEW
========================================= */

function displayImage(imageData) {
    if (!imageData) {
        imagePreview.removeAttribute("src");
        imagePreview.hidden = true;
        imagePlaceholder.hidden = false;

        changeImageButton.disabled = true;
        removeImageButton.disabled = true;

        return;
    }

    imagePreview.src = imageData;
    imagePreview.hidden = false;
    imagePlaceholder.hidden = true;

    changeImageButton.disabled = false;
    removeImageButton.disabled = false;
}

productImage.addEventListener("change", function () {
    const file = productImage.files[0];

    clearMessage();

    // The user cancelled the file picker.
    if (!file) {
        return;
    }

    // Validate before previewing or reading the file.
    const validation = validateImage(file);

    if (!validation.valid) {
        productImage.value = "";
        showMessage(validation.message, "error");
        return;
    }

    const reader = new FileReader();

    reader.onload = function () {
        if (typeof reader.result !== "string") {
            productImage.value = "";
            showMessage("Unable to read the selected image.", "error");
            return;
        }

        selectedImageData = reader.result;
        editingImage = true;
        imageWasRemoved = false;

        displayImage(selectedImageData);
        showMessage("Image selected successfully.", "success");
    };

    reader.onerror = function () {
        productImage.value = "";
        showMessage("Unable to read the selected image.", "error");
    };

    reader.readAsDataURL(file);
});

/* =========================================
   CHANGE IMAGE
========================================= */

changeImageButton.addEventListener("click", function () {
    productImage.click();
});

/* =========================================
   REMOVE IMAGE
========================================= */

removeImageButton.addEventListener("click", function () {
    selectedImageData = "";
    productImage.value = "";
    imageWasRemoved = true;
    editingImage = true;

    displayImage("");

    showMessage(
        "Image removed. Save the product to confirm the change.",
        "success"
    );
});

/* =========================================
   DASHBOARD STATISTICS
========================================= */

function formatCurrency(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(value);
}

function renderDashboard() {
    const totalStock = products.reduce(
        (total, product) => total + Number(product.stock || 0),
        0
    );

    const lowStock = products.filter(
        product => Number(product.stock) < 10
    ).length;

    const inventoryValue = products.reduce(
        (total, product) =>
            total + Number(product.price || 0) *
                    Number(product.stock || 0),
        0
    );

    totalProductsElement.textContent = products.length;
    totalStockElement.textContent = totalStock;
    lowStockElement.textContent = lowStock;
    inventoryValueElement.textContent = formatCurrency(inventoryValue);
}

/* =========================================
   PRODUCT STATUS
========================================= */

function getProductStatus(stock) {
    const quantity = Number(stock);

    if (quantity === 0) {
        return {
            text: "Out of Stock",
            className: "status-out"
        };
    }

    if (quantity < 10) {
        return {
            text: "Low Stock",
            className: "status-low"
        };
    }

    return {
        text: "In Stock",
        className: "status-ok"
    };
}

/* =========================================
   FILTER AND SEARCH
========================================= */

function getFilteredProducts() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedCategory = categoryFilter.value;
    const selectedStock = stockFilter.value;

    return products.filter(product => {
        const name = String(product.name || "").toLowerCase();
        const category = String(product.category || "").toLowerCase();
        const description = String(product.description || "").toLowerCase();

        const matchesSearch =
            name.includes(searchTerm) ||
            category.includes(searchTerm) ||
            description.includes(searchTerm);

        const matchesCategory =
            selectedCategory === "all" ||
            product.category === selectedCategory;

        const stock = Number(product.stock || 0);

        let matchesStock = true;

        if (selectedStock === "available") {
            matchesStock = stock >= 10;
        } else if (selectedStock === "low") {
            matchesStock = stock > 0 && stock < 10;
        } else if (selectedStock === "out") {
            matchesStock = stock === 0;
        }

        return matchesSearch && matchesCategory && matchesStock;
    });
}

/* =========================================
   SAFE HTML ELEMENT HELPERS
========================================= */

function createCell(content) {
    const cell = document.createElement("td");
    cell.appendChild(content);
    return cell;
}

function createTextElement(tag, text, className = "") {
    const element = document.createElement(tag);

    element.textContent = text;

    if (className) {
        element.className = className;
    }

    return element;
}

function createButton(text, className, callback) {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = text;
    button.className = `btn btn-small ${className}`;
    button.addEventListener("click", callback);

    return button;
}

/* =========================================
   RENDER PRODUCT TABLE
========================================= */

function renderProducts() {
    const filteredProducts = getFilteredProducts();

    const totalPages = Math.max(
        1,
        Math.ceil(filteredProducts.length / PAGE_SIZE)
    );

    currentPage = Math.min(currentPage, totalPages);

    const startIndex = (currentPage - 1) * PAGE_SIZE;

    const visibleProducts = filteredProducts.slice(
        startIndex,
        startIndex + PAGE_SIZE
    );

    productTableBody.replaceChildren();

    visibleProducts.forEach(product => {
        const row = document.createElement("tr");

        // Product image or placeholder.
        const imageCell = document.createElement("td");
        let imageElement;

        if (product.image) {
            imageElement = document.createElement("img");
            imageElement.src = product.image;
            imageElement.alt = product.name;
        } else {
            imageElement = document.createElement("div");
            imageElement.textContent = "🖼️";
            imageElement.setAttribute("aria-label", "No product image");
        }

        imageElement.className = "product-thumb";

        imageCell.appendChild(imageElement);
        row.appendChild(imageCell);

        // Product name and description.
        const nameContainer = document.createElement("div");

        nameContainer.appendChild(
            createTextElement("div", product.name, "product-name")
        );

        if (product.description) {
            nameContainer.appendChild(
                createTextElement(
                    "div",
                    product.description,
                    "product-description"
                )
            );
        }

        row.appendChild(createCell(nameContainer));

        // Category.
        row.appendChild(
            createCell(
                createTextElement(
                    "span",
                    product.category,
                    "category-tag"
                )
            )
        );

        // Price.
        row.appendChild(
            createCell(
                createTextElement(
                    "span",
                    formatCurrency(Number(product.price))
                )
            )
        );

        // Stock.
        row.appendChild(
            createCell(
                createTextElement("span", String(product.stock))
            )
        );

        // Status.
        const status = getProductStatus(Number(product.stock));

        row.appendChild(
            createCell(
                createTextElement(
                    "span",
                    status.text,
                    `status-tag ${status.className}`
                )
            )
        );

        // Edit and delete actions.
        const actions = document.createElement("div");
        actions.className = "row-actions";

        actions.appendChild(
            createButton("Edit", "edit-button", () => {
                editProduct(product.id);
            })
        );

        actions.appendChild(
            createButton("Delete", "delete-button", () => {
                deleteProduct(product.id);
            })
        );

        row.appendChild(createCell(actions));
        productTableBody.appendChild(row);
    });

    emptyState.hidden = filteredProducts.length !== 0;

    resultCount.textContent =
        `${filteredProducts.length} product${filteredProducts.length === 1 ? "" : "s"} found`;

    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

    prevPageButton.disabled = currentPage <= 1;
    nextPageButton.disabled = currentPage >= totalPages;
}

/* =========================================
   ADD OR UPDATE PRODUCT
========================================= */

productForm.addEventListener("submit", function (event) {
    event.preventDefault();
    clearMessage();

    const product = {
        name: productName.value.trim(),
        category: productCategory.value,
        price: productPrice.value,
        stock: productStock.value
    };

    const validationError = validateProduct(product);

    if (validationError) {
        showMessage(validationError, "error");
        return;
    }

    // Revalidate the selected file before saving.
    const selectedFile = productImage.files[0];

    if (selectedFile) {
        const imageValidation = validateImage(selectedFile);

        if (!imageValidation.valid) {
            showMessage(imageValidation.message, "error");
            return;
        }

        // Never save a newly selected file until it has been read.
        if (!editingImage || !selectedImageData) {
            showMessage(
                "Please select a valid image and wait for its preview.",
                "error"
            );
            return;
        }
    }

    const id = editProductId.value
        ? Number(editProductId.value)
        : null;

    const existingProduct = id !== null
        ? products.find(item => item.id === id)
        : null;

    if (id !== null && !existingProduct) {
        showMessage("The product you are editing no longer exists.", "error");
        return;
    }

    const image = imageWasRemoved
        ? ""
        : (selectedImageData || existingProduct?.image || "");

    const savedProduct = {
        id: id !== null
            ? id
            : Math.max(0, ...products.map(item => Number(item.id) || 0)) + 1,
        name: product.name,
        category: product.category,
        price: Number(product.price),
        stock: Number(product.stock),
        description: productDescription.value.trim(),
        image: image
    };

    let updatedProducts;

    if (id !== null) {
        updatedProducts = products.map(item =>
            item.id === id ? savedProduct : item
        );
    } else {
        updatedProducts = [...products, savedProduct];
    }

    try {
        // Save first, then update the visible application state.
        saveProducts(updatedProducts);

        products = updatedProducts;

        renderDashboard();
        resetForm();
        renderProducts();

        showMessage(
            id !== null
                ? "Product updated successfully!"
                : "Product added successfully!",
            "success"
        );
    } catch (error) {
        showMessage(error.message, "error");
    }
});

/* =========================================
   EDIT PRODUCT
========================================= */

function editProduct(id) {
    const product = products.find(item => item.id === id);

    if (!product) {
        showMessage("Product not found.", "error");
        return;
    }

    editProductId.value = product.id;
    productName.value = product.name;
    productCategory.value = product.category;
    productPrice.value = product.price;
    productStock.value = product.stock;
    productDescription.value = product.description || "";

    selectedImageData = product.image || "";
    imageWasRemoved = false;
    editingImage = false;

    productImage.value = "";

    displayImage(selectedImageData);

    formHeading.textContent = "Edit Product";
    submitButton.textContent = "Save Changes";
    cancelEditButton.hidden = false;

    clearMessage();

    document.getElementById("productFormSection").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

/* =========================================
   RESET FORM
========================================= */

function resetForm() {
    productForm.reset();

    editProductId.value = "";
    selectedImageData = "";
    editingImage = false;
    imageWasRemoved = false;

    productImage.value = "";

    displayImage("");

    formHeading.textContent = "Add New Product";
    submitButton.textContent = "＋ Add Product";
    cancelEditButton.hidden = true;
}

cancelEditButton.addEventListener("click", function () {
    resetForm();
    clearMessage();
});

/* =========================================
   DELETE PRODUCT
========================================= */

function deleteProduct(id) {
    const product = products.find(item => item.id === id);

    if (!product) {
        return;
    }

    const confirmed = window.confirm(
        `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) {
        return;
    }

    const updatedProducts = products.filter(item => item.id !== id);

    try {
        saveProducts(updatedProducts);
        products = updatedProducts;

        // Avoid leaving a deleted product in the edit form.
        if (Number(editProductId.value) === id) {
            resetForm();
        }

        renderDashboard();
        renderProducts();

        showMessage("Product deleted successfully.", "success");
    } catch (error) {
        showMessage(error.message, "error");
    }
}

/* =========================================
   SEARCH, FILTERS AND PAGINATION
========================================= */

function refreshProductList() {
    currentPage = 1;
    renderProducts();
}

searchInput.addEventListener("input", refreshProductList);
categoryFilter.addEventListener("change", refreshProductList);
stockFilter.addEventListener("change", refreshProductList);

prevPageButton.addEventListener("click", function () {
    if (currentPage > 1) {
        currentPage--;
        renderProducts();
    }
});

nextPageButton.addEventListener("click", function () {
    const totalPages = Math.max(
        1,
        Math.ceil(getFilteredProducts().length / PAGE_SIZE)
    );

    if (currentPage < totalPages) {
        currentPage++;
        renderProducts();
    }
});

/* =========================================
   START
========================================= */

initializeApp();
