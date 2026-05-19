import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POSTERS_DIR = path.join(__dirname, "..", "assets", "posters");

/** slug -> Wikipedia article title (English) */
const FILMS = [
  { slug: "brahmarshi-viswamitra", wiki: "Brahmarshi Viswamitra" },
  { slug: "ramayanam", wiki: "Ramayanam (1997 film)" },
  { slug: "ninnu-choodalani", wiki: "Ninnu Choodalani" },
  { slug: "student-no-1", wiki: "Student No. 1" },
  { slug: "subbu", wiki: "Subbu (film)" },
  { slug: "aadi", wiki: "Aadi (2002 film)" },
  { slug: "allari-ramudu", wiki: "Allari Ramudu" },
  { slug: "naaga", wiki: "Naaga" },
  { slug: "simhadri", wiki: "Simhadri (2003 film)" },
  { slug: "andhrawala", wiki: "Andhrawala" },
  { slug: "samba", wiki: "Samba (2004 film)" },
  { slug: "naa-alludu", wiki: "Naa Alludu" },
  { slug: "narasimhudu", wiki: "Narasimhudu" },
  { slug: "ashok", wiki: "Ashok (film)" },
  { slug: "rakhi", wiki: "Rakhi (2006 film)" },
  { slug: "yamadonga", wiki: "Yamadonga" },
  { slug: "kantri", wiki: "Kantri" },
  { slug: "adhurs", wiki: "Adhurs" },
  { slug: "brindavanam", wiki: "Brindavanam (2010 film)" },
  { slug: "oosaravelli", wiki: "Oosaravelli" },
  { slug: "dammu", wiki: "Dammu" },
  { slug: "baadshah", wiki: "Baadshah (2013 film)" },
  { slug: "ramayya-vasthavayya", wiki: "Ramayya Vasthavayya" },
  { slug: "rabhasa", wiki: "Rabhasa" },
  { slug: "temper", wiki: "Temper (film)" },
  { slug: "nannaku-prematho", wiki: "Nannaku Prematho" },
  { slug: "janatha-garage", wiki: "Janatha Garage" },
  { slug: "jai-lava-kusa", wiki: "Jai Lava Kusa" },
  { slug: "aravinda-sametha", wiki: "Aravinda Sametha Veera Raghava" },
  { slug: "rrr", wiki: "RRR (film)" },
  { slug: "devara-part-1", wiki: "Devara: Part 1" },
  { slug: "war-2", wiki: "War 2 (film)" },
];

/** TMDB fallback: slug -> movie id */
const TMDB_IDS = {
  "student-no-1": 26691,
  simhadri: 80805,
  yamadonga: 14785,
  aadi: 26689,
  rakhi: 27722,
  adhurs: 38757,
  brindavanam: 38758,
  oosaravelli: 72476,
  baadshah: 193813,
  temper: 325789,
  "nannaku-prematho": 365187,
  "janatha-garage": 405924,
  "jai-lava-kusa": 472470,
  "aravinda-sametha": 539652,
  rrr: 579974,
  "devara-part-1": 811944,
  "war-2": 958006,
  dammu: 116450,
  rabhasa: 283676,
  "ramayya-vasthavayya": 233073,
  kantri: 13888,
  andhrawala: 26692,
  samba: 26693,
  naaga: 26694,
  ashok: 26695,
  "ninnu-choodalani": 26690,
  subbu: 26696,
  "allari-ramudu": 26697,
  "naa-alludu": 26698,
  narasimhudu: 26699,
};

const TMDB_KEY = "1f54bd990f1cdfb225adb56346b0eae2";

function slugToTitle(slug) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

async function wikiPosterUrl(title) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "NTRFanTribute/1.0 (educational fan site)" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const thumb = data.thumbnail?.source;
  if (!thumb) return null;
  // Prefer larger image (Wikipedia thumbs often ~320px)
  return thumb.replace(/\/\d+px-/, "/500px-");
}

async function tmdbPosterUrl(id) {
  const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.poster_path) return null;
  return `https://image.tmdb.org/t/p/w500${data.poster_path}`;
}

async function download(url, dest) {
  const res = await fetch(url, {
    headers: { "User-Agent": "NTRFanTribute/1.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return buf.length;
}

async function main() {
  fs.mkdirSync(POSTERS_DIR, { recursive: true });
  const manifest = {};

  for (const film of FILMS) {
    const dest = path.join(POSTERS_DIR, `${film.slug}.jpg`);
    let imageUrl = null;
    let source = "";

    try {
      imageUrl = await wikiPosterUrl(film.wiki);
      if (imageUrl) source = "wikipedia";
    } catch (_) {}

    if (!imageUrl && TMDB_IDS[film.slug]) {
      try {
        imageUrl = await tmdbPosterUrl(TMDB_IDS[film.slug]);
        if (imageUrl) source = "tmdb";
      } catch (_) {}
    }

    if (!imageUrl) {
      console.log(`SKIP  ${film.slug} (no poster found)`);
      manifest[film.slug] = null;
      continue;
    }

    try {
      const bytes = await download(imageUrl, dest);
      console.log(`OK    ${film.slug} (${source}, ${(bytes / 1024).toFixed(1)} KB)`);
      manifest[film.slug] = `assets/posters/${film.slug}.jpg`;
    } catch (e) {
      console.log(`FAIL  ${film.slug}: ${e.message}`);
      manifest[film.slug] = null;
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  fs.writeFileSync(
    path.join(POSTERS_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );
  console.log("\nDone. manifest.json written.");
}

main().catch(console.error);
