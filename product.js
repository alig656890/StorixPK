// ==============================
// SHEET URLS
// ==============================
// NOTE ON "HIDING" THESE: this runs in the browser, so anyone who opens
// DevTools → Network can always see which URL the page actually requests
// — that's true no matter how the source code looks. Base64 here just
// stops the link being readable at a glance in "view source" or a quick
// text search; it is NOT real security. If you need the sheet ID to be
// genuinely invisible to visitors, the only real fix is routing through
// your own backend/proxy (e.g. a small Cloudflare Worker or Google Apps
// Script Web App) that fetches the sheet server-side and returns JSON —
// then the browser only ever sees your proxy's URL.
function decodeUrl(b64){
    return atob(b64);
}

const sheet1URL = decodeUrl("aHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20vc3ByZWFkc2hlZXRzL2QvMVo1MTZUbXFlZmNOY3lHVlBnVGFtaF9PcE5YanpPX3M4NHVkUG5ZTjNuZXcvZ3Zpei90cT90cXg9b3V0OmNzdg==");
const mediaSheetURL = decodeUrl("aHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20vc3ByZWFkc2hlZXRzL2QvMTBvQWxzVDNJVnVKOGNaTk5lRUt5MTBaTmJTSE80S0NrQlR3a1kyMThiU2svZ3Zpei90cT90cXg9b3V0OmNzdg==");

// ==============================
// GLOBAL STATE
// ==============================
const urlParams = new URLSearchParams(window.location.search);
const selectedProductId = urlParams.get("id");

let allRows = [];          // every product row, in sheet order
let currentProduct = null;
let currentIndex = -1;

let cart = JSON.parse(localStorage.getItem("cart")) || [];

const media = {
    images: [],
    videos: [],
    youtube: [],
    model3d: []
};

// ==============================
// DOM ELEMENTS
// ==============================
const imageTab = document.getElementById("imageTab");
const videoTab = document.getElementById("videoTab");
const youtubeTab = document.getElementById("youtubeTab");
const modelTab = document.getElementById("modelTab");

const imageViewer = document.getElementById("imageViewer");
const videoViewer = document.getElementById("videoViewer");
const youtubeViewer = document.getElementById("youtubeViewer");
const modelViewer = document.getElementById("modelViewer");
const viewerEmpty = document.getElementById("viewerEmpty");
const viewerEmptyText = document.getElementById("viewerEmptyText");

const thumbnailStrip = document.getElementById("thumbnailStrip");

// ==============================
// CSV PARSER (quote-aware)
// ==============================
function parseCSVRow(row){
    return row
        .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
        .map(col => col.replace(/^"|"$/g, "").trim());
}

// ==============================
// LOAD PRODUCTS
// Sheet columns (0-indexed):
// 0 Type  1 Picture  2 name  3 short description  4 Price With Discount
// 5 Original Price  6 Product Unique ID  7 long description  8 Status
// 9 Seller No  10 Total Purchased  11 Sold Quantity  12 In Stock
// 13 Total Sold  14 Rating  15 Review Count  16 Size  17 Material
// 18 Shipping Cost  19 Limited Stock
// ==============================
async function loadProducts(){
    try{
        const response = await fetch(sheet1URL);
        if(!response.ok) throw new Error("Unable to fetch product sheet.");

        const csv = await response.text();
        const rows = csv.split("\n").slice(1);

        rows.forEach(row => {
            if(!row.trim()) return;

            const cols = parseCSVRow(row);
            const id = cols[6];
            if(!id) return;

            allRows.push({
                category: cols[0] || "",
                img: cols[1] || "",
                name: cols[2] || "",
                desc: cols[3] || "",
                price: parseFloat(cols[4]) || 0,
                originalPrice: parseFloat(cols[5]) || 0,
                id: id,
                longDesc: cols[7] || "",
                status: cols[8] || "",
                sellerNo: cols[9] || "",
                totalPurchased: parseInt(cols[10]) || 0,
                soldQty: parseInt(cols[11]) || 0,
                inStock: parseInt(cols[12]) || 0,
                totalSold: parseInt(cols[13]) || 0,
                rating: parseFloat(cols[14]) || 0,
                reviewCount: parseInt(cols[15]) || 0,
                size: cols[16] || "",
                material: cols[17] || "",
                shippingCost: cols[18] || "",
                limitedStock: cols[19] || ""
            });
        });

        currentIndex = allRows.findIndex(p => p.id === selectedProductId);
        currentProduct = currentIndex !== -1 ? allRows[currentIndex] : null;

    } catch(error){
        console.error("Error loading products:", error);
    }
}

