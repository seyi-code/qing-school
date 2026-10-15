"use client";

import { useState, InputHTMLAttributes, forwardRef } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  /** Extra classes on the outer relative wrapper */
  wrapperClassName?: string;
};

/**
 * Password field with show/hide (eye) control.
 * Use anywhere we collect a password so users can verify typing on mobile.
 */
export const PasswordInput = forwardRef<HTMLInputElement, Props>(
  function PasswordInput({ className = "", wrapperClassName = "", ...rest }, ref) {
    const [show, setShow] = useState(false);

    return (
      <div className={`relative ${wrapperClassName}`}>
        <input
          ref={ref}
          type={show ? "text" : "password"}
          className={`${className} pr-11`}
          {...rest}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          onClick={() => setShow((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-[#627184] hover:text-[#12345a] hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b8923f]"
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    );
  }
);

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 3l18 18M10.6 10.6A3 3 0 0012 15a3 3 0 002.4-4.4M9.5 5.2A11 11 0 0112 5c6.5 0 10 7 10 7a18 18 0 01-4.2 4.8M6.3 6.3A18 18 0 002 12s3.5 7 10 7a11 11 0 004.2-.8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
