import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
          borderRadius: '7px',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 15,
            height: 15,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.88)',
            left: 5,
            top: 8,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 15,
            height: 15,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.88)',
            right: 5,
            top: 8,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
