import { Construction } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <Construction className="w-16 h-16 text-slate-300 mb-4" />
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Module Not Built Yet</h1>
      <p className="text-slate-500 text-center mb-6 max-w-md">
        This module is part of the build queue and will be implemented in a future iteration.
      </p>
      <Link
        href="/dashboard"
        className="px-4 py-2 bg-blue-600 text-white rounded-[14px] hover:bg-blue-700 transition-colors text-sm font-medium"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
