import { useState, useEffect, useRef, useCallback } from 'react'
import { IconChevronLeft, IconChevronRight, IconSearch, IconStar, IconStarFilled, IconPlus, IconX, IconTrash } from '@tabler/icons-react'
import { tr, type Lang } from '../lib/i18n'
import { buildProfile, calcMacros, calcBMR, calcTDEE, calcGoalCalories, MEAL_SLOTS } from '../lib/dietCalc'
import { searchFood, calcEntryNutrition } from '../lib/foodApi'
import type { LocalFood } from '../lib/foodApi'
import type {
  DietProfile, DietLog, MealSlotKey, DietEntry,
  FoodItem, FavoriteFood, CustomFood, MealTemplate, BodyEntry, ActivityLevel, FitnessGoal,
} from '../types'

// ── helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function dateLabel(d: string, today: string, lang: Lang) {
  if (d === today) return tr(lang, 'today')
  const dt = new Date(d + 'T00:00:00')
  return lang === 'ko'
    ? `${dt.getMonth() + 1}월 ${dt.getDate()}일`
    : dt.toLocaleDateString(lang === 'vi' ? 'vi' : 'en', { month: 'short', day: 'numeric' })
}

// ── Types ────────────────────────────────────────────────────────────────────

interface Props {
  uid: string | undefined
  lang: Lang
  bodyLogs: BodyEntry[]
  profile: DietProfile | null | undefined
  getLog: (date: string) => DietLog
  logs: DietLog[]
  favorites: FavoriteFood[]
  customFoods: CustomFood[]
  templates: MealTemplate[]
  onSaveProfile: (p: DietProfile) => Promise<void>
  onAddEntry: (date: string, slot: MealSlotKey, entry: DietEntry) => Promise<void>
  onAddEntries: (date: string, slot: MealSlotKey, entries: DietEntry[]) => Promise<void>
  onRemoveEntry: (date: string, slot: MealSlotKey, index: number) => Promise<void>
  onToggleFav: (food: FoodItem) => Promise<void>
  isFavorite: (id: string) => boolean
  onSaveCustomFood: (food: Omit<CustomFood, 'id'>) => Promise<void>
  onDeleteCustomFood: (id: string) => Promise<void>
  onSaveMealTemplate: (name: string, entries: DietEntry[]) => Promise<void>
  onDeleteMealTemplate: (id: string) => Promise<void>
}

type FoodTab = 'search' | 'fav' | 'meal' | 'mine'

// ── GOAL EDIT MODAL ──────────────────────────────────────────────────────────

function GoalEditModal({ lang, profile, onSave, onClose }: {
  lang: Lang; profile: DietProfile; onSave: (p: DietProfile) => Promise<void>; onClose: () => void
}) {
  const [goal, setGoal] = useState<FitnessGoal>(profile.goal)
  const [activity, setActivity] = useState<ActivityLevel>(profile.activityLevel)
  const [protMult, setProtMult] = useState(profile.protMultiplier)
  const [saving, setSaving] = useState(false)

  const bmr = calcBMR(profile.weight, profile.height, profile.age, profile.gender)
  const previewCals = calcGoalCalories(calcTDEE(bmr, activity), goal)

  async function handleSave() {
    setSaving(true)
    await onSave(buildProfile(profile.weight, profile.height, profile.age, profile.gender, activity, goal, protMult))
    setSaving(false)
    onClose()
  }

  const GOALS: { key: FitnessGoal; icon: string; labelKo: string; labelEn: string; desc: string }[] = [
    { key: 'cut',      icon: '🔥', labelKo: '다이어트', labelEn: 'Cut',      desc: '-400 kcal' },
    { key: 'maintain', icon: '⚖️', labelKo: '유지',    labelEn: 'Maintain', desc: 'TDEE' },
    { key: 'bulk',     icon: '💪', labelKo: '벌크업',  labelEn: 'Bulk',     desc: '+275 kcal' },
  ]

  const ACTIVITIES: { key: ActivityLevel; labelKo: string; labelEn: string; mult: string }[] = [
    { key: 'sedentary',   labelKo: '거의 없음',   labelEn: 'Sedentary',   mult: '×1.2' },
    { key: 'light',       labelKo: '가벼운 활동', labelEn: 'Light',       mult: '×1.375' },
    { key: 'moderate',    labelKo: '보통 활동',   labelEn: 'Moderate',    mult: '×1.55' },
    { key: 'active',      labelKo: '활발한 활동', labelEn: 'Active',      mult: '×1.725' },
    { key: 'very_active', labelKo: '매우 활발',   labelEn: 'Very Active', mult: '×1.9' },
  ]

  return (
    <div style={{ minHeight: '100vh', padding: '0 0 40px' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ts)', padding: '4px', display: 'flex', alignItems: 'center' }}><IconChevronLeft size={22} /></button>
          <div style={{ fontSize: '17px', fontWeight: 800 }}>{lang === 'ko' ? '목표 편집' : 'Edit Goals'}</div>
          <div style={{ width: 30 }} />
        </div>

        {/* 목표 선택 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--tm)', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: '8px' }}>
            {lang === 'ko' ? '목표' : 'Goal'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {GOALS.map(g => {
              const active = goal === g.key
              return (
                <button key={g.key} onClick={() => setGoal(g.key)} style={{ padding: '11px 6px', border: `.5px solid ${active ? 'var(--green)' : 'var(--bd)'}`, background: active ? '#22c55e18' : 'var(--bg2)', borderRadius: 'var(--r)', cursor: 'pointer', textAlign: 'center', transition: 'all .15s' }}>
                  <div style={{ fontSize: '18px', marginBottom: '3px' }}>{g.icon}</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: active ? 'var(--green)' : 'var(--ts)' }}>{lang === 'ko' ? g.labelKo : g.labelEn}</div>
                  <div style={{ fontSize: '10px', color: 'var(--tm)', marginTop: '2px' }}>{g.desc}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 활동량 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--tm)', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: '8px' }}>
            {lang === 'ko' ? '활동량' : 'Activity'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {ACTIVITIES.map(a => {
              const active = activity === a.key
              return (
                <button key={a.key} onClick={() => setActivity(a.key)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', border: `.5px solid ${active ? 'var(--blue)' : 'var(--bd)'}`, background: active ? '#3b82f618' : 'var(--bg2)', borderRadius: 'var(--r)', cursor: 'pointer', transition: 'all .15s' }}>
                  <span style={{ fontSize: '13px', fontWeight: active ? 700 : 400, color: active ? 'var(--blue)' : 'var(--ts)' }}>{lang === 'ko' ? a.labelKo : a.labelEn}</span>
                  <span style={{ fontSize: '11px', color: 'var(--tm)' }}>{a.mult}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 단백질 배율 슬라이더 */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--tm)', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: '8px' }}>
            {lang === 'ko' ? `단백질 목표 — ${protMult.toFixed(1)}g/kg` : `Protein target — ${protMult.toFixed(1)}g/kg`}
          </div>
          <input type="range" min="1.2" max="2.4" step="0.1" value={protMult}
            onChange={e => setProtMult(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--blue)', cursor: 'pointer' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--tm)', marginTop: '4px' }}>
            <span>1.2 g/kg</span><span>2.4 g/kg</span>
          </div>
        </div>

        {/* 예상 칼로리 미리보기 */}
        <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bd)', borderRadius: 'var(--r)', padding: '14px', marginBottom: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '4px' }}>
            {lang === 'ko' ? '예상 목표 칼로리' : 'Est. Target Calories'}
          </div>
          <div style={{ fontSize: '30px', fontWeight: 900, color: '#E8930A', fontVariantNumeric: 'tabular-nums' }}>{previewCals.toLocaleString()}</div>
          <div style={{ fontSize: '11px', color: 'var(--tm)' }}>kcal / day</div>
        </div>

        <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '14px', background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 'var(--r)', fontSize: '15px', fontWeight: 800, cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
          {saving ? (lang === 'ko' ? '저장 중...' : 'Saving...') : (lang === 'ko' ? '저장' : 'Save')}
        </button>
    </div>
  )
}

