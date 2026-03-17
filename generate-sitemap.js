/**
 * generate-sitemap.js
 *
 * shops.json (window.shopsData = { shops: [...] })에서 업체 ID를 읽어
 * index.html, board.html, detail.html?id=업체ID 형태의 URL을 sitemap.xml에 자동으로 기록합니다.
 *
 * 사용법:
 *   1) Node.js 18+ 설치
 *   2) 프로젝트 루트(이 파일이 있는 폴더)에서:
 *        node generate-sitemap.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// GitHub Pages / 실제 도메인에 맞게 수정하세요.
// 예: https://your-username.github.io/gangwon-massage
const BASE_URL = 'https://example.com';

const ROOT_DIR = __dirname;
const SHOPS_FILE = path.join(ROOT_DIR, 'shops.json');
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

function buildSitemapXml(urls) {
  const now = new Date().toISOString();
  const lines = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  );

  urls.forEach((url) => {
    lines.push('  <url>');
    lines.push(`    <loc>${url}</loc>`);
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

  shops.forEach((shop) => {
    const id = shop.id || shop.name;
    if (!id) return;
    const encoded = encodeURIComponent(String(id));
    urls.add(`${BASE_URL}/detail.html?id=${encoded}`);
  });

  const xml = buildSitemapXml(Array.from(urls));
  fs.writeFileSync(SITEMAP_FILE, xml, 'utf8');

  console.log(` - sitemap.xml 생성 완료: ${SITEMAP_FILE}`);
  console.log(` - 총 URL 수: ${urls.size}`);
}

if (require.main === module) {
  main();
}

