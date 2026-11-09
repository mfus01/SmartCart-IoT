// ======================================================
// CANVAS
// ======================================================

const canvas = document.getElementById("mapCanvas");
const ctx = canvas.getContext("2d");


// ======================================================
// KICH THUOC LOGIC CUA BAN DO
// Database dang dung toa do x, y theo mien 0 -> 100
// ======================================================

const MAP_WIDTH = 100;
const MAP_HEIGHT = 100;
// ======================================================
// DU LIEU GIO HANG
// ======================================================

let cart = [];


// ======================================================
// CHUYEN TOA DO LOGIC -> TOA DO CANVAS
//
// Vi du:
// x = 20 -> 160px tren canvas 800px
// y = 15 -> 75px tren canvas 500px
// ======================================================

function toCanvasX(x) {

    return (x / MAP_WIDTH) * canvas.width;
}


function toCanvasY(y) {

    return (y / MAP_HEIGHT) * canvas.height;
}


// ======================================================
// VE NEN BAN DO
// ======================================================

function drawBackground() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // Vien ban do
    ctx.strokeStyle = "#b0bec5";
    ctx.lineWidth = 2;

    ctx.strokeRect(
        5,
        5,
        canvas.width - 10,
        canvas.height - 10
    );
}


// ======================================================
// VE KE HANG
// ======================================================

function drawShelf(
    label,
    x,
    y,
    width,
    height
) {

    ctx.fillStyle = "#90caf9";

    ctx.fillRect(
        x,
        y,
        width,
        height
    );


    ctx.strokeStyle = "#1565c0";
    ctx.lineWidth = 2;

    ctx.strokeRect(
        x,
        y,
        width,
        height
    );


    ctx.fillStyle = "#0d47a1";

    ctx.font = "bold 18px Arial";

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
        "Ke " + label,
        x + width / 2,
        y + height / 2
    );
}


// ======================================================
// VE DIEM TRUY CAP
// DAY LA TOA DO DANG LUU TRONG SQLITE
// ======================================================

function drawAccessPoint(
    label,
    x,
    y
) {

    const canvasX = toCanvasX(x);
    const canvasY = toCanvasY(y);


    ctx.beginPath();

    ctx.arc(
        canvasX,
        canvasY,
        7,
        0,
        Math.PI * 2
    );


    ctx.fillStyle = "#d32f2f";
    ctx.fill();


    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();


    ctx.fillStyle = "#333333";

    ctx.font = "13px Arial";

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    ctx.fillText(
        label + " (" + x + ", " + y + ")",
        canvasX + 12,
        canvasY
    );
}


// ======================================================
// VE CUA VAO
// ======================================================

function drawEntrance() {

    const x = 40;

    const y =
        canvas.height - 55;

    const width = 130;
    const height = 40;


    ctx.fillStyle = "#c8e6c9";

    ctx.fillRect(
        x,
        y,
        width,
        height
    );


    ctx.strokeStyle = "#2e7d32";
    ctx.lineWidth = 2;

    ctx.strokeRect(
        x,
        y,
        width,
        height
    );


    ctx.fillStyle = "#1b5e20";

    ctx.font = "bold 16px Arial";

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
        "CUA VAO",
        x + width / 2,
        y + height / 2
    );
}


// ======================================================
// VE QUAY THANH TOAN
// ======================================================

function drawCheckout() {

    const width = 150;
    const height = 40;

    const x =
        canvas.width - width - 40;

    const y =
        canvas.height - 55;


    ctx.fillStyle = "#ffe0b2";

    ctx.fillRect(
        x,
        y,
        width,
        height
    );


    ctx.strokeStyle = "#ef6c00";
    ctx.lineWidth = 2;

    ctx.strokeRect(
        x,
        y,
        width,
        height
    );


    ctx.fillStyle = "#e65100";

    ctx.font = "bold 16px Arial";

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
        "THANH TOAN",
        x + width / 2,
        y + height / 2
    );
}


// ======================================================
// VE TOAN BO BAN DO
// ======================================================

