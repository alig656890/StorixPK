:root{
    --primary:#ffffff;
    --secondary:#f6fbfa;
    --card:#ffffff;

    --text:#1f2937;
    --muted:#6b7280;

    /* Main Brand Color */
    --accent:#0f766e;
    --accent-2:#115e59;

    /* Light Backgrounds */
    --accent-light:#99f6e4;
    --accent-soft:#ecfdf5;

    --border:#d1fae5;

    --shadow:0 8px 22px rgba(15,118,110,.12);

    --radius:12px;
    --radius-sm:8px;
}

body{
    margin:0;
    font-family:'Ubuntu', sans-serif;
    background:var(--secondary);
    color:var(--text);
}
       .topbar-right{
    display:flex;
    align-items:center;
    gap:20px;
    flex-wrap:nowrap;   /* Keeps everything on one line */
}
  /* Top Bar */
.topbar{
    background:#fff;
    border-bottom:1px solid #eee;

   }

.topbar-content{
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:20px;
        padding:8px 45px;
}



.cat-btn{

    width:46px;

    height:46px;

    border:none;

    border-radius:50%;

    background:#0f8;

    color:#fff;

    display:flex;

    align-items:center;

    justify-content:center;

    cursor:pointer;

    transition:.3s;

}

.cat-btn:hover{

    transform:scale(1.08);

    background:#115e59;

}
.cat-btn:active{

transform:scale(.95);

}

   /* ==============================
   CATEGORY BAR
============================== */

.category-nav-wrapper{

    display:flex;
    align-items:center;
    gap:15px;

    margin:25px 0;

}

.category-scroll{

    flex:1;

    display:flex;

    gap:12px;

    overflow-x:auto;

    scroll-behavior:smooth;

    scrollbar-width:none;

    padding:8px;

}

.category-scroll::-webkit-scrollbar{
    display:none;
}

.category-pill{

    flex-shrink:0;

    border:none;

    background:#ffffff;

    color:#374151;

    padding:12px 22px;

    border-radius:999px;

    font-weight:600;

    cursor:pointer;

    white-space:nowrap;

    transition:.35s;

    box-shadow:
        0 6px 18px rgba(15,23,42,.06)

}

.category-pill:hover{

    transform:translateY(-3px);

    box-shadow:
        0 10px 30px rgba(20,184,166,.15);

}

