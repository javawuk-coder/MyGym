import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, addDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy, updateDoc,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Routine, RoutineExercise, WorkoutFormat } from '../types'

export function useRoutines(uid: string | undefined) {
  const [routines, setRoutines] = useState<(Routine & { id: string })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) { setRoutines([]); setLoading(false); return }
    const q = query(collection(db, 'users', uid, 'routines'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      const raw = snap.docs.map(d => ({ id: d.id, ...d.data() } as Routine & { id: string })
      )
      // 즐겨찾기 상단 고정, 나머지는 최신순 유지
      raw.sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0))
      setRoutines(raw)
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

  const updateRoutine = async (routineId: string, data: { name: string; exercises: RoutineExercise[]; format: WorkoutFormat }) => {
    if (!uid) return
    await updateDoc(doc(db, 'users', uid, 'routines', routineId), data)
  }

  const saveRoutineNotes = async (routineId: string, notes: { exId: string; note?: string }[]) => {
    if (!uid) return
    const routine = routines.find(r => r.id === routineId)
    if (!routine) return
    const updatedExercises = routine.exercises.map(re => {
      const entry = notes.find(n => n.exId === re.exId)
      if (!entry) return re
      if (entry.note) return { ...re, note: entry.note }
      const { note: _n, ...rest } = re
      return rest
    })
    await updateDoc(doc(db, 'users', uid, 'routines', routineId), { exercises: updatedExercises })
  }

  const deleteRoutine = async (routineId: string) => {
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'routines', routineId))
  }

  const toggleRoutineFavorite = async (routineId: string, value: boolean) => {
    if (!uid) return
    await updateDoc(doc(db, 'users', uid, 'routines', routineId), { favorite: value })
  }

  const patchRoutineExercises = async (routineId: string, exercises: RoutineExercise[]) => {
    if (!uid) return
    await updateDoc(doc(db, 'users', uid, 'routines', routineId), { exercises })
  }

  return { routines, loading, addRoutine, updateRoutine, saveRoutineNotes, deleteRoutine, patchRoutineExercises, toggleRoutineFavorite }
}
