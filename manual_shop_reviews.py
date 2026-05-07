#!/usr/bin/env python3
"""
수동 이용후기 작성 워크플로우 도구.

1) 초안 파일 생성
   python manual_shop_reviews.py init
   python manual_shop_reviews.py init --all --per-shop 3

2) manual-shop-reviews.json 을 사람이 직접 수정
   - comment를 업체별로 자연스럽고 다르게 작성

3) shops.json 반영
   python manual_shop_reviews.py apply
   python manual_shop_reviews.py apply --strict-unique
"""

from __future__ import annotations

import argparse
import json
from datetime import date, timedelta
from pathlib import Path
from typing import Any, Dict, List, Tuple

ROOT = Path(__file__).resolve().parent
SHOPS_FILE = ROOT / "shops.json"
MANUAL_FILE = ROOT / "manual-shop-reviews.json"
NAMES = ["김**", "이**", "박**", "최**", "정**", "윤**", "장**", "임**", "한**", "서**"]

INTRO_PARTS = [
    "퇴근 후 피로가 쌓여 방문했습니다.",
    "일정이 빡빡한 주라 컨디션 관리 차원에서 이용했어요.",
    "장거리 이동이 많아 어깨·허리 위주로 받고 싶었습니다.",
    "주말 전에 몸을 정리하려고 예약했습니다.",
    "오랜만에 시간 내서 관리받았어요.",
]
FLOW_PARTS = [
    "예약 안내가 깔끔하고 도착 전 응대가 빨라서 편했습니다.",
    "초반에 불편 부위를 전달하니 집중 관리가 잘 됐습니다.",
    "강약 조절 요청을 바로 반영해줘 부담 없이 받을 수 있었어요.",
    "진행 순서 설명이 명확해서 처음 이용인데도 어렵지 않았습니다.",
    "중간 확인을 해줘서 원하는 강도로 맞추기 좋았습니다.",
]
FINISH_PARTS = [
    "전체적으로 만족도가 높아 재방문 의사 있습니다.",
    "다음에도 비슷한 시간대로 다시 예약할 생각입니다.",
    "마무리까지 꼼꼼해서 체감이 괜찮았습니다.",
    "무리한 압 없이 진행돼 다음 날 컨디션도 괜찮았어요.",
    "응대가 차분하고 깔끔해서 편하게 이용했습니다.",
]


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="수동 이용후기 템플릿 생성/반영")
    sub = p.add_subparsers(dest="cmd", required=True)

    p_init = sub.add_parser("init", help="수동 작성용 JSON 템플릿 생성")
    p_init.add_argument("--all", action="store_true", help="모든 업체를 대상으로 템플릿 생성")
    p_init.add_argument("--per-shop", type=int, default=3, help="업체당 후기 슬롯 수")
    p_init.add_argument("--overwrite", action="store_true", help="기존 manual 파일 덮어쓰기")
    p_init.add_argument(
        "--seed-drafts",
        action="store_true",
        help="comment 빈칸 대신 업체별 다른 초안 문구 자동 채움(작성 시간 단축)",
    )

    p_apply = sub.add_parser("apply", help="manual JSON을 shops.json에 반영")
    p_apply.add_argument(
        "--strict-unique",
        action="store_true",
        help="comment 중복이 있으면 반영 중단",
    )
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


def should_include(shop: Dict[str, Any], include_all: bool) -> bool:
    if include_all:
        return True
    reviews = shop.get("reviews")
    if not isinstance(reviews, list):
        return True
    return len(reviews) == 0


def make_slots(per_shop: int) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for i in range(max(1, per_shop)):
        d = (date.today() - timedelta(days=i + 1)).isoformat()
        out.append(
            {
                "name": "",
                "rating": 4.9,
                "date": d,
                "comment": "",
            }
        )
    return out


def pick_service_text(shop: Dict[str, Any]) -> str:
    services = shop.get("services") or []
    if isinstance(services, list) and services:
        return str(services[0]).strip() or "관리"
    return "관리"


def loc_text(shop: Dict[str, Any]) -> str:
    region = str(shop.get("region") or "").strip()
    district = str(shop.get("district") or "").strip()
    dong = str(shop.get("dong") or "").strip()
    if region and district and dong:
        return f"{region} {district} {dong}"
    if region and district:
        return f"{region} {district}"
    return region or district or "해당 지역"


def make_seed_reviews(shop: Dict[str, Any], per_shop: int) -> List[Dict[str, Any]]:
    seed = f"{shop.get('id','')}::{shop.get('name','')}"
    import random

    rng = random.Random(seed)
    out: List[Dict[str, Any]] = []
    loc = loc_text(shop)
    svc = pick_service_text(shop)
    for i in range(max(1, per_shop)):
        d = (date.today() - timedelta(days=i + 1)).isoformat()
        name = NAMES[(i + rng.randint(0, 100)) % len(NAMES)]
        rating = round(4.7 + rng.random() * 0.3, 1)
        intro = INTRO_PARTS[(i + rng.randint(0, 100)) % len(INTRO_PARTS)]
        flow = FLOW_PARTS[(i + rng.randint(0, 100)) % len(FLOW_PARTS)]
        finish = FINISH_PARTS[(i + rng.randint(0, 100)) % len(FINISH_PARTS)]
        comment = f"{loc}에서 {svc} 위주로 받았고 {intro} {flow} {finish}"
        out.append({"name": name, "rating": rating, "date": d, "comment": comment})
    return out


