// ================================================================

// SMART SHOPPING CART - MAP V6

// Sa ban doc: 80 cm ngang x 120 cm dai

// Goc toa do (0,0): phia tren ben trai

// 8 ke giua K1-K8, ke tuong, quay am thuc, thanh toan

// Tuong thich 24 ma san pham A1-H3

// ================================================================



const canvas = document.getElementById("mapCanvas");



if (!canvas) {

    throw new Error("Khong tim thay #mapCanvas");

}



const ctx = canvas.getContext("2d");



if (!ctx) {

    throw new Error("Khong ho tro Canvas 2D");

}



const MAP_WIDTH = 80;

const MAP_HEIGHT = 120;



canvas.width = 800;

canvas.height = 1200;



const px = x => Number(x) / MAP_WIDTH * canvas.width;

const py = y => Number(y) / MAP_HEIGHT * canvas.height;

const pw = w => Number(w) / MAP_WIDTH * canvas.width;

const ph = h => Number(h) / MAP_HEIGHT * canvas.height;





// =====================================================

// 1. DANH SACH KHU VUC SAN PHAM

// =====================================================



const zones = [

    {

        id: "A",

        name: "RAU CU QUA",

        fullName: "Rau cu va trai cay",

        color: "#A5D6A7"

    },

    {

        id: "B",

        name: "THIT TUOI",

        fullName: "Thit tuoi song",

        color: "#EF9A9A"

    },

    {

        id: "C",

        name: "HAI SAN",

        fullName: "Ca va hai san",

        color: "#80DEEA"

    },

    {

        id: "D",

        name: "DONG LANH",

        fullName: "Thuc pham dong lanh",

        color: "#B39DDB"

    },

    {

        id: "E",

        name: "GAO, MI",

        fullName: "Gao, mi va ngu coc",

        color: "#90CAF9"

    },

    {

        id: "F",

        name: "GIA VI",

        fullName: "Gia vi va do kho",

        color: "#FFE082"

    },

    {

        id: "G",

        name: "DO HOP",

        fullName: "Do hop va banh keo",

        color: "#CE93D8"

    },

    {

        id: "H",

        name: "DO UONG",

        fullName: "Sua va do uong",

        color: "#80CBC4"

    }

];





// =====================================================

// 2. TAO 8 KE GIUA

// =====================================================



const CENTER_X = [16, 30.5, 45, 59.5];

const CENTER_Y = [17, 78];



const ACCESS_X = [25, 40, 54, 69];



const ACCESS_Y = [

    [22, 30, 38],

    [83, 91, 99]

];



const centerShelves = zones.map((zone, i) => {

    const row = Math.floor(i / 4);

    const col = i % 4;



    return {

        id: `K${i + 1}`,

        x: CENTER_X[col],

        y: CENTER_Y[row],

        width: 4.5,

        height: 25,

        zoneId: zone.id,

        color: zone.color,

        zone: zone.fullName,

        label: `K${i + 1}`

    };

});





// =====================================================

// 3. KE SAT TUONG

// =====================================================



const wallShelves = [

    {

        id: "SAU-TRAI",

        label: "SAU TRAI",

        x: 3, y: 3,

        width: 13, height: 3.5

    },

    {

        id: "SAU-GIUA",

        label: "SAU GIUA",

        x: 19, y: 3,

        width: 42, height: 3.5

    },

    {

        id: "SAU-PHAI",

        label: "SAU PHAI",

        x: 64, y: 3,

        width: 13, height: 3.5

    },

    {

        id: "TRAI-TREN",

        label: "TRAI TREN",

        x: 2, y: 11,

        width: 4, height: 35

    },

    {

        id: "TRAI-DUOI",

        label: "TRAI DUOI",

        x: 2, y: 70,

        width: 4, height: 35

    },

    {

        id: "PHAI-TREN",

        label: "PHAI TREN",

        x: 74, y: 11,

        width: 4, height: 35

    },

    {

        id: "PHAI-DUOI",

        label: "PHAI DUOI",

        x: 74, y: 70,

        width: 4, height: 35

    }

];





// =====================================================

// 4. QUAY AM THUC

// =====================================================



const DELI = {

    id: "FOOD",

    label: "AM THUC - BANH - DO AN SAN",

    x: 17,

    y: 54,

    width: 46,

    height: 12,

    accessX: 40,

    accessY: 49,

    color: "#ffdf9b"

};





// =====================================================

// 5. KHU PHU

// =====================================================



const EXTRA = [

    {

        id: "EX",

        label: "EX",

        x: 74, y: 51,

        width: 4, height: 7

    },

    {

        id: "KHO",

        label: "KHO",

        x: 74, y: 61,

        width: 4, height: 7

    }

];





// =====================================================

// 6. CUA VAO VA QUAY THANH TOAN

// =====================================================



