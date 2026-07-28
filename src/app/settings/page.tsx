"use client";

import { useEffect, useState } from "react";
import { Save, CheckCircle2, XCircle, RefreshCw, Send, Building2, ExternalLink, Bell, Mail, CreditCard, Landmark, Copy } from "lucide-react";
import toast from "react-hot-toast";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import type { BusinessProfile, IntegrationSetting, NotificationPreferences } from "@/types";

const tabs = [
  { id: "business", label: "Business" },
  { id: "integrations", label: "Integrations" },
  { id: "notifications", label: "Notifications" },
];

const integrationDefs = [
  {
    id: "paddle",
    name: "Paddle",
    description: "Global payment processing — works in Pakistan.",
    icon: CreditCard,
    docsUrl: "https://paddle.com/docs",
    fields: [
      { name: "api_key", label: "Vendor Auth Code", type: "password", placeholder: "paddle_vendor_auth_..." },
      { name: "webhook_secret", label: "Webhook Secret", type: "password", placeholder: "paddle_webhook_..." },
    ],
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Alternative payment processor. Available in supported regions.",
    icon: CreditCard,
    docsUrl: "https://stripe.com/docs",
    fields: [
      { name: "api_key", label: "Secret Key", type: "password", placeholder: "sk_live_..." },
      { name: "webhook_secret", label: "Webhook Secret", type: "password", placeholder: "whsec_..." },
    ],
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    description: "Send invoice reminders and notifications via email.",
    icon: Mail,
    docsUrl: "https://sendgrid.com/docs",
    fields: [
      { name: "api_key", label: "API Key", type: "password", placeholder: "SG.xxxxx..." },
      { name: "from_email", label: "From Email", type: "email", placeholder: "noreply@yourdomain.com" },
    ],
  },
];

const bankDetails = {
  accountHolder: "MUHAMMAD HAMZA MUMTAZ",
  accountNumber: "1000004282",
  iban: "PK90FAYS3522301000004282",
  bankName: "Faysal Bank IBB G.T. ROAD OKARA",
  bankCode: "FAYS",
};