def cmd_init(include_all: bool, per_shop: int, overwrite: bool, seed_drafts: bool) -> int:
    if MANUAL_FILE.exists() and not overwrite:
        print(f"이미 존재: {MANUAL_FILE} (덮어쓰려면 --overwrite)")
        return 1

    data = load_wrapped_json(SHOPS_FILE)
    shops = list(data.get("shops") or [])
    rows: List[Dict[str, Any]] = []

    for s in shops:
        if not should_include(s, include_all):
            continue
        rows.append(
            {
                "id": s.get("id", ""),
                "name": s.get("name", ""),
                "region": s.get("region", ""),
                "district": s.get("district", ""),
                "dong": s.get("dong", ""),
                "services": list(s.get("services") or [])[:4],
                "reviews": make_seed_reviews(s, per_shop) if seed_drafts else make_slots(per_shop),
            }
        )

    payload = {
        "_guide": {
            "how_to_write": [
                "각 업체마다 comment를 직접 작성하세요.",
                "같은 문장 복붙 금지, 실제 위치/서비스/응대 맥락을 반영하세요.",
                "작성 후: python manual_shop_reviews.py apply",
                "시간 절약: init 시 --seed-drafts 사용 후 문장 다듬기",
            ],
            "target_count": len(rows),
        },
        "items": rows,
    }
    MANUAL_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"생성 완료: {MANUAL_FILE}")
    print(f"작성 대상 업체 수: {len(rows)}")
    return 0


def normalize_comment(s: str) -> str:
    return " ".join(str(s or "").split()).strip()


def parse_manual_items() -> List[Dict[str, Any]]:
    if not MANUAL_FILE.exists():
        raise FileNotFoundError(f"{MANUAL_FILE} 파일이 없습니다. 먼저 init 실행.")
    payload = json.loads(MANUAL_FILE.read_text(encoding="utf-8"))
    items = payload.get("items") or []
    if not isinstance(items, list):
        raise ValueError("manual-shop-reviews.json 형식 오류: items 배열 필요")
    return items


def build_review_rows(rows: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[str]]:
    out: List[Dict[str, Any]] = []
    errs: List[str] = []
    for i, r in enumerate(rows):
        name = str(r.get("name") or "").strip() or "익명"
        rating = r.get("rating", 4.9)
        dt = str(r.get("date") or "").strip() or date.today().isoformat()
        comment = normalize_comment(r.get("comment"))
        if not comment:
            errs.append(f"빈 comment: index {i}")
            continue
        try:
            rv = float(rating)
        except Exception:
            rv = 4.9
        if rv < 1:
            rv = 1.0
        if rv > 5:
            rv = 5.0
        out.append(
            {
                "name": name,
                "rating": round(rv, 1),
                "date": dt,
                "comment": comment,
            }
        )
    return out, errs


def cmd_apply(strict_unique: bool) -> int:
    items = parse_manual_items()
    data = load_wrapped_json(SHOPS_FILE)
    shops = list(data.get("shops") or [])
    by_id = {str(s.get("id") or ""): s for s in shops}

    all_comments: Dict[str, int] = {}
    applied = 0
    skipped = 0

    for it in items:
        sid = str(it.get("id") or "").strip()
        target = by_id.get(sid)
        if not target:
            skipped += 1
            continue
        rows = list(it.get("reviews") or [])
        reviews, errs = build_review_rows(rows)
        if errs:
            print(f"[skip] {sid}: 유효한 comment 부족 ({len(errs)}개)")
            skipped += 1
            continue

        if strict_unique:
            dup = False
            for rv in reviews:
                c = rv["comment"]
                n = all_comments.get(c, 0)
                if n > 0:
                    dup = True
                    break
            if dup:
                print(f"[중단] 중복 comment 감지: {sid}")
                return 1
        for rv in reviews:
            c = rv["comment"]
            all_comments[c] = all_comments.get(c, 0) + 1

        target["reviews"] = reviews
        rc_old = int(target.get("reviewCount") or 0)
        target["reviewCount"] = max(rc_old, len(reviews))
        applied += 1

    dup_count = sum(1 for _, n in all_comments.items() if n > 1)
    dump_wrapped_json(SHOPS_FILE, data)
    print(f"반영 완료: {applied}개 업체")
    print(f"건너뜀: {skipped}개")
    print(f"중복 comment 수(참고): {dup_count}")
    return 0


def main() -> int:
    args = parse_args()
    if args.cmd == "init":
        return cmd_init(args.all, args.per_shop, args.overwrite, args.seed_drafts)
    if args.cmd == "apply":
        return cmd_apply(args.strict_unique)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())

