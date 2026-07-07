import { ColumnDef } from '@tanstack/react-table';
import { Clock, Package, CheckCircle2, XCircle, Calendar, ArrowRight, User } from 'lucide-react';

interface FreshBoxMove {
  id: string;
  boxBarcode: string;
  boxName?: string;
  sourceLocation: string;
  destinationLocation: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  assignedTo?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export const columns: ColumnDef<FreshBoxMove>[] = [
  {
    accessorKey: 'boxBarcode',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Box Barcode</span>,
    cell: ({ row, table }) => {
      const move = row.original;
      const meta = table.options.meta as any;
      return (
        <div 
          className="flex flex-col cursor-pointer group"
          onClick={() => meta?.onCustomAction?.(move)}
        >
          <span className="font-mono font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
            {move.boxBarcode}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
            {move.boxName || 'Unnamed Box'}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'route',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Route Locations</span>,
    cell: ({ row }) => {
      const move = row.original;
      return (
        <div className="flex items-center gap-2 font-mono text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-100 px-3 py-1 rounded-xl w-fit">
          <span>{move.sourceLocation}</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-blue-600">{move.destinationLocation}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'assignedTo',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Operator</span>,
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
          <User className="w-3.5 h-3.5" />
        </div>
        {row.getValue('assignedTo') || 'Unassigned'}
      </div>
    ),
  },
  {
    accessorKey: 'startedAt',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Started At</span>,
    cell: ({ row }) => {
      const dateVal = row.getValue('startedAt') as string;
      if (!dateVal) return <span className="text-xs text-slate-400">-</span>;
      const date = new Date(dateVal);
      return (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Status</span>,
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const styles = {
        PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
        COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        FAILED: 'bg-rose-50 text-rose-700 border-rose-200',
      };
      const icons = {
        PENDING: <Clock className="w-3.5 h-3.5 text-yellow-550" />,
        IN_PROGRESS: <Package className="w-3.5 h-3.5 text-blue-550" />,
        COMPLETED: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
        FAILED: <XCircle className="w-3.5 h-3.5 text-rose-500" />,
      };
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${
          styles[status as keyof typeof styles] || styles.PENDING
        }`}>
          {icons[status as keyof typeof icons]}
          {status}
        </span>
      );
    },
  },
];