// ==============================
// LOAD MEDIA (ID, File type, Link)
// ==============================
async function loadMedia(){
    try{
        media.images = [];
        media.videos = [];
        media.youtube = [];
        media.model3d = [];

        const response = await fetch(mediaSheetURL);
        const csv = await response.text();
        const rows = csv.split("\n").slice(1);

        rows.forEach(row => {
            if(!row.trim()) return;

            const cols = parseCSVRow(row);
            if(!cols.length || !cols[0]) return;
            if(cols[0].trim() !== selectedProductId.trim()) return;

            const type = (cols[1] || "").trim().toLowerCase();
            const url = (cols[2] || "").trim();
            if(!url) return;

            if(type === "image") media.images.push(url);
            else if(type === "video") media.videos.push(url);
            else if(type === "youtube") media.youtube.push(url);
            else if(type === "model") media.model3d.push(url);
        });

        if(media.images.length === 0 && currentProduct?.img){
            media.images.push(currentProduct.img);
        }

    } catch(error){
        console.error("Error loading media:", error);
    }
}

// ==============================
// RENDER PRODUCT DETAILS
// ==============================
function renderProduct(){

    document.getElementById("productName").textContent = currentProduct.name;
    document.getElementById("salePrice").textContent = "Rs. " + currentProduct.price;

    const originalEl = document.getElementById("originalPrice");
    const discountEl = document.getElementById("discountPercent");

    if(currentProduct.originalPrice > currentProduct.price){
        originalEl.textContent = "Rs. " + currentProduct.originalPrice;
        const pct = Math.round(((currentProduct.originalPrice - currentProduct.price) / currentProduct.originalPrice) * 100);
        discountEl.textContent = pct + "% OFF";
        discountEl.style.display = "inline-block";
    } else {
        originalEl.textContent = "";
        discountEl.style.display = "none";
    }

    document.getElementById("shortDescription").textContent = currentProduct.desc;
    document.getElementById("productId").textContent = currentProduct.id;
    document.getElementById("soldQty").textContent = currentProduct.soldQty;

    const catBadge = document.getElementById("categoryBadge");
    catBadge.textContent = currentProduct.category;

    // stock badge
    const stockEl = document.getElementById("stockStatus");
    if(currentProduct.inStock > 0){
        stockEl.textContent = "In Stock";
        stockEl.classList.remove("out");
    } else {
        stockEl.textContent = "Out of Stock";
        stockEl.classList.add("out");
    }

    // rating stars
    const starEl = document.getElementById("starRating");
    const rounded = Math.round(currentProduct.rating || 0);
    starEl.textContent = "★".repeat(Math.min(5, Math.max(0, rounded))) + "☆".repeat(5 - Math.min(5, Math.max(0, rounded)));

    document.getElementById("reviewCount").textContent =
        currentProduct.reviewCount > 0 ? `(${currentProduct.reviewCount} Reviews)` : "(No reviews yet)";

    renderMeta();
    renderSpecs();
    renderLongDescription();
    renderRelatedProducts();
}

function renderMeta(){
    const meta = document.getElementById("productMeta");
    meta.innerHTML = `
        <div><strong>SKU</strong><span>${currentProduct.id}</span></div>
        <div><strong>Category</strong><span style="text-transform:capitalize;">${currentProduct.category}</span></div>
    `;
}

function renderSpecs(){
    const table = document.getElementById("specTable");
    const rows = [
        ["Category", currentProduct.category],
        ["Size", currentProduct.size],
        ["Material", currentProduct.material],
        ["Shipping Cost", currentProduct.shippingCost ? "Rs. " + currentProduct.shippingCost : ""],
        ["Stock Available", currentProduct.inStock],
        ["Limited Stock", currentProduct.limitedStock],
        ["Total Sold", currentProduct.totalSold]
    ].filter(([, value]) => value !== "" && value !== null && value !== undefined);

    table.innerHTML = rows.length
        ? rows.map(([label, value]) => `<tr><td>${label}</td><td>${value}</td></tr>`).join("")
        : `<tr><td colspan="2" style="color:#94a3b8;">No specifications listed for this product.</td></tr>`;
}

function renderLongDescription(){
    const el = document.getElementById("longDescription");
    el.textContent = currentProduct.longDesc || currentProduct.desc || "No description available.";
}

