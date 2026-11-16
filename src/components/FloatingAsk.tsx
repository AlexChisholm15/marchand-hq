'use client';

import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { AskContent } from './Intelligence';
import s from './shell.module.css';

export function FloatingAsk() {
  const [open, setOpen] = useState(false);
  return <>
    <button
      type="button"
      className={s.askFab}
      aria-label={open ? 'Close Ask Marchand' : 'Open Ask Marchand'}
      aria-expanded={open}
      aria-controls="marchand-ask-panel"
      onClick={() => setOpen(value => !value)}
      title="Ask Marchand"
    >
      {open ? <X size={23} aria-hidden /> : <MessageCircle size={24} aria-hidden />}
    </button>
    {open && <div className={s.askOverlay} onMouseDown={event => {if (event.target === event.currentTarget) setOpen(false);}}>
      <section className={s.askPanel} id="marchand-ask-panel" role="dialog" aria-modal="true" aria-label="Ask Marchand">
        <header className={s.askHeader}>
          <span>Ask Marchand <small>· Demo assistant</small></span>
          <button type="button" aria-label="Close Ask Marchand" onClick={() => setOpen(false)}><X size={20} aria-hidden /></button>
        </header>
        <div className={s.askBody}><AskContent /></div>
      </section>
    </div>}
  </>;
}
