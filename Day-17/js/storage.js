
const STORAGE_KEY = "inventoryProducts";

export function loadProducts() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (savedData === null) {
            return null;
        }

        const parsedData = JSON.parse(savedData);

        if (!Array.isArray(parsedData)) {
            throw new Error("Saved product data is invalid.");
        }

        return parsedData;
    } catch (error) {
        console.error("Unable to load products:", error);
        throw new Error(
            "Unable to load saved products. Check your browser storage."
        );
    }
}

export function saveProducts(products) {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(products)
        );

        return true;
    } catch (error) {
        console.error("Unable to save products:", error);

        if (
            error.name === "QuotaExceededError" ||
            error.code === 22 ||
            error.code === 1014
        ) {
            throw new Error(
                "Browser storage is full. Use smaller images or remove some products."
            );
        }

        throw new Error(
            "Unable to save products. Check your browser storage settings."
        );
    }
}
