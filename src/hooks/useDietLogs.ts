import { useState, useEffect } from 'react'
import { collection, doc, onSnapshot, setDoc, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { DietLog, MealSlotKey, DietEntry } from '../types'

const EMPTY_MEALS = (): DietLog['meals'] => ({
  breakfast: [], snackAm: [], lunch: [], snackPm: [], dinner: [], snackEve: [],
})

export function useDietLogs(uid: string | undefined) {
  const [logs, setLogs] = useState<DietLog[]>([])

  useEffect(() => {
    if (!uid) return
    const q = query(collection(db, 'users', uid, 'dietLogs'), orderBy('date', 'desc'), limit(30))
    return onSnapshot(q, snap => {
      setLogs(snap.docs.map(d => d.data() as DietLog))
    })
  }, [uid])

  function getLog(date: string): DietLog {
    return logs.find(l => l.date === date) ?? { date, meals: EMPTY_MEALS() }
  }

  async function addEntry(date: string, slot: MealSlotKey, entry: DietEntry) {
    if (!uid) return
    const log = getLog(date)
    const updated: DietLog = {
      ...log,
      meals: { ...log.meals, [slot]: [...log.meals[slot], entry] },
    }
    await setDoc(doc(db, 'users', uid, 'dietLogs', date), updated)
  }

  async function addEntries(date: string, slot: MealSlotKey, entries: DietEntry[]) {
    if (!uid) return
    const log = getLog(date)
    const updated: DietLog = {
      ...log,
      meals: { ...log.meals, [slot]: [...log.meals[slot], ...entries] },
    }
    await setDoc(doc(db, 'users', uid, 'dietLogs', date), updated)
  }

  async function removeEntry(date: string, slot: MealSlotKey, index: number) {
    if (!uid) return
    const log = getLog(date)
    const newSlot = log.meals[slot].filter((_, i) => i !== index)
    await setDoc(doc(db, 'users', uid, 'dietLogs', date), {
      ...log, meals: { ...log.meals, [slot]: newSlot },
    })
  }

  return { logs, getLog, addEntry, addEntries, removeEntry }
}
