import { Link } from 'react-router-dom'
import noctuWordmark from '../assets/noctu-wordmark.png'

export default function LandingPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top, rgba(191,0,255,0.18), transparent 30%), linear-gradient(180deg, #05010a 0%, #0a0014 45%, #14001f 100%)',
        color: '#ffffff',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <header
        style={{
          padding: '24px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src={noctuWordmark}
            alt="Noctu"
            style={{ height: 34, width: 'auto', display: 'block' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Link
            to="/signin"
            style={{
              color: '#fff',
              textDecoration: 'none',
              fontSize: 14,
              padding: '10px 14px',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.03)',
            }}
          >
            Member Sign In
          </Link>

          <Link
            to="/owner-signin"
            style={{
              color: '#fff',
              textDecoration: 'none',
              fontSize: 14,
              padding: '10px 14px',
              borderRadius: 10,
              background: '#BF00FF',
              fontWeight: 700,
            }}
          >
            Club Owner
          </Link>
        </div>
      </header>

      <main
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '40px 20px 80px',
        }}
      >
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 40,
            alignItems: 'center',
            minHeight: '70vh',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 'clamp(42px, 8vw, 84px)',
                lineHeight: 0.95,
                margin: '0 0 18px',
                fontWeight: 900,
                letterSpacing: 6,
                textTransform: 'uppercase',
              }}
            >
              N<span style={{ margin: '0 0.04em', opacity: 0.95 }}>☾</span>CTU
            </h1>

            <p
              style={{
                fontSize: 'clamp(16px, 2vw, 20px)',
                lineHeight: 1.7,
                color: 'rgba(255,255,255,0.76)',
                maxWidth: 560,
                marginBottom: 28,
              }}
            >
              Noctu is more than access. It’s how the night opens.
            </p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link
                to="/signup"
                style={{
                  background: '#BF00FF',
                  color: '#fff',
                  textDecoration: 'none',
                  padding: '14px 18px',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                Join Noctu
              </Link>

              <Link
                to="/owner-signup"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  color: '#fff',
                  textDecoration: 'none',
                  padding: '14px 18px',
                  borderRadius: 12,
                  fontWeight: 600,
                  fontSize: 15,
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                List Your Club
              </Link>
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 420,
            }}
          >
            <div
              style={{
                width: 320,
                height: 320,
                borderRadius: '50%',
                background:
                  'radial-gradient(circle at 35% 35%, #f2d6ff 0%, #c45bff 18%, #7a00cc 45%, #2b003e 72%, rgba(0,0,0,0) 73%)',
                boxShadow:
                  '0 0 80px rgba(191,0,255,0.28), 0 0 160px rgba(191,0,255,0.12)',
              }}
            />

            <div
              style={{
                position: 'absolute',
                right: '10%',
                top: '18%',
                width: 92,
                height: 92,
                borderRadius: '50%',
                background: '#05010a',
                boxShadow: '-18px 0 0 6px rgba(0,0,0,0.05)',
              }}
            />

            <div
              style={{
                position: 'absolute',
                bottom: 20,
                left: 0,
                right: 0,
                margin: '0 auto',
                width: 'min(420px, 100%)',
                padding: '18px 18px',
                borderRadius: 18,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: '#d78cff',
                  textTransform: 'uppercase',
                  letterSpacing: 1.4,
                  marginBottom: 8,
                }}
              >
                Membership perks
              </div>

              <div
                style={{
                  display: 'grid',
                  gap: 10,
                  color: 'rgba(255,255,255,0.84)',
                  fontSize: 14,
                }}
              >
                <div>Earn points every time you go out.</div>
                <div>Unlock rewards and exclusive perks.</div>
                <div>Build your status across the city.</div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
