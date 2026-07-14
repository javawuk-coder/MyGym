import type { FoodItem } from '../types'

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

export async function searchFood(query: string, lang = 'ko'): Promise<FoodItem[]> {
  if (!query.trim()) return []
  try {
    const lc = lang === 'ko' ? 'ko' : lang === 'vi' ? 'vi' : 'en'
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=20&lc=${lc}&fields=_id,product_name,product_name_ko,brands,nutriments`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const data = await res.json()
    const products: OFFProduct[] = data.products ?? []
    return products.map(normalizeProduct).filter(Boolean) as FoodItem[]
  } catch {
    return []
  }
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
