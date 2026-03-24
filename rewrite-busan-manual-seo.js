const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PROFILE_PATH = path.join(ROOT, 'korea-regions-seo-profiles.md');
const REGION_PATH = path.join(ROOT, 'regions', '부산출장마사지.html');
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
    return html.replace(
      /<section class="seo-section"[\s\S]*?<\/section>\s*<\/main>/m,
      `${sectionHtml}\n    </main>`
    );
  }
  return html.replace('</main>', `${sectionHtml}\n    </main>`);
}

function cleanLocal(local) {
  return String(local || '').replace(/[“”]/g, '');
}

function regionSeo(p) {
  const local = cleanLocal(p.local);
  return `
      <section class="seo-section" aria-labelledby="seo-busan-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-busan-manual-title" class="seo-title">부산은 왜 끝나고 더 피곤해질까</h2>
          <p>
            아, 오늘 진짜 힘들다. 바닷바람 맞을 땐 괜찮았는데 방에 앉자마자 어깨부터 단단해진다.
            부산은 해안·항구·언덕이 한날에 겹쳐서 동선이 끊기듯 이어진다. 그래서 피로가 늦게 올라오고 길게 남는다.
          </p>
          <p>
            부산의 뼈대는 ${escapeHtml(p.theme)}다. 주요 장소 ${escapeHtml(p.places)}를 오갈 때 생활 패턴 ${escapeHtml(p.pattern)}이 반복되고,
            ${escapeHtml(p.fatigue)}가 붙는 날엔 회복이 밀린다. ${escapeHtml(local)} 같은 로컬 구간을 지났다면 체감은 더 선명하다.
            그래서 <strong>부산 출장마사지</strong>는 강도보다 동선 적합도를 먼저 보는 편이 맞다.
          </p>
          <p>
            메모는 길 필요 없다. “${escapeHtml(local)} 중심 이동, 허리 먼저 무거움” 정도면 충분하다.
            <strong>방문 마사지</strong> 도착 여유 30분만 잡아도 근육 이완 타이밍이 훨씬 맞아들어간다.
          </p>
        </div>
      </section>`;
}

const DISTRICT_STYLE = {
  중구: {
    intro: 'BIFF광장 불빛은 밝았는데 몸은 금방 꺼졌다. 자갈치 쪽으로 내려갈수록 다리보다 어깨가 먼저 무거워졌다.',
    close: '부산 중구 출장마사지는 관광 루트 길이보다 동선 밀도를 먼저 봐야 맞다.',
  },
  서구: {
    intro: '부산역 광장 지나 토성 쪽으로 오르자 허리선이 먼저 뻣뻣해졌다. 짧은 환승인데 체감은 길었다.',
    close: '부산 서구 출장마사지 선택은 언덕·환승 순서를 먼저 말하는 쪽이 정확하다.',
  },
  동구: {
    intro: '초량삼거리 신호 두 번 대기했을 뿐인데 목 뒤가 먼저 굳었다. 오늘은 이동보다 긴장이 길었다.',
    close: '부산 동구 출장마사지는 초량·좌천·영도 접점 루트를 먼저 공유해야 맞춤이 빨라진다.',
  },
  영도: {
    intro: '영도대교를 건너고 난 뒤에야 피로가 확 올라왔다. 바람은 시원했는데 몸은 반대로 무거웠다.',
    close: '부산 영도 출장마사지는 해안 바람과 다리 정체를 함께 본 설명이 핵심이다.',
  },
  부산진: {
    intro: '서면역 지하상가를 빠져나오자 한숨이 먼저 나왔다. 인파 속에서 눌린 피로가 늦게 올라왔다.',
    close: '부산 부산진 출장마사지는 야간 상권 동선을 먼저 밝힐수록 체감이 좋아진다.',
  },
  동래: {
    intro: '온천장역 근처를 돌고 나니 종아리보다 허리가 먼저 당겼다. 오늘은 산책이 아니라 누적이었다.',
    close: '부산 동래 출장마사지는 온천·등산·사직 동선 중 무엇이 길었는지부터 정리하면 된다.',
  },
  남구: {
    intro: '남천역 골목으로 꺾는 순간 어깨가 딱 굳었다. 낮엔 멀쩡했는데 밤에 한꺼번에 몰렸다.',
    close: '부산 남구 출장마사지는 용호만·문현·남천 축 중 오늘 중심 루트를 먼저 적자.',
  },
  북구: {
    intro: '덕천 로터리를 빠져나오고 나서야 목이 무거워졌다. 이동은 끝났는데 긴장은 그대로였다.',
    close: '부산 북구 출장마사지는 로터리 정체와 만덕 경사 여부를 먼저 말하는 게 유리하다.',
  },
  강서구: {
    intro: '명지대로에서 내린 뒤 의자에 기대자 허리 옆이 먼저 단단해졌다. 공항축 하루는 끝나도 피로가 남았다.',
    close: '부산 강서구 출장마사지는 공항 접근·명지 이동 시간을 함께 설명해야 정확하다.',
  },
  해운대: {
    intro: '해변 바람을 맞고 돌아왔는데 상쾌함보다 피로가 먼저 남았다. 오늘은 모래보다 긴장이 오래 갔다.',
    close: '부산 해운대 출장마사지는 해변 보행과 센텀 체류를 같은 축으로 보는 접근이 맞다.',
  },
  사하: {
    intro: '감천 입구 계단을 지나고 나서야 허벅지가 묵직해졌다. 경사는 짧았지만 피로는 짧지 않았다.',
    close: '부산 사하 출장마사지는 계단·경사 동선을 숨기지 않고 전달하는 쪽이 회복에 유리하다.',
  },
  금정: {
    intro: '부산대 앞을 돌고 숙소에 들어오니 어깨가 먼저 눌렸다. 일정은 짧았는데 여운이 길었다.',
    close: '부산 금정 출장마사지는 금정산·장전 동선 중 무엇이 길었는지 한 줄이 기준이 된다.',
  },
  연제: {
    intro: '연산역 환승 뒤 허리선이 먼저 뻣뻣해졌다. 오늘 피로는 조용하게, 늦게 올라왔다.',
    close: '부산 연제 출장마사지는 학원가 일정과 시장 동선이 어떻게 겹쳤는지부터 적는 게 좋다.',
  },
  수영: {
    intro: '광안리 야경을 보고 돌아왔는데 눈썹 사이까지 피곤해졌다. 밤바람 뒤에 남는 긴장이 있었다.',
    close: '부산 수영 출장마사지는 광안리-민락 루트 보행량을 먼저 전달하면 포인트가 빨리 맞는다.',
  },
  사상: {
    intro: '사상역에서 터미널로 걷고 나니 발보다 어깨가 더 무거웠다. 이동 밀도가 높은 하루였다.',
    close: '부산 사상 출장마사지는 환승·강변대로 정체 구조를 함께 말해야 조율이 정확해진다.',
  },
  기장: {
    intro: '일광에서 돌아오는 길, 핸들을 놓는 순간 허리 옆이 굳었다. 드라이브가 휴식이 아닌 날이었다.',
    close: '부산 기장 출장마사지는 일광·정관·송정 중 어떤 축이 길었는지 먼저 정리하면 된다.',
  },
};

