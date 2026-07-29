// ==============================================================
// CONFIG
// ==============================================================

// WhatsApp number that receives the order message (no + or spaces)
const STORE_WHATSAPP = "923428453606";

// Google Apps Script Web App URL — writes one row per cart item to
// the Orders sheet (order id / product id / product name / qty /
// unit price / buyer name / buyer number / payment method /
// user message / delivery status) and assigns the next order id.
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxLt6qlIk8y0OvOURsUX3dYLbLcmDRwdaRRZYDROm06zrdaBHhJaQ1PltySqaCJjB22/exec";

// ==============================================================
// STATE
// ==============================================================
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let pickedLocation = null; // {lat, lng} — set only if the user drops a pin
let leafletMap = null;
let leafletMarker = null;

// ==============================================================
// CART HELPERS (mirrors product.js so the dropdown behaves the same)
// ==============================================================
function updateCartUI(){
    let totalQty = 0;
    cart.forEach(item => totalQty += item.qty);
    const cartCount = document.getElementById("cartCount");
    if(cartCount) cartCount.textContent = totalQty;
}

function saveCart(){
    localStorage.setItem("cart", JSON.stringify(cart));
}

function changeQty(index, change){
    if(!cart[index]) return;
    cart[index].qty += change;
    if(cart[index].qty <= 0) cart.splice(index, 1);
    saveCart();
    updateCartUI();
    renderCart();
    renderSummary();
}

function removeItem(index){
    cart.splice(Number(index), 1);
    saveCart();
    updateCartUI();
    renderCart();
    renderSummary();
}

function toggleCart(){
    const box = document.getElementById("cartBox");
    box.style.display = box.style.display === "none" ? "block" : "none";
    renderCart();
}

function renderCart(){
    const container = document.getElementById("cartItems");
    container.innerHTML = "";

    if(cart.length === 0){
        container.innerHTML = "<p style='font-size:13px'>Cart is empty</p>";
        return;
    }

    let total = 0;

    cart.forEach((item, i) => {
        const price = parseFloat(item.price) || 0;
        const itemTotal = price * item.qty;
        total += itemTotal;

        container.innerHTML += `
        <div style="display:flex;gap:10px;margin-bottom:12px;border-bottom:1px solid #eee;padding-bottom:10px;">
            <img src="${item.img}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;border:1px solid #ddd;">
            <div style="flex:1;">
                <div style="display:flex;justify-content:space-between;">
                    <b>${item.name}</b>
                    <button onclick="removeItem(${i})" class="remove-cart-btn">✕</button>
                </div>
                <div style="font-size:13px;color:#666;">Rs. ${item.price}</div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
                    <div>
                        <button onclick="changeQty(${i}, -1)">−</button>
                        <span style="margin:0 8px;">${item.qty}</span>
                        <button onclick="changeQty(${i}, 1)">+</button>
                    </div>
                    <div style="font-weight:700;color:#0f766e;">Rs. ${itemTotal}</div>
                </div>
            </div>
        </div>`;
    });

    container.innerHTML += `
        <hr>
        <div style="display:flex;justify-content:space-between;font-weight:700;">
            <span>Total</span>
            <span style="color:#0f766e;">Rs. ${total}</span>
        </div>`;
}

document.addEventListener("click", function(e){
    const cartBox = document.getElementById("cartBox");
    const cartBtn = document.querySelector('[onclick="toggleCart()"]');
    if(cartBox && cartBox.style.display === "block" && !cartBox.contains(e.target) && !cartBtn.contains(e.target)){
        cartBox.style.display = "none";
    }
});

// ==============================================================
// ORDER SUMMARY (main checkout card)
// ==============================================================
function cartTotal(){
    return cart.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * item.qty, 0);
}

