// Products Page Logic
let currentPage = 1;
let currentFilters = {};
let allProducts = [];
let categories = [];

// Toggle mobile filters sidebar
function toggleMobileFilters() {
    const sidebar = document.querySelector('.products-sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

async function initProductsPage() {
    await loadCategories();
    await loadProducts();
}

async function loadCategories() {
    const result = await api.getCategories();
    if (result.success) {
        categories = result.categories.filter(c => c.type === 'category');
        renderCategoryFilters();
        populateCategorySelect();
    }
}

function renderCategoryFilters() {
    const container = document.getElementById('categoryFilters');
    if (!container) return;

    container.innerHTML = categories.map(cat => `
        <label class="filter-option">
            <input type="checkbox" name="category" value="${cat.name}" onchange="applyFilters()">
            ${cat.name}
        </label>
    `).join('');
}

function populateCategorySelect() {
    const select = document.getElementById('category');
    if (!select) return;

    select.innerHTML = '<option value="">Toutes les catégories</option>' +
        categories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');
}

async function loadProducts(page = 1) {
    currentPage = page;
    const grid = document.getElementById('productsGrid');
    const countEl = document.getElementById('productsCount');

    grid.innerHTML = '<div class="skeleton skeleton-image"></div>'.repeat(8);

    const filters = getFilters();
    const result = await api.searchProducts(filters.query, {
        category: filters.category,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        sortBy: filters.sortBy,
        page: page,
        limit: 12
    });

    if (result.success) {
        allProducts = result.products;
        renderProducts(result.products);
        countEl.textContent = `Affichage de ${result.products.length} sur ${result.pagination?.total || result.products.length} produits`;

        if (result.pagination) {
            renderPagination(result.pagination);
        }
    } else {
        grid.innerHTML = '<div class="empty-state"><i class="fa-solid fa-box-open"></i><h3>Aucun produit trouvé</h3></div>';
        countEl.textContent = '0 produits';
    }
}

function getFilters() {
    const checkedCategories = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(el => el.value);
    const minPrice = document.getElementById('minPrice')?.value;
    const maxPrice = document.getElementById('maxPrice')?.value;
    const sortBy = document.getElementById('sortBy')?.value;
    const urlParams = new URLSearchParams(window.location.search);

    return {
        query: urlParams.get('q') || '',
        category: checkedCategories.length === 1 ? checkedCategories[0] : '',
        minPrice: minPrice || null,
        maxPrice: maxPrice || null,
        sortBy: sortBy || 'date'
    };
}

function applyFilters() {
    loadProducts(1);
}

function renderProducts(products) {
    const grid = document.getElementById('productsGrid');

    if (products.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:60px 20px;">
                <i class="fa-solid fa-box-open" style="font-size:64px;color:#e2e8f0 !important;margin-bottom:20px;display:block;"></i>
                <h3 style="font-size:20px;color:#1e293b;margin-bottom:8px;">Aucun produit trouvé</h3>
                <p style="color:#64748b;font-size:14px;">Essayez d'ajuster vos filtres</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = products.map(product => createProductCard(product)).join('');
}

// Create enhanced product card
function createProductCard(product) {
    const isInCart = cart.isInCart(product._id);
    const isInWishlist = wishlist.isInWishlist(product._id);
    const discount = UI.getDiscountPercent(product.oldPrice, product.price);
    const imageUrl = product.image?.[0] || product.img || 'img/placeholder.png';
    const rating = product.rating || 0;
    const reviewCount = product.reviewCount || 0;

    return `
        <div style="background:white;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;transition:all 0.3s;cursor:pointer;display:flex;flex-direction:column;height:100%;"
             onmouseover="this.style.boxShadow='0 8px 25px rgba(0,0,0,0.1)';this.style.transform='translateY(-4px)';"
             onmouseout="this.style.boxShadow='none';this.style.transform='translateY(0)';"
             onclick="window.location.href='product.html?id=${product._id}'">
            
            <!-- Image Container -->
            <div style="position:relative;aspect-ratio:1/1;background:#f8fafc;overflow:hidden;">
                ${discount > 0 ? `
                    <span style="position:absolute;top:10px;left:10px;background:linear-gradient(135deg,#ef4444,#dc2626);color:white;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:700;z-index:3;">
                        -${discount}%
                    </span>
                ` : ''}
                
                <button onclick="event.stopPropagation();toggleProductWishlist('${product._id}',this);" 
                    data-id="${product._id}"
                    class="wishlist_btn"
                    style="position:absolute;top:10px;right:10px;width:36px;height:36px;background:white;border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.1);z-index:3;transition:all 0.2s;"
                    onmouseover="this.style.transform='scale(1.1)';"
                    onmouseout="this.style.transform='scale(1)';">
                    <i class="fa-${isInWishlist ? 'solid' : 'regular'} fa-heart" style="font-size:16px;color:${isInWishlist ? '#ef4444' : '#64748b'} !important;"></i>
                </button>
                
                <img src="${imageUrl}" alt="${product.name}" 
                     style="width:100%;height:100%;object-fit:contain;padding:15px;transition:transform 0.3s;"
                     onmouseover="this.style.transform='scale(1.05)';"
                     onmouseout="this.style.transform='scale(1)';">
            </div>
            
            <!-- Content -->
            <div style="padding:14px;display:flex;flex-direction:column;flex:1;gap:8px;">
                <!-- Product Name -->
                <h3 style="margin:0;font-size:14px;font-weight:500;color:#1e293b;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:40px;">
                    ${product.name}
                </h3>
                
                <!-- Rating -->
                ${reviewCount > 0 ? `
                    <div style="display:flex;align-items:center;gap:6px;">
                        <div style="display:flex;gap:1px;">
                            ${getStarsHTML(rating)}
                        </div>
                        <span style="font-size:12px;color:#64748b;">(${reviewCount})</span>
                    </div>
                ` : ''}
                
                <!-- Price -->
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                    <span style="font-size:18px;font-weight:700;color:#2563eb;">${UI.formatPrice(product.price)}</span>
                    ${product.oldPrice ? `<span style="font-size:14px;color:#94a3b8;text-decoration:line-through;">${UI.formatPrice(product.oldPrice)}</span>` : ''}
                </div>
                
                <!-- Buttons -->
                <div style="display:flex;gap:8px;margin-top:auto;padding-top:10px;">
                    <button onclick="event.stopPropagation();quickBuyNow('${product._id}');"
                        style="flex:1;padding:10px 8px;background:linear-gradient(135deg,#1e3a8a,#1e40af);color:white;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:4px;"
                        onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(30,64,175,0.3)';"
                        onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='none';">
                        <span style="color:white;">Acheter</span>
                    </button>
                    
                    <button onclick="event.stopPropagation();toggleProductCart('${product._id}',this);"
                        data-id="${product._id}"
                        class="btn_add_cart"
                        style="flex:1;padding:10px 8px;background:${isInCart ? '#16a34a' : '#2563eb'};color:white;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:4px;"
                        onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(37,99,235,0.3)';"
                        onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='none';">
                        <i class="fa-solid fa-${isInCart ? 'check' : 'cart-plus'}" style="font-size:12px;color:white !important;"></i>
                        <span style="color:white;">${isInCart ? 'Ajouté' : 'Ajouter'}</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Generate stars HTML
function getStarsHTML(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) {
            html += '<i class="fa-solid fa-star" style="font-size:11px;color:#fbbf24 !important;"></i>';
        } else if (i - 0.5 <= rating) {
            html += '<i class="fa-solid fa-star-half-stroke" style="font-size:11px;color:#fbbf24 !important;"></i>';
        } else {
            html += '<i class="fa-regular fa-star" style="font-size:11px;color:#e2e8f0 !important;"></i>';
        }
    }
    return html;
}

// Toggle wishlist for product card
function toggleProductWishlist(productId, btn) {
    const product = allProducts.find(p => p._id === productId);
    if (!product) return;
    
    if (wishlist.isInWishlist(productId)) {
        wishlist.removeItem(productId);
    } else {
        wishlist.addItem(product);
    }
}

// Toggle cart for product card
function toggleProductCart(productId, btn) {
    const product = allProducts.find(p => p._id === productId);
    if (!product) return;
    
    if (cart.isInCart(productId)) {
        cart.removeItem(productId);
    } else {
        cart.addItem(product);
    }
}

// Quick buy now
function quickBuyNow(productId) {
    const product = allProducts.find(p => p._id === productId);
    if (product && !cart.isInCart(productId)) {
        cart.addItem(product);
    }
    window.location.href = 'checkout.html';
}

function renderPagination(pagination) {
    const container = document.getElementById('pagination');
    if (!container || pagination.pages <= 1) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = UI.createPagination(pagination.page, pagination.pages, 'loadProducts');
}

function changePage(page) {
    loadProducts(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initProductsPage);
