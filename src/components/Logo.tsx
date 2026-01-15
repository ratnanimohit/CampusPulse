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
      d="M216,80H40a8,8,0,0,0-8,8V184a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V88A8,8,0,0,0,216,80ZM48,176V96H92.4l15-37.6a8,8,0,0,1,14.5.1L137,96h25.4l12.7-25.4a8,8,0,0,1,13.8,6.9L184.4,96H208v80H48Z"
    />
  </svg>
)
