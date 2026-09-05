import { CATEGORIES, PRODUCTS } from '../config/products.js';
import { ROUTES } from '../config/routes.js';
import { t } from './i18n.js';
import { state } from '../core/state.js';
import { formatPrice } from '../utils/format.js';
import { escapeHtml, responsiveImageAttrs } from '../utils/dom.js';

export function getCategories() {
  return CATEGORIES;
}

export function getCategory(slug) {
  return CATEGORIES.find((c) => c.slug === slug) || null;
}

export function getProductsByCategory(slug, subcategoryEs = null) {
  return PRODUCTS.filter(
    (p) => p.category === slug && (!subcategoryEs || p.subcategory_es === subcategoryEs)
  );
}

export function getProductById(id) {
  return PRODUCTS.find((p) => p.id === id) || null;
}

export function getFeaturedMinis(slug, count = 3) {
  return getProductsByCategory(slug).slice(0, count);
}

export function getRelatedProducts(product, count = 4) {
  return PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(
    0,
    count
  );
}

export function productCardHtml(product) {
  const name = escapeHtml(state.language === 'en' ? product.name_en || product.name : product.name);
  const badges = [
    product.isNew ? `<span class="badge badge--new">${t('badge_nuevo')}</span>` : '',
    product.isLimited ? `<span class="badge badge--limited">${t('badge_limitada')}</span>` : ''
  ].join('');
  const hiddenMaterialCategories = new Set([
    'anillos',
    'cadenas',
    'pulseras',
    'personalizados',
    'mascotas',
    'aretes',
    'collares',
    'relicarios',
    'hombres'
  ]);
  const showMaterial = !hiddenMaterialCategories.has(product.category);

  return `
    <article class="product-card">
      <a class="product-photo" href="${ROUTES.product(product.id)}" aria-label="${name}">
        <img ${responsiveImageAttrs(product.image, '(min-width: 900px) 30vw, (min-width: 560px) 45vw, 92vw')} alt="${name}" loading="lazy" decoding="async" width="600" height="600" />
        ${badges}
      </a>
      <a class="product-name" href="${ROUTES.product(product.id)}">${name}</a>
      ${showMaterial ? `<p class="product-meta">${escapeHtml(state.language === 'en' ? product.material_en : product.material_es)}</p>` : ''}
      <p class="product-price">${formatPrice(product.price, state.language)}</p>
      <button class="add-btn" type="button" data-add-to-cart="${product.id}">${t('add_to_cart')}</button>
    </article>`;
}

function byPrice(direction) {
  return (a, b) => {
    const aHasPrice = typeof a.price === 'number' && Number.isFinite(a.price);
    const bHasPrice = typeof b.price === 'number' && Number.isFinite(b.price);
    if (!aHasPrice && !bHasPrice) return 0;
    if (!aHasPrice) return 1;
    if (!bHasPrice) return -1;
    return direction * (a.price - b.price);
  };
}

export function sortProducts(products, sortKey) {
  const list = [...products];
  switch (sortKey) {
    case 'precio_asc':
      return list.sort(byPrice(1));
    case 'precio_desc':
      return list.sort(byPrice(-1));
    case 'nuevo':
      return list.sort((a, b) => Number(b.isNew) - Number(a.isNew));
    default:
      return list;
  }
}
