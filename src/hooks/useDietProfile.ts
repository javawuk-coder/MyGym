import { useState, useEffect } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { DietProfile } from '../types'

export function useDietProfile(uid: string | undefined) {
  const [profile, setProfile] = useState<DietProfile | null | undefined>(undefined)

  useEffect(() => {
    if (!uid) { setProfile(null); return }
    const ref = doc(db, 'users', uid, 'dietProfile', 'settings')
    return onSnapshot(ref, snap => {
      setProfile(snap.exists() ? (snap.data() as DietProfile) : null)
    })
  }, [uid])

  async function saveProfile(p: DietProfile) {
    if (!uid) return
    await setDoc(doc(db, 'users', uid, 'dietProfile', 'settings'), p)
  }

  return { profile, saveProfile }
}