.category-pill.active{

    background:
    linear-gradient(135deg,#0F766E,#14B8A6);

    color:#fff;

    transform:scale(1.08);

    box-shadow:
    0 12px 35px rgba(20,184,166,.35);

}

.cat-arrow{

    width:45px;

    height:45px;

    border:none;

    border-radius:50%;

    background:white;

    cursor:pointer;

    transition:.3s;

    box-shadow:
    0 8px 20px rgba(0,0,0,.08);

}

.cat-arrow:hover{

    background:#14B8A6;

    color:white;

    transform:scale(1.08);

}


.topbar-left,
.topbar-right{
    display:flex;
    align-items:center;
    gap:8px;
    white-space:nowrap;
}

/* WhatsApp */
.topbar-whatsapp{
    display:inline-flex;
    align-items:center;
    gap:6px;
    text-decoration:none;
    color:#6b7280;
    font-size:13px;
    font-weight:500;
    transition:.25s ease;
}

.topbar-whatsapp i{
    color:#25D366;
    font-size:16px;
}

.topbar-whatsapp:hover{
    color:#0f766e;
}

.topbar-whatsapp:hover i{
    transform:scale(1.08);
}

/* Contact Info */
.contact-info{
    display:flex;
    align-items:center;
    gap:10px;
}

   .place-order-btn{
    background:#0F766E;
    color:#fff;
    font-family:'Poppins', sans-serif; /* or Manrope, Inter, Outfit */
    font-size:15px;
    font-weight:600;
    letter-spacing:0.4px;

    padding:10px 22px;
    border:none;
    border-radius:10px;

    transition:all .3s ease;
}

.place-order-btn:hover{
    background:#115E59;
    color:#fff;
    transform:translateY(-2px);
    box-shadow:0 8px 20px rgba(15,118,110,.25);
}

.place-order-btn:active{
    transform:translateY(0);
}



.contact-info img,
.contact-info i {
    vertical-align: middle;
}

.contact-info span,
.contact-info a {
    line-height: 1;
}

.logo-text{
    font-family:'Ubuntu',sans-serif;
    font-size:clamp(18px,2vw,30px);
    font-weight:700;
    color:#0F766E;
    letter-spacing:0.5px;
    font-size:24px;
}

.logo-text span{
    color:#115e59;
}



       .brand-logo{
    height:52px;
    width:auto;
    object-fit:contain;
}


        /* nav bar    */
     .search-box{
    flex:1;
    min-width:180px;
    max-width:450px;
}
     .checkout-btn{
    background:#0f766e !important;
    color:#ffffff !important;

    border:none !important;
    border-radius:10px;

    font-weight:700;
    font-size:16px;

    padding:12px 20px;

    box-shadow:0 5px 15px rgba(15,118,110,.25);

    transition:.3s ease;
}

.checkout-btn:hover{
    background:#115e59 !important;
    color:#ffffff !important;

    transform:translateY(-2px);
    box-shadow:0 8px 20px rgba(15,118,110,.35);
}
.brand-link{
    text-decoration:none !important;
}

.brand-link img{
    height:clamp(26px,3vw,35px);
}

.brand-link:hover{
    text-decoration:none !important;
}


.cart-count{
    background:#0f766e !important;
    color:white;
    border-radius:50%;
    font-weight:700;
    min-width:22px;
    height:22px;
    display:inline-flex;
    align-items:center;
    justify-content:center;
}
.search-box input{
    border-radius:8px 0 0 8px;
    border:1px solid #ddd;
    min-width:0;
}

.search-btn{
    background:#0f766e;
    color:#fff;
    border:none;
    border-radius:0 8px 8px 0;
    transition:.25s;
}

.search-btn:hover{
    background:#115e59;
    color:#fff;
}

/* Search wrapper must be positioned at ALL screen sizes, not just mobile,
   since #clearSearch is position:absolute and anchors to this element. */
.search-wrapper{
    position:relative;
    display:flex;
    align-items:center;
    flex:1;
    min-width:0;
}

.search-wrapper input{
    padding-right:42px;   /* space for clear button */
}

@media(max-width:768px){

    .navbar{
                flex-wrap:wrap;
                gap:10px;
        }

        .navbar {
    background:var(--primary) !important;
    padding: 16px 28px;
    display:flex;
    align-items:center;
    justify-content:space-between;
    flex-wrap:nowrap;
        gap:8px;
}

       .search-wrapper{
    flex:1 1 220px;
    min-width:90px;
    max-width:350px;
}

      .search-wrapper input{
    width:100%;
    height:44px;
}

        .search-btn{
                margin-left:8px;
        }

}





.brand {
    font-weight: 700;
    color:var(--accent);
    font-size: 20px;
}
    #cartBox button {
    padding: 2px 8px;
    border: 1px solid #ddd;
    background: #f8f8f8;
    cursor: pointer;
    border-radius: 4px;
}
/* HERO */
.hero {
    display: flex;
    max-width: 1200px;
    margin: 20px auto;
    background:var(--primary);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 25px rgba(0,0,0,0.08);
    box-shadow:none;
}

    .category-carousel{
    display:flex;
    align-items:center;
    justify-content:center;
    gap:20px;
    margin:30px auto;
    max-width:900px;
}

.category-item{

    cursor:pointer;

    padding:12px 22px;

    border-radius:999px;

    background:white;

    color:#64748b;

    font-weight:600;

    transition:.35s;

    white-space:nowrap;

    box-shadow:0 5px 18px rgba(0,0,0,.06);

    user-select:none;

}

.category-item:hover{

    transform:translateY(-3px);

}

.category-item.side1{

    transform:scale(.92);

    opacity:.9;

}

.category-item.side2{

    transform:scale(.82);

    opacity:.55;

}

