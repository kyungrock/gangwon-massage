#!/usr/bin/env python3
"""
뉴스·이슈 RSS(구글 뉴스 검색)를 가져온 뒤, 항목별로 가능한 경우 본문 일부를 받아
시·군·구(및 선택 동) 단위로 출장마사지 이용 관점 글로 재작성하고 일자로그 HTML을 갱신합니다.

사용 (프로젝트 루트에서):
  python seo_news_bulk_log.py
  python seo_news_bulk_log.py --date 2026-05-01 --region 경기
  python seo_news_bulk_log.py --dry-run --max-areas 5
  python seo_news_bulk_log.py --mock   # 네트워크 없이 테스트
  python seo_news_bulk_log.py --openai --articles 3   # API로 문단 재작성(권장)

더블클릭 실행: run_seo_news_log.bat

주의: 외부 뉴스는 참고만 하고 원문 전재는 하지 않습니다. 본문 크롤은 사이트별로 실패할 수 있습니다.
OPENAI_API_KEY 가 있으면 --openai 시 단락 단위 재작성 품질이 올라갑니다.

일괄 생성이 끝나면( dry-run 아님 ) 기본으로 `generate-sitemap.js` → 시·구·지역 페이지 동기화
(`build-all-district-pages.js`, `build-region-pages.js`) 를 실행합니다.
생략: --skip-sitemap, --skip-district-sync / Node 없으면 안내만 합니다.
"""

from __future__ import annotations

import argparse
import html as html_lib
import json
import os
import random
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from datetime import date
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

# 프로젝트 루트를 cwd 로 고정
SITE_ROOT = Path(__file__).resolve().parent
os.chdir(SITE_ROOT)

from seo_log_generator import (  # noqa: E402
    OUTPUT_ROOT,
    AreaConfig,
    SpinArticle,
    build_root_hub_html,
    generate_area,
    keyword as seo_keyword,
    write_file,
    html_shell,
    absolute_url,
)

KOREA_REGIONS_FILE = SITE_ROOT / "korea-regions.json"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


def load_regions() -> List[Dict[str, Any]]:
    raw = KOREA_REGIONS_FILE.read_text(encoding="utf-8")
    data = json.loads(raw)
    return list(data.get("regions") or [])


def load_optional_dongs(path: Optional[Path]) -> Dict[str, Dict[str, List[str]]]:
    """{ '서울': { '강남': ['역삼동', ...] }, ... } (루트 `_` 접두 키는 메타로 무시)"""
    if not path or not path.exists():
        return {}
    raw = path.read_text(encoding="utf-8")
    data = json.loads(raw)
    if not isinstance(data, dict):
        return {}
    out: Dict[str, Dict[str, List[str]]] = {}
    for k, v in data.items():
        if not isinstance(k, str) or k.startswith("_"):
            continue
        if not isinstance(v, dict):
            continue
        inner: Dict[str, List[str]] = {}
        for dk, lst in v.items():
            if isinstance(lst, list):
                inner[str(dk)] = [str(x).strip() for x in lst if str(x).strip()]
        if inner:
            out[k] = inner
    return out


def strip_html(text: str) -> str:
    t = re.sub(r"<[^>]+>", " ", text or "")
    t = html_lib.unescape(t)
    return re.sub(r"\s+", " ", t).strip()


def fetch_google_news_titles(query: str, limit: int = 5, timeout: float = 20.0) -> List[Dict[str, str]]:
    from urllib.parse import quote

    q = quote(query)
    url = f"https://news.google.com/rss/search?q={q}&hl=ko&gl=KR&ceid=KR:ko"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        body = resp.read()
    root = ET.fromstring(body)
    out: List[Dict[str, str]] = []
    for item in root.findall(".//item"):
        title_el = item.find("title")
        link_el = item.find("link")
        pub_el = item.find("pubDate")
        title = strip_html(title_el.text if title_el is not None else "") if title_el is not None else ""
        link = (link_el.text or "").strip() if link_el is not None else ""
        pub = (pub_el.text or "").strip() if pub_el is not None else ""
        if title:
            out.append({"title": title, "link": link, "pubDate": pub})
        if len(out) >= limit:
            break
    return out