function renderRelatedProducts(){
    const container = document.getElementById("relatedProducts");
    const section = document.getElementById("relatedSection");

    const related = allRows.filter(p =>
        p.category === currentProduct.category && p.id !== currentProduct.id
    ).slice(0, 4);

    if(related.length === 0){
        section.style.display = "none";
        return;
    }

    section.style.display = "block";

    container.innerHTML = related.map(item => {
        const original = item.originalPrice > item.price ? item.originalPrice : Math.round(item.price * 1.08);
        const discount = original > item.price ? Math.round(((original - item.price) / original) * 100) : 0;

        return `
        <div class="col-6 col-md-3 mb-3">
            <div class="product-card" style="cursor:pointer;" onclick="window.location.href='product.html?id=${item.id}'">
                <div class="product-image-box">
                    ${discount > 0 ? `<div class="discount-badge"><span class="discount-percent">${discount}%</span><span class="discount-text">OFF</span></div>` : ""}
                    <img src="${item.img}" loading="lazy">
                </div>
                <div class="product-content">
                    <h6>${item.name}</h6>
                    <div class="price-area">
                        <span class="old-price">Rs. ${original}</span>
                        <span class="new-price">Rs. ${item.price}</span>
                    </div>
                </div>
            </div>
        </div>`;
    }).join("");
}

// ==============================
// MEDIA VIEWER
// ==============================
function hideAllViewers(){
    imageViewer.style.display = "none";
    videoViewer.style.display = "none";
    youtubeViewer.style.display = "none";
    modelViewer.style.display = "none";
    viewerEmpty.style.display = "none";

    videoViewer.pause();
    videoViewer.removeAttribute("src");
    youtubeViewer.src = "";
}

function showEmpty(text){
    viewerEmpty.style.display = "flex";
    viewerEmptyText.textContent = text;
}

function setActiveTab(activeBtn){
    document.querySelectorAll(".media-btn").forEach(btn => btn.classList.remove("active"));
    activeBtn.classList.add("active");
}

function renderImages(){
    hideAllViewers();
    thumbnailStrip.innerHTML = "";

    if(media.images.length === 0){
        showEmpty("No images available for this product.");
        return;
    }

    imageViewer.style.display = "block";
    imageViewer.src = media.images[0];

    media.images.forEach((url, i) => {
        const img = document.createElement("img");
        img.src = url;
        img.className = "thumb" + (i === 0 ? " active" : "");
        img.onclick = () => {
            imageViewer.src = url;
            document.querySelectorAll(".thumb").forEach(t => t.classList.remove("active"));
            img.classList.add("active");
        };
        thumbnailStrip.appendChild(img);
    });
}

function renderVideos(){
    hideAllViewers();
    thumbnailStrip.innerHTML = "";

    if(media.videos.length === 0){
        showEmpty("No videos available for this product.");
        return;
    }

    videoViewer.style.display = "block";
    videoViewer.src = media.videos[0];

    media.videos.forEach((url, i) => {
        const btn = document.createElement("div");
        btn.className = "thumb" + (i === 0 ? " active" : "");
        btn.style.cssText = "display:flex;align-items:center;justify-content:center;background:#0f766e;color:#fff;font-weight:700;font-size:12px;";
        btn.textContent = "Video " + (i + 1);
        btn.onclick = () => {
            videoViewer.src = url;
            document.querySelectorAll(".thumb").forEach(t => t.classList.remove("active"));
            btn.classList.add("active");
        };
        thumbnailStrip.appendChild(btn);
    });
}

function youtubeId(url){
    const match = url.match(/(?:youtu\.be\/|v=|embed\/)([a-zA-Z0-9_-]{6,})/);
    return match ? match[1] : url.split("/").pop();
}

function renderYoutube(){
    hideAllViewers();
    thumbnailStrip.innerHTML = "";

    if(media.youtube.length === 0){
        showEmpty("No YouTube videos linked for this product.");
        return;
    }

    const firstId = youtubeId(media.youtube[0]);
    youtubeViewer.style.display = "block";
    youtubeViewer.src = "https://www.youtube.com/embed/" + firstId;

    media.youtube.forEach((url, i) => {
        const id = youtubeId(url);
        const img = document.createElement("img");
        img.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
        img.className = "thumb" + (i === 0 ? " active" : "");
        img.onclick = () => {
            youtubeViewer.src = "https://www.youtube.com/embed/" + id;
            document.querySelectorAll(".thumb").forEach(t => t.classList.remove("active"));
            img.classList.add("active");
        };
        thumbnailStrip.appendChild(img);
    });
}

