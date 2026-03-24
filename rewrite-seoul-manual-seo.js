const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PROFILE_PATH = path.join(ROOT, 'korea-regions-seo-profiles.md');
const REGION_PATH = path.join(ROOT, 'regions', '서울출장마사지.html');
const DISTRICTS_DIR = path.join(ROOT, 'districts');

const SEO_TITLE_REGION = '서울, 하루 끝나고 왜 더 뻐근해질까';

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
    return html.replace(
      /<section class="seo-section"[\s\S]*?<\/section>\s*<\/main>/m,
      `${sectionHtml}\n    </main>`
    );
  }
  return html.replace('</main>', `${sectionHtml}\n    </main>`);
}

function cleanLocal(local) {
  // 프로필 내 인용부호(“ ”) 때문에 HTML에서 가독성 떨어지는 케이스가 있어 정리
  return String(local || '').replace(/[“”]/g, '');
}

const DISTRICT_INTRO = {
  종로: '아, 오늘 진짜 힘들다. 경복궁 앞 바람이 뺨을 치는데, 걸음이 자꾸 느려진다.',
  중구: '퇴근길인데도 몸이 먼저 지친다. 명동 불빛 보고 한 번 웃었는데 어깨가 바로 무거워졌다!',
  용산: '오늘은 이동이 많았다. 한강진역에서 내려 걷는데 숨이 먼저 차더라…',
  성동: '왕십리 환승만 몇 번 했을 뿐인데, 허리 옆이 먼저 당긴다. 오늘 왜 이래?',
  광진: '강변 쪽으로 걸어가다 멈칫했다. 건대 소음이 귀에 남아, 다리가 뒤늦게 무너져.',
  동대문: '시장 골목 들어간 순간, 겨울 바람이 꽉 끼었다. 가만히 서도 목이 뻣뻣해지더라.',
  중랑: '중랑천 걷고 나왔는데 왜 이렇게 피곤하지? 상봉 환승 거리에서 이미 힘이 다 달아났다.',
  성북: '언덕 오르는데 심장이 먼저 뛰고, 종아리는 따라가질 못한다. 돈암에서 정릉까지가 길었어.',
  강북: '수유리 먹자골목 나왔다가, 또 방향을 바꿨다. 우이동 입구 바람 때문에 온몸이 굳어버림!',
  도봉: '등교 끝낸 것처럼 다리 힘이 없네. 우이 쪽 바람보다, 주차 스트레스가 더 무거웠어.',
  노원: '집 가려는데 환승 동선이 꼬였다. 미아역 환승만 지나면 괜찮을 줄 알았지.',
  은평: '디지털단지 쪽 걷다가 멈췄다. 숨은 괜찮은데, 발이 피곤하다고 먼저 말하더라.',
  서대문: '연남으로 빠지는 골목에서 시간이 멈춘 줄 알았다. 서대문은 늘 이렇게 리듬이 바뀐다.',
  마포: '홍대에서 신경을 너무 썼나 봐. 성수처럼 뛰어다녔는데도 몸이 더 느려졌어!',
  양천: '오늘은 카메라 들고 다니는 날 같았다. 목동 거리만 몇 번 지나도 어깨가 한꺼번에 몰려와.',
  강서: '공항철도 타고 내려서 걷는데, 정차할 때마다 허리가 단단히 잠긴다. 퇴근이 이렇게 길 수가?',
  구로: '저녁에 야근 잡아두고 버티다가, 고척 쪽에서 정신이 퍼져버렸다. 구로는 이동이 누적되네…',
  금천: '가산에서 내리자마자 몸이 무거워졌다. 출퇴근이 익숙한데도, 오늘은 왜 이렇게 더 길지?',
  영등포: '여의도 쪽에서 회의가 늘어졌다. 타임스퀘어 인파 지나고도 피로가 안 꺼져.',
  동작: '노량진 새벽 느낌이 아직 남아 있다. 흑석 언덕을 넘는데 숨은 괜찮은데 다리가 먼저 휘청!',
  관악: '신림역 3번 출구 골목에서 또 멈칫했다. 관악산 입구로 가는 길이 오늘따라 더 길게 느껴져.',
  서초: '학원가 일정 사이에 끼어든 길이 문제였다. 방배–서래 쪽 주차 스트레스까지 합쳐져서 뻐근!',
  강남: '야근 끝나고도 회식이 연장됐다. 역삼 골목에서 멈추는 순간, 등과 목이 동시에 잠김.',
  송파: '잠실에서 콘서트 동선 타고 돌아왔는데, 눈이 피곤한데 몸은 더 무거워. 석촌호수 한 바퀴가 끝이 아니더라.',
  강동: '천호역 환승하고 나서 어깨가 먼저 눌렸다. 한강 쪽 바람은 시원한데 피로는 더 남아.',
};

