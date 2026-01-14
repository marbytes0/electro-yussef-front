// Authentication Service
class AuthService {
  constructor() {
    this.tokenKey = window.CONFIG?.STORAGE_KEYS?.TOKEN || 'reda_token';
    this.userKey = window.CONFIG?.STORAGE_KEYS?.USER || 'reda_user';
  }

  isLoggedIn() {
    return !!this.getToken();
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  getUser() {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  setAuth(token, user) {
    localStorage.setItem(this.tokenKey, token);
    if (user) {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    }
    this.updateAuthUI();
  }

  async login(email, password) {
    const result = await window.api.login(email, password);
    if (result.success) {
      // Decode token to get userId
      const tokenPayload = this.decodeToken(result.token);
      const userId = tokenPayload?.id;
      
      this.setAuth(result.token, { email, _id: userId });
      
      // Fetch full profile
      if (userId) {
        const profile = await window.api.getProfileById(userId);
        if (profile.success && profile.user) {
          localStorage.setItem(this.userKey, JSON.stringify(profile.user));
        }
      }
      
      // Sync guest orders to account
      this.syncGuestOrders(email);
    }
    return result;
  }

  // Sync guest orders when user logs in
  syncGuestOrders(userEmail) {
    const GUEST_ORDERS_KEY = 'reda_guest_orders';
    const orders = localStorage.getItem(GUEST_ORDERS_KEY);
    if (!orders) return;
    
    try {
      const guestOrders = JSON.parse(orders);
      const matchingOrders = guestOrders.filter(order => 
        order.address?.email?.toLowerCase() === userEmail.toLowerCase()
      );
      
      if (matchingOrders.length > 0) {
        // Remove synced orders from local storage
        const remainingOrders = guestOrders.filter(order => 
          order.address?.email?.toLowerCase() !== userEmail.toLowerCase()
        );
        localStorage.setItem(GUEST_ORDERS_KEY, JSON.stringify(remainingOrders));
        
        // Show notification if UI is available
        if (window.UI?.showToast) {
          window.UI.showToast(`${matchingOrders.length} commande(s) liée(s) à votre compte`, 'success');
        }
      }
    } catch (e) {
      console.error('Error syncing guest orders:', e);
    }
  }

  // Decode JWT token to get payload
  decodeToken(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error decoding token:', e);
      return null;
    }
  }

  async register(name, email, password) {
    const result = await window.api.register(name, email, password);
    if (result.success) {
      this.setAuth(result.token, { name, email });
    }
    return result;
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.updateAuthUI();
    window.location.href = 'index.html';
  }

  updateAuthUI() {
    const loginBtns = document.querySelectorAll('.login_signup');
    const isLoggedIn = this.isLoggedIn();
    const user = this.getUser();

    loginBtns.forEach(btn => {
      if (isLoggedIn) {
        btn.innerHTML = `
          <a href="account.html" class="btn">
            <i class="fa-regular fa-user"></i>
            ${user?.name || 'Compte'}
          </a>
          <a href="#" onclick="auth.logout(); return false;" class="btn btn-logout" style="background: transparent; border: 1px solid var(--main_color); color: var(--main_color);">
            Déconnexion<i class="fa-solid fa-right-from-bracket" style="color:blue"></i>
          </a>
        `;
      } else {
        btn.innerHTML = `
          <a href="login.html" class="btn"><i class="fa-solid fa-right-to-bracket"></i> Connexion</a>
          <a href="register.html" class="btn"><i class="fa-solid fa-user-plus"></i> Inscription</a>
        `;
      }
    });
  }
}

// Create global instance
window.auth = new AuthService();

// Update UI on page load
document.addEventListener('DOMContentLoaded', () => {
  window.auth.updateAuthUI();
});
