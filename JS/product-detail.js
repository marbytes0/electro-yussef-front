// Product Detail Page Logic - Shopify Style
let currentProduct = null;
let selectedQuantity = 1;
let relatedProducts = [];
let productReviews = [];
let reviewDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

// Initialize page
async function initProductPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        window.location.href = 'products.html';
        return;
    }

    await loadProduct(productId);
    initTabs();
    loadRecentlyViewed();
}

// Load product data
async function loadProduct(productId) {
    const result = await api.getProduct(productId);

    if (result.success && result.product) {
        currentProduct = result.product;
        renderProduct(result.product);
        await loadProductReviews(productId);
        renderTabs(result.product);
        loadRelatedProducts(result.product.category);
        saveToRecentlyViewed(result.product);
        api.incrementViews(productId);
    } else {
        document.getElementById('productContent').innerHTML = `
            <div class="empty-state" style="width:100%;grid-column:1/-1;text-align:center;padding:60px 20px;">
                <i class="fa-solid fa-box-open" style="font-size:64px;color:#e2e8f0 !important;margin-bottom:20px;"></i>
                <h3 style="font-size:24px;margin-bottom:10px;">Produit introuvable</h3>
                <p style="color:#64748b;margin-bottom:20px;">Le produit que vous recherchez n'existe pas.</p>
                <a href="products.html" class="btn">Voir les produits</a>
            </div>
        `;
    }
}

