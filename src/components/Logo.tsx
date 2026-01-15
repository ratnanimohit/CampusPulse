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
        <stop offset="100%" style={{ stopColor: 'hsl(300, 87%, 60%)', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path 
      fill="url(#logoGradient)" 
      d="M128,24A104,104,0,1,0,232,128,104.1,104.1,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216ZM184.2,160.8a8,8,0,0,1-10.6,1.4L152,148.1l-14.8,25.8a8,8,0,0,1-13.8-8l18.5-32.3a7.9,7.9,0,0,1,10.1-3.3L176,140.7,182.6,150A8,8,0,0,1,184.2,160.8ZM88,80a8,8,0,0,1,8-8h56a8,8,0,0,1,0,16H96A8,8,0,0,1,88,80Z"
    />
  </svg>
)
