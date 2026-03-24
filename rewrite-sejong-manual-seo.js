const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PROFILE_PATH = path.join(ROOT, 'korea-regions-seo-profiles.md');
const REGION_PATH = path.join(ROOT, 'regions', '세종출장마사지.html');

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
  // existing seo-section 통째 교체
  if (/<section class="seo-section"[\s\S]*?<\/section>\s*<\/main>/m.test(html)) {
    return html.replace(/<section class="seo-section"[\s\S]*?<\/section>\s*<\/main>/m, `${sectionHtml}\n    </main>`);
  }
  return html.replace('</main>', `${sectionHtml}\n    </main>`);
}

function cleanLocal(local) {
  // “ ” 제거
  return String(local || '').replace(/[“”]/g, '');
}

function main() {
  const md = fs.readFileSync(PROFILE_PATH, 'utf8');
  const profiles = parseProfiles(md);
  const regionKey = '세종';
  const p = profiles.get(regionKey);
  if (!p) throw new Error('세종 프로필 없음');

  const regionHtml = fs.readFileSync(REGION_PATH, 'utf8');

  const theme = escapeHtml(p.theme);
  const places = escapeHtml(p.places);
  const pattern = escapeHtml(p.pattern);
  const fatigue = escapeHtml(p.fatigue);
  const local = escapeHtml(cleanLocal(p.local));

  const sectionHtml = `
      <section class="seo-section" aria-labelledby="seo-sejong-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-sejong-manual-title" class="seo-title">세종은 끝나고 나서 더 뻐근해지는 동선이 있다</h2>
          <p>아, 오늘은 “대충이면 되겠지” 했다가 끝이 안 좋다. 호수 쪽 산책을 잠깐 했는데도, 집에 돌아오고 나니 허리랑 목이 먼저 말한다.</p>
          <p>세종의 핵심 테마는 <strong>${theme}</strong>야. 정부청사·세종호수공원, 그리고 조치원·연기 같은 주요 장소 ${places}를 하루에 여러 번 훑는 동안 생활 패턴 ${pattern}이 몸에 반복으로 박힌다. 그러다 이전 공무원 스트레스, 신도시 확장 공사, 여름 호수 모기 같은 피로 상황 ${fatigue}가 겹치면, 쉬는 시간이 길어도 근육 이완이 늦어진다.</p>
          <p>특히 “${local}”처럼 기억되는 구간에서 긴장이 먼저 굳는다. 그래서 세종 출장마사지에서는 그 한 줄만 정확히 말해주면 된다. 방문 마사지에서 근육 이완을 ${local} 쪽에 맞추면 피로 회복이 훨씬 빨라지고, 다음날 출근 동선까지 덜 무겁다.</p>
        </div>
      </section>`;

  fs.writeFileSync(REGION_PATH, upsertSeoSection(regionHtml, sectionHtml), 'utf8');

  console.log('[done] 세종 seo-section 수작업(표 제거) 재작성 완료');
}

if (require.main === module) main();

