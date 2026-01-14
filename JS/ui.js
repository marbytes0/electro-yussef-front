// UI Utilities
const UI = {
  // Toast notifications
  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} show`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  // Loading states
  showLoading(element) {
    if (!element) return;
    element.classList.add('loading');
    element.dataset.originalContent = element.innerHTML;
    element.innerHTML = '<span class="spinner"></span>';
    element.disabled = true;
  },

  hideLoading(element) {
    if (!element) return;
    element.classList.remove('loading');
    if (element.dataset.originalContent) {
      element.innerHTML = element.dataset.originalContent;
    }
    element.disabled = false;
  },

  // Format currency
  formatPrice(amount) {
    const currency = window.CONFIG?.CURRENCY || 'DH';
    return `${Number(amount).toFixed(2)}${currency}`;
  },

  // Format date
  formatDate(date) {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  // Truncate text
  truncateText(text, length = 50) {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  },

  // Debounce function
  debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Calculate discount percentage
  getDiscountPercent(oldPrice, newPrice) {
    if (!oldPrice || oldPrice <= newPrice) return 0;
    return Math.round((1 - newPrice / oldPrice) * 100);
  },

  // Generate star rating HTML
  getStarsHTML(rating = 5) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        html += '<i class="fa-solid fa-star"></i>';
      } else {
        html += '<i class="fa-regular fa-star"></i>';
      }
    }
    return html;
  },

  // Create product card HTML
  createProductCard(product) {
    if (!product) return '';
    const isInCart = window.cart?.isInCart(product._id);
    const isInWishlist = window.wishlist?.isInWishlist(product._id);
    const discount = this.getDiscountPercent(product.oldPrice, product.price);
    const imageUrl = product.image?.[0] || product.img || 'img/placeholder.png';

    // Refined consistent design
    return `
      <div class="product" style="display:flex; flex-direction:column; height:100%; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; background:white; transition:all 0.3s ease; position:relative;">
        <div class="img_product" style="position:relative; width:100%; aspect-ratio:1/1; overflow:hidden;">
            ${discount > 0 ? `<span class="sale_present" style="position:absolute; top:10px; left:10px; background:#ef4444; color:white; padding:4px 8px; border-radius:4px; font-size:12px; font-weight:600; z-index:2;">-${discount}%</span>` : ''}
            
            <button class="custom-wishlist-btn ${isInWishlist ? 'active' : ''}" data-id="${product._id}" 
                onclick="event.stopPropagation(); handleWishlist(event, ${JSON.stringify(product).replace(/"/g, '&quot;')})"
                style="position:absolute; top:10px; right:10px; z-index:10; background:white; border:none; width:34px; height:34px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 6px rgba(0,0,0,0.1); transition:all 0.2s;">
                <i class="fa-${isInWishlist ? 'solid' : 'regular'} fa-heart" style="color:${isInWishlist ? '#ef4444' : '#6b7280'}; font-size:16px;"></i>
            </button>

            <a href="product.html?id=${product._id}" style="display:block; width:100%; height:100%;">
                <img src="${imageUrl}" alt="${product.name}" style="width:100%; height:100%; object-fit:contain; padding:20px; transition:transform 0.3s ease;">
            </a>
        </div>
        
        <div class="text_product" style="padding:16px; display:flex; flex-direction:column; flex:1; gap:8px;">
            <p class="name_product" style="margin:0; font-size:15px; font-weight:500; line-height:1.4;">
                <a href="product.html?id=${product._id}" style="color:#1f2937; text-decoration:none; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${this.truncateText(product.name, 50)}</a>
            </p>
            
            <div class="price" style="display:flex; align-items:center; gap:8px; margin-top:4px;">
                <p style="color:#2563eb; font-weight:700; font-size:18px; margin:0;">${this.formatPrice(product.price)}</p>
                ${product.oldPrice ? `<p class="old_price" style="color:#9ca3af; text-decoration:line-through; font-size:14px; margin:0;">${this.formatPrice(product.oldPrice)}</p>` : ''}
            </div>
            
            <div class="icons" style="display:flex; gap:10px; margin-top:auto; padding-top:12px;">
                <span class="btn_buy_now" data-id="${product._id}" onclick="handleBuyNow(event, '${product._id}')" 
                    style="flex:1; padding:10px 0; background:#1e40af; color:white; border:1px solid #1e40af; border-radius:6px; cursor:pointer; font-size:14px; font-weight:500; text-align:center; transition:all 0.2s; display:flex; align-items:center; justify-content:center;">
                    Acheter
                </span>
                
                <span class="btn_add_cart ${isInCart ? 'active' : ''}" data-id="${product._id}" onclick="handleAddToCart(event, ${JSON.stringify(product).replace(/"/g, '&quot;')})" 
                    style="flex:1; padding:10px 0; background:${isInCart ? '#10b981' : '#ffffff'}; color:${isInCart ? '#ffffff' : '#1e40af'}; border:1px solid ${isInCart ? '#10b981' : '#1e40af'}; border-radius:6px; cursor:pointer; font-size:14px; font-weight:500; text-align:center; transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:6px;">
                    <i class="fa-solid fa-${isInCart ? 'check' : 'cart-plus'}" style="font-size:14px; color:inherit;"></i> ${isInCart ? 'Ajouté' : 'Ajouter'}
                </span>
            </div>
        </div>
      </div>
    `;
  },

  // Create swiper product card HTML
  createSwiperProductCard(product) {
    const isInCart = window.cart?.isInCart(product._id);
    const isInWishlist = window.wishlist?.isInWishlist(product._id);
    const discount = this.getDiscountPercent(product.oldPrice, product.price);
    const imageUrl = product.image?.[0] || product.img || 'img/placeholder.png';

    return `
      <div class="swiper-slide product" data-id="${product._id}">
        ${discount > 0 ? `<span class="sale_present">-${discount}%</span>` : ''}
        <div class="img_product">
          <a href="product.html?id=${product._id}">
            <img src="${imageUrl}" alt="${product.name}">
          </a>
          <button class="wishlist_btn ${isInWishlist ? 'active' : ''}" data-id="${product._id}" onclick="handleWishlist(event, ${JSON.stringify(product).replace(/"/g, '&quot;')})">
            <i class="fa-${isInWishlist ? 'solid' : 'regular'} fa-heart"></i>
          </button>
        </div>
        <div class="product_content">

          <p class="name_product">
            <a href="product.html?id=${product._id}">${this.truncateText(product.name, 50)}</a>
          </p>
          <div class="price">
            <p>${this.formatPrice(product.price)}</p>
            ${product.oldPrice ? `<p class="old_price">${this.formatPrice(product.oldPrice)}</p>` : ''}
          </div>
          <div class="icons" style="display:flex;gap:8px;flex-wrap:wrap;width:100%;">
            <span class="btn_buy_now" data-id="${product._id}" onclick="handleBuyNow(event, '${product._id}')" style="font-size:11px;padding:8px 12px;background:#1e40af;color:white;border:1px solid #1e40af;border-radius:3px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;flex:1;justify-content:center;transition:all 0.2s;">
              Acheter
            </span>
            <span class="btn_add_cart ${isInCart ? 'active' : ''}" data-id="${product._id}" onclick="handleAddToCart(event, ${JSON.stringify(product).replace(/"/g, '&quot;')})" style="font-size:11px;padding:8px 12px;background:${isInCart ? '#10b981' : '#ffffff'};color:${isInCart ? '#ffffff' : '#1e40af'};border:1px solid ${isInCart ? '#10b981' : '#1e40af'};border-radius:3px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;flex:1;justify-content:center;transition:all 0.2s;">
              <i class="fa-solid fa-${isInCart ? 'check' : 'cart-plus'}" style="font-size:10px;color:inherit;"></i> ${isInCart ? 'Ajouté' : 'Ajouter'}
            </span>
          </div>
        </div>
      </div>
    `;
  },

  // Pagination HTML
  createPagination(currentPage, totalPages, onPageChange) {
    if (totalPages <= 1) return '';

    let html = '<div class="pagination">';

    if (currentPage > 1) {
      html += `<button class="page-btn" onclick="${onPageChange}(${currentPage - 1})"><i class="fa-solid fa-chevron-left"></i></button>`;
    }

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="${onPageChange}(${i})">${i}</button>`;
      } else if (i === currentPage - 3 || i === currentPage + 3) {
        html += '<span class="page-dots">...</span>';
      }
    }

    if (currentPage < totalPages) {
      html += `<button class="page-btn" onclick="${onPageChange}(${currentPage + 1})"><i class="fa-solid fa-chevron-right"></i></button>`;
    }

    html += '</div>';
    return html;
  }
};

// Global handlers
function handleAddToCart(event, product) {
  event.preventDefault();
  event.stopPropagation();

  if (window.cart.isInCart(product._id)) {
    window.cart.removeItem(product._id);
  } else {
    window.cart.addItem(product);
    window.cart.updateButtonState(product._id, true);
  }
}

function handleWishlist(event, product) {
  event.preventDefault();
  event.stopPropagation();

  if (window.wishlist.isInWishlist(product._id)) {
    window.wishlist.removeItem(product._id);
  } else {
    window.wishlist.addItem(product);
  }
}

// Handle Buy Now functionality
function handleBuyNow(event, productId) {
  event.preventDefault();
  event.stopPropagation();

  // Get product from API or use cached data
  const product = window.allProducts?.find(p => p._id === productId);
  if (product && !window.cart.isInCart(productId)) {
    window.cart.addItem(product);
  }

  // Redirect to checkout
  window.location.href = 'checkout.html';
}

// Make UI available globally
window.UI = UI;