// Load reviews from database
async function loadProductReviews(productId) {
    try {
        const result = await api.getProductReviews(productId, 1, 20);
        if (result.success) {
            productReviews = result.reviews || [];
            reviewDistribution = result.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
        productReviews = [];
    }
}

// Render main product section
function renderProduct(product) {
    document.title = `${product.name} | Electro Youssef`;
    document.getElementById('productName').textContent = product.name;
    document.getElementById('productCategory').textContent = product.category || 'Produit';

    const discount = UI.getDiscountPercent(product.oldPrice, product.price);
    const isInCart = cart.isInCart(product._id);
    const isInWishlist = wishlist.isInWishlist(product._id);
    const mainImage = product.image?.[0] || 'img/placeholder.png';
    const rating = product.rating || 0;
    const reviewCount = product.reviewCount || 0;

    // Stock status
    let stockBg = '#f0fdf4';
    let stockColor = '#16a34a';
    let stockBorder = '#bbf7d0';
    let stockText = `En stock (${product.stock || 99} disponibles)`;
    let stockIcon = 'check-circle';
    if (product.stock <= 0) {
        stockBg = '#fef2f2';
        stockColor = '#dc2626';
        stockBorder = '#fecaca';
        stockText = 'Rupture de stock';
        stockIcon = 'circle-xmark';
    } else if (product.stock <= 5) {
        stockBg = '#fffbeb';
        stockColor = '#d97706';
        stockBorder = '#fde68a';
        stockText = `Plus que ${product.stock} en stock - Commandez vite !`;
        stockIcon = 'triangle-exclamation';
    }

    document.getElementById('productContent').innerHTML = `
        <!-- Gallery - removed sticky on mobile -->
        <div class="product-gallery-container">
            <div style="position:relative;background:#f8fafc;border-radius:16px;overflow:hidden;margin-bottom:16px;border:1px solid #e2e8f0;">
                ${discount > 0 ? `<span style="position:absolute;top:16px;left:16px;background:linear-gradient(135deg,#ef4444,#dc2626);color:white;padding:8px 16px;border-radius:8px;font-weight:700;font-size:14px;z-index:5;">-${discount}%</span>` : ''}
                <button onclick="toggleWishlist()" id="wishlistBtn" style="position:absolute;top:16px;right:16px;width:44px;height:44px;background:white;border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.1);z-index:10;">
                    <i class="fa-${isInWishlist ? 'solid' : 'regular'} fa-heart" style="font-size:18px;color:${isInWishlist ? '#ef4444' : '#64748b'} !important;"></i>
                </button>
                <img src="${mainImage}" alt="${product.name}" id="mainImage" onclick="openImageZoom()" style="width:100%;height:450px;object-fit:contain;padding:20px;cursor:zoom-in;">
            </div>
            ${product.image?.length > 1 ? `
                <div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:8px;">
                    ${product.image.map((img, i) => `
                        <div onclick="changeImage('${img}', this)" style="flex-shrink:0;width:70px;height:70px;border-radius:10px;border:2px solid ${i === 0 ? '#2563eb' : '#e2e8f0'};overflow:hidden;cursor:pointer;background:#f8fafc;" class="thumb-item">
                            <img src="${img}" alt="Image ${i + 1}" style="width:100%;height:100%;object-fit:contain;padding:4px;">
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>

        <!-- Product Info -->
        <div style="padding-right:10px;">
            ${product.brand ? `<div style="font-size:13px;color:#2563eb;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">${product.brand}</div>` : ''}
            <h1 style="font-size:26px;font-weight:700;color:#1e293b;line-height:1.3;margin:0 0 16px 0;">${product.name}</h1>
            
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #e2e8f0;">
                <div style="display:flex;gap:2px;">
                    ${getStarsHTMLInline(rating)}
                </div>
                <span style="font-size:14px;color:#64748b;"><strong style="color:#1e293b;">${rating.toFixed(1)}</strong> / 5</span>
                <span onclick="scrollToReviews()" style="color:#2563eb;font-size:14px;text-decoration:underline;cursor:pointer;">${reviewCount} avis</span>
            </div>

            <div style="display:flex;align-items:baseline;gap:14px;margin-bottom:20px;flex-wrap:wrap;">
                <span style="font-size:32px;font-weight:800;color:#2563eb;">${UI.formatPrice(product.price)}</span>
                ${product.oldPrice ? `<span style="font-size:20px;color:#94a3b8;text-decoration:line-through;">${UI.formatPrice(product.oldPrice)}</span>` : ''}
                ${discount > 0 ? `<span style="background:#dcfce7;color:#16a34a;padding:5px 10px;border-radius:6px;font-size:12px;font-weight:600;">Économisez ${UI.formatPrice(product.oldPrice - product.price)}</span>` : ''}
            </div>

            <p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 20px 0;">${truncateDescription(product.description, 200)}</p>

            <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:10px;margin-bottom:20px;font-weight:500;background:${stockBg};color:${stockColor};border:1px solid ${stockBorder};">
                <i class="fa-solid fa-${stockIcon}" style="font-size:16px;color:${stockColor} !important;"></i>
                <span style="color:${stockColor};">${stockText}</span>
            </div>

            <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;">
                <div style="display:flex;align-items:center;border:2px solid #e2e8f0;border-radius:10px;overflow:hidden;">
                    <button onclick="updateQuantity(-1)" style="width:42px;height:42px;background:#f8fafc;border:none;cursor:pointer;font-size:18px;color:#475569;">−</button>
                    <input type="number" value="1" min="1" max="${product.stock || 99}" id="quantity" onchange="validateQuantity()" style="width:50px;height:42px;text-align:center;border:none;font-size:16px;font-weight:600;color:#1e293b;">
                    <button onclick="updateQuantity(1)" style="width:42px;height:42px;background:#f8fafc;border:none;cursor:pointer;font-size:18px;color:#475569;">+</button>
                </div>
                <button onclick="buyNow()" ${product.stock <= 0 ? 'disabled' : ''} style="flex:1;min-width:140px;padding:12px 20px;background:linear-gradient(135deg,#1e3a8a,#1e40af);color:white;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;">
                    <span style="color:white;">Acheter</span>
                </button>
                <button onclick="addProductToCart()" id="addToCartBtn" ${product.stock <= 0 ? 'disabled' : ''} style="flex:1;min-width:160px;padding:12px 20px;background:${isInCart ? '#16a34a' : '#2563eb'};color:white;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">
                    <i class="fa-solid fa-${isInCart ? 'check' : 'cart-plus'}" style="color:white !important;font-size:14px;"></i> <span style="color:white;">${isInCart ? 'Dans le panier' : 'Ajouter'}</span>
                </button>
            </div>

            <div style="background:#f8fafc;border-radius:12px;padding:16px;margin-bottom:20px;">
                <div style="display:flex;padding:10px 0;border-bottom:1px solid #e2e8f0;">
                    <span style="width:120px;font-weight:600;color:#64748b;font-size:13px;">Catégorie</span>
                    <span style="flex:1;color:#1e293b;font-size:13px;"><a href="products.html?category=${encodeURIComponent(product.category)}" style="color:#2563eb;text-decoration:none;">${product.category}</a></span>
                </div>
                ${product.subCategory ? `
                <div style="display:flex;padding:10px 0;border-bottom:1px solid #e2e8f0;">
                    <span style="width:120px;font-weight:600;color:#64748b;font-size:13px;">Sous-catégorie</span>
                    <span style="flex:1;color:#1e293b;font-size:13px;">${product.subCategory}</span>
                </div>
                ` : ''}
                ${product.sku ? `
                <div style="display:flex;padding:10px 0;">
                    <span style="width:120px;font-weight:600;color:#64748b;font-size:13px;">Référence</span>
                    <span style="flex:1;color:#1e293b;font-size:13px;">${product.sku}</span>
                </div>
                ` : ''}
            </div>

            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
                <div style="display:flex;flex-direction:column;align-items:center;text-align:center;padding:14px 10px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
                    <i class="fa-solid fa-truck-fast" style="font-size:22px;color:#2563eb !important;margin-bottom:8px;"></i>
                    <span style="font-size:11px;color:#64748b;font-weight:500;">Livraison rapide</span>
                </div>
                <div style="display:flex;flex-direction:column;align-items:center;text-align:center;padding:14px 10px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
                    <i class="fa-solid fa-shield-halved" style="font-size:22px;color:#2563eb !important;margin-bottom:8px;"></i>
                    <span style="font-size:11px;color:#64748b;font-weight:500;">Garantie authentique</span>
                </div>
                <div style="display:flex;flex-direction:column;align-items:center;text-align:center;padding:14px 10px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
                    <i class="fa-solid fa-rotate-left" style="font-size:22px;color:#2563eb !important;margin-bottom:8px;"></i>
                    <span style="font-size:11px;color:#64748b;font-weight:500;">Retour 7 jours</span>
                </div>
            </div>
        </div>
    `;
}

// Stars HTML with inline styles
function getStarsHTMLInline(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) {
            html += '<i class="fa-solid fa-star" style="color:#fbbf24 !important;font-size:14px;"></i>';
        } else if (i - 0.5 <= rating) {
            html += '<i class="fa-solid fa-star-half-stroke" style="color:#fbbf24 !important;font-size:14px;"></i>';
        } else {
            html += '<i class="fa-regular fa-star" style="color:#e2e8f0 !important;font-size:14px;"></i>';
        }
    }
    return html;
}

// Format date for reviews
function formatReviewDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
    if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
    return `Il y a ${Math.floor(diffDays / 365)} an${Math.floor(diffDays / 365) > 1 ? 's' : ''}`;
}

