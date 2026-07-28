"use client";

import { useEffect, useState } from "react";
import { Plus, Repeat, PauseCircle, PlayCircle, Settings2, Trash2, GripVertical } from "lucide-react";
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
  const [stepForm, setStepForm] = useState({ step_number: 1, delay_days: 3, subject: "", body_text: "", action: "send_email" });
  const [submitting, setSubmitting] = useState(false);

  const fetchSequences = async () => {
    try {
      const res = await fetch("/api/sequences");
      if (res.ok) setSequences(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSequences(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) { toast.error("Name is required"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/sequences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success("Sequence created");
      setCreateOpen(false);
      setForm({ name: "", description: "", applies_to_status: "sent" });
      fetchSequences();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setSubmitting(false); }
  }

  async function toggleActive(seq: Sequence) {
    try {
      const res = await fetch(`/api/sequences/${seq.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !seq.is_active }),
      });
      if (res.ok) fetchSequences();
    } catch { toast.error("Failed to toggle"); }
  }

  async function deleteSequence(id: string) {
    try {
      const res = await fetch(`/api/sequences/${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Sequence deleted"); fetchSequences(); }
    } catch { toast.error("Failed to delete"); }
  }

  async function saveStep(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSeq) return;
    setSubmitting(true);
    try {
      const url = editingStep
        ? `/api/sequence-steps/${editingStep.id}`
        : `/api/sequences/${selectedSeq.id}/steps`;
      const method = editingStep ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stepForm),
      });

      if (!res.ok) throw new Error("Failed to save step");
      toast.success(editingStep ? "Step updated" : "Step added");
      setStepModalOpen(false);
      setEditingStep(null);
      setStepForm({ step_number: 1, delay_days: 3, subject: "", body_text: "", action: "send_email" });
      fetchSequences();
    } catch { toast.error("Failed to save step"); }
    finally { setSubmitting(false); }
  }

  function openStepEditor(seq: Sequence, step?: SequenceStep) {
    setSelectedSeq(seq);
    if (step) {
      setEditingStep(step);
      setStepForm({
        step_number: step.step_number,
        delay_days: step.delay_days,
        subject: step.subject,
        body_text: step.body_text,
        action: step.action,
      });
    } else {
      setEditingStep(null);
      setStepForm({
        step_number: (seq.steps?.length || 0) + 1,
        delay_days: 3,
        subject: "",
        body_text: "",
        action: "send_email",
      });
    }
    setStepModalOpen(true);
  }

  return (
    <div>
      <div className="border-b border-slate-200 bg-white">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Sequences</h1>
            <p className="text-sm text-slate-500 mt-0.5">Automated reminder escalation workflows</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="w-4 h-4" />
            New Sequence
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
          {loading ? "" : `${sequences.length} sequence${sequences.length !== 1 ? "s" : ""}`}
        </p>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}><CardContent><div className="h-16 bg-slate-100 rounded animate-pulse" /></CardContent></Card>
            ))}
          </div>
        ) : sequences.length === 0 ? (
          <Card>
            <EmptyState
              title="No sequences yet"
              description="Create automated reminder sequences for overdue invoices."
              action={{ label: "Create Sequence", onClick: () => setCreateOpen(true) }}
              icon={<Repeat className="w-6 h-6 text-slate-400" />}
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {sequences.map((seq) => (
              <Card key={seq.id}>
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">{seq.name}</h3>
                        <Badge variant={seq.is_active ? "active" : "inactive"}>{seq.is_active ? "Active" : "Paused"}</Badge>
                      </div>
                      {seq.description && <p className="text-sm text-slate-500 mt-1">{seq.description}</p>}
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <button onClick={() => toggleActive(seq)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50">
                        {seq.is_active ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                      </button>
                      <button onClick={() => { setSelectedSeq(seq); openStepEditor(seq); }} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50">
                        <Settings2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteSequence(seq.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                          {seq.steps && seq.steps.length > 0 && (
                    <div className="mt-4 flex items-center gap-2 flex-wrap">
                      {seq.steps.sort((a, b) => a.step_number - b.step_number).map((step, i, arr) => (
                        <div key={step.id} className="flex items-center gap-2">
                          <button
                            onClick={() => openStepEditor(seq, step)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                          >
                            <span className="font-medium text-slate-400">#{step.step_number}</span>
                            {step.delay_days}d • {step.subject.length > 20 ? step.subject.slice(0, 20) + "…" : step.subject}
                          </button>
                          {i < arr.length - 1 && (
                            <div className="flex items-center text-slate-300">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3">
                    <button
                      onClick={() => openStepEditor(seq)}
                      className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      + Add step
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Sequence Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Sequence">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Standard Reminder Sequence" required />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Friendly reminder at 3 days, urgent at 7 days" />
          <Select
            label="Applies to"
            value={form.applies_to_status}
            onChange={(e) => setForm({ ...form, applies_to_status: e.target.value })}
            options={[{ value: "sent", label: "Sent invoices" }, { value: "overdue", label: "Overdue invoices" }]}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Create</Button>
          </div>
        </form>
      </Modal>

      {/* Step Editor Modal */}
      <Modal open={stepModalOpen} onClose={() => { setStepModalOpen(false); setEditingStep(null); }} title={editingStep ? "Edit Step" : "Add Step"} size="lg">
        <form onSubmit={saveStep} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Step Number"
              type="number"
              value={String(stepForm.step_number)}
              onChange={(e) => setStepForm({ ...stepForm, step_number: parseInt(e.target.value) || 1 })}
              min={1}
            />
            <Input
              label="Delay (days after due)"
              type="number"
              value={String(stepForm.delay_days)}
              onChange={(e) => setStepForm({ ...stepForm, delay_days: parseInt(e.target.value) || 3 })}
              min={1}
            />
          </div>
          <Input
            label="Email Subject"
            value={stepForm.subject}
            onChange={(e) => setStepForm({ ...stepForm, subject: e.target.value })}
            placeholder="Gentle reminder: Invoice is due"
            required
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Body</label>
            <textarea
              value={stepForm.body_text}
              onChange={(e) => setStepForm({ ...stepForm, body_text: e.target.value })}
              rows={5}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              placeholder={"Hi {{client_name}},\n\nThis is a reminder about your invoice of ${{amount}}.\n\nPay here: {{payment_link}}\n\nThanks!"}
              required
            />
            <p className="text-xs text-slate-400 mt-1">Use {'{{client_name}}'}, {'{{amount}}'}, {'{{payment_link}}'} as placeholders</p>
          </div>
          <Select
            label="Action"
            value={stepForm.action}
            onChange={(e) => setStepForm({ ...stepForm, action: e.target.value })}
            options={[
              { value: "send_email", label: "Send email only" },
              { value: "mark_overdue", label: "Mark as overdue only" },
              { value: "send_email_and_mark_overdue", label: "Send email & mark overdue" },
            ]}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setStepModalOpen(false); setEditingStep(null); }}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editingStep ? "Save Step" : "Add Step"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
