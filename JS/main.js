// Main JavaScript - Navigation and UI interactions

// Category dropdown toggle
let category_nav_list = document.querySelector(".category_nav_list");

function Open_Categ_list() {
    if (category_nav_list) {
        category_nav_list.classList.toggle("active");
    }
}

// Mobile menu toggle
let nav_links = document.querySelector(".nav_links");
let menuOverlay = document.querySelector('.menu-overlay');

function open_Menu() {
    if (nav_links) {
        nav_links.classList.toggle("active");
    }
    if (menuOverlay) {
        menuOverlay.classList.toggle("active");
    }
    // Prevent body scroll when menu is open
    document.body.style.overflow = nav_links?.classList.contains('active') ? 'hidden' : '';
}

// Cart sidebar toggle
var cartSidebar = document.querySelector('.cart');
var cartOverlay = document.querySelector('.cart-overlay');

function open_close_cart() {
    if (cartSidebar) {
        cartSidebar.classList.toggle("active");
    }
    if (cartOverlay) {
        cartOverlay.classList.toggle("active");
    }
    // Prevent body scroll when cart is open
    document.body.style.overflow = cartSidebar?.classList.contains('active') ? 'hidden' : '';
}

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    // Close category dropdown
    if (category_nav_list && !e.target.closest('.category_nav')) {
        category_nav_list.classList.remove('active');
    }
});

// Initialize cart UI on page load
document.addEventListener('DOMContentLoaded', () => {
    // Update cart UI
    if (window.cart) {
        window.cart.updateCartUI();
    }
    
    // Update wishlist UI
    if (window.wishlist) {
        window.wishlist.updateWishlistUI();
    }
    
    // Update auth UI
    if (window.auth) {
        window.auth.updateAuthUI();
    }
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
});

// Add loading state to buttons on form submit
document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function() {
        const btn = this.querySelector('button[type="submit"]');
        if (btn && !btn.disabled) {
            btn.dataset.originalText = btn.innerHTML;
            btn.innerHTML = '<span class="spinner"></span> Chargement...';
            btn.disabled = true;
            
            // Re-enable after 10 seconds as fallback
            setTimeout(() => {
                if (btn.dataset.originalText) {
                    btn.innerHTML = btn.dataset.originalText;
                    btn.disabled = false;
                }
            }, 10000);
        }
    });
});