function drawSupermarketMap() {

    drawBackground();


    // ------------------------------
    // 4 KE HANG
    // ------------------------------

    drawShelf(
        "A",
        70,
        100,
        220,
        55
    );


    drawShelf(
        "B",
        510,
        100,
        220,
        55
    );


    drawShelf(
        "C",
        70,
        300,
        220,
        55
    );


    drawShelf(
        "D",
        510,
        300,
        220,
        55
    );


    // ------------------------------
    // DIEM TRUY CAP THEO DATABASE
    // ------------------------------

    drawAccessPoint(
        "A",
        20,
        15
    );


    drawAccessPoint(
        "B",
        80,
        15
    );


    drawAccessPoint(
        "C",
        20,
        55
    );


    drawAccessPoint(
        "D",
        80,
        55
    );


    // ------------------------------
    // CUA VAO + THANH TOAN
    // ------------------------------

    drawEntrance();

    drawCheckout();
}


// ======================================================
// VE DUONG DI LEN BAN DO
//
// Ham nay KHONG tinh A* / Dijkstra.
// Ham chi nhan danh sach toa do va ve len Canvas.
// ======================================================

function drawRoute(routePoints) {

    if (
        !routePoints ||
        routePoints.length < 2
    ) {

        return;
    }


    ctx.beginPath();


    const startPoint =
        routePoints[0];


    ctx.moveTo(
        toCanvasX(startPoint.x),
        toCanvasY(startPoint.y)
    );


    for (
        let i = 1;
        i < routePoints.length;
        i++
    ) {

        const point =
            routePoints[i];


        ctx.lineTo(
            toCanvasX(point.x),
            toCanvasY(point.y)
        );
    }


    ctx.strokeStyle = "#7b1fa2";

    ctx.lineWidth = 5;

    ctx.setLineDash(
        [10, 8]
    );

    ctx.stroke();


    // Tra lai net ve binh thuong
    ctx.setLineDash([]);
}


// ======================================================
// LAM NOI BAT SAN PHAM TREN BAN DO
// ======================================================

function highlightProductOnMap(product) {

    // Ve lai ban do goc
    // de xoa highlight cu
    drawSupermarketMap();


    // ==================================================
    // ROUTE TAM THOI
    //
    // Day CHUA PHAI A* / DIJKSTRA.
    // Chi dung de kiem tra kha nang ve duong.
    // Sau nay se thay bang route that tu module thuat toan.
    // ==================================================

    const testRoute = [

        {
            x: 10,
            y: 90
        },

        {
            x: 10,
            y: 70
        },

        {
            x: product.xCoord,
            y: 70
        },

        {
            x: product.xCoord,
            y: product.yCoord
        }
    ];


    drawRoute(testRoute);


    // ------------------------------
    // Toa do san pham tren Canvas
    // ------------------------------

    const pointX =
        toCanvasX(product.xCoord);

    const pointY =
        toCanvasY(product.yCoord);


    // ------------------------------
    // Khoanh tron diem truy cap
    // ------------------------------

    ctx.beginPath();

    ctx.arc(
        pointX,
        pointY,
        14,
        0,
        Math.PI * 2
    );


    ctx.strokeStyle = "#ff9800";

    ctx.lineWidth = 5;

    ctx.stroke();


    // ------------------------------
    // Vi tri cac ke tren Canvas
    // ------------------------------

    const shelfPositions = {

        A: {
            x: 70,
            y: 100,
            width: 220,
            height: 55
        },

        B: {
            x: 510,
            y: 100,
            width: 220,
            height: 55
        },

        C: {
            x: 70,
            y: 300,
            width: 220,
            height: 55
        },

        D: {
            x: 510,
            y: 300,
            width: 220,
            height: 55
        }
    };


    const shelf =
        shelfPositions[product.shelfId];


    // ------------------------------
    // Khoanh noi bat ke hang
    // ------------------------------

    if (shelf) {

        ctx.strokeStyle =
            "#ff9800";

        ctx.lineWidth = 6;


        ctx.strokeRect(
            shelf.x - 5,
            shelf.y - 5,
            shelf.width + 10,
            shelf.height + 10
        );
    }


    // ------------------------------
    // Hien ten san pham tren ban do
    // ------------------------------

    ctx.fillStyle =
        "#e65100";


    ctx.font =
        "bold 16px Arial";


    ctx.textAlign =
        "left";


    ctx.textBaseline =
        "bottom";


    ctx.fillText(
        product.name,
        pointX + 18,
        pointY - 10
    );
}