def mock_news_items(seed: str, n: int = 3) -> List[Dict[str, str]]:
    rnd = random.Random(seed)
    samples = [
        "지역 교통·행사 안내가 이슈로 정리되고 있습니다.",
        "생활권 편의·안전 관련 소식이 검색 결과에 포함되었습니다.",
        "날씨·미세먼지 등 생활 정보가 함께 언급되는 흐름입니다.",
    ]
    return [{"title": f"[모의] {seed} — {samples[i % len(samples)]}", "link": "", "pubDate": ""} for i in range(n)]


ARTICLE_FETCH_TIMEOUT = 22.0
ARTICLE_BODY_DELAY = 0.45


def fetch_url_body(url: str, timeout: float = ARTICLE_FETCH_TIMEOUT) -> Tuple[str, str]:
    if not url or not url.startswith(("http://", "https://")):
        raise ValueError("invalid url")
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        final_url = resp.geturl()
        raw = resp.read()
        charset = "utf-8"
        ctype = resp.headers.get("Content-Type") or ""
        mm = re.search(r"charset=([\w\-]+)", ctype, re.I)
        if mm:
            charset = mm.group(1).strip().strip('"').strip("'")
        try:
            html = raw.decode(charset)
        except (LookupError, UnicodeDecodeError, ValueError):
            html = raw.decode("utf-8", errors="replace")
    return final_url, html


def extract_readable_excerpt(html: str, max_chars: int = 1600) -> str:
    t = re.sub(r"(?is)<script[^>]*>.*?</script>", " ", html)
    t = re.sub(r"(?is)<style[^>]*>.*?</style>", " ", t)
    t = re.sub(r"(?is)<noscript[^>]*>.*?</noscript>", " ", t)
    chunks: List[str] = []
    for mm in re.finditer(r"<p[^>]*>(.*?)</p>", t, flags=re.I | re.S):
        inner = strip_html(mm.group(1))
        inner = inner.strip()
        if len(inner) >= 14:
            chunks.append(inner)
    text = " ".join(chunks).strip()
    if len(text) < 100:
        text = strip_html(re.sub(r"(?s)<[^>]+>", " ", t))
        text = re.sub(r"\s+", " ", text).strip()
    return text[:max_chars]


