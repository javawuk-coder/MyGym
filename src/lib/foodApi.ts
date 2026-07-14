import type { FoodItem } from '../types'

// ── 로컬 한국 식품 DB ─────────────────────────────────────────────────────────
// calories100g / macros 는 100g 기준, servingSize(g) + servingLabel 로 인분 표시

export interface LocalFood extends FoodItem {
  servingSize?: number    // g
  servingLabel?: string   // "1개", "1공기", "1장" 등
}

const KO_DB: LocalFood[] = [
  // 달걀류
  { id: 'local-egg', name: '달걀 (계란)', source: 'custom', calories100g: 155, carbs100g: 1.1, protein100g: 12.6, fat100g: 10.6, servingSize: 60, servingLabel: '1개 (60g)' },
  { id: 'local-egg-white', name: '달걀 흰자', source: 'custom', calories100g: 52, carbs100g: 0.7, protein100g: 10.9, fat100g: 0.2, servingSize: 33, servingLabel: '1개분 (33g)' },
  { id: 'local-egg-yolk', name: '달걀 노른자', source: 'custom', calories100g: 322, carbs100g: 3.6, protein100g: 15.9, fat100g: 26.5, servingSize: 17, servingLabel: '1개분 (17g)' },
  // 쌀/곡류
  { id: 'local-rice', name: '흰쌀밥', source: 'custom', calories100g: 143, carbs100g: 31.5, protein100g: 2.6, fat100g: 0.3, servingSize: 210, servingLabel: '1공기 (210g)' },
  { id: 'local-rice-brown', name: '현미밥', source: 'custom', calories100g: 141, carbs100g: 29.2, protein100g: 3.1, fat100g: 0.8, servingSize: 210, servingLabel: '1공기 (210g)' },
  { id: 'local-oat', name: '오트밀', source: 'custom', calories100g: 389, carbs100g: 66.3, protein100g: 16.9, fat100g: 6.9, servingSize: 40, servingLabel: '1회분 (40g)' },
  { id: 'local-bread-white', name: '식빵 (흰빵)', source: 'custom', calories100g: 267, carbs100g: 49.2, protein100g: 8.9, fat100g: 3.6, servingSize: 30, servingLabel: '1장 (30g)' },
  // 닭고기
  { id: 'local-chicken-breast', name: '닭가슴살', source: 'custom', calories100g: 109, carbs100g: 0, protein100g: 23.1, fat100g: 1.2, servingSize: 150, servingLabel: '1조각 (150g)' },
  { id: 'local-chicken-thigh', name: '닭다리살', source: 'custom', calories100g: 175, carbs100g: 0, protein100g: 18.3, fat100g: 11.1, servingSize: 100, servingLabel: '1조각 (100g)' },
  { id: 'local-chicken-wing', name: '닭날개', source: 'custom', calories100g: 203, carbs100g: 0, protein100g: 18.3, fat100g: 14.1, servingSize: 50, servingLabel: '1개 (50g)' },
  // 소고기/돼지고기
  { id: 'local-beef-sirloin', name: '소고기 등심', source: 'custom', calories100g: 271, carbs100g: 0, protein100g: 18.5, fat100g: 22.0, servingSize: 150, servingLabel: '1인분 (150g)' },
  { id: 'local-beef-tenderloin', name: '소고기 안심', source: 'custom', calories100g: 189, carbs100g: 0, protein100g: 20.2, fat100g: 12.0, servingSize: 150, servingLabel: '1인분 (150g)' },
  { id: 'local-pork-belly', name: '돼지 삼겹살', source: 'custom', calories100g: 391, carbs100g: 0, protein100g: 14.3, fat100g: 36.5, servingSize: 200, servingLabel: '1인분 (200g)' },
  { id: 'local-pork-loin', name: '돼지 목살', source: 'custom', calories100g: 271, carbs100g: 0, protein100g: 18.0, fat100g: 22.0, servingSize: 150, servingLabel: '1인분 (150g)' },
  // 생선/해산물
  { id: 'local-tuna-can', name: '참치캔 (물참치)', source: 'custom', calories100g: 103, carbs100g: 0, protein100g: 23.4, fat100g: 0.9, servingSize: 100, servingLabel: '1캔 (100g)' },
  { id: 'local-salmon', name: '연어', source: 'custom', calories100g: 208, carbs100g: 0, protein100g: 20.4, fat100g: 13.4, servingSize: 150, servingLabel: '1인분 (150g)' },
  { id: 'local-mackerel', name: '고등어', source: 'custom', calories100g: 205, carbs100g: 0.1, protein100g: 18.8, fat100g: 13.9, servingSize: 150, servingLabel: '1토막 (150g)' },
  // 두부/콩류
  { id: 'local-tofu-firm', name: '두부 (단단한)', source: 'custom', calories100g: 76, carbs100g: 1.9, protein100g: 8.1, fat100g: 4.2, servingSize: 150, servingLabel: '1/3모 (150g)' },
  { id: 'local-tofu-soft', name: '순두부', source: 'custom', calories100g: 47, carbs100g: 1.4, protein100g: 4.6, fat100g: 2.4, servingSize: 200, servingLabel: '1팩 (200g)' },
  { id: 'local-edamame', name: '에다마메 (풋콩)', source: 'custom', calories100g: 122, carbs100g: 8.9, protein100g: 11.9, fat100g: 5.2, servingSize: 100, servingLabel: '1회분 (100g)' },
  // 유제품
  { id: 'local-milk', name: '우유', source: 'custom', calories100g: 61, carbs100g: 4.6, protein100g: 3.2, fat100g: 3.4, servingSize: 200, servingLabel: '1컵 (200ml)' },
  { id: 'local-greek-yogurt', name: '그릭 요거트', source: 'custom', calories100g: 59, carbs100g: 3.6, protein100g: 10.0, fat100g: 0.4, servingSize: 150, servingLabel: '1팩 (150g)' },
  { id: 'local-cottage-cheese', name: '코티지 치즈', source: 'custom', calories100g: 98, carbs100g: 3.4, protein100g: 11.1, fat100g: 4.3, servingSize: 100, servingLabel: '1회분 (100g)' },
  { id: 'local-cheese-slice', name: '슬라이스 치즈', source: 'custom', calories100g: 330, carbs100g: 4.1, protein100g: 23.3, fat100g: 24.6, servingSize: 20, servingLabel: '1장 (20g)' },
  // 채소
  { id: 'local-broccoli', name: '브로콜리', source: 'custom', calories100g: 34, carbs100g: 7.2, protein100g: 2.8, fat100g: 0.4, servingSize: 100, servingLabel: '1회분 (100g)' },
  { id: 'local-spinach', name: '시금치', source: 'custom', calories100g: 23, carbs100g: 3.6, protein100g: 2.9, fat100g: 0.4, servingSize: 100, servingLabel: '1회분 (100g)' },
  { id: 'local-kimchi', name: '김치', source: 'custom', calories100g: 19, carbs100g: 4.0, protein100g: 1.6, fat100g: 0.1, servingSize: 100, servingLabel: '1회분 (100g)' },
  { id: 'local-sweet-potato', name: '고구마', source: 'custom', calories100g: 108, carbs100g: 25.1, protein100g: 1.6, fat100g: 0.1, servingSize: 150, servingLabel: '중간 1개 (150g)' },
  // 과일
  { id: 'local-banana', name: '바나나', source: 'custom', calories100g: 89, carbs100g: 23.0, protein100g: 1.1, fat100g: 0.3, servingSize: 120, servingLabel: '1개 (120g)' },
  { id: 'local-apple', name: '사과', source: 'custom', calories100g: 52, carbs100g: 14.0, protein100g: 0.3, fat100g: 0.2, servingSize: 200, servingLabel: '중간 1개 (200g)' },
  // 단백질 보충제
  { id: 'local-whey-protein', name: '웨이 프로틴', source: 'custom', calories100g: 372, carbs100g: 6.2, protein100g: 75.0, fat100g: 5.0, servingSize: 30, servingLabel: '1스쿱 (30g)' },
  // 견과류
  { id: 'local-almond', name: '아몬드', source: 'custom', calories100g: 579, carbs100g: 21.6, protein100g: 21.2, fat100g: 49.9, servingSize: 30, servingLabel: '1줌 (30g)' },
  { id: 'local-peanut-butter', name: '땅콩버터', source: 'custom', calories100g: 588, carbs100g: 20.0, protein100g: 25.0, fat100g: 50.0, servingSize: 32, servingLabel: '2큰술 (32g)' },
  // 한식
  { id: 'local-dosirak', name: '도시락 (편의점)', source: 'custom', calories100g: 150, carbs100g: 28.0, protein100g: 6.0, fat100g: 2.5, servingSize: 350, servingLabel: '1개 (350g)' },
  { id: 'local-ramyeon', name: '라면 (봉지)', source: 'custom', calories100g: 447, carbs100g: 62.0, protein100g: 10.0, fat100g: 17.0, servingSize: 120, servingLabel: '1봉지 (120g)' },
  { id: 'local-gimbap', name: '김밥 (1줄)', source: 'custom', calories100g: 164, carbs100g: 30.0, protein100g: 5.5, fat100g: 3.0, servingSize: 250, servingLabel: '1줄 (250g)' },
  { id: 'local-bibimbap', name: '비빔밥', source: 'custom', calories100g: 110, carbs100g: 20.0, protein100g: 4.5, fat100g: 2.0, servingSize: 400, servingLabel: '1인분 (400g)' },
]

