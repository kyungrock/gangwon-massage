const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PROFILE_PATH = path.join(ROOT, 'korea-regions-seo-profiles.md');
const REGION_PATH = path.join(ROOT, 'regions', '경남출장마사지.html');
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
      // e.g. "## 경남.창원"
      if (line.startsWith('## ')) {
        flush();
        key = h[1].trim();
        cur = { theme: '', places: '', pattern: '', fatigue: '', local: '' };
        continue;
      }
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
    <section class="seo-section" aria-labelledby="seo-gyeongnam-region-manual-title">
      <div class="container seo-inner">
        <h2 id="seo-gyeongnam-region-manual-title" class="seo-title">경남은 하루 끝나고 나면 피로가 더 붙는다</h2>
        <p>오늘은 괜찮은 척 했는데, 집에 와서 손을 놓는 순간부터 몸이 느려진다. 웃다가도 어깨가 먼저 눌렸다.</p>
        <p>경남의 핵심 테마는 ${theme}야. ${places} 사이를 오가며 생활 패턴 ${pattern}이 반복되고, ${fatigue}가 겹치면 피로 회복이 늦게 온다. 특히 ${local}처럼 기억되는 구간이 있으면, 방문 마사지 받기 전에 이미 굳어버린다.</p>
        <p>그래서 경남 출장마사지에서는 “오늘 어디가 제일 무거웠는지”를 ${local} 기준으로 짧게 말해줘. 그 한 줄이 근육 이완의 시작점이 된다.</p>
      </div>
    </section>`;
}

function districtSeo(region, district, p) {
  const theme = escapeHtml(p.theme);
  const places = escapeHtml(p.places);
  const pattern = escapeHtml(p.pattern);
  const fatigue = escapeHtml(p.fatigue);
  const local = escapeHtml(cleanLocal(p.local));
  const keyword = `${region} ${district} 출장마사지`;

  if (district === '창원') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongnam-창원-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongnam-창원-manual-title" class="seo-title">창원은 회식 끝나고도 몸이 먼저 못 쉬어</h2>
          <p>오늘은 일찍 끝날 줄 알았는데, 다시 일정이 붙었다. 집으로 돌아오는 길에서 어깨가 먼저 내려앉더라.</p>
          <p>창원의 핵심 테마는 ${theme}. ${places}를 오가며 생활 패턴 ${pattern}이 이어지고, ${fatigue}가 겹치면 회복이 늦어진다. 특히 ${local}에서 숨이 턱 막히는 날이면, 근육 이완이 더 필요해진다.</p>
          <p>${keyword}는 예약할 때 “${local}에서 가장 무거웠다” 한 문장만 남겨. 그 구간부터 방문 마사지의 근육 이완 순서가 맞춰진다.</p>
        </div>
      </section>`;
  }

  if (district === '김해') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongnam-김해-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongnam-김해-manual-title" class="seo-title">김해는 공항·도로 흐름이 피로를 고정시킨다</h2>
          <p>생각보다 멀지 않게 다녔는데도, 돌아오는 길에 몸이 더 굳었다. 손목만 움직여도 뻐근한 느낌.</p>
          <p>김해의 핵심 테마는 ${theme}. ${places} 사이를 반복해서 밟는 생활 패턴 ${pattern}이 쌓이면, ${fatigue}가 나중에 한 번 더 온다. ${local}처럼 동선이 꺾이는 구간이 있으면 긴장이 그 자리에서 멈춘다.</p>
          <p>${keyword}는 방문 마사지 시작 전에 ${local}을 한 줄로만 말해줘. 근육 이완 타이밍이 그 순간에 딱 맞춰진다.</p>
        </div>
      </section>`;
  }

  if (district === '진주') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongnam-진주-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongnam-진주-manual-title" class="seo-title">진주는 한 번 멈추면 피로가 깊어져</h2>
          <p>잠깐 앉는다고 했는데, 그게 길어졌다. 일상 리듬이 끊긴 순간부터 몸이 더 느려진다.</p>
          <p>진주의 핵심 테마는 ${theme}. ${places}를 오가며 생활 패턴 ${pattern}이 이어지고, ${fatigue}가 붙는 날엔 앉아도 회복이 바로 안 된다. 특히 ${local}에서 동선이 멈추면 근육이 굳는 속도가 빨라진다.</p>
          <p>${keyword}는 “${local}에서 멈춘 시간”을 말해줘. 방문 마사지에서 그 멈춤을 풀어주면 피로 회복이 빠르게 따라온다.</p>
        </div>
      </section>`;
  }

  if (district === '양산') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongnam-양산-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongnam-양산-manual-title" class="seo-title">양산은 외곽 이동이 끝나도 몸이 늦게 풀려</h2>
          <p>낮에는 버텼는데, 집 근처 도착하고 나니 갑자기 뻐근해졌다. 발부터 무거워지는 타입.</p>
          <p>양산의 핵심 테마는 ${theme}. ${places} 사이를 잇는 생활 패턴 ${pattern}이 반복되면, ${fatigue}가 마지막에 겹친다. ${local}이란 로컬 구간에서 굳음이 고정되면 근육 이완도 늦어진다.</p>
          <p>${keyword}는 ${local} 한 줄로만 조율해. 그 지점을 기준으로 방문 마사지 근육 이완 방향이 빨라진다.</p>
        </div>
      </section>`;
  }

  if (district === '거제') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongnam-거제-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongnam-거제-manual-title" class="seo-title">거제는 바람이 지나간 자리에서 피로가 남는다</h2>
          <p>바다는 시원했는데, 돌아오면 몸이 더 무거워진다. 이상하게 끝이 안 좋아.</p>
          <p>거제의 핵심 테마는 ${theme}. ${places}를 오가며 생활 패턴 ${pattern}이 이어지고, ${fatigue}가 겹치는 날엔 긴장이 천천히 남는다. 특히 ${local}에서 자세가 고정되면 방문 마사지가 더 빨리 필요해진다.</p>
          <p>${keyword}는 “${local}이 시작점이었어”라고만 말해줘. 근육 이완이 그 구간부터 들어가면 피로 회복이 빨라진다.</p>
        </div>
      </section>`;
  }

  if (district === '통영') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongnam-통영-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongnam-통영-manual-title" class="seo-title">통영은 항구 동선이 몸을 느리게 만든다</h2>
          <p>걷는 건 괜찮았는데, 집에 와서 씻는 순간 허리가 먼저 힘이 빠졌다. 하루가 길게 느껴졌지.</p>
          <p>통영의 핵심 테마는 ${theme}. ${places} 사이에서 생활 패턴 ${pattern}이 반복되면, ${fatigue}가 뒤늦게 붙는다. ${local}처럼 동선이 몰리는 구간이 생기면 근육이 더 빨리 굳는다.</p>
          <p>${keyword}는 ${local}을 기준으로 “어디서 제일 오래 갔는지”만 말해줘. 방문 마사지에서 그 흐름을 끊어주면 회복이 따라온다.</p>
        </div>
      </section>`;
  }

  if (district === '사천') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongnam-사천-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongnam-사천-manual-title" class="seo-title">사천은 일정 끝나고도 어깨가 남는다</h2>
          <p>오후엔 괜찮았는데, 해가 지고 나서 갑자기 몸이 눌렸다. “이거 왜 이래?” 싶을 때가 있어.</p>
          <p>사천의 핵심 테마는 ${theme}. ${places}를 오가며 생활 패턴 ${pattern}이 이어지고, ${fatigue}가 겹치면 피로가 늦게 풀린다. 특히 ${local}에서 굳으면 근육 이완 타이밍이 중요해진다.</p>
          <p>${keyword}는 “${local} 쪽에서 어깨가 먼저 묵직했다” 한 줄만 남겨. 방문 마사지에서 그 구간부터 정리하면 좋아.</p>
        </div>
      </section>`;
  }

  if (district === '밀양') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongnam-밀양-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongnam-밀양-manual-title" class="seo-title">밀양은 길게 걷고 나면 몸이 늦게 꺼진다</h2>
          <p>걸음이 늘어지진 않았는데, 집에 오니 속이 먼저 무거워졌다. 숨이 조금씩 차.</p>
          <p>밀양의 핵심 테마는 ${theme}. ${places}를 이어 다니는 생활 패턴 ${pattern}이 계속되고, ${fatigue}가 붙는 날엔 피로가 느리게 누적된다. ${local}에서 굳는 순간이 생기면 근육 이완도 늦어지기 쉽다.</p>
          <p>${keyword}는 ${local}을 한 줄로 말해줘. 그 지점을 기준으로 방문 마사지가 근육 이완을 정확히 맞춘다.</p>
        </div>
      </section>`;
  }

  if (district === '창녕') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongnam-창녕-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongnam-창녕-manual-title" class="seo-title">창녕은 조용한 동선이지만 피로는 깊게 남아</h2>
          <p>사람이 많은 곳은 아니었는데도 몸이 무겁다. 쉬었는데도 리듬이 안 돌아와.</p>
          <p>창녕의 핵심 테마는 ${theme}. ${places} 사이를 오가는 생활 패턴 ${pattern}이 이어지면, ${fatigue}가 천천히 붙는다. 특히 ${local}에서 긴장이 고정되면 근육이 더 잘 굳는다.</p>
          <p>${keyword}는 “${local}에서부터 무거웠어”라고만 말해줘. 그 순서로 방문 마사지가 맞춰지면 회복이 빨라진다.</p>
        </div>
      </section>`;
  }

  if (district === '함안') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongnam-함안-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongnam-함안-manual-title" class="seo-title">함안은 주차 한 번이 피로를 늘려</h2>
          <p>주차하고 내리는데 시간이 생각보다 길었다. 그 뒤로 몸이 묵직해져서 멈추질 않았다.</p>
          <p>함안의 핵심 테마는 ${theme}. ${places}를 오갈 때 생활 패턴 ${pattern}이 반복되고, ${fatigue}가 겹치면 회복이 더디다. ${local}에서 멈춘 감각이 오래 남는 날엔 근육 이완이 더 필요해진다.</p>
          <p>${keyword}는 예약 메모에 ${local}만 딱 적어줘. 방문 마사지가 그 멈춤 구간부터 풀어줄 수 있어.</p>
        </div>
      </section>`;
  }

  if (district === '하동') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongnam-하동-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongnam-하동-manual-title" class="seo-title">하동은 산길 끝에서 허리가 먼저 힘을 잃는다</h2>
          <p>바깥 공기는 좋았는데, 차로 돌아가는 길에서 허리가 먼저 묵직해졌다. 집에 와도 풀리는 속도가 느려.</p>
          <p>하동의 핵심 테마는 ${theme}. ${places}를 오가며 생활 패턴 ${pattern}이 이어지고, ${fatigue}가 겹치는 순간부터 피로가 길어진다. 특히 ${local}에서 자세가 고정되면 근육 이완 타이밍이 중요해진다.</p>
          <p>${keyword}는 ${local}을 기준으로 “어디서부터 뻐근해졌는지” 한 줄만 말해줘. 방문 마사지에서 그 구간부터 정리하면 좋다.</p>
        </div>
      </section>`;
  }

  if (district === '거창') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongnam-거창-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongnam-거창-manual-title" class="seo-title">거창은 이동 끝나고도 몸이 긴장 모드</h2>
          <p>짧게 다녀온 줄 알았는데, 돌아오니 어깨가 굳어있다. 조용한데 더 피곤한 타입.</p>
          <p>거창의 핵심 테마는 ${theme}. ${places}를 오갈 때 생활 패턴 ${pattern}이 반복되고, ${fatigue}가 겹치면 근육이 천천히 굳는다. ${local}이란 구간에서 긴장이 오래 고정되면 방문 마사지의 타이밍이 빨라야 한다.</p>
          <p>${keyword}는 “${local}에서 제일 오래 굳었어” 한 줄만 남겨. 그 흐름을 끊어주면 피로 회복이 빨라진다.</p>
        </div>
      </section>`;
  }

  if (district === '산청') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongnam-산청-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongnam-산청-manual-title" class="seo-title">산청은 바람이 지나가면 피로가 더 또렷해져</h2>
          <p>햇볕은 괜찮았는데, 집에 와서 손을 만지면 근육이 뻐근하더라. 바람 탓인가 싶었어.</p>
          <p>산청의 핵심 테마는 ${theme}. ${places}를 지나며 생활 패턴 ${pattern}이 이어지고, ${fatigue}가 겹치면 피로가 늦게 풀린다. 특히 ${local}에서 긴장이 굳어버리면 근육 이완이 더 필요해진다.</p>
          <p>${keyword}는 ${local}을 한 줄로 말해줘. 방문 마사지가 그 구간부터 풀어주면 회복이 따라온다.</p>
        </div>
      </section>`;
  }

  if (district === '의령') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongnam-의령-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongnam-의령-manual-title" class="seo-title">의령은 조용한 하루인데 피로가 남아</h2>
          <p>아무 일도 없었는데 왜 이렇게 무거울까. 집에 오니 몸이 천천히 굳어버렸다.</p>
          <p>의령의 핵심 테마는 ${theme}. ${places} 사이 생활 패턴 ${pattern}이 반복되고, ${fatigue}가 붙는 날엔 회복이 바로 오지 않는다. ${local}에서 긴장이 고정되면 근육 이완도 늦어진다.</p>
          <p>${keyword}는 “${local}이 시작이었어”처럼 짧게 말해줘. 방문 마사지에서 그 지점부터 풀어주면 좋다.</p>
        </div>
      </section>`;
  }

  if (district === '남해') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongnam-남해-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongnam-남해-manual-title" class="seo-title">남해는 바다 구간이 끝나면 어깨가 먼저 굳어</h2>
          <p>바다를 보고 걸었는데도 집에 오니 어깨가 자꾸 올라간다. 몸이 이미 피곤하다는 신호였어.</p>
          <p>남해의 핵심 테마는 ${theme}. ${places}를 오가며 생활 패턴 ${pattern}이 이어지고, ${fatigue}가 겹치면 피로가 고정된다. ${local}에서 긴장이 붙는 순간, 근육 이완 타이밍도 그쪽으로 맞춰야 한다.</p>
          <p>${keyword}는 ${local}을 한 줄로만 말해줘. 방문 마사지에서 그 구간부터 정리하면 피로 회복이 빨라진다.</p>
        </div>
      </section>`;
  }

  if (district === '합천') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongnam-합천-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongnam-합천-manual-title" class="seo-title">합천은 물가가 멀지 않은데도 몸이 느려져</h2>
          <p>가벼울 줄 알았는데, 다시 걷기 시작하면 몸이 무거워진다. 집에 와도 잔피로가 남는다.</p>
          <p>합천의 핵심 테마는 ${theme}. ${places}를 오가며 생활 패턴 ${pattern}이 반복되고, ${fatigue}가 겹치면 피로 회복이 늦어진다. 특히 ${local}처럼 동선이 굳는 구간이 있으면 근육 이완이 더 필요하다.</p>
          <p>${keyword}는 ${local}에서 “처음 굳었는지”만 말해줘. 방문 마사지가 그 타이밍을 잡으면 회복이 쉬워진다.</p>
        </div>
      </section>`;
  }

  if (district === '고성') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongnam-고성-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongnam-고성-manual-title" class="seo-title">고성은 이동이 끝나도 목이 먼저 뻣뻣</h2>
          <p>바깥은 평온했는데, 돌아오는 길에서 목이 자꾸 뻣뻣해졌다. 집에 와서 풀어보려 해도 잘 안 풀려.</p>
          <p>고성의 핵심 테마는 ${theme}. ${places} 사이 생활 패턴 ${pattern}이 이어지고, ${fatigue}가 겹치면 피로가 목/어깨로 먼저 간다. ${local}에서 긴장이 고정되면 근육 이완이 늦어지기 쉽다.</p>
          <p>${keyword}는 ${local}을 기준으로 “목이 먼저 굳는 구간”만 말해줘. 그 구간부터 방문 마사지가 정확해진다.</p>
        </div>
      </section>`;
  }

  if (district === '함양') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongnam-함양-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongnam-함양-manual-title" class="seo-title">함양은 산길 일정 뒤에 피로가 깊게 남아</h2>
          <p>오늘은 산책만 했다고 생각했는데, 끝나고 나니 몸이 더 무거웠다. 조용히 누적되는 피로였어.</p>
          <p>함양의 핵심 테마는 ${theme}. ${places}를 지나며 생활 패턴 ${pattern}이 반복되고, ${fatigue}가 겹치면 산길 운전/걷기 피로가 길게 남는다. ${local}에서 자세가 고정되면 근육 이완이 늦어진다.</p>
          <p>${keyword}는 ${local}에서 굳었던 순간을 한 줄로 말해줘. 방문 마사지가 그 지점을 먼저 풀어주면 회복이 빨라진다.</p>
        </div>
      </section>`;
  }

  // 합천/고성/함양 등을 제외한 나머지는 기본 흐름
  return `
    <section class="seo-section" aria-labelledby="seo-gyeongnam-${district}-manual-title">
      <div class="container seo-inner">
        <h2 id="seo-gyeongnam-${district}-manual-title" class="seo-title">${district}은 오늘 구간이 피로를 고정시킨다</h2>
        <p>마음은 괜찮았는데 몸이 먼저 항복했다. 집에 와서도 잔피로가 계속 남는 날이 있지.</p>
        <p>${district}의 핵심 테마는 ${theme}. ${places}를 오가며 생활 패턴 ${pattern}이 이어지고, ${fatigue}가 겹치면 피로 회복이 늦어진다. ${local}에서 굳는 순간이 생기면 방문 마사지의 타이밍이 중요해진다.</p>
        <p>${keyword}는 ${local}을 한 줄로만 말해줘. 근육 이완은 그 흐름에 맞추면 된다.</p>
      </div>
    </section>`;
}

function main() {
  const md = fs.readFileSync(PROFILE_PATH, 'utf8');
  const profiles = parseProfiles(md);

  const region = '경남';
  const rp = profiles.get(region);
  if (!rp) throw new Error('경남 프로필 없음');

  // 지역(보조)
  {
    const regionHtml = fs.readFileSync(REGION_PATH, 'utf8');
    fs.writeFileSync(REGION_PATH, upsertSeoSection(regionHtml, buildRegionSeo(rp)), 'utf8');
  }

  const districts = [
    '창원', '김해', '진주', '양산', '거제', '통영', '사천', '밀양', '함안', '창녕', '하동', '거창', '산청', '의령',
    '남해', '합천', '고성', '함양',
  ];

  for (const district of districts) {
    const key = `경남.${district}`;
    const p = profiles.get(key);
    if (!p) throw new Error(`프로필 없음: ${key}`);
    const filePath = path.join(DISTRICTS_DIR, `경남-${district}출장마사지.html`);
    if (!fs.existsSync(filePath)) throw new Error(`파일 없음: ${filePath}`);
    const html = fs.readFileSync(filePath, 'utf8');
    const sectionHtml = districtSeo(region, district, p);
    fs.writeFileSync(filePath, upsertSeoSection(html, sectionHtml), 'utf8');
  }

  console.log('[done] 경남 지역+구 seo-section 수작업 재작성 완료(표 제거, 1000자 이하 목표)');
}

if (require.main === module) main();

