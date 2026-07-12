import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'

export default function OwnerSignUpPage() {
  console.log('OwnerSignUpPage loaded')
 const { signUp, user } = useAuth()
 const navigate = useNavigate() 

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [clubName, setClubName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => {
  if (user) {
    navigate("/owner-dashboard", { replace: true })
  }
}, [user, navigate])

  const handleCreateAccount = async () => {
  setMessage('')
  setLoading(true)

  try {
    await signUp(email, password, 'owner')
    setMessage('Account created. Your club is now on the free early access plan.')
    navigate('/owner-dashboard')
  } catch (error: any) {
    setMessage(error?.message || 'Could not create account.')
  } finally {
    setLoading(false)
  }
}

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
        background: '#08000F',
        fontFamily: 'Inter,ui-sans-serif,system-ui,sans-serif',
        color: '#F6EEFF',
      }}
    >
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background:
            'linear-gradient(135deg,rgba(191,0,255,0.18) 0%,transparent 45%),linear-gradient(315deg,rgba(130,0,200,0.14) 0%,transparent 45%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: 'min(500px,100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
          padding: '48px 32px 40px',
          border: '1px solid rgba(191,0,255,0.18)',
          borderRadius: 36,
          background: 'rgba(10,2,18,0.88)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: 'clamp(28px,6vw,42px)',
            fontWeight: 900,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#F6EEFF',
            lineHeight: 1,
          }}
        >
          <span>N</span>
          <span
            style={{
              position: 'relative',
              width: '1em',
              height: '1em',
              display: 'inline-block',
              verticalAlign: 'middle',
            }}
          >
            <span
              style={{
                position: 'absolute',
                inset: '0.06em',
                borderRadius: '50%',
                background: 'linear-gradient(145deg,#E8C7FF 0%,#BF00FF 55%,#7F00AA 100%)',
                boxShadow: '0 0 32px rgba(191,0,255,0.7)',
              }}
            />
            <span
              style={{
                position: 'absolute',
                top: '0.06em',
                left: '0.14em',
                width: '0.88em',
                height: '0.88em',
                borderRadius: '50%',
                background: '#08000F',
                opacity: 1,
              }}
            />
          </span>
          <span>CTU</span>
        </div>

        <div
          style={{
            width: 48,
            height: 3,
            background: 'linear-gradient(90deg,#BF00FF,#7F00AA)',
            borderRadius: 999,
            marginTop: -12,
          }}
        />

        <div
          style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            width: '100%',
          }}
        >
          <div
            style={{
              fontSize: 'clamp(22px,5vw,32px)',
              fontWeight: 900,
              lineHeight: 1.05,
              color: '#F6EEFF',
            }}
          >
            Create your
            <br />
            <span style={{ color: '#BF00FF' }}>club account.</span>
          </div>

          <div
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: 'rgba(246,238,255,0.55)',
              maxWidth: '30ch',
              margin: '0 auto',
            }}
          >
            Join NOCTU free. Build your member base, customize perks, and start growing your venue.
          </div>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label
              style={{
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.16em',
                color: 'rgba(246,238,255,0.5)',
              }}
            >
              Club name
            </label>
            <input
              style={{
                width: '100%',
                height: 58,
                borderRadius: 16,
                border: '1px solid rgba(191,0,255,0.22)',
                background: 'rgba(255,255,255,0.04)',
                color: '#F6EEFF',
                padding: '0 18px',
                fontSize: 17,
                outline: 'none',
                fontFamily: 'inherit',
              }}
              type="text"
              placeholder="Club Onyx"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label
              style={{
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.16em',
                color: 'rgba(246,238,255,0.5)',
              }}
            >
              Email
            </label>
            <input
              style={{
                width: '100%',
                height: 58,
                borderRadius: 16,
                border: '1px solid rgba(191,0,255,0.22)',
                background: 'rgba(255,255,255,0.04)',
                color: '#F6EEFF',
                padding: '0 18px',
                fontSize: 17,
                outline: 'none',
                fontFamily: 'inherit',
              }}
              type="email"
              placeholder="owner@yourclub.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label
              style={{
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.16em',
                color: 'rgba(246,238,255,0.5)',
              }}
            >
              Password
            </label>
            <input
              style={{
                width: '100%',
                height: 58,
                borderRadius: 16,
                border: '1px solid rgba(191,0,255,0.22)',
                background: 'rgba(255,255,255,0.04)',
                color: '#F6EEFF',
                padding: '0 18px',
                fontSize: 17,
                outline: 'none',
                fontFamily: 'inherit',
              }}
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            style={{
              width: '100%',
              height: 58,
              borderRadius: 999,
              border: 'none',
              fontSize: 16,
              fontWeight: 800,
              cursor: 'pointer',
              background: 'linear-gradient(135deg,#E15BFF 0%,#BF00FF 55%,#8A00B8 100%)',
              color: 'white',
              boxShadow: '0 0 40px rgba(191,0,255,0.4)',
              opacity: loading || !email.trim() || !password.trim() || !clubName.trim() ? 0.5 : 1,
              fontFamily: 'inherit',
            }}
            onClick={handleCreateAccount}
            disabled={loading || !email.trim() || !password.trim() || !clubName.trim()}
          >
            {loading ? 'Creating account...' : 'Create free club account'}
          </button>

          <div style={{ minHeight: 20, color: '#E7B5FF', fontSize: 14, textAlign: 'center' }}>
            {message}
          </div>
        </div>

        <div style={{ width: '100%', padding: '16px 18px', borderRadius: 18, background: 'rgba(191,0,255,0.08)', border: '1px solid rgba(191,0,255,0.16)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#F6EEFF', marginBottom: 6 }}>
            Free early access for clubs
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.65, color: 'rgba(246,238,255,0.65)' }}>
            Clubs can join NOCTU free while members still upgrade through paid subscriptions inside the app.
          </div>
        </div>

        <div style={{ height: 1, width: '100%', background: 'rgba(191,0,255,0.15)' }} />

        <div style={{ textAlign: 'center', color: 'rgba(246,238,255,0.45)', fontSize: 13 }}>
          Already have an account?{' '}
          <Link to="/owner-signin" style={{ color: '#BF00FF', textDecoration: 'none', fontWeight: 700 }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}