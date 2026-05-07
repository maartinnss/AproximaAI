import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
          borderRadius: '38px',
          gap: 6,
        }}
      >
        <span style={{ color: 'white', fontSize: 90, lineHeight: 1 }}>⚡</span>
        <span
          style={{
            color: 'white',
            fontSize: 30,
            fontWeight: 900,
            letterSpacing: '-0.5px',
            marginTop: 4,
          }}
        >
          FilaAI
        </span>
      </div>
    ),
    { ...size }
  );
}
