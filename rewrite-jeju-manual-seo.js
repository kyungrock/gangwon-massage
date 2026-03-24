const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PROFILE_PATH = path.join(ROOT, 'korea-regions-seo-profiles.md');
const REGION_PATH = path.join(ROOT, 'regions', '제주출장마사지.html');
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
  // 따옴표/특수문자 정리: 프로필에 들어있는 값은 그대로 쓰되, HTML 깨짐 방지 위해 “ ”만 제거
  return String(local || '').replace(/[“”]/g, '');
}

function buildRegionSeo(p) {
  const theme = p.theme;
  const places = p.places;
  const pattern = p.pattern;
  const fatigue = p.fatigue;
  const local = cleanLocal(p.local);

  return `
      <section class="seo-section" aria-labelledby="seo-jeju-region-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-jeju-region-manual-title" class="seo-title">제주 하루 끝, 바람이 지나간 자리까지 풀어야 해</h2>
          <p>아, 오늘은 괜히 더 늦게까지 버틴 것 같다. 드라이브는 즐거웠는데, 숙소 가는 길이 끝나는 순간 근육이 먼저 “어?” 하고 멈춘다.</p>
          <p>제주 전체의 핵심은 ${escapeHtml(theme)}야. ${escapeHtml(places)}를 오가며 차량 필수 생활이 이어지고, ${escapeHtml(pattern)} 같은 리듬이 반복되면 ${escapeHtml(fatigue)}가 뒤늦게 번진다.</p>
          <p>특히 협재 해변과 애월 카페거리, 그리고 성산일출봉 입구 쪽으로 흐름이 몰린 날엔, 바람과 자외선 느낌이 끝까지 남아. ${escapeHtml(local)}처럼 기억되는 구간을 기준으로 마사지 타이밍을 잡으면, 방문 마사지에서 근육 이완이 훨씬 빠르게 들어온다.</p>
          <p>그래서 <strong>제주 출장마사지</strong>는 후기보다 “오늘 내가 어디에서 굳었는지”를 먼저 말하는 게 좋아. 그 한 줄이 ${escapeHtml(local)}를 기준으로 딱 맞아떨어지면, 피로 회복도 자연스럽게 붙는다.</p>
        </div>
      </section>`;
}

function buildDistrictSeo(region, district, p) {
  const theme = p.theme;
  const places = p.places;
  const pattern = p.pattern;
  const fatigue = p.fatigue;
  const local = cleanLocal(p.local);
  const keyword = `${region} ${district} 출장마사지`;

  // 각 구마다 인트로/마감 리듬을 완전히 다르게
  if (district === '제주') {
    return `
      <section class="seo-section" aria-labelledby="seo-jeju-jeju-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-jeju-jeju-manual-title" class="seo-title">제주 구간은 공항 동선에서 피로가 먼저 굳는다</h2>
          <p>기분은 괜찮은데, 몸은 왜 이렇게 느려졌지? 제발 숙소 앞에만 도착하면 풀릴 줄 알았어.</p>
          <p>여긴 ${escapeHtml(theme)}가 기본 결이야. 제주공항부터 용두암·이호테우, 함덕·협재, 건입동 먹자골목까지 ${escapeHtml(places)}가 이어지면 ${escapeHtml(pattern)}이 길처럼 깔린다.</p>
          <p>그런데 성수기 공항·도로 정체가 겹치고, 바람·모래 감각이 남는 날엔 ${escapeHtml(fatigue)}가 그냥 피곤함으로 끝나지 않는다. ${escapeHtml(local)}에서 “여기쯤부터” 몸이 멈추는 느낌이 딱 와버려.</p>
          <p>그래서 ${escapeHtml(keyword)}는 예약할 때도 한 줄로 충분해. 건입동 먹자골목이나 이호테우 해변처럼 기억나는 구간을 말해주면 근육 이완 방향이 빨리 맞고, 피로 회복도 바로 따라온다. 차에서 내리는 순간 등이 먼저 식는 느낌도 같이 풀어지더라, 진짜.</p>
        </div>
      </section>`;
  }

  // 서귀포
  return `
      <section class="seo-section" aria-labelledby="seo-jeju-seogwipo-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-jeju-seogwipo-manual-title" class="seo-title">서귀포는 일출 일정 끝나면 남쪽 피로가 밀려온다</h2>
          <p>아침에 일찍 일어나서 봤는데, 왜 집 가는 길이 이렇게 길지? 성산 쪽 주차에서 이미 몸이 반응하기 시작하더라.</p>
          <p>서귀포는 ${escapeHtml(theme)}이 만들어낸 흐름이야. 성산일출봉, 중문·쇠소깍, 올레길, 천지연, 표선까지 ${escapeHtml(places)}를 밟는 동안 ${escapeHtml(pattern)}이 이어지고, 리조트/트레킹 동선이 하루를 끌고 간다.</p>
          <p>문제는 ${escapeHtml(fatigue)}가 한꺼번에 올 때야. 여름 자외선이 피부에 남고, 관광객 인파가 움직임을 느리게 만들면, 결국 ${escapeHtml(local)} 같은 지점에서 피로가 고정돼 버려.</p>
          <p>그래서 <strong>${escapeHtml(keyword)}</strong>는 “오늘 성산 일출 명당에서부터” 같은 식으로만 말해줘. 그러면 방문 마사지에서 긴장을 푸는 우선순위가 딱 정해지고, 근육 이완이 더 편하게 들어간다. 끝나고 나서야 아, 잘 왔다 싶어지거든.</p>
        </div>
      </section>`;
}

function main() {
  const md = fs.readFileSync(PROFILE_PATH, 'utf8');
  const profiles = parseProfiles(md);

  const regionKey = '제주';
  const regionProfile = profiles.get(regionKey);
  if (!regionProfile) throw new Error('제주 프로필 없음');

  const regionHtml = fs.readFileSync(REGION_PATH, 'utf8');
  fs.writeFileSync(REGION_PATH, upsertSeoSection(regionHtml, buildRegionSeo(regionProfile)), 'utf8');

  const districts = [
    { name: '제주', key: '제주.제주', file: '제주-제주출장마사지.html' },
    { name: '서귀포', key: '제주.서귀포', file: '제주-서귀포출장마사지.html' },
  ];

  for (const d of districts) {
    const p = profiles.get(d.key);
    if (!p) throw new Error(`${d.key} 프로필 없음`);
    const filePath = path.join(DISTRICTS_DIR, d.file);
    if (!fs.existsSync(filePath)) throw new Error(`파일 없음: ${filePath}`);
    const html = fs.readFileSync(filePath, 'utf8');
    const sectionHtml = buildDistrictSeo('제주', d.name, p);
    fs.writeFileSync(filePath, upsertSeoSection(html, sectionHtml), 'utf8');
  }

  console.log('[done] 제주(지역+구) 3페이지 seo-section 수작업 재작성 완료');
}

if (require.main === module) main();

