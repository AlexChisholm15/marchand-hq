import type { RoleId, Task } from './types.ts';

/** Keep an incoming ?task= link only when that task belongs to the current role. */
export function retainTaskSelection(id: string | null, role: RoleId, tasks: ReadonlyArray<Pick<Task, 'id' | 'role'>>): string | null {
  return id && tasks.some(task => task.id === id && task.role === role) ? id : null;
}

/** Project Studio is a staff demo; homeowner and realtor roles must not inherit owner's view. */
export function canOpenStudio(role: RoleId): boolean {
  return role === 'owner' || role === 'coo' || role === 'office' || role === 'pm' || role === 'designer';
}

/** Report unavailable browser storage rather than silently claiming local drafts were saved. */
export function persistDrafts(storage: Pick<Storage, 'setItem'>, entries: ReadonlyArray<readonly [string, string]>): boolean {
  try {
    for (const [key, value] of entries) storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
