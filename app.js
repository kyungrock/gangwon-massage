// 공통 유틸
function getPageType() {
  if (typeof document === 'undefined') return 'index';
  const attr = document.body && document.body.getAttribute('data-page');
  return attr || 'index';
}

function isSubdirStaticPage() {
  const p = getPageType();
  return p === 'district-static' || p === 'region-static';
}

function isHomeOrDistrictListPage() {
  const p = getPageType();
  return p === 'index' || p === 'district-static' || p === 'region-static';
}

/** 시·군 정적 페이지(districts/) → 같은 폴더의 다른 시·군 HTML */
function districtListTargetHref(fileName) {
  const p = getPageType();
  if (p === 'district-static') {
    return encodeURI(fileName);
  }
  if (p === 'region-static') {
    return `../districts/${encodeURI(fileName)}`;
  }
  return `districts/${encodeURI(fileName)}`;
}

function regionListTargetHref(fileName) {
  return isSubdirStaticPage()
    ? `../regions/${encodeURI(fileName)}`
    : `regions/${encodeURI(fileName)}`;
}

function regionListFileName(region) {
  return `${normalizeRegionDisplay(region || '')}출장마사지.html`;
}

function districtListFileName(region, district) {
  const r = normalizeRegionDisplay(region || '');
  const d = String(district || '').trim();
  return `${r}-${d}출장마사지.html`;
}

/** koreaRegions 로딩이 끝난 뒤 시/구 select를 다시 그릴 때, 이미 시/군 정적 페이지로 이동 중이면 덮어쓰지 않음(선택이 원복·이동 실패처럼 보이는 현상 방지) */
let suppressKoreaDistrictRepaint = false;

/** 시·군 정적 페이지에서 data-region/data-district로 필터를 맞추는 중 — 이때 region change로 regions/에 잘못 이동하지 않도록 구분 */
let districtStaticFilterHydrating = false;

/** file:// 에서는 상대경로만 쓰는 편이 안전 (new URL 절대화 시 이동이 안 되는 경우 방지) */
function setLocationRelativeSafe(rel) {
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    window.location.href = rel;
    return;
  }
  try {
    window.location.href = new URL(rel, window.location.href).toString();
  } catch (_) {
    window.location.href = rel;
  }
}

function navigateToDistrictStaticHtml(fileName) {
  suppressKoreaDistrictRepaint = true;
  setLocationRelativeSafe(districtListTargetHref(fileName));
}

/**
 * SSR/shop 데이터는 "거제시", korea-regions·정적 HTML 파일명은 "거제"처럼 다를 수 있음.
 * koreaDistrictsByRegionMap(있으면)으로 맞추고, 없으면 끝이 "시"인 경우만 제거해 파일명과 맞춤.
 */
function resolveDistrictForStaticFilename(region, districtVal) {
  const d = String(districtVal || '').trim();
  if (!d) return d;
  const r = normalizeRegionDisplay(region || '');
  const map =
    typeof window !== 'undefined' && window.__koreaDistrictsByRegionMap;
  const set = map && map[r];
  if (set && typeof set.has === 'function') {
    if (set.has(d)) return d;
    if (d.endsWith('시')) {
      const withoutSi = d.replace(/시$/, '');
      if (set.has(withoutSi)) return withoutSi;
    }
    // SSR/shop: "수원시 영통구", "고양시 일산동구" 등 → korea-regions 시·군 단위(수원, 고양)로 매칭
    const firstToken = d.split(/\s+/)[0] || '';
    if (firstToken.endsWith('시')) {
      const base = firstToken.replace(/시$/, '');
      if (set.has(base)) return base;
    }
    if (firstToken.endsWith('군')) {
      const base = firstToken.replace(/군$/, '');
      if (set.has(base)) return base;
    }
    return d;
  }
  if (d.endsWith('시')) return d.replace(/시$/, '');
  const ft = d.split(/\s+/)[0] || '';
  if (ft.endsWith('시')) return ft.replace(/시$/, '');
  if (ft.endsWith('군')) return ft.replace(/군$/, '');
  return d;
}

function boardListHref() {
  return isSubdirStaticPage() ? '../board.html' : 'board.html';
}

