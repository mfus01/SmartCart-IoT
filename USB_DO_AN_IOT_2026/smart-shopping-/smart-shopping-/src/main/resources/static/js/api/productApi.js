// ======================================================
// PRODUCT API
// Chiu trach nhiem giao tiep voi Spring Boot Backend
// ======================================================


// ======================================================
// LAY TOAN BO DANH SACH SAN PHAM
// GET /api/products
// ======================================================

export async function getAllProducts() {

    const response =
        await fetch("/api/products");

    const result =
        await response.json();

    if (!response.ok) {

        throw new Error(
            result.message
            || "Khong the lay danh sach san pham."
        );
    }

    return result;
}


// ======================================================
// TIM SAN PHAM THEO TEN
// GET /api/products/search?q=...
// ======================================================

export async function searchProducts(keyword) {

    const response =
        await fetch(
            "/api/products/search?q="
            + encodeURIComponent(keyword)
        );

    const result =
        await response.json();

    if (!response.ok) {

        throw new Error(
            result.message
            || "Khong the tim san pham."
        );
    }

    return result;
}