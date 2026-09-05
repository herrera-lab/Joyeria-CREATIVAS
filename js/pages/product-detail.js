import { getProductById, getCategory, getRelatedProducts, productCardHtml } from '../features/catalog.js';
import { t, translateDom } from '../features/i18n.js';
import { addToCart } from '../features/cart.js';
import { openCartDrawer } from './cart.js';
import { state } from '../core/state.js';
import { formatPrice, formatWeeks } from '../utils/format.js';
import { escapeHtml, qs, responsiveImageAttrs, showToast } from '../utils/dom.js';
import { ROUTES } from '../config/routes.js';
import { CARE_TIPS_ES, CARE_TIPS_EN, SHIPPING } from '../config/constants.js';

const VARIANTS = {
  anillos: {
    label_es: 'Talla',
    label_en: 'Size',
    options: ['5', '6', '7', '8', '9']
  },
  collares: {
    label_es: 'Largo',
    label_en: 'Length',
    options_es: ['Corto (38 cm)', 'Mediano (44 cm)', 'Largo (50 cm)'],
    options_en: ['Short (38 cm)', 'Medium (44 cm)', 'Long (50 cm)']
  },
  cadenas: {
    label_es: 'Largo',
    label_en: 'Length',
    options_es: ['Corto (40 cm)', 'Mediano (48 cm)', 'Largo (55 cm)'],
    options_en: ['Short (40 cm)', 'Medium (48 cm)', 'Long (55 cm)']
  }
};

function variantSelectHtml(categorySlug) {
  const config = VARIANTS[categorySlug];
  if (!config) return '';

  const lang = state.language;
  const label = lang === 'en' ? config.label_en : config.label_es;
  const options = config.options || (lang === 'en' ? config.options_en : config.options_es);

  return `
    <label class="variant-select">
      <span>${escapeHtml(label)}</span>
      <select id="pdVariant">
        ${options.map((opt) => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`).join('')}
      </select>
    </label>`;
}

export function renderProductDetail(container, params) {
  const product = getProductById(params.id);

  if (!product) {
    container.innerHTML = `<div class="wrap detail-head"><p>${t('product_not_found')}</p></div>`;
    return;
  }

  const category = getCategory(product.category);
  const categoryLabel = state.language === 'en' ? category.label_en : category.label_es;
  const material = state.language === 'en' ? product.material_en : product.material_es;
  const productName = state.language === 'en' ? product.name_en || product.name : product.name;
  const related = getRelatedProducts(product, 4);
  const lang = state.language;
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

  container.innerHTML = `
    <main class="wrap product-detail">
      <p class="breadcrumb">
        <a href="${ROUTES.home()}">${t('breadcrumb_inicio')}</a> /
        <a href="${ROUTES.category(category.slug)}">${escapeHtml(categoryLabel)}</a> /
        <b>${escapeHtml(productName)}</b>
      </p>

      <div class="product-detail-grid">
        <div class="product-gallery">
          <div class="product-gallery-main">
            <img ${responsiveImageAttrs(product.image, '(min-width: 900px) 50vw, 100vw')} alt="${escapeHtml(productName)} — ${escapeHtml(material)}" loading="eager" decoding="async" width="900" height="900" />
          </div>
        </div>

        <div class="product-info">
          <h1>${escapeHtml(productName)}</h1>
          <p class="product-detail-price">${formatPrice(product.price, lang)}</p>
          <p class="product-detail-desc">
            ${
              lang === 'en'
                ? 'Handcrafted piece, made to order with care and attention to detail.'
                : 'Pieza artesanal, hecha a pedido con dedicación y atención al detalle.'
            }
          </p>

          <dl class="spec-list">
            ${showMaterial ? `<div><dt>${t('product_material_label')}</dt><dd>${escapeHtml(material)}</dd></div>` : ''}
            <div><dt>${t('product_dimensions_label')}</dt><dd>${escapeHtml(
              lang === 'en' ? product.dimensions_en : product.dimensions_es
            )}</dd></div>
            ${showMaterial ? `<div><dt>${t('product_weeks_label')}</dt><dd>${formatWeeks(product.weeks, lang)}</dd></div>` : ''}
          </dl>

          ${variantSelectHtml(product.category)}

          <div class="product-actions">
            <button class="add-btn" type="button" id="pdAddToCart">${t('add_to_cart')}</button>
            <button class="hero-cta pd-buy-now" type="button" id="pdBuyNow">${t('buy_now')}</button>
          </div>

          <div class="shipping-box">
            <span class="eyebrow">${t('shipping_info_title')}</span>
            <p>${SHIPPING.carrier_es}: ₡${SHIPPING.outsideSanCarlos.toLocaleString('es-CR')} ${
              lang === 'en' ? 'outside San Carlos' : 'fuera de San Carlos'
            }, ₡${SHIPPING.withinSanCarlos.toLocaleString('es-CR')} ${
              lang === 'en' ? 'within the San Carlos canton' : 'dentro del cantón de San Carlos'
            }.</p>
          </div>

          <div class="care-box">
            <span class="eyebrow">${t('care_title')}</span>
            <ul>${(lang === 'en' ? CARE_TIPS_EN : CARE_TIPS_ES)
              .map((tip) => `<li>${escapeHtml(tip)}</li>`)
              .join('')}</ul>
          </div>
        </div>
      </div>

      ${
        related.length > 0
          ? `
      <section class="related-section">
        <h2>${t('related_title')}</h2>
        <div class="product-grid">${related.map(productCardHtml).join('')}</div>
      </section>`
          : ''
      }
    </main>
  `;

  function currentVariant() {
    return qs('#pdVariant', container)?.value || '';
  }

  qs('#pdAddToCart', container).addEventListener('click', () => {
    addToCart(product, currentVariant());
    showToast(t('added_to_cart'));
  });

  qs('#pdBuyNow', container).addEventListener('click', () => {
    addToCart(product, currentVariant());
    openCartDrawer();
  });

  translateDom(container);
}
