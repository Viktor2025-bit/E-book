(function () {
  const api = {
    async request(url, options = {}) {
      const response = await fetch(url, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options,
      });
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;
      if (!response.ok) {
        throw new Error((data && (data.message || data.error)) || 'Request failed');
      }
      return data;
    },
    products() { return this.request('/api/products'); },
    product(handle) { return this.request(`/api/products/${encodeURIComponent(handle)}`); },
    search(query) { return this.request(`/api/products/search?q=${encodeURIComponent(query)}`); },
    cart() { return this.request('/api/cart'); },
    add(productId, quantity = 1) {
      return this.request('/api/cart', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity }),
      });
    },
    update(productId, quantity) {
      return this.request(`/api/cart/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      });
    },
    remove(productId) { return this.request(`/api/cart/${productId}`, { method: 'DELETE' }); },
    clearCart() { return this.request('/api/cart', { method: 'DELETE' }); },
    currentUser() { return this.request('/api/auth/current_user'); },
    login(email, password) {
      return this.request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    },
    register(username, email, password) {
      return this.request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      });
    },
    paystackConfig() { return this.request('/api/orders/paystack-config'); },
    checkout(contactEmail, reference) {
      return this.request('/api/orders', {
        method: 'POST',
        body: JSON.stringify({ contactEmail, reference, paymentMethod: 'Paystack' }),
      });
    },
  };

  let currentUser = null;
  let allProducts = [];

  const money = (value) => 'NGN ' + Number(value || 0).toFixed(2);
  const compareMoney = (value) => 'NGN ' + (Number(value || 0) * 1.18).toFixed(2);
  const saleBadge = (value) => {
    const price = Number(value || 0);
    const compareAt = price * 1.18;
    return `Save ${Math.round(((compareAt - price) / compareAt) * 100)}%`;
  };
  const fallbackCover = '/cdn/shop/files/10_307a27ee-36dd-48cf-b0df-11b80f223bab1ef4.png';
  const imgFallback = `onerror="this.onerror=null;this.src='${fallbackCover}';this.classList.add('cover-fallback');"`;
  const viewIcon = '<svg class="card-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M1.5 12s4-7 10.5-7 10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12Z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
  const heartIcon = '<svg class="card-icon-svg card-heart-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"></path></svg>';
  const wishlistKey = 'bems-books-wishlist';
  const byId = (id) => document.getElementById(id);
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const show = (el, message, type = 'notice') => {
    if (!el) return;
    el.className = type;
    el.textContent = message;
    el.classList.remove('hidden');
  };

  const productCard = (product) => `
    <article class="product-card">
      <div class="product-card__thumbnail">
        <span class="sale-badge">${saleBadge(product.price)}</span>
        <a class="cover-wrap" href="/products/${product.handle}.html">
          <img src="${product.imageUrl || fallbackCover}" alt="${product.title}" ${imgFallback}>
        </a>
        <div class="product-card__actions" aria-label="${product.title} actions">
          <button class="card-icon-button" type="button" data-add="${product.id}" aria-label="Add ${product.title} to cart">+</button>
          <a class="card-icon-button" href="/products/${product.handle}.html" aria-label="View ${product.title}">
            ${viewIcon}
          </a>
          <button class="card-icon-button love-button" type="button" data-love="${product.handle}" aria-label="Save ${product.title} to wishlist">
            ${heartIcon}
          </button>
        </div>
      </div>
      <div class="card-body">
        <h3><a href="/products/${product.handle}.html">${product.title}</a></h3>
        <div class="price-row">
          <span class="price">${money(product.price)}</span>
          <span class="compare-price">${compareMoney(product.price)}</span>
        </div>
      </div>
    </article>
  `;

  const getWishlist = () => {
    try {
      return JSON.parse(localStorage.getItem(wishlistKey) || '[]');
    } catch (_) {
      return [];
    }
  };

  const saveWishlist = (items) => {
    localStorage.setItem(wishlistKey, JSON.stringify([...new Set(items)]));
  };

  const initHeroSlider = () => {
    const hero = document.querySelector('[data-hero-slider]');
    if (!hero) return;

    const slides = [
      {
        kicker: 'BEMS digital bookstore',
        title: 'Books for quiet study, bold ideas, and better work.',
        copy: 'A curated ebook shelf for readers, students, creators, and lifelong learners. Buy once, access digitally through your BEMS Books account.',
        image: '/cdn/shop/files/hero-1-2ea01.jpg',
      },
      {
        kicker: 'Fresh digital reads',
        title: 'Curated ebooks for students, creators, and ambitious readers.',
        copy: 'Move from study resources to business guides, fiction, technology, and African literature without leaving the BEMS Books store.',
        image: '/cdn/shop/files/hero-2-1249f9.png',
      },
      {
        kicker: 'Simple ebook access',
        title: 'No shipping queues. Just secure checkout and digital access.',
        copy: 'Shop ebooks, pay online, and keep your purchases tied to your BEMS Books account and email.',
        image: '/cdn/shop/files/750x440367d.png',
      },
    ];

    const kicker = hero.querySelector('[data-hero-kicker]');
    const title = hero.querySelector('[data-hero-title]');
    const copy = hero.querySelector('[data-hero-copy]');
    const dots = hero.querySelector('[data-hero-dots]');
    let active = 0;

    const renderDots = () => {
      if (!dots) return;
      dots.innerHTML = slides.map((_, index) => (
        `<button class="hero-dot${index === active ? ' is-active' : ''}" type="button" data-hero-dot="${index}" aria-label="Show slide ${index + 1}"></button>`
      )).join('');
      dots.querySelectorAll('[data-hero-dot]').forEach((button) => {
        button.addEventListener('click', () => setSlide(Number(button.dataset.heroDot)));
      });
    };

    const applySlide = () => {
      const slide = slides[active];
      hero.style.setProperty('--hero-image', `url("${slide.image}")`);
      if (kicker) kicker.textContent = slide.kicker;
      if (title) title.textContent = slide.title;
      if (copy) copy.textContent = slide.copy;
      renderDots();
    };

    const setSlide = (next) => {
      active = (next + slides.length) % slides.length;
      hero.classList.add('is-changing');
      setTimeout(() => {
        applySlide();
        hero.classList.remove('is-changing');
      }, 280);
    };

    applySlide();
    if (reduceMotion) return;
    setInterval(() => setSlide(active + 1), 6800);
  };

  const initRevealAnimations = () => {
    const items = document.querySelectorAll('.reveal-on-scroll');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.16 });

    items.forEach((item) => observer.observe(item));
  };

  const initProductSlider = (track) => {
    if (!track) return;
    const wrapper = track.closest('[data-product-slider]') || track;
    const prev = document.querySelector('[data-product-prev]');
    const next = document.querySelector('[data-product-next]');
    let paused = false;

    const getStep = () => {
      const card = track.querySelector('.product-card');
      if (!card) return track.clientWidth;
      const styles = getComputedStyle(track);
      const parsedGap = Number.parseFloat(styles.columnGap || styles.gap || '0');
      const gap = Number.isNaN(parsedGap) ? 0 : parsedGap;
      return card.getBoundingClientRect().width + gap;
    };

    const maxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);
    const canSlide = () => maxScroll() > 4;

    const move = (direction = 1) => {
      if (!canSlide()) return;
      const end = maxScroll();
      if (direction > 0 && track.scrollLeft >= end - 4) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }
      if (direction < 0 && track.scrollLeft <= 4) {
        track.scrollTo({ left: end, behavior: 'smooth' });
        return;
      }
      track.scrollBy({ left: getStep() * direction, behavior: 'smooth' });
    };

    [wrapper, track].forEach((el) => {
      el.addEventListener('mouseenter', () => { paused = true; });
      el.addEventListener('mouseleave', () => { paused = false; });
      el.addEventListener('focusin', () => { paused = true; });
      el.addEventListener('focusout', () => { paused = false; });
    });

    if (prev) prev.addEventListener('click', () => move(-1));
    if (next) next.addEventListener('click', () => move(1));

    if (!reduceMotion) {
      setInterval(() => {
        if (!paused) move(1);
      }, 6400);
    }
  };

  const bindLoveButtons = () => {
    const saved = getWishlist();
    document.querySelectorAll('[data-love]').forEach((button) => {
      const handle = button.dataset.love;
      button.classList.toggle('is-loved', saved.includes(handle));
      button.setAttribute('aria-pressed', saved.includes(handle) ? 'true' : 'false');

      button.addEventListener('click', () => {
        const latest = getWishlist();
        const index = latest.indexOf(handle);
        if (index >= 0) latest.splice(index, 1);
        else latest.push(handle);
        saveWishlist(latest);
        const loved = latest.includes(handle);
        button.classList.toggle('is-loved', loved);
        button.setAttribute('aria-pressed', loved ? 'true' : 'false');
      });
    });
  };

  const bindAddButtons = () => {
    document.querySelectorAll('[data-add]').forEach((button) => {
      button.addEventListener('click', async () => {
        const compact = button.classList.contains('card-icon-button');
        const label = compact ? button.innerHTML : button.textContent;
        button.disabled = true;
        button.textContent = compact ? '...' : 'Adding';
        try {
          const cart = await api.add(button.dataset.add, 1);
          updateCartCount(cart);
          button.textContent = compact ? 'OK' : 'Added';
          setTimeout(() => {
            if (compact) button.innerHTML = label;
            else button.textContent = label;
            button.disabled = false;
          }, 900);
        } catch (error) {
          alert(error.message);
          if (compact) button.innerHTML = label;
          else button.textContent = label;
          button.disabled = false;
        }
      });
    });
  };

  const updateCartCount = (cart) => {
    const count = cart && cart.items ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
    document.querySelectorAll('[data-cart-count]').forEach((el) => { el.textContent = count; });
  };

  const hydrateHeader = async () => {
    try {
      currentUser = await api.currentUser();
    } catch (_) {
      currentUser = null;
    }

    document.querySelectorAll('[data-account-link]').forEach((link) => {
      if (currentUser) {
        link.href = '/api/auth/logout';
        link.textContent = currentUser.displayName ? `Logout (${currentUser.displayName})` : 'Logout';
      }
    });

    try {
      updateCartCount(await api.cart());
    } catch (_) {
      updateCartCount(null);
    }
  };

  const initHome = async () => {
    const featured = byId('featured-products');
    if (!featured) return;
    allProducts = await api.products();
    featured.innerHTML = allProducts.slice(0, 8).map(productCard).join('');
    bindAddButtons();
    bindLoveButtons();
    initProductSlider(featured);
  };

  const initCollection = async () => {
    const grid = byId('product-grid');
    if (!grid) return;

    const search = byId('product-search');
    const category = byId('category-filter');
    const sort = byId('sort-filter');
    const title = byId('collection-title');

    allProducts = await api.products();
    const categories = [...new Set(allProducts.map((p) => p.category).filter(Boolean))].sort();
    category.innerHTML = '<option value="">All categories</option>' + categories.map((c) => `<option>${c}</option>`).join('');

    const render = () => {
      const q = search.value.trim().toLowerCase();
      let products = allProducts.filter((p) => {
        const haystack = `${p.title} ${p.author || ''} ${p.category || ''} ${p.description || ''}`.toLowerCase();
        return (!q || haystack.includes(q)) && (!category.value || p.category === category.value);
      });

      if (sort.value === 'price-asc') products = products.sort((a, b) => Number(a.price) - Number(b.price));
      if (sort.value === 'price-desc') products = products.sort((a, b) => Number(b.price) - Number(a.price));
      if (sort.value === 'title') products = products.sort((a, b) => a.title.localeCompare(b.title));

      title.textContent = q ? `Search results for "${search.value.trim()}"` : 'Browse ebooks';
      grid.innerHTML = products.length
        ? products.map(productCard).join('')
        : '<p class="notice">No ebooks matched your search. Try another title, author, or category.</p>';
      bindAddButtons();
      bindLoveButtons();
    };

    [search, category, sort].forEach((el) => el.addEventListener('input', render));
    const params = new URLSearchParams(window.location.search);
    if (params.get('q')) search.value = params.get('q');
    render();
  };

  const initProduct = async () => {
    const detail = byId('product-detail');
    if (!detail) return;

    const handle = window.location.pathname.split('/').pop().replace('.html', '');
    const product = await api.product(handle);
    document.title = `${product.title} - BEMS Books`;
    detail.innerHTML = `
      <div class="detail-cover"><img src="${product.imageUrl || fallbackCover}" alt="${product.title}" ${imgFallback}></div>
      <div class="detail-panel">
        <p class="eyebrow">${product.category || 'Ebook'}</p>
        <h1>${product.title}</h1>
        <p class="lead">By ${product.author || 'BEMS Books'}</p>
        <p>${product.description || 'A digital ebook from BEMS Books.'}</p>
        <div class="detail-facts">
          <div class="fact"><strong>${money(product.price)}</strong><span>Digital price</span></div>
          <div class="fact"><strong>${product.format || 'PDF'}</strong><span>Format</span></div>
          <div class="fact"><strong>${product.pages || '-'}</strong><span>Pages</span></div>
        </div>
        <p class="notice">${product.accessNote || 'Digital access is delivered through your BEMS Books account after payment.'}</p>
        <div class="hero-actions">
          <button class="button gold" data-add="${product.id}">Add to cart</button>
          <a class="button secondary" href="/collections/all.html">Keep browsing</a>
        </div>
      </div>
    `;
    bindAddButtons();
  };

  const renderCart = async () => {
    const cartRoot = byId('cart-root');
    if (!cartRoot) return;

    const cart = await api.cart();
    updateCartCount(cart);
    const items = cart && cart.items ? cart.items : [];

    if (!items.length) {
      cartRoot.innerHTML = `
        <div class="summary-card">
          <h2>Your cart is empty</h2>
          <p class="lead">Add ebooks to your cart and they will appear here.</p>
          <a class="button gold" href="/collections/all.html">Browse ebooks</a>
        </div>
      `;
      return;
    }

    const subtotal = items.reduce((sum, item) => sum + Number(item.product.price || 0) * item.quantity, 0);
    cartRoot.innerHTML = `
      <div class="cart-layout">
        <div>
          ${items.map((item) => `
            <div class="cart-item">
              <img src="${item.product.imageUrl || fallbackCover}" alt="${item.product.title}" ${imgFallback}>
              <div>
                <h3><a href="/products/${item.product.handle}.html">${item.product.title}</a></h3>
                <p class="meta">By ${item.product.author || 'BEMS Books'} - ${item.product.format || 'Digital ebook'}</p>
                <div class="qty">
                  <button data-cart-update="${item.productId}" data-qty="${item.quantity - 1}">-</button>
                  <span>${item.quantity}</span>
                  <button data-cart-update="${item.productId}" data-qty="${item.quantity + 1}">+</button>
                </div>
                <button class="button secondary" data-cart-remove="${item.productId}" style="margin-top:10px;">Remove</button>
              </div>
              <strong class="item-total">${money(Number(item.product.price || 0) * item.quantity)}</strong>
            </div>
          `).join('')}
        </div>
        <aside class="summary-card">
          <h2>Order summary</h2>
          <div class="summary-line"><span>Subtotal</span><strong>${money(subtotal)}</strong></div>
          <div class="summary-line"><span>Delivery</span><strong>Digital</strong></div>
          <p class="meta">Your ebooks are made available through your account after confirmed payment.</p>
          <label for="delivery-email" class="meta">Access email</label>
          <input id="delivery-email" class="input" type="email" value="${currentUser ? currentUser.email : ''}" placeholder="you@example.com">
          <button id="checkout-button" class="button gold" style="width:100%; margin-top:14px;">Pay with Paystack</button>
          <button id="clear-cart-button" class="button secondary" style="width:100%; margin-top:10px;">Clear cart</button>
          <div id="checkout-message" class="hidden" style="margin-top:14px;"></div>
        </aside>
      </div>
    `;

    document.querySelectorAll('[data-cart-update]').forEach((button) => {
      button.addEventListener('click', async () => {
        const qty = Number(button.dataset.qty);
        if (qty < 1) await api.remove(button.dataset.cartUpdate);
        else await api.update(button.dataset.cartUpdate, qty);
        await renderCart();
      });
    });
    document.querySelectorAll('[data-cart-remove]').forEach((button) => {
      button.addEventListener('click', async () => {
        await api.remove(button.dataset.cartRemove);
        await renderCart();
      });
    });
    byId('clear-cart-button').addEventListener('click', async () => {
      await api.clearCart();
      await renderCart();
    });
    byId('checkout-button').addEventListener('click', () => checkout(subtotal));
  };

  const loadPaystack = () => new Promise((resolve, reject) => {
    if (window.PaystackPop) return resolve();
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Could not load Paystack. Check your connection and try again.'));
    document.head.appendChild(script);
  });

  const checkout = async (subtotal) => {
    const message = byId('checkout-message');
    if (!currentUser) {
      window.location.href = '/account/login.html?next=/cart.html';
      return;
    }

    const contactEmail = byId('delivery-email').value.trim() || currentUser.email;
    if (!contactEmail) {
      show(message, 'Enter the email address that should receive ebook access.', 'error');
      return;
    }

    try {
      const config = await api.paystackConfig();
      if (!config || !config.publicKey) {
        show(message, 'Paystack is not configured yet. Add PAYSTACK_PUBLIC_KEY and PAYSTACK_SECRET_KEY to enable live checkout.', 'error');
        return;
      }
      await loadPaystack();
      const handler = window.PaystackPop.setup({
        key: config.publicKey,
        email: contactEmail,
        amount: Math.round(subtotal * 100),
        currency: 'NGN',
        callback: async (response) => {
          const order = await api.checkout(contactEmail, response.reference);
          await api.clearCart().catch(() => {});
          byId('cart-root').innerHTML = `
            <div class="summary-card" style="text-align:center;">
              <p class="eyebrow">Payment confirmed</p>
              <h1>Order placed successfully</h1>
              <p class="lead">Thank you for buying from BEMS Books. Order #${order.id.slice(0, 8)} has been recorded and your ebook access will be sent to ${contactEmail}.</p>
              <a class="button gold" href="/collections/all.html">Browse more ebooks</a>
            </div>
          `;
          updateCartCount(null);
        },
        onClose: () => show(message, 'Payment window closed before completion.', 'error'),
      });
      handler.openIframe();
    } catch (error) {
      show(message, error.message, 'error');
    }
  };

  const initAuth = () => {
    const loginForm = byId('login-form');
    const registerForm = byId('register-form');
    const message = byId('auth-message');
    const params = new URLSearchParams(window.location.search);

    if (params.get('google') === 'not-configured') {
      show(message, 'Google login is available, but OAuth keys are not configured on this machine yet.', 'notice');
    }

    if (loginForm) {
      loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
          await api.login(loginForm.email.value, loginForm.password.value);
          window.location.href = params.get('next') || '/index.html';
        } catch (error) {
          show(message, error.message, 'error');
        }
      });
    }

    if (registerForm) {
      registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
          await api.register(registerForm.username.value, registerForm.email.value, registerForm.password.value);
          window.location.href = params.get('next') || '/index.html';
        } catch (error) {
          show(message, error.message, 'error');
        }
      });
    }
  };

  document.addEventListener('DOMContentLoaded', async () => {
    await hydrateHeader();
    const page = document.body.dataset.page;
    try {
      if (page === 'home') {
        initHeroSlider();
        initRevealAnimations();
        await initHome();
      }
      if (page === 'collection') await initCollection();
      if (page === 'product') await initProduct();
      if (page === 'cart') await renderCart();
      if (page === 'auth') initAuth();
    } catch (error) {
      const target = byId('page-message') || byId('product-grid') || byId('featured-products') || byId('cart-root');
      show(target, error.message, 'error');
    }
  });
})();
