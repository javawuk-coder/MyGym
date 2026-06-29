import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Exercise } from '../types'

export function useCustomExercises(uid: string | undefined) {
  const [customExercises, setCustomExercises] = useState<Exercise[]>([])

  useEffect(() => {
    if (!uid) { setCustomExercises([]); return }
    const unsub = onSnapshot(collection(db, 'users', uid, 'customExercises'), snap => {
      setCustomExercises(snap.docs.map(d => ({ id: d.id, custom: true, ...d.data() } as Exercise)))
    })
    return unsub
  }, [uid])

  const addCustomExercise = async (ex: Omit<Exercise, 'id' | 'custom'>) => {
    if (!uid) return
    await addDoc(collection(db, 'users', uid, 'customExercises'), {
      ...ex,
      custom: true,
      createdAt: serverTimestamp(),
    })
  }

  const deleteCustomExercise = async (id: string) => {
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'customExercises', id))
  }

  return { customExercises, addCustomExercise, deleteCustomExercise }
}