const ENTRANCE = {

    x: 17,

    y: 111,

    width: 20,

    doorX: 7,

    doorY: 120,

    label: "CUA VAO/RA"

};



const CHECKOUTS = [

    {

        id: "Q1",

        label: "QUAY 1",

        x: 30,

        y: 113,

        width: 12,

        height: 5

    },

    {

        id: "Q2",

        label: "QUAY 2",

        x: 45,

        y: 113,

        width: 12,

        height: 5

    },

    {

        id: "Q3",

        label: "QUAY 3",

        x: 60,

        y: 113,

        width: 12,

        height: 5

    }

];





// =====================================================

// 7. ANH XA 24 MA SAN PHAM VAO 8 KE

// =====================================================



const shelves = centerShelves.flatMap((physical, i) => {

    return [1, 2, 3].map(part => {

        const row = Math.floor(i / 4);

        const col = i % 4;



        return {

            id: `${physical.zoneId}${part}`,

            label: `${physical.zoneId}${part}`,

            physicalShelfId: physical.id,

            zoneId: physical.zoneId,

            zone: physical.zone,

            x: physical.x,

            y: physical.y + (part - 1) * physical.height / 3,

            width: physical.width,

            height: physical.height / 3,

            accessX: ACCESS_X[col],

            accessY: ACCESS_Y[row][part - 1],

            color: physical.color

        };

    });

});





// =====================================================

// 8. TRANG THAI BAN DO

// =====================================================



let highlightedProduct = null;

let currentRoute = null;



let cartPosition = {

    x: ENTRANCE.x,

    y: ENTRANCE.y

};



let cartProductsOnMap = [];

// Thu tu lay san pham do route.js truyen sang sau khi tao lo trinh A*.
// Chi phuc vu hien thi; KHONG thay doi RFID / toc do animation.
let routePurchasePlan = null;





// =====================================================

// 9. HAM KIEM TRA TOA DO

// =====================================================



function valid(point) {

    return point != null

        && point.x != null

        && point.y != null

        && Number.isFinite(Number(point.x))

        && Number.isFinite(Number(point.y))

        && Number(point.x) >= 0

        && Number(point.x) <= MAP_WIDTH

        && Number(point.y) >= 0

        && Number(point.y) <= MAP_HEIGHT;

}





// =====================================================

// 10. HAM VE CO BAN

// =====================================================



function rect(x, y, w, h, color) {

    ctx.fillStyle = color;

    ctx.fillRect(px(x), py(y), pw(w), ph(h));

}



function border(x, y, w, h, color = "#607d8b", line = 1.8) {

    ctx.strokeStyle = color;

    ctx.lineWidth = line;

    ctx.strokeRect(px(x), py(y), pw(w), ph(h));

}



function textCenter(

    label,

    x,

    y,

    size = 15,

    color = "#263238",

    maxWidth = undefined

) {

    ctx.fillStyle = color;

    ctx.font = `bold ${size}px Arial, sans-serif`;

    ctx.textAlign = "center";

    ctx.textBaseline = "middle";



    ctx.fillText(

        String(label),

        px(x),

        py(y),

        maxWidth

    );

}



function marker(x, y, color, label, radius = 10) {

    ctx.beginPath();



    ctx.arc(

        px(x),

        py(y),

        radius,

        0,

        Math.PI * 2

    );



    ctx.fillStyle = color;

    ctx.fill();



    ctx.strokeStyle = "#ffffff";

    ctx.lineWidth = 2;

    ctx.stroke();



    ctx.fillStyle = "#ffffff";

    ctx.textAlign = "center";

    ctx.textBaseline = "middle";



    ctx.font = `bold ${

        label && String(label).length > 1 ? 11 : 13

    }px Arial`;



    ctx.fillText(

        String(label),

        px(x),

        py(y)

    );

}





// =====================================================

// 11. VE NEN SIEU THI

// =====================================================



function drawBackground() {

    ctx.clearRect(

        0,

        0,

        canvas.width,

        canvas.height

    );



    rect(

        0, 0,

        MAP_WIDTH, MAP_HEIGHT,

        "#f5f9fa"

    );



    // Luoi 5 cm

    ctx.strokeStyle = "#e1ebec";

    ctx.lineWidth = 1;



    for (let x = 0; x <= 80; x += 5) {

        ctx.beginPath();

        ctx.moveTo(px(x), 0);

        ctx.lineTo(px(x), canvas.height);

        ctx.stroke();

    }



    for (let y = 0; y <= 120; y += 5) {

        ctx.beginPath();

        ctx.moveTo(0, py(y));

        ctx.lineTo(canvas.width, py(y));

        ctx.stroke();

    }



    // Ve tuong bao

    ctx.strokeStyle = "#34546c";

    ctx.lineWidth = 11;



    ctx.beginPath();



    ctx.moveTo(px(0.6), py(119.4));

    ctx.lineTo(px(0.6), py(0.6));

    ctx.lineTo(px(79.4), py(0.6));

    ctx.lineTo(px(79.4), py(119.4));



    ctx.lineTo(px(27), py(119.4));



    ctx.moveTo(px(7), py(119.4));

    ctx.lineTo(px(0.6), py(119.4));



    ctx.stroke();



    textCenter(

        "CUA VAO / RA 20 cm",

        17,

        118.1,

        13,

        "#27664a",

        180

    );

}





