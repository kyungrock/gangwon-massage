const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PROFILE_PATH = path.join(ROOT, 'korea-regions-seo-profiles.md');
const REGION_PATH = path.join(ROOT, 'regions', '충남출장마사지.html');
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
  // “ ” 제거(문장에 다시 붙이기 용이)
  return String(local || '').replace(/[“”]/g, '');
}

function buildRegionSeo(p) {
  const theme = escapeHtml(p.theme);
  const places = escapeHtml(p.places);
  const pattern = escapeHtml(p.pattern);
  const fatigue = escapeHtml(p.fatigue);
  const local = escapeHtml(cleanLocal(p.local));

  return `
    <section class="seo-section" aria-labelledby="seo-chungnam-region-manual-title">
      <div class="container seo-inner">
        <h2 id="seo-chungnam-region-manual-title" class="seo-title">충남 하루 끝나고 몸이 더 무거워지는 이유</h2>
        <p>아, 오늘은 괜찮은 날인 줄 알았는데… 집에 들어오자마자 어깨가 쿵 하고 눌린다.</p>
        <p>충남의 핵심 테마는 ${theme}야. ${places} 사이를 오가며 생활 패턴 ${pattern}이 반복되면 ${fatigue}가 뒤늦게 붙는다.</p>
        <p>특히 ${local}에서 긴장이 풀리기보다 고정되면, 방문 마사지로 근육 이완을 시작할 타이밍이 더 빨라져야 한다. 그래서 충남 출장마사지에서는 “어디가 제일 굳었는지”를 ${local} 한 줄로 먼저 말해줘.</p>
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

  // 아래 템플릿들은 구마다 도입/전개/마감 흐름을 다르게 구성
  if (district === '천안') {
    return `
      <section class="seo-section" aria-labelledby="seo-chungnam-천안-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-chungnam-천안-manual-title" class="seo-title">천안은 이동이 끝나도 피로가 남는다</h2>
          <p>카페 한 번 들렀다 나왔는데도, 이상하게 몸이 더 천천히 움직인다. 웃고 들어왔는데 왜 이래?</p>
          <p>천안의 핵심 테마는 ${theme}야. ${places}를 오가며 생활 패턴 ${pattern}이 반복되면, ${fatigue}가 결국 근육 사이로 스며든다. ${local} 같은 로컬 지점에서 자세가 고정되는 순간부터 피로가 길게 남아.</p>
          <p>그래서 ${keyword}는 “오늘 ${local}에서 멈춘 느낌이 제일 컸다”라고만 적어줘. 그 한 줄이 방문 마사지의 근육 이완 순서를 바로 정해준다.</p>
        </div>
      </section>`;
  }

  if (district === '공주') {
    return `
      <section class="seo-section" aria-labelledby="seo-chungnam-공주-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-chungnam-공주-manual-title" class="seo-title">공주는 산책이 끝나도 발이 먼저 피곤하다</h2>
          <p>바람은 좋았는데, 집에 와서 신발 벗는 순간 발이 먼저 말한다. “오늘 좀 걸었지?” 하고.</p>
          <p>공주의 핵심 테마는 ${theme}야. ${places}를 돌고 돌아가는 생활 패턴 ${pattern}이 쌓이면, ${fatigue}가 몸 안쪽까지 천천히 퍼진다. 특히 ${local}에서 걸음이 굳는 날은 다음날까지 남기 쉬워.</p>
          <p>${keyword}를 받을 땐 ${local}의 “멈춘 지점”만 한 줄로 말해줘. 방문 마사지로 그 구간부터 풀리기 시작하면, 회복이 확 빨라진다.</p>
        </div>
      </section>`;
  }

  if (district === '보령') {
    return `
      <section class="seo-section" aria-labelledby="seo-chungnam-보령-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-chungnam-보령-manual-title" class="seo-title">보령은 바람 뒤에 어깨가 먼저 굳는다</h2>
          <p>바다 쪽은 시원했는데, 돌아오는 길엔 목이 뻣뻣해진다. 바람이 지나간 자리에 긴장이 남아버린 느낌.</p>
          <p>보령의 핵심 테마는 ${theme}야. ${places}를 오가며 생활 패턴 ${pattern}이 반복되고, ${fatigue}가 겹치면 몸이 쉬는 타이밍을 놓친다. 특히 ${local}에서 숨이 짧아지면 근육 이완이 늦게 들어가.</p>
          <p>그래서 ${keyword}는 “${local} 쪽이 제일 뻐근했다” 한 문장으로 끝내줘. 방문 마사지에서 그 지점부터 맞춰주면 피로 회복이 자연스럽게 따라온다.</p>
        </div>
      </section>`;
  }

  if (district === '아산') {
    return `
      <section class="seo-section" aria-labelledby="seo-chungnam-아산-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-chungnam-아산-manual-title" class="seo-title">아산은 온종일 차 안에 있는 날이 문제</h2>
          <p>일 끝나고 나서야 내 몸이 느려졌다는 걸 알아챘다. “이거, 오래 앉아있어서 그래” 생각했는데 그게 다가 아니더라.</p>
          <p>아산의 핵심 테마는 ${theme}야. ${places} 사이에서 생활 패턴 ${pattern}이 계속 이어지면, ${fatigue}가 고개 쪽까지 누적된다. ${local}처럼 움직임이 딱 고정되는 지점에서 긴장이 더 단단해져.</p>
          <p>${keyword}는 방문 마사지 예약할 때 ${local} 한 줄만 남겨. 그 구간부터 근육 이완이 들어가야, 다음날 아침까지 덜 무겁다.</p>
        </div>
      </section>`;
  }

  if (district === '서산') {
    return `
      <section class="seo-section" aria-labelledby="seo-chungnam-서산-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-chungnam-서산-manual-title" class="seo-title">서산은 퇴근하고도 정체가 끝나지 않는다</h2>
          <p>길이 막힌 건 알았는데, 생각보다 몸이 더 느려졌다. 집 근처인데도 계속 차가 붙어 있었어.</p>
          <p>서산의 핵심 테마는 ${theme}야. ${places}를 오가며 생활 패턴 ${pattern}이 반복되고, ${fatigue}가 겹치면 피로가 늦게 풀린다. 특히 ${local}에서 멈춘 시간이 길어질수록 긴장이 더 남는다.</p>
          <p>그래서 ${keyword}는 ${local}을 기준으로 “정체 시작된 지점”만 말해줘. 방문 마사지에서 그 타이밍을 끊어주면 회복이 빨라진다.</p>
        </div>
      </section>`;
  }

  if (district === '논산') {
    return `
      <section class="seo-section" aria-labelledby="seo-chungnam-논산-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-chungnam-논산-manual-title" class="seo-title">논산은 밤이 되면 몸이 조용히 꺼진다</h2>
          <p>낮엔 괜찮았는데 저녁에 갑자기 힘이 빠진다. 아무 것도 안 했는데 왜 이럴까.</p>
          <p>논산의 핵심 테마는 ${theme}야. ${places}에서 생활 패턴 ${pattern}이 반복되면, ${fatigue}가 누적돼서 밤에 더 진하게 온다. ${local}에서 피로가 딱 고정되면 근육 이완 타이밍이 중요해져.</p>
          <p>${keyword}를 찾을 땐 ${local}의 “마지막 이동 구간”을 한 줄로 말해줘. 방문 마사지가 그 흐름을 끊으면 회복이 빨리 이어진다.</p>
        </div>
      </section>`;
  }

  if (district === '계룡') {
    return `
      <section class="seo-section" aria-labelledby="seo-chungnam-계룡-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-chungnam-계룡-manual-title" class="seo-title">계룡은 숨은 가벼운데 근육이 무거워진다</h2>
          <p>걷는 길은 괜찮았는데, 돌아오면 어깨가 자꾸 내려앉는다. 몸이 “쉬어”라고 말하는 방식이 조용하다.</p>
          <p>계룡의 핵심 테마는 ${theme}야. ${places}를 오가며 생활 패턴 ${pattern}이 이어지고, ${fatigue}가 겹치면 근육이 천천히 굳는다. 특히 ${local}에서 자세가 오래 고정되면 피로가 늦게 풀려.</p>
          <p>${keyword}는 예약할 때 ${local}을 정확히 한 줄로 말해줘. 방문 마사지에서 그 구간부터 근육 이완을 잡아주면, 다음날이 확 가벼워진다.</p>
        </div>
      </section>`;
  }

  if (district === '당진') {
    return `
      <section class="seo-section" aria-labelledby="seo-chungnam-당진-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-chungnam-당진-manual-title" class="seo-title">당진은 이동이 많을수록 어깨가 먼저 무너진다</h2>
          <p>일정이 짧은 줄 알았는데, 생각보다 계속 움직였다. 주차하고 내리는 순간마다 어깨가 먼저 무거워져.</p>
          <p>당진의 핵심 테마는 ${theme}야. ${places} 사이를 오가며 생활 패턴 ${pattern}이 반복되고, ${fatigue}가 붙으면 피로가 빠르게 쌓인다. ${local}에서 속도가 줄면 긴장도 더 오래 간다.</p>
          <p>그래서 ${keyword}는 “${local}에서 속도 줄었다”라고만 말해줘. 방문 마사지에서는 그 흐름을 끊는 방식으로 근육 이완을 맞추면 된다.</p>
        </div>
      </section>`;
  }

  if (district === '금산') {
    return `
      <section class="seo-section" aria-labelledby="seo-chungnam-금산-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-chungnam-금산-manual-title" class="seo-title">금산은 산길 뒤에 몸이 조용히 아파온다</h2>
          <p>운전은 괜찮았는데, 돌아오고 나서 허리가 뻐근하다. 이건 단순 피로가 아닌 것 같은 느낌.</p>
          <p>금산의 핵심 테마는 ${theme}야. ${places}를 오가며 생활 패턴 ${pattern}이 이어지고, ${fatigue}가 겹치면 산길/이동 피로가 길게 남는다. 특히 ${local}에서 몸이 굳는 순간이 반복되면 근육 이완이 늦어진다.</p>
          <p>${keyword}는 ${local}을 기준으로 “언제부터 굳었는지” 한 줄만 말해줘. 그 순서대로 풀리면 피로 회복이 빨라져.</p>
        </div>
      </section>`;
  }

  if (district === '부여') {
    return `
      <section class="seo-section" aria-labelledby="seo-chungnam-부여-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-chungnam-부여-manual-title" class="seo-title">부여는 야외 일정 끝나고도 마음이 못 쉬어</h2>
          <p>하루가 끝나서 쉬려고 했는데, 몸이 계속 깨어 있는 느낌이었다. 이상하더라, 왜 이렇게 오래 가나?</p>
          <p>부여의 핵심 테마는 ${theme}야. ${places}를 돌며 생활 패턴 ${pattern}이 반복되고, ${fatigue}가 닿는 날엔 피로가 오래 남는다. ${local}에서 긴장이 고정되면 집에서도 풀리기 어렵다.</p>
          <p>${keyword}를 받을 때는 ${local} 한 줄로만 정리해줘. 방문 마사지에서 근육 이완을 그 지점부터 시작하면, 회복이 확 붙는다.</p>
        </div>
      </section>`;
  }

  if (district === '서천') {
    return `
      <section class="seo-section" aria-labelledby="seo-chungnam-서천-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-chungnam-서천-manual-title" class="seo-title">서천은 바닷바람이 지나가도 어깨가 남는다</h2>
          <p>나가서 잠깐만 걷고 돌아왔는데도, 어깨가 자꾸 올라간다. 바람이 살짝만 스쳐도 피로가 체감으로 변하더라.</p>
          <p>서천의 핵심 테마는 ${theme}야. ${places}를 오가며 생활 패턴 ${pattern}이 이어지고, ${fatigue}가 겹치면 몸이 쉬는 타이밍을 놓친다. 특히 ${local}에서 모양이 굳어버리면, 근육 이완을 더 빠르게 시작해야 한다.</p>
          <p>${keyword}는 ${local}에서 굳는 느낌을 그대로 말해줘. 방문 마사지에서 그 지점부터 풀어주면 피로 회복이 빨라진다.</p>
        </div>
      </section>`;
  }

  if (district === '청양') {
    return `
      <section class="seo-section" aria-labelledby="seo-chungnam-청양-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-chungnam-청양-manual-title" class="seo-title">청양은 조용한 하루가 더 피곤하다</h2>
          <p>별일 없던 날인데도, 집에 오니 몸이 무겁다. 움직임이 적어서 괜찮을 줄 알았는데, 피로가 더 깊게 들어왔어.</p>
          <p>청양의 핵심 테마는 ${theme}야. ${places}를 오가며 생활 패턴 ${pattern}이 쌓이고, ${fatigue}가 겹치면 피로가 천천히 누적된다. ${local}에서 긴장이 고정되면 근육 이완도 늦어진다.</p>
          <p>${keyword}는 ${local}을 기준으로 “오늘의 뭉친 포인트”만 한 번 더 말해줘. 그 흐름대로 방문 마사지가 맞춰진다.</p>
        </div>
      </section>`;
  }

  if (district === '홍성') {
    return `
      <section class="seo-section" aria-labelledby="seo-chungnam-홍성-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-chungnam-홍성-manual-title" class="seo-title">홍성은 모양이 안 풀리는 날이 있다</h2>
          <p>운전하고 돌아오면 풀릴 줄 알았는데, 목이랑 허리가 계속 같은 자리에서 버틴다. 이상하게 ‘모양’이 남아.</p>
          <p>홍성의 핵심 테마는 ${theme}야. ${places}에서 생활 패턴 ${pattern}이 반복되고, ${fatigue}가 겹치는 순간부터 피로가 느리게 풀린다. ${local}에서 멈춘 시간이 길수록 근육 이완이 더 필요해져.</p>
          <p>${keyword}는 ${local}을 한 줄로만 적어줘. 방문 마사지에서 그 구간을 먼저 풀어주면 회복이 자연스럽게 따라온다.</p>
        </div>
      </section>`;
  }

  if (district === '예산') {
    return `
      <section class="seo-section" aria-labelledby="seo-chungnam-예산-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-chungnam-예산-manual-title" class="seo-title">예산은 장보기 이후에 피로가 늦게 온다</h2>
          <p>낮엔 괜찮았는데, 장바구니 들고 돌아오자마자 몸이 굳는다. 왜 이렇게 늦게 티가 날까.</p>
          <p>예산의 핵심 테마는 ${theme}야. ${places} 사이를 오가며 생활 패턴 ${pattern}이 반복되고, ${fatigue}가 닿는 날엔 몸이 쉬는 타이밍을 놓친다. 특히 ${local}에서 피로가 고정되면 더 느리게 풀려.</p>
          <p>${keyword}를 받을 때는 “${local}에서 굳었어” 한 줄로만 말해줘. 방문 마사지에서 근육 이완을 그 구간부터 넣으면 회복이 빨라진다.</p>
        </div>
      </section>`;
  }

  // 태안
  return `
    <section class="seo-section" aria-labelledby="seo-chungnam-태안-manual-title">
      <div class="container seo-inner">
        <h2 id="seo-chungnam-태안-manual-title" class="seo-title">태안은 바다 끝나고도 피로가 이어진다</h2>
        <p>바다 보면서 잠깐 마음은 편했는데, 돌아오는 길에 몸이 먼저 무거워졌다. 쉬었는데도 계속 피곤한 느낌.</p>
        <p>태안의 핵심 테마는 ${theme}야. ${places}를 오가며 생활 패턴 ${pattern}이 이어지고, ${fatigue}가 겹치는 날엔 피로가 늦게 회복된다. 특히 ${local}에서 긴장이 고정되면 근육 이완이 더 필요하다.</p>
        <p>${keyword}는 ${local}을 기준으로 “그 구간이 제일 힘들었다”만 말해줘. 방문 마사지에서 그 지점부터 풀어주면 피로 회복이 빨라진다.</p>
      </div>
    </section>`;
}

function main() {
  const md = fs.readFileSync(PROFILE_PATH, 'utf8');
  const profiles = parseProfiles(md);

  const region = '충남';
  const rp = profiles.get(region);
  if (!rp) throw new Error('충남 프로필 없음');

  // 지역(보조)
  {
    const regionHtml = fs.readFileSync(REGION_PATH, 'utf8');
    fs.writeFileSync(REGION_PATH, upsertSeoSection(regionHtml, buildRegionSeo(rp)), 'utf8');
  }

  const districts = ['천안', '공주', '보령', '아산', '서산', '논산', '계룡', '당진', '금산', '부여', '서천', '청양', '홍성', '예산', '태안'];
  for (const district of districts) {
    const key = `충남.${district}`;
    const p = profiles.get(key);
    if (!p) throw new Error(`${key} 프로필 없음`);
    const filePath = path.join(DISTRICTS_DIR, `충남-${district}출장마사지.html`);
    if (!fs.existsSync(filePath)) throw new Error(`파일 없음: ${filePath}`);
    const html = fs.readFileSync(filePath, 'utf8');
    fs.writeFileSync(filePath, upsertSeoSection(html, buildDistrictSeo(region, district, p)), 'utf8');
  }

  console.log('[done] 충남 지역+구 seo-section 수작업(표 제거, 1000자 이하) 재작성 완료');
}

if (require.main === module) main();

