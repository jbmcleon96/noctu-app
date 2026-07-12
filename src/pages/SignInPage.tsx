import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { getAuth, sendPasswordResetEmail } from 'firebase/auth'

function NoctuHeader({ subtitle }: { subtitle: string }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
      <div style={{ color: 'rgba(191,0,255,0.72)', fontSize: '11px', letterSpacing: '0.42em', textTransform: 'uppercase', marginBottom: '16px' }}>
        Noctu — Nightlife Membership
      </div>
      <div style={{ position: 'relative', width: '140px', height: '18px', margin: '0 auto 22px' }}>
        <div style={{ position: 'absolute', top: '9px', left: 0, right: 0, height: '1px', background: 'linear-gradient(to right, transparent, rgba(191,0,255,0.2), rgba(191,0,255,0.75), rgba(191,0,255,0.2), transparent)' }} />
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: '8px', height: '8px', borderRadius: '999px', background: '#d946ef', boxShadow: '0 0 8px rgba(217,70,239,0.9), 0 0 18px rgba(191,0,255,0.85)' }} />
      </div>
      <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#f5e9ff', fontSize: 'clamp(52px,12vw,106px)', fontWeight: 300, letterSpacing: '0.14em', lineHeight: 0.95, textTransform: 'uppercase' }}>
        <span>N</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '0.9em', height: '0.9em', borderRadius: '50%', position: 'relative', marginInline: '0.01em' }}>
          <span style={{ position: 'absolute', width: '80%', height: '80%', borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #f5dcff 0%, #d946ef 38%, #a21caf 68%, #6b21a8 100%)', boxShadow: '0 0 12px rgba(217,70,239,0.75)' }} />
          <span style={{ position: 'absolute', right: '-2%', top: '8%', width: '70%', height: '70%', borderRadius: '50%', background: '#05010a' }} />
        </span>
        <span>C</span><span>T</span><span>U</span>
      </h1>
      <div style={{ color: 'rgba(221,171,255,0.78)', fontSize: '13px', letterSpacing: '0.3em', textTransform: 'uppercase', marginTop: '18px' }}>
        Noctu is more than access — it's a way of life after dark
      </div>
      <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: '14px', marginTop: '14px', marginBottom: 0 }}>{subtitle}</p>
    </div>
  )
}

const inp: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(191,0,255,0.22)', borderRadius: '12px', padding: '14px 16px', color: 'white', fontSize: '15px', boxSizing: 'border-box', outline: 'none' }
const lbl: React.CSSProperties = { color: 'rgba(233,210,255,0.78)', fontSize: '12px', display: 'block', marginBottom: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }

export default function SignInPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/dashboard')
    } catch {
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email.trim()) return setError('Enter your email above first, then tap Forgot Password.')
    setResetLoading(true)
    try {
      await sendPasswordResetEmail(getAuth(), email)
      setResetSent(true)
      setError('')
    } catch {
      setError('Could not send reset email. Check the address and try again.')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top, rgba(191,0,255,0.22) 0%, rgba(139,92,246,0.14) 16%, rgba(30,0,40,0.9) 42%, #05010a 72%, #000000 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
      <div style={{ width: '100%', maxWidth: '430px' }}>
        <NoctuHeader subtitle="Member login" />
        <div style={{ background: 'rgba(16,0,26,0.78)', border: '1px solid rgba(191,0,255,0.18)', borderRadius: '20px', padding: '28px 22px', backdropFilter: 'blur(12px)', boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 32px rgba(191,0,255,0.12)' }}>
          {error && <div style={{ background: 'rgba(90,0,40,0.45)', border: '1px solid rgba(255,70,140,0.55)', color: '#ffd7ef', padding: '12px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
          {resetSent && <div style={{ background: 'rgba(0,180,100,0.15)', border: '1px solid rgba(0,200,120,0.4)', color: '#7fffd4', padding: '12px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>Reset email sent — check your inbox.</div>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div><label style={lbl}>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" style={inp} /></div>
            <div><label style={lbl}>Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Password" style={inp} /></div>
            <button type="submit" disabled={loading} style={{ marginTop: '6px', background: 'linear-gradient(180deg,#d946ef 0%,#a21caf 100%)', color: '#fff', fontWeight: 700, padding: '14px', borderRadius: '12px', border: 'none', fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.72 : 1, boxShadow: '0 10px 24px rgba(191,0,255,0.28)' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '14px' }}>
            <button onClick={handleForgotPassword} disabled={resetLoading} type="button" style={{ background: 'transparent', border: 'none', color: 'rgba(191,0,255,0.7)', fontSize: '13px', cursor: 'pointer', padding: 0 }}>
              {resetLoading ? 'Sending...' : 'Forgot password?'}
            </button>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', textAlign: 'center', marginTop: '20px' }}>
            New here?{' '}<Link to="/signup" style={{ color: '#d946ef', textDecoration: 'none', fontWeight: 600 }}>Create an account</Link>
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center', marginTop: '10px' }}>
            Are you a club owner?{' '}<Link to="/owner-signin" style={{ color: 'rgba(191,0,255,0.7)', textDecoration: 'none', fontWeight: 600 }}>Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