// Render tabs content
function renderTabs(product) {
    const rating = product.rating || 0;
    const reviewCount = product.reviewCount || 0;
    
    // Update review count in tab
    document.querySelector('.review-count').textContent = `(${reviewCount})`;

    // Description tab
    document.getElementById('descriptionContent').innerHTML = `
        <div style="font-size:15px;line-height:1.8;color:#475569;">
            ${product.description || 'Aucune description disponible pour ce produit.'}
            ${product.features ? `
                <h3 style="font-size:18px;color:#1e293b;margin:20px 0 12px;">Caractéristiques principales</h3>
                <ul style="margin:16px 0;padding-left:24px;">
                    ${product.features.map(f => `<li style="margin-bottom:8px;color:#475569;">${f}</li>`).join('')}
                </ul>
            ` : ''}
        </div>
    `;

    // Specifications tab - ONLY from database
    const dbSpecs = product.specifications || [];
    console.log('Product specifications from DB:', dbSpecs); // Debug log
    
    // Convert database specs format {name, value} to display format {label, value}
    // Filter out empty specifications
    const specs = dbSpecs
        .filter(spec => spec.name && spec.value)
        .map(spec => ({ label: spec.name, value: spec.value }));
    
    // Only show specifications section if there are specs from database
    if (specs.length > 0) {
        document.getElementById('specificationsContent').innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:0;">
                ${specs.map((spec, i) => `
                    <div style="display:flex;padding:14px 16px;border-bottom:1px solid #e2e8f0;background:${i % 2 === 0 ? '#f8fafc' : 'white'};">
                        <span style="width:150px;font-weight:600;color:#64748b;font-size:13px;">${spec.label}</span>
                        <span style="flex:1;color:#1e293b;font-size:13px;">${spec.value}</span>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        document.getElementById('specificationsContent').innerHTML = `
            <div style="width:100%;min-height:200px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 20px;color:#64748b;">
                <i class="fa-solid fa-list-check" style="font-size:36px;color:#e2e8f0 !important;margin-bottom:12px;"></i>
                <p style="font-size:14px;margin:0;">Aucune caractéristique disponible pour ce produit.</p>
            </div>
        `;
    }

    // Reviews tab - from database
    renderReviewsTab(rating, reviewCount);
}

// Render reviews tab with real data
function renderReviewsTab(rating, reviewCount) {
    const totalReviews = reviewCount || productReviews.length;
    
    // Calculate distribution percentages
    const distPercentages = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (totalReviews > 0) {
        for (let i = 1; i <= 5; i++) {
            distPercentages[i] = Math.round((reviewDistribution[i] || 0) / totalReviews * 100);
        }
    }

    // Check if user is logged in for review form
    const user = JSON.parse(localStorage.getItem(window.CONFIG?.STORAGE_KEYS?.USER || 'reda_user'));
    const isLoggedIn = !!user;
    
    document.getElementById('reviewsContent').innerHTML = `
        <div style="display:flex;gap:30px;padding-bottom:24px;border-bottom:1px solid #e2e8f0;margin-bottom:24px;flex-wrap:wrap;">
            <div style="text-align:center;padding:20px 30px;background:#f8fafc;border-radius:12px;">
                <div style="font-size:48px;font-weight:800;color:#1e293b;line-height:1;">${rating.toFixed(1)}</div>
                <div style="display:flex;justify-content:center;gap:3px;margin:10px 0;">${getStarsHTMLInline(rating)}</div>
                <div style="color:#64748b;font-size:13px;">Basé sur ${totalReviews} avis</div>
            </div>
            <div style="flex:1;min-width:250px;">
                ${[5,4,3,2,1].map(star => `
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                        <span style="width:60px;font-size:13px;color:#64748b;">${star} étoiles</span>
                        <div style="flex:1;height:8px;background:#e2e8f0;border-radius:4px;overflow:hidden;">
                            <div style="height:100%;background:#fbbf24;border-radius:4px;width:${distPercentages[star]}%;"></div>
                        </div>
                        <span style="width:30px;text-align:right;font-size:13px;color:#64748b;">${reviewDistribution[star] || 0}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <!-- Review Form -->
        <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px;">
            <h4 style="font-size:16px;color:#1e293b;margin:0 0 16px 0;">Donner votre avis</h4>
            ${isLoggedIn ? `
                <div id="reviewForm">
                    <div style="margin-bottom:16px;">
                        <label style="display:block;font-size:13px;color:#64748b;margin-bottom:8px;">Votre note</label>
                        <div id="ratingStars" style="display:flex;gap:8px;">
                            ${[1,2,3,4,5].map(star => `
                                <i class="fa-regular fa-star rating-star" data-rating="${star}" onclick="setRating(${star})" style="font-size:24px;color:#e2e8f0;cursor:pointer;transition:color 0.2s;"></i>
                            `).join('')}
                        </div>
                        <input type="hidden" id="selectedRating" value="0">
                    </div>
                    <div style="margin-bottom:16px;">
                        <label style="display:block;font-size:13px;color:#64748b;margin-bottom:8px;">Votre commentaire</label>
                        <textarea id="reviewComment" rows="4" placeholder="Partagez votre expérience avec ce produit..." style="width:100%;padding:12px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;resize:vertical;font-family:inherit;"></textarea>
                    </div>
                    <button onclick="submitReview()" style="padding:12px 24px;background:#2563eb;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:8px;">
                        <i class="fa-solid fa-paper-plane" style="color:white !important;font-size:14px;"></i>
                        <span style="color:white;">Publier l'avis</span>
                    </button>
                </div>
            ` : `
                <p style="color:#64748b;font-size:14px;margin:0;">
                    <a href="login.html" style="color:#2563eb;text-decoration:underline;">Connectez-vous</a> pour laisser un avis sur ce produit.
                </p>
            `}
        </div>
        
        <!-- Reviews List -->
        ${productReviews.length > 0 ? `
            <div id="reviewsList">
                ${productReviews.map(review => `
                    <div style="padding:20px 0;border-bottom:1px solid #e2e8f0;">
                        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;flex-wrap:wrap;gap:10px;">
                            <div style="display:flex;align-items:center;gap:12px;">
                                <div style="width:42px;height:42px;background:linear-gradient(135deg,#2563eb,#1d4ed8);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:16px;">${review.userName?.charAt(0).toUpperCase() || 'U'}</div>
                                <div>
                                    <div style="font-weight:600;color:#1e293b;font-size:14px;">${review.userName || 'Utilisateur'}</div>
                                    <div style="font-size:12px;color:#94a3b8;">${formatReviewDate(review.createdAt)}</div>
                                </div>
                            </div>
                            <div style="display:flex;gap:2px;">${getStarsHTMLInline(review.rating)}</div>
                        </div>
                        <div style="color:#475569;line-height:1.6;font-size:14px;">${review.comment}</div>
                        ${review.verified ? '<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#16a34a;background:#f0fdf4;padding:4px 10px;border-radius:4px;margin-top:10px;"><i class="fa-solid fa-circle-check" style="color:#16a34a !important;font-size:11px;"></i> Achat vérifié</span>' : ''}
                    </div>
                `).join('')}
            </div>
        ` : `
            <div style="text-align:center;padding:50px 20px;color:#64748b;">
                <i class="fa-regular fa-comment-dots" style="font-size:42px;color:#e2e8f0 !important;margin-bottom:16px;display:block;"></i>
                <h4 style="color:#1e293b;margin-bottom:8px;font-size:16px;">Aucun avis pour le moment</h4>
                <p style="font-size:14px;color:#64748b;">Soyez le premier à donner votre avis sur ce produit</p>
            </div>
        `}
    `;
}

// Set rating for review form
let currentRating = 0;
function setRating(rating) {
    currentRating = rating;
    document.getElementById('selectedRating').value = rating;
    
    document.querySelectorAll('.rating-star').forEach((star, index) => {
        if (index < rating) {
            star.classList.remove('fa-regular');
            star.classList.add('fa-solid');
            star.style.color = '#fbbf24';
        } else {
            star.classList.remove('fa-solid');
            star.classList.add('fa-regular');
            star.style.color = '#e2e8f0';
        }
    });
}

// Submit review
async function submitReview() {
    const rating = parseInt(document.getElementById('selectedRating').value);
    const comment = document.getElementById('reviewComment').value.trim();
    
    if (rating === 0) {
        UI.showToast('Veuillez sélectionner une note', 'error');
        return;
    }
    
    if (comment.length < 10) {
        UI.showToast('Votre commentaire doit contenir au moins 10 caractères', 'error');
        return;
    }
    
    const result = await api.addReview(currentProduct._id, rating, comment);
    
    if (result.success) {
        UI.showToast('Merci pour votre avis !', 'success');
        // Reload reviews
        await loadProductReviews(currentProduct._id);
        // Update product rating display
        const updatedProduct = await api.getProduct(currentProduct._id);
        if (updatedProduct.success) {
            currentProduct = updatedProduct.product;
        }
        renderReviewsTab(currentProduct.rating || 0, currentProduct.reviewCount || 0);
    } else {
        UI.showToast(result.message || 'Erreur lors de l\'envoi de l\'avis', 'error');
    }
}


// Generate default specifications
function generateDefaultSpecs(product) {
    const specs = [
        { label: 'Catégorie', value: product.category || 'N/A' },
        { label: 'Marque', value: product.brand || 'Electro Youssef' },
        { label: 'Référence', value: product.sku || `EY-${product._id?.slice(-6).toUpperCase() || '000000'}` },
        { label: 'Disponibilité', value: product.stock > 0 ? 'En stock' : 'Rupture de stock' },
        { label: 'Garantie', value: '12 mois' },
        { label: 'Livraison', value: 'Partout au Maroc' }
    ];
    if (product.subCategory) specs.splice(1, 0, { label: 'Sous-catégorie', value: product.subCategory });
    return specs;
}

// Load related products
async function loadRelatedProducts(category) {
    const container = document.getElementById('relatedProducts');
    
    try {
        const result = await api.getProductsByCategory(category, null, 1, 12);
        
        if (result.success && result.products?.length > 0) {
            relatedProducts = result.products.filter(p => p._id !== currentProduct._id).slice(0, 8);
            
            if (relatedProducts.length > 0) {
                container.innerHTML = relatedProducts.map(product => createRelatedProductCard(product)).join('');
                initRelatedSwiper();
            } else {
                document.querySelector('.related-products-section').style.display = 'none';
            }
        } else {
            document.querySelector('.related-products-section').style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading related products:', error);
        document.querySelector('.related-products-section').style.display = 'none';
    }
}

// Create related product card
function createRelatedProductCard(product) {
    const discount = UI.getDiscountPercent(product.oldPrice, product.price);
    const imageUrl = product.image?.[0] || 'img/placeholder.png';
    
    return `
        <div class="swiper-slide">
            <div style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;background:white;height:100%;transition:box-shadow 0.3s,transform 0.3s;">
                <div style="position:relative;aspect-ratio:1/1;overflow:hidden;background:#f8fafc;">
                    ${discount > 0 ? `<span style="position:absolute;top:8px;left:8px;background:#ef4444;color:white;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:600;z-index:2;">-${discount}%</span>` : ''}
                    <a href="product.html?id=${product._id}" style="display:block;width:100%;height:100%;">
                        <img src="${imageUrl}" alt="${product.name}" style="width:100%;height:100%;object-fit:contain;padding:12px;transition:transform 0.3s;">
                    </a>
                </div>
                <div style="padding:12px;">
                    <p style="font-size:13px;font-weight:500;margin:0 0 8px 0;height:36px;overflow:hidden;line-height:1.4;">
                        <a href="product.html?id=${product._id}" style="color:#1f2937;text-decoration:none;">${UI.truncateText(product.name, 40)}</a>
                    </p>
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;">
                        <span style="color:#2563eb;font-weight:700;font-size:15px;">${UI.formatPrice(product.price)}</span>
                        ${product.oldPrice ? `<span style="color:#9ca3af;text-decoration:line-through;font-size:12px;">${UI.formatPrice(product.oldPrice)}</span>` : ''}
                    </div>
                    <button onclick="quickAddToCart('${product._id}')" style="width:100%;padding:8px 12px;background:#2563eb;color:white;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:background 0.2s;" onmouseover="this.style.background='#1d4ed8'" onmouseout="this.style.background='#2563eb'">
                        <i class="fa-solid fa-cart-plus" style="color:white !important;font-size:12px;"></i> <span style="color:white;">Ajouter</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Quick add to cart from related products
function quickAddToCart(productId) {
    const product = relatedProducts.find(p => p._id === productId);
    if (product) {
        cart.addItem(product);
        UI.showToast('Ajouté au panier !', 'success');
    }
}

// Initialize related products swiper
function initRelatedSwiper() {
    new Swiper('.related-swiper', {
        slidesPerView: 2,
        spaceBetween: 16,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        breakpoints: {
            640: { slidesPerView: 3, spaceBetween: 20 },
            900: { slidesPerView: 4, spaceBetween: 24 },
            1200: { slidesPerView: 5, spaceBetween: 24 }
        }
    });
}

// Recently viewed products
function saveToRecentlyViewed(product) {
    const key = 'recently_viewed';
    let viewed = JSON.parse(localStorage.getItem(key) || '[]');
    viewed = viewed.filter(p => p._id !== product._id);
    viewed.unshift({
        _id: product._id,
        name: product.name,
        price: product.price,
        oldPrice: product.oldPrice,
        image: product.image
    });
    viewed = viewed.slice(0, 10);
    localStorage.setItem(key, JSON.stringify(viewed));
}

function loadRecentlyViewed() {
    const key = 'recently_viewed';
    const viewed = JSON.parse(localStorage.getItem(key) || '[]');
    const container = document.getElementById('recentlyViewed');
    const section = document.getElementById('recentlyViewedSection');
    
    const filtered = viewed.filter(p => p._id !== currentProduct?._id);
    
    if (filtered.length > 0) {
        section.style.display = 'block';
        container.innerHTML = filtered.map(product => createRelatedProductCard(product)).join('');
        
        new Swiper('.recently-swiper', {
            slidesPerView: 2,
            spaceBetween: 16,
            breakpoints: {
                640: { slidesPerView: 3, spaceBetween: 20 },
                900: { slidesPerView: 4, spaceBetween: 24 },
                1200: { slidesPerView: 6, spaceBetween: 24 }
            }
        });
    }
}

// Tab functionality
function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
        });
    });
}

function scrollToReviews() {
    document.querySelector('[data-tab="reviews"]').click();
    document.querySelector('.product-tabs-section').scrollIntoView({ behavior: 'smooth' });
}

// Helper functions
function truncateDescription(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

// Image functions
function changeImage(src, element) {
    document.getElementById('mainImage').src = src;
    document.querySelectorAll('.thumb-item').forEach(item => {
        item.style.borderColor = '#e2e8f0';
    });
    if (element) element.style.borderColor = '#2563eb';
}

function openImageZoom() {
    const img = document.getElementById('mainImage');
    window.open(img.src, '_blank');
}

// Quantity functions
function updateQuantity(change) {
    const input = document.getElementById('quantity');
    let value = parseInt(input.value) + change;
    const max = parseInt(input.max) || 99;
    value = Math.max(1, Math.min(value, max));
    input.value = value;
    selectedQuantity = value;
}

function validateQuantity() {
    const input = document.getElementById('quantity');
    let value = parseInt(input.value) || 1;
    const max = parseInt(input.max) || 99;
    value = Math.max(1, Math.min(value, max));
    input.value = value;
    selectedQuantity = value;
}

// Cart functions
function addProductToCart() {
    if (!currentProduct) return;

    const quantity = parseInt(document.getElementById('quantity').value) || 1;
    
    if (!cart.isInCart(currentProduct._id)) {
        cart.addItem(currentProduct);
        if (quantity > 1) {
            cart.updateQuantity(currentProduct._id, quantity);
        }
    } else {
        const currentQty = cart.getCart().find(item => item._id === currentProduct._id)?.quantity || 0;
        cart.updateQuantity(currentProduct._id, currentQty + quantity);
    }

    const btn = document.getElementById('addToCartBtn');
    btn.innerHTML = '<i class="fa-solid fa-check" style="color:white !important;font-size:14px;"></i> <span style="color:white;">Dans le panier</span>';
    btn.style.background = '#16a34a';
    UI.showToast('Ajouté au panier !', 'success');
}

function toggleWishlist() {
    if (!currentProduct) return;

    const btn = document.getElementById('wishlistBtn');
    if (wishlist.isInWishlist(currentProduct._id)) {
        wishlist.removeItem(currentProduct._id);
        btn.innerHTML = '<i class="fa-regular fa-heart" style="font-size:18px;color:#64748b !important;"></i>';
    } else {
        wishlist.addItem(currentProduct);
        btn.innerHTML = '<i class="fa-solid fa-heart" style="font-size:18px;color:#ef4444 !important;"></i>';
        UI.showToast('Ajouté à la liste de souhaits !', 'success');
    }
}

function buyNow() {
    if (!currentProduct) return;

    const quantity = parseInt(document.getElementById('quantity').value) || 1;

    if (!cart.isInCart(currentProduct._id)) {
        cart.addItem(currentProduct);
        if (quantity > 1) {
            cart.updateQuantity(currentProduct._id, quantity);
        }
    }

    window.location.href = 'checkout.html';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initProductPage);
