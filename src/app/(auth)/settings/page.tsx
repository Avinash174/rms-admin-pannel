"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Loader2, Settings, ShieldAlert, Sparkles, Check,
  Database, Smartphone, Server, FileText, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getCompanySettings, updateCompanySettings } from '@/lib/api/setting';
import { CompanySettings } from '@/lib/types/setting';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'scanning' | 'sync'>('general');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const queryClient = useQueryClient();

  const { data: companySettings, isLoading } = useQuery({
    queryKey: ['company-settings'],
    queryFn: getCompanySettings,
  });

  const [settings, setSettings] = useState({
    companyName: companySettings?.name || '',
    systemMode: 'PRODUCTION',
    fileRetentionYears: 7,
    boxRetentionYears: 10,
    gpsInterval: 10,
    syncIntervalMinutes: 5,
    matchRateThreshold: 98,
    redisTtl: 3600,
    offlineBatchSize: 100,
    syncRetryAttempts: 3,
  });

  const saveMutation = useMutation({
    mutationFn: (name: string) => updateCompanySettings({ name }),
    onSuccess: () => {
      setSaveSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      setTimeout(() => setSaveSuccess(false), 3000);
      toast.success('Settings saved successfully');
    },
    onError: () => {
      toast.error('Failed to save settings');
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(settings.companyName);
  };

  const handleInputChange = (key: keyof typeof settings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 px-4 sm:px-6 lg:px-8 pb-16">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Settings</h1>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Configurations Panel
            </span>
          </div>
          <p className="text-sm text-slate-500">Manage global operational thresholds, handheld scanning intervals, database retry parameters, and storage retention policies.</p>
        </div>
      </div>

      {/* Settings Navigation and Form Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Navigation Tabs (Sidebar Layout) */}
        <div className="bg-white p-4.5 p-4 rounded-2xl border border-slate-150 shadow-sm space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-3">Settings Categories</p>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('general')}
              type="button"
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'general'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Server className="w-4 h-4" />
              General & Retention
            </button>
            <button
              onClick={() => setActiveTab('scanning')}
              type="button"
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'scanning'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Scanning & Telemetry
            </button>
            <button
              onClick={() => setActiveTab('sync')}
              type="button"
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'sync'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Database className="w-4 h-4" />
              Database & Cache
            </button>
          </nav>
        </div>

        {/* Configurations Form */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden flex flex-col">
            
            {/* Header of Active Tab */}
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                {activeTab === 'general' && 'General operational settings & Retention policies'}
                {activeTab === 'scanning' && 'Scanning handheld telemetry & gps parameters'}
                {activeTab === 'sync' && 'Database cache, sync batches, & retry thresholds'}
              </h3>
            </div>

            {/* Form Fields */}
            <div className="p-6 space-y-6">
              
              {activeTab === 'general' && (
                <div className="space-y-6">
                  {/* Company Name */}
                  <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <Label htmlFor="companyName" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Tenant Name</Label>
                    <div className="md:col-span-2">
                      <Input
                        id="companyName"
                        value={settings.companyName}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                        className="h-11 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  {/* System Mode */}
                  <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <Label htmlFor="systemMode" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Environment Mode</Label>
                    <div className="md:col-span-2">
                      <select
                        id="systemMode"
                        value={settings.systemMode}
                        onChange={(e) => handleInputChange('systemMode', e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 bg-white text-xs font-semibold text-slate-800"
                      >
                        <option value="PRODUCTION">PRODUCTION</option>
                        <option value="SANDBOX">SANDBOX / STAGING</option>
                      </select>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 my-2" />

                  {/* File Retention Policy */}
                  <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <Label htmlFor="fileRetention" className="text-xs font-bold text-slate-600 uppercase tracking-wider">File Retention (Years)</Label>
                    <div className="md:col-span-2 flex items-center gap-3">
                      <Input
                        id="fileRetention"
                        type="number"
                        value={settings.fileRetentionYears}
                        onChange={(e) => handleInputChange('fileRetentionYears', parseInt(e.target.value) || 0)}
                        className="h-11 w-32 rounded-xl border-slate-200 text-xs font-semibold text-center"
                      />
                      <span className="text-xs text-slate-450 font-semibold">Standard record destruction threshold</span>
                    </div>
                  </div>

                  {/* Box Retention Policy */}
                  <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <Label htmlFor="boxRetention" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Box Retention (Years)</Label>
                    <div className="md:col-span-2 flex items-center gap-3">
                      <Input
                        id="boxRetention"
                        type="number"
                        value={settings.boxRetentionYears}
                        onChange={(e) => handleInputChange('boxRetentionYears', parseInt(e.target.value) || 0)}
                        className="h-11 w-32 rounded-xl border-slate-200 text-xs font-semibold text-center"
                      />
                      <span className="text-xs text-slate-450 font-semibold">Standard box container retention period</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'scanning' && (
                <div className="space-y-6">
                  {/* GPS Interval */}
                  <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <Label htmlFor="gpsInterval" className="text-xs font-bold text-slate-600 uppercase tracking-wider">GPS Ping Interval (Sec)</Label>
                    <div className="md:col-span-2 flex items-center gap-3">
                      <Input
                        id="gpsInterval"
                        type="number"
                        value={settings.gpsInterval}
                        onChange={(e) => handleInputChange('gpsInterval', parseInt(e.target.value) || 0)}
                        className="h-11 w-32 rounded-xl border-slate-200 text-xs font-semibold text-center"
                      />
                      <span className="text-xs text-slate-450 font-semibold">Frequency of device coordinate broadcasts</span>
                    </div>
                  </div>

                  {/* Sync Interval */}
                  <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <Label htmlFor="syncInterval" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Sync Interval (Min)</Label>
                    <div className="md:col-span-2 flex items-center gap-3">
                      <Input
                        id="syncInterval"
                        type="number"
                        value={settings.syncIntervalMinutes}
                        onChange={(e) => handleInputChange('syncIntervalMinutes', parseInt(e.target.value) || 0)}
                        className="h-11 w-32 rounded-xl border-slate-200 text-xs font-semibold text-center"
                      />
                      <span className="text-xs text-slate-450 font-semibold">Automatic scan queues synchronization sync timer</span>
                    </div>
                  </div>

                  {/* Match Rate Threshold */}
                  <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <Label htmlFor="matchRate" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Verification Threshold (%)</Label>
                    <div className="md:col-span-2 flex items-center gap-3">
                      <Input
                        id="matchRate"
                        type="number"
                        value={settings.matchRateThreshold}
                        onChange={(e) => handleInputChange('matchRateThreshold', parseInt(e.target.value) || 0)}
                        className="h-11 w-32 rounded-xl border-slate-200 text-xs font-semibold text-center"
                      />
                      <span className="text-xs text-slate-450 font-semibold">Minimum successful verification rate before warning alerts</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'sync' && (
                <div className="space-y-6">
                  {/* Redis Cache TTL */}
                  <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <Label htmlFor="redisTtl" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Redis Cache TTL (Sec)</Label>
                    <div className="md:col-span-2 flex items-center gap-3">
                      <Input
                        id="redisTtl"
                        type="number"
                        value={settings.redisTtl}
                        onChange={(e) => handleInputChange('redisTtl', parseInt(e.target.value) || 0)}
                        className="h-11 w-32 rounded-xl border-slate-200 text-xs font-semibold text-center"
                      />
                      <span className="text-xs text-slate-450 font-semibold">Cache expiration duration for lookups</span>
                    </div>
                  </div>

                  {/* Offline Batch Size */}
                  <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <Label htmlFor="offlineBatch" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Sync Batch Size</Label>
                    <div className="md:col-span-2 flex items-center gap-3">
                      <Input
                        id="offlineBatch"
                        type="number"
                        value={settings.offlineBatchSize}
                        onChange={(e) => handleInputChange('offlineBatchSize', parseInt(e.target.value) || 0)}
                        className="h-11 w-32 rounded-xl border-slate-200 text-xs font-semibold text-center"
                      />
                      <span className="text-xs text-slate-450 font-semibold">Max records synchronized per database payload pack</span>
                    </div>
                  </div>

                  {/* Sync Retry attempts */}
                  <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <Label htmlFor="retryAttempts" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Max Sync Retries</Label>
                    <div className="md:col-span-2 flex items-center gap-3">
                      <Input
                        id="retryAttempts"
                        type="number"
                        value={settings.syncRetryAttempts}
                        onChange={(e) => handleInputChange('syncRetryAttempts', parseInt(e.target.value) || 0)}
                        className="h-11 w-32 rounded-xl border-slate-200 text-xs font-semibold text-center"
                      />
                      <span className="text-xs text-slate-450 font-semibold">Failure retry limit before tagging sync error overrides</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer containing Save Action */}
            <div className="px-6 py-4.5 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
              
              {/* Status Message */}
              <div>
                {saveSuccess && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <Check className="w-4 h-4" /> Config saved successfully!
                  </span>
                )}
                {saveMutation.isPending && (
                  <span className="text-xs font-semibold text-slate-450 flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Synchronizing parameters...
                  </span>
                )}
              </div>

              {/* Action Button */}
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md hover:shadow-blue-500/20 transition-all duration-300 h-11 px-6 text-xs font-bold shrink-0"
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Save System Settings'}
              </Button>

            </div>

          </form>
        </div>

      </div>

    </div>
  );
}
