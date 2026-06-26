import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { signInWithGoogle } = useAuth()

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--s0)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
    }}>
      <div style={{
        background: 'var(--s2)',
        border: '0.5px solid var(--bd)',
        borderRadius: '16px',
        padding: '2.5rem 2rem',
        width: '100%',
        maxWidth: '360px',
        textAlign: 'center',
      }}>
        {/* 로고 */}
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>💪</div>
        <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px', color: 'var(--tp)' }}>
          My Gym Log
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--ts)', marginBottom: '2rem' }}>
          운동 일지를 기록하고 성장을 확인하세요
        </p>

        {/* 구글 로그인 버튼 */}
        <button
          onClick={signInWithGoogle}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            width: '100%',
            padding: '11px 16px',
            border: '0.5px solid var(--bds)',
            borderRadius: '8px',
            background: 'var(--s1)',
            color: 'var(--tp)',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bd)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--s1)')}
        >
          {/* Google SVG 로고 */}
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
            <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z"/>
          </svg>
          Google 계정으로 시작하기
        </button>

        <p style={{ fontSize: '12px', color: 'var(--tm)', marginTop: '1.5rem', lineHeight: '1.6' }}>
          계속 진행하면 서비스 이용약관 및<br />개인정보처리방침에 동의하는 것으로 간주됩니다.
        </p>
      </div>
    </div>
  )
}
