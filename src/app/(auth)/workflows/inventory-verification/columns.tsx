import { ColumnDef } from '@tanstack/react-table';
import { Clock, ClipboardCheck, CheckCircle2, XCircle, User, MapPin } from 'lucide-react';

export interface InventoryVerification {
  id: string;
  verificationCode: string;
  locationId: string;
  locationName: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  totalBoxes: number;
  verifiedBoxes: number;
  discrepancyBoxes: number;
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
  IN_PROGRESS: <ClipboardCheck className="w-3.5 h-3.5" />,
  COMPLETED: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
  FAILED: <XCircle className="w-3.5 h-3.5 text-rose-500" />,
};

export const columns: ColumnDef<InventoryVerification>[] = [
  {
    accessorKey: 'verificationCode',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Verification Code</span>,
    cell: ({ row, table }) => {
      const item = row.original;
      const meta = table.options.meta as any;
      return (
        <div
          className="flex flex-col cursor-pointer group"
          onClick={() => meta?.onCustomAction?.(item)}
        >
          <span className="font-mono font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
            {item.verificationCode}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Click to view details</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'locationName',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Location</span>,
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
        <MapPin className="w-3.5 h-3.5 text-slate-400" />
        {row.original.locationName}
      </div>
    ),
  },
  {
    accessorKey: 'verifiedBoxes',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Progress</span>,
    cell: ({ row }) => {
      const { verifiedBoxes, totalBoxes } = row.original;
      const pct = totalBoxes > 0 ? Math.round((verifiedBoxes / totalBoxes) * 100) : 0;
      const barColor = pct === 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-400';
      return (
        <div className="w-36">
          <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5">
            <span>{verifiedBoxes}/{totalBoxes} boxes</span>
            <span>{pct}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'discrepancyBoxes',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Discrepancies</span>,
    cell: ({ row }) => {
      const val = row.original.discrepancyBoxes;
      return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
          val > 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-50 text-slate-500 border border-slate-200'
        }`}>
          {val > 0 ? `⚠ ${val} discrepancy` : '✓ None'}
        </span>
      );
    },
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
