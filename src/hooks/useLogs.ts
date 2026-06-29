import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, doc, setDoc, getDoc, query, orderBy,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { DayLog, LogEntry } from '../types'

export function useLogs(uid: string | undefined) {
  const [logs, setLogs] = useState<DayLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) { setLogs([]); setLoading(false); return }
    const q = query(collection(db, 'users', uid, 'logs'), orderBy('date', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setLogs(snap.docs.map(d => d.data() as DayLog))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [uid])

  const addLogEntry = async (date: string, entry: LogEntry) => {
    if (!uid) return
    const ref = doc(db, 'users', uid, 'logs', date)
    const snap = await getDoc(ref)
    if (snap.exists()) {
      const existing = snap.data() as DayLog
      await setDoc(ref, { date, exercises: [...existing.exercises, entry] })
    } else {
      await setDoc(ref, { date, exercises: [entry] })
    }
  }

  const deleteLogEntry = async (date: string, entryIndex: number) => {
    if (!uid) return
    const ref = doc(db, 'users', uid, 'logs', date)
    const snap = await getDoc(ref)
    if (!snap.exists()) return
    const existing = snap.data() as DayLog
    const updated = [...existing.exercises]
    updated.splice(entryIndex, 1)
    await setDoc(ref, { date, exercises: updated })
  }

  const addLogEntries = async (date: string, entries: LogEntry[]) => {
    if (!uid) return
    const ref = doc(db, 'users', uid, 'logs', date)
    const snap = await getDoc(ref)
    if (snap.exists()) {
      const existing = snap.data() as DayLog
      await setDoc(ref, { date, exercises: [...existing.exercises, ...entries] })
    } else {
      await setDoc(ref, { date, exercises: entries })
    }
  }

  return { logs, loading, addLogEntry, addLogEntries, deleteLogEntry }
}
