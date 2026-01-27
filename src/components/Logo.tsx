import * as React from "react"
import { cn } from "@/lib/utils"

export const Logo = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("h-6 w-6", className)}
    {...props}
  >
    <defs>
      <linearGradient id="logoGradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop stopColor="hsl(var(--primary))"/>
        <stop offset="1" stopColor="hsl(300, 87%, 60%)" />
      </linearGradient>
    </defs>
    <rect x="3" y="3" width="26" height="26" rx="6" stroke="url(#logoGradient)" strokeWidth="3" />
    <path 
        d="M10 15L14 19L18 15"
        stroke="url(#logoGradient)" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
    />
    <path 
        d="M10 15V20.5C10 21.3284 10.6716 22 11.5 22H12.5"
        stroke="url(#logoGradient)" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
    />
    <path 
        d="M18 15V20.5C18 21.3284 17.3284 22 16.5 22H15.5"
        stroke="url(#logoGradient)" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
    />
    <path 
        d="M10 15L13 12M18 15L15 12"
        stroke="url(#logoGradient)" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
    />
  </svg>
)
