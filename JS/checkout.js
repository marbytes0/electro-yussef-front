// Checkout Page Logic
function initCheckout() {
    renderOrderSummary();
    
    // Pre-fill form if logged in
    if (auth.isLoggedIn()) {
        const user = auth.getUser();
        if (user) {
            document.getElementById('email').value = user.email || '';
            const nameParts = (user.name || '').split(' ');
            document.getElementById('firstName').value = nameParts[0] || '';
            document.getElementById('lastName').value = nameParts.slice(1).join(' ') || '';
            document.getElementById('phone').value = user.phone || '';
        }
    }
}

function renderOrderSummary() {
    const cartItems = cart.getCart();
    const container = document.getElementById('orderItems');
    const subtotal = cart.getTotal();
    const shipping = cartItems.length > 0 ? 10 : 0;
    
    if (cartItems.length === 0) {
        window.location.href = 'cart.html';
        return;
    }
    
    container.innerHTML = cartItems.map(item => `
        <div style="display:flex;gap:15px;align-items:center;padding:10px 0;border-bottom:1px solid var(--border_color);">
            <img src="${item.image?.[0] || item.img}" alt="${item.name}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;">
            <div style="flex:1;">
                <p style="font-weight:500;font-size:14px;">${UI.truncateText(item.name, 40)}</p>
                <p style="color:var(--p_color);font-size:13px;">Qté: ${item.quantity}</p>
            </div>
            <p style="font-weight:600;">${UI.formatPrice(item.price * item.quantity)}</p>
        </div>
    `).join('');
    
    document.getElementById('subtotal').textContent = UI.formatPrice(subtotal);
    document.getElementById('shipping').textContent = UI.formatPrice(shipping);
    document.getElementById('total').textContent = UI.formatPrice(subtotal + shipping);
}

async function placeOrder(e) {
    e.preventDefault();
    
    const cartItems = cart.getCart();
    if (cartItems.length === 0) {
        UI.showToast('Votre panier est vide', 'error');
        return;
    }
    
    const btn = document.getElementById('placeOrderBtn');
    UI.showLoading(btn);
    
    const orderData = {
        items: cartItems,
        amount: cart.getTotal() + 10,
        address: {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            street: document.getElementById('street').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            zipcode: document.getElementById('zipcode').value,
            country: document.getElementById('country').value,
        }
    };
    
    let result;
    if (auth.isLoggedIn()) {
        result = await api.placeOrder(orderData);
    } else {
        result = await api.placeGuestOrder(orderData);
    }
    
    UI.hideLoading(btn);
    
    if (result.success) {
        // Prepare order data for thank you page
        const orderForThankYou = {
            _id: result.orderId || result.order?._id || null,
            orderId: result.orderId || result.order?._id || null,
            items: cartItems,
            amount: cart.getTotal() + 10,
            address: orderData.address,
            date: Date.now(),
            status: 'Order Placed'
        };
        
        // Save to session storage for thank you page
        sessionStorage.setItem('lastOrder', JSON.stringify(orderForThankYou));
        
        cart.clear();
        UI.showToast('Commande passée avec succès !', 'success');
        
        // Redirect to thank you page
        setTimeout(() => {
            window.location.href = 'thankyou.html';
        }, 1000);
    } else {
        UI.showToast(result.message || 'Échec de la commande', 'error');
    }
}

document.addEventListener('DOMContentLoaded', initCheckout);
