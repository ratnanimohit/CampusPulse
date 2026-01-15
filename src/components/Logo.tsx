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
      d="M191.4,23.3H64.6C41.3,23.3,23.3,41.3,23.3,64.6v126.8c0,23.3,18,41.3,41.3,41.3h126.8c23.3,0,41.3-18,41.3-41.3V64.6 C232.7,41.3,214.7,23.3,191.4,23.3z M183.1,140.8l-30.3,18.3c-1.8,1.1-3.9,1.7-6,1.7c-2.1,0-4.2-0.6-6-1.7l-26.6-16 c-3.4-2-5.5-5.7-5.5-9.6v-1.8l-12.7-7.6c-3.4-2-5.5-5.7-5.5-9.6v-12.9c0-3.9,2.1-7.5,5.5-9.6l26.6-16c3.4-2,7.5-2,10.9,0 l12.7,7.6v-1.8c0-3.9,2.1-7.5,5.5-9.6l26.6-16c3.4-2,7.5-2,10.9,0l18.8,11.3c3.4,2,5.5,5.7,5.5,9.6v45.8 C201.9,132.3,188.6,138.1,183.1,140.8z M184.9,93.5l-15.1-9.1l-26.6,16c-3.4,2-5.5,5.7-5.5,9.6v1.8l12.7,7.6c3.4,2,7.5,2,10.9,0 l26.6-16c3.4-2,5.5-5.7,5.5-9.6V93.5z M125.1,144.3l26.6-16c3.4-2,5.5-5.7,5.5-9.6V97.3l-10.9,6.5l-26.6,16 c-3.4,2-7.5,2-10.9,0l-12.7-7.6v12.9c0,3.9,2.1,7.5,5.5,9.6L125.1,144.3z"
    />
  </svg>
)

    