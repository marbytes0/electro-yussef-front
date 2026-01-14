// Wishlist Management Service
class WishlistService {
  constructor() {
    this.wishlistKey = window.CONFIG?.STORAGE_KEYS?.WISHLIST || 'reda_wishlist';
  }

  getWishlist() {
    const wishlist = localStorage.getItem(this.wishlistKey);
    return wishlist ? JSON.parse(wishlist) : [];
  }

  saveWishlist(wishlist) {
    localStorage.setItem(this.wishlistKey, JSON.stringify(wishlist));
    this.updateWishlistUI();
  }

  async addItem(product) {
    // If logged in, sync with backend
    if (window.auth?.isLoggedIn()) {
      const result = await window.api.addToWishlist(product._id);
      if (!result.success) {
        this.showToast(result.message || 'Échec de l\'ajout à la liste');
        return false;
      }
    }

    const wishlist = this.getWishlist();
    if (!wishlist.find(item => item._id === product._id)) {
      wishlist.push(product);
      this.saveWishlist(wishlist);
    }

    this.showToast('Ajouté à la liste de souhaits');
    this.updateButtonState(product._id, true);
    return true;
  }

  async removeItem(productId) {
    // If logged in, sync with backend
    if (window.auth?.isLoggedIn()) {
      await window.api.removeFromWishlist(productId);
    }

    let wishlist = this.getWishlist();
    wishlist = wishlist.filter(item => item._id !== productId);
    this.saveWishlist(wishlist);
    this.updateButtonState(productId, false);
  }

  isInWishlist(productId) {
    const wishlist = this.getWishlist();
    return wishlist.some(item => item._id === productId);
  }

  getCount() {
    return this.getWishlist().length;
  }

  clear() {
    localStorage.removeItem(this.wishlistKey);
    this.updateWishlistUI();
  }

  updateWishlistUI() {
    const count = this.getCount();

    // Update wishlist count badges
    document.querySelectorAll('.count_favourite').forEach(el => {
      el.textContent = count;
    });
  }

  updateButtonState(productId, inWishlist) {
    // Update all wishlist buttons with this product ID
    document.querySelectorAll(`[data-id="${productId}"]`).forEach(btn => {
      // Check if it's a wishlist button
      if (btn.classList.contains('wishlist_btn') || btn.classList.contains('custom-wishlist-btn') || 
          btn.onclick?.toString().includes('wishlist') || btn.onclick?.toString().includes('Wishlist')) {
        const icon = btn.querySelector('i');
        
        if (inWishlist) {
          btn.classList.add('active');
          if (icon) {
            icon.className = 'fa-solid fa-heart';
            icon.style.color = '#ef4444';
          }
        } else {
          btn.classList.remove('active');
          if (icon) {
            icon.className = 'fa-regular fa-heart';
            icon.style.color = '#64748b';
          }
        }
      }
    });
  }

  showToast(message) {
    // Notifications disabled
    return;
  }

  async syncWithBackend() {
    if (!window.auth?.isLoggedIn()) return;

    const result = await window.api.getWishlist();
    if (result.success) {
      this.saveWishlist(result.products);
    }
  }
}

// Create global instance
window.wishlist = new WishlistService();

// Initialize wishlist UI on page load
document.addEventListener('DOMContentLoaded', () => {
  window.wishlist.updateWishlistUI();
  // Sync with backend if logged in
  if (window.auth?.isLoggedIn()) {
    window.wishlist.syncWithBackend();
  }
});
