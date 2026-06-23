import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function NoctuHeader() {
  return (
    <div style={{ textAlign: 'center', marginBottom: '28px' }}>
      <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#f5e9ff', fontSize: 'clamp(42px,10vw,84px)', fontWeight: 300, letterSpacing: '0.14em', lineHeight: 0.95, textTransform: 'uppercase' }}>
        <span>N</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '0.9em', height: '0.9em', borderRadius: '50%', position: 'relative', marginInline: '0.01em' }}>
          <span style={{ position: 'absolute', width: '80%', height: '80%', borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #f5dcff 0%, #d946ef 38%, #a21caf 68%, #6b21a8 100%)', boxShadow: '0 0 12px rgba(217,70,239,0.75)' }} />
          <span style={{ position: 'absolute', right: '-2%', top: '8%', width: '70%', height: '70%', borderRadius: '50%', background: '#05010a' }} />
        </span>
        <span>C</span><span>T</span><span>U</span>
      </h1>
      <div style={{ color: 'rgba(221,171,255,0.78)', fontSize: '12px', letterSpacing: '0.38em', textTransform: 'uppercase', marginTop: '14px', marginBottom: '6px' }}>Choose your level</div>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: 0 }}>Start free. Upgrade when you're ready.</p>
    </div>
  )
}

const tiers = [
  { id: 'starter', name: 'Starter', price: '$14.99', priceId: 'price_1TlYvfBprLkwkiEd4eJzkZUU', tagline: 'Get in the door', highlight: false,
    perks: ['Access to all Noctu venues','QR check-in at the door','Points on every visit','Member-only event alerts','Basic rewards catalog'],
    locked: ['Priority entry & skip-the-line','Bar scan rewards','Exclusive VIP lounge access'],
    gradient: 'linear-gradient(135deg,rgba(191,0,255,0.08),rgba(139,92,246,0.05))', border: 'rgba(191,0,255,0.2)' },
  { id: 'elite', name: 'Elite', price: '$29.99', priceId: 'price_1TlYvYBprLkwkiEdexU2z1Rl', tagline: 'Live the night right', highlight: true,
    perks: ['Everything in Starter','Priority entry — skip the line','Bar scan drink rewards','Double points on weekends','Early access to events','Exclusive member mixers'],
    locked: ['Dedicated VIP host','Table reservation priority'],
    gradient: 'linear-gradient(135deg,rgba(191,0,255,0.18),rgba(139,92,246,0.12))', border: 'rgba(191,0,255,0.55)' },
  { id: 'vip', name: 'VIP', price: '$49.99', priceId: 'price_1TlYvcBprLkwkiEdp4vI7kEP', tagline: 'Own the night', highlight: false,
    perks: ['Everything in Elite','Dedicated VIP host at venues','Table reservation priority','Complimentary bottle service access','Triple points — always','Exclusive VIP-only events','Custom Noctu member card'],
    locked: [],
    gradient: 'linear-gradient(135deg,rgba(168,85,247,0.15),rgba(109,40,217,0.1))', border: 'rgba(168,85,247,0.4)' },
]

export default function MemberTiersPage() {
  const navigate = useNavigate()
  const [loadingId, setLoadingId] = useState<string|null>(null)

  const handleSelect = async (tier: typeof tiers[0]) => {
    setLoadingId(tier.id)
    try {
      const res = await fetch('/api/create-checkout-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ priceId: tier.priceId, userType: 'member' }) })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert('Could not start checkout. Please try again.')
    } catch { alert('Network error. Please try again.') }
    finally { setLoadingId(null) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top,rgba(191,0,255,0.22) 0%,rgba(139,92,246,0.14) 16%,rgba(30,0,40,0.9) 42%,#05010a 72%,#000 100%)', padding: '32px 16px 60px' }}>
      <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto' }}>
        <a href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'rgba(221,171,255,0.6)', fontSize: '14px', textDecoration: 'none', marginBottom: '20px' }}>
          ← Back
        </a>
        <NoctuHeader />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          {tiers.map(tier => (
            <div key={tier.id} style={{ background: tier.gradient, border: `1px solid ${tier.border}`, borderRadius: '20px', padding: '22px 20px', backdropFilter: 'blur(12px)', position: 'relative', boxShadow: tier.highlight ? '0 0 32px rgba(191,0,255,0.2),0 16px 48px rgba(0,0,0,0.4)' : '0 16px 40px rgba(0,0,0,0.35)' }}>
              {tier.highlight && <div style={{ position: 'absolute', top: '14px', right: '14px', background: 'linear-gradient(135deg,#d946ef,#a21caf)', color: '#fff', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '999px' }}>Most Popular</div>}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', marginBottom: '4px' }}>
                <span style={{ color: '#f5e9ff', fontSize: '22px', fontWeight: 700, textTransform: 'uppercase' }}>{tier.name}</span>
                <span style={{ color: '#d946ef', fontSize: '20px', fontWeight: 700 }}>{tier.price}<span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', fontWeight: 400 }}>/mo</span></span>
              </div>
              <p style={{ color: 'rgba(221,171,255,0.7)', fontSize: '13px', margin: '0 0 16px', fontStyle: 'italic' }}>{tier.tagline}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {tier.perks.map((p,i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(217,70,239,0.2)', border: '1px solid rgba(217,70,239,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '10px', color: '#d946ef' }}>✓</span>
                    <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px' }}>{p}</span>
                  </li>
                ))}
                {tier.locked.map((p,i) => (
                  <li key={`l${i}`} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>🔒</span>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', textDecoration: 'line-through' }}>{p}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => handleSelect(tier)} disabled={loadingId !== null} style={{ width: '100%', background: tier.highlight ? 'linear-gradient(180deg,#d946ef,#a21caf)' : 'rgba(191,0,255,0.15)', color: '#fff', fontWeight: 700, padding: '13px', borderRadius: '12px', border: tier.highlight ? 'none' : '1px solid rgba(191,0,255,0.35)', fontSize: '14px', cursor: loadingId ? 'not-allowed' : 'pointer', opacity: loadingId ? 0.7 : 1, marginTop: '6px' }}>
                {loadingId === tier.id ? 'Loading...' : `Join ${tier.name}`}
              </button>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', padding: '24px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px' }}>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', margin: '0 0 14px' }}>Not sure yet? Explore the app for free — no card needed.</p>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'transparent', color: 'rgba(221,171,255,0.85)', fontWeight: 600, padding: '12px 28px', borderRadius: '12px', border: '1px solid rgba(191,0,255,0.28)', fontSize: '14px', cursor: 'pointer' }}>Explore Free →</button>
          <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '12px', marginTop: '12px', marginBottom: 0 }}>Some features are locked on the free plan. Upgrade anytime.</p>
        </div>
      </div>
    </div>
  )
}
