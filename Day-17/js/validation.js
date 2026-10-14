
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
];

export function validateImage(file) {
    if (!file) {
        return {
            valid: true,
            message: ""
        };
    }

    const extension = file.name.split(".").pop().toLowerCase();
    const allowedExtensions = ["jpg", "jpeg", "png", "webp"];

    if (
        !ALLOWED_IMAGE_TYPES.includes(file.type) ||
        !allowedExtensions.includes(extension)
    ) {
        return {
            valid: false,
            message: "Please select a valid image file."
        };
    }

    if (file.size > MAX_IMAGE_SIZE) {
        return {
            valid: false,
            message: "Image size must be less than 2 MB."
        };
    }

    return {
        valid: true,
        message: ""
    };
}

export function validateProduct(product) {
    if (!product.name || product.name.trim().length < 3) {
        return "Product name must contain at least 3 characters.";
    }

    if (!product.category) {
        return "Please select a product category.";
    }

    if (
        product.price === "" ||
        !Number.isFinite(Number(product.price)) ||
        Number(product.price) <= 0
    ) {
        return "Price must be greater than ₹0.";
    }

    if (
        product.stock === "" ||
        !Number.isInteger(Number(product.stock)) ||
        Number(product.stock) < 0
    ) {
        return "Stock must be a non-negative whole number.";
    }

    return "";
}
