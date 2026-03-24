/**
 * build-detail-pages.js
 *
 * shops.json의 window.shopsData.shops를 기반으로
 * 업체별 정적 상세페이지(1:1 HTML)를 생성합니다.
 *
 * 사용법:
 *   1) Node.js 18+ 설치
 *   2) 프로젝트 루트(이 파일이 있는 폴더)에서:
 *        node build-detail-pages.js
 *   3) 생성된 shops/*.html 파일을 함께 GitHub Pages에 올립니다.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { SITE_ORIGIN } = require('./site.config.js');

const ROOT = __dirname;
const SHOPS_FILE = path.join(ROOT, 'shops.json');
const KOREA_REGIONS_FILE = path.join(ROOT, 'korea-regions.json');
const OUT_DIR = path.join(ROOT, 'shops');

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

function parseFirst(val) {
  if (!val) return '';
  return String(val).split(',')[0].trim();
}

function normalizeRegionDisplay(region) {
  const r = String(region || '').trim();
  if (r.endsWith('도') && r.length >= 2) return r.slice(0, -1);
  return r;
}

function loadRegionsData(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
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

function regionAliases(region) {
  const base = normalizeRegionDisplay(region);
  const aliases = new Set([base]);
  aliases.add(`${base}도`);
  aliases.add(`${base}시`);
  if (base === '서울') aliases.add('서울특별시');
  if (base === '부산') aliases.add('부산광역시');
  if (base === '대구') aliases.add('대구광역시');
  if (base === '인천') aliases.add('인천광역시');
  if (base === '광주') aliases.add('광주광역시');
  if (base === '대전') aliases.add('대전광역시');
  if (base === '울산') aliases.add('울산광역시');
  if (base === '세종') aliases.add('세종특별자치시');
  if (base === '제주') aliases.add('제주특별자치도');
  return Array.from(aliases);
}

function detectRegionsFromShopText(shop, regionsData) {
  const text = [
    shop.region,
    shop.address,
    shop.detailAddress,
    shop.description,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const detected = [];
  regionsData.forEach((r) => {
    const hit = regionAliases(r.name).some((alias) =>
      text.includes(String(alias || '').toLowerCase())
    );
    if (hit) detected.push(r.name);
  });

  // 텍스트 감지 실패 시 shop.region 1순위 fallback
  if (!detected.length) {
    String(shop.region || '')
      .split(',')
      .map((s) => normalizeRegionDisplay(s))
      .filter(Boolean)
      .forEach((r) => {
        if (regionsData.some((x) => x.name === r)) detected.push(r);
      });
  }
  return Array.from(new Set(detected));
}

function baroDistrictLinkLabel(regionName, districtName, districtDupCounts) {
  const dup = (districtDupCounts.get(districtName) || 0) > 1;
  return dup ? `${regionName}${districtName}출장마사지` : `${districtName}출장마사지`;
}

function renderDetailBaroHtml(shop, regionsData, districtDupCounts) {
  const detectedRegions = detectRegionsFromShopText(shop, regionsData);
  if (!detectedRegions.length) return '';

  const groupsHtml = detectedRegions
    .map((regionName) => {
      const regionEntry = regionsData.find((r) => r.name === regionName);
      if (!regionEntry) return '';
      const regionHref = `../regions/${encodeURI(`${regionName}출장마사지.html`)}`;
      const districtLinks = regionEntry.districts
        .map((district) => {
          const href = `../districts/${encodeURI(`${regionName}-${district}출장마사지.html`)}`;
          const label = baroDistrictLinkLabel(regionName, district, districtDupCounts);
          return `<a class="static-baro-link" href="${href}">${escapeHtml(label)}</a>`;
        })
        .join('');
      return `
        <div class="static-baro-group">
          <p class="static-baro-lead"><a href="${regionHref}">${escapeHtml(regionName)}출장마사지</a></p>
          <div class="static-baro-grid">${districtLinks}</div>
        </div>`;
    })
    .join('');

  if (!groupsHtml.trim()) return '';

  return `
      <section id="staticBaroSection" class="static-baro-section" aria-label="바로가기">
        <div class="container static-baro-inner">
          <h2 class="static-baro-title">바로가기</h2>
          <p class="static-baro-lead"><a href="../links.html">전국 지역·시군구 목록</a></p>
          ${groupsHtml}
        </div>
      </section>`;
}

function slugify(shop) {
  if (shop.slug) return decodeURIComponent(String(shop.slug));
  const region = parseFirst(shop.region);
  const district = parseFirst(shop.district);
  const name = (shop.name || '').trim();
  const base = [region, district, name, '출장마사지']
    .filter(Boolean)
    .join('-')
    .replace(/\s+/g, '-');
  return base || String(shop.id || shop.name || 'detail');
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toDetailAssetUrl(u) {
  const s = String(u || '').trim();
  if (!s) return s;
  if (/^https?:\/\//i.test(s) || /^data:/i.test(s)) return s;
  if (s.startsWith('/')) return `..${s}`;
  if (s.startsWith('../')) return s;
  return `../${s}`;
}

function renderDetailHtml(shop, slug, regionsData, districtDupCounts) {
  const regionFirst = parseFirst(shop.region);
  const districtFirst = parseFirst(shop.district);
  const baseName = shop.name || '출장마사지 업체';

  const titlePrefix = [regionFirst, districtFirst, baseName]
    .filter(Boolean)
    .join(' ')
    .concat(' 출장마사지');

  const title = `${titlePrefix} | 바로힐링출장마사지`;

  const descBase =
    (shop.description || '').trim() ||
    `${regionFirst || ''} ${districtFirst || ''} 지역에서 이용할 수 있는 ${baseName} 바로힐링출장마사지 정보입니다.`;

  const desc = `${regionFirst || ''} ${districtFirst || ''} 바로힐링출장마사지 ${baseName} 안내 – ${descBase}`.slice(
    0,
    160
  );

  const location = [shop.region, shop.district, shop.dong]
    .filter(Boolean)
    .join(' ');

  const image = toDetailAssetUrl(
    shop.image ||
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=500&fit=crop&crop=center'
  );

  const services = Array.isArray(shop.services) ? shop.services : [];
  const features = Array.isArray(shop.features) ? shop.features : [];
  const courses = Array.isArray(shop.courses) ? shop.courses : [];
  const reviews = Array.isArray(shop.reviews) ? shop.reviews : [];
  const rating = typeof shop.rating === 'number' ? shop.rating : null;
  const reviewCount = typeof shop.reviewCount === 'number' ? shop.reviewCount : reviews.length || null;
  const detailBaroHtml = renderDetailBaroHtml(shop, regionsData, districtDupCounts);

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: baseName,
    url: `${SITE_ORIGIN}/shops/${slug}.html`,
    image,
    telephone: shop.phone || undefined,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'KR',
      addressRegion: regionFirst || shop.region || undefined,
      addressLocality: districtFirst || shop.district || undefined,
      streetAddress: shop.address || undefined,
    },
    geo:
      shop.coordinates && typeof shop.coordinates.latitude === 'number'
        ? {
            '@type': 'GeoCoordinates',
            latitude: shop.coordinates.latitude,
            longitude: shop.coordinates.longitude,
          }
        : undefined,
    openingHoursSpecification: shop.operatingHours
      ? [
          {
            '@type': 'OpeningHoursSpecification',
            description: shop.operatingHours,
          },
        ]
      : undefined,
    aggregateRating:
      rating && reviewCount
        ? {
            '@type': 'AggregateRating',
            ratingValue: rating,
            reviewCount,
          }
        : undefined,
    review: reviews.length
      ? reviews.map((rev) => ({
          '@type': 'Review',
          author: rev.name || rev.author || '익명',
          datePublished: rev.date || undefined,
          reviewBody: rev.comment || rev.review || '',
          reviewRating:
            typeof rev.rating === 'number'
              ? {
                  '@type': 'Rating',
                  ratingValue: rev.rating,
                }
              : undefined,
        }))
      : undefined,
  };

  return `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(desc)}" />
    <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1" />
    <link rel="canonical" href="${SITE_ORIGIN}/shops/${slug}.html" />
    <meta property="og:type" content="article" />
    <meta property="og:locale" content="ko_KR" />
    <meta property="og:site_name" content="바로힐링출장마사지" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(desc)}" />
    <meta property="og:url" content="${SITE_ORIGIN}/shops/${slug}.html" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(desc)}" />
    <link rel="stylesheet" href="../styles.css" />
    <script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
    </script>
  </head>
  <body data-page="detail-static">
    <header class="site-header">
      <div class="container header-inner">
        <a href="../index.html?region=강원" class="logo">바로힐링출장마사지</a>
        <nav class="main-nav">
          <a href="../index.html?region=강원" class="nav-link">메인</a>
          <a href="../board.html" class="nav-link">게시판/검색</a>
        </nav>
      </div>
    </header>

    <main class="site-main">
      <article class="detail-article">
        <div class="container">
          <a href="../board.html" class="detail-back-link">
            <span>←</span>
            리스트로 돌아가기
          </a>
          <header class="detail-header">
            <div class="detail-main">
              <h1 class="detail-title">${escapeHtml(shop.name || '출장마사지 업체')}</h1>
              <div class="detail-meta">
                ${location ? `<span>${escapeHtml(location)}</span>` : ''}
                ${shop.price ? `<span>${escapeHtml(shop.price)}</span>` : ''}
              </div>
              <div class="detail-image-wrapper">
                <img src="${escapeHtml(image)}" alt="${escapeHtml(
                  shop.name || '출장마사지 업체'
                )}" loading="lazy" />
              </div>
              <section class="detail-section">
                <h2>업체 기본 정보</h2>
                <p class="detail-description">
                  ${escapeHtml(shop.description || '')}
                </p>
                <div class="detail-badges">
                  ${services
                    .map((s) => `<span class="detail-badge">${escapeHtml(s)}</span>`)
                    .join('')}
                  ${features
                    .map((f) => `<span class="detail-badge">${escapeHtml(f)}</span>`)
                    .join('')}
                </div>
              </section>

              <section class="detail-section">
                <h2>주소 · 연락처 · 영업시간</h2>
                <div class="detail-aside-row">
                  <span class="detail-aside-label">주소</span>
                  <span>
                    ${escapeHtml(shop.address || '')}
                    ${shop.detailAddress ? '<br />' + escapeHtml(shop.detailAddress) : ''}
                  </span>
                </div>
                ${shop.phone ? `<div class="detail-aside-row">
                  <span class="detail-aside-label">전화</span>
                  <span>${escapeHtml(shop.phone)}</span>
                </div>` : ''}
                ${shop.operatingHours ? `<div class="detail-aside-row">
                  <span class="detail-aside-label">영업시간</span>
                  <span>${escapeHtml(shop.operatingHours)}</span>
                </div>` : ''}
              </section>

              ${courses.length ? `<section class="detail-section">
                <h2>코스 및 가격</h2>
                <div class="detail-courses">
                  ${courses
                    .map((course) => {
                      const items = Array.isArray(course.items) ? course.items : [];
                      return `<div class="detail-course-card">
                        <div class="detail-course-title">${escapeHtml(
                          course.category || '프로그램'
                        )}</div>
                        <div class="detail-course-head" aria-hidden="true">
                          <span>코스</span>
                          <span>시간</span>
                          <span>가격</span>
                        </div>
                        ${items
                          .map((item) => {
                            const name = escapeHtml(item.name || '');
                            const duration = item.duration ? escapeHtml(item.duration) : '';
                            const price = item.price ? escapeHtml(item.price) : '';
                            const desc =
                              item.description && item.description.trim()
                                ? escapeHtml(item.description)
                                : '';
                            return `<div class="detail-course-item">
                              <div class="detail-course-main">
                                <span class="detail-course-name">${name}</span>
                                <span class="detail-course-time">${duration}</span>
                                <span class="detail-course-price">${price}</span>
                              </div>
                              ${
                                desc
                                  ? `<div class="detail-course-desc">${desc}</div>`
                                  : ''
                              }
                            </div>`;
                          })
                          .join('')}
                      </div>`;
                    })
                    .join('')}
                </div>
              </section>` : ''}

              <section class="detail-section">
                <h2>관리사 정보</h2>
                <p class="detail-description">
                  ${escapeHtml(shop.staffInfo || '관리사 정보는 예약 시 전화로 안내해드립니다.')}
                </p>
              </section>

              ${reviews.length ? `<section class="detail-section">
                <h2>이용 후기</h2>
                <div class="detail-reviews">
                  ${reviews
                    .map((rev) => `<div class="detail-review-item">
                      <div class="detail-review-header">
                        <span>${escapeHtml(rev.name || rev.author || '익명')}</span>
                        <span class="detail-review-rating">
                          ${typeof rev.rating === 'number' ? '★ ' + rev.rating.toFixed(1) : ''}
                          ${rev.date ? '<span style="margin-left:0.4rem;color:#6b7280;">' + escapeHtml(rev.date) + '</span>' : ''}
                        </span>
                      </div>
                      <div class="detail-review-body">
                        ${escapeHtml(rev.comment || rev.review || '')}
                      </div>
                    </div>`)
                    .join('')}
                </div>
              </section>` : ''}
            </div>
          </header>
        </div>
      </article>
      ${
        shop.phone
          ? `<div class="detail-callbar">
        <a href="tel:${escapeHtml(String(shop.phone).replace(/[^0-9]/g, ''))}" class="detail-callbar-btn" aria-label="전화하기">
          <span>📞</span>
          전화하기
        </a>
      </div>`
          : ''
      }
      ${detailBaroHtml}
    </main>

    <footer class="site-footer">
      <div class="container footer-inner">
        <p>© <span id="currentYear"></span> 바로힐링출장마사지. All rights reserved.</p>
      </div>
    </footer>
    <script>
      // 연도 표시만 간단히 처리
      (function () {
        var el = document.getElementById('currentYear');
        if (el) el.textContent = String(new Date().getFullYear());
      })();
    </script>
  </body>
</html>`;
}

function main() {
  console.log('▶ 정적 상세페이지 생성 시작');
  const shops = loadShops();
  const regionsData = loadRegionsData(KOREA_REGIONS_FILE);
  const districtDupCounts = buildDistrictDuplicateCount(regionsData);

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  shops.forEach((shop) => {
    const slug = slugify(shop);
    const html = renderDetailHtml(shop, slug, regionsData, districtDupCounts);
    const outPath = path.join(OUT_DIR, `${slug}.html`);
    fs.writeFileSync(outPath, html, 'utf8');
  });

  console.log(` - 생성 완료: ${shops.length}개 상세페이지 (${OUT_DIR})`);
}

if (require.main === module) {
  main();
}

