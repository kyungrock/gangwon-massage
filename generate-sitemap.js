/**
 * generate-sitemap.js
 *
 * sitemap.xml 자동 생성
 * - index.html, board.html, regions/*, districts/* (정적 리스트)
 * - detail.html?id=업체ID (실제 서비스와 동일한 동적 상세 URL)
 *
 * shops/*.html 정적 상세는 배포하지 않는 경우가 많아 sitemap에 넣지 않습니다.
 *
 * 사용법:
 *   node generate-sitemap.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { SITE_ORIGIN } = require('./site.config.js');

const BASE_URL = SITE_ORIGIN;

const ROOT_DIR = __dirname;
const SHOPS_FILE = path.join(ROOT_DIR, 'shops.json');
const KOREA_REGIONS_FILE = path.join(ROOT_DIR, 'korea-regions.json');
const SITEMAP_FILE = path.join(ROOT_DIR, 'sitemap.xml');

function loadShopsFromScriptFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  const data = sandbox.window.shopsData;
  if (!data || !Array.isArray(data.shops)) {
    throw new Error('shops.json 형식이 window.shopsData = { shops: [...] } 가 아닙니다.');
  }
  return data.shops;
}

function loadRegionsFromJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!parsed || !Array.isArray(parsed.regions)) return [];
  return parsed.regions
    .map((r) => ({
      name: String((r && r.name) || '').trim(),
      districts: Array.isArray(r && r.districts) ? r.districts : [],
    }))
    .filter((r) => r.name)
    .map((r) => ({
      name: r.name.endsWith('도') ? r.name.slice(0, -1) : r.name,
      districts: r.districts.map((d) => String(d || '').trim()).filter(Boolean),
    }));
}

function escapeXmlLoc(url) {
  return String(url || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildSitemapXml(urls) {
  const now = new Date().toISOString();
  const lines = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  );

  urls.forEach((url) => {
    lines.push('  <url>');
    lines.push(`    <loc>${escapeXmlLoc(url)}</loc>`);
    lines.push(`    <lastmod>${now}</lastmod>`);
    lines.push('    <changefreq>daily</changefreq>');
    lines.push('    <priority>0.8</priority>');
    lines.push('  </url>');
  });

  lines.push('</urlset>');
  return lines.join('\n');
}

function main() {
  console.log('▶ sitemap.xml 생성 시작');
  console.log(` - BASE_URL: ${BASE_URL}`);

  const shops = loadShopsFromScriptFile(SHOPS_FILE);

  const urls = new Set();
  urls.add(`${BASE_URL}/`);
  urls.add(`${BASE_URL}/index.html`);
  urls.add(`${BASE_URL}/board.html`);
  const regions = loadRegionsFromJson(KOREA_REGIONS_FILE);
  regions.forEach((regionObj) => {
    urls.add(`${BASE_URL}/${encodeURI(`regions/${regionObj.name}출장마사지.html`)}`);
    regionObj.districts.forEach((district) => {
      urls.add(
        `${BASE_URL}/${encodeURI(`districts/${regionObj.name}-${district}출장마사지.html`)}`
      );
    });
  });

  shops.forEach((shop) => {
    const id = shop.id || shop.name;
    if (!id) return;
    const encoded = encodeURIComponent(String(id));
    urls.add(`${BASE_URL}/detail.html?id=${encoded}`);
  });

  // URL 정렬(가독성/변경 diff 최소화)
  const sorted = Array.from(urls).sort((a, b) => String(a).localeCompare(String(b)));
  const xml = buildSitemapXml(sorted);
  fs.writeFileSync(SITEMAP_FILE, xml, 'utf8');

  console.log(` - sitemap.xml 생성 완료: ${SITEMAP_FILE}`);
  console.log(` - 총 URL 수: ${urls.size}`);
}

if (require.main === module) {
  main();
}

