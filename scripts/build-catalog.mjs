import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('..', import.meta.url));
const productsDir = join(root, 'data', 'productos');
const categoriesDir = join(root, 'data', 'categorias');
const outputFile = join(root, 'js', 'config', 'products.json');
const optimizedDir = join(root, 'images', 'optimized');
const optimizedWidths = [480, 960, 1440];
const maxSourceBytes = 12 * 1024 * 1024;
const maxSourcePixels = 40_000_000;

async function readJsonDirectory(directory) {
  const files = (await readdir(directory))
    .filter((file) => file.endsWith('.json'))
    .sort((first, second) => first.localeCompare(second, undefined, { numeric: true }));
  return Promise.all(files.map(async (file) => JSON.parse(await readFile(join(directory, file), 'utf8'))));
}

function sourcePathFor(publicPath) {
  if (!publicPath.startsWith('images/')) {
    throw new Error(`La imagen debe estar dentro de images/: ${publicPath}`);
  }
  return join(root, ...publicPath.split('/'));
}

function optimizedBaseName(publicPath) {
  return publicPath
    .slice('images/'.length)
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_');
}

const optimizedImages = new Map();

async function optimizeImage(publicPath) {
  if (optimizedImages.has(publicPath)) return optimizedImages.get(publicPath);

  const sourcePath = sourcePathFor(publicPath);
  const sourceStats = await stat(sourcePath).catch(() => null);
  if (!sourceStats) throw new Error(`No existe la imagen referenciada: ${publicPath}`);
  if (sourceStats.size > maxSourceBytes) {
    throw new Error(`La imagen supera 12 MB y no se puede publicar: ${publicPath}`);
  }

  const metadata = await sharp(sourcePath, { failOn: 'error' }).metadata();
  if ((metadata.width || 0) * (metadata.height || 0) > maxSourcePixels) {
    throw new Error(`La imagen tiene demasiados pixeles para publicarse: ${publicPath}`);
  }

  const baseName = optimizedBaseName(publicPath);
  const variants = optimizedWidths.map((width) => `images/optimized/${baseName}-${width}.webp`);
  await Promise.all(
    optimizedWidths.map((width, index) =>
      sharp(sourcePath)
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 78, effort: 5 })
        .toFile(join(root, ...variants[index].split('/')))
    )
  );

  const optimizedPath = variants[1];
  optimizedImages.set(publicPath, optimizedPath);
  return optimizedPath;
}

async function optimizeCatalogImages(value) {
  if (Array.isArray(value)) {
    return Promise.all(value.map((item) => optimizeCatalogImages(item)));
  }
  if (!value || typeof value !== 'object') return value;

  const entries = await Promise.all(
    Object.entries(value).map(async ([key, entryValue]) => [
      key,
      key === 'image' || key === 'banner'
        ? await optimizeImage(entryValue)
        : await optimizeCatalogImages(entryValue)
    ])
  );
  return Object.fromEntries(entries);
}

const [products, categories] = await Promise.all([
  readJsonDirectory(productsDir),
  readJsonDirectory(categoriesDir),
]);

await rm(optimizedDir, { recursive: true, force: true });
await mkdir(optimizedDir, { recursive: true });

const [optimizedProducts, optimizedCategories] = await Promise.all([
  optimizeCatalogImages(products),
  optimizeCatalogImages(categories),
]);

await writeFile(
  outputFile,
  `${JSON.stringify({ CATEGORIES: optimizedCategories, PRODUCTS: optimizedProducts }, null, 2)}\n`
);