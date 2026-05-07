/**
 * build-all-district-pages.js
 *
 * korea-regions.json 기반으로 전체 지역/시구 정적 페이지를 생성합니다.
 *
 * 사용법:
 *   node build-all-district-pages.js
 *
 * 출력:
 *   districts/<지역>-<시구>출장마사지.html
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { renderHeroSearchHtml } = require('./hero-search-ssr.js');
const { SITE_ORIGIN } = require('./site.config.js');

const ROOT = __dirname;
const SHOPS_FILE = path.join(ROOT, 'shops.json');
const REGIONS_FILE = path.join(ROOT, 'korea-regions.json');
const OUT_DIR = path.join(ROOT, 'districts');
const SEO_TOPIC_LOGS_DIR = path.join(ROOT, 'seo-topic-logs');
const ASSET_VERSION = '20260320-1';
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseMultiValue(val) {
  return (val || '').split(',').map((s) => s.trim()).filter(Boolean);
}

function normalizeRegionDisplay(region) {
  const r = (region || '').trim();
  if (r.endsWith('도') && r.length >= 2) return r.slice(0, -1);
  return r;
}

function loadShops() {
  const code = fs.readFileSync(SHOPS_FILE, 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  const data = sandbox.window.shopsData;
  if (!data || !Array.isArray(data.shops)) {
    throw new Error('shops.json 형식이 올바르지 않습니다.');
  }
  return data.shops;
}

function loadRegionsDataForDup() {
  const raw = fs.readFileSync(REGIONS_FILE, 'utf8');
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

function loadRegionPairs() {
  const raw = fs.readFileSync(REGIONS_FILE, 'utf8');
  const parsed = JSON.parse(raw);
  const regions = Array.isArray(parsed.regions) ? parsed.regions : [];
  const pairs = [];
  regions.forEach((regionObj) => {
    const region = normalizeRegionDisplay(regionObj.name || '');
    const districts = Array.isArray(regionObj.districts) ? regionObj.districts : [];
    districts.forEach((district) => {
      const d = String(district || '').trim();
      if (region && d) pairs.push({ region, district: d });
    });
  });
  return pairs;
}

/**
 * 시/구 이름 전국 중복 여부에 따라 헤드라인
 * - 중복 없음: "수성" → `수성` (예: 타이틀에서 `수성 출장마사지`)
 * - 중복 있음: `대구 서구`처럼 상위 지역 + 시구
 */
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

