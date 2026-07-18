      let cart = JSON.parse(localStorage.getItem("cart")) || [];
              updateCartUI();
const sheetURL = "https://docs.google.com/spreadsheets/d/1Z516TmqefcNcyGVPgTamh_OpNXjzO_s84udPnYN3new/gviz/tq?tqx=out:csv";

let allData = {};
let currentItems = [];

let index = 0;

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
});


function createCategorySlider(){

    const slider=document.getElementById("categorySlider");
    const select=document.getElementById("categorySelect");

    slider.innerHTML="";
    select.innerHTML="";

    // ALL PRODUCTS

    const all=document.createElement("button");

    all.className="category-pill active";

    all.innerText="All Products";

    all.onclick=function(){

        renderAllProducts();

        setActiveCategory(this);

    };

    slider.appendChild(all);

    select.innerHTML+=`
        <option value="all">All Products</option>
    `;

    // Categories

    Object.keys(allData).forEach(category=>{

        const btn=document.createElement("button");

        btn.className="category-pill";

        btn.innerText=
        category.charAt(0).toUpperCase()+category.slice(1);

        btn.onclick=function(){

            renderCategoryProducts(category);

            loadCategory(category);

            setActiveCategory(this);

            select.value=category;

        };

        slider.appendChild(btn);

        select.innerHTML+=`
            <option value="${category}">
                ${category.charAt(0).toUpperCase()+category.slice(1)}
            </option>`;

    });

}

function setActiveCategory(btn){

    document.querySelectorAll(".category-pill")
    .forEach(x=>x.classList.remove("active"));

    btn.classList.add("active");

    btn.scrollIntoView({
        behavior:"smooth",
        inline:"center",
        block:"nearest"
    });

}

function renderCategoryProducts(category){

    const container=document.getElementById("allProductsContainer");

    container.innerHTML="";

    allData[category].forEach((item,i)=>{

        let price=parseFloat(item.price)||0;

        container.innerHTML+=`

        <div class="col-6 col-md-4 col-lg-3">

            <div class="product-card">

                <img src="${item.img}"
                onclick="openProductById('${item.id}')">

                <h6>${item.name}</h6>

                <p>${item.desc}</p>

                <div class="price">
                    Rs. ${price}
                </div>

                <button class="btn w-100"
                onclick="addToCartByIndex('${category}',${i})">

                    Add to Cart

                </button>

            </div>

        </div>

        `;

    });

}


categorySelect.onchange=function(){

    if(this.value=="all"){

        renderAllProducts();

        document.querySelector(".category-pill").click();

        return;

    }

    renderCategoryProducts(this.value);

    loadCategory(this.value);

    document.querySelectorAll(".category-pill")
    .forEach(btn=>{

        if(btn.innerText.toLowerCase()==this.value){

            btn.click();

        }

    });

};



function showDeliveryInfo(){

    document.getElementById("deliveryModal").style.display="flex";

}

function closeDeliveryInfo(){

    document.getElementById("deliveryModal").style.display="none";

}

window.addEventListener("click",function(e){

    const modal=document.getElementById("deliveryModal");

    if(e.target===modal){

        closeDeliveryInfo();

    }

});
// CREATE SIDEBAR (NO DUPLICATES)
function createSidebar(){
    sidebar.innerHTML = "";

    Object.keys(allData).forEach((cat, i) => {
        let btn = document.createElement("button");
       btn.innerText = cat.charAt(0).toUpperCase() + cat.slice(1);

        btn.onclick = () => loadCategory(cat, btn);

        if(i === 0){
            btn.classList.add("active");
            loadCategory(cat, btn);
        }

        sidebar.appendChild(btn);
    });
}
      localStorage.setItem("cart", JSON.stringify(cart));
    // updateCartUI
 function updateCartUI(){
    let totalQty = 0;

    cart.forEach(item => {
        totalQty += item.qty;
    });

    document.getElementById("cartCount").innerText = totalQty;
}
 // updateCartUI end
         // addToCart



    // toggle car
     function toggleCart(){
    let box = document.getElementById("cartBox");
    box.style.display = box.style.display === "none" ? "block" : "none";

    renderCart();
}
              // checkout function call

              function goCheckout(){

    if(cart.length === 0){
        alert("Your cart is empty!");
        return;
    }

    window.location.href = "checkout.html";
}

function scrollCategoryRight(){

    const slider = document.getElementById("categorySlider");

    slider.scrollBy({
        left:220,
        behavior:"smooth"
    });

}

function scrollCategoryLeft(){

    const slider = document.getElementById("categorySlider");

    slider.scrollBy({
        left:-220,
        behavior:"smooth"
    });

}
//change in cart products
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
         function renderAllProducts(){
    const container = document.getElementById("allProductsContainer");
    container.innerHTML = "";

    Object.keys(allData).forEach(category => {

        allData[category].forEach((item, i) => {

            let price = parseFloat(item.price) || 0;

            container.innerHTML += `
                <div class="col-6 col-md-4 col-lg-3">
                    <div class="product-card">

                        <img src="${item.img}"
                             style="width:100%; height:160px; object-fit:cover; border-radius:8px; cursor:pointer;"
                             onclick="openProductById('${item.id}')">
                        <h6 style="margin-top:8px;">${item.name}</h6>

                        <p style="font-size:12px; color:#666;">
                            ${item.desc || ""}
                        </p>

                        <div style="color:#0f766e; font-weight:700; font-size:17px;">
    Rs. ${price}
                        </div>

                        <button class="btn w-100 mt-2"
                            onclick="addToCartByIndex('${category}', ${i})">
                            Add to Cart
                        </button>

                    </div>
                </div>
            `;
        });

    });
}
           function changeQty(index, change){
    if(!cart[index]) return;

    cart[index].qty += change;

    // remove if qty goes 0
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
        cart.push({
            ...product,
            qty: 1
        });
    }
           localStorage.setItem("cart", JSON.stringify(cart));
    updateCartUI();
    renderCart(); // always update
        alert(product.name + " added to cart");

}




