"""
식약처 식품영양성분 DB → public/kfoods.json 변환 스크립트

사용법:
  python scripts/build-kfood-db.py

출력:
  public/kfoods.json  (lazy-load용 정적 파일)
"""
import sys
import json
import re
import os

sys.stdout.reconfigure(encoding="utf-8")

import pandas as pd

PROCESSED_FILE = r"C:\Users\songj\Downloads\20260626_가공식품DB_298288건.xlsx"
FOOD_FILE      = r"C:\Users\songj\Downloads\20251229_음식DB 19495건.xlsx"
OUT_FILE       = os.path.join(os.path.dirname(__file__), "..", "public", "kfoods.json")

# 가공식품DB에서 추출할 키워드 (식품명 기준)
# 헬스/피트니스 중심으로 좁게 설정 — 라면/과자/음료 등 제외
PROCESSED_KEYWORDS = [
    # 단백질 식품
    "닭가슴살", "닭안심", "닭다리살", "냉동닭", "닭가슴",
    "단백질", "프로틴", "protein",
    "헬스", "머슬", "muscle",
    "보충제",
    # 단백질 바/음료
    "에너지바", "프로틴바", "단백질바", "뉴트리션바", "프로틴 쉐이크", "단백질 쉐이크",
    # 오트밀/그래놀라
    "오트밀", "귀리", "퀴노아", "그래놀라",
    # 유제품 (건강 관련)
    "두유",
    "그릭요거트", "그릭 요거트", "그릭",
    "저지방요거트", "단백질요거트",
    "저지방우유", "무지방우유", "탈지우유",
    "저지방", "무지방", "탈지",
    # 참치/연어 (통조림 포함)
    "참치통조림", "참치 통조림", "참치캔",
    "연어통조림", "훈제연어",
    # 견과류
    "아몬드", "호두", "견과",
    # 건강 시리얼/식품
    "현미", "잡곡", "통곡물",
    "퀴노아",
    # 기능성
    "유산균", "프로바이오틱",
    "콜라겐 단백질",
    # 체중 관리
    "다이어트 식품", "다이어트바", "슬리밍",
]

def parse_basis(basis_str):
    """'100g' → 100.0, '1개(50g)' → 50.0, '30g' → 30.0"""
    if not basis_str or pd.isna(basis_str):
        return 100.0
    s = str(basis_str)
    # 괄호 안 숫자 우선 (예: 1개(50g))
    m = re.search(r'\((\d+(?:\.\d+)?)\s*g\)', s)
    if m:
        return float(m.group(1))
    # 단순 숫자+g
    m = re.search(r'(\d+(?:\.\d+)?)\s*g', s)
    if m:
        return float(m.group(1))
    return 100.0

def parse_num(val):
    try:
        v = float(val)
        return round(v, 2) if v == v else 0.0
    except (TypeError, ValueError):
        return 0.0

def normalize(val, basis):
    """basis g 기준 값 → 100g 기준으로 변환"""
    if basis == 0:
        return 0.0
    return round(parse_num(val) * 100 / basis, 2)

def parse_serving(ref_str):
    """'40g' → (40, '40g'), '1개(50g)' → (50, '1개(50g)')"""
    if not ref_str or pd.isna(ref_str):
        return None, None
    s = str(ref_str).strip()
    m = re.search(r'(\d+(?:\.\d+)?)\s*g', s)
    size = float(m.group(1)) if m else None
    return size, s if s and s != "nan" else None

def row_to_item(row, id_prefix, name_col, brand_col, basis_col, serving_col, cat_col):
    name = str(row[name_col]).strip() if row[name_col] and not pd.isna(row[name_col]) else ""
    if not name or name == "nan":
        return None

    basis = parse_basis(row[basis_col])

    cal   = normalize(row.iloc[17], basis)
    prot  = normalize(row.iloc[19], basis)
    fat   = normalize(row.iloc[20], basis)
    carbs = normalize(row.iloc[22], basis)

    # 에너지·단백질·탄수화물 모두 0이면 스킵
    if cal <= 0 and prot <= 0 and carbs <= 0:
        return None

    brand_raw = row[brand_col] if brand_col is not None else None
    brand = str(brand_raw).strip() if brand_raw and not pd.isna(brand_raw) else None
    if brand in ("해당없음", "nan", "", None):
        brand = None

    serving_raw = row[serving_col] if serving_col is not None else None
    serving_size, serving_label = parse_serving(serving_raw)

    food_code = str(row.iloc[0]).strip()
    item = {
        "id":   id_prefix + food_code,
        "name": name,
        "calories100g": round(cal),
        "carbs100g":    carbs,
        "protein100g":  prot,
        "fat100g":      fat,
        "source": "kfood",
    }
    if brand:
        item["brand"] = brand
    if serving_size:
        item["servingSize"] = serving_size
        item["servingLabel"] = serving_label

    return item


def load_food_db():
    print("음식DB 로딩 중 (19,495건)...")
    df = pd.read_excel(FOOD_FILE, engine="openpyxl")
    print(f"  → {len(df)}행 로드됨")

    items = []
    for _, row in df.iterrows():
        item = row_to_item(
            row,
            id_prefix="kf-d-",
            name_col=1,
            brand_col=155,     # 업체명
            basis_col=16,
            serving_col=153,   # 1인(회)분량 참고량
            cat_col=7,
        )
        if item:
            items.append(item)

    print(f"  → {len(items)}건 변환 완료")
    return items


def load_processed_db():
    print("가공식품DB 로딩 중 (298,288건) — 시간이 걸릴 수 있습니다...")
    df = pd.read_excel(PROCESSED_FILE, engine="openpyxl")
    print(f"  → {len(df)}행 로드됨")

    # 키워드 필터 (식품명 컬럼)
    name_series = df.iloc[:, 1].astype(str)
    pattern = "|".join(re.escape(k) for k in PROCESSED_KEYWORDS)
    mask = name_series.str.contains(pattern, case=False, na=False)
    filtered = df[mask]
    print(f"  → 키워드 필터 후 {len(filtered)}건")

    items = []
    for _, row in filtered.iterrows():
        item = row_to_item(
            row,
            id_prefix="kf-p-",
            name_col=1,
            brand_col=155,     # 제조사명
            basis_col=16,
            serving_col=152,   # 1회 섭취참고량
            cat_col=7,
        )
        if item:
            items.append(item)

    print(f"  → {len(items)}건 변환 완료")
    return items


def main():
    food_items = load_food_db()
    proc_items = load_processed_db()

    # 합치기 + 중복 제거 (id 기준)
    all_items = food_items + proc_items
    seen = set()
    unique = []
    for item in all_items:
        if item["id"] not in seen:
            seen.add(item["id"])
            unique.append(item)

    print(f"\n총 {len(unique)}건 (중복 제거 후)")

    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(unique, f, ensure_ascii=False, separators=(",", ":"))

    size_kb = os.path.getsize(OUT_FILE) / 1024
    print(f"저장 완료: {OUT_FILE}")
    print(f"파일 크기: {size_kb:.0f} KB ({size_kb/1024:.1f} MB)")


if __name__ == "__main__":
    main()
