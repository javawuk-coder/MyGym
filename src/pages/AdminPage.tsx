import { useEffect, useState } from 'react'
import { collection, getDocs, doc, updateDoc, orderBy, query } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import type { UserProfile } from '../contexts/AuthContext'
import { IconUsers, IconShield, IconBan, IconCheck, IconArrowLeft } from '@tabler/icons-react'

export default function AdminPage() {
  const { profile, logout } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchUsers = async () => {
    setLoading(true)
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    setUsers(snap.docs.map(d => d.data() as UserProfile))
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const toggleDisabled = async (uid: string, current: boolean) => {
    await updateDoc(doc(db, 'users', uid), { disabled: !current })
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, disabled: !current } : u))
  }

  const toggleRole = async (uid: string, current: 'user' | 'admin') => {
    const next = current === 'admin' ? 'user' : 'admin'
    await updateDoc(doc(db, 'users', uid), { role: next })
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: next } : u))
  }

  const filtered = users.filter(u =>
    u.displayName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (ts: unknown) => {
    if (!ts) return '-'
    const d = (ts as { toDate?: () => Date }).toDate?.()
    if (!d) return '-'
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--s0)' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '1.5rem 1rem' }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IconShield size={22} color="#185FA5" />
            <span style={{ fontSize: '18px', fontWeight: '600' }}>Admin — 회원 관리</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <a href="/" style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '6px 12px', border: '0.5px solid var(--bds)', borderRadius: '8px',
              background: 'var(--s2)', color: 'var(--ts)', fontSize: '13px',
              textDecoration: 'none', cursor: 'pointer',
            }}>
              <IconArrowLeft size={14} /> 앱으로
            </a>
            <button onClick={logout} style={{
              padding: '6px 12px', border: '0.5px solid var(--bds)', borderRadius: '8px',
              background: 'transparent', color: 'var(--ts)', fontSize: '13px', cursor: 'pointer',
              fontFamily: 'inherit',
            }}>로그아웃</button>
          </div>
        </div>

        {/* 통계 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '1.5rem' }}>
          {[
            { label: '전체 회원', value: users.length },
            { label: 'Admin', value: users.filter(u => u.role === 'admin').length },
            { label: '정지된 계정', value: users.filter(u => u.disabled).length },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--s2)', border: '0.5px solid var(--bd)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '600' }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--tm)', marginTop: '3px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* 검색 */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <IconUsers size={16} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--tm)' }} />
          <input
            placeholder="이름 또는 이메일 검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px 9px 34px',
              border: '0.5px solid var(--bds)', borderRadius: '8px',
              background: 'var(--s2)', color: 'var(--tp)', fontSize: '14px',
              fontFamily: 'inherit', outline: 'none',
            }}
          />
        </div>

        {/* 회원 목록 */}
        <div style={{ background: 'var(--s2)', border: '0.5px solid var(--bd)', borderRadius: '12px', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--tm)', fontSize: '14px' }}>불러오는 중...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--tm)', fontSize: '14px' }}>회원이 없습니다</div>
          ) : filtered.map((u, i) => (
            <div key={u.uid} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 16px',
              borderBottom: i < filtered.length - 1 ? '0.5px solid var(--bd)' : 'none',
              opacity: u.disabled ? 0.5 : 1,
            }}>
              {/* 아바타 */}
              {u.photoURL ? (
                <img src={u.photoURL} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0 }} />
              ) : (
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--s1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                  {u.displayName?.[0] || '?'}
                </div>
              )}

              {/* 정보 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.displayName || '이름 없음'}
                  </span>
                  {u.role === 'admin' && (
                    <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '20px', background: '#E6F1FB', color: '#185FA5', fontWeight: '500', flexShrink: 0 }}>Admin</span>
                  )}
                  {u.disabled && (
                    <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '20px', background: '#FCEBEB', color: '#A32D2D', fontWeight: '500', flexShrink: 0 }}>정지</span>
                  )}
                  {u.uid === profile?.uid && (
                    <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '20px', background: '#EAF3DE', color: '#3B6D11', fontWeight: '500', flexShrink: 0 }}>나</span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--tm)', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.email} · 가입 {formatDate(u.createdAt)}
                </div>
              </div>

              {/* 액션 버튼 (자기 자신은 조작 불가) */}
              {u.uid !== profile?.uid && (
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button
                    onClick={() => toggleRole(u.uid, u.role)}
                    title={u.role === 'admin' ? 'Admin 해제' : 'Admin 승격'}
                    style={{
                      padding: '5px 8px', border: '0.5px solid var(--bds)', borderRadius: '6px',
                      background: u.role === 'admin' ? '#E6F1FB' : 'transparent',
                      color: u.role === 'admin' ? '#185FA5' : 'var(--ts)',
                      cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px',
                      fontFamily: 'inherit',
                    }}
                  >
                    <IconShield size={13} /> {u.role === 'admin' ? 'Admin' : '일반'}
                  </button>
                  <button
                    onClick={() => toggleDisabled(u.uid, u.disabled)}
                    title={u.disabled ? '계정 활성화' : '계정 정지'}
                    style={{
                      padding: '5px 8px', border: '0.5px solid var(--bds)', borderRadius: '6px',
                      background: u.disabled ? '#FCEBEB' : 'transparent',
                      color: u.disabled ? '#A32D2D' : 'var(--ts)',
                      cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px',
                      fontFamily: 'inherit',
                    }}
                  >
                    {u.disabled ? <><IconCheck size={13} /> 활성화</> : <><IconBan size={13} /> 정지</>}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
