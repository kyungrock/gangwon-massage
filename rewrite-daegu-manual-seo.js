const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PROFILE_PATH = path.join(ROOT, 'korea-regions-seo-profiles.md');
const REGION_PATH = path.join(ROOT, 'regions', '대구출장마사지.html');
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
  // 프로필의 “ ” 제거(문장에 우리가 다시 자연스럽게 붙일 수 있게)
  return String(local || '').replace(/[“”]/g, '');
}

function buildRegionSeo(p) {
  const theme = escapeHtml(p.theme);
  const places = escapeHtml(p.places);
  const pattern = escapeHtml(p.pattern);
  const fatigue = escapeHtml(p.fatigue);
  const local = escapeHtml(cleanLocal(p.local));

  return `
    <section class="seo-section" aria-labelledby="seo-daegu-region-manual-title">
      <div class="container seo-inner">
        <h2 id="seo-daegu-region-manual-title" class="seo-title">대구 하루가 끝나면 왜 더 뻐근할까</h2>
        <p>아, 오늘 진짜 힘들다. 퇴근하고 나서도 몸이 계속 “아직 갈 데 남았지?” 하듯 굳는다.</p>
        <p>대구 전체 핵심은 ${theme}야. ${places} 사이를 오가며 생활 패턴 ${pattern}이 이어지면, ${fatigue} 같은 피로가 뒤늦게 크게 돌아온다. 그래서 ${local}에서 느린 긴장까지 같이 풀어줘야 근육 이완이 잘 따라온다.</p>
        <p>결국 대구 출장마사지에서 중요한 건 한 가지. 어디가 먼저 뻣뻣했는지 ${local} 한 줄로 말하면, 방문 마사지의 타이밍이 딱 맞는다!</p>
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

  // 구별로 도입/전개/마감 문장 구조를 다르게 유지
  if (district === '중구') {
    return `
      <section class="seo-section" aria-labelledby="seo-daegu-중구-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-daegu-중구-manual-title" class="seo-title">중구는 야간 동선이 피로를 묶는다</h2>
          <p>저녁에 딱히 많이 한 건 아닌데, 집에 들어오는 순간 어깨부터 먼저 잠긴다.</p>
          <p>중구는 ${theme} 쪽으로 움직일 때 차이가 생겨. ${places}에서 생활 패턴 ${pattern}이 계속 이어지고, ${fatigue}가 붙으면 몸은 쉬어도 긴장이 풀리지 않는다. 특히 ${local} 근처에서 “아, 여기서 굳었구나” 싶은 감각이 생긴다.</p>
          <p>${keyword}는 예약할 때 ${local}을 한 줄로만 적어줘. 그러면 방문 마사지에서 근육 이완 포인트가 바로 잡힌다.</p>
        </div>
      </section>`;
  }

  if (district === '동구') {
    return `
      <section class="seo-section" aria-labelledby="seo-daegu-동구-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-daegu-동구-manual-title" class="seo-title">동구는 이동이 길어질수록 허리가 먼저 반응한다</h2>
          <p>오늘은 걷는 날이었는데… 막판에 허리 옆이 먼저 뻐근해졌다.</p>
          <p>동구의 핵심은 ${theme}야. ${places}를 이어서 다니는 동안 생활 패턴 ${pattern}이 몸에 스며들고, ${fatigue}가 겹치는 순간부터 피로가 천천히 쌓인다. ${local}에서 자세가 고정되는 느낌이 들면, 회복도 늦게 따라온다.</p>
          <p>그래서 ${keyword}는 “어느 구간”을 말하는 게 먼저야. ${local}을 기억해두면 근육 이완 타이밍이 훨씬 빨라진다!</p>
        </div>
      </section>`;
  }

  if (district === '서구') {
    return `
      <section class="seo-section" aria-labelledby="seo-daegu-서구-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-daegu-서구-manual-title" class="seo-title">서구는 정체가 아니라 ‘굳음’이 문제</h2>
          <p>카페에 잠깐 앉았는데도 기분이 안 가라앉는다. 몸이 이미 굳어버린 상태였던 거지.</p>
          <p>서구는 ${theme}가 생활 흐름을 결정해. ${places}를 오갈 때 생활 패턴 ${pattern}이 반복되고, ${fatigue} 같은 요소가 겹치면 피로가 말끔히 풀리지 않는다. 특히 ${local}에서 긴장선이 딱 잡힌다.</p>
          <p>${keyword}는 후기보다 ${local} 기준으로 전달하는 게 정확하다. 그 지점을 마사지 시작점으로 잡아줘.</p>
        </div>
      </section>`;
  }

  if (district === '남구') {
    return `
      <section class="seo-section" aria-labelledby="seo-daegu-남구-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-daegu-남구-manual-title" class="seo-title">남구는 ‘처음 한 번’이 오래 간다</h2>
          <p>오늘은 일찍 쉬었는데도, 의외로 피로가 더 남아 있더라.</p>
          <p>남구의 핵심 테마는 ${theme}야. ${places}를 오가며 생활 패턴 ${pattern}이 계속 이어지고, ${fatigue}가 붙는 날엔 몸이 회복을 미루는 편이야. ${local}에서 이미 한 번 굳어버리면, 근육 이완이 늦게 들어온다.</p>
          <p>그래서 ${keyword} 예약할 때는 ${local}만 콕 집어서 말해줘. 그러면 방문 마사지가 피로 회복 쪽으로 빠르게 연결된다.</p>
        </div>
      </section>`;
  }

  if (district === '북구') {
    return `
      <section class="seo-section" aria-labelledby="seo-daegu-북구-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-daegu-북구-manual-title" class="seo-title">북구는 바깥 활동 끝나고도 긴장이 남는다</h2>
          <p>밖에서 움직인 뒤 집에 오면, 아무 생각 없이 쉬고 싶어지는데 몸은 계속 긴장 모드.</p>
          <p>북구는 ${theme}가 강해. ${places} 사이를 오가며 생활 패턴 ${pattern}이 반복되고, ${fatigue} 같은 피로 상황이 겹치면 근육이 늦게 풀린다. ${local} 근처에서 숨이 답답해진 느낌이 들면 그게 포인트다.</p>
          <p>${keyword}는 동선 회상만 해도 좋아. ${local}에서 언제부터 굳었는지만 말해줘. 그러면 방문 마사지에서 피로 회복 방향이 바로 맞는다.</p>
        </div>
      </section>`;
  }

  if (district === '수성') {
    return `
      <section class="seo-section" aria-labelledby="seo-daegu-수성-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-daegu-수성-manual-title" class="seo-title">수성은 ‘바람+걸음’이 누적을 만든다</h2>
          <p>오늘은 걸어서 다녔는데, 끝나고 나니 다리보다 어깨가 먼저 말한다.</p>
          <p>수성의 핵심 테마는 ${theme}야. ${places}를 오갈 때 생활 패턴 ${pattern}이 자연스럽게 이어지고, ${fatigue}가 겹치면 피로가 몸 안쪽까지 번진다. ${local} 같은 로컬 구간에서 굳음이 빨리 고정된다.</p>
          <p>그래서 ${keyword}는 도착 후 바로 그 구간을 떠올리게 해줘. ${local}을 기준으로 근육 이완을 맞추면 회복이 편해진다.</p>
        </div>
      </section>`;
  }

  if (district === '달서') {
    return `
      <section class="seo-section" aria-labelledby="seo-daegu-달서-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-daegu-달서-manual-title" class="seo-title">달서는 ‘대기 시간이’ 몸을 먼저 지치게 해</h2>
          <p>오늘은 기다린 시간이 길었어. 그 사이에 몸이 먼저 식더라.</p>
          <p>달서의 핵심은 ${theme}야. ${places}를 오갈 때 생활 패턴 ${pattern}이 반복되고, ${fatigue} 같은 상황이 겹치면 피로가 풀리지 않고 남는다. 특히 ${local}에서 멈춰 서는 순간 굳음이 시작된다.</p>
          <p>${keyword} 예약할 때 ${local}에서 ‘대기/정체/멈춤’이 시작된 걸 한 줄로만 말해줘. 그러면 방문 마사지가 그 흐름을 바로 끊어준다.</p>
        </div>
      </section>`;
  }

  if (district === '달성') {
    return `
      <section class="seo-section" aria-labelledby="seo-daegu-달성-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-daegu-달성-manual-title" class="seo-title">달성은 거리보다 ‘결’이 피로를 남긴다</h2>
          <p>운전도 했고, 잠깐 산책도 했는데… 끝나고 나면 목이 먼저 뻐근하다.</p>
          <p>달성은 ${theme} 쪽으로 이동하는 날이 문제야. ${places}를 오갈 때 생활 패턴 ${pattern}이 쌓이고, ${fatigue}가 겹치면 긴장이 늦게 풀린다. ${local}에서 자세가 고정되면 그 결이 그대로 남아버려.</p>
          <p>그래서 ${keyword}는 ${local} 기반으로 말해주는 게 핵심. 방문 마사지에서 근육 이완을 그 지점부터 넣어주면 피로 회복이 훨씬 빨라진다.</p>
        </div>
      </section>`;
  }

  // 군위
  return `
    <section class="seo-section" aria-labelledby="seo-daegu-군위-manual-title">
      <div class="container seo-inner">
        <h2 id="seo-daegu-군위-manual-title" class="seo-title">군위는 조용한 동선이지만 피로가 깊게 남는다</h2>
        <p>오늘은 사람도 덜 만나고 조용했는데, 집에 오니 피로가 생각보다 깊다.</p>
        <p>군위의 핵심 테마는 ${theme}야. ${places}를 지나며 생활 패턴 ${pattern}이 이어지고, ${fatigue}가 붙는 순간부터 몸이 느리게 굳는다. ${local}처럼 특정 구간에서 리듬이 바뀌면 긴장은 더 오래 간다.</p>
        <p>${keyword}는 “여기부터”를 말해주는 게 답. ${local}만 짚어도 방문 마사지가 근육 이완 포인트를 정확히 잡아준다.</p>
      </div>
    </section>`;
}

function main() {
  const md = fs.readFileSync(PROFILE_PATH, 'utf8');
  const profiles = parseProfiles(md);

  const region = '대구';
  const rp = profiles.get(region);
  if (!rp) throw new Error('대구 프로필 없음');

  // 지역 페이지(보조)
  {
    const regionHtml = fs.readFileSync(REGION_PATH, 'utf8');
    fs.writeFileSync(REGION_PATH, upsertSeoSection(regionHtml, buildRegionSeo(rp)), 'utf8');
  }

  const districts = ['중구', '동구', '서구', '남구', '북구', '수성', '달서', '달성', '군위'];
  for (const district of districts) {
    const key = `${region}.${district}`;
    const p = profiles.get(key);
    if (!p) throw new Error(`${key} 프로필 없음`);
    const filePath = path.join(DISTRICTS_DIR, `대구-${district}출장마사지.html`);
    if (!fs.existsSync(filePath)) throw new Error(`파일 없음: ${filePath}`);
    const html = fs.readFileSync(filePath, 'utf8');
    fs.writeFileSync(filePath, upsertSeoSection(html, buildDistrictSeo(region, district, p)), 'utf8');
  }

  console.log('[done] 대구 지역+구 seo-section 수작업(1000자 이하) 재작성 완료');
}

if (require.main === module) main();

