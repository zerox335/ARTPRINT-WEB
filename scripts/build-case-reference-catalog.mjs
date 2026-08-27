import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const sourceDirectory = resolve(process.argv[2] ?? ".tmp/reference-scan-20260817");
const outputFile = resolve(process.argv[3] ?? "src/modules/catalog/infrastructure/phone-case-references.generated.json");

const excludedProducts = /^(?:Bolsillo Porta Celular|Caja Para Carcasa|Carcasa Personalizada|Carcasas LG|Mockups Carcasas)/i;
const iphoneModels = [
  "17 Pro Max", "17 Pro", "17 Air", "17",
  "16 Pro Max", "16 Plus", "16E", "16",
  "15 Pro Max", "15 Plus", "15 Pro", "15",
  "14 Pro Max", "14 Plus", "14 Pro", "14",
  "13 Pro Max", "13 Pro", "13",
  "12 Pro Max", "12 Mini", "12/12 Pro", "12",
  "11 Pro Max", "11 Pro", "11",
  "XS Max", "XR", "X - XS", "X/XS",
  "7 Plus - 8 Plus", "7 - 8 - SE 2020", "6 Plus", "6 - IP6s", "6-6s",
];

function decodeText(value) {
  return value
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replace(/^Carcasas?\s+/i, "")
    .replace(/^Oppon\s+/i, "Oppo ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeIphone(value) {
  const plain = value.replace(/^Iphone\s+/i, "");
  const model = iphoneModels.find((candidate) => plain.toLocaleLowerCase("en").startsWith(candidate.toLocaleLowerCase("en")));
  if (!model) return value.replace(/^Iphone/i, "iPhone");
  const normalized = model
    .replace("12/12 Pro", "12 / 12 Pro")
    .replace("X/XS", "X / XS")
    .replace("6-6s", "6 / 6s")
    .replace("6 - IP6s", "6 / 6s")
    .replace("7 Plus - 8 Plus", "7 Plus / 8 Plus")
    .replace("7 - 8 - SE 2020", "7 / 8 / SE 2020")
    .replace("X - XS", "X / XS");
  return `iPhone ${normalized}`;
}

function normalizeModel(rawName) {
  let value = decodeText(rawName);
  if (/^Iphone\b/i.test(value)) return normalizeIphone(value);
  value = value.replace(/\s+(?:TPU Color|GLASS)$/i, "").trim();
  if (/^Huawei Honor\b/i.test(value)) value = value.replace(/^Huawei\s+/i, "");
  if (/^Samsung A56\s*\/\s*A36$/i.test(value)) value = "Samsung A36 / A56";
  return value;
}

function brandFor(model) {
  if (/^iPhone\b/i.test(model)) return "Apple";
  if (/^Honor\b/i.test(model)) return "Honor";
  if (/^Huawei\b/i.test(model)) return "Huawei";
  if (/^Infinix\b/i.test(model)) return "Infinix";
  if (/^(?:Moto|Motorola)\b/i.test(model)) return "Motorola";
  if (/^Oppo\b/i.test(model)) return "Oppo";
  if (/^(?:Poco|Redmi|Xiaomi)\b/i.test(model)) return "Xiaomi";
  if (/^Realme\b/i.test(model)) return "Realme";
  if (/^Samsung\b/i.test(model)) return "Samsung";
  if (/^Tecno\b/i.test(model)) return "Tecno";
  if (/^Vivo\b/i.test(model)) return "Vivo";
  throw new Error(`No se pudo clasificar la marca de: ${model}`);
}

function seriesFor(brand, model) {
  if (brand === "Apple") return `iPhone ${model.replace(/^iPhone\s+/i, "").split(/[ /-]/)[0]}`;
  if (brand === "Samsung") {
    if (/^Samsung (?:Galaxy )?A/i.test(model)) return "Galaxy A";
    if (/^Samsung (?:Galaxy )?M/i.test(model)) return "Galaxy M";
    if (/^Samsung (?:Galaxy )?S/i.test(model)) return "Galaxy S";
    if (/^Samsung J/i.test(model)) return "Galaxy J";
    if (/^Samsung Note/i.test(model)) return "Galaxy Note";
    if (/^Samsung Z/i.test(model)) return "Galaxy Z";
  }
  if (brand === "Huawei") {
    if (/^Huawei Nova/i.test(model)) return "Nova";
    if (/^Huawei Pura/i.test(model)) return "Pura";
    if (/^Huawei Mate/i.test(model)) return "Mate";
    if (/^Huawei Psmart/i.test(model)) return "P Smart";
    if (/^Huawei P/i.test(model)) return "Serie P";
    if (/^Huawei Y/i.test(model)) return "Serie Y";
  }
  if (brand === "Motorola") {
    if (/^(?:Moto|Motorola) Edge/i.test(model)) return "Edge";
    if (/^(?:Moto|Motorola) E/i.test(model)) return "Moto E";
    if (/^(?:Moto|Motorola) G/i.test(model)) return "Moto G";
    if (/^Moto One/i.test(model)) return "Moto One";
  }
  if (brand === "Xiaomi") {
    if (/^Poco/i.test(model)) return "Poco";
    if (/^(?:Xiaomi )?Redmi Note/i.test(model)) return "Redmi Note";
    if (/^(?:Xiaomi )?Redmi/i.test(model)) return "Redmi";
    return "Xiaomi";
  }
  if (brand === "Oppo") return /^Oppo Reno/i.test(model) ? "Reno" : "Serie A";
  if (brand === "Tecno") return /^Tecno (Spark|Camon|Pova)/i.exec(model)?.[1] ?? "Tecno";
  if (brand === "Infinix") return /^Infinix (Hot|Note|Smart)/i.exec(model)?.[1] ?? "Infinix";
  if (brand === "Vivo") return /^Vivo ([VYX])/i.exec(model)?.[1] ? `Vivo ${/^Vivo ([VYX])/i.exec(model)[1].toUpperCase()}` : "Vivo";
  if (brand === "Realme") return /^Realme (C|Note|GT)/i.exec(model)?.[1] ? `Realme ${/^Realme (C|Note|GT)/i.exec(model)[1]}` : "Realme";
  if (brand === "Honor") {
    if (/^Honor Magic/i.test(model)) return "Honor Magic";
    if (/^Honor X/i.test(model)) return "Honor X";
    return "Honor";
  }
  return brand;
}

function slugify(value) {
  return value.replaceAll("+", " plus ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("en").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const files = (await readdir(sourceDirectory)).filter((name) => /^page-\d+\.html$/.test(name)).sort();
if (files.length !== 5) throw new Error(`Se esperaban 5 páginas y se encontraron ${files.length}`);

const sourceItems = [];
for (const file of files) {
  const html = await readFile(resolve(sourceDirectory, file), "utf8");
  for (const match of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
    let data;
    try { data = JSON.parse(match[1]); } catch { continue; }
    if (data?.["@type"] === "ItemList" && Array.isArray(data.itemListElement)) sourceItems.push(...data.itemListElement);
  }
}

const byKey = new Map();
for (const item of sourceItems) {
  if (typeof item.name !== "string" || excludedProducts.test(item.name)) continue;
  const model = normalizeModel(item.name);
  const brand = brandFor(model);
  const series = seriesFor(brand, model);
  const key = model.toLocaleLowerCase("es");
  const current = byKey.get(key);
  if (current) {
    current.sourceVariants += 1;
  } else {
    byKey.set(key, { brand, series, model, slug: slugify(model), sourceVariants: 1 });
  }
}

const references = [...byKey.values()].sort((left, right) =>
  left.brand.localeCompare(right.brand, "es") || left.series.localeCompare(right.series, "es") || left.model.localeCompare(right.model, "es")
);

const duplicateSlugs = references.map((item) => item.slug).filter((slug, index, all) => all.indexOf(slug) !== index);
if (duplicateSlugs.length) throw new Error(`Slugs duplicados: ${duplicateSlugs.join(", ")}`);

await writeFile(outputFile, `${JSON.stringify(references, null, 2)}\n`, "utf8");
console.info(`Publicaciones revisadas: ${sourceItems.length}`);
console.info(`Referencias únicas: ${references.length}`);
console.info(`Archivo generado: ${outputFile}`);
