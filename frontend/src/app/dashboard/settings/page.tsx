"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { signOut } from "next-auth/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  User,
  Mail,
  Shield,
  Bell,
  Palette,
  Server,
  Key,
  LogOut,
  Save,
  CheckCircle2,
  AlertCircle,
  Database,
  Cpu,
  Wifi,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("matcraft_notifications");
      if (stored) return JSON.parse(stored);
    }
    return { campaignComplete: true, campaignFailed: true, weeklyReport: false };
  });

  // Fetch full health status from backend
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ["health-full"],
    queryFn: () => api.system.healthFull(),
    refetchInterval: 30000,
  });

  // Fetch system info
  const { data: sysInfo } = useQuery({
    queryKey: ["system-info"],
    queryFn: () => api.system.info(),
  });

  // Profile update mutation
  const profileMutation = useMutation({
    mutationFn: (data: { full_name?: string }) => api.users.updateProfile(data),
    onSuccess: () => {
      setSaved(true);
      setSaveError(null);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (err: Error) => {
      setSaveError(err.message);
    },
  });

  const handleSave = () => {
    // Persist notification preferences to localStorage
    localStorage.setItem("matcraft_notifications", JSON.stringify(notifications));

    // Update profile if name changed
    const newName = fullName ?? user?.name ?? "";
    if (newName !== (user?.name || "")) {
      profileMutation.mutate({ full_name: newName });
    } else {
      setSaved(true);
      setSaveError(null);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const displayName = fullName ?? user?.name ?? "";

  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </motion.div>

      {/* Profile */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-4 w-4 text-blue-500" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {(displayName || user?.email || "U")[0].toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {displayName || "User"}
                </h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {user?.email || "No email"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue={user?.email || ""}
                  className="w-full px-4 py-2.5 border rounded-xl bg-gray-50 text-muted-foreground cursor-not-allowed"
                  disabled
                />
              </div>
            </div>
            {saveError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {saveError}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-500" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                key: "campaignComplete" as const,
                label: "Campaign Completed",
                desc: "Get notified when a campaign finishes",
              },
              {
                key: "campaignFailed" as const,
                label: "Campaign Failed",
                desc: "Get notified when a campaign fails",
              },
              {
                key: "weeklyReport" as const,
                label: "Weekly Report",
                desc: "Receive a weekly summary of your campaigns",
              },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={notifications[item.key]}
                    onChange={(e) =>
                      setNotifications((n: typeof notifications) => ({
                        ...n,
                        [item.key]: e.target.checked,
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-blue-500 transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
                </div>
              </label>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* System Status - Real data */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="h-4 w-4 text-emerald-500" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {healthLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Backend API</span>
                  </div>
                  <Badge variant={health ? "completed" : "failed"}>
                    {health ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm">Database</span>
                      {health?.database?.campaigns != null && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({health.database.campaigns} campaigns, {health.database.materials} materials)
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant={health?.database?.connected ? "completed" : "failed"}>
                    {health?.database?.connected ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Wifi className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Redis</span>
                  </div>
                  <Badge variant={health?.redis?.connected ? "completed" : "failed"}>
                    {health?.redis?.connected ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm">Celery Workers</span>
                      {health?.celery?.workers != null && health.celery.workers > 0 && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({health.celery.workers} active)
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant={health?.celery?.connected ? "completed" : "failed"}>
                    {health?.celery?.connected ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">MATERIA Engine</span>
                  </div>
                  <Badge variant="secondary">
                    v{sysInfo?.engine_version || health?.engine?.version || "..."}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Authentication</span>
                  </div>
                  <Badge variant={user ? "completed" : "failed"}>
                    {user ? "Authenticated" : "Not authenticated"}
                  </Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* API Keys */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="h-4 w-4 text-purple-500" />
              API Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-purple-50 border border-purple-100">
              <p className="text-sm text-purple-800">
                API access is available on the Lab Pro plan and above.
                Generate API keys to interact with MATERIA programmatically.
              </p>
              <Button variant="outline" size="sm" className="mt-3" disabled>
                Generate API Key
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex items-center justify-between"
      >
        <Button
          variant="outline"
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>

        <Button
          variant="gradient"
          onClick={handleSave}
          disabled={profileMutation.isPending}
        >
          {profileMutation.isPending ? (
            <>
              <Cpu className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Saved
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
}
