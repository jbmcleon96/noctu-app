import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function NoctuHeader() {
  return (
    <div style={{ textAlign: 'center', marginBottom: '28px' }}>
      <h1
        style={{
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          color: '#f5e9ff',
          fontSize: 'clamp(42px,10vw,84px)',
          fontWeight: 300,
          letterSpacing: '0.14em',
          lineHeight: 0.95,
          textTransform: 'uppercase',
        }}
      >
        <span>N</span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '0.9em',
            height: '0.9em',
            borderRadius: '50%',
            position: 'relative',
            marginInline: '0.01em',
          }}
        >
          <span
            style={{
              position: 'absolute',
              width: '80%',
              height: '80%',
              borderRadius: '50%',
              background:
                'radial-gradient(circle at 35% 35%, #f5dcff 0%, #d946ef 38%, #a21caf 68%, #6b21a8 100%)',
              boxShadow: '0 0 12px rgba(217,70,239,0.75)',
            }}
          />
          <span
            style={{
              position: 'absolute',
              right: '-2%',
              top: '8%',
              width: '70%',
              height: '70%',
              borderRadius: '50%',
              background: '#05010a',
            }}
          />
        </span>
        <span>C</span>
        <span>T</span>
        <span>U</span>
      </h1>

      <div
        style={{
          color: 'rgba(221,171,255,0.78)',
          fontSize: '12px',
          letterSpacing: '0.38em',
          textTransform: 'uppercase',
          marginTop: '14px',
          marginBottom: '6px',
        }}
      >
        Choose your level
      </div>

      <p
        style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: '14px',
          margin: 0,
        }}
      >
        Start free. Upgrade when you're ready.
      </p>
    </div>
  )
}

const tiers = [
  {
    id: 'starter',
    name: 'NOCTU Starter',
    price: '$9.99',
    description:
      'Monthly starter membership for NOCTU with entry-level club perks and member access.',
    priceId: 'price_1TlYvfBprLkwkiEd4eJzkZUU',
  },
  {
    id: 'elite',
    name: 'NOCTU Elite',
    price: '$19.99',
    description: 'Enhanced NOCTU membership with more perks and upgraded access.',
    priceId: 'price_1TlYvYBprLkwkiEdexU2z1Rl',
  },
  {
    id: 'vip',
    name: 'NOCTU VIP',
    price: '$29.99',
    description: 'Premium NOCTU membership with top-tier benefits and priority access.',
    priceId: 'price_1TlYvcBprLkwkiEdp4vI7kEP',
  },
]

export default function MemberTiersPage() {
  const navigate = useNavigate()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleSelect = async (tier: (typeof tiers)[number]) => {
    setLoadingId(tier.id)

    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: tier.priceId,
          userType: 'member',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to create checkout session')
      }

      if (!data?.url) {
        throw new Error('Missing checkout URL')
      }

      window.location.href = data.url
    } catch (err) {
      console.error(err)
      alert('Checkout failed. Please try again.')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top, rgba(168,85,247,0.16), transparent 32%), #05010a',
        color: '#fff',
        padding: '32px 20px 48px',
      }}
    >
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <NoctuHeader />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px',
            marginTop: '32px',
          }}
        >
          {tiers.map((tier) => (
            <div
              key={tier.id}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '24px',
                padding: '24px',
                boxShadow: '0 18px 60px rgba(0,0,0,0.28)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <h2
                style={{
                  margin: '0 0 12px',
                  fontSize: '24px',
                  color: '#f5e9ff',
                }}
              >
                {tier.name}
              </h2>

              <p
                style={{
                  margin: '0 0 10px',
                  fontSize: '30px',
                  fontWeight: 700,
                  color: '#ffffff',
                }}
              >
                {tier.price}
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 400,
                    color: 'rgba(255,255,255,0.6)',
                    marginLeft: '6px',
                  }}
                >
                  /month
                </span>
              </p>

              <p
                style={{
                  margin: '0 0 24px',
                  color: 'rgba(255,255,255,0.72)',
                  lineHeight: 1.6,
                  fontSize: '14px',
                }}
              >
                {tier.description}
              </p>

              <button
                onClick={() => handleSelect(tier)}
                disabled={loadingId === tier.id}
                style={{
                  width: '100%',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '14px 18px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: loadingId === tier.id ? 'not-allowed' : 'pointer',
                  background:
                    loadingId === tier.id
                      ? 'rgba(255,255,255,0.18)'
                      : 'linear-gradient(135deg, #d946ef 0%, #9333ea 100%)',
                  color: '#fff',
                  opacity: loadingId === tier.id ? 0.7 : 1,
                }}
              >
                {loadingId === tier.id ? 'Loading...' : `Subscribe to ${tier.name}`}
              </button>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '28px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.74)',
              borderRadius: '999px',
              padding: '12px 18px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  )
}