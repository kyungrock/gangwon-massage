/**
 * build-district-pages.js
 *
 * shops.json (window.shopsData.shops)을 기반으로
 * 강원도 district(시/군)별 정적 "리스트" 페이지를 생성합니다.
 *
 * 사용법:
 *   node build-district-pages.js
 *
 * 출력:
 *   districts/<district>출장마사지.html
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { renderHeroSearchHtml } = require('./hero-search-ssr.js');
const { SITE_ORIGIN } = require('./site.config.js');

const ROOT = __dirname;
const SHOPS_FILE = path.join(ROOT, 'shops.json');
const OUT_DIR = path.join(ROOT, 'districts');
const ASSET_VERSION = '20260319-2';

const KANGWON_DISTRICTS = [
  '춘천',
  '원주',
  '강릉',
  '동해',
  '태백',
  '속초',
  '삼척',
  '홍천',
  '횡성',
  '영월',
  '평창',
  '정선',
  '철원',
  '화천',
  '양구',
  '고성',
  '양양',
];

const DISTRICT_SEO = {
  춘천: {
    vibe: '호수·도심 이동이 함께 있는 지역',
    audience: '커플, 여행객, 퇴근 후 피로 회복이 필요한 직장인',
    highlights: [
      '숙소·호텔에서 바로 받는 출장형 관리 수요',
      '장거리 이동/관광 후 하체·어깨 중심 피로 케어',
      '야간 시간대 예약 선호가 많은 편',
    ],
    tips: [
      '예약 전 도착 가능 시간과 추가요금(거리/심야)을 확인하세요.',
      '코스는 60/90/120분 구성인지, 오일 사용 여부를 체크하세요.',
      '후기에서 “압/소통/위생” 키워드를 우선적으로 보세요.',
    ],
  },
  원주: {
    vibe: '도심 생활권 중심의 야간 수요가 강한 지역',
    audience: '직장인, 자영업자, 장거리 운전이 잦은 이용자',
    highlights: [
      '심야 시간대 피로 회복형 코스 선호',
      '어깨·허리·종아리 위주의 집중관리 수요',
      '빠른 도착/예약 응대 속도가 중요',
    ],
    tips: [
      '폰 OFF/마감 정책이 있는지 영업시간 표기를 확인하세요.',
      '코스에 포함된 프로그램(타이/아로마/스웨디시)을 비교하세요.',
      '가격은 “최저~” 표기일 수 있으니 정확한 구성 확인이 안전합니다.',
    ],
  },
  강릉: {
    vibe: '바다 여행·숙소 밀집 지역으로 힐링 수요가 큰 지역',
    audience: '여행객, 숙소 이용자, 커플·친구 단위',
    highlights: [
      '숙소에서 편하게 받는 출장마사지 선택이 많음',
      '바다 산책/관광 후 전신 이완 관리 수요',
      '스웨디시·아로마 등 릴렉싱 계열 선호',
    ],
    tips: [
      '숙소 출입/주차 가능 여부를 미리 공유하면 도착이 빨라집니다.',
      '오일 사용 코스는 샤워/수건 제공 여부를 확인하세요.',
      '후기에서 “마무리까지 꼼꼼함/압 조절” 언급이 많은 곳을 우선 추천합니다.',
    ],
  },
  동해: {
    vibe: '해안권 이동이 잦고 체력 소모가 큰 지역',
    audience: '출장·여행 겸 방문, 장거리 운전자',
    highlights: [
      '근육 뭉침(등/어깨) 위주 케어 수요',
      '시간 약속 정확도가 만족도를 좌우',
      '관리사 숙련도 차이가 체감되는 편',
    ],
    tips: [
      '주소를 “건물명/호수”까지 정확히 전달하세요.',
      '도착 지연 시 연락 방식(전화/문자)을 미리 정하세요.',
      '과도한 홍보 문구보다 실제 후기 내용을 우선하세요.',
    ],
  },
  태백: {
    vibe: '고지대·기온 변화로 몸이 쉽게 뻐근해지는 지역',
    audience: '장거리 이동자, 등산/레저 이용자',
    highlights: [
      '허리·하체 라인 피로 케어 수요',
      '온열/오일 관리 선호도가 높음',
      '예약 가능 시간대가 업체별로 크게 갈릴 수 있음',
    ],
    tips: [
      '심야 이용 계획이면 “가능 시간”을 먼저 확인하세요.',
      '근육통이 심하면 강한 압보다 단계적 압 조절이 안전합니다.',
      '추가 비용(거리/주차/심야) 유무를 명확히 확인하세요.',
    ],
  },
  속초: {
    vibe: '관광 성수기 변동이 큰 숙소 중심 지역',
    audience: '여행객, 가족/커플, 단기 체류자',
    highlights: [
      '숙소 방문형 관리에 대한 니즈가 높음',
      '전신 릴렉싱 + 종아리/발 집중 관리 수요',
      '예약 경쟁이 성수기엔 빨라지는 편',
    ],
    tips: [
      '당일 예약은 가능한 시간대를 먼저 물어보는 게 빠릅니다.',
      '코스 시간 대비 실제 관리 시간이 충분한지 확인하세요.',
      '캔슬/노쇼 정책이 있는지 체크하면 분쟁이 줄어듭니다.',
    ],
  },
  삼척: {
    vibe: '해안·자연 이동이 많아 피로 누적이 쉬운 지역',
    audience: '레저/관광 이용자, 장거리 운전자',
    highlights: [
      '등/어깨/허리 중심 피로 회복 수요',
      '조용한 숙소에서 받는 출장 관리 선호',
      '야간 도착 가능 여부가 중요',
    ],
    tips: [
      '숙소 위치(해변/시내)에 따라 도착 시간이 달라질 수 있어요.',
      '서비스 종류(타이/아로마/스웨디시)와 기대효과를 맞추세요.',
      '후기에서 “위생/준비물/응대”를 우선 체크하세요.',
    ],
  },
  홍천: {
    vibe: '펜션·리조트·레저 중심 체류 수요가 있는 지역',
    audience: '단체 여행객, 가족, 레저 이용자',
    highlights: [
      '하체 피로(종아리/허벅지) 케어 수요',
      '숙소 방문형으로 편의성이 중요',
      '예약은 주말에 몰리는 편',
    ],
    tips: [
      '숙소 주차/출입 정보를 미리 주면 안내가 쉬워집니다.',
      '단체라면 순서/시간 배분을 사전에 조율하세요.',
      '강한 압이 필요하면 미리 요청하는 게 좋습니다.',
    ],
  },
  횡성: {
    vibe: '인근 생활권과 이동 연결이 많은 지역',
    audience: '출장 방문자, 장거리 이동자',
    highlights: [
      '피로 누적형 이용(등/어깨) 수요',
      '시간 약속과 빠른 응대가 중요',
      '코스 구성 비교가 만족도를 좌우',
    ],
    tips: [
      '지역 범위(읍/면 포함) 출장 가능 여부를 확인하세요.',
      '가격은 코스/시간/관리 종류에 따라 체감 차이가 큽니다.',
      '후기에서 재방문 언급이 있는지 보세요.',
    ],
  },
  영월: {
    vibe: '자연·관광 이동 후 휴식 수요가 생기는 지역',
    audience: '여행객, 장거리 운전자, 숙소 이용자',
    highlights: [
      '전신 이완 + 허리/하체 케어 수요',
      '숙소 기반 편의성이 중요',
      '예약 시간 조율이 핵심',
    ],
    tips: [
      '도착 시간 범위(예: 30분 단위)를 미리 합의하면 편합니다.',
      '오일 사용 코스는 알레르기/피부 민감도 체크를 권장합니다.',
      '후기에서 “시간 채움/관리 집중도”를 확인하세요.',
    ],
  },
  평창: {
    vibe: '계절 레저 수요가 강하고 피로가 누적되는 지역',
    audience: '레저/스키 이용자, 여행객',
    highlights: [
      '하체·허리 피로 케어 수요가 큼',
      '온열/아로마 계열 선호가 있음',
      '성수기 예약은 빨리 마감될 수 있음',
    ],
    tips: [
      '성수기에는 원하는 시간대가 빠르게 찹니다.',
      '근육통이 심하면 관리 강도를 단계적으로 요청하세요.',
      '숙소 위치에 따라 추가요금이 붙는지 확인하세요.',
    ],
  },
  정선: {
    vibe: '자연·이동 중심으로 근육 피로가 쌓이기 쉬운 지역',
    audience: '여행객, 레저 이용자, 장거리 이동자',
    highlights: [
      '등/허리/하체 중심 케어 수요',
      '조용한 숙소에서 받는 출장 선호',
      '야간 가능 여부가 선택 포인트',
    ],
    tips: [
      '가능한 경우 “도착 예상 시간”을 문자로 받으면 안정적입니다.',
      '관리 종류에 따라 체감이 달라 코스 설명을 꼭 확인하세요.',
      '후기에서 “압 조절/커뮤니케이션”을 체크하세요.',
    ],
  },
  철원: {
    vibe: '이동·업무 후 피로 회복 수요가 있는 지역',
    audience: '업무/출장 방문자, 장거리 이동자',
    highlights: [
      '어깨·등 뭉침 케어 수요',
      '시간 약속과 응대 품질이 중요',
      '무리 없는 코스 선택이 만족도를 높임',
    ],
    tips: [
      '주소 전달 시 “읍/면/리”까지 포함하면 정확합니다.',
      '코스 시간을 늘리는 것이 반드시 좋은 건 아니니 목적에 맞추세요.',
      '가격 대비 구성(오일/건식/스트레칭)을 비교하세요.',
    ],
  },
  화천: {
    vibe: '계절 행사/이동으로 피로가 쌓이기 쉬운 지역',
    audience: '여행객, 이동이 많은 이용자',
    highlights: [
      '하체/어깨 피로 회복 수요',
      '숙소 방문형 편의성 중요',
      '예약 가능 시간이 업체별로 상이',
    ],
    tips: [
      '가능 시간대를 먼저 확인하고, 코스는 그 다음 고르는 게 빠릅니다.',
      '오일/건식 선호를 미리 말하면 매칭이 쉬워집니다.',
      '후기에서 “위생/준비물” 키워드를 체크하세요.',
    ],
  },
  양구: {
    vibe: '이동 거리 변수로 시간 조율이 중요한 지역',
    audience: '출장/업무 방문자, 장거리 이동자',
    highlights: [
      '시간 약속, 추가요금 명확성이 중요',
      '등/허리 중심 피로 케어 수요',
      '응대 속도가 만족도에 영향',
    ],
    tips: [
      '거리/심야 추가요금이 있는지 먼저 확인하세요.',
      '코스 설명(관리 범위/시간)을 꼼꼼히 비교하세요.',
      '후기에서 불만 포인트가 반복되는지 체크하세요.',
    ],
  },
  고성: {
    vibe: '해안권 체류·숙소 중심 힐링 수요가 있는 지역',
    audience: '여행객, 커플, 단기 체류자',
    highlights: [
      '숙소에서 받는 출장형 관리 선호',
      '전신 이완 + 하체 피로 회복 수요',
      '성수기 예약 경쟁이 있을 수 있음',
    ],
    tips: [
      '숙소 위치에 따라 도착 시간이 달라질 수 있어요.',
      '코스는 “전신/부분/스트레칭 포함” 여부를 확인하세요.',
      '후기에서 “응대/시간 엄수”를 우선 보세요.',
    ],
  },
  양양: {
    vibe: '레저·해안 활동 후 피로 회복 수요가 큰 지역',
    audience: '서핑/레저 이용자, 여행객',
    highlights: [
      '하체/어깨 중심 뭉침 케어 수요',
      '릴렉싱 계열(아로마/스웨디시) 선호',
      '당일 예약은 시간대 조율이 핵심',
    ],
    tips: [
      '운동 후라면 강한 압보다 근막 이완 중심이 만족도가 높을 수 있어요.',
      '오일 코스는 샤워 가능 여부를 확인하세요.',
      '후기에서 “피로가 풀림/재방문” 언급을 우선 체크하세요.',
    ],
  },
};

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

function toDistrictAssetUrl(u) {
  const s = String(u || '').trim();
  if (!s) return s;
  if (isProbablyRemoteUrl(s)) return s;
  // districts/ 하위에서 루트 자산(images 등)을 안전하게 참조
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

/** 홈 app.js formatLocationDisplay 와 동일 */
function formatLocationDisplay(shop) {
  const region = parseMultiValue(shop.region).map(normalizeRegionDisplay).join(' ');
  const district = parseMultiValue(shop.district).join(' ');
  const dong = parseMultiValue(shop.dong).join(' ');
  return [region, district, dong].filter(Boolean).join(' ');
}

