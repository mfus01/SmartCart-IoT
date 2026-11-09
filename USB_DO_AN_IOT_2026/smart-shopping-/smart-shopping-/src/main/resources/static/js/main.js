// ======================================================
// SMART SHOPPING CART
// MAIN MODULE
// Ket noi Website - Backend - ESP32
// ======================================================


// ======================================================
// 1. IMPORT MODULE
// ======================================================

import {
    getAllProducts
} from "./api/productApi.js";

import {
    drawSupermarketMap
} from "./map/map.js";

import {
    initChat
} from "./chat/chat.js";

import {
    renderCart
} from "./cart/cart.js";

import {
    initRoute
} from "./route/route.js";


// ======================================================
// 2. CAU HINH ESP32
// ======================================================

const ESP32_URL = "http://192.168.1.79/status";

const ESP32_UPDATE_INTERVAL = 1000;


// ======================================================
// 3. LOAD DANH SACH SAN PHAM TU BACKEND
// ======================================================

async function loadProducts() {

    try {

        console.log(
            "[PRODUCT] Dang tai danh sach san pham..."
        );

        const result = await getAllProducts();

        if (!result.success) {

            console.error(
                "[PRODUCT] Khong the lay san pham:",
                result.message
            );

            return;
        }

        console.log(
            "[PRODUCT] Danh sach san pham:",
            result.data
        );

        if (Array.isArray(result.data)) {

            console.log(
                "[PRODUCT] Tong so san pham:",
                result.data.length
            );

        }

    } catch (error) {

        console.error(
            "[PRODUCT] Loi ket noi Backend:",
            error
        );

    }

}


// ======================================================
// 4. TAO BANG TRANG THAI ESP32
// ======================================================

const esp32Panel = document.createElement("div");

esp32Panel.id = "esp32Panel";

esp32Panel.style.cssText = `
    position: fixed;
    top: 110px;
    right: 25px;
    bottom: auto;

    background: #ffffff;
    color: #263238;

    padding: 10px 15px;

    border-radius: 8px;

    box-shadow: 0 2px 8px rgba(0,0,0,0.2);

    z-index: 9999;

    font-family: Arial, sans-serif;
    font-size: 14px;
    font-weight: bold;

    white-space: nowrap;

    max-width: calc(100vw - 50px);

    box-sizing: border-box;
`;

esp32Panel.textContent = "🛒 ESP32: Đang kết nối...";


// ======================================================
// 5. HIEN THI BANG ESP32
// ======================================================

function initESP32Panel() {

    if (!document.getElementById("esp32Panel")) {

        document.body.appendChild(esp32Panel);

    }

    console.log(
        "[ESP32] Da khoi tao bang trang thai."
    );

}


// ======================================================
// 6. DOC DU LIEU CAM BIEN ESP32
// ======================================================

let esp32Updating = false;

async function updateESP32() {

    // Tranh gui nhieu request cung luc

    if (esp32Updating) {
        return;
    }

    esp32Updating = true;

    try {

        const response = await fetch(
            ESP32_URL,
            {
                method: "GET",
                cache: "no-store"
            }
        );

        if (!response.ok) {

            throw new Error(
                "ESP32 HTTP " + response.status
            );

        }

        const data = await response.json();

        // Kiem tra du lieu cam bien

        if (
            data.angle === undefined ||
            data.angle === null
        ) {

            throw new Error(
                "ESP32 khong tra ve goc quay."
            );

        }

        const angle = Number(data.angle);

        if (
            !Number.isFinite(angle) ||
            angle < 0 ||
            angle >= 360
        ) {

            throw new Error(
                "Gia tri goc quay khong hop le."
            );

        }

        // Hien thi trang thai ket noi

        esp32Panel.textContent =
            "🛒 ESP32: ✅ | AS5600: "
            + angle.toFixed(2)
            + "°";

        // Luu du lieu de cac module khac co the doc

        window.esp32Data = {

            connected: true,

            device: data.device || "ESP32",

            sensor: data.sensor || "AS5600",

            angle: angle,

            timestamp: Date.now()

        };

    } catch (error) {

        esp32Panel.textContent =
            "🔴 ESP32: Mất kết nối";

        window.esp32Data = {

            connected: false,

            angle: null,

            timestamp: Date.now()

        };

        console.warn(
            "[ESP32] Loi ket noi:",
            error.message
        );

    } finally {

        esp32Updating = false;

    }

}


// ======================================================
// 7. KHOI DONG KET NOI ESP32
// ======================================================

function initESP32() {

    console.log(
        "[ESP32] Bat dau ket noi..."
    );

    initESP32Panel();

    updateESP32();

    setInterval(
        updateESP32,
        ESP32_UPDATE_INTERVAL
    );

}


// ======================================================
// 8. KHOI DONG BAN DO SIEU THI
// ======================================================

function initSupermarketMap() {

    console.log(
        "[MAP] Dang khoi tao ban do..."
    );

    drawSupermarketMap();

    console.log(
        "[MAP] Ban do da san sang."
    );

}


// ======================================================
// 9. KHOI DONG GIO HANG
// ======================================================

function initShoppingCart() {

    console.log(
        "[CART] Dang khoi tao gio hang..."
    );

    renderCart();

    console.log(
        "[CART] Gio hang da san sang."
    );

}


// ======================================================
// 10. KHOI DONG CHATBOT
// ======================================================

function initChatbot() {

    console.log(
        "[CHAT] Dang khoi tao chatbot..."
    );

    initChat();

    console.log(
        "[CHAT] Chatbot da san sang."
    );

}


// ======================================================
// 11. KHOI DONG HE THONG TIM DUONG
// ======================================================

function initRouteSystem() {

    console.log(
        "[ROUTE] Dang khoi tao he thong tim duong..."
    );

    initRoute();

    console.log(
        "[ROUTE] He thong tim duong da san sang."
    );

}


// ======================================================
// 12. KHOI DONG TOAN BO WEBSITE
// ======================================================

async function initApp() {

    console.log(
        "========================================"
    );

    console.log(
        "SMART SHOPPING CART"
    );

    console.log(
        "Khoi dong he thong..."
    );

    console.log(
        "========================================"
    );

    // 1. Khoi tao ban do

    initSupermarketMap();

    // 2. Khoi tao gio hang

    initShoppingCart();

    // 3. Khoi tao chatbot

    initChatbot();

    // 4. Khoi tao he thong tim duong

    initRouteSystem();

    // 5. Ket noi ESP32

    initESP32();

    // 6. Load san pham tu Backend

    await loadProducts();

    console.log(
        "========================================"
    );

    console.log(
        "SMART SHOPPING CART DA SAN SANG!"
    );

    console.log(
        "========================================"
    );

}


// ======================================================
// 13. CHAY UNG DUNG
// ======================================================

initApp().catch(error => {

    console.error(
        "[MAIN] Loi khoi dong he thong:",
        error
    );

});


// ======================================================
// END MAIN MODULE
// ======================================================