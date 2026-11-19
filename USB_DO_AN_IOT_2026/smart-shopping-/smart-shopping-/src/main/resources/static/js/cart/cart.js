// =====================================================
// CART MODULE
// Quan ly gio hang va dong bo voi ban do
// =====================================================

import {
    setCartProductsOnMap
} from "../map/map.js";


// =====================================================
// 1. DU LIEU GIO HANG
// =====================================================

let cart = [];

const cartItemsElement =
    document.getElementById("cartItems");

const totalPriceElement =
    document.getElementById("totalPrice");


// =====================================================
// 2. TAO BUTTON
// =====================================================

function createButton(text, onClick) {

    const button =
        document.createElement("button");

    button.type = "button";

    button.textContent = text;

    button.style.cssText = `
        margin: 8px 5px 0 0;
        padding: 5px 9px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    `;

    button.addEventListener(
        "click",
        onClick
    );

    return button;
}


// =====================================================
// 3. TANG SO LUONG
// =====================================================

function increaseQuantity(productId) {

    const item = cart.find(
        p => p.id === productId
    );

    if (!item) {
        return;
    }

    item.quantity += 1;

    renderCart();
}


// =====================================================
// 4. GIAM SO LUONG
// =====================================================

function decreaseQuantity(productId) {

    const item = cart.find(
        p => p.id === productId
    );

    if (!item) {
        return;
    }

    item.quantity -= 1;

    if (item.quantity <= 0) {

        cart = cart.filter(
            p => p.id !== productId
        );
    }

    renderCart();
}


// =====================================================
// 5. XOA SAN PHAM
// =====================================================

function removeFromCart(productId) {

    cart = cart.filter(
        p => p.id !== productId
    );

    renderCart();
}


// =====================================================
// 6. HIEN THI GIO HANG
// =====================================================

export function renderCart() {

    if (
        !cartItemsElement ||
        !totalPriceElement
    ) {

        console.error(
            "Khong tim thay cartItems hoac totalPrice"
        );

        return;
    }

    // =========================================
    // DONG BO TAT CA SAN PHAM LEN BAN DO
    // =========================================

    setCartProductsOnMap(cart);

    // =========================================
    // XOA GIAO DIEN GIO HANG CU
    // =========================================

    cartItemsElement.replaceChildren();

    // =========================================
    // GIO HANG RONG
    // =========================================

    if (cart.length === 0) {

        const empty =
            document.createElement("p");

        empty.textContent =
            "Chua co san pham.";

        cartItemsElement.appendChild(empty);

        totalPriceElement.textContent =
            "0 VND";

        return;
    }

    // =========================================
    // TINH TONG TIEN
    // =========================================

    let total = 0;

    cart.forEach(item => {

        const price =
            Number(item.price) || 0;

        const subTotal =
            price * item.quantity;

        total += subTotal;

        // =====================================
        // KHUNG SAN PHAM
        // =====================================

        const row =
            document.createElement("div");

        row.style.cssText = `
            padding: 10px 0;
            border-bottom: 1px solid #ddd;
        `;

        // =====================================
        // TEN SAN PHAM
        // =====================================

        const name =
            document.createElement("strong");

        name.textContent = item.name;

        // =====================================
        // GIA VA SO LUONG
        // =====================================

        const detail =
            document.createElement("div");

        detail.style.marginTop = "5px";

        detail.textContent =
            `${price.toLocaleString("vi-VN")} VND x ${item.quantity}`;

        // =====================================
        // THANH TIEN
        // =====================================

        const subtotalText =
            document.createElement("div");

        subtotalText.style.marginTop = "4px";

        subtotalText.textContent =
            `Thanh tien: ${subTotal.toLocaleString("vi-VN")} VND`;

        // =====================================
        // CAC NUT DIEU KHIEN
        // =====================================

        const controls =
            document.createElement("div");

        const decreaseButton =
            createButton(
                "-",
                () => decreaseQuantity(item.id)
            );

        const increaseButton =
            createButton(
                "+",
                () => increaseQuantity(item.id)
            );

        const removeButton =
            createButton(
                "Xoa",
                () => removeFromCart(item.id)
            );

        controls.append(
            decreaseButton,
            increaseButton,
            removeButton
        );

        // =====================================
        // GAN VAO GIO HANG
        // =====================================

        row.append(
            name,
            detail,
            subtotalText,
            controls
        );

        cartItemsElement.appendChild(row);
    });

    // =========================================
    // CAP NHAT TONG TIEN
    // =========================================

    totalPriceElement.textContent =
        `${total.toLocaleString("vi-VN")} VND`;
}


// =====================================================
// 7. THEM SAN PHAM VAO GIO
// =====================================================

export function addToCart(product) {

    if (
        !product ||
        product.id == null ||
        !product.name
    ) {

        throw new Error(
            "San pham thieu ID hoac ten"
        );
    }

    const price =
        Number(product.price);

    if (
        !Number.isFinite(price) ||
        price < 0
    ) {

        throw new Error(
            "Gia san pham khong hop le"
        );
    }

    // =========================================
    // KIEM TRA SAN PHAM DA CO TRONG GIO CHUA
    // =========================================

    const existing = cart.find(
        p => p.id === product.id
    );

    if (existing) {

        existing.quantity += 1;
        // Dong bo mat ke neu san pham duoc chon lai sau khi cap nhat API.
        existing.shelfSide = String(product.shelfSide || existing.shelfSide || "RIGHT")
            .trim().toUpperCase() === "LEFT" ? "LEFT" : "RIGHT";

    } else {

        // =====================================
        // THEM SAN PHAM MOI
        // =====================================

        cart.push({

            id: product.id,

            name: product.name,

            price: price,

            shelfId: product.shelfId,

            // Can giu thong tin mat ke cho map.js va route.js (A*).
            shelfSide: String(product.shelfSide || "RIGHT").trim().toUpperCase() === "LEFT"
                ? "LEFT" : "RIGHT",

            xCoord: product.xCoord,

            yCoord: product.yCoord,

            qrCode: product.qrCode,

            quantity: 1

        });
    }

    console.log(
        "[CART] Gio hang:",
        cart
    );

    // Cap nhat gio hang va ban do
    renderCart();
}


// =====================================================
// 8. LAY DU LIEU GIO HANG
// =====================================================

export function getCart() {

    return cart;
}


// =====================================================
// END CART MODULE
// =====================================================