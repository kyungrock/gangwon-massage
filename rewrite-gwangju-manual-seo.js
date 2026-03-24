const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PROFILE_PATH = path.join(ROOT, 'korea-regions-seo-profiles.md');
const REGION_PATH = path.join(ROOT, 'regions', '광주출장마사지.html');
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
    <section class="seo-section" aria-labelledby="seo-gwangju-region-manual-title">
      <div class="container seo-inner">
        <h2 id="seo-gwangju-region-manual-title" class="seo-title">광주, 하루 끝나면 왜 더 뻐근해질까</h2>
        <p>아, 오늘 또 늦어졌다. 충장로랑 상무 쪽을 왔다 갔다 했더니, 집에 와서야 몸이 천천히 “아프네”라고 말한다.</p>
        <p>광주 전체 분위기는 ${theme}이 중심이야. ${places}를 오가며 생활 패턴 ${pattern}이 반복되면, ${fatigue} 같은 피로가 한 번에 몰려온다. 특히 ${local}처럼 기억되는 구간에서 긴장이 풀리기보다 고정되는 날이 많아.</p>
        <p>그래서 <strong>광주 출장마사지</strong>는 후기보다 동선에서 먼저 굳은 지점을 잡는 게 더 빠르다. 방문 마사지로 근육 이완을 넣을 때 ${local}을 한 줄로만 말해줘도 방향이 선명해진다.</p>
      </div>
    </section>`;
}

function districtSeo(district, p) {
  const theme = escapeHtml(p.theme);
  const places = escapeHtml(p.places);
  const pattern = escapeHtml(p.pattern);
  const fatigue = escapeHtml(p.fatigue);
  const local = escapeHtml(cleanLocal(p.local));
  const keyword = `광주 ${district} 출장마사지`;

  if (district === '동구') {
    return `
      <section class="seo-section" aria-labelledby="seo-gwangju-동구-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gwangju-동구-manual-title" class="seo-title">동구는 충장로 인파가 몸을 먼저 멈춘다</h2>
          <p>퇴근하고 딱 한 잔 하려다 시간 다 써버렸다. 충장로 쪽 불빛 아래 걷는 동안은 괜찮았는데, 돌아오는 길에 어깨가 먼저 무거워졌다!</p>
          <p>동구의 핵심 테마는 ${theme}야. ${places}를 오갈 때 생활 패턴 ${pattern}이 이어지고, 주말 충장로 인파·주차 전쟁 같은 ${fatigue}가 겹치면 몸이 풀릴 타이밍을 놓친다. 특히 ${local}에서 발걸음이 느려지는 느낌이 바로 온다.</p>
          <p>그래서 <strong>${keyword}</strong>는 “어디서부터 굳었는지”를 ${local} 기준으로 한 줄만 말해줘. 근육 이완은 그 흐름을 끊는 순간부터 빨라진다.</p>
        </div>
      </section>`;
  }

  if (district === '서구') {
    return `
      <section class="seo-section" aria-labelledby="seo-gwangju-서구-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gwangju-서구-manual-title" class="seo-title">서구는 상무 야근이 밤에 남는다</h2>
          <p>오늘은 호수 쪽도 잠깐 걸었는데, 이상하게 마음은 괜찮아도 다리가 무겁다. 집에 들어서기 전부터 이미 몸이 느려져 있었어.</p>
          <p>서구는 ${theme}이 크게 잡아줘. ${places} 사이를 오가며 생활 패턴 ${pattern}이 반복되는데, ${fatigue} 같은 피로가 밤까지 이어지면 호수 주변 모기나 습기 감각이 더 예민하게 남는다. ${local}을 지나고 나면 긴장이 더 늦게 풀린다.</p>
          <p>그래서 <strong>${keyword}</strong>를 찾을 땐 장소를 길게 설명하지 말고 ${local} 한 지점만 기억해. 방문 마사지에서 그 구간부터 근육 이완을 넣으면 피로 회복이 자연스럽게 따라온다.</p>
        </div>
      </section>`;
  }

  if (district === '남구') {
    return `
      <section class="seo-section" aria-labelledby="seo-gwangju-남구-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gwangju-남구-manual-title" class="seo-title">남구는 봉선동 한 번 막히면 끝까지 간다</h2>
          <p>백운광장 분수 보면서 마음은 쉬었는데, 막상 집 가려고 하니 퇴근 버스 밀림이 또 붙는다. 더위가 몸에 남아서, 쉬는 시간인데도 뻐근해.</p>
          <p>남구의 핵심은 ${theme}야. ${places}를 오가며 생활 패턴 ${pattern}이 이어지고, ${fatigue} 같은 조건이 겹치면 몸이 먼저 지친다. 특히 ${local}에서 주차 감각이 굳어버리면, 이후 걷는 것도 자동으로 더 힘들어져.</p>
          <p>그래서 <strong>${keyword}</strong>는 방문 마사지 예약할 때 “${local} 쪽이 제일 힘들었다” 한 문장만 남겨줘. 그 한 줄이 근육 이완 포인트를 정확히 잡아준다.</p>
        </div>
      </section>`;
  }

  if (district === '북구') {
    return `
      <section class="seo-section" aria-labelledby="seo-gwangju-북구-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gwangju-북구-manual-title" class="seo-title">북구는 무등산 입구 주차가 피로를 묶는다</h2>
          <p>운암지 러닝을 하고 나서 마음은 상쾌했는데, 샤워하고 옷 갈아입는 그 순간 다리가 왜 이렇게 무거운지 알았다.</p>
          <p>북구는 ${theme}가 기본이야. ${places}를 오가며 생활 패턴 ${pattern}이 계속 돌고, 주말 등산객·문흥 언덕·대학가 주차 같은 ${fatigue}가 겹치면 긴장이 바로 풀리지 않는다. ${local}에서 걸음이 느려지면 그게 그대로 피로로 남아.</p>
          <p>그래서 <strong>${keyword}</strong>는 “어디까지 올라갔다가 멈췄는지”를 ${local}로 말해줘. 근육 이완은 그 멈춤 지점을 먼저 풀어주는 게 핵심이야.</p>
        </div>
      </section>`;
  }

  // 광산
  return `
    <section class="seo-section" aria-labelledby="seo-gwangju-광산-manual-title">
      <div class="container seo-inner">
        <h2 id="seo-gwangju-광산-manual-title" class="seo-title">광산은 산단 야근이 몸을 늦게 지친다</h2>
        <p>송정역 광장에서 사람들 스쳐 지나가는데, 왜 이렇게 체력이 늦게 꺼지는 걸까? 저녁이 깊어질수록 어깨가 먼저 풀리지 않는다.</p>
        <p>광산구는 ${theme}가 크게 깔려 있어. ${places}를 오가며 생활 패턴 ${pattern}이 반복되고, ${fatigue}가 겹치면 주차난까지 합쳐져서 몸이 더 굳는다. ${local}에서 특히 “멈춤”이 오래 남아 피로가 늦게 터진다.</p>
        <p>그래서 <strong>${keyword}</strong>는 방문 마사지 전에 ${local}에서 언제쯤 굳었는지 한 번만 말해줘. 근육 이완을 그 순서대로 넣으면, 회복이 생각보다 빨리 붙는다.</p>
      </div>
    </section>`;
}

function main() {
  const md = fs.readFileSync(PROFILE_PATH, 'utf8');
  const profiles = parseProfiles(md);

  const regionKey = '광주';
  const rp = profiles.get(regionKey);
  if (!rp) throw new Error('광주 프로필 없음');

  const regionHtml = fs.readFileSync(REGION_PATH, 'utf8');
  fs.writeFileSync(REGION_PATH, upsertSeoSection(regionHtml, regionSeo(rp)), 'utf8');

  const districts = ['동구', '서구', '남구', '북구', '광산'];
  for (const district of districts) {
    const key = `광주.${district}`;
    const p = profiles.get(key);
    if (!p) throw new Error(`${key} 프로필 없음`);
    const filePath = path.join(DISTRICTS_DIR, `광주-${district}출장마사지.html`);
    if (!fs.existsSync(filePath)) throw new Error(`파일 없음: ${filePath}`);
    const html = fs.readFileSync(filePath, 'utf8');
    fs.writeFileSync(filePath, upsertSeoSection(html, districtSeo(district, p)), 'utf8');
  }

  console.log('[done] 광주 지역+구 seo-section 수작업 재작성 완료');
}

if (require.main === module) main();

