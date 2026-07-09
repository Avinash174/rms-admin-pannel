import { ColumnDef } from '@tanstack/react-table';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';
import { AuditLog } from '@/lib/types/audit';

export const columns: ColumnDef<AuditLog>[] = [
  {
    accessorKey: 'createdAt',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Timestamp</span>,
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'));
      return (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          {date.toLocaleString()}
        </div>
      );
    },
  },
  {
    accessorKey: 'userName',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">User</span>,
    cell: ({ row }) => (
      <div className="text-sm font-semibold text-slate-900">
        {row.getValue('userName')}
      </div>
    ),
  },
  {
    accessorKey: 'action',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Action</span>,
    cell: ({ row }) => {
      const action = row.getValue('action') as string;
      const styles = {
        CREATE: 'bg-blue-50 text-blue-700 border-blue-100',
        UPDATE: 'bg-amber-50 text-amber-700 border-amber-100',
        DELETE: 'bg-rose-50 text-rose-700 border-rose-100',
        READ: 'bg-slate-50 text-slate-700 border-slate-100',
      };
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${
          styles[action as keyof typeof styles] || styles.READ
        }`}>
          {action}
        </span>
      );
    },
  },
  {
    accessorKey: 'entity',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Entity</span>,
    cell: ({ row }) => (
      <div className="text-xs font-semibold text-slate-650 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg inline-block">
        {row.getValue('entity')}
      </div>
    ),
  },
  {
    accessorKey: 'entityId',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Entity ID</span>,
    cell: ({ row }) => (
      <div className="font-mono text-xs font-semibold text-slate-600">
        {row.getValue('entityId')}
      </div>
    ),
  },
  {
    accessorKey: 'changes',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Changes</span>,
    cell: ({ row }) => (
      <div className="text-xs text-slate-500 font-semibold max-w-[200px] truncate">
        {row.getValue('changes') || '-'}
      </div>
    ),
  },
  {
    accessorKey: 'ipAddress',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">IP Address</span>,
    cell: ({ row }) => (
      <div className="font-mono text-xs text-slate-500 font-semibold">
        {row.getValue('ipAddress') || '-'}
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Status</span>,
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const isSuccess = status === 'SUCCESS';
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${
          isSuccess 
            ? 'bg-emerald-50/60 text-emerald-700 border-emerald-250 border-emerald-200' 
            : 'bg-rose-50/60 text-rose-700 border-rose-200'
        }`}>
          <span className="relative flex h-2 w-2">
            {isSuccess && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isSuccess ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          </span>
          {status}
        </span>
      );
    },
  },
];
