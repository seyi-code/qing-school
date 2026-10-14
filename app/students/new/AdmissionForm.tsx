"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ArmOpt = { id: string; label: string };
type Dup = {
  id: string;
  admissionNumber: string;
  name: string;
  status: string;
  class: string;
};

function Field({
  label,
  name,
  required,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink/70 mb-1">
        {label}
        {required ? <span className="text-brick"> *</span> : null}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full border border-line px-3 py-2 text-sm bg-white rounded-md"
      />
    </div>
  );
}

export function AdmissionForm({ arms }: { arms: ArmOpt[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<Dup[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<Record<string, unknown> | null>(null);

  async function submit(payload: Record<string, unknown>, forceAdmit = false) {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, forceAdmit }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (res.status === 409 && data.code === "DUPLICATE_NAME") {
      setDuplicates(data.duplicates || []);
      setPendingPayload(payload);
      setError(data.error);
      return;
    }
    if (!res.ok) {
      setError(data.error ?? "Could not admit student.");
      return;
    }
    router.push(`/students/${data.student.id}`);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setDuplicates([]);
    setPendingPayload(null);
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    await submit(payload, false);
  }

  return (
    <form onSubmit={handleSubmit} className="ledger-block space-y-4 rounded-xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="First name" name="firstName" required />
        <Field label="Last name" name="lastName" required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Other names" name="otherNames" />
        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1">Gender</label>
          <select name="gender" className="w-full border border-line px-3 py-2 text-sm bg-white rounded-md">
            <option value="">Select...</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Date of birth" name="dateOfBirth" type="date" />
        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1">Class / Arm</label>
          <select name="armId" className="w-full border border-line px-3 py-2 text-sm bg-white rounded-md">
            <option value="">Unassigned for now</option>
            {arms.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Guardian phone" name="guardianPhone" placeholder="0803..." />
        <Field
          label="Guardian email (for portal later)"
          name="guardianEmail"
          type="email"
          placeholder="parent@email.com"
        />
      </div>
      <Field label="Home address" name="address" />
      <Field label="Previous school" name="previousSchool" />
      <Field label="Medical / notes" name="medicalNotes" />

      {error && (
        <p className="text-sm text-brick border border-brick/30 bg-brick/5 px-3 py-2 rounded-md">
          {error}
        </p>
      )}

      {duplicates.length > 0 && (
        <div className="text-sm border border-gold/40 bg-gold/10 px-3 py-2 rounded-md space-y-2">
          <p className="font-medium">Possible duplicates</p>
          <ul className="list-disc pl-5 space-y-1">
            {duplicates.map((d) => (
              <li key={d.id}>
                {d.name} · {d.admissionNumber} · {d.class} · {d.status}
              </li>
            ))}
          </ul>
          {pendingPayload && (
            <button
              type="button"
              disabled={submitting}
              onClick={() => submit(pendingPayload, true)}
              className="mt-2 text-xs bg-navy text-paper px-3 py-1.5 rounded-md disabled:opacity-50"
            >
              Admit anyway
            </button>
          )}
        </div>
      )}

      <p className="text-xs text-ink/50">
        After admit, open the student and use <strong>Enable student portal login</strong> if they need
        email access. Guardian email is stored in notes for reference.
      </p>

      <button
        type="submit"
        disabled={submitting}
        className="bg-navy text-paper px-4 py-2.5 text-sm rounded-md hover:bg-navy-light disabled:opacity-50"
      >
        {submitting ? "Saving…" : "Admit student"}
      </button>
    </form>
  );
}
