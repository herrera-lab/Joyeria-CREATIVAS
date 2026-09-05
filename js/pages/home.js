import { getCategories, getFeaturedMinis } from '../features/catalog.js';
import { t, translateDom } from '../features/i18n.js';
import { state } from '../core/state.js';
import { formatPrice } from '../utils/format.js';
import { escapeHtml, qs, responsiveImageAttrs } from '../utils/dom.js';
import { ROUTES } from '../config/routes.js';
import { BRAND } from '../config/constants.js';

function categoryRowHtml(category) {
  const label = state.language === 'en' ? category.label_en : category.label_es;
  const tagline = state.language === 'en' ? category.tagline_en : category.tagline_es;
  const minis = getFeaturedMinis(category.slug, 3);

  return `
    <div class="cat-row" data-reveal>
      <div class="cat-row-inner">
        <div class="cat-visual">
          <img ${responsiveImageAttrs(category.banner, '(min-width: 900px) 50vw, 100vw')} alt="${escapeHtml(label)}" loading="lazy" decoding="async" width="800" height="600" />
        </div>
        <div class="cat-text">
          <span class="eyebrow">${t('nav_colecciones')}</span>
          <h2>${escapeHtml(label)}</h2>
          <p class="tagline">${escapeHtml(tagline)}</p>
          <div class="cat-minis">
            ${minis
              .map((p) => {
                const pName = state.language === 'en' ? p.name_en || p.name : p.name;
                return `
              <a class="cat-mini" href="${ROUTES.product(p.id)}">
                <span class="swatch"><img ${responsiveImageAttrs(p.image, '120px')} alt="${escapeHtml(pName)}" loading="lazy" decoding="async" width="240" height="240" /></span>
                <span class="name">${escapeHtml(pName)}</span>
                <span class="price">${formatPrice(p.price, state.language)}</span>
              </a>`;
              })
              .join('')}
          </div>
          <a class="cat-cta-label" href="${ROUTES.category(category.slug)}">${t('ver_coleccion')}</a>
        </div>
      </div>
    </div>`;
}

export function renderHome(container) {
  container.innerHTML = `
    <section class="hero">
      <video class="hero-video" autoplay muted loop playsinline preload="metadata" poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3Crect fill='%232e2624' width='16' height='9'/%3E%3C/svg%3E">
        <source src="${BRAND.heroVideo}" type="video/mp4" />
        <p>${t('hero_video_fallback')}</p>
      </video>
      <div class="hero-overlay"></div>
      <div class="wrap hero-content">
        <img class="hero-logo" src="${BRAND.logo}" alt="${BRAND.name}" loading="lazy" decoding="async" width="480" height="480" />
        <h1>${escapeHtml(state.language === 'en' ? BRAND.slogan_en : BRAND.slogan_es)}</h1>
        <button class="hero-cta" type="button" id="heroCta" data-i18n="hero_cta">${t('hero_cta')}</button>
      </div>
    </section>

    <section class="categories" id="categories" aria-label="${t('nav_colecciones')}">
      <div class="wrap" id="catRows">
        ${getCategories().map(categoryRowHtml).join('')}
      </div>
    </section>

    <section class="trust" id="trust" aria-label="${t('trust_section_aria')}">
      <div class="wrap">
        <div class="trust-item">
          <span class="eyebrow">${t('trust_envio_title')}</span>
          <p>${t('trust_envio_body')}</p>
        </div>
        <div class="trust-item">
          <span class="eyebrow">${t('trust_hecho_title')}</span>
          <p>${t('trust_hecho_body')}</p>
        </div>
        <div class="trust-item">
          <span class="eyebrow">${t('trust_pago_title')}</span>
          <p>${t('trust_pago_body')}</p>
        </div>
      </div>
    </section>
  `;

  qs('#heroCta', container)?.addEventListener('click', () => {
    qs('#categories')?.scrollIntoView({ behavior: 'smooth' });
  });

  translateDom(container);
}
