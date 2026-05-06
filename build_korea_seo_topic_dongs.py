#!/usr/bin/env python3
"""
korea-hot-subdistricts.json + shops.json 에서 동·읍·면 키워드를 모아
seo_news_bulk_log.py --dongs-json 용 `korea-seo-topic-dongs.json` 생성.

실행:
  python build_korea_seo_topic_dongs.py

역할별:
  - 행정 전체 명단이 아니라, 사이트·상권 데이터에 근거한 검색 거점 목록입니다.
  - 특정 구에 항목이 없으면 시·구 단위 일자로그만 생성됩니다(세종 등은 기존대로 제외).
"""

from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Optional, Set

ROOT = Path(__file__).resolve().parent
REGIONS_FILE = ROOT / "korea-regions.json"
HOT_FILE = ROOT / "korea-hot-subdistricts.json"
SHOPS_FILE = ROOT / "shops.json"
OUTPUT_FILE = ROOT / "korea-seo-topic-dongs.json"

BAD_DISTRICT = ("전역", "전국", "·", "전지역", "미정", "테스트")


def simplify(s: str) -> str:
    return re.sub(r"\s+", "", (s or "").strip())


def load_shops_wrapped_json(path: Path) -> List[dict]:
    raw = path.read_text(encoding="utf-8")
    if "window.shopsData" in raw:
        i = raw.index("{")
        j = raw.rindex("}") + 1
        data = json.loads(raw[i:j])
    else:
        data = json.loads(raw)
    return list(data.get("shops") or [])


def load_regions_order() -> Dict[str, List[str]]:
    parsed = json.loads(REGIONS_FILE.read_text(encoding="utf-8"))
    out: Dict[str, List[str]] = {}
    for r in parsed.get("regions") or []:
        name = str(r.get("name") or "").strip()
        if not name or name == "세종":
            continue
        dlist = [str(x or "").strip() for x in (r.get("districts") or []) if str(x or "").strip()]
        out[name] = dlist
    return out


def district_token_variants(canonical: str) -> Set[str]:
    c = canonical.strip()
    s: Set[str] = set()
    for base in (
        simplify(c),
        simplify(c.rstrip("구시군")),
    ):
        if base:
            s.add(base)
        if base:
            for suf in ("구", "시", "군"):
                if not base.endswith(suf):
                    s.add(base + suf)
        if len(base) > 2 and base[-1] in "구시군":
            s.add(base[:-1])
    return {x for x in s if len(x) >= 1}


def match_canonical_district(region: str, raw: str, canon_list: List[str]) -> Optional[str]:
    if not raw or any(b in raw for b in BAD_DISTRICT):
        return None

    overrides = {
        ("경기", simplify("고양시 일산동구")): "고양",
        ("경기", simplify("고양 일산동구")): "고양",
        ("경기", simplify("고양시일산동구")): "고양",
        ("경기", simplify("고양시 일산서구")): "고양",
    }
    sx = simplify(raw)
    ov = overrides.get((region, sx))
    if ov:
        return ov if ov in canon_list else None

    ranked = sorted(canon_list, key=lambda x: (-len(x), x))
    tokens = [t for t in re.split(r"[/,,·]", raw) if simplify(t)]

    best: Optional[str] = None
    for canon in ranked:
        vars_ = district_token_variants(canon)

        def hit(vset: Set[str]) -> bool:
            for v in vars_:
                if not v:
                    continue
                if sx == v:
                    return True
            for tk in tokens:
                for v in vars_:
                    if tk == v:
                        return True
            # prefix: 장시군 이름이 raw 앞에 오는 경우 (예: 부천시 소사구)
            for v in sorted(vars_, key=len, reverse=True):
                if len(v) < 2:
                    continue
                if sx.startswith(v) and sx != v:
                    tail = sx[len(v) :]
                    if tail[:1] in ("구", "시", "군", "동", "읍", "면") or not tail:
                        return True
            return False

        if hit(vars_):
            best = canon
            break
    return best


_RE_ENDS_NGA = re.compile(r"\d가$")


def normalize_dong_label(name: str) -> Optional[str]:
    s = (name or "").strip()
    if not s or any(x in s for x in ("불가", "전역", "전국", "미정", "관리")):
        return None
    if _RE_ENDS_NGA.search(s):
        return s
    if s.endswith("역") and len(s) >= 2:
        return s
    for suf in ("동", "읍", "면", "리"):
        if s.endswith(suf) and len(s) > len(suf):
            return s
    if s.endswith("가") and any(ch.isdigit() for ch in s):
        return s
    return s + "동"


def main() -> int:
    regions = load_regions_order()
    dong_map: Dict[str, Dict[str, Set[str]]] = defaultdict(lambda: defaultdict(set))

    if HOT_FILE.is_file():
        hot = json.loads(HOT_FILE.read_text(encoding="utf-8"))
        for block in hot.get("regions") or []:
            reg = str(block.get("region") or "").strip()
            if not reg or reg not in regions:
                continue
            for city in block.get("cities") or []:
                dist = str(city.get("district") or "").strip()
                if not dist:
                    continue
                canon = dist
                if canon not in regions[reg]:
                    m = match_canonical_district(reg, dist, regions[reg])
                    if m:
                        canon = m
                    else:
                        continue
                for sub in city.get("subdistricts") or []:
                    lab = normalize_dong_label(str(sub or ""))
                    if lab:
                        dong_map[reg][canon].add(lab)

    shops = load_shops_wrapped_json(SHOPS_FILE)
    for sp in shops:
        reg = str(sp.get("region") or "").strip()
        if not reg or reg not in regions:
            continue
        raw_d = str(sp.get("district") or "").strip()
        canon = match_canonical_district(reg, raw_d, regions[reg])
        if not canon:
            continue
        dval = sp.get("dong")
        if dval is None:
            continue
        if isinstance(dval, list):
            parts = dval
        else:
            parts = re.split(r"[,/|]", str(dval))
        for p in parts:
            lab = normalize_dong_label(str(p or ""))
            if lab:
                dong_map[reg][canon].add(lab)

    # JSON: sorted lists for stable output
    out_root: Dict[str, Dict[str, List[str]]] = {}
    for reg in sorted(regions.keys()):
        inner: Dict[str, List[str]] = {}
        for dist in regions[reg]:
            names = sorted(dong_map[reg].get(dist, set()))
            if names:
                inner[dist] = names
        if inner:
            out_root[reg] = dict(sorted(inner.items(), key=lambda x: x[0]))

    meta = {
        "description": (
            "seo_news_bulk_log.py 용 시·도 → 시·군·구 → 동·읍·면 키워드 맵. "
            "korea-hot-subdistricts + shops.json 기반(행정 전체 명단 아님)."
        ),
        "region_count": len(out_root),
        "district_with_dong_count": sum(len(v) for v in out_root.values()),
        "total_dong_labels": sum(len(d) for inner in out_root.values() for d in inner.values()),
    }

    payload = {"_meta": meta, **out_root}
    OUTPUT_FILE.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print("작성:", OUTPUT_FILE)
    print(
        f"  시·도 {meta['region_count']}개, "
        f"동 맵이 있는 시·군·구 {meta['district_with_dong_count']}개, "
        f"동·읍·면 라벨 합계 {meta['total_dong_labels']}개"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
