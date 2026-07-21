let cart = JSON.parse(localStorage.getItem("cart")) || [];
updateCartUI();

const sheetURL = "https://docs.google.com/spreadsheets/d/1Z516TmqefcNcyGVPgTamh_OpNXjzO_s84udPnYN3new/gviz/tq?tqx=out:csv";

let allData = {};
let currentItems = [];
let index = 0;

// ---- Category carousel state ----
let categoryOrder = [];      // e.g. ["all","electronics","fashion","home"]
let activeCategory = "all";

// ---- Most-sold slider state ----
let msItems = [];
let msIndex = 0;

const slidesContainer = document.getElementById("slides");
const dotsContainer = document.getElementById("dots");
const sidebar = document.querySelector(".sidebar");

function preloadImages(items){
    items.forEach(item => {
        const img = new Image();
        img.loading = "lazy";
        img.decoding = "async";
        img.src = item.img;
    });
}

// FETCH DATA
fetch(sheetURL)
.then(res => res.text())
.then(data => {
    const rows = data.split("\n").slice(1);
    rows.forEach(row => {
        if(!row.trim()) return;
        const cols = row.split(",");
        if(cols.length < 7) return;

        let category = (cols[0] || "").replace(/"/g,"").trim().toLowerCase();
        let img = (cols[1] || "").replace(/"/g,"").trim();
        let name = (cols[2] || "").replace(/"/g,"").trim();
        let desc = (cols[3] || "").replace(/"/g,"").trim();
        let price = (cols[4] || "").replace(/"/g,"").trim();
        let originalPrice = (cols[5] || "").replace(/"/g,"").trim();
        let productId = (cols[6] || "").replace(/"/g,"").trim();

        if(!productId){
            productId = name.toLowerCase().replace(/\s+/g,"-") + "-" + Date.now();
        }

        let totalPurchased = parseInt(cols[7] || 0);
        let soldQty = parseInt(cols[8] || 0);
        let inStock = parseInt(cols[9] || 0);
        let totalSold = parseInt(cols[10] || 0);

        if(!category || !img) return;

        if(!allData[category]) allData[category] = [];
        allData[category].push({
            type: category,
            img,
            name,
            desc,
            price,
            originalPrice,
            id: productId,
            totalPurchased,
            soldQty,
            inStock,
            totalSold
        });
    });

    createSidebar();
    renderAllProducts();
    createCategorySlider();
    createMostSoldPills();
    updateMostSold("all");
    populateFooter();
});

/* ==============================
   FOOTER
============================== */
function populateFooter(){
    const yearEl = document.getElementById("footerYear");
    if(yearEl) yearEl.innerText = new Date().getFullYear();

    const linksEl = document.getElementById("footerCategoryLinks");
    if(!linksEl) return;
    linksEl.innerHTML = "";
    Object.keys(allData).forEach(category => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = "#";
        a.innerText = category.charAt(0).toUpperCase() + category.slice(1);
        a.onclick = function(e){ e.preventDefault(); chooseCategory(category); window.scrollTo({top:0, behavior:"smooth"}); };
        li.appendChild(a);
        linksEl.appendChild(li);
    });
}

/* ==============================
   CATEGORY CAROUSEL (below Most Sold)
   A circular carousel: the active pill always sits centered, and every
   other pill is positioned by its shortest circular distance from it,
   so one arrow click slides the whole row by exactly one pill.
============================== */
let categoryPillEls = {};   // cat -> pill element
let activeCategoryIndex = 0;

function createCategorySlider(){
    const track = document.getElementById("categoryCarousel");
    track.innerHTML = "";
    categoryPillEls = {};
    categoryOrder = ["all", ...Object.keys(allData)];

    categoryOrder.forEach(cat => {
        const btn = document.createElement("button");
        btn.className = "category-pill" + (cat === "all" ? " active" : "");
        btn.dataset.cat = cat;
        btn.innerText = cat === "all" ? "All Products" : cat.charAt(0).toUpperCase() + cat.slice(1);
        btn.onclick = function(){ chooseCategory(cat); };
        track.appendChild(btn);
        categoryPillEls[cat] = btn;
    });

    activeCategory = "all";
    activeCategoryIndex = 0;
    positionCategoryPills();
    window.addEventListener("resize", positionCategoryPills);
}

// Places every pill relative to the active one using the shortest circular
// distance, so the whole row glides smoothly instead of jumping/reloading.
function positionCategoryPills(){
    const n = categoryOrder.length;
    if(n === 0) return;

    const spacing = window.innerWidth < 480 ? 92 : (window.innerWidth < 768 ? 114 : 152);

    categoryOrder.forEach((cat, idx) => {
        let raw = idx - activeCategoryIndex;
        while(raw > n / 2) raw -= n;
        while(raw <= -n / 2) raw += n;

        const el = categoryPillEls[cat];
        if(!el) return;

        const dist = Math.abs(raw);
        let scale, opacity;
        if(dist === 0){ scale = 1.18; opacity = 1; }
        else if(dist === 1){ scale = 0.92; opacity = 0.85; }
        else if(dist === 2){ scale = 0.8;  opacity = 0.5; }
        else if(dist === 3){ scale = 0.68; opacity = 0.25; }
        else { scale = 0.6; opacity = 0; }

        el.style.transform = `translate(-50%,-50%) translateX(${raw * spacing}px) scale(${scale})`;
        el.style.opacity = opacity;
        el.style.pointerEvents = dist > 3 ? "none" : "auto";
        el.style.zIndex = String(20 - dist);
        el.classList.toggle("active", raw === 0);
    });
}

// Compact pills inside the Most Sold section (also drive category selection)
function createMostSoldPills(){
    const wrap = document.getElementById("mostSoldCatPills");
    if(!wrap) return;
    wrap.innerHTML = "";

    const all = document.createElement("button");
    all.className = "ms-cat-pill active";
    all.dataset.cat = "all";
    all.innerText = "All";
    all.onclick = function(){ chooseCategory("all"); };
    wrap.appendChild(all);

    Object.keys(allData).forEach(category => {
        const btn = document.createElement("button");
        btn.className = "ms-cat-pill";
        btn.dataset.cat = category;
        btn.innerText = category.charAt(0).toUpperCase() + category.slice(1);
        btn.onclick = function(){ chooseCategory(category); };
        wrap.appendChild(btn);
    });
}

// Single source of truth for switching category anywhere in the UI
function chooseCategory(cat){
    const idx = categoryOrder.indexOf(cat);
    if(idx === -1) return;

    activeCategory = cat;
    activeCategoryIndex = idx;

    if(cat === "all"){
        renderAllProducts();
    } else {
        renderCategoryProducts(cat);
    }
    loadCategory(cat === "all" ? (categoryOrder[1] || "all") : cat);

    positionCategoryPills();
    syncSecondaryCategoryUI(cat);
    updateMostSold(cat);
}

// Keeps the mini pills + reset button in sync (the main carousel is handled
// by positionCategoryPills, which also toggles .active there)
function syncSecondaryCategoryUI(cat){
    document.querySelectorAll(".ms-cat-pill").forEach(p => {
        p.classList.toggle("active", p.dataset.cat === cat);
    });

    const resetBtn = document.getElementById("catResetBtn");
    if(resetBtn){
        resetBtn.classList.toggle("enabled", cat !== "all");
    }
}

// ❮ / ❯ arrows: step through categories one at a time, sliding the row
function moveCategory(direction){
    if(categoryOrder.length === 0) return;
    const idx = (activeCategoryIndex + direction + categoryOrder.length) % categoryOrder.length;
    chooseCategory(categoryOrder[idx]);
}

// Reset button next to the arrows — only active once a category is picked
function resetCategoryCarousel(){
    if(activeCategory === "all") return;
    chooseCategory("all");
}

/* ==============================
   MOST SOLD SLIDER (top 3 best sellers)
============================== */
function getTopSold(category){
    let items = [];
    if(!category || category === "all"){
        Object.keys(allData).forEach(c => { items = items.concat(allData[c]); });
    } else {
        items = allData[category] || [];
    }
    return [...items]
        .sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0))
        .slice(0, 3);
}

function updateMostSold(category){
    const titleEl = document.getElementById("mostSoldTitle");
    const label = (!category || category === "all")
        ? "Products"
        : category.charAt(0).toUpperCase() + category.slice(1);

    if(titleEl) titleEl.innerHTML = `Most Sold <span>${label}</span>`;

    msItems = getTopSold(category);
    msIndex = 0;
    renderMostSoldSlider();
}

function renderMostSoldSlider(){
    const track = document.getElementById("mostSoldTrack");
    const dots = document.getElementById("msDots");
    if(!track || !dots) return;

    track.innerHTML = "";
    dots.innerHTML = "";

    if(msItems.length === 0){
        track.innerHTML = `<div class="ms-empty">No sales recorded yet</div>`;
        return;
    }

    msItems.forEach((item, i) => {
        const price = parseFloat(item.price) || 0;

        const slide = document.createElement("div");
        slide.className = "ms-slide";
        slide.innerHTML = `
            <div class="ms-slide-bg" style="background-image:url('${item.img}')"></div>
            <div class="ms-slide-image">
                <img src="${item.img}" loading="lazy" decoding="async">
            </div>
            <div class="ms-slide-info">
                <span class="ms-rank">#${i + 1} Best Seller</span>
                <h4>${item.name || ""}</h4>
                <p>${item.desc || ""}</p>
                <div class="ms-price">Rs. ${price}</div>
                <button class="shop-btn" onclick='addToCart(${JSON.stringify(item)})'>
                    <i class="fas fa-shopping-cart me-1"></i> Add to Cart
                </button>
            </div>
        `;
        track.appendChild(slide);

        const d = document.createElement("span");
        d.onclick = () => { msIndex = i; updateMsSlider(); };
        dots.appendChild(d);
    });

    updateMsSlider();
}

function updateMsSlider(){
    const track = document.getElementById("mostSoldTrack");
    const dots = document.getElementById("msDots");
    if(!track) return;
    track.style.transform = `translateX(-${msIndex * 100}%)`;
    [...dots.children].forEach((d, i) => d.classList.toggle("active", i === msIndex));
}

function msNextSlide(){
    if(msItems.length === 0) return;
    msIndex = (msIndex + 1) % msItems.length;
    updateMsSlider();
}

function msPrevSlide(){
    if(msItems.length === 0) return;
    msIndex = (msIndex - 1 + msItems.length) % msItems.length;
    updateMsSlider();
}

// Auto-advance the most-sold slider
setInterval(() => {
    if(msItems.length > 1) msNextSlide();
}, 5000);

/* ==============================
   DELIVERY MODAL
============================== */
function showDeliveryInfo(){
    document.getElementById("deliveryModal").style.display = "flex";
}
function closeDeliveryInfo(){
    document.getElementById("deliveryModal").style.display = "none";
}
window.addEventListener("click", function(e){
    const modal = document.getElementById("deliveryModal");
    if(e.target === modal){
        closeDeliveryInfo();
    }
});

/* ==============================
   SIDEBAR (drives the hero slider only)
============================== */
function createSidebar(){
    sidebar.innerHTML = "";
    Object.keys(allData).forEach((cat, i) => {
        let btn = document.createElement("button");
        btn.innerText = cat.charAt(0).toUpperCase() + cat.slice(1);
        btn.dataset.cat = cat;
        btn.onclick = () => {
            loadCategory(cat, btn);
            activeCategory = cat;
            const idx = categoryOrder.indexOf(cat);
            if(idx !== -1) activeCategoryIndex = idx;
            positionCategoryPills();
            syncSecondaryCategoryUI(cat);
            updateMostSold(cat);
        };
        if(i === 0){
            btn.classList.add("active");
            loadCategory(cat, btn);
        }
        sidebar.appendChild(btn);
    });
}

localStorage.setItem("cart", JSON.stringify(cart));

function updateCartUI(){
    let totalQty = 0;
    cart.forEach(item => { totalQty += item.qty; });
    document.getElementById("cartCount").innerText = totalQty;
}

function toggleCart(){
    let box = document.getElementById("cartBox");
    box.style.display = box.style.display === "none" ? "block" : "none";
    renderCart();
}

function goCheckout(){
    if(cart.length === 0){
        alert("Your cart is empty!");
        return;
    }
    window.location.href = "checkout.html";
}

function renderCart(){
    let container = document.getElementById("cartItems");
    container.innerHTML = "";
    if(cart.length === 0){
        container.innerHTML = "<p style='font-size:13px'>Cart is empty</p>";
        return;
    }
    let total = 0;
    cart.forEach((item, i) => {
        let price = parseFloat(item.price) || 0;
        let itemTotal = price * item.qty;
        total += itemTotal;
        container.innerHTML += `
<div style="
    display:flex;
    gap:10px;
    margin-bottom:12px;
    border-bottom:1px solid #eee;
    padding-bottom:10px;
">
    <img src="${item.img}"
         style="
            width:60px;
            height:60px;
            object-fit:cover;
            border-radius:8px;
            border:1px solid #ddd;
         ">
    <div style="flex:1;">
        <div style="display:flex; justify-content:space-between;">
            <b>${item.name}</b>
            <button onclick="removeItem(${i})"
    class="remove-cart-btn">
    ✕
</button>
        </div>
        <div style="font-size:13px; color:#666;">
            Rs. ${item.price}
        </div>
        <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            margin-top:8px;
        ">
            <div>
                <button onclick="changeQty(${i}, -1)">−</button>
                <span style="margin:0 8px;">
                    ${item.qty}
                </span>
                <button onclick="changeQty(${i}, 1)">+</button>
            </div>
            <div style="font-weight:700; color:#0f766e;">
    Rs. ${itemTotal}
</div>
        </div>
    </div>
</div>
`;
    });
    container.innerHTML += `
        <hr>
        <div style="display:flex; justify-content:space-between; font-weight:700;">
            <span>Total</span>
            <span style="color:#0f766e;">Rs. ${total}</span>
        </div>
    `;
}

function createProductCard(item, category, index){
    const price = parseFloat(item.price) || 0;
    const original = parseFloat(item.originalPrice) || Math.round(price * 1.08);
    const discount = original > price
        ? Math.round(((original - price) / original) * 100)
        : 0;
    const sold = item.totalSold || 0;
    return `
    <div class="col-6 col-md-4 col-lg-3 mb-4">
        <div class="product-card">
            <div class="product-image-box">
                ${
                    discount > 0
                    ?
                    `<div class="discount-badge">
                        <span class="discount-percent">${discount}%</span>
                        <span class="discount-text">OFF</span>
                    </div>`
                    :
                    ""
                }
                <img
                    src="${item.img}"
                    loading="lazy"
                    decoding="async"
                    onclick="openProductById('${item.id}')">
            </div>
            <div class="product-content">
                <h6 onclick="openProductById('${item.id}')">
                    ${item.name}
                </h6>
                ${
                    sold > 0
                    ?
                    `<div class="sold-count">
                        <i class="fas fa-fire"></i> ${sold} sold
                    </div>`
                    :
                    ""
                }
                <div class="price-area">
                    <span class="price-current">
                        <span class="currency">Rs.</span>${price}
                    </span>
                    ${
                        original > price
                        ?
                        `<span class="price-old">
                            <span class="currency">Rs.</span>${original}
                        </span>`
                        :
                        ""
                    }
                </div>
                <button
                    class="btn w-100"
                    onclick="addToCartByIndex('${category}',${index})">
                    <i class="fas fa-shopping-cart"></i>
                    Add to Cart
                </button>
            </div>
        </div>
    </div>
    `;
}

function renderAllProducts(){
    const container = document.getElementById("allProductsContainer");
    container.innerHTML = "";
    Object.keys(allData).forEach(category => {
        allData[category].forEach((item, index) => {
            container.innerHTML += createProductCard(item, category, index);
        });
    });
}

function renderCategoryProducts(category){
    const container = document.getElementById("allProductsContainer");
    container.innerHTML = "";
    (allData[category] || []).forEach((item, index) => {
        container.innerHTML += createProductCard(item, category, index);
    });
}

function changeQty(index, change){
    if(!cart[index]) return;
    cart[index].qty += change;
    if(cart[index].qty <= 0){
        cart.splice(index, 1);
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartUI();
    renderCart();
}

function addToCartByIndex(category, index){
    addToCart(allData[category][index]);
}

function removeItem(index){
    index = Number(index);
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartUI();
    renderCart();
}

function openProduct(product){
    alert(
        product.name + "\n\n" +
        product.desc + "\n\nPrice: Rs. " + product.price
    );
}

function addToCart(product){
    let existing = cart.find(p => p.name === product.name);
    if(existing){
        existing.qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartUI();
    renderCart();
    alert(product.name + " added to cart");
}

// LOAD CATEGORY (hero slider only) — top 3 best sellers, ranked by units sold
function loadCategory(category, btn){
    const items = allData[category] || [];
    currentItems = [...items]
        .sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0))
        .slice(0, 3);
    index = 0;
    slidesContainer.innerHTML = "";
    preloadImages(currentItems);

    currentItems.forEach(item => {
        let slide = document.createElement("div");
        slide.style.minWidth = "100%";
        slide.style.position = "relative";
        const sold = item.totalSold || 0;
        slide.innerHTML = `
<div class="hero-slide-bg" style="background-image:url('${item.img}')"></div>
<div class="hero-slide-img-wrap">
    <img src="${item.img}" class="hero-slide-img">
</div>
<div class="hero-slide-overlay"></div>
<div style="
    position:absolute;
    bottom:30px;
    left:30px;
    color:white;
    padding:15px;
    border-radius:12px;
    max-width:70%;
    z-index:3;
">
    ${
        sold > 0
        ?
        `<span class="hero-sold-badge"><i class="fas fa-fire"></i> ${sold} Sold</span>`
        :
        ""
    }
    <h4>${item.name || ""}</h4>
    <p style="font-size:13px">${item.desc || ""}</p>
   ${(() => {
    let price = parseFloat(item.price) || 0;
    let increased = Math.round(price * 1.04);
    return `
        <div>
            <span style="
                text-decoration: line-through;
                color: #ddd;
                font-size: 13px;
                margin-right: 6px;
            ">
                Rs. ${increased}
            </span>
            <span style="
    color:#0f766e;
    font-weight:800;
    font-size:21px;
    letter-spacing:.5px;
    text-shadow:0 2px 6px rgba(15,118,110,.18);
">
    Rs. ${price}
</span>
        </div>
    `;
})()}
    <div style="margin-top:10px;">
        <button class="shop-btn" onclick='addToCart(${JSON.stringify(item)})'>
            <i class="fas fa-shopping-cart me-1"></i> Add to Cart
        </button>
        <button class="btn btn-outline-light ms-2" onclick="openProductById('${item.id}')">
    View Details
</button>
    </div>
</div>
`;
        slidesContainer.appendChild(slide);
    });
    createDots();
    updateSlider();
    document.querySelectorAll(".sidebar button")
        .forEach(b => b.classList.remove("active"));
    if(btn) btn.classList.add("active");
}

// searchProducts
function searchProducts(){
    const keyword = document
        .getElementById("searchInput")
        .value
        .toLowerCase()
        .trim();
    const container = document.getElementById("allProductsContainer");
    if(keyword === ""){
        renderAllProducts();
        return;
    }
    let html = "";
    Object.keys(allData).forEach(category => {
        allData[category].forEach((item, index) => {
            if(
                item.name.toLowerCase().includes(keyword) ||
                (item.desc || "").toLowerCase().includes(keyword) ||
                category.toLowerCase().includes(keyword)
            ){
                html += createProductCard(item, category, index);
            }
        });
    });
    if(html === ""){
        html = `
            <div class="text-center py-5">
                <h5>No products found</h5>
            </div>
        `;
    }
    container.innerHTML = html;
}

function handleSearchInput(){
    const input = document.getElementById("searchInput");
    const clearBtn = document.getElementById("clearSearch");
    if(input.value.trim() === ""){
        clearBtn.style.display = "none";
        renderAllProducts();
        return;
    }
    clearBtn.style.display = "flex";
    searchProducts();
}

function clearSearch(){
    document.getElementById("searchInput").value = "";
    document.getElementById("clearSearch").style.display = "none";
    renderAllProducts();
    document.getElementById("searchInput").focus();
}

// SLIDER UPDATE
function updateSlider(){
    slidesContainer.style.transform = `translateX(-${index * 100}%)`;
    [...dotsContainer.children].forEach((d, i) =>
        d.classList.toggle("active", i === index)
    );
}

window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
        return;
    }
});

// NEXT / PREV
function nextSlide(){
    if(currentItems.length === 0) return;
    index = (index + 1) % currentItems.length;
    updateSlider();
}
function prevSlide(){
    if(currentItems.length === 0) return;
    index = (index - 1 + currentItems.length) % currentItems.length;
    updateSlider();
}

let startX = 0;
let endX = 0;
const slider = document.querySelector(".slider");

slider.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; });
slider.addEventListener("touchend", (e) => { endX = e.changedTouches[0].clientX; handleSwipe(); });
slider.addEventListener("mousedown", (e) => { startX = e.clientX; });
slider.addEventListener("mouseup", (e) => { endX = e.clientX; handleSwipe(); });

document.addEventListener("click", function(e){
    const cartBox = document.getElementById("cartBox");
    const cartBtn = document.querySelector('[onclick="toggleCart()"]');
    if(
        cartBox.style.display === "block" &&
        !cartBox.contains(e.target) &&
        !cartBtn.contains(e.target)
    ){
        cartBox.style.display = "none";
    }
});

function handleSwipe(){
    let diff = startX - endX;
    if(Math.abs(diff) > 50){
        if(diff > 0){
            nextSlide();
        } else {
            prevSlide();
        }
    }
}

function openProductById(id){
    window.location.href = `product.html?id=${id}`;
}

// DOTS
function createDots(){
    dotsContainer.innerHTML = "";
    currentItems.forEach((_, i) => {
        let d = document.createElement("span");
        d.onclick = () => { index = i; updateSlider(); };
        dotsContainer.appendChild(d);
    });
}

// AUTO SLIDE (hero, images only)
setInterval(() => {
    if(currentItems.length) nextSlide();
}, 4000);

function placeOrder(){
    if(cart.length === 0){
        alert("Your cart is empty!");
        return;
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    window.location.href = "checkout.html";
}