function renderSummary(){
    const container = document.getElementById("summaryItems");
    container.innerHTML = cart.map((item, i) => `
        <div class="summary-item">
            <img src="${item.img}" alt="${item.name}">
            <div class="summary-item-info">
                <div class="name">${item.name}</div>
                <div class="meta">
                    <span>
                        <button type="button" onclick="changeQty(${i}, -1)" style="border:none;background:#f1f5f9;width:20px;height:20px;border-radius:6px;">−</button>
                        &nbsp;${item.qty}&nbsp;
                        <button type="button" onclick="changeQty(${i}, 1)" style="border:none;background:#f1f5f9;width:20px;height:20px;border-radius:6px;">+</button>
                    </span>
                    <span class="line-total">Rs. ${(parseFloat(item.price) || 0) * item.qty}</span>
                </div>
            </div>
        </div>
    `).join("");

    const total = cartTotal();
    document.getElementById("summarySubtotal").textContent = "Rs. " + total;
    document.getElementById("summaryTotal").textContent = "Rs. " + total;
}

// ==============================================================
// FORM VALIDATION
// ==============================================================
function fieldOf(input){ return input.closest(".field"); }

function validateForm(){
    let valid = true;

    const required = [
        document.getElementById("fullName"),
        document.getElementById("phone"),
        document.getElementById("address"),
        document.getElementById("city")
    ];

    required.forEach(input => {
        const wrap = fieldOf(input);
        if(!input.value.trim()){
            wrap.classList.add("invalid");
            valid = false;
        } else {
            wrap.classList.remove("invalid");
        }
    });

    const phone = document.getElementById("phone");
    const phoneDigits = phone.value.replace(/\D/g, "");
    if(phoneDigits.length < 10){
        fieldOf(phone).classList.add("invalid");
        valid = false;
    }

    return valid;
}

document.querySelectorAll("#detailsForm input, #detailsForm textarea").forEach(el => {
    el.addEventListener("input", () => fieldOf(el)?.classList.remove("invalid"));
});

// ==============================================================
// OPTIONAL: PINPOINT LOCATION (Leaflet + OpenStreetMap, no API key)
// ==============================================================
function initMapAt(lat, lng){
    if(leafletMap){
        leafletMap.setView([lat, lng], 16);
        leafletMarker.setLatLng([lat, lng]);
        return;
    }

    leafletMap = L.map("mapEl").setView([lat, lng], 16);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap"
    }).addTo(leafletMap);

    leafletMarker = L.marker([lat, lng], { draggable: true }).addTo(leafletMap);
    leafletMarker.on("dragend", () => {
        const pos = leafletMarker.getLatLng();
        pickedLocation = { lat: pos.lat, lng: pos.lng };
        markLocationAttached();
    });

    leafletMap.on("click", (e) => {
        leafletMarker.setLatLng(e.latlng);
        pickedLocation = { lat: e.latlng.lat, lng: e.latlng.lng };
        markLocationAttached();
    });
}

function markLocationAttached(){
    document.getElementById("locationTag").style.display = "inline-flex";
}

document.getElementById("locateBtn").addEventListener("click", () => {
    const picker = document.getElementById("mapPicker");
    const isOpen = picker.style.display !== "none";

    if(isOpen){
        picker.style.display = "none";
        return;
    }

    picker.style.display = "block";

    const fallback = { lat: 24.8607, lng: 67.0011 }; // Karachi, used only if geolocation is unavailable

    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude, lng = pos.coords.longitude;
                pickedLocation = { lat, lng };
                setTimeout(() => { initMapAt(lat, lng); markLocationAttached(); leafletMap.invalidateSize(); }, 50);
            },
            () => { setTimeout(() => { initMapAt(fallback.lat, fallback.lng); leafletMap.invalidateSize(); }, 50); }
        );
    } else {
        setTimeout(() => { initMapAt(fallback.lat, fallback.lng); leafletMap.invalidateSize(); }, 50);
    }
});

document.getElementById("clearLocationBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    pickedLocation = null;
    document.getElementById("locationTag").style.display = "none";
    document.getElementById("mapPicker").style.display = "none";
});

