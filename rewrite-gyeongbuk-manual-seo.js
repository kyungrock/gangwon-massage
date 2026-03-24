const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PROFILE_PATH = path.join(ROOT, 'korea-regions-seo-profiles.md');
const REGION_PATH = path.join(ROOT, 'regions', '경북출장마사지.html');
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
  // “ ” 제거
  return String(local || '').replace(/[“”]/g, '');
}

function buildRegionSeo(p) {
  const theme = escapeHtml(p.theme);
  const places = escapeHtml(p.places);
  const pattern = escapeHtml(p.pattern);
  const fatigue = escapeHtml(p.fatigue);
  const local = escapeHtml(cleanLocal(p.local));

  return `
    <section class="seo-section" aria-labelledby="seo-gyeongbuk-region-manual-title">
      <div class="container seo-inner">
        <h2 id="seo-gyeongbuk-region-manual-title" class="seo-title">경북 하루 끝, 몸이 먼저 무거워지는 구간</h2>
        <p>오늘은 이동이 길었는데, 집에 와서야 왜 이렇게 뻐근한지 알게 됐다. 그냥 피곤한 게 아니라, 특정 구간이 누적되는 느낌.</p>
        <p>경북 전체 핵심은 ${theme}야. ${places}를 오가며 생활 패턴 ${pattern}이 반복되면, ${fatigue} 같은 피로 상황이 뒤늦게 붙는다. 그래서 ${local}처럼 오래 기억되는 로컬 동선이 생기면 긴장이 더 오래 남는다.</p>
        <p>경북 출장마사지에서 중요한 건 그 지점부터 방향을 맞추는 거야. 방문 마사지 받을 때 ${local}을 한 줄로만 말해줘. 그러면 근육 이완 타이밍이 딱 맞아 들어간다.</p>
      </div>
    </section>`;
}

