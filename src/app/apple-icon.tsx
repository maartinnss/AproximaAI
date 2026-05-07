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
          gap: 14,
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', position: 'relative', width: 110, height: 70 }}>
          <div
            style={{
              position: 'absolute',
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.85)',
              left: 0,
              top: 0,
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.85)',
              right: 0,
              top: 0,
            }}
          />
        </div>
        <span
          style={{
            color: 'white',
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: '-0.5px',
          }}
        >
          AproximaAI
        </span>
      </div>
    ),
    { ...size }
  );
}
