const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PROFILE_PATH = path.join(ROOT, 'korea-regions-seo-profiles.md');
const REGION_PATH = path.join(ROOT, 'regions', '울산출장마사지.html');
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

function buildRegionSeo(p) {
  const theme = escapeHtml(p.theme);
  const places = escapeHtml(p.places);
  const pattern = escapeHtml(p.pattern);
  const fatigue = escapeHtml(p.fatigue);
  const local = escapeHtml(cleanLocal(p.local));

  return `
    <section class="seo-section" aria-labelledby="seo-ulsan-region-manual-title">
      <div class="container seo-inner">
        <h2 id="seo-ulsan-region-manual-title" class="seo-title">울산은 바람 다음에 피로가 남는다</h2>
        <p>오늘은 밖에서 좀 버텼는데, 집에 오니 몸이 갑자기 느려진다. 바다 공기는 좋았는데 그 뒤가 문제였어.</p>
        <p>울산 전체의 핵심 테마는 ${theme}야. ${places} 같은 곳들을 돌면서 생활 패턴 ${pattern}이 반복되면, ${fatigue} 같은 상황이 늦게 붙는다. 특히 ${local}에서 굳은 감각이 오래 가서, 다음날까지 잔상처럼 남아.</p>
        <p>그래서 울산 출장마사지에서 중요한 건 “오늘 어디가 제일 무거웠는지”보다, ${local}처럼 피로가 고정된 구간을 먼저 떠올리는 거야. 그 한 줄만 맞아도 방문 마사지의 근육 이완 타이밍이 훨씬 빨라진다.</p>
      </div>
    </section>`;
}

