import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: LucideIcon
  label: string
}

export function Chip({ className, icon: Icon, label, type = "button", style, ...props }: ChipProps) {
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  const handlePressStart = () => {
    if (buttonRef.current) {
      buttonRef.current.style.transform = "scale(0.97)"
    }
  }

  const handlePressEnd = () => {
    if (buttonRef.current) {
      buttonRef.current.style.transform = "scale(1)"
    }
  }

  return (
    <button
      ref={buttonRef}
      type={type}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      className={cn(
        "py-2 px-3 flex items-center gap-2 bg-[#EBEBEB]/84 backdrop-blur-xl text-sm font-normal text-[#888888] rounded-full group cursor-pointer hover:bg-[#EBEBEB] hover:text-foreground select-none border-none outline-none transition-transform duration-150 ease-out",
        className
      )}
      style={{
        transform: "scale(1)",
        ...style
      }}
      {...props}
    >
      {Icon && <Icon size={16} className="shrink-0" />}
      <span className="text-sm text-foreground">{label}</span>
    </button>
  )
}
