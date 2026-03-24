const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PROFILE_PATH = path.join(ROOT, 'korea-regions-seo-profiles.md');
const REGION_PATH = path.join(ROOT, 'regions', '전북출장마사지.html');
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
    <section class="seo-section" aria-labelledby="seo-jeonbuk-region-manual-title">
      <div class="container seo-inner">
        <h2 id="seo-jeonbuk-region-manual-title" class="seo-title">전북은 이동이 끝나도 피로가 남는 구간이 있다</h2>
        <p>오늘은 별일 없는 하루였다고 생각했는데, 집에 오니 몸이 늦게 반응한다. 쉬는데도 무거운 게 신기하다.</p>
        <p>전북의 흐름은 ${theme}에서 시작해. ${places}를 오가며 생활 패턴 ${pattern}이 반복되면, ${fatigue}가 누적되고 ${local}에서 긴장이 더 고정된다. 그래서 ${local}만 제대로 잡으면 근육 이완 방향이 빨라진다.</p>
        <p>전북 출장마사지에서 “어디가 제일 힘들었는지”를 ${local} 한 줄로만 말해줘. 방문 마사지가 그 자리부터 풀어주면 피로 회복이 확 달라진다.</p>
      </div>
    </section>`;
}

function districtSeo(district, p) {
  const theme = escapeHtml(p.theme);
  const places = escapeHtml(p.places);
  const pattern = escapeHtml(p.pattern);
  const fatigue = escapeHtml(p.fatigue);
  const local = escapeHtml(cleanLocal(p.local));
  const keyword = `전북 ${district} 출장마사지`;

  if (district === '전주') {
    return `
      <section class="seo-section" aria-labelledby="seo-jeonbuk-전주-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-jeonbuk-전주-manual-title" class="seo-title">전주는 충동처럼 걷다가, 결국 몸이 멈춘다</h2>
          <p>처음엔 기분 좋게 돌아다녔다. 그런데 충장로나 객리단길 같은 거리 감각이 끝나고, 집에 앉으니 어깨가 갑자기 무거워졌다.</p>
          <p>전주의 핵심은 ${theme}. ${places}가 이어지고, 생활 패턴 ${pattern}이 반복되면 ${fatigue}가 늦게 올라온다. 특히 ${local} 근처에서 몸이 “여기서 쉬어야지” 모드로 변한다.</p>
          <p>그래서 ${keyword}는 예약할 때 ${local}만 한 줄로 말해줘. 방문 마사지의 근육 이완이 그 구간에 딱 맞게 들어간다.</p>
        </div>
      </section>`;
  }

  if (district === '익산') {
    return `
      <section class="seo-section" aria-labelledby="seo-jeonbuk-익산-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-jeonbuk-익산-manual-title" class="seo-title">익산은 일정 끝나도 손이 무거워진다</h2>
          <p>낮엔 괜찮았는데, 밤이 되자마자 팔이랑 어깨가 먼저 뭉친다. “그냥 피곤한가?” 했는데, 계속 같은 지점이 아프다.</p>
          <p>익산의 테마는 ${theme}. ${places}를 오가며 생활 패턴 ${pattern}이 쌓이면, ${fatigue}가 몸에 눌어붙는다. ${local}에서 자세가 고정되면 근육 이완 타이밍이 늦어진다.</p>
          <p>${keyword}는 “${local}에서 굳었어” 한 문장으로 충분해. 그 한 줄이 회복의 시작 버튼이 된다.</p>
        </div>
      </section>`;
  }

  if (district === '군산') {
    return `
      <section class="seo-section" aria-labelledby="seo-jeonbuk-군산-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-jeonbuk-군산-manual-title" class="seo-title">군산은 바람 뒤에 피로가 남는다</h2>
          <p>바다 쪽 바람은 시원했는데, 돌아오는 길엔 목이 뻣뻣해졌다. 쉬었는데도 컨디션이 내려앉는다.</p>
          <p>군산의 핵심 테마는 ${theme}. ${places}를 연결하는 생활 패턴 ${pattern}이 이어지고, ${fatigue}가 겹치는 날엔 피로가 빨리 풀리지 않는다. 특히 ${local}에서 긴장이 고정된다.</p>
          <p>그래서 ${keyword}는 방문 전 메모에 ${local}만 적어줘. 근육 이완 포인트가 그 지점부터 정확히 맞는다.</p>
        </div>
      </section>`;
  }

  if (district === '정읍') {
    return `
      <section class="seo-section" aria-labelledby="seo-jeonbuk-정읍-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-jeonbuk-정읍-manual-title" class="seo-title">정읍은 주말에 더 오래 남는 타입</h2>
          <p>휴식이었는데, 왜 몸이 더 묵직할까. 집에 돌아오자마자 피로가 조용히 자리 잡더라.</p>
          <p>정읍의 핵심은 ${theme}. ${places}를 돌고, 생활 패턴 ${pattern}이 겹치면 ${fatigue}가 누적된다. ${local}에서 움직임이 줄어드는 순간, 근육이 천천히 굳는다.</p>
          <p>${keyword}는 ${local}을 기준으로 “어디부터 풀리고 싶었는지”만 말해줘. 방문 마사지에서 그 순서대로 들어가면 회복이 빨라진다.</p>
        </div>
      </section>`;
  }

  if (district === '완주') {
    return `
      <section class="seo-section" aria-labelledby="seo-jeonbuk-완주-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-jeonbuk-완주-manual-title" class="seo-title">완주는 운전 시간이 길면 몸이 먼저 진다</h2>
          <p>온 길이 늘어진 날이 있다. 목적지는 금방 도착했는데, 몸은 계속 피로 모드로 남아있다.</p>
          <p>완주의 핵심 테마는 ${theme}. ${places} 사이에서 생활 패턴 ${pattern}이 반복되면 ${fatigue}가 같이 들어온다. 특히 ${local}에서 숨이 차는 느낌이 오면 근육 이완이 더 필요하다.</p>
          <p>${keyword}는 예약할 때 ${local} 한 줄만 남겨줘. 그 구간이 방문 마사지의 시작점이 된다.</p>
        </div>
      </section>`;
  }

  if (district === '김제') {
    return `
      <section class="seo-section" aria-labelledby="seo-jeonbuk-김제-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-jeonbuk-김제-manual-title" class="seo-title">김제는 걷고 나서야 피로가 따라온다</h2>
          <p>처음엔 괜찮아 보였는데, 집에 와서 샤워하고 나니 허리랑 다리가 느려졌다. 피로가 뒤늦게 온 날.</p>
          <p>김제의 테마는 ${theme}. ${places}를 오가며 생활 패턴 ${pattern}이 반복되고, ${fatigue}가 붙는 순간 컨디션이 천천히 떨어진다. ${local}에서 굳음이 시작되면 근육 이완이 늦어질 수 있어.</p>
          <p>그래서 ${keyword}는 ${local}이 언제부터였는지 한 문장으로만 말해줘. 방문 마사지가 그때의 리듬을 끊는다.</p>
        </div>
      </section>`;
  }

  if (district === '남원') {
    return `
      <section class="seo-section" aria-labelledby="seo-jeonbuk-남원-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-jeonbuk-남원-manual-title" class="seo-title">남원은 오래 앉은 뒤가 진짜 문제</h2>
          <p>밖에선 괜찮았는데, 집에 와서 앉는 순간이 제일 힘들다. 허리가 천천히 눌리는 느낌.</p>
          <p>남원의 핵심 테마는 ${theme}. ${places}를 오가는 생활 패턴 ${pattern}이 쌓이고 ${fatigue}가 겹치면 몸이 느리게 회복한다. ${local}에서 자세가 고정되면 근육 이완이 늦게 따라온다.</p>
          <p>${keyword}는 방문 전 ${local}만 콕 집어 말해줘. 그 지점부터 풀면 피로 회복이 빠르다.</p>
        </div>
      </section>`;
  }

  if (district === '고창') {
    return `
      <section class="seo-section" aria-labelledby="seo-jeonbuk-고창-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-jeonbuk-고창-manual-title" class="seo-title">고창은 숲길이 끝나면 어깨가 먼저 무거워진다</h2>
          <p>바람은 좋았는데, 되돌아오는 길에 갑자기 어깨가 당긴다. 걷는 게 끝나야 피로가 보이는 날.</p>
          <p>고창의 핵심 테마는 ${theme}. ${places}를 지나며 생활 패턴 ${pattern}이 이어지고, ${fatigue}가 겹치면 피로가 길게 남는다. 특히 ${local}에서 몸이 굳는 순간이 온다.</p>
          <p>${keyword}는 “${local}부터 무거웠어” 한 줄이면 충분해. 그 구간을 먼저 풀면 방문 마사지가 제대로 맞는다.</p>
        </div>
      </section>`;
  }

  if (district === '부안') {
    return `
      <section class="seo-section" aria-labelledby="seo-jeonbuk-부안-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-jeonbuk-부안-manual-title" class="seo-title">부안은 바람이 지나간 뒤에 목이 굳는다</h2>
          <p>바다 보고 돌아오면 괜찮을 줄 알았는데, 샤워하고 나서도 목이 계속 뻣뻣하다. 이상하게 끝이 없다.</p>
          <p>부안의 핵심 테마는 ${theme}. ${places} 사이 생활 패턴 ${pattern}이 반복되고 ${fatigue}가 겹치면 피로가 쉽게 풀리지 않는다. ${local}에서 긴장이 고정되면 근육 이완 타이밍이 뒤로 밀린다.</p>
          <p>${keyword}는 ${local}을 한 줄로만 말해줘. 방문 마사지에서 그 지점부터 근육 이완을 맞추면 회복이 빨라진다.</p>
        </div>
      </section>`;
  }

  if (district === '임실') {
    return `
      <section class="seo-section" aria-labelledby="seo-jeonbuk-임실-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-jeonbuk-임실-manual-title" class="seo-title">임실은 산길 운전 뒤에 피로가 따라온다</h2>
          <p>초반엔 괜찮았다. 그런데 곡선 많은 길을 돌아 나오는 순간, 허리가 먼저 무너졌다. 집에 와서도 풀림이 늦다.</p>
          <p>임실의 핵심 테마는 ${theme}. ${places}를 오가며 생활 패턴 ${pattern}이 이어지고 ${fatigue}가 겹치면 산길 피로가 근육에 남는다. 특히 ${local}에서 자세가 고정된다.</p>
          <p>${keyword}는 “${local}에서 가장 오래 버텼어”라고 말해줘. 그 순서로 방문 마사지가 들어가면 회복이 빨라진다.</p>
        </div>
      </section>`;
  }

  if (district === '순창') {
    return `
      <section class="seo-section" aria-labelledby="seo-jeonbuk-순창-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-jeonbuk-순창-manual-title" class="seo-title">순창은 조용한데 몸이 먼저 피곤해진다</h2>
          <p>사람은 많지 않았는데, 이상하게 몸은 더 빨리 꺼졌다. 아무 일 없던 날인데 피로만 남는다.</p>
          <p>순창의 핵심 테마는 ${theme}. ${places}를 돌며 생활 패턴 ${pattern}이 반복되고 ${fatigue}가 겹치면 회복이 늦게 온다. ${local}에서 굳음이 고정되면 근육 이완이 더 필요해진다.</p>
          <p>${keyword}는 ${local}을 한 번만 말해줘. 방문 마사지가 그 지점을 끊어주면, 다음 이동이 훨씬 가벼워진다.</p>
        </div>
      </section>`;
  }

  if (district === '진안') {
    return `
      <section class="seo-section" aria-labelledby="seo-jeonbuk-진안-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-jeonbuk-진안-manual-title" class="seo-title">진안은 바람이 강한 날, 허리가 먼저 묵직해진다</h2>
          <p>밖은 생각보다 금방 지나갔는데, 돌아오는 길에 허리가 무거워졌다. 집에 와서도 자세가 풀리지 않는다.</p>
          <p>진안의 핵심 테마는 ${theme}. ${places}를 오가며 생활 패턴 ${pattern}이 이어지고, ${fatigue}가 겹치면 통증이 늦게 올라오는 편이다. 특히 ${local}에서 몸이 굳는다.</p>
          <p>${keyword}는 “${local}이 시작이었어” 한 줄이면 충분해. 방문 마사지에서 그 흐름을 끊어주면 근육 이완이 빨라진다.</p>
        </div>
      </section>`;
  }

  if (district === '장수') {
    return `
      <section class="seo-section" aria-labelledby="seo-jeonbuk-장수-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-jeonbuk-장수-manual-title" class="seo-title">장수는 농번기 피로가 근육에 남는다</h2>
          <p>오늘은 힘들어 보이지 않았는데, 집에 와서 옷 갈아입는 순간 몸이 뻐근하더라. 그게 농번기 타입.</p>
          <p>장수의 핵심 테마는 ${theme}. ${places}를 지나며 생활 패턴 ${pattern}이 반복되고 ${fatigue}가 붙으면 육체 피로가 쉽게 안 풀린다. ${local}에서 긴장이 고정되는 날이 많다.</p>
          <p>${keyword}는 ${local}을 기준으로 “언제부터 뭉쳤는지”만 말해줘. 방문 마사지에서 그 구간을 먼저 풀면 회복이 빨라진다.</p>
        </div>
      </section>`;
  }

  // 무주 (default)
  return `
    <section class="seo-section" aria-labelledby="seo-jeonbuk-무주-manual-title">
      <div class="container seo-inner">
        <h2 id="seo-jeonbuk-무주-manual-title" class="seo-title">무주는 눈길/비탈이 끝나도 피로가 잔뜩 남는다</h2>
        <p>내려가는 길이 끝난 줄 알았는데, 집에 오니 몸이 더 느려졌다. 무거운 건 풀렸으면 좋겠는데 아직 남아있어.</p>
        <p>무주의 핵심 테마는 ${theme}. ${places}를 오가며 생활 패턴 ${pattern}이 이어지고, ${fatigue}가 겹치면 피로가 길게 간다. 특히 ${local}에서 자세가 굳는 순간이 생긴다.</p>
        <p>${keyword}는 예약 메시지에 ${local} 한 줄만 남겨줘. 방문 마사지의 근육 이완이 그 지점부터 들어가면 회복이 빨라진다.</p>
      </div>
    </section>`;
}

function main() {
  const md = fs.readFileSync(PROFILE_PATH, 'utf8');
  const profiles = parseProfiles(md);

  const region = '전북';
  const rp = profiles.get(region);
  if (!rp) throw new Error('전북 프로필 없음');

  // 지역(보조)
  {
    const regionHtml = fs.readFileSync(REGION_PATH, 'utf8');
    fs.writeFileSync(REGION_PATH, upsertSeoSection(regionHtml, regionSeo(rp)), 'utf8');
  }

  const districts = ['전주', '익산', '군산', '정읍', '완주', '김제', '남원', '고창', '부안', '임실', '순창', '진안', '장수', '무주'];
  for (const district of districts) {
    const key = `${region}.${district}`;
    const p = profiles.get(key);
    if (!p) throw new Error(`프로필 없음: ${key}`);
    const filePath = path.join(DISTRICTS_DIR, `전북-${district}출장마사지.html`);
    if (!fs.existsSync(filePath)) throw new Error(`파일 없음: ${filePath}`);
    const html = fs.readFileSync(filePath, 'utf8');
    fs.writeFileSync(filePath, upsertSeoSection(html, districtSeo(district, p)), 'utf8');
  }

  console.log('[done] 전북 지역+구 seo-section 수작업(표 제거, 1000자 이하 목표) 재작성 완료');
}

if (require.main === module) main();