def openai_rewrite_massage_article(
    area_label: str, svc_kw: str, headline: str, excerpt: str
) -> List[str]:
    key = os.environ.get("OPENAI_API_KEY", "").strip()
    h = strip_html(headline)[:260]
    ex = strip_html(excerpt)[:1400]
    if not key or len(h) < 8:
        return []

    guidance = (
        f"대상 지역 레이블: {area_label}\n"
        f"연관 서비스 키워드 예시: {svc_kw}\n"
        "원문 또는 제목 문자열은 직접 인용 금지(필요 시 한 번만 아주 짧게 언급).\n"
        f"참고 제목: {h}\n"
        f"참고 요지(발췌): {ex}\n"
        "단락 정확히 3개. 각 단락 2~4문장."
        " 역할: 지역 사용자에게 출장마사지 이용 시 예약·이동·피로·휴식 관점 조언만."
        " 의료 치료·효능 확정 표현 금지, 과장·불법 유도 금지."
        " 출력: 단락 사이에는 빈 줄 하나만 두고 다른 제목 기호 출력 금지."
    )

    payload = json.dumps(
        {
            "model": os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
            "messages": [
                {"role": "system", "content": "한국어만 사용. 사용자 지시 준수."},
                {"role": "user", "content": guidance},
            ],
            "max_tokens": 700,
            "temperature": 0.55,
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=payload,
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=55) as r:
            data = json.loads(r.read().decode("utf-8"))
        raw = (
            data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
        )
    except Exception:
        return []

    parts = [p.strip() for p in re.split(r"\n\s*\n+", raw) if p.strip()]
    if len(parts) == 1 and "\n" in parts[0]:
        parts = [ln.strip() for ln in parts[0].split("\n") if ln.strip()]
    if len(parts) > 6:
        parts = parts[:6]
    if not parts:
        return []
    return parts[:4] if len(parts) > 4 else parts


def heuristic_massage_paragraphs(
    area_label: str, svc_kw: str, headline: str, excerpt: str
) -> List[str]:
    h = strip_html(headline)[:220]
    ex = strip_html(excerpt)[:520].strip()
    hook = ex if len(ex) >= 40 else h
    return [
        (
            f"{area_label} 주변에서는 「{h}」 관련 검색 노출이 눈에 띌 수 있습니다."
            f" 교통이나 행사, 생활권 분위기에 따라 이동·대기 변수가 커지는 날에는 {svc_kw}를 고려할 때 "
            "당일 가능 여부와 도착 시간 대략을 먼저 짚어두면 일정 관리가 수월합니다."
        ),
        (
            "예약에서는 코스 시간, 압 세기 요청 가능 여부, 아로마·스웨디시 등 프로그램 구성 차이만 "
            "짧히 확인해도 첫 이용 만족도가 달라집니다. 몸 상태(어깨·허리·하체 등)를 한두 문장만 정리해 "
            "전달하면 관리 초반부터 방향 맞추기가 빨라집니다."
        ),
        (
            f"참고로 파악한 생활권 정보 요지는 다음과 같습니다: {hook[:360]}"
            f"{'…' if len(hook) > 360 else ''} "
            "이 설명은 외부 이슈를 요약 참고용이며 원문 인용은 아니며, "
            "무리한 강도보다 상태에 맞춘 순차 케어가 재방문 판단에 유리합니다."
        ),
    ]


def rewrite_to_massage_paragraphs(
    area_label: str,
    svc_kw: str,
    headline: str,
    excerpt: str,
    use_openai: bool,
) -> List[str]:
    if use_openai:
        out = openai_rewrite_massage_article(area_label, svc_kw, headline, excerpt)
        if out:
            return out
    return heuristic_massage_paragraphs(area_label, svc_kw, headline, excerpt)


def build_spin_articles(
    area_label: str,
    svc_kw: str,
    items: List[Dict[str, str]],
    use_openai: bool,
    article_limit: int,
    fetch_body: bool,
) -> List[SpinArticle]:
    """각 RSS 항목마다 가능하면 본문 발췌 후 출장마사지 관점 글로 재작성합니다."""
    spins: List[SpinArticle] = []
    for it in items[: max(article_limit * 2, article_limit)]:
        if len(spins) >= article_limit:
            break
        headline = strip_html(it.get("title") or "").strip()
        if not headline:
            continue
        link = (it.get("link") or "").strip()
        excerpt = headline
        final_link = link
        if fetch_body and link.startswith("http"):
            try:
                final_link, html = fetch_url_body(link)
                excerpt = extract_readable_excerpt(html) or headline
                time.sleep(ARTICLE_BODY_DELAY)
            except Exception:
                excerpt = headline[:800]
                time.sleep(ARTICLE_BODY_DELAY)
        paragraphs = rewrite_to_massage_paragraphs(
            area_label, svc_kw, headline, excerpt, use_openai
        )
        if not paragraphs:
            continue
        spins.append(SpinArticle(source_headline=headline, source_url=final_link, paragraphs=paragraphs))
    return spins


def openai_polish_sentence(text: str) -> str:
    key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not key or len(text) < 20:
        return text
    try:
        import urllib.request

        payload = json.dumps(
            {
                "model": os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
                "messages": [
                    {
                        "role": "system",
                        "content": "한국어로 한 문장만 출력. 출장마사지·휴식·동선·예약 맥락으로 자연스럽게 다듬되 과장 금지.",
                    },
                    {"role": "user", "content": text[:800]},
                ],
                "max_tokens": 200,
                "temperature": 0.6,
            }
        ).encode("utf-8")
        req = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=payload,
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=45) as r:
            data = json.loads(r.read().decode("utf-8"))
        return (
            data.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
            .strip()
            or text
        )
    except Exception:
        return text


