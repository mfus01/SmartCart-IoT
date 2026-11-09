// ======================================================
// SMART SHOPPING CART - ROUTE MODULE (RFID + A*)
// Su dung RFID lam diem xuat phat khi nhan "Tao lo trinh".
// Giu nguyen tuyen mau, mo phong va nut ve cua vao.
// ======================================================

import { getCart } from "../cart/cart.js";
import {
    drawRoute,
    clearRoute,
    getEntrancePoint,
    getShelfAccessPoint,
    setCartPosition,
    setPurchasePlanOnMap
} from "../map/map.js";
import { generateRouteApi } from "../api/routeApi.js";

const SIM_SPEED = 8;
const MAP_MAX_X = 80;
const MAP_MAX_Y = 120;

let activeRoute = null;
let animationId = null;
let simulateButton = null;
let generatingRoute = false;

// ============ DANH SACH LAY HANG ============
// Luu xac nhan tren TRINH DUYET; khong sua database, khong tu dong xoa gio.
const PURCHASE_STORAGE_KEY = "smartcart_purchase_progress_v1";
let purchaseState = loadPurchaseState();
let activePurchasePlan = [];
let planCartSignature = null;
let purchasePanel = null;

function loadPurchaseState() {
    try {
        const data = JSON.parse(localStorage.getItem(PURCHASE_STORAGE_KEY) || "{}");
        return data && typeof data === "object" && !Array.isArray(data) ? data : {};
    } catch (error) {
        console.warn("[PURCHASE] Khong doc duoc trang thai da lay:", error);
        return {};
    }
}

function savePurchaseState() {
    try {
        localStorage.setItem(PURCHASE_STORAGE_KEY, JSON.stringify(purchaseState));
    } catch (error) {
        console.warn("[PURCHASE] Khong luu duoc trang thai:", error);
    }
}

function productKey(item) {
    const id = item.id ?? item.productId ?? item.qrCode ?? item.name;
    return `${String(id)}::${String(item.shelfId || "").trim().toUpperCase()}`;
}

function itemQuantity(item) {
    const n = Number(item.quantity);
    return Number.isFinite(n) && n > 0 ? n : 1;
}

function wasPurchased(item) {
    const saved = purchaseState[productKey(item)];
    return Boolean(saved && saved.done === true && saved.quantity === itemQuantity(item));
}

function cartSignature(items) {
    return JSON.stringify(items.map(item => ({
        key: productKey(item), quantity: itemQuantity(item)
    })).sort((a, b) => a.key.localeCompare(b.key)));
}

// Tinh khoang cach DOC THEO duong A* den ke can lay hang.
// Backend da giu cac diem ghe ke trong routePoints.
// Vi vay so thu tu phan anh duong di, khong phai thu tu them gio.
function positionAlongRoute(point, routePoints) {
    if (!point || !valid(point)) {
        return { distance: Infinity, offset: Infinity };
    }
    let traveled = 0;
    let bestDistance = Infinity;
    let bestOffset = Infinity;
    for (let i = 1; i < routePoints.length; i++) {
        const a = routePoints[i - 1];
        const b = routePoints[i];
        const vx = b.x - a.x;
        const vy = b.y - a.y;
        const segmentSq = vx * vx + vy * vy;
        const t = segmentSq <= 1e-9 ? 0 : Math.max(0, Math.min(1,
            ((point.x - a.x) * vx + (point.y - a.y) * vy) / segmentSq
        ));
        const projection = { x: a.x + t * vx, y: a.y + t * vy };
        const error = Math.hypot(point.x - projection.x, point.y - projection.y);
        const offset = traveled + Math.sqrt(segmentSq) * t;
        if (error < bestDistance - 1e-8 ||
            (Math.abs(error - bestDistance) < 1e-8 && offset < bestOffset)) {
            bestDistance = error;
            bestOffset = offset;
        }
        traveled += Math.sqrt(segmentSq);
    }
    return { distance: bestDistance, offset: bestOffset };
}

function getProductStop(item) {
    const known = getShelfAccessPoint(item.shelfId);
    if (valid(known)) return known;
    if (item.xCoord == null || item.yCoord == null) return null;
    const fallback = { x: Number(item.xCoord), y: Number(item.yCoord) };
    return valid(fallback) ? fallback : null;
}

