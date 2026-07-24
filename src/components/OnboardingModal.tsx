import { useState, useEffect } from 'react'
import { IconX, IconChevronLeft } from '@tabler/icons-react'

const STORAGE_KEY = 'mygym_onboarding_seen'
const GREEN = '#22c55e'

const slides = [
  {
    step: 1,
    eyebrow: '루틴 만들기',
    title: '사진 한 장으로 AI가 루틴을 만들어줘요',
    desc: '운동 사진을 올리면 AI가 루틴을 자동으로 구성해줘요. Push·Pull·Legs 분할을 직접 만들 수도 있고, 운동·세트·기본 무게를 저장해두면 다음 운동부터 자동으로 채워져요.',
    Visual: VisualRoutine,
  },
  {
    step: 2,
    eyebrow: '운동 로깅',
    title: '시작 버튼 하나로 오늘 운동 시작',
    desc: '루틴을 선택하면 기본 무게가 세트에 자동으로 채워져요. 렙을 채우고 체크하면서 진행하고, PR은 자동 감지돼요.',
    Visual: VisualLogging,
  },
  {
    step: 3,
    eyebrow: '운동 히스토리',
    title: '달력으로 언제 뭘 했는지 한눈에',
    desc: '운동한 날에 초록 점이 찍혀요. 날짜를 탭하면 그날 루틴·세트·볼륨 전체를 다시 볼 수 있어요.',
    Visual: VisualCalendar,
  },
  {
    step: 4,
    eyebrow: '체성분 추적',
    title: '체중·체지방·근육량 변화를 추적해요',
    desc: '인바디 수치를 꾸준히 기록하면 체중 추이 그래프와 목표 달성률을 한눈에 볼 수 있어요.',
    Visual: VisualBody,
  },
  {
    step: 5,
    eyebrow: '식단 기록',
    title: '끼니마다 기록하고 목표 칼로리 맞추기',
    desc: '식약처 36,000가지 DB와 나만의 음식으로 빠르게 기록해요. 즐겨찾기와 식사 묶음으로 반복 입력을 줄일 수 있어요.',
    Visual: VisualDiet,
  },
]

