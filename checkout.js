// ==============================================================
// CONFIG — edit these two values before going live
// ==============================================================

// WhatsApp number that receives the order message (no + or spaces)
const STORE_WHATSAPP = "923428453606";

// Google Apps Script Web App URL that updates the product sheet
// (decreases "In Stock", increases "Sold Quantity"/"Total Sold",
// and logs the order). See apps-script-setup.md + Code.gs for the
// exact script to deploy against your product sheet
// (spreadsheet id: 1Z516TmqefcNcyGVPgTamh_OpNXjzO_s84udPnYN3new).
// Leave the placeholder in place and the site will simply skip the
// sheet update step — everything else still works.
const APPS_SCRIPT_URL = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";

// ==============================================================
// STATE
// ==============================================================
let cart = JSON.parse(localStorage.getItem("cart")) || [];

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
// ORDER OBJECT
// ==============================================================
function generateOrderId(){
    const stamp = Date.now().toString().slice(-6);
    const rand = Math.floor(10 + Math.random() * 89);
    return "STX" + stamp + rand;
}

function buildOrder(){
    return {
        id: generateOrderId(),
        date: new Date(),
        customer: {
            name: document.getElementById("fullName").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            email: document.getElementById("email").value.trim(),
            address: document.getElementById("address").value.trim(),
            city: document.getElementById("city").value.trim(),
            postal: document.getElementById("postal").value.trim(),
            notes: document.getElementById("notes").value.trim()
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
    if(order.customer.email){ doc.text(order.customer.email, marginX, y); y += 14; }
    const addressLine = `${order.customer.address}, ${order.customer.city}${order.customer.postal ? " " + order.customer.postal : ""}`;
    const addressWrapped = doc.splitTextToSize(addressLine, 260);
    doc.text(addressWrapped, marginX, y);
    y += addressWrapped.length * 14;
    if(order.customer.notes){
        const notesWrapped = doc.splitTextToSize("Note: " + order.customer.notes, 260);
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
        `Address: ${order.customer.address}, ${order.customer.city}${order.customer.postal ? " " + order.customer.postal : ""}`,
    ];
    if(order.customer.notes) lines.push(`Notes: ${order.customer.notes}`);
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
// GOOGLE SHEETS — decrease stock, increase sold, log the order
// ==============================================================
async function updateSheetStock(order){
    if(!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes("PASTE_YOUR")){
        console.info("Apps Script URL not configured — skipping sheet stock update.");
        return;
    }

    const payload = {
        orderId: order.id,
        date: order.date.toISOString(),
        customerName: order.customer.name,
        customerPhone: order.customer.phone,
        total: order.total,
        items: order.items.map(item => ({ id: item.id, qty: item.qty }))
    };

    try{
        // Apps Script web apps don't return CORS headers by default, so the
        // response can't be read here — this is a fire-and-forget call, the
        // script still runs and updates the sheet server-side.
        await fetch(APPS_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
        });
    } catch(err){
        console.warn("Sheet stock update failed:", err);
    }
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

    // 1) Generate the invoice and download it to the device
    const pdfDoc = buildInvoicePdf(order);
    pdfDoc.save(`StorixPK-Invoice-${order.id}.pdf`);

    // 2) Open WhatsApp with the order details pre-filled
    openWhatsappMessage(order);

    // 3) Best-effort: share the same invoice file via the device share sheet
    tryShareInvoiceFile(pdfDoc, order);

    // 4) Best-effort: update stock / sold counts on the product sheet
    updateSheetStock(order);

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
    document.getElementById("successPhoneNote").textContent = STORE_WHATSAPP ? "" : "";
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
