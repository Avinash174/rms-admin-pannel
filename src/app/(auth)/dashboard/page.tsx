"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Building2, 
  Files, 
  Box, 
  ScanLine, 
  ArrowUpRight,
  Download,
  Loader2,
  AlertCircle,
  RefreshCw,
  Info
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getDashboardData, getScanActivity } from "@/lib/api/dashboard";
import { format } from "date-fns";

const CHART_RANGES = [
  { label: '7D',  days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
] as const;

type ChartRange = typeof CHART_RANGES[number]['days'];

export default function DashboardPage() {
  const [chartRange, setChartRange] = useState<ChartRange>(7);

  const {
    data: dashboardData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardData,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Scan Activity has its own range-scoped query — the combined dashboard
  // payload above is always fetched for a fixed 7-day window (days=7), so
  // slicing it client-side for 30D/90D just re-sliced the same 7 days and
  // the range buttons appeared to do nothing. Refetch from the backend with
  // the actual selected range instead.
  const {
    data: scanActivityData,
    isFetching: isScanActivityFetching,
  } = useQuery({
    queryKey: ['scan-activity', chartRange],
    queryFn: () => getScanActivity(chartRange),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900">Failed to load dashboard</h3>
          <p className="text-sm text-slate-500 mt-1">Please check your connection and try again</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-[14px] hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </button>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { metrics, recentActivity } = dashboardData;

  const filteredScanActivity = scanActivityData ?? [];

  return (
    <div className="w-full space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of your records and warehouse operations.</p>
        </div>
        <button className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-[14px] hover:bg-blue-700 transition-colors text-sm font-medium w-full sm:w-auto">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard 
          title="Total Warehouses" 
          value={metrics.totalWarehouses.toString()} 
          icon={Building2} 
          trend="Total company warehouse sites" 
          color="blue"
        />
        <MetricCard 
          title="Active Records" 
          value={metrics.totalFiles.toLocaleString()} 
          icon={Files} 
          trend="Fully active file metadata entries" 
          color="emerald"
        />
        <MetricCard 
          title="Physical Boxes" 
          value={metrics.totalBoxes.toLocaleString()} 
          icon={Box} 
          trend="Barcoded box containers on shelves" 
          color="purple"
        />
        <MetricCard 
          title="Scans Today" 
          value={metrics.scansToday.toString()} 
          icon={ScanLine} 
          trend="Verified scanner workflows today" 
          color="amber"
        />
      </div>
      
      {/* Charts & Tables Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-[14px] border border-slate-200 shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
                Scan Activity
                {isScanActivityFetching && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Scanner workflow events over time</p>
            </div>

            {/* Time-range segmented filter */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-0.5 self-start sm:self-auto">
              {CHART_RANGES.map(({ label, days }) => (
                <button
                  key={days}
                  onClick={() => setChartRange(days)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    chartRange === days
                      ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredScanActivity} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 12 }} 
                  dy={10}
                  tickFormatter={(value) => format(new Date(value), chartRange <= 7 ? 'EEE' : 'MMM dd')}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#F8FAFC' }} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                />
                <Bar dataKey="scans" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
 
        {/* Recent Activity Table (Mini) */}
        <div className="bg-white rounded-[14px] border border-slate-200 shadow-sm p-4 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">Recent Activity</h2>
            <a href="/audit-logs" className="text-sm font-medium text-blue-600 hover:underline">View All</a>
          </div>
          {recentActivity.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              No recent activity
            </div>
          ) : (
            <div className="flex-1 space-y-4 sm:space-y-6">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start">
                  <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${
                    activity.status === 'success' ? 'bg-green-500' :
                    activity.status === 'pending' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} />
                  <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{activity.action}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{activity.userName} {activity.location && `• ${activity.location}`}</p>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap ml-2 sm:ml-4 hidden sm:block">
                    {format(new Date(activity.timestamp), 'MMM dd, HH:mm')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, trend, color = 'blue' }: { 
  title: string, 
  value: string, 
  icon: any, 
  trend: string,
  color?: 'blue' | 'emerald' | 'purple' | 'amber' | 'rose'
}) {
  const styles = {
    blue: {
      gradient: 'from-blue-50 to-indigo-50/30',
      iconContainer: 'bg-blue-50 text-blue-600 border-blue-100/50',
      iconText: 'text-blue-500',
    },
    emerald: {
      gradient: 'from-emerald-50 to-teal-50/30',
      iconContainer: 'bg-emerald-50 text-emerald-600 border-emerald-100/50',
      iconText: 'text-emerald-500',
    },
    purple: {
      gradient: 'from-purple-50 to-violet-50/30',
      iconContainer: 'bg-purple-50 text-purple-600 border-purple-100/50',
      iconText: 'text-purple-500',
    },
    amber: {
      gradient: 'from-amber-50 to-orange-50/30',
      iconContainer: 'bg-amber-50 text-amber-600 border-amber-100/50',
      iconText: 'text-amber-500',
    },
    rose: {
      gradient: 'from-rose-50 to-red-50/30',
      iconContainer: 'bg-rose-50 text-rose-600 border-rose-100/50',
      iconText: 'text-rose-500',
    },
  };

  const activeStyle = styles[color] || styles.blue;

  return (
    <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl ${activeStyle.gradient} rounded-bl-full -z-0 opacity-80 transition-transform duration-500 group-hover:scale-105`} />
      <div className="relative z-10 flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
        </div>
        <div className={`p-3.5 rounded-2xl border shadow-sm ${activeStyle.iconContainer}`}>
          <Icon className="w-6 h-6 stroke-[2]" />
        </div>
      </div>
      <div className="mt-5 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-50 pt-4">
        {color === 'emerald' ? (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        ) : (
          <Info className={`w-4 h-4 ${activeStyle.iconText}`} />
        )}
        {trend}
      </div>
    </div>
  );
}
