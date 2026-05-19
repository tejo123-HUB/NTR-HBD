import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POSTERS_DIR = path.join(__dirname, "..", "assets", "posters");
const TMDB_KEY = "1f54bd990f1cdfb225adb56346b0eae2";

const RETRY = [
  { slug: "subbu", wiki: "Subbu (film)", tmdb: 26696 },
  { slug: "naa-alludu", wiki: "Naa Alludu", tmdb: 26698 },
  { slug: "narasimhudu", wiki: "Narasimhudu", tmdb: 26699 },
  { slug: "ashok", wiki: "Ashok (film)", tmdb: 26695 },
  { slug: "rakhi", wiki: "Rakhi (2006 film)", tmdb: 27722 },
  { slug: "oosaravelli", wiki: "Oosaravelli", tmdb: 72476 },
  { slug: "dammu", wiki: "Dammu", tmdb: 116450 },
  { slug: "baadshah", wiki: "Baadshah (2013 film)", tmdb: 193813 },
  { slug: "rabhasa", wiki: "Rabhasa", tmdb: 283676 },
  { slug: "temper", wiki: "Temper (film)", tmdb: 325789 },
  { slug: "nannaku-prematho", wiki: "Nannaku Prematho", tmdb: 365187 },
  { slug: "janatha-garage", wiki: "Janatha Garage", tmdb: 405924 },
  { slug: "jai-lava-kusa", wiki: "Jai Lava Kusa", tmdb: 472470 },
  { slug: "aravinda-sametha", wiki: "Aravinda Sametha Veera Raghava", tmdb: 539652 },
  { slug: "rrr", wiki: "RRR (film)", tmdb: 579974 },
];

async function tmdbPosterUrl(id) {
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}`,
    { headers: { "User-Agent": "NTRFanTribute/1.0" } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.poster_path
    ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
    : null;
}

async function wikiPosterUrl(title) {
  const res = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    { headers: { "User-Agent": "NTRFanTribute/1.0" } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const thumb = data.thumbnail?.source;
  return thumb ? thumb.replace(/\/\d+px-/, "/500px-") : null;
}

async function download(url, dest) {
  const res = await fetch(url, {
    headers: { "User-Agent": "NTRFanTribute/1.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(POSTERS_DIR, "manifest.json"), "utf8")
  );

  for (const film of RETRY) {
    const dest = path.join(POSTERS_DIR, `${film.slug}.jpg`);
    if (fs.existsSync(dest)) {
      console.log(`EXISTS ${film.slug}`);
      continue;
    }

    await new Promise((r) => setTimeout(r, 2500));

    let url = null;
    let source = "";

    try {
      url = await tmdbPosterUrl(film.tmdb);
      if (url) source = "tmdb";
    } catch (_) {}

    if (!url) {
      try {
        await new Promise((r) => setTimeout(r, 1500));
        url = await wikiPosterUrl(film.wiki);
        if (url) source = "wikipedia";
      } catch (_) {}
    }

    if (!url) {
      console.log(`SKIP ${film.slug}`);
      continue;
    }

    try {
      await download(url, dest);
      manifest[film.slug] = `assets/posters/${film.slug}.jpg`;
      console.log(`OK   ${film.slug} (${source})`);
    } catch (e) {
      console.log(`FAIL ${film.slug}: ${e.message}`);
    }
  }

  fs.writeFileSync(
    path.join(POSTERS_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );
}

main().catch(console.error);
