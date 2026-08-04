import { useEffect, useState } from 'react'
import { IconLayoutList, IconPencil, IconBarbell, IconChartBar, IconScale, IconSalad } from '@tabler/icons-react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'
import Header from './components/ui/Header'
import RoutinePage from './pages/RoutinePage'
import LogPage from './pages/LogPage'
import ExercisesPage from './pages/ExercisesPage'
import StatsPage from './pages/StatsPage'
import BodyPage from './pages/BodyPage'
import DietPage from './pages/DietPage'
import OnboardingModal from './components/OnboardingModal'
import SharedRoutinePage from './pages/SharedRoutinePage'
import { useRoutines } from './hooks/useRoutines'
import { useLogs } from './hooks/useLogs'
import { useCustomExercises } from './hooks/useCustomExercises'
import { useBodyLogs } from './hooks/useBodyLogs'
import { useDietProfile } from './hooks/useDietProfile'
import { useDietLogs } from './hooks/useDietLogs'
import { useFavoriteFoods } from './hooks/useFavoriteFoods'
import { useCustomFoods } from './hooks/useCustomFoods'
import { useMealTemplates } from './hooks/useMealTemplates'
import type { Routine, Exercise } from './types'
import DB from './data/full_db.json'
import { tr, type Lang } from './lib/i18n'
import './index.css'

type Tab = 'routine' | 'log' | 'exercises' | 'stats' | 'body' | 'diet'

function MainApp() {
  const { user, profile } = useAuth()
  const uid = user?.uid
  const [tab, setTab] = useState<Tab>('routine')
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg')
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem('lang') as Lang | null
    if (saved) return saved
    const nav = navigator.language.toLowerCase()
    if (nav.startsWith('ko')) return 'ko'
    if (nav.startsWith('vi')) return 'vi'
    return 'en'
  })
  const [pendingRoutine, setPendingRoutine] = useState<(Routine & { id: string }) | null>(null)
  const shareId = new URLSearchParams(window.location.search).get('r')
  const [isLogging, setIsLogging] = useState(false)

  useEffect(() => { if (profile?.unit) setUnit(profile.unit) }, [profile])

  const handleLangChange = (l: Lang) => { setLang(l); localStorage.setItem('lang', l) }

  const TABS: { id: Tab; label: string; Icon: React.FC<{ size?: number }> }[] = [
    { id: 'routine',   label: tr(lang, 'tabRoutine'),   Icon: IconLayoutList },
    { id: 'log',       label: tr(lang, 'tabLog'),       Icon: IconPencil },
    { id: 'exercises', label: tr(lang, 'tabExercises'), Icon: IconBarbell },
    { id: 'stats',     label: tr(lang, 'tabStats'),     Icon: IconChartBar },
    { id: 'body',      label: tr(lang, 'tabBody'),      Icon: IconScale },
    { id: 'diet',      label: tr(lang, 'tabDiet'),      Icon: IconSalad },
  ]

  const { routines, addRoutine, updateRoutine, saveRoutineNotes, deleteRoutine } = useRoutines(uid)
  const { logs, addLogEntries, deleteLogEntry } = useLogs(uid)
  const { customExercises, addCustomExercise, deleteCustomExercise } = useCustomExercises(uid)
  const { bodyLogs, saveBodyEntry, saveBodyEntryBatch, deleteBodyEntry } = useBodyLogs(uid)
  const { profile: dietProfile, saveProfile: saveDietProfile } = useDietProfile(uid)
  const { logs: dietLogs, getLog, addEntry: addDietEntry, addEntries: addDietEntries, removeEntry: removeDietEntry } = useDietLogs(uid)
  const { favorites, isFavorite, toggleFavorite } = useFavoriteFoods(uid)
  const { customFoods, saveCustomFood, updateCustomFood, deleteCustomFood } = useCustomFoods(uid)
  const { templates, saveMealTemplate, deleteMealTemplate } = useMealTemplates(uid)

  const allExercises = [...(DB as Exercise[]), ...customExercises]

  const handleStartRoutine = (r: Routine & { id: string }) => {
    setPendingRoutine(r)
    setTab('log')
  }

  if (shareId) {
    return (
      <SharedRoutinePage
        shareId={shareId}
        lang={lang}
        allExercises={allExercises}
        onAddRoutine={addRoutine}
        onDone={() => { window.history.replaceState({}, '', '/'); window.location.reload() }}
      />
    )
  }

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {!isLogging && <Header unit={unit} onUnitToggle={setUnit} lang={lang} onLangChange={handleLangChange} />}

      {!isLogging && (
        <div style={{ display: 'flex', borderBottom: '0.5px solid var(--bd)', marginBottom: '1.5rem' }}>
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                flex: 1, padding: '10px 0', textAlign: 'center', cursor: 'pointer',
                fontSize: '12px', background: 'none', border: 'none', fontFamily: 'inherit',
                color: tab === id ? 'var(--tp)' : 'var(--ts)',
                borderBottom: tab === id ? '2px solid var(--tp)' : '2px solid transparent',
                fontWeight: tab === id ? 500 : 400,
                transition: 'all .15s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px',
              }}
            >
              <Icon size={15} />{label}
            </button>
          ))}
        </div>
      )}

      {tab === 'routine' && (
        <RoutinePage
          routines={routines}
          allExercises={allExercises}
          onAddRoutine={addRoutine}
          onUpdateRoutine={updateRoutine}
          onDeleteRoutine={deleteRoutine}
          onStartRoutine={handleStartRoutine}
          lang={lang}
          uid={uid}
        />
      )}
      {tab === 'log' && (
        <LogPage
          logs={logs}
          routines={routines}
          allExercises={allExercises}
          unit={unit}
          lang={lang}
          onAddEntries={addLogEntries}
          onDeleteEntry={deleteLogEntry}
          onSaveRoutineNotes={saveRoutineNotes}
          onLoggingChange={setIsLogging}
          initialRoutine={pendingRoutine}
          onConsumedInitial={() => setPendingRoutine(null)}
        />
      )}
      {tab === 'exercises' && (
        <ExercisesPage
          allExercises={allExercises}
          onAddCustom={addCustomExercise}
          onDeleteCustom={deleteCustomExercise}
          lang={lang}
        />
      )}
      {tab === 'stats' && (
        <StatsPage logs={logs} allExercises={allExercises} unit={unit} lang={lang} />
      )}
      {tab === 'body' && (
        <BodyPage bodyLogs={bodyLogs} lang={lang} profile={dietProfile} onSave={saveBodyEntry} onSaveBatch={saveBodyEntryBatch} onDelete={deleteBodyEntry} />
      )}
      {tab === 'diet' && (
        <DietPage
          uid={uid}
          lang={lang}
          bodyLogs={bodyLogs}
          profile={dietProfile}
          getLog={getLog}
          logs={dietLogs}
          favorites={favorites}
          customFoods={customFoods}
          templates={templates}
          onSaveProfile={saveDietProfile}
          onAddEntry={addDietEntry}
          onAddEntries={addDietEntries}
          onRemoveEntry={removeDietEntry}
          onToggleFav={toggleFavorite}
          isFavorite={isFavorite}
          onSaveCustomFood={saveCustomFood}
          onUpdateCustomFood={updateCustomFood}
          onDeleteCustomFood={deleteCustomFood}
          onSaveMealTemplate={saveMealTemplate}
          onDeleteMealTemplate={deleteMealTemplate}
        />
      )}
      <OnboardingModal />
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
