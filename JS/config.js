// API Configuration
const CONFIG = {
  API_URL: 'http://localhost:4000',
  // For production, change to: 'https://moayd-backend-randxxt.vercel.app'

  // Store Settings
  STORE_NAME: 'Electro Youssef',
  CURRENCY: 'DH',
  CURRENCY_CODE: 'MAD',

  // Pagination
  PRODUCTS_PER_PAGE: 12,

  // Features
  FEATURES: {
    WISHLIST: true,
    REVIEWS: true,
    GUEST_CHECKOUT: true,
    NEWSLETTER: true,
  },

  // Local Storage Keys
  STORAGE_KEYS: {
    TOKEN: 'reda_token',
    USER: 'reda_user',
    CART: 'reda_cart',
    WISHLIST: 'reda_wishlist',
    RECENTLY_VIEWED: 'reda_recent',
  },
};

// Make CONFIG available globally
window.CONFIG = CONFIG;
