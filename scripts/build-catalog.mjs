import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const productsDir = join(root, 'data', 'productos');
const categoriesDir = join(root, 'data', 'categorias');
const outputFile = join(root, 'js', 'config', 'products.json');

async function readJsonDirectory(directory) {
  const files = (await readdir(directory))
    .filter((file) => file.endsWith('.json'))
    .sort((first, second) => first.localeCompare(second, undefined, { numeric: true }));
  return Promise.all(files.map(async (file) => JSON.parse(await readFile(join(directory, file), 'utf8'))));
}

const [products, categories] = await Promise.all([
  readJsonDirectory(productsDir),
  readJsonDirectory(categoriesDir),
]);

await writeFile(outputFile, `${JSON.stringify({ CATEGORIES: categories, PRODUCTS: products }, null, 2)}\n`);