"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "loading" | "success" | "error";

export function NewsletterSignup({ variant = "footer" }: { variant?: "footer" | "inline" }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Please try again.");
        return;
      }
      setStatus("success");
      setMessage(data.message || "Thanks for subscribing!");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  const isFooter = variant === "footer";

  return (
    <div className={isFooter ? "" : "w-full max-w-md"}>
      <h3
        className={
          isFooter
            ? "text-white font-bold text-sm mb-2"
            : "text-sm font-bold text-[#12345a] dark:text-[#e8eef5] mb-2"
        }
      >
        Newsletter
      </h3>
      <p
        className={
          isFooter
            ? "text-sm text-[#a8b8c9] mb-3"
            : "text-sm text-[#627184] dark:text-[#9aabbc] mb-3"
        }
      >
        School updates, notices and event reminders — straight to your inbox.
      </p>
      <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status !== "idle" && status !== "loading") setStatus("idle");
          }}
          disabled={status === "loading"}
          className={`flex-1 min-w-0 rounded-lg px-3 py-2.5 text-sm border outline-none focus:ring-2 focus:ring-[#d2ae3b]/50 ${
            isFooter
              ? "bg-white/10 border-white/20 text-white placeholder:text-white/40"
              : "bg-white dark:bg-[#0f1c2e] border-[#e3e8ed] dark:border-white/15 text-[#1e2e43] dark:text-[#e8eef5] placeholder:text-[#9aabbc]"
          }`}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="shrink-0 rounded-lg bg-[#b3234b] hover:brightness-95 disabled:opacity-60 text-white text-sm font-extrabold px-4 py-2.5"
        >
          {status === "loading" ? "Joining…" : "Subscribe"}
        </button>
      </form>
      {message && (
        <p
          role="status"
          className={`mt-2 text-xs ${
            status === "success"
              ? isFooter
                ? "text-[#8fd4a0]"
                : "text-sage"
              : isFooter
                ? "text-[#f5a8b5]"
                : "text-brick"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