function makePurchasePlan(pendingItems, routePoints) {
    const stops = pendingItems.map((item, originalIndex) => {
        const point = getProductStop(item);
        const orderInfo = positionAlongRoute(point, routePoints);
        return {
            key: productKey(item),
            id: item.id,
            name: String(item.name || "Sản phẩm"),
            shelfId: String(item.shelfId || ""),
            quantity: itemQuantity(item),
            x: point ? Number(point.x) : null,
            y: point ? Number(point.y) : null,
            routeOffset: orderInfo.offset,
            offRoute: orderInfo.distance > 1.5,
            originalIndex,
            purchased: false
        };
    });
    stops.sort((a, b) => a.routeOffset - b.routeOffset || a.originalIndex - b.originalIndex);
    stops.forEach((item, index) => { item.order = index + 1; });
    return stops;
}

function updatePurchasePlanMap() {
    setPurchasePlanOnMap(activePurchasePlan.length ? activePurchasePlan : null);
}

function renderPurchasePanel() {
    if (!purchasePanel) return;
    purchasePanel.replaceChildren();
    if (!activePurchasePlan.length) {
        purchasePanel.style.display = "none";
        return;
    }
    purchasePanel.style.display = "block";

    const doneCount = activePurchasePlan.filter(item => item.purchased).length;
    const heading = document.createElement("h3");
    heading.textContent = `🛒 Thứ tự lấy hàng (${doneCount}/${activePurchasePlan.length} đã lấy)`;
    heading.style.cssText = "margin:0 0 7px;font-size:17px;color:#133c63;";
    purchasePanel.appendChild(heading);

    const bar = document.createElement("div");
    bar.style.cssText = "height:9px;background:#dde8e5;border-radius:10px;overflow:hidden;margin:7px 0 12px;";
    const fill = document.createElement("div");
    fill.style.cssText = `height:100%;width:${100 * doneCount / activePurchasePlan.length}%;background:#2e7d32;transition:width .25s;`;
    bar.appendChild(fill);
    purchasePanel.appendChild(bar);

    const next = activePurchasePlan.find(item => !item.purchased);
    const summary = document.createElement("div");
    summary.setAttribute("aria-live", "polite");
    summary.style.cssText = "font-weight:600;color:#21553b;margin-bottom:10px;line-height:1.5;";
    summary.textContent = next
        ? `👉 Món tiếp theo: ${next.order}. ${next.name} — ${next.shelfId || "chưa rõ kệ"}`
        : "🎉 Bạn đã xác nhận lấy đủ tất cả sản phẩm!";
    purchasePanel.appendChild(summary);

    const currentCart = getCart();
    if (planCartSignature !== cartSignature(Array.isArray(currentCart) ? currentCart : [])) {
        const warning = document.createElement("p");
        warning.style.cssText = "color:#b45309;font-weight:bold;";
        warning.textContent = "⚠ Giỏ hàng đã thay đổi. Hãy nhấn Tạo lộ trình để cập nhật thứ tự.";
        purchasePanel.appendChild(warning);
    }

    for (const item of activePurchasePlan) {
        const row = document.createElement("div");
        row.style.cssText = "display:flex;flex-wrap:wrap;align-items:center;gap:9px;padding:9px 4px;border-top:1px solid #e6e9ec;";

        const index = document.createElement("span");
        index.style.cssText = `min-width:32px;height:32px;border-radius:50%;display:grid;place-items:center;font-weight:bold;color:white;background:${item.purchased ? "#2e7d32" : (item === next ? "#ef6c00" : "#1565c0")};`;
        index.textContent = item.purchased ? "✓" : String(item.order);
        row.appendChild(index);

        const info = document.createElement("div");
        info.style.cssText = "flex:1 1 160px;min-width:0;line-height:1.4;overflow-wrap:anywhere;";
        const name = document.createElement("div");
        name.textContent = item.name;
        name.style.cssText = `font-weight:600;${item.purchased ? "text-decoration:line-through;color:#6b7280;" : "color:#1f2937;"}`;
        const detail = document.createElement("small");
        detail.textContent = `Kệ ${item.shelfId || "?"} · Số lượng: ${item.quantity}` +
            (item.offRoute ? " · ⚠ cần kiểm tra tọa độ kệ" : "");
        detail.style.cssText = "display:block;color:#64748b;";
        info.append(name, detail);
        row.appendChild(info);

        const button = document.createElement("button");
        button.type = "button";
        button.dataset.purchaseKey = item.key;
        button.textContent = item.purchased ? "↶ Hoàn tác" : "✓ Đã lấy";
        button.setAttribute("aria-label", `${item.purchased ? "Hoàn tác" : "Xác nhận đã lấy"} ${item.name}`);
        button.style.cssText = `border:0;border-radius:8px;padding:10px 13px;cursor:pointer;font-weight:600;color:white;background:${item.purchased ? "#64748b" : "#2e7d32"};`;
        row.appendChild(button);
        purchasePanel.appendChild(row);
    }

    const note = document.createElement("p");
    note.textContent = "Lưu ý: Chỉ nhấn Đã lấy khi đã bỏ sản phẩm vào giỏ. Hệ thống không tự xác nhận chỉ vì đi qua RFID.";
    note.style.cssText = "font-size:12px;color:#64748b;line-height:1.5;margin:12px 0 7px;";
    purchasePanel.appendChild(note);

    const newTrip = document.createElement("button");
    newTrip.type = "button";
    newTrip.textContent = "↺ Bắt đầu lượt mua mới (bỏ đánh dấu đã lấy)";
    newTrip.style.cssText = "padding:9px 12px;border:1px solid #94a3b8;border-radius:7px;background:#fff;cursor:pointer;color:#334155;";
    newTrip.addEventListener("click", () => {
        if (!confirm("Xóa tất cả dấu xác nhận đã lấy? Các sản phẩm trong giỏ hàng vẫn được giữ nguyên.")) return;
        purchaseState = {};
        savePurchaseState();
        activePurchasePlan = [];
        planCartSignature = null;
        stopAnimation();
        activeRoute = null;
        clearRoute();
        if (simulateButton) simulateButton.disabled = true;
        renderPurchasePanel();
        updatePurchasePlanMap();
        alert("Đã xóa các dấu xác nhận. Nhấn Tạo lộ trình để sắp xếp lại toàn bộ món hàng.");
    });
    purchasePanel.appendChild(newTrip);
}

