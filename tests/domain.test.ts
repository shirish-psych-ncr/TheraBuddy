import { describe,it,expect,beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { assertNoOverlap,saveSession,seedWorkspace,validateWorkspace,type Session } from '../src/domain';
import { listWorkspaces,persistWorkspace,restoreWorkspace } from '../src/storage';

describe('Offline demo invariants',()=>{
  it('rejects overlaps on therapist, child or room, but allows an adjacent slot',()=>{
    const w=seedWorkspace('test','Test',['OT']);
    const first=w.appointments[0];
    for(const shared of ['therapist','childId','room'] as const){
      const other={...first,id:'other',childId:'other-child',therapist:'other-staff',room:'other-room',time:'09:15',[shared]:first[shared]};
      expect(()=>assertNoOverlap([first],other)).toThrow(/overlaps/);
    }
    expect(()=>assertNoOverlap([first],{...first,id:'adjacent',time:'09:45'})).not.toThrow();
  });
  it('blocks cross-workspace references and invalid dates',()=>{
    const w=seedWorkspace('test','Test',['OT']);
    expect(()=>validateWorkspace({...w,appointments:[{...w.appointments[0],childId:'foreign-child'}]})).toThrow(/missing child/);
    expect(()=>validateWorkspace({...w,appointments:[{...w.appointments[0],date:'2026-02-31'}]})).toThrow(/date/);
  });
  it('keeps missing measurements missing and requires a summary and attendance to finalize',()=>{
    const w=seedWorkspace('test','Test',['OT']);
    const a=w.appointments[0];
    const draft:Session={id:'s1',appointmentId:a.id,childId:a.childId,goal:'Demo goal',activity:'Blocks',entry:'Not recorded',successes:null,opportunities:null,support:'Not recorded',notes:'',next:'',status:'draft',updatedAt:new Date().toISOString(),finalizedAt:null,author:'Demo OT therapist',addenda:[]};
    expect(saveSession(w,draft).sessions[0].successes).toBeNull();
    expect(()=>saveSession(w,draft,true)).toThrow(/attendance/);
    expect(()=>saveSession(w,{...draft,successes:5,opportunities:3})).toThrow();
    expect(()=>saveSession(w,{...draft,successes:0,opportunities:0})).toThrow();
    const present={...w,appointments:w.appointments.map(x=>({...x,attendance:'present' as const}))};
    const finalized=saveSession(present,{...draft,notes:'Synthetic summary'},true);
    expect(finalized.sessions[0].status).toBe('finalized');
    expect(()=>saveSession(finalized,{...finalized.sessions[0],notes:'Overwrite'})).toThrow(/read-only/);
  });
  it('seeds once, persists across opens, and rejects stale concurrent writes',async()=>{
    const original=(await listWorkspaces())[0];
    const outcomes=await Promise.allSettled([
      persistWorkspace({...original,name:'First edit'},original.revision),
      persistWorkspace({...original,name:'Second edit'},original.revision)
    ]);
    expect(outcomes.filter(o=>o.status==='fulfilled')).toHaveLength(1);
    expect(outcomes.filter(o=>o.status==='rejected')).toHaveLength(1);
    const saved=(await listWorkspaces()).find(w=>w.id===original.id)!;
    expect(saved.revision).toBe(original.revision+1);
    const restored=await restoreWorkspace(original,saved.revision);
    expect(restored.name).toBe(original.name);
    expect(restored.revision).toBe(saved.revision+1);
    expect(await listWorkspaces()).toHaveLength(3);
  });
});