const DISTRICT_CLOSE = {
  종로: '종로 출장마사지는 “어느 쪽이 더 뻣뻣했는지”부터 잡아야 회복이 빨라져.',
  중구: '중구는 관광 동선보다 야간 밀도에 맞추면 피로 회복이 확 달라진다.',
  용산: '용산 출장마사지는 한강진–이태원 쪽 이동 감각을 말해주면 근육 이완 타이밍이 맞아.',
  성동: '성동은 성수–뚝섬 리듬이 몸에 남는다. 오늘은 그 흐름을 그대로 풀어주자.',
  광진: '광진 출장마사지는 대학가 소음이 남는 날, 깊은 긴장부터 정리해두는 게 이득!',
  동대문: '동대문은 시장 골목 정체가 포인트다. 지나온 길 그대로 전달하면 방문 마사지가 더 정확해.',
  중랑: '중랑은 환승 거리와 중랑천 걷기가 겹친 날이 문제야. 마무리는 어깨가 아니라 발부터.',
  성북: '성북 출장마사지는 언덕 구간에서 굳은 감각을 풀어야 다음 날이 가벼워져.',
  강북: '강북은 주말 등산객 분위기와 복잡한 차로가 같이 온다. 숨 먼저가 아니라 근육부터.',
  도봉: '도봉은 바람과 경사, 그리고 주차 스트레스가 합쳐진다. 오늘은 풀어주는 게 정답!',
  노원: '노원 출장마사지는 환승 루트가 꼬인 날, 체감이 길게 남는다. 먼저 긴장 흐름만 맞추자.',
  은평: '은평 출장마사지는 골목의 리듬이 발로 먼저 들어온다. 한 줄 메모가 효과를 키워.',
  서대문: '서대문 출장마사지는 이동 패턴이 자꾸 바뀌는 날, 피로 상황을 짧게 정리하면 좋아.',
  마포: '마포는 핫플 사이 이동이 반복되면 몸이 느려진다. 오늘은 근육 이완 포인트를 정확히!',
  양천: '양천 출장마사지는 목동-방아 동선이 길어질수록 어깨가 먼저 묵직해진다. 그 결만 풀자.',
  강서: '강서는 이동시간이 피로로 바뀌는 구간이다. “어디서 느려졌는지” 말하면 회복이 빨라.',
  구로: '구로는 가산·독산 쪽 누적이 몸에 남는다. 오늘은 생활 패턴부터 정리하면 편해져.',
  금천: '금천 출장마사지는 출퇴근 피로가 늦게 터지는 날이 많다. 로컬 동선 먼저 맞춰줘!',
  영등포: '영등포는 회의와 인파가 겹칠 때 몸이 잠긴다. 방문 마사지로 긴장부터 풀어야 돼.',
  동작: '동작은 노량진-흑석 흐름에서 어깨와 다리가 같이 굳는다. 숨어 있던 피로가 풀린다.',
  관악: '관악 출장마사지는 신림–낙성대 쪽 경사가 남은 날, 한 번에 정리해주면 다음이 편해.',
  서초: '서초는 반포대교 퇴근 정체 때문에 피로가 길어진다. 오늘은 한강 쪽 감각을 풀어보자.',
  강남: '강남 출장마사지는 회식 연장 후 역삼 골목 리듬이 몸에 박힌다. 마지막은 근육 이완으로.',
  송파: '송파 출장마사지는 잠실 인파가 끝나도 발이 먼저 말한다. 석촌호수 흐름대로만 풀면 돼!',
  강동: '강동은 천호 환승 거리와 한강 바람이 같이 남는다. 오늘은 긴장을 줄여 피로 회복하자.',
};

