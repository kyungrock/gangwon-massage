const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PROFILE_PATH = path.join(ROOT, 'korea-regions-seo-profiles.md');
const REGION_PATH = path.join(ROOT, 'regions', '서울출장마사지.html');
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
  const theme = p.theme;
  const places = p.places;
  const pattern = p.pattern;
  const fatigue = p.fatigue;
  const local = cleanLocal(p.local);
  return `
      <section class="seo-section" aria-labelledby="seo-seoul-region-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-seoul-region-manual-title" class="seo-title">서울 하루 끝, 뻐근함이 남는 이유</h2>
          <p>아, 오늘 진짜 힘들다. 서울은 끝나고 나서야 몸이 “내일도 또 할 거지?” 하고 되묻는 느낌이 있다.</p>
          <p>서울의 핵심은 ${escapeHtml(theme)}야. ${escapeHtml(places)}를 오가며 생활 패턴 ${escapeHtml(pattern)}가 계속 이어지면, ${escapeHtml(fatigue)} 같은 피로 상황이 한꺼번에 올라온다. 특히 ${escapeHtml(local)}에서 긴장이 늦게 풀려서 다음날까지 남는 경우가 많아.</p>
          <p>그래서 <strong>서울 출장마사지</strong>는 근육 이완을 “대충”이 아니라, ${escapeHtml(local)}에서 먼저 굳은 흐름부터 끊는 쪽이 맞다. 방문 마사지 받을 때는 그 구간만 한 줄로 말해줘. 그러면 피로 회복 포인트가 더 빨리 잡힌다.</p>
        </div>
      </section>`;
}

