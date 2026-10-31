"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

interface ClassView {
  id: string;
  name: string;
  arms: { id: string; name: string; studentCount: number }[];
}

export function ClassManager({
  classes,
  subjects,
  teachers = [],
}: {
  classes: ClassView[];
  subjects: { id: string; name: string }[];
  teachers?: { id: string; label: string }[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [newClass, setNewClass] = useState({ name: "", order: 0 });
  const [newArm, setNewArm] = useState({ schoolClassId: "", name: "" });
  const [newSubject, setNewSubject] = useState({ subjectName: "", code: "" });
  const [assign, setAssign] = useState({
    armId: "",
    subjectId: "",
    teacherId: "",
    asClassTeacher: false,
  });
  const [promote, setPromote] = useState({ fromArmId: "", toArmId: "" });
  const [confirm, setConfirm] = useState<{
    kind: "class" | "arm" | "subject";
    id: string;
    label: string;
  } | null>(null);
  const [classFilter, setClassFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");

  const allArms = classes.flatMap((c) => c.arms.map((a) => ({ ...a, className: c.name })));
  const qClass = classFilter.trim().toLowerCase();
  const qSubject = subjectFilter.trim().toLowerCase();
  const visibleClasses = qClass
    ? classes.filter((cl) => cl.name.toLowerCase().includes(qClass))
    : classes;
  const visibleSubjects = qSubject
    ? subjects.filter((s) => s.name.toLowerCase().includes(qSubject))
    : subjects;

  async function post(body: object) {
    const res = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  }

  async function del(kind: "class" | "arm" | "subject", id: string) {
    setBusy(true);
    const res = await fetch("/api/classes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    setConfirm(null);
    if (!res.ok) {
      toast(data.error || "Delete failed", "error");
      return;
    }
    toast("Deleted", "success");
    router.refresh();
  }

  async function rename(kind: "class" | "arm" | "subject", id: string, current: string) {
    const next = window.prompt(
      kind === "subject" ? "New subject name" : kind === "arm" ? "New arm name" : "New class name",
      current
    );
    if (next == null) return;
    const name = next.trim();
    if (!name || name === current) return;
    setBusy(true);
    const action =
      kind === "subject" ? "rename_subject" : kind === "arm" ? "rename_arm" : "rename_class";
    const res = await fetch("/api/classes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, id, name }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      toast(data.error || "Rename failed", "error");
      return;
    }
    toast("Renamed", "success");
    router.refresh();
  }

  async function addClass() {
    if (!newClass.name.trim()) return;
    setBusy(true);
    const { ok, data } = await post(newClass);
    setBusy(false);
    if (!ok) {
      toast(data.error || "Failed to add class", "error");
      return;
    }
    toast("Class added", "success");
    setNewClass({ name: "", order: 0 });
    router.refresh();
  }

  async function addArm() {
    if (!newArm.schoolClassId || !newArm.name.trim()) return;
    setBusy(true);
    const { ok, data } = await post(newArm);
    setBusy(false);
    if (!ok) {
      toast(data.error || "Failed to add arm", "error");
      return;
    }
    toast("Arm added", "success");
    setNewArm({ schoolClassId: "", name: "" });
    router.refresh();
  }

  async function addSubject() {
    if (!newSubject.subjectName.trim()) return;
    setBusy(true);
    const { ok, data } = await post({
      subjectName: newSubject.subjectName.trim(),
      code: newSubject.code.trim() || undefined,
    });
    setBusy(false);
    if (!ok) {
      toast(data.error || "Failed to add subject", "error");
      return;
    }
    toast(`Subject "${data.subject?.name || newSubject.subjectName}" added`, "success");
    setNewSubject({ subjectName: "", code: "" });
    router.refresh();
  }

  async function assignSubject() {
    if (!assign.armId || !assign.subjectId) return;
    setBusy(true);
    const body: Record<string, unknown> = {
      armId: assign.armId,
      subjectId: assign.subjectId,
    };
    if (assign.teacherId) {
      body.teacherId = assign.teacherId;
      body.asClassTeacher = assign.asClassTeacher;
    }
    const { ok, data } = await post(body);
    setBusy(false);
    if (!ok) {
      toast(data.error || "Failed to assign subject", "error");
      return;
    }
    toast("Subject assigned" + (assign.teacherId ? " · teacher linked" : ""), "success");
    setAssign({ armId: "", subjectId: "", teacherId: "", asClassTeacher: false });
    router.refresh();
  }

  async function runPromotion() {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/classes/promote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(promote),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      toast(`Promoted ${data.promoted} students`, "success");
      setMessage(`Promoted ${data.promoted} students.`);
    } else {
      toast(data.error || "Promotion failed", "error");
      setMessage(data.error);
    }
    router.refresh();
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-4">
        <div className="ledger-block">
          <h3 className="font-serif text-lg mb-2">Classes catalogue</h3>
          <input
            type="search"
            placeholder="Filter classes…"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full border border-line px-3 py-2 text-sm bg-white rounded-lg mb-3"
          />
          {visibleClasses.length === 0 && classFilter.trim() && (
            <p className="text-sm text-ink/50 mb-2">No classes match “{classFilter}”.</p>
          )}
          {classes.length === 0 && (
            <p className="text-sm text-ink/50">No classes yet. Add JSS 1, SSS 1, etc. on the right.</p>
          )}
          <div className="space-y-3">
            {visibleClasses.map((c) => {
              const totalStudents = c.arms.reduce((n, a) => n + a.studentCount, 0);
              return (
                <div key={c.id} className="rounded-lg border border-line px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-medium">{c.name}</h4>
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => rename("class", c.id, c.name)}
                        className="text-xs text-navy border border-navy/30 px-2 py-1 hover:bg-navy/5 disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setConfirm({ kind: "class", id: c.id, label: c.name })}
                        className="text-xs text-brick border border-brick/40 px-2 py-1 hover:bg-brick hover:text-paper disabled:opacity-50"
                        title={
                          totalStudents > 0
                            ? "Blocked while students are assigned"
                            : "Delete empty class"
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <ul className="text-sm space-y-1">
                    {c.arms.map((a) => (
                      <li key={a.id} className="flex justify-between items-center gap-2">
                        <span>
                          Arm {a.name}
                          <span className="text-ink/50 ml-2">{a.studentCount} students</span>
                        </span>
                        <span className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => rename("arm", a.id, a.name)}
                            className="text-[11px] text-navy/80 underline hover:text-navy disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              setConfirm({
                                kind: "arm",
                                id: a.id,
                                label: `${c.name} · ${a.name}`,
                              })
                            }
                            className="text-[11px] text-brick/80 underline hover:text-brick disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </span>
                      </li>
                    ))}
                    {c.arms.length === 0 && <li className="text-ink/50">No arms yet.</li>}
                  </ul>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-ink/50 mt-3">
            Create classes, then add arms (A, B…). Assign subjects and teachers after.
          </p>
        </div>

        <div className="ledger-block">
          <h3 className="font-serif text-lg mb-2">Subjects catalogue</h3>
          {subjects.length === 0 ? (
            <p className="text-sm text-ink/50">No subjects yet. Add English, Maths, etc. on the right.</p>
          ) : (
            <>
              <input
                type="search"
                placeholder="Filter subjects…"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="w-full border border-line px-3 py-2 text-sm bg-white rounded-lg mb-2"
              />
              {visibleSubjects.length === 0 ? (
                <p className="text-sm text-ink/50">No subjects match “{subjectFilter}”.</p>
              ) : (
                <ul className="text-sm space-y-1 max-h-80 overflow-y-auto">
                  {visibleSubjects.map((s) => (
                    <li
                      key={s.id}
                      className="border border-line px-2 py-1.5 flex items-center justify-between gap-2"
                    >
                      <span className="min-w-0 truncate">{s.name}</span>
                      <span className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => rename("subject", s.id, s.name)}
                          className="text-[11px] text-navy/80 underline hover:text-navy disabled:opacity-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setConfirm({ kind: "subject", id: s.id, label: s.name })}
                          className="text-[11px] text-brick/80 underline hover:text-brick disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
          <p className="text-xs text-ink/50 mt-3">
            Assign a subject to an arm and pick a <strong>teacher</strong> so their portal and timetable
            fill. Delete is blocked if scores exist.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {confirm && (
          <div className="ledger-block border-brick/40 bg-brick/5 space-y-2 text-sm">
            <p className="text-ink/80">
              Delete <strong>{confirm.label}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => del(confirm.kind, confirm.id)}
                className="bg-brick text-paper px-3 py-1.5 disabled:opacity-50"
              >
                {busy ? "…" : "Confirm delete"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirm(null)}
                className="underline text-ink/60"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="ledger-block">
          <h3 className="font-serif mb-2">Add Subject</h3>
          <input
            value={newSubject.subjectName}
            onChange={(e) => setNewSubject((s) => ({ ...s, subjectName: e.target.value }))}
            placeholder="e.g. English Language"
            className="w-full border border-line px-3 py-2 text-sm mb-2"
          />
          <input
            value={newSubject.code}
            onChange={(e) => setNewSubject((s) => ({ ...s, code: e.target.value }))}
            placeholder="Code (optional) e.g. ENG"
            className="w-full border border-line px-3 py-2 text-sm mb-2"
          />
          <button
            type="button"
            onClick={addSubject}
            disabled={busy || !newSubject.subjectName.trim()}
            className="bg-navy text-paper text-sm px-4 py-2 w-full disabled:opacity-50"
          >
            Add subject
          </button>
        </div>

        <div className="ledger-block">
          <h3 className="font-serif mb-2">Assign subject to arm</h3>
          <select
            value={assign.armId}
            onChange={(e) => setAssign((s) => ({ ...s, armId: e.target.value }))}
            className="w-full border border-line px-3 py-2 text-sm mb-2"
          >
            <option value="">Select arm...</option>
            {allArms.map((a) => (
              <option key={a.id} value={a.id}>
                {a.className} {a.name}
              </option>
            ))}
          </select>
          <select
            value={assign.subjectId}
            onChange={(e) => setAssign((s) => ({ ...s, subjectId: e.target.value }))}
            className="w-full border border-line px-3 py-2 text-sm mb-2"
          >
            <option value="">Select subject...</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={assign.teacherId}
            onChange={(e) => setAssign((s) => ({ ...s, teacherId: e.target.value }))}
            className="w-full border border-line px-3 py-2 text-sm mb-2"
          >
            <option value="">Teacher (optional)...</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-xs text-ink/70 mb-2">
            <input
              type="checkbox"
              checked={assign.asClassTeacher}
              onChange={(e) => setAssign((s) => ({ ...s, asClassTeacher: e.target.checked }))}
              disabled={!assign.teacherId}
            />
            Also set as class teacher for this arm
          </label>
          {teachers.length === 0 && (
            <p className="text-[11px] text-amber-800/80 mb-2">
              No teaching staff yet. Add a staff member with category Teaching / role TEACHER first.
            </p>
          )}
          <button
            type="button"
            onClick={assignSubject}
            disabled={busy || !assign.armId || !assign.subjectId}
            className="bg-navy text-paper text-sm px-4 py-2 w-full disabled:opacity-50"
          >
            Assign to arm
          </button>
        </div>

        <div className="ledger-block">
          <h3 className="font-serif mb-2">Add Class</h3>
          <input
            value={newClass.name}
            onChange={(e) => setNewClass((s) => ({ ...s, name: e.target.value }))}
            placeholder="e.g. JSS 1"
            className="w-full border border-line px-3 py-2 text-sm mb-2"
          />
          <button
            type="button"
            onClick={addClass}
            disabled={busy}
            className="bg-navy text-paper text-sm px-4 py-2 w-full disabled:opacity-50"
          >
            Add
          </button>
        </div>
        <div className="ledger-block">
          <h3 className="font-serif mb-2">Add Arm</h3>
          <select
            value={newArm.schoolClassId}
            onChange={(e) => setNewArm((s) => ({ ...s, schoolClassId: e.target.value }))}
            className="w-full border border-line px-3 py-2 text-sm mb-2"
          >
            <option value="">Select class...</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            value={newArm.name}
            onChange={(e) => setNewArm((s) => ({ ...s, name: e.target.value }))}
            placeholder="e.g. A"
            className="w-full border border-line px-3 py-2 text-sm mb-2"
          />
          <button
            type="button"
            onClick={addArm}
            disabled={busy}
            className="bg-navy text-paper text-sm px-4 py-2 w-full disabled:opacity-50"
          >
            Add
          </button>
        </div>
        <div className="ledger-block">
          <h3 className="font-serif mb-2">Promote Class (1-click)</h3>
          <select
            value={promote.fromArmId}
            onChange={(e) => setPromote((s) => ({ ...s, fromArmId: e.target.value }))}
            className="w-full border border-line px-3 py-2 text-sm mb-2"
          >
            <option value="">From arm...</option>
            {allArms.map((a) => (
              <option key={a.id} value={a.id}>
                {a.className} {a.name} ({a.studentCount})
              </option>
            ))}
          </select>
          <select
            value={promote.toArmId}
            onChange={(e) => setPromote((s) => ({ ...s, toArmId: e.target.value }))}
            className="w-full border border-line px-3 py-2 text-sm mb-2"
          >
            <option value="">To arm...</option>
            {allArms.map((a) => (
              <option key={a.id} value={a.id}>
                {a.className} {a.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={runPromotion}
            disabled={busy}
            className="bg-gold-dark text-paper text-sm px-4 py-2 w-full disabled:opacity-50"
          >
            Promote All Active Students
          </button>
          {message && <p className="text-xs text-sage mt-2">{message}</p>}
        </div>
      </div>
    </div>
  );
}
