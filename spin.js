/* ==============================
   SHARED DATA SOURCE — Apps Script JSON endpoint
   Columns: Type | Picture | name | short description | Price With Discount |
            Original Price | Product Unique ID | long description | Status |
            Seller No | Total Purchased | Sold Quantity | In Stock | Total Sold |
            Rating | Review Count
============================== */
const sheetURL = "https://script.google.com/macros/s/AKfycbxg-irSc9cHevNptiQm_bLPas1KTkgPidTVMhk-_35FwZ9D5_rdbdWtEqXeyKe_h505/exec";

let allProducts = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let spinning = false;
let currentPicks = [];   // the 3 products the reels landed on
let reelsDone = 0;

const REEL_COUNT = 3;
const REEL_DURATIONS = [1900, 2400, 2900]; // ms — classic staggered stop
const FILLER_ROUNDS = 16; // how many extra items scroll past before landing

updateCartCount();

const footerYearEl = document.getElementById("footerYear");
if (footerYearEl) footerYearEl.textContent = new Date().getFullYear();

/* ==============================
   ERROR BANNER
============================== */
const spinErrorEl = document.getElementById("spinError");
function showError(msg) {
    if (!spinErrorEl) return;
    spinErrorEl.innerText = msg;
    spinErrorEl.classList.add("show");
}
function clearError() {
    if (!spinErrorEl) return;
    spinErrorEl.classList.remove("show");
    spinErrorEl.innerText = "";
}

/* ==============================
   FETCH + PARSE
   The Apps Script endpoint may return either:
   - an array of row objects keyed by the sheet's header names, or
   - a raw array of arrays (first row = headers), or
   - an object wrapping the array under a key like "data"/"rows"/"products".
   getField() looks up a value by header name case-insensitively so this
   keeps working regardless of exact casing/spacing from the sheet.
============================== */
// Fixed column order as supplied by the sheet, used when rows arrive as plain arrays
const COLUMN_ORDER = [
    "Type", "Picture", "name", "short description", "Price With Discount",
    "Original Price", "Product Unique ID", "long description", "Status",
    "Seller No", "Total Purchased", "Sold Quantity", "In Stock", "Total Sold",
    "Rating", "Review Count"
];

