import { z } from 'zod';

export const discipline = z.enum(['OT', 'SLT']);
const text = z.string().trim().min(1).max(160);
export const childSchema = z.object({ id: text, name: text, age: z.number().int().min(0).max(18), service: discipline, goal: text, interests: z.string().max(240) });
export const appointmentSchema = z.object({
  id: text, childId: text, date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  minutes: z.number().int().min(15).max(120), therapist: text, room: text,
  attendance: z.enum(['expected', 'present', 'absent']), status: z.enum(['scheduled', 'in-progress', 'completed', 'cancelled'])
});
export const sessionSchema = z.object({
  id: text, appointmentId: text, childId: text, goal: text, activity: text, entry: text,
  successes: z.number().int().min(0).max(1000).nullable(), opportunities: z.number().int().min(1).max(1000).nullable(),
  support: z.enum(['Independent', 'Visual cues', 'Verbal cues', 'Physical assistance', 'Not recorded']),
  notes: z.string().max(4000), next: z.string().max(1000), status: z.enum(['draft', 'finalized']),
  updatedAt: text, finalizedAt: z.string().nullable(), author: text,
  addenda: z.array(z.object({ id: text, text: z.string().trim().min(1).max(2000), at: text })).max(100)
}).refine(s => (s.successes === null && s.opportunities === null) || (s.successes !== null && s.opportunities !== null && s.successes <= s.opportunities), 'Enter both measurements; successes cannot exceed opportunities.');
export const workspaceSchema = z.object({
  schemaVersion: z.literal(1), id: text, name: text, services: z.array(discipline).min(1), revision: z.number().int().min(0),
  children: z.array(childSchema).max(500), appointments: z.array(appointmentSchema).max(2000), sessions: z.array(sessionSchema).max(2000),
  equipment: z.array(z.object({ id: text, name: text, available: z.boolean() })).max(100),
  staff: z.array(z.object({ id: text, name: text, service: discipline, present: z.boolean() })).min(1).max(50)
});
export type Child = z.infer<typeof childSchema>;
export type Appointment = z.infer<typeof appointmentSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
export const uid = () => crypto.randomUUID();
export const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const minuteOfDay = (time: string) => Number(time.slice(0,2))*60 + Number(time.slice(3));

export function validateWorkspace(input: unknown): Workspace {
  const w = workspaceSchema.parse(input);
  for (const collection of [w.children,w.appointments,w.sessions,w.equipment,w.staff]) {
    if (new Set(collection.map(x=>x.id)).size !== collection.length) throw new Error('Duplicate record IDs are not permitted.');
  }
  for (const child of w.children) if (!w.services.includes(child.service)) throw new Error('Child service is not enabled.');
  for (const a of w.appointments) {
    if (!w.children.some(c=>c.id===a.childId)) throw new Error('Appointment references a missing child.');
    if (!w.staff.some(s=>s.name===a.therapist)) throw new Error('Appointment references missing staff.');
    if (minuteOfDay(a.time)+a.minutes > 1440) throw new Error('Appointments must finish on the same day.');
    if (localDate(new Date(a.date+'T12:00:00')) !== a.date) throw new Error('Invalid appointment date.');
    assertNoOverlap(w.appointments.filter(other=>other.id!==a.id),a);
  }
  const sessionAppointments = new Set<string>();
  for (const s of w.sessions) {
    const a=w.appointments.find(a=>a.id===s.appointmentId);
    if (!a || a.childId!==s.childId) throw new Error('Session references a different or missing appointment.');
    if (sessionAppointments.has(a.id)) throw new Error('Only one session per appointment is supported.');
    sessionAppointments.add(a.id);
    if (s.status==='finalized' && (!s.finalizedAt || !s.notes.trim() || a.status!=='completed')) throw new Error('Finalized session is incomplete.');
  }
  return w;
}

