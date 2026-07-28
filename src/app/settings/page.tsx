"use client";

import { useEffect, useState } from "react";
import { Building2, Mail, Key, Webhook, CheckCircle2, XCircle, Save, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import type { BusinessProfile, IntegrationSetting } from "@/types";

const tabs = [
  { id: "business", label: "Business Profile" },
  { id: "integrations", label: "Integrations" },
  { id: "notifications", label: "Notifications" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("business");
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profileForm, setProfileForm] = useState({
    business_name: "",
    business_email: "",
    business_phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
    website: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [profileRes, intRes] = await Promise.all([
        fetch("/api/settings/business"),
        fetch("/api/settings/integrations"),
      ]);
      if (profileRes.ok) {
        const p = await profileRes.json();
        setProfile(p);
        setProfileForm({
          business_name: p.business_name || "",
          business_email: p.business_email || "",
          business_phone: p.business_phone || "",
          address_line1: p.address_line1 || "",
          address_line2: p.address_line2 || "",
          city: p.city || "",
          state: p.state || "",
          zip: p.zip || "",
          country: p.country || "US",
          website: p.website || "",
        });
      }
      if (intRes.ok) setIntegrations(await intRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      if (res.ok) toast.success("Business profile saved");
      else toast.error("Failed to save");
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  }

  async function saveIntegration(provider: string, e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/settings/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          api_key: data.get("api_key") || undefined,
          webhook_secret: data.get("webhook_secret") || undefined,
          is_connected: true,
        }),
      });
      if (res.ok) {
        toast.success(`${provider} integration saved`);
        fetchData();
      } else toast.error("Failed to save");
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  }

  function getIntegration(provider: string) {
    return integrations.find((i) => i.provider === provider);
  }

  if (loading) {
    return <div className="p-6 text-sm text-slate-400">Loading...</div>;
  }

  return (
    <div>
      <div className="border-b border-slate-200 bg-white">
        <div className="px-6 py-4">
          <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your account and integrations</p>
        </div>
      </div>

      <div className="p-6">
        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

        <div className="mt-6">
          {activeTab === "business" && (
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-slate-900">Business Information</h2>
                <p className="text-xs text-slate-500 mt-0.5">This appears on your invoices and communications</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={saveProfile} className="space-y-4 max-w-2xl">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Business Name" value={profileForm.business_name} onChange={(e) => setProfileForm({ ...profileForm, business_name: e.target.value })} />
                    <Input label="Business Email" type="email" value={profileForm.business_email} onChange={(e) => setProfileForm({ ...profileForm, business_email: e.target.value })} />
                    <Input label="Phone" value={profileForm.business_phone} onChange={(e) => setProfileForm({ ...profileForm, business_phone: e.target.value })} />
                    <Input label="Website" value={profileForm.website} onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })} />
                  </div>
                  <Input label="Address Line 1" value={profileForm.address_line1} onChange={(e) => setProfileForm({ ...profileForm, address_line1: e.target.value })} />
                  <Input label="Address Line 2" value={profileForm.address_line2} onChange={(e) => setProfileForm({ ...profileForm, address_line2: e.target.value })} />
                  <div className="grid grid-cols-3 gap-4">
                    <Input label="City" value={profileForm.city} onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })} />
                    <Input label="State" value={profileForm.state} onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })} />
                    <Input label="ZIP Code" value={profileForm.zip} onChange={(e) => setProfileForm({ ...profileForm, zip: e.target.value })} />
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
          )}

          {activeTab === "integrations" && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">Stripe</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Process payments and sync invoice status automatically</p>
                    </div>
                    <Badge variant={getIntegration("stripe")?.is_connected ? "active" : "inactive"}>
                      {getIntegration("stripe")?.is_connected ? "Connected" : "Not Connected"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => saveIntegration("stripe", e)} className="space-y-3 max-w-md">
                    <Input label="Secret Key" name="api_key" type="password" defaultValue={getIntegration("stripe")?.api_key || ""} placeholder="sk_live_..." />
                    <Input label="Webhook Secret" name="webhook_secret" type="password" defaultValue={getIntegration("stripe")?.webhook_secret || ""} placeholder="whsec_..." />
                    <Button type="submit" size="sm" loading={saving}>Save Stripe Keys</Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">SendGrid</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Send email reminders to your clients</p>
                    </div>
                    <Badge variant={getIntegration("sendgrid")?.is_connected ? "active" : "inactive"}>
                      {getIntegration("sendgrid")?.is_connected ? "Connected" : "Not Connected"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => saveIntegration("sendgrid", e)} className="space-y-3 max-w-md">
                    <Input label="API Key" name="api_key" type="password" defaultValue={getIntegration("sendgrid")?.api_key || ""} placeholder="SG.xxxxx..." />
                    <Input label="From Email" name="webhook_secret" defaultValue={(getIntegration("sendgrid")?.settings as any)?.from_email || ""} placeholder="noreply@yourdomain.com" />
                    <Button type="submit" size="sm" loading={saving}>Save SendGrid Key</Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-slate-900">Notification Preferences</h2>
                <p className="text-xs text-slate-500 mt-0.5">Configure when you receive alerts</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-w-lg">
                  {[
                    { label: "Daily summary of overdue invoices", desc: "Receive a daily digest of overdue accounts" },
                    { label: "Payment received notifications", desc: "Get alerted when an invoice is paid" },
                    { label: "Low balance alerts", desc: "Notify when Stripe balance is running low" },
                    { label: "Weekly AR report", desc: "Weekly summary of accounts receivable" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <input type="checkbox" defaultChecked className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2">
                    <Button size="sm">Save Preferences</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
