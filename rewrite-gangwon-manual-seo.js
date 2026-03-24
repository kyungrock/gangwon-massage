const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PROFILE_PATH = path.join(ROOT, 'korea-regions-seo-profiles.md');
const REGION_PATH = path.join(ROOT, 'regions', '강원출장마사지.html');
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
    const n = m[1];
    const v = m[2].trim();
    if (n === '1') cur.theme = v;
    if (n === '2') cur.places = v;
    if (n === '3') cur.pattern = v;
    if (n === '4') cur.fatigue = v;
    if (n === '5') cur.local = v;
  }
  flush();
  return map;
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

function pick(arr, idx) {
  return arr[idx % arr.length];
}

function mergeLocal(local) {
  return String(local || '').replace(/[“”]/g, '');
}

function buildRegionSeo(p) {
  const keyword = '강원 출장마사지';
  const local = mergeLocal(p.local);
  const intros = [
    `차에서 내리자마자 한숨이 먼저 나왔다. 아, 오늘 진짜 길었다.`,
    `숙소 문을 닫는 순간 다리에 힘이 풀렸다. 아, 오늘은 유난히 무겁다.`,
    `풍경은 좋았는데 몸은 정반대였다. 아, 오늘 피로가 늦게 올라온다.`,
    `운전은 끝났는데 긴장은 안 풀렸다. 아, 오늘 컨디션이 훅 떨어진다.`,
  ];
  const intro = pick(intros, 0);
  return `
      <section class="seo-section" aria-labelledby="seo-gangwon-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gangwon-manual-title" class="seo-title">강원 루트 뒤에 남는 피로, 왜 늦게 커질까</h2>
          <p>
            ${escapeHtml(intro)} 이동은 길었는데 쉬는 타이밍은 짧았고, 끝났다고 생각한 뒤에야 어깨와 허리가 동시에 무거워졌다.
            강원권 일정은 산줄기와 동해, 접경 축이 한날에 겹치기 쉬워서 리듬이 단순하지 않다. 춘천·남이섬에서 시작해 강릉·속초·동해로 흐르고, 평창·정선이나 원주·태백으로 갈라지는 동선은 보기엔 여행이지만 몸에는 반복 탑승으로 남는다.
          </p>
          <p>
            여기서 흐름은 분명하다. ${escapeHtml(p.theme)}라는 큰 축 위에 ${escapeHtml(p.places)}가 얹히고,
            생활은 ${escapeHtml(p.pattern)} 쪽으로 반복된다. 문제는 ${escapeHtml(p.fatigue)} 같은 상황이 붙는 날이다.
            그때 ${escapeHtml(local)} 같은 로컬 구간을 지나면 도착 후에도 긴장이 남아 근육 이완이 늦다.
          </p>
          <p>
            강원 전체는 지도가 넓은 만큼 피로도 넓게 퍼진다. 그래서 <strong>${keyword}</strong>를 찾을 때는 강도보다 맥락이 우선이다.
            오늘 어디를 지나왔는지 한 줄로 정리해 전달하면 피로 회복 포인트가 빠르게 맞춰진다.
          </p>
          <h3>예약 메모</h3>
          <table class="seo-table" role="presentation">
            <thead>
              <tr><th scope="col">체크 항목</th><th scope="col">짧은 메모</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>오늘 동선</strong></td>
                <td>“${escapeHtml(local)} 중심으로 이동”처럼 순서 위주로 남기기.</td>
              </tr>
              <tr>
                <td><strong>체감 부위</strong></td>
                <td>“다리보다 허리/어깨 먼저”처럼 우선순위 전달.</td>
              </tr>
              <tr>
                <td><strong>시간 여유</strong></td>
                <td><strong>방문 마사지</strong>는 30분 여유 확보 시 피로 회복 체감이 좋아진다.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>`;
}

function introForDistrict(local, district, idx) {
  const point = local.includes('“') ? local.split('“')[1]?.split('”')[0] : local;
  const intros = [
    `아, 오늘 진짜 힘들다. ${point || local} 지나온 뒤 ${district}에서는 몸이 먼저 반응한다.`,
    `${district} 들어오자마자 허리 옆이 무겁다. 아, 오늘 진짜 힘들다.`,
    `걷는 시간은 짧았는데 ${district} 피로는 길게 남는다. 아, 오늘 진짜 힘들다.`,
    `대기-이동이 반복된 날, ${district}는 피로가 늦게 터진다. 아, 오늘 진짜 힘들다.`,
  ];
  return intros[idx % intros.length];
}