function renderModel(){
    hideAllViewers();
    thumbnailStrip.innerHTML = "";

    if(media.model3d.length === 0){
        showEmpty("3D view is not available for this product yet.");
        return;
    }

    modelViewer.style.display = "block";
    modelViewer.setAttribute("src", media.model3d[0]);
}

imageTab.onclick = () => { setActiveTab(imageTab); renderImages(); };
videoTab.onclick = () => { setActiveTab(videoTab); renderVideos(); };
youtubeTab.onclick = () => { setActiveTab(youtubeTab); renderYoutube(); };
modelTab.onclick = () => { setActiveTab(modelTab); renderModel(); };

// ==============================
// PRODUCT NAVIGATION
// ==============================
function goToId(id){
    window.location.href = `product.html?id=${encodeURIComponent(id)}`;
}

function nextProduct(){
    if(currentIndex !== -1 && currentIndex < allRows.length - 1){
        goToId(allRows[currentIndex + 1].id);
    }
}

function previousProduct(){
    if(currentIndex > 0){
        goToId(allRows[currentIndex - 1].id);
    }
}

function goToProductId(){
    const input = document.getElementById("productIdInput");
    const target = input.value.trim();
    if(!target) return;

    const match = allRows.find(p => p.id.toLowerCase() === target.toLowerCase());

    if(match){
        goToId(match.id);
    } else {
        input.style.borderColor = "#dc2626";
        input.parentElement.style.boxShadow = "0 0 0 3px rgba(220,38,38,.15)";
        setTimeout(() => {
            input.style.borderColor = "";
            input.parentElement.style.boxShadow = "";
        }, 900);
    }
}

// ==============================
// QUANTITY STEPPER
// ==============================
document.getElementById("minusQty").onclick = () => {
    const qtyInput = document.getElementById("qty");
    qtyInput.value = Math.max(1, (parseInt(qtyInput.value) || 1) - 1);
};

document.getElementById("plusQty").onclick = () => {
    const qtyInput = document.getElementById("qty");
    qtyInput.value = (parseInt(qtyInput.value) || 1) + 1;
};

// ==============================
// CART
// ==============================
function updateCartUI(){
    let totalQty = 0;
    cart.forEach(item => totalQty += item.qty);

    const cartCount = document.getElementById("cartCount");
    if(cartCount) cartCount.textContent = totalQty;
}

function saveCart(){
    localStorage.setItem("cart", JSON.stringify(cart));
}

function addToCart(product, qty){
    qty = qty || 1;
    let existing = cart.find(p => p.id === product.id);

    if(existing){
        existing.qty += qty;
    } else {
        cart.push({ ...product, qty });
    }

    saveCart();
    updateCartUI();
    renderCart();
}

function changeQty(index, change){
    if(!cart[index]) return;
    cart[index].qty += change;
    if(cart[index].qty <= 0) cart.splice(index, 1);
    saveCart();
    updateCartUI();
    renderCart();
}

function removeItem(index){
    cart.splice(Number(index), 1);
    saveCart();
    updateCartUI();
    renderCart();
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
    if(cartBox.style.display === "block" && !cartBox.contains(e.target) && !cartBtn.contains(e.target)){
        cartBox.style.display = "none";
    }
});

function goCheckout(){
    if(cart.length === 0){
        alert("Your cart is empty!");
        return;
    }
    window.location.href = "checkout.html";
}

function placeOrder(){
    if(cart.length === 0){
        alert("Your cart is empty!");
        return;
    }
    saveCart();
    window.location.href = "checkout.html";
}

document.getElementById("addToCartBtn").onclick = () => {
    if(!currentProduct) return;
    const qty = parseInt(document.getElementById("qty").value) || 1;
    addToCart(currentProduct, qty);
};

document.getElementById("buyNowBtn").onclick = () => {
    if(!currentProduct) return;
    const qty = parseInt(document.getElementById("qty").value) || 1;
    addToCart(currentProduct, qty);
    window.location.href = "checkout.html";
};

// ==============================
// INITIALIZE
// ==============================
async function init(){

    updateCartUI();

    document.getElementById("footerYear").textContent = new Date().getFullYear();

    await loadProducts();

    if(!currentProduct){
        document.getElementById("productLoader").style.display = "none";
        document.getElementById("productNotFound").style.display = "flex";
        return;
    }

    await loadMedia();

    renderProduct();
    renderImages();

    document.getElementById("productLoader").style.display = "none";
    document.getElementById("productContent").style.display = "block";
}

init();
