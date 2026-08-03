import { RecordTimelineEntry } from '@/lib/api/records';

export function TimelineList({ entries }: { entries: RecordTimelineEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-slate-400 py-4 text-center">No timeline entries</p>;
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div key={entry.id} className="border border-slate-100 rounded-xl p-3 bg-slate-50/50">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase">{entry.action}</span>
            <span className="text-[10px] text-slate-400">
              {new Date(entry.createdAt).toLocaleString()}
            </span>
          </div>
          {entry.user && (
            <p className="text-xs text-slate-500 mt-1">by {entry.user.fullName}</p>
          )}
        </div>
      ))}
    </div>
  );
}
