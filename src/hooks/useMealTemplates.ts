import { useState, useEffect } from 'react'
import { collection, doc, onSnapshot, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { MealTemplate, DietEntry } from '../types'

export function useMealTemplates(uid: string | undefined) {
  const [templates, setTemplates] = useState<MealTemplate[]>([])

  useEffect(() => {
    if (!uid) return
    const q = query(collection(db, 'users', uid, 'dietMealTemplates'), orderBy('name'))
    return onSnapshot(q, snap => {
      setTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() }) as MealTemplate))
    })
  }, [uid])

  async function saveMealTemplate(name: string, entries: DietEntry[]) {
    if (!uid) return
    const total = entries.reduce((a, e) => ({
      totalCalories: a.totalCalories + e.calories,
      totalCarbs: a.totalCarbs + e.carbs,
      totalProtein: a.totalProtein + e.protein,
      totalFat: a.totalFat + e.fat,
    }), { totalCalories: 0, totalCarbs: 0, totalProtein: 0, totalFat: 0 })
    const ref = doc(collection(db, 'users', uid, 'dietMealTemplates'))
    await setDoc(ref, { name, entries, ...total, createdAt: new Date() })
  }

  async function deleteMealTemplate(id: string) {
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'dietMealTemplates', id))
  }

  return { templates, saveMealTemplate, deleteMealTemplate }
}