// ==============================================================
// ORDER OBJECT
// ==============================================================
function generateFallbackOrderId(){
    // Only used if the sheet couldn't be reached to assign a real one.
    const stamp = Date.now().toString().slice(-6);
    const rand = Math.floor(10 + Math.random() * 89);
    return "STX" + stamp + rand;
}

function buildOrder(){
    return {
        id: null, // filled in after the sheet assigns the next order id
        date: new Date(),
        customer: {
            name: document.getElementById("fullName").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            address: document.getElementById("address").value.trim(),
            city: document.getElementById("city").value.trim(),
            notes: document.getElementById("notes").value.trim(),
            location: pickedLocation ? { ...pickedLocation } : null
        },
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            qty: item.qty,
            price: parseFloat(item.price) || 0
        })),
        total: cartTotal()
    };
}

// A single combined message field for WhatsApp/invoice/sheet: the
// user's note plus a Google Maps link if they dropped a pin.
function buildUserMessage(order){
    let msg = order.customer.notes || "";
    if(order.customer.location){
        const { lat, lng } = order.customer.location;
        const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
        msg = msg ? `${msg}\nPin: ${mapsLink}` : `Pin: ${mapsLink}`;
    }
    return msg;
}

// ==============================================================
// INVOICE (PDF) — generated with jsPDF, saved straight to device
// ==============================================================
function buildInvoicePdf(order){
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 48;

    // Header band
    doc.setFillColor(15, 118, 110);
    doc.rect(0, 0, pageWidth, 96, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("StorixPK", marginX, 46);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("support@storix.live   |   +92 342 8453606   |   storix.live", marginX, 66);

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", pageWidth - marginX, 46, { align: "right" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(order.id, pageWidth - marginX, 64, { align: "right" });
    doc.text(order.date.toLocaleDateString() + " " + order.date.toLocaleTimeString(), pageWidth - marginX, 78, { align: "right" });

    // Bill-to block
    let y = 132;
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Bill To", marginX, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    y += 16;
    doc.text(order.customer.name, marginX, y); y += 14;
    doc.text(order.customer.phone, marginX, y); y += 14;
    const addressLine = `${order.customer.address}, ${order.customer.city}`;
    const addressWrapped = doc.splitTextToSize(addressLine, 260);
    doc.text(addressWrapped, marginX, y);
    y += addressWrapped.length * 14;
    const userMessage = buildUserMessage(order);
    if(userMessage){
        const notesWrapped = doc.splitTextToSize("Note: " + userMessage, 260);
        doc.text(notesWrapped, marginX, y);
        y += notesWrapped.length * 14;
    }

    // Payment block (right aligned)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("Payment", pageWidth - marginX, 132, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.text("Cash on Delivery", pageWidth - marginX, 148, { align: "right" });
    doc.setTextColor(15, 118, 110);
    doc.setFont("helvetica", "bold");
    doc.text("Free Delivery", pageWidth - marginX, 164, { align: "right" });

    y = Math.max(y, 190) + 20;

    // Table header
    doc.setFillColor(236, 253, 245);
    doc.rect(marginX, y, pageWidth - marginX * 2, 26, "F");
    doc.setTextColor(15, 118, 110);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Item", marginX + 10, y + 17);
    doc.text("Qty", pageWidth - marginX - 190, y + 17, { align: "right" });
    doc.text("Price", pageWidth - marginX - 100, y + 17, { align: "right" });
    doc.text("Total", pageWidth - marginX - 10, y + 17, { align: "right" });
    y += 26;

    // Table rows
    doc.setFont("helvetica", "normal");
    doc.setTextColor(55, 65, 81);
    order.items.forEach((item, i) => {
        if(y > 720){ doc.addPage(); y = 60; }
        if(i % 2 === 1){
            doc.setFillColor(248, 250, 252);
            doc.rect(marginX, y, pageWidth - marginX * 2, 24, "F");
        }
        const nameWrapped = doc.splitTextToSize(item.name, 230);
        doc.text(nameWrapped[0], marginX + 10, y + 16);
        doc.text(String(item.qty), pageWidth - marginX - 190, y + 16, { align: "right" });
        doc.text("Rs. " + item.price, pageWidth - marginX - 100, y + 16, { align: "right" });
        doc.text("Rs. " + (item.price * item.qty), pageWidth - marginX - 10, y + 16, { align: "right" });
        y += 24;
    });

    y += 10;
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 24;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.text("Subtotal", pageWidth - marginX - 100, y, { align: "right" });
    doc.text("Rs. " + order.total, pageWidth - marginX - 10, y, { align: "right" });
    y += 18;
    doc.text("Delivery", pageWidth - marginX - 100, y, { align: "right" });
    doc.setTextColor(15, 118, 110);
    doc.text("FREE", pageWidth - marginX - 10, y, { align: "right" });
    y += 22;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(15, 118, 110);
    doc.text("Total Due", pageWidth - marginX - 100, y, { align: "right" });
    doc.text("Rs. " + order.total, pageWidth - marginX - 10, y, { align: "right" });

    y += 50;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text("Thank you for shopping with StorixPK. Pay in cash when your order is delivered.", marginX, y);

    return doc;
}

// ==============================================================
// WHATSAPP HELPERS
// ==============================================================
function buildWhatsappMessage(order){
    const lines = [
        `*New Order — ${order.id}*`,
        "",
        `Name: ${order.customer.name}`,
        `Phone: ${order.customer.phone}`,
        `Address: ${order.customer.address}, ${order.customer.city}`,
    ];
    const userMessage = buildUserMessage(order);
    if(userMessage) lines.push(`Note: ${userMessage}`);
    lines.push("", "*Items:*");
    order.items.forEach(item => {
        lines.push(`• ${item.name} x${item.qty} — Rs. ${item.price * item.qty}`);
    });
    lines.push("", `*Total: Rs. ${order.total}* (Cash on Delivery)`);
    return lines.join("\n");
}

function openWhatsappMessage(order){
    const text = encodeURIComponent(buildWhatsappMessage(order));
    window.open(`https://wa.me/${STORE_WHATSAPP}?text=${text}`, "_blank");
}

async function tryShareInvoiceFile(pdfDoc, order){
    try{
        const blob = pdfDoc.output("blob");
        const file = new File([blob], `StorixPK-Invoice-${order.id}.pdf`, { type: "application/pdf" });

        if(navigator.canShare && navigator.canShare({ files: [file] })){
            await navigator.share({
                files: [file],
                title: `StorixPK Invoice ${order.id}`,
                text: `Invoice for order ${order.id} — Rs. ${order.total}`
            });
            return true;
        }
    } catch(err){
        console.warn("Native share unavailable or cancelled:", err);
    }
    return false;
}

// ==============================================================
// GOOGLE SHEETS — assigns the next order id and logs one row per
// item: order id, product id, product name, quantity, unit price,
// buyer name, buyer number, payment method, user message, delivery status
// ==============================================================
async function submitOrderToSheet(order){
    const payload = {
        date: order.date.toISOString(),
        buyerName: order.customer.name,
        buyerPhone: order.customer.phone,
        address: `${order.customer.address}, ${order.customer.city}`,
        paymentMethod: "Cash on Delivery",
        userMessage: buildUserMessage(order),
        deliveryStatus: "Pending",
        items: order.items.map(item => ({
            productId: item.id,
            productName: item.name,
            quantity: item.qty,
            unitPrice: item.price
        }))
    };

    if(!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes("PASTE_YOUR")){
        console.info("Apps Script URL not configured — skipping sheet update.");
        return null;
    }

    try{
        const res = await fetch(APPS_SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" }, // avoids a CORS preflight
            body: JSON.stringify(payload)
        });

        const raw = await res.text();
        let data;
        try{
            data = JSON.parse(raw);
        } catch(parseErr){
            // The Apps Script URL returned something that isn't JSON — usually
            // an HTML error/login page, which means the deployment itself is
            // misconfigured (not redeployed, access not set to "Anyone", wrong
            // function name, etc.) rather than a network problem.
            console.error("Apps Script did not return JSON. Raw response:", raw);
            showSheetWarning("Order wasn't saved to the sheet (bad response from the script). Your invoice/WhatsApp still went through.");
            return null;
        }

        if(!data || !data.orderId){
            console.error("Apps Script response missing orderId:", data);
            showSheetWarning("Order wasn't saved to the sheet (no order id returned). Your invoice/WhatsApp still went through.");
            return null;
        }

        return data.orderId;
    } catch(err){
        console.warn("Sheet order submit failed, using a locally generated order id instead:", err);
        showSheetWarning("Couldn't reach the order sheet, so it wasn't logged there. Your invoice/WhatsApp still went through.");
        return null;
    }
}