function resolveListPageImageSrc(src) {
  if (!src) return src;
  const s = String(src).trim();
  if (/^https?:\/\//i.test(s) || /^data:/i.test(s)) return s;
  if (!isSubdirStaticPage()) return s;
  if (s.startsWith('/')) return `..${s}`;
  if (s.startsWith('../')) return s;
  return `../${s}`;
}

function listPageDetailHref(idOrName) {
  const prefix = isSubdirStaticPage() ? '../' : '';
  const slug = shopSlugForStaticDetail(idOrName);
  return `${prefix}shops/${slug}.html`;
}

function shopSlugForStaticDetail(shopOrIdOrName) {
  if (shopOrIdOrName && typeof shopOrIdOrName === 'object') {
    const shop = shopOrIdOrName;
    if (shop.slug) return String(shop.slug);
    const first = (v) => String(v || '').split(',')[0].trim();
    const region = first(shop.region);
    const district = first(shop.district);
    const name = String(shop.name || '').trim();
    const base = [region, district, name, '출장마사지']
      .filter(Boolean)
      .join('-')
      .replace(/\s+/g, '-');
    return base || String(shop.id || shop.name || 'detail');
  }
  return String(shopOrIdOrName || 'detail');
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

/** shops.json phone → tel:용 숫자만 */
function shopPhoneDigitsForTel(phone) {
  return String(phone || '').replace(/[^\d]/g, '');
}

/** 카드 가격 행 + 전화(소스 HTML에 그대로 노출, span은 상세 링크 a 안에 중첩 a 방지) */
function shopCardPriceRowHtml(shop) {
  const priceStr = escapeHtmlBaro(formatPrice(shop.price));
  const phoneRaw = String(shop.phone || '').trim();
  const digits = shopPhoneDigitsForTel(phoneRaw);
  if (!phoneRaw) {
    return `<div class="shop-card-price-row"><div class="shop-card-price">${priceStr}</div></div>`;
  }
  const dt = digits ? ` data-tel="${escapeHtmlBaro(digits)}"` : '';
  return `<div class="shop-card-price-row"><div class="shop-card-price">${priceStr}</div><span class="shop-card-phone"${dt}>📞 ${escapeHtmlBaro(phoneRaw)}</span></div>`;
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

function normalizeRegionDisplay(region) {
  const r = (region || '').trim();
  // 표시만 간단히: "강원도" -> "강원도", "경기도" -> "경기" 같은 형태
  if (r.endsWith('도') && r.length >= 2) return r.slice(0, -1);
  return r;
}

// 내부 필터 매핑용 region key
// - "강원도" / "강원도" 같은 값을 동일 키로 취급하기 위함
function normalizeRegionKey(region) {
  return normalizeRegionDisplay(region);
}

function formatLocationDisplay(shop) {
  const region = parseMultiValue(shop.region).map(normalizeRegionDisplay).join(' ');
  const district = parseMultiValue(shop.district).join(' ');
  const dong = parseMultiValue(shop.dong).join(' ');
  return [region, district, dong].filter(Boolean).join(' ');
}

function buildFiltersFromData(shops) {
  const regions = new Set();
  const districtsByRegion = {};
  const dongsByRegionDistrict = {};

  shops.forEach((shop) => {
    const regionStrs = parseMultiValue(shop.region).map(normalizeRegionKey);
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
    // region 값은 내부 key(예: "강원도")로 통일되어 있으므로 표시도 동일하게 사용
    if (select.id === 'filterRegion' || select.id === 'filterRegionBoard') {
      o.textContent = normalizeRegionDisplay(item);
    } else {
      o.textContent = item;
    }
    select.appendChild(o);
  });

  if (current && [...select.options].some((o) => o.value === current)) {
    select.value = current;
  }
}

/** korea-regions 기반 광역 시·도 이름 (키워드 다중 지역 매칭용) */
function getKnownRegionNamesSet() {
  if (typeof window !== 'undefined' && window.koreaRegionsData?.regions) {
    return new Set(
      window.koreaRegionsData.regions.map((r) =>
        normalizeRegionDisplay(r.name || '')
      )
    );
  }
  return new Set([
    '서울',
    '부산',
    '대구',
    '인천',
    '광주',
    '대전',
    '울산',
    '세종',
    '경기',
    '강원도',
    '충북',
    '충남',
    '전북',
    '전남',
    '경북',
    '경남',
    '제주',
  ]);
}

/**
 * 키워드에서 "서울,경기,인천"처럼 쉼표(·세미콜론)로 구분된 광역명을 추출하고, 나머지는 본문 검색용으로 반환.
 */
function parseKeywordRegionsAndRest(keyword) {
  const raw = (keyword || '').trim();
  if (!raw) return { regions: [], rest: '' };
  const known = getKnownRegionNamesSet();
  const parts = raw.split(/[,，;；]+/).map((s) => s.trim()).filter(Boolean);
  const regionList = [];
  const restParts = [];
  for (const p of parts) {
    const n = normalizeRegionDisplay(p);
    if (known.has(n)) regionList.push(n);
    else restParts.push(p);
  }
  const uniqRegions = [...new Set(regionList)];
  let rest = restParts.join(' ').trim().toLowerCase();
  if (!uniqRegions.length && !rest && !/[，,;；]/.test(raw)) {
    const whole = normalizeRegionDisplay(raw);
    if (known.has(whole)) {
      return { regions: [whole], rest: '' };
    }
  }
  return { regions: uniqRegions, rest };
}

/**
 * 시·군(district-static)에서 전용 등록 업체가 없을 때 보조 표시용.
 * - 주소/소개에 해당 시·군명이 포함되거나, district에 광역 출장(전지역·서울·경기 등) 표기가 있는 경우
 */
function shopMatchesDistrictFallback(shop, wantRegion, wantDistrict) {
  const regions = parseMultiValue(shop.region).map(normalizeRegionDisplay);
  const wr = normalizeRegionDisplay(wantRegion);
  if (!wr) return false;
  const wd = String(wantDistrict || '').trim();
  if (!wd) return false;

  const dStr = String(shop.district || '');

  /** 광역 출장 문구(경기 시·군 페이지에서 서울/인천만 region인 업체 포함) */
  const broadOutcall =
    /전지역/.test(dStr) ||
    /서울[·.]?\s*경기|경기[·.]?\s*인천|서울·경기·인천|서울\.경기|인천\.경기|경기\s*전지역/i.test(
      dStr
    );
  let regionOk = regions.includes(wr);
  if (!regionOk && wr === '경기' && broadOutcall) {
    regionOk = regions.some((r) => ['서울', '인천', '경기'].includes(r));
  }
  if (!regionOk) return false;

  const distVals = parseMultiValue(shop.district);
  if (distVals.some((d) => d === wd || d.includes(wd))) return true;

  const blob = [dStr, shop.address, shop.detailAddress, shop.description]
    .filter(Boolean)
    .join(' ');
  if (blob.includes(wd)) return true;

  if (broadOutcall) return true;

  return false;
}

/**
 * 필터 로직 (출장마사지 카드 = 지역 우선)
 * - 홈·지역·시/군 정적·게시판: 지역(광역)이 선택되면 카드는 항상 그 광역 전체만 대상. 시/구·동은 카드 좁히기에 쓰지 않음(지역 기준 유지).
 * - 키워드에 서울,경기,인천 형태면 키워드 지역 우선으로 시/구·동 필터는 적용하지 않음.
 */
function filterShops({
  shops,
  region,
  district,
  dong,
  type,
  keyword,
}) {
  const page = typeof getPageType === 'function' ? getPageType() : 'index';
  const { regions: kwRegions, rest: kwRest } = parseKeywordRegionsAndRest(keyword);
  const kw = kwRest;

  const regionPriorityListing =
    (page === 'index' ||
      page === 'region-static' ||
      page === 'board' ||
      page === 'district-static') &&
    Boolean((region || '').trim());

  const skipDistrictDongBecauseKeywordRegions = kwRegions.length > 0;
  const skipDistrictDong =
    skipDistrictDongBecauseKeywordRegions || regionPriorityListing;

  return shops.filter((shop) => {
    const shopRegions = parseMultiValue(shop.region).map(normalizeRegionDisplay);

    if (kwRegions.length > 0) {
      if (!shopRegions.some((r) => kwRegions.includes(r))) return false;
    } else if (region) {
      const wantRegion = normalizeRegionDisplay(region);
      if (!shopRegions.length || !shopRegions.includes(wantRegion)) return false;
    }

    if (!skipDistrictDong && district) {
      const shopDistricts = parseMultiValue(shop.district);
      if (!shopDistricts.length || !shopDistricts.includes(district)) return false;
    }
    if (!skipDistrictDong && dong) {
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

  const kwRegionParts = parseKeywordRegionsAndRest(keyword);
  if (
    getPageType() === 'district-static' &&
    data.length === 0 &&
    region &&
    district &&
    !kwRegionParts.regions.length
  ) {
    let regionWide = filterShops({
      shops,
      region,
      district: '',
      dong,
      type,
      keyword,
    });
    // 경기 시·군: region이 "서울"만인데 district에 서울·경기·인천 전지역인 출장 업체가 DB에 많음 → 동일 필터로 후보에 합류
    if (normalizeRegionDisplay(region) === '경기') {
      const seen = new Set(regionWide.map((s) => s.id || s.name));
      shops.forEach((shop) => {
        const sr = parseMultiValue(shop.region).map(normalizeRegionDisplay);
        if (sr.includes('경기')) return;
        if (!sr.some((r) => ['서울', '인천'].includes(r))) return;
        const dStr = String(shop.district || '');
        if (!/서울·경기|경기·인천|서울·경기·인천|전지역|서울\.경기|인천\.경기/i.test(dStr)) {
          return;
        }
        const passes = filterShops({
          shops: [shop],
          region: '',
          district: '',
          dong,
          type,
          keyword,
        });
        if (!passes.length) return;
        const k = shop.id || shop.name;
        if (!seen.has(k)) {
          seen.add(k);
          regionWide.push(shop);
        }
      });
    }
    const relaxed = regionWide.filter((s) =>
      shopMatchesDistrictFallback(s, region, district)
    );
    if (relaxed.length) {
      data = relaxed;
    }
  }

  if (noResults) {
    noResults.hidden = data.length > 0;
  }

  const kwTrim = (keyword || '').trim();
  const isDefaultHomeView =
    normalizeRegionDisplay(region) === '강원도' &&
    !district &&
    !dong &&
    (!type || type === '출장마사지') &&
    !kwTrim;

  const ssrCardCount = container.querySelectorAll('.shop-card').length;
  if (
    container.dataset.ssrBuiltFor === '강원도' &&
    isDefaultHomeView &&
    ssrCardCount > 0 &&
    ssrCardCount === data.length
  ) {
    if (noResults) noResults.hidden = ssrCardCount > 0;
    return;
  }

  const staticDistrict = document.body.getAttribute('data-district') || '';
  const pageRegionAttr = normalizeRegionDisplay(
    document.body.getAttribute('data-region') || ''
  );
  const isDefaultDistrictView =
    getPageType() === 'district-static' &&
    staticDistrict &&
    normalizeRegionDisplay(region) === pageRegionAttr &&
    district === staticDistrict &&
    !dong &&
    !type &&
    !kwTrim;

  if (
    container.dataset.ssrDistrict === staticDistrict &&
    isDefaultDistrictView &&
    ssrCardCount > 0 &&
    ssrCardCount === data.length
  ) {
    if (noResults) noResults.hidden = ssrCardCount > 0;
    return;
  }

  container.removeAttribute('data-ssr-built-for');
  container.removeAttribute('data-ssr-district');

  const listTotalP = container
    .closest('.cards-section')
    ?.querySelector('.section-header-bottom p');
  if (listTotalP && /총\s*개\s*업체/.test(listTotalP.textContent)) {
    listTotalP.textContent = `총 ${data.length}개 업체`;
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

    const imgSrcRaw =
      shop.image ||
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=250&fit=crop&crop=center';
    const imgSrc = resolveListPageImageSrc(imgSrcRaw);
    const alt = shop.alt || `${shop.name} 마사지샵`;

    const location = formatLocationDisplay(shop);

    const greeting = shop.greeting || shop.description || '';
    const tags = safeArray(shop.services).slice(0, 3);

    const rating = shop.rating || shop.rating === 0 ? shop.rating.toFixed(1) : null;
    const reviewCount = shop.reviewCount || 0;

    const detailUrl = listPageDetailHref(shop);

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
          ${shopCardPriceRowHtml(shop)}
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

    const location = formatLocationDisplay(shop);
    const typeLabel = shop.type || safeArray(shop.tags)[0] || '출장마사지';
    const rating =
      typeof shop.rating === 'number' ? shop.rating.toFixed(1) : null;
    const reviewCount = shop.reviewCount || 0;

    const detailUrl = listPageDetailHref(shop);

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

  const pageTitleBase = `${shop.name || '출장마사지 업체'} | 바로힐링출장마사지`;
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
                    <div class="detail-course-head" aria-hidden="true">
                      <span>코스</span>
                      <span>시간</span>
                      <span>가격</span>
                    </div>
                    ${items
                      .map(
                        (item) => {
                          const desc =
                            item.description && String(item.description).trim()
                              ? `<div class="detail-course-desc">${item.description}</div>`
                              : '';
                          return `
                          <div class="detail-course-item">
                            <div class="detail-course-main">
                              <span class="detail-course-name">${item.name || ''}</span>
                              <span class="detail-course-time">${item.duration || ''}</span>
                              <span class="detail-course-price">${item.price || ''}</span>
                            </div>
                            ${desc}
                          </div>
                        `;
                        }
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
        <section class="detail-section">
          <h2>관리사 정보</h2>
          <p class="detail-description">
            ${
              shop.staffInfo
                ? shop.staffInfo
                : '관리사 정보는 예약 시 전화로 안내해드립니다.'
            }
          </p>
        </section>
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
            <p class="detail-cta-note">
              실제 예약 및 결제는 각 업체를 통해 직접 진행되며,
              바로힐링출장마사지는 정보 제공 플랫폼 역할만 수행합니다.
            </p>
          </div>
        </div>
      </aside>
    </header>
    ${
      shop.phone
        ? `
    <div class="detail-callbar">
      <a href="tel:${shop.phone.replace(/[^0-9]/g, '')}" class="detail-callbar-btn" aria-label="전화하기">
        <span>📞</span>
        전화하기
      </a>
    </div>`
        : ''
    }
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
  suppressKoreaDistrictRepaint = false;
  const shops =
    (window.shopsData?.shops?.length && window.shopsData.shops) ||
    (window.shopCardData || []);
  // shops.json이 file:// 환경에서 로딩이 실패해 shops.length가 0이어도,
  // korea-regions 데이터(inline 주입)를 이용해 필터 드롭다운은 채워야 합니다.
  // 따라서 조기 return을 제거합니다.
  const { regions, districtsByRegion, dongsByRegionDistrict } =
    buildFiltersFromData(shops);

  // @korea-regions.json 기준 강원도 districts 보정(사용자 요구)
  // region=강원도일 때 filterDistrict가 비는 케이스를 막기 위한 안전장치
  const KOREA_REGIONS_FALLBACK_GANGWON_DISTRICTS = [
    '원주',
    '춘천',
    '강릉',
    '동해',
    '속초',
    '삼척',
    '홍천',
    '태백',
    '철원',
    '횡성',
    '평창',
    '영월',
    '정선',
    '인제',
    '고성',
    '양양',
    '화천',
    '양구',
  ];

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

  function sortKo(arr) {
    return Array.from(arr).sort((a, b) => String(a).localeCompare(String(b), 'ko'));
  }

  // korea-regions.json 로딩이 실패해도 UI가 비지 않도록,
  // 초기값은 shops.json 기반으로 우선 채워둡니다.
  // 이후 korea-regions.json 로딩 성공 시 그 값으로 덮어씁니다.
  regionSelects.forEach((sel) => populateSelect(sel, Array.from(regions).sort(), '전체'));
  // district/dong은 region이 선택된 이후 updateDependent()로 채우는 구조입니다.
  // (여기서는 초기 화면이 비지 않게만 "전체" placeholder만 둡니다.)
  districtSelects.forEach((sel) => populateSelect(sel, [], '전체'));
  dongSelects.forEach((sel) => populateSelect(sel, [], '전체'));

  // korea-regions.json을 보고 시/구(filterDistrict)까지 정확한 목록으로 덮어쓰기
  // (경로가 맞지 않아 404여도 UI가 비지 않게 fallback 포함)
  let koreaRegionsLoaded = false;
  // korea-regions 로딩이 끝난 뒤에도 change 핸들러에서 즉시 사용할 수 있도록
  // region -> districts 맵을 별도로 보관합니다.
  let koreaDistrictsByRegion = {};
  if (typeof window !== 'undefined') {
    window.__koreaDistrictsByRegionMap = koreaDistrictsByRegion;
  }
  const koreaRegionsPromise = (async () => {
    const pageType = getPageType();
    const candidates =
      pageType === 'district-static' || pageType === 'region-static'
        ? ['../korea-regions.json', 'korea-regions.json']
        : ['korea-regions.json', '../korea-regions.json'];

    // 절대 경로도 시도(상대경로가 실패할 때 대비)
    try {
      const abs = new URL('/korea-regions.json', window.location.origin).toString();
      candidates.unshift(abs);
    } catch (_) {
      // ignore
    }

    let korea = null;

    // 정적 HTML 생성 시점에 inline으로 넣어준 koreaRegionsData가 있으면
    // file://에서도 네트워크 없이 바로 사용합니다.
    if (
      typeof window !== 'undefined' &&
      window.koreaRegionsData &&
      Array.isArray(window.koreaRegionsData.regions)
    ) {
      korea = window.koreaRegionsData;
    }

    // file:// 환경에서도 가능한 로딩( fetch 실패 대비 XHR 폴백 )
    async function loadKoreaJson(url) {
      // 1) fetch 우선
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res && res.ok) {
          const parsed = await res.json();
          if (parsed && Array.isArray(parsed.regions)) return parsed;
        }
      } catch (_) {
        // ignore
      }

      // 2) XHR 폴백 (file://에서 fetch가 막힐 때 대비)
      return await new Promise((resolve, reject) => {
        try {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', url, true);
          xhr.onreadystatechange = () => {
            if (xhr.readyState !== 4) return;
            // file://에서는 status가 0으로 들어오는 경우가 있음
            if (xhr.status === 0 || xhr.status === 200) {
              try {
                const parsed = JSON.parse(xhr.responseText || '{}');
                if (parsed && Array.isArray(parsed.regions)) resolve(parsed);
                else reject(new Error('invalid korea-regions json'));
              } catch (e) {
                reject(e);
              }
            } else {
              reject(new Error(`xhr status ${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error('xhr error'));
          xhr.send(null);
        } catch (e) {
          reject(e);
        }
      }).catch(() => null);
    }

    for (const url of candidates) {
      if (korea) break;
      try {
        const parsed = await loadKoreaJson(url);
        if (parsed) {
          korea = parsed;
          break;
        }
      } catch (_) {
        // try next candidate
      }
    }

    // korea-regions 실패 시 shops 기반 fallback
    if (!korea) {
      if (getPageType() === 'region-static') {
        const staticRegion = normalizeRegionDisplay(
          document.body.getAttribute('data-region') || ''
        );
        const rs = regionSelects[0];
        if (rs && staticRegion && Array.from(rs.options).some((o) => o.value === staticRegion)) {
          rs.value = staticRegion;
        }
      }
      if (!suppressKoreaDistrictRepaint) {
        districtSelects.forEach((sel, idx) => {
          if (!sel) return;
          const regionValue = normalizeRegionDisplay(
            regionSelects[idx]?.value || ''
          );
          // 지역 미선택 시: 시/구는 '전체'만 (전국 시/구 합집합 금지)
          const set = regionValue ? districtsByRegion[regionValue] || new Set() : new Set();
          populateSelect(
            sel,
            Array.from(set).sort((a, b) =>
              String(a).localeCompare(String(b), 'ko')
            ),
            '전체'
          );
        });
      }
      // fallback에서도 change 핸들러가 빈 값으로 떨어지지 않도록
      koreaDistrictsByRegion = { ...districtsByRegion };
      if (typeof window !== 'undefined') {
        window.__koreaDistrictsByRegionMap = koreaDistrictsByRegion;
      }
      koreaRegionsLoaded = true;
      return;
    }

    // 기존(shops 기반) 지역/시·구 목록을 전부 제거하고 korea-regions으로만 채움
    regions.clear();
    Object.keys(districtsByRegion).forEach((k) => delete districtsByRegion[k]);

    korea.regions.forEach((r) => {
      const regionKey = normalizeRegionDisplay(r?.name || '');
      if (!regionKey) return;
      regions.add(regionKey);

      const districtList = Array.isArray(r?.districts) ? r.districts : [];
      const set = new Set(
        districtList.map((d) => String(d || '').trim()).filter(Boolean)
      );
      districtsByRegion[regionKey] = set;
      koreaDistrictsByRegion[regionKey] = set;
    });

    // UI 갱신
    // - filterRegion: korea-regions.regions[].name
    // - filterDistrict: korea-regions.regions[].districts
    const regionOptions = sortKo(regions);
    regionSelects.forEach((sel) =>
      populateSelect(sel, regionOptions, '전체')
    );

    // regions/*.html: korea 기준 지역 옵션이 생긴 뒤 data-region을 맞춰야 시/구가 해당 지역으로 채워짐
    if (getPageType() === 'region-static') {
      const staticRegion = normalizeRegionDisplay(
        document.body.getAttribute('data-region') || ''
      );
      const rs = regionSelects[0];
      if (rs && staticRegion && Array.from(rs.options).some((o) => o.value === staticRegion)) {
        rs.value = staticRegion;
      }
    }

    if (!suppressKoreaDistrictRepaint) {
      regionSelects.forEach((sel, idx) => {
        const regionValue = normalizeRegionDisplay(sel?.value || '');
        // 지역 선택 전에는 시/구 목록을 비움 — 선택한 지역에 맞는 시/구만 표시
        const districtSet = regionValue
          ? koreaDistrictsByRegion[regionValue] || new Set()
          : new Set();
        const normalizedDistricts =
          districtSet &&
          districtSet.size === 0 &&
          regionValue === '강원도'
            ? new Set(KOREA_REGIONS_FALLBACK_GANGWON_DISTRICTS)
            : districtSet;
        populateSelect(
          districtSelects[idx],
          Array.from(normalizedDistricts).sort((a, b) =>
            String(a).localeCompare(String(b), 'ko')
          ),
          '전체'
        );
        updateDependent(regionValue, '', idx);
      });
    }
    koreaRegionsLoaded = true;
    if (typeof window !== 'undefined' && korea) {
      window.koreaRegionsData = korea;
    }
    initBaroBlocksForStaticPages();
  })();

  function updateDependent(regionValue, districtValue, fromRegionIdx) {
    // korea-regions의 "시/구" 옵션은 별도로 populate(= 덮어쓰기)하므로,
    // 여기서는 dong/동/읍/면만 shops.json 기반 dongsByRegionDistrict로 갱신합니다.
    const regionKey = regionValue ? normalizeRegionDisplay(regionValue) : '';
    const districtKey = districtValue || '';
    const effectiveDistrict =
      districtKey ||
      (fromRegionIdx !== undefined &&
      districtSelects[fromRegionIdx] &&
      districtSelects[fromRegionIdx].value
        ? districtSelects[fromRegionIdx].value
        : '');

    const key = regionKey && effectiveDistrict
      ? `${regionKey}::${effectiveDistrict}`
      : '';
    // 동/읍/면은 shops.json 기반 dongsByRegionDistrict를 사용하므로,
    // 지역/시/구가 비어있으면 전체를 보여주기보단 "전체"만 유지합니다.
    const dongs = (key && dongsByRegionDistrict[key]) || new Set();
    dongSelects.forEach((sel) =>
      populateSelect(sel, Array.from(dongs).sort(), '전체')
    );
  }

  regionSelects.forEach((sel, idx) => {
    if (!sel) return;
    sel.addEventListener('change', async () => {
      const val = sel.value;

      // korea-regions가 아직 로딩되지 않았는데 지역을 바꿨을 때
      // filterDistrict가 비는 것을 방지합니다.
      if (!koreaRegionsLoaded && koreaRegionsPromise) {
        try {
          await koreaRegionsPromise;
        } catch (_) {
          // ignore
        }
      }

      // korea-regions 기반으로 시/구 옵션을 먼저 "덮어쓰기"
      // (updateDependent()는 dong만 갱신하므로, district는 여기서 처리)
      const regionKey = val ? normalizeRegionDisplay(val) : '';
      // 지역 '전체'일 때는 시/구도 비움 — 지역 고른 뒤에만 해당 시/구 표시
      const districtsSet = regionKey
        ? koreaDistrictsByRegion[regionKey] || new Set()
        : new Set();
      const normalizedDistricts =
        districtsSet &&
        districtsSet.size === 0 &&
        regionKey === '강원도'
          ? new Set(KOREA_REGIONS_FALLBACK_GANGWON_DISTRICTS)
          : districtsSet;
      const districtOptions = Array.from(normalizedDistricts).sort((a, b) =>
        String(a).localeCompare(String(b), 'ko')
      );
      districtSelects.forEach((dSel) => {
        if (!dSel) return;
        populateSelect(dSel, districtOptions, '전체');
      });

      // "전체"를 고르면 필터 값을 확실히 초기화해서
      // 이전 선택(시/구/동/테마/키워드) 때문에 카드가 비는 상황을 방지합니다.
      if (!val) {
        const distEl = document.getElementById('filterDistrict');
        const dongEl = document.getElementById('filterDong');
        const typeEl = document.getElementById('filterType');
        const keywordEl = document.getElementById('filterKeyword');

        updateDependent('', '', idx);
        if (distEl) distEl.value = '';
        if (dongEl) dongEl.value = '';
        if (typeEl) typeEl.value = '';
        if (keywordEl) keywordEl.value = '';

        isHomeOrDistrictListPage() ? renderMainCards() : renderBoardList();
        return;
      }

      updateDependent(val, '', idx);
      if (isHomeOrDistrictListPage()) {
        const selectedRegion = normalizeRegionDisplay(val);
        const districtValue =
          document.getElementById('filterDistrict')?.value || '';
        const dongValue = document.getElementById('filterDong')?.value || '';
        const typeEl = document.getElementById('filterType');
        const keywordEl = document.getElementById('filterKeyword');

        const shouldGoRegionStatic =
          !!selectedRegion && !districtValue && !dongValue;

        if (shouldGoRegionStatic) {
          // 지역만 선택했을 때는 테마/키워드 값이 남아있더라도
          // 정적 "지역 리스트" 화면으로 깔끔하게 이동하도록 초기화합니다.
          if (typeEl) typeEl.value = '';
          if (keywordEl) keywordEl.value = '';

          const currentRegion = normalizeRegionDisplay(
            document.body.getAttribute('data-region') || ''
          );
          if (
            getPageType() === 'region-static' &&
            currentRegion === selectedRegion
          ) {
            renderMainCards();
            return;
          }
          // 시·군 정적: 초기 hydrate 중엔 regions/로 이동하지 않음(아래 setLocation만 사용자 조작에 적용)
          if (getPageType() === 'district-static' && districtStaticFilterHydrating) {
            renderMainCards();
            return;
          }
          setLocationRelativeSafe(
            regionListTargetHref(regionListFileName(selectedRegion))
          );
          return;
        }

        renderMainCards();
      } else {
        renderBoardList();
      }
    });
  });

  // 홈(index): ?region= 이 있으면 해당 지역, 없으면 기본 강원도 (로고/메인 링크는 index.html?region=강원도 권장)
  if (getPageType() === 'index') {
    const regionSel = regionSelects[0];
    if (regionSel) {
      const params = new URLSearchParams(window.location.search);
      const rp = params.get('region');
      let want = rp ? normalizeRegionDisplay(rp) : '강원도';
      if (!Array.from(regionSel.options).some((o) => o.value === want)) {
        want = '강원도';
      }
      if (Array.from(regionSel.options).some((o) => o.value === want)) {
        regionSel.value = want;
        regionSel.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }

  districtSelects.forEach((sel, idx) => {
    if (!sel) return;
    sel.addEventListener('change', () => {
      const regionVal = regionSelects[idx]?.value || '';
      const districtVal = sel.value || '';

      // region-static에서 시/구를 선택하면 즉시 해당 정적 시/군 페이지로 이동
      // (사용자 요청: 클릭 시 정적 HTML이 반드시 바뀌어야 함)
      if (
        getPageType() === 'region-static' &&
        sel.id === 'filterDistrict' &&
        districtVal
      ) {
        const staticRegion = normalizeRegionDisplay(
          document.body.getAttribute('data-region') || ''
        );
        if (staticRegion) {
          const dResolved = resolveDistrictForStaticFilename(
            staticRegion,
            districtVal
          );
          const fileName = districtListFileName(staticRegion, dResolved);
          navigateToDistrictStaticHtml(fileName);
          return;
        }
        // data-region 없으면 아래에서 동·카드만 갱신
      }

      // 홈/지역/시·군 정적: 시/군 변경 시 테마·키워드와 무관하게 해당 정적 HTML로 이동(연동)
      if (
        isHomeOrDistrictListPage() &&
        sel.id === 'filterDistrict' &&
        regionVal &&
        districtVal
      ) {
        const dResolved = resolveDistrictForStaticFilename(
          regionVal,
          districtVal
        );
        const fileName = districtListFileName(regionVal, dResolved);
        const onDistrictRaw = document.body.getAttribute('data-district');
        const onRegion = normalizeRegionDisplay(
          document.body.getAttribute('data-region') || ''
        );
        const onDistrictResolved = onDistrictRaw
          ? resolveDistrictForStaticFilename(onRegion, onDistrictRaw)
          : '';
        const sameDistrictStaticPage =
          getPageType() === 'district-static' &&
          onDistrictResolved &&
          onDistrictResolved === dResolved &&
          onRegion === normalizeRegionDisplay(regionVal);

        if (!sameDistrictStaticPage) {
          navigateToDistrictStaticHtml(fileName);
          return;
        }
      }

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
      isHomeOrDistrictListPage() ? renderMainCards() : renderBoardList();
    });
  });

  dongSelects.forEach((sel) => {
    if (!sel) return;
    sel.addEventListener('change', () => {
      isHomeOrDistrictListPage() ? renderMainCards() : renderBoardList();
    });
  });

  const typeSelects = [
    document.getElementById('filterType'),
    document.getElementById('filterTypeBoard'),
  ];
  typeSelects.forEach((sel) => {
    if (!sel) return;
    sel.addEventListener('change', () => {
      isHomeOrDistrictListPage() ? renderMainCards() : renderBoardList();
    });
  });

  const kwInput = document.getElementById('filterKeyword');
  const kwBoard = document.getElementById('filterKeywordBoard');
  [kwInput, kwBoard].forEach((el) => {
    if (!el) return;
    el.addEventListener('input', () => {
      isHomeOrDistrictListPage() ? renderMainCards() : renderBoardList();
    });
  });

  // 시·군 정적 페이지: data-region/data-district 반영 (korea 로드 후 실행해야 시/구 옵션 존재)
  if (getPageType() === 'district-static') {
    const staticDistrictRaw = document.body.getAttribute('data-district');
    const staticRegion = normalizeRegionDisplay(
      document.body.getAttribute('data-region') || '강원도'
    );
    const regionSel = regionSelects[0];
    const distSel = document.getElementById('filterDistrict');

    const runDistrictStaticInit = () => {
      if (!regionSel || !staticDistrictRaw) return;
      const dResolved = resolveDistrictForStaticFilename(
        staticRegion,
        staticDistrictRaw
      );
      districtStaticFilterHydrating = true;
      try {
        if (Array.from(regionSel.options).some((o) => o.value === staticRegion)) {
          regionSel.value = staticRegion;
        }
        regionSel.dispatchEvent(new Event('change', { bubbles: true }));
        if (distSel) {
          const want =
            Array.from(distSel.options).some((o) => o.value === dResolved)
              ? dResolved
              : Array.from(distSel.options).some((o) => o.value === staticDistrictRaw)
                ? staticDistrictRaw
                : '';
          if (want) distSel.value = want;
        }
        distSel?.dispatchEvent(new Event('change', { bubbles: true }));
      } finally {
        districtStaticFilterHydrating = false;
      }
    };

    if (koreaRegionsLoaded) {
      runDistrictStaticInit();
    } else if (koreaRegionsPromise) {
      koreaRegionsPromise
        .then(() => runDistrictStaticInit())
        .catch(() => runDistrictStaticInit());
    } else {
      runDistrictStaticInit();
    }
  }
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
        (document.getElementById('filterKeyword')?.value || '').trim();

      // 지역만 선택한 경우 -> 지역 정적 페이지로 이동
      if (
        region &&
        !district &&
        !dong
      ) {
        const onRegion = normalizeRegionDisplay(
          document.body.getAttribute('data-region') || ''
        );
        if (
          getPageType() === 'region-static' &&
          onRegion === normalizeRegionDisplay(region)
        ) {
          renderMainCards();
          return;
        }
        setLocationRelativeSafe(regionListTargetHref(regionListFileName(region)));
        return;
      }

      // 홈/지역 정적에서 지역+시/군 선택 시 -> 정적 시/군 페이지로 이동(테마·키워드 있어도 동일, 연동)
      if (region && district && !dong) {
        const dResolved = resolveDistrictForStaticFilename(region, district);
        const fileName = districtListFileName(region, dResolved);
        const onDistrictRaw = document.body.getAttribute('data-district');
        const onRegion = normalizeRegionDisplay(
          document.body.getAttribute('data-region') || ''
        );
        const onDistrictResolved = onDistrictRaw
          ? resolveDistrictForStaticFilename(onRegion, onDistrictRaw)
          : '';
        const sameDistrictStaticPage =
          getPageType() === 'district-static' &&
          onDistrictResolved &&
          onDistrictResolved === dResolved &&
          onRegion === normalizeRegionDisplay(region);

        if (sameDistrictStaticPage) {
          renderMainCards();
          return;
        }
        navigateToDistrictStaticHtml(fileName);
        return;
      }

      // GitHub Pages(서브패스)에서도 안전하게 상대경로 사용
      const url = new URL(boardListHref(), window.location.href);
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
  const region = normalizeRegionDisplay(params.get('region') || '');
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

/** 시·군 정적 페이지 바로가기 링크 문구 (links.html 과 동일 규칙) */
const BARO_AMBIGUOUS_DISTRICT = new Set([
  '중구',
  '서구',
  '남구',
  '북구',
  '동구',
  '강서구',
]);

function baroDistrictLinkLabel(regionName, districtName) {
  if (BARO_AMBIGUOUS_DISTRICT.has(districtName)) {
    return `${regionName}${districtName}출장마사지`;
  }
  return `${districtName}출장마사지`;
}

/**
 * URL 파일명에서 지역·시군 추출
 * - regions/서울출장마사지.html → region만
 * - districts/경기-수원출장마사지.html → region + district
 * - districts/강릉출장마사지.html → district만(지역은 infer 또는 data-region)
 */
function parseStaticPathRegionDistrict() {
  if (typeof window === 'undefined' || !window.location) {
    return { region: '', district: '', inDistricts: false, inRegions: false };
  }
  const rawPath = decodeURIComponent(
    (window.location.pathname || '').replace(/\\/g, '/')
  );
  const seg = rawPath.split('/').pop() || '';
  const inDistricts = /(^|\/)districts\//i.test(rawPath);
  const inRegions = /(^|\/)regions\//i.test(rawPath);

  const mPair = /^(.+)-(.+)출장마사지\.html$/i.exec(seg);
  if (mPair) {
    return {
      region: mPair[1].trim(),
      district: mPair[2].trim(),
      inDistricts,
      inRegions,
    };
  }
  const mSingle = /^(.+)출장마사지\.html$/i.exec(seg);
  if (mSingle) {
    const token = mSingle[1].trim();
    if (inRegions) {
      return { region: token, district: '', inDistricts, inRegions };
    }
    if (inDistricts) {
      return { region: '', district: token, inDistricts, inRegions };
    }
    return { region: '', district: token, inDistricts: true, inRegions: false };
  }
  return { region: '', district: '', inDistricts, inRegions };
}

function inferRegionFromDistrictName(districtName) {
  const dn = String(districtName || '').trim();
  if (!dn || !window.koreaRegionsData?.regions) return '';
  for (const r of window.koreaRegionsData.regions) {
    const districts = r.districts || [];
    if (districts.includes(dn)) {
      return normalizeRegionDisplay(r.name || '');
    }
  }
  return '';
}

/**
 * 시·군(district-static) / 지역(region-static) 페이지 본문 하단에 바로가기 블록 삽입
 */
function initBaroBlocksForStaticPages() {
  const main = document.querySelector('main.site-main');
  if (!main || document.getElementById('staticBaroSection')) return;

  const page = getPageType();
  const korea = window.koreaRegionsData;
  if (!korea?.regions?.length) return;

  const pathParsed = parseStaticPathRegionDistrict();

  if (page === 'district-static') {
    let region = '';
    let district = '';

    if (pathParsed.region && pathParsed.district) {
      region = normalizeRegionDisplay(pathParsed.region);
      district = pathParsed.district;
    } else if (pathParsed.inDistricts && pathParsed.district && !pathParsed.region) {
      district = pathParsed.district;
      region = normalizeRegionDisplay(
        document.body.getAttribute('data-region') || ''
      );
      if (!region) region = inferRegionFromDistrictName(district);
    } else {
      region = normalizeRegionDisplay(
        document.body.getAttribute('data-region') || ''
      );
      district = String(
        document.body.getAttribute('data-district') || ''
      ).trim();
    }

    if (!region) return;

    const regionEntry = korea.regions.find(
      (r) => normalizeRegionDisplay(r.name) === region
    );
    if (!regionEntry) return;

    const districts = regionEntry.districts || [];
    const regionFile = encodeURI(`../regions/${region}출장마사지.html`);
    const linksFile = encodeURI('../links.html');

    const linksHtml = districts
      .map((d) => {
        const file = encodeURI(`${region}-${d}출장마사지.html`);
        const href = `../districts/${file}`;
        const label = baroDistrictLinkLabel(region, d);
        const isCurrent =
          district &&
          (d === district ||
            resolveDistrictForStaticFilename(region, district) === d);
        const cls = isCurrent
          ? 'static-baro-link is-current'
          : 'static-baro-link';
        return `<a class="${cls}" href="${href}">${escapeHtmlBaro(label)}</a>`;
      })
      .join('');

    const section = document.createElement('section');
    section.id = 'staticBaroSection';
    section.className = 'static-baro-section';
    section.setAttribute('aria-label', '바로가기');
    section.innerHTML =
      '<div class="container static-baro-inner">' +
      '<h2 class="static-baro-title">바로가기</h2>' +
      '<p class="static-baro-lead">' +
      '<a href="' +
      linksFile +
      '">전국 지역·시군구 목록</a>' +
      '</p>' +
      '<p class="static-baro-lead">' +
      '<a href="' +
      regionFile +
      '">' +
      escapeHtmlBaro(`${region}출장마사지`) +
      '</a>' +
      '</p>' +
      '<div class="static-baro-grid">' +
      linksHtml +
      '</div>' +
      '</div>';

    main.appendChild(section);
    return;
  }

  if (page === 'region-static') {
    let region = normalizeRegionDisplay(
      document.body.getAttribute('data-region') || ''
    );
    if (!region && pathParsed.inRegions && pathParsed.region) {
      region = normalizeRegionDisplay(pathParsed.region);
    }
    if (!region) return;

    const regionEntry = korea.regions.find(
      (r) => normalizeRegionDisplay(r.name) === region
    );
    if (!regionEntry) return;

    const districts = regionEntry.districts || [];
    const linksFile = encodeURI('../links.html');

    const linksHtml = districts
      .map((d) => {
        const file = encodeURI(`${region}-${d}출장마사지.html`);
        const href = `../districts/${file}`;
        const label = baroDistrictLinkLabel(region, d);
        return (
          '<a class="static-baro-link" href="' +
          href +
          '">' +
          escapeHtmlBaro(label) +
          '</a>'
        );
      })
      .join('');

    const section = document.createElement('section');
    section.id = 'staticBaroSection';
    section.className = 'static-baro-section';
    section.setAttribute('aria-label', '바로가기');
    section.innerHTML =
      '<div class="container static-baro-inner">' +
      '<h2 class="static-baro-title">바로가기</h2>' +
      '<p class="static-baro-lead">' +
      '<a href="' +
      linksFile +
      '">전국 지역·시군구 목록</a>' +
      '</p>' +
      '<p class="static-baro-sub">' +
      escapeHtmlBaro(region) +
      ' 시·군·구</p>' +
      '<div class="static-baro-grid">' +
      linksHtml +
      '</div>' +
      '</div>';

    main.appendChild(section);
  }
}

function escapeHtmlBaro(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 지역/시군 정적 페이지: 화면 하단에 고정(스크롤 시에도 유지) 출장마사지·마사지 바 삽입 */
function ensureFloatingServiceBar() {
  const page = getPageType();
  if (page !== 'region-static' && page !== 'district-static') return;
  if (document.getElementById('homeServiceBarFloating')) return;
  const typeSel = document.getElementById('filterType');
  if (!typeSel) return;

  const wrap = document.createElement('div');
  wrap.id = 'homeServiceBarFloating';
  wrap.className = 'home-service-bar home-service-bar--floating';
  wrap.setAttribute('aria-label', '서비스 유형 선택');
  wrap.innerHTML =
    '<div id="homeServiceToggleFloating" class="home-service-toggle" role="tablist" aria-label="출장마사지 또는 마사지">' +
    '<button type="button" class="home-service-btn is-active" data-value="출장마사지" role="tab" aria-selected="true">출장마사지</button>' +
    '<button type="button" class="home-service-btn" data-value="마사지" role="tab" aria-selected="false">마사지</button>' +
    '</div>';
  document.body.appendChild(wrap);
}

// 홈(index): 인라인 + 모바일 하단 고정 / 지역·시군: 하단 고정 바 — 모두 #filterType 과 연동
function initServiceTypeToggle() {
  const page = getPageType();
  if (page === 'region-static' || page === 'district-static') {
    ensureFloatingServiceBar();
  }
  if (page !== 'index' && page !== 'region-static' && page !== 'district-static') return;

  const typeSel = document.getElementById('filterType');
  if (!typeSel) return;

  const allBtns = document.querySelectorAll('.home-service-btn');
  if (!allBtns.length) return;

  function syncBarFromSelect() {
    const v = typeSel.value;
    allBtns.forEach((btn) => {
      const match = v === btn.dataset.value;
      btn.classList.toggle('is-active', match);
      btn.setAttribute('aria-selected', match ? 'true' : 'false');
    });
  }

  if (!typeSel.value) {
    typeSel.value = '출장마사지';
  }
  syncBarFromSelect();

  allBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.value;
      if (!val) return;
      typeSel.value = val;
      typeSel.dispatchEvent(new Event('change', { bubbles: true }));
      syncBarFromSelect();
    });
  });

  typeSel.addEventListener('change', syncBarFromSelect);
}

/** 카드 내 전화 span 클릭 시 상세 링크 대신 tel: (캡처 단계에서 처리) */
function initShopCardPhoneDelegation() {
  if (typeof document === 'undefined' || document.documentElement.dataset.shopCardPhoneInit) {
    return;
  }
  document.documentElement.dataset.shopCardPhoneInit = '1';
  document.addEventListener(
    'click',
    (e) => {
      const el = e.target.closest('.shop-card-phone[data-tel]');
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      const tel = el.getAttribute('data-tel');
      if (tel) window.location.href = `tel:${tel}`;
    },
    true
  );
}

// 초기화
window.addEventListener('DOMContentLoaded', () => {
  if (!window.shopsData) {
    console.warn('shopsData가 로드되지 않았습니다.');
  }

  initCurrentYear();
  initShopCardPhoneDelegation();
  initFilterUI();
  initForms();
  initServiceTypeToggle();
  initBaroBlocksForStaticPages();

  const page = getPageType();
  if (page === 'index' || page === 'district-static') {
    renderMainCards();
  } else if (page === 'region-static') {
    renderMainCards();
  } else if (page === 'board') {
    applyQueryParamsToBoardFilters();
    renderBoardList();
  } else if (page === 'detail') {
    renderDetailPage();
  }
});

