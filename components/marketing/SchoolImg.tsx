"use client";

/** Marketing image with automatic fallback to default kms-home asset. */
export function SchoolImg({
  src,
  fallback,
  alt,
  className,
}: {
  src: string;
  fallback: string;
  alt: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        const el = e.currentTarget;
        if (el.dataset.fb === "1") return;
        el.dataset.fb = "1";
        el.src = fallback;
      }}
    />
  );
}
