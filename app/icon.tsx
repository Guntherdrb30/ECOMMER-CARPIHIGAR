import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';

// Simple generated icon to avoid /favicon.ico 404s
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
          background: '#FF4D00', // brand default
          color: '#fff',
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: -0.5,
        }}
      >
        C
      </div>
    ),
    {
      ...size,
    }
  );
}