function handlePurchaseClick(event) {
    const button = event.target.closest("button[data-purchase-key]");
    if (!button || !purchasePanel.contains(button)) return;
    const currentCart = getCart();
    if (planCartSignature !== cartSignature(Array.isArray(currentCart) ? currentCart : [])) {
        alert("Giỏ hàng đã thay đổi. Hãy tạo lại lộ trình trước khi xác nhận.");
        renderPurchasePanel();
        return;
    }
    const item = activePurchasePlan.find(p => p.key === button.dataset.purchaseKey);
    if (!item) return;
    item.purchased = !item.purchased;
    if (item.purchased) {
        purchaseState[item.key] = { done: true, quantity: item.quantity };
    } else {
        delete purchaseState[item.key];
    }
    savePurchaseState();
    renderPurchasePanel();
    updatePurchasePlanMap();
}

function installPurchasePanel(controls) {
    if (purchasePanel) return;
    purchasePanel = document.createElement("section");
    purchasePanel.id = "purchaseChecklistPanel";
    purchasePanel.style.cssText = "display:none;margin:12px 0;padding:15px;background:#f8fbff;border:1px solid #a9c9e5;border-radius:10px;font-family:Arial,sans-serif;";
    purchasePanel.addEventListener("click", handlePurchaseClick);
    controls.insertAdjacentElement("afterend", purchasePanel);
}

// Toa do dung theo sa ban 80 cm (X) x 120 cm (Y).
function valid(p) {
    return p != null &&
        p.x !== null && p.x !== undefined &&
        p.y !== null && p.y !== undefined &&
        Number.isFinite(Number(p.x)) &&
        Number.isFinite(Number(p.y)) &&
        Number(p.x) >= 0 && Number(p.x) <= MAP_MAX_X &&
        Number(p.y) >= 0 && Number(p.y) <= MAP_MAX_Y;
}

// Luon lay diem bat dau tu Backend RFID, KHONG lay tu hieu ung
// di chuyen tren map.js (co the dang noi suy toa do).
async function getCurrentRFIDPosition() {
    let response;
    try {
        response = await fetch("/api/rfid/position", {
            cache: "no-store"
        });
    } catch (error) {
        throw new Error("Khong ket noi duoc API vi tri RFID.");
    }

    if (!response.ok) {
        throw new Error("API vi tri RFID tra ve HTTP " + response.status);
    }

    const data = await response.json();
    if (!valid(data)) {
        throw new Error("Backend RFID tra ve toa do khong hop le.");
    }

    // RouteController A* su dung luoi 1 cm (so nguyen).
    const start = {
        x: Math.round(Number(data.x)),
        y: Math.round(Number(data.y))
    };

    console.log("[ROUTE] Diem bat dau RFID:", data.location, start);
    return start;
}

