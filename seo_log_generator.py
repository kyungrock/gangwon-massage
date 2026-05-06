#!/usr/bin/env python3
"""
SEO 계층형 로그 페이지 생성기 (GitHub Pages 정적 HTML 전용)

생성 구조:
  [시]/[구]/[동]/index.html
  [시]/[구]/[동]/logs/YYYY-MM-DD.html
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from html import escape
import os
import json
from pathlib import Path
from typing import Dict, Iterable, List

SITE_ORIGIN = "https://outcallmassage.co.kr"
OUTPUT_ROOT = Path("seo-topic-logs")
KOREA_REGIONS_FILE = Path("korea-regions.json")


@dataclass
class SpinArticle:
    """외부 참고 원문 미전재: 제목·링크 참고 후 재작성한 출장마사지 맥락 문단 묶음"""

    source_headline: str
    source_url: str
    paragraphs: List[str]


@dataclass
class AreaConfig:
    city: str
    district: str
    dong: str
    nearby_place: str
    district_page_slug: str | None = None
    service_keywords: List[str] = field(
        default_factory=lambda: ["출장마사지", "스웨디시", "아로마"]
    )
    intro_variants: List[str] = field(
        default_factory=lambda: [
            "예약 전 확인이 쉬운 핵심 정보를 중심으로 정리했습니다.",
            "실사용자가 빠르게 비교할 수 있도록 가격/시간/동선을 우선 배치했습니다.",
            "과장 표현보다 위치·시간·문의 동선을 명확히 안내합니다.",
        ]
    )
    feature_points: List[str] = field(default_factory=list)
    spin_articles: List[SpinArticle] = field(default_factory=list)


SAMPLE_AREAS: List[AreaConfig] = [
    AreaConfig(
        city="서울",
        district="강남구",
        dong="역삼동",
        nearby_place="역삼역 1번출구",
    ),
    AreaConfig(
        city="대구",
        district="수성구",
        dong="수성동",
        nearby_place="수성시장역 2번출구",
    ),
    AreaConfig(
        city="울산",
        district="남구",
        dong="",
        nearby_place="울산 시외버스터미널 인근",
        intro_variants=[
            "육아와 일상으로 누적된 피로를 짧은 시간 안에 풀고 싶은 분들을 위해 울산 남구 동선 중심으로 정리했습니다.",
            "후기 기반으로 실제 이용자가 자주 확인하는 운영시간, 예약 편의, 케어 강도 조절 포인트를 우선 담았습니다.",
            "울산 남구 생활권에서 접근성 좋은 위치와 코스 선택 팁을 중심으로 일자 로그를 구성했습니다.",
        ],
        feature_points=[
            "신정현대홈타운-수암동 이동 동선에서 찾기 쉬운 2층 매장 구조",
            "족욕 후 후면 아로마/타이 케어로 이어지는 단계형 진행",
            "압 세기 조절, 스트레칭 요청 등 개인 컨디션 맞춤 관리 가능",
            "예약/방문접수/출장 문의 동선을 한 번에 확인 가능한 운영 안내",
        ],
    ),
]

LOG_DATES: List[str] = [str(date.today())]


def slug_safe(value: str) -> str:
    return value.strip().replace("/", "-")


def normalize_region_name(name: str) -> str:
    s = str(name or "").strip()
    if s.endswith("도") and len(s) >= 2:
        return s[:-1]
    return s


def build_district_duplicate_counts() -> Dict[str, int]:
    if not KOREA_REGIONS_FILE.exists():
        return {}
    raw = KOREA_REGIONS_FILE.read_text(encoding="utf-8")
    parsed = json.loads(raw)
    regions = parsed.get("regions", [])
    counts: Dict[str, int] = {}
    for r in regions:
        for d in r.get("districts", []) or []:
            dn = str(d or "").strip()
            if not dn:
                continue
            counts[dn] = counts.get(dn, 0) + 1
    return counts


DISTRICT_DUP_COUNTS = build_district_duplicate_counts()


def keyword(area: AreaConfig) -> str:
    district = str(area.district).strip()
    city = normalize_region_name(area.city)
    if DISTRICT_DUP_COUNTS.get(district, 0) > 1 and city:
        return f"{city} {district}출장마사지"
    return f"{district}출장마사지"


def area_label(area: AreaConfig) -> str:
    parts = [str(area.city).strip(), str(area.district).strip(), str(area.dong).strip()]
    return " ".join([p for p in parts if p])


def area_dir(area: AreaConfig) -> Path:
    base = OUTPUT_ROOT / slug_safe(area.city) / slug_safe(area.district)
    dong = slug_safe(area.dong)
    return base / dong if dong else base


def rel_url(path: Path) -> str:
    return "/".join(path.parts)


def absolute_url(path: Path) -> str:
    """OUTPUT_ROOT 안의 상대경로 또는 OUTPUT_ROOT 포함 Path → 사이트 절대 URL."""
    pp = Path(path)
    parts = pp.parts
    if parts and parts[0] != OUTPUT_ROOT.name:
        parts = (OUTPUT_ROOT.name,) + parts
    return f"{SITE_ORIGIN.rstrip('/')}/{'/'.join(parts)}"


def path_rel_from(from_dir: Path, to_path: Path) -> str:
    """from_dir 기준 to_path 상대경로를 posix 형태로 반환"""
    return os.path.relpath(str(to_path), start=str(from_dir))


def html_shell(title: str, canonical: str, description: str, body_html: str) -> str:
    return f"""<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{escape(title)}</title>
  <meta name="description" content="{escape(description)}" />
  <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large" />
  <link rel="canonical" href="{escape(canonical)}" />
  <style>
    :root {{
      --bg: #f4f7fb;
      --text: #0f172a;
      --muted: #475569;
      --card: #ffffff;
      --line: #e2e8f0;
      --brand: #2563eb;
      --brand-soft: #dbeafe;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR", sans-serif;
      color: var(--text);
      background: linear-gradient(180deg, #eef4ff 0%, var(--bg) 40%, var(--bg) 100%);
      line-height: 1.65;
    }}
    main {{
      max-width: 860px;
      margin: 0 auto;
      padding: 24px 16px 48px;
    }}
    header, section, article {{
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 14px;
    }}
    header, section {{
      padding: 18px;
      margin-bottom: 14px;
      box-shadow: 0 6px 18px rgba(15, 23, 42, 0.05);
    }}
    article {{
      padding: 14px;
      margin-top: 10px;
      background: #fbfdff;
    }}
    h1, h2 {{
      margin: 0 0 10px;
      line-height: 1.35;
      letter-spacing: -0.01em;
    }}
    h1 {{ font-size: 1.35rem; }}
    h2 {{ font-size: 1.05rem; }}
    p {{ margin: 0 0 8px; color: var(--muted); }}
    ul {{
      margin: 0;
      padding-left: 1.1rem;
      display: grid;
      gap: 6px;
    }}
    a {{
      color: var(--brand);
      text-decoration: none;
      font-weight: 600;
    }}
    a:hover {{ text-decoration: underline; }}
    .muted {{ color: var(--muted); }}
    section.spin {{
      margin-top: 14px;
      padding-top: 10px;
      border-top: 1px dashed var(--line);
    }}
    section.spin h3 {{ font-size: 1rem; margin-bottom: 8px; }}
    .quick-links {{
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
    }}
    .quick-links a {{
      display: inline-block;
      border: 1px solid #bfdbfe;
      background: var(--brand-soft);
      color: #1d4ed8;
      border-radius: 999px;
      padding: 6px 10px;
      font-size: 0.9rem;
      font-weight: 700;
    }}
    @media (max-width: 640px) {{
      main {{ padding: 16px 12px 32px; }}
      header, section {{ padding: 14px; border-radius: 12px; }}
      article {{ padding: 12px; }}
      h1 {{ font-size: 1.2rem; }}
      h2 {{ font-size: 1rem; }}
    }}
  </style>
</head>
<body>
{body_html}
</body>
</html>
"""


def build_root_hub_html(area_index_paths: Iterable[Path]) -> str:
    title = "지역·시/구·동 SEO 로그 허브 | 바로힐링출장마사지"
    canonical = absolute_url(OUTPUT_ROOT / "index.html")
    description = "지역·시/구·동 단위의 정적 SEO 로그 허브 목록입니다."

    items = []
    for rel in area_index_paths:
        parts = list(rel.parts)
        if not parts or parts[-1] != "index.html":
            continue
        inner = parts[:-1]
        if inner and inner[0] == OUTPUT_ROOT.name:
            inner = inner[1:]
        if len(inner) == 2:
            city, district = inner[0], inner[1]
            label = f"{city} {district} 허브"
        elif len(inner) == 3:
            city, district, dong = inner[0], inner[1], inner[2]
            label = f"{city} {district} {dong} 허브"
        else:
            continue
        href = rel.as_posix().replace("\\", "/")
        items.append(f'<li><a href="{escape(href)}">{escape(label)}</a></li>')

    list_html = "\n      ".join(items) if items else "<li>생성된 허브가 없습니다.</li>"
    body = f"""
<main>
  <header>
    <h1>지역·시/구·동 SEO 로그 허브</h1>
    <p>아래 링크에서 각 생활권의 로그 허브와 날짜별 문서를 확인할 수 있습니다.</p>
  </header>
  <section>
    <h2>허브 목록</h2>
    <article>
      <ul>
      {list_html}
      </ul>
    </article>
  </section>
</main>
"""
    return html_shell(title, canonical, description, body)


def build_index_html(area: AreaConfig, logs_rel_paths: Iterable[Path], index_rel: Path) -> str:
    k = keyword(area)
    label = area_label(area)
    page_title = f"{label} 출장마사지 허브 | 바로힐링출장마사지"
    canonical = absolute_url(index_rel)
    description = (
        f"{label} 지역의 출장마사지 로그를 날짜별로 확인할 수 있는 허브 페이지입니다."
    )

    items = []
    for rel in logs_rel_paths:
        d = rel.stem
        href = "./" + "/".join(rel.parts[-2:])
        items.append(f'<li><a href="{escape(href)}">{escape(d)} {escape(k)} 로그</a></li>')

    logs_list_html = "\n      ".join(items) if items else "<li>등록된 로그가 없습니다.</li>"

    body = f"""
<main>
  <header>
    <h1>{escape(k)} 정보 허브</h1>
    <p>{escape(label)} · 인근 {escape(area.nearby_place)} 기준으로 날짜별 로그를 모았습니다.</p>
  </header>

  <section>
    <h2>최신 로그 목록</h2>
    <article>
      <ul>
      {logs_list_html}
      </ul>
    </article>
  </section>

  <section>
    <h2>이 페이지의 목적</h2>
    <article>
      <p>{escape(k)} 관련 로그를 한 페이지에서 탐색할 수 있도록 구성한 정적 허브입니다.</p>
    </article>
  </section>
</main>
"""
    return html_shell(page_title, canonical, description, body)


def build_log_html(
    area: AreaConfig,
    log_day: str,
    index_rel: Path,
    district_main_href: str,
    district_main_text: str,
    hub_href: str,
    hub_text: str,
    latest_log_hrefs: list[tuple[str, str]],
    variant_seed: int,
) -> str:
    k = keyword(area)
    label = area_label(area)
    page_title = f"{label} 출장마사지 로그 {log_day}"
    canonical = absolute_url(index_rel)  # 로그는 허브 canonical 고정
    description = f"{log_day} 기준 {label} 출장마사지 정보 로그입니다."
    intro = area.intro_variants[variant_seed % len(area.intro_variants)]
    services = ", ".join(area.service_keywords)
    backlink_href = district_main_href
    backlink_text = district_main_text
    latest_logs_html = "".join(
        f'<li><a href="{escape(href)}">{escape(label)}</a></li>'
        for href, label in latest_log_hrefs
    )
    feature_points_html = "".join(
        f"<li>{escape(point)}</li>" for point in (area.feature_points or [])
    )
    spin_blocks: List[str] = []
    for sa in area.spin_articles or []:
        head = escape((sa.source_headline or "").strip()[:220])
        paras = "".join(f"<p>{escape(p.strip())}</p>" for p in (sa.paragraphs or []) if p.strip())
        link = (sa.source_url or "").strip()
        ref_line = ""
        if link:
            ref_line = (
                f'<p class="muted"><small>참고(원문 미전재): '
                f'<a href="{escape(link)}" rel="nofollow noopener">관련 외부 링크</a></small></p>'
            )
        spin_blocks.append(
            f'<section class="spin"><h3>{head}</h3>{paras}{ref_line}</section>'
        )
    spin_section_html = ""
    if spin_blocks:
        spin_section_html = (
            '<article>'
            '<h2>지역 이슈를 출장마사지 이용 관점으로 정리</h2>'
            '<p><small>외부 제목·요지를 참고해 새로 쓴 설명글입니다. 원문 전재는 하지 않습니다.</small></p>'
            f'{"".join(spin_blocks)}'
            "</article>"
        )

    long_flow_paragraph = (
        f"{label} 생활권에서는 퇴근 이후 또는 주말 저녁 시간대에 문의가 몰리는 편이라, "
        "원하는 시간에 맞춰 이용하려면 최소 당일 오전 또는 반나절 전 예약 확인이 유리합니다. "
        "특히 컨디션 회복 목적의 케어를 찾는 경우에는 단순 가격 비교보다 코스 구성(후면 중심/전신 중심/아로마 포함 여부), "
        "관리 시간, 강도 조절 가능 여부를 함께 보는 것이 만족도를 높이는 핵심 포인트입니다."
    )
    long_course_paragraph = (
        "실제 이용 흐름은 대체로 예약 확인 → 방문 동선 체크 → 간단한 컨디션 전달 → 코스 진행 → 마무리 안내 순으로 이어집니다. "
        "초반에 어깨, 허리, 골반, 하체처럼 불편 부위를 구체적으로 전달하면 체감도가 크게 달라지고, "
        "압 강도는 시작 5~10분 내에 바로 조절 요청하는 것이 가장 효과적입니다. "
        "또한 장시간 앉아있는 직장인, 육아 중인 이용자, 운동 후 회복이 필요한 이용자처럼 생활 패턴에 따라 "
        "집중 관리 부위가 달라질 수 있으므로, 본인 상태를 간단히 메모해 전달하면 맞춤 관리에 도움이 됩니다."
    )
    long_visit_tip_paragraph = (
        "방문 전에는 주차 가능 여부, 건물 진입 동선, 대기공간 유무를 확인해 이동 스트레스를 줄이는 것을 권장합니다. "
        "관리 직후에는 수분 보충과 가벼운 스트레칭을 병행하면 피로 완화 효과를 더 오래 유지하는 데 도움이 됩니다. "
        "무리한 강도보다 몸 상태에 맞춘 단계적 케어가 장기적으로 더 좋은 결과를 만드는 경우가 많으니, "
        "첫 방문에서는 강도·시간·집중 부위를 세밀하게 맞추는 방식으로 접근하는 것이 좋습니다."
    )

    body = f"""
<main>
  <section>
    <h2>최근 일자 로그</h2>
    <article>
      <div class="quick-links">
        <a href="{escape(backlink_href)}">{escape(backlink_text)}</a>
        <a href="{escape(hub_href)}">{escape(hub_text)}</a>
      </div>
      <ul>
        {latest_logs_html}
      </ul>
    </article>
  </section>

  <header>
    <h1>{escape(k)} 일자 로그 ({escape(log_day)})</h1>
    <p>{escape(label)} · {escape(area.nearby_place)} 주변 동선 기반 기록입니다.</p>
  </header>

  <article>
    <h2>{escape(log_day)} 업데이트 요약</h2>
    <p>{escape(intro)}</p>
    <p>{escape(area.district)} 생활권에서 확인된 주요 테마는 {escape(services)} 중심이며, 방문/문의 전 체크 포인트를 함께 정리했습니다.</p>
    <p>{escape(long_flow_paragraph)}</p>
    <p>{escape(long_course_paragraph)}</p>
  </article>

  {spin_section_html}

  <article>
    <h2>{escape(area.city)} {escape(area.district)} 출장마사지 이용 포인트</h2>
    <p>현장 후기 성격의 내용을 바탕으로, 처음 방문해도 흐름을 이해하기 쉬운 핵심 요소만 간단히 정리했습니다.</p>
    <ul>
      {feature_points_html or "<li>운영시간, 위치, 코스, 문의 동선을 우선 확인해 주세요.</li>"}
    </ul>
  </article>

  <article>
    <h2>지역 기반 참고 포인트</h2>
    <p>{escape(label)}에서 {escape(k)}를 찾는 사용자는 보통 접근성, 운영시간, 코스 구성을 우선 확인합니다.</p>
    <p>{escape(long_visit_tip_paragraph)}</p>
    <p>추가로 재방문을 고려하는 경우에는 1회 체감만 보기보다, 관리 다음 날의 몸 상태(근육 뭉침 완화, 부종 변화, 수면 컨디션)를 함께 체크해 두면 매장/코스 선택 기준을 더 명확하게 세울 수 있습니다.</p>
  </article>

</main>
"""
    return html_shell(page_title, canonical, description, body)


def write_file(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def collect_existing_log_dates(logs_dir: Path) -> List[str]:
    if not logs_dir.exists():
        return []
    dates: List[str] = []
    for p in logs_dir.glob("*.html"):
        stem = p.stem.strip()
        if stem:
            dates.append(stem)
    return dates


def generate_area(area: AreaConfig, log_dates: Iterable[str]) -> None:
    base = area_dir(area)
    logs_dir = base / "logs"
    index_file = base / "index.html"
    index_rel = index_file.relative_to(OUTPUT_ROOT)

    incoming_dates = [str(d).strip() for d in log_dates if str(d).strip()]
    existing_dates = collect_existing_log_dates(logs_dir)
    ordered_dates = sorted(set(incoming_dates + existing_dates), reverse=True)
    log_rel_paths: List[Path] = []
    for i, d in enumerate(ordered_dates):
        log_file = logs_dir / f"{d}.html"
        district_slug = area.district_page_slug or area.district
        district_page_name = f"{area.city}-{district_slug}출장마사지.html"
        district_page_abs = Path("districts") / district_page_name
        district_main_href = Path(
            path_rel_from(log_file.parent, district_page_abs)
        ).as_posix()
        district_main_text = f"{area.city} {area.district}출장마사지 메인 페이지로 이동"
        latest_log_hrefs = [
            (f"./{dt}.html", f"{dt} {area.city} {area.district} 일자 로그")
            for dt in ordered_dates
        ]

        html = build_log_html(
            area,
            d,
            index_rel,
            district_main_href,
            district_main_text,
            "../index.html",
            f"{area.city} {area.district} 일자로그 허브로 이동",
            latest_log_hrefs,
            i,
        )
        write_file(log_file, html)
        log_rel_paths.append(log_file.relative_to(base))

    index_html = build_index_html(area, sorted(log_rel_paths, reverse=True), index_rel)
    write_file(index_file, index_html)


def main() -> None:
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    area_indexes: List[Path] = []
    for area in SAMPLE_AREAS:
        generate_area(area, LOG_DATES)
        area_indexes.append((area_dir(area) / "index.html").relative_to(Path(".")))

    root_hub = build_root_hub_html(sorted(area_indexes))
    write_file(OUTPUT_ROOT / "index.html", root_hub)
    print("생성 완료:", OUTPUT_ROOT)
    print("샘플 지역 수:", len(SAMPLE_AREAS))
    print("로그 날짜 수:", len(LOG_DATES))


if __name__ == "__main__":
    main()

