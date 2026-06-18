(function () {
  const request = async (url, options = {}) => {
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
  };

  const endpoints = {
    products: () => request('/api/products'),
    cart: () => request('/api/cart'),
    add: (productId, quantity = 1) => request('/api/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    }),
    user: () => request('/api/auth/current_user'),
  };

  const fallbackCover = '/cdn/shop/files/10_307a27ee-36dd-48cf-b0df-11b80f223bab1ef4.png';
  const wishlistKey = 'bems-books-wishlist';
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const icons = {
    cart: '<svg class="bems-action-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6h15l-1.7 8.5a2 2 0 0 1-2 1.5H9.1a2 2 0 0 1-2-1.6L5.2 3H2"></path><circle cx="9" cy="20" r="1.6"></circle><circle cx="18" cy="20" r="1.6"></circle></svg>',
    eye: '<svg class="bems-action-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12Z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
    heart: '<svg class="bems-action-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.4 5.4 0 0 0-7.7 0L12 5.7l-1.1-1.1a5.4 5.4 0 0 0-7.7 7.7L12 21l8.8-8.7a5.4 5.4 0 0 0 0-7.7Z"></path></svg>',
    sync: '<svg class="bems-action-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 0 1-15.5 6.2"></path><path d="M3 12A9 9 0 0 1 18.5 5.8"></path><path d="M18.5 2v3.8H22"></path><path d="M5.5 22v-3.8H2"></path></svg>',
    check: '<svg class="bems-action-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>',
  };
  let products = [];

  const money = (value) => 'NGN ' + Number(value || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const compareMoney = (value) => money(Number(value || 0) * 1.18);

  const saleBadge = (value) => {
    const price = Number(value || 0);
    const compareAt = price * 1.18;
    return 'Save ' + Math.round(((compareAt - price) / compareAt) * 100) + '%';
  };

  const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[char]));

  const getWishlist = () => {
    try {
      return JSON.parse(localStorage.getItem(wishlistKey) || '[]');
    } catch (_) {
      return [];
    }
  };

  const setWishlist = (items) => {
    localStorage.setItem(wishlistKey, JSON.stringify([...new Set(items)]));
    updateWishlistCount();
    updateSavedButtons();
  };

  const updateWishlistCount = () => {
    const count = getWishlist().length;
    document.querySelectorAll('[data-wishlist-count]').forEach((node) => {
      node.textContent = count;
    });
  };

  const updateSavedButtons = () => {
    const saved = new Set(getWishlist());
    document.querySelectorAll('[data-love]').forEach((button) => {
      button.classList.toggle('is-saved', saved.has(button.dataset.love));
    });
  };

  const updateCartCount = async () => {
    try {
      const cart = await endpoints.cart();
      const count = (cart.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      document.querySelectorAll('[data-cart-count]').forEach((node) => {
        node.textContent = count;
      });
    } catch (_) {
      document.querySelectorAll('[data-cart-count]').forEach((node) => {
        node.textContent = '0';
      });
    }
  };

  const updateAccountLink = async () => {
    try {
      const result = await endpoints.user();
      const user = result && (result.user || result);
      if (!user || !user.id) return;
      document.querySelectorAll('[data-account-link]').forEach((link) => {
        link.href = '/account/index.html';
        link.title = user.displayName || user.username || 'Account';
      });
    } catch (_) {
      document.querySelectorAll('[data-account-link]').forEach((link) => {
        link.href = '/account/login.html';
      });
    }
  };

  const cardTemplate = (product) => {
    const title = escapeHtml(product.title);
    const author = escapeHtml(product.author || product.vendor || 'BEMS Books');
    const category = escapeHtml(product.category || product.productType || 'Ebook');
    const image = escapeHtml(product.imageUrl || fallbackCover);
    const handle = escapeHtml(product.handle);

    return `
      <article class="bems-product-card theme-product-countdown-bottom product-wrapper-class">
        <div class="theme-product-inner">
          <div class="bems-product-image-wrap theme-product-image-wrap">
            <span class="bems-sale-badge">${saleBadge(product.price)}</span>
            <a class="bems-product-image theme-product-image" href="/products/${handle}.html">
              <img src="${image}" alt="${title}" loading="lazy" onerror="this.onerror=null;this.src='${fallbackCover}';">
            </a>
            <div class="bems-card-actions" aria-label="${title} actions">
              <button type="button" data-add="${product.id}" aria-label="Add ${title} to cart">${icons.cart}</button>
              <a href="/products/${handle}.html" aria-label="View ${title}">${icons.eye}</a>
              <button type="button" data-love="${handle}" aria-label="Save ${title}">${icons.heart}</button>
            </div>
          </div>
          <div class="bems-product-content theme-product-content">
            <h4><a href="/products/${handle}.html">${title}</a></h4>
            <div class="bems-product-meta">By ${author} - ${category}</div>
            <div class="bems-price-row">
              <span class="bems-price">${money(product.price)}</span>
              <span class="bems-compare-price">${compareMoney(product.price)}</span>
            </div>
          </div>
        </div>
      </article>
    `;
  };

  const bindProductActions = (root) => {
    root.querySelectorAll('[data-add]').forEach((button) => {
      button.addEventListener('click', async () => {
        const oldText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = icons.sync;
        try {
          await endpoints.add(button.dataset.add, 1);
          await updateCartCount();
          button.innerHTML = icons.check;
          setTimeout(() => {
            button.innerHTML = oldText;
            button.disabled = false;
          }, 900);
        } catch (error) {
          alert(error.message || 'Could not add this ebook to cart.');
          button.innerHTML = oldText;
          button.disabled = false;
        }
      });
    });

    root.querySelectorAll('[data-love]').forEach((button) => {
      button.addEventListener('click', () => {
        const saved = getWishlist();
        const handle = button.dataset.love;
        const next = saved.includes(handle)
          ? saved.filter((item) => item !== handle)
          : saved.concat(handle);
        setWishlist(next);
      });
    });
  };

  const renderProducts = async () => {
    const track = document.querySelector('[data-product-track]');
    if (!track) return;

    try {
      products = await endpoints.products();
      track.innerHTML = products.map(cardTemplate).join('');
      bindProductActions(track);
      updateSavedButtons();
      initProductCarousel(track);
    } catch (error) {
      track.innerHTML = '<p class="bems-empty">Featured ebooks could not load. Please refresh the page.</p>';
    }
  };

  const initHeroSlider = () => {
    const slider = document.querySelector('[data-hero-slider]');
    if (!slider) return;
    const slides = Array.from(slider.querySelectorAll('[data-slide]'));
    const dots = slider.querySelector('[data-hero-dots]');
    const prev = slider.querySelector('[data-hero-prev]');
    const next = slider.querySelector('[data-hero-next]');
    let active = 0;

    const setSlide = (index) => {
      active = (index + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('is-active', slideIndex === active);
      });
      if (!dots) return;
      dots.querySelectorAll('button').forEach((dot, dotIndex) => {
        dot.classList.toggle('is-active', dotIndex === active);
      });
    };

    if (dots) {
      dots.innerHTML = slides.map((_, index) => (
        '<button class="bems-hero-dot' + (index === 0 ? ' is-active' : '') + '" type="button" aria-label="Show slide ' + (index + 1) + '"></button>'
      )).join('');
      dots.querySelectorAll('button').forEach((dot, index) => {
        dot.addEventListener('click', () => setSlide(index));
      });
    }

    if (prev) prev.addEventListener('click', () => setSlide(active - 1));
    if (next) next.addEventListener('click', () => setSlide(active + 1));

    if (!reduceMotion && slides.length > 1) {
      setInterval(() => setSlide(active + 1), 6800);
    }
  };

  const initProductCarousel = (track) => {
    const prev = document.querySelector('[data-products-prev]');
    const next = document.querySelector('[data-products-next]');
    let paused = false;

    const cardStep = () => {
      const card = track.querySelector('.bems-product-card');
      if (!card) return track.clientWidth;
      const styles = getComputedStyle(track);
      const gap = Number.parseFloat(styles.columnGap || styles.gap || '0') || 0;
      return card.getBoundingClientRect().width + gap;
    };

    const maxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);

    const slide = (direction) => {
      if (maxScroll() <= 4) return;
      const nextLeft = track.scrollLeft + (cardStep() * direction);
      if (nextLeft > maxScroll() - 2) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }
      if (nextLeft < 0) {
        track.scrollTo({ left: maxScroll(), behavior: 'smooth' });
        return;
      }
      track.scrollBy({ left: cardStep() * direction, behavior: 'smooth' });
    };

    if (prev) prev.addEventListener('click', () => slide(-1));
    if (next) next.addEventListener('click', () => slide(1));

    track.addEventListener('mouseenter', () => { paused = true; });
    track.addEventListener('mouseleave', () => { paused = false; });
    track.addEventListener('focusin', () => { paused = true; });
    track.addEventListener('focusout', () => { paused = false; });

    if (!reduceMotion) {
      setInterval(() => {
        if (!paused) slide(1);
      }, 5200);
    }
  };

  const initSearch = () => {
    const panel = document.querySelector('[data-search-panel]');
    const open = document.querySelector('[data-search-toggle]');
    const close = document.querySelector('[data-search-close]');
    const form = document.querySelector('[data-search-form]');
    const results = document.querySelector('[data-search-results]');
    if (!panel || !open || !form || !results) return;

    open.addEventListener('click', () => {
      panel.hidden = false;
      const input = form.querySelector('input');
      if (input) input.focus();
    });

    if (close) {
      close.addEventListener('click', () => {
        panel.hidden = true;
        results.innerHTML = '';
        form.reset();
      });
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const query = new FormData(form).get('q').toString().trim().toLowerCase();
      if (!query) {
        results.innerHTML = '';
        return;
      }
      const matches = products.filter((product) => (
        [product.title, product.author, product.category].join(' ').toLowerCase().includes(query)
      )).slice(0, 8);
      results.innerHTML = matches.length
        ? matches.map((product) => `<a href="/products/${escapeHtml(product.handle)}.html">${escapeHtml(product.title)}<br><small>${money(product.price)}</small></a>`).join('')
        : '<p>No matching ebooks found.</p>';
    });
  };

  const initWishlistNav = () => {
    document.querySelectorAll('[data-wishlist-toggle]').forEach((button) => {
      button.addEventListener('click', () => {
        const count = getWishlist().length;
        alert(count ? 'You have ' + count + ' saved ebook' + (count === 1 ? '.' : 's.') : 'Tap the heart on any ebook card to save it here.');
      });
    });
  };

  document.addEventListener('DOMContentLoaded', async () => {
    initHeroSlider();
    initSearch();
    initWishlistNav();
    updateWishlistCount();
    updateCartCount();
    updateAccountLink();
    await renderProducts();
  });
}());
