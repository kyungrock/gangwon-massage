#!/usr/bin/env python3
"""
shops.json 이용후기를 업체별 문맥으로 다양하게 생성합니다.

특징:
- 지역/서비스/코스/특징을 섞어 문장 다양화
- 전역 comment 중복 최소화(중복 시 재생성)
- --overwrite-all 로 전체 교체 가능
"""

from __future__ import annotations

import argparse
import json
import random
import re
from datetime import date, timedelta
from pathlib import Path
from typing import Any, Dict, List, Set

ROOT = Path(__file__).resolve().parent
SHOPS_FILE = ROOT / "shops.json"

NAMES = ["김**", "이**", "박**", "최**", "정**", "강**", "조**", "윤**", "장**", "임**"]
SERVICE_HINTS = ["스웨디시", "아로마", "타이", "건식", "힐링", "왁싱"]

OPENING = [
    "퇴근 이후 몸이 무겁고 집중이 안 돼서 예약했습니다.",
    "최근 이동이 많아 하체랑 어깨가 많이 뭉친 상태로 방문했어요.",
    "주말 전에 컨디션 정리하려고 시간 맞춰 이용했습니다.",
    "업무 강도가 높았던 주라 짧게라도 제대로 받아보려 예약했어요.",
    "운동 후 회복이 느려지는 느낌이 있어 관리 받았습니다.",
    "장시간 앉아있는 날이 이어져 목/허리 위주로 요청했어요.",
]

MIDDLE = [
    "초반 상담에서 불편 부위를 정확히 짚어줘서 진행이 수월했습니다.",
    "압 강도 확인을 자주 해줘서 부담 없이 받을 수 있었습니다.",
    "요청한 부위 중심으로 시간 배분이 잘 돼 체감이 확실했어요.",
    "진행 순서가 일정해서 처음 이용인데도 편하게 받았습니다.",
    "관리사 응대가 차분하고 깔끔해서 긴장이 빨리 풀렸어요.",
    "중간중간 피드백 반영이 빨라 원하는 느낌에 가깝게 맞췄습니다.",
]

ENDING = [
    "다음에도 같은 시간대에 재예약할 생각입니다.",
    "전체적으로 만족해서 재방문 의사 있습니다.",
    "마무리까지 꼼꼼해서 다음 날 컨디션이 괜찮았습니다.",
    "무리한 압 없이 진행돼 피로가 덜 남았습니다.",
    "위치/응대/진행 모두 안정적이라 재이용할 것 같습니다.",
    "재방문 시에는 조금 긴 코스로 받아볼 예정입니다.",
]


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="shops.json 이용후기 다양화 생성")
    p.add_argument("--overwrite-all", action="store_true", help="기존 후기까지 전부 재작성")
    p.add_argument("--dry-run", action="store_true", help="저장 없이 대상만 출력")
    p.add_argument("--per-shop", type=int, default=3, help="업체당 생성 후기 개수")
    return p.parse_args()


def load_wrapped_json(path: Path) -> Dict[str, Any]:
    raw = path.read_text(encoding="utf-8")
    if "window.shopsData" in raw:
        s = raw.find("{")
        e = raw.rfind("}") + 1
        return json.loads(raw[s:e])
    return json.loads(raw)


def dump_wrapped_json(path: Path, payload: Dict[str, Any]) -> None:
    body = json.dumps(payload, ensure_ascii=False, indent=2)
    path.write_text(f"window.shopsData = {body};\n", encoding="utf-8")


def pick_service(shop: Dict[str, Any]) -> str:
    services = shop.get("services") or []
    if isinstance(services, list):
        for s in services:
            ss = str(s)
            if any(k in ss for k in SERVICE_HINTS):
                return ss
        if services:
            return str(services[0])
    desc = str(shop.get("description") or "")
    for k in SERVICE_HINTS:
        if k in desc:
            return k
    return "관리"


def normalize_location(shop: Dict[str, Any]) -> str:
    region = str(shop.get("region") or "").strip()
    district = str(shop.get("district") or "").strip()
    dong = str(shop.get("dong") or "").strip()
    if region and district and dong:
        return f"{region} {district} {dong}"
    if region and district:
        return f"{region} {district}"
    return region or district or "해당 지역"