fetch(sheetURL)
    .then(res => {
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        return res.json();
    })
    .then(payload => {
        let rows = Array.isArray(payload)
            ? payload
            : (payload.data || payload.rows || payload.products || payload.values || []);

        // If it's an array-of-arrays, map by FIXED position (COLUMN_ORDER) rather than
        // guessing from row 0 — treating a real product row as "headers" was the bug
        // that made every price come out blank/0, which is why nothing matched any budget.
        if (rows.length && Array.isArray(rows[0])) {
            const firstCell = String(rows[0][0] || "").trim().toLowerCase();
            const hasLiteralHeaderRow = firstCell === "type";
            const dataRows = hasLiteralHeaderRow ? rows.slice(1) : rows;
            rows = dataRows.map(r => {
                const obj = {};
                COLUMN_ORDER.forEach((h, i) => { obj[h] = r[i]; });
                return obj;
            });
        }

        if (rows.length) {
            console.log("Storix Spin: sample parsed row →", rows[0]);
        }

        rows.forEach(r => {
            const category = String(getField(r, "Type") || "").trim().toLowerCase();
            const img = String(getField(r, "Picture") || "").trim();
            const name = String(getField(r, "name") || "").trim();
            const desc = String(getField(r, "short description") || "").trim();
            const longDesc = String(getField(r, "long description") || "").trim();
            const price = String(getField(r, "Price With Discount") || "").trim();
            const originalPrice = String(getField(r, "Original Price") || "").trim();
            const status = String(getField(r, "Status") || "").trim().toLowerCase();
            const sellerNo = String(getField(r, "Seller No") || "").trim();
            const rating = String(getField(r, "Rating") || "").trim();
            const reviewCount = parseCount(getField(r, "Review Count")) || 0;

            let productId = String(getField(r, "Product Unique ID") || "").trim();
            if (!productId) {
                productId = name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
            }

            const inStock = parseCount(getField(r, "In Stock"));
            const totalSold = parseCount(getField(r, "Total Sold")) || 0;

            if (!category || !img || !name) return;
            // Skip rows explicitly marked inactive/disabled/hidden, if a Status column is used
            if (status && ["inactive", "disabled", "hidden", "no"].includes(status)) return;

            allProducts.push({
                type: category, img, name, desc, longDesc, price, originalPrice,
                id: productId, status, sellerNo, inStock, totalSold, rating, reviewCount
            });
        });

        if (allProducts.length === 0) {
            showError("No products were found from the sheet. Please check back later.");
            document.getElementById("machineStatus").innerText = "No products available right now.";
            return;
        }

        const eligibleCount = allProducts.filter(p => parseMoney(p.price) > 0).length;
        if (eligibleCount === 0) {
            console.error("Storix Spin: every product parsed with a Rs. 0 price. Sample →", allProducts[0]);
            showError("Product prices couldn't be read correctly from the sheet. Please refresh, or let us know if this keeps happening.");
            document.getElementById("machineStatus").innerText =
                `${allProducts.length} products loaded, but prices look wrong — see the notice above.`;
            return;
        }

        clearError();
        const minBudget = getMinBudgetForThreeCategories();
        const suggestion = minBudget
            ? ` Try at least Rs. ${minBudget.toLocaleString()} to guarantee 3 different picks.`
            : "";
        document.getElementById("machineStatus").innerText =
            `${allProducts.length} products loaded — enter a budget and pull the lever.${suggestion}`;
    })
    .catch(err => {
        console.error("Storix Spin: failed to load products →", err);
        showError("Couldn't load products right now. Please check your connection and refresh the page.");
        document.getElementById("machineStatus").innerText =
            "Couldn't load products right now. Please refresh and try again.";
    });

// Minimum budget needed to guarantee 3 picks from 3 DIFFERENT categories —
// the price of the 3rd-cheapest "cheapest item per category". Falls back to
// the 3rd-cheapest product overall if there are fewer than 3 categories total.
function getMinBudgetForThreeCategories() {
    const eligible = allProducts.filter(p => parseMoney(p.price) > 0 && (isNaN(p.inStock) || p.inStock > 0));
    const cheapestPerCategory = {};
    eligible.forEach(p => {
        const price = parseMoney(p.price);
        if (!(p.type in cheapestPerCategory) || price < cheapestPerCategory[p.type]) {
            cheapestPerCategory[p.type] = price;
        }
    });
    const categoryMins = Object.values(cheapestPerCategory).sort((a, b) => a - b);
    if (categoryMins.length >= 3) return categoryMins[2];

    // Fewer than 3 categories exist at all — fall back to "3 distinct products" logic
    const allPrices = eligible.map(p => parseMoney(p.price)).sort((a, b) => a - b);
    return allPrices.length >= 3 ? allPrices[2] : null;
}

// Case-insensitive, whitespace-tolerant lookup of a value by header name
function getField(row, ...names) {
    if (!row) return "";
    const keys = Object.keys(row);
    for (const name of names) {
        const target = name.trim().toLowerCase();
        const found = keys.find(k => k.trim().toLowerCase() === target);
        if (found !== undefined) return row[found];
    }
    return "";
}

// Strips "Rs.", commas, spaces, etc. so "Rs. 1,200" / "1,200" / 1200 all parse correctly.
// This is what fixed the "no products found within budget" bug — raw commas in the
// sheet were making parseFloat() cut off early (e.g. "1,200" -> 1).
function parseMoney(v) {
    if (v === null || v === undefined) return 0;
    const cleaned = String(v).replace(/[^0-9.]/g, "");
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
}

