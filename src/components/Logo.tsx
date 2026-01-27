import * as React from "react";
import { cn } from "@/lib/utils";

export const Logo = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("h-6 w-6", className)}
    {...props}
  >
    <defs>
      <linearGradient
        id="logoGradient"
        x1="0"
        y1="0"
        x2="32"
        y2="32"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="hsl(var(--primary))" />
        <stop offset="1" stopColor="hsl(300, 87%, 60%)" />
      </linearGradient>
    </defs>
    <path
      d="M23 16L17 14V10C17 8.89543 16.1046 8 15 8H8C6.89543 8 6 8.89543 6 10V18C6 19.1046 6.89543 20 8 20H15C16.1046 20 17 19.1046 17 18V16"
      stroke="url(#logoGradient)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 16L15 18V22C15 23.1046 15.8954 24 17 24H24C25.1046 24 26 23.1046 26 22V14C26 12.8954 25.1046 12 24 12H17C15.8954 12 15 12.8954 15 14V16"
      stroke="url(#logoGradient)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