def pick_course_hint(shop: Dict[str, Any], rng: random.Random) -> str:
    courses = shop.get("courses") or []
    names: List[str] = []
    if isinstance(courses, list):
        for c in courses:
            for it in (c.get("items") or []):
                nm = str(it.get("name") or "").strip()
                if nm:
                    names.append(nm)
    return rng.choice(names) if names else ""


def pick_feature_hint(shop: Dict[str, Any], rng: random.Random) -> str:
    feats = shop.get("features") or []
    vals = [str(x).strip() for x in feats if str(x).strip()] if isinstance(feats, list) else []
    return rng.choice(vals) if vals else ""


def safe_int(v: Any, fallback: int = 0) -> int:
    try:
        return int(v)
    except Exception:
        return fallback


def build_comment_variant(shop: Dict[str, Any], idx: int, rng: random.Random, salt: int) -> str:
    loc = normalize_location(shop)
    service = pick_service(shop)
    course = pick_course_hint(shop, rng)
    feature = pick_feature_hint(shop, rng)
    opening = OPENING[(idx + salt + rng.randint(0, 99)) % len(OPENING)]
    middle = MIDDLE[(idx + salt + rng.randint(0, 99)) % len(MIDDLE)]
    ending = ENDING[(idx + salt + rng.randint(0, 99)) % len(ENDING)]

    parts = [f"{loc}에서 {service} 중심으로 받았습니다.", opening]
    if course:
        parts.append(f"이번에는 {course} 코스로 진행했는데 흐름이 끊기지 않아 좋았어요.")
    if feature:
        parts.append(f"특히 {feature} 부분이 실제 이용 편의에 도움이 됐습니다.")
    parts.extend([middle, ending])
    return re.sub(r"\s+", " ", " ".join(parts)).strip()


def build_review(shop: Dict[str, Any], idx: int, rng: random.Random, used: Set[str]) -> Dict[str, Any]:
    name = NAMES[(idx + rng.randint(0, 7)) % len(NAMES)]
    rating = round(4.7 + (rng.random() * 0.3), 1)
    when = date.today() - timedelta(days=(idx + 1) * (1 + rng.randint(0, 2)))

    comment = ""
    for salt in range(60):
        cand = build_comment_variant(shop, idx, rng, salt)
        if cand not in used:
            comment = cand
            break
    if not comment:
        sid = str(shop.get("id") or shop.get("name") or "shop")
        comment = f"{build_comment_variant(shop, idx, rng, 99)} ({sid}-{idx+1})"
    used.add(comment)

    return {"name": name, "rating": rating, "date": when.isoformat(), "comment": comment}


def should_fill(shop: Dict[str, Any], overwrite_all: bool, per_shop: int) -> bool:
    if overwrite_all:
        return True
    reviews = shop.get("reviews")
    if not isinstance(reviews, list):
        return True
    return len(reviews) < per_shop


def main() -> int:
    args = parse_args()
    data = load_wrapped_json(SHOPS_FILE)
    shops = list(data.get("shops") or [])

    changed = 0
    used_comments: Set[str] = set()
    for shop in shops:
        if not should_fill(shop, args.overwrite_all, args.per_shop):
            rc = safe_int(shop.get("reviewCount"), 0)
            if rc < len(shop.get("reviews") or []):
                shop["reviewCount"] = len(shop.get("reviews") or [])
                changed += 1
            continue

        seed = str(shop.get("id") or shop.get("name") or random.random())
        rng = random.Random(seed)
        reviews = [build_review(shop, i, rng, used_comments) for i in range(max(1, args.per_shop))]
        shop["reviews"] = reviews

        rc = safe_int(shop.get("reviewCount"), 0)
        shop["reviewCount"] = max(rc, len(reviews))
        changed += 1

    if args.dry_run:
        print(f"[dry-run] 변경 예정 업체 수: {changed}")
        return 0

    dump_wrapped_json(SHOPS_FILE, data)
    print(f"완료: 후기 생성/보정 업체 수 {changed}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

