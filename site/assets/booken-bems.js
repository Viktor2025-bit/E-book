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

  const pulseCartCount = () => {
    if (reduceMotion) return;
    document.querySelectorAll('[data-cart-count]').forEach((node) => {
      node.classList.remove('is-pulsing');
      void node.offsetWidth;
      node.classList.add('is-pulsing');
      
      // Add glow effect
      const parent = node.parentElement;
      if (parent && !parent.querySelector('.bems-cart-glow')) {
        const glow = document.createElement('span');
        glow.className = 'bems-cart-glow';
        glow.style.position = 'absolute';
        glow.style.inset = '-8px';
        glow.style.borderRadius = '50%';
        glow.style.pointerEvents = 'none';
        glow.style.animation = 'bemsGlow 600ms ease-out forwards';
        parent.style.position = 'relative';
        parent.appendChild(glow);
        window.setTimeout(() => glow.remove(), 600);
      }
      
      window.setTimeout(() => node.classList.remove('is-pulsing'), 700);
    });
  };

  const spawnCardRipple = (card, event) => {
    if (reduceMotion || !card) return;
    const oldRipple = card.querySelector('.bems-card-ripple');
    if (oldRipple) oldRipple.remove();

    const ripple = document.createElement('span');
    ripple.className = 'bems-card-ripple';
    const rect = card.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.25;
    const x = event && event.clientX ? event.clientX - rect.left : rect.width / 2;
    const y = event && event.clientY ? event.clientY - rect.top : rect.height / 2;

    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x - size / 2}px`;
    ripple.style.top = `${y - size / 2}px`;
    card.appendChild(ripple);
    window.setTimeout(() => ripple.remove(), 760);
  };

  const createMultiRippleEffect = (card, x, y) => {
    if (reduceMotion || !card) return;
    const rect = card.getBoundingClientRect();
    
    // Create multiple ripple rings
    for (let i = 0; i < 3; i++) {
      const ring = document.createElement('div');
      ring.className = 'bems-ripple-ring';
      const size = 40 + i * 20;
      ring.style.width = `${size}px`;
      ring.style.height = `${size}px`;
      ring.style.left = `${x - size / 2}px`;
      ring.style.top = `${y - size / 2}px`;
      ring.style.animation = `bemsRippleExpand${i === 0 ? '' : i + 1} 600ms ease-out forwards`;
      ring.style.animationDelay = `${i * 80}ms`;
      card.appendChild(ring);
      window.setTimeout(() => ring.remove(), 600 + i * 80);
    }
  };

  const createSparkleEffect = (card, event) => {
    if (reduceMotion || !card) return;
    const rect = card.getBoundingClientRect();
    const x = event && event.clientX ? event.clientX - rect.left : rect.width / 2;
    const y = event && event.clientY ? event.clientY - rect.top : rect.height / 2;
    
    // Create 12 sparkles radiating outward
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const distance = 80 + Math.random() * 60;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      
      const sparkle = document.createElement('div');
      sparkle.className = 'bems-sparkle';
      sparkle.style.left = `${x}px`;
      sparkle.style.top = `${y}px`;
      sparkle.style.setProperty('--tx', `${tx}px`);
      sparkle.style.setProperty('--ty', `${ty}px`);
      sparkle.style.animation = `bemsSparkle 600ms ease-out forwards`;
      sparkle.style.animationDelay = `${i * 30}ms`;
      card.appendChild(sparkle);
      window.setTimeout(() => sparkle.remove(), 600 + i * 30);
    }
  };

  const spawnClickSpinner = (card) => {
    if (reduceMotion || !card) return;
    const old = card.querySelector('.bems-click-spinner');
    if (old) old.remove();

    const spinner = document.createElement('div');
    spinner.className = 'bems-click-spinner';
    spinner.innerHTML = `
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.18)" stroke-width="3.5"/>
        <circle class="bems-spinner-arc" cx="24" cy="24" r="20" stroke="#88e04b" stroke-width="3.5"
          stroke-linecap="round" stroke-dasharray="126" stroke-dashoffset="126"/>
      </svg>
    `;
    card.appendChild(spinner);
    window.setTimeout(() => spinner.remove(), 600);
  };

  const animateProductCard = (trigger, event) => {
    const card = trigger && trigger.closest ? trigger.closest('.bems-product-card') : null;
    if (!card) return;

    spawnCardRipple(card, event);
    spawnClickSpinner(card);

    card.classList.remove('is-clicked');
    void card.offsetWidth;
    card.classList.add('is-clicked');
    window.setTimeout(() => card.classList.remove('is-clicked'), 620);
  };

  const bindProductCardAnimations = (root) => {
    root.querySelectorAll('.bems-product-card a[href*="/products/"]').forEach((link) => {
      if (link.dataset.cardAnimationBound) return;
      link.dataset.cardAnimationBound = 'true';
      link.addEventListener('click', (event) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        animateProductCard(link, event);
        
        // Navigate after animation completes
        window.setTimeout(() => {
          window.location.href = link.href;
        }, reduceMotion ? 0 : 260);
      });
    });

    root.querySelectorAll('.bems-product-card button').forEach((button) => {
      if (button.dataset.cardButtonAnimationBound) return;
      button.dataset.cardButtonAnimationBound = 'true';
      button.addEventListener('pointerdown', (event) => animateProductCard(button, event));
    });
  };

  const userAvatar = (user) => {
    const label = escapeHtml(user.displayName || user.email || 'Account');
    const initials = escapeHtml(user.initials || 'BB');
    if (user.avatarUrl) {
      return `
        <span class="bems-user-avatar bems-user-avatar--image" aria-hidden="true">
          <img src="${escapeHtml(user.avatarUrl)}" alt="" referrerpolicy="no-referrer" onerror="this.parentElement.classList.remove('bems-user-avatar--image'); this.remove();">
          <span>${initials}</span>
        </span>
        <span class="sr-only">${label}</span>
      `;
    }
    return `<span class="bems-user-avatar" aria-hidden="true"><span>${initials}</span></span><span class="sr-only">${label}</span>`;
  };

  const updateAccountLink = async () => {
    try {
      const result = await endpoints.user();
      const user = result && (result.user || result);
      if (!user || !user.id) return;
      document.querySelectorAll('[data-account-link]').forEach((link) => {
        link.href = '/account/index.html';
        link.title = user.displayName || user.email || 'Account';
        link.setAttribute('aria-label', link.title);
        link.classList.add('bems-profile-link');
        link.innerHTML = userAvatar(user);
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
      if (button.dataset.addBound) return;
      button.dataset.addBound = 'true';
      button.addEventListener('click', async (event) => {
        animateProductCard(button, event);
        const oldText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = icons.sync;
        try {
          await endpoints.add(button.dataset.add, 1);
          await updateCartCount();
          pulseCartCount();
          
          // Add success animation
          button.innerHTML = icons.check;
          button.style.animation = 'bemsGlow 400ms ease-out forwards';
          
          setTimeout(() => {
            button.innerHTML = oldText;
            button.disabled = false;
            button.style.animation = '';
          }, 900);
        } catch (error) {
          alert(error.message || 'Could not add this ebook to cart.');
          button.innerHTML = oldText;
          button.disabled = false;
        }
      });
    });

    root.querySelectorAll('[data-love]').forEach((button) => {
      if (button.dataset.loveBound) return;
      button.dataset.loveBound = 'true';
      button.addEventListener('click', (event) => {
        animateProductCard(button, event);
        const saved = getWishlist();
        const handle = button.dataset.love;
        const next = saved.includes(handle)
          ? saved.filter((item) => item !== handle)
          : saved.concat(handle);
        setWishlist(next);
        
        // Add heart glow effect
        button.style.animation = 'bemsGlow 400ms ease-out forwards';
        setTimeout(() => {
          button.style.animation = '';
        }, 400);
      });
    });
  };

  const renderProducts = async () => {
    const track = document.querySelector('[data-product-track]');
    if (!track) return;

    try {
      products = await endpoints.products();
      track.innerHTML = products.map(cardTemplate).join('');
      bindProductCardAnimations(track);
      bindProductActions(track);
      updateSavedButtons();
      initEntranceAnimations(track);
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

    const renderSuggestions = () => {
      const query = new FormData(form).get('q').toString().trim();
      if (!query) {
        results.innerHTML = '';
        return;
      }
      const normalizedQuery = query.toLowerCase();
      const matches = products.filter((product) => (
        [
          product.title,
          product.author,
          product.category,
          product.format,
          product.description,
        ].filter(Boolean).join(' ').toLowerCase().includes(normalizedQuery)
      )).slice(0, 8);
      results.innerHTML = matches.length
        ? `
          <p>${matches.length} quick match${matches.length === 1 ? '' : 'es'}</p>
          ${matches.map((product) => `<a href="/products/${escapeHtml(product.handle)}.html">${escapeHtml(product.title)}<br><small>${escapeHtml(product.category || 'Ebook')} - ${money(product.price)}</small></a>`).join('')}
          <a href="/collections/all.html?q=${encodeURIComponent(query)}">View all catalog results</a>
        `
        : `<p>No quick matches found. <a href="/collections/all.html?q=${encodeURIComponent(query)}">Search the full catalog</a></p>`;
    };

    form.addEventListener('input', renderSuggestions);

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const query = new FormData(form).get('q').toString().trim();
      if (!query) {
        results.innerHTML = '';
        return;
      }
      window.location.href = `/collections/all.html?q=${encodeURIComponent(query)}`;
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

  const initReaderForm = () => {
    const form = document.querySelector('[data-reader-form]');
    if (!form) return;
    const message = form.querySelector('[data-reader-message]');
    const button = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = new FormData(form).get('email').toString().trim();
      if (!email) return;

      // Loading state
      if (button) {
        button.classList.add('is-loading');
        button.classList.remove('is-success');
        button.innerHTML = 'Join list';
      }
      if (message) { message.textContent = ''; message.style.color = ''; }

      try {
        const res = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, source: 'homepage' }),
        });
        const data = await res.json();

        if (res.ok) {
          form.reset();
          if (button) {
            button.classList.remove('is-loading');
            button.classList.add('is-success');
            button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
          }
          if (message) {
            message.textContent = data.alreadySubscribed
              ? "You're already on the list! We'll keep you updated."
              : (data.message || 'You\'re on the list! Check your inbox for a welcome email.');
            message.style.color = data.alreadySubscribed ? '#88e04b' : '#2f7d52';
          }
          
          // Revert button after 3 seconds
          if (button) {
            window.setTimeout(() => {
              button.classList.remove('is-success');
              button.innerHTML = 'Join list';
            }, 3000);
          }
        } else {
          if (button) { button.classList.remove('is-loading'); button.innerHTML = 'Join list'; }
          if (message) {
            message.textContent = data.error || 'Something went wrong. Please try again.';
            message.style.color = '#c0392b';
          }
        }
      } catch (_) {
        if (button) { button.classList.remove('is-loading'); button.innerHTML = 'Join list'; }
        if (message) {
          message.textContent = 'Could not connect. Please check your connection and try again.';
          message.style.color = '#c0392b';
        }
      }
    });
  };

  const initEntranceAnimations = (scope = document) => {
    if (reduceMotion) return;
    const candidates = scope.querySelectorAll([
      '.bems-original-hero .slider-content > *',
      '.bems-quick-trust__grid > div',
      '.section-title',
      '.bems-category-card',
      '.bems-product-card',
      '.bems-reading-path',
      '.bems-banner',
      '.bems-discount-content > *',
      '.bems-discount-image',
      '.bems-testimonial-area .single-testimonial',
      '.bems-assurance',
      '.bems-reader-list'
    ].join(','));

    const elements = Array.from(candidates).filter((element) => !element.dataset.revealBound);
    if (!elements.length) return;

    elements.forEach((element, index) => {
      element.dataset.revealBound = 'true';
      element.classList.add('bems-reveal');
      element.style.setProperty('--reveal-delay', `${Math.min(index * 28, 160)}ms`);
    });

    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.06, rootMargin: '0px 0px 0px 0px' });

    elements.forEach((element) => observer.observe(element));
  };

  document.addEventListener('DOMContentLoaded', async () => {
    initHeroSlider();
    initSearch();
    initWishlistNav();
    initReaderForm();
    initEntranceAnimations();
    updateWishlistCount();
    updateCartCount();
    updateAccountLink();
    await renderProducts();
  });
}());
