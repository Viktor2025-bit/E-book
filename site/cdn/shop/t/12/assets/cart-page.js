/**
 * BEMS Cart Page — dynamically renders cart items from the backend API.
 * Injected into cart.html by the server middleware.
 */
document.addEventListener('DOMContentLoaded', async () => {
  const isSubfolder = window.location.pathname.includes('/products/') ||
    window.location.pathname.includes('/collections/') ||
    window.location.pathname.includes('/pages/') ||
    window.location.pathname.includes('/policies/') ||
    window.location.pathname.includes('/blogs/');
  const rootPrefix = isSubfolder ? '../' : '';

  // ── Locate the static Shopify cart sections and hide them ──────────────────
  const staticCartItems = document.getElementById('main-cart-items');
  const staticCartFooter = document.getElementById('main-cart-footer');
  const cartWarnings = document.querySelector('.cart__warnings');
  if (staticCartItems) staticCartItems.style.display = 'none';
  if (staticCartFooter) staticCartFooter.style.display = 'none';
  if (cartWarnings) cartWarnings.style.display = 'none';

  // ── Create our dynamic container right after the page heading ──────────────
  const wrapper = document.querySelector('.cart_template_wrapper .row .col-12') ||
    document.querySelector('.cart_template_wrapper');

  if (!wrapper) return;

  const container = document.createElement('div');
  container.id = 'bems-cart-page';
  container.style.cssText = 'font-family: inherit; padding: 20px 0 60px;';
  wrapper.appendChild(container);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const fmt = (n) => '$' + parseFloat(n || 0).toFixed(2);

  const render = (cart) => {
    const items = cart && cart.items ? cart.items : [];
    const subtotal = items.reduce((s, i) => s + parseFloat(i.product.price || 0) * i.quantity, 0);

    if (items.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:80px 20px;">
          <svg width="64" height="64" fill="none" stroke="#ccc" stroke-width="1.5" viewBox="0 0 24 24" style="margin-bottom:20px;">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <h2 style="font-weight:700; font-size:22px; margin-bottom:10px;">Your cart is empty</h2>
          <p style="color:#888; margin-bottom:24px;">Looks like you haven't added any books yet.</p>
          <a href="${rootPrefix}collections/all.html" style="display:inline-block; padding:12px 32px; background:#111; color:#fff; text-decoration:none; border-radius:4px; font-size:14px; font-weight:600;">Continue Shopping</a>
        </div>`;
      return;
    }

    let itemRows = '';
    items.forEach(item => {
      const p = item.product;
      const price = parseFloat(p.price || 0);
      const lineTotal = price * item.quantity;
      const img = rootPrefix + p.imageUrl.replace(/^\//, '');
      const category = p.category || 'Individual';

      itemRows += `
        <tr data-product-id="${p.id}" style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:24px 16px 24px 0; vertical-align:top; width:50%;">
            <div style="display:flex; gap:20px; align-items:flex-start;">
              <a href="${rootPrefix}products/${p.handle}.html" style="display:block; flex-shrink:0; width:85px; height:110px; overflow:hidden; border:1px solid #eee; border-radius:4px;">
                <img src="${img}" alt="${p.title}" style="width:100%; height:100%; object-fit:cover;">
              </a>
              <div style="padding-top:4px;">
                <a href="${rootPrefix}collections/all.html" style="font-size:12px; color:#7b68ee; text-decoration:none; font-weight:500; display:block; margin-bottom:4px;">BookZan</a>
                <a href="${rootPrefix}products/${p.handle}.html" style="font-size:15px; font-weight:700; color:#111; text-decoration:none; display:block; margin-bottom:5px;">${p.title}</a>
                <span style="font-size:13px; color:#888;">User type: <span style="color:#7b68ee;">${category}</span></span>
              </div>
            </div>
          </td>
          <td style="padding:24px 16px; vertical-align:middle; text-align:center;">
            <div style="display:inline-flex; align-items:center; border:1px solid #ddd; border-radius:4px; overflow:hidden;">
              <button onclick="bemsCartPageUpdate('${p.id}', ${item.quantity - 1})" style="width:36px; height:36px; border:none; background:transparent; font-size:20px; cursor:pointer; color:#333;">−</button>
              <span id="bems-qty-${p.id}" style="min-width:40px; text-align:center; font-size:14px; font-weight:600; border-left:1px solid #ddd; border-right:1px solid #ddd; height:36px; display:flex; align-items:center; justify-content:center;">${item.quantity}</span>
              <button onclick="bemsCartPageUpdate('${p.id}', ${item.quantity + 1})" style="width:36px; height:36px; border:none; background:transparent; font-size:20px; cursor:pointer; color:#333;">+</button>
            </div>
            <button onclick="bemsCartPageRemove('${p.id}')" title="Remove" style="display:inline-flex; align-items:center; justify-content:center; width:32px; height:32px; background:transparent; border:none; cursor:pointer; margin-left:8px; color:#aaa; transition:color .2s;" onmouseover="this.style.color='#e53935'" onmouseout="this.style.color='#aaa'">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </td>
          <td style="padding:24px 0 24px 16px; vertical-align:middle; text-align:right; font-size:15px; font-weight:700; color:#b8860b;" id="bems-linetotal-${p.id}">
            ${fmt(lineTotal)}
          </td>
        </tr>`;
    });

    container.innerHTML = `
      <style>
        #bems-cart-page { max-width:1100px; margin:0 auto; }
        #bems-cart-page table { width:100%; border-collapse:collapse; }
        #bems-cart-page thead th { font-size:11px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:#888; padding:0 0 16px; border-bottom:1px solid #eee; }
        #bems-cart-page thead th:first-child { text-align:left; }
        #bems-cart-page thead th:nth-child(2) { text-align:center; }
        #bems-cart-page thead th:last-child { text-align:right; }
        #bems-cart-page .bems-footer { display:flex; gap:40px; flex-wrap:wrap; margin-top:40px; padding-top:30px; border-top:1px solid #eee; }
        #bems-cart-page .bems-note { flex:1; min-width:220px; }
        #bems-cart-page .bems-shipping { flex:1; min-width:220px; }
        #bems-cart-page .bems-summary { flex:1; min-width:220px; text-align:right; }
        #bems-cart-page textarea { width:100%; border:1px solid #ddd; border-radius:4px; padding:10px 12px; font-size:13px; resize:vertical; min-height:90px; font-family:inherit; }
        #bems-cart-page select, #bems-cart-page input[type=text] { width:100%; border:1px solid #ddd; border-radius:4px; padding:10px 12px; font-size:13px; font-family:inherit; margin-bottom:10px; box-sizing:border-box; }
        @media(max-width:700px) { #bems-cart-page .bems-footer { flex-direction:column; } #bems-cart-page .bems-summary { text-align:left; } }
      </style>

      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody id="bems-cart-tbody">
          ${itemRows}
        </tbody>
      </table>

      <div class="bems-footer">
        <div class="bems-note">
          <label style="font-size:13px; color:#555; display:block; margin-bottom:8px;">Order special instructions</label>
          <textarea id="bems-cart-note" placeholder="Order special instructions"></textarea>
        </div>

        <div class="bems-shipping">
          <div style="font-size:14px; font-weight:600; margin-bottom:12px; display:flex; align-items:center; gap:6px; color:#b8860b;">
            Estimate shipping rates
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <select id="bems-shipping-country">
            <option value="">---</option>
            <option>United States</option><option>United Kingdom</option><option>Canada</option>
            <option>Australia</option><option>Nigeria</option><option>Ghana</option>
            <option>Kenya</option><option>South Africa</option><option>Germany</option>
            <option>France</option><option>India</option><option>Bangladesh</option>
            <option>Other</option>
          </select>
          <input type="text" id="bems-shipping-zip" placeholder="Postal/ZIP code">
          <button onclick="bemsCalcShipping()" style="width:100%; padding:12px; background:#111; color:#fff; border:none; border-radius:4px; font-size:14px; font-weight:600; cursor:pointer; letter-spacing:.5px;">Calculate</button>
          <div id="bems-shipping-result" style="margin-top:10px; font-size:13px; color:#555;"></div>
        </div>

        <div class="bems-summary">
          <div style="font-size:14px; font-weight:600; margin-bottom:6px;">
            Subtotal &nbsp;<span id="bems-cart-subtotal" style="color:#b8860b; font-size:18px;">${fmt(subtotal)}</span>
          </div>
          <p style="font-size:12px; color:#888; margin:0 0 20px;">Taxes and shipping calculated at checkout</p>
          <button onclick="bemsCheckout()" style="width:100%; max-width:280px; padding:14px; background:#111; color:#fff; border:none; border-radius:4px; font-size:15px; font-weight:700; cursor:pointer; letter-spacing:.5px; transition:background .2s;" onmouseover="this.style.background='#333'" onmouseout="this.style.background='#111'">Check Out</button>
        </div>
      </div>`;
  };

  // ── Global page-level actions ──────────────────────────────────────────────
  window.bemsCartPageUpdate = async (productId, qty) => {
    if (qty <= 0) return window.bemsCartPageRemove(productId);
    const result = await BemsBridge.updateCartItem(productId, qty);
    if (result) render(result);
  };

  window.bemsCartPageRemove = async (productId) => {
    const result = await BemsBridge.removeCartItem(productId);
    if (result) render(result);
  };

  window.bemsCalcShipping = () => {
    const country = document.getElementById('bems-shipping-country').value;
    const zip = document.getElementById('bems-shipping-zip').value.trim();
    const el = document.getElementById('bems-shipping-result');
    if (!country || !zip) { el.textContent = 'Please select a country and enter a postal code.'; return; }
    el.textContent = 'Shipping rates are calculated at checkout based on your location.';
  };

  window.bemsCheckout = () => {
    window.location.href = rootPrefix + 'account/register.html';
  };

  // ── Initial load ───────────────────────────────────────────────────────────
  container.innerHTML = '<p style="padding:40px 0; color:#888; text-align:center;">Loading your cart…</p>';
  try {
    const cart = await BemsBridge.getCart();
    render(cart);
  } catch (e) {
    container.innerHTML = '<p style="padding:40px 0; color:#e53935; text-align:center;">Could not load cart. Please refresh.</p>';
  }
});
