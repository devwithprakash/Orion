export function OrionLogo({ className = "size-8" }: { className?: string }) {
  return (
    <div className={`${className} relative rounded-lg bg-primary flex items-center justify-center shadow-glow`}>
      <svg viewBox="0 0 24 24" className="size-1/2 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="3" fill="currentColor" />
        <path d="M5 8 L8 5" opacity="0.7" />
        <path d="M19 8 L16 5" opacity="0.7" />
        <path d="M5 16 L8 19" opacity="0.7" />
      </svg>
    </div>
  );
}