.category-item.active{

    transform:scale(1.15);

    background:linear-gradient(135deg,#0F766E,#14B8A6);

    color:white;

    font-weight:800;

    box-shadow:0 12px 35px rgba(15,118,110,.35);

}

.cat-nav-btn{

    width:48px;

    height:48px;

    border:none;

    border-radius:50%;

    background:white;

    cursor:pointer;

    box-shadow:0 8px 25px rgba(0,0,0,.08);

    transition:.3s;

}

.category-carousel-track{
    display:flex;
    justify-content:center;
    align-items:center;
    gap:14px;
    min-height:70px;
    flex:1;
    overflow-x:auto;
    scroll-behavior:smooth;
    scrollbar-width:none;
}

.category-carousel-track::-webkit-scrollbar{
    display:none;
}

.cat-nav-btn:hover{

    background:#0F766E;

    color:white;

    transform:scale(1.08);

}

/* SIDEBAR */
.sidebar {
    width: 220px;
    border-right: 1px solid #eee;
    background:var(--primary);
}

.sidebar button {
    width:100%;
    padding:16px 12px;
    border:none;
    background:white;
    text-align:center;
    transition:.3s ease;

    font-size:16px;
    font-weight:700;
    letter-spacing:.3px;
    color:#374151;

    position:relative;
}
       #clearSearch{
    position:absolute;
    right:10px;
    top:50%;
    transform:translateY(-50%);
    width:28px;
    height:28px;
    border:none;
    border-radius:50%;
    background:#0f766e;
    color:#fff;
    cursor:pointer;

    display:none;

    justify-content:center;
    align-items:center;

    transition:.25s;
}

#clearSearch:hover{
    background:#115e59;
    transform:translateY(-50%) scale(1.08);
}

#clearSearch i{
    font-size:12px;
}

