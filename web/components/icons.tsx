// A small authored icon set in one consistent stroke (1.75, round joins) so
// the nav reads as one drawn system rather than a mixed icon-library grab
// bag. These are structural marks, not status — status lives in StateDot's
// filled circle only.

import type { SVGProps } from "react";

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function OverviewIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="0.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="0.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="0.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="0.5" />
    </svg>
  );
}

export function StudentsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5 20c0-3.6 3.13-6.5 7-6.5s7 2.9 7 6.5" />
    </svg>
  );
}

export function TicketsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h11A2.5 2.5 0 0 1 20 8.5v1a2 2 0 0 0 0 4v1a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 14.5v-1a2 2 0 0 0 0-4v-1Z" />
      <path d="M9.5 6v12" strokeDasharray="1.5 2.5" />
    </svg>
  );
}

export function SessionsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M5 6.5h14v8.5a1 1 0 0 1-1 1H9l-4 3v-3H5a1 1 0 0 1-1-1V7.5a1 1 0 0 1 1-1Z" />
      <path d="M8 10h8M8 13h5" />
    </svg>
  );
}

export function ReportsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5v6" />
      <path d="M12 9.5 7 14M12 9.5l5 4.5" />
      <circle cx="12" cy="3.5" r="1.75" />
      <circle cx="7" cy="15.5" r="1.75" />
      <circle cx="17" cy="15.5" r="1.75" />
      <path d="M7 17.25V19M17 17.25V19" />
    </svg>
  );
}

export function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} width={16} height={16} {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} width={14} height={14} {...props}>
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} width={16} height={16} {...props}>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m15 15 4.5 4.5" />
    </svg>
  );
}

export function SignOutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} width={18} height={18} {...props}>
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
      <path d="M13 16l4-4-4-4" />
      <path d="M17 12H9" />
    </svg>
  );
}

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} width={16} height={16} {...props}>
      <path d="M5 12.5 9.5 17 19 6.5" />
    </svg>
  );
}
