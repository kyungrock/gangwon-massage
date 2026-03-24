const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PROFILE_PATH = path.join(ROOT, 'korea-regions-seo-profiles.md');
const REGIONS_JSON_PATH = path.join(ROOT, 'korea-regions.json');
const REGIONS_DIR = path.join(ROOT, 'regions');
const DISTRICTS_DIR = path.join(ROOT, 'districts');

function normalizeRegionDisplay(region) {
  const r = String(region || '').trim();
  if (r.endsWith('도') && r.length >= 2) return r.slice(0, -1);
  return r;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseProfiles(md) {
  const lines = md.split(/\r?\n/);
  const map = new Map();
  let currentKey = '';
  let current = null;

  function flush() {
    if (!currentKey || !current) return;
    map.set(currentKey, current);
  }

  for (const line of lines) {
    const h = line.match(/^##\s+(.+)\s*$/);
    if (h) {
      flush();
      currentKey = h[1].trim();
      current = { theme: '', places: '', pattern: '', fatigue: '', local: '' };
      continue;
    }
    if (!current) continue;
    const m = line.match(/^\s*([1-5])\.\s*[^:]+:\s*(.+)\s*$/);
    if (!m) continue;
    const val = m[2].trim();
    if (m[1] === '1') current.theme = val;
    if (m[1] === '2') current.places = val;
    if (m[1] === '3') current.pattern = val;
    if (m[1] === '4') current.fatigue = val;
    if (m[1] === '5') current.local = val;
  }
  flush();
  return map;
}

function buildRegionSeo(region, p) {
  const keyword = `${region} 출장마사지`;
  return `
      <section class="seo-section" aria-labelledby="seo-${region}-region-title">
        <div class="container seo-inner">
          <h2 id="seo-${region}-region-title" class="seo-title">${escapeHtml(region)} 하루 리듬이 몸에 남는 방식, 지금 정리해보자</h2>
          <p>
            아, 오늘 진짜 힘들다. 이동은 짧았는데 왜 어깨부터 무겁지? 이런 날이 반복되면 대부분 패턴이 비슷해.
            ${escapeHtml(region)}은 하루 동선이 한 가지가 아니라 여러 흐름이 겹치는 구조야. 그래서 피로도 한 번에 오기보다 늦게 올라온다.
            이 페이지는 ${escapeHtml(region)} 전역 업체 카드를 비교하는 곳이고, 원고는 프로필 블록 기준으로만 짰다.
          </p>
          <p>
            핵심부터 정확히 짚으면, <strong>${escapeHtml(p.theme)}</strong>가 이 지역 피로의 중심 축이다.
            여기에 <strong>${escapeHtml(p.places)}</strong> 같은 실제 이동 포인트가 붙고, 생활 리듬은 <strong>${escapeHtml(p.pattern)}</strong>로 반복된다.
            결국 같은 거리라도 피로 체감이 달라지는 이유는 동선의 결이 매일 바뀌기 때문이야.
            그래서 <strong>${escapeHtml(keyword)}</strong>를 찾을 때도 무작정 고르기보다, 오늘 어떤 동선을 탔는지 먼저 정리하는 쪽이 훨씬 정확하다.
          </p>
          <h3>피로가 누적되는 이유 (3가지)</h3>
          <ol class="seo-ol">
            <li><strong>핵심 테마 동선이 하루에 중첩될 때</strong> — ${escapeHtml(p.theme)} 축이 반복되면 근육 이완이 늦고 피로 회복이 뒤로 밀린다.</li>
            <li><strong>주요 장소를 끊어 이동할 때</strong> — ${escapeHtml(p.places)}를 순차로 움직이면 걷기/대기/차량 탑승이 섞여 특정 부위 과부하가 커진다.</li>
            <li><strong>생활 패턴 + 피로 상황이 겹칠 때</strong> — ${escapeHtml(p.pattern)} 위에 ${escapeHtml(p.fatigue)}가 얹히면 저녁에 급격히 컨디션이 떨어지기 쉽다.</li>
          </ol>
          <h3>예약 팁 (표)</h3>
          <table class="seo-table" role="presentation">
            <thead>
              <tr><th scope="col">체크</th><th scope="col">한 줄 예시</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>오늘 동선</strong></td>
                <td>“${escapeHtml(p.local)} 라인 중심으로 이동”처럼 순서를 먼저 적기.</td>
              </tr>
              <tr>
                <td><strong>체감 부위</strong></td>
                <td>“다리보다 어깨/허리 먼저”처럼 우선순위를 짧게 전달하기.</td>
              </tr>
              <tr>
                <td><strong>시간 여유</strong></td>
                <td><strong>방문 마사지</strong>는 도착 여유 30분이 체감 품질을 크게 바꾼다.</td>
              </tr>
            </tbody>
          </table>
          <p>
            ${escapeHtml(region)}에서는 피로를 강하게만 푸는 방식보다, 오늘 동선에 맞춰 순서를 잡는 쪽이 더 잘 맞는다.
            <strong>${escapeHtml(keyword)}</strong> 검색 후 카드 비교할 때도 “내 루트와 맞는가”를 기준으로 보면 실패 확률이 내려간다.
            근육 이완이 제대로 붙으면 피로 회복 속도도 달라진다. 오늘 일정이 빡셌다면 긴 설명보다 한 줄만 남겨도 충분하다.
          </p>
          <p>
            요약하면 단순해. 이 지역은 <strong>${escapeHtml(p.theme)}</strong> 축에서 피로가 만들어지고, ${escapeHtml(p.local)} 같은 로컬 동선에서 체감이 커진다.
            그래서 지금 필요한 건 과한 계획이 아니라 정확한 한 줄이다. “어디를 어떻게 움직였는지.” 그 한 줄이 내일 컨디션을 바꾼다.
            오늘도 수고했어. ${escapeHtml(keyword)} 선택은, 내 몸 리듬을 인정하는 것부터 시작하면 된다.
          </p>
        </div>
      </section>`;
}

function buildDistrictSeo(region, district, p) {
  const keyword = `${region} ${district} 출장마사지`;
  return `
      <section class="seo-section" aria-labelledby="seo-${region}-${district}-title">
        <div class="container seo-inner">
          <h2 id="seo-${region}-${district}-title" class="seo-title">${escapeHtml(region)} ${escapeHtml(district)} 동선에서 피로가 먼저 오는 지점</h2>
          <p>
            아, 오늘 진짜 힘들다. 크게 무리한 건 없다고 생각했는데, 저녁 되면 특정 부위가 먼저 굳어 버린다.
            이 페이지는 ${escapeHtml(region)} ${escapeHtml(district)} 카드 비교용이고, 원고도 ${escapeHtml(region)}.${escapeHtml(district)} 블록 한 개만 근거로 정리했다.
            다른 구 데이터는 섞지 않았다. 그래서 동선 맥락이 더 또렷하다.
          </p>
          <p>
            이 구의 핵심 테마는 <strong>${escapeHtml(p.theme)}</strong>.
            실제로 반복되는 포인트도 <strong>${escapeHtml(p.places)}</strong>로 좁혀진다.
            생활 패턴은 <strong>${escapeHtml(p.pattern)}</strong>이고, 피로를 키우는 조건은 <strong>${escapeHtml(p.fatigue)}</strong>다.
            이 네 줄이 합쳐지면 왜 같은 하루에도 컨디션이 크게 흔들리는지 설명이 된다.
            그래서 <strong>${escapeHtml(keyword)}</strong>를 찾을 때는 단순 가격보다, 오늘 루트와 맞는지 먼저 보는 게 정확하다.
          </p>
          <h3>피로 누적 포인트 (3가지)</h3>
          <ol class="seo-ol">
            <li><strong>핵심 테마 루트 반복</strong> — ${escapeHtml(p.theme)} 축이 겹치면 특정 근육이 먼저 잠긴다.</li>
            <li><strong>장소 간 전환 빈도 증가</strong> — ${escapeHtml(p.places)} 사이 이동이 잦을수록 체감 피로가 계단식으로 오른다.</li>
            <li><strong>생활 패턴 + 피로 조건 동시 발생</strong> — ${escapeHtml(p.pattern)}에 ${escapeHtml(p.fatigue)}가 붙는 날은 피로 회복이 늦다.</li>
          </ol>
          <h3>예약 팁 (표)</h3>
          <table class="seo-table" role="presentation">
            <thead>
              <tr><th scope="col">항목</th><th scope="col">짧게 적는 법</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>로컬 동선</strong></td>
                <td>“${escapeHtml(p.local)} 중심 이동”처럼 구체 동선을 한 줄로.</td>
              </tr>
              <tr>
                <td><strong>체감 부위</strong></td>
                <td>“어깨 먼저/허리 먼저”처럼 우선순위를 먼저 전달.</td>
              </tr>
              <tr>
                <td><strong>시간 여유</strong></td>
                <td><strong>방문 마사지</strong> 도착 여유 30분을 확보하면 만족도가 올라간다.</td>
              </tr>
            </tbody>
          </table>
          <p>
            ${escapeHtml(region)} 안에서도 ${escapeHtml(district)}는 리듬이 다르다.
            그래서 이 글은 전체 정보가 아니라 이 구 블록 하나만으로 구성했다.
            <strong>${escapeHtml(keyword)}</strong>를 찾는 이유가 분명한 날일수록, 이런 단일 맥락 글이 더 빠르게 맞는다.
            근육 이완 방향이 맞으면 피로 회복도 같이 따라온다.
          </p>
          <p>
            마지막으로 한 줄만 남기자. 오늘 동선의 핵심은 <strong>${escapeHtml(p.local)}</strong>였다.
            그 사실 하나만 정확히 전달해도 코스 조율이 쉬워진다.
            반복되는 피로를 끊고 싶다면, 막연한 표현보다 구체 동선 한 줄이 훨씬 강하다.
            오늘도 수고했다. ${escapeHtml(keyword)} 선택은 지금 내 상태를 정확히 말하는 것부터 시작하면 된다.
          </p>
        </div>
      </section>`;
}

function upsertSeoSection(html, sectionHtml) {
  if (/<section class="seo-section"[\s\S]*?<\/section>\s*<\/main>/m.test(html)) {
    return html.replace(
      /<section class="seo-section"[\s\S]*?<\/section>\s*<\/main>/m,
      `${sectionHtml}\n    </main>`
    );
  }
  return html.replace('</main>', `${sectionHtml}\n    </main>`);
}

function getProfile(profiles, key) {
  const p = profiles.get(key);
  if (!p) return null;
  if (!p.theme || !p.places || !p.pattern || !p.fatigue || !p.local) return null;
  return p;
}

function main() {
  const profileMd = fs.readFileSync(PROFILE_PATH, 'utf8');
  const profiles = parseProfiles(profileMd);
  const regionsJson = JSON.parse(fs.readFileSync(REGIONS_JSON_PATH, 'utf8'));
  const regions = Array.isArray(regionsJson.regions) ? regionsJson.regions : [];

  let regionUpdated = 0;
  let districtUpdated = 0;
  let skipped = 0;

  for (const r of regions) {
    const region = normalizeRegionDisplay(r.name || '');
    if (!region) continue;
    const regionProfile = getProfile(profiles, region);
    const regionPath = path.join(REGIONS_DIR, `${region}출장마사지.html`);
    if (regionProfile && fs.existsSync(regionPath)) {
      const html = fs.readFileSync(regionPath, 'utf8');
      const next = upsertSeoSection(html, buildRegionSeo(region, regionProfile));
      fs.writeFileSync(regionPath, next, 'utf8');
      regionUpdated += 1;
    } else {
      skipped += 1;
    }

    const districts = Array.isArray(r.districts) ? r.districts : [];
    for (const dRaw of districts) {
      const district = String(dRaw || '').trim();
      if (!district) continue;
      const key = `${region}.${district}`;
      const districtProfile = getProfile(profiles, key);
      const districtPath = path.join(DISTRICTS_DIR, `${region}-${district}출장마사지.html`);
      if (districtProfile && fs.existsSync(districtPath)) {
        const html = fs.readFileSync(districtPath, 'utf8');
        const next = upsertSeoSection(html, buildDistrictSeo(region, district, districtProfile));
        fs.writeFileSync(districtPath, next, 'utf8');
        districtUpdated += 1;
      } else {
        skipped += 1;
      }
    }
  }

  console.log(`[done] regions=${regionUpdated}, districts=${districtUpdated}, skipped=${skipped}`);
}

if (require.main === module) {
  main();
}

