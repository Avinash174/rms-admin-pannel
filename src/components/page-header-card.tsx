"use client";

import React from "react";
import { Layers, LucideIcon, ShieldCheck } from "lucide-react";

interface PageHeaderCardProps {
  title: string;
  description: string;
  badge?: string;
  icon?: LucideIcon;
  showAccessScope?: boolean;
  accessScopeText?: string;
  children?: React.ReactNode;
}

export function PageHeaderCard({
  title,
  description,
  badge = "System Live · Global Super Admin Platform",
  icon: Icon,
  showAccessScope = false,
  accessScopeText = "Unrestricted (Global)",
  children
}: PageHeaderCardProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
      {/* Decorative Background Glowing Orbs */}
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 border border-blue-400/20 backdrop-blur-md text-xs font-semibold text-blue-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            {badge}
          </div>
          
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-blue-300 shrink-0">
                <Icon className="h-6 w-6" />
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {title}
            </h1>
          </div>
          
          <p className="text-sm text-slate-300 leading-relaxed pt-1">
            {description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {showAccessScope && (
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Access Scope</p>
                <p className="text-sm font-bold text-white">{accessScopeText}</p>
              </div>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
