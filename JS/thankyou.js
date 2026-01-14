// Thank You Page Logic
const GUEST_ORDERS_KEY = 'reda_guest_orders';

// Get guest orders from local storage
function getGuestOrders() {
    const orders = localStorage.getItem(GUEST_ORDERS_KEY);
    return orders ? JSON.parse(orders) : [];
}

// Save guest order to local storage
function saveGuestOrder(order) {
    const orders = getGuestOrders();
    orders.unshift(order); // Add to beginning
    // Keep only last 20 orders
    if (orders.length > 20) {
        orders.pop();
    }
    localStorage.setItem(GUEST_ORDERS_KEY, JSON.stringify(orders));
}

// Get order from session storage (set during checkout)
function getLastOrder() {
    const order = sessionStorage.getItem('lastOrder');
    return order ? JSON.parse(order) : null;
}

// Clear last order from session
function clearLastOrder() {
    sessionStorage.removeItem('lastOrder');
}

// Render order details
function renderOrderDetails(order) {
    if (!order) {
        window.location.href = 'index.html';
        return;
    }

    // Order number
    const orderId = order._id || order.orderId || generateOrderId();
    document.getElementById('orderNumber').textContent = `#${orderId.slice(-8).toUpperCase()}`;
    
    // Update track button
    document.getElementById('trackBtn').href = `track-order.html?id=${orderId}`;

    // Order items
    const itemsContainer = document.getElementById('orderItems');
    const items = order.items || [];
    
    itemsContainer.innerHTML = items.map(item => `
        <div class="order-item">
            <img src="${item.image?.[0] || item.img || 'img/placeholder.png'}" alt="${item.name}">
            <div class="order-item-info">
                <h4>${item.name}</h4>
                <p>Quantité: ${item.quantity}</p>
            </div>
            <div class="order-item-price">${UI.formatPrice(item.price * item.quantity)}</div>
        </div>
    `).join('');

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = 10;
    const total = order.amount || (subtotal + shipping);

    document.getElementById('subtotal').textContent = UI.formatPrice(subtotal);
    document.getElementById('shipping').textContent = UI.formatPrice(shipping);
    document.getElementById('total').textContent = UI.formatPrice(total);

    // Contact info
    const address = order.address || {};
    document.getElementById('contactInfo').innerHTML = `
        ${address.firstName || ''} ${address.lastName || ''}<br>
        ${address.email || ''}<br>
        ${address.phone || ''}
    `;

    // Address info
    document.getElementById('addressInfo').innerHTML = `
        ${address.street || ''}<br>
        ${address.city || ''}, ${address.state || ''} ${address.zipcode || ''}<br>
        ${address.country || ''}
    `;
}

// Generate a simple order ID for local orders
function generateOrderId() {
    return 'LOCAL' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
}

// Show guest notice and local orders
function showGuestFeatures() {
    document.getElementById('guestNotice').style.display = 'flex';
    
    const localOrders = getGuestOrders();
    if (localOrders.length > 0) {
        document.getElementById('localOrdersSection').style.display = 'block';
        renderLocalOrders(localOrders);
    }
}

// Render local orders list
function renderLocalOrders(orders) {
    const container = document.getElementById('localOrdersList');
    
    container.innerHTML = orders.slice(0, 5).map(order => {
        const orderId = order._id || order.orderId || 'N/A';
        const date = order.date ? new Date(order.date).toLocaleDateString('fr-FR') : 'N/A';
        const itemCount = order.items?.length || 0;
        const total = order.amount || 0;
        
        return `
            <div class="order-card" style="margin-bottom: 10px;">
                <div class="order-header">
                    <div>
                        <strong>#${orderId.slice(-8).toUpperCase()}</strong>
                        <p style="font-size:13px;color:var(--p_color);">${date}</p>
                    </div>
                    <span class="badge badge-info">Local</span>
                </div>
                <div class="order-body" style="padding: 15px 20px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span>${itemCount} article(s) • ${UI.formatPrice(total)}</span>
                        <a href="track-order.html?id=${orderId}" class="btn" style="padding:8px 16px;">Suivre</a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Sync local orders when user logs in
async function syncLocalOrdersToAccount() {
    if (!auth.isLoggedIn()) return;
    
    const localOrders = getGuestOrders();
    if (localOrders.length === 0) return;
    
    // Get user email to match orders
    const user = auth.getUser();
    if (!user?.email) return;
    
    // Filter orders that match user's email
    const userOrders = localOrders.filter(order => 
        order.address?.email?.toLowerCase() === user.email.toLowerCase()
    );
    
    if (userOrders.length > 0) {
        // Remove synced orders from local storage
        const remainingOrders = localOrders.filter(order => 
            order.address?.email?.toLowerCase() !== user.email.toLowerCase()
        );
        localStorage.setItem(GUEST_ORDERS_KEY, JSON.stringify(remainingOrders));
        
        UI.showToast(`${userOrders.length} commande(s) liée(s) à votre compte`, 'success');
    }
}

// Initialize thank you page
function initThankYouPage() {
    const order = getLastOrder();
    
    if (!order) {
        // No order in session, redirect to home
        window.location.href = 'index.html';
        return;
    }
    
    // Render order details
    renderOrderDetails(order);
    
    // Check if guest or logged in
    if (!auth.isLoggedIn()) {
        // Save to local storage for guests
        saveGuestOrder(order);
        showGuestFeatures();
    } else {
        // Try to sync any local orders
        syncLocalOrdersToAccount();
    }
    
    // Clear the session order after displaying
    clearLastOrder();
}

// Run on page load
document.addEventListener('DOMContentLoaded', initThankYouPage);
