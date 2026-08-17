"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building2,
  Settings,
  Shield,
  User,
  Globe,
  Clock,
  Save,
  KeyRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeaderCard } from "@/components/page-header-card";
import { useAuth } from "@/contexts/auth-context";
import { can, isSuperAdmin } from "@/lib/permissions";
import { getCompanySettings, updateCompanySettings } from "@/lib/api/setting";
import { updateMe } from "@/lib/api/user";

const TIMEZONES = [
  "UTC",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Europe/London",
  "America/New_York"
];

export default function SettingsPage() {
  const { user } = useAuth();
  const canManageCompany = isSuperAdmin(user) || can("settings:manage", user);

  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [companyPrefs, setCompanyPrefs] = useState({
    name: "",
    defaultLocationCapacity: 1,
    timezone: "UTC"
  });

  const { data: companySettings } = useQuery({
    queryKey: ["company-settings-root"],
    queryFn: getCompanySettings,
    enabled: canManageCompany
  });

  useEffect(() => {
    if (user) {
      setProfile((prev) => ({
        ...prev,
        fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "",
        email: user.email || ""
      }));
    }
  }, [user]);

  useEffect(() => {
    if (companySettings) {
      setCompanyPrefs({
        name: companySettings.name,
        defaultLocationCapacity: companySettings.defaultLocationCapacity ?? 1,
        timezone: companySettings.timezone ?? "UTC"
      });
    }
  }, [companySettings]);

  const profileMutation = useMutation({
    mutationFn: () => {
      if (profile.newPassword && profile.newPassword !== profile.confirmPassword) {
        throw new Error("Passwords do not match");
      }
      return updateMe({
        fullName: profile.fullName.trim(),
        email: profile.email.trim(),
        ...(profile.newPassword ? { newPassword: profile.newPassword } : {})
      });
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");
      setProfile((prev) => ({ ...prev, newPassword: "", confirmPassword: "" }));
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update profile")
  });

  const companyMutation = useMutation({
    mutationFn: () =>
      updateCompanySettings({
        name: companyPrefs.name.trim(),
        defaultLocationCapacity: companyPrefs.defaultLocationCapacity,
        timezone: companyPrefs.timezone
      }),
    onSuccess: () => {
      toast.success("Company settings saved");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update company settings")
  });

  return (
    <div className="space-y-6 p-6 pb-16">
      {/* Header Hero Banner */}
      <PageHeaderCard
        title="Settings & System Preferences"
        description="Manage company preferences, security policies, and user profile configuration."
        badge="System Live · Platform Settings"
        icon={Settings}
        showAccessScope={true}
      />

      {/* RMS scope overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Company</span>
            <h3 className="text-base font-bold text-slate-900 mt-1 truncate max-w-[150px]">{companyPrefs.name || "Default Org"}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Building2 className="h-6 w-6" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Timezone</span>
            <h3 className="text-base font-bold text-slate-900 mt-1">{companyPrefs.timezone}</h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Globe className="h-6 w-6" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Role</span>
            <h3 className="text-base font-bold text-slate-900 mt-1">{user?.roleName?.replaceAll('_', ' ') || "USER"}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Shield className="h-6 w-6" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Location Capacity</span>
            <h3 className="text-base font-bold text-slate-900 mt-1">{companyPrefs.defaultLocationCapacity} boxes</h3>
          </div>
          <div className="p-3 bg-violet-50 text-violet-600 rounded-xl"><Clock className="h-6 w-6" /></div>
        </div>
      </div>

      {/* Main Form Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Profile Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b pb-3">
            <User className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">User Security Profile</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <Label className="font-semibold text-slate-700">Full Name</Label>
              <Input
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className="mt-1 h-9 rounded-xl"
              />
            </div>
            <div>
              <Label className="font-semibold text-slate-700">Email Address</Label>
              <Input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="mt-1 h-9 rounded-xl"
              />
            </div>
            <div className="pt-2 border-t space-y-3">
              <Label className="font-bold text-slate-900 flex items-center gap-1.5"><KeyRound className="h-4 w-4 text-amber-500" /> Change Password</Label>
              <div>
                <Label className="text-slate-600">New Password</Label>
                <Input
                  type="password"
                  value={profile.newPassword}
                  onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })}
                  className="mt-1 h-9 rounded-xl"
                  placeholder="Leave blank to keep current"
                />
              </div>
              <div>
                <Label className="text-slate-600">Confirm Password</Label>
                <Input
                  type="password"
                  value={profile.confirmPassword}
                  onChange={(e) => setProfile({ ...profile, confirmPassword: e.target.value })}
                  className="mt-1 h-9 rounded-xl"
                  placeholder="Repeat new password"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t">
            <Button className="rounded-xl text-xs bg-blue-600 hover:bg-blue-700" onClick={() => profileMutation.mutate()}>
              <Save className="h-4 w-4 mr-1.5" /> Save Profile
            </Button>
          </div>
        </div>

        {/* Company Settings Card */}
        {canManageCompany && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b pb-3">
              <Building2 className="h-5 w-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-base">Company Organization Settings</h3>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <Label className="font-semibold text-slate-700">Organization Name</Label>
                <Input
                  value={companyPrefs.name}
                  onChange={(e) => setCompanyPrefs({ ...companyPrefs, name: e.target.value })}
                  className="mt-1 h-9 rounded-xl"
                />
              </div>
              <div>
                <Label className="font-semibold text-slate-700">Default Location Box Capacity</Label>
                <Input
                  type="number"
                  min="1"
                  value={companyPrefs.defaultLocationCapacity}
                  onChange={(e) => setCompanyPrefs({ ...companyPrefs, defaultLocationCapacity: parseInt(e.target.value) || 1 })}
                  className="mt-1 h-9 rounded-xl"
                />
              </div>
              <div>
                <Label className="font-semibold text-slate-700">System Timezone</Label>
                <select
                  value={companyPrefs.timezone}
                  onChange={(e) => setCompanyPrefs({ ...companyPrefs, timezone: e.target.value })}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs bg-slate-50/50"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t">
              <Button className="rounded-xl text-xs bg-indigo-600 hover:bg-indigo-700" onClick={() => companyMutation.mutate()}>
                <Save className="h-4 w-4 mr-1.5" /> Save Company Settings
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
