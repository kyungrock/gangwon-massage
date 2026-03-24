const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PROFILE_PATH = path.join(ROOT, 'korea-regions-seo-profiles.md');
const REGION_PATH = path.join(ROOT, 'regions', '대전출장마사지.html');
const DISTRICTS_DIR = path.join(ROOT, 'districts');

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
  let key = '';
  let cur = null;

  function flush() {
    if (key && cur) map.set(key, cur);
  }

  for (const line of lines) {
    const h = line.match(/^##\s+(.+)$/);
    if (h) {
      flush();
      key = h[1].trim();
      cur = { theme: '', places: '', pattern: '', fatigue: '', local: '' };
      continue;
    }

    if (!cur) continue;
    const m = line.match(/^\s*([1-5])\.\s*[^:]+:\s*(.+)\s*$/);
    if (!m) continue;

    const v = m[2].trim();
    if (m[1] === '1') cur.theme = v;
    if (m[1] === '2') cur.places = v;
    if (m[1] === '3') cur.pattern = v;
    if (m[1] === '4') cur.fatigue = v;
    if (m[1] === '5') cur.local = v;
  }

  flush();
  return map;
}

function upsertSeoSection(html, sectionHtml) {
  // seo-section 통째 교체
  if (/<section class="seo-section"[\s\S]*?<\/section>\s*<\/main>/m.test(html)) {
    return html.replace(/<section class="seo-section"[\s\S]*?<\/section>\s*<\/main>/m, `${sectionHtml}\n    </main>`);
  }
  return html.replace('</main>', `${sectionHtml}\n    </main>`);
}

function cleanLocal(local) {
  return String(local || '').replace(/[“”]/g, '');
}

function regionSeo(p) {
  const theme = escapeHtml(p.theme);
  const places = escapeHtml(p.places);
  const pattern = escapeHtml(p.pattern);
  const fatigue = escapeHtml(p.fatigue);
  const local = escapeHtml(cleanLocal(p.local));

  return `
    <section class="seo-section" aria-labelledby="seo-daejeon-region-manual-title">
      <div class="container seo-inner">
        <h2 id="seo-daejeon-region-manual-title" class="seo-title">대전 하루 끝, 몸이 먼저 말하는 이유</h2>
        <p>아, 오늘도 나가고 왔는데… 집에 앉아도 다리나 허리가 계속 울린다.</p>
        <p>대전 전체 흐름은 ${theme}이야. ${places} 사이를 오가면서 생활 패턴 ${pattern}이 반복되면, ${fatigue}가 뒤늦게 붙어서 피로가 오래 간다. 특히 ${local}처럼 자꾸 떠오르는 구간이 있으면, 근육 이완이 필요한 타이밍이 더 빨리 온다.</p>
        <p>그래서 대전 출장마사지에서 중요한 건 “어디가 아픈지”보다 “어디서 굳었는지”를 말하는 것. ${local} 한 줄만 정리해도 방문 마사지의 방향이 훨씬 빨라진다.</p>
      </div>
    </section>`;
}