function buildDistrictSeo(region, district, p) {
  const theme = escapeHtml(p.theme);
  const places = escapeHtml(p.places);
  const pattern = escapeHtml(p.pattern);
  const fatigue = escapeHtml(p.fatigue);
  const local = escapeHtml(cleanLocal(p.local));

  const keyword = `${region} ${district} 출장마사지`;

  if (district === '중구') {
    return `
      <section class="seo-section" aria-labelledby="seo-ulsan-중구-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-ulsan-중구-manual-title" class="seo-title">중구는 야시장 끝나고도 몸이 풀리지 않는다</h2>
          <p>장도 보고 나왔는데, 집에 들어오는 길에서 왜 이렇게 숨이 가빠졌는지 모르겠더라. 웃고 돌아왔는데도 몸은 이미 피로 모드.</p>
          <p>중구의 핵심 테마는 ${theme}야. ${places}를 돌며 생활 패턴 ${pattern}이 이어지고, ${fatigue}가 붙는 순간 긴장이 천천히 쌓인다. 특히 ${local} 쪽이 지나갈 때마다 발부터 묵직해져서, 마무리까지 계속 남아.</p>
          <p>${keyword}는 후기보다 동선에 더 반응해. ${local}에서 굳은 느낌을 한 줄로만 말해주면, 방문 마사지에서 근육 이완이 바로 연결된다.</p>
        </div>
      </section>`;
  }

  if (district === '남구') {
    return `
      <section class="seo-section" aria-labelledby="seo-ulsan-남구-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-ulsan-남구-manual-title" class="seo-title">남구는 삼산에서 시작된 피로가 밤까지 간다</h2>
          <p>오늘은 괜찮을 거라 생각했는데, 삼산 쪽 주차 찾다가 시간 다 써버렸다. 내려서 걸을 때 몸이 더 무거워졌어.</p>
          <p>남구의 핵심 테마는 ${theme}야. ${places}를 오가며 생활 패턴 ${pattern}이 이어지고, ${fatigue} 같은 조건이 겹치면 퇴근 뒤에도 회복이 느려진다. ${local}을 지나며 굳는 순간이 딱 있어서, 그 지점이 마사지의 출발점이 된다.</p>
          <p>그래서 ${keyword}는 “어디에서 멈췄는지”만 맞추는 게 중요해. ${local} 한 줄만 기억해도 근육 이완 방향이 빠르게 잡힌다.</p>
        </div>
      </section>`;
  }

  if (district === '동구') {
    return `
      <section class="seo-section" aria-labelledby="seo-ulsan-동구-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-ulsan-동구-manual-title" class="seo-title">동구는 교대 이후 바람이 피로를 더 굳힌다</h2>
          <p>해안은 시원했는데, 밤이 되니 몸이 더 무거워진다. 전하 쪽 산책로를 잠깐 걷는데도 다리가 먼저 포기하더라.</p>
          <p>동구의 핵심 테마는 ${theme}야. ${places}를 오가며 생활 패턴 ${pattern}이 이어지고, ${fatigue}가 닿는 날엔 교대의 피로가 오래 간다. 특히 ${local}에서 파도 냄새와 야간 소음이 같이 들어오면 긴장이 늦게 풀린다.</p>
          <p>${keyword}는 도착 전에 ${local}을 한 번만 떠올려줘. 그 구간부터 방문 마사지에서 근육 이완이 잘 들어간다.</p>
        </div>
      </section>`;
  }

  if (district === '북구') {
    return `
      <section class="seo-section" aria-labelledby="seo-ulsan-북구-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-ulsan-북구-manual-title" class="seo-title">북구는 외곽 통근이 끝나도 시내가 남는다</h2>
          <p>농소 쪽 장보고 돌아오는 길에 IC에서 또 멈췄다. 멀쩡하던 몸이 그 순간부터 느려진 느낌!</p>
          <p>북구의 핵심 테마는 ${theme}야. ${places}를 오가며 생활 패턴 ${pattern}이 반복되고, ${fatigue} 같은 피로 조건이 겹치면 걸을 때도 리듬이 뚝 끊긴다. ${local}에서 한 번 더 굳는 바람에, 집에 와도 풀림이 늦어져.</p>
          <p>그래서 ${keyword}는 “어디서 오래 막혔는지”를 ${local} 기준으로 말해줘. 방문 마사지의 근육 이완은 그 흐름을 따라가면 빨라진다.</p>
        </div>
      </section>`;
  }

  // 울주
  return `
    <section class="seo-section" aria-labelledby="seo-ulsan-울주-manual-title">
      <div class="container seo-inner">
        <h2 id="seo-ulsan-울주-manual-title" class="seo-title">울주는 산단 야근 뒤에 해안이 더 아프다</h2>
        <p>오늘은 일정을 잘 끝낸 줄 알았는데, 집 가는 길에 간절곶 쪽 바람이 들어오면서 다시 뻐근해졌다.</p>
        <p>울주의 핵심 테마는 ${theme}야. ${places}를 돌며 생활 패턴 ${pattern}이 이어지고, ${fatigue}가 겹치는 날엔 몸이 천천히 지친다. 특히 ${local}에서 멈칫할 때 온산 특유의 느낌과 여름 인파가 같이 남아서, 긴장이 오래 간다.</p>
        <p>그래서 ${keyword}는 ${local}에서 “멈추는 순간”을 먼저 말해줘. 그 지점부터 방문 마사지의 근육 이완을 맞추면 피로 회복이 더 빨라진다.</p>
      </div>
    </section>`;
}

function main() {
  const md = fs.readFileSync(PROFILE_PATH, 'utf8');
  const profiles = parseProfiles(md);

  const region = '울산';
  const regionProfile = profiles.get(region);
  if (!regionProfile) throw new Error('울산 프로필 없음');

  // 지역(보조)
  {
    const regionHtml = fs.readFileSync(REGION_PATH, 'utf8');
    fs.writeFileSync(REGION_PATH, upsertSeoSection(regionHtml, buildRegionSeo(regionProfile)), 'utf8');
  }

  const districts = ['중구', '남구', '동구', '북구', '울주'];
  for (const district of districts) {
    const key = `${region}.${district}`;
    const p = profiles.get(key);
    if (!p) throw new Error(`${key} 프로필 없음`);
    const filePath = path.join(DISTRICTS_DIR, `울산-${district}출장마사지.html`);
    if (!fs.existsSync(filePath)) throw new Error(`파일 없음: ${filePath}`);
    const html = fs.readFileSync(filePath, 'utf8');
    fs.writeFileSync(filePath, upsertSeoSection(html, buildDistrictSeo(region, district, p)), 'utf8');
  }

  console.log('[done] 울산 지역+구 seo-section 수작업 재작성 완료(표 제거)');
}

if (require.main === module) main();

