import { CSSProperties } from 'react';

interface NoctuHeaderProps {
  eyebrow?: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap: Record<string, string> = {
  sm: 'clamp(120px, 30vw, 180px)',
  md: 'clamp(160px, 40vw, 260px)',
  lg: 'clamp(220px, 55vw, 380px)',
};

export default function NoctuHeader({
  eyebrow,
  subtitle,
  size = 'md',
}: NoctuHeaderProps) {
  const wrapStyle: CSSProperties = {
    textAlign: 'center',
    marginBottom: '28px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  };

  return (
    <div style={wrapStyle}>
      <img
        src="/assets/noctu-logo-transparent.png"
        alt="NOCTU"
        style={{
          width: sizeMap[size],
          maxWidth: '100%',
          height: 'auto',
          filter: 'drop-shadow(0 0 24px rgba(191,0,255,0.35))',
        }}
      />

      {eyebrow && (
        <div
          style={{
            color: '#DFA4FF',
            fontSize: '12px',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            marginTop: '2px',
          }}
        >
          {eyebrow}
        </div>
      )}

      {subtitle && (
        <p
          style={{
            color: 'rgba(246,238,255,0.68)',
            fontSize: '14px',
            margin: 0,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