// 한→영 키워드 매핑 (검색 보완용)
const KO_TO_EN: Record<string, string> = {
  '계란': 'egg', '달걀': 'egg', '닭가슴살': 'chicken breast', '닭': 'chicken',
  '삼겹살': 'pork belly', '소고기': 'beef', '돼지고기': 'pork',
  '연어': 'salmon', '참치': 'tuna', '고등어': 'mackerel',
  '우유': 'milk', '요거트': 'yogurt', '치즈': 'cheese',
  '두부': 'tofu', '브로콜리': 'broccoli', '시금치': 'spinach',
  '고구마': 'sweet potato', '바나나': 'banana', '사과': 'apple',
  '오트밀': 'oatmeal', '식빵': 'bread', '쌀밥': 'rice', '밥': 'cooked rice',
  '프로틴': 'protein powder', '아몬드': 'almond',
}

function searchLocal(query: string): LocalFood[] {
  const q = query.toLowerCase().trim()
  return KO_DB.filter(f =>
    f.name.toLowerCase().includes(q) ||
    q.split(/\s+/).some(w => f.name.toLowerCase().includes(w))
  )
}

interface OFFProduct {
  _id: string
  product_name?: string
  product_name_ko?: string
  brands?: string
  nutriments?: {
    'energy-kcal_100g'?: number
    'carbohydrates_100g'?: number
    'proteins_100g'?: number
    'fat_100g'?: number
  }
}