function buildDistrictSeo(district, p) {
  const theme = escapeHtml(p.theme);
  const places = escapeHtml(p.places);
  const pattern = escapeHtml(p.pattern);
  const fatigue = escapeHtml(p.fatigue);
  const local = escapeHtml(cleanLocal(p.local));
  const keyword = `경북 ${district} 출장마사지`;

  // district별 문장 흐름을 확실히 다르게(도입/전개/마감 각각 다르게)
  if (district === '포항') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongbuk-포항-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongbuk-포항-manual-title" class="seo-title">포항은 바람 구간이 끝나도 피로가 이어진다</h2>
          <p>산책은 가볍게 시작했는데, ${local} 지나고 나니 몸이 느려지더라. 웃다가도 어깨가 먼저 잠기는 날이 있어.</p>
          <p>포항의 핵심 테마는 ${theme}. ${places}를 오가며 생활 패턴 ${pattern}이 굳으면, ${fatigue}가 뒤늦게 올라온다. 특히 ${local}에서 자세가 고정되는 순간부터 근육 이완이 늦게 따라와.</p>
          <p>그래서 <span>${keyword}</span>는 “${local}에서 멈춘 시간”만 한 줄로 말해줘. 방문 마사지로 그 흐름을 끊으면 피로 회복이 빨라진다.</p>
        </div>
      </section>`;
  }

  if (district === '경주') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongbuk-경주-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongbuk-경주-manual-title" class="seo-title">경주는 걷고 나서야 몸이 말한다</h2>
          <p>오늘은 괜찮다고 생각했는데, 집에 들어오는 순간부터 허리가 먼저 답했다. “조금만 더”가 길어지는 느낌.</p>
          <p>경주의 핵심은 ${theme}야. ${places} 사이를 반복 이동할 때 생활 패턴 ${pattern}이 이어지고, ${fatigue} 같은 조건이 겹치면 피로가 천천히 쌓인다. ${local}이 들어오는 타이밍이 딱 그때였어.</p>
          <p>${keyword} 예약할 땐 ${local}을 앞세워줘. 그 한 줄이 방문 마사지 근육 이완 방향을 빠르게 정해준다!</p>
        </div>
      </section>`;
  }

  if (district === '김천') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongbuk-김천-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongbuk-김천-manual-title" class="seo-title">김천은 일정 사이의 ‘간격’이 피로를 만든다</h2>
          <p>카페에서 잠깐 쉬었는데도 몸이 가벼워지지 않았다. 오히려 ${local}부터 다시 무거워지더라.</p>
          <p>김천의 테마는 ${theme}. ${places} 이동 중에 생활 패턴 ${pattern}이 겹치고, ${fatigue} 같은 피로 상황이 들어오면 컨디션이 천천히 꺼진다. ${local}이 끼는 순간이 특히 길게 남는다.</p>
          <p>그래서 <strong style="font-weight:600">${keyword}</strong>는 “${local}에서 굳었어” 한 문장으로 정리하면 충분해. 근육 이완은 그 지점부터 시작되는 게 맞다.</p>
        </div>
      </section>`;
  }

  if (district === '안동') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongbuk-안동-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongbuk-안동-manual-title" class="seo-title">안동은 오래 앉고 난 뒤가 더 힘들다</h2>
          <p>오늘은 걷는 양이 많지 않았는데, ${local}에 닿은 뒤로 몸이 천천히 무너졌다. 앉아 있던 시간이 길게 남는 날이야.</p>
          <p>안동 핵심 테마는 ${theme}. ${places}를 오가며 생활 패턴 ${pattern}이 반복되고, ${fatigue}가 붙으면 회복 속도가 느려져. 특히 ${local}에서 긴장이 풀리지 않아서 근육 이완 타이밍을 놓치기 쉽다.</p>
          <p>${keyword}는 “${local}에서 가장 오래 멈춘 곳”만 말해줘. 방문 마사지가 그 지점을 빠르게 정리해준다.</p>
        </div>
      </section>`;
  }

  if (district === '구미') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongbuk-구미-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongbuk-구미-manual-title" class="seo-title">구미는 야근 루트가 몸을 끌고 간다</h2>
          <p>낮엔 괜찮았는데, 밤이 되자마자 속도가 확 떨어졌다. ${local} 지나면 어깨부터 묵직해져.</p>
          <p>구미의 핵심은 ${theme}. ${places}를 오가는 생활 패턴 ${pattern}이 이어지고, ${fatigue} 같은 조건이 더해지면 피로가 쉽게 풀리지 않는다. ${local}에서 굳는 감각이 길어질수록 근육 이완은 더 필요해진다.</p>
          <p>그래서 ${keyword}는 예약 메모에 ${local}을 딱 넣어줘. 방문 마사지에서는 그 구간의 긴장을 먼저 끊어주는 게 핵심.</p>
        </div>
      </section>`;
  }

  if (district === '영주') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongbuk-영주-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongbuk-영주-manual-title" class="seo-title">영주는 고개 넘어가면 피로가 따라온다</h2>
          <p>처음엔 괜찮았는데, ${local}을 지나면서 목이랑 어깨가 같이 뻣뻣해졌다. 길이 길게 느껴지는 날이 있지.</p>
          <p>영주의 테마는 ${theme}. ${places} 이동 동안 생활 패턴 ${pattern}이 반복되고, ${fatigue}가 겹치면 피로가 늦게 풀린다. ${local}에서 몸이 먼저 굳는 순간, 방문 마사지 근육 이완도 그 흐름을 타야 한다.</p>
          <p>${keyword}는 “${local}부터 힘이 빠졌어”처럼 짧게 말해줘. 그 한 줄이면 충분해.</p>
        </div>
      </section>`;
  }

  if (district === '영천') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongbuk-영천-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongbuk-영천-manual-title" class="seo-title">영천은 바쁜 이동이 끝나고 남는 여운이 문제</h2>
          <p>계속 움직이느라 몰랐는데, 집에 와서 신발 벗자마자 무게가 확 느껴졌다. ${local}이 원인이었어.</p>
          <p>영천의 핵심 테마는 ${theme}. ${places} 사이를 오가며 생활 패턴 ${pattern}이 누적되면, ${fatigue} 같은 조건이 뒤로 붙는다. ${local}에서 긴장이 고정되면 회복이 늦어진다.</p>
          <p>${keyword}는 “${local}에서 굳었어” 한 줄로 예약해. 방문 마사지에서는 그 지점부터 근육 이완 타이밍을 맞춰야 편하다.</p>
        </div>
      </section>`;
  }

  if (district === '상주') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongbuk-상주-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongbuk-상주-manual-title" class="seo-title">상주는 읍내 장보기 이후에 피로가 커진다</h2>
          <p>장바구니 들고 나와서 몇 군데만 들렀는데, 돌아오는 길엔 몸이 더 느려졌다. ${local}에서 확 왔어.</p>
          <p>상주 테마는 ${theme}. ${places}를 오가며 생활 패턴 ${pattern}이 이어지고, ${fatigue}가 겹치면 일상 피로가 근육에 남는다. ${local}에서 “아, 여기서부터였네”가 된다.</p>
          <p>${keyword}는 예약할 때 ${local}을 중심으로 한 문장만 남겨줘. 그 동선이 방문 마사지의 시작점이 된다.</p>
        </div>
      </section>`;
  }

  if (district === '문경') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongbuk-문경-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongbuk-문경-manual-title" class="seo-title">문경은 산길 뒤에 몸이 더 느려진다</h2>
          <p>달릴 땐 몰랐는데, ${local} 쪽에서 속도가 줄자마자 몸이 반응했다. 운전 끝나고도 뻐근함이 남는 날.</p>
          <p>문경 핵심은 ${theme}. ${places}를 오갈 때 생활 패턴 ${pattern}이 반복되고, ${fatigue}가 겹치면 피로가 쉽게 풀리지 않는다. ${local}에서 긴장이 고정되면 근육 이완 타이밍도 늦어진다.</p>
          <p>${keyword}는 “${local}에서 가장 오래 막혔어” 한 줄이 답이야. 방문 마사지로 그 구간부터 정리해줘.</p>
        </div>
      </section>`;
  }

  if (district === '경산') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongbuk-경산-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongbuk-경산-manual-title" class="seo-title">경산은 통근이 끝나도 피로가 남는다</h2>
          <p>일은 끝났는데, 몸은 아직 출근 모드. ${local}에서 마지막 전환이 늦어지면 뻐근함이 더 길어진다.</p>
          <p>경산의 핵심 테마는 ${theme}. ${places} 이동 중 생활 패턴 ${pattern}이 계속 이어지고, ${fatigue}가 붙으면 피로가 늦게 풀린다. 특히 ${local}에서 자세가 딱 고정되는 날엔 근육 이완이 더 필요해.</p>
          <p>${keyword}를 받을 땐 ${local}을 먼저 말해줘. 그 구간부터 방문 마사지가 맞춰지면 회복이 편해진다.</p>
        </div>
      </section>`;
  }

  if (district === '의성') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongbuk-의성-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongbuk-의성-manual-title" class="seo-title">의성은 조용해서 더 늦게 아픈 타입</h2>
          <p>오늘은 별일 없던 날 같았는데, 집에 오니 몸이 조용히 굳어있었다. ${local}이 그 시작점.</p>
          <p>의성 핵심 테마는 ${theme}. ${places} 사이를 오가며 생활 패턴 ${pattern}이 반복되고, ${fatigue}가 겹치면 몸이 천천히 지친다. ${local}에서 긴장이 오래 남으면 근육 이완도 늦게 들어간다.</p>
          <p>${keyword} 예약 메모는 간단하게. “${local} 기준으로 뭉친 느낌”만 말해도 충분해.</p>
        </div>
      </section>`;
  }

  if (district === '청송') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongbuk-청송-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongbuk-청송-manual-title" class="seo-title">청송은 산길 공기가 피로를 더 진하게 만든다</h2>
          <p>바람이 차가워서 더 오래 걸었는데, 내려오는 길엔 허리가 먼저 뻣뻣해졌다. ${local}에서 딱 왔어.</p>
          <p>청송 핵심 테마는 ${theme}. ${places}를 오갈 때 생활 패턴 ${pattern}이 이어지고, ${fatigue}가 겹치면 회복이 생각보다 오래 간다. 특히 ${local}처럼 특정 구간에서 몸이 굳으면 근육 이완 타이밍을 놓치기 쉽다.</p>
          <p>${keyword}는 ${local}에서 굳은 감각을 먼저 떠올리게 예약해. 그 한 줄이 방문 마사지 방향을 빠르게 만든다.</p>
        </div>
      </section>`;
  }

  if (district === '영양') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongbuk-영양-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongbuk-영양-manual-title" class="seo-title">영양은 고원 일정이 끝나고도 피로가 남는다</h2>
          <p>안개가 껴있던 날엔 걸음이 느려졌다. ${local}에 닿는 순간부터 몸이 무거워지더라.</p>
          <p>영양의 테마는 ${theme}. ${places} 사이에서 생활 패턴 ${pattern}이 반복되고, ${fatigue}가 겹치면 고원 피로가 더 진하게 붙는다. ${local}에서 움직임이 멈추면 근육 이완이 늦어진다.</p>
          <p>${keyword}는 “${local}에서 몸이 가장 느려졌어”라고만 말해줘. 그 지점부터 풀리기 시작한다.</p>
        </div>
      </section>`;
  }

  if (district === '영덕') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongbuk-영덕-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongbuk-영덕-manual-title" class="seo-title">영덕은 바다 바람이 지나가도 피로가 남는다</h2>
          <p>바닷가 보고 돌아오는데, ${local}만 지나면 어깨가 또 묵직해졌다. 이상하게 끝이 없더라.</p>
          <p>영덕 핵심 테마는 ${theme}. ${places}를 오갈 때 생활 패턴 ${pattern}이 이어지고, ${fatigue}가 겹치면 피로가 쉽게 안 풀린다. 특히 ${local}에서 긴장이 고정되면 근육 이완이 필요해진다.</p>
          <p>${keyword}는 예약 메모로 충분해. “${local}이 가장 힘들었어” 한 줄만.</p>
        </div>
      </section>`;
  }

  if (district === '청도') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongbuk-청도-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongbuk-청도-manual-title" class="seo-title">청도는 일정 끝나고도 몸이 계속 서늘하다</h2>
          <p>낮엔 괜찮았는데, ${local} 쪽에서 몸이 먼저 식는 느낌이 들었다. 집에 와서도 온몸이 덜 풀린다.</p>
          <p>청도의 핵심 테마는 ${theme}. ${places} 이동 중 생활 패턴 ${pattern}이 반복되고, ${fatigue}가 붙으면 피로가 오래 이어진다. ${local}에서 긴장이 굳어버리면 근육 이완이 늦게 들어간다.</p>
          <p>${keyword}는 “${local}에서 처음 굳었어”를 말해줘. 그 지점부터 방문 마사지가 맞춰지면 회복이 빨라져.</p>
        </div>
      </section>`;
  }

  if (district === '고령') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongbuk-고령-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongbuk-고령-manual-title" class="seo-title">고령은 농로 동선이 피로를 길게 만든다</h2>
          <p>차는 잘 움직였는데, 내려서 걷는 순간 몸이 묵직해졌다. ${local}에서 특히 오래 남았어.</p>
          <p>고령 핵심 테마는 ${theme}. ${places}를 오갈 때 생활 패턴 ${pattern}이 반복되고, ${fatigue}가 겹치면 피로가 지연돼서 더 늦게 올라온다. ${local}에서 긴장이 고정되면 근육 이완 타이밍을 빨리 맞춰야 한다.</p>
          <p>${keyword} 예약은 ${local}부터. “여기서부터 무거웠다” 한 줄이면 끝.</p>
        </div>
      </section>`;
  }

  if (district === '성주') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongbuk-성주-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongbuk-성주-manual-title" class="seo-title">성주는 바쁜 오후가 끝나고도 몸이 남는다</h2>
          <p>시장 들렀다가 돌아오는 길에 피로가 한 번 더 올라왔다. ${local}에서 멈추는 시간이 길수록 더 심해져.</p>
          <p>성주 테마는 ${theme}. ${places} 사이를 오가며 생활 패턴 ${pattern}이 반복되고, ${fatigue}가 겹치면 회복이 늦어진다. 특히 ${local}에서 자세가 굳으면 근육 이완이 더 필요해진다.</p>
          <p>${keyword}는 “${local}에서 어디가 제일 버텼어?”만 말해줘. 그 답이 방문 마사지 순서가 된다.</p>
        </div>
      </section>`;
  }

  if (district === '칠곡') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongbuk-칠곡-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongbuk-칠곡-manual-title" class="seo-title">칠곡은 이동이 늘어날수록 목이 먼저 묵직해진다</h2>
          <p>오늘은 몸이 문제 같진 않았는데, ${local}을 지나고 나니 목이 먼저 잠겼다. 생각보다 오래 가더라.</p>
          <p>칠곡의 핵심 테마는 ${theme}. ${places}를 오가며 생활 패턴 ${pattern}이 반복되고, ${fatigue}가 겹치면 피로가 더 늦게 풀린다. ${local}에서 긴장이 고정되면 근육 이완 타이밍이 중요해진다.</p>
          <p>${keyword}는 ${local} 한 줄이 가장 정확해. 방문 마사지에서 그 지점부터 정리하면 회복이 빠르다.</p>
        </div>
      </section>`;
  }

  if (district === '예천') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongbuk-예천-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongbuk-예천-manual-title" class="seo-title">예천은 길게 돌아가는 동선이 피로를 남긴다</h2>
          <p>짧게 다녀올 줄 알았는데, 생각보다 동선이 길어졌다. ${local}이 합쳐지며 몸이 더 무거워진다.</p>
          <p>예천의 핵심은 ${theme}. ${places} 사이에서 생활 패턴 ${pattern}이 반복되고, ${fatigue}가 겹치면 긴장이 늦게 풀린다. 특히 ${local}에서 멈추면 피로 회복이 더 늦어질 수 있다.</p>
          <p>${keyword}는 “${local}에서 가장 오래 멈춘 곳”을 한 줄로 말해줘. 방문 마사지가 그 흐름을 끊는다.</p>
        </div>
      </section>`;
  }

  if (district === '봉화') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongbuk-봉화-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongbuk-봉화-manual-title" class="seo-title">봉화는 겨울 공기가 몸을 굳힌다</h2>
          <p>바람이 세게 들어오는데도, ${local} 한 번 보고 오자 했다. 돌아오고 나서야 몸이 굳어있다는 걸 알았다.</p>
          <p>봉화 핵심 테마는 ${theme}. ${places}를 오갈 때 생활 패턴 ${pattern}이 이어지고, ${fatigue}가 겹치면 회복이 느려진다. ${local}에서 긴장이 고정되면 근육 이완이 더 필요해진다.</p>
          <p>${keyword} 예약 메모는 짧게. “${local} 쪽이 제일 힘들었어” 한 줄이면 충분.</p>
        </div>
      </section>`;
  }

  if (district === '울진') {
    return `
      <section class="seo-section" aria-labelledby="seo-gyeongbuk-울진-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-gyeongbuk-울진-manual-title" class="seo-title">울진은 바람 뒤에 허리가 먼저 뻐근해진다</h2>
          <p>해안 쪽 걷고 나왔는데, 집 가는 길에 허리가 먼저 답했다. ${local}이 지나간 뒤가 특히 무거워.</p>
          <p>울진의 핵심 테마는 ${theme}. ${places}를 오가며 생활 패턴 ${pattern}이 반복되고, ${fatigue}가 겹치면 피로가 늦게 풀린다. ${local}에서 자세가 고정되는 날엔 방문 마사지가 꼭 필요해져.</p>
          <p>${keyword}는 “${local}에서 언제부터 굳었는지”만 말해줘. 그 지점부터 근육 이완이 빠르게 들어간다.</p>
        </div>
      </section>`;
  }

  // 울릉
  return `
    <section class="seo-section" aria-labelledby="seo-gyeongbuk-울릉-manual-title">
      <div class="container seo-inner">
        <h2 id="seo-gyeongbuk-울릉-manual-title" class="seo-title">울릉은 섬 동선이 끝나도 잔피로가 남는다</h2>
        <p>내려왔다가 다시 돌아가는 날은 유독 피곤해. ${local} 쪽에서 몸이 먼저 지친다.</p>
        <p>울릉 핵심 테마는 ${theme}. ${places} 사이 생활 패턴 ${pattern}이 이어지고, ${fatigue}가 겹치면 섬 특유의 잔피로가 길게 남는다. ${local}에서 긴장이 고정되면 근육 이완이 늦어져.</p>
        <p>${keyword}는 ${local}을 말해주기만 하면 돼. 방문 마사지에서 그 순서로 풀면 회복이 확실해진다.</p>
      </div>
    </section>`;
}