function showSheetWarning(message){
    let banner = document.getElementById("sheetWarningBanner");
    if(!banner){
        banner = document.createElement("div");
        banner.id = "sheetWarningBanner";
        banner.className = "sheet-warning-banner";
        document.querySelector(".checkout-page")?.prepend(banner);
    }
    banner.innerHTML = `<i class="fas fa-triangle-exclamation"></i> ${message}`;
    banner.style.display = "flex";
}

// ==============================================================
// PLACE ORDER FLOW
// ==============================================================
async function placeOrder(){
    if(cart.length === 0) return;
    if(!validateForm()){
        document.querySelector(".field.invalid")?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
    }

    const btn = document.getElementById("placeOrderBtn");
    btn.disabled = true;
    btn.querySelector(".btn-label").style.display = "none";
    btn.querySelector(".btn-loading").style.display = "inline-flex";

    const order = buildOrder();

    // 1) Ask the sheet to assign the next sequential order id and log the order.
    //    Falls back to a locally generated id if the sheet can't be reached,
    //    so the customer's flow never gets blocked.
    const assignedId = await submitOrderToSheet(order);
    order.id = assignedId || generateFallbackOrderId();

    // 2) Generate the invoice and download it to the device
    const pdfDoc = buildInvoicePdf(order);
    pdfDoc.save(`StorixPK-Invoice-${order.id}.pdf`);

    // 3) Open WhatsApp with the order details pre-filled
    openWhatsappMessage(order);

    // 4) Best-effort: share the same invoice file via the device share sheet
    tryShareInvoiceFile(pdfDoc, order);

    // Keep the last invoice + order in memory so "Download Again" works
    window._lastOrder = order;
    window._lastPdf = pdfDoc;

    // Clear the cart and show the confirmation
    cart = [];
    saveCart();
    updateCartUI();

    showSuccess(order);
}

