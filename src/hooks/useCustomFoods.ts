import { useState, useEffect } from 'react'
import { collection, doc, onSnapshot, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore'
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
  }

  async function deleteCustomFood(id: string) {
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'dietCustomFoods', id))
  }

  return { customFoods, saveCustomFood, updateCustomFood, deleteCustomFood }
}
