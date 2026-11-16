'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { safeReturnPath } from '@/lib/labAuth';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [next, setNext] = useState('/');
  useEffect(() => setNext(safeReturnPath(new URLSearchParams(window.location.search).get('next'))), []);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!password || busy) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, next }), cache: 'no-store' });
      const result = await response.json();
      if (response.ok && result.ok) { window.location.assign(result.next || '/'); return; }
      setError(result.error || 'Unable to unlock lab');
    } catch { setError('Connection failed. Try again.'); }
    finally { setBusy(false); setPassword(''); }
  }
  return <main style={{minHeight:'100dvh',display:'grid',placeItems:'center',background:'#0d1018',color:'#f1f4fb',padding:24}}>
    <form onSubmit={submit} style={{width:'min(390px,100%)',padding:28,border:'1px solid #303744',borderRadius:18,background:'#171c25',boxShadow:'0 20px 60px #0006'}}>
      <div style={{fontSize:11,letterSpacing:2,color:'#78b4ff',fontWeight:750,marginBottom:14}}>MARCHAND HQ / PRIVATE LAB</div>
      <h1 style={{fontSize:28,margin:'0 0 8px',letterSpacing:'-.04em'}}>Welcome back.</h1>
      <p style={{fontSize:13,color:'#aab5c7',margin:'0 0 24px'}}>Enter the lab password to continue to the working demo.</p>
      <label htmlFor="lab-password" style={{display:'block',fontSize:12,marginBottom:8}}>Password</label>
      <input id="lab-password" type="password" autoComplete="current-password" required autoFocus value={password} onChange={e=>setPassword(e.target.value)} style={{display:'block',width:'100%',border:'1px solid #515c6c',borderRadius:10,background:'#0d1119',padding:13,minHeight:46,outlineOffset:3}} />
      {error && <p role="alert" style={{fontSize:12,color:'#ff9c92'}}>{error}</p>}
      <button disabled={busy||!password} type="submit" style={{marginTop:17,width:'100%',background:'#176bf2',color:'#fff',border:0,borderRadius:10,minHeight:46,fontWeight:750}}>{busy?'Checking…':'Unlock Marchand HQ'}</button>
      <p style={{fontSize:11,color:'#7e8c9e',margin:'20px 0 0'}}>Authorized demo access only · Sample projects and data</p>
    </form>
  </main>;
}
