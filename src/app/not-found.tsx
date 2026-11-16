import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ padding: '96px 16px', textAlign: 'center' }}>
      <h1>Page not found</h1>
      <p style={{ color: 'var(--text-2)', marginTop: 8 }}>That screen does not exist in this demo.</p>
      <p style={{ marginTop: 24 }}>
        <Link href="/" style={{ color: 'var(--accent-text)', fontWeight: 500 }}>Go to Today</Link>
      </p>
    </div>
  );
}
