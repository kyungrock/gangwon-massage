/**
 * build-region-pages.js
 *
 * korea-regions.json 기반으로 지역(도/시) 정적 리스트 페이지를 생성합니다.
 *
 * 사용법:
 *   node build-region-pages.js
 *
 * 출력:
 *   regions/<지역>출장마사지.html
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { renderHeroSearchHtml } = require('./hero-search-ssr.js');
const { SITE_ORIGIN } = require('./site.config.js');

const ROOT = __dirname;
const SHOPS_FILE = path.join(ROOT, 'shops.json');
const KOREA_REGIONS_FILE = path.join(ROOT, 'korea-regions.json');
const OUT_DIR = path.join(ROOT, 'regions');
const ASSET_VERSION = '20260319-3';

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseMultiValue(val) {
  return (val || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeRegionDisplay(region) {
  const r = (region || '').trim();
  if (r.endsWith('도') && r.length >= 2) return r.slice(0, -1);
  return r;
}

function isProbablyRemoteUrl(u) {
  const s = String(u || '').trim();
  return /^https?:\/\//i.test(s) || /^data:/i.test(s);
}

function toRegionAssetUrl(u) {
  const s = String(u || '').trim();
  if (!s) return s;
  if (isProbablyRemoteUrl(s)) return s;
  if (s.startsWith('/')) return `..${s}`;
  if (s.startsWith('../')) return s;
  return `../${s}`;
}

function loadShops() {
  const code = fs.readFileSync(SHOPS_FILE, 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  const data = sandbox.window.shopsData;
  if (!data || !Array.isArray(data.shops)) {
    throw new Error('shops.json 형식이 window.shopsData = { shops: [...] } 가 아닙니다.');
  }
  return data.shops;
}

function loadRegionsData() {
  const raw = fs.readFileSync(KOREA_REGIONS_FILE, 'utf8');
  const parsed = JSON.parse(raw);
  const regions = Array.isArray(parsed.regions) ? parsed.regions : [];
  return regions
    .map((r) => ({
      name: normalizeRegionDisplay(r.name || ''),
      districts: Array.isArray(r.districts)
        ? r.districts.map((d) => String(d || '').trim()).filter(Boolean)
        : [],
    }))
    .filter((r) => r.name);
}

function buildDistrictDuplicateCount(regionsData) {
  const counts = new Map();
  regionsData.forEach((r) => {
    r.districts.forEach((d) => {
      counts.set(d, (counts.get(d) || 0) + 1);
    });
  });
  return counts;
}

function regionShortForHeadline(region) {
  const r = String(region || '').trim();
  if (r === '강원') return '강원도';
  return r;
}

function districtPageHeadline(region, district, districtDupCounts) {
  const d = String(district || '').trim();
  const r = regionShortForHeadline(region);
  if (!d) return r;
  if ((districtDupCounts.get(d) || 0) > 1) {
    return r ? `${r} ${d}` : d;
  }
  return d;
}

function buildRegionLogSectionHtml(region, regionDistricts, districtDupCounts) {
  const regionLogRoot = path.join(ROOT, 'seo-topic-logs', region);
  const regionHubPath = path.join(regionLogRoot, 'index.html');
  const hasRegionHub = fs.existsSync(regionHubPath);

  const districtLinks = regionDistricts
    .map((district) => {
      const districtHubPath = path.join(regionLogRoot, district, 'index.html');
      if (!fs.existsSync(districtHubPath)) return '';
      const head = districtPageHeadline(region, district, districtDupCounts);
      return `<li><a href="../seo-topic-logs/${escapeHtml(region)}/${escapeHtml(district)}/index.html">${escapeHtml(head)} 일자 로그 허브</a></li>`;
    })
    .filter(Boolean)
    .join('\n');

  return `
      <section class="cards-section">
        <div class="container">
          <div class="section-header section-header-bottom">
            <h2 style="margin:0 0 0.5rem;">${escapeHtml(regionShortForHeadline(region))} 일자 로그</h2>
            <p style="margin:0 0 1rem; color:#6b7280;">
              지역 로그 허브와 시/구별 일자 로그 허브를 확인할 수 있습니다.
            </p>
            ${
              hasRegionHub
                ? `<div class="shop-card-tags" style="margin-bottom:0.75rem;">
                    <a class="shop-card-tag" href="../seo-topic-logs/${escapeHtml(region)}/index.html">${escapeHtml(regionShortForHeadline(region))} 로그 허브</a>
                  </div>`
                : '<article><p style="margin:0 0 0.75rem;">지역 로그 허브가 준비중입니다.</p></article>'
            }
            ${
              districtLinks
                ? `<article>
                    <ul style="margin:0.25rem 0 0; padding-left:1.1rem; color:#374151;">
                      ${districtLinks}
                    </ul>
                  </article>`
                : '<article><p style="margin:0;">등록된 시/구 로그가 준비중입니다.</p></article>'
            }
          </div>
        </div>
      </section>
  `;
}

function formatLocationDisplay(shop) {
  const region = parseMultiValue(shop.region).map(normalizeRegionDisplay).join(' ');
  const district = parseMultiValue(shop.district).join(' ');
  const dong = parseMultiValue(shop.dong).join(' ');
  return [region, district, dong].filter(Boolean).join(' ');
}

function formatPrice(price) {
  return price || '가격 문의';
}

function shopPhoneDigitsForTel(phone) {
  return String(phone || '').replace(/[^\d]/g, '');
}

function shopCardPriceRowHtml(shop) {
  const priceStr = escapeHtml(formatPrice(shop.price));
  const phoneRaw = String(shop.phone || '').trim();
  const digits = shopPhoneDigitsForTel(phoneRaw);
  if (!phoneRaw) {
    return `<div class="shop-card-price-row"><div class="shop-card-price">${priceStr}</div></div>`;
  }
  const dt = digits ? ` data-tel="${escapeHtml(digits)}"` : '';
  return `<div class="shop-card-price-row"><div class="shop-card-price">${priceStr}</div><span class="shop-card-phone"${dt}>📞 ${escapeHtml(phoneRaw)}</span></div>`;
}

function parseFirst(val) {
  return String(val || '').split(',')[0].trim();
}

function staticDetailPath(shop) {
  const region = parseFirst(shop.region);
  const district = parseFirst(shop.district);
  const name = String(shop.name || '').trim();
  const base = [region, district, name, '출장마사지']
    .filter(Boolean)
    .join('-')
    .replace(/\s+/g, '-');
  const slug = base || String(shop.id || shop.name || 'detail');
  return `shops/${slug}.html`;
}

function baroDistrictLinkLabel(regionName, districtName, districtDupCounts) {
  const dup = (districtDupCounts.get(districtName) || 0) > 1;
  return dup ? `${regionName}${districtName}출장마사지` : `${districtName}출장마사지`;
}

function renderRegionStaticBaroHtml(region, districts, districtDupCounts) {
  const linksFile = encodeURI('../links.html');
  const linksHtml = districts
    .map((d) => {
      const file = encodeURI(`${region}-${d}출장마사지.html`);
      const href = `../districts/${file}`;
      const label = baroDistrictLinkLabel(region, d, districtDupCounts);
      return `<a class="static-baro-link" href="${href}">${escapeHtml(label)}</a>`;
    })
    .join('');
  return `
      <section id="staticBaroSection" class="static-baro-section" aria-label="바로가기">
        <div class="container static-baro-inner">
          <h2 class="static-baro-title">바로가기</h2>
          <p class="static-baro-lead"><a href="${linksFile}">전국 지역·시군구 목록</a></p>
          <p class="static-baro-sub">${escapeHtml(region)} 시·군·구</p>
          <div class="static-baro-grid">${linksHtml}</div>
        </div>
      </section>`;
}

function buildRegionJsonLd({ region, filtered, canonicalUrl }) {
  const items = filtered.map((shop, idx) => {
    const url = `${SITE_ORIGIN}/${encodeURI(staticDetailPath(shop))}`;
    return {
      '@type': 'ListItem',
      position: idx + 1,
      url,
      item: {
        '@type': 'LocalBusiness',
        name: shop.name || '출장마사지 업체',
        telephone: shop.phone || undefined,
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'KR',
          addressRegion: shop.region || region,
          addressLocality: shop.district || undefined,
          streetAddress: shop.address || undefined,
        },
      },
    };
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${region} 출장마사지`,
    url: canonicalUrl,
    about: `${region} 출장마사지`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: items,
    },
  };
}

function renderRegionPage({
  region,
  regionDistricts,
  shops,
  year,
  koreaRegionsRaw,
  districtDupCounts,
}) {
  const regionFile = `${region}출장마사지.html`;
  const filtered = shops
    .filter((shop) => {
      const regionKeys = parseMultiValue(shop.region).map(normalizeRegionDisplay);
      return regionKeys.includes(region);
    })
    .sort((a, b) => {
      const ah = a.showHealingShop ? 1 : 0;
      const bh = b.showHealingShop ? 1 : 0;
      if (ah !== bh) return bh - ah;

      const ar = typeof a.rating === 'number' ? a.rating : -1;
      const br = typeof b.rating === 'number' ? b.rating : -1;
      if (ar !== br) return br - ar;

      return (b.reviewCount || 0) - (a.reviewCount || 0);
    });

  const heroSearchHtml = renderHeroSearchHtml(shops);
  const title = `${region} 출장마사지 | 바로힐링출장마사지`;
  const desc = `${region} 전체 시/구 출장마사지 업체를 한눈에 비교하고 원하는 지역으로 바로 이동하세요.`;
  const canonicalUrl = `${SITE_ORIGIN}/regions/${encodeURI(regionFile)}`;
  const ld = buildRegionJsonLd({ region, filtered, canonicalUrl });

  const cardsHtml = filtered
    .map((shop) => {
      const imgSrcRaw =
        shop.image ||
        'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=250&fit=crop&crop=center';
      const imgSrc = toRegionAssetUrl(imgSrcRaw);
      const alt = shop.alt || `${shop.name || ''} 마사지샵`;
      const location = formatLocationDisplay(shop);
      const greeting = shop.greeting || shop.description || '';
      const tags = Array.isArray(shop.services) ? shop.services.slice(0, 3) : [];
      const rating =
        shop.rating || shop.rating === 0 ? shop.rating.toFixed(1) : null;
      const reviewCount = shop.reviewCount || 0;
      const detailUrl = `../${encodeURI(staticDetailPath(shop))}`;
      const name = shop.name || '출장마사지 업체';

      return `
      <article class="shop-card">
        <a href="${detailUrl}" aria-label="${escapeHtml(name)} 상세보기">
          <div class="shop-card-image">
            <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(alt)}" loading="lazy" />
            ${
              shop.showHealingShop
                ? `
            <div class="shop-card-badge">
              <span class="shop-card-badge-dot"></span>
              추천 힐링샵
            </div>
          `
                : ''
            }
          </div>
          <div class="shop-card-body">
            <div class="shop-card-header">
              <h2 class="shop-card-title">${escapeHtml(name)}</h2>
              ${
                rating
                  ? `<div class="shop-card-rating">★ ${escapeHtml(rating)} <span>(${escapeHtml(String(reviewCount))})</span></div>`
                  : ''
              }
            </div>
            <div class="shop-card-meta">
              ${
                location
                  ? `<span>📍 <span>${escapeHtml(location)}</span></span>`
                  : ''
              }
              ${
                shop.operatingHours
                  ? `<span>⏱ <span>${escapeHtml(shop.operatingHours)}</span></span>`
                  : ''
              }
            </div>
            ${shopCardPriceRowHtml(shop)}
            ${
              greeting
                ? `<p class="shop-card-greeting">${escapeHtml(greeting)}</p>`
                : ''
            }
            ${
              tags.length
                ? `
              <div class="shop-card-tags">
                ${tags
                  .map(
                    (t) =>
                      `<span class="shop-card-tag">${escapeHtml(t)}</span>`
                  )
                  .join('')}
              </div>
            `
                : ''
            }
            <div class="shop-card-footer">
              <span class="shop-card-link">
                상세 보기
                <span>↗</span>
              </span>
            </div>
          </div>
        </a>
      </article>
    `;
    })
    .join('\n');

  const districtLinks = regionDistricts
    .map((district) => {
      const head = districtPageHeadline(region, district, districtDupCounts);
      return `<a class="shop-card-tag" href="../districts/${encodeURI(`${region}-${district}출장마사지.html`)}">${escapeHtml(head)} 출장마사지</a>`;
    })
    .join('\n');
  const staticBaroHtml = renderRegionStaticBaroHtml(
    region,
    regionDistricts,
    districtDupCounts
  );
  const regionLogSectionHtml = buildRegionLogSectionHtml(
    region,
    regionDistricts,
    districtDupCounts
  );

  return `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(desc)}" />
    <meta name="naver-site-verification" content="29346f2ace289a79948fb843d72189460cd7664c" />
    <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="ko_KR" />
    <meta property="og:site_name" content="바로힐링출장마사지" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(desc)}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(desc)}" />
    <link rel="stylesheet" href="../styles.css?v=${ASSET_VERSION}" />
    <script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
    </script>
  </head>
  <body data-page="region-static" data-region="${escapeHtml(region)}">
    <header class="site-header">
      <div class="container header-inner">
        <a href="../regions/${encodeURI(regionFile)}" class="logo">바로힐링출장마사지</a>
        <nav class="main-nav">
          <a href="../regions/${encodeURI(regionFile)}" class="nav-link is-active">메인</a>
          <a href="../board.html" class="nav-link">게시판/검색</a>
        </nav>
      </div>
    </header>

    <main class="site-main">
      <div class="home-top">
      <section class="hero">
        <div class="container hero-inner">
          <div class="hero-text">
            <h1>${escapeHtml(region)} 출장마사지 전체 검색</h1>
            <p>
              ${escapeHtml(region)} 전체 시/구 출장마사지 업체를 한 번에 비교하고,
              원하는 시/군 정적 페이지로 바로 이동할 수 있습니다.
            </p>
          </div>
${heroSearchHtml}
        </div>
      </section>

      <section class="cards-section">
        <div class="container">
          <div class="section-header section-header-bottom">
            <h1 style="margin:0 0 0.5rem;">${escapeHtml(region)} 출장마사지</h1>
            <p class="section-subtitle" style="margin:0 0 1rem;">
              ${escapeHtml(region)} 전체 업체를 지역(시/구) 기준으로 비교할 수 있습니다.
            </p>
            <p style="margin:0 0 1rem; color:#6b7280;">
              총 ${escapeHtml(filtered.length)}개 업체
            </p>
            <div class="shop-card-tags" style="margin-bottom:1rem;">
              ${districtLinks}
            </div>
          </div>

          <div
            id="shopCardsContainer"
            class="cards-grid"
            data-ssr-built-for="${escapeHtml(region)}"
            aria-live="polite"
          >
            ${
              filtered.length
                ? cardsHtml
                : `<p class="no-results">현재 ${escapeHtml(region)} 지역 업체 정보가 준비중입니다.</p>`
            }
          </div>
          <p id="noResultsMessage" class="no-results" hidden>
            조건에 맞는 업체가 없습니다. 필터를 다시 선택해보세요.
          </p>
        </div>
      </section>
      ${regionLogSectionHtml}
      </div>
      ${staticBaroHtml}
    </main>

    <footer class="site-footer">
      <div class="container footer-inner">
        <p>© ${escapeHtml(year)} 바로힐링출장마사지. All rights reserved.</p>
        <a href="../robots.txt" class="footer-link">robots.txt</a>
        <a href="../sitemap.xml" class="footer-link">sitemap.xml</a>
      </div>
    </footer>

    <script src="../shops.json"></script>
    <script src="../shop-card-data.js"></script>
    <script>
      // file://에서도 동작하도록 korea-regions 데이터를 inline으로 주입
      window.koreaRegionsData = ${koreaRegionsRaw};
    </script>
    <script src="../app.js"></script>
  </body>
</html>`;
}

function main() {
  console.log('▶ region 정적 페이지 생성 시작');
  const shops = loadShops();
  const regionsData = loadRegionsData();
  const districtDupCounts = buildDistrictDuplicateCount(regionsData);
  const koreaRegionsRaw = fs.readFileSync(KOREA_REGIONS_FILE, 'utf8');
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const year = String(new Date().getFullYear());
  regionsData.forEach((regionItem) => {
    const region = regionItem.name;
    const html = renderRegionPage({
      region,
      regionDistricts: regionItem.districts,
      shops,
      year,
      koreaRegionsRaw,
      districtDupCounts,
    });
    const outPath = path.join(OUT_DIR, `${region}출장마사지.html`);
    fs.writeFileSync(outPath, html, 'utf8');
  });

  console.log(` - 생성 완료: ${regionsData.length}개 페이지 (${OUT_DIR})`);
}

if (require.main === module) {
  main();
}

