// BemsBridge client-side integration
const BemsBridge = {
  // Use relative URL so it works on any host/port
  BASE_URL: '',

  async fetchCurrentUser() {
    try {
      const response = await fetch(`${this.BASE_URL}/api/auth/current_user`);
      if (response.ok) {
        const text = await response.text();
        return text ? JSON.parse(text) : null;
      }
      return null;
    } catch (e) {
      console.error('Fetch user failed', e);
      return null;
    }
  },

  async fetchProduct(handle) {
    try {
      const response = await fetch(`${this.BASE_URL}/api/products/${handle}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (e) {
      console.error('Fetch product failed', e);
      return null;
    }
  },

  async fetchProducts() {
    try {
      const response = await fetch(`${this.BASE_URL}/api/products`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (e) {
      console.error('Fetch products failed', e);
      return [];
    }
  },

  async fetchSearchResults(query) {
    try {
      const response = await fetch(`${this.BASE_URL}/api/products/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (e) {
      console.error('Search products failed', e);
      return [];
    }
  },

  async getCart() {
    try {
      const response = await fetch(`${this.BASE_URL}/api/cart`, { credentials: 'include' });
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (e) {
      console.error('Get cart failed', e);
      return null;
    }
  },

  async clearCart() {
    try {
      const response = await fetch(`${this.BASE_URL}/api/cart`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (e) {
      console.error('Clear cart failed', e);
      return null;
    }
  },

  async addToCart(productId, quantity) {
    try {
      const response = await fetch(`${this.BASE_URL}/api/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId, quantity })
      });
      if (response.ok) {
        return await response.json();
      }
      const err = await response.json();
      throw new Error(err.message || 'Failed to add to cart');
    } catch (e) {
      console.error('Add to cart failed', e);
      alert(e.message || 'Failed to add to cart.');
      return null;
    }
  },

  async updateCartItem(productId, quantity) {
    try {
      const response = await fetch(`${this.BASE_URL}/api/cart/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quantity })
      });
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (e) {
      console.error('Update quantity failed', e);
      return null;
    }
  },

  async removeCartItem(productId) {
    try {
      const response = await fetch(`${this.BASE_URL}/api/cart/${productId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (e) {
      console.error('Remove item failed', e);
      return null;
    }
  },

  async checkout(shippingAddress, reference, paymentMethod = 'Paystack') {
    try {
      const response = await fetch(`${this.BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shippingAddress, reference, paymentMethod })
      });
      if (response.ok) {
        return await response.json();
      }
      const err = await response.json();
      throw new Error(err.message || 'Checkout failed');
    } catch (e) {
      console.error('Checkout failed', e);
      alert(e.message || 'Checkout failed.');
      return null;
    }
  }
};

// Main execution when backend-bridge is loaded
document.addEventListener("DOMContentLoaded", async () => {
  const inSubfolder = window.location.pathname.includes('/products/') ||
    window.location.pathname.includes('/collections/') ||
    window.location.pathname.includes('/pages/') ||
    window.location.pathname.includes('/policies/') ||
    window.location.pathname.includes('/blogs/');
  const rootPrefix = inSubfolder ? '../' : '';

  // --- Cart State (localStorage) ---
  const CART_IDS_KEY = 'bems-cart-ids';
  const getCartIds = () => {
    try { return JSON.parse(localStorage.getItem(CART_IDS_KEY) || '[]'); } catch(e) { return []; }
  };
  const saveCartIds = (ids) => {
    try { localStorage.setItem(CART_IDS_KEY, JSON.stringify([...new Set(ids)])); } catch(e) {}
  };
  const addCartId = (id) => { const ids = getCartIds(); ids.push(String(id)); saveCartIds(ids); };
  const isInCart = (id) => getCartIds().includes(String(id));

  // --- Badge Helper (works from a cart object OR by counting localStorage IDs) ---
  const applyBadgeCount = (count) => {
    document.querySelectorAll('#cart-notification-count, .bems-cart-badge').forEach(el => {
      el.textContent = count;
    });
    // Also update the visually-hidden sibling if present
    document.querySelectorAll('#cart-notification-count').forEach(el => {
      const sib = el.nextElementSibling;
      if (sib && sib.classList.contains('visually-hidden')) sib.textContent = count + ' items';
    });
  };

  const renderCartDrawer = (cart) => {
    const minCartItems = document.getElementById('min-cart-items');
    const emptyCartItem = document.querySelector('.empty__cart__item');
    const cartFooter = document.getElementById('empty__cart__button');
    const subtotalEl = document.getElementById('cart-notification-subtotal');
    const productContainer = document.getElementById('cart-notification-product');
    const cartAddSuccess = document.querySelector('.item__success_message');
    const cartEmptyHead = document.querySelector('.item__empty_message');
    
    if (!minCartItems || !emptyCartItem || !productContainer) return;
    
    const count = cart && cart.items ? cart.items.reduce((s, i) => s + (i.quantity || 1), 0) : 0;
    
    if (count === 0) {
      emptyCartItem.classList.remove('no-js-inline');
      minCartItems.classList.add('no-js-inline');
      if (cartFooter) cartFooter.classList.add('no-js-inline');
      if (cartAddSuccess) cartAddSuccess.classList.add('no-js-inline');
      if (cartEmptyHead) cartEmptyHead.classList.remove('no-js-inline');
      return;
    }
    
    emptyCartItem.classList.add('no-js-inline');
    minCartItems.classList.remove('no-js-inline');
    if (cartFooter) cartFooter.classList.remove('no-js-inline');
    if (cartAddSuccess) cartAddSuccess.classList.remove('no-js-inline');
    if (cartEmptyHead) cartEmptyHead.classList.add('no-js-inline');
    
    let subtotal = 0;
    let html = '<ul style="list-style:none; margin:0; padding:0 20px;">';
    
    cart.items.forEach(item => {
      const p = item.product;
      const price = parseFloat(p.price || 0);
      subtotal += price * item.quantity;
      const img = (rootPrefix || '') + p.imageUrl.replace(/^\//, '');
      const category = p.category || 'Individual';
      html += `
        <li style="display:flex; gap:18px; padding:20px 0; border-bottom:1px solid #f0f0f0;">
          <a href="${rootPrefix}products/${p.handle}.html" style="flex-shrink:0; display:block; width:100px; height:130px; overflow:hidden; border-radius:4px; border:1px solid #eee;">
            <img src="${img}" alt="${p.title}" style="width:100%; height:100%; object-fit:cover;">
          </a>
          <div style="flex:1; display:flex; flex-direction:column; justify-content:space-between; min-width:0;">
            <div>
              <div style="font-size:11px; font-weight:500; letter-spacing:1.5px; text-transform:uppercase; color:#999; margin-bottom:5px;">BOOKZAN</div>
              <a href="${rootPrefix}products/${p.handle}.html" style="text-decoration:none; color:inherit;">
                <div style="font-size:15px; font-weight:700; color:#111; line-height:1.35; margin-bottom:6px;">${p.title}</div>
              </a>
              <div style="font-size:13px; margin-bottom:7px;"><span style="font-weight:600; color:#222;">User type: </span><span style="color:#7b68ee; font-weight:500;">${category}</span></div>
              <div style="font-size:15px; font-weight:700; color:#111;">$${price.toFixed(2)}</div>
            </div>
            <div style="display:flex; align-items:center; gap:12px; margin-top:12px;">
              <div style="display:inline-flex; align-items:center; border:1px solid #ccc; border-radius:4px; overflow:hidden;">
                <button type="button" onclick="window.bemsUpdateCartItem(this,'${p.id}',${item.quantity - 1})" style="width:32px; height:32px; border:none; background:transparent; font-size:18px; line-height:1; cursor:pointer; color:#333; display:flex; align-items:center; justify-content:center;">−</button>
                <span style="min-width:36px; text-align:center; font-size:14px; font-weight:600; border-left:1px solid #ccc; border-right:1px solid #ccc; height:32px; display:flex; align-items:center; justify-content:center;">${item.quantity}</span>
                <button type="button" onclick="window.bemsUpdateCartItem(this,'${p.id}',${item.quantity + 1})" style="width:32px; height:32px; border:none; background:transparent; font-size:18px; line-height:1; cursor:pointer; color:#333; display:flex; align-items:center; justify-content:center;">+</button>
              </div>
              <button type="button" onclick="window.bemsRemoveCartItem(this,'${p.id}')" style="border:none; background:transparent; font-size:13px; font-weight:500; color:#111; text-decoration:underline; cursor:pointer; padding:0;">Remove</button>
            </div>
          </div>
        </li>
      `;
    });
    
    html += '</ul>';
    productContainer.innerHTML = html;
    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  };

  const updateCartBadge = async (cartData) => {
    try {
      let count = 0;
      let actualCart = cartData;
      if (cartData && cartData.items) {
        // Use provided cart data (from addToCart response) — no extra network call
        count = cartData.items.reduce((sum, i) => sum + (i.quantity || 1), 0);
        // Sync localStorage IDs from actual cart
        saveCartIds(cartData.items.map(i => String(i.productId)));
      } else {
        // Fetch from API (page load scenario)
        actualCart = await BemsBridge.getCart();
        if (actualCart && actualCart.items) {
          count = actualCart.items.reduce((sum, i) => sum + (i.quantity || 1), 0);
          saveCartIds(actualCart.items.map(i => String(i.productId)));
        }
      }
      applyBadgeCount(count);
      renderCartDrawer(actualCart);
    } catch(e) {
      // If user not logged in, badge stays at 0 — that's fine
    }
  };

  // Flip the + icon to a cart icon on a specific card
  const flipCardIconToCart = (btn, productHandle) => {
    if (!btn) return;
    const li = btn.closest('li');
    if (!li) return;
    const href = (rootPrefix || '') + 'products/' + productHandle + '.html';
    li.innerHTML = `
      <a href="${href}" class="cart--icon-button button--icon h6 mb-0" aria-label="View in cart" title="Already in cart — view product">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      </a>`;
  };

  // Show a brief "Added to cart" toast
  const showCartToast = () => {
    let toast = document.getElementById('bems-cart-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'bems-cart-toast';
      toast.style.cssText = 'position:fixed;bottom:30px;right:30px;background:#222;color:#fff;padding:14px 24px;border-radius:8px;font-size:14px;font-weight:500;z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,.3);transition:opacity .35s;opacity:0;pointer-events:none;';
      document.body.appendChild(toast);
    }
    toast.textContent = '✓ Added to cart!';
    toast.style.opacity = '1';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
  };

  // Core: add to cart, update badge from response, flip icon, show toast
  const addToCartAndUpdate = async (productId, productHandle, qty, buttonEl) => {
    if (buttonEl) { 
      buttonEl.disabled = true; 
      const svg = buttonEl.querySelector('svg');
      if (svg) svg.classList.add('bems-spin-anim');
    }
    
    // Track time to ensure the animation plays for at least 1 full cycle (600ms)
    const startTime = Date.now();
    const result = await BemsBridge.addToCart(productId, qty || 1);
    
    const elapsed = Date.now() - startTime;
    if (elapsed < 600) {
      await new Promise(r => setTimeout(r, 600 - elapsed));
    }
    if (result) {
      addCartId(productId);
      await updateCartBadge(result);   // result IS the updated cart — no extra fetch needed
      flipCardIconToCart(buttonEl, productHandle || productId);
      showCartToast();
    }
    if (buttonEl) { buttonEl.disabled = false; buttonEl.style.opacity = ''; }
    return result;
  };

  // Global hooks called by onclick in dynamic HTML
  window.bemsAddToCart = (btn, productId, productHandle) => addToCartAndUpdate(productId, productHandle, 1, btn);
  window.bemsGoToProduct = (handle) => { window.location.href = (rootPrefix || '') + 'products/' + handle + '.html'; };
  
  window.bemsUpdateCartItem = async (btn, productId, qty) => {
    if (btn) btn.disabled = true;
    const result = qty <= 0 ? await BemsBridge.removeCartItem(productId) : await BemsBridge.updateCartItem(productId, qty);
    if (result) await updateCartBadge(result);
  };
  window.bemsRemoveCartItem = async (btn, productId) => {
    if (btn) btn.disabled = true;
    const result = await BemsBridge.removeCartItem(productId);
    if (result) await updateCartBadge(result);
  };

  // Update badge on every page load (syncs from server if logged in)
  updateCartBadge();

  // ─── Shared card renderer ────────────────────────────────────────────────
  // Renders the correct 3-icon overlay: [+/cart] [eye] [heart]
  // prefix = '' for homepage, '../' for subpages
  const SVG_PLUS = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.1176 8.18086H9.8606L9.9 1.125C9.9 0.826632 9.9 0.45 9.7955 0.329505C9.60001 0.104095 9.29837 0 9 0C8.70163 0 8.41548 0.118527 8.2045 0.329505C8.1 0.45 8.1 0.826632 8.1 1.125L8.14883 8.18086L1.125 8.1C0.826632 8.1 0.45 8.23808 0.329505 8.34258C0.118527 8.55356 0 8.70163 0 9C0 9.29837 0.118527 9.5053 0.329505 9.71628C0.39693 9.78371 0.826632 9.73125 1.125 9.73125L8.14883 9.84916L8.1 17.1C8.1 17.3983 8.25854 17.6705 8.25854 17.6705C8.46952 17.8814 8.70163 18 9 18C9.29837 18 9.56597 17.8814 9.77695 17.6705C9.88145 17.55 9.9 17.1733 9.9 16.875L9.8606 9.84916H17.1176C17.1176 9.84916 17.55 9.83575 17.6705 9.73125C17.909 9.52439 18 9.29837 18 9C18 8.70163 17.8814 8.52544 17.6705 8.31445C17.6705 8.31445 17.4159 8.18086 17.1176 8.18086Z" fill="currentColor"/></svg>`;
  const SVG_CART = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`;
  // Eye: proper square 24x24 Feather-style icon, with thin stroke to match the plus icon
  const SVG_EYE   = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  // Heart: outline by default with thin stroke, filled via .bems-liked class when clicked
  const SVG_HEART  = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path class="bems-heart-path" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;

  // Inject CSS for liked heart state and premium card hover animations (once)
  if (!document.getElementById('bems-wishlist-style')) {
    const style = document.createElement('style');
    style.id = 'bems-wishlist-style';
    style.textContent = `
      /* Wishlist heart styles */
      .bems-liked .bems-heart-path { fill: currentColor; }
      .wishlist__button.bems-liked { color: #e53935; }
      .wishlist__button { transition: color 0.2s; }
      
      /* Plus Icon Turning Animation */
      @keyframes bemsSpin {
        0% { transform: rotate(0deg) scale(1); }
        50% { transform: rotate(180deg) scale(1.2); }
        100% { transform: rotate(360deg) scale(1); }
      }
      .bems-spin-anim {
        animation: bemsSpin 0.6s ease-in-out infinite;
        transform-origin: center;
        transform-box: fill-box;
      }
      
      /* Premium Book Card Hover Animations */
      .product-grid-item {
        transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        will-change: transform;
      }
      .product-grid-item:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 24px rgba(0,0,0,0.1) !important;
        z-index: 2;
      }
      .product-grid-item .media img {
        transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
      }
      .product-grid-item:hover .media img {
        transform: scale(1.06);
      }
    `;
    document.head.appendChild(style);
  }

  // Restore wishlist state from localStorage on page load
  const WISHLIST_KEY = 'bems-wishlist-handles';
  const getWishlistHandles = () => { try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]'); } catch(e) { return []; } };
  const saveWishlistHandles = (arr) => { try { localStorage.setItem(WISHLIST_KEY, JSON.stringify([...new Set(arr)])); } catch(e) {} };

  // Toggle wishlist state on a heart button
  window.bemsToggleWishlist = (btn, handle) => {
    const liked = btn.classList.toggle('bems-liked');
    const handles = getWishlistHandles();
    if (liked) { handles.push(handle); } else { const i = handles.indexOf(handle); if (i > -1) handles.splice(i, 1); }
    saveWishlistHandles(handles);
  };

  // Helper to restore liked state on dynamically rendered cards
  const restoreWishlistState = () => {
    const liked = getWishlistHandles();
    document.querySelectorAll('.wishlist__button[data-product-handle]').forEach(btn => {
      if (liked.includes(btn.dataset.productHandle)) btn.classList.add('bems-liked');
    });
  };
  // Run after DOM settles
  setTimeout(restoreWishlistState, 300);

  const renderCard = (p, prefix, isSlider) => {
    const pf = prefix !== undefined ? prefix : rootPrefix;
    const inCart = isInCart(p.id);
    const firstIcon = inCart
      ? `<a href="${pf}products/${p.handle}.html" class="cart--icon-button button--icon h6 mb-0" aria-label="View in cart" title="Already in cart">${SVG_CART}</a>`
      : `<button type="button" class="cart--icon-button button--icon h6 mb-0" onclick="window.bemsAddToCart(this,'${p.id}','${p.handle}')" aria-label="Add to cart">${SVG_PLUS}</button>`;
    return `
<div class="col mb-30${isSlider ? ' swiper-slide' : ''}">
  <div class="product-grid-item color-background-1 gradient card outline" style="height:100%;">
    <div class="product-grid-item__thumbnail">
      <a href="${pf}products/${p.handle}.html" class="d-block product__media_thumbnail">
        <div class="media media--transparent media--square media--hover-effect">
          <img src="${pf}${p.imageUrl.replace(/^\//, '')}" alt="${p.title}" loading="lazy" class="motion-reduce" width="800" height="1000">
        </div>
      </a>
      <ul class="product-grid-item__actions bottom_center style2 justify-content-center bottom_position">
        <li>${firstIcon}</li>
        <li><button type="button" onclick="window.location.href='${pf}products/${p.handle}.html'" class="cart--icon-button button--icon h6 mb-0" aria-label="View product">${SVG_EYE}</button></li>
        <li><button type="button" class="cart--icon-button button--icon h6 mb-0 wishlist__button product-grid-item__wishlist" onclick="window.bemsToggleWishlist(this,'${p.handle}')" aria-label="Add to wishlist" data-product-handle="${p.handle}">${SVG_HEART}</button></li>
      </ul>
    </div>
    <div class="product-grid-item__content text-center">
      <div class="product-grid-item__titles">
        <h3 class="product-grid-item__title h6"><a href="${pf}products/${p.handle}.html">${p.title}</a></h3>
      </div>
      <div class="price product-grid-item__price justify-content-center price--on-sale">
        <dl><div class="price__sale">
          <dt><span class="visually-hidden visually-hidden--inline">Sale price</span></dt>
          <dd><span class="price-item price-item--sale price-item--last">$${parseFloat(p.price).toFixed(2)}</span></dd>
        </div></dl>
      </div>
    </div>
  </div>
</div>`;
  };
  // ─────────────────────────────────────────────────────────────────────────

  // 1. Check user session and update Auth / Account link in headers
  const currentUser = await BemsBridge.fetchCurrentUser();
  const accountLinks = document.querySelectorAll('a[href="/api/auth/google"], a[href$="login.html"], a[href$="register.html"]');

  if (currentUser) {
    accountLinks.forEach(link => {
      link.href = '/api/auth/logout';
      const textLabel = link.querySelector('.accounts__text--label') || link;
      if (textLabel !== link) {
        textLabel.textContent = 'Log out (' + (currentUser.displayName || currentUser.email) + ')';
      } else {
        link.textContent = 'Log out (' + (currentUser.displayName || currentUser.email) + ')';
      }
    });
  }

  // 2. Dynamic-ify Product Details Page
  if (window.location.pathname.includes('/products/') && !window.location.pathname.includes('gift-card')) {
    const handle = window.location.pathname.split('/').pop().replace('.html', '');
    const dbProduct = await BemsBridge.fetchProduct(handle);

    if (dbProduct) {
      const titleEl = document.querySelector('.product__title');
      if (titleEl) titleEl.textContent = dbProduct.title;

      const priceSaleEl = document.querySelector('.price-item--sale');
      const priceRegularEl = document.querySelector('.price-item--regular');
      if (priceSaleEl) priceSaleEl.textContent = '$' + parseFloat(dbProduct.price).toFixed(2);
      if (priceRegularEl) priceRegularEl.textContent = '$' + parseFloat(dbProduct.price).toFixed(2);

      const cartForm = document.querySelector('form[action="/cart/add"]');
      if (cartForm) {
        cartForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const submitBtn = cartForm.querySelector('button[type="submit"]');
          const quantityInput = cartForm.querySelector('input[name="quantity"]');
          const qty = quantityInput ? parseInt(quantityInput.value) : 1;
          await addToCartAndUpdate(dbProduct.id, dbProduct.handle, qty, submitBtn);
        });
      }

      // Populate Recommended Products
      const recContainer = document.querySelector('product-recommendations [grid-recommendation]');
      if (recContainer) {
        const allProducts = await BemsBridge.fetchProducts();
        if (allProducts && allProducts.length > 0) {
          const recs = allProducts.filter(p => p.handle !== handle).slice(0, 4);
          if (recs.length > 0) {
            recContainer.className = 'row row-cols-xl-4 row-cols-2 mb--n30 collection__product w-100';
            recContainer.innerHTML = recs.map(p => renderCard(p, rootPrefix, false)).join('');
          } else {
            const recSection = document.querySelector('product-recommendations');
            if (recSection) recSection.style.display = 'none';
          }
        }
      }
    }
  }

  // 2.6 Populate "Recently Viewed" section on product pages
  if (window.location.pathname.includes('/products/') && !window.location.pathname.includes('gift-card')) {
    const recentGrid = document.querySelector('[grid-recentViewProduct]');
    if (recentGrid) {
      const currentHandle = window.location.pathname.split('/').pop().replace('.html', '');
      const stored = localStorage.getItem('shopify-recent-view') || '';
      const recentHandles = stored.split(',').map(h => h.trim()).filter(h => h && h !== currentHandle);

      if (recentHandles.length === 0) {
        // hide the whole section if no history
        const section = recentGrid.closest('section') || recentGrid.closest('.shopify-section');
        if (section) section.style.display = 'none';
      } else {
        const allProducts = await BemsBridge.fetchProducts();
        if (allProducts && allProducts.length > 0) {
          const recentProducts = recentHandles
            .map(h => allProducts.find(p => p.handle === h))
            .filter(Boolean)
            .slice(0, 4);

          if (recentProducts.length > 0) {
            // Convert the broken swiper container into a proper Bootstrap row
            const swiperParent = recentGrid.parentElement;
            if (swiperParent) {
              swiperParent.classList.remove('productSlider', 'swiper');
            }
            recentGrid.className = 'row row-cols-xl-4 row-cols-2 mb--n30 w-100';
            recentGrid.innerHTML = recentProducts.map(p => renderCard(p, rootPrefix, false)).join('');
          } else {
            // No matching products found in DB — hide section
            const section = recentGrid.closest('section') || recentGrid.closest('.shopify-section');
            if (section) section.style.display = 'none';
          }
        }
      }
    }
  }

  // 2.5 Intercept Search Forms — redirect to shop page with ?q=
  const searchForms = document.querySelectorAll('form[action="/search"]');
  searchForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const qInput = form.querySelector('input[name="q"]');
      if (qInput && qInput.value.trim()) {
        window.location.href = rootPrefix + 'collections/all.html?q=' + encodeURIComponent(qInput.value.trim());
      }
    });
  });

  // 3. Dynamic-ify Cart Page
  if (window.location.pathname.endsWith('/cart.html') || window.location.pathname.endsWith('/cart')) {
    let totalCartSum = 0;

    const renderCart = async () => {
      const cart = await BemsBridge.getCart();
      const cartItemsEl = document.querySelector('cart-items');
      const footerEl = document.getElementById('main-cart-footer');

      if (!cart || !cart.items || cart.items.length === 0) {
        if (cartItemsEl) cartItemsEl.classList.add('is-empty');
        if (footerEl) {
          footerEl.classList.add('is-empty');
          const footerEmptyDiv = footerEl.querySelector('.is-empty');
          if (footerEmptyDiv) footerEmptyDiv.style.display = 'none';
        }
        return;
      }

      if (cartItemsEl) cartItemsEl.classList.remove('is-empty');
      if (footerEl) {
        footerEl.classList.remove('is-empty');
        const footerEmptyDiv = footerEl.querySelector('.is-empty') || footerEl.querySelector('div > div');
        if (footerEmptyDiv) {
          footerEmptyDiv.classList.remove('is-empty');
          footerEmptyDiv.style.display = 'block';
        }
      }

      const cartForm = document.getElementById('cart');
      if (cartForm) cartForm.classList.remove('critical-hidden');

      const contentsContainer = document.querySelector('.js-contents');
      if (contentsContainer) {
        totalCartSum = 0;
        let itemsHtml = `
          <table class="cart-items" style="width: 100%; border-collapse: collapse; margin-bottom: 2rem;">
            <thead>
              <tr style="border-bottom: 1px solid #ddd;">
                <th colspan="2" style="text-align: left; padding: 10px;">Product</th>
                <th style="text-align: right; padding: 10px;">Price</th>
                <th style="text-align: center; padding: 10px;">Quantity</th>
                <th style="text-align: right; padding: 10px;">Total</th>
              </tr>
            </thead>
            <tbody>
        `;

        cart.items.forEach((item) => {
          const product = item.product;
          const price = parseFloat(product.price);
          const itemSubtotal = price * item.quantity;
          totalCartSum += itemSubtotal;

          itemsHtml += `
            <tr class="cart-item" style="border-bottom: 1px solid #eee; padding: 15px 0;">
              <td style="padding: 15px 10px; width: 100px;">
                <a href="${rootPrefix}products/${product.handle}.html">
                  <img src="${rootPrefix}${product.imageUrl.replace(/^\//, '')}" alt="${product.title}" style="max-width: 80px; height: auto; border-radius: 4px;">
                </a>
              </td>
              <td style="padding: 15px 10px; vertical-align: middle;">
                <a href="${rootPrefix}products/${product.handle}.html" class="cart-item__name h4" style="font-weight: bold; text-decoration: none; color: #333;">${product.title}</a>
                <div style="font-size: 1.2rem; color: #888; margin-top: 5px;">Category: ${product.category}</div>
              </td>
              <td style="padding: 15px 10px; text-align: right; vertical-align: middle;">$${price.toFixed(2)}</td>
              <td style="padding: 15px 10px; text-align: center; vertical-align: middle;">
                <div style="display: inline-flex; align-items: center; border: 1px solid #ccc; border-radius: 4px; overflow: hidden;">
                  <button type="button" style="background: #f7f7f7; border: none; padding: 5px 12px; cursor: pointer; font-weight: bold;" onclick="event.preventDefault(); BemsBridge.updateQty('${product.id}', ${item.quantity - 1})">-</button>
                  <span style="padding: 5px 15px; font-weight: bold; min-width: 30px; display: inline-block;">${item.quantity}</span>
                  <button type="button" style="background: #f7f7f7; border: none; padding: 5px 12px; cursor: pointer; font-weight: bold;" onclick="event.preventDefault(); BemsBridge.updateQty('${product.id}', ${item.quantity + 1})">+</button>
                </div>
                <div style="margin-top: 8px;">
                  <a href="#" style="color: #d9534f; font-size: 1.2rem; text-decoration: none;" onclick="event.preventDefault(); BemsBridge.removeItem('${product.id}')">Remove</a>
                </div>
              </td>
              <td style="padding: 15px 10px; text-align: right; vertical-align: middle; font-weight: bold;">$${itemSubtotal.toFixed(2)}</td>
            </tr>
          `;
        });

        itemsHtml += `</tbody></table>`;
        contentsContainer.innerHTML = itemsHtml;

        const totalsDiv = document.querySelector('.totals__subtotal-value');
        if (totalsDiv) totalsDiv.textContent = '$' + totalCartSum.toFixed(2);
      }
    };

    BemsBridge.updateQty = async (productId, quantity) => {
      if (quantity < 1) {
        await BemsBridge.removeItem(productId);
        return;
      }
      await BemsBridge.updateCartItem(productId, quantity);
      await renderCart();
    };

    BemsBridge.removeItem = async (productId) => {
      await BemsBridge.removeCartItem(productId);
      await renderCart();
    };

    await renderCart();

    // Hook up checkout button
    const checkoutBtn = document.getElementById('checkout') || document.querySelector('.cart__checkout-button');
    if (checkoutBtn) {
      const newCheckoutBtn = checkoutBtn.cloneNode(true);
      checkoutBtn.parentNode.replaceChild(newCheckoutBtn, checkoutBtn);
      newCheckoutBtn.removeAttribute('disabled');
      newCheckoutBtn.style.pointerEvents = 'auto';

      newCheckoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        if (!currentUser) {
          alert('Please log in to proceed to checkout.');
          window.location.href = '/api/auth/google';
          return;
        }

        const address = prompt('Please enter your Shipping Address for delivery:');
        if (!address) return;

        const configRes = await fetch(`${BemsBridge.BASE_URL}/api/orders/paystack-config`);
        const config = await configRes.json();
        if (!config.publicKey) {
          alert('Payment gateway not configured. Please contact support.');
          return;
        }

        if (typeof PaystackPop === 'undefined') {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://js.paystack.co/v1/inline.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        const amountInKobo = Math.round(totalCartSum * 100);

        const handler = PaystackPop.setup({
          key: config.publicKey,
          email: currentUser.email || 'customer@example.com',
          amount: amountInKobo,
          currency: 'ZAR',
          callback: async function(response) {
            const reference = response.reference;
            const order = await BemsBridge.checkout(address, reference);

            if (order) {
              const mainContent = document.getElementById('MainContent');
              if (mainContent) {
                mainContent.innerHTML = `
                  <div class="container" style="padding: 100px 15px; text-align: center; max-width: 600px; margin: 0 auto;">
                    <div style="background: #e7f4e4; color: #3c763d; border-radius: 50%; width: 80px; height: 80px; display: inline-flex; align-items: center; justify-content: center; font-size: 40px; margin-bottom: 20px; border: 2px solid #d6e9c6;">✓</div>
                    <h1 style="font-size: 32px; font-weight: bold; margin-bottom: 10px;">Order Placed Successfully!</h1>
                    <p style="font-size: 16px; color: #555; margin-bottom: 30px; line-height: 1.6;">
                      Thank you for your purchase! Your order <strong>#${order.id.slice(0, 8)}</strong> has been processed.
                    </p>
                    <div style="background: #fafafa; border: 1px solid #eee; border-radius: 6px; padding: 20px; margin-bottom: 30px; text-align: left;">
                      <h4 style="margin-top: 0; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 10px;">Order Details</h4>
                      <div style="margin: 10px 0; display: flex; justify-content: space-between;"><strong>Shipping Address:</strong> <span>${order.shippingAddress}</span></div>
                      <div style="margin: 10px 0; display: flex; justify-content: space-between;"><strong>Total Amount Paid:</strong> <strong style="color: #222;">$${parseFloat(order.totalAmount).toFixed(2)}</strong></div>
                      <div style="margin: 10px 0; display: flex; justify-content: space-between;"><strong>Payment Method:</strong> <span>${order.paymentMethod}</span></div>
                      <div style="margin: 10px 0; display: flex; justify-content: space-between;"><strong>Status:</strong> <span style="background: #5cb85c; color: white; padding: 2px 8px; border-radius: 4px; font-size: 1.2rem;">${order.status}</span></div>
                    </div>
                    <a href="${rootPrefix}index.html" class="button button--primary" style="padding: 12px 30px; font-size: 1.6rem; text-decoration: none; border-radius: 4px;">Return to Shop</a>
                  </div>
                `;
              }
            }
          },
          onClose: function() {
            alert('Transaction was not completed, window closed.');
          }
        });

        handler.openIframe();
      });
    }
  }

  // 4. Dynamic-ify Homepage (Featured Products Grid)
  const isHomepage = window.location.pathname === '/' ||
    window.location.pathname === '/index.html' ||
    window.location.pathname.endsWith('/index.html');
  if (isHomepage) {
    const products = await BemsBridge.fetchProducts();

    if (products && products.length > 0) {
      // Use shared renderCard helper (prefix '' for homepage root)
      const gridContainer = document.querySelector('.feature-product-wrapper .row.collection__product');
      if (gridContainer) {
        gridContainer.innerHTML = products.slice(0, 8).map(p => renderCard(p, '', false)).join('');
      }

      const sliderContainer = document.querySelector('.feature-product-wrapper .swiper-wrapper');
      if (sliderContainer) {
        // Convert Swiper wrapper to a standard Bootstrap row grid
        const parent = sliderContainer.parentElement;
        if (parent) parent.classList.remove('swiper', 'productSlider');
        sliderContainer.className = 'row row-cols-xl-4 row-cols-2 mb--n30 collection__product w-100';
        sliderContainer.innerHTML = products.slice(0, 8).map(p => renderCard(p, '', false)).join('');
      }
    }
  }

  // 5. Dynamic-ify Shop/Search Page (collections/all.html)
  const isShopPage = window.location.pathname.endsWith('/collections/all.html') ||
    window.location.pathname.endsWith('/collections/all');
  if (isShopPage) {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');

    let products = [];
    if (query) {
      products = await BemsBridge.fetchSearchResults(query);
      const titleEl = document.querySelector('.collection-hero__title, h1.title');
      if (titleEl) titleEl.textContent = `Search Results for "${query}"`;
      document.title = `Search: ${query} - Bems Books`;
    } else {
      products = await BemsBridge.fetchProducts();
    }

    // The grid row has class "row row-cols-lg-3 row-cols-md-3 row-cols-2"
    // and the data-product-grid attribute — use the attribute selector so we
    // preserve the row's Bootstrap column classes (they control horizontal layout)
    const gridRow = document.querySelector('#product-grid [data-product-grid]');
    const loadingOverlay = document.querySelector('#product-grid .loading-overlay');
    if (loadingOverlay) loadingOverlay.style.display = 'none';

    if (gridRow) {
      if (products.length === 0) {
        gridRow.innerHTML = '<div class="col-12 text-center" style="padding:40px 0;"><h4>No products found.</h4></div>';
      } else {
        // Use shared renderCard helper for consistent 3-icon layout
        gridRow.innerHTML = products.map(p => renderCard(p, rootPrefix, false)).join('');
      }
    }
  }
});
