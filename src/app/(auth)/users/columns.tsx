import { ColumnDef } from '@tanstack/react-table';
import { User } from '@/lib/types/user';
import { User2 } from 'lucide-react';

function getAvatarColors(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return {
    bg: `hsl(${h}, 85%, 95%)`,
    text: `hsl(${h}, 85%, 35%)`,
  };
}

function getInitials(firstName: string, lastName: string) {
  const f = firstName?.[0] || '';
  const l = lastName?.[0] || '';
  return (f + l).toUpperCase() || '?';
}

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'firstName',
    header: 'User',
    cell: ({ row, table }) => {
      const user = row.original;
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
      const initials = getInitials(user.firstName, user.lastName);
      const colors = getAvatarColors(fullName);
      const meta = table.options.meta as any;

      return (
        <div 
          className="flex items-center gap-3 py-1 cursor-pointer group"
          onClick={() => meta?.onCustomAction?.(user)}
        >
          <div
            className="flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold tracking-wider shadow-sm transition-all duration-300 group-hover:scale-105"
            style={{ backgroundColor: colors.bg, color: colors.text }}
          >
            {initials || <User2 className="w-5 h-5" />}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800 text-sm leading-tight group-hover:text-blue-600 transition-colors">
              {fullName}
            </span>
            <span className="text-xs text-slate-400 mt-0.5">{user.email}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'roleName',
    header: 'Role',
    cell: ({ row }) => {
      const role = (row.getValue('roleName') as string) || 'Operator';
      return (
        <div className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wide">
          {role}
        </div>
      );
    },
  },
  {
    accessorKey: 'warehouseName',
    header: 'Warehouse / Assignment',
    cell: ({ row }) => {
      const name = row.getValue('warehouseName') as string;
      return <div className="text-sm font-medium text-slate-600">{name || 'Global Access'}</div>;
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row, table }) => {
      const user = row.original;
      const meta = table.options.meta as any;
      const status = row.getValue('status') as 'ACTIVE' | 'SUSPENDED' | 'INVITED';

      const statusConfigs = {
        ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 hover:bg-emerald-100 dot-emerald-500',
        SUSPENDED: 'bg-rose-50 text-rose-700 border-rose-200/60 hover:bg-rose-100 dot-rose-500',
        INVITED: 'bg-blue-50 text-blue-700 border-blue-200/60 hover:bg-blue-100 dot-blue-500',
      };

      const nextStatusMap = {
        ACTIVE: 'SUSPENDED' as const,
        SUSPENDED: 'ACTIVE' as const,
        INVITED: 'ACTIVE' as const,
      };

      const dotColors = {
        ACTIVE: 'bg-emerald-500',
        SUSPENDED: 'bg-rose-500',
        INVITED: 'bg-blue-500',
      };

      return (
        <button
          onClick={() => {
            const nextStatus = nextStatusMap[status];
            meta?.onEdit?.({ ...user, status: nextStatus }, true);
          }}
          className={`group flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 border ${
            statusConfigs[status] || statusConfigs.SUSPENDED
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full transition-transform duration-300 group-hover:scale-125 ${dotColors[status] || 'bg-slate-400'}`} />
          <span className="capitalize">{status.toLowerCase()}</span>
        </button>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'));
      return (
        <div className="text-sm text-slate-500 font-medium">
          {date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
        </div>
      );
    },
  },
];
