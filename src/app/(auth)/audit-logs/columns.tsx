import { ColumnDef } from '@tanstack/react-table';
import { Clock } from 'lucide-react';
import { AuditLog } from '@/lib/types/audit';

function actionBadgeClass(action: string): string {
  if (action.includes('REJECT') || action.includes('DELETED') || action === 'DESTROYED') {
    return 'bg-rose-50 text-rose-700 border-rose-100';
  }
  if (
    action.endsWith('_CREATED') ||
    action.includes('CREATE') ||
    action === 'BOX_CREATED' ||
    action === 'FRESH_BOX_MOVE'
  ) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  }
  if (
    action.endsWith('_UPDATED') ||
    action.includes('UPDATE') ||
    action === 'LOCATION_OVERRIDE' ||
    action === 'MERGE' ||
    action === 'TRANSFER_INITIATE' ||
    action === 'TRANSFER_ACCEPT'
  ) {
    return 'bg-amber-50 text-amber-700 border-amber-100';
  }
  if (
    action === 'INVENTORY_VERIFY' ||
    action === 'REFILE_SUCCESS' ||
    action === 'SEGREGATION'
  ) {
    return 'bg-blue-50 text-blue-700 border-blue-100';
  }
  if (action === 'FRESH_BOX_MOVE' || action.includes('TRANSFER')) {
    return 'bg-violet-50 text-violet-700 border-violet-100';
  }
  return 'bg-slate-50 text-slate-700 border-slate-100';
}

export const columns: ColumnDef<AuditLog>[] = [
  {
    accessorKey: 'createdAt',
    header: () => (
      <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Timestamp</span>
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'));
      return (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          {date.toLocaleString()}
        </div>
      );
    }
  },
  {
    accessorKey: 'action',
    header: () => (
      <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Action</span>
    ),
    cell: ({ row }) => {
      const action = row.getValue('action') as string;
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${actionBadgeClass(action)}`}
        >
          {action.replace(/_/g, ' ')}
        </span>
      );
    }
  },
  {
    accessorKey: 'entityType',
    header: () => (
      <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Entity</span>
    ),
    cell: ({ row }) => (
      <div className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg inline-block">
        {row.getValue('entityType')}
      </div>
    )
  },
  {
    accessorKey: 'entityId',
    header: () => (
      <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Entity ID</span>
    ),
    cell: ({ row }) => (
      <div className="font-mono text-xs font-semibold text-slate-600">
        {row.getValue('entityId') || '—'}
      </div>
    )
  },
  {
    accessorKey: 'userName',
    header: () => (
      <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">User</span>
    ),
    cell: ({ row }) => (
      <div className="text-sm font-semibold text-slate-900">{row.getValue('userName')}</div>
    )
  },
  {
    id: 'device',
    header: () => (
      <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Device</span>
    ),
    cell: ({ row }) => {
      const device = row.original.device;
      return (
        <div className="text-xs text-slate-600 font-mono">
          {device?.serialNumber || '—'}
        </div>
      );
    }
  }
];
