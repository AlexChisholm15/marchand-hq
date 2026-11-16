export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Marchand Homes">
      <rect width="64" height="64" rx="14" fill="currentColor" />
      <path d="M14 46V22l9 12 9-12v24" fill="none" stroke="var(--bg)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M38 22v24M50 22v24M38 34h12" fill="none" stroke="var(--bg)" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}
