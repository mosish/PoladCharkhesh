import { useEffect } from 'react';
const pending = new Set<symbol>();
export function confirmNavigation(): boolean {
  return !pending.size || window.confirm(document.documentElement.lang === 'fa'
    ? 'تغییرات ذخیره‌نشده کنار گذاشته شوند؟' : 'Discard unsaved changes?');
}
export function useUnsavedChanges(dirty: boolean): void {
  useEffect(() => {
    if (!dirty) return;
    const token = Symbol(); pending.add(token);
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', beforeUnload);
    return () => { pending.delete(token); window.removeEventListener('beforeunload', beforeUnload); };
  }, [dirty]);
}