function parseCount(v) {
    if (v === null || v === undefined || v === "") return NaN;
    const cleaned = String(v).replace(/[^0-9.-]/g, "");
    const n = parseInt(cleaned, 10);
    return isNaN(n) ? NaN : n;
}

/* ==============================
   CART (shared localStorage key with index.html / checkout.html)
============================== */
function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCartCount() {
    let totalQty = 0;
    cart.forEach(i => totalQty += i.qty);
    const el = document.getElementById("cartCount");
    if (el) el.innerText = totalQty;
}

function addProductToCart(product) {
    let existing = cart.find(p => p.name === product.name);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    saveCart();
    updateCartCount();
}

/* ==============================
   LEVER
============================== */
const leverBtn = document.getElementById("leverBtn");
const budgetInput = document.getElementById("budgetInput");
const budgetHint = document.getElementById("budgetHint");
const statusEl = document.getElementById("machineStatus");
const resultsPanel = document.getElementById("resultsPanel");
const resultsGrid = document.getElementById("resultsGrid");
const finalizeBtn = document.getElementById("finalizeBtn");
const addAllBtn = document.getElementById("addAllBtn");
const spinAgainBtn = document.getElementById("spinAgainBtn");
const infoBtn = document.getElementById("infoBtn");
const infoModal = document.getElementById("infoModal");
const infoModalBackdrop = document.getElementById("infoModalBackdrop");
const infoModalClose = document.getElementById("infoModalClose");
const infoModalList = document.getElementById("infoModalList");
const infoModalSub = document.getElementById("infoModalSub");

leverBtn.addEventListener("click", pullLever);
addAllBtn.addEventListener("click", addAllPicksToCart);
finalizeBtn.addEventListener("click", finalizeOrder);
spinAgainBtn.addEventListener("click", resetMachine);
infoBtn.addEventListener("click", openInfoModal);
infoModalBackdrop.addEventListener("click", closeInfoModal);
infoModalClose.addEventListener("click", closeInfoModal);

/* ==============================
   INFO MODAL — "what products are available right now"
============================== */
function openInfoModal() {
    if (allProducts.length === 0) {
        infoModalSub.innerText = "Products haven't loaded yet — try again in a second.";
        infoModalList.innerHTML = "";
        infoModal.classList.add("show");
        return;
    }

    const budget = parseFloat(budgetInput.value);
    let list = allProducts.filter(p => parseMoney(p.price) > 0 && (isNaN(p.inStock) || p.inStock > 0));

    if (budget && budget > 0) {
        list = list.filter(p => parseMoney(p.price) <= budget);
        infoModalSub.innerText = `${list.length} product(s) fit inside Rs. ${budget.toLocaleString()}`;
    } else {
        infoModalSub.innerText = `${list.length} product(s) currently available — enter a budget to narrow this down`;
    }

    if (list.length === 0) {
        infoModalList.innerHTML = `<div class="info-modal-empty">No products match yet — try a higher budget.</div>`;
    } else {
        infoModalList.innerHTML = list
            .sort((a, b) => parseMoney(a.price) - parseMoney(b.price))
            .map(p => `
                <div class="info-modal-item">
                    <img src="${p.img}" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_IMG}'">
                    <div class="info-modal-item-main">
                        <div class="info-modal-item-name">${p.name}</div>
                        <div class="info-modal-item-cat">${p.type}</div>
                    </div>
                    <div class="info-modal-item-price">Rs. ${parseMoney(p.price).toLocaleString()}</div>
                </div>
            `).join("");
    }
    infoModal.classList.add("show");
}
function closeInfoModal() {
    infoModal.classList.remove("show");
}