function buildDistrictSection(region, district, p, idx) {
  const theme = p.theme;
  const places = p.places;
  const pattern = p.pattern;
  const fatigue = p.fatigue;
  const local = cleanLocal(p.local);

  const keyword = `${region} ${district} 출장마사지`;
  const intro = DISTRICT_INTRO[district] || `아, 오늘 진짜 힘들다. ${district} 동선에서 몸이 먼저 무거워졌다.`;
  const close = DISTRICT_CLOSE[district] || `${district} 출장마사지는 오늘 루트를 말해주면 회복이 빨라진다.`;

  // 문장/순서를 매 페이지 다르게 가져가도록 레이아웃을 늘려둠
  const layout = idx % 6;
  let mid = '';

  if (layout === 0) {
    mid = `핵심 테마는 ${theme} 쪽이야. ${places}를 오갈 때 생활 패턴 ${pattern}이 반복되고, ${fatigue}가 겹치면 피로가 더 늦게 올라온다. 그래서 “${local}” 같은 로컬 지명·동선을 한 줄로 남기면, 방문 마사지가 도착하자마자 반응이 달라져. 오늘은 “어디가 제일 먼저 굳었는지”만 기억해도 충분해.`;
  } else if (layout === 1) {
    mid = `오늘은 ${local}에서 몸이 먼저 굳었지. ${fatigue}처럼 이미 긴장이 올라온 상태라서, ${places}를 더 돌면 오히려 감각이 잠긴다. 결국 ${theme}이 만들어낸 리듬 위에 ${pattern}이 얹히는 날, 근육 이완 타이밍이 중요해진다. 그래서 피로 회복은 “늦게 풀기”보다 “먼저 풀기” 쪽이 편해.`;
  } else if (layout === 2) {
    mid = `피로 상황은 ${fatigue} 쪽이 가장 먼저 티 난다. ${places} 이동 중에 ${pattern}이 반복되면서, 몸은 “오늘은 여기서 끝”을 못 내린다. 그래서 핵심 테마 ${theme}를 기준으로, 로컬 지명·동선 ${local}을 말해주면 서울 출장마사지 중에서도 ${keyword}가 딱 맞게 잡혀. 특히 발/목/허리 중 어디가 먼저 고장 났는지 한 단어로만 던져줘!`;
  } else if (layout === 3) {
    mid = `먼저 ${places}를 지나면서 생활 패턴 ${pattern}이 몸에 찍힌다. 그 다음에 ${fatigue}가 겹치고, 긴장은 그대로 ${theme}의 결로 이어진다. ${local}처럼 로컬 동선을 덧붙여 전달하면, 피로 회복이 느린 날에도 움직임이 가벼워져. 오늘은 장문 설명보다 “동선+부위”가 더 빠르다.`;
  } else if (layout === 4) {
    mid = `${pattern}을 타고 ${places}를 오가다 보면, 어느 순간 ${fatigue}가 딱 걸린다. 그 순간 몸이 반응하는 방향이 ${theme}거든. ${local}처럼 “어디서부터”를 짚어주면, ${keyword}는 강도보다 흐름에 맞춰 근육 이완을 빠르게 해준다. 긴장은 한 번만 풀어도 다음 이동이 가벼워져.`;
  } else {
    mid = `${theme}가 강하게 남는 날엔 이동이 그냥 이동이 아니라 스트레스가 된다. ${places} 사이에서 반복되는 ${pattern}이 쌓이고, ${fatigue}가 뒤늦게 올라오면 목이든 허리든 먼저 뻣뻣해져. 그래서 ${local} 같은 로컬 지명·동선 한 줄이 진짜 도움이 된다. 끝나고 나면 “아, 오늘은 잘 풀렸다” 느낌이 오더라.`;
  }

  let extra = '';
  if (layout === 0) {
    extra = `예약할 땐 길게 설명하지 말고, “${local}에서 시작해서 ${places}로 넘어가는 동안 ${fatigue}가 쌓였어요” 정도만 말해줘. 생활 패턴 ${pattern}이 반복되는 날은 근육 이완이 늦어질 수 있거든. 그래서 방문 마사지에서는 피로 회복이 먼저 오는 쪽(뻣뻣한 구간 우선)이 체감이 좋아. ${keyword}는 동선이 맞는 순간부터 몸이 풀리기 시작해!`;
  } else if (layout === 1) {
    extra = `오늘처럼 ${fatigue}가 이미 올라와 있으면, 서울 ${district} 출장마사지에서 “도착 후 10분”이 진짜 중요해. ${theme} 아래에서 생활 패턴 ${pattern}이 돌고 돌면, 감각이 둔해지면서 통증이 늦게 나타나거든. 그래서 ${local} 같은 로컬 지명·동선 한 줄로 먼저 방향을 잡아. 그러면 근육 이완이 필요한 부위를 빨리 맞춰 피로 회복이 빨라져.`;
  } else if (layout === 2) {
    extra = `서울 출장마사지 예약 메시지는 계산처럼 딱 한 줄이면 된다. “${local} 쪽 동선에서 ${fatigue}가 먼저 왔고, ${places} 이동 중에 굳었어요”처럼 말해봐. 생활 패턴 ${pattern}이 겹치는 날엔 같은 부위만 반복해서 뭉치니까, 방문 마사지 전에 몸이 어디서 굳는지 먼저 정리하면 좋아. 핵심 테마 ${theme}에 맞춘 풀림이 들어가면, 근육 이완이 확실해져.`;
  } else if (layout === 3) {
    extra = `${places}를 지나며 몸에 찍힌 생활 패턴 ${pattern}은, 마사지 받고 나서도 다음 날까지 흔적처럼 남는다. 그래서 ${keyword}를 받을 땐 “오늘 ${fatigue}가 언제 제일 심해졌는지”를 먼저 짚어줘. ${local}에서 출발한 흐름을 전달하면 피로 회복이 더 빠르게 이어진다. 결국 근육 이완은 강도보다 타이밍이고, 타이밍은 동선에서 나온다.`;
  } else if (layout === 4) {
    extra = `팁은 단순해. ${local}에서 굳은 감각을 떠올리고, ${fatigue}가 걸린 순간을 기준으로 ${keyword}에 맞추면 돼. ${pattern}이 반복되는 길( ${places} )은 몸이 알아서 긴장을 키우거든. 그래서 방문 마사지에서는 먼저 그 흐름을 끊어줘야 피로 회복이 쉬워져. 근육 이완은 “이제 풀어도 되겠다” 하는 순간에 가장 잘 들어간다.`;
  } else {
    extra = `오늘은 “이동 후 정리”가 아니라 “이동 중 굳는 지점”을 푸는 날이야. ${theme}가 강하게 남는 구간에서 ${places} 사이 생활 패턴 ${pattern}이 계속 겹치니까 ${fatigue}가 늦게 터진다. 그래서 ${local}을 한 줄로 던져주면, ${keyword}는 흐름에 맞춰 근육 이완을 먼저 넣어준다. 그러면 피로 회복이 밤새도록 이어져.`;
  }

  return `
      <section class="seo-section" aria-labelledby="seo-seoul-${district}-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-seoul-${district}-manual-title" class="seo-title">${region} ${district} 출장마사지, 오늘 기준 정리</h2>
          <p>
            ${escapeHtml(intro)}
            이 글은 <strong>${region}.${district}</strong> 블록 1개만 근거로 썼고, 다른 시/구 데이터는 섞지 않았다.
          </p>
          <p>${escapeHtml(mid)}</p>
          <p>${escapeHtml(extra)}</p>
          <p>
            그래서 ${escapeHtml(keyword)}는 “방문 마사지 도착 시간”보다 ${local.includes('쪽') ? '동선이 굳는 지점' : '피로가 달라붙는 지점'}을 먼저 말하는 게 핵심이야.
            ${escapeHtml(close)}
          </p>
        </div>
      </section>`;
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
          <h2 id="seo-seoul-region-manual-title" class="seo-title">${SEO_TITLE_REGION}</h2>
          <p>
            아, 오늘 진짜 힘들다. 서울은 하루를 끝냈는데도 몸이 계속 “다음 역”을 찾는다.
            출근 2·9호선 압박 같은 분위기 위에 회식·환승이 겹치면, 피로가 그냥 피로가 아니라 길어져.
          </p>
          <p>
            서울 전체 핵심은 ${theme} 쪽이야. 주요 장소 ${places}에서 생활 패턴 ${pattern}이 반복되면,
            ${fatigue} 같은 상황이 누적되고, ${local}에서 느린 긴장이 확 올라온다.
            그래서 <strong>서울 출장마사지</strong>는 동선 적합도를 먼저 맞추는 쪽이 편해.
          </p>
          <p>
            예약할 때는 길게 말 필요 없어. “${local}에서 굳었고, 이동하는 동안 ${fatigue}가 계속 붙었어요” 정도면 충분해.
            그러면 방문 마사지에서 피로 회복과 근육 이완 타이밍이 빨라진다. 오늘처럼 계속 환승이 이어진 날엔 더더욱!
          </p>
          <p>
            한 줄이면 충분해. “${local}에서 굳었고, 오늘은 허리/목이 먼저 뻣뻣” 같은 메모만 남기면,
            피로 회복이 빨라진다. 마지막엔 근육 이완까지 챙기자!
          </p>
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

  districts.forEach((d, idx) => {
    const key = `${region}.${d}`;
    const p = profiles.get(key);
    if (!p) throw new Error(`${key} 프로필 없음`);
    const f = path.join(DISTRICTS_DIR, `${region}-${d}출장마사지.html`);
    if (!fs.existsSync(f)) throw new Error(`파일 없음: ${f}`);
    const html = fs.readFileSync(f, 'utf8');
    fs.writeFileSync(f, upsertSeoSection(html, buildDistrictSection(region, d, p, idx)), 'utf8');
  });

  console.log('[done] 서울 지역+구 수작업 톤 스토리 전면 재작성 완료');
}

if (require.main === module) main();