def build_copy_from_news(
    area_label: str, items: List[Dict[str, str]], use_openai: bool
) -> Tuple[List[str], List[str]]:
    if not items:
        intro = [
            f"{area_label} 일대 생활·이동 동선과 함께 출장마사지·휴식 수요를 점검하는 날짜별 로그입니다."
        ]
        points = [
            "운영시간·이동 동선·코스 구성을 사전에 확인하는 것이 만족도에 유리합니다.",
            "강도·집중 부위는 방문 초반에 말씀해 주시면 조절이 수월합니다.",
        ]
        return intro, points

    intros: List[str] = []
    for it in items[:3]:
        raw = strip_html(it.get("title", ""))[:200]
        sentence = (
            f"{area_label} 인근 검색 흐름에서 '{raw}' 이슈가 함께 노출되었습니다. "
            "이동이 잦거나 일정이 빡빡한 날에는 출장마사지·아로마 케어를 고려하실 때 예약·대기·이동 시간을 넉넉히 잡는 편이 좋습니다."
        )
        if use_openai:
            sentence = openai_polish_sentence(sentence)
        intros.append(sentence)

    points: List[str] = []
    for it in items[:5]:
        t = strip_html(it.get("title", ""))[:120]
        points.append(
            f"이슈 키워드: {t} — 동선·혼잡 시간대를 감안해 문의·예약 순서를 정리해 보세요."
        )
    return intros, points


def make_area_config(
    city: str,
    district: str,
    dong: str,
    nearby: str,
    intro_variants: List[str],
    feature_points: List[str],
    spin_articles: Optional[List[SpinArticle]] = None,
) -> AreaConfig:
    return AreaConfig(
        city=city,
        district=district,
        dong=dong or "",
        nearby_place=nearby,
        intro_variants=intro_variants,
        feature_points=feature_points,
        spin_articles=list(spin_articles or []),
    )


def derive_intros_and_points_from_spins(spins: List[SpinArticle]) -> Tuple[List[str], List[str]]:
    intros: List[str] = []
    points: List[str] = []
    for s in spins:
        if s.paragraphs:
            intros.append(s.paragraphs[0])
            if len(s.paragraphs) > 1:
                points.append(s.paragraphs[1][:280])
            else:
                points.append(s.paragraphs[0][:200] + " … 예약·이동 순서만 정리해도 체감이 달라집니다.")
    return intros, points


def write_region_city_hub(city_dir_name: str) -> None:
    """seo-topic-logs/{시도}/index.html — 해당 시·도 하위 시·구 허브 링크"""
    city_path = SITE_ROOT / OUTPUT_ROOT / city_dir_name
    if not city_path.is_dir():
        return
    links: List[Tuple[str, str]] = []
    for sub in sorted(city_path.iterdir()):
        if not sub.is_dir() or sub.name == "logs":
            continue
        if (sub / "index.html").is_file() and (sub / "logs").is_dir():
            href = f"{city_dir_name}/{sub.name}/index.html"
            links.append((href, f"{city_dir_name} {sub.name} 일자로그 허브"))
        else:
            for d2 in sorted(sub.iterdir()):
                if (
                    d2.is_dir()
                    and (d2 / "index.html").is_file()
                    and (d2 / "logs").is_dir()
                ):
                    href = f"{city_dir_name}/{sub.name}/{d2.name}/index.html"
                    links.append((href, f"{city_dir_name} {sub.name} {d2.name} 일자로그 허브"))

    if not links:
        return

    title = f"{city_dir_name} 지역 일자로그 허브 | 바로힐링출장마사지"
    rel_index = Path(city_dir_name) / "index.html"
    canonical = absolute_url(OUTPUT_ROOT / rel_index)
    desc = f"{city_dir_name} 시·구(·동) 단위 일자로그 허브 목록입니다."
    lis = "\n      ".join(
        f'<li><a href="{href}">{label}</a></li>' for href, label in links
    )
    body = f"""
<main>
  <header>
    <h1>{city_dir_name} 일자로그 허브</h1>
    <p>시·구(·동)별 로그 허브로 이동해 날짜별 문서를 확인할 수 있습니다.</p>
  </header>
  <section>
    <h2>하위 허브</h2>
    <article>
      <ul>
      {lis}
      </ul>
    </article>
  </section>
</main>
"""
    html = html_shell(title, canonical, desc, body)
    write_file(SITE_ROOT / OUTPUT_ROOT / city_dir_name / "index.html", html)


