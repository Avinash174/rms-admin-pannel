"use client";

import { useState } from 'react';
import { X, LayoutDashboard, Users, Shield, Warehouse, Map, FileBox, Settings, Menu, Bell, Database } from "lucide-react";
import Link from "next/link";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navItems = [
    {
      category: "Overview",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      category: "Management",
      items: [
        { href: "/companies", label: "Company Management", icon: Warehouse },
        { href: "/warehouses", label: "Warehouse Management", icon: Warehouse },
        { href: "/branches", label: "Branch Management", icon: Warehouse },
        { href: "/sites", label: "Site Management", icon: Warehouse },
        { href: "/rooms", label: "Room / Rack / Shelf / Location", icon: Warehouse },
        { href: "/clients", label: "Client Management", icon: Users },
        { href: "/departments", label: "Department Management", icon: Users },
        { href: "/boxes", label: "Box Management", icon: FileBox },
        { href: "/file-records", label: "File Record Management", icon: FileBox },
        { href: "/users", label: "User Management", icon: Users },
        { href: "/roles", label: "Role & Permission Management", icon: Shield },
        { href: "/devices", label: "Device Management", icon: Warehouse },
        { href: "/reason-codes", label: "Reason Code Management", icon: Settings },
      ],
    },
    {
      category: "Workflows",
      items: [
        { href: "/workflows/fresh-box-move", label: "Fresh Box Moving", icon: FileBox },
        { href: "/workflows/inventory-verification", label: "Inventory Verification", icon: FileBox },
        { href: "/workflows/refile", label: "Refile Management", icon: FileBox },
        { href: "/workflows/segregation", label: "Segregation / Merge / Transfer", icon: FileBox },
      ],
    },
    {
      category: "System",
      items: [
        { href: "/audit-logs", label: "Audit Logs", icon: Shield },
        { href: "/reports", label: "Reports", icon: FileBox },
        { href: "/settings", label: "Settings", icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-50
          w-72 lg:w-64 bg-white border-r border-slate-200
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col h-screen
        `}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 bg-slate-50/20">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
              <Database className="w-4.5 h-4.5 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-900 tracking-wider uppercase leading-none">
                RMS <span className="text-blue-650 text-blue-600">Admin</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Control Panel
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4">
          {navItems.map((section) => (
            <div key={section.category} className="min-w-0">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3 truncate">
                {section.category}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center px-3 py-2 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-[14px] transition-colors min-w-0"
                      onClick={() => onClose()}
                    >
                      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                      <span className="font-medium truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center px-3 py-2 text-slate-500 text-sm">
            <span className="font-medium">v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