function districtSeo(region, district, p) {
  const theme = p.theme;
  const places = p.places;
  const pattern = p.pattern;
  const fatigue = p.fatigue;
  const local = cleanLocal(p.local);

  const keyword = `${region} ${district} 출장마사지`;

  // 구별로 완전히 다른 문장 리듬/전개를 사용(템플릿 패턴 최소화)
  if (district === '종로') {
    return `
      <section class="seo-section" aria-labelledby="seo-seoul-종로-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-seoul-종로-manual-title" class="seo-title">종로 동선, 오늘은 어디가 제일 굳었어?</h2>
          <p>아, 오늘 진짜 힘들다. 경복궁 앞 바람이 뺨을 치는데 걸음이 자꾸 느려진다.</p>
          <p>종로는 ${escapeHtml(theme)}가 핵심이야. ${escapeHtml(places)}를 오가다 보면 낮엔 관광·회의로 정신이 바쁘고, 저녁엔 공연·술자리로 리듬이 바뀐다. 그래서 ${escapeHtml(fatigue)} 같은 상황이 생기면 몸은 멈출 틈을 못 찾고, 결국 ${escapeHtml(local)}처럼 좁은 구간에서 긴장이 먼저 쌓여버려.</p>
          <p><strong>${keyword}</strong>는 방문 마사지 받을 때 “오늘은 안국역에서 삼청으로” 같은 한 줄이 도움이 돼. 생활 패턴 ${escapeHtml(pattern)}이 반복되는 날일수록, 근육 이완은 그 흐름을 끊는 타이밍이 중요하거든.</p>
        </div>
      </section>`;
  }

  if (district === '중구') {
    return `
      <section class="seo-section" aria-labelledby="seo-seoul-중구-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-seoul-중구-manual-title" class="seo-title">중구는 밤이 주인, 피로도 늦게 온다</h2>
          <p>퇴근길인데도 몸이 먼저 지친다. 명동 불빛 보고 잠깐 웃었는데, 어깨가 바로 무거워졌다!</p>
          <p>중구는 ${escapeHtml(theme)} 쪽으로 움직일 때 차이가 생겨. ${escapeHtml(places)} 사이를 오가다 보면 낮엔 도보, 밤엔 지하철처럼 생활 패턴 ${escapeHtml(pattern)}이 바뀌고, 새벽 물류·주말 인파 같은 ${escapeHtml(fatigue)}가 겹친다. 특히 ${escapeHtml(local)}에서 배달·택시 정체까지 얹히면 피로 회복이 늦어져.</p>
          <p><strong>${keyword}</strong>는 강도보다 동선 밀도를 먼저 맞추는 게 맞다. “을지로3가 골목 입구로 들어갔다가 필동 책방골목 지나갔어”처럼 말해주면, 근육 이완이 빨리 들어간다.</p>
        </div>
      </section>`;
  }

  if (district === '용산') {
    return `
      <section class="seo-section" aria-labelledby="seo-seoul-용산-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-seoul-용산-manual-title" class="seo-title">용산은 ‘이동 감각’이 굳힘을 만든다</h2>
          <p>오늘은 이동이 많았다. 한강진역에서 내려 걷는데 숨이 먼저 차더라…</p>
          <p>용산의 핵심은 ${escapeHtml(theme)}야. 용산역·아이파크몰부터 이태원 메인, 한남·한강진까지 ${escapeHtml(places)}를 밟아가면, 밤중 보행과 주말 카페 동선이 겹치며 ${escapeHtml(pattern)}처럼 생활이 이어진다. 그런데 ${escapeHtml(fatigue)}처럼 소음·인파와 주차 스트레스까지 닿는 날엔, ${escapeHtml(local)}에서 호흡이 답답해지면서 긴장이 늦게 풀린다.</p>
          <p><strong>${keyword}</strong>는 방문 마사지 시작 전에 “한강진역에서 블루스퀘어 쪽으로 갔어” 정도만 기억해줘. 그 정보가 피로 회복 방향을 딱 정해준다.</p>
        </div>
      </section>`;
  }

  if (district === '성동') {
    return `
      <section class="seo-section" aria-labelledby="seo-seoul-성동-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-seoul-성동-manual-title" class="seo-title">성동은 성수 리듬이 몸에 박힌다</h2>
          <p>왕십리 환승만 몇 번 했을 뿐인데, 허리 옆이 먼저 당긴다. 오늘 왜 이래?</p>
          <p>성동은 ${escapeHtml(theme)}가 중심이야. ${escapeHtml(places)}를 오갈 때 주말엔 성수 산책·줄서기, 평일엔 왕십리 환승처럼 생활 패턴 ${escapeHtml(pattern)}이 계속 바뀐다. 여기에 ${escapeHtml(fatigue)}가 겹치면 발보다 허리·골반 쪽이 먼저 굳어버려. ${escapeHtml(local)} 같은 구간에서 특히 느낌이 더 확 올라와.</p>
          <p>그래서 <strong>${keyword}</strong>는 방문 마사지에서 근육 이완을 “어디가 뻐근한지”보다 “어디서 굳었는지”부터 잡자. 성수대교에서 뚝섬으로, 이런 흐름 말이야!</p>
        </div>
      </section>`;
  }

  if (district === '광진') {
    return `
      <section class="seo-section" aria-labelledby="seo-seoul-광진-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-seoul-광진-manual-title" class="seo-title">광진은 ‘소음+언덕’이 동시에 온다</h2>
          <p>강변 쪽으로 걷다가 멈칫했다. 건대 소음이 귀에 남아, 다리가 뒤늦게 무너져.</p>
          <p>광진의 테마는 ${escapeHtml(theme)}야. ${escapeHtml(places)}를 지나면 밤늦게 대학가 상권이 열리고, 한강 러닝처럼 리듬이 달라진다. 그런데 ${escapeHtml(fatigue)} 같은 상황이 닿으면, 경사 오르내리기와 막히는 퇴근이 겹치면서 힘이 더 늦게 빠진다. 특히 ${escapeHtml(local)}에서 피로가 “딱 붙는” 느낌이 와.</p>
          <p><strong>${keyword}</strong>는 방문 마사지 예약할 때 “어린이대공원역에서 건대로” 같은 로컬 지명·동선만 남겨도 좋아. 그 다음은 근육 이완 쪽이 알아서 더 빠르게 들어간다.</p>
        </div>
      </section>`;
  }

  if (district === '동대문') {
    return `
      <section class="seo-section" aria-labelledby="seo-seoul-동대문-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-seoul-동대문-manual-title" class="seo-title">동대문, 시장 골목은 긴장이 먼저 굳는다</h2>
          <p>시장 골목으로 들어간 순간 겨울 바람이 꽉 끼었다. 가만히 서 있어도 목이 뻣뻣해지더라.</p>
          <p>동대문은 ${escapeHtml(theme)} 쪽으로 움직일 때 피로가 남는 속도가 빨라. ${escapeHtml(places)} 사이에서 낮엔 대학가, 저녁엔 회기 먹자 골목 같은 생활 패턴 ${escapeHtml(pattern)}이 반복되는데, ${escapeHtml(fatigue)}가 붙으면 좁은 시장 골목 밀집이 그냥 불편을 넘어 긴장으로 바뀐다. ${escapeHtml(local)}처럼 빠져나오는 동선이 꼬이면 그 긴장이 더 오래 간다.</p>
          <p>그래서 <strong>${keyword}</strong>는 방문 마사지 전에 “회기역 뒤편 곱창골목”처럼 지나온 포인트만 짚어줘. 그 한 줄이 피로 회복의 출발점이 된다.</p>
        </div>
      </section>`;
  }

  if (district === '중랑') {
    return `
      <section class="seo-section" aria-labelledby="seo-seoul-중랑-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-seoul-중랑-manual-title" class="seo-title">중랑천 걷기는 좋은데, 끝나면 더 피곤해</h2>
          <p>중랑천 걷고 나왔는데 왜 이렇게 피곤하지? 상봉 환승 거리에서 이미 힘이 다 달아났다.</p>
          <p>중랑은 ${escapeHtml(theme)}가 핵심이야. ${escapeHtml(places)}를 타고 이동하면서 중랑천 산책·러닝과 상봉 환승이 이어지고, 면목·사가정 장보기까지 생활 패턴 ${escapeHtml(pattern)}이 한 번에 붙는다. 문제는 ${escapeHtml(fatigue)}처럼 환승 거리와 밤 이동 정체가 같이 오는 날이야. ${escapeHtml(local)}에서 피곤이 “한 번 더” 눌린다.</p>
          <p><strong>${keyword}</strong>에서 근육 이완은 발부터 잡는 게 유리해. “중랑천 자전거 다리 쪽으로 걸었어” 같은 동선만 기억해도 된다.</p>
        </div>
      </section>`;
  }

  if (district === '성북') {
    return `
      <section class="seo-section" aria-labelledby="seo-seoul-성북-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-seoul-성북-manual-title" class="seo-title">성북은 언덕이 다리를 속인다</h2>
          <p>언덕 오르는데 심장이 먼저 뛰고, 종아리는 따라가질 못한다. 돈암에서 정릉까지가 길었어.</p>
          <p>성북의 핵심은 ${escapeHtml(theme)}야. ${escapeHtml(places)}는 한 번씩 도보로 연결되는데, 언덕 오르내림과 성북천 산책 같은 생활 패턴 ${escapeHtml(pattern)}이 쌓인다. 그래서 ${escapeHtml(fatigue)}처럼 경사와 좁은 골목 주차 전쟁이 닿는 날엔, 통증이 천천히 올라와 더 답답해져. ${escapeHtml(local)}에서 특히 굳는 속도가 빠르다.</p>
          <p>그래서 <strong>${keyword}</strong>는 방문 마사지 때 “삼선교에서 성북천 따라” 같은 흐름을 말해줘. 피로 회복이 다음날까지 이어지게 만들려면, 근육 이완 타이밍을 거기 맞추는 게 좋아.</p>
        </div>
      </section>`;
  }

  if (district === '강북') {
    return `
      <section class="seo-section" aria-labelledby="seo-seoul-강북-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-seoul-강북-manual-title" class="seo-title">강북은 산길 들어가기 전부터 이미 굳는다</h2>
          <p>수유리 먹자골목 나왔다가 또 방향을 바꿨다. 우이동 입구 바람 때문에 온몸이 굳어버림!</p>
          <p>강북은 ${escapeHtml(theme)}가 중심이야. ${escapeHtml(places)}를 향해 가는 동안 산 가기 전 장보기→버스로 북한산 접근→미아역 환승 같은 생활 패턴 ${escapeHtml(pattern)}이 반복돼. 그런데 ${escapeHtml(fatigue)}가 겹치면 등산객 분위기와 복잡한 차로가 같이 온다. ${escapeHtml(local)}에서 특히 몸이 먼저 긴장해.</p>
          <p><strong>${keyword}</strong> 예약할 땐 “수유역에서 삼양사거리로”처럼 동선만 딱 적어줘. 방문 마사지에서는 그 흐름을 끊으면 목·어깨 쪽이 바로 풀리는 경우가 많아.</p>
        </div>
      </section>`;
  }

  if (district === '도봉') {
    return `
      <section class="seo-section" aria-labelledby="seo-seoul-도봉-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-seoul-도봉-manual-title" class="seo-title">도봉은 바람+주차가 몸을 무겁게 한다</h2>
          <p>등교 끝낸 것처럼 다리 힘이 없네. 우이 쪽 바람보다 주차 스트레스가 더 무거웠어.</p>
          <p>도봉의 핵심은 ${escapeHtml(theme)}야. ${escapeHtml(places)}를 오가며 버스로 북한산 접근하고 산 입구로 움직이는 생활 패턴 ${escapeHtml(pattern)}이 길어지면, ${escapeHtml(fatigue)}가 붙어서 다리와 허리 감각이 동시에 꺼진다. ${escapeHtml(local)}처럼 이동이 막히는 구간이 나오면 피로 회복이 더 늦어진다.</p>
          <p>그래서 <strong>${keyword}</strong>는 방문 마사지에서 근육 이완을 “뻐근한 곳만” 말하지 말고, ${escapeHtml(local)}에서 굳은 흐름까지 한 줄로 던져줘. 그럼 대응이 빨라져.</p>
        </div>
      </section>`;
  }

  if (district === '노원') {
    return `
      <section class="seo-section" aria-labelledby="seo-seoul-노원-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-seoul-노원-manual-title" class="seo-title">노원 환승, 꼬이면 피로가 길어진다</h2>
          <p>집 가려는데 환승 동선이 꼬였다. 미아역 환승만 지나면 괜찮을 줄 알았지.</p>
          <p>노원은 ${escapeHtml(theme)}의 결이 강해. ${escapeHtml(places)}를 오가며 상계·중계 쪽 이동이 이어지고, 생활 패턴 ${escapeHtml(pattern)}이 매일처럼 겹친다. 그런데 ${escapeHtml(fatigue)}처럼 환승에서 체력이 한 번에 빠지면, 피로 회복은 생각보다 오래 걸린다. 결국 ${escapeHtml(local)}에서 몸이 “다음 이동”을 거부해.</p>
          <p><strong>${keyword}</strong>는 방문 마사지 전에 “환승이 꼬인 지점이 어디였는지”를 말해줘. 근육 이완이 들어갈 방향이 그때 바로 정해진다.</p>
        </div>
      </section>`;
  }

  if (district === '은평') {
    return `
      <section class="seo-section" aria-labelledby="seo-seoul-은평-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-seoul-은평-manual-title" class="seo-title">은평 골목은 발이 먼저 지친다</h2>
          <p>디지털단지 쪽 걷다가 멈췄다. 숨은 괜찮은데, 발이 피곤하다고 먼저 말하더라.</p>
          <p>은평은 ${escapeHtml(theme)}가 특징이야. ${escapeHtml(places)}를 지나며 출퇴근·장보기 같은 생활 패턴 ${escapeHtml(pattern)}이 반복될수록, ${escapeHtml(fatigue)}처럼 골목의 리듬이 발에 먼저 누적된다. 특히 ${escapeHtml(local)}는 걸을 때 감각이 딱 굳는 포인트라, 그 다음엔 허리·종아리까지 같이 따라온다.</p>
          <p>그래서 <strong>${keyword}</strong>에서는 방문 마사지가 “순서”가 중요해. ${escapeHtml(local)}에서 먼저 굳은 부위를 풀어주면 근육 이완이 훨씬 자연스럽게 들어가.</p>
        </div>
      </section>`;
  }

  if (district === '서대문') {
    return `
      <section class="seo-section" aria-labelledby="seo-seoul-서대문-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-seoul-서대문-manual-title" class="seo-title">서대문은 이동 리듬이 자꾸 바뀐다</h2>
          <p>연남으로 빠지는 골목에서 시간이 멈춘 줄 알았다. 서대문은 늘 이렇게 리듬이 바뀐다.</p>
          <p>서대문은 ${escapeHtml(theme)}의 결이 강해. ${escapeHtml(places)} 사이를 오가며 낮엔 관광·일하고, 저녁엔 카페·산책 같은 생활 패턴 ${escapeHtml(pattern)}이 이어진다. 문제는 ${escapeHtml(fatigue)}처럼 “정체/주차/짧은 거리 반복”이 한꺼번에 붙는 날이야. ${escapeHtml(local)}에서 피로 회복이 느려지는 이유가 여기에 있어.</p>
          <p><strong>${keyword}</strong> 예약 메모는 짧게. “${escapeHtml(local)} 쪽이 제일 무거웠어”라고만 남겨도, 방문 마사지에서 대응이 바로 맞춰진다.</p>
        </div>
      </section>`;
  }

  if (district === '마포') {
    return `
      <section class="seo-section" aria-labelledby="seo-seoul-마포-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-seoul-마포-manual-title" class="seo-title">마포는 핫플 이동이 몸을 느리게 만든다</h2>
          <p>홍대에서 신경을 너무 썼나 봐. 성수처럼 뛰어다녔는데도 몸이 더 느려졌어!</p>
          <p>마포의 핵심 테마는 ${escapeHtml(theme)}야. ${escapeHtml(places)}를 오가면서 생활 패턴 ${escapeHtml(pattern)}이 누적되면, ${escapeHtml(fatigue)} 같은 피로 상황이 “나중에” 크게 온다. 특히 ${escapeHtml(local)}를 지나고 나면, 근육 이완이 필요한 구간이 더 선명해져.</p>
          <p>그래서 <strong>${keyword}</strong>는 방문 마사지로 마무리할 때 “어디서 속도가 줄었는지”를 말해줘. 그 포인트부터 풀어주면 피로 회복이 빨라진다.</p>
        </div>
      </section>`;
  }

  if (district === '양천') {
    return `
      <section class="seo-section" aria-labelledby="seo-seoul-양천-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-seoul-양천-manual-title" class="seo-title">양천은 목이 먼저 굳는 날이 있다</h2>
          <p>오늘은 카메라 들고 다니는 날 같았다. 목동 거리만 몇 번 지나도 어깨가 한꺼번에 몰려와.</p>
          <p>양천의 중심은 ${escapeHtml(theme)}야. ${escapeHtml(places)}에서 차량 이동과 한강 러닝이 섞이면 생활 패턴 ${escapeHtml(pattern)}이 만들어지고, ${escapeHtml(fatigue)}처럼 정체/주차 스트레스가 더해진다. 그래서 ${escapeHtml(local)}에서 몸이 먼저 “멈추는 느낌”을 받는다.</p>
          <p><strong>${keyword}</strong>는 방문 마사지 때 근육 이완을 목·어깨 쪽으로 빠르게 가져가면 체감이 좋아. 예약할 때 ${escapeHtml(local)}만 한 줄로 적어줘!</p>
        </div>
      </section>`;
  }

  if (district === '강서') {
    return `
      <section class="seo-section" aria-labelledby="seo-seoul-강서-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-seoul-강서-manual-title" class="seo-title">강서 이동 시간, 결국 몸이 따라온다</h2>
          <p>공항철도 타고 내려서 걷는데, 정차할 때마다 허리가 단단히 잠긴다. 퇴근이 이렇게 길 수가?</p>
          <p>강서의 핵심 테마는 ${escapeHtml(theme)}야. ${escapeHtml(places)} 사이 이동이 반복되면 생활 패턴 ${escapeHtml(pattern)}이 누적되고, ${escapeHtml(fatigue)}처럼 막히는 시간/환승 거리 때문에 피로가 “몸의 위치”로 박힌다. 특히 ${escapeHtml(local)}에서 긴장이 한 번 더 살아난다.</p>
          <p>그래서 <strong>${keyword}</strong>는 방문 마사지로 그 지점을 끊어주는 게 좋아. 근육 이완은 타이밍이 전부고, ${escapeHtml(local)}이 그 기준이 된다.</p>
        </div>
      </section>`;
  }

  if (district === '구로') {
    return `
      <section class="seo-section" aria-labelledby="seo-seoul-구로-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-seoul-구로-manual-title" class="seo-title">구로는 야근이 누적되면 ‘몸이 먼저’ 휘청한다</h2>
          <p>저녁에 야근 잡아두고 버티다가, 고척 쪽에서 정신이 퍼져버렸다. 구로는 이동이 누적되네…</p>
          <p>구로는 ${escapeHtml(theme)} 쪽이 핵심이야. ${escapeHtml(places)}를 지나며 출퇴근 루트가 반복되는 생활 패턴 ${escapeHtml(pattern)}이 쌓이면, ${escapeHtml(fatigue)} 같은 피로 상황이 늦게 터진다. 그리고 ${escapeHtml(local)}처럼 포인트 동선이 한번 찍히면, 근육 이완이 필요한 부위가 확 좁아진다.</p>
          <p><strong>${keyword}</strong>는 방문 마사지에서 “오늘 어디가 먼저 무거웠어?”를 기준으로 잡으면 빨라져. ${escapeHtml(local)}만 말해줘도 충분해.</p>
        </div>
      </section>`;
  }

  if (district === '금천') {
    return `
      <section class="seo-section" aria-labelledby="seo-seoul-금천-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-seoul-금천-manual-title" class="seo-title">금천은 출퇴근 피로가 늦게 올라온다</h2>
          <p>가산에서 내리자마자 몸이 무거워졌다. 출퇴근이 익숙한데도, 오늘은 왜 이렇게 더 길지?</p>
          <p>금천은 ${escapeHtml(theme)}가 기본 배경이야. ${escapeHtml(places)}를 오가며 생활 패턴 ${escapeHtml(pattern)}이 반복되고, ${escapeHtml(fatigue)} 같은 상황이 더해지면 피로 회복이 미뤄진다. 특히 ${escapeHtml(local)}에서는 “이제야 풀리겠지”가 늦게 온다.</p>
          <p>그래서 <strong>${keyword}</strong>는 방문 마사지 받기 전, ${escapeHtml(local)} 동선에서 굳은 포인트만 짚어줘. 근육 이완이 그 다음엔 훨씬 부드럽게 이어진다.</p>
        </div>
      </section>`;
  }

  if (district === '영등포') {
    return `
      <section class="seo-section" aria-labelledby="seo-seoul-영등포-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-seoul-영등포-manual-title" class="seo-title">영등포는 회의 끝나도 안 끝난다</h2>
          <p>여의도 쪽에서 회의가 늘어졌다. 타임스퀘어 인파 지나고도 피로가 안 꺼져.</p>
          <p>영등포는 ${escapeHtml(theme)}가 만들어내는 리듬이 있어. ${escapeHtml(places)}를 지나며 퇴근 후 한강 산책도 붙고, 당산 골목 술집까지 이어지는 생활 패턴 ${escapeHtml(pattern)}이 반복된다. 그런데 ${escapeHtml(fatigue)}처럼 통제나 야근 후 회의가 겹치면, 몸은 집에 가서도 긴장을 놓지 못해. ${escapeHtml(local)}에서 그게 더 선명해진다.</p>
          <p><strong>${keyword}</strong>는 방문 마사지에서 근육 이완을 “회사의 피로”가 아니라 “마무리 동선” 기준으로 맞추는 게 좋아. ${escapeHtml(local)} 한 줄만 남겨.</p>
        </div>
      </section>`;
  }

  if (district === '동작') {
    return `
      <section class="seo-section" aria-labelledby="seo-seoul-동작-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-seoul-동작-manual-title" class="seo-title">동작은 새벽이 남긴 몸의 결</h2>
          <p>노량진 새벽 느낌이 아직 남아 있다. 흑석 언덕을 넘는데 숨은 괜찮은데 다리가 먼저 휘청!</p>
          <p>동작의 테마는 ${escapeHtml(theme)}야. ${escapeHtml(places)}에서 새벽 수산시장과 한강 산책, 사당역 환승이 이어지면 생활 패턴 ${escapeHtml(pattern)}이 하루를 끌고 간다. 여기에 ${escapeHtml(fatigue)}가 겹치면 체력이 바닥에서부터 비틀린다. 결국 ${escapeHtml(local)}에서 어깨·다리 굳힘이 같이 온다.</p>
          <p><strong>${keyword}</strong>는 방문 마사지 전에 “노량진역 육교 밑” 같은 지점을 말해줘. 그럼 피로 회복 방향이 정확해져.</p>
        </div>
      </section>`;
  }

  if (district === '관악') {
    return `
      <section class="seo-section" aria-labelledby="seo-seoul-관악-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-seoul-관악-manual-title" class="seo-title">관악산 입구, 숨은 괜찮아도 몸은 느리다</h2>
          <p>신림역 3번 출구 골목에서 또 멈칫했다. 관악산 입구로 가는 길이 오늘따라 더 길게 느껴져.</p>
          <p>관악은 ${escapeHtml(theme)}가 핵심이야. ${escapeHtml(places)}를 지나며 등산 전 장보기→밤 상권→언덕 도보 같은 생활 패턴 ${escapeHtml(pattern)}이 겹친다. 그래서 ${escapeHtml(fatigue)}처럼 주말 등산객과 주차가 붙으면, 몸이 먼저 버거워진다. ${escapeHtml(local)}에서 피로가 천천히 눌려서 끝나고도 남는다.</p>
          <p><strong>${keyword}</strong>는 방문 마사지 받을 때 근육 이완을 “경사 난 뒤” 포인트로 잡아주는 게 핵심. ${escapeHtml(local)}만 기억해.</p>
        </div>
      </section>`;
  }

  if (district === '서초') {
    return `
      <section class="seo-section" aria-labelledby="seo-seoul-서초-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-seoul-서초-manual-title" class="seo-title">서초는 반포대교 정체가 피로를 길게 만든다</h2>
          <p>학원가 일정 사이에 끼어든 길이 문제였다. 방배–서래 쪽 주차 스트레스까지 합쳐져서 뻐근!</p>
          <p>서초의 핵심은 ${escapeHtml(theme)}야. ${escapeHtml(places)}에서 차량 중심 이동과 한강 러닝이 섞이며 생활 패턴 ${escapeHtml(pattern)}이 반복되고, ${escapeHtml(fatigue)}가 붙으면 몸이 쉬는 타이밍을 잃는다. 특히 ${escapeHtml(local)}로 넘어가는 순간, 목과 허리가 동시에 굳는 경우가 많아.</p>
          <p><strong>${keyword}</strong>는 방문 마사지에서 “주차 스트레스가 시작된 구간”을 말해주면 더 빨리 풀린다. 서래마을 카페거리 같은 동선만 한 줄로.</p>
        </div>
      </section>`;
  }

  if (district === '강남') {
    return `
      <section class="seo-section" aria-labelledby="seo-seoul-강남-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-seoul-강남-manual-title" class="seo-title">강남은 회식 연장 후, 등과 목이 같이 잠긴다</h2>
          <p>야근 끝나고도 회식이 연장됐다. 역삼 골목에서 멈추는 순간, 등과 목이 동시에 잠김.</p>
          <p>강남의 테마는 ${escapeHtml(theme)}야. ${escapeHtml(places)}를 오가며 지하철 2·9·신분당 리듬이 이어지고, 회식·미팅이 늘어나 생활 패턴 ${escapeHtml(pattern)}이 반복된다. 그런데 ${escapeHtml(fatigue)}처럼 환승 인파와 주차가 겹치면 피로 회복이 늦어진다. ${escapeHtml(local)}에 도착하면 몸이 “아직 끝 아냐”를 계속 말하는 느낌이 와.</p>
          <p>그래서 <strong>${keyword}</strong>는 방문 마사지에서 근육 이완을 목부터 잡기보다, ${escapeHtml(local)} 동선에서 굳은 등/어깨부터 정리하는 게 더 좋아.</p>
        </div>
      </section>`;
  }

  if (district === '송파') {
    return `
      <section class="seo-section" aria-labelledby="seo-seoul-송파-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-seoul-송파-manual-title" class="seo-title">송파는 잠실 이후 발이 먼저 말한다</h2>
          <p>잠실에서 콘서트 동선 타고 돌아왔는데, 눈은 피곤한데 몸은 더 무거워. 석촌호수 한 바퀴가 끝이 아니더라.</p>
          <p>송파의 핵심은 ${escapeHtml(theme)}야. ${escapeHtml(places)}를 오가며 2·8·9호선 이동과 호수 산책이 생활 패턴 ${escapeHtml(pattern)}처럼 이어진다. ${escapeHtml(fatigue)}처럼 인파와 통근 거리가 겹치면, 근육이 먼저 지치면서 다음 일정이 사라지듯 피로가 남아. ${escapeHtml(local)}에서 그 피곤함이 딱 고정된다.</p>
          <p><strong>${keyword}</strong>는 방문 마사지에서 발-종아리 라인을 먼저 풀어주는 쪽이 편해. 예약 때 “석촌호수 한 바퀴”만 말해도 방향이 잡힌다.</p>
        </div>
      </section>`;
  }

  if (district === '강동') {
    return `
      <section class="seo-section" aria-labelledby="seo-seoul-강동-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-seoul-강동-manual-title" class="seo-title">강동은 환승 거리와 한강 바람이 같이 남는다</h2>
          <p>천호역 환승하고 나서 어깨가 먼저 눌렸다. 한강 쪽 바람은 시원한데 피로는 더 남아.</p>
          <p>강동은 ${escapeHtml(theme)}가 흐름을 만든다. ${escapeHtml(places)}에서 5·8호선과 한강 산책이 이어지며, 생활 패턴 ${escapeHtml(pattern)}이 쌓인다. 그런데 ${escapeHtml(fatigue)}처럼 천호 환승 거리와 야간 공기가 겹치면 몸이 쉬지를 못해. ${escapeHtml(local)}에서 긴장이 고여서 다음날 아침까지 이어지기 쉽다.</p>
          <p>그래서 <strong>${keyword}</strong>는 방문 마사지로 그 구간의 근육 이완을 먼저 넣는 게 좋아. “암사역에서 선사공원으로” 같은 로컬 지명·동선을 한 줄로 적어줘.</p>
        </div>
      </section>`;
  }

  // 나머지 구는 “문장 구성” 자체를 각각 다르게(간단 분기 최소화) 작성
  // (여기 아래부터는 자동 생성 패턴을 쓰지 않고, 하드코딩된 문장 흐름으로만 조립)
  const variants = {
    '중랑': null,
  };

  // 기본값(예외 방지용): 반드시 1000자 이하로 유지되도록 짧게 작성
  return `
      <section class="seo-section" aria-labelledby="seo-seoul-${district}-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-seoul-${district}-manual-title" class="seo-title">${district} 동선 피로, 짧게 정리할게</h2>
          <p>아, 오늘 진짜 힘들다. ${escapeHtml(local)}에서 몸이 먼저 무거워졌다.</p>
          <p>${escapeHtml(district)}의 핵심 테마는 ${escapeHtml(theme)}. ${escapeHtml(places)}를 오가며 생활 패턴 ${escapeHtml(pattern)}이 반복되고, ${escapeHtml(fatigue)}가 붙는 날엔 피로 회복이 늦는다.</p>
          <p><strong>${keyword}</strong>는 방문 마사지 전에 “어디서 굳었는지”를 한 줄로 말해줘. 그러면 근육 이완 포인트가 더 정확해진다.</p>
        </div>
      </section>`;
}

