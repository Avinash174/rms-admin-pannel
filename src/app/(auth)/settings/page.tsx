"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building2,
  Loader2,
  Lock,
  Server,
  Settings,
  Shield,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const queryClient = useQueryClient();
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

  const { data: companySettings, isLoading } = useQuery({
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
      toast.success("Profile updated");
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
      toast.success("Company preferences saved");
      queryClient.invalidateQueries({ queryKey: ["company-settings-root"] });
    },
    onError: () => toast.error("Failed to save company preferences")
  });

  if (isLoading && canManageCompany) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-0 pb-12">
      <div>
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Manage your profile and company preferences.
        </p>
      </div>

      <section className="bg-white rounded-2xl border p-6 space-y-5">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900">My Profile</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={profile.fullName}
              onChange={(e) => setProfile((prev) => ({ ...prev, fullName: e.target.value }))}
              className="mt-1 rounded-xl"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
              className="mt-1 rounded-xl"
            />
          </div>
          <div>
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              value={profile.newPassword}
              onChange={(e) => setProfile((prev) => ({ ...prev, newPassword: e.target.value }))}
              className="mt-1 rounded-xl"
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={profile.confirmPassword}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, confirmPassword: e.target.value }))
              }
              className="mt-1 rounded-xl"
            />
          </div>
        </div>

        <Button
          onClick={() => profileMutation.mutate()}
          disabled={profileMutation.isPending}
          className="rounded-xl"
        >
          {profileMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Lock className="w-4 h-4 mr-2" />
          )}
          Save profile
        </Button>
      </section>

      {canManageCompany && (
        <section className="bg-white rounded-2xl border p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Company Preferences</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="companyName">Company name</Label>
              <Input
                id="companyName"
                value={companyPrefs.name}
                onChange={(e) =>
                  setCompanyPrefs((prev) => ({ ...prev, name: e.target.value }))
                }
                className="mt-1 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="capacity">Default location capacity (1–99)</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                max={99}
                value={companyPrefs.defaultLocationCapacity}
                onChange={(e) =>
                  setCompanyPrefs((prev) => ({
                    ...prev,
                    defaultLocationCapacity: Number(e.target.value)
                  }))
                }
                className="mt-1 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="timezone">Display timezone</Label>
              <select
                id="timezone"
                value={companyPrefs.timezone}
                onChange={(e) =>
                  setCompanyPrefs((prev) => ({ ...prev, timezone: e.target.value }))
                }
                className="mt-1 h-10 w-full rounded-xl border px-3 text-sm"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            onClick={() => companyMutation.mutate()}
            disabled={companyMutation.isPending}
            className="rounded-xl"
          >
            {companyMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Building2 className="w-4 h-4 mr-2" />
            )}
            Save company preferences
          </Button>
        </section>
      )}

      {isSuperAdmin(user) && (
        <section className="bg-white rounded-2xl border p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-violet-600" />
            <h2 className="text-lg font-bold text-slate-900">Super Admin Panel</h2>
          </div>
          <div className="rounded-xl border border-dashed border-slate-200 p-6 bg-slate-50">
            <div className="flex items-start gap-3">
              <Server className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-800">Phase 2 placeholder</p>
                <p className="text-sm text-slate-500 mt-1">
                  System-wide metrics (total companies, users, operations) will appear here in a
                  future release.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