// LOAD CATEGORY
function loadCategory(category, btn){
    currentItems = allData[category] || [];
    index = 0;
    slidesContainer.innerHTML = "";
      preloadImages(currentItems);
    currentItems.forEach(item => {
        let slide = document.createElement("div");
        slide.style.minWidth = "100%";
        slide.style.position = "relative";

        slide.innerHTML = `
<img src="${item.img}">

<div style="
    position:absolute;
    bottom:30px;
    left:30px;
    color:white;
    background:rgba(0,0,0,0.0);
    padding:15px;
    border-radius:12px;
    max-width:70%;
">

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
</span><sub><sub></sub></sub>
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

//searchproducts

function searchProducts(){

    let keyword = document
        .getElementById("searchInput")
        .value
        .toLowerCase()
        .trim();


    const container = document.getElementById("allProductsContainer");

    container.innerHTML="";


    if(keyword===""){
        renderAllProducts();
        return;
    }


    Object.keys(allData).forEach(category=>{

        allData[category].forEach((item,i)=>{


            if(
                item.name.toLowerCase().includes(keyword) ||
                item.desc.toLowerCase().includes(keyword) ||
                category.toLowerCase().includes(keyword)
            ){

                let price=parseFloat(item.price)||0;


                container.innerHTML += `

                <div class="col-6 col-md-4 col-lg-3">

                    <div class="product-card">


                        <img src="${item.img}"
     style="
        width:100%;
        height:160px;
        object-fit:cover;
        border-radius:8px;
        cursor:pointer;
     "
     onclick="openProductById('${item.id}')">


                       <h6 onclick="openProductById('${item.id}')"
    style="cursor:pointer;">
    ${item.name}
</h6>


                        <p style="font-size:12px;color:#666;">
                        ${item.desc || ""}
                        </p>


                        <div style="color:#ff6600;font-weight:600;">
                        Rs. ${price}
                        </div>


                        <button class="btn w-100 mt-2"
                        onclick="addToCartByIndex('${category}',${i})">
                        Add to Cart
                        </button>


                    </div>

                </div>

                `;
            }


        });

    });


}
           function handleSearchInput(){

    const input = document.getElementById("searchInput");
    const clearBtn = document.getElementById("clearSearch");

    if(input.value.trim() !== ""){
        clearBtn.style.display = "flex";
    }else{
        clearBtn.style.display = "none";
    }

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

    [...dotsContainer.children].forEach((d,i)=>
        d.classList.toggle("active", i===index)
    );
}

    function updateOverlay(){
    if(!currentItems[index]) return;

    document.getElementById("productName").innerText =
        currentItems[index].name || "Product";

    document.getElementById("productDesc").innerText =
        currentItems[index].desc || "";

    document.getElementById("productPrice").innerText =
        "Rs. " + (currentItems[index].price || "0");
}

window.addEventListener("pageshow", function () {

    const input = document.getElementById("searchInput");

    if (!input) return;

    input.value = "";

    renderAllProducts();

    const clearBtn = document.getElementById("clearSearch");
    if (clearBtn) {
        clearBtn.style.display = "none";
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

// TOUCH EVENTS (mobile)
slider.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
});

slider.addEventListener("touchend", (e) => {
    endX = e.changedTouches[0].clientX;
    handleSwipe();
});

// MOUSE EVENTS (desktop drag)
slider.addEventListener("mousedown", (e) => {
    startX = e.clientX;
});

slider.addEventListener("mouseup", (e) => {
    endX = e.clientX;
    handleSwipe();
});
     document.addEventListener("click", function(e){
    const cartBox = document.getElementById("cartBox");
    const cartBtn = document.querySelector('[onclick="toggleCart()"]');

    // if cart is open AND click is outside
    if(
        cartBox.style.display === "block" &&
        !cartBox.contains(e.target) &&
        !cartBtn.contains(e.target)
    ){
        cartBox.style.display = "none";
    }
});
// SWIPE LOGIC
function handleSwipe(){
    let diff = startX - endX;

    if(Math.abs(diff) > 50){ // swipe threshold
        if(diff > 0){
            nextSlide();   // swipe left → next
        } else {
            prevSlide();   // swipe right → previous
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
        d.onclick = () => {
            index = i;
            updateSlider();
        };
        dotsContainer.appendChild(d);
    });
}

// AUTO SLIDE (ONLY IMAGES)
setInterval(() => {
    if(currentItems.length) nextSlide();
}, 4000);

function placeOrder(){

    if(cart.length === 0){
        alert("Your cart is empty!");
        return;
    }

    // Save latest cart
    localStorage.setItem("cart", JSON.stringify(cart));

    // Open checkout page
    window.location.href = "checkout.html";
}