// =====================================================

// 12. VE CAC KHOI KE

// =====================================================



function drawBlock(item, fill, stroke = "#5d7080") {

    ctx.fillStyle = "rgba(45,68,85,.16)";



    ctx.fillRect(

        px(item.x) + 4,

        py(item.y) + 4,

        pw(item.width),

        ph(item.height)

    );



    rect(

        item.x,

        item.y,

        item.width,

        item.height,

        fill

    );



    border(

        item.x,

        item.y,

        item.width,

        item.height,

        stroke,

        2

    );

}





// =====================================================

// 13. VE KE SAT TUONG

// =====================================================



function drawWallShelves() {

    wallShelves.forEach(s => {

        drawBlock(

            s,

            "#a4c2d5",

            "#4a7488"

        );



        if (s.height > s.width) {

            ctx.save();



            ctx.translate(

                px(s.x + s.width / 2),

                py(s.y + s.height / 2)

            );



            ctx.rotate(-Math.PI / 2);



            ctx.font = "bold 14px Arial";

            ctx.textAlign = "center";

            ctx.textBaseline = "middle";

            ctx.fillStyle = "#204354";



            ctx.fillText(

                s.label,

                0,

                0,

                ph(s.height) - 16

            );



            ctx.restore();

        } else {

            textCenter(

                s.label,

                s.x + s.width / 2,

                s.y + s.height / 2,

                s.width < 15 ? 12 : 15,

                "#204354",

                pw(s.width) - 8

            );

        }

    });



    EXTRA.forEach(s => {

        drawBlock(

            s,

            "#dfd4f5",

            "#8367a8"

        );



        textCenter(

            s.label,

            s.x + s.width / 2,

            s.y + s.height / 2,

            15,

            "#4b3273"

        );

    });

}





