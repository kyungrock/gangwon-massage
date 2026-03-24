const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PROFILE_PATH = path.join(ROOT, 'korea-regions-seo-profiles.md');
const REGION_PATH = path.join(ROOT, 'regions', '충북출장마사지.html');
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
  // 기존 seo-section 전체를 통째로 교체(표/리스트도 함께 제거)
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
    <section class="seo-section" aria-labelledby="seo-chungbuk-region-manual-title">
      <div class="container seo-inner">
        <h2 id="seo-chungbuk-region-manual-title" class="seo-title">충북 하루 끝, 피로가 이동하는 동선</h2>
        <p>오늘은 괜찮다고 넘겼는데, 막상 집에 오니 몸이 천천히 굳는다. “한 번 더”가 붙으면 더 길게 남더라.</p>
        <p>충북 전체에서 핵심 테마는 ${theme}야. ${places}를 오갈 때 생활 패턴 ${pattern}이 계속 이어지고, ${fatigue} 같은 피로가 겹치면 근육 이완 타이밍이 늦어진다. 특히 ${local}이 스치듯 지나간 날은 긴장이 잔상처럼 남는다.</p>
        <p>그래서 충북 출장마사지에서는 “어디가 제일 피곤했는지”를 ${local} 기준으로 짧게 말해줘. 그 구간부터 풀리기 시작하면 피로 회복도 자연스럽게 따라온다.</p>
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

  // 각 구는 완전히 다른 문장 흐름으로 구성
  if (district === '청주') {
    return `
      <section class="seo-section" aria-labelledby="seo-chungbuk-청주-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-chungbuk-청주-manual-title" class="seo-title">청주는 오송 통근이 끝나도 어깨가 남는다</h2>
          <p>오송에서 일 마치고 내려오는데, 승강장 계단만 밟아도 숨이 턱 막힌다. 집엔 가야 하는데 몸이 먼저 멈춘 느낌.</p>
          <p>청주 핵심 테마는 ${theme}야. ${places} 사이를 오갈 때 생활 패턴 ${pattern}이 반복되는데, ${fatigue}가 겹치면 피로가 늦게 올라와 더 답답해진다. 특히 ${local}에서 자세가 고정되는 순간, 근육 이완이 필요한 구간이 확 보인다.</p>
          <p>${keyword}는 예약할 때 “${local} 쪽에서 가장 뻐근했다” 한 줄만 남겨도 충분해. 그 말이 방문 마사지에서 바로 방향을 정해준다.</p>
        </div>
      </section>`;
  }

  if (district === '충주') {
    return `
      <section class="seo-section" aria-labelledby="seo-chungbuk-충주-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-chungbuk-충주-manual-title" class="seo-title">충주는 호수 드라이브 후 허리가 먼저 식는다</h2>
          <p>충주호 바람은 시원했는데, 문제는 그 뒤였다. 집 앞에 도착했는데도 허리랑 다리가 계속 차가워지는 느낌.</p>
          <p>충주의 핵심 테마는 ${theme}야. ${places}를 오가며 생활 패턴 ${pattern}이 이어지고, ${fatigue}가 붙으면 겉으로는 괜찮아도 몸속 긴장이 늦게 풀린다. ${local}처럼 흐름이 딱 잡히는 구간이 나오면, 근육 이완 타이밍도 그 지점에 맞춰야 편하다.</p>
          <p>${keyword}는 “어느 온천거리/산책 지점”이 먼저였는지 ${local} 중심으로 한 번만 회상해줘. 그래야 피로 회복이 빠르게 연결된다.</p>
        </div>
      </section>`;
  }

  if (district === '제천') {
    return `
      <section class="seo-section" aria-labelledby="seo-chungbuk-제천-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-chungbuk-제천-manual-title" class="seo-title">제천은 고개 한 번 넘으면 피로가 누적된다</h2>
          <p>의림지 한 바퀴 돌고 나왔는데 왜 이렇게 무거운지 모르겠다. 박달재를 넘는 순간 몸이 조용히 지쳤다.</p>
          <p>제천의 핵심 테마는 ${theme}야. ${places}에서 생활 패턴 ${pattern}이 이어지는데, ${fatigue}처럼 안개·눈이나 고립감이 닿는 날은 힘이 더디게 빠진다. ${local}에서 발이 굳는 느낌이 오면, 그때 방문 마사지의 근육 이완을 맞추는 게 중요해.</p>
          <p>그래서 ${keyword}는 “${local}에서 제일 오래 버텼다”라고만 말해줘. 한 줄이 그날의 피로 방향을 바로 잡아준다.</p>
        </div>
      </section>`;
  }

  if (district === '보은') {
    return `
      <section class="seo-section" aria-labelledby="seo-chungbuk-보은-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-chungbuk-보은-manual-title" class="seo-title">보은은 사찰 순례 끝나고도 몸이 계속 따라온다</h2>
          <p>법주사 앞에서 걷는 건 가볍게 느껴졌는데, 막상 보은읍으로 내려오니 온몸이 느리게 굳는다. ‘이게 운동이었나?’ 싶어.</p>
          <p>보은 핵심 테마는 ${theme}야. ${places}를 오가며 생활 패턴 ${pattern}이 자연스럽게 붙고, ${fatigue}가 겹치면 산길 운전 피로가 길게 남는다. 특히 ${local}에서 걸음이 느려지는 날엔, 근육 이완이 늦어지기 전에 먼저 끊어주는 게 좋아.</p>
          <p>${keyword}는 예약할 때 ${local}만 딱 적어줘. 그러면 방문 마사지가 그 구간부터 풀어주기 시작한다.</p>
        </div>
      </section>`;
  }

  if (district === '옥천') {
    return `
      <section class="seo-section" aria-labelledby="seo-chungbuk-옥천-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-chungbuk-옥천-manual-title" class="seo-title">옥천은 금강 둔치가 끝나면 몸이 확 무거워진다</h2>
          <p>낮엔 괜찮았는데, 저녁으로 넘어가면서 갑자기 열감이 돌더라. 시내로 들어오니 다리도, 허리도 같이 무너졌다.</p>
          <p>옥천 핵심 테마는 ${theme}야. ${places}를 지나며 생활 패턴 ${pattern}이 반복되고, ${fatigue}가 겹치면 피로가 쉽게 식지 않는다. ${local}에서 움직임이 느려지는 순간부터 긴장이 고정된다. 그 흐름을 방문 마사지에서 끊어줘야 근육 이완이 제대로 들어간다.</p>
          <p>${keyword}는 “${local} 쪽이 제일 버거웠어”라고만 정리해줘. 짧게 말해도 방향은 충분히 맞는다.</p>
        </div>
      </section>`;
  }

  if (district === '영동') {
    return `
      <section class="seo-section" aria-labelledby="seo-chungbuk-영동-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-chungbuk-영동-manual-title" class="seo-title">영동은 수확기 피로가 집까지 간다</h2>
          <p>와인터널 보고 나왔는데, 몸은 왜 이렇게 가벼워지지 않을까. 운전대 잡고 있는 시간만 길어진 느낌.</p>
          <p>영동의 핵심 테마는 ${theme}야. ${places}에서 생활 패턴 ${pattern}이 계속되고, ${fatigue}가 붙으면 수확기 피로가 근육 사이에 남는다. 특히 ${local}처럼 길이 겹치는 지점에서 몸이 먼저 굳고, 그 다음에 피로가 따라오는 편이야.</p>
          <p>${keyword}는 예약할 때 “${local}에서 힘이 먼저 빠졌다” 한 문장으로 끝내줘. 그 지점이 방문 마사지 근육 이완의 시작점이 된다.</p>
        </div>
      </section>`;
  }

  if (district === '증평') {
    return `
      <section class="seo-section" aria-labelledby="seo-chungbuk-증평-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-chungbuk-증평-manual-title" class="seo-title">증평은 청주 통근이 길어질수록 몸이 먼저 지친다</h2>
          <p>퇴근하고 나면 그냥 앉고 싶어. 그런데 집 가는 길에 통근 동선이 또 붙어서, 생각보다 더 오래 걸린다.</p>
          <p>증평 핵심 테마는 ${theme}야. ${places}를 오갈 때 생활 패턴 ${pattern}이 이어지고, ${fatigue}가 겹치면 산단 야근 여운이 밤까지 남는다. ${local}에서 “여기서 멈추면 끝” 같은 감각이 오면, 그때 긴장을 풀어줘야 한다.</p>
          <p>${keyword}는 ${local}을 기준으로 한 줄만 말해줘. 방문 마사지가 그 구간부터 피로 회복 쪽으로 맞춰진다.</p>
        </div>
      </section>`;
  }

  if (district === '진천') {
    return `
      <section class="seo-section" aria-labelledby="seo-chungbuk-진천-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-chungbuk-진천-manual-title" class="seo-title">진천은 온천 동선이 끝나도 마음이 남는다</h2>
          <p>덕산온천거리에서 발이 풀리는 듯했는데, 집 돌아가는 차 안에서 다시 몸이 뻐근해졌다. 여름이 이렇게 오래 가나 싶어.</p>
          <p>진천의 핵심 테마는 ${theme}야. ${places}에서 생활 패턴 ${pattern}이 이어지고, ${fatigue}가 겹치면 축산 악취나 더위가 몸을 늦게 풀어준다. 특히 ${local}에서 숨이 답답해지는 날은 근육 이완 타이밍을 더 앞당겨야 편하다.</p>
          <p>${keyword}는 예약할 때 ${local}만 짚어줘. 방문 마사지에서 그 지점부터 풀리면, 피로 회복이 훨씬 자연스럽다.</p>
        </div>
      </section>`;
  }

  if (district === '괴산') {
    return `
      <section class="seo-section" aria-labelledby="seo-chungbuk-괴산-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-chungbuk-괴산-manual-title" class="seo-title">괴산은 산길이 길어질수록 허리가 먼저 말한다</h2>
          <p>산막이옛길 입구로 들어갈 때는 몰랐어. 돌아오는 길에 운전대 잡고 있던 손이 저려오더라.</p>
          <p>괴산 핵심 테마는 ${theme}야. ${places}를 지나며 생활 패턴 ${pattern}이 이어지고, ${fatigue}가 붙으면 산길 운전 피로가 길게 남는다. 특히 ${local}에서 몸이 차분히 굳는 순간이 오면, 근육 이완은 그 지점에 맞춰야 효과가 빨라져.</p>
          <p>${keyword}는 “${local} 쪽이 제일 오래 갔다”라고만 정리해줘. 그 정보가 방문 마사지의 동선 조율이 된다.</p>
        </div>
      </section>`;
  }

  if (district === '음성') {
    return `
      <section class="seo-section" aria-labelledby="seo-chungbuk-음성-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-chungbuk-음성-manual-title" class="seo-title">음성은 물류 야근이 몸에 눌어붙는다</h2>
          <p>퇴근 시간인데도 마음은 더 남아 있다. 읍내로 들어오는 길이 막히는 순간, 어깨가 먼저 무거워져.</p>
          <p>음성 핵심 테마는 ${theme}야. ${places}에서 생활 패턴 ${pattern}이 반복되고, ${fatigue}가 겹치면 축산 냄새와 야근 피로가 같이 쌓인다. ${local}처럼 정체가 시작되는 지점에서 몸이 굳으면, 근육 이완은 늦어지기 전에 맞춰야 한다.</p>
          <p>${keyword}는 “${local}에서 멈추는 시간이 길었다” 한 줄이 제일 좋아. 방문 마사지에서 그 흐름을 끊어주면 피로 회복이 빨라진다.</p>
        </div>
      </section>`;
  }

  // 단양
  return `
    <section class="seo-section" aria-labelledby="seo-chungbuk-단양-manual-title">
      <div class="container seo-inner">
        <h2 id="seo-chungbuk-단양-manual-title" class="seo-title">단양은 성수기 정체가 협곡 피로를 만든다</h2>
        <p>도담삼봉 전망대에서 사진 찍고 나왔는데, 다리가 왜 이렇게 무거울까? 차로 돌아가려는데 주차가 또 한참이더라.</p>
        <p>단양 핵심 테마는 ${theme}야. ${places}를 오가며 생활 패턴 ${pattern}이 이어지고, ${fatigue}가 겹치면 일교차와 정체가 몸에 남는다. 특히 ${local}에서 오래 움직이지 못하면 긴장이 오래 가고, 근육 이완 타이밍이 뒤로 밀린다.</p>
        <p>${keyword}는 ${local}을 기준으로 “여기가 가장 힘들었다”만 말해줘. 그 지점부터 방문 마사지가 피로 회복으로 연결된다.</p>
      </div>
    </section>`;
}

