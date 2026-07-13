import { type HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
        variant === "default" && "border-transparent bg-accent text-white hover:bg-accent-hover",
        variant === "secondary" && "border-transparent bg-muted-light text-foreground hover:bg-muted",
        variant === "destructive" && "border-transparent bg-red-500 text-white hover:bg-red-600",
        variant === "outline" && "text-text-primary border-ui",
        className
      )}
      {...props}
    />
  )
}

export { Badge }
