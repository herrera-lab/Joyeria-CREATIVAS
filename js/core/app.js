import { getCurrentRoute, onRouteChange } from './router.js';
import { state, subscribe } from './state.js';
import { qs, qsa, escapeHtml, responsiveImageAttrs, showToast } from '../utils/dom.js';
import { debounce } from '../utils/helpers.js';

import { initI18n, t } from '../features/i18n.js';
import { initAccessibility } from '../features/accessibility.js';
import { initRevealOnScroll } from '../features/scroll.js';
import { initCartDrawer, cartPage } from '../pages/cart.js';
import { addToCart, getCartCount } from '../features/cart.js';
import { getProductById, getCategories } from '../features/catalog.js';
import { searchProducts } from '../features/search.js';
import { ROUTES } from '../config/routes.js';

import { renderHome } from '../pages/home.js';
import { renderCategory } from '../pages/category.js';
import { renderProductDetail } from '../pages/product-detail.js';
import { renderAbout } from '../pages/about.js';
import { renderContact } from '../pages/contact.js';
import { renderPolicies } from '../pages/policies.js';

function renderRoute(route) {
  const app = qs('#app');
  if (!app) return;

  switch (route.page) {
    case 'category':
      renderCategory(app, route.params);
      break;
    case 'product':
      renderProductDetail(app, route.params);
      break;
    case 'about':
      renderAbout(app);
      break;
    case 'contact':
      renderContact(app);
      break;
    case 'policies':
      renderPolicies(app);
      break;
    case 'cart':
      renderHome(app);
      cartPage();
      break;
    default:
      renderHome(app);
  }

  document.body.classList.toggle('has-hero', route.page === 'home' || route.page === 'cart');

  window.scrollTo(0, 0);
  initRevealOnScroll(app);
}

function wireAddToCartDelegation() {
  qs('#app')?.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-add-to-cart]');
    if (!btn) return;
    const product = getProductById(btn.dataset.addToCart);
    if (!product) return;
    addToCart(product);
    showToast(t('added_to_cart'));
  });
}

function renderCollectionsMenu() {
  const menu = qs('#collectionsMenu');
  if (!menu) return;

  menu.innerHTML = getCategories()
    .map((category) => {
      const label = state.language === 'en' ? category.label_en : category.label_es;
      return `<li role="none">
        <a role="menuitem" href="${ROUTES.category(category.slug)}">
          <svg class="cat-icon" aria-hidden="true"><use href="#i-cat-${category.slug}" /></svg>
          <span class="cat-label">${escapeHtml(label)}</span>
          <svg class="cat-chevron" aria-hidden="true"><use href="#i-chevron-right" /></svg>
        </a>
      </li>`;
    })
    .join('');
}

function wireNavDropdown() {
  const toggle = qs('#collectionsToggle');
  const menu = qs('#collectionsMenu');
  if (!toggle || !menu) return;

  function close() {
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', (event) => {
    if (!menu.contains(event.target) && !toggle.contains(event.target)) close();
  });

  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) close();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });
}

function wireHeaderScrollBehavior() {
  const header = qs('.nav');
  if (!header) return;

  let lastScrollY = window.scrollY;
  let ticking = false;

  function updateHeader() {
    const currentScrollY = window.scrollY;
    const delta = currentScrollY - lastScrollY;
    const shouldHide = currentScrollY > 140 && delta > 0;
    const shouldShow = currentScrollY <= 140 || delta < 0;

    header.classList.toggle('is-hidden', shouldHide);
    header.classList.toggle('is-scrolled', currentScrollY > 8);

    if (shouldShow) {
      header.classList.remove('is-hidden');
    }

    lastScrollY = currentScrollY;
    ticking = false;
  }

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(updateHeader);
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    if (window.scrollY <= 140) {
      header.classList.remove('is-hidden');
      header.classList.remove('is-scrolled');
    }
  });
}

