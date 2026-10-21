/**
 * Branded loading indicator — gold arc on navy ring (KMS palette).
 * Use in buttons and inline async actions.
 */
export function BrandSpinner({
  size = 16,
  className = "",
  label = "Loading",
}: {
  size?: number;
  className?: string;
  /** Accessible label for screen readers */
  label?: string;
}) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="animate-spin"
        aria-hidden
      >
        {/* Track — navy / muted */}
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeOpacity="0.2"
          strokeWidth="3"
        />
        {/* Arc — brand gold */}
        <path
          d="M12 3a9 9 0 0 1 9 9"
          stroke="#c9a227"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Compact button content: spinner + label while pending */
export function BrandLoadingLabel({
  loading,
  idleLabel,
  loadingLabel = "Loading…",
  color,
}: {
  loading: boolean;
  idleLabel: string;
  loadingLabel?: string;
  /** Optional text color while loading */
  color?: string;
}) {
  if (!loading) return <>{idleLabel}</>;
  return (
    <span className="inline-flex items-center gap-2" style={color ? { color } : undefined}>
      <BrandSpinner size={14} label={loadingLabel} />
      <span>{loadingLabel}</span>
    </span>
  );
}
