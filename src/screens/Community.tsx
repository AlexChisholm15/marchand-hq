'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Hash, MessageSquare, Pin, Reply, Search, Send, X } from 'lucide-react';
import { Page } from '@/components/Shell';
import { useStore } from '@/lib/store';
import { roleById } from '@/lib/people';
import s from './community.module.css';

const CHANNELS = [
  { id: 'general', label: 'general', description: 'The whole team. One conversation.', caption: 'Company-wide conversation' },
  { id: 'site-updates', label: 'site-updates', description: 'Progress, blockers and the next step on site.', caption: 'From the field' },
  { id: 'design', label: 'design', description: 'Selections, details and design handoffs.', caption: 'Bring the details together' },
  { id: 'handoffs', label: 'handoffs', description: 'Keep every closing and handoff moving.', caption: 'Finish well, together' },
] as const;
type Channel = typeof CHANNELS[number]['id'];
type Message = { id: string; channel: Channel; author: string; title: string; text: string; time: string; reply?: string; sample?: boolean };
const KEY = 'marchand-hq-community-demo-v1';
const SAMPLES: Message[] = [
  { id: 'welcome', channel: 'general', author: 'Jeff Marchand', title: 'Owner', time: '8:30 AM', sample: true, text: 'Welcome to the team home. A place for the whole Marchand team to stay connected, share a win, or get a quick answer.' },
  { id: 'general-2', channel: 'general', author: 'Scott Sim', title: 'COO', time: '8:42 AM', sample: true, text: 'Let’s keep the daily updates simple: what moved forward, what needs attention, and who can help. Site details can go in #site-updates.' },
  { id: 'general-3', channel: 'general', author: 'Jorelle Miller', title: 'Home Design Specialist', time: '9:05 AM', sample: true, text: 'Love having one place to connect. I’ll use #design for selection questions and handoffs so the details are easy to find.' },
  { id: 'general-4', channel: 'general', author: 'Gerry England', title: 'Project Manager', time: '9:12 AM', sample: true, text: 'A quick update with the lot, the next step and the person needed should make it much easier to keep everyone in the loop.' },
  { id: 'site-1', channel: 'site-updates', author: 'Gerry England', title: 'Project Manager', time: '8:50 AM', sample: true, text: 'Sample site update · Lot 712: rough-ins are the current stage. Keep progress notes here; record a blocker in Site control so it has an owner.' },
  { id: 'site-2', channel: 'site-updates', author: 'Scott Sim', title: 'COO', time: '9:10 AM', sample: true, text: 'When posting a blocker, include the lot, what’s needed and the next step. That gives the team something clear to work with.' },
  { id: 'design-1', channel: 'design', author: 'Jorelle Miller', title: 'Home Design Specialist', time: '9:05 AM', sample: true, text: 'Use this channel for design questions and selection handoffs. Keep the approved choice in the home record so the team can always find the latest decision.' },
  { id: 'design-2', channel: 'design', author: 'Sandy Brewster', title: 'Business Manager', time: '9:18 AM', sample: true, text: 'A lot number and a link to the home record will help the office match each question to the right project.' },
  { id: 'handoff-1', channel: 'handoffs', author: 'Sandy Brewster', title: 'Business Manager', time: '8:55 AM', sample: true, text: 'Use this space for walkthrough and handoff coordination. The Closing desk holds the sample readiness checklist; chat is for the conversation around it.' },
];
const initials = (name: string) => name.split(' ').map(part => part[0]).slice(0, 2).join('');

function isMessage(value: unknown): value is Message {
  if (!value || typeof value !== 'object') return false;
  const m = value as Message;
  return typeof m.id === 'string' && CHANNELS.some(c => c.id === m.channel) && typeof m.author === 'string' && typeof m.title === 'string' && typeof m.text === 'string' && m.text.length <= 2000 && typeof m.time === 'string' && (m.reply === undefined || typeof m.reply === 'string');
}