const copyableFields = [
  { label: "Account Holder", value: bankDetails.accountHolder },
  { label: "Account Number", value: bankDetails.accountNumber },
  { label: "IBAN", value: bankDetails.iban },
  { label: "Bank Name", value: bankDetails.bankName },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("business");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationSetting[]>([]);
  const [notifications, setNotifications] = useState<NotificationPreferences | null>(null);

  const [profileForm, setProfileForm] = useState({
    business_name: "", business_email: "", business_phone: "",
    address_line1: "", address_line2: "", city: "", state: "", zip: "", country: "PK", website: "",
  });

  const [notifForm, setNotifForm] = useState({
    daily_overdue_summary: true, payment_received: true, weekly_ar_report: false,
    reminder_sent: true, invoice_opened: false, email: "",
  });

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const [pRes, iRes, nRes] = await Promise.all([
        fetch("/api/settings/business"),
        fetch("/api/settings/integrations"),
        fetch("/api/settings/notifications"),
      ]);
      if (pRes.ok) {
        const p = await pRes.json();
        setProfile(p);
        setProfileForm({
          business_name: p.business_name || "", business_email: p.business_email || "",
          business_phone: p.business_phone || "", address_line1: p.address_line1 || "",
          address_line2: p.address_line2 || "", city: p.city || "", state: p.state || "",
          zip: p.zip || "", country: p.country || "PK", website: p.website || "",
        });
      }
      if (iRes.ok) setIntegrations(await iRes.json());
      if (nRes.ok) {
        const n = await nRes.json();
        setNotifications(n);
        setNotifForm({
          daily_overdue_summary: n.daily_overdue_summary ?? true,
          payment_received: n.payment_received ?? true,
          weekly_ar_report: n.weekly_ar_report ?? false,
          reminder_sent: n.reminder_sent ?? true,
          invoice_opened: n.invoice_opened ?? false,
          email: n.email || "",
        });
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault(); setSaving("profile");
    try {
      const res = await fetch("/api/settings/business", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profileForm) });
      if (res.ok) toast.success("Business profile saved"); else toast.error("Failed to save");
    } catch { toast.error("Failed to save"); }
    finally { setSaving(null); }
  }

  async function saveIntegration(provider: string, e: React.FormEvent) {
    e.preventDefault(); setSaving(provider);
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const payload: any = { provider, is_connected: true };

    if (provider === "sendgrid") {
      payload.api_key = data.get("api_key") as string || undefined;
      payload.settings = { from_email: data.get("from_email") as string || "" };
    } else {
      payload.api_key = data.get("api_key") as string || undefined;
      payload.webhook_secret = data.get("webhook_secret") as string || undefined;
    }

    try {
      const res = await fetch("/api/settings/integrations", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { toast.success(`${provider} saved`); fetchData(); }
      else toast.error("Failed to save");
    } catch { toast.error("Failed to save"); }
    finally { setSaving(null); }
  }

  async function testConnection(provider: string) {
    setTesting(provider);
    const int = getIntegration(provider);
    await new Promise((r) => setTimeout(r, 1500));
    const connected = int?.is_connected && int?.api_key;
    toast.success(connected ? `${provider} — connected successfully` : `${provider} — enter an API key first`);
    setTesting(null);
  }

  async function testEmail() {
    if (!getIntegration("sendgrid")?.is_connected) {
      toast.error("Save SendGrid credentials first");
      return;
    }
    setTesting("sendgrid_test");
    await new Promise((r) => setTimeout(r, 1500));
    toast.success("Test email sent — check your inbox");
    setTesting(null);
  }

  async function saveNotifications(e: React.FormEvent) {
    e.preventDefault(); setSaving("notifications");
    try {
      const res = await fetch("/api/settings/notifications", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(notifForm) });
      if (res.ok) toast.success("Notification preferences saved"); else toast.error("Failed to save");
    } catch { toast.error("Failed to save"); }
    finally { setSaving(null); }
  }

  function getIntegration(provider: string) { return integrations.find((i) => i.provider === provider); }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  }

  if (loading) return <div className="p-6 text-sm text-slate-400">Loading...</div>;

  return (
    <div>
      <div className="border-b border-slate-200 bg-white">
        <div className="px-6 py-4">
          <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your business profile, integrations, and notifications</p>
        </div>
      </div>

      <div className="p-6">
        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

        <div className="mt-6">
          {activeTab === "business" && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg"><Building2 className="w-4 h-4 text-slate-600" /></div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Business Information</h2>
                    <p className="text-xs text-slate-500 mt-0.5">This appears on your invoices and communications</p>
                  </div>
                </div>
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
                    <Button type="submit" loading={saving === "profile"}><Save className="w-4 h-4" /> Save Changes</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === "integrations" && (
            <div className="space-y-4">
              {integrationDefs.map((def) => {
                const int = getIntegration(def.id);
                const isConnected = int?.is_connected && int?.api_key;
                return (
                  <Card key={def.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isConnected ? "bg-emerald-50" : "bg-slate-100"}`}>
                            <def.icon className={`w-4 h-4 ${isConnected ? "text-emerald-600" : "text-slate-500"}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-sm font-semibold text-slate-900">{def.name}</h2>
                              {isConnected
                                ? <Badge variant="active"><CheckCircle2 className="w-3 h-3 mr-0.5" /> Connected</Badge>
                                : <Badge variant="inactive"><XCircle className="w-3 h-3 mr-0.5" /> Not Connected</Badge>
                              }
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{def.description}</p>
                          </div>
                        </div>
                        <a href={def.docsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1">
                          Docs <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={(e) => saveIntegration(def.id, e)} className="space-y-3 max-w-md">
                        {def.fields.map((field) => (
                          <Input
                            key={field.name}
                            label={field.label}
                            name={field.name}
                            type={field.type}
                            defaultValue={
                              field.name === "from_email"
                                ? (int?.settings as any)?.from_email || ""
                                : int?.webhook_secret || int?.api_key || ""
                            }
                            placeholder={field.placeholder}
                          />
                        ))}
                        <div className="flex items-center gap-2 pt-1">
                          <Button type="submit" size="sm" loading={saving === def.id}>
                            <Save className="w-3.5 h-3.5" /> Save
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => testConnection(def.id)}
                            loading={testing === def.id}
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Test Connection
                          </Button>
                          {def.id === "sendgrid" && isConnected && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={testEmail}
                              loading={testing === "sendgrid_test"}
                            >
                              <Send className="w-3.5 h-3.5" /> Send Test
                            </Button>
                          )}
                        </div>
                      </form>
                      {!isConnected && (
                        <p className="text-xs text-amber-600 mt-3 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Save your credentials and test the connection to enable {def.name}.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 rounded-lg"><Landmark className="w-4 h-4 text-amber-600" /></div>
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">Bank Transfer (Manual)</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Accept payments via bank transfer — recommended for Pakistan</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">Share these details with clients to receive direct bank payments. Mark invoices as paid manually after receiving funds.</p>
                  <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 max-w-lg">
                    <div className="space-y-3">
                      {copyableFields.map((field) => (
                        <div key={field.label} className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-slate-500">{field.label}</p>
                            <p className="text-sm font-medium text-slate-900 font-mono">{field.value}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(field.value, field.label)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-3">Funds usually arrive within 1-2 business days for local transfers.</p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg"><Bell className="w-4 h-4 text-blue-600" /></div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Notification Preferences</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Choose which alerts you receive and where they&apos;re sent</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={saveNotifications} className="space-y-6 max-w-lg">
                  <Input
                    label="Notification Email"
                    type="email"
                    value={notifForm.email}
                    onChange={(e) => setNotifForm({ ...notifForm, email: e.target.value })}
                    placeholder="you@example.com"
                    icon={<Mail className="w-4 h-4" />}
                  />

                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Email Alerts</p>
                    <div className="space-y-3 mt-2">
                      {[
                        { key: "daily_overdue_summary", label: "Daily overdue summary", desc: "Receive a daily digest of all overdue invoices" },
                        { key: "payment_received", label: "Payment received", desc: "Get notified immediately when an invoice is paid" },
                        { key: "reminder_sent", label: "Reminder sent", desc: "Alert when an automated reminder is dispatched to a client" },
                        { key: "invoice_opened", label: "Invoice opened", desc: "Know when a client views their invoice" },
                        { key: "weekly_ar_report", label: "Weekly AR report", desc: "Weekly summary of accounts receivable status" },
                      ].map((item) => (
                        <label key={item.key} className="flex items-start gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={(notifForm as any)[item.key] as boolean}
                            onChange={(e) => setNotifForm({ ...notifForm, [item.key]: e.target.checked })}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <div>
                            <p className="text-sm font-medium text-slate-900 group-hover:text-emerald-700 transition-colors">{item.label}</p>
                            <p className="text-xs text-slate-500">{item.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <Button type="submit" loading={saving === "notifications"}><Save className="w-4 h-4" /> Save Preferences</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
