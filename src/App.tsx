import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'
import Header from './components/ui/Header'
import './index.css'

function AppRouter() {
  const { user, profile, loading } = useAuth()
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg')
  const path = window.location.pathname

  useEffect(() => {
    if (profile?.unit) setUnit(profile.unit)
  }, [profile])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--s0)',
      }}>
        <div style={{ fontSize: '32px' }}>💪</div>
      </div>
    )
  }

  if (!user) return <LoginPage />

  if (path === '/admin') {
    if (profile?.role !== 'admin') {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'var(--ts)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
            <p>Admin 권한이 필요합니다</p>
            <a href="/" style={{ fontSize: '13px', color: '#185FA5', marginTop: '8px', display: 'block' }}>← 앱으로 돌아가기</a>
          </div>
        </div>
      )
    }
    return <AdminPage />
  }

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <Header unit={unit} onUnitToggle={setUnit} />
      <div style={{
        background: 'var(--s2)', border: '0.5px solid var(--bd)',
        borderRadius: '12px', padding: '2rem', textAlign: 'center', color: 'var(--ts)',
      }}>
        <div style={{ fontSize: '24px', marginBottom: '12px' }}>🏗️</div>
        <p style={{ fontSize: '14px' }}>
          안녕하세요, <strong>{profile?.displayName}</strong>님!<br />
          Routine · Log · Exercises · Stats 탭이 곧 여기에 붙을 예정이에요.
        </p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}