/** 홈 app.js formatPrice 와 동일 */
function formatPrice(price) {
  return price || '가격 문의';
}

function toAbsoluteAssetUrl(u) {
  const s = String(u || '').trim();
  if (!s) return undefined;
  if (isProbablyRemoteUrl(s)) return s;
  const pathPart = s.replace(/^\.\.\//, '').replace(/^\//, '');
  return `${SITE_ORIGIN}/${pathPart}`;
}

function buildDistrictJsonLd({ district, filtered, canonicalUrl }) {
  const items = filtered.map((shop, idx) => {
    const imgRaw = shop.image || '';
    const img = imgRaw ? toAbsoluteAssetUrl(imgRaw) : undefined;
    const url = shop.id || shop.name
      ? `${SITE_ORIGIN}/detail.html?id=${encodeURIComponent(String(shop.id || shop.name))}`
      : undefined;
    return {
      '@type': 'ListItem',
      position: idx + 1,
      url,
      item: {
        '@type': 'LocalBusiness',
        name: shop.name || '출장마사지 업체',
        image: img,
        telephone: shop.phone || undefined,
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'KR',
          addressRegion: shop.region || '강원',
          addressLocality: shop.district || district,
          streetAddress: shop.address || undefined,
        },
        aggregateRating:
          typeof shop.rating === 'number'
            ? {
                '@type': 'AggregateRating',
                ratingValue: shop.rating,
                reviewCount: shop.reviewCount || 0,
              }
            : undefined,
      },
    };
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${district} 출장마사지`,
    url: canonicalUrl,
    about: `강원 ${district} 출장마사지`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: items,
    },
  };
}

function renderDistrictListPage({ district, shops, year }) {
  const heroSearchHtml = renderHeroSearchHtml(shops);
  const seo = DISTRICT_SEO[district] || {
    vibe: '강원도 지역',
    audience: '여행객 및 지역 이용자',
    highlights: ['편하게 받을 수 있는 출장형 마사지', '피로 회복과 컨디션 관리'],
    tips: ['영업시간과 가능 지역을 먼저 확인하세요.', '후기/코스/가격을 함께 비교하세요.'],
  };

  const filtered = shops
    .filter((shop) => {
      const regionKeys = parseMultiValue(shop.region).map(normalizeRegionDisplay);
      if (!regionKeys.includes('강원')) return false;
      const ds = parseMultiValue(shop.district);
      return ds.includes(district);
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

  const title = `${district} 출장마사지 | 강원도출장마사지`;
  const desc = `${district} 출장마사지 업체의 가격, 코스, 영업시간, 주소, 전화번호 정보를 한눈에 비교하세요.`;

  // 홈 index.html → app.js renderMainCards() 와 동일 마크업 (detail 경로만 ../ )
  const cardsHtml = filtered
    .map((shop) => {
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
      const detailUrl = `../detail.html?id=${encodeURIComponent(shop.id || shop.name || '')}`;
      const name = shop.name || '출장마사지 업체';
      const priceStr = formatPrice(shop.price);

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
            <div class="shop-card-price">${escapeHtml(priceStr)}</div>
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

  const canonicalUrl = `${SITE_ORIGIN}/districts/${encodeURI(`${district}출장마사지.html`)}`;
  const ld = buildDistrictJsonLd({ district, filtered, canonicalUrl });

  const seoHtml = `
<section class="seo-section">
  <div class="container seo-inner">
    <h2 class="seo-title">${escapeHtml(district)} 출장마사지 안내</h2>
    <p>
      ${escapeHtml(district)}은(는) ${escapeHtml(seo.vibe)}입니다.
      그래서 <strong>${escapeHtml(district)} 출장마사지</strong>는 “이동 없이 편하게 받는 관리”라는 장점이 특히 크게 느껴지는 지역이에요.
      아래 업체 카드는 홈과 동일한 구성으로 지역·영업시간·가격·소개·서비스를 보여 주며, 전화·주소 등은 상세 페이지 및 구조화 데이터(JSON-LD)에서 함께 확인할 수 있습니다.
    </p>
    <p>
      이 페이지는 <strong>${escapeHtml(district)} 지역</strong>에서 출장마사지가 필요할 때, 누구나 한 번에 판단할 수 있도록 핵심 정보를 노출하는 것을 목표로 합니다.
      이용자 유형으로는 ${escapeHtml(seo.audience)} 수요가 많습니다.
    </p>
    <h3>${escapeHtml(district)} 출장마사지가 특히 좋은 상황</h3>
    <p>${escapeHtml(seo.highlights[0] || '')}</p>
    <p>${escapeHtml(seo.highlights[1] || '')}</p>
    <p>${escapeHtml(seo.highlights[2] || '')}</p>

    <h3>예약 전에 꼭 확인할 체크포인트</h3>
    <p>${escapeHtml(seo.tips[0] || '')}</p>
    <p>${escapeHtml(seo.tips[1] || '')}</p>
    <p>${escapeHtml(seo.tips[2] || '')}</p>

    <h3>${escapeHtml(district)} 출장마사지 FAQ</h3>
    <p>
      <strong>Q. ${escapeHtml(district)} 출장마사지는 당일 예약도 가능한가요?</strong><br />
      A. 업체별로 다르지만, 가능한 시간대를 먼저 확인하면 당일 예약도 원활합니다. 성수기/주말에는 조기 마감될 수 있어요.
    </p>
    <p>
      <strong>Q. 가격이 “~원부터”로 표시된 경우는 어떻게 보면 좋나요?</strong><br />
      A. 코스 시간(60/90/120분), 관리 종류(타이/아로마/스웨디시), 심야·거리 추가요금에 따라 달라질 수 있으니 구성까지 확인하는 것이 안전합니다.
    </p>
    <p>
      <strong>Q. 예약할 때 가장 먼저 전달해야 할 정보는?</strong><br />
      A. ${escapeHtml(district)} 내 정확한 위치(건물명/호수), 희망 시간대, 원하는 관리 종류(오일/건식), 주차/출입 정보입니다.
    </p>
  </div>
</section>`;

  return `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(desc)}" />
    <meta name="robots" content="index,follow" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <link rel="stylesheet" href="../styles.css?v=${ASSET_VERSION}" />
    <script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
    </script>
  </head>
  <body data-page="district-static" data-district="${escapeHtml(district)}">
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
      <div class="home-top">
      <section class="hero">
        <div class="container hero-inner">
          <div class="hero-text">
            <h1>${escapeHtml(district)} 출장마사지 검색</h1>
            <p>
              아래 필터로 <strong>${escapeHtml(district)}</strong> 업체를 동·읍·면·테마·키워드까지 좁혀 볼 수 있습니다.
              메인 화면과 동일한 검색 폼이며, 결과는 이 페이지 카드 목록에 반영됩니다.
            </p>
          </div>
${heroSearchHtml}
        </div>
      </section>

      <section class="cards-section">
        <div class="container">
          <div class="section-header section-header-bottom">
            <h1 style="margin:0 0 0.5rem;">${escapeHtml(district)} 출장마사지</h1>
            <p class="section-subtitle" style="margin:0 0 1rem;">
              강원도 출장마사지 업체를 ${escapeHtml(district)} 기준으로 모았습니다.
            </p>
            <p style="margin:0 0 1.2rem; color:#6b7280;">
              총 ${escapeHtml(filtered.length)}개 업체
            </p>
          </div>

          <div
            id="shopCardsContainer"
            class="cards-grid"
            data-ssr-district="${escapeHtml(district)}"
            aria-live="polite"
          >
            ${
              filtered.length
                ? cardsHtml
                : `<p class="no-results">현재 ${escapeHtml(district)} 지역 업체 정보가 준비중입니다.</p>`
            }
          </div>
          <p id="noResultsMessage" class="no-results" hidden>
            조건에 맞는 업체가 없습니다. 필터를 다시 선택해보세요.
          </p>
        </div>
      </section>
      </div>

    ${seoHtml}
    </main>

    <footer class="site-footer">
      <div class="container footer-inner">
        <p>© ${escapeHtml(year)} 강원도출장마사지. All rights reserved.</p>
        <a href="../robots.txt" class="footer-link">robots.txt</a>
        <a href="../sitemap.xml" class="footer-link">sitemap.xml</a>
      </div>
    </footer>

    <script src="../shops.json"></script>
    <script src="../shop-card-data.js"></script>
    <script src="../app.js"></script>
  </body>
</html>`;
}

function main() {
  console.log('▶ district 정적 페이지 생성 시작');
  const shops = loadShops();
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const year = String(new Date().getFullYear());
  KANGWON_DISTRICTS.forEach((district) => {
    const html = renderDistrictListPage({ district, shops, year });
    const outPath = path.join(OUT_DIR, `${district}출장마사지.html`);
    fs.writeFileSync(outPath, html, 'utf8');
  });

  console.log(` - 생성 완료: ${KANGWON_DISTRICTS.length}개 페이지 (${OUT_DIR})`);
}

if (require.main === module) {
  main();
}