// =====================================================
// SMART CART V6 - KE HAI MAT, PHAN 3 TANG (A1-A3 ... H1-H3)
// Chi thay function drawCenterShelves() trong map.js hien tai.
// KHONG thay toa do, data san pham, RFID, A*, animation.
// =====================================================
function drawCenterShelves() {
    // Ve ke mot lan vao layer trong suot. Khi dau X chay,
    // map.js chi ghep layer co san -> animation RFID van muot.
    const cached = drawCenterShelves._visualCache;
    if (cached && cached.width === canvas.width && cached.height === canvas.height) {
        ctx.drawImage(cached, 0, 0);
        return;
    }

    const shelfLayer = document.createElement("canvas");
    shelfLayer.width = canvas.width;
    shelfLayer.height = canvas.height;
    const paint = shelfLayer.getContext("2d");
    if (!paint) return;

    // Ve 1 hinh chu nhat bo goc tren Canvas, khong can thu vien.
    function roundedRectPath(x, y, w, h, r) {
        const rr = Math.max(0, Math.min(r, w / 2, h / 2));
        paint.beginPath();
        paint.moveTo(x + rr, y);
        paint.lineTo(x + w - rr, y);
        paint.quadraticCurveTo(x + w, y, x + w, y + rr);
        paint.lineTo(x + w, y + h - rr);
        paint.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
        paint.lineTo(x + rr, y + h);
        paint.quadraticCurveTo(x, y + h, x, y + h - rr);
        paint.lineTo(x, y + rr);
        paint.quadraticCurveTo(x, y, x + rr, y);
        paint.closePath();
    }

    centerShelves.forEach((s, index) => {
        const x = px(s.x);
        const y = py(s.y);
        const w = pw(s.width);
        const h = ph(s.height);
        const pad = 2.4;
        const gutter = 4;
        const faceWidth = (w - pad * 2 - gutter) / 2;
        const leftX = x + pad;
        const rightX = leftX + faceWidth + gutter;

        paint.save();

        // Khung ke hien dai, bong do rat nhe.
        paint.shadowColor = "rgba(18, 48, 62, 0.18)";
        paint.shadowBlur = 7;
        paint.shadowOffsetY = 2;
        roundedRectPath(x, y, w, h, 4);
        paint.fillStyle = "#ffffff";
        paint.fill();
        paint.shadowColor = "transparent";
        paint.shadowBlur = 0;
        paint.shadowOffsetY = 0;

        // Hai mat ke doc lap, trung tam la khe phan cach nho.
        roundedRectPath(leftX, y + pad, faceWidth, h - pad * 2, 2.4);
        paint.fillStyle = s.color;
        paint.fill();

        roundedRectPath(rightX, y + pad, faceWidth, h - pad * 2, 2.4);
        paint.fillStyle = s.color;
        paint.fill();
        paint.fillStyle = "rgba(255,255,255,0.26)";
        paint.fill();

		// =============================================
		// VACH PHAN CHIA HAI MAT KE K1 - K8
		// =============================================

		// Nen khe phan cach
		paint.fillStyle = "#e9f0f3";
		paint.fillRect(
		    leftX + faceWidth,
		    y + pad,
		    gutter,
		    h - pad * 2
		);

		// Duong chia doi dam hon
		paint.fillStyle = "#526D7A";
		paint.fillRect(
		    x + w / 2 - 1.25,
		    y + pad,
		    2.5,
		    h - pad * 2
		);
        // Ba tang san pham A1-A3 ... H1-H3.
        for (let part = 1; part <= 3; part++) {
            const sub = shelves[index * 3 + part - 1];
            if (!sub) continue;

            const sy = py(sub.y);
            const sh = ph(sub.height);
            const cy = sy + sh / 2;

            if (part > 1) {
                paint.beginPath();
                paint.moveTo(x + pad + 1, sy);
                paint.lineTo(x + w - pad - 1, sy);
                paint.strokeStyle = "rgba(48,74,88,0.33)";
                paint.lineWidth = 1.5;
                paint.stroke();
            }

            // Hoa tiet ke hang tren hai mat, giup nhin nhu ke that.
            paint.strokeStyle = "rgba(255,255,255,0.60)";
            paint.lineWidth = 2;
            [-23, 22].forEach(dy => {
                const yy = cy + dy;
                if (yy < sy + 8 || yy > sy + sh - 8) return;
                paint.beginPath();
                paint.moveTo(leftX + 4, yy);
                paint.lineTo(leftX + faceWidth - 4, yy);
                paint.moveTo(rightX + 4, yy);
                paint.lineTo(rightX + faceWidth - 4, yy);
                paint.stroke();
            });

            // Nhan san pham nam trong the trang nho: KHONG bi vach doc de len chu.
            const badgeW = Math.min(30, w - 8);
            const badgeH = 22;
            const bx = x + (w - badgeW) / 2;
            const by = cy - badgeH / 2;
            roundedRectPath(bx, by, badgeW, badgeH, 5);
            paint.fillStyle = "rgba(255,255,255,0.97)";
            paint.fill();
            paint.strokeStyle = "rgba(74,105,122,0.30)";
            paint.lineWidth = 1;
            paint.stroke();

            paint.fillStyle = "#263f4c";
            paint.textAlign = "center";
            paint.textBaseline = "middle";
            paint.font = "bold 13px Arial, sans-serif";
            paint.fillText(String(sub.id), x + w / 2, cy + 0.4, badgeW - 4);
        }

        // Vien tong the tinh te; khong phu len nhan.
        roundedRectPath(x + 0.5, y + 0.5, w - 1, h - 1, 4);
        paint.strokeStyle = "#536d7b";
        paint.lineWidth = 1.8;
        paint.stroke();

        // Ten ke K1-K8 tren mot tab trang rieng.
        const tagW = 32;
        const tagH = 19;
        roundedRectPath(x + w / 2 - tagW / 2, y - 22, tagW, tagH, 5);
        paint.fillStyle = "#f8fbfc";
        paint.fill();
        paint.strokeStyle = "#b7cbd4";
        paint.lineWidth = 1;
        paint.stroke();
        paint.fillStyle = "#355363";
        paint.font = "bold 14px Arial, sans-serif";
        paint.textAlign = "center";
        paint.textBaseline = "middle";
        paint.fillText(s.id, x + w / 2, y - 12.5);

        paint.restore();
    });
    drawCenterShelves._visualCache = shelfLayer;
    ctx.drawImage(shelfLayer, 0, 0);
}





// =====================================================

// 15. VE QUAY AM THUC

// =====================================================



function drawDeli() {

    drawBlock(

        DELI,

        "#ffdc9b",

        "#bc7d2f"

    );



    textCenter(

        "QUAY AM THUC - BANH - DO AN CHE BIEN SAN",

        40,

        58,

        18,

        "#885016",

        pw(42)

    );



    for (let x = 21; x < 61; x += 6) {

        rect(

            x, 61,

            4, 3.1,

            "#ffb65b"

        );



        border(

            x, 61,

            4, 3.1,

            "#dd8d36",

            1

        );

    }

}





// =====================================================

// 16. VE QUAY THANH TOAN

// =====================================================



function drawCheckouts() {

    CHECKOUTS.forEach(q => {

        drawBlock(

            q,

            "#ffe2bd",

            "#db883c"

        );



        textCenter(

            q.label,

            q.x + q.width / 2,

            q.y + q.height / 2,

            14,

            "#84511d",

            pw(q.width) - 10

        );

    });

}





