const BOX_STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  IN_TRANSIT: 'bg-amber-50 text-amber-700 border-amber-200',
  MERGED: 'bg-slate-50 text-slate-600 border-slate-200',
  DESTROYED: 'bg-rose-50 text-rose-700 border-rose-200',
};

const FILE_STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ARCHIVED: 'bg-slate-50 text-slate-600 border-slate-200',
  DESTROYED: 'bg-rose-50 text-rose-700 border-rose-200',
};

export function BoxStatusBadge({ status }: { status: string }) {
  const style = BOX_STATUS_STYLES[status] || 'bg-slate-50 text-slate-600 border-slate-200';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-lg border text-xs font-semibold uppercase ${style}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export function FileStatusBadge({ status }: { status: string }) {
  const style = FILE_STATUS_STYLES[status] || 'bg-slate-50 text-slate-600 border-slate-200';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-lg border text-xs font-semibold uppercase ${style}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