function main() {
  const md = fs.readFileSync(PROFILE_PATH, 'utf8');
  const profiles = parseProfiles(md);

  const region = '경북';
  const rp = profiles.get(region);
  if (!rp) throw new Error('경북 프로필 없음');

  // 지역(보조)
  {
    const regionHtml = fs.readFileSync(REGION_PATH, 'utf8');
    fs.writeFileSync(REGION_PATH, upsertSeoSection(regionHtml, buildRegionSeo(rp)), 'utf8');
  }

  const districts = [
    '포항', '경주', '김천', '안동', '구미', '영주', '영천', '상주', '문경', '경산',
    '의성', '청송', '영양', '영덕', '청도', '고령', '성주', '칠곡', '예천', '봉화',
    '울진', '울릉',
  ];

  for (const district of districts) {
    const key = `${region}.${district}`;
    const p = profiles.get(key);
    if (!p) throw new Error(`프로필 없음: ${key}`);
    const filePath = path.join(DISTRICTS_DIR, `경북-${district}출장마사지.html`);
    if (!fs.existsSync(filePath)) throw new Error(`파일 없음: ${filePath}`);
    const html = fs.readFileSync(filePath, 'utf8');
    fs.writeFileSync(filePath, upsertSeoSection(html, buildDistrictSeo(district, p)), 'utf8');
  }

  console.log('[done] 경북 지역+구 seo-section 수작업 재작성 완료');
}

if (require.main === module) main();