export function Community() {
  const { role } = useStore();
  const person = roleById(role);
  const [channel, setChannel] = useState<Channel>('general');
  const [messages, setMessages] = useState<Message[]>([]);
  const [drafts, setDrafts] = useState<Partial<Record<Channel, string>>>({});
  const [reply, setReply] = useState<Message | null>(null);
  const [query, setQuery] = useState('');
  const [pinned, setPinned] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const composer = useRef<HTMLTextAreaElement>(null);
  const feed = useRef<HTMLDivElement>(null);
  const active = CHANNELS.find(c => c.id === channel)!;
  const draft = drafts[channel] ?? '';
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
      if (Array.isArray(saved)) setMessages(saved.filter(isMessage).slice(-200));
    } catch { setError('Saved demo messages could not be loaded. You can still try the chat.'); }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(KEY, JSON.stringify(messages)); }
    catch { setError('Browser storage is unavailable. New demo messages will last until you leave this page.'); }
  }, [messages, loaded]);
  useEffect(() => {
    feed.current?.scrollTo({ top: feed.current.scrollHeight });
  }, [messages, channel]);
  const visible = [...SAMPLES, ...messages].filter(m => m.channel === channel && (!pinned || m.id === 'welcome') && `${m.author} ${m.text}`.toLowerCase().includes(query.toLowerCase().trim()));
  const switchChannel = (id: Channel) => { setChannel(id); setReply(null); setPinned(false); setQuery(''); };
  const send = (e?: FormEvent) => {
    e?.preventDefault();
    if (!draft.trim() || !loaded) return;
    const message: Message = { id: crypto.randomUUID(), channel, author: person.person, title: person.title, text: draft.trim(), time: new Date().toISOString(), ...(reply ? { reply: `${reply.author}: ${reply.text}` } : {}) };
    setMessages(previous => [...previous, message].slice(-200));
    setDrafts(previous => ({ ...previous, [channel]: '' }));
    setReply(null);
    setPinned(false);
    setQuery('');
    setAnnouncement('Demo message added. Saved in this browser only.');
    composer.current?.focus();
  };
  return <Page title="Team home" sub="One team. One place to connect.">
    <section className={s.welcome} aria-label="Welcome to the team home">
      <div><span className={s.eyebrow}>THE MARCHAND COMMONS</span><h2>Good homes start<br />with a connected team<span>.</span></h2><p>The conversations, people and next steps that bring us together.</p></div>
      <Link href="/" className={s.dashboard}>Your Today dashboard <ArrowUpRight size={16} aria-hidden /></Link>
    </section>
    <div className={s.demoNote}><span className={s.demoPill}>WORKING DEMO</span><p>Sample conversations · Messages stay in this browser and are not sent to the team.</p></div>
    <div className={s.workspace}>
      <aside className={s.channels} aria-label="Team channels">
        <div className={s.spaceTitle}><span className={s.spaceIcon}><MessageSquare size={18} aria-hidden /></span><div><strong>Team space</strong><small>Everyone has a place here</small></div></div>
        <h3>CHANNELS</h3>
        <div className={s.channelList}>{CHANNELS.map(c => <button key={c.id} type="button" aria-pressed={channel === c.id} onClick={() => switchChannel(c.id)}><Hash size={17} aria-hidden /><span>{c.label}</span>{c.id === 'general' && <span className={s.channelTag}>TEAM</span>}</button>)}</div>
        <div className={s.channelFoot}><span className={s.eyebrow}>A LITTLE LESS SILOED</span><p>Share the update.<br />Ask the question.<br />Celebrate the good work.</p></div>
        <div className={s.identity}><span className={s.avatar}>{initials(person.person)}</span><div><strong>{person.person}</strong><small>Demo perspective · {person.label}</small></div></div>
      </aside>
      <section className={s.chat} aria-label={`${active.label} chat`}>
        <header className={s.chatHeader}><div className={s.channelHeading}><Hash size={23} aria-hidden /><div><h2>{active.label}</h2><p>{active.description}</p></div></div><button className={s.pinButton} type="button" aria-label="Show pinned welcome" aria-pressed={pinned} onClick={() => { setChannel('general'); setReply(null); setPinned(!pinned); setQuery(''); }}><Pin size={16} aria-hidden /></button></header>
        <label className={s.search}><Search size={15} aria-hidden /><input aria-label="Search this channel" placeholder="Search this conversation" value={query} onChange={e => setQuery(e.target.value)} />{query && <button type="button" aria-label="Clear message search" onClick={() => setQuery('')}><X size={14} /></button>}</label>
        <div className={s.feed} ref={feed} role="region" aria-label="Channel messages" tabIndex={0}>
          <div className={s.channelIntro}><span><Hash size={24} aria-hidden /></span><h3>Welcome to #{active.label}</h3><p>{active.caption}</p></div>
          <div className={s.dayDivider}><span>Sample conversation</span></div>
          {visible.length === 0 && <div className={s.empty}>No messages match. Try another name or phrase.</div>}
          {visible.map(m => <article className={s.message} key={m.id} aria-label={`Message from ${m.author}`}>
            <span className={`${s.avatar} ${m.author === 'Scott Sim' ? s.blueAvatar : ''}`} aria-hidden>{initials(m.author)}</span>
            <div className={s.messageBody}>{m.id === 'welcome' && <span className={s.pinnedLabel}><Pin size={10} aria-hidden /> PINNED WELCOME</span>}<div className={s.messageMeta}><strong>{m.author}</strong><span className={s.role}>{m.title}</span><time dateTime={m.sample ? undefined : m.time}>{m.sample ? m.time : new Date(m.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time></div>
              {m.reply && <blockquote>{m.reply}</blockquote>}<p>{m.text}</p><button className={s.replyButton} type="button" aria-label={`Reply to ${m.author}`} onClick={() => { setReply(m); composer.current?.focus(); }}><Reply size={13} aria-hidden /> Reply</button>
            </div>
          </article>)}
        </div>
        <form className={s.composer} onSubmit={send}>
          {reply && <div className={s.replyPreview}><span>Replying to <strong>{reply.author}</strong></span><button type="button" aria-label="Cancel reply" onClick={() => setReply(null)}><X size={14} /></button></div>}
          <label className="sr-only" htmlFor="community-message">Message #{active.label}</label><textarea id="community-message" ref={composer} value={draft} onChange={e => setDrafts(previous => ({ ...previous, [channel]: e.target.value }))} placeholder={`Message #${active.label}`} maxLength={2000} rows={2} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }} />
          <div className={s.composerFooter}><span>Enter to send · Shift + Enter for a new line</span><button type="submit" disabled={!draft.trim() || !loaded} aria-label="Send demo message"><Send size={15} aria-hidden /><span>Send</span></button></div>
          {error && <p role="alert" className={s.error}>{error}</p>}
        </form>
        <span className="sr-only" role="status">{announcement}</span>
      </section>
      <aside className={s.board} aria-label="Team board">
        <span className={s.eyebrow}>TEAM BOARD</span>
        <section className={s.boardCard}><span className={s.cardIcon}><Pin size={17} aria-hidden /></span><span className={s.cardLabel}>START HERE</span><h3>One place for<br />the whole team.</h3><p>Updates in the open. Questions in the right channel. Decisions in the home record.</p><button type="button" onClick={() => { switchChannel('general'); setPinned(true); }}>Read the welcome <ArrowUpRight size={14} aria-hidden /></button></section>
        <section className={s.shortcuts}><h3>THE WORK, WITHIN REACH</h3><Link href="/homes"><span>Homes in motion<small>Open the project portfolio</small></span><ArrowUpRight size={16} aria-hidden /></Link><Link href="/studio?tab=issues"><span>Site control<small>Give every blocker an owner</small></span><ArrowUpRight size={16} aria-hidden /></Link><Link href="/studio?tab=closeout"><span>Closing desk<small>Get ready for handoff</small></span><ArrowUpRight size={16} aria-hidden /></Link></section>
        <div className={s.teamNote}><span className={s.eyebrow}>BUILT AROUND PEOPLE</span><p>From the office to the job site.<br />Same team. Shared home.</p><span>Sample content · Not a live staff directory</span></div>
      </aside>
    </div>
  </Page>;
}
