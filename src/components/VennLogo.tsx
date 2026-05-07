type Props = { size?: number; className?: string };

export default function VennLogo({ size = 24, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ borderRadius: '7px', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="venn-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="7" fill="url(#venn-grad)" />
      <circle cx="12" cy="16" r="8" fill="white" fillOpacity="0.85" />
      <circle cx="20" cy="16" r="8" fill="white" fillOpacity="0.85" />
    </svg>
  );
}
