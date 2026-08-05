import { useState } from 'react';

interface Tier {
  name: string;
  priceId: string;
  price: string;
  features: string[];
}

const tiers: Tier[] = [
  {
    name: 'Starter',
    priceId: 'price_1TlYvfBprLkwkiEd4eJzkZUU',
    price: '$9.99/mo',
    features: ['Basic member access', 'Point tracking', 'Digital membership card'],
  },
  {
    name: 'Elite',
    priceId: 'price_1TlYvYBprLkwkiEdexU2z1Rl',
    price: '$24.99/mo',
    features: ['Everything in Starter', 'Priority access', 'Exclusive rewards'],
  },
  {
    name: 'VIP',
    priceId: 'price_1TlYvcBprLkwkiEdp4vI7kEP',
    price: '$49.99/mo',
    features: ['Everything in Elite', 'VIP events', 'Personal concierge support'],
  },
];

export default function MemberTiersPage() {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  async function handleSubscribe(priceId: string, tierName: string) {
    setLoadingTier(tierName);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, userType: 'member' }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Checkout session error:', data.error);
        alert(data.error || 'Something went wrong starting checkout.');
        setLoadingTier(null);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No checkout URL returned:', data);
        setLoadingTier(null);
      }
    } catch (err) {
      console.error('Failed to start checkout:', err);
      alert('Could not start checkout. Please try again.');
      setLoadingTier(null);
    }
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Choose Your Membership</h1>
      <div style={styles.tierGrid}>
        {tiers.map((tier) => (
          <div key={tier.name} style={styles.card}>
            <h2 style={styles.tierName}>{tier.name}</h2>
            <p style={styles.price}>{tier.price}</p>
            <ul style={styles.featureList}>
              {tier.features.map((feature) => (
                <li key={feature} style={styles.feature}>
                  {feature}
                </li>
              ))}
            </ul>
            <button
              style={styles.button}
              disabled={loadingTier === tier.name}
              onClick={() => handleSubscribe(tier.priceId, tier.name)}
            >
              {loadingTier === tier.name ? 'Redirecting…' : `Subscribe to ${tier.name}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '40px 20px',
    maxWidth: '1100px',
    margin: '0 auto',
    fontFamily: 'system-ui, sans-serif',
  },
  heading: {
    textAlign: 'center',
    marginBottom: '32px',
    fontSize: '2rem',
  },
  tierGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '24px',
  },
  card: {
    border: '1px solid #333',
    borderRadius: '12px',
    padding: '24px',
    backgroundColor: '#111',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
  },
  tierName: {
    fontSize: '1.5rem',
    marginBottom: '8px',
  },
  price: {
    fontSize: '1.25rem',
    marginBottom: '16px',
    opacity: 0.8,
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    marginBottom: '24px',
    flexGrow: 1,
  },
  feature: {
    padding: '6px 0',
    borderBottom: '1px solid #222',
  },
  button: {
    padding: '12px 20px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#6c5ce7',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '1rem',
  },
};