.sidebar button:hover{
    background:#ecfdf5;
    color:#0f766e;
    transform:translateX(4px);
}
        .free-delivery-btn{

    margin:0 6px;

    padding:8px 12px;

    border:none;
    border-radius:30px;

    background:linear-gradient(135deg,#ff9800,#ff5722);

    color:#fff;

    font-size:12px;
    font-weight:700;

    white-space:nowrap;

    cursor:pointer;

    animation:deliveryBlink 1.2s infinite;

    box-shadow:0 0 18px rgba(255,87,34,.45);

    transition:.3s;
}
.delivery-modal{

    position:fixed;
    inset:0;

    background:rgba(0,0,0,.55);

    display:none;

    justify-content:center;
    align-items:center;

    z-index:999999;

    backdrop-filter:blur(6px);

}

.delivery-popup{

    width:460px;
    max-width:92%;

    background:#fff;

    border-radius:24px;

    padding:35px;

    text-align:center;

    position:relative;

    animation:popup .35s ease;

    box-shadow:
    0 30px 70px rgba(0,0,0,.18);

}

.delivery-close{

    position:absolute;
    right:18px;
    top:15px;

    width:36px;
    height:36px;

    border:none;
    border-radius:50%;

    background:#f3f4f6;

    font-size:24px;

    cursor:pointer;

    transition:.3s;

}

.delivery-close:hover{

    background:#0f766e;
    color:#fff;

}

.delivery-icon{

    width:80px;
    height:80px;

    margin:auto;

    border-radius:50%;

    background:#ecfdf5;

    display:flex;
    align-items:center;
    justify-content:center;

    font-size:42px;

    animation:floatIcon 2s infinite;

}



.delivery-popup h2{

    margin-top:20px;

    color:#0f766e;

    font-size:30px;

    font-weight:800;

}

.delivery-line{

    width:70px;
    height:4px;

    background:#0f766e;

    margin:15px auto 25px;

    border-radius:20px;

}

.delivery-popup p{

    color:#555;

    line-height:1.8;

    margin-bottom:15px;

}

.delivery-badge{

    display:inline-block;

    margin:12px 0 25px;

    padding:10px 20px;

    background:#ecfdf5;

    color:#0f766e;

    font-weight:700;

    border-radius:30px;

}


.delivery-ok{

    flex:1;

    height:54px;

    border:none;

    border-radius:12px;

    background:#0f766e;

    color:#fff;

    font-size:16px;

    font-weight:700;

    cursor:pointer;

    transition:.3s;

}
.delivery-ok:hover{

    background:#115e59;

    transform:translateY(-2px);

}
    .delivery-actions{

    display:flex;

    align-items:center;

    gap:12px;

    margin-top:25px;

}
        /* Daraz Icon Button */

.daraz-popup-btn{

    width:54px;

    height:54px;

    flex-shrink:0;

    display:flex;

    align-items:center;

    justify-content:center;

    border-radius:12px;

    background:#fff;

    border:2px solid #0f766e;

    text-decoration:none;

    transition:.3s;

}

.daraz-popup-btn:hover{

    background:#ecfdf5;

    transform:translateY(-2px) scale(1.08);

    box-shadow:0 8px 20px rgba(15,118,110,.25);

}

/* Spinning Icon */


@keyframes popup{

    from{

        opacity:0;

        transform:translateY(25px) scale(.9);

    }

    to{

        opacity:1;

        transform:translateY(0) scale(1);

    }

}

@keyframes floatIcon{

    0%,100%{

        transform:translateY(0);

    }

    50%{

        transform:translateY(-8px);

    }

}
.custom-navbar{
    display:grid;
    grid-template-columns:auto 1fr auto;
    align-items:center;
    gap:20px;
    padding:14px 24px;
}
.navbar,
.custom-navbar{
    background:transparent !important;
    box-shadow:none !important;
    border:none !important;
}

.free-delivery-btn:hover{

    transform:translateY(-2px) scale(1.05);

    box-shadow:0 0 28px rgba(255,87,34,.8);

}

@keyframes deliveryBlink{

    0%{
        transform:scale(1);
        box-shadow:0 0 8px rgba(255,87,34,.35);
    }

    50%{
        transform:scale(1.08);
        box-shadow:0 0 28px rgba(255,87,34,.95);
    }

    100%{
        transform:scale(1);
        box-shadow:0 0 8px rgba(255,87,34,.35);
    }
}

@media(max-width:768px){

    .free-delivery-btn{

        width:100%;
        margin-top:10px;
        order:4;

    }

}

.sidebar button.active{
    background:linear-gradient(
        135deg,
        #ecfdf5,
        #ccfbf1
    );

    color:#0f766e;

    box-shadow:
        inset 4px 0 0 #0f766e,
        0 4px 12px rgba(15,118,110,.12);

    transform:translateX(4px);
}


.sidebar button.active::after{
    content:"";
    position:absolute;
    right:12px;
    top:50%;
    transform:translateY(-50%);

    width:7px;
    height:7px;
    border-radius:50%;

    background:#0f766e;
}

/* SLIDER */
.slider {
    flex: 1;
    height: 300px;
    position: relative;
    overflow: hidden;
}


.slides > div{

    min-width:100%;

    height:300px;

    display:flex;

    justify-content:center;

    align-items:center;

    position:relative;

}


.slides {
    display: flex;
    transition: transform 0.5s ease-in-out;
}

.slides img{

    width:100%;

    height:300px;

    object-fit:cover;

    object-position:center;

    background:#f8fafc;

}


.overlay {
    position: absolute;
    top: 50%;
    left: 40px;
    transform: translateY(-50%);
    color: white;
}
       .product-card{
    background:#fff;
    border-radius:18px;
    border:1px solid #e5e7eb;
    overflow:hidden;
    position:relative;
    transition:.35s;
    box-shadow:0 4px 15px rgba(0,0,0,.06);
    height:100%;
    display:flex;
    flex-direction:column;
}

.product-card:hover{
    transform:translateY(-6px);
    box-shadow:0 18px 35px rgba(15,118,110,.18);
    border-color:#0f766e;
}


         .remove-cart-btn{
    border:none;
    background:#f0fdfa;
    color:#0f766e;
    width:26px;
    height:26px;
    border-radius:50%;
    font-size:14px;
    font-weight:700;
    cursor:pointer;
    display:flex;
    align-items:center;
    justify-content:center;
    transition:.25s;
}

.remove-cart-btn:hover{
    background:#0f766e;
    color:white;
    transform:scale(1.1);
}

.daraz-icon{
    width:20px;
    height:20px;
    filter:
        grayscale(1)
        brightness(0.7)
        sepia(1)
        hue-rotate(125deg)
        saturate(4);
    transition:.25s;
}

.daraz-btn:hover .daraz-icon{
    transform:scale(1.15);
}
    .product-card img{

    width:100%;
    height:220px;

    object-fit:contain;

    background:#f8fafc;

    padding:18px;

    border-bottom:1px solid #edf2f7;
}

         .product-image{
    position:relative;
    overflow:hidden;
    border-radius:12px;
}

.product-image img{
    width:100%;
    height:160px;
    object-fit:cover;
    display:block;
}
.product-image-box{
    position:relative;
    width:100%;
    height:220px;
    overflow:hidden;
    display:flex;
    justify-content:center;
    align-items:center;
}

.product-image-box img{
    width:100%;
    height:100%;
    object-fit:contain;
}

.discount-badge{
    position:absolute;
    top:10px;
    left:10px;
    opacity: 0;
    width:52px;
    height:52px;
    transform: translateY(-10px);
    transition: all .3s ease;
    pointer-events: none;

    border-radius:50%;
    background:#ff3b30;
    color:white;

    display:flex;
    flex-direction:column;
    justify-content:center;
    align-items:center;

    z-index:100;
}

/* Show on hover */
.product-card:hover .discount-badge{
    opacity: 1;
    transform: translateY(0);
}

/* Show when card receives focus (mobile accessibility) */
.product-card:focus-within .discount-badge{
    opacity: 1;
    transform: translateY(0);
}

.discount-percent{
    font-size:15px;
    font-weight:700;
    line-height:1;
}

.discount-text{
    font-size:10px;
    line-height:1;
}
.product-card .btn{
    background:#0f766e !important;
    color:#fff !important;
    border:none !important;
    border-radius:10px;
    padding:10px 16px;
    font-weight:600;
    transition:.25s;
}

.product-card .btn:hover{
    background:#115e59 !important;
    color:#fff !important;
}

.product-card button:active{
    transform:scale(.98);
}
.phone-link{
    display:flex;
    align-items:center;
    gap:8px;
    color:#0f766e !important;
    text-decoration:none;
    font-weight:600;
    transition:.25s;
}

.phone-link:hover{
    color:#115e59 !important;
    text-decoration:none;
}
.overlay h2 {
    font-size: 34px;
    font-weight: 700;
     color:#fff;
}






.shop-btn {
  background:#f1f5f9;   /* very light grey-blue */
color:#334155;        /* slate text */
border:1px solid #e2e8f0;

    padding: 10px 18px;

}


/* NAV BUTTONS */
.prev, .next {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0,0,0,0.4);
    border: none;
    color: white;
    padding: 10px;
    cursor: pointer;
}
.prev { left: 10px; }
.next { right: 10px; }

