import type { ActivityLevel, FitnessGoal, DietProfile } from '../types'

const ACTIVITY_MULT: Record<ActivityLevel, number> = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
}

export function calcBMR(weight: number, height: number, age: number, gender: 'male' | 'female'): number {
  return Math.round(gender === 'male'
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161)
}

export function calcTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULT[activityLevel])
}

export function calcGoalCalories(tdee: number, goal: FitnessGoal): number {
  if (goal === 'cut') return tdee - 400
  if (goal === 'bulk') return tdee + 275
  return tdee
}

export function calcMacros(calories: number, weight: number, goal: FitnessGoal, protMultiplier: number) {
  const protein = Math.round(weight * protMultiplier)
  const fat = Math.round((calories * (goal === 'cut' ? 0.22 : 0.25)) / 9)
  const carbs = Math.max(130, Math.round((calories - protein * 4 - fat * 9) / 4))
  return { protein, fat, carbs }
}

export function buildProfile(
  weight: number, height: number, age: number,
  gender: 'male' | 'female', activityLevel: ActivityLevel,
  goal: FitnessGoal, protMultiplier: number,
): DietProfile {
  const bmr = calcBMR(weight, height, age, gender)
  const tdee = calcTDEE(bmr, activityLevel)
  const calories = calcGoalCalories(tdee, goal)
  const { protein, fat, carbs } = calcMacros(calories, weight, goal, protMultiplier)
  return { calories, carbs, protein, fat, weight, height, age, gender, activityLevel, goal, protMultiplier, bodyLinked: true }
}

export const MEAL_SLOTS = [
  { key: 'breakfast' as const, labelKey: 'dietBreakfast', pct: 0.20 },
  { key: 'snackAm'   as const, labelKey: 'dietSnackAm',   pct: 0.08 },
  { key: 'lunch'     as const, labelKey: 'dietLunch',      pct: 0.26 },
  { key: 'snackPm'   as const, labelKey: 'dietSnackPm',    pct: 0.09 },
  { key: 'dinner'    as const, labelKey: 'dietDinner',      pct: 0.30 },
  { key: 'snackEve'  as const, labelKey: 'dietSnackEve',    pct: 0.07 },
]

export function sumEntries(entries: { calories: number; carbs: number; protein: number; fat: number }[]) {
  return entries.reduce((a, e) => ({
    calories: a.calories + e.calories,
    carbs: a.carbs + e.carbs,
    protein: a.protein + e.protein,
    fat: a.fat + e.fat,
  }), { calories: 0, carbs: 0, protein: 0, fat: 0 })
}
