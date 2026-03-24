const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PROFILE_PATH = path.join(ROOT, 'korea-regions-seo-profiles.md');
const REGION_PATH = path.join(ROOT, 'regions', '전남출장마사지.html');
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
  // existing seo-section 통째 교체
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
    <section class="seo-section" aria-labelledby="seo-jeonnam-region-manual-title">
      <div class="container seo-inner">
        <h2 id="seo-jeonnam-region-manual-title" class="seo-title">전남은 끝나고 나서 더 뻐근해지는 구간이 있다</h2>
        <p>오늘은 괜찮았다고 생각했는데, 집에 돌아오니 몸이 느려진다. 쉬는 시간이 길어도 피로는 먼저 굳어버리는 날.</p>
        <p>전남의 핵심 테마는 ${theme}야. ${places}를 오가며 생활 패턴 ${pattern}이 반복되면 ${fatigue}가 뒤늦게 붙고, 특히 ${local}에서 긴장이 고정된다. 그래서 방문 마사지도 ${local} 기준으로 근육 이완 타이밍을 잡는 게 빠르다.</p>
      </div>
    </section>`;
}

const DISTRICT_INTROS = {
  여수: '바다 보면서 웃었는데, 집에 오니 어깨가 먼저 잠겼다. “아직 안 끝났네” 싶은 하루.',
  순천: '걸음은 가볍게 시작했는데, 끝나고 나니 허리가 먼저 말을 한다. 쉬는데도 자꾸 뭉치는 느낌.',
  목포: '퇴근하고 조금 쉬려 했는데도, 집에 오니 목과 어깨가 같은 자리에서 계속 굳는다. 왜 이래?',
  광양: '낮엔 괜찮았는데 저녁부터 몸이 갑자기 늦게 반응한다. 집에 앉아 있으면 더 무거워져.',
  나주: '카페 한 잔 했는데도 컨디션이 바로 안 올라온다. ${local}에서 긴장이 고정된 날 같아.',
  무안: '이동이 길지 않았다고 생각했는데, 결국 체감 피로는 ${local} 근처에서 먼저 왔다. 그게 문제였어.',
  해남: '바깥 바람은 시원했는데, 돌아오는 길에 몸이 더 느려졌다. 쉬어도 잔피로가 남는 날.',
  고흥: '전날 피곤이 남아 있던 걸 몰랐어. 일정 끝나고 ${local}이 스치자마자 다시 무거워지더라.',
  화순: '오늘은 대충이면 되겠지 싶었는데, 집에 오니 자세가 안 풀린다. 움직임이 적어도 뭉쳐.',
  영암: '바쁜 동선이 끝나고 나서도 마음은 가벼운데 몸은 그대로다. ${local}이 길게 남는다.',
  영광: '바다 보고 돌아왔는데 목이 뻣뻣해졌다. 끝이 시원해야 하는데, 오히려 피로가 고정됐어.',
  완도: '계속 걷다가 집에 왔는데도 다리가 먼저 못 쉬네. 샤워해도 잔피로가 이어진다.',
  담양: '잠깐 산책만 했는데 허리가 조용히 굳는다. 구간이 길었나 싶을 정도로 오래 간다.',
  장성: '처음엔 괜찮았는데 돌아오는 길에 어깨가 무거워졌다. 주차하고 내릴 때부터.',
  보성: '바깥 일정은 가벼웠는데, 집에 오면 몸이 느려진다. 뭘 했는지보다 어디를 지나왔는지가 남는 날.',
  신안: '섬 바람은 시원했는데, 끝나고 나니 근육이 먼저 지친다. ${local}에서 숨이 먼저 차.',
  장흥: '낮엔 괜찮다 싶었는데, 밤이 되면 몸이 더 눌린다. 쉬어도 피로가 천천히 따라와.',
  강진: '걸음이 줄어든 순간 어깨가 확 눌렸다. ${local}이 시작이었어.',
  함평: '생각보다 괜찮았는데, 집에 오니 목이 뻣뻣하다. ${local}에서 굳는 느낌이 남아.',
  진도: '바다 쪽 동선 끝내고 나니 허리가 먼저 느려졌다. 그 다음엔 어깨까지 같이 따라온다.',
  곡성: '조용히 움직였는데도 피로가 묵직하게 남는다. ${local}에서 자세가 고정된 느낌.',
  구례: '오늘은 가볍게 다녀왔다고 생각했는데, 마지막에 몸이 푹 꺼졌다. ${local}에서 굳는 감각이 뚜렷했어.',
};

const DISTRICT_CLOSE = {
  여수: '여수는 바다 동선이 끝나도 긴장이 오래 간다. 그래서 방문 마사지 예약 메모는 ${local} 한 줄이면 충분해.',
  순천: '순천은 이동이 끝난 뒤에야 피로가 더 올라온다. ${local}을 기준으로 근육 이완 타이밍을 맞추자.',
  목포: '목포는 바람이 지나가도 굳음이 남는다. ${local}에서 더 무거웠다고 한 문장만 말해줘.',
  광양: '광양은 생활 패턴이 계속 이어지면 근육이 먼저 지친다. ${local} 기준으로 정리하면 회복이 빨라진다.',
  나주: '나주는 ${local}에서 긴장이 고정되기 쉽다. 그 구간부터 풀면 방문 마사지 만족도가 올라간다.',
  무안: '무안은 ${local}이 피로 시작점이 된다. 시작 구간만 말해줘도 근육 이완 방향이 정확해진다.',
  해남: '해남은 끝나고 나서 잔피로가 남는다. ${local}을 기준으로 어디서 굳었는지만 말해줘.',
  고흥: '고흥은 일정이 끝나도 몸이 천천히 꺼진다. ${local}에서 다시 무거워졌다고 한 줄만 남겨.',
  화순: '화순은 조용한 하루가 오히려 피로를 깊게 만든다. ${local}이 어디였는지만 기억해줘.',
  영암: '영암은 동선이 바뀌면 피로가 따라온다. ${local} 한 줄이 방문 마사지 순서가 된다.',
  영광: '영광은 피로가 먼저 고정되는 날이 있다. ${local}을 메모로 딱 적으면 근육 이완이 빨라진다.',
  완도: '완도는 샤워해도 다리 무거움이 남는다. ${local}에서 시작됐다고 말해주면 회복이 편해져.',
  담양: '담양은 산책 다음에 허리가 먼저 굳는다. ${local}을 기준으로 근육 이완을 맞추자.',
  장성: '장성은 주차/멈춤이 길어지면 피로가 누적된다. ${local}에서 멈춘 순간을 말해줘.',
  보성: '보성은 이동의 결이 그대로 남는다. ${local}에서 굳은 감각만 풀어도 충분하다.',
  신안: '신안은 바람이 끝나도 잔긴장이 남는다. ${local} 한 줄로 방문 마사지 타이밍을 잡자.',
  장흥: '장흥은 밤에 피로가 더 진해진다. ${local}이 언제부터였는지만 말하면 된다.',
  강진: '강진은 어깨가 먼저 눌리는 날이 있다. ${local}을 기준으로 정리하면 근육 이완이 잘 들어간다.',
  함평: '함평은 목이 먼저 뻣뻣해진다. ${local}에서 굳었다고 한 문장만 남겨줘.',
  진도: '진도는 허리와 어깨가 같이 따라온다. ${local}에서 멈춘 구간을 말해주면 회복이 빠르다.',
  곡성: '곡성은 조용하게 움직였는데도 피로가 묵직하다. ${local}을 중심으로 풀면 좋아.',
  구례: '구례는 마지막에 몸이 꺼지는 타입이다. ${local} 한 줄이 방문 마사지의 출발점이 된다.',
};

function districtSeo(district, p) {
  const theme = escapeHtml(p.theme);
  const places = escapeHtml(p.places);
  const pattern = escapeHtml(p.pattern);
  const fatigue = escapeHtml(p.fatigue);
  const local = escapeHtml(cleanLocal(p.local));

  const keyword = `전남 ${district} 출장마사지`;

  // 인트로/클로즈는 district별로 개별 문장 사용(문장 구조 반복 최소화)
  let intro = DISTRICT_INTROS[district] || '아, 오늘 진짜 힘들다. 집에 오니 몸이 먼저 굳어버렸다.';
  intro = intro.replace('${local}', local);

  let close = DISTRICT_CLOSE[district] || '${keyword}는 ${local} 기준으로 시작 구간만 말해줘도 회복이 빨라진다.';
  close = close.replace('${local}', local).replace('${keyword}', keyword);

  // 본문은 2종류 정도로만 구분하되, 각 district마다 로컬 동선을 다른 순서로 배치
  const midA = `${keyword}의 분위기는 ${theme} 쪽이야. ${places}를 오가며 생활 패턴 ${pattern}이 반복되면, ${fatigue}가 뒤늦게 붙는다. 특히 ${local}에서 긴장이 고정되면 근육 이완이 필요한 구간이 더 빨리 잡힌다.`;
  const midB = `${local}에서 굳는 느낌이 먼저 온다. 그 다음이 ${theme}야. ${places} 사이를 잇는 생활 패턴 ${pattern}이 돌아가고 ${fatigue}가 겹치면 피로가 오래 가. 그래서 ${keyword}는 예약 메모를 ${local}에 맞추는 게 정확해.`;

  // district별 분기를 고정값으로 줘서 “전체 템플릿 반복”을 줄임
  const code = district.charCodeAt(0) + district.length;
  const mid = code % 2 === 0 ? midA : midB;

  return `
    <section class="seo-section" aria-labelledby="seo-jeonnam-${district}-manual-title">
      <div class="container seo-inner">
        <h2 id="seo-jeonnam-${district}-manual-title" class="seo-title">${district} 동선 피로, 오늘 기준 빠르게 정리</h2>
        <p>${escapeHtml(intro)}</p>
        <p>${mid}</p>
        <p>${escapeHtml(close)}</p>
      </div>
    </section>`;
}

function main() {
  const md = fs.readFileSync(PROFILE_PATH, 'utf8');
  const profiles = parseProfiles(md);

  const region = '전남';
  const rp = profiles.get(region);
  if (!rp) throw new Error('전남 프로필 없음');

  // 지역(보조) 페이지
  {
    const regionHtml = fs.readFileSync(REGION_PATH, 'utf8');
    fs.writeFileSync(REGION_PATH, upsertSeoSection(regionHtml, regionSeo(rp)), 'utf8');
  }

  const districts = [
    '여수', '순천', '목포', '광양', '나주', '무안', '해남', '고흥', '화순', '영암', '영광', '완도',
    '담양', '장성', '보성', '신안', '장흥', '강진', '함평', '진도', '곡성', '구례',
  ];

  for (const district of districts) {
    const key = `전남.${district}`;
    const p = profiles.get(key);
    if (!p) throw new Error(`프로필 없음: ${key}`);
    const filePath = path.join(DISTRICTS_DIR, `전남-${district}출장마사지.html`);
    if (!fs.existsSync(filePath)) throw new Error(`파일 없음: ${filePath}`);
    const html = fs.readFileSync(filePath, 'utf8');
    const sectionHtml = districtSeo(district, p);
    fs.writeFileSync(filePath, upsertSeoSection(html, sectionHtml), 'utf8');
  }

  console.log('[done] 전남 지역+구 seo-section 수작업 문장 재작성 완료(표 제거)');
}

if (require.main === module) main();