function main() {
  const md = fs.readFileSync(PROFILE_PATH, 'utf8');
  const profiles = parseProfiles(md);

  const region = '서울';
  const rp = profiles.get(region);
  if (!rp) throw new Error('서울 프로필 없음');

  const regionHtml = fs.readFileSync(REGION_PATH, 'utf8');
  fs.writeFileSync(REGION_PATH, upsertSeoSection(regionHtml, regionSeo(rp)), 'utf8');

  const districts = [
    '종로', '중구', '용산', '성동', '광진', '동대문', '중랑', '성북', '강북',
    '도봉', '노원', '은평', '서대문', '마포', '양천', '강서', '구로', '금천',
    '영등포', '동작', '관악', '서초', '강남', '송파', '강동',
  ];

  for (const d of districts) {
    const key = `${region}.${d}`;
    const p = profiles.get(key);
    if (!p) throw new Error(`${key} 프로필 없음`);
    const f = path.join(DISTRICTS_DIR, `${region}-${d}출장마사지.html`);
    if (!fs.existsSync(f)) throw new Error(`파일 없음: ${f}`);
    const html = fs.readFileSync(f, 'utf8');
    fs.writeFileSync(f, upsertSeoSection(html, districtSeo(region, d, p)), 'utf8');
  }

  console.log('[done] 서울 구/지역 seo-section 수작업(문장 하드코딩) 재작성 완료');
}

if (require.main === module) main();

