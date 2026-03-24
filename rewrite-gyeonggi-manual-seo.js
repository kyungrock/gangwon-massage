const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PROFILE_PATH = path.join(ROOT, 'korea-regions-seo-profiles.md');
const REGION_PATH = path.join(ROOT, 'regions', '경기출장마사지.html');
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
  // 기존 seo-section 통째로 교체
  if (/<section class="seo-section"[\s\S]*?<\/section>\s*<\/main>/m.test(html)) {
    return html.replace(
      /<section class="seo-section"[\s\S]*?<\/section>\s*<\/main>/m,
      `${sectionHtml}\n    </main>`
    );
  }
  return html.replace('</main>', `${sectionHtml}\n    </main>`);
}

function cleanLocal(local) {
  return String(local || '').replace(/[“”]/g, '');
}

function hashCode(str) {
  // 간단한 해시: 텍스트 기반으로 변형 선택을 안정적으로 만들기 위함
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function rotate(arr, n) {
  const k = ((n % arr.length) + arr.length) % arr.length;
  return arr.slice(k).concat(arr.slice(0, k));
}

function buildDistrictSeo(region, district, p, idx) {
  const theme = p.theme;
  const places = p.places;
  const pattern = p.pattern;
  const fatigue = p.fatigue;
  const local = cleanLocal(p.local);

  const keyword = `${region} ${district} 출장마사지`;
  const localNoQuotes = local;

  // 5요소를 문장 순서/연결만 바꿔서 페이지마다 다른 리듬으로 구성
  const clauses = [
    { k: 'theme', v: `핵심 테마는 ${theme}` },
    { k: 'places', v: `주요 장소는 ${places}` },
    { k: 'pattern', v: `생활 패턴은 ${pattern}` },
    { k: 'fatigue', v: `피로 상황은 ${fatigue}` },
    { k: 'local', v: `그리고 ${localNoQuotes}에서 굳는 느낌이 빨라진다` },
  ];

  const seed = hashCode(`${region}:${district}:${idx}`);

  const introStarters = [
    `아, 오늘 진짜 힘들다.`,
    `퇴근하고 나서 더 무거워졌다.`,
    `기분은 괜찮은데 몸이 먼저 항복한다.`,
    `오늘은 이동이 길었는데… 괜찮겠지 싶었어.`,
    `한숨이 나오더라.`,
    `막차는 아니었는데 지친다.`,
    `의외로 조용한데 뻐근해.`,
    `생각보다 더 오래 간다.`,
  ];
  const introMiddles = [
    `일단 ${localNoQuotes}에서 뭔가 딱 굳어버린다.`,
    `구간이 ${places} 쪽으로 이어지면, ${fatigue}가 뒤늦게 따라온다.`,
    `${pattern}이 반복되는 날엔 컨디션이 흔들린다.`,
    `${localNoQuotes}를 지나고 나면 목/어깨가 먼저 반응한다.`,
    `${places} 사이를 오가다 보면, ${fatigue}가 몸에 붙는다.`,
    `잠깐 앉는 순간부터, ${localNoQuotes}가 더 무겁게 느껴진다.`,
    `${theme}가 깔린 하루라서 그런지, 몸이 빨리 지친다.`,
    `오늘은 ${district} 루트가 유독 길게 느껴진다.`,
  ];
  const introTail = [
    `괜히 참다가 더 늦어지기 싫어서.`,
    `그래서 지금은 풀어야 할 타이밍이야.`,
    `딱 그 구간만 먼저 잡고 싶다.`,
    `여기서 풀어야 다음 일정이 버틴다.`,
    `오늘 컨디션은 이걸로 정리해야 해.`,
  ];

  const intro = `${introStarters[seed % introStarters.length]} ${introMiddles[(seed >> 3) % introMiddles.length]} ${introTail[(seed >> 6) % introTail.length]}`;

  // 본문 문단 1: 3~4개의 요소만 뽑아서 순서 섞기
  const baseOrder1 = ['theme', 'places', 'pattern', 'fatigue', 'local'];
  const order1 = rotate(baseOrder1, seed % baseOrder1.length);
  const pickCount1 = 3 + ((seed >> 9) % 2); // 3 or 4

  const parts1 = [];
  for (let i = 0; i < pickCount1; i++) {
    const c = clauses.find((x) => x.k === order1[i]);
    parts1.push(c.v);
  }

  // 연결 문장도 변형(문장 구조 반복을 줄이기 위해)
  const connectors1 = [
    `${parts1[0]}. ${parts1[1]}가 돌면,`,
    `${parts1[0]}라서 ${parts1[1]}가 반복되고,`,
    `${parts1[0]}. ${parts1[1]}가 겹치는 날엔`,
    `${parts1[0]} 중심으로 움직이면 ${parts1[1]}이 먼저 느껴져.`,
  ];
  const connector1 = connectors1[seed % connectors1.length];

  let mid1 = '';
  if (pickCount1 === 3) {
    const tailKey = order1[2];
    const tail = clauses.find((x) => x.k === tailKey).v;
    mid1 = `${connector1} 결국 ${tail}가 남는다. 방문 마사지로 그 흐름을 끊으면 피로 회복이 빨라져.`;
  } else {
    const tailKey = order1[2];
    const tail2Key = order1[3];
    const tail = clauses.find((x) => x.k === tailKey).v;
    const tail2 = clauses.find((x) => x.k === tail2Key).v;
    mid1 = `${connector1} ${tail} 그리고 ${tail2}. 그래서 ${localNoQuotes} 지점을 먼저 말해주는 게 좋아.`;
  }

  // 본문 문단 2: 다른 순서 + 다른 문장 구성
  const baseOrder2 = ['places', 'pattern', 'fatigue', 'theme', 'local'];
  const order2 = rotate(baseOrder2, (seed >> 5) % baseOrder2.length);
  const pickCount2 = 4; // 4개로 고정하되 순서만 바뀜

  const parts2 = [];
  for (let i = 0; i < pickCount2; i++) {
    const c = clauses.find((x) => x.k === order2[i]);
    parts2.push(c.v);
  }

  const connectors2 = [
    `이 조합이 닿으면 ${district} 쪽에서 피로가 길어지고,`,
    `결국 ${district} 하루의 결이 ${parts2[0]}로 모이고,`,
    `오늘은 ${parts2[0]}-${parts2[1]} 흐름이 먼저 굳어서`,
    `${parts2[0]}를 밟는 순간 ${parts2[1]}이 따라오고,`,
  ];
  const connector2 = connectors2[(seed >> 2) % connectors2.length];

  // escapeHtml()로 감싸서 주입되기 때문에, 여기서 HTML 태그(<strong>)를 넣으면 화면에 그대로 이스케이프될 수 있다.
  // 따라서 키워드는 일반 텍스트로만 넣는다.
  const mid2 = `${connector2} ${parts2[2]}. 그리고 ${parts2[3]}. ${localNoQuotes} 한 줄만 남겨도 방문 마사지의 근육 이완 방향이 빨리 잡힌다. 그래서 ${keyword}는 “가격”보다 “오늘 구간”을 먼저 맞추는 편이 정확해.`;

  // 마감(짧고 다른 톤)
  const closers = [
    `끝은 길게 말하지 않아. ${localNoQuotes}에서 굳는 감각만 풀어주면 돼.`,
    `오늘도 수고했다 싶을 때, 마지막은 근육 이완으로 마무리.`,
    `예약할 땐 딱 한 줄. “${localNoQuotes} 기준으로 뻐근해” 그게 전부야.`,
    `피로 회복은 늦게 하면 더 힘들어져. 지금, 그리고 이 구간부터.`,
    `방문 마사지 받을 거면, ${localNoQuotes}부터 정리하자.`,
  ];
  const close = closers[(seed >> 7) % closers.length];

  // <table> 금지(요구사항)
  return `
      <section class="seo-section" aria-labelledby="seo-경기-${district}-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-경기-${district}-manual-title" class="seo-title">${region} ${district} 동선 피로, 오늘 기준 짧게</h2>
          <p>${escapeHtml(intro)}</p>
          <p>${escapeHtml(mid1)}</p>
          <p>
            ${escapeHtml(mid2)}
            ${escapeHtml(close)}
          </p>
        </div>
      </section>`;
}

function buildRegionSeo(p) {
  const theme = p.theme;
  const places = p.places;
  const pattern = p.pattern;
  const fatigue = p.fatigue;
  const local = cleanLocal(p.local);

  return `
      <section class="seo-section" aria-labelledby="seo-경기-region-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-경기-region-manual-title" class="seo-title">경기 하루 끝나고 더 피곤해지는 이유</h2>
          <p>아, 오늘 진짜 힘들다. 경기 쪽은 하루 끝나고도 몸이 “아직 이동 중”이라고 계속 말하는 느낌이 있다.</p>
          <p>경기 전체 핵심은 ${escapeHtml(theme)}야. ${escapeHtml(places)}를 오가며 생활 패턴 ${escapeHtml(pattern)}이 반복되고, ${escapeHtml(fatigue)}가 붙으면 피로가 쉽게 안 풀린다. 특히 ${escapeHtml(local)}에서 긴장이 늦게 풀리는 날이 많아.</p>
          <p>그래서 경기 출장마사지는 방문 마사지 받을 때 ${escapeHtml(local)}부터 먼저 짚어주는 게 맞아. 근육 이완 방향이 딱 잡히면 피로 회복도 자연스럽게 따라온다.</p>
        </div>
      </section>`;
}

function main() {
  const md = fs.readFileSync(PROFILE_PATH, 'utf8');
  const profiles = parseProfiles(md);

  const region = '경기';
  const regionProfile = profiles.get(region);
  if (!regionProfile) throw new Error('경기 프로필 없음');

  // 지역 페이지 먼저
  {
    const regionHtml = fs.readFileSync(REGION_PATH, 'utf8');
    fs.writeFileSync(REGION_PATH, upsertSeoSection(regionHtml, buildRegionSeo(regionProfile)), 'utf8');
  }

  const districts = [
    '가평', '고양', '과천', '광명', '광주', '구리', '군포', '김포', '남양주', '동두천', '부천',
    '성남', '수원', '시흥', '안산', '안성', '안양', '양주', '양평', '여주', '연천', '오산', '용인',
    '의왕', '의정부', '이천', '파주', '평택', '포천', '하남', '화성',
  ];

  for (let i = 0; i < districts.length; i++) {
    const district = districts[i];
    const key = `${region}.${district}`;
    const p = profiles.get(key);
    if (!p) throw new Error(`${key} 프로필 없음`);

    const file = path.join(DISTRICTS_DIR, `경기-${district}출장마사지.html`);
    if (!fs.existsSync(file)) throw new Error(`파일 없음: ${file}`);

    const html = fs.readFileSync(file, 'utf8');
    const sectionHtml = buildDistrictSeo(region, district, p, i);
    fs.writeFileSync(file, upsertSeoSection(html, sectionHtml), 'utf8');
  }

  console.log('[done] 경기 지역+구 seo-section 수작업 톤 재작성 완료(표 제거, 1000자 이하 목표)');
}

if (require.main === module) main();