/* DOTS */
.dots {
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 6px;
}
.dots span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255,255,255,0.5);
}

.offer-marquee{

    width:100%;

    overflow:hidden;

    background:linear-gradient(90deg,#ff5722,#ff9800);

    color:#fff;

    border-radius:40px;

    padding:12px 0;

    margin:20px 0;

    box-shadow:0 8px 20px rgba(255,87,34,.25);

}


.daraz-popup-icon{

    width:34px;

    height:34px;

    animation:darazPulse 2s infinite;

}

@keyframes darazPulse{

    0%{

        transform:scale(1) rotate(0deg);

    }

    25%{

        transform:scale(1.15) rotate(10deg);

    }

    50%{

        transform:scale(1.25) rotate(-10deg);

    }

    75%{

        transform:scale(1.15) rotate(10deg);

    }

    100%{

        transform:scale(1) rotate(0deg);

    }

}
.offer-track{

    display:inline-block;

    white-space:nowrap;

    padding-left:100%;

    animation:scrollOffer 18s linear infinite;

    font-size:15px;

    font-weight:700;

    letter-spacing:.4px;

}

.offer-track strong{

    color:#fff700;

    font-size:17px;

}

.offer-marquee:hover .offer-track{

    animation-play-state:paused;

}

@keyframes scrollOffer{

    from{
        transform:translateX(0);
    }

    to{
        transform:translateX(-100%);
    }

}
.dots span.active {
    background: white;
}





/* Search section */



/* Keep search input filling the wrapper */


    .place-order-btn{
        white-space:nowrap;
        padding:8px 12px;
        font-size:13px;
    }


    .free-delivery-btn,
.place-order-btn,
.cart-btn,
.brand-link{
    flex-shrink:0;
}

    .search-container {
        order: 100;        /* Move search to the next row */
        width: 100%;
        margin-top: 10px;
    }

    .search-container input {
        width: 100%;
    }

        /* MOBILE */
@media(max-width:768px){
    .hero { flex-direction: column; }
    .sidebar { display:flex; overflow-x:auto; }
    .sidebar button { flex:1; text-align:center; }
}
