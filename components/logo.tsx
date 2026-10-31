export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-serif text-xl tracking-tight ${className}`}>
      <svg viewBox="0 0 32 32" aria-hidden="true" className="h-8 w-8">
        <rect width="32" height="32" rx="10" fill="#0f6e68" />
        <path
          d="M8 21.5 16 9l8 12.5"
          fill="none"
          stroke="#f3efe6"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path d="M11.2 21.5h9.6" stroke="#f3efe6" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      Cleaning Twin
    </span>
  )
}
