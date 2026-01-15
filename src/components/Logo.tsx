import * as React from "react"
import { cn } from "@/lib/utils"

export const Logo = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("h-6 w-6", className)}
    {...props}
  >
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: 'hsl(300, 80%, 60%)', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path d="M0 0h24v24H0z" stroke="none" fill="none" />
    <path
      stroke="url(#logoGradient)"
      d="M5 18a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Z"
    />
    <path
      stroke="url(#logoGradient)"
      d="m10 15 1.5-1.5a2.6 2.6 0 0 1 3.5 0l2.5 2.5"
    />
    <path
      stroke="url(#logoGradient)"
      d="M15 14.5c1.5 1.5 2.5 3.5 2.5 5.5"
    />
    <path
      stroke="url(#logoGradient)"
      d="M4 21h16a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2Z"
    />
  </svg>
)
