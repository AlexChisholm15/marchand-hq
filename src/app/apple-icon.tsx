import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#090909' }}>
        <svg width="146" height="146" viewBox="0 0 64 64">
          <path d="M8 27L32 10L56 27" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round"/>
          <path d="M13 50V30L24 44L35 30V50" fill="none" stroke="#fff" strokeWidth="4" strokeLinejoin="round" strokeLinecap="square"/>
          <path d="M42 30V50M54 30V50M42 40H54" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="square"/>
        </svg>
      </div>
    ),
    size,
  );
}
