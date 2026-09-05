export function qs(selector, scope = document) {
  return scope.querySelector(selector);
}

export function qsa(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

export function createElement(tag, className = '') {
  const el = document.createElement(tag);
  if (className) el.className = className;
  return el;
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function responsiveImageAttrs(src, sizes) {
  const attrs = `src="${src}"`;
  if (!src.includes('/optimized/') || !src.endsWith('-960.webp')) return attrs;

  const srcset = [480, 960, 1440]
    .map((width) => `${src.replace('-960.webp', `-${width}.webp`)} ${width}w`)
    .join(', ');
  return `${attrs} srcset="${srcset}" sizes="${sizes}"`;
}

export function setHtml(container, html) {
  container.innerHTML = html;
  return container;
}

let toastTimeoutId;
export function showToast(message) {
  const toast = qs('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimeoutId);
  toastTimeoutId = setTimeout(() => toast.classList.remove('show'), 2600);
}

export function trapFocus(container) {
  const focusable = qsa(
    'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
    container
  );
  if (focusable.length === 0) return () => {};

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  function onKeydown(event) {
    if (event.key !== 'Tab') return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  container.addEventListener('keydown', onKeydown);
  return () => container.removeEventListener('keydown', onKeydown);
}
