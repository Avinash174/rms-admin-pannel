import { ColumnDef } from '@tanstack/react-table';
import { Device } from '@/lib/types/device';
import { Calendar, User } from 'lucide-react';

export const columns: ColumnDef<Device>[] = [
  {
    accessorKey: 'serialNumber',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Serial Number</span>,
    cell: ({ row, table }) => {
      const device = row.original;
      const serial = device.serialNumber || device.deviceId;
      const meta = table.options.meta as any;

      return (
        <button
          className="text-left font-mono text-sm font-semibold text-slate-800 hover:text-blue-600"
          onClick={() => meta?.onCustomAction?.(device)}
        >
          {serial}
        </button>
      );
    },
  },
  {
    accessorKey: 'model',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Model</span>,
    cell: ({ row }) => (
      <span className="text-sm text-slate-700">{row.getValue('model') || '—'}</span>
    ),
  },
  {
    accessorKey: 'userName',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Last User</span>,
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
        <User className="w-3.5 h-3.5 text-slate-400" />
        {row.getValue('userName') || '—'}
      </div>
    ),
  },
  {
    accessorKey: 'appVersion',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">App Version</span>,
    cell: ({ row }) => (
      <span className="text-xs font-mono font-semibold text-slate-700">
        {row.getValue('appVersion') || '—'}
      </span>
    ),
  },
  {
    accessorKey: 'lastSyncedAt',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Last Seen</span>,
    cell: ({ row }) => {
      const date = row.original.lastSyncedAt;
      return (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          {date ? new Date(date).toLocaleString() : '—'}
        </div>
      );
    },
  },
  {
    accessorKey: 'isActive',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Status</span>,
    cell: ({ row, table }) => {
      const device = row.original;
      const meta = table.options.meta as any;
      const isActive = row.getValue('isActive') as boolean;

      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            meta?.onEdit?.({ ...device, isActive: !isActive }, true);
          }}
          className={`px-3 py-1 rounded-full text-xs font-bold border ${
            isActive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {isActive ? 'Active' : 'Inactive'}
        </button>
      );
    },
  },
];
