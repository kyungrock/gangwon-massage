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

function slugify(shop) {
  if (shop.slug) return shop.slug;
  const region = parseFirst(shop.region);
  const district = parseFirst(shop.district);
  const name = (shop.name || '').trim();
  const base = [region, district, name, '출장마사지']
    .filter(Boolean)
    .join('-')
    .replace(/\s+/g, '-');
  return encodeURIComponent(base);
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderDetailHtml(shop, slug) {
  const regionFirst = parseFirst(shop.region);
  const districtFirst = parseFirst(shop.district);
  const baseName = shop.name || '출장마사지 업체';

  const titlePrefix = [regionFirst, districtFirst, baseName]
    .filter(Boolean)
    .join(' ')
    .concat(' 출장마사지');

  const title = `${titlePrefix} | 강원도출장마사지`;

  const descBase =
    (shop.description || '').trim() ||
    `${regionFirst || ''} ${districtFirst || ''} 지역에서 이용할 수 있는 ${baseName} 강원도출장마사지 정보입니다.`;

  const desc = `${regionFirst || ''} ${districtFirst || ''} 강원도출장마사지 ${baseName} 안내 – ${descBase}`.slice(
    0,
    160
  );

  const location = [shop.region, shop.district, shop.dong]
    .filter(Boolean)
    .join(' ');

  const image =
    shop.image ||
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=500&fit=crop&crop=center';

  const services = Array.isArray(shop.services) ? shop.services : [];
  const features = Array.isArray(shop.features) ? shop.features : [];
  const courses = Array.isArray(shop.courses) ? shop.courses : [];
  const reviews = Array.isArray(shop.reviews) ? shop.reviews : [];
  const rating = typeof shop.rating === 'number' ? shop.rating : null;
  const reviewCount = typeof shop.reviewCount === 'number' ? shop.reviewCount : reviews.length || null;

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
    <meta name="robots" content="index,follow" />
    <link rel="canonical" href="${SITE_ORIGIN}/shops/${slug}.html" />
    <link rel="stylesheet" href="../styles.css" />
    <script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
    </script>
  </head>
  <body data-page="detail-static">
    <header class="site-header">
      <div class="container header-inner">
        <a href="../index.html?region=강원" class="logo">강원도출장마사지</a>
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
    </main>

    <footer class="site-footer">
      <div class="container footer-inner">
        <p>© <span id="currentYear"></span> 강원도출장마사지. All rights reserved.</p>
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

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  shops.forEach((shop) => {
    const slug = slugify(shop);
    const html = renderDetailHtml(shop, slug);
    const outPath = path.join(OUT_DIR, `${slug}.html`);
    fs.writeFileSync(outPath, html, 'utf8');
  });

  console.log(` - 생성 완료: ${shops.length}개 상세페이지 (${OUT_DIR})`);
}

if (require.main === module) {
  main();
}

