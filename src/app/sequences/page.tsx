"use client";

import { useEffect, useState } from "react";
import { Plus, Repeat, PauseCircle, PlayCircle, Settings2, Trash2, Edit3, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Sequence, SequenceStep } from "@/types";

export default function SequencesPage() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [stepModalOpen, setStepModalOpen] = useState(false);
  const [selectedSeq, setSelectedSeq] = useState<Sequence | null>(null);
  const [editingStep, setEditingStep] = useState<SequenceStep | null>(null);
  const [form, setForm] = useState({ name: "", description: "", applies_to_status: "sent" });
  const [editForm, setEditForm] = useState({ name: "", description: "", applies_to_status: "sent" });
  const [stepForm, setStepForm] = useState({ step_number: 1, delay_days: 3, subject: "", body_text: "", action: "send_email" });
  const [submitting, setSubmitting] = useState(false);

  const fetchSequences = async () => {
    try { const res = await fetch("/api/sequences"); if (res.ok) setSequences(await res.json()); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSequences(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); if (!form.name) { toast.error("Name is required"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/sequences", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success("Sequence created"); setCreateOpen(false); setForm({ name: "", description: "", applies_to_status: "sent" }); fetchSequences();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setSubmitting(false); }
  }

  function openEdit(seq: Sequence) {
    setSelectedSeq(seq);
    setEditForm({ name: seq.name, description: seq.description || "", applies_to_status: seq.applies_to_status });
    setEditOpen(true);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault(); if (!selectedSeq || !editForm.name) { toast.error("Name is required"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/sequences/${selectedSeq.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
      if (!res.ok) throw new Error("Failed");
      toast.success("Sequence updated"); setEditOpen(false); fetchSequences();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setSubmitting(false); }
  }

  async function toggleActive(seq: Sequence) {
    try { const res = await fetch(`/api/sequences/${seq.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_active: !seq.is_active }) }); if (res.ok) fetchSequences(); }
    catch { toast.error("Failed to toggle"); }
  }

  async function deleteSequence(id: string) {
    try { const res = await fetch(`/api/sequences/${id}`, { method: "DELETE" }); if (res.ok) { toast.success("Sequence deleted"); fetchSequences(); } }
    catch { toast.error("Failed to delete"); }
  }

  async function saveStep(e: React.FormEvent) {
    e.preventDefault(); if (!selectedSeq) return; setSubmitting(true);
    try {
      const url = editingStep ? `/api/sequence-steps/${editingStep.id}` : `/api/sequences/${selectedSeq.id}/steps`;
      const method = editingStep ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(stepForm) });
      if (!res.ok) throw new Error("Failed");
      toast.success(editingStep ? "Step updated" : "Step added"); setStepModalOpen(false); setEditingStep(null);
      setStepForm({ step_number: 1, delay_days: 3, subject: "", body_text: "", action: "send_email" }); fetchSequences();
    } catch { toast.error("Failed to save step"); }
    finally { setSubmitting(false); }
  }

  function openStepEditor(seq: Sequence, step?: SequenceStep) {
    setSelectedSeq(seq);
    if (step) {
      setEditingStep(step); setStepForm({ step_number: step.step_number, delay_days: step.delay_days, subject: step.subject, body_text: step.body_text, action: step.action });
    } else {
      setEditingStep(null); setStepForm({ step_number: (seq.steps?.length || 0) + 1, delay_days: 3, subject: "", body_text: "", action: "send_email" });
    }
    setStepModalOpen(true);
  }

  return (
    <div className="animate-fade-in">
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--fg)]">Sequences</h1>
            <p className="text-sm text-[var(--fg-muted)] mt-0.5">Automated reminder escalation workflows</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="w-4 h-4" />
            New Sequence
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}><CardContent><div className="h-20 bg-slate-100 rounded animate-pulse" /></CardContent></Card>
            ))}
          </div>
        ) : sequences.length === 0 ? (
          <Card>
            <EmptyState title="No sequences yet" description="Create automated reminder sequences for overdue invoices." icon={<Repeat className="w-6 h-6 text-slate-400" />} action={{ label: "Create Sequence", onClick: () => setCreateOpen(true) }} />
          </Card>
        ) : (
          <div className="space-y-3">
            {sequences.map((seq) => (
              <Card key={seq.id}>
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-sm font-semibold text-[var(--fg)]">{seq.name}</h3>
                        <Badge variant={seq.is_active ? "active" : "inactive"}>{seq.is_active ? "Active" : "Paused"}</Badge>
                      </div>
                      {seq.description && <p className="text-sm text-[var(--fg-muted)] mt-1">{seq.description}</p>}
                      <p className="text-xs text-[var(--fg-muted)] mt-1.5 flex items-center gap-1">
                        <span className="font-medium">Applies to:</span> {seq.applies_to_status === "sent" ? "Sent invoices" : "Overdue invoices"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-4 shrink-0">
                      <button onClick={() => toggleActive(seq)} className="p-2 rounded-lg text-[var(--fg-muted)] hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title={seq.is_active ? "Pause" : "Activate"}>
                        {seq.is_active ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                      </button>
                      <button onClick={() => openEdit(seq)} className="p-2 rounded-lg text-[var(--fg-muted)] hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => openStepEditor(seq)} className="p-2 rounded-lg text-[var(--fg-muted)] hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Manage steps">
                        <Settings2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteSequence(seq.id)} className="p-2 rounded-lg text-[var(--fg-muted)] hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {seq.steps && seq.steps.length > 0 && (
                    <div className="mt-4 flex items-center gap-1.5 flex-wrap">
                      {seq.steps.sort((a, b) => a.step_number - b.step_number).map((step, i, arr) => (
                        <div key={step.id} className="flex items-center gap-1.5">
                          <button
                            onClick={() => openStepEditor(seq, step)}
                            className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-[var(--fg-muted)] hover:border-emerald-300 hover:bg-emerald-50/60 hover:text-emerald-700 transition-all shadow-sm"
                          >
                            <span className="font-semibold text-slate-400 group-hover:text-emerald-500">#{step.step_number}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300 group-hover:bg-emerald-400" />
                            <span>{step.delay_days}d</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300 group-hover:bg-emerald-400" />
                            <span className="max-w-[100px] truncate">{step.subject}</span>
                          </button>
                          {i < arr.length - 1 && (
                            <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3">
                    <button
                      onClick={() => openStepEditor(seq)}
                      className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add step
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Sequence" size="lg">
        <form onSubmit={handleCreate} className="space-y-6">
          <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Repeat className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900">Sequence Basics</p>
                <p className="text-xs text-emerald-600">Name your workflow and choose when it triggers</p>
              </div>
            </div>
            <div className="space-y-4">
              <Input label="Sequence Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Standard Reminder Flow" required />
              <Input label="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Friendly reminder at 3 days, escalate at 7…" />
              <Select label="Trigger On" value={form.applies_to_status} onChange={(e) => setForm({ ...form, applies_to_status: e.target.value })} options={[{ value: "sent", label: "When invoice is sent" }, { value: "overdue", label: "When invoice becomes overdue" }]} />
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <p className="text-xs font-medium text-amber-700 uppercase tracking-wider">Tip</p>
            </div>
            <p className="text-xs text-[var(--fg-muted)] leading-relaxed">
              You can add reminder steps after creating the sequence. Each step sends an email after a set delay.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}><Plus className="w-4 h-4" />Create Sequence</Button>
          </div>
        </form>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Sequence" size="md">
        <form onSubmit={handleEdit} className="space-y-5">
          <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-100">
            <Input label="Sequence Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="e.g. Standard Reminder Flow" required />
            <div className="mt-4">
              <Input label="Description (optional)" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Friendly reminder at 3 days, escalate at 7…" />
            </div>
            <div className="mt-4">
              <Select label="Trigger On" value={editForm.applies_to_status} onChange={(e) => setEditForm({ ...editForm, applies_to_status: e.target.value })} options={[{ value: "sent", label: "When invoice is sent" }, { value: "overdue", label: "When invoice becomes overdue" }]} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}><Edit3 className="w-4 h-4" />Save Changes</Button>
          </div>
        </form>
      </Modal>

      <Modal open={stepModalOpen} onClose={() => { setStepModalOpen(false); setEditingStep(null); }} title={editingStep ? "Edit Step" : "Add Step"} size="lg">
        <form onSubmit={saveStep} className="space-y-6">
          <div className="bg-indigo-50/60 rounded-xl p-4 border border-indigo-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-indigo-900">Step Configuration</p>
                <p className="text-xs text-indigo-600">Order, timing, and action</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Step #" type="number" value={String(stepForm.step_number)} onChange={(e) => setStepForm({ ...stepForm, step_number: parseInt(e.target.value) || 1 })} min={1} hint="Position in sequence" />
              <Input label="Delay (days)" type="number" value={String(stepForm.delay_days)} onChange={(e) => setStepForm({ ...stepForm, delay_days: parseInt(e.target.value) || 3 })} min={1} hint="After invoice due date" />
              <Select label="Action" value={stepForm.action} onChange={(e) => setStepForm({ ...stepForm, action: e.target.value })} options={[
                { value: "send_email", label: "Send email" },
                { value: "mark_overdue", label: "Mark overdue" },
                { value: "send_email_and_mark_overdue", label: "Email & mark overdue" },
              ]} />
            </div>
          </div>

          <div className="bg-violet-50/60 rounded-xl p-4 border border-violet-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-violet-900">Email Content</p>
                <p className="text-xs text-violet-600">What the client will receive</p>
              </div>
            </div>
            <Input label="Subject Line" value={stepForm.subject} onChange={(e) => setStepForm({ ...stepForm, subject: e.target.value })} placeholder="Gentle reminder: Invoice is due" required />
            <div className="mt-4">
              <label className="block text-sm font-medium text-[var(--fg)] mb-1.5">Email Body</label>
              <textarea value={stepForm.body_text} onChange={(e) => setStepForm({ ...stepForm, body_text: e.target.value })} rows={5} className="block w-full rounded-[var(--radius-sm)] border border-slate-300 bg-white px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" placeholder={"Hi {{client_name}},\n\nThis is a reminder about your invoice of ${{amount}}.\n\nPay here: {{payment_link}}\n\nThanks!"} required />
              <div className="flex items-center gap-2 mt-2">
                <div className="px-2 py-0.5 bg-violet-100 rounded text-xs text-violet-700 font-mono">{'{{client_name}}'}</div>
                <span className="text-xs text-[var(--fg-muted)]">Client name</span>
                <div className="px-2 py-0.5 bg-violet-100 rounded text-xs text-violet-700 font-mono">{'{{amount}}'}</div>
                <span className="text-xs text-[var(--fg-muted)]">Invoice amount</span>
                <div className="px-2 py-0.5 bg-violet-100 rounded text-xs text-violet-700 font-mono">{'{{payment_link}}'}</div>
                <span className="text-xs text-[var(--fg-muted)]">Payment link</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="secondary" onClick={() => { setStepModalOpen(false); setEditingStep(null); }}>Cancel</Button>
            <Button type="submit" loading={submitting}><Plus className="w-4 h-4" />{editingStep ? "Save Step" : "Add Step"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
