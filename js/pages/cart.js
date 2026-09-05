import { state, subscribe } from '../core/state.js';
import { removeFromCart, setQty, getCartCount, getCartTotal } from '../features/cart.js';
import { openWhatsAppOrder } from '../features/whatsapp.js';
import { t, translateDom } from '../features/i18n.js';
import { formatPrice } from '../utils/format.js';
import { escapeHtml, qs, qsa, responsiveImageAttrs, trapFocus } from '../utils/dom.js';

let releaseFocusTrap = () => {};

function itemRowHtml(item) {
  const variant = item.variant ? ` — ${escapeHtml(item.variant)}` : '';
  const itemName = state.language === 'en' ? item.nameEn || item.name : item.name;
  return `
    <div class="drawer-item" data-line="${item.id}|${item.variant || ''}">
      <div class="thumb"><img ${responsiveImageAttrs(item.image, '120px')} alt="${escapeHtml(itemName)}" loading="lazy" decoding="async" width="120" height="120" /></div>
      <div class="info">
        <p class="name">${escapeHtml(itemName)}${variant}</p>
        <p class="price">${formatPrice(item.price, state.language)}</p>
        <div class="qty-row">
          <label class="sr-only">${t('qty_label')}</label>
          <input type="number" min="1" value="${item.qty}" class="qty-input" data-qty="${item.id}|${item.variant || ''}" />
          <button class="remove" type="button" data-remove="${item.id}|${item.variant || ''}">${t('remove')}</button>
        </div>
      </div>
    </div>`;
}

export function renderCartDrawer() {
  const body = qs('#drawerBody');
  const totalEl = qs('#drawerTotal');
  const waBtn = qs('#waBtn');
  const countEls = qsa('.cart-count');

  if (!body) return;

  body.innerHTML =
    state.cart.length > 0
      ? state.cart.map(itemRowHtml).join('')
      : `<p class="drawer-empty">${t('cart_empty')}</p>`;

  if (totalEl) totalEl.textContent = formatPrice(getCartTotal(), state.language);
  if (waBtn) waBtn.disabled = state.cart.length === 0;

  countEls.forEach((el) => {
    el.textContent = String(getCartCount());
  });

  qsa('[data-remove]', body).forEach((btn) => {
    btn.addEventListener('click', () => {
      const [id, variant] = btn.dataset.remove.split('|');
      removeFromCart(id, variant);
    });
  });

  qsa('[data-qty]', body).forEach((input) => {
    input.addEventListener('change', () => {
      const [id, variant] = input.dataset.qty.split('|');
      setQty(id, variant, Number(input.value) || 1);
    });
  });

  translateDom(qs('#drawer'));
}

export function openCartDrawer() {
  const drawer = qs('#drawer');
  const scrim = qs('#scrim');
  const openBtn = qs('#cartOpenBtn');
  if (!drawer || !scrim) return;

  renderCartDrawer();
  drawer.classList.add('open');
  scrim.classList.add('open');
  releaseFocusTrap = trapFocus(drawer);
  qs('#drawerClose')?.focus();
  document.addEventListener('keydown', onDrawerKeydown);
}

export function closeCartDrawer() {
  const drawer = qs('#drawer');
  const scrim = qs('#scrim');
  if (!drawer || !scrim) return;

  drawer.classList.remove('open');
  scrim.classList.remove('open');
  releaseFocusTrap();
  document.removeEventListener('keydown', onDrawerKeydown);
  qs('#cartOpenBtn')?.focus();
}

function onDrawerKeydown(event) {
  if (event.key === 'Escape') closeCartDrawer();
}

export function initCartDrawer() {
  qs('#cartOpenBtn')?.addEventListener('click', openCartDrawer);
  qs('#drawerClose')?.addEventListener('click', closeCartDrawer);
  qs('#scrim')?.addEventListener('click', closeCartDrawer);
  qs('#waBtn')?.addEventListener('click', () => {
    if (state.cart.length === 0) return;
    openWhatsAppOrder();
  });

  subscribe('cart', renderCartDrawer);
  subscribe('language', renderCartDrawer);
  renderCartDrawer();
}

export function cartPage() {
  openCartDrawer();
}
