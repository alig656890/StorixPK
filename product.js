const urlParams = new URLSearchParams(window.location.search);
const selectedProductId = urlParams.get("id");
document.getElementById("productId").textContent = selectedProductId || "No ID";

console.log("URL:", window.location.href);
console.log("Selected Product ID:", selectedProductId);// ==============================
// GLOBAL VARIABLES
// ==============================

let currentProduct = null;
let currentImage = 0;
let quantity = 1;

let allProducts = [];
let currentIndex = 0;

let cart = JSON.parse(localStorage.getItem("cart")) || [];

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

const thumbnailStrip = document.getElementById("thumbnailStrip");

const productName = document.getElementById("productName");
const salePrice = document.getElementById("salePrice");
const originalPrice = document.getElementById("originalPrice");
const discountPercent = document.getElementById("discountPercent");

const stockStatus = document.getElementById("stockStatus");
const shortDescription = document.getElementById("shortDescription");

const productIdElement = document.getElementById("productId");
const category = document.getElementById("category");
const soldQty = document.getElementById("soldQty");

// ==============================
// GOOGLE SHEETS
// ==============================

const sheet1URL =
"https://docs.google.com/spreadsheets/d/1Z516TmqefcNcyGVPgTamh_OpNXjzO_s84udPnYN3new/gviz/tq?tqx=out:csv";

const mediaSheetURL =
"https://docs.google.com/spreadsheets/d/10oAlsT3IVuJ8cZNNeEKy10ZNbSHO4KCkBTwkY218bSk/gviz/tq?tqx=out:csv";

// ==============================
// MEDIA
// ==============================

const media = {
    images: [],
    videos: [],
    youtube: [],
    model3d: []
};

// ==============================
// URL PARAMS
// ==============================


// ==============================
// CART
// ==============================

function updateCartUI() {

    let totalQty = 0;

    cart.forEach(item => {
        totalQty += item.qty;
    });

    const cartCount = document.getElementById("cartCount");

    if (cartCount) {
        cartCount.textContent = totalQty;
    }
}

updateCartUI();

// ==============================
// CSV PARSER
// ==============================

function parseCSVRow(row) {

    return row
        .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
        .map(col => col.replace(/^"|"$/g, "").trim());

}
            function nextProduct() {

    if (currentIndex < allProducts.length - 1) {
        window.location.href =
            `product.html?id=${allProducts[currentIndex + 1]}`;
    }

}

function setActiveButton(activeBtn){

    document.querySelectorAll(".media-btn").forEach(btn=>{
        btn.classList.remove("active");
    });

    activeBtn.classList.add("active");

}

function previousProduct() {

    if (currentIndex > 0) {
        window.location.href =
            `product.html?id=${allProducts[currentIndex - 1]}`;
    }

}
// ==============================
// LOAD PRODUCT
// ==============================

async function loadProducts() {

    try {

        const response = await fetch(sheet1URL);

        if (!response.ok) {
            throw new Error("Unable to fetch product sheet.");
        }

        const csv = await response.text();

        const rows = csv.split("\n").slice(1);

        rows.forEach(row => {

            if (!row.trim()) return;

            const cols = parseCSVRow(row);

            const id = cols[6];

            if (!id) return;

            allProducts.push(id);

            if (id === selectedProductId) {

                currentIndex = allProducts.length - 1;

                currentProduct = {

                    id: id,

                    image: cols[1],

                    name: cols[2],

                    description: cols[3],

                    price: parseFloat(cols[4]) || 0,

                    originalPrice: parseFloat(cols[5]) || 0,

                    category: cols[0] || "",

                    totalPurchased: parseInt(cols[7]) || 0,

                    soldQty: parseInt(cols[8]) || 0,

                    stock: parseInt(cols[9]) || 0,

                    totalSold: parseInt(cols[10]) || 0

                };

            }

        });

    } catch (error) {

        console.error("Error loading products:", error);

    }

}
       async function loadMedia() {

    try {

        media.images = [];
        media.videos = [];
        media.youtube = [];
        media.model3d = [];

        const response = await fetch(mediaSheetURL);

        const csv = await response.text();

        const rows = csv.split("\n").slice(1);

        rows.forEach(row => {

            const cols = parseCSVRow(row);

            if (!cols.length) return;

            if (cols[0].trim() !== selectedProductId.trim()) return;

            const type = cols[1].trim().toLowerCase();
            const url = cols[2].trim();

            switch (type) {

                case "image":
                    media.images.push(url);
                    break;

                case "video":
                    media.videos.push(url);
                    break;

                case "youtube":
                    media.youtube.push(url);
                    break;

                case "model":
                    media.model3d.push(url);
                    break;
            }

        });

        if (media.images.length === 0 && currentProduct?.image) {
            media.images.push(currentProduct.image);
        }

    } catch (error) {

        console.error("Error loading media:", error);

    }

}
function renderProduct() {

    productName.textContent = currentProduct.name;

    salePrice.textContent = "Rs. " + currentProduct.price;

    originalPrice.textContent =
        currentProduct.originalPrice > 0
            ? "Rs. " + currentProduct.originalPrice
            : "";

    shortDescription.textContent = currentProduct.description;

    productIdElement.textContent = currentProduct.id;

    category.textContent = currentProduct.category;

    soldQty.textContent = currentProduct.soldQty;

}


function renderImages(){

    thumbnailStrip.innerHTML="";

    imageViewer.style.display="block";
    videoViewer.style.display="none";
    youtubeViewer.style.display="none";
    modelViewer.style.display="none";
                                       if (media.images.length > 0) {
    imageViewer.src = media.images[0];
}

    media.images.forEach((url,index)=>{

        const img=document.createElement("img");

        img.src=url;

        img.className="thumb";

        img.onclick = () => {

    imageViewer.src = url;

    document.querySelectorAll(".thumb").forEach(t=>{
        t.classList.remove("active");
    });

    img.classList.add("active");
};

        thumbnailStrip.appendChild(img);

    });

}



function renderVideos(){

    if(media.videos.length===0){

        alert("No videos available");

        return;

    }

    function changeImage(url){

    imageViewer.style.opacity=0;

    setTimeout(()=>{

        imageViewer.src=url;

        imageViewer.style.opacity=1;

    },150);

}


let currentImage=0;

function showImage(index){

    currentImage=index;

    imageViewer.src=media.images[index];
}

function nextImage(){

    currentImage++;

    if(currentImage>=media.images.length)
        currentImage=0;

    showImage(currentImage);
}

function previousImage(){

    currentImage--;

    if(currentImage<0)
        currentImage=media.images.length-1;

    showImage(currentImage);
}

    imageViewer.style.display="none";
    youtubeViewer.style.display="none";
    modelViewer.style.display="none";

    videoViewer.style.display="block";

    videoViewer.src=media.videos[0];

}

function youtubeEmbed(url){

    const id=url.split("/").pop();

    return "https://www.youtube.com/embed/"+id;

}


                              imageTab.onclick = () => {

    setActiveButton(imageTab);
    renderImages();

};
                                 videoTab.onclick = () => {

    setActiveButton(videoTab);
    renderVideos();

};

youtubeTab.onclick = () => {

    setActiveButton(youtubeTab);
    renderYoutube();

};
modelTab.onclick = () => {

    alert("3D View is not available right now.");

};


// ==============================
// INITIALIZE
// ==============================

async function init() {

    await loadProducts();

    if (!currentProduct) {

        console.error("Product not found.");

        return;

    }
                 console.log("Selected ID:", selectedProductId);
console.log("Current Product:", currentProduct);
    renderProduct();

    await loadMedia();

    renderImages();

}

init();