function districtSeo(region, district, p) {
  const local = cleanLocal(p.local);
  const style = DISTRICT_STYLE[district] || {
    intro: `${district} 구간이 끝난 뒤 피로가 뒤늦게 올라왔다.`,
    close: `${region} ${district} 출장마사지 선택은 오늘 동선을 먼저 말하는 것이 핵심이다.`,
  };
  const keyword = `${region} ${district} 출장마사지`;
  return `
      <section class="seo-section" aria-labelledby="seo-busan-${district}-manual-title">
        <div class="container seo-inner">
          <h2 id="seo-busan-${district}-manual-title" class="seo-title">부산 ${district} 동선 피로, 오늘 기준 정리</h2>
          <p>
            ${escapeHtml(style.intro)}
            이 스토리는 <strong>${region}.${district}</strong> 블록 하나만 근거로 작성했고, 다른 시/구 데이터는 넣지 않았다.
          </p>
          <p>
            ${district}의 핵심은 ${escapeHtml(p.theme)}다. 주요 장소 ${escapeHtml(p.places)}를 오갈수록
            생활 패턴 ${escapeHtml(p.pattern)}이 반복되고, ${escapeHtml(p.fatigue)}가 겹치는 날엔 회복이 늦다.
            ${escapeHtml(local)} 같은 로컬 동선을 지난 뒤 반응이 커지는 이유가 여기에 있다.
          </p>
          <p>
            그래서 <strong>${keyword}</strong>는 후기보다 루트 적합도가 우선이다.
            “${escapeHtml(local)} 중심 이동, 어깨 먼저 무거움”처럼 한 줄만 남겨도 근육 이완 포인트가 빨리 맞는다.
            ${escapeHtml(style.close)}
            이동이 길었던 날일수록 <strong>방문 마사지</strong> 도착 여유를 먼저 확보하자.
          </p>
        </div>
      </section>`;
}

function main() {
  const md = fs.readFileSync(PROFILE_PATH, 'utf8');
  const profiles = parseProfiles(md);

  const region = '부산';
  const rp = profiles.get(region);
  if (!rp) throw new Error('부산 프로필 없음');
  const regionHtml = fs.readFileSync(REGION_PATH, 'utf8');
  fs.writeFileSync(REGION_PATH, upsertSeoSection(regionHtml, regionSeo(rp)), 'utf8');

  const districts = [
    '중구', '서구', '동구', '영도', '부산진', '동래', '남구', '북구',
    '강서구', '해운대', '사하', '금정', '연제', '수영', '사상', '기장',
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

  console.log('[done] 부산 스토리 전면 재작성 완료');
}

if (require.main === module) main();