// ======================================================
// LAY DANH SACH SAN PHAM TU BACKEND
// ======================================================

async function loadProducts() {

    try {

        const response =
            await fetch(
                "/api/products"
            );


        const result =
            await response.json();


        if (!result.success) {

            console.error(
                "Khong the lay danh sach san pham:",
                result.message
            );

            return;
        }


        console.log(
            "Danh sach san pham tu Backend:",
            result.data
        );

    } catch (error) {

        console.error(
            "Loi khi goi API /api/products:",
            error
        );
    }
}


// ======================================================
// ======================================================
// THEM SAN PHAM VAO GIO HANG
// ======================================================

function addToCart(product) {

    const existingItem = cart.find(
        item => item.id === product.id
    );

    if (existingItem) {

        existingItem.quantity += 1;

    } else {

        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }

    console.log(
        "Gio hang hien tai:",
        cart
    );
}
// CHAT - TIM SAN PHAM
// ======================================================

const chatInput =
    document.getElementById(
        "chatInput"
    );


const sendButton =
    document.getElementById(
        "sendButton"
    );


const chatMessages =
    document.getElementById(
        "chatMessages"
    );


// ======================================================
// THEM MOT TIN NHAN VAO KHUNG CHAT
// ======================================================

function addChatMessage(
    message,
    type
) {

    const messageElement =
        document.createElement("p");


    messageElement.textContent =
        message;


    if (type === "user") {

        messageElement.style.background =
            "#1565c0";

        messageElement.style.color =
            "white";

    } else {

        messageElement.style.background =
            "#e3f2fd";

        messageElement.style.color =
            "#222";
    }


    chatMessages.appendChild(
        messageElement
    );


    chatMessages.scrollTop =
        chatMessages.scrollHeight;
}


// ======================================================
// TIM SAN PHAM THONG QUA BACKEND
// ======================================================

async function searchProduct(keyword) {

    try {

        const response =
            await fetch(
                "/api/products/search?q="
                + encodeURIComponent(keyword)
            );


        const result =
            await response.json();


        // ------------------------------
        // Khong tim thay
        // ------------------------------

        if (!result.success) {

            addChatMessage(
                result.message,
                "bot"
            );

            return;
        }


        const products =
            result.data;


        // ------------------------------
        // Lam noi bat san pham dau tien
        // tren ban do
        // ------------------------------

        if (products.length > 0) {

            highlightProductOnMap(
                products[0]
            );
        }


        // ------------------------------
        // Hien ket qua trong khung chat
        // ------------------------------

        products.forEach(
            product => {

                const message =

                    "Tim thay: "
                    + product.name

                    + " | Gia: "
                    + product.price
                        .toLocaleString(
                            "vi-VN"
                        )

                    + " VND"

                    + " | Ke "
                    + product.shelfId

                    + " | Toa do: ("
                    + product.xCoord

                    + ", "
                    + product.yCoord

                    + ")";


                addChatMessage(
                    message,
                    "bot"
                );
            }
        );

    } catch (error) {

        console.error(
            "Loi tim san pham:",
            error
        );


        addChatMessage(
            "Khong the ket noi den Backend.",
            "bot"
        );
    }
}


// ======================================================
// XU LY KHI BAM NUT GUI
// ======================================================

async function handleSendMessage() {

    const keyword =
        chatInput.value.trim();


    if (keyword === "") {

        return;
    }


    addChatMessage(
        keyword,
        "user"
    );


    chatInput.value = "";


    await searchProduct(
        keyword
    );
}


// ======================================================
// BAM NUT GUI
// ======================================================

sendButton.addEventListener(
    "click",
    handleSendMessage
);


// ======================================================
// NHAN ENTER CUNG GUI
// ======================================================

chatInput.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Enter"
        ) {

            handleSendMessage();
        }
    }
);


// ======================================================
// KHOI DONG TRANG WEB
// ======================================================

// Ve ban do ban dau
drawSupermarketMap();


// Lay danh sach san pham tu Backend
loadProducts();