function wireBrandScrollTop() {
  const brand = qs('.brand');
  if (!brand) return;

  brand.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function wireSocialFab() {
  const group = qs('#socialFabGroup');
  const mainBtn = qs('#socialMainBtn');
  const menu = qs('#socialMenu');
  if (!group || !mainBtn || !menu) return;

  function closeMenu() {
    group.classList.remove('is-open');
    mainBtn.setAttribute('aria-expanded', 'false');
  }

  mainBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = group.classList.toggle('is-open');
    mainBtn.setAttribute('aria-expanded', String(isOpen));
  });

  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });

  document.addEventListener('click', (event) => {
    if (!group.contains(event.target)) closeMenu();
  });
}

function wireMobileNav() {
  const toggle = qs('#navToggle');
  const menu = qs('#navMenu');
  const header = qs('.nav');
  if (!toggle || !menu) return;

  function closeMenu() {
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', t('nav_toggle_open_aria'));
  }

  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? t('nav_toggle_close_aria') : t('nav_toggle_open_aria'));
    if (header) header.classList.remove('is-hidden');
    if (open) {
      qs('#searchBox')?.classList.remove('is-open');
      qs('#searchToggle')?.setAttribute('aria-expanded', 'false');
    }
  });

  menu.querySelectorAll('a, .nav-right button').forEach((element) => {
    element.addEventListener('click', closeMenu);
  });

  document.addEventListener('click', (event) => {
    if (!menu.contains(event.target) && !toggle.contains(event.target)) closeMenu();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 760) closeMenu();
  });
}

function wireSearch() {
  const box = qs('#searchBox');
  const toggle = qs('#searchToggle');
  const input = qs('#searchInput');
  const results = qs('#searchResults');
  if (!box || !toggle || !input || !results) return;

  function renderResults(term) {
    const matches = searchProducts(term);
    if (matches.length === 0) {
      results.innerHTML = '';
      results.classList.remove('open');
      return;
    }

    results.innerHTML = matches
      .map(
        (p) =>
          `<a href="${ROUTES.product(p.id)}" class="search-result">
            <img ${responsiveImageAttrs(p.image, '64px')} alt="" loading="lazy" decoding="async" width="64" height="64" />
            <span>${escapeHtml(state.language === 'en' ? p.name_en || p.name : p.name)}</span>
          </a>`
      )
      .join('');
    results.classList.add('open');
  }

  function openSearch() {
    box.classList.add('is-open');
    qs('.nav')?.classList.add('search-active');
    toggle.setAttribute('aria-expanded', 'true');
    qs('#navMenu')?.classList.remove('is-open');
    qs('#navToggle')?.setAttribute('aria-expanded', 'false');
    input.focus();
  }

  function closeSearch() {
    box.classList.remove('is-open');
    qs('.nav')?.classList.remove('search-active');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.blur();
    input.value = '';
    input.blur();
    results.innerHTML = '';
    results.classList.remove('open');
  }

  toggle.addEventListener('click', () => {
    if (box.classList.contains('is-open')) {
      closeSearch();
    } else {
      openSearch();
    }
  });

  input.addEventListener(
    'input',
    debounce(() => renderResults(input.value), 200)
  );

  results.addEventListener('click', closeSearch);

  document.addEventListener('click', (event) => {
    if (!box.contains(event.target)) closeSearch();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && box.classList.contains('is-open')) closeSearch();
  });
}

function updateCartBadges() {
  qsa('.cart-count').forEach((el) => {
    el.textContent = String(getCartCount());
  });
}

export function initApp() {
  initI18n();
  initAccessibility();
  initCartDrawer();
  wireAddToCartDelegation();
  wireNavDropdown();
  wireHeaderScrollBehavior();
  wireBrandScrollTop();
  wireSocialFab();
  wireMobileNav();
  wireSearch();
  renderCollectionsMenu();

  subscribe('cart', updateCartBadges);
  subscribe('language', () => {
    renderCollectionsMenu();
    renderRoute(getCurrentRoute());
  });
  updateCartBadges();

  onRouteChange(renderRoute);
  renderRoute(getCurrentRoute());
}
