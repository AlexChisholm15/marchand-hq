export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="MH roof logo">
      <rect width="64" height="64" rx="14" fill="#090909" />
      <path d="M8 27L32 10L56 27" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M13 50V30L24 44L35 30V50" fill="none" stroke="#fff" strokeWidth="4" strokeLinejoin="round" strokeLinecap="square" />
      <path d="M42 30V50M54 30V50M42 40H54" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="square" />
    </svg>
  );
}
