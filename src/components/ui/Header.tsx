import { useState, useRef, useEffect } from 'react'
import { IconShield, IconLogout, IconUser } from '@tabler/icons-react'
import { useAuth } from '../../contexts/AuthContext'

interface HeaderProps {
  unit: 'kg' | 'lb'
  onUnitToggle: (u: 'kg' | 'lb') => void
}

export default function Header({ unit, onUnitToggle }: HeaderProps) {
  const { profile, isAdmin, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // 메뉴 외부 클릭 시 닫기
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* KG / LB 토글 */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['kg', 'lb'] as const).map(u => (
            <button
              key={u}
              onClick={() => onUnitToggle(u)}
              style={{
                padding: '5px 14px',
                border: '0.5px solid var(--bds)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                background: unit === u ? 'var(--tp)' : 'transparent',
                color: unit === u ? 'var(--s2)' : 'var(--ts)',
                borderColor: unit === u ? 'var(--tp)' : 'var(--bds)',
                fontFamily: 'inherit',
                textTransform: 'uppercase',
              }}
            >
              {u}
            </button>
          ))}
        </div>

        {/* 유저 아바타 + 드롭다운 */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{
              width: '34px', height: '34px', borderRadius: '50%',
              border: '0.5px solid var(--bds)', cursor: 'pointer',
              overflow: 'hidden', padding: 0, background: 'var(--s1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <IconUser size={18} color="var(--ts)" />
            )}
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 6px)',
              background: 'var(--s2)', border: '0.5px solid var(--bd)',
              borderRadius: '10px', minWidth: '180px', zIndex: 50,
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
                  Admin 패널
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
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
