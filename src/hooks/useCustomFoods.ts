import { useState, useEffect } from 'react'
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { CustomFood } from '../types'

export function useCustomFoods(uid: string | undefined) {
  const [customFoods, setCustomFoods] = useState<CustomFood[]>([])

  useEffect(() => {
    if (!uid) return
    const q = query(collection(db, 'users', uid, 'dietCustomFoods'), orderBy('name'))
    return onSnapshot(q, snap => {
      setCustomFoods(snap.docs.map(d => ({ id: d.id, ...d.data() }) as CustomFood))
    })
  }, [uid])

  async function saveCustomFood(food: Omit<CustomFood, 'id'>) {
    if (!uid) return
    const ref = doc(collection(db, 'users', uid, 'dietCustomFoods'))
    await setDoc(ref, { ...food, createdAt: new Date() })
  }

  async function updateCustomFood(id: string, food: Omit<CustomFood, 'id'>) {
    if (!uid) return
    await setDoc(doc(db, 'users', uid, 'dietCustomFoods', id), { ...food })
    // 즐겨찾기에도 같은 ID 문서가 있으면 동기화 (없으면 무시)
    const favUpdate: Record<string, unknown> = {
      name: food.name,
      calories100g: food.calories100g,
      carbs100g: food.carbs100g,
      protein100g: food.protein100g,
      fat100g: food.fat100g,
      source: 'custom',
      ...(food.brand != null && { brand: food.brand }),
    }
    try { await updateDoc(doc(db, 'users', uid, 'dietFavorites', id), favUpdate) } catch { /* not favorited */ }
  }

  async function deleteCustomFood(id: string) {
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'dietCustomFoods', id))
  }

  return { customFoods, saveCustomFood, updateCustomFood, deleteCustomFood }
}
