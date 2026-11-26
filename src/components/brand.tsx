export function ShieldMark({ size = 40 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size * 1.15} viewBox="0 0 40 46" fill="none">
      <path d="M20 2L37 8v14c0 11-7.5 18.5-17 22C10.5 40.5 3 33 3 22V8z" stroke="#C9A04B" strokeWidth="2.2" />
      <path d="M20 7l12 4.3V22c0 8-5.2 13.6-12 16.4C13.2 35.6 8 30 8 22V11.3z" stroke="#C9A04B" strokeWidth="1.2" />
      <text x="20" y="27" textAnchor="middle" fontFamily="Marcellus, serif" fontSize="12" fill="#C9A04B">
        AR
      </text>
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex flex-col leading-none" dir="ltr">
      <span className="font-display text-[22px] tracking-[0.08em] text-gold-light">ALNAJAAR</span>
      <span className="mt-1 text-[10px] tracking-[0.4em] text-gold">SHEETS</span>
    </span>
  );
}

type IconProps = { className?: string };

export const CheckIcon = ({ className = "size-4" }: IconProps) => (
  <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l5 5L20 7" />
  </svg>
);

export const BagIcon = ({ className = "size-[22px]" }: IconProps) => (
  <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 7h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 7z" />
    <path d="M9 7a3 3 0 0 1 6 0" />
  </svg>
);

export const ImagePlaceholder = ({ label }: { label: string }) => (
  <div className="flex size-full items-center justify-center bg-linen-2 text-sm text-muted">
    <span className="font-display text-2xl text-line-2" aria-hidden="true">
      AR
    </span>
    <span className="sr-only">{label}</span>
  </div>
);