function createRouteRequest(cart, start) {
    return {
        startPoint: { x: start.x, y: start.y },
        products: cart.map(item => ({
            productId: item.id,
            name: item.name,
            shelfId: item.shelfId,
            xCoord: item.xCoord,
            yCoord: item.yCoord,
            qrCode: item.qrCode,
            quantity: item.quantity
        }))
    };
}

function stopAnimation() {
    if (animationId !== null) {
        cancelAnimationFrame(animationId);
    }
    animationId = null;
    if (simulateButton) {
        simulateButton.disabled = !activeRoute;
        simulateButton.textContent = "▶ Chạy thử xe";
    }
}

// Ve tuyen chi dan nhung KHONG keo dau X (xe that) ve diem dau.
function showRoute(points, expectedStart = null) {
    stopAnimation();

    const good = Array.isArray(points)
        ? points.filter(valid).map(p => ({
            x: Number(p.x),
            y: Number(p.y)
        }))
        : [];

    if (good.length < 2) {
        activeRoute = null;
        clearRoute();
        alert("Lo trinh khong co du toa do hop le.");
        return false;
    }

    if (expectedStart && (
        Math.abs(good[0].x - expectedStart.x) > 1 ||
        Math.abs(good[0].y - expectedStart.y) > 1
    )) {
        activeRoute = null;
        clearRoute();
        console.error("[ROUTE] Sai diem xuat phat:", {
            expectedStart,
            firstRoutePoint: good[0]
        });
        alert("Diem dau cua tuyen khong khop vi tri RFID. Kiem tra Backend.");
        return false;
    }

    activeRoute = good;
    drawRoute(good);
    // KHONG setCartPosition(good[0]) o day:
    // vi tri dau X duoc cap nhat boi RFID, khong phai duong A*.

    if (simulateButton) {
        simulateButton.disabled = false;
    }
    return true;
}

async function generateRoute() {
    if (generatingRoute) return;

    const cart = getCart();
    if (!Array.isArray(cart) || cart.length === 0) {
        alert("Gio hang dang rong. Hay them san pham truoc.");
        return;
    }

    const pendingCart = cart.filter(item => !wasPurchased(item));
    // Khi tao lai tuyen giua chung: khong dan den nhung mon da xac nhan mua.
    if (pendingCart.length === 0) {
        activePurchasePlan = cart.map((item, index) => {
            const point = getProductStop(item);
            return {
                key: productKey(item), name: String(item.name || "Sản phẩm"),
                shelfId: String(item.shelfId || ""), quantity: itemQuantity(item),
                x: point?.x ?? null, y: point?.y ?? null,
                order: index + 1, purchased: true
            };
        });
        planCartSignature = cartSignature(cart);
        stopAnimation();
        activeRoute = null;
        clearRoute();
        if (simulateButton) simulateButton.disabled = true;
        renderPurchasePanel();
        updatePurchasePlanMap();
        return;
    }

    generatingRoute = true;
    const button = document.getElementById("generateRouteButton");
    if (button) button.disabled = true;

    try {
        // Moi lan tao tuyen, doc lai vi tri RFID that moi nhat.
        const start = await getCurrentRFIDPosition();
        const request = createRouteRequest(pendingCart, start);
        console.log("[ROUTE] Gui Backend:", request);

        const result = await generateRouteApi(request);
        console.log("[ROUTE] Backend tra ve:", result);

        if (!result.success) {
            alert(result.message || "Tao lo trinh that bai.");
            return;
        }
        if (!result.data || !Array.isArray(result.data.routePoints)) {
            alert("Backend khong tra ve routePoints hop le.");
            return;
        }

        if (showRoute(result.data.routePoints, start)) {
            const goodRoute = result.data.routePoints
                .filter(valid).map(p => ({ x: Number(p.x), y: Number(p.y) }));
            const orderedPending = makePurchasePlan(pendingCart, goodRoute);
            const alreadyPurchased = cart.filter(wasPurchased).map(item => {
                const point = getProductStop(item);
                return {
                    key: productKey(item), id: item.id,
                    name: String(item.name || "Sản phẩm"),
                    shelfId: String(item.shelfId || ""),
                    quantity: itemQuantity(item),
                    x: point?.x ?? null, y: point?.y ?? null,
                    order: null, purchased: true
                };
            });
            activePurchasePlan = [...orderedPending, ...alreadyPurchased];
            planCartSignature = cartSignature(cart);
            renderPurchasePanel();
            updatePurchasePlanMap();
            console.log("[PURCHASE] Thu tu lay hang theo A*:", activePurchasePlan);
        }
    } catch (error) {
        console.error("[ROUTE] Loi tao lo trinh:", error);
        alert(error.message || "Khong the tao lo trinh.");
    } finally {
        generatingRoute = false;
        if (button) button.disabled = false;
    }
}