function buildDistrictSeo(district, p, idx) {
  const keyword = `강원 ${district} 출장마사지`;
  const local = mergeLocal(p.local);
  const intros = [
    `엘리베이터 문이 닫히는 순간, ${district}에서 보낸 하루가 한꺼번에 밀려왔다.`,
    `신호 대기만 몇 번 했을 뿐인데 ${district} 구간을 지나고 나니 어깨가 먼저 굳었다.`,
    `걷는 양은 많지 않았는데 ${district} 일정은 끝나고 나서 더 무거워졌다.`,
    `카페에 앉자마자 허리부터 뻣뻣해졌다. ${district} 루트는 항상 이렇게 늦게 반응한다.`,
    `숙소 체크인하고 나서야 피로가 올라왔다. ${district} 동선은 끝난 뒤가 더 길다.`,
  ];
  const bodies = [
    `${district}의 핵심 테마는 ${p.theme}에 가깝다. 주요 장소가 ${p.places}로 이어지면서 생활 패턴도 ${p.pattern}처럼 고정되기 쉽다.`,
    `${district} 하루를 지배하는 건 ${p.theme} 축이다. ${p.places}를 오가는 동안 ${p.pattern}이 반복되고, 피로는 조용히 쌓인다.`,
    `${district}는 ${p.theme} 결이 강하다. ${p.places}를 밟는 생활 루트가 ${p.pattern}으로 굳어 피로 회복 템포를 늦춘다.`,
    `${district}에서 체감이 큰 이유는 ${p.theme} 때문이다. ${p.places} 동선을 따라 ${p.pattern}이 반복되면 피로가 늦게 터진다.`,
  ];
  const closers = [
    `${keyword} 선택의 핵심은 오늘 루트 전달이다. ${local}를 지났다는 한 줄이 근육 이완 방향을 바로 잡는다.`,
    `${keyword}를 찾을 땐 세게보다 정확하게. ${local} 같은 로컬 동선을 먼저 적으면 피로 회복 속도가 달라진다.`,
    `${keyword}는 후기 숫자보다 맥락 적합도가 우선이다. ${local}를 거쳤다는 정보가 코스 조율의 시작점이 된다.`,
    `${keyword}에서 중요한 건 강도가 아니라 맥락이다. ${local} 중심 이동이라고 말하는 순간 회복 설계가 빨라진다.`,
  ];
  const intro = pick(intros, idx);
  const body = pick(bodies, idx + 1);
  const closer = pick(closers, idx + 2);
  return `
      <section class="seo-section" aria-labelledby="seo-gangwon-${district}-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gangwon-${district}-manual-title" class="seo-title">강원 ${district} 동선 피로, 오늘 루트 기준 요약</h2>
          <p>
            ${escapeHtml(intro)} 이 페이지 스토리는 <strong>강원.${escapeHtml(district)}</strong> 블록 하나만 근거로 다시 작성했다.
            강원 전체 맥락은 보조로만 두고, 다른 시/구 정보는 섞지 않았다.
          </p>
          <p>
            ${escapeHtml(body)}
            이 말은 곧, 핵심 테마·주요 장소·생활 패턴이 하루 안에서 겹치면 피로 상황이 빨라진다는 뜻이다.
            ${escapeHtml(p.fatigue)}가 붙는 날엔 ${escapeHtml(local)} 같은 로컬 구간에서 체감이 더 선명해진다.
          </p>
          <p>
            그래서 ${district}에선 이동 강도보다 순서가 중요하다. 같은 거리라도 루트가 다르면 피로 부위도 바뀐다.
            ${escapeHtml(closer)}
          </p>
          <h3>${district} 예약 메모</h3>
          <table class="seo-table" role="presentation">
            <thead>
              <tr><th scope="col">항목</th><th scope="col">짧은 메모</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>동선 한 줄</strong></td>
                <td>“${escapeHtml(local)} 중심 이동”처럼 로컬 순서를 먼저 적기.</td>
              </tr>
              <tr>
                <td><strong>부위 우선</strong></td>
                <td>“다리보다 허리/어깨 먼저”처럼 먼저 무거운 부위를 전달.</td>
              </tr>
              <tr>
                <td><strong>도착 여유</strong></td>
                <td><strong>방문 마사지</strong> 도착 여유를 두면 근육 이완 맞춤이 빨라진다.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>`;
}

function main() {
  const md = fs.readFileSync(PROFILE_PATH, 'utf8');
  const profiles = parseProfiles(md);
  const regionProfile = profiles.get('강원');
  if (!regionProfile) throw new Error('강원 프로필을 찾지 못했습니다.');

  const regionHtml = fs.readFileSync(REGION_PATH, 'utf8');
  fs.writeFileSync(REGION_PATH, upsertSeoSection(regionHtml, buildRegionSeo(regionProfile)), 'utf8');

  const districts = [
    '원주', '춘천', '강릉', '동해', '속초', '삼척', '홍천', '태백', '철원',
    '횡성', '평창', '영월', '정선', '인제', '고성', '양양', '화천', '양구',
  ];

  districts.forEach((d, idx) => {
    const key = `강원.${d}`;
    const p = profiles.get(key);
    if (!p) throw new Error(`${key} 프로필 없음`);
    const file = path.join(DISTRICTS_DIR, `강원-${d}출장마사지.html`);
    if (!fs.existsSync(file)) throw new Error(`파일 없음: ${file}`);
    const html = fs.readFileSync(file, 'utf8');
    fs.writeFileSync(file, upsertSeoSection(html, buildDistrictSeo(d, p, idx)), 'utf8');
  });

  console.log('[done] 강원 region + 18 district 1000자 이하형 SEO 재작성 완료');
}

if (require.main === module) {
  main();
}

