/**
 * korea-regions.json 기준으로 전체 지역·시·군·구 정적 페이지 바로가기 links.html 생성
 * 사용: node build-links-page.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const KOREA = path.join(ROOT, 'korea-regions.json');
const OUT = path.join(ROOT, 'links.html');

/** 여러 시·도에 같은 이름이 있을 때만 지역명을 붙여 표기 (예: 서울중구출장마사지) */
const AMBIGUOUS_DISTRICT = new Set([
  '중구',
  '서구',
  '남구',
  '북구',
  '동구',
  '강서구',
]);

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function districtLinkText(regionName, districtName) {
  if (AMBIGUOUS_DISTRICT.has(districtName)) {
    return `${regionName}${districtName}출장마사지`;
  }
  return `${districtName}출장마사지`;
}

function districtFileName(regionName, districtName) {
  return `${regionName}-${districtName}출장마사지.html`;
}

function main() {
  const raw = fs.readFileSync(KOREA, 'utf8');
  const data = JSON.parse(raw);
  const regions = data.regions || [];

  const tocItems = regions
    .map((r, i) => {
      const id = `links-region-${i}`;
      return `<a class="links-toc-item" href="#${id}">${escapeHtml(r.name)}</a>`;
    })
    .join('\n');

  const sections = regions
    .map((r, i) => {
      const rn = r.name;
      const id = `links-region-${i}`;
      const regionFile = `${rn}출장마사지.html`;
      const regionHref = encodeURI(`regions/${regionFile}`);

      const regionLi = `            <li><a href="${regionHref}">${escapeHtml(rn)}출장마사지</a></li>`;
      const districtItems = (r.districts || []).map((d) => {
        const file = districtFileName(rn, d);
        const href = encodeURI(`districts/${file}`);
        const text = districtLinkText(rn, d);
        return `            <li><a href="${href}">${escapeHtml(text)}</a></li>`;
      });

      const allLis = [regionLi, ...districtItems].join('\n');
      const districtBlock =
        districtItems.length > 0
          ? `<ul class="links-grid">\n${allLis}\n          </ul>`
          : `<ul class="links-grid">\n${regionLi}\n          </ul>`;

      return `      <section class="links-region-block" id="${id}" aria-labelledby="links-h-${i}">
        <h2 class="links-region-title" id="links-h-${i}">
          <a href="${regionHref}">${escapeHtml(rn)}</a>
        </h2>
        <p class="links-region-lead">
          <a class="links-region-main" href="${regionHref}">${escapeHtml(rn)}출장마사지</a>
          <span class="links-sep">·</span>
          <span>시·군·구 바로가기</span>
        </p>
${districtBlock}
      </section>`;
    })
    .join('\n\n');

  const html = `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>바로가기 | 전국 출장마사지 지역·시군구 링크 | 바로힐링출장마사지</title>
    <meta
      name="description"
      content="서울·경기·인천 등 전국 광역시도 및 시·군·구별 출장마사지 정적 페이지 바로가기 모음입니다."
    />
    <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1" />
    <link rel="canonical" href="https://outcallmassage.co.kr/links.html" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="ko_KR" />
    <meta property="og:site_name" content="바로힐링출장마사지" />
    <meta property="og:title" content="바로가기 | 전국 출장마사지 지역·시군구 링크 | 바로힐링출장마사지" />
    <meta
      property="og:description"
      content="서울·경기·인천 등 전국 광역시도 및 시·군·구별 출장마사지 정적 페이지 바로가기 모음입니다."
    />
    <meta property="og:url" content="https://outcallmassage.co.kr/links.html" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="바로가기 | 전국 출장마사지 지역·시군구 링크 | 바로힐링출장마사지" />
    <meta
      name="twitter:description"
      content="서울·경기·인천 등 전국 광역시도 및 시·군·구별 출장마사지 정적 페이지 바로가기 모음입니다."
    />
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body data-page="links">
    <header class="site-header">
      <div class="container header-inner">
        <a href="index.html?region=강원" class="logo">바로힐링출장마사지</a>
        <nav class="main-nav">
          <a href="index.html?region=강원" class="nav-link">메인</a>
          <a href="links.html" class="nav-link is-active">바로가기</a>
          <a href="board.html" class="nav-link">게시판/검색</a>
        </nav>
      </div>
    </header>

    <main class="site-main">
      <section class="links-page-hero">
        <div class="container">
          <h1 class="links-page-title">바로가기</h1>
          <p class="links-page-desc">
            <strong>지역(광역)</strong> 전체 페이지와 <strong>시·군·구</strong>별 정적 페이지로 바로 이동합니다.
            링크는 <code>korea-regions.json</code> 기준으로 생성됩니다.
          </p>
          <nav class="links-toc" aria-label="광역시도 목차">
${tocItems}
          </nav>
        </div>
      </section>

      <div class="container links-page-body">
${sections}
      </div>
    </main>

    <footer class="site-footer">
      <div class="container footer-inner">
        <p>© <span id="currentYear"></span> 바로힐링출장마사지. All rights reserved.</p>
        <a href="robots.txt" class="footer-link">robots.txt</a>
        <a href="sitemap.xml" class="footer-link">sitemap.xml</a>
      </div>
    </footer>
    <script>
      document.getElementById('currentYear').textContent = String(new Date().getFullYear());
    </script>
  </body>
</html>
`;

  fs.writeFileSync(OUT, html, 'utf8');
  console.log('✓ wrote', path.relative(ROOT, OUT));
}

main();
