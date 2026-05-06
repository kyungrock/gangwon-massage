/**
 * generate-sitemap.js
 *
 * sitemap.xml 자동 생성
 * - 정적 HTML 파일 전체 기준
 *   roots + regions/* + districts/* + shops/*
 *
 * 사용법:
 *   node generate-sitemap.js
 */

const fs = require('fs');
const path = require('path');
const { SITE_ORIGIN } = require('./site.config.js');

const BASE_URL = SITE_ORIGIN;

const ROOT_DIR = __dirname;
const SITEMAP_FILE = path.join(ROOT_DIR, 'sitemap.xml');

function toSiteUrlFromRelPath(relPath) {
  const normalized = String(relPath || '').replace(/\\/g, '/');
  const encodedPath = normalized
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/');
  return `${BASE_URL}/${encodedPath}`;
}

function collectHtmlRelativePaths() {
  const relPaths = new Set();
  function collectHtmlRecursively(baseDir, relPrefix = '') {
    fs.readdirSync(baseDir, { withFileTypes: true }).forEach((entry) => {
      const entryRel = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;
      const entryPath = path.join(baseDir, entry.name);
      if (entry.isDirectory()) {
        collectHtmlRecursively(entryPath, entryRel);
        return;
      }
      if (!entry.isFile()) return;
      if (!entry.name.toLowerCase().endsWith('.html')) return;
      relPaths.add(entryRel);
    });
  }

  // roots: 루트 *.html 전부 포함
  fs.readdirSync(ROOT_DIR, { withFileTypes: true }).forEach((entry) => {
    if (!entry.isFile()) return;
    if (!entry.name.toLowerCase().endsWith('.html')) return;
    relPaths.add(entry.name);
  });

  // 정적 디렉터리 HTML 전부 포함
  ['regions', 'districts', 'shops'].forEach((dirName) => {
    const dirPath = path.join(ROOT_DIR, dirName);
    if (!fs.existsSync(dirPath)) return;
    collectHtmlRecursively(dirPath, dirName);
  });

  // 계층형 SEO 로그 허브 전체 포함
  const seoLogsDir = path.join(ROOT_DIR, 'seo-topic-logs');
  if (fs.existsSync(seoLogsDir)) {
    collectHtmlRecursively(seoLogsDir, 'seo-topic-logs');
  }

  return relPaths;
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

  const relPaths = collectHtmlRelativePaths();
  const urls = new Set();
  urls.add(`${BASE_URL}/`);
  relPaths.forEach((relPath) => {
    urls.add(toSiteUrlFromRelPath(relPath));
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

