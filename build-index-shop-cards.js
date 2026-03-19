/**
 * build-index-shop-cards.js
 *
 * 홈 index.html 에
 * 1) hero-search 폼(지역/시구/동 옵션) 정적 HTML
 * 2) #shopCardsContainer 안 "지역=강원" 기본 필터와 동일한 업체 카드 HTML
 * 을 삽입합니다.
 * → 페이지 소스 보기 / JS 미실행 크롤러에서도 폼·카드가 보입니다.
 *
 * 사용: node build-index-shop-cards.js
 *
 * shops.json 갱신 후 배포 전에 실행하세요.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { renderHeroSearchHtml } = require('./hero-search-ssr.js');

const ROOT = __dirname;
const SHOPS_FILE = path.join(ROOT, 'shops.json');
const INDEX_FILE = path.join(ROOT, 'index.html');
const BLOCK_RE =
  /<!--INDEX_SHOP_CARDS_START-->[\s\S]*?<!--INDEX_SHOP_CARDS_END-->/;
const HERO_BLOCK_RE =
  /<!--INDEX_HERO_SEARCH_START-->[\s\S]*?<!--INDEX_HERO_SEARCH_END-->/;

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

function formatLocationDisplay(shop) {
  const region = parseMultiValue(shop.region).map(normalizeRegionDisplay).join(' ');
  const district = parseMultiValue(shop.district).join(' ');
  const dong = parseMultiValue(shop.dong).join(' ');
  return [region, district, dong].filter(Boolean).join(' ');
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function filterShops({ shops, region, district, dong, type, keyword }) {
  const kw = (keyword || '').trim().toLowerCase();
  return shops.filter((shop) => {
    if (region) {
      const wantRegion = normalizeRegionDisplay(region);
      const shopRegions = parseMultiValue(shop.region).map(normalizeRegionDisplay);
      if (!shopRegions.length || !shopRegions.includes(wantRegion)) return false;
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
        safeArray(shop.services).join(' ').toLowerCase().includes(typeLower) ||
        safeArray(shop.tags).join(' ').toLowerCase().includes(typeLower);
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

function formatPrice(price) {
  return price || '가격 문의';
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderOneCard(shop) {
  const imgSrc =
    shop.image ||
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=250&fit=crop&crop=center';
  const alt = shop.alt || `${shop.name || ''} 마사지샵`;
  const location = formatLocationDisplay(shop);
  const greeting = shop.greeting || shop.description || '';
  const tags = safeArray(shop.services).slice(0, 3);
  const rating =
    shop.rating || shop.rating === 0 ? shop.rating.toFixed(1) : null;
  const reviewCount = shop.reviewCount || 0;
  const detailUrl = `detail.html?id=${encodeURIComponent(shop.id || shop.name || '')}`;
  const name = shop.name || '출장마사지 업체';

  return `
      <article class="shop-card">
        <a href="${escapeHtml(detailUrl)}" aria-label="${escapeHtml(name)} 상세보기">
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
            <div class="shop-card-price">${escapeHtml(formatPrice(shop.price))}</div>
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

function main() {
  console.log('▶ index.html hero-search + 업체 카드(SSR) 삽입 시작');
  const shops = loadShops();
  let data = filterShops({
    shops,
    region: '강원',
    district: '',
    dong: '',
    type: '',
    keyword: '',
  });

  const healing = data.filter((s) => s.showHealingShop).sort((a, b) => String(a.id || '').localeCompare(String(b.id || '')));
  const others = data.filter((s) => !s.showHealingShop).sort((a, b) => String(a.id || '').localeCompare(String(b.id || '')));
  data = [...healing, ...others];

  const cardsHtml = data.map((s) => renderOneCard(s)).join('\n');

  let indexHtml = fs.readFileSync(INDEX_FILE, 'utf8');

  if (!HERO_BLOCK_RE.test(indexHtml)) {
    throw new Error(
      'index.html 안에 <!--INDEX_HERO_SEARCH_START--> ... <!--INDEX_HERO_SEARCH_END--> 블록이 없습니다.'
    );
  }
  const heroHtml = `          <!--INDEX_HERO_SEARCH_START-->
${renderHeroSearchHtml(shops)}
          <!--INDEX_HERO_SEARCH_END-->`;
  indexHtml = indexHtml.replace(HERO_BLOCK_RE, heroHtml);

  if (!BLOCK_RE.test(indexHtml)) {
    throw new Error(
      'index.html 안에 <!--INDEX_SHOP_CARDS_START--> ... <!--INDEX_SHOP_CARDS_END--> 블록이 없습니다.'
    );
  }
  const newBlock = `<!--INDEX_SHOP_CARDS_START-->\n${cardsHtml}\n            <!--INDEX_SHOP_CARDS_END-->`;
  indexHtml = indexHtml.replace(BLOCK_RE, newBlock);

  indexHtml = indexHtml.replace(
    /<p id="noResultsMessage" class="no-results"(\s+hidden)?>/,
    data.length === 0
      ? '<p id="noResultsMessage" class="no-results">'
      : '<p id="noResultsMessage" class="no-results" hidden>'
  );

  fs.writeFileSync(INDEX_FILE, indexHtml, 'utf8');
  console.log(
    ` - 완료: hero-search 정적 옵션 + 강원 기본 ${data.length}개 카드 → ${INDEX_FILE}`
  );
}

if (require.main === module) {
  main();
}
