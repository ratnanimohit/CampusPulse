import * as React from "react"
import { cn } from "@/lib/utils"

export const Logo = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
    width="24"
    height="24"
    className={cn("h-6 w-6", className)}
    {...props}
  >
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: 'hsl(33, 97%, 60%)', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path 
      fill="url(#logoGradient)" 
      d="M216 28H40C33.373 28 28 33.373 28 40v176c0 6.627 5.373 12 12 12h176c6.627 0 12-5.373 12-12V40c0-6.627-5.373-12-12-12zm-35.151 61.151c-12.518-12.518-32.849-12.518-45.367 0l-30.633 30.633a9 9 0 0 0 0 12.728l12.728 12.728a9 9 0 0 0 12.728 0l4.242-4.242-20.15-20.15c-3.515-3.515-3.515-9.213 0-12.728s9.213-3.515 12.728 0l20.15 20.15 4.243-4.243a9 9 0 0 0 0-12.728l-4.95-4.95 24.042-24.042c4.686-4.686 12.284-4.686 16.97 0 4.687 4.686 4.687 12.284 0 16.97l-24.041 24.041-4.95-4.95a9 9 0 0 0-12.728 0l-4.242 4.242 20.15 20.15c3.515 3.515 3.515 9.213 0 12.728s-9.213 3.515-12.728 0l-20.15-20.15-4.242 4.242a9 9 0 0 0 0 12.728l12.728 12.728a9 9 0 0 0 12.728 0l30.633-30.633c12.518-12.519 12.518-32.85 0-45.368z"
    />
  </svg>
)
