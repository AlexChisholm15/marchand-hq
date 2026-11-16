'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import type { RoleId } from '@/lib/types';
import s from './demoRoute.module.css';

type Step = { label: string; desc: string; role: RoleId; target: string };
export function DemoRoute(){
  const {state,role,setRole}=useStore();
  const router=useRouter();
  const [expanded,setExpanded]=useState(true);
  if(role!=='owner'&&role!=='coo')return null;
  const example=state.homes.find(h=>h.behindWeeks>0)||state.homes[0];
  const steps:Step[]=[
    {label:'Jeff’s decisions',desc:'What needs the owner?',role:'owner',target:'/studio?tab=decisions'},
    {label:'Scott’s blockers',desc:'What is stopping work?',role:'coo',target:'/studio?tab=issues'},
    {label:'Follow one home',desc:'Evidence and timeline',role:'coo',target:'/homes/'+example.id},
    {label:'Build a quote',desc:'Editable numbers and export',role:'owner',target:'/studio?tab=quote'},
    {label:'Closing readiness',desc:'Review the handoff',role:'coo',target:'/studio?tab=closeout'},
  ];
  const open=(index:number)=>{window.dispatchEvent(new CustomEvent<number>('marchand:start-demo',{detail:index}));};
  return <section className={s.guide} aria-label="Jeff and Scott demo route">
    <div className={s.head}>
      <div><span className={s.label}>THE 5-MINUTE DEMO · SAMPLE DATA</span><strong>Show Jeff and Scott the decisions, not the software.</strong></div>
      <button type="button" aria-expanded={expanded} onClick={()=>setExpanded(x=>!x)}>{expanded?'Hide steps':'Show steps'}</button>
    </div>
    {expanded&&<div className={s.steps}>
      {steps.map((step,i)=><button type="button" key={step.label} className={s.step} onClick={()=>open(i)}>
        <small>{i+1} · {step.role==='owner'?'Jeff':'Scott'}</small>
        <strong>{step.label}</strong><span>{step.desc}</span>
      </button>)}
    </div>}
  </section>;
}
