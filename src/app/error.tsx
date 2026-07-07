"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-[500px] space-y-5 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm max-w-md mx-auto mt-20">
      <div className="p-4 bg-rose-50 text-rose-650 rounded-full">
        <AlertCircle className="w-10 h-10 text-rose-500" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-slate-900">Something went wrong!</h2>
        <p className="text-sm text-slate-500 max-w-xs mx-auto">
          An unexpected application error occurred. You can attempt to retry the operation.
        </p>
        {error.message && (
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-left max-h-32 overflow-y-auto">
            <code className="text-xs font-mono text-rose-600 block break-all">
              {error.message}
            </code>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Button
          onClick={() => reset()}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md hover:shadow-blue-500/20 transition-all duration-300 h-11 px-5"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