function main() {
  const md = fs.readFileSync(PROFILE_PATH, 'utf8');
  const profiles = parseProfiles(md);

  const region = '충북';
  const rp = profiles.get(region);
  if (!rp) throw new Error('충북 프로필 없음');

  // 지역 페이지(보조)
  {
    const regionHtml = fs.readFileSync(REGION_PATH, 'utf8');
    fs.writeFileSync(REGION_PATH, upsertSeoSection(regionHtml, buildRegionSeo(rp)), 'utf8');
  }

  const districts = ['청주', '충주', '제천', '보은', '옥천', '영동', '증평', '진천', '괴산', '음성', '단양'];
  for (const district of districts) {
    const key = `${region}.${district}`;
    const p = profiles.get(key);
    if (!p) throw new Error(`${key} 프로필 없음`);

    const filePath = path.join(DISTRICTS_DIR, `충북-${district}출장마사지.html`);
    if (!fs.existsSync(filePath)) throw new Error(`파일 없음: ${filePath}`);

    const html = fs.readFileSync(filePath, 'utf8');
    const sectionHtml = buildDistrictSeo(region, district, p);
    fs.writeFileSync(filePath, upsertSeoSection(html, sectionHtml), 'utf8');
  }

  console.log('[done] 충북 지역+구 수작업(표 제거, 1000자 이하) 재작성 완료');
}

if (require.main === module) main();

