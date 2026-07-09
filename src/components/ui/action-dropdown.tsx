import * as React from 'react';
import { Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';

interface ActionDropdownProps {
  onEdit?: () => void;
  onDelete?: () => void;
  deleteLabel?: string;
  editLabel?: string;
  children?: React.ReactNode;
}

export function ActionDropdown({
  onEdit,
  onDelete,
  deleteLabel = 'Delete',
  editLabel = 'Edit Details',
  children,
}: ActionDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0 hover:bg-slate-100 rounded-xl transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4.5 w-4.5 text-slate-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-[16px] bg-white border border-slate-200 shadow-lg focus:outline-none z-50">
        <DropdownMenuLabel className="px-4 py-2.5 text-base font-bold text-slate-900 tracking-tight">
          Settings
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {onEdit && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg cursor-pointer transition-colors"
          >
            <Pencil className="h-4 w-4 text-slate-400 stroke-[2]" />
            {editLabel}
          </DropdownMenuItem>
        )}
        {children}
        {onDelete && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-red-50/50 hover:text-red-700 rounded-lg cursor-pointer transition-colors"
          >
            <Trash2 className="h-4 w-4 text-red-500 stroke-[2]" />
            {deleteLabel}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
