import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-95",
          variant === "default" && "bg-gradient-to-r from-violet-600 to-indigo-400 hover:from-violet-700 hover:to-indigo-500 text-white shadow-sm",
          variant === "destructive" && "bg-red-500 text-white hover:bg-red-600",
          variant === "outline" && "border border-border-ui bg-bg-primary hover:bg-bg-card hover:text-accent-primary",
          variant === "secondary" && "bg-text-muted-light/20 text-text-primary hover:bg-text-muted-light/30",
          variant === "ghost" && "hover:bg-bg-card hover:text-accent-primary",
          variant === "link" && "text-accent-primary underline-offset-4 hover:underline",
          size === "default" && "h-10 px-4 py-2",
          size === "sm" && "h-9 rounded-md px-3",
          size === "lg" && "h-11 rounded-md px-8",
          size === "icon" && "h-10 w-10",
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
