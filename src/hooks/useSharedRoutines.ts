import { collection, addDoc, getDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Routine } from '../types'

export interface SharedRoutine {
  id: string
  name: string
  exercises: Routine['exercises']
  format?: Routine['format']
  authorId: string
  sharedAt: unknown
}

export function useSharedRoutines() {
  const shareRoutine = async (routine: Routine & { id: string }, uid: string): Promise<string> => {
    const ref = await addDoc(collection(db, 'shared_routines'), {
      name: routine.name,
      exercises: routine.exercises,
      format: routine.format ?? null,
      authorId: uid,
      sharedAt: serverTimestamp(),
    })
    return ref.id
  }

  const getSharedRoutine = async (shareId: string): Promise<SharedRoutine | null> => {
    const snap = await getDoc(doc(db, 'shared_routines', shareId))
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() } as SharedRoutine
  }

  return { shareRoutine, getSharedRoutine }
}