function toDistrictAssetUrl(u) {
  const s = String(u || '').trim();
  if (!s) return s;
  if (/^https?:\/\//i.test(s) || /^data:/i.test(s)) return s;
  if (s.startsWith('/')) return `..${s}`;
  if (s.startsWith('../')) return s;
  return `../${s}`;
}

function districtFileName(region, district) {
  return `${region}-${district}출장마사지.html`;
}

function baroDistrictLinkLabel(regionName, districtName, districtDupCounts) {
  const dup = (districtDupCounts.get(districtName) || 0) > 1;
  return dup ? `${regionName}${districtName}출장마사지` : `${districtName}출장마사지`;
}

function getRegionDistrictsFromRaw(koreaRegionsRaw, region) {
  try {
    const parsed = JSON.parse(koreaRegionsRaw);
    const regions = Array.isArray(parsed.regions) ? parsed.regions : [];
    const hit = regions.find(
      (r) => normalizeRegionDisplay(r.name || '') === normalizeRegionDisplay(region)
    );
    return Array.isArray(hit?.districts) ? hit.districts : [];
  } catch (_) {
    return [];
  }
}

function renderDistrictStaticBaroHtml(
  region,
  currentDistrict,
  regionDistricts,
  districtDupCounts
) {
  const regionFile = encodeURI(`../regions/${region}출장마사지.html`);
  const linksFile = encodeURI('../links.html');
  const linksHtml = regionDistricts
    .map((d) => {
      const file = encodeURI(`${region}-${d}출장마사지.html`);
      const href = `../districts/${file}`;
      const label = baroDistrictLinkLabel(region, d, districtDupCounts);
      const cls = d === currentDistrict ? 'static-baro-link is-current' : 'static-baro-link';
      return `<a class="${cls}" href="${href}">${escapeHtml(label)}</a>`;
    })
    .join('');
  return `
      <section id="staticBaroSection" class="static-baro-section" aria-label="바로가기">
        <div class="container static-baro-inner">
          <h2 class="static-baro-title">바로가기</h2>
          <p class="static-baro-lead"><a href="${linksFile}">전국 지역·시군구 목록</a></p>
          <p class="static-baro-lead"><a href="${regionFile}">${escapeHtml(region)}출장마사지</a></p>
          <div class="static-baro-grid">${linksHtml}</div>
        </div>
      </section>`;
}

function listDistrictSeoLogDates(region, district) {
  const logsDir = path.join(SEO_TOPIC_LOGS_DIR, String(region || ''), String(district || ''), 'logs');
  if (!fs.existsSync(logsDir)) return [];
  return fs
    .readdirSync(logsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.html'))
    .map((entry) => entry.name.replace(/\.html$/i, ''))
    .sort((a, b) => String(b).localeCompare(String(a)));
}

/** 프런트 filterShops(지역 우선)과 동일: 시/군 페이지도 카드는 해당 광역 전체 업체를 HTML에 박아 넣음 → 소스 보기·크롤러에 노출 */
function filterShopsByRegion(shops, region) {
  const want = normalizeRegionDisplay(region);
  return shops.filter((shop) => {
    const keys = parseMultiValue(shop.region).map(normalizeRegionDisplay);
    return keys.includes(want);
  });
}

function sortShopsForListing(shops) {
  return [...shops].sort((a, b) => {
    const ah = a.showHealingShop ? 1 : 0;
    const bh = b.showHealingShop ? 1 : 0;
    if (ah !== bh) return bh - ah;
    const ar = typeof a.rating === 'number' ? a.rating : -1;
    const br = typeof b.rating === 'number' ? b.rating : -1;
    if (ar !== br) return br - ar;
    return (b.reviewCount || 0) - (a.reviewCount || 0);
  });
}

function renderShopCardArticle(shop) {
  const imgSrcRaw =
    shop.image ||
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=250&fit=crop&crop=center';
  const imgSrc = toDistrictAssetUrl(imgSrcRaw);
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
                  .map((t) => `<span class="shop-card-tag">${escapeHtml(t)}</span>`)
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
      </article>`;
}

function renderPage({
  region,
  district,
  shops,
  year,
  koreaRegionsRaw,
  districtDupCounts,
}) {
  const filtered = sortShopsForListing(filterShopsByRegion(shops, region));

  const headline = districtPageHeadline(region, district, districtDupCounts);
  const title = `${headline} 출장마사지 20대,30대 | 바로힐링출장마사지`;
  const desc = `${headline} 출장마사지 업체 정보를 모아 비교할 수 있는 정적 페이지입니다.`;
  const canonicalUrl = `${SITE_ORIGIN}/districts/${encodeURI(districtFileName(region, district))}`;
  const heroSearchHtml = renderHeroSearchHtml(shops);
  const regionDistricts = getRegionDistrictsFromRaw(koreaRegionsRaw, region);
  const staticBaroHtml = renderDistrictStaticBaroHtml(
    region,
    district,
    regionDistricts,
    districtDupCounts
  );

  const cardsHtml = filtered.map((shop) => renderShopCardArticle(shop)).join('\n');
  const districtLogDates = listDistrictSeoLogDates(region, district);
  // file:// 환경 클릭 안정성을 위해 한글 경로를 그대로 사용
  const districtLogHref = `../seo-topic-logs/${region}/${district}/index.html`;
  const regionLogHref = `../seo-topic-logs/${region}/index.html`;
  const districtLogItemsHtml = districtLogDates.length
    ? districtLogDates
        .map((d) => {
          const href = `../seo-topic-logs/${region}/${district}/logs/${d}.html`;
          return `<li><a href="${href}">${escapeHtml(d)} ${escapeHtml(headline)} 일자 로그</a></li>`;
        })
        .join('')
    : '<li>등록된 일자 로그가 아직 없습니다.</li>';

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
  </head>
  <body data-page="district-static" data-region="${escapeHtml(region)}" data-district="${escapeHtml(district)}">
    <header class="site-header">
      <div class="container header-inner">
        <a href="../regions/${encodeURI(`${region}출장마사지.html`)}" class="logo">바로힐링출장마사지</a>
        <nav class="main-nav">
          <a href="../regions/${encodeURI(`${region}출장마사지.html`)}" class="nav-link">메인</a>
          <a href="../board.html" class="nav-link">게시판/검색</a>
        </nav>
      </div>
    </header>
    <main class="site-main">
      <div class="home-top">
      <section class="hero">
        <div class="container hero-inner">
          <div class="hero-text">
            <h1>${escapeHtml(headline)} 출장마사지</h1>
            <p>${escapeHtml(headline)} 지역 업체를 비교해 보세요.</p>
          </div>
${heroSearchHtml}
        </div>
      </section>
      <section class="cards-section">
        <div class="container">
          <div class="section-header section-header-bottom">
            <h1 style="margin:0 0 0.5rem;">${escapeHtml(headline)} 출장마사지</h1>
            <p style="margin:0 0 1rem; color:#6b7280;">총 ${escapeHtml(filtered.length)}개 업체</p>
          </div>
          <div
            id="shopCardsContainer"
            class="cards-grid"
            aria-live="polite"
            data-ssr-built-for="${escapeHtml(region)}"
            data-ssr-district="${escapeHtml(district)}"
          >
            ${
              filtered.length
                ? cardsHtml
                : `<p class="no-results">현재 ${escapeHtml(headline)} 출장마사지 업체 정보가 준비중입니다.</p>`
            }
          </div>
          <p id="noResultsMessage" class="no-results" hidden>조건에 맞는 업체가 없습니다.</p>
        </div>
      </section>
      <section class="cards-section">
        <div class="container">
          <div class="section-header section-header-bottom">
            <h2 style="margin:0 0 0.5rem;">${escapeHtml(headline)} 일자 로그</h2>
            <p style="margin:0 0 1rem; color:#6b7280;">
              최신 로그부터 확인하고 날짜를 클릭해 상세 일자 로그로 이동하세요.
            </p>
            <div class="shop-card-tags" style="margin-bottom:0.5rem;">
              <a class="shop-card-tag" href="${districtLogHref}">${escapeHtml(headline)} 로그 허브</a>
              <a class="shop-card-tag" href="${regionLogHref}">${escapeHtml(regionShortForHeadline(region))} 로그 허브</a>
            </div>
            <article>
              <ul style="margin:0.25rem 0 0; padding-left:1.1rem; color:#374151;">
                ${districtLogItemsHtml}
              </ul>
            </article>
          </div>
        </div>
      </section>
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
  const shops = loadShops();
  const pairs = loadRegionPairs();
  const regionsData = loadRegionsDataForDup();
  const districtDupCounts = buildDistrictDuplicateCount(regionsData);
  const koreaRegionsRaw = fs.readFileSync(REGIONS_FILE, 'utf8');
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const year = String(new Date().getFullYear());

  pairs.forEach(({ region, district }) => {
    const html = renderPage({
      region,
      district,
      shops,
      year,
      koreaRegionsRaw,
      districtDupCounts,
    });
    const outPath = path.join(OUT_DIR, districtFileName(region, district));
    fs.writeFileSync(outPath, html, 'utf8');
  });

  console.log(` - 생성 완료: ${pairs.length}개 시/구 페이지`);
}

if (require.main === module) {
  main();
}