// ── ONBOARDING ───────────────────────────────────────────────────────────────

function Onboarding({ lang, bodyLogs, onSave }: {
  lang: Lang; bodyLogs: BodyEntry[]; onSave: (p: DietProfile) => Promise<void>
}) {
  const latestWeight = bodyLogs[bodyLogs.length - 1]?.weight ?? 70
  const [step, setStep] = useState(1)
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [age, setAge] = useState(30)
  const [height, setHeight] = useState(170)
  const [weight, setWeight] = useState(latestWeight)
  const [activity, setActivity] = useState<ActivityLevel>('moderate')
  const [goal, setGoal] = useState<FitnessGoal>('maintain')
  const [protMult, setProtMult] = useState(1.6)

  const activities: { key: ActivityLevel; icon: string; nameKey: keyof typeof import('../lib/i18n').tr extends never ? string : string; descKey: string }[] = [
    { key: 'sedentary',   icon: '🪑', nameKey: 'dietActivitySedentary',   descKey: 'dietActivitySedentaryDesc' },
    { key: 'light',       icon: '🚶', nameKey: 'dietActivityLight',       descKey: 'dietActivityLightDesc' },
    { key: 'moderate',    icon: '🏃', nameKey: 'dietActivityModerate',    descKey: 'dietActivityModerateDesc' },
    { key: 'active',      icon: '💪', nameKey: 'dietActivityActive',      descKey: 'dietActivityActiveDesc' },
    { key: 'very_active', icon: '🏋️', nameKey: 'dietActivityVeryActive', descKey: 'dietActivityVeryActiveDesc' },
  ] as const

  const goals: { key: FitnessGoal; nameKey: string; badgeKey: string; descKey: string; cls: string }[] = [
    { key: 'cut',      nameKey: 'dietGoalCut',      badgeKey: 'dietGoalCutBadge',      descKey: 'dietGoalCutDesc',      cls: 'badge-cut' },
    { key: 'maintain', nameKey: 'dietGoalMaintain', badgeKey: 'dietGoalMaintainBadge', descKey: 'dietGoalMaintainDesc', cls: 'badge-main' },
    { key: 'bulk',     nameKey: 'dietGoalBulk',     badgeKey: 'dietGoalBulkBadge',     descKey: 'dietGoalBulkDesc',     cls: 'badge-bulk' },
  ]

  const profile = buildProfile(weight, height, age, gender, activity, goal, protMult)
  const macros = calcMacros(profile.calories, weight, goal, protMult)

  const protNotes: Record<string, string> = {
    '1.2': lang === 'ko' ? '최소 권장. 근손실 위험 있어요.' : 'Minimum. Risk of muscle loss.',
    '1.4': lang === 'ko' ? '가벼운 활동인 기준.' : 'Light activity baseline.',
    '1.6': lang === 'ko' ? '일반적인 근육 유지 수준.' : 'Standard muscle maintenance.',
    '1.8': lang === 'ko' ? '벌크업/고강도 훈련 권장.' : 'Recommended for bulking/heavy training.',
    '2.0': lang === 'ko' ? '컷팅 시 근손실 방지. ISSN 권장.' : 'Cutting — prevents muscle loss. ISSN guideline.',
    '2.2': lang === 'ko' ? '고강도 컷팅.' : 'Aggressive cut.',
    '2.4': lang === 'ko' ? '최대 권장치.' : 'Maximum recommended.',
  }

  async function handleStart() {
    await onSave(profile)
  }

  const s = { display: 'flex', flexDirection: 'column' as const, gap: '10px', padding: '0 0 80px' }

  return (
    <div>
      <div style={{ padding: '4px 0 0' }}>
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '5px', marginBottom: '22px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{
              flex: 1, height: '3px', borderRadius: '2px',
              background: i <= step ? 'var(--green)' : 'var(--bg3)',
            }} />
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div style={s}>
            <div style={{ fontSize: '21px', fontWeight: 800, marginBottom: '4px' }}>{tr(lang, 'dietOnb1Title')}</div>
            <div style={{ fontSize: '13px', color: 'var(--tm)', marginBottom: '16px', lineHeight: 1.5 }}>{tr(lang, 'dietOnb1Sub')}</div>

            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--tm)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{tr(lang, 'dietGenderMale')} / {tr(lang, 'dietGenderFemale')}</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
              {(['male','female'] as const).map(g => (
                <button key={g} onClick={() => setGender(g)} style={{
                  flex: 1, padding: '11px', border: `.5px solid ${gender === g ? 'var(--green)' : 'var(--bd)'}`,
                  borderRadius: 'var(--r)', background: gender === g ? 'var(--green-bg)' : 'var(--bg2)',
                  color: gender === g ? 'var(--green)' : 'var(--ts)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px',
                }}>
                  {g === 'male' ? tr(lang, 'dietGenderMale') : tr(lang, 'dietGenderFemale')}
                </button>
              ))}
            </div>

            {([
              { label: tr(lang, 'dietAge'), value: age, set: setAge, unit: lang === 'ko' ? '세' : 'yr', min: 10, max: 99 },
              { label: tr(lang, 'dietHeight'), value: height, set: setHeight, unit: 'cm', min: 100, max: 250 },
            ] as const).map(({ label, value, set, unit, min, max }) => (
              <div key={label}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--tm)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '6px' }}>{label}</div>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg2)', border: '.5px solid var(--bd)', borderRadius: 'var(--r)' }}>
                  <input type="number" value={value} min={min} max={max}
                    onChange={e => set(Number(e.target.value))}
                    style={{ flex: 1, border: 'none', background: 'transparent', padding: '11px 13px', fontSize: '16px', fontWeight: 700, fontFamily: 'inherit', color: 'var(--tp)', outline: 'none' }} />
                  <span style={{ padding: '11px 13px', fontSize: '13px', color: 'var(--tm)', background: 'var(--bg3)', borderLeft: '.5px solid var(--bd)' }}>{unit}</span>
                </div>
              </div>
            ))}

            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--tm)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '6px' }}>{tr(lang, 'dietWeight')}</div>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg2)', border: '.5px solid var(--bd)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
                <input type="number" value={weight} min={20} max={300}
                  onChange={e => setWeight(Number(e.target.value))}
                  style={{ flex: 1, border: 'none', background: 'transparent', padding: '11px 13px', fontSize: '16px', fontWeight: 700, fontFamily: 'inherit', color: 'var(--tp)', outline: 'none' }} />
                {bodyLogs.length > 0 && (
                  <button onClick={() => setWeight(latestWeight)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', background: 'var(--green-bg)', border: 'none', borderLeft: '.5px solid var(--green-bd)', cursor: 'pointer' }}>
                    <span style={{ fontSize: '10px', color: 'var(--green)', fontWeight: 700 }}>🔗 {tr(lang, 'dietBodyLinked')} ({latestWeight}kg)</span>
                  </button>
                )}
                <span style={{ padding: '11px 12px', fontSize: '13px', color: 'var(--tm)', background: 'var(--bg3)', borderLeft: '.5px solid var(--bd)' }}>kg</span>
              </div>
              {bodyLogs.length > 0 && (
                <div style={{ fontSize: '11px', color: 'var(--tm)', marginTop: '5px', lineHeight: 1.4 }}>{tr(lang, 'dietBodyLinkNote')}</div>
              )}
            </div>

            <button onClick={() => setStep(2)} style={{ width: '100%', padding: '14px', background: 'var(--green)', color: '#fff', fontSize: '15px', fontWeight: 800, border: 'none', borderRadius: 'var(--r)', cursor: 'pointer', fontFamily: 'inherit', marginTop: '4px' }}>
              {tr(lang, 'dietNext')}
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div style={s}>
            <button onClick={() => setStep(1)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', color: 'var(--tm)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', padding: '0 0 10px' }}>
              {tr(lang, 'dietBack')}
            </button>
            <div style={{ fontSize: '21px', fontWeight: 800, marginBottom: '4px' }}>{tr(lang, 'dietOnb2Title')}</div>
            <div style={{ fontSize: '13px', color: 'var(--tm)', marginBottom: '16px', lineHeight: 1.5 }}>{tr(lang, 'dietOnb2Sub')}</div>
            {activities.map(({ key, icon, nameKey, descKey }) => (
              <div key={key} onClick={() => setActivity(key)} style={{
                display: 'flex', alignItems: 'center', gap: '11px', padding: '12px 13px',
                border: `.5px solid ${activity === key ? 'var(--green)' : 'var(--bd)'}`,
                borderRadius: 'var(--r)', cursor: 'pointer',
                background: activity === key ? 'var(--green-bg)' : 'var(--bg2)',
              }}>
                <span style={{ fontSize: '22px', width: '30px', textAlign: 'center' }}>{icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>{tr(lang, nameKey as Parameters<typeof tr>[1])}</div>
                  <div style={{ fontSize: '11px', color: 'var(--tm)' }}>{tr(lang, descKey as Parameters<typeof tr>[1])}</div>
                </div>
                <div style={{ width: '17px', height: '17px', borderRadius: '50%', border: `1.5px solid ${activity === key ? 'var(--green)' : 'var(--bd)'}`, background: activity === key ? 'var(--green)' : 'transparent', flexShrink: 0 }} />
              </div>
            ))}
            <button onClick={() => setStep(3)} style={{ width: '100%', padding: '14px', background: 'var(--green)', color: '#fff', fontSize: '15px', fontWeight: 800, border: 'none', borderRadius: 'var(--r)', cursor: 'pointer', fontFamily: 'inherit', marginTop: '4px' }}>
              {tr(lang, 'dietNext')}
            </button>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div style={s}>
            <button onClick={() => setStep(2)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', color: 'var(--tm)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', padding: '0 0 10px' }}>
              {tr(lang, 'dietBack')}
            </button>
            <div style={{ fontSize: '21px', fontWeight: 800, marginBottom: '4px' }}>{tr(lang, 'dietOnb3Title')}</div>
            <div style={{ fontSize: '13px', color: 'var(--tm)', marginBottom: '16px', lineHeight: 1.5 }}>{tr(lang, 'dietOnb3Sub')}</div>
            {goals.map(({ key, nameKey, badgeKey, descKey, cls }) => (
              <div key={key} onClick={() => setGoal(key)} style={{
                padding: '13px', border: `.5px solid ${goal === key ? 'var(--green)' : 'var(--bd)'}`,
                borderRadius: 'var(--r)', cursor: 'pointer', background: goal === key ? 'var(--green-bg)' : 'var(--bg2)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 800 }}>{tr(lang, nameKey as Parameters<typeof tr>[1])}</span>
                  <span className={cls} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: 700 }}>
                    {tr(lang, badgeKey as Parameters<typeof tr>[1])}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--tm)', lineHeight: 1.4 }}>{tr(lang, descKey as Parameters<typeof tr>[1])}</div>
              </div>
            ))}
            <button onClick={() => setStep(4)} style={{ width: '100%', padding: '14px', background: 'var(--green)', color: '#fff', fontSize: '15px', fontWeight: 800, border: 'none', borderRadius: 'var(--r)', cursor: 'pointer', fontFamily: 'inherit', marginTop: '4px' }}>
              {tr(lang, 'dietNext')}
            </button>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div style={s}>
            <button onClick={() => setStep(3)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', color: 'var(--tm)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', padding: '0 0 10px' }}>
              {tr(lang, 'dietBack')}
            </button>
            <div style={{ fontSize: '21px', fontWeight: 800, marginBottom: '4px' }}>{tr(lang, 'dietOnb4Title')}</div>
            <div style={{ fontSize: '13px', color: 'var(--tm)', marginBottom: '16px', lineHeight: 1.5 }}>{tr(lang, 'dietOnb4Sub')}</div>

            {/* Result hero */}
            <div style={{ background: 'var(--green-bg)', border: '.5px solid var(--green-bd)', borderRadius: 'var(--r)', padding: '18px', textAlign: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '46px', fontWeight: 900, color: 'var(--green)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px' }}>{profile.calories.toLocaleString()}</div>
              <div style={{ fontSize: '12px', color: 'var(--tm)', marginTop: '2px' }}>{tr(lang, 'dietCalories')} {tr(lang, 'dietGoalLabel')}</div>
            </div>

            {/* Macro grid: 탄/단/지 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
              {[
                { name: tr(lang, 'dietCarbs'), val: macros.carbs, color: 'var(--red)' },
                { name: tr(lang, 'dietProtein'), val: macros.protein, color: 'var(--blue)' },
                { name: tr(lang, 'dietFat'), val: macros.fat, color: 'var(--purple)' },
              ].map(({ name, val, color }) => (
                <div key={name} style={{ background: 'var(--bg2)', border: '.5px solid var(--bd)', borderRadius: 'var(--r)', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--tm)', marginBottom: '4px' }}>{name}</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{val}</div>
                  <div style={{ fontSize: '10px', color: 'var(--tm)' }}>g</div>
                </div>
              ))}
            </div>

            {/* Protein slider */}
            <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bd)', borderRadius: 'var(--r)', padding: '13px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>{tr(lang, 'dietProtSlider')}</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--blue)' }}>{protMult.toFixed(1)}×</span>
              </div>
              <input type="range" min={12} max={24} value={protMult * 10}
                onChange={e => setProtMult(Number(e.target.value) / 10)}
                style={{ width: '100%', accentColor: 'var(--blue)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--tm)', marginTop: '2px' }}>
                <span>1.2×</span><span>1.6×</span><span>2.0×</span><span>2.4×</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--tm)', marginTop: '7px', lineHeight: 1.4 }}>
                {weight}kg × {protMult.toFixed(1)} = <strong>{macros.protein}g</strong>. {protNotes[protMult.toFixed(1)] ?? ''}
              </div>
            </div>

            <button onClick={handleStart} style={{ width: '100%', padding: '14px', background: 'var(--green)', color: '#fff', fontSize: '15px', fontWeight: 800, border: 'none', borderRadius: 'var(--r)', cursor: 'pointer', fontFamily: 'inherit' }}>
              {tr(lang, 'dietStartBtn')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── FOOD SEARCH MODAL ────────────────────────────────────────────────────────

function FoodSearchModal({ lang, slotLabel, favorites, customFoods, templates, isFavorite, onToggleFav, onAdd, onAddAll, onSaveCustomFood, onSaveMealTemplate, onClose }: {
  lang: Lang
  slotLabel: string
  favorites: FavoriteFood[]
  customFoods: CustomFood[]
  templates: MealTemplate[]
  isFavorite: (id: string) => boolean
  onToggleFav: (f: FoodItem) => Promise<void>
  onAdd: (entry: DietEntry) => Promise<void>
  onAddAll: (entries: DietEntry[]) => Promise<void>
  onSaveCustomFood: (f: Omit<CustomFood, 'id'>) => Promise<void>
  onSaveMealTemplate: (name: string, entries: DietEntry[]) => Promise<void>
  onClose: () => void
}) {
  const [tab, setTab] = useState<FoodTab>('search')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodItem[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<FoodItem | null>(null)
  const [amount, setAmount] = useState(100)
  const [creating, setCreating] = useState<'food' | 'meal' | null>(null)
  const [recentFoods] = useState<FoodItem[]>([])

  // Meal creation state
  const [mealName, setMealName] = useState('')
  const [mealFoods, setMealFoods] = useState<{ food: FoodItem; amount: number }[]>([])
  const [mealSearch, setMealSearch] = useState('')
  const [mealResults, setMealResults] = useState<FoodItem[]>([])

  // Custom food form
  const [cName, setCName] = useState('')
  const [cCal, setCCal] = useState('')
  const [cCarbs, setCCarbs] = useState('')
  const [cProt, setCProt] = useState('')
  const [cFat, setCFat] = useState('')
  const [cServing, setCServing] = useState('100')

  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    clearTimeout(searchTimer.current)
    if (!query.trim()) { setResults([]); return }
    setSearching(true)
    searchTimer.current = setTimeout(async () => {
      const r = await searchFood(query, lang)
      setResults(r)
      setSearching(false)
    }, 500)
    return () => clearTimeout(searchTimer.current)
  }, [query, lang])

  const mealSearchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    clearTimeout(mealSearchTimer.current)
    if (!mealSearch.trim()) { setMealResults([]); return }
    mealSearchTimer.current = setTimeout(async () => {
      const r = await searchFood(mealSearch, lang)
      setMealResults(r)
    }, 500)
    return () => clearTimeout(mealSearchTimer.current)
  }, [mealSearch, lang])

  function foodItemToFoodType(fav: FavoriteFood): FoodItem {
    return { id: fav.id, name: fav.name, brand: fav.brand, calories100g: fav.calories100g, carbs100g: fav.carbs100g, protein100g: fav.protein100g, fat100g: fav.fat100g, source: fav.source }
  }
  function customToFoodType(c: CustomFood): FoodItem {
    return { id: c.id, name: c.name, brand: c.brand, calories100g: c.calories100g, carbs100g: c.carbs100g, protein100g: c.protein100g, fat100g: c.fat100g, source: 'custom' }
  }

  function makeEntry(food: FoodItem, amt: number): DietEntry {
    const n = calcEntryNutrition(food, amt)
    return { foodId: food.id, name: food.name, brand: food.brand, amount: amt, unit: 'g', source: food.source, ...n }
  }

  async function handleAdd() {
    if (!selected) return
    await onAdd(makeEntry(selected, amount))
    setSelected(null)
    setAmount(100)
    onClose()
  }

  async function handleAddTemplate(tpl: MealTemplate) {
    await onAddAll(tpl.entries)
    onClose()
  }

  async function handleSaveMeal() {
    if (!mealName.trim() || mealFoods.length === 0) return
    const entries = mealFoods.map(({ food, amount }) => makeEntry(food, amount))
    await onSaveMealTemplate(mealName, entries)
    setCreating(null)
    setMealName('')
    setMealFoods([])
    setMealSearch('')
    setMealResults([])
  }

  async function handleSaveFood() {
    if (!cName.trim() || !cCal) return
    await onSaveCustomFood({
      name: cName.trim(),
      calories100g: Number(cCal),
      carbs100g: Number(cCarbs) || 0,
      protein100g: Number(cProt) || 0,
      fat100g: Number(cFat) || 0,
      servingSize: Number(cServing) || 100,
    })
    setCreating(null)
    setCName(''); setCCal(''); setCCarbs(''); setCProt(''); setCFat(''); setCServing('100')
  }

  const calcSelected = selected ? calcEntryNutrition(selected, amount) : null

  const macroBar = (food: FoodItem) => {
    const total = food.carbs100g * 4 + food.protein100g * 4 + food.fat100g * 9
    if (!total) return null
    const cp = (food.carbs100g * 4 / total * 100).toFixed(0)
    const pp = (food.protein100g * 4 / total * 100).toFixed(0)
    return `탄 ${food.carbs100g}g · 단 ${food.protein100g}g · 지 ${food.fat100g}g · ${cp}%/${pp}%`
  }

  function FoodRow({ food, onSelect }: { food: FoodItem; onSelect: () => void }) {
    const lf = food as LocalFood
    const serving = lf.servingSize
    const servingCal = serving ? Math.round(food.calories100g * serving / 100) : null
    return (
      <div onClick={onSelect} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 18px', borderBottom: '.5px solid var(--bd)', cursor: 'pointer' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{food.name}</div>
          <div style={{ fontSize: '11px', color: 'var(--tm)', marginTop: '1px' }}>
            {food.brand ? `${food.brand} · ` : ''}{macroBar(food) ?? `${food.calories100g} kcal/100g`}
          </div>
          {lf.servingLabel && (
            <div style={{ fontSize: '10px', color: 'var(--green)', marginTop: '2px', fontWeight: 600 }}>
              📏 {lf.servingLabel} = {servingCal} kcal
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '15px', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{food.calories100g}</div>
          <div style={{ fontSize: '10px', color: 'var(--tm)' }}>kcal/100g</div>
        </div>
        <button onClick={e => { e.stopPropagation(); onToggleFav(food) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', flexShrink: 0, padding: '4px' }}>
          {isFavorite(food.id) ? <IconStarFilled size={16} style={{ color: '#F59E0B' }} /> : <IconStar size={16} style={{ color: 'var(--bds)' }} />}
        </button>
      </div>
    )
  }

  const inputStyle = { width: '100%', padding: '11px 13px', background: 'var(--bg2)', border: '.5px solid var(--bd)', borderRadius: 'var(--r)', fontSize: '14px', fontFamily: 'inherit', color: 'var(--tp)', outline: 'none' }
  const labelStyle = { fontSize: '11px', fontWeight: 700 as const, color: 'var(--tm)', textTransform: 'uppercase' as const, letterSpacing: '.05em', marginBottom: '5px', display: 'block' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px 0', borderBottom: '.5px solid var(--bd)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>{slotLabel}</div>
            <div style={{ fontSize: '17px', fontWeight: 800 }}>{tr(lang, 'dietAddFood')}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tm)' }}><IconX size={22} /></button>
        </div>
        {/* 4 tabs */}
        <div style={{ display: 'flex', marginTop: '8px' }}>
          {([
            { key: 'search' as FoodTab, label: tr(lang, 'dietFoodSearch'), icon: '🔍' },
            { key: 'fav'    as FoodTab, label: tr(lang, 'dietFoodFav'),    icon: '⭐' },
            { key: 'meal'   as FoodTab, label: tr(lang, 'dietFoodMeal'),   icon: '🍽️' },
            { key: 'mine'   as FoodTab, label: tr(lang, 'dietFoodMine'),   icon: '✏️' },
          ]).map(({ key, label, icon }) => (
            <button key={key} onClick={() => { setTab(key); setSelected(null) }} style={{
              flex: 1, padding: '8px 4px', textAlign: 'center', fontSize: '11px', fontWeight: 600,
              color: tab === key ? 'var(--green)' : 'var(--tm)',
              background: 'none', border: 'none', borderBottom: `2px solid ${tab === key ? 'var(--green)' : 'transparent'}`,
              cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
            }}>
              <span style={{ fontSize: '14px' }}>{icon}</span>{label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* Search tab */}
        {tab === 'search' && (
          <>
            <div style={{ margin: '10px 16px', display: 'flex', alignItems: 'center', gap: '9px', background: 'var(--bg2)', border: '.5px solid var(--bd)', borderRadius: '30px', padding: '10px 15px' }}>
              <IconSearch size={16} style={{ color: 'var(--tm)', flexShrink: 0 }} />
              <input value={query} onChange={e => setQuery(e.target.value)}
                placeholder={tr(lang, 'dietSearchPlaceholder')}
                style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '14px', fontFamily: 'inherit', color: 'var(--tp)', outline: 'none' }} />
              {query && <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tm)' }}><IconX size={14} /></button>}
            </div>
            {searching && <div style={{ padding: '12px 18px', fontSize: '13px', color: 'var(--tm)' }}>{tr(lang, 'dietSearching')}</div>}
            {query && !searching && results.length === 0 && <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--tm)' }}>{tr(lang, 'dietNoResults')}</div>}
            {query && !searching && results.length > 0 && (() => {
              const localResults = results.filter(f => f.source === 'custom' || f.source === 'kfood')
              const offResults = results.filter(f => f.source === 'openfoodfacts')
              return (
                <>
                  {localResults.length > 0 && (
                    <>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--tm)', textTransform: 'uppercase', letterSpacing: '.06em', padding: '10px 18px 4px' }}>
                        {tr(lang, 'dietSearchResults')} ({localResults.length}) · {lang === 'ko' ? '식약처 / 로컬 DB' : 'MFDS / Local DB'}
                      </div>
                      {localResults.map(f => <FoodRow key={f.id} food={f} onSelect={() => { setSelected(f); setAmount((f as LocalFood).servingSize ?? 100) }} />)}
                    </>
                  )}
                  {offResults.length > 0 && (
                    <>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--tm)', textTransform: 'uppercase', letterSpacing: '.06em', padding: '10px 18px 4px' }}>
                        {tr(lang, 'dietOffNote')} ({offResults.length})
                      </div>
                      {offResults.map(f => <FoodRow key={f.id} food={f} onSelect={() => { setSelected(f); setAmount(100) }} />)}
                    </>
                  )}
                </>
              )
            })()}
            {!query && recentFoods.length > 0 && (
              <>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--tm)', textTransform: 'uppercase', letterSpacing: '.06em', padding: '10px 18px 4px' }}>{tr(lang, 'dietRecentFoods')}</div>
                {recentFoods.map(f => <FoodRow key={f.id} food={f} onSelect={() => { setSelected(f); setAmount((f as LocalFood).servingSize ?? 100) }} />)}
              </>
            )}
            <div onClick={() => setCreating('food')} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '13px 18px', color: 'var(--green)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', borderTop: '.5px solid var(--bd)' }}>
              <IconPlus size={16} />{tr(lang, 'dietAddCustom')}
            </div>
          </>
        )}

        {/* Favorites tab */}
        {tab === 'fav' && (
          <>
            {favorites.length === 0
              ? <div style={{ padding: '30px', textAlign: 'center', fontSize: '13px', color: 'var(--tm)' }}>{tr(lang, 'dietNoFav')}</div>
              : favorites.map(fav => <FoodRow key={fav.id} food={foodItemToFoodType(fav)} onSelect={() => { setSelected(foodItemToFoodType(fav)); setAmount(100) }} />)

            }
          </>
        )}

        {/* Meal templates tab */}
        {tab === 'meal' && (
          <>
            <div onClick={() => setCreating('meal')} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '13px 18px', color: 'var(--green)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', borderBottom: '.5px solid var(--bd)' }}>
              <IconPlus size={16} />{tr(lang, 'dietNewMeal')}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--tm)', textTransform: 'uppercase', letterSpacing: '.06em', padding: '10px 18px 4px' }}>{tr(lang, 'dietSavedMeals')} ({templates.length})</div>
            {templates.length === 0 && <div style={{ padding: '20px 18px', fontSize: '13px', color: 'var(--tm)' }}>{tr(lang, 'dietNoMeals')}</div>}
            {templates.map(tpl => (
              <div key={tpl.id} style={{ margin: '8px 16px', background: 'var(--bg2)', border: '.5px solid var(--bd)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
                <div style={{ padding: '12px 14px 8px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800 }}>{tpl.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--tm)', marginTop: '2px' }}>
                      탄 {tpl.totalCarbs}g · 단 {tpl.totalProtein}g · 지 {tpl.totalFat}g
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--green)', fontVariantNumeric: 'tabular-nums' }}>{tpl.totalCalories} kcal</div>
                </div>
                <div style={{ padding: '0 14px 10px' }}>
                  {tpl.entries.map((e, i) => (
                    <div key={i} style={{ fontSize: '12px', color: 'var(--tm)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                      <span style={{ color: 'var(--bds)' }}>·</span>{e.name} {e.amount}{e.unit}
                    </div>
                  ))}
                </div>
                <button onClick={() => handleAddTemplate(tpl)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px', fontSize: '13px', fontWeight: 700, color: 'var(--green)', background: 'none', border: 'none', borderTop: '.5px solid var(--bd)', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <IconPlus size={14} />{tr(lang, 'dietAddAll')}
                </button>
              </div>
            ))}
          </>
        )}

        {/* My foods tab */}
        {tab === 'mine' && (
          <>
            <div onClick={() => setCreating('food')} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '13px 18px', color: 'var(--green)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', borderBottom: '.5px solid var(--bd)' }}>
              <IconPlus size={16} />{tr(lang, 'dietNewFood')}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--tm)', textTransform: 'uppercase', letterSpacing: '.06em', padding: '10px 18px 4px' }}>{tr(lang, 'dietMyFoods')} ({customFoods.length})</div>
            {customFoods.length === 0 && <div style={{ padding: '20px 18px', fontSize: '13px', color: 'var(--tm)' }}>{tr(lang, 'dietNoMyFoods')}</div>}
            {customFoods.map(c => <FoodRow key={c.id} food={customToFoodType(c)} onSelect={() => { setSelected(customToFoodType(c)); setAmount(c.servingSize ?? 100) }} />)}
          </>
        )}
      </div>

      {/* Amount panel (when food selected) */}
      {selected && calcSelected && (
        <div style={{ background: 'var(--bg1)', borderTop: '1.5px solid var(--bd)', padding: '16px 18px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800 }}>{selected.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--tm)', marginTop: '2px' }}>{selected.brand ?? (selected.source === 'openfoodfacts' ? tr(lang, 'dietOffNote') : tr(lang, 'dietFoodMine'))}</div>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tm)' }}><IconX size={16} /></button>
          </div>
          {/* Macro row: 탄/단/지/kcal */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
            {[
              { label: tr(lang, 'dietCarbs'), val: calcSelected.carbs, color: 'var(--red)' },
              { label: tr(lang, 'dietProtein'), val: calcSelected.protein, color: 'var(--blue)' },
              { label: tr(lang, 'dietFat'), val: calcSelected.fat, color: 'var(--purple)' },
              { label: 'kcal', val: calcSelected.calories, color: 'var(--green)' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ flex: 1, textAlign: 'center', background: 'var(--bg2)', border: '.5px solid var(--bd)', borderRadius: 'var(--r)', padding: '7px 4px' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color }}>{val}</div>
                <div style={{ fontSize: '9px', color: 'var(--tm)', marginTop: '1px' }}>{label}</div>
              </div>
            ))}
          </div>
          {/* Amount input */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--tm)', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap' }}>{tr(lang, 'dietAmount')}</div>
            <input type="number" value={amount} min={1} onChange={e => setAmount(Number(e.target.value))}
              style={{ flex: 1, padding: '9px', background: 'var(--bg2)', border: '.5px solid var(--bd)', borderRadius: 'var(--r)', fontSize: '16px', fontWeight: 800, textAlign: 'center', fontFamily: 'inherit', color: 'var(--tp)', outline: 'none', fontVariantNumeric: 'tabular-nums' }} />
            <span style={{ fontSize: '13px', color: 'var(--tm)', background: 'var(--bg2)', border: '.5px solid var(--bd)', borderRadius: 'var(--r)', padding: '9px 12px' }}>g</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {selected && (selected as LocalFood).servingSize && (
              <button onClick={() => setAmount((selected as LocalFood).servingSize!)} style={{ padding: '6px 10px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', background: amount === (selected as LocalFood).servingSize ? 'var(--green-bg)' : 'var(--bg2)', border: `.5px solid ${amount === (selected as LocalFood).servingSize ? 'var(--green)' : 'var(--bd)'}`, color: amount === (selected as LocalFood).servingSize ? 'var(--green)' : 'var(--tm)', fontWeight: 600 }}>
                {(selected as LocalFood).servingLabel}
              </button>
            )}
            {[50, 100, 150, 200].map(v => (
              <button key={v} onClick={() => setAmount(v)} style={{ padding: '6px 10px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', background: amount === v ? 'var(--green-bg)' : 'var(--bg2)', border: `.5px solid ${amount === v ? 'var(--green)' : 'var(--bd)'}`, color: amount === v ? 'var(--green)' : 'var(--tm)' }}>{v}g</button>
            ))}
          </div>
          <button onClick={handleAdd} style={{ width: '100%', padding: '13px', background: 'var(--green)', color: '#fff', fontSize: '15px', fontWeight: 800, border: 'none', borderRadius: 'var(--r)', cursor: 'pointer', fontFamily: 'inherit' }}>
            {tr(lang, 'dietAddBtn')}
          </button>
        </div>
      )}

      {/* Create meal template modal */}
      {creating === 'meal' && (
        <div style={{ position: 'absolute', inset: 0, background: 'var(--bg1)', zIndex: 10, overflowY: 'auto', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ fontSize: '18px', fontWeight: 800 }}>{tr(lang, 'dietNewMeal')}</div>
            <button onClick={() => setCreating(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tm)' }}><IconX size={20} /></button>
          </div>
          <label style={labelStyle}>{tr(lang, 'dietMealNameLabel')}</label>
          <input value={mealName} onChange={e => setMealName(e.target.value)} placeholder="e.g. 아침식사 1" style={{ ...inputStyle, marginBottom: '16px' }} />
          <label style={labelStyle}>{tr(lang, 'dietFoodSearch')}</label>
          <input value={mealSearch} onChange={e => setMealSearch(e.target.value)} placeholder={tr(lang, 'dietSearchPlaceholder')} style={{ ...inputStyle, marginBottom: '8px' }} />
          {mealResults.slice(0, 5).map(f => (
            <div key={f.id} onClick={() => { setMealFoods(prev => [...prev, { food: f, amount: 100 }]); setMealSearch(''); setMealResults([]) }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', background: 'var(--bg2)', border: '.5px solid var(--bd)', borderRadius: 'var(--r)', marginBottom: '6px', cursor: 'pointer' }}>
              <div style={{ flex: 1, fontSize: '14px', fontWeight: 600 }}>{f.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--tm)' }}>{f.calories100g} kcal/100g</div>
              <IconPlus size={14} style={{ color: 'var(--green)' }} />
            </div>
          ))}
          {mealFoods.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--tm)', marginBottom: '8px' }}>추가된 음식</div>
              {mealFoods.map(({ food, amount }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ flex: 1, fontSize: '13px' }}>{food.name}</span>
                  <input type="number" value={amount} min={1} onChange={e => setMealFoods(prev => prev.map((m, j) => j === i ? { ...m, amount: Number(e.target.value) } : m))}
                    style={{ width: '60px', padding: '6px', background: 'var(--bg2)', border: '.5px solid var(--bd)', borderRadius: 'var(--rsm)', textAlign: 'center', fontSize: '13px', fontFamily: 'inherit', color: 'var(--tp)', outline: 'none' }} />
                  <span style={{ fontSize: '12px', color: 'var(--tm)' }}>g</span>
                  <button onClick={() => setMealFoods(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)' }}><IconX size={14} /></button>
                </div>
              ))}
              <div style={{ fontSize: '12px', color: 'var(--green)', fontWeight: 700, marginTop: '8px' }}>
                총 {mealFoods.reduce((a, { food, amount }) => a + Math.round(food.calories100g * amount / 100), 0)} kcal
              </div>
            </div>
          )}
          <button onClick={handleSaveMeal} disabled={!mealName.trim() || mealFoods.length === 0} style={{ width: '100%', padding: '13px', background: 'var(--green)', color: '#fff', fontSize: '15px', fontWeight: 800, border: 'none', borderRadius: 'var(--r)', cursor: 'pointer', fontFamily: 'inherit', marginTop: '16px', opacity: (!mealName.trim() || mealFoods.length === 0) ? .5 : 1 }}>
            {tr(lang, 'dietSaveMeal')}
          </button>
        </div>
      )}

      {/* Create custom food modal */}
      {creating === 'food' && (
        <div style={{ position: 'absolute', inset: 0, background: 'var(--bg1)', zIndex: 10, overflowY: 'auto', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ fontSize: '18px', fontWeight: 800 }}>{tr(lang, 'dietNewFood')}</div>
            <button onClick={() => setCreating(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tm)' }}><IconX size={20} /></button>
          </div>
          {[
            { label: tr(lang, 'dietFoodName'), val: cName, set: setCName, type: 'text', placeholder: 'e.g. 단백질 쉐이크' },
            { label: tr(lang, 'dietCal100'), val: cCal, set: setCCal, type: 'number', placeholder: '165' },
            { label: tr(lang, 'dietCarbs100'), val: cCarbs, set: setCCarbs, type: 'number', placeholder: '0' },
            { label: tr(lang, 'dietProtein100'), val: cProt, set: setCProt, type: 'number', placeholder: '31' },
            { label: tr(lang, 'dietFat100'), val: cFat, set: setCFat, type: 'number', placeholder: '4' },
            { label: tr(lang, 'dietServingSize'), val: cServing, set: setCServing, type: 'number', placeholder: '100' },
          ].map(({ label, val, set, type, placeholder }) => (
            <div key={label} style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>{label}</label>
              <input type={type} value={val} onChange={e => set(e.target.value)} placeholder={placeholder} style={inputStyle} />
            </div>
          ))}
          <button onClick={handleSaveFood} disabled={!cName.trim() || !cCal} style={{ width: '100%', padding: '13px', background: 'var(--green)', color: '#fff', fontSize: '15px', fontWeight: 800, border: 'none', borderRadius: 'var(--r)', cursor: 'pointer', fontFamily: 'inherit', marginTop: '4px', opacity: (!cName.trim() || !cCal) ? .5 : 1 }}>
            {tr(lang, 'dietSaveFood')}
          </button>
        </div>
      )}
    </div>
  )
}