// =====================================================

// 17. VE DIEM TIEP CAN KE

// =====================================================



function drawAccessPoints() {

    shelves.forEach(s => {

        ctx.beginPath();



        ctx.arc(

            px(s.accessX),

            py(s.accessY),

            4.2,

            0,

            Math.PI * 2

        );



        ctx.fillStyle = "#c85349";

        ctx.fill();

    });

}





// =====================================================

// 18. TIM KE HANG

// =====================================================



function normalizeId(id) {

    let key = String(id ?? "")

        .trim()

        .toUpperCase();



    if (/^[A-H]$/.test(key)) {

        key += "1";

    }



    if (/^K[1-8]$/.test(key)) {

        const zone = String.fromCharCode(

            64 + Number(key.slice(1))

        );



        key = `${zone}2`;

    }



    if (

        key === "AM-THUC" ||

        key === "DELI"

    ) {

        key = "FOOD";

    }



    return key;

}



function findShelf(id) {

    const key = normalizeId(id);



    return key === "FOOD"

        ? DELI

        : shelves.find(s => s.id === key) || null;

}



// Ham dung chung cho ca tim kiem, gio hang va danh so lay hang.
// LEFT/RIGHT la hai mat cua cung 1 ma A1..H3, khong doi ma ke trong DB.
function normalizeShelfSide(side) {
    return String(side || "RIGHT").trim().toUpperCase() === "LEFT"
        ? "LEFT" : "RIGHT";
}

function getShelfFaceBounds(shelf, side) {
    if (!shelf) return null;
    if (shelf.id === "FOOD") {
        return { x: shelf.x, y: shelf.y, width: shelf.width, height: shelf.height };
    }
    const half = shelf.width / 2;
    return {
        x: shelf.x + (normalizeShelfSide(side) === "RIGHT" ? half : 0),
        y: shelf.y,
        width: half,
        height: shelf.height
    };
}

function outlineShelfFace(shelf, side, color, line = 4) {
    const box = getShelfFaceBounds(shelf, side);
    if (box) border(box.x, box.y, box.width, box.height, color, line);
}

function productPoint(product) {
    const shelf = findShelf(product?.shelfId);
    const side = normalizeShelfSide(product?.shelfSide);

    if (shelf) {
        if (shelf.id === "FOOD") {
            return { shelf, side: "RIGHT", x: shelf.accessX, y: shelf.accessY };
        }
        const zoneIndex = "ABCDEFGH".indexOf(shelf.zoneId);
        const leftX = zoneIndex >= 0 ? [11, 25, 40, 54][zoneIndex % 4] : shelf.accessX;
        return {
            shelf,
            side,
            x: side === "LEFT" ? leftX : shelf.accessX,
            y: shelf.accessY
        };
    }

    const fallback = { x: product?.xCoord, y: product?.yCoord };
    return valid(fallback)
        ? { shelf: null, side, x: Number(fallback.x), y: Number(fallback.y) }
        : null;
}





// =====================================================

// 19. HIGHLIGHT SAN PHAM

// =====================================================



function drawProductHighlight(product) {

    const loc = productPoint(product);



    if (!loc) return;



    ctx.strokeStyle = "#fb8c00";

    ctx.lineWidth = 4;



    if (loc.shelf) {
        outlineShelfFace(loc.shelf, loc.side, "#fb8c00", 4);
    }



    ctx.beginPath();



    ctx.arc(

        px(loc.x),

        py(loc.y),

        13,

        0,

        Math.PI * 2

    );



    ctx.stroke();



    const label = String(

        product.name || "San pham"

    );



    ctx.font = "bold 14px Arial";



    const w = Math.min(

        265,

        ctx.measureText(label).width + 20

    );



    const x = Math.max(

        7,

        Math.min(

            px(loc.x) + 13,

            canvas.width - w - 7

        )

    );



    const y = Math.max(

        8,

        py(loc.y) - 41

    );



    ctx.fillStyle = "#fff8e1";

    ctx.fillRect(x, y, w, 30);



    ctx.strokeStyle = "#ff9800";

    ctx.lineWidth = 1;

    ctx.strokeRect(x, y, w, 30);



    ctx.fillStyle = "#943a10";

    ctx.textAlign = "left";

    ctx.textBaseline = "middle";



    ctx.fillText(

        label,

        x + 8,

        y + 15,

        w - 14

    );

}





// =====================================================

// 20. VE TUYEN DUONG

// =====================================================



