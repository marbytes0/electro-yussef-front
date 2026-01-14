// Cart Management Service
class CartService {
  constructor() {
    this.cartKey = window.CONFIG?.STORAGE_KEYS?.CART || 'reda_cart';
  }

  getCart() {
    const cart = localStorage.getItem(this.cartKey);
    return cart ? JSON.parse(cart) : [];
  }

  saveCart(cart) {
    localStorage.setItem(this.cartKey, JSON.stringify(cart));
    this.updateCartUI();
  }

  addItem(product) {
    const cart = this.getCart();
    const existingIndex = cart.findIndex(item => item._id === product._id);

    if (existingIndex > -1) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    this.saveCart(cart);
    this.updateButtonState(product._id, true);
    this.showToast('Ajouté au panier');
    return true;
  }

  removeItem(productId) {
    let cart = this.getCart();
    cart = cart.filter(item => item._id !== productId);
    this.saveCart(cart);
    this.updateButtonState(productId, false);
  }

  updateQuantity(productId, quantity) {
    const cart = this.getCart();
    const index = cart.findIndex(item => item._id === productId);

    if (index > -1) {
      if (quantity <= 0) {
        this.removeItem(productId);
      } else {
        cart[index].quantity = quantity;
        this.saveCart(cart);
      }
    }
  }

  getTotal() {
    const cart = this.getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getCount() {
    const cart = this.getCart();
    return cart.reduce((count, item) => count + item.quantity, 0);
  }

  clear() {
    localStorage.removeItem(this.cartKey);
    this.updateCartUI();
  }

  isInCart(productId) {
    const cart = this.getCart();
    return cart.some(item => item._id === productId);
  }

  updateCartUI() {
    const cart = this.getCart();
    const total = this.getTotal();
    const count = this.getCount();

    // Update cart count badges
    document.querySelectorAll('.count_item_header, .Count_item_cart').forEach(el => {
      el.textContent = count;
    });

    // Update cart total
    document.querySelectorAll('.price_cart_toral').forEach(el => {
      el.textContent = `${total.toFixed(2)}${window.CONFIG?.CURRENCY || 'DH'}`;
    });

    // Render cart items
    const cartContainer = document.getElementById('cart_items');
    if (cartContainer) {
      if (cart.length === 0) {
        cartContainer.innerHTML = '<p class="empty_cart">Votre panier est vide</p>';
      } else {
        cartContainer.innerHTML = cart.map((item, index) => `
          <div class="item_cart">
            <img src="${item.image?.[0] || item.img}" alt="${item.name}">
            <div class="content">
              <h4>${item.name}</h4>
              <p class="price_cart">${(item.price * item.quantity).toFixed(2)}${window.CONFIG?.CURRENCY || 'DH'}</p>
              <div class="quantity_control">
                <button class="decrease_quantity" onclick="cart.updateQuantity('${item._id}', ${item.quantity - 1})">-</button>
                <span class="quantity">${item.quantity}</span>
                <button class="Increase_quantity" onclick="cart.updateQuantity('${item._id}', ${item.quantity + 1})">+</button>
              </div>
            </div>
            <button class="delete_item" onclick="cart.removeItem('${item._id}')">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        `).join('');
      }
    }
  }

  updateButtonState(productId, inCart) {
    // Update all cart buttons with this product ID
    document.querySelectorAll(`[data-id="${productId}"].btn_add_cart`).forEach(btn => {
      const icon = btn.querySelector('i');
      const textSpan = btn.querySelector('span');
      
      if (inCart) {
        btn.classList.add('active');
        btn.style.background = 'linear-gradient(135deg,#16a34a,#15803d)';
        btn.style.borderColor = '#16a34a';
        btn.style.color = 'white';
        if (icon) {
          icon.className = 'fa-solid fa-check';
          icon.style.color = 'white';
        }
        if (textSpan) {
          textSpan.textContent = 'Ajouté';
          textSpan.style.color = 'white';
        }
      } else {
        btn.classList.remove('active');
        btn.style.background = 'linear-gradient(135deg,#2563eb,#1d4ed8)';
        btn.style.borderColor = '#2563eb';
        btn.style.color = 'white';
        if (icon) {
          icon.className = 'fa-solid fa-cart-plus';
          icon.style.color = 'white';
        }
        if (textSpan) {
          textSpan.textContent = 'Ajouter';
          textSpan.style.color = 'white';
        }
      }
    });
  }

  showToast(message) {
    // Notifications disabled
    return;
  }
}

// Create global instance
window.cart = new CartService();

// Initialize cart UI on page load
document.addEventListener('DOMContentLoaded', () => {
  window.cart.updateCartUI();
});
