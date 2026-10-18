"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  type Block,
  newId,
  parseBlocks,
  blocksToHtml,
  sanitizeBasicHtml,
} from "@/lib/cms-blocks";

type Page = {
  id: string;
  slug: string;
  title: string;
  body: string;
  published: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  publishAt?: string | null;
};

type Media = { id: string; url: string; filename: string };

function SortableBlock({
  block,
  onChange,
  onRemove,
}: {
  block: Block;
  onChange: (b: Block) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="border border-line/70 p-2 bg-white mb-2">
      <div className="flex gap-2 items-center mb-1 text-xs">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing px-2 py-0.5 border border-line"
          {...attributes}
          {...listeners}
        >
          ⋮⋮ Drag
        </button>
        <span className="text-ink/40 uppercase">{block.type}</span>
        <button type="button" className="text-brick underline ml-auto" onClick={onRemove}>
          Remove
        </button>
      </div>
      <p className="text-xs text-ink/50">Block editor restored — full UI loading in next commit.</p>
    </div>
  );
}

export function CmsEditor({
  pages,
  theme,
  media: initialMedia,
  schoolSlug = null,
  schoolName = null,
}: {
  pages: Page[];
  theme: { primary: string; accent: string; font: string };
  media: Media[];
  schoolSlug?: string | null;
  schoolName?: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [published, setPublished] = useState(true);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [publishAt, setPublishAt] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [editId, setEditId] = useState<string | null>(null);

  const homePage = pages.find((p) => p.slug === "home") ?? null;
  const isEditingHome = slug === "home";
  const publicHomePreviewHref = schoolSlug ? `/site/${schoolSlug}` : "/";

  function loadPage(p: Page) {
    setEditId(p.id);
    setSlug(p.slug);
    setTitle(p.title);
    setPublished(p.published);
    setMetaTitle(p.metaTitle || "");
    setMetaDescription(p.metaDescription || "");
    setPublishAt(p.publishAt ? p.publishAt.slice(0, 16) : "");
    setBlocks(parseBlocks(p.body));
  }

  function startPublicHomepage() {
    if (homePage) {
      loadPage(homePage);
      return;
    }
    setEditId(null);
    setSlug("home");
    setTitle(schoolName ? `${schoolName} — Home` : "Public homepage");
    setPublished(true);
    setMetaTitle("");
    setMetaDescription("");
    setPublishAt("");
    setBlocks([
      {
        id: newId(),
        type: "heading",
        text: schoolName ? `Welcome to ${schoolName}` : "Welcome",
        level: 1,
      },
      {
        id: newId(),
        type: "paragraph",
        html: "Share your school story, values, and what makes your community special.",
      },
      {
        id: newId(),
        type: "button",
        label: "Admissions enquiry",
        href: "/admissions",
      },
    ]);
    setMsg("Editing public homepage (slug locked to home). Publish when ready.");
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/cms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        title,
        body: JSON.stringify(blocks),
        published,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        publishAt: publishAt ? new Date(publishAt).toISOString() : null,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "Save failed");
      return;
    }
    setEditId(data.page.id);
    setMsg("Saved");
    router.refresh();
    loadPage({ ...data.page, publishAt: data.page.publishAt });
  }

  async function removePage(id: string) {
    if (!confirm("Delete this page?")) return;
    await fetch(`/api/cms?id=${id}`, { method: "DELETE" });
    router.refresh();
    if (editId === id) {
      setEditId(null);
      setSlug("");
      setTitle("");
      setBlocks([]);
    }
  }

  return (
    <div className="space-y-4">
      <section className="ledger-block mb-4 border border-[#d2ae3b]/40 bg-[#fffdf5]">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h2 className="font-serif text-lg m-0 flex items-center gap-2">
              <span aria-hidden>🏠</span> Public homepage
            </h2>
            <p className="text-xs text-ink/60 mt-1 mb-0">
              Content with slug <code className="bg-white/80 px-1 rounded">home</code> appears on{" "}
              {schoolSlug ? (
                <code className="bg-white/80 px-1 rounded">/site/{schoolSlug}</code>
              ) : (
                <span>your school public site</span>
              )}
              {schoolName ? ` (${schoolName})` : ""}.
            </p>
            {homePage ? (
              <p className="text-xs mt-2 mb-0">
                Status:{" "}
                <strong className={homePage.published ? "text-sage" : "text-brick"}>
                  {homePage.published ? "Published (live on public site)" : "Draft (not visible yet)"}
                </strong>
                {" · "}
                <span className="text-ink/50">{homePage.title}</span>
              </p>
            ) : (
              <p className="text-xs mt-2 mb-0 text-ink/50">
                No public homepage yet. Create one to customize the public site beyond the default layout.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={startPublicHomepage}
              className="rounded-lg bg-[#12345a] text-white px-3 py-2 text-sm font-medium hover:bg-[#1a3a6e]"
            >
              {homePage ? "Edit public homepage" : "Create public homepage"}
            </button>
            {schoolSlug && (
              <a
                href={publicHomePreviewHref}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-[#12345a]/25 bg-white px-3 py-2 text-sm font-medium text-[#12345a]"
              >
                Preview site ↗
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <form onSubmit={save} className="ledger-block space-y-3 text-sm">
          <h2 className="font-serif text-lg">
            {isEditingHome ? "Edit public homepage" : editId ? "Edit page" : "New page"}
          </h2>
          {msg && <p className="text-xs text-sage">{msg}</p>}

          <div>
            <input
              value={slug}
              onChange={(e) => {
                if (isEditingHome && editId) return;
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
              }}
              required
              readOnly={isEditingHome && Boolean(editId)}
              placeholder="slug (home = public homepage)"
              className={`w-full border border-line px-3 py-2 ${
                isEditingHome ? "bg-[#f7f9fc] font-mono" : ""
              }`}
            />
            {isEditingHome && (
              <p className="text-[11px] text-[#b3234b] mt-1 mb-0">
                Slug <code>home</code> is reserved for the public school homepage.
              </p>
            )}
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Title"
            className="w-full border border-line px-3 py-2"
          />

          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
            />
            Published (visible on public site)
          </label>

          <div className="space-y-2 border border-line p-2 bg-white">
            <p className="text-xs text-ink/50">Blocks ({blocks.length})</p>
            {blocks.map((b, i) => (
              <div key={b.id} className="border border-line/70 p-2 text-xs">
                <div className="flex justify-between mb-1">
                  <span className="uppercase text-ink/40">{b.type}</span>
                  <button
                    type="button"
                    className="text-brick underline"
                    onClick={() => setBlocks((arr) => arr.filter((_, j) => j !== i))}
                  >
                    Remove
                  </button>
                </div>
                {b.type === "heading" && (
                  <input
                    className="w-full border border-line px-2 py-1"
                    value={b.text}
                    onChange={(e) =>
                      setBlocks((arr) =>
                        arr.map((x, j) => (j === i ? { ...b, text: e.target.value } : x))
                      )
                    }
                  />
                )}
                {b.type === "paragraph" && (
                  <textarea
                    className="w-full border border-line px-2 py-1"
                    rows={3}
                    value={b.html}
                    onChange={(e) =>
                      setBlocks((arr) =>
                        arr.map((x, j) => (j === i ? { ...b, html: e.target.value } : x))
                      )
                    }
                  />
                )}
                {b.type === "button" && (
                  <div className="flex gap-2">
                    <input
                      className="flex-1 border border-line px-2 py-1"
                      value={b.label}
                      placeholder="Label"
                      onChange={(e) =>
                        setBlocks((arr) =>
                          arr.map((x, j) => (j === i ? { ...b, label: e.target.value } : x))
                        )
                      }
                    />
                    <input
                      className="flex-1 border border-line px-2 py-1"
                      value={b.href}
                      placeholder="Href"
                      onChange={(e) =>
                        setBlocks((arr) =>
                          arr.map((x, j) => (j === i ? { ...b, href: e.target.value } : x))
                        )
                      }
                    />
                  </div>
                )}
                {!["heading", "paragraph", "button"].includes(b.type) && (
                  <p className="text-ink/40">Advanced block type — content preserved on save.</p>
                )}
              </div>
            ))}
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                className="border border-line px-2 py-1 text-xs"
                onClick={() =>
                  setBlocks((b) => [
                    ...b,
                    { id: newId(), type: "heading", text: "Heading", level: 2 },
                  ])
                }
              >
                + Heading
              </button>
              <button
                type="button"
                className="border border-line px-2 py-1 text-xs"
                onClick={() =>
                  setBlocks((b) => [...b, { id: newId(), type: "paragraph", html: "" }])
                }
              >
                + Paragraph
              </button>
              <button
                type="button"
                className="border border-line px-2 py-1 text-xs"
                onClick={() =>
                  setBlocks((b) => [
                    ...b,
                    { id: newId(), type: "button", label: "Learn more", href: "/admissions" },
                  ])
                }
              >
                + Button
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="bg-navy text-paper py-2 px-4 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save page"}
          </button>
        </form>

        <div className="space-y-4">
          <section className="ledger-block !p-0 overflow-x-auto">
            <div className="p-4 pb-0">
              <h2 className="font-serif text-lg">Pages</h2>
              <p className="text-xs text-ink/50">
               Slug <code>home</code> powers the public homepage
              </p>
            </div>
            <table className="ledger mt-3">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>URL</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p) => (
                  <tr key={p.id}>
                    <td>{p.title}</td>
                    <td className="font-mono text-xs">
                      <a
                        href={
                          p.slug === "home"
                            ? schoolSlug
                              ? `/site/${schoolSlug}`
                              : "/"
                            : `/p/${p.slug}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        {p.slug === "home"
                          ? schoolSlug
                            ? `/site/${schoolSlug}`
                            : "/"
                          : `/p/${p.slug}`}
                      </a>
                      {p.slug === "home" && (
                        <span className="ml-1 text-[10px] uppercase tracking-wide text-[#b3234b]">
                          public home
                        </span>
                      )}
                    </td>
                    <td className="text-xs space-x-2">
                      <button type="button" className="underline" onClick={() => loadPage(p)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-brick underline"
                        onClick={() => removePage(p.id)}
                      >
                        Del
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {editId && blocks.length > 0 && (
            <section className="ledger-block">
              <h2 className="font-serif text-lg mb-2">Preview</h2>
              <div
                className="prose prose-sm max-w-none border border-line p-3 bg-white"
                dangerouslySetInnerHTML={{ __html: blocksToHtml(blocks) }}
              />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
