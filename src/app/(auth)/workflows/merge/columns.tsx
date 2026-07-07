import { ColumnDef } from '@tanstack/react-table';
import { Clock, Package, CheckCircle2, XCircle, User, ArrowRight } from 'lucide-react';

export interface Merge {
  id: string;
  mergeCode: string;
  sourceBoxBarcode: string;
  sourceBoxName?: string;
  destinationBoxBarcode: string;
  destinationBoxName?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  reason?: string;
  fileCount?: number;
  assignedTo?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

const statusStyles = {
  PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  FAILED: 'bg-rose-50 text-rose-700 border-rose-200',
};

const statusIcons = {
  PENDING: <Clock className="w-3.5 h-3.5" />,
  IN_PROGRESS: <Package className="w-3.5 h-3.5" />,
  COMPLETED: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
  FAILED: <XCircle className="w-3.5 h-3.5 text-rose-500" />,
};

export const columns: ColumnDef<Merge>[] = [
  {
    accessorKey: 'mergeCode',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Merge Code</span>,
    cell: ({ row, table }) => {
      const item = row.original;
      const meta = table.options.meta as any;
      return (
        <div className="flex flex-col cursor-pointer group" onClick={() => meta?.onCustomAction?.(item)}>
          <span className="font-mono font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
            {item.mergeCode}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Click to view details</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'sourceBoxBarcode',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Merge Route</span>,
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex items-center gap-2 font-mono text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl w-fit">
          <div className="flex flex-col items-start">
            <span className="text-[9px] text-slate-400 uppercase">Source</span>
            <span>{item.sourceBoxBarcode}</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <div className="flex flex-col items-start">
            <span className="text-[9px] text-slate-400 uppercase">Destination</span>
            <span className="text-blue-600">{item.destinationBoxBarcode}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'fileCount',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Files</span>,
    cell: ({ row }) => (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
        <Package className="w-3 h-3" />
        {row.original.fileCount ?? '-'}
      </span>
    ),
  },
  {
    accessorKey: 'reason',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Reason</span>,
    cell: ({ row }) => (
      <span className="text-xs text-slate-600 font-medium">{row.original.reason || '-'}</span>
    ),
  },
  {
    accessorKey: 'assignedTo',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Operator</span>,
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
          <User className="w-3.5 h-3.5 text-slate-500" />
        </div>
        {row.original.assignedTo || 'Unassigned'}
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Status</span>,
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${
          statusStyles[status as keyof typeof statusStyles] || statusStyles.PENDING
        }`}>
          {statusIcons[status as keyof typeof statusIcons]}
          {status.replace('_', ' ')}
        </span>
      );
    },
  },
];