function normalizeProduct(p: OFFProduct): FoodItem | null {
  const n = p.nutriments
  if (!n) return null
  const cal = n['energy-kcal_100g'] ?? 0
  if (cal <= 0 && !n['proteins_100g'] && !n['carbohydrates_100g']) return null
  const name = p.product_name_ko || p.product_name || ''
  if (!name) return null
  return {
    id: p._id,
    name,
    brand: p.brands?.split(',')[0]?.trim(),
    calories100g: Math.round(cal),
    carbs100g: Math.round((n['carbohydrates_100g'] ?? 0) * 10) / 10,
    protein100g: Math.round((n['proteins_100g'] ?? 0) * 10) / 10,
    fat100g: Math.round((n['fat_100g'] ?? 0) * 10) / 10,
    source: 'openfoodfacts',
  }
}

async function fetchOFF(query: string): Promise<FoodItem[]> {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=15&fields=_id,product_name,product_name_ko,brands,nutriments`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const data = await res.json()
    return (data.products as OFFProduct[] ?? []).map(normalizeProduct).filter(Boolean) as FoodItem[]
  } catch {
    return []
  }
}

export async function searchFood(query: string, _lang = 'ko'): Promise<FoodItem[]> {
  if (!query.trim()) return []

  // 1) 로컬 DB 먼저
  const localResults = searchLocal(query)

  // 2) Open Food Facts: 원본 쿼리 + 영어 번역어 병렬 검색
  const enQuery = KO_TO_EN[query.trim()] ?? null
  const offPromises: Promise<FoodItem[]>[] = [fetchOFF(query)]
  if (enQuery) offPromises.push(fetchOFF(enQuery))
  const offResults = (await Promise.all(offPromises)).flat()

  // 중복 제거 (id 기준)
  const seen = new Set(localResults.map(f => f.id))
  const deduped = offResults.filter(f => !seen.has(f.id))

  return [...localResults, ...deduped]
}

export function calcEntryNutrition(item: FoodItem, amountG: number) {
  const r = amountG / 100
  return {
    calories: Math.round(item.calories100g * r),
    carbs: Math.round(item.carbs100g * r * 10) / 10,
    protein: Math.round(item.protein100g * r * 10) / 10,
    fat: Math.round(item.fat100g * r * 10) / 10,
  }
}

export { KO_DB }
export type { LocalFood }