def _run_node_script(rel_script: str, ok_msg: str, timeout_sec: float = 900.0) -> None:
    p = SITE_ROOT / rel_script
    if not p.is_file():
        print(f"▶ {rel_script} 없음 — 생략.")
        return
    try:
        proc = subprocess.run(
            ["node", rel_script],
            cwd=str(SITE_ROOT),
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=timeout_sec,
            shell=False,
        )
    except FileNotFoundError:
        print("▶ Node.js(node) 없음 — 수동 실행이 필요합니다.")
        return
    except subprocess.TimeoutExpired:
        print(f"▶ {rel_script} 시간 초과({int(timeout_sec)}s).")
        return
    if proc.returncode != 0:
        err = (proc.stderr or proc.stdout or "").strip()[:500]
        print(f"▶ {rel_script} 실패(exit {proc.returncode}): {err}")
    else:
        print(ok_msg)


def run_generate_sitemap() -> None:
    _run_node_script("generate-sitemap.js", "▶ sitemap.xml 갱신 완료 (generate-sitemap.js)")


def rebuild_derived_html_from_logs() -> None:
    """districts/*.html 에 박히는 일자 로그 목록을 seo-topic-logs 폴더 기준으로 다시 채움."""
    print("▶ 일자 로그 링크를 반영하기 위해 시·군·구·지역 페이지를 재생성합니다…")
    _run_node_script(
        "build-all-district-pages.js",
        "▶ districts/* 페이지 갱신 (build-all-district-pages.js)",
        timeout_sec=7200,
    )
    _run_node_script(
        "build-region-pages.js",
        "▶ regions/* 페이지 갱신 (build-region-pages.js)",
        timeout_sec=7200,
    )


def rebuild_root_hub() -> None:
    hubs: List[Path] = []
    log_root = SITE_ROOT / OUTPUT_ROOT
    for p in sorted(log_root.rglob("index.html")):
        if p == log_root / "index.html":
            continue
        rel = p.relative_to(SITE_ROOT)
        hubs.append(rel)
    html = build_root_hub_html(hubs)
    write_file(log_root / "index.html", html)


def iter_area_jobs(
    regions_data: List[Dict[str, Any]],
    region_filter: Optional[str],
    dongs_map: Dict[str, Dict[str, List[str]]],
    districts_only: bool,
) -> Iterable[Tuple[str, str, str, str]]:
    """
    Yields (city, district, dong, search_query)
    dong may be empty for 시·구 전용 경로.
    """
    for r in regions_data:
        city = str(r.get("name") or "").strip()
        if not city:
            continue
        if region_filter and city != region_filter:
            continue
        # districts/*.html 이 없는 광역 단독 지역은 메인 링크가 깨지므로 일괄기에서 제외
        if city == "세종":
            continue
        districts = r.get("districts") or []
        for d in districts:
            district = str(d or "").strip()
            if not district:
                continue
            q = f"{city} {district}"
            yield city, district, "", q
            if districts_only:
                continue
            city_dongs = dongs_map.get(city) or {}
            for dong in city_dongs.get(district, []) or []:
                dong = str(dong).strip()
                if not dong:
                    continue
                yield city, district, dong, f"{city} {district} {dong}"


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="뉴스 RSS 기반 일자로그 일괄 생성")
    p.add_argument("--date", default=str(date.today()), help="생성할 로그 날짜 YYYY-MM-DD")
    p.add_argument("--region", default=None, help="특정 시·도만 (예: 경기)")
    p.add_argument("--delay", type=float, default=1.2, help="RSS 요청 간 대기(초)")
    p.add_argument("--max-areas", type=int, default=0, help="0이면 전체, N이면 상한")
    p.add_argument("--dry-run", action="store_true", help="파일 쓰기 없이 흐름만")
    p.add_argument("--mock", action="store_true", help="RSS 대신 모의 뉴스")
    p.add_argument(
        "--openai",
        action="store_true",
        help="OPENAI_API_KEY 로 항목별 출장마사지 문단 재작성(실패 시 휴리스틱)",
    )
    p.add_argument(
        "--articles",
        type=int,
        default=3,
        help="구역당 RSS 기사 몇 건까지 본문(가능 시) 후 재작성할지",
    )
    p.add_argument(
        "--no-fetch-body",
        action="store_true",
        help="링크 페이지를 받지 않고 제목만으로 재작성(빠름)",
    )
    p.add_argument(
        "--districts-only",
        action="store_true",
        help="동·읍·면 경로 없이 시·도×시군구만 처리",
    )
    p.add_argument(
        "--skip-sitemap",
        action="store_true",
        help="완료 후 node generate-sitemap.js 자동 실행 생략",
    )
    p.add_argument(
        "--skip-district-sync",
        action="store_true",
        help="완료 후 build-all-district-pages / build-region-pages 생략(시·구 페이지 목록 미갱신)",
    )
    p.add_argument(
        "--dongs-json",
        type=Path,
        default=None,
        help="동·읍·면 목록 JSON. 기본값: 루트에 korea-seo-topic-dongs.json 이 있으면 자동 사용.",
    )
    return p.parse_args()


