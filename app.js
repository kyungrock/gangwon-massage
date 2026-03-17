// 공통 유틸
function getPageType() {
  if (typeof document === 'undefined') return 'index';
  const attr = document.body && document.body.getAttribute('data-page');
  return attr || 'index';
}

function getQueryParam(name) {
  if (typeof window === 'undefined') return null;
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function formatPrice(price) {
  return price || '가격 문의';
}

function formatAddress(shop) {
  const parts = [];
  if (shop.region) parts.push(shop.region);
  if (shop.district) parts.push(shop.district);
  if (shop.dong) parts.push(shop.dong);
  return parts.join(' ');
}

function parseMultiValue(val) {
  return (val || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildFiltersFromData(shops) {
  const regions = new Set();
  const districtsByRegion = {};
  const dongsByRegionDistrict = {};

  shops.forEach((shop) => {
    const regionStrs = parseMultiValue(shop.region);
    const districtStrs = parseMultiValue(shop.district);
    const dongStrs = parseMultiValue(shop.dong);

    regionStrs.forEach((r) => regions.add(r));

    regionStrs.forEach((region) => {
      districtStrs.forEach((district) => {
        if (!districtsByRegion[region]) districtsByRegion[region] = new Set();
        districtsByRegion[region].add(district);
      });
      if (districtStrs.length === 0 && region) {
        if (!districtsByRegion[region]) districtsByRegion[region] = new Set();
      }
    });

    regionStrs.forEach((region) => {
      districtStrs.forEach((district) => {
        dongStrs.forEach((dong) => {
          const key = `${region}::${district}`;
          if (!dongsByRegionDistrict[key]) dongsByRegionDistrict[key] = new Set();
          dongsByRegionDistrict[key].add(dong);
        });
      });
    });
  });

  return { regions, districtsByRegion, dongsByRegionDistrict };
}

function populateSelect(select, items, placeholder) {
  if (!select) return;
  const current = select.value;
  select.innerHTML = '';
  const opt = document.createElement('option');
  opt.value = '';
  opt.textContent = placeholder || '전체';
  select.appendChild(opt);

  items.forEach((item) => {
    const o = document.createElement('option');
    o.value = item;
    o.textContent = item;
    select.appendChild(o);
  });

  if (current && [...select.options].some((o) => o.value === current)) {
    select.value = current;
  }
}

// 필터 로직 (region/district/dong은 콤마 구분 다중값 지원)
function filterShops({
  shops,
  region,
  district,
  dong,
  type,
  keyword,
}) {
  const kw = (keyword || '').trim().toLowerCase();

  return shops.filter((shop) => {
    if (region) {
      const shopRegions = parseMultiValue(shop.region);
      if (!shopRegions.length || !shopRegions.includes(region)) return false;
    }
    if (district) {
      const shopDistricts = parseMultiValue(shop.district);
      if (!shopDistricts.length || !shopDistricts.includes(district)) return false;
    }
    if (dong) {
      const shopDongs = parseMultiValue(shop.dong);
      if (!shopDongs.length || !shopDongs.includes(dong)) return false;
    }

    if (type) {
      const typeLower = type.toLowerCase();
      const inType =
        (shop.type && String(shop.type).toLowerCase().includes(typeLower)) ||
        safeArray(shop.services)
          .join(' ')
          .toLowerCase()
          .includes(typeLower) ||
        safeArray(shop.tags)
          .join(' ')
          .toLowerCase()
          .includes(typeLower);
      if (!inType) return false;
    }

    if (kw) {
      const combined = [
        shop.name,
        shop.region,
        shop.district,
        shop.dong,
        shop.address,
        shop.detailAddress,
        shop.description,
        safeArray(shop.services).join(' '),
        safeArray(shop.tags).join(' '),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (!combined.includes(kw)) return false;
    }

    return true;
  });
}

// 메인 카드 렌더링 (shops.json 전체 업체 기준, 필터 적용)
function renderMainCards() {
  if (typeof window === 'undefined') return;
  const container = document.getElementById('shopCardsContainer');
  const noResults = document.getElementById('noResultsMessage');
  const shops = window.shopsData?.shops || window.shopCardData || [];
  if (!container || !shops.length) return;

  const region = document.getElementById('filterRegion')?.value || '';
  const district = document.getElementById('filterDistrict')?.value || '';
  const dong = document.getElementById('filterDong')?.value || '';
  const type = document.getElementById('filterType')?.value || '';
  const keyword = document.getElementById('filterKeyword')?.value || '';

  let data = filterShops({
    shops,
    region,
    district,
    dong,
    type,
    keyword,
  });

  if (noResults) {
    noResults.hidden = data.length > 0;
  }

  // showHealingShop 있으면 상단, 없으면 그대로
  const healing = data.filter((s) => s.showHealingShop);
  const others = data.filter((s) => !s.showHealingShop);
  const shuffle = (arr) =>
    arr
      .map((it) => [Math.random(), it])
      .sort((a, b) => a[0] - b[0])
      .map(([, it]) => it);

  data = [...shuffle(healing), ...shuffle(others)];

  container.innerHTML = '';

  data.forEach((shop) => {
    const card = document.createElement('article');
    card.className = 'shop-card';

    const imgSrc = shop.image || 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=250&fit=crop&crop=center';
    const alt = shop.alt || `${shop.name} 마사지샵`;

    const location = [shop.region, shop.district, shop.dong].filter(Boolean).join(' ');

    const greeting = shop.greeting || shop.description || '';
    const tags = safeArray(shop.services).slice(0, 3);

    const rating = shop.rating || shop.rating === 0 ? shop.rating.toFixed(1) : null;
    const reviewCount = shop.reviewCount || 0;

    const detailUrl = `detail.html?id=${encodeURIComponent(shop.id || shop.name || '')}`;

    card.innerHTML = `
      <a href="${detailUrl}" aria-label="${shop.name} 상세보기">
        <div class="shop-card-image">
          <img src="${imgSrc}" alt="${alt}" loading="lazy" />
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
            <h2 class="shop-card-title">${shop.name || '출장마사지 업체'}</h2>
            ${
              rating
                ? `<div class="shop-card-rating">★ ${rating} <span>(${reviewCount})</span></div>`
                : ''
            }
          </div>
          <div class="shop-card-meta">
            ${
              location
                ? `<span>📍 <span>${location}</span></span>`
                : ''
            }
            ${
              shop.operatingHours
                ? `<span>⏱ <span>${shop.operatingHours}</span></span>`
                : ''
            }
          </div>
          <div class="shop-card-price">${formatPrice(shop.price)}</div>
          ${
            greeting
              ? `<p class="shop-card-greeting">${greeting}</p>`
              : ''
          }
          ${
            tags.length
              ? `
              <div class="shop-card-tags">
                ${tags
                  .map(
                    (t) =>
                      `<span class="shop-card-tag">${t}</span>`
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
    `;

    container.appendChild(card);
  });
}

// 게시판 리스트 렌더링 (shops.json 기반)
function renderBoardList() {
  if (typeof window === 'undefined') return;
  const container = document.getElementById('boardListContainer');
  const noResults = document.getElementById('boardNoResultsMessage');
  const totalLabel = document.getElementById('totalCountLabel');
  const sortSelect = document.getElementById('sortSelect');
  if (!container || !window.shopsData) return;

  const shops = window.shopsData.shops || [];

  const region = document.getElementById('filterRegionBoard')?.value || '';
  const district = document.getElementById('filterDistrictBoard')?.value || '';
  const dong = document.getElementById('filterDongBoard')?.value || '';
  const type = document.getElementById('filterTypeBoard')?.value || '';
  const keyword = document.getElementById('filterKeywordBoard')?.value || '';

  let filtered = filterShops({
    shops,
    region,
    district,
    dong,
    type,
    keyword,
  });

  const sortValue = sortSelect ? sortSelect.value : 'recommended';
  if (sortValue === 'rating_desc') {
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (sortValue === 'review_desc') {
    filtered.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
  } else if (sortValue === 'price_asc') {
    const parsePrice = (p) => {
      if (!p) return Number.MAX_SAFE_INTEGER;
      const n = String(p).replace(/[^\d]/g, '');
      return n ? parseInt(n, 10) : Number.MAX_SAFE_INTEGER;
    };
    filtered.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
  }

  container.innerHTML = '';

  if (totalLabel) {
    totalLabel.textContent = `총 ${filtered.length}개 업체`;
  }

  if (!filtered.length) {
    if (noResults) noResults.hidden = false;
    return;
  }

  if (noResults) noResults.hidden = true;

  filtered.forEach((shop) => {
    const card = document.createElement('article');
    card.className = 'board-card';

    const location = formatAddress(shop);
    const typeLabel = shop.type || safeArray(shop.tags)[0] || '출장마사지';
    const rating =
      typeof shop.rating === 'number' ? shop.rating.toFixed(1) : null;
    const reviewCount = shop.reviewCount || 0;

    const detailUrl = `detail.html?id=${encodeURIComponent(shop.id || shop.name || '')}`;

    const tags = [
      typeLabel,
      ...safeArray(shop.services).slice(0, 2),
      ...safeArray(shop.tags).slice(0, 1),
    ].filter(Boolean);

    card.innerHTML = `
      <div class="board-card-main">
        <div class="board-card-title-row">
          <h2 class="board-card-title">
            <a href="${detailUrl}">${shop.name || '출장마사지 업체'}</a>
          </h2>
          ${
            rating
              ? `<div class="board-card-rating">★ ${rating} <span>(${reviewCount})</span></div>`
              : ''
          }
        </div>
        <div class="board-card-location">
          ${location || ''}
        </div>
        <div class="board-card-price">
          ${formatPrice(shop.price)}
        </div>
        ${
          tags.length
            ? `
          <div class="board-card-tags">
            ${tags
              .map(
                (t) =>
                  `<span class="board-card-tag">${t}</span>`
              )
              .join('')}
          </div>
        `
            : ''
        }
      </div>
      <aside class="board-card-aside">
        <div class="board-card-stats">
          ${
            shop.operatingHours
              ? `<div>영업시간: ${shop.operatingHours}</div>`
              : ''
          }
          ${
            shop.phone
              ? `<div>문의: ${shop.phone}</div>`
              : ''
          }
        </div>
        <a href="${detailUrl}" class="board-card-link">상세 보기 ↗</a>
      </aside>
    `;

    container.appendChild(card);
  });
}

// 상세 페이지 렌더링
function renderDetailPage() {
  if (typeof window === 'undefined') return;
  const container = document.getElementById('detailContainer');
  if (!container || !window.shopsData) return;

  const id = getQueryParam('id');
  if (!id) {
    container.innerHTML = '<p class="no-results">업체 정보가 없습니다.</p>';
    return;
  }

  const shops = window.shopsData.shops || [];
  let shop =
    shops.find((s) => String(s.id) === id) ||
    shops.find((s) => String(s.name) === id);

  if (!shop) {
    container.innerHTML = '<p class="no-results">해당 업체를 찾을 수 없습니다.</p>';
    return;
  }

  const location = formatAddress(shop);
  const tags = safeArray(shop.tags);
  const services = safeArray(shop.services);
  const courses = safeArray(shop.courses);
  const features = safeArray(shop.features);
  const reviews = safeArray(shop.reviews);

  const rating =
    typeof shop.rating === 'number' ? shop.rating.toFixed(1) : null;
  const reviewCount = shop.reviewCount || reviews.length || 0;

  const imgSrc =
    shop.image ||
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=500&fit=crop&crop=center';

  const pageTitleBase = `${shop.name || '출장마사지 업체'} | 강원도출장마사지`;
  const metaDescBase =
    shop.description ||
    `${location}에 위치한 강원도 출장마사지 업체 상세 정보, 가격, 코스, 리뷰 안내.`;

  document.title = pageTitleBase;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', metaDescBase);

  container.innerHTML = `
    <a href="board.html" class="detail-back-link">
      <span>←</span>
      리스트로 돌아가기
    </a>
    <header class="detail-header">
      <div class="detail-main">
        <h1 class="detail-title">${shop.name || '출장마사지 업체'}</h1>
        <div class="detail-meta">
          ${
            location
              ? `<span>${location}</span>`
              : ''
          }
          ${
            rating
              ? `<span>★ ${rating} (${reviewCount} 리뷰)</span>`
              : ''
          }
          ${
            shop.price
              ? `<span>${shop.price}</span>`
              : ''
          }
        </div>
        <div class="detail-image-wrapper">
          <img src="${imgSrc}" alt="${shop.name || '출장마사지 업체'}" loading="lazy" />
        </div>
        <section class="detail-section">
          <h2>업체 소개</h2>
          <p class="detail-description">
            ${shop.description || '업체 소개 내용이 준비중입니다.'}
          </p>
          <div class="detail-badges">
            ${
              services
                .map(
                  (s) =>
                    `<span class="detail-badge">${s}</span>`
                )
                .join('')
            }
            ${
              features
                .map(
                  (f) =>
                    `<span class="detail-badge">${f}</span>`
                )
                .join('')
            }
            ${
              tags
                .map(
                  (t) =>
                    `<span class="detail-badge">#${t}</span>`
                )
                .join('')
            }
          </div>
        </section>
        ${
          courses.length
            ? `
        <section class="detail-section">
          <h2>코스 및 가격</h2>
          <div class="detail-courses">
            ${courses
              .map((course) => {
                const items = safeArray(course.items);
                return `
                  <div class="detail-course-card">
                    <div class="detail-course-title">${course.category || '프로그램'}</div>
                    ${items
                      .map(
                        (item) => `
                          <div class="detail-course-item">
                            <div class="detail-course-label">
                              ${item.name || ''}
                              ${
                                item.description
                                  ? `<div>${item.description}</div>`
                                  : ''
                              }
                            </div>
                            <div class="detail-course-meta">
                              ${
                                item.price
                                  ? `<div>${item.price}</div>`
                                  : ''
                              }
                              ${
                                item.duration
                                  ? `<div>${item.duration}</div>`
                                  : ''
                              }
                            </div>
                          </div>
                        `
                      )
                      .join('')}
                  </div>
                `;
              })
              .join('')}
          </div>
        </section>
        `
            : ''
        }
        ${
          reviews.length
            ? `
        <section class="detail-section">
          <h2>실제 이용 후기</h2>
          <div class="detail-reviews">
            ${reviews
              .map(
                (rev) => `
                <div class="detail-review-item">
                  <div class="detail-review-header">
                    <span>${rev.name || rev.author || '익명'}</span>
                    <span class="detail-review-rating">
                      ${typeof rev.rating === 'number' ? `★ ${rev.rating.toFixed(1)}` : ''}
                      ${
                        rev.date
                          ? `<span style="margin-left: 0.4rem; color: #6b7280;">${rev.date}</span>`
                          : ''
                      }
                    </span>
                  </div>
                  <div class="detail-review-body">
                    ${rev.comment || rev.review || ''}
                  </div>
                </div>
              `
              )
              .join('')}
          </div>
        </section>
        `
            : ''
        }
      </div>
      <aside class="detail-aside">
        <div class="detail-aside-card">
          <h2>문의 및 기본 정보</h2>
          ${
            shop.phone
              ? `
          <div class="detail-aside-row">
            <span class="detail-aside-label">예약문의</span>
            <span>${shop.phone}</span>
          </div>`
              : ''
          }
          ${
            shop.address
              ? `
          <div class="detail-aside-row">
            <span class="detail-aside-label">주소</span>
            <span>${shop.address}${
                shop.detailAddress ? `<br />${shop.detailAddress}` : ''
              }</span>
          </div>`
              : ''
          }
          ${
            shop.operatingHours
              ? `
          <div class="detail-aside-row">
            <span class="detail-aside-label">영업시간</span>
            <span>${shop.operatingHours}</span>
          </div>`
              : ''
          }
          ${
            rating
              ? `
          <div class="detail-aside-row">
            <span class="detail-aside-label">평점</span>
            <span>★ ${rating} (${reviewCount} 리뷰)</span>
          </div>`
              : ''
          }
          <div class="detail-cta">
            ${
              shop.phone
                ? `
            <a href="tel:${shop.phone.replace(/[^0-9]/g, '')}" class="detail-cta-btn">
              <span>📞</span>
              전화 문의하기
            </a>`
                : ''
            }
            <p class="detail-cta-note">
              실제 예약 및 결제는 각 업체를 통해 직접 진행되며,
              강원도출장마사지는 정보 제공 플랫폼 역할만 수행합니다.
            </p>
          </div>
        </div>
      </aside>
    </header>
  `;

  // JSON-LD 동적 삽입 (업체별 상세 스키마)
  try {
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: shop.name,
      description: shop.description,
      url: window.location.href,
      telephone: shop.phone,
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'KR',
        addressRegion: shop.region,
        addressLocality: shop.district,
        streetAddress: shop.address,
      },
      image: imgSrc,
      aggregateRating: rating
        ? {
            '@type': 'AggregateRating',
            ratingValue: rating,
            reviewCount: reviewCount,
          }
        : undefined,
      servesCuisine: 'Massage',
      areaServed: shop.region,
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(ld);
    document.head.appendChild(script);
  } catch (e) {
    // JSON-LD 에러는 무시
  }
}

// 필터 UI 초기화 (shopsData 또는 shopCardData 사용)
function initFilterUI() {
  if (typeof window === 'undefined') return;
  const shops =
    (window.shopsData?.shops?.length && window.shopsData.shops) ||
    (window.shopCardData || []);
  if (!shops.length) return;
  const { regions, districtsByRegion, dongsByRegionDistrict } =
    buildFiltersFromData(shops);

  const regionSelects = [
    document.getElementById('filterRegion'),
    document.getElementById('filterRegionBoard'),
  ];
  const districtSelects = [
    document.getElementById('filterDistrict'),
    document.getElementById('filterDistrictBoard'),
  ];
  const dongSelects = [
    document.getElementById('filterDong'),
    document.getElementById('filterDongBoard'),
  ];

  regionSelects.forEach((sel) =>
    populateSelect(sel, Array.from(regions).sort(), '전체')
  );

  function updateDependent(regionValue, districtValue, fromRegionIdx) {
    const districts =
      (regionValue && districtsByRegion[regionValue]) || new Set();
    districtSelects.forEach((sel) =>
      populateSelect(sel, Array.from(districts).sort(), '전체')
    );
    if (fromRegionIdx !== undefined && districtSelects[fromRegionIdx]) {
      districtSelects[fromRegionIdx].value = districtValue || '';
    }

    const key = regionValue && districtValue
      ? `${regionValue}::${districtValue}`
      : regionValue
        ? `${regionValue}::${districtSelects[fromRegionIdx ?? 0]?.value || ''}`
        : '';
    const dongs =
      (key && dongsByRegionDistrict[key]) || new Set();
    dongSelects.forEach((sel) =>
      populateSelect(sel, Array.from(dongs).sort(), '전체')
    );
  }

  regionSelects.forEach((sel, idx) => {
    if (!sel) return;
    sel.addEventListener('change', () => {
      const val = sel.value;
      updateDependent(val, '', idx);
      getPageType() === 'index' ? renderMainCards() : renderBoardList();
    });
  });

  districtSelects.forEach((sel, idx) => {
    if (!sel) return;
    sel.addEventListener('change', () => {
      const regionVal = regionSelects[idx]?.value || '';
      const districtVal = sel.value || '';
      const key = regionVal && districtVal ? `${regionVal}::${districtVal}` : '';
      const dongs =
        (key && dongsByRegionDistrict[key]) || new Set();
      if (dongSelects[idx]) {
        populateSelect(dongSelects[idx], Array.from(dongs).sort(), '전체');
      } else {
        dongSelects.forEach((d) =>
          populateSelect(d, Array.from(dongs).sort(), '전체')
        );
      }
      getPageType() === 'index' ? renderMainCards() : renderBoardList();
    });
  });

  dongSelects.forEach((sel) => {
    if (!sel) return;
    sel.addEventListener('change', () => {
      getPageType() === 'index' ? renderMainCards() : renderBoardList();
    });
  });

  const typeSelects = [
    document.getElementById('filterType'),
    document.getElementById('filterTypeBoard'),
  ];
  typeSelects.forEach((sel) => {
    if (!sel) return;
    sel.addEventListener('change', () => {
      getPageType() === 'index' ? renderMainCards() : renderBoardList();
    });
  });

  const kwInput = document.getElementById('filterKeyword');
  const kwBoard = document.getElementById('filterKeywordBoard');
  [kwInput, kwBoard].forEach((el) => {
    if (!el) return;
    el.addEventListener('input', () => {
      getPageType() === 'index' ? renderMainCards() : renderBoardList();
    });
  });
}

// 이벤트 바인딩
function initForms() {
  const heroForm = document.getElementById('heroSearchForm');
  if (heroForm) {
    heroForm.addEventListener('submit', (e) => {
      e.preventDefault();
      // 메인 페이지에서는 필터 값만 유지하고 카드 자체는 shopCardData 기반 랜더링이므로
      // 여기서는 게시판 페이지로 이동하여 상세 검색을 수행
      const region = document.getElementById('filterRegion')?.value || '';
      const district = document.getElementById('filterDistrict')?.value || '';
      const dong = document.getElementById('filterDong')?.value || '';
      const type = document.getElementById('filterType')?.value || '';
      const keyword =
        document.getElementById('filterKeyword')?.value || '';

      const url = new URL(window.location.origin + '/board.html');
      if (region) url.searchParams.set('region', region);
      if (district) url.searchParams.set('district', district);
      if (dong) url.searchParams.set('dong', dong);
      if (type) url.searchParams.set('type', type);
      if (keyword) url.searchParams.set('q', keyword);

      window.location.href = url.toString();
    });
  }

  const boardForm = document.getElementById('boardSearchForm');
  if (boardForm) {
    boardForm.addEventListener('submit', (e) => {
      e.preventDefault();
      renderBoardList();
    });
  }

  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      renderBoardList();
    });
  }
}

function applyQueryParamsToBoardFilters() {
  if (getPageType() !== 'board') return;
  const params = new URLSearchParams(window.location.search);
  const region = params.get('region') || '';
  const district = params.get('district') || '';
  const dong = params.get('dong') || '';
  const type = params.get('type') || '';
  const q = params.get('q') || '';

  const regionSelect = document.getElementById('filterRegionBoard');
  const districtSelect = document.getElementById('filterDistrictBoard');
  const dongSelect = document.getElementById('filterDongBoard');
  const typeSelect = document.getElementById('filterTypeBoard');
  const keywordInput = document.getElementById('filterKeywordBoard');

  if (regionSelect && region) {
    regionSelect.value = region;
    regionSelect.dispatchEvent(new Event('change', { bubbles: true }));
  }
  if (districtSelect && district) {
    districtSelect.value = district;
    districtSelect.dispatchEvent(new Event('change', { bubbles: true }));
  }
  if (dongSelect && dong) dongSelect.value = dong;
  if (typeSelect && type) typeSelect.value = type;
  if (keywordInput && q) keywordInput.value = q;
}

function initCurrentYear() {
  const el = document.getElementById('currentYear');
  if (el) {
    el.textContent = String(new Date().getFullYear());
  }
}

// 초기화
window.addEventListener('DOMContentLoaded', () => {
  if (!window.shopsData) {
    console.warn('shopsData가 로드되지 않았습니다.');
  }

  initCurrentYear();
  initFilterUI();
  initForms();

  const page = getPageType();
  if (page === 'index') {
    renderMainCards();
  } else if (page === 'board') {
    applyQueryParamsToBoardFilters();
    renderBoardList();
  } else if (page === 'detail') {
    renderDetailPage();
  }
});