function drawRouteOverlay(points) {

    if (

        !Array.isArray(points) ||

        points.length < 2

    ) {

        return;

    }



    ctx.save();

    ctx.beginPath();



    points.forEach((p, i) => {

        if (i === 0) {

            ctx.moveTo(

                px(p.x),

                py(p.y)

            );

        } else {

            ctx.lineTo(

                px(p.x),

                py(p.y)

            );

        }

    });



    ctx.strokeStyle = "#8e24aa";

    ctx.lineWidth = 5;

    ctx.lineJoin = "round";

    ctx.lineCap = "round";



    ctx.setLineDash([12, 8]);

    ctx.stroke();

    ctx.restore();



    marker(

        points[0].x,

        points[0].y,

        "#2e7d32",

        "S",

        10

    );



    const last = points[points.length - 1];



    marker(

        last.x,

        last.y,

        "#c62828",

        "F",

        10

    );

}





// =====================================================

// 21. NHOM SAN PHAM TRONG GIO THEO KE

// =====================================================



function getCartShelfGroups() {
    const groups = [];
    const byShelf = new Map();

    cartProductsOnMap.forEach(product => {
        if (!product || !product.name) return;
        const loc = productPoint(product);
        if (!loc) return;

        // A1|LEFT va A1|RIGHT la 2 nhom khac nhau.
        const key = loc.shelf
            ? `${loc.shelf.id}|${loc.side}`
            : `${loc.x}:${loc.y}`;

        if (!byShelf.has(key)) {
            const group = {
                index: groups.length + 1,
                shelf: loc.shelf,
                side: loc.side,
                x: loc.x,
                y: loc.y,
                products: []
            };
            byShelf.set(key, group);
            groups.push(group);
        }
        byShelf.get(key).products.push(product);
    });
    return groups;
}





// =====================================================

// 22. DANH DAU TAT CA SAN PHAM TRONG GIO

// =====================================================



// Hien thi so thu tu lay san pham theo A* va trang thai "Da lay".
// Moi vi tri co the co nhieu san pham, danh sach duoc hien day du trong legend.
function drawRoutePurchaseMarkers() {
    if (!Array.isArray(routePurchasePlan)) return false;

    // Ve vien dung tung MAT KE cho TOAN BO mon trong lo trinh.
    // Khong gop nham B2|LEFT va B2|RIGHT thanh 1 vi tri.
    const faceGroups = new Map();
    const pointGroups = new Map();
    for (const item of routePurchasePlan) {
        if (!valid(item)) continue;
        const shelf = findShelf(item.shelfId);
        const side = normalizeShelfSide(item.shelfSide);
        if (shelf) {
            const faceKey = `${shelf.id}|${shelf.id === "FOOD" ? "RIGHT" : side}`;
            if (!faceGroups.has(faceKey)) {
                faceGroups.set(faceKey, { shelf, side, items: [] });
            }
            faceGroups.get(faceKey).items.push(item);
        }

        const x = Number(item.x);
        const y = Number(item.y);
        const pointKey = `${x.toFixed(2)}:${y.toFixed(2)}`;
        if (!pointGroups.has(pointKey)) pointGroups.set(pointKey, []);
        pointGroups.get(pointKey).push(item);
    }

    for (const group of faceGroups.values()) {
        const allDone = group.items.every(item => item.purchased);
        outlineShelfFace(group.shelf, group.side,
            allDone ? "#43a047" : "#ff9800", 3);
    }

    // Hai ke doi dien co the cung diem dung: chi 1 marker toa do,
    // nhung van hien day du tung san pham o bang thu tu.
    const nextItem = routePurchasePlan.find(item => !item.purchased);
    for (const items of pointGroups.values()) {
        const waiting = items.filter(item => !item.purchased);
        const chosen = (waiting.length ? waiting : items)[0];
        const allDone = waiting.length === 0;
        const isNext = Boolean(nextItem && items.includes(nextItem));
        marker(
            Number(chosen.x), Number(chosen.y),
            allDone ? "#43a047" : (isNext ? "#ef6c00" : "#1565c0"),
            allDone ? "✓" : String(chosen.order ?? "?"),
            12
        );
    }
    return true;
}

function drawCartMarkers() {
    if (drawRoutePurchaseMarkers()) return;

    getCartShelfGroups().forEach(group => {
        if (group.shelf) {
            outlineShelfFace(group.shelf, group.side, "#ff9800", 4);
        }
        marker(group.x, group.y, "#ef6c00", group.index, 11);
    });
}





// =====================================================

// 23. DANH SACH KE CAN GHE

// =====================================================



