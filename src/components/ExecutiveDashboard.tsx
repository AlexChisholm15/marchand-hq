'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {ArrowRight,ArrowUpRight,Building2,CalendarDays,ChevronLeft,ChevronRight,ClipboardCheck,FilePenLine,Gauge,LayoutGrid,MapPin,ShieldCheck,TrendingUp,Wrench,AlertTriangle,Sparkles} from 'lucide-react';
import {useStore} from '@/lib/store';
import {forecast,ASSUMPTIONS} from '@/lib/finance';
import {daysBetween,fmtDate,moneyShort} from '@/lib/format';
import {STAGES} from '@/lib/seed';
import type {Home,RoleId,Task} from '@/lib/types';
import s from './ExecutiveDashboard.module.css';

type Filter='all'|'delayed'|'presold'|'spec';
type QueueView='now'|'week'|'all';
const FILTERS:{id:Filter;label:string}[]=[
 {id:'all',label:'All homes'},{id:'delayed',label:'At risk'},
 {id:'presold',label:'Sold'},{id:'spec',label:'Spec'}
];
const risk=(h:Home)=>h.behindWeeks>0?'risk':h.stage>=7?'near':'steady';
function Chart({values,floor}:{values:number[];floor:number}){
 const W=520,H=150,pad=10,bottom=H-15,top=10;
 const lo=Math.min(...values,floor)*.9,hi=Math.max(...values,floor)*1.1,span=Math.max(1,hi-lo);
 const xx=(i:number)=>pad+(W-pad*2)*i/Math.max(1,values.length-1);
 const yy=(v:number)=>bottom-(v-lo)/span*(bottom-top);
 const points=values.map((v,i)=>xx(i)+','+yy(v)).join(' ');
 const fill=pad+','+bottom+' '+points+' '+xx(values.length-1)+','+bottom;
 return <svg className={s.chart} viewBox="0 0 520 150" role="img" aria-label="Thirteen-week illustrative cash forecast">
  <defs><linearGradient id="cash-area-s2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity=".28"/><stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/></linearGradient></defs>
  {[.25,.5,.75].map(v=><line key={v} x1="0" x2={W} y1={top+(bottom-top)*v} y2={top+(bottom-top)*v} stroke="var(--line)" strokeWidth="1"/>)}
  <line x1="0" x2={W} y1={yy(floor)} y2={yy(floor)} stroke="var(--amber)" strokeDasharray="5 5" strokeWidth="2"/>
  <polygon points={fill} fill="url(#cash-area-s2)"/>
  <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  <circle cx={xx(values.length-1)} cy={yy(values[values.length-1])} r="5" stroke="var(--surface)" strokeWidth="2" fill="var(--accent)"/>
 </svg>;
}
function Bars({values}:{values:number[]}){
 const max=Math.max(1,...values);
 return <div className={s.bars} role="img" aria-label="Illustrative scheduled closings by week">
  {values.map((v,i)=><div className={s.barCol} key={i} title={'Week '+(i+1)+': '+v+' closings'}><div style={{height:(v?15+v/max*80:5)+'%'}}/></div>)}
 </div>;
}
export function ExecutiveDashboard(){
 const {state,role,setRole}=useStore();
 const router=useRouter();
 const [filter,setFilter]=useState<Filter>('all');
 const [community,setCommunity]=useState('all');
 const [queueView,setQueueView]=useState<QueueView>('now');
 const [spotIndex,setSpotIndex]=useState(0);
 const [showTour,setShowTour]=useState(false);
 const jeff=role==='owner';
 const homes=state.homes;
 const finance=useMemo(()=>forecast(state.today,state.homes,state.changes),[state]);
 const delayed=homes.filter(h=>h.behindWeeks>0);
 const sold=homes.filter(h=>h.status==='presold'),spec=homes.filter(h=>h.status==='spec');
 const closingHomes=homes.filter(h=>h.closing&&daysBetween(state.today,h.closing)>=0).sort((a,b)=>(a.closing||'').localeCompare(b.closing||''));
 const within30=closingHomes.filter(h=>daysBetween(state.today,h.closing!)<=30);
 const pending=state.changes.filter(c=>c.status==='requested'||c.status==='priced');
 const roleTasks=state.tasks.filter(t=>t.role===role&&t.status==='open').sort((a,b)=>a.due.localeCompare(b.due));
 const immediate=roleTasks.filter(t=>daysBetween(state.today,t.due)<=1);
 const week=roleTasks.filter(t=>daysBetween(state.today,t.due)<=7);
 const visibleTasks=queueView==='all'?roleTasks:queueView==='week'?week:immediate;
 const communities=[...new Set(homes.map(h=>h.community))].sort();
 const selected=homes.filter(h=>(community==='all'||community===h.community)&&
  (filter==='all'||filter==='delayed'&&h.behindWeeks>0||filter==='presold'&&h.status==='presold'||filter==='spec'&&h.status==='spec'));
 const focus=selected.slice().sort((a,b)=>b.behindWeeks-a.behindWeeks||(a.closing||'9999').localeCompare(b.closing||'9999')).slice(0,4);
 const spot=closingHomes[spotIndex%Math.max(1,closingHomes.length)]||homes[0];
 const action=roleTasks[0];
 const sample=delayed[0]||homes[0];
 const closeWeeks=finance.weeks.map(w=>finance.closings.filter(c=>daysBetween(w.start,c.date)>=0&&daysBetween(w.start,c.date)<7).length);
 const tour:{name:string;detail:string;who:RoleId;href:string}[]=[
  {name:'Owner pulse',detail:'Executive decisions',who:'owner',href:'/studio?tab=decisions'},
  {name:'Operations',detail:'Site blockers',who:'coo',href:'/studio?tab=issues'},
  {name:'One home',detail:'Project evidence',who:'coo',href:'/homes/'+sample.id},
  {name:'Live quote',detail:'Add, price, export',who:'owner',href:'/studio?tab=quote'},
  {name:'Closing',detail:'Review handoff',who:'coo',href:'/studio?tab=closeout'}
 ];
 const go=(index:number)=>{window.dispatchEvent(new CustomEvent<number>('marchand:start-demo',{detail:index}));};
 const openTask=(task:Task)=>{
  if(role!==task.role)setRole(task.role);
  history.replaceState(history.state,'','/?task='+encodeURIComponent(task.id));
  window.dispatchEvent(new CustomEvent<string>('marchand:open-task',{detail:task.id}));
  requestAnimationFrame(()=>document.getElementById('mhq-task-workflow')?.scrollIntoView({behavior:'smooth',block:'start'}));
 };
 return <div className={s.root}>
  <div className={s.topline}><span className={s.eyebrow}><i/> MARCHAND HQ <b>/</b> {jeff?'EXECUTIVE VIEW':'OPERATIONS VIEW'}</span><span className={s.demo}><ShieldCheck size={13}/> INTERACTIVE SAMPLE DATA</span></div>
  <section className={s.hero}>
   <svg className={s.blueprint} viewBox="0 0 860 440" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
     <path d="M30 385L390 55L780 385M60 405L390 100L750 405M170 382L390 190L610 382M390 55V440M80 385H810" fill="none" stroke="currentColor" opacity=".22" strokeWidth="1.5"/>
     <path d="M170 382V252L390 60L610 252V382M230 382V270L390 135L550 270V382M300 382V310L390 230L485 310V382" fill="none" stroke="currentColor" opacity=".24" strokeWidth="1.2"/>
     <path d="M0 80H860M0 150H860M0 220H860M0 290H860M0 360H860M70 0V440M140 0V440M210 0V440M280 0V440M350 0V440M420 0V440M490 0V440M560 0V440M630 0V440M700 0V440M770 0V440M840 0V440" fill="none" stroke="currentColor" strokeWidth=".5" opacity=".09"/>
   </svg>
   <div className={s.heroInner}>
    <div className={s.heroTop}><span>ONE COMPANY <b>/</b> ONE CLEAR PICTURE</span><div className={s.lens} role="group" aria-label="Switch demo perspective">
      <button type="button" aria-pressed={jeff} className={jeff?s.lensOn:''} onClick={()=>setRole('owner')}>Jeff</button>
      <button type="button" aria-pressed={!jeff} className={!jeff?s.lensOn:''} onClick={()=>setRole('coo')}>Scott</button>
    </div></div>
    <div className={s.heroMain}>
     <div className={s.heroMainLeft}><h2><strong>{homes.length}</strong><span>homes<br/>in motion<span className={s.gold}>.</span></span></h2>
       <p>{jeff?'Know what is moving, what is at risk, and what actually needs your decision.':'See the work, find the blockers and move the entire operation forward.'}</p>
       <div className={s.heroActions}><Link href="/studio?tab=decisions" className={s.primaryBtn}><Gauge size={17}/> Decision desk <ArrowUpRight size={16}/></Link>
       <button type="button" className={s.ghostBtn} onClick={()=>{setShowTour(true);go(0);}} aria-expanded={showTour}><Sparkles size={16}/>{showTour?'Hide walkthrough':'Run the 5-minute demo'}<ArrowRight size={16}/></button></div>
     </div>
     <div className={s.heroSignal}><span className={s.signalLabel}><i/> NEXT ACTION</span><h3>{action?.title||'Nothing urgent for this role'}</h3><p>{action?((action.due<=state.today?'Due now':'Due '+fmtDate(action.due))+' · '+action.source):'Explore the decision desk for upcoming work.'}</p>
       <button type="button" onClick={()=>action?openTask(action):router.push('/studio?tab=decisions')}>{action?'Work this item':'Open decision desk'} <ArrowUpRight size={15}/></button>
     </div>
    </div>
    <div className={s.heroBottom}>
     <span><i className={s.greenDot}/>{sold.length} sold <b>/</b> {spec.length} spec</span>
     <span><i className={s.amberDot}/>{delayed.length} schedule risks</span>
     <span><CalendarDays size={14}/> Next closing {closingHomes[0]?.closing?fmtDate(closingHomes[0].closing):'TBD'}</span>
    </div>
   </div>
  </section>
  {showTour&&<section className={s.tour}><div className={s.tourHeader}><strong>THE FIVE-MINUTE DEMO</strong><span>Each step switches roles and opens a working page</span></div>
    <div className={s.tourSteps}>{tour.map((step,i)=><button type="button" key={i} onClick={()=>go(i)}><span>0{i+1} / {step.who==='owner'?'JEFF':'SCOTT'}</span><strong>{step.name}</strong><small>{step.detail}</small><ArrowUpRight size={14}/></button>)}</div>
  </section>}
  <div className={s.kpis}>
   <button type="button" onClick={()=>router.push('/homes')} className={s.kpi}><span>ACTIVE PORTFOLIO <Building2 size={16}/></span><strong>{homes.length}</strong><small>{sold.length} sold · {spec.length} spec</small><ArrowUpRight size={15}/></button>
   <button type="button" onClick={()=>{setFilter('delayed');document.getElementById('mhq-health-map')?.scrollIntoView({behavior:'smooth'});}} className={s.kpi}><span>PROJECTS AT RISK <AlertTriangle size={16}/></span><strong>{delayed.length}</strong><small>Behind schedule</small><ArrowUpRight size={15}/></button>
   <button type="button" onClick={()=>router.push('/studio?tab=closeout')} className={s.kpi}><span>NEXT 30 DAYS <CalendarDays size={16}/></span><strong>{within30.length}</strong><small>Scheduled closings</small><ArrowUpRight size={15}/></button>
   <button type="button" onClick={()=>router.push('/changes')} className={s.kpi}><span>CHANGE ORDERS <FilePenLine size={16}/></span><strong>{pending.length}</strong><small>Pending decisions</small><ArrowUpRight size={15}/></button>
  </div>
  <div className={s.contentGrid}>
   <section id="mhq-health-map" className={s.panel}>
     <header className={s.panelHeader}><div><span className={s.kicker}>01 / PROJECT HEALTH</span><h3>The build map</h3><p>Every home. Every status. Click any lot.</p></div><span className={s.panelIcon}><LayoutGrid size={19}/></span></header>
     <div className={s.filters}><div className={s.pills} role="group" aria-label="Home filter">
       {FILTERS.map(f=><button key={f.id} type="button" aria-pressed={filter===f.id} className={filter===f.id?s.pillOn:''} onClick={()=>setFilter(f.id)}>{f.label}</button>)}
     </div><select aria-label="Community" value={community} onChange={e=>setCommunity(e.target.value)}><option value="all">All communities</option>{communities.map(c=><option key={c}>{c}</option>)}</select></div>
     <div className={s.mapMeta}><strong>{selected.length}</strong><span>matching projects</span><div className={s.legend}><span><i className={s.legendNormal}/> On track</span><span><i className={s.legendFinish}/> Finishing</span><span><i className={s.legendDanger}/> At risk</span></div></div>
     <div className={s.map} role="group" aria-label="Interactive home map">
      {selected.map(h=><Link key={h.id} href={'/homes/'+h.id} className={s.mapTile+' '+s[risk(h)]} aria-label={'Open Lot '+h.lot+', '+STAGES[h.stage]+(h.behindWeeks>0?', late':'')} title={'Lot '+h.lot+' · '+h.community+' · '+STAGES[h.stage]}><span>{h.lot}</span></Link>)}
      {selected.length===0&&<p>No matching homes. Choose All homes to reset.</p>}
     </div>
     <div className={s.projectRows}>{selected.slice().sort((a,b)=>b.behindWeeks-a.behindWeeks||(a.closing||'9999').localeCompare(b.closing||'9999')).slice(0,4).map(h=><Link key={h.id} href={'/homes/'+h.id}><span className={s.rowIcon}><Building2 size={17}/></span><span className={s.rowText}><strong>Lot {h.lot}</strong><small>{h.community} · {STAGES[h.stage]}</small></span><span className={h.behindWeeks>0?s.riskStatus:s.goodStatus}>{h.behindWeeks>0?h.behindWeeks+' wk late':h.closing?fmtDate(h.closing):'Spec'}</span><ChevronRight size={15}/></Link>)}</div>
     <Link className={s.panelLink} href="/homes">Open full portfolio <ArrowUpRight size={15}/></Link>
   </section>
   <section className={s.panel}>
     <header className={s.panelHeader}><div><span className={s.kicker}>02 / PRIORITIES</span><h3>{jeff?'Jeff’s decision desk':'Scott’s operations radar'}</h3><p>{jeff?'Only what needs your attention.':'The work that is waiting on you.'}</p></div><span className={s.panelIcon}><ClipboardCheck size={19}/></span></header>
     <div className={s.decisionStats}><div><strong>{roleTasks.length}</strong><small>Open</small></div><div><strong>{immediate.length}</strong><small>Urgent</small></div><div><strong>{week.length}</strong><small>Next 7 days</small></div></div>
     <div className={s.taskTabs} role="group" aria-label="Time window">{([['now','Now'],['week','7 days'],['all','All']] as const).map(([id,label])=><button key={id} type="button" aria-pressed={queueView===id} className={queueView===id?s.taskTabOn:''} onClick={()=>setQueueView(id)}>{label}</button>)}</div>
     <div className={s.tasks}>{visibleTasks.slice(0,5).map((task,i)=><button type="button" key={task.id} onClick={()=>openTask(task)}>
        <span className={s.taskNum}>0{i+1}</span><span className={s.taskMain}><strong>{task.title}</strong><small>{task.source} · {task.homeId?'Lot '+(homes.find(h=>h.id===task.homeId)?.lot||'—'):'Company'}</small></span><span className={task.due<=state.today?s.dueHot:s.dueSoft}>{task.due<state.today?'Overdue':task.due===state.today?'Today':fmtDate(task.due)}</span><ArrowUpRight size={15}/>
       </button>)}
       {!visibleTasks.length&&<div className={s.empty}><ShieldCheck size={24}/><strong>Clear for now.</strong><small>Try All to see upcoming work.</small></div>}
     </div>
     <Link className={s.panelLink} href="/studio?tab=decisions">Open decision room <ArrowUpRight size={15}/></Link>
   </section>
  </div>
  <div className={s.contentGrid}>
   <section className={s.panel}>
     <header className={s.panelHeader}><div><span className={s.kicker}>03 / {jeff?'CASH OUTLOOK':'DELIVERY OUTLOOK'}</span><h3>{jeff?'The 90-day horizon':'Closings on the horizon'}</h3><p>{jeff?'Follow the cash curve and the reserve floor.':'The next 13 weeks of scheduled handoffs.'}</p></div><span className={s.panelIcon}><TrendingUp size={19}/></span></header>
     <div className={s.chartLead}><div><span>{jeff?'LOWEST PROJECTED CASH':'SCHEDULED CLOSINGS'}</span><strong>{jeff?moneyShort(finance.lowest.cash):finance.closings.length}</strong><small>{jeff?(finance.breach?'Below illustrative reserve floor':'Above illustrative reserve floor'):'Next 90 days · sample timeline'}</small></div><span className={finance.breach&&jeff?s.warning:s.reassuring}>{finance.breach&&jeff?'Risk flagged':jeff?'Reserve intact':'In view'}</span></div>
     {jeff?<Chart values={finance.weeks.map(w=>w.cash)} floor={ASSUMPTIONS.reserveFloor}/>:<Bars values={closeWeeks}/>}
     <div className={s.axis}><span>Today</span><span>30d</span><span>60d</span><span>90d</span></div><div className={s.chartCaption}><i/> {jeff?'Projected cash · dashed reserve line':'Weekly closing volume'} <small>Illustrative figures only</small></div>
     <Link className={s.panelLink} href={jeff?'/money':'/studio?tab=closeout'}>{jeff?'Open cash flow simulator':'Open closing desk'} <ArrowUpRight size={15}/></Link>
   </section>
   <section className={s.panel}>
     <header className={s.panelHeader}><div><span className={s.kicker}>04 / PROJECT SPOTLIGHT</span><h3>Behind every number</h3><p>From overview to the real work.</p></div><div className={s.spotArrows}><button aria-label="Previous home" type="button" onClick={()=>setSpotIndex(i=>(i+closingHomes.length-1)%Math.max(1,closingHomes.length))}><ChevronLeft size={18}/></button><button aria-label="Next home" type="button" onClick={()=>setSpotIndex(i=>(i+1)%Math.max(1,closingHomes.length))}><ChevronRight size={18}/></button></div></header>
     <div className={s.spot}><div><span>LOT {spot.lot}</span><span>{spot.behindWeeks>0?'SCHEDULE RISK':'ACTIVE PROJECT'}</span></div><strong>{spot.plan}</strong><small><MapPin size={14}/>{spot.community}</small><svg viewBox="0 0 400 110" aria-hidden="true"><path d="M28 100L200 12L372 100M80 100L200 39L318 100M128 100L200 65L271 100M200 12V100M28 100H372" stroke="currentColor" fill="none" strokeWidth="1.2"/></svg></div>
     <div className={s.progressLabel}><span>CONSTRUCTION PROGRESS</span><strong>{STAGES[spot.stage]}</strong></div>
     <div className={s.progress}><i style={{width:((spot.stage+1)/STAGES.length*100)+'%'}}/></div>
     <div className={s.spotDate}><span><CalendarDays size={14}/>{spot.closing?fmtDate(spot.closing):'Not scheduled'}</span><span>{spot.behindWeeks>0?spot.behindWeeks+' weeks behind':'On schedule in demo'}</span></div>
     <Link href={'/homes/'+spot.id} className={s.panelLink}>Open this project <ArrowUpRight size={15}/></Link>
   </section>
  </div>
  <section className={s.launch}>
   <div className={s.launchHead}><div><span>TOOLS THAT DO THINGS</span><h3>Less dashboard. More action.</h3></div><small>WORKING DEMO TOOLS</small></div>
   <div className={s.launchCards}>
    <Link href="/studio?tab=quote"><span><FilePenLine size={23}/></span><strong>Quote Studio</strong><small>Price, calculate, export</small><ArrowUpRight size={16}/></Link>
    <Link href="/studio?tab=issues"><span><Wrench size={23}/></span><strong>Site control</strong><small>Track and clear blockers</small><ArrowUpRight size={16}/></Link>
    <Link href="/studio?tab=closeout"><span><ClipboardCheck size={23}/></span><strong>Closing desk</strong><small>Review handoff readiness</small><ArrowUpRight size={16}/></Link>
    <Link href="/studio?tab=decisions"><span><Gauge size={23}/></span><strong>Decision room</strong><small>Move work forward</small><ArrowUpRight size={16}/></Link>
   </div>
  </section>
  <p className={s.disclaimer}>SAMPLE RECORDS · DEMO ONLY · No real Marchand Homes files, financials or private messages are connected to this experience.</p>
 </div>;
}
