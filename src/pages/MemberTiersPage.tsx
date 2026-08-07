import { useState } from 'react';
import NoctuHeader from '../components/NoctuHeader';
import '../styles/noctu-theme.css';

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
    <div className="noctu-page">
      <div className="noctu-shell">
        <NoctuHeader
          eyebrow="Choose your level"
          subtitle="Start free. Upgrade when you're ready."
          size="md"
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
          }}
        >
          {tiers.map((tier) => (
            <div key={tier.name} className="noctu-card">
              <h2 className="noctu-heading" style={{ fontSize: '22px' }}>
                {tier.name}
              </h2>
              <p className="noctu-badge" style={{ marginBottom: '14px' }}>
                {tier.price}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '18px' }}>
                {tier.features.map((feature) => (
                  <li key={feature} className="noctu-subtext" style={{ marginBottom: '6px' }}>
                    • {feature}
                  </li>
                ))}
              </ul>
              <button
                className="noctu-primary-btn"
                disabled={loadingTier === tier.name}
                onClick={() => handleSubscribe(tier.priceId, tier.name)}
              >
                {loadingTier === tier.name ? 'Redirecting…' : `Subscribe to ${tier.name}`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
