// Los datos del catálogo viven en products.json para que Decap CMS (/admin)
// pueda editarlos. Este módulo solo los carga y mantiene la misma API pública.
const data = await fetch(new URL('./products.json', import.meta.url)).then((res) => {
  if (!res.ok) throw new Error(`No se pudo cargar products.json (${res.status})`);
  return res.json();
});

export const CATEGORIES = data.CATEGORIES;

export const PRODUCTS = data.PRODUCTS;