function pullLever() {
    if (spinning) return;
    clearError();

    try {
        const budget = parseFloat(budgetInput.value);
        if (!budget || budget <= 0) {
            budgetHint.innerText = "Enter a valid budget first (e.g. 3000).";
            budgetHint.style.color = "#ff8b8b";
            budgetInput.focus();
            return;
        }
        if (allProducts.length === 0) {
            statusEl.innerText = "Products are still loading — try again in a second.";
            return;
        }

        const pool = allProducts.filter(p => {
            const price = parseMoney(p.price);
            const stockOk = isNaN(p.inStock) || p.inStock > 0;
            return price > 0 && price <= budget && stockOk;
        });

        if (pool.length === 0) {
            console.log("Storix Spin: no matches. Sample product →", allProducts[0], "budget →", budget);
            const minBudget = getMinBudgetForThreeCategories();
            const suggestion = minBudget
                ? ` Try at least Rs. ${minBudget.toLocaleString()} to get 3 different picks.`
                : "";
            statusEl.innerText = `No products found within Rs. ${budget}.${suggestion}`;
            return;
        }

        const distinctCategories = new Set(pool.map(p => p.type)).size;
        if (pool.length < REEL_COUNT || distinctCategories < REEL_COUNT) {
            const minBudget = getMinBudgetForThreeCategories();
            budgetHint.style.color = "#ffd27a";
            budgetHint.innerText = minBudget
                ? `Only ${distinctCategories} categor${distinctCategories === 1 ? "y" : "ies"} fit this budget — some picks may repeat. Rs. ${minBudget.toLocaleString()}+ guarantees 3 different ones.`
                : `Only ${distinctCategories} categor${distinctCategories === 1 ? "y" : "ies"} fit this budget — some picks may repeat.`;
        } else {
            budgetHint.style.color = "";
            budgetHint.innerText = "We'll only load products that fit inside this amount.";
        }

        const picks = pickThreeAcrossCategories(pool);
        currentPicks = picks;

        startSpin(pool, picks, budget);
    } catch (err) {
        console.error("Storix Spin: pullLever failed →", err);
        showError("Something went wrong while spinning. Please try again.");
        spinning = false;
        leverBtn.disabled = false;
        budgetInput.disabled = false;
    }
}

// Tries to land each reel on a DIFFERENT category (electronics/fashion/etc).
// Falls back to distinct products (allowing repeat categories, then repeat
// products) only when the budget's pool doesn't stretch across 3 categories.
function pickThreeAcrossCategories(pool) {
    const byCategory = {};
    pool.forEach(p => {
        (byCategory[p.type] = byCategory[p.type] || []).push(p);
    });
    const categories = Object.keys(byCategory).sort(() => Math.random() - 0.5);

    if (categories.length >= REEL_COUNT) {
        return categories.slice(0, REEL_COUNT).map(cat => {
            const items = byCategory[cat];
            return items[Math.floor(Math.random() * items.length)];
        });
    }

    // Fewer than 3 categories available — fall back to distinct products, then repeats
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const picks = [];
    for (let i = 0; i < REEL_COUNT; i++) {
        picks.push(shuffled.length > i ? shuffled[i] : pool[Math.floor(Math.random() * pool.length)]);
    }
    return picks;
}

function startSpin(pool, picks, budget) {
    spinning = true;
    reelsDone = 0;
    leverBtn.disabled = true;
    budgetInput.disabled = true;
    resultsPanel.classList.remove("show");
    statusEl.innerText = "Spinning...";

    leverBtn.classList.add("pulled");
    setTimeout(() => leverBtn.classList.remove("pulled"), 260);

    document.querySelectorAll(".reel-window").forEach(w => w.classList.remove("landed"));

    for (let r = 0; r < REEL_COUNT; r++) {
        spinReel(r, pool, picks[r], REEL_DURATIONS[r]);
    }

    const totalWait = Math.max(...REEL_DURATIONS) + 250;
    setTimeout(() => {
        spinning = false;
        leverBtn.disabled = false;
        budgetInput.disabled = false;
        revealResults(picks, budget);
    }, totalWait);
}