function showSuccess(order){
    document.getElementById("checkoutForm").style.display = "none";
    document.getElementById("stepPill3").classList.add("active");

    const state = document.getElementById("successState");
    state.style.display = "block";
    state.scrollIntoView({ behavior: "smooth", block: "start" });

    document.getElementById("successOrderId").textContent = "#" + order.id;
    document.getElementById("successTotal").textContent = "Rs. " + order.total;

    document.getElementById("successItems").innerHTML = order.items.map(item => `
        <div class="summary-row">
            <span>${item.name} x${item.qty}</span>
            <span>Rs. ${item.price * item.qty}</span>
        </div>
    `).join("");
}

document.getElementById("reDownloadBtn").onclick = () => {
    if(window._lastPdf && window._lastOrder){
        window._lastPdf.save(`StorixPK-Invoice-${window._lastOrder.id}.pdf`);
    }
};

document.getElementById("reWhatsappBtn").onclick = () => {
    if(window._lastOrder) openWhatsappMessage(window._lastOrder);
};

document.getElementById("placeOrderBtn").onclick = placeOrder;

// ==============================================================
// INIT
// ==============================================================
function init(){
    document.getElementById("footerYear").textContent = new Date().getFullYear();

    updateCartUI();

    if(cart.length === 0){
        document.getElementById("emptyCartState").style.display = "flex";
        document.getElementById("checkoutForm").style.display = "none";
        document.querySelector(".checkout-steps").style.display = "none";
        return;
    }

    renderSummary();
}

init();