function districtSeo(region, district, p) {
  const theme = escapeHtml(p.theme);
  const places = escapeHtml(p.places);
  const pattern = escapeHtml(p.pattern);
  const fatigue = escapeHtml(p.fatigue);
  const local = escapeHtml(cleanLocal(p.local));
  const keyword = `${region} ${district} 출장마사지`;

  if (district === '동구') {
    return `
      <section class="seo-section" aria-labelledby="seo-daejeon-동구-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-daejeon-동구-manual-title" class="seo-title">동구는 ‘대전역-성심당’ 라인이 피로를 묶는다</h2>
          <p>성심당 웨이팅 끝났다고 좋아했는데, 걸어 나오는 순간부터 몸이 느려지더라.</p>
          <p>동구는 ${theme}가 기준이야. ${places}를 이어 다니는 동안 KTX·지하철 동선 같은 생활 패턴 ${pattern}이 계속 이어지고, ${fatigue}가 겹치면 피로가 한 번에 번진다. 특히 ${local}을 지나면 허리 라인이 먼저 굳는 느낌이 온다.</p>
          <p>그래서 ${keyword}는 “어디에 오래 섰는지”만 말해줘. 성심당 본점 줄, 중앙시장 안쪽, 은행동 육교처럼 ${local}을 기준으로 이야기하면 방문 마사지에서 근육 이완 포인트가 딱 맞는다.</p>
        </div>
      </section>`;
  }

  if (district === '중구') {
    return `
      <section class="seo-section" aria-labelledby="seo-daejeon-중구-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-daejeon-중구-manual-title" class="seo-title">중구는 산책이 끝나고도 마음이 못 쉬어</h2>
          <p>한가할 줄 알았는데 주말엔 자꾸 밖에 더 머물게 된다. 집 가는 길이 길어져.</p>
          <p>중구의 핵심은 ${theme}이야. ${places}를 오가며 수목원 산책과 카페가 붙는 생활 패턴 ${pattern}이 반복되고, ${fatigue}처럼 주차 전쟁이나 더위가 끼면 몸이 쉬는 틈을 못 찾는다. ${local} 근처에서 걸음이 굳어지는 순간이 진짜 문제야.</p>
          <p>그래서 ${keyword}는 방문 마사지 예약할 때 “한밭수목원 정문/은행큰시장/선화동 골목”처럼 ${local}을 한 번만 짚어줘. 그 구간이 기준이 되면 회복이 빨라진다.</p>
        </div>
      </section>`;
  }

  if (district === '서구') {
    return `
      <section class="seo-section" aria-labelledby="seo-daejeon-서구-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-daejeon-서구-manual-title" class="seo-title">서구는 야근+정체가 어깨를 붙잡는다</h2>
          <p>갑천 옆으로 잠깐 뛰고 나면 괜찮을 줄 알았지. 그런데 퇴근 길에 다시 무거워지더라.</p>
          <p>서구는 ${theme}가 크게 잡혀. ${places} 이동에서 갑천 러닝과 출퇴근 리듬 같은 생활 패턴 ${pattern}이 이어지고, ${fatigue}가 붙으면 근육이 풀리기 전에 다시 긴장해버린다. 특히 ${local}에서 숨이 짧아지는 느낌이 남는다.</p>
          <p>그래서 ${keyword}는 “어디서부터 속도가 늦어졌는지”를 ${local}로 표현해줘. 방문 마사지 받기 전, 그 지점부터 근육 이완이 빠르게 들어간다.</p>
        </div>
      </section>`;
  }

  if (district === '유성') {
    return `
      <section class="seo-section" aria-labelledby="seo-daejeon-유성-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-daejeon-유성-manual-title" class="seo-title">유성은 온천 동선이 끝나도 몸이 식지 않는다</h2>
          <p>온천로에서 한참 걷고 왔는데, 집에 앉으니 오히려 몸이 차가워진 느낌… 어깨가 뻣뻣해.</p>
          <p>유성의 테마는 ${theme}야. ${places}를 오가며 온천·산책과 노은 차량 같은 생활 패턴 ${pattern}이 이어지고, 유성~대덕 거리에서 ${fatigue}가 누적되면 피로가 오래 남는다. ${local}에서 특히 바람 맞은 뒤 굳는 감각이 생긴다.</p>
          <p>그래서 ${keyword}는 방문 마사지 전에 “온천로 유성온천역/노은지구 중앙/구즉삼거리”처럼 ${local}을 한 줄로만 말해줘. 그 한 줄이 근육 이완 타이밍을 맞춰준다.</p>
        </div>
      </section>`;
  }

  // 대덕
  return `
    <section class="seo-section" aria-labelledby="seo-daejeon-대덕-manual-title">
      <div class="container seo-inner">
        <h2 id="seo-daejeon-대덕-manual-title" class="seo-title">대덕은 연구단지 야근의 여운이 오래 간다</h2>
        <p>퇴근했는데 왜 아직도 머리가 쉴 틈이 없지? 몸만 먼저 지치는 날이 있더라.</p>
        <p>대덕은 ${theme}가 중심이야. ${places}에서 연구소 출퇴근과 장보기, 대청호 방향 드라이브 같은 생활 패턴 ${pattern}이 이어지고, ${fatigue}가 겹치면 산업단지 스트레스가 근육을 붙잡는다. 결국 ${local}에서 긴장이 가장 늦게 풀린다.</p>
        <p>그래서 ${keyword}는 “대덕대로 입구/신탄진시장/회덕네거리”처럼 ${local}을 기준으로 말해줘. 방문 마사지에서 그 흐름을 끊으면 피로 회복이 생각보다 빨라진다.</p>
      </div>
    </section>`;
}

function main() {
  const md = fs.readFileSync(PROFILE_PATH, 'utf8');
  const profiles = parseProfiles(md);

  const region = '대전';
  const regionProfile = profiles.get(region);
  if (!regionProfile) throw new Error('대전 프로필 없음');

  // 지역(보조)
  {
    const regionHtml = fs.readFileSync(REGION_PATH, 'utf8');
    fs.writeFileSync(REGION_PATH, upsertSeoSection(regionHtml, regionSeo(regionProfile)), 'utf8');
  }

  // 구(메인)
  const districts = ['동구', '중구', '서구', '유성', '대덕'];
  for (const district of districts) {
    const key = `${region}.${district}`;
    const p = profiles.get(key);
    if (!p) throw new Error(`${key} 프로필 없음`);
    const filePath = path.join(DISTRICTS_DIR, `대전-${district}출장마사지.html`);
    if (!fs.existsSync(filePath)) throw new Error(`파일 없음: ${filePath}`);
    const html = fs.readFileSync(filePath, 'utf8');
    const sectionHtml = districtSeo(region, district, p);
    fs.writeFileSync(filePath, upsertSeoSection(html, sectionHtml), 'utf8');
  }

  console.log('[done] 대전 지역+구 seo-section 수작업(표 제거, 1000자 이하) 재작성 완료');
}

if (require.main === module) main();

