import { useState, useEffect } from 'react'
import { collection, doc, onSnapshot, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { FavoriteFood, FoodItem } from '../types'

export function useFavoriteFoods(uid: string | undefined) {
  const [favorites, setFavorites] = useState<FavoriteFood[]>([])

  useEffect(() => {
    if (!uid) return
    const q = query(collection(db, 'users', uid, 'dietFavorites'), orderBy('name'))
    return onSnapshot(q, snap => {
      setFavorites(snap.docs.map(d => ({ id: d.id, ...d.data() }) as FavoriteFood))
    })
  }, [uid])

  function isFavorite(id: string) {
    return favorites.some(f => f.id === id)
  }

  async function toggleFavorite(food: FoodItem) {
    if (!uid) return
    const ref = doc(db, 'users', uid, 'dietFavorites', food.id)
    if (isFavorite(food.id)) {
      await deleteDoc(ref)
    } else {
      const fav: Omit<FavoriteFood, 'id'> = {
        name: food.name, brand: food.brand,
        calories100g: food.calories100g, carbs100g: food.carbs100g,
        protein100g: food.protein100g, fat100g: food.fat100g,
        source: food.source,
      }
      await setDoc(ref, fav)
    }
  }

  return { favorites, isFavorite, toggleFavorite }
}
