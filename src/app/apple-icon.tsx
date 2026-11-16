import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#17181a' }}>
        <svg width="132" height="132" viewBox="0 0 64 64">
          <path d="M14 46V22l9 12 9-12v24" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M38 22v24M50 22v24M38 34h12" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
        </svg>
      </div>
    ),
    size,
  );
}