function updateCartMapLegend() {

    let legend = document.getElementById(

        "cartMapLegend"

    );



    if (!legend) {

        legend = document.createElement("div");

        legend.id = "cartMapLegend";



        legend.style.cssText =

            "width:100%;max-width:560px;margin-top:8px;padding:10px;" +

            "background:#fff8e1;border:1px solid #ffcc80;border-radius:8px;" +

            "max-height:150px;overflow-y:auto;font:13px Arial,sans-serif;";



        canvas.insertAdjacentElement(

            "afterend",

            legend

        );

    }



    legend.replaceChildren();

    // Khi da tao lo trinh: dung thu tu A* va hien thi mon da lay.
    if (Array.isArray(routePurchasePlan)) {
        legend.style.display = routePurchasePlan.length ? 'block' : 'none';
        if (!routePurchasePlan.length) return;

        const title = document.createElement('strong');
        const done = routePurchasePlan.filter(item => item.purchased).length;
        title.textContent = `🛒 Thu tu lay hang: ${done}/${routePurchasePlan.length} da lay`;
        legend.appendChild(title);

        routePurchasePlan.forEach(item => {
            const row = document.createElement('div');
            row.style.cssText = 'margin-top:7px;line-height:1.5;' +
                (item.purchased ? 'color:#2e7d32;text-decoration:line-through;' : 'color:#263238;');
            row.textContent = `${item.purchased ? '✓' : (item.order ?? '?') + '.'} ` +
                `${item.name || 'San pham'} (x${item.quantity || 1})` +
                ` - ${item.shelfId || 'Chua ro ke'}` +
                (findShelf(item.shelfId)?.id === "FOOD" ? "" :
                    ` (${normalizeShelfSide(item.shelfSide) === "LEFT" ? "MAT TRAI" : "MAT PHAI"})`);
            legend.appendChild(row);
        });
        return;
    }

    const groups = getCartShelfGroups();



    legend.style.display = groups.length

        ? "block"

        : "none";



    if (!groups.length) {

        return;

    }



    const header = document.createElement("strong");



    header.textContent =

        `🛒 Cac vi tri can ghe (${groups.length})`;



    legend.appendChild(header);



    groups.forEach(group => {

        const row = document.createElement("div");



        row.style.cssText =

            "margin-top:7px;line-height:1.4;";



        const name = group.shelf

            ? (

                group.shelf.physicalShelfId

                    ? `${group.shelf.physicalShelfId} - ${group.shelf.id}`

                    : "QUAY AM THUC"

            )

            : `(${group.x}, ${group.y})`;



        const products = group.products

            .map(p =>

                `${p.name} (x${Number(p.quantity) || 1})`

            )

            .join(", ");



        const sideLabel = group.shelf && group.shelf.id !== "FOOD"
            ? (group.side === "LEFT" ? " - MAT TRAI" : " - MAT PHAI")
            : "";

        row.textContent =

            `${group.index}. ${name}${sideLabel}: ${products}`;



        legend.appendChild(row);

    });

}





// =====================================================

// 24. VE TOAN BO BAN DO

// =====================================================



export function drawSupermarketMap() {

    drawBackground();



    drawWallShelves();

    drawCenterShelves();

    drawDeli();

    drawCheckouts();

    drawAccessPoints();



    if (currentRoute) {

        drawRouteOverlay(currentRoute);

    }



    if (highlightedProduct) {

        drawProductHighlight(highlightedProduct);

    }



    drawCartMarkers();



    if (valid(cartPosition)) {

        marker(

            cartPosition.x,

            cartPosition.y,

            "#1565c0",

            "X",

            11

        );

    }

}





// =====================================================

// 25. HIEN THI LO TRINH

// =====================================================



export function drawRoute(points) {

    const good = Array.isArray(points)

        ? points

            .filter(valid)

            .map(p => ({

                x: Number(p.x),

                y: Number(p.y)

            }))

        : [];



    currentRoute = good.length >= 2

        ? good

        : null;



    if (!currentRoute) {

        console.warn(

            "Route khong hop le:",

            points

        );

    }



    drawSupermarketMap();

}





// =====================================================

// 26. XOA LO TRINH

// =====================================================



export function clearRoute() {

    currentRoute = null;

    drawSupermarketMap();

}





// =====================================================

// 27. HIGHLIGHT SAN PHAM

// =====================================================



export function highlightProductOnMap(product) {

    highlightedProduct = product

        ? { ...product }

        : null;



    drawSupermarketMap();

}





// =====================================================

// 28. XOA HIGHLIGHT

// =====================================================



export function clearProductHighlight() {

    highlightedProduct = null;

    drawSupermarketMap();

}





// =====================================================

// 29. LAY DANH SACH KE

// =====================================================



export function getMapShelves() {

    return shelves.map(s => ({

        ...s

    }));

}





// =====================================================

// 30. LAY DIEM TIEP CAN KE

// =====================================================



export function getShelfAccessPoint(id, side = "RIGHT") {
    const shelf = findShelf(id);
    if (!shelf) return null;
    if (shelf.id === "FOOD") {
        return { x: shelf.accessX, y: shelf.accessY };
    }
    const zoneIndex = "ABCDEFGH".indexOf(shelf.zoneId);
    const leftX = zoneIndex >= 0
        ? [11, 25, 40, 54][zoneIndex % 4]
        : shelf.accessX;
    return {
        x: normalizeShelfSide(side) === "LEFT" ? leftX : shelf.accessX,
        y: shelf.accessY
    };
}