export default function OnboardingModal() {
  const [visible, setVisible] = useState(false)
  const [cur, setCur] = useState(0)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  const isFinal = cur === slides.length
  const pct = (cur / slides.length) * 100

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) dismiss() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div style={{
        background: 'var(--s2)', border: '.5px solid var(--bd)',
        borderRadius: '20px', width: '100%', maxWidth: '460px',
        overflow: 'hidden', position: 'relative',
        boxShadow: '0 24px 64px rgba(0,0,0,.5)',
      }}>
        {/* progress bar */}
        <div style={{ height: '3px', background: 'var(--s1)' }}>
          <div style={{
            height: '100%', background: GREEN,
            width: `${pct}%`, transition: 'width .35s ease',
            borderRadius: '0 2px 2px 0',
          }} />
        </div>

        {/* skip / close */}
        {!isFinal && (
          <button
            onClick={dismiss}
            style={{
              position: 'absolute', top: '14px', right: '14px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--tm)', padding: '4px', display: 'flex',
            }}
            aria-label="건너뛰기"
          >
            <IconX size={18} />
          </button>
        )}

        {/* slide content */}
        <div style={{ overflow: 'hidden' }}>
          <div style={{
            display: 'flex',
            transform: `translateX(-${cur * 100}%)`,
            transition: 'transform .35s cubic-bezier(.45,.05,.28,1)',
          }}>
            {slides.map(({ step, eyebrow, title, desc, Visual }) => (
              <div key={step} style={{
                minWidth: '100%', padding: '32px 30px 24px',
                display: 'flex', flexDirection: 'column', gap: '20px',
              }}>
                {/* illustration */}
                <div style={{
                  width: '100%', height: '164px',
                  background: 'var(--s1)', borderRadius: '14px',
                  border: '.5px solid var(--bd)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  <Visual />
                </div>

                {/* text */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%',
                      border: `1.5px solid ${GREEN}`, background: `${GREEN}18`,
                      color: GREEN, fontSize: '10px', fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>{step}</div>
                    <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: GREEN }}>{eyebrow}</span>
                  </div>
                  <div style={{ fontSize: '19px', fontWeight: 800, color: 'var(--tp)', lineHeight: 1.25 }}>{title}</div>
                  <div style={{ fontSize: '13.5px', lineHeight: 1.65, color: 'var(--tm)' }}>{desc}</div>
                </div>
              </div>
            ))}

            {/* final slide */}
            <div style={{
              minWidth: '100%', padding: '48px 30px 40px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              textAlign: 'center', gap: '16px',
            }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: `${GREEN}18`, border: `2px solid ${GREEN}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <polyline points="5,14 11,20 23,8" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ fontSize: '21px', fontWeight: 800, color: 'var(--tp)' }}>이제 시작할 준비가 됐어요!</div>
              <div style={{ fontSize: '13.5px', lineHeight: 1.65, color: 'var(--tm)', maxWidth: '28ch' }}>
                루틴을 먼저 만들고 오늘 운동을 기록해보세요. 언제든 설정에서 가이드를 다시 볼 수 있어요.
              </div>
              <button
                onClick={dismiss}
                style={{
                  marginTop: '8px', width: '100%', padding: '13px',
                  background: GREEN, color: '#071410',
                  border: 'none', borderRadius: '12px',
                  fontSize: '15px', fontWeight: 800,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                MyGym 시작하기
              </button>
            </div>
          </div>
        </div>

        {/* footer */}
        {!isFinal && (
          <div style={{
            padding: '16px 30px 22px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderTop: '.5px solid var(--bd)',
          }}>
            <span style={{ fontSize: '12px', color: 'var(--ts)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {cur + 1} / {slides.length}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {cur > 0 && (
                <button
                  onClick={() => setCur(c => c - 1)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '9px 16px', borderRadius: '10px',
                    border: '.5px solid var(--bd)', background: 'var(--s1)',
                    color: 'var(--tm)', fontSize: '13px', fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <IconChevronLeft size={15} />이전
                </button>
              )}
              <button
                onClick={() => setCur(c => c + 1)}
                style={{
                  padding: '9px 22px', borderRadius: '10px',
                  border: 'none', background: GREEN,
                  color: '#071410', fontSize: '13px', fontWeight: 800,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {cur === slides.length - 1 ? '완료' : '다음'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── SVG Illustrations ──────────────────────────────────────────────────────────

function VisualRoutine() {
  return (
    <svg width="340" height="164" viewBox="0 0 340 164" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Left: photo upload card */}
      <rect x="8" y="10" width="122" height="144" rx="10" fill="var(--s2)" stroke="var(--bd)" strokeWidth="1"/>
      {/* Photo placeholder */}
      <rect x="16" y="18" width="106" height="72" rx="7" fill="var(--s1)"/>
      {/* Ground line */}
      <line x1="28" y1="72" x2="110" y2="72" stroke="var(--bd)" strokeWidth="0.8"/>
      {/* Barbell */}
      <rect x="44" y="54" width="38" height="5" rx="2.5" fill="var(--ts)" opacity=".3"/>
      <rect x="37" y="51" width="8" height="11" rx="2" fill="var(--ts)" opacity=".3"/>
      <rect x="81" y="51" width="8" height="11" rx="2" fill="var(--ts)" opacity=".3"/>
      {/* Person above barbell */}
      <circle cx="63" cy="36" r="5" fill="none" stroke="var(--ts)" strokeWidth="1.2" opacity=".4"/>
      <line x1="63" y1="41" x2="63" y2="52" stroke="var(--ts)" strokeWidth="1.2" opacity=".4"/>
      <line x1="53" y1="47" x2="73" y2="47" stroke="var(--ts)" strokeWidth="1.2" opacity=".4"/>
      {/* AI badge on photo */}
      <rect x="93" y="20" width="26" height="13" rx="4" fill={GREEN}/>
      <text x="106" y="29.5" fill="#071410" fontSize="8" fontFamily="-apple-system,sans-serif" fontWeight="900" textAnchor="middle">✨ AI</text>
      {/* Label */}
      <text x="69" y="104" fill="var(--ts)" fontSize="7.5" fontFamily="-apple-system,sans-serif" fontWeight="600" textAnchor="middle">운동 사진 한 장이면</text>
      {/* CTA button */}
      <rect x="16" y="109" width="106" height="24" rx="7" fill={GREEN}/>
      <text x="69" y="125" fill="#071410" fontSize="9" fontFamily="-apple-system,sans-serif" fontWeight="800" textAnchor="middle">AI로 루틴 만들기</text>
      <text x="69" y="145" fill="var(--ts)" fontSize="7.5" fontFamily="-apple-system,sans-serif" textAnchor="middle">또는 직접 구성하기 →</text>

      {/* Arrow */}
      <path d="M134,82 L156,82" stroke={GREEN} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M152,78 L156,82 L152,86" stroke={GREEN} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>

      {/* Right: generated routine */}
      <rect x="162" y="10" width="170" height="144" rx="10" fill="var(--s2)" stroke="var(--bd)" strokeWidth="1"/>
      <rect x="174" y="22" width="84" height="14" rx="4" fill={`${GREEN}22`}/>
      <text x="182" y="33" fill={GREEN} fontSize="10" fontFamily="-apple-system,sans-serif" fontWeight="800">Push Day</text>
      <text x="174" y="50" fill="var(--ts)" fontSize="8" fontFamily="-apple-system,sans-serif">✨ AI 자동 완성 · 3 운동</text>
      {[['벤치 프레스','3×8 · 80kg',56],['인클라인 DB 프레스','3×10',78],['케이블 플라이','3×12',100]].map(([name,sub,y]) => (
        <g key={y as number}>
          <rect x="174" y={y as number} width="148" height="18" rx="5" fill="var(--s1)" stroke="var(--bd)" strokeWidth="1"/>
          <rect x="174" y={y as number} width="4" height="18" rx="2" fill={GREEN}/>
          <text x="184" y={y as number + 13} fill="var(--tp)" fontSize="9" fontFamily="-apple-system,sans-serif" fontWeight="600">{name}</text>
          <text x="320" y={y as number + 13} fill="var(--tm)" fontSize="8.5" fontFamily="-apple-system,sans-serif" textAnchor="end">{sub}</text>
        </g>
      ))}
      <rect x="174" y="124" width="148" height="14" rx="4" fill={`${GREEN}10`} stroke={GREEN} strokeWidth=".8" strokeDasharray="3 2"/>
      <text x="248" y="134" fill={GREEN} fontSize="9" fontFamily="-apple-system,sans-serif" fontWeight="700" textAnchor="middle">+ 운동 추가</text>
    </svg>
  )
}

function VisualLogging() {
  return (
    <svg width="340" height="164" viewBox="0 0 340 164" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="12" width="140" height="140" rx="10" fill="var(--s2)" stroke="var(--bd)" strokeWidth="1"/>
      <text x="26" y="30" fill="var(--tp)" fontSize="12" fontFamily="-apple-system,sans-serif" fontWeight="800">Push A</text>
      <text x="26" y="44" fill="var(--tm)" fontSize="8.5" fontFamily="-apple-system,sans-serif">마지막: 2일 전</text>
      <text x="26" y="60" fill="var(--tm)" fontSize="8.5" fontFamily="-apple-system,sans-serif">· 벤치 프레스 3×8</text>
      <text x="26" y="74" fill="var(--tm)" fontSize="8.5" fontFamily="-apple-system,sans-serif">· 인클라인 DB 3×10</text>
      <text x="26" y="88" fill="var(--tm)" fontSize="8.5" fontFamily="-apple-system,sans-serif">· 케이블 플라이 3×12</text>
      <rect x="22" y="108" width="120" height="28" rx="8" fill={GREEN}/>
      <text x="82" y="126" fill="#071410" fontSize="11" fontFamily="-apple-system,sans-serif" fontWeight="800" textAnchor="middle">▶ 운동 시작</text>
      <circle cx="82" cy="122" r="24" stroke={GREEN} strokeWidth="1" fill="none" opacity=".25">
        <animate attributeName="r" values="22;32;22" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values=".25;0;.25" dur="2s" repeatCount="indefinite"/>
      </circle>

      <path d="M158,82 L174,82" stroke={GREEN} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M170,78 L174,82 L170,86" stroke={GREEN} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>

      <rect x="178" y="12" width="148" height="140" rx="10" fill="var(--s2)" stroke="var(--bd)" strokeWidth="1"/>
      <text x="190" y="29" fill="var(--tp)" fontSize="11" fontFamily="-apple-system,sans-serif" fontWeight="800">벤치 프레스</text>
      <text x="190" y="44" fill="var(--ts)" fontSize="8" fontFamily="-apple-system,sans-serif">#</text>
      <text x="210" y="44" fill="var(--ts)" fontSize="8" fontFamily="-apple-system,sans-serif">Weight</text>
      <text x="275" y="44" fill="var(--ts)" fontSize="8" fontFamily="-apple-system,sans-serif">Reps</text>
      {[[1,'80','8',48,false],[2,'80','8',70,false]].map(([n,w,r,y,_]) => (
        <g key={y as number}>
          <rect x="190" y={y as number} width="128" height="18" rx="4" fill="var(--s1)"/>
          <text x="197" y={y as number + 13} fill="var(--tm)" fontSize="9" fontFamily="-apple-system,sans-serif">{n}</text>
          <rect x="210" y={y as number + 2} width="56" height="14" rx="4" fill="var(--s2)" stroke="var(--bd)" strokeWidth="1"/>
          <text x="238" y={y as number + 13} fill="var(--tp)" fontSize="9.5" fontFamily="-apple-system,sans-serif" fontWeight="700" textAnchor="middle">{w}</text>
          <rect x="272" y={y as number + 2} width="36" height="14" rx="4" fill="var(--s2)" stroke="var(--bd)" strokeWidth="1"/>
          <text x="290" y={y as number + 13} fill="var(--tp)" fontSize="9.5" fontFamily="-apple-system,sans-serif" fontWeight="700" textAnchor="middle">{r}</text>
          <circle cx="317" cy={y as number + 9} r="7" fill={`${GREEN}20`}/>
          <polyline points={`313,${y as number+9} 316,${y as number+12} 321,${y as number+5}`} stroke={GREEN} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      ))}
      <rect x="190" y="92" width="128" height="18" rx="4" fill={`${GREEN}08`} stroke={`${GREEN}40`} strokeWidth=".8"/>
      <text x="197" y="105" fill={GREEN} fontSize="9" fontFamily="-apple-system,sans-serif" fontWeight="700">3</text>
      <rect x="210" y="94" width="56" height="14" rx="4" fill={`${GREEN}15`} stroke={GREEN} strokeWidth="1"/>
      <text x="238" y="105" fill={GREEN} fontSize="9.5" fontFamily="-apple-system,sans-serif" fontWeight="700" textAnchor="middle">80</text>
      <rect x="272" y="94" width="36" height="14" rx="4" fill={`${GREEN}15`} stroke={GREEN} strokeWidth="1"/>
      <text x="282" y="105" fill="var(--tp)" fontSize="9.5" fontFamily="-apple-system,sans-serif" fontWeight="700">7</text>
      <line x1="294" y1="95" x2="294" y2="107" stroke={GREEN} strokeWidth="1.5" strokeLinecap="round">
        <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/>
      </line>
      <rect x="190" y="120" width="128" height="18" rx="5" fill={`${GREEN}12`}/>
      <text x="254" y="133" fill={GREEN} fontSize="9.5" fontFamily="-apple-system,sans-serif" fontWeight="800" textAnchor="middle">⏱ 00:18 운동 중</text>
    </svg>
  )
}

function VisualCalendar() {
  const days = [
    [null,null,null,1,2,3,4],
    [5,6,7,8,9,10,11],
    [12,13,14,15,16,17,18],
    [19,20,21,22,23,24,25],
  ]
  const workout = new Set([5,8,10,11,13,15,17,19,22])
  const today = 11
  const cx = (col: number) => 38 + col * 40
  const cy = (row: number) => 56 + row * 22

  return (
    <svg width="340" height="164" viewBox="0 0 340 164" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="20" y="24" fill="var(--tp)" fontSize="13" fontFamily="-apple-system,sans-serif" fontWeight="800">2026년 7월</text>
      {['일','월','화','수','목','금','토'].map((d,i) => (
        <text key={d} x={cx(i)} y="42" fill="var(--ts)" fontSize="9" fontFamily="-apple-system,sans-serif" fontWeight="700" textAnchor="middle">{d}</text>
      ))}
      {days.map((week, ri) => week.map((day, ci) => {
        if (!day) return null
        const x = cx(ci), y = cy(ri)
        const isToday = day === today
        const isWorkout = workout.has(day)
        return (
          <g key={`${ri}-${ci}`}>
            {isToday && <circle cx={x} cy={y - 4} r="13" fill={`${GREEN}18`} stroke={GREEN} strokeWidth="1.2"/>}
            <text x={x} y={y} fill={isToday ? GREEN : isWorkout ? 'var(--tp)' : 'var(--ts)'}
              fontSize="11" fontFamily="-apple-system,sans-serif"
              fontWeight={isToday ? '800' : isWorkout ? '600' : '400'}
              textAnchor="middle">{day}</text>
            {isWorkout && <circle cx={x} cy={y+5} r="2.5" fill={GREEN}/>}
          </g>
        )
      }))}
      <rect x="14" y="140" width="312" height="18" rx="6" fill="var(--s2)" stroke="var(--bd)" strokeWidth="1"/>
      <text x="26" y="152" fill={GREEN} fontSize="9.5" fontFamily="-apple-system,sans-serif" fontWeight="800">Push A</text>
      <text x="72" y="152" fill="var(--tm)" fontSize="9" fontFamily="-apple-system,sans-serif">· 4운동 · 00:52 · 7,040kg</text>
    </svg>
  )
}

function VisualBody() {
  return (
    <svg width="340" height="164" viewBox="0 0 340 164" fill="none" xmlns="http://www.w3.org/2000/svg">
      {[['체중','78.4','kg','var(--tp)',14],['체지방률','16.2','%','#F97316',100],['골격근량','35.1','kg','#3B82F6',186],['BMI','23.8','','var(--tp)',272]].map(([label,val,unit,color,x]) => (
        <g key={x as number}>
          <rect x={x as number} y="10" width="68" height="50" rx="9" fill="var(--s2)" stroke="var(--bd)" strokeWidth="1"/>
          <text x={(x as number)+34} y="26" fill="var(--tm)" fontSize="8" fontFamily="-apple-system,sans-serif" fontWeight="700" textAnchor="middle" letterSpacing=".05em">{label}</text>
          <text x={(x as number)+34} y="46" fill={color as string} fontSize="17" fontFamily="-apple-system,sans-serif" fontWeight="800" textAnchor="middle" style={{ fontVariantNumeric: 'tabular-nums' }}>{val}</text>
          <text x={(x as number)+34} y="57" fill="var(--tm)" fontSize="8" fontFamily="-apple-system,sans-serif" textAnchor="middle">{unit}</text>
        </g>
      ))}
      <rect x="14" y="70" width="312" height="84" rx="10" fill="var(--s2)" stroke="var(--bd)" strokeWidth="1"/>
      <text x="26" y="86" fill="var(--tm)" fontSize="8.5" fontFamily="-apple-system,sans-serif" fontWeight="700" letterSpacing=".06em">체중 추이</text>
      <line x1="26" y1="95" x2="314" y2="95" stroke="var(--bd)" strokeWidth=".5"/>
      <line x1="26" y1="112" x2="314" y2="112" stroke="var(--bd)" strokeWidth=".5"/>
      <line x1="26" y1="129" x2="314" y2="129" stroke="var(--bd)" strokeWidth=".5"/>
      <text x="22" y="98" fill="var(--ts)" fontSize="7.5" fontFamily="-apple-system,sans-serif" textAnchor="end">80</text>
      <text x="22" y="115" fill="var(--ts)" fontSize="7.5" fontFamily="-apple-system,sans-serif" textAnchor="end">79</text>
      <text x="22" y="132" fill="var(--ts)" fontSize="7.5" fontFamily="-apple-system,sans-serif" textAnchor="end">78</text>
      <path d="M26,120 L66,116 L106,114 L146,117 L186,112 L226,108 L266,104 L306,100 L306,144 L26,144 Z" fill={`${GREEN}09`}/>
      <polyline points="26,120 66,116 106,114 146,117 186,112 226,108 266,104 306,100" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="306" cy="100" r="3.5" fill={GREEN}/>
      <rect x="284" y="90" width="36" height="13" rx="4" fill={`${GREEN}20`}/>
      <text x="302" y="100" fill={GREEN} fontSize="8.5" fontFamily="-apple-system,sans-serif" fontWeight="800" textAnchor="middle">78.4</text>
    </svg>
  )
}

function VisualDiet() {
  return (
    <svg width="340" height="164" viewBox="0 0 340 164" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="10" width="148" height="144" rx="10" fill="var(--s2)" stroke="var(--bd)" strokeWidth="1"/>
      <circle cx="88" cy="66" r="38" fill="none" stroke="var(--bd)" strokeWidth="8"/>
      <circle cx="88" cy="66" r="38" fill="none" stroke={GREEN} strokeWidth="8"
        strokeDasharray="208 239" strokeDashoffset="60" strokeLinecap="round"/>
      <text x="88" y="61" fill="var(--tp)" fontSize="14" fontFamily="-apple-system,sans-serif" fontWeight="800" textAnchor="middle">1,840</text>
      <text x="88" y="74" fill="var(--tm)" fontSize="8.5" fontFamily="-apple-system,sans-serif" textAnchor="middle">/ 2,100 kcal</text>
      {[['탄','#F97316','84',118],['단','#3B82F6','162',134],['지','#A855F7','48',150]].map(([label,color,val,y]) => (
        <g key={y as number}>
          <text x="28" y={y as number} fill="var(--tm)" fontSize="8" fontFamily="-apple-system,sans-serif" fontWeight="700">{label}</text>
          <rect x="40" y={(y as number)-8} width="100" height="5" rx="2.5" fill="var(--s1)"/>
          <rect x="40" y={(y as number)-8} width={label==='탄'?75:label==='단'?90:50} height="5" rx="2.5" fill={color as string}/>
          <text x="148" y={y as number} fill="var(--tp)" fontSize="8.5" fontFamily="-apple-system,sans-serif" fontWeight="700" textAnchor="end">{val}g</text>
        </g>
      ))}

      <rect x="172" y="10" width="154" height="144" rx="10" fill="var(--s2)" stroke="var(--bd)" strokeWidth="1"/>
      {[['아침',['그릭요거트','오트밀'],340,18],['점심',['닭가슴살 · 현미밥','계란 2개'],[620,140],62],['저녁',['연어 · 샐러드'],480,120]].map(([slot,foods,cals,y]) => (
        <g key={slot as string}>
          <text x="184" y={(y as number)+14} fill="var(--ts)" fontSize="8" fontFamily="-apple-system,sans-serif" fontWeight="700" letterSpacing=".05em">{slot}</text>
          {(Array.isArray(foods) ? foods : [foods]).map((f,i) => (
            <g key={i}>
              <rect x="184" y={(y as number)+18+i*20} width="130" height="16" rx="4" fill="var(--s1)"/>
              <text x="190" y={(y as number)+29+i*20} fill="var(--tp)" fontSize="8.5" fontFamily="-apple-system,sans-serif">{f}</text>
              <text x="310" y={(y as number)+29+i*20} fill="var(--tm)" fontSize="8" fontFamily="-apple-system,sans-serif" textAnchor="end">{Array.isArray(cals)?cals[i]:cals}</text>
            </g>
          ))}
        </g>
      ))}
      <rect x="184" y="140" width="130" height="10" rx="3" fill={`${GREEN}12`} stroke={GREEN} strokeWidth=".6" strokeDasharray="3 2"/>
      <text x="249" y="148" fill={GREEN} fontSize="8" fontFamily="-apple-system,sans-serif" fontWeight="700" textAnchor="middle">+ 음식 추가</text>
    </svg>
  )
}
