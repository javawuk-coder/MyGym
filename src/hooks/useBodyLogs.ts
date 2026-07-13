import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, setDoc, deleteDoc,
  doc, query, orderBy,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { BodyEntry } from '../types'

export function useBodyLogs(uid: string | undefined) {
  const [bodyLogs, setBodyLogs] = useState<BodyEntry[]>([])

  useEffect(() => {
    if (!uid) { setBodyLogs([]); return }
    const q = query(collection(db, 'users', uid, 'bodyLogs'), orderBy('date', 'asc'))
    const unsub = onSnapshot(q, snap => {
      setBodyLogs(snap.docs.map(d => d.data() as BodyEntry))
    })
    return unsub
  }, [uid])

  const saveBodyEntry = async (entry: BodyEntry) => {
    if (!uid) return
    const ref = doc(db, 'users', uid, 'bodyLogs', entry.date)
    const { date, ...rest } = entry
    const clean: Record<string, unknown> = { date }
    for (const [k, v] of Object.entries(rest)) {
      if (v !== undefined && v !== '') clean[k] = v
    }
    await setDoc(ref, clean)
  }

  const saveBodyEntryBatch = async (entries: BodyEntry[]) => {
    if (!uid) return
    await Promise.all(entries.map(entry => {
      const ref = doc(db, 'users', uid!, 'bodyLogs', entry.date)
      const { date, ...rest } = entry
      const clean: Record<string, unknown> = { date }
      for (const [k, v] of Object.entries(rest)) {
        if (v !== undefined && v !== '') clean[k] = v
      }
      return setDoc(ref, clean)
    }))
  }

  const deleteBodyEntry = async (date: string) => {
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'bodyLogs', date))
  }

  return { bodyLogs, saveBodyEntry, saveBodyEntryBatch, deleteBodyEntry }
}