// =====================================================

// 31. LAY KHU VUC

// =====================================================



export function getMapZones() {

    return zones.map(z => ({

        ...z

    }));

}





// =====================================================

// 32. LAY CUA VAO

// =====================================================



export function getEntrancePoint() {

    return {

        x: ENTRANCE.x,

        y: ENTRANCE.y

    };

}





// =====================================================

// 33. LAY QUAY THANH TOAN

// =====================================================



export function getCheckoutPoints() {

    return CHECKOUTS.map(q => ({

        id: q.id,

        label: q.label,

        x: q.x + q.width / 2,

        y: q.y - 5

    }));

}





// =====================================================

// 34. LAY VI TRI XE DAY

// =====================================================



export function getCartPosition() {

    return {

        ...cartPosition

    };

}





// =====================================================

// 35. CAP NHAT VI TRI XE DAY

// =====================================================



export function setCartPosition(point) {

    if (!valid(point)) {

        return false;

    }



    cartPosition = {

        x: Number(point.x),

        y: Number(point.y)

    };



    drawSupermarketMap();



    return true;

}





// =====================================================

// 36. DONG BO GIO HANG

// =====================================================



export function setCartProductsOnMap(products) {

    cartProductsOnMap = Array.isArray(products)

        ? products.map(p => ({

            ...p

        }))

        : [];



    updateCartMapLegend();

    drawSupermarketMap();

}





// =====================================================

// DANH SO MON HANG VA CAP NHAT TRANG THAI DA LAY TREN BAN DO
// (Tuong thich SmartCart_route_DanhSo_XacNhanMua_V1.js)
// =====================================================

export function setPurchasePlanOnMap(plan) {
    routePurchasePlan = Array.isArray(plan)
        ? plan.map(item => ({ ...item }))
        : null;
    updateCartMapLegend();
    drawSupermarketMap();
}


// =====================================================

// 37. THONG TIN BO CUC

// =====================================================



export function getMapLayoutInfo() {

    return {

        widthCm: MAP_WIDTH,

        lengthCm: MAP_HEIGHT,



        centerShelves: centerShelves.map(s => ({

            ...s

        })),



        wallShelves: wallShelves.map(s => ({

            ...s

        })),



        deli: {

            ...DELI

        },



        checkouts: CHECKOUTS.map(s => ({

            ...s

        })),



        entrance: {

            ...ENTRANCE

        }

    };

}

// ======================================================



// ======================================================

// DONG BO VI TRI XE QUA RFID

// ======================================================



async function syncRFIDPosition() {



    try {



        const response = await fetch(

            "/api/rfid/position",

            {

                cache: "no-store"

            }

        );



        if (!response.ok) {

            return;

        }



        const data = await response.json();



        if (!valid(data)) {

            return;

        }



        const current = getCartPosition();



        if (

            current.x !== Number(data.x) ||

            current.y !== Number(data.y)

        ) {



			moveCartSmoothly(

			    Number(data.x),

			    Number(data.y)

			);



            console.log(

                "[RFID] Xe tai:",

                data.location

            );

        }



    } catch (error) {



        console.error(

            "[RFID] Loi dong bo:",

            error

        );

    }

}



// Lay vi tri moi 1 giay

setInterval(syncRFIDPosition, 1000);



// Lay vi tri ban dau

syncRFIDPosition();

// ================================================

// SMART CART - RFID SMOOTH MOVEMENT

// ================================================



let cartAnimationId = null;

let displayedCartPosition = null;



// Di chuyển mượt đến tọa độ mới

function moveCartSmoothly(targetX, targetY) {



    const target = {

        x: Number(targetX),

        y: Number(targetY)

    };



    if (!Number.isFinite(target.x) ||

        !Number.isFinite(target.y)) {

        return;

    }



    if (cartAnimationId !== null) {

        cancelAnimationFrame(cartAnimationId);

        cartAnimationId = null;

    }



    if (!displayedCartPosition) {

        displayedCartPosition = { ...target };

        setCartPosition(target);

        return;

    }



    const start = { ...displayedCartPosition };



    // Thời gian di chuyển: 1 giây

    const duration = 1000;

    const startTime = performance.now();



    function animate(now) {



        const progress = Math.min(

            (now - startTime) / duration,

            1

        );



        // Chuyển động mượt

        const ease =

            progress * progress * (3 - 2 * progress);



        const x =

            start.x + (target.x - start.x) * ease;



        const y =

            start.y + (target.y - start.y) * ease;



        displayedCartPosition = { x, y };



        setCartPosition({ x, y });



        if (progress < 1) {

            cartAnimationId = requestAnimationFrame(animate);

        } else {

            displayedCartPosition = { ...target };

            cartAnimationId = null;

        }

    }



    cartAnimationId = requestAnimationFrame(animate);

}

// =====================================================

// END MAP V6

// =====================================================
