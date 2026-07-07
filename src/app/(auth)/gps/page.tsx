"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Map, Loader2, AlertCircle, RefreshCw, Compass, 
  Sparkles, Info, Users, Smartphone, MapPin, Navigation, Signal
} from 'lucide-react';
import { getLiveWarehouseUsers } from '@/lib/api/gps';
import { getWarehouses } from '@/lib/api/warehouse';
import { Button } from '@/components/ui/button';

export default function GpsPage() {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('1');

  // Load Warehouses list
  const { data: warehousesData, isLoading: isWarehousesLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => getWarehouses(1, 100),
  });

  // Load Live GPS data for the selected warehouse
  const { data: liveGpsData, isLoading: isGpsLoading, error: gpsError, refetch: refetchGps } = useQuery({
    queryKey: ['gps-live', selectedWarehouseId],
    queryFn: () => getLiveWarehouseUsers(selectedWarehouseId),
    refetchInterval: 10000, // auto-refresh telemetry every 10 seconds
  });

  const warehouses = warehousesData?.data || [];
  const operators = liveGpsData?.data || [];

  if (isWarehousesLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <Map className="w-5 h-5 text-blue-600 absolute animate-pulse" />
        </div>
        <span className="text-sm font-semibold text-slate-500 animate-pulse">Initializing telemetry modules...</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 px-4 sm:px-6 lg:px-8 pb-16">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">GPS Telemetry</h1>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Live Tracker
            </span>
          </div>
          <p className="text-sm text-slate-500">Monitor live coordinate locations of scanning operators, track device telemetry, and audit path histories.</p>
        </div>
        
        {/* Warehouse Selector */}
        <div className="flex flex-col gap-1.5 self-start sm:self-center">
          <select
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            className="h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 bg-white text-xs font-bold text-slate-800 shadow-sm"
          >
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name} ({wh.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {gpsError ? (
        <div className="flex flex-col items-center justify-center h-80 space-y-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-4 bg-rose-50 rounded-full">
            <AlertCircle className="w-10 h-10 text-rose-500" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-bold text-slate-900">Failed to stream live coordinates</h3>
            <p className="text-xs text-slate-400 mt-1">Check telemetry link or credentials</p>
          </div>
          <Button onClick={() => refetchGps()} variant="outline" className="rounded-xl border-slate-200">
            <RefreshCw className="w-4 h-4 mr-2" /> Retry Connection
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Live Map Representation (Layout & Virtual Grid Nodes) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="relative overflow-hidden bg-slate-950 text-slate-200 p-6 rounded-2xl border border-slate-800 min-h-[400px] flex flex-col justify-between shadow-inner shadow-black/40">
              
              {/* Radar Grid Backdrop */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.7),rgba(18,24,38,0.7)),radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0%,transparent_70%)]" />
              <div className="absolute inset-0 bg-[size:30px_30px] bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)]" />

              {/* Status HUD Header */}
              <div className="relative z-10 flex justify-between items-center bg-slate-900/60 backdrop-blur-md border border-slate-800 p-3.5 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  <span className="text-[11px] font-bold tracking-wider uppercase text-slate-350">STREAMING ACTIVE TELEMETRY</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                  <Signal className="w-3.5 h-3.5 text-blue-500" />
                  PING: 10s intervals
                </div>
              </div>

              {/* Virtual Grid Nodes representing warehouse coordinates */}
              <div className="relative z-10 flex-1 flex items-center justify-center py-12">
                {operators.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-slate-500 space-y-2">
                    <Compass className="w-12 h-12 text-slate-600 stroke-[1.2] animate-spin-slow" />
                    <p className="text-xs font-semibold">No operators currently broadcasting location</p>
                  </div>
                ) : (
                  <div className="relative w-80 h-48 border border-dashed border-blue-500/20 rounded-xl bg-blue-500/5 flex items-center justify-center">
                    <div className="absolute w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                    {operators.map((op, idx) => {
                      // Place markers at offset coordinates to simulate a radar display
                      const leftPercent = 20 + (idx * 40) % 70;
                      const topPercent = 20 + (idx * 30) % 70;
                      return (
                        <div 
                          key={op.userId} 
                          className="absolute flex flex-col items-center group cursor-pointer"
                          style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                        >
                          <div className="relative flex h-7 w-7 items-center justify-center rounded-xl bg-blue-600 border border-blue-400 text-white shadow-md shadow-blue-500/20 hover:scale-110 transition-transform">
                            <Navigation className="w-3.5 h-3.5 rotate-45" />
                          </div>
                          <span className="mt-1.5 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-200 whitespace-nowrap shadow-md">
                            {op.userName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="relative z-10 text-[10px] text-slate-400 flex items-center gap-1.5 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/40 self-start">
                <Info className="w-4 h-4 text-blue-500" />
                Live markers correspond to synced handheld device GPS receivers.
              </div>
            </div>
          </div>

          {/* Active Operator Log List */}
          <div className="space-y-6">
            
            {/* Stat Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4.5 p-4 rounded-2xl border border-slate-150 shadow-sm space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Operators</p>
                <div className="flex items-baseline gap-1.5">
                  <h4 className="text-2xl font-black text-slate-900">{operators.length}</h4>
                  <Users className="w-4 h-4 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-white p-4.5 p-4 rounded-2xl border border-slate-150 shadow-sm space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Accuracy</p>
                <div className="flex items-baseline gap-1.5">
                  <h4 className="text-2xl font-black text-slate-900">
                    {operators.length > 0 ? (operators.reduce((acc, curr) => acc + (curr.accuracy || 0), 0) / operators.length).toFixed(1) : '0'}m
                  </h4>
                  <Signal className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
            </div>

            {/* Operator Telemetry list */}
            <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Telemetry Logs</h3>
              </div>
              <div className="divide-y divide-slate-100 overflow-y-auto max-h-[300px]">
                {operators.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No active coordinates streaming.
                  </div>
                ) : (
                  operators.map((op) => (
                    <div key={op.userId} className="p-4 flex flex-col space-y-2 hover:bg-slate-50/40 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-slate-800">{op.userName}</h4>
                          <p className="text-[10px] text-slate-400 font-semibold">{op.userEmail}</p>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                          <Smartphone className="w-3.5 h-3.5 text-slate-450" />
                          {op.deviceName || 'Handheld'}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-[10px] bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-blue-500" />
                          <span>{op.latitude.toFixed(4)}, {op.longitude.toFixed(4)}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold">ACCURACY: {op.accuracy || 5}m</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