function spinReel(reelIndex, pool, target, duration) {
    const windowEl = document.querySelector(`.reel-window[data-reel="${reelIndex}"]`);
    const strip = document.getElementById(`strip${reelIndex}`);
    const itemHeight = windowEl.clientHeight;

    // Build filler items + the target as the final one
    const items = [];
    for (let i = 0; i < FILLER_ROUNDS; i++) {
        items.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    items.push(target);

    strip.innerHTML = items.map(itemToReelHTML).join("");

    // Reset position instantly, then animate to the final item
    strip.style.transition = "none";
    strip.style.transform = "translateY(0)";
    // eslint-disable-next-line no-unused-expressions
    strip.offsetHeight; // force reflow

    requestAnimationFrame(() => {
        strip.style.transition = `transform ${duration}ms cubic-bezier(.12,.87,.28,1)`;
        strip.style.transform = `translateY(-${(items.length - 1) * itemHeight}px)`;
    });

    setTimeout(() => {
        windowEl.classList.add("landed");
    }, duration);
}

const FALLBACK_IMG = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 56 56'%3E%3Crect width='56' height='56' rx='8' fill='%230e2e2a'/%3E%3Ctext x='28' y='33' font-size='22' text-anchor='middle' fill='%237fb0a8'%3E%3F%3C/text%3E%3C/svg%3E";

function itemToReelHTML(item) {
    const price = parseMoney(item.price);
    return `
        <div class="reel-item">
            <img src="${item.img}" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_IMG}'">
            <span>Rs. ${price.toLocaleString()}</span>
        </div>
    `;
}

/* ==============================
   RESULTS
============================== */
function revealResults(picks, budget) {
    statusEl.innerText = `Landed on 3 products within Rs. ${budget}!`;
    resultsGrid.innerHTML = picks.map((p, i) => resultCardHTML(p, i)).join("");
    resultsPanel.classList.add("show");
    finalizeBtn.disabled = true;

    picks.forEach((p, i) => {
        const card = document.querySelector(`.result-card[data-idx="${i}"]`);
        const btn = card.querySelector(".rc-add-btn");
        btn.addEventListener("click", () => {
            addProductToCart(p);
            card.classList.add("added");
            btn.innerText = "Added ✓";
            btn.disabled = true;
            finalizeBtn.disabled = false;
        });
    });

    localStorage.setItem("lastSpinBudget", String(budget));
}

function resultCardHTML(item, idx) {
    const price = parseMoney(item.price);
    return `
        <div class="result-card" data-idx="${idx}">
            <img src="${item.img}" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_IMG}'">
            <div class="rc-name">${item.name}</div>
            <div class="rc-price">Rs. ${price.toLocaleString()}</div>
            <button class="btn rc-add-btn">Add to Cart</button>
            <div class="rc-added"><i class="fas fa-check-circle"></i> In cart</div>
        </div>
    `;
}

function addAllPicksToCart() {
    if (currentPicks.length === 0) return;
    currentPicks.forEach((p, i) => {
        addProductToCart(p);
        const card = document.querySelector(`.result-card[data-idx="${i}"]`);
        if (card) {
            card.classList.add("added");
            const btn = card.querySelector(".rc-add-btn");
            btn.innerText = "Added ✓";
            btn.disabled = true;
        }
    });
    finalizeBtn.disabled = false;
}

function finalizeOrder() {
    if (cart.length === 0) return;
    const budget = localStorage.getItem("lastSpinBudget") || "";
    window.location.href = `checkout.html?fromSpin=1&budget=${encodeURIComponent(budget)}`;
}

function resetMachine() {
    currentPicks = [];
    resultsPanel.classList.remove("show");
    document.querySelectorAll(".reel-window").forEach(w => w.classList.remove("landed"));
    statusEl.innerText = "Enter a budget and pull the lever to spin again";
    budgetInput.focus();
}
