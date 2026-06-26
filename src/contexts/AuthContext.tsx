import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, googleProvider, db } from '../lib/firebase'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL: string
  role: 'user' | 'admin'
  unit: 'kg' | 'lb'
  createdAt: unknown
  lastLoginAt: unknown
  disabled: boolean
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  isAdmin: boolean
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        // Firestore에서 프로필 가져오기 (없으면 최초 생성)
        const ref = doc(db, 'users', u.uid)
        const snap = await getDoc(ref)

        if (!snap.exists()) {
          // 첫 로그인 → 프로필 생성
          const newProfile: UserProfile = {
            uid: u.uid,
            email: u.email ?? '',
            displayName: u.displayName ?? '',
            photoURL: u.photoURL ?? '',
            role: 'user',
            unit: 'kg',
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            disabled: false,
          }
          await setDoc(ref, newProfile)
          setProfile(newProfile)
        } else {
          // 기존 유저 → lastLoginAt 업데이트
          await setDoc(ref, { lastLoginAt: serverTimestamp() }, { merge: true })
          setProfile(snap.data() as UserProfile)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider)
  }

  const logout = async () => {
    await signOut(auth)
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
