import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, addDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy, updateDoc,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Routine } from '../types'

export function useRoutines(uid: string | undefined) {
  const [routines, setRoutines] = useState<(Routine & { id: string })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) { setRoutines([]); setLoading(false); return }
    const q = query(collection(db, 'users', uid, 'routines'), orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(q, snap => {
      setRoutines(snap.docs.map(d => ({ id: d.id, ...d.data() } as Routine & { id: string })))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [uid])

  const addRoutine = async (routine: Omit<Routine, 'id'>) => {
    if (!uid) return
    await addDoc(collection(db, 'users', uid, 'routines'), {
      ...routine,
      createdAt: serverTimestamp(),
    })
  }

  const updateRoutine = async (routineId: string, data: { name: string; exercises: string[] }) => {
    if (!uid) return
    await updateDoc(doc(db, 'users', uid, 'routines', routineId), data)
  }

  const deleteRoutine = async (routineId: string) => {
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'routines', routineId))
  }

  return { routines, loading, addRoutine, updateRoutine, deleteRoutine }
}
