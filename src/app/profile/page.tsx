"use client";

import { useEffect, useState } from "react";
import { User, Mail, Globe, Clock, Save } from "lucide-react";
import toast from "react-hot-toast";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { User as UserType } from "@/types";

const timezones = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Europe/London", "Europe/Berlin", "Europe/Paris", "Asia/Tokyo", "Asia/Shanghai", "Asia/Kolkata", "Australia/Sydney",
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", business_name: "", email: "", timezone: "UTC" });

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setForm({
          full_name: data.full_name || "",
          business_name: data.business_name || "",
          email: data.email || "",
          timezone: data.timezone || "UTC",
        });
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name,
          business_name: form.business_name,
          timezone: form.timezone,
        }),
      });
      if (res.ok) toast.success("Profile updated");
      else toast.error("Failed to update");
    } catch { toast.error("Failed to update"); }
    finally { setSaving(false); }
  }

  if (loading) {
    return <div className="p-6 text-sm text-slate-400">Loading...</div>;
  }

  return (
    <div>
      <div className="border-b border-slate-200 bg-white">
        <div className="px-6 py-4">
          <h1 className="text-xl font-semibold text-slate-900">Profile</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your personal account information</p>
        </div>
      </div>

      <div className="p-6 max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-900">Account Details</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-xl font-bold text-white">
                    {form.full_name ? form.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "BC"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{form.full_name || "Your Name"}</p>
                  <p className="text-sm text-slate-500">{form.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  icon={<User className="w-4 h-4" />}
                  placeholder="Jane Doe"
                />
                <Input
                  label="Email"
                  value={form.email}
                  disabled
                  icon={<Mail className="w-4 h-4" />}
                />
                <Input
                  label="Business Name"
                  value={form.business_name}
                  onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                  icon={<Globe className="w-4 h-4" />}
                  placeholder="My Business LLC"
                />
                <Select
                  label="Timezone"
                  value={form.timezone}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  options={timezones.map((tz) => ({ value: tz, label: tz }))}
                />
              </div>

              <div className="pt-2">
                <Button type="submit" loading={saving}>
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-900">Plan Details</h2>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">Current Plan</p>
                <p className="text-sm text-slate-500 mt-0.5">Free</p>
              </div>
              <Button variant="primary" size="sm" onClick={() => window.location.href = "/plans"}>Upgrade</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
