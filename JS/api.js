// API Service Layer
class ApiService {
  constructor() {
    this.baseUrl = window.CONFIG?.API_URL || 'http://localhost:4000';
  }

  getToken() {
    return localStorage.getItem(window.CONFIG?.STORAGE_KEYS?.TOKEN || 'reda_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { token }),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, message: error.message };
    }
  }

  // Products
  async getProducts() {
    return this.request('/api/product/list');
  }

  async getProduct(productId) {
    return this.request('/api/product/single', {
      method: 'POST',
      body: { productId },
    });
  }

  async getProductsByCategory(category, subCategory, page = 1, limit = 12) {
    return this.request('/api/product/category', {
      method: 'POST',
      body: { category, subCategory, page, limit },
    });
  }

  async searchProducts(query, filters = {}) {
    return this.request('/api/product/search', {
      method: 'POST',
      body: { query, ...filters },
    });
  }

  async getHotDeals() {
    return this.request('/api/product/hotdeals');
  }

  async getFeaturedProducts() {
    return this.request('/api/product/featured');
  }

  async incrementViews(productId) {
    return this.request('/api/product/view', {
      method: 'POST',
      body: { productId },
    });
  }

  // Categories
  async getCategories() {
    return this.request('/api/category/list');
  }

  // Banners
  async getBanners(type = null) {
    const query = type ? `?type=${type}` : '';
    return this.request(`/api/banner/active${query}`);
  }

  // Settings
  async getPublicSettings() {
    return this.request('/api/settings/public');
  }

  // Auth
  async login(email, password) {
    return this.request('/api/user/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  async register(name, email, password) {
    return this.request('/api/user/register', {
      method: 'POST',
      body: { name, email, password },
    });
  }

  async getProfile() {
    const userId = JSON.parse(localStorage.getItem(window.CONFIG?.STORAGE_KEYS?.USER || 'reda_user'))?._id;
    return this.request('/api/user/profile', {
      method: 'POST',
      body: { userId },
    });
  }

  async getProfileById(userId) {
    return this.request('/api/user/profile', {
      method: 'POST',
      body: { userId },
    });
  }

  async updateProfile(data) {
    const userId = JSON.parse(localStorage.getItem(window.CONFIG?.STORAGE_KEYS?.USER || 'reda_user'))?._id;
    return this.request('/api/user/update-profile', {
      method: 'POST',
      body: { userId, ...data },
    });
  }

  // Cart (for logged-in users)
  async getCart() {
    const userId = JSON.parse(localStorage.getItem(window.CONFIG?.STORAGE_KEYS?.USER || 'reda_user'))?._id;
    return this.request('/api/cart/get', {
      method: 'POST',
      body: { userId },
    });
  }

  async addToCart(itemId) {
    const userId = JSON.parse(localStorage.getItem(window.CONFIG?.STORAGE_KEYS?.USER || 'reda_user'))?._id;
    return this.request('/api/cart/add', {
      method: 'POST',
      body: { userId, itemId },
    });
  }

  async updateCart(itemId, quantity) {
    const userId = JSON.parse(localStorage.getItem(window.CONFIG?.STORAGE_KEYS?.USER || 'reda_user'))?._id;
    return this.request('/api/cart/update', {
      method: 'POST',
      body: { userId, itemId, quantity },
    });
  }

  // Wishlist
  async getWishlist() {
    const userId = JSON.parse(localStorage.getItem(window.CONFIG?.STORAGE_KEYS?.USER || 'reda_user'))?._id;
    return this.request('/api/wishlist/get', {
      method: 'POST',
      body: { userId },
    });
  }

  async addToWishlist(productId) {
    const userId = JSON.parse(localStorage.getItem(window.CONFIG?.STORAGE_KEYS?.USER || 'reda_user'))?._id;
    return this.request('/api/wishlist/add', {
      method: 'POST',
      body: { userId, productId },
    });
  }

  async removeFromWishlist(productId) {
    const userId = JSON.parse(localStorage.getItem(window.CONFIG?.STORAGE_KEYS?.USER || 'reda_user'))?._id;
    return this.request('/api/wishlist/remove', {
      method: 'POST',
      body: { userId, productId },
    });
  }

  async checkWishlist(productId) {
    const userId = JSON.parse(localStorage.getItem(window.CONFIG?.STORAGE_KEYS?.USER || 'reda_user'))?._id;
    return this.request('/api/wishlist/check', {
      method: 'POST',
      body: { userId, productId },
    });
  }

  // Orders
  async placeOrder(orderData) {
    const userId = JSON.parse(localStorage.getItem(window.CONFIG?.STORAGE_KEYS?.USER || 'reda_user'))?._id;
    return this.request('/api/order/place', {
      method: 'POST',
      body: { userId, ...orderData },
    });
  }

  async placeGuestOrder(orderData) {
    return this.request('/api/order/guest-place', {
      method: 'POST',
      body: orderData,
    });
  }

  async getUserOrders() {
    const userId = JSON.parse(localStorage.getItem(window.CONFIG?.STORAGE_KEYS?.USER || 'reda_user'))?._id;
    return this.request('/api/order/userorders', {
      method: 'POST',
      body: { userId },
    });
  }

  async trackOrder(orderId) {
    return this.request('/api/order/track', {
      method: 'POST',
      body: { orderId },
    });
  }

  // Newsletter
  async subscribe(email) {
    return this.request('/api/newsletter/subscribe', {
      method: 'POST',
      body: { email },
    });
  }

  // Reviews
  async getProductReviews(productId, page = 1, limit = 10) {
    return this.request('/api/review/list', {
      method: 'POST',
      body: { productId, page, limit },
    });
  }

  async addReview(productId, rating, comment) {
    // Try to get user from storage
    const userStr = localStorage.getItem(window.CONFIG?.STORAGE_KEYS?.USER || 'reda_user');
    const tokenStr = localStorage.getItem(window.CONFIG?.STORAGE_KEYS?.TOKEN || 'reda_token');
    
    if (!tokenStr) {
      return { success: false, message: 'Vous devez être connecté pour laisser un avis' };
    }
    
    let userId = null;
    let userName = 'Utilisateur';
    
    // Try to get from user object first
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        userId = user._id || user.id;
        userName = user.name || user.username || 'Utilisateur';
      } catch (e) {}
    }
    
    // If no userId, decode from token
    if (!userId && tokenStr) {
      try {
        const base64Url = tokenStr.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        userId = payload.id;
      } catch (e) {
        console.error('Error decoding token:', e);
      }
    }
    
    if (!userId) {
      return { success: false, message: 'Session expirée, veuillez vous reconnecter' };
    }
    
    return this.request('/api/review/add', {
      method: 'POST',
      body: { productId, userId, userName, rating, comment },
    });
  }

  async deleteReview(reviewId) {
    const user = JSON.parse(localStorage.getItem(window.CONFIG?.STORAGE_KEYS?.USER || 'reda_user'));
    if (!user) {
      return { success: false, message: 'Non autorisé' };
    }
    return this.request('/api/review/delete', {
      method: 'POST',
      body: { reviewId, userId: user._id },
    });
  }

  async canReview(productId) {
    const user = JSON.parse(localStorage.getItem(window.CONFIG?.STORAGE_KEYS?.USER || 'reda_user'));
    if (!user) {
      return { success: true, canReview: false, reason: 'not_logged_in' };
    }
    return this.request('/api/review/can-review', {
      method: 'POST',
      body: { productId, userId: user._id },
    });
  }
}

// Create global instance
window.api = new ApiService();
