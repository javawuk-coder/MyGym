import { useEffect, useState } from 'react'
import { IconLayoutList, IconPencil, IconBarbell, IconChartBar } from '@tabler/icons-react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'
import Header from './components/ui/Header'
import RoutinePage from './pages/RoutinePage'
import LogPage from './pages/LogPage'
import ExercisesPage from './pages/ExercisesPage'
import StatsPage from './pages/StatsPage'
import { useRoutines } from './hooks/useRoutines'
import { useLogs } from './hooks/useLogs'
import { useCustomExercises } from './hooks/useCustomExercises'
import type { Routine } from './types'
import DB from './data/full_db.json'
import './index.css'

type Tab = 'routine' | 'log' | 'exercises' | 'stats'

const TABS: { id: Tab; label: string; Icon: React.FC<{ size?: number }> }[] = [
  { id: 'routine',   label: 'Routine',   Icon: IconLayoutList },
  { id: 'log',       label: 'Log',       Icon: IconPencil },
  { id: 'exercises', label: 'Exercises', Icon: IconBarbell },
  { id: 'stats',     label: 'Stats',     Icon: IconChartBar },
]

function MainApp() {
  const { user, profile } = useAuth()
  const uid = user?.uid
  const [tab, setTab] = useState<Tab>('routine')
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg')
  const [pendingRoutine, setPendingRoutine] = useState<(Routine & { id: string }) | null>(null)

  useEffect(() => { if (profile?.unit) setUnit(profile.unit) }, [profile])

  const { routines, addRoutine, deleteRoutine } = useRoutines(uid)
  const { logs, addLogEntry, deleteLogEntry } = useLogs(uid)
  const { customExercises, addCustomExercise, deleteCustomExercise } = useCustomExercises(uid)

  const allExercises = [...(DB as typeof DB), ...customExercises]

  const handleStartRoutine = (r: Routine & { id: string }) => {
    setPendingRoutine(r)
    setTab('log')
  }

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <Header unit={unit} onUnitToggle={setUnit} />

      <div style={{ display: 'flex', borderBottom: '0.5px solid var(--bd)', marginBottom: '1.5rem' }}>
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1, padding: '12px 0', textAlign: 'center', cursor: 'pointer',
              fontSize: '14px', background: 'none', border: 'none', fontFamily: 'inherit',
              color: tab === id ? 'var(--tp)' : 'var(--ts)',
              borderBottom: tab === id ? '2px solid var(--tp)' : '2px solid transparent',
              fontWeight: tab === id ? 500 : 400,
              transition: 'all .15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
            }}
          >
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {tab === 'routine' && (
        <RoutinePage
          routines={routines}
          allExercises={allExercises}
          onAddRoutine={addRoutine}
          onDeleteRoutine={deleteRoutine}
          onStartRoutine={handleStartRoutine}
        />
      )}
      {tab === 'log' && (
        <LogPage
          logs={logs}
          allExercises={allExercises}
          unit={unit}
          onAddEntry={addLogEntry}
          onDeleteEntry={deleteLogEntry}
          initialRoutine={pendingRoutine}
        />
      )}
      {tab === 'exercises' && (
        <ExercisesPage
          allExercises={allExercises}
          onAddCustom={addCustomExercise}
          onDeleteCustom={deleteCustomExercise}
        />
      )}
      {tab === 'stats' && (
        <StatsPage logs={logs} allExercises={allExercises} unit={unit} />
      )}
    </div>
  )
}

function AppRouter() {
  const { user, profile, loading } = useAuth()
  const path = window.location.pathname

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--s0)' }}>
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

  return <MainApp />
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}
