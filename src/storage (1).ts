import { openDB } from 'idb';
import { seedWorkspace, validateWorkspace, type Workspace } from './domain';

let connection: ReturnType<typeof openDB> | undefined;
const db = () => connection ??= openDB('aasha-demo-v1',1,{upgrade(database){database.createObjectStore('workspaces',{keyPath:'id'});}});
export async function listWorkspaces(): Promise<Workspace[]> {
  const database=await db();
  const tx=database.transaction('workspaces','readwrite');
  let values=await tx.store.getAll();
  if (!values.length) {
    values=[seedWorkspace('aasha','Aasha demo centre',['OT','SLT']),seedWorkspace('little-steps','Little Steps demo',['OT']),seedWorkspace('voice','Growing Voices demo',['SLT'])];
    for(const value of values) await tx.store.add(value);
  }
  await tx.done;
  return values.map(validateWorkspace);
}
export async function persistWorkspace(value: Workspace, expectedRevision: number): Promise<Workspace> {
  const checked=validateWorkspace(value);
  const database=await db();
  const tx=database.transaction('workspaces','readwrite');
  const old=await tx.store.get(value.id) as Workspace | undefined;
  if (!old || old.revision!==expectedRevision) {
    tx.abort();
    await tx.done.catch(()=>{});
    throw new Error('This centre changed in another tab. Your edit was not saved. Reload the latest data and try again.');
  }
  const next={...checked,revision:old.revision+1};
  await tx.store.put(next);
  await tx.done;
  return next;
}
export async function createWorkspace(value: Workspace) {
  const database=await db();
  await database.add('workspaces',validateWorkspace(value));
}
export async function restoreWorkspace(input: unknown, expectedRevision: number) {
  const value=validateWorkspace(input);
  return persistWorkspace(value,expectedRevision);
}