export function assertNoOverlap(existing: Appointment[], proposed: Appointment) {
  if (proposed.status==='cancelled') return;
  const start=minuteOfDay(proposed.time), end=start+proposed.minutes;
  const collision = existing.find(a=>a.id!==proposed.id && a.status!=='cancelled' && a.date===proposed.date &&
    (a.childId===proposed.childId || a.therapist===proposed.therapist || a.room===proposed.room) &&
    start<minuteOfDay(a.time)+a.minutes && end>minuteOfDay(a.time));
  if (collision) throw new Error('This time overlaps another appointment for the child, therapist or room. Choose a different time.');
}

export function saveSession(workspace: Workspace, input: Session, finalize = false): Workspace {
  const session=sessionSchema.parse(input);
  const old=workspace.sessions.find(s=>s.id===session.id);
  if (old?.status==='finalized') throw new Error('Finalized notes are read-only. Add an addendum instead.');
  const appointment=workspace.appointments.find(a=>a.id===session.appointmentId);
  if (!appointment || appointment.childId!==session.childId || appointment.status==='cancelled') throw new Error('This appointment is not available.');
  if (finalize && (!session.notes.trim() || appointment.attendance!=='present')) throw new Error('Mark child attendance and add a session summary before finalizing.');
  const now=new Date().toISOString();
  const saved={...session,status:finalize?'finalized' as const:'draft' as const,updatedAt:now,finalizedAt:finalize?now:null};
  return validateWorkspace({...workspace, sessions:[...workspace.sessions.filter(s=>s.id!==session.id),saved],
    appointments:workspace.appointments.map(a=>a.id===appointment.id?{...a,status:finalize?'completed':'in-progress'}:a)});
}

export const activities = [
  { id:'blocks', name:'Build, choose, create', service:'OT', area:'Fine motor · Play', equipment:'Building blocks', description:'A synthetic activity card for recording choices and purposeful play.', measure:'Successful opportunities / total opportunities', color:'peach' },
  { id:'story', name:'A story together', service:'SLT', area:'Communication · Shared attention', equipment:'Picture cards', description:'A synthetic activity card for communication during a shared story.', measure:'Functional requests / opportunities', color:'lilac' },
  { id:'routine', name:'One step at a time', service:'OT', area:'Daily routines · Transitions', equipment:'Visual schedule', description:'A synthetic activity card for participation in a familiar routine.', measure:'Successful transitions / opportunities', color:'sage' },
  { id:'choices', name:'My choice, my voice', service:'SLT', area:'AAC · Functional communication', equipment:'Communication board', description:'A synthetic activity card for recording supported choices.', measure:'Communicative choices / opportunities', color:'blue' }
];

export function seedWorkspace(id: string, name: string, services: ('OT'|'SLT')[]): Workspace {
  const service=services[0];
  const children: Child[]=[
    {id:`${id}-c1`,name:'Child Maple',age:4,service,goal:service==='OT'?'Participate in a familiar play routine':'Communicate a choice during shared play',interests:'Building blocks, animal stories'},
    {id:`${id}-c2`,name:'Child Robin',age:5,service:services.at(-1)!,goal:'Request a preferred activity with agreed support',interests:'Picture books, music'},
    {id:`${id}-c3`,name:'Child Willow',age:3,service,goal:'Join a shared activity for three opportunities',interests:'Puzzles, pretend play'}
  ];
  return {schemaVersion:1,id,name,services,revision:0,children,
    staff:services.map((s,i)=>({id:`${id}-t${i}`,name:s==='OT'?'Demo OT therapist':'Demo SLT therapist',service:s,present:false})),
    equipment:['Building blocks','Picture cards','Visual schedule','Communication board'].map((name,i)=>({id:`${id}-e${i}`,name,available:i!==2})),
    appointments:children.map((c,i)=>({id:`${id}-a${i}`,childId:c.id,date:localDate(),time:['09:00','10:00','11:15'][i],minutes:45,therapist:c.service==='OT'?'Demo OT therapist':'Demo SLT therapist',room:'Room 1',attendance:'expected',status:'scheduled'})),sessions:[]};
}