// Chi dung de MO PHONG, khong phai toa do xe RFID thuc te.
function simulateCart() {
    if (!activeRoute || activeRoute.length < 2) {
        alert("Hay tao lo trinh hoac chon tuyen mau truoc.");
        return;
    }

    stopAnimation();
    const lengths = [];
    let total = 0;

    for (let i = 1; i < activeRoute.length; i++) {
        const a = activeRoute[i - 1];
        const b = activeRoute[i];
        const length = Math.hypot(b.x - a.x, b.y - a.y);
        lengths.push(length);
        total += length;
    }

    if (total <= 0) {
        setCartPosition(activeRoute[activeRoute.length - 1]);
        return;
    }

    const duration = total / SIM_SPEED * 1000;
    let started = null;

    if (simulateButton) {
        simulateButton.disabled = true;
        simulateButton.textContent = "⏳ Xe đang di chuyển";
    }

    setCartPosition(activeRoute[0]);

    function frame(time) {
        if (started === null) started = time;
        let remaining = Math.min((time - started) / duration * total, total);
        let point = activeRoute[activeRoute.length - 1];

        for (let i = 0; i < lengths.length; i++) {
            if (remaining <= lengths[i]) {
                const a = activeRoute[i];
                const b = activeRoute[i + 1];
                const t = lengths[i] === 0 ? 1 : remaining / lengths[i];
                point = {
                    x: a.x + (b.x - a.x) * t,
                    y: a.y + (b.y - a.y) * t
                };
                break;
            }
            remaining -= lengths[i];
        }

        setCartPosition(point);
        if (time - started < duration) {
            animationId = requestAnimationFrame(frame);
        } else {
            animationId = null;
            setCartPosition(activeRoute[activeRoute.length - 1]);
            if (simulateButton) {
                simulateButton.disabled = false;
                simulateButton.textContent = "▶ Chạy lại";
            }
        }
    }

    animationId = requestAnimationFrame(frame);
}

function demoRouteA3() {
    const shelf = getShelfAccessPoint("A3");
    if (!shelf) {
        alert("Khong tim thay ke A3.");
        return;
    }

    const demo = [
        getEntrancePoint(),
        { x: 13, y: 91 },
        { x: 13, y: 68 },
        shelf
    ];

    activePurchasePlan = [];
    planCartSignature = null;
    renderPurchasePanel();
    updatePurchasePlanMap();
    if (showRoute(demo)) simulateCart();
}

function resetCart() {
    stopAnimation();
    activeRoute = null;
    clearRoute();
    activePurchasePlan = [];
    planCartSignature = null;
    renderPurchasePanel();
    updatePurchasePlanMap();
    // Chi dat lai bieu tuong tren giao dien; KHONG doi du lieu RFID Backend.
    setCartPosition(getEntrancePoint());
    if (simulateButton) {
        simulateButton.disabled = true;
        simulateButton.textContent = "▶ Chạy thử xe";
    }
}

function makeButton(label) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.style.cssText = `
        flex: 1 1 120px;
        padding: 10px 8px;
        background: #1565c0;
        border: none;
        border-radius: 7px;
        color: white;
        cursor: pointer;
        font-size: 13px;
        font-weight: bold;
    `;
    return button;
}

export function initRoute() {
    const generateButton = document.getElementById("generateRouteButton");
    if (!generateButton) {
        console.error("Khong tim thay #generateRouteButton");
        return;
    }
    if (document.getElementById("cartSimulationControls")) return;

    generateButton.addEventListener("click", generateRoute);

    const controls = document.createElement("div");
    controls.id = "cartSimulationControls";
    controls.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
    `;

    const demoButton = makeButton("🧭 Tuyến mẫu A3");
    simulateButton = makeButton("▶ Chạy thử xe");
    simulateButton.disabled = true;
    const resetButton = makeButton("↺ Về cửa vào");

    demoButton.addEventListener("click", demoRouteA3);
    simulateButton.addEventListener("click", simulateCart);
    resetButton.addEventListener("click", resetCart);

    controls.append(demoButton, simulateButton, resetButton);
    generateButton.insertAdjacentElement("afterend", controls);
    installPurchasePanel(controls);

    // KHONG dat xe ve cua vao o initRoute:
    // RFID map.js se cap nhat vi tri xe that.
}
