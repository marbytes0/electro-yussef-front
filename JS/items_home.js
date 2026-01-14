// Homepage Products - Fetch from API
let homeCategories = [];

async function initHomepage() {
    await loadCategories();
    await loadProducts();
    await loadAllBanners();
}

async function loadCategories() {
    try {
        const result = await api.getCategories();
        if (result.success && result.categories) {
            homeCategories = result.categories.filter(c => c.type === 'category');

            // Populate search dropdown
            const searchSelect = document.getElementById('searchCategory');
            if (searchSelect) {
                searchSelect.innerHTML = '<option value="">All Categories</option>' +
                    homeCategories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');
            }

            // Populate category nav
            const categoryNav = document.getElementById('categoryNavList');
            if (categoryNav) {
                categoryNav.innerHTML = homeCategories.slice(0, 7).map(cat =>
                    `<a href="products.html?category=${encodeURIComponent(cat.name)}">${cat.name}</a>`
                ).join('');
            }

            // Populate footer categories
            const footerCats = document.getElementById('footerCategories');
            if (footerCats) {
                footerCats.innerHTML = homeCategories.slice(0, 5).map(cat =>
                    `<a href="products.html?category=${encodeURIComponent(cat.name)}"><i class="fa-solid fa-caret-right"></i> ${cat.name}</a>`
                ).join('');
            }
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadProducts() {
    try {
        const result = await api.getProducts();
        if (result.success && result.products) {
            const products = result.products;

            // Hot Deals - products with oldPrice (discount)
            const hotDeals = products.filter(p => p.oldPrice && p.oldPrice > p.price);
            if (hotDeals.length > 0) {
                renderProductSlider('swiper_items_sale', hotDeals.slice(0, 12));
            } else {
                // If no hot deals, show newest products
                renderProductSlider('swiper_items_sale', products.slice(0, 12));
            }

            // Dynamic category sections
            renderCategorySections(products);
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Render dynamic category sections
function renderCategorySections(products) {
    const container = document.getElementById('categorySections');
    if (!container) return;

    // Group products by category
    const productsByCategory = {};
    products.forEach(product => {
        const category = product.category || 'Other';
        if (!productsByCategory[category]) {
            productsByCategory[category] = [];
        }
        productsByCategory[category].push(product);
    });

    // Get categories that have products (limit to first 6 categories)
    const categoriesWithProducts = homeCategories
        .filter(cat => productsByCategory[cat.name] && productsByCategory[cat.name].length > 0)
        .slice(0, 6);

    // If no categories from backend, use the product categories directly
    let categoriesToShow = categoriesWithProducts;
    if (categoriesToShow.length === 0) {
        categoriesToShow = Object.keys(productsByCategory)
            .filter(cat => productsByCategory[cat].length > 0)
            .slice(0, 6)
            .map(name => ({ name }));
    }

    // Generate HTML for each category section
    container.innerHTML = categoriesToShow.map((cat, index) => {
        const categoryProducts = productsByCategory[cat.name] || [];
        if (categoryProducts.length === 0) return '';

        const sliderId = `swiper_category_${index}`;

        return `
            <div class="slider_products slide">
                <div class="container">
                    <div class="slide_product mySwiper" data-category-slider="${sliderId}">
                        <div class="top_slide">
                            <h2><i class="fa-solid fa-tags"></i> ${cat.name}</h2>
                            <a href="products.html?category=${encodeURIComponent(cat.name)}" class="view_all_link">Voir tout <i class="fa-solid fa-arrow-right"></i></a>
                        </div>
                        <div class="products swiper-wrapper" id="${sliderId}"></div>
                        <div class="swiper-button-next btn_Swip"></div>
                        <div class="swiper-button-prev btn_Swip"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Render products for each category
    categoriesToShow.forEach((cat, index) => {
        const categoryProducts = productsByCategory[cat.name] || [];
        const sliderId = `swiper_category_${index}`;
        renderProductSlider(sliderId, categoryProducts.slice(0, 12));
    });
}

function renderProductSlider(containerId, products) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = '<p style="padding:20px;color:var(--p_color);">No products available</p>';
        return;
    }

    container.innerHTML = products.map(product => {
        const isInCart = cart.isInCart(product._id);
        const isInWishlist = wishlist.isInWishlist(product._id);
        const discount = UI.getDiscountPercent(product.oldPrice, product.price);
        const imageUrl = product.image?.[0] || 'img/placeholder.png';

        return `
            <div class="swiper-slide product" data-id="${product._id}">
                ${discount > 0 ? `<span class="sale_present">-${discount}%</span>` : ''}
                <div class="img_product">
                    <a href="product.html?id=${product._id}">
                        <img src="${imageUrl}" alt="${product.name}">
                    </a>
                    <button class="wishlist_btn ${isInWishlist ? 'active' : ''}" data-id="${product._id}" onclick="handleProductClick(event, '${product._id}', 'wishlist')">
                        <i class="fa-${isInWishlist ? 'solid' : 'regular'} fa-heart" style="color:${isInWishlist ? '#ef4444' : '#6b7280'} !important;"></i>
                    </button>
                </div>
                <div class="product_content">
                    <div class="stars">${UI.getStarsHTML(product.rating || 5)}</div>
                    <p class="name_product">
                        <a href="product.html?id=${product._id}">${UI.truncateText(product.name, 50)}</a>
                    </p>
                    <div class="price">
                        <p>${UI.formatPrice(product.price)}</p>
                        ${product.oldPrice ? `<p class="old_price">${UI.formatPrice(product.oldPrice)}</p>` : ''}
                    </div>
                    <div class="icons" style="display:flex;gap:8px;flex-wrap:wrap;width:100%;">
                        <span class="btn_buy_now" data-id="${product._id}" onclick="handleBuyNow(event, '${product._id}')" style="font-size:12px;padding:10px 12px;background:linear-gradient(135deg,#1e3a8a,#1e40af);color:white;border:none;border-radius:6px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;flex:1;transition:all 0.2s;font-weight:600;">
                            Acheter
                        </span>
                        <span class="btn_add_cart ${isInCart ? 'active' : ''}" data-id="${product._id}" onclick="handleProductClick(event, '${product._id}', 'cart')" style="font-size:12px;padding:10px 12px;background:${isInCart ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'linear-gradient(135deg,#2563eb,#1d4ed8)'};color:white;border:none;border-radius:6px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;flex:1;transition:all 0.2s;font-weight:600;">
                            <i class="fa-solid fa-${isInCart ? 'check' : 'cart-plus'}" style="font-size:12px;color:white !important;"></i>
                            <span style="color:white !important;">${isInCart ? 'Ajouté' : 'Ajouter'}</span>
                        </span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Reinitialize swiper after content is loaded
    initSwipers();
}

// Store products for click handlers
let allProducts = [];

async function handleProductClick(event, productId, action) {
    event.preventDefault();
    event.stopPropagation();

    // Get product from API if not cached
    let product = allProducts.find(p => p._id === productId);
    if (!product) {
        const result = await api.getProduct(productId);
        if (result.success) {
            product = result.product;
        }
    }

    if (!product) return;

    if (action === 'cart') {
        if (cart.isInCart(productId)) {
            cart.removeItem(productId);
        } else {
            cart.addItem(product);
        }
    } else if (action === 'wishlist') {
        if (wishlist.isInWishlist(productId)) {
            wishlist.removeItem(productId);
        } else {
            wishlist.addItem(product);
        }
    }
}

function initSwipers() {
    // Reinitialize all product swipers
    document.querySelectorAll('.slide_product.mySwiper').forEach(el => {
        new Swiper(el, {
            slidesPerView: 2,
            spaceBetween: 10,
            navigation: {
                nextEl: el.querySelector('.swiper-button-next'),
                prevEl: el.querySelector('.swiper-button-prev'),
            },
            breakpoints: {
                450: { slidesPerView: 2, spaceBetween: 15 },
                768: { slidesPerView: 3, spaceBetween: 20 },
                1024: { slidesPerView: 4, spaceBetween: 20 },
                1200: { slidesPerView: 5, spaceBetween: 20 },
            }
        });
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Cache all products
    const result = await api.getProducts();
    if (result.success) {
        allProducts = result.products;
    }
    await initHomepage();
    
    // Hide loader after content is loaded
    hidePageLoader();
});

// Hide page loader
function hidePageLoader() {
    const loader = document.getElementById('pageLoader');
    if (loader) {
        loader.classList.add('hidden');
        // Remove from DOM after animation
        setTimeout(() => {
            loader.remove();
        }, 300);
    }
}

// Default promo banners (fallback)
const defaultPromoBanners = [
    {
        title: "Super Offres",
        subtitle: "Achetez Maintenant",
        discountPercent: 70,
        buttonText: "Profitez",
        image: "img/banner3_1.png",
        link: "products.html"
    },
    {
        title: "Super Offres",
        subtitle: "Découvrir",
        discountPercent: 50,
        buttonText: "Profitez",
        image: "img/banner3_2.png",
        link: "products.html"
    },
    {
        title: "Ventes Flash",
        subtitle: "Top Choix",
        discountPercent: 40,
        buttonText: "Profitez",
        image: "img/banner3_3.png",
        link: "products.html"
    },
    {
        title: "Ventes Flash",
        subtitle: "Temps Limité",
        discountPercent: 60,
        buttonText: "Profitez",
        image: "img/banner3_4.png",
        link: "products.html"
    }
];

// Default hero banners (fallback)
const defaultHeroBanners = [
    { image: "img/banner_home1.png", link: "products.html" },
    { image: "img/banner_home2.png", link: "products.html" }
];

// Default side banner (fallback)
const defaultSideBanner = { image: "img/banner_home3.png", link: "products.html" };

// Default category banners (fallback)
const defaultCategoryBanners = [
    { image: "img/banner_box4.jpg", link: "products.html", position: 0 },
    { image: "img/banner_box5.jpg", link: "products.html", position: 1 },
    { image: "img/banner_box1.jpg", link: "products.html", position: 2 },
    { image: "img/banner_box2.jpg", link: "products.html", position: 3 },
    { image: "img/banner_box3.jpg", link: "products.html", position: 4 }
];

// Load all banners from API
async function loadAllBanners() {
    await loadHeroBanners();
    await loadSideBanner();
    await loadPromoBanners();
    await loadCategoryBanners();
}

// Load hero slider banners
async function loadHeroBanners() {
    const container = document.getElementById('heroSlider');
    if (!container) return;

    try {
        const result = await api.getBanners('hero');
        let banners = defaultHeroBanners;

        if (result.success && result.banners && result.banners.length > 0) {
            banners = result.banners;
        }

        container.innerHTML = banners.map(banner => `
            <div class="swiper-slide">
                <a href="${banner.link || 'products.html'}">
                    <img src="${banner.image}" alt="${banner.title || 'Banner'}">
                </a>
            </div>
        `).join('');

        // Reinitialize hero swiper
        new Swiper('.slide-swp.mySwiper', {
            loop: true,
            autoplay: { delay: 5000, disableOnInteraction: false },
            pagination: { el: '.swiper-pagination', clickable: true }
        });
    } catch (error) {
        console.error('Error loading hero banners:', error);
    }
}

// Load side banner (next to hero slider)
async function loadSideBanner() {
    const container = document.querySelector('.banner_2');
    if (!container) return;

    try {
        const result = await api.getBanners('side');
        let banner = defaultSideBanner;

        if (result.success && result.banners && result.banners.length > 0) {
            banner = result.banners[0];
        }

        container.innerHTML = `
            <a href="${banner.link || 'products.html'}">
                <img src="${banner.image}" alt="${banner.title || 'Banner'}">
            </a>
        `;
    } catch (error) {
        console.error('Error loading side banner:', error);
    }
}

// Load promo banners from API with fallback
async function loadPromoBanners() {
    const container = document.getElementById('promoBanners');
    if (!container) return;

    try {
        const result = await api.getBanners('promo');
        let banners = defaultPromoBanners;

        if (result.success && result.banners && result.banners.length > 0) {
            banners = result.banners;
        }

        renderPromoBanners(container, banners);
    } catch (error) {
        console.error('Error loading promo banners:', error);
        renderPromoBanners(container, defaultPromoBanners);
    }
}

// Render promo banners with fixed format
function renderPromoBanners(container, banners) {
    container.innerHTML = banners.map(banner => `
        <div class="box">
            <a href="${banner.link || 'products.html'}" class="link_btn"></a>
            <img src="${banner.image}" alt="${banner.title}">
            <div class="text">
                <h5>${banner.title}</h5>
                <h5>${banner.subtitle}</h5>
                <div class="sale"><p>Jusqu'à</p><span>${banner.discountPercent}%</span></div>
                <h6>${banner.buttonText || 'Acheter'}</h6>
            </div>
        </div>
    `).join('');
}

// Load category banners (2-row and 3-row sections)
async function loadCategoryBanners() {
    const banner2Container = document.querySelector('.banner_2_img');
    const banner3Container = document.querySelector('.banner_3_img');

    if (!banner2Container && !banner3Container) return;

    try {
        const result = await api.getBanners('category');
        let banners = defaultCategoryBanners;

        if (result.success && result.banners && result.banners.length > 0) {
            banners = result.banners.sort((a, b) => a.position - b.position);
        }

        // First 2 banners go to 2-row section
        if (banner2Container) {
            const twoBanners = banners.filter(b => b.position <= 1);
            banner2Container.innerHTML = twoBanners.map(banner => `
                <a href="${banner.link || 'products.html'}" class="box">
                    <img src="${banner.image}" alt="${banner.title || 'Banner'}">
                </a>
            `).join('');
        }

        // Next 3 banners go to 3-row section
        if (banner3Container) {
            const threeBanners = banners.filter(b => b.position >= 2 && b.position <= 4);
            banner3Container.innerHTML = threeBanners.map(banner => `
                <a href="${banner.link || 'products.html'}" class="box">
                    <img src="${banner.image}" alt="${banner.title || 'Banner'}">
                </a>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading category banners:', error);
    }
}

// Handle Buy Now functionality
function handleBuyNow(event, productId) {
    event.preventDefault();
    event.stopPropagation();

    // Add to cart first
    const product = allProducts.find(p => p._id === productId);
    if (product && !cart.isInCart(productId)) {
        cart.addItem(product);
    }

    // Redirect to checkout
    window.location.href = 'checkout.html';
}
