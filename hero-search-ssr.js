/**
 * hero-search-ssr.js
 * shops.json 기준으로 홈/시군 정적 페이지용 hero-search 폼 HTML 생성
 */

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

function normalizeRegionKey(region) {
  return normalizeRegionDisplay(region);
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

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderHeroSearchHtml(shops) {
  const { regions, districtsByRegion, dongsByRegionDistrict } =
    buildFiltersFromData(shops);

  if (regions.has('강원')) {
    if (!districtsByRegion['강원']) districtsByRegion['강원'] = new Set();
    KANGWON_DISTRICTS.forEach((d) => districtsByRegion['강원'].add(d));
  }

  const sortKo = (a, b) => String(a).localeCompare(String(b), 'ko');
  const regionSorted = Array.from(regions).sort(sortKo);

  const opt = (value, label) =>
    `                  <option value="${escapeHtml(value)}">${escapeHtml(
      label
    )}</option>`;

  const regionOptions = [
    opt('', '전체'),
    ...regionSorted.map((r) => opt(r, normalizeRegionDisplay(r))),
  ].join('\n');

  const allDistricts = new Set();
  Object.values(districtsByRegion).forEach((set) => {
    set.forEach((d) => allDistricts.add(d));
  });
  const districtOptions = [
    opt('', '전체'),
    ...Array.from(allDistricts).sort(sortKo).map((d) => opt(d, d)),
  ].join('\n');

  const allDongs = new Set();
  Object.values(dongsByRegionDistrict).forEach((set) => {
    set.forEach((d) => allDongs.add(d));
  });
  const dongOptions = [
    opt('', '전체'),
    ...Array.from(allDongs).sort(sortKo).map((d) => opt(d, d)),
  ].join('\n');

  return `          <form class="hero-search" id="heroSearchForm">
            <div class="form-row">
              <label>
                지역(도)
                <select id="filterRegion">
${regionOptions}
                </select>
              </label>
              <label>
                시/구
                <select id="filterDistrict">
${districtOptions}
                </select>
              </label>
            </div>
            <div class="form-row">
              <label>
                동/읍/면
                <select id="filterDong">
${dongOptions}
                </select>
              </label>
              <label>
                테마
                <select id="filterType">
                  <option value="">전체</option>
                  <option value="출장마사지">출장마사지</option>
                  <option value="마사지">마사지</option>
                  <option value="스웨디시">스웨디시</option>
                  <option value="테라피">테라피</option>
                </select>
              </label>
            </div>
            <div class="form-row">
              <label class="grow">
                키워드
                <input
                  type="search"
                  id="filterKeyword"
                  placeholder="업체명, 서비스, 태그 검색"
                />
              </label>
              <button type="submit" class="btn-primary">검색</button>
            </div>
          </form>`;
}

module.exports = { renderHeroSearchHtml };
