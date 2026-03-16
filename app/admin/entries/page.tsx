import { AdminEntryManager } from '@/components/AdminEntryManager';
import { getAdminEntries } from '@/lib/data';

export default async function AdminEntriesPage() {
  const entries = await getAdminEntries();
  return <AdminEntryManager entries={entries} />;
}