// ── 7-DAY CHART ──────────────────────────────────────────────────────────────

function CalChart({ logs, today, target, lang }: { logs: DietLog[]; today: string; target: number; lang: Lang }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const draw = useCallback(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.offsetWidth || 326
    const H = 110
    canvas.width = W; canvas.height = H
    const isDark = document.documentElement.dataset.theme === 'dark' ||
      (!document.documentElement.dataset.theme && window.matchMedia('(prefers-color-scheme:dark)').matches)
    const bg2 = isDark ? '#22262F' : '#E9ECEF'
    const tc = isDark ? '#8B95A3' : '#68737D'
    const bP = 22, tP = 10, cH = H - bP - tP
    const maxV = Math.max(target * 1.15, 2500)

    // build 7-day data
    const days: { label: string; val: number; isToday: boolean }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today + 'T00:00:00')
      d.setDate(d.getDate() - i)
      const key = fmtDate(d)
      const log = logs.find(l => l.date === key)
      const val = log ? Object.values(log.meals).flat().reduce((a, e) => a + e.calories, 0) : 0
      const label = i === 0 ? (lang === 'ko' ? '오늘' : 'Today') : `${d.getDate()}${lang === 'ko' ? '일' : ''}`
      days.push({ label, val, isToday: i === 0 })
    }

    ctx.clearRect(0, 0, W, H)
    const bW = 30, gap = (W - bW * 7) / 8
    const startX = gap

    // goal line
    const goalY = tP + cH * (1 - target / maxV)
    ctx.strokeStyle = '#E8930A66'; ctx.lineWidth = 1; ctx.setLineDash([4, 4])
    ctx.beginPath(); ctx.moveTo(0, goalY); ctx.lineTo(W, goalY); ctx.stroke()
    ctx.setLineDash([])

    days.forEach(({ label, val, isToday }, i) => {
      const x = startX + i * (bW + gap)
      const h = val > 0 ? (val / maxV) * cH : 0
      const y = tP + cH - h
      ctx.fillStyle = bg2
      ctx.beginPath(); ctx.roundRect(x, tP, bW, cH, 3); ctx.fill()
      if (val > 0) {
        ctx.fillStyle = `rgba(29,158,117,${val >= target ? 1 : val > target * 0.75 ? 0.65 : 0.35})`
        ctx.beginPath(); ctx.roundRect(x, y, bW, h, 3); ctx.fill()
      }
      ctx.fillStyle = isToday ? '#1D9E75' : tc
      ctx.font = `${isToday ? 700 : 400} 10px -apple-system,sans-serif`
      ctx.textAlign = 'center'; ctx.fillText(label, x + bW / 2, H - 6)
    })
  }, [logs, today, target, lang])

  useEffect(() => { draw(); const obs = new MutationObserver(draw); obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); return () => obs.disconnect() }, [draw])

  return <canvas ref={ref} style={{ width: '100%', display: 'block' }} height={110} />
}

// ── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function DietPage({ lang, bodyLogs, profile, getLog, logs, favorites, customFoods, templates, onSaveProfile, onAddEntry, onAddEntries, onRemoveEntry, onToggleFav, isFavorite, onSaveCustomFood, onSaveMealTemplate }: Props) {
  const today = fmtDate(new Date())
  const [date, setDate] = useState(today)
  const [openSlot, setOpenSlot] = useState<MealSlotKey | null>(null)
  const [showWeightBanner, setShowWeightBanner] = useState(false)
  const [showGoalEdit, setShowGoalEdit] = useState(false)

  const log = getLog(date)

  // Weight sync check
  useEffect(() => {
    if (!profile || !bodyLogs.length) return
    const latest = bodyLogs[bodyLogs.length - 1]?.weight
    if (latest && Math.abs(latest - profile.weight) >= 0.5) setShowWeightBanner(true)
  }, [profile, bodyLogs])

  function navigate(delta: number) {
    const d = new Date(date + 'T00:00:00')
    d.setDate(d.getDate() + delta)
    setDate(fmtDate(d))
  }

  if (profile === undefined) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--tm)' }}>Loading...</div>

  if (profile === null) {
    return (
      <Onboarding lang={lang} bodyLogs={bodyLogs} onSave={onSaveProfile} />
    )
  }

  const openSlotData = openSlot ? MEAL_SLOTS.find(s => s.key === openSlot) : null
  if (openSlot && openSlotData) {
    return (
      <FoodSearchModal
        lang={lang}
        slotLabel={tr(lang, openSlotData.labelKey as Parameters<typeof tr>[1])}
        favorites={favorites}
        customFoods={customFoods}
        templates={templates}
        isFavorite={isFavorite}
        onToggleFav={onToggleFav}
        onAdd={entry => onAddEntry(date, openSlot, entry)}
        onAddAll={entries => onAddEntries(date, openSlot, entries)}
        onSaveCustomFood={onSaveCustomFood}
        onSaveMealTemplate={onSaveMealTemplate}
        onClose={() => setOpenSlot(null)}
      />
    )
  }

  const totalCal = log ? Object.values(log.meals).flat().reduce((a, e) => a + e.calories, 0) : 0
  const totalCarbs = log ? Object.values(log.meals).flat().reduce((a, e) => a + e.carbs, 0) : 0
  const totalProt = log ? Object.values(log.meals).flat().reduce((a, e) => a + e.protein, 0) : 0
  const totalFat = log ? Object.values(log.meals).flat().reduce((a, e) => a + e.fat, 0) : 0

  const pct = Math.min(100, Math.round((totalCal / profile.calories) * 100))
  const remain = profile.calories - totalCal
  const range = { lo: Math.round(profile.calories * 0.9), hi: Math.round(profile.calories * 1.1) }

  async function handleWeightUpdate() {
    const latest = bodyLogs[bodyLogs.length - 1]?.weight
    if (!latest || !profile) return
    const { protein, fat, carbs } = calcMacros(profile.calories, latest, profile.goal, profile.protMultiplier)
    await onSaveProfile({ ...profile, weight: latest, protein, fat, carbs })
    setShowWeightBanner(false)
  }

  if (showGoalEdit) {
    return (
      <GoalEditModal lang={lang} profile={profile} onSave={onSaveProfile} onClose={() => setShowGoalEdit(false)} />
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Date nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ts)' }}><IconChevronLeft size={20} /></button>
        <span style={{ fontSize: '15px', fontWeight: 700 }}>{dateLabel(date, today, lang)}</span>
        <button onClick={() => navigate(1)} disabled={date >= today} style={{ background: 'none', border: 'none', cursor: 'pointer', color: date >= today ? 'var(--bds)' : 'var(--ts)' }}><IconChevronRight size={20} /></button>
      </div>

      {/* Weight sync banner */}
      {showWeightBanner && (
        <div style={{ background: '#F59E0B14', border: '.5px solid #F59E0B44', borderRadius: 'var(--r)', padding: '10px 13px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <span style={{ fontSize: '16px' }}>⚖️</span>
          <div style={{ flex: 1, fontSize: '12px', lineHeight: 1.4 }}>
            <strong>{tr(lang, 'dietWeightSync')}</strong> ({profile.weight}kg → {bodyLogs[bodyLogs.length - 1]?.weight}kg). {lang === 'ko' ? '칼로리 목표를 재계산할까요?' : 'Recalculate calorie target?'}
          </div>
          <button onClick={handleWeightUpdate} style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', background: '#E8930A', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit' }}>{tr(lang, 'dietWeightUpdate')}</button>
          <button onClick={() => setShowWeightBanner(false)} style={{ fontSize: '11px', padding: '4px 10px', background: 'var(--bg3)', color: 'var(--tm)', border: 'none', borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit' }}>{tr(lang, 'dietWeightKeep')}</button>
        </div>
      )}

      {/* Calorie card */}
      <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bd)', borderRadius: 'var(--r)', padding: '16px 18px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '44px', fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px' }}>{totalCal.toLocaleString()}</div>
            <div style={{ fontSize: '12px', color: 'var(--tm)', marginTop: '3px' }}>kcal {tr(lang, 'dietConsumed')}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#E8930A', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
              🎯 {profile.calories.toLocaleString()} kcal
            </div>
            <div style={{ fontSize: '11px', color: 'var(--tm)', marginTop: '3px' }}>{tr(lang, 'dietRange')} {range.lo.toLocaleString()}–{range.hi.toLocaleString()}</div>
            <div style={{ fontSize: '12px', color: remain >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700, marginTop: '5px' }}>
              {Math.abs(remain).toLocaleString()} kcal {remain >= 0 ? tr(lang, 'dietRemain') : (lang === 'ko' ? '초과' : 'over')}
            </div>
          </div>
        </div>
        <div style={{ height: '6px', background: 'var(--bg3)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pct > 110 ? 'var(--red)' : 'var(--green)', borderRadius: '3px', transition: 'width .3s' }} />
        </div>
      </div>

      {/* Macros: 탄/단/지 */}
      <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bd)', borderRadius: 'var(--r)', overflow: 'hidden', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px 0', fontSize: '13px', fontWeight: 700 }}>
          <span>{lang === 'ko' ? '영양정보' : 'Nutrition'}</span>
          <button onClick={() => setShowGoalEdit(true)} style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 500, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}>{tr(lang, 'dietEditGoal')}</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
          {[
            { label: tr(lang, 'dietCarbs'), val: totalCarbs, target: profile.carbs, color: 'var(--red)' },
            { label: tr(lang, 'dietProtein'), val: totalProt, target: profile.protein, color: 'var(--blue)' },
            { label: tr(lang, 'dietFat'), val: totalFat, target: profile.fat, color: 'var(--purple)' },
          ].map(({ label, val, target, color }, i) => (
            <div key={label} style={{ padding: '8px 0 11px', borderTop: '.5px solid var(--bd)', textAlign: 'center', borderRight: i < 2 ? '.5px solid var(--bd)' : 'none' }}>
              <div style={{ fontSize: '10px', color: 'var(--tm)', marginBottom: '3px' }}>{label}</div>
              <div style={{ fontSize: '19px', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color }}>{Math.round(val)}<span style={{ fontSize: '12px', fontWeight: 500 }}>g</span></div>
              <div style={{ fontSize: '10px', color: 'var(--tm)', marginTop: '1px' }}>/ {target}g</div>
            </div>
          ))}
        </div>
        {/* Ratio bar */}
        <div style={{ padding: '8px 14px 12px', borderTop: '.5px solid var(--bd)' }}>
          <div style={{ display: 'flex', height: '5px', borderRadius: '3px', overflow: 'hidden', marginBottom: '6px' }}>
            {(() => {
              const tc = profile.carbs * 4, tp = profile.protein * 4, tf = profile.fat * 9, tot = tc + tp + tf
              return tot > 0 ? <>
                <div style={{ width: `${tc/tot*100}%`, background: 'var(--red)' }} />
                <div style={{ width: `${tp/tot*100}%`, background: 'var(--blue)' }} />
                <div style={{ width: `${tf/tot*100}%`, background: 'var(--purple)' }} />
              </> : null
            })()}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--tm)' }}>
            {[
              { label: lang === 'ko' ? '탄' : 'C', pct: Math.round(profile.carbs * 4 / (profile.carbs * 4 + profile.protein * 4 + profile.fat * 9) * 100), color: 'var(--red)' },
              { label: lang === 'ko' ? '단' : 'P', pct: Math.round(profile.protein * 4 / (profile.carbs * 4 + profile.protein * 4 + profile.fat * 9) * 100), color: 'var(--blue)' },
              { label: lang === 'ko' ? '지' : 'F', pct: Math.round(profile.fat * 9 / (profile.carbs * 4 + profile.protein * 4 + profile.fat * 9) * 100), color: 'var(--purple)' },
            ].map(({ label, pct, color }) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, display: 'inline-block' }} />{label} {pct}%
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Meal slots */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--tm)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '8px' }}>{lang === 'ko' ? '식사 기록' : 'Meals'}</div>
        {MEAL_SLOTS.map(({ key, labelKey, pct: slotPct }) => {
          const slotEntries = log?.meals[key] ?? []
          const slotCal = slotEntries.reduce((a, e) => a + e.calories, 0)
          const slotTarget = Math.round(profile.calories * slotPct)
          const hasEntries = slotEntries.length > 0

          return (
            <div key={key} style={{ background: 'var(--bg2)', border: `.5px solid ${hasEntries ? 'var(--green-bd)' : 'var(--bd)'}`, borderRadius: 'var(--r)', marginBottom: '8px', overflow: 'hidden' }}>
              {/* Slot header row */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '11px 13px', gap: '11px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: hasEntries ? 'var(--green-bg)' : 'var(--bg3)', border: `.5px solid ${hasEntries ? 'var(--green-bd)' : 'var(--bd)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums', color: hasEntries ? 'var(--green)' : 'var(--tp)' }}>{slotCal}</span>
                  <span style={{ fontSize: '8px', color: 'var(--tm)' }}>kcal</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>{tr(lang, labelKey as Parameters<typeof tr>[1])}</div>
                  <div style={{ fontSize: '11px', color: hasEntries ? 'var(--green)' : 'var(--tm)', marginTop: '2px' }}>
                    {hasEntries
                      ? slotEntries.map(e => e.name).join(' · ')
                      : `${tr(lang, 'dietTarget')} ${slotTarget} kcal`}
                  </div>
                </div>
                <button onClick={() => setOpenSlot(key)} style={{ width: '30px', height: '30px', borderRadius: '50%', border: '.5px solid var(--green)', background: 'var(--green-bg)', color: 'var(--green)', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, fontWeight: 300, fontFamily: 'inherit' }}>+</button>
              </div>
              {/* Logged entries */}
              {slotEntries.map((entry, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 13px', borderTop: '.5px solid var(--bd)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--tm)' }}>{entry.amount}{entry.unit} · 탄 {Math.round(entry.carbs)}g 단 {Math.round(entry.protein)}g 지 {Math.round(entry.fat)}g</div>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--green)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{entry.calories} kcal</span>
                  <button onClick={() => onRemoveEntry(date, key, idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bds)', padding: '2px' }}><IconTrash size={14} /></button>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* 7-day chart */}
      <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bd)', borderRadius: 'var(--r)', padding: '14px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700 }}>{tr(lang, 'diet7Day')}</span>
        </div>
        <CalChart logs={logs} today={today} target={profile.calories} lang={lang} />
      </div>

    </div>
  )
}