def _ensure_utf8_stdio() -> None:
    for stream in (sys.stdout, sys.stderr):
        enc = getattr(stream, "encoding", None) or ""
        if enc.lower() not in ("utf-8", "utf8"):
            try:
                stream.reconfigure(encoding="utf-8", errors="replace")
            except (AttributeError, OSError, ValueError):
                pass


def main() -> int:
    _ensure_utf8_stdio()
    args = parse_args()
    log_date = args.date.strip()
    dongs_path = args.dongs_json
    if dongs_path is None:
        cand = SITE_ROOT / "korea-seo-topic-dongs.json"
        if cand.exists():
            dongs_path = cand
    dongs_map = load_optional_dongs(dongs_path)
    regions_data = load_regions()

    jobs = list(
        iter_area_jobs(regions_data, args.region, dongs_map, args.districts_only)
    )
    if args.max_areas and args.max_areas > 0:
        jobs = jobs[: args.max_areas]

    if dongs_path and dongs_map:
        print(f"▶ 동·읍·면 맵: {dongs_path}")
    elif not dongs_map:
        print("▶ 동·읍·면 맵 없음(시·군·구 단위만 처리). `python build_korea_seo_topic_dongs.py` 권장.")

    print(f"▶ 일자로그 일괄 생성: 날짜={log_date}, 구역 수={len(jobs)}, dry_run={args.dry_run}")
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)

    done = 0
    for city, district, dong, query in jobs:
        area_label = " ".join(x for x in (city, district, dong) if x)
        nearby = f"{district} 중심가 인근" if not dong else f"{dong} 인근"

        try:
            if args.mock:
                items = mock_news_items(query, 4)
            else:
                items = fetch_google_news_titles(query, limit=max(5, args.articles))
        except (urllib.error.URLError, TimeoutError, ET.ParseError) as e:
            print(f"  ! RSS 실패 [{area_label}]: {e} — 모의 데이터로 대체")
            items = mock_news_items(query, 3)

        preview_cfg = AreaConfig(
            city=city,
            district=district,
            dong=dong or "",
            nearby_place=nearby,
        )
        svc_kw = seo_keyword(preview_cfg)

        fetch_body = not args.no_fetch_body
        if args.dry_run:
            fetch_body = False

        spins = build_spin_articles(
            area_label,
            svc_kw,
            items,
            use_openai=args.openai,
            article_limit=max(1, args.articles),
            fetch_body=fetch_body,
        )
        intros: List[str]
        points: List[str]
        if spins:
            intros, points = derive_intros_and_points_from_spins(spins)
        else:
            intros, points = build_copy_from_news(
                area_label, items, use_openai=args.openai
            )

        cfg = make_area_config(
            city,
            district,
            dong,
            nearby,
            intros,
            points,
            spin_articles=spins,
        )

        if args.dry_run:
            print(f"  [dry-run] {area_label} / headlines={len(items)}, spins={len(spins)}")
        else:
            generate_area(cfg, [log_date])
            print(f"  [OK] {area_label}", flush=True)

        done += 1
        if not args.dry_run and args.delay > 0:
            time.sleep(args.delay)

    if not args.dry_run:
        cities_written = sorted({c for c, _, _, _ in jobs})
        for c in cities_written:
            write_region_city_hub(c)
        rebuild_root_hub()
        print(f"▶ 완료: {done}개 구역, 시·도 허브·루트 허브 갱신")
        if not args.skip_sitemap:
            run_generate_sitemap()
        if not args.skip_district_sync:
            rebuild_derived_html_from_logs()

    return 0


if __name__ == "__main__":
    sys.exit(main())
