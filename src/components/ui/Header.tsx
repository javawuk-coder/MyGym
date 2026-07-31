import { useState, useRef, useEffect } from 'react'
import { IconShield, IconLogout, IconUser, IconLanguage, IconWeight } from '@tabler/icons-react'
import { useAuth } from '../../contexts/AuthContext'
import { tr, LANG_LABELS, type Lang } from '../../lib/i18n'

interface HeaderProps {
  unit: 'kg' | 'lb'
  onUnitToggle: (u: 'kg' | 'lb') => void
  lang: Lang
  onLangChange: (l: Lang) => void
}

export default function Header({ unit, onUnitToggle, lang, onLangChange }: HeaderProps) {
  const { profile, isAdmin, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
      <div style={{ fontSize: '22px', fontWeight: '600' }}>💪 My Gym Log</div>

      <div ref={menuRef} style={{ position: 'relative' }}>
        {/* 아바타 + 설정 버튼 */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px 4px 4px',
            border: '0.5px solid var(--bds)', borderRadius: '20px',
            cursor: 'pointer', background: 'transparent', fontFamily: 'inherit',
          }}
        >
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            overflow: 'hidden', background: 'var(--s1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {profile?.photoURL
              ? <img src={profile.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <IconUser size={15} color="var(--ts)" />}
          </div>
          <span style={{ fontSize: '13px', color: 'var(--ts)' }}>{tr(lang, 'settings')}</span>
        </button>

        {menuOpen && (
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 6px)',
            background: 'var(--s2)', border: '0.5px solid var(--bd)',
            borderRadius: '10px', minWidth: '200px', zIndex: 50,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            overflow: 'hidden',
          }}>
            {/* 유저 정보 */}
            <div style={{ padding: '12px 14px', borderBottom: '0.5px solid var(--bd)' }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--tp)' }}>
                {profile?.displayName || '사용자'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--tm)', marginTop: '2px' }}>
                {profile?.email}
              </div>
            </div>

            {/* 언어 선택 */}
            <div style={{ padding: '10px 14px', borderBottom: '0.5px solid var(--bd)' }}>
              <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <IconLanguage size={12} />{tr(lang, 'language')}
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {(['ko', 'en', 'vi'] as Lang[]).map(l => (
                  <button key={l} onClick={() => { onLangChange(l); setMenuOpen(false) }} style={{
                    flex: 1, padding: '4px 2px', fontSize: '11px', borderRadius: '6px',
                    border: `0.5px solid ${lang === l ? 'var(--tp)' : 'var(--bd)'}`,
                    background: lang === l ? 'var(--tp)' : 'transparent',
                    color: lang === l ? '#fff' : 'var(--ts)',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    {LANG_LABELS[l]}
                  </button>
                ))}
              </div>
            </div>

            {/* 무게 단위 */}
            <div style={{ padding: '10px 14px', borderBottom: '0.5px solid var(--bd)' }}>
              <div style={{ fontSize: '11px', color: 'var(--tm)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <IconWeight size={12} />KG / LB
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {(['kg', 'lb'] as const).map(u => (
                  <button key={u} onClick={() => onUnitToggle(u)} style={{
                    flex: 1, padding: '4px 2px', fontSize: '11px', borderRadius: '6px',
                    border: `0.5px solid ${unit === u ? 'var(--tp)' : 'var(--bd)'}`,
                    background: unit === u ? 'var(--tp)' : 'transparent',
                    color: unit === u ? '#fff' : 'var(--ts)',
                    cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase',
                  }}>
                    {u}
                  </button>
                ))}
              </div>
            </div>

            {/* Admin 패널 */}
            {isAdmin && (
              <a
                href="/admin"
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 14px', fontSize: '13px', color: '#185FA5',
                  textDecoration: 'none', borderBottom: '0.5px solid var(--bd)',
                }}
                onClick={() => setMenuOpen(false)}
              >
                <IconShield size={15} />
                {tr(lang, 'adminPanel')}
              </a>
            )}

            {/* 로그아웃 */}
            <button
              onClick={() => { logout(); setMenuOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                padding: '10px 14px', fontSize: '13px', color: 'var(--ts)',
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', textAlign: 'left',
              }}
            >
              <IconLogout size={15} />
              {tr(lang, 'logout')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
